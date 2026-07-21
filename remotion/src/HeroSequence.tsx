import React from "react";
import { AbsoluteFill, Sequence, Video, staticFile, interpolate, useCurrentFrame } from "remotion";
import { KenBurns } from "./shots/KenBurns";

export const FPS = 14;
export const TOTAL = 171;

const A = 60;   // plano aberto -> médio (crop da imagem-mãe)
const B = 55;   // close (vídeo)
const C = 56;   // ponto de vista (imagem OTS)

/** Fade de saída nos últimos 8 frames de um plano. */
const Fade: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [dur - 8, dur - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const HeroSequence: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#04080f" }}>
    {/* 1+2 · aberto -> médio: mesmo pixel, só recorte */}
    <Sequence durationInFrames={A}>
      <Fade dur={A}>
        <KenBurns
          src="mae.png"
          from={{ x: 0.02, y: 0.02, w: 0.96 }}
          to={{ x: 0.22, y: 0.10, w: 0.60 }}
          durationInFrames={A}
        />
      </Fade>
    </Sequence>

    {/* 3 · close: vídeo, porque é onde piscar e respirar importam */}
    <Sequence from={A} durationInFrames={B}>
      <Fade dur={B}>
        <Video src={staticFile("close.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Fade>
    </Sequence>

    {/* 4 · ponto de vista: imagem real com tela do notebook pré-desenhada */}
    <Sequence from={A + B} durationInFrames={C}>
      <KenBurns
        src="ots.png"
        from={{ x: 0.06, y: 0.06, w: 0.88 }}
        to={{ x: 0.20, y: 0.14, w: 0.64 }}
        durationInFrames={C}
      />
    </Sequence>
  </AbsoluteFill>
);
