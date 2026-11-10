// v113.5: aviso de jogo por arquivar (só jogos oficiais passados sem jogo no Histórico com a mesma data; jogo atual passado com registos).
// Uso: npm run test:aviso   (--ipad = WebKit com ecrã e toque de iPad)
import { chromium, webkit, devices } from "playwright";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ipad = process.argv.includes("--ipad");
const browser = ipad ? await webkit.launch() : await chromium.launch();
const pg = ipad ? await (await browser.newContext({ ...devices["iPad (gen 7) landscape"] })).newPage() : await browser.newPage({ viewport: { width: 1366, height: 900 } });
await pg.route(/^https?:/, (r) => r.abort());
const erros = []; pg.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push(s); });
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href);
await pg.waitForTimeout(800);

const estado = () => pg.evaluate(() => { const el = $("aviso-arq"); return { visivel: !el.hidden && el.getBoundingClientRect().height > 0, txt: el.textContent }; });
const falhas = [], confere = (cond, msg) => { if (!cond) falhas.push(msg); };

// sem calendário nem jogo: sem aviso
await pg.evaluate(() => { calendario = {}; hist = {}; avisoArquivo(); });
confere(!(await estado()).visivel, "aviso visível sem jogos por arquivar");

// 3 jogos passados (oficial por arquivar, oficial arquivado, jogo-treino), 1 de hoje e 1 futuro
await pg.evaluate(() => { const d = (n) => isoDia(new Date(Date.now() + n * 864e5));
  calendario = Object.fromEntries([
    { id: "jA", data: d(-10), adversario: "Equipa Por Arquivar", competicao: "Campeonato dos Açores", casa: true },
    { id: "jB", data: d(-5), adversario: "Equipa Arquivada", competicao: "Taça AFAH", casa: false },
    { id: "jC", data: d(-3), adversario: "Jogo-treino", competicao: "Jogo particular", casa: true },
    { id: "jD", data: d(0), adversario: "Equipa De Hoje", competicao: "Campeonato dos Açores", casa: true },
    { id: "jE", data: d(7), adversario: "Equipa Futura", competicao: "Campeonato dos Açores", casa: true },
  ].map((j) => [j.id, normJogoCal(j)]));
  hist = { Jx: { id: "Jx", data: d(-5), adversario: "Equipa Arquivada" } }; avisoArquivo(); });
let e = await estado();
confere(e.visivel && /1 jogo por arquivar/.test(e.txt) && /Equipa Por Arquivar/.test(e.txt), "devia avisar só o jogo oficial por arquivar: " + e.txt);
confere(!/Arquivada|Jogo-treino|De Hoje|Futura/.test(e.txt), "avisa jogos que não devia: " + e.txt);

// «Ir arquivar» abre o Histórico
await pg.click("#aa-ir"); await pg.waitForTimeout(200);
confere(await pg.evaluate(() => !$("view-h").hidden), "«Ir arquivar» não abriu o Histórico");

// «Não arquivar» tira o jogo do aviso (fica no calendário) e Desfazer volta a pô-lo
await pg.click('#aviso-arq [data-nao="jA"]'); await pg.waitForTimeout(150);
confere(!(await estado()).visivel, "«Não arquivar» não tirou o aviso");
confere(await pg.evaluate(() => calendario.jA.semArquivo === true && normJogoCal(calendario.jA).semArquivo === true), "semArquivo não ficou gravado no jogo do calendário");
await pg.click("#toast-root button"); await pg.waitForTimeout(150);
confere((await estado()).visivel && !(await pg.evaluate(() => calendario.jA.semArquivo)), "Desfazer não voltou a pôr o jogo no aviso");

// arquivar o jogo (mesma data no Histórico) tira-o do aviso
await pg.evaluate(() => { hist.Jy = { id: "Jy", data: calendario.jA.data, adversario: "Equipa Por Arquivar" }; renderHist(); });
confere(!(await estado()).visivel, "jogo arquivado continua no aviso");

// jogo atual com data passada e registos, fora do calendário
await pg.evaluate(() => { jogo = { ...jogo, data: isoDia(new Date(Date.now() - 2 * 864e5)), adversario: "Amigável Esquecido", eventos: [{ id: "e1", tipo: "golo", n: "7", min: "10:00" }] }; avisoArquivo(); });
e = await estado();
confere(e.visivel && /Amigável Esquecido · jogo atual com registos/.test(e.txt) && !(await pg.$('#aviso-arq [data-nao]')), "jogo atual com registos não aparece no aviso: " + e.txt);
// o mesmo jogo atual sem registos: sem aviso
await pg.evaluate(() => { jogo = { ...jogo, eventos: [] }; notas = { itens: [] }; an = { ...an, regs: [] }; avisoArquivo(); });
confere(!(await estado()).visivel, "jogo atual sem registos aparece no aviso");

await browser.close();
if (erros.length) falhas.push("erros de JavaScript: " + erros.join(" | "));
if (falhas.length) { console.error("FALHOU\n- " + falhas.join("\n- ")); process.exit(1); }
console.log(`OK · aviso de jogo por arquivar (${ipad ? "WebKit/iPad" : "Chromium"})`);
