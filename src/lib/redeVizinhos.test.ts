import { describe, it, expect } from "vitest";
import { CICLO, montarRede, intensidade } from "./redeVizinhos";

describe("rede de vizinhos (animação do bloco O que é)", () => {
  it("uma janela por célula da grade", () => {
    const { janelas } = montarRede(8, 5);
    expect(janelas).toHaveLength(40);
    for (const j of janelas) {
      expect(j.col).toBeGreaterThanOrEqual(0);
      expect(j.col).toBeLessThan(8);
      expect(j.row).toBeGreaterThanOrEqual(0);
      expect(j.row).toBeLessThan(5);
    }
  });

  it("toda janela acende antes do apagar do fim do ciclo", () => {
    const { janelas } = montarRede(10, 6);
    for (const j of janelas) expect(j.acende).toBeLessThanOrEqual(CICLO - 2);
  });

  it("liga só vizinhas lado a lado ou em cima/embaixo, sem repetir", () => {
    const { janelas, ligacoes } = montarRede(10, 6, () => 0);
    expect(ligacoes.length).toBeGreaterThan(0);
    const vistos = new Set<string>();
    for (const [a, b] of ligacoes) {
      const ja = janelas[a], jb = janelas[b];
      expect(Math.abs(ja.col - jb.col) + Math.abs(ja.row - jb.row)).toBe(1);
      const k = `${Math.min(a, b)}-${Math.max(a, b)}`;
      expect(vistos.has(k)).toBe(false);
      vistos.add(k);
    }
  });

  it("intensidade: apagada antes, acesa meio segundo depois", () => {
    expect(intensidade(1, 2)).toBe(0);
    expect(intensidade(2.25, 2)).toBeCloseTo(0.5);
    expect(intensidade(2.5, 2)).toBe(1);
  });

  it("no último segundo do ciclo tudo vai apagando, sem corte seco", () => {
    expect(intensidade(CICLO - 0.5, 0)).toBeCloseTo(0.5);
    expect(intensidade(CICLO, 0)).toBe(0);
  });
});
