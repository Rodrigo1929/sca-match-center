// v113.5: a app abre com rede, a rede cai, e os PDF continuam a funcionar (o gerador de PDF carrega-se logo ao abrir).
// Precisa de internet para a abertura (cdnjs). Uso: npm run test:sem-rede   (--ipad = WebKit com ecrã de iPad)
import { chromium, webkit, devices } from "playwright";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ipad = process.argv.includes("--ipad");
const browser = ipad ? await webkit.launch() : await chromium.launch();
const ctx = ipad ? await browser.newContext({ ...devices["iPad (gen 7) landscape"] }) : await browser.newContext();
let semRede = false; const cortados = [];
await ctx.route(/^https?:/, (r) => { if (semRede) { cortados.push(r.request().url()); return r.abort(); } return r.continue(); });
const pg = await ctx.newPage();
const erros = []; pg.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push(s); });
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href);

const falhas = [];
// sem tocar em nada: o gerador de PDF fica pronto pouco depois de abrir
const pronto = await pg.waitForFunction(() => !!(window.jspdf && window.jspdf.jsPDF.API.autoTable), null, { timeout: 30000 }).then(() => true, () => false);
if (!pronto) falhas.push("o gerador de PDF não ficou carregado depois de abrir (há internet para o cdnjs?)");
const nTags = await pg.evaluate(() => [...document.scripts].filter((s) => /jspdf/.test(s.src)).length);
if (nTags !== 2) falhas.push(`jsPDF/AutoTable carregados ${nTags} vezes (esperado 2 scripts, um de cada)`);

// a rede cai
semRede = true; await ctx.setOffline(true);
const passo = async (nome, f) => { try { await f(); } catch (e) { falhas.push(nome + ": " + String(e).split("\n")[0]); } };
const comPrazo = (p) => Promise.race([p, new Promise((_, ko) => setTimeout(() => ko(new Error("demorou mais de 30 s")), 30000))]);
await passo("relatório PDF", () => comPrazo(pg.evaluate(async () => { const d = await relatorioPdf(jogoAtualRel()); if (!d) throw new Error("sem PDF"); })));
await passo("ficha de jogo PDF", () => comPrazo(pg.evaluate(async () => { await fichaPdf(jogoAtualRel()); })));
await passo("PDF dos rankings (AutoTable)", () => comPrazo(pg.evaluate(async () => { await carregaJsPdf(true); const d = new window.jspdf.jsPDF(); d.autoTable({ head: [["a"]], body: [["1"]] }); if (d.getNumberOfPages() !== 1) throw new Error("tabela"); })));
await passo("sem scripts repetidos", () => pg.evaluate(() => { if ([...document.scripts].filter((s) => /jspdf/.test(s.src)).length !== 2) throw new Error("voltou a pedir o jsPDF"); }));

await browser.close();
const cdn = cortados.filter((u) => /jspdf/.test(u));
if (cdn.length) falhas.push("sem rede, voltou a pedir o gerador de PDF: " + [...new Set(cdn)].join(", "));
if (erros.length) falhas.push("erros de JavaScript: " + erros.join(" | "));
if (falhas.length) { console.error("FALHOU\n- " + falhas.join("\n- ")); process.exit(1); }
console.log(`OK · ${ipad ? "WebKit/iPad" : "Chromium"} · relatório, ficha de jogo e tabelas em PDF depois de a rede cair`);
