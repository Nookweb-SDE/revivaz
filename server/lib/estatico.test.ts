import { describe, it, expect } from "vitest";
import { pareceArquivo, cacheDe, urlNoSubdominio } from "./estatico";

describe("arquivo que não existe depois de atualizar", () => {
  it("pedido com extensão é arquivo (404 se faltar), rota da página não é", () => {
    expect(pareceArquivo("/assets/cena-B8sfMwd5.js")).toBe(true);
    expect(pareceArquivo("/revivaz/cel-m/f000.avif")).toBe(true);
    expect(pareceArquivo("/conta")).toBe(false);
    expect(pareceArquivo("/")).toBe(false);
    expect(pareceArquivo("/profissional/agenda")).toBe(false);
  });

  it("arquivos com hash ficam guardados um ano; páginas sempre conferem", () => {
    expect(cacheDe("/assets/main-B8AZO7k1.js")).toBe("public, max-age=31536000, immutable");
    expect(cacheDe("/index.html")).toBe("no-cache");
    expect(cacheDe("/acolhimento.html")).toBe("no-cache");
    expect(cacheDe("/revivaz/hero/poster.webp")).toBe("public, max-age=0");
  });
});

describe("subdomínio do comunicado", () => {
  it("comunicado.revivaz.com.br lê da pasta /comunicado; o site principal não muda", () => {
    expect(urlNoSubdominio("comunicado.revivaz.com.br", "/")).toBe("/comunicado/");
    expect(urlNoSubdominio("comunicado.revivaz.com.br", "/img/sofa.webp")).toBe("/comunicado/img/sofa.webp");
    expect(urlNoSubdominio("revivaz.com.br", "/")).toBe("/");
    expect(urlNoSubdominio("www.revivaz.com.br", "/acolhimento")).toBe("/acolhimento");
  });
});
