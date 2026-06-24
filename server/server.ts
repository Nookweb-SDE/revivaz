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
import { mintJitsiJwt } from "./jitsiJwt";
import { roomName, isOnline } from "../src/video/room";
import { composeConfirmacao, composeLembrete } from "../src/notificacoes/mensagens";

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

// ─── Jitsi (vídeo) ──────────────────────────────────────────────────────────
// Domínio e app_id podem ser env simples (públicos); o secret do JWT é o único
// sensível e resolve via env OU Docker secret *_FILE (nunca exposto ao front).
const JITSI_DOMAIN = (process.env.JITSI_DOMAIN || "").replace(/\/$/, "");
const JITSI_APP_ID = process.env.JITSI_APP_ID || "";
const JITSI_JWT_SECRET = resolveSecret("JITSI_JWT_SECRET", "JITSI_JWT_SECRET_FILE");

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

// ─── Helper: envia uma mensagem WhatsApp via Evolution (reusa /wa/start) ─────
// Mesmo endpoint sendText. NUNCA loga o telefone inteiro nem o texto.
// Retorna true só se a Evolution respondeu ok. Não lança.
async function enviarWhatsApp(phoneDigits: string, texto: string): Promise<boolean> {
  if (!EVOLUTION_URL || !EVOLUTION_INSTANCE || !EVOLUTION_API_KEY) return false;
  const number = normalizePhone(phoneDigits);
  if (number.length < 12) return false;
  const endpoint = `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
  try {
    const evRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({ number, text: texto }),
    });
    if (!evRes.ok) {
      console.error(
        `[wa/send] Evolution retornou ${evRes.status} para ${number.slice(0, 4)}****`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("[wa/send] Falha ao chamar Evolution API:", err);
    return false;
  }
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

// ─── POST /api/consulta/room-token ───────────────────────────────────────────
// Emite um JWT Jitsi (curto) que restringe o portador à sala DAQUELA consulta.
// Segurança: exige Bearer válido do usuário; o caller precisa ser o paciente
// OU o profissional vinculado da consulta (validado via service_role, ignorando
// RLS só p/ checar associação). A consulta tem de ser 'online' e estar
// 'agendada'/'realizada'. moderator = o profissional. O secret nunca sai do
// server e o token/secret nunca são logados.
app.post(
  "/api/consulta/room-token",
  async (req: Request, res: Response): Promise<void> => {
    if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }
    // Sem config Jitsi → 503 (front degrada p/ link externo via jitsiConfigured)
    if (!JITSI_DOMAIN || !JITSI_APP_ID || !JITSI_JWT_SECRET) {
      res.status(503).json({ error: "vídeo não configurado" });
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

    const consulta_id = String(req.body?.consulta_id ?? "").trim();
    if (!consulta_id) {
      res.status(400).json({ error: "consulta_id é obrigatório" });
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
      console.error("[room-token] Erro ao validar token:", err);
      res.status(500).json({ error: "Erro interno de autenticação" });
      return;
    }

    // (2) carrega a consulta via service_role (ignora RLS p/ checar associação)
    let consulta: {
      id: string;
      paciente_id: string | null;
      profissional_id: string | null;
      tipo: string | null;
      status: string | null;
    };
    try {
      const cRes = await fetch(
        `${SUPABASE_URL}/rest/v1/consultas?id=eq.${encodeURIComponent(
          consulta_id
        )}&select=id,paciente_id,profissional_id,tipo,status`,
        { headers: adminHeaders }
      );
      if (!cRes.ok) {
        const body = await cRes.text();
        console.error("[room-token] Erro ao ler consulta:", cRes.status, body);
        res.status(500).json({ error: "Erro interno" });
        return;
      }
      const rows = (await cRes.json()) as Array<typeof consulta>;
      if (!rows[0]) {
        res.status(404).json({ error: "Consulta não encontrada" });
        return;
      }
      consulta = rows[0];
    } catch (err) {
      console.error("[room-token] Erro inesperado (consulta):", err);
      res.status(500).json({ error: "Erro interno" });
      return;
    }

    // (3) autorização: caller é paciente OU o profissional vinculado da consulta
    let isPaciente = consulta.paciente_id === callerUid;
    let isProfissional = false;
    if (!isPaciente && consulta.profissional_id) {
      try {
        const pRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profissionais?id=eq.${encodeURIComponent(
            consulta.profissional_id
          )}&profile_id=eq.${callerUid}&select=id`,
          { headers: adminHeaders }
        );
        if (pRes.ok) {
          const rows = (await pRes.json()) as Array<{ id: string }>;
          isProfissional = rows.length > 0;
        }
      } catch (err) {
        console.error("[room-token] Erro ao checar profissional:", err);
        res.status(500).json({ error: "Erro interno" });
        return;
      }
    }
    if (!isPaciente && !isProfissional) {
      res.status(403).json({ error: "Você não participa desta consulta" });
      return;
    }

    // (4) regras de negócio: online + status agendada/realizada
    if (!isOnline(String(consulta.tipo ?? ""))) {
      res.status(400).json({ error: "consulta não é online" });
      return;
    }
    if (
      consulta.status !== "agendada" &&
      consulta.status !== "realizada"
    ) {
      res.status(400).json({ error: "consulta não está disponível para vídeo" });
      return;
    }

    // (5) nome p/ context — best-effort (não bloqueia a sala se falhar)
    let userName = "Participante";
    try {
      const nRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${callerUid}&select=nome`,
        { headers: adminHeaders }
      );
      if (nRes.ok) {
        const rows = (await nRes.json()) as Array<{ nome?: string | null }>;
        const nome = rows[0]?.nome;
        if (nome && String(nome).trim()) userName = String(nome).trim();
      }
    } catch {
      // best-effort — mantém "Participante"
    }

    // (6) emite o JWT restrito à sala desta consulta
    const room = roomName(consulta.id);
    const moderator = isProfissional; // o profissional é o moderador
    const jwt = mintJitsiJwt({
      secret: JITSI_JWT_SECRET,
      appId: JITSI_APP_ID,
      domain: JITSI_DOMAIN,
      room,
      userId: callerUid,
      userName,
      moderator,
      nowSec: Math.floor(Date.now() / 1000),
    });

    console.log(
      `[room-token] sala emitida consulta=${consulta.id.slice(0, 8)}… moderator=${moderator}`
    );
    res.status(200).json({ token: jwt, room, domain: JITSI_DOMAIN });
  }
);

// ─── POST /api/consulta/notificar ────────────────────────────────────────────
// Notifica o PACIENTE por WhatsApp que a consulta foi AGENDADA (confirmação).
// Segurança: exige Bearer válido; o caller precisa ser admin OU o profissional
// vinculado da consulta (mesmo padrão do /room-token, via service_role só p/
// checar associação). Carrega o telefone do paciente em profiles.telefone.
// Sem telefone → {ok:false, skipped:"sem telefone"} (HTTP 200, não é erro: o
// front trata best-effort). Erro real de Evolution/servidor → >= 500.
// NUNCA loga telefone inteiro nem o texto.
app.post(
  "/api/consulta/notificar",
  async (req: Request, res: Response): Promise<void> => {
    if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }
    // Evolution não configurado → não é erro de negócio: pula silenciosamente.
    if (!EVOLUTION_URL || !EVOLUTION_INSTANCE || !EVOLUTION_API_KEY) {
      res.status(200).json({ ok: false, skipped: "whatsapp não configurado" });
      return;
    }

    // (0) extrai o Bearer
    const authHeader = String(req.headers["authorization"] ?? "");
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!token) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const consulta_id = String(req.body?.consulta_id ?? "").trim();
    if (!consulta_id) {
      res.status(400).json({ error: "consulta_id é obrigatório" });
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
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
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
      console.error("[notificar] Erro ao validar token:", err);
      res.status(500).json({ error: "Erro interno de autenticação" });
      return;
    }

    // (2) carrega a consulta via service_role (ignora RLS p/ checar associação)
    let consulta: {
      id: string;
      paciente_id: string | null;
      profissional_id: string | null;
      data: string | null;
      hora: string | null;
      tipo: string | null;
      status: string | null;
      link_ou_local: string | null;
    };
    try {
      const cRes = await fetch(
        `${SUPABASE_URL}/rest/v1/consultas?id=eq.${encodeURIComponent(
          consulta_id
        )}&select=id,paciente_id,profissional_id,data,hora,tipo,status,link_ou_local`,
        { headers: adminHeaders }
      );
      if (!cRes.ok) {
        const body = await cRes.text();
        console.error("[notificar] Erro ao ler consulta:", cRes.status, body);
        res.status(500).json({ error: "Erro interno" });
        return;
      }
      const rows = (await cRes.json()) as Array<typeof consulta>;
      if (!rows[0]) {
        res.status(404).json({ error: "Consulta não encontrada" });
        return;
      }
      consulta = rows[0];
    } catch (err) {
      console.error("[notificar] Erro inesperado (consulta):", err);
      res.status(500).json({ error: "Erro interno" });
      return;
    }

    // (3) autorização: caller é admin OU o profissional vinculado da consulta
    let autorizado = false;
    try {
      const roleRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${callerUid}&select=role`,
        { headers: adminHeaders }
      );
      if (roleRes.ok) {
        const rows = (await roleRes.json()) as Array<{ role?: string }>;
        if (rows[0]?.role === "admin") autorizado = true;
      }
    } catch (err) {
      console.error("[notificar] Erro ao checar admin:", err);
      res.status(500).json({ error: "Erro interno" });
      return;
    }
    if (!autorizado && consulta.profissional_id) {
      try {
        const pRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profissionais?id=eq.${encodeURIComponent(
            consulta.profissional_id
          )}&profile_id=eq.${callerUid}&select=id`,
          { headers: adminHeaders }
        );
        if (pRes.ok) {
          autorizado = ((await pRes.json()) as unknown[]).length > 0;
        }
      } catch (err) {
        console.error("[notificar] Erro ao checar profissional:", err);
        res.status(500).json({ error: "Erro interno" });
        return;
      }
    }
    if (!autorizado) {
      res.status(403).json({ error: "Você não pode notificar esta consulta" });
      return;
    }

    // (4) carrega nome + telefone do paciente (profiles.id = paciente_id)
    let nome: string | null = null;
    let telefone: string | null = null;
    if (consulta.paciente_id) {
      try {
        const pacRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(
            consulta.paciente_id
          )}&select=nome,telefone`,
          { headers: adminHeaders }
        );
        if (pacRes.ok) {
          const rows = (await pacRes.json()) as Array<{
            nome?: string | null;
            telefone?: string | null;
          }>;
          nome = rows[0]?.nome ?? null;
          telefone = rows[0]?.telefone ?? null;
        }
      } catch (err) {
        console.error("[notificar] Erro ao ler paciente:", err);
        res.status(500).json({ error: "Erro interno" });
        return;
      }
    }

    // Sem telefone → não é erro: pula (login por e-mail pode não ter telefone).
    if (!telefone || !String(telefone).replace(/\D/g, "")) {
      res.status(200).json({ ok: false, skipped: "sem telefone" });
      return;
    }

    // (5) compõe a confirmação (link só p/ online; mapeia link_ou_local → link)
    const texto = composeConfirmacao({
      nome,
      data: consulta.data,
      hora: consulta.hora,
      tipo: consulta.tipo,
      link: consulta.link_ou_local,
    });

    // (6) envia. Falha de Evolution → 5xx (é o caso que o front trata como erro).
    const ok = await enviarWhatsApp(String(telefone), texto);
    if (!ok) {
      res.status(502).json({ error: "Falha ao enviar WhatsApp" });
      return;
    }

    console.log(
      `[notificar] confirmação enviada consulta=${consulta.id.slice(0, 8)}…`
    );
    res.status(200).json({ ok: true });
  }
);

// ─── POST /api/consulta/nota-ia ──────────────────────────────────────────────
// Nota clínica assistida por IA: o PROFISSIONAL da consulta envia o que observou
// (ditado local no navegador OU digitado — SEM gravação de áudio/vídeo no server)
// e o Gemini estrutura numa evolução PT-BR. É um RASCUNHO que o profissional
// revisa e salva (humano no loop) — não é diagnóstico (compliance CFP/Anvisa).
// Segurança: só o profissional vinculado da consulta (não o paciente).
const NOTA_CLINICA_PROMPT = `Você ajuda um(a) profissional de saúde mental a ORGANIZAR a evolução clínica de um atendimento, a partir das anotações/ditado que ele(a) fornece. Você NÃO diagnostica, NÃO inventa fatos e NÃO adiciona nada que não esteja nas anotações.

Estruture o texto recebido em PT-BR, claro e conciso, nestas seções (omita a seção se não houver informação):
- **Queixa / motivo:** o que a pessoa trouxe.
- **Observações:** o que o(a) profissional observou/relatou.
- **Conduta e próximos passos:** orientações, encaminhamentos, combinados.
- **Sinais de alerta:** riscos mencionados (se houver).

Regras: use só o que está nas anotações; NÃO dê nome de doença como conclusão nem prescreva medicação; mantenha um tom profissional e respeitoso; termine com a linha "_Rascunho gerado por IA a partir das anotações do profissional — revise antes de salvar._". Responda APENAS com a nota estruturada.`;

app.post(
  "/api/consulta/nota-ia",
  async (req: Request, res: Response): Promise<void> => {
    if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }
    if (!GEMINI_KEY) {
      res.status(503).json({ error: "IA não configurada" });
      return;
    }

    const authHeader = String(req.headers["authorization"] ?? "");
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!token) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const consulta_id = String(req.body?.consulta_id ?? "").trim();
    const texto = String(req.body?.texto ?? "").trim();
    if (!consulta_id || !texto) {
      res.status(400).json({ error: "consulta_id e texto são obrigatórios" });
      return;
    }
    if (texto.length > 8000) {
      res.status(413).json({ error: "Texto muito longo." });
      return;
    }

    const adminHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    };

    // valida o Bearer
    let callerUid: string;
    try {
      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
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
      console.error("[nota-ia] Erro ao validar token:", err);
      res.status(500).json({ error: "Erro interno de autenticação" });
      return;
    }

    // carrega a consulta + autoriza SÓ o profissional vinculado
    try {
      const cRes = await fetch(
        `${SUPABASE_URL}/rest/v1/consultas?id=eq.${encodeURIComponent(
          consulta_id
        )}&select=id,profissional_id`,
        { headers: adminHeaders }
      );
      if (!cRes.ok) {
        res.status(500).json({ error: "Erro interno" });
        return;
      }
      const rows = (await cRes.json()) as Array<{
        id: string;
        profissional_id: string | null;
      }>;
      const consulta = rows[0];
      if (!consulta) {
        res.status(404).json({ error: "Consulta não encontrada" });
        return;
      }
      let autorizado = false;
      if (consulta.profissional_id) {
        const pRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profissionais?id=eq.${encodeURIComponent(
            consulta.profissional_id
          )}&profile_id=eq.${callerUid}&select=id`,
          { headers: adminHeaders }
        );
        if (pRes.ok) {
          autorizado = ((await pRes.json()) as unknown[]).length > 0;
        }
      }
      if (!autorizado) {
        res.status(403).json({ error: "Apenas o profissional da consulta" });
        return;
      }
    } catch (err) {
      console.error("[nota-ia] Erro ao autorizar:", err);
      res.status(500).json({ error: "Erro interno" });
      return;
    }

    // Gemini estrutura a nota (não-streaming; texto curto)
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: NOTA_CLINICA_PROMPT,
        generationConfig: { maxOutputTokens: 800 },
      });
      const result = await model.generateContent(texto);
      const nota = result.response.text();
      console.log(`[nota-ia] nota gerada consulta=${consulta_id.slice(0, 8)}…`);
      res.status(200).json({ nota });
    } catch (err) {
      console.error("[nota-ia] Erro Gemini:", err);
      res.status(500).json({ error: "Falha ao gerar a nota. Tente novamente." });
    }
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

// ─── Scheduler de LEMBRETE (24h antes) ───────────────────────────────────────
// De hora em hora: busca consultas status='agendada' com data = AMANHÃ e
// lembrete_enviado=false → envia composeLembrete ao paciente → marca a flag
// (service_role). Idempotente pela flag (não duplica). Só roda se Evolution +
// Supabase service_role estiverem configurados. NUNCA loga telefone/texto.
function amanhaISO(): string {
  // Data (YYYY-MM-DD) de amanhã no fuso do Brasil (America/Sao_Paulo).
  // A coluna `consultas.data` é `date` sem fuso, preenchida pela UI brasileira
  // (UTC-3). Calcular em UTC erra o dia entre ~21h e meia-noite BRT (o UTC já
  // virou o dia seguinte), pulando/antecipando o lembrete. en-CA formata ISO.
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

async function enviarLembretesPendentes(): Promise<void> {
  const adminHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };
  const dia = amanhaISO();

  let consultas: Array<{
    id: string;
    paciente_id: string | null;
    data: string | null;
    hora: string | null;
    tipo: string | null;
    link_ou_local: string | null;
  }> = [];
  try {
    const cRes = await fetch(
      `${SUPABASE_URL}/rest/v1/consultas?status=eq.agendada&data=eq.${dia}` +
        `&lembrete_enviado=eq.false` +
        `&select=id,paciente_id,data,hora,tipo,link_ou_local`,
      { headers: adminHeaders }
    );
    if (!cRes.ok) {
      const body = await cRes.text();
      console.error("[lembrete] Erro ao buscar consultas:", cRes.status, body);
      return;
    }
    consultas = (await cRes.json()) as typeof consultas;
  } catch (err) {
    console.error("[lembrete] Erro inesperado (busca):", err);
    return;
  }

  if (!consultas.length) return;
  console.log(`[lembrete] ${consultas.length} consulta(s) p/ amanhã`);

  for (const c of consultas) {
    if (!c.paciente_id) continue;
    // telefone + nome do paciente
    let nome: string | null = null;
    let telefone: string | null = null;
    try {
      const pacRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(
          c.paciente_id
        )}&select=nome,telefone`,
        { headers: adminHeaders }
      );
      if (pacRes.ok) {
        const rows = (await pacRes.json()) as Array<{
          nome?: string | null;
          telefone?: string | null;
        }>;
        nome = rows[0]?.nome ?? null;
        telefone = rows[0]?.telefone ?? null;
      }
    } catch (err) {
      console.error("[lembrete] Erro ao ler paciente:", err);
      continue;
    }

    // sem telefone → marca como enviado p/ não reprocessar toda hora (degrade)
    if (!telefone || !String(telefone).replace(/\D/g, "")) {
      await marcarLembreteEnviado(adminHeaders, c.id);
      continue;
    }

    const texto = composeLembrete({
      nome,
      data: c.data,
      hora: c.hora,
      tipo: c.tipo,
      link: c.link_ou_local,
    });
    const ok = await enviarWhatsApp(String(telefone), texto);
    if (ok) {
      const marcado = await marcarLembreteEnviado(adminHeaders, c.id);
      if (marcado) {
        console.log(`[lembrete] enviado consulta=${c.id.slice(0, 8)}…`);
      } else {
        // Enviou mas NÃO conseguiu marcar a flag → na próxima passada (1h) a
        // consulta volta no filtro e o paciente recebe DE NOVO. Logamos em
        // WARN p/ o operador agir (idealmente marcar a flag à mão) antes do
        // próximo ciclo, evitando spam silencioso.
        console.warn(
          `[lembrete] ENVIADO mas flag NÃO marcada consulta=${c.id.slice(
            0,
            8
          )}… (risco de duplicar na próxima passada)`
        );
      }
    }
    // se falhou o envio: NÃO marca → tenta de novo na próxima passada (1h).
  }
}

// Marca lembrete_enviado=true. Retorna true só se o PATCH respondeu 2xx —
// não confia cegamente que a marcação ocorreu (RLS transitória, 5xx, etc.).
async function marcarLembreteEnviado(
  adminHeaders: Record<string, string>,
  consultaId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/consultas?id=eq.${encodeURIComponent(consultaId)}`,
      {
        method: "PATCH",
        headers: { ...adminHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ lembrete_enviado: true }),
      }
    );
    if (!res.ok) {
      console.error("[lembrete] PATCH flag não-2xx:", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[lembrete] Erro ao marcar flag:", err);
    return false;
  }
}

// Só agenda se temos como enviar (Evolution) e ler (service_role).
const lembreteHabilitado =
  !!EVOLUTION_URL &&
  !!EVOLUTION_INSTANCE &&
  !!EVOLUTION_API_KEY &&
  !!SUPABASE_URL &&
  !!SUPABASE_SERVICE_ROLE_KEY;

if (lembreteHabilitado) {
  const LEMBRETE_INTERVAL_MS = 3_600_000; // de hora em hora
  setInterval(() => {
    enviarLembretesPendentes().catch((err) =>
      console.error("[lembrete] passada falhou:", err)
    );
  }, LEMBRETE_INTERVAL_MS);
  console.log("[lembrete] scheduler ativo (de hora em hora)");
} else {
  console.log("[lembrete] scheduler inativo (Evolution/Supabase não configurado)");
}

const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, () => console.log(`revivaz on :${PORT}`));
