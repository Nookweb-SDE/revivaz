/**
 * Hero Revivaz — sequência de frames dirigida pelo scroll.
 *
 * O visitante não assiste a uma animação: ele a conduz. O progresso do trilho
 * escolhe qual dos 171 quadros aparece no canvas, e rolar de volta desfaz o
 * movimento. Os quadros saem do Remotion (ver remotion/README.md) em AVIF.
 *
 * Três caminhos, de propósito:
 *   - desktop        → scrub no canvas, quadros de 1440 px
 *   - mobile         → scrub no canvas, recorte em pé de 432 px (~1,1 MiB);
 *                      o dono pediu em 18/10/2026 que o topo andasse no celular
 *   - reduced-motion → poster estático (movimento não-consentido dispara náusea,
 *                      e parte do público da Revivaz convive exatamente com isso)
 *
 * O poster fica SEMPRE embaixo do canvas. É ele o LCP, e é ele que aparece
 * enquanto os frames carregam ou se o navegador não decodifica AVIF — em vez
 * do retângulo preto que um canvas vazio seria.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { frameIndex, framePaths } from "../lib/frameScrub";
import { proximoEncontro, rotuloData } from "../lib/encontros";

gsap.registerPlugin(ScrollTrigger);

const T = {
  teal500: "#00A8BF", teal300: "#00BFD8", teal100: "#D6F4F8",
  mag700: "#960064", mag500: "#B4157E",
} as const;

const BASE = "/revivaz/hero";
// Celular: recorte em pé de 432 px (~1,1 MiB), gerado por publish-frames-mobile.sh.
const BASE_MOBILE = "/revivaz/hero-m";
const EXT = "avif";
const TOTAL = 171;
const FUNDO = "#04080f";

type BP = "mobile" | "tablet" | "desktop";

const ETAPAS = [
  { titulo: "Escuta", texto: "Espaço seguro para falar, no seu tempo." },
  { titulo: "Vínculo", texto: "Conhecer quem mora ao lado fortalece a convivência." },
  { titulo: "Convivência", texto: "Encontros mensais: 18h adolescentes, 19h mulheres, 20h homens." },
];

export default function HeroScrubFrames({
  heroLines, heroIdx, openAgendar, bp = "desktop",
}: {
  heroLines: string[]; heroIdx: number; openAgendar: () => void; bp?: BP;
}) {
  const proximo = proximoEncontro(new Date());
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgsRef = useRef<HTMLImageElement[]>([]);
  const [pronto, setPronto] = useState(false);
  const [semAvif, setSemAvif] = useState(false);
  const [reduzido, setReduzido] = useState(false);

  const isMobile = bp === "mobile";
  const base = isMobile ? BASE_MOBILE : BASE;
  // Uma só decisão sobre qual caminho seguir, para os três lugares que a consultam.
  const estatico = reduzido || semAvif;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduzido(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* Pré-carrega TODOS os frames antes de armar o trigger: sem isto o scrub
     pula os quadros que ainda não baixaram. Não roda no caminho estático —
     ali os frames nunca seriam desenhados, e baixá-los seria dado jogado fora. */
  useEffect(() => {
    if (reduzido) return;
    let vivo = true;
    setPronto(false);
    const paths = framePaths(base, TOTAL, EXT);
    let resolvidos = 0;
    const imgs = paths.map((src, i) => {
      const im = new Image();
      const conta = () => {
        if (!vivo) return;
        resolvidos++;
        if (resolvidos === paths.length) setPronto(true);
      };
      im.onload = conta;
      im.onerror = () => {
        // Falhar no primeiro quadro significa que o formato não passa neste
        // navegador (AVIF só existe no Safari a partir do 16.4). Cai no poster
        // em vez de deixar o canvas vazio.
        if (i === 0 && vivo) setSemAvif(true);
        conta();
      };
      im.src = src;
      return im;
    });
    imgsRef.current = imgs;
    return () => { vivo = false; };
  }, [reduzido, base]);

  const desenhar = (i: number) => {
    const cv = canvasRef.current;
    const im = imgsRef.current[i];
    if (!cv || !im || !im.complete || !im.naturalWidth) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;
    if (cv.width !== im.naturalWidth) {
      cv.width = im.naturalWidth;
      cv.height = im.naturalHeight;
    }
    ctx.drawImage(im, 0, 0, cv.width, cv.height);
  };

  useLayoutEffect(() => {
    if (estatico || !pronto) return;
    const ctx = gsap.context(() => {
      const st = { t: 0 };
      gsap.to(st, {
        t: 1, ease: "none",
        scrollTrigger: {
          trigger: trackRef.current, start: "top top", end: "bottom bottom", scrub: 0.5,
        },
        onUpdate: () => desenhar(frameIndex(st.t, TOTAL)),
      });
      gsap.to('[data-etapa-scrim]', {
        opacity: 1, ease: "none",
        scrollTrigger: {
          trigger: trackRef.current, start: "18% top", end: "30% top", scrub: true,
        },
      });
      // No celular o bloco de texto cobre metade da tela: sai logo no começo
      // da rolagem para o filme aparecer, e as etapas entram como legenda.
      if (isMobile) {
        gsap.to("[data-hero-texto]", {
          autoAlpha: 0, y: -16, ease: "none",
          scrollTrigger: { trigger: trackRef.current, start: "6% top", end: "16% top", scrub: true },
        });
      }
      if (isMobile) {
        // legenda: uma etapa por vez, no mesmo lugar (empilhadas no grid)
        const tl = gsap.timeline({
          scrollTrigger: { trigger: trackRef.current, start: "20% top", end: "88% top", scrub: true },
        });
        ETAPAS.forEach((_, i) => {
          tl.to(`[data-etapa="${i}"]`, { opacity: 1, y: 0, ease: "none", duration: 1 });
          if (i < ETAPAS.length - 1) tl.to(`[data-etapa="${i}"]`, { opacity: 0, y: -10, ease: "none", duration: 1 }, "+=1.5");
        });
      } else ETAPAS.forEach((_, i) => {
        gsap.to(`[data-etapa="${i}"]`, {
          opacity: 1, y: 0, ease: "none",
          scrollTrigger: {
            trigger: trackRef.current,
            start: `${20 + i * 22}% top`, end: `${32 + i * 22}% top`, scrub: true,
          },
        });
      });
      desenhar(0);
    }, trackRef);
    // Sem o revert sobram ScrollTriggers órfãos disparando depois de trocar de rota.
    return () => ctx.revert();
  }, [pronto, estatico, isMobile]);

  const alturaTrilho = estatico ? "auto" : "380vh";
  const capa: React.CSSProperties = {
    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
  };

  return (
    <section ref={trackRef} data-hero-track="" style={{ position: "relative", height: alturaTrilho, background: FUNDO }}>
      <div style={{
        position: estatico ? "relative" : "sticky",
        top: 0,
        // svh: no celular a barra do navegador encolhe e estica a tela; com
        // vh o quadro pulava a cada rolagem.
        height: estatico ? "auto" : isMobile ? "100svh" : "100vh",
        minHeight: isMobile ? 360 : 520,
        overflow: "hidden",
        color: "#fff",
      }}>
        {/* Poster: LCP e piso visual. Fica sob o canvas o tempo todo. */}
        <img
          src={`${base}/poster.webp`} alt="" aria-hidden="true"
          {...{ fetchpriority: "high" }} decoding="async"
          style={capa}
        />

        {!estatico && (
          <canvas
            ref={canvasRef} aria-hidden="true" data-hero-canvas=""
            style={{
              ...capa,
              opacity: pronto ? 1 : 0,
              transition: "opacity .4s ease",
            }}
          />
        )}

        {/* Véu horizontal: é ele que garante o contraste do texto sobre
            qualquer quadro, em vez de depender do acaso do frame. */}
        <div aria-hidden="true" style={{
          ...capa,
          background: "linear-gradient(90deg,rgba(4,8,15,.62) 0%,rgba(4,8,15,.28) 22%,transparent 44%)",
        }} />
        {/* Véu vertical: escurece sob o header e emenda com a seção seguinte. */}
        <div aria-hidden="true" style={{
          ...capa,
          background: "linear-gradient(180deg,rgba(4,8,15,.58) 0%,transparent 16%,transparent 74%,rgba(4,8,15,.86) 100%)",
        }} />
        {/* Véu da direita: a coluna de etapas cai fora do véu horizontal, e
            medido contra o quadro mais claro (f052) o texto de 13 px ficava
            em 3,7:1 — abaixo dos 4,5:1 que a WCAG exige para texto normal. */}
        {!isMobile && (
          <div aria-hidden="true" style={{
            ...capa,
            background: "linear-gradient(270deg,rgba(4,8,15,.72) 0%,rgba(4,8,15,.34) 12%,transparent 26%)",
          }} />
        )}

        <div style={{
          position: "relative", zIndex: 2, display: "flex", alignItems: "center",
          padding: isMobile ? "72px 16px 40px" : "96px 40px 64px",
          maxWidth: 1200, margin: "0 auto", minHeight: isMobile ? 360 : 520,
        }}>
          <div data-hero-texto="" style={{
            flex: "1 1 0", minWidth: 0, maxWidth: isMobile ? "100%" : "56%",
            position: "relative", padding: isMobile ? "20px 18px" : "30px 34px",
            margin: isMobile ? "0 -4px" : "0 0 0 -34px",
            /* Refletor: escurece SÓ atrás do texto e apaga rápido nas bordas.
               A versão anterior lavava a foto inteira com três gradientes de
               ponta a ponta — passava no contraste e matava a cor da cena. */
            background:
              "radial-gradient(118% 128% at 20% 50%, rgba(3,7,13,.95) 0%, rgba(3,7,13,.88) 40%, rgba(3,7,13,.52) 66%, transparent 86%)",
            borderRadius: 20,
          }}>
            <h1 style={{
              fontFamily: "'Nunito',sans-serif", fontWeight: 900,
              fontSize: isMobile ? 30 : 52, lineHeight: 1.1,
              margin: "0 0 8px", letterSpacing: "-0.02em",
              background: `linear-gradient(90deg, ${T.teal300} 0%, ${T.teal100} 62%, ${T.teal300} 100%)`,
              WebkitBackgroundClip: "text", backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            } as React.CSSProperties}>
              Aqui no Vivaz Taboão da Serra, ninguém fica sozinho
            </h1>

            <div style={{
              fontSize: 14, fontWeight: 700, marginBottom: 16, minHeight: 22,
              color: T.teal300, letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              {heroLines[heroIdx]}
            </div>

            <p style={{
              fontSize: 14, opacity: 0.92, lineHeight: 1.65, marginBottom: 24,
              maxWidth: "92%", color: "rgba(214,244,248,0.92)",
            }}>
              Projeto de psicologia comunitária do Condomínio Vivaz Taboão da Serra. Encontros mensais para
              adolescentes, mulheres e homens, e atendimento por vídeo com profissionais voluntários.
            </p>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={openAgendar} style={{
                padding: "14px 24px", fontWeight: 700, fontSize: 14, color: "#FFFFFF",
                background: `linear-gradient(90deg, ${T.mag500}, ${T.mag700})`,
                border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 20px rgba(150,0,100,.35)", minHeight: 48,
              }}>
                Quero conversar
              </button>
              {/* Leva à seção dos encontros mensais da psicologia comunitária. */}
              <a href="#encontros" style={{
                padding: "14px 24px", fontWeight: 700, fontSize: 14, color: T.teal300,
                background: "transparent", border: "2px solid rgba(0,191,216,0.5)",
                borderRadius: 12, cursor: "pointer", fontFamily: "inherit", minHeight: 48,
                textDecoration: "none", display: "inline-flex", alignItems: "center",
                justifyContent: "center",
              }}>
                {proximo ? `Próximo encontro: ${rotuloData(proximo)}` : "Encontros mensais"}
              </a>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24 }}>
              <span style={{ fontSize: 12, color: "rgba(214,244,248,0.9)", fontWeight: 600 }}>
                Precisa de ajuda agora?
              </span>
              <a href="tel:188" style={{
                background: "#fff", color: T.mag700, borderRadius: 8, padding: "2px 9px",
                fontSize: 12, fontWeight: 800, textDecoration: "none",
              }}>188</a>
              <span style={{ fontSize: 12, color: "rgba(214,244,248,0.9)", fontWeight: 600 }}>
                CVV, 24h, ligação gratuita
              </span>
            </div>
          </div>
        </div>

        {(!isMobile || !estatico) && (
          <div data-etapa-scrim="" style={{
            position: "absolute", zIndex: 3, borderRadius: 20,
            /* celular: legenda embaixo, acima do botão flutuante de conversa */
            ...(isMobile
              ? { left: 16, right: 16, bottom: 96, display: "grid", textAlign: "left", padding: "20px 20px" }
              : { display: "flex", flexDirection: "column", right: 44, top: "50%", transform: "translateY(-50%)", gap: 20, textAlign: "right", maxWidth: 300, padding: "26px 26px 26px 34px" }),
            /* Nasce invisível: uma caixa escura sozinha, antes de qualquer
               texto entrar, lia como defeito na tela. Entra junto com a
               primeira etapa. */
            opacity: estatico ? 1 : 0,
            /* mesmo princípio do texto: refletor colado no conteúdo, não
               gradiente de ponta a ponta lavando a cena. */
            background: `radial-gradient(126% 132% at ${isMobile ? "30%" : "82%"} 50%, rgba(3,7,13,.94) 0%, rgba(3,7,13,.86) 42%, rgba(3,7,13,.48) 68%, transparent 88%)`,
          }}>
            {ETAPAS.map((e, i) => (
              <div
                key={e.titulo} data-etapa={i}
                style={{
                  gridArea: isMobile ? "1 / 1" : undefined,
                  opacity: estatico ? 1 : 0,
                  transform: estatico ? "none" : "translateY(14px)",
                }}
              >
                <b style={{
                  display: "block", fontSize: 13, fontWeight: 800, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: T.teal300, marginBottom: 4,
                }}>{e.titulo}</b>
                <span style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(214,244,248,0.75)" }}>
                  {e.texto}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
