import { describe, it, expect } from "vitest";
import { roomName, isOnline } from "./room";

describe("roomName", () => {
  it("monta o nome no formato consulta-<id>", () => {
    expect(roomName("abc123")).toBe("consulta-abc123");
  });

  it("preserva ids já no padrão [a-z0-9-]", () => {
    expect(roomName("12ab-34cd-56")).toBe("consulta-12ab-34cd-56");
  });

  it("baixa para minúsculas (sala estável entre paciente e profissional)", () => {
    expect(roomName("ABC123")).toBe("consulta-abc123");
  });

  it("sanitiza caracteres especiais trocando-os por hífen", () => {
    expect(roomName("ab_cd.ef")).toBe("consulta-ab-cd-ef");
  });

  it("colapsa hífens repetidos em um só", () => {
    expect(roomName("a__b")).toBe("consulta-a-b");
  });

  it("remove hífens das pontas do id sanitizado", () => {
    expect(roomName("--abc--")).toBe("consulta-abc");
  });

  it("lida com UUID típico de consulta", () => {
    expect(roomName("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "consulta-550e8400-e29b-41d4-a716-446655440000"
    );
  });

  it("o resultado contém apenas [a-z0-9-]", () => {
    expect(roomName("Olá Mundo! #1")).toMatch(/^[a-z0-9-]+$/);
  });

  it("converte número (coerção) sem quebrar", () => {
    expect(roomName(42 as unknown as string)).toBe("consulta-42");
  });
});

describe("isOnline", () => {
  it("true apenas para tipo exatamente 'online'", () => {
    expect(isOnline("online")).toBe(true);
  });

  it("false para 'presencial'", () => {
    expect(isOnline("presencial")).toBe(false);
  });

  it("false para variações/caixa diferente (sem normalização)", () => {
    expect(isOnline("Online")).toBe(false);
    expect(isOnline("ONLINE")).toBe(false);
    expect(isOnline(" online ")).toBe(false);
  });

  it("false para string vazia", () => {
    expect(isOnline("")).toBe(false);
  });
});
