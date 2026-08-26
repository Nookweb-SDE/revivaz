// Chat de acolhimento. A ORDEM importa e é a rede de segurança do produto:
// parse → detecção de crise (grátis, ANTES do rate-limit) → rate-limit → IA.
// Quem está em crise nunca é barrado por limite de uso.
//
// É PÚBLICA de novo (26/ago, 2ª decisão do dono): a IA virou a porta de entrada
// no lugar do WhatsApp. Como não há login, o custo é contido por teto duro:
// 6 mensagens por IP a cada 5 min e 300 por dia no total. Estourou o dia, a
// pessoa ainda recebe os recursos de crise e o caminho para pedir consulta —
// o que some é só a resposta gerada.
import { Router, type Request, type Response } from "express";
import { detectCrisis, CRISIS_RESOURCES } from "../../src/acolhimento/crisis";
import { ACOLHIMENTO_SYSTEM_PROMPT } from "../../src/acolhimento/systemPrompt";
import { askClaudeBridge, isClaudeBridgeConfigured } from "../lib/claudeBridge";

const router = Router();

// ─── Rate-limit em memória (per-IP + teto diário) — protege custo do /acolhimento ──
// Exportado só para o teste conseguir zerar o estado entre casos.
export const HITS = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 5 * 60_000;
const MAX_PER_WINDOW = 6;
export function zerarLimiteAcolhimento(): void {
  HITS.clear();
  dailyCount = 0;
  dailyResetAt = 0;
}

let dailyCount = 0;
let dailyResetAt = 0;
const MAX_PER_DAY = 300;

function rateLimited(ip: string, now: number): boolean {
  if (now > dailyResetAt) {
    dailyCount = 0;
    dailyResetAt = now + 86_400_000;
  }
  if (dailyCount >= MAX_PER_DAY) return true;
  const e = HITS.get(ip);
  if (!e || now > e.resetAt) {
    HITS.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    dailyCount++;
    return false;
  }
  if (e.count >= MAX_PER_WINDOW) return true;
  e.count++;
  dailyCount++;
  return false;
}

router.post("/api/acolhimento", async (req, res) => {
  const fwd = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(fwd) ? fwd[0] : (fwd || "").toString().split(",")[0].trim()) ||
    req.socket.remoteAddress ||
    "unknown";

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  if (messages.length > 40) {
    res.status(413).json({ error: "Conversa muito longa." });
    return;
  }

  // Crise SEMPRE antes do rate-limit (não faz chamada à IA; usuário em crise nunca fica sem recurso).
  const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
  if (lastUser && detectCrisis(String(lastUser.content))) {
    res.status(200).json({ crisis: true, resources: CRISIS_RESOURCES });
    return;
  }

  if (rateLimited(ip, Date.now())) {
    res.status(429).json({
      error:
        "Recebi muitas mensagens agora e preciso de uma pausa. Se você quiser falar com uma pessoa, peça uma consulta aqui do lado. Se for urgente, ligue 188 (CVV, 24h e gratuito).",
    });
    return;
  }
  if (!lastUser || messages.length === 0) {
    res.status(400).json({ error: "Mensagem vazia." });
    return;
  }

  if (!isClaudeBridgeConfigured()) {
    res.status(500).json({ error: "Serviço indisponível." });
    return;
  }

  // Monta um prompt único p/ o Claude CLI: system de acolhimento + histórico recente
  // (últimas 12 msgs) + a pergunta atual. O CLI não tem "system role" separado, então
  // o prompt de acolhimento entra como instrução inicial e as regras são reforçadas no fim.
  const historico = messages
    .slice(-12)
    .map((m: any) => `${m.role === "assistant" ? "ASSISTENTE" : "PESSOA"}: ${String(m.content)}`)
    .join("\n");

  const prompt = [
    ACOLHIMENTO_SYSTEM_PROMPT,
    "",
    "CONVERSA ATÉ AGORA:",
    historico,
    "",
    "Responda à ÚLTIMA fala da PESSOA seguindo as regras acima. Responda APENAS com a fala do assistente, sem prefixo, sem aspas, 2 a 5 frases.",
  ].join("\n");

  try {
    const reply = (await askClaudeBridge({ prompt, timeoutMs: 55_000 })).trim();
    res.status(200).json({ reply });
  } catch (e) {
    console.error("acolhimento error:", e);
    // Degrada gracioso: mensagem segura + recurso de crise sempre visível.
    res.status(200).json({
      reply: "Desculpe, tive um problema agora. Se for urgente, ligue 188 (CVV).",
    });
  }
});

export default router;
