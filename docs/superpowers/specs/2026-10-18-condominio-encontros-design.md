# Revivaz Condomínio — encontros, textos e blocos novos

Data: 18/10/2026 · Aprovado em conversa pelo dono ("está certo, pode seguir").

## Por quê

A landing `src/RevivazPreview.tsx` virou a página do projeto de Psicologia
Comunitária no Condomínio Vivaz (PDF da Flávia: `~/Downloads/DOC-20261006-WA0029.pdf`).
Os textos ainda falam de "Salão de Festas" e de consulta genérica ("Marcar
consulta, qualquer site faz"), e o hero mostra dois psicólogos diferentes
nas cenas 4 e 5. O dono quer tom profissional, fiel ao projeto.

## Fatos do PDF (fonte da verdade da copy)

- Projeto de Psicologia Comunitária · "Escuta, vínculos e convivência:
  promoção de saúde mental no território condominial".
- Coordenação: Flávia Magalhães Farias Lima, Psicóloga, CRP 06/236718.
- Encontro mensal, última quinta-feira; início 26/11/2026; dezembro em
  17/12/2026; ciclo de 12 encontros até out/2027.
- 18h–19h adolescentes de 12 a 17 anos e 11 meses · 19h–20h mulheres 18+.
- Formato: roda de conversa, palestra dialogada, oficina breve; até 60 min.
- Nota de enquadre: **não é psicoterapia, avaliação, diagnóstico nem
  tratamento**; demandas individuais são encaminhadas.
- Combinados: ninguém é obrigado a contar nada pessoal; privacidade.
- Tema de 26/11: "Relações sem violência" (adol.: bullying, agressividade,
  preconceito e proteção; mulheres: violência psicológica, limites,
  proteção e rede de apoio).

## O que muda (aprovado)

| Parte | Mudança |
|---|---|
| Hero, cenas 4 e 5 | mesmo psicólogo na tela: refazer a cena 4 com o homem da cena 5 (`remotion/public/n5.jpg`) como referência; render + publish |
| Texto do hero (`HeroScrubFrames.tsx`) | sai "Salão de Festas"; fala de Psicologia Comunitária, encontro mensal, escuta/vínculo/convivência |
| Faixa ECG (`EcgValor.tsx`) | copy nova sobre o projeto; animação continua no estilo Revivaz |
| Card "12 especialidades" (Bloco 5) | vira o bloco das vizinhas no café (apoio entre mulheres), com imagem nova |
| Bloco novo: Mulheres | tema, horário 19h, o que acontece no encontro |
| Bloco novo abaixo: Adolescentes | imagem nova, tema, horário 18h |
| Todos os textos da página | tom profissional; nunca prometer terapia; "encontro" no lugar de "roda no Salão de Festas" |

## Decisões minhas (o dono pode vetar)

- Animação do ECG: mantenho o componente e a linha que pulsa; troco título,
  subtítulo e as 4 etapas para: 01 Escuta · 02 Vínculo · 03 Convivência ·
  04 Rede de apoio (CVV 188 e encaminhamento).
- Os blocos Mulheres e Adolescentes ficam sob `id="encontros"` (o botão
  "Próximo encontro: 26/11" do hero já aponta para lá).
- Nome da profissional aparece só como "Coordenação: psicóloga Flávia
  Magalhães, CRP 06/236718" no bloco dos encontros; imagens são pessoas
  genéricas, não a Flávia.
- Imagens no Flow (Nano Banana 2.1, 0 crédito), 16:9, 2K, convertidas para
  webp em `public/revivaz/`. Vídeo (Veo) não entra.
- Imagem das vizinhas: refazer a foto que o dono mandou (duas mulheres no
  sofá, uma com caneca) usando como ambiente a sala real do hero (sofá
  creme, piso de madeira, rack branco), almofadas turquesa e magenta.
- Imagem dos adolescentes: roda de conversa de 4–6 adolescentes com uma
  psicóloga adulta, espaço comum claro e térreo, sem logo, sem rosto triste.
- **Bloco 5 vira o bloco Mulheres** (mesmo cartão navy dividido, imagem das
  vizinhas no café). A barra de abas do Bloco 4 sai junto: o cartão deixa
  de ter abas. "Para profissionais" continua mais abaixo em
  `#para-profissionais`. O bloco Adolescentes vem logo abaixo, no mesmo
  estilo de cartão, com a imagem à esquerda (espelhado). Os dois ficam
  dentro de um `<section id="encontros">` logo após a faixa ECG.
- Sem inscrição: os blocos mostram data, horário, tema de 26/11 e
  "presencial, no condomínio". O botão é "Tirar dúvidas", que abre o chat
  já existente (`openAgendar`). Local escrito: "presencial, no condomínio".
- Revisão de texto em **toda** a página (pedido do dono: "mudar as escritas
  de tudo"): a estrutura e as ofertas da Revivaz (consulta por vídeo com
  voluntários, especialidades, formulário) ficam, mas a copy é reescrita em
  tom profissional e sóbrio. Nada promete cura, terapia em grupo ou
  resultado. Os encontros são sempre "encontro de psicologia comunitária",
  com a nota "não substitui psicoterapia".
- Faixa ECG: título "Marcar consulta, qualquer site faz." e subtítulo
  reescritos por inteiro. O hero tem 3 etapas e o ECG tem 4, de propósito
  (a 4ª é a rede de apoio).
- Orçamento do hero: o número que `publish-frames.sh` mede (transferência,
  hoje 2,66 MiB). A troca da cena 4 é um re-render inteiro mais o publish,
  como já é feito.
- Quem gera as imagens e roda o render é o próprio agente (Flow pelo
  navegador de QA logado, Remotion local).

## Regras de imagem (de `remotion/PLANO-CONDOMINIO.md`)

- Nada de altura nas imagens novas: sem sacada aberta, janela alta, vista
  de cima. Na sala das vizinhas, câmera de costas para a sacada ou cortina
  fechada. (Dois moradores caíram do prédio; regra CVV/OMS.)
- Nada de choro, hospital, remédio, pessoa sozinha no escuro.
- 40% da esquerda mais limpa quando a imagem leva texto por cima.
- Turquesa no ambiente, magenta só em detalhe.

## Fora do escopo

- Deploy (produção suspensa), push, commit sem mostrar antes.
- Calendário completo dos 12 meses na página (só o próximo encontro).
- Backend/inscrição nos encontros.

## Pronto quando

- Cenas 4 e 5 com o mesmo rosto; hero ≤ 3 MiB.
- `grep -ri "salão de festas" src` vazio.
- Blocos Mulheres e Adolescentes visíveis em 1600 px e 390 px, texto legível.
- `npx tsc --noEmit` e `npm run build` passam.
- Prints de desktop e celular mostrados ao dono antes do commit.
