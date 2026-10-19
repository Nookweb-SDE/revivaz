import { describe, it, expect } from "vitest";
import { QTD, poseCelular, poseVertical, vistaVertical, progressoRolagem } from "./celulares";

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

  describe("versão celular (vertical, como o vídeo de referência)", () => {
    it("começa com um celular só, de perfil", () => {
      const p = poseVertical(0, 0);
      expect(p.opacity).toBe(1);
      expect(Math.abs(p.ry)).toBeGreaterThan(60);
      for (let i = 1; i < QTD; i++) expect(poseVertical(i, 0).opacity).toBe(0);
    });

    it("vira de frente antes dos outros aparecerem", () => {
      expect(Math.abs(poseVertical(0, 0.28).ry)).toBeLessThan(5);
      for (let i = 1; i < QTD; i++) expect(poseVertical(i, 0.28).opacity).toBe(0);
    });

    it("no meio os 5 flutuam espalhados: em cima, embaixo, esquerda e direita", () => {
      const ps = Array.from({ length: QTD }, (_, i) => poseVertical(i, 0.65));
      ps.forEach(p => { expect(p.opacity).toBe(1); expect(Math.abs(p.ry)).toBeLessThan(25); });
      const outros = ps.slice(1);
      expect(outros.some(p => p.y < -150)).toBe(true);
      expect(outros.some(p => p.y > 150)).toBe(true);
      expect(outros.some(p => p.x < -100)).toBe(true);
      expect(outros.some(p => p.x > 100)).toBe(true);
      expect(new Set(ps.map(p => `${Math.round(p.x)},${Math.round(p.y)}`)).size).toBe(QTD);
    });

    it("no fim voltam para trás do celular do meio", () => {
      expect(poseVertical(0, 1).opacity).toBe(1);
      for (let i = 1; i < QTD; i++) expect(poseVertical(i, 1).opacity).toBe(0);
    });

    it("a câmera se afasta quando eles se espalham e volta no fim", () => {
      expect(vistaVertical(0.65)).toBeGreaterThan(vistaVertical(0.1));
      expect(vistaVertical(1)).toBeLessThan(vistaVertical(0.65));
    });
  });
});
