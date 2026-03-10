/* ═══════════════════════════════════════════════════════════════════
   REVIVAZ — Clone EXATO dos blocos conexasaude.com.br (header→footer)
   Paleta teal/navy · Imagens reais · lucide-react icons · Modais funcionais
   ══════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef } from "react";
import {
  Star, Download, Search, Heart, ArrowRight, ChevronLeft, ChevronRight,
  Clock, MessageCircle, Smartphone, Video, Monitor, Sparkles, Brain,
  Stethoscope, FileText, Users, MapPin, Calendar, User, Phone, Mail,
  Send, X, CheckCircle, Instagram, Linkedin, Newspaper, Menu,
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
  gray950: "#0D1117", gray800: "#1F2937", gray600: "#4B5563",
  gray200: "#E5E7EB", gray050: "#F9FAFB", white: "#FFFFFF",
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

/* ── Simplex 2D noise for displacement mesh ── */
const _P = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
const _perm = new Array(512); for (let i = 0; i < 512; i++) _perm[i] = _P[i & 255];
function _g2(h: number, x: number, y: number) { const v = h & 7; const u = v < 4 ? x : y; const w = v < 4 ? y : x; return ((v & 1) ? -u : u) + ((v & 2) ? -2 * w : 2 * w); }
function simplex2(x: number, y: number) {
  const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
  const s = (x + y) * F2, i = Math.floor(x + s), j = Math.floor(y + s), t = (i + j) * G2;
  const x0 = x - i + t, y0 = y - j + t;
  const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
  const ii = i & 255, jj = j & 255;
  let n0 = 0, n1 = 0, n2 = 0;
  let t0 = 0.5 - x0 * x0 - y0 * y0; if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * _g2(_perm[ii + _perm[jj]], x0, y0); }
  let t1 = 0.5 - x1 * x1 - y1 * y1; if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * _g2(_perm[ii + i1 + _perm[jj + j1]], x1, y1); }
  let t2 = 0.5 - x2 * x2 - y2 * y2; if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * _g2(_perm[ii + 1 + _perm[jj + 1]], x2, y2); }
  return 70 * (n0 + n1 + n2);
}

/* ── Hero displacement mesh (Aegis/Monosphera-style) ── */
function HeroCanvas({ heroLines, heroIdx, openAgendar, bp = "desktop" }: { heroLines: string[]; heroIdx: number; openAgendar: () => void; bp?: "mobile" | "tablet" | "desktop" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const cols = 48, rows = 28, perspective = 180, tiltX = -0.35;

    // Floating sparks
    const sparks: { x: number; y: number; s: number; sp: number; a: number }[] = [];
    for (let i = 0; i < 60; i++) sparks.push({ x: Math.random(), y: Math.random(), s: Math.random() * 1.2 + 0.4, sp: Math.random() * 0.3 + 0.1, a: Math.random() * Math.PI * 2 });

    let t = 0;
    const animate = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      if (Math.abs(rect.width - w) > 2 || Math.abs(rect.height - h) > 2) resize();
      ctx.clearRect(0, 0, w, h);

      // BG gradient — navy (igual aos cards) para harmonizar; partículas continuam teal
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#0d2440"); bg.addColorStop(0.5, "#0B1D3A"); bg.addColorStop(1, "#060d18");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

      // Soft glow behind mesh
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.65, 0, w * 0.5, h * 0.65, w * 0.6);
      glow.addColorStop(0, "rgba(0,168,191,0.08)"); glow.addColorStop(0.5, "rgba(0,77,92,0.04)"); glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);

      const time = t * 0.008;
      const cx = w / 2, cy = h * 0.55;
      const gridW = w * 1.6, gridH = h * 1.4;

      // Compute 3D grid with noise displacement
      const pts: { sx: number; sy: number; z: number }[][] = [];
      for (let r = 0; r <= rows; r++) {
        pts[r] = [];
        for (let c = 0; c <= cols; c++) {
          const u = (c / cols - 0.5) * gridW;
          const v = (r / rows - 0.5) * gridH;
          const n1 = simplex2(c * 0.12 + time * 1.2, r * 0.12 + time * 0.8);
          const n2 = simplex2(c * 0.06 + 50 + time * 0.5, r * 0.06 + 50 + time * 0.4);
          const disp = (n1 * 0.6 + n2 * 0.4) * 35;
          const y3 = v * Math.cos(tiltX) - disp * Math.sin(tiltX);
          const z3 = v * Math.sin(tiltX) + disp * Math.cos(tiltX);
          const scale = perspective / (perspective + z3 + 120);
          pts[r][c] = { sx: cx + u * scale, sy: cy + y3 * scale, z: disp };
        }
      }

      // Draw horizontal grid lines
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          const p = pts[r][c];
          if (c === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
        }
        const edgeFade = 1 - Math.pow(Math.abs(r / rows - 0.5) * 2, 4);
        const zAvg = (pts[r][0].z + pts[r][cols].z) / 2;
        const zn = (zAvg + 35) / 70;
        ctx.strokeStyle = `rgba(${Math.round(zn * 10)},${Math.round(77 + zn * 114)},${Math.round(92 + zn * 124)},${edgeFade * (0.1 + zn * 0.22)})`;
        ctx.lineWidth = 0.6; ctx.stroke();
      }

      // Draw vertical grid lines
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        const edgeFade = 1 - Math.pow(Math.abs(c / cols - 0.5) * 2, 3);
        for (let r = 0; r <= rows; r++) {
          const p = pts[r][c];
          if (r === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
        }
        ctx.strokeStyle = `rgba(0,168,191,${edgeFade * 0.12})`; ctx.lineWidth = 0.4; ctx.stroke();
      }

      // Bright dots at peaks
      for (let r = 0; r <= rows; r += 2) {
        for (let c = 0; c <= cols; c += 2) {
          const p = pts[r][c];
          const zn = (p.z + 35) / 70;
          if (zn > 0.55) {
            const ef = (1 - Math.pow(Math.abs(c / cols - 0.5) * 2, 3)) * (1 - Math.pow(Math.abs(r / rows - 0.5) * 2, 4));
            const da = (zn - 0.55) * 2.2 * ef;
            const rad = 0.8 + zn * 1.2;
            const dg = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, rad * 4);
            dg.addColorStop(0, `rgba(0,191,216,${da * 0.4})`); dg.addColorStop(1, "rgba(0,191,216,0)");
            ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(p.sx, p.sy, rad * 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(214,244,248,${da * 0.9})`; ctx.beginPath(); ctx.arc(p.sx, p.sy, rad, 0, Math.PI * 2); ctx.fill();
          }
        }
      }

      // Floating sparks
      for (const s of sparks) {
        s.a += s.sp * 0.02;
        const px = s.x * w + Math.sin(s.a) * 8, py = s.y * h + Math.cos(s.a * 0.7) * 5;
        const fl = 0.3 + Math.sin(t * 0.03 + s.a) * 0.2;
        const sg = ctx.createRadialGradient(px, py, 0, px, py, s.s * 3);
        sg.addColorStop(0, `rgba(0,191,216,${fl})`); sg.addColorStop(1, "rgba(0,191,216,0)");
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(px, py, s.s * 3, 0, Math.PI * 2); ctx.fill();
      }

      // Edge fades — navy para combinar com o fundo
      const fadeT = ctx.createLinearGradient(0, 0, 0, h * 0.18);
      fadeT.addColorStop(0, "#0B1D3A"); fadeT.addColorStop(1, "rgba(11,29,58,0)");
      ctx.fillStyle = fadeT; ctx.fillRect(0, 0, w, h * 0.18);
      const fadeB = ctx.createLinearGradient(0, h * 0.88, 0, h);
      fadeB.addColorStop(0, "rgba(6,13,24,0)"); fadeB.addColorStop(1, "#060d18");
      ctx.fillStyle = fadeB; ctx.fillRect(0, h * 0.88, w, h * 0.12);

      t++;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const heroMinH = bp === "mobile" ? 240 : bp === "tablet" ? 280 : 320;
  const heroPad = bp === "mobile" ? "32px 16px 40px" : bp === "tablet" ? "40px 20px 48px" : "48px 24px 56px";
  const heroTitleSize = bp === "mobile" ? 22 : bp === "tablet" ? 26 : F["3xl"];
  return (
    <section style={{ position: "relative", minHeight: heroMinH, color: T.white, overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div style={{ position: "relative", zIndex: 1, padding: heroPad, maxWidth: 560 }}>
        <h1 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: heroTitleSize, lineHeight: 1.1, margin: "0 0 8px", letterSpacing: "-0.02em", background: `linear-gradient(90deg, ${T.teal100} 0%, ${T.teal300} 50%, ${T.teal500} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties}>
          Saúde que conecta
        </h1>
        <div style={{ fontSize: F.sm, fontWeight: 700, marginBottom: S.m, minHeight: 22, color: T.teal300, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {heroLines[heroIdx]}
        </div>
        <p style={{ fontSize: F.sm, opacity: 0.92, lineHeight: 1.65, marginBottom: S.l, maxWidth: "90%", color: "rgba(214,244,248,0.9)" }}>
          Cuidado em saúde mental de qualidade, oferecido por psiquiatras e psicólogos em trabalho solidário. Sem filas, sem burocracia.
        </p>
        <div style={{ display: "flex", gap: S.m, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={openAgendar} style={{ padding: "14px 24px", fontWeight: 700, fontSize: F.sm, color: "#001820", background: `linear-gradient(90deg, ${T.teal300}, ${T.teal500})`, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(0,191,216,.35)", minHeight: 48 }}>
            Agendar consulta
          </button>
          <button style={{ padding: "14px 24px", fontWeight: 700, fontSize: F.sm, color: T.teal300, background: "transparent", border: "2px solid rgba(0,191,216,0.5)", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", minHeight: 48 }}>
            Saiba como ativar
          </button>
        </div>
      </div>
    </section>
  );
}

export default function RevivazPreview() {
  const bp = useBreakpoint();
  const Sp = S_r(bp);
  const Fp = F_r(bp);
  const container = { maxWidth: containerMax(bp), margin: "0 auto" as const, paddingLeft: containerPad(bp), paddingRight: containerPad(bp) };
  const sectionPad = { padding: `${Sp.xl}px ${Sp.m}px` };

  /* state */
  const [tab, setTab] = useState(0);
  const [heroIdx, setHeroIdx] = useState(0);
  const [depoIdx, setDepoIdx] = useState(0);
  const [modalAgendar, setModalAgendar] = useState(false);
  const [agendarOk, setAgendarOk] = useState(false);
  const [modalReceita, setModalReceita] = useState(false);
  const [receitaOk, setReceitaOk] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({
    tipo: "online" as "presencial" | "online",
    esp: "psicologia" as "psiquiatria" | "psicologia",
    data: "", hora: "", nome: "", tel: "", email: "",
  });

  /* hero carousel */
  const heroLines = ["suas consultas", "seus cuidados", "sua vida"];
  useEffect(() => {
    const id = setInterval(() => setHeroIdx(p => (p + 1) % heroLines.length), 2500);
    return () => clearInterval(id);
  }, []);

  /* data */
  const DEPOS = [
    { nome: "Maria S.", cargo: "Paciente", avatar: "MS", quote: "Consegui agendar sem criar conta. A receita chegou no WhatsApp na hora. Atendimento humanizado de verdade." },
    { nome: "Dr. Carlos M.", cargo: "Psiquiatra voluntário", avatar: "CM", quote: "A Revivaz trouxe uma plataforma acessível. Agora posso ajudar quem mais precisa com dignidade." },
    { nome: "Ana R.", cargo: "Paciente", avatar: "AR", quote: "Posso me cuidar de onde estiver, com tranquilidade. Mudou minha relação com a saúde mental." },
    { nome: "Dra. Paula L.", cargo: "CRM-SP 12345", avatar: "PL", quote: "Tecnologia de ponta e um time de excelência. Satisfação em fazer parte da Revivaz." },
  ];

  const FEATURES = [
    { icon: Brain, title: "Psiquiatria", sub: "Acompanhamento especializado com profissionais voluntários qualificados.", img: "/revivaz/hero-alt.png", imgPos: "center" },
    { icon: Calendar, title: "Agendamento fácil", sub: "Presencial ou online, sem burocracia. Agende em poucos cliques.", img: "/revivaz/hero-alt.png", imgPos: "center" },
    { icon: FileText, title: "Receita digital", sub: "Receba sua receita por SMS ou WhatsApp logo após a consulta.", img: "/revivaz/hero.png", imgPos: "center" },
    { icon: Users, title: "Voluntários", sub: "Psicólogos e psiquiatras dedicados ao atendimento solidário.", img: "/revivaz/hero.png", imgPos: "center" },
  ];

  const SOLUCOES = [
    { icon: Stethoscope, title: "Consulta presencial", desc: "No consultório, com horário agendado." },
    { icon: Video, title: "Teleatendimento", desc: "Vídeo chamada com seu profissional." },
    { icon: MessageCircle, title: "Receita digital", desc: "Enviada por SMS ou WhatsApp na hora." },
    { icon: Heart, title: "Saúde mental", desc: "A maior rede solidária em saúde mental." },
  ];

  const NEWS = [
    { title: "Revivaz e SUS: parceria para reduzir filas", cat: "Solidário", date: "1 out.", img: "/revivaz/partners.png", imgPos: "top center" },
    { title: "Saúde mental nas periferias: entrevista", cat: "Imprensa", date: "25 set.", img: "/revivaz/hero-alt.png", imgPos: "top center" },
    { title: "Novos profissionais voluntários em 2025", cat: "Imprensa", date: "23 set.", img: "/revivaz/team.png", imgPos: "center 25%" },
  ];

  const openAgendar = () => { setModalAgendar(true); setAgendarOk(false); };

  /* ──────────────────── RENDER ──────────────────── */
  return (
    <div id="top" style={{ width: "100%", fontFamily: "'Nunito',system-ui,sans-serif", fontSize: F.sm, background: T.gray050, color: T.gray950, lineHeight: 1.5 }}>

      {/* ═══ BLOCO 2 — Header (layout profissional: esquerda nav, direita ações) ═══ */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, width: "100%", background: T.white, borderBottom: `1px solid ${T.gray200}`, boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
        <div style={{ padding: bp === "mobile" ? `${Sp.m}px ${Sp.m}px` : `${Sp.m}px ${Sp.xl}px`, minHeight: bp === "mobile" ? 56 : 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: Sp.m, flexWrap: "wrap", ...container }}>
          {/* Esquerda: logo + navegação */}
          <div style={{ display: "flex", alignItems: "center", gap: bp === "mobile" ? Sp.s : Sp.xl, flex: bp === "mobile" ? "1 1 auto" : "0 0 auto", minWidth: 0 }}>
            <a href="#top" style={{ fontWeight: 900, fontSize: Fp.xl, color: T.teal700, fontFamily: "'Nunito',sans-serif", letterSpacing: "-0.02em", textDecoration: "none", flexShrink: 0 }}>Revivaz</a>
            {bp !== "mobile" && (
              <nav style={{ display: "flex", alignItems: "center", gap: Sp.l }}>
                {["Especialidades", "Para pacientes", "Para profissionais", "Sobre"].map(l => (
                  <button key={l} style={{ background: "none", border: "none", cursor: "pointer", fontSize: Fp.sm, fontWeight: 600, color: T.gray700, fontFamily: "inherit", padding: "6px 0", whiteSpace: "nowrap" }}>{l}</button>
                ))}
              </nav>
            )}
          </div>
          {/* Direita: busca + Entrar + Cadastre-se + CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: bp === "mobile" ? Sp.s : Sp.m, flexWrap: "wrap", flex: bp === "mobile" ? "0 0 auto" : "0 0 auto" }}>
            {bp !== "mobile" && (
              <>
                <div style={{ position: "relative", width: 200 }}>
                  <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.gray500 }} />
                  <input placeholder="Buscar…" style={{ ...inputBase, padding: "8px 10px 8px 36px", fontSize: Fp.xs, borderRadius: 9999, minHeight: 40, background: T.gray050 }} />
                </div>
                <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: Fp.sm, fontWeight: 600, color: T.gray600, fontFamily: "inherit", padding: "8px 0", whiteSpace: "nowrap" }}>Entrar</button>
                <button style={{ background: "none", border: `2px solid ${T.teal700}`, cursor: "pointer", fontSize: Fp.sm, fontWeight: 700, color: T.teal700, fontFamily: "inherit", padding: "8px 16px", borderRadius: 9999, whiteSpace: "nowrap" }}>Cadastre-se</button>
              </>
            )}
            {bp === "mobile" && (
              <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }} aria-label="Menu">
                <Menu size={24} color={T.gray600} />
              </button>
            )}
            <button onClick={openAgendar} style={{ padding: bp === "mobile" ? "10px 14px" : "10px 20px", fontWeight: 700, fontSize: Fp.sm, color: T.white, background: T.teal700, border: "none", borderRadius: 9999, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(0,77,92,.3)", minHeight: bp === "mobile" ? 40 : 44, flexShrink: 0, whiteSpace: "nowrap" }}>
              Agendar consulta
            </button>
          </div>
          {/* Menu mobile expandido */}
          {bp === "mobile" && menuOpen && (
            <nav style={{ width: "100%", display: "flex", flexDirection: "column", gap: 0, paddingTop: Sp.m, borderTop: `1px solid ${T.gray200}`, order: 99 }}>
              <div style={{ position: "relative", marginBottom: Sp.s }}>
                <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.gray500 }} />
                <input placeholder="Buscar especialidade…" style={{ ...inputBase, padding: "10px 12px 10px 36px", fontSize: Fp.sm, borderRadius: 8, minHeight: 44, width: "100%" }} />
              </div>
              {["Especialidades", "Para pacientes", "Para profissionais", "Sobre", "Planos", "Contato"].map(l => (
                <button key={l} onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: Fp.sm, fontWeight: 600, color: T.gray700, fontFamily: "inherit", padding: "12px 0", textAlign: "left", borderBottom: `1px solid ${T.gray100}` }}>{l}</button>
              ))}
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: Fp.sm, fontWeight: 600, color: T.teal700, fontFamily: "inherit", padding: "12px 0", textAlign: "left", marginTop: Sp.s }}>Entrar</button>
              <button style={{ background: T.teal050, border: `2px solid ${T.teal700}`, cursor: "pointer", fontSize: Fp.sm, fontWeight: 700, color: T.teal700, fontFamily: "inherit", padding: "12px", borderRadius: 8, marginTop: Sp.s, textAlign: "center" }}>Cadastre-se</button>
            </nav>
          )}
        </div>
      </header>

      {/* ═══ BLOCO 3 — Hero (Canvas WebGL-like particle mesh) ═══ */}
      <HeroCanvas heroLines={heroLines} heroIdx={heroIdx} openAgendar={openAgendar} bp={bp} />

      {/* ═══ BLOCO 4 — Pill tabs ═══ */}
      <section style={{ background: T.white, padding: `${Sp.m}px ${Sp.m}px`, borderBottom: `1px solid ${T.gray200}` }}>
        <div style={{ display: "flex", gap: Sp.s, flexWrap: "wrap", ...container }}>
          {["Para pacientes", "Para profissionais", "Como ativar"].map((l, i) => (
            <button key={l} onClick={() => setTab(i)} style={pill(tab === i)}>{l}</button>
          ))}
        </div>
      </section>

      {/* ═══ BLOCO 5 — Tab content (split: text + image) ═══ */}
      <section style={{ background: T.white, padding: `${Sp.xl}px ${Sp.m}px` }}>
        <div style={{ display: "flex", gap: Sp.xl, alignItems: "center", ...container, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 280px", minWidth: 0 }}>
            {tab === 0 && <>
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: F.xl, color: T.gray950, marginBottom: S.m }}>O futuro do cuidado em saúde mental</h2>
              <p style={{ fontSize: F.sm, color: T.gray600, lineHeight: 1.65, marginBottom: S.l }}>Agende presencial ou online, receba receita por WhatsApp e faça parte de uma rede que reduz a fila de espera do SUS.</p>
              <div style={{ display: "flex", gap: S.m, flexWrap: "wrap" }}>
                <button onClick={openAgendar} style={{ padding: "12px 20px", fontSize: F.xs, fontWeight: 700, color: T.white, background: T.teal700, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>Agendar consulta</button>
                <button style={{ padding: "12px 20px", fontSize: F.xs, fontWeight: 600, color: T.teal700, background: T.teal050, border: `2px solid ${T.teal100}`, borderRadius: 12, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>Saiba mais</button>
              </div>
            </>}
            {tab === 1 && <>
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: F.xl, color: T.gray950, marginBottom: S.m }}>Lidere a transformação solidária</h2>
              <p style={{ fontSize: F.sm, color: T.gray600, lineHeight: 1.65, marginBottom: S.l }}>Reduza a fila de espera e faça do seu consultório um ponto de atendimento para quem mais precisa.</p>
              <div style={{ display: "flex", gap: S.m, flexWrap: "wrap" }}>
                <button style={{ padding: "12px 20px", fontSize: F.xs, fontWeight: 700, color: T.white, background: T.teal700, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>Quero ser voluntário</button>
                <button style={{ padding: "12px 20px", fontSize: F.xs, fontWeight: 600, color: T.teal700, background: T.teal050, border: `2px solid ${T.teal100}`, borderRadius: 12, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>Outros parceiros</button>
              </div>
            </>}
            {tab === 2 && <>
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: F.xl, color: T.gray950, marginBottom: S.m }}>Faça parte do futuro</h2>
              <p style={{ fontSize: F.sm, color: T.gray600, lineHeight: 1.65, marginBottom: S.l }}>Otimize a gestão do consultório, atenda novos pacientes e integre uma comunidade de profissionais solidários.</p>
              <div style={{ display: "flex", gap: S.m, flexWrap: "wrap" }}>
                <button style={{ padding: "12px 20px", fontSize: F.xs, fontWeight: 700, color: T.white, background: T.teal700, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>Saiba mais</button>
                <button style={{ padding: "12px 20px", fontSize: F.xs, fontWeight: 600, color: T.teal700, background: "none", border: "none", textDecoration: "underline", cursor: "pointer", fontFamily: "inherit" }}>Fale com suporte</button>
              </div>
            </>}
          </div>
          <div style={{ width: bp === "mobile" ? "100%" : "42%", minWidth: bp === "mobile" ? 0 : 240, borderRadius: 16, overflow: "hidden", position: "relative", flexShrink: 0, boxShadow: "0 8px 32px rgba(0,0,0,.12)" }}>
            <img src="/revivaz/team.png" alt="Equipe" style={{ width: "100%", height: bp === "mobile" ? 160 : 180, objectFit: "cover", objectPosition: "center 25%", display: "block" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 16px 12px", background: "linear-gradient(transparent,rgba(0,0,0,.6))" }}>
              <span style={{ fontSize: F.xs, color: T.white, fontWeight: 700 }}>+500 profissionais</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 6 — "Saúde digital" + mockup ═══ */}
      <section style={{ ...sectionPad, background: T.gray050, textAlign: "center" }}>
        <div style={{ ...container }}>
          <div style={{ fontSize: Fp.xs, color: T.teal700, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: Sp.s }}>Saúde digital</div>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp["2xl"], color: T.gray950, marginBottom: Sp.s }}>do jeito que você precisa</h2>
          <p style={{ fontSize: Fp.sm, color: T.gray600, marginBottom: Sp.l, maxWidth: 420, margin: "0 auto" }}>Atendimentos por agendamento. Presencial ou online por vídeo.</p>
          <div style={{ maxWidth: bp === "mobile" ? 320 : 360, margin: "0 auto", background: T.gray950, borderRadius: "12px 12px 0 0", padding: "10px 10px 0", position: "relative", boxShadow: "0 12px 40px rgba(0,0,0,.2)" }}>
            <div style={{ background: T.teal900, borderRadius: 8, height: bp === "mobile" ? 140 : 160, display: "flex", alignItems: "center", justifyContent: "center", gap: Sp.m }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.teal700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={26} color={T.white} />
              </div>
              <div style={{ textAlign: "left", color: T.white }}>
                <div style={{ fontSize: F.sm, fontWeight: 700 }}>Consulta online</div>
                <div style={{ fontSize: F.xs, opacity: 0.8 }}>Dr. Carlos — Psiquiatria</div>
                <div style={{ display: "flex", gap: S.s, marginTop: S.s }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.green500, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Phone size={14} color={T.white} />
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Video size={14} color={T.white} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ maxWidth: 380, margin: "0 auto", height: 8, background: T.gray800, borderRadius: "0 0 6px 6px" }} />
        </div>
      </section>

      {/* ═══ BLOCO 7 — 2 stat cards (NAVY escuro) ═══ */}
      <section style={{ padding: `${Sp.xl}px ${Sp.m}px`, background: T.white }}>
        <div style={{ display: "grid", gridTemplateColumns: bp === "mobile" ? "1fr" : "1fr 1fr", gap: Sp.l, ...container }}>
          {[
            { value: "Até 24h", label: "para agendar sua consulta", note: "*Conforme disponibilidade", Icon: Clock },
            { value: "Na hora", label: "receita por SMS ou WhatsApp", note: "*Enviada pelo profissional", Icon: MessageCircle },
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
      <section style={{ padding: `${Sp.xxl}px ${Sp.m}px`, background: `linear-gradient(135deg,${T.teal050} 0%,${T.white} 100%)` }}>
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
                <img src={img} alt={title} style={{ width: "100%", height: bp === "mobile" ? 140 : 160, objectFit: "cover", objectPosition: imgPos, display: "block" }} />
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

      {/* ═══ BLOCO 10 — "Nossas soluções" (navy bg + image + icon grid) ═══ */}
      <section style={{ padding: `${Sp.xxl}px ${Sp.m}px`, background: T.navy }}>
        <div style={{ display: "flex", gap: Sp.xl, alignItems: "center", ...container, flexWrap: "wrap" }}>
          <div style={{ width: bp === "mobile" ? "100%" : "40%", minWidth: bp === "mobile" ? 0 : 260, borderRadius: 16, overflow: "hidden", flexShrink: 0, boxShadow: "0 12px 32px rgba(0,0,0,.3)", marginTop: bp === "mobile" ? 0 : 48 }}>
            <img src="/revivaz/solucoes.png" alt="Consulta online por vídeo" style={{ width: "100%", height: bp === "mobile" ? 180 : 200, objectFit: "cover", objectPosition: "center", display: "block" }} />
          </div>
          <div style={{ flex: "1 1 280px", minWidth: 0 }}>
            <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp.xl, color: T.white, marginBottom: Sp.m }}>Nossas soluções</h2>
            <div style={{ display: "grid", gridTemplateColumns: bp === "mobile" ? "1fr" : "1fr 1fr", gap: Sp.m }}>
              {SOLUCOES.map(({ icon: Ic, title, desc }) => (
                <div key={title} style={{ padding: S.m, background: "rgba(255,255,255,.08)", borderRadius: 12, border: "1px solid rgba(255,255,255,.1)" }}>
                  <Ic size={18} color={T.teal300} style={{ marginBottom: S.s }} />
                  <div style={{ fontSize: F.sm, fontWeight: 700, color: T.white, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: F.xs, color: "rgba(255,255,255,.7)", lineHeight: 1.4 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 11 — "+500 profissionais" banner gradiente ═══ */}
      <section style={{ padding: `${Sp.xxl}px ${Sp.m}px`, background: `linear-gradient(135deg,${T.teal900} 0%,${T.teal500} 100%)`, color: T.white, textAlign: "center" }}>
        <div style={{ ...container }}>
          <div style={{ fontSize: bp === "mobile" ? 32 : 40, fontWeight: 900, marginBottom: Sp.s, letterSpacing: "-0.02em" }}>+500</div>
          <div style={{ fontSize: Fp.base, opacity: 0.95, marginBottom: Sp.l, maxWidth: 400, margin: "0 auto" }}>profissionais & voluntários oferecem Revivaz para quem precisa</div>
          <button onClick={openAgendar} style={{ padding: "14px 28px", fontSize: F.sm, fontWeight: 700, color: T.teal700, background: T.white, border: "none", borderRadius: 9999, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(0,0,0,.2)", display: "inline-flex", alignItems: "center", gap: 6, minHeight: 48 }}>
            Faça parte <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ═══ BLOCO 12 — Depoimentos (carousel + NPS + setas) ═══ */}
      <section style={{ ...sectionPad, background: T.white }}>
        <div style={{ ...container }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Sp.l, flexWrap: "wrap", gap: Sp.m }}>
            <div>
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp.xl, color: T.gray950, marginBottom: Sp.s }}>Nossa comunidade recomenda</h2>
              <div style={{ display: "flex", alignItems: "center", gap: S.s }}>
                <span style={{ fontSize: F["2xl"], fontWeight: 900, color: T.teal700 }}>NPS &gt; 90</span>
                <span style={{ fontSize: F.xs, color: T.gray600 }}>Net Promoter Score</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: S.s }}>
              <button onClick={() => setDepoIdx(p => (p - 1 + DEPOS.length) % DEPOS.length)} style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${T.gray200}`, background: T.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={18} color={T.gray600} />
              </button>
              <button onClick={() => setDepoIdx(p => (p + 1) % DEPOS.length)} style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: T.teal700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={18} color={T.white} />
              </button>
            </div>
          </div>
          <div style={{ background: T.gray050, borderRadius: 16, padding: S.xl, border: `1px solid ${T.gray200}`, boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
            <div style={{ display: "flex", gap: 4, marginBottom: S.m }}>
              {[1,2,3,4,5].map(n => <Star key={n} size={16} fill="#FFD600" stroke="#FFD600" />)}
            </div>
            <p style={{ fontSize: F.base, color: T.gray800, fontStyle: "italic", lineHeight: 1.65, marginBottom: S.m }}>
              "{DEPOS[depoIdx].quote}"
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: S.m }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.teal700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: F.sm, fontWeight: 700, color: T.white }}>
                {DEPOS[depoIdx].avatar}
              </div>
              <div>
                <div style={{ fontSize: F.sm, fontWeight: 700, color: T.gray950 }}>{DEPOS[depoIdx].nome}</div>
                <div style={{ fontSize: F.xs, color: T.gray600 }}>{DEPOS[depoIdx].cargo}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: S.m, justifyContent: "center" }}>
              {DEPOS.map((_, i) => (
                <button key={i} onClick={() => setDepoIdx(i)} style={{ width: 10, height: 10, borderRadius: "50%", border: "none", background: depoIdx === i ? T.teal700 : T.gray200, cursor: "pointer", transition: "all .2s" }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 13 — App (mockup celular + store buttons) ═══ */}
      <section style={{ padding: `${Sp.xxl}px ${Sp.m}px`, background: T.gray050, display: "flex", gap: Sp.xl, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ ...container, display: "flex", gap: Sp.xl, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: bp === "mobile" ? "100%" : 100, flexShrink: 0, display: "flex", justifyContent: "center" }}>
            <div style={{ width: bp === "mobile" ? 72 : 88, margin: "0 auto", background: T.gray950, borderRadius: 20, padding: 6, position: "relative", boxShadow: "0 12px 32px rgba(0,0,0,.2)" }}>
              <div style={{ background: T.teal900, borderRadius: 14, height: bp === "mobile" ? 130 : 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: Sp.s }}>
                <Smartphone size={28} color={T.teal300} />
                <span style={{ fontSize: F.sm, color: T.white, fontWeight: 700 }}>Revivaz</span>
                <span style={{ fontSize: F.xs, color: "rgba(255,255,255,.6)" }}>Saúde mental</span>
              </div>
              <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 28, height: 6, background: T.gray950, borderRadius: 6 }} />
            </div>
          </div>
          <div style={{ flex: "1 1 280px", minWidth: 0 }}>
            <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp.lg, color: T.gray950, marginBottom: Sp.s }}>Sua saúde ainda mais conectada</h2>
            <p style={{ fontSize: F.sm, color: T.gray600, lineHeight: 1.55, marginBottom: S.m }}>Baixe o app e tenha acesso ao agendamento, receitas e teleatendimento na palma da mão.</p>
            <div style={{ display: "flex", gap: S.m, flexWrap: "wrap", marginBottom: S.s }}>
              <button style={{ padding: "12px 20px", fontSize: F.xs, fontWeight: 700, color: T.white, background: T.gray950, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, minHeight: 44 }}>
                <Download size={16} /> App Store
              </button>
              <button style={{ padding: "12px 20px", fontSize: F.xs, fontWeight: 700, color: T.white, background: T.gray950, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, minHeight: 44 }}>
                <Download size={16} /> Google Play
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: F.xs, color: T.gray600 }}>
              <Star size={14} fill="#FFD600" stroke="#FFD600" /> 4,6 · +37 mil avaliações
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 14 — News (3 cards com thumbnail) ═══ */}
      <section style={{ ...sectionPad, background: T.white }}>
        <div style={{ ...container }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: Sp.l, flexWrap: "wrap", gap: Sp.m }}>
            <div>
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: Fp.xl, color: T.gray950, margin: 0 }}>Revivaz em foco</h2>
              <p style={{ fontSize: F.xs, color: T.gray600, margin: "4px 0 0" }}>Principais acontecimentos e conteúdos.</p>
            </div>
            <button style={{ padding: "10px 18px", fontSize: F.xs, fontWeight: 700, color: T.teal700, background: T.teal050, border: `2px solid ${T.teal100}`, borderRadius: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, minHeight: 44 }}>
              Veja tudo <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ display: "flex", gap: Sp.m, flexWrap: "wrap" }}>
            {NEWS.map(n => (
              <div key={n.title} style={{ flex: bp === "mobile" ? "1 1 100%" : "1 1 200px", minWidth: bp === "mobile" ? 0 : 180, borderRadius: 16, overflow: "hidden", border: `1px solid ${T.gray200}`, background: T.gray050, boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
                <img src={n.img} alt={n.title} style={{ width: "100%", height: 120, objectFit: "cover", objectPosition: (n as { imgPos?: string }).imgPos || "top center", display: "block" }} />
                <div style={{ padding: S.m }}>
                  <div style={{ fontSize: F.xs, color: T.teal700, fontWeight: 700, marginBottom: 4 }}>{n.cat}</div>
                  <div style={{ fontSize: F.sm, fontWeight: 600, color: T.gray950, lineHeight: 1.4, marginBottom: 4 }}>{n.title}</div>
                  <div style={{ fontSize: F.xs, color: T.gray600 }}>{n.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 15 — Footer ═══ */}
      <footer style={{ background: T.gray950, color: "rgba(255,255,255,.7)", padding: `${Sp.xxl}px ${Sp.m}px ${Sp.xl}px`, fontSize: Fp.xs }}>
        <div style={{ ...container }}>
          <div style={{ display: "grid", gridTemplateColumns: bp === "mobile" ? "1fr" : "1.4fr 1fr 1fr", gap: Sp.xxl, marginBottom: Sp.xl }}>
            <div>
              <div style={{ fontWeight: 900, color: T.teal300, fontSize: F.lg, marginBottom: S.s, fontFamily: "'Nunito',sans-serif" }}>Revivaz</div>
              <p style={{ lineHeight: 1.6, marginBottom: S.m, maxWidth: 320 }}>Atendimento solidário em saúde mental. Psiquiatras e psicólogos conectados a quem mais precisa.</p>
              <div style={{ display: "flex", gap: S.s }}>
                {[Instagram, Linkedin, Newspaper].map((Ic, i) => (
                  <div key={i} style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Ic size={18} color="rgba(255,255,255,.7)" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: T.white, marginBottom: S.m, fontSize: F.sm }}>Institucional</div>
              {["Sobre", "Especialidades", "Para profissionais", "Privacidade"].map(l => (
                <div key={l} style={{ marginBottom: 6 }}>
                  <button style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: F.xs }}>{l}</button>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: T.white, marginBottom: S.m, fontSize: F.sm }}>Contato</div>
              <div style={{ display: "flex", alignItems: "center", gap: S.s, marginBottom: 6 }}>
                <Mail size={14} color="rgba(255,255,255,.5)" /> contato@revivaz.com.br
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: S.s, marginBottom: S.m }}>
                <Phone size={14} color="rgba(255,255,255,.5)" /> (11) 4002-8922
              </div>
              <button style={{ padding: "10px 16px", fontSize: F.xs, fontWeight: 700, color: T.white, background: T.green500, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44 }}>
                <MessageCircle size={14} /> WhatsApp
              </button>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: Sp.m, fontSize: Fp.xs, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: Sp.m }}>
            <span>© 2025 Revivaz. Atendimento solidário em saúde mental.</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Heart size={14} fill={T.teal500} stroke={T.teal500} /> Feito com amor</span>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════
          MODAL — Agendamento (sem login)
         ═══════════════════════════════════════════════════════════ */}
      {modalAgendar && (
        <div onClick={e => e.target === e.currentTarget && setModalAgendar(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.white, borderRadius: 18, maxWidth: 360, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 12px 48px rgba(0,0,0,.25)" }}>
            {/* header */}
            <div style={{ padding: `${S.m}px ${S.l}px`, borderBottom: `1px solid ${T.gray200}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: F.lg, color: T.gray950, margin: 0 }}>Agendar consulta</h3>
              <button onClick={() => setModalAgendar(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <X size={16} color={T.gray600} />
              </button>
            </div>

            <div style={{ padding: S.l }}>
              {!agendarOk ? (<>
                <label style={{ display: "block", fontSize: F.xs, fontWeight: 700, color: T.gray600, marginBottom: S.s }}>Tipo de consulta</label>
                <div style={{ display: "flex", gap: S.m, marginBottom: S.m }}>
                  {([["presencial", "Presencial", MapPin], ["online", "Online", Video]] as const).map(([val, lbl, Ic]) => (
                    <button key={val} onClick={() => setForm({ ...form, tipo: val as "presencial"|"online" })} style={{ flex: 1, padding: "10px", fontSize: 10, fontWeight: 700, border: `2px solid ${form.tipo === val ? T.teal700 : T.gray200}`, background: form.tipo === val ? T.teal050 : T.white, color: form.tipo === val ? T.teal700 : T.gray600, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Ic size={13} /> {lbl}
                    </button>
                  ))}
                </div>

                <label style={{ display: "block", fontSize: F.xs, fontWeight: 700, color: T.gray600, marginBottom: S.s }}>Especialidade</label>
                <div style={{ position: "relative", marginBottom: S.m }}>
                  <Brain size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                  <select value={form.esp} onChange={e => setForm({ ...form, esp: e.target.value as any })} style={{ ...inputBase, appearance: "none" }}>
                    <option value="psiquiatria">Psiquiatria</option>
                    <option value="psicologia">Psicologia</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: bp === "mobile" ? "1fr" : "1fr 1fr", gap: S.m, marginBottom: S.m }}>
                  <div>
                    <label style={{ display: "block", fontSize: F.xs, fontWeight: 700, color: T.gray600, marginBottom: S.s }}>Data</label>
                    <div style={{ position: "relative" }}>
                      <Calendar size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                      <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} style={inputBase} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: F.xs, fontWeight: 700, color: T.gray600, marginBottom: S.s }}>Horário</label>
                    <div style={{ position: "relative" }}>
                      <Clock size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                      <input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} style={inputBase} />
                    </div>
                  </div>
                </div>

                <label style={{ display: "block", fontSize: F.xs, fontWeight: 700, color: T.gray600, marginBottom: S.s }}>Nome completo</label>
                <div style={{ position: "relative", marginBottom: S.m }}>
                  <User size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                  <input placeholder="Seu nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={inputBase} />
                </div>

                <label style={{ display: "block", fontSize: F.xs, fontWeight: 700, color: T.gray600, marginBottom: S.s }}>Telefone (WhatsApp)</label>
                <div style={{ position: "relative", marginBottom: S.m }}>
                  <Phone size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                  <input type="tel" placeholder="(11) 99999-9999" value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} style={inputBase} />
                </div>

                <label style={{ display: "block", fontSize: F.xs, fontWeight: 700, color: T.gray600, marginBottom: S.s }}>E-mail</label>
                <div style={{ position: "relative", marginBottom: S.l }}>
                  <Mail size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                  <input type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputBase} />
                </div>

                <button onClick={() => setAgendarOk(true)} style={{ width: "100%", padding: "14px", fontSize: F.sm, fontWeight: 700, color: T.white, background: `linear-gradient(135deg,${T.teal700},${T.teal500})`, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(0,77,92,.3)", minHeight: 48 }}>
                  Confirmar agendamento
                </button>
              </>) : (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.green500, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle size={30} color={T.white} />
                  </div>
                  <h4 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: F.lg, color: T.green700, marginBottom: S.s }}>Agendamento realizado!</h4>
                  <p style={{ fontSize: F.sm, color: T.gray600, marginBottom: 4 }}>Você receberá a confirmação por WhatsApp.</p>
                  <p style={{ fontSize: F.xs, color: T.gray600, marginBottom: S.l }}>Consulte seu e-mail para mais detalhes.</p>
                  <div style={{ display: "flex", gap: S.m, justifyContent: "center", flexWrap: "wrap" }}>
                    <button onClick={() => setModalAgendar(false)} style={{ padding: "12px 20px", fontSize: F.xs, fontWeight: 700, color: T.white, background: T.teal700, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>Fechar</button>
                    <button onClick={() => { setModalReceita(true); setReceitaOk(false); }} style={{ padding: "12px 20px", fontSize: F.xs, fontWeight: 700, color: T.white, background: T.green500, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, minHeight: 44 }}>
                      <Send size={14} /> Enviar receita
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL — Receita WhatsApp
         ═══════════════════════════════════════════════════════════ */}
      {modalReceita && (
        <div onClick={e => e.target === e.currentTarget && !receitaOk && setModalReceita(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.white, borderRadius: 20, maxWidth: 360, width: "100%", padding: S.xl, boxShadow: "0 16px 56px rgba(0,0,0,.2)" }}>
            {!receitaOk ? (<>
              <div style={{ display: "flex", alignItems: "center", gap: S.m, marginBottom: S.m }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.green500, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MessageCircle size={22} color={T.white} />
                </div>
                <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: F.lg, color: T.gray950, margin: 0 }}>Enviar receita</h3>
              </div>
              <p style={{ fontSize: F.sm, color: T.gray600, lineHeight: 1.55, marginBottom: S.l }}>
                O profissional envia a receita médica digital diretamente para o WhatsApp informado no agendamento.
              </p>
              <button onClick={() => { setReceitaOk(true); setTimeout(() => { setModalReceita(false); setReceitaOk(false); }, 2200); }} style={{ width: "100%", padding: "14px", fontSize: F.sm, fontWeight: 700, color: T.white, background: T.green500, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 48 }}>
                <Send size={16} /> Simular envio por WhatsApp
              </button>
            </>) : (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <CheckCircle size={40} color={T.green500} style={{ marginBottom: S.m }} />
                <p style={{ fontSize: F.base, fontWeight: 700, color: T.green700 }}>Receita enviada por WhatsApp!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
