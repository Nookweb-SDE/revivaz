# Comunicado Revivaz no Condomínio Vivaz — fonte única (19/10/2026)

Antes de mexer em QUALQUER material do comunicado, conferir contra esta lista.

## Fatos
- Reunião de apresentação: **quinta-feira, 22/10/2026, 20h**, salão de festas.
- Início das atividades: **quinta-feira, 26/11/2026**, salão de festas (NÃO 26/10, NÃO segunda):
- Temas: depressão, **violência psicológica** (SEM "contra as mulheres": vale para os dois grupos, pedido da Flávia em áudio 19/10) e prevenção ao uso de drogas.
  - 18h adolescentes · 19h mulheres · 20h homens.
- Equipe, nesta ordem (psicólogos em ordem alfabética, pedido da Flávia):
  1. Flávia Magalhães Farias Lima — Psicóloga — CRP 06/236718
  2. Walter Aparecido Santos — Psicólogo — CRP 06/55994-8
  3. Felipe — Gestão de Tecnologia
  4. Gilberto e Walesca — Gestão do Condomínio (Gilberto = síndico)
- Assinatura: "Organização do Projeto Revivaz & Administração do Condomínio Vivaz".

## Palavras (CRP)
- Nunca "atendimento" nem nada que pareça terapia clínica. Usar **"acolhimento"** (pedido da Flávia, evitar denúncia no CRP).

## Modelo escolhido
- Escolhido pelo grupo: versão **clássica** (fonte: `~/Área de trabalho/previa-revivaz/comunicado/site/index.html`).
- Link ÚNICO para divulgar: **https://comunicado.revivaz.com.br** (sem /convite, sem /classico, sem ?v=).
  - Só existe `public/comunicado/index.html` (19/10 noite: /convite, /classico/, /capa-*, /moradores APAGADOS a pedido do dono; dão 404). Não recriar.
- Página SEM WhatsApp (sem botão wa.me). Botão final = "Conhecer o site Revivaz" → https://revivaz.com.br/.
- Celular (≤560px): foto do topo aparece inteira acima do título; fotos dos temas em 4:3.
- Capa do link (og:image): logo do Vivaz no cabeçalho dos comunicados da Walesca, `img/og-vivaz-capa.jpg` (1200x630). Escolha do dono em 19/10, às 17h30; antes era a foto da roda.
- PDF: `comunicado-revivaz.pdf` = A4 de `previa-revivaz/comunicado/comunicado-revivaz.html` (1 página).
- Texto do grupo: `~/Área de trabalho/MENSAGEM WHATSAPP - REVIVAZ.txt`.

## Publicar
- Fonte → copiar para `public/comunicado/` (index.html + cópias acima) → build → `docker build -t revivaz:latest` (tag certa é `revivaz:latest`, NÃO `revivaz-web`) → load na VPS → `docker service update --force revivaz_web` → purge Cloudflare.
- DNS do subdomínio `comunicado` = só DNS (sem proxy Cloudflare), A 194.163.150.113.

## Prévia no WhatsApp
- Quem busca a prévia é o WhatsApp (celular), não o servidor nosso. Se vier só o nome do site e o log do Traefik não mostrar pedido "WhatsApp/", o problema é do WhatsApp: mandar pelo app do celular e esperar a foto aparecer antes de enviar.
- Os outros 6 modelos (A4 antigo, celular, cartaz, capas 1-3) e a pasta "Revivaz - escolha do comunicado" foram para a LIXEIRA em 19/10. Valem só: a página, o PDF A4 e a imagem única.
- Imagem única p/ WhatsApp (formato do comunicado da Walesca, 1024x1536 @2x): fonte `previa-revivaz/comunicado/site/imagem-unica.html` → `~/Área de trabalho/comunicado-revivaz.jpg` (JPG comprimido). Página longa em PNG NÃO serve (abre pequena).
