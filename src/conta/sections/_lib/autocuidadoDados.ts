/**
 * Dados dos exercícios de autocuidado.
 *
 * Extraídos verbatim do Autocuidado.tsx (1081 linhas). Ficam fora do componente
 * porque são PROTOCOLO, não enfeite: 4-7-8 e 5-4-3-2-1 são técnicas com números
 * certos, e um dígito trocado quebra o exercício sem quebrar a tela. Por isso
 * têm teste.
 */

// ─── Motion preference ────────────────────────────────────────────────────────

export const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── Types ────────────────────────────────────────────────────────────────────

export type Tela = "selecao" | "respiracao" | "grounding";
export type FaseRespiracao = "inspire" | "segure" | "expire";

// ─── Breathing constants ──────────────────────────────────────────────────────
// Total cycle: 4 + 7 + 8 = 19s
// Keyframe percentages: 4/19≈21.05%, 11/19≈57.89%

export const BREATHE_CSS = `
  @keyframes breathe478 {
    0% {
      transform: scale(1);
      box-shadow: 0 0 24px 0px rgba(0,168,191,0.18);
      animation-timing-function: ease-in-out;
    }
    21.05% {
      transform: scale(1.58);
      box-shadow: 0 0 72px 28px rgba(0,168,191,0.38);
      animation-timing-function: linear;
    }
    57.89% {
      transform: scale(1.58);
      box-shadow: 0 0 72px 28px rgba(0,168,191,0.38);
      animation-timing-function: ease-in-out;
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 24px 0px rgba(0,168,191,0.18);
    }
  }
  @keyframes breathe478-glow {
    0%     { transform: scale(1);    opacity: 0.35; animation-timing-function: ease-in-out; }
    21.05% { transform: scale(1.58); opacity: 0.7;  animation-timing-function: linear; }
    57.89% { transform: scale(1.58); opacity: 0.7;  animation-timing-function: ease-in-out; }
    100%   { transform: scale(1);    opacity: 0.35; }
  }
`;

export const FASE_DURACAO: Record<FaseRespiracao, number> = {
  inspire: 4000,
  segure: 7000,
  expire: 8000,
};

export const FASE_TEXTO: Record<FaseRespiracao, { instrucao: string; detalhe: string }> = {
  inspire: {
    instrucao: "Inspire...",
    detalhe: "Respire devagar pelo nariz durante 4 segundos",
  },
  segure: {
    instrucao: "Segure...",
    detalhe: "Mantenha o ar nos pulmões durante 7 segundos",
  },
  expire: {
    instrucao: "Expire...",
    detalhe: "Solte o ar lentamente pela boca durante 8 segundos",
  },
};

// ─── Grounding steps ──────────────────────────────────────────────────────────

export const PASSOS_GROUNDING = [
  {
    quantidade: 5,
    verbo: "VÊ",
    descricao:
      "Olhe ao redor. Nomeie 5 coisas que você consegue ver agora. Pode ser qualquer coisa — uma cadeira, uma sombra, a cor de uma parede.",
    placeholder: "Ex.: uma janela, minha mão, o teto...",
  },
  {
    quantidade: 4,
    verbo: "pode TOCAR",
    descricao:
      "Sinta a textura do que está por perto. Nomeie 4 coisas que você pode tocar ou que estão em contato com seu corpo.",
    placeholder: "Ex.: o tecido da roupa, a mesa, o chão...",
  },
  {
    quantidade: 3,
    verbo: "OUVE",
    descricao:
      "Fique em silêncio por um instante. Nomeie 3 sons que você consegue perceber agora — próximos ou distantes.",
    placeholder: "Ex.: vento, meu coração, som de carro...",
  },
  {
    quantidade: 2,
    verbo: "CHEIRA",
    descricao:
      "Respire suavemente. Nomeie 2 cheiros que você percebe — ou, se não sentir nada, cheiros de que você gosta.",
    placeholder: "Ex.: café, ar fresco, perfume...",
  },
  {
    quantidade: 1,
    verbo: "SABOREIA",
    descricao:
      "Preste atenção à sua boca. Nomeie 1 gosto que você percebe agora — mesmo que seja apenas a saliva.",
    placeholder: "Ex.: água, menta, um doce...",
  },
];

