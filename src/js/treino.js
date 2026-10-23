
/* ================= TREINO · Unidades de Treino (UT) feitas com os exercícios do repositório ================= */
const MATCH_DAYS=["MD+1","MD+2","MD-5","MD-4","MD-3","MD-2","MD-1","MD"];
const PRESENCAS=[["P","Presente","#1E9E3E"],["L","Lesão","#C00000"],["A","Ausente","#E36C09"],["C","Castigado","#7030A0"],["CO","Condicionado","#0070C0"]];
const U_LS="sca-uts-v1";
const uParteOrd=k=>Math.max(0,PARTES.findIndex(p=>p[0]===k));
const corPres=k=>(PRESENCAS.find(p=>p[0]===k)||[])[2]||"";

let uts={}; try{ uts=JSON.parse(localStorage.getItem(U_LS)||"{}")||{}; }catch(e){ uts={}; }
let uCur=null; try{ uCur=localStorage.getItem("sca-ut-cur")||null; }catch(e){}
const uId=p=>(p||"u")+Date.now().toString(36)+Math.random().toString(36).slice(2,6);

/* equipa técnica do rodapé: por defeito, a das definições do separador Jogo */
function staffPadrao(){ const S=est.staff||{}; return ["treinador","adjunto","trgr","prepfis"].map(k=>S[k]).filter(Boolean).join(" | ").toUpperCase(); }
function normUT(d){ const s=v=>String(v??"").trim(), L=v=>(Array.isArray(v)?v.map(s):s(v).split(/\n/).map(x=>x.trim())).filter(Boolean), n=v=>{ const x=Math.round(+v); return isFinite(x)&&x>0?x:0; };
  const pres={}; Object.entries(d.presencas||{}).forEach(([k,v])=>{ if(PRESENCAS.some(p=>p[0]===v)) pres[String(k)]=v; });
  return {id:s(d.id)||uId(), numero:n(d.numero), data:/^\d{4}-\d{2}-\d{2}$/.test(s(d.data))?s(d.data):"", matchDay:s(d.matchDay), regime:s(d.regime),
    objetivos:L(d.objetivos), material:L(d.material), tempoTotal:n(d.tempoTotal)||null, presencas:pres, staff:s(d.staff),
    /* jogadores chamados de fora do plantel (juniores, juvenis…): só nesta UT; nas presenças e grupos são "e:<id>" */
    extras:(Array.isArray(d.extras)?d.extras:[]).filter(e=>e&&s(e.nome)).map(e=>({id:s(e.id)||uId("e"),nome:s(e.nome),escalao:s(e.escalao),pos:POS_UT.some(x=>x[0]===s(e.pos))?s(e.pos):""})),
    grupos:(Array.isArray(d.grupos)?d.grupos:[]).filter(g=>g&&(g.nome||(g.jogadores||[]).length)).map(g=>({id:s(g.id)||uId("g"),nome:s(g.nome),jogadores:L(g.jogadores),nota:s(g.nota)})),
    /* cada exercício da UT é uma cópia do exercício no dia: mudar o repositório depois não mexe nas UT antigas */
    exercicios:(Array.isArray(d.exercicios)?d.exercicios:[]).filter(e=>e&&e.copia).map(e=>({id:s(e.id)||uId("l"),exId:s(e.exId),copia:normEx({...e.copia,id:s(e.exId)||s(e.copia.id)})})),
    criadoPor:s(d.criadoPor), criadoEm:s(d.criadoEm), alteradoPor:s(d.alteradoPor), alteradoEm:s(d.alteradoEm)}; }
Object.keys(uts).forEach(id=>{ try{ uts[id]=normUT({...uts[id],id}); }catch(e){ delete uts[id]; } });

/* atletas da UT: plantel (chave = nº) e jogadores de fora (chave = "e:<id>") */
function atletasUT(U){ const pl=est.plantel.filter(p=>p.n).slice().sort((a,b)=>byNum(a.n,b.n)), at=p=>({k:p.n,n:p.n,nome:p.nome||"",pos:p.pos||"",esc:p.esc||"",form:!!p.esc});
  return [...pl.filter(p=>!p.esc).map(at),...pl.filter(p=>p.esc).map(at),
  ...U.extras.map(e=>({k:"e:"+e.id,n:"",nome:e.nome,pos:e.pos,esc:e.escalao||"Extra"}))]; }
function nomeAtleta(U,k){ if(String(k).startsWith("e:")){ const e=U.extras.find(x=>"e:"+x.id===k); return e?`${e.nome}${e.escalao?" ("+e.escalao+")":""}`:"?"; } return rot(k); }
const totalUT=U=>U.tempoTotal||U.exercicios.reduce((a,l)=>a+totalEx(l.copia),0);
const materialUT=U=>[...new Set([...U.material,...U.exercicios.flatMap(l=>l.copia.material)])];
const listaUTs=()=>Object.values(uts).sort((a,b)=>(b.data||"").localeCompare(a.data||"")||b.numero-a.numero);
const dataPt_=d=>d?new Date(d+"T12:00").toLocaleDateString("pt-PT"):"sem data";
/* época do clube a partir da data (julho em diante = época nova): 2026-10-21 → 26.27 */
function epocaDe(d){ const x=d?new Date(d+"T12:00"):new Date(), a=x.getFullYear()-(x.getMonth()<6?1:0); return `${String(a).slice(2)}.${String(a+1).slice(2)}`; }

/* ---------- gravação (um documento por UT, pela fila pendentes) ---------- */
function guardaUTLocal(){ try{ localStorage.setItem(U_LS,JSON.stringify(uts)); }catch(e){} }
function guardaUT(U,semRender){ const N=normUT({...U,alteradoPor:meuId||U.alteradoPor||"",alteradoEm:new Date().toISOString()}); uts[N.id]=N; guardaUTLocal(); gravaDoc("uts/"+N.id,N); if(!semRender) renderUT(); return N; }
function editaUT(fn,msg){ const U0=uts[uCur]; if(!U0) return; const antes=clone(U0), U=clone(U0); fn(U); guardaUT(U); if(msg) toast(msg,()=>{ guardaUT(antes); }); }
function novaUT(){ const ls=listaUTs(), ult=ls[0], num=Math.max(0,...ls.map(u=>u.numero))+1;
  const U=guardaUT({id:uId(),numero:num,data:new Date().toISOString().slice(0,10),staff:staffPadrao(),regime:"",objetivos:[],exercicios:[],criadoPor:meuId||"",criadoEm:new Date().toISOString()},true);
  uCur=U.id; renderUT(); folhaCabUT(U.id); if(ult) toast(`UT${num} criada · a seguir à UT${ult.numero}`); }
function apagaUT(id){ const U=uts[id]; if(!U) return; const antes=clone(U); delete uts[id]; guardaUTLocal(); apagaDoc("uts/"+id); if(uCur===id) uCur=null; renderUT();
  toast(`UT${U.numero} apagada`,()=>{ uts[id]=antes; guardaUTLocal(); gravaDoc("uts/"+id,antes); uCur=id; renderUT(); }); }
function duplicaUT(id){ const U=uts[id]; if(!U) return; const num=Math.max(0,...listaUTs().map(u=>u.numero))+1;
  const N=guardaUT({...clone(U),id:uId(),numero:num,data:new Date().toISOString().slice(0,10),presencas:{},exercicios:U.exercicios.map(l=>({...clone(l),id:uId("l")})),criadoPor:meuId||"",criadoEm:new Date().toISOString()},true);
  uCur=N.id; renderUT(); toast(`UT${num} criada a partir da UT${U.numero}`); }
function repoeUTs(X){ Object.keys(uts).forEach(id=>{ if(!X[id]) apagaDoc("uts/"+id); }); uts={}; Object.entries(X||{}).forEach(([id,U])=>{ uts[id]=normUT({...U,id}); gravaDoc("uts/"+id,uts[id]); }); guardaUTLocal(); renderUT(); }

/* ---------- ecrã ---------- */
function renderUT(){ const v=$("view-u"); if(!v||v.hidden) return; const ls=listaUTs(); let U=uts[uCur]||ls[0]||null; uCur=U?U.id:null;
  try{ localStorage.setItem("sca-ut-cur",uCur||""); }catch(e){}
  renderUTNav(ls,U); renderUTCorpo(U); renderUTPainel(U); }
function renderUTNav(ls,U){ const nav=$("u-nav");
  nav.innerHTML=`<button class="newl" id="u-nova">+ Nova UT</button><div class="grp"><h3>Unidades de treino</h3><ul>${ls.length?ls.map(x=>`<li><button data-id="${esc(x.id)}" aria-current="${!!U&&x.id===U.id}"><span class="n">${x.numero||"–"}</span><span class="m-nm">UT${x.numero} · ${esc(dataPt_(x.data).slice(0,5))}<small>${esc([x.matchDay,x.exercicios.length+" exerc.",totalUT(x)?fmtTempo(totalUT(x)):""].filter(Boolean).join(" · "))}</small></span></button></li>`).join(""):`<li><span class="m-nada">Ainda sem UT</span></li>`}</ul></div>`;
  $("u-nova").onclick=novaUT;
  nav.querySelectorAll("button[data-id]").forEach(b=>{ b.onclick=()=>{ uCur=b.dataset.id; renderUT(); };
    b.oncontextmenu=e=>{ const X=uts[b.dataset.id]; if(X) menuContexto(e,[["⧉ Duplicar UT",()=>duplicaUT(X.id)],[`🗑 Apagar UT${X.numero}`,()=>apagaUT(X.id),"perigo"]]); }; }); }
function renderUTCorpo(U){ const bx=$("u-corpo"), bar=$("u-bar"), tg=$("u-tag");
  if(!U){ $("u-tit").textContent="Unidades de Treino"; tg.hidden=true; bar.innerHTML="";
    bx.innerHTML=`<div class="m-vazio"><b>Ainda não há Unidades de Treino.</b><span>Cada UT junta exercícios do repositório (separador Exercícios), com cabeçalho, presenças, grupos de trabalho e o PDF no formato do clube.</span><button class="btn primary" id="u-nova2">+ Criar a primeira UT</button></div>`;
    $("u-nova2").onclick=novaUT; return; }
  $("u-tit").textContent=`Unidade de Treino ${U.numero} · ${dataPt_(U.data)}`; tg.hidden=false; tg.textContent=U.matchDay||"UT"; tg.style.background="#C00000";
  bar.innerHTML=`<button class="btn sm" id="u-cab">✎ Cabeçalho</button><button class="btn sm primary" id="u-add">+ Exercícios</button><button class="btn sm" id="u-dup">⧉ Duplicar</button><button class="btn sm" id="u-pdf">⬇ PDF da UT</button>`;
  $("u-cab").onclick=()=>folhaCabUT(U.id); $("u-add").onclick=()=>folhaAddExUT(U.id); $("u-dup").onclick=()=>duplicaUT(U.id); $("u-pdf").onclick=e=>guardaPdfUT(U.id,e.currentTarget);
  const tot=totalUT(U);
  /* cabeçalho com o desenho da UT do clube */
  let h=`<div class="utc"><div class="utc-lema">COMPROMISSO | RESILIÊNCIA | UNIÃO | ATITUDE | PAIXÃO | ALEGRIA</div>
    <div class="utc-g"><div class="utc-clube">SPORT CLUB ANGRENSE</div>
      <div><div class="utc-h">OBJETIVOS</div><div class="utc-v">${U.objetivos.length?U.objetivos.map(esc).join(" | "):`<span class="sub">Sem objetivos</span>`}</div></div>
      <div><div class="utc-h">MATERIAL</div><div class="utc-v">${materialUT(U).length?materialUT(U).map(esc).join(", "):`<span class="sub">–</span>`}</div></div></div>
    <div class="utc-l"><div><span>DATA</span><b>${esc(dataPt_(U.data))}</b></div><div><span>UNIDADE DE TREINO</span><b class="r">${U.numero||"–"}</b></div><div><span>MATCH DAY</span><b>${esc(U.matchDay||"–")}</b></div><div><span>REGIME</span><b>${esc(U.regime||"–")}</b></div><div><span>TEMPO TOTAL TREINO</span><b>${tot?fmtTempo(tot):"–"}</b></div></div></div>`;
  /* exercícios por ordem, numerados */
  if(!U.exercicios.length) h+=`<div class="m-vazio"><b>Ainda não há exercícios nesta UT.</b><span>Vai buscá-los ao repositório. Cada um entra como cópia: podes ajustar a duração ou as variantes só nesta UT.</span><button class="btn primary" id="u-add2">+ Adicionar exercícios do repositório</button></div>`;
  else h+=`<ol class="utx">${U.exercicios.map((l,i)=>{ const E=l.copia, P=parteDe(E.parte), mud=mudouNoRepo(l);
    return `<li data-l="${esc(l.id)}"><span class="utx-n">${i+1}</span><div class="utx-t"><span class="tag" style="background:${P[2]}">${esc(P[1].replace("Parte ","").toUpperCase())}</span><b>${esc(E.nome)}</b><small>${esc([E.formato,E.espaco.txt,totalEx(E)?fmtTempo(totalEx(E)):"",rotuloDe(TIPOS_EX,E.tipo)].filter(Boolean).join(" · "))}${mud?` · <span class="utx-mud">mudou no repositório</span>`:""}${!exercicios[l.exId]?` · <span class="sub">já não está no repositório</span>`:""}</small></div>
      <div class="rowbtns"><button class="icon" data-a="up" aria-label="Subir" ${i?"":"disabled"}>▲</button><button class="icon" data-a="dn" aria-label="Descer" ${i<U.exercicios.length-1?"":"disabled"}>▼</button><button class="btn sm ghost" data-a="aj">Ajustar</button>${mud?`<button class="btn sm ghost" data-a="at">↻ Atualizar</button>`:""}<button class="btn sm ghost" data-a="x" aria-label="Tirar da UT">✕</button></div></li>`; }).join("")}</ol>`;
  bx.innerHTML=h; if($("u-add2")) $("u-add2").onclick=()=>folhaAddExUT(U.id);
  bx.querySelectorAll("li[data-l]").forEach(li=>{ const lid=li.dataset.l, i=U.exercicios.findIndex(l=>l.id===lid);
    li.querySelector(".utx-t").onclick=()=>folhaVerExUT(U.id,lid);
    li.oncontextmenu=e=>menuContexto(e,[["Ajustar nesta UT",()=>folhaAjusteUT(U.id,lid)],["🗑 Tirar da UT",()=>tiraExUT(lid),"perigo"]]);
    li.querySelectorAll("[data-a]").forEach(b=>{ const a=b.dataset.a;
      if(a==="up"||a==="dn") b.onclick=()=>editaUT(U=>{ const j=i+(a==="up"?-1:1); [U.exercicios[i],U.exercicios[j]]=[U.exercicios[j],U.exercicios[i]]; });
      else if(a==="aj") b.onclick=()=>folhaAjusteUT(U.id,lid);
      else if(a==="at") confirma2(b,"Toca outra vez",()=>editaUT(U=>{ const l=U.exercicios.find(x=>x.id===lid); l.copia=clone(exercicios[l.exId]); },"Exercício atualizado a partir do repositório"));
      else if(a==="x") confirma2(b,"Tirar?",()=>tiraExUT(lid)); }); }); }
/* para comparar cópia e repositório sem contar quem alterou e quando */
const semAutoria=E=>{ const c={...E}; ["criadoPor","criadoEm","alteradoPor","alteradoEm"].forEach(k=>delete c[k]); return c; };
/* só avisa se o exercício foi alterado no repositório depois de entrar na UT: a cópia guarda a data de alteração que o exercício tinha nesse dia
   (os ajustes do dia, como a duração ou a figura, não contam) */
function mudouNoRepo(l){ const R=exercicios[l.exId]; if(!R) return false;
  return (R.alteradoEm||"")>(l.copia.alteradoEm||"")&&JSON.stringify(semAutoria(R))!==JSON.stringify(semAutoria(l.copia)); }
function tiraExUT(lid){ const U=uts[uCur], l=U&&U.exercicios.find(x=>x.id===lid); if(!l) return; editaUT(U=>{ U.exercicios=U.exercicios.filter(x=>x.id!==lid); },`“${l.copia.nome}” tirado da UT`); }
function renderUTPainel(U){ const pn=$("u-panel");
  if(!U){ pn.innerHTML=`<header><h2>Unidades de Treino</h2><p class="sub">Feitas com os exercícios do repositório.</p></header>`; return; }
  const porParte=PARTES.map(([k,n])=>{ const ls=U.exercicios.filter(l=>l.copia.parte===k); return ls.length?`${n.replace("Parte ","")}: ${ls.length} · ${fmtTempo(ls.reduce((a,l)=>a+totalEx(l.copia),0))}`:""; }).filter(Boolean);
  const atl=atletasUT(U), nP=atl.filter(a=>U.presencas[a.k]==="P").length;
  pn.innerHTML=`<header><h2>Resumo</h2><p class="sub">${U.exercicios.length} exercícios · ${totalUT(U)?fmtTempo(totalUT(U)):"sem duração"}${U.tempoTotal?" (escrito à mão)":""}</p>${porParte.length?`<p class="sub" style="margin:2px 0 0">${esc(porParte.join(" · "))}</p>`:""}</header>
    <div class="add"><h3>Presenças <span class="count" title="Presentes">${nP}</span></h3>
      <p class="sub" style="margin:0"><b>Toque</b>: Presente (<b style="color:${corPres("P")}">P</b>). <b>Botão direito</b> (no iPad, manter o dedo): ${PRESENCAS.filter(p=>p[0]!=="P").map(p=>`<b style="color:${p[2]}">${p[1]}</b>`).join(", ")}.</p>
      <div class="upres">${atl.map(a=>{ const k=U.presencas[a.k]||""; return `<button data-k="${esc(a.k)}" style="${k?`border-color:${corPres(k)};color:${corPres(k)}`:""}"><b>${esc(a.n||a.esc)}</b><span>${esc(a.nome)}</span>${a.n&&a.esc?`<small class="esc">${esc(a.esc)}</small>`:""}${k?`<i style="background:${corPres(k)}">${k}</i>`:""}</button>`; }).join("")||`<p class="sub">Sem jogadores no Plantel.</p>`}</div>
      <button class="btn sm" id="u-xn">+ Jogador de fora do plantel</button></div>
    <div class="add"><h3>Grupos de trabalho</h3>${U.grupos.length?`<ul class="evl">${U.grupos.map(g=>`<li><span style="flex:1"><b>${esc(g.nome||"Grupo")}</b> · ${esc(g.jogadores.map(k=>nomeAtleta(U,k)).join(", ")||"sem jogadores")}${g.nota?`<br><small class="sub">${esc(g.nota)}</small>`:""}</span><button class="btn sm ghost" data-g="${esc(g.id)}">✎</button></li>`).join("")}</ul>`:`<p class="sub" style="margin:0">Sem grupos (ex.: GR, condicionados, reforço).</p>`}
      <button class="btn sm" id="u-gn">+ Grupo</button></div>
    <div class="add"><h3>Campo do plantel</h3><div class="ucampo"></div><p class="sub" style="margin:0">Cada atleta na sua posição (definida no separador Plantel), com a cor da presença; lesionados à parte. Entra no PDF.</p></div>`;
  pn.querySelectorAll(".upres button").forEach(b=>{ const k=b.dataset.k;
    b.onclick=()=>{ if(b.dataset.longo){ delete b.dataset.longo; return; } marcaPres(k,(uts[uCur].presencas[k]==="P")?"":"P"); };
    b.oncontextmenu=e=>menuPres(e,k); premirLongo(b,e=>menuPres(e,k)); });
  $("u-xn").onclick=()=>folhaExtraUT(U.id,null);
  pn.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>folhaGrupoUT(U.id,b.dataset.g)); $("u-gn").onclick=()=>folhaGrupoUT(U.id,null);
  pn.querySelector(".ucampo").appendChild(plantelSvg(U)); }

/* ---------- presenças: toque = Presente; botão direito / dedo pressionado = escolher ---------- */
function marcaPres(k,v){ editaUT(U=>{ if(v) U.presencas[k]=v; else delete U.presencas[k]; }); }
function menuPres(e,k){ const U=uts[uCur]; if(!U) return; const ext=String(k).startsWith("e:")?U.extras.find(x=>"e:"+x.id===k):null;
  menuContexto(e,[...PRESENCAS.map(([c,n])=>[`${c} · ${n}`,()=>marcaPres(k,c)]),["Sem marcação",()=>marcaPres(k,"")],...(ext?[["✎ Editar jogador",()=>folhaExtraUT(U.id,ext.id)]]:[])]); }
/* iPad: manter o dedo meio segundo abre o mesmo menu do botão direito */
function premirLongo(b,fn){ let t=null; b.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse") return; const x=e.clientX, y=e.clientY;
    t=setTimeout(()=>{ t=null; b.dataset.longo="1"; fn({preventDefault(){},clientX:x,clientY:y}); },550); });
  ["pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,()=>{ if(t){ clearTimeout(t); t=null; } })); }
function folhaExtraUT(id,eid){ const U=uts[id]; if(!U) return; const X=eid?U.extras.find(e=>e.id===eid):null; let escl=X?(X.escalao||"Outro"):"Sub19";
  const usados=[...new Map(Object.values(uts).flatMap(u=>u.extras).map(e=>[e.nome,e])).values()];
  folha(`<h3>Jogador de fora do plantel</h3><p class="sub" style="margin:0">Para juniores, juvenis ou outros chamados a esta UT. Fica só nesta UT (os nomes já usados aparecem como sugestão).</p>
    <label class="f">Nome<input type="text" id="ux-n" list="ux-l" value="${esc(X?X.nome:"")}" placeholder="Ex.: Santiago C."><datalist id="ux-l">${usados.map(e=>`<option value="${esc(e.nome)}">`).join("")}</datalist></label>
    <h4>Escalão</h4><div class="seg" id="ux-e">${[...ESC_FORM,"Outro"].map(x=>`<button data-k="${x}">${x}</button>`).join("")}</div>
    <label class="f">Posição no campo do plantel<select id="ux-p"><option value="">—</option>${POS_UT.map(([k,n])=>`<option value="${k}"${X&&X.pos===k?" selected":""}>${k} · ${n}</option>`).join("")}</select></label>
    <div class="actions">${X?`<button class="btn danger l" id="ux-del">Tirar da UT</button>`:""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="ux-ok">${X?"Guardar":"Adicionar"}</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x), pinta=()=>s.querySelectorAll("#ux-e button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===escl)));
    s.querySelectorAll("#ux-e button").forEach(b=>b.onclick=()=>{ escl=b.dataset.k; pinta(); }); pinta();
    q("#ux-n").onchange=()=>{ const u=usados.find(e=>e.nome===q("#ux-n").value.trim()); if(u&&!X){ escl=u.escalao||"Outro"; q("#ux-p").value=u.pos||""; pinta(); } };
    if(q("#ux-del")) confirma2(q("#ux-del"),"Toca outra vez",()=>{ fecha(); editaUT(U=>{ U.extras=U.extras.filter(e=>e.id!==eid); delete U.presencas["e:"+eid]; U.grupos.forEach(g=>{ g.jogadores=g.jogadores.filter(k=>k!=="e:"+eid); }); },`${X.nome} tirado da UT`); });
    q("#ux-ok").onclick=()=>{ const nm=q("#ux-n").value.trim(); if(!nm){ toast("Escreve o nome."); return; } fecha();
      const e={id:eid||uId("e"),nome:nm,escalao:escl==="Outro"?"":escl,pos:q("#ux-p").value};
      editaUT(U=>{ if(eid) U.extras=U.extras.map(x=>x.id===eid?e:x); else U.extras.push(e); },eid?null:`${nm} adicionado à UT`); }; }); }

/* ---------- campo do plantel como na ficha do clube: meio campo, baliza em cima, nomes por posição ---------- */
const PLV={W:1680,H:1060};
function plantelSvg(U){ const {W:VW,H:VH}=PLV, svg=el("svg",{viewBox:`0 0 ${VW} ${VH}`,role:"img","aria-label":"Plantel por posição e disponibilidade"});
  el("rect",{x:0,y:0,width:VW,height:VH,fill:"#fff"},svg);
  /* meio campo (68 m de largo), baliza que defendemos em cima */
  const fx=40, fy=80, fw=VW-80, fh=930, kx=fw/68, ky=fh/52.5, cx=fx+fw/2, L={fill:"none",stroke:"#111","stroke-width":5};
  for(let i=0;i<10;i++) el("rect",{x:fx,y:fy+i*fh/10,width:fw,height:fh/10,fill:i%2?"#F1F1F1":"#FAFAFA"},svg);
  el("rect",{x:cx-3.66*kx,y:fy-2.2*ky,width:7.32*kx,height:2.2*ky,fill:"#D9D9D9",stroke:"#111","stroke-width":4},svg);
  el("rect",{x:fx,y:fy,width:fw,height:fh,...L,"stroke-width":7},svg);
  el("rect",{x:cx-20.16*kx,y:fy,width:40.32*kx,height:16.5*ky,...L},svg); el("rect",{x:cx-9.16*kx,y:fy,width:18.32*kx,height:5.5*ky,...L},svg);
  el("path",{d:`M ${cx-7.31*kx} ${fy+16.5*ky} A ${9.15*kx} ${9.15*ky} 0 0 0 ${cx+7.31*kx} ${fy+16.5*ky}`,...L},svg);
  el("path",{d:`M ${cx-9.15*kx} ${fy+fh} A ${9.15*kx} ${9.15*ky} 0 0 1 ${cx+9.15*kx} ${fy+fh}`,...L},svg);
  const atl=atletasUT(U), pres=a=>U.presencas[a.k]||"", les=atl.filter(a=>pres(a)==="L"), resto=atl.filter(a=>pres(a)!=="L"&&!(a.form&&!pres(a)));
  /* caixa de nome com a borda na cor da presença (sem marcação: cinzento escuro) */
  const caixa=(x,y,a,w)=>{ const p=pres(a), c=p?corPres(p):"#4A4A4A", g=el("g",{},svg), t=a.nome||a.n||"?", fs=23;
    el("rect",{x:x-w/2,y,width:w,height:38,rx:5,fill:"#fff",stroke:c,"stroke-width":p?5:3},g);
    const tx=el("text",{x,y:y+27,"text-anchor":"middle","font-size":fs,"font-weight":700,fill:"#1B1A17",class:"lbl"},g); tx.textContent=t;
    if(a.esc){ const ts=el("tspan",{"font-size":13,fill:"#6B675E","font-weight":400},tx); ts.textContent=" ("+a.esc+")"; }
    if(textW(t+(a.esc?" ("+a.esc+")":""),fs,700)>w-16){ tx.setAttribute("textLength",w-16); tx.setAttribute("lengthAdjust","spacingAndGlyphs"); } };
  POS_UT.forEach(([k,,px,py])=>{ const x=fx+px*fw, y=fy+py*fh, gr=k==="1";
    el("circle",{cx:x,cy:y,r:27,fill:gr?"#FFFF00":"#C00000",stroke:"#1B1A17","stroke-width":3},svg);
    el("text",{x,y:y+9,"text-anchor":"middle","font-size":26,"font-weight":700,fill:gr?"#000":"#fff",class:"num"},svg).textContent=k;
    resto.filter(a=>a.pos===k).forEach((a,i)=>caixa(x,y+34+i*44,a,250)); });
  /* lesionados à parte (canto superior direito), contagens em cima à esquerda */
  if(les.length){ const x=fx+fw-170; el("text",{x,y:fy+32,"text-anchor":"middle","font-size":24,"font-weight":800,fill:"#C00000",class:"lbl"},svg).textContent="LESIONADOS:";
    les.forEach((a,i)=>caixa(x,fy+44+i*44,a,280)); }
  const comPos=resto.filter(a=>a.pos), gr=comPos.filter(a=>a.pos==="1"), campo=comPos.filter(a=>a.pos!=="1"), ext=l=>l.filter(a=>a.esc).length, nP=atl.filter(a=>pres(a)==="P").length;
  const resumo=`GR: ${gr.length-ext(gr)}${ext(gr)?"+"+ext(gr)+" (formação)":""}  //  Campo: ${campo.length-ext(campo)}${ext(campo)?"+"+ext(campo):""}  //  Presentes: ${nP}${les.length?"  //  Lesionados: "+les.length:""}`;
  const rw=textW(resumo,24,700)+60; el("path",{d:`M ${fx} ${fy-58} H ${fx+rw} L ${fx+rw-24} ${fy-12} H ${fx} Z`,fill:"#1B1A17"},svg);
  el("text",{x:fx+18,y:fy-26,"font-size":24,"font-weight":700,fill:"#fff",class:"lbl"},svg).textContent=resumo;
  const semPos=resto.filter(a=>!a.pos);
  if(semPos.length){ const t=el("text",{x:fx,y:VH-12,"font-size":22,class:"legtxt"},svg); el("tspan",{fill:"#C00000","font-weight":800},t).textContent="Sem posição no Plantel:  ";
    el("tspan",{fill:"#1B1A17","font-weight":700},t).textContent=semPos.map(a=>(a.n?a.n+" ":"")+(a.nome||"")).join("  ·  ");
    if(textW(t.textContent,22,700)>VW-80){ t.setAttribute("textLength",VW-80); t.setAttribute("lengthAdjust","spacingAndGlyphs"); } }
  return svg; }

/* ---------- folhas ---------- */
function folhaCabUT(id){ const U=uts[id]; if(!U) return; let md=U.matchDay; const regimes=[...new Set(Object.values(uts).map(u=>u.regime).filter(Boolean))];
  folha(`<h3>Cabeçalho da UT</h3>
    <div class="fields"><label class="f">Unidade de treino (nº)<input type="text" inputmode="numeric" id="uc-n" value="${U.numero||""}"></label><label class="f">Data<input type="date" id="uc-d" value="${esc(U.data)}"></label></div>
    <h4>Match Day</h4><div class="seg" id="uc-md"><button data-k="">—</button>${MATCH_DAYS.map(m=>`<button data-k="${m}">${m}</button>`).join("")}</div>
    <label class="f">Regime<input type="text" id="uc-r" list="uc-rl" value="${esc(U.regime)}" placeholder="Ex.: Híbrido (+/-)"><datalist id="uc-rl">${regimes.map(r=>`<option value="${esc(r)}">`).join("")}</datalist></label>
    <label class="f">Objetivos (um por linha)<textarea id="uc-o" rows="3" placeholder="Ex.: Tensão\nPrincípios estratégicos org. ofensiva da 1.ª fase">${esc(U.objetivos.join("\n"))}</textarea></label>
    <label class="f">Material extra (um por linha; o dos exercícios junta-se sozinho)<textarea id="uc-m" rows="2">${esc(U.material.join("\n"))}</textarea></label>
    <div class="fields"><label class="f">Tempo total do treino<input type="text" id="uc-t" value="${U.tempoTotal?fmtTempo(U.tempoTotal):""}" placeholder="Soma: ${fmtTempo(U.exercicios.reduce((a,l)=>a+totalEx(l.copia),0))}"></label>
      <label class="f">Equipa técnica (rodapé)<input type="text" id="uc-s" value="${esc(U.staff||staffPadrao())}"></label></div>
    <div class="actions"><button class="btn danger l" id="uc-del">Apagar UT</button><button class="btn" data-close>Cancelar</button><button class="btn primary" id="uc-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x), pinta=()=>s.querySelectorAll("#uc-md button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===md)));
    s.querySelectorAll("#uc-md button").forEach(b=>b.onclick=()=>{ md=b.dataset.k; pinta(); }); pinta();
    confirma2(q("#uc-del"),"Toca outra vez para apagar",()=>{ fecha(); apagaUT(id); });
    q("#uc-ok").onclick=()=>{ const t=lerDur(q("#uc-t").value); if(isNaN(t)){ toast("Tempo total que não percebo. Usa por exemplo 88'."); return; }
      const X=uts[id]; fecha(); guardaUT({...clone(X),numero:q("#uc-n").value,data:q("#uc-d").value,matchDay:md,regime:q("#uc-r").value,objetivos:q("#uc-o").value,material:q("#uc-m").value,tempoTotal:t||null,staff:q("#uc-s").value}); toast("Cabeçalho guardado"); }; }); }
let uFiltro={q:"",parte:"",mom:"",tipo:""};
function folhaAddExUT(id){ const U=uts[id]; if(!U) return; const escolhidos=new Set();
  folha(`<h3>Adicionar exercícios à UT${U.numero}</h3><p class="sub" style="margin:0">Cada exercício entra como cópia de como está hoje no repositório.</p>
    <div class="ex-filtros" style="margin:0"><input type="search" id="ua-q" placeholder="Pesquisar…" aria-label="Pesquisar"><select id="ua-p" aria-label="Parte"><option value="">Todas as partes</option>${PARTES.map(p=>`<option value="${p[0]}">${p[1]}</option>`).join("")}</select>
      <select id="ua-m" aria-label="Momento"><option value="">Todos os momentos</option>${MOM_EX.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join("")}</select><select id="ua-t" aria-label="Tipo"><option value="">Todos os tipos</option>${TIPOS_EX.map(t=>`<option value="${t[0]}">${t[1]}</option>`).join("")}</select></div>
    <div id="ua-l" class="ua-l"></div>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ua-ok" disabled>Adicionar</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x), ok=q("#ua-ok"); q("#ua-q").value=uFiltro.q; q("#ua-p").value=uFiltro.parte; q("#ua-m").value=uFiltro.mom; q("#ua-t").value=uFiltro.tipo;
    const lista=()=>{ uFiltro={q:q("#ua-q").value,parte:q("#ua-p").value,mom:q("#ua-m").value,tipo:q("#ua-t").value}; const t=uFiltro.q.trim().toLowerCase();
      const ls=Object.values(exercicios).filter(E=>(!uFiltro.parte||E.parte===uFiltro.parte)&&(!uFiltro.mom||E.momento===uFiltro.mom)&&(!uFiltro.tipo||E.tipo===uFiltro.tipo)&&(!t||[E.nome,E.formato,E.descricao,E.objetivos].join(" ").toLowerCase().includes(t)))
        .sort((a,b)=>uParteOrd(a.parte)-uParteOrd(b.parte)||a.nome.localeCompare(b.nome,"pt")), ja=new Set(uts[id].exercicios.map(l=>l.exId));
      q("#ua-l").innerHTML=ls.length?ls.map(E=>`<label><input type="checkbox" value="${esc(E.id)}"${escolhidos.has(E.id)?" checked":""}><span><b>${esc(E.nome)}</b><small>${esc([parteDe(E.parte)[1],E.formato,rotuloDe(TIPOS_EX,E.tipo),totalEx(E)?fmtTempo(totalEx(E)):""].filter(Boolean).join(" · "))}${ja.has(E.id)?" · já está na UT":""}</small></span></label>`).join(""):`<p class="sub">Nenhum exercício com estes filtros.</p>`;
      q("#ua-l").querySelectorAll("input").forEach(i=>i.onchange=()=>{ i.checked?escolhidos.add(i.value):escolhidos.delete(i.value); conta(); }); };
    const conta=()=>{ ok.disabled=!escolhidos.size; ok.textContent=escolhidos.size?`Adicionar ${escolhidos.size}`:"Adicionar"; };
    ["#ua-q","#ua-p","#ua-m","#ua-t"].forEach(i=>q(i).addEventListener(i==="#ua-q"?"input":"change",lista)); lista(); conta();
    ok.onclick=()=>{ const novos=[...escolhidos].map(x=>exercicios[x]).filter(Boolean).sort((a,b)=>uParteOrd(a.parte)-uParteOrd(b.parte)); fecha();
      /* cada um entra no fim da sua parte (inicial → fundamental → final) */
      editaUT(U=>novos.forEach(E=>{ const l={id:uId("l"),exId:E.id,copia:clone(E)}, j=U.exercicios.findIndex(x=>uParteOrd(x.copia.parte)>uParteOrd(E.parte)); if(j<0) U.exercicios.push(l); else U.exercicios.splice(j,0,l); }),`${novos.length} ${novos.length===1?"exercício adicionado":"exercícios adicionados"}`); }; }); }
function folhaAjusteUT(id,lid){ const U=uts[id], l=U&&U.exercicios.find(x=>x.id===lid); if(!l) return; const E=l.copia, D=E.duracao, tt=s=>s?fmtTempo(s):""; let parte=E.parte;
  folha(`<h3>Ajustar nesta UT</h3><p class="sub" style="margin:0"><b>${esc(E.nome)}</b> · as mudanças ficam só na UT${U.numero}; o exercício do repositório não muda.</p>
    <h4>Parte</h4><div class="seg" id="uj-p">${PARTES.map(p=>`<button data-k="${p[0]}">${p[1]}</button>`).join("")}</div>
    <label class="f">Espaço<input type="text" id="uj-e" value="${esc(E.espaco.txt)}"></label>
    <div class="xe-dur"><label class="f">Séries / reps.<input type="text" inputmode="numeric" id="uj-se" value="${D.series||""}"></label><label class="f">Tempo prática<input type="text" id="uj-pr" value="${tt(D.pratica)}"></label><label class="f">Pausa<input type="text" id="uj-pa" value="${tt(D.pausa)}"></label><label class="f">Total<input type="text" id="uj-to" value="${tt(D.total)}" placeholder="Conta: ${fmtTempo(contaDur(D))}"></label></div>
    <label class="f">Variantes (uma por linha)<textarea id="uj-v" rows="3">${esc(E.variantes.join("\n"))}</textarea></label>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="uj-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x), pinta=()=>s.querySelectorAll("#uj-p button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===parte)));
    s.querySelectorAll("#uj-p button").forEach(b=>b.onclick=()=>{ parte=b.dataset.k; pinta(); }); pinta();
    q("#uj-ok").onclick=()=>{ const d={series:Math.max(0,parseInt(q("#uj-se").value)||0),pratica:lerDur(q("#uj-pr").value),pausa:lerDur(q("#uj-pa").value),total:lerDur(q("#uj-to").value)};
      if(["pratica","pausa","total"].some(k=>isNaN(d[k]))){ toast("Corrige os tempos da duração."); return; } fecha();
      editaUT(U=>{ const x=U.exercicios.find(y=>y.id===lid); x.copia={...x.copia,parte,espaco:{...x.copia.espaco,txt:q("#uj-e").value},duracao:{...d,total:d.total||null},variantes:q("#uj-v").value}; },"Ajustado nesta UT"); }; }); }
function folhaGrupoUT(id,gid){ const U=uts[id]; if(!U) return; const G=gid?U.grupos.find(g=>g.id===gid):null, sel=new Set(G?G.jogadores:[]);
  folha(`<h3>${G?"Grupo de trabalho":"Novo grupo de trabalho"}</h3>
    <label class="f">Nome<input type="text" id="ug-n" value="${esc(G?G.nome:"")}" placeholder="Ex.: Guarda-redes, Condicionados, Reforço"></label>
    <h4>Jogadores</h4><div class="pgrid" id="ug-j"></div>
    <label class="f">Nota (opcional)<input type="text" id="ug-o" value="${esc(G?G.nota:"")}" placeholder="Ex.: trabalho específico com o treinador de GR"></label>
    <div class="actions">${G?`<button class="btn danger l" id="ug-del">Apagar grupo</button>`:""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="ug-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x), g=q("#ug-j");
    const atl=atletasUT(U); g.innerHTML=atl.map(a=>`<button data-k="${esc(a.k)}"><b>${esc(a.n||a.esc)}</b><span>${esc(a.nome||" ")}</span>${U.presencas[a.k]?`<small>${U.presencas[a.k]}</small>`:""}</button>`).join("");
    const pintaG=()=>g.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(sel.has(b.dataset.k))));
    g.querySelectorAll("button").forEach(b=>b.onclick=()=>{ sel.has(b.dataset.k)?sel.delete(b.dataset.k):sel.add(b.dataset.k); pintaG(); }); pintaG();
    if(q("#ug-del")) confirma2(q("#ug-del"),"Toca outra vez",()=>{ fecha(); editaUT(U=>{ U.grupos=U.grupos.filter(x=>x.id!==gid); },"Grupo apagado"); });
    q("#ug-ok").onclick=()=>{ const nm=q("#ug-n").value.trim(); if(!nm&&!sel.size){ toast("Dá um nome ou escolhe jogadores."); return; } fecha();
      const ng={id:gid||uId("g"),nome:nm,jogadores:atl.map(a=>a.k).filter(k=>sel.has(k)),nota:q("#ug-o").value.trim()};
      editaUT(U=>{ if(gid) U.grupos=U.grupos.map(x=>x.id===gid?ng:x); else U.grupos.push(ng); }); }; }); }
/* ver a ficha do exercício tal como está nesta UT */
function folhaVerExUT(id,lid){ const U=uts[id], i=U?U.exercicios.findIndex(x=>x.id===lid):-1; if(i<0) return; const E=U.exercicios[i].copia;
  folha(`<h3>Exercício ${i+1} · UT${U.numero}</h3>${fichaHtml(E,i+1)}<div class="ufig"></div>
    <div class="actions"><button class="btn" data-close>Fechar</button><button class="btn primary" id="uv-aj">Ajustar nesta UT</button></div>`,(s,fecha)=>{
    const f=s.querySelector(".ufig");
    if(usaImagem(E)){ const im=document.createElement("img"); im.alt="Figura do exercício"; im.src=srcImagem(E.figura.imagem); f.appendChild(im); }
    else if(temFigura(E)){ const P=playerModelo(figuraQde(E),{}); f.appendChild(P.svg); }
    s.querySelector("#uv-aj").onclick=()=>{ fecha(); folhaAjusteUT(id,lid); }; }); }

/* ---------- PDF da UT: formato do clube, cabeçalho em cada página e 4 exercícios por página (2×2) ---------- */
async function pdfUT(U){
  if(!window.jspdf) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const doc=new window.jspdf.jsPDF({unit:"pt",format:"a4"}), PW=595.28, PH=841.89, M=12, G=8, RED=[192,0,0], INK=[27,26,23], MUT=[110,106,98], GR=[236,234,228], LN=[200,196,186], BR=[255,255,255];
  const T=(txt,x,y,s,o={})=>{ doc.setFont("helvetica",o.b?(o.i?"bolditalic":"bold"):(o.i?"italic":"normal")); doc.setFontSize(s); doc.setTextColor(...(o.c||INK)); doc.text(pdfTxt(txt),x,y,o.al?{align:o.al}:undefined); };
  const caixa=(x,y,w,h,cor,txt,o={})=>{ doc.setFillColor(...cor); doc.rect(x,y,w,h,"F"); if(txt) T(txt,x+w/2,y+h*.7,o.s||7,{b:1,c:o.c||BR,al:"center",i:o.i}); };
  const css=await cssFontes(); try{ await document.fonts.ready; }catch(e){}
  const campoJpg=await svgParaJpeg(plantelSvg(U),css,PLV.W,PLV.H), hw=(PW-2*M-G)/2, HC=150, tot=totalUT(U), mat=materialUT(U);
  const cabecalho=()=>{ const x=M, y=M; caixa(x,y,hw,14,INK,"COMPROMISSO | RESILIÊNCIA | UNIÃO | ATITUDE | PAIXÃO | ALEGRIA",{i:1,s:7});
    const wc=hw*.3, xr=x+wc, wr=hw-wc; caixa(x,y+18,wc,84,RED); if(IMG_DATA["slides/logo-pdf.png"]) try{ doc.addImage(IMG_DATA["slides/logo-pdf.png"],"PNG",x+wc/2-28,y+22,56,50); }catch(e){}
    T("SPORT CLUB",x+wc/2,y+77,6.5,{b:1,i:1,c:BR,al:"center"}); T("ANGRENSE",x+wc/2,y+86,6.5,{b:1,i:1,c:BR,al:"center"});
    caixa(xr,y+18,wr/2,11,RED,"MATERIAL",{i:1}); caixa(xr+wr/2,y+18,wr/2,11,RED,"OBJETIVOS",{i:1});
    doc.setFont("helvetica","normal"); doc.setFontSize(5.8); doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(pdfTxt(mat.join(", ")||"-"),wr/2-6).slice(0,5),xr+3,y+36);
    doc.setFont("helvetica","bold"); doc.text(doc.splitTextToSize(pdfTxt(U.objetivos.join(" | ")||"-"),wr/2-6).slice(0,5),xr+wr/2+wr/4,y+36,{align:"center"});
    caixa(xr,y+70,wr/2,10,[64,64,64],"DATA"); caixa(xr+wr/2,y+70,wr/2,10,[64,64,64],"UNIDADE DE TREINO");
    T(dataPt_(U.data),xr+wr/4,y+89,7.5,{al:"center"}); T(String(U.numero||"-"),xr+wr*.75,y+89,8,{b:1,c:RED,al:"center"});
    caixa(x,y+104,wc,10,[64,64,64],"MATCH DAY"); caixa(xr,y+104,wr/2,10,[64,64,64],"REGIME"); caixa(xr+wr/2,y+104,wr/2,10,[64,64,64],"TEMPO TOTAL TREINO");
    T(U.matchDay||"-",x+wc/2,y+123,7.5,{b:1,al:"center"}); caixa(xr,y+115,wr/2,11,[0,176,80],U.regime||"-",{s:6.5}); T(tot?fmtTempo(tot):"-",xr+wr*.75,y+123,8,{b:1,al:"center"});
    doc.setDrawColor(...LN); doc.setLineWidth(.5); doc.rect(x,y+18,hw,108);
    let lx=x+30; T("LEGENDA:",lx,y+136,6,{b:1}); lx+=doc.getTextWidth("LEGENDA:")+4; PRESENCAS.forEach(([k,n,c])=>{ const t=`${n}${k==="NFL"?"":" ("+k+")"}`; T(t,lx,y+136,6,{c:c.match(/\w\w/g).map(h=>parseInt(h,16))}); lx+=doc.getTextWidth(t)+3; T("|",lx,y+136,6,{c:MUT}); lx+=6; });
    const xR=M+hw+G; caixa(xR,y,hw,14,RED,`SC ANGRENSE ${epocaDe(U.data)}`,{i:1,s:7});
    const r_=PLV.W/PLV.H, wi=Math.min(hw,(HC-20)*r_), hi=wi/r_; doc.addImage(campoJpg,"JPEG",xR+(hw-wi)/2,y+17,wi,hi,undefined,"FAST"); doc.rect(xR,y+17,hw,hi); };
  /* 4 blocos por página; o último bloco livre leva os grupos de trabalho */
  const y0=M+HC+6, cw=hw, ch=(PH-y0-26-G)/2, blocos=[...U.exercicios.map((l,i)=>({l,i})),{grupos:true}];
  for(let b=0;b<blocos.length;b++){ const pos=b%4; if(pos===0){ if(b) doc.addPage(); cabecalho(); }
    const x=M+(pos%2)*(cw+G), y=y0+Math.floor(pos/2)*(ch+G), B=blocos[b];
    if(B.grupos){ caixa(x,y,cw,14,INK,"GRUPOS DE TRABALHO",{i:1,s:7.5}); doc.setDrawColor(...INK); doc.setLineWidth(.9); doc.rect(x,y,cw,ch); let yy=y+26;
      if(!U.grupos.length){ T("Sem grupos de trabalho.",x+8,yy,7,{c:MUT}); }
      U.grupos.forEach(g=>{ if(yy>y+ch-10) return; T(g.nome||"Grupo",x+8,yy,7.5,{b:1,c:RED}); yy+=10; doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(...INK);
        const ls=doc.splitTextToSize(pdfTxt(g.jogadores.map(k=>nomeAtleta(U,k)).join(", ")+(g.nota?" — "+g.nota:"")),cw-16); ls.forEach(l=>{ if(yy<=y+ch-6){ doc.text(l,x+8,yy); yy+=8.5; } }); yy+=4; });
      continue; }
    const E=B.l.copia, hf=ch*.52; fichaExPdf(doc,E,x,y,cw,{k:.6,hMax:hf,num:B.i+1});
    const fig=await figuraJpegEx(E), fy=y+hf+3, fh=ch-hf-3;
    if(fig){ let w=cw, h=cw*fig.h/fig.w; if(h>fh){ h=fh; w=h*fig.w/fig.h; } figuraNoPdf(doc,fig,x+(cw-w)/2,fy+(fh-h)/2,w,h); }
    doc.setDrawColor(...INK); doc.setLineWidth(.9); doc.rect(x,fy,cw,fh); }
  const np=doc.getNumberOfPages(), rod=U.staff||staffPadrao();
  for(let i=1;i<=np;i++){ doc.setPage(i); T(`${rod}${np>1?`   ·   ${i}/${np}`:""}`,PW/2,PH-12,6.5,{b:1,c:RED,al:"center"}); }
  return doc; }
async function guardaPdfUT(id,botao){ const U=uts[id]; if(!U) return; if(botao) botao.disabled=true; toast("A gerar o PDF da UT…");
  try{ const doc=await pdfUT(U), buf=doc.output("arraybuffer"), nomeF=`UT${U.numero}_SCA_${dataPt_(U.data).replace(/\//g,"-")}.pdf`;
    let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
    if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([buf],{type:"application/pdf"})); a.download=nomeF; document.body.appendChild(a); a.click(); a.remove(); }
    else { await dl.save({filename:nomeF,data:new Uint8Array(buf)}); toast("PDF da UT guardado"); } }
  catch(e){ if(e?.code!=="declined") toast(e?.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet.":"Não foi possível gerar o PDF ("+(e?.code||e?.message||"erro")+")"); }
  finally{ if(botao) botao.disabled=false; } }

/* ---------- sincronização ---------- */
function ligaUTDb(){ if(!db) return; db.collection("uts").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
    q.docs.forEach(d=>{ const x=d.data(); if(x){ const c={...x}; delete c.atualizadoEm; try{ m[d.id]=normUT({...c,id:d.id}); }catch(e){} } });
    mergeCol("uts/",m,uts); if(JSON.stringify(m)!==JSON.stringify(uts)){ uts=m; guardaUTLocal(); if(!$("sheet-root").innerHTML) renderUT(); } },()=>{}); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaUTDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();
