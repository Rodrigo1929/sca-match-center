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
| Figuras · campo e peças | Vistas parciais com a baliza que atacamos em cima; espaço livre com medidas e contorno de cones. Os números das bolinhas ficam sempre direitos e as peças não crescem com o zoom todo. Figuras de exercício: sem painel do passo, começam só com bolinhas (sem números nem posições) e aceitam várias bolas |
| Exercícios | Repositório para as UT com os campos da ficha de UT do clube. Organizado por parte da UT, com filtros por momento e tipo. Figura desenhada com o editor do Modelo de Jogo (imagem carregada vem na Fase 1c). Toda a equipa técnica cria e edita; guarda-se quem criou e quem alterou. Duração total = séries × prática + pausas entre séries, mas pode ser escrita à mão |
| Apresentar | No separador Modelo de Jogo, ▶ Apresentar mostra os quadros do Modelo (avança-se à mão, toque anima) |
