/* Psicólogos parceiros: os rostos ficam
   lado a lado em faixas e passar o mouse (ou tocar) abre a pessoa com CRP,
   abordagem e botão do WhatsApp. No celular vira lista que expande.
   Substitui o bloco "Consulta por vídeo": não há atendimento online, a pessoa
   fala direto com o profissional. Sem valor e sem horário (pedido da Flávia, 28/10).
   Flávia e Walter primeiro, o resto em ordem alfabética (dono, 28/10). */
import { useState } from "react";

type Bp = "mobile" | "tablet" | "desktop";

const T = {
  teal900: "#004E5A", teal700: "#007A8C", teal300: "#00BFD8", teal100: "#D6F4F8", teal050: "#EDF9FB",
  gray950: "#0D1117", gray600: "#4B5563", white: "#FFFFFF", whats: "#1FA855",
};

type Psicologo = {
  nome: string; curto: string; crp: string; abordagem: string;
  especializacoes: string[]; tel: string; wa: string; foto: string; foco: string;
};

const PSICOLOGOS: Psicologo[] = [
  { nome: "Flávia Magalhães Farias Lima", curto: "Flávia", crp: "06/236718", abordagem: "Psicanalítica",
    especializacoes: ["Pós-graduanda em Sexologia, Psicanálise e Neuropsicanálise"],
    tel: "(11) 97970-0536", wa: "5511979700536", foto: "flavia", foco: "50% 30%" },
  { nome: "Walter Aparecido Santos", curto: "Walter", crp: "06/55994-8", abordagem: "Psicólogo clínico",
    especializacoes: ["Gerontólogo", "Especialização em Dependência Química", "Psicopedagogo institucional"],
    tel: "(11) 98117-6518", wa: "5511981176518", foto: "walter", foco: "50% 40%" },
  { nome: "Fabiana Farias", curto: "Fabiana", crp: "06/234608", abordagem: "Humanista-Existencial",
    especializacoes: ["Pós-graduada em Abordagem Centrada na Pessoa e Saúde da Família", "Capacitação em Prevenção ao Suicídio"],
    tel: "(11) 95871-0606", wa: "5511958710606", foto: "fabiana", foco: "50% 35%" },
  { nome: "Mariana Alves", curto: "Mariana", crp: "06/236420", abordagem: "Psicanálise",
    especializacoes: ["Psicanalista", "Neuropsicóloga"],
    tel: "(11) 98208-0367", wa: "5511982080367", foto: "mariana", foco: "55% 40%" },
  { nome: "Sabrina Bezerra Meira", curto: "Sabrina", crp: "06/225787", abordagem: "Terapia Cognitivo-Comportamental (TCC)",
    especializacoes: [],
    tel: "(11) 98183-2420", wa: "5511981832420", foto: "sabrina", foco: "50% 28%" },
];

const linkWhats = (p: Psicologo) =>
  `https://wa.me/${p.wa}?text=${encodeURIComponent(`Olá, ${p.curto}! Vim pelo site do Revivaz e gostaria de saber sobre o atendimento psicológico.`)}`;

function IconeWhats() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8.2 8.2 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9c2 .9 2.8.9 3.8.8.6-.1 1.8-.7 2.1-1.5s.3-1.3.2-1.5-.3-.2-.6-.3zM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zm0-21.6A11.8 11.8 0 0 0 1.8 17.9L.1 24l6.3-1.6A11.8 11.8 0 1 0 12 .2z" />
    </svg>
  );
}

export function Psicologos({ bp }: { bp: Bp }) {
  const mobile = bp === "mobile";
  const [aberto, setAberto] = useState(0);
  // no PC basta passar o mouse; no toque, abre ao tocar
  const comMouse = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  return (
    <section id="psicologos" className={`psi${mobile ? " psi-cel" : ""}`} aria-labelledby="psi-titulo"
      style={{ padding: mobile ? "56px 20px" : bp === "tablet" ? "40px 20px" : "64px 16px", background: T.white }}>
      <style>{`
        .psi-faixas{display:flex;gap:12px;height:${bp === "tablet" ? 480 : 540}px}
        .psi-faixa{position:relative;flex:1;min-width:0;border-radius:24px;overflow:hidden;cursor:pointer;background:${T.teal900};color:${T.white};
          transition:flex .6s cubic-bezier(.22,.8,.2,1),height .6s cubic-bezier(.22,.8,.2,1)}
        .psi-faixa.aberta{flex:${bp === "tablet" ? 4 : 5};cursor:default}
        .psi-faixa>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(.7) brightness(.75);transition:filter .6s}
        .psi-faixa.aberta>img{filter:none}
        .psi-faixa::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,40,48,0) 35%,rgba(0,40,48,.88) 100%);pointer-events:none}
        .psi-nome-v{position:absolute;left:50%;bottom:26px;z-index:1;transform:translateX(-50%) rotate(180deg);writing-mode:vertical-rl;font-weight:900;font-size:${bp === "tablet" ? 17 : 20}px;white-space:nowrap;transition:opacity .3s}
        .psi-faixa.aberta .psi-nome-v{opacity:0}
        .psi-info{position:absolute;left:0;right:0;bottom:0;z-index:1;padding:${bp === "tablet" ? 22 : 28}px;opacity:0;transform:translateY(16px);transition:opacity .35s .15s,transform .45s .15s;pointer-events:none;visibility:hidden}
        .psi-faixa.aberta .psi-info{opacity:1;transform:none;pointer-events:auto;visibility:visible}
        .psi-whats{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:0 22px;border-radius:999px;background:${T.whats};color:${T.white};font-weight:800;font-size:15px;text-decoration:none;transition:filter .2s}
        .psi-whats:hover{filter:brightness(.9)}
        .psi-faixa:focus-visible,.psi-whats:focus-visible{outline:3px solid ${T.teal300};outline-offset:3px}
        .psi-cel .psi-faixas{flex-direction:column;height:auto;gap:8px}
        .psi-cel .psi-faixa{flex:none;height:72px;border-radius:20px}
        .psi-cel .psi-faixa.aberta{height:520px}
        .psi-cel .psi-nome-v{writing-mode:horizontal-tb;transform:translateY(-50%);left:84px;top:50%;bottom:auto;font-size:17px}
        .psi-cel .psi-faixa:not(.aberta){background:${T.teal050};color:${T.teal900}}
        .psi-cel .psi-faixa:not(.aberta)>img{width:72px;height:72px;filter:none;border-radius:20px}
        .psi-cel .psi-faixa:not(.aberta)::after{background:none}
        .psi-cel .psi-faixa:not(.aberta)::before{content:"+";position:absolute;right:22px;top:50%;transform:translateY(-50%);font-size:26px;font-weight:700;color:${T.teal700}}
        .psi-cel .psi-whats{width:100%}
        @media (prefers-reduced-motion: reduce){.psi-faixa,.psi-faixa *{transition:none!important}}
      `}</style>
      <div style={{ maxWidth: mobile ? 9999 : bp === "tablet" ? 720 : 1120, margin: "0 auto" }}>
        <div style={{ fontSize: 12, color: T.teal700, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 8 }}>Atendimento psicológico</div>
        <h2 id="psi-titulo" style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: mobile ? 26 : bp === "tablet" ? 22 : 30, color: T.gray950, margin: "0 0 8px" }}>Psicólogos parceiros do Revivaz</h2>
        <p style={{ fontSize: mobile ? 15 : 14, color: T.gray600, margin: `0 0 ${mobile ? 24 : 32}px`, maxWidth: 560 }}>
          {comMouse && !mobile ? "Passe o mouse" : "Toque"} em um rosto para ver a abordagem e falar direto pelo WhatsApp.
        </p>
        <div className="psi-faixas">
          {PSICOLOGOS.map((p, k) => (
            <div key={p.nome} className={`psi-faixa${k === aberto ? " aberta" : ""}`} role="button" tabIndex={0}
              aria-expanded={k === aberto} aria-label={p.nome}
              onClick={(e) => { if (!(e.target as HTMLElement).closest("a")) setAberto(k); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAberto(k); } }}
              onMouseEnter={() => { if (comMouse && !mobile) setAberto(k); }}>
              <img src={`/revivaz/psicologos/${p.foto}.webp`} alt={`Foto de ${p.nome}`} loading="lazy" draggable={false} style={{ objectPosition: p.foco }} />
              <span className="psi-nome-v" aria-hidden="true">{p.curto}</span>
              <div className="psi-info">
                <h3 style={{ margin: 0, fontSize: mobile ? 22 : bp === "tablet" ? 23 : 28, fontWeight: 900, lineHeight: 1.15 }}>{p.nome}</h3>
                <div style={{ color: T.teal300, fontSize: 14, fontWeight: 700 }}>CRP {p.crp}</div>
                <span style={{ display: "inline-block", marginTop: 12, padding: "6px 13px", borderRadius: 999, background: "rgba(255,255,255,.16)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", fontWeight: 800, fontSize: 14 }}>{p.abordagem}</span>
                {p.especializacoes.length > 0 && (
                  <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.5, color: "rgba(255,255,255,.85)", maxWidth: 520 }}>{p.especializacoes.join(" · ")}</p>
                )}
                <div style={{ marginTop: 18, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <a className="psi-whats" href={linkWhats(p)} target="_blank" rel="noopener noreferrer" tabIndex={k === aberto ? 0 : -1}>
                    <IconeWhats /> Chamar no WhatsApp
                  </a>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.85)" }}>{p.tel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
