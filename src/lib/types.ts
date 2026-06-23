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
