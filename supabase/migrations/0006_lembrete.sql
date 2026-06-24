-- 0006_lembrete.sql — flag idempotente p/ o agendador de lembrete WhatsApp.
-- ADITIVA e idempotente: o scheduler do server (hora em hora) marca
-- lembrete_enviado=true após enviar o lembrete de 24h, evitando duplicar.
alter table public.consultas
  add column if not exists lembrete_enviado boolean not null default false;
