# Bloco "Como cuidamos" — ECG da Revivaz

**Data:** 2026-07-15
**Origem:** variação v6 "ECG da operação" (GSAP+canvas) criada no NookTrack em 03/jul e reservada em memória (`reference-revivaz-v6-ecg`) para reuso na Revivaz, adaptada aqui à identidade Revivaz.

## Objetivo
Uma seção de landing com uma linha de **eletrocardiograma** desenhada em canvas 2D percorrendo o bloco; a cada batida (complexo QRS) um dos 4 benefícios pulsa em ciclo. O batimento é a metáfora central: **vida / cuidado em saúde mental**. Diferencial visual forte, na paleta e no tom da Revivaz.

## Decisões (aprovadas no brainstorming)
- **Visual:** faixa **escura de contraste** (fundo navy `#0B1D3A`) no meio da landing clara. A linha ECG teal brilha (efeito de fósforo/cauda).
- **Tom:** **humano/acolhedor** — sem HUD techy "72 BPM", sem monospace. Tudo em **Nunito**. Eyebrow "COMO CUIDAMOS", HUD suave "♡ vida ativa".
- **Posição:** logo **após o hero**, antes de "O futuro do cuidado".
- **Técnica:** componente React isolado, **zero dependência nova** (porta o GSAP para `requestAnimationFrame` + `transform` direto + Web Animations API). `IntersectionObserver` (anima só visível) + fallback `prefers-reduced-motion` estático.

## Copy (final)
- **Eyebrow:** `COMO CUIDAMOS`
- **HUD:** `♡ vida ativa`
- **Manifesto:** "Cada batida é **uma pessoa acolhida.**" / "Cuidar de saúde mental é o nosso sinal vital."
- **Sub:** "A Revivaz conecta você a psicólogos e psiquiatras solidários — do primeiro acolhimento à consulta, sem filas e sem burocracia."
- **4 benefícios** (pulsam em ciclo):
  1. **Sem filas** — Atendimento rápido, longe da espera do SUS.
  2. **Receita direto pra você** — Chega por e-mail, SMS ou WhatsApp, sem burocracia.
  3. **Rede solidária** — Profissionais que atendem com valores acessíveis.
  4. **Acolhimento na hora** — IA que acalma na crise e te leva a um humano.

## Mapeamento de paleta (original neon-verde → Revivaz teal)
| Original | Revivaz |
|---|---|
| fundo `#050505` | navy `#0B1D3A` (band) + vinheta navy nas bordas |
| grade milimetrada verde 2% | grade teal `rgba(0,191,216,.04 / .02)` |
| linha `#78faae` / `#10b981` | linha `teal300 #00BFD8` (topo) + `teal500 #00A8BF` (meio) + glow teal |
| caneta/glow verde | caneta `teal300` com glow teal |
| eyebrow/acento verde | `teal300` |
| Inter / JetBrains Mono | **Nunito** (já auto-hospedada) |
| HUD "SINAL · 72 BPM" | "♡ vida ativa" (Nunito, sem número) |

## Arquitetura / componentes
- **Novo:** `src/sections/EcgValor.tsx` — componente autocontido.
  - `useRef` no wrapper + canvas; `useEffect` monta o loop rAF e limpa no unmount.
  - **Onda:** reusa a função `wave(t)` (P-QRS-T via gaussianas) e `drift(t)` do original — matemática idêntica, só cor muda.
  - **Loop (substitui gsap.ticker):** `requestAnimationFrame`; cauda de fósforo via `globalCompositeOperation='destination-out'`; caneta posicionada por `style.transform` (substitui `gsap.quickSetter`).
  - **Pulso de benefício (substitui gsap.timeline):** Web Animations API (`element.animate(...)`) para o flash de opacidade do card + ping do dot + ring.
  - **Entrada:** IntersectionObserver dispara a animação de entrada (fade/translate via WAAPI ou classe CSS) e o loop só quando o bloco entra na viewport; pausa ao sair.
  - **Reduced-motion:** `matchMedia('(prefers-reduced-motion: reduce)')` → desenha o traçado completo estático, benefícios a 100%, sem loop.
  - Estilos: objeto de estilos inline no padrão do `RevivazPreview.tsx` (tokens `T.teal*`, `T.navy`, Nunito) + um `<style>` local só para keyframes/grade se necessário.
- **Editar:** `src/RevivazPreview.tsx` — `import EcgValor` e renderizar a seção imediatamente após o hero.

## Responsividade / a11y
- 4 col → 2 col (≤880px) → 1 col (≤520px), como no original.
- `aria-label` na seção; canvas `aria-hidden`; benefícios são texto real (lidos por leitor de tela independente da animação).
- Contraste texto sobre navy conferido (branco .9 / teal300).

## Fora de escopo (YAGNI)
- Não adicionar GSAP ao projeto.
- Não mexer no resto da landing além de inserir a seção.
- Sem A/B de posição (posição já decidida: após hero).

## Verificação
- `npm run build` verde (5 entradas Vite).
- Preview local aberto no **Brave** (regra: front sempre Brave): a linha corre, os 4 benefícios pulsam em ciclo, caneta com glow, cauda esvaece.
- Simular `prefers-reduced-motion: reduce` → traçado estático, sem loop.
- Checar mobile (≤520px): 1 coluna, altura do ECG reduzida, sem overflow horizontal.
- Sem erro no console.
