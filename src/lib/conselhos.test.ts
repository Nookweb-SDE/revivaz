import { describe, it, expect } from "vitest";
import { CONSELHOS, registroValido, linkConsulta } from "./conselhos";

describe("catálogo de conselhos", () => {
  it("cobre os conselhos das 12 especialidades", () => {
    const siglas = CONSELHOS.map((c) => c.sigla);
    for (const s of ["CRM", "CRP", "COFFITO", "CFFA", "OUTRO"]) {
      expect(siglas, s).toContain(s);
    }
  });

  it("toda entrada tem nome e sigla sem espaço", () => {
    for (const c of CONSELHOS) {
      expect(c.nome.length).toBeGreaterThan(3);
      expect(c.sigla).toMatch(/^[A-Z]+$/);
    }
  });
});

describe("registroValido", () => {
  it("aceita número com e sem máscara", () => {
    expect(registroValido("CRP", "06/12345")).toBe(true);
    expect(registroValido("CRM", "123456")).toBe(true);
  });

  it("recusa vazio, curto demais e sem nenhum dígito", () => {
    expect(registroValido("CRP", "")).toBe(false);
    expect(registroValido("CRP", "12")).toBe(false);
    expect(registroValido("CRP", "abcdef")).toBe(false);
  });

  it("recusa conselho fora do catálogo", () => {
    expect(registroValido("CONSELHO_INVENTADO", "123456")).toBe(false);
  });
});

describe("linkConsulta", () => {
  it("monta o link oficial do CRP com o número dentro", () => {
    const url = linkConsulta("CRP", "06/12345");
    expect(url).toContain("cfp.org.br");
    expect(url).toContain("0612345");
  });

  it("monta o link oficial do CRM", () => {
    expect(linkConsulta("CRM", "123456")).toContain("cfm.org.br");
  });

  it("devolve null quando o conselho não tem consulta pública — o admin confere fora", () => {
    expect(linkConsulta("OUTRO", "123456")).toBeNull();
  });
});
