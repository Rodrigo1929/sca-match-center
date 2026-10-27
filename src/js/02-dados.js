/* ---------- dados ---------- */
function clone(o){ return JSON.parse(JSON.stringify(o)); }
/* os dados da base de dados chegam congelados (snapshots e data()): alterá-los falha sem dar erro, por isso copiam-se sempre à entrada */
function lerDoc(d){ const x=d.data(); return x?clone(x):null; }
function lances(){
  const out=[]; const seen=new Set();
  ESPECIAIS.concat(DEF_LANCES).forEach(d0=>{ let d=d0;
    if(d0.bolas===null){ d={...d0,bolas:bolasDoOnze()}; if(d0.campoV===2) d=mapaCampo({...d,campoV:1}); }
    seen.add(d.id); let o=lancesDb[d.id]; if(o&&o.apagado) return;
    if(o&&o.bolas&&d.id==="intervalo"&&o.campoV!==2) o=mapaCampo(o);
    out.push(o&&o.bolas?{...d,...o,original:true}:{...d,original:true}); });
  Object.values(lancesDb).forEach(o=>{ if(!seen.has(o.id)&&!o.apagado&&o.bolas) out.push(o); });
  const ord={JOGO:-1,DEF:0,OF:1,REF:2};
  let OL=((est&&est.ordem)||[]).slice(); if(OL.length&&!OL.includes("estat")){ const k=OL.indexOf("intervalo"); OL.splice(k>=0?k+1:OL.length,0,"estat"); }
  if(OL.length&&!OL.includes("encaixe")){ const k=OL.indexOf("onze"); OL.splice(k+1,0,"encaixe"); }
  const io=id=>{ const i=OL.indexOf(id); return i<0?1e6:i; };
  return out.sort((a,b)=>(ord[a.tipo]??1)-(ord[b.tipo]??1)||io(a.id)-io(b.id)||(a.ordem||0)-(b.ordem||0));
}
function lanceAtual(){ const L=lances(); return L.find(l=>l.id===curId)||L[0]; }
function baseOf(slot){ const o=jogo.onze.find(o=>o.slot===slot); return o?o.n:slot; }
function posOf(slot){ const o=jogo.onze.find(o=>o.slot===slot); return o?o.pos:""; }
function aplica(l,id){ return l.modo==="todos"||(l.lances||[]).includes(id); }
function calcula(L){
  const slots=[...new Set([...L.bolas,...L.legs].map(x=>x.slot))];
  const v={}; slots.forEach(s=>v[s]=(L.fixo&&L.fixo[s])||baseOf(s));
  const usadas=new Set(); let base=null;
  const ordem=est.linhas.map((l,i)=>[l,i]).sort((a,b)=>(a[0].pre?0:1)-(b[0].pre?0:1)||a[1]-b[1]);
  ordem.forEach(([l,i])=>{
    if(!l.pre&&!base) base={...v};
    if(!aplica(l,L.id)) return;
    if(l.slot&&slots.includes(l.slot)&&l.modo!=="todos"){ if(v[l.slot]!==l.sai) return; usadas.add(i);
      slots.forEach(s=>{ if(s!==l.slot&&v[s]===l.entra) v[s]=l.sai; }); v[l.slot]=l.entra; return; }
    if(!slots.some(s=>v[s]===l.sai)) return;
    usadas.add(i);
    slots.forEach(s=>{ if(v[s]===l.sai) v[s]=l.entra; else if(v[s]===l.entra) v[s]=l.sai; });
  });
  if(!base) base={...v};
  return {v,usadas,base,dups:repetidos(L,v)};
}
function eAlternativa(B){ return (B.fill||"").toUpperCase()==="#FFFFFF"&&(B.stroke||"").toUpperCase()==="#F79646"; }
/* repetidos = o mesmo jogador em bolinhas de posições (slots) diferentes, sem ser alternativa */
function repetidos(L,v){ const porN={}; [...new Set(L.bolas.filter(b=>!eAlternativa(b)).map(b=>b.slot))].forEach(s=>{ const n=v[s]; if(n==null) return; (porN[n]=porN[n]||new Set()).add(s); });
  return Object.entries(porN).filter(([n,ss])=>ss.size>1).map(([n])=>n); }
function semEfeito(i){ return !lances().some(L=>calcula(L).usadas.has(i)); }
function nome(n){ const p=est.plantel.find(p=>p.n===n); return p&&p.nome?p.nome:""; }
function rot(n){ const nm=nome(n); return nm?`${n} · ${nm}`:n; }
const byNum=(a,b)=>(parseInt(a)||0)-(parseInt(b)||0);
function titulares(){ return jogo.onze.map(o=>o.n); }
function lanceNome(id){ const L=lances().find(l=>l.id===id); return L?L.nome:"(lance apagado)"; }
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
