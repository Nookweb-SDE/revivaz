-- Fix achado crítico: o profissional precisa ENXERGAR os pedidos pendentes
-- (status='solicitada') que nascem SEM dono (profissional_id IS NULL) e poder
-- AGENDÁ-LOS, assumindo a si mesmo como profissional_id no UPDATE.
--
-- Modelo escolhido: solicitações sem dono ficam visíveis para QUALQUER
-- profissional ativo, e o primeiro que agenda "puxa" o atendimento pra si.
-- (O admin continua podendo atribuir pelo painel — fluxos coexistem.)
--
-- Migration ADITIVA e idempotente: nada de DROP destrutivo, banco de prod tem dados.

-- ---------------------------------------------------------------------------
-- RLS: profissional LÊ pedidos pendentes sem dono
-- ---------------------------------------------------------------------------
-- Restrito a is_profissional() (prof ATIVO) E só linhas 'solicitada' sem
-- profissional_id. Não vaza consultas de outros profissionais (essas continuam
-- cobertas só por consultas_prof_select do 0002).
drop policy if exists consultas_prof_pendentes_select on public.consultas;
create policy consultas_prof_pendentes_select on public.consultas for select using (
  public.is_profissional()
  and status = 'solicitada'
  and profissional_id is null
);

-- ---------------------------------------------------------------------------
-- RLS: profissional ASSUME um pedido pendente sem dono
-- ---------------------------------------------------------------------------
-- USING: a linha-alvo é um pedido pendente sem dono e o chamador é prof ativo.
-- WITH CHECK: depois do UPDATE a consulta TEM que ficar atribuída a um
-- profissional do PRÓPRIO chamador (impede assumir em nome de outro) e o
-- paciente_id não pode ser trocado.
drop policy if exists consultas_prof_pendentes_update on public.consultas;
create policy consultas_prof_pendentes_update on public.consultas for update
using (
  public.is_profissional()
  and status = 'solicitada'
  and profissional_id is null
)
with check (
  profissional_id in (select id from public.profissionais where profile_id = auth.uid())
  and paciente_id = (select c.paciente_id from public.consultas c where c.id = consultas.id)
);
