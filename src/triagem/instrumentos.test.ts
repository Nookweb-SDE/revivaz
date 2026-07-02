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

// ═══════════════════════════════════════════════════════════════════════════════
// PHQ-9  —  Patient Health Questionnaire (depressão, 9 itens, 0–27)
// ═══════════════════════════════════════════════════════════════════════════════

describe("scorePHQ9", () => {
  it("soma 0 quando todas as respostas são 0 (mínimo absoluto)", () => {
    expect(scorePHQ9(fill(9, 0))).toBe(0);
  });

  it("soma 27 quando todas as respostas são 3 (máximo absoluto)", () => {
    expect(scorePHQ9(fill(9, 3))).toBe(27);
  });

  it("soma corretamente respostas mistas: [1,0,2,3,0,1,2,0,1] = 10", () => {
    expect(scorePHQ9([1, 0, 2, 3, 0, 1, 2, 0, 1])).toBe(10);
  });

  it("lança erro se o array tiver menos de 9 itens (8 itens)", () => {
    expect(() => scorePHQ9(fill(8, 1))).toThrow();
  });

  it("lança erro se o array tiver mais de 9 itens (10 itens)", () => {
    expect(() => scorePHQ9(fill(10, 1))).toThrow();
  });

  it("lança erro se o array estiver vazio (0 itens)", () => {
    expect(() => scorePHQ9([])).toThrow();
  });

  it("lança erro se algum valor for 4 (acima do limite Likert)", () => {
    expect(() => scorePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 4])).toThrow();
  });

  it("lança erro se algum valor for -1 (negativo)", () => {
    expect(() => scorePHQ9([0, 0, 0, 0, 0, 0, 0, 0, -1])).toThrow();
  });
});

describe("severidadePHQ9 — cortes clínicos individuais (0/4 · 5/9 · 10/14 · 15/19 · 20/27)", () => {
  it("score 0 → 'minima'", () => {
    expect(severidadePHQ9(0)).toBe("minima");
  });

  it("score 4 → 'minima' (limite superior da faixa mínima)", () => {
    expect(severidadePHQ9(4)).toBe("minima");
  });

  it("score 5 → 'leve' (limite inferior da faixa leve, corte 4→5)", () => {
    expect(severidadePHQ9(5)).toBe("leve");
  });

  it("score 9 → 'leve' (limite superior da faixa leve)", () => {
    expect(severidadePHQ9(9)).toBe("leve");
  });

  it("score 10 → 'moderada' (limite inferior da faixa moderada, corte 9→10)", () => {
    expect(severidadePHQ9(10)).toBe("moderada");
  });

  it("score 14 → 'moderada' (limite superior da faixa moderada)", () => {
    expect(severidadePHQ9(14)).toBe("moderada");
  });

  it("score 15 → 'moderada_grave' (limite inferior da faixa moderada-grave, corte 14→15)", () => {
    expect(severidadePHQ9(15)).toBe("moderada_grave");
  });

  it("score 19 → 'moderada_grave' (limite superior da faixa moderada-grave)", () => {
    expect(severidadePHQ9(19)).toBe("moderada_grave");
  });

  it("score 20 → 'grave' (limite inferior da faixa grave, corte 19→20)", () => {
    expect(severidadePHQ9(20)).toBe("grave");
  });

  it("score 27 → 'grave' (pontuação máxima possível)", () => {
    expect(severidadePHQ9(27)).toBe("grave");
  });
});

describe("PHQ-9 — pipeline score → severidade (integração)", () => {
  it("fill(9, 0) → score 0 → minima", () => {
    const s = scorePHQ9(fill(9, 0));
    expect(s).toBe(0);
    expect(severidadePHQ9(s)).toBe("minima");
  });

  it("fill(9, 1) → score 9 → leve", () => {
    const s = scorePHQ9(fill(9, 1));
    expect(s).toBe(9);
    expect(severidadePHQ9(s)).toBe("leve");
  });

  it("[1,0,2,3,0,1,2,0,1] → score 10 → moderada", () => {
    const s = scorePHQ9([1, 0, 2, 3, 0, 1, 2, 0, 1]);
    expect(s).toBe(10);
    expect(severidadePHQ9(s)).toBe("moderada");
  });

  it("fill(9, 2) → score 18 → moderada_grave", () => {
    const s = scorePHQ9(fill(9, 2));
    expect(s).toBe(18);
    expect(severidadePHQ9(s)).toBe("moderada_grave");
  });

  it("fill(9, 3) → score 27 → grave", () => {
    const s = scorePHQ9(fill(9, 3));
    expect(s).toBe(27);
    expect(severidadePHQ9(s)).toBe("grave");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GAD-7  —  Generalized Anxiety Disorder (ansiedade, 7 itens, 0–21)
// ═══════════════════════════════════════════════════════════════════════════════

describe("scoreGAD7", () => {
  it("soma 0 quando todas as respostas são 0 (mínimo absoluto)", () => {
    expect(scoreGAD7(fill(7, 0))).toBe(0);
  });

  it("soma 21 quando todas as respostas são 3 (máximo absoluto)", () => {
    expect(scoreGAD7(fill(7, 3))).toBe(21);
  });

  it("soma corretamente respostas mistas: [2,1,3,0,2,1,0] = 9", () => {
    expect(scoreGAD7([2, 1, 3, 0, 2, 1, 0])).toBe(9);
  });

  it("lança erro se o array tiver menos de 7 itens (6 itens)", () => {
    expect(() => scoreGAD7(fill(6, 1))).toThrow();
  });

  it("lança erro se o array tiver mais de 7 itens (8 itens)", () => {
    expect(() => scoreGAD7(fill(8, 1))).toThrow();
  });

  it("lança erro se o array estiver vazio (0 itens)", () => {
    expect(() => scoreGAD7([])).toThrow();
  });

  it("lança erro se algum valor for 4 (acima do limite Likert)", () => {
    expect(() => scoreGAD7([0, 0, 0, 0, 0, 0, 4])).toThrow();
  });

  it("lança erro se algum valor for -1 (negativo)", () => {
    expect(() => scoreGAD7([0, 0, 0, 0, 0, 0, -1])).toThrow();
  });
});

describe("severidadeGAD7 — cortes clínicos individuais (0/4 · 5/9 · 10/14 · 15/21)", () => {
  it("score 0 → 'minima'", () => {
    expect(severidadeGAD7(0)).toBe("minima");
  });

  it("score 4 → 'minima' (limite superior da faixa mínima)", () => {
    expect(severidadeGAD7(4)).toBe("minima");
  });

  it("score 5 → 'leve' (limite inferior da faixa leve, corte 4→5)", () => {
    expect(severidadeGAD7(5)).toBe("leve");
  });

  it("score 9 → 'leve' (limite superior da faixa leve)", () => {
    expect(severidadeGAD7(9)).toBe("leve");
  });

  it("score 10 → 'moderada' (limite inferior da faixa moderada, corte 9→10)", () => {
    expect(severidadeGAD7(10)).toBe("moderada");
  });

  it("score 14 → 'moderada' (limite superior da faixa moderada)", () => {
    expect(severidadeGAD7(14)).toBe("moderada");
  });

  it("score 15 → 'grave' (limite inferior da faixa grave, corte 14→15)", () => {
    expect(severidadeGAD7(15)).toBe("grave");
  });

  it("score 21 → 'grave' (pontuação máxima possível do GAD-7)", () => {
    expect(severidadeGAD7(21)).toBe("grave");
  });
});

describe("GAD-7 — pipeline score → severidade (integração)", () => {
  it("fill(7, 0) → score 0 → minima", () => {
    const s = scoreGAD7(fill(7, 0));
    expect(s).toBe(0);
    expect(severidadeGAD7(s)).toBe("minima");
  });

  it("fill(7, 1) → score 7 → leve", () => {
    const s = scoreGAD7(fill(7, 1));
    expect(s).toBe(7);
    expect(severidadeGAD7(s)).toBe("leve");
  });

  it("[2,1,3,0,2,1,0] → score 9 → leve", () => {
    const s = scoreGAD7([2, 1, 3, 0, 2, 1, 0]);
    expect(s).toBe(9);
    expect(severidadeGAD7(s)).toBe("leve");
  });

  it("fill(7, 2) → score 14 → moderada (limite exato)", () => {
    const s = scoreGAD7(fill(7, 2));
    expect(s).toBe(14);
    expect(severidadeGAD7(s)).toBe("moderada");
  });

  it("fill(7, 3) → score 21 → grave", () => {
    const s = scoreGAD7(fill(7, 3));
    expect(s).toBe(21);
    expect(severidadeGAD7(s)).toBe("grave");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// riscoIdeacao
// ═══════════════════════════════════════════════════════════════════════════════

describe("riscoIdeacao", () => {
  it("phq9: item 9 (índice 8) = 1 → true", () => {
    const r = fill(9, 0);
    r[8] = 1;
    expect(riscoIdeacao("phq9", r)).toBe(true);
  });

  it("phq9: item 9 (índice 8) = 2 → true", () => {
    const r = fill(9, 0);
    r[8] = 2;
    expect(riscoIdeacao("phq9", r)).toBe(true);
  });

  it("phq9: item 9 (índice 8) = 3 → true (resposta máxima no item de ideação)", () => {
    const r = fill(9, 0);
    r[8] = 3;
    expect(riscoIdeacao("phq9", r)).toBe(true);
  });

  it("phq9: item 9 (índice 8) = 0 → false, mesmo com todos os demais no máximo", () => {
    expect(riscoIdeacao("phq9", [3, 3, 3, 3, 3, 3, 3, 3, 0])).toBe(false);
  });

  it("phq9: item 9 (índice 8) = 0, todos os itens 0 → false", () => {
    expect(riscoIdeacao("phq9", fill(9, 0))).toBe(false);
  });

  it("gad7: sempre false — instrumento não possui item de ideação", () => {
    expect(riscoIdeacao("gad7", fill(7, 3))).toBe(false);
  });

  it("gad7: false mesmo com score máximo (21)", () => {
    expect(riscoIdeacao("gad7", fill(7, 3))).toBe(false);
  });

  it("gad7: false com score mínimo (0)", () => {
    expect(riscoIdeacao("gad7", fill(7, 0))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// sugestaoRoteamento
// ═══════════════════════════════════════════════════════════════════════════════

describe("sugestaoRoteamento — risco=true → urgente com 188 e 192", () => {
  it("risco=true + minima → nivel 'urgente'", () => {
    expect(sugestaoRoteamento("minima", true).nivel).toBe("urgente");
  });

  it("risco=true + leve → nivel 'urgente'", () => {
    expect(sugestaoRoteamento("leve", true).nivel).toBe("urgente");
  });

  it("risco=true + moderada → nivel 'urgente'", () => {
    expect(sugestaoRoteamento("moderada", true).nivel).toBe("urgente");
  });

  it("risco=true + moderada_grave → nivel 'urgente'", () => {
    expect(sugestaoRoteamento("moderada_grave", true).nivel).toBe("urgente");
  });

  it("risco=true + grave → nivel 'urgente'", () => {
    expect(sugestaoRoteamento("grave", true).nivel).toBe("urgente");
  });

  it("risco=true: texto sempre contém CVV 188", () => {
    for (const sev of ["minima", "leve", "moderada", "moderada_grave", "grave"]) {
      expect(sugestaoRoteamento(sev, true).texto).toContain("188");
    }
  });

  it("risco=true: texto sempre contém SAMU 192", () => {
    for (const sev of ["minima", "leve", "moderada", "moderada_grave", "grave"]) {
      expect(sugestaoRoteamento(sev, true).texto).toContain("192");
    }
  });

  it("risco=true: texto menciona Disque Saúde 136", () => {
    expect(sugestaoRoteamento("minima", true).texto).toContain("136");
  });

  it("risco=true: nunca menciona número 196 (não é linha nacional)", () => {
    for (const sev of ["minima", "leve", "moderada", "moderada_grave", "grave"]) {
      expect(sugestaoRoteamento(sev, true).texto).not.toContain("196");
    }
  });
});

describe("sugestaoRoteamento — severidade grave → apoio profissional urgente", () => {
  it("grave sem ideação: nivel é 'agendar' (eleva para urgente só com risco=true)", () => {
    expect(sugestaoRoteamento("grave", false).nivel).toBe("agendar");
  });

  it("grave sem ideação: texto orienta buscar apoio profissional", () => {
    const t = sugestaoRoteamento("grave", false).texto.toLowerCase();
    expect(t).toMatch(/profissional|apoio|atendimento/);
  });

  it("grave sem ideação: texto menciona CVV 188 como linha de emergência", () => {
    expect(sugestaoRoteamento("grave", false).texto).toContain("188");
  });

  it("grave sem ideação: texto indica urgência com 'logo' ou 'imediato'", () => {
    const t = sugestaoRoteamento("grave", false).texto.toLowerCase();
    expect(t).toMatch(/logo|imediato|intensos/);
  });

  it("moderada_grave sem ideação: nivel também é 'agendar'", () => {
    expect(sugestaoRoteamento("moderada_grave", false).nivel).toBe("agendar");
  });

  it("moderada_grave sem ideação: texto menciona apoio profissional", () => {
    const t = sugestaoRoteamento("moderada_grave", false).texto.toLowerCase();
    expect(t).toMatch(/profissional|apoio|atendimento/);
  });
});

describe("sugestaoRoteamento — severidade minima → psicoeducação / autocuidado", () => {
  it("minima sem risco: nivel é 'autoajuda'", () => {
    expect(sugestaoRoteamento("minima", false).nivel).toBe("autoajuda");
  });

  it("minima sem risco: texto orienta explorar recursos de autocuidado", () => {
    const t = sugestaoRoteamento("minima", false).texto.toLowerCase();
    expect(t).toMatch(/autocuidado|recursos|explorar/);
  });

  it("minima sem risco: texto convida a acompanhar como se sente", () => {
    const t = sugestaoRoteamento("minima", false).texto.toLowerCase();
    expect(t).toMatch(/acompanhar|sentindo|sente/);
  });

  it("leve sem risco: nivel também é 'autoajuda'", () => {
    expect(sugestaoRoteamento("leve", false).nivel).toBe("autoajuda");
  });

  it("leve sem risco: texto orienta autocuidado (mesma faixa que mínima)", () => {
    const t = sugestaoRoteamento("leve", false).texto.toLowerCase();
    expect(t).toMatch(/autocuidado|recursos|explorar/);
  });
});

describe("sugestaoRoteamento — moderada → agendar atendimento", () => {
  it("moderada sem risco: nivel é 'agendar'", () => {
    expect(sugestaoRoteamento("moderada", false).nivel).toBe("agendar");
  });

  it("moderada sem risco: texto menciona agendar ou conversar com profissional", () => {
    const t = sugestaoRoteamento("moderada", false).texto.toLowerCase();
    expect(t).toMatch(/agendar|profissional|conversar/);
  });
});

describe("sugestaoRoteamento — compliance clínico (sem nome de doença)", () => {
  it("nenhuma combinação risco×severidade menciona 'depress'", () => {
    for (const risco of [true, false]) {
      for (const sev of ["minima", "leve", "moderada", "moderada_grave", "grave"]) {
        const t = sugestaoRoteamento(sev, risco).texto.toLowerCase();
        expect(t).not.toContain("depress");
      }
    }
  });

  it("nenhuma combinação risco×severidade menciona 'ansiedade'", () => {
    for (const risco of [true, false]) {
      for (const sev of ["minima", "leve", "moderada", "moderada_grave", "grave"]) {
        const t = sugestaoRoteamento(sev, risco).texto.toLowerCase();
        expect(t).not.toContain("ansiedade");
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// metadados dos instrumentos
// ═══════════════════════════════════════════════════════════════════════════════

describe("instrumentos — metadados", () => {
  it("PHQ-9 tem exatamente 9 itens", () => {
    expect(PHQ9_ITENS).toHaveLength(9);
  });

  it("PHQ-9: o item 9 (índice 8) é o de ideação (texto contém 'morto' ou 'ferir')", () => {
    expect(PHQ9_ITENS[8].texto.toLowerCase()).toMatch(/morto|ferir/);
  });

  it("PHQ-9: ids são sequenciais de 1 a 9", () => {
    PHQ9_ITENS.forEach((item, i) => expect(item.id).toBe(i + 1));
  });

  it("GAD-7 tem exatamente 7 itens", () => {
    expect(GAD7_ITENS).toHaveLength(7);
  });

  it("GAD-7: ids são sequenciais de 1 a 7", () => {
    GAD7_ITENS.forEach((item, i) => expect(item.id).toBe(i + 1));
  });

  it("ESCALA_LIKERT tem 4 níveis com valores 0, 1, 2, 3 na ordem correta", () => {
    expect(ESCALA_LIKERT.map((e) => e.valor)).toEqual([0, 1, 2, 3]);
  });

  it("ESCALA_LIKERT[0].rotulo é 'Nenhuma vez'", () => {
    expect(ESCALA_LIKERT[0].rotulo).toBe("Nenhuma vez");
  });

  it("ESCALA_LIKERT[3].rotulo é 'Quase todos os dias'", () => {
    expect(ESCALA_LIKERT[3].rotulo).toBe("Quase todos os dias");
  });
});
