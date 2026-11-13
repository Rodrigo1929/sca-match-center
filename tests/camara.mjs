// v118: vídeos — a câmara roda (tripé) e o desenho fica preso à relva.
// Faz um MP4 sintético com a câmara a rodar a uma velocidade conhecida (e um marcador fixo em cima, e um «jogador» a correr),
// abre-o no editor e confirma que a app mede o movimento e que as peças acompanham. Com o clip real, guarda capturas para ver.
// Uso: npm run test:camara [-- caminho/do/clip.mp4]   (Edge: o Chromium do Playwright não lê H.264)
import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { mkdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const clip = process.argv.slice(2).find((a) => a.endsWith(".mp4")) || join(process.env.USERPROFILE || "", "Documents/Arquivo/Fut/Estoril Vários Momentos (2).mp4");
const cap = join(raiz, "tests/capturas/camara"); mkdirSync(cap, { recursive: true });
const browser = await chromium.launch({ channel: "msedge" });
const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await pg.route(/^https?:/, (r) => (/cdn.jsdelivr.net|cdnjs.cloudflare.com/.test(r.request().url()) ? r.continue() : r.abort()));
const erros = []; pg.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push(s); });
let falhas = 0; const ok = (c, msg) => { console.log((c ? "✓ " : "✗ ") + msg); if (!c) falhas++; };
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href); await pg.waitForTimeout(800);

// 1) MP4 sintético: relva com linhas e placas, 3000 px de largura; a câmara (janela 1280×720) anda 250 px/s para a direita e 4 px/s para baixo
const VX = 250, VY = 4;
const b64 = await pg.evaluate(async ({ VX, VY }) => {
  if (!window.Mp4Muxer) await carregaScript(VD_MUXER);
  let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const T = document.createElement("canvas"); T.width = 3200; T.height = 900; const t = T.getContext("2d");
  t.fillStyle = "#3d7a35"; t.fillRect(0, 0, 3200, 900);
  for (let x = 0; x < 3200; x += 160) { t.fillStyle = x / 160 % 2 ? "#437f3a" : "#3a7433"; t.fillRect(x, 200, 160, 700); }   // faixas da relva
  for (let i = 0; i < 30; i++) { t.fillStyle = `hsl(${Math.floor(rnd() * 360)},70%,${40 + rnd() * 30}%)`; t.fillRect(i * 110, 140, 100, 50); t.fillStyle = "#fff"; t.font = "bold 22px sans-serif"; t.fillText("AD" + i, i * 110 + 20, 172); }   // placas
  for (let i = 0; i < 60; i++) { t.fillStyle = `rgb(${120 + rnd() * 100},${120 + rnd() * 100},${120 + rnd() * 100})`; t.fillRect(rnd() * 3200, rnd() * 130, 8 + rnd() * 30, 8 + rnd() * 30); }   // bancada
  t.strokeStyle = "#f4f4f4"; t.lineWidth = 5; t.beginPath(); t.moveTo(0, 260); t.lineTo(3200, 260); t.moveTo(1600, 260); t.lineTo(1600, 900); t.stroke(); t.beginPath(); t.arc(1600, 560, 150, 0, 7); t.stroke();
  for (let x = 300; x < 3200; x += 600) { t.strokeRect(x, 420, 180, 300); }
  const W = 1280, H = 720, fps = 25, n = 6 * fps, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const c = cv.getContext("2d");
  const mux = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H }, fastStart: "in-memory" });
  const enc = new VideoEncoder({ output: (k, m) => mux.addVideoChunk(k, m), error: (e) => { throw e; } });
  enc.configure({ codec: "avc1.42e028", width: W, height: H, bitrate: 4e6, framerate: fps });
  for (let i = 0; i < n; i++) { const s = i / fps; c.drawImage(T, -(200 + VX * s), -(100 + VY * s));
    c.fillStyle = "#ffd400"; c.beginPath(); c.arc(200 + 120 * s, 520, 18, 0, 7); c.fill();          // «jogador» a correr (no ecrã)
    c.fillStyle = "#123"; c.fillRect(30, 20, 360, 56); c.fillStyle = "#fff"; c.font = "bold 30px sans-serif"; c.fillText("SCA 0 | 0 EST  45:0" + (i % 10), 44, 58);   // marcador fixo
    const f = new VideoFrame(cv, { timestamp: Math.round(s * 1e6), duration: 40000 }); enc.encode(f, { keyFrame: i % 50 === 0 }); f.close(); }
  await enc.flush(); mux.finalize(); const b = new Uint8Array(mux.target.buffer); let r = ""; for (let i = 0; i < b.length; i += 32768) r += String.fromCharCode(...b.subarray(i, i + 32768)); return btoa(r); }, { VX, VY });

await pg.click("#tab-a"); await pg.click("#av-vid"); await pg.waitForTimeout(150);
await pg.setInputFiles("#vd-file", { name: "camara-sintetica.mp4", mimeType: "video/mp4", buffer: Buffer.from(b64, "base64") });
await pg.waitForFunction(() => vdEd && vdEd.v && vdEd.v.readyState >= 2, null, { timeout: 20000 });
const vaiPara = async (t) => { await pg.evaluate((t) => new Promise((ok) => { vdEd.v.addEventListener("seeked", ok, { once: true }); vdEd.v.currentTime = t; }), t); };
const em = async (fx, fy) => { const b = await pg.locator(".imed-svg").boundingBox(), I = await pg.evaluate(() => ({ w: imEd.I.img.w, h: imEd.I.img.h }));
  const k = Math.min(b.width / I.w, b.height / I.h), ox = b.x + (b.width - I.w * k) / 2, oy = b.y + (b.height - I.h * k) / 2; return { x: ox + fx * I.w * k, y: oy + fy * I.h * k }; };
await vaiPara(1); await pg.click("#vd-add"); await pg.waitForSelector(".imed:not(.vded) .imed-svg"); await pg.waitForTimeout(300);
ok(await pg.evaluate(() => $("vf-cam").checked), "«A câmara roda» vem ligado");
await pg.click('#ie-ferr [data-f="zona"]'); { const a = await em(.45, .6), b = await em(.6, .8); await pg.mouse.move(a.x, a.y); await pg.mouse.down(); for (let i = 1; i <= 6; i++) await pg.mouse.move(a.x + (b.x - a.x) * i / 6, a.y + (b.y - a.y) * i / 6); await pg.mouse.up(); }
await pg.click('#ie-ferr [data-f="circ"]'); await pg.mouse.click(...Object.values(await em(.5, .5)));
await pg.waitForTimeout(200);
const z0 = await pg.evaluate(() => imEd.I.pecas.map((p) => p.pts ? p.pts[0][0] : p.x));
const t0 = Date.now(); await pg.click('.vf-nav [data-d="1"]'); await pg.waitForFunction(() => /0:02\.0/.test($("vf-agora").textContent), null, { timeout: 30000 });
const seg = (Date.now() - t0) / 1000;
await pg.click('.vf-nav [data-d="1"]'); await pg.waitForFunction(() => /0:03\.0/.test($("vf-agora").textContent), null, { timeout: 30000 }); await pg.waitForTimeout(200);
const r = await pg.evaluate(() => { const P = vdEd.V.pausas[0], c = P.cam[P.cam.length - 1]; return { n: P.cam.length, c, em2: vdCamEm(P, 2), x3: imEd.I.pecas.map((p) => p.pts ? p.pts[0][0] : p.x), mov: Object.keys(P.mov).length }; });
const esp = (s) => [-VX * s / 1280, -VY * s / 720];   // quanto a imagem andou s segundos depois da paragem
const e2 = esp(1), e3 = esp(2);
ok(Math.abs(r.em2[0] - e2[0]) < .004 && Math.abs(r.em2[1] - e2[1]) < .004, `câmara medida ao fim de 1 s: dx ${r.em2[0].toFixed(4)} (esperado ${e2[0].toFixed(4)}), dy ${r.em2[1].toFixed(4)} (esperado ${e2[1].toFixed(4)}) · ${seg.toFixed(1)} s a medir 1 s de vídeo`);
ok(Math.abs(r.c[1] - e3[0]) < .006 && Math.abs(r.c[2] - e3[1]) < .006 && r.n >= 21, `ao fim de 2 s: dx ${r.c[1].toFixed(4)} (esperado ${e3[0].toFixed(4)}) · ${r.n} medições`);
ok(r.x3.every((x, i) => Math.abs(x - (z0[i] + e3[0])) < .008) && r.mov === 0, `a zona e o círculo seguem a relva sem pontos-chave (${z0.map((x) => x.toFixed(3))} → ${r.x3.map((x) => x.toFixed(3))})`);
await pg.screenshot({ path: join(cap, "sintetico-3s.png") });
// arrastar o círculo aos 3 s: o ponto-chave guarda-se na imagem da paragem (sem a câmara)
{ const cy = await pg.evaluate(() => imEd.I.pecas.find((p) => p.t === "circ").y), a = await em(r.x3[1], cy), b = await em(r.x3[1] + .1, cy); await pg.mouse.move(a.x, a.y); await pg.mouse.down(); for (let i = 1; i <= 6; i++) await pg.mouse.move(a.x + (b.x - a.x) * i / 6, a.y); await pg.mouse.up(); await pg.waitForTimeout(150); }
await pg.click("#ie-ok"); await pg.waitForTimeout(500);
const k = await pg.evaluate(() => { const P = vdEd.V.pausas[0], C = P.pecas.find((p) => p.t === "circ"), tr = P.mov[C.pk]; return { tr: tr && tr.map((e) => [e[0], +e[1].x.toFixed(3)]), ver: +vdPecasVer(P, 3).find((p) => p.t === "circ").x.toFixed(3), ate: P.ate, gravado: videos[vdEd.V.id].pausas[0].cam.length }; });
ok(k.tr && k.tr.length === 2 && Math.abs(k.tr[1][1] - .6) < .01 && Math.abs(k.ver - (.6 + e3[0])) < .01 && k.ate === 3 && k.gravado >= 21, "ponto-chave guardado na imagem da paragem; no ecrã aparece onde foi largado " + JSON.stringify(k));
// a tocar: aos 2,5 s a zona está onde a relva está
await vaiPara(2.5); await pg.waitForTimeout(150);
const ov = await pg.evaluate(() => { const P = vdEd.V.pausas[0]; return { zx: vdPecasVer(P, 2.5).find((p) => p.t === "zona").pts[0][0], ov: !!document.querySelector("#vd-ov *") }; });
ok(ov.ov && Math.abs(ov.zx - (z0[0] + esp(1.5)[0])) < .008, "fora do desenho (barra / tocar) a zona também acompanha a câmara " + ov.zx.toFixed(3));
await pg.click("#vd-ok"); await pg.waitForTimeout(300);

// 2) clip real (opcional): zona no meio-campo e câmara medida durante 3 s, para ver nas capturas
if (existsSync(clip)) {
  await pg.evaluate(() => { Object.keys(videos).forEach(apagaVideo); renderVideos(); });
  await pg.setInputFiles("#vd-file", clip); await pg.waitForFunction(() => vdEd && vdEd.v && vdEd.v.readyState >= 2, null, { timeout: 20000 });
  const T0 = +(process.env.CAM_T || 36);
  await vaiPara(T0); await pg.click("#vd-add"); await pg.waitForSelector(".imed:not(.vded) .imed-svg"); await pg.waitForTimeout(300);
  await pg.click('#ie-ferr [data-f="zona"]'); { const a = await em(.4, .55), b = await em(.6, .8); await pg.mouse.move(a.x, a.y); await pg.mouse.down(); for (let i = 1; i <= 6; i++) await pg.mouse.move(a.x + (b.x - a.x) * i / 6, a.y + (b.y - a.y) * i / 6); await pg.mouse.up(); }
  await pg.screenshot({ path: join(cap, "real-0.png") });
  for (let s = 1; s <= 3; s++) { await pg.click('.vf-nav [data-d="1"]'); await pg.waitForFunction((t) => $("vf-agora").textContent.includes(vdT(t)), T0 + s, { timeout: 30000 }); await pg.waitForTimeout(200); await pg.screenshot({ path: join(cap, `real-${s}.png`) }); }
  console.log("  clip real: câmara " + JSON.stringify(await pg.evaluate(() => vdEd.V.pausas[0].cam.filter((_, i) => i % 5 === 0).map((e) => [e[0], e[1]]))));
  await pg.click("#ie-ok"); await pg.click("#vd-ok");
}
await browser.close();
if (erros.length) { console.log("✗ erros de JavaScript: " + erros.join(" | ")); falhas++; }
console.log(falhas ? `FALHOU (${falhas})` : "OK · Vídeos: a câmara roda e o desenho fica na relva (Edge)"); process.exit(falhas ? 1 : 0);
