# Plano · Repositório de exercícios e Unidades de Treino (UT)

Objetivo: ter na app um **repositório de exercícios** com os campos da ficha de UT do clube e, depois, **criar a UT na app** escolhendo exercícios desse repositório, com PDF igual ao modelo atual (UT39 de 21/10/2026).

Decisões tomadas com o Rodrigo (22/10/2026):
- Organização: **Parte da UT** (Inicial, Fundamental, Final) + filtros por **momento do jogo** e **tipo de exercício**, com pesquisa.
- Figura: **desenhar na app** com o visual dos quadros e do Modelo de Jogo **e** poder **carregar uma imagem** (para aproveitar as figuras que já existem).
- Quem edita: **toda a equipa técnica** (Rodrigo, João Vaz Cardoso, Rui Dinis, David Dinis). Fica registado quem criou e quem alterou.
- Os **7 exercícios da UT39** entram no repositório quando a Fase 1 estiver pronta.

---

## O que a UT39 mostra (modelo de campos)

**Cabeçalho da UT:** nº da UT, data, Match Day, regime (ex.: Híbrido +/-), tempo total do treino, objetivos (ex.: Tensão · Princípios estratégicos org. ofensiva da 1.ª fase · Esquemas táticos ofensivos), material, presenças do plantel com legenda (Lesão L · NFL * · Ausente A · Castigado C · Condicionado CO), grupos de trabalho, equipa técnica no rodapé.

**Cada exercício:**

| Campo na ficha | Exemplo (UT39) |
|---|---|
| Nº e parte | Exercício 3 · Parte Fundamental |
| Espaço | Dupla área · 1/2 campo · 8x8 |
| Duração | Total 12' · Séries/reps 3 · Tempo prática 3' · Pausa 1'30 |
| Título (a vermelho) | MPB Posicional – 8+2×4+GR |
| Objetivos e condicionantes | texto + lista de comportamentos-chave |
| Descrição | texto |
| Variantes | lista (ex.: "1) Competição interna entre jogadores") |
| Figura | campo com jogadores, cones, mini-balizas, setas |

Nota: o **total** nem sempre é séries × prática + pausas (Ex. 2: 6 × 1' + 30 s = 8'30, na ficha 12'). O total é sugerido pela conta mas fica editável.

---

## Fase 1 · Repositório de exercícios (separador "Exercícios")

### Dados — `exercicios/{id}` (um documento por exercício, pela fila `pendentes`)
```
{ id, nome,                       // título a vermelho
  parte: "inicial"|"fundamental"|"final",
  momento: "of"|"def"|"tda"|"tad"|"bpof"|"bpdef"|"",   sub,   // subfases do Modelo de Jogo
  tipo: "ativacao"|"rondo"|"mpb"|"reduzido"|"estrategico"|"bolaparada"|"finalizacao"|"fisico"|"gr",
  formato,                        // ex.: "8+2×4+GR", "GR+10×10+GR"
  espaco: { txt, vista: "inteiro"|"meio"|"duplaarea"|"area"|"quadrado", w, h },
  duracao: { series, pratica, pausa, total },          // segundos; total editável
  objetivos, comportamentos: [], condicionantes: [], variantes: [], descricao,
  material: [],                   // bolas, cones, coletes, mini-balizas…
  figura: { quadro?: {pecas, passos, …como o Modelo de Jogo}, imagem?: assetId },
  ligacoes: { modelo: [ids], lances: [ids] },          // ex.: Ex. 6 → cantos esquerda
  criadoPor, alteradoPor, criadoEm, atualizadoEm }
```
- Lido sempre por `normEx` (regra das funções `norm*`).
- Entra na **cópia de segurança** (as imagens ficam no armazenamento do link; a cópia guarda a referência).
- Toda a equipa escreve: cada pessoa precisa de acesso de **Contribuidor** ao link (menu Partilhar no claude.ai).

### Ecrã (mesma grelha dos outros separadores)
- **Esquerda:** lista por Parte, pesquisa, filtros momento/tipo; botão direito → Apagar/Duplicar (no iPad, ✕ com 2 toques).
- **Centro:** a figura com o visual dos quadros (campo branco às riscas, cabeçalho com ícone, linha dourada e emblema) e, por baixo, a ficha.
- **Direita:** duração, objetivos, comportamentos, variantes, material, ligações.
- Botões: ✎ Editar · ⧉ Duplicar · ⛶ Apresentar · ⬇ PDF (ficha do exercício no formato da UT) · ⬇ Vídeo (se tiver passos).

### Figura desenhada (motor do Modelo de Jogo, alargado)
- **Vista do campo:** inteiro, meio campo, dupla área, área, quadrado com medidas (ex.: 8x8 m).
- **Peças novas:** cones (cores), mini-balizas, baliza grande, estacas; coletes por cor (vermelho SCA, azul, amarelo para jokers, branco); GR; números ou letras nas bolinhas (A, M, D como no Ex. 3).
- Mantém setas (corrida, passe, condução, pressão), zonas e **passos animados opcionais**.

### Figura por imagem
- Carregar foto ou print → a app reduz para no máx. 1600 px (JPEG) e guarda no armazenamento de ficheiros do link (`assets`); o exercício guarda só o id.
- Precisa de rede para carregar (o resto continua a funcionar sem internet).
- **Implica acrescentar a capacidade `assets` ao link**, com envio aberto a Contribuidores (`upload: "interact"`), mantendo `db`, `downloads`, `room` e `user`. É a primeira mudança de capacidades desde a v60: confirmar com o Rodrigo na publicação.

### Importar a UT39
- 7 exercícios com todos os campos.
- Ex. 4 e Ex. 5: redesenhados na app (já têm o visual da app).
- Ex. 1, 2, 3 e 6: figura recortada do PDF como imagem, até serem redesenhados.
- Ex. 7 (Core): sem figura.

### Ordem de trabalho da Fase 1 (cada passo é uma versão publicada)
1. **1a** ✓ (v66) — separador Exercícios: lista, filtros, ficha com todos os campos, duplicar/apagar, cópia de segurança. Figura com o editor do Modelo (campo inteiro).
2. **1b** ✓ (v67) — vistas parciais do campo e peças de treino (cones, mini-balizas, balizas, coletes, jokers, várias bolas); bolinhas sem texto; figura sem painel do passo.
3. **1c** ✓ (v68) — imagem carregada (`assets`) e PDF da ficha do exercício.
4. **1d** — importar os 7 exercícios da UT39.

---

## Fase 2 · Unidade de Treino (separador "Treino")

### Dados — `uts/{id}`
```
{ id, numero, data, matchDay, regime, objetivos: [], material: [],
  tempoTotal,                      // soma dos exercícios, editável
  presencas: { [nº]: "L"|"NFL"|"A"|"C"|"CO" },          // a partir do Plantel
  grupos: [ { nome, jogadores: [] } ], staff: [],
  exercicios: [ { exId, ordem, parte, copia: {…ficha no dia…}, ajustes: {duracao, variante} } ],
  criadoPor, criadoEm, atualizadoEm }
```
- A UT guarda **uma cópia** de cada exercício no dia: alterar o exercício no repositório depois **não muda** UTs passadas.

### Ecrã
- Cabeçalho da UT; escolher exercícios do repositório (filtros por parte/momento/tipo); ordenar; ajustar duração e variante só nesta UT.
- Tempo total e material calculados a partir dos exercícios.
- **PDF igual ao modelo atual** (cabeçalho do clube, 2×2 exercícios por página, rodapé com a equipa técnica).
- Histórico de UTs; no repositório, cada exercício mostra "usado em UT39 (21/10/2026)…".

### A decidir antes da Fase 2
- Lista de Match Day (MD+1 … MD-1) e de regimes.
- Se o PDF tem de ser igual ao atual ao pormenor ou pode ter pequenas diferenças.
- Se as presenças da UT alimentam o separador Jogo (convocatória).
