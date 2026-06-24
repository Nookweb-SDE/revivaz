import React, { useEffect, useRef } from "react";
import { X, Calendar, Clock, Video, MapPin, Link2, FileText, Stethoscope } from "lucide-react";
import { T } from "../ui";
import type { ConsultaUI as Consulta } from "../types";

const LABEL: Record<Consulta["status"], string> = {
  solicitada: "Solicitada",
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

const statusColor = (status: Consulta["status"]): { bg: string; fg: string } => {
  if (status === "agendada") return { bg: T.teal100, fg: T.teal700 };
  if (status === "realizada") return { bg: "#E8F5E9", fg: "#2E7D32" };
  if (status === "cancelada") return { bg: T.gray100, fg: T.gray600 };
  return { bg: T.gray100, fg: T.gray700 }; // solicitada
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* link + obs are mapped into ConsultaUI by ContaApp from the data row. */
function getLink(c: Consulta): string | undefined {
  const v = c.link;
  return v && v.trim() ? v : undefined;
}
function getObs(c: Consulta): string | undefined {
  const v = c.obs;
  return v && v.trim() ? v : undefined;
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: T.gray600,
  margin: 0,
};

const valueStyle: React.CSSProperties = {
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 600,
  fontSize: 14,
  color: T.gray950,
  margin: "3px 0 0",
  display: "flex",
  alignItems: "center",
  gap: 7,
  lineHeight: 1.4,
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <div style={valueStyle}>{children}</div>
    </div>
  );
}

export default function ConsultaDetalhe({
  consulta,
  onFechar,
}: {
  consulta: Consulta | null;
  onFechar: () => void;
}): JSX.Element | null {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = "consulta-detalhe-titulo";

  // Esc to close + focus the close button on open + lock scroll
  useEffect(() => {
    if (!consulta) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onFechar();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [consulta, onFechar]);

  if (!consulta) return null;

  const isOnline = consulta.tipo === "online";
  const link = getLink(consulta);
  const obs = getObs(consulta);
  const sc = statusColor(consulta.status);

  return (
    <div
      onClick={onFechar}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(11,29,58,0.55)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 0,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.white,
          width: "100%",
          maxWidth: 460,
          maxHeight: "90vh",
          overflowY: "auto",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          boxShadow: "0 -8px 40px rgba(11,29,58,0.3)",
          padding: "10px 0 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* grabber */}
        <div
          aria-hidden="true"
          style={{
            width: 40,
            height: 4,
            borderRadius: 999,
            background: T.gray200,
            margin: "0 auto 12px",
          }}
        />

        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            padding: "0 20px 14px",
            borderBottom: `1px solid ${T.gray100}`,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              id={titleId}
              style={{
                fontFamily: "'Nunito',sans-serif",
                fontWeight: 800,
                fontSize: 18,
                color: T.gray950,
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              {consulta.profissional}
            </h2>
            <p
              style={{
                fontFamily: "'Nunito',sans-serif",
                fontWeight: 600,
                fontSize: 13,
                color: T.gray600,
                margin: "3px 0 0",
              }}
            >
              {consulta.especialidade}
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onFechar}
            aria-label="Fechar detalhe da consulta"
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 999,
              border: "none",
              background: T.gray100,
              color: T.gray700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {/* body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: "18px 20px 0",
          }}
        >
          <Field label="Data e hora">
            <Calendar size={15} strokeWidth={2.4} color={T.teal700} aria-hidden="true" />
            {formatDate(consulta.data)}
            <span style={{ color: T.gray200 }}>·</span>
            <Clock size={15} strokeWidth={2.4} color={T.teal700} aria-hidden="true" />
            {consulta.hora}
          </Field>

          <Field label="Modalidade">
            {isOnline ? (
              <Video size={15} strokeWidth={2.4} color={T.teal700} aria-hidden="true" />
            ) : (
              <MapPin size={15} strokeWidth={2.4} color={T.teal700} aria-hidden="true" />
            )}
            {isOnline ? "Online" : "Presencial"}
          </Field>

          <Field label="Status">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Nunito',sans-serif",
                background: sc.bg,
                color: sc.fg,
              }}
            >
              {LABEL[consulta.status]}
            </span>
          </Field>

          {link && (
            <Field label={isOnline ? "Link da consulta" : "Local"}>
              {isOnline ? (
                <>
                  <Link2 size={15} strokeWidth={2.4} color={T.teal700} aria-hidden="true" />
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: T.teal700,
                      fontWeight: 700,
                      textDecoration: "underline",
                      wordBreak: "break-all",
                    }}
                  >
                    {link}
                  </a>
                </>
              ) : (
                <>
                  <MapPin size={15} strokeWidth={2.4} color={T.teal700} aria-hidden="true" />
                  <span style={{ wordBreak: "break-word" }}>{link}</span>
                </>
              )}
            </Field>
          )}

          {obs && (
            <div>
              <p style={labelStyle}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <FileText size={13} strokeWidth={2.4} aria-hidden="true" />
                  Observações
                </span>
              </p>
              <p
                style={{
                  fontFamily: "'Nunito',sans-serif",
                  fontWeight: 500,
                  fontSize: 14,
                  color: T.gray700,
                  margin: "6px 0 0",
                  lineHeight: 1.55,
                  background: T.gray050,
                  border: `1px solid ${T.gray100}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {obs}
              </p>
            </div>
          )}

          {consulta.status === "realizada" && !obs && (
            <p
              style={{
                fontFamily: "'Nunito',sans-serif",
                fontWeight: 500,
                fontSize: 13,
                color: T.gray600,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <Stethoscope size={15} strokeWidth={2.2} color={T.gray600} aria-hidden="true" />
              Esta consulta foi realizada. Sem observações registradas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
