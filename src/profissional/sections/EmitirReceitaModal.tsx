/**
 * Emissão de receita pelo profissional.
 * Movido verbatim do Atendimento.tsx na decomposição. `isFormReceitaValido` é
 * pura e tem teste próprio.
 */
import React, { useEffect, useState } from "react";
import { T, card, btnPrimary, btnGhost } from "../../conta/ui";
import type { Consulta, Receita } from "../../lib/types";
import { shortId, badgeStyle, formatDataHora } from "./_lib/atendimentoUtils";
import { FileText, Send, CheckCircle2 } from "lucide-react";
import { profLancarReceita } from "../../lib/data";

// ---------------------------------------------------------------------------
// Emitir Receita Modal
// ---------------------------------------------------------------------------

import {
  type FormReceita,
  emptyFormReceita,
  isFormReceitaValido,
} from "./_lib/receitaForm";

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

export default EmitirReceitaModal;
