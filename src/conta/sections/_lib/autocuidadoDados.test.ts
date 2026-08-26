import { describe, it, expect } from "vitest";
import {
  BREATHE_CSS,
  FASE_DURACAO,
  FASE_TEXTO,
  PASSOS_GROUNDING,
} from "./autocuidadoDados";

/**
 * Estes dados são PROTOCOLO clínico, não enfeite. Um dígito trocado quebra a
 * técnica sem quebrar a tela: a pessoa em crise faz o exercício errado e nada
 * acusa. Por isso os números são verificados aqui.
 */

describe("respiração 4-7-8", () => {
  it("os tempos são 4, 7 e 8 segundos — é o nome da técnica", () => {
    expect(FASE_DURACAO.inspire).toBe(4000);
    expect(FASE_DURACAO.segure).toBe(7000);
    expect(FASE_DURACAO.expire).toBe(8000);
  });

  it("o ciclo fecha em 19 segundos", () => {
    const total = FASE_DURACAO.inspire + FASE_DURACAO.segure + FASE_DURACAO.expire;
    expect(total).toBe(19000);
  });

  it("expirar dura mais que inspirar — é o que ativa o parassimpático", () => {
    expect(FASE_DURACAO.expire).toBeGreaterThan(FASE_DURACAO.inspire);
  });

  it("o texto de cada fase cita o mesmo número da duração", () => {
    expect(FASE_TEXTO.inspire.detalhe).toContain("4 segundos");
    expect(FASE_TEXTO.segure.detalhe).toContain("7 segundos");
    expect(FASE_TEXTO.expire.detalhe).toContain("8 segundos");
  });

  it("toda fase tem instrução e detalhe preenchidos", () => {
    for (const fase of ["inspire", "segure", "expire"] as const) {
      expect(FASE_TEXTO[fase].instrucao.length).toBeGreaterThan(3);
      expect(FASE_TEXTO[fase].detalhe.length).toBeGreaterThan(10);
    }
  });

  it("a animação usa os mesmos marcos do ciclo (21% e 57.9%)", () => {
    // 4/19 ≈ 21.05% e 11/19 ≈ 57.89%: se a duração mudar sem mexer no CSS,
    // o círculo desencontra da contagem.
    expect(BREATHE_CSS).toContain("21.05");
    expect(BREATHE_CSS).toContain("57.89");
  });
});

describe("grounding 5-4-3-2-1", () => {
  it("são cinco passos, na contagem regressiva 5, 4, 3, 2, 1", () => {
    expect(PASSOS_GROUNDING.map((p) => p.quantidade)).toEqual([5, 4, 3, 2, 1]);
  });

  it("cada passo usa um sentido diferente", () => {
    const verbos = PASSOS_GROUNDING.map((p) => p.verbo);
    expect(new Set(verbos).size).toBe(verbos.length);
    expect(verbos.join(" ")).toMatch(/VÊ/);
    expect(verbos.join(" ")).toMatch(/TOCAR/);
    expect(verbos.join(" ")).toMatch(/OUVE/);
    expect(verbos.join(" ")).toMatch(/CHEIRA/);
    expect(verbos.join(" ")).toMatch(/SABOREIA/);
  });

  it("todo passo tem descrição e exemplo — a pessoa em crise não fica no vazio", () => {
    for (const p of PASSOS_GROUNDING) {
      expect(p.descricao.length).toBeGreaterThan(30);
      expect(p.placeholder).toMatch(/^Ex\.:/);
    }
  });
});
