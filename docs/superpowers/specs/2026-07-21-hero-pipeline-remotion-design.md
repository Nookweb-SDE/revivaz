# Hero Revivaz — pipeline híbrido com Remotion (v4)

**Data:** 2026-07-21
**Branch:** `feat/ecg-como-cuidamos`
**Status:** aprovado pelo dono após ver a deriva de identidade nos planos gerados

## O problema que esta spec resolve

Na v3 os três planos foram gerados **em cadeia**: o close saiu do plano de perfil, o plano
frontal saiu do close, o over-the-shoulder saiu de outra imagem. Cada geração reinterpreta o
rosto a partir da anterior — telefone sem fio.

Resultado observado pelo dono: *"esta mais velha aqui e um pouco mais nova? nao parece a mesma
pessoa"*. Em três saltos ela envelheceu num plano e rejuvenesceu no outro.

**O Soul reduz a deriva, não a elimina.** Ele preserva o *tipo* de rosto, não os mesmos pixels.
Enquanto cada plano for um render novo, a deriva volta.

Já descartado antes, e registrado para não repetir: perfil puro quebra a semelhança (o Soul foi
treinado com frontais e três-quartos), e geração a 720p (o default do Seedance) fica mole em tela
de 1440.

## A decisão

**Pipeline híbrido:** o que pode ser recorte vira recorte; só o que precisa de vida humana é vídeo.

| Plano | Fonte | Por quê |
|---|---|---|
| Aberto | recorte amplo da **imagem-mãe 4K** | identidade idêntica, é o mesmo pixel |
| Médio | recorte + zoom da **mesma imagem-mãe** | idem |
| Close | **vídeo 6 s** gerado (1080p nativo) | é onde piscar e respirar importam |
| Ponto de vista | segunda imagem 4K (ângulo diferente) | não sai por recorte da primeira |

Superfície de deriva cai de **quatro renders independentes para duas fontes**.

## Onde Remotion entra — e onde não

**Entra:**

1. **Movimento de câmera digital.** Interpolar recorte e escala sobre a imagem 4K com timing
   declarativo, em vez de `xfade` cego no ffmpeg.
2. **A tela do notebook com a UI real.** Hoje a IA *desenha* a interface e inventa: logo
   esverdeado em vez do `#00BFD8`, "Doctor on Call", "Patient: Sarah M." — texto em inglês e nomes
   que não existem no produto. Com Remotion a tela é um componente React importando os mesmos
   tokens de `src/conta/ui.ts` e a fonte Nunito. **Zero invenção.**
3. **Composição versionada.** A sequência vira código, não binário de 100 MB.

**Não entra:**

- **Não gera conteúdo fotorrealista.** A base continua vindo do Seedance/nano_banana.
- **Não resolve o scroll scrub.** O scrub no site é GSAP lendo a posição da página; Remotion
  entrega frames. São camadas diferentes.
- **Não faz tracking.** Para a UI acompanhar a perspectiva da tela inclinada seria preciso
  corner-pin com tracking de movimento, que Remotion não tem. **Mitigação:** a imagem do
  over-the-shoulder é gerada com a tela em **verde chapado**, e o Remotion faz chroma key +
  corner-pin com os quatro cantos medidos manualmente uma única vez — a imagem é estática,
  então os cantos não mudam.

## Saída do Remotion: sequência de imagens, não vídeo

Remotion renderiza para **frames WebP**, não mp4. Motivo já medido na v3: o scrub preciso exige
`-g 1` (todo frame keyframe), o que levou o arquivo de 2,4 MB para 5,8 MB. Sequência de imagens
tem seek instantâneo sem decode nenhum — 171 quadros WebP a ~24 KB.

O canvas troca a imagem conforme o scroll; GSAP `ScrollTrigger` continua sendo quem lê a posição.

**Regra:** pré-carregar todos os frames antes de armar o ScrollTrigger. Sem isso o scrub pula
quadros que ainda não baixaram.

## Arquitetura

```
remotion/                          # projeto isolado, NÃO entra no bundle do site
  src/HeroSequence.tsx             # composição: 4 planos + transições
  src/shots/{Aberto,Medio,Close,PontoDeVista}.tsx
  src/ui/TelaRevivaz.tsx           # a tela real — importa tokens de src/conta/ui.ts
  public/                          # imagem-mãe 4K, imagem OTS, vídeo do close
```

Saída: `public/revivaz/hero/f000.webp … f170.webp` + `hero-poster.webp`.

No site, um único componente novo: `src/sections/HeroScrubFrames.tsx` — canvas + GSAP, sem
Remotion em runtime. **Remotion é ferramenta de build, não dependência do site.**

Substitui `src/sections/HeroTelemedicina.tsx` (a rota SVG da v2, hoje em produção) e o parâmetro
`?variant=` do `RevivazPreview.tsx`.

## Dependências

- **No site:** só `gsap@3.15.0` + `ScrollTrigger` (~40 KB gzip). Licença gratuita, não-OSI —
  proíbe embutir em ferramenta no-code vendida a terceiros; não afeta a Revivaz.
- **Fora do bundle:** `remotion` + `@remotion/cli`. Pesado (traz Chrome headless), por isso vive
  em pasta separada com `package.json` próprio.

## Responsividade e acessibilidade

- **Mobile (<640 px):** conjunto reduzido de frames em 720 px, **sem scrub** — toca uma vez e as
  etapas entram por `IntersectionObserver`. Scrub em touch é impreciso e o download não paga.
- **`prefers-reduced-motion`:** trilho colapsa para `100vh`, sem `sticky`, mostra o poster
  estático, etapas nascem visíveis. Obrigatório: movimento não-consentido dispara náusea e
  enxaqueca, e parte do público da Revivaz convive exatamente com isso.
- Canvas é decorativo: `aria-hidden="true"`. Todo o texto é HTML real.
- Contraste ≥ 4.5:1 verificado contra o **frame mais claro**, não o mais escuro.

## Orçamento

- Frames desktop: **≤ 3 MB** somados
- Poster: ≤ 60 KB, é o LCP
- Medir com CPU estrangulada 4–6×, reportando FPS médio **e pior frame**

## Verificação

- [ ] Rosto conferido lado a lado nos quatro planos — o teste que esta spec existe para passar
- [ ] `currentFrame` acompanha o scroll linearmente em 0/25/50/75/100%
- [ ] Rolar de volta ao topo retorna ao frame 0
- [ ] Nenhum frame faltando (todos pré-carregados antes de armar o trigger)
- [ ] Tela do notebook em português, cores da paleta, sem nomes inventados
- [ ] `prefers-reduced-motion` → poster estático, sem trilho
- [ ] Mobile ≤520 px: sem overflow horizontal, sem scrub
- [ ] `npm run build` verde, 5 entradas Vite mantidas
- [ ] `gsap.context().revert()` no unmount — nenhum ScrollTrigger órfão

## Fora de escopo

- Áudio; Three.js/WebGL (descartado na v3); alterar outras seções; A/B de copy.
- Remotion em runtime no site.

## Pendências do dono

1. **Nome da modelo** — o Soul está como `revivaz`, referência técnica. Retreinar com o nome
   definitivo é barato.
2. **Confirmar o corte mobile** (sem scrub).

## Riscos

- **Chroma key + corner-pin manual** é o passo mais frágil. Se a tela verde não recortar limpo,
  o plano B é aceitar a tela gerada pela IA e corrigir só o idioma.
- **Falso positivo de NSFW** já ocorreu (mulher sozinha, ambiente escuro, verbos ambíguos):
  escrever prompt em linguagem clínica desde a primeira tentativa.
- **Créditos:** ~350 na conta `contato@izai.dev`. Sempre confirmar com
  `higgsfield account status` antes de gerar — a memória já esteve errada sobre qual conta é.
