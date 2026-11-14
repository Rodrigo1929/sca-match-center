/* ================= PALESTRA (v123) =================
   Preparação e apresentação do plano de jogo à equipa, por esta ordem: 1 O Nosso Onze Inicial, 2 Onze Provável do Adversário,
   3 COM BOLA, 4 SEM BOLA e, no fim, as Bolas Paradas (só os setups iniciais).
   - Os onzes não se copiam: são os do jogo (jogo.onze, jogo.adv), com o desenho e a edição do Jogo e do Adversário (desenhaOnze, desenhaAdvOnze).
   - COM / SEM BOLA: quadros animados por passos no motor do Modelo de Jogo (id "pl:<id>", coleção palestra). Enquanto um quadro está aberto,
     o editor do Modelo (o mesmo DOM, ids m-*) vem para este separador; ao sair volta para o Modelo de Jogo.
   - Bolas paradas: representação dos lances (desenha com setup), nunca uma cópia; sem os lances que seguem outro (posição ligada).
   - O editor, a animação, o Apresentar e o PDF desenham todos dos mesmos dados (primsEstaticas/primsDinamicas e desenha).
   Coleções: palestra/{id} (um quadro por documento; jogo "atual" ou o id do jogo arquivado) e palestraJogo/{jogo} (sistema e notas dos onzes). */
const PL_LS="sca-palestra-v1", PLJ_LS="sca-palestra-jogo-v1";
const PL_SECS=[["onze","O Nosso Onze Inicial"],["adv","Onze Provável do Adversário"],["com","COM BOLA"],["sem","SEM BOLA"],["bp","Bolas Paradas"]];
const PL_COR={com:"#C00000",sem:"#1F5FBF"};
const PL_NOME={com:"COM BOLA",sem:"SEM BOLA"};
let palestra={}, palJogo={};
try{ palestra=JSON.parse(localStorage.getItem(PL_LS)||"{}")||{}; }catch(e){ palestra={}; }
try{ palJogo=JSON.parse(localStorage.getItem(PLJ_LS)||"{}")||{}; }catch(e){ palJogo={}; }
let plSec="onze", plCur=null, plBp=null, plNotaT=null;
try{ const s=JSON.parse(localStorage.getItem("sca-palestra-cur")||"null"); if(s&&PL_SECS.some(x=>x[0]===s.sec)){ plSec=s.sec; plCur=s.cur||null; plBp=s.bp||null; } }catch(e){}

/* ---------- dados ---------- */
function normPal(d,id){ const sec=d&&d.sec==="sem"?"sem":"com"; const Q=normQ({...(d||{}),id,mom:sec==="sem"?"def":"of"});
  Q.id=id; Q.sec=sec; Q.jogo=String((d&&d.jogo)||"atual"); Q.desc=String((d&&d.desc)||""); Q.criadoEm=String((d&&d.criadoEm)||"");
  if(d&&d.copiaDe) Q.copiaDe=String(d.copiaDe); else delete Q.copiaDe;
  delete Q.fig; delete Q.cab; return Q; }
function normPalJogo(d){ return {sis:String(d&&d.sis||""),notasOnze:String(d&&d.notasOnze||""),notasAdv:String(d&&d.notasAdv||"")}; }
Object.keys(palestra).forEach(id=>{ try{ palestra[id]=normPal(palestra[id],id); }catch(e){ delete palestra[id]; } });
Object.keys(palJogo).forEach(k=>{ palJogo[k]=normPalJogo(palJogo[k]); });
function guardaPalLocal(){ try{ localStorage.setItem(PL_LS,JSON.stringify(palestra)); localStorage.setItem(PLJ_LS,JSON.stringify(palJogo)); }catch(e){} }
function guardaPalCur(){ try{ localStorage.setItem("sca-palestra-cur",JSON.stringify({sec:plSec,cur:plCur,bp:plBp})); }catch(e){} }
/* motor do Modelo de Jogo: ler e gravar um quadro "pl:<id>" */
/* cab = início do título do slide («COM BOLA – nome»); não se grava */
function palQ(id){ const d=palestra[id]; return d?{...clone(d),id:"pl:"+id,cab:PL_NOME[d.sec]+" – "}:null; }
function guardaPal(id,Q){ const N=normPal({...clone(Q),id},id); palestra[id]=N; guardaPalLocal(); gravaDoc("palestra/"+id,N); }
function palApagaDoc(id){ delete palestra[id]; guardaPalLocal(); apagaDoc("palestra/"+id); if(plCur===id) plCur=null; if(mPal===id) palSemQuadro(); else renderPalestra(); }
function pj(k="atual"){ return palJogo[k]||normPalJogo(null); }
function guardaPalJogo(k,o){ palJogo[k]=normPalJogo(o); guardaPalLocal(); gravaDoc("palestraJogo/"+k,palJogo[k]); }
function listaPal(sec,jogoId="atual"){ return Object.values(palestra).filter(q=>q.jogo===jogoId&&q.sec===sec).sort((a,b)=>a.ordem-b.ordem||String(a.criadoEm).localeCompare(String(b.criadoEm))); }
/* bolas paradas: só os setups iniciais — slides iniciais e lances com posição própria; os que seguem outro (↳) ficam de fora */
function setupsPal(){ return lances().filter(L=>(L.tipo==="DEF"||L.tipo==="OF")&&!L.dinamico&&!ocultoQuadro(L)&&(L.bolas||[]).length&&(!L.base||!baseDe(L)||eProprio(L))); }
function idJogoTxt(){ return [jogo.adversario?"vs "+jogo.adversario:"",jogo.data?dataPt(jogo.data):"",jogo.hora||""].filter(Boolean).join(" · "); }

/* ---------- arquivar e repor ---------- */
/* v123 (decidido pelo Rodrigo): ao arquivar, os quadros COM/SEM BOLA continuam no jogo seguinte e fica uma cópia fiel no jogo arquivado */
function arquivaPalestra(hid,novo){ ["com","sem"].forEach(sec=>listaPal(sec).forEach(Q=>{ const id=mId("pl"); guardaPal(id,{...clone(Q),id,jogo:hid,copiaDe:Q.id}); }));
  guardaPalJogo(hid,pj()); if(novo) guardaPalJogo("atual",{...pj(),notasAdv:""}); }
function repoePalestra(P,PJ){ Object.keys(palestra).forEach(id=>{ if(!P[id]) apagaDoc("palestra/"+id); }); palestra={};
  Object.entries(P||{}).forEach(([id,Q])=>{ try{ palestra[id]=normPal(Q,id); gravaDoc("palestra/"+id,palestra[id]); }catch(e){} });
  Object.keys(palJogo).forEach(k=>{ if(!PJ[k]) apagaDoc("palestraJogo/"+k); }); palJogo={};
  Object.entries(PJ||{}).forEach(([k,o])=>{ palJogo[k]=normPalJogo(o); gravaDoc("palestraJogo/"+k,palJogo[k]); });
  guardaPalLocal(); if(mPal&&!palestra[mPal]) palSemQuadro(); else renderPalestra(); }

/* ---------- criar, duplicar, ordenar, apagar ---------- */
function criaPal(sec,o){ const Q=criaQuadro({nome:o.nome,mom:sec==="sem"?"def":"of",sub:sec==="sem"?"bmedio":"constr",sis:o.sis,sisAdv:o.sisAdv==="jogo"?"":o.sisAdv});
  if(o.sisAdv==="jogo"){ const nv=pecasAdvJogo(), bola=Q.pecas.filter(p=>p.eq==="bola"); Q.pecas=[...Q.pecas.filter(p=>p.eq!=="bola"),...nv.map(p=>p.pc),...bola]; nv.forEach(p=>Q.passos[0].pos[p.pc.id]={x:p.x,y:p.y}); Q.sisAdv=advJ().sistema||"jogo"; }
  const id=mId("pl"), ls=listaPal(sec); pushMUndo("pl:"+id);
  guardaPal(id,{...Q,id,sec,jogo:"atual",desc:o.desc||"",espacos:!!o.espacos,ordem:(ls.length?ls[ls.length-1].ordem:0)+1,criadoEm:new Date().toISOString()}); return id; }
function duplicaPal(id){ const Q=palestra[id]; if(!Q) return; const nid=mId("pl"), C=clone(Q); C.id=nid; C.nome=Q.nome+" (cópia)"; C.ordem=Q.ordem+.5; C.criadoEm=new Date().toISOString(); delete C.copiaDe;
  C.passos.forEach(P=>P.id=mId("p")); pushMUndo("pl:"+nid); guardaPal(nid,C); palAbre(nid); toast("Quadro duplicado"); }
function movePal(id,d){ const Q=palestra[id]; if(!Q) return; const ls=listaPal(Q.sec,Q.jogo), i=ls.findIndex(q=>q.id===id), j=i+d; if(j<0||j>=ls.length) return;
  const A=clone(ls[i]), B=clone(ls[j]); let oa=A.ordem, ob=B.ordem; if(oa===ob){ oa=i; ob=j; } A.ordem=ob; B.ordem=oa; guardaPal(B.id,B); guardaPal(A.id,A); renderPalestra(); }
function apagaPal(id){ const Q=palestra[id]; if(!Q) return; mPara(); pushMUndo("pl:"+id); palApagaDoc(id); toast(`Quadro «${Q.nome}» apagado`,()=>{ desfazModelo(); }); }
function mudaSecPal(id,sec){ const Q=palestra[id]; if(!Q||Q.sec===sec) return; const ls=listaPal(sec,Q.jogo); pushMUndo("pl:"+id);
  guardaPal(id,{...clone(Q),sec,ordem:(ls.length?ls[ls.length-1].ordem:0)+1}); plSec=sec; renderPalestra(); }

/* ---------- editor do Modelo de Jogo dentro da Palestra ---------- */
function plMontaEditor(on){ const mb=$("m-stage")&&$("m-stage").parentElement, mp=$("m-panel"), g=$("view-l").querySelector(".grid"), gm=$("view-m").querySelector(".grid"); if(!mb||!mp) return;
  if(on){ if(mb.parentElement!==g){ g.insertBefore(mb,$("pl-board")); g.insertBefore(mp,$("pl-board")); } $("pl-board").hidden=true; $("pl-panel").hidden=true; }
  else { if(mb.parentElement!==gm){ gm.insertBefore(mb,$("m-nav").nextSibling); gm.appendChild(mp); } $("pl-board").hidden=false; $("pl-panel").hidden=false; } }
function palEntra(id){ if(mPal===id) return; mPara(); if(mPl){ mPl.pause(); mPl=null; } mPal=id; mEdit=false; mT_=0; mSel=null; mSelS=null; mSelZ=null; mTool="mover"; plMontaEditor(true); }
function palSai(){ if(!mPal) return; mPara(); if(mPl){ mPl.pause(); mPl=null; } mPal=null; mEdit=false; mT_=0; mSel=null; mSelS=null; mSelZ=null; plMontaEditor(false); $("m-stage").innerHTML=""; }
function palSemQuadro(){ plCur=null; palSai(); renderPalestra(); }
function palAbre(id,semRender){ const Q=palestra[id]; if(!Q) return; plSec=Q.sec; plCur=id; guardaPalCur(); if(!semRender) renderPalestra(); }
/* bloco «Quadro» do painel de edição (o resto do painel é o do Modelo de Jogo) */
function painelPalHtml(Q){ const ls=listaPal(Q.sec,Q.jogo), i=ls.findIndex(q=>q.id===mPal);
  return `<h3>Quadro da Palestra</h3>
      <label class="f">Nome<input type="text" id="pq-nome" value="${esc(Q.nome)}"></label>
      <label class="f">Objetivo / descrição (opcional; sai no PDF)<textarea id="pq-desc" rows="3" style="border:1px solid var(--line);border-radius:8px;padding:8px 10px;font:inherit;background:var(--surface);color:var(--ink);resize:vertical">${esc(Q.desc||"")}</textarea></label>
      <div class="seg" id="pq-sec"><button data-k="com" aria-pressed="${Q.sec==="com"}">COM BOLA</button><button data-k="sem" aria-pressed="${Q.sec==="sem"}">SEM BOLA</button></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" id="pq-up" ${i>0?"":"disabled"}>▲ Subir</button><button class="btn sm" id="pq-dn" ${i>=0&&i<ls.length-1?"":"disabled"}>▼ Descer</button><button class="btn sm" id="pq-dup">⧉ Duplicar</button></div>
      <button class="btn danger" id="pq-del">Apagar este quadro</button>`; }
function ligaPainelPal(pn,Q){ const id=mPal, nm=pn.querySelector("#pq-nome"), ds=pn.querySelector("#pq-desc"); if(!nm) return;
  nm.onchange=()=>{ const v=nm.value.trim(); if(v) editaQ(Q=>{ Q.nome=v; }); };
  ds.oninput=()=>{ clearTimeout(plNotaT); const v=ds.value; plNotaT=setTimeout(()=>editaQ(Q=>{ Q.desc=v; },true),500); };
  pn.querySelectorAll("#pq-sec button").forEach(b=>b.onclick=()=>mudaSecPal(id,b.dataset.k));
  pn.querySelector("#pq-up").onclick=()=>movePal(id,-1); pn.querySelector("#pq-dn").onclick=()=>movePal(id,1); pn.querySelector("#pq-dup").onclick=()=>duplicaPal(id);
  confirma2(pn.querySelector("#pq-del"),"Toca outra vez para apagar o quadro",()=>apagaPal(id)); }

/* ---------- nosso onze: sistema tático ---------- */
/* põe as bolinhas no sistema (posições do Modelo de Jogo); cada titular vai para o lugar com a mesma posição ou, senão, o mais perto.
   O lugar no onze (slot) não muda: os lances de bolas paradas e os quadros ficam como estavam */
function aplicaSistemaOnze(sis){ const B=SISTEMAS[sis]; if(!B) return; const J=clone(jogo), P=ONZE_CAMPO, livres=J.onze.map((_,i)=>i), at=new Array(B.length).fill(-1);
  const emu=(x,y)=>({x:Math.round(P[0]+x/105*(P[2]-P[0])),y:Math.round(P[1]+y/68*(P[3]-P[1]))}), tira=i=>livres.splice(livres.indexOf(i),1);
  if(livres.length){ at[0]=0; tira(0); }   // o GR é o primeiro do onze
  B.forEach(([pos],k)=>{ if(at[k]>=0) return; const i=livres.find(i=>J.onze[i].pos===pos); if(i!=null){ at[k]=i; tira(i); } });
  B.forEach(([,x,y],k)=>{ if(at[k]>=0) return; const e=emu(x,y); let best=null, bd=Infinity; livres.forEach(i=>{ const o=J.onze[i], d=(o.x-e.x)**2+(o.y-e.y)**2; if(d<bd){ bd=d; best=i; } }); if(best!=null){ at[k]=best; tira(best); } });
  B.forEach(([pos,x,y],k)=>{ const i=at[k]; if(i<0) return; const e=emu(x,y); Object.assign(J.onze[i],{x:e.x,y:e.y,pos}); });
  pushUndo({tipo:"onze",antes:clone(jogo.onze)}); guardaPalJogo("atual",{...pj(),sis}); guardaJogo(J); toast(`Onze no ${sis} · ↶ Desfazer para voltar`); }

/* ---------- desenho ---------- */
function renderPalestraSeguro(){ const v=$("view-l"); if(!v||v.hidden) return; if(mPal){ renderModeloSeguro(); return; }
  const a=document.activeElement; if(a&&a.closest&&a.closest("#pl-panel")&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)) return; renderPalestra(); }
function renderPalestra(){ const v=$("view-l"); if(!v||v.hidden) return; if(typeof dragging!=="undefined"&&dragging) return;
  if((plSec==="com"||plSec==="sem")&&plCur&&palestra[plCur]&&palestra[plCur].jogo==="atual"){ guardaPalCur(); palEntra(plCur); renderPalNav(); renderModelo(); return; }
  if(plSec==="com"||plSec==="sem") plCur=null;
  palSai(); guardaPalCur(); renderPalNav();
  const st=$("pl-stage"), tit=$("pl-tit"), tag=$("pl-tag"), bar=$("pl-bar"), pn=$("pl-panel"), hint=$("pl-hint"); st.innerHTML=""; hint.textContent=""; tag.hidden=false; tag.className="tag";
  const idx=PL_SECS.findIndex(s=>s[0]===plSec); tit.textContent=PL_SECS[idx][1]; tag.textContent=plSec==="bp"?"BOLAS PARADAS":String(idx+1); tag.style.background=plSec==="bp"?"#1B1A17":"#C00000";
  bar.innerHTML=`<button class="btn sm" id="pl-und" title="Desfazer (Ctrl+Z)">↶ Desfazer</button><button class="btn sm" id="pl-fs" title="Apresentar a Palestra a partir daqui">⛶ Apresentar</button>`;
  $("pl-und").onclick=()=>{ desfazQuadro(); renderPalestra(); }; $("pl-fs").onclick=()=>apresentaPalestra(plSec==="bp"&&plBp?"bp:"+plBp:plSec);
  if(plSec==="onze") palOnze(st,pn,hint);
  else if(plSec==="adv") palAdv(st,pn,hint);
  else if(plSec==="bp") palBp(st,pn,hint,tit,tag);
  else palVazio(st,pn); }
function palOnze(st,pn,hint){ st.appendChild(desenhaOnze({quadro:true})); hint.textContent="Arrasta as bolinhas para mudar a posição · toca numa para trocar o jogador ou a sigla da posição";
  const P=pj(), sis=P.sis;
  pn.innerHTML=`<header><h2>O Nosso Onze Inicial</h2><p class="sub">O onze e os suplentes do jogo (os mesmos do separador Jogo, do Quadro e do Ao vivo).</p></header>
    <div class="add" style="border-top:0">
      <label class="f">Sistema tático<select id="pl-sis"><option value="">— Posições livres —</option>${Object.keys(SISTEMAS).map(k=>`<option${k===sis?" selected":""}>${k}</option>`).join("")}</select></label>
      <p class="sub" style="margin:0">Ao escolher um sistema, as bolinhas vão para as posições dele (cada titular fica no lugar da sua posição ou no mais perto). Depois podes arrastá-las livremente. Os lances de bolas paradas não mudam.</p>
      <label class="f">Notas para a equipa (opcional; saem no PDF)<textarea id="pl-no" rows="4" style="border:1px solid var(--line);border-radius:8px;padding:8px 10px;font:inherit;background:var(--surface);color:var(--ink);resize:vertical">${esc(P.notasOnze)}</textarea></label>
      <button class="btn sm" id="pl-jg" style="align-self:flex-start">Suplentes e ficha do jogo ↗</button>
    </div>`;
  pn.querySelector("#pl-sis").onchange=e=>{ const s_=e.target.value; if(s_) aplicaSistemaOnze(s_); else guardaPalJogo("atual",{...pj(),sis:""}); };
  pn.querySelector("#pl-no").oninput=e=>{ clearTimeout(plNotaT); const v=e.target.value; plNotaT=setTimeout(()=>guardaPalJogo("atual",{...pj(),notasOnze:v}),600); };
  pn.querySelector("#pl-jg").onclick=()=>setTab("j"); }
function palAdv(st,pn,hint){ const A=advJ(), T=eqAdv(), P=pj();
  if(A.onze.length){ st.appendChild(desenhaAdvOnze()); hint.textContent="Arrasta as bolinhas para mudar a posição · toca numa para escolher o jogador do plantel"; }
  else st.innerHTML=`<p class="sub" style="padding:24px 16px;margin:0">${T?"Escolhe o sistema do adversário para pôr o onze provável no campo.":"Escolhe ou cria a equipa adversária no separador Adversário (ou importa o ficheiro da SCA Observação)."}</p>`;
  pn.innerHTML=`<header><h2>Onze Provável do Adversário</h2><p class="sub">${T?esc(T.nome)+" · ":""}O onze, o sistema e as cores do separador Adversário (plantel da equipa reaproveitado entre jogos${T&&T.origem==="observacao"?", importado da SCA Observação":""}).</p></header>
    <div class="add" style="border-top:0">
      ${T?`<div class="fields"><label class="f">Sistema<select id="pl-asis"><option value="">—</option>${Object.keys(SIS_ADV).map(k=>`<option${k===A.sistema?" selected":""}>${k}</option>`).join("")}</select></label>
        <div class="f" style="display:flex;justify-content:flex-end;align-items:flex-end"><button class="btn sm" id="pl-arep" title="Põe as bolinhas no sítio do sistema, com os mesmos jogadores">↺ Repor posições</button></div></div>`:""}
      <label class="f">Informações sobre o adversário (opcional; saem no PDF)<textarea id="pl-na" rows="5" placeholder="Ex.: saída a 3 com o 6 entre centrais; o 9 ataca o 1.º poste nos cantos" style="border:1px solid var(--line);border-radius:8px;padding:8px 10px;font:inherit;background:var(--surface);color:var(--ink);resize:vertical">${esc(P.notasAdv)}</textarea></label>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" id="pl-aimp" title="Ficheiro exportado no plantel base da SCA Observação">⬆ Importar da Observação</button><button class="btn sm" id="pl-aad">Equipa, plantel, cores e suplentes ↗</button></div>
    </div>`;
  if(T){ pn.querySelector("#pl-asis").onchange=e=>{ const s_=e.target.value; if(!s_) return; const N=clone(advJ()); pushUndo({tipo:"advonze",antes:clone(N.onze)}); N.sistema=s_; N.onze=onzeNoSistema(N.onze,s_);
      if(!T.sistema) guardaEquipa({...T,sistema:s_},true); guardaAdvJogo(N); };
    pn.querySelector("#pl-arep").onclick=()=>{ const N=clone(advJ()); if(!N.sistema){ toast("Escolhe primeiro o sistema."); return; } pushUndo({tipo:"advonze",antes:clone(N.onze)}); N.onze=onzeNoSistema(N.onze,N.sistema); guardaAdvJogo(N); }; }
  pn.querySelector("#pl-na").oninput=e=>{ clearTimeout(plNotaT); const v=e.target.value; plNotaT=setTimeout(()=>guardaPalJogo("atual",{...pj(),notasAdv:v}),600); };
  pn.querySelector("#pl-aimp").onclick=()=>$("d-file").click(); pn.querySelector("#pl-aad").onclick=()=>setTab("d"); }
function palBp(st,pn,hint,tit,tag){ const ls=setupsPal(); let L=ls.find(l=>l.id===plBp)||ls[0];
  if(!L){ st.innerHTML=`<p class="sub" style="padding:24px 16px;margin:0">Ainda não há lances de bolas paradas.</p>`; pn.innerHTML=`<header><h2>Bolas Paradas</h2></header>`; return; }
  plBp=L.id; guardaPalCur(); tit.textContent=L.nome; tag.className="tag "+L.tipo; tag.textContent=L.tipo==="DEF"?"DEFENSIVO":"OFENSIVO"; tag.style.background="";
  st.appendChild(desenha(L,{setup:true,clean:true})); hint.textContent="Setup inicial: posições, números, adversários e bola (sem setas, tarefas nem textos)";
  const sg=seguidoresDe(L.id).map(x=>x.nome);
  pn.innerHTML=`<header><h2>${esc(L.nome)}</h2><p class="sub">${L.tipo==="DEF"?"Bola parada defensiva":"Bola parada ofensiva"} · com os jogadores atuais do jogo.</p></header>
    <div class="add" style="border-top:0">${sg.length?`<p class="sub" style="margin:0">Lances com esta posição inicial: <b>${sg.map(esc).join(", ")}</b></p>`:""}
      <p class="sub" style="margin:0">A Palestra mostra o lance como está no separador Bolas Paradas (não é uma cópia). Para ver as setas e as tarefas, ou para editar, abre-o lá.</p>
      <button class="btn sm" id="pl-bq" style="align-self:flex-start">Abrir em Bolas Paradas ↗</button></div>`;
  pn.querySelector("#pl-bq").onclick=()=>{ curId=L.id; setTab("q"); render(); }; }
function palVazio(st,pn){ const sec=plSec, n=listaPal(sec).length;
  st.innerHTML=`<div class="m-vazio"><b>${PL_NOME[sec]}</b><span>${n?"Escolhe um quadro na lista.":`Cada quadro é uma organização, comportamento ou princípio ${sec==="com"?"ofensivo":"defensivo"} da equipa, com passos que andam: crias o passo 1, copias para o passo 2 e arrastas só o que muda.`}</span><button class="btn primary" id="pl-nv2">+ Novo quadro ${PL_NOME[sec]}</button></div>`;
  $("pl-nv2").onclick=()=>folhaNovoPal(sec); pn.innerHTML=`<header><h2>${PL_NOME[sec]}</h2><p class="sub">${n} ${n===1?"quadro":"quadros"} neste jogo.</p></header>`; }
function renderPalNav(){ const nav=$("pl-nav"); if(!nav) return; const T=eqAdv(), A=advJ(), cur=k=>plSec===k&&!plCur;
  const it=(attr,n,nm,sub,ativo)=>`<li><button ${attr} aria-current="${ativo}"><span class="n">${n}</span><span class="m-nm">${esc(nm)}<small>${esc(sub)}</small></span></button></li>`;
  let h=`<button class="newl" id="pl-apr">⛶ Apresentar a Palestra</button><button class="newl" id="pl-pdf">⬇ PDF da Palestra</button>`;
  h+=`<div class="grp"><h3>Onzes</h3><ul>${it('data-s="onze"',1,"O Nosso Onze Inicial",(pj().sis||"posições livres")+" · "+jogo.suplentes.length+" suplentes",cur("onze"))}${it('data-s="adv"',2,"Onze Provável do Adversário",A.onze.length?[(T&&T.nome)||jogo.adversario,A.sistema].filter(Boolean).join(" · "):"por definir",cur("adv"))}</ul></div>`;
  ["com","sem"].forEach((sec,j)=>{ const ls=listaPal(sec);
    h+=`<div class="grp"><h3><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${PL_COR[sec]};margin-right:6px"></i>${3+j} · ${PL_NOME[sec]}</h3><ul>`;
    if(!ls.length) h+=`<li><span class="m-nada">Sem quadros</span></li>`;
    ls.forEach((Q,i)=>{ h+=it(`data-id="${esc(Q.id)}"`,i+1,Q.nome,`${Q.passos.length} ${Q.passos.length===1?"passo":"passos"}${Q.espacos?" · zonas":""}`,plCur===Q.id); });
    h+=`</ul><button class="newl" data-novo="${sec}">+ Novo quadro ${PL_NOME[sec]}</button></div>`; });
  const bp=setupsPal(); h+=`<div class="grp"><h3>Bolas Paradas · setups</h3><ul>`; if(!bp.length) h+=`<li><span class="m-nada">Sem lances</span></li>`;
  bp.forEach((L,i)=>{ h+=it(`data-bp="${esc(L.id)}"`,i+1,L.nome,L.tipo==="DEF"?"Defensivo":"Ofensivo",plSec==="bp"&&plBp===L.id); }); h+=`</ul></div>`;
  nav.innerHTML=h;
  $("pl-apr").onclick=()=>apresentaPalestra(); $("pl-pdf").onclick=e=>pdfPalestra(e.currentTarget);
  nav.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{ plSec=b.dataset.s; plCur=null; renderPalestra(); });
  nav.querySelectorAll("[data-id]").forEach(b=>{ b.onclick=()=>{ if(b.dataset.id===mPal) return; palAbre(b.dataset.id); };
    b.oncontextmenu=e=>{ const Q=palestra[b.dataset.id]; if(Q) menuContexto(e,[["⧉ Duplicar",()=>duplicaPal(Q.id)],[`🗑 Apagar quadro «${Q.nome}»`,()=>apagaPal(Q.id),"perigo"]]); }; });
  nav.querySelectorAll("[data-novo]").forEach(b=>b.onclick=()=>folhaNovoPal(b.dataset.novo));
  nav.querySelectorAll("[data-bp]").forEach(b=>b.onclick=()=>{ plSec="bp"; plBp=b.dataset.bp; plCur=null; renderPalestra(); }); }
function folhaNovoPal(sec){ let sis="onze", sisAdv=advJogoOk()?"jogo":"4-4-2", esp=sec==="com";
  const advOps=[...(advJogoOk()?[["jogo","Onze provável do adversário"]]:[]),["","Sem"],...Object.keys(SISTEMAS).map(s=>[s,s])];
  folha(`<h3>Novo quadro · ${PL_NOME[sec]}</h3>
    <label class="f">Nome do quadro<input type="text" id="pn-n" placeholder="${sec==="com"?"Ex.: Construção a três · saída de pressão":"Ex.: Pressão alta · fecho do corredor central"}"></label>
    <label class="f">Objetivo / descrição (opcional)<textarea id="pn-d" rows="2" style="border:1px solid var(--line);border-radius:8px;padding:8px 10px;font:inherit;background:var(--surface);color:var(--ink)"></textarea></label>
    <h4>Equipa SCA</h4><div class="seg" id="pn-y">${SIS_NOS.map(([k,n])=>`<button data-k="${k}">${n}</button>`).join("")}</div>
    <h4>Adversário</h4><div class="seg" id="pn-a">${advOps.map(([k,n])=>`<button data-k="${k}">${n}</button>`).join("")}</div>
    <label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="pn-z" ${esp?"checked":""} style="width:20px;height:20px"> Zonas automáticas (Construção, Ligação, Criação, Largura, Profundidade pelas linhas do adversário)</label>
    <p class="sub" style="margin:0">O quadro começa com o passo 1. Em <b>✎ Editar</b> crias os passos seguintes e arrastas só os jogadores que se mexem; a animação liga cada passo ao seguinte.</p>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="pn-ok">Criar quadro</button></div>`,(s,fecha)=>{
    const pinta=()=>{ s.querySelectorAll("#pn-y button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===sis))); s.querySelectorAll("#pn-a button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===sisAdv))); };
    s.querySelectorAll("#pn-y button").forEach(b=>b.onclick=()=>{ sis=b.dataset.k; pinta(); }); s.querySelectorAll("#pn-a button").forEach(b=>b.onclick=()=>{ sisAdv=b.dataset.k; pinta(); }); pinta();
    s.querySelector("#pn-ok").onclick=()=>{ const nm=s.querySelector("#pn-n").value.trim()||`${PL_NOME[sec]} ${listaPal(sec).length+1}`;
      const id=criaPal(sec,{nome:nm,desc:s.querySelector("#pn-d").value.trim(),sis,sisAdv,espacos:s.querySelector("#pn-z").checked&&!!sisAdv}); fecha();
      plSec=sec; plCur=id; mT_=0; renderPalestra(); mEdit=true; mTool="mover"; renderModelo(); toast("Quadro criado · arrasta os jogadores para o passo 1"); }; }); }

/* ---------- apresentar: a Palestra inteira, pela ordem, com os passos dos quadros ---------- */
function slidesPalestra(){ const S=[{k:"onze",tit:"O Nosso Onze Inicial"}]; if(advJ().onze.length) S.push({k:"adv",tit:"Onze Provável do Adversário"});
  ["com","sem"].forEach(sec=>listaPal(sec).forEach(Q=>S.push({k:"pl:"+Q.id,tit:PL_NOME[sec]+" · "+Q.nome,id:Q.id})));
  setupsPal().forEach(L=>S.push({k:"bp:"+L.id,tit:"Bola parada · "+L.nome,L:L.id})); return S; }
/* v123.1 (pedido do Rodrigo): na apresentação as peças mexem-se com o rato ou o dedo, mas nada se grava — é só para explicar.
   Mudar de slide, «↺ Repor» ou fechar volta ao que está gravado. Nos quadros mexe-se no passo que está à vista (uma cópia do quadro). */
function apresentaPalestra(k0){ const S=slidesPalestra(); mPara(); if(mApr) mApr.fecha(); let i=Math.max(0,S.findIndex(s=>s.k===(k0||(plCur?"pl:"+plCur:plSec==="bp"&&plBp?"bp:"+plBp:plSec)))), pl=null; tintaInicio();
  const root=document.createElement("div"); root.className="present"; root.setAttribute("role","dialog"); root.setAttribute("aria-label","Apresentação da Palestra");
  root.innerHTML=`<div class="pstage"></div><div class="pbar"><button id="pa-a">‹ Anterior</button><span id="pa-ps" style="display:contents"><button id="pa-ini" aria-label="Voltar ao passo 1">⏮</button><button id="pa-pa" aria-label="Passo anterior">‹ Passo</button><button id="pa-pl" style="min-width:120px">▶ Animar</button><button id="pa-pn" aria-label="Passo seguinte">Passo ›</button></span><div class="t"></div><button id="pa-rp" title="Voltar às posições gravadas (o que mexeres aqui não fica gravado)">↺ Repor</button><button id="pa-b">Seguinte ›</button><button id="pa-x">Fechar</button></div>`;
  document.body.appendChild(root); const st=root.querySelector(".pstage"), tt=root.querySelector(".t"), bp=root.querySelector("#pa-pl"), ps=root.querySelector("#pa-ps");
  let tmpQ=null, arr=null, semClique=false;
  const Qs=()=>{ const s=S[i]; return s.id&&palestra[s.id]?(tmpQ||palQ(s.id)):null; };
  const estado=()=>{ const Q=Qs(); ps.hidden=!Q; ps.style.display=Q?"contents":"none"; bp.textContent=pl&&pl.playing?"⏸ Pausa":"▶ Animar";
    tt.textContent=`${i+1}/${S.length} · ${S[i].tit}${Q?` · passo ${passoVisivel(Q,pl?pl.t:0)+1}/${Q.passos.length}`:""}`; };
  const mostra=()=>{ if(pl){ pl.pause(); pl=null; } st.innerHTML=""; arr=null; tmpQ=null; const s=S[i], Q=Qs(); let svg;
    if(Q){ tmpQ=clone(Q); pl=playerModelo(tmpQ,{ed:()=>({edit:false}),onT:estado,onEnd:estado}); svg=pl.svg; }   // ed sem edição: as peças ficam tocáveis (data-p), sem pegas
    else if(s.k==="onze") svg=desenhaOnze({clean:true,quadro:true});
    else if(s.k==="adv") svg=desenhaAdvOnze().cloneNode(true);   // cópia sem eventos: na apresentação não se mexe no onze
    else { const L=lances().find(l=>l.id===s.L); svg=L?desenha(L,{setup:true,clean:true}):document.createElementNS(NS,"svg"); }
    st.appendChild(svg); tintaLiga(root,svg,"l:"+s.k); estado(); };
  const anda=d=>{ i=(i+d+S.length)%S.length; mostra(); };
  const animar=()=>{ if(!pl) return; const Q=Qs(); if(pl.playing) pl.pause(); else pl.play(pl.t>=Q.passos.length-1-1e-6?0:pl.t); estado(); };
  const passoSeg=()=>{ const Q=Qs(); if(!pl||!Q) return false; if(pl.playing) pl.pause(); const k=Math.floor(pl.t+1e-6); if(k>=Q.passos.length-1) return false; pl.anda(k+1); estado(); return true; };
  const passoAnt=()=>{ const Q=Qs(); if(!pl||!Q) return false; if(pl.playing) pl.pause(); const r=Math.round(pl.t), k=Math.abs(pl.t-r)<1e-6?r-1:Math.floor(pl.t); if(k<0) return false; pl.set(k); estado(); return true; };
  const kd=e=>{ if($("sheet-root").innerHTML) return; if(e.key==="Escape") fecha(); else if(e.key==="ArrowRight"){ e.preventDefault(); if(!passoSeg()) anda(1); } else if(e.key==="ArrowLeft"){ e.preventDefault(); if(!passoAnt()) anda(-1); } else if(e.key===" "){ e.preventDefault(); animar(); } };
  const fecha=()=>{ if(pl) pl.pause(); root.remove(); document.removeEventListener("keydown",kd,true); mApr=null; };
  document.addEventListener("keydown",kd,true);
  root.querySelector("#pa-a").onclick=()=>anda(-1); root.querySelector("#pa-b").onclick=()=>anda(1); root.querySelector("#pa-x").onclick=fecha;
  root.querySelector("#pa-ini").onclick=()=>{ if(!pl) return; pl.pause(); pl.set(0); estado(); }; bp.onclick=animar;
  root.querySelector("#pa-pn").onclick=()=>passoSeg(); root.querySelector("#pa-pa").onclick=()=>passoAnt();
  root.querySelector("#pa-rp").onclick=()=>{ const k=pl?Math.round(pl.t):0; mostra(); if(pl&&k){ pl.set(k); estado(); } };
  /* mexer nas peças sem gravar: quadros pelo passo à vista (metros, vistaQ); onzes e setups pelas bolinhas do desenho (translate) */
  st.style.touchAction="none";
  st.addEventListener("pointerdown",e=>{ if(e.button>0) return; const svg=st.querySelector("svg"); if(!svg) return;
    if(pl&&tmpQ){ const a=e.target.closest&&e.target.closest("[data-p]"); if(!a) return; if(pl.playing) pl.pause(); const k=Math.round(pl.t); pl.set(k); estado();
      const V=vistaQ(tmpQ), p=svgPt(pl.svg,e), m=V.M(p.x,p.y), P=tmpQ.passos[k].pos[a.dataset.p]||{x:52.5,y:34}; arr={q:true,id:a.dataset.p,k,dx:P.x-m.x,dy:P.y-m.y,mx:e.clientX,my:e.clientY,mov:false}; }
    else { const g=e.target.closest&&e.target.closest("g.bola"); if(!g||!svg.contains(g)) return; const p=svgPt(svg,e), t=g.__t||{x:0,y:0}; arr={g,svg,x0:p.x-t.x,y0:p.y-t.y,mx:e.clientX,my:e.clientY,mov:false}; }
    e.preventDefault(); try{ st.setPointerCapture(e.pointerId); }catch(_){} });
  st.addEventListener("pointermove",e=>{ if(!arr) return; e.preventDefault(); if(!arr.mov&&Math.hypot(e.clientX-arr.mx,e.clientY-arr.my)<4) return; arr.mov=true;
    if(arr.q){ const V=vistaQ(tmpQ), p=svgPt(pl.svg,e), m=V.M(p.x,p.y); tmpQ.passos[arr.k].pos[arr.id]={x:mClamp(m.x+arr.dx,-3,108),y:mClamp(m.y+arr.dy,-2,70)}; pl.set(arr.k); }
    else { const p=svgPt(arr.svg,e), t={x:p.x-arr.x0,y:p.y-arr.y0}; arr.g.__t=t; arr.g.setAttribute("transform",`translate(${t.x} ${t.y})`); } });
  const largar=e=>{ if(!arr) return; if(arr.mov) semClique=true; arr=null; try{ st.releasePointerCapture(e.pointerId); }catch(_){} };
  st.addEventListener("pointerup",largar); st.addEventListener("pointercancel",largar);
  /* iPad: deslizar muda de slide; um toque num quadro anima ou pausa */
  let x0=null; st.addEventListener("touchstart",e=>{ x0=arr?null:e.touches[0].clientX; },{passive:true});   // a arrastar uma peça não muda de slide
  st.addEventListener("touchend",e=>{ if(x0===null) return; const dx=e.changedTouches[0].clientX-x0; x0=null; if(Math.abs(dx)>50){ anda(dx<0?1:-1); e.preventDefault(); } });
  st.addEventListener("click",()=>{ if(semClique){ semClique=false; return; } animar(); });
  mApr={fecha}; mostra(); }

/* ---------- PDF: identificação, onzes, COM BOLA, SEM BOLA (passos lado a lado) e setups das bolas paradas ---------- */
const PL_PDF={W:841.89,H:595.28,M:28,top:66,bot:30};
function plImgModelo(Q,k){ const cv=document.createElement("canvas"); cv.width=1600; cv.height=900; pintaModeloCanvas(cv.getContext("2d"),Q,k,1600,900); return cv.toDataURL("image/jpeg",.9); }
/* grelha dos passos: até 4 por página (1, 1×2 ou 2×2); mais de 4 continuam na página seguinte com «(continuação)» */
function plGrelha(n){ return n<=1?[1,1]:n===2?[2,1]:[2,2]; }
async function pdfPalestra(btn){ if(btn&&btn.disabled) return; if(btn) btn.disabled=true;
  try{ toast("A preparar o PDF da Palestra…"); await preCarregaPdf(); const css=await cssFontes(); try{ await document.fonts.ready; }catch(e){} await mCarregaImgs();
    const {W:PW,H:PH,M}=PL_PDF, doc=new window.jspdf.jsPDF({orientation:"landscape",unit:"pt",format:"a4",compress:true}); let pag=0;
    const txt=(t,x,y,o={})=>{ doc.setFont("helvetica",o.b?"bold":"normal"); doc.setFontSize(o.fs||10); const c=o.c||[27,26,23]; doc.setTextColor(c[0],c[1],c[2]); doc.text(String(t),x,y,o.al?{align:o.al}:undefined); };
    const linhas=(t,w,fs)=>{ doc.setFont("helvetica","normal"); doc.setFontSize(fs); return doc.splitTextToSize(String(t||""),w); };
    const nova=(sec,tit,cor)=>{ if(pag) doc.addPage("a4","landscape"); pag++; doc.setFillColor(192,0,0); doc.rect(0,0,PW,5,"F");
      txt("SCA PERFORMANCE · PALESTRA",M,22,{b:true,fs:8,c:[127,127,127]}); txt(idJogoTxt(),PW-M,22,{b:true,fs:8,c:[127,127,127],al:"right"});
      txt(sec,M,46,{b:true,fs:17,c:cor||[192,0,0]}); if(tit){ doc.setFont("helvetica","bold"); doc.setFontSize(17); txt(tit,M+doc.getTextWidth(sec)+12,46,{b:true,fs:17}); }
      doc.setDrawColor(201,178,107); doc.setLineWidth(1.4); doc.line(M,54,PW-M,54); };
    const imgSvg=async svg=>await svgParaJpeg(svg,css,2000);
    /* 1 · identificação do jogo */
    nova("Palestra",""); const A=advJ(), T=eqAdv();
    txt("SC Angrense",M,140,{b:true,fs:30}); txt("vs "+(jogo.adversario||"adversário por definir"),M,178,{b:true,fs:30,c:[192,0,0]});
    const comp=(typeof COMPS!=="undefined"&&COMPS[jogo.comp]&&COMPS[jogo.comp].nome)||"";
    [["Data",[jogo.data?dataPt(jogo.data):"",jogo.hora].filter(Boolean).join(" · ")],["Competição",[comp,jogo.jornada?"Jornada "+jogo.jornada:""].filter(Boolean).join(" · ")],["Local",[jogo.local,jogo.casa==="fora"?"fora":"em casa"].filter(Boolean).join(" · ")]].forEach(([k,v],j)=>{ if(!v) return; txt(k.toUpperCase(),M,226+j*34,{b:true,fs:8,c:[127,127,127]}); txt(v,M,240+j*34,{b:true,fs:13}); });
    const com=listaPal("com"), sem=listaPal("sem"), bp=setupsPal();
    const indice=[["1","O Nosso Onze Inicial",pj().sis||""],["2","Onze Provável do Adversário",A.onze.length?[(T&&T.nome)||"",A.sistema].filter(Boolean).join(" · "):"por definir"],["3","COM BOLA",com.length+" "+(com.length===1?"quadro":"quadros")],["4","SEM BOLA",sem.length+" "+(sem.length===1?"quadro":"quadros")],["5","Bolas Paradas",bp.length+" setups"]];
    txt("CONTEÚDO",PW/2+20,140,{b:true,fs:8,c:[127,127,127]}); indice.forEach(([n,nm,sub],j)=>{ const y=166+j*36; txt(n,PW/2+20,y,{b:true,fs:16,c:[192,0,0]}); txt(nm,PW/2+46,y,{b:true,fs:14}); if(sub) txt(sub,PW/2+46,y+14,{fs:9,c:[85,82,75]}); });
    /* 2 · onzes (com as notas ao lado, se houver) */
    const pgOnze=async(sec,svg,notas)=>{ nova(sec,""); const img=await imgSvg(svg), dispH=PH-PL_PDF.top-PL_PDF.bot; let w=Math.min(PW-2*M,dispH*4/3), x=M;
      if(notas&&notas.trim()){ w=Math.min(540,dispH*4/3); const ls=linhas(notas,PW-3*M-w,10.5); txt("NOTAS",M*2+w,PL_PDF.top+12,{b:true,fs:8,c:[192,0,0]}); doc.setFont("helvetica","normal"); doc.setFontSize(10.5); doc.setTextColor(27,26,23); doc.text(ls.slice(0,40),M*2+w,PL_PDF.top+28); }
      else x=(PW-w)/2; doc.addImage(img,"JPEG",x,PL_PDF.top,w,w*.75,undefined,"FAST"); };
    await pgOnze("O Nosso Onze Inicial",desenhaOnze({clean:true,quadro:true}),pj().notasOnze);
    if(A.onze.length) await pgOnze("Onze Provável do Adversário",desenhaAdvOnze(),pj().notasAdv);
    else { nova("Onze Provável do Adversário",""); txt("Sem onze provável definido no separador Adversário.",M,PL_PDF.top+20,{fs:11,c:[85,82,75]}); if(pj().notasAdv) doc.text(linhas(pj().notasAdv,PW-2*M,10.5),M,PL_PDF.top+44); }
    /* 3 e 4 · quadros: os passos lado a lado, sem cortar; até 4 por página */
    for(const [sec,ls] of [["com",com],["sem",sem]]) for(const Q0 of ls){ const Q=palQ(Q0.id), n=Q.passos.length, partes=Math.ceil(n/4);
      for(let pt=0;pt<partes;pt++){ const ks=[...Array(Math.min(4,n-pt*4))].map((_,j)=>pt*4+j); nova(PL_NOME[sec]+" ·",Q.nome+(partes>1?` (${pt+1}/${partes}${pt?", continuação":""})`:""),sec==="sem"?[31,95,191]:[192,0,0]);
        let y0=PL_PDF.top; if(Q.desc&&!pt){ const ls2=linhas(Q.desc,PW-2*M,10).slice(0,2); doc.setTextColor(85,82,75); doc.text(ls2,M,y0+6); y0+=8+ls2.length*13; }
        const [cols,rows]=plGrelha(ks.length), gap=12, cap=14, cw=(PW-2*M-gap*(cols-1))/cols, ch=(PH-y0-PL_PDF.bot-gap*(rows-1))/rows-cap, w=Math.min(cw,ch*16/9), h=w*9/16, x0=(PW-(w*cols+gap*(cols-1)))/2;
        ks.forEach((k,j)=>{ const c=j%cols, r=Math.floor(j/cols), x=x0+c*(w+gap), y=y0+r*(h+cap+gap); doc.addImage(plImgModelo(Q,k),"JPEG",x,y,w,h,undefined,"FAST");
          doc.setDrawColor(208,204,195); doc.setLineWidth(.6); doc.rect(x,y,w,h); const nota=String(Q.passos[k].nota||"").split("\n")[0];
          txt(`Passo ${k+1}${n>1?" de "+n:""}`,x,y+h+10,{b:true,fs:9,c:[192,0,0]}); if(nota){ doc.setFont("helvetica","bold"); doc.setFontSize(9); const off=doc.getTextWidth(`Passo ${k+1}${n>1?" de "+n:""}`)+8, t=linhas(nota,w-off,8.5)[0]; txt(t,x+off,y+h+10,{fs:8.5,c:[85,82,75]}); } }); } }
    /* 5 · bolas paradas: setups iniciais, 2 por página */
    for(let j=0;j<bp.length;j+=2){ nova("Bolas Paradas ·","setups iniciais",[27,26,23]); const par=bp.slice(j,j+2), gap=16, w=(PW-2*M-gap)/2, h=w*.75, y=PL_PDF.top+18;
      for(let q=0;q<par.length;q++){ const L=par[q], x=M+q*(w+gap); txt((L.tipo==="DEF"?"DEFENSIVO · ":"OFENSIVO · ")+L.nome,x,y-6,{b:true,fs:11,c:L.tipo==="DEF"?[31,95,191]:[192,0,0]});
        doc.addImage(await imgSvg(desenha(L,{setup:true,clean:true})),"JPEG",x,y,w,h,undefined,"FAST"); doc.setDrawColor(208,204,195); doc.rect(x,y,w,h); } }
    /* rodapé com a numeração */
    const N=doc.getNumberOfPages(); for(let p=1;p<=N;p++){ doc.setPage(p); txt("SC Angrense · Palestra"+(jogo.adversario?" vs "+jogo.adversario:""),M,PH-14,{fs:8,c:[127,127,127]}); txt(`Página ${p} de ${N}`,PW-M,PH-14,{b:true,fs:8,c:[127,127,127],al:"right"}); }
    const nomeF=`SCA_Palestra_${(jogo.adversario||"jogo").replace(/[^\wÀ-ÿ-]+/g,"_")}_${jogo.data||new Date().toISOString().slice(0,10)}.pdf`, buf=doc.output("arraybuffer");
    let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
    if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([buf],{type:"application/pdf"})); a.download=nomeF; document.body.appendChild(a); a.click(); a.remove(); }
    else await dl.save({filename:nomeF,data:new Uint8Array(buf)});
    toast(`PDF da Palestra guardado · ${N} páginas`);
  }catch(err){ if(err?.code!=="declined") toast(err?.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet e tenta de novo.":"Não foi possível gerar o PDF ("+(err?.code||err?.message||"erro")+")."); }
  finally{ if(btn) btn.disabled=false; } }

/* ---------- sincronização ---------- */
function ligaPalestraDb(){ if(!db) return;
  db.collection("palestra").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
    q.docs.forEach(d=>{ const x=lerDoc(d); if(x){ const c={...x}; delete c.atualizadoEm; try{ m[d.id]=normPal(c,d.id); }catch(e){} } });
    mergeCol("palestra/",m,palestra); if(JSON.stringify(m)!==JSON.stringify(palestra)){ palestra=m; guardaPalLocal();
      if(mPal&&!palestra[mPal]) palSemQuadro(); else if(!mDrag&&!(mPl&&mPl.playing)) renderPalestraSeguro(); } },()=>{});
  db.collection("palestraJogo").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
    q.docs.forEach(d=>{ const x=lerDoc(d); if(x) m[d.id]=normPalJogo(x); });
    mergeCol("palestraJogo/",m,palJogo); if(JSON.stringify(m)!==JSON.stringify(palJogo)){ palJogo=m; guardaPalLocal(); renderPalestraSeguro(); } },()=>{}); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaPalestraDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();
/* ao abrir: o Quadro não começa num quadro escondido (o Onze Titular passou para a Palestra) */
try{ corrigeLanceQuadro(); }catch(e){}
