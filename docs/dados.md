# Modelo de dados (base de dados partilhada da app)

Tudo é gravado por registo e passa pela fila `pendentes` (funciona sem rede).

| Caminho | Tipo | Conteúdo |
|---|---|---|
| `estado/atual` | documento | Plantel, linhas de troca do banco, fase, equipa técnica |
| `jogo/atual` | documento | Jogo em curso (adversário, data, competição, onze, suplentes, relógio, vídeo) — sem eventos nem subs |
| `jogo/vivo` | documento | Contadores do Ao vivo por parte, posse |
| `jogo/notas` | documento | Notas do jogo |
| `analise/atual` | documento | Estado do Pós-jogo (posse, sentido de ataque) — sem registos |
| `analise/config` | documento | Ações configuradas do Pós-jogo |
| `tv/config` | documento | Escolha, ordem e tempo da TV (inclui `selM` para o Modelo de Jogo) |
| `eventos/{id}` | coleção | Golos, cartões, cantos… do jogo atual |
| `subs/{id}` | coleção | Substituições do jogo atual |
| `regs/{id}` | coleção | Ações registadas no Pós-jogo |
| `historico/{id}` | coleção | Jogos arquivados |
| `lances/{id}` | coleção | Lances de bolas paradas editados (os de origem estão em `src/data/lances-base.json`) |
| `modelo/{id}` | coleção | Quadros do Modelo de Jogo |

## Quadro do Modelo de Jogo (`modelo/{id}`)
```
{ id, nome, mom: "of"|"def"|"tda"|"tad", sub, ordem, sis, sisAdv,
  vel (s de movimento), pausa (s em cada passo), rot: "pos"|"num", nomes, auto,
  pecas: [{ id, eq: "nos"|"adv"|"bola", pos, n }],
  passos: [{ id, nota, pos: { [pecaId]: {x,y} }, setas: [{id,t,x1,y1,x2,y2}], zonas: [{id,x,y,w,h,cor}] }] }
```
Coordenadas em metros num campo de 105×68; a equipa SCA ataca da esquerda para a direita.
