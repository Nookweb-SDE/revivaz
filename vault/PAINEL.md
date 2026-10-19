# Revivaz — painel

Ler isto primeiro. Detalhe do dia em `CHECKPOINT-AAAA-MM-DD.md`; receita de deploy em `DEPLOY.md`.

## Estado (19/10/2026)

| Parte | Situação |
|---|---|
| Site no ar | revivaz.com.br, Cloudflare ativo (NS já são Cloudflare; erro de DNS da HOSTMIDIA é falso) |
| Celulares "Sua conta Revivaz" | fundo branco + grade que acende (GridPulse) + badge vidro com borda turquesa→magenta e celular 3D |
| IA do acolhimento | prompt curto (2–3 frases, 1 pergunta), convite "Pedir consulta" uma vez, respiração 1 passo por vez |
| Tela do chat | pontinhos; depois de 5 s "Pensando com cuidado na sua resposta…"; texto revela em ≤ 0,8 s |
| Motor (ponte Claude na VPS) | perfil `acolhimento` no ar desde 19/10 19:12 (CLI enxuto, opus): IA no site 5,4–6,0 s (antes 9–11 s). Backup `bridge.mjs.bak-20261019` |

## Próximo

1. Levar o patch da ponte para o repo da Tecnopano (`deploy/claude-vps/bridge.mjs`), senão o próximo deploy da ponte apaga o perfil. Só com OK do dono.
2. Link "Como funciona" do menu: opção 1 (#encontros) ou 2 (publicar `ComoEEncontro`) — dono decide.
3. Rodar `teste-pessoas.ts` de novo depois de qualquer mudança no prompt.

## Regras do dono

- Deploy só com "pode subir"/"deploy" explícito; todo deploy termina com Purge Everything no Cloudflare.
- Mudança de tela: prévia HTML com dado real em `~/Área de trabalho/previa-revivaz/` antes.
- A ponte é da Tecnopano: mexer só com OK do dono, sempre compatível (sem `perfil` nada muda).
- Não commitar: `.vscode/tasks.json`, `revivaz.code-workspace`, `docs/ESTRATEGIA-CONDOMINIO-E-EXPANSAO.md`, `src/sections/ComoEEncontro.tsx`, `remotion/public/`.
