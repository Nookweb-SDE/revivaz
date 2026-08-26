import { describe, it, expect } from "vitest";
import { telefoneValido, emailValido } from "./validacao";

describe("telefoneValido", () => {
  it("aceita celular com DDD, formatado ou não", () => {
    expect(telefoneValido("(11) 96511-9797")).toBe(true);
    expect(telefoneValido("11965119797")).toBe(true);
  });
  it("aceita fixo de 10 dígitos", () => {
    expect(telefoneValido("1122334455")).toBe(true);
  });
  it("aceita com o código do país", () => {
    expect(telefoneValido("5511965119797")).toBe(true);
    expect(telefoneValido("551122334455")).toBe(true);
  });
  it("recusa curto, vazio e só letras", () => {
    expect(telefoneValido("99999")).toBe(false);
    expect(telefoneValido("")).toBe(false);
    expect(telefoneValido("meu telefone")).toBe(false);
  });
  it("recusa longo demais", () => {
    expect(telefoneValido("55119651197971234")).toBe(false);
  });
});

describe("emailValido", () => {
  it("campo opcional: vazio passa", () => {
    expect(emailValido("")).toBe(true);
  });
  it("aceita e-mail comum", () => {
    expect(emailValido("maria@exemplo.com.br")).toBe(true);
  });
  it("recusa o que não é e-mail", () => {
    expect(emailValido("maria")).toBe(false);
    expect(emailValido("maria@")).toBe(false);
    expect(emailValido("maria@exemplo")).toBe(false);
    expect(emailValido("com espaço@exemplo.com")).toBe(false);
  });
});
