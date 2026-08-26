/**
 * Cartão de uma consulta na aba Atendimento.
 * Movido verbatim do Atendimento.tsx na decomposição. Nome com prefixo porque
 * já existe um ConsultaCard.tsx nesta pasta, usado pela Agenda.
 */
import React, { useEffect, useState } from "react";
import { T, card, btnPrimary, btnGhost } from "../../conta/ui";
import type { Consulta, Receita } from "../../lib/types";
import { shortId, badgeStyle, formatDataHora } from "./_lib/atendimentoUtils";
import { FileText, Send, CheckCircle2 } from "lucide-react";
import type { Profissional, Avaliacao } from "../../lib/types";
import { profSalvarObsClinica } from "../../lib/data";
import { isOnline } from "../../video/room";
import { jitsiConfigured } from "../../video/config";
import { nomeDoPaciente, corNotaProf, labelNota } from "./_lib/atendimentoUtils";
import TriagemRecente from "./TriagemRecente";
import NotaClinicaIA from "./NotaClinicaIA";

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

export default ConsultaCard;
