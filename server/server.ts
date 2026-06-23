// Servidor Node (Contabo) — serve o build estático (landing + /acolhimento)
// e a API de acolhimento. Substitui a função serverless do Vercel.
// Mesma lógica de segurança de api/acolhimento.ts: crise ANTES do rate-limit.
import express, { Request, Response } from "express";
import { fileURLToPath } from "url";
import path from "path";
import { readFileSync, existsSync } from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Webhook, WebhookVerificationError } from "standardwebhooks";
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

// Segredos para o SMS Hook via WhatsApp
function resolveSecret(envKey: string, fileKey: string): string {
  if (process.env[envKey]) return process.env[envKey]!.trim();
  const f = process.env[fileKey];
  if (f && existsSync(f)) return readFileSync(f, "utf8").trim();
  return "";
}

const SEND_SMS_HOOK_SECRET = resolveSecret("SEND_SMS_HOOK_SECRET", "SEND_SMS_HOOK_SECRET_FILE");
const EVOLUTION_API_KEY = resolveSecret("EVOLUTION_API_KEY", "EVOLUTION_API_KEY_FILE");
const EVOLUTION_URL = (process.env.EVOLUTION_URL || "").replace(/\/$/, "");
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "";

const app = express();

// Hook SMS: precisa do raw body para verificar assinatura Standard-Webhooks.
// Registrado ANTES do express.json() global para não consumir o stream.
app.post(
  "/api/auth-sms-hook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response): Promise<void> => {
    // Verificar dependências de configuração
    if (!SEND_SMS_HOOK_SECRET) {
      console.error("[sms-hook] SEND_SMS_HOOK_SECRET não configurado");
      res.status(500).json({ error: "SMS hook não configurado (secret ausente)" });
      return;
    }
    if (!EVOLUTION_API_KEY || !EVOLUTION_URL || !EVOLUTION_INSTANCE) {
      console.error("[sms-hook] Evolution API não configurada (KEY, URL ou INSTANCE ausentes)");
      res.status(500).json({ error: "SMS hook não configurado (Evolution ausente)" });
      return;
    }

    // Verificar assinatura Standard-Webhooks
    // Supabase envia o secret no formato "v1,whsec_<base64>".
    // A lib `standardwebhooks` já strip "whsec_" mas não entende "v1,".
    const rawSecret = SEND_SMS_HOOK_SECRET.startsWith("v1,")
      ? SEND_SMS_HOOK_SECRET.substring(3)
      : SEND_SMS_HOOK_SECRET;

    const rawBody: Buffer = req.body as Buffer;
    const wh = new Webhook(rawSecret);

    try {
      wh.verify(rawBody, {
        "webhook-id": String(req.headers["webhook-id"] ?? ""),
        "webhook-timestamp": String(req.headers["webhook-timestamp"] ?? ""),
        "webhook-signature": String(req.headers["webhook-signature"] ?? ""),
      });
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        console.warn("[sms-hook] Assinatura inválida:", err.message);
      } else {
        console.error("[sms-hook] Erro de verificação:", err);
      }
      res.status(401).json({ error: "Assinatura inválida" });
      return;
    }

    // Parsear payload
    let payload: { user?: { phone?: string }; sms?: { otp?: string } };
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      res.status(400).json({ error: "Payload inválido" });
      return;
    }

    const phone = payload?.user?.phone ?? "";
    const otp = payload?.sms?.otp ?? "";

    if (!phone || !otp) {
      console.error("[sms-hook] phone ou otp ausentes no payload", { phone: !!phone, otp: !!otp });
      res.status(400).json({ error: "phone ou otp ausentes" });
      return;
    }

    // Normalizar número: apenas dígitos (Evolution espera só números)
    const digits = phone.replace(/\D/g, "");
    const text = `Seu código de acesso Revivaz: ${otp}\n\nNão compartilhe. Em emergência ligue 188 (CVV).`;

    // Enviar via Evolution API
    const evolutionUrl = `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
    try {
      const evRes = await fetch(evolutionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({ number: digits, text }),
      });

      if (!evRes.ok) {
        const body = await evRes.text();
        console.error(`[sms-hook] Evolution retornou ${evRes.status}:`, body);
        res.status(500).json({ error: `Evolution erro ${evRes.status}` });
        return;
      }

      console.log(`[sms-hook] OTP enviado via WhatsApp para ${digits.slice(0, 4)}****`);
      res.status(200).json({});
    } catch (err) {
      console.error("[sms-hook] Falha ao chamar Evolution API:", err);
      res.status(500).json({ error: "Falha ao enviar WhatsApp" });
    }
  }
);

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
