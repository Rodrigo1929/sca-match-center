# Regras e decisões tomadas

Estas regras foram decididas ao longo do desenvolvimento e estão implementadas. Qualquer mudança parte daqui e é confirmada pelo Rodrigo.

| Tema | Decisão |
|---|---|
| Competições | Taça AFAH: até 9 substituições em 3 paragens. Campeonato dos Açores: 7 suplentes, 5 substituições em 3 paragens. O intervalo não conta como paragem |
| Minutos | 23:10 conta como minuto 24' |
| Golos | Um golo conta também como remate (e à baliza) |
| Cantos | O contador +1 do Ao vivo cria também a ficha do canto, com escolha do tipo de canto usado (fonte única) |
| Substituições Ao vivo | Não passam para os quadros de bolas paradas; os quadros só mudam com trocas do Banco |
| Jogadores repetidos | Um jogador não pode aparecer duas vezes num lance, exceto como alternativa (branca com contorno laranja) |
| Estatística | Quando existe análise de vídeo, substitui a do Ao vivo estatística a estatística |
| Confirmações | Sempre por 2 toques, nunca a escrever (uso rápido no iPad) |
| Campo de análise | 100×64, com margem para registar ações fora de campo |
| TV | Por defeito: Onze + bolas paradas, juntas por tipo e lado; 15 s por ecrã quando juntas, 8 s quando separadas. As referências saem sempre juntas num só ecrã. Livres divididos em Esquerda e Direita |
| Modelo de Jogo | 4 momentos com subfases; animação por passos (o passo novo copia o anterior); mesmo visual dos quadros das bolas paradas, em ecrã largo com painel do passo ao lado |
| Modelo de Jogo · onze | Quadros novos começam no onze do separador Jogo (posições, números e siglas). Cada jogador SCA está ligado a um lugar do onze: o número segue sempre o onze. Trocas como nas bolas paradas (tocar no jogador): só neste quadro ou em todos os quadros do Modelo; não mexem no onze nem nos lances de bolas paradas |
| TV · duas escolhas | Duas TVs à parte: Bolas paradas ou Modelo de Jogo, cada uma com a sua escolha, ordem e tempo. No Modelo, cada quadro fica no ecrã o tempo da animação completa (mínimo: segundos por ecrã) |
| Modelo de Jogo · bolinhas | Botão Nº ⇄ Posição por quadro (no quadro e na apresentação), guardado para a TV e o vídeo. Sem etiqueta por baixo da bolinha; só o nome, se "Nomes por baixo" estiver ligado |
| Apresentar | No separador Modelo de Jogo, ▶ Apresentar mostra os quadros do Modelo (avança-se à mão, toque anima) |
