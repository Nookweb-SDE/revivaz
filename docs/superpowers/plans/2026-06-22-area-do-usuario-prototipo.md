# Área do Usuário (Paciente) — Protótipo Visual · Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Para as tarefas de UI (Task 2+), o implementador PODE usar a skill `frontend-design:frontend-design` pra produzir JSX polido, sempre respeitando os tokens de `src/conta/ui.ts` e os dados de `src/conta/sampleData.ts`.

**Goal:** Construir a página `/conta` — a "minha conta" do paciente — como protótipo visual completo e polido, com dados de exemplo, mobile-first, sem backend.

**Architecture:** Entry Vite novo e isolado (`conta.html` → `src/conta/main.tsx` → `ContaApp`). `ContaApp` compõe seções de `src/conta/sections/*`, lendo dados de `src/conta/sampleData.ts` e estilos de `src/conta/ui.ts`. Tudo client-side, estado local (useState) para interações mock. Nada de fetch/backend.

**Tech Stack:** React 18 + TypeScript + `lucide-react` (já no projeto), Vite 5, estilos inline via tokens em `ui.ts`. Testes: `vitest` (já no projeto).

## Global Constraints

- NÃO alterar `src/RevivazPreview.tsx`, `index.html`, `src/main.tsx`, `src/acolhimento/*`, nem o design system. Só CRIAR arquivos novos em `src/conta/` + `conta.html`, e MODIFICAR só `vite.config.ts` (adicionar 3º input).
- **Mobile-first**: coluna única; em telas ≥ 720px centralizar o conteúdo (max-width ~560–720px).
- **Identidade**: paleta teal/navy, fonte `'Nunito'`, cards arredondados (radius 12–20), sombras suaves — coerente com a landing.
- **Sem backend, sem fetch, sem libs novas.** Ações (entrar/baixar/reenviar/remarcar) são mock (ex.: `alert`/estado local).
- **Barra de crise 188 (CVV) / 192 (SAMU) SEMPRE visível** (rodapé fixo).
- **Dados fictícios** — nenhum PII real em `sampleData.ts`.
- **A11y**: `aria-label` em botões de ícone; contraste adequado; navegável por teclado.
- Build deve gerar `dist/index.html` + `dist/acolhimento.html` + `dist/conta.html` sem quebrar os existentes.

---

### Task 1: Fundação — tokens, dados mock, wiring do entry

**Files:**
- Create: `src/conta/ui.ts`, `src/conta/sampleData.ts`, `src/conta/sampleData.test.ts`, `src/conta/ContaApp.tsx`, `src/conta/main.tsx`, `conta.html`
- Modify: `vite.config.ts`

**Interfaces — Produces (contrato que todas as seções consomem):**

```ts
// src/conta/ui.ts
export const T = {
  teal900: "#004D5C", teal700: "#007A8C", teal500: "#00A8BF", teal300: "#00BFD8",
  teal100: "#D6F4F8", teal050: "#EDF9FB", navy: "#0B1D3A",
  green500: "#4CAF50", red: "#E5484D",
  gray950: "#0D1117", gray700: "#374151", gray600: "#4B5563", gray200: "#E5E7EB",
  gray100: "#F3F4F6", gray050: "#F9FAFB", white: "#FFFFFF",
};
export const card: React.CSSProperties = {
  background: T.white, borderRadius: 16, padding: 16,
  boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: `1px solid ${T.gray200}`,
};
export const sectionTitle: React.CSSProperties = {
  fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 16,
  color: T.gray950, margin: "0 0 12px",
};
export const btnPrimary: React.CSSProperties = {
  background: T.teal700, color: T.white, border: "none", borderRadius: 12,
  padding: "12px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
  fontFamily: "inherit", minHeight: 44,
};
export const btnGhost: React.CSSProperties = {
  background: "transparent", color: T.teal700, border: "none",
  fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
};
```

```ts
// src/conta/sampleData.ts — tipos exportados
export type Consulta = {
  id: string; profissional: string; especialidade: string; avatar: string;
  data: string; hora: string; tipo: "online" | "presencial";
  status: "agendada" | "realizada" | "cancelada"; emDias?: number;
  avaliada?: boolean;
};
export type Receita = { id: string; profissional: string; data: string; resumo: string };
export type SessaoIA = { id: string; data: string; resumo: string; ultimoTrecho: string };
export type Usuario = {
  nome: string; emergenciaNome: string; emergenciaTel: string;
  preferencias: { lembretes: boolean; modalidade: "online" | "presencial" };
};
export const usuario: Usuario;
export const consultas: Consulta[];      // ≥1 agendada (próxima) + ≥2 passadas (1 realizada não-avaliada)
export const receitas: Receita[];        // ≥2
export const sessoesIA: SessaoIA[];       // ≥2
export const humorSemana: number[];       // 7 números 0..4 (seg→dom)
```

- [ ] **Step 1: Escrever o teste de dados (falha)**

```ts
// src/conta/sampleData.test.ts
import { describe, it, expect } from "vitest";
import { usuario, consultas, receitas, sessoesIA, humorSemana } from "./sampleData";

describe("sampleData", () => {
  it("usuario tem nome e contato de emergência", () => {
    expect(usuario.nome).toBeTruthy();
    expect(usuario.emergenciaTel).toBeTruthy();
  });
  it("tem ao menos 1 consulta agendada e 1 realizada", () => {
    expect(consultas.some(c => c.status === "agendada")).toBe(true);
    expect(consultas.some(c => c.status === "realizada")).toBe(true);
  });
  it("tem receitas e sessões de IA", () => {
    expect(receitas.length).toBeGreaterThan(0);
    expect(sessoesIA.length).toBeGreaterThan(0);
  });
  it("humorSemana tem 7 valores entre 0 e 4", () => {
    expect(humorSemana).toHaveLength(7);
    expect(humorSemana.every(n => n >= 0 && n <= 4)).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/conta/sampleData.test.ts` → FAIL (módulo não existe).

- [ ] **Step 3: Criar `ui.ts` (acima) e `sampleData.ts`** com os tipos acima e dados fictícios coerentes: usuário "Maria S.", 1 consulta agendada (Dra. Paula L., Psicologia, emDias 2, online), ≥2 passadas (uma `realizada` com `avaliada:false`, uma `cancelada`), ≥2 receitas, ≥2 sessões de IA com resumo+último trecho, `humorSemana` = `[1,2,2,3,1,3,4]`. Avatares = iniciais (ex.: "PL").

- [ ] **Step 4: Rodar e ver passar** — `npx vitest run src/conta/sampleData.test.ts` → PASS (4 testes).

- [ ] **Step 5: Wiring do entry.** Criar:
  - `src/conta/ContaApp.tsx` — shell mínimo por enquanto: `export default function ContaApp(){ return <div style={{fontFamily:"'Nunito',sans-serif"}}><h1>Olá, {usuario.nome}</h1></div>; }` (importa `usuario`).
  - `src/conta/main.tsx` — igual ao `src/acolhimento/main.tsx`, renderizando `<ContaApp/>`.
  - `conta.html` — copiar a estrutura de `acolhimento.html`, `<title>Minha conta — Revivaz</title>`, script `/src/conta/main.tsx`.
  - `vite.config.ts` — adicionar `conta: "conta.html"` ao `build.rollupOptions.input` (MERGE, manter `main` e `acolhimento`).

- [ ] **Step 6: Build verifica 3 páginas** — `npm run build` → confirmar `dist/index.html`, `dist/acolhimento.html`, `dist/conta.html` (`ls dist/*.html`).

- [ ] **Step 7: Commit** — `git add src/conta conta.html vite.config.ts && git commit -m "feat(conta): fundação (tokens, dados mock, entry /conta)"`

---

### Task 2: Seção "Próxima consulta" (destaque) + estado vazio

**Files:** Create `src/conta/sections/ProximaConsulta.tsx`. Consumes `Consulta`, `usuario`, tokens de `ui.ts`.
**Interfaces — Produces:** `export default function ProximaConsulta({ consulta }: { consulta?: Consulta }): JSX.Element`

Card destaque (fundo navy ou teal-gradiente, texto claro) mostrando: avatar (iniciais), `profissional` · `especialidade`, `data` · `hora`, badge "em {emDias} dias", badge tipo (online/presencial), botão grande **Entrar na consulta** (online) — `onClick` mock (`alert("Abrindo teleconsulta…")`), e ações ghost **Remarcar** · **Cancelar** (mock). Se `consulta` for `undefined`: estado vazio acolhedor ("Você não tem consulta marcada") + botões "Agendar consulta" e "Conversar com a IA" (link `/acolhimento`).

- [ ] **Step 1:** Implementar o componente seguindo os tokens e o layout acima (mobile-first, botão full-width no mobile). Ícones lucide (`Calendar`, `Clock`, `Video`, `MapPin`).
- [ ] **Step 2:** Verificar typecheck/build — `npx tsc --noEmit -p tsconfig.json` (sem erros novos) e `npm run build` OK.
- [ ] **Step 3: Commit** — `git commit -am "feat(conta): seção próxima consulta + estado vazio"`

---

### Task 3: Chrome fixo — Header + Atalhos + Barra de crise

**Files:** Create `src/conta/sections/Header.tsx`, `src/conta/sections/Atalhos.tsx`, `src/conta/CriseBar.tsx`. Consumes `usuario`, tokens.
**Interfaces — Produces:**
- `export default function Header({ nome }: { nome: string }): JSX.Element`
- `export default function Atalhos(): JSX.Element`
- `export default function CriseBar(): JSX.Element`

- **Header:** logo "Revivaz" (texto, teal700, peso 900) + "Olá, {nome} 👋" + ícone perfil (`User`/`Settings`) com `aria-label`. Sticky no topo.
- **Atalhos:** grid 2×2 de tiles (Conversa IA→`/acolhimento`, Receitas, Humor, Autocuidado), cada um ícone lucide + label, fundo teal050, radius 12.
- **CriseBar:** rodapé **fixo** (position: fixed, bottom 0), fundo escuro/vermelho suave, "🆘 Emergência: 188 (CVV) · 192 (SAMU)" sempre visível. `ContaApp` deve reservar padding-bottom pra não cobrir conteúdo.

- [ ] **Step 1:** Implementar os 3 componentes com tokens.
- [ ] **Step 2:** Verificar `npx tsc --noEmit` + `npm run build` OK.
- [ ] **Step 3: Commit** — `git commit -am "feat(conta): header, atalhos e barra de crise fixa"`

---

### Task 4: Seção "Minhas consultas" (abas Próximas/Passadas)

**Files:** Create `src/conta/sections/ListaConsultas.tsx`. Consumes `Consulta[]`, tokens.
**Interfaces — Produces:** `export default function ListaConsultas({ consultas }: { consultas: Consulta[] }): JSX.Element`

Título "Minhas consultas" + abas pill **Próximas / Passadas** (estado local `useState`). Próximas = `status==="agendada"`; Passadas = `realizada`/`cancelada`. Item (linha card): avatar, `profissional` · `especialidade`, `data` · `hora`, badge de status colorido (agendada=teal, realizada=verde, cancelada=cinza), ação contextual ghost (Próximas→"Entrar"/"Remarcar"; Passadas realizada→"Ver resumo", cancelada→"Reagendar") — todas mock.

- [ ] **Step 1:** Implementar com abas e filtro por status.
- [ ] **Step 2:** Verificar `npx tsc --noEmit` + `npm run build` OK.
- [ ] **Step 3: Commit** — `git commit -am "feat(conta): lista de consultas com abas"`

---

### Task 5: Seção "Receitas"

**Files:** Create `src/conta/sections/Receitas.tsx`. Consumes `Receita[]`, tokens.
**Interfaces — Produces:** `export default function Receitas({ receitas }: { receitas: Receita[] }): JSX.Element`

Título "Receitas" + lista. Item: ícone `FileText`, `profissional` · `data`, `resumo`, botões **Baixar PDF** (`Download`) e **Reenviar no WhatsApp** (ícone whats/`Send`) — `onClick` mock (`alert(...)`). Estado vazio se lista vazia.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** Verificar `npx tsc --noEmit` + `npm run build` OK.
- [ ] **Step 3: Commit** — `git commit -am "feat(conta): seção de receitas"`

---

### Task 6: "Continuar conversa (IA)" + "Registro de humor"

**Files:** Create `src/conta/sections/ContinuarConversa.tsx`, `src/conta/sections/RegistroHumor.tsx`. Consumes `SessaoIA[]`, `humorSemana`, tokens.
**Interfaces — Produces:**
- `export default function ContinuarConversa({ sessoes }: { sessoes: SessaoIA[] }): JSX.Element`
- `export default function RegistroHumor({ semana }: { semana: number[] }): JSX.Element`

- **ContinuarConversa:** card "Continue de onde parou…" com `ultimoTrecho` da sessão mais recente + botão **Abrir chat** (link `/acolhimento`). Abaixo, mini-histórico (lista de `resumo` por `data`).
- **RegistroHumor:** "Como você está hoje?" com 5 emojis clicáveis (😟😡? use 😣😟😐🙂😀 → índices 0..4); clicar registra em estado local (destaca o escolhido). Abaixo, mini-gráfico de barras de `semana` (7 barras, altura ∝ valor, cor teal). `aria-label` nos emojis.

- [ ] **Step 1:** Implementar os 2 componentes.
- [ ] **Step 2:** Verificar `npx tsc --noEmit` + `npm run build` OK.
- [ ] **Step 3: Commit** — `git commit -am "feat(conta): continuar conversa IA + registro de humor"`

---

### Task 7: "Perfil" + "Avaliar atendimento (NPS)"

**Files:** Create `src/conta/sections/Perfil.tsx`, `src/conta/sections/AvaliarNPS.tsx`. Consumes `Usuario`, `Consulta[]`, tokens.
**Interfaces — Produces:**
- `export default function Perfil({ usuario }: { usuario: Usuario }): JSX.Element`
- `export default function AvaliarNPS({ consulta }: { consulta?: Consulta }): JSX.Element`

- **Perfil:** card com nome, contato de emergência (`emergenciaNome`/`emergenciaTel`), preferências (toggle lembretes — estado local; modalidade), botão **Sair** (mock).
- **AvaliarNPS:** recebe a 1ª consulta `realizada && !avaliada` (ou `undefined`). Se existir: bloco "Como foi sua consulta com {profissional}?" + nota 0–10 (botões) + campo de comentário + **Enviar** (mock → ao enviar, esconde via estado local mostrando "Obrigado!"). Se `undefined`: não renderiza nada (`return null`).

- [ ] **Step 1:** Implementar os 2 componentes.
- [ ] **Step 2:** Verificar `npx tsc --noEmit` + `npm run build` OK.
- [ ] **Step 3: Commit** — `git commit -am "feat(conta): perfil + avaliar atendimento (NPS)"`

---

### Task 8: Composição final em `ContaApp` + responsivo + a11y

**Files:** Modify `src/conta/ContaApp.tsx`. Consumes todas as seções + `sampleData`.

Montar a página final na ordem do spec: `<Header>` → `<ProximaConsulta>` (passando a consulta agendada) → `<Atalhos>` → `<ListaConsultas>` → `<Receitas>` → `<ContinuarConversa>` → `<RegistroHumor>` → `<AvaliarNPS>` (1ª realizada não avaliada) → `<Perfil>` → `<CriseBar>` (fixa). Container central (max-width 640, padding lateral 16, `padding-bottom` ≥ 64 pra não cobrir com a CriseBar), fundo `T.gray050`, espaçamento vertical consistente (gap ~20) entre seções. Derivar a "próxima consulta" = `consultas.find(c=>c.status==="agendada")`.

- [ ] **Step 1:** Implementar a composição + espaçamentos.
- [ ] **Step 2:** Verificar `npx tsc --noEmit`, `npm test` (sampleData verde) e `npm run build` (3 páginas).
- [ ] **Step 3:** Conferir no dev: `/conta` (via `conta.html`) mostra todas as seções, mobile-first, barra de crise fixa.
- [ ] **Step 4: Commit** — `git commit -am "feat(conta): composição final da área do usuário"`

---

## Self-Review

- **Cobertura do spec:** Header(T3), Próxima consulta+vazio(T2), Atalhos(T3), Minhas consultas/abas(T4), Receitas(T5), Continuar conversa(T6), Registro humor(T6), Perfil(T7), NPS(T7), Barra de crise(T3), composição+responsivo+a11y(T8), dados mock(T1), isolamento+3º entry(T1). ✅ Todas as 10 seções + extras cobertas.
- **Placeholders:** contrato de dados e tokens são concretos (T1); seções têm spec preciso (dados consumidos, layout, interações, ícones). UI JSX é construído pelo implementador seguindo tokens (pode usar frontend-design) — apropriado pra protótipo visual.
- **Consistência de tipos:** `Consulta`/`Receita`/`SessaoIA`/`Usuario` definidos em T1 e consumidos com as MESMAS assinaturas em T2–T8; props nomeadas explicitamente em cada "Produces".
