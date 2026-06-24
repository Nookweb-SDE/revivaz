# Spec — Login com cards "modo dev" (acesso rápido por perfil)

**Data:** 2026-06-24 · **Projeto:** Revivaz · **Tipo:** ferramenta de QA/dev (local-only)

## Objetivo

Permitir entrar em 1 clique como cada perfil (Usuário/Paciente, Profissional, Admin) **só em ambiente de dev local**, para testar o fluxo completo `login → consulta → realizar → receita → paciente vê` sem precisar de magic-link/OTP. Inspirado no `dev-login` por departamento do Tecnopano.

## Não-objetivos (fora de escopo)

- Integrações: pagamento, geração de PDF, videochamada, notificações WhatsApp.
- Qualquer acesso na produção (`revivaz.com.br`) — ver Segurança.
- Mudar a identidade do login de produção (continua teal/Nunito).

## Segurança (dupla trava — inegociável)

App de saúde com dados reais. O atalho **nunca** pode existir em produção:

1. **Front:** a faixa de cards só renderiza sob `import.meta.env.DEV`. O `vite build` (prod) **remove o código do bundle**. Em `revivaz.com.br` não existe.
2. **Back:** `POST /api/auth/dev-login` responde **403** se `process.env.NODE_ENV === 'production'`. O Dockerfile de prod seta `NODE_ENV=production` → mesmo que alguém chame o endpoint na prod, ele recusa.

Ambas as travas são independentes; qualquer uma sozinha já bloqueia prod.

## Mapeamento de contas (decisão do dono)

`contato@izai.dev` = **superadmin puro**. Profissional e usuário testam em contas **separadas**:

| Card | E-mail (env-configurável) | Papel |
|---|---|---|
| 🛡️ Admin | `DEV_LOGIN_ADMIN_EMAIL` (default `contato@izai.dev`) | admin (não alterar) |
| 🩺 Profissional | `DEV_LOGIN_PROF_EMAIL` (default `profissional.teste@revivaz.app`) | profissional + ficha própria |
| 🧑 Usuário | `DEV_LOGIN_PACIENTE_EMAIL` (default `wa-5511965119797@revivaz.app`) | paciente |

E-mails sintéticos `@revivaz.app` funcionam: o dev-login cria a sessão via service_role (não depende de receber e-mail).

## Componentes

### 1. `server/server.ts` — `POST /api/auth/dev-login`
- Gate: se `NODE_ENV === 'production'` → 403 `{error:"disabled in production"}`.
- Body `{ perfil: 'paciente'|'profissional'|'admin' }`; valida.
- Resolve o e-mail do perfil (env ou default).
- **find-or-create** o auth user (mesmo padrão do `/api/wa/verify`: lista users, acha por e-mail, senão cria com `email_confirm:true`).
- Para `profissional`: garante `profiles.role='profissional'` e garante **uma** linha em `profissionais` com `profile_id` = uid (find-or-create da ficha). Para `admin`/`paciente`: não altera role.
- Seta senha temp aleatória (PUT em `/admin/users/{id}`) → `token?grant_type=password` → devolve `{access_token, refresh_token}`. Reusa `resolveSecret`/service_role/ANON já existentes.
- Nunca loga segredo.

### 2. `src/conta/Login.tsx` — faixa dev
- Sob `import.meta.env.DEV`, abaixo do card de login real: seção "Acesso rápido (dev)" com 3 cards (ícone lucide + label), cores teal (tokens `ui.ts`).
- Clique → `POST /api/auth/dev-login {perfil}` → `supabase.auth.setSession(tokens)` → `useSession` redireciona ao app do perfil. Estado de loading por card; erro inline.

### 3. Passo único de dados em PROD (com OK do dono)
Para o card Profissional mostrar o fluxo com dados: mover a ficha de `profissionais` existente (hoje `profile_id`=`contato@izai.dev`) para o novo `profissional.teste@revivaz.app`, e deixar `contato@izai.dev` como superadmin puro (sem ficha). As 2 consultas de teste já apontam pra essa ficha → seguem o vínculo automaticamente.

## Fluxo de dados

`Login (dev card)` → `fetch /api/auth/dev-login` → `server: find/create user + (prof) role+ficha + mint` → `{tokens}` → `supabase.auth.setSession` → `useSession` → app do perfil. RLS reais (0001–0004) valem normalmente.

## Erros
- perfil inválido → 400. NODE_ENV prod → 403. service_role/URL ausentes → 500. Falhas Supabase → 500 com log (sem segredo). Front: card mostra mensagem curta e reabilita.

## Teste / verificação
- `npm run build` (5 entradas) + `npm test` verdes.
- Local (`npm run dev`): clicar os 3 cards, confirmar entrada em `/conta` (paciente), `/profissional` (agenda/realizar/receita), `/admin`. Percorrer `login → consulta → realizar → receita → paciente vê`.
- Conferir que `vite build` (prod) **não** contém o texto do endpoint/cta dev (faixa removida).
