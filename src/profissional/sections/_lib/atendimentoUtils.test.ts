import { describe, it, expect } from "vitest";
import {
  shortId,
  nomeDoPaciente,
  corNotaProf,
  labelNota,
  formatDataHora,
} from "./atendimentoUtils";
import type { Consulta } from "../../../lib/types";

function consulta(over: Partial<Consulta> = {}): Consulta {
  return {
    id: "aaaaaaaa-1111-4111-8111-111111111111",
    paciente_id: "bbbbbbbb-2222-4222-8222-222222222222",
    profissional_id: null,
    data: null,
    hora: null,
    tipo: "online",
    status: "agendada",
    link_ou_local: null,
    obs: null,
    created_at: "2026-08-26T12:00:00Z",
    ...over,
  } as Consulta;
}

describe("nomeDoPaciente", () => {
  it("usa o nome quando existe", () => {
    const c = consulta();
    expect(nomeDoPaciente(c, { [c.paciente_id]: "Maria Silva" })).toBe("Maria Silva");
  });

  it("cai no id curto quando não há nome — nunca mostra 'undefined' na tela", () => {
    const c = consulta();
    expect(nomeDoPaciente(c, {})).toBe(`Paciente #${shortId(c.paciente_id)}`);
  });

  it("nome só com espaço conta como ausente", () => {
    const c = consulta();
    expect(nomeDoPaciente(c, { [c.paciente_id]: "   " })).toContain("Paciente #");
  });

  it("não vaza o id inteiro do paciente, só os 8 primeiros", () => {
    const c = consulta();
    const saida = nomeDoPaciente(c, {});
    expect(saida).not.toContain(c.paciente_id);
    expect(saida).toContain(c.paciente_id.slice(0, 8));
  });
});

describe("faixa da nota (NPS do profissional)", () => {
  it("até 6 é 'precisa melhorar', em vermelho", () => {
    for (const n of [0, 3, 6]) {
      expect(labelNota(n)).toBe("Precisa melhorar");
      expect(corNotaProf(n).text).toBe("#991B1B");
    }
  });

  it("7 e 8 é 'razoável', em âmbar", () => {
    for (const n of [7, 8]) {
      expect(labelNota(n)).toBe("Razoável");
      expect(corNotaProf(n).text).toBe("#D97706");
    }
  });

  it("9 e 10 é 'recomendaria', em verde", () => {
    for (const n of [9, 10]) {
      expect(labelNota(n)).toBe("Recomendaria");
      expect(corNotaProf(n).text).toBe("#065F46");
    }
  });

  it("as bordas 6/7 e 8/9 não se confundem", () => {
    expect(labelNota(6)).not.toBe(labelNota(7));
    expect(labelNota(8)).not.toBe(labelNota(9));
  });
});

describe("formatDataHora", () => {
  it("sem data devolve null — o cartão mostra 'a combinar', não 'Invalid Date'", () => {
    expect(formatDataHora(consulta({ data: null }))).toBeNull();
  });

  it("com data e hora formata em pt-BR", () => {
    const s = formatDataHora(consulta({ data: "2026-09-10", hora: "14:30" }));
    expect(s).toContain("10/09/2026");
    expect(s).toContain("14:30");
  });

  it("com data e sem hora assume meia-noite em vez de quebrar", () => {
    const s = formatDataHora(consulta({ data: "2026-09-10", hora: null }));
    expect(s).toContain("10/09/2026");
    expect(s).not.toMatch(/Invalid/i);
  });
});
