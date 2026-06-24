export interface CrisisResource {
  nome: string;
  contato: string;
  descricao: string;
}

export const CRISIS_RESOURCES: CrisisResource[] = [
  { nome: "CVV — Centro de Valorização da Vida", contato: "188", descricao: "Apoio emocional 24h, ligação gratuita e sigilosa." },
  { nome: "SAMU", contato: "192", descricao: "Emergência médica, risco imediato à vida." },
  { nome: "Linha Vida", contato: "196", descricao: "Linha do Ministério da Saúde de apoio em saúde mental e prevenção do suicídio." },
  { nome: "CAPS", contato: "Procure a unidade mais próxima", descricao: "Atenção em saúde mental pelo SUS." },
];

// Normaliza: minúsculas + remove acentos, para casar "não" e "nao".
function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Padrões de crise/risco em PT-BR. Conservador: melhor disparar a mais.
const CRISIS_PATTERNS: RegExp[] = [
  /\bme\s+matar\b/,
  /\bme\s+suicidar\b/,
  /\bsuicid/,
  /\btirar\s+(a\s+)?minha\s+vida\b/,
  /\bdar\s+fim\s+(a\s+)?(minha\s+)?vida\b/,
  /\bnao\s+quero\s+mais\s+viver\b/,
  /\bnao\s+aguento\s+mais\s+viver\b/,
  /\bmelhor\s+morrer\b/,
  /\bme\s+cort(ar|ei|ando|ado|o)\b/,
  /\bautomutila/,
  /\bninguem\s+sentiria\s+(a\s+)?minha\s+falta\b/,
  /\bquero\s+(morrer|sumir|desaparecer)\b/,
];

export function detectCrisis(text: string): boolean {
  const t = normalize(text);
  return CRISIS_PATTERNS.some((re) => re.test(t));
}
