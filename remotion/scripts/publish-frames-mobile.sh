#!/usr/bin/env bash
#
# Versão do hero para celular, em public/revivaz/hero-m/.
#
# Recorta em pé (proporção ~0,64) e reduz para 432 px de largura: na tela de
# 390 px o quadro inteiro de 1440 px seria jogado fora quase todo pelo
# object-fit, e o download (~3 MiB) não se pagaria no 4G.
#
# O recorte acompanha o assunto: começa no centro (mulher no sofá) e desliza
# para a direita entre os quadros 40 e 90, onde ficam as mãos no teclado e o
# psicólogo na tela do notebook.
set -euo pipefail

cd "$(dirname "$0")/.."

SRC="out/frames"
DEST="../public/revivaz/hero-m"
CROP_W=920      # de 2560x1440: 920/1440 ≈ 0,64
WIDTH=432
CRF=44
BUDGET_KB=1300

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

printf '%s\n' "${frames[@]}" | sort | nl -v0 -ba | \
  xargs -P "$jobs" -L1 bash -c '
    # centro do recorte: 50% até o quadro 40, 66,7% a partir do 90
    x=$(awk -v n="$5" -v w="$2" "BEGIN{
      t=(n-40)/50; if(t<0)t=0; if(t>1)t=1; t=t*t*(3-2*t);
      c=2560*(0.5+0.1667*t); printf \"%d\", c-w/2 }")
    printf -v out "%s/f%03d.avif" "$1" "$5"
    ffmpeg -v error -y -i "$6" -vf "crop=$2:1440:$x:0,scale=$3:-2" \
      -c:v libaom-av1 -still-picture 1 -crf "$4" -cpu-used 6 "$out"
  ' _ "$DEST" "$CROP_W" "$WIDTH" "$CRF"

# Poster em WebP: LCP no celular e fallback de quem não decodifica AVIF.
x=$(awk -v w="$CROP_W" 'BEGIN{ printf "%d", 1280 - w/2 }')
ffmpeg -v error -y -i "$SRC/element-055.png" -vf "crop=$CROP_W:1440:$x:0,scale=$WIDTH:-2" \
  -c:v libwebp -quality 80 "$DEST/poster.webp"

bytes=$(cat "$DEST"/f*.avif "$DEST/poster.webp" | wc -c)
echo "frames: ${#frames[@]} · transferência: $((bytes / 1024)) KiB (orçamento $BUDGET_KB KiB)"
if [ "$bytes" -gt $(( BUDGET_KB * 1024 )) ]; then
  echo "ERRO: estourou o orçamento. Suba o CRF em passos de 4 e rode de novo." >&2
  exit 1
fi
echo "ok"
