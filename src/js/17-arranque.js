/* ---------- arranque ---------- */
try{ const s=JSON.parse(localStorage.getItem(LS_KEY)||"null"); if(s){ est=normEst(s.est); jogo=normJogo(s.jogo); lancesDb=s.lancesDb||{}; notas=normNotas(s.notas); hist=s.hist||{}; an=normAn(s.an); anCfg=normCfg(s.anCfg); vivo=normVivo(s.vivo); advs=Object.fromEntries(Object.entries(s.advs||{}).map(([k,v])=>[k,normAdvEquipa(v,k)])); } }catch(e){}
render(); preCarregaImagens();
(async()=>{
  try{ db=window.claude&&window.claude.use?await window.claude.use("db"):null; }catch(e){ db=null; }
  try{ usr=await window.claude.use("user"); }catch(e){ usr=null; }
  try{ sala=await window.claude.use("room"); }catch(e){ sala=null; }
  if(usr){ try{ meuId=await usr.id(); }catch(e){} try{ const w=await usr.can("data.write"); if(w===false){ setStatus("local","Só leitura: pede ao Rodrigo acesso de Editor"); soLeitura=true; } }catch(e){} }
  if(sala){ try{ sala.onPeers(ch=>renderPeers(ch.peers),()=>{}); }catch(e){} }
  if(!db){ setStatus("local","Guardado só neste aparelho"); return; }
  setStatus("busy","A carregar…"); if(nPend()) setTimeout(reenviaTudo,500);
  const err=e=>setStatus("local","Sem ligação ao arquivo ("+(e?.code||"erro")+")");
  db.doc("estado/atual").onSnapshot(s=>{ if(s.metadata?.hasPendingWrites||pendentes["estado/atual"]) return; if(s.exists){ const d=normEst(lerDoc(s)); if(JSON.stringify(d)!==JSON.stringify(est)){ est=d; guardaLocal(); render(); } } estadoPend(false); },err);
  db.doc("jogo/atual").onSnapshot(s=>{ if(s.metadata?.hasPendingWrites||pendentes["jogo/atual"]) return; if(s.exists){ const raw=lerDoc(s);
      if(Array.isArray(raw.eventos)&&raw.eventos.length){ const srvEv=normJogo(raw).eventos; srvEv.forEach(e=>gravaDoc("eventos/"+e.id,e)); const ids=new Set(jogo.eventos.map(e=>e.id)); const J=clone(jogo); J.eventos=[...J.eventos,...srvEv.filter(e=>!ids.has(e.id))]; jogoMigrado=false; guardaJogo(J,true); return; }
      const d=normJogo({...raw,eventos:jogo.eventos,subs:jogo.subs,subsAdv:jogo.subsAdv}); if(JSON.stringify(d)!==JSON.stringify(jogo)){ jogo=d; guardaLocal(); render(); renderJogo(); } } },err);
  db.doc("analise/atual").onSnapshot(s=>{ if(s.metadata?.hasPendingWrites||pendentes["analise/atual"]) return; if(s.exists){ const raw=lerDoc(s);
      if(Array.isArray(raw.regs)&&raw.regs.length){ const srvR=normAn(raw).regs; srvR.forEach(x=>gravaDoc("regs/"+x.id,x)); const ids=new Set(an.regs.map(x=>x.id)); const A=clone(an); A.regs=[...A.regs,...srvR.filter(x=>!ids.has(x.id))]; anMigrado=false; guardaAn(A); return; }
      const d=normAn({...raw,regs:an.regs}); if(JSON.stringify(d)!==JSON.stringify(an)){ an=d; guardaLocal(); renderAnalise(); } } },err);
  const colSnap=(nome_,aplica)=>db.collection(nome_).onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={}; q.docs.forEach(d=>{ const x=lerDoc(d); if(x){ const c={...x}; delete c.atualizadoEm; m[d.id]={...c,id:d.id}; } }); aplica(m); },err);
  colSnap("eventos",m=>{ mergeCol("eventos/",m,Object.fromEntries(jogo.eventos.map(e=>[e.id,e]))); const J=normJogo({...jogo,eventos:Object.values(m).sort((a,b)=>(a.c||0)-(b.c||0))}); if(JSON.stringify(J.eventos)!==JSON.stringify(jogo.eventos)){ jogo=J; guardaLocal(); render(); } });
  colSnap("subs",m=>{ mergeCol("subs/",m,Object.fromEntries(jogo.subs.map(e=>[e.id,e]))); const J=normJogo({...jogo,subs:Object.values(m)}); if(JSON.stringify(J.subs)!==JSON.stringify(jogo.subs)){ jogo=J; guardaLocal(); render(); } });
  colSnap("subsAdv",m=>{ mergeCol("subsAdv/",m,Object.fromEntries((jogo.subsAdv||[]).map(e=>[e.id,e]))); const J=normJogo({...jogo,subsAdv:Object.values(m)}); if(JSON.stringify(J.subsAdv)!==JSON.stringify(jogo.subsAdv)){ jogo=J; guardaLocal(); render(); renderSubsAdv(); } });
  colSnap("adversarios",m=>{ mergeCol("adversarios/",m,advs); const N=Object.fromEntries(Object.entries(m).map(([k,v])=>[k,normAdvEquipa(v,k)])); if(JSON.stringify(N)!==JSON.stringify(advs)){ advs=N; guardaLocal(); render(); } });
  colSnap("regs",m=>{ mergeCol("regs/",m,Object.fromEntries(an.regs.map(e=>[e.id,e]))); const A=normAn({...an,regs:Object.values(m).sort((a,b)=>(a.c||0)-(b.c||0))}); if(JSON.stringify(A.regs)!==JSON.stringify(an.regs)){ an=A; guardaLocal(); renderAnalise(); } });
  db.doc("jogo/vivo").onSnapshot(s=>{ if(s.metadata?.hasPendingWrites||pendentes["jogo/vivo"]) return; if(s.exists){ const d=normVivo(lerDoc(s)); if(JSON.stringify(d)!==JSON.stringify(vivo)){ vivo=d; guardaLocal(); renderVivo(); } } },err);
  db.doc("tv/config").onSnapshot(s=>{ if(s.metadata?.hasPendingWrites||pendentes["tv/config"]) return; if(s.exists){ const d=lerDoc(s); delete d.atualizadoEm; tvCfg=d; try{ localStorage.setItem("sca-tv",JSON.stringify(d)); }catch(e){} } },err);
  db.doc("analise/config").onSnapshot(s=>{ if(s.metadata?.hasPendingWrites||pendentes["analise/config"]) return; if(s.exists){ const d=normCfg(lerDoc(s)); if(JSON.stringify(d)!==JSON.stringify(anCfg)){ anCfg=d; guardaLocal(); renderAnalise(); } } },err);
  db.collection("historico").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={}; q.docs.forEach(d=>{ const x=lerDoc(d); if(x) m[d.id]={...x,id:d.id}; }); hist=mergeCol("historico/",m,hist); guardaLocal(); if(!$("view-h").hidden) renderHist(); },err);
  db.doc("jogo/notas").onSnapshot(s=>{ if(s.metadata?.hasPendingWrites||pendentes["jogo/notas"]) return; if(s.exists){ const d=normNotas(lerDoc(s)); if(JSON.stringify(d)!==JSON.stringify(notas)){ notas=d; guardaLocal(); render(); } } },err);
  db.collection("lances").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={}; q.docs.forEach(d=>{ const x=lerDoc(d); if(x){ const c={...x}; delete c.atualizadoEm; m[d.id]={...c,id:d.id}; } });
    mergeCol("lances/",m,lancesDb); const cur={}; Object.entries(lancesDb).forEach(([k,v])=>cur[k]=v);
    if(JSON.stringify(m)!==JSON.stringify(cur)){ lancesDb=m; guardaLocal(); render(); } },err);
})();
