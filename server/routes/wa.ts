// Login por WhatsApp: OTP self-contained. O servidor gera o código, manda pela
// Evolution, confere e mina a sessão Supabase com a service_role.
// Nunca loga telefone inteiro nem código.
import { Router, type Request, type Response } from "express";
import { randomInt, randomBytes } from "crypto";
import {
  EVOLUTION_API_KEY,
  EVOLUTION_URL,
  EVOLUTION_INSTANCE,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
} from "../config";
import { normalizePhone } from "../lib/whatsapp";
import { otpStore, isStartRateLimited } from "../lib/otp";

const router = Router();

// ─── POST /api/wa/start ──────────────────────────────────────────────────────
router.post("/api/wa/start", async (req: Request, res: Response): Promise<void> => {
  if (!EVOLUTION_URL || !EVOLUTION_INSTANCE || !EVOLUTION_API_KEY) {
    res.status(500).json({ error: "WhatsApp not configured" });
    return;
  }

  const raw: string = String(req.body?.phone ?? "");
  if (!raw) {
    res.status(400).json({ error: "Telefone obrigatório" });
    return;
  }

  const phone = normalizePhone(raw);
  if (phone.length < 12) {
    res.status(400).json({ error: "Número de telefone inválido" });
    return;
  }

  const now = Date.now();
  if (isStartRateLimited(phone, now)) {
    res.status(429).json({ error: "Muitas tentativas. Aguarde 10 minutos." });
    return;
  }

  // Generate 6-digit code — NEVER log the actual code
  const code = String(randomInt(100000, 999999));
  otpStore.set(phone, { code, attempts: 0, expiresAt: now + 5 * 60 * 1000 });

  const text = `Seu código de acesso Revivaz: ${code}\n\nNão compartilhe. Em emergência ligue 188 (CVV).`;
  const evolutionEndpoint = `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`;

  try {
    const evRes = await fetch(evolutionEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({ number: phone, text }),
    });

    if (!evRes.ok) {
      const body = await evRes.text();
      console.error(`[wa/start] Evolution retornou ${evRes.status}:`, body);
      res.status(500).json({ error: `Falha ao enviar WhatsApp (${evRes.status})` });
      return;
    }

    console.log(`[wa/start] Código enviado para ${phone.slice(0, 4)}****`);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[wa/start] Falha ao chamar Evolution API:", err);
    res.status(500).json({ error: "Falha ao enviar WhatsApp" });
  }
});

// ─── POST /api/wa/verify ─────────────────────────────────────────────────────
// TODO (fase futura): account-linking. Hoje a conta criada/identificada pelo
// telefone do WhatsApp é tratada de forma independente da conta de e-mail —
// não há vínculo automático entre o mesmo usuário logado por WhatsApp e por
// e-mail (magic link). Unificar identidades é trabalho de uma fase futura.
router.post("/api/wa/verify", async (req: Request, res: Response): Promise<void> => {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: "Auth not configured" });
    return;
  }
  if (!SUPABASE_URL) {
    res.status(500).json({ error: "Auth not configured (URL)" });
    return;
  }

  const raw: string = String(req.body?.phone ?? "");
  const inputCode: string = String(req.body?.code ?? "").trim();

  if (!raw || !inputCode) {
    res.status(400).json({ error: "Telefone e código são obrigatórios" });
    return;
  }

  const phone = normalizePhone(raw);
  const entry = otpStore.get(phone);

  if (!entry || Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    res.status(401).json({ error: "Código expirado ou inválido" });
    return;
  }

  entry.attempts++;
  if (inputCode !== entry.code) {
    if (entry.attempts >= 3) {
      otpStore.delete(phone);
      res.status(401).json({ error: "Muitas tentativas. Solicite um novo código." });
      return;
    }
    res.status(400).json({ error: "Código incorreto" });
    return;
  }

  // Code is valid — delete it immediately (one-time use)
  otpStore.delete(phone);

  // ── Supabase admin API: find or create user ───────────────────────────────
  const syntheticEmail = `wa-${phone}@revivaz.app`;
  const adminHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };

  let userId: string;
  try {
    // List users to find existing one
    const listRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`,
      { headers: adminHeaders }
    );
    if (!listRes.ok) {
      const body = await listRes.text();
      console.error("[wa/verify] Erro ao listar usuários:", listRes.status, body);
      res.status(500).json({ error: "Erro interno de autenticação" });
      return;
    }
    const listBody = (await listRes.json()) as {
      users?: Array<{ id: string; email?: string }>;
    };
    const existing = (listBody.users ?? []).find((u) => u.email === syntheticEmail);

    if (existing) {
      userId = existing.id;
      console.log(`[wa/verify] Usuário existente: ${userId.slice(0, 8)}…`);
    } else {
      // Create new user
      const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ email: syntheticEmail, email_confirm: true }),
      });
      if (!createRes.ok) {
        const body = await createRes.text();
        console.error("[wa/verify] Erro ao criar usuário:", createRes.status, body);
        res.status(500).json({ error: "Erro interno de autenticação" });
        return;
      }
      const created = (await createRes.json()) as { id: string };
      userId = created.id;
      console.log(`[wa/verify] Usuário criado: ${userId.slice(0, 8)}…`);
    }
  } catch (err) {
    console.error("[wa/verify] Erro inesperado (find/create user):", err);
    res.status(500).json({ error: "Erro interno de autenticação" });
    return;
  }

  // ── Set a strong random one-time password ────────────────────────────────
  const tempPassword = randomBytes(32).toString("hex");
  try {
    const patchRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({ password: tempPassword }),
    });
    if (!patchRes.ok) {
      const body = await patchRes.text();
      console.error("[wa/verify] Erro ao definir senha:", patchRes.status, body);
      res.status(500).json({ error: "Erro interno de autenticação" });
      return;
    }
  } catch (err) {
    console.error("[wa/verify] Erro inesperado (patch password):", err);
    res.status(500).json({ error: "Erro interno de autenticação" });
    return;
  }

  // ── Sign in with password to obtain JWT tokens ────────────────────────────
  let access_token: string;
  let refresh_token: string;
  try {
    const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email: syntheticEmail, password: tempPassword }),
    });
    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      console.error("[wa/verify] Erro ao obter token:", tokenRes.status, body);
      res.status(500).json({ error: "Erro interno de autenticação" });
      return;
    }
    const tokenBody = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
    };
    access_token = tokenBody.access_token;
    refresh_token = tokenBody.refresh_token;
  } catch (err) {
    console.error("[wa/verify] Erro inesperado (token):", err);
    res.status(500).json({ error: "Erro interno de autenticação" });
    return;
  }

  // ── Best-effort: update profiles table with phone ────────────────────────
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        ...adminHeaders,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ telefone: phone }),
    });
  } catch {
    // Silently ignore — profile update is best-effort
  }

  console.log(`[wa/verify] Sessão criada para ${phone.slice(0, 4)}****`);
  res.status(200).json({ access_token, refresh_token });
});

export default router;
