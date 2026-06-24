import React, { useState } from "react";
import { Mail, Phone, ArrowRight, CheckCircle, AlertCircle, MessageCircle, User, Stethoscope, Shield } from "lucide-react";
import { T, btnPrimary } from "./ui";
import { enviarLinkEmail } from "../lib/auth";
import { supabase } from "../lib/supabase";

type LoginMethod = "email" | "whatsapp";

// ─── Email flow phases ───────────────────────────────────────────────────────
type EmailPhase = "idle" | "loading" | "sent" | "error";

// ─── WhatsApp flow phases ────────────────────────────────────────────────────
type WaPhase = "phone" | "loading-send" | "code" | "loading-verify" | "error";

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

// ─── Tab toggle ──────────────────────────────────────────────────────────────
interface TabToggleProps {
  method: LoginMethod;
  onChange: (m: LoginMethod) => void;
}
function TabToggle({ method, onChange }: TabToggleProps) {
  const tab = (label: string, value: LoginMethod, Icon: React.ElementType) => {
    const active = method === value;
    return (
      <button
        type="button"
        onClick={() => onChange(value)}
        aria-pressed={active}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "9px 0",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          transition: "background 0.15s, color 0.15s",
          background: active ? T.teal700 : "transparent",
          color: active ? T.white : T.gray600,
        }}
      >
        <Icon size={15} aria-hidden="true" />
        {label}
      </button>
    );
  };

  return (
    <div
      role="tablist"
      aria-label="Método de login"
      style={{
        display: "flex",
        background: T.gray100,
        borderRadius: 12,
        padding: 3,
        marginBottom: 24,
      }}
    >
      {tab("E-mail", "email", Mail)}
      {tab("WhatsApp", "whatsapp", MessageCircle)}
    </div>
  );
}

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

// ─── WhatsApp OTP section ─────────────────────────────────────────────────────
function WhatsAppLogin() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<WaPhase>("phone");
  const [step, setStep] = useState<"phone" | "code">("phone"); // tracks UI step independently
  const [erro, setErro] = useState<string | null>(null);

  // Format phone for display (Brazilian: (XX) XXXXX-XXXX)
  function formatPhone(raw: string) {
    const d = raw.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || phase === "loading-send") return;
    setPhase("loading-send");
    setErro(null);

    try {
      const res = await fetch("/api/wa/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErro(data.error ?? "Erro ao enviar código. Tente novamente.");
        setPhase("error");
      } else {
        setPhase("code");
        setStep("code");
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
      setPhase("error");
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    const token = code.trim();
    if (token.length !== 6 || phase === "loading-verify") return;
    setPhase("loading-verify");
    setErro(null);

    try {
      const res = await fetch("/api/wa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.replace(/\D/g, ""), code: token }),
      });
      const data = await res.json() as { access_token?: string; refresh_token?: string; error?: string };
      if (!res.ok || !data.access_token || !data.refresh_token) {
        setErro(data.error ?? "Código inválido. Tente novamente.");
        setPhase("error");
        return;
      }
      // Inject the session obtained from the server into the Supabase client
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionErr) {
        setErro("Erro ao iniciar sessão. Tente novamente.");
        setPhase("error");
      }
      // On success the session is set; useSession picks it up automatically.
    } catch {
      setErro("Erro de conexão. Tente novamente.");
      setPhase("error");
    }
  }

  const isLoading = phase === "loading-send" || phase === "loading-verify";

  const submitBtn = (
    label: string,
    disabled: boolean,
    loadingLabel: string,
    loading: boolean
  ) => (
    <button
      type="submit"
      disabled={disabled || loading}
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
          disabled || loading
            ? T.teal300
            : `linear-gradient(90deg, ${T.teal900} 0%, ${T.teal700} 100%)`,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: 1,
        boxShadow: disabled || loading ? "none" : "0 4px 14px rgba(0,122,140,0.28)",
        transition: "background 0.2s, box-shadow 0.2s",
      }}
    >
      {loading ? (
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
          {loadingLabel}
        </>
      ) : (
        <>
          {label}
          <ArrowRight size={17} strokeWidth={2.5} aria-hidden="true" />
        </>
      )}
    </button>
  );

  if (step === "code") {
    return (
      <form onSubmit={handleVerifyCode} noValidate>
        <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13, color: T.gray700 }}>
          Código enviado para
        </p>
        <p style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 15, color: T.gray950 }}>
          {formatPhone(phone)}
          <button
            type="button"
            onClick={() => { setPhase("phone"); setStep("phone"); setCode(""); setErro(null); }}
            style={{
              marginLeft: 10,
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 600,
              fontSize: 12,
              color: T.teal700,
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Trocar número
          </button>
        </p>

        <label
          htmlFor="wa-code"
          style={{ display: "block", fontWeight: 700, fontSize: 13, color: T.gray700, marginBottom: 8 }}
        >
          Código de 6 dígitos (WhatsApp)
        </label>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <MessageCircle
            size={17}
            color={T.gray600}
            aria-hidden="true"
            style={{ position: "absolute", top: "50%", left: 14, transform: "translateY(-50%)", pointerEvents: "none" }}
          />
          <input
            id="wa-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={code}
            maxLength={6}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            required
            disabled={isLoading}
            style={{
              ...inputBase,
              letterSpacing: "0.25em",
              background: isLoading ? T.gray100 : T.white,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = T.teal700; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = T.gray200; }}
          />
        </div>

        {erro && (
          <div role="alert" style={errorBox}>
            <AlertCircle size={15} aria-hidden="true" />
            {erro}
          </div>
        )}

        {submitBtn(
          "Verificar código",
          code.trim().length !== 6,
          "Verificando…",
          phase === "loading-verify"
        )}
      </form>
    );
  }

  // Phone entry step
  return (
    <form onSubmit={handleSendCode} noValidate>
      <label
        htmlFor="wa-phone"
        style={{ display: "block", fontWeight: 700, fontSize: 13, color: T.gray700, marginBottom: 8 }}
      >
        Seu WhatsApp (com DDD)
      </label>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <Phone
          size={17}
          color={T.gray600}
          aria-hidden="true"
          style={{ position: "absolute", top: "50%", left: 14, transform: "translateY(-50%)", pointerEvents: "none" }}
        />
        <input
          id="wa-phone"
          type="tel"
          autoComplete="tel"
          autoFocus
          value={formatPhone(phone)}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
            setPhone(raw);
          }}
          placeholder="(11) 99999-9999"
          required
          disabled={isLoading}
          style={{
            ...inputBase,
            background: isLoading ? T.gray100 : T.white,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = T.teal700; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = T.gray200; }}
        />
      </div>

      {erro && (
        <div role="alert" style={errorBox}>
          <AlertCircle size={15} aria-hidden="true" />
          {erro}
        </div>
      )}

      {submitBtn(
        "Enviar código pelo WhatsApp",
        phone.replace(/\D/g, "").length < 10,
        "Enviando…",
        phase === "loading-send"
      )}
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
  const [method, setMethod] = useState<LoginMethod>("email");

  const subtitle =
    method === "email"
      ? "Informe seu e-mail e enviaremos um link de acesso."
      : "Você receberá um código de 6 dígitos via WhatsApp.";

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

        {/* Tab toggle */}
        <TabToggle method={method} onChange={setMethod} />

        {/* Active login form */}
        {method === "email" ? <EmailLogin /> : <WhatsAppLogin />}
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
