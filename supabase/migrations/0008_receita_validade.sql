-- Fase 8 — Campos estruturados na receita digital
-- Adiciona coluna de validade ao receitas (a ser preenchida pelo profissional).
-- Os campos medicamento/dosagem/posologia/observacoes são compostos no resumo
-- (texto formatado) para manter compat. com receitas antigas.

alter table public.receitas
  add column if not exists validade date;

comment on column public.receitas.validade is
  'Data limite de validade da receita (ISO date). Null = sem prazo definido.';
