/* Bloco "Sua conta Revivaz": celulares 3D (three.js) que giram de perfil para
   de frente e abrem em leque conforme a rolagem, no estilo do vídeo que o dono
   mandou em 18/10/2026. A cena (celulares3d/cena.ts) só é baixada quando o
   bloco chega perto da tela. Com movimento reduzido mostra o leque aberto.
   No celular não roda 3D: são 96 quadros da mesma cena em pé (cel-m/),
   gravados com o modo "vertical", e o dedo na rolagem escolhe o quadro. */
import { useEffect, useRef, useState } from "react";
import { Smartphone } from "lucide-react";
import { progressoRolagem } from "../lib/celulares";
import type { Cena } from "./celulares3d/cena";

type Bp = "mobile" | "tablet" | "desktop";

const T = { teal300: "#00BFD8", navy: "#0B1D3A", fundo: "#061226", white: "#FFFFFF" };

const QUADROS = 96, QW = 720, QH = 960;
const quadroUrl = (k: number) => `/revivaz/cel-m/f${String(k).padStart(3, "0")}.avif`;
// primeiro um a cada 4 (a animação já anda inteira), depois preenche os buracos
const ORDEM = [4, 2, 1].flatMap((passo, n, l) => Array.from({ length: QUADROS }, (_, k) => k).filter(k => k % passo === 0 && (n === 0 || k % l[n - 1] !== 0)));
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
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 600, margin: "0 auto", padding: mobile ? "72px 20px 0" : "104px 24px 0", color: T.white }}>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: mobile ? 28 : 44, lineHeight: 1.05, letterSpacing: "-0.01em", margin: "0 0 12px" }}>Sua conta Revivaz</h2>
          <p style={{ fontSize: mobile ? 15 : 16, lineHeight: 1.6, color: "rgba(255,255,255,.78)", margin: "0 auto", maxWidth: 520 }}>
            {mobile
              ? "Encontros, respiração guiada, humor e ajuda imediata. Pelo navegador, sem instalar nada."
              : "Datas dos encontros, respiração guiada, registro do humor, consulta individual quando precisar e ajuda imediata. Pelo navegador, sem instalar aplicativo."}
          </p>
          <a href="/conta" style={{ marginTop: mobile ? 16 : 22, padding: "11px 22px", fontSize: 14.5, fontWeight: 800, color: T.navy, background: T.white, borderRadius: 9999, display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 10px 30px rgba(0,0,0,.35)" }}>
            <Smartphone size={17} /> Abrir minha conta
          </a>
        </div>
  );

  // celular: o palco fica preso na tela enquanto o dedo rola 300vh e troca os quadros
  if (mobile) return (
    <section ref={secao} aria-label="Sua conta Revivaz" style={{ position: "relative", background: T.fundo, height: fixo ? undefined : "300vh", paddingBottom: fixo ? 32 : 0 }}>
      <div className={fixo ? undefined : "cr-palco"} style={fixo ? undefined : { position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
        {/* luz de palco: halo turquesa atrás, reflexo no chão e vinheta */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 55% 45% at 50% 58%, rgba(0,191,216,.22), transparent 70%), radial-gradient(ellipse 35% 30% at 72% 70%, rgba(180,21,126,.14), transparent 70%), radial-gradient(ellipse 60% 12% at 50% 93%, rgba(0,191,216,.18), transparent 70%), linear-gradient(180deg, ${T.fundo} 0%, ${T.navy} 70%, ${T.fundo} 100%)` }} />
        <canvas ref={tela} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
        {texto}
      </div>
    </section>
  );
}
