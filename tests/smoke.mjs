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
// o WebKit regista como erro de página um fetch a file:// já apanhado pela app (imagem em falta); no link é https e não acontece
const erros = []; pg.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push(s); });
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href);
await pg.waitForTimeout(800);

for (const t of ["q", "j", "d", "p", "m", "x", "v", "a", "h"]) {
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
await pg.click("#xe-p [data-k='fundamental']"); await pg.click("#xe-m [data-k='prep']"); await pg.click("#xe-s [data-k='cap']"); await pg.click("#xe-t [data-k='mpb']");
await pg.fill("#xe-se", "3"); await pg.fill("#xe-pr", "3'"); await pg.fill("#xe-pa", "1,30");
await pg.fill("#xe-ob", "Manter a posse em superioridade e acelerar para a finalização.");
await pg.fill("#xe-co", "Criar linhas de passe\nReceção perfilada"); await pg.fill("#xe-va", "Competição interna"); await pg.fill("#xe-ma", "Bolas\nCones");
await pg.click("#xe-ok"); await pg.waitForTimeout(200);
const ex = await pg.evaluate(() => { const E = Object.values(exercicios)[0]; return E && { n: Object.keys(exercicios).length, tot: totalEx(E), sub: E.sub, co: E.comportamentos.length, ma: E.material.length, fig: temFigura(E) }; });
if (!ex || ex.n !== 1 || ex.tot !== 720 || ex.sub !== "cap" || ex.co !== 2 || ex.ma !== 2 || ex.fig) erros.push("Exercícios: ficha criada com dados errados " + JSON.stringify(ex));
// categorias e formatos do caderno do clube: a classificação antiga passa sozinha para a nova
const mig = await pg.evaluate(() => [{ tipo: "fisico" }, { tipo: "ativacao" }, { momento: "bpof", tipo: "bolaparada" }, { momento: "of", sub: "constr", tipo: "estrategico" }, { momento: "of", sub: "final", tipo: "finalizacao" }, { momento: "tda", sub: "contra", tipo: "reduzido" }, { momento: "def", tipo: "gr" }]
  .map((d) => { const E = normEx({ id: "m", nome: "m", ...d }); return [E.momento, E.sub, E.tipo].join("/"); }));
if (JSON.stringify(mig) !== JSON.stringify(["prep/cap/", "prep/ativ/", "esq//", "of/constr/condicionado", "fin//", "tda/contra/reduzido", "def//"])) erros.push("Exercícios: passagem para as categorias novas errada " + JSON.stringify(mig));
if (!(await pg.locator("#x-ficha .exf-dur").textContent()).includes("12'")) erros.push("Exercícios: a ficha devia mostrar o total 12'");
await pg.screenshot({ path: join(cap, "exercicio-ficha.png") });
// figura: abre o editor do Modelo de Jogo; o que se desenha fica no exercício e não na lista do Modelo
await pg.click("#x-fig2"); await pg.waitForSelector("#mf-volta");
for (const eq of ["nos", "nos", "adv", "neutro", "bola", "bola", "cone", "minib"]) await pg.click(`#m-panel [data-eq='${eq}']`);
await pg.waitForTimeout(150);
const f1 = await pg.evaluate(() => { const Q = qAtual(); return { rot: Q.rot, fig: Q.fig, bolas: Q.pecas.filter((p) => p.eq === "bola").length, txt: [...document.querySelectorAll("#m-stage > svg .mdin text")].length }; });
if (f1.rot !== "nada" || !f1.fig || f1.bolas !== 2 || f1.txt !== 0) erros.push("Figura: devia começar só com bolinhas, sem texto, e aceitar várias bolas " + JSON.stringify(f1));
await pg.screenshot({ path: join(cap, "exercicio-editor-figura.png") });
// material de treino: menu por grupos, escada longa e etiqueta com número; rodar 45° e mudar a cor; todos os tipos desenham-se
await pg.click("#me-mat"); await pg.waitForSelector(".sheet [data-mat='escadaL']");
await pg.screenshot({ path: join(cap, "exercicio-material-menu.png") });
await pg.click(".sheet [data-mat='escadaL']"); await pg.waitForTimeout(150);
await pg.click("#me-mat"); await pg.click(".sheet [data-mat='numero']"); await pg.waitForTimeout(150);
await pg.evaluate(() => folhaPecaM(qAtual().pecas.find((p) => p.tipo === "escadaL").id)); await pg.click("#mp-rod"); await pg.click("#mp-c [data-c='azul']"); await pg.click(".sheet [data-close]"); await pg.waitForTimeout(150);
const mat = await pg.evaluate(() => { const Q = qAtual(), e = Q.pecas.find((p) => p.tipo === "escadaL"), n = Q.pecas.find((p) => p.tipo === "numero");
  const vazios = Object.keys(MAT).filter((t) => { const o = []; desenhaMat(o, { tipo: t, n: "1" }, { x: 50, y: 30 }, vistaQ(Q), (m) => MK(m)); return !o.length || !iconeMat(t).includes("<"); });
  return { ang: e && e.ang, cor: e && e.cor, n: n && n.n, vazios }; });
if (mat.ang !== 45 || mat.cor !== "azul" || mat.n !== "1" || mat.vazios.length) erros.push("Material de treino: peça mal gravada ou sem desenho " + JSON.stringify(mat));
await pg.screenshot({ path: join(cap, "exercicio-material.png") });
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
if (fg.pecas !== 11 || fg.vista !== "meio" || fg.modelos !== 1 || !fg.x || fg.fig) erros.push("Exercícios: figura mal gravada ou fora do sítio " + JSON.stringify(fg));
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

// Treino (UT): criar, cabeçalho, exercícios do repositório (cópias), ajustar só na UT, presenças, grupos, aviso de mudança e PDF
await pg.click("#tab-u"); await pg.click("#u-nova2"); await pg.waitForSelector("#uc-n");
await pg.fill("#uc-n", "39"); await pg.fill("#uc-d", "2026-10-21"); await pg.click("#uc-md [data-k='MD-3']"); await pg.fill("#uc-r", "Híbrido (+/-)");
await pg.fill("#uc-o", "Tensão\nPrincípios estratégicos org. ofensiva da 1.ª fase"); await pg.click("#uc-ok"); await pg.waitForTimeout(150);
await pg.click("#u-add"); await pg.waitForSelector("#ua-l input"); for (const i of await pg.locator("#ua-l input").all()) await i.check();
await pg.click("#ua-ok"); await pg.waitForTimeout(200);
const ut = await pg.evaluate(() => { const U = uts[uCur]; return { n: U.numero, md: U.matchDay, ex: U.exercicios.length, obj: U.objetivos.length, tot: totalUT(U) }; });
if (ut.n !== 39 || ut.md !== "MD-3" || ut.ex !== 2 || ut.obj !== 2 || ut.tot !== 1440) erros.push("UT: cabeçalho ou exercícios errados " + JSON.stringify(ut));
// ajustar só nesta UT: o repositório não muda
await pg.click("ol.utx li:first-child [data-a='aj']"); await pg.fill("#uj-se", "4"); await pg.click("#uj-ok"); await pg.waitForTimeout(150);
const aj = await pg.evaluate(() => { const l = uts[uCur].exercicios[0]; return { ut: l.copia.duracao.series, rep: exercicios[l.exId].duracao.series }; });
if (aj.ut !== 4 || aj.rep !== 3) erros.push("UT: o ajuste devia ficar só na UT " + JSON.stringify(aj));
// o ajuste do dia não é "mudou no repositório"; só uma alteração no repositório depois de entrar na UT
if (await pg.locator("ol.utx li:first-child [data-a='at']").count()) erros.push("UT: o ajuste do dia não devia dar aviso de mudança no repositório");
await pg.evaluate(async () => { await new Promise(r => setTimeout(r, 5)); const l = uts[uCur].exercicios[0]; guardaEx({ ...exercicios[l.exId], objetivos: "Mudado no repositório" }, true); renderUT(); });
if (!(await pg.locator("ol.utx li:first-child [data-a='at']").count())) erros.push("UT: devia avisar que o exercício mudou no repositório");
if (await pg.locator("ol.utx li:nth-child(2) [data-a='at']").count()) erros.push("UT: só o exercício alterado devia ter aviso");
// ↻ Atualizar: traz o texto do repositório e mantém o ajuste do dia (4 séries)
await pg.click("ol.utx li:first-child [data-a='at']"); await pg.click("#uat-ok"); await pg.waitForTimeout(150);
const at = await pg.evaluate(() => { const l = uts[uCur].exercicios[0]; return { obj: l.copia.objetivos, se: l.copia.duracao.series, aviso: mudouNoRepo(l) }; });
if (at.obj !== "Mudado no repositório" || at.se !== 4 || at.aviso) erros.push("UT: Atualizar devia trazer o repositório e manter o ajuste do dia " + JSON.stringify(at));
// presenças: toque = Presente; botão direito = escolher (Condicionado)
await pg.click(".upres button >> nth=0"); await pg.waitForTimeout(100);
await pg.click(".upres button >> nth=1", { button: "right" }); await pg.click(".mmenu button:has-text('Condicionado')"); await pg.waitForTimeout(100);
// jogador de fora do plantel (júnior) com posição
await pg.click("#u-xn"); await pg.fill("#ux-n", "Santiago C."); await pg.selectOption("#ux-p", "2"); await pg.click("#ux-ok"); await pg.waitForTimeout(150);
await pg.click(".upres button:has-text('Santiago')"); await pg.waitForTimeout(100);   // nos grupos só entra quem está presente
await pg.click("#u-gn"); await pg.fill("#ug-n", "Guarda-redes"); await pg.click("#ug-j button >> nth=0"); await pg.click("#ug-j button:has-text('Santiago')"); await pg.click("#ug-ok"); await pg.waitForTimeout(150);
const pg2 = await pg.evaluate(() => { const U = uts[uCur]; return { pres: Object.values(U.presencas).sort(), ext: U.extras.map((e) => e.nome + "/" + e.escalao + "/" + e.pos), g: U.grupos.length, gj: U.grupos[0] && U.grupos[0].jogadores.length,
  campo: [...document.querySelectorAll(".ucampo text")].some((t) => t.textContent.includes("Santiago C.")), botao: [...document.querySelectorAll(".upres button")].some((b) => b.textContent.includes("Santiago")) }; });
if (JSON.stringify(pg2.pres) !== '["CO","P","P"]' || JSON.stringify(pg2.ext) !== '["Santiago C./Sub19/2"]' || pg2.g !== 1 || pg2.gj !== 2 || !pg2.campo || !pg2.botao) erros.push("UT: presenças, jogadores de fora ou grupos errados " + JSON.stringify(pg2));
// ausente: sai do grupo e passa para os Indisponíveis do campo do plantel; a folha do grupo só mostra quem está presente
const k0 = await pg.evaluate(() => uts[uCur].grupos[0].jogadores[0]);
await pg.click(".upres button >> nth=0", { button: "right" }); await pg.click(".mmenu button:has-text('Ausente')"); await pg.waitForTimeout(150);
const aus = await pg.evaluate((k) => { const U = uts[uCur], txt = [...document.querySelectorAll(".ucampo text")].map((t) => t.textContent).join(" | "); return { noGrupo: U.grupos[0].jogadores.includes(k), indisp: txt.includes("INDISPONÍVEIS") && txt.includes("· Ausente"), naGrelha: (() => { folhaGrupoUT(U.id, null); const r = [...document.querySelectorAll("#ug-j button")].some((b) => b.dataset.k === k); document.querySelector("#sheet-root [data-close]").click(); return r; })() }; }, k0);
if (aus.noGrupo || !aus.indisp || aus.naGrelha) erros.push("UT: ausente devia sair do grupo e ir para os Indisponíveis " + JSON.stringify(aus));
await pg.click(".upres button >> nth=0", { button: "right" }); await pg.click(".mmenu button:has-text('Presente')"); await pg.waitForTimeout(100);
// posição no Plantel → aparece na posição certa do campo do plantel
await pg.click("#tab-p"); await pg.selectOption("#pp-0", "1"); await pg.waitForTimeout(800);
if ((await pg.evaluate(() => est.plantel[0].pos)) !== "1") erros.push("Plantel: a posição não ficou guardada");
// alcunha no Plantel → grupos escritos em texto passam a ter jogadores ("👥 Ler")
await pg.fill("#pa-0", "Zeca"); await pg.waitForTimeout(800);
if ((await pg.evaluate(() => est.plantel[0].alc)) !== "Zeca") erros.push("Plantel: a alcunha não ficou guardada");
await pg.click("#tab-u"); await pg.waitForTimeout(150);
await pg.click("#u-gn"); await pg.fill("#ug-n", "Texto do PDF"); await pg.fill("#ug-o", "Vermelhos: Zeca | Amarelos: Ninguém"); await pg.click("#ug-ok"); await pg.waitForTimeout(150);
await pg.click("[data-lg]"); await pg.waitForSelector("#ulg-ok");
const desc = await pg.locator(".sheet").textContent();
await pg.click("#ulg-t button[data-k='']"); await pg.click("#ulg-ok"); await pg.waitForTimeout(150);
const lg = await pg.evaluate(() => uts[uCur].grupos.map((g) => g.nome + "=" + g.jogadores.join(",")));
const n0 = await pg.evaluate(() => est.plantel[0].n);
// alcunha num jogador de fora (ex.: "Guga") também é lida
await pg.click("#u-xn"); await pg.fill("#ux-n", "Gustavo Rocha"); await pg.fill("#ux-a", "Guga"); await pg.click("#ux-ok"); await pg.waitForTimeout(150);
const gx = await pg.evaluate(() => { const U = uts[uCur], e = U.extras.find((x) => x.nome === "Gustavo Rocha"); return { alc: e && e.alc, k: e && "e:" + e.id, lidos: gruposDoTexto(U, "Azuis: Guga").grupos.map((g) => g.jogadores.join(",")) }; });
if (gx.alc !== "Guga" || JSON.stringify(gx.lidos) !== JSON.stringify([gx.k])) erros.push("UT: alcunha do jogador de fora não foi lida " + JSON.stringify(gx));
// jogadores de fora que já treinaram: noutra UT escolhem-se da lista (com o escalão, a posição e a alcunha), sem escrever
const utA = await pg.evaluate(() => uCur);
await pg.evaluate(() => { const U = normUT({ id: "utx2", numero: 97, data: "2026-10-28" }); uts.utx2 = U; uCur = "utx2"; folhaExtraUT("utx2", null); });
await pg.waitForSelector("#ux-us .chip");
const lista = await pg.evaluate(() => [...document.querySelectorAll("#ux-us .chip")].map((b) => b.textContent));
await pg.fill("#ux-q", "guga"); const visG = await pg.evaluate(() => [...document.querySelectorAll("#ux-us .chip")].filter((b) => !b.hidden).length);
await pg.fill("#ux-q", ""); await pg.click("#ux-us .chip:has-text('Santiago C.')"); await pg.waitForTimeout(150);
const ux = await pg.evaluate(() => { const e = uts.utx2.extras.find((x) => x.nome === "Santiago C."); return { e: e && [e.escalao, e.pos].join("/"), dis: document.querySelector("#ux-us .chip[disabled]")?.textContent }; });
await pg.click("#sheet-root [data-close]"); await pg.evaluate((a) => { delete uts.utx2; uCur = a; }, utA);
if (!lista.some((t) => t.includes("Santiago C.")) || !lista.some((t) => t.includes("Gustavo Rocha")) || visG !== 1 || ux.e !== "Sub19/2" || !String(ux.dis).includes("Santiago C.")) erros.push("UT: lista dos jogadores de fora que já treinaram falhou " + JSON.stringify({ lista, visG, ux }));
// muitos grupos no PDF: continuam num bloco/página seguinte em vez de ficarem cortados
const pgs = await pg.evaluate(async () => { const U = clone(uts[uCur]), n0 = (await pdfUT(U)).getNumberOfPages();
  U.grupos = Array.from({ length: 40 }, (_, i) => ({ id: "g" + i, nome: "Grupo " + (i + 1), jogadores: U.grupos[0].jogadores, nota: "linha 1\nlinha 2" })); return [n0, (await pdfUT(U)).getNumberOfPages()]; });
if (!(pgs[1] > pgs[0])) erros.push("UT: grupos a mais deviam continuar noutra página do PDF " + JSON.stringify(pgs));
if (lg.length !== 2 || !lg[0].startsWith("Guarda-redes=") || lg[1] !== "Vermelhos=" + n0 || !desc.includes("Ninguém")) erros.push("UT: ler grupos do texto falhou " + JSON.stringify(lg));
await pg.locator(".ucampo").screenshot({ path: join(cap, "treino-campo-plantel.png") });
// jovem da formação: entra no Plantel (secção própria), pode ser suplente no Jogo e marcado na UT
await pg.click("#tab-p"); await pg.click("#p-addf"); await pg.waitForTimeout(150);
const iF = await pg.evaluate(() => est.plantel.length - 1);
await pg.fill(`#pn-${iF}`, "51"); await pg.fill(`#pm-${iF}`, "Júnior Teste"); await pg.selectOption(`#pp-${iF}`, "9"); await pg.waitForTimeout(800);
const jf = await pg.evaluate(() => ({ p: est.plantel[est.plantel.length - 1], sec: !!document.querySelector(".ptab tr.psec") }));
if (jf.p.n !== "51" || jf.p.esc !== "Sub19" || jf.p.pos !== "9" || !jf.sec) erros.push("Plantel: jovem da formação mal gravado " + JSON.stringify(jf));
await pg.screenshot({ path: join(cap, "plantel-formacao.png") });
await pg.click("#tab-j"); await pg.click("#j-sup .chip:has-text('51')"); await pg.waitForTimeout(150);
const sj = await pg.evaluate(() => ({ sup: jogo.suplentes.includes("51"), tag: [...document.querySelectorAll("#j-sup .chip")].some((c) => c.textContent.includes("51") && c.querySelector("em.esc")) }));
if (!sj.sup || !sj.tag) erros.push("Jogo: o jovem devia poder ser suplente, com o escalão à vista " + JSON.stringify(sj));
await pg.click("#tab-u"); await pg.waitForTimeout(150);
const noCampo = () => pg.evaluate(() => [...document.querySelectorAll(".ucampo text")].some((t) => t.textContent.includes("Júnior Teste")));
if (await noCampo()) erros.push("UT: jovem da formação sem marcação não devia aparecer no campo do plantel");
await pg.click(".upres button[data-k='51']"); await pg.waitForTimeout(150);
if (!(await noCampo())) erros.push("UT: jovem da formação marcado devia aparecer no campo do plantel");
await pg.screenshot({ path: join(cap, "treino-ut.png"), fullPage: true });
const [dUT] = await Promise.all([pg.waitForEvent("download", { timeout: 60000 }), pg.click("#u-pdf")]); const fUT = join(cap, "treino-ut.pdf"); await dUT.saveAs(fUT);
if (!dUT.suggestedFilename().startsWith("UT39_SCA_") || statSync(fUT).size < 30000) erros.push(`UT: PDF estranho ${dUT.suggestedFilename()} (${statSync(fUT).size} bytes)`);
// imagem de figura que não carrega (sem rede ou apagada): os PDF saem na mesma, com uma nota no lugar da figura
await pg.evaluate(() => { const fig = { imagem: { id: "naoexiste00000000000000000000000", w: 1600, h: 900 }, usa: "imagem" };
  editaUT((U) => { U.exercicios[0].copia.figura = { ...(U.exercicios[0].copia.figura || {}), ...fig }; }); });
const [dSem] = await Promise.all([pg.waitForEvent("download", { timeout: 60000 }), pg.click("#u-pdf")]); const fSem = join(cap, "treino-ut-sem-imagem.pdf"); await dSem.saveAs(fSem);
if (statSync(fSem).size < 20000) erros.push("UT: com uma imagem em falta o PDF devia sair na mesma");
await pg.click("#tab-x"); await pg.evaluate(() => { const E = exercicios[xCur]; guardaEx({ ...E, figura: { ...(E.figura || {}), imagem: { id: "naoexiste00000000000000000000000", w: 1600, h: 900 }, usa: "imagem" } }); });
const [dSemEx] = await Promise.all([pg.waitForEvent("download", { timeout: 60000 }), pg.click("#x-pdf")]); await dSemEx.saveAs(join(cap, "exercicio-sem-imagem.pdf"));
if (statSync(join(cap, "exercicio-sem-imagem.pdf")).size < 10000) erros.push("Exercício: com a imagem em falta o PDF devia sair na mesma");

// Ao vivo: substituição feita e depois editada; cartão a quem já saiu e a um suplente no banco
await pg.click("#tab-v"); await pg.waitForTimeout(150);
const supl = await pg.evaluate(() => { const t = new Set(titulares()), s = est.plantel.map((p) => p.n).filter((n) => n && !t.has(n)).slice(0, 3); guardaJogo({ ...jogo, suplentes: s, subs: [], eventos: [] }, true); return s; });
await pg.click("#ve-sb"); await pg.fill("#sv-m", "60:00"); await pg.click("#sv-s button >> nth=0"); await pg.click("#sv-e button >> nth=0"); await pg.waitForTimeout(150);
const sub0 = await pg.evaluate(() => jogo.subs[0] && { sai: jogo.subs[0].sai, entra: jogo.subs[0].entra });
await pg.click("#v-evs li span:has-text('🔁')"); await pg.waitForSelector("#sv-ok"); await pg.fill("#sv-m", "70:00"); await pg.click("#sv-e button >> nth=1"); await pg.click("#sv-ok"); await pg.waitForTimeout(150);
const sub1 = await pg.evaluate(() => ({ n: jogo.subs.length, min: jogo.subs[0].min, entra: jogo.subs[0].entra, conta: subsReais().lista.length }));
if (!sub0 || sub1.n !== 1 || sub1.min !== "70:00" || sub1.entra !== supl[1] || sub1.conta !== 1) erros.push("Ao vivo: editar a substituição falhou " + JSON.stringify({ sub0, sub1 }));
await pg.click("#ve-am"); await pg.click("#ev-j h5:has-text('Já saíram') + .pgrid button"); await pg.click("#ev-ok"); await pg.waitForTimeout(120);
await pg.click("#ve-am"); await pg.click("#ev-j h5:has-text('Banco') + .pgrid button"); await pg.click("#ev-ok"); await pg.waitForTimeout(120);
const cts = await pg.evaluate(() => jogo.eventos.filter((e) => e.tipo === "amarelo").map((e) => e.n));
if (cts[0] !== sub0.sai || !supl.includes(cts[1]) || cts[1] === sub1.entra) erros.push("Ao vivo: cartão a quem saiu / ao banco falhou " + JSON.stringify(cts));
await pg.screenshot({ path: join(cap, "ao-vivo-subs-cartoes.png") });
// Pós-jogo: falta sofrida por um jogador nosso conta como falta cometida do adversário
const fal = await pg.evaluate(() => { const r = (ac, eq) => ({ id: Math.random().toString(36).slice(2, 9), c: Date.now(), ac, eq, x: .5, y: .5, j: eq === "nos" ? "1" : null, parte: 1, seg: 60 });
  guardaAn({ ...an, regs: [r("fs", "nos"), r("fs", "nos"), r("fc", "nos")] }); const E = estatJogo(); const o = { eles: E.t.eles.fal, nos: E.t.nos.fal }; guardaAn({ ...an, regs: [] }); return o; });
if (fal.eles !== 2 || fal.nos !== 1) erros.push("Pós-jogo: faltas sofridas deviam contar como faltas do adversário " + JSON.stringify(fal));
// faltas só do nosso lado: com o adversário escolhido, "Falta cometida" e "Falta sofrida" ficam desligadas e não gravam
await pg.click("#tab-a"); await pg.waitForTimeout(150); await pg.click("#ae-eles"); await pg.waitForTimeout(100);
const fb = await pg.evaluate(() => { const bs = [...document.querySelectorAll("#a-acoes button")], d = (n) => bs.find((b) => b.textContent.includes(n))?.disabled;
  anSel = { ...anSel, ac: "fc", pt: { x: .5, y: .5 } }; const grava = tentaGravar(null); anSel = { ac: null, eq: "nos", pt: null }; renderAnalise(); return { fc: d("Falta cometida"), fs: d("Falta sofrida"), rem: d("Remate enquadrado"), grava }; });
if (!fb.fc || !fb.fs || fb.rem || fb.grava) erros.push("Pós-jogo: as faltas do adversário deviam estar bloqueadas " + JSON.stringify(fb));
await pg.evaluate(() => guardaJogo({ ...jogo, subs: [], eventos: [] }, true));
// Arquivo: a análise pós-jogo de um jogo arquivado vê-se no Relatório (só leitura) e o jogo atual não muda
const arq = await pg.evaluate(() => { const r = (ac, j) => ({ id: Math.random().toString(36).slice(2, 9), c: Date.now(), ac, eq: "nos", x: .6, y: .4, j, parte: 1, seg: 90 });
  guardaAn({ ...an, regs: [r("re", "9"), r("golo", "9"), r("per", "7")] });
  const J = { id: "Jtestearq", ...snapshotJogo(), adversario: "Arquivado FC", data: "2026-10-01", resultado: { nos: "1", eles: "0" }, obs: "", arquivadoEm: new Date().toISOString() };
  J.analise.regs.forEach((x) => { if (x.j === "9") x.nome = "Ponta Teste"; });
  hist[J.id] = J; guardaAn({ ...an, regs: [] }); return J.analise.regs.length; });
await pg.click("#tab-h"); await pg.click("#h-lista button:has-text('Arquivado FC')"); await pg.click("#aj-an"); await pg.waitForTimeout(200);
const vr = await pg.evaluate(() => ({ sel: $("r-jogo").value, info: !$("r-arqinfo").hidden, limpar: $("a-limpar").hidden, vis: !$("a-relatorio").hidden, jog: $("r-jog").textContent, golos: [...$("r-orig").querySelectorAll("tr")][1]?.children[4]?.textContent, atual: an.regs.length }));
if (arq !== 3 || vr.sel !== "Jtestearq" || !vr.info || !vr.limpar || !vr.vis || !vr.jog.includes("Ponta Teste") || vr.golos !== "1" || vr.atual !== 0) erros.push("Arquivo: a análise do jogo arquivado devia abrir no Relatório " + JSON.stringify(vr));
await pg.screenshot({ path: join(cap, "pos-jogo-arquivado.png") });
// PDF para os jogadores: grupo e individual (só as ações do jogador), a partir do jogo arquivado
await pg.click("#a-jpdf"); await pg.waitForSelector("#pj-js");
const pj = await pg.evaluate(async () => { const chips = [...document.querySelectorAll("#pj-js .chip")].map((b) => [b.dataset.k, b.getAttribute("aria-pressed")]); const G = hist.Jtestearq;
  const g = await relatorioJogadoresPdf(G, null), i = await relatorioJogadoresPdf(G, "9"); return { chips, gp: g.getNumberOfPages(), ip: i.getNumberOfPages(), gt: g.output().length, it: i.output().length }; });
await pg.screenshot({ path: join(cap, "pdf-jogadores-folha.png") }); await pg.click("#sheet-root [data-close]");
if (!pj.chips.some(([k, p]) => k === "9" && p === "true") || !pj.chips.some(([k, p]) => k === "7" && p === "true") || pj.gp < 1 || pj.ip < 1 || pj.gt < 20000 || pj.it < 15000) erros.push("Pós-jogo: PDF para os jogadores falhou " + JSON.stringify(pj));
await pg.selectOption("#r-jogo", ""); await pg.waitForTimeout(100);
const va = await pg.evaluate(() => ({ info: !$("r-arqinfo").hidden, limpar: $("a-limpar").hidden, jog: $("r-jog").textContent }));
if (va.info || va.limpar || !va.jog.includes("Ainda sem registos")) erros.push("Arquivo: voltar ao jogo atual no Relatório falhou " + JSON.stringify(va));
await pg.evaluate(() => { delete hist.Jtestearq; relArq = ""; anVista = "reg"; renderAnalise(); });

// Planeamento anual: marcar UT e folga num dia, microciclo e mesociclo; a semana nova segue o anual (nº da UT, folga, nº do microciclo)
await pg.click("#tab-u"); await pg.click(".u-modo button[data-m='ano']"); await pg.waitForSelector(".pan");
const iniA = await pg.evaluate(() => { const h = segundaDe(isoDia(new Date())); return diaMais(h, 14); }), dA = await pg.evaluate((i) => diasDaSemana(i), iniA);
await pg.evaluate((d) => { aEpoca = +d.slice(0, 4) - (+d.slice(5, 7) < 7 ? 1 : 0); renderUT(); }, dA[0]);
await pg.click(`.pan td[data-d='${dA[0]}']`); await pg.click("#ad-t button[data-k='folga']"); await pg.click("#ad-ok"); await pg.waitForTimeout(100);
await pg.click(`.pan td[data-d='${dA[1]}']`); await pg.click("#ad-t button[data-k='ut']"); await pg.fill("#ad-n", "501"); await pg.click("#ad-ok"); await pg.waitForTimeout(100);
await pg.click(`.pan td.pan-mi[data-mi='${iniA}']`); await pg.fill("#am-n", "77"); await pg.click("#am-ok"); await pg.waitForTimeout(100);
await pg.click("#a-meso-n"); await pg.fill("#ae-n", "9"); await pg.fill("#ae-i", dA[0]); await pg.fill("#ae-f", dA[6]); await pg.click("#ae-p button[data-k='trans']"); await pg.click("#ae-ok"); await pg.waitForTimeout(100);
const an1 = await pg.evaluate((ds) => ({ f: anual[ds[0]]?.tipo, ut: anual[ds[1]]?.ut, mi: microDe(ds[0])?.n, me: mesoDe(ds[3])?.periodo, sem: (() => { const z = semanaTipo(ds[0].slice(0, 10)); return { seg: z[ds[0]].folga, ter: z[ds[1]].tarde.map((x) => x.treino).join(","), n: numeroSemana(ds[0]) }; })() }), dA);
if (an1.f !== "folga" || an1.ut !== 501 || an1.mi !== 77 || an1.me !== "trans" || !an1.sem.seg || an1.sem.ter !== "501" || an1.sem.n !== 77) erros.push("Planeamento anual: " + JSON.stringify(an1));
await pg.screenshot({ path: join(cap, "planeamento-anual.png") });

// Plano semanal: jogo fora da ilha no calendário → semana nova (ida na véspera de manhã, regresso no dia do jogo, treinos à noite);
// folga do dia, duas atividades na mesma tarde, concentração e texto do dia de jogo; PDF
await pg.click("#tab-u"); await pg.click(".u-modo button[data-m='semana']"); await pg.waitForSelector("#s-nova2");
const iniS = await pg.evaluate(() => { const h = segundaDe(isoDia(new Date())); return new Date().getDay() >= 5 ? diaMais(h, 7) : h; });
const dS = await pg.evaluate((i) => diasDaSemana(i), iniS);
await pg.click("#s-jn"); await pg.fill("#jc-d", dS[6]); await pg.fill("#jc-h", "15:00"); await pg.fill("#jc-a", "União Micaelense");
await pg.click("#jc-c button[data-k='']"); await pg.click("#jc-v button[data-k='1']"); await pg.fill("#jc-de", "S. Miguel");
await pg.fill("#jc-p", "Campeonato dos Açores"); await pg.fill("#jc-j", "4ª Jornada"); await pg.click("#jc-ok"); await pg.waitForTimeout(150);
await pg.click("#s-nova2"); await pg.waitForTimeout(200);
const sem = await pg.evaluate(() => { const S = semanas[sCur], ds = diasDaSemana(S.inicio), z = (k, t) => S.dias[ds[k]][t].map((x) => x.tipo + ":" + x.txt + ":" + x.conc).join("|");
  return { ini: S.inicio, sab: z(5, "manha"), dom: z(6, "tarde"), ter: z(1, "tarde"), jogo: !!document.querySelector(".psem .ps-jogo") }; });
if (sem.ini !== iniS || sem.sab !== "viagem:Ida para S. Miguel:" || sem.dom !== "viagem:Regresso:" || sem.ter !== "treino::19:15" || !sem.jogo) erros.push("Plano semanal: semana-tipo errada " + JSON.stringify(sem));
// folga o dia todo na segunda
await pg.click(`.psem td[data-d='${dS[0]}'][data-t='manha']`); await pg.click("#st-dia"); await pg.waitForTimeout(150);
if (!(await pg.locator(".psem .ps-folga").count())) erros.push("Plano semanal: a folga não ficou marcada");
// quarta à tarde: treino + ginásio
await pg.click(`.psem td[data-d='${dS[2]}'][data-t='tarde']`); await pg.click(".st-add button[data-add='ginasio']"); await pg.fill("#sa-x", "Ginásio do clube"); await pg.click("#sa-ok"); await pg.waitForTimeout(150);
await pg.click(".sheet [data-close]"); await pg.waitForTimeout(100);
// dia de jogo: concentração e texto
await pg.click(`.psem td[data-d='${dS[6]}'][data-t='tarde']`); await pg.fill("#st-jc", "13:30"); await pg.fill("#st-jl", "Aeroporto de Ponta Delgada"); await pg.fill("#st-jt", "Regresso 20:30"); await pg.click("#st-jok"); await pg.waitForTimeout(150);
const ed = await pg.evaluate((ds) => { const S = semanas[sCur]; return { qua: S.dias[ds[2]].tarde.map((x) => x.tipo).join(","), jogo: S.dias[ds[6]].jogo.conc + "/" + S.dias[ds[6]].jogo.txt, txt: document.querySelector(".psem .ps-jogo").textContent.includes("REGRESSO 20:30") }; }, dS);
if (ed.qua !== "treino,ginasio" || ed.jogo !== "13:30/Regresso 20:30" || !ed.txt) erros.push("Plano semanal: edição errada " + JSON.stringify(ed));
await pg.screenshot({ path: join(cap, "plano-semanal.png"), fullPage: true });
const [dPS] = await Promise.all([pg.waitForEvent("download", { timeout: 60000 }), pg.click("#s-pdf")]); const fPS = join(cap, "plano-semanal.pdf"); await dPS.saveAs(fPS);
if (statSync(fPS).size < 20000) erros.push(`Plano semanal: PDF estranho (${statSync(fPS).size} bytes)`);
await pg.click(".u-modo button[data-m='ut']");

// Adversário: equipa e plantel, onze do jogo, substituição no Jogo → o Encaixe muda; o Onze e as bolas paradas não; arquivar guarda; o jogo seguinte começa limpo
await pg.evaluate(() => guardaJogo({ ...jogo, adversario: "Equipa Teste" }, true));
await pg.click("#tab-d"); await pg.waitForTimeout(150); await pg.click("#d-cria"); await pg.waitForTimeout(150);
await pg.evaluate(() => { const T = eqAdv(); guardaEquipa({ ...T, plantel: Array.from({ length: 14 }, (_, i) => ({ id: "a" + (i + 1), n: String(i + 1), nome: "Adv " + (i + 1), pos: "" })) }); });
await pg.selectOption("#d-sis", "4-3-3"); await pg.waitForTimeout(150);
await pg.evaluate(() => { const N = clone(advJ()); N.onze.forEach((o, i) => { if (i) o.n = String(i + 1); }); N.suplentes = ["12", "13", "14"]; guardaAdvJogo(N); });
await pg.click("#dstage g.bola >> nth=0"); await pg.click("#ao-g button[data-n='1']"); await pg.click("#ao-ok"); await pg.waitForTimeout(150);
await pg.screenshot({ path: join(cap, "adversario.png") });
const BP = (await pg.evaluate(() => lances().find((l) => l.tipo !== "JOGO").id));
const antesAdv = await pg.evaluate((bp) => ({ linhas: JSON.stringify(est.linhas), onze: JSON.stringify(jogo.onze), svgOnze: desenha(lances().find((l) => l.id === "onze"), { clean: true }).outerHTML, svgBP: desenha(lances().find((l) => l.id === bp), { clean: true, semAnim: true }).outerHTML, gr: advJ().onze[0].n }), BP);
await pg.click("#tab-j"); await pg.click("#j-sa-add"); await pg.fill("#sa-min", "63"); await pg.click("#sa-g1 button[data-n='9']"); await pg.click("#sa-g2 button[data-n='14']"); await pg.click("#sa-ok"); await pg.waitForTimeout(150);
const depoisAdv = await pg.evaluate((bp) => { const svg = desenhaEncaixe({ clean: true }), lab = [...svg.querySelectorAll("g.bola")].map((g) => g.getAttribute("aria-label"));
  return { n: (jogo.subsAdv || []).length, nomes: svg.textContent.includes("Adv 14") && svg.textContent.includes("Adv 2"), em: advEmCampo().on.map((o) => o.n), tem14: lab.includes("Equipa Teste 14"), tem9: lab.includes("Equipa Teste 9"), nos: lab.filter((l) => l.startsWith("SC Angrense")).length, lista: $("j-sa").textContent,
    linhas: JSON.stringify(est.linhas), onze: JSON.stringify(jogo.onze), svgOnze: desenha(lances().find((l) => l.id === "onze"), { clean: true }).outerHTML, svgBP: desenha(lances().find((l) => l.id === bp), { clean: true, semAnim: true }).outerHTML,
    pdf: lances().filter((l) => l.tipo === "JOGO").map((l) => l.id), tv: !!desenhaItemTV(itensTV(lances(), false).find((x) => x.ids[0] === "encaixe")) }; }, BP);
if (antesAdv.gr !== "1" || depoisAdv.n !== 1 || !depoisAdv.em.includes("14") || depoisAdv.em.includes("9") || !depoisAdv.tem14 || depoisAdv.tem9 || depoisAdv.nos !== 11 || !depoisAdv.lista.includes("63'") || !depoisAdv.nomes) erros.push("Adversário: a substituição devia atualizar o Encaixe " + JSON.stringify({ ...depoisAdv, svgOnze: 0, svgBP: 0, linhas: 0, onze: 0 }));
if (depoisAdv.linhas !== antesAdv.linhas || depoisAdv.onze !== antesAdv.onze || depoisAdv.svgOnze !== antesAdv.svgOnze || depoisAdv.svgBP !== antesAdv.svgBP) erros.push("Adversário: a substituição do adversário mexeu no Onze ou nas bolas paradas");
if (depoisAdv.pdf[1] !== "encaixe" || !depoisAdv.tv) erros.push("Adversário: o Encaixe devia estar nos quadros do jogo (PDF e TV) a seguir ao Onze " + JSON.stringify(depoisAdv.pdf));
// Ao vivo: a substituição do adversário aparece na lista; botão próprio; amarelo a um jogador do adversário → «Possíveis Encaixes» com o cartão (2.º amarelo = esbatido)
await pg.click("#tab-v"); await pg.waitForTimeout(150);
const vivoLista = await pg.evaluate(() => $("v-evs").textContent);
await pg.click("#ve-sa"); await pg.waitForSelector("#sa-min"); await pg.click("#sheet-root [data-close]");
await pg.click("#ve-am"); await pg.click("#ev-t button[data-t='amarelo_adv']"); await pg.click("#ev-adv .pgrid button[data-n='10']"); await pg.click("#ev-ok"); await pg.waitForTimeout(150);
const cart = await pg.evaluate(() => { const e = jogo.eventos.find((x) => x.tipo === "amarelo_adv"), svg = desenhaEncaixe({ clean: true }), bolas = [...svg.querySelectorAll("g.bola")], g = bolas.find((x) => x.getAttribute("aria-label") === "Equipa Teste 10");
  return { na: e && e.na, pa: e && e.pa, rect: g && !!g.querySelector("rect[fill='#FFD400']") ? "#FFD400" : "", tit: svg.textContent.includes("Possíveis Encaixes"), soNum: bolas.filter((x) => x.getAttribute("aria-label").startsWith("SC Angrense")).every((x) => x.querySelectorAll("text").length === 1), banco: svg.textContent.includes("Suplentes Equipa Teste") && svg.textContent.includes("Adv 12"), lista: $("v-evs").textContent }; });
await pg.evaluate(() => guardaJogo({ ...jogo, eventos: [...jogo.eventos, { id: "am2", c: Date.now(), tipo: "amarelo_adv", min: "80", na: "10", pa: jogo.eventos.find((x) => x.tipo === "amarelo_adv").pa }] }, true));
const esb = await pg.evaluate(() => [...desenhaEncaixe({ clean: true }).querySelectorAll("g.bola")].find((x) => x.getAttribute("aria-label") === "Equipa Teste 10").getAttribute("opacity"));
if (!vivoLista.includes("Equipa Teste") || !vivoLista.includes("Adv 9") || cart.na !== "10" || cart.pa !== "a10" || cart.rect !== "#FFD400" || !cart.tit || !cart.soNum || !cart.banco || !cart.lista.includes("Amarelo adversário · 10 · Adv 10") || esb !== ".45")
  erros.push("Ao vivo / Possíveis Encaixes: substituição ou cartões do adversário falharam " + JSON.stringify({ vivoLista: vivoLista.slice(0, 120), ...cart, lista: cart.lista.slice(0, 160), esb }));
await pg.click("#tab-q"); await pg.evaluate(() => { curId = "encaixe"; render(); }); await pg.waitForTimeout(150); await pg.screenshot({ path: join(cap, "encaixe.png") });
await pg.click("#tab-h"); await pg.click("#h-arq"); await pg.click("#ar-ok"); await pg.waitForTimeout(200);
const arqAdv = await pg.evaluate(() => { const J = Object.values(hist).find((h) => h.adversario === "Equipa Teste"); return { onze: J && J.adv.onze.filter((o) => o.n).length, subs: J && J.adv.subs.length, nomeSub: J && J.adv.subs[0]?.nomeEntra, novoOnze: advJ().onze.length, novoSubs: (jogo.subsAdv || []).length, equipa: advJ().equipa, plantel: Object.values(advs).find((t) => t.nome === "Equipa Teste")?.plantel.length }; });
if (arqAdv.onze !== 11 || arqAdv.subs !== 1 || arqAdv.nomeSub !== "Adv 14" || arqAdv.novoOnze !== 0 || arqAdv.novoSubs !== 0 || arqAdv.equipa !== "" || arqAdv.plantel !== 14) erros.push("Adversário: arquivar devia guardar o onze e as substituições e começar o jogo seguinte limpo " + JSON.stringify(arqAdv));
await pg.evaluate(() => { Object.keys(hist).forEach((k) => { if (hist[k].adversario === "Equipa Teste") delete hist[k]; }); });
// importar da SCA Observação: ficheiro do plantel base → equipa com origem "observacao" e, no jogo atual, cores e onze provável (siglas iguais às da Observação)
const Pobs = { app: "SCA Observação", tipo: "plantel-adversario", versao: 1, exportadoEm: "2026-10-27T10:00:00Z", equipa: { id: "lusitania", nome: "Lusitânia" },
  plantel: [...Array.from({ length: 12 }, (_, i) => ({ id: "j" + i, n: String(i + 1), nome: "Lus " + (i + 1), pos: i ? "" : "GR" })), { id: "j12", n: "1", nome: "Lus Duplicado", pos: "GR" }], sistema: "4-4-2", cores: { cam: "#00A000", cam2: "#FFFFFF", num: "#FFFFFF", gr: "#FFFF00" },
  onzeProv: { sis: "4-4-2", pos: { GR: "j0", LD: "j1", PLD: "j9", PLE: "j10" } }, onzeAlt: null, fonte: "plantel base de 27/10/2026 · onzes do relatório vs Teste" };
await pg.evaluate(() => guardaJogo({ ...jogo, adversario: "Lusitânia" }, true));
await pg.click("#tab-d"); await pg.waitForTimeout(150);
await pg.setInputFiles("#d-file", { name: "Plantel_lusitania.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(Pobs)) });
await pg.click("#ia-ok"); await pg.waitForTimeout(200);
const imp = await pg.evaluate(() => { const T = advs.lusitania, A = advJ(); return { origem: T && T.origem, n: T && T.plantel.length, eq: A.equipa, sis: A.sistema, gr: A.onze.find((o) => o.slot === "GR")?.n, ple: A.onze.find((o) => o.slot === "PLE")?.n, cam: A.cores.cam, txt: $("d-form").textContent }; });
if (imp.origem !== "observacao" || imp.n !== 13 || imp.eq !== "lusitania" || imp.sis !== "4-4-2" || imp.gr !== "1" || imp.ple !== "11" || imp.cam !== "#00A000" || !imp.txt.includes("importado da SCA Observação")) erros.push("Adversário: importar da Observação falhou " + JSON.stringify({ ...imp, txt: imp.txt.slice(0, 160) }));
await pg.screenshot({ path: join(cap, "adversario-importado.png") });
// dois jogadores com o mesmo número aparecem os dois; ao tocar no GR, os GR vêm primeiro; a pesquisa filtra
await pg.click("#dstage g.bola[aria-label^='GR ']"); await pg.waitForSelector("#ao-g .pgrid");
const gr = await pg.evaluate(() => { const bs = [...document.querySelectorAll("#ao-g .pgrid button")]; return { um: bs.filter((b) => b.dataset.n === "1").length, primeiros: bs.slice(0, 2).map((b) => b.querySelector("small").textContent) }; });
await pg.fill("#ao-g .ga-q", "dupl"); const vis = await pg.evaluate(() => [...document.querySelectorAll("#ao-g .pgrid button")].filter((b) => !b.hidden).map((b) => b.querySelector("span").textContent));
await pg.click("#ao-g .pgrid button:not([hidden])"); await pg.click("#ao-ok"); await pg.waitForTimeout(150);
const dup = await pg.evaluate(() => { const o = advJ().onze.find((x) => x.slot === "GR"); return { pid: o.pid, n: o.n, nome: nomeAdv(o.n, o.pid), sup: [...document.querySelectorAll("#d-sup .chip")].filter((c) => c.children[0].textContent === "1").length }; });
if (gr.um !== 2 || !gr.primeiros.every((t) => t.startsWith("GR")) || vis.length !== 1 || vis[0] !== "Lus Duplicado" || dup.pid !== "j12" || dup.n !== "1" || dup.nome !== "Lus Duplicado" || dup.sup !== 1) erros.push("Adversário: números repetidos, GR primeiro ou pesquisa falharam " + JSON.stringify({ gr, vis, dup }));
await pg.fill("#d-plq", "lus 1"); const filtro = await pg.evaluate(() => [...document.querySelectorAll("#d-pl .dp-row")].filter((r) => !r.hidden).length); await pg.fill("#d-plq", "");
if (filtro !== 4) erros.push("Adversário: a pesquisa no plantel devia mostrar Lus 1, 10, 11 e 12, mostrou " + filtro);
// importar outra vez substitui o plantel só com 2 toques
await pg.setInputFiles("#d-file", { name: "Plantel_lusitania.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ ...Pobs, plantel: Pobs.plantel.slice(0, 11) })) });
await pg.click("#ia-ok"); const n1 = await pg.evaluate(() => advs.lusitania.plantel.length); await pg.click("#ia-ok"); await pg.waitForTimeout(150);
const n2 = await pg.evaluate(() => advs.lusitania.plantel.length);
if (n1 !== 13 || n2 !== 11) erros.push("Adversário: substituir o plantel importado devia pedir 2 toques " + JSON.stringify({ n1, n2 }));

// base de dados simulada: no link, os dados que chegam da base de dados vêm congelados (snapshots e data());
// a app tem de os copiar à entrada (lerDoc), senão uma alteração a seguir pode não mudar nada sem dar erro (como na app de observação)
{
  const ctx = ipad ? await browser.newContext({ ...devices["iPad (gen 7) landscape"] }) : await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const pb = await ctx.newPage();
  pb.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push("bd simulada: " + s); });
  await pb.addInitScript(() => {
    window.__docs = {}; window.__ouve = {};
    const ouve = (p, cb) => { (window.__ouve[p] = window.__ouve[p] || []).push(cb); return () => {}; };
    const meta = { hasPendingWrites: false, fromCache: false };
    const fz = (o) => { if (o && typeof o === "object") { Object.values(o).forEach(fz); Object.freeze(o); } return o; };
    // entrega um documento (caminho com "/") ou uma coleção ({id: dados}), congelados como no link
    window.__entrega = (p, dados) => (window.__ouve[p] || []).forEach((cb) => cb(p.includes("/")
      ? fz({ exists: true, data: () => fz(JSON.parse(JSON.stringify(dados))), metadata: meta })
      : fz({ docs: Object.entries(dados).map(([id, x]) => fz({ id, data: () => fz(JSON.parse(JSON.stringify(x))) })), metadata: meta })));
    window.claude = { use: async (n) => {
      if (n === "user") return { id: async () => "u_teste", can: async () => true };
      if (n === "db") return { collection: (p) => ({ onSnapshot: (cb) => ouve(p, cb) }),
        doc: (p) => ({ onSnapshot: (cb) => ouve(p, cb), set: async (b) => { window.__docs[p] = JSON.parse(JSON.stringify(b)); }, delete: async () => { delete window.__docs[p]; } }) };
      return null; } };
  });
  await pb.goto(pathToFileURL(join(raiz, "dist/index.html")).href); await pb.evaluate(() => localStorage.clear()); await pb.reload(); await pb.waitForTimeout(1200);
  await pb.evaluate(() => {
    const E = normEx({ id: "xbd", nome: "Exercício da bd", figura: { quadro: { rot: "nada", pecas: [{ id: "p1", eq: "nos", pos: "J1" }], passos: [{ id: "a", pos: { p1: { x: 10, y: 10 } }, setas: [{ id: "s1", t: "passe", x1: 1, y1: 1, x2: 5, y2: 5 }], zonas: [] }] } } });
    __entrega("estado/atual", { ...normEst({ plantel: [{ n: "7", nome: "Sete" }, { n: "9", nome: "Nove" }] }), atualizadoEm: "2026-10-26T10:00:00Z" });
    __entrega("tv/config", { seg: 10, junta: true, ordem: [], sel: [], conhecidos: [], modelo: { seg: 8, ordem: [], sel: [], conhecidos: [] }, atualizadoEm: "2026-10-26T10:00:00Z" });
    __entrega("lances", { [DEF_LANCES[0].id]: { ...clone(DEF_LANCES[0]), nome: "Lance da bd", atualizadoEm: "x" } });
    __entrega("historico", { Jbd: { id: "Jbd", ...snapshotJogo(), resultado: { nos: "1", eles: "0" } } });
    __entrega("modelo", { qbd: normQ({ id: "qbd", nome: "Quadro da bd", pecas: [{ id: "p1", eq: "nos", pos: "J1" }], passos: [{ id: "a", pos: { p1: { x: 10, y: 10 } }, setas: [{ id: "s1", t: "passe", x1: 1, y1: 1, x2: 5, y2: 5 }], zonas: [{ id: "z1", x: 1, y: 1, w: 5, h: 5 }] }] }) });
    __entrega("exercicios", { xbd: E });
    __entrega("uts", { utbd: normUT({ id: "utbd", numero: 99, presencas: { 7: "P" }, exercicios: [{ id: "l1", exId: "xbd", copia: E }] }) });
    __entrega("calendario", { jbd: normJogoCal({ id: "jbd", data: "2026-11-01", adversario: "Praiense" }) });
    __entrega("adversarios", { eqbd: normAdvEquipa({ nome: "Equipa da bd", plantel: [{ id: "a", n: "9", nome: "Nove" }] }, "eqbd") });
    __entrega("subsAdv", { sbd: { id: "sbd", sai: "9", entra: "10", min: "20", c: 1 } });
  });
  await pb.waitForTimeout(300);
  // nada do estado da app pode ficar congelado (nem lá dentro)
  const cong = await pb.evaluate(() => { const acha = (o, c) => { if (!o || typeof o !== "object") return null; if (Object.isFrozen(o)) return c;
      for (const [k, v] of Object.entries(o)) { const r = acha(v, c + "." + k); if (r) return r; } return null; };
    const E = { est, jogo, lancesDb, notas, hist, an, anCfg, vivo, tvCfg, modelos, exercicios, uts, semanas, calendario, anual, ciclos, advs };
    return { cong: Object.entries(E).map(([k, v]) => acha(v, k)).filter(Boolean), tv: tvCfg && "atualizadoEm" in tvCfg, lance: lanceAtual().nome, ut: !!uts.utbd, q: !!modelos.qbd, adv: !!advs.eqbd, sa: (jogo.subsAdv || []).length }; });
  if (cong.cong.length || cong.tv || !cong.ut || !cong.q || !cong.adv || cong.sa !== 1) erros.push("bd simulada: dados congelados da base de dados no estado da app " + JSON.stringify(cong));
  // edições a seguir: um nome do Plantel e uma presença da UT têm de ficar gravados
  await pb.click("#tab-p"); await pb.fill("#pm-0", "Sete Editado"); await pb.waitForTimeout(900);
  await pb.evaluate(() => { uCur = "utbd"; marcaPres("9", "L"); });
  await pb.waitForTimeout(200);
  // substituições do adversário: um documento cada (subsAdv/<id>), fora do jogo/atual; plantel em adversarios/<id>
  await pb.evaluate(() => { guardaJogo({ ...jogo, adv: { ...advJ(), equipa: "eqbd" }, subsAdv: [...jogo.subsAdv, { id: "sax", sai: "10", entra: "11", min: "70", c: 2 }] }, true); guardaEquipa({ ...advs.eqbd, plantel: [...advs.eqbd.plantel, { id: "b", n: "11", nome: "Onze", pos: "PL" }] }, true); });
  await pb.waitForTimeout(400);
  const gsa2 = await pb.evaluate(() => { return { doc: __docs["subsAdv/sax"]?.entra, noJogo: "subsAdv" in (__docs["jogo/atual"] || {}), eq: __docs["jogo/atual"]?.adv?.equipa, pl: __docs["adversarios/eqbd"]?.plantel.length }; });
  if (gsa2.doc !== "11" || gsa2.noJogo || gsa2.eq !== "eqbd" || gsa2.pl !== 2) erros.push("bd simulada: substituições do adversário ou plantel do adversário mal gravados " + JSON.stringify(gsa2));
  const gr = await pb.evaluate(() => ({ nome: est.plantel[0].nome, bdNome: __docs["estado/atual"]?.plantel[0].nome, pres: __docs["uts/utbd"]?.presencas }));
  if (gr.nome !== "Sete Editado" || gr.bdNome !== "Sete Editado" || gr.pres?.["7"] !== "P" || gr.pres?.["9"] !== "L") erros.push("bd simulada: edição a seguir não ficou gravada " + JSON.stringify(gr));
  await ctx.close();
}

await browser.close();
if (erros.length) { console.error("FALHOU:\n" + erros.join("\n")); process.exit(1); }
console.log(`OK${ipad ? " (WebKit · iPad)" : ""} · capturas em ${ipad ? "tests/capturas/ipad/" : "tests/capturas/"}`);
