import { describe, it, expect } from "vitest";
import { emailAcesso, formatarCodigo } from "./emailAcesso";

describe("formatarCodigo", () => {
  it("separa em duas metades (6 ou 8 dígitos)", () => {
    expect(formatarCodigo("482913")).toBe("482 913");
    expect(formatarCodigo("29707570")).toBe("2970 7570");
  });

  it("o que não é código numérico sai como veio", () => {
    expect(formatarCodigo("abc")).toBe("abc");
  });
});

describe("emailAcesso", () => {
  const link = "https://revivaz.com.br/conta?token_hash=abc&type=magiclink";

  it("leva o link e a senha temporária no HTML e no texto", () => {
    const m = emailAcesso(link, "482913");
    expect(m.assunto).toBe("Seu acesso à Revivaz");
    expect(m.html).toContain("token_hash=abc&amp;type=magiclink");
    expect(m.html).toContain("482 913");
    expect(m.html).toContain("cid:cadeado@revivaz");
    expect(m.texto).toContain(link);
    expect(m.texto).toContain("482913".slice(0, 3));
    expect(m.texto).toContain("188");
  });

  it("escapa o que entra no HTML", () => {
    const m = emailAcesso('https://x/"><script>1</script>', "<b>1</b>");
    expect(m.html).not.toContain("<script>");
    expect(m.html).not.toContain("<b>1</b>");
  });
});
