# Jitsi Meet self-host — Revivaz (`meet.revivaz.com.br`)

Atendimento virtual **in-app**: o app Revivaz embute a sala via `external_api.js`
e o paciente/profissional entra com um **JWT (HS256)** emitido pelo nosso server
(`server/jitsiJwt.ts`) só pra quem é da consulta. O Prosody valida esse JWT com o
**mesmo segredo** e o **mesmo `app_id`**. Sem token válido a sala **não abre**
(`ENABLE_GUESTS=0`) — dado de saúde + vídeo, segurança é crítica.

- VPS: **Contabo izai** — `194.163.150.113`, Ubuntu, **Docker Swarm + Traefik v3**.
- Rede pública existente: `traefik-public` (external). Cert via resolver `le`.
- Stack file: `infra/jitsi/docker-compose.yml`. Stack name sugerido: `jitsi`.

> ⚠️ Tudo abaixo roda **no Contabo** (este repo só guarda os arquivos; **não**
> deployamos daqui). Segredo **só via Docker secret** — nunca em `.env`/compose/repo.

---

## 0. Pré-requisitos

- Acesso SSH ao Contabo (`ssh -i ~/.ssh/izai_contabo ...`).
- Swarm já iniciado e rede `traefik-public` existente (`docker network ls`).
- Traefik v3 rodando com entrypoint `websecure` + certresolver `le` (já é o caso
  dos outros stacks da VPS).

---

## 1. DNS — `meet.revivaz.com.br` → `194.163.150.113`

Criar um **registro A**:

```
meet.revivaz.com.br.   A   194.163.150.113   (TTL 300)
```

(O domínio `revivaz.com.br` já está fora do Vercel desde 22/jun. Onde estiver
gerido o DNS da zona `revivaz.com.br`, adicionar este `A`.) Confirmar:

```bash
dig +short meet.revivaz.com.br      # deve responder 194.163.150.113
```

---

## 2. Abrir **UDP 10000** no firewall (mídia do JVB)

O Jitsi VideoBridge recebe o áudio/vídeo por **UDP 10000**. Sem essa porta a sala
até conecta, mas fica **preta/muda**. Manter 80/443 já abertos (Traefik) e:

```bash
# UFW (Contabo costuma usar UFW)
sudo ufw allow 10000/udp
sudo ufw reload
sudo ufw status | grep 10000
```

> Se houver firewall do painel Contabo além do UFW, abrir **10000/UDP** lá também.
> NÃO fechar 443/80/22.

---

## 3. Criar os **Docker secrets** (gerar valores novos — NÃO usar placeholders)

Quatro secrets. **Anote o `revivaz_jitsi_jwt_secret`** — ele é o **mesmo** que o
stack do revivaz vai usar em `JITSI_JWT_SECRET` (passo 6).

```bash
# JWT da sala — é o que assina (server) e valida (prosody) o acesso à consulta.
# GUARDE este valor (vai p/ o stack revivaz também). 32 bytes hex:
JWT=$(openssl rand -hex 32); echo "GUARDE -> JITSI_JWT_SECRET=$JWT"
printf '%s' "$JWT" | docker secret create revivaz_jitsi_jwt_secret -

# Segredos INTERNOS do Jitsi (só vivem dentro do stack; não vão p/ lugar nenhum):
printf '%s' "$(openssl rand -hex 16)" | docker secret create jicofo_component_secret -
printf '%s' "$(openssl rand -hex 16)" | docker secret create jicofo_auth_password -
printf '%s' "$(openssl rand -hex 16)" | docker secret create jvb_auth_password -

docker secret ls | grep -E 'revivaz_jitsi_jwt_secret|jicofo_|jvb_'
```

> Para **rotacionar** um secret depois: `docker secret rm <nome>` só funciona se
> nenhum serviço o usa. O caminho seguro é criar `..._v2`, apontar o compose pro
> novo e `stack deploy` de novo. Se rotacionar o **JWT**, rotacione também no
> stack do revivaz (senão os tokens param de validar).

---

## 4. Deploy do stack Jitsi

Copiar o `docker-compose.yml` **e** o `secrets-env-shim.sh` pra VPS (mesma pasta,
ex. `/opt/stacks/jitsi/` — o compose referencia `./secrets-env-shim.sh` como
Docker config) e:

```bash
cd /opt/stacks/jitsi
ls -l secrets-env-shim.sh             # precisa existir junto do compose
docker stack deploy -c docker-compose.yml jitsi

# acompanhar (web/prosody/jicofo/jvb devem ficar 1/1, jvb global):
docker stack services jitsi
docker service logs -f jitsi_prosody   # checar que carregou o token plugin

# ⚠️ O boot do prosody/jvb NÃO pode ter FATAL (segredo via *_FILE não chega
# sozinho às imagens jitsi — o shim resolve, mas confirme):
docker service logs jitsi_prosody 2>&1 | grep -i 'FATAL\|must be set'   # vazio = OK
docker service logs jitsi_jvb     2>&1 | grep -i 'FATAL\|must be set'   # vazio = OK
docker service logs jitsi_prosody 2>&1 | grep -i secrets-shim          # vê o shim carregando
```

Primeiro boot do Traefik leva ~30-60s pra emitir o cert LE de `meet.revivaz.com.br`.
Testar:

```bash
curl -sI https://meet.revivaz.com.br/external_api.js | head -n1   # 200 OK esperado
```

Abrir `https://meet.revivaz.com.br/qualquersala` **direto no navegador** deve
**recusar** (pede token) — isso confirma que `ENABLE_AUTH=1` / `ENABLE_GUESTS=0`
estão valendo. A entrada legítima é só **pelo app**, com JWT.

---

## 5. Sanidade do JWT (server ⇄ prosody)

O server emite o token com `server/jitsiJwt.ts` (HS256, `aud/iss=app_id`,
`sub=domain`, `room`, `exp`, `context.user`, `moderator`). Para casar com este
stack, os valores **TÊM que bater**:

| server (env do stack revivaz) | aqui (compose Jitsi)         | valor    |
|-------------------------------|------------------------------|----------|
| `JITSI_APP_ID`                | `JWT_APP_ID` (web+prosody)   | `revivaz`|
| `JITSI_DOMAIN`                | host do Traefik              | `meet.revivaz.com.br` |
| `JITSI_JWT_SECRET`            | secret `revivaz_jitsi_jwt_secret` | (passo 3) |

> Se mudar `JWT_APP_ID` no compose, mude `JITSI_APP_ID` no revivaz junto.

---

## 6. Configurar o stack do **revivaz** pra usar o Jitsi

No `docker-stack.yml` do revivaz (serviço `web`), adicionar as envs e o secret.
O server resolve `JITSI_JWT_SECRET` via `resolveSecret('JITSI_JWT_SECRET', ...)`
(padrão `*_FILE` já usado pelo Gemini/service_role).

```yaml
# em secrets: (topo do docker-stack.yml do revivaz)
secrets:
  # ...existentes...
  revivaz_jitsi_jwt_secret: { external: true }   # MESMO secret do passo 3

services:
  web:
    environment:
      # ...existentes...
      - JITSI_DOMAIN=meet.revivaz.com.br
      - JITSI_APP_ID=revivaz
      - JITSI_JWT_SECRET_FILE=/run/secrets/revivaz_jitsi_jwt_secret
    secrets: [ ..., revivaz_jitsi_jwt_secret ]
```

**Front (build-arg, público):** o Vite precisa de `VITE_JITSI_DOMAIN` no
**build** (não em runtime). No build da imagem revivaz:

```bash
# .env de build / Dockerfile ARG → ENV → vite build
VITE_JITSI_DOMAIN=meet.revivaz.com.br
```

`src/video/config.ts` lê isso: com `VITE_JITSI_DOMAIN` setado, `jitsiConfigured`
fica `true` e o app embute a `SalaVideo`. **Sem** ele, degrada gracioso (abre
`link_ou_local` externo — comportamento atual).

Redeploy do revivaz depois de setar tudo:

```bash
cd /opt/stacks/revivaz && docker stack deploy -c docker-stack.yml revivaz
```

---

## 7. Checklist final

- [ ] `dig +short meet.revivaz.com.br` → `194.163.150.113`
- [ ] `ufw status` mostra `10000/udp ALLOW`
- [ ] 4 secrets criados (`docker secret ls`)
- [ ] `secrets-env-shim.sh` copiado junto do compose em `/opt/stacks/jitsi/`
- [ ] `jitsi` services: `web/prosody/jicofo` 1/1, `jvb` global up
- [ ] `docker service logs jitsi_prosody | grep -i 'FATAL\|must be set'` → **vazio**
- [ ] `docker service logs jitsi_jvb | grep -i 'FATAL\|must be set'` → **vazio**
- [ ] `JWT_APP_SECRET` efetivo no prosody == valor do secret `revivaz_jitsi_jwt_secret`
- [ ] `https://meet.revivaz.com.br/external_api.js` → 200
- [ ] sala direta no navegador é **recusada** (precisa JWT)
- [ ] **isolamento de sala:** token emitido p/ `consulta-X` é **RECUSADO** ao abrir
      `consulta-Y` (emitir 1 token via `/api/consulta/room-token` e tentar outra sala)
- [ ] **moderador:** o profissional entra como moderador (vê mute/kick/lobby);
      o JWT traz `context.user.moderator=true` p/ profissional, `false` p/ paciente
- [ ] revivaz com `JITSI_DOMAIN/APP_ID/JWT_SECRET_FILE` + secret + `VITE_JITSI_DOMAIN`
- [ ] consulta `online`/`agendada`: "Entrar" abre a `SalaVideo` in-app c/ áudio+vídeo
- [ ] barra de crise **188/192/196** visível na sala (paciente)

---

## Notas de segurança

- **Nenhum segredo** no compose, `.env` ou repo — só Docker secret (`external: true`).
  ⚠️ **As imagens `jitsi/*` (stable-9646) NÃO suportam `*_FILE` nativamente** para
  os segredos de auth (`JWT_APP_SECRET`, `JICOFO_COMPONENT_SECRET`,
  `JICOFO_AUTH_PASSWORD`, `JVB_AUTH_PASSWORD`): os scripts `cont-init.d` leem só a
  variável **sem sufixo**. Por isso o stack usa o **shim de entrypoint**
  `secrets-env-shim.sh` (montado como Docker config `jitsi_secrets_shim`), que
  exporta cada var a partir de `/run/secrets/...` **antes** de chamar o `/init`
  original do Jitsi. Sem o shim, o prosody/jvb dão **`FATAL ERROR ... must be set`**
  no boot e o `JWT_APP_SECRET` fica **vazio** (sala sem auth / token não valida).
  O único `*_FILE` que essas imagens entendem de fábrica é o do autoscaler-sidecar
  (`AUTOSCALER_SIDECAR_KEY_FILE`), que não usamos aqui.
  O JWT secret nunca chega ao front; o front só recebe o **token já emitido** pelo
  `/api/consulta/room-token`.
- **Restrição de sala (room claim):** o JWT carrega a claim `room` =
  `consulta-<id>` e o prosody **tem que enforçar** que o token só abre essa sala.
  Com `ENABLE_AUTH=1`/`AUTH_TYPE=jwt` o `mod_token_verification` valida a claim
  `room` quando presente — todo token nosso a inclui. **Obrigatório validar no
  deploy** (ver checklist) que um token de `consulta-X` é **recusado** ao tentar
  abrir `consulta-Y`; senão a premissa "só o paciente e o profissional DAQUELA
  consulta entram" cai (dado de saúde + vídeo).
- `ENABLE_GUESTS=0` + `ENABLE_AUTH=1` ⇒ sala fechada por padrão. O `room-token`
  do server é quem decide (via `service_role`) se o caller é paciente/profissional
  **daquela** consulta `online` e `agendada`/`realizada`. JWT com `exp` curto (~2h).
- Bancos/Prosody/JVB-XMPP **não** expostos: só `web` (via Traefik 443) e `jvb`
  (UDP 10000) tocam a rede pública. Rede `meet` é overlay interna.
