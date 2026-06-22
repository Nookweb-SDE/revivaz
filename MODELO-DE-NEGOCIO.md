# Modelo de Negócio — Plataforma de Saúde Mental Solidária

**Projeto:** atual codinome "Revivaz" (nome final **a definir** — o dono não decidiu ainda).
**Data:** 2026-06-22
**Status:** Modelo aprovado pelo dono. Próximo passo: plano de execução da Fase 0.

> ⚠️ **Escopo deste documento:** isto é o **modelo de negócio**, não mudança de código. O dono pediu explicitamente para **não mexer no que já foi feito nem no design system** da landing atual.

---

## 1. Visão / Missão

Projeto de propósito ("que Deus colocou no coração") para **ajudar pessoas com sofrimento psíquico**, unindo **acolhimento humano + IA de apoio**. Atua em **saúde mental no geral** — ansiedade, depressão, estresse/burnout, crises de pânico e demais quadros — **e também em neurodivergência** (autismo, TDAH, altas habilidades/superdotação) como **especialidade forte**, não como limite. A cobertura ampla é necessária porque para atender **empresas (B2B)** é preciso dar conta de quadros diversos entre os colaboradores. Atenção especial a **populações que não conseguem pagar** atendimento de saúde mental.

A IA é o "primeiro abraço" disponível 24/7; o profissional humano é o cuidado de verdade. Ninguém fica sozinho na crise.

## 2. Decisões âncora (travadas com o dono)

1. **Natureza:** negócio social **híbrido** (subsídio cruzado) — quem pode pagar banca quem não pode. Governo/patrocínio/doação são acelerador, não oxigênio.
2. **Papel da IA:** **apoio + triagem que sempre encaminha**. A IA acolhe, acalma (respiração, grounding), faz psicoeducação e classifica a gravidade. **Nunca diagnostica, nunca receita.** Em crise séria, escala imediato para humano / CVV 188.
3. **Receita em camadas faseadas:** empresas (B2B) + patrocínio/ESG + pessoa física + embaixadores influencers — entrando em fases, não tudo no dia 1.
4. **Embaixadores:** **1–3 sócios fundadores** (com equity) + o restante em **programa de parceiro** (sem sociedade). Dono mantém o controle do projeto.
5. **Recursos iniciais:** **zero capital — tudo orgânico** no começo. Plano precisa funcionar sem investimento.

## 3. Proposta de valor

| Público | Valor entregue |
|---------|----------------|
| **Quem sofre (beneficiário)** | Acolhimento imediato 24/7 pela IA + caminho para consulta humana acessível/gratuita, cobrindo **diversos quadros de saúde mental** (com neurodivergência como uma das especialidades). |
| **Profissional embaixador** | Propósito + audiência/marca + renda flexível **sem custo de captação de paciente** + pertencer a algo que cresce. |
| **Empresa / patrocinador** | Impacto social mensurável (ESG) + saúde mental dos colaboradores. |

## 4. Jornada do usuário (fluxo do serviço)

1. **Chegada:** pessoa vem por post de embaixador / conteúdo orgânico → landing.
2. **IA de acolhimento:** conversa, acolhe e faz **triagem de gravidade** (leve / moderado / urgente).
3. **Roteamento:**
   - **Leve →** psicoeducação, conteúdo, técnicas de autocuidado, fila para consulta.
   - **Moderado →** agenda consulta (gratuita no início, depois preço acessível) com profissional adequado.
   - **Urgente (crise) →** escala **imediato**: humano de plantão / **CVV 188** / orientação **SAMU 192** / CAPS.
4. **Pós-consulta:** acompanhamento, receita digital (emitida pelo profissional), retorno.

## 5. Motor financeiro — subsídio cruzado em 4 fases

| Fase | Foco | Receita | Custo |
|------|------|---------|-------|
| **0 — Validar** (agora) | Provar que gente chega e que profissionais querem entrar | Nenhuma (ou doação espontânea) | ~Zero: API de IA (centavos) + domínio. Landing já existe. |
| **1 — Tração** | Programa de embaixador + conteúdo orgânico | **Doação/PIX + "padrinhos"** (PF que apadrinha consultas) + editais quando houver CNPJ | Baixo, orgânico |
| **2 — Sustentação** | Receita previsível | **B2B** (plano de saúde mental para empresas) + **patrocínio ESG** | Operacional crescente, coberto pela receita |
| **3 — Escala** | Alcance amplo | **Contratos com governo/prefeituras** (SUS complementar) | Exige CNPJ maduro + histórico |

**Princípio:** a receita de quem paga (empresa, padrinho, patrocínio) **subsidia as consultas gratuitas** de quem não pode pagar (incluindo as ~3 consultas gratuitas iniciais por pessoa).

## 6. Modelo dos profissionais (resolvendo o "abaixo do mercado")

O profissional não vive de caridade permanente. O desconto no valor é compensado por:

- **Sócios fundadores (1–3):** equity + participação na receita.
- **Parceiros:** valor por consulta abaixo do mercado, MAS com **volume de pacientes + zero gasto com marketing/secretária/sala + horário flexível** → o líquido compensa.
- **Voluntários:** alguns doam um nº de horas/mês pela causa.

## 7. Estrutura jurídica (faseada)

- **Fase 0:** dono testando como **PF / MEI**.
- **Fase 1+:** modelo **dual** clássico de negócio social →
  - uma **associação sem fins lucrativos** (capta doação dedutível, editais, convênios com governo) +
  - uma **empresa** (vende B2B, gera margem para reinvestir).
- Definir com **contador + advogado** quando entrar o 1º sócio e a 1ª receita real.

## 8. Guardrails inegociáveis (é saúde, é vida)

- IA **nunca** diagnostica nem receita; **botão/protocolo de crise sempre visível** (CVV 188, SAMU 192, CAPS).
- **LGPD:** dado de saúde mental é **sensível** — consentimento explícito, criptografia, sigilo absoluto, mínimo de retenção.
- **Responsabilidade clínica é do profissional**; a plataforma é intermediária. Contratos claros com cada profissional.
- Linguagem de **"apoio / acolhimento"**, nunca "tratamento" ou "cura" no que a IA faz.
- Conformidade com diretrizes **CFM** (medicina/telepsiquiatria) e **CFP** (psicologia).

## 9. Métricas de sucesso — Fase 0

- Nº de pessoas acolhidas pela IA
- Nº de encaminhamentos para humano (e quantos eram urgentes)
- Nº de embaixadores ativos
- Nº de consultas gratuitas realizadas
- **Histórias reais de impacto** (depoimentos com consentimento)

## 10. Premissas e questões em aberto

- **Nome final do projeto:** indefinido (o dono não gostou de "Revivaz").
- **Quem serão os 1–3 sócios fundadores?** ainda não identificados.
- **Capacidade clínica inicial:** depende de quantos embaixadores aderirem na Fase 0.
- **Plantão de crise:** na Fase 0, sem equipe paga, o "humano de plantão" precisa de uma solução realista (ex.: encaminhamento direto a CVV/CAPS + lista de profissionais de sobreaviso voluntários). A definir no plano de execução.
- **Stack da IA:** a definir no plano (modelo, custo por conversa, guarda de segurança/escalonamento).

---

## Próximo passo

Plano de execução **da Fase 0** (custo zero, próximas semanas): o que construir/ativar primeiro, em que ordem, e como medir se está funcionando.
