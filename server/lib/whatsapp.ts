// Camada WhatsApp (Evolution API). Extraído do server.ts: as rotas só pedem
// "manda essa mensagem"; como o telefone é normalizado e qual endpoint da
// Evolution é usado fica aqui.
import { EVOLUTION_API_KEY, EVOLUTION_URL, EVOLUTION_INSTANCE } from "../config";

// ─── Phone normalization ─────────────────────────────────────────────────────
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // If already has country code (starts with 55 and length >= 12), keep as-is
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  // Otherwise prepend Brazil country code
  return `55${digits}`;
}

// ─── Helper: envia uma mensagem WhatsApp via Evolution (reusa /wa/start) ─────
// Mesmo endpoint sendText. NUNCA loga o telefone inteiro nem o texto.
// Retorna true só se a Evolution respondeu ok. Não lança.
export async function enviarWhatsApp(phoneDigits: string, texto: string): Promise<boolean> {
  if (!EVOLUTION_URL || !EVOLUTION_INSTANCE || !EVOLUTION_API_KEY) return false;
  const number = normalizePhone(phoneDigits);
  if (number.length < 12) return false;
  const endpoint = `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
  try {
    const evRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({ number, text: texto }),
    });
    if (!evRes.ok) {
      console.error(
        `[wa/send] Evolution retornou ${evRes.status} para ${number.slice(0, 4)}****`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("[wa/send] Falha ao chamar Evolution API:", err);
    return false;
  }
}

