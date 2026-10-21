import { test, expect, type Page } from '@playwright/test';

/**
 * Spec 02 — Triagem PHQ-9 (autoavaliação de ânimo)
 *
 * Usa o mecanismo de "dev-login" para autenticar como paciente sem WhatsApp real.
 * O endpoint /api/auth/dev-login e as chamadas Supabase são interceptadas e
 * respondem com dados de sessão fictícios.
 *
 * Fluxo coberto:
 *   1. Mockar autenticação (dev-login + Supabase)
 *   2. Acessar /conta.html e clicar em "Usuário" na faixa dev
 *   3. Aguardar o ContaApp carregar (sessão ativa)
 *   4. Clicar no card "Como você está? (autoavaliação)"
 *   5. Escolher o instrumento "Como está seu ânimo" (PHQ-9)
 *   6. Responder as 9 perguntas com "Nenhuma vez" (valor 0)
 *   7. Confirmar resultado "Sintomas mínimos"
 *   8. Confirmar que o número 188 (CVV) aparece na página
 */

// Sessão fictícia — tokens não precisam ser válidos porque as chamadas Supabase
// também são interceptadas por page.route abaixo.
const MOCK_ACCESS_TOKEN = 'mock-access-token-revivaz-e2e';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token-revivaz-e2e';
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Configura todos os mocks de rede necessários para simular uma sessão
 * de paciente sem Supabase ou WhatsApp reais.
 */
async function mockAutenticacao(page: Page) {
  // 1. dev-login → retorna tokens fictícios
  await page.route('**/api/auth/dev-login', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: MOCK_ACCESS_TOKEN,
        refresh_token: MOCK_REFRESH_TOKEN,
      }),
    });
  });

  // 2. Supabase: troca de token (chamada interna de setSession / autoRefresh)
  await page.route('**/auth/v1/token**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: MOCK_ACCESS_TOKEN,
        refresh_token: MOCK_REFRESH_TOKEN,
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: MOCK_USER_ID,
          email: 'paciente-teste@revivaz.com',
          role: 'authenticated',
          app_metadata: { provider: 'whatsapp' },
          user_metadata: { perfil: 'paciente' },
        },
      }),
    });
  });

  // 3. Supabase: getUser (chamada getSession → /auth/v1/user)
  await page.route('**/auth/v1/user', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: MOCK_USER_ID,
        email: 'paciente-teste@revivaz.com',
        role: 'authenticated',
      }),
    });
  });

  // 4. Supabase REST: revivaz_users, consultas, receitas, etc. → retorna vazios
  //    para não bloquear a renderização do ContaApp
  await page.route('**/rest/v1/**', (route) => {
    // Perfil mínimo para o Header renderizar o nome do paciente
    if (route.request().url().includes('revivaz_users')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: MOCK_USER_ID, nome_completo: 'Paciente E2E', perfil: 'paciente' },
        ]),
      });
    } else {
      // Demais coleções (consultas, receitas, humores, etc.) → lista vazia
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      });
    }
  });

  // 5. Supabase Realtime (WebSocket) — ignorado no ambiente de teste
  await page.route('**/realtime/v1/**', (route) => route.abort());
}

// ─── Helpers de triagem ───────────────────────────────────────────────────────

/**
 * Responde todas as perguntas visíveis na tela com "Nenhuma vez" (valor 0).
 * PHQ-9 tem 9 perguntas, cada uma com role="radiogroup" e 4 opções role="radio".
 */
async function responderTodasComNenhumaVez(page: Page) {
  const grupos = page.getByRole('radiogroup');
  const total = await grupos.count();

  for (let i = 0; i < total; i++) {
    const grupo = grupos.nth(i);
    // Primeira opção de cada grupo é "Nenhuma vez" (valor 0)
    const opcaoNenhumaVez = grupo.getByRole('radio', { name: /nenhuma vez/i });
    await opcaoNenhumaVez.click();
  }
}

// ─── Testes ──────────────────────────────────────────────────────────────────

test.describe('Triagem PHQ-9', () => {
  test.beforeEach(async ({ page }) => {
    await mockAutenticacao(page);
    await page.goto('/conta.html');
  });

  test('dev-login como paciente carrega o ContaApp', async ({ page }) => {
    // A faixa de acesso rápido (dev) só aparece com import.meta.env.DEV=true
    const btnUsuario = page.getByRole('button', { name: /entrar como usuário \(dev\)/i });
    await expect(btnUsuario).toBeVisible({ timeout: 5_000 });

    // Clica e aguarda a navegação de volta para conta.html com sessão
    await Promise.all([
      page.waitForNavigation({ url: /conta\.html/, timeout: 10_000 }),
      btnUsuario.click(),
    ]);

    // Após redirecionamento, o ContaApp deve mostrar conteúdo do paciente
    // (pelo menos o card de triagem ou o header)
    await expect(
      page.getByRole('button', { name: /como você está\? \(autoavaliação\)/i })
    ).toBeVisible({ timeout: 8_000 });
  });

  test('completa o PHQ-9 com respostas 0 e vê resultado "mínima"', async ({ page }) => {
    // ── 1. Dev-login ─────────────────────────────────────────────────────────
    const btnUsuario = page.getByRole('button', { name: /entrar como usuário \(dev\)/i });
    await btnUsuario.click();
    await page.waitForNavigation({ url: /conta\.html/, timeout: 10_000 });

    // ── 2. Abre a triagem ──────────────────────────────────────────────────
    const cardTriagem = page.getByRole('button', {
      name: /como você está\? \(autoavaliação\)/i,
    });
    await expect(cardTriagem).toBeVisible({ timeout: 8_000 });
    await cardTriagem.click();

    // Tela de escolha do instrumento
    await expect(page.getByText(/escolha uma autoavaliação rápida/i)).toBeVisible();

    // ── 3. Escolhe o PHQ-9 ("Como está seu ânimo") ─────────────────────────
    const btnPhq9 = page.getByRole('button', { name: /como está seu ânimo/i });
    await expect(btnPhq9).toBeVisible();
    await btnPhq9.click();

    // Cabeçalho do questionário deve aparecer
    await expect(page.getByText(/durante as últimas 2 semanas/i)).toBeVisible();

    // ── 4. Responde as 9 perguntas com "Nenhuma vez" ────────────────────────
    // Aguarda as 9 perguntas renderizarem (LikertGroup por item)
    await expect(page.getByRole('radiogroup').first()).toBeVisible({ timeout: 5_000 });

    // Verifica que há exatamente 9 grupos (PHQ-9)
    const grupos = page.getByRole('radiogroup');
    await expect(grupos).toHaveCount(9, { timeout: 5_000 });

    await responderTodasComNenhumaVez(page);

    // ── 5. Confirma resultado ─────────────────────────────────────────────
    const btnVerResultado = page.getByRole('button', { name: /ver meu resultado/i });
    await expect(btnVerResultado).toBeEnabled();
    await btnVerResultado.click();

    // Score 0 no PHQ-9 → severidade "minima" → rótulo "Sintomas mínimos"
    await expect(page.getByText(/sintomas mínimos/i)).toBeVisible({ timeout: 5_000 });

    // ── 6. Verifica 188 na CriseBar (barra de emergência fixa na base) ─────
    // O CriseBar é um componente fixo que exibe 188 (CVV) em todas as telas
    // do ContaApp — garantia de acesso rápido a recursos de crise.
    await expect(page.getByRole('link', { name: /188.*cvv/i })).toBeVisible();
  });

  test('link 188 está presente na barra de emergência (CriseBar)', async ({ page }) => {
    // Este teste verifica de forma isolada que o CriseBar renderiza
    // o link tel:188 independentemente do resultado da triagem.

    // Dev-login
    const btnUsuario = page.getByRole('button', { name: /entrar como usuário \(dev\)/i });
    await btnUsuario.click();
    await page.waitForNavigation({ url: /conta\.html/, timeout: 10_000 });

    // CriseBar tem aria-label="Barra de emergência" e contém o link 188
    const criseBar = page.getByRole('complementary', { name: /barra de emergência/i });
    await expect(criseBar).toBeVisible({ timeout: 5_000 });
    await expect(criseBar.getByRole('link', { name: /188/i })).toBeVisible();

    // Verifica que o href é tel:188
    const link188 = criseBar.getByRole('link', { name: /188/i });
    await expect(link188).toHaveAttribute('href', 'tel:188');
  });

  test('disclaimer de autoavaliação é exibido ao abrir triagem', async ({ page }) => {
    // Dev-login e navegação
    await page.getByRole('button', { name: /entrar como usuário \(dev\)/i }).click();
    await page.waitForNavigation({ url: /conta\.html/, timeout: 10_000 });

    await page.getByRole('button', { name: /como você está\? \(autoavaliação\)/i }).click();

    // O DisclaimerBox exibe o texto de compliance (não é diagnóstico clínico)
    await expect(
      page.getByText(/não é um diagnóstico nem atendimento clínico/i)
    ).toBeVisible({ timeout: 5_000 });
  });
});
