import React, { useEffect, useState, useCallback } from "react";
import { FileText, Send, CheckCircle2 } from "lucide-react";
import {
  profMinhaAgenda,
  profMarcarRealizada,
  profSalvarObsClinica,
  profHistoricoPaciente,
  profMinhaFicha,
  profLancarReceita,
  getNomesPacientes,
  getRoomToken,
  profListAvaliacoes,
} from "../../lib/data";
import type { Consulta, Profissional, Receita, Avaliacao } from "../../lib/types";
import { T, card, sectionTitle, btnPrimary, btnGhost } from "../../conta/ui";
import { isOnline } from "../../video/room";
import { jitsiConfigured } from "../../video/config";
import SalaVideo from "../../video/SalaVideo";
import TriagemRecente from "./TriagemRecente";
import NotaClinicaIA from "./NotaClinicaIA";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shortId(id: string): string {
  return id.slice(0, 8);
}

function nomeDoPaciente(c: Consulta, nomes: Record<string, string>): string {
  const n = nomes[c.paciente_id];
  if (n && n.trim() !== "") return n;
  return `Paciente #${shortId(c.paciente_id)}`;
}

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

// ---------------------------------------------------------------------------
// Avaliação badge helpers
// ---------------------------------------------------------------------------

const AMBAR_PROF = "#D97706";
function corNotaProf(nota: number): { bg: string; text: string } {
  if (nota <= 6) return { bg: "#FEE2E2", text: "#991B1B" };
  if (nota <= 8) return { bg: "#FEF3C7", text: AMBAR_PROF };
  return { bg: "#D1FAE5", text: "#065F46" };
}

function labelNota(nota: number): string {
  if (nota <= 6) return "Precisa melhorar";
  if (nota <= 8) return "Razoável";
  return "Recomendaria";
}

function formatDataHora(c: Consulta): string | null {
  if (!c.data) return null;
  return new Date(`${c.data}T${c.hora ?? "00:00"}`).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// ---------------------------------------------------------------------------
// Histórico modal
// ---------------------------------------------------------------------------

function HistoricoModal({
  pacienteId,
  pacienteNome,
  onFechar,
}: {
  pacienteId: string;
  pacienteNome: string;
  onFechar: () => void;
}) {
  const [dados, setDados] = useState<{ consultas: Consulta[]; receitas: Receita[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setDados(await profHistoricoPaciente(pacienteId));
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: `1px solid ${T.gray100}`,
          }}
        >
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
          <button
            onClick={onFechar}
            aria-label="Fechar histórico"
            style={{ ...btnGhost, padding: "8px 12px", minHeight: 40, color: T.gray600 }}
          >
            Fechar
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
          {dados === null ? (
            <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.gray600, textAlign: "center", padding: 24 }}>
              Carregando histórico…
            </p>
          ) : erro ? (
            <div role="alert" style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
              <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.red }}>{erro}</p>
              <button onClick={() => void carregar()} style={{ ...btnPrimary, padding: "8px 16px", fontSize: 13, minHeight: 38 }}>
                Tentar de novo
              </button>
            </div>
          ) : (
            <>
              <section aria-label="Consultas anteriores">
                <h4 style={{ margin: "0 0 8px", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 13, color: T.gray700 }}>
                  Consultas ({dados.consultas.length})
                </h4>
                {dados.consultas.length === 0 ? (
                  <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.gray600 }}>
                    Nenhuma consulta registrada.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {dados.consultas.map((c) => (
                      <div key={c.id} style={{ background: T.gray050, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={badgeStyle(c.status)}>{c.status}</span>
                          <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: 12, color: T.gray600 }}>
                            {formatDataHora(c) ?? "Sem data"}
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

              <section aria-label="Receitas anteriores">
                <h4 style={{ margin: "0 0 8px", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 13, color: T.gray700 }}>
                  Receitas ({dados.receitas.length})
                </h4>
                {dados.receitas.length === 0 ? (
                  <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.gray600 }}>
                    Nenhuma receita registrada.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {dados.receitas.map((r) => (
                      <div key={r.id} style={{ background: T.teal050, borderRadius: 10, padding: "10px 12px", borderLeft: `3px solid ${T.teal500}` }}>
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

// ---------------------------------------------------------------------------
// Emitir Receita Modal
// ---------------------------------------------------------------------------

type FormReceita = {
  medicamento: string;
  dosagem: string;
  posologia: string;
  observacoes: string;
  validade: string;
};

const emptyFormReceita = (): FormReceita => ({
  medicamento: "",
  dosagem: "",
  posologia: "",
  observacoes: "",
  validade: "",
});

function isFormReceitaValido(f: FormReceita): boolean {
  return (
    f.medicamento.trim().length > 0 &&
    f.dosagem.trim().length > 0 &&
    f.posologia.trim().length > 0 &&
    f.validade.length > 0
  );
}

const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "'Nunito',sans-serif",
  fontSize: 13,
  color: T.gray950,
  lineHeight: 1.55,
  background: T.gray050,
  border: `1.5px solid ${T.gray200}`,
  borderRadius: 10,
  padding: "9px 12px",
  outline: "none",
};

function FieldReceita({
  label,
  id,
  required,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: "'Nunito',sans-serif",
          fontWeight: 700,
          fontSize: 12,
          color: T.gray700,
        }}
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: T.red, marginLeft: 2 }}>
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function EmitirReceitaModal({
  consulta,
  pacienteNome,
  onFechar,
  onEmitida,
}: {
  consulta: Consulta;
  pacienteNome: string;
  onFechar: () => void;
  onEmitida: () => void;
}) {
  const [form, setForm] = useState<FormReceita>(emptyFormReceita());
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onFechar]);

  function patch(key: keyof FormReceita, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (erro) setErro(null);
  }

  async function handleEmitir() {
    if (!isFormReceitaValido(form)) {
      setErro("Preencha medicamento, dosagem, posologia e validade.");
      return;
    }
    setSaving(true);
    setErro(null);
    try {
      await profLancarReceita({
        consulta_id: consulta.id,
        paciente_id: consulta.paciente_id,
        medicamento: form.medicamento.trim(),
        dosagem: form.dosagem.trim(),
        posologia: form.posologia.trim(),
        observacoes: form.observacoes.trim() || undefined,
        validade: form.validade,
      });
      setDone(true);
      onEmitida();
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível emitir a receita. Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  const podeSalvar = isFormReceitaValido(form) && !saving;
  const idPfx = `modal-${consulta.id}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Emitir receita para ${pacienteNome}`}
      onClick={onFechar}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 1100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.white,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          borderRadius: "18px 18px 0 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 -8px 32px rgba(15,23,42,0.18)",
        }}
      >
        {/* Header */}
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
            <FileText size={18} color={T.teal700} aria-hidden="true" />
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
                Emitir Receita
              </div>
              <div
                style={{
                  fontFamily: "'Nunito',sans-serif",
                  fontSize: 11,
                  color: T.gray600,
                }}
              >
                Paciente: {pacienteNome}
              </div>
            </div>
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar formulário de receita"
            style={{ ...btnGhost, padding: "8px 12px", minHeight: 40, color: T.gray600 }}
          >
            Fechar
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            overflowY: "auto",
            padding: "18px 18px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {done ? (
            <div
              role="status"
              aria-live="polite"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                padding: "32px 16px",
                textAlign: "center",
              }}
            >
              <CheckCircle2 size={40} color={T.green500} />
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Nunito',sans-serif",
                  fontWeight: 800,
                  fontSize: 16,
                  color: T.gray950,
                }}
              >
                Receita emitida com sucesso!
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Nunito',sans-serif",
                  fontSize: 13,
                  color: T.gray600,
                }}
              >
                O paciente poderá visualizá-la na seção Receitas da sua conta.
              </p>
              <button
                onClick={onFechar}
                style={{
                  ...btnPrimary,
                  padding: "10px 24px",
                  fontSize: 13,
                  marginTop: 8,
                }}
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              {/* Medicamento + Dosagem na mesma linha */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10 }}>
                <FieldReceita label="Medicamento" id={`${idPfx}-med`} required>
                  <input
                    id={`${idPfx}-med`}
                    type="text"
                    value={form.medicamento}
                    onChange={(e) => patch("medicamento", e.target.value)}
                    disabled={saving}
                    placeholder="Ex.: Sertralina"
                    style={inputBaseStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = T.teal500; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = T.gray200; }}
                  />
                </FieldReceita>
                <FieldReceita label="Dosagem" id={`${idPfx}-dos`} required>
                  <input
                    id={`${idPfx}-dos`}
                    type="text"
                    value={form.dosagem}
                    onChange={(e) => patch("dosagem", e.target.value)}
                    disabled={saving}
                    placeholder="Ex.: 50 mg"
                    style={inputBaseStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = T.teal500; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = T.gray200; }}
                  />
                </FieldReceita>
              </div>

              {/* Posologia */}
              <FieldReceita label="Posologia" id={`${idPfx}-pos`} required>
                <input
                  id={`${idPfx}-pos`}
                  type="text"
                  value={form.posologia}
                  onChange={(e) => patch("posologia", e.target.value)}
                  disabled={saving}
                  placeholder="Ex.: 1 comprimido pela manhã por 30 dias"
                  style={inputBaseStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = T.teal500; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = T.gray200; }}
                />
              </FieldReceita>

              {/* Validade */}
              <FieldReceita label="Válida até" id={`${idPfx}-val`} required>
                <input
                  id={`${idPfx}-val`}
                  type="date"
                  value={form.validade}
                  onChange={(e) => patch("validade", e.target.value)}
                  disabled={saving}
                  style={{ ...inputBaseStyle, width: "fit-content" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = T.teal500; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = T.gray200; }}
                />
              </FieldReceita>

              {/* Observações */}
              <FieldReceita label="Observações (opcional)" id={`${idPfx}-obs`}>
                <textarea
                  id={`${idPfx}-obs`}
                  value={form.observacoes}
                  onChange={(e) => patch("observacoes", e.target.value)}
                  disabled={saving}
                  rows={3}
                  placeholder="Instruções adicionais, contraindicações, retorno…"
                  style={{
                    ...inputBaseStyle,
                    resize: "vertical",
                    minHeight: 72,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = T.teal500; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = T.gray200; }}
                />
              </FieldReceita>

              {erro && (
                <p
                  role="alert"
                  style={{
                    margin: 0,
                    fontFamily: "'Nunito',sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.red,
                  }}
                >
                  {erro}
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
                <button
                  onClick={handleEmitir}
                  disabled={!podeSalvar}
                  aria-label="Emitir receita"
                  style={{
                    ...btnPrimary,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "11px 22px",
                    fontSize: 14,
                    minHeight: 44,
                    opacity: podeSalvar ? 1 : 0.55,
                    cursor: podeSalvar ? "pointer" : "not-allowed",
                    transition: "opacity 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (podeSalvar)
                      (e.currentTarget as HTMLButtonElement).style.background = T.teal900;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = T.teal700;
                  }}
                >
                  <Send size={14} aria-hidden="true" />
                  {saving ? "Emitindo…" : "Emitir receita"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Consulta Card
// ---------------------------------------------------------------------------

function ConsultaCard({
  consulta,
  nome,
  onRealizada,
  onHistorico,
  onEmitirReceita,
  onEntrar,
  entrando,
  readonly,
  avaliacao,
}: {
  consulta: Consulta;
  nome: string;
  onRealizada: (id: string, obs: string) => Promise<void>;
  onHistorico: (pacienteId: string, nome: string) => void;
  onEmitirReceita: (consulta: Consulta, nome: string) => void;
  onEntrar?: (c: Consulta) => void;
  entrando?: boolean;
  readonly?: boolean;
  avaliacao?: Avaliacao | null;
}) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [obs, setObs] = useState(consulta.obs_profissional ?? "");

  // estado p/ salvar a anotação clínica isoladamente (em consultas já realizadas)
  const [savingObs, setSavingObs] = useState(false);
  const [obsSalvaMsg, setObsSalvaMsg] = useState<string | null>(null);

  async function marcar() {
    setLoading(true);
    setErro(null);
    try {
      // grava a anotação clínica junto com o "realizada" (texto opcional)
      await onRealizada(consulta.id, obs.trim());
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao marcar como realizada.");
      setLoading(false);
    }
    // no sucesso o re-fetch remonta o card; não reseta loading
  }

  async function salvarObs() {
    setSavingObs(true);
    setErro(null);
    setObsSalvaMsg(null);
    try {
      await profSalvarObsClinica(consulta.id, obs.trim());
      setObsSalvaMsg("Anotação salva 💚");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar a anotação.");
    } finally {
      setSavingObs(false);
    }
  }

  const dataHora = formatDataHora(consulta);
  const obsTextareaId = `obs-${consulta.id}`;
  // Sala de vídeo: consulta online ainda a realizar (não readonly).
  const podeEntrar = !readonly && isOnline(consulta.tipo) && onEntrar != null;

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: 72,
    fontFamily: "'Nunito',sans-serif",
    fontSize: 13,
    color: T.gray950,
    lineHeight: 1.55,
    background: T.gray050,
    border: `1.5px solid ${T.gray200}`,
    borderRadius: 10,
    padding: "10px 12px",
    outline: "none",
  };

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
          <span style={{ marginLeft: 8, fontSize: 12, color: T.gray600, fontFamily: "'Nunito',sans-serif" }}>
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
          <strong>Paciente:</strong> {nome}
        </div>
        {dataHora && (
          <div>
            <strong>Data/Hora:</strong> {dataHora}
          </div>
        )}
        {consulta.link_ou_local && (
          <div style={{ wordBreak: "break-all" }}>
            <strong>Link/Local:</strong> {consulta.link_ou_local}
          </div>
        )}
        {consulta.obs && (
          <div>
            <strong>Obs do paciente:</strong> {consulta.obs}
          </div>
        )}
      </div>

      {/* Anotação clínica */}
      <div style={{ marginTop: 12 }}>
        <label
          htmlFor={obsTextareaId}
          style={{ display: "block", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 12, color: T.gray700, marginBottom: 6 }}
        >
          Anotação clínica {readonly ? "" : "(opcional)"}
        </label>
        {readonly ? (
          consulta.obs_profissional ? (
            <p
              style={{
                margin: 0,
                fontFamily: "'Nunito',sans-serif",
                fontSize: 13,
                color: T.gray700,
                lineHeight: 1.55,
                background: T.gray050,
                borderRadius: 10,
                padding: "10px 12px",
                whiteSpace: "pre-wrap",
              }}
            >
              {consulta.obs_profissional}
            </p>
          ) : (
            <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 12, color: T.gray600 }}>
              Sem anotação registrada.
            </p>
          )
        ) : (
          <textarea
            id={obsTextareaId}
            value={obs}
            onChange={(e) => {
              setObs(e.target.value);
              if (obsSalvaMsg) setObsSalvaMsg(null);
            }}
            disabled={loading || savingObs}
            rows={3}
            placeholder="Evolução, conduta, observações da sessão…"
            style={textareaStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = T.teal500;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = T.gray200;
            }}
          />
        )}
      </div>

      {/* Nota clínica assistida por IA — só na documentação ativa (a realizar). */}
      {!readonly && (
        <div style={{ marginTop: 12 }}>
          <NotaClinicaIA consultaId={consulta.id} />
        </div>
      )}

      {/* Triagem recente (autoavaliação PHQ-9 / GAD-7) — read-only, acelera a sessão.
          Já abre nas consultas a realizar; fica recolhida nas realizadas. */}
      <TriagemRecente pacienteId={consulta.paciente_id} defaultAberto={!readonly} />

      {/* Actions */}
      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          style={{ ...btnGhost, border: `1px solid ${T.gray200}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, color: T.gray700 }}
          onClick={() => onHistorico(consulta.paciente_id, nome)}
        >
          Histórico do paciente
        </button>
        {/* Emitir Receita — disponível em agendadas e realizadas */}
        <button
          style={{
            ...btnGhost,
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: `1px solid ${T.teal700}`,
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 13,
            color: T.teal700,
          }}
          onClick={() => onEmitirReceita(consulta, nome)}
          aria-label={`Emitir receita para ${nome}`}
        >
          <FileText size={13} aria-hidden="true" />
          Emitir Receita
        </button>
        {podeEntrar && (
          <button
            style={{
              ...btnPrimary,
              padding: "8px 16px",
              fontSize: 13,
              opacity: entrando ? 0.7 : 1,
              cursor: entrando ? "default" : "pointer",
            }}
            onClick={() => onEntrar?.(consulta)}
            disabled={entrando}
            aria-label={`Entrar na sala de atendimento de ${nome}`}
          >
            {entrando ? "Entrando…" : "Entrar na sala"}
          </button>
        )}
        {!readonly && (
          <button
            style={{ ...btnPrimary, padding: "8px 16px", fontSize: 13 }}
            onClick={marcar}
            disabled={loading}
          >
            {loading ? "Salvando…" : "Marcar como realizada"}
          </button>
        )}
        {readonly && (
          <button
            style={{ ...btnGhost, border: `1px solid ${T.teal700}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, color: T.teal700 }}
            onClick={salvarObs}
            disabled={savingObs}
          >
            {savingObs ? "Salvando…" : "Salvar anotação"}
          </button>
        )}
      </div>

      {obsSalvaMsg && (
        <p role="status" aria-live="polite" style={{ color: T.green500, fontSize: 12, margin: "8px 0 0", fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>
          {obsSalvaMsg}
        </p>
      )}
      {erro && <p role="alert" style={{ color: T.red, fontSize: 12, margin: "8px 0 0", fontFamily: "'Nunito',sans-serif" }}>{erro}</p>}

      {/* Avaliação do paciente (readonly) */}
      {readonly && (
        <div
          style={{
            marginTop: 12,
            borderTop: `1px solid ${T.gray100}`,
            paddingTop: 10,
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 700,
              fontSize: 12,
              color: T.gray700,
            }}
          >
            Avaliação do paciente
          </p>
          {avaliacao ? (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                background: corNotaProf(avaliacao.nota).bg,
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Nunito',sans-serif",
                  fontWeight: 900,
                  fontSize: 22,
                  color: corNotaProf(avaliacao.nota).text,
                  lineHeight: 1,
                  minWidth: 28,
                }}
              >
                {avaliacao.nota}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: "'Nunito',sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    color: corNotaProf(avaliacao.nota).text,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {labelNota(avaliacao.nota)}
                </span>
                {avaliacao.comentario && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontFamily: "'Nunito',sans-serif",
                      fontSize: 12,
                      color: T.gray700,
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                    }}
                  >
                    "{avaliacao.comentario}"
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p
              style={{
                margin: 0,
                fontFamily: "'Nunito',sans-serif",
                fontSize: 12,
                color: T.gray600,
                fontStyle: "italic",
              }}
            >
              Sem avaliação ainda.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Atendimento Section
// ---------------------------------------------------------------------------

export default function Atendimento() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState<{ pacienteId: string; nome: string } | null>(null);
  // modal emitir receita
  const [emitirReceita, setEmitirReceita] = useState<{ consulta: Consulta; nome: string } | null>(null);
  // avaliações indexadas por consulta_id
  const [avaliacoesMap, setAvaliacoesMap] = useState<Record<string, Avaliacao>>({});
  // Atendimento virtual (sala in-app)
  const [ficha, setFicha] = useState<Profissional | null>(null);
  const [entrandoId, setEntrandoId] = useState<string | null>(null);
  const [sala, setSala] = useState<{ domain: string; room: string; token: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const c = await profMinhaAgenda();
      setConsultas(c);
      // Ficha p/ usar o nome do profissional como displayName na sala (best-effort).
      void profMinhaFicha()
        .then((f) => setFicha(f))
        .catch(() => {
          /* sem ficha: cai no fallback "Profissional" */
        });
      const ids = Array.from(new Set(c.map((x) => x.paciente_id)));
      if (ids.length > 0) {
        try {
          setNomes(await getNomesPacientes(ids));
        } catch {
          // fallback "Paciente #id"
        }
      } else {
        setNomes({});
      }
      // Avaliações das consultas (best-effort — não bloqueia a UI se falhar)
      try {
        const avals = await profListAvaliacoes();
        const map: Record<string, Avaliacao> = {};
        for (const a of avals) {
          if (a.consulta_id) map[a.consulta_id] = a;
        }
        setAvaliacoesMap(map);
      } catch {
        // mantém mapa anterior
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar a agenda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRealizada(id: string, obs: string) {
    await profMarcarRealizada(id);
    // grava anotação clínica se o profissional escreveu algo
    if (obs.trim().length > 0) {
      await profSalvarObsClinica(id, obs.trim());
    }
    await load();
  }

  function handleHistorico(pacienteId: string, nome: string) {
    setHistorico({ pacienteId, nome });
  }

  function handleEmitirReceita(consulta: Consulta, nome: string) {
    setEmitirReceita({ consulta, nome });
  }

  const handleEntrar = useCallback(async (c: Consulta) => {
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
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: T.gray600, fontFamily: "'Nunito',sans-serif" }}>
        Carregando atendimentos…
      </div>
    );
  }

  if (erro) {
    return (
      <div style={{ color: T.red, padding: 20, fontFamily: "'Nunito',sans-serif" }}>
        {erro}{" "}
        <button style={btnGhost} onClick={() => void load()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  const agendadas = consultas.filter((c) => c.status === "agendada");
  const realizadas = consultas.filter((c) => c.status === "realizada").slice(0, 10);

  return (
    <div>
      {/* A realizar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ ...sectionTitle, margin: 0, fontSize: 18 }}>A realizar ({agendadas.length})</h2>
        <button style={{ ...btnGhost, fontSize: 13 }} onClick={() => void load()}>
          Atualizar
        </button>
      </div>

      {agendadas.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 40, color: T.gray600, fontFamily: "'Nunito',sans-serif" }}>
          Nenhuma consulta agendada no momento.
        </div>
      ) : (
        agendadas.map((c) => (
          <ConsultaCard
            key={c.id}
            consulta={c}
            nome={nomeDoPaciente(c, nomes)}
            onRealizada={handleRealizada}
            onHistorico={handleHistorico}
            onEmitirReceita={handleEmitirReceita}
            onEntrar={handleEntrar}
            entrando={entrandoId === c.id}
          />
        ))
      )}

      {/* Realizadas recentes (anotação editável) */}
      {realizadas.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ ...sectionTitle, margin: "0 0 16px", fontSize: 18 }}>Realizadas recentes</h2>
          {realizadas.map((c) => (
            <ConsultaCard
              key={c.id}
              consulta={c}
              nome={nomeDoPaciente(c, nomes)}
              onRealizada={handleRealizada}
              onHistorico={handleHistorico}
              onEmitirReceita={handleEmitirReceita}
              readonly
              avaliacao={avaliacoesMap[c.id] ?? null}
            />
          ))}
        </div>
      )}

      {historico && (
        <HistoricoModal
          pacienteId={historico.pacienteId}
          pacienteNome={historico.nome}
          onFechar={() => setHistorico(null)}
        />
      )}

      {emitirReceita && (
        <EmitirReceitaModal
          consulta={emitirReceita.consulta}
          pacienteNome={emitirReceita.nome}
          onFechar={() => setEmitirReceita(null)}
          onEmitida={() => {
            // Mantém o modal aberto mostrando confirmação; o load() re-sincroniza
            // o histórico do paciente se ele for aberto depois.
            void load();
          }}
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
