/**
 * Hero Revivaz — sequência de frames dirigida pelo scroll.
 *
 * O visitante não assiste a uma animação: ele a conduz. O progresso do trilho
 * escolhe qual dos 171 quadros aparece no canvas, e rolar de volta desfaz o
 * movimento. Os quadros saem do Remotion (ver remotion/README.md) em AVIF.
 *
 * Três caminhos, de propósito:
 *   - desktop        → scrub no canvas
 *   - mobile         → poster estático (scrub em touch é impreciso e o download não paga)
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

gsap.registerPlugin(ScrollTrigger);

const T = {
  teal500: "#00A8BF", teal300: "#00BFD8", teal100: "#D6F4F8",
} as const;

const BASE = "/revivaz/hero";
const EXT = "avif";
const TOTAL = 171;
const FUNDO = "#04080f";

type BP = "mobile" | "tablet" | "desktop";

const ETAPAS = [
  { titulo: "Acolhimento", texto: "Você não precisa esperar melhorar sozinho para pedir ajuda." },
  { titulo: "Consulta por vídeo", texto: "Da sua poltrona, com um profissional que combina com você." },
  { titulo: "Receita digital", texto: "Direto no seu celular, logo depois da consulta." },
];

export default function HeroScrubFrames({
  heroLines, heroIdx, openAgendar, bp = "desktop",
}: {
  heroLines: string[]; heroIdx: number; openAgendar: () => void; bp?: BP;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgsRef = useRef<HTMLImageElement[]>([]);
  const [pronto, setPronto] = useState(false);
  const [semAvif, setSemAvif] = useState(false);
  const [reduzido, setReduzido] = useState(false);

  const isMobile = bp === "mobile";
  // Uma só decisão sobre qual caminho seguir, para os três lugares que a consultam.
  const estatico = reduzido || isMobile || semAvif;

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
    const paths = framePaths(BASE, TOTAL, EXT);
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
  }, [reduzido, isMobile]);

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
      ETAPAS.forEach((_, i) => {
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
  }, [pronto, estatico]);

  const alturaTrilho = estatico ? "auto" : "380vh";
  const capa: React.CSSProperties = {
    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
  };

  return (
    <section ref={trackRef} data-hero-track="" style={{ position: "relative", height: alturaTrilho, background: FUNDO }}>
      <div style={{
        position: estatico ? "relative" : "sticky",
        top: 0,
        height: estatico ? "auto" : "100vh",
        minHeight: isMobile ? 360 : 520,
        overflow: "hidden",
        color: "#fff",
      }}>
        {/* Poster: LCP e piso visual. Fica sob o canvas o tempo todo. */}
        <img
          src={`${BASE}/poster.webp`} alt="" aria-hidden="true"
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
          <div style={{
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
              Saúde que conecta
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
              Cuidado em saúde mental de qualidade, oferecido por psiquiatras e psicólogos
              em trabalho solidário. Sem filas, sem burocracia.
            </p>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={openAgendar} style={{
                padding: "14px 24px", fontWeight: 700, fontSize: 14, color: "#001820",
                background: `linear-gradient(90deg, ${T.teal300}, ${T.teal500})`,
                border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 20px rgba(0,191,216,.35)", minHeight: 48,
              }}>
                Agendar consulta
              </button>
              {/* Era um botão sem ação nenhuma no hero — o segundo CTA da página
                  inteira. Agora leva à seção que explica como o cuidado funciona. */}
              <a href="#sobre" style={{
                padding: "14px 24px", fontWeight: 700, fontSize: 14, color: T.teal300,
                background: "transparent", border: "2px solid rgba(0,191,216,0.5)",
                borderRadius: 12, cursor: "pointer", fontFamily: "inherit", minHeight: 48,
                textDecoration: "none", display: "inline-flex", alignItems: "center",
                justifyContent: "center",
              }}>
                Saiba como ativar
              </a>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24 }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", background: "#25D366",
                flexShrink: 0, boxShadow: "0 0 6px #25D366",
              }} />
              <span style={{ fontSize: 12, color: "rgba(214,244,248,0.86)", fontWeight: 600 }}>
                12 especialidades, de psiquiatria a fonoaudiologia
              </span>
            </div>
          </div>
        </div>

        {!isMobile && (
          <div data-etapa-scrim="" style={{
            position: "absolute", zIndex: 3, right: 44, top: "50%",
            transform: "translateY(-50%)", display: "flex", flexDirection: "column",
            gap: 20, textAlign: "right", maxWidth: 300,
            padding: "26px 26px 26px 34px", borderRadius: 20,
            /* Nasce invisível: uma caixa escura sozinha, antes de qualquer
               texto entrar, lia como defeito na tela. Entra junto com a
               primeira etapa. */
            opacity: estatico ? 1 : 0,
            /* mesmo princípio do texto: refletor colado no conteúdo, não
               gradiente de ponta a ponta lavando a cena. */
            background:
              "radial-gradient(126% 132% at 82% 50%, rgba(3,7,13,.94) 0%, rgba(3,7,13,.86) 42%, rgba(3,7,13,.48) 68%, transparent 88%)",
          }}>
            {ETAPAS.map((e, i) => (
              <div
                key={e.titulo} data-etapa={i}
                style={{
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
