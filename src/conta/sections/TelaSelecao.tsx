/**
 * Escolha do exercício. Movida verbatim do Autocuidado.tsx na decomposição.
 */
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Leaf, Wind, X } from "lucide-react";
import { T, btnGhost, btnPrimary, card, sectionTitle } from "../ui";
import Topbar from "./AutocuidadoTopbar";
import type { Tela } from "./_lib/autocuidadoDados";

// ─── Tela: Seleção ────────────────────────────────────────────────────────────

function TelaSelecao({
  onRespiracao,
  onGrounding,
  onFechar,
}: {
  onRespiracao: () => void;
  onGrounding: () => void;
  onFechar: () => void;
}) {
  const TECNICAS = [
    {
      icone: <Wind size={26} color={T.teal700} aria-hidden="true" />,
      titulo: "Respiração 4-7-8",
      descricao:
        "Sincronize sua respiração num ritmo específico para sinalizar calma ao sistema nervoso. Indicado para ansiedade, agitação e antes de dormir.",
      tempo: "5 min",
      onClick: onRespiracao,
    },
    {
      icone: <Leaf size={26} color={T.teal700} aria-hidden="true" />,
      titulo: "Grounding 5-4-3-2-1",
      descricao:
        "Ancore-se no presente ativando os cinco sentidos em sequência. Ajuda a sair do loop de pensamentos acelerados e a perceber que você está seguro agora.",
      tempo: "3 min",
      onClick: onGrounding,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ ...sectionTitle, margin: 0, fontSize: 17 }}>
          Autocuidado
        </h2>
        <button
          type="button"
          aria-label="Fechar autocuidado"
          onClick={onFechar}
          style={{
            ...btnGhost,
            display: "flex",
            alignItems: "center",
            padding: 6,
            color: T.gray600,
          }}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: "'Nunito', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          color: T.gray600,
          lineHeight: 1.55,
        }}
      >
        Técnicas baseadas em evidências para regular o sistema nervoso. Escolha
        uma e siga o guia no seu ritmo.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {TECNICAS.map((t) => (
          <button
            key={t.titulo}
            type="button"
            onClick={t.onClick}
            style={{
              ...card,
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: 18,
              background: "#f0fdf4",
              border: `1px solid ${T.teal100}`,
              minHeight: 44,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: T.white,
                border: `1px solid ${T.teal100}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 1px 4px rgba(0,120,140,.07)",
              }}
            >
              {t.icone}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 800,
                  fontSize: 15,
                  color: T.teal900,
                  marginBottom: 4,
                }}
              >
                {t.titulo}
              </div>
              <div
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 500,
                  fontSize: 13,
                  color: T.gray600,
                  lineHeight: 1.5,
                  marginBottom: 8,
                }}
              >
                {t.descricao}
              </div>
              <span
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  color: T.teal700,
                  background: T.white,
                  padding: "3px 10px",
                  borderRadius: 20,
                  border: `1px solid ${T.teal100}`,
                  letterSpacing: "0.2px",
                }}
              >
                {t.tempo}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TelaSelecao;
