import React from "react";
import { Easing, Img, interpolate, useCurrentFrame, staticFile } from "remotion";

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
  /** Foco entrando (rack focus): blur em px no 1º frame, zera em `focusFrames`. */
  focusFrom?: number;
  focusFrames?: number;
}> = ({ src, from, to, durationInFrames, focusFrom = 0, focusFrames = 10 }) => {
  const frame = useCurrentFrame();
  const t = [0, durationInFrames - 1];
  // Câmera de cinema não arranca nem freia seco: entra e sai em curva.
  const opt = { extrapolateRight: "clamp" as const, easing: Easing.inOut(Easing.sin) };

  const w = interpolate(frame, t, [from.w, to.w], opt);
  const x = interpolate(frame, t, [from.x, to.x], opt);
  const y = interpolate(frame, t, [from.y, to.y], opt);
  const blur = focusFrom
    ? interpolate(frame, [0, focusFrames], [focusFrom, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })
    : 0;

  const scale = 1 / w;

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative", filter: blur ? `blur(${blur}px)` : undefined }}>
      <div
        style={{
          position: "absolute",
          width: `${scale * 100}%`,
          left: `${-x * scale * 100}%`,
          top: `${-y * scale * 100}%`,
        }}
      >
        {/* Img do Remotion, não <img>: ele segura o render até a imagem
            carregar. Com a tag pura os primeiros frames saíam pretos. */}
        <Img
          src={staticFile(src)}
          alt=""
          style={{
            width: "100%",
            display: "block",
          }}
        />
      </div>
    </div>
  );
};
