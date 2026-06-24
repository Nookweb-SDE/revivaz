// Handoff da TRIAGEM (autoavaliação PHQ-9 / GAD-7) para o PROFISSIONAL.
//
// Bloco expansível "Triagem recente" reutilizado pela Agenda e pelo Atendimento.
// Carrega profTriagensPaciente(pacienteId) (contrato em data.ts; RLS recorta) e
// mostra, por autoavaliação: instrumento, score, faixa de gravidade (cor),
// flag de risco de ideação DESTACADA e data. É READ-ONLY — o profissional não
// edita nem decide nada aqui; é só o resumo que acelera o atendimento.
//
// ⚠️ COMPLIANCE: severidade é FAIXA de pontuação, NUNCA nome de doença. O texto
// fixo lembra que é autoavaliação, não diagnóstico. Risco de ideação reusa os
// números de crise canônicos de src/acolhimento/crisis.ts (não duplica).

import React, { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Phone,
} from "lucide-react";
import { T, btnGhost } from "../../conta/ui";
import { profTriagensPaciente } from "../../lib/data";
import type { Triagem } from "../../lib/types";
import { CRISIS_RESOURCES } from "../../acolhimento/crisis";

/* ─── rótulos / faixas (FAIXA de pontuação, nunca nome de doença) ─── */

// Rótulo humano da faixa de gravidade. Texto neutro (sem diagnóstico).
const SEVERIDADE_ROTULO: Record<string, string> = {
  minima: "Mínima",
  leve: "Leve",
  moderada: "Moderada",
  moderada_grave: "Moderada a grave",
  grave: "Grave",
};

// Cor da faixa: grave=vermelho, moderada(_grave)=âmbar, leve/minima=teal.
function severidadeCores(sev: string): { bg: string; color: string } {
  if (sev === "grave") return { bg: "#FEE2E2", color: "#991B1B" };
  if (sev === "moderada" || sev === "moderada_grave")
    return { bg: "#FEF3C7", color: "#92400E" };
  // leve / minima (e qualquer faixa não-prevista, conservador → teal)
  return { bg: T.teal100, color: T.teal900 };
}

// Nome científico do instrumento + construto NEUTRO (sem nome de doença),
// alinhado ao que o paciente vê em Triagem.tsx (Ânimo / Tranquilidade).
const INSTRUMENTO_ROTULO: Record<string, string> = {
  phq9: "PHQ-9 (ânimo / humor)",
  gad7: "GAD-7 (preocupação / tensão)",
};

// Total máximo de cada instrumento, só p/ exibir "score / máx".
const INSTRUMENTO_MAX: Record<string, number> = { phq9: 27, gad7: 21 };

function rotuloInstrumento(instrumento: string): string {
  return INSTRUMENTO_ROTULO[instrumento] ?? instrumento.toUpperCase();
}

function rotuloSeveridade(sev: string): string {
  return SEVERIDADE_ROTULO[sev] ?? sev;
}

function formatDataHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/* ─── badges ─── */

const badgeBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.3,
  fontFamily: "'Nunito',sans-serif",
};

function SeveridadeBadge({ severidade }: { severidade: string }): JSX.Element {
  const c = severidadeCores(severidade);
  return (
    <span style={{ ...badgeBase, background: c.bg, color: c.color }}>
      {rotuloSeveridade(severidade)}
    </span>
  );
}

/* ─── card de risco de ideação (DESTACADO) ─── */

function RiscoIdeacao(): JSX.Element {
  return (
    <div
      role="alert"
      style={{
        marginTop: 8,
        background: "#FEE2E2",
        border: `1.5px solid ${T.red}`,
        borderRadius: 10,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <AlertTriangle
          size={16}
          color={T.red}
          strokeWidth={2.5}
          aria-hidden="true"
          style={{ flexShrink: 0, marginTop: 1 }}
        />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 800,
              fontSize: 13,
              color: "#991B1B",
            }}
          >
            Risco de ideação sinalizado
          </div>
          <p
            style={{
              margin: "2px 0 0",
              fontFamily: "'Nunito',sans-serif",
              fontSize: 12,
              color: "#7F1D1D",
              lineHeight: 1.5,
            }}
          >
            O paciente indicou pensamentos de se ferir ou de que seria melhor
            não estar aqui (PHQ-9, item 9). Priorize o contato humano e avalie
            risco com cuidado.
          </p>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {CRISIS_RESOURCES.map((r) => (
          <span
            key={r.nome}
            title={r.descricao}
            style={{
              ...badgeBase,
              background: T.white,
              color: "#991B1B",
              border: `1px solid ${T.red}`,
            }}
          >
            <Phone size={11} strokeWidth={2.5} aria-hidden="true" />
            {r.nome.split(" — ")[0]} {r.contato}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── linha de uma triagem ─── */

function TriagemItem({ t }: { t: Triagem }): JSX.Element {
  const max = INSTRUMENTO_MAX[t.instrumento];
  return (
    <div
      style={{
        background: T.gray050,
        borderRadius: 10,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        borderLeft: t.risco_ideacao
          ? `3px solid ${T.red}`
          : `3px solid ${severidadeCores(t.severidade).color}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: T.gray950,
          }}
        >
          {rotuloInstrumento(t.instrumento)}
        </span>
        <SeveridadeBadge severidade={t.severidade} />
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: T.gray950,
          }}
        >
          {t.score}
        </span>
        {max != null && (
          <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: 12, color: T.gray600 }}>
            / {max} pontos
          </span>
        )}
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "'Nunito',sans-serif",
            fontSize: 11,
            color: T.gray600,
          }}
        >
          {formatDataHora(t.created_at)}
        </span>
      </div>

      {t.risco_ideacao && <RiscoIdeacao />}
    </div>
  );
}

/* ─── bloco expansível "Triagem recente" ─── */

export default function TriagemRecente({
  pacienteId,
  defaultAberto = false,
}: {
  pacienteId: string;
  /** Se true, já carrega/abre montado (útil em listas curtas de atendimento). */
  defaultAberto?: boolean;
}): JSX.Element {
  const [aberto, setAberto] = useState(defaultAberto);
  const [triagens, setTriagens] = useState<Triagem[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const lista = await profTriagensPaciente(pacienteId);
      setTriagens(lista);
    } catch (e) {
      setTriagens([]);
      setErro(e instanceof Error ? e.message : "Não foi possível carregar a autoavaliação.");
    }
  }, [pacienteId]);

  // Carrega só quando o bloco abre pela 1ª vez (evita N requests numa lista).
  useEffect(() => {
    if (aberto && triagens === null && erro === null) {
      void carregar();
    }
  }, [aberto, triagens, erro, carregar]);

  const headerId = `triagem-head-${pacienteId}`;
  const panelId = `triagem-panel-${pacienteId}`;

  // Resumo no cabeçalho: a triagem mais recente vem primeiro (created_at desc).
  const maisRecente = triagens && triagens.length > 0 ? triagens[0] : null;
  const algumRisco = !!triagens?.some((t) => t.risco_ideacao);

  return (
    <div
      style={{
        marginTop: 12,
        border: `1px solid ${algumRisco ? T.red : T.gray200}`,
        borderRadius: 12,
        overflow: "hidden",
        background: T.white,
      }}
    >
      <button
        id={headerId}
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls={panelId}
        style={{
          ...btnGhost,
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          minHeight: 44,
          textAlign: "left",
          color: T.gray950,
        }}
      >
        <ClipboardList
          size={16}
          color={algumRisco ? T.red : T.teal700}
          strokeWidth={2.5}
          aria-hidden="true"
        />
        <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 13 }}>
          Triagem recente
        </span>

        {/* prévia inline quando fechado e já carregado */}
        {!aberto && maisRecente && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 2 }}>
            <SeveridadeBadge severidade={maisRecente.severidade} />
            {algumRisco && (
              <AlertTriangle size={14} color={T.red} strokeWidth={2.5} aria-hidden="true" />
            )}
          </span>
        )}

        {aberto ? (
          <ChevronUp size={16} color={T.gray600} strokeWidth={2.5} aria-hidden="true" style={{ marginLeft: "auto" }} />
        ) : (
          <ChevronDown size={16} color={T.gray600} strokeWidth={2.5} aria-hidden="true" style={{ marginLeft: "auto" }} />
        )}
      </button>

      {aberto && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          style={{
            padding: "0 12px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* disclaimer fixo de compliance */}
          <p
            style={{
              margin: "2px 0 4px",
              fontFamily: "'Nunito',sans-serif",
              fontSize: 11,
              color: T.gray600,
              lineHeight: 1.5,
            }}
          >
            Autoavaliação do paciente (PHQ-9 / GAD-7). É um resumo de autorrelato,
            não um diagnóstico nem atendimento clínico.
          </p>

          {triagens === null && erro === null ? (
            <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.gray600 }}>
              Carregando autoavaliação…
            </p>
          ) : erro ? (
            <div role="alert" style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
              <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.red }}>
                {erro}
              </p>
              <button
                type="button"
                onClick={() => void carregar()}
                style={{
                  ...btnGhost,
                  border: `1px solid ${T.gray200}`,
                  borderRadius: 10,
                  padding: "6px 12px",
                  fontSize: 13,
                  color: T.teal700,
                }}
              >
                Tentar de novo
              </button>
            </div>
          ) : triagens && triagens.length === 0 ? (
            <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.gray600 }}>
              Sem autoavaliação ainda.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {triagens!.map((t) => (
                <TriagemItem key={t.id} t={t} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
