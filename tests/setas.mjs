// v113.7: setas do editor de figuras (Modelo de Jogo / exercícios): remate, estilos (cheio, tracejado, pontinhos, aos S) e cor por seta.
// Uso: npm run test:setas   (--ipad = WebKit com ecrã e toque de iPad)
import { chromium, webkit, devices } from "playwright";
import { join, dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ipad = process.argv.includes("--ipad");
const cap = join(raiz, "tests/capturas/editor"); mkdirSync(cap, { recursive: true });
const browser = ipad ? await webkit.launch() : await chromium.launch();
const pg = ipad ? await (await browser.newContext({ ...devices["iPad (gen 7) landscape"] })).newPage() : await browser.newPage({ viewport: { width: 1366, height: 900 } });
await pg.route(/^https?:/, (r) => r.abort());
const erros = []; pg.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push(s); });
let falhas = 0; const ok = (c, msg) => { console.log((c ? "✓ " : "✗ ") + msg); if (!c) falhas++; };
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href); await pg.waitForTimeout(800);

await pg.click("#tab-m"); await pg.click("#m-novo2"); await pg.fill("#mn-n", "Teste setas"); await pg.click("#mn-ok"); await pg.waitForTimeout(300);
if (!(await pg.evaluate(() => mEdit))) await pg.click("#m-ed"); await pg.waitForTimeout(300);

// uma seta de cada tipo (a condução em curva) e uma pressão com cor própria
await pg.evaluate(() => { editaQ((Q) => { const S = Q.passos[passoAtual()].setas; let y = 12;
  ["passe", "remate", "corrida", "conducao", "pressao"].forEach((t) => { S.push({ id: "t-" + t, t, x1: 30, y1: y, x2: 60, y2: y, ...(t === "conducao" ? { qx: 45, qy: y - 6 } : {}) }); y += 9; });
  S.push({ id: "t-cor", t: "pressao", c: "#1F5FBF", x1: 65, y1: 12, x2: 90, y2: 30 }); }); });
await pg.waitForTimeout(200);
const svg = await pg.evaluate(() => { const st = document.querySelector("#m-stage") || document; const g = (id) => [...st.querySelectorAll(`[data-s="${id}"]`)].filter((e) => e.getAttribute("stroke") !== "rgba(0,0,0,0)");
  const est = (id) => { const e = g(id).find((x) => x.tagName !== "polygon"); return e ? { tag: e.tagName, dash: e.getAttribute("stroke-dasharray") || "", cor: e.getAttribute("stroke"), w: +e.getAttribute("stroke-width"), cap: e.getAttribute("stroke-linecap") } : null; };
  return Object.fromEntries(["passe", "remate", "corrida", "conducao", "pressao", "cor"].map((k) => [k, est("t-" + k)])); });
ok(svg.passe && !svg.passe.dash && svg.remate && !svg.remate.dash, "passe e remate a cheio");
ok(svg.remate.w > svg.passe.w * 1.5, `remate mais grosso que o passe (${svg.remate.w} vs ${svg.passe.w})`);
ok(svg.corrida && svg.corrida.dash && svg.corrida.cap === "butt", "corrida tracejada");
ok(svg.pressao && svg.pressao.dash && svg.pressao.cap === "round" && +svg.pressao.dash.split(" ")[0] < 1, "pressão aos pontinhos");
ok(svg.conducao && svg.conducao.tag === "polyline", "condução aos S (também em curva)");
ok(svg.cor && svg.cor.cor === "#1F5FBF", "seta com cor própria");
await pg.screenshot({ path: join(cap, "setas-tipos.png") });

// barra da ferramenta Seta: escolher Remate e a cor verde, desenhar → a seta nova fica com t e c
await pg.evaluate(() => { mTool = "seta"; renderModelo(); }); await pg.waitForTimeout(150);
await pg.click('#m-sub button[data-k="remate"]'); await pg.click('#m-sub button[data-c="#1E7A46"]'); await pg.waitForTimeout(150);
const nAntes = await pg.evaluate(() => qAtual().passos[passoAtual()].setas.length);
// procura um ponto livre do campo (só o fundo do campo debaixo do rato) e desenha 80 px para a direita
const p0 = await pg.evaluate(() => { const r = document.querySelector("#m-stage svg").getBoundingClientRect();
  for (let fy = .55; fy < .95; fy += .04) for (let fx = .08; fx < .6; fx += .03) { const x = r.x + r.width * fx, y = r.y + r.height * fy, ok = [0, 20, 40, 60, 80].every((d) => { const e = document.elementFromPoint(x + d, y); return e && e.closest("#m-stage svg") && !e.closest("[data-p],[data-s],[data-z]"); }); if (ok) return { x, y }; } return null; });
if (p0) { await pg.mouse.move(p0.x, p0.y); await pg.mouse.down(); for (let i = 1; i <= 8; i++) await pg.mouse.move(p0.x + 10 * i, p0.y); await pg.mouse.up(); await pg.waitForTimeout(200); }
const nova = await pg.evaluate(() => { const S = qAtual().passos[passoAtual()].setas; return { n: S.length, ult: S[S.length - 1] }; });
ok(nova.n === nAntes + 1 && nova.ult.t === "remate" && nova.ult.c === "#1E7A46", "desenhar com Remate + verde grava o tipo e a cor " + JSON.stringify({ t: nova.ult.t, c: nova.ult.c }));
await pg.screenshot({ path: join(cap, "setas-barra.png"), clip: { x: 0, y: 0, width: 1366, height: 260 } });

// folha da seta: mudar a cor e voltar à cor do tipo
await pg.evaluate(() => folhaSetaM("t-passe")); await pg.waitForSelector("#ms-c");
await pg.click('#ms-c button[data-c="#7030A0"]'); await pg.waitForTimeout(100);
const c1 = await pg.evaluate(() => qAtual().passos[passoAtual()].setas.find((s) => s.id === "t-passe").c);
await pg.screenshot({ path: join(cap, "setas-folha.png") });
await pg.click('#ms-c button[data-c=""]'); await pg.waitForTimeout(100);
const c2 = await pg.evaluate(() => qAtual().passos[passoAtual()].setas.find((s) => s.id === "t-passe").c);
ok(c1 === "#7030A0" && c2 === undefined, "folha da seta: escolher cor e voltar à cor do tipo");
await pg.evaluate(() => { const b = document.querySelector("#sheet-root [data-close]"); if (b) b.click(); });

// canvas (vídeo e imagens): a condução aos S também se pinta
const cv = await pg.evaluate(() => { const c = document.createElement("canvas"); c.width = MV.W; c.height = MV.H; const Q = qAtual(); primsCanvas(c.getContext("2d"), primsDinamicas(Q, 0, null)); return c.toDataURL().length > 5000; });
ok(cv, "a figura pinta-se em canvas (vídeo, imagem)");

await browser.close();
if (erros.length) { console.log("✗ erros de JavaScript: " + erros.join(" | ")); falhas++; }
console.log(falhas ? `FALHOU (${falhas})` : `OK · setas (${ipad ? "WebKit/iPad" : "Chromium"})`); process.exit(falhas ? 1 : 0);
