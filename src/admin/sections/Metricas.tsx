import React, { useEffect, useState } from "react";
import {
  adminGetMetricasReais,
  getMetricsOverview,
  adminListAvaliacoes,
} from "../../lib/data";
import type {
  MetricasReais,
  MetricsOverview,
  MetricaTrend,
  Avaliacao,
} from "../../lib/types";
import { T, card, sectionTitle } from "../../conta/ui";
import { fmtMetric } from "../../lib/metrics";

// ---------------------------------------------------------------------------
// Inline SVG icons (24-px viewBox, stroke-only, consistent line weight)
// ---------------------------------------------------------------------------

function IconChat() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 8 16 12 12 16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Trend chip
// ---------------------------------------------------------------------------

/**
 * trendPositiveIsGood=true  → crescimento é bom (verde) | queda é ruim (vermelho)
 * trendPositiveIsGood=false → crescimento é ruim (vermelho) | queda é bom (verde)
 *   usado em "urgentes" onde mais casos = sinal negativo.
 */
function TrendChip({
  trend,
  positiveIsGood,
}: {
  trend: MetricaTrend;
  positiveIsGood: boolean;
}) {
  const { diff } = trend;

  let color: string;
  let bg: string;
  let text: string;

  if (diff === 0) {
    color = T.gray600;
    bg = T.gray100;
    text = "= sem mudança";
  } else if (diff > 0) {
    const good = positiveIsGood;
    color = good ? "#059669" : T.red;
    bg = good ? "#D1FAE5" : "#FEE2E2";
    text = `+${diff} vs sem. ant.`;
  } else {
    const good = !positiveIsGood;
    color = good ? "#059669" : T.red;
    bg = good ? "#D1FAE5" : "#FEE2E2";
    text = `${diff} vs sem. ant.`;
  }

  return (
    <span
      style={{
        display: "inline-block",
        marginTop: 8,
        padding: "2px 7px",
        borderRadius: 6,
        fontFamily: "'Nunito',sans-serif",
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: "0.01em",
        color,
        background: bg,
      }}
    >
      {text}
    </span>
  );
}

// ---------------------------------------------------------------------------
// KPI card (PRD Fase 0)
// ---------------------------------------------------------------------------

const kpiGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: 12,
  marginBottom: 20,
};

function KpiCard({
  icon,
  value,
  label,
  trend,
  positiveIsGood = true,
  subtitle,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: MetricaTrend;
  positiveIsGood?: boolean;
  subtitle?: string;
}) {
  return (
    <div style={{ ...card, display: "flex", flexDirection: "column" }}>
      {/* icon row */}
      <div style={{ color: T.teal700, marginBottom: 10, lineHeight: 0 }}>
        {icon}
      </div>
      {/* big number */}
      <p
        style={{
          fontFamily: "'Nunito',sans-serif",
          fontWeight: 900,
          fontSize: 34,
          lineHeight: 1,
          color: T.gray950,
          margin: "0 0 4px",
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
      {/* label */}
      <p
        style={{
          fontFamily: "'Nunito',sans-serif",
          fontWeight: 600,
          fontSize: 12,
          color: T.gray600,
          margin: 0,
          lineHeight: 1.35,
        }}
      >
        {label}
      </p>
      {/* optional subtitle (e.g. "N avaliações") */}
      {subtitle && (
        <p
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 600,
            fontSize: 11,
            color: T.gray600,
            margin: "2px 0 0",
            opacity: 0.7,
          }}
        >
          {subtitle}
        </p>
      )}
      {/* trend chip */}
      {trend !== undefined && (
        <TrendChip trend={trend} positiveIsGood={positiveIsGood} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barra de status (consultas totais)
// ---------------------------------------------------------------------------

const barTrackStyle: React.CSSProperties = {
  background: T.gray100,
  borderRadius: 8,
  height: 10,
  overflow: "hidden",
  flex: 1,
};

function StatusBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 600,
            fontSize: 13,
            color: T.gray700,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 800,
            fontSize: 13,
            color: T.gray950,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={barTrackStyle}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: color,
              borderRadius: 8,
              transition: "width 0.3s",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 600,
            fontSize: 12,
            color: T.gray600,
            minWidth: 38,
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Últimas avaliações (NPS)
// ---------------------------------------------------------------------------

const AMBAR = "#D97706";
function corNota(nota: number): string {
  if (nota <= 6) return T.red;
  if (nota <= 8) return AMBAR;
  return T.teal700;
}

function fmtData(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const notaBadgeStyle = (nota: number): React.CSSProperties => ({
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 900,
  fontSize: 16,
  color: T.white,
  background: corNota(nota),
  borderRadius: 10,
  minWidth: 38,
  height: 38,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

function UltimasAvaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErro(null);
    adminListAvaliacoes()
      .then((rows) => {
        if (alive) setAvaliacoes(rows.slice(0, 15));
      })
      .catch((err) => {
        if (alive)
          setErro(
            err instanceof Error ? err.message : "Erro ao carregar avaliações."
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <h2 style={sectionTitle}>Últimas avaliações (NPS)</h2>
      <div style={card}>
        {loading && (
          <p
            style={{
              fontFamily: "'Nunito',sans-serif",
              color: T.teal700,
              fontSize: 14,
              margin: 0,
            }}
          >
            Carregando avaliações…
          </p>
        )}

        {!loading && erro && (
          <p
            style={{
              fontFamily: "'Nunito',sans-serif",
              color: T.red,
              fontSize: 14,
              margin: 0,
            }}
          >
            {erro}
          </p>
        )}

        {!loading && !erro && avaliacoes && avaliacoes.length === 0 && (
          <p
            style={{
              fontFamily: "'Nunito',sans-serif",
              color: T.gray600,
              fontSize: 14,
              margin: 0,
            }}
          >
            Nenhuma avaliação ainda.
          </p>
        )}

        {!loading && !erro && avaliacoes && avaliacoes.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {avaliacoes.map((a, i) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  paddingTop: i === 0 ? 0 : 10,
                  borderTop: i === 0 ? "none" : `1px solid ${T.gray100}`,
                }}
              >
                <div style={notaBadgeStyle(a.nota)}>{a.nota}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "'Nunito',sans-serif",
                      fontWeight: 600,
                      fontSize: 14,
                      color: a.comentario ? T.gray700 : T.gray600,
                      fontStyle: a.comentario ? "normal" : "italic",
                      margin: "0 0 4px",
                      wordBreak: "break-word",
                    }}
                  >
                    {a.comentario || "Sem comentário"}
                  </p>
                  <span
                    style={{
                      fontFamily: "'Nunito',sans-serif",
                      fontWeight: 600,
                      fontSize: 12,
                      color: T.gray600,
                    }}
                  >
                    {fmtData(a.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Metricas — componente principal
// ---------------------------------------------------------------------------

export function Metricas() {
  const [metricas, setMetricas] = useState<MetricasReais | null>(null);
  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErro(null);

    // adminGetMetricasReais  → 5 KPIs com trend (janela 7 dias)
    // getMetricsOverview     → totais de consultas para as barras de status
    Promise.all([adminGetMetricasReais(), getMetricsOverview()])
      .then(([m, ov]) => {
        if (alive) {
          setMetricas(m);
          setOverview(ov);
        }
      })
      .catch((err) => {
        if (alive)
          setErro(
            err instanceof Error ? err.message : "Erro ao carregar métricas."
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <p
        style={{
          fontFamily: "'Nunito',sans-serif",
          color: T.teal700,
          fontSize: 14,
        }}
      >
        Carregando métricas…
      </p>
    );
  }

  if (erro) {
    return (
      <p
        style={{
          fontFamily: "'Nunito',sans-serif",
          color: T.red,
          fontSize: 14,
        }}
      >
        {erro}
      </p>
    );
  }

  if (!metricas || !overview) {
    return (
      <p
        style={{
          fontFamily: "'Nunito',sans-serif",
          color: T.gray600,
          fontSize: 14,
        }}
      >
        Nenhuma métrica disponível.
      </p>
    );
  }

  const totalConsultas =
    overview.consultas_solicitadas +
    overview.consultas_agendadas +
    overview.consultas_realizadas;

  const npsLabel =
    metricas.total_avaliacoes > 0
      ? `${metricas.total_avaliacoes} avaliação${metricas.total_avaliacoes !== 1 ? "ões" : ""} no total`
      : "sem avaliações";

  return (
    <div>
      {/* ── PRD Fase 0: 5 KPIs com trend semanal ── */}
      <h2 style={sectionTitle}>Métricas Fase 0 — últimos 7 dias</h2>
      <div style={kpiGridStyle}>
        <KpiCard
          icon={<IconChat />}
          value={metricas.pessoas_acolhidas.atual}
          label="Pessoas acolhidas pela IA"
          trend={metricas.pessoas_acolhidas}
          positiveIsGood={true}
        />
        <KpiCard
          icon={<IconArrow />}
          value={metricas.encaminhamentos.atual}
          label="Encaminhamentos para humano"
          trend={metricas.encaminhamentos}
          positiveIsGood={true}
        />
        <KpiCard
          icon={<IconAlert />}
          value={metricas.urgentes.atual}
          label="Casos urgentes (PHQ-9 ≥ 20 ou risco)"
          trend={metricas.urgentes}
          positiveIsGood={false}
        />
        <KpiCard
          icon={<IconCheckCircle />}
          value={metricas.consultas_realizadas.atual}
          label="Consultas realizadas"
          trend={metricas.consultas_realizadas}
          positiveIsGood={true}
        />
        <KpiCard
          icon={<IconStar />}
          value={fmtMetric(metricas.nps_medio)}
          label="NPS médio (−100 a 100)"
          subtitle={npsLabel}
          // NPS não tem trend semanal — é calculado sobre todo o histórico
        />
      </div>

      {/* ── Consultas por status (total histórico) ── */}
      <h2 style={{ ...sectionTitle, marginTop: 20 }}>
        Consultas por status (total)
      </h2>
      <div style={card}>
        <StatusBar
          label="Solicitadas"
          value={overview.consultas_solicitadas}
          total={totalConsultas}
          color={T.teal300}
        />
        <StatusBar
          label="Agendadas"
          value={overview.consultas_agendadas}
          total={totalConsultas}
          color={T.teal500}
        />
        <StatusBar
          label="Realizadas"
          value={overview.consultas_realizadas}
          total={totalConsultas}
          color={T.green500}
        />
      </div>

      {/* ── Últimas avaliações (NPS) ── */}
      <div style={{ marginTop: 20 }}>
        <UltimasAvaliacoes />
      </div>
    </div>
  );
}
