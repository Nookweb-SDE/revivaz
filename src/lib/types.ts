import type { StatusCandidatura } from "./candidaturaEstados";

export type Role = "paciente" | "profissional" | "admin";

export type Profile = {
  id: string;
  nome: string | null;
  telefone: string | null;
  emergencia_nome: string | null;
  emergencia_tel: string | null;
  prefs: Record<string, unknown>;
  role: Role;
  created_at: string;
};

export type Profissional = {
  id: string;
  nome: string;
  especialidade: string | null;
  registro: string | null;
  bio: string | null;
  ativo: boolean;
  profile_id: string | null;
  created_at: string;
};

export type StatusConsulta = "solicitada" | "agendada" | "realizada" | "cancelada";

export type Consulta = {
  id: string;
  paciente_id: string;
  profissional_id: string | null;
  data: string | null;
  hora: string | null;
  tipo: "online" | "presencial";
  status: StatusConsulta;
  link_ou_local: string | null;
  obs: string | null;
  obs_profissional: string | null;
  lembrete_enviado: boolean;
  created_at: string;
};

export type Receita = {
  id: string;
  consulta_id: string | null;
  paciente_id: string;
  profissional_id: string | null;
  /** Texto formatado compondo medicamento + dosagem + posologia + observacoes */
  resumo: string;
  arquivo_url: string | null;
  /** ISO date (YYYY-MM-DD) da validade da receita — null se não definida */
  validade: string | null;
  created_at: string;
};

export type HumorRegistro = {
  id: string;
  paciente_id: string;
  valor: number;
  dia: string;
  created_at: string;
};

// --- Fase 3/4 + IA persistida + NPS ---

export type Conversa = {
  id: string;
  paciente_id: string;
  titulo: string | null;
  created_at: string;
  updated_at: string;
};

export type Mensagem = {
  id: string;
  conversa_id: string;
  papel: "user" | "assistant";
  conteudo: string;
  created_at: string;
};

export type Avaliacao = {
  id: string;
  consulta_id: string | null;
  paciente_id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
};

// --- Triagem clínica (autoavaliação PHQ-9 / GAD-7) ---
// DADO DE SAÚDE sensível. severidade = FAIXA de pontuação (não diagnóstico);
// risco_ideacao = PHQ-9 item 9 > 0.
export type Triagem = {
  id: string;
  paciente_id: string;
  instrumento: "phq9" | "gad7";
  respostas: number[];
  score: number;
  severidade: string;
  risco_ideacao: boolean;
  created_at: string;
};

export type MetricsOverview = {
  pacientes: number;
  consultas_solicitadas: number;
  consultas_agendadas: number;
  consultas_realizadas: number;
  taxa_realizacao: number; // 0..1
  nps: number | null; // -100..100
  humor_medio_7d: number | null; // 0..4
};

// --- PRD Fase 0 — métricas reais com comparação semanal ---

export type MetricaTrend = {
  /** Valor nos últimos 7 dias. */
  atual: number;
  /** Valor nos 7 dias anteriores (semana -2 a -1). */
  anterior: number;
  /** atual − anterior */
  diff: number;
};

export type MetricasReais = {
  /** Nº de conversas criadas (acolhimento pela IA). */
  pessoas_acolhidas: MetricaTrend;
  /** Nº de consultas não-canceladas criadas (encaminhamentos para humano). */
  encaminhamentos: MetricaTrend;
  /** Triagens com risco_ideacao=true OU (phq9 AND score >= 20). */
  urgentes: MetricaTrend;
  /** Consultas com status='realizada'. */
  consultas_realizadas: MetricaTrend;
  /** NPS calculado sobre TODAS as avaliações (-100..100). null se sem avaliações. */
  nps_medio: number | null;
  /** Total de avaliações existentes (denominador do NPS). */
  total_avaliacoes: number;
};

// --- Video room (Jitsi) ---

/** Payload returned by GET /api/consulta/room-token and getRoomToken(). */
export type RoomTokenResponse = {
  token: string;
  room: string;
  domain: string;
};

/** Pedido de contato vindo do site público (formulário da landing). */
export type Lead = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  especialidade: string | null;
  data_desejada: string | null;
  hora_desejada: string | null;
  origem: string;
  status: "novo" | "contatado" | "convertido" | "descartado";
  obs_interna: string | null;
  created_at: string;
};

/** Candidatura de profissional. O ciclo de vida está em src/lib/candidaturaEstados.ts. */
export type Candidatura = {
  id: string;
  profile_id: string;
  nome_completo: string;
  cpf: string;
  telefone: string;
  conselho: string;
  registro: string;
  uf_conselho: string | null;
  especialidade: string;
  cnpj: string | null;
  bio: string | null;
  horas_semana: number | null;
  status: StatusCandidatura;
  motivo: string | null;
  termo_versao: string | null;
  termo_aceito_em: string | null;
  termo_aceito_ip: string | null;
  verificacao: Record<string, unknown>;
  analisado_por: string | null;
  analisado_em: string | null;
  created_at: string;
};
