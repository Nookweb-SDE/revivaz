import { User } from "lucide-react";
import { T } from "../ui";

export default function Header({ nome }: { nome: string }): JSX.Element {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: T.white,
        borderBottom: `1px solid ${T.gray200}`,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 4px rgba(0,0,0,.04)",
      }}
    >
      {/* Logo */}
      <span
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900,
          fontSize: 22,
          color: T.teal700,
          letterSpacing: "-0.5px",
          lineHeight: 1,
        }}
      >
        Revivaz
      </span>

      {/* Greeting + profile icon */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: T.gray700,
          }}
        >
          Olá, {nome} 👋
        </span>
        <button
          aria-label="Perfil do usuário"
          style={{
            background: T.teal050,
            border: `1px solid ${T.teal100}`,
            borderRadius: 10,
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <User size={18} color={T.teal700} />
        </button>
      </div>
    </header>
  );
}
