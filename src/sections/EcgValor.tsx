/* ═══════════════════════════════════════════════════════════════════
   EcgValor — réplica EXATA da v6 "ECG da operação" (NookTrack).
   Fonte da verdade: _dev/valor-claude/v6.html (capturado via nookpick,
   action:"exact"). Replicado 1:1 — verde #007A8C, Inter/JetBrains Mono,
   HUD "72 BPM", copy NookTrack. NADA inventado/aproximado.
   Único ajuste técnico (não-visual): CSS e queries DOM escopados sob
   `.ecgv6` p/ não vazar o reset/`body{background:#050505}` pro resto da
   landing. Aparência dentro do bloco = idêntica ao v6.
   ══════════════════════════════════════════════════════════════════ */
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400..900&family=JetBrains+Mono:wght@400;500;600&display=swap');
.ecgv6, .ecgv6 *, .ecgv6 *::before, .ecgv6 *::after{ box-sizing:border-box; margin:0; padding:0; }
.ecgv6{
  font-family:'Nunito',system-ui,sans-serif;
  color:#1F2937;
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
  background:#EEF9FB;
}
.ecgv6 .valor{
  position:relative;
  min-height:100svh;
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:clamp(28px,5vh,64px) clamp(20px,5vw,72px);
  background-color:#EEF9FB;
  overflow:hidden;
}
.ecgv6 .valor::after{
  content:"";
  position:absolute; inset:0;
  pointer-events:none;
  background:radial-gradient(120% 95% at 50% 42%, rgba(238,249,251,0) 48%, rgba(238,249,251,.88) 100%);
}
.ecgv6 .frame{
  position:relative;
  z-index:1;
  width:100%;
  max-width:1240px;
  margin:0 auto;
  display:flex;
  flex-direction:column;
  gap:clamp(18px,3.2vh,34px);
}
.ecgv6 .toprow{ display:flex; align-items:baseline; justify-content:space-between; gap:16px; }
.ecgv6 .eyebrow{
  display:inline-flex; align-items:center; gap:12px;
  font-family:'Nunito',sans-serif;
  font-size:12px; font-weight:800; letter-spacing:.22em; text-transform:uppercase;
  color:#007A8C;
}
.ecgv6 .eyebrow::before{
  content:""; width:26px; height:1px;
  background:#007A8C; box-shadow:0 0 8px rgba(0,122,140,.6);
}
.ecgv6 .hud{
  display:inline-flex; align-items:center; gap:8px;
  font-family:'Nunito',sans-serif;
  font-size:11px; font-weight:700; letter-spacing:.18em; text-transform:uppercase;
  color:#4B5563; white-space:nowrap;
}
.ecgv6 .hud b{ font-weight:800; color:#007A8C; }
.ecgv6 .hud-dot{
  width:6px; height:6px; border-radius:50%;
  background:#007A8C; box-shadow:0 0 8px rgba(0,122,140,.8);
  animation:ecgv6_hudblink 1.66s steps(1) infinite;
}
@keyframes ecgv6_hudblink{ 0%,100%{opacity:1} 55%{opacity:.15} }
.ecgv6 .manifesto{
  font-weight:900;
  font-size:clamp(2.05rem, 4.6vw + .4rem, 4.15rem);
  line-height:1.03; letter-spacing:-.032em;
  color:#0B1D3A; max-width:22ch;
}
.ecgv6 .m-line{ display:block; }
.ecgv6 .m-green{ color:#007A8C; text-shadow:none; }
.ecgv6 .sub{
  font-size:clamp(1rem, .5vw + .85rem, 1.15rem);
  line-height:1.6; color:#374151; max-width:60ch; font-weight:500;
}
.ecgv6 .ecg{
  position:relative; width:100%;
  height:clamp(140px, 22vh, 220px);
  /* grade de ECG SÓ atrás da linha — quase imperceptível (não sobe pro texto) */
  background-image:
    linear-gradient(rgba(0,122,140,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,122,140,.03) 1px, transparent 1px),
    linear-gradient(rgba(0,122,140,.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,122,140,.015) 1px, transparent 1px);
  background-size:40px 40px, 40px 40px, 8px 8px, 8px 8px;
  -webkit-mask-image:linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
          mask-image:linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
}
.ecgv6 .ecg canvas{ position:absolute; inset:0; width:100%; height:100%; display:block; }
.ecgv6 .pen{
  position:absolute; left:0; top:0;
  width:10px; height:10px; margin:-5px 0 0 -5px; border-radius:50%;
  background:#007A8C;
  box-shadow:0 0 6px 2px rgba(0,122,140,.95), 0 0 20px 7px rgba(0,122,140,.45), 0 0 48px 18px rgba(0,122,140,.16);
  pointer-events:none; will-change:transform;
}
.ecgv6 .ring{
  position:absolute; left:0; top:0;
  width:64px; height:64px; margin:-32px 0 0 -32px; border-radius:50%;
  border:1.5px solid rgba(0,122,140,.85);
  box-shadow:0 0 18px rgba(0,122,140,.35), inset 0 0 14px rgba(0,122,140,.2);
  opacity:0; pointer-events:none; will-change:transform,opacity;
}
.ecgv6 .bens{ display:grid; grid-template-columns:repeat(4, 1fr); gap:clamp(16px, 2.2vw, 30px); }
.ecgv6 .b{ border-top:1px solid rgba(0,122,140,.14); padding-top:clamp(12px,1.6vh,18px); }
.ecgv6 .b-head{ display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.ecgv6 .b-dot{
  position:relative; width:8px; height:8px; border-radius:50%;
  background:#007A8C; box-shadow:0 0 8px 2px rgba(0,122,140,.7); flex:none; will-change:transform;
}
.ecgv6 .b-ping{
  position:absolute; inset:0; border-radius:50%;
  border:1px solid rgba(0,122,140,.75); opacity:0; will-change:transform,opacity;
}
.ecgv6 .b-ix{
  font-family:'Nunito',sans-serif;
  font-size:11px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:#00A8BF;
}
.ecgv6 .b h3{
  font-size:clamp(.95rem, .3vw + .85rem, 1.06rem);
  font-weight:800; letter-spacing:-.01em; color:#0D1117; margin-bottom:6px;
}
.ecgv6 .b p{ font-size:.86rem; line-height:1.5; color:#4B5563; }
@media (max-width:880px){
  .ecgv6 .bens{ grid-template-columns:repeat(2, 1fr); }
  .ecgv6 .manifesto{ max-width:18ch; }
}
@media (max-width:520px){
  .ecgv6 .bens{ grid-template-columns:1fr; gap:14px; }
  .ecgv6 .valor{ justify-content:flex-start; }
  .ecgv6 .ecg{ height:clamp(110px, 16vh, 150px); }
  .ecgv6 .hud span.lbl{ display:none; }
}
@media (prefers-reduced-motion: reduce){
  .ecgv6 .hud-dot{ animation:none; }
  .ecgv6 .b{ opacity:1 !important; }
  .ecgv6 .ring{ display:none; }
}
`;

export default function EcgValor() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = <T extends Element>(s: string) => root.querySelector(s) as T | null;
    const qa = (s: string) => Array.prototype.slice.call(root.querySelectorAll(s)) as HTMLElement[];

    const wrap = q<HTMLDivElement>("#ecg");
    const cv = q<HTMLCanvasElement>("#trail");
    const pen = q<HTMLDivElement>("#pen");
    const ring = q<HTMLDivElement>("#ring");
    const bpmEl = q<HTMLElement>("#bpm");
    if (!wrap || !cv || !pen || !ring) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const items = qa(".b");
    const dots = qa(".b-dot");
    const pings = qa(".b-ping");

    let W = 0, H = 0, DPR = 1, baseY = 0, ampS = 1, speed = 0.17;
    const BASE_IV = 833; /* ~72 bpm */

    const g = (t: number, mu: number, sig: number, amp: number) => { const d = (t - mu) / sig; return amp * Math.exp(-d * d); };
    const wave = (t: number) => {
      if (t < 0 || t > 560) return 0;
      return g(t, 80, 24, 6.5)      /* P  */
           - g(t, 196, 7, 9)        /* Q  */
           + g(t, 210, 6.5, 52)     /* R  */
           - g(t, 224, 8, 15)       /* S  */
           + g(t, 382, 46, 10.5);   /* T  */
    };
    const drift = (t: number) => Math.sin(t * 0.0019) * 1.6 + Math.sin(t * 0.0007 + 2.1) * 1.2;

    const seg = (x0: number, y0: number, x1: number, y1: number) => {
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(0,122,140,.10)"; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = "rgba(0,122,140,.45)"; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = "rgba(0,122,140,1)"; ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    };

    let prev: { x: number; y: number } | null = null;
    const drawStatic = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      const path = new Path2D();
      for (let x = 0; x <= W; x += 1) {
        const t = x / speed;
        const y = baseY - wave(t % BASE_IV) * ampS - drift(t);
        if (x === 0) path.moveTo(x, y); else path.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(0,122,140,.10)"; ctx.lineWidth = 8; ctx.stroke(path);
      ctx.strokeStyle = "rgba(0,122,140,.45)"; ctx.lineWidth = 3.4; ctx.stroke(path);
      ctx.strokeStyle = "rgba(0,122,140,.95)"; ctx.lineWidth = 1.7; ctx.stroke(path);
      const k = Math.max(0, Math.round((0.7 * W / speed - 210) / BASE_IV));
      const tR = k * BASE_IV + 210;
      const xR = Math.min(tR * speed, W - 8);
      const yR = baseY - wave(210) * ampS - drift(tR);
      pen.style.transform = "translate(" + xR + "px," + yR + "px)";
    };

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap.clientWidth; H = wrap.clientHeight;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      baseY = H * 0.62;
      ampS = (H * 0.34) / 52;
      speed = W / Math.max(4200, Math.min(8200, W * 5));
      prev = null;
      if (reduced) drawStatic();
    };

    resize();
    window.addEventListener("resize", resize);
    let ro: ResizeObserver | null = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(wrap); }

    if (reduced || typeof gsap === "undefined") {
      if (typeof gsap === "undefined" && !reduced) drawStatic();
      return () => { window.removeEventListener("resize", resize); if (ro) ro.disconnect(); };
    }

    const setPenX = gsap.quickSetter(pen, "x", "px") as (v: number) => void;
    const setPenY = gsap.quickSetter(pen, "y", "px") as (v: number) => void;

    gsap.set(qa(".eyebrow, .hud"), { opacity: 0, y: 10 });
    gsap.set(qa(".m-line"), { opacity: 0, y: 26 });
    gsap.set(qa(".sub"), { opacity: 0, y: 16 });
    gsap.set([wrap], { opacity: 0 });
    gsap.set(items, { opacity: 0, y: 14 });
    const introTl = gsap.timeline({ defaults: { ease: "power4.out" } })
      .to(qa(".eyebrow"), { opacity: 1, y: 0, duration: .7 }, .10)
      .to(qa(".hud"), { opacity: 1, y: 0, duration: .7 }, .18)
      .to(qa(".m-line"), { opacity: 1, y: 0, duration: 1.05, stagger: .13 }, .25)
      .to(qa(".sub"), { opacity: 1, y: 0, duration: .9 }, .58)
      .to([wrap], { opacity: 1, duration: .9, ease: "power2.out" }, .72)
      .to(items, { opacity: .35, y: 0, duration: .8, stagger: .08 }, .88);

    let bIx = -1;
    const fireBeat = (px: number, py: number) => {
      /* sincroniza com a posição do ponto: acende o benefício da coluna sob a caneta */
      bIx = Math.min(3, Math.max(0, Math.floor((px / Math.max(W, 1)) * 4)));
      const it = items[bIx];
      const h3 = it.querySelector("h3") as HTMLElement | null;
      const ix = it.querySelector(".b-ix") as HTMLElement | null;
      gsap.timeline({ defaults: { overwrite: "auto" } })
        .to(it, { opacity: 1, duration: .16, ease: "power2.out" }, 0)
        .to(it, { opacity: .35, duration: 2.7, ease: "power2.inOut" }, .72);
      /* ATIVO no batimento: número + título ganham a cor primária, depois decaem */
      if (h3) gsap.timeline({ defaults: { overwrite: "auto" } })
        .to(h3, { color: "#007A8C", duration: .16, ease: "power2.out" }, 0)
        .to(h3, { color: "#0D1117", duration: 2.7, ease: "power2.inOut" }, .72);
      if (ix) gsap.timeline({ defaults: { overwrite: "auto" } })
        .to(ix, { color: "#007A8C", duration: .16, ease: "power2.out" }, 0)
        .to(ix, { color: "#00A8BF", duration: 2.7, ease: "power2.inOut" }, .72);
      gsap.fromTo(pings[bIx], { scale: .35, opacity: .9 }, { scale: 4.2, opacity: 0, duration: .85, ease: "power2.out", overwrite: true });
      gsap.fromTo(dots[bIx], { scale: 1.9 }, { scale: 1, duration: .6, ease: "power3.out", overwrite: true });
      gsap.set(ring, { x: px, y: py });
      gsap.fromTo(ring, { scale: .22, opacity: .85 }, { scale: 1, opacity: 0, duration: .8, ease: "power2.out", overwrite: true });
    };

    let clock = 0, x = 0;
    let lastBeat = -10000, nextBeat = 1900, rFired = true, curBpm = 72;

    const tick = (_time: number, dtms: number) => {
      const dt = Math.min(dtms || 16.7, 64);
      clock += dt;

      const a = 1 - Math.pow(0.966, dt / 16.67);
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = a;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      if (clock >= nextBeat) {
        lastBeat = nextBeat;
        const iv = BASE_IV * (0.92 + Math.random() * 0.16);
        nextBeat = lastBeat + iv;
        rFired = false;
        curBpm = Math.round(60000 / iv);
      }

      x += speed * dt;
      if (x > W) { x -= W; prev = null; }
      const y = baseY - wave(clock - lastBeat) * ampS - drift(clock);

      if (!rFired && clock >= lastBeat + 210) {
        rFired = true;
        fireBeat(x, y);
        if (bpmEl) bpmEl.textContent = String(curBpm);
      }

      if (prev) seg(prev.x, prev.y, x, y);
      prev = { x, y };
      setPenX(x); setPenY(y);
    };

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      introTl.kill();
      const actives = items.flatMap((el) => [el.querySelector("h3"), el.querySelector(".b-ix")]).filter(Boolean) as Element[];
      gsap.killTweensOf([pen, ring, ...items, ...dots, ...pings, ...actives]);
      window.removeEventListener("resize", resize);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <div className="ecgv6" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section className="valor" aria-label="Proposta de valor">
        <div className="frame">

          <div className="toprow">
            <span className="eyebrow">O QUE É</span>
          </div>

          <h2 className="manifesto">
            <span className="m-line">Nós entregamos <span className="m-green">gestão.</span></span>
            <span className="m-line">Rastrear e monitorar, todos fazem.</span>
          </h2>

          <p className="sub">O NookTrack administra toda a cadeia operacional, comercial e financeira do cliente e do veículo — antes, durante e depois.</p>

          <div className="ecg" id="ecg" aria-hidden="true">
            <canvas id="trail" />
            <div className="ring" id="ring" />
            <div className="pen" id="pen" />
          </div>

          <div className="bens">
            <article className="b">
              <div className="b-head"><span className="b-dot"><i className="b-ping" /></span><span className="b-ix">01</span></div>
              <h3>Menos tempo operacional</h3>
              <p>Elimina o retrabalho de sistemas apartados.</p>
            </article>
            <article className="b">
              <div className="b-head"><span className="b-dot"><i className="b-ping" /></span><span className="b-ix">02</span></div>
              <h3>Tudo num lugar só</h3>
              <p>Centralização das informações de todas as áreas.</p>
            </article>
            <article className="b">
              <div className="b-head"><span className="b-dot"><i className="b-ping" /></span><span className="b-ix">03</span></div>
              <h3>Crítico no automático</h3>
              <p>Cobrança, bloqueio por inadimplência, notificações e comissões.</p>
            </article>
            <article className="b">
              <div className="b-head"><span className="b-dot"><i className="b-ping" /></span><span className="b-ix">04</span></div>
              <h3>Ponta a ponta</h3>
              <p>Da prospecção ao pós-venda, uma cadeia só.</p>
            </article>
          </div>

        </div>
      </section>
    </div>
  );
}
