import { describe, it, expect } from "vitest";
import { composeConfirmacao, composeLembrete } from "./mensagens";

describe("composeConfirmacao", () => {
  it("inclui data DD/MM e hora HH:MM formatadas", () => {
    const txt = composeConfirmacao({
      nome: "Maria Silva",
      data: "2026-06-24",
      hora: "14:30",
      tipo: "online",
    });
    expect(txt).toContain("24/06");
    expect(txt).toContain("14:30");
  });

  it("saúda pelo primeiro nome apenas (sem nome completo)", () => {
    const txt = composeConfirmacao({ nome: "Maria Silva", data: "2026-06-24" });
    expect(txt).toContain("Maria");
    expect(txt).not.toContain("Silva");
  });

  it("normaliza hora ISO/sem zero à esquerda para HH:MM", () => {
    const txt = composeConfirmacao({ hora: "9:05:00" });
    expect(txt).toContain("09:05");
  });

  it("mostra o link APENAS quando online e link presente", () => {
    const online = composeConfirmacao({
      tipo: "online",
      link: "https://sala.revivaz/abc",
    });
    expect(online).toContain("https://sala.revivaz/abc");
    expect(online).toContain("Link da sala:");
  });

  it("NÃO trata como link de sala quando presencial (usa Local)", () => {
    const presencial = composeConfirmacao({
      tipo: "presencial",
      link: "Rua das Flores, 100",
    });
    expect(presencial).toContain("Local: Rua das Flores, 100");
    expect(presencial).not.toContain("Link da sala:");
  });

  it("NÃO inclui link/sala quando online sem link", () => {
    const txt = composeConfirmacao({ tipo: "online" });
    expect(txt).not.toContain("Link da sala:");
  });

  it("traz o rodapé de crise (188 CVV / 192 SAMU)", () => {
    const txt = composeConfirmacao({ nome: "Ana", data: "2026-06-24" });
    expect(txt).toContain("188");
    expect(txt).toContain("192");
    expect(txt).toContain("CVV");
    expect(txt).toContain("SAMU");
  });

  it("não quebra com campos null/undefined e ainda traz o rodapé", () => {
    expect(() => composeConfirmacao({})).not.toThrow();
    const vazio = composeConfirmacao({
      nome: null,
      data: null,
      hora: null,
      tipo: null,
      link: null,
    });
    expect(typeof vazio).toBe("string");
    expect(vazio.length).toBeGreaterThan(0);
    expect(vazio).toContain("188");
    expect(vazio).toContain("192");
  });
});

describe("composeLembrete", () => {
  it("inclui data DD/MM e hora HH:MM formatadas", () => {
    const txt = composeLembrete({
      nome: "João",
      data: "2026-06-25",
      hora: "08:00",
      tipo: "online",
    });
    expect(txt).toContain("25/06");
    expect(txt).toContain("08:00");
  });

  it("mostra o link APENAS quando online e link presente", () => {
    const online = composeLembrete({
      tipo: "online",
      link: "https://sala.revivaz/xyz",
    });
    expect(online).toContain("https://sala.revivaz/xyz");
    expect(online).toContain("Link da sala:");

    const presencial = composeLembrete({
      tipo: "presencial",
      link: "Av. Brasil, 50",
    });
    expect(presencial).not.toContain("Link da sala:");
  });

  it("traz o rodapé de crise (188 CVV / 192 SAMU)", () => {
    const txt = composeLembrete({ nome: "Ana", data: "2026-06-25" });
    expect(txt).toContain("188");
    expect(txt).toContain("192");
    expect(txt).toContain("CVV");
    expect(txt).toContain("SAMU");
  });

  it("não quebra com campos null/undefined e ainda traz o rodapé", () => {
    expect(() => composeLembrete({})).not.toThrow();
    const vazio = composeLembrete({});
    expect(typeof vazio).toBe("string");
    expect(vazio).toContain("188");
    expect(vazio).toContain("192");
  });

  it("usa só o primeiro nome do paciente", () => {
    const txt = composeLembrete({ nome: "Carlos Eduardo Souza" });
    expect(txt).toContain("Carlos");
    expect(txt).not.toContain("Eduardo");
    expect(txt).not.toContain("Souza");
  });
});
