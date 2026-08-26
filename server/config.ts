// Configuração do servidor: segredos, endereços e o middleware de auth.
//
// Extraído do server.ts (que passava de 1700 linhas) para que rota nenhuma
// precise saber COMO um segredo é resolvido — só o consome daqui.
//
// Ordem importa: estas constantes são lidas no escopo do módulo, então as
// variáveis de ambiente precisam existir antes do primeiro import.
import { fileURLToPath } from "url";
import path from "path";
import { readFileSync, existsSync } from "fs";
import { makeRequireAuth } from "./middleware/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Pasta do build estático servido pelo Express. */
export const DIST = path.join(__dirname, "..", "dist");

// ─── Secret resolution (env OR Docker secret *_FILE) ────────────────────────
export function resolveSecret(envKey: string, fileKey: string): string {
  if (process.env[envKey]) return process.env[envKey]!.trim();
  const f = process.env[fileKey];
  if (f && existsSync(f)) return readFileSync(f, "utf8").trim();
  return "";
}

// Claude bridge (assistente IA da assinatura, via CLI no host — sem token de LLM).

// URL e secret resolvem via env OU Docker secret *_FILE. O módulo claudeBridge lê
// process.env.CLAUDE_BRIDGE_{URL,SECRET}, então normalizamos as duas aqui.
process.env.CLAUDE_BRIDGE_URL =
  resolveSecret("CLAUDE_BRIDGE_URL", "CLAUDE_BRIDGE_URL_FILE") || process.env.CLAUDE_BRIDGE_URL || "";
process.env.CLAUDE_BRIDGE_SECRET =
  resolveSecret("CLAUDE_BRIDGE_SECRET", "CLAUDE_BRIDGE_SECRET_FILE") || process.env.CLAUDE_BRIDGE_SECRET || "";

export const EVOLUTION_API_KEY = resolveSecret("EVOLUTION_API_KEY", "EVOLUTION_API_KEY_FILE");
export const EVOLUTION_URL = (process.env.EVOLUTION_URL || "").replace(/\/$/, "");
export const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "";
export const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ""
).replace(/\/$/, "");
export const SUPABASE_ANON_KEY =
  resolveSecret("SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY_FILE") ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";
export const SUPABASE_SERVICE_ROLE_KEY = resolveSecret(
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY_FILE"
);

// ─── Auth middleware (Supabase Bearer → res.locals.uid) ─────────────────────
export const requireAuth = makeRequireAuth(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Jitsi (vídeo) ──────────────────────────────────────────────────────────
// Domínio e app_id podem ser env simples (públicos); o secret do JWT é o único
// sensível e resolve via env OU Docker secret *_FILE (nunca exposto ao front).
export const JITSI_DOMAIN = (process.env.JITSI_DOMAIN || "").replace(/\/$/, "");
export const JITSI_APP_ID = process.env.JITSI_APP_ID || "";
export const JITSI_JWT_SECRET = resolveSecret("JITSI_JWT_SECRET", "JITSI_JWT_SECRET_FILE");

