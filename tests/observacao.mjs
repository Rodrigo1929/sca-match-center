// Teste de fumo da app de observação (sem base de dados: corre em modo "só neste aparelho").
// Uso: npm run test:obs          → Chromium, PC e telemóvel
//      npm run test:obs -- --ipad → WebKit (motor do Safari) com ecrã e toque de iPad (npx playwright install webkit)
// Falha se houver erros de JavaScript ou se os dados não ficarem como esperado; capturas em tests/capturas/observacao/
import { chromium, webkit, devices } from "playwright";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ipad = process.argv.includes("--ipad");
const cap = join(raiz, "tests/capturas/observacao"); mkdirSync(cap, { recursive: true });
const url = pathToFileURL(join(raiz, "dist/observacao.html")).href;
const browser = ipad ? await webkit.launch() : await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const falhas = [];
const confirma = (ok, msg) => { if (!ok) falhas.push(msg); };

const ecras = ipad ? [["ipad", { ...devices["iPad (gen 7) landscape"] }]] : [["pc", { viewport: { width: 1366, height: 900 } }], ["telemovel", { viewport: { width: 390, height: 844 }, hasTouch: true }]];
for (const [nome, opc] of ecras) {
  const pg = await (await browser.newContext(opc)).newPage();
  pg.on("pageerror", (e) => falhas.push(`${nome}: ${e}`)); pg.on("console", (m) => { if (m.type() === "error") console.log("CONSOLA", nome, m.text()); });
  await pg.goto(url); await pg.waitForTimeout(500);

  // relatório antigo (guião em texto, posições numeradas) guardado no aparelho: tem de abrir e passar para o formato atual
  await pg.evaluate(() => { localStorage.clear();
    localStorage.setItem("sca-obs-cache-v1", JSON.stringify({ rels: { r0: { id: "r0", autor: "local", adversario: "Madalena", resp: { com1: "Saem curto" }, evid: [{ id: "e0", q: "com3", txt: "Bola longa", min: "12:00", freq: "rec" }], plantel: [{ id: "a", nome: "X", slot: "2", conf: true }] } }, revs: {} }));
    localStorage.setItem("sca-obs-vista", JSON.stringify({ tipo: "rel", id: "r0", sec: "plantel" })); });
  await pg.reload(); await pg.waitForTimeout(400);
  const antigo = await pg.evaluate(() => { const R = rels.r0; return R ? { nota: R.chk.c_pb && R.chk.c_pb.nota, ev: R.evid[0].q, slot: R.plantel[0].slot, ecra: !!document.querySelector("#pl-sis") } : null; });
  confirma(antigo && antigo.nota === "Saem curto" && antigo.ev === "c_1l" && antigo.slot === "LD" && antigo.ecra, `${nome}: relatório antigo não passou bem (${JSON.stringify(antigo)})`);

  // novo relatório a partir da lista do campeonato: plantel do zerozero e cores conhecidas
  await pg.evaluate(() => { vista = { tipo: "lista", id: null, sec: "ficha" }; render(); });
  // plantel base: mexer no plantel sem começar o relatório; o relatório novo parte dele
  await pg.click('[data-base="lusitania"]'); await pg.waitForSelector("#pl-svg svg");
  await pg.fill('#sec [data-b="treinador"]', "Treinador Base"); await pg.waitForTimeout(150);
  const base = await pg.evaluate(() => ({ n: bases.lusitania && bases.lusitania.plantel.length, tr: bases.lusitania && bases.lusitania.treinador, rels: Object.values(rels).filter((x) => x.adversario === "Lusitânia").length, cache: !!(JSON.parse(localStorage.getItem("sca-obs-base-v1") || "{}").lusitania) }));
  confirma(base.n > 15 && base.tr === "Treinador Base" && base.rels === 0 && base.cache, `${nome}: plantel base não ficou guardado ou criou relatório (${JSON.stringify(base)})`);
  // exportar para a SCA Performance: plantel base + onze provável do último relatório (um jogador que só está no relatório entra no plantel)
  const mc = await pg.evaluate(() => { const B = bases.lusitania, pl = B.plantel, R = novoRel("Lusitânia"); R.id = "rmc";
    R.plantel = [...R.plantel, { id: "jnovo", n: "99", nome: "Jogador Novo", slot: "PL" }]; R.onzes.prov = { sis: "4-3-3", pos: { GR: pl[0].id, PL: "jnovo" } }; rels.rmc = R;
    const P = plantelParaMC(B); delete rels.rmc;
    return { botao: !!document.getElementById("b-mc"), n: P.plantel.length, base: pl.length, gr: P.onzeProv && P.onzeProv.pos.GR === pl[0].id, pl: P.onzeProv && P.onzeProv.pos.PL, sis: P.onzeProv && P.onzeProv.sis, novo: P.plantel.some((j) => j.id === "jnovo" && j.n === "99" && j.pos === "PL"), tipo: P.tipo, eq: P.equipa.id, cores: !!P.cores.cam }; });
  // penáltis nas bolas paradas (ofensivas e defensivas): bola na marca dos 11 m e o guarda-redes na baliza
  const pen = await pg.evaluate(() => { const o = novaBp("pen", "of"), d = novaBp("pen", "def"), bola = o.pecas.find((p) => p.eq === "bola"); return { nomeO: nomeBp(o), nomeD: nomeBp(d), bola: bola && bola.x === 34 && bola.y === 11, grO: o.pecas.some((p) => p.eq === "out" && p.n === "GR"), grD: d.pecas.some((p) => p.eq === "adv" && p.n === "GR") }; });
  confirma(pen.nomeO === "Penálti ofensivo · Central" && pen.nomeD === "Penálti defensivo · Central" && pen.bola && pen.grO && pen.grD, `${nome}: penálti nas bolas paradas errado (${JSON.stringify(pen)})`);
  confirma(mc.botao && mc.n === mc.base + 1 && mc.gr && mc.pl === "jnovo" && mc.sis === "4-3-3" && mc.novo && mc.tipo === "plantel-adversario" && mc.eq === "lusitania" && mc.cores, `${nome}: exportar para a SCA Performance errado (${JSON.stringify(mc)})`);
  await pg.screenshot({ path: join(cap, `${nome}-plantel-base.png`), fullPage: true });
  await pg.click("#voltar2"); await pg.waitForTimeout(150); // botão fixo em baixo
  await pg.click('[data-novo="Lusitânia"]'); await pg.click('nav.secs button[data-s="plantel"]'); await pg.waitForTimeout(300);
  await pg.screenshot({ path: join(cap, `${nome}-plantel.png`), fullPage: true });
  // Obs. 27: mostra o nome oficial («SC Lusitânia»), mas grava a chave de sempre («Lusitânia»)
  const nm = await pg.evaluate(() => ({ h2: (document.querySelector("#main h2") || {}).textContent || "", chaves: Object.values(rels).map((x) => x.adversario).join("|") }));
  confirma(/SC Lusitânia/.test(nm.h2) && !/SC |FC /.test(nm.chaves), `${nome}: nomes oficiais errados (${JSON.stringify(nm)})`);
  const lus = await pg.evaluate(() => { const R = Object.values(rels).find((x) => x.adversario === "Lusitânia"); return { n: R.plantel.length, cor: R.cores.cam, tr: R.treinador, fonte: R.plantelFonte }; });
  confirma(lus.n > 15 && lus.cor === "#118C3E" && lus.tr === "Treinador Base" && /^Plantel base/.test(lus.fonte), `${nome}: plantel ou cores do Lusitânia em falta (${JSON.stringify(lus)})`);
  // todos os adversários têm cores; relatório já gravado sem camisola recebe as do clube, cor escolhida pelo observador fica
  const cores = await pg.evaluate(() => ({ falta: EQUIPAS.map(([n]) => n).filter((n) => !CORES_EQ[n]), mad: normRel({ adversario: "Madalena", cores: { cam: "", cam2: "" } }).cores, esc: normRel({ adversario: "Madalena", cores: { cam: "#FFFFFF", cam2: "" } }).cores }));
  confirma(!cores.falta.length && cores.mad.cam === "#7B1E30" && cores.mad.cam2 === "#0055A4" && cores.esc.cam === "#FFFFFF" && cores.esc.cam2 === "", `${nome}: cores dos clubes erradas (${JSON.stringify(cores)})`);

  // sistema habitual muda o desenho; onze provável muda a posição no plantel
  await pg.selectOption("#pl-sis", "3-5-2"); await pg.waitForTimeout(200);
  await pg.click('#pl-m button[data-k="prov"]'); await pg.waitForTimeout(200);
  await pg.click('#pl-svg [data-os="ALD"]'); await pg.waitForTimeout(200);
  await pg.click(".sheet [data-j]"); await pg.waitForTimeout(200);
  const onze = await pg.evaluate(() => { const R = Object.values(rels).find((x) => x.adversario === "Lusitânia"); const id = R.onzes.prov.pos.ALD; return { sis: R.onzes.prov.sis, slot: (R.plantel.find((j) => j.id === id) || {}).slot }; });
  confirma(onze.sis === "3-5-2" && onze.slot === "ALD", `${nome}: onze provável não atualizou o plantel (${JSON.stringify(onze)})`);

  // bolinhas livres: no onze e no plantel por posição a bolinha vai para onde se larga (e leva os nomes)
  const arr = async (sel, dx, dy) => { const l = pg.locator(sel).first(); await l.evaluate((e) => e.scrollIntoView({ block: "center", inline: "center" })); const b = await l.boundingBox(), x = b.x + b.width / 2, y = b.y + b.height / 2;
    await pg.mouse.move(x, y); await pg.mouse.down(); for (let i = 1; i <= 8; i++) await pg.mouse.move(x + dx * i / 8, y + dy * i / 8); await pg.mouse.up(); await pg.waitForTimeout(250); };
  await arr('#pl-svg [data-pc="ALD"]', -40, 50);
  await pg.click('#pl-m button[data-k="plantel"]'); await pg.waitForTimeout(200);
  await arr('#pl-svg [data-pc="GR"]', 50, 30);
  const livres = await pg.evaluate(() => { const R = Object.values(rels).find((x) => x.adversario === "Lusitânia"); return { onze: R.onzes.prov.xy.ALD, gr: (R.plXY["3-5-2"] || {}).GR, folha: !!document.querySelector(".sheet") }; });
  confirma(livres.onze && livres.gr && !livres.folha && livres.gr.x > 0.5, `${nome}: bolinhas do onze ou do plantel não ficaram onde foram largadas (${JSON.stringify(livres)})`);
  // "Mover livremente": um nome largado fica onde foi posto e não muda de posição no plantel
  await pg.check("#pl-livre"); await pg.waitForTimeout(200);
  const jl = await pg.evaluate(() => { const R = Object.values(rels).find((x) => x.adversario === "Lusitânia"), j = R.plantel.find((j) => j.slot === "GR"); return { id: j.id, slot: j.slot }; });
  await arr(`#pl-svg [data-pl="${jl.id}"]`, 70, 90);
  const nl = await pg.evaluate((id) => { const R = Object.values(rels).find((x) => x.adversario === "Lusitânia"); return { q: (R.plNom["3-5-2"] || {})[id], slot: R.plantel.find((j) => j.id === id).slot, folha: !!document.querySelector(".sheet") }; }, jl.id);
  confirma(nl.q && nl.slot === "GR" && !nl.folha, `${nome}: no modo livre o nome devia ficar onde foi largado e manter a posição (${JSON.stringify(nl)})`);
  await pg.screenshot({ path: join(cap, `${nome}-plantel-livre.png`), fullPage: true });
  await pg.uncheck("#pl-livre"); await pg.waitForTimeout(150);

  // checklist: opção, frequência, jogadores, quadro tático com os 11
  await pg.click('nav.secs button[data-s="com"]'); await pg.waitForTimeout(200);
  await pg.click('[data-q="c_pb"] [data-op="Alternam"]'); await pg.click('[data-q="c_pb"] [data-fq="sempre"]');
  await pg.click('[data-q="c_dentro"] [data-jadd]'); await pg.click("#jq-l button"); await pg.click("#jq-ok");
  await pg.click('[data-q="c_pb"] [data-qq]'); await pg.waitForTimeout(200); await pg.click("#qq-11"); await pg.waitForTimeout(200);
  await pg.screenshot({ path: join(cap, `${nome}-checklist.png`), fullPage: true });
  const chk = await pg.evaluate(() => { const R = Object.values(rels).find((x) => x.adversario === "Lusitânia"); const c = R.chk; return { op: c.c_pb.op.join(), fq: c.c_pb.freq, jog: c.c_dentro.jog.length, q: c.c_pb.quadro.pecas.length }; });
  confirma(chk.op === "Alternam" && chk.fq === "sempre" && chk.jog === 1 && chk.q >= 11, `${nome}: checklist não gravou (${JSON.stringify(chk)})`);

  // setas: desenhar no quadro de uma bola parada grava a seta (antes o campo refazia-se a meio e perdia-a)
  await pg.click('nav.secs button[data-s="bpo"]'); await pg.waitForTimeout(200); await pg.click('[data-nbp="canto:of"]'); await pg.waitForTimeout(200);
  await pg.click("#bp-m button:nth-child(2)"); const pb = pg.locator("#bp-p svg"); await pb.scrollIntoViewIfNeeded(); const sb = await pb.boundingBox();
  await pg.mouse.move(sb.x + sb.width * .3, sb.y + sb.height * .6); await pg.mouse.down(); for (let i = 1; i <= 8; i++) await pg.mouse.move(sb.x + sb.width * (.3 + i * .04), sb.y + sb.height * (.6 - i * .03)); await pg.mouse.up(); await pg.waitForTimeout(200);
  const setas = await pg.evaluate(() => Object.values(rels).find((x) => x.adversario === "Lusitânia").bp[0].setas.length);
  confirma(setas === 1, `${nome}: a seta desenhada na bola parada não ficou gravada (${setas})`);

  // jogos observados: a equipa escolhe-se numa lista (a lista de sugestões do browser não abria no claude.ai) ou escreve-se em "Outra equipa…"
  await pg.click('nav.secs button[data-s="ficha"]'); await pg.waitForTimeout(150);
  await pg.selectOption("[data-jvs]", "Praiense"); await pg.waitForTimeout(150);
  const vs1 = await pg.evaluate(() => Object.values(rels).find((x) => x.adversario === "Lusitânia").jogos[0].vs);
  await pg.selectOption("[data-jvs]", "__outra"); await pg.waitForTimeout(150);
  await pg.fill('[data-b$=".vs"]', "Sporting Ideal"); await pg.locator('[data-b$=".vs"]').blur(); await pg.waitForTimeout(150);
  const vs2 = await pg.evaluate(() => ({ vs: Object.values(rels).find((x) => x.adversario === "Lusitânia").jogos[0].vs, sel: document.querySelector("[data-jvs]").value }));
  confirma(vs1 === "Praiense" && vs2.vs === "Sporting Ideal" && vs2.sel === "__outra", `${nome}: equipa do jogo observado não ficou escolhida (${JSON.stringify({ vs1, vs2 })})`);

  // ficha do jogo: onze inicial (11 do plantel) e acontecimentos (golo, substituição, cartão)
  await pg.click("[data-fjo]"); await pg.waitForTimeout(150);
  await pg.evaluate(() => [...document.querySelectorAll("#oj-l button")].slice(0, 11).forEach((b) => b.click())); await pg.click("#oj-ok"); await pg.waitForTimeout(150);
  for (const [t, m] of [["golo", "23"], ["sub", "60"], ["am", "35"]]) { await pg.click(`[data-fja$=":${t}"]`); await pg.fill("#ac-min", m);
    if (t !== "golo") await pg.selectOption("#ac-j", { index: 1 }); if (t === "sub") await pg.selectOption("#ac-j2", { index: 1 }); await pg.click("#ac-ok"); await pg.waitForTimeout(150); }
  const fj = await pg.evaluate(() => { const J = Object.values(rels).find((x) => x.adversario === "Lusitânia").jogos[0], s = J.acont.find((a) => a.t === "sub"); return { onze: J.onze.length, ac: J.acont.map((a) => a.t + a.min).join(","), sai: s && J.onze.includes(s.jog), entra: s && !J.onze.includes(s.jog2) }; });
  confirma(fj.onze === 11 && fj.ac === "golo23,sub60,am35" && fj.sai && fj.entra, `${nome}: ficha do jogo (onze e acontecimentos) não ficou gravada (${JSON.stringify(fj)})`);
  // editar um acontecimento: tocar no golo abre-o preenchido; muda o minuto e o marcador sem criar outro
  const gid = await pg.evaluate(() => Object.values(rels).find((x) => x.adversario === "Lusitânia").jogos[0].acont.find((a) => a.t === "golo").id);
  await pg.click(`[data-fje$=":${gid}"]`); await pg.waitForSelector("#ac-min");
  const pre = await pg.inputValue("#ac-min"); await pg.fill("#ac-min", "25"); await pg.selectOption("#ac-j", { index: 2 }); await pg.click("#ac-ok"); await pg.waitForTimeout(150);
  const ed = await pg.evaluate((gid) => { const J = Object.values(rels).find((x) => x.adversario === "Lusitânia").jogos[0], g = J.acont.find((a) => a.id === gid); return { n: J.acont.length, min: g.min, jog: !!g.jog }; }, gid);
  confirma(pre === "23" && ed.n === 3 && ed.min === "25" && ed.jog, `${nome}: editar o golo da ficha do jogo não funcionou (${JSON.stringify({ pre, ed })})`);
  confirma((await pg.textContent("#st-env")).includes("Submeter relatório"), `${nome}: o botão devia dizer "Submeter relatório"`);

  // momentos do jogo com os nomes novos; opções novas; posição e depois jogador
  const gui = await pg.evaluate(() => ({ nomes: SECS.filter((x) => x.g === "Momentos do jogo").map((x) => x.t).join("|"), p31: Q_POR_ID.p_prot.op.includes("3+1"), s23: Q_POR_ID.s_pb.op.some((o) => o.includes("2/3 do campo")) }));
  confirma(gui.nomes === "Organização ofensiva|Transição defesa-ataque|Transição ataque-defesa|Organização defensiva|Bolas paradas ofensivas|Bolas paradas defensivas" && gui.p31 && gui.s23, `${nome}: momentos do jogo ou opções novas em falta (${JSON.stringify(gui)})`);
  await pg.click('nav.secs button[data-s="com"]'); await pg.waitForTimeout(150);
  await pg.click('[data-q="c_apoio"] [data-jadd]'); await pg.waitForTimeout(150); await pg.click("#jp-pos button"); await pg.waitForTimeout(100);
  await pg.screenshot({ path: join(cap, `${nome}-posicao-jogador.png`) });
  await pg.click("#jp-jog button"); await pg.click("#jq-ok"); await pg.waitForTimeout(150);
  const pj = await pg.evaluate(() => { const C = Object.values(rels).find((x) => x.adversario === "Lusitânia").chk.c_apoio; return { n: C.jog.length, pos: C.jp[C.jog[0]] }; });
  confirma(pj.n === 1 && pj.pos === "GR", `${nome}: posição e depois jogador não ficou gravado (${JSON.stringify(pj)})`);

  // jogadores de referência a partir do plantel
  await pg.click('nav.secs button[data-s="jog"]'); await pg.waitForTimeout(150); await pg.click("#jg-add"); await pg.waitForTimeout(150); await pg.click("#rf-l button"); await pg.waitForTimeout(150);
  const rf = await pg.evaluate(() => { const R = Object.values(rels).find((x) => x.adversario === "Lusitânia"), p = R.refs[0]; return p && { jid: p.jid, nome: p.nome, ok: R.plantel.some((j) => j.id === p.jid && j.nome === p.nome) }; });
  confirma(rf && rf.ok, `${nome}: jogador de referência não veio do plantel (${JSON.stringify(rf)})`);

  // nota rápida (estádio) fica por arrumar; nenhuma página se pode alargar para os lados
  await pg.click("#fab"); await pg.fill("#e-t", "Lateral sobe sempre que a bola vai ao lado contrário"); await pg.click("#e-ok");
  const larg = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  confirma(larg <= 1, `${nome}: a página alarga ${larg}px para os lados`);
  // jogo novo da mesma equipa: vem preenchido do último jogo, com alertas por confirmar; o onze da ficha preenche a estrutura
  await pg.evaluate(() => { vista = { tipo: "lista", id: null, sec: "ficha" }; render(); });
  await pg.click('[data-novo="Lusitânia"]'); await pg.waitForTimeout(250);
  const nj = await pg.evaluate(() => { const R = relAtual(); return { n: jogosDe("Lusitânia").length, pend: Object.keys(R.pend).length, pb: !!R.pend["chk:c_pb"], op: R.chk.c_pb && R.chk.c_pb.op.join(), ev: R.evid.length, jogos: R.jogos.length, vs: R.jogos[0].vs }; });
  await pg.click('nav.secs button[data-s="com"]'); await pg.waitForTimeout(150);
  const temQp = await pg.locator('[data-q="c_pb"].qpend').count();
  await pg.click('[data-q="c_pb"] [data-pconf]'); await pg.waitForTimeout(150); await pg.click('[data-q="c_dentro"] [data-fq="as"]'); await pg.waitForTimeout(150);
  const nj2 = await pg.evaluate(() => { const R = relAtual(); return { pb: !!R.pend["chk:c_pb"], de: !!R.pend["chk:c_dentro"], resto: Object.keys(R.pend).length }; });
  confirma(nj.n === 2 && nj.pend > 2 && nj.pb && nj.op === "Alternam" && nj.ev === 0 && nj.jogos === 1 && nj.vs === "" && temQp === 1 && !nj2.pb && !nj2.de && nj2.resto === nj.pend - 2,
    `${nome}: jogo novo devia vir preenchido do anterior com alertas que se limpam ao confirmar ou mudar (${JSON.stringify({ nj, temQp, nj2 })})`);
  await pg.click('nav.secs button[data-s="ficha"]'); await pg.waitForTimeout(150); await pg.click("[data-fjo]"); await pg.waitForTimeout(150);
  await pg.evaluate(() => [...document.querySelectorAll("#oj-l button")].slice(0, 11).forEach((b) => b.click())); await pg.click("#oj-ok"); await pg.waitForTimeout(200);
  const es = await pg.evaluate(() => { const R = relAtual(), grs = R.plantel.filter((j) => R.jogos[0].onze.includes(j.id) && j.slot === "GR").map((j) => j.nome); return { nomes: R.onze.jog.filter((j) => j.nome).length, gr: grs.includes(R.onze.jog[0].nome), sis: R.onze.com.sis, estr: !!R.pend.estr }; });
  confirma(es.nomes === 11 && es.gr && es.sis === "3-5-2" && !es.estr, `${nome}: o onze da ficha devia preencher a estrutura (${JSON.stringify(es)})`);
  await pg.click('nav.secs button[data-s="estr"]'); await pg.waitForTimeout(150);
  const lab = await pg.evaluate(() => { const R = relAtual(), n = nomeCurto(R.onze.jog[5].nome); return { n, tem: !!n && [...document.querySelectorAll("#es-p text")].some((t) => t.textContent === n), sem: R.onze.sem.sis }; });
  confirma(lab.tem && lab.sem === "3-5-2", `${nome}: a estrutura devia mostrar os nomes dos titulares, com e sem bola (${JSON.stringify(lab)})`);
  await pg.screenshot({ path: join(cap, `${nome}-estrutura-nomes.png`), fullPage: true });
  await pg.click("#voltar"); await pg.waitForTimeout(150);
  confirma((await pg.locator('[data-hist="Lusitânia"]').count()) === 1, `${nome}: com 2 jogos a equipa devia ter o botão Histórico`);
  await pg.screenshot({ path: join(cap, `${nome}-lista-jogos.png`), fullPage: true });
  // histórico da equipa: cada pergunta jogo a jogo, com o que mudou destacado
  await pg.click('[data-hist="Lusitânia"]'); await pg.waitForSelector(".htab");
  const hi = await pg.evaluate(() => ({ cols: document.querySelectorAll(".htab thead th").length - 1, mud: document.querySelectorAll(".htab td.mud").length }));
  confirma(hi.cols === 2 && hi.mud > 0, `${nome}: histórico devia mostrar 2 jogos e o que mudou (${JSON.stringify(hi)})`);
  await pg.screenshot({ path: join(cap, `${nome}-historico.png`), fullPage: true });
  await pg.click("#voltar"); await pg.waitForTimeout(150);
  // PDF do jogo e PowerPoint com os pontos escolhidos (as bibliotecas vêm do CDN só quando se exporta)
  await pg.evaluate(() => { vista = { tipo: "rel", id: jogosDe("Lusitânia")[1].id, sec: "ficha" }; render(); }); await pg.waitForTimeout(150);
  await pg.evaluate(() => editaRel((R) => R.evid.push({ id: "eclip", q: "c_pb", txt: "Saída curta", jogo: R.jogos[0].id, min: "12:30", freq: "rec" })));
  await pg.click("#ex-ppt"); await pg.waitForSelector("#ap-l [data-k]");
  const np = await pg.locator("#ap-l [data-k]").count(); await pg.click(".sheet [data-close]");
  const ex = await pg.evaluate(async () => { const R = relAtual(); const pdf = await geraPdf(R); const ppt = await geraPptx(R, pontosApresentacao(R).map((x) => x.k)); return { pdf: pdf.size, ppt: ppt.size, tipo: pdf.type }; });
  confirma(np > 3 && ex.pdf > 20000 && ex.ppt > 30000 && /pdf/.test(ex.tipo), `${nome}: exportação de PDF ou PowerPoint falhou (${JSON.stringify({ np, ex })})`);
  for (const s of ["ficha", "estr", "rec", "per", "sem", "bpo", "bpd", "jog", "nos", "sint", "notas"]) { await pg.click(`nav.secs button[data-s="${s}"]`); await pg.waitForTimeout(120); }
  await pg.screenshot({ path: join(cap, `${nome}-notas.png`) });
}
// base de dados simulada: uma atualização antiga que chega enquanto uma alteração ainda espera para gravar (data, local)
// não a pode apagar (antes a data e o local ficavam em branco no link)
{
  const pg = await (await browser.newContext(ecras[0][1])).newPage();
  pg.on("pageerror", (e) => falhas.push(`bd simulada: ${e}`));
  await pg.addInitScript(() => {
    window.__snap = {}; window.__docs = {};
    window.claude = { use: async (n) => {
      if (n === "user") return { id: async () => "u_teste", isOwner: async () => true, can: async () => true, profiles: async () => ({}) };
      if (n === "db") return { collection: (p) => ({ onSnapshot: (cb) => { (window.__snap[p] = window.__snap[p] || []).push(cb); return () => {}; } }),
        doc: (p) => ({ set: async (b) => { window.__docs[p] = JSON.parse(JSON.stringify(b)); }, update: async (b) => { const m = (a, x) => { const o = a && typeof a === "object" && !Array.isArray(a) ? { ...a } : {}; Object.entries(x).forEach(([k, v]) => o[k] = v && typeof v === "object" && !Array.isArray(v) ? m(o[k], v) : v); return o; }; if (!window.__docs[p]) throw { code: "invalid_argument", message: "no such document" }; window.__docs[p] = JSON.parse(JSON.stringify(m(window.__docs[p], b))); }, delete: async () => { delete window.__docs[p]; } }) };
      return null; } };
  });
  await pg.goto(url); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(500);
  await pg.click('[data-novo="Lusitânia"]'); await pg.waitForTimeout(200);
  await pg.selectOption("[data-jvs]", "Praiense"); await pg.waitForTimeout(200);
  const antigo = await pg.evaluate(() => { const k = Object.keys(window.__docs).find((p) => p.startsWith("obs/u_teste/relatorios/")); return { k, d: window.__docs[k] }; });
  await pg.fill('[data-b$=".data"]', "2026-10-18"); await pg.selectOption('[data-b$=".local"]', "fora"); await pg.waitForTimeout(100); await pg.evaluate(() => document.activeElement && document.activeElement.blur()); // no iPad o campo perde o foco ao fechar o seletor
  await pg.evaluate((a) => { const id = a.k.split("/").pop(); (window.__snap["obs/u_teste/relatorios"] || []).forEach((cb) => cb({ docs: [{ id, data: () => a.d }], metadata: { hasPendingWrites: false, fromCache: false } })); }, antigo);
  await pg.waitForTimeout(1000);
  // os dados que chegam da base de dados vêm congelados (como no link): a página tem de conseguir alterá-los depois
  await pg.evaluate((k) => { const fz = (o) => { if (o && typeof o === "object") { Object.values(o).forEach(fz); Object.freeze(o); } return o; }; const d = fz(JSON.parse(JSON.stringify(window.__docs[k]))), id = k.split("/").pop();
    (window.__snap["obs/u_teste/relatorios"] || []).forEach((cb) => cb({ docs: [{ id, data: () => d }], metadata: { hasPendingWrites: false, fromCache: false } })); }, antigo.k);
  await pg.waitForTimeout(200); await pg.selectOption("[data-jvs]", "Madalena"); await pg.waitForTimeout(300);
  const congelado = await pg.evaluate((k) => ({ ui: Object.values(rels)[0].jogos[0].vs, sel: document.querySelector("[data-jvs]").value, db: window.__docs[k].jogos[0].vs }), antigo.k);
  confirma(congelado.ui === "Madalena" && congelado.sel === "Madalena" && congelado.db === "Madalena", `bd simulada: com dados congelados da base de dados a equipa não muda (${JSON.stringify(congelado)})`);
  // com dados congelados, as bolinhas da Estrutura e do quadro tático continuam a mexer-se
  const arrasta = async (sel, dx, dy) => { const l = pg.locator(sel).first(); await l.evaluate((e) => e.scrollIntoView({ block: "center", inline: "center" })); const b = await l.boundingBox(), x = b.x + b.width / 2, y = b.y + b.height / 2;
    await pg.mouse.move(x, y); await pg.mouse.down(); for (let i = 1; i <= 8; i++) await pg.mouse.move(x + dx * i / 8, y + dy * i / 8); await pg.mouse.up(); await pg.waitForTimeout(250); };
  await pg.click('nav.secs button[data-s="com"]'); await pg.waitForTimeout(150); await pg.click('[data-q="c_pb"] [data-qq]'); await pg.waitForTimeout(150); await pg.click("#qq-11"); await pg.waitForTimeout(200);
  const kq = await pg.evaluate(() => Object.values(rels)[0].chk.c_pb.quadro.pecas[3].id);
  await pg.evaluate((k) => { const fz = (o) => { if (o && typeof o === "object") { Object.values(o).forEach(fz); Object.freeze(o); } return o; }; const d = fz(JSON.parse(JSON.stringify(window.__docs[k]))), id = k.split("/").pop();
    (window.__snap["obs/u_teste/relatorios"] || []).forEach((cb) => cb({ docs: [{ id, data: () => d }], metadata: { hasPendingWrites: false, fromCache: false } })); }, antigo.k);
  await pg.waitForTimeout(300);
  const q0 = await pg.evaluate((k) => { const p = Object.values(rels)[0].chk.c_pb.quadro.pecas.find((x) => x.id === k); return { x: p.x, y: p.y }; }, kq);
  await arrasta(`#qq-p [data-k="${kq}"]`, 40, 30);
  const q1 = await pg.evaluate((k) => { const p = Object.values(rels)[0].chk.c_pb.quadro.pecas.find((x) => x.id === k); return { x: p.x, y: p.y }; }, kq);
  await pg.click('nav.secs button[data-s="estr"]'); await pg.waitForTimeout(200);
  await arrasta('#es-p [data-i="5"]', 40, -30);
  const e5 = await pg.evaluate(() => Object.values(rels)[0].onze.com.pos[5]);
  confirma((q1.x !== q0.x || q1.y !== q0.y) && e5, `bd simulada: com dados congelados as bolinhas do quadro ou da estrutura não se mexem (${JSON.stringify({ q0, q1, e5 })})`);
  const bd = await pg.evaluate((k) => { const R = Object.values(rels)[0], J = R.jogos[0], G = window.__docs[k].jogos[0]; return { data: J.data, local: J.local, gData: G.data, gLocal: G.local }; }, antigo.k);
  confirma(bd.data === "2026-10-18" && bd.local === "fora" && bd.gData === "2026-10-18" && bd.gLocal === "fora", `bd simulada: data ou local apagados por uma atualização antiga (${JSON.stringify(bd)})`);
}
// edição partilhada: dono (Rodrigo Fonte) e observador (Rodrigo Simão) na mesma base de dados simulada, com dados congelados como no link
{
  const srv = new Map(), pags = [];
  const junta = (a, x) => { const o = a && typeof a === "object" && !Array.isArray(a) ? { ...a } : {}; Object.entries(x).forEach(([k, v]) => o[k] = v && typeof v === "object" && !Array.isArray(v) ? junta(o[k], v) : v); return o; };
  const docsDe = (col) => [...srv].filter(([p]) => p.slice(0, p.lastIndexOf("/")) === col).map(([p, d]) => ({ id: p.slice(p.lastIndexOf("/") + 1), d }));
  const difunde = async (col) => { for (const pg of pags) await pg.evaluate(([c, ds]) => window.__entrega && window.__entrega(c, ds), [col, docsDe(col)]).catch(() => {}); };
  const abre = async (uid, dono) => { const pg = await (await browser.newContext(ecras[0][1])).newPage(); pags.push(pg);
    pg.on("pageerror", (e) => falhas.push(`partilha ${uid}: ${e}`));
    await pg.exposeFunction("__srv", async (op, path, body) => { if (op === "ler") return docsDe(path);
      if (op === "set") srv.set(path, JSON.parse(JSON.stringify(body))); else if (op === "update") { if (!srv.has(path)) throw new Error("no such document"); srv.set(path, junta(srv.get(path), JSON.parse(JSON.stringify(body)))); } else if (op === "delete") srv.delete(path);
      setTimeout(() => difunde(path.slice(0, path.lastIndexOf("/"))), 40); return true; });
    await pg.addInitScript(([uid, dono]) => { const fz = (o) => { if (o && typeof o === "object") { Object.values(o).forEach(fz); Object.freeze(o); } return o; }, meta = { hasPendingWrites: false, fromCache: false };
      const q = (ds) => ({ docs: ds.map((x) => ({ id: x.id, data: () => fz(JSON.parse(JSON.stringify(x.d))) })), metadata: meta });
      window.__subs = {}; window.__entrega = (col, ds) => (window.__subs[col] || []).forEach((cb) => cb(q(ds)));
      const NOMES = { u_dono: "Rodrigo Fonte", u_obs: "Rodrigo Simão" };
      window.claude = { use: async (n) => {
        if (n === "user") return { id: async () => uid, isOwner: async () => dono, can: async () => true, name: async () => NOMES[uid], profiles: async (ids) => Object.fromEntries(ids.map((i) => [i, { name: NOMES[i] || "" }])) };
        if (n === "db") return { collection: (p) => ({ onSnapshot: (cb) => { (window.__subs[p] = window.__subs[p] || []).push(cb); window.__srv("ler", p).then((ds) => cb(q(ds))); return () => {}; } }),
          doc: (p) => ({ set: (b) => window.__srv("set", p, b), update: (b) => window.__srv("update", p, b), delete: () => window.__srv("delete", p) }) };
        return null; } }; }, [uid, dono]);
    await pg.goto(url); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(700); return pg; };
  const A = await abre("u_dono", true), B = await abre("u_obs", false);
  await A.click('[data-novo="Lusitânia"]'); await A.waitForTimeout(600);
  const rid = await A.evaluate(() => vista.id), path = `obs/u_dono/relatorios/${rid}`;
  // o observador edita o relatório do dono (P1 da organização ofensiva)
  await B.evaluate((rid) => { vista = { tipo: "rel", id: rid, sec: "com" }; render(); }, rid); await B.waitForTimeout(200);
  await B.click('[data-q="c_pb"] [data-op="Alternam"]'); await B.waitForTimeout(600);
  // ao mesmo tempo: o dono escreve na síntese e o observador na data do jogo
  await A.evaluate((rid) => { vista = { tipo: "rel", id: rid, sec: "sint" }; render(); }, rid); await B.evaluate(() => { vista.sec = "ficha"; render(); }); await A.waitForTimeout(200);
  await Promise.all([A.fill('[data-b="sint.estrutura"]', "Bloco médio compacto"), B.fill('[data-b$=".data"]', "2026-10-18")]);
  await A.locator('[data-b="sint.estrutura"]').blur(); await B.locator('[data-b$=".data"]').blur(); await A.waitForTimeout(1800);
  const d = srv.get(path) || {}, nos = async (pg) => pg.evaluate((rid) => { const R = rels[rid]; return R && { op: R.chk.c_pb && R.chk.c_pb.op.join(), est: R.sint.estrutura, data: R.jogos[0].data }; }, rid);
  const sa = await nos(A), sb = await nos(B), sd = { op: d.chk && d.chk.c_pb && d.chk.c_pb.op.join(), est: d.sint && d.sint.estrutura, data: d.jogos && d.jogos[0].data };
  const tudo = (x) => x && x.op === "Alternam" && x.est === "Bloco médio compacto" && x.data === "2026-10-18";
  confirma(tudo(sa) && tudo(sb) && tudo(sd), `partilha: edições do observador e simultâneas perderam-se (${JSON.stringify({ sa, sb, sd })})`);
  // histórico: o dono vê a alteração do observador com nome, campo, antes e depois
  const lg = await A.evaluate((rid) => Object.values(logs).filter((l) => l.relId === rid && l.por === "u_obs" && l.chave === "chk.c_pb.op").map((l) => ({ id: l.id, campo: `${l.sec} › ${l.campo}`, antes: l.antes, depois: l.depois, nome: nomeDe(l.por, l.nome) })), rid);
  confirma(lg.length === 1 && lg[0].campo === "Organização ofensiva › P1 › Opções" && !(lg[0].antes || []).length && lg[0].depois.join() === "Alternam" && lg[0].nome === "Rodrigo Simão", `partilha: histórico da alteração do observador errado (${JSON.stringify(lg)})`);
  // agrupamento: duas mudanças à frequência em menos de 10 min = 1 registo; 11 min depois = registo novo
  await B.evaluate(() => { vista.sec = "com"; render(); }); await B.waitForTimeout(150);
  await B.click('[data-q="c_pb"] [data-fq="sempre"]'); await B.waitForTimeout(300); await B.click('[data-q="c_pb"] [data-fq="muitas"]'); await B.waitForTimeout(300);
  const g1 = await B.evaluate((rid) => Object.values(logs).filter((l) => l.relId === rid && l.chave === "chk.c_pb.freq").map((l) => [l.antes, l.depois]), rid);
  await B.evaluate(() => { window.__desloca = 11 * 60 * 1000; }); await B.click('[data-q="c_pb"] [data-fq="as"]'); await B.waitForTimeout(300);
  const g2 = await B.evaluate((rid) => Object.values(logs).filter((l) => l.relId === rid && l.chave === "chk.c_pb.freq").length, rid);
  confirma(g1.length === 1 && !g1[0][0] && g1[0][1] === "muitas" && g2 === 2, `partilha: agrupamento dos 10 minutos errado (${JSON.stringify({ g1, g2 })})`);
  // observador: sem "Repor"; edita os planteis base (desde a Obs. 25)
  await B.evaluate((rid) => { vista = { tipo: "rel", id: rid, sec: "hlog" }; render(); }, rid); await B.waitForTimeout(200);
  const rB = await B.locator("[data-repor]").count();
  await B.evaluate(() => { vista = { tipo: "base", id: "lusitania", sec: "plantel" }; render(); }); await B.waitForTimeout(200);
  const baseB = await B.evaluate(() => ({ add: !!document.getElementById("pl-add"), ed: podeEditar(relAtual()) }));
  confirma(rB === 0 && baseB.add && baseB.ed, `partilha: o observador não devia ter Repor e devia poder editar os planteis base (Obs. 25) (${JSON.stringify({ rB, baseB })})`);
  // dono repõe a opção da P1: volta ao "antes" e fica registado como reposição
  await A.evaluate((rid) => { vista = { tipo: "rel", id: rid, sec: "hlog" }; render(); }, rid); await A.waitForTimeout(300);
  await A.screenshot({ path: join(cap, "partilha-historico.png"), fullPage: true });
  await A.click(`[data-repor="${lg[0].id}"]`); await A.click(`[data-repor="${lg[0].id}"]`); await A.waitForTimeout(1200);
  const rp = await A.evaluate((rid) => ({ op: rels[rid].chk.c_pb.op.length, rep: Object.values(logs).filter((l) => l.relId === rid && l.tipo === "reposição" && l.chave === "chk.c_pb.op").length }), rid);
  const opSrv = ((srv.get(path) || {}).chk || {}).c_pb.op.length, opB = await B.evaluate((rid) => rels[rid].chk.c_pb.op.length, rid);
  confirma(rp.op === 0 && rp.rep === 1 && opSrv === 0 && opB === 0, `partilha: reposição não funcionou ou não ficou registada (${JSON.stringify({ rp, opSrv, opB })})`);
  for (const pg of pags) await pg.context().close();
}
// gravação que falha: uma falha passageira volta a tentar sozinha; acesso perdido ("revoked") pede para recarregar
for (const modo of ["passageira", "revoked"]) {
  const pg = await (await browser.newContext(ecras[0][1])).newPage();
  pg.on("pageerror", (e) => falhas.push(`bd ${modo}: ${e}`));
  await pg.addInitScript((modo) => {
    window.__docs = {}; let falhou = false;
    window.claude = { use: async (n) => {
      if (n === "user") return { id: async () => "u_teste", isOwner: async () => true, can: async () => true, profiles: async () => ({}) };
      if (n === "db") return { collection: () => ({ onSnapshot: () => () => {} }),
        doc: (p) => ({ set: async (b) => { if (window.__falhar && (modo === "revoked" || !falhou)) { falhou = true; throw { code: modo === "revoked" ? "revoked" : "unavailable", message: "simulado" }; } window.__docs[p] = JSON.parse(JSON.stringify(b)); }, update: async (b) => { if (window.__falhar && (modo === "revoked" || !falhou)) { falhou = true; throw { code: modo === "revoked" ? "revoked" : "unavailable", message: "simulado" }; } window.__docs[p] = { ...window.__docs[p], ...JSON.parse(JSON.stringify(b)) }; }, delete: async () => {} }) };
      return null; } };
  }, modo);
  await pg.goto(url); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(500);
  await pg.click('[data-novo="Lusitânia"]'); await pg.waitForTimeout(200);
  await pg.evaluate(() => { window.__falhar = true; }); await pg.selectOption("[data-jvs]", "Praiense"); await pg.waitForTimeout(400);
  const st1 = await pg.textContent("#status");
  if (modo === "passageira") {
    await pg.waitForTimeout(3800);
    const r = await pg.evaluate(() => { const k = Object.keys(window.__docs).find((p) => p.includes("/relatorios/")); return { vs: window.__docs[k].jogos[0].vs, st: document.getElementById("status").textContent, pend: Object.keys(pend).length }; });
    confirma(/Não gravou/.test(st1) && r.vs === "Praiense" && r.pend === 0 && /Guardado/.test(r.st), `bd falha passageira: não voltou a tentar sozinho (${JSON.stringify({ st1, ...r })})`);
  } else {
    await pg.click("#status"); await pg.waitForTimeout(200);
    const t = await pg.evaluate(() => document.querySelector(".sheet")?.textContent || "");
    confirma(/Recarrega a página/.test(st1) && /perdeu a ligação/.test(t), `bd revoked: devia pedir para recarregar (${JSON.stringify({ st1, t: t.slice(0, 80) })})`);
  }
}
await browser.close();
if (falhas.length) { console.error("FALHOU:\n" + falhas.join("\n")); process.exit(1); }
console.log(`OK · app de observação${ipad ? " (iPad)" : " (PC e telemóvel)"} · capturas em tests/capturas/observacao/`);
