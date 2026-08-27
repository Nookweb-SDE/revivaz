import { describe, it, expect } from "vitest";
import {
  podeTransicionar,
  LABEL_STATUS,
  type StatusCandidatura,
} from "./candidaturaEstados";

const TODOS: StatusCandidatura[] = [
  "recebida",
  "em_analise",
  "pendencia",
  "aprovada",
  "recusada",
];

describe("máquina de estados da candidatura", () => {
  it("permite o caminho feliz", () => {
    expect(podeTransicionar("recebida", "em_analise")).toBe(true);
    expect(podeTransicionar("em_analise", "aprovada")).toBe(true);
  });

  it("permite recusar desde o começo", () => {
    expect(podeTransicionar("recebida", "recusada")).toBe(true);
    expect(podeTransicionar("em_analise", "recusada")).toBe(true);
  });

  it("permite pendência e o reenvio do candidato", () => {
    expect(podeTransicionar("em_analise", "pendencia")).toBe(true);
    expect(podeTransicionar("pendencia", "em_analise")).toBe(true);
  });

  it("pendência também pode ser recusada: senão o candidato fica preso e o admin sem saída", () => {
    expect(podeTransicionar("pendencia", "recusada")).toBe(true);
  });

  it("aprovada e recusada são finais", () => {
    for (const destino of TODOS) {
      expect(podeTransicionar("aprovada", destino), `aprovada→${destino}`).toBe(false);
      expect(podeTransicionar("recusada", destino), `recusada→${destino}`).toBe(false);
    }
  });

  it("recusada NÃO vira aprovada: para reconsiderar, o candidato envia de novo", () => {
    expect(podeTransicionar("recusada", "aprovada")).toBe(false);
  });

  it("não dá para pular a análise indo direto de recebida para aprovada", () => {
    expect(podeTransicionar("recebida", "aprovada")).toBe(false);
  });

  it("transição para o mesmo estado é recusada — é o que torna aprovar idempotente", () => {
    for (const s of TODOS) expect(podeTransicionar(s, s), s).toBe(false);
  });

  it("todo status tem um rótulo em português para a tela", () => {
    for (const s of TODOS) expect(LABEL_STATUS[s].length).toBeGreaterThan(3);
  });
});
