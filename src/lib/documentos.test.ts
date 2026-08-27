import { describe, it, expect } from "vitest";
import { cpfValido, somenteDigitos } from "./documentos";

describe("somenteDigitos", () => {
  it("tira máscara, espaço e letra", () => {
    expect(somenteDigitos("529.982.247-25")).toBe("52998224725");
    expect(somenteDigitos(" 529 982 247 25 ")).toBe("52998224725");
    expect(somenteDigitos("abc123")).toBe("123");
  });
});

describe("cpfValido", () => {
  it("aceita CPF válido, com e sem máscara", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("52998224725")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(cpfValido("529.982.247-26")).toBe(false);
  });

  it("recusa todos os dígitos iguais — passam na conta mas não existem", () => {
    for (const d of ["00000000000", "11111111111", "99999999999"]) {
      expect(cpfValido(d), d).toBe(false);
    }
  });

  it("recusa tamanho errado, vazio e lixo", () => {
    expect(cpfValido("")).toBe(false);
    expect(cpfValido("123")).toBe(false);
    expect(cpfValido("529982247250")).toBe(false);
    expect(cpfValido("meu cpf")).toBe(false);
  });
});
