# Hero Revivaz — Pipeline Híbrido com Remotion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o hero da landing por uma sequência de quatro planos dirigida pelo scroll, servida como frames WebP e composta com Remotion fora do bundle.

**Architecture:** Remotion é ferramenta de **build**, num projeto isolado com `package.json` próprio; ele renderiza a sequência para `public/revivaz/hero/f###.webp`. No site, um canvas troca o frame conforme o scroll, com GSAP `ScrollTrigger` lendo a posição. A lógica de mapeamento scroll→frame vive num módulo puro em `src/lib/`, testável com o vitest atual (`environment: node`); o componente React só consome.

**Tech Stack:** React 18.3.1 · Vite · TypeScript · **gsap 3.12.5 (já instalado)** + ScrollTrigger (já vem no pacote) · Remotion (isolado) · vitest · Playwright

## Global Constraints

- **`gsap` já é dependência do projeto** (`^3.12.5`), usado em `src/sections/EcgValor.tsx:11`. **Não** adicionar outra versão nem outra lib de animação. `ScrollTrigger` já existe em `node_modules/gsap/ScrollTrigger.js`.
- **Remotion NUNCA entra no `package.json` da raiz.** Vive em `remotion/` com `package.json` próprio. O site não o carrega em runtime.
- **`npm run build` deve continuar verde com exatamente 5 entradas Vite** (`main`, `acolhimento`, `conta`, `admin`, `profissional` — `vite.config.ts:41-48`).
- **vitest roda `environment: "node"` e inclui só `src/**/*.test.ts`** (`vitest.config.ts`). Não incluir `.tsx` nem jsdom: a lógica testável deve ser extraída para módulo puro.
- **Tokens de cor canônicos** em `src/conta/ui.ts:3-20`: `teal900 #004D5C`, `teal700 #007A8C`, `teal500 #00A8BF`, `teal300 #00BFD8`, `teal100 #D6F4F8`, `navy #0B1D3A`, `red #E5484D`, `white #FFFFFF`.
- **Tipografia: Nunito**, sempre `'Nunito',sans-serif`. Wordmark = texto, peso 900, `letter-spacing: -0.02em`. **Não existe logo SVG no projeto.**
- **Copy em português.** Proibido nome de médico ou paciente inventado na tela (a v3 gerou "Dr. Elias" e "Sarah M." — não repetir).
- **Orçamento:** frames desktop somados ≤ 3 MB; poster ≤ 60 KB.
- **`prefers-reduced-motion: reduce`** é obrigatório em todo componente com movimento.
- **React 18 não reconhece `fetchPriority` camelCase** — usar `{...{ fetchpriority: "high" }}`.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/frameScrub.ts` | **Criar.** Lógica pura: progresso 0–1 → índice de frame, e nomes de arquivo. Sem DOM, sem React. |
| `src/lib/frameScrub.test.ts` | **Criar.** Testes unitários da lógica acima. |
| `src/sections/HeroScrubFrames.tsx` | **Criar.** Componente do hero: canvas + GSAP + textos. Consome `frameScrub.ts`. |
| `src/RevivazPreview.tsx` | **Modificar.** Trocar `<HeroTelemedicina/>` por `<HeroScrubFrames/>`; remover `heroVariant`. |
| `src/sections/HeroTelemedicina.tsx` | **Remover** na última tarefa. |
| `remotion/` | **Criar.** Projeto isolado: composição, planos, tela da Revivaz. |
| `public/revivaz/hero/` | **Criar.** Saída: `f000.webp…`, `poster.webp`, `manifest.json`. |

---

### Task 1: Módulo puro de mapeamento scroll → frame

**Files:**
- Create: `src/lib/frameScrub.ts`
- Test: `src/lib/frameScrub.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `frameIndex(progress: number, total: number): number` · `frameSrc(base: string, index: number): string` · `framePaths(base: string, total: number): string[]`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/frameScrub.test.ts
import { describe, it, expect } from "vitest";
import { frameIndex, frameSrc, framePaths } from "./frameScrub";

describe("frameIndex", () => {
  it("mapeia as extremidades para o primeiro e o último frame", () => {
    expect(frameIndex(0, 100)).toBe(0);
    expect(frameIndex(1, 100)).toBe(99);
  });

  it("mapeia o meio para o frame do meio", () => {
    expect(frameIndex(0.5, 101)).toBe(50);
  });

  it("prende valores fora de 0–1 em vez de estourar o array", () => {
    expect(frameIndex(-3, 100)).toBe(0);
    expect(frameIndex(9, 100)).toBe(99);
  });

  it("devolve 0 quando não há frames, em vez de -1", () => {
    expect(frameIndex(0.5, 0)).toBe(0);
  });

  it("tolera progresso NaN devolvendo o primeiro frame", () => {
    expect(frameIndex(NaN, 100)).toBe(0);
  });
});

describe("frameSrc", () => {
  it("formata o índice com três dígitos", () => {
    expect(frameSrc("/revivaz/hero", 0)).toBe("/revivaz/hero/f000.webp");
    expect(frameSrc("/revivaz/hero", 7)).toBe("/revivaz/hero/f007.webp");
    expect(frameSrc("/revivaz/hero", 170)).toBe("/revivaz/hero/f170.webp");
  });
});

describe("framePaths", () => {
  it("gera a lista completa na ordem", () => {
    const p = framePaths("/revivaz/hero", 3);
    expect(p).toEqual([
      "/revivaz/hero/f000.webp",
      "/revivaz/hero/f001.webp",
      "/revivaz/hero/f002.webp",
    ]);
  });

  it("devolve lista vazia para total 0", () => {
    expect(framePaths("/revivaz/hero", 0)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/frameScrub.test.ts`
Expected: FAIL — `Failed to resolve import "./frameScrub"`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/frameScrub.ts
/**
 * Mapeamento puro entre progresso de scroll e índice de frame.
 * Sem DOM e sem React de propósito: assim roda no vitest atual,
 * que usa environment "node" e só inclui src/**\/*.test.ts.
 */

/** Índice do frame para um progresso 0–1. Sempre dentro de [0, total-1]. */
export function frameIndex(progress: number, total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  const p = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0;
  return Math.round(p * (total - 1));
}

/** Caminho de um frame. O índice é sempre de três dígitos. */
export function frameSrc(base: string, index: number): string {
  return `${base}/f${String(index).padStart(3, "0")}.webp`;
}

/** Todos os caminhos, na ordem — usado para pré-carregar. */
export function framePaths(base: string, total: number): string[] {
  if (!Number.isFinite(total) || total <= 0) return [];
  return Array.from({ length: total }, (_, i) => frameSrc(base, i));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/frameScrub.test.ts`
Expected: PASS — 7 testes

- [ ] **Step 5: Commit**

```bash
git add src/lib/frameScrub.ts src/lib/frameScrub.test.ts
git commit -m "feat(hero): lógica pura de mapeamento scroll -> frame"
```

---

### Task 2: Projeto Remotion isolado + tela da Revivaz

**Files:**
- Create: `remotion/package.json`, `remotion/remotion.config.ts`, `remotion/tsconfig.json`, `remotion/src/Root.tsx`, `remotion/src/ui/TelaRevivaz.tsx`, `remotion/.gitignore`

**Interfaces:**
- Consumes: tokens de `src/conta/ui.ts` (copiados, ver nota).
- Produces: componente `<TelaRevivaz medico={string} />` — recebe o caminho da imagem do médico e desenha a moldura.

**Nota sobre os tokens:** o projeto Remotion tem `tsconfig` próprio e fica fora do `include` da raiz. Copiar os seis valores para `TelaRevivaz.tsx` com um comentário apontando a fonte, em vez de importar através da fronteira — importar criaria acoplamento entre dois projetos com configs diferentes.

- [ ] **Step 1: Criar o projeto isolado**

```bash
mkdir -p remotion/src/ui remotion/public
cd remotion
```

```json
// remotion/package.json
{
  "name": "revivaz-hero-remotion",
  "private": true,
  "version": "1.0.0",
  "description": "Composição do hero da Revivaz. Ferramenta de BUILD — não é dependência do site.",
  "scripts": {
    "studio": "remotion studio",
    "render": "remotion render HeroSequence out/frames --sequence --image-format=webp"
  },
  "dependencies": {
    "@remotion/cli": "4.0.240",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "remotion": "4.0.240"
  },
  "devDependencies": {
    "@types/react": "18.3.12",
    "typescript": "5.6.3"
  }
}
```

```json
// remotion/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

```
# remotion/.gitignore
node_modules
out
```

```ts
// remotion/remotion.config.ts
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
```

- [ ] **Step 2: Escrever a tela da Revivaz**

```tsx
// remotion/src/ui/TelaRevivaz.tsx
import React from "react";
import { staticFile } from "remotion";

/**
 * A tela de teleconsulta como a Revivaz a desenharia.
 * Tokens copiados de src/conta/ui.ts:3-20 — o projeto Remotion tem tsconfig
 * próprio e não compartilha paths com o site.
 *
 * Regras fixadas pela spec:
 *   - só o médico, sem PiP e sem sidebar
 *   - nenhum nome de médico ou paciente (a v3 inventou "Dr. Elias"/"Sarah M.")
 *   - copy em português
 */
const T = {
  teal300: "#00BFD8",
  navy: "#0B1D3A",
  red: "#E5484D",
  white: "#FFFFFF",
} as const;

export const TelaRevivaz: React.FC<{ medico: string }> = ({ medico }) => (
  <div
    style={{
      position: "relative",
      width: "100%",
      height: "100%",
      background: "#000",
      fontFamily: "'Nunito', sans-serif",
      overflow: "hidden",
    }}
  >
    <img
      src={staticFile(medico)}
      alt=""
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />

    {/* faixa superior: só o wordmark */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "11%",
        display: "flex",
        alignItems: "center",
        padding: "0 3%",
        background: "linear-gradient(180deg, rgba(11,29,58,.72), transparent)",
      }}
    >
      <span
        style={{
          color: T.teal300,
          fontWeight: 900,
          fontSize: "min(4.2vh, 34px)",
          letterSpacing: "-0.02em",
        }}
      >
        Revivaz
      </span>
    </div>

    {/* controles: três, discretos */}
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: "6%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "2.2%",
      }}
    >
      {[
        { bg: "rgba(255,255,255,.92)", fg: T.navy, label: "microfone" },
        { bg: "rgba(255,255,255,.92)", fg: T.navy, label: "câmera" },
        { bg: T.red, fg: T.white, label: "encerrar" },
      ].map((b) => (
        <div
          key={b.label}
          aria-label={b.label}
          style={{
            width: "min(7vh, 54px)",
            height: "min(7vh, 54px)",
            borderRadius: "50%",
            background: b.bg,
            boxShadow: "0 6px 16px rgba(0,0,0,.4)",
          }}
        />
      ))}
    </div>
  </div>
);
```

- [ ] **Step 3: Instalar e verificar que compila**

```bash
cd remotion && npm install && npx tsc --noEmit
```
Expected: instala e o `tsc` termina sem erro.

- [ ] **Step 4: Confirmar que a raiz não foi contaminada**

```bash
cd .. && git status --short package.json package-lock.json
```
Expected: **saída vazia** — nenhum arquivo da raiz alterado. Se `package.json` aparecer, o `npm install` rodou no diretório errado; reverter com `git checkout package.json package-lock.json`.

- [ ] **Step 5: Commit**

```bash
git add remotion/package.json remotion/tsconfig.json remotion/remotion.config.ts remotion/.gitignore remotion/src/ui/TelaRevivaz.tsx
git commit -m "build(hero): projeto Remotion isolado com a tela real da Revivaz"
```

---

### Task 3: Composição dos quatro planos

**Files:**
- Create: `remotion/src/Root.tsx`, `remotion/src/HeroSequence.tsx`, `remotion/src/shots/KenBurns.tsx`
- Assets: copiar para `remotion/public/` — `mae.png` (imagem-mãe 4K), `ots.png` (over-the-shoulder), `close.mp4` (vídeo 1080p), `medico.png`

**Interfaces:**
- Consumes: `<TelaRevivaz medico={string} />` da Task 2.
- Produces: composição `HeroSequence`, 171 frames a 14 fps (12,214 s). Saída em `remotion/out/frames/element-###.webp`.

**Origem dos assets** (já gerados, em `~/Área de trabalho/Revivaz-assets/modelo/`):
- `decupagem/p0.png` → `mae.png`
- `decupagem/p3b.png` → `ots.png`
- `decupagem/hd2.mp4` → `close.mp4`
- `../medico/d3.png` → `medico.png`

- [ ] **Step 1: Escrever o componente de movimento de câmera**

```tsx
// remotion/src/shots/KenBurns.tsx
import React from "react";
import { interpolate, useCurrentFrame, staticFile } from "remotion";

export type Box = { x: number; y: number; w: number };

/**
 * Movimento de câmera digital sobre uma imagem estática.
 * É isto que trava a identidade: plano aberto e médio são o MESMO pixel,
 * só com recorte diferente — não há render novo para derivar.
 *
 * Box em fração da imagem: x/y = canto superior esquerdo, w = largura.
 * A altura sai do aspect 16:9 do frame.
 */
export const KenBurns: React.FC<{
  src: string;
  from: Box;
  to: Box;
  durationInFrames: number;
}> = ({ src, from, to, durationInFrames }) => {
  const frame = useCurrentFrame();
  const t = [0, durationInFrames - 1];

  const w = interpolate(frame, t, [from.w, to.w], { extrapolateRight: "clamp" });
  const x = interpolate(frame, t, [from.x, to.x], { extrapolateRight: "clamp" });
  const y = interpolate(frame, t, [from.y, to.y], { extrapolateRight: "clamp" });

  const scale = 1 / w;

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <img
        src={staticFile(src)}
        alt=""
        style={{
          position: "absolute",
          width: `${scale * 100}%`,
          left: `${-x * scale * 100}%`,
          top: `${-y * scale * 100}%`,
          display: "block",
        }}
      />
    </div>
  );
};
```

- [ ] **Step 2: Escrever a composição**

```tsx
// remotion/src/HeroSequence.tsx
import React from "react";
import { AbsoluteFill, Sequence, Video, staticFile, interpolate, useCurrentFrame } from "remotion";
import { KenBurns } from "./shots/KenBurns";
import { TelaRevivaz } from "./ui/TelaRevivaz";

export const FPS = 14;
export const TOTAL = 171;

const A = 60;   // plano aberto -> médio (crop da imagem-mãe)
const B = 55;   // close (vídeo)
const C = 56;   // ponto de vista (imagem OTS)

/** Fade de saída nos últimos 8 frames de um plano. */
const Fade: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [dur - 8, dur - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const HeroSequence: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#04080f" }}>
    {/* 1+2 · aberto -> médio: mesmo pixel, só recorte */}
    <Sequence durationInFrames={A}>
      <Fade dur={A}>
        <KenBurns
          src="mae.png"
          from={{ x: 0.02, y: 0.02, w: 0.96 }}
          to={{ x: 0.22, y: 0.10, w: 0.60 }}
          durationInFrames={A}
        />
      </Fade>
    </Sequence>

    {/* 3 · close: vídeo, porque é onde piscar e respirar importam */}
    <Sequence from={A} durationInFrames={B}>
      <Fade dur={B}>
        <Video src={staticFile("close.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Fade>
    </Sequence>

    {/* 4 · ponto de vista: tela real composta sobre a imagem */}
    <Sequence from={A + B} durationInFrames={C}>
      <KenBurns
        src="ots.png"
        from={{ x: 0.06, y: 0.06, w: 0.88 }}
        to={{ x: 0.20, y: 0.14, w: 0.64 }}
        durationInFrames={C}
      />
      {/* Corner-pin por clip-path, medido uma vez sobre ots.png.
          A spec previa gerar a imagem com a tela em verde e fazer chroma key;
          clip-path chega ao mesmo resultado sem regerar a imagem nem
          implementar recorte por cor — a tela desenhada em ots.png fica
          simplesmente coberta. A imagem é estática, então os cantos não mudam. */}
      <AbsoluteFill
        style={{
          clipPath: "polygon(45.5% 52.0%, 74.0% 47.5%, 76.5% 79.5%, 44.0% 84.0%)",
        }}
      >
        <TelaRevivaz medico="medico.png" />
      </AbsoluteFill>
    </Sequence>
  </AbsoluteFill>
);
```

```tsx
// remotion/src/Root.tsx
import React from "react";
import { Composition } from "remotion";
import { HeroSequence, FPS, TOTAL } from "./HeroSequence";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="HeroSequence"
    component={HeroSequence}
    durationInFrames={TOTAL}
    fps={FPS}
    width={2560}
    height={1440}
  />
);
```

- [ ] **Step 3: Copiar os assets e renderizar**

```bash
cd remotion
ASSETS=~/"Área de trabalho/Revivaz-assets/modelo"
cp "$ASSETS/decupagem/p0.png"   public/mae.png
cp "$ASSETS/decupagem/p3b.png"  public/ots.png
cp "$ASSETS/decupagem/hd2.mp4"  public/close.mp4
cp ~/"Área de trabalho/Revivaz-assets/medico/d3.png" public/medico.png
npx remotion render HeroSequence out/frames --sequence --image-format=webp
```
Expected: `out/frames/` com 171 arquivos.

- [ ] **Step 4: Conferir o corner-pin visualmente**

Abrir `remotion/out/frames/element-140.webp` e olhar: a tela da Revivaz deve estar **dentro** da moldura do notebook, sem vazar para a mesa nem deixar borda da tela original aparecendo.

Se estiver torto, ajustar os quatro pares de `polygon()` em `HeroSequence.tsx` e renderizar de novo. **Este é o passo frágil da spec** — se após três ajustes não encaixar, seguir o plano B: remover o `<AbsoluteFill>` do corner-pin e usar a tela que já vem desenhada em `ots.png`.

- [ ] **Step 5: Commit**

```bash
cd .. && git add remotion/src remotion/public/.gitkeep 2>/dev/null; git add remotion/src
git commit -m "feat(hero): composição dos quatro planos no Remotion"
```

---

### Task 4: Publicar frames e manifesto no site

**Files:**
- Create: `public/revivaz/hero/f000.webp` … `f170.webp`, `public/revivaz/hero/poster.webp`, `public/revivaz/hero/manifest.json`

**Interfaces:**
- Consumes: `remotion/out/frames/` da Task 3.
- Produces: `manifest.json` no formato `{ "total": number, "fps": number, "base": string }` — lido pelo componente da Task 5.

- [ ] **Step 1: Converter, renomear e medir**

```bash
mkdir -p public/revivaz/hero
i=0
for f in $(ls remotion/out/frames/*.webp | sort); do
  ffmpeg -v error -y -i "$f" -vf scale=1440:-2 -c:v libwebp -quality 72 \
    "public/revivaz/hero/f$(printf %03d $i).webp"
  i=$((i+1))
done
ffmpeg -v error -y -i public/revivaz/hero/f085.webp -c:v libwebp -quality 78 public/revivaz/hero/poster.webp
echo "frames: $(ls public/revivaz/hero/f*.webp | wc -l) · total: $(du -sh public/revivaz/hero | cut -f1)"
```

- [ ] **Step 2: Verificar o orçamento**

Expected: **171 frames** e total **≤ 3 MB**.

Se passar de 3 MB, baixar a qualidade em passos de 6 (`-quality 66`, depois `60`) e medir de novo. Se ainda passar, reduzir para `scale=1280:-2`. **Não** reduzir a contagem de frames abaixo de 140 — abaixo disso o movimento vira degrau.

- [ ] **Step 3: Escrever o manifesto**

```bash
cat > public/revivaz/hero/manifest.json <<'JSON'
{ "total": 171, "fps": 14, "base": "/revivaz/hero" }
JSON
```

- [ ] **Step 4: Commit**

```bash
git add public/revivaz/hero
git commit -m "assets(hero): frames WebP da sequência + poster e manifesto"
```

---

### Task 5: Componente do hero com canvas + GSAP

**Files:**
- Create: `src/sections/HeroScrubFrames.tsx`

**Interfaces:**
- Consumes: `frameIndex`, `frameSrc`, `framePaths` de `src/lib/frameScrub.ts` (Task 1); frames da Task 4.
- Produces: `export default function HeroScrubFrames(props: { heroLines: string[]; heroIdx: number; openAgendar: () => void; bp?: "mobile" | "tablet" | "desktop" })` — mesma assinatura do `HeroTelemedicina` que ele substitui.

- [ ] **Step 1: Escrever o componente**

```tsx
// src/sections/HeroScrubFrames.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { frameIndex, frameSrc, framePaths } from "../lib/frameScrub";

gsap.registerPlugin(ScrollTrigger);

const T = {
  teal500: "#00A8BF", teal300: "#00BFD8", teal100: "#D6F4F8", navy: "#0B1D3A",
} as const;

const BASE = "/revivaz/hero";
const TOTAL_DESKTOP = 171;
const TOTAL_MOBILE = 60;   // conjunto reduzido: mobile não faz scrub

type BP = "mobile" | "tablet" | "desktop";

const ETAPAS = [
  { titulo: "Acolhimento", texto: "Você não precisa esperar melhorar sozinho para pedir ajuda." },
  { titulo: "Consulta por vídeo", texto: "Da sua poltrona, com um profissional que combina com você." },
  { titulo: "Sem sair de casa", texto: "Receita digital direto no seu celular." },
];

export default function HeroScrubFrames({
  heroLines, heroIdx, openAgendar, bp = "desktop",
}: {
  heroLines: string[]; heroIdx: number; openAgendar: () => void; bp?: BP;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgsRef = useRef<HTMLImageElement[]>([]);
  const [pronto, setPronto] = useState(false);
  const [reduzido, setReduzido] = useState(false);
  const isMobile = bp === "mobile";
  const total = isMobile ? TOTAL_MOBILE : TOTAL_DESKTOP;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduzido(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* pré-carrega TODOS os frames antes de armar o trigger.
     Sem isto o scrub pula quadros que ainda não baixaram. */
  useEffect(() => {
    if (reduzido) return;
    let vivo = true;
    const paths = framePaths(BASE, total);
    let carregados = 0;
    const imgs = paths.map((src) => {
      const im = new Image();
      im.onload = im.onerror = () => {
        carregados++;
        if (vivo && carregados === paths.length) setPronto(true);
      };
      im.src = src;
      return im;
    });
    imgsRef.current = imgs;
    return () => { vivo = false; };
  }, [total, reduzido]);

  const desenhar = (i: number) => {
    const cv = canvasRef.current;
    const im = imgsRef.current[i];
    if (!cv || !im || !im.complete || !im.naturalWidth) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;
    if (cv.width !== im.naturalWidth) { cv.width = im.naturalWidth; cv.height = im.naturalHeight; }
    ctx.drawImage(im, 0, 0, cv.width, cv.height);
  };

  useLayoutEffect(() => {
    if (reduzido || isMobile || !pronto) return;
    const ctx = gsap.context(() => {
      const st = { t: 0 };
      gsap.to(st, {
        t: 1, ease: "none",
        scrollTrigger: { trigger: trackRef.current, start: "top top", end: "bottom bottom", scrub: 0.5 },
        onUpdate: () => desenhar(frameIndex(st.t, total)),
      });
      ETAPAS.forEach((_, i) => {
        gsap.to(`[data-etapa="${i}"]`, {
          opacity: 1, y: 0, ease: "none",
          scrollTrigger: {
            trigger: trackRef.current,
            start: `${20 + i * 22}% top`, end: `${32 + i * 22}% top`, scrub: true,
          },
        });
      });
      desenhar(0);
    }, trackRef);
    return () => ctx.revert();   // sem isto sobram ScrollTriggers órfãos ao trocar de rota
  }, [pronto, reduzido, isMobile, total]);

  const alturaTrilho = reduzido || isMobile ? "auto" : "380vh";
  const minH = isMobile ? 360 : 520;

  return (
    <section ref={trackRef} style={{ position: "relative", height: alturaTrilho, background: "#04080f" }}>
      <div style={{
        position: reduzido || isMobile ? "relative" : "sticky",
        top: 0, height: reduzido || isMobile ? "auto" : "100vh",
        minHeight: minH, overflow: "hidden", color: "#fff",
      }}>
        {reduzido || isMobile ? (
          <img
            src={`${BASE}/poster.webp`} alt="" aria-hidden="true"
            {...{ fetchpriority: "high" }} decoding="async"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <canvas ref={canvasRef} aria-hidden="true"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}

        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg,rgba(4,8,15,.94) 0%,rgba(4,8,15,.84) 26%,rgba(4,8,15,.38) 50%,transparent 68%)",
        }} />
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg,rgba(4,8,15,.7) 0%,transparent 22%,transparent 68%,rgba(4,8,15,.92) 100%)",
        }} />

        <div style={{
          position: "absolute", zIndex: 20, left: isMobile ? 16 : 40,
          top: "50%", transform: "translateY(-50%)", maxWidth: isMobile ? "88%" : 500,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
            color: T.teal300, marginBottom: 13, minHeight: 20,
          }}>
            {heroLines[heroIdx]}
          </div>
          <h1 style={{
            fontFamily: "'Nunito',sans-serif", fontWeight: 900,
            fontSize: isMobile ? 30 : 52, lineHeight: 1.03, letterSpacing: "-0.03em", margin: "0 0 13px",
            background: `linear-gradient(90deg, ${T.teal100}, ${T.teal300} 52%, ${T.teal500})`,
            WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
          } as React.CSSProperties}>
            Saúde que conecta
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "rgba(214,244,248,.92)", margin: "0 0 24px", maxWidth: 400 }}>
            Cuidado em saúde mental de qualidade, oferecido por psiquiatras e psicólogos em trabalho solidário. Sem filas, sem burocracia.
          </p>
          <div style={{ display: "flex", gap: 13, flexWrap: "wrap" }}>
            <button onClick={openAgendar} style={{
              padding: "14px 26px", border: 0, borderRadius: 12, fontWeight: 800, fontSize: 14,
              color: "#001820", background: `linear-gradient(90deg, ${T.teal300}, ${T.teal500})`,
              cursor: "pointer", fontFamily: "inherit", minHeight: 48,
            }}>
              Agendar consulta
            </button>
            <button style={{
              padding: "14px 26px", border: `2px solid rgba(0,191,216,.5)`, borderRadius: 12,
              fontWeight: 800, fontSize: 14, color: T.teal300, background: "transparent",
              cursor: "pointer", fontFamily: "inherit", minHeight: 48,
            }}>
              Saiba como ativar
            </button>
          </div>
        </div>

        {!isMobile && (
          <div style={{
            position: "absolute", zIndex: 22, right: 44, top: "50%",
            transform: "translateY(-50%)", display: "flex", flexDirection: "column",
            gap: 20, textAlign: "right", maxWidth: 300,
          }}>
            {ETAPAS.map((e, i) => (
              <div key={e.titulo} data-etapa={i}
                style={{ opacity: reduzido ? 1 : 0, transform: reduzido ? "none" : "translateY(14px)" }}>
                <b style={{
                  display: "block", fontSize: 13, fontWeight: 800, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: T.teal300,
                }}>{e.titulo}</b>
                <span style={{ fontSize: 13, color: "rgba(214,244,248,.75)" }}>{e.texto}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/sections/HeroScrubFrames.tsx
git commit -m "feat(hero): componente de scrub por frames com canvas e GSAP"
```

---

### Task 6: Integrar na landing e remover o hero antigo

**Files:**
- Modify: `src/RevivazPreview.tsx` (import, uso do componente, remoção de `heroVariant`)
- Delete: `src/sections/HeroTelemedicina.tsx`

**Interfaces:**
- Consumes: `HeroScrubFrames` da Task 5.
- Produces: landing servindo o hero novo.

- [ ] **Step 1: Trocar o import**

Em `src/RevivazPreview.tsx`, substituir a linha
`import HeroTelemedicina from "./sections/HeroTelemedicina";`
por
`import HeroScrubFrames from "./sections/HeroScrubFrames";`

- [ ] **Step 2: Trocar o uso e remover o parâmetro de lab**

Substituir
```tsx
<HeroTelemedicina heroLines={heroLines} heroIdx={heroIdx} openAgendar={openAgendar} bp={bp} variant={heroVariant} />
```
por
```tsx
<HeroScrubFrames heroLines={heroLines} heroIdx={heroIdx} openAgendar={openAgendar} bp={bp} />
```

E apagar o bloco que define `heroVariant` (o comentário "lab de decisão do hero" e as duas linhas seguintes) — ele existia só para comparar as variantes da v2.

- [ ] **Step 3: Remover o hero antigo**

```bash
git rm src/sections/HeroTelemedicina.tsx
```

- [ ] **Step 4: Verificar tipos e build**

```bash
npx tsc --noEmit && npm run build
```
Expected: `tsc` limpo; build verde; a saída deve listar **5 arquivos `.html`** em `dist/`.

```bash
ls dist/*.html | wc -l
```
Expected: `5`

- [ ] **Step 5: Rodar a suíte**

```bash
npm test
```
Expected: todos passando, incluindo os 7 de `frameScrub.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/RevivazPreview.tsx
git commit -m "feat(hero): integrar HeroScrubFrames e remover o hero da rota SVG"
```

---

### Task 7: Verificação headless end-to-end

**Files:**
- Create: `e2e/03-hero-scrub.spec.ts`

**Interfaces:**
- Consumes: a landing integrada da Task 6.
- Produces: nada — é o portão de qualidade.

- [ ] **Step 1: Escrever o teste**

```ts
// e2e/03-hero-scrub.spec.ts
import { test, expect } from "@playwright/test";

/**
 * Portão do hero. O que estes testes protegem, em ordem de dor:
 *  - o scrub tem que andar com o scroll E voltar ao subir
 *  - reduced-motion não pode virar trilho de 380vh
 *  - nada de overflow horizontal no mobile
 */
test.describe("hero com scrub por frames", () => {
  test("o frame acompanha o scroll e volta ao subir", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const canvas = page.locator("section canvas").first();
    await expect(canvas).toBeVisible();

    const topo = await canvas.screenshot();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35));
    await page.waitForTimeout(900);
    const meio = await canvas.screenshot();
    expect(Buffer.compare(topo, meio)).not.toBe(0);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1200);
    const voltou = await canvas.screenshot();
    expect(Buffer.compare(topo, voltou)).toBe(0);
  });

  test("reduced-motion entrega poster estático, sem trilho", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/");

    await expect(page.locator("section canvas")).toHaveCount(0);
    await expect(page.locator(`img[src*="poster.webp"]`)).toBeVisible();

    const altura = await page.locator("section").first().evaluate((el) => el.getBoundingClientRect().height);
    expect(altura).toBeLessThan(900 * 1.6);   // 380vh seria ~3420
    await ctx.close();
  });

  test("mobile: sem scroll horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto("/");
    const estoura = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(estoura).toBe(false);
  });

  test("o canvas é decorativo para leitor de tela", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator("section canvas").first()).toHaveAttribute("aria-hidden", "true");
    await expect(page.getByRole("heading", { name: "Saúde que conecta" })).toBeVisible();
  });
});
```

- [ ] **Step 2: Rodar**

```bash
npx playwright test e2e/03-hero-scrub.spec.ts
```
Expected: 4 passando.

Se "o frame acompanha o scroll" falhar comparando `topo` e `voltou`, o culpado provável é o `scrub: 0.5` ainda interpolando quando o screenshot saiu — subir o `waitForTimeout` para 1600 antes de suspeitar do código.

- [ ] **Step 3: Medir o orçamento com CPU estrangulada**

```bash
du -sh public/revivaz/hero
du -h public/revivaz/hero/poster.webp
```
Expected: total ≤ 3 MB; poster ≤ 60 KB.

- [ ] **Step 4: Conferir contraste contra o frame mais claro**

O véu escuro à esquerda garante o texto, mas precisa ser verificado contra o **quadro mais claro** da sequência, não o mais escuro.

```bash
# maior luminância média entre os frames, para achar o pior caso
for f in public/revivaz/hero/f*.webp; do
  echo "$(ffmpeg -v error -i "$f" -vf "crop=iw*0.35:ih:0:0,signalstats,metadata=print:key=lavfi.signalstats.YAVG" -f null - 2>&1 | grep -o '[0-9.]*$' | tail -1) $f"
done | sort -rn | head -3
```

Abrir o frame de maior valor e conferir com o inspetor do navegador que a headline e o parágrafo mantêm ≥ 4.5:1 contra o fundo naquele ponto. Se não mantiverem, escurecer a primeira parada do véu horizontal em `HeroScrubFrames.tsx` de `rgba(4,8,15,.94)` para `.97`.

- [ ] **Step 5: Conferir o rosto — o teste que este plano existe para passar**

Abrir lado a lado `public/revivaz/hero/f010.webp`, `f070.webp` e `f150.webp` e responder: **é a mesma pessoa nos três?**

Se não for, o problema está na Task 3 (os assets de origem divergem), não aqui — voltar e regerar o plano divergente a partir da imagem-mãe.

- [ ] **Step 6: Commit**

```bash
git add e2e/03-hero-scrub.spec.ts
git commit -m "test(hero): e2e do scrub, reduced-motion, mobile e acessibilidade"
```

---

## Notas de execução

**A ordem importa.** As tarefas 1, 2 e 5 podem ser feitas sem os assets prontos. A 3 e a 4 dependem dos arquivos em `~/Área de trabalho/Revivaz-assets/` — que já existem.

**O passo frágil é o corner-pin** (Task 3, Step 4). Está isolado de propósito: se falhar três vezes, o plano B (usar a tela já desenhada em `ots.png`) não bloqueia nenhuma outra tarefa.

**Não commitar `remotion/node_modules` nem `remotion/out`** — ambos estão no `.gitignore` do projeto isolado.
