/**
 * Ciclo de vida da candidatura.
 *
 * A tabela de transições é a única fonte: o servidor consulta antes de decidir,
 * e é ela que torna a aprovação idempotente — aprovar de novo é uma transição
 * `aprovada → aprovada`, que não existe, então a segunda chamada não faz nada.
 */
export type StatusCandidatura =
  | "recebida"
  | "em_analise"
  | "pendencia"
  | "aprovada"
  | "recusada";

/** De → para. O que não está aqui é proibido. */
export const TRANSICOES: Record<StatusCandidatura, StatusCandidatura[]> = {
  recebida: ["em_analise", "recusada"],
  em_analise: ["aprovada", "recusada", "pendencia"],
  pendencia: ["em_analise", "recusada"],
  aprovada: [],
  recusada: [],
};

export function podeTransicionar(
  de: StatusCandidatura,
  para: StatusCandidatura
): boolean {
  return (TRANSICOES[de] ?? []).includes(para);
}

export const LABEL_STATUS: Record<StatusCandidatura, string> = {
  recebida: "Recebida",
  em_analise: "Em análise",
  pendencia: "Falta documento",
  aprovada: "Aprovada",
  recusada: "Recusada",
};
