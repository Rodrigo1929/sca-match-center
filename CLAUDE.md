# SCA Match Center — instruções para o Claude

App da equipa técnica do **SC Angrense** para preparar, acompanhar e analisar cada jogo.
Responsável único: Rodrigo Fonte (treinador adjunto, bolas paradas). Responde sempre em **português de Portugal**.

## Utilizadores e uso real
- **Rodrigo** — Quadro (bolas paradas), Jogo, Plantel, Modelo de Jogo, TV, PDF. PC e iPad.
- **Preparador físico** — Ao vivo (banco, iPad, durante o jogo) e Pós-jogo (vídeo).
- **Treinador principal** — consulta no pré-jogo (Quadro, Apresentar, TV).
- Uso no banco = pressa, dedos, pouca rede. Tudo tem de funcionar no **Safari do iPad** e **sem internet**.

## Estrutura
```
src/page.html            esqueleto HTML com marcadores {{CSS}} {{APP_JS}} {{MODELO_JS}} {{EXERC_JS}} {{TREINO_JS}}
src/styles.css           todo o CSS
src/js/NN-*.js           script principal, partido por secções (ordem em src/js/ordem.json)
src/js/modelo-de-jogo.js separador Modelo de Jogo (2.º <script>); o editor também desenha a figura dos exercícios
src/js/exercicios.js     separador Exercícios, repositório para as UT (3.º <script>)
src/js/treino.js         separador Treino, Unidades de Treino e PDF da UT (4.º <script>)
src/js/semana.js         Plano semanal e calendário de jogos (no separador Treino; junta-se ao 4.º <script>)
src/js/anual.js          Planeamento anual: dias, microciclos e mesociclos (no separador Treino; junta-se ao 4.º <script>)
src/js/adversario.js     separador Adversário, substituições do adversário (no Jogo) e quadro Encaixe (1.º <script>, antes do arranque)
src/data/lances-base.json lances de bolas paradas de origem (DEF_LANCES)
assets/                  imagens dos campos, logo e letras (embutidos no build como data URI)
tools/build.mjs          monta dist/index.html (um único ficheiro)
tools/check.mjs          build + verificação de sintaxe
tests/smoke.mjs          teste no browser (Playwright)
docs/                    regras de negócio, modelo de dados, histórico
```
Os ficheiros `src/js/*.js` **não são módulos**: são concatenados por ordem num `<script>` clássico e partilham o mesmo âmbito global. Uma função definida num ficheiro é usada noutro. Não uses `import`/`export` dentro de `src/`.
Os 4 scripts partilham o âmbito global: uma `function` repetida noutro script substitui a primeira sem dar erro. `npm run check` falha se encontrar nomes de topo repetidos.

## Comandos
- `npm run build` → `dist/index.html`
- `npm run check` → build + sintaxe (correr sempre antes de publicar)
- `npm test` → build + teste no browser (precisa de `npm install` e `npx playwright install chromium`)
- `npm run test:obs` → build + teste no browser da app de observação (PC e telemóvel; `-- --ipad` para WebKit)
- `npm run test:ipad` → o mesmo teste no WebKit (motor do Safari) com ecrã e toque de iPad (precisa de `npx playwright install webkit`)

## Publicação — regra crítica
A app vive num **único link**: https://claude.ai/artifact/3uVFyLVzJvF5z8upFHkJqN
Os **dados de toda a equipa** (lances, jogos, histórico, análises, Modelo de Jogo) estão guardados junto desse link.
- Publicar **sempre para esse mesmo link**, com o ficheiro `dist/index.html`. Nunca criar um artefacto novo para a app.
- Manter as capacidades atuais (`db`, `downloads`, `room`, `user` com `scopes:["profile"]`, e desde a v68 `assets` com `upload:"interact"` para as imagens dos exercícios): numa republicação não as alterar (omitir `capabilities` mantém as guardadas).
- Antes de publicar: `npm run check` e, se possível, `npm test` e `npm run test:ipad`.
- Se a sessão não conseguir publicar no link, gerar `dist/index.html` e dizer ao Rodrigo que a publicação tem de ser feita numa conversa do Projeto "SCA Match Center" no claude.ai. Não procurar outra forma de alojar a app.
- Em dia de jogo, não publicar alterações ao Ao vivo sem o Rodrigo confirmar.

## App de observação de adversários (link à parte)
`observacao/page.html` → `dist/observacao.html` (um só ficheiro, um só `<script>`, sem partilhar código com a app principal).
Estado, modelo de dados, decisões e **pendentes**: `docs/observacao.md` (ler antes de mexer). Testar com `npm run check` e `npm run test:obs` (`-- --ipad` para WebKit). Atualizar os pendentes desse ficheiro e o `CHANGELOG.md` (linhas "Obs. N") a cada publicação.
Capacidades desde a Obs. 23: `db` (6 regras), `user` (`scopes:["profile"]`) e `downloads` (PDF e PowerPoint). Publica-se **só** para https://claude.ai/artifact/L7rJPrEcxmw86DbHyT5vEw — nunca para o link da SCA Match Center, e a SCA Match Center nunca para este.
- Existe para dar acesso a um observador de fora do clube sem ele ver o resto da app. Não acrescentar aqui dados da app principal.
- Regras de acesso da base de dados (manter numa republicação, omitindo `capabilities`; lista completa em `docs/observacao.md`): raiz só o dono; `obs` lê e escreve `interact` (desde a Obs. 23 qualquer membro edita qualquer relatório); `rev` e `base` leem `interact`, escreve só o dono; `log` lê `interact`, escreve o dono, e `log/{self}` escreve `interact`. O observador precisa de ser convidado como **Editor** (convidado de fora do clube como Leitor não grava) e a página não pode estar partilhada por link público.
- Caminhos: `obs/<uid>` (marca), `obs/<uid>/relatorios/<id>` (um relatório por jogo observado; `<uid>` = autor; grava-se só o que mudou com `update`, pela fila `pend`, e o que chega junta-se ao que está a ser escrito), `rev/<id>` (revisão da equipa técnica), `log/<uid>/e/<id>` (histórico, só acrescenta; mesma pessoa e campo em 10 min atualiza o mesmo registo), `base/<equipa>` (plantel base; só o dono escreve).
- Só o dono: revisão, apagar relatórios de outros autores (bloqueado na app, a regra `obs` não distingue), editar planteis base e «Repor» no histórico.
- O observador chama-se **Rodrigo Simão**: na app o dono aparece como "equipa técnica", nunca só "Rodrigo"; nas respostas distinguir Rodrigo Fonte e Rodrigo Simão.
- Guião em checklist (`GUIAO`, aprovado pelo Rodrigo em 25/10/2026): cada pergunta tem opções para tocar, frequência (sempre, muitas vezes, às vezes), jogadores do plantel, notas opcionais, evidências e, onde a posição conta, quadro tático. Respostas em `chk[idPergunta]`. `Q_ANTIGO` passa relatórios do guião em texto para as notas.
- O guião de perguntas, a síntese (estrutura, 3 ameaças, 3 oportunidades, bolas paradas e jogadores, clips) e os princípios (espírito de equipa, intensidade, organização, objetividade; referência 3-4-3) foram definidos pelo Rodrigo: não mudar sem ele.
- Adversários: as equipas do Campeonato de Futebol dos Açores da época em curso (`EQUIPAS` e `EPOCA` no início do script). Na época seguinte, atualizar a lista com a fonte oficial.
- Planteis de partida em `observacao/planteis.json` (zerozero, com data). Cada relatório guarda a sua cópia (`plantel`), que o observador corrige; atualizar o ficheiro não mexe nos relatórios já criados. O zerozero bloqueia leituras automáticas: recolher pelo Chrome do Rodrigo, devagar (no máximo umas dezenas de páginas, com pausas de vários segundos). Em 25/10/2026, ~230 páginas seguidas fizeram o zerozero passar a mostrar páginas trocadas nesse browser.
- Plantel: cada jogador guarda um código de posição (LD, DCD, MCD, PL…), não um número; o número e o lugar no desenho vêm do sistema (`LAYOUTS`), e num sistema sem esse código o jogador vai para a posição mais parecida (`POS_ALT`). Escolher um jogador no onze provável muda a posição dele no plantel; o onze alternativo não mexe no plantel. As bolinhas do plantel e dos onzes arrastam-se para onde se quiser (e, com "Mover livremente", também os nomes): todas as peças têm de poder mexer-se livremente quando o Rodrigo quiser.
- Cores: o adversário nunca usa o vermelho da SCA por defeito; usa as cores do equipamento guardadas no relatório (`cores`). `CORES_EQ` tem as cores confirmadas pelo Rodrigo para os 9 adversários de 2026/27; para clubes novos, perguntar, não inventar.
- Cada evidência guarda jogo, minuto do vídeo (mm:ss), frequência (recorrente, pontual, a confirmar) e resultado no momento.

## Regras técnicas
- **Gravação por registo**: cada evento, substituição, ação de vídeo, lance e quadro do Modelo de Jogo é um documento próprio (`gravaDoc`/`apagaDoc`). Nunca gravar listas inteiras num só documento: dois aparelhos trabalham ao mesmo tempo.
- **Fila offline**: as escritas passam pela fila `pendentes` (sobrevive a falhas de rede e a recarregar). Não escrever na base de dados por fora dessa fila.
- Dados lidos da base de dados passam sempre por uma função `norm*` antes de serem usados.
- Não colocar dados de exemplo fixos no código.
- Sem pedidos a sites externos, exceto os scripts de CDN que já existem (jsPDF, jsPDF-AutoTable, SheetJS e mp4-muxer). Imagens e letras ficam embutidas (resolveu os "campos azuis com ?" no iPad).
- Confirmações destrutivas: **2 toques** (`confirma2` ou o padrão equivalente), nunca escrever texto para confirmar.
- Alvos de toque com pelo menos ~40 px de altura.
- Desfazer: Ctrl+Z nos Quadros e no Modelo de Jogo; cada separador tem o seu.
- Cópia de segurança (Histórico) tem de incluir qualquer dado novo que se crie.

## Regras de negócio (decididas, não mudar sem o Rodrigo)
Ver `docs/regras.md`. As principais:
- Taça AFAH: até 9 substituições em 3 paragens. Campeonato dos Açores: 7 suplentes, 5 substituições em 3 paragens. O intervalo não conta como paragem.
- Minutos: 23:10 conta como 24'.
- Um golo conta também como remate e como remate à baliza.
- Cantos: o +1 do Ao vivo é a fonte única e cria a ficha do canto (com tipo).
- Substituições do Ao vivo não mexem nos quadros de bolas paradas.
- Adversário (desde a v84): plantel por equipa em `adversarios/<id>`, reutilizado entre jogos; onze, sistema, cores e suplentes por jogo (`jogo.adv`); substituições do adversário no separador Jogo, gravadas uma a uma (`subsAdv/<id>`), com minuto escrito à mão. Atualizam só o quadro Encaixe; não mexem nos quadros de bolas paradas nem no Onze (o Onze é só a nossa equipa). Arquivar guarda-as; o jogo seguinte começa limpo. Fase 2 (por fazer): importar da SCA Observação (`origem`, `versaoImportada`).
- Um jogador não aparece duas vezes num lance, exceto como alternativa.
- Com análise de vídeo, a estatística do vídeo substitui a do Ao vivo.

## Forma de trabalhar
- Antes de uma mudança grande, perguntar o objetivo e quem usa (escolha múltipla quando fizer sentido).
- Cada versão publicada: atualizar `CHANGELOG.md`, subir a versão em `package.json` e no dossier do projeto.
- Commits pequenos, com mensagem em português a dizer o que muda para o utilizador.
