/**
 * Testes de integração dos endpoints críticos do server Express.
 *
 * Estratégia:
 *  - vi.hoisted() seta as variáveis de ambiente ANTES do módulo server ser
 *    importado (as constantes EVOLUTION_URL, SUPABASE_URL, etc. são lidas
 *    no escopo do módulo, então precisam existir na hora do import).
 *  - vi.stubGlobal("fetch", mockFetch) intercepta todas as chamadas HTTP
 *    que o server faz para a Evolution API e o Supabase.
 *  - http.createServer(app) + server.listen(0) sobe a app em porta aleatória;
 *    os requests de teste usam http.request() (não fetch) para não colidir
 *    com o mock global.
 *  - otpStore e startRateMap exportados permitem manipular estado in-memory
 *    diretamente nos testes.
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";

// ─── Env setup – DEVE rodar antes de qualquer import do server ───────────────
// vi.hoisted garante execução antes dos imports estáticos abaixo.
vi.hoisted(() => {
  process.env.EVOLUTION_URL = "http://evolution.test";
  process.env.EVOLUTION_INSTANCE = "rev-test";
  process.env.EVOLUTION_API_KEY = "evo-key";
  process.env.SUPABASE_URL = "http://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "svc-role";
  process.env.SUPABASE_ANON_KEY = "anon-key";
  process.env.NODE_ENV = "test";
});

// ─── Mock global de fetch (intercepta chamadas internas do server) ──────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─── Import do server (lê as env vars já definidas acima) ───────────────────
import { app, otpStore, startRateMap } from "../../server/server";

// ─── Helpers ────────────────────────────────────────────────────────────────

function startSrv(expressApp: http.RequestListener): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const srv = http.createServer(expressApp);
    srv.listen(0, "127.0.0.1", () => resolve(srv));
    srv.on("error", reject);
  });
}

function closeSrv(srv: http.Server): Promise<void> {
  return new Promise((resolve, reject) =>
    srv.close((e) => (e ? reject(e) : resolve()))
  );
}

type ReqResult = { status: number; body: Record<string, unknown> | null };

/** Faz um POST usando node:http (não usa o fetch global, que está mockado). */
function post(
  srv: http.Server,
  path: string,
  payload?: unknown,
  extraHeaders?: Record<string, string>
): Promise<ReqResult> {
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

/**
 * Cria um objeto parecido com Response para o mockFetch retornar.
 * O server verifica apenas .ok, .status, .text() e .json().
 */
function mkRes(body: unknown, status = 200): Response {
  const bodyStr = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(bodyStr),
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

// ─── Suite principal (Evolution + Supabase configurados) ─────────────────────
describe("server integration — configurado", () => {
  let srv: http.Server;

  beforeAll(async () => {
    srv = await startSrv(app as unknown as http.RequestListener);
  });

  afterAll(async () => {
    await closeSrv(srv);
  });

  beforeEach(() => {
    mockFetch.mockReset();
    otpStore.clear();
    startRateMap.clear();
  });

  // ── POST /api/wa/start ────────────────────────────────────────────────────
  describe("POST /api/wa/start", () => {
    it("sem telefone no body → 400", async () => {
      const res = await post(srv, "/api/wa/start", {});
      expect(res.status).toBe(400);
      expect(res.body?.error).toMatch(/obrigatório/i);
    });

    it("telefone com dígitos insuficientes após normalização → 400", async () => {
      // "123" → "55123" → 5 chars < 12 → inválido
      const res = await post(srv, "/api/wa/start", { phone: "123" });
      expect(res.status).toBe(400);
      expect(res.body?.error).toMatch(/inválido/i);
    });

    it("4ª chamada com o mesmo telefone dentro da janela → 429", async () => {
      // Evolution responde ok para as 3 primeiras
      mockFetch.mockResolvedValue(mkRes({ messageId: "ev-ok" }));

      const phone = "11987654321";
      await post(srv, "/api/wa/start", { phone });
      await post(srv, "/api/wa/start", { phone });
      await post(srv, "/api/wa/start", { phone });

      // 4ª chamada não deve nem chegar à Evolution
      mockFetch.mockReset();
      const res = await post(srv, "/api/wa/start", { phone });

      expect(res.status).toBe(429);
      expect(res.body?.error).toMatch(/aguarde/i);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ── POST /api/wa/verify ───────────────────────────────────────────────────
  describe("POST /api/wa/verify", () => {
    // Telefone normalizado que o server usará como chave no otpStore
    const storedPhone = "5511987654321";

    it("código expirado → 401", async () => {
      otpStore.set(storedPhone, {
        code: "123456",
        attempts: 0,
        expiresAt: Date.now() - 1_000, // já expirou
      });

      const res = await post(srv, "/api/wa/verify", {
        phone: "11987654321",
        code: "123456",
      });

      expect(res.status).toBe(401);
      expect(res.body?.error).toMatch(/expirado/i);
    });

    it("código errado 3× → 401 (locked)", async () => {
      otpStore.set(storedPhone, {
        code: "999999",
        attempts: 0,
        expiresAt: Date.now() + 5 * 60_000,
      });

      await post(srv, "/api/wa/verify", { phone: "11987654321", code: "000001" });
      await post(srv, "/api/wa/verify", { phone: "11987654321", code: "000002" });
      const res = await post(srv, "/api/wa/verify", {
        phone: "11987654321",
        code: "000003",
      });

      expect(res.status).toBe(401);
      expect(res.body?.error).toMatch(/tentativas/i);
    });

    it("código correto → 200 com access_token e refresh_token", async () => {
      const code = "777777";
      const syntheticEmail = `wa-${storedPhone}@revivaz.app`;

      otpStore.set(storedPhone, {
        code,
        attempts: 0,
        expiresAt: Date.now() + 5 * 60_000,
      });

      // (1) listar usuários Supabase → usuário já existe
      mockFetch
        .mockResolvedValueOnce(
          mkRes({ users: [{ id: "uid-1", email: syntheticEmail }] })
        )
        // (2) PUT senha temporária
        .mockResolvedValueOnce(mkRes({ id: "uid-1" }))
        // (3) token de sessão
        .mockResolvedValueOnce(
          mkRes({ access_token: "tok-abc", refresh_token: "ref-xyz" })
        )
        // (4) PATCH profiles (best-effort, pode ignorar erro)
        .mockResolvedValueOnce(mkRes(null, 204));

      const res = await post(srv, "/api/wa/verify", {
        phone: "11987654321",
        code,
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        access_token: "tok-abc",
        refresh_token: "ref-xyz",
      });
    });
  });

  // ── POST /api/auth/dev-login ──────────────────────────────────────────────
  describe("POST /api/auth/dev-login", () => {
    it("NODE_ENV=production → 403", async () => {
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
      const res = await post(srv, "/api/auth/dev-login", {
        perfil: "superusuario",
      });
      expect(res.status).toBe(400);
      expect(res.body?.error).toMatch(/perfil inválido/i);
    });
  });

  // ── POST /api/consulta/notificar ──────────────────────────────────────────
  describe("POST /api/consulta/notificar", () => {
    it("sem header Authorization → 401", async () => {
      const res = await post(srv, "/api/consulta/notificar", {
        consulta_id: "cns-1",
      });
      expect(res.status).toBe(401);
      expect(res.body?.error).toMatch(/autenticado/i);
    });

    it("paciente sem telefone cadastrado → 200 {ok:false, skipped:'sem telefone'}", async () => {
      // (1) validar Bearer → retorna caller-uid
      mockFetch
        .mockResolvedValueOnce(mkRes({ id: "caller-uid" }))
        // (2) carregar consulta
        .mockResolvedValueOnce(
          mkRes([
            {
              id: "cns-1",
              paciente_id: "pac-uid",
              profissional_id: "prof-id",
              data: "2026-07-10",
              hora: "14:00",
              tipo: "online",
              status: "agendada",
              link_ou_local: null,
            },
          ])
        )
        // (3) checar role do caller → admin
        .mockResolvedValueOnce(mkRes([{ role: "admin" }]))
        // (4) perfil do paciente → sem telefone
        .mockResolvedValueOnce(mkRes([{ nome: "João", telefone: null }]));

      const res = await post(
        srv,
        "/api/consulta/notificar",
        { consulta_id: "cns-1" },
        { Authorization: "Bearer valid-token" }
      );

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ ok: false, skipped: "sem telefone" });
    });
  });
});

// ─── Suite separada: Evolution NÃO configurada ───────────────────────────────
// Usa vi.resetModules() + import() dinâmico para obter uma instância do server
// com EVOLUTION_URL vazia (lida em tempo de inicialização do módulo).
describe("POST /api/wa/start — Evolution não configurada → 500", () => {
  let unconfiguredSrv: http.Server;

  beforeAll(async () => {
    mockFetch.mockReset(); // limpa histórico de chamadas das suites anteriores

    // Salva e limpa vars da Evolution antes de reimportar o módulo
    const saved = {
      EVOLUTION_URL: process.env.EVOLUTION_URL,
      EVOLUTION_INSTANCE: process.env.EVOLUTION_INSTANCE,
      EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY,
    };
    delete process.env.EVOLUTION_URL;
    delete process.env.EVOLUTION_INSTANCE;
    delete process.env.EVOLUTION_API_KEY;

    vi.resetModules();
    const mod = await import("../../server/server");
    unconfiguredSrv = await startSrv(
      (mod as unknown as { app: http.RequestListener }).app
    );

    // Restaura imediatamente para não vazar para outras suites
    process.env.EVOLUTION_URL = saved.EVOLUTION_URL;
    process.env.EVOLUTION_INSTANCE = saved.EVOLUTION_INSTANCE;
    process.env.EVOLUTION_API_KEY = saved.EVOLUTION_API_KEY;
  });

  afterAll(async () => {
    await closeSrv(unconfiguredSrv);
    vi.resetModules(); // limpa o cache do módulo sem-evolution
  });

  it("telefone válido mas Evolution ausente → 500 WhatsApp not configured", async () => {
    const res = await post(unconfiguredSrv, "/api/wa/start", {
      phone: "11987654321",
    });
    expect(res.status).toBe(500);
    expect(res.body?.error).toMatch(/not configured/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
