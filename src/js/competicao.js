/* ---------- Competição interna (Liga / Champions) e Meinho (no separador Treino; junta-se ao 4.º <script>, depois de tempos.js) ---------- */
/* Marcação no exercício do repositório (comp: "liga"|"champions"|"", meinho) e ajuste só numa UT na linha (l.comp / l.meinho; sem campo = como no repositório).
   Registos, um documento cada (dois aparelhos ao mesmo tempo):
   compJogos/{id} = {id, ut, lid, serie (ordem do jogo), volta?, jornada? (Liga), a, b (ids dos grupos; na Champions a = equipa na mesa), grA, grB (GR de cada lado:
                    qualquer GR presente, não preso a uma equipa), semGR, fim, criadoEm, criadoPor}
                    v110: mais {a:[k], b:[k]} (reforços de outra equipa só neste jogo) e menos {a:[k], b:[k]} (quem saiu da equipa neste jogo)
   compGolos/{id} = {id, jogo, eq: "a"|"b" (equipa que ganha o golo), k (quem marcou), ag (auto-golo: k é da outra equipa), v (v110: 2 = golo que vale 2), em, por}
                    Golo que vale 2: conta 2 no resultado (V/E/D, GM, GS e DG das equipas); 1 golo para o marcador e 1 golo sofrido para o GR.
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
  ...(+d.volta>0?{volta:Math.round(+d.volta),jornada:Math.max(1,Math.round(+d.jornada)||1)}:{}),   // Liga (v98): volta e jornada do todos contra todos
  grA:s(d.grA),grB:s(d.grB),semGR:!!d.semGR,fim:!!d.fim,criadoEm:s(d.criadoEm),criadoPor:s(d.criadoPor),...ajJogo(d)}; }
/* v110: reforços e saídas num jogo (só se houver) */
function ajJogo(d){ const out={}; ["mais","menos"].forEach(c=>{ const o=d[c]&&typeof d[c]==="object"?d[c]:{}, x={};
  ["a","b"].forEach(e=>{ const l=[...new Set((Array.isArray(o[e])?o[e]:[]).map(v=>String(v??"").trim()).filter(Boolean))]; if(l.length) x[e]=l; }); if(Object.keys(x).length) out[c]=x; }); return out; }
function normGoloInt(d){ const s=v=>String(v??"").trim(); return {id:s(d.id)||uId("cg"),jogo:s(d.jogo),eq:d.eq==="b"?"b":"a",k:s(d.k),ag:!!d.ag,...(+d.v===2?{v:2}:{}),em:s(d.em),por:s(d.por)}; }
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
const grDoGrupo=(U,gid)=>(atletasGrupo(U,gid).find(ehGR)||{}).k||"";
const valorGolo=g=>g.v===2?2:1;
const resultado=J=>{ const gs=golosDe(J.id), t=e=>gs.filter(g=>g.eq===e).reduce((a,g)=>a+valorGolo(g),0); return {a:t("a"),b:t("b")}; };
/* v110: quem jogou por um lado num jogo = o grupo (presentes) − quem saiu − quem foi reforçar o outro lado + os reforços deste lado */
function jogadoresJogo(U,J,e){ const o=e==="a"?"b":"a", mais=(J.mais&&J.mais[e])||[], menos=(J.menos&&J.menos[e])||[], fora=(J.mais&&J.mais[o])||[], at=atletasUT(U);
  return [...atletasGrupo(U,J[e]).filter(a=>!menos.includes(a.k)&&!fora.includes(a.k)),...mais.map(k=>at.find(a=>a.k===k)).filter(a=>a&&presenteUT(U,a.k))]; }
/* v110: na linha da UT, a rotação que conta (pelos jogos terminados) */
function jogosMiniHtml(U,sj){ const nm=g=>nomeGrupoUT(U,g);
  return `<small class="utx-tp">⏱ Tempos pelos ${sj.length} ${sj.length===1?"jogo":"jogos"} terminados (${fmtTempo(sj[0].seg)} cada${sj.length>1&&sj.some(x=>x.seg!==sj[0].seg)?", aprox.":""})</small>
    <div class="tblwrap"><table class="urot mini"><thead><tr><th>Jogo</th><th>Equipas</th><th>Res.</th></tr></thead><tbody>${sj.map((x,i)=>{ const r=resultado(x.J), aj=(x.J.mais?Object.values(x.J.mais).flat().length:0)+(x.J.menos?Object.values(x.J.menos).flat().length:0);
      return `<tr><th>${i+1}</th><td style="padding:3px 8px;text-align:left">${esc(nm(x.J.a))} × ${esc(nm(x.J.b))}${aj?" · ↔":""}</td><td>${r.a}–${r.b}</td></tr>`; }).join("")}</tbody></table></div>`; }
/* v110: tempos de um exercício de competição pelos jogos terminados (cada jogo é uma série; o tempo de prática divide-se pelos jogos) → null se não houver */
function seriesPorJogos(U,l){ if(!compDe(l)) return null; const js=jogosDe(U.id,l.id).filter(J=>J.fim); if(!js.length) return null;
  const p=praticaEx(l.copia), n=js.length; return js.map((J,i)=>({J,seg:Math.round(p*(i+1)/n)-Math.round(p*i/n),a:jogadoresJogo(U,J,"a").map(x=>x.k),b:jogadoresJogo(U,J,"b").map(x=>x.k)})); }

/* Liga: voltas de todos contra todos (método do círculo); com nº ímpar de equipas, em cada jornada descansa quem não joga */
function jogosLiga(gs,voltas){ const t=gs.length%2?[...gs,""]:gs.slice(), n=t.length, jor=[];
  for(let r=0;r<n-1;r++){ const ro=[]; for(let i=0;i<n/2;i++){ const a=t[i], b=t[n-1-i]; if(a&&b) ro.push(r%2?[b,a]:[a,b]); } jor.push(ro); t.splice(1,0,t.pop()); }
  const out=[]; for(let v=1;v<=voltas;v++) jor.forEach((ro,j)=>ro.forEach(([a,b])=>out.push({volta:v,jornada:j+1,a,b}))); return out; }
/* Champions (quem ganha fica): a = equipa na mesa, b = a que entra; quem perde vai para o fim da fila; empate = sai quem já estava na mesa (a) */
function proxChampions(gs,js){ const fila=gs.slice(); let mesa=null;
  for(const J of js){ if(!J.fim) return null; [J.a,J.b].forEach(x=>{ const i=fila.indexOf(x); if(i>=0) fila.splice(i,1); });
    const r=resultado(J), fica=r.a>r.b?J.a:J.b; fila.push(fica===J.a?J.b:J.a); mesa=fica; }
  if(!mesa) return gs.length>=2?{a:gs[0],b:gs[1],fila:gs.slice(2)}:null;
  const b=fila.shift(); return b?{a:mesa,b,fila}:null; }
/* GR de um lado do jogo: o GR do grupo; senão o que defendeu essa equipa no jogo anterior do mesmo exercício */
function grPara(U,js,gid){ const g=grDoGrupo(U,gid); if(g) return g;
  for(let i=js.length-1;i>=0;i--){ const J=js[i]; if(J.a===gid&&J.grA) return J.grA; if(J.b===gid&&J.grB) return J.grB; } return ""; }
/* os GR não estão presos a uma equipa: podem defender qualquer equipa em cada jogo (todos os GR presentes na UT e os jogadores dessa equipa) */
const opcoesGR=(U,gid,J,e)=>{ const at=atletasUT(U).filter(a=>presenteUT(U,a.k)), grs=at.filter(ehGR), eq=(J?jogadoresJogo(U,J,e):atletasGrupo(U,gid)).filter(a=>!ehGR(a));
  return [...grs,...eq]; };

/* ---------- 🏆 registo dos jogos de um exercício da UT (Liga: voltas de todos contra todos; Champions: quem ganha fica) ---------- */
function folhaCompUT(id,lid){ const U0=uts[id], l=U0&&U0.exercicios.find(x=>x.id===lid); if(!l) return; const et=compDe(l), liga=et==="liga", num=numerosUT(U0)[lid];
  /* golo = {jid, eq, ag, v} enquanto se escolhe o marcador; escolhido = jogo aberto (v110: qualquer jogo, por jogar ou terminado, para jogar fora de ordem ou corrigir) */
  let golo=null, voltas=1, escolhido="", vale2=false;
  folha(`<h3>🏆 ${esc(rotComp(et)||"Competição")} · ${num} ${esc(l.copia.nome)}</h3><p class="sub" style="margin:0">UT${U0.numero} · ${esc(dataPt_(U0.data))} · ${liga?"Liga: todos contra todos, todas as equipas fazem o mesmo nº de jogos.":"Champions: quem ganha fica; num empate sai quem já estava na mesa."}</p>
    <div id="cp-c"></div><div class="actions"><button class="btn primary" data-close>Fechar</button></div>`,(s,fecha)=>{
    const c=s.querySelector("#cp-c");
    const novo=(U,js,o)=>gravaJogoInt({id:uId("cj"),ut:id,lid,grA:grPara(U,js,o.a),grB:grPara(U,js,o.b),criadoEm:new Date().toISOString(),criadoPor:meuId||"",...o});
    const desenha=()=>{ const U=uts[id]; if(!U){ fecha(); return; } const gs=(l.grupos||[]).filter(g=>U.grupos.some(x=>x.id===g)), js=jogosDe(id,lid), nm=g=>nomeGrupoUT(U,g);
      if(golo){ const J=compJogos[golo.jid]; if(!J){ golo=null; desenha(); return; } const eqMarca=golo.ag?(golo.eq==="a"?"b":"a"):golo.eq, grK=J["gr"+eqMarca.toUpperCase()];
        const at=jogadoresJogo(U,J,eqMarca).sort((a,b)=>nomeCurto(a).localeCompare(nomeCurto(b),"pt")), gr=grK&&!at.some(a=>a.k===grK)?atletasUT(U).find(a=>a.k===grK):null, mais=(J.mais&&J.mais[eqMarca])||[];
        c.innerHTML=`<h4>${golo.ag?`Auto-golo: quem de ${esc(nm(J[eqMarca]))} o fez?`:`Golo de ${esc(nm(J[golo.eq]))}: quem marcou?`}</h4>
          <div class="seg" id="cp-v2"><button data-v="1" aria-pressed="${!vale2}">Golo normal</button><button data-v="2" aria-pressed="${vale2}">Golo que vale 2</button></div>
          ${vale2?`<p class="sub" style="margin:0">Conta 2 no resultado; 1 golo para o marcador e 1 golo sofrido para o GR.</p>`:""}
          <div class="pgrid cp-pick">${[...at,...(gr?[gr]:[])].map(a=>`<button data-k="${esc(a.k)}"><b>${esc(nomeCurto(a))}</b><small>${ehGR(a)?"GR":mais.includes(a.k)?"reforço":""}</small></button>`).join("")||`<p class="sub">Ninguém presente nesta equipa.</p>`}${golo.ag?"":`<button class="cp-ag" data-ag="1"><b>Auto-golo</b><small>de um adversário</small></button>`}</div>
          <div class="actions"><button class="btn" id="cp-cx">Cancelar</button></div>`;
        c.querySelectorAll("#cp-v2 button").forEach(b=>b.onclick=()=>{ vale2=b.dataset.v==="2"; desenha(); });
        c.querySelector("#cp-cx").onclick=()=>{ golo=null; vale2=false; desenha(); };
        c.querySelectorAll(".cp-pick [data-k]").forEach(b=>b.onclick=()=>{ gravaGolo({id:uId("cg"),jogo:J.id,eq:golo.eq,k:b.dataset.k,ag:golo.ag,...(vale2?{v:2}:{}),em:new Date().toISOString(),por:meuId||""});
          toast(`${golo.ag?"Auto-golo registado":"Golo registado"}${vale2?" (vale 2)":""}`); golo=null; vale2=false; desenha(); });
        const ag=c.querySelector("[data-ag]"); if(ag) ag.onclick=()=>{ golo={...golo,ag:true}; desenha(); };
        return; }
      if(gs.length<2){ c.innerHTML=`<p class="sub" style="margin:0">Este exercício precisa de pelo menos 2 grupos (as equipas). Escolhe-os em 👥 Grupos.</p>`; return; }
      const atual=js.find(J=>J.id===escolhido)||js.find(J=>!J.fim)||null, feitos=js.filter(J=>J.fim);
      const desc=J=>liga&&J.jornada?gs.filter(g=>!js.some(x=>x.volta===J.volta&&x.jornada===J.jornada&&(x.a===g||x.b===g))):[];
      const opGR=(J,e,sel)=>`<option value="">— escolher —</option>`+opcoesGR(U,J[e],J,e).map(a=>`<option value="${esc(a.k)}"${a.k===sel?" selected":""}>${esc(nomeCurto(a))}${ehGR(a)?" (GR)":""}</option>`).join("");
      const opEq=sel=>gs.map(g=>`<option value="${esc(g)}"${g===sel?" selected":""}>${esc(nm(g))}</option>`).join("");
      let h="";
      if(!js.length){
        if(liga){ const P=jogosLiga(gs,voltas), porEq=P.filter(p=>p.a===gs[0]||p.b===gs[0]).length;
          h+=`<div class="cp-ini"><p style="margin:0">Equipas: <b>${gs.map(g=>esc(nm(g))).join(", ")}</b></p><h4>Nº de voltas (todos contra todos)</h4>
            <div class="seg" id="cp-v">${[1,2,3,4].map(v=>`<button data-v="${v}" aria-pressed="${v===voltas}">${v}</button>`).join("")}</div>
            <p class="sub" style="margin:0">${P.length} jogos · cada equipa joga ${porEq}${gs.length%2?" · em cada jogo descansa uma equipa":""}.</p>
            <button class="btn primary cp-big" id="cp-gera">Gerar ${P.length} jogos</button></div>`; }
        else h+=`<div class="cp-ini"><p style="margin:0">Entram por esta ordem: <b>${gs.map(g=>esc(nm(g))).join(" → ")}</b> (a ordem dos grupos em 👥 Grupos).</p>
            <button class="btn primary cp-big" id="cp-ini">▶ Começar: ${esc(nm(gs[0]))} × ${esc(nm(gs[1]))}</button></div>`; }
      if(atual){ const J=atual, r=resultado(J), gls=golosDe(J.id), d=desc(J), falta=!J.semGR&&(!J.grA||!J.grB), n=js.indexOf(J)+1;
        const lado=e=>{ const eq=jogadoresJogo(U,J,e), mais=(J.mais&&J.mais[e])||[], menos=(J.menos&&J.menos[e])||[], o=e==="a"?"b":"a", noJogo=new Set([...eq,...jogadoresJogo(U,J,o)].map(a=>a.k));
          const podem=atletasUT(U).filter(a=>presenteUT(U,a.k)&&!ehGR(a)&&!eq.some(x=>x.k===a.k)).sort((a,b)=>nomeCurto(a).localeCompare(nomeCurto(b),"pt"));
          return `<div class="cp-lado"><b>${esc(nm(J[e]))} · ${eq.filter(a=>!ehGR(a)).length}</b><div class="chips">${eq.filter(a=>!ehGR(a)).map(a=>`<span class="chip${mais.includes(a.k)?" cp-ref":""}">${esc(nomeCurto(a))}${mais.includes(a.k)?" <small>reforço</small>":""}<button class="icon" data-tira="${e}" data-k="${esc(a.k)}" aria-label="Tirar deste jogo">✕</button></span>`).join("")}</div>
            ${menos.length?`<p class="sub" style="margin:0">Saíram: ${menos.map(k=>`<button class="lnk" data-volta="${e}" data-k="${esc(k)}">↺ ${esc(nomeK(U,k))}</button>`).join(" ")}</p>`:""}
            <label class="f">+ Reforço de outra equipa<select data-ref="${e}"><option value="">— escolher —</option>${podem.map(a=>`<option value="${esc(a.k)}">${esc(nomeCurto(a))}${noJogo.has(a.k)?" (está no outro lado)":""}</option>`).join("")}</select></label></div>`; };
        const nAj=["mais","menos"].reduce((t,c)=>t+(J[c]?Object.values(J[c]).flat().length:0),0);
        h+=`<div class="cp-atual${J.fim?" fim":""}" data-j="${esc(J.id)}"><div class="cp-cab"><span class="cp-s">Jogo ${n}${liga&&J.volta?` · ${J.volta}.ª volta`:""}</span>${d.length?`<span class="sub">descansa ${esc(d.map(nm).join(", "))}</span>`:""}${J.fim?`<span class="chip rev">a corrigir</span>`:""}</div>
          <div class="cp-placar"><div class="cp-eq2"><b>${esc(nm(J.a))}</b><button class="btn primary cp-gol" data-g="a">+ golo</button></div><b class="cp-pl">${r.a} – ${r.b}</b><div class="cp-eq2"><b>${esc(nm(J.b))}</b><button class="btn primary cp-gol" data-g="b">+ golo</button></div></div>
          ${gls.length?`<ul class="cp-gl">${gls.map(g=>`<li><span>⚽ ${esc(nomeK(U,g.k))}${g.ag?" (AG)":""}${g.v===2?" <b>(vale 2)</b>":""} · ${esc(nm(J[g.eq]))}</span><button class="icon" data-xg="${esc(g.id)}" aria-label="Tirar golo">✕</button></li>`).join("")}</ul>`:""}
          <details class="cp-grd"${falta?" open":""}><summary>GR: ${J.semGR?"sem GR neste jogo":`${esc(J.grA?nomeK(U,J.grA):"—")} (${esc(nm(J.a))}) · ${esc(J.grB?nomeK(U,J.grB):"—")} (${esc(nm(J.b))})`}${falta?" · ⚠ falta escolher":""}</summary>
            <div class="cp-gr">${J.semGR?"":`<label class="f">GR ${esc(nm(J.a))}<select data-f="grA">${opGR(J,"a",J.grA)}</select></label><label class="f">GR ${esc(nm(J.b))}<select data-f="grB">${opGR(J,"b",J.grB)}</select></label>`}
              <button class="btn sm ghost" data-semgr>${J.semGR?"Pedir GR":"Sem GR"}</button></div></details>
          <details class="cp-grd cp-jog"${nAj?" open":""}><summary>👥 Jogadores neste jogo${nAj?` · ${nAj} ${nAj===1?"alteração":"alterações"}`:" · equipa com menos 1? junta um reforço"}</summary>
            <div class="cp-lados">${lado("a")}${lado("b")}</div><p class="sub" style="margin:0">Só neste jogo. O reforço conta pela equipa que reforça (resultado e tempo); os golos dele contam para ele.</p></details>
          ${liga?`<details class="cp-grd"><summary>✎ Equipas deste jogo</summary><div class="cp-gr"><label class="f">Equipa 1<select data-eq="a">${opEq(J.a)}</select></label><label class="f">Equipa 2<select data-eq="b">${opEq(J.b)}</select></label></div></details>`:""}
          <div class="cp-ac">${J.fim?`<button class="btn primary cp-big" data-ok>✓ Correção feita</button>`:`<button class="btn primary cp-big" data-fim>✓ Fim do jogo · ${r.a}–${r.b}</button>`}${gls.length?`<button class="btn ghost danger" data-xj>Apagar jogo e ${gls.length} ${gls.length===1?"golo":"golos"}</button>`:`<button class="btn ghost danger" data-xj>Tirar jogo</button>`}</div>
          ${J.fim&&!liga?`<p class="sub" style="margin:0">Na Champions, mudar este resultado não muda os jogos seguintes já feitos.</p>`:""}</div>`; }
      else if(js.length){ if(liga) h+=`<div class="cp-fimliga">✓ Liga terminada: ${js.length} jogos.</div>`;
        else { const P=proxChampions(gs,js), ult=js[js.length-1], ru=resultado(ult);
          if(P) h+=`<div class="cp-ini"><p style="margin:0">Último: ${esc(nm(ult.a))} ${ru.a}–${ru.b} ${esc(nm(ult.b))} · fica <b>${esc(nm(P.a))}</b>${ru.a===ru.b?" (empate: sai quem estava na mesa)":""}.</p>
            <button class="btn primary cp-big" id="cp-prox">▶ Próximo jogo: ${esc(nm(P.a))} × ${esc(nm(P.b))}</button><p class="sub" style="margin:0">Fila: ${esc(P.fila.map(nm).join(", ")||"—")}. Quando acabar o tempo, é só fechar.</p></div>`; } }
      /* v110: a competição toda deste exercício — classificação das equipas e todos os jogos (feitos e por jogar), cada um abre-se para jogar ou corrigir */
      if(js.length){ const T={}; gs.forEach(g=>T[g]={J:0,V:0,E:0,D:0,GM:0,GS:0});
        feitos.forEach(J=>{ const r=resultado(J); [["a","b"],["b","a"]].forEach(([e,o])=>{ const t=T[J[e]]; if(!t) return; t.J++; t.GM+=r[e]; t.GS+=r[o]; t[r[e]>r[o]?"V":r[e]<r[o]?"D":"E"]++; }); });
        const ord=gs.slice().sort((a,b)=>(3*T[b].V+T[b].E)-(3*T[a].V+T[a].E)||(T[b].GM-T[b].GS)-(T[a].GM-T[a].GS)||T[b].GM-T[a].GM);
        if(feitos.length) h+=`<h4>Equipas neste exercício</h4><div class="tblwrap"><table class="ttab cp-eqtab"><thead><tr><th>Equipa</th><th class="n">J</th><th class="n">V</th><th class="n">E</th><th class="n">D</th><th class="n">GM</th><th class="n">GS</th><th class="n">Pts</th></tr></thead><tbody>
          ${ord.map(g=>{ const t=T[g]; return `<tr><td><b>${esc(nm(g))}</b></td><td class="n">${t.J}</td><td class="n">${t.V}</td><td class="n">${t.E}</td><td class="n">${t.D}</td><td class="n">${t.GM}</td><td class="n">${t.GS}</td><td class="n"><b>${3*t.V+t.E}</b></td></tr>`; }).join("")}</tbody></table></div>`;
        h+=`<h4>Jogos · ${feitos.length} de ${js.length} terminados</h4><ul class="cp-lista">${js.map((J,i)=>{ const r=resultado(J), va=r.a>r.b, vb=r.b>r.a, aberto=atual&&J.id===atual.id, gl=golosDe(J.id);
            return `<li class="${J.fim?"":"pend"}${aberto?" cp-sel":""}"><span class="cp-n">${i+1}</span><span class="cp-r"><span class="${va?"v":""}">${esc(nm(J.a))}</span> <b>${J.fim||gl.length?`${r.a}–${r.b}`:"×"}</b> <span class="${vb?"v":""}">${esc(nm(J.b))}</span>${J.fim?"":` <small class="sub">${aberto?"a jogar":"por jogar"}</small>`}${gl.length?`<small class="sub cp-mk">${esc(gl.map(g=>nomeK(U,g.k)+(g.ag?" (AG)":"")+(g.v===2?" ×2":"")).join(", "))}</small>`:""}</span>${aberto?"":`<button class="btn sm ghost" data-abre="${esc(J.id)}">${J.fim?"✎ Corrigir":"▶ Jogar"}</button>`}</li>`; }).join("")}</ul>
          ${liga?`<button class="btn" id="cp-extra">+ Jogo extra</button>`:""}`; }
      c.innerHTML=h;
      s.querySelectorAll("#cp-v button").forEach(b=>b.onclick=()=>{ voltas=+b.dataset.v; desenha(); });
      const ge=c.querySelector("#cp-gera"); if(ge) ge.onclick=()=>{ const P=jogosLiga(gs,voltas); P.forEach((p,i)=>novo(U,jogosDe(id,lid),{serie:i+1,...p})); toast(`${P.length} jogos gerados`); desenha(); };
      const ini=c.querySelector("#cp-ini"); if(ini) ini.onclick=()=>{ novo(U,[],{serie:1,a:gs[0],b:gs[1]}); desenha(); };
      const px=c.querySelector("#cp-prox"); if(px) px.onclick=()=>{ const P=proxChampions(gs,js); if(P) novo(U,js,{serie:js.length+1,a:P.a,b:P.b}); desenha(); };
      const ex=c.querySelector("#cp-extra"); if(ex) ex.onclick=()=>{ const J=novo(U,js,{serie:(js.length?Math.max(...js.map(x=>x.serie)):0)+1,a:gs[0],b:gs[1]}); escolhido=J.id; toast("Jogo extra criado: escolhe as equipas em ✎ Equipas deste jogo"); desenha(); };
      c.querySelectorAll("[data-abre]").forEach(b=>b.onclick=()=>{ escolhido=b.dataset.abre; desenha(); c.querySelector(".cp-atual")?.scrollIntoView({block:"start",behavior:"smooth"}); });
      const el=c.querySelector(".cp-atual"); if(el){ const J=compJogos[el.dataset.j], upd=o=>{ gravaJogoInt({...J,...o}); desenha(); };
        el.querySelectorAll("select[data-f]").forEach(sel=>sel.onchange=()=>upd({[sel.dataset.f]:sel.value}));
        el.querySelectorAll("select[data-eq]").forEach(sel=>sel.onchange=()=>{ const e=sel.dataset.eq, o=e==="a"?"b":"a", v=sel.value; if(v===J[o]){ upd({[e]:v,[o]:J[e]}); toast("As duas equipas trocaram de lado"); } else upd({[e]:v,["gr"+e.toUpperCase()]:grPara(uts[id],js,v)}); });
        el.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{ golo={jid:J.id,eq:b.dataset.g,ag:false}; vale2=false; desenha(); });
        el.querySelectorAll("[data-xg]").forEach(b=>confirma2(b,"Tirar?",()=>{ tiraGolo(b.dataset.xg); desenha(); }));
        /* reforços e saídas (só neste jogo) */
        const aj=(c_,e,f)=>{ const x={...(J[c_]||{})}; x[e]=f((x[e]||[]).slice()); if(!x[e].length) delete x[e]; return x; };
        el.querySelectorAll("[data-tira]").forEach(b=>b.onclick=()=>{ const e=b.dataset.tira, k=b.dataset.k;
          if(((J.mais&&J.mais[e])||[]).includes(k)) upd({mais:aj("mais",e,l_=>l_.filter(x=>x!==k))}); else upd({menos:aj("menos",e,l_=>[...l_,k])}); });
        el.querySelectorAll("[data-volta]").forEach(b=>b.onclick=()=>{ const e=b.dataset.volta, k=b.dataset.k; upd({menos:aj("menos",e,l_=>l_.filter(x=>x!==k))}); });
        el.querySelectorAll("select[data-ref]").forEach(sel=>sel.onchange=()=>{ const e=sel.dataset.ref, o=e==="a"?"b":"a", k=sel.value; if(!k) return;
          const menos=aj("menos",e,l_=>l_.filter(x=>x!==k)), mais=aj("mais",e,l_=>[...l_,k]); if(mais[o]) { mais[o]=mais[o].filter(x=>x!==k); if(!mais[o].length) delete mais[o]; }
          upd({mais,menos}); toast(`${nomeK(uts[id],k)} reforça ${nm(J[e])} neste jogo`); });
        const sg=el.querySelector("[data-semgr]"); if(sg) sg.onclick=()=>upd({semGR:!J.semGR});
        const f=el.querySelector("[data-fim]"); if(f) f.onclick=()=>{ const r=resultado(J); escolhido=""; upd({fim:true}); toast(`Fim do jogo · ${r.a}–${r.b}`); };
        const ok=el.querySelector("[data-ok]"); if(ok) ok.onclick=()=>{ escolhido=""; desenha(); };
        const xj=el.querySelector("[data-xj]"); if(xj) confirma2(xj,"Toca outra vez para apagar",()=>{ escolhido=""; tiraJogoInt(J.id); desenha(); }); } };
    compRedesenha=desenha; desenha();
    const obs=new MutationObserver(()=>{ if(!$("sheet-root").innerHTML){ compRedesenha=null; obs.disconnect(); renderUT(); } }); obs.observe($("sheet-root"),{childList:true}); }); }

/* ---------- 👑 Meinho: registo rápido ---------- */
function folhaMeinhoUT(id,lid){ const U0=uts[id], l=U0&&U0.exercicios.find(x=>x.id===lid); if(!l) return; const num=numerosUT(U0)[lid];
  /* v110: grelha sem altura máxima (rola a folha toda; antes, no telemóvel e no iPad os nomes de baixo ficavam por trás dos botões e não se tocavam),
     pesquisa pelo nome que não se perde ao tocar, e «GR participam» por exercício nesta UT (l.mhSemGR = os GR não entraram) */
  let tipo="21", sel=[], q="";
  folha(`<h3>👑 Meinho · ${num} ${esc(l.copia.nome)}</h3><p class="sub" style="margin:0">UT${U0.numero}. Cada registo vale 1 para cada atleta escolhido.</p>
    <div class="seg" id="mh-t"><button data-k="21">21 passes (1 a 3 no meio)</button><button data-k="cueca">Cueca (quem levou)</button></div>
    <div class="mh-top"><input type="search" id="mh-q" placeholder="🔍 Procurar jogador" autocomplete="off" autocorrect="off" spellcheck="false"><button class="btn" id="mh-gr"></button></div>
    <div id="mh-c"></div>
    <div class="mh-bar"><p class="sub" id="mh-s" style="margin:0"></p><div class="actions" style="justify-content:stretch"><button class="btn primary" id="mh-ok" style="flex:1;min-height:52px"></button><button class="btn" data-close>Fechar</button></div></div>`,(s,fecha)=>{
    const c=s.querySelector("#mh-c"), qi=s.querySelector("#mh-q"), gb=s.querySelector("#mh-gr"), ok=s.querySelector("#mh-ok"), st=s.querySelector("#mh-s");
    const linha=()=>{ const U=uts[id]; return U&&U.exercicios.find(x=>x.id===lid); };
    const comGR=()=>{ const L=linha(); return !(L&&L.mhSemGR); };
    const norm=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    const desenha=()=>{ const U=uts[id]; if(!U||!linha()){ fecha(); return; } const max=tipo==="cueca"?1:3, gr=comGR();
      const todos=atletasUT(U).filter(a=>presenteUT(U,a.k)), at=todos.filter(a=>gr||!ehGR(a)).filter(a=>!q||norm([nomeCurto(a),a.nome,a.alc].join(" ")).includes(norm(q))).sort((a,b)=>nomeCurto(a).localeCompare(nomeCurto(b),"pt"));
      sel=sel.filter(k=>gr||!ehGR(todos.find(a=>a.k===k)));
      const regs=meinhoDeLinha(id,lid), cnt={}; regs.forEach(r=>r.ks.forEach(k=>{ const x=cnt[k]||(cnt[k]={m:0,c:0}); r.tipo==="cueca"?x.c++:x.m++; }));
      s.querySelectorAll("#mh-t button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===tipo)));
      const nGR=todos.filter(ehGR).length; gb.hidden=!nGR; gb.textContent=gr?"🧤 GR participam":"🧤 GR não participam"; gb.setAttribute("aria-pressed",String(gr));
      const ult=regs[regs.length-1];
      c.innerHTML=`<p class="sub" style="margin:0 0 6px">${tipo==="cueca"?"Toca no atleta que levou a cueca.":"Toca nos atletas que estavam no meio (1 a 3)."}</p>
        <div class="pgrid mh-g">${at.map(a=>{ const x=cnt[a.k]; return `<button type="button" data-k="${esc(a.k)}" aria-pressed="${sel.includes(a.k)}"><b>${esc(nomeCurto(a))}</b><small>${ehGR(a)?"GR ":""}${x?`${x.m?x.m+" × 21":""}${x.m&&x.c?" · ":""}${x.c?x.c+" cueca"+(x.c>1?"s":""):""}`:" "}</small></button>`; }).join("")
          ||`<p class="sub">${todos.length?"Ninguém com esse nome.":"Marca primeiro as presenças desta UT."}</p>`}</div>
        <p class="sub" style="margin:6px 0 0">${regs.length} ${regs.length===1?"registo":"registos"} neste exercício${ult?` · último: ${ult.tipo==="cueca"?"cueca":"21 passes"} · ${esc(ult.ks.map(k=>nomeK(U,k)).join(", "))} · ${esc(new Date(ult.em).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit",second:"2-digit"}))}`:""}</p>
        ${ult?`<div style="margin-top:6px"><button class="btn sm danger" id="mh-un">↶ Desfazer o último</button></div>`:""}`;
      st.innerHTML=`Escolhidos: <b>${sel.length?esc(sel.map(k=>nomeK(U,k)).join(", ")):"—"}</b>`;
      ok.textContent=`Registar ${tipo==="cueca"?"cueca":"21 passes"}`; ok.disabled=!sel.length;
      c.querySelectorAll(".mh-g button").forEach(b=>b.onclick=()=>{ const k=b.dataset.k; if(sel.includes(k)) sel=sel.filter(x=>x!==k); else if(max===1) sel=[k]; else if(sel.length<max) sel=[...sel,k]; else { toast("No máximo 3 atletas."); return; } desenha(); });
      const un=c.querySelector("#mh-un"); if(un) confirma2(un,"Toca outra vez para desfazer",()=>{ const r=meinhoDeLinha(id,lid).pop(); if(r){ tiraMeinho(r.id); toast("Último registo desfeito"); } desenha(); }); };
    ok.onclick=()=>{ const U=uts[id]; if(!sel.length||!U) return; gravaMeinho({id:uId("mh"),ut:id,lid,tipo,ks:sel,em:new Date().toISOString(),por:meuId||""});
      toast(`${tipo==="cueca"?"Cueca":"21 passes"} · ${sel.map(k=>nomeK(U,k)).join(", ")}`); sel=[]; if(q){ q=""; qi.value=""; } desenha(); };
    qi.oninput=()=>{ q=qi.value.trim(); desenha(); };
    gb.onclick=()=>{ const U=uts[id], L=U&&U.exercicios.find(x=>x.id===lid); if(!L) return; const sem=!L.mhSemGR, U2=clone(U), L2=U2.exercicios.find(x=>x.id===lid);
      if(sem) L2.mhSemGR=true; else delete L2.mhSemGR; guardaUT(U2); toast(sem?"Os GR não participam neste meinho":"Os GR participam neste meinho"); desenha(); };
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
          jogadoresJogo(U,J,e).forEach(a=>{ if(ehGR(a)) return; const c=chaveT(a), x=P[c]||(P[c]={nome:nomeCurto(a),J:0,V:0,E:0,D:0,GM:0,GS:0,golos:0,AG:0,jogos:[]});
            x.J++; x[res]++; x.GM+=gm; x.GS+=gs; const meus=gls.filter(g=>g.k===a.k);
            x.jogos.push({U,num,eq:nomeGrupoUT(U,J[e])+(((J.mais&&J.mais[e])||[]).includes(a.k)?" (reforço)":""),res,gm,gs,golos:meus.filter(g=>!g.ag).length,ag:meus.filter(g=>g.ag).length}); });
          /* GR: cada golo sofrido conta 1, mesmo o que vale 2 (v110) */
          const gk=J.semGR?"":J["gr"+e.toUpperCase()]; if(gk){ const a=aDe(gk); if(a){ const c=chaveT(a), y=GR[c]||(GR[c]={nome:nomeCurto(a),J:0,V:0,E:0,D:0,GS:0,zero:0,jogos:[]}), sof=gls.filter(g=>g.eq===o).length; y.J++; y[res]++; y.GS+=sof; if(!sof) y.zero++; y.jogos.push({U,num,eq:nomeGrupoUT(U,J[e]),res,gm,gs:sof}); } } });
        gls.forEach(g=>{ const a=aDe(g.k); if(!a||ehGR(a)) return; const x=P[chaveT(a)]; if(!x) return; if(g.ag) x.AG++; else x.golos++; }); }); }); });
  /* histórico do Excel (antes da app): J, V, E, D e golos; nos GR, jogos e golos sofridos */
  (F.hist||[]).filter(h=>h.tipo==="comp"&&(!cF.et||cF.et===h.et)).forEach(h=>h.linhas.forEach(l=>{ const nome=nomeHist(l);
    if(l.gr){ const y=GR[l.k]||(GR[l.k]={nome,J:0,V:0,E:0,D:0,GS:0,zero:0,jogos:[]}); y.J+=l.J; y.GS+=l.GS; y.jogos.push({hist:h,J:l.J,gs:l.GS}); return; }
    const x=P[l.k]||(P[l.k]={nome,J:0,V:0,E:0,D:0,GM:0,GS:0,golos:0,AG:0,jogos:[]}); ["J","V","E","D","golos"].forEach(c=>x[c]+=l[c]); x.jogos.push({hist:h,...l}); }));
  [P,GR].forEach(o=>Object.values(o).forEach(x=>x.jogos.sort((a,b)=>(a.hist?a.hist.data:a.U.data).localeCompare(b.hist?b.hist.data:b.U.data))));
  Object.values(P).forEach(x=>{ x.Pts=3*x.V+x.E; x.PtsJ=x.J?x.Pts/x.J:0; x.DG=x.GM-x.GS; });
  Object.values(GR).forEach(y=>{ y.med=y.J?y.GS/y.J:0; y.Pts=3*y.V+y.E; });
  return {P,GR,pend,aviso}; }
const COLS_G=[["J","J"],["V","V"],["E","E"],["D","D"],["Pts","Pts"],["GS","Golos sofridos"],["med","Média GS"],["zero","Sem sofrer"]];
const COLS_C=[["J","J"],["V","V"],["E","E"],["D","D"],["Pts","Pts"],["PtsJ","Pts/J"],["GM","GM"],["GS","GS"],["DG","DG"],["golos","Golos"],["AG","AG"]];
const ordemC=(a,b)=>{ if(cOrd.k) return cOrd.d*((a[cOrd.k]-b[cOrd.k])||0)||b.Pts-a.Pts||b.DG-a.DG||b.GM-a.GM||b.golos-a.golos||a.nome.localeCompare(b.nome,"pt");
  return b.Pts-a.Pts||b.DG-a.DG||b.GM-a.GM||b.golos-a.golos||a.nome.localeCompare(b.nome,"pt"); };
const ordemG=(a,b)=>gOrd.k?gOrd.d*((a[gOrd.k]-b[gOrd.k])||0)||a.med-b.med||a.nome.localeCompare(b.nome,"pt"):a.med-b.med||b.J-a.J||a.nome.localeCompare(b.nome,"pt");
const f1=v=>(Math.round(v*100)/100).toFixed(2).replace(".",",");
function renderComp(){ const F=utsFiltro(), S=compStats(F); navFiltro(F,true);
  $("u-tit").textContent="Competição interna"; $("u-tag").hidden=true;
  $("u-bar").innerHTML=`<button class="btn sm" id="cp-csv">⬇ CSV</button><button class="btn sm" id="cp-pdf">⬇ PDF</button><button class="btn sm" id="cp-cz">🏆 Cartaz</button>`; $("cp-csv").onclick=()=>csvComp(F,S); $("cp-pdf").onclick=e=>guardaPdfRankings(F,e.currentTarget); $("cp-cz").onclick=()=>folhaCartaz(F);
  const ls=Object.entries(S.P).sort((a,b)=>ordemC(a[1],b[1])), gr=Object.entries(S.GR).sort((a,b)=>ordemG(a[1],b[1])), seta=(o,k)=>o.k===k?(o.d>0?" ▲":" ▼"):"";
  $("u-corpo").innerHTML=`<p class="sub" style="margin:0 14px 8px">Liga e Champions somam na mesma classificação. Pontos 3-1-0 por jogador (o resultado da equipa em que jogou). Desempate: Pts, DG, GM, golos. Os GR não entram aqui: têm a tabela deles.${F.hist.some(h=>h.tipo==="comp")?" Inclui o histórico do Excel (antes da app): J, V, E, D, Pts e golos; GM, GS e DG só contam os jogos registados na app.":""}</p>
    ${ls.length?`<div class="tblwrap" style="margin:0 14px 14px"><table class="ttab cptab"><thead><tr><th>#</th><th>Atleta</th>${COLS_C.map(([k,n])=>`<th class="n"><button class="lnk" data-o="${k}">${n}${seta(cOrd,k)}</button></th>`).join("")}</tr></thead><tbody>
      ${ls.map(([c,x],i)=>`<tr data-c="${esc(c)}"><td>${i+1}</td><td><span class="nm-f">${fotoAv(fotoDeChaveT(c),x.nome,"p")}<b>${esc(x.nome)}</b></span></td>${COLS_C.map(([k])=>`<td class="n">${k==="PtsJ"?f1(x[k]):k==="Pts"?`<b>${x[k]}</b>`:x[k]}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
      :`<div class="m-vazio"><b>Sem jogos terminados neste filtro.</b><span>Os jogos registam-se na UT, no botão 🏆 dos exercícios marcados como Liga ou Champions.</span></div>`}
    <h3 class="cp-h">Guarda-redes</h3>
    ${gr.length?`<div class="tblwrap" style="margin:0 14px 14px"><table class="ttab cptab"><thead><tr><th>GR</th>${COLS_G.map(([k,n])=>`<th class="n"><button class="lnk" data-og="${k}">${n}${seta(gOrd,k)}</button></th>`).join("")}</tr></thead><tbody>
      ${gr.map(([c,y])=>`<tr data-g="${esc(c)}"><td><span class="nm-f">${fotoAv(fotoDeChaveT(c),y.nome,"p")}<b>${esc(y.nome)}</b></span></td>${COLS_G.map(([k])=>`<td class="n">${k==="med"?`<b>${f1(y.med)}</b>`:k==="Pts"?`<b>${y.Pts}</b>`:y[k]}</td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="sub" style="margin:0 14px 14px">Os GR não estão presos a uma equipa: em cada jogo contam pela equipa que defenderam (V/E/D e pontos desde a v98; o histórico do Excel só tem jogos e golos sofridos).</p>`
      :`<p class="sub" style="margin:0 14px 14px">Ainda sem GR indicados em jogos terminados.</p>`}
    ${(()=>{ /* v110: todos os jogos do filtro, por UT e exercício; tocar abre o registo para ver ou corrigir */
      const blocos=[]; F.ls.slice().sort((a,b)=>(b.data||"").localeCompare(a.data||"")).forEach(U=>U.exercicios.forEach(l=>{ const et=compDe(l); if(!et||(cF.et&&cF.et!==et)) return; const js=jogosDe(U.id,l.id); if(!js.length) return; blocos.push({U,l,et,js}); }));
      if(!blocos.length) return "";
      return `<h3 class="cp-h">Jogos <span class="count">${blocos.reduce((a,b)=>a+b.js.length,0)}</span></h3><div class="cp-todos">${blocos.map(({U,l,et,js},i)=>`<button class="cp-bl" data-bl="${i}"><span><b>UT${U.numero}</b> · ${esc(dataPt_(U.data).slice(0,5))} · ${esc(numerosUT(U)[l.id])} ${esc(l.copia.nome)} · ${esc(rotComp(et))}</span>
        <small>${js.map(J=>{ const r=resultado(J); return `${esc(nomeGrupoUT(U,J.a))} ${J.fim?`${r.a}–${r.b}`:"×"} ${esc(nomeGrupoUT(U,J.b))}`; }).join(" · ")}</small></button>`).join("")}</div>`; })()}`;
  { const bl=[]; F.ls.slice().sort((a,b)=>(b.data||"").localeCompare(a.data||"")).forEach(U=>U.exercicios.forEach(l=>{ const et=compDe(l); if(!et||(cF.et&&cF.et!==et)) return; if(jogosDe(U.id,l.id).length) bl.push([U.id,l.id]); }));
    $("u-corpo").querySelectorAll("[data-bl]").forEach(b=>b.onclick=()=>{ const x=bl[+b.dataset.bl]; if(x) folhaCompUT(x[0],x[1]); }); }
  $("u-corpo").querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>{ const k=b.dataset.o; cOrd=cOrd.k===k?(cOrd.d<0?{k,d:1}:{k:"",d:-1}):{k,d:-1}; renderComp(); });
  $("u-corpo").querySelectorAll("[data-og]").forEach(b=>b.onclick=()=>{ const k=b.dataset.og; gOrd=gOrd.k===k?(gOrd.d>0?{k,d:-1}:{k:"",d:1}):{k,d:1}; renderComp(); });
  $("u-corpo").querySelectorAll("tr[data-c]").forEach(tr=>tr.onclick=()=>folhaJogosAtleta(S.P[tr.dataset.c],false));
  $("u-corpo").querySelectorAll("tr[data-g]").forEach(tr=>tr.onclick=()=>folhaJogosAtleta(S.GR[tr.dataset.g],true));
  const lst=S.pend.concat(S.aviso);
  $("u-panel").innerHTML=`<header><h2>Resumo</h2><p class="sub">${F.ls.length} UT · ${ls.length} atletas · ${gr.length} GR</p></header>
    <div class="add"><h3>Jogos assinalados <span class="count">${lst.length}</span></h3>${lst.length?`<ul class="uavisos">${lst.map((x,i)=>`<li><button class="lnk" data-i="${i}">UT${x.U.numero}</button> ${esc(x.num)} · série ${x.J.serie}: ${esc(x.t)}</li>`).join("")}</ul><p class="sub" style="margin:0">Jogos sem resultado não contam.</p>`:`<p class="sub" style="margin:0">Todos os jogos estão terminados e com GR.</p>`}</div>`;
  $("u-panel").querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{ const x=lst[+b.dataset.i]; uModo="ut"; try{ localStorage.setItem("sca-u-modo","ut"); }catch(e){} uCur=x.U.id; renderUT(); }); }
function folhaJogosAtleta(x,gr){ if(!x) return; const res={V:"Vitória",E:"Empate",D:"Derrota"};
  folha(`<h3>${esc(x.nome)}${gr?" · GR":""}</h3><p class="sub" style="margin:0">${gr?`${x.J} jogos · ${x.Pts} pts · ${x.GS} golos sofridos · ${x.zero} sem sofrer`:`${x.J} jogos · ${x.Pts} pts · ${x.golos} golos${x.AG?` · ${x.AG} AG`:""}`}</p>
    <ul class="evl">${x.jogos.map(j=>j.hist?`<li><span style="flex:1"><b>${esc(dataPt_(j.hist.data).slice(0,5))}</b> · UT${j.hist.ut} · <i>Excel</i> · ${gr?`${j.J} ${j.J===1?"jogo":"jogos"} · sofreu ${j.gs}`:`${j.J} ${j.J===1?"jogo":"jogos"} · ${j.V}V ${j.E}E ${j.D}D${j.golos?` · ⚽ ${j.golos}`:""}`}</span></li>`
      :`<li><span style="flex:1"><b>${esc(dataPt_(j.U.data).slice(0,5))}</b> · UT${j.U.numero} ${esc(j.num)} · ${esc(j.eq)} · ${gr?`${res[j.res]} ${j.gm}–${j.gs} · sofreu ${j.gs}`:`${res[j.res]} ${j.gm}–${j.gs}${j.golos?` · ⚽ ${j.golos}`:""}${j.ag?` · AG ${j.ag}`:""}`}</span></li>`).join("")}</ul>
    <div class="actions"><button class="btn primary" data-close>Fechar</button></div>`,()=>{}); }
function csvComp(F,S){ const ls=Object.values(S.P).sort(ordemC), gr=Object.values(S.GR).sort(ordemG);
  guardaCsv(nomeCsv("Competicao",F),[["SCA Performance · Competição interna",filtroTxt(F)],[],["#","Atleta",...COLS_C.map(c=>c[1])],
    ...ls.map((x,i)=>[i+1,x.nome,...COLS_C.map(([k])=>k==="PtsJ"?f1(x[k]):x[k])]),[],["Guarda-redes"],["GR",...COLS_G.map(c=>c[1])],
    ...gr.map(y=>[y.nome,...COLS_G.map(([k])=>k==="med"?f1(y.med):y[k])]),[],["Jogos assinalados"],["UT","Exercício","Série","Motivo"],...S.pend.concat(S.aviso).map(x=>["UT"+x.U.numero,x.num,x.J.serie,x.t])]); }

/* ---------- Rankings do Meinho: Rei do Meinho (21 passes) e Rei das Cuecas ---------- */
function meinhoStats(F){ const R={"21":{},cueca:{}};
  F.ls.forEach(U=>{ const ls=U.exercicios.filter(meinhoDe); if(!ls.length) return; const at=atletasUT(U), lids=new Set(ls.map(l=>l.id)), num=numerosUT(U), grEntra=ls.some(l=>!l.mhSemGR);
    at.filter(a=>presenteUT(U,a.k)&&(grEntra||!ehGR(a))).forEach(a=>["21","cueca"].forEach(t=>{ const c=chaveT(a), x=R[t][c]||(R[t][c]={nome:nomeCurto(a),tot:0,nUT:0,oc:[]}); x.nUT++; }));
    Object.values(meinhoRegs).filter(m=>m.ut===U.id&&lids.has(m.lid)).forEach(m=>m.ks.forEach(k=>{ const a=at.find(x=>x.k===k); if(!a) return; const c=chaveT(a), x=R[m.tipo][c]||(R[m.tipo][c]={nome:nomeCurto(a),tot:0,nUT:0,oc:[]});
      x.tot++; x.oc.push({U,num:num[m.lid],em:m.em,com:m.ks.filter(o=>o!==k).map(o=>nomeK(U,o))}); })); });
  /* histórico do Excel: contagens por UT; «UT com meinho» só quando estava presente (presenças do emjogo) */
  (F.hist||[]).filter(h=>h.tipo==="meinho").forEach(h=>h.linhas.forEach(l=>["21","cueca"].forEach(t=>{ const n=t==="21"?l.m21:l.cuecas;
    if(!n&&!l.presente) return; const x=R[t][l.k]||(R[t][l.k]={nome:nomeHist(l),tot:0,nUT:0,oc:[]}); if(l.presente) x.nUT++; x.tot+=n; for(let i=0;i<n;i++) x.oc.push({hist:h,em:h.data,com:[]}); })));
  ["21","cueca"].forEach(t=>Object.values(R[t]).forEach(x=>{ x.med=x.nUT?x.tot/x.nUT:0; x.oc.sort((a,b)=>a.em.localeCompare(b.em)); }));
  return R; }
function renderRank(){ const F=utsFiltro(), R=meinhoStats(F); navFiltro(F,false);
  $("u-tit").textContent="Rankings do Meinho"; $("u-tag").hidden=true;
  $("u-bar").innerHTML=`<button class="btn sm" id="rk-csv">⬇ CSV</button><button class="btn sm" id="rk-pdf">⬇ PDF</button><button class="btn sm" id="rk-cz">🏆 Cartaz</button>`; $("rk-csv").onclick=()=>csvRank(F,R); $("rk-pdf").onclick=e=>guardaPdfRankings(F,e.currentTarget); $("rk-cz").onclick=()=>folhaCartaz(F);
  const quadro=(t,tit)=>{ const ls=Object.entries(R[t]).filter(([,x])=>x.tot||x.nUT).sort((a,b)=>b[1].tot-a[1].tot||b[1].med-a[1].med||a[1].nome.localeCompare(b[1].nome,"pt")), top=ls.length?ls[0][1].tot:0, reis=top?ls.filter(([,x])=>x.tot===top):[];
    return `<section class="rk"><h3 class="cp-h">${tit}</h3>${reis.length?`<div class="rk-rei">👑 <b>${esc(reis.map(([,x])=>x.nome).join(" · "))}</b><span>${top} ${t==="cueca"?(top===1?"cueca":"cuecas"):"× 21 passes"}${reis.length>1?" · partilham o título":""}</span></div>`:""}
      ${ls.length?`<div class="tblwrap" style="margin:0 14px 14px"><table class="ttab"><thead><tr><th>#</th><th>Atleta</th><th class="n">Total</th><th class="n">UT com meinho</th><th class="n">Média por UT</th></tr></thead><tbody>
        ${ls.map(([c,x],i)=>`<tr data-t="${t}" data-c="${esc(c)}"><td>${top&&x.tot===top?"👑":i+1}</td><td><span class="nm-f">${fotoAv(fotoDeChaveT(c),x.nome,"p")}<b>${esc(x.nome)}</b></span></td><td class="n"><b>${x.tot}</b></td><td class="n">${x.nUT}</td><td class="n">${f1(x.med)}</td></tr>`).join("")}</tbody></table></div>`
        :`<p class="sub" style="margin:0 14px 14px">Sem UT com meinho neste filtro.</p>`}</section>`; };
  $("u-corpo").innerHTML=`<p class="sub" style="margin:0 14px 8px">Cada registo vale 1 para cada atleta escolhido. Os GR entram como os outros, exceto nas UT em que se marcou «GR não participam». «UT com meinho» = UT com exercício de meinho em que o atleta esteve presente.</p>${quadro("21","Rei do Meinho (21 passes)")}${quadro("cueca","Rei das Cuecas")}`;
  $("u-corpo").querySelectorAll("tr[data-c]").forEach(tr=>tr.onclick=()=>{ const x=R[tr.dataset.t][tr.dataset.c]; if(!x) return;
    folha(`<h3>${esc(x.nome)} · ${tr.dataset.t==="cueca"?"Cuecas":"21 passes"}</h3><p class="sub" style="margin:0">${x.tot} em ${x.nUT} UT com meinho.</p>
      <ul class="evl">${x.oc.map(o=>o.hist?`<li><span><b>${esc(dataPt_(o.hist.data).slice(0,5))}</b> · UT${o.hist.ut} · <i>Excel</i></span></li>`:`<li><span><b>${esc(dataPt_(o.U.data).slice(0,5))}</b> · UT${o.U.numero} ${esc(o.num)} · ${esc(new Date(o.em).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}))}${o.com.length?" · com "+esc(o.com.join(", ")):""}</span></li>`).join("")||`<li><span class="sub">Sem ocorrências.</span></li>`}</ul>
      <div class="actions"><button class="btn primary" data-close>Fechar</button></div>`,()=>{}); });
  const hM=F.hist.filter(h=>h.tipo==="meinho"), nM=F.ls.filter(U=>U.exercicios.some(meinhoDe)).length+hM.length, nR=Object.values(meinhoRegs).filter(m=>F.ls.some(U=>U.id===m.ut)).length+hM.reduce((a,h)=>a+h.linhas.reduce((b,l)=>b+l.m21+l.cuecas,0),0);
  $("u-panel").innerHTML=`<header><h2>Resumo</h2><p class="sub">${F.ls.length} UT · ${nM} com meinho · ${nR} registos</p></header>`; }
function csvRank(F,R){ const tab=t=>Object.values(R[t]).filter(x=>x.tot||x.nUT).sort((a,b)=>b.tot-a.tot||a.nome.localeCompare(b.nome,"pt")).map((x,i)=>[i+1,x.nome,x.tot,x.nUT,f1(x.med)]);
  guardaCsv(nomeCsv("Meinho",F),[["SCA Performance · Rankings do Meinho",filtroTxt(F)],[],["Rei do Meinho (21 passes)"],["#","Atleta","Total","UT com meinho","Média por UT"],...tab("21"),[],["Rei das Cuecas"],["#","Atleta","Total","UT com meinho","Média por UT"],...tab("cueca")]); }
