/* ═══════════════════════════════════════════════════════════════════
   REVIVAZ — Clone EXATO dos blocos conexasaude.com.br (header→footer)
   Paleta teal/navy · Imagens reais · lucide-react icons · Modais funcionais
   ══════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef } from "react";
import EcgValor from "./sections/EcgValor";
import HeroScrubFrames from "./sections/HeroScrubFrames";
import { ESPECIALIDADES, GRUPOS, type GrupoEspecialidade } from "./lib/especialidades";
import {
  Heart, ArrowRight, ClipboardList,
  Clock, MessageCircle, Smartphone, Video, Monitor, Sparkles, Brain,
  Stethoscope, FileText, Users, MapPin, Calendar, User, Phone, Mail,
  Send, X, CheckCircle, Menu,
} from "lucide-react";

/* ── breakpoints: mobile < 640, tablet 640–1023, desktop ≥ 1024 ── */
function useBreakpoint() {
  const [bp, setBp] = useState<"mobile" | "tablet" | "desktop">(() => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    return w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop";
  });
  useEffect(() => {
    const mq = (min: number) => window.matchMedia(`(min-width: ${min}px)`);
    const update = () => {
      if (mq(1024).matches) setBp("desktop");
      else if (mq(640).matches) setBp("tablet");
      else setBp("mobile");
    };
    update();
    mq(1024).addEventListener("change", update);
    mq(640).addEventListener("change", update);
    return () => {
      mq(1024).removeEventListener("change", update);
      mq(640).removeEventListener("change", update);
    };
  }, []);
  return bp;
}

/* ── design tokens (UX: 8px grid, type scale legível) ── */
const T = {
  teal900: "#004D5C", teal700: "#007A8C", teal500: "#00A8BF",
  teal300: "#00BFD8", teal100: "#D6F4F8", teal050: "#EDF9FB",
  green700: "#2E7D32", green500: "#4CAF50",
  navy: "#0B1D3A", navy800: "#112240",
  gray950: "#0D1117", gray800: "#1F2937", gray700: "#374151", gray600: "#4B5563",
  gray200: "#E5E7EB", gray100: "#F3F4F6", gray050: "#F9FAFB", gray500: "#6B7280", white: "#FFFFFF",
};
const S = { s: 8, m: 16, l: 24, xl: 32, xxl: 48 } as const;
const F = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 28 } as const;

/* ── tokens responsivos (mobile / tablet / desktop) ── */
const S_r = (bp: "mobile" | "tablet" | "desktop") => bp === "mobile" ? { s: 6, m: 12, l: 18, xl: 24, xxl: 36 } : bp === "tablet" ? { s: 8, m: 14, l: 20, xl: 28, xxl: 40 } : S;
const F_r = (bp: "mobile" | "tablet" | "desktop") => bp === "mobile" ? { xs: 11, sm: 13, base: 15, lg: 16, xl: 18, "2xl": 20, "3xl": 24 } : bp === "tablet" ? { xs: 12, sm: 13, base: 15, lg: 17, xl: 19, "2xl": 22, "3xl": 26 } : F;
const containerMax = (bp: "mobile" | "tablet" | "desktop") => bp === "mobile" ? 9999 : bp === "tablet" ? 720 : 1120;
const containerPad = (bp: "mobile" | "tablet" | "desktop") => bp === "mobile" ? 12 : bp === "tablet" ? 20 : 16;

const pill = (active: boolean) => ({
  padding: "10px 20px", fontSize: F.xs, fontWeight: 700 as const,
  border: "none", borderRadius: 9999, cursor: "pointer" as const,
  fontFamily: "inherit", transition: "all .2s",
  background: active ? T.teal700 : T.gray050,
  color: active ? T.white : T.gray600,
  boxShadow: active ? "0 2px 12px rgba(0,77,92,.3)" : "none",
});

const inputBase = {
  width: "100%", padding: "12px 12px 12px 40px", fontSize: F.sm,
  border: `1px solid ${T.gray200}`, borderRadius: 12,
  boxSizing: "border-box" as const, fontFamily: "inherit", outline: "none",
};

export default function RevivazPreview() {
  const bp = useBreakpoint();
  const Sp = S_r(bp);
  const Fp = F_r(bp);
  const container = { maxWidth: containerMax(bp), margin: "0 auto" as const, paddingLeft: containerPad(bp), paddingRight: containerPad(bp) };
  const sectionPad = { padding: `${Sp.xl}px ${Sp.m}px` };
  const btnPrimary = { padding: "13px 24px", fontSize: F.xs, fontWeight: 700 as const, color: T.white, background: `linear-gradient(135deg, ${T.teal500}, ${T.teal700})`, border: "none", borderRadius: 12, cursor: "pointer" as const, fontFamily: "inherit", minHeight: 46, boxShadow: "0 8px 22px rgba(0,168,191,.3)" };
  const btnGlass = { padding: "13px 24px", fontSize: F.xs, fontWeight: 700 as const, color: T.white, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.24)", borderRadius: 12, cursor: "pointer" as const, fontFamily: "inherit", minHeight: 46, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" };

  /* state */
  const [tab, setTab] = useState(0);
  const [heroIdx, setHeroIdx] = useState(0);
  const [modalAgendar, setModalAgendar] = useState(false);
  const [agendarOk, setAgendarOk] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({
    tipo: "online" as "presencial" | "online",
    esp: "psicologia",
    data: "", hora: "", nome: "", tel: "", email: "",
  });
  const [enviandoAgendar, setEnviandoAgendar] = useState(false);
  const [erroAgendar, setErroAgendar] = useState("");
  /* O mesmo modal serve os dois funis do modelo de negócio: quem quer consulta
     e quem quer ATENDER (embaixador/voluntário). A origem separa os dois no
     painel do admin. */
  const [modoLead, setModoLead] = useState<"paciente" | "profissional">("paciente");

  function abrirCadastroProfissional() {
    setModoLead("profissional");
    setAgendarOk(false);
    setErroAgendar("");
    setModalAgendar(true);
  }

  /* Envia o pedido de verdade para /api/lead. Este formulário já foi decorativo
     (o botão só marcava sucesso na tela); agora só mostra sucesso se o servidor
     confirmar que gravou. */
  async function enviarPedidoAgendamento() {
    setErroAgendar("");
    setEnviandoAgendar(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          telefone: form.tel,
          email: form.email,
          especialidade: form.esp,
          data: modoLead === "profissional" ? "" : form.data,
          hora: modoLead === "profissional" ? "" : form.hora,
          origem: modoLead === "profissional" ? "profissional" : "landing",
        }),
      });
      if (!res.ok) {
        let msg = "Não consegui registrar agora. Tente de novo.";
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {
          /* resposta sem JSON — mantém a mensagem padrão */
        }
        setErroAgendar(msg);
        return;
      }
      setAgendarOk(true);
    } catch {
      setErroAgendar("Sem conexão. Confira a internet e tente de novo.");
    } finally {
      setEnviandoAgendar(false);
    }
  }

  /* Navegação da home. Cada item aponta para uma seção que existe de verdade
     nesta página — antes eram botões sem ação nenhuma. */
  const NAV = [
    ["Sobre", "#sobre"],
    ["Para pacientes", "#para-pacientes"],
    ["Especialidades", "#especialidades"],
    ["Para profissionais", "#para-profissionais"],
  ] as const;

  /* hero carousel */
  const heroLines = ["suas consultas", "seus cuidados", "sua vida"];
  useEffect(() => {
    const id = setInterval(() => setHeroIdx(p => (p + 1) % heroLines.length), 2500);
    return () => clearInterval(id);
  }, []);

  /* data */
  /* Substitui os depoimentos falsos: cada item aqui é verificável dentro do
     próprio produto, não é alegação de marketing. */
  const CUIDADO = [
    { icon: ClipboardList, title: "Triagem com instrumento validado", desc: "PHQ-9 e GAD-7, os mesmos questionários usados em serviço de saúde. Você responde em minutos e o profissional já recebe o resultado." },
    { icon: Stethoscope, title: "Profissional com registro", desc: "Psiquiatras, psicólogos e a equipe multidisciplinar atendem com CRM, CRP ou o conselho da área, conferido no cadastro." },
    { icon: FileText, title: "Sigilo por lei, não por promessa", desc: "Dado de saúde mental é sensível. Só você, seu profissional e a administração enxergam sua ficha, e a consulta por vídeo não é gravada." },
    { icon: Heart, title: "Crise não espera consulta", desc: "CVV 188 e SAMU 192 ficam na tela o tempo todo, e o acolhimento responde 24 horas enquanto sua consulta não chega." },
  ];

  const FEATURES = [
    { icon: Brain, title: "Psiquiatria", sub: "Acompanhamento especializado com profissionais voluntários qualificados.", img: "/revivaz/hero-alt.webp", imgPos: "center" },
    { icon: Calendar, title: "Agendamento fácil", sub: "Presencial ou online, sem burocracia. Agende em poucos cliques.", img: "/revivaz/hero-alt.webp", imgPos: "center" },
    { icon: FileText, title: "Receita digital", sub: "Baixe sua receita em PDF na sua conta, logo após a consulta.", img: "/revivaz/hero.webp", imgPos: "center" },
    { icon: Users, title: "Voluntários", sub: "Psicólogos e psiquiatras dedicados ao atendimento solidário.", img: "/revivaz/hero.webp", imgPos: "center" },
  ];

  const SOLUCOES = [
    { icon: Stethoscope, title: "Consulta presencial", desc: "No consultório, com horário agendado." },
    { icon: Video, title: "Teleatendimento", desc: "Vídeo chamada com seu profissional." },
    { icon: MessageCircle, title: "Receita digital", desc: "Em PDF na sua conta, logo após a consulta." },
    { icon: Heart, title: "Saúde mental", desc: "A maior rede solidária em saúde mental." },
  ];

  /* Substitui as notícias inventadas. Toda resposta aqui é conferível no
     produto: se alguma deixar de ser verdade, muda aqui junto. */
  const FAQ = [
    {
      p: "Quanto custa?",
      r: "Hoje o atendimento é gratuito. Ainda não existe cobrança na plataforma, e quando existir você vai saber o valor antes de marcar. A proposta do projeto é que quem pode pagar sustente quem não pode.",
    },
    {
      p: "Quem vai me atender?",
      r: "Profissionais com registro no conselho da área: psiquiatras e outros médicos pelo CRM, psicólogos pelo CRP, e a equipe multidisciplinar (terapia ocupacional, fonoaudiologia, psicopedagogia) pelos conselhos próprios. O registro é conferido no cadastro.",
    },
    {
      p: "É sigiloso mesmo?",
      r: "Dado de saúde mental é sensível e a separação de acesso está no banco, não só na tela: só você, o seu profissional e a administração enxergam sua ficha. A consulta por vídeo não é gravada. Está tudo escrito na Política de Privacidade.",
    },
    {
      p: "Atende criança e adolescente?",
      r: "Sim, em sete das especialidades, entre elas neuropediatria, psiquiatria infantil e terapia ocupacional. Enquanto o cadastro específico não fica pronto, a conta deve ser criada e usada pelo responsável legal.",
    },
    {
      p: "E se eu estiver em crise agora?",
      r: "Não espere consulta. Ligue 188 (CVV), que é gratuito e funciona 24 horas, ou 192 (SAMU) se houver risco imediato. Esta plataforma não é serviço de emergência, e esses números ficam visíveis em todas as telas de atendimento.",
    },
    {
      p: "Quanto tempo até eu ser atendido?",
      r: "Você pede pelo site e a equipe entra em contato para combinar dia e horário. Enquanto isso, o acolhimento por IA responde 24 horas, sem cadastro, para você não ficar sozinho na espera.",
    },
  ];

  const openAgendar = () => { setModoLead("paciente"); setModalAgendar(true); setAgendarOk(false); setErroAgendar(""); };

  /* Header integrado ao hero: enquanto o trilho do hero ainda cobre o topo da
     tela, o header flutua transparente sobre a cena; depois vira a barra branca
     de sempre. Sem isto o hero começa com uma caixa branca em cima da imagem. */
  const [sobreHero, setSobreHero] = useState(true);
  useEffect(() => {
    const alturaHeader = bp === "mobile" ? 56 : 64;
    const ver = () => {
      const tr = document.querySelector("[data-hero-track]");
      setSobreHero(!!tr && tr.getBoundingClientRect().bottom > alturaHeader);
    };
    ver();
    window.addEventListener("scroll", ver, { passive: true });
    window.addEventListener("resize", ver);
    return () => {
      window.removeEventListener("scroll", ver);
      window.removeEventListener("resize", ver);
    };
  }, [bp]);

  /* Uma paleta só para o header, trocada em bloco. Espalhar ternários por doze
     estilos era o caminho curto para esquecer um e deixar texto ilegível. */
  const H = sobreHero
    ? { logo: T.teal300, nav: "rgba(214,244,248,.92)", forte: T.white, borda: "rgba(0,191,216,.45)",
        campo: "rgba(255,255,255,.10)", campoTexto: "rgba(214,244,248,.75)", menu: "rgba(4,8,15,.96)" }
    : { logo: T.teal700, nav: T.gray700, forte: T.gray800, borda: T.teal700,
        campo: T.gray050, campoTexto: T.gray500, menu: T.white };


  /* ──────────────────── RENDER ──────────────────── */
  return (
    <div id="top" style={{ width: "100%", fontFamily: "'Nunito',system-ui,sans-serif", fontSize: F.sm, background: T.gray050, color: T.gray950, lineHeight: 1.5 }}>

      {/* ═══ BLOCO 2 — Header (layout profissional: esquerda nav, direita ações) ═══ */}
      <header style={{
        position: "fixed", top: 0, zIndex: 50, width: "100%",
        background: sobreHero ? "transparent" : T.white,
        borderBottom: sobreHero ? "1px solid rgba(0,191,216,.28)" : `1px solid ${T.gray200}`,
        boxShadow: sobreHero ? "none" : "0 1px 3px rgba(0,0,0,.04)",
        transition: "background .25s ease, border-color .25s ease, box-shadow .25s ease",
      }}>
        <div style={{ padding: bp === "mobile" ? `${Sp.m}px ${Sp.m}px` : `${Sp.m}px ${Sp.xl}px`, minHeight: bp === "mobile" ? 56 : 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: Sp.m, flexWrap: "wrap", ...container }}>
          {/* Esquerda: logo + navegação */}
          <div style={{ display: "flex", alignItems: "center", gap: bp === "mobile" ? Sp.s : Sp.xl, flex: bp === "mobile" ? "1 1 auto" : "0 0 auto", minWidth: 0 }}>
            <a href="#top" style={{ fontWeight: 900, fontSize: Fp.xl, color: H.logo, fontFamily: "'Nunito',sans-serif", letterSpacing: "-0.02em", textDecoration: "none", flexShrink: 0 }}>Revivaz</a>
            {bp !== "mobile" && (
              <nav style={{ display: "flex", alignItems: "center", gap: Sp.l }}>
                {NAV.map(([l, href]) => (
                  <a key={l} href={href} style={{ background: "none", border: "none", cursor: "pointer", fontSize: Fp.sm, fontWeight: 600, color: H.nav, fontFamily: "inherit", padding: "6px 0", whiteSpace: "nowrap", textDecoration: "none" }}>{l}</a>
                ))}
              </nav>
            )}
          </div>
          {/* Direita: busca + Entrar + Cadastre-se + CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: bp === "mobile" ? Sp.s : Sp.m, flexWrap: "wrap", flex: bp === "mobile" ? "0 0 auto" : "0 0 auto" }}>
            {bp !== "mobile" && (
              <>
                <a href="/conta" style={{ background: "none", border: "none", cursor: "pointer", fontSize: Fp.sm, fontWeight: 600, color: H.forte, fontFamily: "inherit", padding: "8px 0", whiteSpace: "nowrap", textDecoration: "none" }}>Entrar</a>
                <a href="/conta" style={{ background: "none", border: `2px solid ${H.borda}`, cursor: "pointer", fontSize: Fp.sm, fontWeight: 700, color: sobreHero ? T.teal300 : T.teal700, fontFamily: "inherit", padding: "8px 16px", borderRadius: 9999, whiteSpace: "nowrap", textDecoration: "none" }}>Cadastre-se</a>
              </>
            )}
            {bp === "mobile" && (
              <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }} aria-label="Menu">
                <Menu size={24} color={H.forte} />
              </button>
            )}
            <button onClick={openAgendar} style={{ padding: bp === "mobile" ? "10px 14px" : "10px 20px", fontWeight: 700, fontSize: Fp.sm, color: T.white, background: T.teal700, border: "none", borderRadius: 9999, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(0,77,92,.3)", minHeight: bp === "mobile" ? 40 : 44, flexShrink: 0, whiteSpace: "nowrap" }}>
              Agendar consulta
            </button>
          </div>
          {/* Menu mobile expandido */}
          {bp === "mobile" && menuOpen && (
            <nav style={{ width: "100%", display: "flex", flexDirection: "column", gap: 0, paddingTop: Sp.m, borderTop: `1px solid ${sobreHero ? "rgba(0,191,216,.28)" : T.gray200}`, order: 99, background: H.menu, marginTop: Sp.m, paddingLeft: Sp.m, paddingRight: Sp.m, paddingBottom: Sp.m }}>
              {/* "Planos" e "Contato" saíram: não existe página de planos, e a busca
                  era uma caixa decorativa que não buscava nada. */}
              {NAV.map(([l, href]) => (
                <a key={l} href={href} onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: Fp.sm, fontWeight: 600, color: H.nav, fontFamily: "inherit", padding: "12px 0", textAlign: "left", borderBottom: `1px solid ${sobreHero ? "rgba(255,255,255,.10)" : T.gray100}`, textDecoration: "none", display: "block" }}>{l}</a>
              ))}
              <a href="/conta" style={{ background: "none", border: "none", cursor: "pointer", fontSize: Fp.sm, fontWeight: 600, color: T.teal700, fontFamily: "inherit", padding: "12px 0", textAlign: "left", marginTop: Sp.s, textDecoration: "none", display: "block" }}>Entrar</a>
              <a href="/conta" style={{ background: T.teal050, border: `2px solid ${T.teal700}`, cursor: "pointer", fontSize: Fp.sm, fontWeight: 700, color: T.teal700, fontFamily: "inherit", padding: "12px", borderRadius: 8, marginTop: Sp.s, textAlign: "center", textDecoration: "none", display: "block" }}>Cadastre-se</a>
            </nav>
          )}
        </div>
      </header>

      <main>
      {/* ═══ BLOCO 3 — Hero (Canvas WebGL-like particle mesh) ═══ */}
      <HeroScrubFrames heroLines={heroLines} heroIdx={heroIdx} openAgendar={openAgendar} bp={bp} />

      {/* ═══ BLOCO 3.5 — ECG "O que é" (réplica EXATA v6 NookTrack, via nookpick) ═══ */}
      <div id="sobre">
        <EcgValor />
      </div>

      {/* ═══ BLOCO 4 — Segmented control (track claro, pill ativa branca) ═══ */}
      <section style={{ background: T.white, padding: `${Sp.l}px ${Sp.m}px 0` }}>
        <div style={{ ...container, display: "flex", justifyContent: bp === "mobile" ? "stretch" : "center" }}>
          <div style={{ display: "inline-flex", gap: 4, padding: 4, background: T.teal050, border: `1px solid ${T.teal100}`, borderRadius: 9999, width: bp === "mobile" ? "100%" : "auto", boxShadow: "inset 0 1px 3px rgba(0,77,92,.06)" }}>
            {["Para pacientes", "Para profissionais", "Como ativar"].map((l, i) => (
              <button key={l} onClick={() => setTab(i)} style={{
                flex: bp === "mobile" ? 1 : "none",
                padding: bp === "mobile" ? "10px 8px" : "10px 22px",
                fontSize: F.xs, fontWeight: 700, border: "none", borderRadius: 9999,
                cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
                background: tab === i ? T.white : "transparent",
                color: tab === i ? T.teal700 : T.gray600,
                boxShadow: tab === i ? "0 2px 10px rgba(0,77,92,.15)" : "none",
              }}>{l}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 5 — Card premium split (ref. Conexão Saúde, cores Revivaz + vidro fosco) ═══ */}
      <section style={{ background: T.white, padding: `${Sp.l}px ${Sp.m}px ${Sp.xl}px` }}>
        <div style={{ ...container }}>
        <div style={{
          display: "flex", gap: bp === "mobile" ? Sp.l : Sp.xxl, alignItems: "stretch", flexWrap: "wrap",
          background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navy800} 100%)`,
          border: "1px solid rgba(0,168,191,.18)", borderRadius: 28,
          padding: bp === "mobile" ? Sp.l : 40,
          boxShadow: "0 24px 60px rgba(11,29,58,.28)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -80, right: "34%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,168,191,.18), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ flex: "1 1 300px", minWidth: 0, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: Sp.m }}>
              <span style={{ width: 22, height: 2, background: T.teal300, borderRadius: 2 }} />
              <span style={{ fontSize: F.xs, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: T.teal300 }}>
                {tab === 0 ? "Para você" : tab === 1 ? "Para profissionais" : "Como ativar"}
              </span>
            </div>
            {tab === 0 && <>
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: bp === "mobile" ? F.xl : F["2xl"], color: T.white, lineHeight: 1.15, marginBottom: S.m }}>O futuro do cuidado em saúde mental</h2>
              <p style={{ fontSize: F.sm, color: "rgba(255,255,255,.72)", lineHeight: 1.7, marginBottom: Sp.l, maxWidth: 440 }}>Agende presencial ou online, receba sua receita em PDF e faça parte de uma rede que reduz a fila de espera do SUS.</p>
              <div style={{ display: "flex", gap: S.m, flexWrap: "wrap" }}>
                <button onClick={openAgendar} style={btnPrimary}>Agendar consulta</button>
                <a style={{ ...btnGlass, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }} href="#sobre">Saiba mais</a>
              </div>
            </>}
            {tab === 1 && <>
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: bp === "mobile" ? F.xl : F["2xl"], color: T.white, lineHeight: 1.15, marginBottom: S.m }}>Lidere a transformação solidária</h2>
              <p style={{ fontSize: F.sm, color: "rgba(255,255,255,.72)", lineHeight: 1.7, marginBottom: Sp.l, maxWidth: 440 }}>Reduza a fila de espera e faça do seu consultório um ponto de atendimento para quem mais precisa.</p>
              <div style={{ display: "flex", gap: S.m, flexWrap: "wrap" }}>
                <button onClick={abrirCadastroProfissional} style={btnPrimary}>Quero ser voluntário</button>
                <a style={{ ...btnGlass, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }} href="#para-profissionais">Outros parceiros</a>
              </div>
            </>}
            {tab === 2 && <>
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: bp === "mobile" ? F.xl : F["2xl"], color: T.white, lineHeight: 1.15, marginBottom: S.m }}>Faça parte do futuro</h2>
              <p style={{ fontSize: F.sm, color: "rgba(255,255,255,.72)", lineHeight: 1.7, marginBottom: Sp.l, maxWidth: 440 }}>Otimize a gestão do consultório, atenda novos pacientes e integre uma comunidade de profissionais solidários.</p>
              <div style={{ display: "flex", gap: S.m, flexWrap: "wrap" }}>
                <a style={{ ...btnPrimary, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }} href="#para-pacientes">Saiba mais</a>
                <a style={{ ...btnGlass, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }} href="mailto:contato@revivaz.com.br">Fale com suporte</a>
              </div>
            </>}
          </div>
          <div style={{ width: bp === "mobile" ? "100%" : "44%", minWidth: bp === "mobile" ? 0 : 260, borderRadius: 22, overflow: "hidden", position: "relative", zIndex: 1, flexShrink: 0, minHeight: bp === "mobile" ? 200 : 300, boxShadow: "0 16px 40px rgba(0,0,0,.3)" }}>
            <img
              src={tab === 0 ? "/revivaz/team.webp" : tab === 1 ? "/revivaz/pro.webp" : "/revivaz/ativar.webp"}
              alt={tab === 0 ? "Paciente em consulta online" : tab === 1 ? "Profissional em teleatendimento" : "Agendamento pelo app Revivaz"}
              {...{ fetchpriority: "high" }} decoding="async" width="600" height="300"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", display: "block", position: "absolute", inset: 0 }} />
            {/* tratamento teal p/ casar com as cores do site */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(150deg, rgba(0,168,191,.22) 0%, transparent 42%, rgba(11,29,58,.6) 100%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: 14, left: 14, display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", background: "rgba(255,255,255,.14)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 9999 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green500, boxShadow: "0 0 0 3px rgba(76,175,80,.25)" }} />
              <span style={{ fontSize: F.xs, color: T.white, fontWeight: 700 }}>12 especialidades</span>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* ═══ BLOCO 6 — "Saúde digital" (device card polido) ═══ */}
      <section style={{ ...sectionPad, background: T.gray050, textAlign: "center" }}>
        <div style={{ ...container }}>
          <div style={{ fontSize: Fp.xs, color: T.teal700, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: Sp.s }}>Saúde digital</div>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp["2xl"], color: T.gray950, marginBottom: Sp.s }}>do jeito que você precisa</h2>
          <p style={{ fontSize: Fp.sm, color: T.gray600, maxWidth: 420, margin: "0 auto" }}>Atendimentos por agendamento. Presencial ou online por vídeo.</p>
          <div style={{ maxWidth: bp === "mobile" ? 320 : 380, margin: `${Sp.l}px auto 0` }}>
            <div style={{ background: `linear-gradient(160deg, ${T.teal900} 0%, ${T.navy} 100%)`, borderRadius: 20, padding: bp === "mobile" ? 18 : 22, position: "relative", overflow: "hidden", border: "1px solid rgba(255,255,255,.06)", boxShadow: "0 20px 50px rgba(11,29,58,.28)" }}>
              <div style={{ position: "absolute", top: -50, right: -30, width: 170, height: 170, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,191,216,.28), transparent 70%)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: Sp.m, position: "relative", zIndex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${T.teal500}, ${T.teal700})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(0,168,191,.4)" }}>
                  <User size={26} color={T.white} />
                </div>
                <div style={{ textAlign: "left", color: T.white, flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: F.sm, fontWeight: 700 }}>Consulta online</div>
                  <div style={{ fontSize: F.xs, opacity: 0.75 }}>Dr. Carlos — Psiquiatria</div>
                </div>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.green500, boxShadow: "0 0 0 4px rgba(76,175,80,.2)", flexShrink: 0 }} />
              </div>
              {/* Ilustração de uma chamada, não controles de verdade: viraram <span>
                  para ninguém clicar esperando que atenda alguém. */}
              <div style={{ display: "flex", gap: Sp.s, marginTop: Sp.m, position: "relative", zIndex: 1 }}>
                <span aria-hidden="true" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 12, border: "none", background: T.green500, color: T.white, fontSize: F.xs, fontWeight: 700, fontFamily: "inherit" }}>
                  <Phone size={14} /> Atender
                </span>
                <span aria-hidden="true" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 12, border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.08)", color: T.white, fontSize: F.xs, fontWeight: 700, fontFamily: "inherit", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
                  <Video size={14} /> Vídeo
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 7 — 2 stat cards (NAVY escuro) ═══ */}
      <section style={{ padding: `${Sp.xl}px ${Sp.m}px`, background: T.white }}>
        <div style={{ display: "grid", gridTemplateColumns: bp === "mobile" ? "1fr" : "1fr 1fr", gap: Sp.l, ...container }}>
          {[
            { value: "Até 24h", label: "para agendar sua consulta", note: "*Conforme disponibilidade", Icon: Clock },
            { value: "Na hora", label: "receita em PDF na sua conta", note: "*Emitida pelo profissional", Icon: MessageCircle },
          ].map(({ value, label, note, Icon }) => (
            <div key={value} style={{ textAlign: "center", padding: Sp.xl, background: T.navy, borderRadius: 16, position: "relative", overflow: "hidden", boxShadow: "0 8px 24px rgba(11,29,58,.25)" }}>
              <div style={{ position: "absolute", top: -16, right: -16, width: 64, height: 64, borderRadius: "50%", background: "rgba(0,168,191,.15)" }} />
              <Icon size={24} color={T.teal300} style={{ marginBottom: S.s }} />
              <div style={{ fontSize: F["2xl"], fontWeight: 800, color: T.white, marginBottom: S.s }}>{value}</div>
              <div style={{ fontSize: F.xs, color: "rgba(255,255,255,.85)", lineHeight: 1.45 }}>{label}</div>
              <div style={{ fontSize: F.xs, color: "rgba(255,255,255,.5)", marginTop: S.s, fontStyle: "italic" }}>{note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BLOCO 8 — "Muito além de consultas" ═══ */}
      <section id="para-pacientes" style={{ padding: `${Sp.xxl}px ${Sp.m}px`, background: `linear-gradient(135deg,${T.teal050} 0%,${T.white} 100%)` }}>
        <div style={{ ...container }}>
          <Sparkles size={bp === "mobile" ? 20 : 22} color={T.teal700} style={{ marginBottom: Sp.s }} />
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp.xl, color: T.gray950, marginBottom: Sp.s }}>Muito além de consultas</h2>
          <p style={{ fontSize: F.sm, color: T.gray600, lineHeight: 1.65, marginBottom: S.l, maxWidth: 480 }}>
            Os melhores recursos para uma jornada integral de saúde mental. Cuidado contínuo que transforma vidas.
          </p>
          <button onClick={openAgendar} style={{ padding: "14px 24px", fontSize: F.sm, fontWeight: 700, color: T.white, background: `linear-gradient(135deg,${T.teal700},${T.teal500})`, border: "none", borderRadius: 9999, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(0,77,92,.3)", display: "inline-flex", alignItems: "center", gap: 6, minHeight: 48 }}>
            Saiba como ativar <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ═══ BLOCO 9 — 4 feature cards com imagem (overlay padronizado em todos) ═══ */}
      <section style={{ padding: `${Sp.xxl}px ${Sp.m}px`, background: T.white }}>
        <div style={{ display: "grid", gridTemplateColumns: bp === "mobile" ? "1fr" : "1fr 1fr", gap: Sp.l, ...container }}>
          {FEATURES.map(({ icon: Ic, title, sub, img, imgPos }) => {
            const cardOverlay = { position: "absolute" as const, inset: 0, background: "linear-gradient(to top,rgba(11,29,58,.85) 30%,transparent 65%)" };
            return (
              <div key={title} style={{ borderRadius: 16, overflow: "hidden", position: "relative", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }}>
                <img loading="lazy" decoding="async" src={img} alt={title} style={{ width: "100%", height: bp === "mobile" ? 140 : 160, objectFit: "cover", objectPosition: imgPos, display: "block" }} />
                <div style={cardOverlay} />
                <div style={{ position: "absolute", top: S.m, left: S.m, width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.2)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic size={20} color={T.white} />
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: `${S.l}px ${S.m}px` }}>
                  <div style={{ fontSize: F.base, fontWeight: 700, color: T.white, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: F.xs, color: "rgba(255,255,255,.9)", lineHeight: 1.4 }}>{sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ BLOCO 9.5 — Especialidades atendidas ═══
          A âncora "Especialidades" apontava para "Nossas soluções", que lista
          modalidades de atendimento. A lista de verdade não existia em lugar
          nenhum do site, mesmo com neurodivergência sendo especialidade forte
          do modelo de negócio. */}
      <section id="especialidades" style={{ padding: `${Sp.xxl}px ${Sp.m}px`, background: T.white }}>
        <div style={container}>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp["2xl"], color: T.gray950, marginBottom: S.s, textAlign: "center" }}>Quem atende você</h2>
          <p style={{ fontSize: F.sm, color: T.gray600, textAlign: "center", maxWidth: 620, margin: `0 auto ${Sp.l}px` }}>
            Saúde mental de adulto, criança e adolescente. Neurodivergência (autismo, TDAH e altas habilidades) é atendida pelo time inteiro, não por um profissional só.
          </p>

          {(Object.keys(GRUPOS) as GrupoEspecialidade[]).map(g => (
            <div key={g} style={{ marginBottom: Sp.l }}>
              <div style={{ fontSize: F.xs, fontWeight: 800, color: T.teal700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: S.m }}>{GRUPOS[g]}</div>
              <div style={{ display: "grid", gridTemplateColumns: bp === "mobile" ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))", gap: S.m }}>
                {ESPECIALIDADES.filter(e => e.grupo === g).map(e => (
                  <div key={e.valor} style={{ padding: S.m, borderRadius: 14, border: `1px solid ${T.gray200}`, background: T.gray050 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: F.sm, color: T.gray950 }}>{e.label}</span>
                      {e.atendeMenores && (
                        <span style={{ fontSize: 10, fontWeight: 800, color: T.teal700, background: T.teal050, border: `1px solid ${T.teal100}`, borderRadius: 9999, padding: "2px 8px", whiteSpace: "nowrap" }}>atende criança</span>
                      )}
                    </div>
                    <p style={{ fontSize: F.xs, color: T.gray600, lineHeight: 1.55, margin: 0 }}>{e.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ textAlign: "center" }}>
            <button onClick={openAgendar} style={{ padding: "14px 24px", fontSize: F.sm, fontWeight: 700, color: T.white, background: `linear-gradient(135deg,${T.teal700},${T.teal500})`, border: "none", borderRadius: 9999, cursor: "pointer", fontFamily: "inherit", minHeight: 48 }}>
              Pedir agendamento
            </button>
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 10 — "Nossas soluções" (navy bg + image + icon grid) ═══ */}
      <section style={{ padding: `${Sp.xxl}px ${Sp.m}px`, background: T.navy }}>
        <div style={{ display: "flex", gap: Sp.xl, alignItems: "center", ...container, flexWrap: "wrap" }}>
          <div style={{ width: bp === "mobile" ? "100%" : "40%", minWidth: bp === "mobile" ? 0 : 260, borderRadius: 16, overflow: "hidden", flexShrink: 0, boxShadow: "0 12px 32px rgba(0,0,0,.3)", marginTop: bp === "mobile" ? 0 : 48 }}>
            <img loading="lazy" decoding="async" src="/revivaz/solucoes.webp" alt="Consulta online por vídeo" width="600" height="200" style={{ width: "100%", height: bp === "mobile" ? 180 : 200, objectFit: "cover", objectPosition: "center", display: "block" }} />
          </div>
          <div style={{ flex: "1 1 280px", minWidth: 0 }}>
            <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp.xl, color: T.white, marginBottom: Sp.m }}>Nossas soluções</h2>
            <div style={{ display: "grid", gridTemplateColumns: bp === "mobile" ? "1fr" : "1fr 1fr", gap: Sp.m }}>
              {SOLUCOES.map(({ icon: Ic, title, desc }) => (
                <div key={title} style={{ padding: S.m, background: "rgba(255,255,255,.10)", borderRadius: 12, border: "1px solid rgba(255,255,255,.16)" }}>
                  <Ic size={18} color={T.teal300} style={{ marginBottom: S.s }} />
                  <div style={{ fontSize: F.sm, fontWeight: 700, color: T.white, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: F.xs, color: "rgba(255,255,255,.92)", lineHeight: 1.4 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 11 — banner de especialidades ═══
          Dizia "+500 profissionais & voluntários" com 1 profissional no banco.
          O 12 é conferível na seção "Quem atende você", logo acima. ═══ */}
      <section id="para-profissionais" style={{ padding: `${Sp.xxl}px ${Sp.m}px`, background: `linear-gradient(135deg,${T.teal900} 0%,${T.teal500} 100%)`, color: T.white, textAlign: "center" }}>
        <div style={{ ...container }}>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: bp === "mobile" ? 56 : 80, lineHeight: 1 }}>12</div>
          <div style={{ fontSize: Fp.base, opacity: 0.95, marginBottom: Sp.l, maxWidth: 400, margin: "0 auto" }}>especialidades, de psiquiatria a fonoaudiologia, com o time que acompanha neurodivergência</div>
          <button onClick={openAgendar} style={{ padding: "14px 28px", fontSize: F.sm, fontWeight: 700, color: T.teal700, background: T.white, border: "none", borderRadius: 9999, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(0,0,0,.2)", display: "inline-flex", alignItems: "center", gap: 6, minHeight: 48 }}>
            Faça parte <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ═══ BLOCO 12 — Como a gente cuida ═══
          Aqui havia 4 depoimentos de pessoas que não existem (um assinado com
          "CRM-SP 12345", inventado) e um selo "NPS > 90" com a tabela de
          avaliações zerada. Prova social fabricada saiu. No lugar entra o que é
          verdade e dá para conferir no próprio produto. Depoimento real volta
          quando houver paciente atendido que autorize. ═══ */}
      <section style={{ ...sectionPad, background: T.white }}>
        <div style={container}>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp["2xl"], color: T.gray950, marginBottom: S.s, textAlign: "center" }}>Como a gente cuida</h2>
          <p style={{ fontSize: F.sm, color: T.gray600, textAlign: "center", maxWidth: 600, margin: `0 auto ${Sp.l}px` }}>
            Sem promessa vaga. Isto é o que está funcionando hoje, e você confere usando.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: bp === "mobile" ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))", gap: S.m }}>
            {CUIDADO.map(({ icon: Ic, title, desc }) => (
              <div key={title} style={{ padding: S.l, borderRadius: 16, border: `1px solid ${T.gray200}`, background: T.gray050 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: T.teal050, border: `1px solid ${T.teal100}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: S.m }}>
                  <Ic size={20} color={T.teal700} />
                </div>
                <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: F.base, color: T.gray950, marginBottom: 6 }}>{title}</div>
                <p style={{ fontSize: F.xs, color: T.gray600, lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 13 — App (mockup celular). NÃO existe app publicado: os botões
          de App Store / Google Play daqui não levavam a lugar nenhum e saíram. ═══ */}
      <section style={{ padding: `${Sp.xxl}px ${Sp.m}px`, background: T.gray050, display: "flex", gap: Sp.xl, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ ...container, display: "flex", gap: Sp.xl, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: bp === "mobile" ? "100%" : 100, flexShrink: 0, display: "flex", justifyContent: "center" }}>
            <div style={{ width: bp === "mobile" ? 72 : 88, margin: "0 auto", background: T.gray950, borderRadius: 20, padding: 6, position: "relative", boxShadow: "0 12px 32px rgba(0,0,0,.2)" }}>
              <div style={{ background: T.teal900, borderRadius: 14, height: bp === "mobile" ? 130 : 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: Sp.s }}>
                <Smartphone size={28} color={T.teal300} />
                <span style={{ fontSize: F.sm, color: T.white, fontWeight: 700 }}>Revivaz</span>
                <span style={{ fontSize: F.xs, color: "rgba(255,255,255,.9)" }}>Saúde mental</span>
              </div>
              <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 28, height: 6, background: T.gray950, borderRadius: 6 }} />
            </div>
          </div>
          <div style={{ flex: "1 1 280px", minWidth: 0 }}>
            <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp.lg, color: T.gray950, marginBottom: Sp.s }}>Sua saúde ainda mais conectada</h2>
            <p style={{ fontSize: F.sm, color: T.gray600, lineHeight: 1.55, marginBottom: S.m }}>Abra sua conta no celular e tenha agendamento, receitas e teleatendimento na palma da mão. Sem precisar instalar nada.</p>
            <div style={{ display: "flex", gap: S.m, flexWrap: "wrap", marginBottom: S.s }}>
              <a href="/conta" style={{ padding: "12px 20px", fontSize: F.xs, fontWeight: 700, color: T.white, background: T.gray950, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, minHeight: 44, textDecoration: "none", justifyContent: "center" }}>
                <Smartphone size={16} /> Abrir minha conta
              </a>
            </div>
              {/* Saiu "4,6 · +37 mil avaliações": não existe app publicado nem
                  avaliação nenhuma. */}
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 14 — Perguntas frequentes ═══
          Aqui havia 3 notícias inventadas, uma delas anunciando uma "parceria
          com o SUS" que não existe. Saíram. FAQ responde o que a pessoa
          realmente pergunta antes de pedir ajuda, e cada resposta é verdade
          conferível no produto. ═══ */}
      <section style={{ ...sectionPad, background: T.gray050 }}>
        <div style={{ ...container, maxWidth: 760 }}>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp["2xl"], color: T.gray950, marginBottom: S.s, textAlign: "center" }}>Perguntas frequentes</h2>
          <p style={{ fontSize: F.sm, color: T.gray600, textAlign: "center", marginBottom: Sp.l }}>
            O que costumam querer saber antes de pedir a primeira consulta.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: S.m }}>
            {FAQ.map(({ p: pergunta, r }) => (
              <details key={pergunta} style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 14, padding: `${S.m}px ${S.l}px` }}>
                <summary style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: F.base, color: T.gray950, cursor: "pointer", listStyle: "none", minHeight: 32, display: "flex", alignItems: "center" }}>
                  {pergunta}
                </summary>
                <p style={{ fontSize: F.sm, color: T.gray600, lineHeight: 1.65, margin: `${S.s}px 0 0` }}>{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 15 — Footer ═══ */}
      <footer style={{ background: T.gray950, color: "rgba(255,255,255,.85)", padding: `${Sp.xxl}px ${Sp.m}px ${Sp.xl}px`, fontSize: Fp.xs }}>
        <div style={{ ...container }}>
          <div style={{ display: "grid", gridTemplateColumns: bp === "mobile" ? "1fr" : "1.4fr 1fr 1fr", gap: Sp.xxl, marginBottom: Sp.xl }}>
            <div>
              <div style={{ fontWeight: 900, color: T.teal300, fontSize: F.lg, marginBottom: S.s, fontFamily: "'Nunito',sans-serif" }}>Revivaz</div>
              <p style={{ lineHeight: 1.6, marginBottom: S.m, maxWidth: 320 }}>Atendimento solidário em saúde mental. Psiquiatras e psicólogos conectados a quem mais precisa.</p>
              {/* Instagram/LinkedIn/Notícias: os perfis ainda não existem. Ícone que
                  não abre nada é promessa quebrada — volta quando houver conta. */}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: T.white, marginBottom: S.m, fontSize: F.sm }}>Institucional</div>
              {[...NAV, ["Privacidade", "/privacidade"] as const, ["Termos de Uso", "/termos"] as const].map(([l, href]) => (
                <div key={l} style={{ marginBottom: 6 }}>
                  <a href={href} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "8px 0", fontFamily: "inherit", fontSize: F.xs, minHeight: 32, textAlign: "left", textDecoration: "none", display: "block" }}>{l}</a>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: T.white, marginBottom: S.m, fontSize: F.sm }}>Contato</div>
              <div style={{ display: "flex", alignItems: "center", gap: S.s, marginBottom: S.m }}>
                <Mail size={14} color="rgba(255,255,255,.5)" /> contato@revivaz.com.br
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: Sp.m, fontSize: Fp.xs, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: Sp.m }}>
            <span>© {new Date().getFullYear()} Revivaz. Atendimento solidário em saúde mental.</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Heart size={14} fill={T.teal500} stroke={T.teal500} /> Feito com amor</span>
          </div>
        </div>
      </footer>
      </main>

      {/* CTA flutuante: é a porta de entrada, no lugar que era do WhatsApp.
          Leva ao acolhimento, onde a pessoa conversa, é triada e sai com um dos
          dois caminhos reais (pedir consulta ou entrar na conta). */}
      {!modalAgendar && (
        <a
          href="/acolhimento"
          aria-label="Conversar agora com o acolhimento"
          style={{
            position: "fixed",
            right: bp === "mobile" ? 16 : 24,
            bottom: bp === "mobile" ? 16 : 24,
            zIndex: 90,
            background: `linear-gradient(135deg, ${T.teal700}, ${T.teal500})`,
            borderRadius: 9999,
            minHeight: 56,
            padding: bp === "mobile" ? "0 18px" : "0 22px",
            color: T.white,
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 800,
            fontSize: Fp.sm,
            textDecoration: "none",
            boxShadow: "0 6px 20px rgba(0,77,92,.38)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <MessageCircle size={22} aria-hidden="true" />
          Conversar agora
        </a>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL — Agendamento (sem login)
         ═══════════════════════════════════════════════════════════ */}
      {modalAgendar && (
        <div onClick={e => e.target === e.currentTarget && setModalAgendar(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.white, borderRadius: 18, maxWidth: 360, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 12px 48px rgba(0,0,0,.25)" }}>
            {/* header */}
            <div style={{ padding: `${S.m}px ${S.l}px`, borderBottom: `1px solid ${T.gray200}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: F.lg, color: T.gray950, margin: 0 }}>{modoLead === "profissional" ? "Quero atender" : "Agendar consulta"}</h3>
              <button aria-label="Fechar modal de agendamento" onClick={() => setModalAgendar(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <X size={16} color={T.gray600} />
              </button>
            </div>

            <div style={{ padding: S.l }}>
              {!agendarOk ? (<>
                {/* Quem quer ATENDER não escolhe tipo nem horário de consulta. */}
                {modoLead === "paciente" && (<>
                <label style={{ display: "block", fontSize: F.xs, fontWeight: 700, color: T.gray600, marginBottom: S.s }}>Tipo de consulta</label>
                <div style={{ display: "flex", gap: S.m, marginBottom: S.m }}>
                  {([["presencial", "Presencial", MapPin], ["online", "Online", Video]] as const).map(([val, lbl, Ic]) => (
                    <button key={val} onClick={() => setForm({ ...form, tipo: val as "presencial"|"online" })} style={{ flex: 1, padding: "10px", fontSize: 10, fontWeight: 700, border: `2px solid ${form.tipo === val ? T.teal700 : T.gray200}`, background: form.tipo === val ? T.teal050 : T.white, color: form.tipo === val ? T.teal700 : T.gray600, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Ic size={13} /> {lbl}
                    </button>
                  ))}
                </div>
                </>)}

                <label htmlFor="form-esp" style={{ display: "block", fontSize: F.xs, fontWeight: 700, color: T.gray600, marginBottom: S.s }}>{modoLead === "profissional" ? "Sua especialidade" : "Especialidade"}</label>
                <div style={{ position: "relative", marginBottom: S.m }}>
                  <Brain size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                  <select id="form-esp" value={form.esp} onChange={e => setForm({ ...form, esp: e.target.value })} style={{ ...inputBase, appearance: "none" }}>
                    {(Object.keys(GRUPOS) as GrupoEspecialidade[]).map(g => (
                      <optgroup key={g} label={GRUPOS[g]}>
                        {ESPECIALIDADES.filter(e => e.grupo === g).map(e => (
                          <option key={e.valor} value={e.valor}>{e.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {modoLead === "paciente" && (
                <div style={{ display: "grid", gridTemplateColumns: bp === "mobile" ? "1fr" : "1fr 1fr", gap: S.m, marginBottom: S.m }}>
                  <div>
                    <label htmlFor="form-data" style={{ display: "block", fontSize: F.xs, fontWeight: 700, color: T.gray600, marginBottom: S.s }}>Data</label>
                    <div style={{ position: "relative" }}>
                      <Calendar size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                      <input id="form-data" type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} style={inputBase} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="form-hora" style={{ display: "block", fontSize: F.xs, fontWeight: 700, color: T.gray600, marginBottom: S.s }}>Horário</label>
                    <div style={{ position: "relative" }}>
                      <Clock size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                      <input id="form-hora" type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} style={inputBase} />
                    </div>
                  </div>
                </div>

                )}

                <label htmlFor="form-nome" style={{ display: "block", fontSize: F.xs, fontWeight: 700, color: T.gray600, marginBottom: S.s }}>Nome completo</label>
                <div style={{ position: "relative", marginBottom: S.m }}>
                  <User size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                  <input id="form-nome" placeholder="Seu nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={inputBase} />
                </div>

                <label htmlFor="form-tel" style={{ display: "block", fontSize: F.xs, fontWeight: 700, color: T.gray600, marginBottom: S.s }}>Telefone</label>
                <div style={{ position: "relative", marginBottom: S.m }}>
                  <Phone size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                  <input id="form-tel" type="tel" placeholder="(11) 99999-9999" value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} style={inputBase} />
                </div>

                <label htmlFor="form-email" style={{ display: "block", fontSize: F.xs, fontWeight: 700, color: T.gray600, marginBottom: S.s }}>E-mail</label>
                <div style={{ position: "relative", marginBottom: S.l }}>
                  <Mail size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                  <input id="form-email" type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputBase} />
                </div>

                <button onClick={enviarPedidoAgendamento} disabled={enviandoAgendar} style={{ width: "100%", padding: "14px", fontSize: F.sm, fontWeight: 700, color: T.white, background: `linear-gradient(135deg,${T.teal700},${T.teal500})`, border: "none", borderRadius: 12, cursor: enviandoAgendar ? "default" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(0,77,92,.3)", minHeight: 48, opacity: enviandoAgendar ? 0.7 : 1 }}>
                  {enviandoAgendar ? "Enviando…" : modoLead === "profissional" ? "Quero atender" : "Pedir agendamento"}
                </button>
                {erroAgendar && (
                  <div role="alert" style={{ marginTop: S.m, padding: "10px 12px", borderRadius: 10, background: "#FEE2E2", color: "#991B1B", fontSize: F.xs, fontWeight: 700 }}>
                    {erroAgendar}
                  </div>
                )}
              </>) : (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.green500, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle size={30} color={T.white} />
                  </div>
                  <h4 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: F.lg, color: T.green700, marginBottom: S.s }}>{modoLead === "profissional" ? "Recebemos seu interesse!" : "Pedido recebido!"}</h4>
                  <p style={{ fontSize: F.sm, color: T.gray600, marginBottom: 4 }}>{modoLead === "profissional" ? "Nossa equipe vai entrar em contato para conversar sobre como funciona a rede." : "Ainda não é uma consulta marcada: nossa equipe vai entrar em contato para confirmar dia e horário."}</p>
                  <p style={{ fontSize: F.xs, color: T.gray600, marginBottom: S.l }}>Se você estiver em crise agora, ligue <strong>188</strong> (CVV, 24h e gratuito) ou <strong>192</strong> (SAMU).</p>
                  <div style={{ display: "flex", gap: S.m, justifyContent: "center", flexWrap: "wrap" }}>
                    <button onClick={() => setModalAgendar(false)} style={{ padding: "12px 20px", fontSize: F.xs, fontWeight: 700, color: T.white, background: T.teal700, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>Fechar</button>
                    <a href="/conta" style={{ padding: "12px 20px", fontSize: F.xs, fontWeight: 700, color: T.white, background: T.green500, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, minHeight: 44, textDecoration: "none", justifyContent: "center" }}>
                      <Send size={14} /> Criar minha conta
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* O modal 'Receita WhatsApp' era uma simulação ("Simular envio") e saiu
          junto com o canal. A receita real é o PDF dentro do /conta. */}
    </div>
  );
}
