/**
 * Integração da candidatura. Mesma estratégia do leadReceita.integration.test.ts:
 * env por vi.hoisted antes do import, fetch global mockado, app em porta
 * aleatória e requests por node:http.
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

import { app } from "../../server/server";

const CANDIDATO = "11111111-1111-4111-8111-111111111111";

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
): Promise<{ status: number; body: string }> {
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
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode!, body: data }));
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

function rotear(uid: string) {
  mockFetch.mockImplementation((url: string) => {
    const u = String(url);
    if (u.includes("/auth/v1/user")) return Promise.resolve(mkRes({ id: uid }));
    if (u.includes("/rest/v1/candidaturas"))
      return Promise.resolve(mkRes([{ id: "cand-1" }], 201));
    return Promise.resolve(mkRes({}));
  });
}

const VALIDA = {
  nome_completo: "Maria da Silva",
  cpf: "529.982.247-25",
  telefone: "11965119797",
  conselho: "CRP",
  registro: "06/12345",
  especialidade: "psicologia",
  aceite_termo: true,
};

describe("POST /api/candidatura", () => {
  let srv: http.Server;
  beforeAll(async () => {
    srv = await startSrv(app as unknown as http.RequestListener);
  });
  afterAll(() => new Promise<void>((r) => srv.close(() => r())));
  beforeEach(() => mockFetch.mockReset());

  it("sem Bearer → 401", async () => {
    rotear(CANDIDATO);
    const r = await req(srv, "POST", "/api/candidatura", VALIDA);
    expect(r.status).toBe(401);
  });

  it("logado e válido → 201 e grava", async () => {
    rotear(CANDIDATO);
    const r = await req(srv, "POST", "/api/candidatura", VALIDA, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(201);
    expect(mockFetch.mock.calls.some((c) => String(c[0]).includes("/rest/v1/candidaturas"))).toBe(true);
  });

  it("CPF inválido → 400 e não grava", async () => {
    rotear(CANDIDATO);
    const r = await req(srv, "POST", "/api/candidatura", { ...VALIDA, cpf: "111.111.111-11" }, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(400);
    expect(mockFetch.mock.calls.some((c) => String(c[0]).includes("/rest/v1/candidaturas"))).toBe(false);
  });

  it("especialidade fora do catálogo → 400", async () => {
    rotear(CANDIDATO);
    const r = await req(srv, "POST", "/api/candidatura", { ...VALIDA, especialidade: "cartomancia" }, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(400);
  });

  it("registro em branco → 400", async () => {
    rotear(CANDIDATO);
    const r = await req(srv, "POST", "/api/candidatura", { ...VALIDA, registro: "" }, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(400);
  });

  it("sem aceitar o termo → 400", async () => {
    rotear(CANDIDATO);
    const r = await req(srv, "POST", "/api/candidatura", { ...VALIDA, aceite_termo: false }, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(400);
  });

  it("grava o aceite com versão e IP, e o profile_id vem do token e não do corpo", async () => {
    rotear(CANDIDATO);
    await req(
      srv,
      "POST",
      "/api/candidatura",
      { ...VALIDA, profile_id: "22222222-2222-4222-8222-222222222222" },
      { Authorization: "Bearer tok" }
    );
    const chamada = mockFetch.mock.calls.find((c) => String(c[0]).includes("/rest/v1/candidaturas"));
    const enviado = JSON.parse(String((chamada![1] as RequestInit).body));
    expect(enviado.profile_id).toBe(CANDIDATO);
    expect(enviado.termo_versao).toBeTruthy();
    expect(enviado.termo_aceito_em).toBeTruthy();
    expect(enviado.termo_aceito_ip).toBeTruthy();
    expect(enviado.status).toBe("recebida");
  });

  it("o CPF é gravado só com dígitos", async () => {
    rotear(CANDIDATO);
    await req(srv, "POST", "/api/candidatura", VALIDA, { Authorization: "Bearer tok" });
    const chamada = mockFetch.mock.calls.find((c) => String(c[0]).includes("/rest/v1/candidaturas"));
    const enviado = JSON.parse(String((chamada![1] as RequestInit).body));
    expect(enviado.cpf).toBe("52998224725");
  });
});

const ADMIN = "33333333-3333-4333-8333-333333333333";
const CAND_ID = "44444444-4444-4444-8444-444444444444";

/** Roteia como admin, com uma candidatura em análise já pronta. */
function roteiaAdmin(status = "em_analise") {
  mockFetch.mockImplementation((url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes("/auth/v1/user")) return Promise.resolve(mkRes({ id: ADMIN }));
    if (u.includes("/rest/v1/revivaz_users")) return Promise.resolve(mkRes([{ role: "admin" }]));
    if (u.includes("/rest/v1/candidaturas") && (!init || init.method === "GET" || !init.method))
      return Promise.resolve(
        mkRes([
          {
            id: CAND_ID,
            profile_id: CANDIDATO,
            nome_completo: "Maria da Silva",
            especialidade: "psicologia",
            registro: "06/12345",
            conselho: "CRP",
            bio: null,
            cpf: "52998224725",
            cnpj: null,
            status,
          },
        ])
      );
    if (u.includes("/rest/v1/profissionais")) return Promise.resolve(mkRes([{ id: "prof-1" }], 201));
    return Promise.resolve(mkRes([{}]));
  });
}

describe("POST /api/admin/candidatura/:id/decidir", () => {
  let srv: http.Server;
  beforeAll(async () => {
    srv = await startSrv(app as unknown as http.RequestListener);
  });
  afterAll(() => new Promise<void>((r) => srv.close(() => r())));
  beforeEach(() => mockFetch.mockReset());

  it("sem Bearer → 401", async () => {
    roteiaAdmin();
    const r = await req(srv, "POST", `/api/admin/candidatura/${CAND_ID}/decidir`, { acao: "aprovar" });
    expect(r.status).toBe(401);
  });

  it("logado mas não admin → 403", async () => {
    mockFetch.mockImplementation((url: string) => {
      const u = String(url);
      if (u.includes("/auth/v1/user")) return Promise.resolve(mkRes({ id: CANDIDATO }));
      if (u.includes("/rest/v1/revivaz_users")) return Promise.resolve(mkRes([{ role: "paciente" }]));
      return Promise.resolve(mkRes([{}]));
    });
    const r = await req(srv, "POST", `/api/admin/candidatura/${CAND_ID}/decidir`, { acao: "aprovar" }, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(403);
  });

  it("aprovar promove: cria em profissionais e muda o papel", async () => {
    roteiaAdmin("em_analise");
    const r = await req(srv, "POST", `/api/admin/candidatura/${CAND_ID}/decidir`, { acao: "aprovar" }, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(200);
    const urls = mockFetch.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes("/rest/v1/profissionais"))).toBe(true);
    const patchProfile = mockFetch.mock.calls.find(
      (c) => String(c[0]).includes("/rest/v1/revivaz_users") && (c[1] as RequestInit)?.method === "PATCH"
    );
    expect(JSON.parse(String((patchProfile![1] as RequestInit).body))).toMatchObject({
      role: "profissional",
    });
  });

  it("aprovar de novo não cria segundo profissional — transição inválida", async () => {
    roteiaAdmin("aprovada");
    const r = await req(srv, "POST", `/api/admin/candidatura/${CAND_ID}/decidir`, { acao: "aprovar" }, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(409);
    expect(mockFetch.mock.calls.some((c) => String(c[0]).includes("/rest/v1/profissionais"))).toBe(false);
  });

  it("recusar sem motivo → 400", async () => {
    roteiaAdmin("em_analise");
    const r = await req(srv, "POST", `/api/admin/candidatura/${CAND_ID}/decidir`, { acao: "recusar" }, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(400);
  });

  it("pendência com motivo → 200 e NÃO cria profissional", async () => {
    roteiaAdmin("em_analise");
    const r = await req(
      srv,
      "POST",
      `/api/admin/candidatura/${CAND_ID}/decidir`,
      { acao: "pendencia", motivo: "Faltou a UF do conselho." },
      { Authorization: "Bearer tok" }
    );
    expect(r.status).toBe(200);
    expect(mockFetch.mock.calls.some((c) => String(c[0]).includes("/rest/v1/profissionais"))).toBe(false);
  });

  it("ação desconhecida → 400", async () => {
    roteiaAdmin("em_analise");
    const r = await req(srv, "POST", `/api/admin/candidatura/${CAND_ID}/decidir`, { acao: "banir" }, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(400);
  });
});

describe("POST /api/admin/candidatura/:id/verificar", () => {
  let srv: http.Server;
  beforeAll(async () => {
    srv = await startSrv(app as unknown as http.RequestListener);
  });
  afterAll(() => new Promise<void>((r) => srv.close(() => r())));
  beforeEach(() => mockFetch.mockReset());

  it("não admin → 403", async () => {
    mockFetch.mockImplementation((url: string) => {
      const u = String(url);
      if (u.includes("/auth/v1/user")) return Promise.resolve(mkRes({ id: CANDIDATO }));
      if (u.includes("/rest/v1/revivaz_users")) return Promise.resolve(mkRes([{ role: "paciente" }]));
      return Promise.resolve(mkRes([{}]));
    });
    const r = await req(srv, "POST", `/api/admin/candidatura/${CAND_ID}/verificar`, {}, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(403);
  });

  it("admin com fornecedor desligado → 200 com configurado:false, e a fila não trava", async () => {
    roteiaAdmin("em_analise");
    const r = await req(srv, "POST", `/api/admin/candidatura/${CAND_ID}/verificar`, {}, {
      Authorization: "Bearer tok",
    });
    expect(r.status).toBe(200);
    expect(JSON.parse(r.body).verificacao.configurado).toBe(false);
  });
});
