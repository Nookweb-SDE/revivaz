import React, { useState } from "react";
import { Video, MapPin, LogIn, FileText, Eye, X } from "lucide-react";
import { T, card, sectionTitle, btnGhost } from "../ui";
import type { ConsultaUI as Consulta } from "../types";

type Aba = "proximas" | "passadas";

const badgeStyle = (status: Consulta["status"]): React.CSSProperties => {
  const base: React.CSSProperties = {
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
  if (status === "agendada")
    return { ...base, background: T.teal100, color: T.teal700 };
  if (status === "realizada")
    return { ...base, background: "#E8F5E9", color: "#2E7D32" };
  return { ...base, background: T.gray100, color: T.gray600 };
};

const LABEL: Record<Consulta["status"], string> = {
  solicitada: "Solicitada",
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/* link lives on the data row (consulta.link_ou_local); B-pac-app maps it into
   ConsultaUI as an optional `link`. Read it defensively to stay type-safe. */
function getLink(c: Consulta): string | undefined {
  const v = (c as Consulta & { link?: string }).link;
  return v && v.trim() ? v : undefined;
}

function Initials({ initials }: { initials: string }) {
  return (
    <div
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
        fontSize: 14,
        flexShrink: 0,
        userSelect: "none",
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

const actionBtnBase: React.CSSProperties = {
  ...btnGhost,
  borderRadius: 10,
  padding: "7px 14px",
  fontSize: 12,
  minHeight: 34,
  display: "flex",
  alignItems: "center",
  gap: 5,
};

function ConsultaRow({
  c,
  isProxima,
  onEntrar,
  onCancelar,
  onVerDetalhe,
}: {
  c: Consulta;
  isProxima: boolean;
  onEntrar: (c: Consulta) => void;
  onCancelar: (c: Consulta) => void;
  onVerDetalhe: (c: Consulta) => void;
}) {
  const tipoIcon = c.tipo === "online"
    ? <Video size={13} color={T.teal500} aria-label="Online" />
    : <MapPin size={13} color={T.teal500} aria-label="Presencial" />;

  const link = getLink(c);
  const canEntrar = c.status === "agendada" && c.tipo === "online" && !!link;
  const canCancelar = c.status === "solicitada" || c.status === "agendada";

  const renderAction = () => {
    if (isProxima) {
      return (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {canEntrar && (
            <button
              style={{ ...actionBtnBase, background: T.teal700, color: T.white }}
              onClick={() => onEntrar(c)}
              aria-label={`Entrar na consulta com ${c.profissional}`}
            >
              <LogIn size={13} aria-hidden="true" />
              Entrar
            </button>
          )}
          <button
            style={{ ...actionBtnBase, border: `1px solid ${T.gray200}`, color: T.teal700 }}
            onClick={() => onVerDetalhe(c)}
            aria-label={`Ver detalhe da consulta com ${c.profissional}`}
          >
            <Eye size={13} aria-hidden="true" />
            Ver detalhe
          </button>
          {canCancelar && (
            <button
              style={{ ...actionBtnBase, border: `1px solid ${T.gray200}`, color: T.gray700 }}
              onClick={() => onCancelar(c)}
              aria-label={`Cancelar consulta com ${c.profissional}`}
            >
              <X size={13} aria-hidden="true" />
              Cancelar
            </button>
          )}
        </div>
      );
    }
    // passadas (realizada / cancelada) — só leitura
    return (
      <button
        style={{ ...actionBtnBase, border: `1px solid ${T.gray200}`, color: T.teal700 }}
        onClick={() => onVerDetalhe(c)}
        aria-label={`Ver resumo da consulta com ${c.profissional}`}
      >
        <FileText size={13} aria-hidden="true" />
        Ver resumo
      </button>
    );
  };

  return (
    <div
      style={{
        ...card,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "14px 16px",
      }}
    >
      {/* Top row: avatar + info + badge */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Initials initials={c.avatar} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: T.gray950,
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {c.profissional}
          </div>
          <div
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontSize: 12,
              color: T.gray600,
              marginTop: 2,
            }}
          >
            {c.especialidade}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
            }}
          >
            {tipoIcon}
            <span
              style={{
                fontFamily: "'Nunito',sans-serif",
                fontSize: 12,
                color: T.gray600,
              }}
            >
              {formatDate(c.data)} · {c.hora}
            </span>
          </div>
        </div>
        <span style={badgeStyle(c.status)} aria-label={`Status: ${LABEL[c.status]}`}>
          {LABEL[c.status]}
        </span>
      </div>
      {/* Action row */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {renderAction()}
      </div>
    </div>
  );
}

function EmptyState({ aba }: { aba: Aba }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "32px 16px",
        color: T.gray600,
        fontFamily: "'Nunito',sans-serif",
        fontSize: 14,
      }}
      role="status"
      aria-live="polite"
    >
      {aba === "proximas"
        ? "Nenhuma consulta agendada. Que tal marcar uma?"
        : "Nenhuma consulta anterior registrada."}
    </div>
  );
}

export default function ListaConsultas({
  consultas,
  onEntrar,
  onCancelar,
  onVerDetalhe,
}: {
  consultas: Consulta[];
  onEntrar: (c: Consulta) => void;
  onCancelar: (c: Consulta) => void;
  onVerDetalhe: (c: Consulta) => void;
}): JSX.Element {
  const [aba, setAba] = useState<Aba>("proximas");

  const proximas = consultas.filter(
    (c) => c.status === "agendada" || c.status === "solicitada"
  );
  const passadas = consultas.filter(
    (c) => c.status === "realizada" || c.status === "cancelada"
  );

  const lista = aba === "proximas" ? proximas : passadas;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "7px 18px",
    borderRadius: 999,
    border: "none",
    fontSize: 13,
    fontWeight: active ? 700 : 600,
    fontFamily: "'Nunito',sans-serif",
    cursor: "pointer",
    transition: "background 0.2s, color 0.2s",
    background: active ? T.teal700 : "transparent",
    color: active ? T.white : T.gray600,
    minHeight: 36,
  });

  return (
    <section aria-label="Minhas consultas">
      {/* Section header */}
      <h2 style={sectionTitle}>Minhas consultas</h2>

      {/* Pill tabs */}
      <div
        role="tablist"
        aria-label="Filtrar consultas"
        style={{
          display: "flex",
          gap: 4,
          background: T.gray100,
          borderRadius: 999,
          padding: 4,
          marginBottom: 16,
          width: "fit-content",
        }}
      >
        <button
          role="tab"
          aria-selected={aba === "proximas"}
          aria-controls="tab-proximas"
          id="tab-btn-proximas"
          style={tabStyle(aba === "proximas")}
          onClick={() => setAba("proximas")}
        >
          Próximas
          {proximas.length > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: aba === "proximas" ? "rgba(255,255,255,0.25)" : T.teal100,
                color: aba === "proximas" ? T.white : T.teal700,
                borderRadius: 999,
                padding: "0 6px",
                fontSize: 11,
                fontWeight: 700,
              }}
              aria-label={`${proximas.length} consultas próximas`}
            >
              {proximas.length}
            </span>
          )}
        </button>
        <button
          role="tab"
          aria-selected={aba === "passadas"}
          aria-controls="tab-passadas"
          id="tab-btn-passadas"
          style={tabStyle(aba === "passadas")}
          onClick={() => setAba("passadas")}
        >
          Passadas
          {passadas.length > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: aba === "passadas" ? "rgba(255,255,255,0.25)" : T.gray200,
                color: aba === "passadas" ? T.white : T.gray600,
                borderRadius: 999,
                padding: "0 6px",
                fontSize: 11,
                fontWeight: 700,
              }}
              aria-label={`${passadas.length} consultas passadas`}
            >
              {passadas.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab panels */}
      <div
        role="tabpanel"
        id="tab-proximas"
        aria-labelledby="tab-btn-proximas"
        hidden={aba !== "proximas"}
      >
        {aba === "proximas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lista.length === 0 ? (
              <EmptyState aba="proximas" />
            ) : (
              lista.map((c) => (
                <ConsultaRow
                  key={c.id}
                  c={c}
                  isProxima={true}
                  onEntrar={onEntrar}
                  onCancelar={onCancelar}
                  onVerDetalhe={onVerDetalhe}
                />
              ))
            )}
          </div>
        )}
      </div>
      <div
        role="tabpanel"
        id="tab-passadas"
        aria-labelledby="tab-btn-passadas"
        hidden={aba !== "passadas"}
      >
        {aba === "passadas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lista.length === 0 ? (
              <EmptyState aba="passadas" />
            ) : (
              lista.map((c) => (
                <ConsultaRow
                  key={c.id}
                  c={c}
                  isProxima={false}
                  onEntrar={onEntrar}
                  onCancelar={onCancelar}
                  onVerDetalhe={onVerDetalhe}
                />
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
