# Hero Telemedicina — vídeo dirigido pelo scroll (v3)

**Data:** 2026-07-20
**Branch:** `feat/ecg-como-cuidamos`
**Status:** aprovado pelo dono após ver o protótipo rodando

## O que esta spec substitui

Supersede a `2026-07-20-hero-telemedicina-design.md` (grade de pontos + rota SVG) e a
implementação já commitada em `5351bef` (`src/sections/HeroTelemedicina.tsx`).

**Por quê:** a rota SVG foi implementada e funciona, mas é um efeito de entrada — toca
uma vez no load e acaba. Os vídeos de referência (@webloved, @hyliox.io) fazem outra
coisa: **o movimento é dirigido pelo scroll**, não pelo tempo. O visitante controla.
Duas tentativas intermediárias foram descartadas pelo dono e ficam registradas para não
serem repetidas:

- **Cena Three.js autoral** (bloom + Reflector + Points, o stack do HUBTEEN): resultado
  visualmente ruim — as conexões liam como chafariz, os nós não brilhavam. Descartada.
- **Vídeo de IA em loop de fundo** (rede neural abstrata): bonito e inútil — sem scroll,
  sem telemedicina, clichê genérico de tech. Descartada.

A regra que sobreviveu, e que já está em `~/.claude/skills/front-impecavel` (regra 2b):
**o visual mais caro não é o código mais caro.** Render offline por IA + GSAP amarrando
ao scroll entrega mais do que shader em tempo real, por uma fração do esforço.

## Objetivo

Hero em que o visitante **dirige um atendimento**: ao rolar, a câmera se aproxima de uma
psicóloga em consulta por vídeo, e as quatro etapas da jornada Revivaz entram em sequência.
Rolar de volta desfaz o movimento. O header faz parte da cena, sem caixa branca.

## Decisões aprovadas

- **Asset:** vídeo gerado por IA (Seedance 2.0), teleatendimento realista, push-in lento.
- **Mecânica:** GSAP `ScrollTrigger` com `scrub` escrevendo `video.currentTime`.
- **Modelo:** a mulher do vídeo é a **modelo oficial da Revivaz**, com Soul treinado
  (`revivaz`, id `884e7705-91d6-4fad-b696-e691528fed76`) para regenerar variações sem
  perder a identidade. Assets em `~/Área de trabalho/Revivaz-assets/modelo/` (fora do git).
- **Header integrado:** transparente sobre a cena, fio de luz teal no lugar da borda.
- **Sem áudio.** O vídeo é mudo por decisão de produto — som automático não combina com
  quem chega à Revivaz.

## Camadas (fundo → frente)

1. `<video>` cobrindo o hero, `object-fit: cover`, `muted playsinline preload="auto"`.
2. **Véu horizontal** — gradiente que escurece a faixa esquerda. É o que garante contraste
   do texto sobre qualquer frame; sem ele a legibilidade depende do acaso do quadro.
3. **Véu vertical** — escurece topo (sob o header) e base (emenda com a seção seguinte).
4. **Header** transparente, `z-index` acima dos véus.
5. **Texto** à esquerda: eyebrow, h1 gradiente, sub, 2 botões, prova social.
6. **Etapas** à direita: acolhimento → profissional → consulta → receita.

## A mecânica do scrub

O trilho tem `320vh`; o hero fica `sticky` no topo. O progresso do trilho escreve o tempo
do vídeo:

```js
gsap.registerPlugin(ScrollTrigger);
const st = { t: 0 };
gsap.to(st, {
  t: 1, ease: 'none',
  scrollTrigger: { trigger: '#track', start: 'top top', end: 'bottom bottom', scrub: 0.35 },
  onUpdate() {
    const time = st.t * video.duration;
    if (Math.abs(video.currentTime - time) > 0.01) video.currentTime = time;  // evita thrash
  },
});
```

**Medido no protótipo** (Brave headless, 1440×800):

| scroll | `currentTime` |
|---|---|
| 25% | 2,50 s |
| 50% | 5,01 s |
| 75% | 7,53 s |
| 100% | 10,04 s |

Voltar ao topo retorna a 0,00 s. Linear e reversível nos dois sentidos.

### A armadilha que decide se funciona

O vídeo **precisa** ser reencodado com todo frame virando keyframe:

```bash
ffmpeg -i origem.mp4 -c:v libx264 -pix_fmt yuv420p -crf 30 \
       -g 1 -keyint_min 1 -sc_threshold 0 -an -movflags +faststart saida.mp4
```

Sem `-g 1` o navegador só consegue posicionar de keyframe em keyframe e o scrub anda em
degraus travados. **O custo é peso:** o mesmo vídeo saiu de ~600 KB para 2,6 MB. Esse
trade-off é o principal risco técnico desta spec e está tratado em *Performance*.

## Etapas da jornada

Quatro blocos entrando em sequência à direita, cada um com `ScrollTrigger` próprio:

```js
steps.forEach((el, i) => {
  gsap.to(el, { opacity: 1, x: 0, duration: .5, ease: 'power2.out',
    scrollTrigger: { trigger: '#track',
      start: (14 + i*16) + '% top', end: (23 + i*16) + '% top', scrub: true } });
});
```

Verificado: em 100% de scroll as quatro estão visíveis (última em 0,98 de opacidade).
Com o espaçamento anterior (`18 + i*19`) a quarta nunca entrava — o range estourava o fim
do trilho.

Conteúdo: **Acolhimento** ("você conta o que está sentindo") · **Profissional**
("encontramos quem combina com você") · **Consulta** ("por vídeo, de onde você estiver")
· **Receita** ("digital, direto no seu celular").

## Arquitetura

- **Novo:** `src/sections/HeroScrubVideo.tsx` — componente autocontido.
  - Registra `ScrollTrigger` uma vez; cria as animações em `useLayoutEffect` dentro de
    `gsap.context()` e chama `ctx.revert()` no cleanup. Sem isso, trocar de rota deixa
    ScrollTriggers órfãos que continuam disparando.
  - Espera `loadedmetadata` antes de montar o scrub — `video.duration` é `NaN` até lá.
  - Mantém `openAgendar`, `heroLines` e `heroIdx` como estão.
- **Editar:** `src/RevivazPreview.tsx` — trocar `<HeroTelemedicina/>` por `<HeroScrubVideo/>`
  e remover o parâmetro `?variant=` (era o lab de decisão da versão anterior).
- **Remover:** `src/sections/HeroTelemedicina.tsx` e o `?variant` — a rota SVG não convive
  com o vídeo; manter as duas seria carregar código morto.
- **Assets** em `public/revivaz/`:
  - `hero-tele.mp4` — desktop, `-g 1`, ~2,6 MB
  - `hero-tele-lite.mp4` — mobile, 720p, `-g 12`, ~700 KB
  - `hero-tele-poster.webp` — poster e fallback de reduced-motion. Sai do próprio vídeo
    (`ffmpeg -ss <meio> -frames:v 1`), para o poster ser exatamente o quadro que aparece
    e não haver salto visível quando o vídeo assume.

## Dependência nova

`gsap@3.15.0` + `ScrollTrigger`. **É a primeira dependência de animação do projeto** — a spec
anterior era explicitamente "zero dependência nova", e esta reverte isso conscientemente.

- Peso: ~72 KB + ~44 KB minificados (~40 KB somados após gzip).
- Licença: "Standard, no charge" da Webflow. Todos os plugins Club são gratuitos desde a
  3.13. **Não é OSI** — proíbe embutir GSAP em ferramenta no-code de animação vendida a
  terceiros. Não afeta o uso da Revivaz.
- Importar só o que usa: `import gsap from 'gsap'` + `import { ScrollTrigger } from 'gsap/ScrollTrigger'`.

## Responsividade

- **Desktop (≥1024px):** como descrito. Trilho 320vh.
- **Tablet:** etapas passam para baixo do texto; trilho 260vh.
- **Mobile (<640px):** o vídeo `-g 1` é grande demais para dado móvel. Servir a versão
  leve (720p, `-g 12`, ~700 KB) **sem scrub** — o vídeo toca uma vez em loop, e as etapas
  entram por `IntersectionObserver`. Trilho vira altura normal, sem `sticky`.
  Decidido assim porque scrub em touch é impreciso e o ganho não paga o download.

  **Como servir o arquivo certo:** decidir em JS pelo `bp` que o componente já recebe e
  setar o `src` uma única vez antes do primeiro paint — **não** usar `<source media>`,
  porque o Chrome não reavalia `media` em `<video>` do jeito que faz em `<picture>`, e o
  resultado seria baixar o arquivo errado ou os dois.

## Acessibilidade

- **`prefers-reduced-motion: reduce`** → trilho colapsa para `100vh`, sem `sticky`, sem
  ScrollTrigger; mostra um quadro representativo (`currentTime = duration * 0.5`) ou o
  poster. As quatro etapas nascem visíveis. **Obrigatório, não opcional:** movimento
  não-consentido dispara náusea e enxaqueca, e parte do público da Revivaz é exatamente
  quem convive com isso.
- Vídeo é decorativo: `aria-hidden="true"`. Todo o conteúdo é HTML real e legível na ordem.
- Contraste ≥ 4.5:1 do texto sobre o véu — verificar com o frame **mais claro** do vídeo,
  não com o mais escuro.
- Foco de teclado visível nos dois botões.
- Sem áudio, então não há gate de gesto a resolver.

## Performance

Riscos reais, em ordem:

1. **Peso do vídeo (2,6 MB desktop).** Precisa entrar via `preload="auto"` só no desktop,
   com `<link rel="preload" as="video">`. Se o LCP piorar, cortar a duração de 10 s para
   ~6 s antes de baixar a qualidade.
2. **`currentTime` a cada frame de scroll** força decode. O guard de `0.01 s` já evita
   reescrever o mesmo valor; medir se o decode aguenta em CPU estrangulada.
3. **Poster obrigatório** — sem ele o hero é um retângulo preto até o vídeo carregar,
   e isso é o LCP.

Verificar com throttle de CPU 4–6× no DevTools, que é o que o celular real entrega. Levar o
número ao dono antes de subir.

## Fora de escopo

- Áudio.
- Three.js / WebGL — descartado nesta rodada.
- Alterar outras seções da landing.
- A/B de copy do hero.
- Retreinar o Soul com outro nome (ver Pendências).

## Pendências que precisam do dono

1. **Nome da modelo.** O Soul foi treinado como `revivaz`, que é referência técnica, não
   nome de personagem. Retreinar com o nome definitivo é barato.
2. **Enquadramento final do vídeo.** O atual serve, mas ela ocupa o centro-direita e o véu
   precisa ser forte. Uma variação com ela mais à direita reduziria o véu e melhoraria o
   contraste. Sobram ~885 créditos.
3. **Confirmar o corte mobile** (loop leve sem scrub) — é a decisão de maior impacto no
   custo de dados.

## Verificação

- [ ] `currentTime` acompanha o scroll linearmente, medido em 5 pontos (0/25/50/75/100%)
- [ ] Rolar de volta ao topo retorna o vídeo a 0,00 s
- [ ] As quatro etapas chegam a opacidade 1 antes do fim do trilho
- [ ] `prefers-reduced-motion` → sem trilho, sem sticky, quadro estático, etapas visíveis
- [ ] Mobile ≤520px: sem overflow horizontal, vídeo leve, sem scrub
- [ ] Contraste ≥ 4.5:1 contra o frame mais claro
- [ ] `npm run build` verde, 5 entradas Vite mantidas
- [ ] Console sem erros novos
- [ ] `gsap.context().revert()` no unmount — nenhum ScrollTrigger órfão após trocar de rota
- [ ] Probe com CPU 4–6×: reportar FPS médio **e pior frame**
