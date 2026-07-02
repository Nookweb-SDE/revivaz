/**
 * DefinirHorarioForm.tsx
 * Formulário de definição / confirmação de horário de uma consulta.
 * Extraído de Agenda.tsx (era AgendarForm). Sem lógica de API —
 * recebe callbacks do pai e notifica via onConfirmar / onCancelar.
 */
import React, { useState } from "react";
import { Check } from "lucide-react";
import { T, btnGhost, btnPrimary } from "../../conta/ui";
import type { Consulta } from "../../lib/types";

/* payload que sobe para o pai ao confirmar o agendamento */
export interface DefinirHorarioPayload {
  data: string;
  hora: string;
  link_ou_local?: string;
}

interface Props {
  consulta: Consulta;
  onConfirmar: (dados: DefinirHorarioPayload) => void;
  onCancelar: () => void;
  busy: boolean;
}

export default function DefinirHorarioForm({
  consulta,
  onConfirmar,
  onCancelar,
  busy,
}: Props): JSX.Element {
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!podeConfirmar) return;
    onConfirmar({
      data: data.trim(),
      hora: hora.trim(),
      link_ou_local: link.trim() || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
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
          {linkLabel}{" "}
          <span style={{ fontWeight: 500, color: T.gray600 }}>(opcional)</span>
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
