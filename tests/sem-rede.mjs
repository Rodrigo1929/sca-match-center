// v113.5: PDF, Excel e vídeo sem internet (bibliotecas embutidas). Todos os pedidos http(s) são cortados.
// Uso: npm run test:sem-rede   (--ipad = WebKit com ecrã de iPad; outro ficheiro: node tests/sem-rede.mjs <caminho.html>)
import { chromium, webkit, devices } from "playwright";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ipad = process.argv.includes("--ipad");
const ficheiro = process.argv.slice(2).find((a) => !a.startsWith("--")) || join(raiz, "dist/index.html");
const browser = ipad ? await webkit.launch() : await chromium.launch();
const ctx = ipad ? await browser.newContext({ ...devices["iPad (gen 7) landscape"], acceptDownloads: true }) : await browser.newContext({ acceptDownloads: true });
const pedidos = [];
await ctx.route(/^https?:/, (r) => { pedidos.push(r.request().url()); return r.abort(); });
const pg = await ctx.newPage();
const erros = []; pg.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push(s); });
await pg.goto(pathToFileURL(resolve(ficheiro)).href);
await pg.waitForTimeout(800);

const falhas = [];
const passo = async (nome, f) => { try { await f(); } catch (e) { falhas.push(nome + ": " + String(e).split("\n")[0]); } };
const comPrazo = (p) => Promise.race([p, new Promise((_, ko) => setTimeout(() => ko(new Error("demorou mais de 30 s")), 30000))]);

await passo("relatório PDF", () => comPrazo(pg.evaluate(async () => { const r = await relatorioPdf(jogoAtualRel()); if (!window.jspdf || !window.jspdf.jsPDF.API.autoTable) throw new Error("sem jsPDF/AutoTable"); return !!r; })));
await passo("ficha de jogo PDF", () => comPrazo(pg.evaluate(async () => { await fichaPdf(jogoAtualRel()); })));
// fora do link não há capacidade de descarga (window.claude): confirma-se que o Excel chega a ser montado
await passo("Excel", () => comPrazo(pg.evaluate(async () => { await exportaXlsx(); if (typeof XLSX === "undefined") throw new Error("sem SheetJS");
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["a", 1]]), "T"); if (!(XLSX.write(wb, { type: "array", bookType: "xlsx" }).byteLength > 1000)) throw new Error("xlsx vazio"); })));
await passo("vídeo (mp4-muxer)", () => comPrazo(pg.evaluate(async () => { await carregaScript("https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.js"); if (!window.Mp4Muxer || !window.Mp4Muxer.Muxer) throw new Error("sem Mp4Muxer"); })));
await passo("biblioteca só uma vez", () => pg.evaluate(async () => { const n = document.head.querySelectorAll("script").length; await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"); if (document.head.querySelectorAll("script").length !== n) throw new Error("voltou a injetar"); }));

await browser.close();
const cdn = pedidos.filter((u) => /cdnjs|jsdelivr/.test(u));
console.log(`${ipad ? "WebKit/iPad" : "Chromium"} · pedidos externos cortados: ${pedidos.length}${pedidos.length ? " (" + [...new Set(pedidos.map((u) => new URL(u).host))].join(", ") + ")" : ""}`);
if (cdn.length) falhas.push("ainda pede bibliotecas à internet: " + [...new Set(cdn)].join(", "));
if (erros.length) falhas.push("erros de JavaScript: " + erros.join(" | "));
if (falhas.length) { console.error("FALHOU\n- " + falhas.join("\n- ")); process.exit(1); }
console.log("OK · relatório PDF, ficha de jogo, Excel e vídeo sem rede");
