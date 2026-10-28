/* ---------- Exercícios complementares, grupos por exercício e estatística de tempos (no separador Treino; junta-se ao 4.º <script>) ---------- */
/* Um complementar é uma linha da UT com `pai` (o id da linha do exercício principal): corre em paralelo, logo a seguir ao principal (3.1, 3.2…),
   e não soma ao tempo total da UT nem ao da parte. A rotação fica no principal: rot = {nEq, nJogo, equipas:[id do grupo | ""], grelha:[série][equipa]},
   cada casa = "p" (principal), o id da linha do complementar, ou "" (descanso). As funções chamadas ao ler as UT (normUT) são declarações:
   correm antes de as constantes deste ficheiro existirem. */

/* nº de cada linha: principais 1, 2, 3…; complementares 3.1, 3.2… */
function numerosUT(U){ const m={}; let n=0, c=0; U.exercicios.forEach(l=>{ if(l.pai){ c++; m[l.id]=`${n}.${c}`; } else { n++; c=0; m[l.id]=String(n); } }); return m; }
function seriesDe(E){ return Math.max(1,E.duracao.series||1); }
/* proposta: em cada série jogam nJogo equipas na principal (a rodar); as outras vão para os complementares, cada uma para o que fez menos vezes */
function propoeRot(nEq,nJogo,S,cs){ const vezes=Array.from({length:nEq},()=>({}));
  return Array.from({length:S},(_,s)=>{ const lin=Array(nEq).fill(""), dentro=new Set(Array.from({length:nJogo},(_,j)=>(s*nJogo+j)%nEq)), carga={};
    for(let i=0;i<nEq;i++){ if(dentro.has(i)){ lin[i]="p"; continue; } if(!cs.length) continue;
      const c=cs.slice().sort((a,b)=>((vezes[i][a]||0)*10+(carga[a]||0))-((vezes[i][b]||0)*10+(carga[b]||0)))[0];
      lin[i]=c; vezes[i][c]=(vezes[i][c]||0)+1; carga[c]=(carga[c]||0)+1; }
    return lin; }); }
function normRot(r,l,ls,gids){ const cs=ls.filter(c=>c.pai===l.id).map(c=>c.id); if(!cs.length||!r||typeof r!=="object") return null;
  const nEq=Math.min(8,Math.max(2,Math.round(+r.nEq)||2)), nJogo=Math.min(nEq-1,Math.max(1,Math.round(+r.nJogo)||1)), S=seriesDe(l.copia), ok=new Set(["p","",...cs]);
  const prop=propoeRot(nEq,nJogo,S,cs), eq=Array.isArray(r.equipas)?r.equipas:[];
  /* séries novas (a principal passou a ter mais séries) entram com a proposta */
  const grelha=prop.map((p,i)=>{ const v=Array.isArray(r.grelha)&&Array.isArray(r.grelha[i])?r.grelha[i]:null; return v?p.map((x,j)=>{ const y=String(v[j]??""); return ok.has(y)?y:""; }):p; });
  return {nEq,nJogo,equipas:Array.from({length:nEq},(_,j)=>{ const g=String(eq[j]??""); return gids.has(g)?g:""; }),grelha}; }
/* depois de ler: complementares logo a seguir ao seu principal; um complementar sem principal válido passa a exercício normal */
function arrumaLinhas(ls,G){ const gids=new Set(G.map(g=>g.id)), porId=new Map(ls.map(l=>[l.id,l]));
  ls.forEach(l=>{ if(l.pai){ const p=porId.get(l.pai); if(!p||p===l||p.pai) delete l.pai; } });
  ls.forEach(l=>{ if(l.pai){ delete l.grupos; delete l.rot; } else if(l.grupos) l.grupos=l.grupos.filter(g=>gids.has(g)); });
  const out=[]; ls.filter(l=>!l.pai).forEach(p=>{ out.push(p); ls.filter(c=>c.pai===p.id).forEach(c=>{ c.copia.parte=p.copia.parte; out.push(c); }); });
  out.forEach(l=>{ if(l.rot){ const r=normRot(l.rot,l,out,gids); if(r) l.rot=r; else delete l.rot; } });
  return out; }
/* rotação de novo, depois de entrar ou sair um complementar (mantém o nº de equipas, quantas jogam e que grupos são as equipas) */
function rotRefaz(U,P){ const cs=U.exercicios.filter(c=>c.pai===P.id).map(c=>c.id); if(!cs.length){ delete P.rot; return; }
  const gs=U.grupos.filter(g=>(P.grupos||[]).includes(g.id)).map(g=>g.id), nEq=P.rot?P.rot.nEq:Math.min(8,Math.max(2,gs.length||4)), nJogo=P.rot?Math.min(P.rot.nJogo,nEq-1):Math.min(2,nEq-1);
  const equipas=P.rot?P.rot.equipas.slice(0,nEq):gs.slice(0,nEq); while(equipas.length<nEq) equipas.push("");
  P.rot={nEq,nJogo,equipas,grelha:propoeRot(nEq,nJogo,seriesDe(P.copia),cs)}; }
/* tirar um bloco inteiro (principal + complementares) para cima ou para baixo */
function moveBloco(U,lid,dir){ const bl=[]; U.exercicios.forEach(l=>{ if(l.pai&&bl.length) bl[bl.length-1].push(l); else bl.push([l]); });
  const i=bl.findIndex(b=>b[0].id===lid), j=i+dir; if(i<0||j<0||j>=bl.length) return; [bl[i],bl[j]]=[bl[j],bl[i]]; U.exercicios=bl.flat(); }

/* grelha pequena na linha do principal (só para ver; muda-se em 👥 Grupos) */
function rotMiniHtml(U,l,cs,nums){ const R=l.rot;
  return `<table class="urot mini"><thead><tr><th>Série</th>${R.equipas.map((g,j)=>`<th>${esc(nomeEquipa(U,R,j))}</th>`).join("")}</tr></thead><tbody>${R.grelha.map((r,i)=>`<tr><th>${i+1}</th>${r.map(v=>`<td class="${v==="p"?"p":v?"c":"d"}">${esc(rotCasa(v,nums,l.id))}</td>`).join("")}</tr>`).join("")}</tbody></table>`; }
/* tempos: prática sem pausas */
const praticaEx=E=>{ const D=E.duracao; return D.pratica?seriesDe(E)*D.pratica:(D.total||0); };
const praticaSerie=E=>{ const D=E.duracao; return D.pratica||Math.round((D.total||0)/seriesDe(E)); };
const praticaCompl=(c,P)=>c.copia.duracao.pratica||praticaSerie(P.copia);
const contaLinha=l=>typeof l.conta==="boolean"?l.conta:contaExDef(l.copia);
const nomeEquipa=(U,R,j)=>{ const g=U.grupos.find(x=>x.id===R.equipas[j]); return g?(g.nome||`Grupo ${j+1}`):`Equipa ${j+1}`; };
const rotCasa=(v,nums,pid)=>v==="p"?nums[pid]:v?nums[v]||"?":"–";
function avisosRot(U,l,cs,nums){ const R=l.rot, av=[]; if(!R||!cs.length) return av; const nome=j=>nomeEquipa(U,R,j);
  R.grelha.forEach((r,i)=>{ const n=r.filter(v=>v==="p").length; if(n!==R.nJogo) av.push(`Série ${i+1}: ${n} ${n===1?"equipa":"equipas"} no ${nums[l.id]} (definiste ${R.nJogo} ao mesmo tempo).`); });
  const vezes=v=>Array.from({length:R.nEq},(_,j)=>R.grelha.filter(r=>r[j]===v).length);
  [["p",l],...cs.map(c=>[c.id,c])].forEach(([v,x])=>{ const c=vezes(v); if(Math.max(...c)!==Math.min(...c)) av.push(`Rotação desequilibrada no ${nums[x.id]}: ${c.map((n,j)=>`${nome(j)} ${n}`).join(", ")} ${R.grelha.length===1?"série":"séries"}.`); });
  const pS=praticaSerie(l.copia); cs.forEach(c=>{ const t=c.copia.duracao.pratica;
    if(t&&pS&&t>pS) av.push(`O complementar ${nums[c.id]} (${fmtTempo(t)} por série) é mais longo do que a série do ${nums[l.id]} (${fmtTempo(pS)}).`);
    else if(!t&&totalEx(c.copia)>totalEx(l.copia)) av.push(`O complementar ${nums[c.id]} (${fmtTempo(totalEx(c.copia))}) é mais longo do que o ${nums[l.id]} (${fmtTempo(totalEx(l.copia))}).`); });
  const sem=R.equipas.map((g,j)=>g?null:nome(j)).filter(Boolean); if(sem.length) av.push(`${sem.join(", ")} sem grupo de trabalho: os minutos não contam.`);
  return av; }
/* minutos de uma UT por atleta: séries em que a equipa (grupo) do atleta está nesse exercício × tempo de prática; só presentes (P e condicionados) */
function temposUT(U){ const nums=numerosUT(U), por={}, avisos=[], comGrupo=new Set(); let haConta=false;
  const soma=(k,seg,l)=>{ if(!presenteUT(U,k)) return; comGrupo.add(k); if(!seg) return; const x=por[k]||(por[k]={seg:0,det:[]});
    if(x.det.some(d=>d.lid===l.id)) return; x.seg+=seg; x.det.push({lid:l.id,num:nums[l.id],nome:l.copia.nome,seg}); };
  U.exercicios.forEach(l=>{ if(l.pai) return; const cs=U.exercicios.filter(c=>c.pai===l.id), contaC=cs.filter(contaLinha), contaP=contaLinha(l);
    if(!contaP&&!contaC.length) return; haConta=true;
    const gs=(l.grupos||[]).map(id=>U.grupos.find(g=>g.id===id)).filter(Boolean);
    if(!gs.length){ avisos.push({lid:l.id,t:`${nums[l.id]} · ${l.copia.nome}: conta para os tempos mas não tem grupos`}); return; }
    if(l.rot&&cs.length){ const R=l.rot; avisosRot(U,l,cs,nums).forEach(t=>avisos.push({lid:l.id,t:`${nums[l.id]} · ${t}`}));
      R.equipas.forEach((gid,j)=>{ const g=U.grupos.find(x=>x.id===gid); if(!g) return; const col=R.grelha.map(r=>r[j]);
        g.jogadores.forEach(k=>{ if(contaP) soma(k,col.filter(v=>v==="p").length*praticaSerie(l.copia),l);
          contaC.forEach(c=>soma(k,col.filter(v=>v===c.id).length*praticaCompl(c,l),c)); }); }); }
    else if(contaP) gs.forEach(g=>g.jogadores.forEach(k=>soma(k,praticaEx(l.copia),l))); });
  const semGrupo=haConta?atletasUT(U).filter(a=>presenteUT(U,a.k)&&!comGrupo.has(a.k)):[];
  return {por,avisos,semGrupo,haConta}; }

/* ---------- 👥 Grupos e tempos de uma linha da UT (e a rotação, no principal com complementares) ---------- */
function folhaTemposEx(id,lid){ const U=uts[id], l0=U&&U.exercicios.find(x=>x.id===lid); if(!l0) return; const nums=numerosUT(U);
  const def=contaExDef(l0.copia), ctHtml=`<h4>Conta para a estatística de tempos</h4><div class="seg" id="ut-ct"><button data-k="">Como no repositório (${def?"conta":"não conta"})</button><button data-k="1">Conta</button><button data-k="0">Não conta</button></div>`;
  let conta=typeof l0.conta==="boolean"?l0.conta:null;
  const pintaCt=s=>s.querySelectorAll("#ut-ct button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===(conta===null?"":conta?"1":"0"))));
  if(l0.pai){ const P=U.exercicios.find(x=>x.id===l0.pai);
    folha(`<h3>Complementar ${nums[lid]} · tempos</h3><p class="sub" style="margin:0"><b>${esc(l0.copia.nome)}</b> · corre em paralelo com o ${nums[P.id]} e não soma ao tempo da UT.</p>${ctHtml}
      <p class="sub" style="margin:0">As equipas que fazem este exercício vêm da rotação do ${nums[P.id]} (${esc(P.copia.nome)}).</p>
      <div class="actions"><button class="btn" id="ut-rp">Abrir a rotação do ${nums[P.id]}</button><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ut-ok">Guardar</button></div>`,(s,fecha)=>{
      s.querySelectorAll("#ut-ct button").forEach(b=>b.onclick=()=>{ conta=b.dataset.k===""?null:b.dataset.k==="1"; pintaCt(s); }); pintaCt(s);
      s.querySelector("#ut-rp").onclick=()=>{ fecha(); folhaTemposEx(id,P.id); };
      s.querySelector("#ut-ok").onclick=()=>{ fecha(); editaUT(U=>{ const x=U.exercicios.find(y=>y.id===lid); if(conta===null) delete x.conta; else x.conta=conta; },"Tempos do complementar guardados"); }; }); return; }
  const cs=U.exercicios.filter(c=>c.pai===lid), S=seriesDe(l0.copia);
  let gs=U.grupos.filter(g=>(l0.grupos||[]).includes(g.id)).map(g=>g.id), R=l0.rot?clone(l0.rot):null;
  folha(`<h3>Grupos e tempos · ${nums[lid]}</h3><p class="sub" style="margin:0"><b>${esc(l0.copia.nome)}</b> · só nesta UT${U.numero}; o exercício do repositório não muda.</p>${ctHtml}
    <h4>Grupos neste exercício</h4>${U.grupos.length?`<div class="chips" id="ut-gs"><button class="chip" data-t="1">Todos</button>${U.grupos.map(g=>`<button class="chip" data-g="${esc(g.id)}">${esc(g.nome||"Grupo")} <small>${g.jogadores.length}</small></button>`).join("")}</div>`:`<p class="sub" style="margin:0">Esta UT ainda não tem grupos de trabalho: cria-os no painel (+ Grupo).</p>`}
    ${cs.length?`<h4>Rotação com ${cs.length===1?"o complementar":"os complementares"} ${cs.map(c=>nums[c.id]).join(", ")}</h4>
      <div class="fields"><label class="f">Nº de equipas<select id="ut-ne">${[2,3,4,5,6,7,8].map(n=>`<option value="${n}">${n}</option>`).join("")}</select></label><label class="f">Ao mesmo tempo no ${nums[lid]}<select id="ut-nj"></select></label></div>
      <div class="tblwrap"><table class="urot" id="ut-gr"></table></div>
      <p class="sub" style="margin:0">Toca numa casa para mudar: ${nums[lid]} (principal) → ${cs.map(c=>nums[c.id]).join(" → ")} → descanso (–). As equipas são os grupos escolhidos acima, por ordem.</p>
      <div><button class="btn sm" id="ut-rp" type="button">↺ Propor de novo</button></div>`:`<p class="sub" style="margin:0">Exercício complementar em paralelo? Junta-o com «+ Compl.» na linha do exercício.</p>`}
    <div id="ut-av"></div>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ut-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x);
    s.querySelectorAll("#ut-ct button").forEach(b=>b.onclick=()=>{ conta=b.dataset.k===""?null:b.dataset.k==="1"; pintaCt(s); avisos(); }); pintaCt(s);
    const propoe=()=>{ R.grelha=propoeRot(R.nEq,R.nJogo,S,cs.map(c=>c.id)); };
    const equipas=()=>{ const e=gs.slice(0,R.nEq); while(e.length<R.nEq) e.push(""); R.equipas=e; };
    const avisos=()=>{ const l={...l0,grupos:gs,rot:R}, av=[...(cs.length&&R?avisosRot(U,l,cs,nums):[])], ct=conta===null?def:conta;
      if(ct&&!gs.length) av.unshift("Conta para os tempos mas não tem grupos: escolhe os grupos que fazem este exercício.");
      q("#ut-av").innerHTML=av.length?`<ul class="uavisos">${av.map(t=>`<li>⚠ ${esc(t)}</li>`).join("")}</ul>`:""; };
    const pintaGr=()=>{ if(!cs.length) return; q("#ut-ne").value=String(R.nEq);
      q("#ut-nj").innerHTML=Array.from({length:R.nEq-1},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join(""); q("#ut-nj").value=String(R.nJogo);
      q("#ut-gr").innerHTML=`<thead><tr><th>Série</th>${R.equipas.map((g,j)=>`<th>${esc(nomeEquipa(U,R,j))}</th>`).join("")}</tr></thead><tbody>${R.grelha.map((r,i)=>`<tr><th>${i+1}</th>${r.map((v,j)=>`<td><button type="button" data-s="${i}" data-e="${j}" class="${v==="p"?"p":v?"c":"d"}">${esc(rotCasa(v,nums,lid))}</button></td>`).join("")}</tr>`).join("")}</tbody>`;
      const ciclo=["p",...cs.map(c=>c.id),""];
      q("#ut-gr").querySelectorAll("button").forEach(b=>b.onclick=()=>{ const i=+b.dataset.s, j=+b.dataset.e; R.grelha[i][j]=ciclo[(ciclo.indexOf(R.grelha[i][j])+1)%ciclo.length]; pintaGr(); });
      avisos(); };
    const pintaGs=()=>{ s.querySelectorAll("#ut-gs [data-g]").forEach(b=>b.setAttribute("aria-pressed",String(gs.includes(b.dataset.g))));
      const t=q("#ut-gs [data-t]"); if(t) t.setAttribute("aria-pressed",String(!!U.grupos.length&&gs.length===U.grupos.length)); };
    const mudouGs=()=>{ gs=U.grupos.filter(g=>gs.includes(g.id)).map(g=>g.id); if(R){ if(gs.length>=2) R.nEq=Math.min(8,gs.length); R.nJogo=Math.min(R.nJogo,R.nEq-1); equipas(); propoe(); } pintaGs(); pintaGr(); avisos(); };
    s.querySelectorAll("#ut-gs [data-g]").forEach(b=>b.onclick=()=>{ const g=b.dataset.g; gs=gs.includes(g)?gs.filter(x=>x!==g):[...gs,g]; mudouGs(); });
    const tb=q("#ut-gs [data-t]"); if(tb) tb.onclick=()=>{ gs=gs.length===U.grupos.length?[]:U.grupos.map(g=>g.id); mudouGs(); };
    if(cs.length){ if(!R){ R={nEq:Math.min(8,Math.max(2,gs.length||4)),nJogo:1,equipas:[],grelha:[]}; R.nJogo=Math.min(2,R.nEq-1); equipas(); propoe(); }
      q("#ut-ne").onchange=()=>{ R.nEq=+q("#ut-ne").value; R.nJogo=Math.min(R.nJogo,R.nEq-1); equipas(); propoe(); pintaGr(); };
      q("#ut-nj").onchange=()=>{ R.nJogo=+q("#ut-nj").value; propoe(); pintaGr(); };
      q("#ut-rp").onclick=()=>{ propoe(); pintaGr(); toast("Rotação proposta de novo"); }; }
    pintaGs(); pintaGr(); avisos();
    q("#ut-ok").onclick=()=>{ fecha(); editaUT(U=>{ const x=U.exercicios.find(y=>y.id===lid); if(!x) return; if(conta===null) delete x.conta; else x.conta=conta; x.grupos=gs.slice(); if(R&&cs.length) x.rot=clone(R); },"Grupos e tempos guardados"); }; }); }

/* ---------- vista Tempos: minutos de treino por atleta (só exercícios que contam; só presentes) ---------- */
let tF={ep:"",mi:"",ut:""}; try{ const f=JSON.parse(localStorage.getItem("sca-tempos-f")||"null"); if(f) tF={...tF,...f}; }catch(e){}
const minT=s=>Math.round((s||0)/60);
/* a mesma pessoa em UT diferentes: no plantel pelo nº; de fora do plantel pelo nome */
const chaveT=a=>String(a.k).startsWith("e:")?"x:"+semAcento(a.nome):"n:"+a.k;
function temposFiltro(){ const todas=listaUTs().filter(U=>U.data), eps=[...new Set(todas.map(U=>epocaDe(U.data)))].sort().reverse();
  if(!eps.includes(tF.ep)) tF.ep=eps.includes(epocaDe(isoDia(new Date())))?epocaDe(isoDia(new Date())):(eps[0]||"");
  const daEp=todas.filter(U=>epocaDe(U.data)===tF.ep), micros=[...new Map(daEp.map(U=>microDe(U.data)).filter(Boolean).map(M=>[M.id,M])).values()].sort((a,b)=>a.inicio.localeCompare(b.inicio));
  if(tF.mi&&!micros.some(M=>M.id===tF.mi)) tF.mi="";
  const doMi=daEp.filter(U=>!tF.mi||(microDe(U.data)||{}).id===tF.mi); if(tF.ut&&!doMi.some(U=>U.id===tF.ut)) tF.ut="";
  const ls=doMi.filter(U=>!tF.ut||U.id===tF.ut).sort((a,b)=>a.data.localeCompare(b.data)||a.numero-b.numero), J={}, avisos=[], semG={};
  ls.forEach(U=>{ const T=temposUT(U);
    atletasUT(U).forEach(a=>{ if(!presenteUT(U,a.k)) return; const c=chaveT(a), j=J[c]||(J[c]={nome:nomeCurto(a),esc:String(a.k).startsWith("e:")?a.esc:"",seg:0,nUT:0,det:[]}); j.nUT++;
      const t=T.por[a.k]; j.det.push({U,itens:t?t.det:[],seg:t?t.seg:0}); if(t) j.seg+=t.seg; });
    T.avisos.forEach(x=>avisos.push({U,...x})); T.semGrupo.forEach(a=>{ const c=chaveT(a); (semG[c]||(semG[c]={nome:nomeCurto(a),uts:[]})).uts.push(U); }); });
  return {eps,micros,doMi,ls,J,avisos,semG}; }
function renderTempos(){ const F=temposFiltro(), nav=$("u-nav"), dd=d=>dataPt_(d).slice(0,5);
  try{ localStorage.setItem("sca-tempos-f",JSON.stringify(tF)); }catch(e){}
  nav.innerHTML=modoUTHtml()+`<div class="grp tfiltro"><h3>Filtrar</h3>
    <label class="f">Época<select id="tp-ep">${F.eps.map(e=>`<option value="${e}">${e}</option>`).join("")||`<option value="">–</option>`}</select></label>
    <label class="f">Microciclo<select id="tp-mi"><option value="">Todos</option>${F.micros.map(M=>`<option value="${esc(M.id)}">Micro ${M.n||"?"} · ${dd(M.inicio)}</option>`).join("")}</select></label>
    <label class="f">UT<select id="tp-ut"><option value="">Todas</option>${F.doMi.slice().sort((a,b)=>a.data.localeCompare(b.data)).map(U=>`<option value="${esc(U.id)}">UT${U.numero} · ${dd(U.data)}${U.matchDay?" · "+esc(U.matchDay):""}</option>`).join("")}</select></label></div>`;
  ligaModoUT(nav); $("tp-ep").value=tF.ep; $("tp-mi").value=tF.mi; $("tp-ut").value=tF.ut;
  [["tp-ep","ep"],["tp-mi","mi"],["tp-ut","ut"]].forEach(([i,k])=>$(i).onchange=()=>{ tF[k]=$(i).value; if(k==="ep"){ tF.mi=""; tF.ut=""; } if(k==="mi") tF.ut=""; renderTempos(); });
  $("u-tit").textContent="Tempos de treino"; $("u-tag").hidden=true;
  $("u-bar").innerHTML=`<button class="btn sm" id="tp-csv"${F.ls.length?"":" disabled"}>⬇ CSV</button>`; $("tp-csv").onclick=()=>csvTempos(F);
  const linhas=Object.entries(F.J).sort((a,b)=>b[1].seg-a[1].seg||a[1].nome.localeCompare(b[1].nome,"pt")), tot=linhas.reduce((a,[,j])=>a+j.seg,0);
  $("u-corpo").innerHTML=!F.ls.length?`<div class="m-vazio"><b>Sem UT neste filtro.</b><span>Os tempos vêm das UT: presenças, grupos de trabalho em cada exercício e duração (séries × tempo de prática, sem pausas).</span></div>`
    :`<p class="sub" style="margin:0 14px 8px">${F.ls.length} ${F.ls.length===1?"UT":"UT"} · só exercícios que contam para a estatística · minutos de prática sem pausas. Toca num atleta para ver o detalhe.</p>
    <div class="tblwrap" style="margin:0 14px 14px"><table class="ttab"><thead><tr><th>Atleta</th><th class="n">Minutos</th><th class="n">UT presentes</th><th class="n">Média por UT</th></tr></thead><tbody>
    ${linhas.map(([c,j])=>`<tr data-c="${esc(c)}"><td><b>${esc(j.nome)}</b>${j.esc?` <small class="sub">(${esc(j.esc)})</small>`:""}</td><td class="n"><b>${minT(j.seg)}'</b></td><td class="n">${j.nUT}</td><td class="n">${j.nUT?minT(j.seg/j.nUT)+"'":"–"}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td>Total do grupo</td><td class="n">${minT(tot)}'</td><td class="n">${linhas.reduce((a,[,j])=>a+j.nUT,0)}</td><td class="n">${linhas.length?minT(tot/Math.max(1,linhas.reduce((a,[,j])=>a+j.nUT,0)))+"'":"–"}</td></tr></tfoot></table></div>`;
  $("u-corpo").querySelectorAll("tr[data-c]").forEach(tr=>tr.onclick=()=>folhaDetTempos(F.J[tr.dataset.c]));
  const sg=Object.values(F.semG).sort((a,b)=>b.uts.length-a.uts.length||a.nome.localeCompare(b.nome,"pt"));
  $("u-panel").innerHTML=`<header><h2>Resumo</h2><p class="sub">${F.ls.length} UT · ${linhas.length} atletas presentes · ${minT(tot)}' no total</p></header>
    <div class="add"><h3>Presentes sem grupo <span class="count">${sg.length}</span></h3>${sg.length?`<ul class="evl">${sg.map(x=>`<li><span style="flex:1"><b>${esc(x.nome)}</b> · ${esc(x.uts.map(U=>"UT"+U.numero).join(", "))}</span></li>`).join("")}</ul><p class="sub" style="margin:0">Estiveram presentes mas não estavam em nenhum grupo dos exercícios que contam: esses minutos não entram.</p>`:`<p class="sub" style="margin:0">Todos os presentes estavam num grupo.</p>`}</div>
    <div class="add"><h3>Avisos <span class="count">${F.avisos.length}</span></h3>${F.avisos.length?`<ul class="uavisos">${F.avisos.map((a,i)=>`<li><button class="lnk" data-i="${i}">UT${a.U.numero}</button> ${esc(a.t)}</li>`).join("")}</ul>`:`<p class="sub" style="margin:0">Sem avisos.</p>`}</div>`;
  $("u-panel").querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{ const a=F.avisos[+b.dataset.i]; uModo="ut"; try{ localStorage.setItem("sca-u-modo","ut"); }catch(e){} uCur=a.U.id; renderUT(); }); }
function folhaDetTempos(j){ if(!j) return;
  folha(`<h3>${esc(j.nome)} · ${minT(j.seg)}'</h3><p class="sub" style="margin:0">${j.nUT} ${j.nUT===1?"UT presente":"UT presentes"} · média ${j.nUT?minT(j.seg/j.nUT):0}' por UT.</p>
    <ul class="evl">${j.det.map(d=>`<li style="flex-direction:column;align-items:stretch"><span><b>UT${d.U.numero}</b> · ${esc(dataPt_(d.U.data))}${d.U.matchDay?" · "+esc(d.U.matchDay):""} · <b>${minT(d.seg)}'</b></span>
      ${d.itens.length?`<small class="sub">${d.itens.map(x=>`${esc(x.num)} ${esc(x.nome)}: ${minT(x.seg)}'`).join("<br>")}</small>`:`<small class="sub">Sem minutos (não estava em grupos dos exercícios que contam).</small>`}</li>`).join("")}</ul>
    <div class="actions"><button class="btn primary" data-close>Fechar</button></div>`,()=>{}); }
async function csvTempos(F){ const c=v=>{ const t=String(v??""); return /[;"\n]/.test(t)?`"${t.replace(/"/g,'""')}"`:t; }, m=s=>((s||0)/60).toFixed(1).replace(".",",");
  const filtro=[`Época ${tF.ep}`,tF.mi?`Microciclo ${(F.micros.find(M=>M.id===tF.mi)||{}).n||""}`:"",tF.ut?`UT${(uts[tF.ut]||{}).numero||""}`:""].filter(Boolean).join(" · ");
  const L=[["SCA Performance · Tempos de treino",filtro],[],["Atleta","Minutos","UT presentes","Média por UT (min)"],
    ...Object.values(F.J).sort((a,b)=>b.seg-a.seg||a.nome.localeCompare(b.nome,"pt")).map(j=>[j.nome+(j.esc?` (${j.esc})`:""),m(j.seg),j.nUT,j.nUT?m(j.seg/j.nUT):""]),
    [],["Detalhe por UT e exercício"],["Atleta","UT","Data","Exercício","Minutos"],
    ...Object.values(F.J).flatMap(j=>j.det.flatMap(d=>d.itens.map(x=>[j.nome,"UT"+d.U.numero,dataPt_(d.U.data),`${x.num} ${x.nome}`,m(x.seg)]))),
    ...(Object.keys(F.semG).length?[[],["Presentes sem grupo"],["Atleta","UT"],...Object.values(F.semG).map(x=>[x.nome,x.uts.map(U=>"UT"+U.numero).join(", ")])]:[])];
  const txt="﻿"+L.map(r=>r.map(c).join(";")).join("\r\n"), nomeF=`Tempos_SCA_${tF.ep.replace(".","-")}${tF.mi?"_micro"+((F.micros.find(M=>M.id===tF.mi)||{}).n||""):""}${tF.ut?"_UT"+((uts[tF.ut]||{}).numero||""):""}.csv`;
  let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
  try{ if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([txt],{type:"text/csv"})); a.download=nomeF; document.body.appendChild(a); a.click(); a.remove(); }
    else { await dl.save({filename:nomeF,data:txt}); toast("CSV dos tempos guardado"); } }
  catch(e){ if(e?.code!=="declined") toast("Não foi possível guardar o CSV ("+(e?.code||"erro")+")"); } }
