/* Arquivos estáticos depois de um deploy: o build troca o hash dos nomes em
   /assets, e quem estava com a página aberta ainda pede os nomes antigos.
   Pedido de arquivo que não existe recebe 404 (o fallback de SPA devolvia o
   index.html com 200 e o navegador quebrava calado); o cliente então se
   recarrega sozinho (src/lib/recuperaAtualizacao.ts). */
import path from "node:path";

/** Tem extensão: é pedido de arquivo, não rota de página. */
export function pareceArquivo(caminho: string): boolean {
  return path.posix.extname(caminho) !== "";
}

/** Cache-Control por arquivo: hash em /assets nunca muda; página sempre confere. */
export function cacheDe(caminho: string): string {
  if (caminho.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  if (caminho.endsWith(".html")) return "no-cache";
  return "public, max-age=0";
}

/** comunicado.revivaz.com.br é a pasta /comunicado do build servida na raiz do subdomínio. */
export const HOST_COMUNICADO = "comunicado.revivaz.com.br";

export function urlNoSubdominio(host: string, url: string): string {
  return host === HOST_COMUNICADO ? "/comunicado" + url : url;
}
