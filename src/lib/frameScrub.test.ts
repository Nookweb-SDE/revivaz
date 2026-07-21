import { describe, it, expect } from "vitest";
import { frameIndex, frameSrc, framePaths } from "./frameScrub";

describe("frameIndex", () => {
  it("mapeia as extremidades para o primeiro e o último frame", () => {
    expect(frameIndex(0, 100)).toBe(0);
    expect(frameIndex(1, 100)).toBe(99);
  });

  it("mapeia o meio para o frame do meio", () => {
    expect(frameIndex(0.5, 101)).toBe(50);
  });

  it("prende valores fora de 0–1 em vez de estourar o array", () => {
    expect(frameIndex(-3, 100)).toBe(0);
    expect(frameIndex(9, 100)).toBe(99);
  });

  it("devolve 0 quando não há frames, em vez de -1", () => {
    expect(frameIndex(0.5, 0)).toBe(0);
  });

  it("tolera progresso NaN devolvendo o primeiro frame", () => {
    expect(frameIndex(NaN, 100)).toBe(0);
  });
});

describe("frameSrc", () => {
  it("formata o índice com três dígitos", () => {
    expect(frameSrc("/revivaz/hero", 0)).toBe("/revivaz/hero/f000.webp");
    expect(frameSrc("/revivaz/hero", 7)).toBe("/revivaz/hero/f007.webp");
    expect(frameSrc("/revivaz/hero", 170)).toBe("/revivaz/hero/f170.webp");
  });

  it("aceita outra extensão — a sequência publicada é AVIF", () => {
    expect(frameSrc("/revivaz/hero", 85, "avif")).toBe("/revivaz/hero/f085.avif");
  });
});

describe("framePaths", () => {
  it("gera a lista completa na ordem", () => {
    const p = framePaths("/revivaz/hero", 3);
    expect(p).toEqual([
      "/revivaz/hero/f000.webp",
      "/revivaz/hero/f001.webp",
      "/revivaz/hero/f002.webp",
    ]);
  });

  it("devolve lista vazia para total 0", () => {
    expect(framePaths("/revivaz/hero", 0)).toEqual([]);
  });

  it("propaga a extensão para todos os caminhos", () => {
    expect(framePaths("/revivaz/hero", 2, "avif")).toEqual([
      "/revivaz/hero/f000.avif",
      "/revivaz/hero/f001.avif",
    ]);
  });
});
