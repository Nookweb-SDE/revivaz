# WhatsApp OTP Login — Self-Contained Implementation Report

**Date:** 2026-06-23
**Branch:** worktree-agent-a06889d39ef61f454
**Status:** DONE — tsc 0 errors, 10/10 tests pass, build OK

---

## What changed

### `server/server.ts`

**Removed:**
- `/api/auth-sms-hook` route (required Supabase dashboard config + standardwebhooks PAT)
- `import { Webhook, WebhookVerificationError } from "standardwebhooks"`
- `SEND_SMS_HOOK_SECRET` constant

**Added:**
- `POST /api/wa/start` — generates 6-digit OTP, stores in in-memory Map (5 min TTL), sends via Evolution API; rate-limited to 3 requests per phone per 10 min; never logs the OTP
- `POST /api/wa/verify` — validates OTP (max 5 attempts), then:
  1. Finds or creates Supabase user via Admin API (`wa-<phone>@revivaz.app` synthetic email)
  2. Sets a 64-char random password (crypto.randomBytes)
  3. Signs in with password to get `{ access_token, refresh_token }`
  4. Best-effort: updates `profiles.telefone` via REST
  5. Returns tokens to client; never logs tokens
- `normalizePhone()` — strips non-digits, prepends "55" if no country code
- `isStartRateLimited()` — in-memory rate limiter per phone, 10-min window

**Unchanged:**
- `/api/acolhimento` (Gemini chat)
- Static file serving + SPA fallback
- `resolveSecret()` and `resolveGeminiKey()` helpers
- Docker secret support (`*_FILE` env vars)

### `src/conta/Login.tsx`

**Changed `WhatsAppLogin` component:**
- Step 1 (`handleSendCode`): now calls `POST /api/wa/start` instead of `supabase.auth.signInWithOtp`
- Step 2 (`handleVerifyCode`): now calls `POST /api/wa/verify`, gets `{ access_token, refresh_token }`, then calls `supabase.auth.setSession(...)` to inject the session
- Removed `phoneToE164()` helper (no longer needed)
- UI is unchanged — same two-step teal design

### `.env.example`

- Removed `SEND_SMS_HOOK_SECRET`
- Added `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` with comments
- Added `GEMINI_API_KEY`

---

## Architecture decisions

| Decision | Reason |
|---|---|
| In-memory Map for OTP | Single-replica server; no Redis dependency needed |
| 5-min OTP TTL | Balance security vs. UX on slow mobile connections |
| Max 5 verify attempts | Brute-force protection; deletes entry on limit |
| 3 starts / 10 min per phone | Prevents OTP spam and WA API abuse |
| Synthetic email `wa-<phone>@revivaz.app` | Supabase Auth doesn't natively support phone-only; email-based avoids dashboard phone auth config |
| `randomBytes(32).toString("hex")` password | 64-char hex = 256 bits of entropy; throwaway, never stored client-side |
| Best-effort profiles PATCH | Table may not have `telefone` column on all deploys; failure must not break login |

---

## New env vars required on the server

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>   # NEW — required
EVOLUTION_URL=https://evolution.izai.dev
EVOLUTION_INSTANCE=izai-studio
EVOLUTION_API_KEY=<key>
```

Docker secret variants: `SUPABASE_SERVICE_ROLE_KEY_FILE`, `SUPABASE_ANON_KEY_FILE`

---

## Verification

- `npx tsc --noEmit -p tsconfig.json` — 0 errors
- `npm test` — 10/10 tests pass (crisis, sampleData, types)
- `npm run build` — success (1577 modules, 198 kB JS)
