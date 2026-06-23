// Servidor Node (Contabo) — serve o build estático (landing + /acolhimento)
// e a API de acolhimento. Substitui a função serverless do Vercel.
// Mesma lógica de segurança de api/acolhimento.ts: crise ANTES do rate-limit.
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { readFileSync, existsSync } from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { detectCrisis, CRISIS_RESOURCES } from "../src/acolhimento/crisis";
import { ACOLHIMENTO_SYSTEM_PROMPT } from "../src/acolhimento/systemPrompt";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "..", "dist");
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Chave Gemini: env direta OU arquivo de Docker secret (GEMINI_API_KEY_FILE).
// Política VPS: segredo via Docker secret (external), lido por *_FILE — nunca texto puro.
function resolveGeminiKey(): string {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const f = process.env.GEMINI_API_KEY_FILE;
  if (f && existsSync(f)) return readFileSync(f, "utf8").trim();
  return "";
}
const GEMINI_KEY = resolveGeminiKey();

const app = express();
app.use(express.json({ limit: "256kb" }));

// rate-limit em memória (per-IP + teto diário) — protege custo do endpoint público.
const HITS = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
let dailyCount = 0;
let dailyResetAt = 0;
const MAX_PER_DAY = 500;

function rateLimited(ip: string, now: number): boolean {
  if (now > dailyResetAt) { dailyCount = 0; dailyResetAt = now + 86_400_000; }
  if (dailyCount >= MAX_PER_DAY) return true;
  const e = HITS.get(ip);
  if (!e || now > e.resetAt) { HITS.set(ip, { count: 1, resetAt: now + WINDOW_MS }); dailyCount++; return false; }
  if (e.count >= MAX_PER_WINDOW) return true;
  e.count++; dailyCount++; return false;
}

app.post("/api/acolhimento", async (req, res) => {
  const fwd = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(fwd) ? fwd[0] : (fwd || "").toString().split(",")[0].trim()) || req.socket.remoteAddress || "unknown";

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  if (messages.length > 40) { res.status(413).json({ error: "Conversa muito longa." }); return; }

  // Crise SEMPRE antes do rate-limit (não faz chamada à IA; usuário em crise nunca fica sem recurso).
  const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
  if (lastUser && detectCrisis(String(lastUser.content))) {
    res.status(200).json({ crisis: true, resources: CRISIS_RESOURCES });
    return;
  }

  if (rateLimited(ip, Date.now())) { res.status(429).json({ error: "Muitas mensagens. Tente em instantes." }); return; }
  if (!lastUser || messages.length === 0) { res.status(400).json({ error: "Mensagem vazia." }); return; }

  if (!GEMINI_KEY) { res.status(500).json({ error: "Serviço indisponível." }); return; }

  // Gemini: roles user/model (assistant -> model); systemInstruction = prompt de acolhimento.
  const contents = messages.slice(-12).map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content) }],
  }));
  // Gemini exige que o histórico comece com 'user'.
  while (contents.length && contents[0].role === "model") contents.shift();

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: ACOLHIMENTO_SYSTEM_PROMPT,
      generationConfig: { maxOutputTokens: 600 },
    });
    const result = await model.generateContentStream({ contents });
    for await (const chunk of result.stream) {
      const t = chunk.text();
      if (t) res.write(t);
    }
    res.end();
  } catch (e) {
    console.error("acolhimento error:", e);
    res.end("Desculpe, tive um problema agora. Se for urgente, ligue 188 (CVV).");
  }
});

// Estático + cleanUrls: /acolhimento -> acolhimento.html
app.get("/acolhimento", (_req, res) => res.sendFile(path.join(DIST, "acolhimento.html")));
app.use(express.static(DIST, { extensions: ["html"] }));
// Fallback SPA (Express 5: usar middleware final, não app.get("*"))
app.use((_req, res) => res.sendFile(path.join(DIST, "index.html")));

const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, () => console.log(`revivaz on :${PORT}`));
