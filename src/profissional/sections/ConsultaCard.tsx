/**
 * ConsultaCard.tsx
 * Card individual de cada consulta na agenda do profissional.
 * Extraído de Agenda.tsx (era ConsultaRow). Handlers passados como props
 * são memoizados com useCallback para evitar re-renders desnecessários
 * nos componentes filhos (DefinirHorarioForm, TriagemRecente).
 */
import React, { useState, useCallback } from "react";
import {
  Calendar,
  Clock,
  Video,
  CalendarPlus,
  Check,
  Link2,
  XCircle,
  History,
} from "lucide-react";
import { T, card, btnPrimary, btnGhost } from "../../conta/ui";
import type { Consulta } from "../../lib/types";
import { isOnline } from "../../video/room";
import DefinirHorarioForm from "./DefinirHorarioForm";
import type { DefinirHorarioPayload } from "./DefinirHorarioForm";
import TriagemRecente from "./TriagemRecente";
import { formatData, tipoBadge, PacienteAvatar } from "./agendaUtils";

interface Props {
  c: Consulta;
  nome: string;
  onDefinir: (id: string, dados: DefinirHorarioPayload) => void;
  onRealizada: (id: string) => void;
  onCancelar: (id: string, nome: string) => void;
  onHistorico: (pacienteId: string, nome: string) => void;
  onEntrar: (c: Consulta) => void;
  busyId: string | null;
  entrandoId: string | null;
}

export default function ConsultaCard({
  c,
  nome,
  onDefinir,
  onRealizada,
  onCancelar,
  onHistorico,
  onEntrar,
  busyId,
  entrandoId,
}: Props): JSX.Element {
  const [aberto, setAberto] = useState(false);

  const busy = busyId === c.id;
  const pendente = c.status === "solicitada";
  // Sala de vídeo só para consulta online já agendada.
  const podeEntrar = c.status === "agendada" && isOnline(c.tipo);
  const entrando = entrandoId === c.id;

  /* ─── handlers memoizados — evitam criar nova referência a cada render ─── */
  const handleFecharForm = useCallback(() => setAberto(false), []);

  const handleConfirmarForm = useCallback(
    (dados: DefinirHorarioPayload) => onDefinir(c.id, dados),
    [onDefinir, c.id],
  );

  const handleVerHistorico = useCallback(
    () => onHistorico(c.paciente_id, nome),
    [onHistorico, c.paciente_id, nome],
  );

  const handleMarcarRealizada = useCallback(
    () => onRealizada(c.id),
    [onRealizada, c.id],
  );

  const handleCancelar = useCallback(
    () => onCancelar(c.id, nome),
    [onCancelar, c.id, nome],
  );

  const handleEntrar = useCallback(() => onEntrar(c), [onEntrar, c]);

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 12, padding: "14px 16px" }}>
      {/* topo: avatar + info + badge de tipo */}
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

      {/* observação do paciente */}
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

      {/* link/local (quando já agendada) */}
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

      {/* triagem recente (autoavaliação PHQ-9 / GAD-7) — read-only, expansível */}
      <TriagemRecente pacienteId={c.paciente_id} />

      {/* ações */}
      {pendente && aberto ? (
        <DefinirHorarioForm
          consulta={c}
          busy={busy}
          onCancelar={handleFecharForm}
          onConfirmar={handleConfirmarForm}
        />
      ) : (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={handleVerHistorico}
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
                  onClick={handleEntrar}
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
                onClick={handleCancelar}
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
                onClick={handleMarcarRealizada}
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
