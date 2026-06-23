import { BookOpen, FileText, MessageCircle, Smile } from "lucide-react";
import { T, sectionTitle } from "../ui";

interface Tile {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const tiles: Tile[] = [
  {
    icon: <MessageCircle size={28} color={T.teal700} />,
    label: "Conversa IA",
    href: "/acolhimento",
  },
  {
    icon: <FileText size={28} color={T.teal700} />,
    label: "Receitas",
    href: "/receitas",
  },
  {
    icon: <Smile size={28} color={T.teal700} />,
    label: "Humor",
    href: "/humor",
  },
  {
    icon: <BookOpen size={28} color={T.teal700} />,
    label: "Autocuidado",
    href: "/autocuidado",
  },
];

export default function Atalhos(): JSX.Element {
  return (
    <section style={{ padding: "0 16px" }}>
      <h2 style={sectionTitle}>Acesso rápido</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        {tiles.map((tile) => (
          <a
            key={tile.label}
            href={tile.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              background: T.teal050,
              border: `1px solid ${T.teal100}`,
              borderRadius: 12,
              padding: "20px 12px",
              textDecoration: "none",
              cursor: "pointer",
              transition: "background 0.15s",
              minHeight: 90,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                T.teal100;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                T.teal050;
            }}
          >
            {tile.icon}
            <span
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: T.teal900,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {tile.label}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
