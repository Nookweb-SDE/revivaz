import { describe, it, expect } from "vitest";
import { detectCrisis, CRISIS_RESOURCES } from "./crisis";

describe("detectCrisis", () => {
  it("detecta ideação suicida explícita", () => {
    expect(detectCrisis("não aguento mais, quero me matar")).toBe(true);
    expect(detectCrisis("pensei em dar fim à minha vida")).toBe(true);
    expect(detectCrisis("vou me suicidar hoje")).toBe(true);
  });
  it("detecta automutilação e desesperança grave", () => {
    expect(detectCrisis("tenho me cortado de novo")).toBe(true);
    expect(detectCrisis("ninguém sentiria minha falta")).toBe(true);
  });
  it("NÃO dispara em conversa comum", () => {
    expect(detectCrisis("estou ansioso com o trabalho")).toBe(false);
    expect(detectCrisis("quero agendar uma consulta")).toBe(false);
  });
  it("é robusto a maiúsculas e acentuação", () => {
    expect(detectCrisis("QUERO ME MATAR")).toBe(true);
    expect(detectCrisis("nao quero mais viver")).toBe(true);
  });
  it("expõe recursos de emergência brasileiros (CVV 188, SAMU 192, Disque Saúde 136)", () => {
    expect(CRISIS_RESOURCES.some(r => r.contato.includes("188"))).toBe(true);
    expect(CRISIS_RESOURCES.some(r => r.contato.includes("192"))).toBe(true);
    expect(CRISIS_RESOURCES.some(r => r.contato.includes("136"))).toBe(true);
    // 196 NÃO é linha nacional (era piloto DF) — não usar.
    expect(CRISIS_RESOURCES.some(r => r.contato.includes("196"))).toBe(false);
  });
});
