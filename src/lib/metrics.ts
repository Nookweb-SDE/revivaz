// Helpers puros de métricas (sem Supabase) — testáveis isoladamente.

// NPS a partir de notas 0..10: promotor>=9, detrator<=6.
// Resultado em -100..100, arredondado. null se a lista estiver vazia.
export function npsFromNotas(notas: number[]): number | null {
  if (notas.length === 0) return null;
  const promotores = notas.filter((n) => n >= 9).length;
  const detratores = notas.filter((n) => n <= 6).length;
  const pct = ((promotores - detratores) / notas.length) * 100;
  return Math.round(pct);
}

// 0.42 -> "42%"
export function fmtPct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

// formata métrica numérica; null -> "—". suffix opcional (ex.: "/10", " pts").
export function fmtMetric(n: number | null, suffix = ""): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n}${suffix}`;
}
