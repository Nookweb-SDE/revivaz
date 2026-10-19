/* Celulares na rolagem (bloco "Sua conta Revivaz"), no estilo do vídeo de
   referência que o dono mandou em 18/10/2026: um celular gira de perfil para
   de frente e depois outros saem de trás dele em leque.
   Geometria pura e testável; o desenho fica em sections/CelularesRolagem.tsx. */

export const QTD = 5;

export type Pose = { x: number; y: number; z: number; ry: number; rz: number; opacity: number };

// posição final de cada celular (px, para palco de 1200 de largura); 0 = meio
const LEQUE: Omit<Pose, "opacity">[] = [
  { x: 0, y: 0, z: 60, ry: 0, rz: 0 },
  { x: -250, y: 40, z: -40, ry: 18, rz: -6 },
  { x: 250, y: 30, z: -40, ry: -18, rz: 6 },
  { x: -470, y: 90, z: -140, ry: 22, rz: -10 },
  { x: 470, y: 80, z: -140, ry: -22, rz: 10 },
];

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const suave = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** p de 0 a 1: até 0,3 o do meio gira; de 0,3 a 0,85 os outros abrem o leque. */
export function poseCelular(i: number, p: number): Pose {
  const fim = LEQUE[i];
  if (i === 0) {
    const t = suave(p / 0.3);
    return { x: 0, y: mix(30, fim.y, t), z: mix(-80, fim.z, t), ry: mix(75, 0, t), rz: mix(-22, 0, t), opacity: 1 };
  }
  const atraso = (i - 1) * 0.06;
  const t = suave((p - 0.3 - atraso) / 0.4);
  return {
    x: mix(0, fim.x, t), y: mix(0, fim.y, t), z: mix(-100, fim.z, t),
    ry: mix(0, fim.ry, t), rz: mix(0, fim.rz, t), opacity: t,
  };
}

// versão celular (tela em pé): cacho de 5, dois em cima, dois embaixo e o do
// meio na frente, como no vídeo de referência; y positivo = para baixo
const CACHO: Omit<Pose, "opacity">[] = [
  { x: 0, y: 0, z: 300, ry: 0, rz: 0 },
  { x: -185, y: -290, z: -70, ry: 16, rz: -5 },
  { x: 190, y: -235, z: -130, ry: -18, rz: 6 },
  { x: -195, y: 265, z: -40, ry: 14, rz: -8 },
  { x: 180, y: 315, z: -10, ry: -16, rz: 7 },
];

/** p de 0 a 1: até 0,28 um celular chega de perfil e vira; de 0,3 a 0,6 os
    outros saem de trás dele; flutuam; de 0,82 em diante voltam para trás. */
export function poseVertical(i: number, p: number): Pose {
  const fim = CACHO[i];
  const volta = suave((p - 0.82) / 0.16);
  if (i === 0) {
    const t = suave(p / 0.28);
    return { x: 0, y: mix(90, fim.y, t), z: mix(-320, fim.z * (1 - volta), t), ry: mix(110, 0, t), rz: mix(-25, 0, t), opacity: 1 };
  }
  const t = suave((p - 0.3 - (i - 1) * 0.04) / 0.22) * (1 - volta);
  return {
    x: mix(0, fim.x, t), y: mix(0, fim.y, t), z: mix(-120, fim.z, t),
    ry: mix(0, fim.ry, t), rz: mix(0, fim.rz, t), opacity: t,
  };
}

/** Altura da vista (unidades da cena): perto no início, longe com o cacho aberto. */
export function vistaVertical(p: number): number {
  const aberto = suave((p - 0.3) / 0.3) * (1 - suave((p - 0.82) / 0.18));
  return mix(2.7, 4.1, aberto);
}

/** Quanto da seção já rolou (0 a 1): top = topo da seção na tela. */
export function progressoRolagem(top: number, alturaSecao: number, alturaJanela: number): number {
  const curso = alturaSecao - alturaJanela;
  return curso <= 0 ? 1 : clamp(-top / curso);
}
