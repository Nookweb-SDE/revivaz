import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Leaf, Wind, X } from "lucide-react";
import { T, btnGhost, btnPrimary, card, sectionTitle } from "../ui";

// ─── Motion preference ────────────────────────────────────────────────────────

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── Types ────────────────────────────────────────────────────────────────────

type Tela = "selecao" | "respiracao" | "grounding";
type FaseRespiracao = "inspire" | "segure" | "expire";

// ─── Breathing constants ──────────────────────────────────────────────────────
// Total cycle: 4 + 7 + 8 = 19s
// Keyframe percentages: 4/19≈21.05%, 11/19≈57.89%

const BREATHE_CSS = `
  @keyframes breathe478 {
    0% {
      transform: scale(1);
      box-shadow: 0 0 24px 0px rgba(0,168,191,0.18);
      animation-timing-function: ease-in-out;
    }
    21.05% {
      transform: scale(1.58);
      box-shadow: 0 0 72px 28px rgba(0,168,191,0.38);
      animation-timing-function: linear;
    }
    57.89% {
      transform: scale(1.58);
      box-shadow: 0 0 72px 28px rgba(0,168,191,0.38);
      animation-timing-function: ease-in-out;
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 24px 0px rgba(0,168,191,0.18);
    }
  }
  @keyframes breathe478-glow {
    0%     { transform: scale(1);    opacity: 0.35; animation-timing-function: ease-in-out; }
    21.05% { transform: scale(1.58); opacity: 0.7;  animation-timing-function: linear; }
    57.89% { transform: scale(1.58); opacity: 0.7;  animation-timing-function: ease-in-out; }
    100%   { transform: scale(1);    opacity: 0.35; }
  }
`;

const FASE_DURACAO: Record<FaseRespiracao, number> = {
  inspire: 4000,
  segure: 7000,
  expire: 8000,
};

const FASE_TEXTO: Record<FaseRespiracao, { instrucao: string; detalhe: string }> = {
  inspire: {
    instrucao: "Inspire...",
    detalhe: "Respire devagar pelo nariz durante 4 segundos",
  },
  segure: {
    instrucao: "Segure...",
    detalhe: "Mantenha o ar nos pulmões durante 7 segundos",
  },
  expire: {
    instrucao: "Expire...",
    detalhe: "Solte o ar lentamente pela boca durante 8 segundos",
  },
};

// ─── Grounding steps ──────────────────────────────────────────────────────────

const PASSOS_GROUNDING = [
  {
    quantidade: 5,
    verbo: "VÊ",
    descricao:
      "Olhe ao redor. Nomeie 5 coisas que você consegue ver agora. Pode ser qualquer coisa — uma cadeira, uma sombra, a cor de uma parede.",
    placeholder: "Ex.: uma janela, minha mão, o teto...",
  },
  {
    quantidade: 4,
    verbo: "pode TOCAR",
    descricao:
      "Sinta a textura do que está por perto. Nomeie 4 coisas que você pode tocar ou que estão em contato com seu corpo.",
    placeholder: "Ex.: o tecido da roupa, a mesa, o chão...",
  },
  {
    quantidade: 3,
    verbo: "OUVE",
    descricao:
      "Fique em silêncio por um instante. Nomeie 3 sons que você consegue perceber agora — próximos ou distantes.",
    placeholder: "Ex.: vento, meu coração, som de carro...",
  },
  {
    quantidade: 2,
    verbo: "CHEIRA",
    descricao:
      "Respire suavemente. Nomeie 2 cheiros que você percebe — ou, se não sentir nada, cheiros de que você gosta.",
    placeholder: "Ex.: café, ar fresco, perfume...",
  },
  {
    quantidade: 1,
    verbo: "SABOREIA",
    descricao:
      "Preste atenção à sua boca. Nomeie 1 gosto que você percebe agora — mesmo que seja apenas a saliva.",
    placeholder: "Ex.: água, menta, um doce...",
  },
];

// ─── Shared Topbar ────────────────────────────────────────────────────────────

function Topbar({
  titulo,
  onVoltar,
  voltarLabel = "Voltar",
}: {
  titulo: string;
  onVoltar: () => void;
  voltarLabel?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        paddingBottom: 2,
      }}
    >
      <button
        type="button"
        aria-label={voltarLabel}
        onClick={onVoltar}
        style={{
          ...btnGhost,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "6px 0",
          fontSize: 14,
          color: T.teal700,
        }}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        {voltarLabel}
      </button>
      <h2
        style={{
          ...sectionTitle,
          margin: 0,
          flex: 1,
          textAlign: "right",
          fontSize: 14,
          fontWeight: 700,
          color: T.teal700,
        }}
      >
        {titulo}
      </h2>
    </div>
  );
}

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

// ─── Export principal ─────────────────────────────────────────────────────────

export default function Autocuidado({
  onFechar,
}: {
  onFechar: () => void;
}): JSX.Element {
  const [tela, setTela] = useState<Tela>("selecao");

  return (
    // Negative horizontal margin to bleed the green background to container edges;
    // re-applies the same padding inside. Matches AppShell's paddingLeft/Right: 16.
    <section
      aria-label="Autocuidado — técnicas guiadas"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        margin: "-20px -16px -80px",
        padding: "20px 16px 80px",
        minHeight: "100vh",
        background: "#f0fdf4",
      }}
    >
      {tela === "selecao" && (
        <TelaSelecao
          onRespiracao={() => setTela("respiracao")}
          onGrounding={() => setTela("grounding")}
          onFechar={onFechar}
        />
      )}
      {tela === "respiracao" && (
        <TelaRespiracao onVoltar={() => setTela("selecao")} />
      )}
      {tela === "grounding" && (
        <TelaGrounding onVoltar={() => setTela("selecao")} />
      )}
    </section>
  );
}
