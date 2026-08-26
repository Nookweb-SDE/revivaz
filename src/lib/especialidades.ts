/**
 * Especialidades atendidas. Fonte única: a landing, o formulário de pedido, o
 * funil de profissional e o cadastro do admin leem TODOS daqui.
 *
 * Antes existiam só "psiquiatria" e "psicologia", chumbadas num <select> da
 * landing. O modelo de negócio já dizia que neurodivergência (autismo, TDAH,
 * altas habilidades) é especialidade forte, mas ninguém que trata isso tinha
 * onde se encaixar: neuropediatra, neuropsicólogo, terapeuta ocupacional e
 * fonoaudiólogo são o time que de fato acompanha esses casos.
 *
 * `valor` é o que vai para o banco (coluna de texto, sem migration).
 */
export type GrupoEspecialidade = "medicina" | "psicologia" | "multi";

export interface Especialidade {
  valor: string;
  label: string;
  grupo: GrupoEspecialidade;
  /** Uma linha, para o card da landing. */
  desc: string;
  /** Marca quem atende criança e adolescente. */
  atendeMenores?: boolean;
}

export const ESPECIALIDADES: Especialidade[] = [
  // ── Medicina (CFM) ────────────────────────────────────────────────────────
  {
    valor: "psiquiatria",
    label: "Psiquiatria",
    grupo: "medicina",
    desc: "Diagnóstico e tratamento medicamentoso em saúde mental adulta.",
  },
  {
    valor: "psiquiatria_infantil",
    label: "Psiquiatria da infância e adolescência",
    grupo: "medicina",
    desc: "Saúde mental de crianças e adolescentes, com a família junto.",
    atendeMenores: true,
  },
  {
    valor: "neurologia",
    label: "Neurologia",
    grupo: "medicina",
    desc: "Investigação neurológica de sintomas cognitivos e do comportamento.",
  },
  {
    valor: "neuropediatria",
    label: "Neuropediatria",
    grupo: "medicina",
    desc: "Desenvolvimento neurológico infantil, incluindo autismo e TDAH.",
    atendeMenores: true,
  },
  {
    valor: "clinico_geral",
    label: "Clínico geral",
    grupo: "medicina",
    desc: "Primeira avaliação e cuidado geral, com encaminhamento quando precisa.",
  },

  // ── Psicologia (CFP) ──────────────────────────────────────────────────────
  {
    valor: "psicologia",
    label: "Psicologia clínica",
    grupo: "psicologia",
    desc: "Psicoterapia para ansiedade, depressão, luto, estresse e burnout.",
  },
  {
    valor: "neuropsicologia",
    label: "Neuropsicologia",
    grupo: "psicologia",
    desc: "Avaliação de atenção, memória e funções executivas. Fecha diagnóstico.",
  },
  {
    valor: "psicologia_infantil",
    label: "Psicologia infantil",
    grupo: "psicologia",
    desc: "Acompanhamento de crianças e adolescentes, com orientação aos pais.",
    atendeMenores: true,
  },

  // ── Equipe multi (o time que acompanha neurodivergência) ──────────────────
  {
    valor: "terapia_ocupacional",
    label: "Terapia ocupacional",
    grupo: "multi",
    desc: "Integração sensorial, rotina e autonomia no dia a dia.",
    atendeMenores: true,
  },
  {
    valor: "fonoaudiologia",
    label: "Fonoaudiologia",
    grupo: "multi",
    desc: "Fala, linguagem e comunicação, do atraso à comunicação alternativa.",
    atendeMenores: true,
  },
  {
    valor: "psicopedagogia",
    label: "Psicopedagogia",
    grupo: "multi",
    desc: "Dificuldade de aprendizagem e adaptação escolar.",
    atendeMenores: true,
  },
  {
    valor: "aba",
    label: "Análise do comportamento (ABA)",
    grupo: "multi",
    desc: "Intervenção comportamental estruturada, muito usada no autismo.",
    atendeMenores: true,
  },
];

export const GRUPOS: Record<GrupoEspecialidade, string> = {
  medicina: "Médicos",
  psicologia: "Psicologia",
  multi: "Equipe multidisciplinar",
};

/** Label a partir do valor gravado. Valor desconhecido volta como veio. */
export function labelEspecialidade(valor: string | null | undefined): string {
  if (!valor) return "";
  return ESPECIALIDADES.find((e) => e.valor === valor)?.label ?? valor;
}

/** Só as que atendem criança e adolescente. */
export function especialidadesInfantis(): Especialidade[] {
  return ESPECIALIDADES.filter((e) => e.atendeMenores);
}
