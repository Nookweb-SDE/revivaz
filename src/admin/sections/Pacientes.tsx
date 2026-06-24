import React, { useEffect, useMemo, useState } from "react";
import { Search, X, Phone, Calendar, Star, User as UserIcon } from "lucide-react";
import {
  adminListPacientes,
  adminListTodasConsultas,
  adminListAvaliacoes,
} from "../../lib/data";
import type { Profile, Consulta, Avaliacao, StatusConsulta } from "../../lib/types";
import { T, card, sectionTitle, btnGhost } from "../../conta/ui";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtData(iso: string | null): string {
  if (!iso) return "—";
  // 'data' costuma vir como 'YYYY-MM-DD' (date) ou ISO; normaliza p/ pt-BR.
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

function fmtCriadoEm(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

const statusLabel: Record<StatusConsulta, string> = {
  solicitada: "Solicitada",
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

const statusColors: Record<StatusConsulta, { bg: string; fg: string }> = {
  solicitada: { bg: T.teal100, fg: T.teal900 },
  agendada: { bg: T.teal050, fg: T.teal700 },
  realizada: { bg: "#D1FAE5", fg: "#065F46" },
  cancelada: { bg: T.gray200, fg: T.gray600 },
};

function StatusBadge({ status }: { status: StatusConsulta }) {
  const c = statusColors[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: c.bg,
        color: c.fg,
        fontFamily: "'Nunito',sans-serif",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        flexShrink: 0,
      }}
    >
      {statusLabel[status]}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px 10px 38px",
  borderRadius: 10,
  border: `1.5px solid ${T.gray200}`,
  fontSize: 14,
  fontFamily: "'Nunito',sans-serif",
  color: T.gray950,
  boxSizing: "border-box",
  outline: "2px solid transparent", // foco visível vem da regra :focus-visible global
};

const metaLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  color: T.gray600,
  fontFamily: "'Nunito',sans-serif",
};

// ---------------------------------------------------------------------------
// Modal de detalhe
// ---------------------------------------------------------------------------

function PacienteDetalhe({
  paciente,
  onFechar,
}: {
  paciente: Profile;
  onFechar: () => void;
}) {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    async function load() {
      setLoading(true);
      setErro(null);
      try {
        // Não há função admin de "receitas por paciente" no CONTRATO;
        // listamos todas as consultas/avaliações (RLS admin) e filtramos
        // client-side por paciente_id.
        const [todasConsultas, todasAvaliacoes] = await Promise.all([
          adminListTodasConsultas(),
          adminListAvaliacoes(),
        ]);
        if (cancelado) return;
        setConsultas(todasConsultas.filter((c) => c.paciente_id === paciente.id));
        setAvaliacoes(todasAvaliacoes.filter((a) => a.paciente_id === paciente.id));
      } catch (err) {
        if (!cancelado)
          setErro(err instanceof Error ? err.message : "Erro ao carregar histórico.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    load();
    return () => {
      cancelado = true;
    };
  }, [paciente.id]);

  // Fecha no ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFechar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${paciente.nome ?? "paciente"}`}
      onClick={onFechar}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,29,58,.45)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: 16,
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...card,
          width: "100%",
          maxWidth: 560,
          marginTop: 40,
          marginBottom: 40,
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
            padding: 20,
            borderBottom: `1px solid ${T.gray200}`,
            background: T.teal050,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: 18,
                color: T.gray950,
                fontFamily: "'Nunito',sans-serif",
              }}
            >
              {paciente.nome || "Sem nome"}
            </p>
            <div style={{ ...metaLine, marginTop: 6 }}>
              <Phone size={14} aria-hidden /> {paciente.telefone || "Sem telefone"}
            </div>
            <div style={{ ...metaLine, marginTop: 4 }}>
              <Calendar size={14} aria-hidden /> Desde {fmtCriadoEm(paciente.created_at)}
            </div>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onFechar}
            style={{
              ...btnGhost,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
              borderRadius: 8,
              minWidth: 36,
              minHeight: 36,
            }}
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Contato de emergência */}
          {(paciente.emergencia_nome || paciente.emergencia_tel) && (
            <div
              style={{
                marginBottom: 20,
                padding: 12,
                borderRadius: 12,
                background: T.gray050,
                border: `1px solid ${T.gray200}`,
              }}
            >
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.gray600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontFamily: "'Nunito',sans-serif",
                }}
              >
                Contato de emergência
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: T.gray950,
                  fontFamily: "'Nunito',sans-serif",
                }}
              >
                {paciente.emergencia_nome || "—"}
                {paciente.emergencia_tel ? ` · ${paciente.emergencia_tel}` : ""}
              </p>
            </div>
          )}

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: 30,
                color: T.gray600,
                fontFamily: "'Nunito',sans-serif",
              }}
            >
              Carregando histórico…
            </div>
          ) : erro ? (
            <div style={{ color: T.red, fontFamily: "'Nunito',sans-serif" }}>{erro}</div>
          ) : (
            <>
              {/* Consultas */}
              <h3 style={{ ...sectionTitle, fontSize: 15 }}>
                Consultas ({consultas.length})
              </h3>
              {consultas.length === 0 ? (
                <p
                  style={{
                    fontSize: 13,
                    color: T.gray600,
                    fontFamily: "'Nunito',sans-serif",
                    margin: "0 0 20px",
                  }}
                >
                  Nenhuma consulta registrada.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {consultas.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        border: `1px solid ${T.gray200}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: T.gray950,
                            fontFamily: "'Nunito',sans-serif",
                          }}
                        >
                          {fmtData(c.data)}
                          {c.hora ? ` · ${c.hora.slice(0, 5)}` : ""}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 12,
                          color: T.gray600,
                          fontFamily: "'Nunito',sans-serif",
                          textTransform: "capitalize",
                        }}
                      >
                        {c.tipo}
                      </p>
                      {c.obs && (
                        <p
                          style={{
                            margin: "6px 0 0",
                            fontSize: 13,
                            color: T.gray700,
                            fontFamily: "'Nunito',sans-serif",
                            lineHeight: 1.5,
                          }}
                        >
                          {c.obs}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Avaliações */}
              <h3 style={{ ...sectionTitle, fontSize: 15 }}>
                Avaliações ({avaliacoes.length})
              </h3>
              {avaliacoes.length === 0 ? (
                <p
                  style={{
                    fontSize: 13,
                    color: T.gray600,
                    fontFamily: "'Nunito',sans-serif",
                    margin: "0 0 8px",
                  }}
                >
                  Nenhuma avaliação enviada.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {avaliacoes.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        border: `1px solid ${T.gray200}`,
                      }}
                    >
                      <div style={{ ...metaLine, color: T.gray950, fontWeight: 700 }}>
                        <Star size={14} aria-hidden /> Nota {a.nota}/10
                      </div>
                      {a.comentario && (
                        <p
                          style={{
                            margin: "6px 0 0",
                            fontSize: 13,
                            color: T.gray700,
                            fontFamily: "'Nunito',sans-serif",
                            lineHeight: 1.5,
                          }}
                        >
                          “{a.comentario}”
                        </p>
                      )}
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 11,
                          color: T.gray600,
                          fontFamily: "'Nunito',sans-serif",
                        }}
                      >
                        {fmtCriadoEm(a.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* TODO: não há função admin de receitas por paciente no CONTRATO
                  (apenas getReceitas() = receitas do usuário logado). Receitas
                  do paciente ficam pendentes até existir adminReceitasPorPaciente. */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card de paciente (linha clicável)
// ---------------------------------------------------------------------------

function PacienteCard({
  paciente,
  onAbrir,
}: {
  paciente: Profile;
  onAbrir: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      style={{
        ...card,
        marginBottom: 12,
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: "'Nunito',sans-serif",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: T.teal100,
          color: T.teal700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <UserIcon size={20} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: 15,
            color: T.gray950,
          }}
        >
          {paciente.nome || "Sem nome"}
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: 13,
            color: T.gray600,
          }}
        >
          {paciente.telefone || "Sem telefone"} · desde {fmtCriadoEm(paciente.created_at)}
        </p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<Profile | null>(null);

  async function load() {
    setLoading(true);
    setErro(null);
    try {
      const data = await adminListPacientes();
      setPacientes(data);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar pacientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return pacientes;
    return pacientes.filter((p) => (p.nome ?? "").toLowerCase().includes(termo));
  }, [pacientes, busca]);

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
        Carregando pacientes…
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

  return (
    <div>
      <h2 style={{ ...sectionTitle, fontSize: 18, marginBottom: 16 }}>
        Pacientes ({pacientes.length})
      </h2>

      {/* Busca */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search
          size={16}
          aria-hidden
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: T.gray600,
          }}
        />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome…"
          aria-label="Buscar paciente por nome"
          style={inputStyle}
        />
      </div>

      {filtrados.length === 0 ? (
        <div
          style={{
            ...card,
            textAlign: "center",
            padding: 40,
            color: T.gray600,
            fontFamily: "'Nunito',sans-serif",
          }}
        >
          {busca.trim()
            ? "Nenhum paciente encontrado para essa busca."
            : "Nenhum paciente cadastrado ainda."}
        </div>
      ) : (
        filtrados.map((p) => (
          <PacienteCard key={p.id} paciente={p} onAbrir={() => setSelecionado(p)} />
        ))
      )}

      {selecionado && (
        <PacienteDetalhe
          paciente={selecionado}
          onFechar={() => setSelecionado(null)}
        />
      )}
    </div>
  );
}
