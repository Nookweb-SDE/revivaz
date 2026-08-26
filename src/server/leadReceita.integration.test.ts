/**
 * Integração das rotas novas: /api/lead (formulário público da landing) e
 * /api/receita/* (PDF e reenvio no WhatsApp).
 *
 * Mesma estratégia do server.integration.test.ts: env via vi.hoisted antes do
 * import, fetch global mockado, app em porta aleatória e requests por node:http.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";

vi.hoisted(() => {
  process.env.EVOLUTION_URL = "http://evolution.test";
  process.env.EVOLUTION_INSTANCE = "rev-test";
  process.env.EVOLUTION_API_KEY = "evo-key";
  process.env.SUPABASE_URL = "http://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "svc-role";
  process.env.SUPABASE_ANON_KEY = "anon-key";
  process.env.NODE_ENV = "test";
});

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { app, leadHits } from "../../server/server";

function startSrv(a: http.RequestListener): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const srv = http.createServer(a);
    srv.listen(0, "127.0.0.1", () => resolve(srv));
    srv.on("error", reject);
  });
}

function req(
  srv: http.Server,
  method: "GET" | "POST",
  path: string,
  payload?: unknown,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const bodyStr = payload !== undefined ? JSON.stringify(payload) : "";
    const { port } = srv.address() as AddressInfo;
    const r = http.request(
      {
        host: "127.0.0.1",
        port,
        method,
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
        res.on("end", () =>
          resolve({
            status: res.statusCode!,
            body: Buffer.concat(chunks).toString("binary"),
            headers: res.headers,
          })
        );
      }
    );
    r.on("error", reject);
    if (bodyStr) r.write(bodyStr);
    r.end();
  });
}

function mkRes(body: unknown, status = 200): Response {
  const s = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(s),
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const PACIENTE = "11111111-1111-4111-8111-111111111111";
const PROF_PROFILE = "22222222-2222-4222-8222-222222222222";
const OUTRO = "33333333-3333-4333-8333-333333333333";
const RECEITA = "44444444-4444-4444-8444-444444444444";
const PROF_ID = "55555555-5555-4555-8555-555555555555";

/** Roteia o fetch mockado pelas URLs que o server chama. */
function rotearSupabase(uidDoBearer: string) {
  mockFetch.mockImplementation((url: string) => {
    const u = String(url);
    // validação do Bearer (middleware requireAuth)
    if (u.includes("/auth/v1/user")) return Promise.resolve(mkRes({ id: uidDoBearer }));
    if (u.includes("/rest/v1/receitas"))
      return Promise.resolve(
        mkRes([
          {
            id: RECEITA,
            resumo: "Sertralina 50mg — 1 pela manhã",
            validade: "2026-12-01",
            created_at: "2026-08-26T12:00:00Z",
            paciente_id: PACIENTE,
            profissional_id: PROF_ID,
          },
        ])
      );
    if (u.includes("/rest/v1/profissionais"))
      return Promise.resolve(
        mkRes([
          { nome: "Dra. Ana", especialidade: "Psiquiatria", registro: "CRM 1", profile_id: PROF_PROFILE },
        ])
      );
    if (u.includes(`/rest/v1/profiles?id=eq.${PACIENTE}`))
      return Promise.resolve(mkRes([{ nome: "Maria", telefone: "11965119797" }]));
    if (u.includes("/rest/v1/profiles"))
      return Promise.resolve(mkRes([{ role: "paciente", nome: "Alguém" }]));
    if (u.includes("/rest/v1/leads"))
      return Promise.resolve(mkRes([{ id: "aaaaaaaa-0000-4000-8000-000000000000" }], 201));
    if (u.includes("/message/sendText/")) return Promise.resolve(mkRes({ ok: true }));
    return Promise.resolve(mkRes({}, 404));
  });
}

describe("POST /api/lead — formulário público da landing", () => {
  let srv: http.Server;
  beforeAll(async () => {
    srv = await startSrv(app as unknown as http.RequestListener);
  });
  afterAll(() => new Promise<void>((r) => srv.close(() => r())));
  beforeEach(() => {
    mockFetch.mockReset();
    leadHits.clear();
    rotearSupabase(PACIENTE);
  });

  it("grava o pedido e responde 201", async () => {
    const r = await req(srv, "POST", "/api/lead", {
      nome: "Maria Silva",
      telefone: "(11) 96511-9797",
      email: "maria@exemplo.com",
      especialidade: "psicologia",
      data: "2026-09-10",
      hora: "14:30",
    });
    expect(r.status).toBe(201);
    // gravou de verdade no banco (não é só tela)
    const chamadas = mockFetch.mock.calls.map((c) => String(c[0]));
    expect(chamadas.some((u) => u.includes("/rest/v1/leads"))).toBe(true);
  });

  it("recusa nome vazio", async () => {
    const r = await req(srv, "POST", "/api/lead", { nome: "", telefone: "11965119797" });
    expect(r.status).toBe(400);
    expect(mockFetch.mock.calls.some((c) => String(c[0]).includes("/rest/v1/leads"))).toBe(false);
  });

  it("recusa telefone inválido", async () => {
    const r = await req(srv, "POST", "/api/lead", { nome: "Maria", telefone: "123" });
    expect(r.status).toBe(400);
  });

  it("recusa e-mail malformado, mas aceita e-mail ausente", async () => {
    const ruim = await req(srv, "POST", "/api/lead", {
      nome: "Maria",
      telefone: "11965119797",
      email: "maria@",
    });
    expect(ruim.status).toBe(400);

    leadHits.clear();
    const semEmail = await req(srv, "POST", "/api/lead", {
      nome: "Maria",
      telefone: "11965119797",
    });
    expect(semEmail.status).toBe(201);
  });

  it("corta o spam: 6º pedido do mesmo IP na mesma hora leva 429", async () => {
    for (let i = 0; i < 5; i++) {
      const ok = await req(srv, "POST", "/api/lead", { nome: "Maria", telefone: "11965119797" });
      expect(ok.status).toBe(201);
    }
    const bloqueado = await req(srv, "POST", "/api/lead", {
      nome: "Maria",
      telefone: "11965119797",
    });
    expect(bloqueado.status).toBe(429);
  });

  it("se o banco recusar, responde erro — não finge sucesso", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes("/rest/v1/leads")) return Promise.resolve(mkRes({}, 500));
      return Promise.resolve(mkRes({}));
    });
    const r = await req(srv, "POST", "/api/lead", { nome: "Maria", telefone: "11965119797" });
    expect(r.status).toBe(500);
  });
});

describe("GET /api/receita/:id/pdf", () => {
  let srv: http.Server;
  beforeAll(async () => {
    srv = await startSrv(app as unknown as http.RequestListener);
  });
  afterAll(() => new Promise<void>((r) => srv.close(() => r())));
  beforeEach(() => mockFetch.mockReset());

  it("sem Bearer → 401", async () => {
    rotearSupabase(PACIENTE);
    const r = await req(srv, "GET", `/api/receita/${RECEITA}/pdf`);
    expect(r.status).toBe(401);
  });

  it("o paciente da receita recebe um PDF de verdade", async () => {
    rotearSupabase(PACIENTE);
    const r = await req(srv, "GET", `/api/receita/${RECEITA}/pdf`, undefined, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(200);
    expect(r.headers["content-type"]).toContain("application/pdf");
    expect(r.body.slice(0, 5)).toBe("%PDF-");
    expect(r.headers["cache-control"]).toContain("no-store");
  });

  it("o profissional que emitiu também recebe", async () => {
    rotearSupabase(PROF_PROFILE);
    const r = await req(srv, "GET", `/api/receita/${RECEITA}/pdf`, undefined, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(200);
    expect(r.body.slice(0, 5)).toBe("%PDF-");
  });

  it("um terceiro logado leva 403 — receita alheia não vaza", async () => {
    rotearSupabase(OUTRO);
    const r = await req(srv, "GET", `/api/receita/${RECEITA}/pdf`, undefined, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(403);
  });

  it("id fora do formato → 400 (não chega a consultar o banco)", async () => {
    rotearSupabase(PACIENTE);
    const r = await req(srv, "GET", "/api/receita/nao-e-uuid/pdf", undefined, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(400);
  });
});

describe("POST /api/receita/whatsapp", () => {
  let srv: http.Server;
  beforeAll(async () => {
    srv = await startSrv(app as unknown as http.RequestListener);
  });
  afterAll(() => new Promise<void>((r) => srv.close(() => r())));
  beforeEach(() => mockFetch.mockReset());

  it("envia para o paciente e responde ok", async () => {
    rotearSupabase(PACIENTE);
    const r = await req(srv, "POST", "/api/receita/whatsapp", { receita_id: RECEITA }, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(200);
    expect(JSON.parse(r.body)).toEqual({ ok: true });
    expect(mockFetch.mock.calls.some((c) => String(c[0]).includes("/message/sendText/"))).toBe(true);
  });

  it("terceiro logado leva 403", async () => {
    rotearSupabase(OUTRO);
    const r = await req(srv, "POST", "/api/receita/whatsapp", { receita_id: RECEITA }, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(403);
  });

  it("paciente sem telefone: responde ok:false com o motivo, não 'enviado'", async () => {
    mockFetch.mockImplementation((url: string) => {
      const u = String(url);
      if (u.includes("/auth/v1/user")) return Promise.resolve(mkRes({ id: PACIENTE }));
      if (u.includes("/rest/v1/receitas"))
        return Promise.resolve(
          mkRes([
            {
              id: RECEITA,
              resumo: "x",
              validade: null,
              created_at: "2026-08-26T12:00:00Z",
              paciente_id: PACIENTE,
              profissional_id: null,
            },
          ])
        );
      if (u.includes(`/rest/v1/profiles?id=eq.${PACIENTE}`))
        return Promise.resolve(mkRes([{ nome: "Maria", telefone: null }]));
      if (u.includes("/rest/v1/profiles")) return Promise.resolve(mkRes([{ role: "paciente" }]));
      return Promise.resolve(mkRes({}));
    });
    const r = await req(srv, "POST", "/api/receita/whatsapp", { receita_id: RECEITA }, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(200);
    expect(JSON.parse(r.body)).toMatchObject({ ok: false, skipped: "sem telefone no cadastro" });
  });
});
