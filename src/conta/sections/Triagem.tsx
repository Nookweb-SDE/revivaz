import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Phone,
  X,
} from "lucide-react";
import { T, card, sectionTitle, btnPrimary, btnGhost } from "../ui";
import {
  PHQ9_ITENS,
  GAD7_ITENS,
  ESCALA_LIKERT,
  scorePHQ9,
  scoreGAD7,
  severidadePHQ9,
  severidadeGAD7,
  riscoIdeacao,
  sugestaoRoteamento,
  type Instrumento,
  type ItemTriagem,
} from "../../triagem/instrumentos";
import { CRISIS_RESOURCES } from "../../acolhimento/crisis";
import { criarTriagem, getMinhasTriagens } from "../../lib/data";
import type { Triagem as TriagemRow } from "../../lib/types";

// ─── COMPLIANCE: disclaimer fixo, exibido em todas as telas ──────────────────
// "Isto é uma autoavaliação, não um diagnóstico nem atendimento clínico;
//  converse com um profissional." Nenhuma tela escreve nome de doença; a
// severidade é sempre apresentada como FAIXA + sugestão de próximo passo.
const DISCLAIMER =
  "Isto é uma autoavaliação, não um diagnóstico nem atendimento clínico; converse com um profissional.";

const ENUNCIADO_TRONCO =
  "Durante as últimas 2 semanas, com que frequência você foi incomodado(a) por algum dos problemas abaixo?";

// Rótulos PT-BR das faixas (genéricos, sem nome de doença).
const SEV_ROTULO: Record<string, string> = {
  minima: "Sintomas mínimos",
  leve: "Sintomas leves",
  moderada: "Sintomas moderados",
  moderada_grave: "Sintomas moderados a intensos",
  grave: "Sintomas intensos",
};

// Cor da faixa (paleta teal/âmbar/vermelho — NUNCA roxo).
const SEV_COR: Record<string, string> = {
  minima: T.green500,
  leve: T.teal500,
  moderada: "#F59E0B",
  moderada_grave: "#EA580C",
  grave: T.red,
};

const INSTRUMENTOS: {
  id: Instrumento;
  titulo: string;
  resumo: string;
  itens: ItemTriagem[];
  maxScore: number;
}[] = [
  {
    id: "phq9",
    titulo: "Como está seu ânimo",
    resumo: "9 perguntas rápidas sobre como você tem se sentido.",
    itens: PHQ9_ITENS,
    maxScore: 27,
  },
  {
    id: "gad7",
    titulo: "Como está sua tranquilidade",
    resumo: "7 perguntas rápidas sobre preocupação e tensão.",
    itens: GAD7_ITENS,
    maxScore: 21,
  },
];

type Resultado = {
  instrumento: Instrumento;
  respostas: number[];
  score: number;
  maxScore: number;
  severidade: string;
  risco: boolean;
  sugestao: { nivel: "autoajuda" | "agendar" | "urgente"; texto: string };
};

// ─── Disclaimer pill (reutilizado em todas as telas) ─────────────────────────

function DisclaimerBox() {
  return (
    <p
      role="note"
      style={{
        margin: 0,
        padding: "10px 12px",
        background: T.teal050,
        border: `1px solid ${T.teal100}`,
        borderRadius: 10,
        fontFamily: "'Nunito',sans-serif",
        fontSize: 12.5,
        fontWeight: 600,
        color: T.teal900,
        lineHeight: 1.45,
      }}
    >
      {DISCLAIMER}
    </p>
  );
}

// ─── Cards de crise (reusa CRISIS_RESOURCES de crisis.ts) ─────────────────────

function CrisisResources() {
  return (
    <div
      role="alert"
      style={{
        background: "#3D1212",
        border: `1px solid ${T.red}`,
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={20} color="#FFB3B3" aria-hidden="true" />
        <strong
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontSize: 15,
            color: "#FFD5D5",
          }}
        >
          Você não está sozinho(a). Procure ajuda agora.
        </strong>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: "'Nunito',sans-serif",
          fontSize: 13.5,
          color: "#FFE0E0",
          lineHeight: 1.5,
          fontWeight: 600,
        }}
      >
        Você indicou pensamentos de se ferir ou de que seria melhor não estar
        aqui. Isso merece atenção imediata. Fale com alguém de confiança e
        procure apoio agora — ligar é gratuito e sigiloso.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CRISIS_RESOURCES.map((r) => {
          const isTel = /^\d+$/.test(r.contato);
          return (
            <div
              key={r.nome}
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Phone size={18} color="#FFB3B3" aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Nunito',sans-serif",
                    fontWeight: 800,
                    fontSize: 13.5,
                    color: "#FFFFFF",
                  }}
                >
                  {isTel ? (
                    <a
                      href={`tel:${r.contato}`}
                      aria-label={`Ligar para ${r.nome}, ${r.contato}`}
                      style={{ color: "#FFCCCC", textDecoration: "underline" }}
                    >
                      {r.contato}
                    </a>
                  ) : (
                    <span style={{ color: "#FFCCCC" }}>{r.contato}</span>
                  )}{" "}
                  · {r.nome}
                </div>
                <div
                  style={{
                    fontFamily: "'Nunito',sans-serif",
                    fontWeight: 500,
                    fontSize: 12,
                    color: "#FFD5D5",
                    lineHeight: 1.4,
                    marginTop: 2,
                  }}
                >
                  {r.descricao}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Grupo de rádio Likert (acessível) ───────────────────────────────────────

function LikertGroup({
  item,
  numero,
  total,
  valor,
  onChange,
}: {
  item: ItemTriagem;
  numero: number;
  total: number;
  valor: number | null;
  onChange: (v: number) => void;
}) {
  const labelId = `triagem-item-${item.id}`;

  // Roving tabindex + navegação por setas (padrão WAI-ARIA radiogroup).
  // Mantém refs aos botões role="radio" p/ mover foco com ArrowUp/Down/Home/End.
  const optRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  // Índice que deve ficar tabulável: o selecionado, ou o 1º se nada marcado.
  const idxSelecionado = ESCALA_LIKERT.findIndex((o) => o.valor === valor);
  const idxTabbable = idxSelecionado >= 0 ? idxSelecionado : 0;

  function focarOpcao(idx: number) {
    const n = ESCALA_LIKERT.length;
    const alvo = ((idx % n) + n) % n; // wrap circular
    const opt = ESCALA_LIKERT[alvo];
    onChange(opt.valor); // setas selecionam (comportamento nativo de radio)
    optRefs.current[alvo]?.focus();
  }

  function onKeyDownGrupo(e: React.KeyboardEvent<HTMLDivElement>) {
    const atual = idxSelecionado >= 0 ? idxSelecionado : 0;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        focarOpcao(atual + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        focarOpcao(atual - 1);
        break;
      case "Home":
        e.preventDefault();
        focarOpcao(0);
        break;
      case "End":
        e.preventDefault();
        focarOpcao(ESCALA_LIKERT.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div style={{ ...card, padding: 14 }}>
      <div
        style={{
          fontFamily: "'Nunito',sans-serif",
          fontSize: 12,
          fontWeight: 700,
          color: T.teal700,
          marginBottom: 6,
        }}
      >
        Pergunta {numero} de {total}
      </div>
      <p
        id={labelId}
        style={{
          margin: "0 0 12px",
          fontFamily: "'Nunito',sans-serif",
          fontSize: 15,
          fontWeight: 700,
          color: T.gray950,
          lineHeight: 1.4,
        }}
      >
        {item.texto}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={onKeyDownGrupo}
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      >
        {ESCALA_LIKERT.map((opt, i) => {
          const selecionado = valor === opt.valor;
          return (
            <button
              key={opt.valor}
              ref={(el) => {
                optRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selecionado}
              tabIndex={i === idxTabbable ? 0 : -1}
              onClick={() => onChange(opt.valor)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "left",
                padding: "11px 12px",
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: "'Nunito',sans-serif",
                fontWeight: 600,
                fontSize: 14,
                minHeight: 44,
                background: selecionado ? T.teal050 : T.white,
                color: selecionado ? T.teal900 : T.gray700,
                border: `1.5px solid ${selecionado ? T.teal500 : T.gray200}`,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: `2px solid ${selecionado ? T.teal700 : T.gray200}`,
                  background: selecionado ? T.teal700 : "transparent",
                  boxShadow: selecionado
                    ? `inset 0 0 0 3px ${T.white}`
                    : "none",
                }}
              />
              {opt.rotulo}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tela de resultado ───────────────────────────────────────────────────────

function ResultadoView({
  res,
  demo,
  onAgendar,
  onRefazer,
  onFechar,
}: {
  res: Resultado;
  demo: boolean;
  onAgendar: () => void;
  onRefazer: () => void;
  onFechar: () => void;
}) {
  const cor = SEV_COR[res.severidade] ?? T.teal700;
  const sevRotulo = SEV_ROTULO[res.severidade] ?? "Resultado";

  return (
    <div
      aria-live="polite"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <DisclaimerBox />

      {res.risco && <CrisisResources />}

      {/* Score + faixa — sempre como pontuação, nunca nome de doença */}
      <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `${cor}1A`,
              border: `2px solid ${cor}`,
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: cor,
            }}
          >
            {res.score}
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Nunito',sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: T.gray600,
              }}
            >
              Sua pontuação: {res.score} de {res.maxScore}
            </div>
            <div
              style={{
                fontFamily: "'Nunito',sans-serif",
                fontSize: 17,
                fontWeight: 800,
                color: T.gray950,
              }}
            >
              {sevRotulo}
            </div>
          </div>
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: "'Nunito',sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: T.gray700,
            lineHeight: 1.5,
          }}
        >
          {res.sugestao.texto}
        </p>
      </div>

      {/* CTA: agendar quando a sugestão pede (agendar) ou urgente humano */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(res.sugestao.nivel === "agendar" ||
          res.sugestao.nivel === "urgente") && (
          <button
            type="button"
            style={{
              ...btnPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onClick={onAgendar}
          >
            <CalendarPlus size={18} aria-hidden="true" />
            Agendar conversa com profissional
          </button>
        )}
        {res.sugestao.nivel === "autoajuda" && (
          <a
            href="/autocuidado"
            style={{
              ...btnPrimary,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <BookOpen size={18} aria-hidden="true" />
            Explorar autocuidado
          </a>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" style={btnGhost} onClick={onRefazer}>
            Refazer autoavaliação
          </button>
          <button type="button" style={btnGhost} onClick={onFechar}>
            Voltar
          </button>
        </div>
      </div>

      {demo && (
        <p
          role="status"
          style={{
            margin: 0,
            fontFamily: "'Nunito',sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: "#92400E",
            background: "#FFF8E1",
            border: "1px solid #F59E0B",
            borderRadius: 8,
            padding: "8px 10px",
          }}
        >
          Modo demonstração — este resultado não foi salvo.
        </p>
      )}
    </div>
  );
}

// ─── Histórico resumido ──────────────────────────────────────────────────────

function fmtData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function Historico({ itens }: { itens: TriagemRow[] }) {
  if (itens.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3
        style={{
          ...sectionTitle,
          fontSize: 14,
          margin: 0,
          color: T.gray700,
        }}
      >
        Suas autoavaliações anteriores
      </h3>
      {itens.slice(0, 6).map((t) => {
        const cor = SEV_COR[t.severidade] ?? T.teal700;
        const nome =
          t.instrumento === "phq9" ? "Ânimo" : "Tranquilidade";
        const max = t.instrumento === "phq9" ? 27 : 21;
        return (
          <div
            key={t.id}
            style={{
              ...card,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: cor,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Nunito',sans-serif",
                  fontWeight: 700,
                  fontSize: 13.5,
                  color: T.gray950,
                }}
              >
                {nome} — {SEV_ROTULO[t.severidade] ?? "Resultado"}
              </div>
              <div
                style={{
                  fontFamily: "'Nunito',sans-serif",
                  fontWeight: 500,
                  fontSize: 12,
                  color: T.gray600,
                }}
              >
                {t.score} de {max} · {fmtData(t.created_at)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

type Etapa = "escolha" | "questionario" | "resultado";

export default function Triagem({
  demo = false,
  onFechar,
  onAgendar,
}: {
  demo?: boolean;
  onFechar: () => void;
  onAgendar: () => void;
}): JSX.Element {
  const [etapa, setEtapa] = useState<Etapa>("escolha");
  const [instrumento, setInstrumento] = useState<Instrumento | null>(null);
  const [respostas, setRespostas] = useState<(number | null)[]>([]);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [historico, setHistorico] = useState<TriagemRow[]>([]);

  const cfg = useMemo(
    () => INSTRUMENTOS.find((i) => i.id === instrumento) ?? null,
    [instrumento]
  );

  // Carrega histórico (apenas modo real).
  useEffect(() => {
    if (demo) return;
    let vivo = true;
    getMinhasTriagens()
      .then((rows) => {
        if (vivo) setHistorico(rows);
      })
      .catch(() => {
        /* histórico é não-crítico */
      });
  }, [demo]);

  function iniciar(id: Instrumento) {
    const c = INSTRUMENTOS.find((i) => i.id === id)!;
    setInstrumento(id);
    setRespostas(Array(c.itens.length).fill(null));
    setResultado(null);
    setErroSalvar(null);
    setEtapa("questionario");
  }

  function setResposta(idx: number, v: number) {
    setRespostas((prev) => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
  }

  const completo =
    cfg !== null &&
    respostas.length === cfg.itens.length &&
    respostas.every((r) => r !== null);

  async function concluir() {
    if (!cfg || !instrumento || !completo) return;
    const nums = respostas as number[];
    const score =
      instrumento === "phq9" ? scorePHQ9(nums) : scoreGAD7(nums);
    const severidade =
      instrumento === "phq9"
        ? severidadePHQ9(score)
        : severidadeGAD7(score);
    const risco = riscoIdeacao(instrumento, nums);
    const sugestao = sugestaoRoteamento(severidade, risco);

    const res: Resultado = {
      instrumento,
      respostas: nums,
      score,
      maxScore: cfg.maxScore,
      severidade,
      risco,
      sugestao,
    };
    setResultado(res);
    setEtapa("resultado");

    if (demo) return; // modo demo: não persiste

    setSalvando(true);
    setErroSalvar(null);
    try {
      await criarTriagem({
        instrumento,
        respostas: nums,
        score,
        severidade,
        risco_ideacao: risco,
      });
      const rows = await getMinhasTriagens();
      setHistorico(rows);
    } catch (err) {
      setErroSalvar(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar sua autoavaliação."
      );
    } finally {
      setSalvando(false);
    }
  }

  function reset() {
    setEtapa("escolha");
    setInstrumento(null);
    setRespostas([]);
    setResultado(null);
    setErroSalvar(null);
  }

  // ── Header da tela cheia ──
  const Topbar = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Activity size={22} color={T.teal700} aria-hidden="true" />
        <h2 style={{ ...sectionTitle, margin: 0 }}>Como você está?</h2>
      </div>
      <button
        type="button"
        aria-label="Fechar autoavaliação"
        onClick={onFechar}
        style={{
          ...btnGhost,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: 6,
        }}
      >
        <X size={20} />
      </button>
    </div>
  );

  return (
    <section
      aria-label="Autoavaliação de saúde mental"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      {Topbar}

      {etapa === "escolha" && (
        <>
          <DisclaimerBox />
          <p
            style={{
              margin: 0,
              fontFamily: "'Nunito',sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: T.gray600,
              lineHeight: 1.5,
            }}
          >
            Escolha uma autoavaliação rápida e anônima. Leva menos de 2 minutos
            e ajuda você (e seu profissional) a entender como você tem se
            sentido.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {INSTRUMENTOS.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => iniciar(i.id)}
                style={{
                  ...card,
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 44,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "'Nunito',sans-serif",
                      fontWeight: 800,
                      fontSize: 15,
                      color: T.gray950,
                    }}
                  >
                    {i.titulo}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Nunito',sans-serif",
                      fontWeight: 500,
                      fontSize: 13,
                      color: T.gray600,
                      marginTop: 2,
                    }}
                  >
                    {i.resumo}
                  </div>
                </div>
                <ChevronRight size={20} color={T.teal700} aria-hidden="true" />
              </button>
            ))}
          </div>
          <Historico itens={historico} />
        </>
      )}

      {etapa === "questionario" && cfg && (
        <>
          <DisclaimerBox />
          <p
            style={{
              margin: 0,
              fontFamily: "'Nunito',sans-serif",
              fontSize: 13.5,
              fontWeight: 700,
              color: T.gray700,
              lineHeight: 1.45,
            }}
          >
            {ENUNCIADO_TRONCO}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cfg.itens.map((item, idx) => (
              <LikertGroup
                key={item.id}
                item={item}
                numero={idx + 1}
                total={cfg.itens.length}
                valor={respostas[idx] ?? null}
                onChange={(v) => setResposta(idx, v)}
              />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              disabled={!completo}
              onClick={concluir}
              style={{
                ...btnPrimary,
                opacity: completo ? 1 : 0.5,
                cursor: completo ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <CheckCircle2 size={18} aria-hidden="true" />
              {completo
                ? "Ver meu resultado"
                : "Responda todas as perguntas"}
            </button>
            <button
              type="button"
              style={{
                ...btnGhost,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              onClick={reset}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Trocar autoavaliação
            </button>
          </div>
        </>
      )}

      {etapa === "resultado" && resultado && (
        <>
          <ResultadoView
            res={resultado}
            demo={demo}
            onAgendar={onAgendar}
            onRefazer={() =>
              instrumento ? iniciar(instrumento) : reset()
            }
            onFechar={onFechar}
          />
          {!demo && salvando && (
            <p
              role="status"
              style={{
                margin: 0,
                fontFamily: "'Nunito',sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: T.gray600,
              }}
            >
              Salvando sua autoavaliação…
            </p>
          )}
          {!demo && erroSalvar && (
            <p
              role="alert"
              style={{
                margin: 0,
                fontFamily: "'Nunito',sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: T.red,
              }}
            >
              {erroSalvar}
            </p>
          )}
        </>
      )}
    </section>
  );
}
