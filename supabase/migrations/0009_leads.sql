-- Fase 9 — Pedidos vindos do site (leads da landing)
--
-- Motivo: o formulário "Agendar consulta" da landing era decorativo — o botão
-- só trocava um estado local e NADA era gravado. Quem preenchia achava que
-- tinha agendado. Esta tabela é o destino real desse formulário.
--
-- O visitante NÃO tem sessão, então quem grava é o servidor com service_role
-- (que ignora RLS). Por isso não existe policy de insert para anon/authenticated:
-- ninguém escreve aqui direto do navegador.
-- Idempotente e aditiva.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null,
  email text,
  especialidade text,
  -- o que a pessoa PEDIU; a consulta de verdade só nasce quando o admin converte
  data_desejada date,
  hora_desejada time,
  origem text not null default 'landing',
  status text not null default 'novo' check (status in ('novo','contatado','convertido','descartado')),
  obs_interna text,
  created_at timestamptz not null default now()
);

create index if not exists leads_status_created_idx
  on public.leads (status, created_at desc);

alter table public.leads enable row level security;

-- Só admin lê e mexe. Dado de contato de gente em sofrimento: nada de leitura ampla.
drop policy if exists leads_admin_all on public.leads;
create policy leads_admin_all on public.leads
  for all
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.leads is
  'Pedidos de contato/agendamento vindos do site público. Gravados pelo servidor (service_role); lidos só por admin.';
