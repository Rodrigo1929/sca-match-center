// Modelo de Jogo 2026/27 (versão final de 31/10/2026, validação do treinador principal pendente) em dados para a SCA Performance.
// Gera docs/modelo-2627.json: { principios: {código: {...}}, modeloTxt: {chave: {...}} }. Carrega-se uma vez na base de dados do link;
// depois o modelo edita-se na app (separador Modelo de Jogo). Uso: node tools/modelo-2627.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const P = {};
let ordem = 0;
const add = (cod, nivel, mom, pai, nome, o = {}) => { P[cod] = { cod, nivel, mom, pai, nome, comp: o.comp || "", ind: o.ind || "", txt: o.txt || "", estado: o.estado || "vigor", ordem: ++ordem }; };
const princ = (cod, mom, nome, comp, ind, micros, o = {}) => { add(cod, "princ", mom, "", nome, { comp, ind, ...o }); micros.forEach(([n, nm, txt, est]) => add(`${cod}.${n}`, "micro", mom, cod, nm, { txt, estado: est })); };

// ---------- transversais ----------
add("TR-1", "tr", "tr", "", "Posse com propósito", { txt: "Progredir para finalizar ou preparar uma nova progressão.", comp: "Circular em segurança para «viajar» com bola · paciência e continuidade" });
add("TR-1.1", "micro", "tr", "TR-1", "Paciência e continuidade", { txt: "Não precipitar. Nunca abdicar da nossa forma de jogar, mesmo quando o jogo corre mal." });
add("TR-2", "tr", "tr", "", "Dentro e fora", { txt: "Atrair num corredor para encontrar espaço no corredor contrário ou por dentro.", comp: "Atrair de um lado, sair da pressão, aproveitar o lado contrário" });
add("TR-3", "tr", "tr", "", "Terceiro homem", { txt: "Utilizar um apoio para encontrar um colega orientado de frente.", comp: "Terceiro e quarto homem" });
add("TR-4", "tr", "tr", "", "Apoio e rutura", { txt: "Garantir uma solução próxima enquanto outro jogador ameaça a profundidade.", comp: "Rutura da 2.ª linha · apoio da 3.ª linha · referências de transição" });
add("TR-5", "tr", "tr", "", "Equilíbrio", { txt: "Atacar com coberturas e controlo das ameaças adversárias.", comp: "Ver OO-5 Equilíbrio ofensivo" });
add("TR-6", "tr", "tr", "", "Decisão coletiva", { txt: "Acelerar com vantagem. Proteger e reorganizar quando a ação fecha.", comp: "Ritmo de jogo · temporização · acelerar ou estabilizar · pressionar ou reorganizar" });
add("TR-6.1", "micro", "tr", "TR-6", "Temporização ofensiva", { txt: "O portador dá tempo para os colegas ocuparem os espaços: condução horizontal ou passes curtos sem intenção de progredir." });
add("TR-6.2", "micro", "tr", "TR-6", "Ritmo de jogo", { txt: "Passes tensos, poucos toques, dominar com a perna afastada; saber quando «congelar» o jogo." });

// ---------- organização ofensiva ----------
princ("OO-1", "oo", "Superioridade e segurança", "GR e 1.ª linha oferecem soluções. O portador conduz quando tem espaço e atrai antes de soltar.", "Encontramos um jogador de frente além da primeira pressão.", [
  [1, "Atrair antes de soltar", "A condução funciona como íman à pressão e transforma um 1×1 num 2×1."],
  [2, "Apoios constantes / ajustar", "Uma rede de soluções: 1–2 apoios laterais, 2 de progressão, apoios para a profundidade e 1–2 passes de segurança atrás da bola."],
  [3, "Construção apoiada: jogadores de outra linha", "Médio que baixa na 1.ª fase; ala ou lateral que entra por fora na entrada no espaço."],
  [4, "Posse segura", "Circular em zonas de superioridade; não orientar a bola para onde estamos em desvantagem."],
  [5, "Projeção da 1.ª linha", "Central que entra em condução na zona média; projeção do lado para criar superioridade no corredor."],
  [6, "Distância de relação", "Nem acumulados na mesma zona, nem desligados: «degraus» em alturas diferentes."]]);
princ("OO-2", "oo", "Dentro e fora", "Jogamos por dentro para libertar fora ou fixamos no corredor para voltar ao espaço interior.", "A mudança de corredor encontra um jogador com tempo ou vantagem.", [
  [1, "Fixar num corredor para mudar", "Atrair de um lado, sair da pressão e aproveitar o lado contrário."],
  [2, "Largura e profundidade (campo grande)", "Campo largo e comprido: se pressionam alto exploramos a profundidade; se baixam, posse segura."]]);
princ("OO-3", "oo", "Terceiro homem", "Um apoio liga a bola a um colega orientado de frente.", "Superamos uma linha sem perder ligação entre setores.", [
  [1, "Terceiro e quarto homem", "O 3.º homem chega ao homem livre libertado pelo salto de pressão; o 4.º ataca logo as costas com a bola descoberta."],
  [2, "Criar o homem livre (1×0)", "Há sempre alguém com tempo e espaço; conduzir e fixar, com e sem bola, para o encontrar."],
  [3, "Circulação rápida da bola", "A bola chega ao homem livre antes de o adversário fechar o espaço."],
  [4, "Ângulos em alturas diferentes", "Jogadores à frente e nas costas das linhas adversárias."],
  [5, "Receber orientado para a frente", "Receção orientada, com o pé mais afastado."]]);
princ("OO-4", "oo", "Apoio e rutura", "Um jogador aproxima. Outro ameaça as costas da linha adversária.", "O portador tem ao mesmo tempo apoio e profundidade.", [
  [1, "Rutura da 2.ª linha", "Médios ou laterais em rutura para aproveitar a profundidade."],
  [2, "Apoio da 3.ª linha", "Avançados que vêm entrelinhas para receber ou libertar para quem ataca o espaço."],
  [3, "Atacar a profundidade depois da combinação", "Depois da «parede» (forward run), 1–2 soluções a atacar o espaço."],
  [4, "Contramovimentos individuais e coletivos", "Falso movimento e mudança brusca: vir ao pé para atacar o espaço criado."],
  [5, "Ameaçar as costas da linha adversária", "Um jogador ameaça as costas da última linha para dar profundidade ao portador."]]);
princ("OO-5", "oo", "Equilíbrio ofensivo", "Centrais, médios e lado contrário ajustam coberturas enquanto atacamos.", "Após a perda, pressionamos a bola ou controlamos logo a profundidade.", [
  [1, "Coberturas atrás da linha da bola", "Os passes de segurança atrás da bola são também a 1.ª cobertura depois da perda."],
  [2, "Distâncias para pressionar nos 5 s", "As distâncias curtas do ataque («viajar com bola») permitem a pressão imediata."]]);
add("OO-R1", "rot", "oo", "", "Posicionamentos padrão na construção", { txt: "A desenhar em quadro animado.", estado: "construcao" });
add("OO-R2", "rot", "oo", "", "Circulação padrão", { txt: "A desenhar em quadro animado.", estado: "construcao" });
add("OO-R3", "rot", "oo", "", "Combinações padrão na criação", { txt: "A desenhar em quadro animado.", estado: "construcao" });
add("OO-R4", "rot", "oo", "", "Zonas-chave de finalização", { txt: "1.º poste, 2.º poste, penalty e entrada da área. Mais importante do que estar é chegar." });

// ---------- transição defensiva ----------
princ("TD-1", "td", "Reação imediata", "O mais próximo pressiona a bola. Os apoios aproximam e fecham as primeiras saídas.", "O adversário não executa o 1.º passe limpo para a frente.", [
  [1, "Cobrir a bola", "Pressão rápida sobre o portador: sem tempo para pensar nem para o passe longo. Janela: recuperar nos primeiros 5 segundos."]]);
princ("TD-2", "td", "Proteger o centro", "Fechamos primeiro a ligação interior e o passe vertical para o avançado.", "A saída adversária acontece para fora ou para trás.", [
  [1, "Fechar as linhas de passe circundantes", "Os mais próximos fecham as linhas de passe à volta do centro do jogo, para o adversário não sair da pressão."]]);
princ("TD-3", "td", "Pressão com cobertura", "A equipa encurta quando há proximidade, acesso à bola e proteção das costas.", "2.º e 3.º defensores chegam ligados ao 1.º.", [
  [1, "Subir a linha e abafar", "A linha defensiva sobe e compacta o bloco ao máximo."]]);
princ("TD-4", "td", "Temporizar e agrupar", "Sem acesso, atrasamos a progressão e recuperamos posições pelo corredor central.", "Reorganizamos o bloco antes da entrada no último terço.", [
  [1, "Temporizar", "Atrasar a condução e o passe vertical."],
  [2, "Recuperar posições pelo lado da baliza", "Voltar por dentro, entre a bola e a baliza."],
  [3, "Agrupar e voltar a orientar para fora", "Juntar a equipa e voltar a empurrar o jogo para o corredor lateral."],
  [4, "Baixar a linha defensiva", "Sem condições para pressionar: baixar no terreno e aplicar os princípios da organização defensiva."]]);
princ("TD-5", "td", "Controlar a profundidade", "Linha defensiva e GR ajustam a altura à pressão sobre a bola.", "O adversário não encontra rutura sem oposição nas nossas costas.", [], { txt: "Usa OD-5.3 (baixar com a bola descoberta) e OD-5.5 (GR controla a profundidade)." });

// ---------- organização defensiva ----------
princ("OD-1", "od", "Fechar o centro", "1.ª linha condiciona por fora. Médios protegem as ligações ao 6, 8 e 10 adversários.", "Reduzimos receções adversárias entre linhas e de frente.", [
  [1, "Distâncias curtas entre setores", "Compactação vertical: sem espaço entrelinhas."],
  [2, "Fechar dentro", "Compactação horizontal: fechar as zonas interiores e mais próximas da baliza."],
  [3, "Negar receções entre linhas", "Linhas definidas conforme o momento, a bola e a estratégia; mudar de forma para surpreender."],
  [4, "Relação eficiente na linha", "Intralinha: nem afastados demais, nem tão juntos que deixem o lado contrário vazio."],
  [5, "Negar as ligações interiores", "Fechar linhas de passe: limitar as opções do portador e o avanço da bola."]]);
princ("OD-2", "od", "Encaminhar para fora", "A aproximação conduz o portador ao corredor lateral e ao pé menos forte.", "A circulação entra no corredor sem ligação interior limpa.", [
  [1, "1.º defesa encaminha para a zona de pressão", "A trajetória do 1.º defesa depende de onde queremos começar a pressionar."],
  [2, "Atacar o portador e cobrir a bola", "Pressão constante nas zonas definidas; a bola coberta permite subir o bloco."],
  [3, "Temporizar", "Sem condições para recuperar: atrasar o avanço e obrigar a jogar para trás."]]);
princ("OD-3", "od", "Gatilhos de pressão", "Passe lateral ou atrasado, mau domínio, receção fechada e bola junto à linha ativam o salto.", "Pressionamos com cobertura e forçamos erro, passe longo ou recuo.", [
  [1, "Gatilhos", "Reativos: má receção, receção de costas, bola no ar, passe lateral ou atrasado, bola junto à linha. Proativos: zonas de pressão."],
  [2, "Zonas de pressão (armadilhas)", "Levar o adversário para onde estamos em superioridade. 1.ª zona: deixar sair curto por um lado definido, por jogo."],
  [3, "Referências individuais", "O jogador adversário que ativa a pressão, definido no plano de jogo."],
  [4, "Subir em passes para trás", "Passe para trás ou adversário de costas: o bloco sobe e aperta."]]);
princ("OD-4", "od", "Bascular em corrente", "A equipa desloca-se como uma unidade. As referências passam de jogador para jogador.", "Mantemos distâncias curtas sem abrir o lado contrário cedo demais.", [
  [1, "Basculação", "A posição de cada um depende da bola (primeiro), do colega, do espaço e do adversário."],
  [2, "Coberturas em zonas contíguas", "Quem pressiona sabe que tem ajuda e pode ser mais agressivo."],
  [3, "Vigilâncias sem bola", "Controlar o adversário direto sem bola, que pode ser o próximo portador."]]);
princ("OD-5", "od", "Controlar a profundidade", "Linha defensiva e GR ajustam à pressão na bola e às ameaças nas costas.", "Negamos ruturas e remates limpos nas zonas centrais.", [
  [1, "Pressão sobre o portador", "Sem bola em boas condições para as nossas costas."],
  [2, "Alinhamento defensivo", "Linha alinhada, fora de jogo; o central do lado da bola dita a altura."],
  [3, "Baixar com a bola descoberta", "Bola descoberta: a linha baixa e cobre o espaço."],
  [4, "Orientação dos apoios", "Bola coberta: apoios para a frente. Descoberta: apoios de lado, prontos a correr para trás."],
  [5, "GR controla a profundidade", "GR «fora dos postes», cobre as costas do bloco e comunica."]]);

// ---------- transição ofensiva ----------
princ("TO-1", "to", "Primeiro olhar para a frente", "O recuperador identifica espaço, pressão e colegas antes do 1.º toque.", "O 1.º passe ou condução conserva ou aumenta a vantagem.", [
  [1, "Olhar o mais longe possível", "Ao recuperar, olhar o mais longe possível; a janela dura poucos segundos."]]);
princ("TO-2", "to", "Apoio e rutura", "Um jogador oferece apoio frontal. Outros atacam as costas e os corredores livres.", "O portador tem uma solução próxima e uma de profundidade.", [
  [1, "Referências de transição", "Avançados: profundidade ou apoio «ao pé». Laterais e alas: saída de pressão pelos corredores."]]);
princ("TO-3", "to", "Largura e profundidade", "Alas, extremos e avançados afastam referências e abrem linhas de progressão.", "A defesa adversária tem de proteger centro e largura.", [
  [1, "Mobilidade", "Afastar-se do portador oferecendo linhas de passe efetivas e variadas."]]);
princ("TO-4", "to", "Acelerar com vantagem", "Progredimos na vertical quando o portador está de frente e há espaço útil.", "Chegamos ao último terço antes da reorganização adversária.", [
  [1, "Explorar a desorganização adversária", "Aproveitar os espaços livres antes de o adversário se reorganizar."]]);
princ("TO-5", "to", "Estabilizar sem vantagem", "Protegemos a bola, ligamos num apoio seguro e recuperamos a estrutura.", "Mantemos a posse sem forçar uma ação de risco elevado.", [
  [1, "Apoios por trás do portador", "Cobertura ofensiva que garante uma zona de posse."],
  [2, "Apoios laterais", "Largura para começar a organização ofensiva já em campo grande."]]);

// ---------- textos (um documento por secção) ----------
const T = {
  identidade: {
    lema: "TODOS ATACAM. TODOS DEFENDEM.",
    frase: "Princípios claros. Comportamentos observáveis. Estruturas adaptáveis.",
    valores: [
      { nome: "Espírito de equipa", sig: "O coletivo acima da ação individual.", comps: ["Comunicar para orientar, corrigir e ajudar", "Reagir ao erro do colega com apoio e ação", "Cumprir a função em benefício do coletivo", "Manter o compromisso quando o jogo é adverso"], evid: "A equipa permanece ligada e competitiva em todos os momentos." },
      { nome: "Intensidade", sig: "Pensar rápido e agir com intenção.", comps: ["Entrar em cada ação preparado para decidir", "Acelerar quando existe vantagem", "Encurtar distâncias e pressionar com cobertura", "Reagir logo à perda, ao erro e à 2.ª bola"], evid: "A equipa chega junta às ações e repete esforços sem perder organização." },
      { nome: "Organização", sig: "Conhecer funções, referências e ajustamentos.", comps: ["Ocupar racionalmente os espaços", "Manter distâncias curtas entre jogadores e setores", "Passar referências e comunicar os ajustamentos", "Reconhecer quando pressionar, temporizar ou mudar o centro do jogo"], evid: "A equipa move-se como uma unidade e mantém equilíbrio com e sem bola." },
      { nome: "Objetividade", sig: "Progredir com critério e chegar à baliza.", comps: ["Receber e conduzir orientado para a frente", "Procurar passe progressivo, rutura ou finalização", "Atacar a profundidade com e sem bola", "Estabilizar a posse quando o risco supera a vantagem"], evid: "A equipa progride com critério e transforma vantagem em chegada à baliza." }],
    macros: [
      { mom: "oo", frase: "Todos preparados para serem solução", desc: "Cada jogador tem sempre uma tarefa, que muda conforme a bola, o espaço, os colegas e o adversário.", valores: "Espírito de equipa · Objetividade" },
      { mom: "od", frase: "Todos defendem", desc: "Ninguém se esconde do trabalho defensivo. O grande objetivo é recuperar a bola.", valores: "Espírito de equipa · Organização" },
      { mom: "tr", frase: "Mudança rápida de atitude", desc: "Passar logo de uma postura à outra. Nas duas transições, decidir: acelerar ou estabilizar, pressionar ou reorganizar.", valores: "Intensidade · Objetividade" }],
    gerais: ["Não permitir a inferioridade numérica", "Evitar a igualdade numérica", "Procurar criar a superioridade numérica"],
    fundOf: ["Penetração", "Cobertura ofensiva", "Mobilidade", "Espaço"],
    fundDef: ["Contenção", "Cobertura defensiva", "Equilíbrio", "Concentração"] },
  "mom-oo": { pergunta: "Como queremos construir, progredir e chegar à baliza?", frase: "Posse com propósito. Criar vantagens. Finalizar com equilíbrio.", macro: "Todos preparados para serem solução",
    intencao: "Ter posse com propósito, criar vantagens e chegar à finalização com jogadores ligados à ação.",
    po: "Circular em segurança para «viajar» com bola. Método: ataque posicional; ataque rápido e contra-ataque sempre que possível sem perder o controlo.",
    fases: [
      { nome: "1.ª Construção", obj: "Sair sob controlo e encontrar condições para progredir.", comp: "Usar o GR, atrair a 1.ª pressão, conduzir para fixar, curto ou longo preparado para a 2.ª bola.", rot: "OO-R1" },
      { nome: "2.ª Preparação e criação", obj: "Criar o homem livre e ameaçar a última linha.", comp: "Dentro e fora, 3.º homem, apoio e rutura, fixar para mudar, acelerar quando há vantagem.", rot: "OO-R2 · OO-R3" },
      { nome: "3.ª Finalização e decisão", obj: "Ocupar zonas distintas e finalizar com vantagem.", comp: "1.º poste, zona central e 2.º poste; passe atrasado; 2.ª bola; cobertura fora da área.", rot: "OO-R4" }] },
  "mom-td": { pergunta: "Como reagimos imediatamente após perder a bola?", frase: "Recuperar se existe acesso. Travar e reorganizar quando faltam condições.", macro: "Mudança rápida de atitude",
    intencao: "Recuperar imediatamente ou impedir que o adversário explore a nossa desorganização.",
    po: "Pressionar ou temporizar e reorganizar: por preferência pressionar; se a 1.ª pressão falhar ou a equipa estiver desequilibrada, temporizar e reorganizar.",
    decisao: { pergunta: "Temos acesso à bola e cobertura das costas?",
      sim: { t: "Pressionar para recuperar", itens: ["O mais próximo condiciona o portador", "Os apoios fecham as ligações interiores", "A linha encurta com a bola pressionada", "O lado contrário fecha por dentro"], nota: "Janela: recuperar nos primeiros 5 segundos." },
      nao: { t: "Temporizar e reorganizar", itens: ["Atrasar a condução ou o passe vertical", "Proteger o corredor central", "Recuperar posições pelo lado da baliza", "Agrupar e voltar a orientar para fora"], nota: "Também quando a 1.ª pressão falha ou a equipa está desequilibrada." },
      regra: "A pressão exige acesso e cobertura. Sem ambos, a prioridade passa a ser proteger o centro." } },
  "mom-od": { pergunta: "Como protegemos a baliza e recuperamos a bola?", frase: "Fechar dentro. Orientar para fora. Pressionar em conjunto.", macro: "Todos defendem",
    intencao: "Proteger o corredor central, retirar tempo ao adversário e recuperar em zonas favoráveis.",
    po: "Reorganização pressionante: assumir coletivamente a iniciativa do jogo defensivo.",
    fases: [
      { nome: "Pressão alta", obj: "Recuperar perto da baliza adversária ou provocar uma bola longa desconfortável.", comp: "Avançado orienta para fora · lado contrário controla o 6 · linha sobe com bola pressionada · GR controla a profundidade", rot: "Subir em passes para trás ou com o adversário de costas (OD-3.4)." },
      { nome: "Bloco médio", obj: "Proteger o centro e preparar armadilhas no corredor lateral.", comp: "Negar ligações ao 6 e ao 10 · saltar no momento do passe · superioridade local · distâncias entre setores", rot: "Fechar por dentro e orientar para as zonas de pressão. Temporizar (OD-2.3)." },
      { nome: "Bloco baixo", obj: "Proteger a baliza, o passe atrasado e o 2.º poste.", comp: "Linha de 5 no 3-4-3 · condicionar o cruzamento · controlar entradas tardias · atacar a 2.ª bola", rot: "Linha de 5, com o médio-ala a baixar." }],
    regraFases: "A altura do bloco pode mudar. Fechar o centro e orientar para fora permanece.",
    atitude: "Intensidade defensiva: atitude agressiva e confiante para antecipar e coordenar. Em pressão alta, uma falha individual desequilibra a equipa." },
  "mom-to": { pergunta: "Como aproveitamos a recuperação da bola?", frase: "Primeiro olhar para a frente. Acelerar com vantagem. Estabilizar quando a progressão fecha.", macro: "Mudança rápida de atitude",
    intencao: "Explorar a desorganização adversária ou assegurar a posse para iniciar a organização ofensiva.",
    po: "Acelerar ou estabilizar: idealmente rápido, se houver hipótese de chegar a zonas de finalização.",
    decisao: { pergunta: "Transição rápida ou lenta?",
      sim: { t: "Acelerar", itens: ["Portador orientado de frente", "Espaço livre à frente da bola", "Vantagem numérica ou posicional", "Profundidade acessível"], nota: "Passe vertical, condução e ruturas coordenadas." },
      nao: { t: "Estabilizar", itens: ["Recuperador pressionado", "Poucos apoios próximos", "Corredor central bloqueado", "Risco elevado de nova perda"], nota: "Proteger, retirar da pressão e recuperar a organização." },
      regra: "Onde recuperamos (zonas de pressão, OD-3.2) define que referências de transição estão disponíveis (TO-2.1)." } },
  estruturas: { comuns: "Construção apoiada · Terceiro homem · Apoio e rutura · Fechar o centro · Pressão pós-perda",
    base: { nome: "Estrutura-base", sis: "3-4-3 / 3-4-2-1", txt: "Três centrais garantem construção e controlo. Os alas dão largura. Dois médios ligam setores. Os avançados interiores relacionam-se entre linhas com o 9." },
    alt: { nome: "Estrutura alternativa", sis: "4-3-3", txt: "Dois centrais e o 6 organizam a base. Laterais, extremos e interiores coordenam a largura e os espaços interiores. Os princípios ficam iguais." },
    ataque: [
      { ref: "Construção", base: "Três centrais dão largura útil. Os médios dividem o campo em diagonal. Ala e avançado interior ajustam ao central exterior.", alt: "Dois centrais ligam com o 6. Laterais e extremos coordenam a largura. Um interior aproxima e outro prepara a progressão." },
      { ref: "Progressão", base: "Central exterior, médio, ala e avançado interior criam ângulos em alturas diferentes.", alt: "Lateral, extremo e interior formam relações no corredor. O 6 muda o centro do jogo." },
      { ref: "Finalização", base: "O 9 e os avançados interiores ocupam a área. O ala contrário pode atacar o 2.º poste, com compensação.", alt: "9, extremos e interiores coordenam as zonas de chegada. O lateral contrário ajusta o equilíbrio." },
      { ref: "Equilíbrio", base: "Três centrais e pelo menos um médio controlam o centro e a profundidade.", alt: "Dois centrais, o 6 e o lateral contrário compensam as projeções ofensivas." }],
    defesa: [
      { ref: "Primeira linha", base: "O 9 e os avançados interiores orientam a construção e fecham as ligações centrais.", alt: "O 9 orienta o lado. O extremo do lado contrário controla o 6 adversário." },
      { ref: "Corredor lateral", base: "O ala salta. O médio aproxima por dentro. O central exterior controla as costas.", alt: "Extremo ou lateral salta conforme a altura da bola. O interior cobre por dentro." },
      { ref: "Basculação", base: "O ala contrário fecha. Centrais e médios ajustam largura e profundidade.", alt: "A equipa passa referências e desloca-se como uma corrente de um lado ao outro." },
      { ref: "Bloco médio/baixo", base: "Transformação em 5-4-1, com os alas na linha defensiva.", alt: "Organização em 4-1-4-1 ou 4-4-2, conforme o salto de um interior." }] },
  plano: { ident: ["Macroprincípios", "Princípios e microprincípios dos quatro momentos", "Linguagem comum", "Comportamentos inegociáveis"],
    adapt: ["Estrutura utilizada", "Altura do bloco", "Alvo e gatilhos de pressão (OD-3)", "Rotinas específicas para o adversário"],
    regra: "A adaptação pode alterar a forma. Não pode retirar organização, intensidade ou proteção do corredor central." },
  bp: { intro: "As bolas paradas têm metodologia própria, mas acontecem dentro dos quatro momentos do jogo. O trabalho operacional vive no Quadro da SCA Performance.",
    of: ["Executante e sinal", "Zonas de ataque", "Movimentos e bloqueios permitidos", "1.ª e 2.ª bola", "Equilíbrio contra a transição (OO-5)"],
    def: ["Responsabilidades sobre bola, zona e adversário", "Proteção das zonas de finalização", "Ataque à 1.ª bola", "Controlo da 2.ª bola", "1.ª saída após recuperação (TO-1, TO-2)"],
    prio: "Cantos defensivos · lançamentos no último terço · cruzamentos ofensivos padronizados" },
  indicadores: { frase: "Um princípio que não pode ser observado em vídeo continua demasiado abstrato para orientar o treino.",
    linhas: [
      { mom: "oo", ind: "Receções de frente além da pressão · entradas controladas no último terço · perdas com equilíbrio preparado", compl: "Cruzamentos para zonas OO-R4 ocupadas" },
      { mom: "td", ind: "1.º passe vertical impedido · recuperação ou passe para trás forçado · tempo até reorganizar o bloco", compl: "Recuperações até 5 s após a perda" },
      { mom: "od", ind: "Entradas adversárias pelo centro · recuperações no corredor lateral · remates limpos e cruzamentos concedidos", compl: "Recuperações na zona de pressão do jogo" },
      { mom: "to", ind: "1.ª ação após recuperar · entradas no último terço antes da reorganização · posse estabilizada sem perda forçada", compl: "Decisão certa: acelerou ou estabilizou" }] },
  construcao: { itens: [
    { tema: "Altura de referência do bloco", sit: "Por regra o mais subido possível, ou definida jogo a jogo no plano de jogo (20%)?", quem: "Treinador principal" },
    { tema: "Referência de marcação", sit: "Marcação zonal pressionante como referência da equipa sénior.", quem: "Treinador principal" },
    { tema: "Vigilâncias no equilíbrio ofensivo", sit: "Proposta: quem não participa no ataque controla o avançado e o jogador de transição adversários (OO-5).", quem: "Treinador principal" },
    { tema: "Indicadores fixos", sit: "Escolher 8 a 10 indicadores para medir em todos os jogos.", quem: "Equipa técnica" },
    { tema: "Rotinas padrão OO-R1 a R3", sit: "Posicionamentos na construção, circulação e combinações por desenhar.", quem: "Treinador principal + adjunto" },
    { tema: "Funções por posição", sit: "Responsabilidades em cada estrutura e momento.", quem: "Treinador principal" },
    { tema: "Exemplos por estrutura", sit: "Rever os exemplos dos microprincípios para as funções do 3-4-3 e do 4-3-3.", quem: "Treinador adjunto" }] } };

const out = { versao: "2026/27 · 31/10/2026", principios: P, modeloTxt: T };
const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
writeFileSync(join(raiz, "docs/modelo-2627.json"), JSON.stringify(out, null, 1));
const n = (k) => Object.values(P).filter((x) => x.nivel === k).length;
console.log(`docs/modelo-2627.json · ${Object.keys(P).length} registos (${n("princ")} princípios, ${n("micro")} microprincípios, ${n("tr")} transversais, ${n("rot")} rotinas) · ${Object.keys(T).length} textos`);
