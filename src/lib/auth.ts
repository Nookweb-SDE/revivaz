import { supabase } from "./supabase";

const MARCA_CODIGO = "revivaz:entrou-por-codigo";

async function postJson(url: string, body: unknown, token?: string): Promise<{ ok: boolean; erro?: string }> {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    if (r.ok) return { ok: true };
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    return { ok: false, erro: j.error ?? "Não deu certo. Tente de novo." };
  } catch {
    return { ok: false, erro: "Sem conexão. Confira a internet e tente de novo." };
  }
}

/**
 * Pede o acesso por e-mail: o servidor manda um link e uma senha temporária
 * (código numérico do Supabase: 6 a 10 dígitos, conforme o projeto) pelo SMTP da Revivaz.
 */
export function pedirAcesso(email: string): Promise<{ ok: boolean; erro?: string }> {
  // /conta.html só existe no Vite (dev); em produção a rota é /conta.
  const volta = window.location.pathname.endsWith(".html") ? "/conta.html" : "/conta";
  return postJson("/api/auth/acesso", { email, volta });
}

function marcarEntradaPorCodigo(): void {
  try {
    sessionStorage.setItem(MARCA_CODIGO, "1");
  } catch {
    /* sem storage: só não pede para criar a senha */
  }
}

function desmarcarEntradaPorCodigo(): void {
  try {
    sessionStorage.removeItem(MARCA_CODIGO);
  } catch {
    /* nada */
  }
}

/**
 * Entra com a senha temporária do e-mail. Se não for um código numérico (ou
 * o código falhar), tenta como a senha que a pessoa já criou.
 */
export async function entrarComSenha(email: string, senha: string): Promise<{ ok: boolean }> {
  const codigo = senha.replace(/\s/g, "");
  if (/^\d{6,10}$/.test(codigo)) {
    // A marca vem ANTES: a sessão nova dispara a troca de tela na hora, e a
    // tela de criar senha precisa já encontrar a marca.
    marcarEntradaPorCodigo();
    const { error } = await supabase.auth.verifyOtp({ email, token: codigo, type: "email" });
    if (!error) return { ok: true };
    desmarcarEntradaPorCodigo();
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  return { ok: !error };
}

/** Entra pelo link do e-mail (?token_hash=...&type=...). Limpa a URL em seguida. */
export async function entrarPeloLink(): Promise<"sem-link" | "ok" | "expirado"> {
  const q = new URLSearchParams(window.location.search);
  const tokenHash = q.get("token_hash");
  if (!tokenHash) return "sem-link";
  const tipo = q.get("type") === "signup" ? "signup" : "magiclink";
  window.history.replaceState(null, "", window.location.pathname);
  marcarEntradaPorCodigo();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
  if (error) {
    desmarcarEntradaPorCodigo();
    return "expirado";
  }
  return "ok";
}

/**
 * Primeiro acesso: entrou pela senha temporária ou pelo link e ainda não criou a
 * própria senha. A marca de "já criou" vem do servidor (app_metadata).
 */
export async function precisaCriarSenha(): Promise<boolean> {
  let veioPorCodigo = false;
  try {
    veioPorCodigo = sessionStorage.getItem(MARCA_CODIGO) === "1";
  } catch {
    return false;
  }
  if (!veioPorCodigo) return false;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.app_metadata?.revivaz_senha_criada !== true;
}

/** Grava a senha nova pelo servidor e atualiza a sessão com a marca. */
export async function criarSenha(senha: string): Promise<{ ok: boolean; erro?: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, erro: "Sua sessão caiu. Entre de novo." };
  const r = await postJson("/api/auth/criar-senha", { senha }, token);
  if (!r.ok) return r;
  await supabase.auth.refreshSession();
  desmarcarEntradaPorCodigo();
  return { ok: true };
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
