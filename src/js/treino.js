
/* ================= TREINO · Unidades de Treino (UT) feitas com os exercícios do repositório ================= */
const MATCH_DAYS=["MD+1","MD+2","MD-6","MD-5","MD-4","MD-3","MD-2","MD-1","MD"];
const PRESENCAS=[["P","Presente","#1E9E3E"],["L","Lesão","#C00000"],["A","Ausente","#E36C09"],["C","Castigado","#7030A0"],["CO","Condicionado","#0070C0"]];
/* nos grupos de trabalho só entra quem está no treino: presente ou condicionado */
const PRES_GRUPO=new Set(["P","CO"]);
const presenteUT=(U,k)=>PRES_GRUPO.has(U.presencas[k]);
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
  const grupos=(Array.isArray(d.grupos)?d.grupos:[]).filter(g=>g&&(g.nome||(g.jogadores||[]).length)).map(g=>({id:s(g.id)||uId("g"),nome:s(g.nome),jogadores:L(g.jogadores),nota:s(g.nota)}));
  return {id:s(d.id)||uId(), numero:n(d.numero), data:/^\d{4}-\d{2}-\d{2}$/.test(s(d.data))?s(d.data):"", matchDay:s(d.matchDay), regime:s(d.regime),
    objetivos:L(d.objetivos), material:L(d.material), tempoTotal:n(d.tempoTotal)||null, presencas:pres, staff:s(d.staff),
    /* jogadores chamados de fora do plantel (juniores, juvenis…): só nesta UT; nas presenças e grupos são "e:<id>" */
    extras:(Array.isArray(d.extras)?d.extras:[]).filter(e=>e&&s(e.nome)).map(e=>({id:s(e.id)||uId("e"),nome:s(e.nome),escalao:s(e.escalao),pos:POS_UT.some(x=>x[0]===s(e.pos))?s(e.pos):"",...(s(e.alc)?{alc:s(e.alc)}:{})})),
    grupos,
    /* cada exercício da UT é uma cópia do exercício no dia: mudar o repositório depois não mexe nas UT antigas. As ligações (vídeos) nunca vêm para a UT.
       Na linha: pai (complementar de), conta (estatística de tempos só nesta UT), grupos (ids dos grupos de trabalho) e rot (rotação, no principal) — ver tempos.js */
    exercicios:arrumaLinhas((Array.isArray(d.exercicios)?d.exercicios:[]).filter(e=>e&&e.copia).map(e=>{ const c=normEx({...e.copia,id:s(e.exId)||s(e.copia.id)}); delete c.links;
      const l={id:s(e.id)||uId("l"),exId:s(e.exId),copia:c}; if(s(e.pai)) l.pai=s(e.pai); if(typeof e.conta==="boolean") l.conta=e.conta;
      if(Array.isArray(e.grupos)) l.grupos=L(e.grupos); if(e.rot&&typeof e.rot==="object") l.rot=e.rot; return l; }),grupos),
    criadoPor:s(d.criadoPor), criadoEm:s(d.criadoEm), alteradoPor:s(d.alteradoPor), alteradoEm:s(d.alteradoEm)}; }
Object.keys(uts).forEach(id=>{ try{ uts[id]=normUT({...uts[id],id}); }catch(e){ delete uts[id]; } });

/* atletas da UT: plantel (chave = nº) e jogadores de fora (chave = "e:<id>") */
function atletasUT(U){ const pl=est.plantel.filter(p=>p.n).slice().sort((a,b)=>byNum(a.n,b.n)), at=p=>({k:p.n,n:p.n,nome:p.nome||"",pos:p.pos||"",esc:p.esc||"",form:!!p.esc,alc:p.alc||""});
  return [...pl.filter(p=>!p.esc).map(at),...pl.filter(p=>p.esc).map(at),
  ...U.extras.map(e=>({k:"e:"+e.id,n:"",nome:e.nome,pos:e.pos,esc:e.escalao||"Extra",alc:e.alc||""}))]; }
/* nos grupos, no campo do plantel e nos tempos: a 1.ª alcunha; sem alcunha, primeiro e último nome (nunca o nome completo nem o número).
   A ligação ao atleta continua pela chave (nº do plantel ou "e:<id>"); Quadro, ficha de jogo e Onze continuam com números */
function nomeCurto(a){ const al=String(a&&a.alc||"").split(/[,;]/)[0].trim(); if(al) return al; const w=String(a&&a.nome||"").trim().split(/\s+/).filter(Boolean);
  return w.length>1?`${w[0]} ${w[w.length-1]}`:(w[0]||(a&&a.n?"nº "+a.n:"?")); }
function nomeAtleta(U,k){ const a=atletasUT(U).find(x=>x.k===k); if(!a) return String(k).startsWith("e:")?"?":"nº "+k;
  return nomeCurto(a)+(String(k).startsWith("e:")&&a.esc&&a.esc!=="Extra"?` (${a.esc})`:""); }
/* complementares não somam ao tempo da UT nem ao da parte */
const principaisUT=U=>U.exercicios.filter(l=>!l.pai);
const totalUT=U=>U.tempoTotal||principaisUT(U).reduce((a,l)=>a+totalEx(l.copia),0);
const materialUT=U=>[...new Set([...U.material,...U.exercicios.flatMap(l=>l.copia.material)])];
const listaUTs=()=>Object.values(uts).sort((a,b)=>(b.data||"").localeCompare(a.data||"")||b.numero-a.numero);
const dataPt_=d=>d?new Date(d+"T12:00").toLocaleDateString("pt-PT"):"sem data";
/* época do clube a partir da data (julho em diante = época nova): 2026-10-21 → 26.27 */
function epocaDe(d){ const x=d?new Date(d+"T12:00"):new Date(), a=x.getFullYear()-(x.getMonth()<6?1:0); return `${String(a).slice(2)}.${String(a+1).slice(2)}`; }

/* ---------- gravação (um documento por UT, pela fila pendentes) ---------- */
function guardaUTLocal(){ try{ localStorage.setItem(U_LS,JSON.stringify(uts)); }catch(e){} }
function guardaUT(U,semRender){ const N=normUT({...U,alteradoPor:meuId||U.alteradoPor||"",alteradoEm:new Date().toISOString()}); uts[N.id]=N; guardaUTLocal(); gravaDoc("uts/"+N.id,N); if(!semRender) renderUT(); return N; }
function editaUT(fn,msg){ const U0=uts[uCur]; if(!U0) return; const antes=clone(U0), U=clone(U0); fn(U); guardaUT(U); if(msg) toast(msg,()=>{ guardaUT(antes); }); }
/* UT nova: nº do planeamento anual para hoje (senão a seguir à última) e Match Day pelo calendário */
function novaUT(){ const ls=listaUTs(), ult=ls[0], hoje=isoDia(new Date()), A=diaAnualDe(hoje), num=A&&A.ut?A.ut:Math.max(0,...ls.map(u=>u.numero))+1;
  const U=guardaUT({id:uId(),numero:num,data:hoje,matchDay:mdAuto(hoje),staff:staffPadrao(),regime:"",objetivos:[],exercicios:[],criadoPor:meuId||"",criadoEm:new Date().toISOString()},true);
  uCur=U.id; renderUT(); folhaCabUT(U.id); if(ult) toast(`UT${num} criada · a seguir à UT${ult.numero}`); }
function apagaUT(id){ const U=uts[id]; if(!U) return; const antes=clone(U); delete uts[id]; guardaUTLocal(); apagaDoc("uts/"+id); if(uCur===id) uCur=null; renderUT();
  toast(`UT${U.numero} apagada`,()=>{ uts[id]=antes; guardaUTLocal(); gravaDoc("uts/"+id,antes); uCur=id; renderUT(); }); }
function duplicaUT(id){ const U=uts[id]; if(!U) return; const num=Math.max(0,...listaUTs().map(u=>u.numero))+1;
  const N=guardaUT({...clone(U),id:uId(),numero:num,data:new Date().toISOString().slice(0,10),presencas:{},exercicios:(()=>{ const m={}; U.exercicios.forEach(l=>m[l.id]=uId("l"));
      return U.exercicios.map(l=>{ const x={...clone(l),id:m[l.id]}; if(x.pai) x.pai=m[x.pai]; if(x.rot) x.rot.grelha=x.rot.grelha.map(r=>r.map(v=>m[v]||v)); return x; }); })(),criadoPor:meuId||"",criadoEm:new Date().toISOString()},true);
  uCur=N.id; renderUT(); toast(`UT${num} criada a partir da UT${U.numero}`); }
function repoeUTs(X){ Object.keys(uts).forEach(id=>{ if(!X[id]) apagaDoc("uts/"+id); }); uts={}; Object.entries(X||{}).forEach(([id,U])=>{ uts[id]=normUT({...U,id}); gravaDoc("uts/"+id,uts[id]); }); guardaUTLocal(); renderUT(); }

/* ---------- ecrã ---------- */
function renderUT(){ const v=$("view-u"); if(!v||v.hidden) return; if(uModo==="semana"){ renderSemana(); return; } if(uModo==="ano"){ renderAnual(); return; } if(uModo==="tempos"){ renderTempos(); return; } const ls=listaUTs(); let U=uts[uCur]||ls[0]||null; uCur=U?U.id:null;
  try{ localStorage.setItem("sca-ut-cur",uCur||""); }catch(e){}
  renderUTNav(ls,U); renderUTCorpo(U); renderUTPainel(U); }
function renderUTNav(ls,U){ const nav=$("u-nav");
  nav.innerHTML=modoUTHtml()+`<button class="newl" id="u-nova">+ Nova UT</button><div class="grp"><h3>Unidades de treino</h3><ul>${ls.length?ls.map(x=>`<li><button data-id="${esc(x.id)}" aria-current="${!!U&&x.id===U.id}"><span class="n">${x.numero||"–"}</span><span class="m-nm">UT${x.numero} · ${esc(dataPt_(x.data).slice(0,5))}<small>${esc([x.matchDay,principaisUT(x).length+" exerc.",totalUT(x)?fmtTempo(totalUT(x)):""].filter(Boolean).join(" · "))}</small></span></button></li>`).join(""):`<li><span class="m-nada">Ainda sem UT</span></li>`}</ul></div>`;
  $("u-nova").onclick=novaUT; ligaModoUT(nav);
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
  else { const nums=numerosUT(U), pr=principaisUT(U), T=temposUT(U);
    h+=`<ol class="utx">${U.exercicios.map(l=>{ const E=l.copia, P=parteDe(E.parte), mud=mudouNoRepo(l), ip=pr.indexOf(l), cs=U.exercicios.filter(c=>c.pai===l.id), ct=contaLinha(l);
      const gs=(l.grupos||[]).map(id=>U.grupos.find(g=>g.id===id)).filter(Boolean), av=l.pai?[]:T.avisos.filter(a=>a.lid===l.id).map(a=>a.t.replace(/^[\d.]+ · /,""));
      const tempo=l.pai?(ct?"⏱ conta para os tempos":"não conta para os tempos"):!ct&&!cs.some(contaLinha)?"não conta para os tempos":gs.length?`👥 ${gs.map(g=>g.nome||"Grupo").join(", ")}`:"";
      return `<li data-l="${esc(l.id)}"${l.pai?' class="utx-c"':""}><span class="utx-n">${nums[l.id]}</span><div class="utx-t"><span class="tag" style="background:${l.pai?"#5B5B5B":P[2]}">${l.pai?"COMPLEMENTAR":esc(P[1].replace("Parte ","").toUpperCase())}</span><b>${esc(E.nome)}</b><small>${esc([E.formato,E.espaco.txt,totalEx(E)?fmtTempo(totalEx(E)):"",rotuloDe(TIPOS_EX,E.tipo),l.pai?"em paralelo, não soma ao tempo":""].filter(Boolean).join(" · "))}${mud?` · <span class="utx-mud">mudou no repositório</span>`:""}${!exercicios[l.exId]?` · <span class="sub">já não está no repositório</span>`:""}</small>${tempo?`<small class="utx-tp">${esc(tempo)}</small>`:""}
        ${l.rot&&cs.length?rotMiniHtml(U,l,cs,nums):""}${av.length?`<ul class="uavisos">${av.map(t=>`<li>⚠ ${esc(t)}</li>`).join("")}</ul>`:""}</div>
        <div class="rowbtns">${l.pai?"":`<button class="icon" data-a="up" aria-label="Subir" ${ip?"":"disabled"}>▲</button><button class="icon" data-a="dn" aria-label="Descer" ${ip<pr.length-1?"":"disabled"}>▼</button>`}<button class="btn sm ghost" data-a="aj">Ajustar</button>${mud?`<button class="btn sm ghost" data-a="at">↻ Atualizar</button>`:""}<button class="btn sm ghost" data-a="gt" aria-label="Grupos e tempos">👥 Grupos</button>${l.pai?"":`<button class="btn sm ghost" data-a="cp" aria-label="Juntar exercício complementar">+ Compl.</button>`}<button class="btn sm ghost" data-a="x" aria-label="Tirar da UT">✕</button></div></li>`; }).join("")}</ol>`; }
  bx.innerHTML=h; if($("u-add2")) $("u-add2").onclick=()=>folhaAddExUT(U.id);
  bx.querySelectorAll("li[data-l]").forEach(li=>{ const lid=li.dataset.l, eC=!!(U.exercicios.find(l=>l.id===lid)||{}).pai;
    li.querySelector(".utx-t").onclick=()=>folhaVerExUT(U.id,lid);
    li.oncontextmenu=e=>{ if(e.target.closest("li[data-l]")!==li) return; menuContexto(e,[["Ajustar nesta UT",()=>folhaAjusteUT(U.id,lid)],["👥 Grupos e tempos",()=>folhaTemposEx(U.id,lid)],...(eC?[]:[["+ Exercício complementar",()=>folhaAddExUT(U.id,lid)]]),["🗑 Tirar da UT",()=>tiraExUT(lid),"perigo"]]); };
    li.querySelectorAll("[data-a]").forEach(b=>{ const a=b.dataset.a;
      if(a==="up"||a==="dn") b.onclick=()=>editaUT(U=>moveBloco(U,lid,a==="up"?-1:1));
      else if(a==="gt") b.onclick=()=>folhaTemposEx(U.id,lid);
      else if(a==="cp") b.onclick=()=>folhaAddExUT(U.id,lid);
      else if(a==="aj") b.onclick=()=>folhaAjusteUT(U.id,lid);
      else if(a==="at") b.onclick=()=>folhaAtualizaUT(U.id,lid);
      else if(a==="x") confirma2(b,"Tirar?",()=>tiraExUT(lid)); }); }); }
/* para comparar cópia e repositório sem contar quem alterou e quando */
const semAutoria=E=>{ const c={...E}; ["criadoPor","criadoEm","alteradoPor","alteradoEm","links","contaTempo"].forEach(k=>delete c[k]); return c; };
/* só avisa se o exercício foi alterado no repositório depois de entrar na UT: a cópia guarda a data de alteração que o exercício tinha nesse dia
   (os ajustes do dia, como a duração ou a figura, não contam) */
function mudouNoRepo(l){ const R=exercicios[l.exId]; if(!R) return false;
  return (R.alteradoEm||"")>(l.copia.alteradoEm||"")&&JSON.stringify(semAutoria(R))!==JSON.stringify(semAutoria(l.copia)); }
/* ↻ Atualizar: traz a versão do repositório; por defeito mantém os ajustes do dia (os mesmos campos do "Ajustar nesta UT") */
const AJUSTES_DIA=["parte","espaco","duracao","variantes"];
function folhaAtualizaUT(id,lid){ const U=uts[id], l=U&&U.exercicios.find(x=>x.id===lid), R=l&&exercicios[l.exId]; if(!R) return; const C=l.copia;
  folha(`<h3>Atualizar a partir do repositório</h3>
    <p class="sub" style="margin:0"><b>${esc(R.nome)}</b> foi alterado no repositório${R.alteradoEm?` a ${esc(dataHora(R.alteradoEm))}`:""}.</p>
    <p style="margin:0">Vem do repositório: nome, textos, classificação, figura e material.<br>Fica desta UT: ${esc(parteDe(C.parte)[1].toLowerCase())}, espaço ${esc(C.espaco.txt||"–")}, duração ${totalEx(C)?fmtTempo(totalEx(C)):"–"} e variantes.</p>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn" id="uat-tudo">Substituir tudo</button><button class="btn primary" id="uat-ok">Atualizar e manter os ajustes</button></div>`,(s,fecha)=>{
    const vai=tudo=>{ fecha(); editaUT(U=>{ const x=U.exercicios.find(y=>y.id===lid), N=clone(exercicios[x.exId]); if(!tudo) AJUSTES_DIA.forEach(k=>{ N[k]=clone(x.copia[k]); }); x.copia=N; },
      tudo?"Exercício substituído pela versão do repositório":"Exercício atualizado · ajustes desta UT mantidos"); };
    s.querySelector("#uat-ok").onclick=()=>vai(false); confirma2(s.querySelector("#uat-tudo"),"Toca outra vez",()=>vai(true)); }); }
function tiraExUT(lid){ const U=uts[uCur], l=U&&U.exercicios.find(x=>x.id===lid); if(!l) return; const nC=U.exercicios.filter(x=>x.pai===lid).length;
  editaUT(U=>{ U.exercicios=U.exercicios.filter(x=>x.id!==lid&&x.pai!==lid); const P=l.pai&&U.exercicios.find(x=>x.id===l.pai); if(P) rotRefaz(U,P); },
    `“${l.copia.nome}”${nC?` e ${nC===1?"o complementar":"os "+nC+" complementares"}`:""} ${nC?"tirados":"tirado"} da UT${l.pai?" · rotação proposta de novo":""}`); }
function renderUTPainel(U){ const pn=$("u-panel");
  if(!U){ pn.innerHTML=`<header><h2>Unidades de Treino</h2><p class="sub">Feitas com os exercícios do repositório.</p></header>`; return; }
  const porParte=PARTES.map(([k,n])=>{ const ls=principaisUT(U).filter(l=>l.copia.parte===k); return ls.length?`${n.replace("Parte ","")}: ${ls.length} · ${fmtTempo(ls.reduce((a,l)=>a+totalEx(l.copia),0))}`:""; }).filter(Boolean);
  const atl=atletasUT(U), nP=atl.filter(a=>U.presencas[a.k]==="P").length;
  pn.innerHTML=`<header><h2>Resumo</h2><p class="sub">${principaisUT(U).length} exercícios${U.exercicios.length>principaisUT(U).length?` + ${U.exercicios.length-principaisUT(U).length} complementar${U.exercicios.length-principaisUT(U).length>1?"es":""}`:""} · ${totalUT(U)?fmtTempo(totalUT(U)):"sem duração"}${U.tempoTotal?" (escrito à mão)":""}</p>${porParte.length?`<p class="sub" style="margin:2px 0 0">${esc(porParte.join(" · "))}</p>`:""}</header>
    <div class="add"><h3>Presenças <span class="count" title="Presentes">${nP}</span></h3>
      <p class="sub" style="margin:0"><b>Toque</b>: Presente (<b style="color:${corPres("P")}">P</b>). <b>Botão direito</b> (no iPad, manter o dedo): ${PRESENCAS.filter(p=>p[0]!=="P").map(p=>`<b style="color:${p[2]}">${p[1]}</b>`).join(", ")}.</p>
      <div class="upres">${atl.map(a=>{ const k=U.presencas[a.k]||""; return `<button data-k="${esc(a.k)}" style="${k?`border-color:${corPres(k)};color:${corPres(k)}`:""}"><b>${esc(a.n||a.esc)}</b><span>${esc(a.nome)}</span>${a.n&&a.esc?`<small class="esc">${esc(a.esc)}</small>`:""}${k?`<i style="background:${corPres(k)}">${k}</i>`:""}</button>`; }).join("")||`<p class="sub">Sem jogadores no Plantel.</p>`}</div>
      <button class="btn sm" id="u-xn">+ Jogador de fora do plantel</button></div>
    <div class="add"><h3>Grupos de trabalho</h3>${U.grupos.length?`<ul class="evl">${U.grupos.map(g=>`<li><span style="flex:1"><b>${esc(g.nome||"Grupo")}</b> · ${esc(g.jogadores.map(k=>nomeAtleta(U,k)+(presenteUT(U,k)?"":" (⚠ não presente)")).join(", ")||"sem jogadores")}${g.nota?`<br><small class="sub ug-nota">${esc(g.nota)}</small>`:""}</span>${g.nota?`<button class="btn sm ghost" data-lg="${esc(g.id)}" title="Procurar no texto os jogadores do Plantel">👥 Ler</button>`:""}<button class="btn sm ghost" data-g="${esc(g.id)}">✎</button></li>`).join("")}</ul>`:`<p class="sub" style="margin:0">Sem grupos (ex.: GR, condicionados, reforço).</p>`}
      <button class="btn sm" id="u-gn">+ Grupo</button></div>
    <div class="add"><h3>Campo do plantel</h3><div class="ucampo"></div><p class="sub" style="margin:0">Cada atleta na sua posição (definida no separador Plantel), com a cor da presença; indisponíveis (lesão ou ausente) à parte. Entra no PDF.</p></div>`;
  pn.querySelectorAll(".upres button").forEach(b=>{ const k=b.dataset.k;
    b.onclick=()=>{ if(b.dataset.longo){ delete b.dataset.longo; return; } marcaPres(k,(uts[uCur].presencas[k]==="P")?"":"P"); };
    b.oncontextmenu=e=>menuPres(e,k); premirLongo(b,e=>menuPres(e,k)); });
  $("u-xn").onclick=()=>folhaExtraUT(U.id,null);
  pn.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>folhaGrupoUT(U.id,b.dataset.g)); pn.querySelectorAll("[data-lg]").forEach(b=>b.onclick=()=>folhaLerGrupos(U.id,b.dataset.lg)); $("u-gn").onclick=()=>folhaGrupoUT(U.id,null);
  pn.querySelector(".ucampo").appendChild(plantelSvg(U)); }

/* ---------- presenças: toque = Presente; botão direito / dedo pressionado = escolher ---------- */
function marcaPres(k,v){ const U0=uts[uCur]; if(!U0) return; const gs=PRES_GRUPO.has(v)?[]:U0.grupos.filter(g=>g.jogadores.includes(k)).map(g=>g.nome||"Grupo");
  editaUT(U=>{ if(v) U.presencas[k]=v; else delete U.presencas[k]; if(gs.length) U.grupos.forEach(g=>{ g.jogadores=g.jogadores.filter(x=>x!==k); }); },
    gs.length?`${nomeAtleta(U0,k)} saiu ${gs.length===1?"do grupo «"+gs[0]+"»":"dos grupos "+gs.map(x=>"«"+x+"»").join(", ")} (não está presente)`:null); }
function menuPres(e,k){ const U=uts[uCur]; if(!U) return; const ext=String(k).startsWith("e:")?U.extras.find(x=>"e:"+x.id===k):null;
  menuContexto(e,[...PRESENCAS.map(([c,n])=>[`${c} · ${n}`,()=>marcaPres(k,c)]),["Sem marcação",()=>marcaPres(k,"")],...(ext?[["✎ Editar jogador",()=>folhaExtraUT(U.id,ext.id)]]:[])]); }
/* iPad: manter o dedo meio segundo abre o mesmo menu do botão direito */
function premirLongo(b,fn){ let t=null; b.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse") return; const x=e.clientX, y=e.clientY;
    t=setTimeout(()=>{ t=null; b.dataset.longo="1"; fn({preventDefault(){},clientX:x,clientY:y}); },550); });
  ["pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,()=>{ if(t){ clearTimeout(t); t=null; } })); }
function folhaExtraUT(id,eid){ const U=uts[id]; if(!U) return; const X=eid?U.extras.find(e=>e.id===eid):null; let escl=X?(X.escalao||"Outro"):"Sub19";
  /* atletas de fora que já estiveram noutras UT (o registo são as próprias UT): escolhem-se da lista; só um atleta novo se escreve à mão */
  const chave=e=>semAcento(e.nome), vezes={}, ultimo={};
  Object.values(uts).sort((a,b)=>String(a.data||"").localeCompare(String(b.data||""))).forEach(u=>u.extras.forEach(e=>{ const k=chave(e); vezes[k]=(vezes[k]||0)+1; ultimo[k]=e; }));
  const usados=Object.keys(ultimo).map(k=>({...ultimo[k],vezes:vezes[k]})).sort((a,b)=>b.vezes-a.vezes||a.nome.localeCompare(b.nome,"pt"));
  const jaNaUT=e=>U.extras.some(x=>chave(x)===chave(e));
  folha(`<h3>Jogador de fora do plantel</h3><p class="sub" style="margin:0">Para juniores, juvenis ou outros chamados a esta UT.</p>
    ${!X&&usados.length?`<h4 style="margin-bottom:0">Já treinaram connosco <span class="sub">(toca para adicionar)</span></h4><input type="search" id="ux-q" placeholder="Procurar nome ou escalão" aria-label="Procurar atleta">
    <div class="chips" id="ux-us" style="max-height:34vh;overflow:auto">${usados.map((e,i)=>`<button class="chip" data-i="${i}" data-q="${esc(semAcento(e.nome+" "+(e.escalao||"")+" "+(e.alc||"")))}"${jaNaUT(e)?' aria-pressed="true" disabled':""}><span></span>${e.escalao?`<em class="esc">${esc(e.escalao)}</em>`:""}</button>`).join("")}</div>
    <h4 style="margin-bottom:0">Ou outro atleta (novo)</h4>`:""}
    <label class="f">Nome<input type="text" id="ux-n" value="${esc(X?X.nome:"")}" placeholder="Ex.: Santiago C."></label>
    <h4>Escalão</h4><div class="seg" id="ux-e">${[...ESC_FORM,"Outro"].map(x=>`<button data-k="${x}">${x}</button>`).join("")}</div>
    <label class="f">Alcunhas (separadas por vírgulas; para ler os grupos escritos em texto)<input type="text" id="ux-a" value="${esc(X?X.alc||"":"")}" placeholder="Ex.: Guga"></label>
    <label class="f">Posição no campo do plantel<select id="ux-p"><option value="">—</option>${POS_UT.map(([k,n])=>`<option value="${k}"${X&&X.pos===k?" selected":""}>${k} · ${n}</option>`).join("")}</select></label>
    <div class="actions">${X?`<button class="btn danger l" id="ux-del">Tirar da UT</button>`:""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="ux-ok">${X?"Guardar":"Adicionar"}</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x), pinta=()=>s.querySelectorAll("#ux-e button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===escl)));
    s.querySelectorAll("#ux-e button").forEach(b=>b.onclick=()=>{ escl=b.dataset.k; pinta(); }); pinta();
    q("#ux-n").onchange=()=>{ const u=usados.find(e=>chave(e)===semAcento(q("#ux-n").value.trim())); if(u&&!X){ escl=u.escalao||"Outro"; q("#ux-p").value=u.pos||""; q("#ux-a").value=u.alc||""; pinta(); } };
    s.querySelectorAll("#ux-us .chip").forEach(b=>{ const u=usados[+b.dataset.i]; b.querySelector("span").textContent=u.nome;
      b.onclick=()=>{ if(jaNaUT(u)) return; const e={id:uId("e"),nome:u.nome,escalao:u.escalao||"",pos:u.pos||"",...(u.alc?{alc:u.alc}:{})};
        editaUT(V=>{ if(!V.extras.some(x=>chave(x)===chave(e))) V.extras.push(e); },`${u.nome} adicionado à UT`); b.setAttribute("aria-pressed","true"); b.disabled=true; }; });
    if(q("#ux-q")) q("#ux-q").addEventListener("input",()=>{ const t=semAcento(q("#ux-q").value.trim()); s.querySelectorAll("#ux-us .chip").forEach(b=>b.hidden=!!t&&!b.dataset.q.includes(t)); });
    if(q("#ux-del")) confirma2(q("#ux-del"),"Toca outra vez",()=>{ fecha(); editaUT(U=>{ U.extras=U.extras.filter(e=>e.id!==eid); delete U.presencas["e:"+eid]; U.grupos.forEach(g=>{ g.jogadores=g.jogadores.filter(k=>k!=="e:"+eid); }); },`${X.nome} tirado da UT`); });
    q("#ux-ok").onclick=()=>{ const nm=q("#ux-n").value.trim(); if(!nm){ toast("Escreve o nome."); return; } fecha();
      const alc=q("#ux-a").value.trim(), e={id:eid||uId("e"),nome:nm,escalao:escl==="Outro"?"":escl,pos:q("#ux-p").value,...(alc?{alc}:{})};
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
  /* indisponíveis (lesão ou ausente) saem do campo e ficam à parte */
  const atl=atletasUT(U), pres=a=>U.presencas[a.k]||"", indisp=a=>pres(a)==="L"||pres(a)==="A", les=atl.filter(indisp), resto=atl.filter(a=>!indisp(a)&&!(a.form&&!pres(a)));
  /* caixa de nome com a borda na cor da presença (sem marcação: cinzento escuro) */
  const caixa=(x,y,a,w,extra)=>{ const p=pres(a), c=p?corPres(p):"#4A4A4A", g=el("g",{},svg), t=nomeCurto(a), fs=23;
    el("rect",{x:x-w/2,y,width:w,height:38,rx:5,fill:"#fff",stroke:c,"stroke-width":p?5:3},g);
    const tx=el("text",{x,y:y+27,"text-anchor":"middle","font-size":fs,"font-weight":700,fill:"#1B1A17",class:"lbl"},g); tx.textContent=t;
    if(a.esc){ const ts=el("tspan",{"font-size":13,fill:"#6B675E","font-weight":400},tx); ts.textContent=" ("+a.esc+")"; }
    if(extra){ const ts=el("tspan",{"font-size":15,fill:c,"font-weight":700},tx); ts.textContent=" · "+extra; }
    if(textW(t+(a.esc?" ("+a.esc+")":"")+(extra?" · "+extra:""),fs,700)>w-16){ tx.setAttribute("textLength",w-16); tx.setAttribute("lengthAdjust","spacingAndGlyphs"); } };
  POS_UT.forEach(([k,,px,py])=>{ const x=fx+px*fw, y=fy+py*fh, gr=k==="1";
    el("circle",{cx:x,cy:y,r:27,fill:gr?"#FFFF00":"#C00000",stroke:"#1B1A17","stroke-width":3},svg);
    el("text",{x,y:y+9,"text-anchor":"middle","font-size":26,"font-weight":700,fill:gr?"#000":"#fff",class:"num"},svg).textContent=k;
    resto.filter(a=>a.pos===k).forEach((a,i)=>caixa(x,y+34+i*44,a,250)); });
  /* indisponíveis à parte (canto superior direito), com o motivo; contagens em cima à esquerda */
  if(les.length){ const x=fx+fw-170; el("text",{x,y:fy+32,"text-anchor":"middle","font-size":24,"font-weight":800,fill:"#C00000",class:"lbl"},svg).textContent="INDISPONÍVEIS:";
    les.forEach((a,i)=>caixa(x,fy+44+i*44,a,300,pres(a)==="L"?"Lesão":"Ausente")); }
  const comPos=resto.filter(a=>a.pos), gr=comPos.filter(a=>a.pos==="1"), campo=comPos.filter(a=>a.pos!=="1"), ext=l=>l.filter(a=>a.esc).length, nP=atl.filter(a=>pres(a)==="P").length;
  const resumo=`GR: ${gr.length-ext(gr)}${ext(gr)?"+"+ext(gr)+" (formação)":""}  //  Campo: ${campo.length-ext(campo)}${ext(campo)?"+"+ext(campo):""}  //  Presentes: ${nP}${les.length?"  //  Indisponíveis: "+les.length:""}`;
  const rw=Math.min(VW-2*fx,textW(resumo,24,700)*1.12+70); el("path",{d:`M ${fx} ${fy-58} H ${fx+rw} L ${fx+rw-24} ${fy-12} H ${fx} Z`,fill:"#1B1A17"},svg);
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
    <div class="fields"><label class="f">Tempo total do treino<input type="text" id="uc-t" value="${U.tempoTotal?fmtTempo(U.tempoTotal):""}" placeholder="Soma: ${fmtTempo(principaisUT(U).reduce((a,l)=>a+totalEx(l.copia),0))}"></label>
      <label class="f">Equipa técnica (rodapé)<input type="text" id="uc-s" value="${esc(U.staff||staffPadrao())}"></label></div>
    <div class="actions"><button class="btn danger l" id="uc-del">Apagar UT</button><button class="btn" data-close>Cancelar</button><button class="btn primary" id="uc-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x), pinta=()=>s.querySelectorAll("#uc-md button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===md)));
    s.querySelectorAll("#uc-md button").forEach(b=>b.onclick=()=>{ md=b.dataset.k; pinta(); }); pinta();
    /* mudar a data sugere o Match Day pelo calendário (se ainda não foi escolhido à mão) e o nº da UT do planeamento anual */
    let mdMao=!!md; s.querySelectorAll("#uc-md button").forEach(b=>b.addEventListener("click",()=>{ mdMao=true; }));
    q("#uc-d").onchange=()=>{ const d=q("#uc-d").value, A=diaAnualDe(d); if(!mdMao){ md=mdAuto(d); pinta(); } if(A&&A.ut) q("#uc-n").value=A.ut; };
    confirma2(q("#uc-del"),"Toca outra vez para apagar",()=>{ fecha(); apagaUT(id); });
    q("#uc-ok").onclick=()=>{ const t=lerDur(q("#uc-t").value); if(isNaN(t)){ toast("Tempo total que não percebo. Usa por exemplo 88'."); return; }
      const X=uts[id]; fecha(); guardaUT({...clone(X),numero:q("#uc-n").value,data:q("#uc-d").value,matchDay:md,regime:q("#uc-r").value,objetivos:q("#uc-o").value,material:q("#uc-m").value,tempoTotal:t||null,staff:q("#uc-s").value}); toast("Cabeçalho guardado"); }; }); }
let uFiltro={q:"",parte:"",mom:"",tipo:""};
function folhaAddExUT(id,pai){ const U=uts[id]; if(!U) return; const escolhidos=new Set(), P=pai?U.exercicios.find(l=>l.id===pai&&!l.pai):null; if(pai&&!P) return; const nP=P?numerosUT(U)[P.id]:"";
  folha(`<h3>${P?`Exercício complementar do ${nP}`:`Adicionar exercícios à UT${U.numero}`}</h3><p class="sub" style="margin:0">${P?`Corre em paralelo com <b>${esc(P.copia.nome)}</b> (${nP}.1, ${nP}.2…) e não soma ao tempo da UT. A rotação por séries fica em 👥 Grupos do ${nP}.`:"Cada exercício entra como cópia de como está hoje no repositório."}</p>
    <div class="ex-filtros" style="margin:0"><input type="search" id="ua-q" placeholder="Pesquisar…" aria-label="Pesquisar"><select id="ua-p" aria-label="Parte"><option value="">Todas as partes</option>${PARTES.map(p=>`<option value="${p[0]}">${p[1]}</option>`).join("")}</select>
      <select id="ua-m" aria-label="Categoria"><option value="">Todas as categorias</option>${MOM_EX.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join("")}</select><select id="ua-t" aria-label="Formato"><option value="">Todos os formatos</option>${TIPOS_EX.map(t=>`<option value="${t[0]}">${t[1]}</option>`).join("")}</select></div>
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
      if(P){ editaUT(U=>{ const Q=U.exercicios.find(l=>l.id===P.id); if(!Q) return; let j=U.exercicios.indexOf(Q)+1; while(j<U.exercicios.length&&U.exercicios[j].pai===Q.id) j++;
          U.exercicios.splice(j,0,...novos.map(E=>({id:uId("l"),exId:E.id,copia:{...clone(E),parte:Q.copia.parte},pai:Q.id}))); rotRefaz(U,Q); },
        `${novos.length===1?"Complementar adicionado":novos.length+" complementares adicionados"} ao ${nP} · rotação proposta em 👥 Grupos`); return; }
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
    <h4>Jogadores <span class="sub">(só quem está presente ou condicionado)</span></h4><div class="pgrid" id="ug-j"></div><p class="sub" id="ug-fora" style="margin:0" hidden></p>
    <label class="f">Nota (opcional)<textarea id="ug-o" rows="3" placeholder="Ex.: trabalho específico com o treinador de GR">${esc(G?G.nota:"")}</textarea></label>
    <div class="actions">${G?`<button class="btn danger l" id="ug-del">Apagar grupo</button>`:""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="ug-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x), g=q("#ug-j");
    const atl=atletasUT(U).filter(a=>presenteUT(U,a.k)), fora=[...sel].filter(k=>!presenteUT(U,k));
    if(fora.length){ const f=q("#ug-fora"); f.hidden=false; f.innerHTML=`<b>Saem do grupo ao guardar</b> (não estão presentes): ${esc(fora.map(k=>nomeAtleta(U,k)).join(", "))}.`; }
    if(!atl.length) g.outerHTML=`<p class="sub" style="margin:0">Ainda ninguém está marcado como presente. Marca primeiro as presenças desta UT.</p>`;
    /* por posição (GR, centrais, alas, médios, avançados; sem posição no fim); quem já está noutro grupo continua escolhível, mas vai para o fim e diz em que grupo está */
    else { const noutros=k=>U.grupos.filter(x=>x.id!==gid&&x.jogadores.includes(k)).map(x=>x.nome||"Grupo"), iPos=a=>{ const i=POS_UT.findIndex(p=>p[0]===a.pos); return i<0?99:i; }, nomePos=a=>(POS_UT.find(p=>p[0]===a.pos)||[])[1]||"";
      const ord=atl.map((a,i)=>({a,i,o:noutros(a.k)})).sort((x,y)=>(x.o.length>0)-(y.o.length>0)||iPos(x.a)-iPos(y.a)||x.i-y.i);
      g.innerHTML=ord.map(({a,o})=>`<button data-k="${esc(a.k)}"><b>${esc(nomeCurto(a))}</b><small>${esc([nomePos(a),U.presencas[a.k]==="CO"?"Condicionado":"",o.length?"já no grupo "+o.map(n=>"«"+n+"»").join(", "):""].filter(Boolean).join(" · "))}</small></button>`).join(""); }
    const pintaG=()=>s.querySelectorAll("#ug-j button").forEach(b=>b.setAttribute("aria-pressed",String(sel.has(b.dataset.k))));
    s.querySelectorAll("#ug-j button").forEach(b=>b.onclick=()=>{ sel.has(b.dataset.k)?sel.delete(b.dataset.k):sel.add(b.dataset.k); pintaG(); }); pintaG();
    if(q("#ug-del")) confirma2(q("#ug-del"),"Toca outra vez",()=>{ fecha(); editaUT(U=>{ U.grupos=U.grupos.filter(x=>x.id!==gid); },"Grupo apagado"); });
    q("#ug-ok").onclick=()=>{ const nm=q("#ug-n").value.trim(); if(!nm&&!sel.size){ toast("Dá um nome ou escolhe jogadores."); return; } fecha();
      const ng={id:gid||uId("g"),nome:nm,jogadores:atl.map(a=>a.k).filter(k=>sel.has(k)),nota:q("#ug-o").value.trim()};
      editaUT(U=>{ if(gid) U.grupos=U.grupos.map(x=>x.id===gid?ng:x); else U.grupos.push(ng); }); }; }); }
/* ---------- grupos escritos em texto (ex.: vindos do PDF da UT) → grupos com jogadores ---------- */
const semAcento=t=>String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/\s+/g," ").trim();
/* nome escrito → atleta: as alcunhas (do Plantel ou do jogador de fora) valem sempre que só sejam de um atleta; nome completo, primeiro e último nome,
   "Simão S." e "S. Soares" só valem quando não servem a mais ninguém (ex.: "Soares" sozinho não chega) */
function chavesAtletas(U){ const forte=new Map(), fraca=new Map(), add=(m,c,k)=>{ c=semAcento(c); if(c.length<2) return; if(!m.has(c)) m.set(c,new Set()); m.get(c).add(k); };
  atletasUT(U).forEach(a=>{ const p=a.n?est.plantel.find(x=>x.n===a.k):U.extras.find(e=>"e:"+e.id===a.k), nm=a.nome.trim().split(/\s+/).filter(Boolean);
    String(p&&p.alc||"").split(/[,;]/).forEach(x=>add(forte,x,a.k));
    if(!nm.length) return; add(fraca,a.nome,a.k); add(fraca,nm[0],a.k);
    if(nm.length>1){ const u=nm[nm.length-1]; [u,`${nm[0]} ${u[0]}`,`${nm[0]} ${u[0]}.`,`${nm[0][0]}. ${u}`,`${nm[0][0]}.${u}`].forEach(c=>add(fraca,c,a.k)); } });
  const M=new Map(); fraca.forEach((ks,c)=>{ if(ks.size===1) M.set(c,[...ks][0]); }); forte.forEach((ks,c)=>{ if(ks.size===1) M.set(c,[...ks][0]); });
  return M; }
const PAL_GRUPO=new Set("vermelhos vermelho amarelos amarelo azuis azul brancos branco verdes verde laranjas pretos equipa equipas grupo grupos campo periodo trocas troca trocar apoios apoio coletes colete sem exercicio saidas jornada parte junior juniores".split(" "));
/* texto → [{nome, jogadores}] + palavras que parecem nomes mas não são de ninguém. "Rótulo: nomes" abre um grupo; linhas só com nomes juntam-se ao grupo aberto;
   linhas sem nomes (ex.: "1º Período", "Campo 1") ficam como cabeçalho dos grupos seguintes */
function gruposDoTexto(U,txt){ const M=chavesAtletas(U), grupos=[], desc=new Set(); let cab="", cur=null;
  const seq=t=>{ const w=String(t).replace(/[,|/+*()<>!=–—-]/g," ").split(/\s+/).filter(Boolean), n=w.map(semAcento), r=[];
    for(let i=0;i<w.length;){ let ok=0;
      for(let m=Math.min(3,w.length-i);m>=1&&!ok;m--){ const c=n.slice(i,i+m).join(" "), k=M.get(c)??(m===1?M.get(c.replace(/\.+$/,"")):undefined); if(k!==undefined){ r.push({k}); i+=m; ok=1; } }
      if(!ok){ r.push({w:w[i]}); i++; } }
    return r; };
  const fora=r=>r.forEach(x=>{ const w=(x.w||"").replace(/\.+$/,""); if(/^[A-ZÀ-Ý][a-zà-ÿ]{2,}$/.test(w)&&!PAL_GRUPO.has(semAcento(w))) desc.add(w); });
  const novo=nome=>{ if(cur&&!cur.jogadores.length){ grupos.pop(); cab=cur.rot; } nome=nome.replace(/\s+/g," ").trim()||`Grupo ${grupos.length+1}`;
    cur={rot:nome,nome:cab&&cab!==nome?`${cab} · ${nome}`:nome,jogadores:[]}; grupos.push(cur); };
  const poe=r=>{ const ks=r.filter(x=>x.k).map(x=>x.k); if(ks.length&&!cur) novo(""); ks.forEach(k=>{ if(!cur.jogadores.includes(k)) cur.jogadores.push(k); }); fora(r); };
  /* "nomes | Rótulo" ou "nomes Rótulo": os nomes ficam no grupo aberto, o resto é o rótulo do grupo seguinte */
  const corta=t=>{ const b=t.lastIndexOf("|"); if(b>=0) return [seq(t.slice(0,b)),t.slice(b+1)];
    const r=seq(t); let e=r.length; while(e>0&&!r[e-1].k) e--; return [r.slice(0,e),r.slice(e).map(x=>x.w).join(" ")]; };
  String(txt||"").split(/\n/).map(l=>l.trim()).filter(Boolean).forEach(L=>{
    if(/<-|->/.test(L)) return;                                  // trocas ("Maria <-> Jordanes") não são grupos
    const ps=L.split(":");
    if(ps.length===1){ const r=seq(L);
      if(r.some(x=>x.k)) poe(r);
      /* linha sem nomes conhecidos: dentro de uma lista é um nome que não reconheço; senão é cabeçalho ("1º Período", "Campo 1") */
      else if(cur&&!/\d|[()[\]]/.test(L)&&L.split(/\s+/).length<=2&&!L.split(/\s+/).some(w=>PAL_GRUPO.has(semAcento(w)))) fora(r);
      else { if(cur&&!cur.jogadores.length) grupos.pop(); cab=L.replace(/[|]+/g," ").replace(/\s+/g," ").trim(); cur=null; }
      return; }
    let [r0,rot]=corta(ps[0]); if(r0.some(x=>x.k)) poe(r0); else rot=ps[0].replace(/\|/g," ");
    for(let j=1;j<ps.length;j++){ let r, prox="";
      if(j<ps.length-1) [r,prox]=corta(ps[j]); else r=seq(ps[j]);
      novo(rot); poe(r); rot=prox; } });
  if(cur&&!cur.jogadores.length) grupos.pop();
  return {grupos:grupos.map(g=>({nome:g.nome,jogadores:g.jogadores})),desc:[...desc]}; }
function folhaLerGrupos(id,gid){ const U=uts[id], G=U&&U.grupos.find(g=>g.id===gid); if(!G) return; const r0=gruposDoTexto(U,G.nota); let manter=true;
  const ausentes=[...new Set(r0.grupos.flatMap(g=>g.jogadores).filter(k=>!presenteUT(U,k)))], r={...r0,grupos:r0.grupos.map(g=>({...g,jogadores:g.jogadores.filter(k=>presenteUT(U,k))})).filter(g=>g.jogadores.length)};
  folha(`<h3>Ler jogadores do texto</h3><p class="sub" style="margin:0">Procura no texto de “${esc(G.nome||"Grupo")}” os nomes e as alcunhas do Plantel (e os jogadores de fora desta UT).</p>
    ${r.grupos.length?`<ul class="evl">${r.grupos.map(g=>`<li><span><b>${esc(g.nome)}</b> · ${esc(g.jogadores.map(k=>nomeAtleta(U,k)).join(", "))}</span></li>`).join("")}</ul>`:`<p class="sub" style="margin:0">Não encontrei jogadores do Plantel neste texto.</p>`}
    ${ausentes.length?`<p class="sub" style="margin:0"><b>Ficam de fora</b> (não estão presentes): ${esc(ausentes.map(k=>nomeAtleta(U,k)).join(", "))}.</p>`:""}
    ${r.desc.length?`<p class="sub" style="margin:0"><b>Não reconheci:</b> ${esc(r.desc.join(", "))}. Se forem jogadores, escreve a alcunha no separador Plantel (coluna Alcunhas) ou no jogador de fora desta UT, e volta a ler.</p>`:""}
    <h4>Texto original</h4><div class="seg" id="ulg-t"><button data-k="1">Manter como nota</button><button data-k="">Apagar</button></div>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ulg-ok" ${r.grupos.length?"":"disabled"}>Criar ${r.grupos.length} ${r.grupos.length===1?"grupo":"grupos"}</button></div>`,(s,fecha)=>{
    const pinta=()=>s.querySelectorAll("#ulg-t button").forEach(b=>b.setAttribute("aria-pressed",String(!!b.dataset.k===manter)));
    s.querySelectorAll("#ulg-t button").forEach(b=>b.onclick=()=>{ manter=!!b.dataset.k; pinta(); }); pinta();
    s.querySelector("#ulg-ok").onclick=()=>{ if(!r.grupos.length) return; fecha();
      editaUT(U=>{ const i=U.grupos.findIndex(g=>g.id===gid), novos=r.grupos.map(g=>({id:uId("g"),nome:g.nome,jogadores:g.jogadores,nota:""})); U.grupos.splice(i<0?U.grupos.length:i,manter||i<0?0:1,...novos); },
        `${r.grupos.length} ${r.grupos.length===1?"grupo criado":"grupos criados"} a partir do texto`); }; }); }
/* ver a ficha do exercício tal como está nesta UT */
function folhaVerExUT(id,lid){ const U=uts[id], i=U?U.exercicios.findIndex(x=>x.id===lid):-1; if(i<0) return; const E=U.exercicios[i].copia, num=numerosUT(U)[lid];
  folha(`<h3>Exercício ${num}${U.exercicios[i].pai?" (complementar)":""} · UT${U.numero}</h3>${fichaHtml(E,num)}<div class="ufig"></div>
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
  const y0=M+HC+6, cw=hw, ch=(PH-y0-26-G)/2, nums=numerosUT(U), blocos=[...U.exercicios.map((l,i)=>({l,i})),{grupos:true}];
  /* grelha da rotação (série × equipa) no fundo do último complementar */
  const grelhaPdf=(P,x,y,w,h)=>{ const R=P.rot, cs=U.exercicios.filter(c=>c.pai===P.id), S=R.grelha.length, rh=Math.min(9,(h-11)/(S+1)), c0=26, cwid=(w-c0)/R.nEq;
    caixa(x,y,w,10,INK,`ROTAÇÃO  ${nums[P.id]} + ${cs.map(c=>nums[c.id]).join(" + ")}  ·  ${R.nJogo} ${R.nJogo===1?"EQUIPA":"EQUIPAS"} AO MESMO TEMPO NO ${nums[P.id]}`,{s:5.6});
    let yy=y+10; doc.setDrawColor(...LN); doc.setLineWidth(.4); T("SÉRIE",x+c0/2,yy+rh*.7,5.2,{b:1,c:MUT,al:"center"});
    R.equipas.forEach((g,j)=>{ doc.setFont("helvetica","bold"); doc.setFontSize(5.4); const t=doc.splitTextToSize(pdfTxt(nomeEquipa(U,R,j)),cwid-3)[0]; T(t,x+c0+j*cwid+cwid/2,yy+rh*.7,5.4,{b:1,al:"center"}); });
    yy+=rh; R.grelha.forEach((r,i)=>{ doc.line(x,yy,x+w,yy); T(String(i+1),x+c0/2,yy+rh*.72,6,{b:1,c:RED,al:"center"});
      r.forEach((v,j)=>{ const cx=x+c0+j*cwid; if(v==="p"){ doc.setFillColor(250,226,226); doc.rect(cx+.5,yy+.5,cwid-1,rh-1,"F"); } T(rotCasa(v,nums,P.id).replace("–","-"),cx+cwid/2,yy+rh*.72,6.2,{b:v==="p",c:v?INK:MUT,al:"center"}); });
      yy+=rh; });
    doc.rect(x,y,w,yy-y); };
  const slot=b=>({x:M+(b%4%2)*(cw+G), y:y0+Math.floor(b%4/2)*(ch+G)});
  /* grupos de trabalho em 2 colunas; se não couberem no bloco, continuam nos blocos seguintes (e em páginas novas, com o cabeçalho) */
  const gruposNoPdf=b=>{ const colW=(cw-24)/2, L=[];
    U.grupos.forEach(g=>{ doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.splitTextToSize(pdfTxt(g.nome||"Grupo"),colW).forEach((t,i)=>L.push({t,s:7,b:1,c:RED,h:8.5,tit:!i}));
      doc.setFont("helvetica","normal"); doc.setFontSize(6.3);
      if(g.jogadores.length) doc.splitTextToSize(pdfTxt(g.jogadores.map(k=>nomeAtleta(U,k)).join(", ")),colW).forEach(t=>L.push({t,s:6.3,c:INK,h:7.6}));
      doc.setFontSize(6); if(g.nota) g.nota.split(/\n/).forEach(p=>doc.splitTextToSize(pdfTxt(p)||" ",colW).forEach(t=>L.push({t,s:6,c:MUT,h:7.2})));
      L.push({gap:4}); });
    const area=(b,cont)=>{ const {x,y}=slot(b); caixa(x,y,cw,14,INK,cont?"GRUPOS DE TRABALHO (CONTINUAÇÃO)":"GRUPOS DE TRABALHO",{i:1,s:7.5});
      doc.setDrawColor(...INK); doc.setLineWidth(.9); doc.rect(x,y,cw,ch); return [0,1].map(i=>({x:x+8+i*(colW+8),y0:y+25,y1:y+ch-5})); };
    let cols=area(b,false), ci=0, yy=cols[0].y0;
    if(!U.grupos.length){ T("Sem grupos de trabalho.",cols[0].x,yy,7,{c:MUT}); return; }
    L.forEach((l,i)=>{ if(l.gap){ if(yy>cols[ci].y0) yy+=l.gap; return; }
      const prec=l.tit&&L[i+1]&&!L[i+1].gap?L[i+1].h:0;           // o nome do grupo não fica sozinho no fundo da coluna
      if(yy+l.h+prec>cols[ci].y1){ ci++; if(ci>1){ b++; if(b%4===0){ doc.addPage(); cabecalho(); } cols=area(b,true); ci=0; } yy=cols[ci].y0; }
      T(l.t,cols[ci].x,yy,l.s,{b:l.b,c:l.c}); yy+=l.h; }); };
  for(let b=0;b<blocos.length;b++){ const pos=b%4; if(pos===0){ if(b) doc.addPage(); cabecalho(); }
    const {x,y}=slot(b), B=blocos[b];
    if(B.grupos){ gruposNoPdf(b); continue; }
    /* complementar: indentado, com a marca vermelha à esquerda; o último do principal leva a grelha da rotação */
    const l=B.l, E=l.copia, ind=l.pai?12:0, bx=x+ind, bw=cw-ind, hf=ch*.52, P=l.pai?U.exercicios.find(p=>p.id===l.pai):null;
    const ult=P&&P.rot&&U.exercicios.filter(c=>c.pai===P.id).slice(-1)[0]===l, gh=ult?Math.min(11+(P.rot.grelha.length+1)*9,(ch-hf)*.6):0;
    if(ind){ doc.setFillColor(...RED); doc.rect(x+2,y,4,ch,"F"); }
    fichaExPdf(doc,E,bx,y,bw,{k:.6,hMax:hf,num:nums[l.id]+(l.pai?" · COMPLEMENTAR":"")});
    const fig=await figuraJpegEx(E), fy=y+hf+3, fh=ch-hf-3-(gh?gh+3:0);
    if(fig){ let w=bw, h=bw*fig.h/fig.w; if(h>fh){ h=fh; w=h*fig.w/fig.h; } figuraNoPdf(doc,fig,bx+(bw-w)/2,fy+(fh-h)/2,w,h); }
    doc.setDrawColor(...INK); doc.setLineWidth(.9); doc.rect(bx,fy,bw,fh);
    if(gh) grelhaPdf(P,bx,fy+fh+3,bw,gh); }
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
    q.docs.forEach(d=>{ const x=lerDoc(d); if(x){ const c={...x}; delete c.atualizadoEm; try{ m[d.id]=normUT({...c,id:d.id}); }catch(e){} } });
    mergeCol("uts/",m,uts); if(JSON.stringify(m)!==JSON.stringify(uts)){ uts=m; guardaUTLocal(); if(!$("sheet-root").innerHTML) renderUT(); } },()=>{}); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaUTDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();
