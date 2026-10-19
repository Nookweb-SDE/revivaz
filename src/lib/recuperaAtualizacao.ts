/* Depois de um deploy, quem estava com a página aberta pede pedaços do site
   (imports sob demanda) que já não existem. Em vez de deixar a seção quebrada,
   recarrega a página uma vez para pegar a versão nova; o intervalo mínimo
   evita laço se o servidor estiver mesmo fora. */
const CHAVE = "revivaz-recarregou-em";
const INTERVALO_MS = 30_000;

export function deveRecarregar(ultimo: number | null, agora: number): boolean {
  return ultimo === null || agora - ultimo > INTERVALO_MS;
}

// mensagens de Chrome, Safari e Firefox, e a do preload de CSS do Vite
export function ehFalhaDeVersaoVelha(msg: string): boolean {
  return /dynamically imported module|Importing a module script failed|Unable to preload CSS/i.test(msg);
}

function recarregarUmaVez() {
  let ultimo: number | null = null;
  try { const v = sessionStorage.getItem(CHAVE); ultimo = v ? Number(v) : null; } catch { /* sem storage: recarrega igual */ }
  if (!deveRecarregar(ultimo, Date.now())) return;
  try { sessionStorage.setItem(CHAVE, String(Date.now())); } catch { /* idem */ }
  window.location.reload();
}

export function armarRecuperacao() {
  if (typeof window === "undefined") return;
  window.addEventListener("vite:preloadError", e => { e.preventDefault(); recarregarUmaVez(); });
  window.addEventListener("unhandledrejection", e => {
    const r = e.reason as { message?: string } | undefined;
    if (ehFalhaDeVersaoVelha(String(r?.message ?? r ?? ""))) recarregarUmaVez();
  });
}
