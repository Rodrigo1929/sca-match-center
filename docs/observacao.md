# SCA Observação — estado e pendentes

App à parte da SCA Match Center para observar os adversários do **Campeonato de Futebol dos Açores 2026/27**.
Existe para dar acesso a um observador de fora do clube sem ele ver o resto da app.

- **Link:** https://claude.ai/artifact/L7rJPrEcxmw86DbHyT5vEw (privado; publica-se só para aqui)
- **Código:** `observacao/page.html` (um só ficheiro, um só `<script>`) + `observacao/planteis.json`
- **Build:** `npm run build` → `dist/observacao.html` (a página, o logo, a bola e os planteis embutidos)
- **Testes:** `npm run check` (sintaxe) e `npm run test:obs` (browser, PC e telemóvel; `-- --ipad` para WebKit)
- **Versão publicada:** Obs. 20 (26/10/2026) — ver `CHANGELOG.md`

## Quem usa e com que acesso
| Quem | O que vê | O que faz |
|---|---|---|
| Rodrigo Fonte (dono, equipa técnica) | Todos os relatórios | Revê, comenta na Síntese, marca como revisto; pode editar tudo |
| Observador (Rodrigo Simão, de fora do clube) | Todos os relatórios e os planteis base (desde a Obs. 14) | Cria e preenche os seus relatórios; edita os planteis base; envia para revisão. Os relatórios dos outros são só leitura |

- Na app, o dono aparece como **"equipa técnica"** (nunca "Rodrigo": o observador também se chama Rodrigo).
- O observador tem de ser convidado por email com o nível **Editor**. Um convidado de fora como Leitor só lê e não grava.
- A página **não pode** estar partilhada por link público: isso tira ao Editor de fora a permissão de gravar.
- Risco aceite: como Editor, o observador também pode publicar versões desta página. Não tem acesso à SCA Match Center.

### Regras da base de dados (declaradas no publish; numa republicação omitir `capabilities`)
```
""          read owner      write owner
"obs"       read interact   write owner      (todos leem os relatórios de todos, desde a Obs. 14)
"obs/{self}" read interact  write interact   (cada um escreve só no seu espaço)
"base"      read interact   write interact   (planteis base; Obs. 13 escrevia só o dono, Obs. 14 todos)
user: scopes ["profile"]   (nomes de quem observa)
```
Verificado em 26/10/2026 (Obs. 13): ao nível `interact` lê-se `base` e não se escreve (regra da Obs. 13).

## Dados
| Caminho | Conteúdo |
|---|---|
| `obs/<uid>` | Marca de que o observador existe (o dono lista esta coleção para encontrar os observadores) |
| `obs/<uid>/relatorios/<id>` | Um relatório por adversário (documento inteiro; só o autor escreve normalmente) |
| `obs/<uid>/revisoes/<id>` | Comentários do Rodrigo a esse relatório (só o dono escreve; documento separado para não haver choques) |
| `base/<equipa>` | Plantel base de cada equipa (id = nome sem acentos, ex.: `sao-roque`): `equipa` + `plantel`, `plantelFonte`, `treinador`, `adjunto`, `trGR`, `sistema`, `capitao`, `plantelNotas`, `cores`, `plXY`, `plNom`. Quem observa lê e escreve. Um relatório novo copia-o (se não houver, usa o zerozero); no relatório há "Repor o plantel base" e "Guardar como plantel base" |

No aparelho: `sca-obs-cache-v1` (cópia dos relatórios), `sca-obs-pend-v1` (fila de envios sem rede), `sca-obs-vista` (onde estava).
A cache carrega-se em `carregaCache()`, **depois** de todas as constantes existirem (um erro disto fez desaparecer relatórios na Obs. 9).

### Relatório (campos principais)
- `adversario`, `competicao`, `estado` (`rasc`/`env` = "Submetido"), `jogos[]` (vs, data, local, res, como, vídeo, ctx, `onze` [11 ids do plantel], `acont` [{t: golo/sub/am/verm, min, jog, jog2, eq: nos/contra}])
- `plantel[]` (n, nome, idade, pos do zerozero, pe, nac, `slot` = código de posição, `conf`), `treinador`, `adjunto`, `trGR`, `sistema`, `capitao`, `plantelNotas`, `cores` {cam, cam2, num, gr}
- `plXY` {sistema: {código: {x,y}}} e `plNom` {sistema: {idJogador: {x,y}}}: sítios livres no desenho do plantel (frações do campo)
- `onzes` {prov, alt} → {sis, pos {código: idJogador}, nota, xy {código: {x,y}}, nxy {código: {x,y}}}
- `onze` (Estrutura no campo) {com, sem → {sis, pos, nota}, jog[11], nos, nosPos {com, sem}}
- `chk[idPergunta]` {op[], freq, jog[], jp {idJogador: código de posição} (perguntas `pj`: escolhe-se a posição e depois o jogador), nota, quadro {pecas[], setas[]}}
- `evid[]` (q, txt, jogo, min, freq rec/pont/conf, ctx, clip, sit)
- `bp[]` (bolas paradas com desenho e 4 aspetos), `refs[]` (jogadores de referência), `sint`, `clips[]`

## Decisões do Rodrigo (não mudar sem ele)
- **Guião em checklist** (`GUIAO`, 36 perguntas): opções para tocar, frequência (sempre / muitas vezes / às vezes), jogadores do plantel, notas opcionais, evidências; quadro tático nas 12 perguntas em que a posição conta. A Ligação ao 3-4-3 fica para o observador com opções simples; o Rodrigo completa na revisão.
- **Ajustes do Rodrigo Fonte (26/10/2026, Obs. 19):** momentos do jogo chamam-se Organização ofensiva, Transição defesa-ataque, Transição ataque-defesa, Organização defensiva, Bolas paradas ofensivas e Bolas paradas defensivas (as bolas paradas passaram a duas secções, `bpo`/`bpd`); "Enviar para revisão" passa a "Submeter relatório"; sem botão nem referências ao zerozero; perguntas c_apoio, c_rut, r_1p e r_prof escolhem a posição e depois o jogador; p_prot ganha "3+1"; s_pb ganha "A meio do meio-campo adversário (2/3 do campo)"; jogos observados com onze inicial e acontecimentos; jogadores de referência escolhidos do plantel.
- **Síntese:** estrutura e comportamentos; 3 ameaças; 3 oportunidades; bolas paradas e jogadores; clips com frase.
- **Princípios:** espírito de equipa, intensidade, organização, objetividade; referência o nosso 3-4-3.
- **Plantel:** estilo do plantel da SCA Match Center (campo branco, números 1–11, nomes por baixo). O desenho segue o **sistema habitual**; há **onze provável** e **onze alternativo**, cada um com o seu sistema. Escolher um jogador no onze provável muda a posição dele no plantel; o alternativo não mexe.
- **Sistemas:** 4-3-3, 4-4-2, 4-4-2 losango, 4-2-3-1, 4-1-4-1, 3-5-2, 3-4-3, 5-3-2, 5-4-1.
- **Campos e bolinhas** iguais aos da SCA Match Center. SCA a vermelho, GR amarelo; o adversário **com as cores do equipamento dele**, nunca o vermelho da SCA por defeito.
- **Estrutura no campo:** as bolinhas das duas equipas ficam onde o observador as põe; o sistema só dá o ponto de partida.
- **Plantel e onzes com bolinhas livres** (Rodrigo, 26/10/2026): a bolinha de cada posição arrasta-se para onde se quiser e leva os nomes (`plXY[sistema]` no plantel, `onzes.prov/alt.xy`). Com **Mover livremente** ligado, os nomes também ficam onde se largam (`plNom[sistema][idJogador]`, `onzes.*.nxy`); desligado, arrastar um nome no plantel muda o jogador de posição. "Repor tudo no sítio do sistema" apaga os sítios livres da vista.

## Pendentes
- [x] **Cores dos clubes** (Rodrigo, 26/10/2026), em `CORES_EQ` (camisola / contorno): Barreiro vermelho/branco, Lusitânia verde/branco, Madalena grená/azul, Praiense vermelho, Rabo de Peixe azul/azul, Santo António azul/branco, São Roque amarelo/azul, União Micaelense tudo preto, Vale Formoso preto/branco. Relatórios sem camisola recebem as do clube; a cor escolhida pelo observador mantém-se. Guarda-redes por confirmar (amarelo por defeito; no São Roque coincide com a camisola).
- [x] **Teste no iPad / Safari:** `npm run test:obs -- --ipad` passa (26/10/2026; precisou de `<meta charset>` na página, sem ele o WebKit lia os acentos mal no ficheiro local). Falta ver num iPad a sério arrastar nomes no Plantel e bolinhas nos quadros com o dedo (o teste não arrasta).
- [x] **Nada mudava no jogo observado** (26/10/2026): os dados que chegam da base de dados vêm **congelados** (`data()` é só de leitura); a página alterava-os diretamente e as alterações falhavam em silêncio (gravava sempre o jogo vazio). Agora tudo o que chega passa por `lerDoc` (cópia). O teste com base de dados simulada congela os dados como o link.
- [x] **Gravações que falham à vista** (26/10/2026): o estado diz "Não gravou · tocar para ver" e, ao tocar, mostra o código do erro por documento, com "Tentar outra vez" e "Recarregar a página". Erros passageiros voltam a tentar sozinhos (3 s, 8 s, 20 s…); cada gravação tem 20 s para responder e não prende as seguintes. `revoked` (a página perdeu o acesso, p. ex. depois de uma publicação com ela aberta) → "Recarrega a página para gravar". Depois de cada publicação, pedir ao Rodrigo Fonte que recarregue a página.
- [x] **Data e local apagados** (26/10/2026): uma atualização da base de dados que chegava enquanto um campo esperava para gravar (0,7 s) substituía-o e a alteração perdia-se. Agora, com alteração por gravar (`tSave`) ou por confirmar (`pend`), o que chega não substitui o relatório. Teste com base de dados simulada em `tests/observacao.mjs`.
- [x] **Setas e arrasto** (26/10/2026): desenhar uma seta já não refaz o campo a meio (antes a seta perdia-se); o que chega da base de dados durante um arrasto espera pelo fim (`aArrastar`).
- [x] **Plantel sem relatório** (Rodrigo Fonte, 26/10/2026): "Planteis base" na página inicial, um por equipa; os relatórios novos partem dele (regra `base`). Na Obs. 14 o observador passa a ver todos os relatórios e a editar os planteis base.
- [ ] **Convidar o observador** (Editor, por email) e fazer a primeira análise juntos; a partir daí ajustar o nível de detalhe do guião.
- [ ] **Posições a confirmar:** ~54 jogadores ficaram com posição provável (tracejado laranja) porque o zerozero só dá a linha; 3 sem posição (Gonçalo Rodrigo/Barreiro, Afonso/Rabo de Peixe, Gustavo Silveira/Lusitânia).
- [ ] **zerozero:** em 25/10/2026 a rede do Rodrigo ficou bloqueada depois de ~230 páginas lidas seguidas. Para atualizar planteis: poucas páginas, com pausas. Época 2027/28: o formato do campeonato muda; rever `EQUIPAS`, `EPOCA` e `planteis.json`.
- [ ] Ideias por decidir com o Rodrigo: exportar o relatório (PDF/imagem) para a reunião de pré-jogo; levar a síntese para a SCA Match Center (hoje as duas apps não partilham dados, de propósito).
