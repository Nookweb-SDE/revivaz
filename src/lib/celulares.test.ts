import { describe, it, expect } from "vitest";
import { QTD, poseCelular, progressoRolagem } from "./celulares";

describe("celulares na rolagem (bloco Sua conta)", () => {
  it("no início só o celular do meio aparece, de perfil", () => {
    const p = poseCelular(0, 0);
    expect(p.opacity).toBe(1);
    expect(Math.abs(p.ry)).toBeGreaterThan(60);
    for (let i = 1; i < QTD; i++) expect(poseCelular(i, 0).opacity).toBe(0);
  });

  it("no fim todos aparecem de frente e espalhados, sem dois no mesmo lugar", () => {
    const xs = new Set<number>();
    for (let i = 0; i < QTD; i++) {
      const p = poseCelular(i, 1);
      expect(p.opacity).toBe(1);
      expect(Math.abs(p.ry)).toBeLessThan(25);
      xs.add(Math.round(p.x));
    }
    expect(xs.size).toBe(QTD);
  });

  it("o do meio já está de frente antes dos outros saírem de trás", () => {
    expect(Math.abs(poseCelular(0, 0.3).ry)).toBeLessThan(5);
    expect(poseCelular(1, 0.3).opacity).toBe(0);
  });

  it("progresso da rolagem fica entre 0 e 1", () => {
    expect(progressoRolagem(500, 1000, 800)).toBe(0);
    expect(progressoRolagem(-1200, 1000, 800)).toBe(1);
    expect(progressoRolagem(-100, 1000, 800)).toBeCloseTo(0.5);
  });
});
