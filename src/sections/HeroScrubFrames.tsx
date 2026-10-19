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
import { VideoAoVer } from "./VideoAoVer";

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
  // Celular também fica parado: foto em cima e texto embaixo, sem texto por
  // cima do rosto e sem baixar ~1,1 MiB de quadros.
  const estatico = reduzido || semAvif || isMobile;

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
    if (reduzido || isMobile) return;
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
  }, [reduzido, base, isMobile]);

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

  /* Celular: vídeo em pé de tela cheia (mulher no sofá, rosto no terço de
     cima) e o texto centralizado embaixo, sobre o degradê. Nada cobre o rosto. */
  if (isMobile) return (
    <section ref={trackRef} data-hero-track="" className="hm" style={{ position: "relative", height: "100svh", minHeight: 660, background: FUNDO, color: "#fff", overflow: "hidden" }}>
      <VideoAoVer
        src="/revivaz/topo-m.mp4" poster="/revivaz/topo-m-poster.webp" loop preload="auto"
        style={{ ...capa, top: "-24%", height: "124%", objectPosition: "25% 50%", background: FUNDO }}
      />
      <div aria-hidden="true" style={{
        ...capa,
        background: "linear-gradient(180deg,rgba(4,8,15,.5) 0%,transparent 16%,transparent 40%,rgba(4,8,15,.72) 58%,rgba(4,8,15,.96) 78%,#04080f 100%)",
      }} />
      <div className="hm-texto" style={{
        position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 2, textAlign: "center",
        padding: "0 20px calc(26px + env(safe-area-inset-bottom))",
      }}>
        <h1 className="hm-h1" style={{
          fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 36, lineHeight: 1.06,
          letterSpacing: "-0.025em", margin: "0 auto 14px", maxWidth: "12ch", color: "#fff",
        }}>
          Aqui no Vivaz, ninguém fica sozinho
        </h1>
        <p className="hm-p" style={{ fontSize: 17, lineHeight: 1.5, margin: "0 auto 22px", maxWidth: 330, color: "rgba(255,255,255,.86)" }}>
          Psicologia comunitária no Condomínio Vivaz Taboão da Serra: encontros mensais e atendimento por vídeo.
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          <button onClick={openAgendar} className="hm-btn" style={{
            minHeight: 54, borderRadius: 9999, border: "none", cursor: "pointer",
            background: T.mag500, color: "#fff", font: "800 17px 'Nunito',sans-serif",
            boxShadow: "0 8px 24px rgba(180,21,126,.35)",
          }}>
            Quero conversar
          </button>
          <a href="#encontros" className="hm-btn" style={{
            minHeight: 54, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center",
            border: "1.5px solid rgba(255,255,255,.55)", background: "rgba(255,255,255,.08)",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            color: "#fff", font: "800 17px 'Nunito',sans-serif", textDecoration: "none",
          }}>
            {proximo ? `Próximo encontro: ${rotuloData(proximo)}` : "Encontros mensais"}
          </a>
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.78)" }}>
          Precisa de ajuda agora? Ligue{" "}
          <a href="tel:188" style={{ color: "#fff", fontWeight: 900 }}>188</a>, CVV 24h e gratuito
        </p>
      </div>
      <style>{`
        .hm-btn:focus-visible{outline:3px solid ${T.teal300};outline-offset:3px}
        @media (max-height:720px){.hm-h1{font-size:31px!important}.hm-p{font-size:15.5px!important;margin-bottom:18px!important}}
      `}</style>
    </section>
  );

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
        {!isMobile && <div aria-hidden="true" style={{
          ...capa,
          background: "linear-gradient(90deg,rgba(4,8,15,.62) 0%,rgba(4,8,15,.28) 22%,transparent 44%)",
        }} />}
        {/* Véu vertical: escurece sob o header e emenda com a seção seguinte. */}
        {!isMobile && <div aria-hidden="true" style={{
          ...capa,
          background: "linear-gradient(180deg,rgba(4,8,15,.58) 0%,transparent 16%,transparent 74%,rgba(4,8,15,.86) 100%)",
        }} />}
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
          padding: isMobile ? "22px 20px 40px" : "96px 40px 64px",
          maxWidth: 1200, margin: "0 auto", minHeight: isMobile ? 0 : 520,
        }}>
          <div data-hero-texto="" style={{
            flex: "1 1 0", minWidth: 0, maxWidth: isMobile ? "100%" : "56%",
            position: "relative", padding: isMobile ? 0 : "30px 34px",
            margin: isMobile ? 0 : "0 0 0 -34px",
            /* Refletor: escurece SÓ atrás do texto e apaga rápido nas bordas.
               A versão anterior lavava a foto inteira com três gradientes de
               ponta a ponta — passava no contraste e matava a cor da cena. */
            background: isMobile ? "none" :
              "radial-gradient(118% 128% at 20% 50%, rgba(3,7,13,.95) 0%, rgba(3,7,13,.88) 40%, rgba(3,7,13,.52) 66%, transparent 86%)",
            borderRadius: 20,
          }}>
            <h1 style={{
              fontFamily: "'Nunito',sans-serif", fontWeight: 900,
              fontSize: isMobile ? 27 : 52, lineHeight: 1.1,
              margin: "0 0 8px", letterSpacing: "-0.02em",
              background: `linear-gradient(90deg, ${T.teal300} 0%, ${T.teal100} 62%, ${T.teal300} 100%)`,
              WebkitBackgroundClip: "text", backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            } as React.CSSProperties}>
              Aqui no Vivaz Taboão da Serra, ninguém fica sozinho
            </h1>

            <div style={{
              fontSize: isMobile ? 12 : 14, fontWeight: 700, marginBottom: isMobile ? 10 : 16, minHeight: isMobile ? 18 : 22,
              color: T.teal300, letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              {heroLines[heroIdx]}
            </div>

            <p style={{
              fontSize: isMobile ? 15 : 14, opacity: 0.92, lineHeight: 1.6, marginBottom: isMobile ? 20 : 24,
              maxWidth: isMobile ? "100%" : "92%", color: "rgba(214,244,248,0.92)",
            }}>
              {isMobile
                ? "Encontros mensais no condomínio e atendimento por vídeo com profissionais voluntários."
                : "Projeto de psicologia comunitária do Condomínio Vivaz Taboão da Serra. Encontros mensais para adolescentes, mulheres e homens, e atendimento por vídeo com profissionais voluntários."}
            </p>

            <div style={{ display: "flex", gap: isMobile ? 12 : 16, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={openAgendar} style={{
                padding: "14px 24px", fontWeight: 700, color: "#FFFFFF",
                background: `linear-gradient(90deg, ${T.mag500}, ${T.mag700})`,
                border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 20px rgba(150,0,100,.35)", minHeight: 48,
                flex: isMobile ? "1 1 100%" : undefined, fontSize: isMobile ? 16 : 14,
              }}>
                Quero conversar
              </button>
              {/* Leva à seção dos encontros mensais da psicologia comunitária. */}
              <a href="#encontros" style={{
                padding: "14px 24px", fontWeight: 700, fontSize: 14, color: T.teal300,
                background: "transparent", border: "2px solid rgba(0,191,216,0.5)",
                borderRadius: 12, cursor: "pointer", fontFamily: "inherit", minHeight: 48,
                textDecoration: "none", display: "inline-flex", alignItems: "center",
                justifyContent: "center", flex: isMobile ? "1 1 100%" : undefined,
                boxSizing: "border-box",
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
