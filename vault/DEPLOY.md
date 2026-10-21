# Deploy do Revivaz

Só com "pode subir"/"deploy" do dono.

## Site

```bash
cd ~/Projetos/revivaz
npx vitest run && npm run build
set -a; . ./.env; set +a   # .env fica fora da imagem (.dockerignore); o front só conhece o Supabase via build-arg
docker build -t revivaz:latest --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" .
docker save revivaz:latest | gzip | ssh tecnopano-vps 'gunzip | docker load'
ssh tecnopano-vps 'docker service update --force --replicas 1 --image revivaz:latest revivaz_web'
node ~/.local/share/revivaz-ops/cf.mjs        # Purge Everything (CDP no Chrome :9222 do dono)
```

Depois: abrir revivaz.com.br no celular (390) e no PC, conversar com o acolhimento, conferir console.

> ⚠️ 21/10 noite: o `.env` tem `NODE_ENV=development` (liga o dev-login no `npm run dev:api`). O `vite build`
> obedecia a isso e o site no ar saiu em modo dev (faixa "Acesso rápido (dev)" no bundle). Desde `989fcf4`+ o
> script `build` força `NODE_ENV=production`. Conferir antes de subir: `grep -c 'fileName:"/home' dist/assets/conta-*.js` → 0.
>
> Se `package*.json` mudou (ex.: nodemailer em 21/10), o deploy leve manda também `package*.json` e o Dockerfile
> do delta roda `npm ci --omit=dev` em cima da imagem anterior.

## Deploy leve (internet de subida lenta) — usado em 21/10

A imagem inteira tem ~561 MB; em 21/10 a subida estava a ~15 KB/s (11 h). Se `package*.json` e o `Dockerfile`
NÃO mudaram desde a imagem que roda na VPS, mande só o que muda (~29 MB) e monte em cima dela:

```bash
npx vitest run && npm run build
tar czf /tmp/app.tgz dist server src/acolhimento src/video src/lib tsconfig.json   # pastas = allowlist do Dockerfile
ssh tecnopano-vps 'rm -rf /tmp/revivaz-delta && mkdir -p /tmp/revivaz-delta/app && cat > /tmp/revivaz-delta/app.tgz' < /tmp/app.tgz
ssh tecnopano-vps 'cd /tmp/revivaz-delta && tar xzf app.tgz -C app \
  && docker tag revivaz:latest revivaz:prev-$(date +%Y%m%d) \
  && printf "FROM revivaz:prev-$(date +%Y%m%d)\nRUN rm -rf /app/dist /app/server /app/src\nCOPY app/ /app/\n" > Dockerfile \
  && docker build -q -t revivaz:latest . && docker service update --force --replicas 1 --image revivaz:latest revivaz_web'
```

`FROM` tem que ser uma TAG (com ID puro o BuildKit tenta baixar do Docker Hub e falha).
Voltar atrás: `docker service update --image revivaz:prev-AAAAMMDD revivaz_web`.

Purge: o `cf.mjs` sozinho só abre o painel. Passar o clique como argumento:
`D=<pasta> node ~/.local/share/revivaz-ops/cf.mjs '<ir a /<conta>/revivaz.com.br/caching/configuration, clicar "Purge Everything" e depois o ÚLTIMO botão "Purge Everything" (diálogo)>'`.
Conferir: `curl -sI --compressed https://revivaz.com.br/ | grep cf-cache-status` → MISS.

## Ponte (motor da IA, compartilhada com a Tecnopano)

Roda na VPS: systemd `claude-bridge`, `User=claudeia`, `/opt/tecnopano-claude/bridge.mjs`.

```bash
scp vault/ponte-perfil-acolhimento.patch tecnopano-vps:/tmp/
ssh tecnopano-vps 'cd /tmp && sudo cp -p /opt/tecnopano-claude/bridge.mjs bridge.mjs \
  && sudo patch bridge.mjs ponte-perfil-acolhimento.patch && node --check bridge.mjs \
  && sudo cp -p /opt/tecnopano-claude/bridge.mjs /opt/tecnopano-claude/bridge.mjs.bak-$(date +%Y%m%d) \
  && sudo install -o root -g claudeia -m 750 bridge.mjs /opt/tecnopano-claude/bridge.mjs \
  && sudo install -d -o claudeia -g claudeia -m 750 /home/claudeia/revivaz-vazio \
  && sudo systemctl restart claude-bridge && systemctl is-active claude-bridge'
```

Conferir: `sudo journalctl -u claude-bridge -n 5` mostra `perfil=acolhimento` nas perguntas do Revivaz.
Voltar atrás: copiar o `.bak-AAAAMMDD` por cima e reiniciar.

## Quadros do celular (se mudar a cena 3D)

`gravar-cel.html` temporário na raiz importa `/src/sections/celulares3d/cena.ts`, `montarCena(canvas,false,"vertical")`,
`quadro(k/95, k/24)`, fundo `#fff`, Playwright headless `--use-angle=swiftshader --enable-unsafe-swiftshader`;
cada quadro `ffmpeg -c:v libaom-av1 -still-picture 1 -crf 34 -cpu-used 6 -pix_fmt yuv420p`;
`parado.webp` = quadro 60 (PIL, qualidade 80).
