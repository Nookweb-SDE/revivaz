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
  created_at: string;
};

export type Receita = {
  id: string;
  consulta_id: string | null;
  paciente_id: string;
  profissional_id: string | null;
  resumo: string;
  arquivo_url: string | null;
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
