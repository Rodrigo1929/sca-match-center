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
src/page.html            esqueleto HTML com marcadores {{CSS}} {{APP_JS}} {{MODELO_JS}}
src/styles.css           todo o CSS
src/js/NN-*.js           script principal, partido por secções (ordem em src/js/ordem.json)
src/js/modelo-de-jogo.js separador Modelo de Jogo (2.º <script>)
src/data/lances-base.json lances de bolas paradas de origem (DEF_LANCES)
assets/                  imagens dos campos, logo e letras (embutidos no build como data URI)
tools/build.mjs          monta dist/index.html (um único ficheiro)
tools/check.mjs          build + verificação de sintaxe
tests/smoke.mjs          teste no browser (Playwright)
docs/                    regras de negócio, modelo de dados, histórico
```
Os ficheiros `src/js/*.js` **não são módulos**: são concatenados por ordem num `<script>` clássico e partilham o mesmo âmbito global. Uma função definida num ficheiro é usada noutro. Não uses `import`/`export` dentro de `src/`.

## Comandos
- `npm run build` → `dist/index.html`
- `npm run check` → build + sintaxe (correr sempre antes de publicar)
- `npm test` → build + teste no browser (precisa de `npm install` e `npx playwright install chromium`)
- `npm run test:ipad` → o mesmo teste no WebKit (motor do Safari) com ecrã e toque de iPad (precisa de `npx playwright install webkit`)

## Publicação — regra crítica
A app vive num **único link**: https://claude.ai/artifact/3uVFyLVzJvF5z8upFHkJqN
Os **dados de toda a equipa** (lances, jogos, histórico, análises, Modelo de Jogo) estão guardados junto desse link.
- Publicar **sempre para esse mesmo link**, com o ficheiro `dist/index.html`. Nunca criar um artefacto novo para a app.
- Manter as capacidades atuais (`db`, `downloads`, `room`, `user`): numa republicação não as alterar.
- Antes de publicar: `npm run check` e, se possível, `npm test` e `npm run test:ipad`.
- Se a sessão não conseguir publicar no link, gerar `dist/index.html` e dizer ao Rodrigo que a publicação tem de ser feita numa conversa do Projeto "SCA Match Center" no claude.ai. Não procurar outra forma de alojar a app.
- Em dia de jogo, não publicar alterações ao Ao vivo sem o Rodrigo confirmar.

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
- Um jogador não aparece duas vezes num lance, exceto como alternativa.
- Com análise de vídeo, a estatística do vídeo substitui a do Ao vivo.

## Forma de trabalhar
- Antes de uma mudança grande, perguntar o objetivo e quem usa (escolha múltipla quando fizer sentido).
- Cada versão publicada: atualizar `CHANGELOG.md`, subir a versão em `package.json` e no dossier do projeto.
- Commits pequenos, com mensagem em português a dizer o que muda para o utilizador.
