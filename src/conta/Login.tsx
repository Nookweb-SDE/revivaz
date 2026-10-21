import React, { useEffect, useState } from "react";
import { Mail, ArrowRight, AlertCircle, KeyRound, User, Stethoscope, Shield } from "lucide-react";
import { T, btnPrimary } from "./ui";
import { pedirAcesso, entrarComSenha, entrarPeloLink, criarSenha } from "../lib/auth";
import { avisar } from "../components/avisos/aviso.logic";
import { supabase } from "../lib/supabase";
import ConsentimentoLGPD, { CONSENT_KEY } from "./sections/ConsentimentoLGPD";


// O login por WhatsApp (OTP) saiu junto com o canal. Fica o acesso por e-mail:
// o servidor manda um link de um clique e uma senha temporária (código de 6
// dígitos) pelo SMTP da Revivaz; no primeiro acesso a pessoa cria a senha dela.
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

const botaoPrincipal = (desligado: boolean): React.CSSProperties => ({
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
  background: desligado ? T.teal300 : `linear-gradient(90deg, ${T.teal900} 0%, ${T.teal700} 100%)`,
  cursor: desligado ? "not-allowed" : "pointer",
  opacity: 1,
  boxShadow: desligado ? "none" : "0 4px 14px rgba(0,122,140,0.28)",
  transition: "background 0.2s, box-shadow 0.2s",
});

const linkTexto: React.CSSProperties = {
  display: "block",
  margin: "14px auto 0",
  background: "none",
  border: "none",
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 700,
  fontSize: 13,
  color: T.teal700,
  cursor: "pointer",
};

const rotulo: React.CSSProperties = { display: "block", fontWeight: 700, fontSize: 13, color: T.gray700, marginBottom: 8 };
const iconeCampo: React.CSSProperties = { position: "absolute", top: "50%", left: 14, transform: "translateY(-50%)", pointerEvents: "none" };

function Girando() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 16, height: 16, borderRadius: "50%", display: "inline-block",
        border: "2.5px solid rgba(255,255,255,0.35)", borderTopColor: "#fff",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

function Cabecalho({ titulo, sub }: { titulo: string; sub: React.ReactNode }) {
  return (
    <>
      <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 20, color: T.gray950, lineHeight: 1.3 }}>{titulo}</p>
      <p style={{ margin: "0 0 20px", fontWeight: 500, fontSize: 14, color: T.gray600, lineHeight: 1.5 }}>{sub}</p>
    </>
  );
}

// ─── Acesso por e-mail: pede (A) → entra com a senha do e-mail (B) ──────────
type Passo = "email" | "senha";

function AcessoEmail() {
  const [passo, setPasso] = useState<Passo>("email");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Chegou pelo link do e-mail: troca o token por sessão. Dando certo, a
  // sessão nova tira esta tela sozinha.
  useEffect(() => {
    entrarPeloLink().then((r) => {
      if (r === "expirado") {
        avisar("link-expirado", "Peça um acesso novo abaixo");
        setErro("Esse link já foi usado ou expirou. Peça um novo.");
      }
    });
  }, []);

  async function pedir(e?: React.FormEvent) {
    e?.preventDefault();
    const alvo = email.trim();
    if (!alvo || ocupado) return;
    setOcupado(true);
    setErro(null);
    const r = await pedirAcesso(alvo);
    setOcupado(false);
    if (r.ok) {
      avisar("acesso-enviado", `${alvo} · olhe também o spam`, `acesso-enviado:${alvo}`);
      setPasso("senha");
    } else {
      setErro(r.erro ?? "Não consegui enviar. Tente de novo.");
      avisar("acesso-falhou", r.erro ?? null);
    }
  }

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !senha.trim() || ocupado) return;
    setOcupado(true);
    setErro(null);
    const r = await entrarComSenha(email.trim(), senha.trim());
    setOcupado(false);
    if (!r.ok) {
      setErro("Senha errada ou vencida. Confira o e-mail mais recente.");
      avisar("senha-errada", "Confira o e-mail mais recente");
    }
  }

  const caixaErro = erro && (
    <div role="alert" style={errorBox}>
      <AlertCircle size={15} aria-hidden="true" />
      {erro}
    </div>
  );

  const campoEmail = (
    <>
      <label htmlFor="login-email" style={rotulo}>E-mail</label>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Mail size={17} color={T.gray600} aria-hidden="true" style={iconeCampo} />
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          autoFocus={passo === "email"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          disabled={ocupado}
          style={{ ...inputBase, background: ocupado ? T.gray100 : T.white }}
        />
      </div>
    </>
  );

  if (passo === "email") {
    const desligado = !email.trim() || ocupado;
    return (
      <form onSubmit={pedir} noValidate>
        <Cabecalho titulo="Acessar minha conta" sub="Mandamos um link e uma senha temporária para o seu e-mail." />
        {campoEmail}
        {caixaErro}
        <button type="submit" disabled={desligado} style={botaoPrincipal(desligado)}>
          {ocupado ? <><Girando /> Enviando…</> : <>Enviar acesso <ArrowRight size={17} strokeWidth={2.5} aria-hidden="true" /></>}
        </button>
        <button type="button" style={linkTexto} onClick={() => { setErro(null); setPasso("senha"); }}>
          Já tenho a senha temporária
        </button>
      </form>
    );
  }

  const desligado = !email.trim() || !senha.trim() || ocupado;
  return (
    <form onSubmit={entrar} noValidate>
      <Cabecalho
        titulo="Entrar com a senha do e-mail"
        sub={<>Clique no link do e-mail <strong>ou</strong> digite a senha temporária aqui.</>}
      />
      {campoEmail}
      <label htmlFor="login-senha" style={rotulo}>Senha temporária</label>
      <div style={{ position: "relative", marginBottom: 6 }}>
        <KeyRound size={17} color={T.gray600} aria-hidden="true" style={iconeCampo} />
        <input
          id="login-senha"
          type="text"
          autoComplete="one-time-code"
          autoFocus
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Números do e-mail"
          disabled={ocupado}
          style={{ ...inputBase, letterSpacing: senha ? ".12em" : "normal", fontWeight: senha ? 800 : 500, background: ocupado ? T.gray100 : T.white }}
        />
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: T.gray600 }}>Já criou a sua senha? Pode digitar ela aqui.</p>
      {caixaErro}
      <button type="submit" disabled={desligado} style={botaoPrincipal(desligado)}>
        {ocupado ? <><Girando /> Entrando…</> : <>Entrar <ArrowRight size={17} strokeWidth={2.5} aria-hidden="true" /></>}
      </button>
      <button type="button" style={linkTexto} disabled={ocupado} onClick={() => pedir()}>
        Reenviar e-mail
      </button>
    </form>
  );
}

// ─── Primeiro acesso: troca a senha temporária pela da pessoa (C) ───────────
export function CriarSenha({ onPronto }: { onPronto: () => void }) {
  const [senha, setSenha] = useState("");
  const [repete, setRepete] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (ocupado) return;
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    if (senha !== repete) return setErro("As duas senhas não estão iguais.");
    setOcupado(true);
    setErro(null);
    const r = await criarSenha(senha);
    setOcupado(false);
    if (!r.ok) return setErro(r.erro ?? "Não consegui salvar. Tente de novo.");
    avisar("senha-criada", "Pronto, a temporária não vale mais");
    onPronto();
  }

  const desligado = !senha || !repete || ocupado;
  return (
    <Moldura>
      <form onSubmit={salvar} noValidate>
        <Cabecalho titulo="Crie sua senha" sub="A senha temporária só vale uma vez. Escolha a sua." />
        <label htmlFor="nova-senha" style={rotulo}>Nova senha</label>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <KeyRound size={17} color={T.gray600} aria-hidden="true" style={iconeCampo} />
          <input id="nova-senha" type="password" autoComplete="new-password" autoFocus value={senha}
            onChange={(e) => setSenha(e.target.value)} disabled={ocupado} style={inputBase} />
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 12, color: T.gray600 }}>Mínimo 8 caracteres.</p>
        <label htmlFor="repete-senha" style={rotulo}>Repita a senha</label>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <KeyRound size={17} color={T.gray600} aria-hidden="true" style={iconeCampo} />
          <input id="repete-senha" type="password" autoComplete="new-password" value={repete}
            onChange={(e) => setRepete(e.target.value)} disabled={ocupado} style={inputBase} />
        </div>
        {erro && (
          <div role="alert" style={errorBox}>
            <AlertCircle size={15} aria-hidden="true" />
            {erro}
          </div>
        )}
        <button type="submit" disabled={desligado} style={botaoPrincipal(desligado)}>
          {ocupado ? <><Girando /> Salvando…</> : <>Salvar e entrar <ArrowRight size={17} strokeWidth={2.5} aria-hidden="true" /></>}
        </button>
      </form>
    </Moldura>
  );
}

/** Fundo e cartão da tela de entrada, com o logo. */
function Moldura({ children, rodape }: { children: React.ReactNode; rodape?: React.ReactNode }) {
  return (
    <div
      style={{
        background: T.gray050, minHeight: "100vh", fontFamily: "'Nunito', sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 400, background: T.white, borderRadius: 20, padding: "32px 28px",
          boxShadow: "0 8px 40px rgba(0,122,140,0.13), 0 2px 8px rgba(0,0,0,0.06)",
          border: `1px solid ${T.gray200}`, boxSizing: "border-box",
        }}
      >
        <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 26, color: T.teal700, letterSpacing: "-0.5px", lineHeight: 1 }}>
          Revivaz
        </p>
        {children}
      </div>
      <p style={{ marginTop: 24, fontWeight: 500, fontSize: 13, color: T.gray600, textAlign: "center", lineHeight: 1.5 }}>
        Saúde mental acessível para todos.
      </p>
      {rodape}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
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
              Mandamos um link e uma senha temporária para o seu e-mail.
            </p>
          </div>
        </div>
        {/* Consent modal on top */}
        <ConsentimentoLGPD onAceitar={() => setConsentido(true)} />
      </>
    );
  }

  return (
    <Moldura rodape={import.meta.env.DEV && <DevLoginBand />}>
      <AcessoEmail />
    </Moldura>
  );
}
