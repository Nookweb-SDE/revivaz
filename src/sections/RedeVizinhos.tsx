/* Bloco "O que é": janelas do prédio acendem e se ligam por fios de luz
   (prévia 2 escolhida pelo dono em 18/10/2026). Substitui o EcgValor.
   Só cores do site: cinza apagado → turquesa claro → turquesa; magenta em
   poucas janelas. Sem amarelo. Pausa fora da tela; com movimento reduzido
   desenha um quadro parado. */
import { useEffect, useRef } from "react";
import { CICLO, montarRede, intensidade, type Janela, type Ligacao } from "../lib/redeVizinhos";

type Bp = "mobile" | "tablet" | "desktop";

const T = {
  teal700: "#007A8C", teal300: "#00BFD8", bg: "#EEF9FB",
  gray950: "#0D1117", gray600: "#4B5563",
};

const ETAPAS = [
  { n: "01", titulo: "Escuta", texto: "Um espaço mediado por psicólogos e terapeutas, sem julgamento." },
  { n: "02", titulo: "Vínculo", texto: "Vizinhos que se conhecem se apoiam melhor." },
  { n: "03", titulo: "Convivência", texto: "Encontros mensais para adolescentes, mulheres e homens." },
  { n: "04", titulo: "Rede de apoio", texto: "CVV 188 e encaminhamento para acolhimento individual." },
];

// turquesa claro (#D6F4F8) → turquesa (#00BFD8), conforme a janela acende
const tom = (k: number) => `rgb(${Math.round(214 - 214 * k)},${Math.round(244 - 53 * k)},${Math.round(248 - 32 * k)})`;

export function RedeVizinhos({ bp }: { bp: Bp }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const parado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, cols = 0, rows = 0;
    let janelas: Janela[] = [], ligacoes: Ligacao[] = [];
    let raf = 0, visivel = false, inicio = 0;

    const medir = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      W = c.clientWidth; H = c.clientHeight;
      c.width = W * d; c.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      const nc = Math.max(6, Math.floor(W / 70)), nr = W < 600 ? 5 : 6;
      if (nc !== cols || nr !== rows) {
        cols = nc; rows = nr;
        ({ janelas, ligacoes } = montarRede(cols, rows));
      }
    };

    const desenhar = (ms: number) => {
      // ao entrar na tela o ciclo já começa com janelas acesas, nunca a grade vazia
      const t = parado ? CICLO - 1.5 : ((ms - inicio) / 1000 + 2.5) % CICLO;
      const cw = W / cols, ch = H / rows, jw = cw * 0.34, jh = ch * 0.42;
      const cx = (j: Janela) => (j.col + 0.5) * cw, cy = (j: Janela) => (j.row + 0.5) * ch;
      ctx.clearRect(0, 0, W, H);

      ligacoes.forEach(([i, k], n) => {
        const a = janelas[i], b = janelas[k];
        const p = Math.min(intensidade(t - 0.3, a.acende), intensidade(t - 0.3, b.acende));
        if (p <= 0) return;
        const ax = cx(a), ay = cy(a), bx = cx(b), by = cy(b);
        ctx.strokeStyle = `rgba(0,191,216,${0.55 * p})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx - ax) * p, ay + (by - ay) * p); ctx.stroke();
        if (p >= 1 && !parado) {
          const f = (ms / 1400 + n * 0.13) % 1;
          ctx.fillStyle = T.teal700;
          ctx.beginPath(); ctx.arc(ax + (bx - ax) * f, ay + (by - ay) * f, 2.4, 0, Math.PI * 2); ctx.fill();
        }
      });

      janelas.forEach(j => {
        const k = intensidade(t, j.acende);
        ctx.fillStyle = k <= 0 ? "rgba(11,29,58,.08)" : j.destaque ? `rgba(180,21,126,${0.25 + 0.75 * k})` : tom(k);
        ctx.beginPath(); ctx.roundRect(cx(j) - jw / 2, cy(j) - jh / 2, jw, jh, 5); ctx.fill();
      });
    };

    const loop = (ms: number) => { desenhar(ms); if (visivel && !parado) raf = requestAnimationFrame(loop); };

    medir();
    desenhar(0);
    const ro = new ResizeObserver(() => { medir(); desenhar(performance.now()); });
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !visivel) inicio = performance.now();
      visivel = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visivel && !parado) raf = requestAnimationFrame(loop);
    });
    io.observe(c);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);

  const mobile = bp === "mobile";
  return (
    <section aria-label="O que é" style={{ background: T.bg, padding: mobile ? "56px 20px" : "72px clamp(20px,5vw,72px) 80px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: T.teal700, marginBottom: 12 }}>O que é</div>
        <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: "clamp(2.05rem, 4.6vw + .4rem, 4.15rem)", lineHeight: 1.04, color: T.gray950, margin: 0, maxWidth: "18ch" }}>
          Saúde mental também se cuida <span style={{ color: T.teal700 }}>em comunidade.</span>
        </h2>
        <p style={{ fontSize: "clamp(1rem, .5vw + .85rem, 1.15rem)", color: T.gray600, lineHeight: 1.6, margin: "14px 0 0", maxWidth: 560 }}>
          Escuta qualificada, vínculos entre vizinhos e orientação para quem precisa de mais cuidado.
        </p>

        <canvas ref={ref} aria-hidden="true" style={{ display: "block", width: "100%", height: mobile ? 220 : "min(42vh, 380px)", margin: mobile ? "24px 0" : "36px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : bp === "tablet" ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: mobile ? 16 : 24 }}>
          {ETAPAS.map(e => (
            <article key={e.n}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: T.teal700 }}>{e.n}</div>
              <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "clamp(.95rem, .3vw + .85rem, 1.06rem)", color: T.gray950, margin: "6px 0 4px" }}>{e.titulo}</h3>
              <p style={{ fontSize: ".86rem", lineHeight: 1.5, color: T.gray600, margin: 0 }}>{e.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
