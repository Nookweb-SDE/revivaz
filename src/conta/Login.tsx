import React, { useState } from "react";
import { Mail, Phone, ArrowRight, CheckCircle, AlertCircle, MessageCircle, User, Stethoscope, Shield } from "lucide-react";
import { T, btnPrimary } from "./ui";
import { enviarLinkEmail } from "../lib/auth";
import { supabase } from "../lib/supabase";
import ConsentimentoLGPD, { CONSENT_KEY } from "./sections/ConsentimentoLGPD";


// ─── Email flow phases ───────────────────────────────────────────────────────
type EmailPhase = "idle" | "loading" | "sent" | "error";

// O login por WhatsApp (OTP) saiu junto com o canal: sobra o magic-link por
// e-mail, que não depende de nenhum serviço de terceiro além do Supabase.
// Com um método só, o seletor de abas também deixou de fazer sentido.
// ─── Shared helpers ──────────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: `1.5px solid ${T.gray200}`,
  borderRadius: 12,
  padding: "13px 14px 13px 42px",
  fontFamily: "'Nunito', sans-serif",
  fontSize: 15,
  color: T.gray950,
  outline: "none",
  background: T.white,
  transition: "border-color 0.15s",
};

const errorBox: React.CSSProperties = {
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
};

// ─── Email section (unchanged logic) ─────────────────────────────────────────
function EmailLogin() {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<EmailPhase>("idle");
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

  if (phase === "sent") {
    return (
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
        <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: T.gray950, lineHeight: 1.4 }}>
          Link enviado!
        </p>
        <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: T.gray600, lineHeight: 1.5 }}>
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
          onClick={() => { setPhase("idle"); setEmail(""); }}
        >
          Usar outro e-mail
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label
        htmlFor="login-email"
        style={{ display: "block", fontWeight: 700, fontSize: 13, color: T.gray700, marginBottom: 8 }}
      >
        E-mail
      </label>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <Mail
          size={17}
          color={T.gray600}
          aria-hidden="true"
          style={{ position: "absolute", top: "50%", left: 14, transform: "translateY(-50%)", pointerEvents: "none" }}
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
            ...inputBase,
            border: `1.5px solid ${phase === "error" ? "#E5484D" : T.gray200}`,
            background: phase === "loading" ? T.gray100 : T.white,
          }}
          onFocus={(e) => { if (phase !== "error") e.currentTarget.style.borderColor = T.teal700; }}
          onBlur={(e) => { if (phase !== "error") e.currentTarget.style.borderColor = T.gray200; }}
        />
      </div>

      {phase === "error" && erro && (
        <div role="alert" style={errorBox}>
          <AlertCircle size={15} aria-hidden="true" />
          {erro}
        </div>
      )}

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
            !email.trim() || phase === "loading" ? "none" : "0 4px 14px rgba(0,122,140,0.28)",
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
  );
}

// ─── Faixa de acesso rápido (DEV ONLY) ──────────────────────────────────────
// O Vite REMOVE este caminho do bundle de produção (import.meta.env.DEV=false).
// O endpoint /api/auth/dev-login também recusa quando NODE_ENV=production.
// home aponta pro .html: a faixa SÓ existe em dev (Vite), onde as rotas limpas
// (/conta, /profissional) não resolvem — o servidor Vite serve <area>.html.
const DEV_PERFIS: { perfil: string; label: string; icon: React.ElementType; home: string }[] = [
  { perfil: "paciente", label: "Usuário", icon: User, home: "/conta.html" },
  { perfil: "profissional", label: "Profissional", icon: Stethoscope, home: "/profissional.html" },
  { perfil: "admin", label: "Admin", icon: Shield, home: "/admin.html" },
];

function DevLoginBand() {
  const [loading, setLoading] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar(perfil: string, home: string) {
    if (loading) return;
    setLoading(perfil);
    setErro(null);
    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil }),
      });
      const data = (await res.json()) as {
        access_token?: string;
        refresh_token?: string;
        error?: string;
      };
      if (!res.ok || !data.access_token || !data.refresh_token) {
        setErro(data.error ?? "Falha no dev-login");
        setLoading(null);
        return;
      }
      const { error } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (error) {
        setErro("Erro ao iniciar sessão.");
        setLoading(null);
        return;
      }
      window.location.href = home;
    } catch {
      setErro("Erro de conexão.");
      setLoading(null);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 400, marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ flex: 1, height: 1, background: T.gray200 }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: T.gray600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontFamily: "'Nunito',sans-serif",
          }}
        >
          Acesso rápido (dev)
        </span>
        <span style={{ flex: 1, height: 1, background: T.gray200 }} />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {DEV_PERFIS.map(({ perfil, label, icon: Icon, home }) => {
          const busy = loading === perfil;
          return (
            <button
              key={perfil}
              type="button"
              onClick={() => entrar(perfil, home)}
              disabled={loading !== null}
              aria-label={`Entrar como ${label} (dev)`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "14px 8px",
                borderRadius: 14,
                border: `1.5px solid ${T.teal100}`,
                background: busy ? T.teal100 : T.white,
                cursor: loading ? "default" : "pointer",
                fontFamily: "'Nunito',sans-serif",
                color: T.teal700,
                transition: "background .15s",
              }}
            >
              <Icon size={22} aria-hidden="true" />
              <span style={{ fontSize: 12, fontWeight: 700 }}>
                {busy ? "Entrando…" : label}
              </span>
            </button>
          );
        })}
      </div>
      {erro && (
        <div
          role="alert"
          style={{
            marginTop: 10,
            fontSize: 12,
            color: T.red,
            textAlign: "center",
            fontFamily: "'Nunito',sans-serif",
          }}
        >
          {erro}
        </div>
      )}
      <p
        style={{
          marginTop: 8,
          fontSize: 10,
          color: T.gray600,
          textAlign: "center",
          fontFamily: "'Nunito',sans-serif",
        }}
      >
        Só em ambiente de desenvolvimento.
      </p>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function Login(): JSX.Element {
  // Consent gate: check once on mount. Re-render when user accepts.
  const [consentido, setConsentido] = useState<boolean>(
    () => !!localStorage.getItem(CONSENT_KEY)
  );

  const subtitle = "Você receberá um link de acesso no seu e-mail.";

  // Show LGPD consent modal before anything else
  if (!consentido) {
    return (
      <>
        {/* Blurred background preview of the login page */}
        <div
          aria-hidden="true"
          style={{
            background: T.gray050,
            minHeight: "100vh",
            fontFamily: "'Nunito', sans-serif",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
            filter: "blur(3px)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
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
            <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 26, color: T.teal700, letterSpacing: "-0.5px", lineHeight: 1 }}>
              Revivaz
            </p>
            <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 20, color: T.gray950 }}>
              Acessar minha conta
            </p>
            <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: T.gray600 }}>
              Informe seu e-mail e enviaremos um link de acesso.
            </p>
          </div>
        </div>
        {/* Consent modal on top */}
        <ConsentimentoLGPD onAceitar={() => setConsentido(true)} />
      </>
    );
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
            margin: "0 0 20px",
            fontWeight: 500,
            fontSize: 14,
            color: T.gray600,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>

        {/* Método único: magic-link por e-mail. */}
        <EmailLogin />
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

      {/* Acesso rápido por perfil — só em dev (removido do build de produção) */}
      {import.meta.env.DEV && <DevLoginBand />}

      {/* Spinner keyframe injected inline via a style tag */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
