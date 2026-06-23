import React, { useState } from "react";
import { Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { T, btnPrimary } from "./ui";
import { enviarLinkEmail } from "../lib/auth";

type Phase = "idle" | "loading" | "sent" | "error";

export default function Login(): JSX.Element {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || phase === "loading") return;

    setPhase("loading");
    setErro(null);

    const result = await enviarLinkEmail(email.trim());

    if (result.ok) {
      setPhase("sent");
    } else {
      setErro(result.erro ?? "Erro desconhecido. Tente novamente.");
      setPhase("error");
    }
  }

  return (
    <div
      style={{
        background: T.gray050,
        minHeight: "100vh",
        fontFamily: "'Nunito', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      {/* Card container */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: T.white,
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 8px 40px rgba(0,122,140,0.13), 0 2px 8px rgba(0,0,0,0.06)",
          border: `1px solid ${T.gray200}`,
        }}
      >
        {/* Logo */}
        <p
          style={{
            margin: "0 0 6px",
            fontWeight: 800,
            fontSize: 26,
            color: T.teal700,
            letterSpacing: "-0.5px",
            lineHeight: 1,
          }}
        >
          Revivaz
        </p>

        {/* Heading */}
        <p
          style={{
            margin: "0 0 8px",
            fontWeight: 800,
            fontSize: 20,
            color: T.gray950,
            lineHeight: 1.3,
          }}
        >
          Acessar minha conta
        </p>
        <p
          style={{
            margin: "0 0 28px",
            fontWeight: 500,
            fontSize: 14,
            color: T.gray600,
            lineHeight: 1.5,
          }}
        >
          Informe seu e-mail e enviaremos um link de acesso.
        </p>

        {/* Success state */}
        {phase === "sent" ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              padding: "20px 0 8px",
              textAlign: "center",
            }}
          >
            <CheckCircle size={52} color={T.teal700} strokeWidth={1.8} aria-hidden="true" />
            <p
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: 17,
                color: T.gray950,
                lineHeight: 1.4,
              }}
            >
              Link enviado!
            </p>
            <p
              style={{
                margin: 0,
                fontWeight: 500,
                fontSize: 14,
                color: T.gray600,
                lineHeight: 1.5,
              }}
            >
              Enviamos um link de acesso pro seu e-mail{" "}
              <strong style={{ color: T.gray950 }}>{email}</strong>.
              <br />
              Verifique sua caixa de entrada (e o spam).
            </p>
            <button
              type="button"
              style={{
                ...btnPrimary,
                marginTop: 8,
                fontSize: 14,
                fontFamily: "'Nunito',sans-serif",
                fontWeight: 700,
                background: "transparent",
                color: T.teal700,
                border: `1.5px solid ${T.teal700}`,
                borderRadius: 12,
              }}
              onClick={() => {
                setPhase("idle");
                setEmail("");
              }}
            >
              Usar outro e-mail
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* Email input */}
            <label
              htmlFor="login-email"
              style={{
                display: "block",
                fontWeight: 700,
                fontSize: 13,
                color: T.gray700,
                marginBottom: 8,
              }}
            >
              E-mail
            </label>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <Mail
                size={17}
                color={T.gray600}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 14,
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={phase === "loading"}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: `1.5px solid ${phase === "error" ? "#E5484D" : T.gray200}`,
                  borderRadius: 12,
                  padding: "13px 14px 13px 42px",
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 15,
                  color: T.gray950,
                  outline: "none",
                  background: phase === "loading" ? T.gray100 : T.white,
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => {
                  if (phase !== "error") {
                    e.currentTarget.style.borderColor = T.teal700;
                  }
                }}
                onBlur={(e) => {
                  if (phase !== "error") {
                    e.currentTarget.style.borderColor = T.gray200;
                  }
                }}
              />
            </div>

            {/* Error message */}
            {phase === "error" && erro && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 16,
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#991B1B",
                }}
              >
                <AlertCircle size={15} aria-hidden="true" />
                {erro}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!email.trim() || phase === "loading"}
              aria-label="Enviar link de acesso"
              style={{
                ...btnPrimary,
                width: "100%",
                marginTop: 16,
                fontSize: 15,
                fontFamily: "'Nunito',sans-serif",
                fontWeight: 800,
                borderRadius: 14,
                minHeight: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background:
                  !email.trim() || phase === "loading"
                    ? T.teal300
                    : `linear-gradient(90deg, ${T.teal900} 0%, ${T.teal700} 100%)`,
                cursor: !email.trim() || phase === "loading" ? "not-allowed" : "pointer",
                opacity: 1,
                boxShadow:
                  !email.trim() || phase === "loading"
                    ? "none"
                    : "0 4px 14px rgba(0,122,140,0.28)",
                transition: "background 0.2s, box-shadow 0.2s",
              }}
            >
              {phase === "loading" ? (
                <>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: "2.5px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#fff",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  Enviando…
                </>
              ) : (
                <>
                  Enviar link de acesso
                  <ArrowRight size={17} strokeWidth={2.5} aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Tagline */}
      <p
        style={{
          marginTop: 24,
          fontWeight: 500,
          fontSize: 13,
          color: T.gray600,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        Saúde mental acessível para todos.
      </p>

      {/* Spinner keyframe injected inline via a style tag */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
