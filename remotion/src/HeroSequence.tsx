import React from "react";
import { AbsoluteFill, Sequence, Video, staticFile, interpolate, useCurrentFrame } from "remotion";
import { KenBurns } from "./shots/KenBurns";
import { TelaRevivaz } from "./ui/TelaRevivaz";

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

    {/* 4 · ponto de vista: tela real composta sobre a imagem */}
    <Sequence from={A + B} durationInFrames={C}>
      <KenBurns
        src="ots.png"
        from={{ x: 0.06, y: 0.06, w: 0.88 }}
        to={{ x: 0.20, y: 0.14, w: 0.64 }}
        durationInFrames={C}
      />
      {/* Corner-pin por clip-path, medido uma vez sobre ots.png.
          A spec previa gerar a imagem com a tela em verde e fazer chroma key;
          clip-path chega ao mesmo resultado sem regerar a imagem nem
          implementar recorte por cor — a tela desenhada em ots.png fica
          simplesmente coberta. A imagem é estática, então os cantos não mudam. */}
      <AbsoluteFill
        style={{
          clipPath: "polygon(43.8% 55.5%, 70.3% 57.0%, 69.6% 96.0%, 40.9% 90.4%)",
        }}
      >
        <TelaRevivaz medico="medico.png" />
      </AbsoluteFill>
    </Sequence>
  </AbsoluteFill>
);
