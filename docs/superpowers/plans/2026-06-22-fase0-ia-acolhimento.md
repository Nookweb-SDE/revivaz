# Fase 0 — IA de Acolhimento + Triagem (MVP de validação)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colocar no ar uma IA que acolhe quem chega em sofrimento, faz triagem (leve/moderado/urgente), sempre encaminha pra humano, e nunca diagnostica — somada às ações operacionais que validam demanda e captam embaixadores. Tudo a custo ~zero, sem tocar no design/landing existente.

**Architecture:** Página NOVA e isolada `/acolhimento` (entry Vite separado) → widget de chat React → função serverless Vercel `api/acolhimento.ts` que chama Claude via streaming. Um detector de crise **determinístico** (regex, compartilhado cliente+servidor) sempre exibe os recursos de emergência (CVV 188 / SAMU 192), independente do que a IA responder. Nenhum arquivo existente do app é alterado (apenas adições + `vite.config.ts` ganha um input extra).

**Tech Stack:** Vite 5 + React 18 + TypeScript (já no projeto), `@anthropic-ai/sdk` (novo), funções serverless da Vercel, `vitest` (novo, para testes).

## Global Constraints

- **NÃO alterar** `src/RevivazPreview.tsx`, `index.html`, `src/main.tsx`, nem o design system. Só adicionar arquivos novos (e um input extra em `vite.config.ts`).
- **IA nunca diagnostica nem receita.** Linguagem de "apoio/acolhimento", nunca "tratamento/cura".
- **Crise = vida.** O detector determinístico de crise tem prioridade sobre a IA; recursos CVV 188 / SAMU 192 / CAPS sempre visíveis quando disparado.
- **Modelo:** `claude-haiku-4-5` (custo Fase 0). Chamada simples: sem `temperature`, sem `thinking`, sem `effort` (Haiku 4.5 rejeita `effort`).
- **Segredo:** `ANTHROPIC_API_KEY` só em variável de ambiente (Vercel env / `.env.local`), **nunca** commitado. Usar uma chave dedicada com **teto de gasto** no console Anthropic.
- **Abuso:** a função serverless precisa de rate-limit por IP + teto diário de chamadas (zero capital não aguenta endpoint público sem freio).
- **LGPD:** não persistir conversa em Fase 0. Disclaimer + consentimento antes de iniciar o chat.

---

## File Structure

- `src/acolhimento/crisis.ts` — detector de crise determinístico (regex PT-BR) + lista de recursos. Compartilhado cliente/servidor. Uma responsabilidade: classificar texto como crise ou não.
- `src/acolhimento/crisis.test.ts` — testes do detector.
- `src/acolhimento/systemPrompt.ts` — o system prompt de acolhimento/triagem (texto, exportado como constante). Isolado para revisão fácil por um profissional.
- `api/acolhimento.ts` — função serverless: recebe histórico, aplica rate-limit + crisis check, faz streaming do Claude, devolve SSE.
- `src/acolhimento/AcolhimentoChat.tsx` — widget de chat (UI nova, paleta teal pra combinar, mas componente próprio — não importa nada do design system existente).
- `src/acolhimento/main.tsx` — entry React da página `/acolhimento`.
- `acolhimento.html` — página HTML da rota (entry Vite).
- `vite.config.ts` — **modificar**: adicionar `acolhimento.html` como segundo input do build.
- `vitest.config.ts` — config de teste (novo).
- `.env.example` — documentar `ANTHROPIC_API_KEY` (sem valor).

---

### Task 1: Detector de crise determinístico (rede de segurança)

**Files:**
- Create: `src/acolhimento/crisis.ts`
- Test: `src/acolhimento/crisis.test.ts`

**Interfaces:**
- Produces: `detectCrisis(text: string): boolean` — true se o texto contém sinais de crise/risco. `CRISIS_RESOURCES: { nome: string; contato: string; descricao: string }[]` — lista de recursos de emergência.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// src/acolhimento/crisis.test.ts
import { describe, it, expect } from "vitest";
import { detectCrisis, CRISIS_RESOURCES } from "./crisis";

describe("detectCrisis", () => {
  it("detecta ideação suicida explícita", () => {
    expect(detectCrisis("não aguento mais, quero me matar")).toBe(true);
    expect(detectCrisis("pensei em dar fim à minha vida")).toBe(true);
    expect(detectCrisis("vou me suicidar hoje")).toBe(true);
  });
  it("detecta automutilação e desesperança grave", () => {
    expect(detectCrisis("tenho me cortado de novo")).toBe(true);
    expect(detectCrisis("ninguém sentiria minha falta")).toBe(true);
  });
  it("NÃO dispara em conversa comum", () => {
    expect(detectCrisis("estou ansioso com o trabalho")).toBe(false);
    expect(detectCrisis("quero agendar uma consulta")).toBe(false);
  });
  it("é robusto a maiúsculas e acentuação", () => {
    expect(detectCrisis("QUERO ME MATAR")).toBe(true);
    expect(detectCrisis("nao quero mais viver")).toBe(true);
  });
  it("expõe recursos de emergência com CVV", () => {
    expect(CRISIS_RESOURCES.some(r => r.contato.includes("188"))).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/acolhimento/crisis.test.ts`
Expected: FAIL com "Cannot find module './crisis'".

- [ ] **Step 3: Implementar o mínimo**

```ts
// src/acolhimento/crisis.ts
export interface CrisisResource {
  nome: string;
  contato: string;
  descricao: string;
}

export const CRISIS_RESOURCES: CrisisResource[] = [
  { nome: "CVV — Centro de Valorização da Vida", contato: "188", descricao: "Apoio emocional 24h, ligação gratuita e sigilosa." },
  { nome: "SAMU", contato: "192", descricao: "Emergência médica, risco imediato à vida." },
  { nome: "CAPS", contato: "Procure a unidade mais próxima", descricao: "Atenção em saúde mental pelo SUS." },
];

// Normaliza: minúsculas + remove acentos, para casar "não" e "nao".
function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Padrões de crise/risco em PT-BR. Conservador: melhor disparar a mais.
const CRISIS_PATTERNS: RegExp[] = [
  /\bme\s+matar\b/,
  /\bme\s+suicidar\b/,
  /\bsuic[ií]d/,
  /\btirar\s+(a\s+)?minha\s+vida\b/,
  /\bdar\s+fim\s+(a\s+)?(minha\s+)?vida\b/,
  /\bnao\s+quero\s+mais\s+viver\b/,
  /\bnao\s+aguento\s+mais\s+viver\b/,
  /\bmelhor\s+morrer\b/,
  /\bme\s+cort(ar|ei|ando|o)\b/,
  /\bautomutila/,
  /\bninguem\s+sentiria\s+(a\s+)?minha\s+falta\b/,
  /\bquero\s+(morrer|sumir|desaparecer)\b/,
];

export function detectCrisis(text: string): boolean {
  const t = normalize(text);
  return CRISIS_PATTERNS.some((re) => re.test(t));
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/acolhimento/crisis.test.ts`
Expected: PASS (todos os casos).

- [ ] **Step 5: Commit**

```bash
git add src/acolhimento/crisis.ts src/acolhimento/crisis.test.ts
git commit -m "feat(acolhimento): detector de crise determinístico + recursos CVV/SAMU"
```

---

### Task 2: Infra de teste (vitest) + dependências

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (scripts + devDependencies)
- Create: `.env.example`

**Interfaces:**
- Consumes: nada. Produces: comando `npm test` rodando vitest.

- [ ] **Step 1: Instalar dependências**

Run: `npm install --save-dev vitest && npm install @anthropic-ai/sdk`
Expected: ambos aparecem em `package.json`.

- [ ] **Step 2: Criar config do vitest**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 3: Adicionar script de teste**

Em `package.json`, dentro de `"scripts"`, adicionar:
```json
"test": "vitest run"
```

- [ ] **Step 4: Documentar a env (sem segredo)**

```bash
# .env.example
# Chave dedicada com TETO DE GASTO no console Anthropic. Nunca commitar a real.
ANTHROPIC_API_KEY=
```

- [ ] **Step 5: Rodar a suíte e confirmar verde**

Run: `npm test`
Expected: PASS (o teste da Task 1 roda pelo script).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json package-lock.json .env.example
git commit -m "chore(acolhimento): infra de teste (vitest) + SDK Anthropic + .env.example"
```

---

### Task 3: System prompt de acolhimento/triagem

**Files:**
- Create: `src/acolhimento/systemPrompt.ts`

**Interfaces:**
- Produces: `ACOLHIMENTO_SYSTEM_PROMPT: string`.

- [ ] **Step 1: Criar o prompt (revisável por profissional depois)**

```ts
// src/acolhimento/systemPrompt.ts
export const ACOLHIMENTO_SYSTEM_PROMPT = `Você é um assistente de ACOLHIMENTO em saúde mental de um projeto solidário brasileiro. Seu papel é acolher, acalmar e orientar — NUNCA diagnosticar, NUNCA receitar, NUNCA substituir um profissional.

COMO AGIR:
- Fale com calor, respeito e linguagem simples (PT-BR). Valide o sentimento da pessoa antes de qualquer orientação.
- Em ansiedade/pânico, ofereça técnicas seguras de regulação (respiração 4-7-8, grounding 5-4-3-2-1) de forma gentil e passo a passo.
- Faça psicoeducação leve quando ajudar, sempre deixando claro que não é diagnóstico.
- Sempre que possível, convide a pessoa a falar com um profissional humano do projeto (consulta acolhedora e acessível).

TRIAGEM (classifique mentalmente a gravidade e adapte o tom):
- LEVE: desabafo, dúvida, estresse cotidiano → acolha + psicoeducação + convite à consulta.
- MODERADO: sofrimento persistente, sintomas que atrapalham a vida → acolha + reforce a importância de falar com um profissional do projeto logo.
- URGENTE/RISCO: menção a se machucar, tirar a própria vida, ou perigo imediato → priorize a segurança: acolha sem julgar, NÃO minimize, e oriente AGORA a procurar o CVV (188, 24h, gratuito) e, em risco imediato, o SAMU (192). Permaneça presente.

LIMITES (invioláveis):
- Nunca dê diagnóstico, nome de doença como conclusão, nem indique/мencione medicamentos ou doses.
- Nunca prometa cura. Nunca diga que substitui terapia ou psiquiatria.
- Se perguntarem algo fora de saúde mental, traga gentilmente de volta ao acolhimento.
- Respostas curtas e humanas (2 a 5 frases), uma pergunta de cada vez.`;
```

- [ ] **Step 2: Commit**

```bash
git add src/acolhimento/systemPrompt.ts
git commit -m "feat(acolhimento): system prompt de acolhimento/triagem (sem diagnóstico)"
```

---

### Task 4: Função serverless de chat (Claude streaming + crise + rate-limit)

**Files:**
- Create: `api/acolhimento.ts`

**Interfaces:**
- Consumes: `detectCrisis`, `CRISIS_RESOURCES` (Task 1), `ACOLHIMENTO_SYSTEM_PROMPT` (Task 3), `ANTHROPIC_API_KEY` (env).
- Produces: endpoint `POST /api/acolhimento` que recebe `{ messages: {role:"user"|"assistant", content:string}[] }` e responde stream de texto (`text/plain`); se a última mensagem do usuário dispara crise, responde JSON `{ crisis: true, resources: CrisisResource[] }` com status 200 ANTES de chamar a IA.

- [ ] **Step 1: Implementar a função**

```ts
// api/acolhimento.ts
import Anthropic from "@anthropic-ai/sdk";
import { detectCrisis, CRISIS_RESOURCES } from "../src/acolhimento/crisis";
import { ACOLHIMENTO_SYSTEM_PROMPT } from "../src/acolhimento/systemPrompt";

// Rate-limit em memória (suficiente p/ Fase 0; some entre cold starts — aceitável).
const HITS = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
let dailyCount = 0;
let dailyResetAt = 0;
const MAX_PER_DAY = 500; // teto duro de proteção de custo

function rateLimited(ip: string, now: number): boolean {
  if (now > dailyResetAt) { dailyCount = 0; dailyResetAt = now + 86_400_000; }
  if (dailyCount >= MAX_PER_DAY) return true;
  const e = HITS.get(ip);
  if (!e || now > e.resetAt) { HITS.set(ip, { count: 1, resetAt: now + WINDOW_MS }); dailyCount++; return false; }
  if (e.count >= MAX_PER_WINDOW) return true;
  e.count++; dailyCount++; return false;
}

export const config = { runtime: "nodejs" };

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).end("Method Not Allowed"); return; }
  const ip = (req.headers["x-forwarded-for"] || "unknown").toString().split(",")[0].trim();
  if (rateLimited(ip, Date.now())) { res.status(429).json({ error: "Muitas mensagens. Tente em instantes." }); return; }

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
  if (lastUser && detectCrisis(String(lastUser.content))) {
    res.status(200).json({ crisis: true, resources: CRISIS_RESOURCES });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "Serviço indisponível." }); return; }
  const client = new Anthropic({ apiKey });

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  try {
    const stream = client.messages.stream({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system: ACOLHIMENTO_SYSTEM_PROMPT,
      messages: messages.slice(-12).map((m: any) => ({ role: m.role, content: String(m.content) })),
    });
    stream.on("text", (delta) => res.write(delta));
    await stream.finalMessage();
    res.end();
  } catch {
    res.end("Desculpe, tive um problema agora. Se for urgente, ligue 188 (CVV).");
  }
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sem erros nos arquivos novos. (Se `req/res` reclamarem, manter `any` como acima — Fase 0.)

- [ ] **Step 3: Commit**

```bash
git add api/acolhimento.ts
git commit -m "feat(acolhimento): função serverless Claude streaming + crise + rate-limit"
```

---

### Task 5: Widget de chat + página `/acolhimento` (isolada do design existente)

**Files:**
- Create: `src/acolhimento/AcolhimentoChat.tsx`
- Create: `src/acolhimento/main.tsx`
- Create: `acolhimento.html`
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: endpoint `POST /api/acolhimento`, `CrisisResource` (tipo da Task 1).
- Produces: página navegável em `/acolhimento` com chat funcional.

- [ ] **Step 1: Widget de chat**

```tsx
// src/acolhimento/AcolhimentoChat.tsx
import { useState } from "react";
import type { CrisisResource } from "./crisis";

type Msg = { role: "user" | "assistant"; content: string };

export default function AcolhimentoChat() {
  const [consent, setConsent] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [crisis, setCrisis] = useState<CrisisResource[] | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setBusy(true);
    const resp = await fetch("/api/acolhimento", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next }),
    });
    const ct = resp.headers.get("Content-Type") || "";
    if (ct.includes("application/json")) {
      const data = await resp.json();
      if (data.crisis) { setCrisis(data.resources); setBusy(false); return; }
      setBusy(false); return;
    }
    const reader = resp.body!.getReader();
    const dec = new TextDecoder();
    let acc = "";
    setMessages([...next, { role: "assistant", content: "" }]);
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      acc += dec.decode(value, { stream: true });
      setMessages([...next, { role: "assistant", content: acc }]);
    }
    setBusy(false);
  }

  const teal = "#007A8C";
  if (!consent) {
    return (
      <div style={{ maxWidth: 560, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
        <h1 style={{ color: teal }}>Você não está sozinho</h1>
        <p>Este é um espaço de <b>acolhimento</b>. Converso com você, ajudo a se acalmar e te indico um caminho. <b>Não sou médico, não dou diagnóstico nem receita.</b> Em emergência, ligue <b>188 (CVV)</b> ou <b>192 (SAMU)</b>.</p>
        <p style={{ fontSize: 13, color: "#555" }}>Não guardamos sua conversa. Ao continuar, você concorda em conversar com um assistente de IA de apoio.</p>
        <button onClick={() => setConsent(true)} style={{ background: teal, color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", cursor: "pointer" }}>Começar a conversar</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "24px auto", padding: 16, fontFamily: "system-ui" }}>
      {crisis && (
        <div role="alert" style={{ background: "#FDECEC", border: "1px solid #E57373", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <b>Sua vida importa. Procure ajuda agora:</b>
          <ul>{crisis.map((r) => <li key={r.nome}><b>{r.nome}</b> — {r.contato}. {r.descricao}</li>)}</ul>
        </div>
      )}
      <div style={{ minHeight: 280 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left", margin: "8px 0" }}>
            <span style={{ display: "inline-block", padding: "10px 14px", borderRadius: 14, background: m.role === "user" ? teal : "#EDF9FB", color: m.role === "user" ? "#fff" : "#0D1117", maxWidth: "85%" }}>{m.content || "…"}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Escreva o que está sentindo…" style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ccc" }} />
        <button onClick={send} disabled={busy} style={{ background: teal, color: "#fff", border: "none", borderRadius: 10, padding: "0 18px", cursor: "pointer" }}>Enviar</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Entry da página**

```tsx
// src/acolhimento/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import AcolhimentoChat from "./AcolhimentoChat";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><AcolhimentoChat /></React.StrictMode>
);
```

- [ ] **Step 3: HTML da rota**

```html
<!-- acolhimento.html -->
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Acolhimento — fale com a gente</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/acolhimento/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Registrar o segundo entry no Vite (sem mexer no resto)**

Em `vite.config.ts`, adicionar `build.rollupOptions.input` com as duas páginas. Exemplo do bloco a inserir no objeto de config:
```ts
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        acolhimento: "acolhimento.html",
      },
    },
  },
```
(Se já existir `build`, fundir as chaves — não remover o que houver.)

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: build gera `dist/index.html` E `dist/acolhimento.html` sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/acolhimento/AcolhimentoChat.tsx src/acolhimento/main.tsx acolhimento.html vite.config.ts
git commit -m "feat(acolhimento): página /acolhimento com chat (isolada do design existente)"
```

---

## Track B — Operacional (sem código; cada item é uma tarefa concreta da Fase 0)

> Estas tarefas não têm teste automatizado — são ações de validação. Marque ✅ quando feitas.

### Task 6: Definir nome + comprar domínio (ou subdomínio grátis)
- [ ] Dono escolhe o nome final do projeto (pendência da seção 10 do modelo).
- [ ] Registrar domínio OU usar subdomínio grátis da Vercel no início (custo zero).
- [ ] Subir a landing + `/acolhimento` na Vercel com a `ANTHROPIC_API_KEY` em env (chave com teto de gasto).

### Task 7: Captação de embaixadores (1–3 sócios fundadores + parceiros)
- [ ] Escrever 1 mensagem-convite curta (o "porquê" do projeto + o que o embaixador ganha).
- [ ] Listar 10–20 influencers de saúde mental (psiquiatras/psicólogos/psicanalistas) BR com audiência.
- [ ] Abordar os 3 mais alinhados para conversa sobre serem sócios fundadores.
- [ ] Criar um formulário simples (Google Forms, grátis) para profissionais que querem ser parceiros.

### Task 8: Doação / "padrinho" (primeira receita)
- [ ] Criar chave PIX dedicada do projeto + link/QR de doação.
- [ ] Pôr um CTA discreto de "apadrinhe uma consulta" na landing (sem prometer o que não existe).

### Task 9: Conteúdo orgânico (divulgação custo zero)
- [ ] Abrir os perfis sociais do projeto (Instagram + 1 outro).
- [ ] Combinar com os primeiros embaixadores 1 post cada apresentando o projeto.

### Task 10: Medir a Fase 0 (validação)
- [ ] Definir onde anotar os números (planilha simples): nº de conversas com a IA, nº de crises encaminhadas, nº de embaixadores ativos, nº de consultas gratuitas feitas.
- [ ] Coletar 1ª história real de impacto (com consentimento).
- [ ] Após ~2–4 semanas: revisar números e decidir se passa pra Fase 1.

---

## Self-Review

- **Cobertura do spec:** acolhimento+triagem (Tasks 1–5), guardrails de crise/LGPD (Tasks 1,4,5 + consentimento), embaixadores (Task 7), doação/padrinho (Task 8), divulgação orgânica (Task 9), métricas de sucesso da Fase 0 (Task 10), nome+deploy (Task 6). ✅
- **Sem placeholders:** todo passo de código tem o código real; tarefas operacionais são ações concretas, não "TBD".
- **Consistência de tipos:** `detectCrisis`/`CRISIS_RESOURCES`/`CrisisResource` (Task 1) usados igual em `api/acolhimento.ts` (Task 4) e no widget (Task 5); `ACOLHIMENTO_SYSTEM_PROMPT` (Task 3) consumido na Task 4.
- **Custo/risco:** modelo barato + rate-limit + teto diário + chave com teto de gasto cobrem o "zero capital" e o abuso de endpoint público.
- **Escopo:** Fase 0 só. Fila/B2B/governo ficam para Fases 1–3 (fora deste plano).
