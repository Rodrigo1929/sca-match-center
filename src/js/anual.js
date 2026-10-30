/* ---------- Planeamento anual (no separador Treino) ---------- */
/* Um documento por dia com conteúdo (UT nº, folga, interrupção ou outro) e um por ciclo: microciclos (semana de segunda a domingo, com nº)
   e mesociclos (de/até, com o período). Os jogos vêm do calendário. A semana nova do plano semanal e a UT nova vão buscar aqui
   o nº da UT, as folgas e o nº do microciclo. */
const PERIODOS=[["prep","Período preparatório","#F8CBAD"],["comp","Período competitivo","#C5E0B4"],["trans","Período transitório","#BDD7EE"]];
const TIPOS_DIA=[["livre","Livre"],["ut","UT"],["folga","Folga"],["pausa","Interrupção"],["outro","Outro"]];
const MESES_AB=["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"], DIAS_AB=["D","2ª","3ª","4ª","5ª","6ª","S"];
const A_DIA="sca-anual-v1", A_CIC="sca-ciclos-v1";
let anual={}, ciclos={};
try{ anual=JSON.parse(localStorage.getItem(A_DIA)||"{}")||{}; }catch(e){ anual={}; }
try{ ciclos=JSON.parse(localStorage.getItem(A_CIC)||"{}")||{}; }catch(e){ ciclos={}; }
/* época mostrada: ano em que começa (julho) */
let aEpoca=(()=>{ const h=new Date(); return h.getMonth()>=6?h.getFullYear():h.getFullYear()-1; })();

/* ---------- normalização ---------- */
const diaValido=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||""));
function normDiaAnual(d){ const s=v=>String(v??"").trim(), n=Math.round(+d.ut);
  return {id:s(d.id),tipo:TIPOS_DIA.some(t=>t[0]===d.tipo&&t[0]!=="livre")?d.tipo:"outro",ut:d.tipo==="ut"&&isFinite(n)&&n>0?n:0,txt:s(d.txt),
    alteradoPor:s(d.alteradoPor),alteradoEm:s(d.alteradoEm)}; }
function normCiclo(d){ const s=v=>String(v??"").trim(), n=Math.round(+d.n), tipo=d.tipo==="meso"?"meso":"micro", ini=diaValido(d.inicio)?s(d.inicio):isoDia(new Date());
  const I=tipo==="micro"?segundaDe(ini):ini;
  return {id:s(d.id)||(tipo==="micro"?"micro-"+I:uId("meso")),tipo,n:isFinite(n)&&n>0?n:0,inicio:I,fim:tipo==="micro"?diaMais(I,6):(diaValido(d.fim)&&s(d.fim)>=I?s(d.fim):I),
    periodo:PERIODOS.some(p=>p[0]===d.periodo)?d.periodo:"comp",
    ...(tipo==="meso"?{nome:s(d.nome)}:{objPrin:s(d.objPrin),objSec:s(d.objSec)}),   // v101: designação do mesociclo; objetivos do microciclo (resumo do microciclo)
    alteradoPor:s(d.alteradoPor),alteradoEm:s(d.alteradoEm)}; }
Object.keys(anual).forEach(id=>{ try{ anual[id]=normDiaAnual({...anual[id],id}); }catch(e){ delete anual[id]; } });
Object.keys(ciclos).forEach(id=>{ try{ ciclos[id]=normCiclo({...ciclos[id],id}); }catch(e){ delete ciclos[id]; } });

const diaAnualDe=d=>anual[d]||null;
const microDe=d=>Object.values(ciclos).find(c=>c.tipo==="micro"&&c.inicio<=d&&c.fim>=d)||null;
const mesoDe=d=>Object.values(ciclos).filter(c=>c.tipo==="meso"&&c.inicio<=d&&c.fim>=d).sort((a,b)=>b.inicio.localeCompare(a.inicio))[0]||null;
const listaMesos=()=>Object.values(ciclos).filter(c=>c.tipo==="meso").sort((a,b)=>a.inicio.localeCompare(b.inicio));
const corPeriodo=k=>(PERIODOS.find(p=>p[0]===k)||[])[2]||"#EEE";
/* sigla da competição, como no Excel do clube */
function siglaJogo(j){ const c=semAcento(j.competicao);
  return /afah/.test(c)&&/super/.test(c)?"ST":/afah/.test(c)?"TAT":/campeonato/.test(c)?"CFA":/ilha/.test(c)?"TIT":/portugal/.test(c)?"TP":/particular|treino/.test(c)?"JT":(j.competicao||"J").split(/\s+/).map(w=>w[0]).join("").slice(0,3).toUpperCase(); }
/* último nº de UT antes de um dia (UT feitas e planeadas no anual) */
const ultimaUTAnual=d=>Math.max(0,...Object.values(uts).filter(U=>U.data&&U.data<d).map(U=>U.numero),...Object.values(anual).filter(a=>a.id<d&&a.ut).map(a=>a.ut));
/* Match Day pelo calendário: dia de jogo = MD; até 2 dias depois de um jogo = MD+n; até 6 dias antes do jogo seguinte = MD-n.
   Só os jogos oficiais contam (v101): os jogos-treino não reiniciam a contagem */
const jogoOficial=j=>siglaJogo(j)!=="JT";
function mdAuto(d){ if(!diaValido(d)) return ""; const js=listaJogosCal().filter(jogoOficial); if(js.some(j=>j.data===d)) return "MD";
  const dif=(a,b)=>Math.round((new Date(a+"T12:00")-new Date(b+"T12:00"))/864e5);
  const ant=js.filter(j=>j.data<d).pop(), prox=js.find(j=>j.data>d);
  if(ant&&dif(d,ant.data)<=2) return "MD+"+dif(d,ant.data);
  if(prox&&dif(prox.data,d)<=6) return "MD-"+dif(prox.data,d);
  return ""; }

/* ---------- gravação (um documento por dia e por ciclo, pela fila pendentes) ---------- */
function guardaAnualLocal(){ try{ localStorage.setItem(A_DIA,JSON.stringify(anual)); localStorage.setItem(A_CIC,JSON.stringify(ciclos)); }catch(e){} }
function guardaDiaAnual(d,x,msg){ const antes=anual[d]?clone(anual[d]):null;
  if(!x||x.tipo==="livre"){ delete anual[d]; apagaDoc("anual/"+d); } else { anual[d]=normDiaAnual({...x,id:d,alteradoPor:meuId||"",alteradoEm:new Date().toISOString()}); gravaDoc("anual/"+d,anual[d]); }
  guardaAnualLocal(); renderUT();
  if(msg) toast(msg,()=>{ if(antes){ anual[d]=antes; gravaDoc("anual/"+d,antes); } else { delete anual[d]; apagaDoc("anual/"+d); } guardaAnualLocal(); renderUT(); }); }
function guardaCiclo(C){ const N=normCiclo({...C,alteradoPor:meuId||"",alteradoEm:new Date().toISOString()}); ciclos[N.id]=N; gravaDoc("ciclos/"+N.id,N); guardaAnualLocal(); return N; }
function apagaCiclo(id){ const C=ciclos[id]; if(!C) return; const antes=clone(C); delete ciclos[id]; apagaDoc("ciclos/"+id); guardaAnualLocal(); renderUT();
  toast(`${C.tipo==="meso"?"Mesociclo":"Microciclo"} ${C.n||""} apagado`,()=>{ ciclos[id]=antes; gravaDoc("ciclos/"+id,antes); guardaAnualLocal(); renderUT(); }); }
function repoeAnual(As,Cs){ if(As){ Object.keys(anual).forEach(id=>{ if(!As[id]) apagaDoc("anual/"+id); }); anual={}; Object.entries(As).forEach(([id,x])=>{ anual[id]=normDiaAnual({...x,id}); gravaDoc("anual/"+id,anual[id]); }); }
  if(Cs){ Object.keys(ciclos).forEach(id=>{ if(!Cs[id]) apagaDoc("ciclos/"+id); }); ciclos={}; Object.entries(Cs).forEach(([id,x])=>{ ciclos[id]=normCiclo({...x,id}); gravaDoc("ciclos/"+id,ciclos[id]); }); }
  guardaAnualLocal(); renderUT(); }

/* ---------- ecrã: o ano em meses × dias, como o Excel do clube ---------- */
const mesesEpoca=()=>Array.from({length:12},(_,i)=>{ const m=(6+i)%12, a=aEpoca+(6+i>=12?1:0); return {a,m,dias:new Date(a,m+1,0).getDate()}; });
const isoAMD=(a,m,d)=>`${a}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
function celulaAnual(d){ const js=jogosDoDia(d), A=anual[d];
  if(js.length){ const j=js[0]; return {cls:j.casa?"jogo":"jogo fora",cor:corJogo(j),txt:siglaJogo(j),tit:`${j.casa?"vs":"@"} ${j.adversario||"?"}${j.hora?" · "+j.hora:""} · ${[j.competicao,j.jornada].filter(Boolean).join(" · ")}`}; }
  if(!A) return {cls:"",txt:"",tit:"Livre"};
  if(A.tipo==="ut") return {cls:"ut",txt:String(A.ut||"UT"),tit:`UT ${A.ut||""}${A.txt?" · "+A.txt:""}`};
  if(A.tipo==="folga") return {cls:"folga",txt:"F",tit:"Folga"+(A.txt?" · "+A.txt:"")};
  if(A.tipo==="pausa") return {cls:"pausa",txt:"–",tit:A.txt||"Interrupção"};
  return {cls:"outro",txt:(A.txt||"•").slice(0,3).toUpperCase(),tit:A.txt||"Outro"}; }
function renderAnual(){ renderAnualNav(); renderAnualCorpo(); renderAnualPainel(); }
function renderAnualNav(){ const nav=$("u-nav"), ms=listaMesos().filter(c=>c.fim>=`${aEpoca}-07-01`&&c.inicio<=`${aEpoca+1}-06-30`);
  nav.innerHTML=modoUTHtml()+`<div class="seg a-epoca"><button id="a-ep-ant" aria-label="Época anterior">‹</button><button disabled>Época ${aEpoca}/${String(aEpoca+1).slice(2)}</button><button id="a-ep-seg" aria-label="Época seguinte">›</button></div>
    <button class="newl" id="a-meso-n">+ Mesociclo</button><div class="grp"><h3>Mesociclos</h3><ul>${ms.length?ms.map(c=>`<li><button data-meso="${esc(c.id)}"><span class="n" style="background:${corPeriodo(c.periodo)};color:#1B1A17">${c.n||"–"}</span><span class="m-nm">${esc(dataCurta(c.inicio))} a ${esc(dataCurta(c.fim))}<small>${esc((PERIODOS.find(p=>p[0]===c.periodo)||[])[1]||"")}</small></span></button></li>`).join(""):`<li><span class="m-nada">Sem mesociclos</span></li>`}</ul></div>`;
  ligaModoUT(nav); $("a-ep-ant").onclick=()=>{ aEpoca--; renderUT(); }; $("a-ep-seg").onclick=()=>{ aEpoca++; renderUT(); };
  $("a-meso-n").onclick=()=>folhaMeso(null); nav.querySelectorAll("[data-meso]").forEach(b=>b.onclick=()=>folhaMeso(b.dataset.meso)); }
function renderAnualCorpo(){ const bx=$("u-corpo"), bar=$("u-bar"), tg=$("u-tag"), hoje=isoDia(new Date());
  $("u-tit").textContent=`Planeamento anual ${aEpoca}/${aEpoca+1}`; tg.hidden=false; tg.textContent="ANO"; tg.style.background="#C00000"; bar.innerHTML=`<button class="btn sm" id="a-jogo">+ Jogo</button><button class="btn sm" id="a-pmd">⚙ Padrão MD</button><button class="btn sm primary" id="a-pdf">⬇ PDF do ano</button>`; $("a-pmd").onclick=()=>folhaPadraoMD(); $("a-pdf").onclick=e=>guardaPdfAnual(e.currentTarget);
  $("a-jogo").onclick=()=>folhaJogoCal(null,hoje);
  let h=`<div class="pan-wrap"><table class="pan"><thead><tr><th class="pan-mes"></th>${Array.from({length:31},(_,i)=>`<th>${i+1}</th>`).join("")}</tr></thead><tbody>`;
  mesesEpoca().forEach(({a,m,dias})=>{ const ds=Array.from({length:31},(_,i)=>i<dias?isoAMD(a,m,i+1):null);
    h+=`<tr class="pan-ds"><th class="pan-mes" rowspan="3">${MESES_AB[m]}<small>${a}</small></th>${ds.map(d=>d?`<td class="${[0,6].includes(new Date(d+"T12:00").getDay())?"fds":""}${d===hoje?" hoje":""}">${DIAS_AB[new Date(d+"T12:00").getDay()]}</td>`:`<td class="pan-x"></td>`).join("")}</tr>`;
    /* microciclos: uma célula por troço de semana neste mês, com a cor do período do mesociclo */
    let mi="", i=0; while(i<31){ const d=ds[i]; if(!d){ mi+=`<td class="pan-x"></td>`; i++; continue; } const M=microDe(d);
      if(!M){ mi+=`<td class="pan-mi vazio" data-mi="${segundaDe(d)}" title="Sem microciclo · tocar para criar"></td>`; i++; continue; }
      let k=1; while(i+k<31&&ds[i+k]&&ds[i+k]<=M.fim) k++; const Me=mesoDe(d);
      mi+=`<td class="pan-mi" colspan="${k}" data-mi="${M.inicio}" style="background:${Me?corPeriodo(Me.periodo):"#EEE"}" title="Microciclo ${M.n}${Me?" · Mesociclo "+Me.n:""}">${M.inicio>=ds[i]||i===0?"M"+(M.n||"?"):""}</td>`; i+=k; }
    h+=`<tr class="pan-mic">${mi}</tr>`;
    h+=`<tr class="pan-pl">${ds.map(d=>{ if(!d) return `<td class="pan-x"></td>`; const c=celulaAnual(d); return `<td class="pan-p ${c.cls}" data-d="${d}" title="${esc(c.tit)}"${c.cor?` style="background:${c.cor}"`:""}>${esc(c.txt)}</td>`; }).join("")}</tr>`; });
  h+=`</tbody></table></div><p class="sub" style="margin:8px 14px">Toca num dia para marcar UT, folga, interrupção ou outro; toca na linha dos microciclos para mudar o nº da semana. Os jogos vêm do calendário. O plano semanal e as UT novas vão buscar aqui o nº da UT, as folgas e o microciclo.</p>`;
  bx.innerHTML=h;
  bx.querySelectorAll("td.pan-p").forEach(td=>td.onclick=()=>folhaDiaAnual(td.dataset.d));
  bx.querySelectorAll("td.pan-mi").forEach(td=>td.onclick=()=>folhaMicro(td.dataset.mi)); }
function renderAnualPainel(){ const pn=$("u-panel"), ini=`${aEpoca}-07-01`, fim=`${aEpoca+1}-06-30`, ds=Object.values(anual).filter(a=>a.id>=ini&&a.id<=fim), js=listaJogosCal().filter(j=>j.data>=ini&&j.data<=fim);
  pn.innerHTML=`<header><h2>Resumo da época</h2><p class="sub">${ds.filter(a=>a.tipo==="ut").length} UT planeadas · ${ds.filter(a=>a.tipo==="folga").length} folgas · ${js.length} jogos (${js.filter(j=>j.casa).length} em casa)</p></header>
    <div class="add"><h3>Legenda</h3><div class="pan-leg">${PERIODOS.map(([k,n,c])=>`<span><i style="background:${c}"></i>${n}</span>`).join("")}
      <span><i style="background:${corJogo({casa:true})}"></i>Jogo em casa</span><span><i style="background:${corJogo({casa:false})}"></i>Jogo fora</span><span><i class="folga"></i>Folga</span><span><i class="pausa"></i>Interrupção</span></div>
      <p class="sub" style="margin:6px 0 0">TAT Taça AFAH · CFA Campeonato dos Açores · TIT Taça Ilha Terceira · TP Taça de Portugal · ST Supertaça · JT jogo-treino</p></div>`; }

/* ---------- PDF do planeamento anual (v105): para enviar à direção e aos jogadores quando há alterações ----------
   Página 1 = a grelha do ecrã (meses × dias, microciclos com a cor do período, jogos com a cor casa / fora), legenda e mesociclos.
   Página 2 = calendário de jogos da época. Data de atualização = a última alteração no anual, nos ciclos ou nos jogos da época. */
async function pdfAnual(){ await carregaJsPdf(false);
  const doc=new window.jspdf.jsPDF({unit:"pt",format:"a4",orientation:"landscape"}), PW=841.89, ini=`${aEpoca}-07-01`, fim=`${aEpoca+1}-06-30`;
  let F="helvetica"; try{ ["400","700"].forEach(p=>{ const b=IMG_DATA[`fonts/rc-${p}.ttf`].split(",")[1]; doc.addFileToVFS(`rc-${p}.ttf`,b); doc.addFont(`rc-${p}.ttf`,"RC",p==="700"?"bold":"normal"); }); F="RC"; }catch(e){ F="helvetica"; }
  const rgb=h=>[1,3,5].map(i=>parseInt(String(h).slice(i,i+2),16)||0), RED=[192,0,0], INK=[27,26,23], BR=[255,255,255], LIN=[207,202,192];
  const T=(t,x,y,s,o={})=>{ doc.setFont(F,o.b?"bold":"normal"); doc.setFontSize(s); doc.setTextColor(...(o.c||INK)); doc.text(F==="RC"?String(t):pdfTxt(t),x,y,{align:o.al||"center",baseline:"middle"}); };
  const box=(x,y,w,h,cor,linha=LIN)=>{ if(cor){ doc.setFillColor(...cor); doc.rect(x,y,w,h,"F"); } if(linha){ doc.setDrawColor(...linha); doc.setLineWidth(.4); doc.rect(x,y,w,h); } };
  const js=listaJogosCal().filter(j=>j.data>=ini&&j.data<=fim), ms=listaMesos().filter(c=>c.fim>=ini&&c.inicio<=fim);
  const ult=[...Object.values(anual).filter(a=>a.id>=ini&&a.id<=fim),...Object.values(ciclos).filter(c=>c.fim>=ini&&c.inicio<=fim),...js].map(x=>x.alteradoEm||"").sort().pop();
  const atual=new Date(ult||Date.now()).toLocaleDateString("pt-PT"), X0=24, W0=PW-48;
  const cabecalho=tit=>{ const y=22, h=40; box(X0,y,W0,h,null,INK);
    try{ doc.addImage(IMG_DATA["slides/af.png"],"PNG",X0+8,y+4,25,32); }catch(e){}
    try{ doc.addImage(IMG_DATA["slides/logo.png"],"PNG",X0+W0-41,y+3,35,34); }catch(e){}
    box(X0+44,y,170,h/2,RED,null); T("SC ANGRENSE",X0+129,y+h/4,10,{c:BR,b:1}); T(tit,X0+W0/2,y+h/4,13,{b:1});
    box(X0+W0-214,y,170,h/2,RED,null); T(`ÉPOCA ${aEpoca} | ${aEpoca+1}`,X0+W0-129,y+h/4,10,{c:BR,b:1});
    box(X0+44,y+h/2,W0-88,h/2,[242,240,236],null); T(`FUTEBOL - SENIORES   ·   ACTUALIZAÇÃO ${atual}`,X0+W0/2,y+h*.75,8.5,{b:1});
    doc.setDrawColor(...INK); doc.setLineWidth(.8); doc.line(X0+44,y,X0+44,y+h); doc.line(X0+W0-44,y,X0+W0-44,y+h); return y+h+8; };
  /* página 1: a grelha */
  let y=cabecalho("PLANEAMENTO ANUAL");
  const mc=42, dw=(W0-mc)/31, hH=12, hD=9, hM=10.5, hP=14, xd=i=>X0+mc+i*dw;
  box(X0,y,W0,hH,INK,null); for(let i=0;i<31;i++) T(i+1,xd(i)+dw/2,y+hH/2,7,{c:BR,b:1}); y+=hH;
  mesesEpoca().forEach(({a,m,dias})=>{ const ds=Array.from({length:31},(_,i)=>i<dias?isoAMD(a,m,i+1):null), y0=y;
    box(X0,y,mc,hD+hM+hP,INK,null); T(MESES_AB[m],X0+mc/2,y+(hD+hM+hP)/2-4,9,{c:BR,b:1}); T(a,X0+mc/2,y+(hD+hM+hP)/2+6,6.5,{c:BR});
    ds.forEach((d,i)=>{ if(!d){ box(xd(i),y,dw,hD+hM+hP,[244,242,238],null); return; } const dw_=new Date(d+"T12:00").getDay(), fds=dw_===0||dw_===6;
      box(xd(i),y,dw,hD,fds?[238,234,227]:BR); T(DIAS_AB[dw_],xd(i)+dw/2,y+hD/2,5.5,{c:fds?INK:[110,106,98]}); });
    y+=hD; let i=0;
    while(i<31){ const d=ds[i]; if(!d){ i++; continue; } const M=microDe(d); if(!M){ box(xd(i),y,dw,hM,BR); i++; continue; }
      let k=1; while(i+k<31&&ds[i+k]&&ds[i+k]<=M.fim) k++; const Me=mesoDe(d);
      box(xd(i),y,dw*k,hM,rgb(Me?corPeriodo(Me.periodo):"#EEEEEE")); if(M.inicio>=d||i===0) T("M"+(M.n||"?"),xd(i)+dw*k/2,y+hM/2,6.5,{b:1}); i+=k; }
    y+=hM;
    ds.forEach((d,i)=>{ if(!d) return; const c=celulaAnual(d), A=anual[d];
      const fundo=c.cor?rgb(c.cor):c.cls==="folga"?[252,228,160]:c.cls==="pausa"?[255,125,125]:c.cls==="outro"?[230,221,242]:BR;
      box(xd(i),y,dw,hP,fundo); if(c.txt) T(c.txt,xd(i)+dw/2,y+hP/2,c.cls==="outro"?5.5:6.5,{b:1,c:c.cls==="pausa"?BR:INK}); });
    y+=hP; doc.setDrawColor(...INK); doc.setLineWidth(.6); doc.line(X0,y,X0+W0,y); });
  doc.setDrawColor(...INK); doc.setLineWidth(.8); doc.rect(X0,y-12*(hD+hM+hP)-hH,W0,12*(hD+hM+hP)+hH);
  /* legenda e mesociclos */
  y+=12; let x=X0; const leg=[...PERIODOS.map(([k,n,c])=>[n,c]),["Jogo em casa",corJogo({casa:true})],["Jogo fora",corJogo({casa:false})],["Folga","#FCE4A0"],["Interrupção","#FF7D7D"]];
  leg.forEach(([n,c])=>{ box(x,y-4,9,9,rgb(c)); T(n,x+13,y+.5,7.5,{al:"left"}); doc.setFont(F,"normal"); doc.setFontSize(7.5); x+=doc.getTextWidth(F==="RC"?n:pdfTxt(n))+26; });
  y+=13; T("TAT Taça AFAH · CFA Campeonato dos Açores · TIT Taça Ilha Terceira · TP Taça de Portugal · ST Supertaça · JT jogo-treino",X0,y+.5,7,{al:"left",c:[110,106,98]});
  if(ms.length){ y+=14; const cw=W0/Math.min(4,ms.length);
    ms.forEach((c,n)=>{ const cx=X0+(n%4)*cw, cy=y+Math.floor(n/4)*12; box(cx,cy-4.5,14,9,rgb(corPeriodo(c.periodo))); T(c.n||"–",cx+7,cy,6.5,{b:1});
      T(`${dataCurta(c.inicio)} a ${dataCurta(c.fim)}${c.nome?" · "+c.nome:""}`.slice(0,62),cx+18,cy,7,{al:"left"}); }); }
  /* página 2: calendário de jogos */
  doc.addPage(); y=cabecalho("CALENDÁRIO DE JOGOS");
  const cols=[["DATA",70],["HORA",42],["",34],["ADVERSÁRIO",190],["COMPETIÇÃO",200],["JORNADA",120],["LOCAL",W0-656]], hr=js.length>30?12:14;
  /* só a coluna casa / fora leva a cor do jogo; as linhas alternam para se lerem bem impressas */
  const linha=(vals,cor,tinta,b,cj)=>{ let cx=X0; cols.forEach(([,w],n)=>{ box(cx,y,w,hr,n===2&&cj?cj:cor); T(vals[n],n>=3?cx+5:cx+w/2,y+hr/2,7.5,{al:n>=3?"left":"center",c:n===2&&cj?BR:tinta,b:b||n===2||n===3}); cx+=w; }); y+=hr; };
  linha(cols.map(c=>c[0]),INK,BR,1);
  if(!js.length){ T("Sem jogos no calendário desta época.",X0+W0/2,y+20,10); }
  js.forEach((j,n)=>{ const dt=new Date(j.data+"T12:00");
    linha([`${DIAS_AB[dt.getDay()]} ${dt.toLocaleDateString("pt-PT")}`,j.hora||"",j.casa?"CASA":"FORA",j.adversario||"A definir",j.competicao,j.jornada,j.local||(j.casa?"":j.destino)],n%2?[246,244,240]:BR,INK,0,rgb(corJogo(j))); });
  const n=doc.getNumberOfPages(); for(let p=1;p<=n;p++){ doc.setPage(p); T(`SC Angrense · Planeamento anual ${aEpoca}/${aEpoca+1} · actualizado a ${atual} · ${p}/${n}`,PW/2,583,7,{c:[128,128,128]}); }
  return doc; }
async function guardaPdfAnual(botao){ if(botao) botao.disabled=true; toast("A gerar o PDF do planeamento anual…");
  try{ const doc=await pdfAnual(); await guardaFicheiro(`SCA_PLANEAMENTO ANUAL_${aEpoca}-${aEpoca+1}.pdf`,doc.output("arraybuffer"),"application/pdf"); toast("PDF do planeamento anual guardado"); }
  catch(e){ if(e?.code!=="declined") toast(e?.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet.":"Não foi possível gerar o PDF ("+(e?.code||e?.message||"erro")+")"); }
  finally{ if(botao) botao.disabled=false; } }

/* ---------- folhas ---------- */
function folhaDiaAnual(d){ const A=anual[d], js=jogosDoDia(d), M=microDe(d), Me=mesoDe(d); let tipo=A?A.tipo:"livre";
  const sug=A&&A.ut?A.ut:ultimaUTAnual(d)+1, x=new Date(d+"T12:00");
  folha(`<h3>${DIAS_SEM[(x.getDay()+6)%7].toLowerCase()}, ${x.getDate()} ${MESES_PT[x.getMonth()].toLowerCase()} ${x.getFullYear()}</h3>
    <p class="sub" style="margin:0">${[M?"Microciclo "+M.n:"",Me?"Mesociclo "+Me.n+" · "+((PERIODOS.find(p=>p[0]===Me.periodo)||[])[1]||"").toLowerCase():"",mdAuto(d)].filter(Boolean).join(" · ")||"Sem ciclo marcado"}</p>
    ${js.length?`<ul class="evl">${js.map(j=>`<li><span style="flex:1">${j.casa?"vs":"@"} ${esc(j.adversario||"?")}${j.hora?" · "+esc(j.hora):""} · ${esc([j.competicao,j.jornada].filter(Boolean).join(" · "))}</span><button class="btn sm ghost" data-jc="${esc(j.id)}">✎</button></li>`).join("")}</ul>`:""}
    <div class="seg" id="ad-t">${TIPOS_DIA.map(([k,n])=>`<button data-k="${k}">${n}</button>`).join("")}</div>
    <label class="f" id="ad-nb">UT nº<input type="text" id="ad-n" inputmode="numeric" value="${sug}"></label>
    <label class="f" id="ad-xb">Texto<input type="text" id="ad-x" value="${esc(A?A.txt:"")}" placeholder="Ex.: Estágio · Interrupção de Natal · Apresentação"></label>
    <div class="actions"><button class="btn l" id="ad-j">+ Jogo neste dia</button><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ad-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=y=>s.querySelector(y), pinta=()=>{ s.querySelectorAll("#ad-t button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===tipo))); q("#ad-nb").hidden=tipo!=="ut"; q("#ad-xb").hidden=tipo==="livre"; };
    s.querySelectorAll("#ad-t button").forEach(b=>b.onclick=()=>{ tipo=b.dataset.k; pinta(); }); pinta();
    s.querySelectorAll("[data-jc]").forEach(b=>b.onclick=()=>{ fecha(); folhaJogoCal(b.dataset.jc); });
    q("#ad-j").onclick=()=>{ fecha(); folhaJogoCal(null,d); };
    q("#ad-ok").onclick=()=>{ const n=Math.round(+q("#ad-n").value); if(tipo==="ut"&&!(n>0)){ toast("Escreve o nº da UT."); return; } fecha();
      guardaDiaAnual(d,tipo==="livre"?null:{tipo,ut:tipo==="ut"?n:0,txt:q("#ad-x").value.trim()},tipo==="livre"?"Dia livre":tipo==="ut"?`UT ${n} a ${dataCurta(d)}`:`${(TIPOS_DIA.find(t=>t[0]===tipo)||[])[1]} a ${dataCurta(d)}`); }; }); }
function folhaMicro(seg){ const M=Object.values(ciclos).find(c=>c.tipo==="micro"&&c.inicio===seg)||null, ant=Object.values(ciclos).filter(c=>c.tipo==="micro"&&c.inicio<seg).sort((a,b)=>b.inicio.localeCompare(a.inicio))[0];
  folha(`<h3>Microciclo · semana de ${esc(dataCurta(seg))} a ${esc(dataCurta(diaMais(seg,6)))}</h3>
    <label class="f">Nº do microciclo (= nº do plano semanal)<input type="text" id="am-n" inputmode="numeric" value="${M?M.n:(ant?ant.n+1:1)}"></label>
    <label class="f">Objetivos principais<textarea id="am-op" rows="2" class="ta">${esc(M?M.objPrin||"":"")}</textarea></label>
    <label class="f">Objetivos secundários<textarea id="am-os" rows="2" class="ta">${esc(M?M.objSec||"":"")}</textarea></label>
    <p class="sub" style="margin:0">"Renumerar a seguir" põe os microciclos seguintes desta época por ordem (+1 por semana). Os objetivos aparecem no resumo do microciclo.</p>
    <div class="actions">${M?`<button class="btn danger l" id="am-del">Apagar</button>`:""}<button class="btn" id="am-ren">Guardar e renumerar a seguir</button><button class="btn" data-close>Cancelar</button><button class="btn primary" id="am-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=y=>s.querySelector(y), n=()=>Math.round(+q("#am-n").value);
    if(q("#am-del")) confirma2(q("#am-del"),"Toca outra vez",()=>{ fecha(); apagaCiclo(M.id); });
    q("#am-ok").onclick=()=>{ if(!(n()>0)){ toast("Escreve o nº."); return; } fecha(); guardaCiclo({...(M||{}),tipo:"micro",inicio:seg,n:n(),objPrin:q("#am-op").value.trim(),objSec:q("#am-os").value.trim()}); renderUT(); toast(`Microciclo ${n()}`); };
    q("#am-ren").onclick=()=>{ if(!(n()>0)){ toast("Escreve o nº."); return; } fecha(); const fimEp=`${aEpoca+1}-06-30`;
      guardaCiclo({...(M||{}),tipo:"micro",inicio:seg,n:n(),objPrin:q("#am-op").value.trim(),objSec:q("#am-os").value.trim()});
      Object.values(ciclos).filter(c=>c.tipo==="micro"&&c.inicio>seg&&c.inicio<=fimEp).sort((a,b)=>a.inicio.localeCompare(b.inicio)).forEach((c,i)=>{ if(c.n!==n()+i+1) guardaCiclo({...c,n:n()+i+1}); });
      renderUT(); toast(`Microciclos renumerados a partir do ${n()}`); }; }); }
function folhaMeso(id){ const C=id?ciclos[id]:null; let per=C?C.periodo:"comp"; const ult=listaMesos().pop();
  folha(`<h3>${C?"Mesociclo "+C.n:"Novo mesociclo"}</h3>
    <div class="fields"><label class="f">Nº<input type="text" id="ae-n" inputmode="numeric" value="${C?C.n:(ult?ult.n+1:1)}"></label><label class="f">De<input type="date" id="ae-i" value="${esc(C?C.inicio:(ult?diaMais(ult.fim,1):isoDia(new Date())))}"></label><label class="f">Até<input type="date" id="ae-f" value="${esc(C?C.fim:"")}"></label></div>
    <label class="f">Designação<input type="text" id="ae-d" value="${esc(C?C.nome||"":"")}" placeholder="Ex.: ACUMULAÇÃO + COMPETITIVO"></label>
    <h4>Período</h4><div class="seg" id="ae-p">${PERIODOS.map(([k,n])=>`<button data-k="${k}">${n.replace("Período ","")}</button>`).join("")}</div>
    <div class="actions">${C?`<button class="btn danger l" id="ae-del">Apagar</button>`:""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="ae-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=y=>s.querySelector(y), pinta=()=>s.querySelectorAll("#ae-p button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===per)));
    s.querySelectorAll("#ae-p button").forEach(b=>b.onclick=()=>{ per=b.dataset.k; pinta(); }); pinta();
    if(q("#ae-del")) confirma2(q("#ae-del"),"Toca outra vez",()=>{ fecha(); apagaCiclo(id); });
    q("#ae-ok").onclick=()=>{ const n=Math.round(+q("#ae-n").value), i=q("#ae-i").value, f=q("#ae-f").value;
      if(!(n>0)||!diaValido(i)||!diaValido(f)||f<i){ toast("Preenche o nº e as datas (até ≥ de)."); return; } fecha();
      guardaCiclo({...(C||{}),tipo:"meso",n,inicio:i,fim:f,periodo:per,nome:q("#ae-d").value.trim()}); renderUT(); toast(`Mesociclo ${n} guardado`); }; }); }

/* ---------- sincronização ---------- */
function ligaAnualDb(){ if(!db) return;
  const liga=(col,norm,get,set)=>db.collection(col).onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
    q.docs.forEach(d=>{ const x=lerDoc(d); if(x){ const c={...x}; delete c.atualizadoEm; try{ m[d.id]=norm({...c,id:d.id}); }catch(e){} } });
    mergeCol(col+"/",m,get()); if(JSON.stringify(m)!==JSON.stringify(get())){ set(m); guardaAnualLocal(); if(!$("sheet-root").innerHTML) renderUT(); } },()=>{});
  liga("anual",normDiaAnual,()=>anual,m=>{ anual=m; }); liga("ciclos",normCiclo,()=>ciclos,m=>{ ciclos=m; }); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaAnualDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();
