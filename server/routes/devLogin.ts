// Cards de acesso rápido do QA. DUPLA TRAVA anti-backdoor: o front só monta sob
// import.meta.env.DEV (o Vite remove do bundle de produção) e esta rota recusa
// com 403 quando NODE_ENV=production.
import { Router, type Request, type Response } from "express";
import { randomBytes } from "crypto";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SCHEMA_HEADERS } from "../config";

const router = Router();

// ─── POST /api/auth/dev-login (LOCAL/DEV ONLY) ───────────────────────────────
// Atalho de QA: entra em 1 clique como um perfil, sem magic-link/OTP.
// DUPLA TRAVA: o front só renderiza a faixa sob import.meta.env.DEV, e aqui o
// endpoint RECUSA se NODE_ENV==='production' (o Dockerfile de prod seta isso).
// Nunca existe/funciona em revivaz.com.br — sem backdoor em dado de saúde.
const DEV_LOGIN_EMAILS: Record<string, string> = {
  admin: process.env.DEV_LOGIN_ADMIN_EMAIL || "contato@izai.dev",
  profissional: process.env.DEV_LOGIN_PROF_EMAIL || "profissional.teste@revivaz.app",
  paciente: process.env.DEV_LOGIN_PACIENTE_EMAIL || "wa-5511965119797@revivaz.app",
};

router.post("/api/auth/dev-login", async (req: Request, res: Response): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "dev-login desabilitado em produção" });
    return;
  }
  if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.status(500).json({ error: "Auth not configured" });
    return;
  }

  const perfil = String(req.body?.perfil ?? "").trim();
  const email = DEV_LOGIN_EMAILS[perfil];
  if (!email) {
    res.status(400).json({ error: "perfil inválido (paciente|profissional|admin)" });
    return;
  }

  const adminHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...SCHEMA_HEADERS,
  };

  try {
    // find-or-create user pelo e-mail
    const listRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`,
      { headers: adminHeaders }
    );
    if (!listRes.ok) {
      res.status(500).json({ error: "Erro ao listar usuários" });
      return;
    }
    const listBody = (await listRes.json()) as {
      users?: Array<{ id: string; email?: string }>;
    };
    let userId =
      (listBody.users ?? []).find(
        (u) => (u.email ?? "").toLowerCase() === email.toLowerCase()
      )?.id ?? "";

    if (!userId) {
      const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ email, email_confirm: true }),
      });
      if (!createRes.ok) {
        res.status(500).json({ error: "Erro ao criar usuário" });
        return;
      }
      userId = ((await createRes.json()) as { id: string }).id;
    }

    // perfil profissional: garante role + uma ficha em profissionais
    if (perfil === "profissional") {
      await fetch(`${SUPABASE_URL}/rest/v1/revivaz_users?id=eq.${userId}`, {
        method: "PATCH",
        headers: { ...adminHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ role: "profissional" }),
      });
      const fichaRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profissionais?profile_id=eq.${userId}&select=id`,
        { headers: adminHeaders }
      );
      const fichas = fichaRes.ok
        ? ((await fichaRes.json()) as Array<{ id: string }>)
        : [];
      if (!fichas.length) {
        await fetch(`${SUPABASE_URL}/rest/v1/profissionais`, {
          method: "POST",
          headers: { ...adminHeaders, Prefer: "return=minimal" },
          body: JSON.stringify({
            nome: "Profissional Teste",
            especialidade: "Psicologia",
            profile_id: userId,
            ativo: true,
          }),
        });
      }
    }

    // senha temp aleatória → token (password grant) → tokens de sessão
    const tempPassword = randomBytes(32).toString("hex");
    const pwRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({ password: tempPassword }),
    });
    if (!pwRes.ok) {
      res.status(500).json({ error: "Erro ao definir senha" });
      return;
    }
    const tokenRes = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ email, password: tempPassword }),
      }
    );
    if (!tokenRes.ok) {
      res.status(500).json({ error: "Erro ao obter token" });
      return;
    }
    const tb = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
    };
    console.log(`[dev-login] sessão criada perfil=${perfil}`);
    res.status(200).json({
      access_token: tb.access_token,
      refresh_token: tb.refresh_token,
    });
  } catch (err) {
    console.error("[dev-login] erro:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
