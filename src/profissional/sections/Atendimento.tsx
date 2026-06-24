import React, { useEffect, useState } from "react";
import { profMinhaAgenda, profMarcarRealizada } from "../../lib/data";
import type { Consulta } from "../../lib/types";
import { T, card, sectionTitle, btnPrimary, btnGhost } from "../../conta/ui";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const badgeStyle = (status: string): React.CSSProperties => {
  const colors: Record<string, { bg: string; color: string }> = {
    solicitada: { bg: "#FEF3C7", color: "#92400E" },
    agendada: { bg: T.teal100, color: T.teal900 },
    realizada: { bg: "#D1FAE5", color: "#065F46" },
    cancelada: { bg: "#FEE2E2", color: "#991B1B" },
  };
  const c = colors[status] ?? { bg: T.gray100, color: T.gray700 };
  return {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background: c.bg,
    color: c.color,
    fontFamily: "'Nunito',sans-serif",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };
};

function formatDataHora(c: Consulta): string | null {
  if (!c.data) return null;
  return new Date(`${c.data}T${c.hora ?? "00:00"}`).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// ---------------------------------------------------------------------------
// Consulta Card
// ---------------------------------------------------------------------------

function ConsultaCard({
  consulta,
  onRealizada,
  readonly,
}: {
  consulta: Consulta;
  onRealizada: (id: string) => Promise<void>;
  readonly?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function marcar() {
    setLoading(true);
    setErro(null);
    try {
      await onRealizada(consulta.id);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao marcar como realizada.");
      setLoading(false);
    }
    // não reseta loading no sucesso: o re-fetch desmonta/atualiza o card
  }

  const dataHora = formatDataHora(consulta);

  return (
    <div style={{ ...card, marginBottom: 14 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <span style={badgeStyle(consulta.status)}>{consulta.status}</span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 12,
              color: T.gray600,
              fontFamily: "'Nunito',sans-serif",
            }}
          >
            {consulta.tipo === "online" ? "Online" : "Presencial"}
          </span>
        </div>
        <span style={{ fontSize: 11, color: T.gray600, fontFamily: "'Nunito',sans-serif" }}>
          {new Date(consulta.created_at).toLocaleDateString("pt-BR")}
        </span>
      </div>

      {/* Details */}
      <div
        style={{
          marginTop: 10,
          fontSize: 13,
          color: T.gray700,
          fontFamily: "'Nunito',sans-serif",
          lineHeight: 1.6,
        }}
      >
        <div>
          <strong>Paciente:</strong>{" "}
          <code
            style={{
              background: T.gray100,
              padding: "1px 6px",
              borderRadius: 4,
              fontSize: 11,
            }}
          >
            {consulta.paciente_id.slice(0, 8)}…
          </code>
        </div>
        {dataHora && (
          <div>
            <strong>Data/Hora:</strong> {dataHora}
          </div>
        )}
        {consulta.link_ou_local && (
          <div>
            <strong>Link/Local:</strong> {consulta.link_ou_local}
          </div>
        )}
        {consulta.obs && (
          <div>
            <strong>Obs:</strong> {consulta.obs}
          </div>
        )}
      </div>

      {/* Actions */}
      {!readonly && (
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            style={{ ...btnPrimary, padding: "8px 16px", fontSize: 13, background: T.teal500 }}
            onClick={marcar}
            disabled={loading}
          >
            {loading ? "Salvando…" : "Marcar como realizada"}
          </button>
        </div>
      )}

      {erro && <p style={{ color: T.red, fontSize: 12, margin: "8px 0 0" }}>{erro}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Atendimento Section
// ---------------------------------------------------------------------------

export default function Atendimento() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErro(null);
    try {
      const c = await profMinhaAgenda();
      setConsultas(c);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar a agenda.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRealizada(id: string) {
    await profMarcarRealizada(id);
    await load();
  }

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 40,
          color: T.gray600,
          fontFamily: "'Nunito',sans-serif",
        }}
      >
        Carregando atendimentos…
      </div>
    );
  }

  if (erro) {
    return (
      <div style={{ color: T.red, padding: 20, fontFamily: "'Nunito',sans-serif" }}>
        {erro}{" "}
        <button style={btnGhost} onClick={load}>
          Tentar novamente
        </button>
      </div>
    );
  }

  const agendadas = consultas.filter((c) => c.status === "agendada");
  const realizadas = consultas
    .filter((c) => c.status === "realizada")
    .slice(0, 10);

  return (
    <div>
      {/* A realizar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ ...sectionTitle, margin: 0, fontSize: 18 }}>
          A realizar ({agendadas.length})
        </h2>
        <button style={{ ...btnGhost, fontSize: 13 }} onClick={load}>
          Atualizar
        </button>
      </div>

      {agendadas.length === 0 ? (
        <div
          style={{
            ...card,
            textAlign: "center",
            padding: 40,
            color: T.gray600,
            fontFamily: "'Nunito',sans-serif",
          }}
        >
          Nenhuma consulta agendada no momento.
        </div>
      ) : (
        agendadas.map((c) => (
          <ConsultaCard key={c.id} consulta={c} onRealizada={handleRealizada} />
        ))
      )}

      {/* Realizadas recentes (read-only) */}
      {realizadas.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ ...sectionTitle, margin: "0 0 16px", fontSize: 18 }}>
            Realizadas recentes
          </h2>
          {realizadas.map((c) => (
            <ConsultaCard
              key={c.id}
              consulta={c}
              onRealizada={handleRealizada}
              readonly
            />
          ))}
        </div>
      )}
    </div>
  );
}
