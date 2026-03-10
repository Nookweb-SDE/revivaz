/* ═══════════════════════════════════════════════════════════════════
   REVIVAZ — Clone EXATO dos blocos conexasaude.com.br (header→footer)
   Paleta teal/navy · Imagens reais · lucide-react icons · Modais funcionais
   ══════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef } from "react";
import {
  Star, Download, Search, Heart, ArrowRight, ChevronLeft, ChevronRight,
  Clock, MessageCircle, Smartphone, Video, Monitor, Sparkles, Brain,
  Stethoscope, FileText, Users, MapPin, Calendar, User, Phone, Mail,
  Send, X, CheckCircle, Instagram, Linkedin, Newspaper,
} from "lucide-react";

/* ── design tokens ── */
const T = {
  teal900: "#004D5C", teal700: "#007A8C", teal500: "#00A8BF",
  teal300: "#00BFD8", teal100: "#D6F4F8", teal050: "#EDF9FB",
  green700: "#2E7D32", green500: "#4CAF50",
  navy: "#0B1D3A", navy800: "#112240",
  gray950: "#0D1117", gray800: "#1F2937", gray600: "#4B5563",
  gray200: "#E5E7EB", gray050: "#F9FAFB", white: "#FFFFFF",
};

const pill = (active: boolean) => ({
  padding: "7px 16px", fontSize: "10px", fontWeight: 700 as const,
  border: "none", borderRadius: 9999, cursor: "pointer" as const,
  fontFamily: "inherit", transition: "all .2s",
  background: active ? T.teal700 : T.gray050,
  color: active ? T.white : T.gray600,
  boxShadow: active ? "0 2px 8px rgba(0,77,92,.25)" : "none",
});

const inputBase = {
  width: "100%", padding: "9px 10px 9px 32px", fontSize: "11px",
  border: `1px solid ${T.gray200}`, borderRadius: 10,
  boxSizing: "border-box" as const, fontFamily: "inherit", outline: "none",
};

const sectionPad = { padding: "22px 16px" };

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
function HeroCanvas({ heroLines, heroIdx, openAgendar }: { heroLines: string[]; heroIdx: number; openAgendar: () => void }) {
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

      // BG gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#001820"); bg.addColorStop(0.5, "#002A33"); bg.addColorStop(1, "#001218");
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

      // Edge fades
      const fadeT = ctx.createLinearGradient(0, 0, 0, h * 0.18);
      fadeT.addColorStop(0, "#001820"); fadeT.addColorStop(1, "rgba(0,24,32,0)");
      ctx.fillStyle = fadeT; ctx.fillRect(0, 0, w, h * 0.18);
      const fadeB = ctx.createLinearGradient(0, h * 0.88, 0, h);
      fadeB.addColorStop(0, "rgba(0,18,24,0)"); fadeB.addColorStop(1, "#001218");
      ctx.fillStyle = fadeB; ctx.fillRect(0, h * 0.88, w, h * 0.12);

      t++;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <section style={{ position: "relative", minHeight: 220, color: T.white, overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div style={{ position: "relative", zIndex: 1, padding: "30px 16px 34px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", border: "1px solid rgba(0,191,216,0.3)", background: "rgba(0,168,191,0.08)", borderRadius: 4, marginBottom: 12 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.teal300, boxShadow: `0 0 6px ${T.teal300}` }} />
          <span style={{ fontSize: 8, fontFamily: "monospace", color: T.teal300, letterSpacing: "0.12em", textTransform: "uppercase" }}>Saúde Digital Ativa</span>
        </div>
        <h1 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 26, lineHeight: 1.05, margin: "0 0 5px", letterSpacing: "0.02em", background: `linear-gradient(90deg, ${T.teal100} 0%, ${T.teal300} 50%, ${T.teal500} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties}>
          Saúde que conecta
        </h1>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, minHeight: 18, color: T.teal300, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {heroLines[heroIdx]}
        </div>
        <p style={{ fontSize: 10, opacity: .9, lineHeight: 1.6, marginBottom: 16, maxWidth: "88%", color: "rgba(214,244,248,0.75)" }}>
          Cuidado em saúde mental de qualidade, oferecido por psiquiatras e psicólogos em trabalho solidário. Sem filas, sem burocracia.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={openAgendar} style={{ padding: "9px 18px", fontWeight: 700, fontSize: 10, color: "#001820", background: `linear-gradient(90deg, ${T.teal300}, ${T.teal500})`, border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 2px 16px rgba(0,191,216,.25)` }}>
            Agendar consulta
          </button>
          <button style={{ padding: "9px 18px", fontWeight: 700, fontSize: 10, color: T.teal300, background: "transparent", border: "1px solid rgba(0,191,216,0.4)", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>
            Saiba como ativar
          </button>
        </div>
        <div style={{ display: "flex", gap: 2, marginTop: 14 }}>
          {[1,2,3,4,5].map(n => <Star key={n} size={10} fill="#FFD600" stroke="#FFD600" />)}
          <span style={{ fontSize: 9, marginLeft: 4, opacity: .7, color: T.teal100 }}>4,6 · +37 mil avaliações</span>
        </div>
      </div>
    </section>
  );
}

export default function RevivazPreview() {
  /* state */
  const [tab, setTab] = useState(0);
  const [heroIdx, setHeroIdx] = useState(0);
  const [depoIdx, setDepoIdx] = useState(0);
  const [modalAgendar, setModalAgendar] = useState(false);
  const [agendarOk, setAgendarOk] = useState(false);
  const [modalReceita, setModalReceita] = useState(false);
  const [receitaOk, setReceitaOk] = useState(false);
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
    { icon: Brain, title: "Psiquiatria", sub: "Acompanhamento especializado com profissionais voluntários qualificados.", img: "/revivaz/team.png", imgPos: "center" },
    { icon: Calendar, title: "Agendamento fácil", sub: "Presencial ou online, sem burocracia. Agende em poucos cliques.", img: "/revivaz/hero-alt.png", imgPos: "center" },
    { icon: FileText, title: "Receita digital", sub: "Receba sua receita por SMS ou WhatsApp logo após a consulta.", img: "/revivaz/partners.png", imgPos: "center calc(50% + 10px)" },
    { icon: Users, title: "Voluntários", sub: "Psicólogos e psiquiatras dedicados ao atendimento solidário.", img: "/revivaz/hero.png", imgPos: "center" },
  ];

  const SOLUCOES = [
    { icon: Stethoscope, title: "Consulta presencial", desc: "No consultório, com horário agendado." },
    { icon: Video, title: "Teleatendimento", desc: "Vídeo chamada com seu profissional." },
    { icon: MessageCircle, title: "Receita digital", desc: "Enviada por SMS ou WhatsApp na hora." },
    { icon: Heart, title: "Saúde mental", desc: "A maior rede solidária em saúde mental." },
  ];

  const NEWS = [
    { title: "Revivaz e SUS: parceria para reduzir filas", cat: "Solidário", date: "1 out.", img: "/revivaz/partners.png" },
    { title: "Saúde mental nas periferias: entrevista", cat: "Imprensa", date: "25 set.", img: "/revivaz/hero-alt.png" },
    { title: "Novos profissionais voluntários em 2025", cat: "Imprensa", date: "23 set.", img: "/revivaz/team.png" },
  ];

  const openAgendar = () => { setModalAgendar(true); setAgendarOk(false); };

  /* ──────────────────── RENDER ──────────────────── */
  return (
    <div style={{ width: "100%", fontFamily: "'Inter','Nunito',system-ui,sans-serif", fontSize: 12, background: T.gray050, color: T.gray950 }}>

      {/* ═══ BLOCO 2 — Header sticky ═══ */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: T.white, borderBottom: `1px solid ${T.gray200}`, padding: "8px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontWeight: 900, fontSize: 16, color: T.teal700, fontFamily: "'Nunito',sans-serif", letterSpacing: "-0.02em" }}>Revivaz</span>
        <div style={{ flex: 1, position: "relative", maxWidth: 220 }}>
          <Search size={11} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
          <input placeholder="Buscar especialidade…" style={{ ...inputBase, padding: "6px 10px 6px 26px", fontSize: 9, borderRadius: 9999 }} />
        </div>
        <nav style={{ display: "flex", gap: 8 }}>
          {["Especialidades", "Planos", "Contato"].map(l => (
            <button key={l} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 9, fontWeight: 500, color: T.gray600, fontFamily: "inherit" }}>{l}</button>
          ))}
        </nav>
        <button onClick={openAgendar} style={{ padding: "7px 14px", fontWeight: 700, fontSize: 10, color: T.white, background: T.teal700, border: "none", borderRadius: 9999, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,77,92,.2)" }}>
          Agendar consulta
        </button>
      </header>

      {/* ═══ BLOCO 3 — Hero (Canvas WebGL-like particle mesh) ═══ */}
      <HeroCanvas heroLines={heroLines} heroIdx={heroIdx} openAgendar={openAgendar} />

      {/* ═══ BLOCO 4 — Pill tabs ═══ */}
      <section style={{ background: T.white, padding: "14px 16px 12px", borderBottom: `1px solid ${T.gray200}` }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["Para pacientes", "Para profissionais", "Como ativar"].map((l, i) => (
            <button key={l} onClick={() => setTab(i)} style={pill(tab === i)}>{l}</button>
          ))}
        </div>
      </section>

      {/* ═══ BLOCO 5 — Tab content (split: text + image) ═══ */}
      <section style={{ background: T.white, padding: "20px 16px 24px" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {/* text */}
          <div style={{ flex: 1 }}>
            {tab === 0 && <>
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15, color: T.gray950, marginBottom: 8 }}>O futuro do cuidado em saúde mental</h2>
              <p style={{ fontSize: 10, color: T.gray600, lineHeight: 1.6, marginBottom: 12 }}>Agende presencial ou online, receba receita por WhatsApp e faça parte de uma rede que reduz a fila de espera do SUS.</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={openAgendar} style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: T.white, background: T.teal700, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>Agendar consulta</button>
                <button style={{ padding: "8px 14px", fontSize: 10, fontWeight: 600, color: T.teal700, background: T.teal050, border: `1px solid ${T.teal100}`, borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>Saiba mais</button>
              </div>
            </>}
            {tab === 1 && <>
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15, color: T.gray950, marginBottom: 8 }}>Lidere a transformação solidária</h2>
              <p style={{ fontSize: 10, color: T.gray600, lineHeight: 1.6, marginBottom: 12 }}>Reduza a fila de espera e faça do seu consultório um ponto de atendimento para quem mais precisa.</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: T.white, background: T.teal700, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>Quero ser voluntário</button>
                <button style={{ padding: "8px 14px", fontSize: 10, fontWeight: 600, color: T.teal700, background: T.teal050, border: `1px solid ${T.teal100}`, borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>Outros parceiros</button>
              </div>
            </>}
            {tab === 2 && <>
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15, color: T.gray950, marginBottom: 8 }}>Faça parte do futuro</h2>
              <p style={{ fontSize: 10, color: T.gray600, lineHeight: 1.6, marginBottom: 12 }}>Otimize a gestão do consultório, atenda novos pacientes e integre uma comunidade de profissionais solidários.</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: T.white, background: T.teal700, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>Saiba mais</button>
                <button style={{ padding: "8px 14px", fontSize: 10, fontWeight: 600, color: T.teal700, background: "none", border: "none", textDecoration: "underline", cursor: "pointer", fontFamily: "inherit" }}>Fale com suporte</button>
              </div>
            </>}
          </div>
          {/* image */}
          <div style={{ width: "42%", minHeight: 110, borderRadius: 14, overflow: "hidden", position: "relative", flexShrink: 0 }}>
            <img src="/revivaz/team.png" alt="Equipe" style={{ width: "100%", height: 140, objectFit: "cover", objectPosition: "top center", display: "block" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 8px 6px", background: "linear-gradient(transparent,rgba(0,0,0,.55))" }}>
              <span style={{ fontSize: 8, color: T.white, fontWeight: 700 }}>+500 profissionais</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 6 — "Saúde digital" + mockup ═══ */}
      <section style={{ ...sectionPad, background: T.gray050, textAlign: "center" }}>
        <div style={{ fontSize: 9, color: T.teal700, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>Saúde digital</div>
        <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 16, color: T.gray950, marginBottom: 4 }}>do jeito que você precisa</h2>
        <p style={{ fontSize: 10, color: T.gray600, marginBottom: 14 }}>Atendimentos por agendamento. Presencial ou online por vídeo.</p>
        {/* laptop mockup */}
        <div style={{ maxWidth: 320, margin: "0 auto", background: T.gray950, borderRadius: "10px 10px 0 0", padding: "8px 8px 0", position: "relative" }}>
          <div style={{ background: T.teal900, borderRadius: 6, height: 140, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", background: T.teal700, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={22} color={T.white} />
            </div>
            <div style={{ textAlign: "left", color: T.white }}>
              <div style={{ fontSize: 10, fontWeight: 700 }}>Consulta online</div>
              <div style={{ fontSize: 8, opacity: .7 }}>Dr. Carlos — Psiquiatria</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.green500, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Phone size={11} color={T.white} />
                </div>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Video size={11} color={T.white} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 340, margin: "0 auto", height: 6, background: T.gray800, borderRadius: "0 0 4px 4px" }} />
      </section>

      {/* ═══ BLOCO 7 — 2 stat cards (NAVY escuro) ═══ */}
      <section style={{ padding: "18px 16px", background: T.white, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { value: "Até 24h", label: "para agendar sua consulta", note: "*Conforme disponibilidade", Icon: Clock },
          { value: "Na hora", label: "receita por SMS ou WhatsApp", note: "*Enviada pelo profissional", Icon: MessageCircle },
        ].map(({ value, label, note, Icon }) => (
          <div key={value} style={{ textAlign: "center", padding: "16px 10px", background: T.navy, borderRadius: 14, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -12, right: -12, width: 50, height: 50, borderRadius: "50%", background: "rgba(0,168,191,.12)" }} />
            <Icon size={18} color={T.teal300} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: T.white, marginBottom: 3 }}>{value}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.7)", lineHeight: 1.4 }}>{label}</div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,.45)", marginTop: 4, fontStyle: "italic" }}>{note}</div>
          </div>
        ))}
      </section>

      {/* ═══ BLOCO 8 — "Muito além de consultas" ═══ */}
      <section style={{ padding: "22px 16px", background: `linear-gradient(135deg,${T.teal050} 0%,${T.white} 100%)` }}>
        <Sparkles size={16} color={T.teal700} style={{ marginBottom: 6 }} />
        <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 16, color: T.gray950, marginBottom: 6 }}>Muito além de consultas</h2>
        <p style={{ fontSize: 10, color: T.gray600, lineHeight: 1.6, marginBottom: 12 }}>
          Os melhores recursos para uma jornada integral de saúde mental. Cuidado contínuo que transforma vidas.
        </p>
        <button onClick={openAgendar} style={{ padding: "9px 18px", fontSize: 10, fontWeight: 700, color: T.white, background: `linear-gradient(135deg,${T.teal700},${T.teal500})`, border: "none", borderRadius: 9999, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 3px 12px rgba(0,77,92,.25)", display: "flex", alignItems: "center", gap: 4 }}>
          Saiba como ativar <ArrowRight size={11} />
        </button>
      </section>

      {/* ═══ BLOCO 9 — 4 feature cards com imagem ═══ */}
      <section style={{ padding: "20px 16px", background: T.white }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {FEATURES.map(({ icon: Ic, title, sub, img, imgPos }) => (
            <div key={title} style={{ borderRadius: 14, overflow: "hidden", position: "relative", boxShadow: "0 2px 12px rgba(0,0,0,.08)" }}>
              <img src={img} alt={title} style={{ width: "100%", height: 120, objectFit: "cover", objectPosition: imgPos, display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(11,29,58,.82) 35%,transparent 70%)" }} />
              <div style={{ position: "absolute", top: 6, left: 6, width: 22, height: 22, borderRadius: 6, background: "rgba(255,255,255,.2)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic size={12} color={T.white} />
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px 8px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.white, marginBottom: 1 }}>{title}</div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,.75)", lineHeight: 1.3 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BLOCO 10 — "Nossas soluções" (navy bg + image + icon grid) ═══ */}
      <section style={{ padding: "24px 16px", background: T.navy }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: "40%", borderRadius: 14, overflow: "hidden", flexShrink: 0 }}>
            <img src="/revivaz/team.png" alt="Equipe" style={{ width: "100%", height: 140, objectFit: "cover", objectPosition: "top center", display: "block" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15, color: T.white, marginBottom: 10 }}>Nossas soluções</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {SOLUCOES.map(({ icon: Ic, title, desc }) => (
                <div key={title} style={{ padding: "8px", background: "rgba(255,255,255,.06)", borderRadius: 10, border: "1px solid rgba(255,255,255,.08)" }}>
                  <Ic size={14} color={T.teal300} style={{ marginBottom: 4 }} />
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.white, marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,.55)", lineHeight: 1.3 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 11 — "+500 profissionais" banner gradiente ═══ */}
      <section style={{ padding: "28px 16px", background: `linear-gradient(135deg,${T.teal900} 0%,${T.teal500} 100%)`, color: T.white, textAlign: "center" }}>
        <div style={{ fontSize: 30, fontWeight: 900, marginBottom: 2 }}>+500</div>
        <div style={{ fontSize: 11, opacity: .9, marginBottom: 14 }}>profissionais & voluntários oferecem Revivaz para quem precisa</div>
        <button onClick={openAgendar} style={{ padding: "10px 22px", fontSize: 11, fontWeight: 700, color: T.teal700, background: T.white, border: "none", borderRadius: 9999, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 3px 14px rgba(0,0,0,.15)", display: "inline-flex", alignItems: "center", gap: 4 }}>
          Faça parte <ArrowRight size={12} />
        </button>
      </section>

      {/* ═══ BLOCO 12 — Depoimentos (carousel + NPS + setas) ═══ */}
      <section style={{ ...sectionPad, background: T.white }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15, color: T.gray950, marginBottom: 4 }}>Nossa comunidade recomenda</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: T.teal700 }}>NPS &gt; 90</span>
              <span style={{ fontSize: 8, color: T.gray600 }}>Net Promoter Score</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => setDepoIdx(p => (p - 1 + DEPOS.length) % DEPOS.length)} style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${T.gray200}`, background: T.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={13} color={T.gray600} />
            </button>
            <button onClick={() => setDepoIdx(p => (p + 1) % DEPOS.length)} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: T.teal700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={13} color={T.white} />
            </button>
          </div>
        </div>

        <div style={{ background: T.gray050, borderRadius: 14, padding: "16px", border: `1px solid ${T.gray200}` }}>
          <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
            {[1,2,3,4,5].map(n => <Star key={n} size={11} fill="#FFD600" stroke="#FFD600" />)}
          </div>
          <p style={{ fontSize: 11, color: T.gray800, fontStyle: "italic", lineHeight: 1.6, marginBottom: 10 }}>
            "{DEPOS[depoIdx].quote}"
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.teal700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.white }}>
              {DEPOS[depoIdx].avatar}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.gray950 }}>{DEPOS[depoIdx].nome}</div>
              <div style={{ fontSize: 8, color: T.gray600 }}>{DEPOS[depoIdx].cargo}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 10, justifyContent: "center" }}>
            {DEPOS.map((_, i) => (
              <button key={i} onClick={() => setDepoIdx(i)} style={{ width: 7, height: 7, borderRadius: "50%", border: "none", background: depoIdx === i ? T.teal700 : T.gray200, cursor: "pointer", transition: "all .2s" }} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 13 — App (mockup celular + store buttons) ═══ */}
      <section style={{ padding: "24px 16px", background: T.gray050, display: "flex", gap: 16, alignItems: "center" }}>
        {/* phone mockup */}
        <div style={{ width: 80, flexShrink: 0 }}>
          <div style={{ width: 70, margin: "0 auto", background: T.gray950, borderRadius: 14, padding: "4px", position: "relative" }}>
            <div style={{ background: T.teal900, borderRadius: 10, height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Smartphone size={20} color={T.teal300} />
              <span style={{ fontSize: 7, color: T.white, fontWeight: 700 }}>Revivaz</span>
              <span style={{ fontSize: 6, color: "rgba(255,255,255,.5)" }}>Saúde mental</span>
            </div>
            {/* notch */}
            <div style={{ position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)", width: 22, height: 4, background: T.gray950, borderRadius: 4 }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14, color: T.gray950, marginBottom: 4 }}>Sua saúde ainda mais conectada</h2>
          <p style={{ fontSize: 9, color: T.gray600, lineHeight: 1.5, marginBottom: 10 }}>Baixe o app e tenha acesso ao agendamento, receitas e teleatendimento na palma da mão.</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            <button style={{ padding: "7px 12px", fontSize: 9, fontWeight: 700, color: T.white, background: T.gray950, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
              <Download size={10} /> App Store
            </button>
            <button style={{ padding: "7px 12px", fontSize: 9, fontWeight: 700, color: T.white, background: T.gray950, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
              <Download size={10} /> Google Play
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: T.gray600 }}>
            <Star size={9} fill="#FFD600" stroke="#FFD600" /> 4,6 · +37 mil avaliações
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 14 — News (3 cards com thumbnail) ═══ */}
      <section style={{ ...sectionPad, background: T.white }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15, color: T.gray950, margin: 0 }}>Revivaz em foco</h2>
            <p style={{ fontSize: 9, color: T.gray600, margin: "2px 0 0" }}>Principais acontecimentos e conteúdos.</p>
          </div>
          <button style={{ padding: "6px 12px", fontSize: 9, fontWeight: 700, color: T.teal700, background: T.teal050, border: `1px solid ${T.teal100}`, borderRadius: 8, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 3 }}>
            Veja tudo <ArrowRight size={10} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {NEWS.map(n => (
            <div key={n.title} style={{ flex: 1, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.gray200}`, background: T.gray050 }}>
              <img src={n.img} alt={n.title} style={{ width: "100%", height: 90, objectFit: "cover", objectPosition: "top center", display: "block" }} />
              <div style={{ padding: "7px 8px" }}>
                <div style={{ fontSize: 8, color: T.teal700, fontWeight: 700, marginBottom: 2 }}>{n.cat}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: T.gray950, lineHeight: 1.3, marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 7, color: T.gray600 }}>{n.date}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BLOCO 15 — Footer ═══ */}
      <footer style={{ background: T.gray950, color: "rgba(255,255,255,.65)", padding: "22px 16px 14px", fontSize: 9 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 18, marginBottom: 18 }}>
          {/* brand */}
          <div>
            <div style={{ fontWeight: 900, color: T.teal300, fontSize: 14, marginBottom: 6, fontFamily: "'Nunito',sans-serif" }}>Revivaz</div>
            <p style={{ lineHeight: 1.5, marginBottom: 8 }}>Atendimento solidário em saúde mental. Psiquiatras e psicólogos conectados a quem mais precisa.</p>
            <div style={{ display: "flex", gap: 6 }}>
              {[Instagram, Linkedin, Newspaper].map((Ic, i) => (
                <div key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Ic size={11} color="rgba(255,255,255,.6)" />
                </div>
              ))}
            </div>
          </div>
          {/* links */}
          <div>
            <div style={{ fontWeight: 700, color: T.white, marginBottom: 6 }}>Institucional</div>
            {["Sobre", "Especialidades", "Para profissionais", "Privacidade"].map(l => (
              <div key={l} style={{ marginBottom: 3 }}>
                <button style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: 9 }}>{l}</button>
              </div>
            ))}
          </div>
          {/* contact */}
          <div>
            <div style={{ fontWeight: 700, color: T.white, marginBottom: 6 }}>Contato</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <Mail size={9} color="rgba(255,255,255,.5)" /> contato@revivaz.com.br
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
              <Phone size={9} color="rgba(255,255,255,.5)" /> (11) 4002-8922
            </div>
            <button style={{ padding: "6px 12px", fontSize: 8, fontWeight: 700, color: T.white, background: T.green500, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 3 }}>
              <MessageCircle size={9} /> WhatsApp
            </button>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 10, fontSize: 8, display: "flex", justifyContent: "space-between" }}>
          <span>© 2025 Revivaz. Atendimento solidário em saúde mental.</span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Heart size={8} fill={T.teal500} stroke={T.teal500} /> Feito com amor</span>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════
          MODAL — Agendamento (sem login)
         ═══════════════════════════════════════════════════════════ */}
      {modalAgendar && (
        <div onClick={e => e.target === e.currentTarget && setModalAgendar(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.white, borderRadius: 18, maxWidth: 360, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 12px 48px rgba(0,0,0,.25)" }}>
            {/* header */}
            <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.gray200}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15, color: T.gray950, margin: 0 }}>Agendar consulta</h3>
              <button onClick={() => setModalAgendar(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <X size={16} color={T.gray600} />
              </button>
            </div>

            <div style={{ padding: 18 }}>
              {!agendarOk ? (<>
                {/* tipo */}
                <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: T.gray600, marginBottom: 4 }}>Tipo de consulta</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {([["presencial", "Presencial", MapPin], ["online", "Online", Video]] as const).map(([val, lbl, Ic]) => (
                    <button key={val} onClick={() => setForm({ ...form, tipo: val as "presencial"|"online" })} style={{ flex: 1, padding: "10px", fontSize: 10, fontWeight: 700, border: `2px solid ${form.tipo === val ? T.teal700 : T.gray200}`, background: form.tipo === val ? T.teal050 : T.white, color: form.tipo === val ? T.teal700 : T.gray600, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Ic size={13} /> {lbl}
                    </button>
                  ))}
                </div>

                {/* especialidade */}
                <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: T.gray600, marginBottom: 4 }}>Especialidade</label>
                <div style={{ position: "relative", marginBottom: 14 }}>
                  <Brain size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                  <select value={form.esp} onChange={e => setForm({ ...form, esp: e.target.value as any })} style={{ ...inputBase, appearance: "none" }}>
                    <option value="psiquiatria">Psiquiatria</option>
                    <option value="psicologia">Psicologia</option>
                  </select>
                </div>

                {/* data + hora */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: T.gray600, marginBottom: 4 }}>Data</label>
                    <div style={{ position: "relative" }}>
                      <Calendar size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                      <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} style={inputBase} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: T.gray600, marginBottom: 4 }}>Horário</label>
                    <div style={{ position: "relative" }}>
                      <Clock size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                      <input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} style={inputBase} />
                    </div>
                  </div>
                </div>

                {/* nome */}
                <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: T.gray600, marginBottom: 4 }}>Nome completo</label>
                <div style={{ position: "relative", marginBottom: 14 }}>
                  <User size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                  <input placeholder="Seu nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={inputBase} />
                </div>

                {/* telefone */}
                <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: T.gray600, marginBottom: 4 }}>Telefone (WhatsApp)</label>
                <div style={{ position: "relative", marginBottom: 14 }}>
                  <Phone size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                  <input type="tel" placeholder="(11) 99999-9999" value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} style={inputBase} />
                </div>

                {/* email */}
                <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: T.gray600, marginBottom: 4 }}>E-mail</label>
                <div style={{ position: "relative", marginBottom: 18 }}>
                  <Mail size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.gray600 }} />
                  <input type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputBase} />
                </div>

                <button onClick={() => setAgendarOk(true)} style={{ width: "100%", padding: "12px", fontSize: 12, fontWeight: 700, color: T.white, background: `linear-gradient(135deg,${T.teal700},${T.teal500})`, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(0,77,92,.3)" }}>
                  Confirmar agendamento
                </button>
              </>) : (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.green500, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle size={26} color={T.white} />
                  </div>
                  <h4 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 16, color: T.green700, marginBottom: 6 }}>Agendamento realizado!</h4>
                  <p style={{ fontSize: 10, color: T.gray600, marginBottom: 4 }}>Você receberá a confirmação por WhatsApp.</p>
                  <p style={{ fontSize: 9, color: T.gray600, marginBottom: 16 }}>Consulte seu e-mail para mais detalhes.</p>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button onClick={() => setModalAgendar(false)} style={{ padding: "9px 18px", fontSize: 10, fontWeight: 700, color: T.white, background: T.teal700, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
                      Fechar
                    </button>
                    <button onClick={() => { setModalReceita(true); setReceitaOk(false); }} style={{ padding: "9px 18px", fontSize: 10, fontWeight: 700, color: T.white, background: T.green500, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                      <Send size={10} /> Enviar receita
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
          <div onClick={e => e.stopPropagation()} style={{ background: T.white, borderRadius: 18, maxWidth: 320, width: "100%", padding: 20, boxShadow: "0 12px 48px rgba(0,0,0,.25)" }}>
            {!receitaOk ? (<>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.green500, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MessageCircle size={16} color={T.white} />
                </div>
                <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14, color: T.gray950, margin: 0 }}>Enviar receita</h3>
              </div>
              <p style={{ fontSize: 10, color: T.gray600, lineHeight: 1.5, marginBottom: 14 }}>
                O profissional envia a receita médica digital diretamente para o WhatsApp informado no agendamento.
              </p>
              <button onClick={() => { setReceitaOk(true); setTimeout(() => { setModalReceita(false); setReceitaOk(false); }, 2200); }} style={{ width: "100%", padding: "11px", fontSize: 11, fontWeight: 700, color: T.white, background: T.green500, border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <Send size={12} /> Simular envio por WhatsApp
              </button>
            </>) : (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <CheckCircle size={32} color={T.green500} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: T.green700 }}>Receita enviada por WhatsApp!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
