// v115–v122: Pós-jogo › Vídeos — ecrã único (vídeo por baixo do desenho, barra do tempo), paragens, peças que andam (pontos-chave),
// tocar, ficha, vídeo final MP4 com som, lista, ▶ Ver, aviso de desatualizado e cópia de segurança.
// Uso: npm run test:videos [-- caminho/do/clip.mp4]   (Edge: o Chromium do Playwright não lê H.264)
import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ajudas } from "./_vd-comum.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const clip = process.argv.slice(2).find((a) => a.endsWith(".mp4")) || join(process.env.USERPROFILE || "", "Documents/Arquivo/Fut/Estoril Vários Momentos (2).mp4");
if (!existsSync(clip)) { console.log("⚠ sem clip para testar: " + clip); process.exit(0); }
const cap = join(raiz, "tests/capturas/videos"); mkdirSync(cap, { recursive: true });
const browser = await chromium.launch({ channel: "msedge" });
const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await pg.route(/^https?:/, (r) => (/cdn.jsdelivr.net|cdnjs.cloudflare.com/.test(r.request().url()) ? r.continue() : r.abort()));
const erros = []; pg.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push(s); });
let falhas = 0; const ok = (c, msg) => { console.log((c ? "✓ " : "✗ ") + msg); if (!c) falhas++; };
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href); await pg.waitForTimeout(800);
await pg.evaluate(() => { window.__up = []; window.__dl = [];
  window.claude = { use: async (n) => n === "assets" ? { upload: async (b, o) => { window.__up.push({ size: b.size, type: (o && o.type) || b.type }); window.__mp4 = b; return { id: "vdteste" + Math.random().toString(36).slice(2, 10), url: URL.createObjectURL(b) }; }, delete: async () => ({}) }
    : n === "downloads" ? { save: async ({ filename, data }) => { window.__dl.push({ filename, size: data.length || data.byteLength }); } } : null };
  xAssets = undefined; });
const { abre, livre, vaiPara, em, toca, arrasta, ferr, passo, pausas } = ajudas(pg);

await pg.click("#tab-a"); await pg.click("#av-vid"); await pg.waitForTimeout(150);
ok(await pg.evaluate(() => !$("a-videos").hidden && /Ainda não há vídeos/.test($("a-videos").textContent)), "vista Vídeos aberta, sem vídeos");
await abre(clip);
const V0 = await pg.evaluate(() => ({ ...vdEd.V.fonte, n: Object.keys(videos).length, fundo: !!document.querySelector("#ie-palco video.ie-fundo"), ferr: [...document.querySelectorAll("#ie-ferr button:not([hidden])")].map((b) => b.textContent.trim()).join("|") }));
ok(V0.n === 1 && V0.dur > 40 && V0.w === 1280 && V0.fundo, "clip abre logo no ecrã único, com o vídeo por baixo do desenho " + JSON.stringify({ dur: V0.dur, w: V0.w, fundo: V0.fundo }));
ok(/Mover\|◯ Jogador\|🔗 Ligação\|↗ Seta\|▱ Zona\|🔦 Luz\|T Texto\|⋯ Mais/.test(V0.ferr), "ferramentas principais à vista e as outras em «⋯ Mais» · " + V0.ferr);
await pg.click("#ie-ferr [data-mais]"); ok(await pg.evaluate(() => !document.querySelector('#ie-ferr [data-f="num"]').hidden), "«⋯ Mais» mostra Nº, Marca, Caneta e Campo"); await pg.click("#ie-ferr [data-mais]");

// barra: arrastar para a frente e para trás mostra o vídeo nesse momento; largar deixa editar ali
{ const bb = await pg.locator("#vt-pos").boundingBox(), y = bb.y + bb.height / 2, x = (f) => bb.x + 8 + (bb.width - 16) * f, t = () => pg.evaluate(() => vdEd.v.currentTime);
  await pg.mouse.move(x(0), y); await pg.mouse.down(); for (let i = 1; i <= 25; i++) { await pg.mouse.move(x(i / 50), y); await pg.waitForTimeout(25); } const fr = await t();
  for (let i = 25; i >= 10; i--) { await pg.mouse.move(x(i / 50), y); await pg.waitForTimeout(25); } await pg.mouse.up(); await livre(); await pg.waitForTimeout(300);
  const tr = await pg.evaluate(() => vdEd.des.t);
  ok(Math.abs(fr - V0.dur * .5) < 1 && Math.abs(tr - V0.dur * .2) < 1, `barra: arrastar para a frente (${fr.toFixed(1)} s) e para trás (${tr.toFixed(1)} s); ao largar fica-se nesse momento`); }

// paragem aos 6 s (2 s) com jogador e ligação
await vaiPara(6); await pg.click("#vt-para"); await livre();
await ferr("circ"); await toca(await em(.5, .55));
await ferr("lig"); for (const q of [[.3, .6], [.45, .5], [.6, .62]]) await toca(await em(...q)); await toca(await em(.6, .62));
await pg.evaluate(() => { imEd.sel = -1; imDesenha(); imPainel(); });
await pg.locator("#vf-dur").fill("2"); await pg.locator("#vf-dur").dispatchEvent("input"); await pg.waitForTimeout(700);
await pg.screenshot({ path: join(cap, "ecra-paragem.png") });
const p1 = await pausas();
ok(p1.length === 1 && p1[0].t === 6 && p1[0].dur === 2 && p1[0].pecas === "circ,lig" && await pg.evaluate(() => $("vt-para").getAttribute("aria-pressed") === "true"), "⏸ Parar aqui aos 6 s, 2 s, com jogador e ligação " + JSON.stringify(p1));
// paragem aos 20 s com seta; título na ficha do vídeo
await vaiPara(20); await pg.click("#vt-para"); await livre(); await ferr("seta"); await arrasta(await em(.3, .4), await em(.6, .5)); await pg.waitForTimeout(600);
await pg.evaluate(() => { imEd.sel = -1; imDesenha(); imPainel(); }); await pg.click(".vf-det summary"); await pg.fill("#vf-t", "Saída curta e pressão"); await pg.waitForTimeout(800);
ok(await pg.evaluate(() => videos[vdEd.V.id].titulo === "Saída curta e pressão" && videos[vdEd.V.id].pausas.length === 2 && document.querySelectorAll("#vt-marcas .vd-marca").length === 2 && /Saída curta/.test(document.querySelector("#imed-root .imed-tit").textContent)),
  "paragem 2 com seta, 2 marcas na barra e título na ficha (e no topo)");

// V2: aos 30 s sem parar, um círculo que anda (pontos-chave aos 30, 31 e 32 s); aqui há um corte de câmara: sem seguir a câmara
await vaiPara(30); await ferr("circ"); await toca(await em(.5, .5)); await pg.waitForTimeout(600);
await pg.evaluate(() => { imEd.sel = -1; imDesenha(); imPainel(); }); await pg.uncheck("#vf-cam"); await livre();
await passo(1);
const n1 = await pg.evaluate(() => ({ x: imEd.I.pecas.find((p) => p.t === "circ").x, fraca: (imEd.I.fracas || []).length }));
ok(Math.abs(n1.x - .5) < .01, "1 s ▶: aos 31 s o círculo ainda no sítio " + JSON.stringify(n1));
await arrasta(await em(.5, .5), await em(.6, .5)); await passo(1); await arrasta(await em(.6, .5), await em(.7, .5));
await pg.keyboard.press("ArrowLeft"); await pg.waitForFunction(() => Math.abs(vdEd.des.t - 31.8) < .02 && !vdEd.des.ocup); await pg.waitForTimeout(150);
ok(Math.abs(await pg.evaluate(() => imEd.I.pecas.find((p) => p.t === "circ").x) - .68) < .01, "← volta 0,2 s e o círculo está a meio do caminho");
const p3 = await pg.evaluate(() => { const P = vdEd.V.pausas[2], k = P.pecas[0].pk; return { t: P.t, dur: P.dur, ate: P.ate, keys: (P.mov[k] || []).map((e) => [e[0], +e[1].x.toFixed(3)]), meio: +vdPecasEm(P, 30.5)[0].x.toFixed(3) }; });
ok(p3.t === 30 && p3.dur === 0 && p3.ate === 33 && p3.keys.length === 3 && Math.abs(p3.keys[2][1] - .7) < .01 && Math.abs(p3.meio - .55) < .01, "momento sem parar aos 30 s, pontos-chave 30/31/32 s, 3 s no ecrã no mínimo " + JSON.stringify(p3));
// ⏹ Acaba aqui de uma peça, aos 32,5 s
await vaiPara(32.5); { const i = await pg.evaluate(() => imEd.I.pecas.findIndex((p) => p.t === "circ")); await pg.evaluate((i) => { imEd.sel = i; imDesenha(); imPainel(); }, i); }
await pg.click("#vf-fimp"); await livre();
ok(await pg.evaluate(() => { const P = vdEd.V.pausas[2]; return P.fim && Math.abs(P.fim[P.pecas[0].pk] - 32.5) < .02 && vdPecasEm(P, 32.4).length === 1 && vdPecasEm(P, 32.6).length === 0; }), "⏹ Acaba aqui: o círculo desaparece a partir dos 32,5 s");
await pg.screenshot({ path: join(cap, "editor-video.png") });

// ▶ dentro do ecrã: para na paragem dos 6 s o tempo marcado, com o desenho, e continua
await vaiPara(5); await pg.click("#vt-play");
await pg.waitForFunction(() => Math.abs(vdEd.v.currentTime - 6) < .05 && vdEd.v.paused && document.querySelector("#ie-palco .im-ov *"), null, { timeout: 5000 }).catch(() => {});
const c1 = await pg.evaluate(() => ({ t: vdEd.v.currentTime, pausado: vdEd.v.paused, ov: !!document.querySelector("#ie-palco .im-ov *"), tocar: vdEd.des.tocar }));
ok(Math.abs(c1.t - 6) < .05 && c1.pausado && c1.ov && c1.tocar, "▶: o vídeo para aos 6 s com o desenho " + JSON.stringify(c1));
await pg.waitForTimeout(2600);
const c2 = await pg.evaluate(() => ({ t: vdEd.v.currentTime, tocar: vdEd.des.tocar, ov: !!document.querySelector("#ie-palco .im-ov *"), o: (document.querySelector("#ie-palco .im-ov") || {}).innerHTML?.slice(0, 160), cam: vdCamadas(vdEd.V, vdEd.v.currentTime).map(([p]) => p.t) }));
ok(c2.t > 6.1 && c2.tocar && !c2.ov, "passados 2 s continua, sem desenho " + JSON.stringify(c2));
await pg.keyboard.press(" "); await livre(); ok(await pg.evaluate(() => !vdEd.des.tocar && vdEd.v.paused), "espaço para e deixa editar");

// vídeo final (em tempo real: ~ duração do clip)
const t0 = Date.now(); await pg.click("#vt-grav");
await pg.waitForFunction(() => !document.getElementById("vd-prog") && window.__mp4, null, { timeout: 240000 }); await livre();
const fim = await pg.evaluate(() => ({ up: window.__up, dl: window.__dl, saida: vdEd.V.saida, chave: vdEd.V.saida && vdEd.V.saida.chave === vdChave(vdEd.V) }));
ok(fim.up.length === 1 && fim.up[0].type === "video/mp4" && fim.up[0].size < 20 * 1048576 && fim.saida && fim.chave, `vídeo final gravado na app (${(fim.up[0]?.size / 1048576).toFixed(1)} MB, ${Math.round((Date.now() - t0) / 1000)} s a gravar)`);
ok(fim.dl.length === 1 && /\.mp4$/.test(fim.dl[0].filename), "e descarregado para o computador");
{ const b64 = await pg.evaluate(async () => { const b = new Uint8Array(await window.__mp4.arrayBuffer()); let s = ""; for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode(...b.subarray(i, i + 32768)); return btoa(s); });
  writeFileSync(join(cap, "final.mp4"), Buffer.from(b64, "base64")); }
const mp4 = await pg.evaluate(async () => { const v = document.createElement("video"); v.muted = true; v.src = URL.createObjectURL(window.__mp4); await new Promise((ok, ko) => { v.onloadeddata = ok; v.onerror = () => ko(new Error("mp4")); });
  const ac = new AudioContext(); let som = 0; try { const A = await ac.decodeAudioData(await window.__mp4.arrayBuffer()); som = A.duration; } catch (e) { som = -1; } return { dur: v.duration, w: v.videoWidth, som }; });
ok(Math.abs(mp4.dur - (V0.dur + 5)) < .4 && mp4.w === 1280 && Math.abs(mp4.som - mp4.dur) < .5, `MP4: ${mp4.dur.toFixed(2)} s (clip ${V0.dur.toFixed(2)} + 5 s de paragens), som ${mp4.som.toFixed(2)} s`);
ok(await pg.evaluate(() => !!document.querySelector("#imed-root .imed-svg") && Math.abs(vdEd.des.t - vdEd.v.currentTime) < .05), "depois de gravar continua no ecrã, no mesmo momento");

// ✓ Concluir fecha tudo e volta à lista
await pg.click("#ie-ok"); await pg.waitForTimeout(400);
const lista = await pg.evaluate(() => ({ ed: !!vdEd, im: !!imEd, cards: document.querySelectorAll("#vd-grid .imcard").length, txt: $("vd-grid").textContent }));
ok(!lista.ed && !lista.im && lista.cards === 1 && /Saída curta/.test(lista.txt) && /3 paragens/.test(lista.txt), "✓ Concluir volta à lista: o vídeo, 3 momentos e ▶ Ver " + JSON.stringify({ ...lista, txt: undefined }));
await pg.click('#vd-grid button[data-a="ver"] >> nth=0'); await pg.waitForTimeout(500);
ok(await pg.evaluate(() => !!document.querySelector(".vdver video")), "▶ Ver abre o vídeo final"); await pg.click("#vv-x");
await pg.evaluate(() => { const V = Object.values(videos)[0]; V.pausas[0].dur = 4; gravaVideo(V); renderVideos(); });
ok(await pg.evaluate(() => /Mudou depois de gravado/.test($("vd-grid").textContent)), "aviso quando as paragens mudam depois de gravar");
ok(await pg.evaluate(() => { const B = { videos: clone(videos) }; const id = Object.keys(videos)[0]; apagaVideo(id); repoeVideos(B); return !!videos[id] && videos[id].pausas.length === 3 && videos[id].pausas[2].ate === 33 && !!videos[id].pausas[2].fim; }), "repor cópia de segurança devolve os vídeos (com pontos-chave e fins)");

await browser.close();
if (erros.length) { console.log("✗ erros de JavaScript: " + erros.join(" | ")); falhas++; }
console.log(falhas ? `FALHOU (${falhas})` : "OK · Vídeos do Pós-jogo (Edge)"); process.exit(falhas ? 1 : 0);
