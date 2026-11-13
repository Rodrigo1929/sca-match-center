// v114: Pós-jogo › Imagens — carregar um print, desenhar (um material por peça, com propriedades), pegas, desfazer, recortar, ficha, PNG e arquivar.
// Uso: npm run test:imagens   (--ipad = WebKit com ecrã e toque de iPad)
import { chromium, webkit, devices } from "playwright";
import { join, dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ipad = process.argv.includes("--ipad");
const cap = join(raiz, "tests/capturas/imagens"); mkdirSync(cap, { recursive: true });
const browser = ipad ? await webkit.launch() : await chromium.launch();
const pg = ipad ? await (await browser.newContext({ ...devices["iPad (gen 7) landscape"] })).newPage() : await browser.newPage({ viewport: { width: 1366, height: 900 } });
await pg.route(/^https?:/, (r) => (/cdnjs.cloudflare.com/.test(r.request().url()) ? r.continue() : r.abort()));   // o PDF do relatório precisa do jsPDF (cdnjs)
const erros = []; pg.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push(s); });
let falhas = 0; const ok = (c, msg) => { console.log((c ? "✓ " : "✗ ") + msg); if (!c) falhas++; };
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href); await pg.waitForTimeout(800);
// o armazenamento de imagens só existe no claude.ai: aqui é simulado
await pg.evaluate(() => { window.claude = { use: async (n) => n === "assets" ? { upload: async (b) => ({ id: "imgteste" + Math.random().toString(36).slice(2, 10), url: URL.createObjectURL(b) }) } : null }; xAssets = undefined; });

await pg.click("#tab-a"); await pg.click("#av-img"); await pg.waitForTimeout(150);
ok(await pg.evaluate(() => !$("a-imagens").hidden && /Ainda não há imagens/.test($("a-imagens").textContent)), "vista Imagens aberta, sem imagens");
await pg.setInputFiles("#im-file", join(raiz, "assets/slides/b-head.jpg"));
await pg.waitForSelector(".imed .imed-svg", { timeout: 15000 }); await pg.waitForTimeout(300);
const I0 = await pg.evaluate(() => ({ id: imEd.I.id, img: imEd.I.img, jogo: imEd.I.jogo }));
ok(!!I0.img && I0.jogo === "atual", "print carregado e editor aberto " + JSON.stringify(I0.img));

const caixa = async () => pg.locator(".imed-svg").boundingBox();
const em = async (fx, fy) => { const b = await caixa(), I = await pg.evaluate(() => ({ w: imEd.I.img.w, h: imEd.I.img.h }));
  const k = Math.min(b.width / I.w, b.height / I.h), ox = b.x + (b.width - I.w * k) / 2, oy = b.y + (b.height - I.h * k) / 2; return { x: ox + fx * I.w * k, y: oy + fy * I.h * k }; };
const ferr = (f) => pg.click(`#ie-ferr [data-f="${f}"]`);
const arrasta = async (a, b, n = 8) => { await pg.mouse.move(a.x, a.y); await pg.mouse.down(); for (let i = 1; i <= n; i++) await pg.mouse.move(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n); await pg.mouse.up(); await pg.waitForTimeout(80); };
const toca = async (p) => { await pg.mouse.click(p.x, p.y); await pg.waitForTimeout(80); };
const pecas = () => pg.evaluate(() => imEd.I.pecas.map((p) => p.t));

await ferr("seta"); await arrasta(await em(.15, .7), await em(.4, .5));
await ferr("circ"); await toca(await em(.5, .75));
await ferr("luz"); await toca(await em(.65, .8));
await ferr("zona"); await arrasta(await em(.7, .2), await em(.9, .4));
await ferr("txt"); await toca(await em(.3, .2));
await ferr("num"); await toca(await em(.2, .3)); await toca(await em(.25, .35));
await ferr("marca"); await toca(await em(.8, .6));
await ferr("livre"); await arrasta(await em(.1, .1), await em(.3, .15), 12);
const tp = await pecas();
ok(JSON.stringify(tp) === JSON.stringify(["seta", "circ", "luz", "zona", "txt", "num", "num", "marca", "livre"]), "uma peça de cada material: " + tp.join(","));
ok(await pg.evaluate(() => imEd.I.pecas.filter((p) => p.t === "num").map((p) => p.n).join(",") === "1,2"), "números seguidos (1, 2)");
await pg.screenshot({ path: join(cap, "editor-pecas.png") });

// propriedades do material: escolher a seta (Mover), mudar cor, traço e pontas; o mesmo círculo muda tamanho pelas pegas
await ferr("mover"); await toca(await em(.275, .6));
const s0 = await pg.evaluate(() => ({ sel: imEd.sel, t: imEd.I.pecas[imEd.sel] && imEd.I.pecas[imEd.sel].t }));
await pg.click('#ie-prop .imcores [data-c="#E00000"]'); await pg.click('#ie-tr [data-k="onda"]'); await pg.click('#ie-pt [data-k="duas"]');
const s1 = await pg.evaluate(() => { const p = imEd.I.pecas[0]; return { c: p.c, tr: p.tr, pt: p.pt, svg: !!document.querySelector('.imed-svg [data-i="0"] path') }; });
ok(s0.t === "seta" && s1.c === "#E00000" && s1.tr === "onda" && s1.pt === "duas" && s1.svg, "seta escolhida: cor, traço aos S e duas pontas " + JSON.stringify({ ...s0, ...s1 }));
await toca(await em(.5, .75)); const r0 = await pg.evaluate(() => imEd.I.pecas[1].rx);
const pegaRx = await pg.locator('[data-h="1:rx"]').boundingBox(); await arrasta({ x: pegaRx.x + pegaRx.width / 2, y: pegaRx.y + pegaRx.height / 2 }, { x: pegaRx.x + pegaRx.width / 2 + 60, y: pegaRx.y + pegaRx.height / 2 });
const r1 = await pg.evaluate(() => imEd.I.pecas[1].rx);
ok(r1 > r0 * 1.3, `círculo: a pega aumenta a largura (${r0.toFixed(3)} → ${r1.toFixed(3)})`);
await pg.click('#ie-tr [data-k="trac"]');
ok(await pg.evaluate(() => imEd.I.pecas[1].tr === "trac" && imEstilo.circ.tr === "trac"), "círculo tracejado (e as próximas ficam iguais)");
// desfazer e refazer
await pg.click("#ie-undo"); ok(await pg.evaluate(() => imEd.I.pecas[1].tr === "cheio"), "Desfazer volta ao traço cheio");
await pg.click("#ie-redo"); ok(await pg.evaluate(() => imEd.I.pecas[1].tr === "trac"), "Refazer");
// arrastar uma peça
const z0 = await pg.evaluate(() => imEd.I.pecas[3].pts[0][0]); await toca(await em(.8, .3)); await arrasta(await em(.8, .3), await em(.75, .3));
ok(await pg.evaluate((z) => imEd.I.pecas[3].pts[0][0] < z - .02, z0), "arrastar a zona mexe-a");
// luz escurece à volta
await toca(await em(.65, .8)); await pg.locator("#ie-esc").fill("0.5"); await pg.waitForTimeout(80);
ok(await pg.evaluate(() => imEd.I.escuro === .5 && !!document.querySelector(".imed-svg mask")), "escurecer à volta das luzes");
// apagar com a tecla Delete e desfazer
await toca(await em(.8, .6)); await pg.keyboard.press("Delete"); ok((await pecas()).length === 8, "Delete apaga a peça escolhida"); await pg.keyboard.press("Control+z"); ok((await pecas()).length === 9, "Ctrl+Z repõe");

// ficha: título, descrição, momento, jogadores
await pg.fill("#if-t", "Pressão alta depois da perda"); await pg.fill("#if-d", "Reação à perda em 5 segundos.");
await pg.selectOption("#if-p", "2"); await pg.fill("#if-m", "52:30"); await pg.locator("#if-m").dispatchEvent("change");
await pg.click("#if-js button >> nth=1"); await pg.waitForTimeout(100);
const fi = await pg.evaluate(() => ({ t: imEd.I.titulo, temT: imEd.I.temT, parte: imEd.I.parte, seg: imEd.I.seg, js: imEd.I.js.length, tit: document.querySelector(".imed-tit").textContent }));
ok(fi.t === "Pressão alta depois da perda" && fi.temT && fi.parte === 2 && fi.seg === 450 && fi.js === 1 && /52:30/.test(fi.tit), "ficha: título, 2.ª parte 52:30, 1 jogador " + JSON.stringify(fi));
// texto com o jogador escolhido
await toca(await em(.3, .2)); const jn = await pg.evaluate(() => imEd.I.js[0]); await pg.click(`#ie-prop [data-jt="${jn}"]`);
ok(await pg.evaluate((n) => imEd.I.pecas[4].s.startsWith(n + "."), jn), "texto com «nº. nome» do jogador");
// recortar e voltar
await ferr("crop"); await arrasta(await em(.1, .1), await em(.8, .85));
const cr = await pg.evaluate(() => imEd.I.crop); ok(cr && cr.w > .6 && cr.w < .75, "recortar " + JSON.stringify(cr));
await pg.screenshot({ path: join(cap, "editor-recortado.png") });

// PNG (print recortado + desenho)
const png = await pg.evaluate(async () => { imGravaJa(); const cv = await canvasImagem(imagens[imEd.I.id]); return { w: cv.width, h: cv.height, cheio: cv.toDataURL().length > 20000 }; });
ok(png.w > 100 && Math.abs(png.w / png.h - (cr.w * I0.img.w) / (cr.h * I0.img.h)) < .02 && png.cheio, "PNG com o recorte " + JSON.stringify(png));
await pg.click("#ie-semcrop"); ok(await pg.evaluate(() => imEd.I.crop === null), "Sem recorte");
await pg.click("#ie-ok"); await pg.waitForTimeout(150);
const lista = await pg.evaluate(() => ({ cards: document.querySelectorAll("#im-grid .imcard").length, txt: $("im-grid").textContent, gravada: imagens[Object.keys(imagens)[0]].pecas.length }));
ok(lista.cards === 1 && /2\.ª · 52:30/.test(lista.txt) && /Pressão alta/.test(lista.txt) && lista.gravada === 9, "lista com a imagem, o momento e o título");
await pg.screenshot({ path: join(cap, "lista.png") });
// v114.1: a imagem entra no relatório para jogadores — grupo, individual do jogador marcado (não no de outro), ecrãs; desmarcar tira-a
const rel = await pg.evaluate(async () => { const G = jogoAtualRel(), R = clone(relJogDe(G)), I = Object.values(imagens)[0], k = I.js[0], outro = jogadoresRel(G).find((n) => !I.js.includes(String(n))) || "zz";
  const t = async (kk, RR) => (await pdfRelJog(G, kk, RR)).output();
  const g = await t(null, R), ind = await t(k, R), out = await t(outro, R), e0 = (await ecrasRelJog(G, null, { ...R, semImg: [I.id] })).length, e1 = (await ecrasRelJog(G, null, R)).length;
  const sem = await t(null, { ...R, semImg: [I.id] });
  return { g: g.includes("IMAGENS DO JOGO") && g.includes("alta depois"), ind: ind.includes("AS TUAS IMAGENS"), out: !out.includes("AS TUAS IMAGENS"), ecras: e1 - e0, sem: !sem.includes("IMAGENS DO JOGO") }; });
ok(rel.g && rel.ind && rel.out && rel.ecras === 1 && rel.sem, "relatório para jogadores: grupo, individual do marcado, não no de outro, 1 ecrã, desmarcar tira " + JSON.stringify(rel));
await pg.evaluate(() => { folhaRelJog(jogoAtualRel()); }); await pg.waitForSelector("#rj-im [data-im]");
await pg.screenshot({ path: join(cap, "folha-relatorio.png") });
await pg.click("#rj-im [data-im]"); await pg.click("#rj-ok"); await pg.waitForTimeout(100);
ok(await pg.evaluate(() => (relJogs.atual.semImg || []).length === 1), "folha do relatório: desmarcar a imagem fica gravado");
await pg.evaluate(async () => { const G = jogoAtualRel(), R = clone(relJogDe(G)); R.semImg = []; gravaRelJog(R); const cv = (await ecrasRelJog(G, null, R)).slice(-1)[0]; window.__ecra = cv.toDataURL("image/jpeg", .8); });
{ const b64 = (await pg.evaluate(() => window.__ecra)).split(",")[1]; (await import("node:fs")).writeFileSync(join(cap, "ecra-imagem.jpg"), Buffer.from(b64, "base64")); }
// arquivar o jogo: a imagem passa para o jogo arquivado; cópia de segurança leva as imagens
const arq = await pg.evaluate(() => { arquivaImagens("Jteste1"); const I = Object.values(imagens)[0]; return { jogo: I.jogo, atual: imagensDe("atual").length }; });
ok(arq.jogo === "Jteste1" && arq.atual === 0, "ao arquivar o jogo, a imagem passa para o arquivo");
// apagar (2 toques) e Desfazer
await pg.evaluate(() => { arquivaImagens; Object.values(imagens).forEach((I) => gravaImagem({ ...I, jogo: "atual" })); renderImagens(); });
await pg.click('#im-grid [data-a="del"]'); await pg.click('#im-grid [data-a="del"]'); await pg.waitForTimeout(100);
ok(await pg.evaluate(() => !Object.keys(imagens).length), "apagar com 2 toques");
await pg.click("#toast-root button"); ok(await pg.evaluate(() => Object.keys(imagens).length === 1), "Desfazer repõe a imagem");

await browser.close();
if (erros.length) { console.log("✗ erros de JavaScript: " + erros.join(" | ")); falhas++; }
console.log(falhas ? `FALHOU (${falhas})` : `OK · Imagens do Pós-jogo (${ipad ? "WebKit/iPad" : "Chromium"})`); process.exit(falhas ? 1 : 0);
