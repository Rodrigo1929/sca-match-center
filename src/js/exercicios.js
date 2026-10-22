
/* ================= EXERCÍCIOS · repositório para as Unidades de Treino ================= */
const PARTES=[["inicial","Parte inicial","#B8963F"],["fundamental","Parte fundamental","#C00000"],["final","Parte final","#1F3A5F"]];
const MOM_EX=[["of","Org. ofensiva"],["def","Org. defensiva"],["tda","Transição defesa → ataque"],["tad","Transição ataque → defesa"],["bpof","Bola parada ofensiva"],["bpdef","Bola parada defensiva"]];
const TIPOS_EX=[["ativacao","Ativação"],["rondo","Rondo"],["mpb","MPB / posse"],["reduzido","Jogo reduzido"],["estrategico","Estratégico"],["bolaparada","Bola parada"],["finalizacao","Finalização"],["fisico","Físico / core"],["gr","Guarda-redes"]];
const X_LS="sca-exercicios-v1";
const parteDe=k=>PARTES.find(p=>p[0]===k)||PARTES[1];
const rotuloDe=(L,k)=>(L.find(x=>x[0]===k)||[0,""])[1];

let exercicios={}; try{ exercicios=JSON.parse(localStorage.getItem(X_LS)||"{}")||{}; }catch(e){ exercicios={}; }
let xCur=null, xPl=null, xFiltro={q:"",mom:"",tipo:""};
try{ xCur=localStorage.getItem("sca-ex-cur")||null; const f=JSON.parse(localStorage.getItem("sca-ex-filtro")||"null"); if(f) xFiltro={...xFiltro,...f}; }catch(e){}
const xId=()=>"x"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);

function normEx(d){ const s=v=>String(v??"").trim(), L=v=>(Array.isArray(v)?v.map(s):s(v).split(/\n/).map(x=>x.trim())).filter(Boolean), n=v=>{ const x=Math.round(+v); return isFinite(x)&&x>0?x:0; };
  const D=d.duracao||{}, momento=MOM_EX.some(m=>m[0]===d.momento)?d.momento:"";
  const E={id:s(d.id)||xId(), nome:s(d.nome)||"Sem nome", parte:PARTES.some(p=>p[0]===d.parte)?d.parte:"fundamental", momento,
    sub:MOMENTOS.some(m=>m[0]===momento)&&momDe(momento)[3].some(x=>x[0]===d.sub)?d.sub:"", tipo:TIPOS_EX.some(t=>t[0]===d.tipo)?d.tipo:"",
    formato:s(d.formato), espaco:{txt:s(d.espaco&&d.espaco.txt)},
    duracao:{series:n(D.series),pratica:n(D.pratica),pausa:n(D.pausa),total:n(D.total)||null},
    objetivos:s(d.objetivos), comportamentos:L(d.comportamentos), condicionantes:L(d.condicionantes), descricao:s(d.descricao), variantes:L(d.variantes), material:L(d.material),
    ligacoes:{modelo:L(d.ligacoes&&d.ligacoes.modelo), lances:L(d.ligacoes&&d.ligacoes.lances)},
    criadoPor:s(d.criadoPor), criadoEm:s(d.criadoEm), alteradoPor:s(d.alteradoPor), alteradoEm:s(d.alteradoEm)};
  if(d.figura&&typeof d.figura==="object"&&d.figura.quadro&&typeof d.figura.quadro==="object") E.figura={quadro:d.figura.quadro};
  return E; }
Object.keys(exercicios).forEach(id=>{ try{ exercicios[id]=normEx({...exercicios[id],id}); }catch(e){ delete exercicios[id]; } });

/* ---------- tempos: "3'", "1'30", "1,30" (= 1'30), "30 s", "8'M" ---------- */
function lerDur(t){ t=String(t??"").trim().toLowerCase().replace(/\s+/g,"").replace(/[´’`]/g,"'").replace(/'m$/,"'"); if(!t) return 0;
  let m=t.match(/^(\d+)[:',.](\d{1,2})(?:s|seg)?$/); if(m) return (+m[1])*60+(+m[2]);
  m=t.match(/^(\d+)(?:s|seg|segs|segundos)$/); if(m) return +m[1];
  m=t.match(/^(\d+)(?:'|m|min|minutos)?$/); if(m) return (+m[1])*60;
  return NaN; }
function fmtTempo(s){ if(!s) return "–"; if(s<60) return s+" s"; const m=Math.floor(s/60), r=s%60; return r?`${m}'${String(r).padStart(2,"0")}`:`${m}'`; }
function contaDur(D){ return D.series&&D.pratica?D.series*D.pratica+Math.max(0,D.series-1)*D.pausa:D.pratica||0; }
function totalEx(E){ return E.duracao.total||contaDur(E.duracao); }

/* ---------- gravação (um documento por exercício, pela fila pendentes) ---------- */
function guardaExLocal(){ try{ localStorage.setItem(X_LS,JSON.stringify(exercicios)); }catch(e){} }
function guardaEx(E,semRender){ const N=normEx({...E,alteradoPor:meuId||E.alteradoPor||"",alteradoEm:new Date().toISOString()}); exercicios[N.id]=N; guardaExLocal(); gravaDoc("exercicios/"+N.id,N); if(!semRender) renderEx(); return N; }
function apagaEx(id){ const E=exercicios[id]; if(!E) return; const antes=clone(E); delete exercicios[id]; guardaExLocal(); apagaDoc("exercicios/"+id); if(xCur===id) xCur=null; renderEx();
  toast(`Exercício “${E.nome}” apagado`,()=>{ exercicios[id]=antes; guardaExLocal(); gravaDoc("exercicios/"+id,antes); xCur=id; renderEx(); }); }
function duplicaEx(id){ const E=exercicios[id]; if(!E) return; const N=guardaEx({...clone(E),id:xId(),nome:E.nome+" (cópia)",criadoPor:meuId||"",criadoEm:new Date().toISOString()},true); xCur=N.id; renderEx(); toast("Exercício duplicado"); }
function repoeExercicios(X){ Object.keys(exercicios).forEach(id=>{ if(!X[id]) apagaDoc("exercicios/"+id); }); exercicios={};
  Object.entries(X||{}).forEach(([id,E])=>{ exercicios[id]=normEx({...E,id}); gravaDoc("exercicios/"+id,exercicios[id]); }); guardaExLocal(); renderEx(); }

/* ---------- figura: desenhada com o editor do Modelo de Jogo (id "fx:<id>") ---------- */
function temFigura(E){ return !!(E&&E.figura&&E.figura.quadro); }
function cabFigura(E){ return `${parteDe(E.parte)[1]}${E.formato?" · "+E.formato:""} – `; }
/* figura nova: só bolinhas (sem números nem posições), sem onze; fig = sem painel do passo */
function figuraQ(id){ const E=exercicios[id]; if(!E) return null; return normQ({...(temFigura(E)?E.figura.quadro:{rot:"nada",auto:true,sis:"",pecas:[]}),id:"fx:"+id,nome:E.nome,cab:cabFigura(E),fig:true}); }
function guardaFigura(id,Q){ const E=exercicios[id]; if(!E) return; const q=clone(Q); delete q.id; delete q.nome; delete q.cab; delete q.fig; guardaEx({...clone(E),figura:{quadro:q}},true); }
function xPara(){ if(xPl&&xPl.playing) xPl.pause(); }

/* ---------- lista, pesquisa e filtros ---------- */
function exFiltrados(){ const q=xFiltro.q.trim().toLowerCase();
  return Object.values(exercicios).filter(E=>(!xFiltro.mom||E.momento===xFiltro.mom)&&(!xFiltro.tipo||E.tipo===xFiltro.tipo)
    &&(!q||[E.nome,E.formato,E.espaco.txt,E.descricao,E.objetivos,rotuloDe(TIPOS_EX,E.tipo),rotuloDe(MOM_EX,E.momento),...E.comportamentos,...E.variantes,...E.material].join(" ").toLowerCase().includes(q)))
    .sort((a,b)=>a.nome.localeCompare(b.nome,"pt")); }
function guardaFiltro(){ try{ localStorage.setItem("sca-ex-filtro",JSON.stringify(xFiltro)); }catch(e){} }
function renderExFiltros(){ const bx=$("x-filtros"); if($("x-q")) return;
  bx.innerHTML=`<input type="search" id="x-q" placeholder="Pesquisar exercícios…" aria-label="Pesquisar exercícios">
    <select id="x-fm" aria-label="Momento do jogo"><option value="">Todos os momentos</option>${MOM_EX.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join("")}</select>
    <select id="x-ft" aria-label="Tipo de exercício"><option value="">Todos os tipos</option>${TIPOS_EX.map(t=>`<option value="${t[0]}">${t[1]}</option>`).join("")}</select>
    <span class="sub" id="x-n"></span><button class="btn primary" id="x-novo">+ Novo exercício</button>`;
  const q=$("x-q"), fm=$("x-fm"), ft=$("x-ft"); q.value=xFiltro.q; fm.value=xFiltro.mom; ft.value=xFiltro.tipo;
  q.oninput=()=>{ xFiltro.q=q.value; guardaFiltro(); renderExNav(exFiltrados(),exercicios[xCur]); };
  fm.onchange=()=>{ xFiltro.mom=fm.value; guardaFiltro(); renderEx(); }; ft.onchange=()=>{ xFiltro.tipo=ft.value; guardaFiltro(); renderEx(); };
  $("x-novo").onclick=()=>folhaEx(null); }
function renderExNav(ls,E){ const nav=$("x-nav"), tot=Object.keys(exercicios).length;
  $("x-n").textContent=tot?(ls.length===tot?`${tot} ${tot===1?"exercício":"exercícios"}`:`${ls.length} de ${tot}`):"";
  let h=""; PARTES.forEach(([pk,pn,cor])=>{ const q=ls.filter(x=>x.parte===pk); h+=`<div class="grp"><h3><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cor};margin-right:6px"></i>${pn}</h3><ul>`;
    if(!q.length) h+=`<li><span class="m-nada">${tot?"Nenhum com estes filtros":"Sem exercícios"}</span></li>`;
    q.forEach((x,i)=>{ const t=totalEx(x); h+=`<li><button data-id="${esc(x.id)}" aria-current="${!!E&&x.id===E.id}"><span class="n">${i+1}</span><span class="m-nm">${esc(x.nome)}<small>${esc([rotuloDe(TIPOS_EX,x.tipo),x.formato,t?fmtTempo(t):""].filter(Boolean).join(" · "))}</small></span></button></li>`; });
    h+=`</ul></div>`; });
  nav.innerHTML=h;
  nav.querySelectorAll("button[data-id]").forEach(b=>{ b.onclick=()=>{ xCur=b.dataset.id; renderEx(); };
    b.oncontextmenu=e=>{ const X=exercicios[b.dataset.id]; if(X) menuContexto(e,[["⧉ Duplicar",()=>duplicaEx(X.id)],[`🗑 Apagar “${X.nome}”`,()=>apagaEx(X.id),"perigo"]]); }; }); }

/* ---------- ecrã ---------- */
function renderEx(){ const v=$("view-x"); if(!v||v.hidden) return; renderExFiltros();
  const ls=exFiltrados(); let E=exercicios[xCur]||null; if(!E){ E=ls[0]||Object.values(exercicios)[0]||null; xCur=E?E.id:null; }
  try{ localStorage.setItem("sca-ex-cur",xCur||""); }catch(e){}
  renderExNav(ls,E); renderExFicha(E); renderExFigura(E); renderExPainel(E); }
function abreEx(id){ if(exercicios[id]) xCur=id; renderEx(); }
const linhasHtml=(a,ord)=>a.length?`<${ord?"ol":"ul"}>${a.map(x=>`<li>${esc(x)}</li>`).join("")}</${ord?"ol":"ul"}>`:"";
function renderExFicha(E){ const bx=$("x-ficha"), bar=$("x-bar"), tg=$("x-tag");
  if(!E){ $("x-tit").textContent="Exercícios"; tg.hidden=true; bar.innerHTML="";
    bx.innerHTML=`<div class="m-vazio"><b>Ainda não há exercícios no repositório.</b><span>Cada exercício tem a ficha da Unidade de Treino: espaço, duração, objetivos, descrição, variantes e figura. Mais tarde, as UT vão buscar os exercícios aqui.</span><button class="btn primary" id="x-novo2">+ Criar o primeiro exercício</button></div>`;
    $("x-novo2").onclick=()=>folhaEx(null); return; }
  const P=parteDe(E.parte), D=E.duracao, tot=totalEx(E), tit=E.nome+(E.formato&&!E.nome.includes(E.formato)?" – "+E.formato:"");
  $("x-tit").textContent=E.nome; tg.hidden=false; tg.textContent=P[1].toUpperCase(); tg.style.background=P[2];
  bar.innerHTML=`<button class="btn sm" id="x-ed">✎ Editar ficha</button><button class="btn sm" id="x-fig">✎ ${temFigura(E)?"Editar":"Desenhar"} figura</button><button class="btn sm" id="x-dup">⧉ Duplicar</button>`;
  $("x-ed").onclick=()=>folhaEx(E.id); $("x-fig").onclick=()=>{ xPara(); mEntraFig(E.id); }; $("x-dup").onclick=()=>duplicaEx(E.id);
  bx.innerHTML=`<div class="exf">
    <div class="exf-cab"><span>EXERCÍCIO</span><span>${esc(P[1].toUpperCase())}</span></div>
    <div class="exf-g">
      <div>
        <div class="exf-h exf-2"><span>ESPAÇO</span><span>DURAÇÃO</span></div>
        <div class="exf-2"><div class="exf-esp">${esc(E.espaco.txt||"–")}</div>
          <table class="exf-dur"><tr><th>TOTAL</th><td>${fmtTempo(tot)}</td></tr><tr><th>SÉRIES / REPS.</th><td>${D.series||"–"}</td></tr><tr><th>TEMPO PRÁTICA</th><td>${fmtTempo(D.pratica)}</td></tr><tr><th>PAUSA</th><td>${fmtTempo(D.pausa)}</td></tr></table></div>
        <div class="exf-h">OBJETIVOS E CONDICIONANTES</div>
        <div class="exf-txt"><b class="exf-tit">${esc(tit)}</b>${E.objetivos?`<p>${esc(E.objetivos)}</p>`:""}${E.comportamentos.length?`<b>Comportamentos-chave:</b>${linhasHtml(E.comportamentos)}`:""}${E.condicionantes.length?`<b>Condicionantes:</b>${linhasHtml(E.condicionantes)}`:""}</div>
      </div>
      <div>
        <div class="exf-h">DESCRIÇÃO</div><div class="exf-txt">${E.descricao?`<p>${esc(E.descricao)}</p>`:`<p class="sub">Sem descrição.</p>`}</div>
        <div class="exf-h">VARIANTES DO EXERCÍCIO</div><div class="exf-txt">${E.variantes.length?linhasHtml(E.variantes,true):`<p class="sub">Sem variantes.</p>`}</div>
      </div>
    </div></div>`; }
function renderExFigura(E){ const st=$("x-stage"), pb=$("x-play"); if(xPl){ xPl.pause(); xPl=null; }
  if(!E){ st.innerHTML=""; st.hidden=true; pb.hidden=true; return; } st.hidden=false;
  if(!temFigura(E)){ st.innerHTML=`<div class="m-vazio"><b>Sem figura</b><span>Desenha a figura com o editor do Modelo de Jogo: jogadores, adversários, bola, setas, zonas e passos animados.</span><button class="btn primary" id="x-fig2">✎ Desenhar figura</button></div>`;
    $("x-fig2").onclick=()=>mEntraFig(E.id); pb.hidden=true; return; }
  const Q=figuraQ(E.id), estado=()=>{ const b=$("x-pl"); if(b) b.textContent=xPl&&xPl.playing?"⏸ Pausa":"▶ Animar"; };
  st.innerHTML=""; xPl=playerModelo(Q,{onT:estado,onEnd:estado}); st.appendChild(xPl.svg);
  if(Q.passos.length<2){ pb.hidden=true; return; }
  pb.hidden=false; pb.innerHTML=`<button class="btn sm" id="x-ini" aria-label="Voltar ao passo 1">⏮</button><button class="btn sm primary" id="x-pl" style="min-width:96px">▶ Animar</button><span class="sub">${Q.passos.length} passos</span>`;
  $("x-ini").onclick=()=>{ xPl.pause(); xPl.set(0); estado(); };
  $("x-pl").onclick=()=>{ if(xPl.playing) xPl.pause(); else xPl.play(xPl.t>=Q.passos.length-1-1e-6?0:xPl.t); estado(); }; }
const dataHora=iso=>{ try{ return new Date(iso).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}); }catch(e){ return ""; } };
function renderExPainel(E){ const pn=$("x-panel");
  if(!E){ pn.innerHTML=`<header><h2>Repositório de exercícios</h2><p class="sub">Exercícios para as Unidades de Treino, com a ficha do clube.</p></header>`; return; }
  const lM=E.ligacoes.modelo.filter(id=>modelos[id]), lL=E.ligacoes.lances.map(id=>lances().find(l=>l.id===id)).filter(Boolean);
  const quem=(id,em)=>`<b data-u="${esc(id)}">${id?"…":"—"}</b>${em?" · "+esc(dataHora(em)):""}`;
  pn.innerHTML=`<header><h2>Classificação</h2><p class="sub">Para encontrar o exercício e, mais tarde, montar as UT.</p></header>
    <dl class="exd"><dt>Parte</dt><dd>${esc(parteDe(E.parte)[1])}</dd><dt>Momento</dt><dd>${esc(rotuloDe(MOM_EX,E.momento)||"Geral")}${E.sub?" · "+esc(subNome(E.momento,E.sub)):""}</dd>
      <dt>Tipo</dt><dd>${esc(rotuloDe(TIPOS_EX,E.tipo)||"–")}</dd><dt>Formato</dt><dd>${esc(E.formato||"–")}</dd></dl>
    <div class="add"><h3>Material</h3>${E.material.length?`<div class="picks">${E.material.map(m=>`<label>${esc(m)}</label>`).join("")}</div>`:`<p class="sub" style="margin:0">Sem material indicado.</p>`}</div>
    <div class="add"><h3>Ligações</h3>${lM.length||lL.length?`<div class="xlig">${lM.map(id=>`<button class="btn sm" data-m="${esc(id)}">Modelo · ${esc(modelos[id].nome)}</button>`).join("")}${lL.map(L=>`<button class="btn sm" data-l="${esc(L.id)}">Bola parada · ${esc(L.nome)}</button>`).join("")}</div>`:`<p class="sub" style="margin:0">Sem ligações a quadros do Modelo de Jogo ou de bolas paradas.</p>`}</div>
    <div class="add"><h3>Autoria</h3><p class="sub" style="margin:0">Criado por ${quem(E.criadoPor,E.criadoEm)}</p>${E.alteradoEm?`<p class="sub" style="margin:0">Última alteração: ${quem(E.alteradoPor,E.alteradoEm)}</p>`:""}</div>`;
  pn.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{ mCur=b.dataset.m; setTab("m"); });
  pn.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{ curId=b.dataset.l; setTab("q"); render(); });
  preencheNomes(pn); }
/* nomes de quem criou/alterou: só se guarda o id; o nome vem sempre na hora */
async function preencheNomes(root){ const els=[...root.querySelectorAll("[data-u]")].filter(e=>e.dataset.u); if(!els.length) return;
  const resto=e=>e.textContent=e.dataset.u===meuId?"ti":"alguém da equipa";
  if(!usr||!usr.profiles){ els.forEach(resto); return; }
  try{ const ps=await usr.profiles([...new Set(els.map(e=>e.dataset.u))]); els.forEach(e=>{ const p=ps&&ps[e.dataset.u]; if(p&&p.name) e.textContent=p.name; else resto(e); }); }catch(e){ els.forEach(resto); } }

/* ---------- ficha: criar e editar ---------- */
function folhaEx(id){ const E0=id?exercicios[id]:null, E=E0?clone(E0):normEx({id:xId()}); if(!E0) E.nome="";
  let parte=E.parte, mom=E.momento, sub=E.sub, tipo=E.tipo; const D=E.duracao, tt=s=>s?fmtTempo(s):"";
  const ta=(i,lab,val,rows,ph)=>`<label class="f">${lab}<textarea id="${i}" rows="${rows}" placeholder="${esc(ph||"")}">${esc(val)}</textarea></label>`;
  const ligM=listaModelos(), ligL=lances().filter(l=>l.tipo==="OF"||l.tipo==="DEF");
  folha(`<h3>${E0?"Editar exercício":"Novo exercício"}</h3>
    <label class="f">Nome (título a vermelho na ficha)<input type="text" id="xe-n" value="${esc(E.nome)}" placeholder="Ex.: MPB Posicional"></label>
    <div class="fields"><label class="f">Formato<input type="text" id="xe-fo" value="${esc(E.formato)}" placeholder="Ex.: 8+2×4+GR"></label><label class="f">Espaço<input type="text" id="xe-es" value="${esc(E.espaco.txt)}" placeholder="Ex.: 1/2 campo, dupla área, 8x8"></label></div>
    <h4>Parte da UT</h4><div class="seg" id="xe-p">${PARTES.map(p=>`<button data-k="${p[0]}">${p[1]}</button>`).join("")}</div>
    <h4>Momento do jogo</h4><div class="seg" id="xe-m"><button data-k="">Geral</button>${MOM_EX.map(m=>`<button data-k="${m[0]}">${m[1]}</button>`).join("")}</div>
    <div class="seg" id="xe-s"></div>
    <h4>Tipo de exercício</h4><div class="seg" id="xe-t"><button data-k="">Sem tipo</button>${TIPOS_EX.map(t=>`<button data-k="${t[0]}">${t[1]}</button>`).join("")}</div>
    <h4>Duração</h4>
    <div class="xe-dur"><label class="f">Séries / reps.<input type="text" inputmode="numeric" id="xe-se" value="${D.series||""}"></label><label class="f">Tempo prática<input type="text" id="xe-pr" value="${tt(D.pratica)}" placeholder="Ex.: 3' ou 2'30"></label><label class="f">Pausa<input type="text" id="xe-pa" value="${tt(D.pausa)}" placeholder="Ex.: 1'30 ou 30 s"></label><label class="f">Total<input type="text" id="xe-to" value="${tt(D.total)}"></label></div>
    <p class="sub" id="xe-dt" style="margin:0"></p>
    ${ta("xe-ob","Objetivos",E.objetivos,3)}
    ${ta("xe-co","Comportamentos-chave (um por linha)",E.comportamentos.join("\n"),3)}
    ${ta("xe-cd","Condicionantes / regras (uma por linha)",E.condicionantes.join("\n"),2,"Ex.: Circulação a 1 toque")}
    ${ta("xe-de","Descrição",E.descricao,5)}
    ${ta("xe-va","Variantes do exercício (uma por linha)",E.variantes.join("\n"),2)}
    ${ta("xe-ma","Material (um por linha)",E.material.join("\n"),2,"Ex.: Bolas\nCones\nColetes\nMini-balizas")}
    <details class="more"><summary>Ligações a quadros do Modelo de Jogo e de bolas paradas</summary><div class="picks" id="xe-lg" style="margin-top:8px">
      ${ligM.map(Q=>`<label><input type="checkbox" data-m="${esc(Q.id)}"${E.ligacoes.modelo.includes(Q.id)?" checked":""}> Modelo · ${esc(Q.nome)}</label>`).join("")}
      ${ligL.map(L=>`<label><input type="checkbox" data-l="${esc(L.id)}"${E.ligacoes.lances.includes(L.id)?" checked":""}> ${esc(L.nome)}</label>`).join("")}
      ${ligM.length||ligL.length?"":`<span class="sub">Ainda não há quadros para ligar.</span>`}</div></details>
    <div class="actions">${E0?`<button class="btn danger l" id="xe-del">Apagar exercício</button>`:""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="xe-ok">${E0?"Guardar":"Criar exercício"}</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x);
    const pinta=()=>{ s.querySelectorAll("#xe-p button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===parte)));
      s.querySelectorAll("#xe-m button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===mom)));
      s.querySelectorAll("#xe-t button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===tipo)));
      const ss=q("#xe-s"), temSub=MOMENTOS.some(m=>m[0]===mom); ss.hidden=!temSub;
      ss.innerHTML=temSub?`<button data-k="">Sem subfase</button>`+momDe(mom)[3].map(x=>`<button data-k="${x[0]}" aria-pressed="${x[0]===sub}">${x[1]}</button>`).join(""):"";
      if(temSub){ ss.firstChild.setAttribute("aria-pressed",String(!sub)); ss.querySelectorAll("button").forEach(b=>b.onclick=()=>{ sub=b.dataset.k; pinta(); }); } };
    s.querySelectorAll("#xe-p button").forEach(b=>b.onclick=()=>{ parte=b.dataset.k; pinta(); });
    s.querySelectorAll("#xe-m button").forEach(b=>b.onclick=()=>{ if(mom!==b.dataset.k){ mom=b.dataset.k; sub=""; } pinta(); });
    s.querySelectorAll("#xe-t button").forEach(b=>b.onclick=()=>{ tipo=b.dataset.k; pinta(); }); pinta();
    /* duração: o total sugerido é a conta; escrever um total sobrepõe-se */
    const dur=()=>({series:Math.max(0,parseInt(q("#xe-se").value)||0),pratica:lerDur(q("#xe-pr").value),pausa:lerDur(q("#xe-pa").value),total:lerDur(q("#xe-to").value)});
    const mostraConta=()=>{ const d=dur(), bad=["pratica","pausa","total"].filter(k=>isNaN(d[k])); const dt=q("#xe-dt");
      if(bad.length){ dt.innerHTML=`<b style="color:var(--red)">Tempo que não percebo.</b> Usa por exemplo 3', 2'30, 1,30 ou 30 s.`; return; }
      const c=contaDur(d); q("#xe-to").placeholder=c?"Conta: "+fmtTempo(c):"";
      dt.textContent=c?(d.series>1?`Conta: ${d.series} × ${fmtTempo(d.pratica)}${d.pausa?` + ${d.series-1} × ${fmtTempo(d.pausa)} de pausa`:""} = ${fmtTempo(c)}.`:`Conta: ${fmtTempo(c)}.`)+(d.total?` Total escrito à mão: ${fmtTempo(d.total)}.`:" Deixa o total vazio para usar a conta."):""; };
    ["#xe-se","#xe-pr","#xe-pa","#xe-to"].forEach(i=>q(i).addEventListener("input",mostraConta)); mostraConta();
    if(q("#xe-del")) confirma2(q("#xe-del"),"Toca outra vez para apagar",()=>{ fecha(); apagaEx(E0.id); });
    q("#xe-ok").onclick=()=>{ const nome=q("#xe-n").value.trim(); if(!nome){ toast("Escreve o nome do exercício."); q("#xe-n").focus(); return; }
      const d=dur(); if(["pratica","pausa","total"].some(k=>isNaN(d[k]))){ toast("Corrige os tempos da duração."); return; }
      const N={...E,nome,formato:q("#xe-fo").value,espaco:{...E.espaco,txt:q("#xe-es").value},parte,momento:mom,sub,tipo,
        duracao:{series:d.series,pratica:d.pratica,pausa:d.pausa,total:d.total||null},
        objetivos:q("#xe-ob").value,comportamentos:q("#xe-co").value,condicionantes:q("#xe-cd").value,descricao:q("#xe-de").value,variantes:q("#xe-va").value,material:q("#xe-ma").value,
        ligacoes:{modelo:[...s.querySelectorAll("#xe-lg input[data-m]:checked")].map(i=>i.dataset.m),lances:[...s.querySelectorAll("#xe-lg input[data-l]:checked")].map(i=>i.dataset.l)}};
      if(!E0){ N.criadoPor=meuId||""; N.criadoEm=new Date().toISOString(); }
      fecha(); const R=guardaEx(N,true); xCur=R.id; renderEx();
      if(E0) toast("Exercício guardado",()=>{ guardaEx(E0,true); renderEx(); }); else toast("Exercício criado · desenha a figura em ✎ Desenhar figura"); }; }); }

/* ---------- sincronização ---------- */
function ligaExDb(){ if(!db) return; db.collection("exercicios").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
    q.docs.forEach(d=>{ const x=d.data(); if(x){ const c={...x}; delete c.atualizadoEm; try{ m[d.id]=normEx({...c,id:d.id}); }catch(e){} } });
    mergeCol("exercicios/",m,exercicios); if(JSON.stringify(m)!==JSON.stringify(exercicios)){ exercicios=m; guardaExLocal();
      if(!$("sheet-root").innerHTML&&!(xPl&&xPl.playing)) renderEx(); if(mFig) renderModeloSeguro(); } },()=>{}); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaExDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();
