/**
 * Lógica pura dos avisos no canto da tela (padrão do toast de evento da
 * NookTrack, commit c0b0ae43). Sem React, sem DOM: cada regra testável sozinha.
 */

export type TomAviso = "info" | "success" | "danger";

export interface Aviso {
  id: string;
  titulo: string;
  linha: string | null;
  quando: string;
  tom: TomAviso;
  /** Cadeado 3D à esquerda do título: avisos de acesso e segurança. */
  cadeado: boolean;
}

/** Rótulo e tom por tipo. Tipo que não estiver aqui aparece cru, em vez de sumir. */
const ROTULOS: Record<string, { texto: string; tom: TomAviso; cadeado?: boolean }> = {
  "acesso-enviado": { texto: "Acesso enviado", tom: "info", cadeado: true },
  "senha-criada": { texto: "Senha criada", tom: "success", cadeado: true },
  "senha-errada": { texto: "Senha temporária errada", tom: "danger", cadeado: true },
  "link-expirado": { texto: "Link expirado", tom: "danger", cadeado: true },
  "acesso-falhou": { texto: "Não consegui enviar", tom: "danger", cadeado: true },
  "entrou": { texto: "Você entrou", tom: "success", cadeado: true },
};

/**
 * Monta o aviso. `id` opcional: quem passa o mesmo id (ex.: clique duplo no
 * mesmo botão) não empilha dois cartões iguais.
 */
export function paraAviso(tipo: string, linha?: string | null, id?: string, agora = new Date()): Aviso {
  const conhecido = ROTULOS[tipo];
  return {
    id: id ?? `${tipo}:${agora.getTime()}:${Math.random().toString(36).slice(2, 7)}`,
    titulo: conhecido?.texto ?? tipo,
    linha: linha ?? null,
    quando: agora.toISOString(),
    tom: conhecido?.tom ?? "info",
    cadeado: conhecido?.cadeado ?? false,
  };
}

/** Mais recente primeiro, sem repetir id, respeitando o teto. */
export function empilhar(atuais: readonly Aviso[], novo: Aviso, teto = 3): Aviso[] {
  if (atuais.some((a) => a.id === novo.id)) return atuais as Aviso[];
  return [novo, ...atuais].slice(0, teto);
}

/** Remove pelo id (fechar no X, ou expirar). */
export function remover(atuais: readonly Aviso[], id: string): Aviso[] {
  return atuais.filter((a) => a.id !== id);
}

// ─── Canal ───────────────────────────────────────────────────────────────────
// Quem quer avisar chama `avisar(...)`; a pilha montada na tela escuta. Sem
// pilha montada o aviso se perde, e tudo bem: aviso não é registro.
type Ouvinte = (a: Aviso) => void;
const ouvintes = new Set<Ouvinte>();

export function avisar(tipo: string, linha?: string | null, id?: string): void {
  const a = paraAviso(tipo, linha, id);
  ouvintes.forEach((o) => o(a));
}

export function ouvirAvisos(o: Ouvinte): () => void {
  ouvintes.add(o);
  return () => {
    ouvintes.delete(o);
  };
}
