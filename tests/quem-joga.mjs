// v113.10: Quadro Dinâmico — botão «Pôr quem está a jogar» (onze + substituições do jogo; as posições não mudam; Desfazer).
// Uso: npm run test:quem-joga   (--ipad = WebKit com ecrã e toque de iPad)
import { chromium, webkit, devices } from "playwright";
import { join, dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ipad = process.argv.includes("--ipad");
const cap = join(raiz, "tests/capturas"); mkdirSync(cap, { recursive: true });
const browser = ipad ? await webkit.launch() : await chromium.launch();
const pg = ipad ? await (await browser.newContext({ ...devices["iPad (gen 7) landscape"] })).newPage() : await browser.newPage({ viewport: { width: 1366, height: 900 } });
await pg.route(/^https?:/, (r) => r.abort());
const erros = []; pg.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push(s); });
let falhas = 0; const ok = (c, msg) => { console.log((c ? "✓ " : "✗ ") + msg); if (!c) falhas++; };
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href); await pg.waitForTimeout(800);

const estado = () => pg.evaluate(() => ({ botao: !$("q-joga").hidden && +$("q-joga").dataset.n > 0 ? $("q-joga").textContent : null, certo: !$("q-joga").hidden && $("q-joga").dataset.n === "0" && /✓/.test($("q-joga").textContent), visivel: (() => { const r = $("q-joga").getBoundingClientRect(); return r.height >= 30 && r.top >= 0 && r.bottom <= innerHeight; })(), v: vDoLance(lanceAtual()), pos: lanceAtual().bolas.map((b) => [b.slot, Math.round(b.cx), Math.round(b.cy)].join(":")).join("|") }));
await pg.click("#tab-q"); await pg.evaluate(() => { curId = "espacos"; render(); });
let e = await estado();
ok(e.certo && !e.botao && e.visivel, "sem substituições: botão à vista na barra de cima, com ✓");

// grava o quadro (fica com os jogadores de agora) e faz uma substituição no jogo: sai um titular de campo, entra um suplente
const sub = await pg.evaluate(() => { guardaLance(copiaLance(lanceAtual())); const sai = jogo.onze.find((o) => o.pos !== "GR").n, entra = est.plantel.map((p) => p.n).find((n) => n && !titulares().includes(n));
  guardaJogo({ ...jogo, suplentes: [...new Set([...(jogo.suplentes || []), entra])], subs: [...(jogo.subs || []), { id: "tq1", sai, entra, min: "60:00" }] }, true); render();
  return { sai, entra, conta: subsReais().lista.some((l) => l.id === "tq1"), slot: Object.entries(vDoLance(lanceAtual())).find(([, n]) => n === sai)[0] }; });
e = await estado(); const pos0 = e.pos;
ok(sub.conta && e.botao && /Pôr quem está a jogar \(1\)/.test(e.botao) && e.v[sub.slot] === sub.sai, "depois da substituição aparece o botão (1) e o quadro ainda tem quem saiu: " + e.botao);
await pg.screenshot({ path: join(cap, "quem-joga-antes.png") });

await pg.click("#q-joga"); await pg.waitForTimeout(200);
e = await estado();
ok(e.v[sub.slot] === sub.entra && !Object.values(e.v).includes(sub.sai), `um toque: entra o ${sub.entra} no lugar do ${sub.sai}`);
ok(e.pos === pos0, "as posições das bolinhas não mudam");
ok(e.certo && !e.botao, "o botão dá lugar a «✓ com quem está a jogar»");
ok(await pg.evaluate((n) => [...document.querySelectorAll("#stage svg g.bola text")].some((t) => t.textContent.trim() === String(n)), sub.entra), "a bolinha mostra o número de quem entrou");
ok(/entra/.test(await pg.evaluate(() => $("toast-root").textContent)), "aviso diz quem entrou por quem");
await pg.screenshot({ path: join(cap, "quem-joga-depois.png") });

// Desfazer volta ao que estava; os outros quadros livres não ganham o botão
await pg.evaluate(() => desfazQuadro()); await pg.waitForTimeout(150); e = await estado();
ok(e.v[sub.slot] === sub.sai && !!e.botao, "Desfazer repõe os jogadores e o botão volta");
ok(await pg.evaluate(() => { curId = "livre"; render(); return $("q-joga").hidden; }), "o Quadro Livre fica como estava (sem botão)");

await pg.evaluate(() => { delete lancesDb.espacos; guardaLocal(); });
await browser.close();
if (erros.length) { console.log("✗ erros de JavaScript: " + erros.join(" | ")); falhas++; }
console.log(falhas ? `FALHOU (${falhas})` : `OK · Pôr quem está a jogar (${ipad ? "WebKit/iPad" : "Chromium"})`); process.exit(falhas ? 1 : 0);
