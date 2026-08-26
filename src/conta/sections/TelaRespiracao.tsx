/**
 * Respiração 4-7-8. Movida verbatim do Autocuidado.tsx na decomposição.
 * Os tempos e o CSS da animação vêm de _lib/autocuidadoDados.
 */
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Leaf, Wind, X } from "lucide-react";
import { T, btnGhost, btnPrimary, card, sectionTitle } from "../ui";
import Topbar from "./AutocuidadoTopbar";
import {
  BREATHE_CSS,
  FASE_DURACAO,
  FASE_TEXTO,
  prefersReducedMotion,
  type FaseRespiracao,
} from "./_lib/autocuidadoDados";

// ─── Tela: Respiração 4-7-8 ───────────────────────────────────────────────────

function TelaRespiracao({ onVoltar }: { onVoltar: () => void }) {
  const [rodando, setRodando] = useState(false);
  const [fase, setFase] = useState<FaseRespiracao>("inspire");
  const [ciclos, setCiclos] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  // Use refs to avoid stale closures inside setTimeout callbacks
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rodandoRef = useRef(false);
  const faseRef = useRef<FaseRespiracao>("inspire");

  function limparTimer() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  // Defined outside useEffect so it can be called from event handlers;
  // reads from refs to avoid stale closure over state.
  function avancarFase() {
    if (!rodandoRef.current) return;
    const atual = faseRef.current;
    let proxima: FaseRespiracao;
    if (atual === "inspire") {
      proxima = "segure";
    } else if (atual === "segure") {
      proxima = "expire";
    } else {
      proxima = "inspire";
      setCiclos((c) => c + 1);
    }
    faseRef.current = proxima;
    setFase(proxima);
    timerRef.current = setTimeout(avancarFase, FASE_DURACAO[proxima]);
  }

  function iniciar() {
    limparTimer();
    setCiclos(0);
    faseRef.current = "inspire";
    setFase("inspire");
    setAnimKey((k) => k + 1);
    rodandoRef.current = true;
    setRodando(true);
    // Schedule first phase transition after 4s (inspire duration)
    timerRef.current = setTimeout(avancarFase, FASE_DURACAO["inspire"]);
  }

  function parar() {
    limparTimer();
    rodandoRef.current = false;
    setRodando(false);
    faseRef.current = "inspire";
    setFase("inspire");
  }

  // Keep rodandoRef in sync (for cases where setRodando triggers re-render)
  useEffect(() => {
    rodandoRef.current = rodando;
  }, [rodando]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      limparTimer();
      rodandoRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { instrucao, detalhe } = FASE_TEXTO[fase];

  const faseIndicators: FaseRespiracao[] = ["inspire", "segure", "expire"];
  // Proportional widths for the phase indicator (4s, 7s, 8s)
  const faseWidths: Record<FaseRespiracao, number> = {
    inspire: 28,
    segure: 48,
    expire: 54,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 120px)",
      }}
    >
      <style>{BREATHE_CSS}</style>

      <Topbar titulo="Respiração 4-7-8" onVoltar={onVoltar} />

      {/* Cycle counter */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          textAlign: "center",
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color: ciclos > 0 ? T.teal700 : T.gray600,
          padding: "20px 0 0",
          minHeight: 24,
          letterSpacing: "0.3px",
        }}
      >
        {!rodando && ciclos === 0
          ? "Sente-se confortavelmente e respire com o círculo"
          : ciclos === 0
          ? ""
          : `${ciclos} ciclo${ciclos !== 1 ? "s" : ""} completo${ciclos !== 1 ? "s" : ""}`}
      </div>

      {/* Breathing circle — vertically centered */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "28px 0",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 180,
            height: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Outer diffuse glow */}
          <div
            key={`glow-${animKey}`}
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -36,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${T.teal100} 0%, transparent 65%)`,
              transformOrigin: "center",
              animation:
                rodando && !prefersReducedMotion
                  ? "breathe478-glow 19s ease-in-out infinite"
                  : "none",
            }}
          />
          {/* Main circle */}
          <div
            key={`circle-${animKey}`}
            aria-hidden="true"
            style={{
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: `radial-gradient(circle at 38% 32%, ${T.teal300}, ${T.teal700} 80%)`,
              transformOrigin: "center",
              animation:
                rodando && !prefersReducedMotion
                  ? "breathe478 19s ease-in-out infinite"
                  : "none",
              boxShadow: rodando
                ? `0 0 40px ${T.teal500}55`
                : `0 4px 20px ${T.teal100}`,
              transition: rodando ? "none" : "box-shadow 0.6s ease",
            }}
          />
          {/* Reduced-motion: static phase indicator dot */}
          {prefersReducedMotion && rodando && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: T.white,
                opacity: 0.8,
              }}
            />
          )}
        </div>
      </div>

      {/* Instruction text */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          textAlign: "center",
          padding: "0 20px",
          minHeight: 72,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: T.teal900,
            letterSpacing: "-0.4px",
            lineHeight: 1.15,
          }}
        >
          {rodando ? instrucao : ""}
        </div>
        {rodando && (
          <div
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 600,
              fontSize: 13.5,
              color: T.gray600,
              lineHeight: 1.5,
            }}
          >
            {detalhe}
          </div>
        )}
      </div>

      {/* Phase strip indicator */}
      <div
        aria-hidden="true"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          padding: "14px 0 4px",
          minHeight: 20,
        }}
      >
        {rodando &&
          faseIndicators.map((f) => (
            <div
              key={f}
              style={{
                height: 4,
                width: faseWidths[f],
                borderRadius: 2,
                background: f === fase ? T.teal500 : T.teal100,
                transition: "background 0.4s ease",
              }}
            />
          ))}
      </div>

      {/* Start / stop button */}
      <div style={{ paddingTop: 16 }}>
        <button
          type="button"
          onClick={rodando ? parar : iniciar}
          style={{
            ...btnPrimary,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 16,
            padding: "14px 20px",
          }}
        >
          {rodando ? "Pausar" : ciclos > 0 ? "Recomeçar" : "Iniciar"}
        </button>
      </div>

      <p
        style={{
          margin: "10px 0 0",
          fontFamily: "'Nunito', sans-serif",
          fontSize: 12,
          fontWeight: 600,
          color: T.gray600,
          textAlign: "center",
          letterSpacing: "0.5px",
        }}
      >
        4 s inspire &nbsp;·&nbsp; 7 s segure &nbsp;·&nbsp; 8 s expire
      </p>
    </div>
  );
}

export default TelaRespiracao;
