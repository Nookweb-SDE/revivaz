import { BookOpen, FileText, MessageCircle, Smile } from "lucide-react";
import { T, sectionTitle } from "../ui";

/* Os quatro atalhos apontavam para /acolhimento, /receitas, /humor e
   /autocuidado. Nenhuma dessas rotas existe: o /conta é uma página só, e o
   fallback de SPA devolvia a LANDING para as três últimas. Agora dois abrem o
   painel certo e dois rolam até a seção, que é onde o conteúdo realmente está. */
interface Tile {
  icon: React.ReactNode;
  label: string;
  /** Âncora dentro do /conta, ou undefined quando abre um painel. */
  href?: string;
  acao?: "chat" | "autocuidado";
}

const tiles: Tile[] = [
  {
    icon: <MessageCircle size={28} color={T.teal700} />,
    label: "Conversa IA",
    acao: "chat",
  },
  {
    icon: <FileText size={28} color={T.teal700} />,
    label: "Receitas",
    href: "#receitas-section",
  },
  {
    icon: <Smile size={28} color={T.teal700} />,
    label: "Humor",
    href: "#humor-section",
  },
  {
    icon: <BookOpen size={28} color={T.teal700} />,
    label: "Autocuidado",
    acao: "autocuidado",
  },
];

export default function Atalhos({
  onAbrirChat,
  onAbrirAutocuidado,
}: {
  onAbrirChat: () => void;
  onAbrirAutocuidado: () => void;
}): JSX.Element {
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
            href={tile.href ?? "#"}
            onClick={(e) => {
              if (!tile.acao) return;
              e.preventDefault();
              if (tile.acao === "chat") onAbrirChat();
              else onAbrirAutocuidado();
            }}
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
