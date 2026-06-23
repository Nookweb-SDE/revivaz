import { T } from "./ui";

export default function CriseBar(): JSX.Element {
  return (
    <div
      role="complementary"
      aria-label="Barra de emergência"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: "#3D1212",
        borderTop: `2px solid ${T.red}`,
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color: "#FFD5D5",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        🆘 Emergência:{" "}
        <a
          href="tel:188"
          aria-label="Ligar para CVV 188"
          style={{
            color: "#FFB3B3",
            textDecoration: "underline",
            fontWeight: 800,
          }}
        >
          188 (CVV)
        </a>{" "}
        ·{" "}
        <a
          href="tel:192"
          aria-label="Ligar para SAMU 192"
          style={{
            color: "#FFB3B3",
            textDecoration: "underline",
            fontWeight: 800,
          }}
        >
          192 (SAMU)
        </a>
      </span>
    </div>
  );
}
