// Teste de tiraFundo (emblemas sem fundo): fundo liso some, branco dentro do símbolo fica, corte à volta.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const src = readFileSync(new URL("../src/js/exercicios.js", import.meta.url), "utf8");
const fn = src.slice(src.indexOf("function tiraFundo("), src.indexOf("const ERR_ASSETS"));
const b = await chromium.launch(); const p = await b.newPage();
await p.addScriptTag({ content: fn });
const r = await p.evaluate(`(()=>{
  const out={};
  for(const fundo of ["#ffffff","#003f82"]){
    const cv=document.createElement("canvas"); cv.width=200; cv.height=160; const c=cv.getContext("2d");
    c.fillStyle=fundo; c.fillRect(0,0,200,160);
    c.fillStyle="#c00000"; c.beginPath(); c.arc(100,80,50,0,7); c.fill();          // símbolo vermelho
    c.fillStyle="#ffffff"; c.beginPath(); c.arc(100,80,20,0,7); c.fill();          // branco dentro do símbolo
    const o=tiraFundo(cv), d=o.getContext("2d").getImageData(0,0,o.width,o.height).data, a=(x,y)=>d[(y*o.width+x)*4+3];
    out[fundo]={w:o.width,h:o.height,canto:a(0,0),centro:a(o.width>>1,o.height>>1),anel:a((o.width>>1)+35,o.height>>1)};
  }
  const t=document.createElement("canvas"); t.width=50; t.height=50; t.getContext("2d").fillRect(10,10,30,30);   // já transparente
  const ot=tiraFundo(t); out.transp={w:ot.width,h:ot.height};
  return out; })()`);
await b.close();
const ok = (c, m) => { if (!c) { console.error("FALHOU:", m, JSON.stringify(r)); process.exit(1); } };
ok(r["#ffffff"].canto === 0 && r["#ffffff"].anel === 255, "fundo branco tirado, símbolo fica");
ok(r["#ffffff"].centro === 255, "branco dentro do símbolo não se apaga (fundo branco)");
ok(r["#003f82"].canto === 0 && r["#003f82"].centro === 255, "fundo azul tirado, branco interior fica");
ok(Math.abs(r["#ffffff"].w - 100) <= 4 && Math.abs(r["#ffffff"].h - 100) <= 4, "corte à volta do símbolo");
ok(r.transp.w === 30 && r.transp.h === 30, "PNG já transparente: só corta");
console.log("tira-fundo OK", JSON.stringify(r));
