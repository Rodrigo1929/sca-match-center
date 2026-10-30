# Modelo de dados (base de dados partilhada da app)

Tudo é gravado por registo e passa pela fila `pendentes` (funciona sem rede).

| Caminho | Tipo | Conteúdo |
|---|---|---|
| `estado/atual` | documento | Plantel (nº, nome, posição para o campo do plantel das UT escalão `esc` para os jovens da formação: Sub19/Sub17/Sub15, sem `esc` = sénior; e `alc` com as alcunhas separadas por vírgulas, para ler grupos escritos em texto), linhas de troca do banco, fase, equipa técnica |
| `jogo/atual` | documento | Jogo em curso (adversário, data, competição, `calId` = jogo do calendário escolhido em «📅 Do calendário» (v106), onze, suplentes, relógio, vídeo; `adv` = onze, sistema, cores e suplentes do adversário; `encaixe` = sítios das bolinhas no quadro Encaixe) — sem eventos, subs nem subsAdv |
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
| `compJogos/{id}` | coleção | Jogos da competição interna (v95): `{ut, lid, serie, a, b (ids dos grupos), grA, grB (GR de cada equipa), semGR, fim, criadoEm, criadoPor}` |
| `compGolos/{id}` | coleção | Golos da competição interna (v95): `{jogo, eq: "a"\|"b" (equipa que ganha o golo), k (quem marcou), ag (auto-golo: k é da outra equipa), em, por}` |
| `mdPadrao/{MD}` | coleção | Padrão MD da Época (v101): uma linha por dia relativo ao jogo (MD+1, MD+2, MD-6…MD-1, MD): `{regime (id em regimes), objetivo, pi, pf, pfin, nivel, folga}` |
| `regimes/{id}` | coleção | Regimes do microciclo (v101): `{nome, int (símbolo de intensidade), cor, ordem, bloco}`; os ids `folga`, `casa` e `fora` guardam só a cor dos blocos (v105; `jogo`, `md` e `estagio`, da v101, ficam sem uso) |
| `microCampo/{seg}~{campo}` | coleção | Campos do resumo do microciclo escritos ou acertados à mão (v101), um documento por campo: `{seg, campo, v, ia}` (`ia: true` = rascunho da IA por aprovar, v102; `objPrin`/`objSec` = objetivos propostos pela IA até serem aprovados); campo = `<dia>.md|regime|nivel|obj|pi|pf|pfin` ou `analise`, `perf`, `positivos`, `melhorar`. Sem documento = valor automático |
| `microResumo/{seg}` | coleção | Estado do resumo do microciclo (v101): `{estado: "rascunho"|"fechado", fechadoEm, fechadoPor, hist: [{acao: "fechar"|"reabrir", em, por}]}` |
| `relJog/{jogo}` | coleção | Relatório para jogadores (v104), um por jogo (`jogo` = id do jogo arquivado; `atual` = jogo em curso, passa para o id ao arquivar): `{msg, msgInd: {"<nº>": texto}, lances: [{rid (id da ação da análise), titulo}], exportado: [{em, por, versao, n}]}` |
| `livros/{id}` | coleção | Livros de exercícios (v103): `{nome, titulo, versao: "interna"|"fora", filtros: {parte, momento, sub ("momento.sub"), tipo, formato, espaco: [valores], comp: ""|"liga"|"champions"|"qualquer", meinho}, mais: [id], menos: [id], gerado: {em, n}}`. Guarda as escolhas, não os exercícios |
| `fotos/{chave}` | coleção | Fotos dos atletas (v100): `{img: {id, w, h}, alteradoPor, alteradoEm}`; a imagem (600×600, já recortada em quadrado) fica no armazenamento do link (`assets`), mostrada em "/_blob/"+id. `chave` = nº do plantel; jogadores de fora = "x-" + nome sem acentos (o mesmo atleta em várias UT). A foto segue o número: se o atleta mudar de número, põe-se outra vez. A cópia de segurança guarda só o id |
| `histTreino/{id}` | coleção | Histórico de antes da app, importado do Excel (v97), um documento por UT: `{tipo: "comp"\|"meinho", et, ut (nº), data, origem, linhas}`; comp: `{k, nome, gr, J, V, E, D, golos, GS}`; meinho: `{k, nome, m21, cuecas, presente}`; `k` = "n:<nº>" ou "x:<nome>". Só se lê; soma às tabelas pela data |
| `meinho/{id}` | coleção | Registos do meinho (v95): `{ut, lid, tipo: "21"\|"cueca", ks: [1 a 3 atletas], em, por}` |
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
  links: [{ t, url, pub? }],    // v93: vídeos e artigos (só http/https), pela ordem; só no repositório — nunca na UT, no PDF da UT nem no plano semanal; pub (v103) = sai no livro para fora do clube
  n,                            // v103: nº fixo do repositório (1, 2, 3… pela data de criação)
  objEsp: [texto],              // v99: objetivos específicos, um por linha (o campo «objetivos» passa a ser os objetivos gerais); não saem no PDF da UT
  contaTempo: true|false|null,  // v93: conta para a estatística de tempos; null = pela parte (só a fundamental conta)
  comp: "liga"|"champions"|"", meinho: true|false,   // v95: competição interna (a etiqueta só identifica e filtra; a classificação é a mesma) e meinho
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
  exercicios: [{ id, exId, copia: { …exercício completo como estava no dia, com os ajustes desta UT, sem links… },   // pela ordem da UT
     pai?,        // v93: complementar — id da linha do exercício principal; vem logo a seguir a ele (3.1, 3.2…) e não soma ao tempo da UT nem ao da parte
     conta?,      // v93: true|false = conta para os tempos só nesta UT; sem campo = como no repositório (contaTempo)
     comp?, meinho?,   // v95: só nesta UT ("" = anulada; sem campo = como no repositório); fica fora da cópia, por isso o «↻ Atualizar» não a perde
     grupos?,     // v93: ids dos grupos de trabalho que fazem este exercício (no principal; os complementares tiram-nos da rotação)
     rot? }],     // v93 no principal com complementares; v94 em qualquer exercício: { nEq (até 20), nJogo (equipas ao mesmo tempo / grupos por período), modo: "rodar"|"periodos", equipas: [id do grupo|""],
                  //   grelha: [série][equipa] = "p" (principal) | id da linha do complementar | "" (descanso) }
  criadoPor, criadoEm, alteradoPor, alteradoEm }
```
**Tempos (v93):** minutos de um atleta numa UT = para cada exercício que conta, séries em que a equipa (grupo) dele está nesse exercício × tempo de prática (sem pausas); sem rotação, séries × prática do exercício (só com total escrito: o total). Só contam presentes (P e CO). Num complementar, a prática por série é a dele ou, sem ela, a do principal. Minutos em conjunto (v94): dois atletas presentes no mesmo grupo, no mesmo exercício e na mesma série somam esse tempo um com o outro (`juntos` em `temposUT`, por par em `temposFiltro`). Tudo é calculado das UT na hora (`temposUT`); não se grava nada à parte. UTs antigas abrem como estavam: sem `grupos`, os exercícios que contam avisam «conta mas sem grupos». Os atletas são ligados pela chave (nº do plantel ou `e:<id>`); na vista Tempos, os de fora do plantel juntam-se pelo nome.

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
{ id, data: "AAAA-MM-DD", hora: "15:00", adversario, casa: true|false, competicao, jornada, local (campo), nota,
  localidade, ilha ("Terceira"…"Corvo", "Madeira", "Continente"),   // v106: «Campo - Localidade (Ilha X)»
  deslocacao: true|false (jogo fora da ilha), destino (ex.: "S. Miguel"),
  emblema?: { id, w, h },        // imagem no armazenamento do link (assets)
  criadoPor, criadoEm, alteradoPor, alteradoEm }
```

## Planeamento anual (`anual/{AAAA-MM-DD}` e `ciclos/{id}`)
```
anual: { id = dia, tipo: "ut"|"folga"|"pausa"|"outro", ut (nº da UT), txt, alteradoPor, alteradoEm }   // dia sem documento = livre; jogos vêm do calendário
ciclos: { id, tipo: "micro"|"meso", n, inicio, fim, periodo: "prep"|"comp"|"trans", nome (meso, v101: designação), objPrin, objSec (micro, v101: objetivos do resumo), alteradoPor, alteradoEm }
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

## Competição interna e Meinho (v95)
- Classificação calculada na hora: cada jogador presente no grupo de uma equipa num jogo **terminado** (`fim`) soma o resultado dessa equipa (3-1-0), GM/GS da equipa, os seus golos (sem auto-golos) e os seus auto-golos (AG). Jogadores com posição GR no Plantel ficam de fora desta tabela.
- Guarda-redes: o `grA`/`grB` de cada jogo terminado soma J e golos sofridos; jogo sem GR (e sem `semGR`) fica assinalado e os golos sofridos não se atribuem.
- Uma marcação anulada numa UT não apaga registos: deixam de contar e voltam se for reativada. Registos de UT apagadas ou de exercícios tirados da UT não contam.
- Meinho: cada registo vale 1 para cada atleta escolhido; «UT com meinho» = UT com exercício de meinho ativo em que o atleta esteve presente (P ou CO).
