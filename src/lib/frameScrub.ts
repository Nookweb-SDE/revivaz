/**
 * Mapeamento puro entre progresso de scroll e índice de frame.
 * Sem DOM e sem React de propósito: assim roda no vitest atual,
 * que usa environment "node" e só inclui src/**\/*.test.ts.
 */

/** Índice do frame para um progresso 0–1. Sempre dentro de [0, total-1]. */
export function frameIndex(progress: number, total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  const p = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0;
  return Math.round(p * (total - 1));
}

/** Caminho de um frame. O índice é sempre de três dígitos. */
export function frameSrc(base: string, index: number): string {
  return `${base}/f${String(index).padStart(3, "0")}.webp`;
}

/** Todos os caminhos, na ordem — usado para pré-carregar. */
export function framePaths(base: string, total: number): string[] {
  if (!Number.isFinite(total) || total <= 0) return [];
  return Array.from({ length: total }, (_, i) => frameSrc(base, i));
}
