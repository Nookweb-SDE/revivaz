import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { buildReceitaPdf, wrapText, formatarDataBR } from "./receitaPdf";

const BASE = {
  id: "8f2c1a44-0000-4000-8000-000000000001",
  resumo: "Sertralina 50mg\n1 comprimido pela manhã, por 30 dias.\nRetorno em 4 semanas.",
  validade: "2026-09-30",
  emitidaEm: "2026-08-26T14:03:00.000Z",
  paciente: { nome: "Maria da Conceição" },
  profissional: { nome: "Dra. Ana Beatriz", especialidade: "Psiquiatria", registro: "CRM 12345" },
};

describe("formatarDataBR", () => {
  it("converte ISO date em dd/mm/aaaa", () => {
    expect(formatarDataBR("2026-09-30")).toBe("30/09/2026");
  });
  it("aceita timestamp completo", () => {
    expect(formatarDataBR("2026-08-26T14:03:00.000Z")).toBe("26/08/2026");
  });
  it("null e lixo viram string vazia (nunca 'Invalid Date' no papel)", () => {
    expect(formatarDataBR(null)).toBe("");
    expect(formatarDataBR("qualquer coisa")).toBe("");
  });
});

describe("wrapText", () => {
  it("respeita o \\n do autor", async () => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    expect(wrapText("uma\noutra", font, 12, 400)).toEqual(["uma", "outra"]);
  });

  it("quebra linha que não cabe na largura", async () => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const linhas = wrapText("palavra ".repeat(40).trim(), font, 12, 200);
    expect(linhas.length).toBeGreaterThan(1);
    for (const l of linhas) {
      expect(font.widthOfTextAtSize(l, 12)).toBeLessThanOrEqual(200);
    }
  });

  it("corta na força uma palavra maior que a linha inteira", async () => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const linhas = wrapText("A".repeat(300), font, 12, 100);
    expect(linhas.length).toBeGreaterThan(1);
    for (const l of linhas) {
      expect(font.widthOfTextAtSize(l, 12)).toBeLessThanOrEqual(100);
    }
  });
});

describe("buildReceitaPdf", () => {
  it("gera um PDF válido e não vazio", async () => {
    const bytes = await buildReceitaPdf(BASE);
    expect(bytes.length).toBeGreaterThan(1000);
    // assinatura do formato
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const lido = await PDFDocument.load(bytes);
    expect(lido.getPageCount()).toBe(1);
    expect(lido.getTitle()).toContain("Maria da Concei");
  });

  it("não estoura com acento, emoji nem caractere fora do WinAnsi", async () => {
    const bytes = await buildReceitaPdf({
      ...BASE,
      resumo: "Ação — “aspas” … 😀 中文 çãõ",
      paciente: { nome: "José 😀" },
    });
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("aceita receita sem validade e sem credencial do profissional", async () => {
    const bytes = await buildReceitaPdf({
      ...BASE,
      validade: null,
      profissional: { nome: "Dr. Fulano", especialidade: null, registro: null },
    });
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("não quebra com um resumo gigante (trunca visualmente, não lança)", async () => {
    const bytes = await buildReceitaPdf({ ...BASE, resumo: "linha de texto\n".repeat(500) });
    const lido = await PDFDocument.load(bytes);
    expect(lido.getPageCount()).toBe(1);
  });
});
