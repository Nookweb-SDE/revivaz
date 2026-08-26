import React, { useState } from "react";
import { FileText, Download, Pill } from "lucide-react";
import { T, card, sectionTitle, btnGhost } from "../ui";
import { baixarReceitaPdf } from "../../lib/data";
import type { ReceitaUI as Receita } from "../types";

/* ── helpers ──────────────────────────────────────────────── */

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function isVencida(validade: string): boolean {
  return new Date(validade + "T00:00:00") < new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");
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

function ReceitaCard({ receita, demo = false }: { receita: Receita; demo?: boolean }) {
  const [downloading, setDownloading] = useState(false);
  // Uma mensagem só, ao lado dos botões: o usuário precisa ver o que aconteceu
  // de verdade — inclusive quando NÃO aconteceu (sem telefone, sessão expirada).
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function handleDownload() {
    if (demo) {
      setAviso({ tipo: "erro", texto: "Receita de exemplo — não há PDF para baixar." });
      return;
    }
    setAviso(null);
    setDownloading(true);
    try {
      await baixarReceitaPdf(receita.id);
      setAviso({ tipo: "ok", texto: "PDF baixado." });
    } catch (err) {
      setAviso({
        tipo: "erro",
        texto: err instanceof Error ? err.message : "Não consegui gerar o PDF.",
      });
    } finally {
      setDownloading(false);
    }
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
            whiteSpace: "pre-wrap",
          }}
        >
          {receita.resumo}
        </p>

        {/* Validade */}
        {receita.validade && (() => {
          const vencida = isVencida(receita.validade);
          return (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "'Nunito',sans-serif",
                background: vencida ? "#FEE2E2" : "#D1FAE5",
                color: vencida ? "#991B1B" : "#065F46",
                alignSelf: "flex-start",
              }}
              aria-label={vencida ? `Receita vencida em ${formatDate(receita.validade)}` : `Válida até ${formatDate(receita.validade)}`}
            >
              {vencida ? "Vencida em " : "Válida até "}
              {formatDate(receita.validade)}
            </div>
          );
        })()}

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

          {/* O reenvio por WhatsApp saiu junto com o canal. O PDF fica aqui. */}
        </div>

        {aviso && (
          <div
            role="status"
            aria-live="polite"
            style={{
              marginTop: 10,
              padding: "8px 12px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Nunito',sans-serif",
              background: aviso.tipo === "ok" ? "#D1FAE5" : "#FEE2E2",
              color: aviso.tipo === "ok" ? "#065F46" : "#991B1B",
            }}
          >
            {aviso.texto}
          </div>
        )}
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
  demo = false,
}: {
  receitas: Receita[];
  /** Modo demonstração: os cartões são exemplos, então baixar/enviar não age. */
  demo?: boolean;
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
            <ReceitaCard key={r.id} receita={r} demo={demo} />
          ))}
        </div>
      )}
    </section>
  );
}
