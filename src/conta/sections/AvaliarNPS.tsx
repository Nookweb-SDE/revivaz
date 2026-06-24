import React, { useState } from "react";
import { T, card, sectionTitle, btnPrimary } from "../ui";
import type { ConsultaUI as Consulta } from "../types";
import { enviarAvaliacao } from "../../lib/data";

/* ─── score color helper ─── */
function scoreColor(score: number | null, selected: number): string {
  if (score === null || selected !== score) return T.gray100;
  if (score <= 6) return "#FDECEA";   // detractor — soft red
  if (score <= 8) return "#FFF8E1";   // passive — soft amber
  return T.teal100;                   // promoter — teal
}

function scoreBorderColor(score: number | null, selected: number): string {
  if (score === null || selected !== score) return T.gray200;
  if (score <= 6) return "#E5484D";
  if (score <= 8) return "#F59E0B";
  return T.teal700;
}

function scoreTextColor(score: number | null, selected: number): string {
  if (score === null || selected !== score) return T.gray600;
  if (score <= 6) return "#E5484D";
  if (score <= 8) return "#D97706";
  return T.teal700;
}

function npsLabel(score: number): string {
  if (score <= 6) return "Precisa melhorar";
  if (score <= 8) return "Foi razoável";
  return "Recomendaria!";
}

/* ─── main ─── */
export default function AvaliarNPS({ consulta }: { consulta?: Consulta }): JSX.Element {
  const [score, setScore] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!consulta) return <></>;

  async function handleEnviar() {
    if (score === null || enviando || !consulta) return;
    setErro(null);
    setEnviando(true);
    try {
      await enviarAvaliacao(consulta.id, score, comentario.trim() || undefined);
      setEnviado(true);
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar sua avaliação. Tente novamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div
        style={{
          ...card,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          padding: "28px 20px",
          textAlign: "center",
          background: `linear-gradient(135deg, ${T.teal050} 0%, #E8F7F9 100%)`,
          border: `1.5px solid ${T.teal300}`,
        }}
        role="status"
        aria-live="polite"
      >
        <span style={{ fontSize: 40, lineHeight: 1 }} aria-hidden="true">
          💚
        </span>
        <p
          style={{
            margin: 0,
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: T.teal900,
          }}
        >
          Obrigado pela sua avaliação! 💚
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 500,
            fontSize: 14,
            color: T.gray600,
            lineHeight: 1.5,
          }}
        >
          Sua opinião nos ajuda a melhorar os atendimentos.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Avaliar atendimento">
      <h2 style={sectionTitle}>Avaliar atendimento</h2>
      <div
        style={{
          ...card,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* question */}
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: T.gray950,
              lineHeight: 1.4,
            }}
          >
            Como foi sua consulta com{" "}
            <span style={{ color: T.teal700 }}>{consulta.profissional}</span>?
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 500,
              fontSize: 13,
              color: T.gray600,
            }}
          >
            Dê uma nota de 0 (péssimo) a 10 (excelente)
          </p>
        </div>

        {/* score row */}
        <div
          role="group"
          aria-label="Nota de 0 a 10"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              onClick={() => setScore(i)}
              aria-pressed={score === i}
              aria-label={`Nota ${i}`}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: `2px solid ${scoreBorderColor(score, i)}`,
                background: scoreColor(score, i),
                color: scoreTextColor(score, i),
                fontFamily: "'Nunito',sans-serif",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              {i}
            </button>
          ))}
        </div>

        {/* scale labels */}
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: -12,
          }}
        >
          <span
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontSize: 11,
              color: T.gray600,
            }}
          >
            Péssimo
          </span>
          <span
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontSize: 11,
              color: T.gray600,
            }}
          >
            Excelente
          </span>
        </div>

        {/* dynamic NPS label */}
        {score !== null && (
          <p
            style={{
              margin: 0,
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: score <= 6 ? "#E5484D" : score <= 8 ? "#D97706" : T.teal700,
              textAlign: "center",
            }}
            aria-live="polite"
          >
            {npsLabel(score)}
          </p>
        )}

        {/* divider */}
        <div
          aria-hidden="true"
          style={{ borderTop: `1px solid ${T.gray100}`, margin: "0 -4px" }}
        />

        {/* comment */}
        <div>
          <label
            htmlFor="nps-comentario"
            style={{
              display: "block",
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: T.gray700,
              marginBottom: 8,
            }}
          >
            Comentário (opcional)
          </label>
          <textarea
            id="nps-comentario"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Compartilhe sua experiência…"
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 12,
              border: `1.5px solid ${T.gray200}`,
              padding: "12px 14px",
              fontFamily: "'Nunito',sans-serif",
              fontSize: 14,
              color: T.gray950,
              resize: "vertical",
              outline: "none",
              background: T.gray050,
              lineHeight: 1.5,
              minHeight: 80,
            }}
          />
        </div>

        {/* error */}
        {erro && (
          <p
            role="alert"
            style={{
              margin: 0,
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color: T.red,
              textAlign: "center",
            }}
          >
            {erro}
          </p>
        )}

        {/* submit */}
        <button
          style={{
            ...btnPrimary,
            width: "100%",
            fontFamily: "'Nunito',sans-serif",
            fontSize: 15,
            fontWeight: 800,
            borderRadius: 14,
            minHeight: 52,
            opacity: score === null || enviando ? 0.55 : 1,
            cursor: score === null || enviando ? "not-allowed" : "pointer",
            transition: "opacity 0.2s",
          }}
          disabled={score === null || enviando}
          onClick={handleEnviar}
          aria-disabled={score === null || enviando}
        >
          {enviando ? "Enviando…" : "Enviar avaliação"}
        </button>
      </div>
    </section>
  );
}
