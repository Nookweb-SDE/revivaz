# Onboarding do Profissional — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que um profissional se candidate sozinho, seja verificado e aprovado pelo admin, e passe a atender — sem ninguém cadastrar nada na mão.

**Architecture:** Tabela `candidaturas` separada, com dono e RLS própria. Enquanto não for aprovado, o candidato NÃO existe em `profissionais`, então `is_profissional()` fica intacta e nenhum filtro esquecido dá acesso a prontuário. A aprovação é uma promoção transacional feita pelo servidor com `service_role`.

**Tech Stack:** React 18 + Vite (MPA, uma entrada HTML por área) · Express 5 com `tsx` · Supabase (Postgres + RLS) · Vitest · Design system em `src/conta/ui.ts`.

**Spec:** `docs/superpowers/specs/2026-08-26-onboarding-profissional-design.md`

## Global Constraints

- **Design system:** usar `src/conta/ui.ts` (`T`, `card`, `sectionTitle`, `btnPrimary`, `btnGhost`). Nenhum token de cor novo.
- **Páginas legais:** usar a casca `src/legal/PaginaLegal.tsx` (`PaginaLegal`, `Secao`, `T`, `li`).
- **Especialidades:** sempre do catálogo `src/lib/especialidades.ts` (`ESPECIALIDADES`, `GRUPOS`, `labelEspecialidade`). Nunca lista chumbada.
- **Migrations:** aditivas e idempotentes (`create table if not exists`, `drop policy if exists` antes de `create policy`), no padrão de `supabase/migrations/0009_leads.sql`.
- **Autorização de rota:** `requireAuth` de `../config` dá `res.locals.uid`; depois o servidor usa `SUPABASE_SERVICE_ROLE_KEY` para CHECAR associação antes de agir. Padrão de `server/routes/receita.ts`.
- **Rotas novas ficam em `server/routes/*.ts`** como `Router` e são plugadas no `server/server.ts` (que é composition root e não ganha regra de negócio).
- **Sem WhatsApp.** O canal saiu do produto; nenhum aviso automático por lá.
- **Nada de número na tela sem banco atrás** (regra de conteúdo do projeto).
- **Nunca logar CPF, CNPJ ou telefone inteiros.**
- **Testes:** Vitest. Teste primeiro nos itens puros. Rodar `npx vitest run` (tudo) e `npx tsc -b` antes de cada commit.

---

### Task 1: Validação de CPF (lógica pura)

**Files:**
- Create: `src/lib/documentos.ts`
- Test: `src/lib/documentos.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `cpfValido(bruto: string): boolean` · `somenteDigitos(bruto: string): string`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/documentos.test.ts
import { describe, it, expect } from "vitest";
import { cpfValido, somenteDigitos } from "./documentos";

describe("somenteDigitos", () => {
  it("tira máscara, espaço e letra", () => {
    expect(somenteDigitos("529.982.247-25")).toBe("52998224725");
    expect(somenteDigitos(" 529 982 247 25 ")).toBe("52998224725");
    expect(somenteDigitos("abc123")).toBe("123");
  });
});

describe("cpfValido", () => {
  it("aceita CPF válido, com e sem máscara", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("52998224725")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(cpfValido("529.982.247-26")).toBe(false);
  });

  it("recusa todos os dígitos iguais — passam na conta mas não existem", () => {
    for (const d of ["00000000000", "11111111111", "99999999999"]) {
      expect(cpfValido(d), d).toBe(false);
    }
  });

  it("recusa tamanho errado, vazio e lixo", () => {
    expect(cpfValido("")).toBe(false);
    expect(cpfValido("123")).toBe(false);
    expect(cpfValido("529982247250")).toBe(false);
    expect(cpfValido("meu cpf")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/documentos.test.ts`
Expected: FAIL — `Failed to resolve import "./documentos"`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/documentos.ts
/**
 * Validação de documento. Fica separada porque o servidor valida na entrada da
 * candidatura e a tela valida antes de enviar: a regra tem que ser a mesma.
 */

/** Só os dígitos. Aceita máscara, espaço e lixo no meio. */
export function somenteDigitos(bruto: string): string {
  return (bruto || "").replace(/\D/g, "");
}

/**
 * CPF pelo dígito verificador. Sequências de dígito repetido passam na conta
 * mas não existem na Receita, então são recusadas explicitamente.
 */
export function cpfValido(bruto: string): boolean {
  const d = somenteDigitos(bruto);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  const digito = (ate: number): number => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(d[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/documentos.test.ts`
Expected: PASS — 6 testes

- [ ] **Step 5: Commit**

```bash
git add src/lib/documentos.ts src/lib/documentos.test.ts
git commit -m "feat(candidatura): validação de CPF por dígito verificador"
```

---

### Task 2: Conselhos e formato do registro (lógica pura)

**Files:**
- Create: `src/lib/conselhos.ts`
- Test: `src/lib/conselhos.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `CONSELHOS: Conselho[]` · `registroValido(conselho: string, registro: string): boolean` · `linkConsulta(conselho: string, registro: string): string | null`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/conselhos.test.ts
import { describe, it, expect } from "vitest";
import { CONSELHOS, registroValido, linkConsulta } from "./conselhos";

describe("catálogo de conselhos", () => {
  it("cobre os conselhos das 12 especialidades", () => {
    const siglas = CONSELHOS.map((c) => c.sigla);
    for (const s of ["CRM", "CRP", "COFFITO", "CFFa", "OUTRO"]) {
      expect(siglas, s).toContain(s);
    }
  });

  it("toda entrada tem nome e sigla sem espaço", () => {
    for (const c of CONSELHOS) {
      expect(c.nome.length).toBeGreaterThan(3);
      expect(c.sigla).toMatch(/^[A-Z]+$/);
    }
  });
});

describe("registroValido", () => {
  it("aceita número com e sem máscara", () => {
    expect(registroValido("CRP", "06/12345")).toBe(true);
    expect(registroValido("CRM", "123456")).toBe(true);
  });

  it("recusa vazio, curto demais e sem nenhum dígito", () => {
    expect(registroValido("CRP", "")).toBe(false);
    expect(registroValido("CRP", "12")).toBe(false);
    expect(registroValido("CRP", "abcdef")).toBe(false);
  });

  it("recusa conselho fora do catálogo", () => {
    expect(registroValido("CONSELHO_INVENTADO", "123456")).toBe(false);
  });
});

describe("linkConsulta", () => {
  it("monta o link oficial do CRP com o número dentro", () => {
    const url = linkConsulta("CRP", "06/12345");
    expect(url).toContain("cfp.org.br");
    expect(url).toContain("0612345");
  });

  it("monta o link oficial do CRM", () => {
    expect(linkConsulta("CRM", "123456")).toContain("cfm.org.br");
  });

  it("devolve null quando o conselho não tem consulta pública — o admin confere fora", () => {
    expect(linkConsulta("OUTRO", "123456")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/conselhos.test.ts`
Expected: FAIL — `Failed to resolve import "./conselhos"`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/conselhos.ts
/**
 * Conselhos profissionais e a consulta pública de cada um.
 *
 * A validação do registro é SEMIAUTOMÁTICA: o sistema monta o link oficial já
 * com o número, e quem decide é o admin. Quatro das nossas especialidades não
 * têm consulta pública unificada — nesses casos `linkConsulta` devolve null e o
 * admin confere por fora, o que é melhor que fingir automação.
 */
import { somenteDigitos } from "./documentos";

export interface Conselho {
  sigla: string;
  nome: string;
  /** Onde o admin confere. null = sem consulta pública unificada. */
  consulta: ((registro: string) => string) | null;
}

export const CONSELHOS: Conselho[] = [
  {
    sigla: "CRM",
    nome: "Conselho Regional de Medicina",
    consulta: (r) => `https://portal.cfm.org.br/busca-medicos/?crm=${somenteDigitos(r)}`,
  },
  {
    sigla: "CRP",
    nome: "Conselho Regional de Psicologia",
    consulta: (r) => `https://cadastro.cfp.org.br/cfp/?registro=${somenteDigitos(r)}`,
  },
  {
    sigla: "COFFITO",
    nome: "Conselho de Fisioterapia e Terapia Ocupacional",
    consulta: null,
  },
  {
    sigla: "CFFa",
    nome: "Conselho Federal de Fonoaudiologia",
    consulta: null,
  },
  {
    sigla: "OUTRO",
    nome: "Outro conselho ou entidade",
    consulta: null,
  },
];

function acha(sigla: string): Conselho | undefined {
  return CONSELHOS.find((c) => c.sigla === sigla);
}

/** Registro plausível: conselho conhecido e pelo menos 3 dígitos. */
export function registroValido(conselho: string, registro: string): boolean {
  if (!acha(conselho)) return false;
  return somenteDigitos(registro).length >= 3;
}

/** Link da consulta oficial com o número preenchido, ou null. */
export function linkConsulta(conselho: string, registro: string): string | null {
  const c = acha(conselho);
  if (!c || !c.consulta || !registroValido(conselho, registro)) return null;
  return c.consulta(registro);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/conselhos.test.ts`
Expected: PASS — 7 testes

- [ ] **Step 5: Commit**

```bash
git add src/lib/conselhos.ts src/lib/conselhos.test.ts
git commit -m "feat(candidatura): conselhos e link da consulta oficial preenchido"
```

---

### Task 3: Máquina de estados da candidatura (lógica pura)

**Files:**
- Create: `src/lib/candidaturaEstados.ts`
- Test: `src/lib/candidaturaEstados.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `StatusCandidatura` (union type) · `TRANSICOES` · `podeTransicionar(de, para): boolean` · `LABEL_STATUS: Record<StatusCandidatura, string>`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/candidaturaEstados.test.ts
import { describe, it, expect } from "vitest";
import {
  podeTransicionar,
  LABEL_STATUS,
  type StatusCandidatura,
} from "./candidaturaEstados";

const TODOS: StatusCandidatura[] = [
  "recebida",
  "em_analise",
  "pendencia",
  "aprovada",
  "recusada",
];

describe("máquina de estados da candidatura", () => {
  it("permite o caminho feliz", () => {
    expect(podeTransicionar("recebida", "em_analise")).toBe(true);
    expect(podeTransicionar("em_analise", "aprovada")).toBe(true);
  });

  it("permite recusar desde o começo", () => {
    expect(podeTransicionar("recebida", "recusada")).toBe(true);
    expect(podeTransicionar("em_analise", "recusada")).toBe(true);
  });

  it("permite pendência e o reenvio do candidato", () => {
    expect(podeTransicionar("em_analise", "pendencia")).toBe(true);
    expect(podeTransicionar("pendencia", "em_analise")).toBe(true);
  });

  it("aprovada e recusada são finais", () => {
    for (const destino of TODOS) {
      expect(podeTransicionar("aprovada", destino), `aprovada→${destino}`).toBe(false);
      expect(podeTransicionar("recusada", destino), `recusada→${destino}`).toBe(false);
    }
  });

  it("recusada NÃO vira aprovada: para reconsiderar, o candidato envia de novo", () => {
    expect(podeTransicionar("recusada", "aprovada")).toBe(false);
  });

  it("não dá para pular a análise indo direto de recebida para aprovada", () => {
    expect(podeTransicionar("recebida", "aprovada")).toBe(false);
  });

  it("transição para o mesmo estado é recusada — é o que torna aprovar idempotente", () => {
    for (const s of TODOS) expect(podeTransicionar(s, s), s).toBe(false);
  });

  it("todo status tem um rótulo em português para a tela", () => {
    for (const s of TODOS) expect(LABEL_STATUS[s].length).toBeGreaterThan(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/candidaturaEstados.test.ts`
Expected: FAIL — `Failed to resolve import "./candidaturaEstados"`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/candidaturaEstados.ts
/**
 * Ciclo de vida da candidatura.
 *
 * A tabela de transições é a única fonte: o servidor consulta antes de decidir,
 * e é ela que torna a aprovação idempotente — aprovar de novo é uma transição
 * `aprovada → aprovada`, que não existe, então a segunda chamada não faz nada.
 */
export type StatusCandidatura =
  | "recebida"
  | "em_analise"
  | "pendencia"
  | "aprovada"
  | "recusada";

/** De → para. O que não está aqui é proibido. */
export const TRANSICOES: Record<StatusCandidatura, StatusCandidatura[]> = {
  recebida: ["em_analise", "recusada"],
  em_analise: ["aprovada", "recusada", "pendencia"],
  pendencia: ["em_analise"],
  aprovada: [],
  recusada: [],
};

export function podeTransicionar(
  de: StatusCandidatura,
  para: StatusCandidatura
): boolean {
  return (TRANSICOES[de] ?? []).includes(para);
}

export const LABEL_STATUS: Record<StatusCandidatura, string> = {
  recebida: "Recebida",
  em_analise: "Em análise",
  pendencia: "Falta documento",
  aprovada: "Aprovada",
  recusada: "Recusada",
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/candidaturaEstados.test.ts`
Expected: PASS — 8 testes

- [ ] **Step 5: Commit**

```bash
git add src/lib/candidaturaEstados.ts src/lib/candidaturaEstados.test.ts
git commit -m "feat(candidatura): máquina de estados, com aprovação idempotente"
```

---

### Task 4: Migration `0010_candidaturas.sql`

**Files:**
- Create: `supabase/migrations/0010_candidaturas.sql`
- Modify: `src/lib/types.ts` (adicionar o tipo `Candidatura` ao final)

**Interfaces:**
- Consumes: `StatusCandidatura` da Task 3.
- Produces: tabela `public.candidaturas` · tipo `Candidatura` exportado de `src/lib/types.ts`.

- [ ] **Step 1: Escrever a migration**

```sql
-- supabase/migrations/0010_candidaturas.sql
-- Fase 10 — Candidatura do profissional
--
-- Hoje o profissional não se candidata: o admin cria a linha em `profissionais`
-- na mão e vincula o login. Esta tabela é a fila de entrada.
--
-- Por que tabela separada e não um `status` dentro de `profissionais`: enquanto
-- não for aprovado, o candidato NÃO EXISTE em `profissionais`. Assim nenhum
-- filtro esquecido pode transformá-lo em profissional com acesso a prontuário, e
-- `is_profissional()` não muda uma vírgula.
-- Idempotente e aditiva.

create table if not exists public.candidaturas (
  id uuid primary key default gen_random_uuid(),
  -- uma candidatura por pessoa
  profile_id uuid not null unique references public.profiles(id) on delete cascade,

  nome_completo text not null,
  cpf text not null,
  telefone text not null,

  conselho text not null,
  registro text not null,
  uf_conselho text,
  especialidade text not null,
  -- opcional de propósito: exigir CNPJ é barreira para quem doa horas
  cnpj text,

  bio text,
  horas_semana int,

  status text not null default 'recebida'
    check (status in ('recebida','em_analise','pendencia','aprovada','recusada')),
  -- por que recusou, ou o que falta na pendência
  motivo text,

  -- aceite versionado do Termo do Profissional
  termo_versao text,
  termo_aceito_em timestamptz,
  termo_aceito_ip text,

  -- EVIDÊNCIA da análise (retorno da BigDataCorp, quem conferiu o conselho e
  -- quando). Nunca decisão automática.
  verificacao jsonb not null default '{}'::jsonb,

  analisado_por uuid references public.profiles(id) on delete set null,
  analisado_em timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists candidaturas_status_created_idx
  on public.candidaturas (status, created_at desc);

alter table public.candidaturas enable row level security;

-- O candidato lê só a dele; admin lê todas.
drop policy if exists candidatura_self_select on public.candidaturas;
create policy candidatura_self_select on public.candidaturas
  for select
  using (profile_id = auth.uid() or public.is_admin());

-- O candidato corrige a dele só enquanto está aberta.
drop policy if exists candidatura_self_update on public.candidaturas;
create policy candidatura_self_update on public.candidaturas
  for update
  using (profile_id = auth.uid() and status in ('recebida','pendencia'))
  with check (profile_id = auth.uid() and status in ('recebida','pendencia'));

-- Os campos de DECISÃO são travados por trigger, não por RLS: o WITH CHECK só
-- enxerga a linha nova, então não dá para comparar com a antiga ali. O trigger
-- devolve os valores originais se alguém que não é admin tentar mexer.
create or replace function public.candidatura_trava_decisao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    return new;
  end if;
  new.status        := old.status;
  new.motivo        := old.motivo;
  new.verificacao   := old.verificacao;
  new.analisado_por := old.analisado_por;
  new.analisado_em  := old.analisado_em;
  new.termo_versao    := old.termo_versao;
  new.termo_aceito_em := old.termo_aceito_em;
  new.termo_aceito_ip := old.termo_aceito_ip;
  return new;
end;
$$;

drop trigger if exists candidatura_trava_decisao_tg on public.candidaturas;
create trigger candidatura_trava_decisao_tg
  before update on public.candidaturas
  for each row execute function public.candidatura_trava_decisao();

-- Admin faz tudo.
drop policy if exists candidatura_admin_all on public.candidaturas;
create policy candidatura_admin_all on public.candidaturas
  for all
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.candidaturas is
  'Fila de entrada do profissional. O insert vem do servidor (service_role), porque o IP do aceite do termo só existe lá.';
```

- [ ] **Step 2: Adicionar o tipo, ao final de `src/lib/types.ts`**

```ts
/** Candidatura de profissional. O ciclo de vida está em src/lib/candidaturaEstados.ts. */
export type Candidatura = {
  id: string;
  profile_id: string;
  nome_completo: string;
  cpf: string;
  telefone: string;
  conselho: string;
  registro: string;
  uf_conselho: string | null;
  especialidade: string;
  cnpj: string | null;
  bio: string | null;
  horas_semana: number | null;
  status: "recebida" | "em_analise" | "pendencia" | "aprovada" | "recusada";
  motivo: string | null;
  termo_versao: string | null;
  termo_aceito_em: string | null;
  termo_aceito_ip: string | null;
  verificacao: Record<string, unknown>;
  analisado_por: string | null;
  analisado_em: string | null;
  created_at: string;
};
```

- [ ] **Step 3: Conferir que o typecheck passa**

Run: `npx tsc -b`
Expected: sem saída

- [ ] **Step 4: Commit (NÃO aplicar em produção ainda)**

```bash
git add supabase/migrations/0010_candidaturas.sql src/lib/types.ts
git commit -m "feat(candidatura): migration 0010 com RLS de dono e trava de decisão"
```

> ⚠️ Aplicar migration em produção exige OK explícito do dono. O caminho que funciona nesta máquina: `scp` do .sql para a VPS e `docker run --rm --network host postgres:16-alpine psql` (o host do Supabase é IPv6-only e esta máquina não tem rota v6).

---

### Task 5: Cliente da BigDataCorp

**Files:**
- Create: `server/lib/bigdatacorp.ts`
- Test: `server/lib/bigdatacorp.test.ts`
- Modify: `server/config.ts` (adicionar as duas credenciais ao final)

**Interfaces:**
- Consumes: `resolveSecret` de `server/config.ts`.
- Produces: `verificarIdentidade(params: { cpf: string; cnpj?: string }): Promise<VerificacaoIdentidade>` · tipo `VerificacaoIdentidade`.

- [ ] **Step 1: Write the failing test**

```ts
// server/lib/bigdatacorp.test.ts
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/lib/bigdatacorp.test.ts`
Expected: FAIL — `Failed to resolve import "./bigdatacorp"`

- [ ] **Step 3: Adicionar as credenciais ao final de `server/config.ts`**

```ts
// ─── BigDataCorp (verificação de identidade do candidato) ───────────────────
// Contrato pago. Sem credencial o cliente degrada e o admin decide só com a
// consulta do conselho — a fila nunca trava por falta de fornecedor.
export const BIGDATACORP_TOKEN = resolveSecret("BIGDATACORP_TOKEN", "BIGDATACORP_TOKEN_FILE");
export const BIGDATACORP_ACCESS_TOKEN = resolveSecret(
  "BIGDATACORP_ACCESS_TOKEN",
  "BIGDATACORP_ACCESS_TOKEN_FILE"
);
```

- [ ] **Step 4: Write minimal implementation**

```ts
// server/lib/bigdatacorp.ts
/**
 * Verificação de identidade do candidato pela BigDataCorp.
 *
 * É COMPLEMENTAR à consulta do conselho: confirma que o nome bate com o CPF e
 * que o CNPJ está ativo. Ela não sabe nada de CRP ou CRM. O retorno é guardado
 * como EVIDÊNCIA da análise; quem decide é o admin.
 *
 * Nunca lança e nunca loga documento inteiro.
 */
import { somenteDigitos } from "../../src/lib/documentos";

const ENDPOINT = "https://plataforma.bigdatacorp.com.br/pessoas";

export interface VerificacaoIdentidade {
  /** false = sem credencial. O admin decide só com o conselho. */
  configurado: boolean;
  nome?: string;
  situacao?: string;
  erro?: string;
  consultadoEm: string;
}

/** Lê na hora da chamada para o teste conseguir alternar o ambiente. */
function credenciais(): { token: string; access: string } {
  return {
    token: (process.env.BIGDATACORP_TOKEN || "").trim(),
    access: (process.env.BIGDATACORP_ACCESS_TOKEN || "").trim(),
  };
}

export async function verificarIdentidade(params: {
  cpf: string;
  cnpj?: string;
}): Promise<VerificacaoIdentidade> {
  const agora = new Date().toISOString();
  const { token, access } = credenciais();
  if (!token || !access) {
    return { configurado: false, consultadoEm: agora };
  }

  const doc = somenteDigitos(params.cpf);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        AccessToken: access,
        TokenId: token,
      },
      body: JSON.stringify({ Datasets: "basic_data", q: `doc{${doc}}` }),
    });
    if (!res.ok) {
      console.error("[bigdatacorp] fornecedor retornou", res.status);
      return { configurado: true, erro: `HTTP ${res.status}`, consultadoEm: agora };
    }
    const corpo = (await res.json()) as {
      Result?: Array<{ BasicData?: { Name?: string; TaxIdStatus?: string } }>;
    };
    const basico = corpo.Result?.[0]?.BasicData;
    return {
      configurado: true,
      nome: basico?.Name,
      situacao: basico?.TaxIdStatus,
      consultadoEm: agora,
    };
  } catch (err) {
    console.error("[bigdatacorp] falha na consulta:", err instanceof Error ? err.message : err);
    return { configurado: true, erro: "falha na consulta", consultadoEm: agora };
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run server/lib/bigdatacorp.test.ts`
Expected: PASS — 5 testes

- [ ] **Step 6: Commit**

```bash
git add server/lib/bigdatacorp.ts server/lib/bigdatacorp.test.ts server/config.ts
git commit -m "feat(candidatura): cliente BigDataCorp que degrada sem credencial"
```

---

### Task 6: Rota de envio da candidatura

**Files:**
- Create: `server/routes/candidatura.ts`
- Modify: `server/server.ts` (import + `app.use`)
- Test: `src/server/candidatura.integration.test.ts`

**Interfaces:**
- Consumes: `cpfValido` (Task 1) · `registroValido` (Task 2) · `ESPECIALIDADES` do catálogo · `requireAuth`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` de `server/config.ts`.
- Produces: `POST /api/candidatura` · a constante `TERMO_PROFISSIONAL_VERSAO` exportada de `server/routes/candidatura.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// src/server/candidatura.integration.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/candidatura.integration.test.ts`
Expected: FAIL — os casos de 201/400 falham porque a rota cai no 404 de `/api`

- [ ] **Step 3: Write minimal implementation**

```ts
// server/routes/candidatura.ts
/**
 * Candidatura do profissional.
 *
 * O insert passa pelo servidor, e não direto pelo supabase-js, por dois
 * motivos: o IP do aceite do termo só existe aqui, e o `profile_id` tem que vir
 * do token — nunca do corpo, senão qualquer um se candidata no lugar de outro.
 */
import { Router, type Request, type Response } from "express";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, requireAuth } from "../config";
import { cpfValido, somenteDigitos } from "../../src/lib/documentos";
import { registroValido } from "../../src/lib/conselhos";
import { ESPECIALIDADES } from "../../src/lib/especialidades";

const router = Router();

/** Sobe junto com o texto do Termo do Profissional. Mudou o texto, muda aqui. */
export const TERMO_PROFISSIONAL_VERSAO = "2026-08-26";

router.post("/api/candidatura", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: "Auth not configured" });
    return;
  }
  const uid = res.locals.uid as string;

  const nome_completo = String(req.body?.nome_completo ?? "").trim().slice(0, 160);
  const cpf = String(req.body?.cpf ?? "").trim();
  const telefone = String(req.body?.telefone ?? "").trim().slice(0, 32);
  const conselho = String(req.body?.conselho ?? "").trim();
  const registro = String(req.body?.registro ?? "").trim().slice(0, 40);
  const uf_conselho = String(req.body?.uf_conselho ?? "").trim().slice(0, 2) || null;
  const especialidade = String(req.body?.especialidade ?? "").trim();
  const cnpj = somenteDigitos(String(req.body?.cnpj ?? "")) || null;
  const bio = String(req.body?.bio ?? "").trim().slice(0, 1000) || null;
  const horasBruto = Number(req.body?.horas_semana);
  const horas_semana = Number.isFinite(horasBruto) && horasBruto > 0 ? Math.min(horasBruto, 60) : null;
  const aceite = req.body?.aceite_termo === true;

  if (nome_completo.length < 3) {
    res.status(400).json({ error: "Diga seu nome completo." });
    return;
  }
  if (!cpfValido(cpf)) {
    res.status(400).json({ error: "Confira o CPF." });
    return;
  }
  if (telefone.replace(/\D/g, "").length < 10) {
    res.status(400).json({ error: "Confira o telefone com DDD." });
    return;
  }
  if (!registroValido(conselho, registro)) {
    res.status(400).json({ error: "Confira o conselho e o número do registro." });
    return;
  }
  if (!ESPECIALIDADES.some((e) => e.valor === especialidade)) {
    res.status(400).json({ error: "Escolha uma especialidade da lista." });
    return;
  }
  if (!aceite) {
    res.status(400).json({ error: "É preciso aceitar o Termo do Profissional." });
    return;
  }

  const fwd = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(fwd) ? fwd[0] : (fwd || "").toString().split(",")[0].trim()) ||
    req.socket.remoteAddress ||
    "desconhecido";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    Prefer: "return=representation,resolution=merge-duplicates",
  };

  try {
    // upsert pelo profile_id: reenviar em pendência atualiza, não duplica
    const r = await fetch(`${SUPABASE_URL}/rest/v1/candidaturas?on_conflict=profile_id`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        profile_id: uid,
        nome_completo,
        cpf: somenteDigitos(cpf),
        telefone,
        conselho,
        registro,
        uf_conselho,
        especialidade,
        cnpj,
        bio,
        horas_semana,
        status: "recebida",
        // reenvio limpa a pendência antiga: senão o candidato continua vendo
        // na tela um motivo que ele já resolveu
        motivo: null,
        termo_versao: TERMO_PROFISSIONAL_VERSAO,
        termo_aceito_em: new Date().toISOString(),
        termo_aceito_ip: ip,
      }),
    });
    if (!r.ok) {
      const corpo = await r.text();
      console.error("[candidatura] erro ao gravar:", r.status, corpo);
      res.status(500).json({ error: "Não consegui registrar agora. Tente de novo." });
      return;
    }
    console.log(`[candidatura] recebida de uid=${uid.slice(0, 8)}… especialidade=${especialidade}`);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[candidatura] erro inesperado:", err);
    res.status(500).json({ error: "Não consegui registrar agora. Tente de novo." });
  }
});

export default router;
```

- [ ] **Step 4: Plugar no `server/server.ts`**

Adicionar junto dos outros imports de rota:

```ts
import candidaturaRoutes from "./routes/candidatura";
```

E junto dos outros `app.use`, antes da seção "Saúde":

```ts
app.use(candidaturaRoutes);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/server/candidatura.integration.test.ts`
Expected: PASS — 8 testes

- [ ] **Step 6: Commit**

```bash
git add server/routes/candidatura.ts server/server.ts src/server/candidatura.integration.test.ts
git commit -m "feat(candidatura): rota de envio, com o profile_id vindo do token"
```

---

### Task 7: Rotas de admin — verificar e decidir

**Files:**
- Modify: `server/routes/candidatura.ts` (adicionar as duas rotas antes do `export default`)
- Modify: `src/server/candidatura.integration.test.ts` (adicionar os describes)

**Interfaces:**
- Consumes: `podeTransicionar` (Task 3) · `verificarIdentidade` (Task 5).
- Produces: `POST /api/admin/candidatura/:id/verificar` · `POST /api/admin/candidatura/:id/decidir`.

- [ ] **Step 1: Write the failing test (adicionar ao final do arquivo de teste)**

```ts
const ADMIN = "33333333-3333-4333-8333-333333333333";
const CAND_ID = "44444444-4444-4444-8444-444444444444";

/** Roteia como admin, com uma candidatura em análise já pronta. */
function roteiaAdmin(status = "em_analise") {
  mockFetch.mockImplementation((url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes("/auth/v1/user")) return Promise.resolve(mkRes({ id: ADMIN }));
    if (u.includes("/rest/v1/profiles")) return Promise.resolve(mkRes([{ role: "admin" }]));
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
      if (u.includes("/rest/v1/profiles")) return Promise.resolve(mkRes([{ role: "paciente" }]));
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
      (c) => String(c[0]).includes("/rest/v1/profiles") && (c[1] as RequestInit)?.method === "PATCH"
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
      if (u.includes("/rest/v1/profiles")) return Promise.resolve(mkRes([{ role: "paciente" }]));
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/candidatura.integration.test.ts`
Expected: FAIL — as rotas de admin caem no 404 de `/api`

- [ ] **Step 3: Write minimal implementation (adicionar antes do `export default router;`)**

```ts
/** Cabeçalhos de service_role. Ignora RLS: só para CHECAR e para promover. */
function adminHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };
}

/** true se o uid é admin. Mesmo padrão do /api/admin/profissional-link. */
async function ehAdmin(uid: string): Promise<boolean> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}&select=role`, {
    headers: adminHeaders(),
  });
  if (!r.ok) return false;
  const linhas = (await r.json()) as Array<{ role?: string }>;
  return linhas[0]?.role === "admin";
}

interface CandidaturaCarregada {
  id: string;
  profile_id: string;
  nome_completo: string;
  especialidade: string;
  conselho: string;
  registro: string;
  bio: string | null;
  cpf: string;
  cnpj: string | null;
  status: StatusCandidatura;
}

async function carregarCandidatura(id: string): Promise<CandidaturaCarregada | null> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/candidaturas?id=eq.${encodeURIComponent(id)}&select=*`,
    { headers: adminHeaders() }
  );
  if (!r.ok) return null;
  const linhas = (await r.json()) as CandidaturaCarregada[];
  return linhas[0] ?? null;
}

// POST /api/admin/candidatura/:id/verificar — evidência, não decisão.
router.post(
  "/api/admin/candidatura/:id/verificar",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }
    if (!(await ehAdmin(res.locals.uid as string))) {
      res.status(403).json({ error: "Apenas administradores" });
      return;
    }
    const cand = await carregarCandidatura(String(req.params.id));
    if (!cand) {
      res.status(404).json({ error: "Candidatura não encontrada" });
      return;
    }
    const verificacao = await verificarIdentidade({
      cpf: cand.cpf,
      cnpj: cand.cnpj ?? undefined,
    });
    await fetch(`${SUPABASE_URL}/rest/v1/candidaturas?id=eq.${cand.id}`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ verificacao }),
    });
    console.log(`[candidatura] verificada id=${cand.id.slice(0, 8)}… configurado=${verificacao.configurado}`);
    res.status(200).json({ verificacao });
  }
);

// POST /api/admin/candidatura/:id/decidir — aprovar, recusar ou pendência.
router.post(
  "/api/admin/candidatura/:id/decidir",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }
    const uid = res.locals.uid as string;
    if (!(await ehAdmin(uid))) {
      res.status(403).json({ error: "Apenas administradores" });
      return;
    }

    const acao = String(req.body?.acao ?? "");
    const motivo = String(req.body?.motivo ?? "").trim().slice(0, 500);
    const destino: Record<string, StatusCandidatura> = {
      aprovar: "aprovada",
      recusar: "recusada",
      pendencia: "pendencia",
      analisar: "em_analise",
    };
    const novoStatus = destino[acao];
    if (!novoStatus) {
      res.status(400).json({ error: "Ação inválida" });
      return;
    }
    if ((acao === "recusar" || acao === "pendencia") && motivo.length < 5) {
      res.status(400).json({ error: "Escreva o motivo: é o que o candidato vai ler." });
      return;
    }

    const cand = await carregarCandidatura(String(req.params.id));
    if (!cand) {
      res.status(404).json({ error: "Candidatura não encontrada" });
      return;
    }
    // É esta checagem que torna aprovar idempotente: aprovada → aprovada não existe.
    if (!podeTransicionar(cand.status, novoStatus)) {
      res.status(409).json({ error: `Não dá para ir de ${cand.status} para ${novoStatus}.` });
      return;
    }

    try {
      if (novoStatus === "aprovada") {
        const criar = await fetch(`${SUPABASE_URL}/rest/v1/profissionais`, {
          method: "POST",
          headers: { ...adminHeaders(), Prefer: "return=representation" },
          body: JSON.stringify({
            nome: cand.nome_completo,
            especialidade: cand.especialidade,
            registro: `${cand.conselho} ${cand.registro}`,
            bio: cand.bio,
            ativo: true,
            profile_id: cand.profile_id,
          }),
        });
        if (!criar.ok) {
          console.error("[candidatura] falha ao criar profissional:", criar.status);
          res.status(500).json({ error: "Não consegui promover agora." });
          return;
        }
        const virarProfissional = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${cand.profile_id}`,
          { method: "PATCH", headers: adminHeaders(), body: JSON.stringify({ role: "profissional" }) }
        );
        if (!virarProfissional.ok) {
          console.error("[candidatura] falha ao trocar o papel:", virarProfissional.status);
          res.status(500).json({ error: "Não consegui promover agora." });
          return;
        }
      }

      await fetch(`${SUPABASE_URL}/rest/v1/candidaturas?id=eq.${cand.id}`, {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({
          status: novoStatus,
          motivo: motivo || null,
          analisado_por: uid,
          analisado_em: new Date().toISOString(),
        }),
      });
      console.log(`[candidatura] id=${cand.id.slice(0, 8)}… ${cand.status} → ${novoStatus}`);
      res.status(200).json({ ok: true, status: novoStatus });
    } catch (err) {
      console.error("[candidatura] erro ao decidir:", err);
      res.status(500).json({ error: "Erro interno" });
    }
  }
);
```

E acrescentar aos imports do topo do arquivo:

```ts
import { podeTransicionar, type StatusCandidatura } from "../../src/lib/candidaturaEstados";
import { verificarIdentidade } from "../lib/bigdatacorp";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/server/candidatura.integration.test.ts`
Expected: PASS — 17 testes

- [ ] **Step 5: Rodar a suíte inteira e o typecheck**

Run: `npx tsc -b && npx vitest run`
Expected: tsc sem saída, todos os testes verdes

- [ ] **Step 6: Commit**

```bash
git add server/routes/candidatura.ts src/server/candidatura.integration.test.ts
git commit -m "feat(candidatura): admin verifica e decide, com promoção idempotente"
```

---

### Task 8: Termo do Profissional (`/termo-profissional`)

**Files:**
- Create: `termo-profissional.html`
- Create: `src/termoProfissional/main.tsx`
- Create: `src/termoProfissional/TermoProfissional.tsx`
- Modify: `vite.config.ts` (nova entrada)
- Modify: `server/server.ts` (rota estática)

**Interfaces:**
- Consumes: `PaginaLegal`, `Secao`, `T`, `li` de `src/legal/PaginaLegal.tsx` · `TERMO_PROFISSIONAL_VERSAO` (Task 6) como referência de valor.
- Produces: a página `/termo-profissional`.

- [ ] **Step 1: Criar o HTML de entrada**

```html
<!-- termo-profissional.html -->
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Termo do Profissional — Revivaz</title>
    <meta name="description" content="As regras para atender na Revivaz: responsabilidade clínica, sigilo, faltas e ausência de vínculo empregatício." />
    <link rel="preload" as="font" href="/fonts/nunito-latin.woff2" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/fonts/nunito.css" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="/fonts/nunito.css" /></noscript>
    <style>
      a:focus-visible, button:focus-visible { outline: 2px solid #00A8BF; outline-offset: 2px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/termoProfissional/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Criar o main**

```tsx
// src/termoProfissional/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import TermoProfissional from "./TermoProfissional";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><TermoProfissional /></React.StrictMode>
);
```

- [ ] **Step 3: Escrever a página**

```tsx
// src/termoProfissional/TermoProfissional.tsx
/**
 * Termo do Profissional.
 *
 * É o documento que sustenta a cláusula de que a responsabilidade clínica é do
 * profissional. O aceite é versionado: `VERSAO` acompanha
 * TERMO_PROFISSIONAL_VERSAO em server/routes/candidatura.ts. Mudou o texto,
 * mudam as duas, e o aceite é pedido de novo.
 *
 * ⚠️ Precisa de revisão por advogado, junto com os outros dois documentos.
 */
import React from "react";
import { PaginaLegal, Secao, T, li } from "../legal/PaginaLegal";

export const VERSAO = "2026-08-26";

export default function TermoProfissional(): JSX.Element {
  return (
    <PaginaLegal
      titulo="Termo do Profissional"
      atualizadaEm="26 de agosto de 2026"
      resumo={
        <>
          Você atende de forma <strong>voluntária</strong>: não paga mensalidade, não há taxa
          por sessão e não exigimos CNPJ. Em troca, a <strong>responsabilidade clínica é
          sua</strong>, como seria no seu consultório. A plataforma organiza a agenda, guarda
          o registro e fornece a sala.
        </>
      }
    >
      <Secao n="1" titulo="Quem pode atender">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={li}>Registro ativo no conselho da sua área, conferido por nós no cadastro.</li>
          <li style={li}>Uma candidatura por pessoa.</li>
          <li style={li}>CNPJ é opcional. Se você tiver, pode informar.</li>
        </ul>
      </Secao>

      <Secao n="2" titulo="Não há vínculo empregatício">
        <p style={{ margin: 0 }}>
          Este termo não cria emprego, exclusividade nem obrigação de disponibilidade. Você
          decide quantas horas oferece e pode sair quando quiser, avisando com antecedência
          razoável para não deixar paciente marcado sem atendimento.
        </p>
      </Secao>

      <Secao n="3" titulo="Quanto você paga, e quanto recebe">
        <p style={{ margin: "0 0 8px" }}>
          <strong>Nada, e nada.</strong> Não cobramos mensalidade nem porcentagem por sessão, e
          hoje não existe repasse financeiro: o atendimento é voluntário.
        </p>
        <p style={{ margin: 0 }}>
          Se um dia houver remuneração, ela virá em contrato próprio, com assinatura, e este
          termo será atualizado antes de valer.
        </p>
      </Secao>

      <Secao n="4" titulo="A responsabilidade clínica é sua">
        <p style={{ margin: "0 0 8px" }}>
          Você responde pela conduta, pela prescrição e pelo registro, perante o seu conselho,
          exatamente como no atendimento presencial. A plataforma é intermediária.
        </p>
        <p style={{ margin: 0 }}>
          Conferimos seu registro no cadastro, e isso não transfere para a plataforma a
          responsabilidade pelo ato clínico.
        </p>
      </Secao>

      <Secao n="5" titulo="Sigilo">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={li}>
            Dado de saúde mental é sensível. Use o que vê no atendimento apenas para atender.
          </li>
          <li style={li}>Não grave a consulta e não compartilhe qualquer trecho dela.</li>
          <li style={li}>
            Não repasse o link de acesso da sua conta: ele abre a ficha dos seus pacientes.
          </li>
        </ul>
      </Secao>

      <Secao n="6" titulo="Faltas e atrasos">
        <p style={{ margin: "0 0 8px" }}>
          Tolerância de 15 minutos de atraso. Se não puder comparecer, cancele com antecedência
          pela plataforma.
        </p>
        <p style={{ margin: 0 }}>
          Falta sem aviso: a primeira gera notificação, a segunda advertência e a terceira o
          descredenciamento. Do outro lado tem alguém que esperou.
        </p>
      </Secao>

      <Secao n="7" titulo="Crise">
        <p style={{ margin: 0 }}>
          A plataforma não é serviço de emergência. Se identificar risco imediato, oriente o
          paciente ao <a href="tel:188" style={{ color: T.teal700, fontWeight: 800 }}>188 (CVV)</a> ou{" "}
          <a href="tel:192" style={{ color: T.teal700, fontWeight: 800 }}>192 (SAMU)</a> e registre a
          conduta na evolução.
        </p>
      </Secao>

      <Secao n="8" titulo="Quando podemos encerrar seu acesso">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={li}>Registro do conselho suspenso, cancelado ou vencido.</li>
          <li style={li}>Quebra de sigilo.</li>
          <li style={li}>Terceira falta sem aviso.</li>
          <li style={li}>Cobrança do paciente por fora da plataforma.</li>
        </ul>
        <p style={{ margin: "10px 0 0" }}>Quando der, avisamos antes e explicamos o motivo.</p>
      </Secao>

      <Secao n="9" titulo="Seus dados">
        <p style={{ margin: 0 }}>
          Para conferir sua identidade, consultamos seu CPF, e o CNPJ quando informado, em base
          de dados cadastrais. Guardamos esses dados enquanto você atender. O detalhe está na{" "}
          <a href="/privacidade" style={{ color: T.teal700, fontWeight: 700 }}>Política de Privacidade</a>.
        </p>
      </Secao>

      <Secao n="10" titulo="Mudanças neste termo">
        <p style={{ margin: 0 }}>
          Cada versão tem data. Se o texto mudar, pedimos seu aceite de novo na próxima
          entrada, e você lê o que mudou antes de continuar. Versão atual: <strong>{VERSAO}</strong>.
        </p>
      </Secao>
    </PaginaLegal>
  );
}
```

- [ ] **Step 4: Registrar a entrada no `vite.config.ts`**

Dentro de `build.rollupOptions.input`, depois de `termos`:

```ts
        "termo-profissional": "termo-profissional.html",
```

- [ ] **Step 5: Servir a rota, em `server/server.ts`, junto das outras estáticas**

```ts
app.get("/termo-profissional", (_req, res) => res.sendFile(path.join(DIST, "termo-profissional.html")));
```

- [ ] **Step 6: Conferir que a página monta**

Run: `npx tsc -b && npm run build`
Expected: build verde, e `dist/termo-profissional.html` existe

- [ ] **Step 7: Commit**

```bash
git add termo-profissional.html src/termoProfissional vite.config.ts server/server.ts
git commit -m "feat(candidatura): Termo do Profissional versionado em /termo-profissional"
```

---

### Task 9: Página `/candidatura`

**Files:**
- Create: `candidatura.html`
- Create: `src/candidatura/main.tsx`
- Create: `src/candidatura/CandidaturaApp.tsx`
- Create: `src/candidatura/FormCandidatura.tsx`
- Create: `src/candidatura/StatusCandidatura.tsx`
- Modify: `vite.config.ts` · `server/server.ts` · `src/lib/data.ts`

**Interfaces:**
- Consumes: `supabase` de `src/lib/supabase.ts` · `useSession` de `src/conta/useSession.ts` · DS de `src/conta/ui.ts` · catálogos das Tasks 2 e 3 · `POST /api/candidatura` (Task 6).
- Produces: `minhaCandidatura(): Promise<Candidatura | null>` e `enviarCandidatura(dados): Promise<void>` em `src/lib/data.ts`.

- [ ] **Step 1: Adicionar as duas funções ao final de `src/lib/data.ts`**

```ts
// ─── Candidatura do profissional ─────────────────────────────────────────────

/** A candidatura do usuário logado, ou null. A RLS já limita ao dono. */
export async function minhaCandidatura(): Promise<Candidatura | null> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from("candidaturas")
    .select("*")
    .eq("profile_id", uid)
    .maybeSingle();

  if (error) throw error;
  return (data as Candidatura) ?? null;
}

/**
 * Envia ou reenvia a candidatura. Passa pelo servidor porque o IP do aceite do
 * termo só existe lá.
 */
export async function enviarCandidatura(dados: {
  nome_completo: string;
  cpf: string;
  telefone: string;
  conselho: string;
  registro: string;
  uf_conselho?: string;
  especialidade: string;
  cnpj?: string;
  bio?: string;
  horas_semana?: number;
  aceite_termo: boolean;
}): Promise<void> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre de novo.");

  const res = await fetch("/api/candidatura", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    let msg = `Não consegui enviar (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(msg);
  }
}
```

E acrescentar `Candidatura` à lista de tipos importados no topo do arquivo:

```ts
import type {
  Candidatura,
  Lead,
  Profile,
  // ...o resto continua igual
```

- [ ] **Step 2: Criar o HTML de entrada**

```html
<!-- candidatura.html -->
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quero atender — Revivaz</title>
    <meta name="description" content="Atenda de forma voluntária na Revivaz. Sem mensalidade, sem taxa por sessão e sem exigência de CNPJ." />
    <link rel="preload" as="font" href="/fonts/nunito-latin.woff2" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/fonts/nunito.css" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="/fonts/nunito.css" /></noscript>
    <style>
      a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid #00A8BF; outline-offset: 2px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/candidatura/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Criar o main**

```tsx
// src/candidatura/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import CandidaturaApp from "./CandidaturaApp";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><CandidaturaApp /></React.StrictMode>
);
```

- [ ] **Step 4: Criar a tela de status**

```tsx
// src/candidatura/StatusCandidatura.tsx
/**
 * O que o candidato vê depois de enviar. É esta tela que evita que toda dúvida
 * vire e-mail para o admin.
 */
import React from "react";
import { T, card, btnPrimary } from "../conta/ui";
import { LABEL_STATUS } from "../lib/candidaturaEstados";
import type { Candidatura } from "../lib/types";

export default function StatusCandidatura({
  candidatura,
  onCorrigir,
}: {
  candidatura: Candidatura;
  /** Só aparece em pendência: reabre o formulário para reenviar. */
  onCorrigir: () => void;
}): JSX.Element {
  const s = candidatura.status;

  const texto: Record<Candidatura["status"], string> = {
    recebida: "Recebemos sua candidatura. Vamos conferir seu registro no conselho.",
    em_analise: "Estamos conferindo seu registro no conselho.",
    pendencia: "Falta uma coisa para seguirmos.",
    aprovada: "Tudo certo. Você já pode atender.",
    recusada: "Não seguimos com sua candidatura desta vez.",
  };

  const cor = s === "aprovada" ? "#0E9F6E" : s === "recusada" ? "#B42318" : T.teal700;

  return (
    <section style={{ ...card, padding: 20 }} aria-label="Situação da sua candidatura">
      <div
        style={{
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 800,
          fontFamily: "'Nunito',sans-serif",
          color: cor,
          border: `1.5px solid ${cor}`,
          marginBottom: 12,
        }}
      >
        {LABEL_STATUS[s]}
      </div>

      <p style={{ fontSize: 16, color: T.gray950, lineHeight: 1.6, margin: "0 0 10px" }}>
        {texto[s]}
      </p>

      {candidatura.motivo && (
        <p
          style={{
            margin: "0 0 14px",
            padding: "10px 12px",
            borderRadius: 10,
            background: T.gray050,
            border: `1px solid ${T.gray200}`,
            fontSize: 14,
            color: T.gray700,
            lineHeight: 1.6,
          }}
        >
          {candidatura.motivo}
        </p>
      )}

      {s === "pendencia" && (
        <button onClick={onCorrigir} style={{ ...btnPrimary, width: "100%" }}>
          Corrigir e reenviar
        </button>
      )}

      {s === "aprovada" && (
        <a
          href="/profissional"
          style={{
            ...btnPrimary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            width: "100%",
          }}
        >
          Ir para a minha agenda
        </a>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Criar o formulário**

```tsx
// src/candidatura/FormCandidatura.tsx
/**
 * Formulário da candidatura. Valida com as MESMAS funções do servidor, para a
 * pessoa não descobrir o erro só depois de enviar.
 */
import React, { useState } from "react";
import { T, card, btnPrimary } from "../conta/ui";
import { ESPECIALIDADES, GRUPOS, type GrupoEspecialidade } from "../lib/especialidades";
import { CONSELHOS } from "../lib/conselhos";
import { cpfValido } from "../lib/documentos";
import { enviarCandidatura } from "../lib/data";

const rotulo: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: T.gray600,
  marginBottom: 4,
  fontFamily: "'Nunito',sans-serif",
};
const campo: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1.5px solid ${T.gray200}`,
  fontSize: 14,
  fontFamily: "'Nunito',sans-serif",
  marginBottom: 12,
  minHeight: 44,
  background: T.white,
  color: T.gray950,
};

export default function FormCandidatura({
  onEnviado,
}: {
  onEnviado: () => void;
}): JSX.Element {
  const [f, setF] = useState({
    nome_completo: "",
    cpf: "",
    telefone: "",
    conselho: "CRP",
    registro: "",
    uf_conselho: "",
    especialidade: "psicologia",
    cnpj: "",
    bio: "",
    horas_semana: "",
    aceite_termo: false,
  });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((atual) => ({ ...atual, [k]: v }));
  }

  async function enviar() {
    setErro("");
    if (f.nome_completo.trim().length < 3) return setErro("Diga seu nome completo.");
    if (!cpfValido(f.cpf)) return setErro("Confira o CPF.");
    if (f.telefone.replace(/\D/g, "").length < 10) return setErro("Confira o telefone com DDD.");
    if (f.registro.replace(/\D/g, "").length < 3) return setErro("Confira o número do registro.");
    if (!f.aceite_termo) return setErro("É preciso aceitar o Termo do Profissional.");

    setEnviando(true);
    try {
      await enviarCandidatura({
        nome_completo: f.nome_completo.trim(),
        cpf: f.cpf,
        telefone: f.telefone,
        conselho: f.conselho,
        registro: f.registro,
        uf_conselho: f.uf_conselho || undefined,
        especialidade: f.especialidade,
        cnpj: f.cnpj || undefined,
        bio: f.bio || undefined,
        horas_semana: f.horas_semana ? Number(f.horas_semana) : undefined,
        aceite_termo: true,
      });
      onEnviado();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui enviar agora.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section style={{ ...card, padding: 20 }} aria-label="Formulário de candidatura">
      <label style={rotulo} htmlFor="c-nome">Nome completo</label>
      <input id="c-nome" style={campo} value={f.nome_completo} onChange={(e) => set("nome_completo", e.target.value)} />

      <label style={rotulo} htmlFor="c-cpf">CPF</label>
      <input id="c-cpf" style={campo} value={f.cpf} onChange={(e) => set("cpf", e.target.value)} inputMode="numeric" placeholder="000.000.000-00" />

      <label style={rotulo} htmlFor="c-tel">Telefone com DDD</label>
      <input id="c-tel" style={campo} value={f.telefone} onChange={(e) => set("telefone", e.target.value)} inputMode="tel" placeholder="(11) 99999-9999" />

      <label style={rotulo} htmlFor="c-conselho">Conselho</label>
      <select id="c-conselho" style={campo} value={f.conselho} onChange={(e) => set("conselho", e.target.value)}>
        {CONSELHOS.map((c) => (
          <option key={c.sigla} value={c.sigla}>{c.sigla} — {c.nome}</option>
        ))}
      </select>

      <label style={rotulo} htmlFor="c-registro">Número do registro</label>
      <input id="c-registro" style={campo} value={f.registro} onChange={(e) => set("registro", e.target.value)} placeholder="06/12345" />

      <label style={rotulo} htmlFor="c-uf">UF do conselho</label>
      <input id="c-uf" style={campo} value={f.uf_conselho} onChange={(e) => set("uf_conselho", e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" />

      <label style={rotulo} htmlFor="c-esp">Especialidade</label>
      <select id="c-esp" style={campo} value={f.especialidade} onChange={(e) => set("especialidade", e.target.value)}>
        {(Object.keys(GRUPOS) as GrupoEspecialidade[]).map((g) => (
          <optgroup key={g} label={GRUPOS[g]}>
            {ESPECIALIDADES.filter((e) => e.grupo === g).map((e) => (
              <option key={e.valor} value={e.valor}>{e.label}</option>
            ))}
          </optgroup>
        ))}
      </select>

      <label style={rotulo} htmlFor="c-cnpj">CNPJ (opcional)</label>
      <input id="c-cnpj" style={campo} value={f.cnpj} onChange={(e) => set("cnpj", e.target.value)} inputMode="numeric" />

      <label style={rotulo} htmlFor="c-horas">Horas por semana que você pode oferecer</label>
      <input id="c-horas" style={campo} value={f.horas_semana} onChange={(e) => set("horas_semana", e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="4" />

      <label style={rotulo} htmlFor="c-bio">Uma linha sobre você (aparece para o paciente)</label>
      <textarea id="c-bio" style={{ ...campo, minHeight: 90 }} value={f.bio} onChange={(e) => set("bio", e.target.value)} />

      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 14, fontSize: 13, color: T.gray700, fontFamily: "'Nunito',sans-serif" }}>
        <input type="checkbox" checked={f.aceite_termo} onChange={(e) => set("aceite_termo", e.target.checked)} style={{ marginTop: 3 }} />
        <span>
          Li e aceito o{" "}
          <a href="/termo-profissional" target="_blank" rel="noopener noreferrer" style={{ color: T.teal700, fontWeight: 700 }}>
            Termo do Profissional
          </a>.
        </span>
      </label>

      {erro && (
        <p role="alert" style={{ margin: "0 0 12px", padding: "8px 10px", borderRadius: 8, background: "#FEE2E2", color: "#991B1B", fontSize: 13, fontWeight: 700 }}>
          {erro}
        </p>
      )}

      <button onClick={enviar} disabled={enviando} style={{ ...btnPrimary, width: "100%", opacity: enviando ? 0.7 : 1 }}>
        {enviando ? "Enviando…" : "Enviar candidatura"}
      </button>
    </section>
  );
}
```

- [ ] **Step 6: Criar a composição**

```tsx
// src/candidatura/CandidaturaApp.tsx
/**
 * Porta de entrada do profissional.
 *
 * Deslogado: a proposta e o link de acesso por e-mail.
 * Logado: o formulário, ou o status se já enviou.
 *
 * A demanda mostrada na vitrine é LIDA DO BANCO. Se for zero, a tela diz zero:
 * é o que evita a frustração que o concorrente colhe.
 */
import React, { useEffect, useState } from "react";
import { T, card, sectionTitle, btnPrimary } from "../conta/ui";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { minhaCandidatura } from "../lib/data";
import type { Candidatura } from "../lib/types";
import FormCandidatura from "./FormCandidatura";
import StatusCandidatura from "./StatusCandidatura";

const DIFERENCIAIS = [
  ["Sem mensalidade", "Você não paga nada para estar aqui."],
  ["Sem taxa por sessão", "Nenhum percentual é retido do atendimento."],
  ["Sem exigência de CNPJ", "Pessoa física atende normalmente."],
];

function Vitrine({ pedidosAbertos }: { pedidosAbertos: number | null }): JSX.Element {
  return (
    <>
      <h1 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 28, color: T.gray950, margin: "0 0 8px", lineHeight: 1.25 }}>
        Atenda quem não consegue pagar
      </h1>
      <p style={{ fontSize: 15, color: T.gray600, lineHeight: 1.65, margin: "0 0 20px" }}>
        A Revivaz conecta profissionais voluntários a quem precisa de saúde mental e não tem
        como pagar. Você escolhe quantas horas oferece.
      </p>

      <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
        {DIFERENCIAIS.map(([titulo, desc]) => (
          <div key={titulo} style={{ ...card, padding: 14 }}>
            <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15, color: T.gray950 }}>{titulo}</div>
            <div style={{ fontSize: 13, color: T.gray600, marginTop: 2 }}>{desc}</div>
          </div>
        ))}
      </div>

      {pedidosAbertos !== null && (
        <p style={{ fontSize: 13, color: T.gray600, lineHeight: 1.6, margin: "0 0 20px", padding: "10px 12px", background: T.gray050, border: `1px solid ${T.gray200}`, borderRadius: 10 }}>
          {pedidosAbertos === 0
            ? "Transparência: hoje não há nenhum pedido de consulta aguardando profissional. Estamos começando, e preferimos que você saiba disso antes de se candidatar."
            : `Hoje há ${pedidosAbertos} pedido${pedidosAbertos > 1 ? "s" : ""} de consulta aguardando profissional.`}
        </p>
      )}
    </>
  );
}

export default function CandidaturaApp(): JSX.Element {
  const [carregando, setCarregando] = useState(true);
  const [logado, setLogado] = useState(false);
  const [candidatura, setCandidatura] = useState<Candidatura | null>(null);
  const [corrigindo, setCorrigindo] = useState(false);
  const [pedidosAbertos, setPedidosAbertos] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const { data } = await supabase.auth.getSession();
      const temSessao = Boolean(data.session);
      setLogado(temSessao);
      if (temSessao) setCandidatura(await minhaCandidatura());

      const { count } = await supabase
        .from("consultas")
        .select("id", { count: "exact", head: true })
        .eq("status", "solicitada")
        .is("profissional_id", null);
      setPedidosAbertos(count ?? 0);
    } catch {
      setPedidosAbertos(null);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (!supabaseConfigured) {
      setCarregando(false);
      return;
    }
    void carregar();
  }, []);

  async function mandarLink() {
    setErro("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setErro("Confira o e-mail.");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/candidatura` },
    });
    if (error) return setErro("Não consegui enviar agora. Tente de novo em instantes.");
    setEnviado(true);
  }

  return (
    <div style={{ background: T.gray050, minHeight: "100dvh", fontFamily: "'Nunito',sans-serif" }}>
      <header style={{ background: T.white, borderBottom: `1px solid ${T.gray200}`, padding: "14px 20px" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href="/" style={{ fontWeight: 900, fontSize: 19, color: T.teal700, textDecoration: "none" }}>Revivaz</a>
          <a href="/" style={{ fontSize: 14, color: T.gray600, textDecoration: "none", fontWeight: 700 }}>Voltar ao site</a>
        </div>
      </header>

      <main style={{ maxWidth: 620, margin: "0 auto", padding: "24px 20px 60px" }}>
        {carregando ? (
          <p style={{ color: T.gray600 }}>Carregando…</p>
        ) : !logado ? (
          <>
            <Vitrine pedidosAbertos={pedidosAbertos} />
            <section style={{ ...card, padding: 20 }}>
              <h2 style={sectionTitle}>Quero atender</h2>
              {enviado ? (
                <p role="status" style={{ fontSize: 14, color: T.gray700, lineHeight: 1.6, margin: 0 }}>
                  Mandamos um link de acesso para <strong>{email}</strong>. Abra o e-mail e clique
                  para continuar a candidatura.
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: T.gray600, margin: "0 0 12px" }}>
                    Primeiro entre com seu e-mail. Depois você preenche seus dados e acompanha o
                    andamento por aqui mesmo.
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    aria-label="Seu e-mail"
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${T.gray200}`, fontSize: 14, minHeight: 44, marginBottom: 12, fontFamily: "'Nunito',sans-serif" }}
                  />
                  {erro && (
                    <p role="alert" style={{ margin: "0 0 10px", padding: "8px 10px", borderRadius: 8, background: "#FEE2E2", color: "#991B1B", fontSize: 13, fontWeight: 700 }}>
                      {erro}
                    </p>
                  )}
                  <button onClick={mandarLink} style={{ ...btnPrimary, width: "100%" }}>
                    Receber link de acesso
                  </button>
                </>
              )}
            </section>
          </>
        ) : candidatura && !corrigindo ? (
          <StatusCandidatura candidatura={candidatura} onCorrigir={() => setCorrigindo(true)} />
        ) : (
          <>
            <Vitrine pedidosAbertos={pedidosAbertos} />
            <FormCandidatura
              onEnviado={() => {
                setCorrigindo(false);
                void carregar();
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 7: Registrar a entrada e a rota**

Em `vite.config.ts`, dentro de `build.rollupOptions.input`:

```ts
        candidatura: "candidatura.html",
```

Em `server/server.ts`, junto das outras rotas estáticas:

```ts
app.get("/candidatura", (_req, res) => res.sendFile(path.join(DIST, "candidatura.html")));
```

- [ ] **Step 8: Conferir build e typecheck**

Run: `npx tsc -b && npm run build && npx vitest run`
Expected: tsc sem saída, build verde com `dist/candidatura.html`, todos os testes verdes

- [ ] **Step 9: Commit**

```bash
git add candidatura.html src/candidatura src/lib/data.ts vite.config.ts server/server.ts
git commit -m "feat(candidatura): página /candidatura com vitrine honesta e acompanhamento"
```

---

### Task 10: Aba Candidaturas no admin

**Files:**
- Create: `src/admin/sections/Candidaturas.tsx`
- Modify: `src/admin/AdminApp.tsx` (import + `TABS` + render)
- Modify: `src/lib/data.ts` (três funções ao final)

**Interfaces:**
- Consumes: `linkConsulta` (Task 2) · `LABEL_STATUS` (Task 3) · `labelEspecialidade` do catálogo · rotas da Task 7.
- Produces: `adminListCandidaturas(): Promise<Candidatura[]>` · `adminVerificarCandidatura(id): Promise<Record<string, unknown>>` · `adminDecidirCandidatura(id, acao, motivo?): Promise<void>`.

- [ ] **Step 1: Adicionar as três funções ao final de `src/lib/data.ts`**

```ts
/** Todas as candidaturas. A RLS de admin libera; o front só ordena. */
export async function adminListCandidaturas(): Promise<Candidatura[]> {
  const { data, error } = await supabase
    .from("candidaturas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Candidatura[];
}

async function postAdmin(caminho: string, corpo: unknown): Promise<Record<string, unknown>> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre de novo.");

  const res = await fetch(caminho, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(corpo),
  });
  if (!res.ok) {
    let msg = `Falhou (${res.status})`;
    try {
      const b = (await res.json()) as { error?: string };
      if (b?.error) msg = b.error;
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(msg);
  }
  return (await res.json()) as Record<string, unknown>;
}

/** Dispara a verificação de identidade. É evidência, não decisão. */
export async function adminVerificarCandidatura(id: string): Promise<Record<string, unknown>> {
  const r = await postAdmin(`/api/admin/candidatura/${id}/verificar`, {});
  return (r.verificacao ?? {}) as Record<string, unknown>;
}

export async function adminDecidirCandidatura(
  id: string,
  acao: "analisar" | "aprovar" | "recusar" | "pendencia",
  motivo?: string
): Promise<void> {
  await postAdmin(`/api/admin/candidatura/${id}/decidir`, { acao, motivo });
}
```

- [ ] **Step 2: Criar a seção**

```tsx
// src/admin/sections/Candidaturas.tsx
/**
 * Fila de candidaturas.
 *
 * A validação do registro é semiautomática: o botão abre a consulta oficial do
 * conselho JÁ COM O NÚMERO. Quem decide é o admin — a BigDataCorp aparece só
 * como evidência de identidade.
 */
import React, { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  adminListCandidaturas,
  adminVerificarCandidatura,
  adminDecidirCandidatura,
} from "../../lib/data";
import type { Candidatura } from "../../lib/types";
import { LABEL_STATUS } from "../../lib/candidaturaEstados";
import { linkConsulta } from "../../lib/conselhos";
import { labelEspecialidade } from "../../lib/especialidades";
import { T, card, sectionTitle, btnGhost, btnPrimary } from "../../conta/ui";

function fmt(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR");
}

function Ficha({
  c,
  onMudou,
}: {
  c: Candidatura;
  onMudou: () => void;
}): JSX.Element {
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");
  const consulta = linkConsulta(c.conselho, c.registro);
  const v = c.verificacao as { configurado?: boolean; nome?: string; situacao?: string; erro?: string };

  async function agir(acao: "analisar" | "aprovar" | "recusar" | "pendencia") {
    setErro("");
    if ((acao === "recusar" || acao === "pendencia") && motivo.trim().length < 5) {
      setErro("Escreva o motivo: é o que o candidato vai ler.");
      return;
    }
    setBusy(true);
    try {
      await adminDecidirCandidatura(c.id, acao, motivo.trim() || undefined);
      onMudou();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function verificar() {
    setErro("");
    setBusy(true);
    try {
      await adminVerificarCandidatura(c.id);
      onMudou();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui verificar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 16, color: T.gray950 }}>
            {c.nome_completo}
          </div>
          <div style={{ fontSize: 12, color: T.gray600, marginTop: 2 }}>
            {labelEspecialidade(c.especialidade)} · recebida em {fmt(c.created_at)}
          </div>
        </div>
        <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: T.teal050, color: T.teal700, fontFamily: "'Nunito',sans-serif" }}>
          {LABEL_STATUS[c.status]}
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13, color: T.gray600 }}>
        <span>{c.conselho} {c.registro}{c.uf_conselho ? `/${c.uf_conselho}` : ""}</span>
        <span>{c.telefone}</span>
        {c.cnpj && <span>CNPJ {c.cnpj}</span>}
        {c.horas_semana && <span>{c.horas_semana}h/semana</span>}
      </div>

      {c.bio && (
        <p style={{ margin: 0, fontSize: 13, color: T.gray700, lineHeight: 1.55 }}>{c.bio}</p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {consulta ? (
          <a href={consulta} target="_blank" rel="noopener noreferrer" style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, minHeight: 36, textDecoration: "none", color: T.teal700, border: `1.5px solid ${T.teal700}` }}>
            <ExternalLink size={13} aria-hidden="true" /> Conferir no {c.conselho}
          </a>
        ) : (
          <span style={{ fontSize: 12, color: T.gray600 }}>
            {c.conselho} não tem consulta pública: confira por fora.
          </span>
        )}

        <button onClick={verificar} disabled={busy} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, minHeight: 36 }}>
          <ShieldCheck size={13} aria-hidden="true" /> Verificar identidade
        </button>
      </div>

      {v && Object.keys(v).length > 0 && (
        <p style={{ margin: 0, fontSize: 12, color: T.gray600, background: T.gray050, border: `1px solid ${T.gray200}`, borderRadius: 8, padding: "8px 10px" }}>
          {v.configurado === false
            ? "Verificação de identidade não está ligada. Decida pela consulta do conselho."
            : v.erro
              ? `A verificação falhou: ${v.erro}. Decida pela consulta do conselho.`
              : `Identidade: ${v.nome ?? "sem nome"} · ${v.situacao ?? "sem situação"}`}
        </p>
      )}

      <textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo (obrigatório ao recusar ou pedir documento)"
        aria-label="Motivo da decisão"
        style={{ width: "100%", boxSizing: "border-box", minHeight: 60, padding: "8px 10px", borderRadius: 10, border: `1.5px solid ${T.gray200}`, fontSize: 13, fontFamily: "'Nunito',sans-serif" }}
      />

      {erro && (
        <p role="alert" style={{ margin: 0, padding: "8px 10px", borderRadius: 8, background: "#FEE2E2", color: "#991B1B", fontSize: 12, fontWeight: 700 }}>
          {erro}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {c.status === "recebida" && (
          <button onClick={() => agir("analisar")} disabled={busy} style={{ ...btnGhost, padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, minHeight: 36 }}>
            Pôr em análise
          </button>
        )}
        {(c.status === "em_analise" || c.status === "pendencia") && (
          <>
            <button onClick={() => agir("aprovar")} disabled={busy || c.status === "pendencia"} style={{ ...btnPrimary, padding: "8px 16px", fontSize: 12, minHeight: 36 }}>
              Aprovar
            </button>
            <button onClick={() => agir("pendencia")} disabled={busy || c.status === "pendencia"} style={{ ...btnGhost, padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, minHeight: 36 }}>
              Pedir documento
            </button>
            <button onClick={() => agir("recusar")} disabled={busy || c.status === "pendencia"} style={{ ...btnGhost, padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, minHeight: 36, color: "#B42318", border: "1.5px solid #B42318" }}>
              Recusar
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function Candidaturas(): JSX.Element {
  const [lista, setLista] = useState<Candidatura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      setLista(await adminListCandidaturas());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui carregar.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const abertas = lista.filter((c) => c.status === "recebida" || c.status === "em_analise").length;

  return (
    <section aria-label="Candidaturas de profissionais">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={sectionTitle}>Candidaturas{abertas > 0 ? ` (${abertas} aberta${abertas > 1 ? "s" : ""})` : ""}</h2>
        <button onClick={() => void carregar()} disabled={carregando} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, minHeight: 36 }}>
          <RefreshCw size={13} aria-hidden="true" /> Atualizar
        </button>
      </div>

      {erro && (
        <div role="alert" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: "#FEE2E2", color: "#991B1B", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
          <AlertTriangle size={15} aria-hidden="true" /> {erro}
        </div>
      )}

      {carregando ? (
        <p style={{ color: T.gray600, fontSize: 14 }}>Carregando…</p>
      ) : lista.length === 0 ? (
        <div role="status" style={{ ...card, padding: 28, textAlign: "center", color: T.gray600 }}>
          <p style={{ fontSize: 14, margin: 0 }}>Nenhuma candidatura ainda.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {lista.map((c) => (
            <Ficha key={c.id} c={c} onMudou={() => void carregar()} />
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Plugar no `src/admin/AdminApp.tsx`**

Adicionar o import junto dos outros de seção:

```tsx
import Candidaturas from "./sections/Candidaturas";
```

Trocar a linha do `TABS`:

```tsx
const TABS = ["Consultas", "Pedidos do site", "Candidaturas", "Profissionais", "Pacientes", "Métricas"] as const;
```

E adicionar o render junto dos outros:

```tsx
        {activeTab === "Candidaturas" && <Candidaturas />}
```

- [ ] **Step 4: Conferir build, typecheck e testes**

Run: `npx tsc -b && npx vitest run && npm run build`
Expected: tudo verde

- [ ] **Step 5: Commit**

```bash
git add src/admin/sections/Candidaturas.tsx src/admin/AdminApp.tsx src/lib/data.ts
git commit -m "feat(candidatura): aba Candidaturas no admin, com consulta do conselho em 1 clique"
```

---

### Task 11: Ligar a landing e fechar a volta

**Files:**
- Modify: `src/RevivazPreview.tsx` (o CTA do hero e o rodapé)

**Interfaces:**
- Consumes: a página `/candidatura` (Task 9) e `/termo-profissional` (Task 8).
- Produces: nada novo.

- [ ] **Step 1: Trocar o CTA "Quero ser voluntário" por um link para `/candidatura`**

Localizar a linha:

```tsx
                <button onClick={abrirCadastroProfissional} style={btnPrimary}>Quero ser voluntário</button>
```

e trocar por:

```tsx
                <a href="/candidatura" style={{ ...btnPrimary, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>Quero atender</a>
```

- [ ] **Step 2: Acrescentar o Termo do Profissional ao rodapé**

Localizar:

```tsx
              {[...NAV, ["Privacidade", "/privacidade"] as const, ["Termos de Uso", "/termos"] as const].map(([l, href]) => (
```

e trocar por:

```tsx
              {[...NAV, ["Privacidade", "/privacidade"] as const, ["Termos de Uso", "/termos"] as const, ["Termo do Profissional", "/termo-profissional"] as const].map(([l, href]) => (
```

- [ ] **Step 3: Limpar o que ficou órfão**

`abrirCadastroProfissional` e o estado `modoLead` só existiam para o modal de lead do profissional. Se nenhum outro ponto os usa, remover os dois e simplificar o modal de volta ao funil de paciente. Conferir antes:

Run: `grep -n "abrirCadastroProfissional\|modoLead" src/RevivazPreview.tsx`
Expected: só as definições, nenhum outro uso

- [ ] **Step 4: Conferir que a home não regrediu**

Run: `npx tsc -b && npm run build && npx vitest run`
Expected: tudo verde

- [ ] **Step 5: Commit**

```bash
git add src/RevivazPreview.tsx
git commit -m "feat(candidatura): o CTA do hero leva para a candidatura de verdade"
```

---

### Task 12: Atualizar a Política de Privacidade

**Files:**
- Modify: `src/privacidade/Privacidade.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: nada.

- [ ] **Step 1: Acrescentar a BigDataCorp à tabela de sub-processadores**

Na seção 5, dentro do `<tbody>` da tabela, acrescentar a linha:

```tsx
              <tr>
                <td style={td}>BigDataCorp</td>
                <td style={td}>
                  CPF e CNPJ de quem se candidata a atender, para conferir se o nome bate com o
                  documento. Não passa dado de paciente.
                </td>
              </tr>
```

- [ ] **Step 2: Acrescentar a linha do candidato à tabela da seção 2**

Dentro do `<tbody>` da tabela de dados coletados:

```tsx
              <tr>
                <td style={td}>Nome, CPF, telefone e registro do conselho</td>
                <td style={td}>Ao se candidatar para atender</td>
                <td style={td}>Conferir identidade e habilitação profissional</td>
              </tr>
```

- [ ] **Step 3: Acrescentar a retenção na seção 7**

Dentro da `<ul>`:

```tsx
            <li style={li}>
              <strong>Dados de quem se candidatou a atender:</strong> enquanto o profissional
              estiver ativo. Candidatura recusada é descartada em 12 meses.
            </li>
```

- [ ] **Step 4: Conferir**

Run: `npx tsc -b && npm run build`
Expected: verde

- [ ] **Step 5: Commit**

```bash
git add src/privacidade/Privacidade.tsx
git commit -m "docs(privacidade): consulta de identidade do candidato e retenção"
```

---

## Depois do plano

Antes de subir para produção, e cada um exige OK explícito do dono:

1. **Aplicar a migration 0010** no Supabase de produção.
2. **Criar os Docker secrets** `revivaz_bigdatacorp_token` e `revivaz_bigdatacorp_access_token` e referenciá-los no `docker-stack.yml` como `BIGDATACORP_TOKEN_FILE` e `BIGDATACORP_ACCESS_TOKEN_FILE`. Sem eles o sistema funciona: a verificação degrada.
3. **Deploy** com smoke em container antes de enviar a imagem.
4. **Levar o Termo do Profissional ao advogado** junto com `/termos` e `/privacidade`.
