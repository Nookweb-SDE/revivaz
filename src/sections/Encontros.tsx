/* Encontros mensais de psicologia comunitária (PDF da Flávia, §9).
   Bento com abas por grupo (prévia C escolhida pelo dono em 18/10/2026):
   trocar a aba troca juntos a foto, o horário e os 12 temas do ano. */
import { useLayoutEffect, useRef, useState } from "react";
import { ENCONTROS, proximoEncontro, rotuloData } from "../lib/encontros";

type Bp = "mobile" | "tablet" | "desktop";

const T = {
  teal700: "#007A8C", teal300: "#00BFD8", teal100: "#D6F4F8", teal050: "#EDF9FB",
  mag700: "#960064", mag500: "#B4157E",
  navy: "#0B1D3A", navy800: "#112240",
  gray950: "#0D1117", gray600: "#4B5563", white: "#FFFFFF",
};

type Grupo = "mulheres" | "adolescentes" | "homens";

const GRUPOS: Record<Grupo, { aba: string; img: string | null; alt: string; selo: string; titulo: string; texto: string; cor: string }> = {
  mulheres: {
    aba: "Mulheres · 19h", img: "/revivaz/encontro-roda.webp", alt: "Mulheres em roda de conversa com uma psicóloga no salão do condomínio",
    selo: "19h às 20h · a partir de 18 anos", cor: T.mag500,
    titulo: "Entre vizinhas, a conversa fica mais leve",
    texto: "Sobrecarga, limites, autocuidado e redes de apoio. Um espaço para trocar experiências com quem vive a mesma rotina, com mediação profissional.",
  },
  adolescentes: {
    aba: "Adolescentes · 18h", img: "/revivaz/encontro-adolescentes.webp", alt: "Adolescentes em roda de conversa com uma psicóloga",
    selo: "18h às 19h · 12 a 17 anos", cor: T.teal700,
    titulo: "Um lugar para falar e ser ouvido",
    texto: "Amizades, pressões, redes sociais e respeito às diferenças, em linguagem da idade e com combinados claros de convivência. Para participar, o responsável assina um termo de ciência.",
  },
  // pedido do dono em 18/10/2026; não está no PDF da Flávia, por isso o
  // horário fica "a confirmar" e o tema é o eixo do mês, sem tema próprio
  homens: {
    aba: "Homens · 20h", img: "/revivaz/encontro-homens.webp", alt: "Vizinhos conversam em roda no salão do condomínio com uma psicóloga",
    selo: "20h às 21h · a partir de 18 anos · a confirmar", cor: T.navy,
    titulo: "Conversa entre vizinhos, sem cobrança",
    texto: "O mesmo tema do mês, em um grupo só de homens, com mediação profissional. Horário a confirmar com a coordenação.",
  },
};
const ORDEM: Grupo[] = ["mulheres", "adolescentes", "homens"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const diaMes = (data: string) => { const [, m, d] = data.split("-"); return `${d} ${MESES[+m - 1]}`; };

export function Encontros({ bp }: { bp: Bp }) {
  const p = proximoEncontro(new Date());
  const mobile = bp === "mobile";
  const [grupo, setGrupo] = useState<Grupo>("mulheres");
  const g = GRUPOS[grupo];
  const abas = useRef<(HTMLButtonElement | null)[]>([]);
  const [bola, setBola] = useState({ x: 0, w: 0 });
  useLayoutEffect(() => {
    const medir = () => { const b = abas.current[ORDEM.indexOf(grupo)]; if (b) setBola({ x: b.offsetLeft, w: b.offsetWidth }); };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [grupo, bp]);
  // setas trocam de aba, como pede o padrão de abas da WAI-ARIA
  const teclas = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = ORDEM[(ORDEM.indexOf(grupo) + (e.key === "ArrowRight" ? 1 : ORDEM.length - 1)) % ORDEM.length];
    setGrupo(n); abas.current[ORDEM.indexOf(n)]?.focus();
  };

  return (
    <section id="encontros" style={{ scrollMarginTop: 80, background: T.white, padding: mobile ? "56px 20px" : "64px 16px 72px" }}>
      <div style={{ maxWidth: bp === "tablet" ? 720 : 1120, margin: "0 auto", padding: mobile ? 0 : "0 16px" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto", marginBottom: mobile ? 24 : 40 }}>
          <div style={{ fontSize: 12, color: T.teal700, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 8 }}>Psicologia comunitária no Vivaz Taboão da Serra</div>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: mobile ? 22 : 30, color: T.gray950, lineHeight: 1.2, margin: "0 0 12px" }}>Um encontro por mês, perto de casa</h2>
          <p style={{ fontSize: mobile ? 14 : 15, color: T.gray600, lineHeight: 1.7, margin: 0 }}>
            Uma quinta-feira por mês, psicólogos e profissionais da saúde conduzem encontros presenciais no condomínio. Ninguém precisa contar nada pessoal: a participação é livre e a privacidade, combinada no início.
          </p>
        </div>

        <div role="tablist" aria-label="Grupo" onKeyDown={teclas} style={{ position: "relative", display: "flex", width: mobile ? "100%" : "fit-content", boxSizing: "border-box", margin: "0 auto", marginBottom: mobile ? 18 : 24, padding: 5, background: T.teal050, border: `1px solid ${T.teal100}`, borderRadius: 9999 }}>
          <span aria-hidden="true" style={{ position: "absolute", top: 5, bottom: 5, left: 0, width: bola.w, transform: `translateX(${bola.x}px)`, borderRadius: 9999, background: g.cor, transition: "transform .45s cubic-bezier(.2,.8,.2,1), width .45s, background .45s" }} />
          {ORDEM.map((k, i) => (
            <button key={k} ref={el => { abas.current[i] = el; }} role="tab" id={`aba-${k}`} aria-selected={grupo === k} aria-controls="painel-grupo" tabIndex={grupo === k ? 0 : -1}
              onClick={() => setGrupo(k)}
              style={{ position: "relative", zIndex: 1, border: 0, background: "none", font: `800 ${mobile ? 13 : 14}px 'Nunito',sans-serif`, padding: mobile ? "10px 4px" : "11px 22px", flex: mobile ? "1 1 0" : undefined, whiteSpace: "nowrap", borderRadius: 9999, cursor: "pointer", color: grupo === k ? T.white : T.gray600, transition: "color .35s", minHeight: 44 }}>
              {GRUPOS[k].aba}
            </button>
          ))}
        </div>

        <div id="painel-grupo" role="tabpanel" aria-labelledby={`aba-${grupo}`} style={{ display: "grid", gridTemplateColumns: mobile || bp === "tablet" ? "1fr" : "1.1fr 1fr", gap: 16 }}>
          <article style={{ gridRow: mobile || bp === "tablet" ? "auto" : "span 2", borderRadius: 26, overflow: "hidden", background: T.navy, display: "flex", flexDirection: "column" }}>
            {/* foto inteira, na proporção dela (16:9), e o texto embaixo */}
            <div style={{ position: "relative", aspectRatio: "1600 / 894", flexShrink: 0 }}>
            {ORDEM.filter(k => GRUPOS[k].img).map(k => (
              <img key={k} src={GRUPOS[k].img!} alt={k === grupo ? GRUPOS[k].alt : ""} aria-hidden={k !== grupo} loading="lazy" decoding="async" width="800" height="447"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: k === grupo ? 1 : 0, transform: k === grupo ? "none" : "scale(1.06)", transition: "opacity .6s, transform 1.2s" }} />
            ))}
            {!g.img && <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 70% 60% at 70% 30%, rgba(0,191,216,.28), transparent 70%), linear-gradient(140deg, ${T.navy}, ${T.navy800})` }} />}
            </div>
            <div key={grupo} className="enc-troca" style={{ flex: 1, padding: mobile ? "16px 18px 20px" : "20px 26px 24px", color: T.white }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgba(255,255,255,.14)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.28)", borderRadius: 9999, fontSize: 12.5, fontWeight: 800 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: grupo === "mulheres" ? "#FF8FD4" : grupo === "homens" ? T.white : T.teal300 }} />{g.selo}
              </span>
              <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: mobile ? 22 : 26, lineHeight: 1.15, margin: "10px 0 6px" }}>{g.titulo}</h3>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,.84)", maxWidth: 520 }}>{g.texto}</p>
            </div>
          </article>

          <article style={{ borderRadius: 26, background: `linear-gradient(140deg, ${T.navy}, ${T.navy800})`, color: T.white, padding: mobile ? 18 : 24 }}>
            <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 900 }}>Os 12 temas do ano</h4>
            <ul key={grupo} className="enc-troca enc-lista" style={{ listStyle: "none", margin: 0, padding: "0 6px 0 0", maxHeight: 300, overflowY: "auto", overflowX: "hidden" }}>
              {ENCONTROS.map(e => {
                const prox = e.data === p?.data;
                return (
                  <li key={e.data} style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 12, padding: 10, borderRadius: prox ? 12 : 0, background: prox ? "rgba(0,191,216,.12)" : "transparent", borderTop: prox ? 0 : "1px solid rgba(255,255,255,.08)", fontSize: 13.5, lineHeight: 1.45 }}>
                    <span style={{ fontWeight: 900, color: T.teal300 }}>{diaMes(e.data)}{prox && <small style={{ display: "block", fontSize: 10, color: "#FF8FD4", fontWeight: 800 }}>próximo</small>}</span>
                    <span>{grupo === "homens" ? e.eixo : e[grupo]}</span>
                  </li>
                );
              })}
            </ul>
          </article>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: T.teal050, border: `1px solid ${T.teal100}`, borderRadius: 22, padding: mobile ? 16 : 20 }}>
              <b style={{ display: "block", fontSize: mobile ? 26 : 30, fontWeight: 900, color: T.teal700, lineHeight: 1 }}>60 min</b>
              <span style={{ display: "block", marginTop: 6, fontSize: 13, color: T.gray600, lineHeight: 1.45 }}>Presencial, no condomínio, uma quinta por mês.</span>
            </div>
            <a href="/acolhimento" className="enc-cta" style={{ background: `linear-gradient(135deg, ${T.mag500}, ${T.mag700})`, borderRadius: 22, padding: mobile ? 16 : 20, color: T.white, textDecoration: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 8, boxShadow: "0 12px 30px rgba(150,0,100,.25)" }}>
              <b style={{ fontSize: mobile ? 18 : 20, fontWeight: 900 }}>Tirar dúvidas</b>
              <span style={{ fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,.88)" }}>Ninguém precisa contar nada pessoal.</span>
            </a>
          </div>
        </div>
        <style>{`
          .enc-troca{animation:encEntra .45s cubic-bezier(.2,.7,.2,1)}
          @keyframes encEntra{from{opacity:0;transform:translateY(8px)}}
          .enc-lista{scrollbar-width:thin;scrollbar-color:rgba(0,191,216,.5) transparent}
          .enc-cta{transition:transform .3s}.enc-cta:hover{transform:translateY(-3px)}
          [role=tab]:focus-visible{outline:2px solid ${T.teal300};outline-offset:2px}
          @media (prefers-reduced-motion:reduce){.enc-troca{animation:none}}
        `}</style>

        <div style={{ marginTop: 16, padding: mobile ? 16 : "16px 24px", background: T.teal050, border: `1px solid ${T.teal100}`, borderRadius: 20 }}>
          <p style={{ fontSize: 14, color: T.gray600, lineHeight: 1.6, margin: 0, maxWidth: 720 }}>
            {p
              ? <><strong style={{ color: T.gray950 }}>Próximo encontro: {rotuloData(p)}</strong>, presencial, no condomínio. Não substitui psicoterapia; quem precisar de cuidado individual recebe orientação.</>
              : <><strong style={{ color: T.gray950 }}>Novo ciclo em breve.</strong> Não substitui psicoterapia; quem precisar de cuidado individual recebe orientação.</>}
          </p>
        </div>
      </div>
    </section>
  );
}
