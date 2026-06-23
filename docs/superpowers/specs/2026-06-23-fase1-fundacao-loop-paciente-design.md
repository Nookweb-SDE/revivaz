# Fase 1 — Fundação + Loop do Paciente (sistema funcional, sem a chave da IA)

**Projeto:** plataforma de saúde mental (codinome "Revivaz", nome final a definir).
**Data:** 2026-06-23
**Status:** Design aprovado pelo dono.

## 1. Objetivo

Transformar as peças soltas (landing, `/acolhimento`, `/conta` mock) num **sistema conectado e funcional de verdade**, construindo a primeira fatia que NÃO depende da chave da IA: cadastro/login real, banco real, e o loop **cadastra → marca consulta → admin confirma + lança receita → paciente vê tudo no `/conta`**.

## 2. Decisões âncora (com o dono)

- **Stack de backend:** **Supabase** (auth + Postgres + RLS) — padrão dos outros projetos do dono (Monosphera/WR2/Multitags). O app React fala **direto** com o Supabase via `@supabase/supabase-js` (anon key + RLS). NENHUM backend novo de CRUD.
- **Servidor Node atual (`server/server.ts`)** continua **só** servindo o estático + `/api/acolhimento` (IA, parada na chave). Não vira backend de dados.
- **Login:** e-mail (magic link / OTP) **funcionando já**; telefone/SMS OTP **wired no código** mas depende de provedor SMS (Twilio/etc. — custo/config) → ligar depois.
- **Dados na Fase 1:** um **admin** (role=admin) cria profissionais e confirma/cria consultas + lança receitas na mão (não há profissionais reais ainda; portal do profissional = Fase 3).
- **LGPD:** dado de saúde é sensível → **RLS obrigatório** (paciente só vê o que é dele). Conversa da IA NÃO é persistida nesta fase (Fase 2, com consentimento).

## 3. Arquitetura

```
React (Vite) ──(@supabase/supabase-js, anon key)──► Supabase  (Auth + Postgres + RLS)
  /conta    : área do paciente (login, dados reais)        │
  /admin    : área do admin (gerencia tudo)                │ RLS protege por role/owner
  /acolhimento : chat (IA parada na chave) + CTA "agendar" ─┘
server/server.ts : só estático + /api/acolhimento (IA)  ── não toca em dados
```

- **Chaves:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` vão no build do front (públicas — seguras com RLS, padrão Supabase). `service_role` **nunca** no front (só se algum script admin precisar, server-side).
- **Provisionamento:** 1 projeto Supabase novo (free tier). Criado via MCP do Supabase (se autenticado) ou pelo dono (2 min); schema aplicado por migration SQL versionada (`supabase/migrations/`).

## 4. Banco de dados (schema + RLS)

Tabelas (todas com `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`):

- **`profiles`** — `id uuid` (= `auth.users.id`), `nome text`, `telefone text`, `emergencia_nome text`, `emergencia_tel text`, `prefs jsonb`, `role text check in ('paciente','profissional','admin') default 'paciente'`.
- **`profissionais`** — `nome text`, `especialidade text`, `registro text` (CRP/CRM), `bio text`, `ativo bool default true`.
- **`consultas`** — `paciente_id uuid → profiles`, `profissional_id uuid → profissionais` (nullable até confirmar), `data date`, `hora time`, `tipo text check in ('online','presencial')`, `status text check in ('solicitada','agendada','realizada','cancelada') default 'solicitada'`, `link_ou_local text`.
- **`receitas`** — `consulta_id uuid → consultas`, `paciente_id uuid → profiles`, `profissional_id uuid → profissionais`, `resumo text`, `arquivo_url text` (nullable).
- **`humor_registros`** — `paciente_id uuid → profiles`, `valor int check 0..4`, `dia date`.

**RLS (resumo — políticas por tabela):**
- Helper `is_admin()` = `exists(select 1 from profiles where id=auth.uid() and role='admin')`.
- `profiles`: cada um lê/edita o próprio (`id = auth.uid()`); admin lê/edita todos.
- `consultas` / `receitas` / `humor_registros`: paciente faz SELECT/INSERT só onde `paciente_id = auth.uid()`; admin tudo. (Profissional = Fase 3.)
- `profissionais`: SELECT público (lista de quem atende); INSERT/UPDATE só admin.

## 5. Fluxo de dados (o loop)

1. Pessoa entra → `/acolhimento` (chat) ou CTA **Agendar** → cai no cadastro/login (`/conta`).
2. **Login** (e-mail magic link/OTP) → cria `profiles` row (trigger `on auth.user created`) com role=paciente.
3. No `/conta`, **Agendar consulta**: escolhe tipo + (opcional) profissional + preferência de horário → cria `consultas` com `status='solicitada'`.
4. No **`/admin`** (dono), aba "Solicitações": confirma → define profissional + data/hora + `status='agendada'` (+ link). Depois marca `realizada` e **lança receita** (cria `receitas`).
5. No `/conta`, o paciente vê a consulta (status real) e a receita (baixar) — **dados reais**, não mock. Registro de humor persiste.

## 6. Mudanças no front (sobre o que já existe)

- `src/conta/` deixa de usar `sampleData.ts` → passa a ler do Supabase (camada `src/lib/supabase.ts` + hooks de dados). Mantém o MESMO visual já aprovado.
- Adiciona **gate de login** no `/conta` (se não logado, tela de entrada por e-mail).
- Novo entry/área **`/admin`** (`admin.html` + `src/admin/`), protegido por role=admin.
- `sampleData.ts` vira fallback/seed de dev (ou é removido); os testes de shape passam a cobrir os tipos do banco.

## 7. Componentização (arquivos focados)

- `src/lib/supabase.ts` — client único (URL+anon das envs).
- `src/lib/auth.ts` — login (email OTP/magic link), sessão, logout; stub p/ phone OTP.
- `src/lib/data.ts` — funções tipadas: `getConsultas()`, `criarSolicitacao()`, `getReceitas()`, `registrarHumor()`, `getProfile()`, etc. (uma responsabilidade: acesso a dados).
- `src/conta/*` — adapta seções pra consumir `data.ts` em vez de `sampleData`.
- `src/admin/*` — área admin (lista solicitações, confirma, lança receita, cadastra profissional).
- `supabase/migrations/0001_init.sql` — schema + RLS versionado.

## 8. Restrições / segurança

- **RLS ligado em todas as tabelas** desde a migration (nunca tabela aberta com dado sensível).
- `service_role` jamais no front; anon key + RLS é o modelo.
- Não persistir conversa da IA nesta fase (LGPD).
- Não tocar na landing (`src/RevivazPreview.tsx`) nem no design system; reusar a identidade do `/conta`.
- Manter testes verdes; build gera todas as páginas (index, acolhimento, conta, admin).

## 9. Sucesso (Fase 1)

Um fluxo real ponta-a-ponta no ambiente: criar conta por e-mail → marcar consulta → no `/admin` confirmar + lançar receita → no `/conta` ver consulta agendada + receita, tudo persistido no Supabase com RLS isolando por usuário.

## Próximo passo

Plano de implementação (writing-plans) → provisionar Supabase + migration + camada de dados + login + /conta real + /admin → validar o loop. Fases 2 (IA conectada/Gemini), 3 (portal do profissional) e 4 (métricas) vêm depois.
