# Onboarding do profissional — design

**Data:** 2026-08-26
**Status:** aprovado pelo dono no brainstorming. Próximo passo: plano de implementação.
**Classificação:** arquitetural (tabela nova, página nova, fila de análise, aceite de contrato).

---

## 1. Por que agora

Hoje o profissional não se candidata. O admin cria a linha em `profissionais` na mão e
vincula um login por e-mail (`POST /api/admin/profissional-link`). Isso não escala e é o
gargalo entre a plataforma e ter oferta: sem profissional não há consulta.

O dono escolheu **funil aberto para escalar**: qualquer profissional se candidata a
qualquer hora, e o admin decide.

## 2. O que a pesquisa de concorrente mandou fazer

Levantamento de 26/ago sobre Conexa, Zenklub e Vittude (páginas públicas, termos de uso e
reclamações de profissionais). O padrão de reclamação é consistente: a plataforma não
limita a entrada, o profissional fica sem paciente, paga mensalidade (Zenklub Premium
R$ 499/mês) ou taxa por sessão (20% no básico), e o corporativo paga cerca de R$ 40 por
consulta, três vezes menos que o particular.

Decisões que saíram dali e valem como requisito:

| Decisão | Por quê |
|---|---|
| **Sem mensalidade e sem taxa por sessão** | É a dor número um deles. Nosso modelo é voluntário: vira o argumento da candidatura, não uma nota de rodapé. |
| **CNPJ opcional** | Conexa, Zenklub e Vittude exigem. Para quem doa horas é barreira sem sentido. |
| **Registro do conselho obrigatório e conferido** | Todos fazem, e é o mínimo de segurança de um serviço de saúde. |
| **Dizer o volume real antes de candidatar** | Hoje é zero paciente. A frustração deles vem da expectativa, não do número baixo. |
| **Regra de falta explícita desde o começo** | O escalonamento da Vittude (notifica → adverte → descredencia) é bom molde. Fica no Termo do Profissional. |

## 3. Decisões travadas no brainstorming

1. **Objetivo:** funil aberto para escalar.
2. **Validação do registro:** semiautomática. O sistema monta o link da consulta oficial do
   conselho já com o número; o admin abre, olha e decide. Custo zero e funciona para as 12
   especialidades, inclusive as quatro sem fonte unificada (terapia ocupacional,
   fonoaudiologia, psicopedagogia, ABA).
3. **Verificação de identidade:** BigDataCorp por CPF e, quando houver, CNPJ. É
   **complementar**: confirma que o nome bate com o CPF e que o CNPJ está ativo. Ela não
   sabe nada de CRP ou CRM. Entra como **evidência da análise, nunca como decisão
   automática**.
4. **Estados:** aprovado já atende. Sem conceito de vaga. Com zero paciente hoje, segurar
   profissional aprovado numa fila só reproduz a frustração do concorrente.
5. **Contrato:** aceite versionado no sistema (versão do texto, data, hora e IP). Assinatura
   eletrônica fica para quando existir repasse financeiro.
6. **Conta:** o candidato cria conta e acompanha o status na própria tela. Num funil aberto,
   é o que evita que toda dúvida vire e-mail para o admin.
7. **Design system:** o que já existe (`src/conta/ui.ts`). Nenhum token novo.

## 4. Arquitetura

### 4.1 Por que uma tabela separada

Três caminhos foram considerados:

- **A — `candidaturas` própria, promoção na aprovação.** Escolhido.
- **B — campo `status` dentro de `profissionais`.** Uma tabela a menos, mas candidato e
  profissional passam a morar juntos: toda RLS e toda query existente precisariam lembrar
  de filtrar, e `is_profissional()` teria que ser reescrita. Ela é a função que guarda o
  pool de pedidos e o acesso à ficha do paciente; um esquecimento ali é grave.
- **C — reusar `leads` com origem `profissional`.** Já existe, mas `leads` não tem dono, não
  guarda estado, documento nem aceite.

**A vantagem decisiva de A é de segurança:** enquanto não for aprovado, o candidato
simplesmente **não existe** em `profissionais`. Nenhum `WHERE status <> 'candidato'`
esquecido pode transformá-lo em profissional com acesso a prontuário. `is_profissional()`
não muda uma vírgula.

### 4.2 Migration `0010_candidaturas.sql`

Aditiva e idempotente, no padrão das anteriores.

| Campo | Tipo | Observação |
|---|---|---|
| `id` | uuid pk | |
| `profile_id` | uuid not null, **unique** | Uma candidatura por pessoa. FK para `profiles`. |
| `nome_completo` | text not null | |
| `cpf` | text not null | É o que a BigDataCorp confere. Ver retenção em 4.6. |
| `telefone` | text not null | |
| `conselho` | text not null | CRP, CRM, COFFITO, CFFa, outro |
| `registro` | text not null | Número da inscrição |
| `uf_conselho` | text | |
| `especialidade` | text not null | Valor do catálogo `src/lib/especialidades.ts` |
| `cnpj` | text | **Opcional** |
| `bio` | text | |
| `horas_semana` | int | O que ele oferece |
| `status` | text not null default `'recebida'` | `recebida · em_analise · pendencia · aprovada · recusada` |
| `motivo` | text | Por que recusou, ou o que falta na pendência |
| `termo_versao` | text | Versão do Termo do Profissional aceita |
| `termo_aceito_em` | timestamptz | |
| `termo_aceito_ip` | text | |
| `verificacao` | jsonb | Evidência: retorno da BigDataCorp e registro de quem conferiu o conselho e quando |
| `analisado_por` | uuid | FK `profiles` |
| `analisado_em` | timestamptz | |
| `created_at` | timestamptz default now() | |

Índice em `(status, created_at desc)`, como em `leads`.

### 4.3 RLS

Três regras, e a segunda é a que protege o sistema:

1. **`candidatura_self_select`** — o candidato lê só a dele (`profile_id = auth.uid()`);
   admin lê todas.
2. **`candidatura_self_update`** — o candidato edita a dele **somente** enquanto o status
   é `recebida` ou `pendencia`, e o `WITH CHECK` impede que ele escreva `status`,
   `verificacao`, `analisado_por`, `analisado_em` ou `termo_*`. Mesmo padrão da trava
   anti-escalada de papel que já existe em `profiles_self_update`.
3. **`candidatura_admin_all`** — admin faz tudo, via `is_admin()`.

O insert não vem do navegador: passa pelo servidor (4.4), porque o IP do aceite só existe
lá.

### 4.4 Rotas

| Rota | Quem | O que faz |
|---|---|---|
| `POST /api/candidatura` | logado | Cria ou atualiza a própria candidatura. Valida CPF, formato do registro e especialidade do catálogo. Registra o aceite com versão, data e IP. |
| `POST /api/admin/candidatura/:id/verificar` | admin | Dispara a BigDataCorp e grava o retorno em `verificacao`. Não decide nada. |
| `POST /api/admin/candidatura/:id/decidir` | admin | `aprovar`, `recusar` ou `pendencia`. Motivo obrigatório nas duas últimas. |

Ler o status **não tem rota**: a RLS resolve pelo `supabase-js`, como no resto do `/conta`.

Autorização segue o padrão do projeto: `requireAuth` dá o `uid`, e o servidor confere a
associação com `service_role` antes de agir.

### 4.5 A promoção

`decidir` com `aprovar` faz, tudo ou nada:

1. Confere que o status atual permite a transição (4.7).
2. Insere em `profissionais`: nome, especialidade, registro, bio, `ativo = true`,
   `profile_id`.
3. `update profiles set role = 'profissional'`.
4. Carimba a candidatura: `status = 'aprovada'`, `analisado_por`, `analisado_em`.

**Idempotente:** aprovar duas vezes não cria dois profissionais. A checagem de transição no
passo 1 é o que garante isso, e tem teste.

### 4.6 BigDataCorp

`server/lib/bigdatacorp.ts`, credencial por Docker secret, no padrão do `resolveSecret`.

**Degrada:** sem credencial, `verificacao` fica `{ configurado: false }` e o admin decide só
com a consulta do conselho. Nunca bloqueia a fila.

Duas pendências que saem daqui e são de policy, não de código:

- É contrato pago. Precisa da credencial antes de ligar.
- Consultar CPF de terceiro é tratamento de dado pessoal. Entra na Política de Privacidade
  como consulta de verificação, com base legal declarada, junto com a retenção do CPF do
  profissional aprovado.

### 4.7 Máquina de estados

```
recebida  → em_analise, recusada
em_analise → aprovada, recusada, pendencia
pendencia → em_analise            (o candidato reenvia)
aprovada  → (final)
recusada  → (final)
```

Qualquer outra transição é recusada. `recusada → aprovada` **não existe**: para reconsiderar,
o candidato envia de novo.

## 5. Telas

Todas com `src/conta/ui.ts`. Nenhum token novo.

### 5.1 `/candidatura` (entrada nova do Vite)

**Deslogado:** a proposta, com os três diferenciais que a pesquisa entregou — sem
mensalidade, sem taxa por sessão, sem CNPJ — e o campo de e-mail para o link de acesso.
Diz também, com todas as letras, **qual é a demanda de hoje**, lida do banco em tempo real:
quantos pedidos de consulta estão aguardando profissional. Se for zero, a tela diz zero. A
honestidade aqui é o que evita a frustração que o concorrente colhe, e o número sai da
mesma fonte que o profissional vai ver depois de aprovado, então não tem como divergir.

**Logado, sem candidatura:** o formulário, com o catálogo das 12 especialidades e o aceite
do Termo do Profissional.

**Logado, com candidatura:** o status, e só ele:

| Status | O que a tela mostra |
|---|---|
| `recebida` / `em_analise` | "Recebemos. Estamos conferindo seu registro." |
| `pendencia` | O motivo, e o formulário aberto para corrigir e reenviar |
| `aprovada` | Boas-vindas e o botão para `/profissional` |
| `recusada` | O motivo, sem formulário |

### 5.2 `/termo-profissional`

O Termo do Profissional na casca `PaginaLegal` (a mesma da Política e dos Termos de Uso),
com constante de versão no topo. Cobre: responsabilidade clínica é do profissional, regra
de falta, sigilo, uso da plataforma, e que não há vínculo empregatício.

Se a versão mudar, o aceite é pedido de novo na próxima entrada.

### 5.3 Admin, aba **Candidaturas**

Lista por status com contador de novas, no molde da aba "Pedidos do site". Na ficha:

- Os dados enviados.
- **Um botão que abre a consulta oficial do conselho já com o número preenchido.**
- O retorno da BigDataCorp, quando houver.
- Aprovar · Pedir documento · Recusar. Motivo obrigatório nas duas últimas.

### 5.4 Landing

O botão "Quero ser voluntário" do hero passa a levar para `/candidatura`, em vez de abrir o
modal de lead. Um caminho só.

## 6. Erros e degradação

| Situação | Comportamento |
|---|---|
| BigDataCorp fora do ar ou sem credencial | `verificacao = { configurado: false }`. O admin decide com o conselho. Fila não trava. |
| Candidato tenta editar depois de aprovado | RLS recusa. A tela nem mostra o formulário. |
| Transição de estado inválida | 409 com a explicação. |
| Aprovar duas vezes | A segunda não faz nada e devolve o estado atual. |
| CPF ou registro em formato inválido | 400 antes de gravar, com a mensagem do campo. |

## 7. Testes

Na ordem, e teste antes do código nos itens puros.

**Puros** (`src/lib/` e `server/`):
- Dígito verificador do CPF: válido, inválido, todos os dígitos iguais, com e sem máscara.
- Formato do registro por conselho.
- **Máquina de estados**: cada transição de 4.7, e a recusa das que não existem.

**Integração** (no padrão de `leadReceita.integration.test.ts`):
- Candidato não consegue escrever o próprio `status`.
- Terceiro logado não lê candidatura alheia.
- `decidir` sem ser admin devolve 403.
- Aprovar promove: cria em `profissionais`, muda o papel, carimba a candidatura.
- Aprovar duas vezes não cria dois profissionais.

## 8. Fora de escopo

- Repasse financeiro ao profissional. Não existe dinheiro no sistema.
- Assinatura eletrônica do contrato. Entra quando houver remuneração.
- Vaga por especialidade. Decidido: aprovado já atende.
- Avaliação de desempenho e descredenciamento automático. A regra de falta fica escrita no
  Termo; a aplicação é manual por enquanto.

## 9. Depende de decisão ou ação humana

- Credencial da BigDataCorp (contrato pago).
- Redação final do Termo do Profissional revisada por advogado, junto com os outros dois
  documentos legais já publicados.
- Atualizar a Política de Privacidade: consulta de CPF na verificação e retenção do CPF do
  profissional aprovado.
