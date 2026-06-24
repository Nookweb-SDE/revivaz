import React, { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CalendarPlus,
  Check,
  Link2,
  AlertCircle,
  XCircle,
  History,
  X,
  FileText,
} from "lucide-react";
import { T, card, sectionTitle, btnPrimary, btnGhost } from "../../conta/ui";
import {
  profMinhaAgenda,
  profDefinirAgenda,
  profMarcarRealizada,
  profCancelarConsulta,
  profHistoricoPaciente,
  profMinhaFicha,
  getNomesPacientes,
  getRoomToken,
} from "../../lib/data";
import type { Consulta, Profissional, Receita } from "../../lib/types";
import { isOnline } from "../../video/room";
import { jitsiConfigured } from "../../video/config";
import SalaVideo from "../../video/SalaVideo";

/* ─── helpers ─── */
function shortId(id: string): string {
  return id.slice(0, 8);
}

function nomeDoPaciente(c: Consulta, nomes: Record<string, string>): string {
  const n = nomes[c.paciente_id];
  if (n && n.trim() !== "") return n;
  return `Paciente #${shortId(c.paciente_id)}`;
}

function formatData(iso: string | null): string {
  if (!iso) return "Sem data";
  const parts = iso.split("-").map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return iso;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
}

function inicial(nome: string): string {
  const t = nome.trim();
  return t ? t[0].toUpperCase() : "P";
}

/* ─── spinner (padrão das áreas protegidas) ─── */
function Spinner(): JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ display: "flex", justifyContent: "center", padding: "40px 16px" }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: `3px solid ${T.teal100}`,
          borderTopColor: T.teal700,
          animation: "revivaz-spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes revivaz-spin{to{transform:rotate(360deg)}}`}</style>
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        Carregando agenda…
      </span>
    </div>
  );
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

function tipoBadge(tipo: Consulta["tipo"]): JSX.Element {
  const online = tipo === "online";
  return (
    <span
      style={{
        ...badgeBase,
        background: online ? T.teal100 : T.gray100,
        color: online ? T.teal700 : T.gray600,
      }}
    >
      {online ? (
        <Video size={11} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <MapPin size={11} strokeWidth={2.5} aria-hidden="true" />
      )}
      {online ? "Online" : "Presencial"}
    </span>
  );
}

function statusBadge(status: Consulta["status"]): JSX.Element {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    solicitada: { bg: "#FEF3C7", color: "#92400E", label: "Solicitada" },
    agendada: { bg: T.teal100, color: T.teal900, label: "Agendada" },
    realizada: { bg: "#D1FAE5", color: "#065F46", label: "Realizada" },
    cancelada: { bg: "#FEE2E2", color: "#991B1B", label: "Cancelada" },
  };
  const s = map[status] ?? { bg: T.gray100, color: T.gray700, label: status };
  return <span style={{ ...badgeBase, background: s.bg, color: s.color }}>{s.label}</span>;
}

/* ─── avatar (inicial do nome do paciente) ─── */
function PacienteAvatar({ nome }: { nome: string }): JSX.Element {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${T.teal500} 0%, ${T.teal700} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: T.white,
        fontFamily: "'Nunito',sans-serif",
        fontWeight: 800,
        fontSize: 16,
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {inicial(nome)}
    </div>
  );
}

/* ─── modal histórico do paciente ─── */
function HistoricoModal({
  pacienteId,
  pacienteNome,
  onFechar,
}: {
  pacienteId: string;
  pacienteNome: string;
  onFechar: () => void;
}): JSX.Element {
  const [dados, setDados] = useState<{ consultas: Consulta[]; receitas: Receita[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const d = await profHistoricoPaciente(pacienteId);
      setDados(d);
    } catch (e) {
      setDados({ consultas: [], receitas: [] });
      setErro(e instanceof Error ? e.message : "Não foi possível carregar o histórico.");
    }
  }, [pacienteId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onFechar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Histórico de ${pacienteNome}`}
      onClick={onFechar}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 1000,
        padding: 0,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.white,
          width: "100%",
          maxWidth: 520,
          maxHeight: "85vh",
          borderRadius: "18px 18px 0 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 -8px 32px rgba(15,23,42,0.18)",
        }}
      >
        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: `1px solid ${T.gray100}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <History size={18} color={T.teal700} strokeWidth={2.5} aria-hidden="true" />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Nunito',sans-serif",
                  fontWeight: 800,
                  fontSize: 15,
                  color: T.gray950,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {pacienteNome}
              </div>
              <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 11, color: T.gray600 }}>
                Histórico clínico
              </div>
            </div>
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar histórico"
            style={{
              ...btnGhost,
              padding: 8,
              minHeight: 40,
              minWidth: 40,
              borderRadius: 10,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.gray600,
            }}
          >
            <X size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {/* corpo */}
        <div style={{ overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
          {dados === null ? (
            <Spinner />
          ) : erro ? (
            <div
              role="alert"
              style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}
            >
              <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.red }}>
                {erro}
              </p>
              <button
                onClick={() => void carregar()}
                style={{ ...btnPrimary, padding: "8px 16px", fontSize: 13, minHeight: 38 }}
              >
                Tentar de novo
              </button>
            </div>
          ) : (
            <>
              {/* consultas */}
              <section aria-label="Consultas anteriores">
                <h4
                  style={{
                    margin: "0 0 8px",
                    fontFamily: "'Nunito',sans-serif",
                    fontWeight: 800,
                    fontSize: 13,
                    color: T.gray700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Calendar size={14} color={T.teal500} strokeWidth={2.5} aria-hidden="true" />
                  Consultas ({dados.consultas.length})
                </h4>
                {dados.consultas.length === 0 ? (
                  <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.gray600 }}>
                    Nenhuma consulta registrada.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {dados.consultas.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          background: T.gray050,
                          borderRadius: 10,
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          {statusBadge(c.status)}
                          {tipoBadge(c.tipo)}
                          <span
                            style={{
                              fontFamily: "'Nunito',sans-serif",
                              fontSize: 12,
                              color: T.gray600,
                            }}
                          >
                            {formatData(c.data)}
                            {c.hora ? ` · ${c.hora.slice(0, 5)}` : ""}
                          </span>
                        </div>
                        {c.obs && (
                          <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 12, color: T.gray700, lineHeight: 1.5 }}>
                            <strong>Paciente:</strong> {c.obs}
                          </p>
                        )}
                        {c.obs_profissional && (
                          <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 12, color: T.gray700, lineHeight: 1.5 }}>
                            <strong>Anotação:</strong> {c.obs_profissional}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* receitas */}
              <section aria-label="Receitas anteriores">
                <h4
                  style={{
                    margin: "0 0 8px",
                    fontFamily: "'Nunito',sans-serif",
                    fontWeight: 800,
                    fontSize: 13,
                    color: T.gray700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <FileText size={14} color={T.teal500} strokeWidth={2.5} aria-hidden="true" />
                  Receitas ({dados.receitas.length})
                </h4>
                {dados.receitas.length === 0 ? (
                  <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.gray600 }}>
                    Nenhuma receita registrada.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {dados.receitas.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          background: T.teal050,
                          borderRadius: 10,
                          padding: "10px 12px",
                          borderLeft: `3px solid ${T.teal500}`,
                        }}
                      >
                        <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 11, color: T.gray600, marginBottom: 4 }}>
                          {new Date(r.created_at).toLocaleDateString("pt-BR")}
                        </div>
                        <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.gray950, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                          {r.resumo}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── form de agendamento ─── */
function AgendarForm({
  consulta,
  onConfirmar,
  onCancelar,
  busy,
}: {
  consulta: Consulta;
  onConfirmar: (dados: { data: string; hora: string; link_ou_local?: string }) => void;
  onCancelar: () => void;
  busy: boolean;
}): JSX.Element {
  const [data, setData] = useState(consulta.data ?? "");
  const [hora, setHora] = useState(consulta.hora ?? "");
  const [link, setLink] = useState(consulta.link_ou_local ?? "");

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${T.gray200}`,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "'Nunito',sans-serif",
    color: T.gray950,
    background: T.white,
    minHeight: 44,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "'Nunito',sans-serif",
    fontWeight: 700,
    fontSize: 12,
    color: T.gray700,
    marginBottom: 4,
  };

  const podeConfirmar = data.trim() !== "" && hora.trim() !== "" && !busy;
  const linkLabel = consulta.tipo === "online" ? "Link da teleconsulta" : "Local do atendimento";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!podeConfirmar) return;
        onConfirmar({
          data: data.trim(),
          hora: hora.trim(),
          link_ou_local: link.trim() || undefined,
        });
      }}
      style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 130px", minWidth: 0 }}>
          <label style={labelStyle} htmlFor={`data-${consulta.id}`}>
            Data
          </label>
          <input
            id={`data-${consulta.id}`}
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            style={inputStyle}
            required
          />
        </div>
        <div style={{ flex: "1 1 110px", minWidth: 0 }}>
          <label style={labelStyle} htmlFor={`hora-${consulta.id}`}>
            Hora
          </label>
          <input
            id={`hora-${consulta.id}`}
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            style={inputStyle}
            required
          />
        </div>
      </div>
      <div>
        <label style={labelStyle} htmlFor={`link-${consulta.id}`}>
          {linkLabel} <span style={{ fontWeight: 500, color: T.gray600 }}>(opcional)</span>
        </label>
        <input
          id={`link-${consulta.id}`}
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder={consulta.tipo === "online" ? "https://meet…" : "Endereço / sala"}
          style={inputStyle}
        />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onCancelar}
          disabled={busy}
          style={{
            ...btnGhost,
            border: `1px solid ${T.gray200}`,
            borderRadius: 10,
            padding: "9px 16px",
            fontSize: 13,
            minHeight: 40,
            color: T.gray700,
            opacity: busy ? 0.6 : 1,
            cursor: busy ? "default" : "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!podeConfirmar}
          style={{
            ...btnPrimary,
            padding: "9px 18px",
            fontSize: 13,
            minHeight: 40,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            opacity: podeConfirmar ? 1 : 0.55,
            cursor: podeConfirmar ? "pointer" : "default",
          }}
        >
          <Check size={15} strokeWidth={2.5} aria-hidden="true" />
          {busy ? "Salvando…" : "Confirmar agenda"}
        </button>
      </div>
    </form>
  );
}

/* ─── linha de consulta ─── */
function ConsultaRow({
  c,
  nome,
  onDefinir,
  onRealizada,
  onCancelar,
  onHistorico,
  onEntrar,
  busyId,
  entrandoId,
}: {
  c: Consulta;
  nome: string;
  onDefinir: (id: string, dados: { data: string; hora: string; link_ou_local?: string }) => void;
  onRealizada: (id: string) => void;
  onCancelar: (id: string, nome: string) => void;
  onHistorico: (pacienteId: string, nome: string) => void;
  onEntrar: (c: Consulta) => void;
  busyId: string | null;
  entrandoId: string | null;
}): JSX.Element {
  const [aberto, setAberto] = useState(false);
  const busy = busyId === c.id;
  const pendente = c.status === "solicitada";
  // Sala de vídeo só p/ consulta online já agendada.
  const podeEntrar = c.status === "agendada" && isOnline(c.tipo);
  const entrando = entrandoId === c.id;

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 12, padding: "14px 16px" }}>
      {/* topo: avatar + info + tipo */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <PacienteAvatar nome={nome} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: T.gray950,
              lineHeight: 1.3,
            }}
          >
            Paciente: {nome}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontFamily: "'Nunito',sans-serif",
                fontSize: 12,
                color: T.gray600,
              }}
            >
              <Calendar size={13} color={T.teal500} strokeWidth={2.5} aria-hidden="true" />
              {formatData(c.data)}
            </span>
            {c.hora && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontFamily: "'Nunito',sans-serif",
                  fontSize: 12,
                  color: T.gray600,
                }}
              >
                <Clock size={13} color={T.teal500} strokeWidth={2.5} aria-hidden="true" />
                {c.hora}
              </span>
            )}
          </div>
        </div>
        {tipoBadge(c.tipo)}
      </div>

      {/* obs */}
      {c.obs && (
        <p
          style={{
            margin: 0,
            fontFamily: "'Nunito',sans-serif",
            fontSize: 13,
            color: T.gray700,
            lineHeight: 1.5,
            background: T.gray050,
            borderRadius: 10,
            padding: "8px 12px",
          }}
        >
          {c.obs}
        </p>
      )}

      {/* link/local (quando agendada) */}
      {!pendente && c.link_ou_local && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "'Nunito',sans-serif",
            fontSize: 12,
            color: T.teal700,
            wordBreak: "break-all",
          }}
        >
          <Link2 size={13} strokeWidth={2.5} aria-hidden="true" style={{ flexShrink: 0 }} />
          {c.link_ou_local}
        </div>
      )}

      {/* ações */}
      {pendente && aberto ? (
        <AgendarForm
          consulta={c}
          busy={busy}
          onCancelar={() => setAberto(false)}
          onConfirmar={(dados) => onDefinir(c.id, dados)}
        />
      ) : (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => onHistorico(c.paciente_id, nome)}
            style={{
              ...btnGhost,
              border: `1px solid ${T.gray200}`,
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 13,
              minHeight: 38,
              color: T.gray700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            aria-label={`Ver histórico de ${nome}`}
          >
            <History size={15} strokeWidth={2.5} aria-hidden="true" />
            Histórico
          </button>

          {pendente ? (
            <button
              onClick={() => setAberto(true)}
              style={{
                ...btnPrimary,
                padding: "8px 16px",
                fontSize: 13,
                minHeight: 38,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
              aria-label={`Agendar consulta de ${nome}`}
            >
              <CalendarPlus size={15} strokeWidth={2.5} aria-hidden="true" />
              Agendar
            </button>
          ) : (
            <>
              {podeEntrar && (
                <button
                  onClick={() => onEntrar(c)}
                  disabled={entrando}
                  style={{
                    ...btnPrimary,
                    padding: "8px 16px",
                    fontSize: 13,
                    minHeight: 38,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    opacity: entrando ? 0.7 : 1,
                    cursor: entrando ? "default" : "pointer",
                  }}
                  aria-label={`Entrar na sala de atendimento de ${nome}`}
                >
                  <Video size={15} strokeWidth={2.5} aria-hidden="true" />
                  {entrando ? "Entrando…" : "Entrar na sala"}
                </button>
              )}
              <button
                onClick={() => onCancelar(c.id, nome)}
                disabled={busy}
                style={{
                  ...btnGhost,
                  border: `1px solid ${T.red}`,
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 13,
                  minHeight: 38,
                  color: T.red,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: busy ? 0.6 : 1,
                  cursor: busy ? "default" : "pointer",
                }}
                aria-label={`Cancelar consulta de ${nome}`}
              >
                <XCircle size={15} strokeWidth={2.5} aria-hidden="true" />
                Cancelar
              </button>
              <button
                onClick={() => onRealizada(c.id)}
                disabled={busy}
                style={{
                  ...btnGhost,
                  border: `1px solid ${T.teal700}`,
                  borderRadius: 10,
                  padding: "8px 16px",
                  fontSize: 13,
                  minHeight: 38,
                  color: T.teal700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: busy ? 0.6 : 1,
                  cursor: busy ? "default" : "pointer",
                }}
                aria-label={`Marcar consulta de ${nome} como realizada`}
              >
                <Check size={15} strokeWidth={2.5} aria-hidden="true" />
                {busy ? "Salvando…" : "Marcar realizada"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── grupo (seção com título + contador) ─── */
function Grupo({
  titulo,
  itens,
  nomes,
  onDefinir,
  onRealizada,
  onCancelar,
  onHistorico,
  onEntrar,
  busyId,
  entrandoId,
  vazio,
}: {
  titulo: string;
  itens: Consulta[];
  nomes: Record<string, string>;
  onDefinir: (id: string, dados: { data: string; hora: string; link_ou_local?: string }) => void;
  onRealizada: (id: string) => void;
  onCancelar: (id: string, nome: string) => void;
  onHistorico: (pacienteId: string, nome: string) => void;
  onEntrar: (c: Consulta) => void;
  busyId: string | null;
  entrandoId: string | null;
  vazio: string;
}): JSX.Element {
  return (
    <section aria-label={titulo} style={{ marginBottom: 24 }}>
      <h3 style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 8 }}>
        {titulo}
        <span
          style={{
            background: itens.length > 0 ? T.teal100 : T.gray100,
            color: itens.length > 0 ? T.teal700 : T.gray600,
            borderRadius: 999,
            padding: "0 8px",
            fontSize: 12,
            fontWeight: 700,
            minWidth: 20,
            textAlign: "center",
          }}
        >
          {itens.length}
        </span>
      </h3>
      {itens.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontFamily: "'Nunito',sans-serif",
            fontSize: 13,
            color: T.gray600,
            padding: "12px 4px",
          }}
        >
          {vazio}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {itens.map((c) => (
            <ConsultaRow
              key={c.id}
              c={c}
              nome={nomeDoPaciente(c, nomes)}
              onDefinir={onDefinir}
              onRealizada={onRealizada}
              onCancelar={onCancelar}
              onHistorico={onHistorico}
              onEntrar={onEntrar}
              busyId={busyId}
              entrandoId={entrandoId}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── componente principal ─── */
export default function Agenda(): JSX.Element {
  const [consultas, setConsultas] = useState<Consulta[] | null>(null);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [historico, setHistorico] = useState<{ pacienteId: string; nome: string } | null>(null);
  // Atendimento virtual (sala in-app)
  const [ficha, setFicha] = useState<Profissional | null>(null);
  const [entrandoId, setEntrandoId] = useState<string | null>(null);
  const [sala, setSala] = useState<{ domain: string; room: string; token: string } | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const lista = await profMinhaAgenda();
      setConsultas(lista);
      // Ficha do profissional p/ usar o nome como displayName na sala (best-effort).
      void profMinhaFicha()
        .then((f) => setFicha(f))
        .catch(() => {
          /* sem ficha: cai no fallback "Profissional" */
        });
      // Carrega nomes dos pacientes num único request (RLS 0003 liberou a leitura).
      const ids = Array.from(new Set(lista.map((c) => c.paciente_id)));
      if (ids.length > 0) {
        try {
          const map = await getNomesPacientes(ids);
          setNomes(map);
        } catch {
          // nomes indisponíveis: fallback para "Paciente #id" cuida da exibição
        }
      } else {
        setNomes({});
      }
    } catch (e) {
      setConsultas([]);
      setErro(e instanceof Error ? e.message : "Não foi possível carregar a agenda.");
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const handleDefinir = useCallback(
    async (id: string, dados: { data: string; hora: string; link_ou_local?: string }) => {
      setBusyId(id);
      setErro(null);
      try {
        await profDefinirAgenda(id, dados);
        await carregar();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar a agenda.");
      } finally {
        setBusyId(null);
      }
    },
    [carregar]
  );

  const handleRealizada = useCallback(
    async (id: string) => {
      setBusyId(id);
      setErro(null);
      try {
        await profMarcarRealizada(id);
        await carregar();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível atualizar a consulta.");
      } finally {
        setBusyId(null);
      }
    },
    [carregar]
  );

  const handleCancelar = useCallback(
    async (id: string, nome: string) => {
      if (!window.confirm(`Cancelar a consulta de ${nome}? Esta ação não pode ser desfeita.`)) {
        return;
      }
      setBusyId(id);
      setErro(null);
      try {
        await profCancelarConsulta(id);
        await carregar();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível cancelar a consulta.");
      } finally {
        setBusyId(null);
      }
    },
    [carregar]
  );

  const handleHistorico = useCallback((pacienteId: string, nome: string) => {
    setHistorico({ pacienteId, nome });
  }, []);

  const handleEntrar = useCallback(
    async (c: Consulta) => {
      // Degrade com elegância: sem Jitsi configurado, abre o link externo (comportamento atual).
      if (!jitsiConfigured) {
        if (c.link_ou_local) {
          window.open(c.link_ou_local, "_blank", "noopener,noreferrer");
        } else {
          setErro("Sala de vídeo indisponível: nenhum link foi definido para esta consulta.");
        }
        return;
      }
      setEntrandoId(c.id);
      setErro(null);
      try {
        const { token, room, domain } = await getRoomToken(c.id);
        setSala({ token, room, domain });
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível entrar na sala.");
      } finally {
        setEntrandoId(null);
      }
    },
    []
  );

  if (consultas === null) {
    return <Spinner />;
  }

  if (erro && consultas.length === 0) {
    return (
      <div
        role="alert"
        style={{
          ...card,
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          borderColor: T.red,
        }}
      >
        <AlertCircle size={18} color={T.red} strokeWidth={2.5} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: T.gray950,
            }}
          >
            Não foi possível carregar a agenda
          </p>
          <p style={{ margin: "4px 0 12px", fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.gray600 }}>
            {erro}
          </p>
          <button
            onClick={() => void carregar()}
            style={{ ...btnPrimary, padding: "8px 16px", fontSize: 13, minHeight: 38 }}
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  const pendentes = consultas.filter((c) => c.status === "solicitada");
  const proximas = consultas.filter((c) => c.status === "agendada");
  const semAgenda = pendentes.length === 0 && proximas.length === 0;

  if (semAgenda) {
    return (
      <>
        <div
          role="status"
          style={{
            ...card,
            textAlign: "center",
            padding: "32px 16px",
            color: T.gray600,
            fontFamily: "'Nunito',sans-serif",
            fontSize: 14,
          }}
        >
          Nenhuma consulta na sua agenda ainda.
        </div>
        {historico && (
          <HistoricoModal
            pacienteId={historico.pacienteId}
            pacienteNome={historico.nome}
            onFechar={() => setHistorico(null)}
          />
        )}
      </>
    );
  }

  return (
    <div>
      {erro && (
        <div
          role="alert"
          style={{
            ...card,
            marginBottom: 16,
            borderColor: T.red,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'Nunito',sans-serif",
            fontSize: 13,
            color: T.red,
          }}
        >
          <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" style={{ flexShrink: 0 }} />
          {erro}
        </div>
      )}

      <Grupo
        titulo="Pedidos pendentes"
        itens={pendentes}
        nomes={nomes}
        onDefinir={handleDefinir}
        onRealizada={handleRealizada}
        onCancelar={handleCancelar}
        onHistorico={handleHistorico}
        onEntrar={handleEntrar}
        busyId={busyId}
        entrandoId={entrandoId}
        vazio="Nenhum pedido aguardando agendamento."
      />

      <Grupo
        titulo="Próximas"
        itens={proximas}
        nomes={nomes}
        onDefinir={handleDefinir}
        onRealizada={handleRealizada}
        onCancelar={handleCancelar}
        onHistorico={handleHistorico}
        onEntrar={handleEntrar}
        busyId={busyId}
        entrandoId={entrandoId}
        vazio="Nenhuma consulta agendada no momento."
      />

      {historico && (
        <HistoricoModal
          pacienteId={historico.pacienteId}
          pacienteNome={historico.nome}
          onFechar={() => setHistorico(null)}
        />
      )}

      {sala && (
        <SalaVideo
          domain={sala.domain}
          room={sala.room}
          token={sala.token}
          displayName={ficha?.nome?.trim() || "Profissional"}
          onSair={() => setSala(null)}
        />
      )}
    </div>
  );
}
