// v116: calendário — símbolo do adversário por clube (carregado uma vez, vale em todos os jogos com esse clube) e jogo em campo neutro.
// Uso: npm run test:calendario   (Chromium; armazenamento e descargas simulados)
import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { mkdirSync, statSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const cap = join(raiz, "tests/capturas/calendario"); mkdirSync(cap, { recursive: true });
const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const erros = []; pg.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push(s); });
let falhas = 0; const ok = (c, msg) => { console.log((c ? "✓ " : "✗ ") + msg); if (!c) falhas++; };
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href); await pg.waitForTimeout(800);
await pg.evaluate(() => { window.__up = 0;
  window.claude = { use: async (n) => n === "assets" ? { upload: async (b) => { window.__up++; return { id: "embteste" + Math.random().toString(36).slice(2, 10), url: URL.createObjectURL(b) }; }, delete: async () => ({}) } : null };
  xAssets = undefined; });
const png = Buffer.from((await pg.evaluate(() => { const c = document.createElement("canvas"); c.width = c.height = 80; const x = c.getContext("2d"); x.fillStyle = "#0a5"; x.beginPath(); x.arc(40, 40, 30, 0, 7); x.fill(); return c.toDataURL("image/png"); })).split(",")[1], "base64");

await pg.click("#tab-u"); await pg.click(".u-modo button[data-m='semana']"); await pg.waitForSelector("#s-nova2");
const ini = await pg.evaluate(() => { const h = segundaDe(isoDia(new Date())); return new Date().getDay() >= 5 ? diaMais(h, 7) : h; }), d = await pg.evaluate((i) => diasDaSemana(i), ini);   // a semana que «Nova semana» cria
const novoJogo = async (data, adv, k) => { await pg.click("#s-jn"); await pg.fill("#jc-d", data); await pg.fill("#jc-h", "15:00"); await pg.fill("#jc-a", adv); await pg.click(`#jc-c button[data-k='${k}']`); };
const ultimo = () => pg.evaluate(() => Object.values(calendario).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm)).pop());

// 1) Praiense em casa, com símbolo carregado
await novoJogo(d[2], "SC Praiense", "casa");
await pg.setInputFiles("#jc-ef", { name: "praiense.png", mimeType: "image/png", buffer: png });
await pg.waitForFunction(() => /Símbolo carregado/.test($("jc-st").textContent), null, { timeout: 10000 });
await pg.click("#jc-ok"); await pg.waitForTimeout(150);
const j1 = await ultimo(); ok(j1.emblema && j1.emblema.em, "símbolo carregado e guardado no 1.º jogo com o Praiense");

// 2) outro jogo com o Praiense (escrito sem «SC»): aparece logo o símbolo
await novoJogo(d[6], "Praiense", "fora"); await pg.click("#jc-ok"); await pg.waitForTimeout(150);
const j2 = await ultimo();
ok(!j2.emblema && (await pg.evaluate((id) => emblemaJogo(calendario[id])?.id, j2.id)) === j1.emblema.id, "o 2.º jogo com o Praiense usa o mesmo símbolo sem carregar outra vez");
await pg.evaluate((id) => folhaJogoCal(id), j2.id); await pg.waitForTimeout(200);
ok(await pg.evaluate(() => !!document.querySelector(".jc-emb img") && /uma vez por clube/.test(document.querySelector(".sheet").textContent)), "a folha do 2.º jogo mostra o símbolo do clube");
await pg.screenshot({ path: join(cap, "simbolo-clube.png") }); await pg.click(".sheet [data-close]");
ok(await pg.evaluate(() => emblemaJogo({ adversario: "Lusitânia" }) === null && emblemaJogo({ adversario: "A definir" }) === null), "outro clube e «A definir» ficam sem símbolo");

// 3) jogo em campo neutro: visitado/visitante para a ficha, deslocação, cor verde, «vs … (neutro)»
await novoJogo(d[4], "GD São Roque", "neutro");
const f3 = await pg.evaluate(() => ({ neu: !$("jc-neu").hidden, fora: !$("jc-fora").hidden, of: [...document.querySelectorAll("#jc-of button")].map((b) => b.getAttribute("aria-pressed")).join() }));
ok(f3.neu && f3.fora && f3.of === "true,false", "campo neutro: pergunta Visitado/Visitante (Visitado por defeito) e mostra a deslocação " + JSON.stringify(f3));
await pg.click("#jc-of button[data-k='']"); await pg.click("#jc-v button[data-k='1']"); await pg.fill("#jc-de", "S. Miguel");
await pg.fill("#jc-p", "Taça de Portugal"); await pg.fill("#jc-l", "Estádio de São Miguel"); await pg.selectOption("#jc-il", "São Miguel");
await pg.screenshot({ path: join(cap, "neutro-folha.png") }); await pg.click("#jc-ok"); await pg.waitForTimeout(150);
const j3 = await ultimo();
const v3 = await pg.evaluate((id) => { const j = calendario[id]; return { neutro: j.neutro, casa: j.casa, desl: j.deslocacao, cor: corJogo(j), vs: vsJogo(j) + " " + j.adversario + neutroTxt(j), emCasa: emCasa(j), letra: letraJogoAnual(j), bloco: BLOCOS_MC.some((b) => b[0] === "neutro"),
  linhas: linhasJogo(j).map((l) => l.t).filter(Boolean).join("|") }; }, j3.id);
ok(v3.neutro === true && v3.casa === false && v3.desl && v3.cor === "#2E9E5B" && v3.vs === "vs GD São Roque (neutro)" && !v3.emCasa && v3.letra === "#8FE3A8" && v3.bloco && /CAMPO NEUTRO/.test(v3.linhas),
  "jogo neutro gravado (visitante na ficha, viagem, verde, «vs … (neutro)», CAMPO NEUTRO no PDF) " + JSON.stringify(v3));
// voltar a abrir: fica em Campo neutro; mudar para Em casa tira o neutro
await pg.evaluate((id) => folhaJogoCal(id), j3.id); await pg.waitForTimeout(150);
ok(await pg.evaluate(() => document.querySelector("#jc-c button[data-k='neutro']").getAttribute("aria-pressed") === "true"), "ao reabrir, o jogo está em Campo neutro");
await pg.click(".sheet [data-close]");

// 4) PDF do plano semanal: semana nova com os jogos; o PDF leva os símbolos dos dois jogos do Praiense
await pg.click("#s-nova2"); await pg.waitForTimeout(200); ok(await pg.evaluate((i) => semanas[sCur].inicio === i, ini), "semana nova com os 3 jogos");
const [dl] = await Promise.all([pg.waitForEvent("download", { timeout: 60000 }), pg.click("#s-pdf")]); const f = join(cap, "plano-semanal.pdf"); await dl.saveAs(f);
const nEmb = (readFileSync(f, "latin1").match(/\/I\d+ Do/g) || []).length - 2;   // imagens desenhadas, menos o símbolo da AF/CFA e o logo
ok(statSync(f).size > 20000 && nEmb === 2, `PDF do plano semanal gerado (${Math.round(statSync(f).size / 1024)} KB), com o símbolo nos 2 jogos do Praiense (${nEmb})`);
await pg.screenshot({ path: join(cap, "plano-semanal.png"), fullPage: true });

await browser.close();
if (erros.length) { console.log("✗ erros de JavaScript: " + erros.join(" | ")); falhas++; }
console.log(falhas ? `FALHOU (${falhas})` : "OK · Calendário: símbolo por clube e campo neutro"); process.exit(falhas ? 1 : 0);
