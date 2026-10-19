/* Calendário do Projeto de Psicologia Comunitária do Condomínio Vivaz.
   Fonte: PDF da psicóloga Flávia Magalhães (CRP 06/236718), tabela §9.
   Regra: última quinta-feira do mês; dezembro/2026 cai na 3ª quinta. */

export type Encontro = {
  data: string; // "AAAA-MM-DD"
  eixo: string;
  adolescentes: string;
  mulheres: string;
};

export const ENCONTROS: Encontro[] = [
  { data: "2026-11-26", eixo: "Relações sem violência", adolescentes: "Bullying, agressividade, preconceito e proteção", mulheres: "Violência psicológica, limites, proteção e rede de apoio" },
  { data: "2026-12-17", eixo: "Fechamento de ciclos", adolescentes: "Pertencimento, aprendizados e perspectivas", mulheres: "Fechamento de ciclos, vínculos e projetos" },
  { data: "2027-01-28", eixo: "Saúde mental e novos ciclos", adolescentes: "Identidade, expectativas e projeto de vida", mulheres: "Autocuidado, sobrecarga e limites" },
  { data: "2027-02-25", eixo: "Escolhas e proteção", adolescentes: "Pressões, corpo, afetos e decisões", mulheres: "Relações, autocuidado e diálogo" },
  { data: "2027-03-25", eixo: "Identidade e respeito", adolescentes: "Diferenças, respeito e convivência", mulheres: "Ser mulher: identidade, desejo e papéis sociais" },
  { data: "2027-04-29", eixo: "Inclusão e pertencimento", adolescentes: "Bullying, diferenças e inclusão", mulheres: "Acolher diferenças sem apagar limites" },
  { data: "2027-05-27", eixo: "Família e vínculos", adolescentes: "Comunicação em família e autonomia", mulheres: "Maternidade real, culpa e autocuidado" },
  { data: "2027-06-24", eixo: "Relações afetivas", adolescentes: "Amizade, rejeição, pertencimento e limites", mulheres: "Vínculos afetivos, autonomia e limites" },
  { data: "2027-07-29", eixo: "Comunicação e conflitos", adolescentes: "Comunicação não violenta, impulsividade e reparação", mulheres: "Comunicação não violenta, assertividade e conflitos cotidianos" },
  { data: "2027-08-26", eixo: "Autoridade e cuidado", adolescentes: "Autonomia, regras e figuras de referência", mulheres: "Parentalidade, responsabilidades e carga mental" },
  { data: "2027-09-30", eixo: "Valorização da vida", adolescentes: "Sofrimento emocional, rede de apoio e pedido de ajuda", mulheres: "Cuidado de si, rede de apoio e busca de ajuda" },
  { data: "2027-10-28", eixo: "Saúde mental no cotidiano", adolescentes: "Ansiedade, redes sociais, comparação e autoestima", mulheres: "Ansiedade, autocobrança, trabalho e vida familiar" },
];

/** Dia local "AAAA-MM-DD", sem fuso: o encontro vale o dia inteiro. */
function diaLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function proximoEncontro(hoje: Date): Encontro | null {
  const dia = diaLocal(hoje);
  return ENCONTROS.find(e => e.data >= dia) ?? null;
}

export function rotuloData(e: Encontro): string {
  const [, m, d] = e.data.split("-");
  return `${d}/${m}`;
}

/** Quanto falta para as 18h (primeiro grupo) do dia do encontro, no relógio local. */
export function faltaPara(e: Encontro, agora: Date): { dias: number; horas: number; min: number; seg: number } {
  const [a, m, d] = e.data.split("-").map(Number);
  const s = Math.max(0, Math.floor((new Date(a, m - 1, d, 18).getTime() - agora.getTime()) / 1000));
  return { dias: Math.floor(s / 86400), horas: Math.floor(s / 3600) % 24, min: Math.floor(s / 60) % 60, seg: s % 60 };
}
