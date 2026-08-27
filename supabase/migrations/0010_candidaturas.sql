-- supabase/migrations/0010_candidaturas.sql
-- Fase 10 — Candidatura do profissional
--
-- Hoje o profissional não se candidata: o admin cria a linha em `profissionais`
-- na mão e vincula o login. Esta tabela é a fila de entrada.
--
-- Por que tabela separada e não um `status` dentro de `profissionais`: enquanto
-- não for aprovado, o candidato NÃO EXISTE em `profissionais`. Assim nenhum
-- filtro esquecido pode transformá-lo em profissional com acesso a prontuário, e
-- `is_profissional()` não muda uma vírgula.
--
-- O trigger `candidatura_trava_decisao` libera duas rotas: admin (por RLS) e
-- servidor/service_role. A trava existe para conter escrita vinda do navegador
-- (supabase-js do candidato); o servidor é o escritor confiável e valida a
-- transição pela máquina de estados antes de gravar.
-- Idempotente e aditiva.

create table if not exists public.candidaturas (
  id uuid primary key default gen_random_uuid(),
  -- uma candidatura por pessoa
  profile_id uuid not null unique references public.profiles(id) on delete cascade,

  nome_completo text not null,
  cpf text not null,
  telefone text not null,

  conselho text not null,
  registro text not null,
  uf_conselho text,
  especialidade text not null,
  -- opcional de propósito: exigir CNPJ é barreira para quem doa horas
  cnpj text,

  bio text,
  horas_semana int,

  status text not null default 'recebida'
    check (status in ('recebida','em_analise','pendencia','aprovada','recusada')),
  -- por que recusou, ou o que falta na pendência
  motivo text,

  -- aceite versionado do Termo do Profissional
  termo_versao text,
  termo_aceito_em timestamptz,
  termo_aceito_ip text,

  -- EVIDÊNCIA da análise (retorno da BigDataCorp, quem conferiu o conselho e
  -- quando). Nunca decisão automática.
  verificacao jsonb not null default '{}'::jsonb,

  analisado_por uuid references public.profiles(id) on delete set null,
  analisado_em timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists candidaturas_status_created_idx
  on public.candidaturas (status, created_at desc);

alter table public.candidaturas enable row level security;

-- O candidato lê só a dele; admin lê todas.
drop policy if exists candidatura_self_select on public.candidaturas;
create policy candidatura_self_select on public.candidaturas
  for select
  using (profile_id = auth.uid() or public.is_admin());

-- O candidato corrige a dele só enquanto está aberta.
drop policy if exists candidatura_self_update on public.candidaturas;
create policy candidatura_self_update on public.candidaturas
  for update
  using (profile_id = auth.uid() and status in ('recebida','pendencia'))
  with check (profile_id = auth.uid() and status in ('recebida','pendencia'));

-- Os campos de DECISÃO são travados por trigger, não por RLS: o WITH CHECK só
-- enxerga a linha nova, então não dá para comparar com a antiga ali. O trigger
-- devolve os valores originais se alguém que não é admin tentar mexer.
create or replace function public.candidatura_trava_decisao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Libera dois escritores: o admin, e o SERVIDOR (service_role). A trava existe
  -- para conter a escrita vinda do navegador, que é o supabase-js do candidato.
  -- O servidor é o escritor confiável: é ele quem confere a transição pela
  -- máquina de estados antes de gravar. Sem esta liberação, o reenvio de uma
  -- candidatura em pendência seria revertido em silêncio e o candidato ficaria
  -- preso vendo um motivo que já resolveu.
  if current_user = 'service_role' or public.is_admin() then
    return new;
  end if;
  new.status        := old.status;
  new.motivo        := old.motivo;
  new.verificacao   := old.verificacao;
  new.analisado_por := old.analisado_por;
  new.analisado_em  := old.analisado_em;
  new.termo_versao    := old.termo_versao;
  new.termo_aceito_em := old.termo_aceito_em;
  new.termo_aceito_ip := old.termo_aceito_ip;
  return new;
end;
$$;

drop trigger if exists candidatura_trava_decisao_tg on public.candidaturas;
create trigger candidatura_trava_decisao_tg
  before update on public.candidaturas
  for each row execute function public.candidatura_trava_decisao();

-- Admin faz tudo.
drop policy if exists candidatura_admin_all on public.candidaturas;
create policy candidatura_admin_all on public.candidaturas
  for all
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.candidaturas is
  'Fila de entrada do profissional. O insert vem do servidor (service_role), porque o IP do aceite do termo só existe lá.';
