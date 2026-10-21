import { describe, it, expect, vi } from "vitest";
import { paraAviso, empilhar, remover, avisar, ouvirAvisos } from "./aviso.logic";

const AGORA = new Date("2026-10-21T22:04:00Z");

describe("paraAviso", () => {
  it("tipo conhecido ganha rótulo, tom e cadeado", () => {
    const a = paraAviso("senha-errada", "Confira o e-mail", "x", AGORA);
    expect(a).toMatchObject({ id: "x", titulo: "Senha temporária errada", tom: "danger", cadeado: true });
    expect(a.linha).toBe("Confira o e-mail");
    expect(a.quando).toBe(AGORA.toISOString());
  });

  it("tipo desconhecido não some: mostra o próprio tipo, tom info, sem cadeado", () => {
    expect(paraAviso("algo-novo", null, "y", AGORA)).toMatchObject({ titulo: "algo-novo", tom: "info", cadeado: false });
  });
});

describe("empilhar / remover", () => {
  const a = (id: string) => paraAviso("entrou", null, id, AGORA);

  it("mais recente primeiro e respeita o teto de 3", () => {
    let pilha = [a("1")];
    for (const id of ["2", "3", "4"]) pilha = empilhar(pilha, a(id));
    expect(pilha.map((p) => p.id)).toEqual(["4", "3", "2"]);
  });

  it("mesmo id não empilha de novo", () => {
    const pilha = empilhar([a("1")], a("1"));
    expect(pilha).toHaveLength(1);
  });

  it("remove pelo id", () => {
    expect(remover([a("1"), a("2")], "1").map((p) => p.id)).toEqual(["2"]);
  });
});

describe("canal", () => {
  it("entrega a quem ouve e para de entregar depois de sair", () => {
    const fn = vi.fn();
    const sair = ouvirAvisos(fn);
    avisar("acesso-enviado", "ana@exemplo.com");
    sair();
    avisar("acesso-enviado");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0][0]).toMatchObject({ titulo: "Acesso enviado", linha: "ana@exemplo.com" });
  });
});
