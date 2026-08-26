/**
 * Helpers puros e tokens visuais do Atendimento.
 *
 * Extraídos verbatim do Atendimento.tsx (1232 linhas) para que a lógica que dá
 * para errar — nome que aparece na tela, faixa da nota, formatação de data —
 * possa ser testada sem montar componente nenhum.
 */
import React from "react";
import { T } from "../../../conta/ui";
import type { Consulta } from "../../../lib/types";

export function shortId(id: string): string {
  return id.slice(0, 8);
}

export function nomeDoPaciente(c: Consulta, nomes: Record<string, string>): string {
  const n = nomes[c.paciente_id];
  if (n && n.trim() !== "") return n;
  return `Paciente #${shortId(c.paciente_id)}`;
}

export const badgeStyle = (status: string): React.CSSProperties => {
  const colors: Record<string, { bg: string; color: string }> = {
    solicitada: { bg: "#FEF3C7", color: "#92400E" },
    agendada: { bg: T.teal100, color: T.teal900 },
    realizada: { bg: "#D1FAE5", color: "#065F46" },
    cancelada: { bg: "#FEE2E2", color: "#991B1B" },
  };
  const c = colors[status] ?? { bg: T.gray100, color: T.gray700 };
  return {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background: c.bg,
    color: c.color,
    fontFamily: "'Nunito',sans-serif",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };
};

// ---------------------------------------------------------------------------
// Avaliação badge helpers
// ---------------------------------------------------------------------------

export const AMBAR_PROF = "#D97706";
export function corNotaProf(nota: number): { bg: string; text: string } {
  if (nota <= 6) return { bg: "#FEE2E2", text: "#991B1B" };
  if (nota <= 8) return { bg: "#FEF3C7", text: AMBAR_PROF };
  return { bg: "#D1FAE5", text: "#065F46" };
}

export function labelNota(nota: number): string {
  if (nota <= 6) return "Precisa melhorar";
  if (nota <= 8) return "Razoável";
  return "Recomendaria";
}

export function formatDataHora(c: Consulta): string | null {
  if (!c.data) return null;
  return new Date(`${c.data}T${c.hora ?? "00:00"}`).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// ---------------------------------------------------------------------------
// Histórico modal
// ---------------------------------------------------------------------------
