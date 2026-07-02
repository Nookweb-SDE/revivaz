/**
 * agendaUtils.tsx
 * Helpers visuais compartilhados entre Agenda.tsx (HistoricoModal)
 * e ConsultaCard.tsx. Não contém lógica de negócio nem chamadas de API.
 */
import React from "react";
import { Video, MapPin } from "lucide-react";
import { T } from "../../conta/ui";
import type { Consulta } from "../../lib/types";

/* ─── formatação de data ─── */
export function formatData(iso: string | null): string {
  if (!iso) return "Sem data";
  const parts = iso.split("-").map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return iso;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
}

/* ─── inicial do nome para avatar ─── */
export function inicial(nome: string): string {
  const t = nome.trim();
  return t ? t[0].toUpperCase() : "P";
}

/* ─── base de estilo para badges inline ─── */
export const badgeBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.3,
  fontFamily: "'Nunito',sans-serif",
};

/* ─── badge tipo (online / presencial) ─── */
export function tipoBadge(tipo: Consulta["tipo"]): JSX.Element {
  const online = tipo === "online";
  return (
    <span
      style={{
        ...badgeBase,
        background: online ? T.teal100 : T.gray100,
        color: online ? T.teal700 : T.gray600,
      }}
    >
      {online ? (
        <Video size={11} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <MapPin size={11} strokeWidth={2.5} aria-hidden="true" />
      )}
      {online ? "Online" : "Presencial"}
    </span>
  );
}

/* ─── badge status ─── */
export function statusBadge(status: Consulta["status"]): JSX.Element {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    solicitada: { bg: "#FEF3C7", color: "#92400E", label: "Solicitada" },
    agendada:   { bg: T.teal100, color: T.teal900, label: "Agendada" },
    realizada:  { bg: "#D1FAE5", color: "#065F46", label: "Realizada" },
    cancelada:  { bg: "#FEE2E2", color: "#991B1B", label: "Cancelada" },
  };
  const s = map[status] ?? { bg: T.gray100, color: T.gray700, label: status };
  return <span style={{ ...badgeBase, background: s.bg, color: s.color }}>{s.label}</span>;
}

/* ─── avatar com inicial do nome do paciente ─── */
export function PacienteAvatar({ nome }: { nome: string }): JSX.Element {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${T.teal500} 0%, ${T.teal700} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: T.white,
        fontFamily: "'Nunito',sans-serif",
        fontWeight: 800,
        fontSize: 16,
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {inicial(nome)}
    </div>
  );
}
