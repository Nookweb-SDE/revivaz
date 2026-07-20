/* ──────────────────────────────────────────────────────────────
   Hero Telemedicina — "Saúde que conecta"
   Spec: docs/superpowers/specs/2026-07-20-hero-telemedicina-design.md

   Técnica: grade de pontos CSS + rota SVG que se desenha, com os
   vértices snapados na grade. Zero WebGL, zero dependência nova.
   Ref.: skill front-impecavel — 02-css-signature, 03-scroll-e-reveal,
   09-composicao-e-assets-ia (rota que percorre + pulso viajante).
   ────────────────────────────────────────────────────────────── */
import React, { useEffect, useRef, useState } from "react";

const T = {
  teal900: "#004D5C", teal700: "#007A8C", teal500: "#00A8BF",
  teal300: "#00BFD8", teal100: "#D6F4F8",
  navy: "#0B1D3A", white: "#FFFFFF",
} as const;

const VB = { w: 1200, h: 460 };   // viewBox da cena
const CELL = 40;                  // célula da grade, em unidades de viewBox

type BP = "mobile" | "tablet" | "desktop";
type Variant = 1 | 2;

/* snap de coordenada à grade — sem isto os nós flutuam entre os pontos
   e a leitura técnica se perde (02-css-signature) */
const snap = (v: number) => Math.round(v / CELL) * CELL;

/** Path com cantos arredondados a partir de waypoints snapados.
 *  Degraus retos + curva no canto = precisão técnica sem rigidez. */
function roundedPath(pts: Array<[number, number]>, r = 28): string {
  if (pts.length < 2) return "";
  const P = pts.map(([x, y]) => [snap(x), snap(y)] as [number, number]);
  let d = `M ${P[0][0]} ${P[0][1]}`;
  for (let i = 1; i < P.length - 1; i++) {
    const [px, py] = P[i - 1], [cx, cy] = P[i], [nx, ny] = P[i + 1];
    const d1 = Math.hypot(cx - px, cy - py), d2 = Math.hypot(nx - cx, ny - cy);
    const r1 = Math.min(r, d1 / 2), r2 = Math.min(r, d2 / 2);
    const a: [number, number] = [cx - ((cx - px) / d1) * r1, cy - ((cy - py) / d1) * r1];
    const b: [number, number] = [cx + ((nx - cx) / d2) * r2, cy + ((ny - cy) / d2) * r2];
    d += ` L ${a[0].toFixed(1)} ${a[1].toFixed(1)} Q ${cx} ${cy} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  }
  const last = P[P.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

/* Toda a topologia vive à DIREITA de SAFE_X: a coluna de texto ocupa a
   metade esquerda e a rota não pode cruzá-la (verificado em screenshot —
   na primeira versão o label "Acolhimento" caía sobre o botão). */
const SAFE_X = 560;

/* ── Variante 1 — Jornada do paciente: uma linha em degraus ascendentes ── */
const JORNADA = {
  waypoints: [
    [520, 440], [640, 440], [640, 400],
    [800, 400], [800, 320],
    [920, 320], [920, 240],
    [1080, 240], [1080, 160],
    [1180, 160],
  ] as Array<[number, number]>,
  nodes: [
    { x: 640, y: 400, label: "Acolhimento" },
    { x: 800, y: 320, label: "Profissional" },
    { x: 920, y: 240, label: "Consulta" },
    { x: 1080, y: 160, label: "Receita" },
  ],
};

/* Mobile: o texto é full-width, então a rota desce para a base do hero como
   uma faixa horizontal curta, sem labels. Reaproveitar a topologia de desktop
   deixava um fiapo atrás do botão (verificado em screenshot 390px). */
const JORNADA_MOBILE = {
  waypoints: [
    [40, 440], [200, 440], [200, 400],
    [440, 400], [440, 440],
    [680, 440], [680, 400],
    [920, 400], [920, 440], [1180, 440],
  ] as Array<[number, number]>,
  nodes: [
    { x: 200, y: 400, label: "Acolhimento" },
    { x: 440, y: 440, label: "Profissional" },
    { x: 680, y: 400, label: "Consulta" },
    { x: 920, y: 440, label: "Receita" },
  ],
};

/* ── Variante 2 — Rede solidária: nó central irradiando ── */
const REDE = {
  hub: { x: 840, y: 240 },
  spokes: [
    [[840, 240], [840, 120], [960, 120]],
    [[840, 240], [720, 240], [720, 120]],
    [[840, 240], [1000, 240], [1120, 240]],
    [[840, 240], [1000, 240], [1000, 360]],
    [[840, 240], [840, 360], [960, 360]],
    [[840, 240], [720, 240], [640, 200]],
    [[840, 240], [720, 240], [640, 320]],
    [[840, 240], [840, 120], [1080, 120]],
  ] as Array<Array<[number, number]>>,
  leaves: [
    [960, 120], [720, 120], [1120, 240], [1000, 360],
    [960, 360], [640, 200], [640, 320], [1080, 120],
  ] as Array<[number, number]>,
};

export default function HeroTelemedicina({
  heroLines, heroIdx, openAgendar, bp = "desktop", variant = 1,
}: {
  heroLines: string[]; heroIdx: number; openAgendar: () => void;
  bp?: BP; variant?: Variant;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  const isMobile = bp === "mobile";

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* desenho da rota + pulso dos nós */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const paths = Array.from(svg.querySelectorAll<SVGPathElement>("[data-route]"));
    const nodes = Array.from(svg.querySelectorAll<SVGGElement>("[data-node]"));
    const anims: Animation[] = [];
    const timers: number[] = [];

    // estado inicial: comprimento real do path (getTotalLength ignora pathLength)
    paths.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = reduced ? "0" : String(len);
    });
    nodes.forEach((n) => { n.style.opacity = reduced ? "1" : "0"; });

    if (reduced) return;   // rota já desenhada, sem pulsos, sem parallax

    const DUR = variant === 1 ? 2200 : 1500;
    paths.forEach((p, i) => {
      const len = p.getTotalLength();
      const delay = variant === 1 ? 420 : 420 + i * 90;
      anims.push(p.animate(
        [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { duration: DUR, delay, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" },
      ));
    });

    // cada nó acende quando a ponta da rota o alcança
    nodes.forEach((n) => {
      const at = Number(n.dataset.at || 0);          // 0..1 do percurso
      const delay = 420 + at * DUR;
      timers.push(window.setTimeout(() => {
        n.style.opacity = "1";
        anims.push(n.animate(
          [{ transform: "scale(.4)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }],
          { duration: 420, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "forwards" },
        ));
        const ring = n.querySelector<SVGCircleElement>("[data-ring]");
        if (ring) anims.push(ring.animate(
          [{ r: 6, opacity: .55 }, { r: 26, opacity: 0 }],
          { duration: 1100, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" },
        ));
      }, delay));
    });

    return () => { anims.forEach((a) => a.cancel()); timers.forEach(clearTimeout); };
  }, [variant, reduced, bp]);

  /* parallax de mouse — desktop, fora de reduced-motion */
  useEffect(() => {
    if (reduced || isMobile) return;
    const scene = sceneRef.current;
    if (!scene) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = scene.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        scene.style.transform = `translate3d(${(-dx * 14).toFixed(2)}px, ${(-dy * 10).toFixed(2)}px, 0)`;
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, [reduced, isMobile]);

  const minH = isMobile ? 348 : bp === "tablet" ? 380 : 460;   // +48 no mobile: espaço para a rota na base
  // no mobile o padding-bottom reserva a faixa onde a rota corre
  const pad = isMobile ? "40px 16px 92px" : bp === "tablet" ? "48px 24px 56px" : "56px 40px 64px";
  const titleSize = isMobile ? 26 : bp === "tablet" ? 30 : 40;
  const cellPx = isMobile ? 30 : 26;   // grade em px de tela (independe do viewBox)

  const jornada = isMobile ? JORNADA_MOBILE : JORNADA;
  const routeD = variant === 1
    ? [roundedPath(jornada.waypoints, isMobile ? 18 : 28)]
    : REDE.spokes.map((s) => roundedPath(s, 20));

  return (
    <section style={{ position: "relative", minHeight: minH, color: T.white, overflow: "hidden", background: T.navy }}>

      {/* 1 · base navy + vinheta */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(180deg,#0d2440 0%,${T.navy} 55%,#060d18 100%)`,
      }} />

      {/* 2 · imagem de teleatendimento, fundida no navy à esquerda */}
      {!isMobile && (
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, left: "42%",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 34%, #000 100%)",
          maskImage: "linear-gradient(90deg, transparent 0%, #000 34%, #000 100%)",
        }}>
          <img
            src="/revivaz/hero-doctors.webp" alt="" aria-hidden="true"
            {...{ fetchpriority: "high" }}   /* React 18 não reconhece o camelCase — ficaria fora do DOM */
            decoding="async" width="800" height="597"
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              objectPosition: "center 28%", display: "block", opacity: 0.42,
            }}
          />
          {/* fusão vertical: some no topo e na base (emenda com a seção seguinte) */}
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(180deg, ${T.navy} 0%, transparent 26%, transparent 62%, #060d18 100%)`,
          }} />
        </div>
      )}

      {/* 3 + 4 · grade de pontos e rota (parallax move as duas juntas) */}
      <div ref={sceneRef} aria-hidden="true" style={{ position: "absolute", inset: -20, willChange: reduced ? "auto" : "transform" }}>
        {/* grade — radial-gradient tilado, hard stop em `transparent 0` */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,191,216,.26) 1px, transparent 0)`,
          backgroundSize: `${cellPx}px ${cellPx}px`,
          WebkitMaskImage: "radial-gradient(ellipse 78% 68% at 62% 46%, #000 28%, transparent 100%)",
          maskImage: "radial-gradient(ellipse 78% 68% at 62% 46%, #000 28%, transparent 100%)",
        }} />

        <svg
          ref={svgRef} viewBox={`0 0 ${VB.w} ${VB.h}`} preserveAspectRatio="xMidYMid slice"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            /* trava de legibilidade: no desktop a rota desvanece sobre a coluna
               de texto; no mobile ela já vive na base, então a máscara sairia
               cortando à toa. CSS mask em vez de <mask> SVG — o SVG exige casar
               maskUnits com gradientUnits e zerou a cena quando errei o par. */
            ...(isMobile ? {} : {
              WebkitMaskImage: `linear-gradient(90deg, transparent 0%, transparent ${((SAFE_X - 150) / VB.w) * 100}%, #000 ${(SAFE_X / VB.w) * 100}%, #000 100%)`,
              maskImage: `linear-gradient(90deg, transparent 0%, transparent ${((SAFE_X - 150) / VB.w) * 100}%, #000 ${(SAFE_X / VB.w) * 100}%, #000 100%)`,
            }),
          }}
          aria-hidden="true" focusable="false"
        >
          <defs>
            <filter id="rv-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="rv-route" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor={T.teal700} />
              <stop offset="55%" stopColor={T.teal300} />
              <stop offset="100%" stopColor={T.teal100} />
            </linearGradient>
          </defs>
          <g>

          {routeD.map((d, i) => (
            <path
              key={i} data-route d={d} fill="none"
              stroke="url(#rv-route)" strokeWidth={2.5}
              strokeLinecap="round" strokeLinejoin="round"
              filter="url(#rv-glow)" opacity={0.95}
            />
          ))}

          {variant === 1
            ? jornada.nodes.map((n, i) => (
                <g key={n.label} data-node data-at={(i + 1) / (jornada.nodes.length + 0.6)}
                   style={{ transformOrigin: `${n.x}px ${n.y}px` }}>
                  <circle data-ring cx={n.x} cy={n.y} r={6} fill="none" stroke={T.teal300} strokeWidth={1.5} />
                  <circle cx={n.x} cy={n.y} r={6} fill={T.teal300} filter="url(#rv-glow)" />
                  <circle cx={n.x} cy={n.y} r={2.5} fill="#04222b" />
                  {!isMobile && (
                    <text x={n.x} y={n.y - 20} textAnchor="middle"
                          fill="rgba(214,244,248,.78)" fontSize={13} fontWeight={700}
                          fontFamily="'Nunito',sans-serif" letterSpacing="0.08em">
                      {n.label.toUpperCase()}
                    </text>
                  )}
                </g>
              ))
            : (
              <>
                <g data-node data-at={0.05} style={{ transformOrigin: `${REDE.hub.x}px ${REDE.hub.y}px` }}>
                  <circle data-ring cx={REDE.hub.x} cy={REDE.hub.y} r={8} fill="none" stroke={T.teal300} strokeWidth={1.5} />
                  <circle cx={REDE.hub.x} cy={REDE.hub.y} r={9} fill={T.teal300} filter="url(#rv-glow)" />
                  <circle cx={REDE.hub.x} cy={REDE.hub.y} r={3.5} fill="#04222b" />
                </g>
                {REDE.leaves.map(([x, y], i) => (
                  <g key={i} data-node data-at={0.45 + i * 0.06} style={{ transformOrigin: `${x}px ${y}px` }}>
                    <circle data-ring cx={x} cy={y} r={5} fill="none" stroke={T.teal300} strokeWidth={1.2} />
                    <circle cx={x} cy={y} r={5} fill={T.teal300} filter="url(#rv-glow)" />
                  </g>
                ))}
              </>
            )}
          </g>
        </svg>
      </div>

      {/* 5 · texto */}
      <div style={{
        position: "relative", zIndex: 2, display: "flex", alignItems: "center",
        padding: pad, maxWidth: 1200, margin: "0 auto", minHeight: minH,
      }}>
        <div style={{ flex: "1 1 0", minWidth: 0, maxWidth: isMobile ? "100%" : "56%" }}>
          <h1 style={{
            fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: titleSize,
            lineHeight: 1.1, margin: "0 0 8px", letterSpacing: "-0.02em",
            background: `linear-gradient(90deg, ${T.teal100} 0%, ${T.teal300} 50%, ${T.teal500} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
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
            <button style={{
              padding: "14px 24px", fontWeight: 700, fontSize: 14, color: T.teal300,
              background: "transparent", border: "2px solid rgba(0,191,216,0.5)",
              borderRadius: 12, cursor: "pointer", fontFamily: "inherit", minHeight: 48,
            }}>
              Saiba como ativar
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", background: "#25D366",
              flexShrink: 0, boxShadow: "0 0 6px #25D366",
            }} />
            <span style={{ fontSize: 12, color: "rgba(214,244,248,0.86)", fontWeight: 600 }}>
              +500 profissionais disponíveis agora
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
