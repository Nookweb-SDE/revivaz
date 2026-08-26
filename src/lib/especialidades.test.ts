import { describe, it, expect } from "vitest";
import {
  ESPECIALIDADES,
  GRUPOS,
  labelEspecialidade,
  especialidadesInfantis,
} from "./especialidades";

describe("catálogo de especialidades", () => {
  it("não tem valor repetido (o valor vai para o banco)", () => {
    const valores = ESPECIALIDADES.map((e) => e.valor);
    expect(new Set(valores).size).toBe(valores.length);
  });

  it("todo valor é seguro para banco e URL: minúsculo, sem espaço nem acento", () => {
    for (const e of ESPECIALIDADES) {
      expect(e.valor).toMatch(/^[a-z_]+$/);
    }
  });

  it("todo item tem label, descrição e grupo conhecido", () => {
    for (const e of ESPECIALIDADES) {
      expect(e.label.length).toBeGreaterThan(2);
      expect(e.desc.length).toBeGreaterThan(10);
      expect(Object.keys(GRUPOS)).toContain(e.grupo);
    }
  });

  it("mantém psiquiatria e psicologia, que já estavam gravadas no banco", () => {
    const valores = ESPECIALIDADES.map((e) => e.valor);
    expect(valores).toContain("psiquiatria");
    expect(valores).toContain("psicologia");
  });

  it("cobre o time que acompanha neurodivergência", () => {
    const valores = ESPECIALIDADES.map((e) => e.valor);
    for (const v of ["neuropediatria", "neuropsicologia", "terapia_ocupacional", "fonoaudiologia", "aba"]) {
      expect(valores).toContain(v);
    }
  });

  it("labelEspecialidade traduz o valor e não engole o desconhecido", () => {
    expect(labelEspecialidade("neuropediatria")).toBe("Neuropediatria");
    expect(labelEspecialidade("coisa_antiga")).toBe("coisa_antiga");
    expect(labelEspecialidade(null)).toBe("");
  });

  it("marca quem atende menor de idade", () => {
    const infantis = especialidadesInfantis().map((e) => e.valor);
    expect(infantis).toContain("neuropediatria");
    expect(infantis).not.toContain("clinico_geral");
  });
});
