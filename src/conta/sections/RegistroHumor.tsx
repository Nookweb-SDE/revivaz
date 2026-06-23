import React, { useState } from "react";
import { T, card, sectionTitle } from "../ui";

const EMOJIS = [
  { emoji: "😣", label: "Muito mal" },
  { emoji: "😟", label: "Mal" },
  { emoji: "😐", label: "Neutro" },
  { emoji: "🙂", label: "Bem" },
  { emoji: "😀", label: "Muito bem" },
] as const;

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

/** Returns a teal color shade based on value 0-4 */
function barColor(value: number): string {
  if (value === 0) return T.gray200;
  const shades: Record<number, string> = {
    1: T.teal100,
    2: T.teal300,
    3: T.teal500,
    4: T.teal700,
  };
  return shades[value] ?? T.teal500;
}

export default function RegistroHumor({ semana }: { semana: number[] }): JSX.Element {
  const [selecionado, setSelecionado] = useState<number | null>(null);

  const maxVal = 4;
  const barMaxHeight = 48; // px

  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={sectionTitle}>Registro de humor</h2>

      {/* Emoji picker card */}
      <div style={{ ...card, marginBottom: 12 }}>
        <p
          style={{
            margin: "0 0 16px",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: T.gray950,
          }}
        >
          Como você está hoje?
        </p>

        <div
          role="group"
          aria-label="Selecione seu humor"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          {EMOJIS.map(({ emoji, label }, idx) => {
            const isSelected = selecionado === idx;
            return (
              <button
                key={idx}
                aria-label={label}
                aria-pressed={isSelected}
                onClick={() => setSelecionado(idx)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "10px 4px",
                  borderRadius: 12,
                  border: isSelected
                    ? `2px solid ${T.teal500}`
                    : `2px solid transparent`,
                  background: isSelected ? T.teal050 : "transparent",
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s, transform 0.1s",
                  transform: isSelected ? "scale(1.08)" : "scale(1)",
                }}
              >
                <span
                  style={{
                    fontSize: 28,
                    lineHeight: 1,
                    filter: isSelected ? "none" : "grayscale(30%)",
                    transition: "filter 0.15s",
                  }}
                  aria-hidden="true"
                >
                  {emoji}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? T.teal700 : T.gray600,
                    textAlign: "center",
                    lineHeight: 1.2,
                    transition: "color 0.15s",
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Confirmation message */}
        {selecionado !== null && (
          <p
            style={{
              margin: "12px 0 0",
              fontSize: 12,
              color: T.teal700,
              fontWeight: 600,
              textAlign: "center",
            }}
            role="status"
            aria-live="polite"
          >
            ✓ Humor registrado: {EMOJIS[selecionado].label}
          </p>
        )}
      </div>

      {/* Weekly bar chart */}
      <div style={{ ...card, padding: "16px" }}>
        <p
          style={{
            margin: "0 0 12px",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            color: T.gray600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Esta semana
        </p>

        <div
          role="img"
          aria-label="Gráfico de humor da semana"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 6,
            height: barMaxHeight + 24, // bars + label space
          }}
        >
          {semana.slice(0, 7).map((val, idx) => {
            const height = val === 0 ? 4 : Math.round((val / maxVal) * barMaxHeight);
            const isToday = idx === 6;
            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {/* Bar */}
                <div
                  title={`${DIAS[idx]}: ${EMOJIS[Math.min(val, 4)]?.label ?? "—"}`}
                  style={{
                    width: "100%",
                    height,
                    minHeight: 4,
                    borderRadius: 6,
                    background: barColor(val),
                    transition: "height 0.3s ease",
                    outline: isToday ? `2px solid ${T.teal700}` : "none",
                    outlineOffset: 2,
                  }}
                />
                {/* Day label */}
                <span
                  style={{
                    fontSize: 10,
                    color: isToday ? T.teal700 : T.gray600,
                    fontWeight: isToday ? 700 : 500,
                  }}
                >
                  {DIAS[idx]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
