/* ---------- análise: UI ---------- */
function setPosse(e){ const P=JSON.parse(JSON.stringify(an.posse)); const now=Date.now();
  if(P.estado&&P.inicio) P.acum[String(P.parte)][P.estado]+=Math.max(0,(now-P.inicio)/1000);
  if(P.estado) P.ult=P.estado; P.estado=e; P.inicio=e?now:0; guardaAn({...an,posse:P}); }
const NOME_E={nos:"Nossa",eles:"Adversário",div:"Dividida",fora:"Bola fora"};
function consolida(P){ const now=Date.now(); if(P.estado&&P.inicio){ P.acum[String(P.parte)][P.estado]+=Math.max(0,(now-P.inicio)/1000); P.inicio=now; } return P; }
function recua(seg){ const P=consolida(JSON.parse(JSON.stringify(an.posse)));
  const e=P.estado||P.ult; if(!e){ toast("Ainda não há tempo para recuar."); return; }
  const pt=String(P.parte), A=P.acum[pt], tira=Math.min(seg,A[e]); if(tira<=0){ toast(`${NOME_E[e]} já está a 0:00.`); return; }
  A[e]-=tira; guardaAn({...an,posse:P});
  toast(`−${Math.round(tira)} s em ${NOME_E[e]} (${pt}ª parte)`,()=>{ const Q=JSON.parse(JSON.stringify(an.posse)); Q.acum[pt][e]+=tira; guardaAn({...an,posse:Q}); }); }
function lerTempo(v){ v=String(v).trim().replace(",",":").replace(".",":"); if(v==="") return 0; const m=v.match(/^(\d{1,3})(?::(\d{1,2}))?$/); if(!m) return null; const sg=m[2]==null?0:+m[2]; if(sg>59) return null; return (+m[1])*60+sg; }
function folhaTempos(){ let parte=an.posse.parte;
  folha(`<h3>Ajustar tempos</h3><p class="sub" style="margin:0">Escreve em minutos:segundos (ex.: 12:30). O tempo de jogo, o tempo útil e a posse recalculam. As ações já registadas mantêm o minuto.</p>
    <div class="seg" role="group" aria-label="Parte" id="tp-p"><button data-p="1">1ª parte</button><button data-p="2">2ª parte</button></div>
    <div class="tempos" id="tp-g"></div><p class="sub" id="tp-tot" style="margin:0"></p>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="tp-ok">Guardar</button></div>`,(s,fecha)=>{
    const g=s.querySelector("#tp-g");
    const pinta=()=>{ s.querySelectorAll("#tp-p button").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.p===parte)));
      const a=acumAgora(parte); g.innerHTML="";
      ["nos","div","eles","fora"].forEach(k=>{ const l=document.createElement("label"); l.className="f"; l.textContent=NOME_E[k]+(an.posse.estado===k&&an.posse.parte===parte?" (a contar)":"");
        const i=document.createElement("input"); i.id="tp-"+k; i.inputMode="numeric"; i.value=fmt(a[k]); i.oninput=tot; l.appendChild(i); g.appendChild(l); }); tot(); };
    const tot=()=>{ let t=0,u=0,ok=true; ["nos","div","eles","fora"].forEach(k=>{ const i=s.querySelector("#tp-"+k), v=lerTempo(i.value); i.setAttribute("aria-invalid",String(v==null)); if(v==null){ok=false;return;} t+=v; if(k!=="fora") u+=v; });
      s.querySelector("#tp-tot").innerHTML=ok?`Tempo de jogo <b>${fmt((parte===2?2700:0)+t)}</b> · Tempo útil <b>${fmt(u)}</b>`:"Formato inválido — usa mm:ss"; s.querySelector("#tp-ok").disabled=!ok; };
    s.querySelectorAll("#tp-p button").forEach(b=>b.onclick=()=>{ parte=+b.dataset.p; pinta(); });
    s.querySelector("#tp-ok").onclick=()=>{ const P=consolida(JSON.parse(JSON.stringify(an.posse))), A=P.acum[String(parte)];
      ["nos","div","eles","fora"].forEach(k=>{ A[k]=lerTempo(s.querySelector("#tp-"+k).value); }); fecha(); guardaAn({...an,posse:P}); toast(`Tempos da ${parte}ª parte ajustados`); };
    pinta(); }); }
function setParte(p){ const P=JSON.parse(JSON.stringify(an.posse)); const now=Date.now();
  if(P.estado&&P.inicio) P.acum[String(P.parte)][P.estado]+=Math.max(0,(now-P.inicio)/1000);
  P.parte=p; P.estado=""; P.inicio=0; guardaAn({...an,posse:P}); }
function tickAnalise(){ if($("view-a").hidden) return; const p=an.posse.parte, a=acumAgora(p);
  $("a-posse").querySelectorAll("button[data-e]").forEach(b=>{ const e=b.dataset.e; b.setAttribute("aria-pressed",String(an.posse.estado===e));
    if(e) b.querySelector("b").textContent=fmt(a[e]); });
  const util=a.nos+a.eles+a.div, tot=util+a.fora, pos=a.nos+a.eles?Math.round(a.nos/(a.nos+a.eles)*100):null;
  { const e=an.posse.estado||an.posse.ult; $("a-recuo-lbl").textContent=e?`Recuar (${NOME_E[e]})`:"Recuar"; }
  $("a-resumo").innerHTML=`<span>Tempo de jogo <b>${fmt((p===2?2700:0)+tot)}</b></span><span>Tempo útil <b>${fmt(util)}</b></span><span>Posse <b>${pos==null?"–":pos+"% · "+(100-pos)+"%"}</b></span>`;
}
setInterval(tickAnalise,1000);
const CAMPO_DIM=[100,64], CAMPO_AN=[5720,8690,85720,59890];
function campoAnalise(onClick,pontos){
  const svg=el("svg",{viewBox:`0 0 ${W} ${H}`,role:"img","aria-label":"Campo"});
  el("rect",{x:0,y:0,width:W,height:H,fill:"#E9E6DE"},svg);
  campo(svg,true,CAMPO_AN,CAMPO_DIM);
  const [x0,y0,x1,y1]=CAMPO_AN;
  el("text",{x:W/2,y:y0-1500,"text-anchor":"middle","font-size":1300,fill:"#9A958B","font-weight":600},svg).textContent="FORA DE CAMPO";
  (pontos||[]).forEach(p=>{ if(p.x2==null) return; const ax=x0+p.x*(x1-x0), ay=y0+p.y*(y1-y0), bx=x0+p.x2*(x1-x0), by=y0+p.y2*(y1-y0);
    const d=Math.hypot(bx-ax,by-ay)||1, ux=(bx-ax)/d, uy=(by-ay)/d, hl=Math.min(1400,d*.45), hw=hl*.55;
    el("line",{x1:ax,y1:ay,x2:bx-ux*hl*.8,y2:by-uy*hl*.8,stroke:p.cor,"stroke-width":p.lw||260,"stroke-opacity":p.op??0.85,"stroke-dasharray":p.tr||"none","stroke-linecap":"round"},svg);
    el("polygon",{points:`${bx},${by} ${bx-ux*hl-uy*hw},${by-uy*hl+ux*hw} ${bx-ux*hl+uy*hw},${by-uy*hl-ux*hw}`,fill:p.cor,"fill-opacity":p.op??0.85},svg); });
  (pontos||[]).forEach(p=>{ if(p.r===0) return; el("circle",{cx:x0+p.x*(x1-x0),cy:y0+p.y*(y1-y0),r:p.r||900,fill:p.cor,"fill-opacity":p.op??0.85,stroke:p.stroke||"#fff","stroke-width":p.sw||160},svg);
    if(p.txt){ el("text",{x:x0+p.x*(x1-x0),y:y0+p.y*(y1-y0)+380,"text-anchor":"middle","font-size":1000,"font-weight":700,fill:"#fff",class:"num"},svg).textContent=p.txt; } });
  if(onClick){ svg.addEventListener("click",e=>{ const q=svgPt(svg,e); const fx=(q.x-x0)/(x1-x0), fy=(q.y-y0)/(y1-y0); const mnx=-x0/(x1-x0), mxx=(W-x0)/(x1-x0), mny=-y0/(y1-y0), mxy=(H-y0)/(y1-y0); onClick(Math.min(mxx,Math.max(mnx,fx)),Math.min(mxy,Math.max(mny,fy))); }); }
  // seta de sentido de ataque
  return svg; }
function paraEcra(r_){ const dir=an.ataque[String(r_.parte)]; return dir==="esq"?{x:1-r_.x,y:1-r_.y}:{x:r_.x,y:r_.y}; }
function deEcra(fx,fy){ const dir=an.ataque[String(an.posse.parte)]; return dir==="esq"?{x:1-fx,y:1-fy}:{x:fx,y:fy}; }
function jogadoresAn(){ const emCampo=titulares(), sup=jogo.suplentes.filter(n=>!emCampo.includes(n)); const trocou=(jogo.subs||[]).map(l=>l.entra); return [...new Set([...emCampo,...trocou,...sup])]; }
function linkAn(x){ return linkVideoModo({t:minutoReg(x),parte:x.parte},jogo.video,"web"); }
/* faltas (cometidas e sofridas) marcam-se sempre do nosso lado: a sofrida conta como falta cometida do adversário */
const SO_NOS=["fc","fs"], soNos=id=>SO_NOS.includes(id);
const AVISO_FALTA="As faltas marcam-se sempre do nosso lado: falta sofrida (por um jogador nosso) ou falta cometida (por um jogador nosso).";
function tentaGravar(j){
  const S=anSel; if(!S.ac||!S.pt) return false; const A=acaoDe(S.ac);
  if(S.eq==="eles"&&soNos(S.ac)) return false;
  if(A.dir&&S.pt2===undefined) return false;
  if(A.tipos.length&&!A.tipos.includes(S.tipo)) return false;
  if(j===undefined) j=S.j;
  if(S.eq==="nos"&&j===undefined) return false;
  const reg={id:Math.random().toString(36).slice(2,9),c:Date.now(),ac:S.ac,eq:S.eq,x:Math.round(S.pt.x*1000)/1000,y:Math.round(S.pt.y*1000)/1000,j:S.eq==="nos"?(j??null):null,parte:an.posse.parte,seg:Math.round(tempoParte(an.posse.parte)),...(meuId?{autor:meuId}:{}),
    ...(A.tipos.length?{tipo:S.tipo}:{}),or:anOrig.or,...(anOrig.or==="bp"&&anOrig.bpl?{bpl:anOrig.bpl}:{}),...(A.dir&&S.pt2?{x2:Math.round(S.pt2.x*1000)/1000,y2:Math.round(S.pt2.y*1000)/1000}:{})};
  anSel={...anSel,ac:null,pt:null,pt2:undefined,tipo:undefined,j:undefined};
  guardaAn({...an,regs:[...an.regs,reg]});
  const ac=acaoDe(reg.ac); toast(`${minutoReg(reg)} · ${descReg(reg)}${reg.j?" · "+rot(reg.j):reg.eq==="eles"?" · Adversário":" · Coletivo"}`,()=>guardaAn({...an,regs:an.regs.filter(x=>x.id!==reg.id)}));
  return true; }
function renderAnalise(){
  if(!$("view-a")||$("view-a").hidden) return;
  $("av-reg").setAttribute("aria-pressed",String(anVista==="reg")); $("av-rel").setAttribute("aria-pressed",String(anVista==="rel"));
  $("a-registo").hidden=anVista!=="reg"; $("a-relatorio").hidden=anVista!=="rel";
  $("ap-1").setAttribute("aria-pressed",String(an.posse.parte===1)); $("ap-2").setAttribute("aria-pressed",String(an.posse.parte===2));
  $("a-dir").textContent=an.ataque[String(an.posse.parte)]==="esq"?"← Atacamos para a esquerda":"Atacamos para a direita →";
  tickAnalise();
  if(anVista==="rel"){ renderRelatorio(); return; }
  $("a-orig").querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.o===anOrig.or)));
  { const sb=$("a-bpl"); sb.hidden=anOrig.or!=="bp"; if(anOrig.or==="bp") opcBpl(sb,anSel.eq,anOrig.bpl); }
  $("ae-nos").setAttribute("aria-pressed",String(anSel.eq==="nos")); $("ae-eles").setAttribute("aria-pressed",String(anSel.eq==="eles"));
  const la=$("a-acoes"); la.innerHTML="";
  anCfg.acoes.forEach(a=>{ const b=document.createElement("button"); b.setAttribute("aria-pressed",String(anSel.ac===a.id)); if(anSel.eq==="eles"&&soNos(a.id)){ b.disabled=true; b.title=AVISO_FALTA; } b.innerHTML=`<span class="sw"></span><span></span>${a.tecla?`<kbd>${a.tecla}</kbd>`:""}`; b.children[0].style.background=a.cor; b.children[1].textContent=a.nome;
    b.onclick=()=>{ const novo=anSel.ac===a.id?null:a.id; anSel={...anSel,ac:novo,tipo:undefined,pt2:novo&&a.dir?anSel.pt2:undefined}; if(!tentaGravar(anSel.eq==="eles"?null:undefined)) renderAnalise(); }; la.appendChild(b); });
  // campo
  const recentes=an.regs.filter(x=>x.parte===an.posse.parte).slice(-12);
  const pts=recentes.map(x=>{ const p=paraEcra(x), p2=x.x2!=null?paraEcra({parte:x.parte,x:x.x2,y:x.y2}):null; return {...p,...(p2?{x2:p2.x,y2:p2.y,lw:160}:{}),cor:acaoDe(x.ac).cor,op:.35,r:700,sw:0}; });
  const AS=anSel.ac?acaoDe(anSel.ac):null, cor=AS?AS.cor:"#1B1A17";
  if(anSel.pt){ const p=anSel.pt, dir=an.ataque[String(an.posse.parte)], f=q_=>dir==="esq"?{x:1-q_.x,y:1-q_.y}:q_; const e=f(p);
    if(anSel.pt2){ const e2=f(anSel.pt2); pts.push({...e,x2:e2.x,y2:e2.y,cor,lw:300,op:1,r:0}); pts.push({...e2,cor,r:600,stroke:"#B8963F",sw:200,op:1}); }
    pts.push({...e,cor,r:1100,stroke:"#B8963F",sw:300,op:1}); }
  const precisaDest=AS&&AS.dir&&anSel.pt&&anSel.pt2===undefined;
  const cp=$("a-campo"); cp.innerHTML=""; cp.appendChild(campoAnalise((fx,fy)=>{ const q_=deEcra(fx,fy);
    if(anSel.pt&&AS&&AS.dir&&anSel.pt2===undefined) anSel={...anSel,pt2:q_}; else anSel={...anSel,pt:q_,pt2:undefined};
    if(!tentaGravar(anSel.eq==="eles"?null:undefined)) renderAnalise(); },pts));
  const tb=$("a-tipo"); tb.innerHTML=""; tb.hidden=!(AS&&(AS.tipos.length||AS.dir));
  if(AS){ if(AS.tipos.length){ const sp=document.createElement("span"); sp.textContent="Tipo:"; tb.appendChild(sp);
      AS.tipos.forEach(t=>{ const b=document.createElement("button"); b.textContent=t; b.setAttribute("aria-pressed",String(anSel.tipo===t)); b.onclick=()=>{ anSel={...anSel,tipo:anSel.tipo===t?undefined:t}; if(!tentaGravar(anSel.eq==="eles"?null:undefined)) renderAnalise(); }; tb.appendChild(b); }); }
    if(AS.dir){ const sp=document.createElement("span"); sp.style.marginLeft=AS.tipos.length?"auto":"0"; sp.textContent=!anSel.pt?"Toca na origem e depois no destino":anSel.pt2===undefined?"Agora toca no destino":anSel.pt2?"Direção marcada":"Sem direção"; tb.appendChild(sp);
      if(anSel.pt&&anSel.pt2===undefined){ const b=document.createElement("button"); b.textContent="Sem direção"; b.onclick=()=>{ anSel={...anSel,pt2:null}; if(!tentaGravar(anSel.eq==="eles"?null:undefined)) renderAnalise(); }; tb.appendChild(b); } } }
  const falta=[!anSel.ac&&"a ação",!anSel.pt&&"o sítio no campo",precisaDest&&"o destino (direção)",AS&&AS.tipos.length&&!anSel.tipo&&"o tipo",anSel.eq==="nos"&&anSel.j===undefined&&"o jogador"].filter(Boolean);
  $("a-hint").innerHTML=(kbBuf?`<span class="an-buf">Nº ${esc(kbBuf)}_</span> · `:"")+(an.posse.estado?`Minuto atual <b>${fmt((an.posse.parte===2?2700:0)+tempoParte(an.posse.parte))}</b> · Falta escolher: <b>${falta.join(", ")||"—"}</b>`:`<b>Cronómetro parado.</b> Toca em Nossa / Dividida / Adversário / Bola fora para o tempo contar. Falta escolher: <b>${falta.join(", ")}</b>`);
  // jogadores
  const lj=$("a-jog"); lj.innerHTML="";
  if(anSel.eq==="eles"){ const b=document.createElement("button"); b.innerHTML=`<b>ADV</b><span>Adversário</span>`; b.onclick=()=>{ if(!tentaGravar(null)) toast("Escolhe primeiro a ação e o sítio no campo."); }; lj.appendChild(b); }
  else {
    const emCampo=titulares(), sup=jogo.suplentes.filter(n=>!emCampo.includes(n));
    const trocou=(jogo.subs||[]).map(l=>l.entra);
    const lista=jogadoresAn();
    lista.forEach(n=>{ const b=document.createElement("button"); b.innerHTML=`<b></b><span></span>`; b.children[0].textContent=n; b.children[1].textContent=nome(n)||"";
      if(sup.includes(n)&&!trocou.includes(n)) b.style.opacity=".6";
      b.setAttribute("aria-pressed",String(anSel.j===n));
      b.onclick=()=>{ if(!tentaGravar(n)){ anSel={...anSel,j:anSel.j===n?undefined:n}; renderAnalise(); } }; lj.appendChild(b); });
    const c=document.createElement("button"); c.innerHTML=`<b>—</b><span>Coletivo (sem jogador)</span>`; c.setAttribute("aria-pressed",String(anSel.j===null));
    c.onclick=()=>{ if(!tentaGravar(null)){ anSel={...anSel,j:anSel.j===null?undefined:null}; renderAnalise(); } }; lj.appendChild(c);
  }
  // recentes
  const ul=$("a-recent"); ul.innerHTML="";
  $("a-rec-todos").textContent=anTodos?"Ver só os últimos":`Ver todos (${an.regs.length})`; $("a-rec-todos").hidden=an.regs.length<=8;
  $("a-rec-tit").textContent=(anTodos?"Todos os registos":"Últimos registos")+" · toca para editar";
  ul.style.maxHeight=anTodos?"480px":"";
  const ordem=an.regs.slice().sort((p,q)=>(q.parte*1e5+q.seg)-(p.parte*1e5+p.seg));
  (anTodos?ordem:an.regs.slice(-8).reverse()).forEach(x=>{ const li=document.createElement("li"); const a=acaoDe(x.ac);
    li.innerHTML=`<span class="t"></span><span class="sw" style="width:10px;height:10px;border-radius:2px;display:inline-block"></span><span class="d"></span>${linkAn(x)?`<a class="vid" target="_blank" rel="noopener" title="Ver no vídeo">▶</a>`:""}<button class="icon x" aria-label="Apagar">✕</button>`;
    if(li.querySelector("a.vid")) li.querySelector("a.vid").href=linkAn(x);
    li.querySelector(".t").textContent=minutoReg(x); li.querySelector(".sw").style.background=a.cor;
    li.querySelector(".d").textContent=`${descReg(x)} · ${x.eq==="eles"?"Adversário":x.j?rot(x.j):"Coletivo"}`;
    li.onclick=e=>{ if(e.target.closest(".x,a")) return; folhaReg(x.id); };
    li.querySelector(".x").onclick=()=>{ const prev=an.regs.slice(); guardaAn({...an,regs:an.regs.filter(y=>y.id!==x.id)}); toast("Registo apagado",()=>guardaAn({...an,regs:prev})); };
    ul.appendChild(li); });
}
$("a-orig").querySelectorAll("button").forEach(b=>b.onclick=()=>setOrig(b.dataset.o));
$("v-posse").querySelectorAll("button[data-e]").forEach(b=>b.onclick=()=>vSetPosse(b.dataset.e));
$("vp-1").onclick=()=>guardaVivo({...vivo,parte:1,manual:true}); $("vp-2").onclick=()=>guardaVivo({...vivo,parte:2,manual:true});
$("v-ver").querySelectorAll("button").forEach(b=>b.onclick=()=>{ vVer=b.dataset.v; renderVivo(); });
$("ve-gn").onclick=()=>folhaEvento("golo"); $("ve-ga").onclick=()=>folhaEvento("golo_adv"); $("ve-am").onclick=()=>folhaEvento("amarelo"); $("ve-vm").onclick=()=>folhaEvento("vermelho"); $("ve-sb").onclick=folhaSubVivo;
$("v-rposse").onclick=()=>{ folha(`<h3>Repor a posse de bola ao vivo?</h3><p class="sub" style="margin:0">Os tempos de Nossa, Dividida, Adversário e Bola fora das duas partes voltam a 0:00. Os contadores não mudam.</p>
    <div class="actions" style="justify-content:stretch"><button class="btn" data-close style="flex:1;min-height:56px">Cancelar</button><button class="btn" id="vrp-ok" style="flex:1;min-height:56px;background:#C00000;color:#fff;border-color:#C00000">Sim, repor posse</button></div>`,(s_,fecha)=>{
    s_.querySelector("#vrp-ok").onclick=()=>{ const prev=clone(vivo); fecha(); guardaVivo({...vivo,posse:null}); toast("Posse ao vivo reposta a zero",()=>guardaVivo(prev)); }; }); };
$("v-reset").onclick=()=>{ let posse=true;
  folha(`<h3>Repor a estatística ao vivo?</h3><p class="sub" style="margin:0">Os contadores (remates, cantos, faltas, foras de jogo) das duas partes voltam a 0.</p>
    <label style="display:flex;gap:8px;align-items:center;font-size:15px"><input type="checkbox" id="vr-p" checked style="width:20px;height:20px"> Repor também a posse de bola ao vivo</label>
    <p class="sub" style="margin:0">Golos, cartões e substituições <b>não</b> são apagados.</p>
    <div class="actions" style="justify-content:stretch"><button class="btn" data-close style="flex:1;min-height:56px">Cancelar</button><button class="btn danger" id="vr-ok" style="flex:1;min-height:56px;background:#C00000;color:#fff;border-color:#C00000">Sim, repor a zero</button></div>`,(s_,fecha)=>{
    const ok=s_.querySelector("#vr-ok");
    ok.onclick=()=>{ const prev=clone(vivo); vLog=[]; posse=s_.querySelector("#vr-p").checked; fecha(); vLog=[];
      guardaVivo({...vivo,c:vZero(),...(posse?{posse:null}:{})}); toast("Estatística ao vivo reposta a zero",()=>guardaVivo(prev)); };
    }); };
$("v-undo").onclick=()=>{ const u=vLog.pop(); if(!u){ toast("Nada para desfazer."); return; } if(u.evId) guardaJogo({...jogo,eventos:(jogo.eventos||[]).filter(x=>x.id!==u.evId)},true); guardaVivo({...vivo,c:u.c}); toast("Último toque desfeito"); };
$("a-bpl").onchange=e=>setOrig("bp",e.target.value);
$("a-rec-todos").onclick=()=>{ anTodos=!anTodos; renderAnalise(); };
function folhaReg(id){ const x0=an.regs.find(y=>y.id===id); if(!x0) return; const X={...x0};
  folha(`<h3>Editar registo</h3>
    <div class="er-grid">
      <label class="f">Minuto do jogo (mm:ss)<input type="text" id="er-min" inputmode="numeric"></label>
      <label class="f">Parte<select id="er-p"><option value="1">1ª parte</option><option value="2">2ª parte</option></select></label>
      <label class="f">Equipa<select id="er-eq"><option value="nos">Nós</option><option value="eles">Adversário</option></select></label>
      <label class="f">Ação<select id="er-ac"></select></label>
      <label class="f">Origem<select id="er-o"><option value="org">Organizado</option><option value="trans">Transição</option><option value="bp">Bola parada</option></select></label>
      <label class="f" id="er-bl">Lance de bola parada<select id="er-b"></select></label>
      <label class="f" id="er-tl">Tipo<select id="er-t"></select></label>
      <label class="f" id="er-jl">Jogador<select id="er-j"></select></label>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="sub" style="margin:0">Toca no campo para mudar (atacamos sempre para a direita):</span>
      <div class="seg" role="group" id="er-m"><button data-m="o">Origem</button><button data-m="d">Destino</button></div><button class="btn sm" id="er-sd">Sem direção</button></div>
    <div class="er-campo" id="er-c"></div>
    <p class="sub" id="er-err" style="margin:0;color:#C00000" hidden>Minuto inválido — usa mm:ss (ex.: 47:30 na 2ª parte).</p>
    <div class="actions"><button class="btn danger l" id="er-del">Apagar</button>${linkAn(X)?`<a class="btn" id="er-v" target="_blank" rel="noopener">▶ Ver no vídeo</a>`:""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="er-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=k=>s.querySelector(k); if(q("#er-v")) q("#er-v").href=linkAn(X);
    q("#er-min").value=minutoReg(X); q("#er-p").value=String(X.parte); q("#er-eq").value=X.eq;
    const acs=anCfg.acoes.slice(); if(!acs.find(a=>a.id===X.ac)) acs.push(acaoDe(X.ac));
    acs.forEach(a=>{ const o=document.createElement("option"); o.value=a.id; o.textContent=a.nome; q("#er-ac").appendChild(o); }); q("#er-ac").value=X.ac;
    const emCampo=titulares(), trocou=(jogo.subs||[]).map(l=>l.entra);
    const lista=[...new Set([...emCampo,...trocou,...jogo.suplentes,...est.plantel.map(p=>p.n).filter(Boolean)])]; if(X.j&&!lista.includes(X.j)) lista.unshift(X.j);
    const oc=document.createElement("option"); oc.value=""; oc.textContent="— Coletivo (sem jogador)"; q("#er-j").appendChild(oc);
    lista.forEach(n=>{ const o=document.createElement("option"); o.value=n; o.textContent=rot(n); q("#er-j").appendChild(o); }); q("#er-j").value=X.j||"";
    q("#er-o").value=X.or||"org"; opcBpl(q("#er-b"),X.eq,X.bpl);
    const vis=()=>{ q("#er-jl").hidden=q("#er-eq").value==="eles"; q("#er-bl").hidden=q("#er-o").value!=="bp"; }; q("#er-eq").onchange=vis; q("#er-o").onchange=vis; vis();
    let modo="o";
    const tipos=()=>{ const A=acaoDe(q("#er-ac").value), sel=q("#er-t"); sel.innerHTML=""; q("#er-tl").hidden=!A.tipos.length;
      const ts=A.tipos.slice(); if(X.tipo&&!ts.includes(X.tipo)) ts.push(X.tipo); ts.forEach(t=>{ const o=document.createElement("option"); o.value=t; o.textContent=t; sel.appendChild(o); }); if(X.tipo) sel.value=X.tipo; };
    const pinta=()=>{ const A=acaoDe(q("#er-ac").value), cor=A.cor, c=q("#er-c"); c.innerHTML="";
      s.querySelectorAll("#er-m button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.m===modo)));
      const pts=[]; if(X.x2!=null){ pts.push({x:X.x,y:X.y,x2:X.x2,y2:X.y2,cor,lw:300,op:1,r:0}); pts.push({x:X.x2,y:X.y2,cor,r:600,stroke:"#B8963F",sw:200,op:1}); }
      pts.push({x:X.x,y:X.y,cor,r:1100,stroke:"#B8963F",sw:300,op:1});
      c.appendChild(campoAnalise((fx,fy)=>{ const v={x:Math.round(fx*1000)/1000,y:Math.round(fy*1000)/1000}; if(modo==="d"){ X.x2=v.x; X.y2=v.y; } else { X.x=v.x; X.y=v.y; } pinta(); },pts)); };
    s.querySelectorAll("#er-m button").forEach(b=>b.onclick=()=>{ modo=b.dataset.m; pinta(); });
    q("#er-sd").onclick=()=>{ delete X.x2; delete X.y2; modo="o"; pinta(); };
    q("#er-ac").onchange=()=>{ tipos(); pinta(); }; tipos(); pinta();
    q("#er-del").onclick=()=>{ const prev=an.regs.slice(); fecha(); guardaAn({...an,regs:an.regs.filter(y=>y.id!==id)}); toast("Registo apagado",()=>guardaAn({...an,regs:prev})); };
    q("#er-ok").onclick=()=>{ const abs=lerTempo(q("#er-min").value); if(abs==null){ q("#er-err").hidden=false; return; }
      if(q("#er-eq").value==="eles"&&soNos(q("#er-ac").value)){ toast(AVISO_FALTA); return; }
      const parte=+q("#er-p").value, eq=q("#er-eq").value;
      const A=acaoDe(q("#er-ac").value); const novo={...X,parte,eq,ac:A.id,seg:Math.max(0,abs-(parte===2?2700:0)),j:eq==="eles"?null:(q("#er-j").value||null)};
      if(A.tipos.length) novo.tipo=q("#er-t").value; else delete novo.tipo;
      novo.or=q("#er-o").value; if(novo.or==="bp"&&q("#er-b").value) novo.bpl=q("#er-b").value; else delete novo.bpl;
      const prev=an.regs.slice(); fecha(); guardaAn({...an,regs:an.regs.map(y=>y.id===id?novo:y)}); toast("Registo atualizado",()=>guardaAn({...an,regs:prev})); };
  }); }
$("av-reg").onclick=()=>{ anVista="reg"; renderAnalise(); }; $("av-rel").onclick=()=>{ anVista="rel"; renderAnalise(); };
$("ap-1").onclick=()=>setParte(1); $("ap-2").onclick=()=>setParte(2);
function folhaSync(){ const p=an.posse.parte, V=jogo.video||{}, k=p===2?V.k2:V.k1, temV=!!ytId(V.url);
  folha(`<h3>Acertar com o vídeo · ${p}ª parte</h3><p class="sub" style="margin:0">Pausa o YouTube e escreve o tempo que aparece no leitor. O cronómetro passa a coincidir com o vídeo (a diferença vai para o estado ${NOME_E[an.posse.estado||an.posse.ult]||"Dividida"}).</p>
    ${temV?"":`<label class="f">Link do YouTube<input type="text" id="sy-u" placeholder="https://www.youtube.com/watch?v=…"></label>`}
    ${k==null?`<label class="f">Início da ${p}ª parte no vídeo (h:mm:ss)<input type="text" id="sy-k" placeholder="Ex.: 12:30"></label>`:`<p class="sub" style="margin:0">Início da ${p}ª parte no vídeo: <b>${hms(k)}</b> <a href="#" id="sy-ed">alterar</a></p>`}
    <label class="f">Tempo atual no YouTube (h:mm:ss)<input type="text" id="sy-t" inputmode="numeric" placeholder="Ex.: 1:02:15"></label>
    <p class="sub" id="sy-r" style="margin:0"></p>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="sy-ok">Acertar</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x); if(q("#sy-ed")) q("#sy-ed").onclick=e=>{ e.preventDefault(); fecha(); folhaVideo(); };
    const kv=()=>k!=null?k:lerHms(q("#sy-k")?.value);
    const prev=()=>{ const t=lerHms(q("#sy-t").value), kk=kv(); if(t==null||kk==null||!q("#sy-t").value.trim()){ q("#sy-r").textContent=""; return null; }
      const alvo=Math.max(0,t-kk); q("#sy-r").innerHTML=`Minuto do jogo passa a <b>${fmt((p===2?2700:0)+alvo)}</b> (agora: ${fmt((p===2?2700:0)+tempoParte(p))})`; return alvo; };
    s.querySelectorAll("input").forEach(i=>i.oninput=prev);
    q("#sy-ok").onclick=()=>{ const alvo=prev(); if(alvo==null){ toast("Preenche os tempos em h:mm:ss."); return; }
      if(!temV||k==null){ const u=temV?V.url:q("#sy-u").value.trim(); if(!ytId(u)){ toast("Esse link não parece ser do YouTube."); return; }
        const NV={url:u,k1:V.k1??null,k2:V.k2??null,antes:V.antes??10}; NV[p===2?"k2":"k1"]=kv(); guardaJogo({...jogo,video:NV},true); }
      const antes=JSON.parse(JSON.stringify(an.posse)); const P=consolida(JSON.parse(JSON.stringify(an.posse))), A=P.acum[String(p)];
      let dif=alvo-(A.nos+A.eles+A.div+A.fora); const e=P.estado||P.ult||"div";
      if(dif>=0) A[e]+=dif; else { for(const kx of [e,"fora","div","eles","nos"]){ const t_=Math.min(A[kx],-dif); A[kx]-=t_; dif+=t_; if(dif>=0) break; } }
      fecha(); guardaAn({...an,posse:P}); toast("Cronómetro acertado com o vídeo",()=>guardaAn({...an,posse:antes})); };
    q("#sy-t").focus(); }); }
function kbJogador(){ const n=kbBuf; kbBuf=""; clearTimeout(kbTimer); if(!n){ renderAnalise(); return; }
  if(!jogadoresAn().includes(n)&&!est.plantel.some(p=>p.n===n)){ toast(`Nº ${n} não está na lista de jogadores.`); renderAnalise(); return; }
  if(!tentaGravar(n)){ anSel={...anSel,j:n}; renderAnalise(); } }
document.addEventListener("keydown",e=>{
  if($("view-a").hidden||anVista!=="reg"||$("sheet-root").innerHTML) return;
  const tg=e.target, tag=(tg&&tg.tagName)||""; if(/INPUT|TEXTAREA|SELECT/.test(tag)||(tg&&tg.isContentEditable)) return;
  if(e.metaKey||e.altKey) return; const k=e.key;
  if(e.ctrlKey){ if(k==="z"||k==="Z"){ e.preventDefault(); desfazUltimo(); } return; }
  const map={ArrowRight:"nos",ArrowLeft:"eles",ArrowDown:"div",ArrowUp:"fora"};
  if(map[k]){ e.preventDefault(); setPosse(map[k]); return; }
  if(k===" "){ e.preventDefault(); setPosse(""); return; }
  if(e.shiftKey&&/^Digit[123]$/.test(e.code)){ e.preventDefault(); setOrig(["org","trans","bp"][+e.code.slice(5)-1]); if(e.code==="Digit3") setTimeout(()=>$("a-bpl").focus(),50); return; }
  if(/^[0-9]$/.test(k)){ if(anSel.eq==="eles") return; e.preventDefault(); kbBuf=(kbBuf+k).slice(-3); clearTimeout(kbTimer);
    const outros=jogadoresAn().filter(n=>n!==kbBuf&&n.startsWith(kbBuf));
    if(!outros.length&&jogadoresAn().includes(kbBuf)){ kbJogador(); return; }
    kbTimer=setTimeout(()=>{ if(kbBuf) kbJogador(); },1200); renderAnalise(); return; }
  if(k==="Backspace"&&kbBuf){ e.preventDefault(); kbBuf=kbBuf.slice(0,-1); renderAnalise(); return; }
  if(k==="Enter"){ e.preventDefault(); if(kbBuf){ kbJogador(); return; } if(!tentaGravar(null)) toast("Falta escolher: ação, sítio"+(acaoDe(anSel.ac||"").dir?" e destino":"")+"."); return; }
  if(k==="Escape"){ kbBuf=""; anSel={ac:null,eq:anSel.eq,pt:null}; renderAnalise(); return; }
  if(k==="-"&&anSel.pt&&anSel.ac&&acaoDe(anSel.ac).dir&&anSel.pt2===undefined){ anSel={...anSel,pt2:null}; if(!tentaGravar(anSel.eq==="eles"?null:undefined)) renderAnalise(); return; }
  const K=k.length===1?k.toUpperCase():"";
  if(!K) return;
  if(K==="X"){ e.preventDefault(); anSel={...anSel,eq:anSel.eq==="nos"?"eles":"nos"}; if(anSel.eq==="eles"&&soNos(anSel.ac)){ anSel={...anSel,ac:null}; toast(AVISO_FALTA); } if(!(anSel.eq==="eles"&&tentaGravar(null))) renderAnalise(); return; }
  if(K==="Z"){ e.preventDefault(); desfazUltimo(); return; }
  if(K==="S"){ e.preventDefault(); folhaSync(); return; }
  if(K==="T"){ const A=anSel.ac&&acaoDe(anSel.ac); if(!A||!A.tipos.length) return; e.preventDefault(); const i=A.tipos.indexOf(anSel.tipo); anSel={...anSel,tipo:A.tipos[(i+1)%A.tipos.length]}; if(!tentaGravar(anSel.eq==="eles"?null:undefined)) renderAnalise(); return; }
  const A=anCfg.acoes.find(a=>a.tecla===K); if(!A) return; e.preventDefault();
  if(anSel.eq==="eles"&&soNos(A.id)){ toast(AVISO_FALTA); return; }
  if(anSel.ac===A.id&&A.tipos.length){ const i=A.tipos.indexOf(anSel.tipo); anSel={...anSel,tipo:A.tipos[(i+1)%A.tipos.length]}; }
  else anSel={...anSel,ac:A.id,tipo:undefined,pt2:A.dir?anSel.pt2:undefined};
  if(!tentaGravar(anSel.eq==="eles"?null:undefined)) renderAnalise(); });
function desfazUltimo(){ const x=an.regs[an.regs.length-1]; if(!x){ toast("Não há registos para desfazer."); return; } const prev=an.regs.slice();
  guardaAn({...an,regs:an.regs.slice(0,-1)}); toast(`Desfeito: ${minutoReg(x)} · ${descReg(x)}`,()=>guardaAn({...an,regs:prev})); }
$("a-sync").onclick=folhaSync;
$("a-kb").onclick=()=>{ const v=$("a-kbp").hidden; $("a-kbp").hidden=!v; $("a-kb").setAttribute("aria-pressed",String(v)); try{ localStorage.setItem("sca-kb",v?"1":""); }catch(e){} };
try{ if(localStorage.getItem("sca-kb")){ $("a-kbp").hidden=false; $("a-kb").setAttribute("aria-pressed","true"); } }catch(e){}
$("a-recuo").querySelectorAll("button[data-r]").forEach(b=>b.onclick=()=>recua(+b.dataset.r));
$("a-ajusta").onclick=folhaTempos;
$("a-dir").onclick=()=>{ const p=String(an.posse.parte); guardaAn({...an,ataque:{...an.ataque,[p]:an.ataque[p]==="esq"?"dir":"esq"}}); };
$("ae-nos").onclick=()=>{ anSel={...anSel,eq:"nos"}; renderAnalise(); }; $("ae-eles").onclick=()=>{ anSel={...anSel,eq:"eles"}; if(soNos(anSel.ac)){ anSel={...anSel,ac:null}; toast(AVISO_FALTA); } if(!tentaGravar(null)) renderAnalise(); };
$("a-posse").querySelectorAll("button[data-e]").forEach(b=>b.onclick=()=>setPosse(b.dataset.e));
$("a-edit-acoes").onclick=()=>{
  const PAL=["#1E7A46","#C00000","#1F497D","#B8963F","#8064A2","#4BACC6","#E07B39","#6B675E","#2E8B57","#00B0F0","#8B5A2B","#E6B000"];
  let L_=anCfg.acoes.map(a=>({...a,tipos:a.tipos.slice()}));
  folha(`<h3>Lista de ações</h3><p class="sub" style="margin:0"><b>Tecla</b>: atalho no PC (T, X, Z e S reservadas). <b>Direção</b>: pede origem e destino no campo. <b>Tipos</b>: separados por vírgula (ex.: Passe falhado, Drible perdido). As ações com registos mantêm o histórico.</p>
    <div class="ea-list" id="ea-l"></div>
    <div class="actions"><button class="btn l" id="ea-rep">Repor lista base</button><button class="btn" id="ea-add">+ Ação</button><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ea-ok">Guardar</button></div>`,(s,fecha)=>{
    const box=s.querySelector("#ea-l");
    const pinta=()=>{ box.innerHTML=""; L_.forEach((a,k)=>{ const row=document.createElement("div"); row.className="ea-row";
      row.innerHTML=`<span class="sw"></span><input type="text" class="ea-n" aria-label="Nome"><input type="text" class="ea-k" maxlength="1" aria-label="Tecla" placeholder="–" title="Tecla de atalho"><label><input type="checkbox" class="ea-d"> Direção</label><input type="text" class="ea-tp" placeholder="Tipos (opcional)" aria-label="Tipos"><button class="icon ea-up" aria-label="Subir">↑</button><button class="icon x ea-x" aria-label="Apagar">✕</button>`;
      row.querySelector(".sw").style.background=a.cor; const n=row.querySelector(".ea-n"); n.value=a.nome; n.oninput=()=>a.nome=n.value;
      const kk=row.querySelector(".ea-k"); kk.value=a.tecla||""; kk.oninput=()=>{ const v=kk.value.toUpperCase().replace(/[^A-Z]/g,""); if(TECLAS_RES.includes(v)&&v){ toast("T, X, Z e S estão reservadas."); kk.value=""; a.tecla=""; return; } kk.value=v; a.tecla=v; };
      const d=row.querySelector(".ea-d"); d.checked=a.dir; d.onchange=()=>a.dir=d.checked;
      const t=row.querySelector(".ea-tp"); t.value=a.tipos.join(", "); t.oninput=()=>a.tipos=t.value.split(",").map(x=>x.trim()).filter(Boolean);
      row.querySelector(".ea-up").onclick=()=>{ if(k>0){ [L_[k-1],L_[k]]=[L_[k],L_[k-1]]; pinta(); } };
      row.querySelector(".ea-x").onclick=()=>{ L_.splice(k,1); pinta(); }; box.appendChild(row); }); };
    s.querySelector("#ea-add").onclick=()=>{ L_.push({id:Math.random().toString(36).slice(2,8),nome:"",cor:PAL[L_.length%PAL.length],dir:false,tipos:[]}); pinta(); const ns=box.querySelectorAll(".ea-n"); ns[ns.length-1].focus(); };
    s.querySelector("#ea-rep").onclick=()=>{ L_=ACOES_DEF.map(a=>({...a,tipos:a.tipos.slice()})); pinta(); };
    s.querySelector("#ea-ok").onclick=()=>{ const ks=L_.map(a=>a.tecla).filter(Boolean); const dup=ks.find((k,i)=>ks.indexOf(k)!==i); if(dup){ toast(`A tecla ${dup} está repetida.`); return; }
      guardaCfg({acoes:L_.filter(a=>a.nome.trim()).map(a=>({...a,nome:a.nome.trim()}))}); fecha(); };
    pinta(); });
};