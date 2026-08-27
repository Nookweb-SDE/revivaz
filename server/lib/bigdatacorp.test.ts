import { describe, it, expect, vi, beforeEach } from "vitest";
import { verificarIdentidade } from "./bigdatacorp";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function resposta(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

describe("verificarIdentidade", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    delete process.env.BIGDATACORP_TOKEN;
    delete process.env.BIGDATACORP_ACCESS_TOKEN;
    delete process.env.BIGDATACORP_TOKEN_FILE;
    delete process.env.BIGDATACORP_ACCESS_TOKEN_FILE;
  });

  it("sem credencial devolve configurado:false e NÃO chama a rede", async () => {
    const r = await verificarIdentidade({ cpf: "52998224725" });
    expect(r.configurado).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("com credencial devolve o nome encontrado", async () => {
    process.env.BIGDATACORP_TOKEN = "tok";
    process.env.BIGDATACORP_ACCESS_TOKEN = "acc";
    mockFetch.mockResolvedValue(
      resposta({ Result: [{ BasicData: { Name: "MARIA DA SILVA", TaxIdStatus: "REGULAR" } }] })
    );
    const r = await verificarIdentidade({ cpf: "529.982.247-25" });
    expect(r.configurado).toBe(true);
    expect(r.nome).toBe("MARIA DA SILVA");
    expect(r.situacao).toBe("REGULAR");
  });

  it("manda o CPF só com dígitos", async () => {
    process.env.BIGDATACORP_TOKEN = "tok";
    process.env.BIGDATACORP_ACCESS_TOKEN = "acc";
    mockFetch.mockResolvedValue(resposta({ Result: [] }));
    await verificarIdentidade({ cpf: "529.982.247-25" });
    const corpo = String((mockFetch.mock.calls[0][1] as RequestInit).body);
    expect(corpo).toContain("52998224725");
    expect(corpo).not.toContain("529.982");
  });

  it("erro do fornecedor vira erro registrado, não exceção — a fila não pode travar", async () => {
    process.env.BIGDATACORP_TOKEN = "tok";
    process.env.BIGDATACORP_ACCESS_TOKEN = "acc";
    mockFetch.mockResolvedValue(resposta({ erro: "quota" }, 500));
    const r = await verificarIdentidade({ cpf: "52998224725" });
    expect(r.configurado).toBe(true);
    expect(r.erro).toBeTruthy();
    expect(r.nome).toBeUndefined();
  });

  it("resposta ilegível também vira erro registrado", async () => {
    process.env.BIGDATACORP_TOKEN = "tok";
    process.env.BIGDATACORP_ACCESS_TOKEN = "acc";
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => {
        throw new Error("resposta ilegível");
      },
    } as unknown as Response);
    const r = await verificarIdentidade({ cpf: "52998224725" });
    expect(r.erro).toBeTruthy();
  });

  it("lê a credencial de Docker secret (*_FILE) quando a env var não existe — é assim em produção", async () => {
    const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");

    const dir = mkdtempSync(join(tmpdir(), "bdc-"));
    const arqToken = join(dir, "token");
    const arqAccess = join(dir, "access");
    writeFileSync(arqToken, "tok-do-arquivo\n");
    writeFileSync(arqAccess, "acc-do-arquivo\n");
    process.env.BIGDATACORP_TOKEN_FILE = arqToken;
    process.env.BIGDATACORP_ACCESS_TOKEN_FILE = arqAccess;

    try {
      mockFetch.mockResolvedValue(resposta({ Result: [] }));
      const r = await verificarIdentidade({ cpf: "52998224725" });
      expect(r.configurado).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
      const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
      expect(headers.TokenId).toBe("tok-do-arquivo");
      expect(headers.AccessToken).toBe("acc-do-arquivo");
    } finally {
      delete process.env.BIGDATACORP_TOKEN_FILE;
      delete process.env.BIGDATACORP_ACCESS_TOKEN_FILE;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
