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
  pg.on("pageerror", (e) => falhas.push(`${nome}: ${e}`));
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
  await pg.screenshot({ path: join(cap, `${nome}-plantel-base.png`), fullPage: true });
  await pg.click("#voltar2"); await pg.waitForTimeout(150); // botão fixo em baixo
  await pg.click('[data-novo="Lusitânia"]'); await pg.click('nav.secs button[data-s="plantel"]'); await pg.waitForTimeout(300);
  await pg.screenshot({ path: join(cap, `${nome}-plantel.png`), fullPage: true });
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
  await pg.click('nav.secs button[data-s="bp"]'); await pg.waitForTimeout(200); await pg.click('[data-nbp="canto:of"]'); await pg.waitForTimeout(200);
  await pg.click("#bp-m button:nth-child(2)"); const pb = pg.locator("#bp-p svg"); await pb.scrollIntoViewIfNeeded(); const sb = await pb.boundingBox();
  await pg.mouse.move(sb.x + sb.width * .3, sb.y + sb.height * .6); await pg.mouse.down(); for (let i = 1; i <= 8; i++) await pg.mouse.move(sb.x + sb.width * (.3 + i * .04), sb.y + sb.height * (.6 - i * .03)); await pg.mouse.up(); await pg.waitForTimeout(200);
  const setas = await pg.evaluate(() => Object.values(rels).find((x) => x.adversario === "Lusitânia").bp[0].setas.length);
  confirma(setas === 1, `${nome}: a seta desenhada na bola parada não ficou gravada (${setas})`);

  // jogos observados: a equipa escolhe-se numa lista (a lista de sugestões do browser não abria no claude.ai) ou escreve-se em "Outra equipa…"
  await pg.click('nav.secs button[data-s="ficha"]'); await pg.waitForTimeout(150); await pg.click("#j-add"); await pg.waitForTimeout(150);
  await pg.selectOption("[data-jvs]", "Praiense"); await pg.waitForTimeout(150);
  const vs1 = await pg.evaluate(() => Object.values(rels).find((x) => x.adversario === "Lusitânia").jogos[0].vs);
  await pg.selectOption("[data-jvs]", "__outra"); await pg.waitForTimeout(150);
  await pg.fill('[data-b$=".vs"]', "Sporting Ideal"); await pg.locator('[data-b$=".vs"]').blur(); await pg.waitForTimeout(150);
  const vs2 = await pg.evaluate(() => ({ vs: Object.values(rels).find((x) => x.adversario === "Lusitânia").jogos[0].vs, sel: document.querySelector("[data-jvs]").value }));
  confirma(vs1 === "Praiense" && vs2.vs === "Sporting Ideal" && vs2.sel === "__outra", `${nome}: equipa do jogo observado não ficou escolhida (${JSON.stringify({ vs1, vs2 })})`);

  // nota rápida (estádio) fica por arrumar; nenhuma página se pode alargar para os lados
  await pg.click("#fab"); await pg.fill("#e-t", "Lateral sobe sempre que a bola vai ao lado contrário"); await pg.click("#e-ok");
  const larg = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  confirma(larg <= 1, `${nome}: a página alarga ${larg}px para os lados`);
  for (const s of ["ficha", "estr", "rec", "per", "sem", "bp", "jog", "nos", "sint", "notas"]) { await pg.click(`nav.secs button[data-s="${s}"]`); await pg.waitForTimeout(120); }
  await pg.screenshot({ path: join(cap, `${nome}-notas.png`) });
}
await browser.close();
if (falhas.length) { console.error("FALHOU:\n" + falhas.join("\n")); process.exit(1); }
console.log(`OK · app de observação${ipad ? " (iPad)" : " (PC e telemóvel)"} · capturas em tests/capturas/observacao/`);
