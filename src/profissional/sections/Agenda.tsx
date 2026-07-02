/**
 * Agenda.tsx
 * Seção principal da agenda do profissional.
 *
 * Componentes extraídos para arquivos próprios:
 *   - DefinirHorarioForm  (era AgendarForm)
 *   - ConsultaCard        (era ConsultaRow)
 *   - agendaUtils         (helpers visuais compartilhados)
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
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
  notificarConsulta,
} from "../../lib/data";
import type { Consulta, Profissional, Receita } from "../../lib/types";
import { isOnline } from "../../video/room";
import { jitsiConfigured } from "../../video/config";
import SalaVideo from "../../video/SalaVideo";
import ConsultaCard from "./ConsultaCard";
import type { DefinirHorarioPayload } from "./DefinirHorarioForm";
import { formatData, statusBadge, tipoBadge } from "./agendaUtils";

/* ─── helpers (apenas os exclusivos de Agenda.tsx) ─── */
function shortId(id: string): string {
  return id.slice(0, 8);
}

function nomeDoPaciente(c: Consulta, nomes: Record<string, string>): string {
  const n = nomes[c.paciente_id];
  if (n && n.trim() !== "") return n;
  return `Paciente #${shortId(c.paciente_id)}`;
}

/* ─── spinner ─── */
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

  // onFechar é memoizado no pai (handleFecharHistorico), então este
  // efeito não recria o listener a cada render do pai.
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
        <div
          style={{
            overflowY: "auto",
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
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
  onDefinir: (id: string, dados: DefinirHorarioPayload) => void;
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
            <ConsultaCard
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
      // Ficha do profissional para usar o nome como displayName na sala (best-effort).
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
    async (id: string, dados: DefinirHorarioPayload) => {
      setBusyId(id);
      setErro(null);
      try {
        await profDefinirAgenda(id, dados);
        // Confirmação por WhatsApp ao paciente — best-effort, não bloqueia o
        // fluxo nem mostra erro se falhar (sem telefone / Evolution offline).
        void notificarConsulta(id).catch(() => {
          /* notificação é opcional: agenda já foi definida com sucesso */
        });
        await carregar();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar a agenda.");
      } finally {
        setBusyId(null);
      }
    },
    [carregar],
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
    [carregar],
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
    [carregar],
  );

  const handleHistorico = useCallback((pacienteId: string, nome: string) => {
    setHistorico({ pacienteId, nome });
  }, []);

  // Memoizado para que o useEffect de keydown dentro de HistoricoModal não
  // recrie o listener a cada render deste componente pai.
  const handleFecharHistorico = useCallback(() => setHistorico(null), []);

  const handleEntrar = useCallback(async (c: Consulta) => {
    // Degrade com elegância: sem Jitsi configurado, abre o link externo.
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
  }, []);

  // Memoizado para estabilidade de referência ao ser passado como prop.
  const handleSair = useCallback(() => setSala(null), []);

  /* ─── estados de carregamento / erro total ─── */
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
        <AlertCircle
          size={18}
          color={T.red}
          strokeWidth={2.5}
          aria-hidden="true"
          style={{ flexShrink: 0, marginTop: 1 }}
        />
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
            onFechar={handleFecharHistorico}
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
          onFechar={handleFecharHistorico}
        />
      )}

      {sala && (
        <SalaVideo
          domain={sala.domain}
          room={sala.room}
          token={sala.token}
          displayName={ficha?.nome?.trim() || "Profissional"}
          onSair={handleSair}
        />
      )}
    </div>
  );
}
