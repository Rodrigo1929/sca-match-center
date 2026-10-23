/* ---------- Plano semanal (no separador Treino) e calendário de jogos ---------- */
/* Uma semana = segunda a domingo, com manhã e tarde/noite em cada dia (treino, ginásio, viagem, outro) ou folga.
   Os jogos vêm do calendário (um documento por jogo) e aparecem sozinhos no dia certo. O PDF segue o plano que o clube envia. */
const DIAS_SEM=["2ª FEIRA","3ª FEIRA","4ª FEIRA","5ª FEIRA","6ª FEIRA","SÁBADO","DOMINGO"];
const MESES_PT=["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
const TIPOS_SES=[["treino","Treino"],["ginasio","Ginásio"],["viagem","Viagem"],["outro","Outro"]];
const LOCAL_CASA="Campo Municipal Angra do Heroísmo";
const HORAS_SES={manha:{conc:"9:30",ini:"9:45",fim:"11:00"},tarde:{conc:"19:15",ini:"19:30",fim:"21:15"}};
const COMPETICOES=["Campeonato dos Açores","Taça AFAH","Taça de Portugal","Supertaça AFAH","Jogo particular"];
const S_CAL="sca-calendario-v1", S_SEM="sca-semanas-v1";

let calendario={}, semanas={};
try{ calendario=JSON.parse(localStorage.getItem(S_CAL)||"{}")||{}; }catch(e){ calendario={}; }
try{ semanas=JSON.parse(localStorage.getItem(S_SEM)||"{}")||{}; }catch(e){ semanas={}; }
let uModo="ut"; try{ uModo=localStorage.getItem("sca-u-modo")==="semana"?"semana":"ut"; }catch(e){}
let sCur=null; try{ sCur=localStorage.getItem("sca-sem-cur")||null; }catch(e){}

/* ---------- datas ---------- */
const isoDia=x=>`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
const diaMais=(d,n)=>{ const x=new Date(d+"T12:00"); x.setDate(x.getDate()+n); return isoDia(x); };
const segundaDe=d=>diaMais(d,-((new Date(d+"T12:00").getDay()+6)%7));
const diasDaSemana=ini=>Array.from({length:7},(_,i)=>diaMais(ini,i));
const diaNum=d=>new Date(d+"T12:00").getDate();
const diaMesPt=d=>{ const x=new Date(d+"T12:00"); return `${x.getDate()}.${MESES_PT[x.getMonth()]}`; };
const dataCurta=d=>{ const x=new Date(d+"T12:00"); return `${x.getDate()} ${MESES_PT[x.getMonth()].slice(0,3).toLowerCase()}`; };
/* "19h15", "9.30", "930" → "19:15" / "9:30" */
function horaOk(t){ t=String(t??"").trim().toLowerCase().replace(/\s+/g,""); if(!t) return "";
  const m=t.match(/^(\d{1,2})(?:[:h.,]?(\d{2}))?h?$/); if(!m) return ""; const h=+m[1], mi=+(m[2]||0); return h<24&&mi<60?`${h}:${String(mi).padStart(2,"0")}`:""; }
const horaPdf=h=>h?h.replace(":","H"):"";      // 15:00 → 15H00, como no plano do clube

/* ---------- normalização ---------- */
function normSes(o){ if(!o||typeof o!=="object") return null; const s=v=>String(v??"").trim(), n=Math.round(+o.treino);
  return {tipo:TIPOS_SES.some(t=>t[0]===o.tipo)?o.tipo:"treino",txt:s(o.txt),conc:horaOk(o.conc),ini:horaOk(o.ini),fim:horaOk(o.fim),local:s(o.local),treino:isFinite(n)&&n>0?n:0}; }
function normSemana(d){ const s=v=>String(v??"").trim(), ini=/^\d{4}-\d{2}-\d{2}$/.test(s(d.inicio||d.id))?segundaDe(s(d.inicio||d.id)):segundaDe(isoDia(new Date()));
  const dias={}; diasDaSemana(ini).forEach(k=>{ const x=(d.dias||{})[k]||{}; dias[k]={folga:!!x.folga,manha:x.folga?null:normSes(x.manha),tarde:x.folga?null:normSes(x.tarde)}; });
  const n=Math.round(+d.numero);
  return {id:ini,inicio:ini,numero:isFinite(n)&&n>0?n:0,obs:s(d.obs)||"Plano sujeito a alterações",dias,
    criadoPor:s(d.criadoPor),criadoEm:s(d.criadoEm),alteradoPor:s(d.alteradoPor),alteradoEm:s(d.alteradoEm)}; }
function normJogoCal(d){ const s=v=>String(v??"").trim(), im=d.emblema;
  return {id:s(d.id)||uId("j"),data:/^\d{4}-\d{2}-\d{2}$/.test(s(d.data))?s(d.data):isoDia(new Date()),hora:horaOk(d.hora),adversario:s(d.adversario),casa:d.casa!==false,
    competicao:s(d.competicao),jornada:s(d.jornada),local:s(d.local),nota:s(d.nota),
    ...(im&&/^[\w-]{8,64}$/.test(String(im.id||""))?{emblema:{id:String(im.id),w:Math.round(+im.w)||200,h:Math.round(+im.h)||200}}:{}),
    criadoPor:s(d.criadoPor),criadoEm:s(d.criadoEm),alteradoPor:s(d.alteradoPor),alteradoEm:s(d.alteradoEm)}; }
Object.keys(semanas).forEach(id=>{ try{ semanas[id]=normSemana({...semanas[id],id}); }catch(e){ delete semanas[id]; } });
Object.keys(calendario).forEach(id=>{ try{ calendario[id]=normJogoCal({...calendario[id],id}); }catch(e){ delete calendario[id]; } });

const listaSemanas=()=>Object.values(semanas).sort((a,b)=>b.inicio.localeCompare(a.inicio));
const listaJogosCal=()=>Object.values(calendario).sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora));
const jogosDoDia=d=>listaJogosCal().filter(j=>j.data===d);
const turnoDoJogo=j=>j.hora&&+j.hora.split(":")[0]<13?"manha":"tarde";
const localCurto=l=>String(l||"").replace(/Angra do Hero[ií]smo/i,"A.H.");
/* UT do mesmo número de treino (o plano costuma ser feito antes de a UT existir) */
const utDoTreino=n=>n?Object.values(uts).find(U=>U.numero===n)||null:null;

/* ---------- gravação (um documento por semana e por jogo, pela fila pendentes) ---------- */
function guardaSemLocal(){ try{ localStorage.setItem(S_SEM,JSON.stringify(semanas)); }catch(e){} }
function guardaCalLocal(){ try{ localStorage.setItem(S_CAL,JSON.stringify(calendario)); }catch(e){} }
function guardaSemana(S,semRender){ const N=normSemana({...S,alteradoPor:meuId||S.alteradoPor||"",alteradoEm:new Date().toISOString()}); semanas[N.id]=N; guardaSemLocal(); gravaDoc("semanas/"+N.id,N); if(!semRender) renderUT(); return N; }
function editaSemana(id,fn,msg){ const S0=semanas[id]; if(!S0) return; const antes=clone(S0), S=clone(S0); fn(S); guardaSemana(S); if(msg) toast(msg,()=>{ guardaSemana(antes); }); }
function apagaSemana(id){ const S=semanas[id]; if(!S) return; const antes=clone(S); delete semanas[id]; guardaSemLocal(); apagaDoc("semanas/"+id); if(sCur===id) sCur=null; renderUT();
  toast(`Semana ${S.numero||""} apagada`,()=>{ semanas[id]=antes; guardaSemLocal(); gravaDoc("semanas/"+id,antes); sCur=id; renderUT(); }); }
function guardaJogoCal(J){ const N=normJogoCal({...J,alteradoPor:meuId||J.alteradoPor||"",alteradoEm:new Date().toISOString()}); calendario[N.id]=N; guardaCalLocal(); gravaDoc("calendario/"+N.id,N); renderUT(); return N; }
function apagaJogoCal(id){ const J=calendario[id]; if(!J) return; const antes=clone(J); delete calendario[id]; guardaCalLocal(); apagaDoc("calendario/"+id); renderUT();
  toast(`Jogo com ${J.adversario||"adversário"} apagado`,()=>{ calendario[id]=antes; guardaCalLocal(); gravaDoc("calendario/"+id,antes); renderUT(); }); }
function repoeSemanas(Ss,Cs){ if(Ss){ Object.keys(semanas).forEach(id=>{ if(!Ss[id]) apagaDoc("semanas/"+id); }); semanas={}; Object.entries(Ss).forEach(([id,S])=>{ semanas[id]=normSemana({...S,id}); gravaDoc("semanas/"+id,semanas[id]); }); guardaSemLocal(); }
  if(Cs){ Object.keys(calendario).forEach(id=>{ if(!Cs[id]) apagaDoc("calendario/"+id); }); calendario={}; Object.entries(Cs).forEach(([id,J])=>{ calendario[id]=normJogoCal({...J,id}); gravaDoc("calendario/"+id,calendario[id]); }); guardaCalLocal(); }
  renderUT(); }

/* ---------- semana nova: semana-tipo a partir do calendário ---------- */
/* dia de jogo → jogo; dia a seguir a um jogo → folga; véspera de jogo de dia (antes das 17h) → treino de manhã; restantes dias úteis → treino à noite; domingo sem jogo → livre.
   Os treinos são numerados a seguir ao último número usado (UT ou plano). */
/* último nº de treino antes de um dia: UT com data anterior e treinos já planeados em dias anteriores */
function ultimoTreinoAntes(d){ return Math.max(0,...Object.values(uts).filter(U=>U.data&&U.data<d).map(U=>U.numero),
  ...Object.values(semanas).flatMap(S=>Object.entries(S.dias).filter(([k])=>k<d).flatMap(([,z])=>[z.manha,z.tarde]).filter(Boolean).map(x=>x.treino))); }
function semanaTipo(ini){ const dias={}, ds=diasDaSemana(ini);
  let n=ultimoTreinoAntes(ini);
  ds.forEach((d,i)=>{ const jogo=jogosDoDia(d).length, ontem=jogosDoDia(diaMais(d,-1)).length, amanha=jogosDoDia(diaMais(d,1)).some(j=>!j.hora||+j.hora.split(":")[0]<17);
    const ses=t=>({tipo:"treino",...HORAS_SES[t],local:LOCAL_CASA,treino:++n});
    if(jogo) dias[d]={folga:false,manha:null,tarde:null};
    else if(ontem) dias[d]={folga:true,manha:null,tarde:null};
    else if(amanha) dias[d]={folga:false,manha:ses("manha"),tarde:null};
    else if(i<5) dias[d]={folga:false,manha:null,tarde:ses("tarde")};
    else dias[d]={folga:false,manha:null,tarde:null}; });
  return dias; }
function numeroSemana(ini){ const ant=semanas[diaMais(ini,-7)]; if(ant&&ant.numero) return ant.numero+1;
  const U1=Object.values(uts).find(U=>U.numero===1&&U.data); return U1?Math.max(1,Math.round((new Date(ini+"T12:00")-new Date(segundaDe(U1.data)+"T12:00"))/6048e5)+1):1; }
function novaSemana(){ const ls=listaSemanas(), hoje=segundaDe(isoDia(new Date()));
  let ini=ls.length?diaMais(ls[0].inicio,7):hoje; if(!ls.length&&new Date().getDay()>=5) ini=diaMais(hoje,7);   // de sexta em diante, prepara-se a semana seguinte
  if(semanas[ini]){ sCur=ini; renderUT(); return; }
  const S=guardaSemana({id:ini,inicio:ini,numero:numeroSemana(ini),dias:semanaTipo(ini),criadoPor:meuId||"",criadoEm:new Date().toISOString()},true);
  sCur=S.id; renderUT(); toast(`Semana de ${diaMesPt(ini).toLowerCase()} criada a partir do calendário · ajusta o que for preciso`); }

/* ---------- ecrã ---------- */
function modoUTHtml(){ return `<div class="seg u-modo"><button data-m="ut" aria-pressed="${uModo==="ut"}">Unidades de Treino</button><button data-m="semana" aria-pressed="${uModo==="semana"}">Plano semanal</button></div>`; }
function ligaModoUT(nav){ nav.querySelectorAll(".u-modo button").forEach(b=>b.onclick=()=>{ uModo=b.dataset.m; try{ localStorage.setItem("sca-u-modo",uModo); }catch(e){} renderUT(); }); }
function renderSemana(){ const ls=listaSemanas(); let S=semanas[sCur]||ls.find(x=>x.inicio<=isoDia(new Date())&&diaMais(x.inicio,6)>=isoDia(new Date()))||ls[0]||null; sCur=S?S.id:null;
  try{ localStorage.setItem("sca-sem-cur",sCur||""); }catch(e){}
  renderSemNav(ls,S); renderSemCorpo(S); renderSemPainel(S); }
function renderSemNav(ls,S){ const nav=$("u-nav");
  nav.innerHTML=modoUTHtml()+`<button class="newl" id="s-nova">+ Nova semana</button><div class="grp"><h3>Planos semanais</h3><ul>${ls.length?ls.map(x=>{ const fim=diaMais(x.inicio,6), jg=listaJogosCal().filter(j=>j.data>=x.inicio&&j.data<=fim);
    return `<li><button data-id="${esc(x.id)}" aria-current="${!!S&&x.id===S.id}"><span class="n">${x.numero||"–"}</span><span class="m-nm">${esc(dataCurta(x.inicio))} a ${esc(dataCurta(fim))}<small>${esc(jg.length?jg.map(j=>"vs "+(j.adversario||"?")).join(" · "):"sem jogo")}</small></span></button></li>`; }).join(""):`<li><span class="m-nada">Ainda sem planos</span></li>`}</ul></div>`;
  ligaModoUT(nav); $("s-nova").onclick=novaSemana;
  nav.querySelectorAll("button[data-id]").forEach(b=>{ b.onclick=()=>{ sCur=b.dataset.id; renderUT(); };
    b.oncontextmenu=e=>{ const X=semanas[b.dataset.id]; if(X) menuContexto(e,[[`🗑 Apagar semana ${X.numero||""}`,()=>apagaSemana(X.id),"perigo"]]); }; }); }
/* célula de uma sessão no ecrã (o mesmo texto do PDF) */
function sesLinhas(x){ if(!x) return null; const r=[];
  if(x.conc) r.push(["Concentração:",""],[x.conc,"b"]); if(x.local) r.push([localCurto(x.local).toUpperCase(),""]);
  const tit=x.tipo==="treino"?`TREINO${x.treino?" "+x.treino:""}`:x.tipo==="ginasio"?"GINÁSIO":x.tipo==="viagem"?"VIAGEM":(x.txt||"OUTRO").toUpperCase();
  r.push(["",""],[tit,"t"]); if(x.tipo!=="outro"&&x.txt) r.push([x.txt,""]); if(x.ini||x.fim) r.push([[x.ini,x.fim].filter(Boolean).join(" - "),"b"]); return r; }
function jogoLinhas(j){ return [["VS","b"],[(j.adversario||"Adversário").toUpperCase(),"b"],[horaPdf(j.hora),"b"],[j.jornada.toUpperCase(),""],[j.competicao.toUpperCase(),""]].filter(l=>l[0]); }
function renderSemCorpo(S){ const bx=$("u-corpo"), bar=$("u-bar"), tg=$("u-tag");
  if(!S){ $("u-tit").textContent="Plano semanal"; tg.hidden=true; bar.innerHTML="";
    bx.innerHTML=`<div class="m-vazio"><b>Ainda não há planos semanais.</b><span>O plano da semana (folga, treinos, jogo e locais) faz-se a partir do calendário de jogos e sai em PDF igual ao que o clube envia aos jogadores e à direção.</span><button class="btn primary" id="s-nova2">+ Criar o plano desta semana</button></div>`;
    $("s-nova2").onclick=novaSemana; return; }
  const ds=diasDaSemana(S.inicio), fim=ds[6];
  $("u-tit").textContent=`Semana ${S.numero||"–"} · ${dataCurta(S.inicio)} a ${dataCurta(fim)}`; tg.hidden=false; tg.textContent="PLANO"; tg.style.background="#C00000";
  bar.innerHTML=`<button class="btn sm" id="s-cab">✎ Semana e observações</button><button class="btn sm" id="s-jogo">+ Jogo</button><button class="btn sm primary" id="s-pdf">⬇ PDF do plano</button>`;
  $("s-cab").onclick=()=>folhaCabSemana(S.id); $("s-jogo").onclick=()=>folhaJogoCal(null,S.inicio); $("s-pdf").onclick=e=>guardaPdfSemana(S.id,e.currentTarget);
  const cel=(d,t)=>{ const D=S.dias[d], jg=jogosDoDia(d).filter(j=>turnoDoJogo(j)===t);
    if(jg.length) return `<td class="ps-jogo" data-j="${esc(jg[0].id)}">${jogoLinhas(jg[0]).map(([t_,c])=>`<span class="${c}">${esc(t_)}</span>`).join("")}${jg.length>1?`<small>+${jg.length-1} jogo</small>`:""}</td>`;
    const L=sesLinhas(D[t]); if(!L) return `<td class="ps-vazio" data-d="${d}" data-t="${t}" title="Tocar para marcar"></td>`;
    const U=D[t].tipo==="treino"?utDoTreino(D[t].treino):null, uOk=U&&U.data===d;
    return `<td class="ps-ses" data-d="${d}" data-t="${t}">${L.map(([t_,c])=>t_?`<span class="${c}">${esc(t_)}</span>`:"<i></i>").join("")}${uOk?`<small class="ps-ut" title="A UT deste treino já está feita">UT${U.numero} ✓</small>`:""}</td>`; };
  const loc=(d,t)=>{ const jg=jogosDoDia(d).filter(j=>turnoDoJogo(j)===t)[0], x=S.dias[d][t], l=jg?(jg.local||(jg.casa?LOCAL_CASA:"")):x?x.local:"";
    return `<td class="ps-loc${l?"":" vazio"}">${esc(l.toUpperCase())}</td>`; };
  let h=`<div class="psem-wrap"><table class="psem"><thead><tr><th>PLANO SEMANAL</th>${DIAS_SEM.map(x=>`<th>${x}</th>`).join("")}</tr>
    <tr class="ps-dia"><td><b>${String(S.numero||"–").padStart(2,"0")}</b></td>${ds.map(d=>`<td>DIA ${diaNum(d)}</td>`).join("")}</tr></thead><tbody>`;
  h+=`<tr><th>MANHÃ</th>${ds.map((d,i)=>S.dias[d].folga&&!jogosDoDia(d).length?`<td class="ps-folga" rowspan="3" data-d="${d}" data-t="manha">${"FOLGA".split("").map(c=>`<b>${c}</b>`).join("")}</td>`:cel(d,"manha")).join("")}</tr>`;
  h+=`<tr><th>LOCAL</th>${ds.map(d=>S.dias[d].folga&&!jogosDoDia(d).length?"":loc(d,"manha")).join("")}</tr>`;
  h+=`<tr><th>TARDE | NOITE</th>${ds.map(d=>S.dias[d].folga&&!jogosDoDia(d).length?"":cel(d,"tarde")).join("")}</tr>`;
  h+=`<tr><th>LOCAL</th>${ds.map(d=>S.dias[d].folga&&!jogosDoDia(d).length?`<td class="ps-loc vazio"></td>`:loc(d,"tarde")).join("")}</tr>`;
  h+=`<tr class="ps-obs"><th>OBSERVAÇÕES</th><td colspan="7">⚠ ${esc(S.obs.toUpperCase())}</td></tr></tbody></table></div>
    <p class="sub" style="margin:8px 14px">Toca num dia para marcar treino, folga ou outra atividade. Os jogos vêm do calendário (painel ao lado). Atualizado a ${esc(S.alteradoEm?new Date(S.alteradoEm).toLocaleDateString("pt-PT"):"–")}.</p>`;
  bx.innerHTML=h;
  bx.querySelectorAll("td[data-d]").forEach(td=>{ td.onclick=()=>folhaSessao(S.id,td.dataset.d,td.dataset.t); });
  bx.querySelectorAll("td[data-j]").forEach(td=>{ td.onclick=()=>folhaJogoCal(td.dataset.j); }); }
function renderSemPainel(S){ const pn=$("u-panel"), hoje=isoDia(new Date()), prox=listaJogosCal().filter(j=>j.data>=(S?S.inicio:hoje)).slice(0,8), ant=listaJogosCal().filter(j=>j.data<(S?S.inicio:hoje)).slice(-3);
  const li=j=>`<li><span style="flex:1"><b>${esc(dataPt_(j.data).slice(0,5))}${j.hora?" · "+esc(j.hora):""}</b> · ${j.casa?"vs":"@"} ${esc(j.adversario||"?")}<br><small class="sub">${esc([j.competicao,j.jornada].filter(Boolean).join(" · "))}</small></span><button class="btn sm ghost" data-jc="${esc(j.id)}">✎</button></li>`;
  pn.innerHTML=`<header><h2>Calendário de jogos</h2><p class="sub">Oficiais e jogos-treino. Entram no plano no dia do jogo e servem para a folga e a véspera da semana nova.</p></header>
    <div class="add"><h3>Próximos jogos</h3>${prox.length?`<ul class="evl">${prox.map(li).join("")}</ul>`:`<p class="sub" style="margin:0">Sem jogos marcados.</p>`}<button class="btn sm" id="s-jn">+ Jogo</button></div>
    ${ant.length?`<div class="add"><h3>Últimos jogos</h3><ul class="evl">${ant.reverse().map(li).join("")}</ul></div>`:""}`;
  pn.querySelectorAll("[data-jc]").forEach(b=>b.onclick=()=>folhaJogoCal(b.dataset.jc)); $("s-jn").onclick=()=>folhaJogoCal(null,S?S.inicio:hoje); }

/* ---------- folhas ---------- */
function folhaSessao(sid,d,t){ const S=semanas[sid]; if(!S) return; const D=S.dias[d], x=D[t]||null, ix=diasDaSemana(S.inicio).indexOf(d);
  let tipo=D.folga?"folga":x?x.tipo:"livre"; const base=x||{...HORAS_SES[t],local:LOCAL_CASA,treino:0};
  const sug=x&&x.treino?x.treino:ultimoTreinoAntes(t==="tarde"&&D.manha?diaMais(d,1):d)+1;
  const locais=[...new Set([LOCAL_CASA,...Object.values(semanas).flatMap(Z=>Object.values(Z.dias).flatMap(z=>[z.manha,z.tarde]).filter(Boolean).map(z=>z.local)),...listaJogosCal().map(j=>j.local)].filter(Boolean))];
  folha(`<h3>${DIAS_SEM[ix]} · dia ${diaNum(d)} · ${t==="manha"?"manhã":"tarde / noite"}</h3>
    <div class="seg" id="ss-t">${[["livre","Livre"],...TIPOS_SES,["folga","Folga (dia todo)"]].map(([k,n])=>`<button data-k="${k}">${n}</button>`).join("")}</div>
    <div id="ss-c"><div class="fields"><label class="f">Concentração<input type="text" id="ss-cc" inputmode="numeric" value="${esc(base.conc)}" placeholder="19:15"></label>
      <label class="f">Início<input type="text" id="ss-i" inputmode="numeric" value="${esc(base.ini)}" placeholder="19:30"></label><label class="f">Fim<input type="text" id="ss-f" inputmode="numeric" value="${esc(base.fim)}" placeholder="21:15"></label></div>
      <label class="f">Local<input type="text" id="ss-l" list="ss-ll" value="${esc(base.local)}"><datalist id="ss-ll">${locais.map(l=>`<option value="${esc(l)}">`).join("")}</datalist></label>
      <div class="fields"><label class="f" id="ss-nb">Treino nº<input type="text" id="ss-n" inputmode="numeric" value="${base.treino||sug}"></label><label class="f">Texto (opcional)<input type="text" id="ss-x" value="${esc(base.txt||"")}" placeholder="Ex.: Ginásio Clube · Viagem para S. Miguel"></label></div>
      <p class="sub" id="ss-ut" style="margin:0"></p></div>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ss-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=y=>s.querySelector(y), pinta=()=>{ s.querySelectorAll("#ss-t button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===tipo))); q("#ss-c").hidden=tipo==="livre"||tipo==="folga"; q("#ss-nb").hidden=tipo!=="treino"; mostraUT(); };
    const mostraUT=()=>{ const n=Math.round(+q("#ss-n").value), U=tipo==="treino"?utDoTreino(n):null, p=q("#ss-ut");
      p.innerHTML=tipo!=="treino"?"":U?`${U.data===d?`A UT${n} deste dia já está feita.`:`Atenção: a UT${n} existente é de ${esc(dataPt_(U.data))}, não deste dia.`} <button class="btn sm" id="ss-abre">Abrir UT${n}</button>`:`Ainda não há UT${n||""}. Cria-se no separador Unidades de Treino quando o treino for preparado.`;
      const a=q("#ss-abre"); if(a) a.onclick=()=>{ fecha(); uModo="ut"; try{ localStorage.setItem("sca-u-modo","ut"); }catch(e){} uCur=U.id; renderUT(); }; };
    s.querySelectorAll("#ss-t button").forEach(b=>b.onclick=()=>{ tipo=b.dataset.k; pinta(); }); q("#ss-n").oninput=mostraUT; pinta();
    q("#ss-ok").onclick=()=>{ const hs=["#ss-cc","#ss-i","#ss-f"].map(y=>q(y).value.trim());
      if(tipo!=="livre"&&tipo!=="folga"&&hs.some(h=>h&&!horaOk(h))){ toast("Hora que não percebo. Usa por exemplo 19:30."); return; } fecha();
      editaSemana(sid,Z=>{ const z=Z.dias[d];
        if(tipo==="folga"){ Z.dias[d]={folga:true,manha:null,tarde:null}; return; }
        z.folga=false; z[t]=tipo==="livre"?null:{tipo,conc:hs[0],ini:hs[1],fim:hs[2],local:q("#ss-l").value.trim(),txt:q("#ss-x").value.trim(),treino:tipo==="treino"?Math.round(+q("#ss-n").value)||0:0}; },
        tipo==="folga"?`Folga no dia ${diaNum(d)}`:tipo==="livre"?"Período livre":"Plano atualizado"); }; }); }
function folhaCabSemana(sid){ const S=semanas[sid]; if(!S) return;
  folha(`<h3>Semana de ${esc(diaMesPt(S.inicio).toLowerCase())} a ${esc(diaMesPt(diaMais(S.inicio,6)).toLowerCase())}</h3>
    <label class="f">Nº da semana (plano semanal)<input type="text" id="sc-n" inputmode="numeric" value="${S.numero||""}"></label>
    <label class="f">Observações<textarea id="sc-o" rows="2">${esc(S.obs)}</textarea></label>
    <div class="actions"><button class="btn danger l" id="sc-del">Apagar semana</button><button class="btn" data-close>Cancelar</button><button class="btn primary" id="sc-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=y=>s.querySelector(y);
    confirma2(q("#sc-del"),"Toca outra vez",()=>{ fecha(); apagaSemana(sid); });
    q("#sc-ok").onclick=()=>{ fecha(); editaSemana(sid,Z=>{ Z.numero=Math.round(+q("#sc-n").value)||0; Z.obs=q("#sc-o").value.trim(); },"Semana guardada"); }; }); }
function folhaJogoCal(id,dataSug){ const J=id?calendario[id]:null; let casa=J?J.casa:true;
  const comps=[...new Set([...COMPETICOES,...listaJogosCal().map(j=>j.competicao)].filter(Boolean))];
  folha(`<h3>${J?"Jogo do calendário":"Novo jogo no calendário"}</h3>
    <div class="fields"><label class="f">Data<input type="date" id="jc-d" value="${esc(J?J.data:dataSug||isoDia(new Date()))}"></label><label class="f">Hora<input type="text" id="jc-h" inputmode="numeric" value="${esc(J?J.hora:"")}" placeholder="15:00"></label></div>
    <label class="f">Adversário<input type="text" id="jc-a" value="${esc(J?J.adversario:"")}" placeholder="Ex.: Boavista CR"></label>
    <div class="seg" id="jc-c"><button data-k="1">Em casa</button><button data-k="">Fora</button></div>
    <div class="fields"><label class="f">Competição<input type="text" id="jc-p" list="jc-pl" value="${esc(J?J.competicao:"")}"><datalist id="jc-pl">${comps.map(c=>`<option value="${esc(c)}">`).join("")}</datalist></label>
      <label class="f">Jornada / fase<input type="text" id="jc-j" value="${esc(J?J.jornada:"")}" placeholder="Ex.: 3ª Jornada"></label></div>
    <label class="f">Local<input type="text" id="jc-l" value="${esc(J?J.local:"")}" placeholder="${esc(LOCAL_CASA)}"></label>
    <h4>Emblema do adversário (opcional)</h4><div class="jc-emb">${J&&J.emblema?`<img alt="Emblema">`:`<span class="sub">Sem emblema</span>`}<button class="btn sm" id="jc-e" disabled>Carregar emblema</button><input type="file" id="jc-ef" accept="image/*" hidden></div><p class="sub" id="jc-st" style="margin:0"></p>
    <div class="actions">${J?`<button class="btn danger l" id="jc-del">Apagar jogo</button>`:""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="jc-ok">Guardar</button></div>`,async(s,fecha)=>{
    const q=y=>s.querySelector(y), st=q("#jc-st"); let emb=J&&J.emblema?J.emblema:null;
    const pinta=()=>s.querySelectorAll("#jc-c button").forEach(b=>b.setAttribute("aria-pressed",String(!!b.dataset.k===casa)));
    s.querySelectorAll("#jc-c button").forEach(b=>b.onclick=()=>{ casa=!!b.dataset.k; pinta(); }); pinta();
    const img=q(".jc-emb img"); if(img){ img.src=srcImagem(emb); img.onerror=()=>{ img.replaceWith(Object.assign(document.createElement("span"),{className:"sub",textContent:"Emblema guardado (sem rede para o mostrar)."})); }; }
    if(q("#jc-del")) confirma2(q("#jc-del"),"Toca outra vez",()=>{ fecha(); apagaJogoCal(id); });
    q("#jc-ok").onclick=()=>{ const d=q("#jc-d").value, h=q("#jc-h").value.trim(), a=q("#jc-a").value.trim();
      if(!/^\d{4}-\d{2}-\d{2}$/.test(d)){ toast("Escolhe a data do jogo."); return; } if(h&&!horaOk(h)){ toast("Hora que não percebo. Usa por exemplo 15:00."); return; } if(!a){ toast("Escreve o adversário."); return; }
      fecha(); guardaJogoCal({...(J||{criadoPor:meuId||"",criadoEm:new Date().toISOString()}),id:id||uId("j"),data:d,hora:h,adversario:a,casa,competicao:q("#jc-p").value.trim(),jornada:q("#jc-j").value.trim(),local:q("#jc-l").value.trim(),emblema:emb||undefined});
      toast(J?"Jogo guardado":`Jogo com ${a} no calendário`); };
    const A=await assetsEx(); if(!A){ st.textContent="Para carregar o emblema é preciso acesso de edição ao link no claude.ai."; return; }
    const be=q("#jc-e"); be.disabled=false; be.onclick=()=>q("#jc-ef").click();
    q("#jc-ef").onchange=async()=>{ const f=q("#jc-ef").files[0]; if(!f) return; be.disabled=true; st.textContent="A enviar o emblema…";
      try{ const {blob,w,h}=await reduzImagem(f,400,true); const r=await A.upload(blob,{type:"image/png"}); xImgUrl[r.id]=r.url; emb={id:r.id,w,h}; st.textContent="Emblema carregado · carrega em Guardar."; }
      catch(e){ be.disabled=false; st.textContent=(e&&ERR_ASSETS[e.code])||"Não foi possível carregar o emblema."; } }; }); }

/* ---------- PDF: o plano semanal do clube (A4 deitado) ---------- */
async function blobDataUrl(u){ const r=await fetch(u); if(!r.ok) throw new Error("img"); const b=await r.blob();
  return await new Promise((ok,ko)=>{ const fr=new FileReader(); fr.onload=()=>ok(fr.result); fr.onerror=ko; fr.readAsDataURL(b); }); }
async function pdfSemana(S){
  if(!window.jspdf) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const doc=new window.jspdf.jsPDF({unit:"pt",format:"a4",orientation:"landscape"});
  /* letra condensada da app (a do plano do clube é parecida); se falhar, Helvetica */
  let F="helvetica"; try{ ["400","700"].forEach(p=>{ const b=IMG_DATA[`fonts/rc-${p}.ttf`].split(",")[1]; doc.addFileToVFS(`rc-${p}.ttf`,b); doc.addFont(`rc-${p}.ttf`,"RC",p==="700"?"bold":"normal"); }); doc.setFont("RC","normal"); F="RC"; }catch(e){ F="helvetica"; }
  const RED=[192,0,0], INK=[0,0,0], BR=[255,255,255], CINZ=[128,128,128], ESC=[64,64,64], CL=[217,217,217], FOL=[252,228,160], LAR=[255,102,0];
  const T=(t,x,y,s,o={})=>{ doc.setFont(F,o.b?"bold":"normal"); doc.setFontSize(s); doc.setTextColor(...(o.c||INK)); doc.text(F==="RC"?String(t):pdfTxt(t),x,y,{align:o.al||"center",baseline:"middle"});
    if(o.u){ const w=doc.getTextWidth(String(t)); doc.setDrawColor(...(o.c||INK)); doc.setLineWidth(.6); doc.line(x-w/2,y+s*.45,x+w/2,y+s*.45); } };
  const box=(x,y,w,h,cor,linha=true)=>{ if(cor){ doc.setFillColor(...cor); doc.rect(x,y,w,h,"F"); } if(linha){ doc.setDrawColor(...INK); doc.setLineWidth(.5); doc.rect(x,y,w,h); } };
  const X0=27, W0=788, cl=98.6, cw=(W0-cl)/7, xc=i=>X0+cl+i*cw;
  const ds=diasDaSemana(S.inicio), fim=ds[6];
  /* cabeçalho */
  let y=44; const hA=26, hB=18, hC=15, hD=17.5, hE=26.5, hM=147, hL=26.5;
  box(X0,y,cl,hA+hB+hC,BR); try{ doc.addImage(IMG_DATA["slides/af.png"],"PNG",X0+cl/2-17,y+4,34,43); }catch(e){}
  box(xc(0),y,cw*1.5,hA,RED); box(xc(1.5),y,cw*3,hA,BR); T("PLANEAMENTO SEMANAL",xc(1.5)+cw*1.5,y+hA/2,11,{b:1});
  box(xc(4.5),y,cw*1.5,hA,RED); T("SC ANGRENSE",xc(4.5)+cw*.75,y+hA/2,11,{c:BR});
  box(xc(6),y,cw,hA+hB+hC,BR); try{ doc.addImage(IMG_DATA["slides/logo.png"],"PNG",xc(6)+cw/2-27,y+3,54,52); }catch(e){}
  box(xc(0),y+hA,cw*6,hB,BR); y+=hA+hB;
  const cab=[["SEMANA DE",RED,BR],[diaMesPt(S.inicio),BR,INK],["A",RED,BR],[diaMesPt(fim),BR,INK],["ACTUALIZAÇÃO",RED,BR],[S.alteradoEm?new Date(S.alteradoEm).toLocaleDateString("pt-PT"):"",BR,INK],[epocaDe(S.inicio).replace(".","").replace(/^(\d\d)(\d\d)$/,"20$1 | 20$2"),RED,BR]];
  cab.forEach(([t,f,c],i)=>{ const x=i?xc(i-1):X0, w=i?cw:cl; box(x,y,w,hC,f); T(t,x+w/2,y+hC/2,8,{c}); }); y+=hC;
  box(X0,y,W0,hD,INK); T("PLANO SEMANAL",X0+cl/2,y+hD/2,8,{c:BR}); DIAS_SEM.forEach((d,i)=>T(d,xc(i)+cw/2,y+hD/2,8,{c:BR})); y+=hD;
  box(X0,y,cl,hE,BR); T(String(S.numero||"").padStart(2,"0"),X0+cl/2,y+hE/2,10,{b:1}); ds.forEach((d,i)=>{ box(xc(i),y,cw,hE,CL); T(`DIA ${diaNum(d)}`,xc(i)+cw/2,y+hE/2,8); }); y+=hE;
  /* emblemas dos adversários desta semana */
  const emb={}; for(const j of listaJogosCal().filter(j=>j.data>=S.inicio&&j.data<=fim&&j.emblema)){ try{ emb[j.id]=await blobDataUrl(srcImagem(j.emblema)); }catch(e){} }
  const yM=y, yLM=yM+hM, yT=yLM+hL, yLT=yT+hM;
  [["MANHÃ",yM,hM],["LOCAL",yLM,hL],["TARDE | NOITE",yT,hM],["LOCAL",yLT,hL]].forEach(([t,yy,h])=>{ box(X0,yy,cl,h,CL); T(t,X0+cl/2,yy+h/2,9,{b:1}); });
  const blocoTxt=(linhas,x,y0,h,cor)=>{ const alt=linhas.reduce((a,l)=>a+(l.gap||l.s*1.35),0); let yy=y0+(h-alt)/2;
    linhas.forEach(l=>{ if(l.gap){ yy+=l.gap; return; } yy+=l.s*.68; T(l.t,x,yy,l.s,{b:l.b,c:l.c||cor,u:l.u}); yy+=l.s*.67; }); };
  /* local na faixa escura: "CAMPO MUNICIPAL / ANGRA DO HEROÍSMO", como no plano do clube */
  const localPdf=(l,x,yl)=>{ box(x,yl,cw,hL,ESC); if(!l) return; doc.setFont(F,"normal"); doc.setFontSize(7); doc.setTextColor(...BR);
    const L=l.toUpperCase(), k=L.search(/ANGRA DO HERO/), ls=k>0?[L.slice(0,k).trim(),L.slice(k)]:doc.splitTextToSize(L,cw-8);
    ls.slice(0,2).forEach((t,i,a)=>doc.text(F==="RC"?t:pdfTxt(t),x+cw/2,yl+hL/2+(i-(a.length-1)/2)*8.5,{align:"center",baseline:"middle"})); };
  ds.forEach((d,i)=>{ const x=xc(i), D=S.dias[d], jogos=jogosDoDia(d);
    if(D.folga&&!jogos.length){ box(x,yM,cw,hM*2+hL,FOL); "FOLGA".split("").forEach((c,k)=>T(c,x+cw/2,yM+hM-30+k*30,22,{b:1})); box(x,yLT,cw,hL,ESC); return; }
    [["manha",yM,yLM],["tarde",yT,yLT]].forEach(([t,yy,yl])=>{ const j=jogos.find(z=>turnoDoJogo(z)===t), x_=D[t];
      if(j){ box(x,yy,cw,hM,LAR); let top=yy+12; if(emb[j.id]){ const e=j.emblema, r=e.w/e.h, eh=34, ew=Math.min(cw-20,eh*r); try{ doc.addImage(emb[j.id],/png/i.test(emb[j.id].slice(0,30))?"PNG":"JPEG",x+cw/2-ew/2,top,ew,eh); }catch(_){} top+=eh+6; }
        blocoTxt(jogoLinhas(j).map(([t_,c],k)=>({t:t_,s:k===1?10:k<3?9:7.5,b:k<3||c==="b",c:BR})),x+cw/2,top,yy+hM-top-8,BR);
        localPdf(j.local||(j.casa?LOCAL_CASA:""),x,yl); return; }
      if(!x_){ box(x,yy,cw,hM,CINZ); box(x,yl,cw,hL,ESC); return; }
      box(x,yy,cw,hM,BR); const L=[];
      if(x_.conc) L.push({t:"CONCENTRAÇÃO:",s:7.5},{t:x_.conc,s:8,b:1}); if(x_.local) L.push({t:localCurto(x_.local).toUpperCase(),s:7.5}); L.push({gap:9});
      L.push({t:x_.tipo==="treino"?`TREINO${x_.treino?" "+x_.treino:""}`:x_.tipo==="ginasio"?"GINÁSIO":x_.tipo==="viagem"?"VIAGEM":(x_.txt||"OUTRO").toUpperCase(),s:8.5,b:1,c:RED,u:1});
      if(x_.tipo!=="outro"&&x_.txt) L.push({t:x_.txt.toUpperCase(),s:7}); if(x_.ini||x_.fim) L.push({t:[x_.ini,x_.fim].filter(Boolean).join(" - "),s:8,b:1});
      blocoTxt(L,x+cw/2,yy,hM,INK);
      localPdf(x_.local,x,yl); }); });
  /* observações e rodapé */
  y=yLT+hL+8; box(X0,y,cl,hE,CL); T("OBSERVAÇÕES",X0+cl/2,y+hE/2,9,{b:1}); box(X0+cl,y,W0-cl,hE,BR);
  const ob=S.obs.toUpperCase(); doc.setFont(F,"bold"); doc.setFontSize(9); const ow=doc.getTextWidth(ob), ox=X0+cl+(W0-cl)/2;
  doc.setFillColor(255,192,0); doc.setDrawColor(...INK); doc.setLineWidth(.6); doc.triangle(ox-ow/2-24,y+hE/2+7,ox-ow/2-8,y+hE/2+7,ox-ow/2-16,y+hE/2-8,"FD"); T("!",ox-ow/2-16,y+hE/2+1.5,8,{b:1});
  T(ob,ox,y+hE/2,9,{b:1}); y+=hE;
  const rod=staffPadrao();
  box(X0,y,W0*.41,16.5,RED); T(rod,X0+W0*.205,y+8.3,7,{c:BR}); box(X0+W0*.41,y,W0*.25,16.5,BR); T("PLANEAMENTO SEMANAL",X0+W0*.535,y+8.3,7,{b:1}); box(X0+W0*.66,y,W0*.34,16.5,RED); T("FUTEBOL - SENIORES",X0+W0*.83,y+8.3,7,{c:BR});
  doc.setDrawColor(...INK); doc.setLineWidth(1.2); doc.rect(X0,44,W0,y+16.5-44);
  return doc; }
async function guardaPdfSemana(id,botao){ const S=semanas[id]; if(!S) return; if(botao) botao.disabled=true; toast("A gerar o PDF do plano semanal…");
  try{ const doc=await pdfSemana(S), buf=doc.output("arraybuffer"), nomeF=`${String(S.numero||"").padStart(2,"0")}SCA_PLANEAMENTO SEMANAL_${S.inicio}.pdf`;
    let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
    if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([buf],{type:"application/pdf"})); a.download=nomeF; document.body.appendChild(a); a.click(); a.remove(); }
    else { await dl.save({filename:nomeF,data:new Uint8Array(buf)}); toast("PDF do plano semanal guardado"); } }
  catch(e){ if(e?.code!=="declined") toast(e?.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet.":"Não foi possível gerar o PDF ("+(e?.code||e?.message||"erro")+")"); }
  finally{ if(botao) botao.disabled=false; } }

/* ---------- sincronização ---------- */
function ligaSemDb(){ if(!db) return;
  const liga=(col,norm,get,set,local)=>db.collection(col).onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
    q.docs.forEach(d=>{ const x=d.data(); if(x){ const c={...x}; delete c.atualizadoEm; try{ m[d.id]=norm({...c,id:d.id}); }catch(e){} } });
    mergeCol(col+"/",m,get()); if(JSON.stringify(m)!==JSON.stringify(get())){ set(m); local(); if(!$("sheet-root").innerHTML) renderUT(); } },()=>{});
  liga("semanas",normSemana,()=>semanas,m=>{ semanas=m; },guardaSemLocal);
  liga("calendario",normJogoCal,()=>calendario,m=>{ calendario=m; },guardaCalLocal); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaSemDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();
