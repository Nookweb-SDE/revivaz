/* Conversa de acolhimento (ideia "Chat Bubble" do 21st.dev): a pessoa toca
   numa frase e vê como o assistente de /acolhimento responde. As respostas
   são exemplos fixos, tirados do que o assistente faz de verdade (respiração
   4-7-8, técnica 5-4-3-2-1, indicar profissional, CVV/SAMU em risco).
   Substitui o bloco "Como é um encontro", que repetia a seção de encontros. */
import { useEffect, useRef, useState, type CSSProperties } from "react";

type Bp = "mobile" | "tablet" | "desktop";

const T = {
  teal700: "#007A8C", teal300: "#00BFD8", teal100: "#D6F4F8", teal050: "#EDF9FB",
  navy: "#0B1D3A", mag700: "#8E1366", gray950: "#0D1117", gray600: "#4B5563", white: "#FFFFFF",
};

const SAUDACAO = "Oi. Que bom que você veio. Como você está se sentindo agora?";

const RESPOSTAS: { frase: string; resposta: [string, string, string] }[] = [
  { frase: "Estou com ansiedade", resposta: ["Entendo, ansiedade pesa mesmo. Vamos tentar uma respiração: ", "puxe o ar em 4", ", segure em 7 e solte devagar em 8. Quer repetir comigo umas 3 vezes?"] },
  { frase: "Não consigo dormir", resposta: ["Noites assim cansam. Posso te mostrar a técnica ", "5-4-3-2-1", ", que ajuda a mente a desacelerar. Se isso acontece há semanas, vale conversar com um profissional do projeto."] },
  { frase: "Quero falar com um psicólogo", resposta: ["Que bom que você quer cuidar disso. Pela sua conta você pede orientação para uma ", "consulta individual por vídeo", ", com profissionais voluntários com registro ativo. Posso te explicar como funciona?"] },
];

export function ConversaAcolhimento({ bp }: { bp: Bp }) {
  const mobile = bp === "mobile";
  const empilha = mobile || bp === "tablet";
  const [escolha, setEscolha] = useState<number | null>(0);
  const [digitando, setDigitando] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const escolher = (k: number) => {
    timers.current.forEach(clearTimeout);
    setEscolha(k);
    setDigitando(true);
    const parado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timers.current = [window.setTimeout(() => setDigitando(false), parado ? 0 : 1300)];
  };

  const balao = (ia: boolean): CSSProperties => ({
    maxWidth: mobile ? "88%" : "82%", padding: mobile ? "10px 14px" : "11px 15px", borderRadius: 18,
    fontSize: mobile ? 15 : 15.5, lineHeight: 1.5, alignSelf: ia ? "flex-start" : "flex-end",
    ...(ia
      ? { background: T.white, border: `1px solid ${T.teal100}`, borderBottomLeftRadius: 6, color: T.gray950 }
      : { background: T.navy, color: T.white, borderBottomRightRadius: 6 }),
  });

  const botao = (
    <a href="/acolhimento" className="ca-btn" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 50, padding: "0 26px", borderRadius: 9999, background: T.navy, color: T.white, fontWeight: 800, fontSize: 16, textDecoration: "none", width: mobile ? "100%" : "auto" }}>
      Começar conversa
    </a>
  );

  const r = escolha === null ? null : RESPOSTAS[escolha];

  return (
    <section aria-labelledby="ca-titulo" style={{ background: T.white, padding: mobile ? "48px 0" : "88px 0", color: T.navy }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: mobile ? "0 16px" : "0 clamp(20px,5vw,72px)", display: "grid", gridTemplateColumns: empilha ? "1fr" : "1fr 1.1fr", gap: empilha ? 28 : 64, alignItems: "center" }}>
        <div>
          <h2 id="ca-titulo" style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: mobile ? 30 : 42, lineHeight: 1.08, margin: "0 0 14px", maxWidth: "18ch" }}>
            Precisa conversar? Comece por aqui
          </h2>
          <p style={{ margin: 0, fontSize: mobile ? 16 : 16.5, lineHeight: 1.6, color: T.gray600, maxWidth: 440 }}>
            A conversa de acolhimento escuta, ensina técnicas de calma e mostra o próximo passo. Não é terapia nem diagnóstico. Quando é o caso, indica um profissional do projeto.
          </p>
          {!empilha && <div style={{ marginTop: 26 }}>{botao}</div>}
          {!empilha && <div style={{ marginTop: 14, fontSize: 14, color: T.gray600 }}>Funciona pelo navegador, sem instalar nada.</div>}
        </div>

        <div className="ca-chat" style={{ background: T.teal050, border: `1px solid ${T.teal100}`, borderRadius: mobile ? 22 : 28, padding: mobile ? 16 : 22, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: `1px solid ${T.teal100}` }}>
            <div aria-hidden="true" style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: `radial-gradient(circle at 35% 30%, ${T.white}, ${T.teal300} 40%, ${T.teal700})` }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: T.gray950 }}>Acolhimento Revivaz</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: T.gray600 }}>Exemplo de conversa</div>
            </div>
          </div>

          <div aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 0", minHeight: mobile ? 360 : empilha ? 250 : 305 }}>
            <div style={balao(true)}>{SAUDACAO}</div>
            {r && <div key={`eu${escolha}`} className="ca-sobe" style={balao(false)}>{r.frase}</div>}
            {r && (digitando
              ? <div className="ca-sobe" style={balao(true)} aria-label="Digitando"><span className="ca-dig"><i /><i /><i /></span></div>
              : <div key={`ia${escolha}`} className="ca-sobe" style={balao(true)}>{r.resposta[0]}<strong style={{ color: T.teal700 }}>{r.resposta[1]}</strong>{r.resposta[2]}</div>)}
          </div>

          <div role="group" aria-label="Escolha uma frase" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {RESPOSTAS.map((x, k) => (
              <button key={x.frase} type="button" className="ca-chip" onClick={() => escolher(k)} disabled={k === escolha || digitando} aria-pressed={k === escolha}
                style={{ minHeight: 44, padding: "0 16px", borderRadius: 9999, border: `1.5px solid ${T.teal700}`, background: T.white, color: T.teal700, font: "800 14.5px 'Nunito',sans-serif", cursor: "pointer", flex: mobile ? "1 1 100%" : "0 0 auto", textAlign: mobile ? "left" : "center" }}>
                {x.frase}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 13.5, fontWeight: 700, color: T.mag700, lineHeight: 1.45 }}>
            Em risco agora? Ligue <a href="tel:188" style={{ color: "inherit" }}>CVV 188</a> (24h, gratuito) ou <a href="tel:192" style={{ color: "inherit" }}>SAMU 192</a>.
          </div>
        </div>

        {empilha && (
          <div>
            {botao}
            <div style={{ marginTop: 12, fontSize: 14, color: T.gray600, textAlign: mobile ? "center" : "left" }}>Funciona pelo navegador, sem instalar nada.</div>
          </div>
        )}
      </div>

      <style>{`
        .ca-chip:hover:not(:disabled){background:${T.teal700}!important;color:${T.white}!important}
        .ca-chip:disabled{opacity:.45;cursor:default}
        .ca-chip:focus-visible,.ca-btn:focus-visible,.ca-chat a:focus-visible{outline:3px solid ${T.teal300};outline-offset:3px}
        .ca-sobe{animation:ca-sobe .35s ease both}
        @keyframes ca-sobe{from{opacity:0;transform:translateY(8px)}}
        .ca-dig{display:inline-flex;gap:4px;padding:4px 0}
        .ca-dig i{width:7px;height:7px;border-radius:50%;background:${T.teal700};opacity:.35;animation:ca-pisca 1s infinite}
        .ca-dig i:nth-child(2){animation-delay:.15s}.ca-dig i:nth-child(3){animation-delay:.3s}
        @keyframes ca-pisca{50%{opacity:1}}
        @media (prefers-reduced-motion:reduce){.ca-sobe,.ca-dig i{animation:none}}
      `}</style>
    </section>
  );
}
