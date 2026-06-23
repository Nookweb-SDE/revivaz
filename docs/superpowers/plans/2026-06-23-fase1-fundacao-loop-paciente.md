# Fase 1 — Fundação Supabase + Loop do Paciente · Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans pra executar tarefa-a-tarefa. Passos usam checkbox (`- [ ]`). Em tarefas Supabase, o implementador DEVE consultar a skill `supabase` (auth/RLS/SSR/migrations) e em UI pode usar `frontend-design`, sempre respeitando a identidade do `/conta` já aprovado.

**Goal:** Tornar o sistema funcional de verdade: cadastro/login real (Supabase), banco real com RLS, e o loop cadastra → marca consulta → admin confirma + lança receita → paciente vê no `/conta`.

**Architecture:** React (Vite) fala direto com Supabase via `@supabase/supabase-js` (anon key + RLS). Camada fina em `src/lib/` (client, auth, data, types). `/conta` ganha gate de login e lê dados reais (substitui `sampleData`). Novo `/admin` (role=admin). Servidor Node atual não muda (só estático + `/api/acolhimento`).

**Tech Stack:** Supabase (Auth + Postgres + RLS), `@supabase/supabase-js`, React 18 + TS + Vite, vitest.

## Global Constraints

- App React fala DIRETO com Supabase (anon key + RLS). NENHUM backend novo de CRUD; `server/server.ts` não muda.
- **RLS ligado em TODAS as tabelas** desde a migration. `service_role` jamais no front.
- Envs do front: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (públicas). Sem segredo no repo.
- Auth: e-mail (magic link/OTP) funcional agora; phone/SMS OTP só stub (provedor depois).
- Admin (role=admin) cria profissionais e confirma/cria consultas + receitas. Profissional = Fase 3 (fora).
- NÃO persistir conversa da IA (LGPD, Fase 2). NÃO tocar `src/RevivazPreview.tsx`, landing, design system. Reusar identidade do `/conta`.
- Manter testes verdes; build gera 4 páginas: index, acolhimento, conta, admin.
- Provisionamento do projeto Supabase (URL+chaves) é passo de ATIVAÇÃO do dono (free tier) — o código todo é construído antes disso.

---

### Task 1: Migration — schema + RLS + trigger de profile

**Files:** Create `supabase/migrations/0001_init.sql`.

**Interfaces — Produces:** as tabelas e políticas que toda a camada `data.ts` consome (nomes/colunas exatos abaixo).

Conteúdo completo do arquivo (SQL Supabase/Postgres):

```sql
-- Fase 1 — schema + RLS. Dado de saúde é sensível: RLS em tudo.
create extension if not exists pgcrypto;

-- PROFILES (1:1 com auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  telefone text,
  emergencia_nome text,
  emergencia_tel text,
  prefs jsonb not null default '{}'::jsonb,
  role text not null default 'paciente' check (role in ('paciente','profissional','admin')),
  created_at timestamptz not null default now()
);

create table public.profissionais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  especialidade text,
  registro text,
  bio text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.consultas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.profiles(id) on delete cascade,
  profissional_id uuid references public.profissionais(id) on delete set null,
  data date,
  hora time,
  tipo text not null default 'online' check (tipo in ('online','presencial')),
  status text not null default 'solicitada' check (status in ('solicitada','agendada','realizada','cancelada')),
  link_ou_local text,
  created_at timestamptz not null default now()
);

create table public.receitas (
  id uuid primary key default gen_random_uuid(),
  consulta_id uuid references public.consultas(id) on delete set null,
  paciente_id uuid not null references public.profiles(id) on delete cascade,
  profissional_id uuid references public.profissionais(id) on delete set null,
  resumo text not null,
  arquivo_url text,
  created_at timestamptz not null default now()
);

create table public.humor_registros (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.profiles(id) on delete cascade,
  valor int not null check (valor between 0 and 4),
  dia date not null default current_date,
  created_at timestamptz not null default now()
);

-- Trigger: cria profile ao criar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome) values (new.id, new.raw_user_meta_data->>'nome')
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- helper admin
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.profissionais enable row level security;
alter table public.consultas enable row level security;
alter table public.receitas enable row level security;
alter table public.humor_registros enable row level security;

-- profiles: dono lê/edita o próprio; admin tudo
create policy profiles_self_select on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.is_admin());
create policy profiles_admin_all on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- profissionais: SELECT público (autenticado); escrita só admin
create policy prof_select on public.profissionais for select using (auth.role() = 'authenticated');
create policy prof_admin_write on public.profissionais for all using (public.is_admin()) with check (public.is_admin());

-- consultas: paciente só as dele (select/insert); admin tudo
create policy consultas_own_select on public.consultas for select using (paciente_id = auth.uid() or public.is_admin());
create policy consultas_own_insert on public.consultas for insert with check (paciente_id = auth.uid());
create policy consultas_admin_write on public.consultas for all using (public.is_admin()) with check (public.is_admin());

-- receitas: paciente só as dele (select); admin escreve
create policy receitas_own_select on public.receitas for select using (paciente_id = auth.uid() or public.is_admin());
create policy receitas_admin_write on public.receitas for all using (public.is_admin()) with check (public.is_admin());

-- humor: paciente só os dele
create policy humor_own_all on public.humor_registros for all using (paciente_id = auth.uid()) with check (paciente_id = auth.uid());
```

- [ ] **Step 1:** Criar o arquivo com o SQL acima, exatamente.
- [ ] **Step 2:** Sanidade de sintaxe — `grep -c "create policy" supabase/migrations/0001_init.sql` deve dar ≥ 9; conferir que toda tabela tem `enable row level security`.
- [ ] **Step 3: Commit** — `git add supabase/migrations/0001_init.sql && git commit -m "feat(db): migration Fase 1 (schema + RLS + trigger profile)"`

> Validação real = aplicar no projeto Supabase provisionado (passo de ativação). O reviewer confere RLS/consistência.

---

### Task 2: Client Supabase + tipos + deps + envs

**Files:** Create `src/lib/supabase.ts`, `src/lib/types.ts`, `src/lib/types.test.ts`; Modify `package.json`, `.env.example`.

**Interfaces — Produces:**
```ts
// src/lib/types.ts
export type Role = "paciente" | "profissional" | "admin";
export type Profile = { id: string; nome: string|null; telefone: string|null; emergencia_nome: string|null; emergencia_tel: string|null; prefs: Record<string,unknown>; role: Role; created_at: string };
export type Profissional = { id: string; nome: string; especialidade: string|null; registro: string|null; bio: string|null; ativo: boolean; created_at: string };
export type StatusConsulta = "solicitada" | "agendada" | "realizada" | "cancelada";
export type Consulta = { id: string; paciente_id: string; profissional_id: string|null; data: string|null; hora: string|null; tipo: "online"|"presencial"; status: StatusConsulta; link_ou_local: string|null; created_at: string };
export type Receita = { id: string; consulta_id: string|null; paciente_id: string; profissional_id: string|null; resumo: string; arquivo_url: string|null; created_at: string };
export type HumorRegistro = { id: string; paciente_id: string; valor: number; dia: string; created_at: string };
// src/lib/supabase.ts
export const supabase: SupabaseClient;  // criado de import.meta.env.VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
```

- [ ] **Step 1:** `npm install @supabase/supabase-js`.
- [ ] **Step 2:** Criar `src/lib/types.ts` (tipos acima) e `src/lib/supabase.ts`:
```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const supabase: SupabaseClient = createClient(url ?? "", anon ?? "", {
  auth: { persistSession: true, autoRefreshToken: true },
});
export const supabaseConfigured = Boolean(url && anon);
```
- [ ] **Step 3:** Escrever `src/lib/types.test.ts` — teste leve garantindo que os literais de status/role batem:
```ts
import { describe, it, expect } from "vitest";
import type { StatusConsulta, Role } from "./types";
describe("types", () => {
  it("status e role como esperado", () => {
    const s: StatusConsulta[] = ["solicitada","agendada","realizada","cancelada"];
    const r: Role[] = ["paciente","profissional","admin"];
    expect(s.length).toBe(4); expect(r.length).toBe(3);
  });
});
```
- [ ] **Step 4:** `.env.example` — adicionar:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
- [ ] **Step 5:** `npm test` (deve passar) + `npx tsc --noEmit -p tsconfig.json`.
- [ ] **Step 6: Commit** — `feat(lib): client Supabase + tipos + envs`

---

### Task 3: Camada de auth (e-mail OTP/magic link)

**Files:** Create `src/lib/auth.ts`. Consumes `supabase` (Task 2).
**Interfaces — Produces:**
```ts
export async function enviarLinkEmail(email: string): Promise<{ ok: boolean; erro?: string }>; // signInWithOtp({email})
export async function getSessionUserId(): Promise<string | null>;
export function onAuthChange(cb: (userId: string|null) => void): () => void; // retorna unsubscribe
export async function sair(): Promise<void>; // signOut
// stub p/ futuro: export async function enviarCodigoSms(tel: string): Promise<{ ok:false; erro:"sms-indisponivel" }>;
```

- [ ] **Step 1:** Implementar usando `supabase.auth.signInWithOtp`, `getSession`, `onAuthStateChange`, `signOut` (ver skill `supabase` pra assinaturas exatas). `enviarCodigoSms` retorna erro fixo "sms-indisponivel" (provedor depois).
- [ ] **Step 2:** `npx tsc --noEmit` sem erros novos.
- [ ] **Step 3: Commit** — `feat(lib): auth por e-mail (OTP/magic link) + stub SMS`

---

### Task 4: Camada de dados tipada

**Files:** Create `src/lib/data.ts`. Consumes `supabase`, tipos (Task 2).
**Interfaces — Produces:**
```ts
export async function getProfile(): Promise<Profile | null>;
export async function atualizarProfile(p: Partial<Profile>): Promise<void>;
export async function listProfissionais(): Promise<Profissional[]>;
export async function getConsultas(): Promise<Consulta[]>;          // do usuário logado (RLS)
export async function criarSolicitacao(input: { tipo: "online"|"presencial"; profissional_id?: string|null; obs?: string }): Promise<void>;
export async function getReceitas(): Promise<Receita[]>;
export async function registrarHumor(valor: number): Promise<void>;
// admin:
export async function adminListSolicitacoes(): Promise<Consulta[]>;  // status='solicitada'
export async function adminConfirmarConsulta(id: string, dados: { profissional_id: string; data: string; hora: string; link_ou_local?: string }): Promise<void>; // status='agendada'
export async function adminMarcarRealizada(id: string): Promise<void>;
export async function adminLancarReceita(input: { consulta_id: string; paciente_id: string; profissional_id: string; resumo: string }): Promise<void>;
export async function adminCriarProfissional(input: { nome: string; especialidade?: string; registro?: string; bio?: string }): Promise<void>;
```

- [ ] **Step 1:** Implementar cada função com `supabase.from(...).select/insert/update` tipado pelos tipos da Task 2. `criarSolicitacao` insere `paciente_id = (await getSessionUserId())` com status default 'solicitada'.
- [ ] **Step 2:** `npx tsc --noEmit` sem erros.
- [ ] **Step 3: Commit** — `feat(lib): camada de dados tipada (paciente + admin)`

---

### Task 5: `/conta` real — gate de login + dados do Supabase

**Files:** Create `src/conta/Login.tsx`, `src/conta/useSession.ts`; Modify `src/conta/ContaApp.tsx` e as seções que usavam `sampleData` (ProximaConsulta, ListaConsultas, Receitas, RegistroHumor, Perfil) pra receber dados reais via props (mantendo o MESMO visual). Consumes `auth.ts`, `data.ts`.

- Gate: `ContaApp` usa `useSession` → se sem sessão, renderiza `<Login>` (campo e-mail → `enviarLinkEmail` → "enviamos um link/código pro seu e-mail"). Se com sessão, carrega `getProfile/getConsultas/getReceitas` e passa pras seções.
- Estados de loading/erro/vazio acolhedores. Botão Sair (Perfil) → `sair()`.
- Se `!supabaseConfigured`: banner "ambiente sem backend configurado" + segue mostrando layout (não quebra build/dev sem envs).
- [ ] **Step 1:** Implementar `useSession` (usa `onAuthChange`/`getSessionUserId`), `Login`, e adaptar ContaApp + seções pra props reais (remover import de `sampleData` no app; manter tipos da Task 2). Pode usar `frontend-design` pra manter polimento.
- [ ] **Step 2:** `npx tsc --noEmit` + `npm run build` (4 páginas) + `npm test`.
- [ ] **Step 3: Commit** — `feat(conta): login + dados reais do Supabase`

---

### Task 6: `/admin` — área protegida (confirma consultas, lança receitas, cadastra profissional)

**Files:** Create `admin.html`, `src/admin/main.tsx`, `src/admin/AdminApp.tsx`, `src/admin/sections/{Solicitacoes,Profissionais,Receitas}.tsx`. Consumes `auth.ts`, `data.ts`, `ui.ts`.

- Gate: usa `useSession` + `getProfile()`; se `role !== 'admin'`, mostra "acesso restrito". Se admin, abas: **Solicitações** (lista `adminListSolicitacoes`, botão Confirmar → form profissional/data/hora/link → `adminConfirmarConsulta`; botão Marcar realizada; botão Lançar receita → `adminLancarReceita`), **Profissionais** (`listProfissionais` + form `adminCriarProfissional`).
- Identidade visual reusa `src/conta/ui.ts` (tokens teal). Barra de crise não é necessária aqui (é área de gestão).
- [ ] **Step 1:** Implementar as telas/admin com `data.ts`.
- [ ] **Step 2:** `npx tsc --noEmit` + `npm run build` + `npm test`.
- [ ] **Step 3: Commit** — `feat(admin): área de gestão (solicitações, receitas, profissionais)`

---

### Task 7: Wiring final — entry `/admin` no Vite + verificação das 4 páginas

**Files:** Modify `vite.config.ts` (adicionar `admin: "admin.html"` ao input, MERGE).

- [ ] **Step 1:** Adicionar o 4º input mantendo main/acolhimento/conta.
- [ ] **Step 2:** `npm run build` → confirmar `dist/index.html`, `dist/acolhimento.html`, `dist/conta.html`, `dist/admin.html` (`ls dist/*.html`). `npm test` verde. `npx tsc --noEmit` limpo.
- [ ] **Step 3: Commit** — `feat(build): entry /admin (4 páginas)`

---

## Ativação (fora das tarefas de código — passo do dono, free)

1. Dono cria projeto Supabase (free tier) → copia `URL` + `anon key` (+ `service_role` p/ aplicar migration).
2. Aplicar `supabase/migrations/0001_init.sql` (via dashboard SQL editor, CLI, ou MCP apontado ao novo projeto).
3. Setar `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` no build e rebuild da imagem → deploy Contabo.
4. Criar o 1º admin: signup por e-mail → no SQL, `update profiles set role='admin' where id='<uid>'`.
5. Validar o loop ponta-a-ponta no ar.

## Self-Review

- **Cobertura do spec:** migration+RLS (T1), client+tipos+envs (T2), auth e-mail+stub SMS (T3), camada de dados paciente+admin (T4), /conta login+real (T5), /admin (T6), 4º entry+build (T7), ativação documentada. ✅
- **Placeholders:** SQL e assinaturas TS concretos; UI reusa /conta aprovado. Sem TBD.
- **Consistência de tipos:** `Profile/Consulta/Receita/Profissional/HumorRegistro/StatusConsulta/Role` definidos em T2 e usados igual em T4/T5/T6; funções de `data.ts` (T4) consumidas por nome em T5/T6.
- **Nota honesta:** validação 100% funcional exige o projeto Supabase provisionado (ativação). O código é construído e verificado por tsc/build/testes-de-tipo antes disso; o loop real é validado pós-provisionamento.
