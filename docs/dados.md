# Modelo de dados (base de dados partilhada da app)

Tudo é gravado por registo e passa pela fila `pendentes` (funciona sem rede).

| Caminho | Tipo | Conteúdo |
|---|---|---|
| `estado/atual` | documento | Plantel (nº, nome, posição para o campo do plantel das UT e escalão `esc` para os jovens da formação: Sub19/Sub17/Sub15; sem `esc` = sénior), linhas de troca do banco, fase, equipa técnica |
| `jogo/atual` | documento | Jogo em curso (adversário, data, competição, onze, suplentes, relógio, vídeo) — sem eventos nem subs |
| `jogo/vivo` | documento | Contadores do Ao vivo por parte, posse |
| `jogo/notas` | documento | Notas do jogo |
| `analise/atual` | documento | Estado do Pós-jogo (posse, sentido de ataque) — sem registos |
| `analise/config` | documento | Ações configuradas do Pós-jogo |
| `tv/config` | documento | Escolha, ordem e tempo da TV das bolas paradas (`sel`, `ordem`, `seg`, `junta`) e, em `modelo`, os da TV do Modelo de Jogo (`sel`, `ordem`, `seg`, `conhecidos`) |
| `eventos/{id}` | coleção | Golos, cartões, cantos… do jogo atual |
| `subs/{id}` | coleção | Substituições do jogo atual |
| `regs/{id}` | coleção | Ações registadas no Pós-jogo |
| `historico/{id}` | coleção | Jogos arquivados |
| `lances/{id}` | coleção | Lances de bolas paradas editados (os de origem estão em `src/data/lances-base.json`) |
| `modelo/{id}` | coleção | Quadros do Modelo de Jogo |
| `exercicios/{id}` | coleção | Repositório de exercícios para as UT (ver abaixo) |
| `uts/{id}` | coleção | Unidades de Treino (ver abaixo) |

## Quadro do Modelo de Jogo (`modelo/{id}`)
```
{ id, nome, mom: "of"|"def"|"tda"|"tad", sub, ordem, sis ("onze" ou "4-3-3"…), sisAdv,
  vel (s de movimento), pausa (s em cada passo), rot: "num"|"pos"|"nada" (texto nas bolinhas), nomes, auto,
  vista: "inteiro"|"meio"|"meiodef"|"duplaarea"|"livre", vw, vh (m, só no espaço livre),
  pecas: [{ id, eq: "nos"|"adv"|"neutro"|"bola"|"cone"|"minib"|"baliza", pos, n, slot?, cor?, ang? }],
         // slot = lugar no onze do jogo (o número vem daí); cor = colete ou cor do cone; ang = para onde abre a baliza (0/90/180/270)
  trocas: [{ id, sai, entra }],                             // trocas só deste quadro, aplicadas por ordem
  passos: [{ id, nota, pos: { [pecaId]: {x,y} }, setas: [{id,t,x1,y1,x2,y2}], zonas: [{id,x,y,w,h,cor}] }] }
```
Coordenadas em metros num campo de 105×68; a equipa SCA ataca da esquerda para a direita.

## Exercício (`exercicios/{id}`)
```
{ id, nome, parte: "inicial"|"fundamental"|"final",
  momento: "of"|"def"|"tda"|"tad"|"bpof"|"bpdef"|"", sub (subfase do Modelo de Jogo, só nos 4 momentos),
  tipo: "ativacao"|"rondo"|"mpb"|"reduzido"|"estrategico"|"bolaparada"|"finalizacao"|"fisico"|"gr"|"",
  formato, espaco: { txt },
  duracao: { series, pratica, pausa, total },   // segundos; total null = conta (séries × prática + pausas)
  objetivos, comportamentos: [], condicionantes: [], descricao, variantes: [], material: [],
  ligacoes: { modelo: [ids], lances: [ids] },
  figura?: { quadro?: { …mesmo formato de um quadro do Modelo de Jogo, sem id/nome… },
             imagem?: { id, w, h },          // id do ficheiro no armazenamento do link (assets); mostrada em "/_blob/"+id
             usa: "quadro"|"imagem" },        // qual das duas aparece na ficha e no PDF
  criadoPor, criadoEm, alteradoPor, alteradoEm }   // ids de utilizador; o nome vem sempre na hora
```
A figura é desenhada com o editor do Modelo de Jogo (id interno `fx:<id do exercício>`) e gravada dentro do exercício; não entra na lista do Modelo de Jogo.
As imagens ficam no armazenamento de ficheiros do link (capacidade `assets`), não na base de dados (cada registo aceita no máximo 256 KB). A cópia de segurança guarda só o id da imagem. Tirar a imagem de um exercício não apaga o ficheiro (permite Desfazer e cópias duplicadas continuam a funcionar).

## Unidade de Treino (`uts/{id}`)
```
{ id, numero, data: "AAAA-MM-DD", matchDay: "MD-3"…, regime, objetivos: [], material: [] (extra; o dos exercícios junta-se sozinho),
  tempoTotal (s; null = soma dos exercícios), staff (rodapé; por defeito a equipa técnica do separador Jogo),
  presencas: { [nº ou "e:<id>"]: "P"|"L"|"A"|"C"|"CO" },
  extras: [{ id, nome, escalao: "Sub19"…, pos }],                 // jogadores de fora do plantel chamados a esta UT
  grupos: [{ id, nome, jogadores: [nº], nota }],
  exercicios: [{ id, exId, copia: { …exercício completo como estava no dia, com os ajustes desta UT… } }],   // pela ordem da UT
  criadoPor, criadoEm, alteradoPor, alteradoEm }
```
A UT guarda cópias: mudar um exercício no repositório não muda UTs antigas; a UT avisa e oferece "↻ Atualizar".
