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
