import React from "react";
import { staticFile } from "remotion";

/**
 * A tela de teleconsulta como a Revivaz a desenharia.
 * Tokens copiados de src/conta/ui.ts:3-20 — o projeto Remotion tem tsconfig
 * próprio e não compartilha paths com o site.
 *
 * Regras fixadas pela spec:
 *   - só o médico, sem PiP e sem sidebar
 *   - nenhum nome de médico ou paciente (a v3 inventou "Dr. Elias"/"Sarah M.")
 *   - copy em português
 */
const T = {
  teal300: "#00BFD8",
  navy: "#0B1D3A",
  red: "#E5484D",
  white: "#FFFFFF",
} as const;

export const TelaRevivaz: React.FC<{ medico: string }> = ({ medico }) => (
  <div
    style={{
      position: "relative",
      width: "100%",
      height: "100%",
      background: "#000",
      fontFamily: "'Nunito', sans-serif",
      overflow: "hidden",
    }}
  >
    <img
      src={staticFile(medico)}
      alt=""
      /* objectPosition: este componente está no repo como válido, mas SEM USO
         ATUAL (overlay foi removido conforme Plano B do brief). O
         objectPosition "50% 0%" foi calibrado para um clip-path corner-pin
         que foi abandonado. Quem for reutilizar este componente no futuro
         deve recalibrar este valor conforme a dimensão e proporção do
         recorte desejado. */
      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0%", display: "block" }}
    />

    {/* faixa superior: só o wordmark */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "11%",
        display: "flex",
        alignItems: "center",
        padding: "0 3%",
        background: "linear-gradient(180deg, rgba(11,29,58,.72), transparent)",
      }}
    >
      <span
        style={{
          color: T.teal300,
          fontWeight: 900,
          fontSize: "min(4.2vh, 34px)",
          letterSpacing: "-0.02em",
        }}
      >
        Revivaz
      </span>
    </div>

    {/* controles: três, discretos */}
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: "6%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "2.2%",
      }}
    >
      {[
        { bg: "rgba(255,255,255,.92)", fg: T.navy, label: "microfone" },
        { bg: "rgba(255,255,255,.92)", fg: T.navy, label: "câmera" },
        { bg: T.red, fg: T.white, label: "encerrar" },
      ].map((b) => (
        <div
          key={b.label}
          aria-label={b.label}
          style={{
            width: "min(7vh, 54px)",
            height: "min(7vh, 54px)",
            borderRadius: "50%",
            background: b.bg,
            boxShadow: "0 6px 16px rgba(0,0,0,.4)",
          }}
        />
      ))}
    </div>
  </div>
);
