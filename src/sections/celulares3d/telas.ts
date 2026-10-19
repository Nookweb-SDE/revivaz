/* Telas dos celulares 3D, desenhadas em canvas 2D para virar textura.
   Coordenadas lógicas de 214 x 455 (a tela de um celular de 230 px); o canvas
   real é ESC vezes maior para ficar nítido de perto.
   Conteúdo é o que existe de verdade: encontro do mês (site), respiração,
   humor, consulta e ajuda (conta). */

export const TELA_W = 214, TELA_H = 455, ESC = 4;

const C = {
  teal700: "#007A8C", teal300: "#00BFD8", teal100: "#D6F4F8", teal050: "#EDF9FB",
  navy: "#0B1D3A", navy800: "#112240", mag700: "#8E1366", mag500: "#B4157E",
  gray950: "#0D1117", gray600: "#4B5563", gray200: "#E5E7EB", white: "#FFFFFF",
};

type Ctx = CanvasRenderingContext2D;

const rr = (c: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath(); c.roundRect(x, y, w, h, r);
};
const caixa = (c: Ctx, x: number, y: number, w: number, h: number, r: number, fundo: string | CanvasGradient, borda?: string) => {
  rr(c, x, y, w, h, r); c.fillStyle = fundo; c.fill();
  if (borda) { c.strokeStyle = borda; c.lineWidth = 1; c.stroke(); }
};
const texto = (c: Ctx, s: string, x: number, y: number, tam: number, peso: number, cor: string, alinha: CanvasTextAlign = "left") => {
  c.font = `${peso} ${tam}px Nunito, sans-serif`; c.fillStyle = cor; c.textAlign = alinha; c.fillText(s, x, y);
};
const gradiente = (c: Ctx, x: number, y: number, w: number, h: number, a: string, b: string) => {
  const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, a); g.addColorStop(1, b); return g;
};

function moldura(c: Ctx, fundo: string, secao: string, aba: number) {
  c.fillStyle = fundo; c.fillRect(0, 0, TELA_W, TELA_H);
  texto(c, "9:41", 22, 24, 11, 800, C.gray950);
  caixa(c, 184, 15, 16, 8, 2, C.gray950);                     // bateria
  caixa(c, 70, 9, 74, 22, 11, "#000");                         // ilha da câmera
  texto(c, "Revivaz", 14, 60, 16, 900, C.teal700);
  texto(c, secao, 200, 60, 10, 700, C.gray600, "right");
  // barra de abas
  c.fillStyle = C.white; c.fillRect(0, TELA_H - 46, TELA_W, 46);
  c.fillStyle = C.gray200; c.fillRect(0, TELA_H - 46, TELA_W, 1);
  for (let k = 0; k < 4; k++) {
    const x = 34 + k * 49;
    caixa(c, x - 9, TELA_H - 34, 18, 18, 6, k === aba ? C.teal700 : C.teal100);
  }
  caixa(c, 72, TELA_H - 9, 70, 4, 2, C.gray950);               // indicador de início
}

function encontros(c: Ctx) {
  moldura(c, C.teal050, "Encontros", 0);
  caixa(c, 12, 76, 190, 96, 16, gradiente(c, 12, 76, 190, 96, C.navy, C.navy800));
  texto(c, "Próximo encontro", 26, 98, 10, 800, C.teal300);
  texto(c, "Qui, 26/11", 26, 130, 26, 900, C.white);
  texto(c, "Relações sem violência", 26, 154, 11, 600, "rgba(255,255,255,.82)");
  caixa(c, 12, 184, 190, 50, 14, C.white, C.gray200);
  texto(c, "18h  Adolescentes", 26, 205, 11, 800, C.teal700);
  texto(c, "12 a 17 anos", 26, 222, 10, 600, C.gray600);
  caixa(c, 12, 242, 190, 50, 14, C.white, C.gray200);
  texto(c, "19h  Mulheres", 26, 263, 11, 800, C.mag500);
  texto(c, "A partir de 18 anos", 26, 280, 10, 600, C.gray600);
  caixa(c, 12, 300, 190, 40, 14, C.white, C.gray200);
  caixa(c, 24, 313, 14, 14, 3, C.teal100); caixa(c, 24, 313, 14, 4, 2, C.teal700);
  texto(c, "Uma quinta por mês", 46, 324, 10, 700, C.gray600);
}

function respiracao(c: Ctx, t: number) {
  moldura(c, C.white, "Autocuidado", 1);
  texto(c, "Respiração guiada", 107, 100, 16, 800, C.gray950, "center");
  // ciclo de 10 s: 4 s inspira, 6 s solta
  const f = t % 10, inspira = f < 4;
  const k = inspira ? f / 4 : 1 - (f - 4) / 6;
  const e = k * k * (3 - 2 * k), r = 40 + 22 * e;
  for (let a = 3; a >= 1; a--) {
    c.beginPath(); c.arc(107, 216, r + a * 12, 0, Math.PI * 2);
    c.fillStyle = `rgba(0,191,216,${0.05 * (4 - a)})`; c.fill();
  }
  const g = c.createRadialGradient(107, 206, 4, 107, 216, r);
  g.addColorStop(0, C.white); g.addColorStop(0.35, C.teal300); g.addColorStop(1, C.teal700);
  c.beginPath(); c.arc(107, 216, r, 0, Math.PI * 2); c.fillStyle = g; c.fill();
  texto(c, inspira ? "Inspire" : "Solte devagar", 107, 316, 15, 800, C.teal700, "center");
  texto(c, "4 s para dentro, 6 s para fora", 107, 336, 10, 600, C.gray600, "center");
}

function humor(c: Ctx) {
  moldura(c, C.white, "Humor", 2);
  texto(c, "Como você está hoje?", 14, 100, 15, 800, C.gray950);
  [0.3, 0.48, 0.66, 0.84, 1].forEach((o, k) => {
    const x = 30 + k * 38.5, y = 136;
    if (k === 3) { c.beginPath(); c.arc(x, y, 17, 0, Math.PI * 2); c.strokeStyle = C.teal700; c.lineWidth = 2; c.stroke(); }
    c.beginPath(); c.arc(x, y, 13, 0, Math.PI * 2); c.fillStyle = `rgba(0,191,216,${o})`; c.fill();
    c.fillStyle = C.white;
    c.beginPath(); c.arc(x - 4, y - 3, 1.6, 0, Math.PI * 2); c.arc(x + 4, y - 3, 1.6, 0, Math.PI * 2); c.fill();
    const curva = (k - 2) * 1.3;
    c.beginPath(); c.moveTo(x - 5, y + 4 - curva / 2); c.quadraticCurveTo(x, y + 4 + curva, x + 5, y + 4 - curva / 2);
    c.strokeStyle = C.white; c.lineWidth = 1.6; c.stroke();
  });
  texto(c, "Sua semana", 14, 192, 11, 800, C.gray600);
  const alturas = [40, 55, 35, 65, 70, 60, 82];
  alturas.forEach((h, k) => {
    const bh = 90 * h / 100, x = 18 + k * 26;
    caixa(c, x, 296 - bh, 18, bh, 5, k === 6 ? C.teal700 : C.teal100);
    texto(c, "STQQSSD"[k], x + 9, 312, 9, 700, C.gray600, "center");
  });
}

function consulta(c: Ctx) {
  moldura(c, C.teal050, "Consultas", 3);
  caixa(c, 12, 76, 190, 116, 16, C.white, C.gray200);
  caixa(c, 24, 90, 32, 32, 10, C.teal100);
  caixa(c, 31, 101, 12, 10, 2, C.teal700);
  c.beginPath(); c.moveTo(44, 106); c.lineTo(50, 102); c.lineTo(50, 110); c.closePath(); c.fillStyle = C.teal700; c.fill();
  texto(c, "Consulta individual", 64, 104, 12, 800, C.gray950);
  texto(c, "Por vídeo ou presencial", 64, 119, 10, 600, C.gray600);
  caixa(c, 24, 140, 166, 36, 11, C.teal700);
  texto(c, "Pedir orientação", 107, 163, 11, 800, C.white, "center");
  caixa(c, 12, 202, 190, 62, 16, C.white, C.gray200);
  texto(c, "Quando o encontro não basta,", 24, 228, 10, 600, C.gray600);
  texto(c, "a equipe orienta o próximo passo.", 24, 244, 10, 600, C.gray600);
}

function ajuda(c: Ctx) {
  moldura(c, C.white, "Ajuda", 3);
  texto(c, "Precisa de ajuda agora?", 14, 100, 15, 800, C.gray950);
  [["CVV 188", "Apoio emocional, 24 horas", 118], ["SAMU 192", "Emergência médica", 180]].forEach(([n, s, y]) => {
    const yy = y as number;
    caixa(c, 12, yy, 190, 52, 15, gradiente(c, 12, yy, 190, 52, C.mag700, C.mag500));
    c.beginPath(); c.arc(38, yy + 26, 13, 0, Math.PI * 2); c.fillStyle = "rgba(255,255,255,.2)"; c.fill();
    caixa(c, 34, yy + 19, 8, 14, 3, C.white);
    texto(c, n as string, 60, yy + 24, 14, 900, C.white);
    texto(c, s as string, 60, yy + 39, 9, 600, "rgba(255,255,255,.85)");
  });
  texto(c, "A ligação é gratuita.", 14, 262, 10, 600, C.gray600);
}

/** Desenha a tela i (0 encontros, 1 respiração, 2 humor, 3 consulta, 4 ajuda). */
export function desenharTela(canvas: HTMLCanvasElement, i: number, t = 0) {
  const c = canvas.getContext("2d")!;
  c.setTransform(ESC, 0, 0, ESC, 0, 0);
  [encontros, (cc: Ctx) => respiracao(cc, t), humor, consulta, ajuda][i](c);
}
