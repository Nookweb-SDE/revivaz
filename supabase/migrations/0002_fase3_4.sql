-- Fase 3 (portal do profissional) + Fase 4 (métricas) + IA persistida + NPS.
-- Migration ADITIVA e idempotente: nada de DROP destrutivo, banco de prod tem dados.

-- ---------------------------------------------------------------------------
-- Vínculo profissional <-> auth user
-- ---------------------------------------------------------------------------
-- profile_id liga uma linha de profissionais ao auth.uid() (role='profissional').
alter table public.profissionais
  add column if not exists profile_id uuid references public.profiles(id) on delete set null;

-- Um auth user só pode estar vinculado a um profissional (ignora NULLs).
create unique index if not exists profissionais_profile_id_uniq
  on public.profissionais (profile_id) where profile_id is not null;

-- helper: o chamador é um profissional ATIVO?
-- Espelha is_admin(): security definer, só revela se o PRÓPRIO chamador é prof.
-- FICA executável por authenticated DE PROPÓSITO (usada dentro das políticas RLS).
create or replace function public.is_profissional()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profissionais
    where profile_id = auth.uid() and ativo
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS: profissional vê/edita só as consultas DELE
-- ---------------------------------------------------------------------------
-- profissional só LÊ consultas cujo profissional_id mapeia pro seu auth.uid().
drop policy if exists consultas_prof_select on public.consultas;
create policy consultas_prof_select on public.consultas for select using (
  profissional_id in (select id from public.profissionais where profile_id = auth.uid())
);

-- profissional só ATUALIZA consultas dele; WITH CHECK impede reatribuir a consulta
-- a outro profissional ou trocar o paciente_id (o profissional_id tem que continuar
-- sendo um dos dele). Sem INSERT/DELETE de consulta pro profissional.
drop policy if exists consultas_prof_update on public.consultas;
create policy consultas_prof_update on public.consultas for update using (
  profissional_id in (select id from public.profissionais where profile_id = auth.uid())
) with check (
  profissional_id in (select id from public.profissionais where profile_id = auth.uid())
  and paciente_id = (select paciente_id from public.consultas c where c.id = consultas.id)
);

-- ---------------------------------------------------------------------------
-- RLS: receitas do profissional
-- ---------------------------------------------------------------------------
-- profissional INSERE receita só p/ consulta DELE (profissional_id mapeia pro
-- auth.uid() E a consulta referida pertence a ele) E o paciente_id da receita
-- TEM que ser o paciente daquela consulta (impede injetar receita visível p/ um
-- paciente arbitrário — não confiar no client p/ preencher paciente_id).
drop policy if exists receitas_prof_insert on public.receitas;
create policy receitas_prof_insert on public.receitas for insert with check (
  profissional_id in (select id from public.profissionais where profile_id = auth.uid())
  and consulta_id in (
    select c.id from public.consultas c
    where c.profissional_id in (select id from public.profissionais where profile_id = auth.uid())
  )
  and paciente_id = (select c.paciente_id from public.consultas c where c.id = consulta_id)
);

-- profissional LÊ as receitas que ele mesmo lançou.
drop policy if exists receitas_prof_select on public.receitas;
create policy receitas_prof_select on public.receitas for select using (
  profissional_id in (select id from public.profissionais where profile_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- RLS: profissional edita a PRÓPRIA linha (bio). Escrita ampla continua só admin.
-- ---------------------------------------------------------------------------
drop policy if exists prof_self_update on public.profissionais;
create policy prof_self_update on public.profissionais for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Conversa IA persistida (paciente)
-- ---------------------------------------------------------------------------
create table if not exists public.conversas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.profiles(id) on delete cascade,
  titulo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.conversas(id) on delete cascade,
  papel text not null check (papel in ('user','assistant')),
  conteudo text not null,
  created_at timestamptz not null default now()
);

alter table public.conversas enable row level security;
alter table public.mensagens enable row level security;

-- conversas: dono only (paciente_id = auth.uid()); admin lê tudo.
drop policy if exists conversas_own_all on public.conversas;
create policy conversas_own_all on public.conversas for all
  using (paciente_id = auth.uid())
  with check (paciente_id = auth.uid());
drop policy if exists conversas_admin_select on public.conversas;
create policy conversas_admin_select on public.conversas for select using (public.is_admin());

-- mensagens: dono via EXISTS na conversa dele; admin lê tudo.
drop policy if exists mensagens_own_all on public.mensagens;
create policy mensagens_own_all on public.mensagens for all
  using (exists (
    select 1 from public.conversas c
    where c.id = mensagens.conversa_id and c.paciente_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.conversas c
    where c.id = mensagens.conversa_id and c.paciente_id = auth.uid()
  ));
drop policy if exists mensagens_admin_select on public.mensagens;
create policy mensagens_admin_select on public.mensagens for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- NPS / avaliações (uma por consulta)
-- ---------------------------------------------------------------------------
create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  consulta_id uuid references public.consultas(id) on delete cascade,
  paciente_id uuid not null references public.profiles(id) on delete cascade,
  nota int not null check (nota between 0 and 10),
  comentario text,
  created_at timestamptz not null default now(),
  unique (consulta_id)
);

alter table public.avaliacoes enable row level security;

-- avaliacoes: paciente insere/lê as suas; admin lê tudo; profissional lê as das
-- consultas dele (opcional, p/ feedback).
drop policy if exists avaliacoes_own_all on public.avaliacoes;
create policy avaliacoes_own_all on public.avaliacoes for all
  using (paciente_id = auth.uid())
  with check (
    paciente_id = auth.uid()
    -- só avalia consulta DELE (ou avaliação sem consulta vinculada);
    -- impede "travar" o slot unique(consulta_id) de uma consulta alheia.
    and (
      consulta_id is null
      or consulta_id in (select id from public.consultas where paciente_id = auth.uid())
    )
  );
drop policy if exists avaliacoes_admin_select on public.avaliacoes;
create policy avaliacoes_admin_select on public.avaliacoes for select using (public.is_admin());
drop policy if exists avaliacoes_prof_select on public.avaliacoes;
create policy avaliacoes_prof_select on public.avaliacoes for select using (
  consulta_id in (
    select c.id from public.consultas c
    where c.profissional_id in (select id from public.profissionais where profile_id = auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- RPC métricas (admin) — security definer, gate no topo.
-- ---------------------------------------------------------------------------
-- Retorna jsonb com as chaves do tipo MetricsOverview. So admin pode chamar.
create or replace function public.metrics_overview()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_pacientes int;
  v_solicitadas int;
  v_agendadas int;
  v_realizadas int;
  v_nao_canceladas int;
  v_taxa numeric;
  v_promotores int;
  v_detratores int;
  v_total_aval int;
  v_nps numeric;
  v_humor numeric;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select count(*) into v_pacientes from public.profiles where role = 'paciente';

  select
    count(*) filter (where status = 'solicitada'),
    count(*) filter (where status = 'agendada'),
    count(*) filter (where status = 'realizada'),
    count(*) filter (where status <> 'cancelada')
  into v_solicitadas, v_agendadas, v_realizadas, v_nao_canceladas
  from public.consultas;

  -- taxa = realizada / total nao-cancelada (0 se sem dados)
  if v_nao_canceladas > 0 then
    v_taxa := round(v_realizadas::numeric / v_nao_canceladas, 4);
  else
    v_taxa := 0;
  end if;

  -- NPS a partir das notas: promotor>=9, detrator<=6; null se sem avaliações.
  select
    count(*) filter (where nota >= 9),
    count(*) filter (where nota <= 6),
    count(*)
  into v_promotores, v_detratores, v_total_aval
  from public.avaliacoes;

  if v_total_aval > 0 then
    v_nps := round(((v_promotores::numeric - v_detratores) / v_total_aval) * 100);
  else
    v_nps := null;
  end if;

  -- humor médio dos últimos 7 dias (null se sem registros).
  select round(avg(valor)::numeric, 2) into v_humor
  from public.humor_registros
  where dia >= current_date - 7;

  return jsonb_build_object(
    'pacientes', v_pacientes,
    'consultas_solicitadas', v_solicitadas,
    'consultas_agendadas', v_agendadas,
    'consultas_realizadas', v_realizadas,
    'taxa_realizacao', v_taxa,
    'nps', v_nps,
    'humor_medio_7d', v_humor
  );
end; $$;

grant execute on function public.metrics_overview() to authenticated;
