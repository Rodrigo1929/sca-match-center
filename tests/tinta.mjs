// Teste da tinta da apresentação (laser, caneta, setas) — v112.26
// Uso: npm run build && node tests/tinta.mjs [--ipad]
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
let falhas = 0; const ok = (c, m) => { console.log((c ? "✓ " : "✗ ") + m); if (!c) falhas++; };
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href); await pg.waitForTimeout(800);

const caixa = () => pg.evaluate(() => { const b = document.querySelector(".present .pstage > svg").getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
// traço: no PC com o rato; no iPad com eventos de toque no retângulo da tinta
const traco = async (fx0, fy0, fx1, fy1) => { const b = await caixa(), a = { x: b.x + b.w * fx0, y: b.y + b.h * fy0 }, z = { x: b.x + b.w * fx1, y: b.y + b.h * fy1 };
  if (!ipad) { await pg.mouse.move(a.x, a.y); await pg.mouse.down(); for (let i = 1; i <= 8; i++) await pg.mouse.move(a.x + (z.x - a.x) * i / 8, a.y + (z.y - a.y) * i / 8 + Math.sin(i) * 6); await pg.mouse.up(); }
  else await pg.evaluate(({ a, z }) => { const r = document.querySelector(".present g.tinta > rect"), ev = (t, p) => r.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerType: "touch", pointerId: 3, clientX: p.x, clientY: p.y, buttons: t === "pointerup" ? 0 : 1 }));
    ev("pointerdown", a); for (let i = 1; i <= 8; i++) ev("pointermove", { x: a.x + (z.x - a.x) * i / 8, y: a.y + (z.y - a.y) * i / 8 }); ev("pointerup", z); }, { a, z });
  await pg.waitForTimeout(100); };
const nTr = () => pg.evaluate(() => document.querySelectorAll(".present g.tinta polyline, .present g.tinta line, .present g.tinta polygon").length);
const tecla = async (k) => { if (ipad) await pg.click(`.ptinta [data-m="${{ l: "laser", p: "caneta", a: "seta" }[k]}"]`); else await pg.keyboard.press(k); await pg.waitForTimeout(80); };

/* ---------- Apresentação do Quadro ---------- */
await pg.click("#tab-q"); await pg.evaluate(() => { curId = "espacos"; render(); });   // v123.2: o Quadro Dinâmico voltou ao separador Bolas Paradas
const antes = await pg.evaluate(() => JSON.stringify(lanceAtual()));
await pg.click("#btn-present"); await pg.waitForTimeout(300);
ok(await pg.locator(".present .ptinta").count() === 1, "a apresentação tem a barra da tinta");
ok(await pg.evaluate(() => document.querySelector(".present").classList.contains("laser") && document.querySelector('.ptinta [data-m="laser"]').getAttribute("aria-pressed") === "true"), "abre com o laser ligado");
if (!ipad) { const b = await caixa(); await pg.mouse.move(b.x + b.w / 2, b.y + b.h / 2); await pg.waitForTimeout(80);
  ok(await pg.evaluate(() => getComputedStyle(document.querySelector(".plaser")).display === "block" && getComputedStyle(document.querySelector(".present .pstage svg")).cursor === "none"), "rato = ponto laser (sem a seta do rato)"); }
await tecla("p"); ok(await pg.evaluate(() => tinta.modo === "caneta"), "P (ou botão) → caneta");
await traco(.3, .3, .5, .4); ok(await nTr() === 1, "caneta desenha um traço");
await tecla("a"); await traco(.4, .6, .7, .6); ok(await nTr() === 3, "seta desenha linha + ponta");
await pg.screenshot({ path: join(cap, ipad ? "tinta-ipad.png" : "tinta.png") });
ok(await pg.evaluate(() => JSON.stringify(lanceAtual())) === antes, "desenhar não mexe no lance");
if (!ipad) { await pg.keyboard.press("e"); ok(await nTr() === 0, "E apaga o desenho"); await traco(.3, .3, .5, .4); }
else { await pg.click(".ptinta [data-x]"); ok(await nTr() === 0, "🧽 apaga o desenho"); await traco(.3, .3, .5, .4); }
const t0 = await pg.evaluate(() => curId);
if (!ipad) await pg.keyboard.press("ArrowRight"); else await pg.click("#pn"); await pg.waitForTimeout(200);
ok(await pg.evaluate((t0) => curId !== t0, t0) && await nTr() === 0, "mudar de slide limpa o desenho");
ok(await pg.evaluate(() => tinta.modo === "seta"), "a ferramenta escolhida mantém-se no slide seguinte");
if (!ipad) { await pg.keyboard.press("Escape"); ok(await pg.locator(".present").count() === 1 && await pg.evaluate(() => tinta.modo === "laser"), "Esc com a caneta → volta ao laser (não fecha)");
  await pg.keyboard.press("Escape"); ok(await pg.locator(".present").count() === 0, "2.º Esc fecha a apresentação"); }
else await pg.click("#px");

/* ---------- Apresentação do Modelo de Jogo ---------- */
await pg.click("#tab-m"); await pg.click("#m-novo2"); await pg.fill("#mn-n", "Teste tinta"); await pg.click("#mn-ok"); await pg.waitForTimeout(300);
await pg.evaluate(() => apresentaModelo()); await pg.waitForTimeout(300);
ok(await pg.evaluate(() => tinta.modo === "laser"), "Modelo: abre com o laser");
await tecla("p"); await traco(.2, .2, .6, .5);
ok(await nTr() === 1, "Modelo: caneta desenha");
ok(await pg.evaluate(() => /Animar/.test(document.querySelector("#ma-pl").textContent)), "Modelo: desenhar não põe a animação a andar");
ok(!erros.length, "sem erros de JavaScript" + (erros.length ? ": " + erros.join(" / ") : ""));
await browser.close(); process.exit(falhas ? 1 : 0);
