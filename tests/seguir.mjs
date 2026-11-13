// v119–v122: vídeos — a app segue o jogador sozinha; quando o perde, avança-se até ele voltar e toca-se nele.
// MP4 sintético: a câmara roda, dois jogadores correm (amarelo e branco) e o amarelo desaparece entre os 2,0 e os 2,7 s (tapado).
// Círculo nos pés do amarelo e ligação amarelo–branco aos 0,5 s; «Seguir todos»; o amarelo perde-se; toca-se nele aos 3 s e continua.
// Também: paragem de 1 s aos 2 s pelo meio (o seguir passa por cima), desenho geral e o anel no MP4. Com o clip real, guarda capturas.
// Uso: npm run test:seguir [-- caminho/do/clip.mp4]   (Edge)
import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { mkdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ajudas } from "./_vd-comum.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const clip = process.argv.slice(2).find((a) => a.endsWith(".mp4")) || join(process.env.USERPROFILE || "", "Documents/Arquivo/Fut/Estoril Vários Momentos (2).mp4");
const cap = join(raiz, "tests/capturas/seguir"); mkdirSync(cap, { recursive: true });
const browser = await chromium.launch({ channel: "msedge" });
const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await pg.route(/^https?:/, (r) => (/cdn.jsdelivr.net|cdnjs.cloudflare.com/.test(r.request().url()) ? r.continue() : r.abort()));
const erros = []; pg.on("pageerror", (e) => { const s = String(e); if (!/Fetch API cannot load file:/.test(s)) erros.push(s); });
let falhas = 0; const ok = (c, msg) => { console.log((c ? "✓ " : "✗ ") + msg); if (!c) falhas++; };
await pg.goto(pathToFileURL(join(raiz, "dist/index.html")).href); await pg.waitForTimeout(800);
const { abre, livre, vaiPara, em, toca, ferr, seguir } = ajudas(pg);

// onde estão os pés no momento s (px da imagem «mundo»): câmara a 150 px/s; amarelo da esquerda para a direita, branco ao contrário
const CAM = (s) => [200 + 150 * s, 100];
const AM = (s) => [700 + 260 * s, 560 + 50 * s], BR = (s) => [1200 + 40 * s, 600 - 30 * s];
const TAPA = [2.0, 2.7];   // o amarelo não se vê (tapado)
const ecr = (P, s) => [(P(s)[0] - CAM(s)[0]) / 1280, (P(s)[1] - CAM(s)[1]) / 720];
const b64 = await pg.evaluate(async (src) => { const CAM = eval(src.CAM), AM = eval(src.AM), BR = eval(src.BR), TAPA = src.TAPA;
  if (!window.Mp4Muxer) await carregaScript(VD_MUXER);
  let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const T = document.createElement("canvas"); T.width = 3400; T.height = 1000; const t = T.getContext("2d");
  t.fillStyle = "#3d7a35"; t.fillRect(0, 0, 3400, 1000);
  for (let x = 0; x < 3400; x += 160) { t.fillStyle = x / 160 % 2 ? "#437f3a" : "#3a7433"; t.fillRect(x, 200, 160, 800); }
  for (let i = 0; i < 31; i++) { t.fillStyle = `hsl(${Math.floor(rnd() * 360)},70%,${40 + rnd() * 30}%)`; t.fillRect(i * 110, 140, 100, 50); }
  t.strokeStyle = "#f4f4f4"; t.lineWidth = 5; t.beginPath(); t.moveTo(0, 260); t.lineTo(3400, 260); t.moveTo(1700, 260); t.lineTo(1700, 1000); t.stroke(); t.beginPath(); t.arc(1700, 600, 150, 0, 7); t.stroke();
  const jog = (c, x, y, cor, f) => { const p = f % 4 < 2 ? 3 : -3; c.fillStyle = "#222"; c.fillRect(x - 7 + p, y - 22, 6, 22); c.fillRect(x + 1 - p, y - 22, 6, 22);
    c.fillStyle = "#111"; c.fillRect(x - 10, y - 34, 20, 13); c.fillStyle = cor; c.fillRect(x - 11, y - 62, 22, 29); c.fillStyle = "#d9a07a"; c.beginPath(); c.arc(x, y - 70, 8, 0, 7); c.fill(); };
  const W = 1280, H = 720, fps = 25, n = 5 * fps, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const c = cv.getContext("2d");
  const mux = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H }, fastStart: "in-memory" });
  const enc = new VideoEncoder({ output: (k, m) => mux.addVideoChunk(k, m), error: (e) => { throw e; } });
  enc.configure({ codec: "avc1.42e028", width: W, height: H, bitrate: 4e6, framerate: fps });
  for (let i = 0; i < n; i++) { const s = i / fps, [cx, cy] = CAM(s); c.drawImage(T, -cx, -cy);
    const a = AM(s), b = BR(s); jog(c, b[0] - cx, b[1] - cy, "#f2f2f2", i); if (!(s >= TAPA[0] && s < TAPA[1])) jog(c, a[0] - cx, a[1] - cy, "#ffd400", i);
    c.fillStyle = "#123"; c.fillRect(30, 20, 360, 56); c.fillStyle = "#fff"; c.font = "bold 30px sans-serif"; c.fillText("SCA 0 | 0 EST", 44, 58);
    const f = new VideoFrame(cv, { timestamp: Math.round(s * 1e6), duration: 40000 }); enc.encode(f, { keyFrame: i % 50 === 0 }); f.close(); }
  await enc.flush(); mux.finalize(); const u = new Uint8Array(mux.target.buffer); let r = ""; for (let i = 0; i < u.length; i += 32768) r += String.fromCharCode(...u.subarray(i, i + 32768)); return btoa(r); },
  { CAM: CAM.toString(), AM: AM.toString(), BR: BR.toString(), TAPA });

await pg.click("#tab-a"); await pg.click("#av-vid"); await pg.waitForTimeout(150);
await abre({ name: "seguir-sintetico.mp4", mimeType: "video/mp4", buffer: Buffer.from(b64, "base64") });
const sem = () => pg.evaluate(() => { imEd.sel = -1; imDesenha(); imPainel(); });
// paragem de 1 s aos 2 s, com uma marca
await vaiPara(2); await pg.click("#vt-para"); await livre(); await sem(); await pg.locator("#vf-dur").fill("1"); await pg.locator("#vf-dur").dispatchEvent("input");
await pg.click("#ie-ferr [data-mais]"); await ferr("marca"); await toca(await em(.15, .3)); await pg.click("#ie-ferr [data-mais]"); await pg.waitForTimeout(600);
// aos 0,5 s: círculo nos pés do amarelo e ligação amarelo–branco
const T0 = 0.5; await vaiPara(T0); const a0 = ecr(AM, T0), b0 = ecr(BR, T0);
await ferr("circ"); await toca(await em(...a0));
await ferr("lig"); for (const q of [a0, b0]) await toca(await em(...q)); await toca(await em(...b0)); await pg.waitForTimeout(600);
ok(await pg.evaluate(() => imEd.I.pecas.map((p) => p.t).sort().join() === "circ,lig"), "círculo nos pés do amarelo e ligação amarelo–branco");
await sem(); const t0 = Date.now(); await seguir("#vf-segT"); const seg = (Date.now() - t0) / 1000;
const per = await pg.evaluate(() => ({ n: vdEd.des.perdidos.length, t: vdEd.des.perdidos.map((a) => a.t), k: vdEd.des.perdidos.map((a) => a.k), aviso: !$("vt-aviso").hidden && /toca nos pés/.test($("vt-aviso").textContent), marca: document.querySelectorAll("#vt-marcas .vt-perdi").length }));
ok(per.n === 2 && per.t.every((t) => t >= 1.8 && t <= 2.5) && per.aviso && per.marca === 2, `o amarelo desaparece aos 2 s: perdido (círculo e ponta da ligação), com aviso e ⚠ na barra (${seg.toFixed(1)} s a seguir) ` + JSON.stringify(per));
const pos = (t) => pg.evaluate((t) => { const P = vdEd.V.pausas[0], ps = vdPecasVer(P, t); const c = ps.find((p) => p.t === "circ"), l = ps.find((p) => p.t === "lig"); return [c.x, c.y, l.pts[0], l.pts[1]]; }, t);
const erro = (A, B) => Math.hypot(A[0] - B[0], (A[1] - B[1]) * 720 / 1280);
{ let pior = 0; for (const t of [1, 1.5, 1.8]) { const [cx, cy, la, lb] = await pos(t); pior = Math.max(pior, erro([cx, cy], ecr(AM, t)), erro(la, ecr(AM, t)), erro(lb, ecr(BR, t))); }
  const lb4 = (await pos(4.4))[3];
  ok(pior < .012 && erro(lb4, ecr(BR, 4.4)) < .012, `antes de o perder segue os dois (maior erro ${(pior * 1280).toFixed(0)} px em 1280) e o branco continua até ao fim`); }
// voltar a encontrá-lo: aos 3 s já se vê; tocar nos pés dele (duas vezes: o círculo e a ponta da ligação)
await pg.click("#vt-ir"); await livre(); await vaiPara(3);
await toca(await em(...ecr(AM, 3))); await pg.waitForTimeout(400); await livre(); await pg.waitForTimeout(400); await livre();
const p1 = await pg.evaluate(() => vdEd.des.perdidos.length);
await toca(await em(...ecr(AM, 3))); await pg.waitForTimeout(400); await livre(); await pg.waitForTimeout(400); await livre();
const p2 = await pg.evaluate(() => ({ n: vdEd.des.perdidos.length, aviso: !$("vt-aviso").hidden }));
{ let pior = 0; for (const t of [3.2, 3.8, 4.4]) { const [cx, cy, la] = await pos(t); pior = Math.max(pior, erro([cx, cy], ecr(AM, t)), erro(la, ecr(AM, t))); }
  ok(p1 === 1 && p2.n === 0 && !p2.aviso && pior < .012, `tocar nele aos 3 s: volta a segui-lo (círculo e ligação) até ao fim, maior erro ${(pior * 1280).toFixed(0)} px; o aviso desaparece ` + JSON.stringify({ p1, p2 })); }
await pg.screenshot({ path: join(cap, "reencontrado-3s.png") });
// desenho geral aos 2 s: a marca da paragem e o círculo e a ligação que vêm de trás
await vaiPara(2);
ok(await pg.evaluate(() => imEd.I.pecas.map((p) => p.t).sort().join() === "circ,lig,marca"), "aos 2 s vê-se tudo: a marca da paragem e o círculo e a ligação que vêm de trás");
// vídeo final: 5 s + 1 s parado; o anel amarelo nos pés do amarelo na paragem e depois de o reencontrar
await pg.evaluate(() => { window.claude = { use: async (n) => n === "assets" ? { upload: async (b) => { window.__mp4 = b; return { id: "vdteste" + Math.random().toString(36).slice(2, 10), url: URL.createObjectURL(b) }; }, delete: async () => ({}) }
  : n === "downloads" ? { save: async () => {} } : null }; xAssets = undefined; });
await pg.click("#vt-grav"); await pg.waitForFunction(() => !document.getElementById("vd-prog") && window.__mp4, null, { timeout: 120000 }); await livre();
const anel = await pg.evaluate(async (alvos) => { const v = document.createElement("video"); v.muted = true; v.src = URL.createObjectURL(window.__mp4); await new Promise((ok) => { v.onloadeddata = ok; });
  const c = document.createElement("canvas"); c.width = 1280; c.height = 720; const x = c.getContext("2d", { willReadFrequently: true }), out = [];
  for (const [tm, fx, fy] of alvos) { await new Promise((ok) => { v.onseeked = ok; v.currentTime = tm; }); x.drawImage(v, 0, 0);
    const cx = Math.round(fx * 1280 + .035 * 1280), cy = Math.round(fy * 720), d = x.getImageData(cx - 8, cy - 6, 16, 12).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] > 160 && d[i + 2] < 100) n++; out.push(n); }
  return { dur: v.duration, n: out }; }, [[1.6, ...ecr(AM, 1.6)], [4.2, ...ecr(AM, 3.2)], [5.4, ...ecr(AM, 4.4)]]);
ok(Math.abs(anel.dur - 6) < .3 && anel.n.every((n) => n >= 4), `MP4 com ${anel.dur.toFixed(2)} s; anel amarelo nos pés do jogador antes de o perder e depois de o reencontrar (píxeis: ${anel.n})`);
await pg.click("#ie-ok"); await pg.waitForTimeout(300);

// clip real (capturas para ver): o 8 (branco) e um jogador de amarelo, aos 36 s, durante 3 s
if (existsSync(clip)) {
  await pg.evaluate(() => { Object.keys(videos).forEach(apagaVideo); renderVideos(); });
  await abre(clip); await vaiPara(36);
  for (const q of [[.742, .861], [.432, .80]]) { await ferr("circ"); await toca(await em(...q)); }
  await sem(); const t1 = Date.now(); await seguir("#vf-segT");
  console.log(`  clip real: seguidos até ${await pg.evaluate(() => vdEd.V.pausas[0].ate)} s, perdidos ${await pg.evaluate(() => vdEd.des.perdidos.length)} · ${((Date.now() - t1) / 1000).toFixed(1)} s`);
  await pg.screenshot({ path: join(cap, "real-0.png") });
  for (let s = 1; s <= 3; s++) { await vaiPara(36 + s); await pg.screenshot({ path: join(cap, `real-${s}.png`) }); }
  await pg.click("#ie-ok");
}
await browser.close();
if (erros.length) { console.log("✗ erros de JavaScript: " + erros.join(" | ")); falhas++; }
console.log(falhas ? `FALHOU (${falhas})` : "OK · Vídeos: seguir o jogador sozinho e reencontrá-lo (Edge)"); process.exit(falhas ? 1 : 0);
