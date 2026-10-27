/* ---------- relatório ---------- */
/* fonte do relatório: o jogo atual ou um jogo arquivado (só leitura, com os registos guardados ao arquivar) */
let relArq="";
function fonteRel(){ const J=relArq&&hist[relArq];
  if(!J) return {arq:null,regs:an.regs,posse:p=>acumAgora(p),estat:()=>estatJogo(),eventos:jogo.eventos||[],video:jogo.video,adversario:jogo.adversario,data:jogo.data,acao:acaoDe,nome,rot};
  const A=J.analise||{}, regs=Array.isArray(A.regs)?A.regs:[], nm={};
  (J.onze||[]).concat(J.suplentes||[]).forEach(o=>{ if(o&&o.nome) nm[o.n]=o.nome; }); regs.forEach(r_=>{ if(r_.j&&r_.nome) nm[r_.j]=r_.nome; });
  const nomeA=n=>nm[n]||"", z={nos:0,eles:0,div:0,fora:0};
  return {arq:J,regs,posse:p=>({...z,...((A.posse||{})[String(p)]||{})}),estat:()=>J.estat||null,eventos:J.eventos||[],video:J.video||null,adversario:J.adversario,data:J.data,
    acao:id=>{ const a=acaoDe(id); if(a.nome!==id) return a; const r_=regs.find(x=>x.ac===id&&x.acao); return r_?{...a,nome:r_.acao}:a; },
    nome:nomeA, rot:n=>nomeA(n)?`${n} · ${nomeA(n)}`:n}; }
function renderJogoRel(F){ const sl=$("r-jogo"); if(!sl) return;
  const js=Object.entries(hist).sort(([,a],[,b])=>String(b.data||b.arquivadoEm).localeCompare(String(a.data||a.arquivadoEm)));
  sl.innerHTML=`<option value="">Jogo atual${jogo.adversario?" · vs "+esc(jogo.adversario):""}</option>`+js.map(([k,J])=>`<option value="${esc(k)}">Arquivo · vs ${esc(J.adversario||"(sem adversário)")} · ${esc(dataPt(J.data))} · ${((J.analise||{}).regs||[]).length} ações</option>`).join("");
  sl.value=F.arq?relArq:""; $("r-arqinfo").hidden=!F.arq; $("a-limpar").hidden=!!F.arq; }
function posseLinhas(F=fonteRel()){ const L_=[]; let T={nos:0,eles:0,div:0,fora:0};
  [1,2].forEach(p=>{ const a=F.posse(p); L_.push(["%s parte".replace("%s",p+"ª"),a]); Object.keys(T).forEach(k=>T[k]+=a[k]); }); L_.push(["Total",T]); return L_; }
function porJogador(F=fonteRel()){ const R=F.regs, usadas=anCfg.acoes.filter(a=>R.some(r_=>r_.ac===a.id));
  const outras=[...new Set(R.map(r_=>r_.ac))].filter(id=>!anCfg.acoes.some(a=>a.id===id)).map(F.acao);
  const cols=[]; [...usadas,...outras].forEach(c=>{ cols.push(c); const ts=[...new Set([...(c.tipos||[]),...R.filter(r_=>r_.ac===c.id&&r_.tipo).map(r_=>r_.tipo)])];
    if(ts.length) ts.forEach(t=>cols.push({...c,tipo:t,nome:"↳ "+t,sub:true})); });
  const chave=r_=>r_.eq==="eles"?"ADV":(r_.j||"COL");
  const linhas=[...new Set(R.map(chave))].sort((a,b)=>(a==="ADV")-(b==="ADV")||(a==="COL")-(b==="COL")||byNum(a,b));
  const rot_=k=>k==="ADV"?"Adversário":k==="COL"?"Coletivo (sem jogador)":F.rot(k);
  const M=linhas.map(k=>[rot_(k),...cols.map(c=>R.filter(r_=>chave(r_)===k&&r_.ac===c.id&&(!c.tipo||r_.tipo===c.tipo)).length)]);
  return {cols,M,linhas}; }
const REMATES=["re","rd","rb","golo"];
function eficacia(regs){ const linhas=[]; const conta=(rs,eq)=>{ const f=rs.filter(x=>x.eq===eq); return {acoes:f.length,rem:f.filter(x=>REMATES.includes(x.ac)).length,enq:f.filter(x=>x.ac==="re"||x.ac==="golo").length,golos:f.filter(x=>x.ac==="golo").length,perdas:f.filter(x=>x.ac==="per").length}; };
  ["org","trans","bp"].forEach(o=>{ const rs=regs.filter(x=>(x.or||"org")===o); linhas.push({nome:ORIG[o],sub:false,nos:conta(rs,"nos"),eles:conta(rs,"eles")});
    if(o==="bp"){ [...new Set(rs.map(x=>x.bpl||""))].forEach(k=>{ const r2=rs.filter(x=>(x.bpl||"")===k); linhas.push({nome:"↳ "+(k?nomeBpl(k):"Sem lance indicado"),sub:true,nos:conta(r2,"nos"),eles:conta(r2,"eles")}); }); } });
  return linhas; }
function renderRelatorio(){
  const F=fonteRel(), R=F.regs, ro=!!F.arq; renderJogoRel(F);
  // posse
  const pl=posseLinhas(F);
  let h=`<table><thead><tr><th></th><th>Nossa</th><th>Adversário</th><th>Dividida</th><th>Bola fora</th><th>Tempo útil</th><th>Tempo total</th><th>Posse</th></tr></thead><tbody>`;
  pl.forEach(([n,a],i)=>{ const util=a.nos+a.eles+a.div, tot=util+a.fora, pos=a.nos+a.eles?Math.round(a.nos/(a.nos+a.eles)*100):null;
    h+=`<tr class="${i===2?"tot":""}"><td>${n}</td><td>${fmt(a.nos)}</td><td>${fmt(a.eles)}</td><td>${fmt(a.div)}</td><td>${fmt(a.fora)}</td><td>${fmt(util)}</td><td>${fmt(tot)}</td><td>${pos==null?"–":pos+"% / "+(100-pos)+"%"}</td></tr>`; });
  $("r-posse").innerHTML=h+"</tbody></table>";
  // por jogador
  const {cols,M}=porJogador(F);
  if(!M.length){ $("r-jog").innerHTML=`<p class="sub">Ainda sem registos.</p>`; }
  else { let t=`<table><thead><tr><th>Jogador</th>${cols.map(c=>`<th${c.sub?' style="font-weight:400;font-style:italic"':''}>${esc(c.nome)}</th>`).join("")}<th>Total</th></tr></thead><tbody>`;
    const somaP=row=>row.slice(1).reduce((a,b,i)=>a+(cols[i].sub?0:b),0);
    M.forEach(row=>{ const tot=somaP(row); t+=`<tr><td>${esc(row[0])}</td>${row.slice(1).map(v=>`<td class="${v?"":"zero"}">${v||"·"}</td>`).join("")}<td><b>${tot}</b></td></tr>`; });
    const tc=cols.map((c,i)=>M.reduce((a,r_)=>a+r_[i+1],0)); t+=`<tr class="tot"><td>Total</td>${tc.map(v=>`<td>${v}</td>`).join("")}<td>${tc.reduce((a,b,i)=>a+(cols[i].sub?0:b),0)}</td></tr>`;
    $("r-jog").innerHTML=t+"</tbody></table>"; }
  { const E=F.estat(); const ad=esc(F.adversario||"Adversário");
    if(!E) $("r-est").innerHTML=`<p class="sub">Este jogo foi arquivado sem estatística.</p>`; else {
    let t=`<table><thead><tr><th>Estatística</th><th>Fonte</th><th>SCA 1ªP</th><th>SCA 2ªP</th><th>SCA total</th><th>${ad} 1ªP</th><th>${ad} 2ªP</th><th>${ad} total</th></tr></thead><tbody>`;
    ESTAT_LINHAS.forEach(([k,l])=>{ const f=E.fonte[k]||(k==="golos"||k.startsWith("am")||k==="vermelho"?"painel":""); const edit=!ro&&VSTATS.some(([x])=>x===k)&&f==="ao vivo";
      const c=(p,e)=>{ const v=p==="t"?E.t[e][k]:E[p][e][k]; const s_=v==null?"–":v+(k==="posse"?"%":""); return edit&&p!=="t"?`<td><button class="btn sm ghost vedit" data-p="${p}" data-e="${e}" data-k="${k}">${s_}</button></td>`:`<td>${p==="t"?"<b>"+s_+"</b>":s_}</td>`; };
      t+=`<tr><td>${l}</td><td class="sub">${f}</td>${c("1","nos")}${c("2","nos")}${c("t","nos")}${c("1","eles")}${c("2","eles")}${c("t","eles")}</tr>`; });
    $("r-est").innerHTML=t+"</tbody></table>";
    $("r-est").querySelectorAll(".vedit").forEach(b=>b.onclick=()=>{ const {p,e,k}=b.dataset;
      folha(`<h3>Corrigir · ${e==="nos"?"SCA":ad}</h3><p class="sub" style="margin:0">${ESTAT_LINHAS.find(x=>x[0]===k)[1]} · ${p}.ª parte (registo ao vivo)</p><label class="f">Valor<input type="text" id="ve-v" inputmode="numeric"></label>
        <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ve-ok">Guardar</button></div>`,(s_,fecha)=>{ const i=s_.querySelector("#ve-v"); i.value=vivo.c[p][e][k]; setTimeout(()=>{ i.focus(); i.select(); },50);
        s_.querySelector("#ve-ok").onclick=()=>{ const n=parseInt(i.value,10); if(isNaN(n)||n<0){ toast("Valor inválido."); return; } const C=clone(vivo.c); C[p][e][k]=n; fecha(); guardaVivo({...vivo,c:C}); renderRelatorio(); }; }); }); } }
  { const cs=F.eventos.filter(e=>e.tipo==="canto"); const box=$("r-cantos");
    if(!cs.length) box.innerHTML=`<p class="sub">Sem cantos registados.</p>`;
    else { const g={}; cs.forEach(e=>{ const k=e.bpl||""; (g[k]=g[k]||[]).push(e); });
      let t=`<table><thead><tr><th>Canto usado</th><th>Nº</th><th>1º poste</th><th>2º poste</th><th>Peq.-área</th><th>Corte</th><th>Final. baliza</th><th>Final. fora</th><th>Cantos (minuto)</th></tr></thead><tbody>`;
      Object.entries(g).forEach(([k,arr])=>{ const n=f=>arr.filter(f).length;
        t+=`<tr><td>${esc(k?nomeBpl(k):"Não indicado")}</td><td><b>${arr.length}</b></td><td>${n(e=>e.zona==="1º")}</td><td>${n(e=>e.zona==="2º")}</td><td>${n(e=>e.zona==="PA")}</td><td>${n(e=>e.res==="C")}</td><td>${n(e=>e.res==="FB")}</td><td>${n(e=>e.res==="FF")}</td><td>${arr.map(e=>ro?`<b>${esc(e.min||"?")}</b>`:`<button class="btn sm ghost rc" data-id="${esc(e.id)}">${esc(e.min||"?")}</button>`).join(" ")}</td></tr>`; });
      box.innerHTML=t+"</tbody></table>"; box.querySelectorAll(".rc").forEach(b=>b.onclick=()=>{ const e=jogo.eventos.find(x=>x.id===b.dataset.id); if(e) folhaEvento("canto",e); }); } }
  { const E=eficacia(R); let t=`<table><thead><tr><th>Origem</th><th>Ações nós</th><th>Remates</th><th>Enquadr.</th><th>Golos</th><th>Perdas</th><th>Remates adv.</th><th>Golos adv.</th></tr></thead><tbody>`;
    E.forEach(L=>{ t+=`<tr${L.sub?' style="color:var(--muted)"':""}><td>${esc(L.nome)}</td><td>${L.nos.acoes}</td><td>${L.nos.rem}</td><td>${L.nos.enq}</td><td><b>${L.nos.golos}</b></td><td>${L.nos.perdas}</td><td>${L.eles.rem}</td><td><b>${L.eles.golos}</b></td></tr>`; });
    $("r-orig").innerHTML=R.length?t+"</tbody></table>":`<p class="sub">Ainda sem registos.</p>`; }
  // filtros mapa
  const fa=$("rf-ac"), fj=$("rf-j"); const va=fa.value, vj=fj.value;
  const acs=ro?[...new Set(R.map(r_=>r_.ac))].map(F.acao):anCfg.acoes;
  fa.innerHTML=`<option value="">Todas as ações</option>`+acs.map(a=>`<option value="${esc(a.id)}">${esc(a.nome)}</option>`).join(""); if([...fa.options].some(o=>o.value===va)) fa.value=va;
  const js=[...new Set(R.filter(r_=>r_.j).map(r_=>r_.j))].sort(byNum);
  fj.innerHTML=`<option value="">Todos os jogadores</option>`+js.map(n=>`<option value="${esc(n)}">${esc(F.rot(n))}</option>`).join(""); if([...fj.options].some(o=>o.value===vj)) fj.value=vj;
  const fe=$("rf-eq").value, fp=$("rf-pt").value;
  const sel=R.filter(r_=>(!fe||r_.eq===fe)&&(!fa.value||r_.ac===fa.value)&&(!fj.value||r_.j===fj.value)&&(!fp||String(r_.parte)===fp));
  const pts=sel.map(r_=>({x:r_.x,y:r_.y,...(r_.x2!=null?{x2:r_.x2,y2:r_.y2,lw:200,tr:r_.tipo==="Drible perdido"?"500 350":"none"}:{}),cor:F.acao(r_.ac).cor,r:950,txt:r_.j||"",op:.9}));
  const m=$("r-mapa"); m.innerHTML=""; m.appendChild(campoAnalise(null,pts));
  { const ul=$("r-lista"); ul.innerHTML=""; const ord=sel.slice().sort((a,b)=>a.parte-b.parte||a.seg-b.seg);
    if(!ro&&(!jogo.video||!ytId(jogo.video.url))){ const li=document.createElement("li"); li.innerHTML=`<span>Configura o vídeo do jogo para teres ▶ em cada lance.</span><a href="#" id="r-cfgv">Configurar vídeo</a>`; ul.appendChild(li); li.querySelector("a").onclick=e=>{ e.preventDefault(); folhaVideo(); }; }
    ord.slice(0,300).forEach(x=>{ const li=document.createElement("li"), u=F.video?linkVideoModo({t:minutoReg(x),parte:x.parte},F.video,"web"):null;
      li.innerHTML=`<span class="t"></span><span></span>${u?`<a target="_blank" rel="noopener">▶ Ver</a>`:""}`; li.children[0].textContent=minutoReg(x);
      li.children[1].textContent=`${descReg(x,F.acao)} · ${x.eq==="eles"?"Adversário":x.j?F.rot(x.j):"Coletivo"}`; if(u) li.querySelector("a").href=u; ul.appendChild(li); }); }
  const cnt={}; sel.forEach(r_=>{ const k=r_.ac+(r_.tipo?"|"+r_.tipo:""); cnt[k]=(cnt[k]||0)+1; });
  $("r-leg").innerHTML=`<span>Campo 100×64 m · atacamos sempre para a direita neste mapa · ${sel.length} ações</span>`+Object.entries(cnt).map(([k,v])=>{ const [id,tp]=k.split("|"), a=F.acao(id); return `<span><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${a.cor};margin-right:4px"></i>${esc(a.nome)}${tp?" · "+esc(tp):""} <b>${v}</b></span>`; }).join("")+(sel.some(r_=>r_.tipo==="Drible perdido"&&r_.x2!=null)?`<span>Seta tracejada = drible</span>`:"");
}
["rf-eq","rf-ac","rf-j","rf-pt"].forEach(id=>$(id).onchange=()=>renderRelatorio());
function dirXls(r_){ if(r_.x2==null) return {"X destino (m)":"","Y destino (m)":"","Zona destino":"","Distância (m)":"","Sentido":""};
  const dx=(r_.x2-r_.x)*CAMPO_DIM[0], dy=(r_.y2-r_.y)*CAMPO_DIM[1];
  return {"X destino (m)":Math.round(r_.x2*CAMPO_DIM[0]),"Y destino (m)":Math.round(r_.y2*CAMPO_DIM[1]),"Zona destino":(r_.y2<0||r_.y2>1)&&r_.x2>=0&&r_.x2<=1?"Fora (linha lateral)":zona(r_.x2),"Distância (m)":Math.round(Math.hypot(dx,dy)),"Sentido":dx>5?"Progressivo":dx<-5?"Recuado":"Lateral"}; }
function zona(x){ return x<0||x>1?"Fora (linha de fundo)":x<1/3?"1º terço (defensivo)":x<2/3?"2º terço (meio-campo)":"3º terço (ofensivo)"; }
async function exportaXlsx(F=fonteRel()){
  if(typeof XLSX==="undefined"){ toast("A preparar o Excel…"); try{ await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"); }catch(e){} }
  if(typeof XLSX==="undefined"){ toast("Não consegui carregar o gerador de Excel. Verifica a internet e tenta de novo."); return; }
  const wb=XLSX.utils.book_new();
  const lk=r_=>F.video?linkVideoModo({t:minutoReg(r_),parte:r_.parte},F.video,"web"):null;
  const regs=F.regs.slice().sort((a,b)=>a.parte-b.parte||a.seg-b.seg).map(r_=>({Minuto:minutoReg(r_),Parte:r_.parte+"ª",Equipa:r_.eq==="eles"?"Adversário":"SC Angrense",Ação:F.acao(r_.ac).nome,Tipo:r_.tipo||"",Origem:ORIG[r_.or||"org"],"Lance BP":r_.or==="bp"?nomeBpl(r_.bpl):"","Nº":r_.eq==="eles"?"":(r_.j||""),Jogador:r_.eq==="eles"?"":(r_.j?F.nome(r_.j):"Coletivo"),"X (m, ataque →)":Math.round(r_.x*CAMPO_DIM[0]),"Y (m)":Math.round(r_.y*CAMPO_DIM[1]),Zona:zona(r_.x),...dirXls(r_),Vídeo:lk(r_)||""}));
  const wsR=XLSX.utils.json_to_sheet(regs.length?regs:[{Minuto:"",Ação:"Sem registos"}]);
  if(regs.length){ const cols=Object.keys(regs[0]), ci=cols.indexOf("Vídeo"); regs.forEach((r_,i)=>{ if(!r_.Vídeo) return; const ref=XLSX.utils.encode_cell({r:i+1,c:ci}); wsR[ref]={t:"s",v:"▶ Ver lance",l:{Target:r_.Vídeo}}; }); }
  XLSX.utils.book_append_sheet(wb,wsR,"Registos");
  const {cols,M}=porJogador(F);
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Jogador",...cols.map(c=>c.nome),"Total"],...M.map(r_=>[...r_,r_.slice(1).reduce((a,b)=>a+b,0)])]),"Por jogador");
  const pl=posseLinhas(F).map(([n,a])=>{ const util=a.nos+a.eles+a.div; const pos=a.nos+a.eles?Math.round(a.nos/(a.nos+a.eles)*100):""; return [n,fmt(a.nos),fmt(a.eles),fmt(a.div),fmt(a.fora),fmt(util),fmt(util+a.fora),pos===""?"":pos+"%"]; });
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["","Nossa","Adversário","Dividida","Bola fora","Tempo útil","Tempo total","Posse SCA"],...pl]),"Posse");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Origem","Ações nós","Remates","Enquadrados","Golos","Perdas","Remates adv.","Golos adv."],...eficacia(F.regs).map(L=>[L.nome,L.nos.acoes,L.nos.rem,L.nos.enq,L.nos.golos,L.nos.perdas,L.eles.rem,L.eles.golos])]),"Origem");
  const buf=XLSX.write(wb,{type:"array",bookType:"xlsx"});
  const nomeF=`Analise_SCA_vs_${(F.adversario||"jogo").replace(/[^\wÀ-ÿ-]+/g,"_")}_${F.data||new Date().toISOString().slice(0,10)}.xlsx`;
  let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
  if(!dl){ toast("A descarga de ficheiros não está disponível nesta vista."); return; }
  try{ await dl.save({filename:nomeF,data:new Uint8Array(buf)}); toast("Excel guardado"); }
  catch(e){ if(e?.code!=="declined") toast("Não foi possível guardar ("+(e?.code||"erro")+")"); }
}
$("a-xlsx").onclick=()=>exportaXlsx(fonteRel());
$("a-rpdf").onclick=e=>{ const F=fonteRel(); guardaRelatorio(F.arq||jogoAtualRel(),e.currentTarget); };
$("r-jogo").onchange=e=>{ relArq=e.target.value; renderRelatorio(); };
$("a-limpar").onclick=e=>{ if(fonteRel().arq) return; const b=e.currentTarget; if(b.dataset.c!=="1"){ b.dataset.c="1"; b.textContent="Confirmar: limpar tudo"; setTimeout(()=>{ b.dataset.c=""; b.textContent="Limpar análise"; },4000); return; }
  const prev=JSON.parse(JSON.stringify(an)); guardaAn({regs:[],ataque:an.ataque}); toast("Análise limpa",()=>guardaAn(prev)); };
function renderHist(){ infoCopia();
  const box=$("h-lista"); if(!box) return; box.innerHTML="";
  const js=Object.values(hist).sort((a,b)=>String(b.data||b.arquivadoEm).localeCompare(String(a.data||a.arquivadoEm)));
  if(!js.length){ box.innerHTML=`<p class="foot"><b>Ainda sem jogos arquivados.</b> No fim de cada jogo, toca em “Arquivar jogo atual”.</p>`; return; }
  const ul=document.createElement("ul"); ul.style.cssText="list-style:none;margin:0;padding:6px;display:flex;flex-direction:column;gap:4px";
  js.forEach(J=>{ const li=document.createElement("li"); const b=document.createElement("button");
    b.style.cssText="width:100%;text-align:left;border:1px solid var(--line);background:var(--surface-2);border-radius:10px;padding:10px 12px;display:flex;gap:12px;align-items:center;min-height:56px";
    const res=J.resultado&&(J.resultado.nos!==""||J.resultado.eles!=="")?`${J.resultado.nos??"–"} - ${J.resultado.eles??"–"}`:"–";
    b.innerHTML=`<span style="font-family:var(--f-display);font-weight:800;font-size:20px;color:var(--red);min-width:64px;text-align:center"></span><span style="display:flex;flex-direction:column;min-width:0"><b></b><small style="color:var(--muted)"></small></span>`;
    b.children[0].textContent=res; b.querySelector("b").textContent="vs "+(J.adversario||"(sem adversário)");
    b.querySelector("small").textContent=`${dataPt(J.data)} · ${(J.notas||[]).length} notas · ${(J.trocas||[]).length} trocas`;
    b.onclick=()=>folhaJogoArq(J); li.appendChild(b); ul.appendChild(li); });
  box.appendChild(ul);
}
function snapshotJogo(){
  return { adversario:jogo.adversario, data:jogo.data, video:jogo.video||null,
    onze:jogo.onze.map(o=>({n:o.n,pos:o.pos,nome:nome(o.n)})), suplentes:jogo.suplentes.map(n=>({n,nome:nome(n)})),
    trocas:est.linhas.filter(l=>!l.pre).map(l=>({sai:l.sai,entra:l.entra,nomeSai:nome(l.sai),nomeEntra:nome(l.entra),min:l.min||"",onde:l.modo==="todos"?"Todos os lances":(l.lances||[]).map(lanceNome).join(", ")})),
    notas:notas.itens.map(n=>({t:n.t,txt:n.txt,cat:n.cat,parte:n.parte})),
    ficha:{prova:jogo.prova,jornada:jogo.jornada,local:jogo.local,casa:jogo.casa,hora:jogo.hora,escalao:jogo.escalao,resInt:jogo.resInt,staff:{...(est.staff||{})},staffNomes:Object.fromEntries(["cap1","cap2","cap3"].map(k=>[k,est.staff?.[k]?nome(est.staff[k]):""]))},
    vivo:clone(vivo), estat:estatJogo(),
    comp:jogo.comp, eventos:(jogo.eventos||[]).map(e=>({...e,nome:e.n?nome(e.n):e.na||e.pa?nomeAdv(e.na||"",e.pa):""})), minutos:minutosJogados().map(x=>({...x,nome:nome(x.n)})), subsReais:subsReais().lista.map(l=>({sai:l.sai,entra:l.entra,min:l.min||"",int:!!l.int})),
    analise:{regs:an.regs.map(r_=>({...r_,acao:acaoDe(r_.ac).nome,nome:r_.j?nome(r_.j):""})),posse:{"1":acumAgora(1),"2":acumAgora(2)}},
    adv:(()=>{ const A=advJ(), T=eqAdv(); return {equipa:A.equipa,nomeEquipa:T?T.nome:"",sistema:A.sistema,cores:{...A.cores},onze:A.onze.map(o=>({...o,nome:nomeAdv(o.n,o.pid)})),suplentes:supAdv(A).map(x=>({n:x.n,nome:x.nome})),
      subs:(jogo.subsAdv||[]).map(x=>({...x,nomeSai:nomeAdv(x.sai,x.pidSai),nomeEntra:nomeAdv(x.entra,x.pidEntra)}))}; })(), encaixe:normEncaixe(jogo.encaixe) }; }
$("h-bk").onclick=exportaCopia;
$("h-rp").onclick=()=>$("h-file").click();
$("h-file").onchange=async e=>{ const f=e.target.files[0]; e.target.value=""; if(!f) return; try{ repoeCopia(JSON.parse(await f.text())); }catch(err){ toast("Não consegui ler o ficheiro."); } };
$("h-arq").onclick=()=>{
  folha(`<h3>Arquivar jogo vs <span class="big"></span></h3>
    <div class="fields"><label class="f">Golos SC Angrense<input type="text" id="ar-n" inputmode="numeric"></label><label class="f">Golos adversário<input type="text" id="ar-e" inputmode="numeric"></label></div>
    <label class="f">Observações<textarea id="ar-o" rows="4" style="border:1px solid var(--line);border-radius:8px;padding:10px;font:inherit;background:var(--surface);color:var(--ink);width:100%"></textarea></label>
    <label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="ar-nv" checked style="accent-color:var(--red);width:20px;height:20px"> Começar jogo novo: limpar trocas do jogo, notas, relógio, vídeo, adversário (onze e substituições) e suplentes (o onze base, os lances e os planteis dos adversários ficam)</label>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ar-ok">Arquivar</button></div>`,(s,fecha)=>{
    s.querySelector(".big").textContent=jogo.adversario||"(sem adversário)";
    if((jogo.eventos||[]).length){ s.querySelector("#ar-n").value=placar().nos; s.querySelector("#ar-e").value=placar().eles; }
    s.querySelector("#ar-ok").onclick=()=>{
      const id="J"+Date.now().toString(36);
      const J={id,...snapshotJogo(),resultado:{nos:s.querySelector("#ar-n").value.trim(),eles:s.querySelector("#ar-e").value.trim()},obs:s.querySelector("#ar-o").value.trim(),arquivadoEm:new Date().toISOString()};
      hist[id]=J; guardaLocal(); gravaDoc("historico/"+id,J);
      if(s.querySelector("#ar-nv").checked){
        guardaEst({...est,linhas:est.linhas.filter(l=>l.pre),fase:"pre"});
        guardaNotas({itens:[]});
        guardaAn({regs:[],ataque:an.ataque}); guardaVivo(null); vLog=[];
        guardaJogo({...jogo,adversario:"",data:"",suplentes:[],relogio:{base:0,correr:false},video:null,eventos:[],subs:[],jornada:"",local:"",hora:"",resInt:"",adv:null,subsAdv:[],encaixe:null});
      }
      fecha(); renderHist(); toast("Jogo arquivado no histórico"); };
  });
};
function folhaJogoArq(J){
  const lst=(arr,f)=>arr&&arr.length?`<ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:3px">${arr.map(f).join("")}</ul>`:`<p class="sub" style="margin:0">—</p>`;
  folha(`<h3>vs ${esc(J.adversario||"(sem adversário)")} <span class="big">${esc(J.resultado?.nos??"")} - ${esc(J.resultado?.eles??"")}</span></h3>
    <p class="sub" style="margin:-6px 0 0">${esc(dataPt(J.data))}</p>
    <div class="fields"><label class="f">Golos SC Angrense<input type="text" id="aj-n"></label><label class="f">Golos adversário<input type="text" id="aj-e"></label></div>
    <label class="f">Observações<textarea id="aj-o" rows="3" style="border:1px solid var(--line);border-radius:8px;padding:10px;font:inherit;background:var(--surface);color:var(--ink);width:100%"></textarea></label>
    <h4>Onze</h4>${lst(J.onze,o=>`<li><b>${esc(o.n)}</b> ${esc(o.pos||"")} ${esc(o.nome||"")}</li>`)}
    <h4>Suplentes</h4>${lst(J.suplentes,o=>`<li><b>${esc(o.n)}</b> ${esc(o.nome||"")}</li>`)}
    <h4>Trocas</h4>${lst(J.trocas,t=>`<li>${t.min?`<b>${esc(t.min)}</b> · `:""}${esc(t.sai)} ${esc(t.nomeSai||"")} → <b>${esc(t.entra)}</b> ${esc(t.nomeEntra||"")} <span class="sub">(${esc(t.onde)})</span></li>`)}
    <h4>Adversário${J.adv&&J.adv.sistema?" · "+esc(J.adv.sistema):""}</h4>${lst(J.adv&&J.adv.onze.filter(o=>o.n),o=>`<li><b>${esc(o.n)}</b> ${esc(o.pos||"")} ${esc(o.nome||"")}</li>`)}
    <h4>Substituições do adversário</h4>${lst(J.adv&&J.adv.subs,x=>`<li><b>${esc(x.min||"–")}'</b> · sai ${esc(x.sai)} ${esc(x.nomeSai||"")} → entra <b>${esc(x.entra)}</b> ${esc(x.nomeEntra||"")}</li>`)}
    <h4>Notas</h4>${lst((J.notas||[]).slice().sort((a,b)=>seg(a.t)-seg(b.t)),n=>{ const lv=J.video?linkVideo(n,J.video):null; return `<li><b style="color:var(--red)">${esc(n.t||"–")}</b> ${esc(n.txt)} ${lv?`<a href="${lv}" target="_blank" rel="noopener">▶ vídeo</a>`:""}</li>`; })}
    <div class="actions"><button class="btn danger l" id="aj-del">Apagar do histórico</button><button class="btn" id="aj-an">📊 Ver análise pós-jogo</button><button class="btn" id="aj-pdf">⬇ Relatório PDF</button><button class="btn" id="aj-fic">⬇ Ficha de jogo</button><button class="btn" data-close>Fechar</button><button class="btn primary" id="aj-ok">Guardar</button></div>`,(s,fecha)=>{
    s.querySelector("#aj-n").value=J.resultado?.nos??""; s.querySelector("#aj-e").value=J.resultado?.eles??""; s.querySelector("#aj-o").value=J.obs||"";
    s.querySelector("#aj-an").onclick=()=>{ fecha(); relArq=J.id; anVista="rel"; setTab("a"); };
    s.querySelector("#aj-pdf").onclick=e=>guardaRelatorio(J,e.currentTarget);
    s.querySelector("#aj-fic").onclick=e=>guardaFicha(e.currentTarget,J);
    s.querySelector("#aj-ok").onclick=()=>{ const N={...J,resultado:{nos:s.querySelector("#aj-n").value.trim(),eles:s.querySelector("#aj-e").value.trim()},obs:s.querySelector("#aj-o").value.trim()}; hist[J.id]=N; guardaLocal(); gravaDoc("historico/"+J.id,N); fecha(); renderHist(); };
    let conf=false; s.querySelector("#aj-del").onclick=e=>{ if(!conf){ conf=true; e.target.textContent="Confirmar: apagar"; return; } delete hist[J.id]; if(relArq===J.id) relArq=""; guardaLocal(); apagaDoc("historico/"+J.id); fecha(); renderHist(); toast("Jogo apagado do histórico"); };
  });
}
function renderPresent(){
  const L=lanceAtual(); const root=$("present-root");
  root.innerHTML=`<div class="present" role="dialog" aria-label="Apresentação"><div class="pstage"></div><div class="pbar"><button id="pp">‹ Anterior</button><div class="t"></div><button id="pn">Seguinte ›</button><button id="pnm">${nomesOn?"Esconder nomes":"Mostrar nomes"}</button><button id="pundo" ${undoQ.length?"":"disabled"}>↶ Desfazer</button><button id="px">Fechar</button></div></div>`;
  root.querySelector(".pstage").appendChild(desenha(L,{clean:true,arrastar:true}));
  root.querySelector(".t").textContent=L.nome;
  root.querySelector("#pp").onclick=()=>passo(-1); root.querySelector("#pn").onclick=()=>passo(1); root.querySelector("#px").onclick=fechaPresent; root.querySelector("#pnm").onclick=()=>setNomes(!nomesOn); root.querySelector("#pundo").onclick=desfazQuadro;
  let x0=null; const st=root.querySelector(".pstage");
  st.addEventListener("touchstart",e=>{ x0=(e.target.closest&&e.target.closest(".bola"))?null:e.touches[0].clientX; },{passive:true});
  st.addEventListener("touchend",e=>{ if(x0===null) return; const dx=e.changedTouches[0].clientX-x0; if(Math.abs(dx)>50) passo(dx<0?1:-1); x0=null; });
}
function fechaPresent(){ presentOpen=false; $("present-root").innerHTML=""; }
$("btn-present").onclick=()=>{ if(!$("view-m").hidden&&typeof apresentaModelo==="function"){ apresentaModelo(); return; } editing=false; presentOpen=true; renderBoard(); renderPresent(); };
document.addEventListener("keydown",e=>{ if(!presentOpen) return; if(e.key==="ArrowRight") passo(1); else if(e.key==="ArrowLeft") passo(-1); else if(e.key==="Escape") fechaPresent(); });
let tTimer=null;
function toast(msg,undo){ const r=$("toast-root"); r.innerHTML=`<div class="toast" role="status"><span></span>${undo?'<button>Desfazer</button>':''}</div>`;
  r.querySelector("span").textContent=msg; if(undo) r.querySelector("button").onclick=()=>{ r.innerHTML=""; undo(); };
  clearTimeout(tTimer); tTimer=setTimeout(()=>{r.innerHTML="";},undo?6000:2800); }
function render(){ if(dragging) return; renderBanco(); renderVivo(); renderNav(); renderBoard(); renderRows(); renderForm(); renderPlantel(); renderAdv(); if(!$("view-j").hidden) renderJogo(); else $("jogo-tit").textContent=jogo.adversario?`vs ${jogo.adversario}`:"Preparação · Jogo · Análise"; if(presentOpen) renderPresent(); if(typeof renderModeloSeguro==="function") renderModeloSeguro(); }
