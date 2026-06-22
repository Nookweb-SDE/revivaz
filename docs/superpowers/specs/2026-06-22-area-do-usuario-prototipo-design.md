# Área do Usuário (Paciente) — Protótipo Visual

**Projeto:** plataforma de saúde mental (codinome "Revivaz", nome final a definir).
**Data:** 2026-06-22
**Status:** Design aprovado pelo dono. Caminho A escolhido (protótipo visual, sem backend).

## 1. Objetivo

Página nova `/conta` — a "minha conta" do paciente que já passou do primeiro acolhimento e marcou consulta com humano. **Protótipo visual completo e polido, com dados de exemplo, SEM backend/login/DB.** Serve para validar a experiência e poder mostrar a embaixadores/investidores. O backend real (Supabase) entra numa fase seguinte por cima do mesmo design (Caminho B).

## 2. Decisões âncora (com o dono)

- **Caminho A:** protótipo visual, dados mock, sem auth/DB. Nada de Supabase agora.
- **Mobile-first** — o público acessa majoritariamente por celular.
- **Isolado:** página/entry novos (`conta.html` + `src/conta/`), NÃO toca na landing (`src/RevivazPreview.tsx`), no acolhimento (`src/acolhimento/`), nem no design system.
- **Identidade visual** = a do design system existente (teal/navy, fonte Nunito, cards arredondados, sombras suaves), tom acolhedor (não clínico frio).
- **Segurança/crise:** barra de emergência **188 (CVV) / 192 (SAMU) sempre visível**, como na `/acolhimento`.
- **LGPD (anotado):** "retomar conversa da IA" no protótipo é mock; no backend real exige consentimento + criptografia (dado de saúde mental).

## 3. Estrutura da página (mobile-first, coluna única; desktop pode centralizar ~560–720px)

1. **Header** — logo + saudação ("Olá, Maria 👋") + ícone de perfil/menu.
2. **Próxima consulta (card destaque)** — foto/nome/especialidade do profissional, data/hora, countdown ("em 2 dias"), tipo (online/presencial), botão grande **Entrar na consulta** (online) ou endereço (presencial), ações secundárias remarcar/cancelar. **Estado vazio:** quando não há consulta, mostra CTA "Agendar consulta" + "Conversar com a IA".
3. **Atalhos rápidos (4 tiles)** — Conversa IA · Receitas · Humor · Autocuidado.
4. **Minhas consultas** — abas **Próximas / Passadas**. Item: profissional, data, status (agendada/realizada/cancelada), ação contextual (entrar/remarcar/ver resumo).
5. **Receitas** — lista de receitas digitais. Item: profissional, data, resumo; botões **Baixar PDF** + **Reenviar no WhatsApp** (no protótipo, ações simuladas).
6. **Continuar conversa (IA)** — card "Continue de onde parou…" + histórico resumido de sessões + botão **Abrir chat** (link para `/acolhimento`).
7. **Registro de humor** — check-in "Como você está hoje?" com emojis (😟😐🙂😀) + mini-gráfico de barras da semana (estilo Wysa). Mock interativo (clique registra no estado local).
8. **Perfil** — dados básicos, contato de emergência, preferências (lembretes, online/presencial), botão sair.
9. **Avaliar atendimento (NPS)** — bloco que aparece quando há consulta "realizada" sem avaliação: nota 0–10 + comentário (simulado).
10. **Barra de crise fixa** — rodapé fixo "Emergência: 188 CVV · 192 SAMU", sempre visível.

## 4. Dados de exemplo (`sampleData.ts`)

Um módulo exportando objetos mock: `usuario` (nome, contato emergência, preferências), `consultas[]` (próximas + passadas, com profissional/data/status/tipo/link), `receitas[]` (profissional/data/resumo/arquivo fake), `conversasIA[]` (resumos de sessão + último trecho), `humorSemana[]` (7 registros 0–4). Tudo fictício, sem PII real.

## 5. Componentização (arquivos focados, uma responsabilidade cada)

- `src/conta/sampleData.ts` — dados mock + tipos TS.
- `src/conta/ContaApp.tsx` — composição da página (orquestra as seções).
- `src/conta/sections/` — um componente por seção (ProximaConsulta, Atalhos, ListaConsultas, Receitas, ContinuarConversa, RegistroHumor, Perfil, AvaliarNPS).
- `src/conta/ui.ts` — tokens/estilos compartilhados (paleta teal, helpers) — espelha o design system sem importar dele.
- `src/conta/main.tsx` — entry React.
- `conta.html` — página (entry Vite).
- `vite.config.ts` — adicionar `conta.html` como 3º input.

## 6. Tech / restrições

- React 18 + TypeScript + `lucide-react` (já no projeto). Estilos inline (padrão do projeto) ou módulo `ui.ts`.
- Sem dependências novas. Sem backend, sem fetch real (ações mock).
- Build deve gerar `dist/index.html` + `dist/acolhimento.html` + `dist/conta.html` sem quebrar os existentes.
- Acessível: contraste adequado, `aria-label` em botões de ícone, navegável por teclado.

## 7. Sucesso

- `/conta` abre no dev e no build, mobile-first, com todas as 10 seções preenchidas por dados de exemplo, barra de crise sempre visível, e identidade visual coerente com a landing — sem tocar em nada existente.

## Próximo passo

Plano de implementação (writing-plans) → construir → subir no dev pra ver. Backend real (Supabase) fica para fase seguinte (Caminho B).
