import React from "react";
import { Easing, Img, interpolate, useCurrentFrame, useVideoConfig, staticFile } from "remotion";

/**
 * Ponto da foto (cx/cy em fração dela) que a câmera segue, e quanto da
 * largura da foto cabe no quadro (w). A âncora diz onde esse ponto cai no
 * quadro: no celular o texto cobre a metade de baixo, então o rosto mora
 * no terço de cima.
 */
export type Mira = { cx: number; cy: number; w: number };

const RATIO = 1536 / 2752; // altura/largura das fotos n*.jpg

/**
 * Câmera digital para quadro em pé (9:16). O KenBurns do desktop assume
 * quadro 16:9; aqui a conta é em pixel e o recorte é preso às bordas da foto
 * para nunca mostrar fundo vazio.
 */
export const KenBurnsRetrato: React.FC<{
  src: string;
  from: Mira;
  to: Mira;
  durationInFrames: number;
  ancoraY?: number;
}> = ({ src, from, to, durationInFrames, ancoraY = 0.32 }) => {
  const frame = useCurrentFrame();
  const { width: FW, height: FH } = useVideoConfig();
  const opt = { extrapolateRight: "clamp" as const, easing: Easing.inOut(Easing.sin) };
  const t = [0, durationInFrames - 1];

  // nunca menor que o necessário para cobrir a altura do quadro
  const wMax = FW / (FH / RATIO);
  const w = Math.min(interpolate(frame, t, [from.w, to.w], opt), wMax);
  const cx = interpolate(frame, t, [from.cx, to.cx], opt);
  const cy = interpolate(frame, t, [from.cy, to.cy], opt);

  const imgW = FW / w;
  const imgH = imgW * RATIO;
  const left = Math.min(0, Math.max(FW - imgW, FW / 2 - cx * imgW));
  const top = Math.min(0, Math.max(FH - imgH, FH * ancoraY - cy * imgH));

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
      <Img src={staticFile(src)} alt="" style={{ position: "absolute", width: imgW, height: imgH, left, top }} />
    </div>
  );
};
