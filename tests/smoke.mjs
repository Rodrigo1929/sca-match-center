// Teste de fumo no browser (sem base de dados: a app corre em modo "só neste aparelho").
// Requisitos: npm install && npx playwright install chromium
// Uso: npm test   → falha se houver erros de JavaScript; guarda capturas em tests/capturas/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const cap = join(raiz, "tests/capturas"); mkdirSync(cap, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const pg = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const erros = []; pg.on("pageerror", (e) => erros.push(String(e)));
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href);
await pg.waitForTimeout(800);

for (const t of ["q", "j", "p", "m", "v", "a", "h"]) {
  await pg.click("#tab-" + t); await pg.waitForTimeout(250);
  await pg.screenshot({ path: join(cap, `separador-${t}.png`) });
}
// Modelo de Jogo: criar quadro, novo passo, arrastar um jogador, animar
await pg.click("#tab-m"); await pg.click("#m-novo2"); await pg.fill("#mn-n", "Teste"); await pg.click("#mn-ok");
await pg.click("#me-np");
const box = await pg.locator("#m-stage svg").boundingBox(), s = box.width / 1600;
const px = (mx, my) => [box.x + (24 + mx * 10.6) * s, box.y + (84 + my * 10.6) * s];
const [x1, y1] = px(38, 34), [x2, y2] = px(22, 34);
await pg.mouse.move(x1, y1); await pg.mouse.down(); await pg.mouse.move(x2, y2, { steps: 6 }); await pg.mouse.up();
await pg.click("#m-ed"); await pg.click(".mpasso[data-i='0']"); await pg.click("#mp-pl"); await pg.waitForTimeout(1800);
await pg.screenshot({ path: join(cap, "modelo-animacao.png") });
const n = await pg.evaluate(() => Object.values(modelos).map((q) => q.passos.length));
if (JSON.stringify(n) !== "[2]") erros.push("Modelo de Jogo: esperado 1 quadro com 2 passos, obtido " + JSON.stringify(n));
// TV com o quadro animado
await pg.click("#btn-tv"); await pg.click("#tv-mg .pdf-gr"); await pg.click("#tv-ok"); await pg.waitForTimeout(600);
await pg.keyboard.press("ArrowLeft"); await pg.waitForTimeout(600);
await pg.screenshot({ path: join(cap, "tv-modelo.png") }); await pg.keyboard.press("Escape");

await browser.close();
if (erros.length) { console.error("FALHOU:\n" + erros.join("\n")); process.exit(1); }
console.log("OK · capturas em tests/capturas/");
