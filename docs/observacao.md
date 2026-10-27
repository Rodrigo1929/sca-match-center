# SCA Observação — estado e pendentes

App à parte da SCA Match Center para observar os adversários do **Campeonato de Futebol dos Açores 2026/27**.
Existe para dar acesso a um observador de fora do clube sem ele ver o resto da app.

- **Link:** https://claude.ai/artifact/L7rJPrEcxmw86DbHyT5vEw (privado; publica-se só para aqui)
- **Código:** `observacao/page.html` (um só ficheiro, um só `<script>`) + `observacao/planteis.json`
- **Build:** `npm run build` → `dist/observacao.html` (a página, o logo, a bola e os planteis embutidos)
- **Testes:** `npm run check` (sintaxe) e `npm run test:obs` (browser, PC e telemóvel; `-- --ipad` para WebKit)
- **Versão publicada:** Obs. 25 (27/10/2026) — ver `CHANGELOG.md`

## Quem usa e com que acesso
| Quem | O que vê | O que faz |
|---|---|---|
| Rodrigo Fonte (dono, equipa técnica) | Todos os relatórios e o histórico | Edita tudo; revê e marca como revisto; apaga relatórios de qualquer autor; «Repor» no histórico; exporta o plantel para o Match Center |
| Observadores (Rodrigo Simão e Nuno Alves, de fora do clube) | Todos os relatórios, os planteis base e o histórico | Cria relatórios e edita os de qualquer autor (desde a Obs. 23); apaga só os seus; envia para revisão; edita os planteis base e «Guarda como plantel base» (desde a Obs. 25) |

- Na app, o dono aparece como **"equipa técnica"** (nunca "Rodrigo": o observador também se chama Rodrigo).
- O observador tem de ser convidado por email com o nível **Editor**. Um convidado de fora como Leitor só lê e não grava.
- A página **não pode** estar partilhada por link público: isso tira ao Editor de fora a permissão de gravar.
- Risco aceite: como Editor, o observador também pode publicar versões desta página. Não tem acesso à SCA Match Center.

### Regras da base de dados (declaradas no publish; numa republicação omitir `capabilities`)
```
""           read owner      write owner
"obs"        read interact   write interact   (qualquer membro edita relatórios de qualquer autor, Obs. 23)
"rev"        read interact   write owner      (revisão da equipa técnica)
"base"       read interact   write interact   (planteis base: desde a Obs. 25 os observadores também editam; na Obs. 23–24 só o dono)
"log"        read interact   write owner      (histórico: só o dono mexe nos registos dos outros)
"log/{self}" write interact                   (cada um acrescenta e atualiza os seus registos)
user: scopes ["profile"]   (nomes de quem edita)
downloads: true             (PDF e PowerPoint, desde a Obs. 21)
```
Verificado em 27/10/2026 (Obs. 23, nível `interact`): escreve em `obs/<outro>/relatorios` e em `log/<próprio>/e`; não escreve em `base`, `rev` nem `log/<outro>/e`.
Até à Obs. 22: `obs` escrevia só o dono, `obs/{self}` cada um no seu espaço, `base` escreviam todos.

**Limites das regras** (a base de dados só sabe ler/escrever por caminho e nível): não verifica que `por` é quem está a gravar (só que o registo está no espaço dele, `log/<uid>`), não conhece a janela de 10 minutos nem distingue criar de apagar. Por isso: cada um pode apagar os seus próprios registos; apagar relatórios de outros autores está bloqueado só na app (a regra `obs` deixa).

## Dados
| Caminho | Conteúdo |
|---|---|
| `obs/<uid>` | Marca de que o observador existe (o dono lista esta coleção para encontrar os observadores) |
| `obs/<uid>/relatorios/<id>` | Um relatório por **jogo observado** (`<uid>` = autor; desde a Obs. 23 qualquer membro edita). Grava-se **só o que mudou** (`update` com o patch, pela fila `pend`); o que chega da base de dados junta-se ao que está a ser escrito (junção a 3: base do servidor, local, remoto; em conflito no mesmo campo ganha o local). `ultPor` = quem alterou por último. `pend` {chave: true} = pontos que vieram do jogo anterior por confirmar (`chk:<id>`, `plantel`, `estr`, `bp:<id>`, `ref:<id>`, `sint`); `baseDe` {id, vs, data} = de que jogo vieram |
| `rev/<id>` | Revisão da equipa técnica a esse relatório (só o dono escreve). Até à Obs. 22 era `obs/<uid>/revisoes/<id>` (a única que existia estava vazia e não foi passada) |
| `log/<uid>/e/<id>` | **Histórico** (só acrescenta): `relId`, `autor`, `por` (= `<uid>`), `nome`, `em`, `sec`, `campo` (legível, ex. «Organização ofensiva › P1 › Opções»), `cam` (caminho), `antes`, `depois`, `tipo` (edição, criação, apagar item, reposição). A mesma pessoa no mesmo campo em menos de 10 min atualiza o mesmo registo e mantém o `antes` original. Valores grandes guardam-se inteiros e mostram-se resumidos (acima de 120 KB fica só a marca `grande`) |
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
- **Relatório por jogo (Rodrigo Fonte, 26/10/2026, Obs. 21):** cada relatório é um jogo. «+ Novo jogo» numa equipa copia do último jogo (o do próprio observador, senão o mais recente) as respostas, plantel e estrutura, bolas paradas, referências e síntese; cada ponto copiado fica a laranja ("por confirmar") até se confirmar ou mudar; evidências e ficha do jogo começam vazias. Submeter com pontos por confirmar pede 2 toques. O onze da ficha do jogo preenche as bolinhas da Estrutura com e sem bola (mesmo sistema de partida, cada jogador na posição mais parecida), com o nome por baixo de cada bolinha; se a Estrutura ainda não tem nomes, usa o onze sozinha; botão «↺ Pôr o onze da ficha do jogo». Golos, substituições e cartões da ficha editam-se tocando neles. Relatórios antigos com vários jogos: botão «Separar em relatórios por jogo».
- **Histórico da equipa** (botão 📈 com 2 ou mais jogos): cada pergunta jogo a jogo, a laranja o que mudou em relação ao jogo anterior.
- **PDF de cada jogo** (📄 PDF) e **PowerPoint para os jogadores** (📽 Apresentação: escolhem-se os pontos — estrutura, perguntas, bolas paradas, referências, síntese; cada evidência ligada a um ponto dá um diapositivo em branco com o jogo e o minuto, para pôr o clip). Bibliotecas carregadas só ao exportar: jsPDF (cdnjs) e PptxGenJS (jsDelivr); ficheiros entregues pela capacidade `downloads`.
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
- [x] **Edição partilhada com histórico** (Rodrigo Fonte, 27/10/2026, Obs. 23): qualquer membro edita qualquer relatório; grava só o campo alterado; secção «Histórico de alterações» em cada relatório (mais recente primeiro, filtro por pessoa); na lista, «Última alteração: nome, data»; o dono repõe um valor com 2 toques (fica um registo «reposição»). Teste com duas pessoas ao mesmo tempo na base de dados simulada.
- [x] **Exportar para o Match Center** (Rodrigo Fonte, 27/10/2026, Obs. 24): no plantel base, «⬇ Exportar para o Match Center» (só a equipa técnica) descarrega `Plantel_<equipa>_<data>.json` com o plantel base (nº, nome, sigla da posição), sistema, cores e o onze provável e alternativo do último relatório dessa equipa (`plantelParaMC`); um jogador que só está no relatório entra no plantel exportado. Lê-se no separador Adversário da SCA Match Center.
- [x] **Planteis base editáveis pelos observadores** (Rodrigo Fonte, 27/10/2026, Obs. 25): regra `base` passa a escrever `interact`.
- [x] **Penáltis nas bolas paradas** (Obs. 25): tipo «Penálti» (`pen`) nas ofensivas e defensivas, com a bola na marca dos 11 m, o guarda-redes na baliza e os outros à entrada da área.
- [x] **Cópias diárias** (27/10/2026): tarefa agendada no PC do Rodrigo Fonte às 23h guarda `Copias SCA/observacao/<data>.json` quando houve alterações (ver `CLAUDE.md`).
- [ ] **Convidar o observador** (Editor, por email) e fazer a primeira análise juntos; a partir daí ajustar o nível de detalhe do guião.
- [ ] **Posições a confirmar:** ~54 jogadores ficaram com posição provável (tracejado laranja) porque o zerozero só dá a linha; 3 sem posição (Gonçalo Rodrigo/Barreiro, Afonso/Rabo de Peixe, Gustavo Silveira/Lusitânia).
- [ ] **zerozero:** em 25/10/2026 a rede do Rodrigo ficou bloqueada depois de ~230 páginas lidas seguidas. Para atualizar planteis: poucas páginas, com pausas. Época 2027/28: o formato do campeonato muda; rever `EQUIPAS`, `EPOCA` e `planteis.json`.
- [ ] Ideias por decidir com o Rodrigo: exportar o relatório (PDF/imagem) para a reunião de pré-jogo; levar a síntese para a SCA Match Center (hoje as duas apps não partilham dados, de propósito).
