/**
 * Aviso de cookies (LGPD): Aceitar, Recusar ou Configurar.
 *
 * Hoje o site só usa o essencial (login, segurança do Cloudflare e esta
 * própria escolha). "Estatística" existe para quando houver contagem de
 * visitas: quem quiser ligar algo de medição deve checar `estatisticaPermitida()`
 * antes. Qualquer link para "#cookies" reabre a janela.
 */
import React, { useEffect, useState } from "react";

const CHAVE = "revivaz-cookies";

type Escolha = { estatistica: boolean; em: string };

function lerEscolha(): Escolha | null {
  try {
    const v = localStorage.getItem(CHAVE);
    return v ? (JSON.parse(v) as Escolha) : null;
  } catch {
    return null;
  }
}

export function estatisticaPermitida(): boolean {
  return lerEscolha()?.estatistica === true;
}

/** Reabre a janela de configuração (botão da Política de Privacidade). */
export function abrirConfigCookies(): void {
  window.dispatchEvent(new Event("revivaz:cookies"));
}

const b: React.CSSProperties = {
  flex: 1, minHeight: 44, borderRadius: 10, fontWeight: 800, fontSize: 13,
  cursor: "pointer", fontFamily: "inherit",
};
const bPrim: React.CSSProperties = { ...b, background: "linear-gradient(90deg,#00BFD8,#00A8BF)", color: "#001820", border: 0 };
const bSec: React.CSSProperties = { ...b, background: "transparent", color: "#D6F4F8", border: "1.5px solid rgba(214,244,248,.4)" };

function Chave({ ligada, travada, onClick, rotulo }: { ligada: boolean; travada?: boolean; onClick?: () => void; rotulo: string }): JSX.Element {
  return (
    <button
      type="button" role="switch" aria-checked={ligada} aria-label={rotulo} disabled={travada} onClick={onClick}
      style={{ width: 42, height: 24, borderRadius: 12, border: 0, flex: "none", position: "relative", padding: 0,
        background: ligada ? "#00BFD8" : "#33465e", opacity: travada ? 0.6 : 1, cursor: travada ? "default" : "pointer" }}
    >
      <span style={{ position: "absolute", top: 3, left: ligada ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
    </button>
  );
}

function Item({ titulo, texto, children }: { titulo: string; texto: string; children: React.ReactNode }): JSX.Element {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderTop: "1px solid rgba(255,255,255,.08)" }}>
      <div style={{ flex: 1 }}>
        <strong style={{ fontSize: 13 }}>{titulo}</strong>
        <span style={{ display: "block", fontSize: 12, color: "rgba(214,244,248,.7)", lineHeight: 1.5 }}>{texto}</span>
      </div>
      {children}
    </div>
  );
}

export function AvisoCookies(): JSX.Element | null {
  const [aberto, setAberto] = useState(() => lerEscolha() === null);
  const [config, setConfig] = useState(false);
  const [estatistica, setEstatistica] = useState(() => estatisticaPermitida());

  useEffect(() => {
    const abrir = () => { setEstatistica(estatisticaPermitida()); setConfig(true); setAberto(true); };
    const clique = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href="#cookies"]');
      if (a) { e.preventDefault(); abrir(); }
    };
    window.addEventListener("revivaz:cookies", abrir);
    document.addEventListener("click", clique);
    return () => { window.removeEventListener("revivaz:cookies", abrir); document.removeEventListener("click", clique); };
  }, []);

  const salvar = (est: boolean) => {
    try { localStorage.setItem(CHAVE, JSON.stringify({ estatistica: est, em: new Date().toISOString() })); } catch { /* sem storage: só fecha */ }
    setAberto(false);
    setConfig(false);
  };

  if (!aberto) return null;

  return (
    <div
      role="dialog" aria-label="Escolha de cookies"
      style={{ position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 9999, maxWidth: 420, marginLeft: "auto",
        background: "#0f2238", color: "#fff", border: "1px solid rgba(0,191,216,.35)", borderRadius: 16, padding: 16,
        boxShadow: "0 10px 40px rgba(0,0,0,.35)", fontFamily: "'Nunito', system-ui, sans-serif" }}
    >
      {!config ? (
        <>
          <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800 }}>Seus dados, sua escolha</h3>
          <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.55, color: "rgba(214,244,248,.85)" }}>
            Usamos só o necessário para o site funcionar e manter você logado. Sem rastreamento e sem
            propaganda. <a href="/privacidade#cookies-info" style={{ color: "#00BFD8" }}>Saiba mais</a>
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={bSec} onClick={() => salvar(false)}>Recusar</button>
            <button type="button" style={bPrim} onClick={() => salvar(true)}>Aceitar</button>
            <button type="button" onClick={() => setConfig(true)}
              style={{ ...b, flexBasis: "100%", background: "transparent", color: "#00BFD8", border: 0, textDecoration: "underline" }}>
              Configurar
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800 }}>Configurar cookies</h3>
          <Item titulo="Essenciais" texto="Login, segurança e lembrar esta escolha. Sempre ligado.">
            <Chave ligada travada rotulo="Essenciais, sempre ligado" />
          </Item>
          <Item titulo="Estatística" texto="Contar visitas de forma anônima. Hoje não usamos.">
            <Chave ligada={estatistica} onClick={() => setEstatistica(v => !v)} rotulo="Estatística" />
          </Item>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="button" style={bSec} onClick={() => (lerEscolha() ? setAberto(false) : setConfig(false))}>Voltar</button>
            <button type="button" style={bPrim} onClick={() => salvar(estatistica)}>Salvar escolha</button>
          </div>
        </>
      )}
    </div>
  );
}
