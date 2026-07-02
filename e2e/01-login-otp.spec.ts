import { test, expect } from '@playwright/test';

/**
 * Spec 01 — Login via WhatsApp OTP
 *
 * O envio real de mensagem WhatsApp NÃO é testado aqui.
 * A chamada POST /api/wa/start é interceptada e responde { ok: true },
 * simulando que o backend aceitou o telefone e "enviou" o código.
 *
 * Fluxo coberto:
 *   1. Acessar /conta.html (tela de login)
 *   2. Alternar para aba WhatsApp
 *   3. Preencher número de teste
 *   4. Clicar "Enviar código pelo WhatsApp"
 *   5. Verificar que a UI avança para a etapa de código (texto "Código enviado para")
 */

const TELEFONE_TESTE = '(11) 91234-5678';

test.describe('Login OTP via WhatsApp', () => {
  test.beforeEach(async ({ page }) => {
    // Intercepta /api/wa/start e retorna sucesso sem bater no backend real.
    await page.route('**/api/wa/start', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    // Intercepta /api/wa/verify (não usado neste spec, mas evita erros se chamado).
    await page.route('**/api/wa/verify', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, error: 'código inválido (mock)' }),
      });
    });

    await page.goto('/conta.html');
  });

  test('exibe tela de login com as abas E-mail e WhatsApp', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /e-mail/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /whatsapp/i })).toBeVisible();
  });

  test('botão "Enviar código pelo WhatsApp" existe e é clicável após preencher telefone', async ({ page }) => {
    // Alterna para aba WhatsApp
    await page.getByRole('tab', { name: /whatsapp/i }).click();

    // Campo de telefone visível
    const inputTel = page.getByLabel(/seu whatsapp/i);
    await expect(inputTel).toBeVisible();

    // Preenche o telefone de teste
    await inputTel.fill(TELEFONE_TESTE);

    // Botão deve existir e estar habilitado (telefone tem ≥ 10 dígitos)
    const btnEnviar = page.getByRole('button', { name: /enviar código pelo whatsapp/i });
    await expect(btnEnviar).toBeVisible();
    await expect(btnEnviar).toBeEnabled();

    // Clica no botão
    await btnEnviar.click();
  });

  test('exibe mensagem "Código enviado para" após envio bem-sucedido', async ({ page }) => {
    // Alterna para aba WhatsApp
    await page.getByRole('tab', { name: /whatsapp/i }).click();

    // Preenche telefone e envia
    await page.getByLabel(/seu whatsapp/i).fill(TELEFONE_TESTE);
    await page.getByRole('button', { name: /enviar código pelo whatsapp/i }).click();

    // Aguarda transição para etapa de código
    await expect(page.getByText(/código enviado para/i)).toBeVisible();

    // O número formatado deve aparecer confirmando qual telefone recebeu o código
    await expect(page.getByText(/91234-5678/)).toBeVisible();

    // Campo de código de 6 dígitos deve aparecer
    const inputCodigo = page.getByLabel(/código de 6 dígitos/i);
    await expect(inputCodigo).toBeVisible();
  });
});
