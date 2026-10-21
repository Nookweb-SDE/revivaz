/**
 * Integração de /api/auth/acesso: gera o link pelo admin do GoTrue (sem o
 * GoTrue mandar e-mail) e manda pelo SMTP da Revivaz.
 *
 * Mesma estratégia do server.integration.test.ts: env via vi.hoisted antes do
 * import, fetch global mockado, app em porta aleatória e requests por node:http.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";

vi.hoisted(() => {
  process.env.SUPABASE_URL = "http://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "svc-role";
  process.env.SUPABASE_ANON_KEY = "anon-key";
  process.env.NODE_ENV = "test";
});

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const enviarEmail = vi.fn();
vi.mock("../../server/lib/email", () => ({ enviarEmail: (...a: unknown[]) => enviarEmail(...a) }));

import { app } from "../../server/server";
import { acessoHits } from "../../server/lib/limitadores";

function startSrv(a: http.RequestListener): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const srv = http.createServer(a);
    srv.listen(0, "127.0.0.1", () => resolve(srv));
    srv.on("error", reject);
  });
}

function post(
  srv: http.Server,
  path: string,
  payload: unknown,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(payload);
    const { port } = srv.address() as AddressInfo;
    const r = http.request(
      {
        host: "127.0.0.1",
        port,
        method: "POST",
        path,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(Buffer.byteLength(bodyStr)),
          ...headers,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode!, body: Buffer.concat(chunks).toString() }));
      }
    );
    r.on("error", reject);
    r.write(bodyStr);
    r.end();
  });
}

function mkRes(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const LINK = { email_otp: "482913", hashed_token: "hash123", verification_type: "magiclink" };

let srv: http.Server;
beforeAll(async () => {
  srv = await startSrv(app);
});
afterAll(() => new Promise<void>((r) => srv.close(() => r())));
beforeEach(() => {
  mockFetch.mockReset();
  enviarEmail.mockReset();
  enviarEmail.mockResolvedValue({ ok: true });
  acessoHits.ip.clear();
  acessoHits.email.clear();
});

describe("POST /api/auth/acesso", () => {
  it("conta existente: gera o link e manda e-mail com link + senha temporária", async () => {
    mockFetch.mockResolvedValueOnce(mkRes(LINK));
    const r = await post(srv, "/api/auth/acesso", { email: "Ana@Exemplo.com", volta: "/conta" }, { origin: "https://revivaz.com.br" });
    expect(r.status).toBe(200);
    expect(JSON.parse(r.body)).toEqual({ ok: true });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("http://supabase.test/auth/v1/admin/generate_link");
    expect(JSON.parse(init.body)).toEqual({ type: "magiclink", email: "ana@exemplo.com" });

    const msg = enviarEmail.mock.calls[0][0];
    expect(msg.para).toBe("ana@exemplo.com");
    expect(msg.texto).toContain("https://revivaz.com.br/conta?token_hash=hash123&type=magiclink");
    expect(msg.html).toContain("482 913");
  });

  it("conta nova: cria o usuário e pede o link de novo; resposta igual", async () => {
    mockFetch
      .mockResolvedValueOnce(mkRes({ msg: "User not found" }, 404))
      .mockResolvedValueOnce(mkRes({ id: "u1" }))
      .mockResolvedValueOnce(mkRes({ properties: LINK }));
    const r = await post(srv, "/api/auth/acesso", { email: "novo@exemplo.com" });
    expect(r.status).toBe(200);
    expect(JSON.parse(r.body)).toEqual({ ok: true });
    expect(mockFetch.mock.calls[1][0]).toBe("http://supabase.test/auth/v1/admin/users");
    expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({ email: "novo@exemplo.com", email_confirm: true });
  });

  it("origem estranha não vira link: cai no site", async () => {
    mockFetch.mockResolvedValueOnce(mkRes(LINK));
    await post(srv, "/api/auth/acesso", { email: "ana@exemplo.com" }, { origin: "https://golpe.example" });
    expect(enviarEmail.mock.calls[0][0].texto).toContain("https://revivaz.com.br/conta?");
  });

  it("e-mail inválido: 400 sem chamar o GoTrue", async () => {
    const r = await post(srv, "/api/auth/acesso", { email: "nao-e-email" });
    expect(r.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("4º pedido do mesmo e-mail em 15 min: 429", async () => {
    mockFetch.mockResolvedValue(mkRes(LINK));
    for (let i = 0; i < 3; i++) {
      expect((await post(srv, "/api/auth/acesso", { email: "ana@exemplo.com" })).status).toBe(200);
    }
    expect((await post(srv, "/api/auth/acesso", { email: "ana@exemplo.com" })).status).toBe(429);
  });

  it("SMTP falhou: 503, não finge que mandou", async () => {
    mockFetch.mockResolvedValueOnce(mkRes(LINK));
    enviarEmail.mockResolvedValueOnce({ ok: false });
    expect((await post(srv, "/api/auth/acesso", { email: "ana@exemplo.com" })).status).toBe(503);
  });
});

describe("POST /api/auth/criar-senha", () => {
  it("sem login: 401", async () => {
    const r = await post(srv, "/api/auth/criar-senha", { senha: "12345678" });
    expect(r.status).toBe(401);
  });
});
