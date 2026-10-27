# Modelo de dados (base de dados partilhada da app)

Tudo é gravado por registo e passa pela fila `pendentes` (funciona sem rede).

| Caminho | Tipo | Conteúdo |
|---|---|---|
| `estado/atual` | documento | Plantel (nº, nome, posição para o campo do plantel das UT escalão `esc` para os jovens da formação: Sub19/Sub17/Sub15, sem `esc` = sénior; e `alc` com as alcunhas separadas por vírgulas, para ler grupos escritos em texto), linhas de troca do banco, fase, equipa técnica |
| `jogo/atual` | documento | Jogo em curso (adversário, data, competição, onze, suplentes, relógio, vídeo; `adv` = onze, sistema, cores e suplentes do adversário; `encaixe` = sítios das bolinhas no quadro Encaixe) — sem eventos, subs nem subsAdv |
| `jogo/vivo` | documento | Contadores do Ao vivo por parte, posse |
| `jogo/notas` | documento | Notas do jogo |
| `analise/atual` | documento | Estado do Pós-jogo (posse, sentido de ataque) — sem registos |
| `analise/config` | documento | Ações configuradas do Pós-jogo |
| `tv/config` | documento | Escolha, ordem e tempo da TV das bolas paradas (`sel`, `ordem`, `seg`, `junta`) e, em `modelo`, os da TV do Modelo de Jogo (`sel`, `ordem`, `seg`, `conhecidos`) |
| `eventos/{id}` | coleção | Golos, cartões, cantos… do jogo atual (nos do adversário — `golo_adv`, `amarelo_adv`, `vermelho_adv` — `na` = número e `pa` = id do jogador no plantel do adversário) |
| `subs/{id}` | coleção | Substituições do jogo atual |
| `subsAdv/{id}` | coleção | Substituições do adversário no jogo atual (não mexem nos quadros de bolas paradas) |
| `adversarios/{id}` | coleção | Plantel de cada equipa adversária (id = nome sem acentos, ex.: `sc-barreiro`), para todos os jogos contra ela (ver abaixo) |
| `regs/{id}` | coleção | Ações registadas no Pós-jogo |
| `historico/{id}` | coleção | Jogos arquivados |
| `lances/{id}` | coleção | Lances de bolas paradas editados (os de origem estão em `src/data/lances-base.json`) |
| `modelo/{id}` | coleção | Quadros do Modelo de Jogo |
| `exercicios/{id}` | coleção | Repositório de exercícios para as UT (ver abaixo) |
| `uts/{id}` | coleção | Unidades de Treino (ver abaixo) |
| `semanas/{id}` | coleção | Planos semanais (id = segunda-feira da semana; ver abaixo) |
| `calendario/{id}` | coleção | Jogos da época, oficiais e jogos-treino (ver abaixo) |
| `anual/{AAAA-MM-DD}` | coleção | Planeamento anual: um documento por dia com conteúdo (ver abaixo) |
| `ciclos/{id}` | coleção | Microciclos e mesociclos do planeamento anual (ver abaixo) |

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
  momento (categoria): "prep"|"fund"|"princ"|"of"|"def"|"tda"|"tad"|"fin"|"esq"|""   // Preparação do Jogador, Fundamentos do Jogo, Princípios do Jogo, Organização Ofensiva/Defensiva, Transição Ofensiva/Defensiva, Finalização, Esquemas Táticos
  sub: na Preparação do Jogador "ativ"|"cap" (Ativação e preparação / Capacidades motoras); em of/def/tda/tad a subfase do Modelo de Jogo (constr, criac, final, pressao, bmedio, bbaixo, contra, seg, reacao, reorg)
  tipo (formato do exercício): "analitico"|"circuito"|"rondo"|"mpb"|"posicional"|"vagas"|"setorial"|"intersetorial"|"reduzido"|"condicionado"|"formal"|"competicao"|""
  formato (estrutura, texto: "8+2×4+GR"), espaco: { txt },
  duracao: { series, pratica, pausa, total },   // segundos; total null = conta (séries × prática + pausas)
  objetivos, comportamentos: [], condicionantes: [], descricao, variantes: [], material: [],
  ligacoes: { modelo: [ids], lances: [ids] },
  figura?: { quadro?: { …mesmo formato de um quadro do Modelo de Jogo, sem id/nome… },
             imagem?: { id, w, h },          // id do ficheiro no armazenamento do link (assets); mostrada em "/_blob/"+id
             usa: "quadro"|"imagem" },        // qual das duas aparece na ficha e no PDF
  criadoPor, criadoEm, alteradoPor, alteradoEm }   // ids de utilizador; o nome vem sempre na hora
```
Categorias e formatos do caderno de exercícios do clube (v89). A classificação antiga passa sozinha ao ler (`migraCatEx`): ativação → Preparação › Ativação e preparação; físico → Preparação › Capacidades motoras; bola parada → Esquemas Táticos; finalização → Finalização; estratégico → Jogo Condicionado; rondo, MPB e jogo reduzido ficam; as subfases do Modelo de Jogo mantêm-se nas 4 categorias dele.

A figura é desenhada com o editor do Modelo de Jogo (id interno `fx:<id do exercício>`) e gravada dentro do exercício; não entra na lista do Modelo de Jogo.
As imagens ficam no armazenamento de ficheiros do link (capacidade `assets`), não na base de dados (cada registo aceita no máximo 256 KB). A cópia de segurança guarda só o id da imagem. Tirar a imagem de um exercício não apaga o ficheiro (permite Desfazer e cópias duplicadas continuam a funcionar).

## Unidade de Treino (`uts/{id}`)
```
{ id, numero, data: "AAAA-MM-DD", matchDay: "MD-3"…, regime, objetivos: [], material: [] (extra; o dos exercícios junta-se sozinho),
  tempoTotal (s; null = soma dos exercícios), staff (rodapé; por defeito a equipa técnica do separador Jogo),
  presencas: { [nº ou "e:<id>"]: "P"|"L"|"A"|"C"|"CO" },
  extras: [{ id, nome, escalao: "Sub19"…, pos, alc? }],   // alc = alcunhas separadas por vírgulas                 // jogadores de fora do plantel chamados a esta UT
  grupos: [{ id, nome, jogadores: [nº], nota }],   // só entra quem tem presença P ou CO (v90); outra marcação tira-o dos grupos
  exercicios: [{ id, exId, copia: { …exercício completo como estava no dia, com os ajustes desta UT… } }],   // pela ordem da UT
  criadoPor, criadoEm, alteradoPor, alteradoEm }
```
A UT guarda cópias: mudar um exercício no repositório não muda UTs antigas. A cópia guarda o `alteradoEm` que o exercício tinha quando entrou na UT; só quando o repositório tem uma alteração mais recente (e o conteúdo é diferente) a UT avisa e oferece "↻ Atualizar". Os ajustes do dia não contam. Ao atualizar, por defeito ficam os campos do dia (`parte`, `espaco`, `duracao`, `variantes`); "Substituir tudo" traz a cópia inteira.

## Plano semanal (`semanas/{id}`)
```
{ id = inicio: "AAAA-MM-DD" (segunda-feira), numero (nº da semana no plano), obs,
  dias: { "AAAA-MM-DD": { folga (dia todo), manha: [atividade], tarde: [atividade], jogo: { conc, local, txt } } },   // os 7 dias; jogo = concentração/texto do dia de jogo
  criadoPor, criadoEm, alteradoPor, alteradoEm }
atividade = { tipo: "treino"|"viagem"|"ginasio"|"folga"|"outro", txt, conc, ini, fim (horas "19:30"), local, treino (nº = nº da UT) }
// as semanas antigas tinham uma atividade (objeto) por período: normSemana converte para lista
```
O jogo não se grava na semana: vem do calendário pela data (de manhã se for antes das 13h).

## Jogo do calendário (`calendario/{id}`)
```
{ id, data: "AAAA-MM-DD", hora: "15:00", adversario, casa: true|false, competicao, jornada, local, nota,
  deslocacao: true|false (jogo fora da ilha), destino (ex.: "S. Miguel"),
  emblema?: { id, w, h },        // imagem no armazenamento do link (assets)
  criadoPor, criadoEm, alteradoPor, alteradoEm }
```

## Planeamento anual (`anual/{AAAA-MM-DD}` e `ciclos/{id}`)
```
anual: { id = dia, tipo: "ut"|"folga"|"pausa"|"outro", ut (nº da UT), txt, alteradoPor, alteradoEm }   // dia sem documento = livre; jogos vêm do calendário
ciclos: { id, tipo: "micro"|"meso", n, inicio, fim, periodo: "prep"|"comp"|"trans", alteradoPor, alteradoEm }
        // micro: id "micro-<segunda>", semana de segunda a domingo; o nº é o nº do plano semanal
```
A semana nova do plano semanal usa o anual: UT nº → treino (de manhã na véspera de jogo de dia, senão à noite), folga ou interrupção → folga, outro → atividade com o texto. A UT nova vai buscar o nº ao anual e o Match Day ao calendário.

## Adversário (`adversarios/{id}` e `jogo/atual.adv`)
```
adversarios/{id}: { id, nome, plantel: [{ id, n, nome, pos }],     // pos = sigla (DC, MC, PL…)
  sistema (habitual), cores: { cam, cam2, num, gr },
  onzeProv, onzeAlt: { sis, pos: { [código]: idJogador } } | null,   // como na SCA Observação (Fase 2)
  origem: "manual"|"observacao", versaoImportada (texto: de onde e quando), importadoEm? }   // importado do ficheiro da SCA Observação (v85)
jogo.adv: { equipa (id em adversarios), sistema, cores, onze: [{ slot, n, pid?, pos, x, y }] (11), suplentes: [id do jogador (ou nº, nos antigos)] }
                                                                    // pid = id do jogador no plantel: dois jogadores podem ter o mesmo número
jogo.subsAdv: [{ id, sai, entra, pidSai?, pidEntra?, min, c }]       // gravadas uma a uma em subsAdv/{id}
jogo.encaixe: { nos: { [slot]: {x,y} }, adv: { [slot]: {x,y} } }    // só o quadro Encaixe; o Onze não muda
```
O adversário ataca para a esquerda (guarda-redes do lado direito), no mesmo campo do Onze. O quadro «Possíveis Encaixes» (id `encaixe`) mostra o nosso onze e o do adversário com as substituições e os cartões das duas equipas marcados no Ao vivo (bolinha verde = entrou; cartão amarelo; vermelho ou 2.º amarelo = bolinha esbatida), o número na bolinha e o nome só nos do adversário; por baixo, os suplentes do adversário ainda por entrar e as substituições; entra no PDF e na TV. Ao arquivar, o jogo do histórico guarda `adv` (com nomes e `subs`) e `encaixe`; o jogo seguinte começa sem onze nem substituições do adversário (os planteis ficam).
