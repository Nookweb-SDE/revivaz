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
      >
        {/* Corner-pin por clip-path, medido uma vez sobre ots.png (2752x1536),
            em % da IMAGEM INTEIRA — não do frame renderizado.
            A spec previa gerar a imagem com a tela em verde e fazer chroma key;
            clip-path chega ao mesmo resultado sem regerar a imagem nem
            implementar recorte por cor — a tela desenhada em ots.png fica
            simplesmente coberta.
            Crítico: este overlay é FILHO do wrapper que o KenBurns escala/move
            junto com a <img> (não mais irmão dela) — por isso o polígono
            estático continua alinhado com a moldura do notebook o plano
            inteiro, mesmo com o zoom/pan em andamento. */}
        <AbsoluteFill
          style={{
            clipPath: "polygon(45.5% 53.6%, 68.1% 54.9%, 67.2% 83.5%, 44.0% 79.4%)",
          }}
        >
          <TelaRevivaz medico="medico.png" />
        </AbsoluteFill>
      </KenBurns>
    </Sequence>
  </AbsoluteFill>
);
