import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { KenBurns } from "./shots/KenBurns";

export const FPS = 14;
export const TOTAL = 171;

// Cinco planos, todos na sala real à noite (Flow, 18/10/2026).
// Soma dos planos = TOTAL; cada um que sai dura +X por baixo do que entra.
const SHOTS = [
  // 1 · aberto: ela no sofá, sacada e prédio vizinho ao lado; câmera aproxima
  { src: "n1.jpg", d: 40, from: { x: 0.0, y: 0.0, w: 1.0 }, to: { x: 0.2, y: 0.12, w: 0.72 } },
  // 2 · médio-close: rosto na luz da tela, fundo em bokeh
  { src: "n2.jpg", d: 34, from: { x: 0.08, y: 0.04, w: 0.9 }, to: { x: 0.22, y: 0.08, w: 0.74 } },
  // 3 · detalhe: mãos no teclado, câmera desliza para a tela
  { src: "n3.jpg", d: 28, from: { x: 0.02, y: 0.12, w: 0.84 }, to: { x: 0.14, y: 0.1, w: 0.84 } },
  // 4 · por cima do ombro: aproxima da chamada com o psicólogo
  { src: "n4.jpg", d: 36, from: { x: 0.0, y: 0.0, w: 1.0 }, to: { x: 0.26, y: 0.26, w: 0.7 } },
  // 5 · a tela: o psicólogo ouvindo
  { src: "n5.jpg", d: 33, from: { x: 0.0, y: 0.03, w: 0.94 }, to: { x: 0.17, y: 0.35, w: 0.5 } },
];
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

const starts = SHOTS.map((_, i) => SHOTS.slice(0, i).reduce((a, b) => a + b.d, 0));

export const HeroSequence: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#04080f" }}>
    {SHOTS.map((s, i) => {
      const last = i === SHOTS.length - 1;
      const shot = (
        <KenBurns
          src={s.src}
          from={s.from}
          to={s.to}
          durationInFrames={s.d + (last ? 0 : X)}
          focusFrom={i === 0 ? 0 : 6}
        />
      );
      return (
        <Sequence key={s.src} from={starts[i]} durationInFrames={s.d + (last ? 0 : X)}>
          {i === 0 ? shot : <FadeIn>{shot}</FadeIn>}
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
