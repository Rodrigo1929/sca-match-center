// v123: Palestra — secções pela ordem, onzes editáveis (sistema), quadros COM/SEM BOLA no motor do Modelo de Jogo (criar, passos, ‹ ›, animar,
// zonas automáticas, duplicar, ordenar, apagar com 2 toques, desfazer), gravação por registo e depois de recarregar, Apresentar,
// setups das bolas paradas sem os lances ligados, arquivo (passam + cópia), Quadro só com 3 grupos, e PDF com os passos lado a lado.
// node tests/palestra.mjs [--ipad]   (CHROME_PATH e CDN_LOCAL como no smoke)
import { chromium, webkit, devices } from "playwright";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdirSync, statSync, readFileSync } from "node:fs";
const raiz = join(dirname(fileURLToPath(import.meta.url)), ".."), cap = join(raiz, "tests", "capturas"); mkdirSync(cap, { recursive: true });
const ipad = process.argv.includes("--ipad"), ipadChrome = process.argv.includes("--ipad-chrome");   // --ipad-chrome: ecrã e toque de iPad no Chromium (quando não há WebKit)
const browser = ipad ? await webkit.launch() : await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const ctx = ipad || ipadChrome ? await browser.newContext({ ...devices["iPad (gen 7) landscape"], acceptDownloads: true }) : await browser.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
const pg = await ctx.newPage();
if (process.env.CDN_LOCAL) { const d = process.env.CDN_LOCAL; const mapa = [[/jspdf-autotable/, "jspdf-autotable/dist/jspdf.plugin.autotable.min.js"], [/jspdf\/2/, "jspdf/dist/jspdf.umd.min.js"], [/xlsx/, "xlsx/dist/xlsx.full.min.js"], [/mp4-muxer/, "mp4-muxer/build/mp4-muxer.js"]];
  await pg.route(/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/, (r) => { const m = mapa.find(([re]) => re.test(r.request().url())); return m ? r.fulfill({ status: 200, contentType: "application/javascript", body: readFileSync(join(d, "node_modules", m[1])) }) : r.fulfill({ status: 200, body: "" }); }); }
const erros = []; pg.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push(s); });
const ok = (c, m) => { if (!c) erros.push(m); };
const toca = async (sel) => { if (ipad || ipadChrome) await pg.tap(sel); else await pg.click(sel); };
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href); await pg.waitForTimeout(800);

// Quadro: só Bolas Paradas, Possíveis Encaixes e Quadro Livre; os escondidos continuam nos dados
const q = await pg.evaluate(() => { setTab("q"); const nav = [...document.querySelectorAll("#nav li[data-id]")].map((l) => l.dataset.id);
  return { nav, atual: lanceAtual().id, todos: lances().map((l) => l.id) }; });
ok(!["onze", "intervalo", "estat", "notas"].some((id) => q.nav.includes(id)), "Quadro: ainda aparecem quadros escondidos " + q.nav.join(","));
ok(q.nav.includes("encaixe") && q.nav.includes("livre") && q.nav.includes("espacos"), "Quadro: faltam Possíveis Encaixes, Quadro Livre ou Quadro Dinâmico (v123.2)");
ok((await pg.evaluate(() => $("tab-q").textContent)) === "Bolas Paradas", "Separador: devia chamar-se Bolas Paradas (v123.2)");
ok(["onze", "intervalo", "espacos", "estat", "notas"].every((id) => q.todos.includes(id)), "Quadro: os escondidos deviam continuar em lances()");
ok(q.atual !== "onze", "Quadro: abre num quadro escondido (" + q.atual + ")");

// Palestra: ordem das secções
await toca("#tab-l"); await pg.waitForTimeout(200);
const ordem = await pg.evaluate(() => [...document.querySelectorAll("#pl-nav [data-s], #pl-nav h3")].map((e) => e.textContent.trim().slice(0, 40)));
ok(/Onzes/.test(ordem[0]) && ordem.some((t) => /3 · COM BOLA/.test(t)) && ordem.findIndex((t) => /3 · COM BOLA/.test(t)) < ordem.findIndex((t) => /4 · SEM BOLA/.test(t)), "Palestra: ordem das secções " + JSON.stringify(ordem));
await pg.screenshot({ path: join(cap, "palestra-onze.png") });
// nosso onze: sistema muda as posições (não os lugares) e desfaz
const sisR = await pg.evaluate(() => { const antes = JSON.stringify(jogo.onze.map((o) => [o.slot, o.n])); const xy0 = JSON.stringify(jogo.onze.map((o) => [o.x, o.y]));
  const s = $("pl-sis"); s.value = "3-5-2"; s.dispatchEvent(new Event("change")); const depois = JSON.stringify(jogo.onze.map((o) => [o.slot, o.n])), xy1 = JSON.stringify(jogo.onze.map((o) => [o.x, o.y]));
  const pos = jogo.onze.map((o) => o.pos).join(","); desfazQuadro(); return { lugares: antes === depois, mudou: xy0 !== xy1, pos, desfeito: JSON.stringify(jogo.onze.map((o) => [o.x, o.y])) === xy0, sis: palJogo.atual && palJogo.atual.sis }; });
ok(sisR.lugares && sisR.mudou && sisR.desfeito && sisR.sis === "3-5-2" && /ALA/.test(sisR.pos), "Palestra: sistema do onze " + JSON.stringify(sisR));
// adversário
await pg.evaluate(() => { plSec = "adv"; renderPalestra(); }); ok(await pg.isVisible("#pl-na"), "Palestra: onze do adversário sem notas");

// COM BOLA: criar pela folha
await pg.evaluate(() => { plSec = "com"; plCur = null; renderPalestra(); });
await toca("#pl-nav [data-novo='com']"); await pg.fill("#pn-n", "Construção a três"); await toca("#pn-a [data-k='4-4-2']"); await toca("#pn-ok"); await pg.waitForTimeout(250);
const c1 = await pg.evaluate(() => { const ls = listaPal("com"); const Q = ls[0]; return { n: ls.length, id: Q && Q.id, mPal, edit: mEdit, editorAqui: !!$("view-l").querySelector("#m-stage"), esp: Q && Q.espacos, pend: Object.keys(pendentes).some((p) => p.startsWith("palestra/")),
  tag: $("m-tag").textContent, zonas: document.querySelectorAll("#m-stage polygon").length }; });
ok(c1.n === 1 && c1.mPal === c1.id && c1.edit && c1.editorAqui && c1.esp && c1.tag === "COM BOLA", "Palestra: criar quadro COM BOLA " + JSON.stringify(c1));
ok(c1.zonas >= 3, "Palestra: zonas automáticas não desenhadas " + c1.zonas);
// passos: + passo, mexer um jogador no passo 2, + passo
await pg.evaluate(() => { novoPasso(); const Q = qAtual(), pc = Q.pecas.find((p) => p.eq === "nos" && p.pos !== "GR"); editaQ((Q) => { const p = Q.passos[1].pos[pc.id]; Q.passos[1].pos[pc.id] = { x: p.x + 12, y: p.y - 6 }; Q.passos[1].nota = "Lateral sobe por fora"; }); novoPasso(); });
// arrastar um jogador no editor que veio para a Palestra (rato ou dedo)
{ const alvo = await pg.evaluate(() => { mT_ = 2; mPl.set(2); renderModelo(); const Q = qAtual(), pc = Q.pecas.find((p) => p.eq === "nos" && p.pos !== "GR" && p.pos !== "PL"); const c = document.querySelector(`#m-stage [data-p="${pc.id}"]`).getBoundingClientRect(); return { id: pc.id, x: c.x + c.width / 2, y: c.y + c.height / 2, antes: Q.passos[2].pos[pc.id] }; });
  if (ipad || ipadChrome) { const cdp = await ctx.newCDPSession(pg).catch(() => null); if (cdp) { const t = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
      await t("touchStart", alvo.x, alvo.y); for (let k = 1; k <= 6; k++) await t("touchMove", alvo.x + k * 12, alvo.y + k * 4); await t("touchEnd"); } }
  else { await pg.mouse.move(alvo.x, alvo.y); await pg.mouse.down(); for (let k = 1; k <= 6; k++) await pg.mouse.move(alvo.x + k * 12, alvo.y + k * 4); await pg.mouse.up(); }
  await pg.waitForTimeout(150); const dep = await pg.evaluate((id) => qAtual().passos[2].pos[id], alvo.id);
  const fol = await pg.evaluate(() => $("sheet-root").innerHTML.slice(0, 80)); ok(!fol, "Palestra: arrastar abriu uma folha " + fol);
  ok(dep.x > alvo.antes.x + 3, "Palestra: arrastar um jogador no editor da Palestra " + JSON.stringify({ antes: alvo.antes, dep })); }
await pg.waitForTimeout(700); await toca("#m-ed"); await pg.waitForTimeout(120);   // ✓ Concluir (no Chromium, um toque logo a seguir a um arrasto com o dedo conta como 2.º toque)
const passos = await pg.evaluate(() => qAtual().passos.length); ok(passos === 3, "Palestra: passos " + passos);
// ‹ › : o passo seguinte anda (animação) e para no passo; o anterior volta
await pg.evaluate(() => { mT_ = 0; mPl.set(0); renderModelo(); });
await toca("#mp-seg"); await pg.waitForTimeout(120); const meio = await pg.evaluate(() => ({ t: mPl.t, a: mPl.playing }));
await pg.waitForTimeout(2200); const fim = await pg.evaluate(() => ({ t: mPl.t, a: mPl.playing, mt: mT_ }));
ok(meio.a && meio.t > 0 && meio.t < 1, "Palestra: › não anima o movimento " + JSON.stringify({ ...meio, ...(await pg.evaluate(() => ({ mEdit, mT_, sel: mSel }))) }));
ok(!fim.a && Math.abs(fim.t - 1) < 1e-6, "Palestra: › devia parar no passo 2 " + JSON.stringify(fim));
await toca("#mp-ant"); ok((await pg.evaluate(() => mT_)) === 0, "Palestra: ‹ não voltou ao passo 1");
await toca("#mp-pl"); await pg.waitForTimeout(300); ok(await pg.evaluate(() => mPl.playing), "Palestra: ▶ Animar não reproduz"); await toca("#mp-pl"); ok(!(await pg.evaluate(() => mPl.playing)), "Palestra: ⏸ não pausa");
await pg.screenshot({ path: join(cap, "palestra-com-bola.png") });
// duplicar, ordenar, mudar de secção, apagar (2 toques) e desfazer
const id1 = c1.id;
await pg.evaluate(() => duplicaPal(mPal)); const id2 = await pg.evaluate(() => mPal);
ok(id2 !== id1 && (await pg.evaluate(() => listaPal("com").map((q) => q.id).join(","))) === [id1, id2].join(","), "Palestra: duplicar");
await pg.evaluate(() => movePal(mPal, -1)); ok((await pg.evaluate(() => listaPal("com")[0].id)) === id2, "Palestra: subir na lista");
await pg.evaluate(() => mudaSecPal(mPal, "sem")); ok((await pg.evaluate((id) => palestra[id].sec + "|" + qAtual().mom, id2)) === "sem|def", "Palestra: mudar para SEM BOLA");
await pg.evaluate(() => { mEdit = true; renderModelo(); }); await toca("#pq-del"); ok(await pg.evaluate((id) => !!palestra[id], id2), "Palestra: apagou com 1 toque");
await toca("#pq-del"); await pg.waitForTimeout(100); ok(await pg.evaluate((id) => !palestra[id], id2), "Palestra: apagar com 2 toques " + JSON.stringify(await pg.evaluate((id) => ({ existe: !!palestra[id], mPal, edit: mEdit, btn: $("pq-del") && $("pq-del").textContent }), id2)));
await pg.evaluate(() => desfazModelo()); ok(await pg.evaluate((id) => !!palestra[id], id2), "Palestra: desfazer não repôs o quadro apagado");
// sair para o Modelo de Jogo: o editor volta ao seu separador, o Modelo não vê os quadros da Palestra
await toca("#tab-m"); await pg.waitForTimeout(150);
const mod = await pg.evaluate(() => ({ editor: !!$("view-m").querySelector("#m-stage"), mPal, lista: listaModelos().some((q) => String(q.id).startsWith("pl")) }));
ok(mod.editor && mod.mPal === null && !mod.lista, "Palestra → Modelo: editor não voltou " + JSON.stringify(mod));
// recarregar: os quadros ficam (local) e o quadro aberto volta
await pg.reload(); await pg.waitForTimeout(900); await toca("#tab-l"); await pg.waitForTimeout(200);
const rec = await pg.evaluate(() => ({ com: listaPal("com").length, sem: listaPal("sem").length, passos: Object.values(palestra).map((q) => q.passos.length).sort().join(","), aberto: mPal }));
ok(rec.com === 1 && rec.sem === 1 && rec.passos === "3,3", "Palestra: depois de recarregar " + JSON.stringify(rec));
// Apresentar: onze, (adv), COM, SEM, setups; › anda o passo; Esc fecha
await pg.evaluate(() => { plSec = "onze"; plCur = null; renderPalestra(); }); await toca("#pl-apr"); await pg.waitForSelector(".present #pa-b");
const ap = await pg.evaluate(() => ({ n: slidesPalestra().length, t: document.querySelector(".present .t").textContent }));
ok(/^1\//.test(ap.t) && ap.n >= 3, "Palestra: Apresentar " + JSON.stringify(ap));
await pg.keyboard.press("ArrowRight"); await pg.keyboard.press("ArrowRight"); await pg.waitForTimeout(100);
const apQ = await pg.evaluate(() => document.querySelector(".present .t").textContent); ok(/COM BOLA/.test(apQ) || /SEM BOLA/.test(apQ), "Palestra: Apresentar devia chegar a um quadro " + apQ);
await pg.keyboard.press("ArrowRight"); await pg.waitForTimeout(150); ok(await pg.evaluate(() => /passo [12]\/3/.test(document.querySelector(".present .t").textContent)), "Palestra: → num quadro devia andar um passo");
// v123.1: na apresentação as peças mexem-se, mas nada se grava; ↺ Repor e mudar de slide voltam ao gravado
{ const antes = await pg.evaluate(() => JSON.stringify(palestra));
  const alvo = await pg.evaluate(() => { const c = [...document.querySelectorAll(".present .pstage [data-p]")].map((e) => e.getBoundingClientRect()).find((r) => r.width > 4); return c && { x: c.x + c.width / 2, y: c.y + c.height / 2 }; });
  const pos = () => pg.evaluate(() => { const e = [...document.querySelectorAll(".present .pstage [data-p]")].map((e) => e.getBoundingClientRect()).find((r) => r.width > 4); return e && Math.round(e.x); });
  const x0 = await pos(); await pg.mouse.move(alvo.x, alvo.y); await pg.mouse.down(); for (let k = 1; k <= 6; k++) await pg.mouse.move(alvo.x + k * 15, alvo.y + k * 5); await pg.mouse.up(); await pg.waitForTimeout(100);
  const x1 = await pos(), depois = await pg.evaluate(() => JSON.stringify(palestra)), aberta = await pg.evaluate(() => !!document.querySelector(".present"));
  ok(aberta && x1 > x0 + 30 && depois === antes, "Apresentar: mexer numa peça do quadro sem gravar " + JSON.stringify({ x0, x1, gravou: depois !== antes }));
  await pg.click("#pa-rp"); await pg.waitForTimeout(80); ok(Math.abs((await pos()) - x0) < 2, "Apresentar: ↺ Repor não voltou ao gravado");
  // onze (slide 1): arrastar uma bolinha não mexe no jogo
  const t0 = await pg.evaluate(() => document.querySelector(".present .t").textContent); await pg.keyboard.press("Home");
  const onzeAntes = await pg.evaluate(() => JSON.stringify(jogo.onze)); await pg.click("#pa-a"); for (let k = 0; k < 20 && !/^1\//.test(await pg.evaluate(() => document.querySelector(".present .t").textContent)); k++) await pg.click("#pa-a");
  const b = await pg.evaluate(() => { const r = document.querySelector(".present .pstage g.bola").getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await pg.mouse.move(b.x, b.y); await pg.mouse.down(); for (let k = 1; k <= 6; k++) await pg.mouse.move(b.x + k * 15, b.y); await pg.mouse.up(); await pg.waitForTimeout(80);
  const tr = await pg.evaluate(() => document.querySelector(".present .pstage g.bola").getAttribute("transform"));
  ok(tr && /translate/.test(tr) && (await pg.evaluate(() => JSON.stringify(jogo.onze))) === onzeAntes, "Apresentar: arrastar no onze devia mexer sem gravar " + tr);
  for (let k = 0; k < 20 && (await pg.evaluate(() => document.querySelector(".present .t").textContent)) !== t0; k++) await pg.click("#pa-b"); }
await pg.screenshot({ path: join(cap, "palestra-apresentar.png") });
await pg.keyboard.press("Escape"); ok(!(await pg.locator(".present").count()), "Palestra: Esc não fechou");
// bolas paradas: só setups (sem lances que seguem outro)
const bp = await pg.evaluate(() => { const S = setupsPal(); return { n: S.length, segue: S.some((L) => L.base && baseDe(L) && !eProprio(L)), nav: document.querySelectorAll("#pl-nav [data-bp]").length }; });
ok(bp.n > 0 && !bp.segue && bp.nav === bp.n, "Palestra: setups das bolas paradas " + JSON.stringify(bp));
await pg.evaluate(() => { plSec = "bp"; plBp = null; renderPalestra(); }); ok(await pg.evaluate(() => !!$("pl-stage").querySelector("svg") && !$("pl-stage").querySelector(".seta")), "Palestra: setup sem desenho ou com setas");
await pg.screenshot({ path: join(cap, "palestra-bolas-paradas.png") });
// v123.3: ocultar bolas paradas e quadros (fora da apresentação e do PDF; ficam na lista esbatidos)
{ await toca("#pl-esc"); await toca("#es-of"); await toca("#es-ok"); await pg.waitForTimeout(100);
  const oc = await pg.evaluate(() => ({ vis: setupsVisiveis().map((L) => L.tipo), todos: setupsPal().length, nav: document.querySelectorAll("#pl-nav [data-bp]").length, esb: [...document.querySelectorAll("#pl-nav [data-bp]")].filter((b) => b.style.opacity === "0.5").length,
    slides: slidesPalestra().filter((s) => s.k.startsWith("bp:")).length, guardado: (palJogo.atual.ocultos || []).length }));
  ok(oc.vis.length && oc.vis.every((t) => t === "OF") && oc.nav === oc.todos && oc.esb === oc.todos - oc.vis.length && oc.slides === oc.vis.length && oc.guardado === oc.esb, "Palestra: ocultar bolas paradas " + JSON.stringify(oc));
  const q1 = await pg.evaluate(() => { const Q = listaPal("sem")[0]; plMostraOculta(["pl:" + Q.id], true); return { slides: slidesPalestra().some((s) => s.id === Q.id), nav: !!document.querySelector(`#pl-nav [data-id="${Q.id}"]`) }; });
  ok(!q1.slides && q1.nav, "Palestra: ocultar um quadro " + JSON.stringify(q1)); }
// PDF: identificação, 2 onzes, 1 quadro de 3 passos (1 página) × 2, setups 2 por página
const [dl] = await Promise.all([pg.waitForEvent("download", { timeout: 90000 }), pg.evaluate(() => pdfPalestra())]);
const f = join(cap, "palestra.pdf"); await dl.saveAs(f); const pdf = readFileSync(f, "latin1"), nPg = (pdf.match(/\/Type\s*\/Page[^s]/g) || []).length;
const esperado = await pg.evaluate(() => 3 + quadrosVisiveis("com").length + quadrosVisiveis("sem").length + Math.ceil(setupsVisiveis().length / 2));   // os ocultos não entram
ok(nPg === esperado && statSync(f).size > 100000, `Palestra: PDF com ${nPg} páginas (esperado ${esperado}), ${statSync(f).size} bytes`);
// arquivar: os quadros passam para o jogo seguinte e fica uma cópia no arquivado
const arq = await pg.evaluate(() => { const n0 = listaPal("com").length + listaPal("sem").length; arquivaPalestra("Jteste", true);
  const copias = Object.values(palestra).filter((q) => q.jogo === "Jteste"); return { n0, atual: listaPal("com").length + listaPal("sem").length, copias: copias.length, liga: copias.every((q) => palestra[q.copiaDe]), pj: !!palJogo.Jteste }; });
ok(arq.atual === arq.n0 && arq.copias === arq.n0 && arq.liga && arq.pj, "Palestra: arquivar " + JSON.stringify(arq));
// cópia de segurança: inclui a Palestra
const bk = await pg.evaluate(() => { let B = null; const orig = window.claude; return JSON.stringify(Object.keys({ palestra, palestraJogo: palJogo })); });
ok(/palestra/.test(readFileSync(join(raiz, "src/js/15-copia-de-seguranca.js"), "utf8")) && /palestraJogo/.test(readFileSync(join(raiz, "tools/copia-diaria.mjs"), "utf8")), "Palestra: cópia de segurança / diária sem as coleções novas");

await browser.close();
if (erros.length) { console.log("FALHOU:\n" + erros.join("\n")); process.exit(1); }
console.log(`Palestra OK${ipad ? " (WebKit/iPad)" : ipadChrome ? " (Chromium com ecrã e toque de iPad)" : ""}`);
