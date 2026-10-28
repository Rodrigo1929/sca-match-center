/* ---------- Competição interna (Liga / Champions) e Meinho (no separador Treino; junta-se ao 4.º <script>, depois de tempos.js) ---------- */
/* Marcação no exercício do repositório (comp: "liga"|"champions"|"", meinho) e ajuste só numa UT na linha (l.comp / l.meinho; sem campo = como no repositório).
   Registos, um documento cada (dois aparelhos ao mesmo tempo):
   compJogos/{id} = {id, ut, lid, serie, a, b (ids dos grupos), grA, grB (atleta GR de cada equipa), semGR, fim, criadoEm, criadoPor}
   compGolos/{id} = {id, jogo, eq: "a"|"b" (equipa que ganha o golo), k (quem marcou), ag (auto-golo: k é da outra equipa), em, por}
   meinho/{id}    = {id, ut, lid, tipo: "21"|"cueca", ks: [1 a 3 atletas], em, por}
   histTreino/{id} = histórico de antes da app, importado do Excel (v97): um documento por UT {tipo: "comp"|"meinho", et, ut (nº), data, origem,
     linhas: comp [{k, nome, gr, J, V, E, D, golos, GS}] | meinho [{k, nome, m21, cuecas, presente}]}; k = "n:<nº do plantel>" ou "x:<nome>" (como nos Tempos).
     Só entra nas tabelas pela data (filtros); GM, GS e DG da equipa e os jogos sem sofrer não existem no Excel.
   Uma marcação anulada não apaga registos: deixam de contar e voltam se for reativada. Tudo se calcula na hora a partir das UT e dos registos. */
const COMP_ET=[["liga","Liga"],["champions","Champions"]];
const compDe=l=>typeof l.comp==="string"?l.comp:(l.copia.comp||"");
const meinhoDe=l=>typeof l.meinho==="boolean"?l.meinho:!!l.copia.meinho;
const rotComp=k=>(COMP_ET.find(x=>x[0]===k)||[0,""])[1];
const CJ_LS="sca-comp-jogos-v1", CG_LS="sca-comp-golos-v1", MH_LS="sca-meinho-v1", HT_LS="sca-hist-treino-v1";
let compJogos={}, compGolos={}, meinhoRegs={}, histTreino={};
try{ compJogos=JSON.parse(localStorage.getItem(CJ_LS)||"{}")||{}; compGolos=JSON.parse(localStorage.getItem(CG_LS)||"{}")||{}; meinhoRegs=JSON.parse(localStorage.getItem(MH_LS)||"{}")||{}; histTreino=JSON.parse(localStorage.getItem(HT_LS)||"{}")||{}; }catch(e){}
function normJogoInt(d){ const s=v=>String(v??"").trim(); return {id:s(d.id)||uId("cj"),ut:s(d.ut),lid:s(d.lid),serie:Math.max(1,Math.round(+d.serie)||1),a:s(d.a),b:s(d.b),
  grA:s(d.grA),grB:s(d.grB),semGR:!!d.semGR,fim:!!d.fim,criadoEm:s(d.criadoEm),criadoPor:s(d.criadoPor)}; }
function normGoloInt(d){ const s=v=>String(v??"").trim(); return {id:s(d.id)||uId("cg"),jogo:s(d.jogo),eq:d.eq==="b"?"b":"a",k:s(d.k),ag:!!d.ag,em:s(d.em),por:s(d.por)}; }
function normHist(d){ const s=v=>String(v??"").trim(), n=v=>Math.max(0,Math.round(+v)||0), tipo=d.tipo==="meinho"?"meinho":"comp";
  return {id:s(d.id)||uId("ht"),tipo,et:d.et==="liga"?"liga":"champions",ut:n(d.ut),data:/^\d{4}-\d{2}-\d{2}$/.test(s(d.data))?s(d.data):"",origem:s(d.origem),
    linhas:(Array.isArray(d.linhas)?d.linhas:[]).filter(l=>l&&s(l.k)).map(l=>tipo==="meinho"?{k:s(l.k),nome:s(l.nome),m21:n(l.m21),cuecas:n(l.cuecas),presente:!!l.presente}
      :{k:s(l.k),nome:s(l.nome),gr:!!l.gr,J:n(l.J),V:n(l.V),E:n(l.E),D:n(l.D),golos:n(l.golos),GS:n(l.GS)})}; }
function normMeinho(d){ const s=v=>String(v??"").trim(); return {id:s(d.id)||uId("mh"),ut:s(d.ut),lid:s(d.lid),tipo:d.tipo==="cueca"?"cueca":"21",ks:(Array.isArray(d.ks)?d.ks:[]).map(s).filter(Boolean).slice(0,3),em:s(d.em),por:s(d.por)}; }
[[compJogos,normJogoInt],[compGolos,normGoloInt],[meinhoRegs,normMeinho],[histTreino,normHist]].forEach(([o,f])=>Object.keys(o).forEach(id=>{ try{ o[id]=f({...o[id],id}); }catch(e){ delete o[id]; } }));
function guardaCompLocal(){ try{ localStorage.setItem(CJ_LS,JSON.stringify(compJogos)); localStorage.setItem(CG_LS,JSON.stringify(compGolos)); localStorage.setItem(MH_LS,JSON.stringify(meinhoRegs)); localStorage.setItem(HT_LS,JSON.stringify(histTreino)); }catch(e){} }
const gravaJogoInt=J=>{ const N=normJogoInt(J); compJogos[N.id]=N; guardaCompLocal(); gravaDoc("compJogos/"+N.id,N); return N; };
const gravaGolo=G=>{ const N=normGoloInt(G); compGolos[N.id]=N; guardaCompLocal(); gravaDoc("compGolos/"+N.id,N); return N; };
const gravaMeinho=M=>{ const N=normMeinho(M); meinhoRegs[N.id]=N; guardaCompLocal(); gravaDoc("meinho/"+N.id,N); return N; };
const tiraJogoInt=id=>{ Object.values(compGolos).filter(g=>g.jogo===id).forEach(g=>{ delete compGolos[g.id]; apagaDoc("compGolos/"+g.id); }); delete compJogos[id]; guardaCompLocal(); apagaDoc("compJogos/"+id); };
const tiraGolo=id=>{ delete compGolos[id]; guardaCompLocal(); apagaDoc("compGolos/"+id); };
const tiraMeinho=id=>{ delete meinhoRegs[id]; guardaCompLocal(); apagaDoc("meinho/"+id); };
const jogosDe=(ut,lid)=>Object.values(compJogos).filter(j=>j.ut===ut&&j.lid===lid).sort((a,b)=>a.serie-b.serie||a.criadoEm.localeCompare(b.criadoEm));
const golosDe=jid=>Object.values(compGolos).filter(g=>g.jogo===jid).sort((a,b)=>a.em.localeCompare(b.em));
const meinhoDeLinha=(ut,lid)=>Object.values(meinhoRegs).filter(m=>m.ut===ut&&m.lid===lid).sort((a,b)=>a.em.localeCompare(b.em));
/* registos que deixam de contar se a marcação for anulada nesta UT (jogos e golos, ou registos de meinho) */
const nRegistos=(ut,lid,tipo)=>tipo==="meinho"?meinhoDeLinha(ut,lid).length:jogosDe(ut,lid).reduce((a,j)=>a+1+golosDe(j.id).length,0);
function repoeCompeticao(B){ [["compJogos",compJogos,normJogoInt],["compGolos",compGolos,normGoloInt],["meinho",meinhoRegs,normMeinho],["histTreino",histTreino,normHist]].forEach(([c,o,f])=>{ const X=B[c]||{};
  Object.keys(o).forEach(id=>{ if(!X[id]){ delete o[id]; apagaDoc(c+"/"+id); } }); Object.entries(X).forEach(([id,v])=>{ o[id]=f({...v,id}); gravaDoc(c+"/"+id,o[id]); }); }); guardaCompLocal(); }
function ligaCompDb(){ if(!db) return;
  [["compJogos",()=>compJogos,v=>compJogos=v,normJogoInt],["compGolos",()=>compGolos,v=>compGolos=v,normGoloInt],["meinho",()=>meinhoRegs,v=>meinhoRegs=v,normMeinho],["histTreino",()=>histTreino,v=>histTreino=v,normHist]].forEach(([c,get,set,f])=>
    db.collection(c).onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
      q.docs.forEach(d=>{ const x=lerDoc(d); if(x){ delete x.atualizadoEm; try{ m[d.id]=f({...x,id:d.id}); }catch(e){} } });
      mergeCol(c+"/",m,get()); if(JSON.stringify(m)!==JSON.stringify(get())){ set(m); guardaCompLocal(); compRefresca(); } },()=>{})); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaCompDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();
/* uma folha de registo aberta volta a desenhar-se quando chega um registo de outro aparelho */
let compRedesenha=null;
function compRefresca(){ if(compRedesenha&&$("sheet-root").innerHTML){ compRedesenha(); return; } if(!$("sheet-root").innerHTML&&(uModo==="comp"||uModo==="rank"||uModo==="ut")) renderUT(); }

/* ---------- atletas de um grupo na UT (presentes), GR pela posição do Plantel ---------- */
const ehGR=a=>a&&a.pos==="1";
function atletasGrupo(U,gid){ const g=U.grupos.find(x=>x.id===gid); if(!g) return []; const at=atletasUT(U); return g.jogadores.filter(k=>presenteUT(U,k)).map(k=>at.find(a=>a.k===k)).filter(Boolean); }
const nomeGrupoUT=(U,gid)=>{ const g=U.grupos.find(x=>x.id===gid); return g?(g.nome||"Grupo"):"(grupo apagado)"; };
const nomeK=(U,k)=>{ const a=atletasUT(U).find(x=>x.k===k); return a?nomeCurto(a):"?"; };
/* jogos propostos: com rotação, as equipas que estão no exercício em cada série jogam entre si (pela ordem); sem rotação, todos contra todos ao longo das séries */
function propoeJogos(U,l){ const gs=(l.grupos||[]).filter(id=>U.grupos.some(g=>g.id===id)), S=seriesDe(l.copia), out=[];
  if(l.rot) l.rot.grelha.forEach((r,s)=>{ const em=r.map((v,j)=>v==="p"?l.rot.equipas[j]:"").filter(Boolean); for(let i=0;i+1<em.length;i+=2) out.push({serie:s+1,a:em[i],b:em[i+1]}); });
  else if(gs.length>=2){ const t=gs.length%2?[...gs,""]:gs.slice(), n=t.length, rondas=[];
    for(let r=0;r<n-1;r++){ const ro=[]; for(let i=0;i<n/2;i++){ const a=t[i], b=t[n-1-i]; if(a&&b) ro.push([a,b]); } rondas.push(ro); t.splice(1,0,t.pop()); }
    for(let s=0;s<S;s++) rondas[s%rondas.length].forEach(([a,b])=>out.push({serie:s+1,a,b})); }
  return out; }
const grDoGrupo=(U,gid)=>(atletasGrupo(U,gid).find(ehGR)||{}).k||"";
const resultado=J=>{ const gs=golosDe(J.id); return {a:gs.filter(g=>g.eq==="a").length,b:gs.filter(g=>g.eq==="b").length}; };

/* ---------- 🏆 registo dos jogos de um exercício da UT ---------- */
function folhaCompUT(id,lid){ const U0=uts[id], l=U0&&U0.exercicios.find(x=>x.id===lid); if(!l) return; const et=compDe(l), num=numerosUT(U0)[lid];
  let golo=null;   // {jid, eq, ag} enquanto se escolhe o marcador
  folha(`<h3>🏆 ${esc(rotComp(et)||"Competição")} · ${num} ${esc(l.copia.nome)}</h3><p class="sub" style="margin:0">UT${U0.numero} · ${esc(dataPt_(U0.data))}. O resultado faz-se com «+ golo» e o marcador; o jogo só conta depois de «✓ Fim do jogo».</p>
    <div id="cp-c"></div><div class="actions"><button class="btn primary" data-close>Fechar</button></div>`,(s,fecha)=>{
    const c=s.querySelector("#cp-c");
    const desenha=()=>{ const U=uts[id]; if(!U){ fecha(); return; } const gs=(l.grupos||[]), js=jogosDe(id,lid);
      if(golo){ const J=compJogos[golo.jid]; if(!J){ golo=null; desenha(); return; } const eqMarca=golo.ag?(golo.eq==="a"?"b":"a"):golo.eq, gid=J[eqMarca], at=atletasGrupo(U,gid).sort((a,b)=>nomeCurto(a).localeCompare(nomeCurto(b),"pt"));
        c.innerHTML=`<h4>${golo.ag?`Auto-golo: quem de ${esc(nomeGrupoUT(U,gid))} o fez?`:`Golo de ${esc(nomeGrupoUT(U,J[golo.eq]))}: quem marcou?`}</h4>
          <div class="pgrid cp-pick">${at.map(a=>`<button data-k="${esc(a.k)}"><b>${esc(nomeCurto(a))}</b><small>${ehGR(a)?"GR":""}</small></button>`).join("")||`<p class="sub">Ninguém presente neste grupo.</p>`}${golo.ag?"":`<button class="cp-ag" data-ag="1"><b>Auto-golo</b><small>de um adversário</small></button>`}</div>
          <div class="actions"><button class="btn" id="cp-cx">Cancelar</button></div>`;
        c.querySelector("#cp-cx").onclick=()=>{ golo=null; desenha(); };
        c.querySelectorAll(".cp-pick [data-k]").forEach(b=>b.onclick=()=>{ gravaGolo({id:uId("cg"),jogo:J.id,eq:golo.eq,k:b.dataset.k,ag:golo.ag,em:new Date().toISOString(),por:meuId||""}); toast(golo.ag?"Auto-golo registado":"Golo registado"); golo=null; desenha(); });
        const ag=c.querySelector("[data-ag]"); if(ag) ag.onclick=()=>{ golo={...golo,ag:true}; desenha(); };
        return; }
      if(gs.length<2){ c.innerHTML=`<p class="sub" style="margin:0">Este exercício precisa de pelo menos 2 grupos (as equipas). Escolhe-os em 👥 Grupos.</p>`; return; }
      const opG=sel=>gs.map(g=>`<option value="${esc(g)}"${g===sel?" selected":""}>${esc(nomeGrupoUT(U,g))}</option>`).join("");
      const opGR=(gid,sel)=>`<option value="">— GR —</option>`+atletasGrupo(U,gid).map(a=>`<option value="${esc(a.k)}"${a.k===sel?" selected":""}>${esc(nomeCurto(a))}${ehGR(a)?" (GR)":""}</option>`).join("");
      c.innerHTML=!js.length?`<div class="m-vazio" style="margin:0"><b>Ainda não há jogos.</b><span>A app propõe os jogos a partir das equipas${l.rot?" e da rotação por séries":" (todos contra todos ao longo das séries)"}; depois podes mudar.</span><button class="btn primary" id="cp-gera">Gerar jogos</button></div>`
        :`<div class="cp-jogos">${js.map(J=>{ const r=resultado(J), gls=golosDe(J.id), falta=!J.semGR&&(!J.grA||!J.grB);
          return `<div class="cp-j${J.fim?" fim":""}" data-j="${esc(J.id)}"><div class="cp-cab"><span class="cp-s">Série ${J.serie}</span>${J.fim?`<span class="chip rev">✓ Fim</span>`:`<span class="chip env">por terminar</span>`}${falta?`<span class="chip env">falta GR</span>`:""}</div>
            <div class="cp-res"><div class="cp-eq"><select data-f="a" aria-label="Equipa A"${J.fim?" disabled":""}>${opG(J.a)}</select><button class="btn sm" data-g="a"${J.fim?" disabled":""}>+ golo</button></div>
              <b class="cp-pl">${r.a} – ${r.b}</b><div class="cp-eq"><select data-f="b" aria-label="Equipa B"${J.fim?" disabled":""}>${opG(J.b)}</select><button class="btn sm" data-g="b"${J.fim?" disabled":""}>+ golo</button></div></div>
            ${gls.length?`<ul class="cp-gl">${gls.map(g=>`<li><span>⚽ ${esc(nomeK(U,g.k))}${g.ag?" (AG)":""} · ${esc(nomeGrupoUT(U,J[g.eq]))}</span>${J.fim?"":`<button class="icon" data-xg="${esc(g.id)}" aria-label="Tirar golo">✕</button>`}</li>`).join("")}</ul>`:""}
            <div class="cp-gr">${J.semGR?`<span class="sub">Sem GR neste jogo</span>`:`<label class="f">GR ${esc(nomeGrupoUT(U,J.a))}<select data-f="grA">${opGR(J.a,J.grA)}</select></label><label class="f">GR ${esc(nomeGrupoUT(U,J.b))}<select data-f="grB">${opGR(J.b,J.grB)}</select></label>`}
              <button class="btn sm ghost" data-semgr>${J.semGR?"Pedir GR":"Sem GR"}</button></div>
            <div class="cp-ac">${J.fim?`<button class="btn sm" data-reabre>Reabrir</button>`:`<button class="btn sm primary" data-fim>✓ Fim do jogo</button><button class="btn sm ghost danger" data-xj>Tirar jogo</button>`}</div></div>`; }).join("")}</div>
          <div class="row cp-mais"><button class="btn sm" id="cp-mais">+ Jogo</button><span class="sub">na série</span><select id="cp-sm" aria-label="Série do jogo novo">${Array.from({length:seriesDe(l.copia)},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join("")}</select></div>`;
      const g=c.querySelector("#cp-gera"); if(g) g.onclick=()=>{ const P=propoeJogos(U,l); if(!P.length){ toast("Sem equipas para jogar: vê a rotação em 👥 Grupos."); return; }
        P.forEach(p=>gravaJogoInt({id:uId("cj"),ut:id,lid,serie:p.serie,a:p.a,b:p.b,grA:grDoGrupo(U,p.a),grB:grDoGrupo(U,p.b),criadoEm:new Date().toISOString(),criadoPor:meuId||""})); toast(`${P.length} jogos gerados`); desenha(); };
      const m=c.querySelector("#cp-mais"); if(m) m.onclick=()=>{ gravaJogoInt({id:uId("cj"),ut:id,lid,serie:+c.querySelector("#cp-sm").value,a:gs[0],b:gs[1],grA:grDoGrupo(U,gs[0]),grB:grDoGrupo(U,gs[1]),criadoEm:new Date().toISOString(),criadoPor:meuId||""}); desenha(); };
      c.querySelectorAll(".cp-j").forEach(el=>{ const J=compJogos[el.dataset.j], upd=o=>{ gravaJogoInt({...J,...o}); desenha(); };
        el.querySelectorAll("select[data-f]").forEach(sel=>sel.onchange=()=>{ const f=sel.dataset.f, o={[f]:sel.value}; if(f==="a") o.grA=grDoGrupo(U,sel.value); if(f==="b") o.grB=grDoGrupo(U,sel.value); upd(o); });
        el.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{ golo={jid:J.id,eq:b.dataset.g,ag:false}; desenha(); });
        el.querySelectorAll("[data-xg]").forEach(b=>confirma2(b,"Tirar?",()=>{ tiraGolo(b.dataset.xg); desenha(); }));
        const sg=el.querySelector("[data-semgr]"); if(sg) sg.onclick=()=>upd({semGR:!J.semGR});
        const f=el.querySelector("[data-fim]"); if(f) f.onclick=()=>{ upd({fim:true}); toast(`Fim do jogo · ${resultado(J).a}–${resultado(J).b}`); };
        const ra=el.querySelector("[data-reabre]"); if(ra) ra.onclick=()=>upd({fim:false});
        const xj=el.querySelector("[data-xj]"); if(xj) confirma2(xj,golosDe(J.id).length?"Tira o jogo e os golos?":"Tirar?",()=>{ tiraJogoInt(J.id); desenha(); }); }); };
    compRedesenha=desenha; desenha();
    const obs=new MutationObserver(()=>{ if(!$("sheet-root").innerHTML){ compRedesenha=null; obs.disconnect(); renderUT(); } }); obs.observe($("sheet-root"),{childList:true}); }); }

/* ---------- 👑 Meinho: registo rápido ---------- */
function folhaMeinhoUT(id,lid){ const U0=uts[id], l=U0&&U0.exercicios.find(x=>x.id===lid); if(!l) return; const num=numerosUT(U0)[lid];
  let tipo="21", sel=[];
  folha(`<h3>👑 Meinho · ${num} ${esc(l.copia.nome)}</h3><p class="sub" style="margin:0">UT${U0.numero}. Cada registo vale 1 para cada atleta escolhido.</p>
    <div class="seg" id="mh-t"><button data-k="21">21 passes (1 a 3 no meio)</button><button data-k="cueca">Cueca (quem levou)</button></div>
    <div id="mh-c"></div><div class="actions"><button class="btn primary" data-close>Fechar</button></div>`,(s,fecha)=>{
    const c=s.querySelector("#mh-c");
    const desenha=()=>{ const U=uts[id]; if(!U){ fecha(); return; } const max=tipo==="cueca"?1:3, at=atletasUT(U).filter(a=>presenteUT(U,a.k)).sort((a,b)=>nomeCurto(a).localeCompare(nomeCurto(b),"pt"));
      const regs=meinhoDeLinha(id,lid), cnt={}; regs.forEach(r=>r.ks.forEach(k=>{ const x=cnt[k]||(cnt[k]={m:0,c:0}); r.tipo==="cueca"?x.c++:x.m++; }));
      s.querySelectorAll("#mh-t button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===tipo)));
      const ult=regs[regs.length-1];
      c.innerHTML=`<p class="sub" style="margin:0">${tipo==="cueca"?"Toca no atleta que levou a cueca.":"Toca nos atletas que estavam no meio (1 a 3)."} Escolhidos: <b>${sel.length?esc(sel.map(k=>nomeK(U,k)).join(", ")):"—"}</b></p>
        <div class="pgrid mh-g">${at.map(a=>{ const x=cnt[a.k]; return `<button data-k="${esc(a.k)}" aria-pressed="${sel.includes(a.k)}"><b>${esc(nomeCurto(a))}</b><small>${x?`${x.m?x.m+" × 21":""}${x.m&&x.c?" · ":""}${x.c?x.c+" cueca"+(x.c>1?"s":""):""}`:" "}</small></button>`; }).join("")||`<p class="sub">Marca primeiro as presenças desta UT.</p>`}</div>
        <div class="actions" style="justify-content:stretch"><button class="btn primary" id="mh-ok" style="flex:1;min-height:52px"${sel.length?"":" disabled"}>Registar ${tipo==="cueca"?"cueca":"21 passes"}</button></div>
        <p class="sub" style="margin:0">${regs.length} ${regs.length===1?"registo":"registos"} neste exercício${ult?` · último: ${ult.tipo==="cueca"?"cueca":"21 passes"} · ${esc(ult.ks.map(k=>nomeK(U,k)).join(", "))} · ${esc(new Date(ult.em).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit",second:"2-digit"}))}`:""}</p>
        ${ult?`<div><button class="btn sm danger" id="mh-un">↶ Desfazer o último</button></div>`:""}`;
      c.querySelectorAll(".mh-g button").forEach(b=>b.onclick=()=>{ const k=b.dataset.k; if(sel.includes(k)) sel=sel.filter(x=>x!==k); else if(max===1) sel=[k]; else if(sel.length<max) sel=[...sel,k]; else { toast("No máximo 3 atletas."); return; } desenha(); });
      c.querySelector("#mh-ok").onclick=()=>{ if(!sel.length) return; gravaMeinho({id:uId("mh"),ut:id,lid,tipo,ks:sel,em:new Date().toISOString(),por:meuId||""});
        toast(`${tipo==="cueca"?"Cueca":"21 passes"} · ${sel.map(k=>nomeK(U,k)).join(", ")}`); sel=[]; desenha(); };
      const un=c.querySelector("#mh-un"); if(un) confirma2(un,"Toca outra vez para desfazer",()=>{ const r=meinhoDeLinha(id,lid).pop(); if(r){ tiraMeinho(r.id); toast("Último registo desfeito"); } desenha(); }); };
    s.querySelectorAll("#mh-t button").forEach(b=>b.onclick=()=>{ tipo=b.dataset.k; if(tipo==="cueca"&&sel.length>1) sel=sel.slice(0,1); desenha(); });
    compRedesenha=desenha; desenha();
    const obs=new MutationObserver(()=>{ if(!$("sheet-root").innerHTML){ compRedesenha=null; obs.disconnect(); renderUT(); } }); obs.observe($("sheet-root"),{childList:true}); }); }

/* ---------- filtros comuns às vistas Competição e Rankings: época, mesociclo, microciclo (e Liga/Champions) ---------- */
let cF={ep:"",me:"",mi:"",et:""}, cOrd={k:"",d:-1}, gOrd={k:"",d:1};
try{ const f=JSON.parse(localStorage.getItem("sca-comp-f")||"null"); if(f) cF={...cF,...f}; }catch(e){}
function utsFiltro(){ const todas=listaUTs().filter(U=>U.data), hs=Object.values(histTreino).filter(h=>h.data), ds=[...todas.map(U=>U.data),...hs.map(h=>h.data)], eps=[...new Set(ds.map(epocaDe))].sort().reverse();
  if(!eps.includes(cF.ep)) cF.ep=eps.includes(epocaDe(isoDia(new Date())))?epocaDe(isoDia(new Date())):(eps[0]||"");
  const daEp=ds.filter(d=>epocaDe(d)===cF.ep), uniq=xs=>[...new Map(xs.filter(Boolean).map(M=>[M.id,M])).values()].sort((a,b)=>a.inicio.localeCompare(b.inicio));
  const mesos=uniq(daEp.map(mesoDe)); if(cF.me&&!mesos.some(M=>M.id===cF.me)) cF.me="";
  const noMe=d=>epocaDe(d)===cF.ep&&(!cF.me||(mesoDe(d)||{}).id===cF.me), micros=uniq(daEp.filter(noMe).map(microDe)); if(cF.mi&&!micros.some(M=>M.id===cF.mi)) cF.mi="";
  const passa=d=>noMe(d)&&(!cF.mi||(microDe(d)||{}).id===cF.mi);
  const ls=todas.filter(U=>passa(U.data)).sort((a,b)=>a.data.localeCompare(b.data)||a.numero-b.numero), hist=hs.filter(h=>passa(h.data)).sort((a,b)=>a.data.localeCompare(b.data));
  try{ localStorage.setItem("sca-comp-f",JSON.stringify(cF)); }catch(e){}
  return {eps,mesos,micros,ls,hist}; }
/* nome de uma linha do histórico: do Plantel (alcunha), senão o nome do Excel */
const nomeHist=l=>{ if(l.k.startsWith("n:")){ const p=est.plantel.find(x=>x.n===l.k.slice(2)); if(p) return nomeCurto({nome:p.nome,alc:p.alc,n:p.n}); } return nomeCurto({nome:l.nome}); };
function navFiltro(F,comEt){ const nav=$("u-nav"), dd=d=>dataPt_(d).slice(0,5);
  nav.innerHTML=modoUTHtml()+`<div class="grp tfiltro"><h3>Filtrar</h3>
    <label class="f">Época<select id="cf-ep">${F.eps.map(e=>`<option value="${e}">${e}</option>`).join("")||`<option value="">–</option>`}</select></label>
    <label class="f">Mesociclo<select id="cf-me"><option value="">Todos</option>${F.mesos.map(M=>`<option value="${esc(M.id)}">Meso ${M.n||"?"} · ${dd(M.inicio)}</option>`).join("")}</select></label>
    <label class="f">Microciclo<select id="cf-mi"><option value="">Todos</option>${F.micros.map(M=>`<option value="${esc(M.id)}">Micro ${M.n||"?"} · ${dd(M.inicio)}</option>`).join("")}</select></label>
    ${comEt?`<label class="f">Liga / Champions<select id="cf-et"><option value="">As duas</option>${COMP_ET.map(([k,n])=>`<option value="${k}">${n}</option>`).join("")}</select></label>`:""}</div>`;
  ligaModoUT(nav); $("cf-ep").value=cF.ep; $("cf-me").value=cF.me; $("cf-mi").value=cF.mi; if(comEt) $("cf-et").value=cF.et;
  [["cf-ep","ep"],["cf-me","me"],["cf-mi","mi"],["cf-et","et"]].forEach(([i,k])=>{ if($(i)) $(i).onchange=()=>{ cF[k]=$(i).value; if(k==="ep"){ cF.me=""; cF.mi=""; } if(k==="me") cF.mi=""; renderUT(); }; }); }
async function guardaCsv(nomeF,L){ const c=v=>{ const t=String(v??""); return /[;"\n]/.test(t)?`"${t.replace(/"/g,'""')}"`:t; }, txt="﻿"+L.map(r=>r.map(c).join(";")).join("\r\n");
  let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
  try{ if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([txt],{type:"text/csv"})); a.download=nomeF; document.body.appendChild(a); a.click(); a.remove(); }
    else { await dl.save({filename:nomeF,data:txt}); toast("CSV guardado"); } }
  catch(e){ if(e?.code!=="declined") toast("Não foi possível guardar o CSV ("+(e?.code||"erro")+")"); } }
const filtroTxt=F=>[`Época ${cF.ep}`,cF.me?`Meso ${(F.mesos.find(M=>M.id===cF.me)||{}).n||""}`:"",cF.mi?`Micro ${(F.micros.find(M=>M.id===cF.mi)||{}).n||""}`:"",cF.et?rotComp(cF.et):""].filter(Boolean).join(" · ");
const nomeCsv=(base,F)=>`${base}_SCA_${cF.ep.replace(".","-")}${cF.me?"_meso"+((F.mesos.find(M=>M.id===cF.me)||{}).n||""):""}${cF.mi?"_micro"+((F.micros.find(M=>M.id===cF.mi)||{}).n||""):""}${cF.et?"_"+cF.et:""}.csv`;

/* ---------- classificação: individual (sem GR) e guarda-redes ---------- */
function compStats(F){ const P={}, GR={}, pend=[], aviso=[];
  F.ls.forEach(U=>{ const at=atletasUT(U), aDe=k=>at.find(a=>a.k===k);
    U.exercicios.forEach(l=>{ const et=compDe(l); if(!et||(cF.et&&cF.et!==et)) return; const num=numerosUT(U)[l.id];
      jogosDe(U.id,l.id).forEach(J=>{ const r=resultado(J), gls=golosDe(J.id), info={U,num,J,r};
        if(!J.fim){ pend.push({...info,t:"sem resultado (falta «✓ Fim do jogo»)"}); return; }
        if(!J.semGR&&(!J.grA||!J.grB)) aviso.push({...info,t:"falta o GR: golos sofridos não atribuídos"});
        [["a","b"],["b","a"]].forEach(([e,o])=>{ const gm=r[e], gs=r[o], res=gm>gs?"V":gm<gs?"D":"E";
          atletasGrupo(U,J[e]).forEach(a=>{ if(ehGR(a)) return; const c=chaveT(a), x=P[c]||(P[c]={nome:nomeCurto(a),J:0,V:0,E:0,D:0,GM:0,GS:0,golos:0,AG:0,jogos:[]});
            x.J++; x[res]++; x.GM+=gm; x.GS+=gs; const meus=gls.filter(g=>g.k===a.k);
            x.jogos.push({U,num,eq:nomeGrupoUT(U,J[e]),res,gm,gs,golos:meus.filter(g=>!g.ag).length,ag:meus.filter(g=>g.ag).length}); });
          const gk=J.semGR?"":J["gr"+e.toUpperCase()]; if(gk){ const a=aDe(gk); if(a){ const c=chaveT(a), y=GR[c]||(GR[c]={nome:nomeCurto(a),J:0,GS:0,zero:0,jogos:[]}); y.J++; y.GS+=gs; if(!gs) y.zero++; y.jogos.push({U,num,eq:nomeGrupoUT(U,J[e]),gs}); } } });
        gls.forEach(g=>{ const a=aDe(g.k); if(!a||ehGR(a)) return; const x=P[chaveT(a)]; if(!x) return; if(g.ag) x.AG++; else x.golos++; }); }); }); });
  /* histórico do Excel (antes da app): J, V, E, D e golos; nos GR, jogos e golos sofridos */
  (F.hist||[]).filter(h=>h.tipo==="comp"&&(!cF.et||cF.et===h.et)).forEach(h=>h.linhas.forEach(l=>{ const nome=nomeHist(l);
    if(l.gr){ const y=GR[l.k]||(GR[l.k]={nome,J:0,GS:0,zero:0,jogos:[]}); y.J+=l.J; y.GS+=l.GS; y.jogos.push({hist:h,J:l.J,gs:l.GS}); return; }
    const x=P[l.k]||(P[l.k]={nome,J:0,V:0,E:0,D:0,GM:0,GS:0,golos:0,AG:0,jogos:[]}); ["J","V","E","D","golos"].forEach(c=>x[c]+=l[c]); x.jogos.push({hist:h,...l}); }));
  [P,GR].forEach(o=>Object.values(o).forEach(x=>x.jogos.sort((a,b)=>(a.hist?a.hist.data:a.U.data).localeCompare(b.hist?b.hist.data:b.U.data))));
  Object.values(P).forEach(x=>{ x.Pts=3*x.V+x.E; x.PtsJ=x.J?x.Pts/x.J:0; x.DG=x.GM-x.GS; });
  Object.values(GR).forEach(y=>{ y.med=y.J?y.GS/y.J:0; });
  return {P,GR,pend,aviso}; }
const COLS_C=[["J","J"],["V","V"],["E","E"],["D","D"],["Pts","Pts"],["PtsJ","Pts/J"],["GM","GM"],["GS","GS"],["DG","DG"],["golos","Golos"],["AG","AG"]];
const ordemC=(a,b)=>{ if(cOrd.k) return cOrd.d*((a[cOrd.k]-b[cOrd.k])||0)||b.Pts-a.Pts||b.DG-a.DG||b.GM-a.GM||b.golos-a.golos||a.nome.localeCompare(b.nome,"pt");
  return b.Pts-a.Pts||b.DG-a.DG||b.GM-a.GM||b.golos-a.golos||a.nome.localeCompare(b.nome,"pt"); };
const ordemG=(a,b)=>gOrd.k?gOrd.d*((a[gOrd.k]-b[gOrd.k])||0)||a.med-b.med||a.nome.localeCompare(b.nome,"pt"):a.med-b.med||b.J-a.J||a.nome.localeCompare(b.nome,"pt");
const f1=v=>(Math.round(v*100)/100).toFixed(2).replace(".",",");
function renderComp(){ const F=utsFiltro(), S=compStats(F); navFiltro(F,true);
  $("u-tit").textContent="Competição interna"; $("u-tag").hidden=true;
  $("u-bar").innerHTML=`<button class="btn sm" id="cp-csv">⬇ CSV</button>`; $("cp-csv").onclick=()=>csvComp(F,S);
  const ls=Object.entries(S.P).sort((a,b)=>ordemC(a[1],b[1])), gr=Object.entries(S.GR).sort((a,b)=>ordemG(a[1],b[1])), seta=(o,k)=>o.k===k?(o.d>0?" ▲":" ▼"):"";
  $("u-corpo").innerHTML=`<p class="sub" style="margin:0 14px 8px">Liga e Champions somam na mesma classificação. Pontos 3-1-0 por jogador (o resultado da equipa em que jogou). Desempate: Pts, DG, GM, golos. Os GR não entram aqui: têm a tabela deles.${F.hist.some(h=>h.tipo==="comp")?" Inclui o histórico do Excel (antes da app): J, V, E, D, Pts e golos; GM, GS e DG só contam os jogos registados na app.":""}</p>
    ${ls.length?`<div class="tblwrap" style="margin:0 14px 14px"><table class="ttab cptab"><thead><tr><th>#</th><th>Atleta</th>${COLS_C.map(([k,n])=>`<th class="n"><button class="lnk" data-o="${k}">${n}${seta(cOrd,k)}</button></th>`).join("")}</tr></thead><tbody>
      ${ls.map(([c,x],i)=>`<tr data-c="${esc(c)}"><td>${i+1}</td><td><b>${esc(x.nome)}</b></td>${COLS_C.map(([k])=>`<td class="n">${k==="PtsJ"?f1(x[k]):k==="Pts"?`<b>${x[k]}</b>`:x[k]}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
      :`<div class="m-vazio"><b>Sem jogos terminados neste filtro.</b><span>Os jogos registam-se na UT, no botão 🏆 dos exercícios marcados como Liga ou Champions.</span></div>`}
    <h3 class="cp-h">Guarda-redes</h3>
    ${gr.length?`<div class="tblwrap" style="margin:0 14px 14px"><table class="ttab cptab"><thead><tr><th>GR</th>${[["J","J"],["GS","Golos sofridos"],["med","Média GS"],["zero","Sem sofrer"]].map(([k,n])=>`<th class="n"><button class="lnk" data-og="${k}">${n}${seta(gOrd,k)}</button></th>`).join("")}</tr></thead><tbody>
      ${gr.map(([c,y])=>`<tr data-g="${esc(c)}"><td><b>${esc(y.nome)}</b></td><td class="n">${y.J}</td><td class="n">${y.GS}</td><td class="n"><b>${f1(y.med)}</b></td><td class="n">${y.zero}</td></tr>`).join("")}</tbody></table></div>`
      :`<p class="sub" style="margin:0 14px 14px">Ainda sem GR indicados em jogos terminados.</p>`}`;
  $("u-corpo").querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>{ const k=b.dataset.o; cOrd=cOrd.k===k?(cOrd.d<0?{k,d:1}:{k:"",d:-1}):{k,d:-1}; renderComp(); });
  $("u-corpo").querySelectorAll("[data-og]").forEach(b=>b.onclick=()=>{ const k=b.dataset.og; gOrd=gOrd.k===k?(gOrd.d>0?{k,d:-1}:{k:"",d:1}):{k,d:1}; renderComp(); });
  $("u-corpo").querySelectorAll("tr[data-c]").forEach(tr=>tr.onclick=()=>folhaJogosAtleta(S.P[tr.dataset.c],false));
  $("u-corpo").querySelectorAll("tr[data-g]").forEach(tr=>tr.onclick=()=>folhaJogosAtleta(S.GR[tr.dataset.g],true));
  const lst=S.pend.concat(S.aviso);
  $("u-panel").innerHTML=`<header><h2>Resumo</h2><p class="sub">${F.ls.length} UT · ${ls.length} atletas · ${gr.length} GR</p></header>
    <div class="add"><h3>Jogos assinalados <span class="count">${lst.length}</span></h3>${lst.length?`<ul class="uavisos">${lst.map((x,i)=>`<li><button class="lnk" data-i="${i}">UT${x.U.numero}</button> ${esc(x.num)} · série ${x.J.serie}: ${esc(x.t)}</li>`).join("")}</ul><p class="sub" style="margin:0">Jogos sem resultado não contam.</p>`:`<p class="sub" style="margin:0">Todos os jogos estão terminados e com GR.</p>`}</div>`;
  $("u-panel").querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{ const x=lst[+b.dataset.i]; uModo="ut"; try{ localStorage.setItem("sca-u-modo","ut"); }catch(e){} uCur=x.U.id; renderUT(); }); }
function folhaJogosAtleta(x,gr){ if(!x) return; const res={V:"Vitória",E:"Empate",D:"Derrota"};
  folha(`<h3>${esc(x.nome)}${gr?" · GR":""}</h3><p class="sub" style="margin:0">${gr?`${x.J} jogos · ${x.GS} golos sofridos · ${x.zero} sem sofrer`:`${x.J} jogos · ${x.Pts} pts · ${x.golos} golos${x.AG?` · ${x.AG} AG`:""}`}</p>
    <ul class="evl">${x.jogos.map(j=>j.hist?`<li><span style="flex:1"><b>${esc(dataPt_(j.hist.data).slice(0,5))}</b> · UT${j.hist.ut} · <i>Excel</i> · ${gr?`${j.J} ${j.J===1?"jogo":"jogos"} · sofreu ${j.gs}`:`${j.J} ${j.J===1?"jogo":"jogos"} · ${j.V}V ${j.E}E ${j.D}D${j.golos?` · ⚽ ${j.golos}`:""}`}</span></li>`
      :`<li><span style="flex:1"><b>${esc(dataPt_(j.U.data).slice(0,5))}</b> · UT${j.U.numero} ${esc(j.num)} · ${esc(j.eq)} · ${gr?`sofreu ${j.gs}`:`${res[j.res]} ${j.gm}–${j.gs}${j.golos?` · ⚽ ${j.golos}`:""}${j.ag?` · AG ${j.ag}`:""}`}</span></li>`).join("")}</ul>
    <div class="actions"><button class="btn primary" data-close>Fechar</button></div>`,()=>{}); }
function csvComp(F,S){ const ls=Object.values(S.P).sort(ordemC), gr=Object.values(S.GR).sort(ordemG);
  guardaCsv(nomeCsv("Competicao",F),[["SCA Performance · Competição interna",filtroTxt(F)],[],["#","Atleta",...COLS_C.map(c=>c[1])],
    ...ls.map((x,i)=>[i+1,x.nome,...COLS_C.map(([k])=>k==="PtsJ"?f1(x[k]):x[k])]),[],["Guarda-redes"],["GR","J","Golos sofridos","Média GS","Sem sofrer"],
    ...gr.map(y=>[y.nome,y.J,y.GS,f1(y.med),y.zero]),[],["Jogos assinalados"],["UT","Exercício","Série","Motivo"],...S.pend.concat(S.aviso).map(x=>["UT"+x.U.numero,x.num,x.J.serie,x.t])]); }

/* ---------- Rankings do Meinho: Rei do Meinho (21 passes) e Rei das Cuecas ---------- */
function meinhoStats(F){ const R={"21":{},cueca:{}};
  F.ls.forEach(U=>{ const ls=U.exercicios.filter(meinhoDe); if(!ls.length) return; const at=atletasUT(U), lids=new Set(ls.map(l=>l.id)), num=numerosUT(U);
    at.filter(a=>presenteUT(U,a.k)).forEach(a=>["21","cueca"].forEach(t=>{ const c=chaveT(a), x=R[t][c]||(R[t][c]={nome:nomeCurto(a),tot:0,nUT:0,oc:[]}); x.nUT++; }));
    Object.values(meinhoRegs).filter(m=>m.ut===U.id&&lids.has(m.lid)).forEach(m=>m.ks.forEach(k=>{ const a=at.find(x=>x.k===k); if(!a) return; const c=chaveT(a), x=R[m.tipo][c]||(R[m.tipo][c]={nome:nomeCurto(a),tot:0,nUT:0,oc:[]});
      x.tot++; x.oc.push({U,num:num[m.lid],em:m.em,com:m.ks.filter(o=>o!==k).map(o=>nomeK(U,o))}); })); });
  /* histórico do Excel: contagens por UT; «UT com meinho» só quando estava presente (presenças do emjogo) */
  (F.hist||[]).filter(h=>h.tipo==="meinho").forEach(h=>h.linhas.forEach(l=>["21","cueca"].forEach(t=>{ const n=t==="21"?l.m21:l.cuecas;
    if(!n&&!l.presente) return; const x=R[t][l.k]||(R[t][l.k]={nome:nomeHist(l),tot:0,nUT:0,oc:[]}); if(l.presente) x.nUT++; x.tot+=n; for(let i=0;i<n;i++) x.oc.push({hist:h,em:h.data,com:[]}); })));
  ["21","cueca"].forEach(t=>Object.values(R[t]).forEach(x=>{ x.med=x.nUT?x.tot/x.nUT:0; x.oc.sort((a,b)=>a.em.localeCompare(b.em)); }));
  return R; }
function renderRank(){ const F=utsFiltro(), R=meinhoStats(F); navFiltro(F,false);
  $("u-tit").textContent="Rankings do Meinho"; $("u-tag").hidden=true;
  $("u-bar").innerHTML=`<button class="btn sm" id="rk-csv">⬇ CSV</button>`; $("rk-csv").onclick=()=>csvRank(F,R);
  const quadro=(t,tit)=>{ const ls=Object.entries(R[t]).filter(([,x])=>x.tot||x.nUT).sort((a,b)=>b[1].tot-a[1].tot||b[1].med-a[1].med||a[1].nome.localeCompare(b[1].nome,"pt")), top=ls.length?ls[0][1].tot:0, reis=top?ls.filter(([,x])=>x.tot===top):[];
    return `<section class="rk"><h3 class="cp-h">${tit}</h3>${reis.length?`<div class="rk-rei">👑 <b>${esc(reis.map(([,x])=>x.nome).join(" · "))}</b><span>${top} ${t==="cueca"?(top===1?"cueca":"cuecas"):"× 21 passes"}${reis.length>1?" · partilham o título":""}</span></div>`:""}
      ${ls.length?`<div class="tblwrap" style="margin:0 14px 14px"><table class="ttab"><thead><tr><th>#</th><th>Atleta</th><th class="n">Total</th><th class="n">UT com meinho</th><th class="n">Média por UT</th></tr></thead><tbody>
        ${ls.map(([c,x],i)=>`<tr data-t="${t}" data-c="${esc(c)}"><td>${top&&x.tot===top?"👑":i+1}</td><td><b>${esc(x.nome)}</b></td><td class="n"><b>${x.tot}</b></td><td class="n">${x.nUT}</td><td class="n">${f1(x.med)}</td></tr>`).join("")}</tbody></table></div>`
        :`<p class="sub" style="margin:0 14px 14px">Sem UT com meinho neste filtro.</p>`}</section>`; };
  $("u-corpo").innerHTML=`<p class="sub" style="margin:0 14px 8px">Cada registo vale 1 para cada atleta escolhido. Os GR entram como os outros. «UT com meinho» = UT com exercício de meinho em que o atleta esteve presente.</p>${quadro("21","Rei do Meinho (21 passes)")}${quadro("cueca","Rei das Cuecas")}`;
  $("u-corpo").querySelectorAll("tr[data-c]").forEach(tr=>tr.onclick=()=>{ const x=R[tr.dataset.t][tr.dataset.c]; if(!x) return;
    folha(`<h3>${esc(x.nome)} · ${tr.dataset.t==="cueca"?"Cuecas":"21 passes"}</h3><p class="sub" style="margin:0">${x.tot} em ${x.nUT} UT com meinho.</p>
      <ul class="evl">${x.oc.map(o=>o.hist?`<li><span><b>${esc(dataPt_(o.hist.data).slice(0,5))}</b> · UT${o.hist.ut} · <i>Excel</i></span></li>`:`<li><span><b>${esc(dataPt_(o.U.data).slice(0,5))}</b> · UT${o.U.numero} ${esc(o.num)} · ${esc(new Date(o.em).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}))}${o.com.length?" · com "+esc(o.com.join(", ")):""}</span></li>`).join("")||`<li><span class="sub">Sem ocorrências.</span></li>`}</ul>
      <div class="actions"><button class="btn primary" data-close>Fechar</button></div>`,()=>{}); });
  const hM=F.hist.filter(h=>h.tipo==="meinho"), nM=F.ls.filter(U=>U.exercicios.some(meinhoDe)).length+hM.length, nR=Object.values(meinhoRegs).filter(m=>F.ls.some(U=>U.id===m.ut)).length+hM.reduce((a,h)=>a+h.linhas.reduce((b,l)=>b+l.m21+l.cuecas,0),0);
  $("u-panel").innerHTML=`<header><h2>Resumo</h2><p class="sub">${F.ls.length} UT · ${nM} com meinho · ${nR} registos</p></header>`; }
function csvRank(F,R){ const tab=t=>Object.values(R[t]).filter(x=>x.tot||x.nUT).sort((a,b)=>b.tot-a.tot||a.nome.localeCompare(b.nome,"pt")).map((x,i)=>[i+1,x.nome,x.tot,x.nUT,f1(x.med)]);
  guardaCsv(nomeCsv("Meinho",F),[["SCA Performance · Rankings do Meinho",filtroTxt(F)],[],["Rei do Meinho (21 passes)"],["#","Atleta","Total","UT com meinho","Média por UT"],...tab("21"),[],["Rei das Cuecas"],["#","Atleta","Total","UT com meinho","Média por UT"],...tab("cueca")]); }
