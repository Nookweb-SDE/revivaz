-- Fase 5 (completar telas/perfis) — RLS p/ profissional ler pacientes dele,
-- paciente cancelar a própria consulta, e anotação clínica do profissional.
-- Migration ADITIVA e idempotente: nada de DROP destrutivo, banco de prod tem dados.

-- ---------------------------------------------------------------------------
-- RLS: profissional lê dados (nome/telefone) dos PACIENTES dele
-- ---------------------------------------------------------------------------
-- DADO DE SAÚDE sensível: escopo bem restrito por subquery. O profissional só
-- enxerga profiles de pacientes que tenham PELO MENOS uma consulta com ELE
-- (profissional_id mapeia pro seu auth.uid()). Não vaza a base de pacientes
-- inteira — só quem já é cliente dele. Sem essa policy ele não consegue exibir
-- o nome/telefone do paciente na agenda/histórico.
drop policy if exists profiles_prof_patient_read on public.profiles;
create policy profiles_prof_patient_read on public.profiles for select using (
  id in (
    select c.paciente_id from public.consultas c
    where c.profissional_id in (
      select id from public.profissionais where profile_id = auth.uid()
    )
  )
);

-- ---------------------------------------------------------------------------
-- RLS: paciente atualiza a PRÓPRIA consulta (usado p/ cancelar)
-- ---------------------------------------------------------------------------
-- A função cancelarConsulta() só seta status='cancelada'. WITH CHECK trava o
-- paciente a (a) continuar dono da linha, (b) só estados 'solicitada'/'cancelada'
-- (não pode se auto-marcar 'agendada'/'realizada') e (c) NÃO trocar o
-- profissional_id (impede o paciente se auto-atribuir a um profissional sem o
-- admin). Pode ajustar tipo/obs/data do próprio pedido — é a requisição dele.
drop policy if exists consultas_own_update on public.consultas;
create policy consultas_own_update on public.consultas for update
  using (paciente_id = auth.uid())
  with check (
    paciente_id = auth.uid()
    and status in ('solicitada','cancelada')
    and profissional_id is not distinct from
        (select c.profissional_id from public.consultas c where c.id = consultas.id)
  );

-- ---------------------------------------------------------------------------
-- Anotação clínica do profissional na consulta
-- ---------------------------------------------------------------------------
-- A policy consultas_prof_update (0002) já permite o profissional atualizar
-- colunas da consulta DELE, então não precisa de policy nova aqui.
alter table public.consultas
  add column if not exists obs_profissional text;
