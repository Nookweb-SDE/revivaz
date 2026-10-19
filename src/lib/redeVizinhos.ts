/* Rede de vizinhos: janelas de um prédio acendem e se ligam por fios de luz.
   Substitui o ECG (batimento cardíaco não tem a ver com saúde mental).
   Geometria pura e testável; o desenho fica em sections/RedeVizinhos.tsx. */

export const CICLO = 9; // segundos de um ciclo completo (acende, liga, apaga)

export type Janela = { col: number; row: number; acende: number; destaque: boolean };
export type Ligacao = [number, number];

export function montarRede(cols: number, rows: number, rnd: () => number = Math.random): { janelas: Janela[]; ligacoes: Ligacao[] } {
  const janelas: Janela[] = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++)
      janelas.push({ col, row, acende: rnd() * (CICLO - 3), destaque: rnd() < 0.08 });

  const ligacoes: Ligacao[] = [];
  for (let i = 0; i < janelas.length; i++) {
    const { col, row } = janelas[i];
    if (col + 1 < cols && rnd() < 0.45) ligacoes.push([i, i + 1]);
    if (row + 1 < rows && rnd() < 0.45) ligacoes.push([i, i + cols]);
  }
  return { janelas, ligacoes };
}

/** 0..1: acende em meio segundo e apaga junto com o fim do ciclo. */
export function intensidade(t: number, acende: number): number {
  const sobe = Math.min(1, Math.max(0, (t - acende) * 2));
  const fim = Math.min(1, Math.max(0, CICLO - t));
  return sobe * fim;
}
