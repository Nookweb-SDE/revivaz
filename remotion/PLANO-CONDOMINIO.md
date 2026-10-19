# Hero do condomínio — plano de imagens e vídeo (Flow)

Os quadros atuais (mulher em casa + médico no notebook) ficam para o
`revivaz_municipios`. O hero do condomínio segue o texto da opção B:
**Escuta → Vínculo → Convivência**. Mesma composição (`HeroSequence.tsx`),
mesmos tempos, só trocam as três entradas.

| Plano | Etapa | Tempo | Entrada | Ferramenta |
|---|---|---|---|---|
| 1 | Escuta | 60 frames (4,3 s) | `escuta.png` (Ken Burns) | Nano Banana (Flow) |
| 2 | Vínculo | 55 frames (3,9 s) | `vinculo.mp4` (recorte do vídeo de 8 s) | Flow / Veo, quadro inicial = imagem gerada; as duas vizinhas do plano 1 se abraçam no Salão de Festas |
| 3 | Convivência | 56 frames (4 s) | `convivencia.png` (Ken Burns) | Nano Banana (Flow) |

## Regras para TODAS as imagens

- **Nada de altura.** Sem sacada, janela alta olhando para baixo, cobertura,
  escada, elevador, fachada vista de baixo. Tudo no térreo. Dois moradores
  caíram do prédio; quem mora lá reconhece a cena. É também a regra de
  comunicação segura do CVV/OMS: não mostrar local nem meio.
- Nada de choro, pessoa sozinha no escuro, hospital, remédio.
- Não é a fachada real do Vivaz nem a Flávia de verdade: pessoas e prédio
  genéricos.
- 40% da esquerda mais escura e vazia: é onde entra o texto. As pessoas
  ficam no centro-direita.
- Azul/turquesa no ambiente, magenta só em detalhe (almofada, lenço, caneca).

Estilo comum (colar no fim de cada prompt):

```
Photorealistic, cinematic, 16:9, 2K. Brazilian people of mixed ethnicities, ordinary middle-class residential condominium in Greater São Paulo, ground floor only. Warm practical lights at dusk mixed with cool blue-teal ambient light, small magenta (#960064) accents in fabrics. Shallow depth of field, subtle film grain. Left 40% of the frame darker and uncluttered, people in the center-right. No text, no logos. No balconies, no high windows, no rooftops, no stairs, no elevators, no building exterior seen from below, no tears, no hospital, no pills.
```

## Plano 1 — Escuta (imagem)

Referência: `remotion/public/ref-sala.png` (sala real de um apartamento do
Vivaz, não versionada). Anexar no Flow como imagem de referência.
Da foto vem o ambiente: sofá de veludo azul-petróleo + sofá cinza, almofadas
estampadas, piso de madeira clara, rack branco embutido com TV, cortina branca.
**Fica de fora a janela com a vista do alto**: câmera de costas para a janela,
ou cortina fechada.

```
Use the attached photo as reference for the room: same small apartment living room with a dark teal velvet sofa next to a light gray sofa, patterned throw pillows, light wood laminate floor, white built-in TV unit with shelves, sheer white curtain. Camera faces the sofas with the window behind the camera, so no window and no outside view is visible; the sheer curtain may appear only at the edge, fully closed. Two women neighbors, one in her 30s and one in her 50s, sitting on the teal sofa at dusk. The younger one is talking, the older one listens attentively holding a mug of coffee, leaning slightly toward her. Warm table lamp light, one magenta cushion. Calm, safe, hopeful mood.
```

## Plano 2 — Vínculo (imagem inicial + vídeo 8 s)

As mesmas duas vizinhas do plano 1 (anexar a imagem aprovada do plano 1 como
referência de personagem), agora no Salão de Festas, chegando para o encontro.

Imagem inicial:

```
Use the attached image as character reference: the same two women neighbors, same faces, hair and clothes. Community party room (salão de festas) of a residential condominium in the evening, ground floor, string lights, a circle of chairs with teal and magenta cushions softly blurred in the background. The two women are standing face to face near the entrance, arms just starting to open, about to hug each other.
```

Vídeo (Flow, quadro inicial = imagem acima, sem quadro final):

```
The two women neighbors step toward each other and share a warm, long hug, eyes closed, gentle smiles, one softly pats the other's back. Slow, gentle camera push-in at eye level, no cuts. Both women stay in frame the whole time, no one else enters. Warm evening light, calm and natural movement.
```

Lições do Flow (Max: Nexo, 15/10): sem quadro final (início e fim distantes
aceleram o movimento); tudo o que aparece já tem de estar no quadro inicial;
uma ação só (o abraço).

## Plano 3 — Convivência (imagem)

```
Community party room (salão de festas) of a residential condominium in the evening. A circle of about eight chairs; teenagers and adult women sitting in a relaxed conversation circle, a woman psychologist with a notebook among them, people smiling and listening. String lights, warm lamps, magenta and teal cushions on some chairs. Wide shot at eye level.
```

## Depois de aprovado

1. Salvar em `remotion/public/`: `escuta.png`, `vinculo.mp4`, `convivencia.png`.
2. Em `HeroSequence.tsx`, trocar `mae.png` → `escuta.png`,
   `close.mp4` → `vinculo.mp4`, `ots.png` → `convivencia.png`
   (conferir o recorte inicial/final de cada Ken Burns).
3. `npm run render && npm run publish` (gate de 3 MiB).
4. Gerar um `poster.webp` novo a partir do plano 3.
5. Guardar os frames atuais para o `revivaz_municipios` antes de sobrescrever.
