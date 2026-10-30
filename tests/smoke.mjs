// Teste de fumo no browser (sem base de dados: a app corre em modo "só neste aparelho").
// Requisitos: npm install && npx playwright install chromium
// Uso: npm test   → falha se houver erros de JavaScript; guarda capturas em tests/capturas/
//      npm run test:ipad → o mesmo no WebKit (motor do Safari) com ecrã e toque de iPad; capturas em tests/capturas/ipad/
//      (precisa de: npx playwright install webkit)
import { chromium, webkit, devices } from "playwright";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
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
// Quadro: setas ◀ ▶ e teclas ← → passam de lance (com volta ao início)
await pg.click("#tab-q"); await pg.waitForTimeout(150);
const setas = await (async () => { const t = () => pg.evaluate(() => $("b-title").textContent + "|" + $("b-pos").textContent);
  const a = await t(); await pg.click("#next"); const b = await t(); await pg.keyboard.press("ArrowLeft"); const c = await t(); await pg.click("#prev"); const d = await t();
  const tot = await pg.evaluate(() => lances().length); return { a, b, c, d, tot }; })();
if (setas.a !== setas.c || setas.a === setas.b || !setas.b.endsWith("2 / " + setas.tot) || !setas.d.endsWith(setas.tot + " / " + setas.tot))
  erros.push("Quadro: as setas ◀ ▶ (e as teclas) não passam bem de lance " + JSON.stringify(setas));
await pg.click("#next"); await pg.waitForTimeout(100);
// v108: posição inicial ligada — o «Canto Esq. Comb. 3» (10) passa a seguir o «Canto Esq. Fechado» (8) pela folha do lance
await pg.evaluate(() => { curId = "10"; editing = true; render(); }); await pg.click("#e-props"); await pg.selectOption("#pp-b", "8"); await pg.click("#pp-ok"); await pg.waitForTimeout(150);
const lig = await pg.evaluate(() => { const g = (id) => lances().find((l) => l.id === id), P = (L) => pecasPos(L), B = g("8"), F = g("10");
  const r = { base: F.base, soltas: soltasDe(F).join(","), iguais: Object.keys(P(F)).filter((k) => P(B)[k] && !soltasDe(F).includes(k)).every((k) => P(F)[k].cx === P(B)[k].cx && P(F)[k].cy === P(B)[k].cy), hint: $("hint").textContent.includes("Posição inicial do") };
  /* mexer no slide inicial: o 7 vai 3000 para a direita; no 10 a bolinha e a seta que sai dela acompanham (o destino fica) */
  const f7 = P(F)["7"], s0 = (F.setas || []).findIndex((s) => Math.hypot(s.x1 - f7.cx, s.y1 - f7.cy) <= (f7.r || 1450) * 1.6), x2 = s0 >= 0 ? F.setas[s0].x2 : null;
  if (s0 < 0) { const C = copiaLance(F); C.setas = [...(C.setas || []), { x1: f7.cx, y1: f7.cy, x2: f7.cx + 5000, y2: f7.cy, c: "#000", w: 120 }]; guardaLance(C, { segue: true }); }
  const F1 = g("10"), si = s0 >= 0 ? s0 : F1.setas.length - 1, X2 = F1.setas[si].x2;
  const C = copiaLance(B); pecasPos(C)["7"].cx += 3000; guardaLance(C);
  const F2 = g("10"); r.segue = P(F2)["7"].cx === P(g("8"))["7"].cx; r.seta = F2.setas[si].x1 === F1.setas[si].x1 + 3000 && F2.setas[si].x2 === X2;
  desfazQuadro(); r.desfaz = P(g("8"))["7"].cx === P(B)["7"].cx && P(g("10"))["7"].cx === P(F1)["7"].cx;
  /* mexer no 7 do lance ligado: fica solto e já não segue */
  const D = copiaLance(g("10")); pecasPos(D)["7"].cy += 2000; guardaLance(D); r.solto = soltasDe(g("10")).includes("7");
  const E = copiaLance(g("8")); pecasPos(E)["7"].cx += 1000; guardaLance(E); r.naoSegue = P(g("10"))["7"].cx !== P(g("8"))["7"].cx;
  voltaSeguir(g("10"), "7"); r.volta = !soltasDe(g("10")).includes("7") && P(g("10"))["7"].cx === P(g("8"))["7"].cx;
  const bt = (id) => document.querySelector(`#nav li[data-id="${id}"] button`); r.lista = bt("8").classList.contains("ini") && bt("10").classList.contains("segue");
  return r; });
if (JSON.stringify(lig) !== JSON.stringify({ base: "8", soltas: lig.soltas, iguais: true, hint: true, segue: true, seta: true, desfaz: true, solto: true, naoSegue: true, volta: true, lista: true }))
  erros.push("Quadro: posição inicial ligada não funcionou " + JSON.stringify(lig));
// v108.1: trocar o jogador de uma bolinha no slide inicial faz a mesma troca nos lances que o seguem
const tj = await pg.evaluate(() => { const L = lances().find((l) => l.id === "8"), i = L.bolas.findIndex((b) => !eAlternativa(b)), atual = calcula(L).v[L.bolas[i].slot];
  const novo = est.plantel.map((p) => p.n).find((n) => n && n !== atual && !Object.values(vDoLance(L)).includes(n));
  const antesF = Object.entries(vDoLance(lances().find((l) => l.id === "10"))).filter(([, x]) => x === atual).map(([s]) => s); folhaBola(L, i); return { atual, novo, antesF }; });
await pg.selectOption("#s-jog", tj.novo); await pg.waitForTimeout(150);
const tj2 = await pg.evaluate((tj) => { const F = lances().find((l) => l.id === "10"), v = vDoLance(F); return { base: calcula(lances().find((l) => l.id === "8")).v, f: tj.antesF.every((s) => v[s] === tj.novo), semAtual: !Object.values(v).includes(tj.atual) }; }, tj);
if (!tj.antesF.length || !tj2.f || !tj2.semAtual) erros.push("Quadro: a troca de jogador no slide inicial não passou para o lance ligado " + JSON.stringify({ tj, tj2 }));
await pg.evaluate(() => { desfazQuadro(); });
const tj3 = await pg.evaluate((tj) => tj.antesF.every((s) => vDoLance(lances().find((l) => l.id === "10"))[s] === tj.atual), tj);
if (!tj3) erros.push("Quadro: desfazer a troca de jogador no slide inicial não repôs o lance ligado");
await pg.evaluate(() => { editing = false; curId = lances()[0].id; render(); });
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
// editor (v99): tamanho por peça, texto só de uma bolinha, duplicar e apagar no botão direito
const edt = await pg.evaluate(() => { mEdit = true; renderModelo(); const Q = qAtual(), pc = Q.pecas.find((p) => p.eq === "nos" && p.slot), n0 = Q.pecas.length;
  editaQ((X) => { const p = X.pecas.find((x) => x.id === pc.id); p.tam = 1.5; p.lab = "pos"; });
  const Q2 = qAtual(), p2 = Q2.pecas.find((x) => x.id === pc.id), alvo = document.querySelector(`#m-stage svg [data-p='${pc.id}']`);
  alvo.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 300, clientY: 300 }));
  const menu = document.querySelector(".mmenu") ? document.querySelector(".mmenu").textContent : ""; const dup = [...document.querySelectorAll(".mmenu button")].find((b) => b.textContent.includes("Duplicar")); if (dup) dup.click();
  const Q3 = qAtual(), novo = Q3.pecas.find((x) => !Q2.pecas.some((y) => y.id === x.id));
  const r = { tam: p2.tam, lab: rotulo(Q2, p2, numerosQ(Q2)) === p2.pos && Q2.rot === "num", menu: menu.includes("Duplicar") && menu.includes("Apagar") && menu.includes("Aumentar"), n: Q3.pecas.length - n0, semSlot: novo && !novo.slot, perto: novo && Math.abs(Q3.passos[0].pos[novo.id].x - Q3.passos[0].pos[pc.id].x - 2) < .01 };
  editaQ((X) => { X.pecas = X.pecas.filter((x) => !novo || x.id !== novo.id); const p = X.pecas.find((x) => x.id === pc.id); delete p.tam; delete p.lab; }); mEdit = false; renderModelo(); return r; });
if (edt.tam !== 1.5 || !edt.lab || !edt.menu || edt.n !== 1 || !edt.semSlot || !edt.perto) erros.push("Editor: tamanho, texto da bolinha ou duplicar errados " + JSON.stringify(edt));
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

// objetivos (v99): gerais + específicos; os específicos não saem no PDF da UT
const ob = await pg.evaluate(async () => { const E = normEx({ id: "tOb", nome: "Teste objetivos", objetivos: "Geral do teste", objEsp: ["Específico um", "Específico dois"], duracao: { pratica: 60 } });
  const html = fichaHtml(E, 1), U = normUT({ id: "tob", numero: 88, data: "2026-10-20", exercicios: [{ id: "l1", exId: "tOb", copia: E }] }), ut = (await pdfUT(U)).output();
  return { esp: E.objEsp.length, html: html.includes("Específico dois") && html.includes("Objetivos específicos"), ut: ut.includes("Geral do teste") && !ut.includes("Espec") }; });
if (ob.esp !== 2 || !ob.html || !ob.ut) erros.push("Objetivos: gerais/específicos errados " + JSON.stringify(ob));
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
await pg.click("#u-gn"); await pg.fill("#ug-n", "Guarda-redes"); await pg.click("#ug-j button[data-k='1']"); await pg.click("#ug-j button:has-text('Santiago')"); await pg.click("#ug-ok"); await pg.waitForTimeout(150);
const pg2 = await pg.evaluate(() => { const U = uts[uCur]; return { pres: Object.values(U.presencas).sort(), ext: U.extras.map((e) => e.nome + "/" + e.escalao + "/" + e.pos), g: U.grupos.length, gj: U.grupos[0] && U.grupos[0].jogadores.length,
  campo: [...document.querySelectorAll(".ucampo text")].some((t) => t.textContent.includes("Santiago C.")), botao: [...document.querySelectorAll(".upres button")].some((b) => b.textContent.includes("Santiago")) }; });
if (JSON.stringify(pg2.pres) !== '["CO","P","P"]' || JSON.stringify(pg2.ext) !== '["Santiago C./Sub19/2"]' || pg2.g !== 1 || pg2.gj !== 2 || !pg2.campo || !pg2.botao) erros.push("UT: presenças, jogadores de fora ou grupos errados " + JSON.stringify(pg2));
// ausente: sai do grupo e passa para os Indisponíveis do campo do plantel; a folha do grupo só mostra quem está presente
const k0 = await pg.evaluate(() => uts[uCur].grupos[0].jogadores[0]);
await pg.click(`.upres button[data-k='${k0}']`, { button: "right" }); await pg.click(".mmenu button:has-text('Ausente')"); await pg.waitForTimeout(150);
const aus = await pg.evaluate((k) => { const U = uts[uCur], txt = [...document.querySelectorAll(".ucampo text")].map((t) => t.textContent).join(" | "); return { noGrupo: U.grupos[0].jogadores.includes(k), indisp: txt.includes("INDISPONÍVEIS") && txt.includes("· Ausente"), naGrelha: (() => { folhaGrupoUT(U.id, null); const r = [...document.querySelectorAll("#ug-j button")].some((b) => b.dataset.k === k); document.querySelector("#sheet-root [data-close]").click(); return r; })() }; }, k0);
if (aus.noGrupo || !aus.indisp || aus.naGrelha) erros.push("UT: ausente devia sair do grupo e ir para os Indisponíveis " + JSON.stringify(aus));
// num grupo novo, quem já está noutro grupo aparece no fim, a dizer em que grupo está (e continua escolhível)
const ord = await pg.evaluate(() => { const U = uts[uCur]; folhaGrupoUT(U.id, null); const bs = [...document.querySelectorAll("#ug-j button")], ja = U.grupos[0].jogadores;
  const livres = bs.filter((b) => !ja.includes(b.dataset.k)).map((b) => { const a = atletasUT(U).find((x) => x.k === b.dataset.k); const i = POS_UT.findIndex((p) => p[0] === (a && a.pos)); return i < 0 ? 99 : i; });
  const r = { porPos: livres.every((v, i) => !i || livres[i - 1] <= v), ultimo: bs[bs.length - 1] && ja.includes(bs[bs.length - 1].dataset.k), aviso: bs[bs.length - 1] && bs[bs.length - 1].querySelector("small").textContent, primeiro: bs[0] && ja.includes(bs[0].dataset.k), escolhivel: bs.every((b) => !b.disabled), ja, grupos: U.grupos.map((g) => g.nome + ":" + g.jogadores.join(",")), lista: bs.map((b) => b.dataset.k + "/" + b.querySelector("small").textContent) };
  document.querySelector("#sheet-root [data-close]").click(); return r; });
if (!ord.porPos || !ord.ultimo || !String(ord.aviso).includes("já no grupo «Guarda-redes»") || ord.primeiro || !ord.escolhivel) erros.push("UT: quem já está num grupo devia aparecer no fim e assinalado " + JSON.stringify(ord));
await pg.click(`.upres button[data-k='${k0}']`, { button: "right" }); await pg.click(".mmenu button:has-text('Presente')"); await pg.waitForTimeout(100);
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
// grupos (v109): todos os presentes à vista sem rolar a folha; estrutura opcional por grupo (sistema, arrastar e trocar, gravada) no ecrã e no PDF
await pg.evaluate(() => { const pres = {}; est.plantel.filter((p) => p.n).forEach((p) => { pres[p.n] = "P"; });
  uts.ugt = normUT({ id: "ugt", numero: 96, data: "2026-10-30", presencas: pres, extras: Array.from({ length: 6 }, (_, i) => ({ id: "x" + i, nome: "Extra Teste" + i, escalao: "Sub17", pos: "" })) });
  Object.keys(uts.ugt.extras).forEach((i) => { uts.ugt.presencas["e:x" + i] = "P"; }); uCur = "ugt"; renderUT(); folhaGrupoUT("ugt", null); });
const gv = await pg.evaluate(() => { const sh = document.querySelector(".sheet").getBoundingClientRect(), bs = [...document.querySelectorAll("#ug-j button")];
  return { n: bs.length, pres: atletasUT(uts.ugt).filter((a) => presenteUT(uts.ugt, a.k)).length, vis: bs.filter((b) => b.getBoundingClientRect().bottom <= sh.bottom).length }; });
if (gv.n !== gv.pres || gv.vis !== gv.n) erros.push("Grupos: nem todos os presentes aparecem à vista na folha " + JSON.stringify(gv));
await pg.fill("#ug-n", "Vermelhos"); for (const k of await pg.$$eval("#ug-j button", (bs) => bs.slice(0, 8).map((b) => b.dataset.k))) await pg.click(`#ug-j button[data-k="${k}"]`);
const sisB = await pg.$$eval("#ug-s button", (bs) => bs.map((b) => b.textContent)); await pg.click("#ug-s button:nth-child(2)"); await pg.waitForTimeout(100);
await pg.evaluate(() => document.querySelector(".ug-campo").scrollIntoView({ block: "start" })); await pg.waitForTimeout(100);
const bol = await pg.$$eval(".ug-campo g[data-k]", (gs) => gs.map((g) => { const r = g.querySelector("circle").getBoundingClientRect(); return { k: g.dataset.k, x: r.x + r.width / 2, y: r.y + r.height / 2, cx: g.querySelector("circle").getAttribute("cx") }; }));
if (bol.length > 2) { await pg.mouse.move(bol[1].x, bol[1].y); await pg.mouse.down(); await pg.mouse.move(bol[2].x, bol[2].y, { steps: 6 }); await pg.mouse.up(); await pg.waitForTimeout(100); }
const cxDe = (k) => pg.evaluate((k) => document.querySelector(`.ug-campo g[data-k="${k}"] circle`)?.getAttribute("cx"), k);
const troca = bol.length > 2 && (await cxDe(bol[1].k)) === bol[2].cx && (await cxDe(bol[2].k)) === bol[1].cx;
await pg.click("#ug-ok"); await pg.waitForTimeout(200);
const ge = await pg.evaluate(async () => { const U = uts.ugt, g = U.grupos[0], N = normUT({ ...clone(U), grupos: [...clone(U.grupos), { id: "z", nome: "Lixo", jogadores: ["1"], estr: { sis: "", pos: { 1: ["a", 2] } } }] });
  const sem = clone(U); sem.grupos.forEach((x) => delete x.estr); const n0 = (await pdfUT(sem)).output().length, n1 = (await pdfUT(U)).output().length;
  return { sis: g.estr && g.estr.sis, nPos: g.estr && Object.keys(g.estr.pos).length, nJ: g.jogadores.length, mini: !!document.querySelector(".ug-mini svg"), norm: !!N.grupos[0].estr && !N.grupos[1].estr, pdf: n1 > n0 }; });
if (!sisB.some((t) => /^GR \+ \d/.test(t) || /^\d-\d/.test(t)) || ge.sis !== sisB[1].replace("GR + ", "") || ge.nPos !== ge.nJ || ge.nJ !== 8 || bol.length !== 8 || !troca || !ge.mini || !ge.norm || !ge.pdf)
  erros.push("Grupos: estrutura do grupo falhou " + JSON.stringify({ sisB, ge, n: bol.length, troca }));
await pg.evaluate((a) => { delete uts.ugt; uCur = a; renderUT(); }, utA);
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

// Entrega A (v93): nome SCA Performance, ligações do exercício, complementares com rotação, grupos por exercício, estatística de tempos e alcunhas
const nomeApp = await pg.evaluate(() => ({ t: document.title, h: document.querySelector(".brand h1").textContent }));
if (nomeApp.t !== "SCA Performance" || nomeApp.h !== "SCA Performance") erros.push("Nome: a app devia chamar-se SCA Performance " + JSON.stringify(nomeApp));
// ligações: só http/https; ficam no repositório, nunca na UT nem no PDF da UT
await pg.click("#tab-x"); await pg.click("#x-ed"); await pg.waitForSelector("#xe-lka");
await pg.click("#xe-lka"); await pg.fill("#xe-lk .xe-lkr [data-f=t]", "Vídeo do exercício"); await pg.fill("#xe-lk .xe-lkr [data-f=url]", "ftp://mau.pt/x"); await pg.click("#xe-ok"); await pg.waitForTimeout(100);
const lkMau = await pg.evaluate(() => ({ aberta: !!document.querySelector("#xe-ok"), marcada: !!document.querySelector("#xe-lk input.bad"), n: exercicios[xCur].links.length }));
await pg.fill("#xe-lk .xe-lkr [data-f=url]", "https://youtu.be/sca123"); await pg.click("#xe-lka"); await pg.fill("#xe-lk .xe-lkr:nth-child(2) [data-f=url]", "https://www.exemplo.pt/artigo");
await pg.click("#xe-lk .xe-lkr:nth-child(2) [data-a=up]"); await pg.click("#xe-ok"); await pg.waitForTimeout(150);
const lk = await pg.evaluate(() => { const E = exercicios[xCur], a = [...document.querySelectorAll("#x-panel .xlinks a")]; return { n: E.links.length, t: E.links.map((x) => x.t), alvo: a.every((x) => x.target === "_blank" && x.rel.includes("noopener")), na: a.length }; });
if (!lkMau.aberta || !lkMau.marcada || lkMau.n || lk.n !== 2 || lk.t[0] !== "exemplo.pt" || lk.t[1] !== "Vídeo do exercício" || !lk.alvo || lk.na !== 2) erros.push("Exercício: ligações erradas " + JSON.stringify({ lkMau, lk }));
const utLk = await pg.evaluate(async () => { const id = xCur, U = normUT({ id: "utlk", numero: 91, data: "2026-10-22", exercicios: [{ id: "l1", exId: id, copia: clone(exercicios[id]) }] }), l = U.exercicios[0];
  const txt = (await pdfUT(U)).output(); return { copia: "links" in l.copia, aviso: mudouNoRepo(l), pdf: /youtu|exemplo\.pt/.test(txt) }; });
if (utLk.copia || utLk.aviso || utLk.pdf) erros.push("UT: as ligações não deviam ir para a UT nem para o PDF " + JSON.stringify(utLk));
// complementar: escolhido do repositório, corre em paralelo e não soma ao tempo da UT; rotação proposta (série × equipa)
await pg.click("#tab-u");
const utA0 = await pg.evaluate(() => { const ks = est.plantel.filter((p) => p.n && !p.esc).slice(0, 9).map((p) => p.n), pres = {}; ks.forEach((k) => pres[k] = "P"); pres[ks[8]] = "A";
  exercicios.tP = normEx({ id: "tP", nome: "Jogo reduzido 4 equipas", parte: "fundamental", duracao: { series: 4, pratica: 240, pausa: 60 } });
  exercicios.tC = normEx({ id: "tC", nome: "Finalização complementar", parte: "inicial", duracao: { total: 300 } });
  exercicios.tI = normEx({ id: "tI", nome: "Aquecimento com bola", parte: "inicial", duracao: { pratica: 600 } });
  const gr = [0, 1, 2, 3].map((i) => ({ id: "g" + i, nome: ["Vermelhos", "Azuis", "Amarelos", "Verdes"][i], jogadores: [ks[2 * i], ks[2 * i + 1]], nota: "" }));
  gr[3].jogadores = [ks[6]];  // ks[7] presente sem grupo
  const ant = uCur; uts.ta = normUT({ id: "ta", numero: 90, data: "2026-10-22", presencas: pres, grupos: gr, exercicios: [
    { id: "li", exId: "tI", copia: exercicios.tI, grupos: ["g0", "g1", "g2", "g3"] }, { id: "lp", exId: "tP", copia: exercicios.tP, grupos: ["g0", "g1", "g2", "g3"] },
    { id: "lf", exId: "tP", copia: { ...exercicios.tP, nome: "Sem grupos" } }] });
  uCur = "ta"; uModo = "ut"; renderUT(); return { ant, ks }; });
await pg.click("li[data-l='lp'] [data-a='cp']"); await pg.waitForSelector("#ua-l"); await pg.fill("#ua-q", "Finalização complementar"); await pg.check("#ua-l input[value='tC']"); await pg.click("#ua-ok"); await pg.waitForTimeout(150);
const cp = await pg.evaluate(() => { const U = uts.ta, c = U.exercicios.find((l) => l.pai === "lp"), P = U.exercicios.find((l) => l.id === "lp"), nums = numerosUT(U);
  return { ordem: U.exercicios.map((l) => nums[l.id]).join(","), pai: !!c, parte: c && c.copia.parte, tot: totalUT(U), rot: P.rot && [P.rot.nEq, P.rot.nJogo, P.rot.grelha.length].join("/"),
    eq: avisosRot(U, P, [c], nums).length, li: document.querySelector("li.utx-c .utx-n")?.textContent, mini: !!document.querySelector("li[data-l='lp'] table.urot.mini") }; });
if (cp.ordem !== "1,2,2.1,3" || !cp.pai || cp.parte !== "fundamental" || cp.tot !== 600 + 1140 + 1140 || cp.rot !== "4/2/4" || cp.eq || cp.li !== "2.1" || !cp.mini) erros.push("UT: complementar ou rotação proposta errados " + JSON.stringify(cp));
// ajuste manual da grelha com um toque → aviso de rotação desequilibrada (não bloqueia)
await pg.click("li[data-l='lp'] [data-a='gt']"); await pg.waitForSelector("#ut-gr");
await pg.click("#ut-gr button[data-s='0'][data-e='2']"); await pg.waitForTimeout(50);
const avR = await pg.evaluate(() => document.querySelector("#ut-av").textContent);
await pg.click("#ut-ok"); await pg.waitForTimeout(150);
const rotM = await pg.evaluate(() => ({ casa: uts.ta.exercicios.find((l) => l.id === "lp").rot.grelha[0][2], aviso: [...document.querySelectorAll("li[data-l='lp'] .uavisos li")].map((x) => x.textContent).join(" | ") }));
if (!avR.includes("desequilibrada") || rotM.casa !== "" || !rotM.aviso.includes("desequilibrada")) erros.push("UT: ajuste manual da rotação ou aviso errados " + JSON.stringify({ avR, rotM }));
await pg.screenshot({ path: join(cap, "treino-complementar.png"), fullPage: true });
await pg.evaluate(() => editaUT((U) => { const P = U.exercicios.find((l) => l.id === "lp"); P.rot.grelha = propoeRot(4, 2, 4, U.exercicios.filter((c) => c.pai === "lp").map((c) => c.id)); }));
// tempos: séries da equipa × prática (sem pausas); aquecimento não conta por defeito; ausentes fora; presentes sem grupo à parte; conta sem grupos = aviso
const tp = await pg.evaluate((ks) => { const T = temposUT(uts.ta), m = (k) => T.por[k] ? T.por[k].seg / 60 : 0;
  return { a: m(ks[0]), d: m(ks[6]), aus: ks[8] in T.por, sem: T.semGrupo.map((a) => a.k), av: T.avisos.map((x) => x.t).join(" | "), aq: (T.por[ks[0]] || { det: [] }).det.some((d) => d.lid === "li"), sg: !!document.querySelector("li[data-l='lf'] .uavisos") }; }, utA0.ks);
if (tp.a !== 16 || tp.d !== 16 || tp.aus || JSON.stringify(tp.sem) !== JSON.stringify([utA0.ks[7]]) || !tp.av.includes("não tem grupos") || tp.aq || !tp.sg) erros.push("Tempos: minutos por atleta errados " + JSON.stringify(tp));
// por UT: o aquecimento passa a contar só nesta UT
await pg.click("li[data-l='li'] [data-a='gt']"); await pg.waitForSelector("#ut-ct"); await pg.click("#ut-ct button[data-k='1']"); await pg.click("#ut-ok"); await pg.waitForTimeout(150);
const tp2 = await pg.evaluate((k) => ({ m: temposUT(uts.ta).por[k].seg / 60, rep: exercicios.tI.contaTempo }), utA0.ks[0]);
if (tp2.m !== 26 || tp2.rep !== null) erros.push("Tempos: contar o aquecimento só nesta UT falhou " + JSON.stringify(tp2));
// vista Tempos: tabela, detalhe, sem grupo à parte e CSV
await pg.click(".u-modo button[data-m='tempos']"); await pg.waitForSelector("table.ttab"); await pg.selectOption("#tp-ut", "ta"); await pg.waitForTimeout(100);
const vt = await pg.evaluate(() => ({ linhas: document.querySelectorAll("table.ttab tbody tr").length, pri: document.querySelector("table.ttab tbody tr td:nth-child(2)")?.textContent, sem: document.querySelector("#u-panel").textContent.includes("Presentes sem grupo") }));
await pg.screenshot({ path: join(cap, "treino-tempos.png"), fullPage: true });
await pg.click("table.ttab tbody tr >> nth=0"); await pg.waitForTimeout(100); await pg.screenshot({ path: join(cap, "treino-tempos-juntos.png") }); const det = await pg.evaluate(() => document.querySelector("#sheet-root").textContent); await pg.click("#sheet-root [data-close]");
// minutos em conjunto (na mesma equipa): ks0 e ks1 no mesmo grupo (aquecimento 10' + rotação 16'); ks0 e ks2 nunca na mesma equipa
const jt = await pg.evaluate((ks) => { const F = temposFiltro(), p = F.par["n:" + ks[0]] || {}; return { com1: p["n:" + ks[1]], com2: p["n:" + ks[2]], sim: (F.par["n:" + ks[1]] || {})["n:" + ks[0]] }; }, utA0.ks);
if (jt.com1 !== 1560 || jt.com2 || jt.sim !== 1560 || !det.includes("Minutos em conjunto")) erros.push("Tempos: minutos em conjunto errados " + JSON.stringify(jt));
const [dCsv] = await Promise.all([pg.waitForEvent("download", { timeout: 30000 }), pg.click("#tp-csv")]);
if (vt.linhas !== 8 || vt.pri !== "26'" || !vt.sem || !det.includes("2.1") || !dCsv.suggestedFilename().startsWith("Tempos_SCA_26-27_UT90")) erros.push("Tempos: vista ou CSV errados " + JSON.stringify({ vt, det: det.slice(0, 120), f: dCsv.suggestedFilename() }));
await pg.click(".u-modo button[data-m='ut']"); await pg.waitForTimeout(100);
// rotação sem complementar (equipas que descansam) e por períodos
await pg.click("li[data-l='lf'] [data-a='gt']"); await pg.waitForSelector("#ut-md"); await pg.click("#ut-gs [data-t]"); await pg.click("#ut-md [data-k='rodar']"); await pg.waitForTimeout(50);
const rs = await pg.evaluate(() => ({ ne: document.querySelector("#ut-ne").value, nj: document.querySelector("#ut-nj").value, casas: document.querySelectorAll("#ut-gr td button").length }));
await pg.click("#ut-ok"); await pg.waitForTimeout(150);
const rs2 = await pg.evaluate((ks) => { const l = uts.ta.exercicios.find((x) => x.id === "lf"), T = temposUT(uts.ta), d = (T.por[ks[0]] || { det: [] }).det.find((x) => x.lid === "lf");
  return { modo: l.rot && l.rot.modo, seg: d && d.seg, mini: !!document.querySelector("li[data-l='lf'] table.urot.mini"), per: JSON.stringify(propoeRot(4, 2, 4, [], "periodos")) }; }, utA0.ks);
if (rs.ne !== "4" || rs.nj !== "2" || rs.casas !== 16 || rs2.modo !== "rodar" || rs2.seg !== 480 || !rs2.mini || rs2.per !== JSON.stringify([["p","p","",""],["p","p","",""],["","","p","p"],["","","p","p"]])) erros.push("UT: rotação sem complementar errada " + JSON.stringify({ rs, rs2 }));
// PDF da UT com o complementar indentado e a grelha
{ const [dC] = await Promise.all([pg.waitForEvent("download", { timeout: 60000 }), pg.click("#u-pdf")]); await dC.saveAs(join(cap, "treino-ut-complementar.pdf")); }
const pdfC = await pg.evaluate(async () => { const t = (await pdfUT(uts.ta)).output(); return { c: t.includes("2.1") && t.includes("COMPLEMENTAR"), r: t.includes("ROTA") }; });
// equipas «vs.» num exercício com grupos e sem rotação (linha da UT e PDF); apoios no fim; nomes lidos do texto sem o cabeçalho
const eqT = await pg.evaluate(async () => { const U = normUT({ id: "teq", numero: 89, data: "2026-10-23", grupos: [{ id: "a", nome: "Exercício 6 · Vermelhos", jogadores: [] }, { id: "b", nome: "Brancos", jogadores: [] }, { id: "c", nome: "Apoios", jogadores: [] }, { id: "d", nome: "Equipa Amarela (9) · Grupo 5", jogadores: [] }],
  exercicios: [{ id: "x1", exId: "tP", copia: exercicios.tP, grupos: ["a", "b", "c"] }] }), t = (await pdfUT(U)).output();
  return { dois: equipasTxt(U, U.exercicios[0]), tres: equipasTxt(U, { grupos: ["a", "d", "b"] }), pdf: t.includes("EQUIPAS") && t.includes(" vs. Equipa 2 ") }; });
if (eqT.dois !== "Equipa 1 (Vermelhos) vs. Equipa 2 (Brancos) + Apoios" || eqT.tres !== "Equipa 1 (Vermelhos) · Equipa Amarela (9) · Equipa 3 (Brancos)" || !eqT.pdf) erros.push("UT: equipas do exercício erradas " + JSON.stringify(eqT));
if (!pdfC.c || !pdfC.r) erros.push("UT: PDF sem o complementar ou sem a grelha da rotação " + JSON.stringify(pdfC));
// alcunhas nos grupos (sem números); sem alcunha, primeiro e último nome; alcunhas repetidas avisam no Plantel
const alc = await pg.evaluate((ks) => { const pl0 = clone(est.plantel), i0 = est.plantel.findIndex((p) => p.n === ks[0]), i1 = est.plantel.findIndex((p) => p.n === ks[1]);
  const pl = clone(est.plantel); pl[i0] = { ...pl[i0], alc: "Mika, Miki" }; pl[i1] = { ...pl[i1], nome: "João Pedro Santos Silva", alc: "" }; guardaEst({ ...est, plantel: pl }, true); renderUT();
  const txt = document.querySelector("#u-panel .evl").textContent, r = { a: nomeAtleta(uts.ta, ks[0]), aPdf: nomeAtleta(uts.ta, ks[0], true), b: nomeAtleta(uts.ta, ks[1]), num: txt.includes(ks[0] + " · "), txt: txt.slice(0, 80), semAlc: !txt.includes("Mika") };
  const pl2 = clone(est.plantel); pl2[i1] = { ...pl2[i1], alc: "mika" }; guardaEst({ ...est, plantel: pl2 }, true); setTab("p"); renderPlantel(); r.aviso = !$("p-alc").hidden && $("p-alc").textContent.includes("Mika");
  guardaEst({ ...est, plantel: pl0 }, true); setTab("u"); return r; }, utA0.ks);
// v99: na app primeiro e último nome; a alcunha só nos grupos do PDF da UT
if (alc.a === "Mika" || alc.aPdf !== "Mika" || alc.b !== "João Silva" || alc.num || !alc.semAlc || !alc.aviso) erros.push("Nomes: app com nome, PDF dos grupos com alcunha, aviso de repetidas " + JSON.stringify(alc));
// Entrega B (v95/v98): marcação no repositório → ativa na UT com selo; Liga por voltas e Champions (quem ganha fica); golos com marcador e auto-golo; GR; fim do jogo; anular com 2 toques; meinho e rankings
const pl0B = await pg.evaluate((ks) => { const pl0 = clone(est.plantel), pl = clone(est.plantel); pl.forEach((p) => { if (ks.includes(p.n)) p.pos = p.n === ks[1] ? "1" : "2"; }); guardaEst({ ...est, plantel: pl }, true); return pl0; }, utA0.ks);
await pg.evaluate(() => { exercicios.tL = normEx({ id: "tL", nome: "Liga 3 equipas teste", parte: "fundamental", duracao: { series: 4, pratica: 180, pausa: 60 } }); folhaEx("tL"); });
await pg.click("#xe-cp [data-k='liga']"); await pg.click("#xe-mh [data-k='1']"); await pg.click("#xe-ok"); await pg.waitForTimeout(100);
await pg.click("#tab-u"); await pg.evaluate(() => { uModo = "ut"; uCur = "ta"; renderUT(); });
await pg.click("#u-add"); await pg.fill("#ua-q", "Liga 3 equipas teste"); await pg.check("#ua-l input[value='tL']"); await pg.click("#ua-ok"); await pg.waitForTimeout(150);
const lidL = await pg.evaluate(() => { const l = uts.ta.exercicios.find((x) => x.exId === "tL"); editaUT((U) => { const x = U.exercicios.find((y) => y.id === l.id); x.grupos = ["g0", "g1", "g2"]; }); return l.id; });
const selo = await pg.evaluate((lid) => ({ rep: exercicios.tL.comp + "/" + exercicios.tL.meinho, ut: compDe(uts.ta.exercicios.find((x) => x.id === lid)), tags: document.querySelector(`li[data-l='${lid}'] .utx-tags`).textContent }), lidL);
// Liga: 1 volta de todos contra todos com 3 equipas = 3 jogos, em cada um descansa uma equipa
await pg.click(`li[data-l='${lidL}'] [data-a='jg']`); await pg.waitForSelector("#cp-gera"); await pg.click("#cp-v [data-v='1']"); await pg.click("#cp-gera"); await pg.waitForTimeout(100);
const jgs = await pg.evaluate((lid) => ({ j: jogosDe("ta", lid).map((j) => `${j.serie}:${j.a}-${j.b}:${j.grB}`), desc: document.querySelector(".cp-atual .cp-cab").textContent }), lidL);
// jogo 1 (g1×g2): golo da A com marcador e auto-golo de um jogador da A que conta para a B; GR de outra equipa (o GR não está preso a uma equipa); fim
await pg.click(".cp-atual [data-g='a']"); await pg.click(`.cp-pick [data-k='${utA0.ks[2]}']`); await pg.waitForTimeout(50);
await pg.click(".cp-atual [data-g='b']"); await pg.click(".cp-pick [data-ag]"); await pg.click(`.cp-pick [data-k='${utA0.ks[2]}']`); await pg.waitForTimeout(50);
await pg.selectOption(".cp-atual select[data-f='grA']", utA0.ks[1]); await pg.selectOption(".cp-atual select[data-f='grB']", utA0.ks[4]); await pg.waitForTimeout(50);
await pg.click(".cp-atual [data-fim]"); await pg.waitForTimeout(50);
// jogo 2: sem GR, 0–0, fim; jogo 3: golo e tirar com 2 toques (fica por jogar)
await pg.evaluate(() => { document.querySelector(".cp-atual details").open = true; }); await pg.click(".cp-atual [data-semgr]"); await pg.click(".cp-atual [data-fim]"); await pg.waitForTimeout(50);
await pg.click(".cp-atual [data-g='a']"); await pg.click(`.cp-pick [data-k='${utA0.ks[0]}']`); await pg.waitForTimeout(50);
await pg.click(".cp-atual [data-xg]"); await pg.click(".cp-atual [data-xg]"); await pg.waitForTimeout(50);
await pg.screenshot({ path: join(cap, "treino-competicao-registo.png") }); await pg.click("#sheet-root [data-close]"); await pg.waitForTimeout(100);
const cs = await pg.evaluate((ks) => { cF = { ep: "26.27", me: "", mi: "", et: "" }; const F = utsFiltro(), S = compStats(F), p = (k) => S.P["n:" + k] || {}, g = (k) => S.GR["n:" + k];
  return { a2: [p(ks[2]).J, p(ks[2]).E, p(ks[2]).Pts, p(ks[2]).golos, p(ks[2]).AG, p(ks[2]).GM, p(ks[2]).GS].join(","), gr1: !!S.P["n:" + ks[1]], g1: g(ks[1]) && [g(ks[1]).J, g(ks[1]).E, g(ks[1]).Pts, g(ks[1]).GS].join(","),
    g4: g(ks[4]) && g(ks[4]).J, pend: S.pend.length, av: S.aviso.length, golos: Object.values(compGolos).length }; }, utA0.ks);
if (selo.rep !== "liga/true" || selo.ut !== "liga" || !selo.tags.includes("LIGA") || !selo.tags.includes("MEINHO") || jgs.j.length !== 3 || jgs.j[0] !== "1:g1-g2:" || jgs.j[1] !== `2:g2-g0:${utA0.ks[1]}` || !jgs.desc.includes("descansa") ||
  cs.a2 !== "1,1,1,1,1,1,1" || cs.gr1 || cs.g1 !== "1,1,1,1" || cs.g4 !== 1 || cs.pend !== 1 || cs.av || cs.golos !== 2) erros.push("Competição (Liga): jogos, golos, GR ou classificação errados " + JSON.stringify({ selo, jgs, cs }));
// Champions: quem ganha fica; quem perde vai para o fim da fila; empate = sai quem estava na mesa
const ch = await pg.evaluate(() => { const novoJ = (o) => gravaJogoInt({ id: uId("cj"), ut: "tmp", lid: "tmp", criadoEm: new Date().toISOString(), ...o }), golo = (j, eq) => gravaGolo({ id: uId("cg"), jogo: j.id, eq, k: "x", em: new Date().toISOString() });
  const gs = ["A", "B", "C"], r = [JSON.stringify(proxChampions(gs, []))];
  const j1 = novoJ({ serie: 1, a: "A", b: "B", fim: true }); golo(j1, "a"); golo(j1, "a"); golo(j1, "b"); r.push(JSON.stringify(proxChampions(gs, jogosDe("tmp", "tmp"))));
  novoJ({ serie: 2, a: "A", b: "C", fim: true }); r.push(JSON.stringify(proxChampions(gs, jogosDe("tmp", "tmp"))));
  jogosDe("tmp", "tmp").forEach((j) => tiraJogoInt(j.id)); return r; });
if (ch[0] !== JSON.stringify({ a: "A", b: "B", fila: ["C"] }) || ch[1] !== JSON.stringify({ a: "A", b: "C", fila: ["B"] }) || ch[2] !== JSON.stringify({ a: "C", b: "B", fila: ["A"] })) erros.push("Competição (Champions): fila errada " + JSON.stringify(ch));
// anular nesta UT com registos: 2 toques; os registos ficam e deixam de contar; reativar volta a contar
await pg.click(`li[data-l='${lidL}'] [data-a='aj']`); await pg.click("#uj-c [data-k='-']"); await pg.click("#uj-ok"); await pg.waitForTimeout(50);
const arm = await pg.evaluate(() => ({ aberta: !!document.querySelector("#uj-ok"), txt: document.querySelector("#uj-ok").textContent, av: document.querySelector("#uj-av").textContent }));
await pg.click("#uj-ok"); await pg.waitForTimeout(100);
const anul = await pg.evaluate((lid) => ({ et: compDe(uts.ta.exercicios.find((x) => x.id === lid)), jogos: jogosDe("ta", lid).length, n: Object.keys(compStats(utsFiltro()).P).length }), lidL);
await pg.evaluate((lid) => editaUT((U) => { delete U.exercicios.find((x) => x.id === lid).comp; }), lidL);
const reat = await pg.evaluate(() => Object.keys(compStats(utsFiltro()).P).length);
if (!arm.aberta || !arm.txt.includes("outra vez") || !arm.av.includes("deixam de contar") || anul.et !== "" || anul.jogos !== 3 || anul.n || !reat) erros.push("Competição: anular com registos errado " + JSON.stringify({ arm, anul, reat }));
// meinho: 21 passes com 2 atletas, cueca com 1; desfazer o último com 2 toques; rei partilhado
await pg.click(`li[data-l='${lidL}'] [data-a='mh']`); await pg.waitForSelector(".mh-g");
await pg.click(`.mh-g [data-k='${utA0.ks[3]}']`); await pg.click(`.mh-g [data-k='${utA0.ks[4]}']`); await pg.click("#mh-ok"); await pg.waitForTimeout(50);
await pg.click("#mh-t [data-k='cueca']"); await pg.click(`.mh-g [data-k='${utA0.ks[5]}']`); await pg.click("#mh-ok"); await pg.waitForTimeout(50);
await pg.click(`.mh-g [data-k='${utA0.ks[6]}']`); await pg.click("#mh-ok"); await pg.waitForTimeout(50);
await pg.click("#mh-un"); await pg.click("#mh-un"); await pg.waitForTimeout(50); const un1 = await pg.evaluate(() => Object.keys(meinhoRegs).length);
await pg.screenshot({ path: join(cap, "treino-meinho.png") }); await pg.click("#sheet-root [data-close]"); await pg.waitForTimeout(100);
await pg.click(".u-modo button[data-m='rank']"); await pg.waitForSelector(".rk-rei");
const rk = await pg.evaluate((ks) => { const R = meinhoStats(utsFiltro()); return { regs: Object.keys(meinhoRegs).length, m: [R["21"]["n:" + ks[3]].tot, R["21"]["n:" + ks[4]].tot, R.cueca["n:" + ks[5]].tot].join(","),
  reis: [...document.querySelectorAll(".rk-rei")].map((x) => x.textContent) }; }, utA0.ks);
await pg.screenshot({ path: join(cap, "treino-rankings.png"), fullPage: true });
const [dRk] = await Promise.all([pg.waitForEvent("download", { timeout: 30000 }), pg.click("#rk-csv")]);
await pg.click(".u-modo button[data-m='comp']"); await pg.waitForSelector("table.cptab"); await pg.screenshot({ path: join(cap, "treino-competicao.png"), fullPage: true });
const [dCp] = await Promise.all([pg.waitForEvent("download", { timeout: 30000 }), pg.click("#cp-csv")]);
const vc = await pg.evaluate(() => ({ linhas: document.querySelectorAll("table.cptab tbody tr").length, pend: document.querySelector("#u-panel").textContent.includes("sem resultado") }));
await pg.click(".u-modo button[data-m='ut']"); await pg.waitForTimeout(100);
const pdfB = await pg.evaluate(async () => { const t = (await pdfUT(uts.ta)).output(); return t.includes("LIGA") && t.includes("MEINHO"); });
if (un1 !== 2 || rk.regs !== 2 || rk.m !== "1,1,1" || !rk.reis[0].includes("partilham") || !rk.reis[1] || !dRk.suggestedFilename().startsWith("Meinho_SCA_26-27") || !dCp.suggestedFilename().startsWith("Competicao_SCA_26-27") || !vc.linhas || !vc.pend || !pdfB)
  erros.push("Meinho / Rankings / Competição: errado " + JSON.stringify({ un1, rk, vc, pdfB, f: [dRk.suggestedFilename(), dCp.suggestedFilename()] }));
// histórico do Excel: soma à classificação, aos GR e aos rankings pela data (sem jogos nem equipas)
const hs = await pg.evaluate((ks) => { histTreino.h1 = normHist({ id: "h1", tipo: "comp", ut: 13, data: "2026-09-11", linhas: [{ k: "n:" + ks[3], nome: "X", J: 4, V: 3, E: 1, D: 0, golos: 2 }, { k: "n:" + ks[1], nome: "Y", gr: true, J: 4, GS: 5 }, { k: "x:fulano de tal", nome: "Fulano de Tal", J: 2, V: 0, E: 0, D: 2 }] });
  histTreino.h2 = normHist({ id: "h2", tipo: "meinho", ut: 13, data: "2026-09-11", linhas: [{ k: "n:" + ks[3], nome: "X", m21: 5, cuecas: 0, presente: true }] });
  const F = utsFiltro(), S = compStats(F), M = meinhoStats(F), p = S.P["n:" + ks[3]], g = S.GR["n:" + ks[1]];
  const r = { pts: p && p.Pts, golos: p && p.golos, gr: g && [g.J, g.GS].join(","), fulano: S.P["x:fulano de tal"] && S.P["x:fulano de tal"].nome, m: M["21"]["n:" + ks[3]].tot, det: p && p.jogos.some((j) => j.hist) };
  delete histTreino.h1; delete histTreino.h2; return r; }, utA0.ks);
if (hs.pts < 10 || hs.golos < 2 || hs.gr !== "5,6" || hs.fulano !== "Fulano Tal" || hs.m < 5 || !hs.det) erros.push("Histórico do Excel: não entrou nas tabelas " + JSON.stringify(hs));
// fotos (v100): carregar e enquadrar no Plantel; aparecem nos Rankings; PDF da tabela completa e cartaz do balneário
const kF = utA0.ks[3], iFt = await pg.evaluate((k) => est.plantel.findIndex((p) => p.n === k), kF);
await pg.click("#tab-p"); await pg.waitForTimeout(150);
await pg.click(`#ptb tr:has(#pn-${iFt}) .fbtn`); await pg.waitForSelector("#ft-esc:not([disabled])");
await pg.setInputFiles("#ft-f", join(raiz, "assets/rankings/rei-das-cuecas-720.jpg")); await pg.waitForSelector("#ft-ok:not([hidden])");
await pg.screenshot({ path: join(cap, "foto-enquadrar.png") });
await pg.click("#ft-ok"); await pg.waitForTimeout(300);
const ft = await pg.evaluate((k) => ({ f: fotos[k] && [fotos[k].img.w, fotos[k].img.h].join("x"), up: window.__up.slice(-1)[0], img: !!document.querySelector("#ptb .fbtn .fav img") }), kF);
await pg.screenshot({ path: join(cap, "plantel-fotos.png") });
await pg.click("#tab-u"); await pg.click(".u-modo button[data-m='rank']"); await pg.waitForSelector(".rk-rei");
const ftR = await pg.evaluate(() => document.querySelectorAll("#u-corpo .fav img").length);
const [dPdf] = await Promise.all([pg.waitForEvent("download", { timeout: 60000 }), pg.click("#rk-pdf")]);
await dPdf.saveAs(join(cap, "rankings.pdf"));
await pg.click("#rk-cz"); await pg.waitForSelector("#cz-p img", { timeout: 60000 }); await pg.screenshot({ path: join(cap, "cartaz-folha.png") });
const [dCz] = await Promise.all([pg.waitForEvent("download", { timeout: 60000 }), pg.click("#cz-pdf")]);
await pg.click("#sheet-root [data-close]"); await pg.waitForTimeout(100);
const cz = await pg.evaluate(async (k) => { const cv = await cartazCanvas(utsFiltro()), L = rankListas(utsFiltro()), fc = await fotoCirculo(k, 100);
  return { w: cv.width, h: cv.height, url: cv.toDataURL("image/jpeg", 0.85), reis: L.meinho.reis.length, fc: !!fc }; }, kF);
writeFileSync(join(cap, "cartaz.jpg"), Buffer.from(cz.url.split(",")[1], "base64"));
if (ft.f !== "600x600" || !ft.up || ft.up.type !== "image/jpeg" || !ft.img || !ftR || !dPdf.suggestedFilename().startsWith("Rankings_SCA_") || !dCz.suggestedFilename().startsWith("Cartaz_SCA_") || cz.w !== 2480 || cz.h !== 3508 || cz.reis !== 2 || !cz.fc)
  erros.push("Fotos / PDF / cartaz: errado " + JSON.stringify({ ft, ftR, cz: { ...cz, url: undefined }, f: [dPdf.suggestedFilename(), dCz.suggestedFilename()] }));
await pg.evaluate((k) => { delete fotos[k]; guardaFotosLocal(); }, kF);
await pg.evaluate((pl0) => { Object.keys(compJogos).forEach((id) => tiraJogoInt(id)); Object.keys(meinhoRegs).forEach((id) => tiraMeinho(id)); delete exercicios.tL; guardaEst({ ...est, plantel: pl0 }, true); }, pl0B);
await pg.evaluate((a) => { ["ta", "utlk"].forEach((id) => delete uts[id]); ["tP", "tC", "tI"].forEach((id) => delete exercicios[id]); uCur = a; renderUT(); }, utA0.ant);

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
// relatório para jogadores (v104): lances escolhidos, mensagens, coletivo sem dados individuais, individual sem colegas, ZIP com Grupo e Individuais
await pg.click("#a-jpdf"); await pg.waitForSelector("#rj-m");
await pg.fill("#rj-m", "• Pressão alta\n• Ataque à profundidade");
await pg.click("#rj-g [data-k='per']"); await pg.waitForSelector("#rj-l [data-r]"); await pg.locator("#rj-l [data-r]").first().click(); await pg.waitForTimeout(50);
await pg.click("#rj-g [data-k='golo']"); await pg.waitForTimeout(50); if (await pg.locator("#rj-l [data-r]").count()) await pg.locator("#rj-l [data-r]").first().click();
await pg.fill("#rj-i textarea[data-k='9']", "Boa pressão. Atenção às receções."); await pg.screenshot({ path: join(cap, "relatorio-jogadores-folha.png") });
await pg.click("#rj-ok"); await pg.waitForTimeout(100);
const rj = await pg.evaluate(async () => { const G = hist.Jtestearq, R = relJogDe(G), outrosNomes = (G.onze || []).filter((o) => o.n !== "9" && o.nome).map((o) => o.nome);
  G.video = { url: "https://www.youtube.com/watch?v=abcdefghijk", k1: 30, k2: 3000, antes: 10 };
  const g = await pdfRelJog(G, null, R), i = await pdfRelJog(G, "9", R), gt = g.output(), it = i.output();
  const eg = await ecrasRelJog(G, null, R), ei = await ecrasRelJog(G, "9", R), ls = lancesRel(G, R), li = lancesRel(G, R, "9");
  const zip = zipFicheiros([{ nome: "Grupo/a.pdf", dados: new Uint8Array([1, 2, 3]) }, { nome: "Individuais/b.jpg", dados: new Uint8Array([4]) }]), zb = new Uint8Array(await zip.arrayBuffer());
  const zs = new TextDecoder().decode(zb);
  return { msg: R.msg, ind: R.msgInd["9"], lances: R.lances.length, gMsg: gt.includes("Pressão alta"), gInd: gt.includes("Atenção às receções"), iInd: it.includes("Atenção às receções"),
    iOutros: outrosNomes.some((n) => it.includes(n)), iNotas: it.includes("Notas") || gt.includes("Notas do jogo"), url: ls[0] && ls[0].url, li: li.every((l) => String(l.j) === "9"),
    eg: eg.map((c) => c.width + "x" + c.height).join(","), ei: ei.length, zip: zb[0] === 0x50 && zb[1] === 0x4b && zs.includes("Grupo/a.pdf") && zs.includes("Individuais/b.jpg"),
    nome: nomeFichRel(G, alcunhaRel(G, "9")) }; });
await pg.click("#a-jpdf"); await pg.waitForSelector("#rj-pv"); await pg.click("#rj-pv"); await pg.waitForSelector("#rp-v img", { timeout: 60000 });
await pg.screenshot({ path: join(cap, "relatorio-jogadores-preview.png") });
const [dZip] = await Promise.all([pg.waitForEvent("download", { timeout: 120000 }), (async () => { await pg.click("#rp-ok"); await pg.click("#rp-ok"); })()]);
await pg.waitForTimeout(300);
const rjx = await pg.evaluate(() => { const R = relJogDe(hist.Jtestearq); return R.exportado.map((x) => x.versao + ":" + (x.n > 2)).join(","); });
if (rj.msg !== "• Pressão alta\n• Ataque à profundidade" || rj.ind !== "Boa pressão. Atenção às receções." || rj.lances < 1 || !rj.gMsg || rj.gInd || !rj.iInd || rj.iOutros || rj.iNotas || !/youtube\.com\/watch\?v=abcdefghijk&t=\d+s/.test(rj.url || "") || !rj.li
  || !rj.eg.startsWith("1080x1920") || rj.ei < 1 || !rj.zip || !/_jogo|Arquivado_FC/.test(rj.nome) || !dZip.suggestedFilename().endsWith("_relatorio_jogadores.zip") || rjx !== "1:true")
  erros.push("Relatório para jogadores: errado " + JSON.stringify({ rj, rjx, z: dZip.suggestedFilename() }));
await pg.selectOption("#r-jogo", ""); await pg.waitForTimeout(100);
const va = await pg.evaluate(() => ({ info: !$("r-arqinfo").hidden, limpar: $("a-limpar").hidden, jog: $("r-jog").textContent }));
if (va.info || va.limpar || !va.jog.includes("Ainda sem registos")) erros.push("Arquivo: voltar ao jogo atual no Relatório falhou " + JSON.stringify(va));
await pg.evaluate(() => { delete hist.Jtestearq; relArq = ""; anVista = "reg"; renderAnalise(); });

// Planeamento anual: marcar UT e folga num dia, microciclo e mesociclo; a semana nova segue o anual (nº da UT, folga, nº do microciclo)
// livro de exercícios (v103): filtros + seleção à mão, guardar, versão para fora sem nomes nem ligações internas, índice com as páginas certas e QR legível
await pg.click("#tab-x"); await pg.click("#x-livro"); await pg.waitForSelector("#lv-novo"); await pg.click("#lv-novo"); await pg.waitForSelector("#lv-f");
const lv0 = await pg.evaluate(() => { const ex = Object.values(exercicios); return { n: ex.length, partes: [...new Set(ex.map((E) => E.parte))] }; });
await pg.fill("#lv-n", "Livro teste"); await pg.fill("#lv-t", "Caderno de teste");
await pg.click(`#lv-f [data-d='parte'][data-v='${lv0.partes[0]}']`); await pg.waitForTimeout(50);
const lvSel = await pg.evaluate(() => document.querySelectorAll("#lv-l input:checked").length);
await pg.locator("#lv-l input:checked").first().click(); await pg.waitForTimeout(50);
await pg.screenshot({ path: join(cap, "livro-editor.png") });
await pg.click("#lv-v [data-k='fora']"); await pg.click("#lv-ok"); await pg.waitForTimeout(100);
const lv = await pg.evaluate(async () => { const L = Object.values(livros).find((x) => x.nome === "Livro teste"), exs = exDoLivro(L), E = exs[0];
  E.links = [{ t: "Público", url: "https://youtu.be/dQw4w9WgXcQ", pub: true }, { t: "Interno", url: "https://exemplo.pt/so-interno" }];
  const nomeP = est.plantel.find((p) => p.nome && p.nome.trim().split(/\s+/).length > 1); if (nomeP) E.descricao = "Apoio: " + nomeP.nome + ".";
  const { doc, n, caps } = await pdfLivro(L, null, { cancelado: false }), txt = doc.output();
  const pags = doc.getNumberOfPages(), esperado = caps.reduce((a, c) => a + 1 + c.exs.length, 0) + 1 + (caps[0].pag - 2);
  const ordem = caps.every((c) => c.exs.every((x, i) => x.pag === c.pag + 1 + i));
  const r = { L: [L.versao, L.menos.length, L.filtros.parte.length].join(","), n, sel: exs.length, pags, esperado, ordem, pub: txt.includes("youtu.be/dQw4w9WgXcQ"), interno: txt.includes("so-interno"), nome: nomeP ? txt.includes(nomeP.nome) : false };
  const Li = normLivro({ ...L, versao: "interna" }), ti = (await pdfLivro(Li, null, { cancelado: false })).doc.output(); r.internaTemInterno = ti.includes("so-interno");
  r.qr = JSON.stringify([{ texto: "https://youtu.be/dQw4w9WgXcQ", m: qrMatriz("https://youtu.be/dQw4w9WgXcQ").map((l) => l.map((c) => (c ? 1 : 0))) }, { texto: "Ação · ÇÃO · 2026/27", m: qrMatriz("Ação · ÇÃO · 2026/27").map((l) => l.map((c) => (c ? 1 : 0))) }]);
  r.av = avisosLivro(L).exs.length === exs.length; apagaLivro(L.id); return r; });
await pg.click("#sheet-root [data-close]").catch(() => {}); await pg.waitForTimeout(50);
writeFileSync(join(cap, "qr-teste.json"), lv.qr); const py = spawnSync("python", ["-I", "-X", "utf8", join(raiz, "tests/qr-verifica.py"), join(cap, "qr-teste.json")], { encoding: "utf8" });
if (lv.L !== "fora,1,1" || lv.sel !== lvSel - 1 || lv.n !== lv.sel || lv.pags !== lv.esperado || !lv.ordem || !lv.pub || lv.interno || lv.nome || !lv.internaTemInterno || !lv.av || (py.status !== 0 && !py.error))
  erros.push("Livro de exercícios: errado " + JSON.stringify({ ...lv, qr: undefined, lvSel, py: py.stdout + py.stderr }));
// resumo do microciclo (v101): MD só pelos jogos oficiais, blocos, atletas, volume sem complementares, textos por campo, fechar/reabrir e PDF
const SEGM = "2027-06-07";
const mc = await pg.evaluate(async (seg) => { const ks = est.plantel.filter((p) => p.n).slice(0, 4).map((p) => String(p.n)), E = Object.values(exercicios)[0];
  const cal = (id, data, adv, comp) => { calendario[id] = normJogoCal({ id, data, hora: "15:00", adversario: adv, casa: true, competicao: comp }); };
  cal("tmcA", "2027-06-13", "Oficial FC", "Campeonato dos Açores"); cal("tmcJ", "2027-06-10", "Treino FC", "Jogo particular"); cal("tmcB", "2027-06-16", "Taça FC", "Taça AFAH");
  const md = ["2027-06-09", "2027-06-10", "2027-06-14", "2027-06-15", "2027-06-16"].map(mdAuto).join(",");
  semanas[seg] = normSemana({ id: seg, numero: 77, dias: { "2027-06-07": { folga: true }, "2027-06-08": { tarde: [{ tipo: "treino", ini: "19:30", fim: "21:00", local: LOCAL_CASA, treino: 901 }] }, "2027-06-12": { manha: [{ tipo: "viagem", txt: "TER - PDL", ini: "9:00", fim: "10:00" }] } } });
  const lin = (id, pai) => ({ id, exId: E.id, copia: { ...clone(E), parte: "fundamental", duracao: { series: 1, pratica: 600, pausa: 0, total: null } }, ...(pai ? { pai } : {}) });
  uts.tmc1 = normUT({ id: "tmc1", numero: 901, data: "2027-06-08", presencas: { [ks[0]]: "P", [ks[1]]: "CO", [ks[2]]: "L", [ks[3]]: "A" }, exercicios: [lin("l1"), lin("l2", "l1")] });
  let W = semanaMicro(seg); const d2 = W.dias[1];
  const r = { md, blocos: W.dias.map((x) => x.bloco ? x.bloco.k : "").join(","), at: [W.gr + W.jg, W.l].join(","), min: d2.min, ut: d2.utTxt, hora: d2.hora, n: W.n };
  gravaCampoMc(seg, "2027-06-08.pf", "Texto escrito"); W = semanaMicro(seg); r.pf = W.dias[1].partes.pf.v + "|" + W.dias[1].partes.pf.man;
  gravaCampoMc(seg, "2027-06-08.pf", null); W = semanaMicro(seg); r.repor = W.dias[1].partes.pf.man;
  const txt = (await pdfMicro(seg)).output(); r.pdf = txt.includes("MICROCICLO DAS UNIDADES DE TREINO") && !txt.includes("TRIEINO") && txt.includes("FOLGA");
  // v105: cores casa / fora (o estágio liga-se ao jogo seguinte, em casa) e PDF do planeamento anual (grelha + calendário de jogos)
  r.cores = W.dias.map((x) => x.bloco && x.bloco.cor || "").join(","); calendario.tmcA.casa = false;
  r.fora = semanaMicro(seg).dias.map((x) => x.bloco && x.bloco.cor || "").slice(5).join(","); calendario.tmcA.casa = true;
  const aE = aEpoca; aEpoca = 2026; r.anual = (await pdfAnual()).getNumberOfPages(); aEpoca = aE;
  // v106: local completo, equipa sem prefixo e competição a partir do calendário
  r.loc = localJogo(normJogoCal({ local: "Estádio João Paulo II", localidade: "Angra do Heroísmo", ilha: "Terceira", casa: false, adversario: "SC Lusitânia" }));
  r.chave = [chaveEq("SC Barreiro"), chaveEq("C União Micaelense"), chaveEq("Barreiro"), chaveEq("GD São Roque")].join(",");
  r.compCal = [compDeCal(calendario.tmcA), compDeCal(calendario.tmcJ), compDeCal(calendario.tmcB)].join(",");
  r.cfa = ["2027-06-13", "2027-06-16"].map((d) => celulaAnual(d).cor + celulaAnual(d).letra).join(",");   // v105.2: no Ano o fundo é a prova (CFA azul escuro, Taça AFAH cinzento) e a letra casa (vermelho) / fora (azul claro)
  mcSeg = seg; uModo = "micro"; return r; }, SEGM);
await pg.click("#tab-u"); await pg.waitForSelector(".mc-tab");
const mcUi = { blocos: await pg.locator(".mc-tab .mc-bloco").count() };
await pg.click(`.mc-tab td[data-e='2027-06-08|pf']`); await pg.waitForSelector("#mt-v"); await pg.fill("#mt-v", "Jogo reduzido e finalização"); await pg.click("#mt-ok"); await pg.waitForTimeout(100);
mcUi.campo = await pg.evaluate((seg) => campoMc(seg, "2027-06-08.pf"), SEGM);
await pg.screenshot({ path: join(cap, "treino-microciclo.png"), fullPage: true });
await pg.click("#mc-fe"); await pg.click("#mc-fe"); await pg.waitForTimeout(100);
mcUi.fechado = await pg.evaluate((seg) => [microResumo[seg] && microResumo[seg].estado, document.querySelectorAll(".mc-tab [data-e]").length].join(","), SEGM);
await pg.click("#mc-re"); await pg.click("#mc-re"); await pg.waitForTimeout(100);
mcUi.reaberto = await pg.evaluate((seg) => [microResumo[seg].estado, microResumo[seg].hist.length].join(","), SEGM);
// IA (v102), simulada: rascunhos marcados IA, nunca por cima do texto escrito à mão, substituir, JSON inválido, aprovar, cancelar e sem IA
const ia = await pg.evaluate(async (seg) => { const RESP = { objetivo_ut: "OBJ IA", parte_inicial: "PI IA", parte_fundamental: "PF IA", parte_final: "PFIN IA", objetivos_principais: "OP IA", objetivos_secundarios: "OS IA", pontos_positivos: "• bom", pontos_a_melhorar: "• mau" };
  const pedidos = []; mcSample = { json: async (p, o) => { pedidos.push(p); return RESP; } };
  const v = (c) => { const x = microCampo[seg + "~" + c]; return x ? x.v + (x.ia ? "*" : "") : "-"; }, r = {};
  await geraMc(seg, { tipo: "semana" });
  r.semana = ["2027-06-08.obj", "2027-06-08.pi", "2027-06-08.pf", "2027-06-08.pfin", "2027-06-10.obj", "2027-06-10.pi", "objPrin", "objSec"].map(v).join("|");
  r.pedidos = pedidos.length; r.estilo = pedidos[0].includes("português de Portugal") && pedidos[0].includes("PRINCIPAL ESTÍMULO DA SEMANA");
  r.nIA = semanaMicro(seg).nIA;
  await geraMc(seg, { tipo: "campo", d: "2027-06-08", k: "pf", forcar: true }); r.subst = v("2027-06-08.pf");
  const antes = JSON.stringify(microCampo); mcSample = { json: async () => { throw { code: "invalid_json", text: "xx" }; } };
  await geraMc(seg, { tipo: "dia", d: "2027-06-08" }); r.invalido = JSON.stringify(microCampo) === antes && mcIA === null;
  Object.values(microCampo).filter((c) => c.seg === seg && c.ia).forEach((c) => aprovaCampoMc(seg, c.campo, true));
  const W = semanaMicro(seg); r.aprovado = [W.nIA, W.M && W.M.objPrin, v("objPrin"), v("2027-06-08.pi")].join("|");
  mcSample = null; await geraMc(seg, { tipo: "semana" }); r.semIA = JSON.stringify(microCampo).length > 0 && mcIA === null;
  return r; }, SEGM);
await pg.evaluate(() => { mcSample = { json: (p, o) => new Promise((res, rej) => o.signal.addEventListener("abort", () => rej({ code: "cancelled" }))) }; window.__ia = geraMc(mcSeg, { tipo: "dia", d: "2027-06-08" }); });
await pg.waitForSelector("#mc-ia-x"); await pg.screenshot({ path: join(cap, "treino-microciclo-ia.png") }); await pg.click("#mc-ia-x");
ia.cancelado = await pg.evaluate(async () => { await window.__ia; return mcIA === null && !document.querySelector("#mc-ia-x"); });
if (ia.semana !== "OBJ IA*|PI IA*|Jogo reduzido e finalização|PFIN IA*|OBJ IA*|-|OP IA*|OS IA*" || ia.pedidos !== 3 || !ia.estilo || ia.nIA !== 6 || ia.subst !== "PF IA*" || !ia.invalido
  || ia.aprovado !== "0|OP IA|-|PI IA" || !ia.semIA || !ia.cancelado) erros.push("Microciclo (IA): errado " + JSON.stringify(ia));
await pg.evaluate((seg) => { delete ciclos["micro-" + seg]; mcSample = undefined; }, SEGM);
await pg.click("#mc-pad"); await pg.waitForSelector(".mc-pl"); mcUi.padrao = await pg.locator(".mc-pl").count(); await pg.click("#sheet-root [data-close]"); await pg.waitForTimeout(100);
if (mc.md !== "MD-4,MD-3,MD+1,MD+2,MD" || mc.blocos !== "folga,,,jogo,,estagio,md" || mc.at !== "2,1" || mc.min !== 10 || mc.ut !== "UT 901" || mc.hora !== "19h30 - 21h00" || mc.n !== 77 || mc.pf !== "Texto escrito|true" || mc.repor || !mc.pdf
  || mc.cores !== ",,,#F28E86,,#F28E86,#F28E86" || mc.fora !== "#B3CEFB,#B3CEFB" || mc.anual !== 2 || mc.cfa !== "#1F3864#FF6B6B,#404040#FF6B6B"
  || mc.loc !== "Estádio João Paulo II - Angra do Heroísmo (Ilha Terceira)" || mc.chave !== "barreiro,uniao-micaelense,barreiro,sao-roque" || mc.compCal !== "camp,livre,taca"
  || mcUi.blocos !== 4 || mcUi.campo !== "Jogo reduzido e finalização" || mcUi.fechado !== "fechado,0" || mcUi.reaberto !== "rascunho,2" || mcUi.padrao !== 9)
  erros.push("Microciclo: resumo errado " + JSON.stringify({ mc, mcUi }));
const jogoAntes = await pg.evaluate(() => JSON.stringify(jogo));
// v107: bolas paradas acompanham o onze e as substituições (lance de teste com tarefas fixas)
const bp = await pg.evaluate(() => { const J0 = clone(jogo), E0 = clone(est), D0 = clone(lancesDb);
  jogo.onze = [["1", "1", "GR"], ["2", "2", "DD"], ["3", "3", "DC"], ["4", "4", "DC"], ["5", "5", "DE"], ["6", "6", "MC"], ["7", "7", "ED"], ["8", "8", "MC"], ["9", "9", "PL"], ["10", "10", "MO"], ["11", "11", "EE"]].map(([slot, n, pos], i) => ({ slot, n, pos, x: 1000 * i, y: 1000 }));
  jogo.subs = []; est.linhas = []; est.fase = "pre";
  const bolas = ["2", "3", "4", "5", "7"].map((s, i) => ({ slot: s, x: 100 * i, y: 100 })), legs = [];
  lancesDb.tbp = { id: "tbp", nome: "Teste BP", tipo: "OF", bolas, legs, fixo: { "2": "4", "4": "9" } };
  const v = () => { const L = lances().find((l) => l.id === "tbp"), x = calcula(L).v; return ["2", "3", "4", "5", "7"].map((s) => x[s]).join(","); };
  const r = { ini: v() };
  // troca de lugar entre titulares (3 <-> 5 no onze): o lance não muda
  const antesB = Object.fromEntries(jogo.onze.map((o) => [o.slot, o.n])); jogo.onze[2].n = "5"; jogo.onze[4].n = "3"; fixaLances(["3", "5"], antesB); r.lugar = v();
  // o 4 sai do onze e entra o 19 (o 19 fica com as tarefas do 4)
  jogo.onze[3].n = "19"; passaNosLances("4", "19", false); r.sai = v();
  // aviso de quem não está a jogar e correção
  lancesDb.tbp.fixo["7"] = "70"; r.aus = ausentesDe(lances().find((l) => l.id === "tbp")).join(","); corrigeAusentes(); r.corr = v();
  // repetidos: o 3 em duas tarefas fica só numa (a da posição dele); a outra vai para um titular livre
  lancesDb.tbp.fixo["5"] = "3"; corrigeAusentes(); r.rep = v();
  // Ao vivo: sai o 9, entra o 20; troca planeada 20 <-> 2 (os dois em campo)
  jogo.subs = [{ id: "s9", sai: "9", entra: "20", min: "60:00", c: 1 }]; r.vivo = v();
  est.linhas = [{ id: "p1", sai: "20", entra: "2", modo: "todos" }]; r.troca = v();
  // planeada 7 -> 21 mas no Ao vivo entrou o 22: conta o que aconteceu
  est.linhas = [{ id: "p2", sai: "7", entra: "21", modo: "todos" }]; jogo.subs.push({ id: "s7", sai: "7", entra: "22", min: "70:00", c: 2 }); r.real = v();
  // botão do Quadro (clique a sério): aviso com repetidos, toca e o lance fica sem repetidos
  lancesDb.tbp.fixo["5"] = "3"; jogo.subs = []; est.linhas = []; curId = "tbp"; render(); const bt = document.getElementById("q-aus"); r.botao = !!bt; if (bt) bt.click(); r.depoisBotao = v();
  jogo = J0; est = E0; lancesDb = D0; render(); return r; });
if (JSON.stringify(bp) !== JSON.stringify({ ini: "4,3,9,5,7", lugar: "4,3,9,5,7", sai: "19,3,9,5,7", aus: "70", corr: "19,3,9,5,7", rep: "19,3,9,5,7", vivo: "19,3,20,5,7", troca: "19,3,2,5,7", real: "19,3,20,5,22", botao: true, depoisBotao: "19,3,9,5,7" }))
  erros.push("Bolas paradas e substituições: " + JSON.stringify(bp));
await pg.click("#tab-j"); await pg.click("#j-cal"); await pg.waitForSelector('[data-cal="tmcA"]'); await pg.click('[data-cal="tmcA"]');
if (await pg.locator('[data-cal="tmcA"]').count()) await pg.click('[data-cal="tmcA"]'); await pg.waitForTimeout(150);
const jc = await pg.evaluate(() => [jogo.calId, jogo.adversario, jogo.data, jogo.comp, jogo.casa, $("j-adv").value].join("|"));
if (jc !== "tmcA|Oficial FC|2027-06-13|camp|casa|Oficial FC") erros.push("Jogo do calendário: dados errados " + jc);
await pg.evaluate((s) => guardaJogo(normJogo(JSON.parse(s))), jogoAntes); await pg.click("#tab-u");
await pg.evaluate((seg) => { ["tmcA", "tmcJ", "tmcB"].forEach((id) => delete calendario[id]); delete semanas[seg]; delete uts.tmc1;
  Object.keys(microCampo).filter((k) => k.startsWith(seg)).forEach((k) => delete microCampo[k]); delete microResumo[seg]; uModo = "ut"; }, SEGM);
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
