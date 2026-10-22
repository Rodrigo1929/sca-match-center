// Teste de fumo no browser (sem base de dados: a app corre em modo "só neste aparelho").
// Requisitos: npm install && npx playwright install chromium
// Uso: npm test   → falha se houver erros de JavaScript; guarda capturas em tests/capturas/
//      npm run test:ipad → o mesmo no WebKit (motor do Safari) com ecrã e toque de iPad; capturas em tests/capturas/ipad/
//      (precisa de: npx playwright install webkit)
import { chromium, webkit, devices } from "playwright";
import { mkdirSync, statSync } from "node:fs";
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

for (const t of ["q", "j", "p", "m", "x", "v", "a", "h"]) {
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
if ((await pg.evaluate(() => Object.values(modelos)[0].rot)) !== "nada") erros.push("Bolinhas: o segundo toque devia passar a sem texto");
await pg.click("#m-rot"); await pg.waitForTimeout(200);
if ((await pg.evaluate(() => Object.values(modelos)[0].rot)) !== "num") erros.push("Bolinhas: o terceiro toque devia voltar ao número");
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
// botão direito do rato: num passo e num quadro abre "Apagar"; o clique na opção apaga e "Desfazer" repõe
const nQ = () => pg.evaluate(() => [Object.keys(modelos).length, (Object.values(modelos)[0] || { passos: [] }).passos.length]);
await pg.click("#m-panel li[data-i='1']", { button: "right" }); await pg.waitForSelector(".mmenu");
await pg.screenshot({ path: join(cap, "modelo-menu-passo.png") });
await pg.click(".mmenu button"); await pg.waitForTimeout(150);
if (JSON.stringify(await nQ()) !== "[1,1]") erros.push("Botão direito: devia apagar o passo 2 " + JSON.stringify(await nQ()));
await pg.click(".toast button"); await pg.waitForTimeout(150);
await pg.click("#m-nav button[data-id]", { button: "right" }); await pg.waitForSelector(".mmenu");
await pg.keyboard.press("Escape"); if (await pg.locator(".mmenu").count()) erros.push("Botão direito: Escape devia fechar o menu");
await pg.click("#m-nav button[data-id]", { button: "right" }); await pg.click(".mmenu button"); await pg.waitForTimeout(150);
if ((await nQ())[0] !== 0) erros.push("Botão direito: devia apagar o quadro");
await pg.click(".toast button"); await pg.waitForTimeout(150);
if (JSON.stringify(await nQ()) !== "[1,2]") erros.push("Botão direito: Desfazer devia repor o quadro com 2 passos " + JSON.stringify(await nQ()));
// TV: no separador Modelo abre na TV do Modelo; a das bolas paradas fica à parte
await pg.click("#btn-tv"); await pg.waitForSelector("#tv-modo");
if ((await pg.getAttribute("#tv-modo [data-m='m']", "aria-pressed")) !== "true") erros.push("TV: devia abrir no Modelo de Jogo");
await pg.click("#tv-modo [data-m='b']"); if (!(await pg.locator("#tv-g input.pdf-l").count())) erros.push("TV: a lista das bolas paradas não apareceu");
if (await pg.locator("#tv-g input.m-l").count()) erros.push("TV: os quadros do Modelo não deviam aparecer na TV das bolas paradas");
await pg.click("#tv-modo [data-m='m']"); await pg.click("#tv-ok"); await pg.waitForTimeout(1200);
await pg.screenshot({ path: join(cap, "tv-modelo.png") }); await pg.keyboard.press("Escape");

// Exercícios: criar com a ficha da UT, conta da duração, figura com o editor do Modelo, duplicar, apagar e desfazer, filtros
await pg.click("#tab-x"); await pg.click("#x-novo2");
await pg.fill("#xe-n", "MPB Posicional"); await pg.fill("#xe-fo", "8+2×4+GR"); await pg.fill("#xe-es", "Dupla área");
await pg.click("#xe-p [data-k='fundamental']"); await pg.click("#xe-m [data-k='of']"); await pg.click("#xe-s [data-k='constr']"); await pg.click("#xe-t [data-k='mpb']");
await pg.fill("#xe-se", "3"); await pg.fill("#xe-pr", "3'"); await pg.fill("#xe-pa", "1,30");
await pg.fill("#xe-ob", "Manter a posse em superioridade e acelerar para a finalização.");
await pg.fill("#xe-co", "Criar linhas de passe\nReceção perfilada"); await pg.fill("#xe-va", "Competição interna"); await pg.fill("#xe-ma", "Bolas\nCones");
await pg.click("#xe-ok"); await pg.waitForTimeout(200);
const ex = await pg.evaluate(() => { const E = Object.values(exercicios)[0]; return E && { n: Object.keys(exercicios).length, tot: totalEx(E), sub: E.sub, co: E.comportamentos.length, ma: E.material.length, fig: temFigura(E) }; });
if (!ex || ex.n !== 1 || ex.tot !== 720 || ex.sub !== "constr" || ex.co !== 2 || ex.ma !== 2 || ex.fig) erros.push("Exercícios: ficha criada com dados errados " + JSON.stringify(ex));
if (!(await pg.locator("#x-ficha .exf-dur").textContent()).includes("12'")) erros.push("Exercícios: a ficha devia mostrar o total 12'");
await pg.screenshot({ path: join(cap, "exercicio-ficha.png") });
// figura: abre o editor do Modelo de Jogo; o que se desenha fica no exercício e não na lista do Modelo
await pg.click("#x-fig2"); await pg.waitForSelector("#mf-volta");
for (const eq of ["nos", "nos", "adv", "neutro", "bola", "bola", "cone", "minib"]) await pg.click(`#m-panel [data-eq='${eq}']`);
await pg.waitForTimeout(150);
const f1 = await pg.evaluate(() => { const Q = qAtual(); return { rot: Q.rot, fig: Q.fig, bolas: Q.pecas.filter((p) => p.eq === "bola").length, txt: [...document.querySelectorAll("#m-stage > svg .mdin text")].length }; });
if (f1.rot !== "nada" || !f1.fig || f1.bolas !== 2 || f1.txt !== 0) erros.push("Figura: devia começar só com bolinhas, sem texto, e aceitar várias bolas " + JSON.stringify(f1));
await pg.screenshot({ path: join(cap, "exercicio-editor-figura.png") });
// espaço livre 20×20 e meio campo rodado (baliza em cima); arrastar no campo rodado leva a peça para onde se larga
await pg.click("#me-vis [data-k='livre']"); await pg.waitForSelector("#me-vw"); await pg.fill("#me-vw", "20"); await pg.press("#me-vw", "Enter"); await pg.waitForTimeout(150);
await pg.screenshot({ path: join(cap, "exercicio-espaco-livre.png") });
await pg.click("#me-vis [data-k='meio']"); await pg.waitForTimeout(150);
const ecra = (id) => pg.evaluate((id) => { const Q = qAtual(), p = Q.passos[0].pos[id], [sx, sy] = vistaQ(Q).P(p.x, p.y), m = document.querySelector("#m-stage > svg").getScreenCTM(); return { x: m.a * sx + m.e, y: m.d * sy + m.f }; }, id);
if (!(await pg.locator("#me-dentro").count())) erros.push("Campo rodado: devia oferecer trazer para dentro as peças que ficaram fora");
await pg.click("#me-dentro"); await pg.waitForTimeout(150);
if (await pg.evaluate(() => forasDaVista(qAtual(), 0).length)) erros.push("Campo rodado: ainda há peças fora da vista");
await pg.click("#m-panel [data-eq='nos']"); await pg.waitForTimeout(100);
const idN = await pg.evaluate(() => qAtual().pecas.filter((p) => p.eq === "nos").pop().id), a0 = await ecra(idN);
await pg.mouse.move(a0.x, a0.y); await pg.mouse.down(); await pg.mouse.move(a0.x + 60, a0.y - 40, { steps: 6 }); await pg.mouse.up(); await pg.waitForTimeout(150);
const a1 = await ecra(idN);
if (Math.abs(a1.x - (a0.x + 60)) > 6 || Math.abs(a1.y - (a0.y - 40)) > 6) erros.push("Campo rodado: a peça não ficou onde foi largada " + JSON.stringify({ a0, a1 }));
await pg.screenshot({ path: join(cap, "exercicio-meio-campo.png") });
await pg.click("#mf-volta"); await pg.waitForSelector("#x-stage > svg");
const fg = await pg.evaluate(() => ({ pecas: Object.values(exercicios)[0].figura?.quadro?.pecas?.length, vista: Object.values(exercicios)[0].figura?.quadro?.vista, modelos: listaModelos().length, x: !document.getElementById("view-x").hidden, fig: mFig }));
if (fg.pecas !== 9 || fg.vista !== "meio" || fg.modelos !== 1 || !fg.x || fg.fig) erros.push("Exercícios: figura mal gravada ou fora do sítio " + JSON.stringify(fg));
await pg.screenshot({ path: join(cap, "exercicio-figura.png") });
// duplicar, apagar com o botão direito e desfazer
await pg.click("#x-dup"); await pg.waitForTimeout(150);
const nEx = () => pg.evaluate(() => Object.keys(exercicios).length);
if ((await nEx()) !== 2) erros.push("Exercícios: Duplicar devia criar uma cópia");
await pg.click("#x-nav button[aria-current='true']", { button: "right" }); await pg.click(".mmenu button.perigo"); await pg.waitForTimeout(150);
if ((await nEx()) !== 1) erros.push("Exercícios: o botão direito devia apagar");
await pg.click(".toast button"); await pg.waitForTimeout(150);
if ((await nEx()) !== 2) erros.push("Exercícios: Desfazer devia repor o exercício");
// pesquisa e filtros
await pg.fill("#x-q", "zzz"); if (await pg.locator("#x-nav button[data-id]").count()) erros.push("Exercícios: a pesquisa devia esconder tudo");
await pg.fill("#x-q", ""); await pg.selectOption("#x-ft", "rondo"); if (await pg.locator("#x-nav button[data-id]").count()) erros.push("Exercícios: o filtro de tipo devia esconder os MPB");
await pg.selectOption("#x-ft", ""); if ((await pg.locator("#x-nav button[data-id]").count()) !== 2) erros.push("Exercícios: sem filtros deviam aparecer os 2");

// imagem na figura: o armazenamento do link (assets) só existe no claude.ai; aqui é simulado
await pg.evaluate(() => { window.__up = []; window.claude = { use: async (n) => n === "assets" ? { upload: async (b, o) => { window.__up.push({ size: b.size, type: o && o.type }); return { id: "teste0123456789abcdef0123456789ab", url: URL.createObjectURL(b), sizeBytes: b.size, contentType: "image/jpeg" }; } } : null }; xAssets = undefined; });
await pg.click("#x-nav button[aria-current='true']"); await pg.click("#x-img"); await pg.waitForSelector("#xi-esc:not([disabled])");
await pg.setInputFiles("#xi-f", join(raiz, "assets/slides/b-head.jpg")); await pg.waitForSelector("#x-stage .x-img img"); await pg.waitForTimeout(300);
const im = await pg.evaluate(() => { const E = exercicios[xCur], i = document.querySelector("#x-stage .x-img img"); return { usa: E.figura.usa, w: E.figura.imagem.w, h: E.figura.imagem.h, ok: i.naturalWidth > 0, up: window.__up }; });
if (im.usa !== "imagem" || im.w !== 1600 || im.h !== 1200 || !im.ok || im.up.length !== 1 || im.up[0].type !== "image/jpeg") erros.push("Imagem: carregamento ou redução errados " + JSON.stringify(im));
await pg.screenshot({ path: join(cap, "exercicio-imagem.png") });
// PDF da ficha: com a imagem e depois com a figura desenhada
const pdf = async (nome) => { const [d] = await Promise.all([pg.waitForEvent("download", { timeout: 60000 }), pg.click("#x-pdf")]); const f = join(cap, nome); await d.saveAs(f);
  const tam = statSync(f).size; if (!d.suggestedFilename().startsWith("SCA_Exercicio_") || tam < 20000) erros.push(`PDF: ficheiro estranho ${d.suggestedFilename()} (${tam} bytes)`); };
await pdf("exercicio-imagem.pdf");
await pg.click("#x-img"); await pg.click("#xi-u [data-k='quadro']"); await pg.waitForSelector("#x-stage > svg");
await pdf("exercicio-desenho.pdf");
// tirar a imagem (2 toques): fica a figura desenhada
await pg.click("#x-img"); await pg.click("#xi-del"); await pg.click("#xi-del"); await pg.waitForTimeout(150);
const semImg = await pg.evaluate(() => { const E = exercicios[xCur]; return { im: !!E.figura.imagem, usa: E.figura.usa, q: !!E.figura.quadro }; });
if (semImg.im || semImg.usa !== "quadro" || !semImg.q) erros.push("Imagem: tirar a imagem devia deixar só a figura desenhada " + JSON.stringify(semImg));

await browser.close();
if (erros.length) { console.error("FALHOU:\n" + erros.join("\n")); process.exit(1); }
console.log(`OK${ipad ? " (WebKit · iPad)" : ""} · capturas em ${ipad ? "tests/capturas/ipad/" : "tests/capturas/"}`);
