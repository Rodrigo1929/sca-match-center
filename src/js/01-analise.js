/* ---------- análise ---------- */
const TECLAS_DEF={rec:"R",per:"P",re:"E",rd:"D",rb:"B",golo:"G",pc:"K",cr:"C",dg:"U",dp:"I",fc:"F",fs:"J",can:"N",fj:"O",dgr:"Q",ca:"A",cv:"V"}, TECLAS_RES="TXZS";
const ACOES_DEF=[["rec","Recuperação de bola","#1E7A46"],["per","Perda de bola","#C00000"],["re","Remate enquadrado","#1F497D"],["rd","Remate desenquadrado","#7F9CC0"],["rb","Remate bloqueado","#5B6B80"],["golo","Golo","#B8963F"],["pc","Passe chave","#2E8B57"],["cr","Cruzamento","#8064A2"],["dg","Duelo ganho","#4BACC6"],["dp","Duelo perdido","#E07B39"],["fc","Falta cometida","#8B5A2B"],["fs","Falta sofrida","#A0785A"],["can","Canto","#6B675E"],["fj","Fora de jogo","#9A958B"],["dgr","Defesa do GR","#00B0F0"],["ca","Cartão amarelo","#E6B000"],["cv","Cartão vermelho","#8B0000"]].map(([id,nome,cor])=>({id,nome,cor,tecla:TECLAS_DEF[id]||"",dir:["per","re","rd","rb","golo","pc","cr"].includes(id),tipos:id==="per"?["Passe falhado","Drible perdido","Receção falhada"]:[]}));
let anCfg={acoes:ACOES_DEF.slice()};
let an={regs:[],posse:{estado:"",parte:1,inicio:0,acum:{"1":{nos:0,eles:0,div:0,fora:0},"2":{nos:0,eles:0,div:0,fora:0}}},ataque:{"1":"dir","2":"esq"}};
const VSTATS=[["rem","Remates"],["enq","Remates enquadrados"],["can","Cantos"],["fal","Faltas cometidas"],["fj","Foras de jogo"]];
function vZero(){ const z=()=>Object.fromEntries(VSTATS.map(([k])=>[k,0])); return {"1":{nos:z(),eles:z()},"2":{nos:z(),eles:z()}}; }
function normVivo(d){ const Z=vZero(); ["1","2"].forEach(p=>["nos","eles"].forEach(e=>VSTATS.forEach(([k])=>{ Z[p][e][k]=Math.max(0,+(d?.c?.[p]?.[e]?.[k])||0); })));
  const P=d?.posse||{}, z=()=>({nos:0,eles:0,div:0,fora:0});
  return {c:Z,parte:d?.parte===2?2:1,manual:!!d?.manual,posse:{estado:["nos","eles","div","fora"].includes(P.estado)?P.estado:"",parte:P.parte===2?2:1,inicio:+P.inicio||0,acum:{"1":{...z(),...(P.acum?.["1"]||{})},"2":{...z(),...(P.acum?.["2"]||{})}}}}; }
let vivo=normVivo(null), vLog=[], vVer=null;
function guardaVivo(n){ vivo=normVivo(n); guardaLocal(); renderVivo(); gravaDoc("jogo/vivo",vivo); }
function vParte(){ if(vivo.manual) return vivo.parte; const tj=tempoJogo(); return tj!=null&&tj>=2700?2:vivo.parte; }
function vAcum(parte){ const P=vivo.posse, a={...P.acum[String(parte)]}; if(P.estado&&P.parte===parte&&P.inicio) a[P.estado]+=Math.max(0,(Date.now()-P.inicio)/1000); return a; }
function vSetPosse(e){ const P=clone(vivo.posse), now=Date.now(); if(P.estado&&P.inicio) P.acum[String(P.parte)][P.estado]+=Math.max(0,(now-P.inicio)/1000);
  P.parte=vParte(); P.estado=e; P.inicio=e?now:0; guardaVivo({...vivo,posse:P}); }
function vConta(eq,k,d){ const p=String(vParte()), C=clone(vivo.c); C[p][eq][k]=Math.max(0,C[p][eq][k]+d);
  if(d>0&&k==="enq") C[p][eq].rem+=1;   /* enquadrado também conta como remate */
  if(d<0&&k==="enq"&&C[p][eq].rem>0&&vivo.c[p][eq].enq>0) C[p][eq].rem-=1;
  let evId=null;
  if(k==="can"&&eq==="nos"){
    if(d>0){ const e={id:Math.random().toString(36).slice(2,9),c:Date.now(),tipo:"canto",min:minAgora()}; evId=e.id; guardaJogo({...jogo,eventos:[...(jogo.eventos||[]),e]},true); setTimeout(()=>folhaCantoRapido(e.id),60); }
    else if(vivo.c[p].nos.can>0){ const cs=(jogo.eventos||[]).filter(x=>x.tipo==="canto"&&(((minSeg(x.min)??0)<2700)===(p==="1"))); const ult=cs[cs.length-1]; if(ult) guardaJogo({...jogo,eventos:jogo.eventos.filter(x=>x.id!==ult.id)},true); } }
  vLog.push({c:clone(vivo.c),evId}); if(vLog.length>40) vLog.shift(); guardaVivo({...vivo,c:C});
  if(navigator.vibrate) try{ navigator.vibrate(15); }catch(e){} }
function lancesCanto(){ const of=lances().filter(l=>l.tipo==="OF"); const c=of.filter(l=>/canto/i.test(l.nome)); return c.length?c:of; }
function folhaCantoRapido(id){ const e0=(jogo.eventos||[]).find(x=>x.id===id); if(!e0) return;
  const grava=campos=>{ const J=clone(jogo); J.eventos=J.eventos.map(x=>{ if(x.id!==id) return x; const y={...x,...campos}; Object.keys(y).forEach(k=>{ if(y[k]==null||y[k]==="") delete y[k]; }); return y; }); guardaJogo(J,true); };
  folha(`<h3>🚩 Canto SC Angrense · ${esc(e0.min||"")}</h3><p class="sub" style="margin:0">Opcional: toca no que souberes. Fica gravado logo; o resto completa-se no pós-jogo.</p>
    <h4>Canto usado</h4><div class="styles" id="cr-l"></div><h4>Zona</h4><div class="styles" id="cr-z"></div><h4>Ação</h4><div class="styles" id="cr-r"></div>
    <div class="actions" style="justify-content:stretch"><button class="btn primary" data-close style="flex:1;min-height:52px">✓ Feito</button></div>`,(s_,fecha)=>{
    const cur=()=>(jogo.eventos||[]).find(x=>x.id===id)||{};
    const pinta=()=>{ const E=cur(); s_.querySelectorAll("#cr-l button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===(E.bpl||"")))); s_.querySelectorAll("#cr-z button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===(E.zona||"")))); s_.querySelectorAll("#cr-r button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===(E.res||"")))); };
    const bt=(box,v,html,campo)=>{ const b=document.createElement("button"); b.type="button"; b.dataset.v=v; b.innerHTML=html; b.style.minHeight="48px"; b.onclick=()=>{ const E=cur(); grava({[campo]:E[campo]===v?"":v}); pinta(); }; s_.querySelector(box).appendChild(b); };
    lancesCanto().forEach(L=>bt("#cr-l",L.id,`<span>${esc(L.nome)}</span>`,"bpl"));
    CANTO_Z.forEach(([k,n])=>bt("#cr-z",k,`<b style="font-family:var(--f-display)">${k}</b> <span>${n}</span>`,"zona"));
    CANTO_R.forEach(([k,n])=>bt("#cr-r",k,`<b style="font-family:var(--f-display)">${k}</b> <span>${n}</span>`,"res"));
    pinta(); }); }
/* estatística combinada: vídeo substitui o ao vivo quando existir */
const VID_MAP={rem:x=>["re","rd","rb","golo"].includes(x.ac),enq:x=>x.ac==="re"||x.ac==="golo",can:x=>x.ac==="can",fal:x=>x.ac==="fc",fj:x=>x.ac==="fj"};
function estatJogo(regs,vv,posseVid,evs){ regs=regs||an.regs; vv=vv||vivo; evs=evs||jogo.eventos||[]; const out={fonte:{}};
  ["1","2"].forEach(p=>{ out[p]={nos:{},eles:{}}; });
  VSTATS.forEach(([k])=>{ const vid=regs.filter(VID_MAP[k]); const usaV=vid.length>0; out.fonte[k]=usaV?"vídeo":"ao vivo";
    ["1","2"].forEach(p=>["nos","eles"].forEach(e=>{ let v=usaV?vid.filter(x=>String(x.parte)===p&&x.eq===e).length:vv.c[p][e][k];
      if(!usaV&&(k==="rem"||k==="enq")) v+=evs.filter(x=>x.tipo===(e==="nos"?"golo":"golo_adv")&&(((minSeg(x.min)??0)<2700)===(p==="1"))).length;
      out[p][e][k]=v; })); });
  const golo=(t,p)=>evs.filter(x=>x.tipo===t&&(((minSeg(x.min)??0)<2700)===(p==="1"))).length;
  const cart=(t,eq,p)=>evs.filter(x=>(eq==="nos"?x.tipo===t:x.tipo===t+"_adv")&&(((minSeg(x.min)??0)<2700)===(p==="1"))).length;
  ["1","2"].forEach(p=>{ out[p].nos.golos=golo("golo",p); out[p].eles.golos=golo("golo_adv",p); ["amarelo","vermelho"].forEach(t=>{ out[p].nos[t]=cart(t,"nos",p); out[p].eles[t]=cart(t,"eles",p); }); });
  const pv=posseVid||{"1":acumAgora(1),"2":acumAgora(2)}, temV=(pv["1"].nos+pv["1"].eles+pv["2"].nos+pv["2"].eles)>0;
  const pl=temV?pv:{"1":vAcumDe(vv,1),"2":vAcumDe(vv,2)}; out.fonte.posse=temV?"vídeo":"ao vivo";
  ["1","2"].forEach(p=>{ const a=pl[p], t=a.nos+a.eles; out[p].nos.posse=t?Math.round(a.nos/t*100):null; out[p].eles.posse=t?100-out[p].nos.posse:null; out[p].util=a.nos+a.eles+a.div; });
  out.t={nos:{},eles:{}}; ["nos","eles"].forEach(e=>{ Object.keys(out["1"][e]).forEach(k=>{ if(k!=="posse") out.t[e][k]=(out["1"][e][k]||0)+(out["2"][e][k]||0); }); });
  const A=pl["1"],B=pl["2"], tn=A.nos+B.nos, te=A.eles+B.eles; out.t.nos.posse=tn+te?Math.round(tn/(tn+te)*100):null; out.t.eles.posse=tn+te?100-out.t.nos.posse:null; out.t.util=out["1"].util+out["2"].util;
  return out; }
function vAcumDe(vv,parte){ const P=vv.posse, a={...P.acum[String(parte)]}; if(vv===vivo&&P.estado&&P.parte===parte&&P.inicio) a[P.estado]+=Math.max(0,(Date.now()-P.inicio)/1000); return a; }
const ESTAT_LINHAS=[["golos","Golos"],["posse","Posse de bola (%)"],["rem","Remates"],["enq","Remates enquadrados"],["can","Cantos"],["fal","Faltas cometidas"],["fj","Foras de jogo"],["amarelo","Amarelos"],["vermelho","Vermelhos"]];
function tabelaEstat(E,ver){ const S=ver==="t"?E.t:E[ver]; const ad=esc((jogo.adversario||"ADV").slice(0,12));
  let h=`<table class="vtv"><tr><td class="v" style="color:#C00000">SCA</td><td class="l">${ver==="1"?"1.ª parte":ver==="2"?"2.ª parte":"Jogo todo"}</td><td class="v" style="color:#1F497D">${ad}</td></tr>`;
  ESTAT_LINHAS.forEach(([k,l])=>{ const a=S.nos[k], b=S.eles[k]; if(k==="vermelho"&&!a&&!b) return; const va=a==null?"–":a+(k==="posse"?"%":""), vb=b==null?"–":b+(k==="posse"?"%":"");
    const ta=(+a||0)+(+b||0), pa=ta?Math.round((+a||0)/ta*100):50;
    h+=`<tr><td class="v">${va}</td><td class="l">${l}<div class="bar"><i style="width:${pa}%;background:#C00000"></i><i style="width:${100-pa}%;background:#1F497D"></i></div></td><td class="v">${vb}</td></tr>`; });
  return h+"</table>"; }
function renderVivo(){ if(!$("view-v")||$("view-v").hidden) return; const p=vParte(); renderVivoJogo();
  $("vp-1").setAttribute("aria-pressed",String(p===1)); $("vp-2").setAttribute("aria-pressed",String(p===2));
  const cont=$("v-cont"); const ad=esc((jogo.adversario||"ADV").slice(0,10).toUpperCase());
  cont.innerHTML=`<div class="vhead"><span></span><span style="color:#C00000">SCA</span><span class="sub" style="font-weight:600;font-family:var(--f-body)">${p}.ª parte</span><span style="color:#1F497D">${ad}</span><span></span></div>`+
    VSTATS.map(([k,l])=>`<div class="vrow"><button class="menos" data-eq="nos" data-k="${k}" aria-label="Menos ${l} nós">−</button><button class="mais nos" data-eq="nos" data-k="${k}">${vivo.c[p].nos[k]} <small>/ ${vivo.c["1"].nos[k]+vivo.c["2"].nos[k]}</small></button><span class="lb">${l}</span><button class="mais eles" data-eq="eles" data-k="${k}">${vivo.c[p].eles[k]} <small>/ ${vivo.c["1"].eles[k]+vivo.c["2"].eles[k]}</small></button><button class="menos" data-eq="eles" data-k="${k}" aria-label="Menos ${l} adversário">−</button></div>`).join("")+
    `<p class="sub" style="margin:4px 0 0">Número grande = esta parte · pequeno = jogo todo. "Remates enquadrados" também soma 1 em "Remates". <b>Golos contam sozinhos como remate enquadrado</b>: regista só o ⚽, não toques também em remate.</p>`;
  cont.querySelectorAll(".mais").forEach(b=>b.onclick=()=>vConta(b.dataset.eq,b.dataset.k,1));
  cont.querySelectorAll(".menos").forEach(b=>b.onclick=()=>vConta(b.dataset.eq,b.dataset.k,-1));
  const ver=vVer||(p===1?"1":"t"); $("v-ver").querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===ver)));
  $("v-est").innerHTML=tabelaEstat(estatJogo(),ver); tickVivo(); }
function folhaSubVivo(){ let sai=null; const C=COMPS[jogo.comp]||COMPS.taca, sr=subsReais(), np=paragensDe(sr.lista).length, ct=cartoes();
  const campo=[...sr.campo].sort(byNum), sup=jogo.suplentes.filter(n=>!sr.campo.has(n)&&!sr.lista.some(l=>l.sai===n)).sort(byNum);
  const resto=est.plantel.map(p=>p.n).filter(n=>n&&!sr.campo.has(n)&&!sup.includes(n)).sort(byNum);
  const mk=n=>ct[n]?.verm?"🟥":ct[n]?.am?"🟨":"";
  folha(`<h3>🔁 Substituição</h3><p class="sub" style="margin:0">${esc(C.nome)}: <b>${sr.lista.length}/${C.subs>=99?"–":C.subs}</b> substituições · <b>${np}/${C.paragens>=99?"–":C.paragens}</b> paragens (intervalo não conta)${sr.lista.length>=C.subs?` · <b style="color:var(--red)">limite atingido</b>`:""}</p>
    <div style="display:flex;gap:10px;align-items:flex-end"><label class="f" style="flex:1">Minuto<input type="text" id="sv-m" inputmode="numeric" placeholder="Ex.: 63:20"></label><label style="display:flex;gap:6px;align-items:center;font-size:14px;min-height:42px"><input type="checkbox" id="sv-i" style="width:20px;height:20px"> Ao intervalo</label></div>
    <h4>1. Sai</h4><div class="pgrid" id="sv-s"></div>
    <div id="sv-ew" hidden><h4>2. Entra</h4><div class="pgrid" id="sv-e"></div><details class="more"><summary>Resto do plantel</summary><div class="pgrid" id="sv-r" style="margin-top:8px"></div></details></div>
    <div class="actions"><button class="btn" data-close>Cancelar</button></div>`,(s,fecha)=>{
    s.querySelector("#sv-m").value=minAgora();
    const gs=s.querySelector("#sv-s");
    botoesJog(gs,campo,n=>{ sai=n; gs.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.querySelector("b").textContent===n))); s.querySelector("#sv-ew").hidden=false; s.querySelector("#sv-ew").scrollIntoView({block:"nearest"}); },mk);
    const pick=n=>{ if(!sai) return; const it=s.querySelector("#sv-i").checked, mm=s.querySelector("#sv-m").value.trim(); fecha();
      const l={id:Math.random().toString(36).slice(2,9),sai,entra:n,min:it?"45:00":mm,...(it?{int:true}:{}),c:Date.now()};
      guardaJogo({...jogo,subs:[...(jogo.subs||[]),l]},true); toast(`🔁 ${l.int?"Intervalo":l.min} · sai ${rot(sai)} · entra ${rot(n)} (quadros não alterados)`,()=>guardaJogo({...jogo,subs:jogo.subs.filter(x=>x.id!==l.id)},true)); };
    botoesJog(s.querySelector("#sv-e"),sup,pick,mk); if(!sup.length) s.querySelector("#sv-e").innerHTML=`<p class="sub">Sem suplentes convocados disponíveis. Usa "Resto do plantel" ou define-os no separador Jogo.</p>`;
    botoesJog(s.querySelector("#sv-r"),resto,pick,mk);
  }); }
function renderVivoJogo(){ if(!$("v-evs")) return; const C=COMPS[jogo.comp]||COMPS.taca, sr=subsReais(), np=paragensDe(sr.lista).length, pl=placar();
  $("v-pl").innerHTML=`SCA <span style="color:var(--red)">${pl.nos}</span>–<span style="color:var(--red)">${pl.eles}</span> ${esc((jogo.adversario||"ADV").slice(0,12))}`;
  $("v-subs").innerHTML=`Substituições <b>${sr.lista.length}/${C.subs>=99?"–":C.subs}</b> · Paragens <b>${np}/${C.paragens>=99?"–":C.paragens}</b>`;
  const it=[...(jogo.eventos||[]).filter(e=>e.tipo!=="canto").map(e=>({t:minSeg(e.min)??0,min:e.min,txt:`${EVT[e.tipo][0]} ${EVT[e.tipo][1]}${e.n?" · "+rot(e.n):""}${e.gt?" · "+e.gt.join(" "):""}${e.as?" · assist. "+e.as:""}`,ev:e})),
    ...sr.lista.map(l=>({t:l.int?2700:(minSeg(l.min)??0),min:l.int?"Int.":l.min,txt:`🔁 ↓ ${rot(l.sai)}  ↑ ${rot(l.entra)}`,sub:l}))].sort((a,b)=>b.t-a.t);
  const ul=$("v-evs"); ul.innerHTML=it.length?"":`<li class="sub">Ainda sem golos, cartões ou substituições.</li>`;
  const mostra=vTodos?it:it.slice(0,3);
  mostra.forEach(x=>{ const li=document.createElement("li"); li.innerHTML=`<span class="t"></span><span style="flex:1;cursor:pointer"></span><button class="icon x" aria-label="Apagar">✕</button>`;
    li.querySelector(".t").textContent=x.min||"?"; li.children[1].textContent=x.txt;
    if(x.ev){ li.children[1].onclick=()=>folhaEvento(x.ev.tipo,x.ev); li.querySelector(".x").onclick=()=>{ const prev=clone(jogo.eventos); guardaJogo({...jogo,eventos:jogo.eventos.filter(y=>y.id!==x.ev.id)},true); toast("Apagado",()=>guardaJogo({...jogo,eventos:prev},true)); }; }
    else { li.children[1].onclick=null; li.querySelector(".x").onclick=()=>{ const prev=clone(jogo.subs); guardaJogo({...jogo,subs:jogo.subs.filter(y=>y.id!==x.sub.id)},true); toast("Substituição apagada",()=>guardaJogo({...jogo,subs:prev},true)); }; }
    ul.appendChild(li); });
  if(it.length>3){ const li=document.createElement("li"); li.style.cssText="justify-content:center;background:transparent"; li.innerHTML=`<button class="btn sm ghost">${vTodos?"Mostrar só os últimos":"Ver todos ("+it.length+")"}</button>`; li.querySelector("button").onclick=()=>{ vTodos=!vTodos; renderVivoJogo(); }; ul.appendChild(li); } }
let vTodos=false;
function tickVivo(){ if(!$("view-v")||$("view-v").hidden) return; const p=vParte(), a=vAcum(p);
  $("v-posse").querySelectorAll("button[data-e]").forEach(b=>{ const e=b.dataset.e; b.setAttribute("aria-pressed",String(vivo.posse.estado===e)); if(e) b.querySelector("b").textContent=fmt(a[e]); });
  const tj=tempoJogo(); $("v-min").textContent=tj!=null?fmt(tj):"⏱ —"; }
setInterval(tickVivo,1000);
let anOrig={or:"org",bpl:""};
try{ const o=JSON.parse(localStorage.getItem("sca-orig")||"null"); if(o&&o.or) anOrig=o; }catch(e){}
const ORIG={org:"Organizado",trans:"Transição",bp:"Bola parada"}, BP_GEN={canto:"Canto (genérico)",livre:"Livre (genérico)",lanc:"Lançamento (genérico)",pen:"Penálti"};
function nomeBpl(k){ if(!k) return ""; if(BP_GEN[k]) return BP_GEN[k]; const L=lances().find(l=>l.id===k); return L?L.nome:"(lance apagado)"; }
function setOrig(o,bpl){ anOrig={or:o,bpl:o==="bp"?(bpl??anOrig.bpl??""):""}; try{ localStorage.setItem("sca-orig",JSON.stringify(anOrig)); }catch(e){} renderAnalise(); }
function opcBpl(sel,eq,val){ const tipos=eq==="eles"?["DEF","OF"]:["OF","DEF"]; sel.innerHTML=`<option value="">— Escolhe o lance —</option>`+
  tipos.map(t=>`<optgroup label="${t==="OF"?"Ofensivos":"Defensivos"}">`+lances().filter(l=>l.tipo===t).map(l=>`<option value="${esc(l.id)}">${esc(l.nome)}</option>`).join("")+"</optgroup>").join("")+
  `<optgroup label="Genérico">${Object.entries(BP_GEN).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</optgroup>`; sel.value=val||""; }
let anSel={ac:null,eq:"nos",pt:null}, anVista="reg", anTodos=false, kbBuf="", kbTimer=null;
function normAn(d){ const z=()=>({nos:0,eles:0,div:0,fora:0}); const P=d?.posse||{};
  const ac={"1":{...z(),...(P.acum?.["1"]||{})},"2":{...z(),...(P.acum?.["2"]||{})}};
  return {regs:Array.isArray(d?.regs)?d.regs.filter(x=>x&&x.ac).map((x,i)=>({c:+x.c||i,id:String(x.id||Math.random().toString(36).slice(2,9)),ac:String(x.ac),eq:x.eq==="eles"?"eles":"nos",x:+x.x||0,y:+x.y||0,j:x.j==null?null:String(x.j),parte:x.parte===2?2:1,seg:+x.seg||0,...(x.autor?{autor:String(x.autor)}:{}),...(x.tipo?{tipo:String(x.tipo)}:{}),...(ORIG[x.or]?{or:x.or}:{}),...(x.bpl?{bpl:String(x.bpl)}:{}),...(x.x2!=null&&x.y2!=null?{x2:+x.x2,y2:+x.y2}:{})})):[],
    posse:{estado:["nos","eles","div","fora"].includes(P.estado)?P.estado:"",ult:["nos","eles","div","fora"].includes(P.ult)?P.ult:"",parte:P.parte===2?2:1,inicio:+P.inicio||0,acum:ac},
    ataque:{"1":d?.ataque?.["1"]==="esq"?"esq":"dir","2":d?.ataque?.["2"]==="dir"?"dir":"esq"}}; }
function normCfg(d){ const a=Array.isArray(d?.acoes)&&d.acoes.length?d.acoes:ACOES_DEF; return {acoes:a.filter(x=>x&&x.nome).map(x=>{ const D=ACOES_DEF.find(d=>d.id===x.id)||{};
    return {id:String(x.id||Math.random().toString(36).slice(2,8)),nome:String(x.nome),cor:/^#[0-9a-fA-F]{6}$/.test(x.cor)?x.cor:"#6B675E",
      tecla:(typeof x.tecla==="string"?x.tecla:(D.tecla||"")).toUpperCase().replace(/[^A-Z]/g,"").slice(0,1).replace(new RegExp("["+TECLAS_RES+"]"),""),
      dir:typeof x.dir==="boolean"?x.dir:!!D.dir, tipos:(()=>{ let t=Array.isArray(x.tipos)?x.tipos.map(String).filter(Boolean):(D.tipos||[]).slice(); if(x.id==="per"&&!d?.v2&&!t.some(v=>/rece/i.test(v))) t=[...t,"Receção falhada"]; return t; })()}; }),v2:true}; }
function semCol(o,k){ const c={...o}; delete c[k]; return c; }
function gravaCol(nome_,antes,depois){ const A=new Map((antes||[]).map(x=>[x.id,JSON.stringify(x)])), D=new Map((depois||[]).map(x=>[x.id,x]));
  D.forEach((x,id)=>{ if(A.get(id)!==JSON.stringify(x)) gravaDoc(`${nome_}/${id}`,x); }); A.forEach((_,id)=>{ if(!D.has(id)) apagaDoc(`${nome_}/${id}`); }); }
let anMigrado=false, jogoMigrado=false;
function guardaAn(n){ const antes=an; an=normAn(n); guardaLocal(); renderAnalise(); gravaCol("regs",antes.regs,an.regs);
  if(JSON.stringify(semCol(antes,"regs"))!==JSON.stringify(semCol(an,"regs"))||!anMigrado){ anMigrado=true; gravaDoc("analise/atual",semCol(an,"regs")); } }
function guardaCfg(n){ anCfg=normCfg(n); guardaLocal(); renderAnalise(); gravaDoc("analise/config",anCfg); }
function acumAgora(parte){ const P=an.posse, a={...P.acum[String(parte)]}; if(P.estado&&P.parte===parte&&P.inicio) a[P.estado]+=Math.max(0,(Date.now()-P.inicio)/1000); return a; }
function tempoParte(parte){ const a=acumAgora(parte); return a.nos+a.eles+a.div+a.fora; }
function acaoDe(id){ return anCfg.acoes.find(a=>a.id===id)||{id,nome:id,cor:"#6B675E",dir:false,tipos:[]}; }
function descReg(x){ return acaoDe(x.ac).nome+(x.tipo?" ("+x.tipo+")":"")+(x.x2!=null?" ↗":"")+(x.or==="trans"?" · Transição":x.or==="bp"?" · BP"+(x.bpl?": "+nomeBpl(x.bpl):""):""); }
function minutoReg(r_){ return fmt((r_.parte===2?2700:0)+r_.seg); }
let usr=null, sala=null, meuId=null;
async function renderPeers(peers){
  const box=$("quem"); if(!box) return;
  const vs=(peers||[]).filter(p=>p.kind==="viewer");
  const ids=[...new Set(vs.map(p=>p.by).filter(Boolean))];
  let ps={}; try{ if(usr&&ids.length) ps=await usr.profiles(ids); }catch(e){}
  box.innerHTML="";
  ids.forEach(id=>{ const p=ps[id]||{}; const im=document.createElement("img"); im.alt=""; im.src=p.avatarUrl||""; im.title=(p.name||"Alguém")+(p.isMe?" (tu)":""); box.appendChild(im); });
  const anon=vs.filter(p=>!p.by).length;
  if(ids.length||anon){ const sp=document.createElement("span"); const n=ids.length+(anon&&!ids.length?1:0);
    sp.textContent=n<=1?"só tu ligado":`${n} ligados`; box.appendChild(sp); }
}
async function nomeDe(id){ if(!usr||!id) return ""; try{ const ps=await usr.profiles([id]); return (ps[id]&&ps[id].name)||""; }catch(e){ return ""; } }
function hms(sec){ sec=Math.max(0,Math.round(sec)); const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), x=sec%60; return (h?h+":"+String(m).padStart(2,"0"):m)+":"+String(x).padStart(2,"0"); }
function lerHms(t){ const p=String(t||"").trim().split(":").map(Number); if(!p.length||p.some(isNaN)) return null; return p.reduce((a,v)=>a*60+v,0); }
function ytId(u){ u=String(u||""); const m=u.match(/(?:youtu\.be\/|v=|\/live\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/); return m?m[1]:null; }
function tempoVideo(n,V){ V=V||jogo.video; if(!V||!ytId(V.url)) return null; const parte=n.parte||(seg(n.t)>=2700?2:1);
  const k=parte===2?V.k2:V.k1; if(k==null||seg(n.t)>=1e9) return null;
  return Math.max(0,Math.round(k+seg(n.t)-(parte===2?2700:0)-(V.antes??10))); }
let modoVideo="embed"; try{ modoVideo=localStorage.getItem("sca-modo-video")||"embed"; }catch(e){}
function linkVideoModo(n,V,modo){ V=V||jogo.video; const t=tempoVideo(n,V); if(t==null) return null; const id=ytId(V.url);
  if(modo==="app") return `https://youtu.be/${id}?t=${t}`;
  if(modo==="web") return `https://m.youtube.com/watch?v=${id}&t=${t}s#t=${t}`;
  return `https://www.youtube.com/embed/${id}?start=${t}&autoplay=1&rel=0`; }
function linkVideo(n,V){ return linkVideoModo(n,V,modoVideo); }
const CATS={of:["Ofensivo","#C00000"],def:["Defensivo","#1F497D"],bp:["Bola parada","#B8963F"],out:["Outro","#6B675E"]};
function seg(t){ const m=String(t||"").match(/^(\d{1,3})(?::(\d{1,2}))?$/); return m?(+m[1])*60+(+(m[2]||0)):1e9; }
function fmt(sec){ sec=Math.max(0,Math.floor(sec)); return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0"); }
const COMPS={taca:{nome:"Taça AFAH",subs:9,paragens:3,sup:null},camp:{nome:"Campeonato dos Açores",subs:5,paragens:3,sup:7},livre:{nome:"Outra / amigável",subs:99,paragens:99,sup:null}};
const STAFF=[["diretor","Diretor"],["treinador","Treinador"],["adjunto","Tr. Adjunto"],["trgr","Tr. Guarda-Redes"],["prepfis","Preparador Físico"],["psicologa","Psicóloga"],["saude","Técnico de Saúde"],["cap1","Capitão"],["cap2","Sub Capitão"],["cap3","3º Capitão"]];
const GOLO_COD=[["DA","Dentro da área"],["FA","Fora da área"],["L","Livre"],["C","Canto"],["P","Penálti"],["AG","Autogolo"],["CB","Cabeça"],["JI","Jogada individual"]];
const CANTO_Z=[["1º","1º poste"],["2º","2º poste"],["PA","Pequena-área"]], CANTO_R=[["C","Corte"],["FB","Finalização à baliza"],["FF","Finalização fora"]];
const EVT={canto:["🚩","Canto SCA"],golo:["⚽","Golo SCA"],golo_adv:["⚽","Golo adversário"],amarelo:["🟨","Amarelo"],vermelho:["🟥","Vermelho"],amarelo_adv:["🟨","Amarelo adversário"],vermelho_adv:["🟥","Vermelho adversário"],lesao:["✚","Lesão"]};
function minSeg(m){ const v=seg(m); return v>=1e9?null:v; }
/* substituições reais: só fase de jogo, quem entra não estava em campo */
function subsReais(){ let campo=new Set(titulares()); const out=[];
  (jogo.subs||[]).forEach(l=>{ if(campo.has(l.sai)&&!campo.has(l.entra)){ campo.delete(l.sai); campo.add(l.entra); out.push(l); } }); return {lista:out,campo}; }
function paragensDe(lista){ return [...new Set(lista.filter(l=>!l.int).map(l=>l.min||("?"+l.id)))]; }
function cartoes(){ const m={}; (jogo.eventos||[]).forEach(e=>{ if(!e.n) return; if(e.tipo==="amarelo"){ m[e.n]=m[e.n]||{am:0,verm:false}; m[e.n].am++; if(m[e.n].am>=2) m[e.n].verm=true; } if(e.tipo==="vermelho"){ m[e.n]=m[e.n]||{am:0,verm:false}; m[e.n].verm=true; } }); return m; }
function placar(){ const ev=jogo.eventos||[]; return {nos:ev.filter(e=>e.tipo==="golo").length,eles:ev.filter(e=>e.tipo==="golo_adv").length}; }
function fimJogo(){ const tj=tempoJogo(); return Math.max(90*60,tj||0,...(jogo.eventos||[]).map(e=>minSeg(e.min)||0),...est.linhas.map(l=>minSeg(l.min)||0)); }
function minutosJogados(){ const fim=fimJogo(), agora=tempoJogo(), lim=agora!=null&&agora<fim?agora:fim; const T={};
  titulares().forEach(n=>T[n]={ini:0,fim:null,tit:true});
  subsReais().lista.forEach(l=>{ const m=l.int?2700:(minSeg(l.min)??lim); if(T[l.sai]) T[l.sai].fim=m; T[l.entra]={ini:m,fim:null,tit:false}; });
  (jogo.eventos||[]).forEach(e=>{ if(!e.n||!T[e.n]) return; const verm=e.tipo==="vermelho"||(e.tipo==="amarelo"&&(jogo.eventos||[]).filter(x=>x.tipo==="amarelo"&&x.n===e.n).indexOf(e)===1); if(verm&&T[e.n].fim==null) T[e.n].fim=minSeg(e.min)??lim; });
  return Object.entries(T).map(([n,t])=>({n,tit:t.tit,ini:t.ini,fim:t.fim,min:Math.max(0,Math.round(((t.fim??lim)-t.ini)/60))})); }
function tempoJogo(){ const rl=jogo.relogio||{}; if(!rl.correr&&!rl.base) return null; return (rl.base||0)+(rl.correr?(Date.now()-rl.inicio)/1000:0); }                  // id -> doc (override, novo ou {apagado:true})
let cartoesCache={}, dupsAtual=[];
let curId="onze", scope="este", editing=false, dragging=false, presentOpen=false;
let db=null, refs={}, queues={}, online=false;
