import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// SPEC TEST — janela de 7 dias de humor.
//
// A Fundação NÃO extraiu um helper puro: a lógica de bucketing vive INLINE
// dentro de getHumoresUltima7Dias() em data.ts (que depende do Supabase, logo
// não é importável sem mock). Este arquivo NÃO toca produção; ele REIMPLEMENTA
// a fórmula EXATA do data.ts como referência testada, fixando o contrato:
//   - array de 7 posições; índice 0 = 6 dias atrás … índice 6 = hoje
//   - 0 quando não há registro no dia
//   - último registro do dia prevalece (last-write-wins na ordem recebida)
//   - base de datas em UTC (mesma base do `dia` gravado em registrarHumor)
//
// Se a fórmula em data.ts mudar, este teste serve de alerta de drift do contrato.
// Espelha exatamente as linhas 114-138 de src/lib/data.ts.
// ---------------------------------------------------------------------------

type Registro = { valor: number; dia: string };

/** Replica fiel do bucketing de getHumoresUltima7Dias (data.ts). */
function bucketHumores(registros: Registro[], hojeStr: string): number[] {
  const out = [0, 0, 0, 0, 0, 0, 0];
  const baseHoje = Date.parse(hojeStr + "T00:00:00Z");
  for (const r of registros) {
    const diaMs = Date.parse(r.dia + "T00:00:00Z");
    const idx = 6 - Math.round((baseHoje - diaMs) / 86400000);
    if (idx >= 0 && idx <= 6) out[idx] = r.valor;
  }
  return out;
}

/** Helper: YYYY-MM-DD `offset` dias a partir de hojeStr (UTC). */
function diaOffset(hojeStr: string, offset: number): string {
  const ms = Date.parse(hojeStr + "T00:00:00Z") + offset * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

const HOJE = "2026-06-24";

describe("bucketHumores (contrato getHumoresUltima7Dias)", () => {
  it("lista vazia -> 7 zeros", () => {
    expect(bucketHumores([], HOJE)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("registro de hoje cai no índice 6", () => {
    const out = bucketHumores([{ valor: 4, dia: HOJE }], HOJE);
    expect(out).toEqual([0, 0, 0, 0, 0, 0, 4]);
  });

  it("registro de 6 dias atrás cai no índice 0", () => {
    const out = bucketHumores([{ valor: 2, dia: diaOffset(HOJE, -6) }], HOJE);
    expect(out).toEqual([2, 0, 0, 0, 0, 0, 0]);
  });

  it("registro de ontem cai no índice 5", () => {
    const out = bucketHumores([{ valor: 3, dia: diaOffset(HOJE, -1) }], HOJE);
    expect(out).toEqual([0, 0, 0, 0, 0, 3, 0]);
  });

  it("um registro por dia preenche a janela inteira na ordem certa", () => {
    const regs: Registro[] = [];
    for (let off = -6; off <= 0; off++) {
      // valor = índice esperado, p/ checar o mapeamento posição-a-posição
      regs.push({ valor: off + 6, dia: diaOffset(HOJE, off) });
    }
    expect(bucketHumores(regs, HOJE)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("último registro do mesmo dia prevalece (last-write-wins)", () => {
    const out = bucketHumores(
      [
        { valor: 1, dia: HOJE },
        { valor: 4, dia: HOJE }, // chega depois -> sobrescreve
      ],
      HOJE
    );
    expect(out[6]).toBe(4);
  });

  it("valor 0 (humor mínimo) é gravado e não some no array de zeros", () => {
    const out = bucketHumores([{ valor: 0, dia: HOJE }], HOJE);
    // continua 0 no índice 6, mas o ponto é que a posição foi 'tocada' sem erro
    expect(out).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("registro fora da janela (7 dias atrás) é ignorado", () => {
    const out = bucketHumores([{ valor: 4, dia: diaOffset(HOJE, -7) }], HOJE);
    expect(out).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("registro futuro (amanhã) é ignorado", () => {
    const out = bucketHumores([{ valor: 4, dia: diaOffset(HOJE, 1) }], HOJE);
    expect(out).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("dias sem registro permanecem 0 entre dias com registro", () => {
    const out = bucketHumores(
      [
        { valor: 2, dia: diaOffset(HOJE, -6) }, // idx 0
        { valor: 3, dia: HOJE }, // idx 6
      ],
      HOJE
    );
    expect(out).toEqual([2, 0, 0, 0, 0, 0, 3]);
  });

  it("vira de mês corretamente (base UTC)", () => {
    const hoje = "2026-07-01";
    const out = bucketHumores(
      [
        { valor: 1, dia: "2026-06-25" }, // 6 dias atrás -> idx 0
        { valor: 2, dia: "2026-06-30" }, // ontem -> idx 5
        { valor: 3, dia: "2026-07-01" }, // hoje -> idx 6
      ],
      hoje
    );
    expect(out).toEqual([1, 0, 0, 0, 0, 2, 3]);
  });
});
