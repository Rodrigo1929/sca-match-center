/* ---------- Princípios do Modelo de Jogo (v112) ----------
   macroprincípio → princípio → microprincípio. Cada princípio é um documento próprio (principios/{código}); os textos do modelo
   (identidade, momentos, estruturas, plano, bolas paradas, indicadores, em construção) são um documento por secção (modeloTxt/{chave}).
   O código nunca muda (liga exercícios, UT e análise); o texto edita-se na app. Junta-se ao 2.º <script>, depois de modelo-de-jogo.js. */
const P_LS="sca-princ-v1", PT_LS="sca-modelotxt-v1";
let principios={}, modeloTxt={};
try{ principios=JSON.parse(localStorage.getItem(P_LS)||"{}")||{}; }catch(e){ principios={}; }
try{ modeloTxt=JSON.parse(localStorage.getItem(PT_LS)||"{}")||{}; }catch(e){ modeloTxt={}; }
const P_MOM=[["oo","Organização ofensiva","#23844A","01"],["td","Transição defensiva","#222428","02"],["od","Organização defensiva","#C8102E","03"],["to","Transição ofensiva","#2C4E9C","04"],["tr","Princípios transversais","#17325C",""]];
const P_NIV={princ:"Princípio",micro:"Microprincípio",rot:"Rotina",tr:"Transversal"};
const P_MACRO={oo:"oo",od:"od",td:"tr",to:"tr"};          // macroprincípio de cada momento (as duas transições partilham)
const pMom=k=>P_MOM.find(m=>m[0]===k)||P_MOM[0];
function normPrinc(d,id){ const s=v=>typeof v==="string"?v.trim():""; const cod=s(d&&d.cod)||s(id); if(!cod) return null;
  return {cod,nivel:P_NIV[d.nivel]?d.nivel:"princ",mom:P_MOM.some(m=>m[0]===d.mom)?d.mom:"oo",pai:s(d.pai),nome:s(d.nome)||cod,comp:s(d.comp),ind:s(d.ind),txt:s(d.txt),
    estado:d.estado==="construcao"?"construcao":"vigor",ordem:+d.ordem||0,alteradoPor:s(d.alteradoPor),alteradoEm:s(d.alteradoEm)}; }
function normTxt(d){ if(!d||typeof d!=="object"||Array.isArray(d)) return {}; const x=clone(d); delete x.id; delete x.atualizadoEm; return x; }
Object.keys(principios).forEach(k=>{ const x=normPrinc(principios[k],k); if(x) principios[k]=x; else delete principios[k]; });
const guardaPrincLocal=()=>{ try{ localStorage.setItem(P_LS,JSON.stringify(principios)); localStorage.setItem(PT_LS,JSON.stringify(modeloTxt)); }catch(e){} };
const pAutoria=()=>({alteradoPor:(typeof meuId!=="undefined"&&meuId)||"",alteradoEm:new Date().toISOString()});
function gravaPrinc(P){ const x=normPrinc({...P,...pAutoria()},P.cod); principios[x.cod]=x; guardaPrincLocal(); gravaDoc("principios/"+x.cod,x); return x; }
function apagaPrinc(cod){ delete principios[cod]; guardaPrincLocal(); apagaDoc("principios/"+cod); }
function gravaTxt(k,v){ modeloTxt[k]={...normTxt(v),...pAutoria()}; guardaPrincLocal(); gravaDoc("modeloTxt/"+k,modeloTxt[k]); }

/* ordem natural: momento, depois número (OO-2 < OO-10; rotinas no fim do momento) */
const pOrdMom=c=>P_MOM.findIndex(m=>m[0]===c.mom);
const pChave=c=>{ const m=String(c.cod).match(/-(R?)(\d+)(?:\.(\d+))?$/); return m?[m[1]?1:0,+m[2],m[3]?+m[3]:0]:[2,0,0]; };
function pCmp(a,b){ const d=pOrdMom(a)-pOrdMom(b); if(d) return d; const x=pChave(a), y=pChave(b); return x[0]-y[0]||x[1]-y[1]||x[2]-y[2]||a.cod.localeCompare(b.cod); }
const princLista=()=>Object.values(principios).sort(pCmp);
const temPrinc=()=>Object.keys(principios).length>0;
const princDe=cod=>principios[cod]||null;
const princNome=cod=>{ const P=principios[cod]; return P?`${P.cod} ${P.nome}`:cod; };
/* cadeia: o próprio, o pai (princípio) e o momento ("M:oo") */
function princCadeia(cod){ const out=[], P=principios[cod]; if(!P) return [cod]; out.push(P.cod); if(P.pai&&principios[P.pai]) out.push(P.pai); out.push("M:"+P.mom); return out; }
const microsDe=cod=>princLista().filter(x=>x.pai===cod);
const escolhiveis=()=>princLista().filter(x=>x.nivel!=="rot");

/* ---------- ligação de exercícios e linhas da UT: {p: principal, s: [até 3 secundários]} ---------- */
const P_MAX_SEC=3;
function normPr(d){ if(!d||typeof d!=="object") return null; const s=v=>typeof v==="string"?v.trim():""; const p=s(d.p);
  const sec=[...new Set((Array.isArray(d.s)?d.s:[]).map(s).filter(x=>x&&x!==p))].slice(0,P_MAX_SEC); return p||sec.length?{p,s:sec}:null; }
const prVazio=pr=>!pr||(!pr.p&&!(pr.s||[]).length);
/* linha da UT: o que se escolheu nesta UT; senão o do repositório (atual); senão o da cópia do dia */
function princLinha(l){ if(l.princ!==undefined) return l.princ?normPr(l.princ):null; const R=typeof exercicios!=="undefined"&&exercicios[l.exId]; if(R&&R.princ) return normPr(R.princ); return normPr(l.copia&&l.copia.princ); }
function chipsPrinc(pr,curto){ pr=normPr(pr); if(!pr) return ""; const c=(cod,pri)=>{ const P=principios[cod], cor=P?pMom(P.mom)[2]:"#6B675E";
    return `<span class="pchip${pri?" pri":""}" style="--pc:${cor}" title="${esc(princNome(cod))}">${pri?"★ ":""}<b>${esc(cod)}</b>${curto?"":` ${esc(P?P.nome:"(código sem princípio)")}`}</span>`; };
  return `<span class="pchips">${pr.p?c(pr.p,true):""}${pr.s.map(x=>c(x,false)).join("")}</span>`; }

/* folha para escolher: toca ★ para o principal, + para os secundários (até 3); pesquisa por código ou nome */
function folhaEscolhePrinc(titulo,atual,onOk,extra,ligaExtra){ let pr=normPr(atual)||{p:"",s:[]}, q="";
  if(!temPrinc()){ toast("Ainda não há princípios no Modelo de Jogo."); return; }
  folha(`<h3>${esc(titulo)}</h3><p class="sub" style="margin:0">★ = princípio principal (conta o tempo como foco do exercício). + = secundários, até ${P_MAX_SEC}. Podes escolher um princípio ou um microprincípio; o macroprincípio vem por arrasto.</p>
    <div class="psel" id="ps-sel"></div><input type="search" id="ps-q" placeholder="Pesquisar por código ou nome (ex.: OD-3, gatilhos)" aria-label="Pesquisar princípios">
    <div class="plista" id="ps-l"></div>${extra||""}
    <div class="actions"><button class="btn" id="ps-limpa">Limpar</button><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ps-ok">Guardar</button></div>`,(s,fecha)=>{
    const sel=s.querySelector("#ps-sel"), L=s.querySelector("#ps-l");
    const pintaSel=()=>{ sel.innerHTML=prVazio(pr)?`<span class="sub">Nenhum princípio escolhido.</span>`:chipsPrinc(pr); };
    const linha=P=>{ const pri=pr.p===P.cod, sec=pr.s.includes(P.cod), ind=P.nivel==="micro";
      return `<div class="prow${ind?" micro":""}${P.estado==="construcao"?" constr":""}" data-c="${esc(P.cod)}"><span class="pcod" style="color:${pMom(P.mom)[2]}">${esc(P.cod)}</span><span class="pnm">${esc(P.nome)}${P.estado==="construcao"?` <small>em construção</small>`:""}</span>
        <button class="btn sm${pri?" dark":""}" data-k="p" aria-pressed="${pri}" title="Principal">★</button><button class="btn sm${sec?" dark":""}" data-k="s" aria-pressed="${sec}" title="Secundário">+</button></div>`; };
    const pinta=()=>{ const t=q.trim().toLowerCase(), ls=escolhiveis().filter(P=>!t||(P.cod+" "+P.nome+" "+(principios[P.pai]||{}).nome).toLowerCase().includes(t));
      L.innerHTML=P_MOM.map(([k,n,cor])=>{ const xs=ls.filter(P=>P.mom===k); return xs.length?`<h4 style="color:${cor}">${esc(n)}</h4>${xs.map(linha).join("")}`:""; }).join("")||`<p class="sub">Nenhum princípio com «${esc(q)}».</p>`;
      L.querySelectorAll(".prow button").forEach(b=>b.onclick=()=>{ const c=b.closest(".prow").dataset.c;
        if(b.dataset.k==="p"){ pr.p=pr.p===c?"":c; pr.s=pr.s.filter(x=>x!==c); }
        else if(pr.s.includes(c)) pr.s=pr.s.filter(x=>x!==c);
        else { if(pr.s.length>=P_MAX_SEC){ toast(`No máximo ${P_MAX_SEC} secundários.`); return; } pr.s.push(c); if(pr.p===c) pr.p=""; }
        pintaSel(); pinta(); }); };
    s.querySelector("#ps-q").oninput=e=>{ q=e.target.value; pinta(); };
    s.querySelector("#ps-limpa").onclick=()=>{ pr={p:"",s:[]}; pintaSel(); pinta(); };
    s.querySelector("#ps-ok").onclick=()=>{ const r=normPr(pr), sh=s; fecha(); onOk(r,sh); };
    if(ligaExtra) ligaExtra(s,fecha);
    pintaSel(); pinta(); }); }

/* ---------- tempo treinado ----------
   Cada linha principal da UT (sem complementares) conta o tempo de prática (séries × prática, sem pausas) para cada princípio presente:
   o próprio código, o princípio-pai e o momento — uma só vez por código e por linha, como «principal» se vier do principal, senão «secundário».
   O total do treino é a soma das linhas com prática; a soma dos princípios não é o total (um exercício treina várias coisas ao mesmo tempo). */
function codsLinha(pr){ const m={}; if(!pr) return m; if(pr.p) princCadeia(pr.p).forEach(c=>m[c]="p"); pr.s.forEach(x=>princCadeia(x).forEach(c=>{ if(!m[c]) m[c]="s"; })); return m; }
function tempoPrinc(ls,atleta){ const T={}, por={}; let total=0, nUT=0;
  ls.forEach(U=>{ let seg=null; if(atleta){ if(!atletasUT(U).some(a=>chaveT(a)===atleta&&presenteUT(U,a.k))) return; const a=atletasUT(U).find(x=>chaveT(x)===atleta), t=temposUT(U).por[a.k]; seg={}; (t?t.det:[]).forEach(d=>seg[d.lid]=(seg[d.lid]||0)+d.seg); }
    nUT++;
    U.exercicios.forEach(l=>{ if(l.pai&&!atleta) return; const s_=atleta?(seg[l.id]||0):praticaEx(l.copia); if(!s_) return; total+=s_;
      const m=codsLinha(princLinha(l)); Object.entries(m).forEach(([c,k])=>{ const x=T[c]||(T[c]={tot:0,pri:0,lin:0}); x.tot+=s_; if(k==="p") x.pri+=s_; x.lin++; }); }); });
  return {T,total,nUT}; }
/* resumo de uma UT: princípios principais com minutos (para a linha de resumo da UT) */
function resumoPrincUT(U){ const {T,total}=tempoPrinc([U]); return {total,itens:Object.entries(T).filter(([c])=>principios[c]&&principios[c].nivel!=="micro").map(([c,x])=>({c,...x})).sort((a,b)=>b.tot-a.tot||pCmp(principios[a.c],principios[b.c]))}; }
function htmlResumoPrinc(ls,titulo){ if(!temPrinc()) return ""; const {T,total}=tempoPrinc(ls); const it=Object.entries(T).filter(([c])=>principios[c]&&principios[c].nivel!=="micro").sort((a,b)=>b[1].tot-a[1].tot);
  if(!total) return ""; const pc=s=>Math.round(s/total*100);
  return `<div class="add"><h3>${esc(titulo||"Princípios treinados")} <span class="count">${it.length}</span></h3>${it.length?`<ul class="presumo">${it.slice(0,10).map(([c,x])=>`<li><span class="pcod" style="color:${pMom(principios[c].mom)[2]}">${esc(c)}</span><span class="pnm">${esc(principios[c].nome)}</span><b>${minT(x.tot)}'</b><small>${pc(x.tot)}%${x.pri?` · ★ ${minT(x.pri)}'`:""}</small></li>`).join("")}</ul>`:`<p class="sub" style="margin:0">Os exercícios destas UT ainda não têm princípios.</p>`}</div>`; }

/* ---------- sincronização ---------- */
function ligaPrincDb(){ if(!db) return;
  db.collection("principios").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
    q.docs.forEach(d=>{ const x=lerDoc(d); const P=x&&normPrinc(x,d.id); if(P) m[P.cod]=P; });
    mergeCol("principios/",m,principios); if(JSON.stringify(m)!==JSON.stringify(principios)){ principios=m; guardaPrincLocal(); princMudou(); } },()=>{});
  db.collection("modeloTxt").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
    q.docs.forEach(d=>{ const x=lerDoc(d); if(x){ delete x.atualizadoEm; m[d.id]=normTxt(x); } });
    mergeCol("modeloTxt/",m,modeloTxt); if(JSON.stringify(m)!==JSON.stringify(modeloTxt)){ modeloTxt=m; guardaPrincLocal(); princMudou(); } },()=>{});
  db.collection("princProp").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
    q.docs.forEach(d=>{ const x=normProp(lerDoc(d)||{}); if(x) m[d.id]=x; });
    mergeCol("princProp/",m,princProp); if(JSON.stringify(m)!==JSON.stringify(princProp)){ princProp=m; guardaPropLocal(); const xf=$("x-filtros"); if(xf) xf.innerHTML=""; if(typeof renderEx==="function"&&!$("sheet-root").innerHTML) renderEx(); } },()=>{}); }
/* propostas de princípios para os exercícios (princProp/{idExercício}); saem quando se aceitam ou ignoram */
const PP_LS="sca-princ-prop";
let princProp={}; try{ princProp=JSON.parse(localStorage.getItem(PP_LS)||"{}")||{}; }catch(e){ princProp={}; }
function normProp(x){ const pr=normPr(x); if(!pr||!pr.p) return null; return {p:pr.p,s:pr.s,conf:x.conf==="baixa"?"baixa":"media"}; }
Object.keys(princProp).forEach(k=>{ const x=normProp(princProp[k]); if(x) princProp[k]=x; else delete princProp[k]; });
const guardaPropLocal=()=>{ try{ localStorage.setItem(PP_LS,JSON.stringify(princProp)); }catch(e){} };
function tiraProp(id){ if(!princProp[id]) return; delete princProp[id]; guardaPropLocal(); apagaDoc("princProp/"+id); }
/* propostas por rever: só de exercícios que existem e ainda não têm princípios */
const propsPorRever=()=>Object.keys(princProp).filter(id=>typeof exercicios!=="undefined"&&exercicios[id]&&prVazio(exercicios[id].princ));
function princMudou(){ const xf=$("x-filtros"); if(xf&&!$("x-fpr")&&temPrinc()) xf.innerHTML=""; if($("sheet-root").innerHTML) return; const v=$("view-m"); if(v&&!v.hidden&&mModo==="princ") renderModelo(); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaPrincDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();
/* cópia de segurança */
function repoePrincipios(B){ if(!B.principios&&!B.modeloTxt&&!B.princProp) return;
  if(B.princProp){ const N=B.princProp; Object.keys(princProp).forEach(k=>{ if(!N[k]) apagaDoc("princProp/"+k); }); princProp={};
    Object.entries(N).forEach(([k,x])=>{ const P=normProp(x); if(P){ princProp[k]=P; gravaDoc("princProp/"+k,P); } }); guardaPropLocal(); }
  if(B.principios){ const N=B.principios; Object.keys(principios).forEach(c=>{ if(!N[c]) apagaDoc("principios/"+c); }); principios={};
    Object.entries(N).forEach(([c,x])=>{ const P=normPrinc(x,c); if(P){ principios[P.cod]=P; gravaDoc("principios/"+P.cod,P); } }); }
  if(B.modeloTxt){ const N=B.modeloTxt; Object.keys(modeloTxt).forEach(k=>{ if(!N[k]) apagaDoc("modeloTxt/"+k); }); modeloTxt={};
    Object.entries(N).forEach(([k,x])=>{ modeloTxt[k]=normTxt(x); gravaDoc("modeloTxt/"+k,modeloTxt[k]); }); }
  guardaPrincLocal(); }

/* ---------- separador Modelo de Jogo › Princípios ---------- */
let mModo="princ", pSec="identidade";
try{ const v=localStorage.getItem("sca-m-modo"); if(v==="quadros"||v==="princ") mModo=v; const s=localStorage.getItem("sca-p-sec"); if(s) pSec=s; }catch(e){}
const P_SECS=[["identidade","Identidade"],["estruturas","Estruturas e plano"],["tr","Princípios transversais"],["oo","01 Organização ofensiva"],["td","02 Transição defensiva"],["od","03 Organização defensiva"],["to","04 Transição ofensiva"],["bp","Bolas paradas"],["indicadores","Indicadores"],["construcao","Em construção"],["tempo","⏱ Tempo treinado"]];
function modosModeloHtml(){ if(!temPrinc()) return ""; return `<div class="seg mmodos" role="group" aria-label="Modelo de Jogo"><button data-mm="princ" aria-pressed="${mModo==="princ"}">📘 Princípios</button><button data-mm="quadros" aria-pressed="${mModo==="quadros"}">🎞 Quadros</button></div>`; }
function ligaModosModelo(nav){ nav.querySelectorAll("[data-mm]").forEach(b=>b.onclick=()=>{ if(mModo===b.dataset.mm) return; mModo=b.dataset.mm; try{ localStorage.setItem("sca-m-modo",mModo); }catch(e){} if(typeof mPara==="function") mPara(); renderModelo(); }); }
function mostraPrincView(on){ ["m-ebar","m-stage","m-play"].forEach(id=>{ const el=$(id); if(el) el.style.display=on?"none":""; }); const pv=$("m-princ"); if(pv) pv.hidden=!on; }
const nExLigados=cod=>typeof exercicios==="undefined"?0:Object.values(exercicios).filter(E=>{ const pr=normPr(E.princ); return pr&&Object.keys(codsLinha(pr)).includes(cod); }).length;
function lsUltimas(dias){ if(typeof listaUTs!=="function") return []; const lim=isoDia(new Date(Date.now()-dias*864e5)), hoje=isoDia(new Date()); return listaUTs().filter(U=>U.data&&U.data>=lim&&U.data<=hoje); }

function renderPrinc(){ const nav=$("m-nav"), pv=$("m-princ"); mostraPrincView(true);
  if(!P_SECS.some(s=>s[0]===pSec)) pSec="identidade";
  nav.innerHTML=modosModeloHtml()+`<div class="grp"><ul>${P_SECS.map(([k,n])=>{ const M=P_MOM.find(m=>m[0]===k);
    return `<li><button data-ps="${k}" aria-current="${pSec===k}"><span class="m-nm"><span>${M&&M[3]?`<b style="color:${M[2]}">●</b> `:""}${esc(n)}</span></span></button></li>`; }).join("")}</ul></div>`;
  ligaModosModelo(nav); nav.querySelectorAll("[data-ps]").forEach(b=>b.onclick=()=>{ pSec=b.dataset.ps; try{ localStorage.setItem("sca-p-sec",pSec); }catch(e){} renderModelo(); });
  const tit=P_SECS.find(s=>s[0]===pSec)[1].replace(/^\d+ /,""); $("m-tit").textContent=tit; const tg=$("m-tag"), M=P_MOM.find(m=>m[0]===pSec); tg.hidden=!M; if(M){ tg.textContent=M[3]?"MOMENTO "+M[3]:"BASE COMUM"; tg.style.background=M[2]; }
  $("m-bar").innerHTML=`<button class="btn sm" id="p-ppt"${temPrinc()?"":" disabled"}>⬇ PowerPoint</button>`; $("p-ppt").onclick=()=>exportaModeloPptx();
  if(!temPrinc()&&!Object.keys(modeloTxt).length){ pv.innerHTML=`<div class="m-vazio"><b>O Modelo de Jogo ainda não tem princípios.</b><span>Os princípios, microprincípios e textos do modelo entram aqui (um registo por princípio) e depois editam-se na app. Os quadros animados continuam em 🎞 Quadros.</span></div>`; renderPrincPainel(); return; }
  const f={identidade:secIdentidade,estruturas:secEstruturas,tr:()=>secMomento("tr"),oo:()=>secMomento("oo"),td:()=>secMomento("td"),od:()=>secMomento("od"),to:()=>secMomento("to"),bp:secBP,indicadores:secIndicadores,construcao:secConstrucao,tempo:secTempo}[pSec];
  pv.innerHTML=f(); ligaPrincView(pv); renderPrincPainel(); }

const edBtn=(k,txt)=>`<button class="btn sm" data-edt="${k}">✎ ${txt||"Editar"}</button>`;
const ulHtml=a=>(a||[]).length?`<ul class="plist">${a.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"";
function secIdentidade(){ const I=modeloTxt.identidade||{};
  return `<div class="psec"><div class="phead"><h3>${esc(I.lema||"Identidade")}</h3>${edBtn("identidade")}</div>${I.frase?`<p class="sub">${esc(I.frase)}</p>`:""}
    <h4>Valores inegociáveis</h4><div class="pgrid4">${(I.valores||[]).map(v=>`<div class="pcard"><b class="pv">${esc(v.nome)}</b><p>${esc(v.sig||"")}</p>${ulHtml(v.comps)}<p class="sub"><b>Evidência:</b> ${esc(v.evid||"")}</p></div>`).join("")}</div>
    <h4>Macroprincípios</h4><div class="pgrid3">${(I.macros||[]).map(m=>{ const M=pMom(m.mom==="tr"?"to":m.mom); return `<div class="pcard" style="border-top:4px solid ${m.mom==="tr"?"#2C4E9C":M[2]}"><small>${m.mom==="oo"?"Organização ofensiva":m.mom==="od"?"Organização defensiva":"Transições"}</small><b class="pv">«${esc(m.frase)}»</b><p class="sub">${esc(m.desc||"")}</p><small>Valores: ${esc(m.valores||"")}</small></div>`; }).join("")}</div>
    <h4>Base comum de linguagem</h4><div class="pgrid3"><div class="pcard"><b>Princípios gerais</b>${ulHtml(I.gerais)}</div><div class="pcard"><b>Fundamentais ofensivos</b>${ulHtml(I.fundOf)}</div><div class="pcard"><b>Fundamentais defensivos</b>${ulHtml(I.fundDef)}</div></div></div>`; }
function tabRef(rows,cab){ return (rows||[]).length?`<div class="tblwrap"><table class="ttab"><thead><tr>${cab.map(c=>`<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.ref)}</b></td><td>${esc(r.base)}</td><td>${esc(r.alt)}</td></tr>`).join("")}</tbody></table></div>`:""; }
function secEstruturas(){ const E=modeloTxt.estruturas||{}, Pl=modeloTxt.plano||{};
  return `<div class="psec"><div class="phead"><h3>Uma identidade, duas estruturas</h3>${edBtn("estruturas")}</div>${E.comuns?`<p><b>Princípios comuns:</b> ${esc(E.comuns)}</p>`:""}
    <div class="pgrid2">${[E.base,E.alt].filter(Boolean).map(x=>`<div class="pcard"><small>${esc(x.nome||"")}</small><b class="pbig">${esc(x.sis||"")}</b><p class="sub">${esc(x.txt||"")}</p></div>`).join("")}</div>
    <h4>A atacar</h4>${tabRef(E.ataque,["Fase",(E.base||{}).sis||"Base",(E.alt||{}).sis||"Alternativa"])}
    <h4>A defender</h4>${tabRef(E.defesa,["Referência",(E.base||{}).sis||"Base",(E.alt||{}).sis||"Alternativa"])}
    <div class="phead"><h3>Plano estratégico</h3>${edBtn("plano")}</div><div class="pgrid2"><div class="pcard"><b class="pbig">80%</b><b>Identidade</b>${ulHtml(Pl.ident)}</div><div class="pcard"><b class="pbig" style="color:var(--gold)">20%</b><b>Adaptação</b>${ulHtml(Pl.adapt)}</div></div>${Pl.regra?`<p class="pnota">${esc(Pl.regra)}</p>`:""}</div>`; }
function princCard(P){ const ms=microsDe(P.cod), n=nExLigados(P.cod), M=pMom(P.mom);
  return `<div class="pprin${P.estado==="construcao"?" constr":""}" style="--pc:${M[2]}"><div class="phead"><h3><span class="pcod">${esc(P.cod)}</span> ${esc(P.nome)}</h3>${P.estado==="construcao"?`<span class="ptag">em construção</span>`:""}<button class="btn sm" data-edp="${esc(P.cod)}">✎</button></div>
    ${P.comp?`<p><b>Comportamento:</b> ${esc(P.comp)}</p>`:""}${P.ind?`<p><b>Indicador de sucesso:</b> ${esc(P.ind)}</p>`:""}${P.txt?`<p class="sub">${esc(P.txt)}</p>`:""}
    ${ms.length?`<div class="tblwrap"><table class="ttab pmic"><thead><tr><th>Código</th><th>Microprincípio</th><th>O que queremos ver</th><th></th></tr></thead><tbody>${ms.map(m=>`<tr${m.estado==="construcao"?' class="constr"':""}><td><b>${esc(m.cod)}</b></td><td>${esc(m.nome)}</td><td>${esc(m.txt)}</td><td class="n"><button class="btn sm" data-edp="${esc(m.cod)}" aria-label="Editar ${esc(m.cod)}">✎</button></td></tr>`).join("")}</tbody></table></div>`:""}
    <div class="pfoot"><span class="sub">${n?`${n} ${n===1?"exercício ligado":"exercícios ligados"}`:"Sem exercícios ligados"}</span><button class="btn sm" data-nmic="${esc(P.cod)}">+ Microprincípio</button></div></div>`; }
function decisaoHtml(D){ if(!D) return ""; const col=(x,cor)=>x?`<div class="pcard"><b class="pv" style="color:${cor}">${esc(x.t)}</b>${ulHtml(x.itens)}${x.nota?`<p class="sub"><i>${esc(x.nota)}</i></p>`:""}</div>`:"";
  return `<h4>${esc(D.pergunta||"Decisão")}</h4><div class="pgrid2">${col(D.sim,"#23844A")}${col(D.nao,"#C8102E")}</div>${D.regra?`<p class="pnota">${esc(D.regra)}</p>`:""}`; }
function secMomento(k){ const M=pMom(k), T=modeloTxt["mom-"+k]||{}, ps=princLista().filter(P=>P.mom===k&&!P.pai&&P.nivel!=="rot"), rots=princLista().filter(P=>P.mom===k&&P.nivel==="rot");
  const cab=k==="tr"?`<p class="sub">Valem em todos os momentos e dão a linha condutora entre eles.</p>`
    :`<div class="psec"><div class="phead"><h3>${esc(T.pergunta||M[1])}</h3>${edBtn("mom-"+k)}</div>${T.macro?`<p><b>Macroprincípio:</b> «${esc(T.macro)}»</p>`:""}${T.intencao?`<p><b>Intenção:</b> ${esc(T.intencao)}</p>`:""}${T.po?`<p><b>Princípio operacional:</b> ${esc(T.po)}</p>`:""}${T.frase?`<p class="sub">${esc(T.frase)}</p>`:""}
      ${decisaoHtml(T.decisao)}
      ${(T.fases||[]).length?`<h4>${k==="od"?"Altura do bloco":"Fases"}</h4><div class="tblwrap"><table class="ttab"><thead><tr><th>${k==="od"?"Altura":"Fase"}</th><th>Objetivo</th><th>Comportamentos</th><th>${k==="od"?"Referências":"Rotina"}</th></tr></thead><tbody>${T.fases.map(f=>`<tr><td><b>${esc(f.nome)}</b></td><td>${esc(f.obj||"")}</td><td>${esc(f.comp||"")}</td><td>${esc(f.rot||"")}</td></tr>`).join("")}</tbody></table></div>${T.regraFases?`<p class="pnota">${esc(T.regraFases)}</p>`:""}`:""}${T.atitude?`<p>${esc(T.atitude)}</p>`:""}</div>`;
  return cab+ps.map(princCard).join("")+(rots.length?`<div class="pprin" style="--pc:${M[2]}"><div class="phead"><h3>Rotinas padrão</h3></div><div class="tblwrap"><table class="ttab pmic"><tbody>${rots.map(r=>`<tr${r.estado==="construcao"?' class="constr"':""}><td><b>${esc(r.cod)}</b></td><td>${esc(r.nome)}${r.estado==="construcao"?' <span class="ptag">em construção</span>':""}</td><td>${esc(r.txt)}</td><td class="n"><button class="btn sm" data-edp="${esc(r.cod)}">✎</button></td></tr>`).join("")}</tbody></table></div></div>`:"")
    +(!ps.length&&!rots.length?`<p class="sub">Sem princípios neste momento.</p>`:""); }
function secBP(){ const B=modeloTxt.bp||{}; return `<div class="psec"><div class="phead"><h3>Bolas paradas: anexo ao modelo</h3>${edBtn("bp")}</div>${B.intro?`<p class="sub">${esc(B.intro)}</p>`:""}
  <div class="pgrid2"><div class="pcard"><b>Matriz ofensiva</b>${ulHtml(B.of)}</div><div class="pcard"><b>Matriz defensiva</b>${ulHtml(B.def)}</div></div>${B.prio?`<p class="pnota"><b>Prioridades:</b> ${esc(B.prio)}</p>`:""}</div>`; }
function secIndicadores(){ const I=modeloTxt.indicadores||{}; return `<div class="psec"><div class="phead"><h3>Indicadores observáveis</h3>${edBtn("indicadores")}</div>${I.frase?`<p class="sub">«${esc(I.frase)}»</p>`:""}
  <div class="tblwrap"><table class="ttab"><thead><tr><th>Momento</th><th>Indicadores de jogo</th><th>Indicador complementar</th></tr></thead><tbody>${(I.linhas||[]).map(r=>`<tr><td><b style="color:${pMom(r.mom)[2]}">${esc(pMom(r.mom)[1])}</b></td><td>${esc(r.ind)}</td><td>${esc(r.compl||"")}</td></tr>`).join("")}</tbody></table></div></div>`; }
function secConstrucao(){ const C=modeloTxt.construcao||{}, pc=princLista().filter(P=>P.estado==="construcao");
  return `<div class="psec"><div class="phead"><h3>A decidir e a escrever</h3>${edBtn("construcao")}</div><div class="tblwrap"><table class="ttab"><thead><tr><th>Tema</th><th>Situação</th><th>Quem decide</th></tr></thead><tbody>${(C.itens||[]).map(r=>`<tr><td><b>${esc(r.tema)}</b></td><td>${esc(r.sit)}</td><td>${esc(r.quem||"")}</td></tr>`).join("")}</tbody></table></div>
    ${pc.length?`<h4>Princípios marcados «em construção»</h4><ul class="plist">${pc.map(P=>`<li><b>${esc(P.cod)}</b> ${esc(P.nome)}</li>`).join("")}</ul>`:""}</div>`; }

/* ⏱ Tempo treinado: período, nível e atleta */
let ptF={per:"28",niv:"princ",atl:""}; try{ ptF={...ptF,...JSON.parse(localStorage.getItem("sca-pt-f")||"{}")}; }catch(e){}
function lsPeriodo(){ if(typeof listaUTs!=="function") return []; const todas=listaUTs().filter(U=>U.data), hoje=isoDia(new Date());
  if(/^\d+$/.test(ptF.per)) return lsUltimas(+ptF.per);
  if(ptF.per.startsWith("ep:")) return todas.filter(U=>epocaDe(U.data)===ptF.per.slice(3));
  if(ptF.per.startsWith("mi:")&&typeof ciclos!=="undefined"){ const C=ciclos[ptF.per.slice(3)]; return C?todas.filter(U=>U.data>=C.inicio&&U.data<=C.fim):[]; }
  return todas.filter(U=>U.data<=hoje); }
function secTempo(){ const todas=typeof listaUTs==="function"?listaUTs().filter(U=>U.data):[], eps=[...new Set(todas.map(U=>epocaDe(U.data)))].sort().reverse();
  const mis=typeof ciclos!=="undefined"?Object.values(ciclos).filter(c=>c.tipo==="micro"&&todas.some(U=>U.data>=c.inicio&&U.data<=c.fim)).sort((a,b)=>b.inicio.localeCompare(a.inicio)).slice(0,20):[];
  const ls=lsPeriodo(), ats=[...new Map(todas.flatMap(U=>atletasUT(U).filter(a=>presenteUT(U,a.k)).map(a=>[chaveT(a),nomeCurto(a)]))).entries()].sort((a,b)=>a[1].localeCompare(b[1],"pt"));
  if(ptF.atl&&!ats.some(a=>a[0]===ptF.atl)) ptF.atl="";
  const R=tempoPrinc(ls,ptF.atl||null), pc=s=>R.total?Math.round(s/R.total*100):0;
  let rows=[]; if(ptF.niv==="mom") rows=P_MOM.map(m=>({c:"M:"+m[0],cod:"",nome:m[1],cor:m[2]}));
  else rows=escolhiveis().filter(P=>ptF.niv==="micro"?true:P.nivel!=="micro").map(P=>({c:P.cod,cod:P.cod,nome:(P.nivel==="micro"?"  ":"")+P.nome,cor:pMom(P.mom)[2],micro:P.nivel==="micro"}));
  const mx=Math.max(1,...rows.map(r=>(R.T[r.c]||{}).tot||0));
  return `<div class="psec"><p class="sub">Tempo treinado = minutos de prática (sem pausas e sem complementares) dos exercícios em que o princípio esteve presente, como principal ou secundário. % = parte do tempo de treino em que esteve presente; a soma passa de 100% porque um exercício treina várias coisas ao mesmo tempo.</p>
    <div class="pfiltros"><label class="f">Período<select id="pt-per"><option value="7">Últimos 7 dias</option><option value="28">Últimas 4 semanas</option><option value="56">Últimas 8 semanas</option>${eps.map(e=>`<option value="ep:${e}">Época ${e}</option>`).join("")}${mis.map(c=>`<option value="mi:${esc(c.id)}">Micro ${c.n||"?"} · ${dataPt_(c.inicio).slice(0,5)}</option>`).join("")}</select></label>
      <label class="f">Nível<select id="pt-niv"><option value="princ">Princípios</option><option value="micro">Princípios e microprincípios</option><option value="mom">Momentos</option></select></label>
      <label class="f">Atleta<select id="pt-atl"><option value="">Equipa</option>${ats.map(([k,n])=>`<option value="${esc(k)}">${esc(n)}</option>`).join("")}</select></label></div>
    <p class="sub"><b>${R.nUT}</b> ${R.nUT===1?"UT":"UT"} · <b>${minT(R.total)}'</b> de treino${ptF.atl?" deste atleta":""}</p>
    ${!R.total?`<div class="m-vazio"><b>Sem tempo de treino neste período.</b><span>O tempo vem das UT: séries × tempo de prática de cada exercício.</span></div>`
    :`<div class="tblwrap"><table class="ttab ptempo"><thead><tr><th>Código</th><th>${ptF.niv==="mom"?"Momento":"Princípio"}</th><th class="n">Tempo treinado</th><th class="n">% do treino</th><th class="n">★ principal</th><th></th></tr></thead><tbody>
      ${rows.map(r=>{ const x=R.T[r.c]||{tot:0,pri:0}; return `<tr class="${x.tot?"":"zero"}${r.micro?" micro":""}"><td><b style="color:${r.cor}">${esc(r.cod)}</b></td><td>${esc(r.nome.trim())}</td><td class="n"><b>${minT(x.tot)}'</b></td><td class="n">${pc(x.tot)}%</td><td class="n">${minT(x.pri)}'</td><td class="pbarc"><i class="pbar" style="width:${Math.round(x.tot/mx*100)}%;background:${r.cor}"></i></td></tr>`; }).join("")}</tbody></table></div>`}</div>`; }

function ligaPrincView(pv){
  pv.querySelectorAll("[data-edp]").forEach(b=>b.onclick=()=>folhaEditaPrinc(b.dataset.edp));
  pv.querySelectorAll("[data-nmic]").forEach(b=>b.onclick=()=>folhaEditaPrinc(null,b.dataset.nmic));
  pv.querySelectorAll("[data-edt]").forEach(b=>b.onclick=()=>folhaEditaTxt(b.dataset.edt));
  const sel=(id,k)=>{ const el=pv.querySelector(id); if(!el) return; el.value=ptF[k]; if(el.value!==ptF[k]){ el.selectedIndex=0; ptF[k]=el.value; } el.onchange=()=>{ ptF[k]=el.value; try{ localStorage.setItem("sca-pt-f",JSON.stringify(ptF)); }catch(e){} renderModelo(); }; };
  sel("#pt-per","per"); sel("#pt-niv","niv"); sel("#pt-atl","atl"); }
function renderPrincPainel(){ const ls=princLista(), n=k=>ls.filter(P=>P.nivel===k).length, pc=ls.filter(P=>P.estado==="construcao").length;
  const nEx=typeof exercicios==="undefined"?0:Object.values(exercicios).filter(E=>normPr(E.princ)).length, totEx=typeof exercicios==="undefined"?0:Object.keys(exercicios).length;
  $("m-panel").innerHTML=`<header><h2>Modelo de Jogo</h2><p class="sub">macroprincípio → princípio → microprincípio</p></header>
    <div class="add"><h3>No modelo</h3><ul class="presumo"><li><span class="pnm">Princípios</span><b>${n("princ")}</b></li><li><span class="pnm">Transversais</span><b>${n("tr")}</b></li><li><span class="pnm">Microprincípios</span><b>${n("micro")}</b></li><li><span class="pnm">Rotinas</span><b>${n("rot")}</b></li><li><span class="pnm">Em construção</span><b>${pc}</b></li></ul></div>
    <div class="add"><h3>Exercícios ligados</h3><p class="sub" style="margin:0">${nEx} de ${totEx} exercícios do repositório têm princípios. Cada exercício: 1 principal (★) e até ${P_MAX_SEC} secundários.</p></div>
    ${htmlResumoPrinc(lsUltimas(28),"Últimas 4 semanas")}
    <div class="add"><button class="btn" id="p-ppt2" style="width:100%"${temPrinc()?"":" disabled"}>⬇ Exportar o modelo em PowerPoint</button></div>`;
  const b=$("p-ppt2"); if(b) b.onclick=()=>exportaModeloPptx(); }

/* editar um princípio (ou criar um microprincípio novo: o código é o seguinte livre e não muda depois) */
function folhaEditaPrinc(cod,paiNovo){ const novo=!cod; let P=novo?null:principios[cod]; if(!novo&&!P) return;
  if(novo){ const pai=principios[paiNovo]; if(!pai) return; let i=1; while(principios[`${paiNovo}.${i}`]) i++; P={cod:`${paiNovo}.${i}`,nivel:"micro",mom:pai.mom,pai:paiNovo,nome:"",comp:"",ind:"",txt:"",estado:"vigor",ordem:0}; }
  const eMic=P.nivel==="micro"||P.nivel==="rot", nEx=nExLigados(P.cod);
  folha(`<h3>${novo?"Novo microprincípio":esc(P_NIV[P.nivel])} <span class="pcod">${esc(P.cod)}</span></h3><p class="sub" style="margin:0">O código não muda: é ele que liga os exercícios, as UT e a análise. ${P.pai?`Pertence a ${esc(princNome(P.pai))}.`:""}</p>
    <label class="f">Nome<input type="text" id="pe-n" value="${esc(P.nome)}"></label>
    ${eMic?"":`<label class="f">Comportamento observável<textarea id="pe-c" rows="2">${esc(P.comp)}</textarea></label><label class="f">Indicador de sucesso<textarea id="pe-i" rows="2">${esc(P.ind)}</textarea></label>`}
    <label class="f">${eMic?"O que queremos ver":"Notas"}<textarea id="pe-t" rows="3">${esc(P.txt)}</textarea></label>
    <div class="seg" id="pe-e"><button data-k="vigor">Em vigor</button><button data-k="construcao">Em construção</button></div>
    <div class="actions">${!novo&&P.nivel==="micro"?`<button class="btn danger" id="pe-del">🗑 Apagar</button>`:""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="pe-ok">Guardar</button></div>`,(s,fecha)=>{
    let est_=P.estado; const pinta=()=>s.querySelectorAll("#pe-e button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===est_)));
    s.querySelectorAll("#pe-e button").forEach(b=>b.onclick=()=>{ est_=b.dataset.k; pinta(); }); pinta();
    const v=id=>{ const e=s.querySelector(id); return e?e.value.trim():undefined; };
    s.querySelector("#pe-ok").onclick=()=>{ const nome=v("#pe-n"); if(!nome){ toast("Falta o nome."); return; }
      const N={...P,nome,txt:v("#pe-t"),estado:est_}; if(!eMic){ N.comp=v("#pe-c"); N.ind=v("#pe-i"); } if(novo) N.ordem=Date.now();
      fecha(); gravaPrinc(N); renderModelo(); toast(`${N.cod} guardado`); };
    const d=s.querySelector("#pe-del"); if(d) confirma2(d,nEx?`Ligado a ${nEx} exercícios · toca outra vez`:"Toca outra vez para apagar",()=>{ fecha(); apagaPrinc(P.cod); renderModelo(); toast(`${P.cod} apagado`); }); }); }

/* editar os textos de uma secção: cada texto num campo; listas uma linha por item; listas de blocos (valores, fases…) bloco a bloco */
const P_ROT={lema:"Lema",frase:"Frase",pergunta:"Pergunta-chave",macro:"Macroprincípio",intencao:"Intenção",po:"Princípio operacional",regraFases:"Regra das fases",atitude:"Atitude",
  comuns:"Princípios comuns",regra:"Regra",intro:"Introdução",prio:"Prioridades",nome:"Nome",sig:"Significado",comps:"Comportamentos (um por linha)",evid:"Evidência no campo",desc:"Descrição",valores:"Valores",
  gerais:"Princípios gerais (um por linha)",fundOf:"Fundamentais ofensivos (um por linha)",fundDef:"Fundamentais defensivos (um por linha)",sis:"Sistema",txt:"Texto",ref:"Referência",base:"Estrutura-base",alt:"Alternativa",
  ident:"Identidade (80%, um por linha)",adapt:"Adaptação (20%, um por linha)",of:"Matriz ofensiva (um por linha)",def:"Matriz defensiva (um por linha)",obj:"Objetivo",comp:"Comportamentos",rot:"Rotina / referência",
  ind:"Indicadores",compl:"Indicador complementar",tema:"Tema",sit:"Situação",quem:"Quem decide",t:"Título",itens:"Itens (um por linha)",nota:"Nota",mom:"Momento"};
const P_SECNOME={identidade:"Identidade","mom-oo":"Organização ofensiva","mom-td":"Transição defensiva","mom-od":"Organização defensiva","mom-to":"Transição ofensiva",estruturas:"Estruturas",plano:"Plano estratégico",bp:"Bolas paradas",indicadores:"Indicadores",construcao:"Em construção"};
function camposTxt(v,path){ const rot=k=>P_ROT[k]||k;
  if(Array.isArray(v)){ if(v.every(x=>typeof x==="string")) return `<textarea data-p="${esc(path)}" data-t="lst" rows="${Math.min(8,Math.max(3,v.length+1))}">${esc(v.join("\n"))}</textarea>`;
    return v.map((x,i)=>`<fieldset class="pfs"><legend>${i+1}</legend>${camposTxt(x,path+"."+i)}</fieldset>`).join("")+`<button class="btn sm" data-addp="${esc(path)}">+ Acrescentar</button>`; }
  if(v&&typeof v==="object") return Object.entries(v).filter(([k])=>!/^(alterado|criado|atualizado)/.test(k)).map(([k,x])=>{ const p=path?path+"."+k:k;
    if(typeof x==="string") return `<label class="f">${esc(rot(k))}<textarea data-p="${esc(p)}" data-t="str" rows="${x.length>90?3:1}">${esc(x)}</textarea></label>`;
    return `<div class="pfg"><b>${esc(rot(k))}</b>${camposTxt(x,p)}</div>`; }).join("");
  return ""; }
function setPath(o,path,val){ const ks=path.split("."); let c=o; ks.slice(0,-1).forEach(k=>{ c=c[k]; }); c[ks[ks.length-1]]=val; }
function getPath(o,path){ return path.split(".").reduce((c,k)=>c==null?c:c[k],o); }
function folhaEditaTxt(k){ let V=clone(modeloTxt[k]||{}); ["alteradoPor","alteradoEm"].forEach(x=>delete V[x]);
  const abre=()=>folha(`<h3>${esc(P_SECNOME[k]||k)}</h3><div class="pform">${camposTxt(V,"")}</div><div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="pt-ok">Guardar</button></div>`,(s,fecha)=>{
    const le=()=>s.querySelectorAll("[data-p]").forEach(el=>setPath(V,el.dataset.p,el.dataset.t==="lst"?el.value.split("\n").map(x=>x.trim()).filter(Boolean):el.value.trim()));
    s.querySelectorAll("[data-addp]").forEach(b=>b.onclick=()=>{ le(); const arr=getPath(V,b.dataset.addp); const mod=arr[arr.length-1]; arr.push(JSON.parse(JSON.stringify(mod),(kk,vv)=>typeof vv==="string"?"":Array.isArray(vv)&&vv.every(x=>typeof x==="string")?[]:vv)); abre(); });
    s.querySelector("#pt-ok").onclick=()=>{ le(); fecha(); gravaTxt(k,V); renderModelo(); toast("Guardado"); }; });
  abre(); }
