# Deploy do Revivaz

Só com "pode subir"/"deploy" do dono.

## Site

```bash
cd ~/Projetos/revivaz
npx vitest run && npm run build
docker build -t revivaz:latest .
docker save revivaz:latest | gzip | ssh tecnopano-vps 'gunzip | docker load'
ssh tecnopano-vps 'docker service update --force --replicas 1 --image revivaz:latest revivaz_web'
node ~/.local/share/revivaz-ops/cf.mjs        # Purge Everything (CDP no Chrome :9222 do dono)
```

Depois: abrir revivaz.com.br no celular (390) e no PC, conversar com o acolhimento, conferir console.

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
