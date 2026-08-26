/**
 * Testes de integração do que sobrou de estado no server.
 *
 * As suítes de /api/wa/* e /api/consulta/notificar saíram junto com o WhatsApp.
 * O resto da API tem cobertura em leadReceita.integration.test.ts.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
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

import { app } from "../../server/server";

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
  payload?: unknown,
  extraHeaders?: Record<string, string>
): Promise<{ status: number; body: Record<string, unknown> | null }> {
  return new Promise((resolve, reject) => {
    const bodyStr = payload !== undefined ? JSON.stringify(payload) : "";
    const { port } = srv.address() as AddressInfo;
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        method: "POST",
        path,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(Buffer.byteLength(bodyStr)),
          ...extraHeaders,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () =>
          resolve({
            status: res.statusCode!,
            body: data ? (JSON.parse(data) as Record<string, unknown>) : null,
          })
        );
      }
    );
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

describe("POST /api/auth/dev-login", () => {
  let srv: http.Server;
  beforeAll(async () => {
    srv = await startSrv(app as unknown as http.RequestListener);
  });
  afterAll(() => new Promise<void>((r) => srv.close(() => r())));

  it("NODE_ENV=production → 403 (a trava anti-backdoor)", async () => {
    const orig = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const res = await post(srv, "/api/auth/dev-login", { perfil: "paciente" });
      expect(res.status).toBe(403);
      expect(res.body?.error).toMatch(/produção/i);
    } finally {
      process.env.NODE_ENV = orig;
    }
  });

  it("perfil inexistente → 400", async () => {
    const res = await post(srv, "/api/auth/dev-login", { perfil: "superusuario" });
    expect(res.status).toBe(400);
    expect(res.body?.error).toMatch(/perfil inválido/i);
  });
});
