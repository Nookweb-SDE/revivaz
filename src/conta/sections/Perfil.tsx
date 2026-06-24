import React, { useState } from "react";
import { User, Phone, Bell, LogOut, Check, AlertCircle, Loader2 } from "lucide-react";
import { T, card, sectionTitle, btnPrimary, btnGhost } from "../ui";
import { atualizarProfile } from "../../lib/data";
import type { UsuarioUI as Usuario } from "../types";
import type { Profile } from "../../lib/types";

/* ─── field label ─── */
const fieldLabel: React.CSSProperties = {
  margin: "0 0 6px",
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 600,
  fontSize: 11,
  color: T.gray600,
  textTransform: "uppercase",
  letterSpacing: 0.8,
  display: "block",
};

const fieldInput: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  borderRadius: 12,
  border: `1.5px solid ${T.gray200}`,
  background: T.white,
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 600,
  fontSize: 14,
  color: T.gray950,
  outline: "none",
  minHeight: 44,
};

/* ─── editable field ─── */
function Field({
  icon,
  label,
  value,
  onChange,
  id,
  type = "text",
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 0",
        borderBottom: `1px solid ${T.gray100}`,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: T.teal050,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: T.teal700,
          flexShrink: 0,
          marginTop: 18,
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <label htmlFor={id} style={fieldLabel}>
          {label}
        </label>
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={fieldInput}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = T.teal500;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = T.gray200;
          }}
        />
      </div>
    </div>
  );
}

/* ─── toggle ─── */
function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        background: checked ? T.teal700 : T.gray200,
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
        padding: 0,
      }}
      aria-label="Ativar ou desativar lembretes de consulta"
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: T.white,
          boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
          transition: "left 0.2s",
          display: "block",
        }}
      />
    </button>
  );
}

/* ─── main ─── */
export default function Perfil({
  usuario,
  onSair,
}: {
  usuario: Usuario;
  onSair?: () => void;
}): JSX.Element {
  // editable identity fields (seeded from props)
  const [nome, setNome] = useState(usuario.nome ?? "");
  const [telefone, setTelefone] = useState("");
  const [emergenciaNome, setEmergenciaNome] = useState(usuario.emergenciaNome ?? "");
  const [emergenciaTel, setEmergenciaTel] = useState(usuario.emergenciaTel ?? "");

  // preferences
  const [lembretes, setLembretes] = useState(usuario.preferencias.lembretes);
  const [modalidade, setModalidade] = useState<"online" | "presencial">(
    usuario.preferencias.modalidade
  );

  // feedback state
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(
    null
  );

  const dirty =
    nome !== (usuario.nome ?? "") ||
    telefone.trim() !== "" ||
    emergenciaNome !== (usuario.emergenciaNome ?? "") ||
    emergenciaTel !== (usuario.emergenciaTel ?? "") ||
    lembretes !== usuario.preferencias.lembretes ||
    modalidade !== usuario.preferencias.modalidade;

  async function salvar() {
    if (salvando) return;
    setSalvando(true);
    setFeedback(null);
    try {
      const patch: Partial<Profile> = {
        nome: nome.trim(),
        emergencia_nome: emergenciaNome.trim(),
        emergencia_tel: emergenciaTel.trim(),
        prefs: { lembretes, modalidade },
      };
      // only send telefone when the user actually typed something,
      // since the prop layer (UsuarioUI) doesn't carry the current value
      if (telefone.trim() !== "") patch.telefone = telefone.trim();

      await atualizarProfile(patch);
      setFeedback({ ok: true, msg: "Alterações salvas." });
    } catch (e) {
      setFeedback({
        ok: false,
        msg:
          e instanceof Error
            ? `Não foi possível salvar: ${e.message}`
            : "Não foi possível salvar. Tente novamente.",
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section aria-label="Meu perfil">
      <h2 style={sectionTitle}>Meu perfil</h2>

      {/* identity card */}
      <div style={{ ...card, marginBottom: 12 }}>
        {/* avatar + name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            paddingBottom: 16,
            borderBottom: `1px solid ${T.gray100}`,
            marginBottom: 4,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${T.teal500} 0%, ${T.teal700} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.white,
              flexShrink: 0,
            }}
          >
            <User size={26} strokeWidth={2} />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Nunito',sans-serif",
                fontWeight: 800,
                fontSize: 18,
                color: T.gray950,
              }}
            >
              {nome || "Sem nome"}
            </p>
            <p
              style={{
                margin: "3px 0 0",
                fontFamily: "'Nunito',sans-serif",
                fontWeight: 600,
                fontSize: 13,
                color: T.teal700,
              }}
            >
              Paciente
            </p>
          </div>
        </div>

        {/* editable identity fields */}
        <Field
          id="perfil-nome"
          icon={<User size={16} strokeWidth={2.2} />}
          label="Nome"
          value={nome}
          onChange={setNome}
          placeholder="Seu nome completo"
        />
        <Field
          id="perfil-telefone"
          icon={<Phone size={16} strokeWidth={2.2} />}
          label="Telefone"
          value={telefone}
          onChange={setTelefone}
          type="tel"
          placeholder="(00) 00000-0000"
        />
        <Field
          id="perfil-emerg-nome"
          icon={<User size={16} strokeWidth={2.2} />}
          label="Contato de emergência"
          value={emergenciaNome}
          onChange={setEmergenciaNome}
          placeholder="Nome do contato"
        />
        <Field
          id="perfil-emerg-tel"
          icon={<Phone size={16} strokeWidth={2.2} />}
          label="Telefone de emergência"
          value={emergenciaTel}
          onChange={setEmergenciaTel}
          type="tel"
          placeholder="(00) 00000-0000"
        />
      </div>

      {/* preferences card */}
      <div style={{ ...card, marginBottom: 12 }}>
        <p
          style={{
            margin: "0 0 14px",
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: T.gray600,
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          Preferências
        </p>

        {/* lembretes toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingBottom: 14,
            borderBottom: `1px solid ${T.gray100}`,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: T.teal050,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: T.teal700,
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <Bell size={16} strokeWidth={2.2} />
            </div>
            <div>
              <label
                htmlFor="toggle-lembretes"
                style={{
                  fontFamily: "'Nunito',sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: T.gray950,
                  cursor: "pointer",
                  display: "block",
                }}
              >
                Lembretes de consulta
              </label>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Nunito',sans-serif",
                  fontWeight: 500,
                  fontSize: 12,
                  color: T.gray600,
                }}
              >
                Receba avisos antes das suas consultas
              </p>
            </div>
          </div>
          <Toggle
            id="toggle-lembretes"
            checked={lembretes}
            onChange={setLembretes}
          />
        </div>

        {/* modalidade */}
        <div>
          <p
            style={{
              margin: "0 0 10px",
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: T.gray950,
            }}
          >
            Modalidade preferida
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {(["online", "presencial"] as const).map((m) => {
              const active = modalidade === m;
              return (
                <button
                  key={m}
                  onClick={() => setModalidade(m)}
                  aria-pressed={active}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 12,
                    border: active
                      ? `2px solid ${T.teal700}`
                      : `2px solid ${T.gray200}`,
                    background: active ? T.teal050 : T.white,
                    fontFamily: "'Nunito',sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    color: active ? T.teal700 : T.gray600,
                    cursor: "pointer",
                    transition: "all 0.18s",
                    minHeight: 44,
                    textTransform: "capitalize",
                  }}
                >
                  {m === "online" ? "Online" : "Presencial"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* inline feedback */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 12,
            marginBottom: 12,
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 700,
            fontSize: 13.5,
            background: feedback.ok ? T.teal050 : "#FDECEC",
            color: feedback.ok ? T.teal900 : T.red,
            border: `1px solid ${feedback.ok ? T.teal100 : "#F5C6C6"}`,
          }}
        >
          {feedback.ok ? (
            <Check size={16} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" />
          )}
          {feedback.msg}
        </div>
      )}

      {/* save button */}
      {(dirty || salvando) && (
        <div style={{ marginBottom: 12 }}>
          <button
            disabled={salvando}
            style={{
              ...btnPrimary,
              width: "100%",
              fontFamily: "'Nunito',sans-serif",
              fontSize: 15,
              fontWeight: 800,
              borderRadius: 14,
              minHeight: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: salvando ? 0.7 : 1,
              cursor: salvando ? "default" : "pointer",
            }}
            onClick={salvar}
          >
            {salvando && (
              <Loader2
                size={18}
                strokeWidth={2.5}
                aria-hidden="true"
                style={{ animation: "perfil-spin 0.8s linear infinite" }}
              />
            )}
            {salvando ? "Salvando…" : "Salvar alterações"}
          </button>
          <style>{`@keyframes perfil-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* sign out */}
      <div style={{ ...card }}>
        <button
          style={{
            ...btnGhost,
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: T.red,
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 700,
            fontSize: 15,
            width: "100%",
            padding: "6px 0",
            minHeight: 44,
          }}
          onClick={() => (onSair ? onSair() : undefined)}
          aria-label="Sair da conta"
        >
          <LogOut size={18} strokeWidth={2.2} aria-hidden="true" />
          Sair da conta
        </button>
      </div>
    </section>
  );
}
