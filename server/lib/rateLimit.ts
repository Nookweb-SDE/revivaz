// Rate-limit em memória. Três usos no servidor com janelas diferentes:
// OTP por telefone, chat de acolhimento por IP (protege custo) e pedidos do
// site por IP (protege contra spam). Em memória basta: uma réplica só, e
// perder o contador num restart é aceitável.

export interface RateBucket {
  count: number;
  resetAt: number;
}

/**
 * Cria um limitador com janela deslizante simples.
 * Devolve `true` quando a chave ESTOUROU o limite (ou seja: barre).
 * O mapa fica exposto para os testes poderem zerar o estado entre casos.
 */
export function criarRateLimiter(max: number, janelaMs: number) {
  const mapa = new Map<string, RateBucket>();
  function limitado(chave: string, now: number): boolean {
    const e = mapa.get(chave);
    if (!e || now > e.resetAt) {
      mapa.set(chave, { count: 1, resetAt: now + janelaMs });
      return false;
    }
    if (e.count >= max) return true;
    e.count++;
    return false;
  }
  return { limitado, mapa };
}
