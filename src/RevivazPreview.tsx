/* ═══════════════════════════════════════════════════════════════════
   REVIVAZ — Clone EXATO dos blocos conexasaude.com.br (header→footer)
   Paleta teal/navy · Imagens reais · lucide-react icons · Modais funcionais
   ══════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef } from "react";
import { RedeVizinhos } from "./sections/RedeVizinhos";
import HeroScrubFrames from "./sections/HeroScrubFrames";
import { Encontros } from "./sections/Encontros";
import { ConversaAcolhimento } from "./sections/ConversaAcolhimento";
import { CelularesRolagem } from "./sections/CelularesRolagem";
import { FaixaProximoEncontro } from "./sections/FaixaProximoEncontro";
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
  // Magenta do Condomínio Vivaz (relacionamentovivaz.com.br): só em botões e cards.
  mag700: "#960064", mag500: "#B4157E",
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
  const btnPrimary = { padding: "13px 24px", fontSize: F.xs, fontWeight: 700 as const, color: T.white, background: `linear-gradient(135deg, ${T.mag500}, ${T.mag700})`, border: "none", borderRadius: 12, cursor: "pointer" as const, fontFamily: "inherit", minHeight: 46, boxShadow: "0 8px 22px rgba(150,0,100,.3)" };
  const btnGlass = { padding: "13px 24px", fontSize: F.xs, fontWeight: 700 as const, color: T.white, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.24)", borderRadius: 12, cursor: "pointer" as const, fontFamily: "inherit", minHeight: 46, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" };

  /* state */
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
    ["Como funciona", "#como-funciona"],
    ["Para profissionais", "#para-profissionais"],
  ] as const;

  /* hero carousel */
  const heroLines = ["escuta", "vínculo", "convivência"];
  useEffect(() => {
    const id = setInterval(() => setHeroIdx(p => (p + 1) % heroLines.length), 2500);
    return () => clearInterval(id);
  }, []);

  /* data */
  /* Substitui os depoimentos falsos: cada item aqui é verificável dentro do
     próprio produto, não é alegação de marketing. */
  // Princípios do PDF da Flávia (§7 combinados, §8 manejo do grupo).
  const CUIDADO = [
    { icon: MessageCircle, title: "Ninguém é obrigado a falar", desc: "Escutar também é participar. Ninguém é pressionado a contar algo pessoal ou íntimo." },
    { icon: Stethoscope, title: "Profissionais com registro", desc: "Psicólogos e terapeutas com registro ativo no conselho da área conduzem a conversa, com escuta qualificada e atenção ao grupo." },
    { icon: Users, title: "Respeito e privacidade", desc: "Histórias de outras pessoas não são expostas, e a roda não vira tribunal de conflitos do condomínio." },
    { icon: Heart, title: "Em crise, ajuda imediata", desc: "Situações de risco são acolhidas e encaminhadas. Em emergência: CVV 188 e SAMU 192, 24 horas." },
  ];

  const FEATURES = [
    { icon: Brain, title: "Escuta qualificada", sub: "Uma psicóloga conduz a conversa para que todos possam falar e ser ouvidos.", img: "/revivaz/hero-alt.webp", imgPos: "center" },
    { icon: Calendar, title: "Uma quinta por mês", sub: "Encontros presenciais no condomínio, de novembro de 2026 a outubro de 2027.", img: "/revivaz/hero-alt.webp", imgPos: "center" },
    { icon: MessageCircle, title: "Um tema por mês", sub: "Relações sem violência, autocuidado, escolhas, diferenças, comunicação e mais.", img: "/revivaz/hero.webp", imgPos: "center" },
    { icon: Users, title: "Três grupos", sub: "Adolescentes de 12 a 17 anos às 18h, mulheres às 19h e homens às 20h (a confirmar).", img: "/revivaz/hero.webp", imgPos: "center" },
  ];

  // Formatos do encontro e encaminhamento (PDF da Flávia §2 e §7).
  const SOLUCOES = [
    { icon: MessageCircle, title: "Roda de conversa", desc: "Fala quem quiser, com respeito ao tempo de cada um." },
    { icon: Users, title: "Palestra dialogada", desc: "Uma exposição curta que abre espaço para perguntas." },
    { icon: Sparkles, title: "Oficina breve", desc: "Dinâmicas simples para levar algo prático para a semana." },
    { icon: Heart, title: "Encaminhamento", desc: "Quem precisar de cuidado individual recebe orientação." },
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
      r: "Os encontros do condomínio são conduzidos por psicólogos e terapeutas com registro ativo no conselho da área. O atendimento individual por vídeo é feito por profissionais voluntários com registro ativo no conselho da área, conferido no cadastro.",
    },
    {
      p: "É sigiloso mesmo?",
      r: "Dado de saúde mental é sensível e a separação de acesso está no banco, não só na tela: só você, o seu profissional e a administração enxergam sua ficha. A consulta por vídeo não é gravada. Está tudo escrito na Política de Privacidade.",
    },
    {
      p: "Atende criança e adolescente?",
      r: "Sim. Há um grupo mensal só para adolescentes de 12 a 17 anos, às 18h. Antes do primeiro encontro, o pai, a mãe ou o responsável assina um termo de ciência, que explica o objetivo do grupo, a participação livre e os limites do sigilo. Para atendimento individual, a conta deve ser criada e usada pelo responsável legal.",
    },
    {
      p: "E se eu estiver em crise agora?",
      r: "Não espere consulta. Ligue 188 (CVV), que é gratuito e funciona 24 horas, ou 192 (SAMU) se houver risco imediato. Esta plataforma não é serviço de emergência, e esses números ficam visíveis em todas as telas de atendimento.",
    },
    {
      p: "Quanto tempo até eu ser atendido?",
      r: "Você pede pelo site e a equipe entra em contato para combinar dia e horário. Enquanto isso, o acolhimento por IA responde 24 horas, sem cadastro.",
    },
    {
      p: "Como funcionam os encontros no condomínio?",
      r: "São encontros de psicologia comunitária, conduzidos por psicólogos e terapeutas com registro ativo, uma quinta-feira por mês: 18h para adolescentes de 12 a 17 anos, 19h para mulheres e 20h para homens (horário dos homens a confirmar). A participação é livre e ninguém precisa contar nada pessoal. Os encontros não substituem psicoterapia; quem precisar de cuidado individual recebe orientação.",
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
            <button onClick={openAgendar} style={{ padding: bp === "mobile" ? "10px 14px" : "10px 20px", fontWeight: 700, fontSize: Fp.sm, color: T.white, background: T.mag700, border: "none", borderRadius: 9999, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(150,0,100,.3)", minHeight: bp === "mobile" ? 40 : 44, flexShrink: 0, whiteSpace: "nowrap" }}>
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

      {/* ═══ BLOCO 3.5 — "O que é": rede de vizinhos (janelas que se ligam) ═══ */}
      <div id="sobre">
        <RedeVizinhos bp={bp} />
      </div>

      {/* ═══ BLOCO 4 — Encontros mensais (mulheres + adolescentes) ═══ */}
      <Encontros bp={bp} />

      {/* ═══ BLOCO 6 — "Saúde digital" (device card polido) ═══ */}
      <section style={{ ...sectionPad, background: T.gray050, textAlign: "center" }}>
        <div style={{ ...container }}>
          <div style={{ fontSize: Fp.xs, color: T.teal700, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: Sp.s }}>Atendimento individual</div>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp["2xl"], color: T.gray950, marginBottom: Sp.s }}>Consulta por vídeo, com hora marcada</h2>
          <p style={{ fontSize: Fp.sm, color: T.gray600, maxWidth: 420, margin: "0 auto" }}>Para quem precisa de cuidado além dos encontros, com profissionais voluntários.</p>
          <div style={{ maxWidth: bp === "mobile" ? 320 : 380, margin: `${Sp.l}px auto 0` }}>
            <div style={{ background: `linear-gradient(160deg, ${T.teal900} 0%, ${T.navy} 100%)`, borderRadius: 20, padding: bp === "mobile" ? 18 : 22, position: "relative", overflow: "hidden", border: "1px solid rgba(255,255,255,.06)", boxShadow: "0 20px 50px rgba(11,29,58,.28)" }}>
              <div style={{ position: "absolute", top: -50, right: -30, width: 170, height: 170, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,191,216,.28), transparent 70%)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: Sp.m, position: "relative", zIndex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${T.teal500}, ${T.teal700})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(0,168,191,.4)" }}>
                  <User size={26} color={T.white} />
                </div>
                <div style={{ textAlign: "left", color: T.white, flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: F.sm, fontWeight: 700 }}>Consulta online</div>
                  <div style={{ fontSize: F.xs, opacity: 0.75 }}>Psicólogo voluntário</div>
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

      {/* ═══ BLOCO 7 — 2 stat cards (NAVY escuro), números do PDF da Flávia ═══ */}
      <section style={{ padding: `${Sp.xl}px ${Sp.m}px`, background: T.white }}>
        <div style={{ display: "grid", gridTemplateColumns: bp === "mobile" ? "1fr" : "1fr 1fr", gap: Sp.l, ...container }}>
          {[
            { value: "12 encontros", label: "de novembro de 2026 a outubro de 2027", note: "Na última quinta de cada mês; em dezembro, dia 17/12", Icon: Calendar },
            { value: "Até 60 min", label: "por encontro, para cada grupo", note: "Adolescentes às 18h, mulheres às 19h e homens às 20h", Icon: Clock },
          ].map(({ value, label, note, Icon }) => (
            <div key={value} style={{ textAlign: "center", padding: Sp.xl, background: T.navy, borderRadius: 16, position: "relative", overflow: "hidden", boxShadow: "0 8px 24px rgba(11,29,58,.25)" }}>
              <div style={{ position: "absolute", top: -16, right: -16, width: 64, height: 64, borderRadius: "50%", background: "rgba(0,168,191,.15)" }} />
              <Icon size={24} color={T.teal300} style={{ marginBottom: S.s }} />
              <div style={{ fontSize: F["2xl"], fontWeight: 800, color: T.white, marginBottom: S.s }}>{value}</div>
              <div style={{ fontSize: F.xs, color: "rgba(255,255,255,.85)", lineHeight: 1.45 }}>{label}</div>
              <div style={{ fontSize: F.xs, color: "rgba(255,255,255,.5)", marginTop: S.s }}>{note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BLOCO 8 — "Muito além de consultas" ═══ */}
      <section id="para-pacientes" style={{ padding: `${Sp.xxl}px ${Sp.m}px`, background: `linear-gradient(135deg,${T.teal050} 0%,${T.white} 100%)` }}>
        <div style={{ ...container }}>
          <Sparkles size={bp === "mobile" ? 20 : 22} color={T.teal700} style={{ marginBottom: Sp.s }} />
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp.xl, color: T.gray950, marginBottom: Sp.s }}>Cuidado entre um encontro e outro</h2>
          <p style={{ fontSize: F.sm, color: T.gray600, lineHeight: 1.65, marginBottom: S.l, maxWidth: 480 }}>
            Encontros no condomínio, consulta individual quando necessário e orientação para chegar à rede de apoio.
          </p>
          <button onClick={openAgendar} style={{ padding: "14px 24px", fontSize: F.sm, fontWeight: 700, color: T.white, background: `linear-gradient(135deg,${T.mag700},${T.mag500})`, border: "none", borderRadius: 9999, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(150,0,100,.3)", display: "inline-flex", alignItems: "center", gap: 6, minHeight: 48 }}>
            Pedir orientação <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ═══ BLOCO 9 — 4 feature cards com imagem (overlay padronizado em todos) ═══ */}
      <section style={{ padding: `${Sp.xxl}px ${Sp.m}px`, background: T.white }}>
        <div style={{ display: "grid", gridTemplateColumns: bp === "mobile" ? "1fr" : "1fr 1fr", gap: Sp.l, ...container }}>
          {FEATURES.map(({ icon: Ic, title, sub, img, imgPos }) => {
            const cardOverlay = { position: "absolute" as const, inset: 0, background: "linear-gradient(to top,rgba(74,0,50,.88) 30%,transparent 65%)" };
            return (
              <div key={title} style={{ borderRadius: 16, overflow: "hidden", position: "relative", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }}>
                <img loading="lazy" decoding="async" src={img} alt={title} style={{ width: "100%", height: bp === "mobile" ? 140 : 160, objectFit: "cover", objectPosition: imgPos, display: "block", filter: "hue-rotate(135deg) saturate(1.15)" }} />
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

      {/* ═══ BLOCO 9.5 — Conversa de acolhimento (exemplo do assistente) ═══ */}
      <ConversaAcolhimento bp={bp} />

      {/* ═══ BLOCO 10 — "Como os encontros acontecem" (magenta Vivaz bg + image + icon grid) ═══ */}
      <section style={{ padding: `${Sp.xxl}px ${Sp.m}px`, background: `linear-gradient(135deg,${T.mag700},${T.mag500})` }}>
        <div style={{ display: "flex", gap: Sp.xl, alignItems: "center", ...container, flexWrap: "wrap" }}>
          <div style={{ width: bp === "mobile" ? "100%" : "40%", minWidth: bp === "mobile" ? 0 : 260, borderRadius: 16, overflow: "hidden", flexShrink: 0, boxShadow: "0 12px 32px rgba(0,0,0,.3)", marginTop: bp === "mobile" ? 0 : 48 }}>
            <img loading="lazy" decoding="async" src="/revivaz/solucoes.webp" alt="Mulher sorrindo de olhos fechados" width="600" height="200" style={{ width: "100%", height: bp === "mobile" ? 180 : 200, objectFit: "cover", objectPosition: "center", display: "block" }} />
          </div>
          <div style={{ flex: "1 1 280px", minWidth: 0 }}>
            <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp.xl, color: T.white, marginBottom: Sp.m }}>Como os encontros acontecem</h2>
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

      {/* ═══ BLOCO 11 — próximo encontro + convite a voluntários ═══
          Antes: "12 especialidades, da psiquiatria à fonoaudiologia", que não
          é o projeto do condomínio (18/10/2026). ═══ */}
      <FaixaProximoEncontro bp={bp} onVoluntario={abrirCadastroProfissional} />

      {/* ═══ BLOCO 12 — Como a gente cuida ═══
          Aqui havia 4 depoimentos de pessoas que não existem (um assinado com
          "CRM-SP 12345", inventado) e um selo "NPS > 90" com a tabela de
          avaliações zerada. Prova social fabricada saiu. No lugar entra o que é
          verdade e dá para conferir no próprio produto. Depoimento real volta
          quando houver paciente atendido que autorize. ═══ */}
      <section style={{ ...sectionPad, background: T.white }}>
        <div style={container}>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp["2xl"], color: T.gray950, marginBottom: S.s, textAlign: "center" }}>Princípios do grupo</h2>
          <p style={{ fontSize: F.sm, color: T.gray600, textAlign: "center", maxWidth: 600, margin: `0 auto ${Sp.l}px` }}>
            Combinados que valem para todos os encontros: adolescentes, mulheres e homens.
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

      {/* ═══ BLOCO 13 — Sua conta: celulares girando na rolagem (sections/CelularesRolagem.tsx).
          Não existe app publicado: é a conta pelo navegador. ═══ */}
      <CelularesRolagem bp={bp} />

      {/* ═══ BLOCO 14 — Perguntas frequentes ═══
          Aqui havia 3 notícias inventadas, uma delas anunciando uma "parceria
          com o SUS" que não existe. Saíram. FAQ responde o que a pessoa
          realmente pergunta antes de pedir ajuda, e cada resposta é verdade
          conferível no produto. ═══ */}
      <section style={{ ...sectionPad, background: T.gray050 }}>
        <div style={{ ...container, maxWidth: 760 }}>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp["2xl"], color: T.gray950, marginBottom: S.s, textAlign: "center" }}>Perguntas frequentes</h2>
          <p style={{ fontSize: F.sm, color: T.gray600, textAlign: "center", marginBottom: Sp.l }}>
            Dúvidas comuns sobre os encontros e o atendimento individual.
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
              <p style={{ lineHeight: 1.6, marginBottom: S.m, maxWidth: 320 }}>Psicologia comunitária e atendimento solidário em saúde mental, com profissionais voluntários.</p>
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
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Heart size={14} fill={T.teal500} stroke={T.teal500} /> Projeto solidário</span>
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
            background: `linear-gradient(135deg, ${T.mag700}, ${T.mag500})`,
            borderRadius: 9999,
            minHeight: 56,
            padding: bp === "mobile" ? "0 18px" : "0 22px",
            color: T.white,
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 800,
            fontSize: Fp.sm,
            textDecoration: "none",
            boxShadow: "0 6px 20px rgba(150,0,100,.38)",
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

                <button onClick={enviarPedidoAgendamento} disabled={enviandoAgendar} style={{ width: "100%", padding: "14px", fontSize: F.sm, fontWeight: 700, color: T.white, background: `linear-gradient(135deg,${T.mag700},${T.mag500})`, border: "none", borderRadius: 12, cursor: enviandoAgendar ? "default" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(150,0,100,.3)", minHeight: 48, opacity: enviandoAgendar ? 0.7 : 1 }}>
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
