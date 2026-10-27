/* ---------- adversário (Fase 1): plantel por equipa, onze do jogo, substituições do adversário e quadro Encaixe ---------- */
/* plantel de cada equipa em adversarios/<id> (serve para todos os jogos contra ela); o jogo guarda jogo.adv (equipa, sistema, cores, onze, suplentes),
   jogo.subsAdv (um documento por substituição: subsAdv/<id>) e jogo.encaixe (sítios das bolinhas no Encaixe, para o Onze não mudar).
   Pronto para a Fase 2 (importar da SCA Observação): origem "manual" | "observacao", versaoImportada, onzeProv/onzeAlt {sis, pos {código: idJogador}}. */
const CORES_ADV_DEF={cam:"#1F4E9A",cam2:"#FFFFFF",num:"#FFFFFF",gr:"#2E9E4F"};
/* sistemas e siglas iguais aos da SCA Observação (LAYOUTS), para o onze importado cair no sítio certo: [código, nº, x, y],
   com x = de um lado ao outro (0 = direita) e y = da baliza deles (0) para a frente; aqui o adversário ataca para a esquerda */
const L4_ADV=[["GR","1",.5,.035],["LD","2",.10,.25],["DCD","3",.31,.20],["DCE","4",.69,.20],["LE","5",.90,.25]];
const SIS_OBS={
  "4-3-3":[...L4_ADV,["MDC","6",.5,.46],["MCD","8",.31,.53],["MO","10",.69,.53],["ED","7",.10,.75],["PL","9",.5,.78],["EE","11",.90,.75]],
  "4-4-2":[...L4_ADV,["MD","7",.10,.55],["MCD","6",.31,.50],["MCE","8",.69,.50],["ME","11",.90,.55],["PLD","9",.31,.78],["PLE","10",.69,.78]],
  "4-4-2 losango":[...L4_ADV,["MDC","6",.5,.40],["MCD","8",.28,.55],["MCE","7",.72,.55],["MO","10",.5,.66],["PLD","9",.33,.82],["PLE","11",.67,.82]],
  "4-2-3-1":[...L4_ADV,["MDCD","6",.31,.45],["MDCE","8",.69,.45],["ED","7",.10,.62],["MO","10",.5,.58],["EE","11",.90,.62],["PL","9",.5,.80]],
  "4-1-4-1":[...L4_ADV,["MDC","6",.5,.40],["MD","7",.10,.58],["MCD","8",.31,.56],["MCE","10",.69,.56],["ME","11",.90,.58],["PL","9",.5,.80]],
  "3-5-2":[["GR","1",.5,.035],["DCD","2",.31,.22],["DC","3",.5,.30],["DCE","4",.69,.22],["ALD","7",.10,.45],["ALE","5",.90,.45],["MDC","6",.5,.58],["MCD","8",.31,.55],["MCE","10",.69,.55],["PLD","9",.31,.80],["PLE","11",.69,.80]],
  "3-4-3":[["GR","1",.5,.05],["DCD","2",.278,.36],["DC","3",.5,.35],["DCE","4",.722,.36],["ALD","7",.075,.5],["ALE","5",.925,.5],["MCD","8",.32,.61],["MCE","6",.68,.62],["AVD","10",.16,.775],["PL","9",.5,.795],["AVE","11",.84,.775]],
  "5-3-2":[["GR","1",.5,.035],["ALD","2",.10,.32],["DCD","3",.31,.22],["DC","4",.5,.30],["DCE","6",.69,.22],["ALE","5",.90,.32],["MCD","8",.31,.55],["MDC","7",.5,.58],["MCE","10",.69,.55],["PLD","9",.31,.80],["PLE","11",.69,.80]],
  "5-4-1":[["GR","1",.5,.035],["ALD","2",.10,.30],["DCD","3",.31,.22],["DC","4",.5,.30],["DCE","6",.69,.22],["ALE","5",.90,.30],["MD","7",.10,.60],["MCD","8",.31,.55],["MCE","10",.69,.55],["ME","11",.90,.60],["PL","9",.5,.80]]};
/* [código, u, v]: u = distância à baliza deles (0) até à nossa (1), v = de cima (0) para baixo (1) */
const SIS_ADV=Object.fromEntries(Object.entries(SIS_OBS).map(([k,L])=>[k,L.map(([c,,x,y])=>[c,+(y*.68).toFixed(3),x])]));
function slugEq(s){ return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60); }
function normCoresAdv(c){ const h=v=>/^#[0-9a-f]{6}$/i.test(String(v||""))?String(v).toUpperCase():null; return {cam:h(c?.cam)||CORES_ADV_DEF.cam,cam2:h(c?.cam2)||CORES_ADV_DEF.cam2,num:h(c?.num)||CORES_ADV_DEF.num,gr:h(c?.gr)||CORES_ADV_DEF.gr}; }
function normOnzeObs(o){ return o&&typeof o==="object"?{sis:String(o.sis||""),pos:Object.fromEntries(Object.entries(o.pos||{}).map(([k,v])=>[String(k),String(v)]))}:null; }
function normAdvEquipa(t,id){ const pl=Array.isArray(t?.plantel)?t.plantel.filter(p=>p&&typeof p==="object"):[];
  return {id:String(id||t?.id||""),nome:String(t?.nome||""),
    plantel:pl.map((p,i)=>({id:String(p.id||"p"+i),n:String(p.n??"").trim().slice(0,3),nome:String(p.nome??""),pos:String(p.pos??"").trim().toUpperCase().slice(0,6)})),
    sistema:SIS_ADV[t?.sistema]?t.sistema:"",onzeProv:normOnzeObs(t?.onzeProv),onzeAlt:normOnzeObs(t?.onzeAlt),cores:normCoresAdv(t?.cores),
    origem:t?.origem==="observacao"?"observacao":"manual",versaoImportada:t?.versaoImportada?String(t.versaoImportada):null,...(t?.importadoEm?{importadoEm:String(t.importadoEm)}:{})}; }
function normAdvJogo(a){ return {equipa:String(a?.equipa||""),sistema:SIS_ADV[a?.sistema]?a.sistema:"",cores:normCoresAdv(a?.cores),
    onze:Array.isArray(a?.onze)?a.onze.filter(o=>o&&typeof o==="object").slice(0,11).map(o=>({slot:String(o.slot||""),n:String(o.n??"").trim(),...(o.pid?{pid:String(o.pid)}:{}),pos:String(o.pos||""),x:+o.x||0,y:+o.y||0})):[],
    suplentes:Array.isArray(a?.suplentes)?[...new Set(a.suplentes.map(String).filter(Boolean))]:[]}; }   // ids dos jogadores (ou números, nos antigos)
function normSubsAdv(l){ return Array.isArray(l)?l.filter(s=>s&&s.sai&&s.entra).map((s,i)=>({id:String(s.id||"sa"+i),sai:String(s.sai),entra:String(s.entra),...(s.pidSai?{pidSai:String(s.pidSai)}:{}),...(s.pidEntra?{pidEntra:String(s.pidEntra)}:{}),min:String(s.min||""),c:+s.c||i})).sort((a,b)=>a.c-b.c):[]; }
function normEncaixe(e){ const xy=o=>Object.fromEntries(Object.entries(o&&typeof o==="object"?o:{}).filter(([,p])=>p&&isFinite(+p.x)&&isFinite(+p.y)).map(([k,p])=>[String(k),{x:Math.round(+p.x),y:Math.round(+p.y)}]));
  return {nos:xy(e?.nos),adv:xy(e?.adv)}; }
function advJ(){ return jogo.adv||normAdvJogo(null); }
function eqAdv(){ return advs[advJ().equipa]||null; }
/* jogadores pelo id (pid): dois jogadores podem ter o mesmo número; sem id (escrito à mão) vai pelo número */
function jogDe(o){ const T=eqAdv(); if(!T||!o) return null; return (o.pid&&T.plantel.find(p=>p.id===o.pid))||(o.n?T.plantel.find(p=>p.n===o.n):null)||null; }
const ehJog=(o,p)=>o.pid?o.pid===p.id:!!o.n&&o.n===p.n;
const ehSup=(A,p)=>A.suplentes.includes(p.id)||(!!p.n&&A.suplentes.includes(p.n));
function supAdv(A){ const T=eqAdv(); return A.suplentes.map(x=>{ const p=T&&(T.plantel.find(q=>q.id===x)||T.plantel.find(q=>q.n===x)); return p?{id:p.id,n:p.n,nome:p.nome}:{id:x,n:x,nome:""}; }).sort((a,b)=>byNum(a.n,b.n)); }
function nomeAdv(n,pid){ const p=jogDe({n,pid}); return p&&p.nome?p.nome:""; }
function rotAdv(n,pid){ const nm=nomeAdv(n,pid); return nm?`${n} · ${nm}`:n; }
const nomeCurtoAdv=nm=>{ const w=String(nm||"").trim().split(/\s+/).filter(Boolean); return w.length>2?w[0]+" "+w[w.length-1]:w.join(" "); };
function corTexto(hex){ const v=parseInt(String(hex).slice(1),16), r=v>>16&255, g=v>>8&255, b=v&255; return (r*299+g*587+b*114)/1000>150?"#000000":"#FFFFFF"; }
/* posições de um sistema no campo do separador (o mesmo do Onze) */
function posSisAdv(sis){ const [x0,y0,x1,y1]=FUNDOS.pitch.campo, w=x1-x0, h=y1-y0;
  return (SIS_ADV[sis]||SIS_ADV["4-3-3"]).map(([c,u,v])=>({slot:c,pos:c,x:Math.round(x1-u*w),y:Math.round(y0+v*h)})); }
/* muda o sistema: cada jogador fica na posição com o mesmo código; os outros ocupam as que sobram, pela ordem */
function onzeNoSistema(onze,sis){ const novo=posSisAdv(sis).map(p=>({...p,n:""})), sobra=[], poe=(p,o)=>{ p.n=o.n; if(o.pid) p.pid=o.pid; };
  onze.forEach(o=>{ if(!o.n&&!o.pid) return; const p=novo.find(q=>q.slot===o.slot&&!q.n&&!q.pid); if(p) poe(p,o); else sobra.push(o); });
  novo.forEach(p=>{ if(!p.n&&!p.pid&&sobra.length) poe(p,sobra.shift()); }); return novo; }
/* quem está em campo: o onze com as substituições aplicadas por ordem de minuto (as que não contam ficam de fora) */
function advEmCampo(semId){ const on=advJ().onze.map(o=>({...o})), ok=new Set();
  (jogo.subsAdv||[]).filter(s=>s.id!==semId).slice().sort((a,b)=>(minSeg(a.min)??1e9)-(minSeg(b.min)??1e9)||a.c-b.c)
    .forEach(s=>{ const o=on.find(x=>s.pidSai&&x.pid?x.pid===s.pidSai:!!x.n&&x.n===s.sai); if(o){ o.n=s.entra; if(s.pidEntra) o.pid=s.pidEntra; else delete o.pid; o.entrou=true; ok.add(s.id); } });
  return {on,ok}; }
function nosEmCampo(){ const on=jogo.onze.map(o=>({...o})); subsReais().lista.forEach(l=>{ const o=on.find(x=>x.n===l.sai); if(o){ o.n=l.entra; o.entrou=true; } }); return on; }
/* a escrever num campo (ou com uma lista aberta) não se refaz essa parte; depois de uma ação nossa larga-se o foco para a vista se refazer */
function ocupado(b){ const a=document.activeElement; return !!b&&b.contains(a)&&(a.tagName==="SELECT"||a.tagName==="INPUT"&&a.type!=="color"); }
function largaFoco(){ const a=document.activeElement, v=$("view-d"); if(a&&v&&v.contains(a)&&a.blur) a.blur(); }
function guardaAdvJogo(A,soft){ largaFoco(); guardaJogo({...jogo,adv:A},soft!==false); renderAdv(); }
function guardaEquipa(T,soft){ if(!soft) largaFoco(); advs[T.id]=normAdvEquipa(T,T.id); guardaLocal(); gravaDoc("adversarios/"+T.id,advs[T.id]); if(!soft) renderAdv(); }

/* ---------- quadro Encaixe: as duas equipas no mesmo campo, com as substituições das duas ---------- */
function desenhaEncaixe(o_={}){
  const toca=!o_.clean||!!o_.arrastar, A=advJ(), C=A.cores, E=normEncaixe(jogo.encaixe);
  const svg=el("svg",{viewBox:`0 0 ${W} ${H}`,role:"img","aria-label":"Encaixe das duas equipas"});
  campo(svg,false);
  const t=el("text",{x:9300,y:6050,"font-size":30*PT,"font-weight":700,class:"legtxt"},svg);
  el("tspan",{fill:"#000"},t).textContent="Encaixe"; if(jogo.adversario) el("tspan",{fill:"#C00000"},t).textContent=" · vs "+jogo.adversario;
  const adv=advEmCampo(), sN=subsReais().lista.map(l=>`${l.sai}→${l.entra}${l.min?` ${l.min}'`:""}`), sA=(jogo.subsAdv||[]).filter(s=>adv.ok.has(s.id)).map(s=>`${s.sai}→${s.entra}${s.min?` ${s.min}'`:""}`);
  const rod=!A.onze.length?["Sem onze do adversário: preenche-o no separador Adversário.",""]:sN.length||sA.length?["Substituições:  ",[sN.length?"SCA "+sN.join(", "):"",sA.length?(jogo.adversario||"Adversário")+" "+sA.join(", "):""].filter(Boolean).join("   ·   ")]:null;
  if(rod){ const fs=12*PT, t2=el("text",{x:2800,y:66350,"font-size":fs,class:"legtxt"},svg);
    el("tspan",{fill:"#C00000","font-weight":800},t2).textContent=rod[0]; el("tspan",{fill:"#1B1A17","font-weight":700},t2).textContent=rod[1];
    if(textW(rod[0]+rod[1],fs,700)>86000){ t2.setAttribute("textLength",86000); t2.setAttribute("lengthAdjust","spacingAndGlyphs"); } }
  const peca=(k,o,e)=>{ const p=E[k][o.slot]||{x:o.x,y:o.y}, r=1450, quem=k==="nos"?"SC Angrense":(jogo.adversario||"Adversário");
    const g=el("g",{class:"bola",tabindex:toca?0:-1,role:toca?"button":"presentation","aria-label":`${quem} ${o.n||o.pos||""}`},svg);
    el("circle",{cx:p.x,cy:p.y,r:r*1.6,fill:"transparent"},g);
    el("circle",{cx:p.x,cy:p.y,r,fill:e.fill,stroke:e.stroke,"stroke-width":e.sw},g);
    el("text",{x:p.x,y:p.y+14*PT*.35,"text-anchor":"middle","font-size":14*PT,fill:e.color,class:"num"},g).textContent=o.n||"?";
    { const nm=nomeCurtoAdv(k==="nos"?nome(o.n):nomeAdv(o.n,o.pid)); if(nm) etiqueta(g,p.x,p.y+r+260,nm,10.5*PT); }
    if(o.entrou) el("circle",{cx:p.x+r*.78,cy:p.y-r*.78,r:r*.3,fill:"#2E9E4F",stroke:"#FFFFFF","stroke-width":70},g);
    if(!toca) return;
    const mostra=()=>{ const nm=k==="nos"?nome(o.n):nomeAdv(o.n,o.pid); toast(`${quem} · ${o.n||"?"}${nm?" · "+nm:""}${o.pos?" · "+o.pos:""}${o.entrou?" · entrou":""}`); };
    let start=null, moved=false;
    g.addEventListener("touchstart",ev=>{ ev.preventDefault(); },{passive:false});
    g.addEventListener("pointerdown",ev=>{ ev.preventDefault(); g.setPointerCapture(ev.pointerId); start=svgPt(svg,ev); moved=false; dragging=true; });
    g.addEventListener("pointermove",ev=>{ if(!start) return; const q=svgPt(svg,ev), dx=q.x-start.x, dy=q.y-start.y; if(Math.hypot(dx,dy)>350) moved=true; if(moved) g.setAttribute("transform",`translate(${dx} ${dy})`); });
    g.addEventListener("pointerup",ev=>{ if(!start) return; const q=svgPt(svg,ev), dx=q.x-start.x, dy=q.y-start.y; start=null; dragging=false;
      if(moved){ pushUndo({tipo:"encaixe",antes:normEncaixe(jogo.encaixe)}); const N=normEncaixe(jogo.encaixe); N[k][o.slot]={x:Math.round(p.x+dx),y:Math.round(p.y+dy)}; guardaJogo({...jogo,encaixe:N},true); } else mostra(); });
    g.addEventListener("pointercancel",()=>{ start=null; dragging=false; render(); });
    g.addEventListener("keydown",ev=>{ if(ev.key==="Enter"||ev.key===" "){ ev.preventDefault(); mostra(); } });
  };
  nosEmCampo().forEach((o,i)=>{ const e=i===0?ESTILOS.gr:ESTILOS.normal; peca("nos",o,{fill:e.fill,stroke:e.stroke,sw:110,color:e.color}); });
  adv.on.forEach((o,i)=>{ const gr=o.slot==="GR"||(i===0&&!adv.on.some(x=>x.slot==="GR")); peca("adv",o,gr?{fill:C.gr,stroke:C.cam2,sw:160,color:corTexto(C.gr)}:{fill:C.cam,stroke:C.cam2,sw:160,color:C.num}); });
  return svg;
}

/* ---------- separador Adversário ---------- */
function desenhaAdvOnze(){
  const A=advJ(), C=A.cores, svg=el("svg",{viewBox:`0 0 ${W} ${H}`,role:"img","aria-label":"Onze do adversário"});
  campo(svg,false);
  const t=el("text",{x:9300,y:6050,"font-size":30*PT,"font-weight":700,class:"legtxt"},svg);
  el("tspan",{fill:"#000"},t).textContent="Onze adversário"; if(jogo.adversario) el("tspan",{fill:"#C00000"},t).textContent=" · "+jogo.adversario+(A.sistema?" · "+A.sistema:"");
  if(A.suplentes.length){ const fs=12*PT, t2=el("text",{x:2800,y:66350,"font-size":fs,class:"legtxt"},svg);
    el("tspan",{fill:"#C00000","font-weight":800},t2).textContent="Suplentes:  ";
    const txt=supAdv(A).map(x=>[x.n,x.nome].filter(Boolean).join(" ")).join("   ·   "); el("tspan",{fill:"#1B1A17","font-weight":700},t2).textContent=txt;
    if(textW("Suplentes:  "+txt,fs,700)>86000){ t2.setAttribute("textLength",86000); t2.setAttribute("lengthAdjust","spacingAndGlyphs"); } }
  A.onze.forEach((o,i)=>{ const r=1750, gr=o.slot==="GR", e=gr?{fill:C.gr,color:corTexto(C.gr)}:{fill:C.cam,color:C.num};
    const g=el("g",{class:"bola",tabindex:0,role:"button","aria-label":`${o.pos||""} ${o.n||"vazio"}`},svg);
    el("circle",{cx:o.x,cy:o.y,r:r*1.6,fill:"transparent"},g);
    el("circle",{cx:o.x,cy:o.y,r,fill:e.fill,stroke:C.cam2,"stroke-width":180,...(o.n||o.pid?{}:{"stroke-dasharray":"500 300","fill-opacity":.45})},g);
    el("text",{x:o.x,y:o.y+15*PT*.35,"text-anchor":"middle","font-size":15*PT,fill:e.color,class:"num"},g).textContent=o.n||"?";
    const lab=[o.pos,nomeAdv(o.n,o.pid)].filter(Boolean).join(" · "); if(lab) etiqueta(g,o.x,o.y+r+250,lab,9*PT);
    let start=null, moved=false;
    g.addEventListener("touchstart",ev=>{ ev.preventDefault(); },{passive:false});
    g.addEventListener("pointerdown",ev=>{ ev.preventDefault(); g.setPointerCapture(ev.pointerId); start=svgPt(svg,ev); moved=false; dragging=true; });
    g.addEventListener("pointermove",ev=>{ if(!start) return; const q=svgPt(svg,ev), dx=q.x-start.x, dy=q.y-start.y; if(Math.hypot(dx,dy)>350) moved=true; if(moved) g.setAttribute("transform",`translate(${dx} ${dy})`); });
    g.addEventListener("pointerup",ev=>{ if(!start) return; const q=svgPt(svg,ev), dx=q.x-start.x, dy=q.y-start.y; start=null; dragging=false;
      if(moved){ pushUndo({tipo:"advonze",antes:clone(A.onze)}); const N=clone(A); N.onze[i].x=Math.round(o.x+dx); N.onze[i].y=Math.round(o.y+dy); guardaAdvJogo(N); } else folhaAdvOnze(i); });
    g.addEventListener("pointercancel",()=>{ start=null; dragging=false; renderAdv(); });
    g.addEventListener("keydown",ev=>{ if(ev.key==="Enter"||ev.key===" "){ ev.preventDefault(); folhaAdvOnze(i); } }); });
  return svg; }
/* grelha de jogadores do adversário: um botão por jogador (mesmo com números repetidos), com pesquisa
   e, quando se escolhe para uma posição, os dessa posição primeiro (depois a mesma zona, depois os outros) */
const GRUPO_POS={GR:"GR",LD:"LAT",LE:"LAT",ALD:"LAT",ALE:"LAT",DD:"LAT",DE:"LAT",DC:"DC",DCD:"DC",DCE:"DC",MDC:"MDC",MDCD:"MDC",MDCE:"MDC",MC:"MC",MCD:"MC",MCE:"MC",MO:"MC",MD:"ALA",ME:"ALA",ED:"EXT",EE:"EXT",AVD:"EXT",AVE:"EXT",PL:"PL",PLD:"PL",PLE:"PL"};
function afinidade(pos,alvo){ pos=String(pos||"").toUpperCase(); alvo=String(alvo||"").toUpperCase(); if(!alvo) return 2; if(pos===alvo) return 0; return GRUPO_POS[pos]&&GRUPO_POS[pos]===GRUPO_POS[alvo]?1:2; }
const semAcAdv=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function grelhaAdv(box,itens,o){
  box.innerHTML=(o.pesquisa?`<input type="search" class="ga-q" placeholder="Procurar nº, nome ou posição" aria-label="Procurar jogador">`:"")+`<div class="pgrid"></div>`;
  const g=box.querySelector(".pgrid"), pri=x=>o.primeiro&&o.primeiro(x)?0:1;
  const ord=itens.map(x=>({...x,af:afinidade(x.pos,o.alvo)})).sort((a,b)=>pri(a)-pri(b)||a.af-b.af||byNum(a.n,b.n)||String(a.nome).localeCompare(String(b.nome),"pt"));
  const marca=k=>g.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===k)));
  let sep=false;
  ord.forEach(x=>{ if(o.alvo&&x.af===2&&pri(x)&&!sep&&ord.some(y=>y.af<2||!pri(y))){ sep=true; const t=document.createElement("p"); t.className="sub ga-sep"; t.style.cssText="grid-column:1/-1;margin:2px 0 0"; t.textContent="Outras posições"; g.appendChild(t); }
    const b=document.createElement("button"); b.type="button"; b.dataset.k=x.k; b.dataset.n=x.n||""; b.dataset.q=semAcAdv(`${x.n} ${x.nome} ${x.pos}`);
    b.innerHTML=`<b></b><span></span><small></small>`; b.querySelector("b").textContent=x.n||"–"; b.querySelector("span").textContent=x.nome||" ";
    b.querySelector("small").textContent=[x.pos,x.marca].filter(Boolean).join(" · "); b.onclick=()=>{ marca(x.k); o.onPick(x); }; g.appendChild(b); });
  if(o.sel) marca(o.sel);
  const q=box.querySelector(".ga-q"); if(q) q.addEventListener("input",()=>{ const t=semAcAdv(q.value.trim()); g.querySelectorAll("button").forEach(b=>b.hidden=!!t&&!b.dataset.q.includes(t)); g.querySelectorAll(".ga-sep").forEach(x=>x.hidden=!!t); });
  return {marca}; }
function folhaAdvOnze(i){ const A=advJ(), o=A.onze[i], T=eqAdv(); if(!o) return; const p0=jogDe(o), pl=T?T.plantel.filter(p=>p.n||p.nome):[];
  folha(`<h3><span class="big"></span> · onze adversário</h3>
    <div class="fields"><label class="f">Posição (sigla)<input type="text" id="ao-pos" maxlength="6"></label><label class="f">Número<input type="text" id="ao-n" inputmode="numeric" maxlength="3" placeholder="Ex.: 9"></label></div>
    <h4>Plantel ${T?esc(T.nome):""}</h4><div id="ao-g"></div>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ao-ok">Guardar</button></div>`,(s,fecha)=>{
    s.querySelector(".big").textContent=o.n||o.pid?rotAdv(o.n,o.pid):(o.pos||"Posição vazia");
    const ip=s.querySelector("#ao-pos"), inn=s.querySelector("#ao-n"), box=s.querySelector("#ao-g"); ip.value=o.pos||""; inn.value=o.n||""; let sel=p0?p0.id:null, G=null;
    if(!pl.length) box.innerHTML=`<p class="sub" style="margin:0">Sem jogadores no plantel desta equipa: escreve só o número ou acrescenta o plantel no separador.</p>`;
    else G=grelhaAdv(box,pl.map(p=>{ const j=A.onze.findIndex(x=>ehJog(x,p)); return {k:p.id,n:p.n,nome:p.nome,pos:p.pos,marca:j>=0&&j!==i?"titular · troca":ehSup(A,p)?"suplente":""}; }),
      {alvo:o.pos||o.slot,sel,pesquisa:true,onPick:x=>{ sel=x.k; inn.value=x.n; }});
    inn.addEventListener("input",()=>{ const p=sel&&pl.find(x=>x.id===sel); if(!p||p.n!==inn.value.trim()){ sel=null; if(G) G.marca(null); } });
    s.querySelector("#ao-ok").onclick=()=>{ const n=inn.value.trim(), p=sel?pl.find(x=>x.id===sel):null, N=clone(advJ());
      const j=N.onze.findIndex((x,k)=>k!==i&&(p?ehJog(x,p):!!n&&!x.pid&&x.n===n));
      if(j>=0){ N.onze[j].n=o.n; if(o.pid) N.onze[j].pid=o.pid; else delete N.onze[j].pid; }   // troca entre titulares
      N.onze[i].n=p?p.n:n; if(p) N.onze[i].pid=p.id; else delete N.onze[i].pid; N.onze[i].pos=ip.value.trim().toUpperCase();
      N.suplentes=N.suplentes.filter(x=>p?x!==p.id&&x!==p.n:x!==n); fecha(); guardaAdvJogo(N); }; }); }
function escolheEquipa(id){ const T=advs[id]; if(!T) return; const A=clone(advJ()); A.equipa=id; A.cores=clone(T.cores);
  if(!A.onze.length){ A.sistema=T.sistema||"4-4-2"; A.onze=posSisAdv(A.sistema).map(p=>({...p,n:""})); }
  guardaAdvJogo(A); }
function criaEquipa(nome_){ nome_=String(nome_||"").trim(); if(!nome_){ toast("Escreve o nome da equipa."); return; }
  const id=slugEq(nome_)||"eq-"+Date.now().toString(36);
  if(!advs[id]) guardaEquipa({id,nome:nome_,plantel:[],sistema:"",cores:CORES_ADV_DEF,origem:"manual",versaoImportada:null},true);
  escolheEquipa(id); }
function folhaNovaEquipa(){ folha(`<h3>Nova equipa adversária</h3><label class="f">Nome<input type="text" id="ne-n" maxlength="60" placeholder="Ex.: SC Barreiro"></label>
    <p class="sub" style="margin:0">O plantel fica guardado e serve para todos os jogos contra esta equipa.</p>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ne-ok">Criar</button></div>`,(s,fecha)=>{
    const i=s.querySelector("#ne-n"); i.value=jogo.adversario||""; s.querySelector("#ne-ok").onclick=()=>{ if(!i.value.trim()){ toast("Escreve o nome da equipa."); return; } fecha(); criaEquipa(i.value); }; }); }
let dPlT=null;
function lePlantelAdv(T){ const box=$("d-pl"); if(!box) return T; const rows=[...box.querySelectorAll("[data-pid]")];
  return {...T,plantel:T.plantel.map(p=>{ const r=rows.find(x=>x.dataset.pid===p.id); return r?{...p,n:r.querySelector(".dp-n").value.trim(),nome:r.querySelector(".dp-nome").value,pos:r.querySelector(".dp-pos").value.trim().toUpperCase()}:p; })}; }
function renderAdv(){ const v=$("view-d"); if(!v||v.hidden) return; if(dragging) return;
  const A=advJ(), T=eqAdv(), lst=Object.values(advs).sort((a,b)=>a.nome.localeCompare(b.nome,"pt")), sug=slugEq(jogo.adversario);
  $("d-tit").textContent=jogo.adversario?"vs "+jogo.adversario:"Adversário do jogo";
  const st=$("dstage"); st.innerHTML="";
  if(A.onze.length) st.appendChild(desenhaAdvOnze());
  else st.innerHTML=`<p class="sub" style="padding:24px 16px;margin:0">${T?"Escolhe o sistema para pôr o onze no campo.":"Escolhe a equipa adversária (ou cria-a) para começar o onze."}</p>`;
  const fm=$("d-form");
  if(!ocupado(fm)){
    fm.innerHTML=`<button class="btn" id="d-imp" style="align-self:flex-start" title="Ficheiro exportado no plantel base da SCA Observação">⬆ Importar da Observação</button>
      <label class="f">Equipa (plantel)<select id="d-eq"><option value="">— Escolhe a equipa —</option>${lst.map(t=>`<option value="${esc(t.id)}">${esc(t.nome)} · ${t.plantel.length} jog.</option>`).join("")}<option value="__nova">+ Nova equipa…</option></select></label>
      ${!T&&jogo.adversario?(advs[sug]?`<button class="btn" id="d-usa">Usar o plantel de ${esc(advs[sug].nome)}</button>`:`<button class="btn" id="d-cria">Criar a equipa «${esc(jogo.adversario)}»</button>`):""}
      ${!jogo.adversario?`<p class="sub" style="margin:0">Escreve o adversário no separador Jogo.</p>`:""}
      ${T?`<div class="fields"><label class="f">Sistema<select id="d-sis"><option value="">—</option>${Object.keys(SIS_ADV).map(k=>`<option>${k}</option>`).join("")}</select></label>
        <div class="f" style="justify-content:flex-end;display:flex;gap:6px;align-items:flex-end"><button class="btn sm" id="d-rep" title="Põe as bolinhas no sítio do sistema, com os mesmos jogadores">↺ Repor posições</button></div></div>
      <div class="d-cores">${[["cam","Camisola"],["cam2","Contorno"],["num","Número"],["gr","Guarda-redes"]].map(([k,l])=>`<label>${l}<input type="color" id="d-c-${k}" value="${A.cores[k].toLowerCase()}"></label>`).join("")}</div>
      <p class="sub" style="margin:0">Origem do plantel: ${T.origem==="observacao"?`importado da SCA Observação${T.versaoImportada?" ("+esc(T.versaoImportada)+")":""}`:"manual"}</p>
      <button class="btn danger sm" id="d-limpa" style="align-self:flex-start">Limpar o onze deste jogo</button>`:""}`;
    $("d-imp").onclick=()=>$("d-file").click();
    const sl=$("d-eq"); sl.value=T?T.id:""; sl.onchange=()=>{ const v_=sl.value; if(v_==="__nova"){ sl.value=T?T.id:""; folhaNovaEquipa(); return; } if(v_) escolheEquipa(v_); else guardaAdvJogo({...clone(A),equipa:""}); };
    if($("d-usa")) $("d-usa").onclick=()=>escolheEquipa(sug); if($("d-cria")) $("d-cria").onclick=()=>criaEquipa(jogo.adversario);
    if(T){ $("d-sis").value=A.sistema||""; $("d-sis").onchange=e=>{ const s_=e.target.value; if(!s_) return; const N=clone(advJ()); N.sistema=s_; N.onze=onzeNoSistema(N.onze,s_); pushUndo({tipo:"advonze",antes:clone(A.onze)});
        if(!T.sistema) guardaEquipa({...T,sistema:s_},true); guardaAdvJogo(N); };
      $("d-rep").onclick=()=>{ const N=clone(advJ()); if(!N.sistema){ toast("Escolhe primeiro o sistema."); return; } pushUndo({tipo:"advonze",antes:clone(N.onze)}); N.onze=onzeNoSistema(N.onze,N.sistema); guardaAdvJogo(N); };
      ["cam","cam2","num","gr"].forEach(k=>$("d-c-"+k).onchange=e=>{ const N=clone(advJ()); N.cores={...N.cores,[k]:e.target.value.toUpperCase()}; guardaEquipa({...eqAdv(),cores:N.cores},true); guardaAdvJogo(N); });
      confirma2($("d-limpa"),"Toca outra vez para limpar",()=>{ const N=clone(advJ()); pushUndo({tipo:"advonze",antes:clone(N.onze)}); N.onze=N.onze.map(o=>({...o,n:""})); N.suplentes=[]; guardaAdvJogo(N); toast("Onze do adversário limpo"); }); } }
  // plantel da equipa
  const pc=$("d-plcard"); pc.hidden=!T; $("d-pltit").textContent=T?"Plantel · "+T.nome:"Plantel"; $("d-npl").textContent=T?T.plantel.length:0;
  const box=$("d-pl");
  if(T&&!ocupado(box)){
    box.innerHTML=T.plantel.length?T.plantel.map(p=>`<div class="dp-row" data-pid="${esc(p.id)}"><input type="text" class="dp-n" inputmode="numeric" maxlength="3" placeholder="Nº" aria-label="Número" value="${esc(p.n)}"><input type="text" class="dp-nome" placeholder="Nome" aria-label="Nome" value="${esc(p.nome)}"><input type="text" class="dp-pos" maxlength="6" placeholder="Pos." aria-label="Posição" value="${esc(p.pos)}"><button class="btn sm ghost dp-x" aria-label="Tirar do plantel">✕</button></div>`).join("")
      :`<p class="sub" style="margin:0">Ainda sem jogadores. Acrescenta número, nome e posição (ex.: DC, MC, PL).</p>`;
    box.querySelectorAll("input").forEach(i=>i.addEventListener("input",()=>{ clearTimeout(dPlT); dPlT=setTimeout(()=>{ const T2=eqAdv(); if(T2) guardaEquipa(lePlantelAdv(T2),true); },600); }));
    box.querySelectorAll(".dp-x").forEach(b=>confirma2(b,"Tirar?",()=>{ const T2=eqAdv(), id=b.closest("[data-pid]").dataset.pid; clearTimeout(dPlT); const L2=lePlantelAdv(T2); guardaEquipa({...L2,plantel:L2.plantel.filter(p=>p.id!==id)}); })); }
  // suplentes do jogo (um por jogador, mesmo com números repetidos)
  const sp=$("d-sup"); sp.innerHTML=""; $("d-nsup").textContent=A.suplentes.length;
  if(T){ T.plantel.filter(p=>(p.n||p.nome)&&!A.onze.some(o=>ehJog(o,p))).sort((a,b)=>byNum(a.n,b.n)).forEach(p=>{ const b=document.createElement("button"); b.className="chip"; b.setAttribute("aria-pressed",String(ehSup(A,p)));
      b.innerHTML=`<b></b><span></span>`; b.children[0].textContent=p.n||"–"; b.children[1].textContent=p.nome;
      b.onclick=()=>{ const N=clone(advJ()); N.suplentes=ehSup(N,p)?N.suplentes.filter(x=>x!==p.id&&x!==p.n):[...N.suplentes,p.id]; guardaAdvJogo(N); }; sp.appendChild(b); }); }
  if(!sp.childElementCount) sp.innerHTML=`<p class="sub" style="margin:0">${T?"Os jogadores do plantel que não são titulares aparecem aqui.":"Escolhe primeiro a equipa."}</p>`;
  filtraPlantelAdv();
}
/* pesquisa no plantel do separador */
function filtraPlantelAdv(){ const q=$("d-plq"), t=semAcAdv(q?q.value.trim():""); document.querySelectorAll("#d-pl .dp-row").forEach(r=>{ r.hidden=!!t&&![...r.querySelectorAll("input")].some(i=>semAcAdv(i.value).includes(t)); }); }
$("d-plq").addEventListener("input",filtraPlantelAdv);
/* ---------- importar da SCA Observação (Fase 2): ficheiro exportado no plantel base da Observação ---------- */
function eqDoFicheiro(P){ const id=slugEq((P.equipa&&(P.equipa.id||P.equipa.nome))||"")||"eq-"+Date.now().toString(36); return {id,nome:String((P.equipa&&P.equipa.nome)||id)}; }
/* onze da Observação {sis, pos {código: idJogador}} → onze do jogo com os números do plantel */
function onzeDeObs(o,pl){ const sis=o&&SIS_ADV[o.sis]?o.sis:null; if(!sis) return null;
  return {sis,onze:posSisAdv(sis).map(p=>{ const j=pl.find(x=>x.id===(o.pos||{})[p.slot]); return j?{...p,n:j.n,pid:j.id}:{...p,n:""}; })}; }
function folhaImportaAdv(P){ const {id,nome}=eqDoFicheiro(P), T=advs[id], pl=P.plantel, prov=onzeDeObs(P.onzeProv,pl), alt=!!(P.onzeAlt&&SIS_ADV[P.onzeAlt.sis]), A=advJ(), outro=A.equipa&&A.equipa!==id;
  folha(`<h3>Importar da SCA Observação · ${esc(nome)}</h3>
    <p class="sub" style="margin:0">${pl.length} jogadores (${pl.filter(p=>p.n).length} com número)${P.sistema?" · sistema "+esc(P.sistema):""}${prov?" · onze provável ("+esc(prov.sis)+")":""}${alt?" · onze alternativo":""}.<br>Origem: ${esc(P.fonte||"SCA Observação")}.</p>
    ${T&&T.plantel.length?`<p class="sub" style="margin:0;color:var(--red)"><b>Substitui o plantel de ${esc(T.nome)} que está no Match Center (${T.plantel.length} jogadores).</b></p>`:""}
    ${prov?`<label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="ia-jogo"${outro?"":" checked"} style="accent-color:var(--red);width:20px;height:20px"> Usar no jogo atual${jogo.adversario?" (vs "+esc(jogo.adversario)+")":""}: equipa, cores e onze provável</label>`:""}
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ia-ok">Importar</button></div>`,(s_,fecha)=>{
    const ok=s_.querySelector("#ia-ok"), faz=()=>{ const c=s_.querySelector("#ia-jogo"), usa=!!(c&&c.checked); fecha(); importaAdv(P,usa); };
    if(T&&T.plantel.length) confirma2(ok,"Toca outra vez para substituir",faz); else ok.onclick=faz; }); }
function importaAdv(P,usaNoJogo){ const {id,nome}=eqDoFicheiro(P), T0=advs[id]||{}, cores=normCoresAdv(P.cores);
  const versao=`${P.fonte||"SCA Observação"} · exportado a ${new Date(P.exportadoEm||Date.now()).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})}`;
  guardaEquipa({...T0,id,nome,plantel:P.plantel.map((p,i)=>({id:String(p.id||"o"+i),n:String(p.n||""),nome:String(p.nome||""),pos:String(p.pos||"")})),
    sistema:SIS_ADV[P.sistema]?P.sistema:(T0.sistema||""),cores,onzeProv:P.onzeProv||null,onzeAlt:P.onzeAlt||null,origem:"observacao",versaoImportada:versao,importadoEm:new Date().toISOString()},usaNoJogo);
  if(usaNoJogo){ const pl=advs[id].plantel, o=onzeDeObs(P.onzeProv,pl), N=clone(advJ()); pushUndo({tipo:"advonze",antes:clone(N.onze)});
    N.equipa=id; N.cores=cores; if(o){ N.sistema=o.sis; N.onze=o.onze; } else if(!N.onze.length){ N.sistema=advs[id].sistema||"4-3-3"; N.onze=posSisAdv(N.sistema).map(p=>({...p,n:""})); }
    N.suplentes=N.suplentes.filter(x=>{ const p=pl.find(q=>q.id===x)||pl.find(q=>q.n===x); return p&&!N.onze.some(o=>ehJog(o,p)); }); guardaAdvJogo(N); }
  toast(`Plantel de ${nome} importado da Observação · ${P.plantel.length} jogadores`); }
$("d-file").onchange=async e=>{ const f=e.target.files[0]; e.target.value=""; if(!f) return; let P=null; try{ P=JSON.parse(await f.text()); }catch(err){}
  if(!P||P.app!=="SCA Observação"||P.tipo!=="plantel-adversario"||!Array.isArray(P.plantel)){ toast("Este ficheiro não é um plantel exportado da SCA Observação."); return; }
  folhaImportaAdv(P); };
$("d-pladd").onclick=()=>{ const T=eqAdv(); if(!T) return; clearTimeout(dPlT); const L2=lePlantelAdv(T), id="p"+Date.now().toString(36);
  guardaEquipa({...L2,plantel:[...L2.plantel,{id,n:"",nome:"",pos:""}]}); const i=$("d-pl").querySelector(`[data-pid="${id}"] .dp-n`); if(i) i.focus(); };

/* ---------- substituições do adversário (separador Jogo): não mexem nos quadros de bolas paradas ---------- */
function renderSubsAdv(){ const ul=$("j-sa"); if(!ul) return; const L=(jogo.subsAdv||[]).slice().sort((a,b)=>(minSeg(a.min)??1e9)-(minSeg(b.min)??1e9)||a.c-b.c), ok=advEmCampo().ok;
  $("j-nsa").textContent=L.length; ul.innerHTML="";
  if(!L.length){ ul.innerHTML=`<li class="sub">Ainda sem substituições do adversário.</li>`; return; }
  L.forEach(s=>{ const li=document.createElement("li"); li.setAttribute("role","button"); li.tabIndex=0;
    li.innerHTML=`<b class="t"></b><span class="tx"></span><button class="btn sm ghost" aria-label="Apagar">✕</button>`;
    li.querySelector(".t").textContent=(s.min||"–")+"'"; li.querySelector(".tx").textContent=`sai ${rotAdv(s.sai,s.pidSai)} · entra ${rotAdv(s.entra,s.pidEntra)}${ok.has(s.id)?"":" · ⚠ não conta (quem sai não estava em campo)"}`;
    li.onclick=()=>folhaSubAdv(s.id); li.onkeydown=e=>{ if(e.key==="Enter") folhaSubAdv(s.id); };
    const x=li.querySelector("button"); x.addEventListener("click",e=>e.stopPropagation()); confirma2(x,"Apagar?",()=>guardaJogo({...jogo,subsAdv:jogo.subsAdv.filter(y=>y.id!==s.id)}));
    ul.appendChild(li); }); }
function folhaSubAdv(id){ const S0=id?(jogo.subsAdv||[]).find(s=>s.id===id):null, A=advJ(), T=eqAdv(), on=advEmCampo(id).on.filter(o=>o.n||o.pid);
  const pl=T?T.plantel.filter(p=>p.n||p.nome):[], fora=pl.filter(p=>!on.some(o=>ehJog(o,p))), kOn=o=>o.pid||"n:"+o.n;
  folha(`<h3>${S0?"Editar":"Nova"} substituição · ${esc(jogo.adversario||"Adversário")}</h3>
    <label class="f">Minuto<input type="text" id="sa-min" inputmode="numeric" maxlength="6" placeholder="Ex.: 63 ou 45+2"></label>
    <h4>Sai</h4><div id="sa-g1"></div><label class="f">Número de quem sai<input type="text" id="sa-n1" inputmode="numeric" maxlength="3"></label>
    <h4>Entra</h4><div id="sa-g2"></div><label class="f">Número de quem entra<input type="text" id="sa-n2" inputmode="numeric" maxlength="3"></label>
    <div class="actions">${S0?`<button class="btn danger l" id="sa-del">Apagar</button>`:""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="sa-ok">Guardar</button></div>`,(s_,fecha)=>{
    const im=s_.querySelector("#sa-min"), n1=s_.querySelector("#sa-n1"), n2=s_.querySelector("#sa-n2"), g1=s_.querySelector("#sa-g1"), g2=s_.querySelector("#sa-g2");
    im.value=S0?S0.min:""; n1.value=S0?S0.sai:""; n2.value=S0?S0.entra:"";
    let s1=S0?(S0.pidSai||"n:"+S0.sai):null, s2=S0?(S0.pidEntra||null):null, G1=null, G2=null;
    /* quem entra: suplentes primeiro e, entre eles, os da posição de quem sai */
    const montaEntra=alvo=>{ if(!fora.length){ g2.innerHTML=`<p class="sub" style="margin:0">Sem jogadores fora do onze no plantel: escreve o número.</p>`; return; }
      G2=grelhaAdv(g2,fora.map(p=>({k:p.id,n:p.n,nome:p.nome,pos:p.pos,marca:ehSup(A,p)?"suplente":"",sup:ehSup(A,p)})),{alvo,sel:s2,pesquisa:true,primeiro:x=>x.sup,onPick:x=>{ s2=x.k; n2.value=x.n; }}); };
    const posDe=k=>{ const o=on.find(x=>kOn(x)===k); return o?(o.pos||o.slot):""; };
    if(on.length) G1=grelhaAdv(g1,on.map(o=>({k:kOn(o),n:o.n,nome:nomeAdv(o.n,o.pid),pos:o.pos||o.slot,pid:o.pid})),{sel:s1,onPick:x=>{ s1=x.k; n1.value=x.n; montaEntra(x.pos); }});
    else g1.innerHTML=`<p class="sub" style="margin:0">Sem onze do adversário: escreve o número.</p>`;
    montaEntra(s1?posDe(s1):"");
    n1.addEventListener("input",()=>{ const o=on.find(x=>kOn(x)===s1); if(!o||o.n!==n1.value.trim()){ s1=null; if(G1) G1.marca(null); } });
    n2.addEventListener("input",()=>{ const p=pl.find(x=>x.id===s2); if(!p||p.n!==n2.value.trim()){ s2=null; if(G2) G2.marca(null); } });
    const del=s_.querySelector("#sa-del"); if(del) confirma2(del,"Toca outra vez para apagar",()=>{ fecha(); guardaJogo({...jogo,subsAdv:jogo.subsAdv.filter(y=>y.id!==id)}); toast("Substituição do adversário apagada"); });
    s_.querySelector("#sa-ok").onclick=()=>{ const min=im.value.trim().replace(/['’]/g,""), sai=n1.value.trim(), entra=n2.value.trim(), o1=on.find(x=>kOn(x)===s1), pidSai=o1&&o1.pid||"", pidEntra=s2||"";
      if(!min){ toast("Escreve o minuto."); return; } if(!sai&&!pidSai||!entra&&!pidEntra){ toast("Escolhe quem sai e quem entra."); return; }
      if(pidSai&&pidEntra?pidSai===pidEntra:sai===entra){ toast("Quem sai e quem entra têm de ser diferentes."); return; }
      const S={id:S0?S0.id:"sa"+Date.now().toString(36),sai,entra,...(pidSai?{pidSai}:{}),...(pidEntra?{pidEntra}:{}),min,c:S0?S0.c:Date.now()}, L=(jogo.subsAdv||[]).filter(y=>y.id!==S.id);
      fecha(); guardaJogo({...jogo,subsAdv:[...L,S]}); const conta=advEmCampo().ok.has(S.id);
      toast(`🔁 ${jogo.adversario||"Adversário"} · ${min}' · sai ${rotAdv(sai,pidSai)} · entra ${rotAdv(entra,pidEntra)}${conta?"":" · ⚠ não conta (quem sai não estava em campo)"}`); }; }); }
$("j-sa-add").onclick=()=>folhaSubAdv(null);
