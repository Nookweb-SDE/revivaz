# Hero Telemedicina — "Saúde que conecta" (v2)

**Data:** 2026-07-20
**Branch:** feat/ecg-como-cuidamos (ou nova feat/hero-telemedicina)
**Origem:** redesign do hero da landing Revivaz, inspirado na técnica do @webloved (TikTok, vídeo VECTR "How I build with Claude"): grade de pontos CSS + rota `stroke-dashoffset` que se desenha, encaixada nos pontos da grade. Zero 3D/WebGL — CSS + SVG + matemática. Cobre-se pela skill `front-impecavel` (ref. `02-css-signature`, `03-scroll-e-reveal`).

## Objetivo
Substituir o hero atual (navy + canvas com orbs teal estáticas + card de foto à direita) por um hero **imersivo de telemedicina**: uma imagem realista de teleatendimento integrada ao fundo navy, com uma **malha técnica de pontos** e uma **rota/rede que se desenha** conectando os pontos — metáfora visual de "saúde que conecta". Diferencial forte, na identidade Revivaz, rodando liso em qualquer aparelho.

## Decisões aprovadas (brainstorming 2026-07-20)
- **Fundo:** navy cinematic `#0B1D3A` (mantém identidade). Grade + rota teal brilham sobre o escuro.
- **Imagem:** foto realista de teleatendimento **grande, integrada ao fundo** (não mais card isolado à direita). Funde no navy à esquerda para o texto respirar.
- **Animação da rota:** produzir **DUAS variantes** para o dono escolher (ver "Variantes"). Decisão adiada para a etapa visual.
- **Técnica:** componente React isolado, **zero dependência nova** (sem three, sem gsap). rAF só onde precisar; preferir CSS/SVG + Web Animations API. `prefers-reduced-motion` e degradação mobile obrigatórios.

## Camadas do hero (fundo → frente)
1. **Base navy** `#0B1D3A` + vinheta radial (escurece bordas).
2. **Imagem de teleatendimento** (metade direita), com máscara-gradiente que a dissolve no navy à esquerda e embaixo (funde na seção seguinte). `object-position` que mantém o rosto/olhar visível.
3. **Grade de pontos** teal — `radial-gradient` CSS tilado por `background-size` (0 KB). Opacidade baixa (~4%), com máscara para sumir nas bordas.
4. **Rota/rede SVG** que se desenha (`stroke-dashoffset`), encaixada nos pontos da grade (`Math.round(v/cell)*cell`), com nós que pulsam ao serem "alcançados". 1 acento vivo (teal300 `#00BFD8`, com glow).
5. **Texto** à esquerda: h1 gradiente "Saúde que conecta", eyebrow rotativo, sub, 2 botões — com reveal suave na entrada.

## Imagem de fundo — conceito e geração
- **Ferramenta:** Higgsfield / Nano Banana 2 (via MCP higgsfield). **Confirmar o prompt com o dono antes de gerar** (custa crédito).
- **Conceito:** profissional de saúde mental (psicólogo/psiquiatra) num **teleatendimento por vídeo** — headset discreto ou notebook, expressão acolhedora/sorriso leve, consultório moderno com iluminação suave (bokeh ao fundo). Realista, **sem "cara de IA"** (regra dura da memória `feedback-imagens-landing-revivaz`), sem texto/watermark.
- **Enquadramento:** sujeito à **direita** do quadro, lado esquerdo mais vazio/escuro (recebe o gradiente navy e o texto). Proporção landscape (~1600×1000) para cobrir o hero.
- **Paleta:** tons que casem com teal/navy — jaleco claro, ambiente com azul frio; evitar cores quentes saturadas que briguem com o teal.
- **Pós:** aplicar máscara CSS (não editar a foto) para fundir no navy. Overlay inferior cobre qualquer marca (como o hero atual já faz com a marca Gemini).
- **Fallback:** se a geração não agradar, reusar `/revivaz/hero-doctors.webp` ou `team.webp` com o mesmo tratamento.

## Animação — o que implementar
Técnica base (idêntica à fórmula do vídeo):
- **Dot grid:** `background-image: radial-gradient(circle, rgba(0,191,216,.28) 1px, transparent 1px); background-size: cellPx cellPx;` + `mask-image` radial/linear para sumir nas bordas.
- **Rota que desenha:** path SVG com `stroke-dasharray = comprimento` (via `path.getTotalLength()`), animar `stroke-dashoffset` de comprimento→0. `stroke-linecap:round`, glow via `filter: drop-shadow` ou `<feGaussianBlur>`.
- **Snap à grade:** cada vértice do path arredondado para a célula (`Math.round(x/cell)*cell`), para as curvas caírem sobre os pontos.
- **Nós:** círculos SVG nos vértices; quando a ponta da rota chega ("alcança"), o nó pulsa (Web Animations API: scale + ring que expande e some).
- **Trigger:** **no load** (hero está no topo, não há scroll ainda). Rota desenha ~1.6–2.4s após a entrada do texto. Opcional: **parallax leve do mouse** (desktop) na grade/rota (translate sutil), desligado no mobile e no reduced-motion.
- **Reveal do texto:** eyebrow → h1 → sub → botões em stagger (WAAPI ou transições CSS com IntersectionObserver, como no ECG).

### Variantes da rota (produzir as DUAS, decidir na tela)
- **Variante 1 — Jornada do paciente:** uma **linha única** que desenha o fluxo com 4 nós rotulados discretamente: `Acolhimento → Profissional → Consulta → Receita`. Narrativa clara; a ponta caminha e cada nó pulsa na ordem.
- **Variante 2 — Rede de conexões:** **vários nós** (8–12) espalhados na grade, ligados por múltiplas linhas que se desenham quase em paralelo — metáfora da rede solidária "+500 profissionais". Um nó central (paciente) irradia para os demais.

Ambas: mesma grade, mesmas cores, mesmo acento; só muda a topologia do path e a contagem de nós.

## Arquitetura / componentes
- **Novo:** `src/sections/HeroTelemedicina.tsx` — componente autocontido que substitui o `HeroCanvas` inline do `RevivazPreview.tsx`.
  - Props: `variant: 1 | 2` (para o lab de decisão); default definido após escolha.
  - `useRef` no wrapper + SVG; `useEffect` monta desenho da rota (getTotalLength + WAAPI/rAF) e limpa no unmount.
  - Grade e imagem: CSS puro (sem JS).
  - Reduced-motion: rota **já desenhada** (offset 0), nós estáticos, sem parallax, sem pulsos.
  - Mantém o texto/copy e os handlers atuais (`openAgendar`, eyebrow rotativo).
- **Editar:** `src/RevivazPreview.tsx` — remover o `HeroCanvas` inline e renderizar `<HeroTelemedicina/>`. Não tocar no resto da landing.
- **Imagem:** salvar em `public/revivaz/hero-tele.webp` (nome novo; não sobrescrever assets atuais até aprovação).

## Responsividade / a11y
- Mobile: imagem sobe/reduz, grade com célula maior (menos pontos), **sem parallax**, rota mais curta/simples; texto full-width.
- SVG/grade decorativos: `aria-hidden="true"`. Texto é HTML real (lido independente da animação).
- Contraste do texto sobre navy/foto ≥ 4.5:1 (gradiente garante área escura sob o texto).
- Foco de teclado visível nos 2 botões.

## Fora de escopo (YAGNI)
- Sem three.js/WebGL, sem GSAP, sem vídeo.
- Não mexer em outras seções da landing.
- Sem A/B de copy do hero (mantém a atual).

## Verificação
- Lab local (`demos/hero-lab/` ou porta separada) mostrando **as 2 variantes** para o dono escolher **antes** de integrar na landing.
- Após escolha: integrar em `RevivazPreview`, `npm run build` verde (5 entradas Vite), preview em `localhost:5173`.
- `prefers-reduced-motion: reduce` → rota estática desenhada, sem loop/pulsos.
- Mobile ≤520px: sem overflow horizontal, sem parallax, imagem legível, texto com contraste.
- Console sem erros novos.
