// api/acolhimento.ts
import Anthropic from "@anthropic-ai/sdk";
import { detectCrisis, CRISIS_RESOURCES } from "../src/acolhimento/crisis";
import { ACOLHIMENTO_SYSTEM_PROMPT } from "../src/acolhimento/systemPrompt";

// Rate-limit em memória (suficiente p/ Fase 0; some entre cold starts — aceitável).
const HITS = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
let dailyCount = 0;
let dailyResetAt = 0;
const MAX_PER_DAY = 500; // teto duro de proteção de custo

function rateLimited(ip: string, now: number): boolean {
  if (now > dailyResetAt) { dailyCount = 0; dailyResetAt = now + 86_400_000; }
  if (dailyCount >= MAX_PER_DAY) return true;
  const e = HITS.get(ip);
  if (!e || now > e.resetAt) { HITS.set(ip, { count: 1, resetAt: now + WINDOW_MS }); dailyCount++; return false; }
  if (e.count >= MAX_PER_WINDOW) return true;
  e.count++; dailyCount++; return false;
}

export const config = { runtime: "nodejs" };

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).end("Method Not Allowed"); return; }
  const ip = (req.headers["x-forwarded-for"] || "unknown").toString().split(",")[0].trim();
  if (rateLimited(ip, Date.now())) { res.status(429).json({ error: "Muitas mensagens. Tente em instantes." }); return; }

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  if (messages.length > 40) { res.status(413).json({ error: "Conversa muito longa." }); return; }
  const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
  if (lastUser && detectCrisis(String(lastUser.content))) {
    res.status(200).json({ crisis: true, resources: CRISIS_RESOURCES });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "Serviço indisponível." }); return; }
  const client = new Anthropic({ apiKey });

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  try {
    const stream = client.messages.stream({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system: ACOLHIMENTO_SYSTEM_PROMPT,
      messages: messages.slice(-12).map((m: any) => ({ role: m.role, content: String(m.content) })),
    });
    stream.on("text", (delta) => res.write(delta));
    await stream.finalMessage();
    res.end();
  } catch (e) {
    console.error("acolhimento error:", e);
    res.end("Desculpe, tive um problema agora. Se for urgente, ligue 188 (CVV).");
  }
}
