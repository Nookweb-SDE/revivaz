import React from "react";
import { T, card, sectionTitle, btnPrimary } from "../ui";
import type { Conversa } from "../../lib/types";

/** "2026-06-20T14:30:00Z" | "2026-06-20" → "20/06/2026" */
function formatData(iso: string): string {
  const datePart = iso.slice(0, 10);
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

function tituloOuPadrao(c: Conversa): string {
  const t = (c.titulo ?? "").trim();
  return t.length > 0 ? t : "Conversa de apoio";
}

export default function ContinuarConversa({
  conversas,
  onAbrir,
}: {
  conversas: Conversa[];
  onAbrir: () => void;
}): JSX.Element {
  if (!conversas || conversas.length === 0) {
    return (
      <section style={{ marginBottom: 24 }}>
        <h2 style={sectionTitle}>Conversa com IA</h2>
        <div style={{ ...card, textAlign: "center", padding: 32 }}>
          <p style={{ color: T.gray600, fontSize: 14, margin: 0 }}>
            Nenhuma conversa ainda. Inicie um bate-papo para começar.
          </p>
          <button
            type="button"
            onClick={onAbrir}
            style={{ ...btnPrimary, marginTop: 16 }}
          >
            Iniciar chat
          </button>
        </div>
      </section>
    );
  }

  // listConversas already orders by updated_at desc → first is most recent
  const recente = conversas[0];
  const historico = conversas.slice(1);

  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={sectionTitle}>Conversa com IA</h2>

      {/* Main card — most recent conversation */}
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
              {formatData(recente.updated_at)}
            </p>
          </div>
        </div>

        {/* Conversation title / summary */}
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
          {tituloOuPadrao(recente)}
        </blockquote>

        {/* CTA */}
        <button
          type="button"
          onClick={onAbrir}
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
            {historico.map((conversa, idx) => (
              <li
                key={conversa.id}
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
                  {formatData(conversa.updated_at)}
                </span>
                <span style={{ fontSize: 13, color: T.gray700, lineHeight: 1.4 }}>
                  {tituloOuPadrao(conversa)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
