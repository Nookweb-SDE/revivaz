/**
 * Casca compartilhada das páginas legais (Política de Privacidade e Termos de
 * Uso). Existe para as duas serem idênticas: são documentos que a pessoa lê em
 * sequência, e diferença visual entre eles parece descuido.
 */
import React from "react";

export const T = {
  teal900: "#003D4A", teal700: "#007A8C", teal050: "#EFFAFC", teal100: "#C6EEF4",
  gray950: "#0F1720", gray700: "#39434D", gray600: "#5A6672",
  gray200: "#E2E8EC", gray050: "#F7FAFB", white: "#FFFFFF",
};
export const FONTE = "'Nunito', system-ui, sans-serif";

export const li: React.CSSProperties = { marginBottom: 8 };
export const tabela: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 10,
};
export const th: React.CSSProperties = {
  textAlign: "left", padding: "8px 10px", background: T.teal050,
  borderBottom: `2px solid ${T.teal100}`, fontWeight: 800, color: T.gray950,
};
export const td: React.CSSProperties = {
  padding: "8px 10px", borderBottom: `1px solid ${T.gray200}`, verticalAlign: "top",
};

export function Secao({
  n,
  titulo,
  children,
}: {
  n: string;
  titulo: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section style={{ marginBottom: 34 }}>
      <h2 style={{ fontSize: 19, fontWeight: 800, color: T.gray950, margin: "0 0 10px", lineHeight: 1.35 }}>
        <span style={{ color: T.teal700 }}>{n}.</span> {titulo}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.7, color: T.gray700 }}>{children}</div>
    </section>
  );
}

/** Aviso de que o texto ainda não passou por advogado. Some quando passar. */
export function AvisoSemRevisaoJuridica(): JSX.Element {
  return (
    <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12, padding: 14, marginBottom: 28 }}>
      <p style={{ margin: 0, fontSize: 14, color: "#7C2D12", lineHeight: 1.6 }}>
        <strong>Aviso de transparência:</strong> este documento descreve fielmente como a
        plataforma funciona hoje, mas <strong>ainda não passou por revisão jurídica</strong>.
        Publicamos assim, e não escondido, porque você tem direito de saber as regras desde o
        primeiro dia. Dúvidas ou correções:{" "}
        <a href="mailto:contato@revivaz.com.br" style={{ color: T.teal700 }}>contato@revivaz.com.br</a>.
      </p>
    </div>
  );
}

export function PaginaLegal({
  titulo,
  atualizadaEm,
  resumo,
  children,
}: {
  titulo: string;
  atualizadaEm: string;
  /** A ideia toda em uma frase, antes de qualquer seção. */
  resumo: React.ReactNode;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div style={{ background: T.gray050, minHeight: "100dvh", fontFamily: FONTE }}>
      <header style={{ background: T.white, borderBottom: `1px solid ${T.gray200}`, padding: "14px 20px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ fontWeight: 900, fontSize: 19, color: T.teal700, textDecoration: "none" }}>Revivaz</a>
          <a href="/" style={{ fontSize: 14, color: T.gray600, textDecoration: "none", fontWeight: 700 }}>Voltar ao site</a>
        </div>
      </header>

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "28px 20px 60px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: T.gray950, margin: "0 0 6px", lineHeight: 1.25 }}>
          {titulo}
        </h1>
        <p style={{ fontSize: 14, color: T.gray600, margin: "0 0 20px" }}>Atualizada em {atualizadaEm}.</p>

        <AvisoSemRevisaoJuridica />

        <div style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 14, padding: 18, marginBottom: 30 }}>
          <strong style={{ fontSize: 15, color: T.gray950 }}>Em uma frase</strong>
          <p style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.65, color: T.gray700 }}>{resumo}</p>
        </div>

        {children}

        <div style={{ borderTop: `1px solid ${T.gray200}`, paddingTop: 18, marginTop: 10, fontSize: 13, color: T.gray600 }}>
          <a href="/" style={{ color: T.teal700, fontWeight: 700, textDecoration: "none" }}>Voltar ao site</a>
          <span style={{ margin: "0 8px" }}>·</span>
          <a href="/privacidade" style={{ color: T.teal700, fontWeight: 700, textDecoration: "none" }}>Política de Privacidade</a>
          <span style={{ margin: "0 8px" }}>·</span>
          <a href="/termos" style={{ color: T.teal700, fontWeight: 700, textDecoration: "none" }}>Termos de Uso</a>
          <span style={{ margin: "0 8px" }}>·</span>
          <a href="/acolhimento" style={{ color: T.teal700, fontWeight: 700, textDecoration: "none" }}>Falar com o acolhimento</a>
        </div>
      </main>
    </div>
  );
}
