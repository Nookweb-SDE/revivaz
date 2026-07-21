# Remotion — composição do hero

**Ferramenta de build. Não é dependência do site.** O bundle da Revivaz não
importa nada daqui; o que chega ao site são os frames publicados em
`public/revivaz/hero/`.

## Rodar

```bash
npm install
npm run studio     # pré-visualizar a composição
npm run render     # renderiza out/frames/element-NNN.png  (171 frames, 14 fps)
npm run publish    # converte para AVIF em ../public/revivaz/hero/ e valida o orçamento
```

`publish` falha com código 1 se a sequência estourar 3 MiB — o orçamento é um
gate, não um comentário.

## Assets de entrada

`public/` **não é versionado**: são ~42 MB de mídia gerada por IA que já existe,
byte a byte, fora do repositório. Para reconstruir:

| arquivo em `remotion/public/` | origem |
|---|---|
| `mae.png` | `~/Área de trabalho/Revivaz-assets/modelo/decupagem/p0.png` |
| `ots.png` | `~/Área de trabalho/Revivaz-assets/modelo/decupagem/p3b.png` |
| `close.mp4` | `~/Área de trabalho/Revivaz-assets/modelo/decupagem/hd2.mp4` |

Conferir com `md5sum` depois de copiar.

`medico.png` era entrada do corner-pin abandonado (ver histórico da Task 3) e
não é usado pela composição atual.

## Por que AVIF e não WebP

Medido nestes frames, em 1440 px: a sequência inteira sai em ~2,9 MiB em AVIF
contra ~5,2 MiB em WebP, com os dois indistinguíveis da fonte num recorte 1:1
no rosto. O CRF alto (44) não indica qualidade baixa — a entrada é PNG cru com
grão, e é o grão que consome os bits.

Quem não decodifica AVIF (Safari < 16.4) cai no `poster.webp`, pelo mesmo
caminho de `prefers-reduced-motion`. Os frames são decorativos: nenhum conteúdo
depende deles.

## Por que sequência de imagens e não vídeo

Scrub preciso em `<video>` exige todo frame como keyframe (`-g 1`), o que mediu
6,8 MB para 13,9 s. Sequência de imagens tem seek instantâneo, sem decode de
GOP, e coube em menos da metade disso.
