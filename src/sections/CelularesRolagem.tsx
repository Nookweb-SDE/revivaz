/* Bloco "Sua conta Revivaz": celulares 3D (three.js) que giram de perfil para
   de frente e abrem em leque conforme a rolagem, no estilo do vídeo que o dono
   mandou em 18/10/2026. A cena (celulares3d/cena.ts) só é baixada quando o
   bloco chega perto da tela. Com movimento reduzido mostra o leque aberto.
   No celular não roda 3D: são 96 quadros da mesma cena em pé (cel-m/),
   gravados com o modo "vertical", e o dedo na rolagem escolhe o quadro. */
import { useEffect, useId, useRef, useState } from "react";
import { GridPulse } from "../components/ui/grid-pulse";
import { progressoRolagem } from "../lib/celulares";
import type { Cena } from "./celulares3d/cena";

type Bp = "mobile" | "tablet" | "desktop";

const T = { navy: "#0B1D3A", texto: "#39434D", fundo: "#FFFFFF" };

const QUADROS = 96, QW = 720, QH = 960;
const quadroUrl = (k: number) => `/revivaz/cel-m/f${String(k).padStart(3, "0")}.avif`;
// primeiro um a cada 4 (a animação já anda inteira), depois preenche os buracos
const ORDEM = [4, 2, 1].flatMap((passo, n, l) => Array.from({ length: QUADROS }, (_, k) => k).filter(k => k % passo === 0 && (n === 0 || k % l[n - 1] !== 0)));
/* Halo da cor do fundo em volta das letras, para as células acesas não encostarem nelas. */
const GUARDA = `0 0 6px ${T.fundo}, 0 0 14px ${T.fundo}, 0 0 30px ${T.fundo}`;

/** Celular de vidro inclinado, em leve 3D, do badge "Abrir minha conta". */
function IconeCelular() {
  const id = useId().replace(/:/g, "");
  return (
    <svg className="cr-ic" viewBox="0 0 34 34" width={34} height={34} aria-hidden="true">
      <defs>
        <linearGradient id={`c${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8EEFFB" /><stop offset="1" stopColor="#0098AE" /></linearGradient>
        <linearGradient id={`t${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#16507A" /><stop offset="1" stopColor="#0B1D3A" /></linearGradient>
        <filter id={`s${id}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4" /></filter>
      </defs>
      <ellipse cx="17" cy="30.5" rx="8" ry="1.8" fill="rgba(0,0,0,.45)" filter={`url(#s${id})`} />
      <g transform="rotate(-14 17 16)">
        <rect x="10.2" y="3.4" width="14.6" height="25" rx="3.8" fill="#00687A" />
        <rect x="9" y="2.4" width="14.6" height="25" rx="3.8" fill={`url(#c${id})`} />
        <rect x="10.4" y="4.6" width="11.8" height="20.6" rx="2.4" fill={`url(#t${id})`} />
        <path d="M10.4 13 L22.2 6.2 L22.2 9.6 L10.4 16.6Z" fill="rgba(255,255,255,.28)" />
        <rect x="14.2" y="5.6" width="4.2" height="1.3" rx=".65" fill="#04080f" />
        <rect x="9.4" y="2.9" width="13.8" height="24" rx="3.5" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth=".6" />
      </g>
    </svg>
  );
}

/* Vidro fosco com borda em degradê turquesa → magenta (a borda é um ::before
   recortado por máscara, então precisa de CSS de verdade). */
const CSS_BADGE = `.cr-badge{position:relative;display:inline-flex;align-items:center;gap:10px;padding:7px 20px 7px 8px;min-height:48px;border-radius:9999px;font-weight:800;font-size:15px;color:#0B1D3A;text-decoration:none;white-space:nowrap;background:linear-gradient(135deg,rgba(255,255,255,.78),rgba(239,250,252,.55));-webkit-backdrop-filter:blur(16px) saturate(160%);backdrop-filter:blur(16px) saturate(160%);box-shadow:inset 0 1px 0 #fff,0 10px 28px rgba(11,29,58,.14);transition:transform .25s ease}
.cr-badge::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1.5px;background:linear-gradient(120deg,#7FE9F7,#00BFD8 40%,#B4157E);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.cr-badge:hover{transform:translateY(-2px)}
.cr-ic{flex:none;display:block;transition:transform .3s ease}
.cr-badge:hover .cr-ic{transform:rotate(-8deg) scale(1.06)}
.cr-badge:focus-visible{outline:2px solid #007A8C;outline-offset:3px}
@media (prefers-reduced-motion:reduce){.cr-badge,.cr-ic{transition:none}}`;

const ROTULO = "Telas da conta Revivaz: encontros, respiração guiada, humor, consulta individual e ajuda imediata";

export function CelularesRolagem({ bp }: { bp: Bp }) {
  const secao = useRef<HTMLElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const quadros = useRef<HTMLCanvasElement>(null);
  const mobile = bp === "mobile";
  const [parado] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  const [semAvif, setSemAvif] = useState(false);
  const fixo = parado || semAvif;

  useEffect(() => {
    const s = secao.current, c = quadros.current, ctx = c?.getContext("2d");
    if (!mobile || fixo || !s || !c || !ctx) return;
    const ok: boolean[] = Array(QUADROS).fill(false), imgs: HTMLImageElement[] = [];
    let raf = 0, visivel = false, comecou = false, ultimo = -1;

    const desenhar = () => {
      raf = 0;
      const r = s.getBoundingClientRect();
      const alvo = Math.round(progressoRolagem(r.top, r.height, window.innerHeight) * (QUADROS - 1));
      let k = -1;
      for (let d = 0; d < QUADROS && k < 0; d++) k = ok[alvo - d] ? alvo - d : ok[alvo + d] ? alvo + d : -1;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; ultimo = -1; }
      if (k < 0 || k === ultimo || !w || !h) return;
      ultimo = k;
      // cabe inteiro (os 5 celulares sempre aparecem); a borda do quadro é a cor do fundo
      const esc = Math.min(w / QW, h / QH), dw = QW * esc, dh = QH * esc;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(imgs[k], (w - dw) / 2, (h - dh) / 2, dw, dh);
    };
    const pedir = () => { if (visivel && !raf) raf = requestAnimationFrame(desenhar); };
    const carregar = () => {
      comecou = true;
      ORDEM.forEach(k => {
        const im = new Image();
        im.decoding = "async";
        im.src = quadroUrl(k);
        // decode() descompacta fora da rolagem; usar antes disso travava o desenho
        im.decode().then(() => { ok[k] = true; pedir(); }, () => { if (k === 0) setSemAvif(true); }); // sem AVIF: fica a imagem parada
        imgs[k] = im;
      });
    };

    const io = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      if (visivel && !comecou) carregar();
      pedir();
    }, { rootMargin: "800px 0px" });
    io.observe(s);
    const ro = new ResizeObserver(pedir);
    ro.observe(c);
    window.addEventListener("scroll", pedir, { passive: true });
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      window.removeEventListener("scroll", pedir);
      imgs.forEach(im => { if (im) { im.onload = null; im.onerror = null; } });
    };
  }, [mobile, fixo]);

  useEffect(() => {
    const s = secao.current, c = tela.current;
    // celular: vídeo gravado da própria cena, sem baixar three.js nem girar 3D
    if (!s || !c || mobile) return;
    const parado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cena: Cena | null = null, raf = 0, visivel = false, vivo = true, carregando = false, espera = 0, rolouEm = 0;

    const progresso = () => {
      const r = s.getBoundingClientRect();
      return parado ? 1 : progressoRolagem(r.top, r.height, window.innerHeight);
    };
    const loop = (ms: number) => {
      raf = 0;
      if (!cena) return;
      cena.quadro(progresso(), ms / 1000);
      if (visivel && !parado) raf = requestAnimationFrame(loop);
    };
    const carregar = () => {
      if (carregando) return;
      carregando = true;
      Promise.all([import("./celulares3d/cena"), document.fonts?.ready]).then(([m]) => {
        if (!vivo) return;
        try { cena = m.montarCena(c, parado); } catch { return; } // sem WebGL: fica só o texto
        cena.quadro(progresso(), performance.now() / 1000);
        if (visivel && !parado && !raf) raf = requestAnimationFrame(loop);
      });
    };

    // montar a cena trava a página ~0,3 s (luz do ambiente). Faz isso com a
    // rolagem parada, a 3 telas de distância, para não cair no meio do gesto
    const ocioso = () => {
      espera = 0;
      if (carregando || !vivo) return;
      if (performance.now() - rolouEm < 300) { espera = window.setTimeout(ocioso, 300); return; }
      carregar();
    };
    const perto = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { perto.disconnect(); ocioso(); }
    }, { rootMargin: "300% 0px" });
    perto.observe(s);
    const io = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      if (visivel) carregar();
      if (visivel && cena && !parado && !raf) raf = requestAnimationFrame(loop);
    }, { rootMargin: "600px 0px" });
    io.observe(s);
    const ro = new ResizeObserver(() => { cena?.medir(); cena?.quadro(progresso(), performance.now() / 1000); });
    ro.observe(c);
    const rolou = () => { rolouEm = performance.now(); if (parado && cena) cena.quadro(1, 0); };
    window.addEventListener("scroll", rolou, { passive: true });

    return () => {
      vivo = false; cancelAnimationFrame(raf); clearTimeout(espera); perto.disconnect(); io.disconnect(); ro.disconnect();
      window.removeEventListener("scroll", rolou);
      cena?.destruir();
    };
  }, [mobile]);

  const texto = (
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 600, margin: "0 auto", padding: mobile ? "72px 20px 0" : "104px 24px 0", color: T.navy }}>
          <h2 data-grid-avoid style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: mobile ? 28 : 44, lineHeight: 1.05, letterSpacing: "-0.01em", margin: "0 0 12px", textShadow: GUARDA }}>Sua conta Revivaz</h2>
          <p data-grid-avoid style={{ fontSize: mobile ? 15 : 16, lineHeight: 1.6, color: T.texto, margin: "0 auto", maxWidth: 520, textShadow: GUARDA }}>
            {mobile
              ? "Encontros, respiração guiada, humor e ajuda imediata. Pelo navegador, sem instalar nada."
              : "Datas dos encontros, respiração guiada, registro do humor, consulta individual quando precisar e ajuda imediata. Pelo navegador, sem instalar aplicativo."}
          </p>
          <a href="/conta" className="cr-badge" style={{ marginTop: mobile ? 16 : 22 }}>
            <IconeCelular /> Abrir minha conta
          </a>
          <style>{CSS_BADGE}</style>
        </div>
  );

  // celular: o palco fica preso na tela enquanto o dedo rola 300vh e troca os quadros
  if (mobile) return (
    <section ref={secao} aria-label="Sua conta Revivaz" style={{ position: "relative", background: T.fundo, height: fixo ? undefined : "300vh", paddingBottom: fixo ? 32 : 0 }}>
      <div className={fixo ? undefined : "cr-palco"} style={fixo ? { position: "relative" } : { position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* grade só atrás do texto: os quadros têm o fundo gravado e cortariam as linhas */}
        <GridPulse cell={22} ambient={3} style={{ maskImage: "linear-gradient(to bottom, #000 150px, transparent 290px)", WebkitMaskImage: "linear-gradient(to bottom, #000 150px, transparent 290px)" }} />
        {texto}
        {fixo
          ? <img src="/revivaz/cel-m/parado.webp" alt={ROTULO} loading="lazy" style={{ display: "block", width: "100%", aspectRatio: "3 / 4", objectFit: "contain", marginTop: 16 }} />
          : <canvas ref={quadros} role="img" aria-label={ROTULO} style={{ flex: "1 1 auto", minHeight: 0, width: "100%", display: "block", marginTop: 8 }} />}
      </div>
      <style>{`@supports (height:100svh){.cr-palco{height:100svh!important}}`}</style>
    </section>
  );

  return (
    <section ref={secao} aria-label="Sua conta Revivaz" style={{ height: "280vh", position: "relative", background: T.fundo }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        {/* grade que acende onde o mouse passa (Grid Pulse, nas cores do site) */}
        <GridPulse />
        <canvas ref={tela} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
        {texto}
      </div>
    </section>
  );
}
