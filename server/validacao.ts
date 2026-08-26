// Validações puras de entrada pública. Ficam fora do server.ts para poderem ser
// testadas sem subir o Express.

/** Telefone brasileiro plausível: 10 ou 11 dígitos (com DDD), ou 12/13 com o 55. */
export function telefoneValido(raw: string): boolean {
  const d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("55")) return d.length === 12 || d.length === 13;
  return d.length === 10 || d.length === 11;
}

/** Aceita vazio (o campo é opcional); se veio, precisa parecer e-mail. */
export function emailValido(raw: string): boolean {
  if (!raw) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw);
}
