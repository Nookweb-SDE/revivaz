# Revivaz — painel

Ler isto primeiro. Detalhe do dia em `CHECKPOINT-AAAA-MM-DD.md`; receita de deploy em `DEPLOY.md`.

## Estado (21/10/2026)

| Parte | Situação |
|---|---|
| Site no ar | revivaz.com.br, Cloudflare ativo (NS já são Cloudflare; erro de DNS da HOSTMIDIA é falso) |
| Celulares "Sua conta Revivaz" | fundo branco + grade que acende (GridPulse) + badge vidro com borda turquesa→magenta e celular 3D |
| IA do acolhimento | prompt curto (2–3 frases, 1 pergunta), convite "Pedir consulta" uma vez, respiração 1 passo por vez |
| Tela do chat | pontinhos; depois de 5 s "Pensando com cuidado na sua resposta…"; texto revela em ≤ 0,8 s |
| Oculto até o banco do Diogo | cadastro, agendamento, conversa ("Quero conversar", flutuante) e, desde 21/10, a seção "Consulta por vídeo, com hora marcada" — lista e como reverter em `OCULTO-ATE-O-BANCO.md` |
| Repositório principal | **github.com/Nookweb-SDE/revivaz** (`main`), remote local `nookweb`; push com `gh auth switch --user Nookweb-SDE` e voltar para IZAI-SDE. O antigo `origin` (IZAI-SDE) parou em 9c40e20 |
| Motor (ponte Claude na VPS) | perfil `acolhimento` no ar desde 19/10 19:12 (CLI enxuto, opus): IA no site 5,4–6,0 s (antes 9–11 s). Backup `bridge.mjs.bak-20261019` |

## Checkpoint 21/10 noite — banco do Diogo + login por e-mail

- **Banco:** projeto "Operation" do Diogo (`vsztmvkuojmsftnfkzma`), schema `revivaz`; `profiles` virou `revivaz_users`. Auth é COMPARTILHADO com os outros apps dele (a senha que a pessoa cria vale lá também). Chaves só no `.env` / Docker secret.
- **Branch `feat/login-link-senha-card`** (push em `nookweb` e `origin`, SEM deploy): `458634e` banco → `8a93349` → `9010c70` login → `701352e` código 8 dígitos → `a7e9831` e-mail estilo NookTrack → commit do deploy (este).
- **Como funciona:** e-mail → servidor gera link + senha temporária (8 dígitos, `generate_link` do admin, o GoTrue NÃO manda e-mail) → manda pelo SMTP da Revivaz → pessoa clica no link OU digita a senha → 1º acesso cria a própria senha. Avisos no canto com cadeado 3D (medidas da NookTrack).
- **Testado local (QA lab):** pedir acesso, senha temporária, criar senha, link, link reusado (bloqueia), código errado (bloqueia). Conta de teste: `profissional.teste@revivaz.app`.
- **SMTP:** `mail.revivaz.com.br` aponta para a VPS — NÃO serve. O servidor real é `r220us.hmservers.net` (465 SSL e 587, cert Let's Encrypt ok). Usuário `contato@revivaz.com.br`.
- **Dono 21/10 noite: "pode subir, mas sem os botões"** → produção: `/conta` mostra "Acesso em breve" e `/api/auth/acesso` responde 404 (`ACESSO_EMAIL_ABERTO=0` no stack). Dev: tudo funciona. Abrir no ar = `CADASTRO_ABERTO=true` + `ACESSO_EMAIL_ABERTO=1` + secret `revivaz_smtp_pass` (ver comentário no `docker-stack.yml`).
- O classificador NÃO deixa o Claude criar Docker secret nem usar senha achada em conversa antiga: esses passos o dono roda com `!`.
- **Falta para funcionar no ar (quando abrir):** 1) dono manda a senha do e-mail → `.env` (SMTP_PASS) e na VPS `revivaz_smtp_pass`; 2) na VPS criar `revivaz_service_role_operation` (service_role do Diogo); 3) "pode subir" → build com o `.env` novo, `docker stack deploy` (o stack mudou: secrets novos), Purge Everything.
- Sem SMTP_PASS: em dev o e-mail sai no console da API; em produção a rota responde 503 ("Não consegui enviar o e-mail").

## Checkpoint 21/10

- **NO AR 21/10 ~17:20** (`f1058dd`, deploy leve, imagem anterior = `revivaz:prev-20261021`, Purge feito, MISS): conferido no PC — sem "terapeuta", sem consulta (só "Não espere consulta. Ligue 188"), menu "Para participantes", comunicado sem botão do site. A conferência no celular (390) não rodou: o `clica --lab largura` não mudou a largura.
- Pedidos da Flávia no ar (commit `691935e`): consulta por vídeo oculta, menu "Para participantes", "terapeutas" → "profissionais da saúde" (lei em tramitação no Senado). Detalhe em `OCULTO-ATE-O-BANCO.md`.
- Comunicado: sem o botão "Conhecer o site Revivaz".
- Diogo vai montar o banco novo (Supabase) a partir do repo Nookweb: migrations 0001–0010 + seed. Chaves chegam por fora do git.
- Config de agente (.claude, .cursor, .agents, .mcp.json, skills-lock.json) saiu do git (fica no disco, no .gitignore).
- 2ª leva da Flávia (16:12): 3 perguntas frequentes da consulta ocultas + frase do responsável legal.
- 3ª leva (dono, 21/10): sem menção a consulta no site, só "Não espere consulta. Ligue 188" (crise, fica). Opção "Quero falar com um psicólogo" do exemplo de conversa também oculta. Celulares 3D ficam como estão (dono, 21/10).

## Checkpoint 19/10 noite → retomar 20/10

- **No ar:** cadastro/agendamento/"Abrir minha conta"/voluntário OCULTOS (`src/cadastroAberto.ts`, `CADASTRO_ABERTO=false`); celulares ficam, só sem botão. Comunicado só `index.html` (Fellipe, sem WhatsApp, capa logo Vivaz).
- **Branch:** `feat/design-cadastro-login` (de `4bdcbd4`), sem código ainda. NÃO subir: cadastro fica fechado até o banco do Diogo (quinta 22/10).
- **Prévias prontas (testadas, fluxo até "Cadastro concluído"):** `~/Área de trabalho/previa-revivaz/cadastro/index.html` — A aurora · B grade · C roda. Abrir só no navegador QA (`cdp.py --slot claude-revivaz`).
- **Amanhã, nesta ordem:** 1) dono escolhe A, B ou C; 2) dono decide: link mágico já cria a conta OU tela de cadastro separada;
  3) implementar na branch: `src/conta/Login.tsx` + cadastro (nome, nascimento + responsável se <18, e-mail/celular, bloco/apto, consentimento LGPD) com efeitos estilo 21st; 4) testes + `tsc -b`, sem deploy.

## Próximo

0. **Banco ligado na branch `feat/login-link-senha-card` (21/10 noite).** Próximo: senha SMTP do dono + deploy (ver checkpoint acima). Itens antigos:
   a) **Banco (Diogo)** no repo Nookweb: Supabase novo + `supabase/migrations/0001–0010` + `seed.sql`; chaves por fora do git → pôr no `.env`.
      O antigo `akobilxqkwkcfyqdlzzf` não resolve DNS desde ≤19/10 ("Pedir consulta"/login quebrados).
   b) Com o banco no ar: `CADASTRO_ABERTO = true` reabre TUDO de uma vez (lista em `OCULTO-ATE-O-BANCO.md`), rebuild com as chaves novas, deploy leve, Purge.
   c) Cadastro/login: dono escolhe prévia A/B/C (`~/Área de trabalho/previa-revivaz/cadastro/`) e link mágico vs tela de cadastro.
   d) Conferir revivaz.com.br no celular (390): no 21/10 o `clica --lab largura` não mudou a largura.
   e) E-mail `contato@revivaz.com.br`: webmail https://webmail.revivaz.com.br; senha nova é o dono que troca no cPanel (https://cpanel.revivaz.com.br, Contas de e-mail › Gerenciar) — senha NUNCA no vault/git. Texto pro grupo já entregue (sem pedir troca de senha).
   f) Repo antigo `origin` (IZAI-SDE) parou em 9c40e20: decidir se arquiva ou mantém espelho.
1. Pedido do dono (19/10), depois do banco: ansiedade/sono livres sem login; **falar com especialista ou continuar conversa
   exige cadastro rápido (e-mail ou Google/Gmail)** e a conversa fica gravada (tabelas `conversas`/`mensagens`, como o `ChatIA` da conta).
   Atenção LGPD: dado de saúde = sensível, pedir consentimento explícito no cadastro e citar na privacidade. Prévia HTML antes.
2. Deploy: o build PRECISA de `--build-arg VITE_SUPABASE_URL/ANON_KEY` (ver `DEPLOY.md`); internet lenta → "Deploy leve" no `DEPLOY.md`.

1. (Dono: "só mexe na Revivaz, esquece Tecnopano" — não portar o patch.)
2. Link "Como funciona" do menu: opção 1 (#encontros) ou 2 (publicar `ComoEEncontro`) — dono decide.
3. Rodar `teste-pessoas.ts` de novo depois de qualquer mudança no prompt.

## Regras do dono

- Deploy só com "pode subir"/"deploy" explícito; todo deploy termina com Purge Everything no Cloudflare.
- Mudança de tela: prévia HTML com dado real em `~/Área de trabalho/previa-revivaz/` antes.
- A ponte é da Tecnopano: mexer só com OK do dono, sempre compatível (sem `perfil` nada muda).
- Não commitar: `.vscode/tasks.json`, `revivaz.code-workspace`, `docs/ESTRATEGIA-CONDOMINIO-E-EXPANSAO.md`, `src/sections/ComoEEncontro.tsx`, `remotion/public/`.
- 🔴 Comunicado Vivaz: fonte única de datas/equipe/link → [COMUNICADO-VIVAZ-SPEC.md](COMUNICADO-VIVAZ-SPEC.md) (início 26/11 quinta, Flávia antes do Walter, link só comunicado.revivaz.com.br)
