import React, { useState } from "react";
import { User, Phone, Bell, LogOut } from "lucide-react";
import { T, card, sectionTitle, btnPrimary, btnGhost } from "../ui";
import type { Usuario } from "../sampleData";

/* ─── row helper ─── */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
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
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 600,
            fontSize: 11,
            color: T.gray600,
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: T.gray950,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </p>
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
export default function Perfil({ usuario }: { usuario: Usuario }): JSX.Element {
  const [lembretes, setLembretes] = useState(usuario.preferencias.lembretes);
  const [modalidade, setModalidade] = useState<"online" | "presencial">(
    usuario.preferencias.modalidade
  );

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
              {usuario.nome}
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

        {/* emergency contact */}
        <InfoRow
          icon={<Phone size={16} strokeWidth={2.2} />}
          label="Contato de emergência"
          value={`${usuario.emergenciaNome} · ${usuario.emergenciaTel}`}
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

      {/* sign out */}
      <div style={{ ...card }}>
        <button
          style={{
            ...btnGhost,
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "#C0392B",
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 700,
            fontSize: 15,
            width: "100%",
            padding: "6px 0",
            minHeight: 44,
          }}
          onClick={() => alert("Saindo da conta…")}
          aria-label="Sair da conta"
        >
          <LogOut size={18} strokeWidth={2.2} aria-hidden="true" />
          Sair da conta
        </button>
      </div>

      {/* save button — shows only when prefs changed */}
      {(lembretes !== usuario.preferencias.lembretes ||
        modalidade !== usuario.preferencias.modalidade) && (
        <div style={{ marginTop: 14 }}>
          <button
            style={{
              ...btnPrimary,
              width: "100%",
              fontFamily: "'Nunito',sans-serif",
              fontSize: 15,
              fontWeight: 800,
              borderRadius: 14,
              minHeight: 52,
            }}
            onClick={() => alert("Preferências salvas!")}
          >
            Salvar preferências
          </button>
        </div>
      )}
    </section>
  );
}
