/* Grade fina que acende onde o mouse passa e apaga logo depois, com algumas
   células acendendo sozinhas para a grade nunca ficar morta. Veio do Grid
   Pulse do 21st.dev, trocando o arco-íris pelas cores da Revivaz (turquesa
   no alto, magenta embaixo) e o Tailwind por estilo direto. Feito para fundo
   claro.

   Fica dentro de um container posicionado, embaixo do conteúdo. É só
   enfeite: escondido do leitor de tela, não pega clique, um canvas que dorme
   quando nada está aceso, pausa fora da tela e fica parado para quem pede
   menos movimento. */
import { useEffect, useRef, type CSSProperties } from "react";

export type GridPulseProps = {
  /** Lado da célula em px; as linhas e as células acesas usam o mesmo. */
  cell?: number;
  /** Até quantas células do mouse ainda pegam luz. */
  reach?: number;
  /** Quantas células acendem sozinhas a cada batida. */
  ambient?: number;
  /** Teto, para uma passada rápida não acender o campo inteiro. */
  maxLit?: number;
  /** Elementos (procurados no pai da grade) cujas linhas de texto a luz evita. */
  avoid?: string;
  style?: CSSProperties;
};

/* A cor desce como numa cartela: turquesa no alto, magenta embaixo, como a
   borda do badge. Cada célula pega um tom mais claro
   ou mais cheio dessa cor, para a passada virar um campo de tons. */
/* Só as duas cores da marca: no meio do caminho elas se alternam, porque
   misturar dá cinza-azulado e girar o tom passa por um azul que não é nosso. */
const TURQUESA = "187 92%"; // #00BFD8
const MAGENTA = "321 78%"; // #B4157E
/** Claridades da escada de tons: do quase branco à cor cheia da marca. */
const TINTS = [88, 80, 70, 58, 44];
/** Força máxima da célula acesa. */
const FORCA = 1;
/** Quão apagada a célula fica bem atrás de uma linha de texto. */
const FAINT = 0.13;
/** Em quantas células volta à força total. */
const FADE = 2.2;
/** Folga em volta de cada linha de texto, em px. */
const PAD = 5;
const FADE_IN = 160;
const FADE_OUT = 750;

type Cell = {
  col: number;
  row: number;
  colour: string;
  /** Quanto da cor a célula pode ter, de 0 a 1. */
  dim: number;
  born: number;
  /** Quando começa a apagar. */
  until: number;
};

const easeOut = (t: number) => 1 - (1 - t) ** 2;
const easeIn = (t: number) => t * t;
const sorteia = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];

export function GridPulse({
  cell = 24,
  reach = 2.6,
  ambient = 2,
  maxLit = 180,
  avoid = "[data-grid-avoid]",
  style,
}: GridPulseProps) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = box.current;
    const paper = canvas.current;
    const ctx = paper?.getContext("2d");
    if (!el || !paper || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cols = 1;
    let rows = 1;
    let width = 0;
    let height = 0;
    let clear: DOMRect[] = [];
    const cells = new Map<string, Cell>();

    // Protege as linhas do texto, não a caixa: a última linha curta de um
    // parágrafo deixaria uma faixa apagada onde não há nada para ler.
    const measureText = () => {
      const bounds = el.getBoundingClientRect();
      const scope = el.parentElement ?? document;
      clear = [...scope.querySelectorAll(avoid)].flatMap((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        const lines = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
        const boxes = lines.length > 0 ? lines : [node.getBoundingClientRect()];
        return boxes.map(
          (r) => new DOMRect(r.left - bounds.left - PAD, r.top - bounds.top - PAD, r.width + PAD * 2, r.height + PAD * 2),
        );
      });
    };

    const measure = () => {
      width = el.clientWidth;
      height = el.clientHeight;
      cols = Math.max(1, Math.ceil(width / cell));
      rows = Math.max(1, Math.ceil(height / cell));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      paper.width = Math.round(width * dpr);
      paper.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measureText();
      wake();
    };

    /** Atrás das palavras a célula fica fraca, não preta: buraco parece defeito. */
    const brightness = (col: number, row: number) => {
      const x = col * cell + cell / 2;
      const y = row * cell + cell / 2;
      let nearest = Number.POSITIVE_INFINITY;
      for (const r of clear) {
        const dx = Math.max(r.left - x, 0, x - r.right);
        const dy = Math.max(r.top - y, 0, y - r.bottom);
        nearest = Math.min(nearest, Math.hypot(dx, dy));
        if (nearest === 0) break;
      }
      if (nearest === Number.POSITIVE_INFINITY) return FORCA;
      return FORCA * (FAINT + (1 - FAINT) * Math.min(1, nearest / (FADE * cell)));
    };

    const ink = (row: number) => {
      const t = rows > 1 ? Math.min(1, row / (rows - 1)) : 0;
      return `hsl(${Math.random() < t ? MAGENTA : TURQUESA} ${sorteia(TINTS)}%)`;
    };

    // Um laço desenha tudo; só roda enquanto algo está aceso.
    let frame = 0;
    const draw = (now: number) => {
      frame = 0;
      ctx.clearRect(0, 0, width, height);
      for (const [key, c] of cells) {
        let alpha: number;
        if (now < c.until) {
          alpha = easeOut(Math.min(1, (now - c.born) / FADE_IN));
        } else {
          const t = (now - c.until) / FADE_OUT;
          if (t >= 1) {
            cells.delete(key);
            continue;
          }
          alpha = 1 - easeIn(t);
        }
        ctx.globalAlpha = alpha * c.dim;
        ctx.fillStyle = c.colour;
        // recuado 1px para a linha da grade continuar aparecendo entre as acesas
        ctx.fillRect(c.col * cell + 1, c.row * cell + 1, cell - 1, cell - 1);
      }
      ctx.globalAlpha = 1;
      if (cells.size > 0) frame = requestAnimationFrame(draw);
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    /** Acende uma célula, se estiver na grade e ainda não acesa. */
    const light = (col: number, row: number, hold: number) => {
      if (col < 0 || row < 0 || col >= cols || row >= rows) return;
      if (cells.size >= maxLit) return;
      const key = `${col},${row}`;
      const now = performance.now();
      const lit = cells.get(key);
      if (lit && now < lit.until) return;
      // pega de novo enquanto apagava: continua de onde estava, sem piscar
      let born = now;
      if (lit) {
        const faded = 1 - easeIn(Math.min(1, (now - lit.until) / FADE_OUT));
        born = now - (1 - Math.sqrt(1 - faded)) * FADE_IN;
      }
      cells.set(key, { col, row, colour: lit?.colour ?? ink(row), dim: brightness(col, row), born, until: now + hold });
      wake();
    };

    // O mouse pinta. Quanto mais longe dele, menos chance de acender, para a
    // borda do rastro se desfazer em vez de andar em bloco.
    let pending = 0;
    let at: { x: number; y: number } | null = null;
    const paint = () => {
      pending = 0;
      if (!at) return;
      const cx = Math.floor(at.x / cell);
      const cy = Math.floor(at.y / cell);
      const span = Math.ceil(reach);
      for (let dy = -span; dy <= span; dy++) {
        for (let dx = -span; dx <= span; dx++) {
          const away = Math.hypot(dx, dy);
          if (away > reach) continue;
          if (Math.random() > 1 - away / (reach + 0.6)) continue;
          light(cx + dx, cy + dy, 260 + Math.random() * 900);
        }
      }
    };
    // ouvido na janela: a grade fica embaixo do conteúdo e nunca recebe o mouse
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !visible) return;
      const bounds = el.getBoundingClientRect();
      at = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      if (!pending) pending = requestAnimationFrame(paint);
    };

    // Algumas acendem sozinhas: viva ao chegar e no celular, sem mouse.
    let visible = true;
    let beat = 0;
    const drift = () => {
      beat = window.setTimeout(drift, 1400 + Math.random() * 1800);
      if (!visible || document.hidden) return;
      for (let i = 0; i < ambient; i++) {
        light(Math.floor(Math.random() * cols), Math.floor(Math.random() * rows), 900 + Math.random() * 1600);
      }
    };
    beat = window.setTimeout(drift, 500);

    const sight = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    sight.observe(el);
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    measure();
    // as linhas do texto mudam de lugar quando a fonte chega
    document.fonts?.ready.then(measureText).catch(() => {});
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      sight.disconnect();
      resize.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pending);
      clearTimeout(beat);
      window.removeEventListener("pointermove", onMove);
    };
  }, [cell, reach, ambient, maxLit, avoid]);

  const linha = "rgba(11,29,58,.07)";
  return (
    <div
      ref={box}
      aria-hidden="true"
      data-slot="grid-pulse"
      style={{
        position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
        backgroundImage: `linear-gradient(to right, ${linha} 1px, transparent 1px), linear-gradient(to bottom, ${linha} 1px, transparent 1px)`,
        backgroundSize: `${cell}px ${cell}px`,
        // some embaixo, para o bloco seguinte entrar por cima sem degrau
        maskImage: "linear-gradient(to bottom, #000 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, #000 92%, transparent)",
        ...style,
      }}
    >
      <canvas ref={canvas} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    </div>
  );
}
