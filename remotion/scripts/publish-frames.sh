#!/usr/bin/env bash
#
# Publica a sequência renderizada pelo Remotion em public/revivaz/hero/.
#
# Vai direto do PNG do render para AVIF: uma única etapa com perda. A versão
# anterior passava por WebP q80 no meio, o que jogava fora detalhe antes do
# encode final sem ganho nenhum.
#
# AVIF em vez de WebP porque, medido nestes frames, entrega a mesma nitidez
# em 1440 px pesando menos da metade (2,49 MiB contra 5,23 MiB). Quem não
# suporta AVIF cai no poster estático — o mesmo caminho de prefers-reduced-motion.
set -euo pipefail

cd "$(dirname "$0")/.."

SRC="out/frames"
DEST="../public/revivaz/hero"
WIDTH=1440
CRF=44          # medido: indistinguível da fonte em recorte 1:1 no rosto.
                # Parece alto porque a entrada é PNG cru, com grão; vindo de
                # um WebP já suavizado o mesmo resultado sairia por volta de 30.
POSTER_FRAME=85 # meio da sequência, no plano do close
BUDGET_MB=3

shopt -s nullglob
frames=("$SRC"/element-*.png)
if [ ${#frames[@]} -eq 0 ]; then
  echo "erro: nenhum PNG em $SRC. Rode 'npm run render' antes." >&2
  exit 1
fi

mkdir -p "$DEST"
rm -f "$DEST"/f*.avif

jobs=$(( $(nproc) - 2 )); [ "$jobs" -lt 1 ] && jobs=1
echo "convertendo ${#frames[@]} frames em $jobs processos..."

# xargs anexa as palavras da linha DEPOIS dos argumentos fixos:
# $1..$3 são DEST/WIDTH/CRF, $4 é o índice e $5 o caminho do PNG.
printf '%s\n' "${frames[@]}" | sort | nl -v0 -ba | \
  xargs -P "$jobs" -L1 bash -c '
    printf -v out "%s/f%03d.avif" "$1" "$4"
    ffmpeg -v error -y -i "$5" -vf "scale=$2:-2" \
      -c:v libaom-av1 -still-picture 1 -crf "$3" -cpu-used 6 "$out"
  ' _ "$DEST" "$WIDTH" "$CRF"

# Poster: WebP porque é o LCP e o fallback de quem não decodifica AVIF,
# então precisa abrir em qualquer navegador.
printf -v poster_src "%s/element-%03d.png" "$SRC" "$POSTER_FRAME"
ffmpeg -v error -y -i "$poster_src" -vf "scale=$WIDTH:-2" \
  -c:v libwebp -quality 80 "$DEST/poster.webp"

total=${#frames[@]}
cat > "$DEST/manifest.json" <<JSON
{ "total": $total, "fps": 14, "base": "/revivaz/hero", "ext": "avif", "poster": "/revivaz/hero/poster.webp" }
JSON

bytes=$(cat "$DEST"/f*.avif "$DEST/poster.webp" | wc -c)
# LC_NUMERIC=C: em locale pt_BR o printf recusa o ponto decimal do bc.
LC_NUMERIC=C printf 'frames: %d · transferência: %.2f MiB (orçamento %d MiB)\n' \
  "$total" "$(echo "scale=4; $bytes/1048576" | bc)" "$BUDGET_MB"

if [ "$bytes" -gt $(( BUDGET_MB * 1024 * 1024 )) ]; then
  echo "ERRO: estourou o orçamento. Suba o CRF em passos de 4 e rode de novo." >&2
  exit 1
fi
echo "ok"
