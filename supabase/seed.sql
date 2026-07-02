-- seed.sql — dados de desenvolvimento local (não vai para prod)
-- Schema real: profiles(id, nome, telefone, role, prefs, created_at)
--              profissionais(id, nome, especialidade, registro, bio, ativo, created_at)
--              consultas(id, paciente_id, profissional_id, data, hora, tipo, status, lembrete_enviado)

-- Paciente de teste
INSERT INTO auth.users (id, email, phone, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  null,
  '+5511999990001',
  now(), now(),
  '{"provider":"phone","providers":["phone"]}',
  '{"nome":"Ana Teste"}',
  false, 'authenticated', 'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, nome, telefone, role, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Ana Teste',
  '+5511999990001',
  'paciente',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Profissional de teste
INSERT INTO auth.users (id, email, phone, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  null,
  '+5511999990002',
  now(), now(),
  '{"provider":"phone","providers":["phone"]}',
  '{"nome":"Dr. Carlos Teste"}',
  false, 'authenticated', 'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, nome, telefone, role, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Dr. Carlos Teste',
  '+5511999990002',
  'profissional',
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profissionais (id, nome, especialidade, registro, bio, ativo, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Dr. Carlos Teste',
  'Psicologia Clínica',
  'CRP 06/12345',
  'Profissional de teste para desenvolvimento local.',
  true,
  now()
) ON CONFLICT (id) DO NOTHING;

-- Admin de teste
INSERT INTO auth.users (id, email, phone, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  null,
  '+5511999990003',
  now(), now(),
  '{"provider":"phone","providers":["phone"]}',
  '{"nome":"Admin Dev"}',
  false, 'authenticated', 'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, nome, telefone, role, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Admin Dev',
  '+5511999990003',
  'admin',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Consulta de exemplo (3 dias no futuro)
INSERT INTO public.consultas (id, paciente_id, profissional_id, data, hora, tipo, status, lembrete_enviado, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  (current_date + interval '3 days')::date,
  '14:00'::time,
  'online',
  'agendada',
  false,
  now()
) ON CONFLICT (id) DO NOTHING;

-- Registro de humor de exemplo
INSERT INTO public.humor_registros (id, paciente_id, valor, dia, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000001',
  3,
  current_date,
  now()
) ON CONFLICT (id) DO NOTHING;
