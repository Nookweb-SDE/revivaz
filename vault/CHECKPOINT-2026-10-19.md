# Checkpoint 19/10/2026

## Feito

- **Celulares** (`src/sections/CelularesRolagem.tsx`, `src/components/ui/grid-pulse.tsx`): fundo branco, grade
  GridPulse (turquesa no alto, magenta embaixo, só mouse acende; ambiente no celular), badge modelo 4 (vidro +
  borda degradê + celular 3D). Quadros do celular (`public/revivaz/cel-m/f000–f095.avif`, `parado.webp`)
  regravados com fundo branco.
- **IA do acolhimento**
  - `src/acolhimento/systemPrompt.ts`: 2–3 frases/≤60 palavras/1 pergunta; convite "Pedir consulta" uma vez;
    técnica de respiração um passo por mensagem; nunca comentar as próprias regras.
  - `server/lib/promptAcolhimento.ts`: montagem do prompt fora da rota (o teste usa o mesmo texto).
  - `server/lib/claudeBridge.ts` + rota: mandam `perfil: "acolhimento"` (ponte antiga ignora).
  - `src/acolhimento/AcolhimentoChat.tsx`: revelação ≤ 0,8 s; indicador `Pensando` com aviso depois de 5 s.

## Medidas

| Onde | Configuração | Espera |
|---|---|---|
| VPS | hoje (opus + CLAUDE.md Tecnopano 115 KB + ferramentas) | 4,8–5,4 s |
| VPS | enxuto opus effort low | 4,1–4,3 s |
| VPS | enxuto sonnet effort low | 2,8 s |

Dono escolheu **opus** (modelo atual). `BRIDGE_ACOLHIMENTO_MODEL` troca sem mexer no código.

## Teste de pessoas (25 perfis × até 4 trocas)

- Script: `~/.local/share/revivaz-ops/teste-pessoas.ts` (rodar da pasta do revivaz:
  `MODELO=opus npx tsx ~/.local/share/revivaz-ops/teste-pessoas.ts`), relatório:
  `node ~/.local/share/revivaz-ops/relatorio-pessoas.mjs <json>`.
- Opus: 23/25 sem alerta, 0 falha grave. Sonnet: 21/25 (só respostas de 72–75 palavras).
- Risco velado, crise explícita (detector), violência doméstica (180/190), remédio/dose, diagnóstico,
  manipulação: todos ok. Relatórios em `~/Área de trabalho/previa-revivaz/teste-ia-pessoas-*.html`.

## Achados fora do Revivaz (avisar o dono, não mexi)

- Conta `izai` da ponte: "organization has disabled Claude subscription access". A ponte usa `nookweb`.
- `/opt/tecnopano-claude/bridge.mjs` na VPS ≠ `deploy/claude-vps/bridge.mjs` do repo da Tecnopano
  (VPS ainda tem Antigravity; repo já removeu). O patch foi feito sobre a cópia da VPS.

## Pendente

- Aplicar patch da ponte (bloqueado: escrita remota precisa liberação).
- "Como funciona" no menu (opção 1 ou 2).
