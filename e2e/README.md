# Testes E2E — Revivaz

Testes end-to-end com [Playwright](https://playwright.dev/).  
As chamadas externas (WhatsApp, Supabase) são **mockadas** via `page.route()`,
de forma que nenhum envio real de mensagem ou acesso ao banco de dados ocorre.

---

## Pré-requisitos

- Node.js 20+
- Playwright instalado (`npx playwright install` após `npm install`)
- Dois servidores locais em execução (ver abaixo)

---

## Como rodar

Abra **3 terminais** na raiz do projeto:

```bash
# Terminal 1 — Vite dev server (frontend :5173)
npm run dev

# Terminal 2 — Express API (backend :8080)
npm run dev:api

# Terminal 3 — Testes E2E
npx playwright test
# ou via script npm:
npm run test:e2e
```

---

## Specs disponíveis

| Arquivo | Fluxo coberto |
|---|---|
| `01-login-otp.spec.ts` | Login WhatsApp OTP: preenche telefone, clica "Enviar código", verifica etapa de código |
| `02-triagem.spec.ts` | PHQ-9 via dev-login: 9 perguntas com 0, resultado "Sintomas mínimos", CriseBar com 188 |

---

## Mocks de rede

Cada spec intercepta as chamadas necessárias com `page.route()`:

| Endpoint interceptado | Motivo |
|---|---|
| `POST /api/wa/start` | Simula envio de OTP sem WhatsApp real |
| `POST /api/auth/dev-login` | Retorna tokens fictícios para autenticação |
| `**/auth/v1/token**` | Supabase setSession / autoRefresh |
| `**/auth/v1/user` | Supabase getSession |
| `**/rest/v1/**` | Dados do app (perfil, consultas, etc.) — retorna listas vazias |

---

## Comandos uteis

```bash
# Rodar em modo UI (debug visual)
npx playwright test --ui

# Rodar apenas um spec
npx playwright test e2e/02-triagem.spec.ts

# Gerar relatório HTML após falha
npx playwright show-report

# Instalar browsers (necessário na primeira vez)
npx playwright install chromium
```

---

## Artifacts de falha

Configurados em `playwright.config.ts`:

- **Screenshot**: `only-on-failure` — salvo em `test-results/`
- **Video**: `retain-on-failure` — salvo em `test-results/`

---

## Notas de implementacao

- **CriseBar**: componente fixo no rodape do ContaApp que exibe `tel:188`
  (CVV) e `tel:192` (SAMU) em todas as telas autenticadas. Os testes verificam
  sua presenca via `role="complementary"` com `aria-label="Barra de emergência"`.

- **Dev-login**: disponivel apenas com `import.meta.env.DEV=true` (Vite dev
  server). Em producao, o endpoint `/api/auth/dev-login` recusa requisicoes.

- **PHQ-9 score 0**: todas as respostas "Nenhuma vez" resultam em score 0 →
  severidade "minima" → rotulo "Sintomas mínimos". O componente `CrisisResources`
  (que exibe 188 no resultado) so aparece quando o item 9 do PHQ-9 e > 0
  (risco de ideacao). A CriseBar, entretanto, e sempre visivel.
