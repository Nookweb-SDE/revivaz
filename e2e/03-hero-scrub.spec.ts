import { test, expect, type Page } from "@playwright/test";

/**
 * Portão do hero. O que estes testes protegem, em ordem de dor:
 *  - o scrub tem que andar com o scroll E voltar ao subir
 *  - reduced-motion não pode virar trilho de 380vh
 *  - o celular não pode baixar 2,9 MiB de quadros que ninguém desenha
 *  - o canvas é decoração: o conteúdo tem que existir em HTML
 *
 * Os seletores são [data-hero-canvas] e [data-hero-track], não "section canvas":
 * a landing tem outro canvas (o traço do EcgValor) que casaria com o genérico.
 */

const CANVAS = "[data-hero-canvas]";
const TRACK = "[data-hero-track]";

/** O trigger só arma depois que os 171 frames carregam; até lá o canvas fica em opacity 0. */
async function esperarFramesCarregados(page: Page) {
  await page.waitForFunction(
    (sel) => {
      const cv = document.querySelector(sel) as HTMLCanvasElement | null;
      return !!cv && getComputedStyle(cv).opacity === "1";
    },
    CANVAS,
    { timeout: 30_000 },
  );
}

/**
 * Lê os pixels do próprio canvas.
 *
 * Screenshot do elemento NÃO serve: o Playwright fotografa a região da tela,
 * então viriam junto os véus e a linha do eyebrow, que troca a cada 2,5 s —
 * dois quadros idênticos dariam bytes diferentes.
 */
function assinaturaDoCanvas(page: Page) {
  return page.evaluate((sel) => {
    const cv = document.querySelector(sel) as HTMLCanvasElement | null;
    return cv ? cv.toDataURL("image/png") : null;
  }, CANVAS);
}

test.describe("hero com scrub por frames", () => {
  test("o frame acompanha o scroll e volta ao subir", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    await expect(page.locator(CANVAS)).toBeVisible();
    await esperarFramesCarregados(page);

    const topo = await assinaturaDoCanvas(page);
    expect(topo).toBeTruthy();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35));
    await page.waitForTimeout(1200);
    const meio = await assinaturaDoCanvas(page);
    expect(meio).not.toBe(topo);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1600);
    const voltou = await assinaturaDoCanvas(page);
    expect(voltou).toBe(topo);
  });

  test("reduced-motion entrega poster estático, sem trilho", async ({ browser }) => {
    const ctx = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 900 },
    });
    const page = await ctx.newPage();
    await page.goto("/");

    await expect(page.locator(CANVAS)).toHaveCount(0);
    await expect(page.locator('img[src*="poster.webp"]').first()).toBeVisible();

    const altura = await page.locator(TRACK).evaluate((el) => el.getBoundingClientRect().height);
    expect(altura).toBeLessThan(900 * 1.6); // 380vh seria ~3420

    await ctx.close();
  });

  test("mobile: sem scroll horizontal e sem baixar os frames", async ({ page }) => {
    const pedidos: string[] = [];
    page.on("request", (r) => {
      if (/\/revivaz\/hero\/f\d{3}\./.test(r.url())) pedidos.push(r.url());
    });

    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto("/");
    await page.waitForTimeout(2000);

    const estoura = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(estoura).toBe(false);

    // No celular o canvas nem existe: baixar 2,9 MiB de quadros que ninguém
    // desenharia seria dado do visitante jogado fora.
    expect(pedidos).toHaveLength(0);
  });

  test("o canvas é decorativo para leitor de tela", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator(CANVAS)).toHaveAttribute("aria-hidden", "true");
    await expect(page.getByRole("heading", { name: "Saúde que conecta" })).toBeVisible();
  });
});
