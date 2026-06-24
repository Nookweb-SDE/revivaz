import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { mintJitsiJwt } from "./jitsiJwt";

// base64url -> JSON (mesma codificação do mint: '-'/'_' e sem padding)
function decodeSegment(seg: string): any {
  const b64 = seg.replace(/-/g, "+").replace(/_/g, "/");
  const json = Buffer.from(b64, "base64").toString("utf8");
  return JSON.parse(json);
}

function b64urlFromBuffer(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const BASE = {
  secret: "super-secret-shhh",
  appId: "revivaz",
  domain: "meet.revivaz.com.br",
  room: "consulta-abc-123",
  userId: "user-uuid-1",
  userName: "Maria Paciente",
  moderator: false,
  nowSec: 1_700_000_000,
};

describe("mintJitsiJwt", () => {
  it("retorna um JWT com 3 partes base64url separadas por ponto", () => {
    const jwt = mintJitsiJwt(BASE);
    const parts = jwt.split(".");
    expect(parts).toHaveLength(3);
    // base64url: só [A-Za-z0-9_-], sem '+', '/' ou '=' (padding)
    for (const p of parts) {
      expect(p.length).toBeGreaterThan(0);
      expect(p).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("o header declara alg HS256 e typ JWT", () => {
    const jwt = mintJitsiJwt(BASE);
    const header = decodeSegment(jwt.split(".")[0]);
    expect(header.alg).toBe("HS256");
    expect(header.typ).toBe("JWT");
  });

  it("o payload tem aud/iss = appId e sub = domain", () => {
    const jwt = mintJitsiJwt(BASE);
    const payload = decodeSegment(jwt.split(".")[1]);
    expect(payload.aud).toBe(BASE.appId);
    expect(payload.iss).toBe(BASE.appId);
    expect(payload.sub).toBe(BASE.domain);
  });

  it("o payload carrega a sala (room) recebida", () => {
    const jwt = mintJitsiJwt(BASE);
    const payload = decodeSegment(jwt.split(".")[1]);
    expect(payload.room).toBe(BASE.room);
  });

  it("iat = nowSec e exp = iat + ttl padrão (7200)", () => {
    const jwt = mintJitsiJwt(BASE);
    const payload = decodeSegment(jwt.split(".")[1]);
    expect(payload.iat).toBe(BASE.nowSec);
    expect(payload.exp).toBe(BASE.nowSec + 7200);
  });

  it("respeita ttlSec customizado (exp = iat + ttlSec)", () => {
    const jwt = mintJitsiJwt({ ...BASE, ttlSec: 600 });
    const payload = decodeSegment(jwt.split(".")[1]);
    expect(payload.exp).toBe(BASE.nowSec + 600);
  });

  it("propaga moderator true para o profissional em context.user.moderator", () => {
    const jwt = mintJitsiJwt({ ...BASE, moderator: true });
    const payload = decodeSegment(jwt.split(".")[1]);
    // É daqui que o prosody do Jitsi lê o moderador (não da claim de topo).
    expect(payload.context.user.moderator).toBe(true);
    // redundância de topo mantida
    expect(payload.moderator).toBe(true);
  });

  it("propaga moderator false para o paciente em context.user.moderator", () => {
    const jwt = mintJitsiJwt({ ...BASE, moderator: false });
    const payload = decodeSegment(jwt.split(".")[1]);
    expect(payload.context.user.moderator).toBe(false);
    expect(payload.moderator).toBe(false);
  });

  it("inclui context.user com id e name", () => {
    const jwt = mintJitsiJwt(BASE);
    const payload = decodeSegment(jwt.split(".")[1]);
    expect(payload.context).toBeDefined();
    expect(payload.context.user).toBeDefined();
    expect(payload.context.user.id).toBe(BASE.userId);
    expect(payload.context.user.name).toBe(BASE.userName);
  });

  it("a assinatura HMAC-SHA256 confere ao recalcular com a mesma secret", () => {
    const jwt = mintJitsiJwt(BASE);
    const [h, p, sig] = jwt.split(".");
    const expected = b64urlFromBuffer(
      createHmac("sha256", BASE.secret).update(`${h}.${p}`).digest()
    );
    expect(sig).toBe(expected);
  });

  it("a assinatura NÃO confere com uma secret diferente (não é falsificável)", () => {
    const jwt = mintJitsiJwt(BASE);
    const [h, p, sig] = jwt.split(".");
    const wrong = b64urlFromBuffer(
      createHmac("sha256", "outra-secret").update(`${h}.${p}`).digest()
    );
    expect(sig).not.toBe(wrong);
  });

  it("é determinístico: mesmo input (nowSec fixo) -> mesmo token", () => {
    expect(mintJitsiJwt(BASE)).toBe(mintJitsiJwt(BASE));
  });

  it("salas diferentes produzem tokens diferentes", () => {
    const a = mintJitsiJwt(BASE);
    const b = mintJitsiJwt({ ...BASE, room: "consulta-outra" });
    expect(a).not.toBe(b);
  });
});
