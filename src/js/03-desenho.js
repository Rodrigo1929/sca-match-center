/* ---------- desenho ---------- */
const NS="http://www.w3.org/2000/svg";
/* imagens embutidas na página (data:) — o iPad/iOS não carrega <image> do SVG por caminho ou blob dentro da moldura do artefacto */
const IMG_DATA={{IMG_DATA}}; const IMG_URL=IMG_DATA;
function preCarregaImagens(){}
function el(tag,attrs={},parent){ const e=document.createElementNS(NS,tag); for(const k in attrs){ let v=attrs[k]; if(k==="href"&&tag==="image"&&IMG_URL[v]) v=IMG_URL[v]; e.setAttribute(k,v); if(k==="href"&&tag==="image") e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",v); } if(parent) parent.appendChild(e); return e; }
let mctx=null;
/* v112: a letra dos quadros (Roboto Condensed) vem embutida na página ("RC Quadro"): sem internet (banco, iPad) o Safari usava o Arial,
   mais largo, e as legendas saíam da caixa. Quando a letra acaba de carregar, o quadro volta a desenhar-se com as medidas certas. */
let rcPronta=false;
(function(){ try{ if(!window.FontFace) return; const ps=[["400","fonts/rc-400.ttf"],["700","fonts/rc-700.ttf"]].filter(([,f])=>IMG_DATA[f]).map(([w,f])=>new FontFace("RC Quadro",`url(${IMG_DATA[f]})`,{weight:w}).load().then(x=>{ document.fonts.add(x); }));
  Promise.all(ps).then(()=>{ rcPronta=true; mctx=null; try{ if(typeof render==="function"&&$("view-q")&&!$("view-q").hidden) render(); }catch(e){} }).catch(()=>{}); }catch(e){} })();
const FONTE_Q=`"RC Quadro","Roboto Condensed","Arial Narrow",Arial,sans-serif`;
function textW(t,px,w){ mctx=mctx||document.createElement("canvas").getContext("2d"); mctx.font=`${w} ${px}px ${FONTE_Q}`; return mctx.measureText(t).width; }
/* legendas e caixas de texto sempre dentro do slide (margem pequena) */
const MARG_Q=500, dentroQ=(x,w,lim)=>Math.max(MARG_Q,Math.min(x,lim-w-MARG_Q));
function svgPt(svg,e){ const p=svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
function titulo(svg,L){
  const pre=L.tipo==="DEF"?"Esquema Tático Defensivo – ":L.tipo==="OF"?"Esquema Tático Ofensivo – ":"";
  const pos_=L.tipo==="JOGO"&&jogo.adversario?" · vs "+jogo.adversario:"";
  const fs=30*PT, t=el("text",{x:9300,y:6050,"font-size":fs,"font-weight":700,class:"legtxt"},svg);
  el("tspan",{fill:"#000"},t).textContent=pre; el("tspan",{fill:L.tipo==="JOGO"?"#000":"#C00000"},t).textContent=L.nome;
  if(pos_) el("tspan",{fill:"#C00000"},t).textContent=pos_;
  const need=textW(pre+L.nome+pos_,fs,700), avail=71000;
  if(need>avail){ t.setAttribute("textLength",avail); t.setAttribute("lengthAdjust","spacingAndGlyphs"); }
}
function desenha(L,opts={}){
  if(L.dinamico==="onze") return desenhaOnze({clean:opts.clean,arrastar:opts.arrastar,quadro:true});
  if(L.dinamico==="encaixe") return desenhaEncaixe({clean:opts.clean,arrastar:opts.arrastar});
  if(L.dinamico==="notas") return desenhaNotasJogo(opts);
  if(L.dinamico==="estat") return desenhaEstat(opts);
  const svg=el("svg",{viewBox:`0 0 ${W} ${H}`,role:"img","aria-label":`Esquema ${L.nome}`});
  const f=el("filter",{id:"sh",x:"-5%",y:"-10%",width:"110%",height:"140%"},el("defs",{},svg));
  el("feDropShadow",{dx:0,dy:300,stdDeviation:220,"flood-opacity":".35"},f);
  if(L.fundo==="pitch-setores") campoSetores(svg); else if(L.fundo==="pitch-espacos"){ campo(svg,true,FUNDOS[L.fundo].campo); gridSetores(svg,FUNDOS[L.fundo].campo,9*PT); legendaEspacos(svg); } else if(L.fundo==="pitch"||L.fundo==="pitch-full") campo(svg,L.semCabecalho,FUNDOS[L.fundo].campo); else el("image",{href:`slides/${L.fundo}.jpg`,x:0,y:0,width:W,height:H,preserveAspectRatio:"none"},svg);
  if(L.espacos) desenhaEspacos(svg,L.adv);
  if(L.titulo) titulo(svg,L);
  (L.textos||[]).forEach((T,ti)=>desenhaTexto(svg,L,T,ti,opts));
  const {v,base:bv,dups}=calcula(L); cartoesCache=cartoes(); dupsAtual=dups||[];
  L.legs.forEach((G,gi)=>{
    const g=el("g",{class:"leg"},svg);
    const w=Math.min(G.w,W-2*MARG_Q), h=Math.min(G.h,H-2*MARG_Q), x=dentroQ(G.x,w,W), y=dentroQ(G.y,h,H), fs=(G.fs||18)*PT, ins=914, num=v[G.slot]??G.slot;
    const mod=num!==(bv[G.slot]??baseOf(G.slot))&&!opts.clean;
    el("rect",{x,y,width:w,height:h,fill:"#fff",stroke:"#111","stroke-width":200,filter:"url(#sh)"},g);
    const cellW=textW("88",fs,700)+fs*.15;
    if(mod) el("rect",{x:x+ins*.45,y:y+h*.14,width:cellW+ins*.5,height:h*.72,rx:120,fill:"#F4E7C4"},g);
    const base=y+h/2+fs*.36;
    el("text",{x:x+ins+cellW/2,y:base,"text-anchor":"middle","font-size":fs,"font-weight":700,fill:"#C00000",class:"legtxt"},g).textContent=num;
    const rx=x+ins+cellW+fs*.12;
    const t=el("text",{x:rx,y:base,"font-size":fs,class:"legtxt"},g);   // a letra da tarefa diminui se não couber (v112)
    el("tspan",{"font-weight":700,fill:"#000"},t).textContent="- ";
    let full="- ";
    const parts=(G.parts||[]).filter(p=>p.t);
    if(!parts.length && editing && !opts.clean){ el("tspan",{fill:"#9A958B","font-style":"italic"},t).textContent="tarefa…"; }
    parts.forEach(p=>{ el("tspan",{fill:p.c||"#000","font-weight":p.b?700:400},t).textContent=p.t; full+=p.t; });
    const avail=x+w-ins*.8-rx, larg=f=>(textW("- ",f,700)+parts.reduce((a,p)=>a+textW(p.t,f,p.b?700:400),0))*1.03;
    if(larg(fs)>avail){ const f2=Math.max(fs*.75,fs*avail/larg(fs)); t.setAttribute("font-size",f2); t.setAttribute("y",y+h/2+f2*.36);
      if(larg(f2)>avail){ t.setAttribute("textLength",avail); t.setAttribute("lengthAdjust","spacingAndGlyphs"); } }
    if(!opts.clean) liga(g,svg,L,"legs",gi);
    if(editing&&!opts.clean){ const xg=el("g",{style:"cursor:pointer"},svg);
      el("circle",{cx:x+w,cy:y,r:720,fill:"#C00000",stroke:"#fff","stroke-width":150},xg);
      el("path",{d:`M ${x+w-280} ${y-280} L ${x+w+280} ${y+280} M ${x+w+280} ${y-280} L ${x+w-280} ${y+280}`,stroke:"#fff","stroke-width":170,"stroke-linecap":"round"},xg);
      xg.addEventListener("touchstart",e=>e.preventDefault(),{passive:false});
      xg.addEventListener("pointerdown",e=>{ e.preventDefault(); e.stopPropagation(); });
      xg.addEventListener("pointerup",e=>{ e.stopPropagation(); const C=clone(L); C.legs.splice(gi,1); guardaLance(C); toast("Legenda apagada",()=>guardaLance(L)); }); }
  });
  desenhaFormas(svg,L,opts);
  (L.adv||[]).forEach((A,ai)=>{ if(A.luz) desenhaLuz(svg,A.cx,A.cy,A.r,A.luz,opts,"a"+ai); });
  (L.adv||[]).forEach((A,ai)=>{ const g=el("g",{class:"bola"},svg);
    el("circle",{cx:A.cx,cy:A.cy,r:A.r*1.6,fill:"transparent"},g);
    el("circle",{cx:A.cx,cy:A.cy,r:A.r,fill:A.fill||"#0070C0","fill-opacity":A.fa??1,stroke:A.stroke||"none","stroke-width":A.sw||95},g);
    if(!opts.clean||opts.arrastar) liga(g,svg,L,"adv",ai,null,opts); });
  (L.bj||[]).forEach((B,ki)=>{ const g=el("g",{class:"bola bj","aria-label":"Bola"},svg); const rr=B.r||1000;
    el("circle",{cx:B.cx,cy:B.cy,r:rr*1.8,fill:"transparent"},g);
    el("image",{href:"slides/bola.png",x:B.cx-rr,y:B.cy-rr,width:rr*2,height:rr*2},g);
    if(!opts.clean||opts.arrastar) liga(g,svg,L,"bj",ki,null,opts); });
  desenhaSetas(svg,L,opts);
  L.bolas.forEach((B,bi)=>{ if(B.luz) desenhaLuz(svg,B.cx,B.cy,B.r,B.luz,opts,bi); });
  L.bolas.forEach((B,bi)=>{
    const num=v[B.slot]??B.slot, mod=num!==(bv[B.slot]??baseOf(B.slot))&&!opts.clean;
    const g=el("g",{class:"bola",tabindex:opts.clean?-1:0,role:opts.clean?"presentation":"button","aria-label":`Jogador ${num}`},svg);
    el("circle",{cx:B.cx,cy:B.cy,r:B.r*1.7,fill:"transparent"},g);
    el("circle",{cx:B.cx,cy:B.cy,r:B.r*1.24,fill:"none",stroke:mod?"#C99A2E":"transparent","stroke-width":mod?260:0},g);
    el("circle",{cx:B.cx,cy:B.cy,r:B.r,fill:B.fill||"#C00000",stroke:B.stroke||"none","stroke-width":B.sw||94},g);
    const lbl=(posOn&&L.livre&&posOf(B.slot))||num, fs=(B.fs||12)*PT*(lbl.length>3?.64:lbl.length>2?.82:1);
    el("text",{x:B.cx,y:B.cy+fs*.35,"text-anchor":"middle","font-size":fs,fill:B.color||"#fff",class:"num"},g).textContent=lbl;
    if(nomesOn&&nome(num)) etiqueta(g,B.cx,B.cy+B.r+180,nome(num),8*PT);
    { const c=cartoesCache[num]; if(c&&(c.am||c.verm)){ el("rect",{x:B.cx+B.r*.45,y:B.cy-B.r*1.25,width:B.r*.62,height:B.r*.86,rx:B.r*.1,fill:c.verm?"#E00000":"#FFD54A",stroke:"#000","stroke-width":70,transform:`rotate(12 ${B.cx+B.r*.76} ${B.cy-B.r*.82})`},g); } }
    if(!opts.clean&&dupsAtual.includes(num)&&!eAlternativa(B)){ el("circle",{cx:B.cx,cy:B.cy,r:B.r*1.42,fill:"none",stroke:"#FF8A00","stroke-width":240,"stroke-dasharray":"420 260","pointer-events":"none"},g); }
    if(!opts.clean||opts.arrastar) liga(g,svg,L,"bolas",bi,num,opts);
  });
  if(L.notas) desenhaNotas(svg,L,opts);
  logo(svg,L);
  if(editing&&modoSeta&&!opts.clean) overlaySeta(svg,L);
  return svg;
}
function linhasTexto(T){
  const iw=T.wrap===false?1e9:T.w-(T.ins?.[0]??914)-(T.ins?.[2]??914);
  const out=[]; let num=0;
  (T.paras||[]).forEach(P=>{
    if(P.bu==="num") num++; else num=0;
    const runs=(P.runs||[]).map(r=>({...r}));
    if(runs.length&&P.bu){ const f=runs[0]; runs.unshift({...f,t:P.bu==="num"?num+".  ":(P.buc||"•")+"  "}); }
    let line=[], lw=0;
    const push=()=>{ while(line.length&&/^\s+$/.test(line[line.length-1].t)) line.pop(); const mh=Math.max(...(line.length?line.map(x=>x.sz):[P.sz||18])); out.push({al:P.al||"l",segs:line,h:mh*PT*1.2,sz:mh}); line=[]; lw=0; };
    if(!runs.length||runs.every(r=>!r.t)){ out.push({al:P.al||"l",segs:[],h:(P.sz||18)*PT*1.2,sz:P.sz||18}); return; }
    runs.forEach(r=>{ String(r.t).split(/(\n|\s+)/).forEach(tok=>{ if(!tok) return;
      if(tok==="\n"){ push(); return; }
      const tw=textW(tok,r.sz*PT,r.b?700:400);
      if(lw+tw>iw&&line.length&&!/^\s+$/.test(tok)){ push(); }
      if(!line.length&&/^\s+$/.test(tok)) return;
      line.push({...r,t:tok}); lw+=tw; }); });
    push();
  });
  return out;
}
function desenhaTexto(svg,L,T,ti,opts){
  const g=el("g",{class:"leg"},svg);
  /* v112: a caixa fica dentro do slide; se o texto não cabe na altura da caixa, a letra diminui ligeiramente (até ~85%) antes de a caixa crescer */
  { const w=Math.min(T.w,W-2*MARG_Q), x=T.rot?T.x:dentroQ(T.x,w,W), y=T.rot?T.y:dentroQ(T.y,Math.min(T.h,H-2*MARG_Q),H); if(w!==T.w||x!==T.x||y!==T.y) T={...T,x,y,w}; }
  { const ins0=T.ins||[914,457,914,457], cabe=T.h-ins0[1]-ins0[3], alt=X=>linhasTexto(X).reduce((a,l)=>a+l.h,0);
    if(cabe>0&&alt(T)>cabe){ let k=1, X=T; while(k>.86&&alt(X)>cabe){ k-=.03; X={...T,paras:(T.paras||[]).map(P=>({...P,sz:(P.sz||18)*k,runs:(P.runs||[]).map(r=>({...r,sz:(r.sz||P.sz||18)*k}))}))}; } T=X; } }
  if(T.rot) g.setAttribute("transform",`rotate(${T.rot} ${T.x+T.w/2} ${T.y+T.h/2})`);
  const ls=linhasTexto(T), tot=ls.reduce((a,l)=>a+l.h,0), ins=T.ins||[914,457,914,457];
  const h=Math.max(T.h,tot+ins[1]+ins[3]);
  if(T.fill||T.stroke) el("rect",{x:T.x,y:T.y,width:T.w,height:h,fill:T.fill||"none","fill-opacity":T.fa??1,stroke:T.stroke||"none","stroke-width":T.sw||0,...(T.dash?{"stroke-dasharray":`${(T.sw||95)*4} ${(T.sw||95)*3}`}:{})},g);
  if(editing&&!opts.clean) el("rect",{x:T.x,y:T.y,width:T.w,height:h,fill:T.fill?"none":"rgba(184,150,63,.08)",stroke:"#B8963F","stroke-width":60,"stroke-dasharray":"300 200"},g);
  let y=T.anchor==="ctr"?T.y+(h-tot)/2:T.anchor==="b"?T.y+h-ins[3]-tot:T.y+ins[1];
  ls.forEach(l=>{ const base=y+l.sz*PT*0.95;
    const x=l.al==="ctr"?T.x+T.w/2:l.al==="r"?T.x+T.w-ins[2]:T.x+ins[0];
    const t=el("text",{x,y:base,"text-anchor":l.al==="ctr"?"middle":l.al==="r"?"end":"start",class:"legtxt"},g);
    l.segs.forEach(sg=>{ const sp=el("tspan",{"font-size":sg.sz*PT,"font-weight":sg.b?700:400,fill:sg.c||"#000",...(sg.i?{"font-style":"italic"}:{})},t); sp.textContent=sg.t; });
    y+=l.h; });
  if(editing&&!opts.clean){ liga(g,svg,L,"textos",ti);
    /* v112.21: pegas nos cantos e lados (como no Word): o texto volta a partir as linhas enquanto se arrasta */
    if(!T.rot){ const T0=L.textos[ti]; let prev=null, pg=null;
      pg=pegasCaixa(svg,{x:T.x,y:T.y,w:T.w,h},nb=>{ g.style.display="none"; if(prev) prev.remove(); prev=desenhaTexto(svg,L,{...T0,...nb},ti,{clean:true});
          el("rect",{x:nb.x,y:nb.y,width:nb.w,height:nb.h,fill:"none",stroke:"#B8963F","stroke-width":60,"stroke-dasharray":"300 200"},prev); svg.appendChild(pg); },
        nb=>{ const C=clone(L); Object.assign(C.textos[ti],nb); guardaLance(C); }); } }
  else g.style.pointerEvents="none";
  return g;
}
const CORES_TXT=["#000000","#C00000","#1F497D","#00B0F0","#F79646","#FFFFFF"];
function hexCor(c){ const m=String(c).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); if(!m) return /^#[0-9a-f]{6}$/i.test(c)?c.toUpperCase():"#000000"; return "#"+[m[1],m[2],m[3]].map(v=>(+v).toString(16).padStart(2,"0")).join("").toUpperCase(); }
function textoParaHtml(T){ return (T.paras||[]).map(P=>`<div>${(P.runs||[]).length?(P.runs||[]).map(R=>`<span data-sz="${R.sz||P.sz||18}" style="color:${R.c||"#000"};font-weight:${R.b?700:400};font-style:${R.i?"italic":"normal"}">${esc(R.t)}</span>`).join(""):"<br>"}</div>`).join(""); }
function htmlParaParas(root,old,r0){
  const paras=[]; let cur=[];
  const fecha=()=>{ paras.push(cur); cur=[]; };
  const run=(txt,el)=>{ if(!txt) return; const cs=getComputedStyle(el); const szEl=el.closest("[data-sz]");
    cur.push({t:txt,c:hexCor(cs.color),b:(parseInt(cs.fontWeight)||400)>=600,i:cs.fontStyle==="italic",sz:szEl?+szEl.dataset.sz:null}); };
  const anda=(n,blocoRaiz)=>{ n.childNodes.forEach(c=>{
    if(c.nodeType===3) run(c.nodeValue.replace(/ /g," "),c.parentElement);
    else if(c.nodeName==="BR") fecha();
    else if(c.nodeType===1){ const bloco=/^(DIV|P|LI)$/.test(c.nodeName); if(bloco&&cur.length) fecha(); anda(c,false); if(bloco) fecha(); } }); };
  anda(root,true); if(cur.length) fecha();
  while(paras.length>1&&!paras[paras.length-1].length) paras.pop();
  return paras.map((runs,k)=>{ const P=old[Math.min(k,old.length-1)]||{al:"l",sz:r0.sz||18}; const psz=P.sz||r0.sz||18;
    const m=[]; runs.forEach(R=>{ R.sz=R.sz||psz; const u=m[m.length-1]; if(u&&u.c===R.c&&u.b===R.b&&u.i===R.i&&u.sz===R.sz) u.t+=R.t; else m.push(R); });
    return {al:P.al||"l",bu:P.bu||null,buc:P.buc||null,sz:psz,runs:m}; }); }
function folhaTexto(L,i){
  const T=L.textos[i];
  const r0=(T.paras?.[0]?.runs?.[0])||{c:"#000000",b:true,sz:18};
  folha(`<h3>Texto</h3><p class="sub" style="margin:0">Seleciona as palavras e escolhe a cor ou o negrito. Sem nada selecionado, aplica a todo o texto. O tamanho da caixa muda-se no quadro, arrastando as pegas brancas.</p>
    <div id="tx-ed" contenteditable="true" spellcheck="false" style="border:1px solid var(--line);border-radius:8px;padding:10px 12px;min-height:120px;max-height:40vh;overflow:auto;background:#E9E6DE;font-family:var(--f-display);font-size:17px;line-height:1.35;outline-color:var(--gold)"></div>
    <h4>Cor</h4><div class="styles" id="tx-c"></div>
    <h4>Formato</h4><div class="styles" id="tx-o"></div>
    <div class="actions"><button class="btn danger l" id="tx-del">Apagar texto</button><button class="btn" data-close>Cancelar</button><button class="btn primary" id="tx-ok">Guardar</button></div>`,(s,fecha)=>{
    const ed=s.querySelector("#tx-ed"); ed.innerHTML=textoParaHtml(T)||"<div><br></div>";
    let dsz=0, fundo=null, selGuardada=null;
    const temSel=()=>{ const sl=getSelection(); return sl&&sl.rangeCount&&!sl.isCollapsed&&ed.contains(sl.getRangeAt(0).commonAncestorContainer); };
    document.addEventListener("selectionchange",()=>{ if(ed.isConnected&&temSel()) selGuardada=getSelection().getRangeAt(0).cloneRange(); });
    ed.addEventListener("input",()=>{ selGuardada=null; });
    const aplica=(cmd,val)=>{ ed.focus(); const sl=getSelection();
      if(selGuardada&&!temSel()){ sl.removeAllRanges(); sl.addRange(selGuardada); }
      if(!temSel()){ const rg=document.createRange(); rg.selectNodeContents(ed); sl.removeAllRanges(); sl.addRange(rg); }
      try{ document.execCommand("styleWithCSS",false,true); }catch(e){}
      document.execCommand(cmd,false,val); selGuardada=temSel()?sl.getRangeAt(0).cloneRange():null; };
    CORES_TXT.forEach(c=>{ const b=document.createElement("button"); b.setAttribute("aria-label","Cor "+c); b.innerHTML=`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="${c}" stroke="#999"/></svg>`;
      b.addEventListener("pointerdown",e=>e.preventDefault()); b.onclick=()=>aplica("foreColor",c); s.querySelector("#tx-c").appendChild(b); });
    const ops=[["Negrito",()=>aplica("bold")],["Itálico",()=>aplica("italic")],["A−",()=>dsz-=2],["A+",()=>dsz+=2],["Fundo branco",()=>fundo=fundo===null?!T.fill:!fundo]];
    ops.forEach(([n,f])=>{ const b=document.createElement("button"); b.innerHTML=`<span>${n}</span>`; b.addEventListener("pointerdown",e=>e.preventDefault());
      b.onclick=()=>{ f(); b.setAttribute("aria-pressed","true"); setTimeout(()=>b.setAttribute("aria-pressed","false"),250); }; s.querySelector("#tx-o").appendChild(b); });
    s.querySelector("#tx-ok").onclick=()=>{
      const C=clone(L), X=C.textos[i];
      X.paras=htmlParaParas(ed,X.paras||[],r0);
      X.paras.forEach(P=>{ if(dsz){ P.sz=Math.max(8,(P.sz||18)+dsz); (P.runs||[]).forEach(R=>R.sz=Math.max(8,(R.sz||18)+dsz)); } });
      if(fundo!==null){ X.fill=fundo?"#FFFFFF":null; X.fa=1; }
      guardaLance(C); fecha(); };
    s.querySelector("#tx-del").onclick=()=>{ const C=clone(L); C.textos.splice(i,1); guardaLance(C); fecha(); toast("Texto apagado",()=>guardaLance(L)); };
  });
}
function novoTexto(L){ const C=clone(L); C.textos=[...(C.textos||[]),{x:30000,y:30000,w:26000,h:3700,rot:0,fill:null,fa:1,stroke:null,sw:0,dash:false,ins:[914,457,914,457],anchor:"t",wrap:true,
  paras:[{al:"l",bu:null,buc:null,sz:18,runs:[{t:"Novo texto",c:"#C00000",b:true,i:false,sz:18}]}]}]; guardaLance(C); setTimeout(()=>folhaTexto(lanceAtual(),C.textos.length-1),50); }
function folhaAdv(L,i){
  folha(`<h3>Peça (adversário / zona)</h3><h4>Cor</h4><div class="styles" id="ad-c"></div>
    <h4>Transparência</h4><div class="styles" id="ad-t"></div>
    <h4>Destaque (luz)</h4><div id="ad-luz"></div>
    ${L.espacos?`<h4>Linha do adversário</h4><p class="sub" style="margin:0">Automática = a app escolhe pela posição. Escolhe à mão quando um jogador está entre linhas.</p><div class="styles" id="ad-l"></div>`:""}
    <div class="actions"><button class="btn danger l" id="ad-del">Apagar</button>${L.espacos?`<button class="btn" id="ad-rep">Repor o onze do adversário</button>`:""}<button class="btn" id="ad-dup">Duplicar</button><button class="btn dark" data-close>Fechar</button></div>`,(s,fecha)=>{
    s.querySelector("#ad-luz").appendChild(linhaLuz(L.adv[i].luz,c=>{ const C=clone(L); if(c) C.adv[i].luz=c; else delete C.adv[i].luz; guardaLance(C); fecha(); }));
    [["#0070C0","Azul"],["#000000","Preto"],["#FFFFFF","Branco"],["#70AD47","Verde"]].forEach(([c,n])=>{ const b=document.createElement("button"); b.innerHTML=`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="${c}" stroke="#000"/></svg><span>${n}</span>`;
      b.onclick=()=>{ const C=clone(L); C.adv[i].fill=c; guardaLance(C); fecha(); }; s.querySelector("#ad-c").appendChild(b); });
    [["Opaca",1],["Meio transparente",0.5],["Muito transparente",0.3]].forEach(([n,v])=>{ const b=document.createElement("button"); b.setAttribute("aria-pressed",String((L.adv[i].fa??1)===v)); b.innerHTML=`<span>${n}</span>`;
      b.onclick=()=>{ const C=clone(L); C.adv[i].fa=v; guardaLance(C); fecha(); }; s.querySelector("#ad-t").appendChild(b); });
    if(L.espacos){ const at=L.adv[i].gr?"gr":(L.adv[i].linha||"");
      [["","Automática"],["1","1.ª linha de pressão"],["2","2.ª linha"],["3","Última linha"],["gr","Guarda-redes"]].forEach(([v,n])=>{ const b=document.createElement("button"); b.setAttribute("aria-pressed",String(at===v)); b.innerHTML=`<span>${n}</span>`;
        b.onclick=()=>{ const C=clone(L), x=C.adv[i]; delete x.gr; delete x.linha;
          if(v==="gr") C.adv.forEach(o=>{ delete o.gr; if(o.linha==="gr") delete o.linha; }), x.gr=true; else if(v) x.linha=v;
          guardaLance(C); fecha(); }; s.querySelector("#ad-l").appendChild(b); });
      s.querySelector("#ad-rep").onclick=()=>{ const C=clone(L); C.adv=advEspacos(); guardaLance(C); fecha(); toast("Adversário reposto",()=>guardaLance(L)); }; }
    s.querySelector("#ad-del").onclick=()=>{ const C=clone(L); C.adv.splice(i,1); guardaLance(C); fecha(); toast("Adversário apagado",()=>guardaLance(L)); };
    s.querySelector("#ad-dup").onclick=()=>{ const C=clone(L); const d=clone(C.adv[i]); d.cx+=d.r*3; C.adv.push(d); guardaLance(C); fecha(); };
  });
}
const LUZES=[["Amarelo","#FFE14D"],["Branco","#FFFFFF"],["Vermelho","#FF3B30"],["Azul","#3BA7FF"],["Verde","#39D353"]];
function desenhaLuz(svg,cx,cy,r,cor,opts,bi){ const id="luz"+cor.replace("#",""), defs=svg.querySelector("defs");
  if(!svg.querySelector("#"+id)){ const gr=el("radialGradient",{id},defs); el("stop",{offset:"0%","stop-color":cor,"stop-opacity":.95},gr); el("stop",{offset:"45%","stop-color":cor,"stop-opacity":.55},gr); el("stop",{offset:"100%","stop-color":cor,"stop-opacity":0},gr); }
  const lg=el("g",{class:"luz","data-bi":bi??"","pointer-events":"none"},svg);
  const c=el("circle",{cx,cy,r:r*2.9,fill:`url(#${id})`},lg);
  el("circle",{cx,cy,r:r*1.32,fill:"none",stroke:cor,"stroke-width":Math.max(120,r*.16),"stroke-opacity":.95},lg);
  if(!opts.semAnim) el("animate",{attributeName:"opacity",values:".55;1;.55",dur:"1.8s",repeatCount:"indefinite"},c); }
function linhaLuz(atual,onPick){ const w=document.createElement("div"); w.className="styles";
  [["Sem destaque",null],...LUZES].forEach(([n,c])=>{ const b=document.createElement("button"); b.setAttribute("aria-pressed",String((atual||null)===c));
    b.innerHTML=c?`<svg viewBox="0 0 24 24"><defs><radialGradient id="mg${c.slice(1)}"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs><circle cx="12" cy="12" r="11" fill="url(#mg${c.slice(1)})"/><circle cx="12" cy="12" r="5" fill="#C00000" stroke="#000" stroke-width=".8"/></svg><span>${n}</span>`:`<span>${n}</span>`;
    b.onclick=()=>onPick(c); w.appendChild(b); }); return w; }
/* formas: retângulo, quadrado, círculo */
const CORES_FORMA=["#F79646","#FFC000","#C00000","#1F497D","#00B0F0","#1E7A46","#7030A0","#FFFFFF","#000000"];
function desenhaFormas(svg,L,opts){ (L.formas||[]).forEach((F,fi)=>{ const g=el("g",{class:"forma"},svg);
    const at={fill:F.fill||"#F79646","fill-opacity":F.fa??0.35,stroke:F.stroke||"none","stroke-width":F.stroke?(F.sw||160):0,"stroke-dasharray":F.dash?"500 320":"none"};
    if(F.tipo==="circ") el("ellipse",{cx:F.x+F.w/2,cy:F.y+F.h/2,rx:F.w/2,ry:F.h/2,...at},g);
    else el("rect",{x:F.x,y:F.y,width:F.w,height:F.h,rx:F.rx||0,...at},g);
    if(F.txt){ el("text",{x:F.x+F.w/2,y:F.y+F.h/2+(F.fs||14)*PT*.35,"text-anchor":"middle","font-size":(F.fs||14)*PT,"font-weight":700,fill:F.cortxt||"#FFFFFF",class:"legtxt"},g).textContent=F.txt; }
    if(editing&&!opts.clean){ liga(g,svg,L,"formas",fi);
      const hx=F.x+F.w, hy=F.y+F.h, hd=el("g",{style:"cursor:nwse-resize"},svg);
      el("circle",{cx:hx,cy:hy,r:1300,fill:"transparent"},hd); el("rect",{x:hx-420,y:hy-420,width:840,height:840,rx:120,fill:"#fff",stroke:"#B8963F","stroke-width":160},hd);
      let st=null;
      hd.addEventListener("touchstart",e=>e.preventDefault(),{passive:false});
      hd.addEventListener("pointerdown",e=>{ e.preventDefault(); e.stopPropagation(); hd.setPointerCapture(e.pointerId); st=svgPt(svg,e); dragging=true; });
      hd.addEventListener("pointermove",e=>{ if(!st) return; const p=svgPt(svg,e); let w=Math.max(1200,F.w+p.x-st.x), h=Math.max(1200,F.h+p.y-st.y); if(F.tipo!=="ret"){ const m=Math.max(w,h); w=m; h=m; }
        const sh=g.firstChild; if(sh.tagName==="ellipse"){ sh.setAttribute("cx",F.x+w/2); sh.setAttribute("cy",F.y+h/2); sh.setAttribute("rx",w/2); sh.setAttribute("ry",h/2); } else { sh.setAttribute("width",w); sh.setAttribute("height",h); }
        hd.setAttribute("transform",`translate(${w-F.w} ${h-F.h})`); hd.dataset.w=w; hd.dataset.h=h; });
      const fim=()=>{ if(!st) return; st=null; dragging=false; const w=+hd.dataset.w||F.w, h=+hd.dataset.h||F.h; const C=clone(L); Object.assign(C.formas[fi],{w:Math.round(w),h:Math.round(h)}); guardaLance(C); };
      hd.addEventListener("pointerup",fim); hd.addEventListener("pointercancel",()=>{ st=null; dragging=false; render(); }); } }); }
function novaForma(L,tipo){ const C=clone(L), c=centroCampo(L), w=tipo==="ret"?16000:9000, h=tipo==="ret"?9000:9000;
  C.formas=[...(C.formas||[]),{tipo,x:c.cx-w/2,y:c.cy-h/2,w,h,fill:"#F79646",fa:.35,stroke:"#F79646",sw:160,dash:true}]; guardaLance(C);
  toast(`${tipo==="ret"?"Retângulo":tipo==="quad"?"Quadrado":"Círculo"} ao centro. Arrasta para mover, o quadradinho do canto para mudar o tamanho, toca para cor.`); }
function folhaNovaForma(L){ folha(`<h3>Nova forma</h3><div class="styles" id="nf"></div><div class="actions"><button class="btn" data-close>Cancelar</button></div>`,(s,fecha)=>{
    [["ret","Retângulo",`<rect x="2" y="6" width="20" height="12" rx="1" fill="#F7964655" stroke="#F79646" stroke-width="1.6"/>`],["quad","Quadrado",`<rect x="5" y="5" width="14" height="14" rx="1" fill="#F7964655" stroke="#F79646" stroke-width="1.6"/>`],["circ","Círculo",`<circle cx="12" cy="12" r="8" fill="#F7964655" stroke="#F79646" stroke-width="1.6"/>`]].forEach(([t,n,ic])=>{
      const b=document.createElement("button"); b.innerHTML=`<svg viewBox="0 0 24 24">${ic}</svg><span>${n}</span>`; b.onclick=()=>{ fecha(); novaForma(L,t); }; s.querySelector("#nf").appendChild(b); }); }); }
function folhaForma(L,i){ const F=L.formas[i]; let X={...F};
  folha(`<h3>Forma</h3><h4>Cor</h4><div class="styles" id="fm-c"></div><h4>Preenchimento</h4><div class="styles" id="fm-t"></div><h4>Contorno</h4><div class="styles" id="fm-b"></div>
    <label class="f">Texto dentro (opcional)<input type="text" id="fm-x" placeholder="Ex.: Z1, Zona de pressão"></label>
    <div class="actions"><button class="btn danger l" id="fm-del">Apagar</button><button class="btn" id="fm-dup">Duplicar</button><button class="btn" id="fm-back">Enviar para trás</button><button class="btn primary" id="fm-ok">Guardar</button></div>`,(s,fecha)=>{
    const pinta=()=>{ s.querySelectorAll("#fm-c button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.c===X.fill)));
      s.querySelectorAll("#fm-t button").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.v===(X.fa??.35))));
      s.querySelectorAll("#fm-b button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===(X.stroke?(X.dash?"tr":"cont"):"sem")))); };
    CORES_FORMA.forEach(c=>{ const b=document.createElement("button"); b.dataset.c=c; b.innerHTML=`<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="${c}" stroke="#999"/></svg>`; b.onclick=()=>{ X.fill=c; if(X.stroke) X.stroke=c; pinta(); }; s.querySelector("#fm-c").appendChild(b); });
    [["Vazio",0],["Leve",.2],["Médio",.35],["Forte",.6],["Cheio",1]].forEach(([n,v])=>{ const b=document.createElement("button"); b.dataset.v=v; b.innerHTML=`<span>${n}</span>`; b.onclick=()=>{ X.fa=v; pinta(); }; s.querySelector("#fm-t").appendChild(b); });
    [["Sem","sem"],["Contínuo","cont"],["Tracejado","tr"]].forEach(([n,v])=>{ const b=document.createElement("button"); b.dataset.v=v; b.innerHTML=`<span>${n}</span>`; b.onclick=()=>{ X.stroke=v==="sem"?null:(X.fill==="#FFFFFF"?"#000000":X.fill); X.dash=v==="tr"; X.sw=160; pinta(); }; s.querySelector("#fm-b").appendChild(b); });
    s.querySelector("#fm-x").value=X.txt||""; pinta();
    s.querySelector("#fm-ok").onclick=()=>{ const C=clone(L); X.txt=s.querySelector("#fm-x").value.trim(); if(!X.txt) delete X.txt; X.cortxt=X.fa>=.6&&X.fill!=="#FFFFFF"&&X.fill!=="#FFC000"?"#FFFFFF":"#000000"; C.formas[i]=X; guardaLance(C); fecha(); };
    s.querySelector("#fm-del").onclick=()=>{ const C=clone(L); C.formas.splice(i,1); guardaLance(C); fecha(); toast("Forma apagada",()=>guardaLance(L)); };
    s.querySelector("#fm-dup").onclick=()=>{ const C=clone(L); C.formas.push({...clone(F),x:F.x+1500,y:F.y+1500}); guardaLance(C); fecha(); };
    s.querySelector("#fm-back").onclick=()=>{ const C=clone(L); const f=C.formas.splice(i,1)[0]; C.formas.unshift(f); guardaLance(C); fecha(); };
  }); }
function folhaLuzAdv(L,i){ folha(`<h3>💡 Destacar adversário</h3><div id="la"></div><div class="actions"><button class="btn" data-close>Fechar</button></div>`,(s,fecha)=>{
    s.querySelector("#la").appendChild(linhaLuz(L.adv[i].luz,c=>{ const C=clone(L); if(c) C.adv[i].luz=c; else delete C.adv[i].luz; guardaLance(C); fecha(); toast(c?"Adversário em destaque":"Destaque retirado"); })); }); }
function centroCampo(L){ const f=FUNDOS[L.fundo]?.campo||[2000,9000,66000,62000]; return {cx:Math.round((f[0]+f[2])/2),cy:Math.round((f[1]+f[3])/2)}; }
function novaBJ(L){ if((L.bj||[]).length){ toast("Este lance já tem bola. Arrasta-a, ou toca nela para a tirar."); return; }
  const C=clone(L); C.bj=[{...centroCampo(L),r:1000}]; guardaLance(C); toast("Bola colocada ao centro. Arrasta-a para o sítio."); }
function folhaBJ(L,i){ folha(`<h3>Bola</h3><p class="sub" style="margin:0">Arrasta a bola no quadro para a mudar de sítio.</p>
    <div class="actions"><button class="btn danger l" id="bj-del">Tirar bola</button><button class="btn" id="bj-c">Pôr ao centro</button><button class="btn dark" data-close>Fechar</button></div>`,(s,fecha)=>{
    s.querySelector("#bj-del").onclick=()=>{ const C=clone(L); C.bj.splice(i,1); fecha(); guardaLance(C); toast("Bola retirada",()=>guardaLance(L)); };
    s.querySelector("#bj-c").onclick=()=>{ const C=clone(L); Object.assign(C.bj[i],centroCampo(L)); fecha(); guardaLance(C); }; }); }
function novoAdv(L){ const C=clone(L); const f=FUNDOS[L.fundo]?.campo||[2000,9000,66000,62000];
  C.adv=[...(C.adv||[]),{cx:Math.round((f[0]+f[2])/2)+3000,cy:Math.round((f[1]+f[3])/2),r:1450,fill:"#0070C0",stroke:"#000000",sw:95}]; guardaLance(C); toast("Adversário adicionado ao centro. Arrasta-o para o sítio."); }
function marcador(svg,c){ const id="ah"+c.replace("#",""); if(svg.querySelector("#"+id)) return id;
  const m=el("marker",{id,viewBox:"0 0 10 10",refX:7,refY:5,markerWidth:6,markerHeight:6,orient:"auto-start-reverse",markerUnits:"strokeWidth"},svg.querySelector("defs"));
  el("path",{d:"M0,0 L10,5 L0,10 z",fill:c},m); return id; }
function meio(a){ if(a.qx!=null) return {x:.25*a.x1+.5*a.qx+.25*a.x2, y:.25*a.y1+.5*a.qy+.25*a.y2}; return {x:(a.x1+a.x2)/2,y:(a.y1+a.y2)/2}; }
function caminho(a){ if(a.qx!=null) return `M ${a.x1} ${a.y1} Q ${a.qx} ${a.qy} ${a.x2} ${a.y2}`; if(a.curva){ const xm=(a.x1+a.x2)/2; return `M ${a.x1} ${a.y1} C ${xm} ${a.y1} ${xm} ${a.y2} ${a.x2} ${a.y2}`; } return `M ${a.x1} ${a.y1} L ${a.x2} ${a.y2}`; }
function desenhaSetas(svg,L,opts){
  (L.setas||[]).forEach((a,i)=>{
    const g=el("g",{class:"seta"},svg), w=Math.max(a.w||95,110), id=marcador(svg,a.c||"#000");
    const hit=el("path",{d:caminho(a),stroke:"transparent","stroke-width":Math.max(900,w*8),fill:"none","pointer-events":(editing&&!opts.clean)?"stroke":"none"},g);
    const vis=el("path",{d:caminho(a),stroke:a.c||"#000","stroke-width":w,fill:"none","stroke-linecap":"round",...(a.fim?{"marker-end":`url(#${id})`}:{}),...(a.ini?{"marker-start":`url(#${id})`}:{}),...(a.tracejado?{"stroke-dasharray":`${w*4} ${w*3}`}:{}),"pointer-events":"none"},g);
    if(!editing||opts.clean) return;
    g.style.cursor="move";
    const h1=el("circle",{cx:a.x1,cy:a.y1,r:520,fill:"#fff",stroke:"#B8963F","stroke-width":160,style:"cursor:grab"},g);
    const h2=el("circle",{cx:a.x2,cy:a.y2,r:520,fill:"#B8963F",stroke:"#fff","stroke-width":160,style:"cursor:grab"},g);
    const m0=meio(a); const h3=el("rect",{x:m0.x-430,y:m0.y-430,width:860,height:860,rx:200,fill:"#fff",stroke:"#1F497D","stroke-width":160,style:"cursor:grab"},g);
    g.addEventListener("contextmenu",e=>{ e.stopPropagation(); menuQuadro(e,L,"setas",i); });
    const arrasta=(alvo,qual)=>{ let st=null, mv=false, paraLongo=()=>{};
      const novo=(dx,dy)=>{ const b={...a};
        if(qual===3){ const m=meio(a), M={x:m.x+dx,y:m.y+dy}; delete b.curva; b.qx=2*M.x-(a.x1+a.x2)/2; b.qy=2*M.y-(a.y1+a.y2)/2; return b; }
        if(qual!==2){ b.x1=a.x1+dx; b.y1=a.y1+dy; } if(qual!==1){ b.x2=a.x2+dx; b.y2=a.y2+dy; }
        if(qual===0&&a.qx!=null){ b.qx=a.qx+dx; b.qy=a.qy+dy; }
        return b; };
      alvo.addEventListener("touchstart",e=>e.preventDefault(),{passive:false});
      alvo.addEventListener("pointerdown",e=>{ if(e.button===2) return; e.preventDefault(); e.stopPropagation(); alvo.setPointerCapture(e.pointerId); st=svgPt(svg,e); mv=false; dragging=true;
        paraLongo=toqueLongo(e,ev=>{ if(!st||mv) return; st=null; dragging=false; menuQuadro(ev,L,"setas",i); }); });
      alvo.addEventListener("pointermove",e=>{ if(!st) return; const p=svgPt(svg,e), dx=p.x-st.x, dy=p.y-st.y; if(Math.hypot(dx,dy)>300){ mv=true; paraLongo(); } if(!mv) return;
        const b=novo(dx,dy);
        hit.setAttribute("d",caminho(b)); vis.setAttribute("d",caminho(b)); h1.setAttribute("cx",b.x1); h1.setAttribute("cy",b.y1); h2.setAttribute("cx",b.x2); h2.setAttribute("cy",b.y2);
        const mm=meio(b); h3.setAttribute("x",mm.x-430); h3.setAttribute("y",mm.y-430); });
      alvo.addEventListener("pointerup",e=>{ paraLongo(); if(!st) return; const p=svgPt(svg,e), dx=p.x-st.x, dy=p.y-st.y; st=null; dragging=false;
        if(mv){ const C=clone(L), b=novo(dx,dy); ["x1","y1","x2","y2","qx","qy"].forEach(k=>{ if(b[k]!=null) b[k]=Math.round(b[k]); }); C.setas[i]=b; guardaLance(C); }
        else folhaSeta(L,i); });
      alvo.addEventListener("pointercancel",()=>{ paraLongo(); st=null; dragging=false; render(); });
    };
    arrasta(hit,0); arrasta(h1,1); arrasta(h2,2); arrasta(h3,3);
  });
}
function overlaySeta(svg,L){
  const ov=el("rect",{x:0,y:0,width:W,height:H,fill:"rgba(184,150,63,.06)",style:"cursor:crosshair"},svg);
  let st=null, tmp=null;
  ov.addEventListener("touchstart",e=>e.preventDefault(),{passive:false});
  ov.addEventListener("pointerdown",e=>{ e.preventDefault(); ov.setPointerCapture(e.pointerId); st=svgPt(svg,e); dragging=true;
    tmp=el("path",{d:`M ${st.x} ${st.y} L ${st.x} ${st.y}`,stroke:corSeta,"stroke-width":120,fill:"none","marker-end":`url(#${marcador(svg,corSeta)})`,"pointer-events":"none"},svg); });
  ov.addEventListener("pointermove",e=>{ if(!st) return; const p=svgPt(svg,e); tmp.setAttribute("d",`M ${st.x} ${st.y} L ${p.x} ${p.y}`); });
  ov.addEventListener("pointerup",e=>{ if(!st) return; const p=svgPt(svg,e); dragging=false;
    if(Math.hypot(p.x-st.x,p.y-st.y)>900){ const C=clone(L); C.setas=[...(C.setas||[]),{x1:Math.round(st.x),y1:Math.round(st.y),x2:Math.round(p.x),y2:Math.round(p.y),c:corSeta,w:120,ini:false,fim:true,tracejado:false,curva:false}]; st=null; guardaLance(C); }
    else { st=null; render(); } });
}
function folhaSeta(L,i){
  const a=L.setas[i];
  folha(`<h3>Seta</h3><h4>Cor</h4><div class="styles" id="sa-c"></div>
    <h4>Linha e ponta</h4><div class="styles" id="sa-o"></div>
    <div class="actions"><button class="btn danger l" id="sa-del">Apagar seta</button><button class="btn dark" data-close>Fechar</button></div>`,(s,fecha)=>{
    const muda=f=>{ const C=clone(L); f(C.setas[i]); guardaLance(C); fecha(); };
    CORES_SETA.forEach(([c,n])=>{ const b=document.createElement("button"); b.setAttribute("aria-pressed",String(a.c===c));
      b.innerHTML=`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="${c}"/></svg><span>${n}</span>`; b.onclick=()=>muda(x=>x.c=c); s.querySelector("#sa-c").appendChild(b); });
    [["Tracejada",!!a.tracejado,x=>x.tracejado=!x.tracejado],["Grossa",(a.w||95)>200,x=>x.w=(x.w||95)>200?120:290],[(a.curva||a.qx!=null)?"Endireitar":"Curvar",false,x=>{ if(x.curva||x.qx!=null){ delete x.curva; delete x.qx; delete x.qy; } else { const dx=x.x2-x.x1, dy=x.y2-x.y1, mx=(x.x1+x.x2)/2, my=(x.y1+x.y2)/2; x.qx=mx-dy*.35; x.qy=my+dx*.35; } }],["Inverter sentido",false,x=>{[x.x1,x.y1,x.x2,x.y2]=[x.x2,x.y2,x.x1,x.y1];}],["Curvar para o outro lado",false,x=>{ if(x.qx==null) return; const mx=(x.x1+x.x2)/2, my=(x.y1+x.y2)/2; x.qx=2*mx-x.qx; x.qy=2*my-x.qy; }],["Ponta nos dois lados",!!(a.ini&&a.fim),x=>{ const both=x.ini&&x.fim; x.ini=!both; x.fim=true; }]]
      .forEach(([n,on,f])=>{ const b=document.createElement("button"); b.setAttribute("aria-pressed",String(on)); b.innerHTML=`<span>${n}</span>`; b.onclick=()=>muda(f); s.querySelector("#sa-o").appendChild(b); });
    s.querySelector("#sa-del").onclick=()=>{ const C=clone(L); C.setas.splice(i,1); guardaLance(C); fecha(); toast("Seta apagada",()=>guardaLance(L)); };
  });
}
function quebra(txt,fs,w,peso){ const ws=String(txt).split(/\s+/); const out=[]; let cur="";
  ws.forEach(p=>{ const t=cur?cur+" "+p:p; if(textW(t,fs,peso)>w&&cur){ out.push(cur); cur=p; } else cur=t; }); if(cur) out.push(cur); return out.length?out:[""]; }
function desenhaNotas(svg,L,opts){
  if(opts.clean&&(L.notas.lines||[]).every(x=>/^Escreve aqui/.test(x))) return;
  const N=L.notas, fs=15*PT, lh=fs*1.25, pad=900, iw=N.w-pad*2, ind=fs*1.3;
  const rows=[]; (N.lines||[]).filter(x=>x.trim()).forEach((ln,k)=>quebra(ln,fs,iw-ind,700).forEach((p,j)=>rows.push({k,p,first:j===0})));
  const h=pad*2+lh*(rows.length+1);
  const g=el("g",{class:"leg"},svg);
  el("rect",{x:N.x,y:N.y,width:N.w,height:h,rx:300,fill:"rgba(255,255,255,.93)",stroke:"#C00000","stroke-width":120},g);
  el("text",{x:N.x+pad,y:N.y+pad+fs,"font-size":fs,"font-weight":800,fill:"#C00000",class:"legtxt"},g).textContent="Indicações:";
  rows.forEach((rw,i)=>{ const y=N.y+pad+fs+lh*(i+1);
    if(rw.first) el("text",{x:N.x+pad,y,"font-size":fs,"font-weight":800,fill:"#C00000",class:"legtxt"},g).textContent=(rw.k+1)+".";
    el("text",{x:N.x+pad+ind,y,"font-size":fs,"font-weight":700,fill:"#1B1A17",class:"legtxt"},g).textContent=rw.p; });
  if(!opts.clean) liga(g,svg,L,"notas",0);
}
/* v112.21: botão direito (PC) / dedo pressionado (iPad) nas peças do quadro em edição: Duplicar, Editar e Apagar */
function menuQuadro(e,L,kind,i){ const it=L[kind]&&L[kind][i]; if(!it) return;
  const [nome,a]={formas:["Forma","a"],bj:["Bola","a"],bolas:["Bolinha","a"],textos:["Texto","o"],adv:["Adversário","o"],legs:["Legenda","a"],setas:["Seta","a"]}[kind]||["Peça","a"];
  const abre={formas:()=>folhaForma(L,i),bj:()=>folhaBJ(L,i),bolas:()=>folhaBola(L,i),textos:()=>folhaTexto(L,i),adv:()=>folhaAdv(L,i),legs:()=>folhaLegenda(L,i),setas:()=>folhaSeta(L,i)}[kind];
  const dup=()=>{ const C=clone(L), N=clone(it), d=1500; if(N.cx!=null){ N.cx+=d; N.cy+=d; } else if(N.x1!=null){ N.x1+=d; N.y1+=d; N.x2+=d; N.y2+=d; if(N.qx!=null){ N.qx+=d; N.qy+=d; } } else { N.x+=d; N.y+=d; }
    C[kind].push(N); guardaLance(C); toast(`${nome} duplicad${a}`,()=>guardaLance(L)); };
  const apaga=()=>{ const C=clone(L); C[kind].splice(i,1); guardaLance(C); toast(`${nome} apagad${a}`,()=>guardaLance(L)); };
  const itens=[]; if(["formas","textos","adv","setas"].includes(kind)) itens.push(["⧉ Duplicar",dup]);
  if(abre) itens.push(["✎ Editar…",abre]); itens.push([`🗑 Apagar ${nome.toLowerCase()}`,apaga,"perigo"]); menuContexto(e,itens); }
/* dedo pressionado ~0,55 s sem mexer = menu; devolve a função que o cancela */
function toqueLongo(e,abre){ if(e.pointerType==="mouse") return ()=>{}; const ev={clientX:e.clientX,clientY:e.clientY,preventDefault(){}}, t=setTimeout(()=>abre(ev),550); return ()=>clearTimeout(t); }
/* v112.21: 8 pegas (cantos e lados) para mudar o tamanho de uma caixa, como no Word; mexe(caixa) enquanto se arrasta, fim(caixa) ao largar */
function pegasCaixa(svg,B,mexe,fim,min=[2000,800]){ const g=el("g",{class:"pegas"},svg), hs=[];
  const caixa=(fx,fy,p)=>{ let x1=B.x, y1=B.y, x2=B.x+B.w, y2=B.y+B.h;
    if(fx===0) x1=Math.min(p.x,x2-min[0]); else if(fx===2) x2=Math.max(p.x,x1+min[0]); if(fy===0) y1=Math.min(p.y,y2-min[1]); else if(fy===2) y2=Math.max(p.y,y1+min[1]);
    return {x:x1,y:y1,w:x2-x1,h:y2-y1}; };
  const poe=b=>hs.forEach(([fx,fy,c,r])=>{ const cx=b.x+b.w*fx/2, cy=b.y+b.h*fy/2; c.setAttribute("cx",cx); c.setAttribute("cy",cy); r.setAttribute("x",cx-450); r.setAttribute("y",cy-450); });
  [0,1,2].forEach(fx=>[0,1,2].forEach(fy=>{ if(fx===1&&fy===1) return; const cur=fx===1?"ns":fy===1?"ew":fx===fy?"nwse":"nesw", h=el("g",{style:`cursor:${cur}-resize`},g);
    const c=el("circle",{r:1500,fill:"transparent"},h), r=el("rect",{width:900,height:900,rx:140,fill:"#fff",stroke:"#B8963F","stroke-width":160},h); hs.push([fx,fy,c,r]);
    h.addEventListener("touchstart",e=>e.preventDefault(),{passive:false});
    /* o arrasto segue-se na janela (no Safari do iPad a captura do ponteiro num <g> do SVG não segura os movimentos) */
    h.addEventListener("pointerdown",e=>{ if(e.button===2) return; e.preventDefault(); e.stopPropagation(); let nb=null; dragging=true;
      const mv=ev=>{ ev.preventDefault(); nb=caixa(fx,fy,svgPt(svg,ev)); poe(nb); mexe(nb); },
        up=ev=>{ removeEventListener("pointermove",mv); removeEventListener("pointerup",up); removeEventListener("pointercancel",up); dragging=false;
          if(ev.type==="pointercancel"||!nb){ render(); return; } fim({x:Math.round(nb.x),y:Math.round(nb.y),w:Math.round(nb.w),h:Math.round(nb.h)}); };
      addEventListener("pointermove",mv,{passive:false}); addEventListener("pointerup",up); addEventListener("pointercancel",up); }); }));
  poe(B); return g; }
/* toque / arrasto */
function liga(g,svg,L,kind,i,num,o_){
  const limpo=!!(o_&&o_.clean);
  let start=null, moved=false, orig=null, justDragged=false, paraLongo=()=>{};
  const podeArrastar=()=>editing||kind==="bolas"||kind==="adv"||kind==="legs"||kind==="bj";
  if(kind==="bolas"||kind==="adv"||kind==="legs"||kind==="bj") g.addEventListener("touchstart",e=>{ e.preventDefault(); },{passive:false});
  g.addEventListener("pointerdown",e=>{
    if(!podeArrastar()||e.button===2){ return; }
    e.preventDefault(); try{ g.setPointerCapture(e.pointerId); }catch(x){}
    start=svgPt(svg,e); moved=false; dragging=true;
    if(editing&&!limpo&&kind!=="notas") paraLongo=toqueLongo(e,ev=>{ if(!start||moved) return; start=null; dragging=false; menuQuadro(ev,L,kind,i); });
    const it=kind==="notas"?L.notas:L[kind][i]; orig=(kind==="bolas"||kind==="adv"||kind==="bj")?{cx:it.cx,cy:it.cy}:{x:it.x,y:it.y};
    /* v112.13: setas que saem desta peça (para as acompanhar enquanto se arrasta; o destino fica) */
    orig.setas=(kind==="bolas"||kind==="adv"||kind==="bj")?(L.setas||[]).map((s,k)=>Math.hypot(s.x1-it.cx,s.y1-it.cy)<=(it.r||1450)*1.6?k:-1).filter(k=>k>=0):[];
  });
  g.addEventListener("pointermove",e=>{
    if(!start) return;
    const p=svgPt(svg,e), dx=p.x-start.x, dy=p.y-start.y;
    if(Math.hypot(dx,dy)>350){ moved=true; paraLongo(); }
    if(moved){ g.setAttribute("transform",`translate(${dx} ${dy})`);
      if(orig.setas.length){ const gs=svg.querySelectorAll("g.seta"); orig.setas.forEach(k=>{ const s=L.setas[k], b={...s,x1:s.x1+dx,y1:s.y1+dy,...(s.qx!=null?{qx:s.qx+dx/2,qy:s.qy+dy/2}:{})}; gs[k]&&gs[k].querySelectorAll("path").forEach(pa=>pa.setAttribute("d",caminho(b))); }); }
      if(kind==="adv"&&L.espacos){ const zg=svg.querySelector("g.espacos"); if(zg) desenhaEspacos(svg,L.adv.map((a,k)=>k===i?{...a,cx:orig.cx+dx,cy:orig.cy+dy}:a),zg); }
      if(kind==="bolas"||kind==="adv"){ const lz=svg.querySelector(`g.luz[data-bi="${kind==="adv"?"a"+i:i}"]`); if(lz) lz.setAttribute("transform",`translate(${dx} ${dy})`); } }
  });
  const end=e=>{
    paraLongo(); if(!start) return;
    const p=svgPt(svg,e), dx=p.x-start.x, dy=p.y-start.y; start=null; dragging=false;
    if(moved){
      justDragged=true; setTimeout(()=>{justDragged=false;},400);
      const C=clone(L), it=kind==="notas"?C.notas:C[kind][i];
      if(kind==="bolas"||kind==="adv"||kind==="bj") movePecas(C,[[it,Math.round(Math.min(W,Math.max(0,orig.cx+dx))),Math.round(Math.min(H,Math.max(0,orig.cy+dy)))]]);   // v112.13: a seta que sai dele vai com ele
      else { it.x=Math.round(orig.x+dx); it.y=Math.round(orig.y+dy); }
      guardaLance(C);
    } else if(limpo) { /* apresentação: só arrastar */
    } else if(!editing&&kind==="legs") { folhaLegenda(L,i);
    } else if(editing) {
      kind==="formas"?folhaForma(L,i):kind==="bj"?folhaBJ(L,i):kind==="bolas"?folhaBola(L,i):kind==="notas"?folhaNotas(L):kind==="textos"?folhaTexto(L,i):kind==="adv"?folhaAdv(L,i):folhaLegenda(L,i);
    }
  };
  g.addEventListener("pointerup",end);
  g.addEventListener("pointercancel",()=>{ paraLongo(); start=null; dragging=false; render(); });
  g.addEventListener("contextmenu",e=>{ if(!editing||limpo||kind==="notas") return; e.stopPropagation(); paraLongo(); start=null; dragging=false; menuQuadro(e,L,kind,i); });
  g.addEventListener("click",()=>{ if(justDragged||limpo) return; if(!editing){ if(kind==="bolas") folhaSub(L,num,L.bolas[i]?.slot); else if(kind==="adv") folhaLuzAdv(L,i); } });
  g.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); if(editing){ kind==="formas"?folhaForma(L,i):kind==="bj"?folhaBJ(L,i):kind==="bolas"?folhaBola(L,i):kind==="notas"?folhaNotas(L):kind==="textos"?folhaTexto(L,i):kind==="adv"?folhaAdv(L,i):folhaLegenda(L,i);} else if(kind==="bolas") folhaSub(L,num); } });
}
