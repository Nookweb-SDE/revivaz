import { defineConfig, devices } from '@playwright/test';

/**
 * Revivaz — Playwright E2E configuration
 *
 * Pré-requisitos para rodar:
 *   terminal 1: npm run dev       (Vite :5173)
 *   terminal 2: npm run dev:api   (Express :8080)
 *   terminal 3: npx playwright test
 *
 * Os specs mocam chamadas externas (/api/wa/start, /api/auth/dev-login,
 * Supabase), de forma que não é necessária conexão real com WhatsApp ou banco.
 */
export default defineConfig({
  testDir: 'e2e/',

  use: {
    /** URL base — Vite dev server padrão */
    baseURL: 'http://localhost:5173',

    /** Grava screenshot somente quando o teste falha */
    screenshot: 'only-on-failure',

    /** Grava vídeo somente quando o teste falha */
    video: 'retain-on-failure',

    /** Fecha o contexto após cada teste para evitar estado compartilhado */
    contextOptions: { ignoreHTTPSErrors: true },
  },

  /** 2 workers em CI, 1 local (evita concorrência no dev server único) */
  workers: process.env.CI ? 2 : 1,

  /** Tempo máximo por teste — 30 s é suficiente para flows locais */
  timeout: 30_000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
