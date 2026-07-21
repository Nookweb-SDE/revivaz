import React from "react";
import { AbsoluteFill, Sequence, Video, staticFile, interpolate, useCurrentFrame } from "remotion";
import { KenBurns } from "./shots/KenBurns";

export const FPS = 14;
export const TOTAL = 171;

const A = 60;   // plano aberto -> médio (crop da imagem-mãe)
const B = 55;   // close (vídeo)
const C = 56;   // ponto de vista (imagem OTS)
const X = 8;    // frames de sobreposição entre planos

/**
 * Entrada em fade nos primeiros X frames de um plano.
 *
 * O plano que sai NÃO recebe fade: ele fica em opacidade cheia por baixo e o
 * novo aparece por cima. É isso que faz um crossfade de verdade — se os dois
 * lados fizessem fade ao mesmo tempo, o fundo apareceria no meio e a emenda
 * daria um piscar preto (foi o defeito da primeira montagem).
 */
const FadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, X - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const HeroSequence: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#04080f" }}>
    {/* 1+2 · aberto -> médio: mesmo pixel, só recorte.
        Dura X frames a mais para servir de base enquanto o close entra. */}
    <Sequence durationInFrames={A + X}>
      <KenBurns
        src="mae.png"
        from={{ x: 0.02, y: 0.02, w: 0.96 }}
        to={{ x: 0.22, y: 0.10, w: 0.60 }}
        durationInFrames={A}
      />
    </Sequence>

    {/* 3 · close: vídeo, porque é onde piscar e respirar importam */}
    <Sequence from={A} durationInFrames={B + X}>
      <FadeIn>
        <Video src={staticFile("close.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </FadeIn>
    </Sequence>

    {/* 4 · ponto de vista: imagem real com tela do notebook pré-desenhada */}
    <Sequence from={A + B} durationInFrames={C}>
      <FadeIn>
        <KenBurns
          src="ots.png"
          from={{ x: 0.06, y: 0.06, w: 0.88 }}
          to={{ x: 0.20, y: 0.14, w: 0.64 }}
          durationInFrames={C}
        />
      </FadeIn>
    </Sequence>
  </AbsoluteFill>
);
