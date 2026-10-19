/* Faixa do próximo encontro como um ingresso picotado (ideia "Admit One
   Ticket" do 21st.dev): canhoto com a data e "participação livre", granulado
   em SVG e leve inclinação com o mouse. Substitui a faixa "12 especialidades",
   que não é o projeto do condomínio. O convite a profissionais voluntários
   mantém a âncora #para-profissionais do menu. Movimento reduzido: parado. */
import { useEffect, useRef, useState } from "react";
import { faltaPara, proximoEncontro } from "../lib/encontros";

type Bp = "mobile" | "tablet" | "desktop";

const T = {
  teal900: "#004E5A", teal700: "#007A8C", teal300: "#00BFD8", teal100: "#D6F4F8", teal050: "#EDF9FB",
  navy: "#0B1D3A", gray600: "#4B5563", white: "#FFFFFF",
};

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function FaixaProximoEncontro({ bp, onVoluntario }: { bp: Bp; onVoluntario?: () => void }) {
  const mobile = bp === "mobile";
  const empilha = mobile || bp === "tablet";
  const ingresso = useRef<HTMLDivElement>(null);
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // inclinação 3D só com mouse e sem movimento reduzido
  useEffect(() => {
    const el = ingresso.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
      el.style.setProperty("--rx", `${-((e.clientY - r.top) / r.height - 0.5) * 8}deg`);
    };
    const sai = () => { el.style.setProperty("--ry", "0deg"); el.style.setProperty("--rx", "0deg"); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", sai);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", sai); };
  }, []);

  const p = proximoEncontro(agora);
  const [, m, d] = p ? p.data.split("-") : ["", "", ""];
  const dataLonga = p ? `quinta, ${Number(d)} de ${MESES[Number(m) - 1]}` : "";
  const dias = p ? faltaPara(p, agora).dias : 0;

  const convite = p && (
          <div style={{ perspective: 1200 }}>
            <div ref={ingresso} className="fpe-ing" role="img"
              aria-label={`Convite: ${dataLonga}, ${p.eixo}. Adolescentes às 18h, mulheres às 19h, homens às 20h. Participação livre.`}
              style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 78px" : "1fr 112px", minHeight: mobile ? 0 : 300, color: T.white }}>
              <div className="fpe-corpo" style={{ padding: mobile ? "22px 20px" : "30px 34px", background: T.teal700 }}>
                <div className="fpe-brilho" />
                <div style={{ position: "relative", fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,.82)" }}>Psicologia comunitária no Condomínio Vivaz</div>
                <div style={{ position: "relative", fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: mobile ? 28 : 40, lineHeight: 1.02, margin: mobile ? "12px 0 16px" : "18px 0 22px", maxWidth: "13ch" }}>{p.eixo}</div>
                <div style={{ position: "relative", display: "flex", flexDirection: mobile ? "column" : "row", flexWrap: "wrap", gap: mobile ? 6 : "8px 22px", fontSize: 15, fontWeight: 700 }}>
                  {[["18h", "Adolescentes"], ["19h", "Mulheres"], ["20h", "Homens (a confirmar)"]].map(([h, g]) => (
                    <div key={h}><b style={{ fontWeight: 900, marginRight: 6, fontVariantNumeric: "tabular-nums" }}>{h}</b><span style={{ color: "rgba(255,255,255,.88)" }}>{g}</span></div>
                  ))}
                </div>
                <div style={{ position: "relative", marginTop: 18, fontSize: 14, color: "rgba(255,255,255,.75)" }}>{dataLonga[0].toUpperCase() + dataLonga.slice(1)}, no próprio condomínio</div>
              </div>
              <div className="fpe-canhoto" style={{ background: T.teal900, display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "2px dashed rgba(255,255,255,.35)" }}>
                <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", textAlign: "center", position: "relative" }}>
                  <span style={{ fontWeight: 900, fontSize: mobile ? 34 : 46, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{d}/{m}</span>
                  <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: ".04em", color: T.teal300, marginLeft: 12 }}>participação livre</span>
                </div>
              </div>
            </div>
          </div>
  );

  return (
    <section id="para-profissionais" aria-label="Próximo encontro" style={{ background: T.teal050, padding: mobile ? "56px 0" : "64px 0", color: T.navy }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: mobile ? "0 20px" : "0 clamp(20px,5vw,72px)", display: "grid", gridTemplateColumns: empilha ? "1fr" : "1fr 1.25fr", gap: empilha ? 28 : 56, alignItems: "center" }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: mobile ? 28 : 38, lineHeight: 1.1, margin: "0 0 12px", maxWidth: "20ch" }}>
            {p ? `Próximo encontro: ${dataLonga}` : "Novo ciclo de encontros em breve"}
          </h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: T.gray600, maxWidth: 420 }}>
            Adolescentes às 18h, mulheres às 19h e homens às 20h, no próprio condomínio. A participação é livre.
            {p && dias > 0 && <> Faltam <strong>{dias} {dias === 1 ? "dia" : "dias"}</strong>.</>}
          </p>
          {empilha && <div style={{ marginTop: 24 }}>{convite}</div>}
          <a href="/acolhimento" className="fpe-btn" style={{ marginTop: 24, display: "inline-flex", alignItems: "center", minHeight: 46, padding: "0 22px", borderRadius: 9999, background: T.navy, color: T.white, fontWeight: 800, fontSize: 15, textDecoration: "none" }}>
            Tirar dúvidas
          </a>
          {onVoluntario && (
            <div style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid ${T.teal100}`, fontSize: 15, color: T.gray600, maxWidth: 420 }}>
              Trabalha com psicologia ou saúde mental?{" "}
              <button onClick={onVoluntario} className="fpe-link" style={{ background: "none", border: 0, padding: 0, font: "inherit", fontWeight: 800, color: T.teal700, textDecoration: "underline", textUnderlineOffset: 4, cursor: "pointer" }}>
                Atenda por vídeo como voluntário
              </button>
            </div>
          )}
        </div>

        {!empilha && convite}
      </div>

      <style>{`
        .fpe-ing{--rx:0deg;--ry:0deg;position:relative;transform:rotateX(var(--rx)) rotateY(var(--ry));transition:transform .5s cubic-bezier(.2,.7,.2,1);filter:drop-shadow(0 24px 30px rgba(0,78,90,.28))}
        .fpe-ing>div{position:relative;overflow:hidden}
        .fpe-corpo{border-radius:20px 0 0 20px;-webkit-mask:radial-gradient(circle 14px at 100% 0,#0000 98%,#000) top right/100% 51% no-repeat,radial-gradient(circle 14px at 100% 100%,#0000 98%,#000) bottom right/100% 51% no-repeat;mask:radial-gradient(circle 14px at 100% 0,#0000 98%,#000) top right/100% 51% no-repeat,radial-gradient(circle 14px at 100% 100%,#0000 98%,#000) bottom right/100% 51% no-repeat}
        .fpe-canhoto{border-radius:0 20px 20px 0;-webkit-mask:radial-gradient(circle 14px at 0 0,#0000 98%,#000) top left/100% 51% no-repeat,radial-gradient(circle 14px at 0 100%,#0000 98%,#000) bottom left/100% 51% no-repeat;mask:radial-gradient(circle 14px at 0 0,#0000 98%,#000) top left/100% 51% no-repeat,radial-gradient(circle 14px at 0 100%,#0000 98%,#000) bottom left/100% 51% no-repeat}
        .fpe-corpo:before,.fpe-canhoto:before{content:"";position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");mix-blend-mode:overlay;opacity:.5;pointer-events:none}
        .fpe-corpo:after{content:"";position:absolute;width:520px;height:520px;right:-200px;top:-260px;border-radius:50%;background:radial-gradient(circle,rgba(0,191,216,.55),transparent 65%);pointer-events:none}
        .fpe-brilho{position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.18) 50%,transparent 65%);transform:translateX(-120%);pointer-events:none}
        .fpe-ing:hover .fpe-brilho{transform:translateX(120%);transition:transform 1.1s ease}
        .fpe-btn:focus-visible,.fpe-link:focus-visible{outline:3px solid ${T.teal300};outline-offset:3px}
        @media (prefers-reduced-motion:reduce){.fpe-ing,.fpe-ing:hover .fpe-brilho{transition:none}}
      `}</style>
    </section>
  );
}
