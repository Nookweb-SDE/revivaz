/**
 * Conselhos profissionais e a consulta pública de cada um.
 *
 * A validação do registro é SEMIAUTOMÁTICA: o sistema monta o link oficial já
 * com o número, e quem decide é o admin. Quatro das nossas especialidades não
 * têm consulta pública unificada — nesses casos `linkConsulta` devolve null e o
 * admin confere por fora, o que é melhor que fingir automação.
 */
import { somenteDigitos } from "./documentos";

export interface Conselho {
  sigla: string;
  nome: string;
  /** Onde o admin confere. null = sem consulta pública unificada. */
  consulta: ((registro: string) => string) | null;
}

export const CONSELHOS: Conselho[] = [
  {
    sigla: "CRM",
    nome: "Conselho Regional de Medicina",
    consulta: (r) => `https://portal.cfm.org.br/busca-medicos/?crm=${somenteDigitos(r)}`,
  },
  {
    sigla: "CRP",
    nome: "Conselho Regional de Psicologia",
    consulta: (r) => `https://cadastro.cfp.org.br/cfp/?registro=${somenteDigitos(r)}`,
  },
  {
    sigla: "COFFITO",
    nome: "Conselho de Fisioterapia e Terapia Ocupacional",
    consulta: null,
  },
  {
    sigla: "CFFA",
    nome: "Conselho Federal de Fonoaudiologia",
    consulta: null,
  },
  {
    sigla: "OUTRO",
    nome: "Outro conselho ou entidade",
    consulta: null,
  },
];

function acha(sigla: string): Conselho | undefined {
  return CONSELHOS.find((c) => c.sigla === sigla);
}

/** Registro plausível: conselho conhecido e pelo menos 3 dígitos. */
export function registroValido(conselho: string, registro: string): boolean {
  if (!acha(conselho)) return false;
  return somenteDigitos(registro).length >= 3;
}

/** Link da consulta oficial com o número preenchido, ou null. */
export function linkConsulta(conselho: string, registro: string): string | null {
  const c = acha(conselho);
  if (!c || !c.consulta || !registroValido(conselho, registro)) return null;
  return c.consulta(registro);
}
