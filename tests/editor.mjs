// Teste do editor de figuras (Modelo de Jogo / exercícios) e das caixas de texto do Quadro — v112.21
// Uso: npm run build && node tests/editor.mjs [--ipad]
import { chromium, webkit, devices } from "playwright";
import { join, dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ipad = process.argv.includes("--ipad");
const cap = join(raiz, "tests/capturas/editor"); mkdirSync(cap, { recursive: true });
const browser = ipad ? await webkit.launch() : await chromium.launch();
const pg = ipad ? await (await browser.newContext({ ...devices["iPad (gen 7) landscape"] })).newPage() : await browser.newPage({ viewport: { width: 1366, height: 900 } });
const erros = []; pg.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push(s); });
let falhas = 0; const ok = (c, msg) => { console.log((c ? "✓ " : "✗ ") + msg); if (!c) falhas++; };
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href); await pg.waitForTimeout(800);

const centro = async (sel) => { const b = await pg.locator(sel).first().boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
const arrasta = async (p, dx, dy, passos = 8) => { await pg.mouse.move(p.x, p.y); await pg.mouse.down(); for (let i = 1; i <= passos; i++) await pg.mouse.move(p.x + dx * i / passos, p.y + dy * i / passos); await pg.mouse.up(); await pg.waitForTimeout(150); };
const folhaAberta = () => pg.evaluate(() => !!document.querySelector("#sheet-root").innerHTML);
// iPad: pointerdown de toque sem mexer durante 0,7 s → menu (o Playwright não simula dedo pressionado)
const dedoPressionado = async (sel) => { await pg.evaluate((sel) => { const e = document.querySelector(sel), b = e.getBoundingClientRect();
  e.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "touch", pointerId: 7, clientX: b.x + b.width / 2, clientY: b.y + b.height / 2, button: 0 })); }, sel);
  await pg.waitForTimeout(700); return (await pg.locator(".mmenu button").count()) > 0; };
const fechaFolha = () => pg.evaluate(() => { const b = document.querySelector("#sheet-root [data-close]"); if (b) b.click(); });

/* ---------- editor de figuras ---------- */
await pg.click("#tab-m"); await pg.click("#m-novo2"); await pg.fill("#mn-n", "Teste editor"); await pg.click("#mn-ok"); await pg.waitForTimeout(300);
if (!(await pg.evaluate(() => mEdit))) await pg.click("#m-ed"); await pg.waitForTimeout(300);
const pos = (id) => pg.evaluate((id) => { const Q = qAtual(); return Q.passos[passoAtual()].pos[id]; }, id);
const ids = await pg.evaluate(() => { const Q = qAtual(); return { nos: Q.pecas.find((p) => p.eq === "nos").id, bola: Q.pecas.find((p) => p.eq === "bola").id }; });

// 1) mexer 3 px = clique (abre a folha, a peça não sai do sítio); arrastar 40 px = arrasto (não abre a folha)
const p0 = await pos(ids.nos), c0 = await centro(`[data-p="${ids.nos}"]`);
await arrasta(c0, 3, 0, 3);
ok(await folhaAberta(), "clique (3 px) abre a folha da peça"); ok(JSON.stringify(await pos(ids.nos)) === JSON.stringify(p0), "clique não mexe a peça"); await fechaFolha();
await arrasta(c0, 40, 0);
ok(!(await folhaAberta()), "arrastar 40 px não abre a folha"); ok((await pos(ids.nos)).x > p0.x + 1, "arrastar 40 px mexe a peça");

// 2) bola encostada ao jogador: agarrar no centro do jogador mexe o jogador, não a bola
await pg.evaluate(({ nos, bola }) => { editaQ((Q) => { const P = Q.passos[passoAtual()].pos; P[bola] = { x: P[nos].x + 1.0, y: P[nos].y }; }); }, ids);
const b0 = await pos(ids.bola), n1 = await pos(ids.nos), c1 = await centro(`[data-p="${ids.nos}"]`);
await arrasta(c1, 0, 50);
ok(JSON.stringify(await pos(ids.bola)) === JSON.stringify(b0), "bola encostada não se mexe ao arrastar o jogador"); ok((await pos(ids.nos)).y > n1.y + 1, "o jogador mexe-se");

// 3) zona circular desenhada, com pegas; pega do lado direito aumenta a largura
await pg.click('#m-tool button[data-k="zona"]'); await pg.click('#m-sub button[data-f="elip"]');
const sv = await pg.locator("#m-stage svg").first().boundingBox();
await arrasta({ x: sv.x + sv.width * 0.30, y: sv.y + sv.height * 0.55 }, 120, 80);
const z = () => pg.evaluate(() => qAtual().passos[passoAtual()].zonas);
let zs = await z(); ok(zs.length === 1 && zs[0].forma === "elip", "zona circular criada (forma elip)");
ok(await pg.locator("#m-stage ellipse").count() > 0, "a zona desenha-se como elipse");
await pg.click('#m-tool button[data-k="mover"]'); await pg.waitForTimeout(200);
ok(await pg.evaluate(() => new Set([...document.querySelectorAll("[data-zh]")].map((e) => e.dataset.zh)).size) === 8, "zona selecionada mostra 8 pegas");
const w0 = zs[0].w; await arrasta(await centro(`[data-zh="${zs[0].id}:21"]`), 60, 0);
zs = await z(); ok(zs[0].w > w0 + 2, `pega do lado direito alarga a zona (${w0.toFixed(1)} → ${zs[0].w.toFixed(1)})`);
await pg.screenshot({ path: join(cap, "zona-elipse.png") });
// a imagem do PDF (canvas) também desenha a zona oval: píxel do centro da zona fica amarelado
ok(await pg.evaluate(() => { const Q = qAtual(), z = Q.passos[0].zonas[0], c = document.createElement("canvas"); c.width = 1600; c.height = 900; const cx = c.getContext("2d"); pintaModeloCanvas(cx, Q, 0, 1600, 900);
  const V = vistaQ(Q), [x, y] = V.P(z.x + z.w / 2, z.y + z.h * 0.15), s = Math.min(1600 / MV.W, 900 / MV.H), d = cx.getImageData(Math.round((1600 - MV.W * s) / 2 + x * s), Math.round((900 - MV.H * s) / 2 + y * s), 1, 1).data; return d[2] < d[0] - 20; }), "PDF/imagem: a zona oval desenha-se no canvas");

// 4) botão direito: zona (Duplicar) e peça (Duplicar / Apagar)
if (!ipad) {
  await pg.click(`[data-z="${zs[0].id}"]`, { button: "right", force: true });
  ok(await pg.locator(".mmenu button", { hasText: "Duplicar" }).count() === 1, "botão direito na zona tem Duplicar");
  await pg.locator(".mmenu button", { hasText: "Duplicar" }).click(); ok((await z()).length === 2, "Duplicar cria a 2.ª zona");
  await pg.click(`[data-p="${ids.nos}"]`, { button: "right", force: true });
  const itens = await pg.locator(".mmenu button").allTextContents();
  ok(itens.some((t) => /Duplicar/.test(t)) && itens.some((t) => /Apagar/.test(t)), "botão direito na peça: " + itens.join(" | "));
  await pg.keyboard.press("Escape");
} else {
  ok(await dedoPressionado(`[data-z="${zs[0].id}"]`), "iPad: dedo pressionado na zona abre o menu"); await pg.evaluate(() => fechaMenuContexto());
  ok(await dedoPressionado(`[data-p="${ids.nos}"]`), "iPad: dedo pressionado na peça abre o menu"); await pg.evaluate(() => fechaMenuContexto());
}

/* ---------- Quadro: caixa de texto com pegas e botão direito ---------- */
await pg.click("#tab-q"); await pg.waitForTimeout(300);
await pg.evaluate(() => { curId = lances().find((l) => !l.dinamico && !l.livre && (l.textos || []).length > 1).id; render(); });
await pg.click("#btn-edit"); await pg.waitForTimeout(300);
const tx = () => pg.evaluate(() => lanceAtual().textos.map((t) => ({ x: t.x, w: t.w, h: t.h })));
ok(await pg.locator("#stage g.pegas").count() > 0, "caixas de texto mostram pegas em edição");
const t0 = (await tx())[0], hd = pg.locator("#stage g.pegas").first().locator("rect").nth(7);   // ordem: fx 0..2 × fy 0..2 sem o meio → índice 7 = (2,1) lado direito
const hb = await hd.boundingBox(); await arrasta({ x: hb.x + hb.width / 2, y: hb.y + hb.height / 2 }, -60, 0);
const t1 = (await tx())[0]; ok(t1.w < t0.w, `pega do lado direito estreita a caixa (${t0.w} → ${t1.w})`);
await pg.screenshot({ path: join(cap, "quadro-texto.png") });
if (!ipad) {
  const n0 = (await tx()).length;
  // centro do 1.º texto (coordenadas do slide → ecrã)
  const pt = await pg.evaluate(() => { const T = lanceAtual().textos[0], s = document.querySelector("#stage svg"), p = s.createSVGPoint(); p.x = T.x + T.w / 2; p.y = T.y + T.h / 2; const q = p.matrixTransform(s.getScreenCTM()); return { x: q.x, y: q.y }; });
  await pg.mouse.click(pt.x, pt.y, { button: "right" });
  const it = await pg.locator(".mmenu button").allTextContents(); ok(it.join("|") === "⧉ Duplicar|✎ Editar…|🗑 Apagar texto", "botão direito no texto do Quadro: " + it.join(" | "));
  await pg.locator(".mmenu button", { hasText: "Duplicar" }).click(); ok((await tx()).length === n0 + 1, "Duplicar no Quadro cria mais um texto");
  ok(!(await folhaAberta()), "o botão direito não abre a folha do texto");
} else {
  const n0 = (await tx()).length;
  ok(await pg.evaluate(() => { const g = [...document.querySelectorAll("#stage g.leg")].find((x) => x.querySelector("text") && x.textContent.includes(lanceAtual().textos[0].paras[0].runs[0].t.trim().slice(0, 8))); if (g) g.setAttribute("data-teste", "1"); return !!g; }), "iPad: encontrei o 1.º texto");
  ok(await dedoPressionado('#stage g[data-teste="1"] text'), "iPad: dedo pressionado no texto abre o menu");
}

ok(!erros.length, "sem erros de JavaScript" + (erros.length ? ": " + erros.join(" / ") : ""));
await browser.close(); process.exit(falhas ? 1 : 0);
