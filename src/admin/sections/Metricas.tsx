import React, { useEffect, useState } from "react";
import { getMetricsOverview } from "../../lib/data";
import type { MetricsOverview } from "../../lib/types";
import { T, card, sectionTitle } from "../../conta/ui";
import { fmtPct, fmtMetric } from "../../lib/metrics";

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
  marginBottom: 20,
};

const kpiValueStyle: React.CSSProperties = {
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 900,
  fontSize: 34,
  lineHeight: 1.1,
  color: T.teal700,
  margin: "0 0 4px",
  letterSpacing: "-0.02em",
};

const kpiLabelStyle: React.CSSProperties = {
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 600,
  fontSize: 13,
  color: T.gray600,
  margin: 0,
};

function Kpi({ value, label }: { value: string; label: string }) {
  return (
    <div style={card}>
      <p style={kpiValueStyle}>{value}</p>
      <p style={kpiLabelStyle}>{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barra de status simples (divs)
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
          }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metricas
// ---------------------------------------------------------------------------

export function Metricas() {
  const [data, setData] = useState<MetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErro(null);
    getMetricsOverview()
      .then((m) => {
        if (alive) setData(m);
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

  if (!data) {
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
    data.consultas_solicitadas +
    data.consultas_agendadas +
    data.consultas_realizadas;

  return (
    <div>
      {/* KPIs principais */}
      <h2 style={sectionTitle}>Visão geral</h2>
      <div style={gridStyle}>
        <Kpi value={String(data.pacientes)} label="Pacientes" />
        <Kpi value={fmtPct(data.taxa_realizacao)} label="Taxa de realização" />
        <Kpi value={fmtMetric(data.nps)} label="NPS (-100 a 100)" />
        <Kpi
          value={fmtMetric(
            data.humor_medio_7d === null
              ? null
              : Math.round(data.humor_medio_7d * 10) / 10,
            "/4"
          )}
          label="Humor médio (7 dias)"
        />
      </div>

      {/* Consultas por status */}
      <h2 style={sectionTitle}>Consultas por status</h2>
      <div style={card}>
        <StatusBar
          label="Solicitadas"
          value={data.consultas_solicitadas}
          total={totalConsultas}
          color={T.teal300}
        />
        <StatusBar
          label="Agendadas"
          value={data.consultas_agendadas}
          total={totalConsultas}
          color={T.teal500}
        />
        <StatusBar
          label="Realizadas"
          value={data.consultas_realizadas}
          total={totalConsultas}
          color={T.green500}
        />
      </div>
    </div>
  );
}
