// Mensagens de notificação WhatsApp (PT-BR) — módulo PURO e testável.
//
// Sem I/O, sem dependências: só recebe os campos da consulta e devolve o texto.
// Mantemos o mínimo de dado sensível: primeiro nome do paciente, data/hora e,
// quando online, o link da sala. Toda mensagem traz o rodapé de crise.
//
// O envio em si (Evolution) e o carregamento do telefone/serviço ficam no
// server (agente B-server). Aqui só compomos a string.

const RODAPE_CRISE = "Em crise? 188 CVV · 192 SAMU";

type DadosConsulta = {
  nome?: string | null;
  data?: string | null; // YYYY-MM-DD (ou parseável)
  hora?: string | null; // HH:MM[:SS]
  tipo?: string | null; // "online" | "presencial"
  link?: string | null; // link da sala / endereço (quando houver)
};

// Primeiro nome, capitalizado de leve. Vazio → "" (a saudação se adapta).
function primeiroNome(nome?: string | null): string {
  const limpo = (nome ?? "").trim();
  if (!limpo) return "";
  return limpo.split(/\s+/)[0];
}

// Formata "YYYY-MM-DD" → "DD/MM". Aceita também ISO completo. Mês/dia em UTC
// para não escorregar de fuso. Entrada inválida → retorna o original trimado.
function formatarData(data?: string | null): string {
  const raw = (data ?? "").trim();
  if (!raw) return "";
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}`;
  return raw;
}

// Formata "HH:MM[:SS]" → "HH:MM". Entrada inválida → original trimado.
function formatarHora(hora?: string | null): string {
  const raw = (hora ?? "").trim();
  if (!raw) return "";
  const m = raw.match(/^(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  return raw;
}

// Linha de data/hora montada conforme o que existe.
function linhaDataHora(data?: string | null, hora?: string | null): string {
  const d = formatarData(data);
  const h = formatarHora(hora);
  if (d && h) return `📅 ${d} às ${h}`;
  if (d) return `📅 ${d}`;
  if (h) return `🕒 ${h}`;
  return "";
}

function ehOnline(tipo?: string | null): boolean {
  return (tipo ?? "").trim().toLowerCase() === "online";
}

function montar(linhas: (string | null | undefined)[]): string {
  return linhas
    .filter((l): l is string => typeof l === "string" && l.trim().length > 0)
    .join("\n");
}

/** Confirmação enviada quando a consulta é AGENDADA. */
export function composeConfirmacao(p: DadosConsulta): string {
  const nome = primeiroNome(p.nome);
  const saudacao = nome ? `Olá, ${nome}! ` : "Olá! ";
  const online = ehOnline(p.tipo);

  return montar([
    `${saudacao}Sua consulta na Revivaz foi confirmada. 💚`,
    linhaDataHora(p.data, p.hora),
    online
      ? "Atendimento online (por vídeo)."
      : p.tipo
        ? "Atendimento presencial."
        : null,
    online && p.link ? `Link da sala: ${p.link}` : null,
    !online && p.link ? `Local: ${p.link}` : null,
    "",
    "Estamos com você. Até lá!",
    RODAPE_CRISE,
  ]);
}

/** Lembrete enviado ~24h antes da consulta. */
export function composeLembrete(p: DadosConsulta): string {
  const nome = primeiroNome(p.nome);
  const saudacao = nome ? `Oi, ${nome}! ` : "Oi! ";
  const online = ehOnline(p.tipo);

  return montar([
    `${saudacao}Passando para lembrar da sua consulta na Revivaz amanhã. 💚`,
    linhaDataHora(p.data, p.hora),
    online
      ? "Atendimento online (por vídeo)."
      : p.tipo
        ? "Atendimento presencial."
        : null,
    online && p.link ? `Link da sala: ${p.link}` : null,
    !online && p.link ? `Local: ${p.link}` : null,
    "",
    "Cuide de você. Te esperamos!",
    RODAPE_CRISE,
  ]);
}
