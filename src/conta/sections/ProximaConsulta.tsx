import React from "react";
import { Calendar, Clock, Video, MapPin, CalendarPlus, MessageCircleHeart, RefreshCw, X } from "lucide-react";
import { T, btnPrimary } from "../ui";
import type { Consulta } from "../sampleData";

/* ─── palette ─── */
const heroGrad = `linear-gradient(135deg, ${T.navy} 0%, ${T.teal900} 60%, ${T.teal700} 100%)`;
const emptyGrad = `linear-gradient(135deg, ${T.teal050} 0%, #E8F7F9 100%)`;

/* ─── sub-styles ─── */
const avatarStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.18)",
  border: "2px solid rgba(255,255,255,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 800,
  fontSize: 20,
  color: T.white,
  letterSpacing: 1,
  flexShrink: 0,
};

const badgeBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  borderRadius: 20,
  padding: "4px 10px",
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 700,
  fontSize: 12,
  lineHeight: 1,
};

const daysBadge: React.CSSProperties = {
  ...badgeBase,
  background: "rgba(255,255,255,0.22)",
  color: T.white,
  border: "1px solid rgba(255,255,255,0.3)",
};

const tipoBadgeOnline: React.CSSProperties = {
  ...badgeBase,
  background: "rgba(0,191,216,0.28)",
  color: "#7EE8F8",
  border: "1px solid rgba(0,191,216,0.4)",
};

const tipoBadgePresencial: React.CSSProperties = {
  ...badgeBase,
  background: "rgba(255,255,255,0.15)",
  color: "#C5EFF5",
  border: "1px solid rgba(255,255,255,0.25)",
};

const metaText: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 600,
  fontSize: 13,
  color: "rgba(255,255,255,0.75)",
};

const btnEnter: React.CSSProperties = {
  ...btnPrimary,
  width: "100%",
  background: "rgba(255,255,255,0.18)",
  border: "1.5px solid rgba(255,255,255,0.45)",
  color: T.white,
  borderRadius: 14,
  fontSize: 15,
  fontWeight: 800,
  fontFamily: "'Nunito',sans-serif",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  minHeight: 52,
  transition: "background 0.18s, border-color 0.18s",
};

const ghostActionStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,0.65)",
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 2px",
  textDecoration: "underline",
  textDecorationColor: "transparent",
  transition: "color 0.15s",
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
}

/* ─── Filled state ─── */
function FilledCard({ consulta }: { consulta: Consulta }) {
  const isOnline = consulta.tipo === "online";

  return (
    <div
      style={{
        background: heroGrad,
        borderRadius: 20,
        padding: "20px 18px 18px",
        boxShadow: "0 8px 32px rgba(11,29,58,0.28), 0 2px 8px rgba(0,120,140,0.18)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* decorative glow blob */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,168,191,0.22) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* section label */}
      <p
        style={{
          fontFamily: "'Nunito',sans-serif",
          fontWeight: 700,
          fontSize: 11,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: 1.5,
          margin: 0,
          textTransform: "uppercase",
        }}
      >
        Próxima consulta
      </p>

      {/* professional row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={avatarStyle} role="img" aria-label={`Foto de ${consulta.profissional}`}>
          {consulta.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 800,
              fontSize: 17,
              color: T.white,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {consulta.profissional}
          </p>
          <p
            style={{
              margin: "3px 0 0",
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color: "rgba(255,255,255,0.65)",
            }}
          >
            {consulta.especialidade}
          </p>
        </div>
      </div>

      {/* date/time row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <span style={metaText}>
          <Calendar size={14} strokeWidth={2.5} aria-hidden="true" />
          {formatDate(consulta.data)}
        </span>
        <span style={{ ...metaText, color: "rgba(255,255,255,0.45)" }}>·</span>
        <span style={metaText}>
          <Clock size={14} strokeWidth={2.5} aria-hidden="true" />
          {consulta.hora}
        </span>
      </div>

      {/* badges row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {consulta.emDias !== undefined && (
          <span style={daysBadge}>
            em {consulta.emDias} {consulta.emDias === 1 ? "dia" : "dias"}
          </span>
        )}
        <span style={isOnline ? tipoBadgeOnline : tipoBadgePresencial}>
          {isOnline ? (
            <Video size={11} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <MapPin size={11} strokeWidth={2.5} aria-hidden="true" />
          )}
          {isOnline ? "Online" : "Presencial"}
        </span>
      </div>

      {/* divider */}
      <div
        aria-hidden="true"
        style={{ borderTop: "1px solid rgba(255,255,255,0.12)", margin: "0 -2px" }}
      />

      {/* CTA */}
      {isOnline && (
        <button
          style={btnEnter}
          onClick={() => alert("Abrindo teleconsulta…")}
          aria-label="Entrar na consulta online"
        >
          <Video size={18} strokeWidth={2.5} aria-hidden="true" />
          Entrar na consulta
        </button>
      )}

      {/* ghost actions */}
      <div style={{ display: "flex", gap: 18 }}>
        <button
          style={ghostActionStyle}
          onClick={() => alert("Abrindo reagendamento…")}
          aria-label="Remarcar esta consulta"
        >
          <RefreshCw size={13} strokeWidth={2.5} aria-hidden="true" />
          Remarcar
        </button>
        <button
          style={ghostActionStyle}
          onClick={() => alert("Solicitando cancelamento…")}
          aria-label="Cancelar esta consulta"
        >
          <X size={13} strokeWidth={2.5} aria-hidden="true" />
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyCard() {
  return (
    <div
      style={{
        background: emptyGrad,
        borderRadius: 20,
        padding: "28px 18px 22px",
        boxShadow: "0 2px 12px rgba(0,120,140,0.08)",
        border: `1px solid ${T.teal100}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        textAlign: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${T.teal100} 0%, ${T.teal050} 100%)`,
          border: `2px solid ${T.teal300}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: T.teal700,
        }}
      >
        <Calendar size={28} strokeWidth={1.8} />
      </div>

      <div>
        <p
          style={{
            margin: 0,
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 800,
            fontSize: 16,
            color: T.navy,
          }}
        >
          Você não tem consulta marcada
        </p>
        <p
          style={{
            margin: "6px 0 0",
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 500,
            fontSize: 13,
            color: T.gray600,
            lineHeight: 1.5,
          }}
        >
          Agende uma consulta com um profissional de saúde mental ou converse com a IA de suporte a qualquer hora.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
        <button
          style={{
            ...btnPrimary,
            width: "100%",
            fontFamily: "'Nunito',sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minHeight: 52,
            fontSize: 15,
            fontWeight: 800,
            borderRadius: 14,
            background: `linear-gradient(90deg, ${T.teal900} 0%, ${T.teal700} 100%)`,
            boxShadow: `0 4px 14px rgba(0,122,140,0.28)`,
          }}
          onClick={() => alert("Abrindo agendamento…")}
          aria-label="Agendar uma nova consulta"
        >
          <CalendarPlus size={18} strokeWidth={2.5} aria-hidden="true" />
          Agendar consulta
        </button>

        <a
          href="/acolhimento"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "transparent",
            border: `1.5px solid ${T.teal700}`,
            borderRadius: 14,
            padding: "12px 20px",
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: T.teal700,
            textDecoration: "none",
            minHeight: 44,
            transition: "background 0.15s",
          }}
          aria-label="Conversar com a IA de acolhimento"
        >
          <MessageCircleHeart size={17} strokeWidth={2.5} aria-hidden="true" />
          Conversar com a IA
        </a>
      </div>
    </div>
  );
}

/* ─── Main export ─── */
export default function ProximaConsulta({ consulta }: { consulta?: Consulta }): JSX.Element {
  return consulta ? <FilledCard consulta={consulta} /> : <EmptyCard />;
}
