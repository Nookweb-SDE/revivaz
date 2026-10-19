/* Bloco "Sua conta Revivaz": celulares 3D (three.js) que giram de perfil para
   de frente e abrem em leque conforme a rolagem, no estilo do vídeo que o dono
   mandou em 18/10/2026. A cena (celulares3d/cena.ts) só é baixada quando o
   bloco chega perto da tela. Com movimento reduzido mostra o leque aberto. */
import { useEffect, useRef } from "react";
import { Smartphone } from "lucide-react";
import { progressoRolagem } from "../lib/celulares";
import type { Cena } from "./celulares3d/cena";

type Bp = "mobile" | "tablet" | "desktop";

const T = { teal300: "#00BFD8", navy: "#0B1D3A", fundo: "#061226", white: "#FFFFFF" };

export function CelularesRolagem({ bp }: { bp: Bp }) {
  const secao = useRef<HTMLElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const mobile = bp === "mobile";

  useEffect(() => {
    const s = secao.current, c = tela.current;
    if (!s || !c) return;
    const parado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cena: Cena | null = null, raf = 0, visivel = false, vivo = true, carregando = false;

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

    const io = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      if (visivel) carregar();
      if (visivel && cena && !parado && !raf) raf = requestAnimationFrame(loop);
    }, { rootMargin: "600px 0px" });
    io.observe(s);
    const ro = new ResizeObserver(() => { cena?.medir(); cena?.quadro(progresso(), performance.now() / 1000); });
    ro.observe(c);
    const rolou = () => { if (parado && cena) cena.quadro(1, 0); };
    window.addEventListener("scroll", rolou, { passive: true });

    return () => {
      vivo = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      window.removeEventListener("scroll", rolou);
      cena?.destruir();
    };
  }, []);

  return (
    <section ref={secao} aria-label="Sua conta Revivaz" style={{ height: mobile ? "230vh" : "280vh", position: "relative", background: T.fundo }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        {/* luz de palco: halo turquesa atrás, reflexo no chão e vinheta */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 55% 45% at 50% 58%, rgba(0,191,216,.22), transparent 70%), radial-gradient(ellipse 35% 30% at 72% 70%, rgba(180,21,126,.14), transparent 70%), radial-gradient(ellipse 60% 12% at 50% 93%, rgba(0,191,216,.18), transparent 70%), linear-gradient(180deg, ${T.fundo} 0%, ${T.navy} 70%, ${T.fundo} 100%)` }} />
        <canvas ref={tela} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 600, margin: "0 auto", padding: mobile ? "88px 16px 0" : "104px 24px 0", color: T.white }}>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: mobile ? 28 : 44, lineHeight: 1.05, letterSpacing: "-0.01em", margin: "0 0 12px" }}>Sua conta Revivaz</h2>
          <p style={{ fontSize: mobile ? 14 : 16, lineHeight: 1.6, color: "rgba(255,255,255,.78)", margin: "0 auto", maxWidth: 520 }}>
            Datas dos encontros, respiração guiada, registro do humor, consulta individual quando precisar e ajuda imediata. Pelo navegador, sem instalar aplicativo.
          </p>
          <a href="/conta" style={{ marginTop: mobile ? 16 : 22, padding: "11px 22px", fontSize: 14.5, fontWeight: 800, color: T.navy, background: T.white, borderRadius: 9999, display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 10px 30px rgba(0,0,0,.35)" }}>
            <Smartphone size={17} /> Abrir minha conta
          </a>
        </div>
      </div>
    </section>
  );
}
