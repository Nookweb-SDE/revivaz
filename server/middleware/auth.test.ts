/**
 * Teste do portão de autenticação. É o ponto onde "quem é você?" é decidido —
 * um furo aqui abre TODAS as rotas privadas (receita, sala de vídeo, admin).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { makeRequireAuth, getCallerUid } from "./auth";

const URL_SB = "http://supabase.test";
const ANON = "anon-key";
const UID = "11111111-1111-4111-8111-111111111111";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mkReq(authorization?: string): Request {
  return { headers: authorization ? { authorization } : {} } as unknown as Request;
}

function mkRes() {
  const res = {
    locals: {} as Record<string, unknown>,
    statusCode: 0,
    payload: null as unknown,
    status(c: number) {
      this.statusCode = c;
      return this;
    },
    json(b: unknown) {
      this.payload = b;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; payload: unknown };
}

function okUser(id: string | undefined) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(id === undefined ? {} : { id }),
  } as unknown as Response;
}

const naoAutorizado = { ok: false, status: 401, json: () => Promise.resolve({}) } as unknown as Response;

/** Resposta que estoura na leitura — simula falha de comunicação com o Supabase. */
const respostaIlegivel = {
  ok: true,
  status: 200,
  json: () => {
    throw new Error("resposta ilegível");
  },
} as unknown as Response;

describe("makeRequireAuth", () => {
  beforeEach(() => mockFetch.mockReset());

  it("token válido: passa adiante e publica o uid em res.locals", async () => {
    mockFetch.mockResolvedValue(okUser(UID));
    const next = vi.fn() as unknown as NextFunction;
    const res = mkRes();
    await makeRequireAuth(URL_SB, ANON)(mkReq("Bearer tok"), res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.locals.uid).toBe(UID);
  });

  it("aceita 'bearer' minúsculo — header é case-insensitive", async () => {
    mockFetch.mockResolvedValue(okUser(UID));
    const next = vi.fn() as unknown as NextFunction;
    const res = mkRes();
    await makeRequireAuth(URL_SB, ANON)(mkReq("bearer tok"), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("sem header Authorization → 401 e NÃO segue", async () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = mkRes();
    await makeRequireAuth(URL_SB, ANON)(mkReq(), res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("esquema errado (Basic) → 401", async () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = mkRes();
    await makeRequireAuth(URL_SB, ANON)(mkReq("Basic dXNlcjpwYXNz"), res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("'Bearer' sem token → 401 e não bate no Supabase", async () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = mkRes();
    await makeRequireAuth(URL_SB, ANON)(mkReq("Bearer   "), res, next);
    expect(res.statusCode).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("token recusado pelo Supabase → 401", async () => {
    mockFetch.mockResolvedValue(naoAutorizado);
    const next = vi.fn() as unknown as NextFunction;
    const res = mkRes();
    await makeRequireAuth(URL_SB, ANON)(mkReq("Bearer expirado"), res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("resposta 200 sem id → 401 (não deixa passar uid indefinido)", async () => {
    mockFetch.mockResolvedValue(okUser(undefined));
    const next = vi.fn() as unknown as NextFunction;
    const res = mkRes();
    await makeRequireAuth(URL_SB, ANON)(mkReq("Bearer tok"), res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("falha ao falar com o Supabase → 500, nunca 'passa mesmo assim'", async () => {
    mockFetch.mockResolvedValue(respostaIlegivel);
    const next = vi.fn() as unknown as NextFunction;
    const res = mkRes();
    await makeRequireAuth(URL_SB, ANON)(mkReq("Bearer tok"), res, next);
    expect(res.statusCode).toBe(500);
    expect(next).not.toHaveBeenCalled();
  });

  it("sem configuração de auth → 500 e fecha a porta", async () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = mkRes();
    await makeRequireAuth("", "")(mkReq("Bearer tok"), res, next);
    expect(res.statusCode).toBe(500);
    expect(next).not.toHaveBeenCalled();
  });

  it("manda o token adiante como Bearer e a anon key como apikey", async () => {
    mockFetch.mockResolvedValue(okUser(UID));
    await makeRequireAuth(URL_SB, ANON)(mkReq("Bearer abc123"), mkRes(), vi.fn() as unknown as NextFunction);
    const [url, init] = mockFetch.mock.calls[0];
    expect(String(url)).toBe(`${URL_SB}/auth/v1/user`);
    expect((init as RequestInit).headers).toMatchObject({
      apikey: ANON,
      Authorization: "Bearer abc123",
    });
  });
});

describe("getCallerUid", () => {
  beforeEach(() => mockFetch.mockReset());

  it("devolve o uid quando o token vale", async () => {
    mockFetch.mockResolvedValue(okUser(UID));
    expect(await getCallerUid(mkReq("Bearer tok"), URL_SB, ANON)).toBe(UID);
  });

  it("devolve null (nunca lança) em token ausente, inválido ou resposta ilegível", async () => {
    expect(await getCallerUid(mkReq(), URL_SB, ANON)).toBeNull();

    mockFetch.mockResolvedValue(naoAutorizado);
    expect(await getCallerUid(mkReq("Bearer x"), URL_SB, ANON)).toBeNull();

    mockFetch.mockResolvedValue(respostaIlegivel);
    expect(await getCallerUid(mkReq("Bearer x"), URL_SB, ANON)).toBeNull();
  });

  it("sem configuração → null", async () => {
    expect(await getCallerUid(mkReq("Bearer x"), "", "")).toBeNull();
  });
});
