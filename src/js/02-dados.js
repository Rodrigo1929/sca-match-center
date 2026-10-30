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
  const usadas=new Set(); let base=null; const campo=new Set(titulares());
  /* v107: definições pré-jogo; depois as substituições do Ao vivo (feitas); depois as trocas do Quadro ainda por fazer */
  const ordem=[...est.linhas.map((l,i)=>[l,i]).filter(([l])=>l.pre),...trocasVivo(),...est.linhas.map((l,i)=>[l,i]).filter(([l])=>!l.pre&&!subVivoDe(l))];
  const entraNoCampo=l=>{ if(!l.pre&&l.modo==="todos"&&campo.has(l.sai)&&!campo.has(l.entra)){ campo.delete(l.sai); campo.add(l.entra); } };
  ordem.forEach(([l,i])=>{
    if(!l.pre&&!base) base={...v};
    if(!aplica(l,L.id)){ entraNoCampo(l); return; }
    if(l.slot&&slots.includes(l.slot)&&l.modo!=="todos"){ if(v[l.slot]!==l.sai) return; usadas.add(i);
      slots.forEach(s=>{ if(s!==l.slot&&v[s]===l.entra) v[s]=l.sai; }); v[l.slot]=l.entra; return; }
    if(!slots.some(s=>v[s]===l.sai)){ entraNoCampo(l); return; }
    usadas.add(i);
    /* no jogo, quem vem de fora fica com as tarefas de quem sai; dois que já estão em campo trocam de tarefas */
    if(!l.pre&&!campo.has(l.entra)) passaTarefas(v,slots,l.sai,l.entra,campo);
    else slots.forEach(s=>{ if(v[s]===l.sai) v[s]=l.entra; else if(v[s]===l.entra) v[s]=l.sai; });
    entraNoCampo(l);
  });
  if(!base) base={...v};
  return {v,usadas,base,dups:repetidos(L,v)};
}
/* v107: quem entra fica com as tarefas de quem sai; se já tinha outra tarefa no lance, essa passa para um titular livre
   (de preferência o dono dessa posição no onze; nunca o guarda-redes). Sem titular livre, os dois trocam, como antes */
const ehGRn=n=>jogo.onze.some(o=>o.n===n&&o.pos==="GR")||est.plantel.some(p=>p.n===n&&p.pos==="GR");
function passaTarefas(v,slots,sai,entra,campo){ const ss=slots.filter(s=>v[s]===sai); if(!ss.length) return false;
  const ja=slots.filter(s=>v[s]===entra); ss.forEach(s=>v[s]=entra);
  ja.forEach(s=>{ const usados=new Set(slots.map(x=>v[x])), livres=[...campo].filter(n=>n!==sai&&n!==entra&&!usados.has(n)&&!ehGRn(n)), pref=baseOf(s);
    v[s]=livres.includes(pref)?pref:(livres[0]||sai); });
  return true; }
/* substituições do Ao vivo (as que contam) como trocas em todos os lances; a troca planeada no Quadro com o mesmo «sai» dá lugar à real */
function trocasVivo(){ return subsReais().lista.map(s=>[{id:"vivo-"+s.id,sai:s.sai,entra:s.entra,modo:"todos",vivo:true,min:s.int?"Int.":s.min},"v:"+s.id]); }
const subVivoDe=l=>!l.pre&&l.modo==="todos"?subsReais().lista.find(s=>s.sai===l.sai)||null:null;
/* ajustes aos lances quando o onze muda no separador Jogo (v107) */
const lancesAjustaveis=()=>lances().filter(L=>L.bolas&&L.bolas.length&&!L.dinamico);
const slotsDe=L=>[...new Set([...L.bolas,...L.legs].map(x=>x.slot))];
const vDoLance=L=>Object.fromEntries(slotsDe(L).map(s=>[s,(L.fixo&&L.fixo[s])||baseOf(s)]));
function gravaLances(novos,msg){ if(!novos.length) return 0; const antes=novos.map(([A])=>A);
  novos.forEach(([,C])=>{ lancesDb[C.id]=C; gravaDoc("lances/"+C.id,C); }); guardaLocal(); render();
  if(msg) toast(msg,()=>{ antes.forEach(A=>{ lancesDb[A.id]=A; gravaDoc("lances/"+A.id,A); }); guardaLocal(); render(); });
  return novos.length; }
const copiaLance=L=>{ const C=clone(L); delete C.original; return C; };
/* posição inicial ligada (v108): um lance pode seguir as posições de outro (o slide inicial, `base`).
   Seguem as bolinhas (pela posição no onze, sem alternativas), a bola (bj0…) e os adversários (a0…); as setas, tarefas e textos são de cada lance.
   `soltas` = peças deste lance que ficaram no seu sítio. Mexer no slide inicial muda os outros; mexer numa peça de um lance ligado solta-a. */
const LIGA_SOLTA=2000; /* ao ligar: diferenças maiores do que isto (~2 m) ficam soltas, as menores acertam pelo slide inicial */
function pecasPos(L){ const m={}; (L.bolas||[]).forEach(b=>{ if(!eAlternativa(b)&&!m[b.slot]) m[b.slot]=b; }); (L.bj||[]).forEach((b,i)=>m["bj"+i]=b); (L.adv||[]).forEach((a,i)=>m["a"+i]=a); return m; }
const soltasDe=L=>Array.isArray(L.soltas)?L.soltas:[];
const baseDe=L=>L&&L.base?lances().find(x=>x.id===L.base&&x.bolas&&x.bolas.length&&!x.base)||null:null;
const seguidoresDe=id=>lances().filter(x=>x.base===id&&x.id!==id);
function nomePecaL(L,k){ return k.startsWith("bj")?"a bola":/^a\d+$/.test(k)?"o adversário "+(+k.slice(1)+1):"o "+((L.fixo&&L.fixo[k])||baseOf(k)); }
/* põe a peça k de F no sítio (x,y); as setas que saem dela passam a sair do sítio novo (o destino fica) */
function poePeca(F,it,x,y){ const dx=x-it.cx, dy=y-it.cy; if(!dx&&!dy) return false; const rr=(it.r||1450)*1.6;
  (F.setas||[]).forEach(s=>{ if(Math.hypot(s.x1-it.cx,s.y1-it.cy)>rr) return; s.x1=Math.round(s.x1+dx); s.y1=Math.round(s.y1+dy); if(s.qx!=null){ s.qx=Math.round(s.qx+dx/2); s.qy=Math.round(s.qy+dy/2); } });
  it.cx=x; it.cy=y; return true; }
/* o slide inicial mudou (velho → novo): devolve [antes, depois] de cada lance que o segue e mudou */
function acompanhaBase(velho,novo){ if(!velho||novo.base) return []; const P0=pecasPos(velho), P1=pecasPos(novo);
  const mex=Object.keys(P1).filter(k=>P0[k]&&(P0[k].cx!==P1[k].cx||P0[k].cy!==P1[k].cy)); if(!mex.length) return [];
  const out=[]; seguidoresDe(novo.id).forEach(F=>{ const A=copiaLance(F), C=copiaLance(F), PF=pecasPos(C), so=soltasDe(C); let m=false;
    mex.forEach(k=>{ if(!so.includes(k)&&PF[k]&&poePeca(C,PF[k],P1[k].cx,P1[k].cy)) m=true; }); if(m) out.push([A,C]); });
  return out; }
/* peças mexidas num lance ligado ficam soltas; devolve as que se soltaram agora */
function soltaMexidas(velho,C){ if(!C.base||!velho) return []; const P0=pecasPos(velho), P1=pecasPos(C), so=soltasDe(C);
  const novas=Object.keys(P1).filter(k=>P0[k]&&!so.includes(k)&&(P0[k].cx!==P1[k].cx||P0[k].cy!==P1[k].cy)); if(novas.length) C.soltas=[...so,...novas]; return novas; }
/* ligar C ao slide inicial B: o que está perto acerta por B, o que está longe fica solto */
function ligaBase(C,B){ const PB=pecasPos(B), PC=pecasPos(C), soltas=[];
  Object.keys(PC).forEach(k=>{ if(!PB[k]) return; if(Math.hypot(PC[k].cx-PB[k].cx,PC[k].cy-PB[k].cy)>LIGA_SOLTA) soltas.push(k); else poePeca(C,PC[k],PB[k].cx,PB[k].cy); });
  C.base=B.id; C.soltas=soltas; return soltas; }
function desligaBase(C){ delete C.base; delete C.soltas; }
/* voltar a seguir: a peça k volta ao sítio do slide inicial */
function voltaSeguir(L,k){ const B=baseDe(L); if(!B) return; const C=copiaLance(L), PB=pecasPos(B), PC=pecasPos(C);
  if(PB[k]&&PC[k]) poePeca(C,PC[k],PB[k].cx,PB[k].cy); C.soltas=soltasDe(C).filter(x=>x!==k); guardaLance(C,{segue:true}); toast(`${nomePecaL(C,k)[0].toUpperCase()+nomePecaL(C,k).slice(1)} volta a seguir o «${B.nome}»`); }
/* troca de lugar entre titulares: os lances ficam iguais (fixa quem lá estava nas tarefas que seguiam o onze) */
function fixaLances(slotsTroca,antesB){ const novos=[];
  lancesAjustaveis().forEach(L=>{ const ss=slotsDe(L).filter(s=>slotsTroca.includes(s)&&!(L.fixo&&L.fixo[s])); if(!ss.length) return;
    const A=copiaLance(L), C=copiaLance(L); C.fixo={...(C.fixo||{})}; ss.forEach(s=>C.fixo[s]=antesB[s]); novos.push([A,C]); });
  gravaLances(novos); }
/* um jogador sai do onze: quem entra fica com as tarefas dele em todos os lances */
function passaNosLances(sai,entra,msg){ const novos=[], campo=new Set(titulares());
  lancesAjustaveis().forEach(L=>{ const ss=slotsDe(L), v=vDoLance(L), v0={...v}; if(!passaTarefas(v,ss,sai,entra,campo)) return;
    const A=copiaLance(L), C=copiaLance(L); C.fixo={...(C.fixo||{})}; ss.forEach(s=>{ if(v[s]!==v0[s]) C.fixo[s]=v[s]; }); novos.push([A,C]); });
  return gravaLances(novos,msg!==false&&novos.length?`Bolas paradas: ${entra} fica com as tarefas do ${sai} em ${novos.length} lance${novos.length>1?"s":""}`:null); }
/* jogadores fixos num lance que não estão no onze (ex.: o nº 4 já não joga mas continua a bater o canto) */
const ausentesDe=L=>{ const tit=new Set(titulares()); return [...new Set(Object.values(L.fixo||{}).filter(n=>n&&!tit.has(n)))].filter(n=>slotsDe(L).some(s=>L.fixo[s]===n)); };
/* corrige todos os lances: quem está agora no lugar dele no onze (posição com o nº dele) ou, se não houver, um titular livre */
function corrigeAusentes(){ const novos=[], campo=new Set(titulares());
  lancesAjustaveis().forEach(L=>{ const aus=ausentesDe(L), ss=slotsDe(L), v=vDoLance(L), v0={...v}; if(!aus.length&&!repetidos(L,v).length) return;
    aus.forEach(x=>{ const o=jogo.onze.find(o=>o.slot===x); let y=o&&o.n!==x?o.n:null;
      if(!y){ const usados=new Set(ss.map(s=>v[s])), livre=n=>n&&campo.has(n)&&!usados.has(n)&&!ehGRn(n), s0=ss.find(s=>v[s]===x);
        y=livre(baseOf(s0))?baseOf(s0):[...campo].find(livre)||null; }
      if(y) passaTarefas(v,ss,x,y,campo); });
    /* v107.1: repetidos ficam na tarefa escolhida para eles (fixa no lance); as outras passam para titulares livres */
    repetidos(L,v).forEach(n=>{ const sl=[...new Set(L.bolas.filter(B=>!eAlternativa(B)).map(B=>B.slot))].filter(s=>v[s]===n), fica=sl.find(s=>L.fixo&&L.fixo[s]===n&&baseOf(s)!==n)||sl.find(s=>L.fixo&&L.fixo[s]===n)||sl[0];
      /* a tarefa a mais vai para o colega com quem ele trocou de lugar no onze (quem está agora na posição com o nº dele), senão o dono da posição, senão um titular livre */
      sl.filter(s=>s!==fica).forEach(s=>{ const usados=new Set(ss.map(x=>v[x])), livre=m=>m&&campo.has(m)&&!usados.has(m)&&!ehGRn(m), par=(jogo.onze.find(o=>o.slot===n)||{}).n;
        const y=[par,baseOf(s)].find(livre)||[...campo].find(livre); if(y) v[s]=y; }); });
    if(ss.some(s=>v[s]!==v0[s])){ const A=copiaLance(L), C=copiaLance(L); C.fixo={...(C.fixo||{})}; ss.forEach(s=>{ if(v[s]!==v0[s]) C.fixo[s]=v[s]; }); novos.push([A,C]); } });
  gravaLances(novos,novos.length?`Bolas paradas corrigidas em ${novos.length} lance${novos.length>1?"s":""}`:"Nada a corrigir"); }
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
