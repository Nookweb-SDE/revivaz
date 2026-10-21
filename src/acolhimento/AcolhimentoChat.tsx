/**
 * Porta de entrada da Revivaz: conversa, triagem e os dois caminhos reais.
 *
 * Substituiu o WhatsApp, que saiu do produto. Aqui a pessoa:
 *   1. conversa e é acolhida (a IA tria a gravidade e adapta o tom);
 *   2. pede uma consulta (vira lead, a equipe retorna);
 *   3. entra na conta, ou cria uma, por link no e-mail.
 *
 * Duas travas que não dependem da IA:
 * - A detecção de crise roda no servidor ANTES de qualquer chamada ao modelo,
 *   então crise responde 188/192/136/CAPS mesmo com a cota do dia estourada.
 * - A barra de crise fica fixa na tela o tempo todo.
 *
 * Sobre "ver se a pessoa tem cadastro": NÃO existe consulta de existência de
 * e-mail. Isso seria enumeração de conta (qualquer um descobriria quem faz
 * tratamento aqui). O link de acesso serve para os dois casos e a resposta é a
 * mesma, tenha a conta ou não.
 */
import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { CRISIS_RESOURCES } from "./crisis";
import { ESPECIALIDADES, GRUPOS, type GrupoEspecialidade } from "../lib/especialidades";
import { CADASTRO_ABERTO } from "../cadastroAberto";

const T = {
  teal900: "#003D4A", teal700: "#007A8C", teal500: "#00A8BF", teal300: "#5FD3E3",
  teal100: "#C6EEF4", teal050: "#EFFAFC",
  gray950: "#0F1720", gray600: "#5A6672", gray200: "#E2E8EC", gray100: "#EFF3F5",
  gray050: "#F7FAFB", white: "#FFFFFF", verde: "#0E9F6E", vermelho: "#B42318",
};
const FONTE = "'Nunito', system-ui, sans-serif";

const URL_SB = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase = URL_SB && ANON ? createClient(URL_SB, ANON, { db: { schema: "revivaz" } }) : null;

type Papel = "user" | "assistant";
interface Msg {
  papel: Papel;
  texto: string;
}

const ABERTURA =
  "Oi. Este é um espaço de acolhimento. Pode escrever do seu jeito, sem pressa: o que está pesando hoje?";

/* ── Barra de crise: fixa, nunca depende da IA ─────────────────────────────── */
function BarraCrise(): JSX.Element {
  return (
    <div
      role="note"
      style={{
        position: "sticky", top: 0, zIndex: 5,
        background: T.teal900, color: T.white,
        padding: "10px 16px", fontSize: 13, fontFamily: FONTE, fontWeight: 700,
        display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center",
      }}
    >
      <span>Em crise agora?</span>
      <a href="tel:188" style={{ color: T.teal300, textDecoration: "none" }}>CVV 188</a>
      <a href="tel:192" style={{ color: T.teal300, textDecoration: "none" }}>SAMU 192</a>
      <a href="tel:136" style={{ color: T.teal300, textDecoration: "none" }}>Disque Saúde 136</a>
    </div>
  );
}

/* ── Recursos de crise em destaque, quando o detector dispara ──────────────── */
function CardCrise(): JSX.Element {
  return (
    <div
      role="alert"
      style={{
        border: `2px solid ${T.vermelho}`, background: "#FEF3F2", borderRadius: 14,
        padding: 16, fontFamily: FONTE, margin: "8px 0",
      }}
    >
      <p style={{ margin: "0 0 10px", fontWeight: 800, color: T.vermelho, fontSize: 15 }}>
        Você não precisa passar por isso sozinho agora.
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 14, color: T.gray950, lineHeight: 1.55 }}>
        Fale agora com alguém preparado para te ouvir. É gratuito, 24 horas, e sigiloso.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CRISIS_RESOURCES.map((r) => (
          <a
            key={r.contato}
            href={`tel:${r.contato}`}
            style={{
              display: "block", padding: "10px 12px", borderRadius: 10,
              background: T.white, border: `1px solid ${T.gray200}`,
              textDecoration: "none", color: T.gray950,
            }}
          >
            <strong style={{ fontSize: 14 }}>{r.nome} · {r.contato}</strong>
            <span style={{ display: "block", fontSize: 12, color: T.gray600, marginTop: 2 }}>
              {r.descricao}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ── Caminho 1: pedir consulta (vira lead) ─────────────────────────────────── */
function PedirConsulta({ onPronto }: { onPronto: () => void }): JSX.Element {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [esp, setEsp] = useState("psicologia");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);

  async function enviar() {
    setErro("");
    setEnviando(true);
    try {
      const r = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, especialidade: esp, origem: "landing" }),
      });
      if (!r.ok) {
        let msg = "Não consegui registrar agora. Tente de novo.";
        try {
          const b = await r.json();
          if (b?.error) msg = b.error;
        } catch {
          /* resposta sem JSON */
        }
        setErro(msg);
        return;
      }
      setOk(true);
      onPronto();
    } catch {
      setErro("Sem conexão. Confira a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (ok) {
    return (
      <div role="status" style={{ ...caixaAcao, borderColor: T.verde, background: "#F0FDF7" }}>
        <strong style={{ color: "#065F46", fontSize: 14 }}>Pedido recebido.</strong>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: T.gray600, lineHeight: 1.5 }}>
          Nossa equipe entra em contato para combinar dia e horário. Enquanto isso, pode continuar
          conversando aqui.
        </p>
      </div>
    );
  }

  return (
    <div style={caixaAcao}>
      <strong style={{ fontSize: 14, color: T.gray950 }}>Pedir consulta</strong>
      <p style={{ margin: "4px 0 12px", fontSize: 12, color: T.gray600 }}>
        A equipe entra em contato para combinar dia e horário.
      </p>
      <label style={rotulo} htmlFor="ac-nome">Nome</label>
      <input id="ac-nome" value={nome} onChange={(e) => setNome(e.target.value)} style={campo} placeholder="Como te chamamos" />
      <label style={rotulo} htmlFor="ac-tel">Telefone com DDD</label>
      <input id="ac-tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} style={campo} placeholder="(11) 99999-9999" inputMode="tel" />
      <label style={rotulo} htmlFor="ac-esp">Especialidade</label>
      <select id="ac-esp" value={esp} onChange={(e) => setEsp(e.target.value)} style={campo}>
        {(Object.keys(GRUPOS) as GrupoEspecialidade[]).map((g) => (
          <optgroup key={g} label={GRUPOS[g]}>
            {ESPECIALIDADES.filter((e) => e.grupo === g).map((e) => (
              <option key={e.valor} value={e.valor}>{e.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
      {erro && <p role="alert" style={aviso}>{erro}</p>}
      <button onClick={enviar} disabled={enviando} style={{ ...botaoPrimario, opacity: enviando ? 0.7 : 1 }}>
        {enviando ? "Enviando…" : "Enviar pedido"}
      </button>
    </div>
  );
}

/* ── Caminho 2: entrar na conta (ou criar) ─────────────────────────────────── */
function EntrarNaConta(): JSX.Element {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);

  async function enviar() {
    setErro("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setErro("Confira o e-mail.");
      return;
    }
    if (!supabase) {
      setErro("Acesso indisponível agora. Tente pela página de entrada.");
      return;
    }
    setEnviando(true);
    try {
      // shouldCreateUser padrão (true): o mesmo link serve para quem já tem
      // conta e para quem ainda não tem. Por isso a resposta na tela é a mesma
      // nos dois casos — dizer "esse e-mail não tem cadastro" entregaria quem
      // faz tratamento aqui para qualquer um que quisesse testar e-mails.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/conta` },
      });
      if (error) {
        setErro("Não consegui enviar agora. Tente de novo em instantes.");
        return;
      }
      setEnviado(true);
    } catch {
      setErro("Sem conexão. Confira a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div role="status" style={{ ...caixaAcao, borderColor: T.verde, background: "#F0FDF7" }}>
        <strong style={{ color: "#065F46", fontSize: 14 }}>Link enviado.</strong>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: T.gray600, lineHeight: 1.5 }}>
          Abra o e-mail que mandamos para <strong>{email}</strong> e clique no link. Se você já tinha
          conta, ele entra direto; se não tinha, cria a sua.
        </p>
      </div>
    );
  }

  return (
    <div style={caixaAcao}>
      <strong style={{ fontSize: 14, color: T.gray950 }}>Entrar na minha conta</strong>
      <p style={{ margin: "4px 0 12px", fontSize: 12, color: T.gray600 }}>
        Mandamos um link de acesso no seu e-mail. Serve tanto para quem já tem conta quanto para
        quem está começando agora.
      </p>
      <label style={rotulo} htmlFor="ac-email">E-mail</label>
      <input
        id="ac-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        style={campo} placeholder="seu@email.com" inputMode="email"
      />
      {erro && <p role="alert" style={aviso}>{erro}</p>}
      <button onClick={enviar} disabled={enviando} style={{ ...botaoPrimario, opacity: enviando ? 0.7 : 1 }}>
        {enviando ? "Enviando…" : "Receber link de acesso"}
      </button>
    </div>
  );
}

/* ── Estilos compartilhados ────────────────────────────────────────────────── */
const caixaAcao: React.CSSProperties = {
  border: `1px solid ${T.gray200}`, borderRadius: 14, padding: 16,
  background: T.white, fontFamily: FONTE, margin: "8px 0",
};
const rotulo: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700, color: T.gray600, marginBottom: 4,
};
const campo: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${T.gray200}`,
  fontSize: 14, fontFamily: FONTE, marginBottom: 10, minHeight: 44, background: T.white,
  color: T.gray950, boxSizing: "border-box",
};
const botaoPrimario: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 12, border: "none",
  background: `linear-gradient(135deg, ${T.teal700}, ${T.teal500})`, color: T.white,
  fontFamily: FONTE, fontWeight: 800, fontSize: 14, cursor: "pointer", minHeight: 48,
};
/** Enquanto a resposta não chega: pontinhos e, se demorar, um aviso calmo
 *  para a pessoa não achar que travou. */
function Pensando(): JSX.Element {
  const [demorou, setDemorou] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setDemorou(true), 5000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div role="status" style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 10, color: T.gray600, fontSize: 13, padding: "6px 4px" }}>
      <style>{`@keyframes ac-ponto{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
@media (prefers-reduced-motion: reduce){.ac-ponto{animation:none!important}}`}</style>
      <span aria-hidden="true" style={{ display: "inline-flex", gap: 4, background: T.gray050, borderRadius: 14, padding: "10px 12px" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="ac-ponto" style={{ width: 7, height: 7, borderRadius: "50%", background: T.teal700, animation: `ac-ponto 1.2s ${i * 0.16}s infinite ease-in-out` }} />
        ))}
      </span>
      <span>{demorou ? "Pensando com cuidado na sua resposta…" : "escrevendo…"}</span>
    </div>
  );
}

const aviso: React.CSSProperties = {
  margin: "0 0 10px", padding: "8px 10px", borderRadius: 8, background: "#FEE2E2",
  color: "#991B1B", fontSize: 12, fontWeight: 700, fontFamily: FONTE,
};

/* ── Componente principal ──────────────────────────────────────────────────── */
export default function AcolhimentoChat(): JSX.Element {
  const [aceitou, setAceitou] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ papel: "assistant", texto: ABERTURA }]);
  const [entrada, setEntrada] = useState("");
  const [pensando, setPensando] = useState(false);
  const [crise, setCrise] = useState(false);
  const [painel, setPainel] = useState<null | "consulta" | "conta">(null);
  const [erro, setErro] = useState("");
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, pensando, painel]);

  async function enviar() {
    const texto = entrada.trim();
    if (!texto || pensando) return;
    setErro("");
    setEntrada("");
    const historico = [...msgs, { papel: "user" as Papel, texto }];
    setMsgs(historico);
    setPensando(true);
    try {
      const resp = await fetch("/api/acolhimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historico.map((m) => ({ role: m.papel, content: m.texto })),
        }),
      });
      const dados = await resp.json().catch(() => null);

      if (dados?.crisis) {
        setCrise(true);
        setPensando(false);
        return;
      }
      if (!resp.ok) {
        setErro(dados?.error || "Não consegui responder agora. Tente de novo em instantes.");
        setPensando(false);
        return;
      }
      // A ponte não faz streaming; revelamos palavra a palavra para a conversa
      // não chegar como um bloco seco, mas em no máximo ~0,8 s: a pessoa já
      // esperou a resposta inteira, não pode esperar de novo para ler.
      const completo = String(dados?.reply ?? "").trim();
      setMsgs((m) => [...m, { papel: "assistant", texto: "" }]);
      const palavras = completo.split(" ");
      const passo = Math.min(16, 800 / palavras.length);
      for (let i = 0; i < palavras.length; i++) {
        await new Promise((r) => setTimeout(r, passo));
        const parcial = palavras.slice(0, i + 1).join(" ");
        setMsgs((m) => {
          const copia = [...m];
          copia[copia.length - 1] = { papel: "assistant", texto: parcial };
          return copia;
        });
      }
    } catch {
      setErro("Sem conexão. Confira a internet e tente de novo.");
    } finally {
      setPensando(false);
    }
  }

  if (!aceitou) {
    return (
      <div style={{ minHeight: "100dvh", background: T.gray050, fontFamily: FONTE }}>
        <BarraCrise />
        <div style={{ maxWidth: 560, margin: "0 auto", padding: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.gray950, margin: "12px 0 8px" }}>
            Antes de começar
          </h1>
          <div style={{ ...caixaAcao }}>
            <p style={{ margin: "0 0 10px", fontSize: 14, color: T.gray950, lineHeight: 1.6 }}>
              Este é um espaço de <strong>acolhimento</strong>. Converso com você, ajudo a se acalmar
              e te mostro o caminho para falar com um profissional.
            </p>
            <p style={{ margin: "0 0 10px", fontSize: 14, color: T.gray950, lineHeight: 1.6 }}>
              <strong>Não sou profissional de saúde.</strong> Não dou diagnóstico, não indico
              remédio e não substituo consulta.
            </p>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: T.gray600, lineHeight: 1.6 }}>
              O que você escrever aqui é processado por um serviço de inteligência artificial para
              gerar a resposta. Não guardamos esta conversa. Detalhes na{" "}
              <a href="/privacidade" style={{ color: T.teal700 }}>Política de Privacidade</a>.
            </p>
            <button onClick={() => setAceitou(true)} style={botaoPrimario}>
              Entendi, quero conversar
            </button>
          </div>
          {CADASTRO_ABERTO && <p style={{ fontSize: 13, color: T.gray600, textAlign: "center" }}>
            Prefere ir direto ao ponto?{" "}
            <a href="/#agendar" style={{ color: T.teal700, fontWeight: 700 }}>Peça uma consulta</a>.
          </p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: T.gray050, fontFamily: FONTE, display: "flex", flexDirection: "column" }}>
      <BarraCrise />

      <header style={{ padding: "12px 16px", borderBottom: `1px solid ${T.gray200}`, background: T.white, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <a href="/" style={{ fontWeight: 900, fontSize: 18, color: T.teal700, textDecoration: "none" }}>Revivaz</a>
        {CADASTRO_ABERTO && <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setPainel(painel === "consulta" ? null : "consulta")}
            aria-pressed={painel === "consulta"}
            style={botaoSecundario(painel === "consulta")}
          >
            Pedir consulta
          </button>
          <button
            onClick={() => setPainel(painel === "conta" ? null : "conta")}
            aria-pressed={painel === "conta"}
            style={botaoSecundario(painel === "conta")}
          >
            Entrar na minha conta
          </button>
        </div>}
      </header>

      <main style={{ flex: 1, width: "100%", maxWidth: 640, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div role="log" aria-live="polite" aria-label="Conversa de acolhimento" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.papel === "user" ? "flex-end" : "flex-start",
                maxWidth: "88%",
                background: m.papel === "user" ? T.teal700 : T.white,
                color: m.papel === "user" ? T.white : T.gray950,
                border: m.papel === "user" ? "none" : `1px solid ${T.gray200}`,
                borderRadius: 16,
                padding: "10px 14px",
                fontSize: 15,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.texto}
            </div>
          ))}
          {pensando && <Pensando />}
        </div>

        {crise && <CardCrise />}
        {painel === "consulta" && <PedirConsulta onPronto={() => undefined} />}
        {painel === "conta" && <EntrarNaConta />}
        {erro && <p role="alert" style={aviso}>{erro}</p>}
        <div ref={fim} />
      </main>

      <div style={{ position: "sticky", bottom: 0, background: T.white, borderTop: `1px solid ${T.gray200}`, padding: 12 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", gap: 8 }}>
          <input
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && enviar()}
            placeholder="Escreva o que está sentindo…"
            aria-label="Sua mensagem"
            style={{ ...campo, marginBottom: 0 }}
          />
          <button onClick={enviar} disabled={pensando || !entrada.trim()} style={{ ...botaoPrimario, width: "auto", padding: "0 20px", opacity: pensando || !entrada.trim() ? 0.6 : 1 }}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

function botaoSecundario(ativo: boolean): React.CSSProperties {
  return {
    padding: "8px 14px",
    borderRadius: 9999,
    border: `1.5px solid ${ativo ? T.teal700 : T.gray200}`,
    background: ativo ? T.teal050 : T.white,
    color: ativo ? T.teal700 : T.gray600,
    fontFamily: FONTE,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    minHeight: 40,
  };
}
