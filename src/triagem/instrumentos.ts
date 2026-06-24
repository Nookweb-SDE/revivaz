// Triagem clínica — instrumentos de AUTOAVALIAÇÃO validados PHQ-9 e GAD-7.
//
// ⚠️ COMPLIANCE: PHQ-9 e GAD-7 são instrumentos VALIDADOS de autorrelato. A
// pontuação calculada aqui é a MESMA do questionário em papel — não é "IA
// diagnosticando". O resultado é uma AUTOAVALIAÇÃO, NÃO um diagnóstico nem
// atendimento clínico. NUNCA derivar daqui um nome de doença ("você tem
// depressão/ansiedade"): a saída de severidade é uma FAIXA de pontuação e o
// roteamento é uma SUGESTÃO (autoajuda/agendar/falar com profissional).
//
// Disclaimer fixo a ser exibido pela UI que consome este módulo:
//   "Isto é uma autoavaliação, não um diagnóstico nem atendimento clínico;
//    converse com um profissional."
//
// Item 9 do PHQ-9 (ideação) > 0 → a UI deve mostrar recursos de crise
// IMEDIATAMENTE (188 CVV / 192 SAMU / 136 Disque Saúde — ver
// src/acolhimento/crisis.ts) e recomendar contato humano urgente.
//
// Módulo PURO/testável: sem I/O, sem Supabase, sem React.

export type Instrumento = "phq9" | "gad7";

export interface ItemTriagem {
  id: number;
  /** Enunciado PT-BR validado (tradução oficial do instrumento). */
  texto: string;
}

// Enunciado-tronco dos dois instrumentos (apresentar na UI):
// "Durante as últimas 2 semanas, com que frequência você foi incomodado(a)
//  por algum dos problemas abaixo?"

// PHQ-9 — Patient Health Questionnaire (depressão). 9 itens.
// Item 9 (índice 8) = ideação de se ferir / morte.
export const PHQ9_ITENS: ItemTriagem[] = [
  { id: 1, texto: "Pouco interesse ou pouco prazer em fazer as coisas" },
  { id: 2, texto: "Se sentir para baixo, deprimido(a) ou sem perspectiva" },
  { id: 3, texto: "Dificuldade para pegar no sono, permanecer dormindo ou dormir demais" },
  { id: 4, texto: "Se sentir cansado(a) ou com pouca energia" },
  { id: 5, texto: "Falta de apetite ou comer demais" },
  {
    id: 6,
    texto:
      "Se sentir mal consigo mesmo(a) — ou achar que você é um fracasso ou que decepcionou sua família ou você mesmo(a)",
  },
  {
    id: 7,
    texto:
      "Dificuldade para se concentrar nas coisas, como ler o jornal ou ver televisão",
  },
  {
    id: 8,
    texto:
      "Lentidão para se movimentar ou falar, a ponto de outras pessoas perceberem — ou o oposto, estar tão agitado(a) que você fica andando de um lado para o outro muito mais do que de costume",
  },
  {
    id: 9,
    texto:
      "Pensar que seria melhor estar morto(a) ou em se ferir de alguma forma",
  },
];

// GAD-7 — Generalized Anxiety Disorder (ansiedade). 7 itens.
export const GAD7_ITENS: ItemTriagem[] = [
  { id: 1, texto: "Se sentir nervoso(a), ansioso(a) ou muito tenso(a)" },
  { id: 2, texto: "Não ser capaz de impedir ou de controlar as preocupações" },
  { id: 3, texto: "Se preocupar muito com diversas coisas" },
  { id: 4, texto: "Dificuldade para relaxar" },
  { id: 5, texto: "Ficar tão agitado(a) que se torna difícil permanecer sentado(a)" },
  { id: 6, texto: "Ficar facilmente aborrecido(a) ou irritado(a)" },
  { id: 7, texto: "Sentir medo como se algo terrível fosse acontecer" },
];

// Escala Likert 0–3 (idêntica nos dois instrumentos), janela "últimas 2 semanas".
export const ESCALA_LIKERT: { valor: number; rotulo: string }[] = [
  { valor: 0, rotulo: "Nenhuma vez" },
  { valor: 1, rotulo: "Vários dias" },
  { valor: 2, rotulo: "Mais da metade dos dias" },
  { valor: 3, rotulo: "Quase todos os dias" },
];

// --- Validação interna -----------------------------------------------------

function validarRespostas(respostas: number[], n: number): void {
  if (!Array.isArray(respostas) || respostas.length !== n) {
    throw new Error(`Esperado exatamente ${n} respostas, recebi ${respostas?.length ?? 0}`);
  }
  for (const r of respostas) {
    if (!Number.isInteger(r) || r < 0 || r > 3) {
      throw new Error("Cada resposta deve ser um inteiro de 0 a 3");
    }
  }
}

// --- Score -----------------------------------------------------------------

/** Soma PHQ-9: 9 itens (0–3) → total 0–27. */
export function scorePHQ9(respostas: number[]): number {
  validarRespostas(respostas, 9);
  return respostas.reduce((a, b) => a + b, 0);
}

/** Soma GAD-7: 7 itens (0–3) → total 0–21. */
export function scoreGAD7(respostas: number[]): number {
  validarRespostas(respostas, 7);
  return respostas.reduce((a, b) => a + b, 0);
}

// --- Severidade (FAIXA de pontuação — NÃO é diagnóstico) -------------------

/** Faixa de gravidade PHQ-9: 0–4 / 5–9 / 10–14 / 15–19 / 20–27. */
export function severidadePHQ9(
  score: number
): "minima" | "leve" | "moderada" | "moderada_grave" | "grave" {
  if (score <= 4) return "minima";
  if (score <= 9) return "leve";
  if (score <= 14) return "moderada";
  if (score <= 19) return "moderada_grave";
  return "grave";
}

/** Faixa de gravidade GAD-7: 0–4 / 5–9 / 10–14 / 15–21. */
export function severidadeGAD7(
  score: number
): "minima" | "leve" | "moderada" | "grave" {
  if (score <= 4) return "minima";
  if (score <= 9) return "leve";
  if (score <= 14) return "moderada";
  return "grave";
}

// --- Risco de ideação ------------------------------------------------------

/**
 * Risco de ideação: só o PHQ-9 tem o item de ideação (índice 8 / item 9).
 * Qualquer resposta > 0 nesse item dispara o fluxo de crise. O GAD-7 não tem
 * item de ideação → sempre false.
 */
export function riscoIdeacao(instrumento: Instrumento, respostas: number[]): boolean {
  if (instrumento !== "phq9") return false;
  validarRespostas(respostas, 9);
  return respostas[8] > 0;
}

// --- Sugestão de roteamento (SUGESTÃO, nunca decisão clínica) ---------------

/**
 * Mapeia a faixa de severidade (+ risco de ideação) em uma SUGESTÃO de próximo
 * passo. Risco de ideação SEMPRE eleva para "urgente" (contato humano + recursos
 * de crise), independentemente da pontuação. Texto em tom de convite, sem nome
 * de doença e sem linguagem de diagnóstico.
 */
export function sugestaoRoteamento(
  sev: string,
  risco: boolean
): { nivel: "autoajuda" | "agendar" | "urgente"; texto: string } {
  if (risco) {
    return {
      nivel: "urgente",
      texto:
        "Você indicou pensamentos de se ferir ou de que seria melhor não estar aqui. Você não está sozinho(a) e isso merece atenção agora. Fale com alguém de confiança e procure ajuda imediata: CVV 188 (24h), SAMU 192, Disque Saúde 136.",
    };
  }

  if (sev === "minima" || sev === "leve") {
    return {
      nivel: "autoajuda",
      texto:
        "Seus resultados sugerem sintomas leves no momento. Que tal explorar recursos de autocuidado e acompanhar como você se sente? Se quiser, dá pra conversar com um profissional a qualquer momento.",
    };
  }

  if (sev === "moderada") {
    return {
      nivel: "agendar",
      texto:
        "Seus resultados sugerem que conversar com um profissional pode ajudar bastante. Considere agendar um atendimento para falar sobre o que você está sentindo.",
    };
  }

  // moderada_grave | grave (e qualquer faixa não-prevista, conservador)
  return {
    nivel: "agendar",
    texto:
      "Seus resultados sugerem sintomas mais intensos. Recomendamos buscar apoio profissional logo — agendar um atendimento é um bom próximo passo. Se a qualquer momento você se sentir em risco, ligue para o CVV 188.",
  };
}
