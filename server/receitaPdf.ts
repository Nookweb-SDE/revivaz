// Gera o PDF da receita digital. Função PURA (dados dentro → bytes fora), sem
// tocar rede nem banco — o server carrega os dados e chama daqui, e o teste
// consegue exercitar tudo sem Supabase.
//
// Fonte: Helvetica (WinAnsi) — cobre o português. Qualquer caractere fora do
// WinAnsi quebraria o embed do pdf-lib, então sanitizamos antes de desenhar.
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export interface DadosReceitaPdf {
  id: string;
  /** Texto clínico da receita (medicamento + dosagem + posologia + observações). */
  resumo: string;
  /** ISO date YYYY-MM-DD, ou null se sem prazo. */
  validade: string | null;
  /** ISO timestamp de emissão. */
  emitidaEm: string;
  paciente: { nome: string };
  profissional: { nome: string; especialidade: string | null; registro: string | null };
}

const TEAL = rgb(0, 0.3, 0.36);
const CINZA = rgb(0.42, 0.45, 0.47);
const PRETO = rgb(0.1, 0.12, 0.13);
const LINHA = rgb(0.85, 0.87, 0.88);

const A4: [number, number] = [595.28, 841.89];
const MARGEM = 56;
const LARGURA_UTIL = A4[0] - MARGEM * 2;

/** pdf-lib/WinAnsi não aceita qualquer unicode: troca o que não couber. */
function sanitize(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    // qualquer coisa fora de Latin-1 imprimível vira "?" em vez de estourar
    .replace(/[^ -~¡-ÿ\n]/g, "?");
}

/** Quebra o texto em linhas que cabem em `largura`, respeitando \n do autor. */
export function wrapText(
  texto: string,
  font: PDFFont,
  size: number,
  largura: number
): string[] {
  const linhas: string[] = [];
  for (const paragrafo of sanitize(texto).split("\n")) {
    if (!paragrafo.trim()) {
      linhas.push("");
      continue;
    }
    let atual = "";
    for (const palavra of paragrafo.split(/\s+/)) {
      const tentativa = atual ? `${atual} ${palavra}` : palavra;
      if (font.widthOfTextAtSize(tentativa, size) <= largura) {
        atual = tentativa;
      } else {
        if (atual) linhas.push(atual);
        // palavra sozinha maior que a linha: corta na força
        let resto = palavra;
        while (font.widthOfTextAtSize(resto, size) > largura && resto.length > 1) {
          let corte = resto.length;
          while (corte > 1 && font.widthOfTextAtSize(resto.slice(0, corte), size) > largura) {
            corte--;
          }
          linhas.push(resto.slice(0, corte));
          resto = resto.slice(corte);
        }
        atual = resto;
      }
    }
    if (atual) linhas.push(atual);
  }
  return linhas;
}

/** dd/mm/aaaa a partir de ISO date ou timestamp. Entrada inválida → "". */
export function formatarDataBR(iso: string | null): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export async function buildReceitaPdf(d: DadosReceitaPdf): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Receita - ${d.paciente.nome}`);
  pdf.setCreator("Plataforma de saude mental");
  pdf.setProducer("Plataforma de saude mental");

  const page = pdf.addPage(A4);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = A4[1] - MARGEM;

  const texto = (
    s: string,
    opts: { size?: number; font?: PDFFont; color?: typeof PRETO; x?: number } = {}
  ) => {
    const size = opts.size ?? 11;
    page.drawText(sanitize(s), {
      x: opts.x ?? MARGEM,
      y,
      size,
      font: opts.font ?? regular,
      color: opts.color ?? PRETO,
    });
  };

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  texto("RECEITA DIGITAL", { size: 20, font: bold, color: TEAL });
  y -= 18;
  texto("Documento emitido eletronicamente pelo profissional responsavel.", {
    size: 9,
    color: CINZA,
  });
  y -= 22;
  page.drawLine({
    start: { x: MARGEM, y },
    end: { x: MARGEM + LARGURA_UTIL, y },
    thickness: 1,
    color: LINHA,
  });
  y -= 26;

  // ── Blocos de identificação ────────────────────────────────────────────────
  const campo = (rotulo: string, valor: string) => {
    texto(rotulo, { size: 8, font: bold, color: CINZA });
    y -= 13;
    texto(valor || "-", { size: 12 });
    y -= 22;
  };

  campo("PACIENTE", d.paciente.nome);
  const credencial = [d.profissional.especialidade, d.profissional.registro]
    .filter(Boolean)
    .join(" - ");
  campo(
    "PROFISSIONAL",
    credencial ? `${d.profissional.nome} (${credencial})` : d.profissional.nome
  );
  campo("EMITIDA EM", formatarDataBR(d.emitidaEm));
  campo(
    "VALIDADE",
    d.validade ? `Valida ate ${formatarDataBR(d.validade)}` : "Sem prazo definido"
  );

  y -= 4;
  page.drawLine({
    start: { x: MARGEM, y },
    end: { x: MARGEM + LARGURA_UTIL, y },
    thickness: 1,
    color: LINHA,
  });
  y -= 26;

  // ── Prescrição ─────────────────────────────────────────────────────────────
  texto("PRESCRICAO", { size: 8, font: bold, color: CINZA });
  y -= 18;
  for (const linha of wrapText(d.resumo, regular, 12, LARGURA_UTIL)) {
    if (y < MARGEM + 120) break; // não invade o rodapé; receita longa é truncada visualmente
    texto(linha, { size: 12 });
    y -= 17;
  }

  // ── Rodapé: assinatura e identificação do documento ────────────────────────
  const yRodape = MARGEM + 76;
  page.drawLine({
    start: { x: MARGEM, y: yRodape },
    end: { x: MARGEM + 240, y: yRodape },
    thickness: 1,
    color: LINHA,
  });
  page.drawText(sanitize(d.profissional.nome), {
    x: MARGEM,
    y: yRodape - 14,
    size: 10,
    font: bold,
    color: PRETO,
  });
  if (credencial) {
    page.drawText(sanitize(credencial), {
      x: MARGEM,
      y: yRodape - 27,
      size: 9,
      font: regular,
      color: CINZA,
    });
  }
  page.drawText(sanitize(`Documento no ${d.id}`), {
    x: MARGEM,
    y: MARGEM - 8,
    size: 7,
    font: regular,
    color: CINZA,
  });

  return pdf.save();
}
