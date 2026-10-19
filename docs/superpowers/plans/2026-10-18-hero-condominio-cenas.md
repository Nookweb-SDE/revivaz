# Hero do condomínio — novas cenas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refazer as cenas do hero (scroll quadro a quadro) no MESMO ambiente do hero atual, trocando a mulher (sem sorriso) e pondo um psicólogo (não médico) do outro lado da chamada.

**Architecture:** Mesma linguagem do hero atual (frente da mulher com notebook, Ken Burns aberto→médio; close em vídeo; outro lado da chamada). As imagens nascem no Google Flow editando a foto real (versão "parede A"); o Remotion monta 171 quadros; `publish-frames.sh` converte em AVIF para `public/revivaz/hero/`. O site (`HeroScrubFrames.tsx`) não muda: continua lendo 171 quadros + `poster.webp`.

**Tech Stack:** Google Flow (Nano Banana 2.1 no editor de imagem, 0 crédito; vídeo Omni 1.1 Flash, gasta crédito), Remotion 4.0.240, ffmpeg/avifenc, GSAP ScrollTrigger (já existente).

**Spec:** `remotion/PLANO-CONDOMINIO.md` + decisões do dono em 18/10/2026 (abaixo, em Global Constraints).

## Global Constraints

- Referência de estilo = hero atual (quadros `public/revivaz/hero/f000…f170.avif`): mulher de frente, sentada com notebook no colo, luz quente; close dela; depois o outro lado da chamada.
- **Trocar a mulher**: outra pessoa, brasileira, ~35–45 anos. **Não sorrindo**: expressão atenta, serena, boca fechada. Nada de sorriso de propaganda.
- **Outro lado = psicólogo**, mesmo tipo de cena (de frente, sentado diante do notebook, no consultório). **Sem jaleco, sem estetoscópio, sem cara de médico**, sem sorriso aberto: escuta atenta.
- Cenário = **o mesmo do hero atual** (sala quente, sofá claro, almofadas azul/verde, abajur). Decisão do dono 18/10: a foto do apartamento real NÃO entra no hero. Referência: quadros `f000` (frente) e `f170` (por cima do ombro) enviados ao Flow.
- Sem planta. Sem choro, remédio, hospital. Janela com rede pode aparecer (dono aceitou), mas nunca câmera olhando para baixo/altura.
- 40% esquerdo do quadro mais vazio (texto do hero fica ali).
- `TOTAL = 171` quadros a 14 fps; orçamento de 3 MiB no `publish` (gate já existe no script).
- Vídeo no Flow gasta crédito: **mostrar ao dono e esperar o "pode" antes de cada geração de vídeo.**
- Cada imagem passa pelo dono antes de entrar no Remotion (ele escolhe; eu não decido sozinho).
- Não commitar `.vscode/tasks.json`, `docs/ESTRATEGIA-CONDOMINIO-E-EXPANSAO.md`, `revivaz.code-workspace`, nem `remotion/public/`. Mostrar o commit antes; push só com ordem do dono. Produção segue suspensa (não fazer deploy).

## Review Focus

- Sorriso que "vaza" no vídeo (o modelo tende a fazer a pessoa sorrir no fim): conferir os 8 s quadro a quadro antes de recortar.
- Psicólogo com cara de médico (camisa branca + consultório clínico lê como médico): consultório com estante e poltrona, camisa colorida.
- Mulher mudando de rosto entre plano 1 e plano 2: usar a imagem aprovada do plano 1 como quadro inicial do vídeo.
- Emenda entre planos piscando preto: manter o `FadeIn` só no plano que entra (padrão já documentado em `HeroSequence.tsx`).
- Peso: 4 planos com vídeo podem estourar 3 MiB; se estourar, subir `CRF` de 44 para 46 antes de cortar quadros.

---

### Task 1: Imagens no Flow (moradora, psicólogo)

**Files:**
- Create (gitignored): `remotion/public/moradora.png`, `remotion/public/psicologo.png`, `remotion/public/ots-psicologo.png`
- Prompts: `remotion/PLANO-CONDOMINIO.md` (seção "Cenas 18/10", substituir os prompts antigos)

**Interfaces:**
- Produces: três PNG 16:9 2K (2752×1536) em `remotion/public/`.

- [ ] **Step 1:** No editor do Flow (projeto `49caa81a…`, imagem `apartamento-vivaz.jpeg`, versão parede A), gerar **moradora**: câmera de frente para o sofá, uma mulher (nova, não as vizinhas) sentada de frente para a câmera com notebook no colo, olhando a tela, expressão atenta e séria-serena, sem sorriso; enquadramento como `f000` do hero atual (ela no centro-direita).
- [ ] **Step 2:** Gerar **psicólogo**: homem ~40–50 anos, camisa de cor (não branca), sentado de frente para a câmera atrás de um notebook, consultório com estante de livros e poltrona, luz quente, escuta atenta sem sorriso; sem jaleco, sem estetoscópio, sem maca.
- [ ] **Step 4:** Baixar em 2K, montar `sequencia-hero.jpg` (as três empilhadas) e abrir com `xdg-open`. **Gate:** dono aprova ou pede refação. Checklist visual: sem sorriso, sem estetoscópio/jaleco, sem planta, sala real reconhecível.

### Task 2: Vídeo do close (moradora)

**Files:**
- Create (gitignored): `remotion/public/close-moradora.mp4`

**Interfaces:**
- Consumes: `moradora.png` (Task 1) como quadro inicial.
- Produces: MP4 ≥ 4 s (55 quadros a 14 fps) usado no plano 2.

- [ ] **Step 1:** Mostrar ao dono o custo em créditos do vídeo (Omni 1.1 Flash) e esperar "pode".
- [ ] **Step 2:** Flow vídeo, quadro inicial = `moradora.png` recortado no médio, **sem quadro final**. Prompt: "Slow gentle push-in to a medium close-up. She listens attentively to the laptop, blinks naturally, breathes, nods slightly once. Serious, calm expression, mouth closed, no smile. No cuts, no one else enters."
- [ ] **Step 3:** Conferir: `ffmpeg -i close-moradora.mp4 -vf fps=2 /tmp/…/c%02d.png` e olhar todos; se sorrir em algum trecho, escolher os 4 s sem sorriso (anotar o `-ss`).

### Task 3: Guardar os quadros atuais para o revivaz_municipios

**Files:**
- Create: `../revivaz_municipios/public/revivaz/hero/` (cópia de `public/revivaz/hero/`)

- [ ] **Step 1:** `diff -rq public/revivaz/hero ../revivaz_municipios/public/revivaz/hero` — se já forem iguais, nada a fazer; senão copiar com `cp -a`.
- [ ] **Step 2:** Verificar: `ls ../revivaz_municipios/public/revivaz/hero | wc -l` → `173`.

### Task 4: Composição Remotion com 4 planos

**Files:**
- Modify: `remotion/src/HeroSequence.tsx` (constantes e as três `<Sequence>`)

**Interfaces:**
- Consumes: `moradora.png`, `close-moradora.mp4`, `psicologo.png`, `vizinhas.png`.
- Produces: `out/frames/element-000.png … element-170.png`.

- [ ] **Step 1:** Trocar as durações por `A = 45` (moradora, Ken Burns aberto→médio), `B = 40` (close vídeo, `startFrom` = `-ss` × 14 da Task 2), `C = 40` (psicólogo, Ken Burns leve de aproximação), `D = 46` (vizinhas, Ken Burns leve). `A+B+C+D = 171`, `X = 8` inalterado; cada plano que entra usa `FadeIn`, o que sai dura `+X`.
- [ ] **Step 2:** `npx tsc --noEmit -p remotion` → sem erro.
- [ ] **Step 3:** `cd remotion && npm run render` → `ls out/frames | wc -l` = `171`.
- [ ] **Step 4:** Folha de contato dos quadros 0, 44, 50, 84, 90, 124, 130, 170 → abrir para o dono. **Gate:** aprovação do ritmo.

### Task 5: Publicar e conferir no site

**Files:**
- Modify (gerados): `public/revivaz/hero/f000…f170.avif`, `public/revivaz/hero/poster.webp`
- Modify: `remotion/scripts/publish-frames.sh` só se `POSTER_FRAME` precisar mudar (hoje 85 = close; no novo corte o close fica em 45–84 → usar `60`).

- [ ] **Step 1:** `npm run publish` → termina com sucesso e `du -sh public/revivaz/hero` ≤ 3 MiB (o gate aborta se passar).
- [ ] **Step 2:** Dev server (`localhost:5174`), `clica` em 1440×900: prints com scroll em 0%, 30%, 60%, 95% do hero. Conferir que as etapas (Escuta/Vínculo/Convivência) aparecem sobre as cenas certas e que o texto à esquerda continua legível.
- [ ] **Step 3:** Celular 390 px (`celular 5173`): poster estático aparece.
- [ ] **Step 4:** Mostrar ao dono o commit (só `src/RevivazPreview.tsx`, `src/sections/HeroScrubFrames.tsx`, `remotion/src/HeroSequence.tsx`, `remotion/PLANO-CONDOMINIO.md`, `remotion/scripts/publish-frames.sh` se mudou, `public/revivaz/hero/`, este plano). Commit com mensagem via `-F`; push só com ordem.

## Depois (fora deste plano)

- Cena "Convivência" no Salão de Festas real: espera a foto da vizinha; entra como 5º plano ou substitui as vizinhas.
- Seção `#encontros` da Flávia (o botão "Próximo encontro: 26/11" já aponta para ela).
