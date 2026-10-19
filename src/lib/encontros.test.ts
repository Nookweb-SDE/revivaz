import { describe, it, expect } from "vitest";
import { ENCONTROS, faltaPara, proximoEncontro, rotuloData } from "./encontros";

describe("calendário dos encontros", () => {
  it("tem os 12 encontros do ciclo nov/2026–out/2027", () => {
    expect(ENCONTROS).toHaveLength(12);
  });

  it("antes do início aponta para 26/11", () => {
    expect(proximoEncontro(new Date(2026, 9, 18))?.data).toBe("2026-11-26");
  });

  it("no próprio dia, mesmo à noite, ainda mostra o dia", () => {
    expect(proximoEncontro(new Date(2026, 10, 26, 21))?.data).toBe("2026-11-26");
  });

  it("no dia seguinte pula para dezembro, que é na 3ª quinta", () => {
    expect(proximoEncontro(new Date(2026, 10, 27))?.data).toBe("2026-12-17");
  });

  it("depois do último encontro não inventa data", () => {
    expect(proximoEncontro(new Date(2027, 9, 29))).toBeNull();
  });

  it("rótulo curto dia/mês", () => {
    expect(rotuloData(ENCONTROS[0])).toBe("26/11");
  });

  it("temas de novembro conforme o PDF", () => {
    expect(ENCONTROS[0].adolescentes).toBe("Bullying, agressividade, preconceito e proteção");
    expect(ENCONTROS[0].mulheres).toBe("Violência psicológica, limites, proteção e rede de apoio");
  });
});

describe("contagem para o próximo encontro", () => {
  it("conta até as 18h do dia do encontro", () => {
    expect(faltaPara(ENCONTROS[0], new Date(2026, 10, 25, 16, 30, 15))).toEqual({ dias: 1, horas: 1, min: 29, seg: 45 });
  });

  it("depois das 18h do dia fica zerada, sem número negativo", () => {
    expect(faltaPara(ENCONTROS[0], new Date(2026, 10, 26, 19))).toEqual({ dias: 0, horas: 0, min: 0, seg: 0 });
  });
});
