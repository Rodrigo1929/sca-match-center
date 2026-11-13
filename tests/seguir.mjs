// v119 (V3): vídeos — a app segue o jogador sozinha.
// MP4 sintético: a câmara roda e dois jogadores correm (amarelo e branco, que se cruzam); sabe-se onde estão os pés em cada momento.
// Põe-se um círculo nos pés do amarelo e uma ligação nos dois, «Seguir todos», e confere-se o caminho. Com o clip real, guarda capturas.
// Uso: npm run test:seguir [-- caminho/do/clip.mp4]   (Edge)
import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { mkdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const clip = process.argv.slice(2).find((a) => a.endsWith(".mp4")) || join(process.env.USERPROFILE || "", "Documents/Arquivo/Fut/Estoril Vários Momentos (2).mp4");
const cap = join(raiz, "tests/capturas/seguir"); mkdirSync(cap, { recursive: true });
const browser = await chromium.launch({ channel: "msedge" });
const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await pg.route(/^https?:/, (r) => (/cdn.jsdelivr.net|cdnjs.cloudflare.com/.test(r.request().url()) ? r.continue() : r.abort()));
const erros = []; pg.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push(s); });
let falhas = 0; const ok = (c, msg) => { console.log((c ? "✓ " : "✗ ") + msg); if (!c) falhas++; };
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href); await pg.waitForTimeout(800);

// onde estão os pés (frações da imagem 1280×720) no momento s: câmara a 150 px/s; amarelo corre para a direita e para baixo, branco para a esquerda
const CAM = (s) => [200 + 150 * s, 100];
const AM = (s) => [700 + 260 * s, 560 + 50 * s], BR = (s) => [1200 + 40 * s, 600 - 30 * s];   // no ecrã: amarelo da esquerda para a direita, branco ao contrário (cruzam-se aos ~2,3 s)
const ecr = (P, s) => [(P(s)[0] - CAM(s)[0]) / 1280, (P(s)[1] - CAM(s)[1]) / 720];
const b64 = await pg.evaluate(async (src) => { const CAM = eval(src.CAM), AM = eval(src.AM), BR = eval(src.BR);
  if (!window.Mp4Muxer) await carregaScript(VD_MUXER);
  let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const T = document.createElement("canvas"); T.width = 3400; T.height = 1000; const t = T.getContext("2d");
  t.fillStyle = "#3d7a35"; t.fillRect(0, 0, 3400, 1000);
  for (let x = 0; x < 3400; x += 160) { t.fillStyle = x / 160 % 2 ? "#437f3a" : "#3a7433"; t.fillRect(x, 200, 160, 800); }
  for (let i = 0; i < 31; i++) { t.fillStyle = `hsl(${Math.floor(rnd() * 360)},70%,${40 + rnd() * 30}%)`; t.fillRect(i * 110, 140, 100, 50); }
  t.strokeStyle = "#f4f4f4"; t.lineWidth = 5; t.beginPath(); t.moveTo(0, 260); t.lineTo(3400, 260); t.moveTo(1700, 260); t.lineTo(1700, 1000); t.stroke(); t.beginPath(); t.arc(1700, 600, 150, 0, 7); t.stroke();
  const jog = (c, x, y, cor, f) => { const p = f % 4 < 2 ? 3 : -3; c.fillStyle = "#222"; c.fillRect(x - 7 + p, y - 22, 6, 22); c.fillRect(x + 1 - p, y - 22, 6, 22);   // pernas
    c.fillStyle = "#111"; c.fillRect(x - 10, y - 34, 20, 13); c.fillStyle = cor; c.fillRect(x - 11, y - 62, 22, 29); c.fillStyle = "#d9a07a"; c.beginPath(); c.arc(x, y - 70, 8, 0, 7); c.fill(); };
  const W = 1280, H = 720, fps = 25, n = 5 * fps, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const c = cv.getContext("2d");
  const mux = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H }, fastStart: "in-memory" });
  const enc = new VideoEncoder({ output: (k, m) => mux.addVideoChunk(k, m), error: (e) => { throw e; } });
  enc.configure({ codec: "avc1.42e028", width: W, height: H, bitrate: 4e6, framerate: fps });
  for (let i = 0; i < n; i++) { const s = i / fps, [cx, cy] = CAM(s); c.drawImage(T, -cx, -cy);
    const a = AM(s), b = BR(s); jog(c, b[0] - cx, b[1] - cy, "#f2f2f2", i); jog(c, a[0] - cx, a[1] - cy, "#ffd400", i);
    c.fillStyle = "#123"; c.fillRect(30, 20, 360, 56); c.fillStyle = "#fff"; c.font = "bold 30px sans-serif"; c.fillText("SCA 0 | 0 EST", 44, 58);
    const f = new VideoFrame(cv, { timestamp: Math.round(s * 1e6), duration: 40000 }); enc.encode(f, { keyFrame: i % 50 === 0 }); f.close(); }
  await enc.flush(); mux.finalize(); const u = new Uint8Array(mux.target.buffer); let r = ""; for (let i = 0; i < u.length; i += 32768) r += String.fromCharCode(...u.subarray(i, i + 32768)); return btoa(r); },
  { CAM: CAM.toString(), AM: AM.toString(), BR: BR.toString() });

await pg.click("#tab-a"); await pg.click("#av-vid"); await pg.waitForTimeout(150);
await pg.setInputFiles("#vd-file", { name: "seguir-sintetico.mp4", mimeType: "video/mp4", buffer: Buffer.from(b64, "base64") });
await pg.waitForFunction(() => vdEd && vdEd.v && vdEd.v.readyState >= 2, null, { timeout: 20000 });
const vaiPara = async (t) => { await pg.evaluate((t) => new Promise((ok) => { vdEd.v.addEventListener("seeked", ok, { once: true }); vdEd.v.currentTime = t; }), t); };
const em = async (fx, fy) => { const b = await pg.locator(".imed-svg").boundingBox(), I = await pg.evaluate(() => ({ w: imEd.I.img.w, h: imEd.I.img.h }));
  const k = Math.min(b.width / I.w, b.height / I.h), ox = b.x + (b.width - I.w * k) / 2, oy = b.y + (b.height - I.h * k) / 2; return { x: ox + fx * I.w * k, y: oy + fy * I.h * k }; };
const T0 = 0.5;
await vaiPara(T0); await pg.click("#vd-add"); await pg.waitForSelector(".imed:not(.vded) .imed-svg"); await pg.waitForTimeout(300);
await pg.locator("#vf-dur").fill("0"); await pg.locator("#vf-dur").dispatchEvent("input");
const a0 = ecr(AM, T0), b0 = ecr(BR, T0);
await pg.click('#ie-ferr [data-f="circ"]'); await pg.mouse.click(...Object.values(await em(...a0)));
await pg.click('#ie-ferr [data-f="lig"]'); for (const q of [a0, b0]) await pg.mouse.click(...Object.values(await em(...q))); await pg.mouse.click(...Object.values(await em(...b0)));
await pg.waitForTimeout(300);
ok(await pg.evaluate(() => imEd.I.pecas.map((p) => p.t).join() === "circ,lig"), "círculo nos pés do amarelo e ligação amarelo–branco");
const t0 = Date.now(); await pg.click("#vf-segT");
await pg.waitForFunction(() => /Seguido até|Não consegui/.test($("vf-segst").textContent), null, { timeout: 120000 });
const seg = (Date.now() - t0) / 1000, msg = await pg.evaluate(() => $("vf-segst").textContent);
const r = await pg.evaluate(() => { const P = vdEd.V.pausas[0], ts = [1, 1.5, 2, 3, 4, 4.4]; return { ate: P.ate, keys: Object.values(P.mov).map((tr) => tr.length), em: ts.map((t) => { const ps = vdPecasVer(P, t); return [t, ps[0].x, ps[0].y, ps[1].pts[0], ps[1].pts[1]]; }) }; });
let pior = 0; for (const [t, cx, cy, la, lb] of r.em) { const A = ecr(AM, t), B = ecr(BR, t); pior = Math.max(pior, Math.hypot(cx - A[0], (cy - A[1]) * 720 / 1280), Math.hypot(la[0] - A[0], (la[1] - A[1]) * 720 / 1280), Math.hypot(lb[0] - B[0], (lb[1] - B[1]) * 720 / 1280)); }
ok(r.ate > 4.3 && pior < .012, `seguiu os dois até ${r.ate} s; maior erro ${(pior * 1280).toFixed(0)} px em 1280 (${seg.toFixed(1)} s para ${(r.ate - T0).toFixed(1)} s de vídeo) · «${msg}»`);
ok(r.keys.every((n) => n >= 15), "pontos-chave criados (a cada 0,2 s) " + JSON.stringify(r.keys));
await pg.click('.vf-nav [data-d="1"]'); await pg.click('.vf-nav [data-d="1"]'); await pg.waitForFunction(() => /0:02\.5/.test($("vf-agora").textContent)); await pg.waitForTimeout(200);
await pg.screenshot({ path: join(cap, "sintetico-2.5s.png") });
await pg.click("#ie-ok"); await pg.click("#vd-ok"); await pg.waitForTimeout(300);

// clip real (capturas para ver): o 8 (branco) e o jogador de verde, aos 36 s, durante 3 s
if (existsSync(clip)) {
  await pg.evaluate(() => { Object.keys(videos).forEach(apagaVideo); renderVideos(); });
  await pg.setInputFiles("#vd-file", clip); await pg.waitForFunction(() => vdEd && vdEd.v && vdEd.v.readyState >= 2, null, { timeout: 20000 });
  await vaiPara(36); await pg.click("#vd-add"); await pg.waitForSelector(".imed:not(.vded) .imed-svg"); await pg.waitForTimeout(300);
  for (const q of [[.742, .861], [.432, .80]]) { await pg.click('#ie-ferr [data-f="circ"]'); await pg.mouse.click(...Object.values(await em(...q))); }
  const t1 = Date.now(); await pg.click("#vf-segT"); await pg.waitForFunction(() => /Seguido até|Não consegui/.test($("vf-segst").textContent), null, { timeout: 180000 });
  console.log(`  clip real: «${await pg.evaluate(() => $("vf-segst").textContent)}» · ${((Date.now() - t1) / 1000).toFixed(1)} s`);
  await pg.screenshot({ path: join(cap, "real-0.png") });
  for (let s = 1; s <= 3; s++) { await pg.click('.vf-nav [data-d="1"]'); await pg.waitForFunction((t) => $("vf-agora").textContent.includes(vdT(t)), 36 + s, { timeout: 30000 }); await pg.waitForTimeout(200); await pg.screenshot({ path: join(cap, `real-${s}.png`) }); }
  await pg.click("#ie-ok"); await pg.click("#vd-ok");
}
await browser.close();
if (erros.length) { console.log("✗ erros de JavaScript: " + erros.join(" | ")); falhas++; }
console.log(falhas ? `FALHOU (${falhas})` : "OK · Vídeos: seguir o jogador sozinho (Edge)"); process.exit(falhas ? 1 : 0);
