# Revivaz — painel

Ler isto primeiro. Detalhe do dia em `CHECKPOINT-AAAA-MM-DD.md`; receita de deploy em `DEPLOY.md`.

## Estado (19/10/2026, fim do dia)

| Parte | Situação |
|---|---|
| Site no ar | revivaz.com.br, Cloudflare ativo (NS já são Cloudflare; erro de DNS da HOSTMIDIA é falso) |
| Celulares "Sua conta Revivaz" | fundo branco + grade que acende (GridPulse) + badge vidro com borda turquesa→magenta e celular 3D |
| IA do acolhimento | prompt curto (2–3 frases, 1 pergunta), convite "Pedir consulta" uma vez, respiração 1 passo por vez |
| Tela do chat | pontinhos; depois de 5 s "Pensando com cuidado na sua resposta…"; texto revela em ≤ 0,8 s |
| Oculto até o banco do Diogo | cadastro, agendamento, conversa ("Quero conversar", flutuante) — lista e como reverter em `OCULTO-ATE-O-BANCO.md` |
| Motor (ponte Claude na VPS) | perfil `acolhimento` no ar desde 19/10 19:12 (CLI enxuto, opus): IA no site 5,4–6,0 s (antes 9–11 s). Backup `bridge.mjs.bak-20261019` |

## Checkpoint 19/10 noite → retomar 20/10

- **No ar:** cadastro/agendamento/"Abrir minha conta"/voluntário OCULTOS (`src/cadastroAberto.ts`, `CADASTRO_ABERTO=false`); celulares ficam, só sem botão. Comunicado só `index.html` (Fellipe, sem WhatsApp, capa logo Vivaz).
- **Branch:** `feat/design-cadastro-login` (de `4bdcbd4`), sem código ainda. NÃO subir: cadastro fica fechado até o banco do Diogo (quinta 22/10).
- **Prévias prontas (testadas, fluxo até "Cadastro concluído"):** `~/Área de trabalho/previa-revivaz/cadastro/index.html` — A aurora · B grade · C roda. Abrir só no navegador QA (`cdp.py --slot claude-revivaz`).
- **Amanhã, nesta ordem:** 1) dono escolhe A, B ou C; 2) dono decide: link mágico já cria a conta OU tela de cadastro separada;
  3) implementar na branch: `src/conta/Login.tsx` + cadastro (nome, nascimento + responsável se <18, e-mail/celular, bloco/apto, consentimento LGPD) com efeitos estilo 21st; 4) testes + `tsc -b`, sem deploy.

## Próximo

0. **Próxima sessão: o dono vai descrever um ajuste no "flow"** (fluxo da conversa/cadastro). Ler este painel, perguntar o que é, não sair mexendo.
1. **Quarta 21/10/2026: banco de dados.** O Supabase `akobilxqkwkcfyqdlzzf.supabase.co` não resolve DNS (nem PC nem VPS) desde ≤19/10:
   "Pedir consulta" (`server/routes/lead.ts`) dá erro e o pedido se perde; Entrar/Cadastre-se não funcionam.
   Opção 1 (recomendada): dono abre supabase.com e diz se está pausado (reativar) ou apagado (recriar + `supabase/migrations/0001–0010`).
   Opção 2: Postgres na VPS.
2. Depois do banco, pedido do dono (19/10): ansiedade/sono livres sem login; **falar com especialista ou continuar conversa
   exige cadastro rápido (e-mail ou Google/Gmail)** e a conversa fica gravada (tabelas `conversas`/`mensagens`, como o `ChatIA` da conta).
   Atenção LGPD: dado de saúde = sensível, pedir consentimento explícito no cadastro e citar na privacidade. Prévia HTML antes.
3. Deploy: o build PRECISA de `--build-arg VITE_SUPABASE_URL/ANON_KEY` (ver `DEPLOY.md`); os envios de 19/10 saíram sem.

1. (Dono: "só mexe na Revivaz, esquece Tecnopano" — não portar o patch.)
2. Link "Como funciona" do menu: opção 1 (#encontros) ou 2 (publicar `ComoEEncontro`) — dono decide.
3. Rodar `teste-pessoas.ts` de novo depois de qualquer mudança no prompt.

## Regras do dono

- Deploy só com "pode subir"/"deploy" explícito; todo deploy termina com Purge Everything no Cloudflare.
- Mudança de tela: prévia HTML com dado real em `~/Área de trabalho/previa-revivaz/` antes.
- A ponte é da Tecnopano: mexer só com OK do dono, sempre compatível (sem `perfil` nada muda).
- Não commitar: `.vscode/tasks.json`, `revivaz.code-workspace`, `docs/ESTRATEGIA-CONDOMINIO-E-EXPANSAO.md`, `src/sections/ComoEEncontro.tsx`, `remotion/public/`.
- 🔴 Comunicado Vivaz: fonte única de datas/equipe/link → [COMUNICADO-VIVAZ-SPEC.md](COMUNICADO-VIVAZ-SPEC.md) (início 26/11 quinta, Flávia antes do Walter, link só comunicado.revivaz.com.br)
