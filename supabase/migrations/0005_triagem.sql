-- Fase 6 — TRIAGEM clínica (AUTOAVALIAÇÃO PHQ-9 / GAD-7).
--
-- DADO DE SAÚDE MENTAL SENSÍVEL: a tabela guarda respostas item-a-item e a
-- pontuação de instrumentos de autorrelato (PHQ-9 depressão, GAD-7 ansiedade),
-- incluindo o sinalizador de ideação (item 9 do PHQ-9). RLS é a dona do acesso:
--   - o PRÓPRIO paciente vê/insere as suas (triagens_own_all);
--   - o admin lê tudo (triagens_admin_select);
--   - o profissional só lê as triagens de pacientes que TÊM consulta com ELE
--     (triagens_prof_select) — handoff do resumo, sem vazar a base inteira.
--
-- NÃO é diagnóstico: severidade é só uma FAIXA de pontuação; o roteamento é uma
-- SUGESTÃO. A app jamais grava nome de doença aqui.
--
-- Migration ADITIVA e idempotente — banco de prod tem dados, nada de DROP
-- destrutivo de tabela/coluna.

-- ---------------------------------------------------------------------------
-- Tabela
-- ---------------------------------------------------------------------------
create table if not exists public.triagens (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.profiles(id) on delete cascade,
  instrumento text not null check (instrumento in ('phq9', 'gad7')),
  respostas jsonb not null,           -- array de inteiros 0..3 (9 itens PHQ-9 / 7 GAD-7)
  score int not null,                 -- 0..27 (PHQ-9) ou 0..21 (GAD-7)
  severidade text not null,           -- FAIXA de pontuação, NÃO diagnóstico
  risco_ideacao boolean not null default false, -- PHQ-9 item 9 > 0
  created_at timestamptz not null default now()
);

create index if not exists triagens_paciente_idx
  on public.triagens (paciente_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.triagens enable row level security;

-- Paciente: dono total das PRÓPRIAS triagens (insert + select). Sem update/
-- delete por design — uma autoavaliação é um registro histórico imutável.
drop policy if exists triagens_own_all on public.triagens;
create policy triagens_own_all on public.triagens for all
  using (paciente_id = auth.uid())
  with check (paciente_id = auth.uid());

-- Admin: leitura de todas (operação/curadoria).
drop policy if exists triagens_admin_select on public.triagens;
create policy triagens_admin_select on public.triagens for select
  using (public.is_admin());

-- Profissional: lê APENAS as triagens de pacientes que tenham consulta com ELE
-- (profissional_id mapeia pro seu auth.uid() via tabela profissionais). Escopo
-- restrito ao handoff do resumo — não vaza triagem de quem não é cliente dele.
drop policy if exists triagens_prof_select on public.triagens;
create policy triagens_prof_select on public.triagens for select using (
  paciente_id in (
    select c.paciente_id from public.consultas c
    where c.profissional_id in (
      select id from public.profissionais where profile_id = auth.uid()
    )
  )
);
