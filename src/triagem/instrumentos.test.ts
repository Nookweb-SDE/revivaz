import { describe, it, expect } from "vitest";
import {
  scorePHQ9,
  scoreGAD7,
  severidadePHQ9,
  severidadeGAD7,
  riscoIdeacao,
  sugestaoRoteamento,
  PHQ9_ITENS,
  GAD7_ITENS,
  ESCALA_LIKERT,
} from "./instrumentos";

// Helper: array de n respostas todas iguais a v.
const fill = (n: number, v: number): number[] => Array(n).fill(v);

describe("scorePHQ9", () => {
  it("soma 0 quando todas as respostas são 0 (mínimo)", () => {
    expect(scorePHQ9(fill(9, 0))).toBe(0);
  });
  it("soma 27 quando todas as respostas são 3 (máximo)", () => {
    expect(scorePHQ9(fill(9, 3))).toBe(27);
  });
  it("soma corretamente respostas mistas", () => {
    // 1+0+2+3+0+1+2+0+1 = 10
    expect(scorePHQ9([1, 0, 2, 3, 0, 1, 2, 0, 1])).toBe(10);
  });
  it("lança erro se o array não tiver exatamente 9 itens", () => {
    expect(() => scorePHQ9(fill(8, 1))).toThrow();
    expect(() => scorePHQ9(fill(10, 1))).toThrow();
  });
  it("lança erro se algum valor estiver fora de 0–3", () => {
    expect(() => scorePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 4])).toThrow();
    expect(() => scorePHQ9([0, 0, 0, 0, 0, 0, 0, 0, -1])).toThrow();
  });
});

describe("scoreGAD7", () => {
  it("soma 0 quando todas as respostas são 0 (mínimo)", () => {
    expect(scoreGAD7(fill(7, 0))).toBe(0);
  });
  it("soma 21 quando todas as respostas são 3 (máximo)", () => {
    expect(scoreGAD7(fill(7, 3))).toBe(21);
  });
  it("soma corretamente respostas mistas", () => {
    // 2+1+3+0+2+1+0 = 9
    expect(scoreGAD7([2, 1, 3, 0, 2, 1, 0])).toBe(9);
  });
  it("lança erro se o array não tiver exatamente 7 itens", () => {
    expect(() => scoreGAD7(fill(6, 1))).toThrow();
    expect(() => scoreGAD7(fill(8, 1))).toThrow();
  });
  it("lança erro se algum valor estiver fora de 0–3", () => {
    expect(() => scoreGAD7([0, 0, 0, 0, 0, 0, 4])).toThrow();
  });
});

describe("severidadePHQ9 (cortes 4/5, 9/10, 14/15, 19/20)", () => {
  it("0–4 → minima", () => {
    expect(severidadePHQ9(0)).toBe("minima");
    expect(severidadePHQ9(4)).toBe("minima");
  });
  it("5–9 → leve", () => {
    expect(severidadePHQ9(5)).toBe("leve");
    expect(severidadePHQ9(9)).toBe("leve");
  });
  it("10–14 → moderada", () => {
    expect(severidadePHQ9(10)).toBe("moderada");
    expect(severidadePHQ9(14)).toBe("moderada");
  });
  it("15–19 → moderada_grave", () => {
    expect(severidadePHQ9(15)).toBe("moderada_grave");
    expect(severidadePHQ9(19)).toBe("moderada_grave");
  });
  it("20–27 → grave", () => {
    expect(severidadePHQ9(20)).toBe("grave");
    expect(severidadePHQ9(27)).toBe("grave");
  });
});

describe("severidadeGAD7 (cortes 4/5, 9/10, 14/15)", () => {
  it("0–4 → minima", () => {
    expect(severidadeGAD7(0)).toBe("minima");
    expect(severidadeGAD7(4)).toBe("minima");
  });
  it("5–9 → leve", () => {
    expect(severidadeGAD7(5)).toBe("leve");
    expect(severidadeGAD7(9)).toBe("leve");
  });
  it("10–14 → moderada", () => {
    expect(severidadeGAD7(10)).toBe("moderada");
    expect(severidadeGAD7(14)).toBe("moderada");
  });
  it("15–21 → grave", () => {
    expect(severidadeGAD7(15)).toBe("grave");
    expect(severidadeGAD7(21)).toBe("grave");
  });
});

describe("riscoIdeacao", () => {
  it("phq9: item 9 (índice 8) > 0 → true", () => {
    const respostas = fill(9, 0);
    respostas[8] = 1;
    expect(riscoIdeacao("phq9", respostas)).toBe(true);
    const grave = fill(9, 0);
    grave[8] = 3;
    expect(riscoIdeacao("phq9", grave)).toBe(true);
  });
  it("phq9: item 9 (índice 8) = 0 → false, mesmo com sintomas altos nos demais itens", () => {
    // todos os 8 primeiros no máximo, ideação 0 → sem risco de ideação
    const respostas = [3, 3, 3, 3, 3, 3, 3, 3, 0];
    expect(riscoIdeacao("phq9", respostas)).toBe(false);
  });
  it("gad7: sempre false (não tem item de ideação)", () => {
    expect(riscoIdeacao("gad7", fill(7, 3))).toBe(false);
    expect(riscoIdeacao("gad7", fill(7, 0))).toBe(false);
  });
});

describe("sugestaoRoteamento", () => {
  it("risco=true → SEMPRE urgente, citando 188 / 192 / 136, independente da severidade", () => {
    for (const sev of ["minima", "leve", "moderada", "moderada_grave", "grave"]) {
      const r = sugestaoRoteamento(sev, true);
      expect(r.nivel).toBe("urgente");
      expect(r.texto).toContain("188");
      expect(r.texto).toContain("192");
      expect(r.texto).toContain("136");
      // 196 NÃO é linha nacional — nunca deve aparecer.
      expect(r.texto).not.toContain("196");
    }
  });
  it("sem risco: minima/leve → autoajuda", () => {
    expect(sugestaoRoteamento("minima", false).nivel).toBe("autoajuda");
    expect(sugestaoRoteamento("leve", false).nivel).toBe("autoajuda");
  });
  it("sem risco: moderada → agendar", () => {
    expect(sugestaoRoteamento("moderada", false).nivel).toBe("agendar");
  });
  it("sem risco: moderada_grave/grave → agendar", () => {
    expect(sugestaoRoteamento("moderada_grave", false).nivel).toBe("agendar");
    expect(sugestaoRoteamento("grave", false).nivel).toBe("agendar");
  });
  it("nenhuma sugestão menciona nome de doença (sem 'depressão'/'ansiedade')", () => {
    for (const risco of [true, false]) {
      for (const sev of ["minima", "leve", "moderada", "moderada_grave", "grave"]) {
        const t = sugestaoRoteamento(sev, risco).texto.toLowerCase();
        expect(t).not.toContain("depress");
        expect(t).not.toContain("ansiedade");
      }
    }
  });
});

describe("instrumentos — metadados", () => {
  it("PHQ-9 tem 9 itens e o item 9 (índice 8) é o de ideação", () => {
    expect(PHQ9_ITENS).toHaveLength(9);
    expect(PHQ9_ITENS[8].texto.toLowerCase()).toMatch(/morto|ferir/);
  });
  it("GAD-7 tem 7 itens", () => {
    expect(GAD7_ITENS).toHaveLength(7);
  });
  it("ESCALA_LIKERT tem 4 níveis 0–3 na ordem esperada", () => {
    expect(ESCALA_LIKERT.map((e) => e.valor)).toEqual([0, 1, 2, 3]);
    expect(ESCALA_LIKERT[0].rotulo).toBe("Nenhuma vez");
    expect(ESCALA_LIKERT[3].rotulo).toBe("Quase todos os dias");
  });
});
