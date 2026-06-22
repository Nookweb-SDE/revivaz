export type Consulta = {
  id: string;
  profissional: string;
  especialidade: string;
  avatar: string;
  data: string;
  hora: string;
  tipo: "online" | "presencial";
  status: "agendada" | "realizada" | "cancelada";
  emDias?: number;
  avaliada?: boolean;
};

export type Receita = {
  id: string;
  profissional: string;
  data: string;
  resumo: string;
};

export type SessaoIA = {
  id: string;
  data: string;
  resumo: string;
  ultimoTrecho: string;
};

export type Usuario = {
  nome: string;
  emergenciaNome: string;
  emergenciaTel: string;
  preferencias: {
    lembretes: boolean;
    modalidade: "online" | "presencial";
  };
};

export const usuario: Usuario = {
  nome: "Maria S.",
  emergenciaNome: "João Silva",
  emergenciaTel: "+55 11 99876-5432",
  preferencias: {
    lembretes: true,
    modalidade: "online",
  },
};

export const consultas: Consulta[] = [
  {
    id: "cons-001",
    profissional: "Dra. Paula L.",
    especialidade: "Psicologia",
    avatar: "PL",
    data: "2026-06-24",
    hora: "14:30",
    tipo: "online",
    status: "agendada",
    emDias: 2,
  },
  {
    id: "cons-002",
    profissional: "Dr. Carlos M.",
    especialidade: "Psiquiatria",
    avatar: "CM",
    data: "2026-06-10",
    hora: "10:00",
    tipo: "presencial",
    status: "realizada",
    avaliada: false,
  },
  {
    id: "cons-003",
    profissional: "Dra. Ana T.",
    especialidade: "Terapia Cognitiva",
    avatar: "AT",
    data: "2026-05-28",
    hora: "15:45",
    tipo: "online",
    status: "cancelada",
  },
];

export const receitas: Receita[] = [
  {
    id: "rec-001",
    profissional: "Dra. Paula L.",
    data: "2026-06-10",
    resumo: "Medicação: Serralina 50mg - 1x ao dia à noite",
  },
  {
    id: "rec-002",
    profissional: "Dr. Carlos M.",
    data: "2026-05-28",
    resumo: "Medicação: Melatonina 3mg - conforme necessário antes de dormir",
  },
];

export const sessoesIA: SessaoIA[] = [
  {
    id: "sess-001",
    data: "2026-06-20",
    resumo: "Exploração de técnicas de meditação e relaxamento muscular progressivo",
    ultimoTrecho:
      "Ao praticar respiração profunda 3x por dia, você pode melhorar sua regulação emocional.",
  },
  {
    id: "sess-002",
    data: "2026-06-15",
    resumo: "Discussão sobre gestão de ansiedade e identificação de gatilhos pessoais",
    ultimoTrecho:
      "Seus padrões de ansiedade começam frequentemente após situações de sobrecarga no trabalho.",
  },
];

export const humorSemana: number[] = [1, 2, 2, 3, 1, 3, 4];
