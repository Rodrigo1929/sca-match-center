// Ajudas comuns aos testes dos vídeos (v122: ecrã único — vídeo por baixo do desenho, barra do tempo em baixo).
export function ajudas(pg) {
  const abre = async (ficheiro) => { await pg.setInputFiles("#vd-file", ficheiro);
    await pg.waitForFunction(() => vdEd && vdEd.des && document.querySelector("#imed-root .imed-svg") && document.querySelector("#imed-root .imed-svg").getBoundingClientRect().width > 100, null, { timeout: 30000 });
    await pg.waitForTimeout(400); };
  const livre = () => pg.waitForFunction(() => vdEd && vdEd.des && !vdEd.des.ocup, null, { timeout: 180000 });
  const vaiPara = async (t) => { await livre(); await pg.evaluate((t) => { const e = $("vt-pos"); e.value = t; e.dispatchEvent(new Event("change")); }, t);
    await pg.waitForFunction((t) => vdEd.des && Math.abs(vdEd.des.t - t) < .02 && !vdEd.des.ocup, t, { timeout: 60000 }); await pg.waitForTimeout(150); };
  const em = async (fx, fy) => { const b = await pg.locator("#imed-root .imed-svg").boundingBox(), I = await pg.evaluate(() => ({ w: imEd.I.img.w, h: imEd.I.img.h }));
    const k = Math.min(b.width / I.w, b.height / I.h), ox = b.x + (b.width - I.w * k) / 2, oy = b.y + (b.height - I.h * k) / 2; return { x: ox + fx * I.w * k, y: oy + fy * I.h * k }; };
  const toca = async (p) => { await pg.mouse.click(p.x, p.y); await pg.waitForTimeout(100); };
  const arrasta = async (a, b) => { await pg.mouse.move(a.x, a.y); await pg.mouse.down(); for (let i = 1; i <= 8; i++) await pg.mouse.move(a.x + (b.x - a.x) * i / 8, a.y + (b.y - a.y) * i / 8); await pg.mouse.up(); await pg.waitForTimeout(150); };
  const ferr = (f) => pg.click(`#ie-ferr [data-f="${f}"]`);
  const passo = async (d) => { await livre(); const t0 = await pg.evaluate(() => vdEd.des.t); await pg.click(`#ie-tempo [data-d="${d}"]`); await pg.waitForFunction((t) => Math.abs(vdEd.des.t - t) < .02 && !vdEd.des.ocup, Math.round((t0 + d) * 100) / 100, { timeout: 60000 }); await pg.waitForTimeout(150); };
  const seguir = async (sel) => { await livre(); await pg.click(sel); await pg.waitForTimeout(300); await livre(); await pg.waitForTimeout(300); };
  const pausas = () => pg.evaluate(() => vdEd.V.pausas.map((p) => ({ t: p.t, dur: p.dur, ate: p.ate, pecas: p.pecas.map((x) => x.t).join() })));
  return { abre, livre, vaiPara, em, toca, arrasta, ferr, passo, seguir, pausas };
}
