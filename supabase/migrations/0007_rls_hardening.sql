-- 0007_rls_hardening.sql
-- Performance + RLS hardening para dados clínicos sensíveis.
--
-- Problemas corrigidos:
--   1. Colunas FK críticas sem índice → seq-scan em toda avaliação de política RLS.
--   2. humor_registros sem política admin SELECT (admin bloqueado em queries diretas).
--   3. triagens_own_all usa FOR ALL, mas triagem é registro histórico imutável:
--      paciente não deve poder UPDATE/DELETE — substituído por SELECT + INSERT.
--   4. conversas/mensagens: admin só tinha SELECT; sem DELETE não é possível cumprir
--      requisição de apagamento LGPD nem moderar conteúdo.
--   5. Índice parcial do scheduler de lembretes (WhatsApp 24h antes).
--
-- ADITIVA e idempotente: IF NOT EXISTS em índices, DROP IF EXISTS antes de cada
-- CREATE POLICY, ENABLE ROW LEVEL SECURITY repetível sem erro.

-- =============================================================================
-- 1. GARANTIR RLS EM TODAS AS TABELAS  (idempotente — já habilitado nas
--    migrations anteriores, mas seguro repetir; falha silenciosa se já ativo)
-- =============================================================================
alter table public.profiles         enable row level security;
alter table public.profissionais    enable row level security;
alter table public.consultas        enable row level security;
alter table public.receitas         enable row level security;
alter table public.humor_registros  enable row level security;
alter table public.conversas        enable row level security;
alter table public.mensagens        enable row level security;
alter table public.avaliacoes       enable row level security;
alter table public.triagens         enable row level security;

-- =============================================================================
-- 2. POLÍTICAS FALTANTES / INSUFICIENTES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 2a. humor_registros — admin READ ausente.
--     A função metrics_overview() é security definer e bypassa RLS, mas o
--     painel operacional do admin que consulta diretamente ficava bloqueado.
-- ---------------------------------------------------------------------------
drop policy if exists humor_admin_select on public.humor_registros;
create policy humor_admin_select on public.humor_registros
  for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2b. triagens — FOR ALL viola o invariante de registro histórico imutável.
--     O comentário na 0005 diz explicitamente "sem update/delete por design".
--     Substituímos por SELECT + INSERT apenas para o paciente.
-- ---------------------------------------------------------------------------
drop policy if exists triagens_own_all    on public.triagens;
drop policy if exists triagens_own_select on public.triagens;
drop policy if exists triagens_own_insert on public.triagens;

create policy triagens_own_select on public.triagens
  for select
  using (paciente_id = auth.uid());

create policy triagens_own_insert on public.triagens
  for insert
  with check (paciente_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2c. conversas — admin promovido de SELECT para ALL.
--     Criar primeiro (admin mantém SELECT), depois dropar a antiga.
-- ---------------------------------------------------------------------------
drop policy if exists conversas_admin_all    on public.conversas;
create policy conversas_admin_all on public.conversas
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Substitui a policy SELECT-only criada em 0002_fase3_4.sql.
drop policy if exists conversas_admin_select on public.conversas;

-- ---------------------------------------------------------------------------
-- 2d. mensagens — admin promovido de SELECT para ALL (mesmo raciocínio LGPD).
-- ---------------------------------------------------------------------------
drop policy if exists mensagens_admin_all    on public.mensagens;
create policy mensagens_admin_all on public.mensagens
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Substitui a policy SELECT-only criada em 0002_fase3_4.sql.
drop policy if exists mensagens_admin_select on public.mensagens;

-- =============================================================================
-- 3. ÍNDICES FK — coluna FK sem índice = seq-scan em toda avaliação de política
--    RLS. Partial indexes WHERE col IS NOT NULL evitam desperdício em colunas
--    opcionais (profissional_id, consulta_id).
-- =============================================================================

-- --- consultas -----------------------------------------------------------
create index if not exists consultas_paciente_idx
  on public.consultas (paciente_id);

-- partial: profissional_id é nullable (consultas sem profissional alocado)
create index if not exists consultas_prof_idx
  on public.consultas (profissional_id)
  where profissional_id is not null;

-- composto status+data: usado em ORDER BY/WHERE das agendas e na própria RLS
-- da policy consultas_prof_pendentes_select (status = 'solicitada')
create index if not exists consultas_status_data_idx
  on public.consultas (status, data);

-- --- receitas ------------------------------------------------------------
create index if not exists receitas_paciente_idx
  on public.receitas (paciente_id);

create index if not exists receitas_prof_idx
  on public.receitas (profissional_id)
  where profissional_id is not null;

-- partial: consulta_id é nullable por design (receita avulsa sem consulta)
create index if not exists receitas_consulta_idx
  on public.receitas (consulta_id)
  where consulta_id is not null;

-- --- humor_registros -----------------------------------------------------
-- composto com dia DESC: queries típicas são "últimos N dias deste paciente"
create index if not exists humor_paciente_idx
  on public.humor_registros (paciente_id, dia desc);

-- --- conversas -----------------------------------------------------------
create index if not exists conversas_paciente_idx
  on public.conversas (paciente_id);

-- --- mensagens -----------------------------------------------------------
-- conversa_id é a coluna de join em TODA consulta de mensagens
create index if not exists mensagens_conversa_idx
  on public.mensagens (conversa_id);

-- --- avaliacoes ----------------------------------------------------------
create index if not exists avaliacoes_paciente_idx
  on public.avaliacoes (paciente_id);

-- =============================================================================
-- 4. ÍNDICE PARCIAL DO SCHEDULER DE LEMBRETES
--    O job (roda de hora em hora) faz: WHERE status='agendada' AND
--    lembrete_enviado=false AND data BETWEEN ... — partial index cobre
--    exatamente o sub-conjunto lido, sem overhead nas linhas já processadas.
-- =============================================================================
create index if not exists idx_consultas_lembrete
  on public.consultas (data)
  where status = 'agendada' and lembrete_enviado = false;
