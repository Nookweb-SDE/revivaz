# Condomínio: encontros, textos e blocos novos — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native, escolhido pelo dono) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Psicólogo único no hero, copy profissional sem "Salão de Festas", ECG reescrito, e seção `#encontros` com os blocos Mulheres e Adolescentes.

**Architecture:** Datas dos encontros num módulo puro testado (`src/lib/encontros.ts`), consumido pelo hero e pela seção nova `src/sections/Encontros.tsx`, que substitui os Blocos 4 e 5 de `RevivazPreview.tsx`. Imagens geradas no Flow (navegador de QA logado, slot `claude-revivaz`) e cena 4 re-renderizada no Remotion.

**Tech Stack:** React 18 + Vite, estilos inline com tokens `T`/`F`/`Sp`, GSAP, Vitest, Remotion 4.0.240, ffmpeg (webp/avif).

**Spec:** `docs/superpowers/specs/2026-10-18-condominio-encontros-design.md`

## Global Constraints

- Nunca escrever "Salão de Festas"; local = "presencial, no condomínio".
- Encontro = "encontro de psicologia comunitária"; nota visível: "Não substitui psicoterapia."
- Coordenação: "psicóloga Flávia Magalhães, CRP 06/236718".
- 18h às 19h adolescentes de 12 a 17 anos · 19h às 20h mulheres a partir de 18 anos.
- Imagens novas: sem sacada aberta/janela alta/vista de cima; sem choro, hospital ou remédio; turquesa no ambiente, magenta só em detalhe.
- Hero ≤ 3 MiB medido por `remotion/scripts/publish-frames.sh`.
- Não commitar `.vscode/tasks.json`, `revivaz.code-workspace`, `docs/ESTRATEGIA-CONDOMINIO-E-EXPANSAO.md`, `remotion/public/`. Commit só depois de mostrar ao dono; mensagem via `-F`; sem push/deploy.

## Review Focus

- Depois do último encontro (28/10/2027) o botão do hero não pode mostrar data velha → `proximoEncontro` devolve `null` e o botão vira "Encontros mensais".
- No próprio dia do encontro o botão ainda mostra o dia (não pula para o mês seguinte) → teste com 26/11/2026.
- Âncora `#encontros` não pode ficar escondida atrás do header fixo → `scrollMarginTop` 72 px.
- Em 390 px o cartão espelhado (imagem à esquerda) empilha com a imagem em cima e texto legível → print no QA.
- Imagem que não carrega não pode deixar o cartão sem altura → `minHeight` no contêiner da imagem.

---

### Task 1: Datas dos encontros (módulo puro)

**Files:**
- Create: `src/lib/encontros.ts`
- Test: `src/lib/encontros.test.ts`

**Interfaces:**
- Produces: `type Encontro = { data: string /* "AAAA-MM-DD" */; eixo: string; adolescentes: string; mulheres: string }`; `ENCONTROS: Encontro[]` (12 itens, do PDF §9); `proximoEncontro(hoje: Date): Encontro | null`; `rotuloData(e: Encontro): string` → `"26/11"`.

- [ ] **Step 1: Teste**

```ts
expect(ENCONTROS).toHaveLength(12);
expect(proximoEncontro(new Date(2026, 9, 18))?.data).toBe("2026-11-26");
expect(proximoEncontro(new Date(2026, 10, 26, 21))?.data).toBe("2026-11-26");
expect(proximoEncontro(new Date(2026, 10, 27))?.data).toBe("2026-12-17");
expect(proximoEncontro(new Date(2027, 9, 29))).toBeNull();
expect(rotuloData(ENCONTROS[0])).toBe("26/11");
expect(ENCONTROS[0].adolescentes).toBe("Bullying, agressividade, preconceito e proteção");
expect(ENCONTROS[0].mulheres).toBe("Violência psicológica, limites, proteção e rede de apoio");
```

- [ ] **Step 2:** `npx vitest run src/lib/encontros.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3:** Implementar; comparação por dia local (sem fuso), datas e temas copiados da tabela §9 do PDF.
- [ ] **Step 4:** Mesmo comando → PASS.

### Task 2: Psicólogo único nas cenas 4 e 5

**Files:**
- Modify: `remotion/public/n4.jpg` (não versionado), `public/revivaz/hero/*` (gerado)

- [ ] **Step 1:** No Flow (agente, nova sessão), anexar `remotion/public/n4.jpg` e `remotion/public/n5.jpg`; pedir: trocar o homem da tela do notebook na imagem 1 pelo mesmo homem da imagem 2 (rosto, cabelo, suéter vinho, estante), resto idêntico.
- [ ] **Step 2:** Baixar 2K; comparar lado a lado com `n5.jpg` (contato ffmpeg hstack): mesmo rosto. Se não, refazer uma vez.
- [ ] **Step 3:** Copiar para `remotion/public/n4.jpg`; `cd remotion && npm run render && npm run publish` → "171 frames" e transferência ≤ 3 MiB.

### Task 3: Imagens dos encontros

**Files:**
- Create: `public/revivaz/encontro-mulheres.webp`, `public/revivaz/encontro-adolescentes.webp` (1600 px de largura, `cwebp -q 78` ou ffmpeg `-quality 78`, ≤ 250 KB cada)

- [ ] **Step 1 (mulheres):** Flow com referências: a foto das vizinhas (`/tmp/claude-1000/-home-almirante/7fec7fd1-1e97-4718-977a-87c6dfe26a8a/images/27.png`) e a sala real (`remotion/public/n1.jpg`). Mesma cena (duas vizinhas, uma com caneca, conversa leve), no sofá creme da sala do hero, piso de madeira, rack branco, almofadas turquesa e uma magenta, fim de tarde, cortina fechada, sem sacada visível.
- [ ] **Step 2 (adolescentes):** Flow: roda de 5 adolescentes brasileiros (12–17) e uma psicóloga adulta em cadeiras em círculo, espaço comum térreo claro e acolhedor, almofadas/detalhes turquesa, um detalhe magenta, rostos atentos e leves.
- [ ] **Step 3:** Baixar 2K, converter para webp; conferir peso com `ls -l`.

### Task 4: Seção `#encontros` (substitui Blocos 4 e 5)

**Files:**
- Create: `src/sections/Encontros.tsx`
- Modify: `src/RevivazPreview.tsx:314-393` (remove barra de abas + cartão; estado `tab` sai se ficar sem uso)

**Interfaces:**
- Consumes: `ENCONTROS`, `proximoEncontro`, `rotuloData` (Task 1).
- Produces: `export function Encontros({ bp }: { bp: "mobile" | "tablet" | "desktop" })`.

- [ ] **Step 1:** `<section id="encontros" style={{ scrollMarginTop: 72 }}>` com cabeçalho e dois cartões no estilo do cartão navy atual (gradiente `T.navy`→`T.navy800`, raio 28, imagem 44% com o mesmo tratamento teal). Mulheres: texto à esquerda e imagem à direita. Adolescentes: espelhado. No celular: imagem em cima. O contêiner da imagem leva `minHeight` 200/300.
- [ ] **Step 2:** Copy fixa:
  - Cabeçalho: sobretítulo "Psicologia comunitária no Vivaz"; título "Um encontro por mês, perto de casa"; texto "Na última quinta-feira de cada mês, a psicóloga Flávia Magalhães (CRP 06/236718) conduz encontros presenciais no condomínio. Ninguém precisa contar nada pessoal: a participação é livre e a privacidade, combinada no início."
  - Mulheres: selo "19h às 20h · mulheres a partir de 18 anos"; título "Entre vizinhas, a conversa fica mais leve"; texto "Sobrecarga, limites, autocuidado e redes de apoio. Um espaço para trocar experiências com quem vive a mesma rotina, com mediação profissional."; linha "Próximo tema: {mulheres}".
  - Adolescentes: selo "18h às 19h · 12 a 17 anos"; título "Um lugar para falar e ser ouvido"; texto "Amizades, pressões, redes sociais e respeito às diferenças, em linguagem da idade e com combinados claros de convivência."; linha "Próximo tema: {adolescentes}".
  - Rodapé: "Próximo encontro: {rotuloData}, presencial, no condomínio. Não substitui psicoterapia; quem precisar de cuidado individual recebe orientação." + botão `<a href="/acolhimento">Tirar dúvidas</a>`. Com `proximoEncontro` nulo: "Novo ciclo em breve."
- [ ] **Step 3:** Em `RevivazPreview.tsx`: `<Encontros bp={bp} />` logo após `<div id="sobre"><EcgValor /></div>`.
- [ ] **Step 4:** `npx tsc --noEmit -p .` sem erro.

### Task 5: Hero e faixa ECG

**Files:**
- Modify: `src/sections/HeroScrubFrames.tsx:37-41,232-257`
- Modify: `src/sections/EcgValor.tsx:340-380` (só copy)

- [ ] **Step 1 (hero):** parágrafo → "Projeto de psicologia comunitária do Condomínio Vivaz. Encontros mensais para adolescentes e mulheres e atendimento por vídeo com profissionais voluntários." Botão: `Próximo encontro: ${rotuloData(p)}` com `p = proximoEncontro(new Date())`; se `null`, "Encontros mensais". ETAPAS: Escuta "Espaço seguro para falar, no seu tempo."; Vínculo "Conhecer quem mora ao lado fortalece a convivência."; Convivência "Encontros mensais: 18h adolescentes, 19h mulheres."
- [ ] **Step 2 (ECG):** título "Saúde mental também se cuida em comunidade."; subtítulo "Escuta qualificada, vínculos entre vizinhos e orientação para quem precisa de mais cuidado."; etapas: 01 Escuta "Um espaço mediado por psicóloga, sem julgamento." · 02 Vínculo "Vizinhos que se conhecem se apoiam melhor." · 03 Convivência "Encontros mensais para adolescentes e mulheres." · 04 Rede de apoio "CVV 188 e encaminhamento para atendimento individual."
- [ ] **Step 3:** `grep -ri "salão de festas\|qualquer site faz" src` → vazio.

### Task 6: Revisão de texto da página

**Files:**
- Modify: `src/RevivazPreview.tsx` (copy apenas)

- [ ] **Step 1:** Ler as seções a partir de "BLOCO 6" e reescrever cada título/parágrafo em tom profissional e sóbrio: sem promessa de cura/resultado, sem "SUS" como promessa de fila zerada, sem gíria. Ofertas, botões e formulários mantêm função e destino.
- [ ] **Step 2:** `npm test` e `npm run build` → PASS.

### Task 7: QA e entrega

- [ ] **Step 1:** `clica --lab --slot claude-revivaz` em `http://localhost:5174/`: prints do hero (0/30/60/95%) em 1600×900, e de `#encontros` em 1600 e 390 px; clicar "Próximo encontro" → rola até `#encontros` sem ficar atrás do header.
- [ ] **Step 2:** Mostrar ao dono (tabela ≤ 5 linhas + prints) e a lista do commit; commitar só com o "pode".
