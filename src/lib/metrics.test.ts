import { describe, it, expect } from "vitest";
import { npsFromNotas, fmtPct, fmtMetric } from "./metrics";

describe("npsFromNotas", () => {
  it("lista vazia -> null", () => {
    expect(npsFromNotas([])).toBe(null);
  });
  it("só promotores (>=9) -> 100", () => {
    expect(npsFromNotas([9, 10, 9, 10])).toBe(100);
  });
  it("só detratores (<=6) -> -100", () => {
    expect(npsFromNotas([0, 3, 5, 6])).toBe(-100);
  });
  it("mix promotores/detratores/passivos", () => {
    // 5 notas: 3 promotores (60%), 1 detrator (20%) -> 60-20 = 40
    expect(npsFromNotas([9, 10, 9, 6, 7])).toBe(40);
  });
  it("só passivos (7 e 8) -> 0", () => {
    expect(npsFromNotas([7, 8, 7, 8])).toBe(0);
  });
  it("borda 6 conta como detrator", () => {
    expect(npsFromNotas([6])).toBe(-100);
  });
  it("borda 7 conta como passivo (nem promotor nem detrator)", () => {
    expect(npsFromNotas([7])).toBe(0);
  });
  it("borda 8 conta como passivo", () => {
    expect(npsFromNotas([8])).toBe(0);
  });
  it("borda 9 conta como promotor", () => {
    expect(npsFromNotas([9])).toBe(100);
  });
  it("arredonda o resultado", () => {
    // 3 notas: 1 promotor (33,33%), 0 detratores -> round(33,33) = 33
    expect(npsFromNotas([9, 7, 8])).toBe(33);
  });
});

describe("fmtPct", () => {
  it("0.42 -> '42%'", () => {
    expect(fmtPct(0.42)).toBe("42%");
  });
  it("0 -> '0%'", () => {
    expect(fmtPct(0)).toBe("0%");
  });
  it("1 -> '100%'", () => {
    expect(fmtPct(1)).toBe("100%");
  });
  it("arredonda 0.426 -> '43%'", () => {
    expect(fmtPct(0.426)).toBe("43%");
  });
});

describe("fmtMetric", () => {
  it("null -> '—'", () => {
    expect(fmtMetric(null)).toBe("—");
  });
  it("número sem suffix", () => {
    expect(fmtMetric(42)).toBe("42");
  });
  it("número com suffix", () => {
    expect(fmtMetric(8, "/10")).toBe("8/10");
  });
  it("zero é número válido (não vira '—')", () => {
    expect(fmtMetric(0)).toBe("0");
  });
});
