#!/bin/sh
# ============================================================================
# secrets-env-shim.sh — ponte Docker secret (*_FILE) → env que o Jitsi ENTENDE.
#
# POR QUÊ: as imagens jitsi/* (web/prosody/jicofo/jvb, tag stable-9646 do
# docker-jitsi-meet) NÃO têm resolvedor genérico de `*_FILE`. Os scripts
# cont-init.d leem as variáveis SEM sufixo direto do ambiente:
#   prosody: `if [[ -z $JICOFO_AUTH_PASSWORD ]]; then FATAL ERROR ...; exit 1`
#            idem JVB_AUTH_PASSWORD; o JWT é renderizado de JWT_APP_SECRET puro.
# Se só definirmos os *_FILE (Docker secret), as vars reais ficam VAZIAS:
#   (1) prosody/jvb abortam no boot com FATAL ERROR → stack não sobe;
#   (2) JWT_APP_SECRET vazio ≠ o segredo com que o server assina → "qualquer
#       um/ninguém entra" (exatamente o risco que o escopo manda evitar).
#
# O QUE FAZ: para cada par <VAR>_FILE definido, se <VAR> ainda não estiver no
# ambiente, exporta <VAR>="$(cat <arquivo>)". Depois executa o entrypoint
# original do Jitsi (/init via s6). Os segredos continuam SÓ via Docker secret
# em /run/secrets — nada de texto puro em compose/.env/repo.
#
# Mantém o segredo fora de `ps`/logs: lê via redirecionamento, sem echo.
# ============================================================================
set -eu

load_secret() {
  # $1 = nome da var (ex.: JWT_APP_SECRET); resolve a partir de <VAR>_FILE.
  var_name="$1"
  file_var="${var_name}_FILE"

  # valor atual da var (sem sufixo) e do *_FILE, via eval seguro.
  eval "cur=\${${var_name}:-}"
  eval "file_path=\${${file_var}:-}"

  # já definido sem sufixo? respeita (não sobrescreve).
  [ -n "${cur}" ] && return 0
  # sem *_FILE apontado? nada a fazer (outra var pode estar setada noutro serviço).
  [ -z "${file_path}" ] && return 0
  # arquivo do secret existe e é legível?
  if [ ! -r "${file_path}" ]; then
    echo "[secrets-shim] AVISO: ${file_var}=${file_path} não legível — pulando ${var_name}" >&2
    return 0
  fi

  # exporta sem expor o valor em logs.
  val="$(cat "${file_path}")"
  export "${var_name}=${val}"
  unset val
  echo "[secrets-shim] ${var_name} carregado de ${file_path}" >&2
}

# Todos os segredos de auth que as imagens jitsi exigem sem sufixo.
load_secret JWT_APP_SECRET
load_secret JICOFO_COMPONENT_SECRET
load_secret JICOFO_AUTH_PASSWORD
load_secret JVB_AUTH_PASSWORD

# Entrega ao entrypoint original do Jitsi (s6-overlay).
exec /init
