# Oculto no site até o banco novo (Diogo)

Escondido em 19/10/2026, a pedido do dono, para ninguém se cadastrar, agendar ou entrar na conversa antes do banco existir.

## Como reverter (tudo de uma vez)

1. `src/cadastroAberto.ts`: trocar `CADASTRO_ABERTO = false` para `true`.
2. `npx tsc -b && npx vitest run`, conferir no navegador QA (PC e celular 390).
3. Deploy só com "pode subir" (receita em `DEPLOY.md`) + Purge Everything.

Reverter só uma parte: tirar o `CADASTRO_ABERTO &&` do item na tabela abaixo.

## O que está escondido

| Item | Onde | Ao reabrir faz |
|---|---|---|
| Entrar / Cadastre-se (topo, PC) | `src/RevivazPreview.tsx` (cabeçalho) | abre login / cadastro |
| Entrar / Cadastre-se (menu do celular) | `src/RevivazPreview.tsx` (menu mobile) | idem |
| Agendar consulta (topo) | `src/RevivazPreview.tsx` | abre o modal de agendamento (`openAgendar`) |
| "Quero conversar" do topo (PC e celular) | `src/sections/HeroScrubFrames.tsx` (2 botões) | `openAgendar` (fechado: ia para /acolhimento) |
| Botão flutuante "Conversar agora" | `src/RevivazPreview.tsx` (CTA fixo no canto) | leva a `/acolhimento` |
| Bloco "seja voluntário" | `src/sections/FaixaProximoEncontro.tsx` (`onVoluntario`) | cadastro de profissional |
| Badge "Abrir minha conta" (seção dos celulares) | `src/sections/CelularesRolagem.tsx` | abre /conta. A seção dos celulares continua visível |
| "Pedir consulta" / "Entrar na minha conta" e "Peça uma consulta" | `src/acolhimento/AcolhimentoChat.tsx` | botões do chat de acolhimento |

## O que continua no ar

- Seção "Precisa conversar? Comece por aqui" (conversa de exemplo + botão "Começar conversa" para /acolhimento).
- `/acolhimento` e `/conta` abrem pelo endereço direto (admin e profissionais).
- Celulares "Sua conta Revivaz" (sem o botão).
