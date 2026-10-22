// Teste de fumo no browser (sem base de dados: a app corre em modo "só neste aparelho").
// Requisitos: npm install && npx playwright install chromium
// Uso: npm test   → falha se houver erros de JavaScript; guarda capturas em tests/capturas/
//      npm run test:ipad → o mesmo no WebKit (motor do Safari) com ecrã e toque de iPad; capturas em tests/capturas/ipad/
//      (precisa de: npx playwright install webkit)
import { chromium, webkit, devices } from "playwright";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ipad = process.argv.includes("--ipad");
const cap = join(raiz, ipad ? "tests/capturas/ipad" : "tests/capturas"); mkdirSync(cap, { recursive: true });
const browser = ipad ? await webkit.launch() : await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const pg = ipad ? await (await browser.newContext({ ...devices["iPad (gen 7) landscape"] })).newPage() : await browser.newPage({ viewport: { width: 1366, height: 900 } });
const erros = []; pg.on("pageerror", (e) => erros.push(String(e)));
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href);
await pg.waitForTimeout(800);

for (const t of ["q", "j", "p", "m", "v", "a", "h"]) {
  await pg.click("#tab-" + t); await pg.waitForTimeout(250);
  await pg.screenshot({ path: join(cap, `separador-${t}.png`) });
}
// Modelo de Jogo: criar quadro (começa no onze do separador Jogo), novo passo, arrastar um jogador, animar
await pg.click("#tab-m"); await pg.click("#m-novo2"); await pg.fill("#mn-n", "Teste"); await pg.click("#mn-ok");
const onze = await pg.evaluate(() => { const Q = Object.values(modelos)[0]; return { slots: Q.pecas.filter((p) => p.eq === "nos" && p.slot).length, v: numerosQ(Q), base: Object.fromEntries(jogo.onze.map((o) => [o.slot, o.n])) }; });
if (onze.slots !== 11 || JSON.stringify(onze.v) !== JSON.stringify(onze.base)) erros.push("Modelo de Jogo: o quadro novo devia ter os 11 do onze com os números do Jogo, obtido " + JSON.stringify(onze));
await pg.click("#me-np");
// metros do campo → píxeis do ecrã (a posição do campo muda quando a barra de edição aparece ou desaparece)
const px = async (mx, my) => { const b = await pg.locator("#m-stage > svg").boundingBox(), s = b.width / 1600; return [b.x + (30 + mx * 10.2) * s, b.y + (118 + my * 10.2) * s]; };
const [x1, y1] = await px(38.8, 34), [x2, y2] = await px(22, 34);
await pg.mouse.move(x1, y1); await pg.mouse.down(); await pg.mouse.move(x2, y2, { steps: 6 }); await pg.mouse.up();
await pg.click("#m-ed"); await pg.click(".mpasso[data-i='0']"); await pg.click("#mp-pl"); await pg.waitForTimeout(1800);
await pg.screenshot({ path: join(cap, "modelo-animacao.png") });
const n = await pg.evaluate(() => Object.values(modelos).map((q) => q.passos.length));
if (JSON.stringify(n) !== "[2]") erros.push("Modelo de Jogo: esperado 1 quadro com 2 passos, obtido " + JSON.stringify(n));
// troca como nas bolas paradas: tocar no GR e trocar com outro do quadro
await pg.click("#mp-ini"); await pg.mouse.click(...(await px(6.3, 34))); await pg.waitForSelector("#gm-campo button");
await pg.click("#gm-campo button"); await pg.waitForTimeout(200);
const tr = await pg.evaluate(() => { const Q = Object.values(modelos)[0]; return { n: Q.trocas.length, gr: numerosQ(Q)[jogo.onze[0].slot], base: jogo.onze[0].n }; });
if (tr.n !== 1 || tr.gr === tr.base) erros.push("Modelo de Jogo: a troca no quadro não ficou registada " + JSON.stringify(tr));
await pg.screenshot({ path: join(cap, "modelo-troca.png") });
// Nº ⇄ Posição: a bolinha mostra a posição; por baixo não aparece nada (sem "Nomes por baixo")
await pg.click("#m-rot"); await pg.waitForTimeout(200);
const rt = await pg.evaluate(() => { const Q = Object.values(modelos)[0], v = numerosQ(Q), pc = Q.pecas.find((p) => p.eq === "nos" && p.slot);
  return { rot: Q.rot, dentro: rotulo(Q, pc, v), baixo: legendaPeca(Q, pc, v), pos: pc.pos, n: v[pc.slot] }; });
if (rt.rot !== "pos" || rt.dentro !== rt.pos || rt.baixo !== "") erros.push("Nº ⇄ Posição: esperado só a posição na bolinha, sem nada por baixo " + JSON.stringify(rt));
await pg.screenshot({ path: join(cap, "modelo-posicao.png") });
await pg.click("#m-rot"); await pg.waitForTimeout(200);
if ((await pg.evaluate(() => Object.values(modelos)[0].rot)) !== "num") erros.push("Nº ⇄ Posição: o segundo toque devia voltar ao número");
// Apresentar (botão vermelho no separador Modelo de Jogo)
await pg.click("#btn-present"); await pg.waitForSelector(".present #ma-pl");
await pg.click("#ma-rot"); if ((await pg.evaluate(() => Object.values(modelos)[0].rot)) !== "pos") erros.push("Apresentar: Nº ⇄ Posição não mudou o quadro");
await pg.click("#ma-pl"); await pg.waitForTimeout(900);
await pg.screenshot({ path: join(cap, "modelo-apresentar.png") }); await pg.keyboard.press("Escape");
if (await pg.locator(".present").count()) erros.push("Apresentar: Escape não fechou a apresentação");
// vídeo: um fotograma pintado em canvas, com as imagens carregadas
const pix = await pg.evaluate(async () => { await mCarregaImgs(); const c = document.createElement("canvas"); c.width = 1920; c.height = 1080; const cx = c.getContext("2d");
  pintaModeloCanvas(cx, Object.values(modelos)[0], 0.5, 1920, 1080); return Array.from(cx.getImageData(960, 5, 1, 1).data); });
if (pix[0] < 200 || pix[1] < 200) erros.push("Vídeo: fundo do fotograma não é branco " + JSON.stringify(pix));
// apagar passo pela lista: 1.º toque arma, 2.º apaga; "Desfazer" no aviso repõe
await pg.click(".m-xp[data-i='1']"); if ((await pg.evaluate(() => Object.values(modelos)[0].passos.length)) !== 2) erros.push("Apagar passo: o 1.º toque não devia apagar");
await pg.click(".m-xp[data-i='1']"); await pg.waitForTimeout(150);
if ((await pg.evaluate(() => Object.values(modelos)[0].passos.length)) !== 1) erros.push("Apagar passo: o 2.º toque devia apagar o passo 2");
await pg.screenshot({ path: join(cap, "modelo-apagar-passo.png") });
await pg.click(".toast button"); await pg.waitForTimeout(150);
if ((await pg.evaluate(() => Object.values(modelos)[0].passos.length)) !== 2) erros.push("Apagar passo: Desfazer devia repor o passo");
// TV: no separador Modelo abre na TV do Modelo; a das bolas paradas fica à parte
await pg.click("#btn-tv"); await pg.waitForSelector("#tv-modo");
if ((await pg.getAttribute("#tv-modo [data-m='m']", "aria-pressed")) !== "true") erros.push("TV: devia abrir no Modelo de Jogo");
await pg.click("#tv-modo [data-m='b']"); if (!(await pg.locator("#tv-g input.pdf-l").count())) erros.push("TV: a lista das bolas paradas não apareceu");
if (await pg.locator("#tv-g input.m-l").count()) erros.push("TV: os quadros do Modelo não deviam aparecer na TV das bolas paradas");
await pg.click("#tv-modo [data-m='m']"); await pg.click("#tv-ok"); await pg.waitForTimeout(1200);
await pg.screenshot({ path: join(cap, "tv-modelo.png") }); await pg.keyboard.press("Escape");

await browser.close();
if (erros.length) { console.error("FALHOU:\n" + erros.join("\n")); process.exit(1); }
console.log(`OK${ipad ? " (WebKit · iPad)" : ""} · capturas em ${ipad ? "tests/capturas/ipad/" : "tests/capturas/"}`);
