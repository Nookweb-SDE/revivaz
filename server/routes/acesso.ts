// Acesso por e-mail: link de um clique + senha temporária, enviados pelo SMTP
// da Revivaz (não pelo Supabase, cujo SMTP é do projeto inteiro do Diogo).
//
// O Supabase só GERA o acesso (admin/generate_link): devolve o código de 6
// dígitos e o token do link sem mandar e-mail. O link aponta para a nossa
// /conta com o token, e o front troca por sessão com verifyOtp — assim não
// dependemos da lista de Redirect URLs do projeto dividido.
import { Router, type Request, type Response } from "express";
import {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  requireAuth,
} from "../config";
import { emailValido } from "../validacao";
import { isAcessoIpLimitado, isAcessoEmailLimitado } from "../lib/limitadores";
import { enviarEmail } from "../lib/email";
import { emailAcesso } from "../lib/emailAcesso";

const router = Router();

const SITE = "https://revivaz.com.br";

/** Para onde o link volta. Só a Revivaz e o dev local; o resto cai no site. */
export function baseDoLink(origin: string | undefined): string {
  const o = (origin ?? "").replace(/\/$/, "");
  if (/^https:\/\/(www\.)?revivaz\.com\.br$/.test(o)) return o;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return o;
  return SITE;
}

function adminHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };
}

interface LinkGerado {
  codigo: string;
  tokenHash: string;
  tipo: string;
}

/** O GoTrue já devolveu os campos soltos e já devolveu dentro de `properties`. */
function lerLink(body: Record<string, unknown>): LinkGerado | null {
  const p = (body.properties ?? body) as Record<string, unknown>;
  const codigo = typeof p.email_otp === "string" ? p.email_otp : "";
  const tokenHash = typeof p.hashed_token === "string" ? p.hashed_token : "";
  const tipo = typeof p.verification_type === "string" ? p.verification_type : "magiclink";
  return codigo && tokenHash ? { codigo, tokenHash, tipo } : null;
}

async function gerarLink(email: string): Promise<LinkGerado | null> {
  const pedir = () =>
    fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ type: "magiclink", email }),
    });
  let r = await pedir();
  if (!r.ok && (r.status === 404 || r.status === 422)) {
    // Quem ainda não tem conta: cria (e-mail já confirmado, porque quem abrir
    // o link prova o e-mail) e pede de novo.
    const c = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ email, email_confirm: true }),
    });
    if (!c.ok) return null;
    r = await pedir();
  }
  if (!r.ok) return null;
  return lerLink((await r.json()) as Record<string, unknown>);
}

// ─── POST /api/auth/acesso ───────────────────────────────────────────────────
// Rota pública. A resposta é a mesma tenha ou não conta: dizer "esse e-mail não
// existe" entregaria quem faz tratamento aqui.
router.post("/api/auth/acesso", async (req: Request, res: Response): Promise<void> => {
  const fwd = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(fwd) ? fwd[0] : (fwd || "").toString().split(",")[0].trim()) ||
    req.socket.remoteAddress ||
    "desconhecido";

  const email = String(req.body?.email ?? "").trim().toLowerCase().slice(0, 160);
  if (!emailValido(email)) {
    res.status(400).json({ error: "Confira o e-mail." });
    return;
  }
  const agora = Date.now();
  if (isAcessoIpLimitado(ip, agora) || isAcessoEmailLimitado(email, agora)) {
    res.status(429).json({ error: "Muitos pedidos. Espere alguns minutos e tente de novo." });
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(503).json({ error: "Acesso indisponível agora." });
    return;
  }

  try {
    const gerado = await gerarLink(email);
    if (!gerado) {
      res.status(502).json({ error: "Não consegui gerar o acesso. Tente de novo." });
      return;
    }
    // /conta.html só no Vite (dev); em produção a rota limpa é /conta.
    const volta = req.body?.volta === "/conta.html" ? "/conta.html" : "/conta";
    const link =
      `${baseDoLink(req.headers.origin)}${volta}` +
      `?token_hash=${encodeURIComponent(gerado.tokenHash)}&type=${encodeURIComponent(gerado.tipo)}`;
    const env = await enviarEmail({ para: email, ...emailAcesso(link, gerado.codigo) });
    if (!env.ok) {
      res.status(503).json({ error: "Não consegui enviar o e-mail agora. Tente de novo." });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[acesso] erro:", err);
    res.status(500).json({ error: "Erro interno." });
  }
});

// ─── POST /api/auth/criar-senha ──────────────────────────────────────────────
// Primeiro acesso: troca a senha temporária pela da pessoa. Feito pelo admin
// (e não por updateUser no front) para gravar junto a marca de que ela já
// criou a senha, que o front lê em app_metadata e a pessoa não consegue forjar.
router.post("/api/auth/criar-senha", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const uid = res.locals.uid as string;
  const senha = String(req.body?.senha ?? "");
  if (senha.length < 8 || senha.length > 72) {
    res.status(400).json({ error: "A senha precisa ter de 8 a 72 caracteres." });
    return;
  }
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(uid)}`, {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify({ password: senha, app_metadata: { revivaz_senha_criada: true } }),
    });
    if (!r.ok) {
      res.status(502).json({ error: "Não consegui salvar a senha. Tente de novo." });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[criar-senha] erro:", err);
    res.status(500).json({ error: "Erro interno." });
  }
});

export default router;
