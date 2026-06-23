import React from "react";
import { T, card, sectionTitle, btnPrimary } from "../ui";
import type { SessaoIA } from "../sampleData";

function formatData(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export default function ContinuarConversa({ sessoes }: { sessoes: SessaoIA[] }): JSX.Element {
  if (!sessoes || sessoes.length === 0) {
    return (
      <section style={{ marginBottom: 24 }}>
        <h2 style={sectionTitle}>Conversa com IA</h2>
        <div style={{ ...card, textAlign: "center", padding: 32 }}>
          <p style={{ color: T.gray600, fontSize: 14, margin: 0 }}>
            Nenhuma sessão encontrada. Inicie uma conversa para começar.
          </p>
          <a
            href="/acolhimento"
            style={{ textDecoration: "none", display: "inline-block", marginTop: 16 }}
          >
            <button style={btnPrimary}>Iniciar chat</button>
          </a>
        </div>
      </section>
    );
  }

  // Sort by date descending and pick the most recent
  const sorted = [...sessoes].sort((a, b) => b.data.localeCompare(a.data));
  const recente = sorted[0];
  const historico = sorted.slice(1);

  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={sectionTitle}>Conversa com IA</h2>

      {/* Main card — most recent session */}
      <div
        style={{
          ...card,
          background: T.teal050,
          border: `1px solid ${T.teal300}`,
          marginBottom: 12,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div
            aria-hidden="true"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: T.teal700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            🤖
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: T.teal900,
              }}
            >
              Continue de onde parou…
            </p>
            <p style={{ margin: 0, fontSize: 12, color: T.gray600 }}>
              {formatData(recente.data)}
            </p>
          </div>
        </div>

        {/* Last excerpt */}
        <blockquote
          style={{
            margin: "0 0 16px",
            padding: "10px 14px",
            background: T.white,
            borderLeft: `3px solid ${T.teal500}`,
            borderRadius: 8,
            fontStyle: "italic",
            fontSize: 13,
            color: T.gray700,
            lineHeight: 1.5,
          }}
        >
          "{recente.ultimoTrecho}"
        </blockquote>

        {/* CTA */}
        <a href="/acolhimento" style={{ textDecoration: "none" }}>
          <button
            style={{
              ...btnPrimary,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <span>💬</span> Abrir chat
          </button>
        </a>
      </div>

      {/* Mini history */}
      {historico.length > 0 && (
        <div style={{ ...card, padding: "12px 16px" }}>
          <p
            style={{
              margin: "0 0 8px",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              color: T.gray600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Histórico
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {historico.map((sessao, idx) => (
              <li
                key={sessao.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  paddingTop: idx === 0 ? 0 : 10,
                  paddingBottom: 10,
                  borderBottom:
                    idx < historico.length - 1 ? `1px solid ${T.gray200}` : "none",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: T.teal700,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    marginTop: 2,
                    minWidth: 52,
                  }}
                >
                  {formatData(sessao.data)}
                </span>
                <span style={{ fontSize: 13, color: T.gray700, lineHeight: 1.4 }}>
                  {sessao.resumo}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
