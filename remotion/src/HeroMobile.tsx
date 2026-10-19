import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { KenBurnsRetrato } from "./shots/KenBurnsRetrato";

export const FPS_M = 30;

// Celular: toca sozinho, sem rolar. Ela no sofá; depois a tela do notebook
// com o psicólogo. Só vai: termina parado no psicólogo, não volta.
const S1 = 120; // ela no sofá, câmera chega perto
const S2 = 165; // por cima do ombro até o rosto do psicólogo
const X = 18;   // crossfade
export const TOTAL_M = S1 + S2;

const FadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, X - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const HeroMobile: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#04080f" }}>
    <Sequence from={0} durationInFrames={S1 + X}>
      <KenBurnsRetrato src="n1.jpg" durationInFrames={S1 + X}
        from={{ cx: 0.46, cy: 0.38, w: 0.32 }} to={{ cx: 0.46, cy: 0.38, w: 0.25 }} />
    </Sequence>
    <Sequence from={S1} durationInFrames={S2}>
      <FadeIn>
        <KenBurnsRetrato src="n5.jpg" durationInFrames={S2}
          from={{ cx: 0.45, cy: 0.5, w: 0.32 }} to={{ cx: 0.49, cy: 0.6, w: 0.2 }} ancoraY={0.35} />
      </FadeIn>
    </Sequence>
  </AbsoluteFill>
);
