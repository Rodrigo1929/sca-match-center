// v115: Pós-jogo › Vídeos — abrir um clip, paragens com desenho (editor de imagens), tocar com paragens, gravar o vídeo final (MP4 com som).
// Uso: npm run test:videos [-- caminho/do/clip.mp4]   (Edge: o Chromium do Playwright não lê H.264)
import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

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
// armazenamento e descargas só existem no claude.ai: aqui são simulados
await pg.evaluate(() => { window.__up = []; window.__dl = [];
  window.claude = { use: async (n) => n === "assets" ? { upload: async (b, o) => { window.__up.push({ size: b.size, type: (o && o.type) || b.type }); window.__mp4 = b; return { id: "vdteste" + Math.random().toString(36).slice(2, 10), url: URL.createObjectURL(b) }; }, delete: async () => ({}) }
    : n === "downloads" ? { save: async ({ filename, data }) => { window.__dl.push({ filename, size: data.length || data.byteLength }); } } : null };
  xAssets = undefined; });

await pg.click("#tab-a"); await pg.click("#av-vid"); await pg.waitForTimeout(150);
ok(await pg.evaluate(() => !$("a-videos").hidden && /Ainda não há vídeos/.test($("a-videos").textContent)), "vista Vídeos aberta, sem vídeos");
await pg.setInputFiles("#vd-file", clip);
await pg.waitForFunction(() => vdEd && vdEd.v && vdEd.v.readyState >= 2, null, { timeout: 20000 });
const V0 = await pg.evaluate(() => ({ ...vdEd.V.fonte, n: Object.keys(videos).length }));
ok(V0.n === 1 && V0.dur > 40 && V0.w === 1280 && V0.h === 720, "clip aberto no editor " + JSON.stringify(V0));

// paragem 1 aos 6 s: círculo + ligação; paragem 2 aos 20 s: seta
const vaiPara = async (t) => { await pg.evaluate((t) => new Promise((ok) => { vdEd.v.addEventListener("seeked", ok, { once: true }); vdEd.v.currentTime = t; }), t); };
const em = async (fx, fy) => { const b = await pg.locator(".imed-svg").boundingBox(), I = await pg.evaluate(() => ({ w: imEd.I.img.w, h: imEd.I.img.h }));
  const k = Math.min(b.width / I.w, b.height / I.h), ox = b.x + (b.width - I.w * k) / 2, oy = b.y + (b.height - I.h * k) / 2; return { x: ox + fx * I.w * k, y: oy + fy * I.h * k }; };
const toca = async (p) => { await pg.mouse.click(p.x, p.y); await pg.waitForTimeout(80); };
await vaiPara(6); await pg.click("#vd-add"); await pg.waitForSelector(".imed:not(.vded) .imed-svg", { timeout: 10000 }); await pg.waitForTimeout(300);
const ed1 = await pg.evaluate(() => ({ op: !!imEd.op, png: $("ie-png").hidden, crop: !!document.querySelector('#ie-ferr [data-f="crop"]'), tit: document.querySelector("#imed-root .imed-tit").textContent, img: imEd.I.img.w }));
ok(ed1.op && ed1.png && !ed1.crop && /Paragem aos 0:06/.test(ed1.tit) && ed1.img === 1280, "paragem abre o editor de imagens com a imagem parada (sem PNG nem Recortar) " + JSON.stringify(ed1));
await pg.click('#ie-ferr [data-f="circ"]'); await toca(await em(.5, .55));
await pg.click('#ie-ferr [data-f="lig"]'); for (const q of [[.3, .6], [.45, .5], [.6, .62]]) await toca(await em(...q)); await toca(await em(.6, .62));
await pg.locator("#vf-dur").fill("2"); await pg.locator("#vf-dur").dispatchEvent("input");
await pg.screenshot({ path: join(cap, "paragem-editor.png") });
await pg.click("#ie-ok"); await pg.waitForTimeout(700);
const p1 = await pg.evaluate(() => vdEd.V.pausas.map((p) => ({ t: p.t, dur: p.dur, pecas: p.pecas.map((x) => x.t).join(",") })));
ok(p1.length === 1 && p1[0].t === 6 && p1[0].dur === 2 && p1[0].pecas === "circ,lig", "paragem 1 gravada com círculo e ligação, 2 s " + JSON.stringify(p1));
ok(await pg.evaluate(() => !!document.querySelector("#vd-ov *")), "parado na paragem: o desenho aparece por cima do vídeo");
await vaiPara(20); await pg.click("#vd-add"); await pg.waitForSelector(".imed:not(.vded) .imed-svg"); await pg.waitForTimeout(300);
await pg.click('#ie-ferr [data-f="seta"]'); { const a = await em(.3, .4), b = await em(.6, .5); await pg.mouse.move(a.x, a.y); await pg.mouse.down(); for (let i = 1; i <= 8; i++) await pg.mouse.move(a.x + (b.x - a.x) * i / 8, a.y + (b.y - a.y) * i / 8); await pg.mouse.up(); }
await pg.click("#ie-ok"); await pg.waitForTimeout(700);
ok(await pg.evaluate(() => vdEd.V.pausas.length === 2 && vdEd.V.pausas[1].pecas[0].t === "seta" && document.querySelectorAll(".vd-marca").length === 2), "paragem 2 com seta e 2 marcas na barra");
await pg.fill("#vf-t", "Saída curta e pressão"); await pg.waitForTimeout(800);
ok(await pg.evaluate(() => videos[vdEd.V.id].titulo === "Saída curta e pressão" && videos[vdEd.V.id].pausas.length === 2), "ficha e paragens gravadas na base de dados");
await pg.screenshot({ path: join(cap, "editor-video.png") });

// tocar: para na paragem 1 o tempo marcado, com o desenho, e continua
await vaiPara(5); await pg.click("#vd-play");
await pg.waitForFunction(() => vdEd.congelada, null, { timeout: 5000 }).catch(() => {});
const c1 = await pg.evaluate(() => ({ cong: vdEd.congelada && vdEd.congelada.t, t: vdEd.v.currentTime, ov: !!document.querySelector("#vd-ov *"), pausado: vdEd.v.paused }));
ok(c1.cong === 6 && Math.abs(c1.t - 6) < .05 && c1.ov && c1.pausado, "a tocar, o vídeo para na paragem com o desenho " + JSON.stringify(c1));
await pg.waitForTimeout(2600);
const c2 = await pg.evaluate(() => ({ cong: !!vdEd.congelada, t: vdEd.v.currentTime, ov: !!document.querySelector("#vd-ov *"), tocar: vdEd.tocar }));
ok(!c2.cong && c2.t > 6.1 && !c2.ov && c2.tocar, "passados 2 s continua sem desenho " + JSON.stringify(c2));
await pg.click("#vd-play"); ok(await pg.evaluate(() => !vdEd.tocar && vdEd.v.paused), "⏸ para");

// gravar o vídeo final (em tempo real: ~ duração do clip)
const t0 = Date.now(); await pg.click("#vd-grav");
await pg.waitForFunction(() => !document.getElementById("vd-prog"), null, { timeout: 240000 });
if (!(await pg.evaluate(() => !!window.__mp4))) { const n = (await pg.evaluate(() => window.__dl))[0]; console.log("✗ não chegou à app: " + JSON.stringify(n)); await browser.close(); process.exit(1); }
const fim = await pg.evaluate(() => ({ up: window.__up, dl: window.__dl, saida: vdEd.V.saida, chave: vdEd.V.saida && vdEd.V.saida.chave === vdChave(vdEd.V) }));
ok(fim.up.length === 1 && fim.up[0].type === "video/mp4" && fim.up[0].size < 20 * 1048576 && fim.saida && fim.chave, `vídeo final gravado na app (${(fim.up[0]?.size / 1048576).toFixed(1)} MB, ${Math.round((Date.now() - t0) / 1000)} s a gravar)`);
ok(fim.dl.length === 1 && /\.mp4$/.test(fim.dl[0].filename), "e descarregado para o computador " + JSON.stringify(fim.dl));
{ const b64 = await pg.evaluate(async () => { const b = new Uint8Array(await window.__mp4.arrayBuffer()); let s = ""; for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode(...b.subarray(i, i + 32768)); return btoa(s); });
  writeFileSync(join(cap, "final.mp4"), Buffer.from(b64, "base64")); }
// o MP4: duração = clip + paragens, com som; imagens dentro das paragens têm o desenho
const mp4 = await pg.evaluate(async () => { const v = document.createElement("video"); v.muted = true; v.src = URL.createObjectURL(window.__mp4); await new Promise((ok, ko) => { v.onloadeddata = ok; v.onerror = () => ko(new Error("mp4")); });
  const tira = async (t) => { await new Promise((ok) => { v.onseeked = ok; v.currentTime = t; }); const c = document.createElement("canvas"); c.width = 640; c.height = 360; c.getContext("2d").drawImage(v, 0, 0, 640, 360); return c.toDataURL("image/jpeg", .8); };
  const ac = new AudioContext(); let som = 0; try { const A = await ac.decodeAudioData(await window.__mp4.arrayBuffer()); som = A.duration; } catch (e) { som = -1; }
  return { dur: v.duration, w: v.videoWidth, h: v.videoHeight, som, f1: await tira(7), f0: await tira(4), f2: await tira(24) }; });
ok(Math.abs(mp4.dur - (V0.dur + 5)) < .4 && mp4.w === 1280 && Math.abs(mp4.som - mp4.dur) < .5, `MP4: ${mp4.dur.toFixed(2)} s (clip ${V0.dur.toFixed(2)} + 5 s de paragens), ${mp4.w}×${mp4.h}, som ${mp4.som.toFixed(2)} s`);
for (const k of ["f0", "f1", "f2"]) writeFileSync(join(cap, `final-${k}.jpg`), Buffer.from(mp4[k].split(",")[1], "base64"));

await pg.click("#vd-ok"); await pg.waitForTimeout(300);
const lista = await pg.evaluate(() => ({ cards: document.querySelectorAll("#vd-grid .imcard").length, txt: $("vd-grid").textContent, ver: !!document.querySelector('#vd-grid [data-a="ver"]') }));
ok(lista.cards === 1 && /Saída curta/.test(lista.txt) && /2 paragens/.test(lista.txt) && lista.ver, "lista com o vídeo, as paragens e ▶ Ver");
await pg.click('#vd-grid button[data-a="ver"] >> nth=0'); await pg.waitForTimeout(500);
ok(await pg.evaluate(() => !!document.querySelector(".vdver video")), "▶ Ver abre o vídeo final"); await pg.screenshot({ path: join(cap, "ver.png") }); await pg.click("#vv-x");
// mudar uma paragem depois de gravar → aviso de vídeo desatualizado
await pg.evaluate(() => { const V = Object.values(videos)[0]; V.pausas[0].dur = 4; gravaVideo(V); renderVideos(); });
ok(await pg.evaluate(() => /Mudou depois de gravado/.test($("vd-grid").textContent)), "aviso quando as paragens mudam depois de gravar");
// cópia de segurança leva os vídeos
ok(await pg.evaluate(() => { const B = { videos: clone(videos) }; const id = Object.keys(videos)[0]; apagaVideo(id); repoeVideos(B); return !!videos[id] && videos[id].pausas.length === 2; }), "repor cópia de segurança devolve os vídeos");

await browser.close();
if (erros.length) { console.log("✗ erros de JavaScript: " + erros.join(" | ")); falhas++; }
console.log(falhas ? `FALHOU (${falhas})` : "OK · Vídeos do Pós-jogo (Edge)"); process.exit(falhas ? 1 : 0);
