import { supabase } from "./supabase";

/**
 * Envia um magic link / OTP por e-mail para o usuário.
 * Usa signInWithOtp — o Supabase envia um link de acesso ao e-mail informado.
 */
export async function enviarLinkEmail(
  email: string
): Promise<{ ok: boolean; erro?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: voltarParaCa() },
    });
    if (error) {
      return { ok: false, erro: error.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { ok: false, erro: message };
  }
}

/**
 * Entra com a conta Google (OAuth do Supabase). O navegador sai para o Google
 * e volta para esta mesma página já com a sessão.
 */
export async function entrarComGoogle(): Promise<{ ok: boolean; erro?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: voltarParaCa() },
    });
    if (error) return { ok: false, erro: error.message };
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { ok: false, erro: message };
  }
}

// O Auth é dividido com outros apps do projeto: sem redirect explícito o link
// voltaria para o Site URL de lá. Volta para a página onde a pessoa estava
// (/conta em produção, /conta.html no Vite).
function voltarParaCa(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

/**
 * Retorna o user ID da sessão ativa, ou null se não houver sessão.
 */
export async function getSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/**
 * Subscreve mudanças de estado de autenticação.
 * Chama `cb` com o userId quando o usuário faz login, e com null quando faz logout.
 * Retorna a função de unsubscribe.
 */
export function onAuthChange(
  cb: (userId: string | null) => void
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session?.user.id ?? null);
  });
  return () => data.subscription.unsubscribe();
}

/**
 * Encerra a sessão do usuário atual.
 */
export async function sair(): Promise<void> {
  await supabase.auth.signOut();
}
