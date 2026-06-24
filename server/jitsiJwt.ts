// JWT Jitsi (prosody token) — HS256 puro com 'crypto' do Node (createHmac).
// Sem dependência externa. Função determinística: nowSec é injetado p/ teste.
//
// O payload segue o formato esperado pelo módulo prosody `token_verification`
// do Jitsi: aud/iss = app_id, sub = domínio, room restringe a sala,
// context.user identifica o usuário e `moderator` marca quem é moderador.
import { createHmac } from "crypto";

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function mintJitsiJwt(opts: {
  secret: string;
  appId: string;
  domain: string;
  room: string;
  userId: string;
  userName: string;
  moderator: boolean;
  nowSec: number;
  ttlSec?: number;
}): string {
  const ttl = opts.ttlSec ?? 7200; // 2h por padrão (exp curto)

  const header = { alg: "HS256", typ: "JWT" };

  const payload = {
    aud: opts.appId,
    iss: opts.appId,
    sub: opts.domain,
    room: opts.room,
    iat: opts.nowSec,
    exp: opts.nowSec + ttl,
    // ⚠️ O Jitsi (mod_auth_token / mod_token_verification, imagens jitsi/prosody
    // stable-9646) decide quem é moderador por `context.user.moderator`, NÃO por
    // uma claim `moderator` de topo. A flag PRECISA estar dentro de context.user
    // ou o profissional entra como participante comum (sem mute/kick/lobby).
    // Mantemos também a de topo por redundância — algumas libs a inspecionam.
    moderator: opts.moderator,
    context: {
      user: {
        id: opts.userId,
        name: opts.userName,
        moderator: opts.moderator,
      },
    },
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = base64url(
    createHmac("sha256", opts.secret).update(signingInput).digest()
  );

  return `${signingInput}.${signature}`;
}
