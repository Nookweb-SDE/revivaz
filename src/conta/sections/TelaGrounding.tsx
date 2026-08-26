/**
 * Grounding 5-4-3-2-1. Movida verbatim do Autocuidado.tsx na decomposição.
 * Os passos vêm de _lib/autocuidadoDados.
 */
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Leaf, Wind, X } from "lucide-react";
import { T, btnGhost, btnPrimary, card, sectionTitle } from "../ui";
import Topbar from "./AutocuidadoTopbar";
import { PASSOS_GROUNDING, prefersReducedMotion } from "./_lib/autocuidadoDados";

// ─── Tela: Grounding 5-4-3-2-1 ───────────────────────────────────────────────

function TelaGrounding({ onVoltar }: { onVoltar: () => void }) {
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<string[]>(["", "", "", "", ""]);
  const [concluido, setConcluido] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const passoAtual = PASSOS_GROUNDING[passo];
  const textoAtual = respostas[passo];
  const podeAvancar = textoAtual.trim().length > 0;

  // Auto-focus textarea when step changes
  useEffect(() => {
    if (!concluido) {
      textareaRef.current?.focus();
    }
  }, [passo, concluido]);

  function avancar() {
    if (passo < PASSOS_GROUNDING.length - 1) {
      setPasso((p) => p + 1);
    } else {
      setConcluido(true);
    }
  }

  function voltar() {
    if (passo > 0) setPasso((p) => p - 1);
  }

  function reiniciar() {
    setPasso(0);
    setRespostas(["", "", "", "", ""]);
    setConcluido(false);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl+Enter or Cmd+Enter to advance
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && podeAvancar) {
      e.preventDefault();
      avancar();
    }
  }

  // ── Completion screen ──
  if (concluido) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Topbar titulo="Grounding 5-4-3-2-1" onVoltar={onVoltar} />

        {/* Celebration card */}
        <div
          style={{
            ...card,
            background: "#f0fdf4",
            border: `1px solid ${T.teal100}`,
            padding: "28px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: `radial-gradient(circle at 38% 32%, ${T.teal300}, ${T.teal700} 80%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 20px ${T.teal300}66`,
              marginBottom: 4,
            }}
          >
            <Leaf size={32} color={T.white} aria-hidden="true" />
          </div>
          <h3
            style={{
              margin: 0,
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: 20,
              color: T.teal900,
            }}
          >
            Você fez isso!
          </h3>
          <p
            style={{
              margin: 0,
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: T.teal700,
              lineHeight: 1.5,
            }}
          >
            Seu sistema nervoso agradece 💚
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 500,
              fontSize: 13.5,
              color: T.gray600,
              lineHeight: 1.6,
            }}
          >
            Ao nomear o que está ao seu redor, você ajudou seu cérebro a
            perceber que está seguro agora. Isso é regulação do sistema nervoso
            na prática.
          </p>
        </div>

        {/* Summary of responses */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p
            style={{
              margin: 0,
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              color: T.teal700,
              textTransform: "uppercase",
              letterSpacing: "0.7px",
            }}
          >
            O que você percebeu
          </p>
          {PASSOS_GROUNDING.map((p, i) => (
            <div
              key={p.verbo}
              style={{
                ...card,
                padding: "10px 14px",
                background: "#f0fdf4",
                border: `1px solid ${T.teal100}`,
              }}
            >
              <div
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  color: T.teal700,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginBottom: 2,
                }}
              >
                {p.quantidade} que você {p.verbo}
              </div>
              <div
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 500,
                  fontSize: 13.5,
                  color: T.gray700,
                  lineHeight: 1.45,
                }}
              >
                {respostas[i] || "—"}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            style={{ ...btnPrimary, flex: 1 }}
            onClick={reiniciar}
          >
            Refazer
          </button>
          <button
            type="button"
            style={{
              ...btnGhost,
              padding: "12px 18px",
              border: `1px solid ${T.gray200}`,
              borderRadius: 12,
              fontSize: 14,
              minHeight: 44,
            }}
            onClick={onVoltar}
          >
            Concluir
          </button>
        </div>
      </div>
    );
  }

  // ── Step screen ──
  const progressoPct = Math.round(((passo + 1) / PASSOS_GROUNDING.length) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Topbar titulo="Grounding 5-4-3-2-1" onVoltar={onVoltar} />

      {/* Progress bar */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 7,
          }}
        >
          <span
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              color: T.teal700,
              letterSpacing: "0.3px",
            }}
          >
            Passo {passo + 1} de {PASSOS_GROUNDING.length}
          </span>
          <span
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              color: T.gray600,
            }}
          >
            {progressoPct}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={passo + 1}
          aria-valuemin={1}
          aria-valuemax={PASSOS_GROUNDING.length}
          aria-label={`Passo ${passo + 1} de ${PASSOS_GROUNDING.length}`}
          style={{
            height: 6,
            background: T.teal100,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressoPct}%`,
              background: T.teal500,
              borderRadius: 3,
              transition: "width 0.35s ease",
            }}
          />
        </div>
      </div>

      {/* Big number + prompt card */}
      <div
        style={{
          ...card,
          background: "#f0fdf4",
          border: `1px solid ${T.teal100}`,
          padding: "24px 20px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "center",
        }}
      >
        {/* The large number is the visual anchor — distinctive and calming */}
        <div
          aria-hidden="true"
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            fontSize: 64,
            color: T.teal700,
            lineHeight: 1,
            letterSpacing: "-2px",
            marginBottom: 4,
            opacity: 0.9,
          }}
        >
          {passoAtual.quantidade}
        </div>
        <h3
          style={{
            margin: 0,
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            fontSize: 17,
            color: T.teal900,
            textAlign: "center",
            lineHeight: 1.35,
          }}
        >
          Nomeie {passoAtual.quantidade}{" "}
          {passoAtual.quantidade === 1 ? "coisa" : "coisas"} que você{" "}
          <span style={{ color: T.teal700 }}>{passoAtual.verbo}</span>
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 500,
            fontSize: 13.5,
            color: T.gray600,
            lineHeight: 1.55,
          }}
        >
          {passoAtual.descricao}
        </p>
      </div>

      {/* Textarea */}
      <div>
        <label
          htmlFor={`grounding-passo-${passo}`}
          style={{
            display: "block",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: 12.5,
            color: T.teal700,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Escreva aqui:
        </label>
        <textarea
          ref={textareaRef}
          id={`grounding-passo-${passo}`}
          value={textoAtual}
          onChange={(e) => {
            const nova = [...respostas];
            nova[passo] = e.target.value;
            setRespostas(nova);
          }}
          onKeyDown={handleKey}
          placeholder={passoAtual.placeholder}
          rows={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 500,
            fontSize: 14,
            color: T.gray950,
            background: T.white,
            border: `1.5px solid ${T.teal100}`,
            borderRadius: 12,
            padding: "12px 14px",
            resize: "vertical",
            outline: "none",
            lineHeight: 1.55,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = T.teal500;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = T.teal100;
          }}
        />
        <p
          style={{
            margin: "4px 0 0",
            fontFamily: "'Nunito', sans-serif",
            fontSize: 11.5,
            fontWeight: 600,
            color: T.gray600,
          }}
        >
          Uma por linha, ou separadas por vírgula. Ctrl+Enter para avançar.
        </p>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 10 }}>
        {passo > 0 && (
          <button
            type="button"
            onClick={voltar}
            style={{
              ...btnGhost,
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "12px 16px",
              border: `1px solid ${T.gray200}`,
              borderRadius: 12,
              fontSize: 14,
              minHeight: 44,
              color: T.gray700,
            }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Anterior
          </button>
        )}
        <button
          type="button"
          disabled={!podeAvancar}
          onClick={avancar}
          style={{
            ...btnPrimary,
            flex: 1,
            opacity: podeAvancar ? 1 : 0.45,
            cursor: podeAvancar ? "pointer" : "not-allowed",
          }}
        >
          {passo === PASSOS_GROUNDING.length - 1 ? "Concluir" : "Próximo"}
        </button>
      </div>
    </div>
  );
}

export default TelaGrounding;
