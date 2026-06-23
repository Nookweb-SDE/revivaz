import React, { useState } from "react";
import { FileText, Download, Send, Pill } from "lucide-react";
import { T, card, sectionTitle, btnGhost } from "../ui";
import type { ReceitaUI as Receita } from "../types";

/* ── helpers ──────────────────────────────────────────────── */

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/* ── sub-components ───────────────────────────────────────── */

function ReceitaIcon() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${T.teal100} 0%, ${T.teal300}33 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: `1px solid ${T.teal300}55`,
      }}
    >
      <FileText size={20} color={T.teal700} strokeWidth={1.8} />
    </div>
  );
}

function ReceitaCard({ receita }: { receita: Receita }) {
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);

  function handleDownload() {
    setDownloading(true);
    setTimeout(() => {
      alert("Baixando receita…");
      setDownloading(false);
    }, 600);
  }

  function handleWhatsapp() {
    setSending(true);
    setTimeout(() => {
      alert("Enviado no WhatsApp");
      setSending(false);
    }, 600);
  }

  return (
    <article
      aria-label={`Receita de ${receita.profissional} em ${formatDate(receita.data)}`}
      style={{
        ...card,
        display: "flex",
        flexDirection: "column",
        gap: 0,
        padding: 0,
        overflow: "hidden",
        transition: "box-shadow 0.18s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 4px 20px rgba(0,122,140,0.13)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 2px 12px rgba(0,0,0,.06)";
      }}
    >
      {/* Accent strip */}
      <div
        aria-hidden="true"
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${T.teal500} 0%, ${T.teal300} 100%)`,
        }}
      />

      {/* Card body */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <ReceitaIcon />
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
              {receita.profissional}
            </div>
            <div
              style={{
                fontFamily: "'Nunito',sans-serif",
                fontSize: 12,
                color: T.gray600,
                marginTop: 3,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Pill size={11} color={T.teal500} aria-hidden="true" />
              {formatDate(receita.data)}
            </div>
          </div>
        </div>

        {/* Resumo */}
        <p
          style={{
            margin: 0,
            fontFamily: "'Nunito',sans-serif",
            fontSize: 13,
            color: T.gray700,
            lineHeight: 1.55,
            background: T.teal050,
            borderRadius: 10,
            padding: "10px 12px",
            borderLeft: `3px solid ${T.teal300}`,
          }}
        >
          {receita.resumo}
        </p>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {/* Baixar PDF */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            aria-label={`Baixar PDF da receita de ${receita.profissional}`}
            style={{
              ...btnGhost,
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: `1.5px solid ${T.teal700}`,
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 700,
              color: T.teal700,
              minHeight: 36,
              opacity: downloading ? 0.6 : 1,
              transition: "opacity 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!downloading) {
                (e.currentTarget as HTMLButtonElement).style.background = T.teal050;
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <Download size={13} aria-hidden="true" />
            {downloading ? "Baixando…" : "Baixar PDF"}
          </button>

          {/* Reenviar no WhatsApp */}
          <button
            onClick={handleWhatsapp}
            disabled={sending}
            aria-label={`Reenviar receita de ${receita.profissional} no WhatsApp`}
            style={{
              ...btnGhost,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: sending ? "#1DA85188" : "#1DA851",
              color: "#fff",
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 700,
              minHeight: 36,
              border: "none",
              opacity: sending ? 0.75 : 1,
              transition: "opacity 0.15s, background 0.15s",
              cursor: sending ? "default" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!sending) {
                (e.currentTarget as HTMLButtonElement).style.background = "#168a41";
              }
            }}
            onMouseLeave={(e) => {
              if (!sending) {
                (e.currentTarget as HTMLButtonElement).style.background = "#1DA851";
              }
            }}
          >
            <Send size={13} aria-hidden="true" />
            {sending ? "Enviando…" : "Reenviar no WhatsApp"}
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "36px 16px",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: T.teal050,
          border: `1.5px dashed ${T.teal300}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FileText size={24} color={T.teal300} strokeWidth={1.5} />
      </div>
      <div>
        <p
          style={{
            margin: "0 0 4px",
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: T.gray700,
          }}
        >
          Nenhuma receita registrada
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: "'Nunito',sans-serif",
            fontSize: 13,
            color: T.gray600,
          }}
        >
          Suas receitas digitais aparecerão aqui após a consulta.
        </p>
      </div>
    </div>
  );
}

/* ── main export ──────────────────────────────────────────── */

export default function Receitas({
  receitas,
}: {
  receitas: Receita[];
}): JSX.Element {
  return (
    <section aria-label="Receitas digitais">
      <h2 style={sectionTitle}>Receitas</h2>

      {receitas.length === 0 ? (
        <div style={{ ...card, padding: 0 }}>
          <EmptyState />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {receitas.map((r) => (
            <ReceitaCard key={r.id} receita={r} />
          ))}
        </div>
      )}
    </section>
  );
}
