import React from "react";
import { interpolate, useCurrentFrame, staticFile } from "remotion";

export type Box = { x: number; y: number; w: number };

/**
 * Movimento de câmera digital sobre uma imagem estática.
 * É isto que trava a identidade: plano aberto e médio são o MESMO pixel,
 * só com recorte diferente — não há render novo para derivar.
 *
 * Box em fração da imagem: x/y = canto superior esquerdo, w = largura.
 * A altura sai do aspect 16:9 do frame.
 */
export const KenBurns: React.FC<{
  src: string;
  from: Box;
  to: Box;
  durationInFrames: number;
  /**
   * Overlays que precisam se mover E escalar exatamente como a imagem
   * (ex.: um clip-path recortando uma área desenhada nela). Vivem DENTRO do
   * mesmo wrapper transformado que a <img> — não como irmãos dela — para que
   * um clip-path estático continue alinhado o plano inteiro, mesmo com o
   * pan/zoom do Ken Burns em andamento. As frações usadas dentro dos filhos
   * (ex. clip-path em %) devem ser medidas contra a imagem-fonte INTEIRA,
   * porque é isso que este wrapper representa (100% = a imagem toda, não o
   * recorte visível no frame).
   */
  children?: React.ReactNode;
}> = ({ src, from, to, durationInFrames, children }) => {
  const frame = useCurrentFrame();
  const t = [0, durationInFrames - 1];

  const w = interpolate(frame, t, [from.w, to.w], { extrapolateRight: "clamp" });
  const x = interpolate(frame, t, [from.x, to.x], { extrapolateRight: "clamp" });
  const y = interpolate(frame, t, [from.y, to.y], { extrapolateRight: "clamp" });

  const scale = 1 / w;

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          width: `${scale * 100}%`,
          left: `${-x * scale * 100}%`,
          top: `${-y * scale * 100}%`,
        }}
      >
        <img
          src={staticFile(src)}
          alt=""
          style={{
            width: "100%",
            display: "block",
          }}
        />
        {children}
      </div>
    </div>
  );
};
