import { ACOLHIMENTO_SYSTEM_PROMPT } from "../../src/acolhimento/systemPrompt";

export type MensagemAcolhimento = { role: string; content: unknown };

/**
 * Monta um prompt único p/ o Claude CLI: system de acolhimento + histórico recente
 * (últimas 12 msgs) + a pergunta atual. O CLI não tem "system role" separado, então
 * o prompt de acolhimento entra como instrução inicial e as regras são reforçadas no fim.
 * Fica fora da rota para o teste de conversas usar exatamente o mesmo texto.
 */
export function montarPromptAcolhimento(messages: MensagemAcolhimento[]): string {
  const historico = messages
    .slice(-12)
    .map((m) => `${m.role === "assistant" ? "ASSISTENTE" : "PESSOA"}: ${String(m.content)}`)
    .join("\n");

  return [
    ACOLHIMENTO_SYSTEM_PROMPT,
    "",
    "CONVERSA ATÉ AGORA:",
    historico,
    "",
    "Responda à ÚLTIMA fala da PESSOA seguindo as regras acima. Responda APENAS com a fala do assistente, sem prefixo, sem aspas, 2 ou 3 frases curtas.",
  ].join("\n");
}
