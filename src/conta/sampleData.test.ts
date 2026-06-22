import { describe, it, expect } from "vitest";
import { usuario, consultas, receitas, sessoesIA, humorSemana } from "./sampleData";

describe("sampleData", () => {
  it("usuario tem nome e contato de emergência", () => {
    expect(usuario.nome).toBeTruthy();
    expect(usuario.emergenciaTel).toBeTruthy();
  });
  it("tem ao menos 1 consulta agendada e 1 realizada", () => {
    expect(consultas.some(c => c.status === "agendada")).toBe(true);
    expect(consultas.some(c => c.status === "realizada")).toBe(true);
  });
  it("tem receitas e sessões de IA", () => {
    expect(receitas.length).toBeGreaterThan(0);
    expect(sessoesIA.length).toBeGreaterThan(0);
  });
  it("humorSemana tem 7 valores entre 0 e 4", () => {
    expect(humorSemana).toHaveLength(7);
    expect(humorSemana.every(n => n >= 0 && n <= 4)).toBe(true);
  });
});
