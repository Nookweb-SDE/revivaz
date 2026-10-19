import { describe, it, expect } from "vitest";
import { deveRecarregar, ehFalhaDeVersaoVelha } from "./recuperaAtualizacao";

describe("site se recupera depois de atualização", () => {
  it("recarrega na primeira falha, mas não em laço", () => {
    expect(deveRecarregar(null, 100_000)).toBe(true);
    expect(deveRecarregar(95_000, 100_000)).toBe(false); // recarregou há 5 s
    expect(deveRecarregar(60_000, 100_000)).toBe(true); // há 40 s: pode de novo
  });

  it("reconhece a falha de arquivo da versão antiga nos navegadores", () => {
    expect(ehFalhaDeVersaoVelha("Failed to fetch dynamically imported module: https://revivaz.com.br/assets/cena-x.js")).toBe(true);
    expect(ehFalhaDeVersaoVelha("Importing a module script failed.")).toBe(true);
    expect(ehFalhaDeVersaoVelha("error loading dynamically imported module")).toBe(true);
    expect(ehFalhaDeVersaoVelha("Unable to preload CSS for /assets/x.css")).toBe(true);
    expect(ehFalhaDeVersaoVelha("Cannot read properties of undefined")).toBe(false);
  });
});
