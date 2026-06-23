/**
 * UI-layer types for the /conta area.
 * These are presentation-friendly versions derived from src/lib/types.ts —
 * they carry denormalised/derived fields (profissional name, avatar initials)
 * so sections never need to fetch or join data themselves.
 */

export type ConsultaUI = {
  id: string;
  profissional: string;       // display name (from Profissional.nome or placeholder)
  especialidade: string;      // from Profissional.especialidade or ""
  avatar: string;             // initials derived from profissional name
  data: string;               // ISO date string (YYYY-MM-DD)
  hora: string;               // "HH:MM"
  tipo: "online" | "presencial";
  status: "solicitada" | "agendada" | "realizada" | "cancelada";
  emDias?: number;            // days until appointment (computed by ContaApp)
  avaliada?: boolean;
};

export type ReceitaUI = {
  id: string;
  profissional: string;       // display name
  data: string;               // ISO date from created_at
  resumo: string;
};

export type UsuarioUI = {
  nome: string;
  emergenciaNome: string;
  emergenciaTel: string;
  preferencias: {
    lembretes: boolean;
    modalidade: "online" | "presencial";
  };
};
