// Servidor Node (Contabo) — serve o build estático (landing + /acolhimento)
// e a API de acolhimento + WhatsApp OTP self-contained.
// OTP flow: server gera código → envia via Evolution → verifica → cria sessão via service_role.
import express, { Request, Response } from "express";
import { fileURLToPath } from "url";
import path from "path";
import { readFileSync, existsSync } from "fs";
import { randomInt, randomBytes } from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { detectCrisis, CRISIS_RESOURCES } from "../src/acolhimento/crisis";
import { ACOLHIMENTO_SYSTEM_PROMPT } from "../src/acolhimento/systemPrompt";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "..", "dist");
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// ─── Secret resolution (env OR Docker secret *_FILE) ────────────────────────
function resolveSecret(envKey: string, fileKey: string): string {
  if (process.env[envKey]) return process.env[envKey]!.trim();
  const f = process.env[fileKey];
  if (f && existsSync(f)) return readFileSync(f, "utf8").trim();
  return "";
}

function resolveGeminiKey(): string {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const f = process.env.GEMINI_API_KEY_FILE;
  if (f && existsSync(f)) return readFileSync(f, "utf8").trim();
  return "";
}

const GEMINI_KEY = resolveGeminiKey();
const EVOLUTION_API_KEY = resolveSecret("EVOLUTION_API_KEY", "EVOLUTION_API_KEY_FILE");
const EVOLUTION_URL = (process.env.EVOLUTION_URL || "").replace(/\/$/, "");
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "";
const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ""
).replace(/\/$/, "");
const SUPABASE_ANON_KEY =
  resolveSecret("SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY_FILE") ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";
const SUPABASE_SERVICE_ROLE_KEY = resolveSecret(
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY_FILE"
);

// ─── In-memory OTP store ─────────────────────────────────────────────────────
interface OtpEntry {
  code: string;
  attempts: number;
  expiresAt: number;
}
const otpStore = new Map<string, OtpEntry>();

// ─── Rate-limit: max 3 start requests per phone per 10 minutes ───────────────
interface RateBucket {
  count: number;
  resetAt: number;
}
const startRateMap = new Map<string, RateBucket>();
const START_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const START_MAX = 3;

function isStartRateLimited(phone: string, now: number): boolean {
  const e = startRateMap.get(phone);
  if (!e || now > e.resetAt) {
    startRateMap.set(phone, { count: 1, resetAt: now + START_WINDOW_MS });
    return false;
  }
  if (e.count >= START_MAX) return true;
  e.count++;
  return false;
}

// ─── Phone normalization ─────────────────────────────────────────────────────
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // If already has country code (starts with 55 and length >= 12), keep as-is
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  // Otherwise prepend Brazil country code
  return `55${digits}`;
}

const app = express();
app.use(express.json({ limit: "256kb" }));

// ─── POST /api/wa/start ──────────────────────────────────────────────────────
app.post("/api/wa/start", async (req: Request, res: Response): Promise<void> => {
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
app.post("/api/wa/verify", async (req: Request, res: Response): Promise<void> => {
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
    res.status(400).json({ error: "Código expirado ou inválido" });
    return;
  }

  entry.attempts++;
  if (entry.attempts > 5) {
    otpStore.delete(phone);
    res.status(400).json({ error: "Muitas tentativas. Solicite um novo código." });
    return;
  }

  if (inputCode !== entry.code) {
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

// ─── POST /api/admin/profissional-link ───────────────────────────────────────
// Admin vincula uma linha de `profissionais` a um auth user (por e-mail):
// cria/acha o user, promove paciente->profissional, seta profissionais.profile_id.
// Segurança: exige Bearer válido do usuário logado E que ele seja role='admin'.
app.post(
  "/api/admin/profissional-link",
  async (req: Request, res: Response): Promise<void> => {
    if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }

    // (0) extrai o Bearer do header Authorization
    const authHeader = String(req.headers["authorization"] ?? "");
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!token) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const profissional_id = String(req.body?.profissional_id ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    if (!profissional_id || !email) {
      res.status(400).json({ error: "profissional_id e email são obrigatórios" });
      return;
    }

    const adminHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    };

    // (1) valida o Bearer — getUser via ANON usando o token do chamador
    let callerUid: string;
    try {
      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      });
      if (!userRes.ok) {
        res.status(401).json({ error: "Sessão inválida" });
        return;
      }
      const u = (await userRes.json()) as { id?: string };
      if (!u.id) {
        res.status(401).json({ error: "Sessão inválida" });
        return;
      }
      callerUid = u.id;
    } catch (err) {
      console.error("[prof-link] Erro ao validar token:", err);
      res.status(500).json({ error: "Erro interno de autenticação" });
      return;
    }

    // (2) confere que o chamador é admin (service_role, ignora RLS)
    try {
      const roleRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${callerUid}&select=role`,
        { headers: adminHeaders }
      );
      if (!roleRes.ok) {
        const body = await roleRes.text();
        console.error("[prof-link] Erro ao ler role:", roleRes.status, body);
        res.status(500).json({ error: "Erro interno de autenticação" });
        return;
      }
      const rows = (await roleRes.json()) as Array<{ role?: string }>;
      if (!rows[0] || rows[0].role !== "admin") {
        res.status(403).json({ error: "Apenas administradores" });
        return;
      }
    } catch (err) {
      console.error("[prof-link] Erro inesperado (role):", err);
      res.status(500).json({ error: "Erro interno de autenticação" });
      return;
    }

    // (3) cria-ou-acha o auth user alvo pelo e-mail (mesmo padrão do /wa/verify)
    let targetUid: string;
    try {
      const listRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`,
        { headers: adminHeaders }
      );
      if (!listRes.ok) {
        const body = await listRes.text();
        console.error("[prof-link] Erro ao listar usuários:", listRes.status, body);
        res.status(500).json({ error: "Erro interno de autenticação" });
        return;
      }
      const listBody = (await listRes.json()) as {
        users?: Array<{ id: string; email?: string }>;
      };
      const existing = (listBody.users ?? []).find(
        (u) => (u.email ?? "").toLowerCase() === email
      );

      if (existing) {
        targetUid = existing.id;
      } else {
        const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
          method: "POST",
          headers: adminHeaders,
          body: JSON.stringify({ email, email_confirm: true }),
        });
        if (!createRes.ok) {
          const body = await createRes.text();
          console.error("[prof-link] Erro ao criar usuário:", createRes.status, body);
          res.status(500).json({ error: "Erro ao criar usuário" });
          return;
        }
        const created = (await createRes.json()) as { id: string };
        targetUid = created.id;
      }
    } catch (err) {
      console.error("[prof-link] Erro inesperado (find/create user):", err);
      res.status(500).json({ error: "Erro interno de autenticação" });
      return;
    }

    // (4) promove -> profissional (NÃO rebaixa admin). Idempotente e robusto:
    // promove sempre que o role atual NÃO for admin — cobre 'paciente' e também
    // o caso de a linha do profile ainda não estar visível (lag do trigger):
    // nesse caso currentRole é undefined (!== 'admin') e a gente promove mesmo
    // assim. Valida o resultado do PATCH antes de seguir pro vínculo.
    try {
      const roleRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${targetUid}&select=role`,
        { headers: adminHeaders }
      );
      let currentRole: string | undefined;
      if (roleRes.ok) {
        const rows = (await roleRes.json()) as Array<{ role?: string }>;
        currentRole = rows[0]?.role;
      }
      if (currentRole !== "admin") {
        const promoteRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${targetUid}`,
          {
            method: "PATCH",
            headers: { ...adminHeaders, Prefer: "return=minimal" },
            body: JSON.stringify({ role: "profissional" }),
          }
        );
        if (!promoteRes.ok) {
          const body = await promoteRes.text();
          console.error("[prof-link] Erro ao promover role:", promoteRes.status, body);
          res.status(500).json({ error: "Erro ao atualizar perfil" });
          return;
        }
      }
    } catch (err) {
      console.error("[prof-link] Erro ao atualizar role do alvo:", err);
      res.status(500).json({ error: "Erro ao atualizar perfil" });
      return;
    }

    // (5) vincula profissionais.profile_id = targetUid
    try {
      const updRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profissionais?id=eq.${profissional_id}`,
        {
          method: "PATCH",
          headers: { ...adminHeaders, Prefer: "return=minimal" },
          body: JSON.stringify({ profile_id: targetUid }),
        }
      );
      if (!updRes.ok) {
        const body = await updRes.text();
        console.error("[prof-link] Erro ao vincular profissional:", updRes.status, body);
        res.status(500).json({ error: "Erro ao vincular profissional" });
        return;
      }
    } catch (err) {
      console.error("[prof-link] Erro inesperado (update profissionais):", err);
      res.status(500).json({ error: "Erro ao vincular profissional" });
      return;
    }

    // (6) ok
    res.status(200).json({ ok: true, profile_id: targetUid });
  }
);

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

app.post("/api/auth/dev-login", async (req: Request, res: Response): Promise<void> => {
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
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
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

// ─── Rate-limit em memória (per-IP + teto diário) — protege custo do /acolhimento ──
const HITS = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
let dailyCount = 0;
let dailyResetAt = 0;
const MAX_PER_DAY = 500;

function rateLimited(ip: string, now: number): boolean {
  if (now > dailyResetAt) {
    dailyCount = 0;
    dailyResetAt = now + 86_400_000;
  }
  if (dailyCount >= MAX_PER_DAY) return true;
  const e = HITS.get(ip);
  if (!e || now > e.resetAt) {
    HITS.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    dailyCount++;
    return false;
  }
  if (e.count >= MAX_PER_WINDOW) return true;
  e.count++;
  dailyCount++;
  return false;
}

app.post("/api/acolhimento", async (req, res) => {
  const fwd = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(fwd) ? fwd[0] : (fwd || "").toString().split(",")[0].trim()) ||
    req.socket.remoteAddress ||
    "unknown";

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  if (messages.length > 40) {
    res.status(413).json({ error: "Conversa muito longa." });
    return;
  }

  // Crise SEMPRE antes do rate-limit (não faz chamada à IA; usuário em crise nunca fica sem recurso).
  const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
  if (lastUser && detectCrisis(String(lastUser.content))) {
    res.status(200).json({ crisis: true, resources: CRISIS_RESOURCES });
    return;
  }

  if (rateLimited(ip, Date.now())) {
    res.status(429).json({ error: "Muitas mensagens. Tente em instantes." });
    return;
  }
  if (!lastUser || messages.length === 0) {
    res.status(400).json({ error: "Mensagem vazia." });
    return;
  }

  if (!GEMINI_KEY) {
    res.status(500).json({ error: "Serviço indisponível." });
    return;
  }

  // Gemini: roles user/model (assistant -> model); systemInstruction = prompt de acolhimento.
  const contents = messages.slice(-12).map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content) }],
  }));
  // Gemini exige que o histórico comece com 'user'.
  while (contents.length && contents[0].role === "model") contents.shift();

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: ACOLHIMENTO_SYSTEM_PROMPT,
      generationConfig: { maxOutputTokens: 600 },
    });
    const result = await model.generateContentStream({ contents });
    for await (const chunk of result.stream) {
      const t = chunk.text();
      if (t) res.write(t);
    }
    res.end();
  } catch (e) {
    console.error("acolhimento error:", e);
    res.end("Desculpe, tive um problema agora. Se for urgente, ligue 188 (CVV).");
  }
});

// Estático + cleanUrls: /acolhimento -> acolhimento.html
app.get("/acolhimento", (_req, res) => res.sendFile(path.join(DIST, "acolhimento.html")));
app.use(express.static(DIST, { extensions: ["html"] }));
// Fallback SPA (Express 5: usar middleware final, não app.get("*"))
app.use((_req, res) => res.sendFile(path.join(DIST, "index.html")));

const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, () => console.log(`revivaz on :${PORT}`));
