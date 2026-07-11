/**
 * claudeBridge.ts — cliente da ponte Claude CLI (assistente Revivaz).
 *
 * O modelo Claude roda FORA do container, no host da VPS Contabo izai, atrás de
 * uma ponte HTTP local (a MESMA do Tecnopano: deploy/claude-vps/bridge.mjs) que
 * spawna o Claude CLI travado (read-only, auth por OAuth da assinatura — NÃO por
 * API key). Custo é o plano fixo da assinatura, sem token de LLM no projeto.
 *
 * Revivaz manda o prompt inteiro (system + histórico) — não usa tool-loop.
 *
 * Config (env, ambas via Docker secret *_FILE):
 *   CLAUDE_BRIDGE_URL     (ex: http://host.docker.internal:8787/ask)
 *   CLAUDE_BRIDGE_SECRET  (mesmo valor do BRIDGE_SECRET da ponte no host)
 */

export function isClaudeBridgeConfigured(): boolean {
  return Boolean(process.env.CLAUDE_BRIDGE_URL && process.env.CLAUDE_BRIDGE_SECRET);
}

/**
 * Pergunta ao Claude via ponte. Retorna o texto completo (não streaming).
 * Lança em erro de rede/timeout/HTTP não-2xx ou resposta sem texto.
 */
export async function askClaudeBridge(opts: {
  prompt: string;
  timeoutMs?: number;
}): Promise<string> {
  const url = process.env.CLAUDE_BRIDGE_URL;
  const secret = process.env.CLAUDE_BRIDGE_SECRET || "";
  if (!url) throw new Error("claude_bridge_not_configured");

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), opts.timeoutMs ?? 55_000);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Bridge-Secret": secret },
      body: JSON.stringify({ prompt: opts.prompt }),
      signal: ac.signal,
    });
    if (!r.ok) throw new Error(`bridge HTTP ${r.status}`);
    const data = (await r.json()) as { ok?: boolean; text?: string; error?: string };
    if (!data?.ok || typeof data.text !== "string") {
      throw new Error(data?.error || "bridge sem texto");
    }
    return data.text;
  } finally {
    clearTimeout(timer);
  }
}
