/* Como é um encontro (PDF da Flávia, §7 Metodologia e enquadre).
   Substitui o Bloco 9.5 "Quem atende você" (lista de especialidades),
   que não tinha relação com o projeto de psicologia comunitária. */

import { Clock3, Hand, EyeOff, Lock, Target, MapPin, type LucideIcon } from "lucide-react";

type Bp = "mobile" | "tablet" | "desktop";

const T = {
  teal700: "#007A8C", teal300: "#00BFD8", teal100: "#D6F4F8", teal050: "#EDF9FB",
  navy: "#0B1D3A", navy800: "#112240",
  gray950: "#0D1117", gray600: "#4B5563", gray200: "#E5E7EB", white: "#FFFFFF",
};

const ETAPAS = [
  { tempo: "5 a 10 min", titulo: "Acolhimento", texto: "Apresentação do tema e dos combinados do grupo." },
  { tempo: "10 a 15 min", titulo: "Tema do mês", texto: "Uma exposição breve para abrir a conversa." },
  { tempo: "20 a 25 min", titulo: "Roda de conversa", texto: "Uma dinâmica simples; fala quem quiser." },
  { tempo: "10 min", titulo: "Recursos práticos", texto: "O que levar para o dia a dia e onde buscar apoio." },
  { tempo: "5 min", titulo: "Fechamento", texto: "Avaliação rápida e o tema do próximo encontro." },
];

const COMBINADOS: { icon: LucideIcon; texto: string }[] = [
  { icon: Clock3, texto: "Respeito ao tempo de fala de cada um" },
  { icon: Hand, texto: "Ninguém precisa contar nada pessoal" },
  { icon: EyeOff, texto: "Histórias de outras pessoas não são expostas" },
  { icon: Lock, texto: "A privacidade de todos é preservada" },
  { icon: Target, texto: "A conversa fica no tema do encontro" },
];

export function ComoEEncontro({ bp }: { bp: Bp }) {
  const mobile = bp === "mobile";
  return (
    <section id="como-funciona" style={{ scrollMarginTop: 80, background: T.teal050, padding: mobile ? "36px 12px 40px" : "64px 16px 72px" }}>
      <div style={{ maxWidth: bp === "tablet" ? 720 : 1120, margin: "0 auto", padding: mobile ? 0 : "0 16px" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto", marginBottom: mobile ? 24 : 40 }}>
          <div style={{ fontSize: 12, color: T.teal700, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 8 }}>Como é um encontro</div>
          <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: mobile ? 22 : 30, color: T.gray950, lineHeight: 1.2, margin: "0 0 12px" }}>Uma hora, com começo, meio e fim</h2>
          <p style={{ fontSize: mobile ? 14 : 15, color: T.gray600, lineHeight: 1.7, margin: 0 }}>
            Cada encontro dura até 60 minutos e pode ser roda de conversa, palestra dialogada ou oficina breve, em linguagem acessível.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", gap: mobile ? 20 : 40, alignItems: "stretch" }}>
          <div style={{ width: mobile ? "100%" : "46%", flexShrink: 0, borderRadius: 22, overflow: "hidden", position: "relative", minHeight: mobile ? 200 : 360, background: T.navy800, boxShadow: "0 16px 40px rgba(11,29,58,.22)" }}>
            <img src="/revivaz/encontro-homens-roda.webp" alt="Vizinhos em roda de conversa com uma psicóloga no salão do condomínio" loading="lazy" decoding="async" width="800" height="480"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", bottom: 14, left: 14, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px 8px 11px", background: "rgba(255,255,255,.94)", borderRadius: 9999, boxShadow: "0 6px 18px rgba(11,29,58,.25)" }}>
              <MapPin size={14} color={T.teal700} strokeWidth={2.4} />
              <span style={{ fontSize: 12.5, color: T.navy, fontWeight: 800 }}>Presencial, no condomínio</span>
            </div>
          </div>

          <ol style={{ listStyle: "none", margin: 0, padding: 0, flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {ETAPAS.map((e, i) => (
              <li key={e.titulo} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px", background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 16 }}>
                <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", background: T.teal700, color: T.white, fontWeight: 800, fontSize: 14, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 10px" }}>
                    <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15, color: T.gray950 }}>{e.titulo}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.teal700 }}>{e.tempo}</span>
                  </div>
                  <p style={{ fontSize: 13, color: T.gray600, lineHeight: 1.55, margin: "2px 0 0" }}>{e.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div style={{ marginTop: mobile ? 20 : 32, display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0, 5fr) minmax(0, 7fr)", gap: mobile ? 20 : 48, padding: mobile ? "24px 20px" : "40px 44px", background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navy800} 100%)`, borderRadius: 24, color: T.white }}>
          <div>
            <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: mobile ? 22 : 28, lineHeight: 1.15, margin: "0 0 12px" }}>Combinados do grupo</h3>
            <p style={{ fontSize: mobile ? 14 : 15, color: "rgba(255,255,255,.74)", lineHeight: 1.65, margin: 0, maxWidth: 380 }}>
              Toda roda começa relembrando estes acordos. O encontro não é psicoterapia, avaliação nem diagnóstico; quem precisar de cuidado individual recebe orientação e encaminhamento.
            </p>
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {COMBINADOS.map(({ icon: Ic, texto }, k) => (
              <li key={texto} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderTop: k ? "1px solid rgba(255,255,255,.10)" : "none" }}>
                <span style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 12, background: "rgba(0,191,216,.14)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic size={18} color={T.teal300} strokeWidth={2.2} />
                </span>
                <span style={{ fontSize: mobile ? 14.5 : 15.5, fontWeight: 600, lineHeight: 1.4 }}>{texto}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
