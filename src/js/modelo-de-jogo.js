
/* ================= MODELO DE JOGO · quadros animados por passos ================= */
const MOMENTOS=[
  ["of","Organização ofensiva","#C00000",[["constr","Construção"],["criac","Criação"],["final","Finalização"]]],
  ["def","Organização defensiva","#1F5FBF",[["pressao","Pressão alta"],["bmedio","Bloco médio"],["bbaixo","Bloco baixo"]]],
  ["tda","Transição defesa → ataque","#1E7A46",[["contra","Contra-ataque"],["seg","Saída em segurança"]]],
  ["tad","Transição ataque → defesa","#B8963F",[["reacao","Reação à perda"],["reorg","Reorganização"]]]];
const SISTEMAS={
  "4-3-3":[["GR",5,34],["DD",30,57],["DC",25,41],["DC",25,27],["DE",30,11],["MDC",38,34],["MC",49,44],["MC",49,24],["ED",63,57],["PL",68,34],["EE",63,11]],
  "4-4-2":[["GR",5,34],["DD",30,57],["DC",25,41],["DC",25,27],["DE",30,11],["MD",50,57],["MC",45,40],["MC",45,28],["ME",50,11],["PL",64,39],["PL",64,29]],
  "4-2-3-1":[["GR",5,34],["DD",30,57],["DC",25,41],["DC",25,27],["DE",30,11],["MDC",39,41],["MDC",39,27],["ED",57,57],["MO",54,34],["EE",57,11],["PL",67,34]],
  "4-1-4-1":[["GR",5,34],["DD",30,57],["DC",25,41],["DC",25,27],["DE",30,11],["MDC",37,34],["MD",51,57],["MC",48,42],["MC",48,26],["ME",51,11],["PL",65,34]],
  "3-5-2":[["GR",5,34],["DC",25,47],["DC",23,34],["DC",25,21],["ALA",47,60],["MDC",37,34],["MC",47,43],["MC",47,25],["ALA",47,8],["PL",63,39],["PL",63,29]],
  "3-4-3":[["GR",5,34],["DC",25,47],["DC",23,34],["DC",25,21],["ALA",44,60],["MC",42,40],["MC",42,28],["ALA",44,8],["ED",62,54],["PL",66,34],["EE",62,14]]};
const SETA_T={corrida:["Corrida","#111111",.42,null],passe:["Passe","#E36C09",.38,[1.3,.9]],conducao:["Condução","#1E7A46",.38,[.45,.55]],pressao:["Pressão","#C00000",.5,null]};
const CORES_ZONA=[["#FFC000","Amarelo"],["#C00000","Vermelho"],["#0070C0","Azul"],["#7F7F7F","Cinza"],["#1E7A46","Verde"]];
/* cores das zonas do visual antigo (campo verde) → visual das bolas paradas */
const ZONA_ANT={"#FFD60A":"#FFC000","#FF4D4D":"#C00000","#4DA3FF":"#0070C0","#FFFFFF":"#7F7F7F","#7CF29A":"#1E7A46"};
const corZ=c=>ZONA_ANT[String(c||"").toUpperCase()]||c||"#FFC000";
const MV={W:1600,H:900,ox:30,oy:118,k:10.2,px:1132};
/* campo do onze no separador Jogo (unidades do slide) → metros */
const ONZE_CAMPO=[2740,11380,81400,63780];
function onzeM(o){ const [x0,y0,x1,y1]=ONZE_CAMPO; return {x:Math.round(mClamp((o.x-x0)/(x1-x0)*105,-2,107)*10)/10,y:Math.round(mClamp((o.y-y0)/(y1-y0)*68,-2,70)*10)/10}; }
const MFONT="'RC Modelo','Roboto Condensed','Arial Narrow',Arial,sans-serif";
const M_LS="sca-modelo-v1";
(function(){ try{ [["400","fonts/rc-400.ttf"],["700","fonts/rc-700.ttf"]].forEach(([w,f])=>{ if(!IMG_DATA[f]||!window.FontFace) return; const ff=new FontFace("RC Modelo",`url(${IMG_DATA[f]})`,{weight:w}); ff.load().then(x=>document.fonts.add(x)).catch(()=>{}); }); }catch(e){} })();

let modelos={}; try{ modelos=JSON.parse(localStorage.getItem(M_LS)||"{}")||{}; }catch(e){ modelos={}; }
let mCur=null, mT_=0, mEdit=false, mTool="mover", mSetaT="corrida", mZonaCor="#FFC000", mSel=null, mPl=null, mLoop=false, mMult=1, mUndo=[], mDrag=null, mTmp=null;
try{ mCur=localStorage.getItem("sca-modelo-cur")||null; }catch(e){}

const mId=p=>(p||"m")+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const mClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mEase=f=>f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2;
function momDe(k){ return MOMENTOS.find(m=>m[0]===k)||MOMENTOS[0]; }
function subNome(mom,sub){ const s=momDe(mom)[3].find(x=>x[0]===sub); return s?s[1]:""; }
function normQ(d){ const Q={...d}; Q.nome=String(Q.nome||"Sem nome"); if(!MOMENTOS.some(m=>m[0]===Q.mom)) Q.mom="of";
  if(!momDe(Q.mom)[3].some(s=>s[0]===Q.sub)) Q.sub=momDe(Q.mom)[3][0][0];
  Q.vel=+Q.vel||1.2; Q.pausa=+Q.pausa||1.2; Q.rot=Q.rot==="num"?"num":"pos"; Q.nomes=!!Q.nomes; Q.auto=Q.auto!==false; Q.ordem=+Q.ordem||0;
  Q.pecas=Array.isArray(Q.pecas)?Q.pecas.filter(p=>p&&p.id).map(p=>{ const c={...p}; if(c.slot) c.slot=String(c.slot); else delete c.slot; return c; }):[];
  Q.trocas=Array.isArray(Q.trocas)?Q.trocas.filter(t=>t&&t.sai&&t.entra).map(t=>({id:String(t.id||mId("t")),sai:String(t.sai),entra:String(t.entra)})):[];
  Q.passos=Array.isArray(Q.passos)&&Q.passos.length?Q.passos.map(P=>({id:P.id||mId("p"),nota:String(P.nota||""),pos:{...(P.pos||{})},setas:Array.isArray(P.setas)?P.setas:[],zonas:Array.isArray(P.zonas)?P.zonas:[]})):[{id:mId("p"),nota:"",pos:{},setas:[],zonas:[]}];
  Q.passos.forEach((P,i)=>Q.pecas.forEach(pc=>{ if(!P.pos[pc.id]) P.pos[pc.id]=i?{...Q.passos[i-1].pos[pc.id]}:{x:52.5,y:34}; }));
  return Q; }
Object.keys(modelos).forEach(id=>{ try{ modelos[id]=normQ({...modelos[id],id}); }catch(e){ delete modelos[id]; } });
function listaModelos(){ const oM=k=>MOMENTOS.findIndex(m=>m[0]===k), oS=Q=>momDe(Q.mom)[3].findIndex(s=>s[0]===Q.sub);
  return Object.values(modelos).sort((a,b)=>oM(a.mom)-oM(b.mom)||oS(a)-oS(b)||a.ordem-b.ordem||String(a.nome).localeCompare(b.nome)); }
function guardaModLocal(){ try{ localStorage.setItem(M_LS,JSON.stringify(modelos)); }catch(e){} }
function guardaQ(Q,semUndo){ Q=normQ(Q); if(!semUndo) pushMUndo(Q.id); modelos[Q.id]=clone(Q); guardaModLocal(); gravaDoc("modelo/"+Q.id,modelos[Q.id]); return modelos[Q.id]; }
function pushMUndo(id){ mUndo.push({id,antes:modelos[id]?clone(modelos[id]):null}); if(mUndo.length>50) mUndo.shift(); }
function desfazModelo(){ const u=mUndo.pop(); if(!u){ toast("Nada para desfazer."); return; }
  if(u.antes){ modelos[u.id]=u.antes; gravaDoc("modelo/"+u.id,u.antes); mCur=u.id; mT_=Math.min(Math.round(mT_),u.antes.passos.length-1); }
  else { delete modelos[u.id]; apagaDoc("modelo/"+u.id); if(mCur===u.id) mCur=null; }
  guardaModLocal(); renderModelo(); toast("Desfeito"); }
function repoeModelos(M){ Object.keys(modelos).forEach(id=>{ if(!M[id]) apagaDoc("modelo/"+id); }); modelos={}; Object.entries(M||{}).forEach(([id,Q])=>{ modelos[id]=normQ({...Q,id}); gravaDoc("modelo/"+id,modelos[id]); }); guardaModLocal(); renderModelo(); }

/* ---------- tempo da animação ---------- */
function mDur(Q){ const n=Q.passos.length; return n*Q.pausa+(n-1)*Q.vel+Q.pausa*.5; }
function mT(Q,sec){ let s=sec; const n=Q.passos.length; for(let k=0;k<n;k++){ if(s<Q.pausa) return k; s-=Q.pausa; if(k<n-1){ if(s<Q.vel) return k+s/Q.vel; s-=Q.vel; } } return n-1; }
function mSec(Q,t){ const k=Math.floor(t), f=t-k; return k*(Q.pausa+Q.vel)+(f>1e-6?Q.pausa+f*Q.vel:0); }
function passoVisivel(Q,t){ const k=Math.floor(t), f=t-k; return Math.min(Q.passos.length-1,f>=.5?k+1:k); }

/* ---------- desenho: primitivas comuns (SVG e canvas) ---------- */
const MX=m=>MV.ox+m*MV.k, MY=m=>MV.oy+m*MV.k, MK=m=>m*MV.k;
/* números: cada jogador SCA está ligado a um lugar do onze (slot) e mostra quem lá está no separador Jogo, depois das trocas do quadro */
function numerosQ(Q){ const slots=[...new Set(Q.pecas.filter(p=>p.eq==="nos"&&p.slot).map(p=>p.slot))], v={}; slots.forEach(s=>v[s]=baseOf(s));
  Q.trocas.forEach(t=>{ if(!slots.some(s=>v[s]===t.sai)) return; slots.forEach(s=>{ if(v[s]===t.sai) v[s]=t.entra; else if(v[s]===t.entra) v[s]=t.sai; }); }); return v; }
function numPeca(pc,v){ return pc.slot?(v[pc.slot]||""):String(pc.n||""); }
function rotulo(Q,pc,v){ const n=numPeca(pc,v); return Q.rot==="num"&&n?n:(pc.pos||n||""); }
/* por baixo da bolinha só o nome, e só com "Nomes por baixo" ligado */
function legendaPeca(Q,pc,v){ const n=numPeca(pc,v); return Q.nomes&&n?nome(n):""; }
/* número ⇄ posição nas bolinhas de um quadro (fica guardado: TV e vídeo mostram o mesmo) */
function trocaRot(id){ const Q=modelos[id]; return guardaQ({...clone(Q),rot:Q.rot==="num"?"pos":"num"}); }
function estiloPeca(pc){ const gr=/^GR$/i.test(pc.pos||"");
  if(pc.eq==="adv") return gr?{fill:"#9DC3E6",txt:"#000000"}:{fill:"#0070C0",txt:"#FFFFFF"}; return gr?{fill:"#FFFF00",txt:"#000000"}:{fill:"#C00000",txt:"#FFFFFF"}; }
function seta(o,x1,y1,x2,y2,cor,sw,dash,op,attr){ const L=Math.hypot(x2-x1,y2-y1); if(L<MK(.8)) return; const ux=(x2-x1)/L, uy=(y2-y1)/L, hl=Math.min(MK(1.7),L*.6), hw=MK(.65)+sw*.6;
  const bx=x2-ux*hl, by=y2-uy*hl; o.push({t:"line",x1,y1,x2:bx,y2:by,stroke:"rgba(255,255,255,.75)",sw:sw+MK(.3),dash,op,cap:"round"});
  o.push({t:"line",x1,y1,x2:bx,y2:by,stroke:cor,sw,dash,op,cap:dash?"butt":"round",attr});
  o.push({t:"poly",pts:[[x2,y2],[bx-uy*hw,by+ux*hw],[bx+uy*hw,by-ux*hw]],fill:cor,op,attr}); }
/* campo igual ao dos quadros das bolas paradas: riscas brancas e cinzentas, linhas pretas */
function primsCampo(o){ const k=MV.k, x0=MV.ox, y0=MV.oy, w=105*k, h=68*k, L={stroke:"#111111",sw:2.2,fill:"none"};
  for(let i=0;i<18;i++) o.push({t:"rect",x:x0+i*w/18,y:y0,w:w/18+.5,h,fill:i%2?"#EEEEEE":"#FFFFFF"});
  o.push({t:"rect",x:x0,y:y0,w,h,stroke:L.stroke,sw:2.8,fill:"none"}); o.push({t:"line",x1:x0+w/2,y1:y0,x2:x0+w/2,y2:y0+h,stroke:L.stroke,sw:L.sw});
  o.push({t:"circ",cx:x0+w/2,cy:y0+h/2,r:9.15*k,...L}); o.push({t:"circ",cx:x0+w/2,cy:y0+h/2,r:.35*k,fill:L.stroke});
  const cy=y0+h/2, a=Math.acos(5.5/9.15);
  [[x0,1],[x0+w,-1]].forEach(([gx,d])=>{ o.push({t:"rect",x:d>0?gx:gx-16.5*k,y:cy-20.16*k,w:16.5*k,h:40.32*k,...L}); o.push({t:"rect",x:d>0?gx:gx-5.5*k,y:cy-9.16*k,w:5.5*k,h:18.32*k,...L});
    const sx=gx+d*11*k; o.push({t:"circ",cx:sx,cy,r:.3*k,fill:L.stroke}); o.push(d>0?{t:"arc",cx:sx,cy,r:9.15*k,a0:-a,a1:a,stroke:L.stroke,sw:L.sw}:{t:"arc",cx:sx,cy,r:9.15*k,a0:Math.PI-a,a1:Math.PI+a,stroke:L.stroke,sw:L.sw});
    const gx2=d>0?gx-2*k:gx; o.push({t:"rect",x:gx2,y:cy-3.66*k,w:2*k,h:7.32*k,fill:"#D9D9D9",stroke:L.stroke,sw:1.8});
    for(let j=1;j<4;j++) o.push({t:"line",x1:gx2,y1:cy-3.66*k+j*1.83*k,x2:gx2+2*k,y2:cy-3.66*k+j*1.83*k,stroke:"#888888",sw:.8}); });
  [[x0,y0,0,Math.PI/2],[x0+w,y0,Math.PI/2,Math.PI],[x0+w,y0+h,Math.PI,1.5*Math.PI],[x0,y0+h,1.5*Math.PI,2*Math.PI]].forEach(([cx,cy_,a0,a1])=>o.push({t:"arc",cx,cy:cy_,r:1*k,a0,a1,stroke:L.stroke,sw:L.sw})); }
function primsEstaticas(Q){ const o=[]; o.push({t:"rect",x:0,y:0,w:MV.W,h:MV.H,fill:"#FFFFFF"});
  /* cabeçalho dos slides: ícone tático, título, linha dourada e emblema */
  if(IMG_DATA["slides/b-head.jpg"]) o.push({t:"imgc",href:IMG_DATA["slides/b-head.jpg"],iw:2050,ih:1538,sx:22,sy:30,sw:170,sh:165,x:20,y:12,w:88,h:85});
  const M=momDe(Q.mom), pre=`${M[1]} · ${subNome(Q.mom,Q.sub)} – `, tw=1360; let fs=38; while(fs>24&&textW(pre+Q.nome,fs,700)>tw) fs-=2;
  o.push({t:"text",x:124,y:64,txt:pre,fs,fill:"#000000",w:700}); o.push({t:"text",x:124+textW(pre,fs,700),y:64,txt:Q.nome,fs,fill:"#C00000",w:700});
  o.push({t:"rect",x:124,y:80,w:tw+10,h:7,fill:"#C9B26B"});
  if(IMG_DATA["slides/logo.png"]) o.push({t:"img",href:IMG_DATA["slides/logo.png"],x:1506,y:6,w:88,h:80});
  primsCampo(o);
  o.push({t:"rect",x:MV.px,y:MV.oy,w:MV.W-MV.px-24,h:68*MV.k,fill:"#FFFFFF",stroke:"#C00000",sw:3,rx:14});
  /* legenda */ let lx=30; const ly=858;
  const usadas=new Set(); Q.passos.forEach(P=>P.setas.forEach(s=>usadas.add(s.t||"corrida"))); if(Q.auto) usadas.add("corrida"); if(Q.auto&&Q.pecas.some(p=>p.eq==="bola")) usadas.add("passe");
  Object.entries(SETA_T).forEach(([k,[nm,cor,sw,dash]])=>{ if(!usadas.has(k)) return; seta(o,lx,ly,lx+46,ly,cor,MK(sw),dash?dash.map(MK):null,1); o.push({t:"text",x:lx+56,y:ly+6,txt:nm,fs:18,fill:"#333333",w:700}); lx+=72+textW(nm,18,700)+24; });
  const sis=Q.sis==="onze"?"SCA · onze do jogo":`SCA ${Q.sis||""}`.trim(), adv=Q.pecas.some(p=>p.eq==="adv");
  const chip=(x,t,c)=>{ const w=textW(t,16,700)+20; o.push({t:"rect",x:x-w,y:ly-14,w,h:28,rx:6,fill:c}); o.push({t:"text",x:x-w/2,y:ly+6,txt:t,fs:16,fill:"#fff",w:700,anchor:"middle"}); return x-w-8; };
  let rx=MV.ox+105*MV.k; if(adv) rx=chip(rx,"ADV "+(Q.sisAdv||""),"#0070C0"); chip(rx,sis,"#C00000");
  return o; }
function primsDinamicas(Q,t,ed){ const o=[], n=Q.passos.length; t=mClamp(t,0,n-1); const k=Math.floor(t), k2=Math.min(k+1,n-1), f=k2>k?t-k:0, e=mEase(f);
  const A=Q.passos[k], B=Q.passos[k2], opA=f===0?1:Math.max(0,1-f*2.2), pos={};
  Q.pecas.forEach(pc=>{ const a=A.pos[pc.id]||{x:52.5,y:34}, b=B.pos[pc.id]||a; pos[pc.id]={x:a.x+(b.x-a.x)*e,y:a.y+(b.y-a.y)*e,a,b}; });
  /* zonas */ const zB=new Map(B.zonas.map(z=>[z.id,z])), zA=new Set(A.zonas.map(z=>z.id));
  const ae=ed&&ed.edit&&f===0;
  const zona=(z,op,attr)=>{ const c=corZ(z.cor); o.push({t:"rect",x:MX(z.x),y:MY(z.y),w:MK(z.w),h:MK(z.h),rx:MK(.9),fill:c,fop:.2*op,stroke:c,sw:MK(.22),dash:[MK(1),MK(.7)],op:.85*op,attr}); };
  A.zonas.forEach(z=>{ const zb=k2>k?zB.get(z.id):z; if(zb){ const I=(p,q)=>p+(q-p)*e; zona({...z,x:I(z.x,zb.x),y:I(z.y,zb.y),w:I(z.w,zb.w),h:I(z.h,zb.h)},1,ae?{"data-z":z.id}:null); } else zona(z,1-e,null); });
  if(k2>k) B.zonas.forEach(z=>{ if(!zA.has(z.id)) zona(z,e,null); });
  if(ed&&ed.tmpZ){ const z=ed.tmpZ; zona({x:Math.min(z.x1,z.x2),y:Math.min(z.y1,z.y2),w:Math.abs(z.x2-z.x1),h:Math.abs(z.y2-z.y1),cor:mZonaCor},1,null); }
  /* setas automáticas (movimento até ao passo seguinte) */
  /* medidas do Onze Titular das bolas paradas (bolinha ~2,3 m, número ~2,2 m) */
  const r=2.3, rb=1.25;
  if(Q.auto&&opA>0&&k+1<n){ const C=Q.passos[k+1]; Q.pecas.forEach(pc=>{ const a=A.pos[pc.id], b=C.pos[pc.id]; if(!a||!b) return; const d=Math.hypot(b.x-a.x,b.y-a.y); if(d<1.4) return;
      const ux=(b.x-a.x)/d, uy=(b.y-a.y)/d, rr=pc.eq==="bola"?rb:r, st=pc.eq==="bola"?SETA_T.passe:SETA_T.corrida;
      const cor=pc.eq==="adv"?"#0070C0":st[1]; seta(o,MX(a.x+ux*rr),MY(a.y+uy*rr),MX(b.x-ux*.3),MY(b.y-uy*.3),cor,MK(st[2]),st[3]?st[3].map(MK):null,opA*.9); }); }
  /* setas manuais do passo */
  if(opA>0) A.setas.forEach(s=>{ const st=SETA_T[s.t]||SETA_T.corrida; seta(o,MX(s.x1),MY(s.y1),MX(s.x2),MY(s.y2),st[1],MK(st[2]),st[3]?st[3].map(MK):null,opA,ae?{"data-s":s.id}:null);
    if(ae) o.push({t:"line",x1:MX(s.x1),y1:MY(s.y1),x2:MX(s.x2),y2:MY(s.y2),stroke:"rgba(0,0,0,0)",sw:MK(1.6),attr:{"data-s":s.id}}); });
  if(ed&&ed.tmpS){ const s=ed.tmpS, st=SETA_T[mSetaT]; seta(o,MX(s.x1),MY(s.y1),MX(s.x2),MY(s.y2),st[1],MK(st[2]),st[3]?st[3].map(MK):null,.8); }
  /* peças: adversários, nossos, bola por cima */
  const ordem=[...Q.pecas.filter(p=>p.eq==="adv"),...Q.pecas.filter(p=>p.eq==="nos"),...Q.pecas.filter(p=>p.eq==="bola")];
  const v=numerosQ(Q), sel=ed&&ed.edit;
  ordem.forEach(pc=>{ const p=pos[pc.id], cx=MX(p.x), cy=MY(p.y);
    if(pc.eq==="bola"){ if(IMG_DATA["slides/bola.png"]) o.push({t:"img",href:IMG_DATA["slides/bola.png"],x:cx-MK(rb),y:cy-MK(rb),w:MK(2*rb),h:MK(2*rb)});
      else { o.push({t:"circ",cx,cy,r:MK(rb),fill:"#FFFFFF",stroke:"#111",sw:MK(.16)}); o.push({t:"circ",cx,cy,r:MK(.3),fill:"#111"}); }
      if(ed){ if(sel&&mSel===pc.id) o.push({t:"circ",cx,cy,r:MK(rb+.5),fill:"none",stroke:"#F79646",sw:MK(.3)}); o.push({t:"circ",cx,cy,r:MK(rb+1.1),fill:"rgba(0,0,0,0)",attr:{"data-p":pc.id}}); } return; }
    const S=estiloPeca(pc), lab=rotulo(Q,pc,v), fs=MK(lab.length<=2?2.15:lab.length===3?1.55:1.2);
    o.push({t:"circ",cx,cy,r:MK(r),fill:S.fill,stroke:"#000000",sw:MK(.2)});
    o.push({t:"text",x:cx,y:cy+fs*.35,txt:lab,fs,fill:S.txt,w:700,anchor:"middle"});
    const lg=pc.eq==="nos"?legendaPeca(Q,pc,v):""; if(lg){ const nfs=MK(1.3), nw=textW(lg,nfs,700)+MK(1.1); o.push({t:"rect",x:cx-nw/2,y:cy+MK(r+.3),w:nw,h:nfs*1.35,rx:MK(.5),fill:"rgba(27,26,23,.85)"}); o.push({t:"text",x:cx,y:cy+MK(r+.3)+nfs*1.02,txt:lg,fs:nfs,fill:"#fff",w:700,anchor:"middle"}); }
    if(ed){ if(sel&&mSel===pc.id) o.push({t:"circ",cx,cy,r:MK(r+.55),fill:"none",stroke:"#F79646",sw:MK(.4)}); o.push({t:"circ",cx,cy,r:MK(r+.7),fill:"rgba(0,0,0,0)",attr:{"data-p":pc.id}}); } });
  /* painel do passo */
  const pv=passoVisivel(Q,t), px=MV.px+26, P=Q.passos[pv];
  o.push({t:"text",x:px,y:MV.oy+42,txt:"PASSO",fs:19,fill:"#7F7F7F",w:700});
  o.push({t:"text",x:px,y:MV.oy+122,txt:String(pv+1),fs:84,fill:"#111111",w:700}); o.push({t:"text",x:px+textW(String(pv+1),84,700)+10,y:MV.oy+122,txt:"/ "+n,fs:34,fill:"#7F7F7F",w:700});
  for(let i=0;i<n;i++) o.push({t:"circ",cx:px+8+i*24,cy:MV.oy+154,r:7,fill:i===pv?"#C00000":i<pv?"#1B1A17":"#D0CCC3"});
  const linhas=[]; String(P.nota||"").split(/\n/).forEach(par=>quebra(par,26,MV.W-MV.px-74,700).forEach(l=>linhas.push(l)));
  if(linhas.some(l=>l.trim())){ o.push({t:"rect",x:px,y:MV.oy+184,w:MV.W-MV.px-76,h:2,fill:"#E5E1D8"}); o.push({t:"text",x:px,y:MV.oy+226,txt:"Indicações:",fs:24,fill:"#C00000",w:700});
    linhas.slice(0,12).forEach((l,i)=>o.push({t:"text",x:px,y:MV.oy+268+i*36,txt:l,fs:26,fill:"#1B1A17",w:700})); }
  return o; }

/* ---------- serialização ---------- */
const mA=v=>Math.round(v*10)/10;
function primsSvg(L){ const at=p=>p.attr?Object.entries(p.attr).map(([k,v])=>` ${k}="${esc(v)}"`).join(""):"", op=p=>p.op!=null&&p.op<1?` opacity="${mA(p.op*100)/100}"`:"", da=p=>p.dash?` stroke-dasharray="${p.dash.map(mA).join(" ")}"`:"";
  return L.map(p=>{ switch(p.t){
    case "rect": return `<rect x="${mA(p.x)}" y="${mA(p.y)}" width="${mA(p.w)}" height="${mA(p.h)}"${p.rx?` rx="${mA(p.rx)}"`:""} fill="${p.fill||"none"}"${p.fop!=null?` fill-opacity="${mA(p.fop*100)/100}"`:""}${p.stroke?` stroke="${p.stroke}" stroke-width="${mA(p.sw||1)}"`:""}${da(p)}${op(p)}${at(p)}/>`;
    case "circ": return `<circle cx="${mA(p.cx)}" cy="${mA(p.cy)}" r="${mA(p.r)}" fill="${p.fill||"none"}"${p.stroke?` stroke="${p.stroke}" stroke-width="${mA(p.sw||1)}"`:""}${op(p)}${at(p)}/>`;
    case "line": return `<line x1="${mA(p.x1)}" y1="${mA(p.y1)}" x2="${mA(p.x2)}" y2="${mA(p.y2)}" stroke="${p.stroke}" stroke-width="${mA(p.sw)}" stroke-linecap="${p.cap||"butt"}"${da(p)}${op(p)}${at(p)}/>`;
    case "poly": return `<polygon points="${p.pts.map(q=>mA(q[0])+","+mA(q[1])).join(" ")}" fill="${p.fill}"${op(p)}${at(p)}/>`;
    case "arc": { const x1=p.cx+p.r*Math.cos(p.a0), y1=p.cy+p.r*Math.sin(p.a0), x2=p.cx+p.r*Math.cos(p.a1), y2=p.cy+p.r*Math.sin(p.a1); return `<path d="M ${mA(x1)} ${mA(y1)} A ${mA(p.r)} ${mA(p.r)} 0 ${p.a1-p.a0>Math.PI?1:0} 1 ${mA(x2)} ${mA(y2)}" fill="none" stroke="${p.stroke}" stroke-width="${mA(p.sw)}"/>`; }
    case "text": return `<text x="${mA(p.x)}" y="${mA(p.y)}" font-size="${mA(p.fs)}" font-weight="${p.w||400}" font-family="${MFONT.replace(/"/g,"'")}" fill="${p.fill}"${p.anchor?` text-anchor="${p.anchor}"`:""}${op(p)} pointer-events="none">${esc(p.txt)}</text>`;
    case "img": return `<image href="${p.href}" x="${mA(p.x)}" y="${mA(p.y)}" width="${mA(p.w)}" height="${mA(p.h)}" preserveAspectRatio="xMidYMid meet" pointer-events="none"/>`;
    case "imgc": return `<svg x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" viewBox="${p.sx} ${p.sy} ${p.sw} ${p.sh}" preserveAspectRatio="none" overflow="hidden" pointer-events="none"><image href="${p.href}" x="0" y="0" width="${p.iw}" height="${p.ih}" preserveAspectRatio="none"/></svg>`; } return ""; }).join(""); }
const mImgs={};
function primsCanvas(cx,L){ L.forEach(p=>{ cx.save(); cx.globalAlpha=p.op!=null?p.op:1; cx.setLineDash(p.dash||[]);
  switch(p.t){
    case "rect": { cx.beginPath(); if(p.rx&&cx.roundRect) cx.roundRect(p.x,p.y,p.w,p.h,p.rx); else cx.rect(p.x,p.y,p.w,p.h);
      if(p.fill&&p.fill!=="none"){ cx.save(); if(p.fop!=null) cx.globalAlpha=p.fop; cx.fillStyle=p.fill; cx.fill(); cx.restore(); } if(p.stroke){ cx.lineWidth=p.sw||1; cx.strokeStyle=p.stroke; cx.stroke(); } break; }
    case "circ": cx.beginPath(); cx.arc(p.cx,p.cy,p.r,0,2*Math.PI); if(p.fill&&p.fill!=="none"){ cx.fillStyle=p.fill; cx.fill(); } if(p.stroke){ cx.lineWidth=p.sw||1; cx.strokeStyle=p.stroke; cx.stroke(); } break;
    case "line": cx.beginPath(); cx.moveTo(p.x1,p.y1); cx.lineTo(p.x2,p.y2); cx.lineCap=p.cap||"butt"; cx.lineWidth=p.sw; cx.strokeStyle=p.stroke; cx.stroke(); break;
    case "poly": cx.beginPath(); p.pts.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1])); cx.closePath(); cx.fillStyle=p.fill; cx.fill(); break;
    case "arc": cx.beginPath(); cx.arc(p.cx,p.cy,p.r,p.a0,p.a1); cx.lineWidth=p.sw; cx.strokeStyle=p.stroke; cx.stroke(); break;
    case "text": cx.font=`${p.w||400} ${p.fs}px ${MFONT}`; cx.textAlign=p.anchor==="middle"?"center":"left"; cx.textBaseline="alphabetic"; cx.fillStyle=p.fill; cx.fillText(p.txt,p.x,p.y); break;
    case "img": case "imgc": { let im=mImgs[p.href]; if(!im){ im=new Image(); im.src=p.href; mImgs[p.href]=im; } if(!(im.complete&&im.naturalWidth)) break;
      if(p.t==="img") cx.drawImage(im,p.x,p.y,p.w,p.h); else { const fx=im.naturalWidth/p.iw, fy=im.naturalHeight/p.ih; cx.drawImage(im,p.sx*fx,p.sy*fy,p.sw*fx,p.sh*fy,p.x,p.y,p.w,p.h); } break; } }
  cx.restore(); }); }
/* o vídeo pinta logo o 1.º fotograma: as imagens têm de estar prontas antes */
function mCarregaImgs(){ return Promise.all(["slides/b-head.jpg","slides/logo.png","slides/bola.png"].filter(k=>IMG_DATA[k]).map(k=>{ const h=IMG_DATA[k]; let im=mImgs[h]; if(!im){ im=new Image(); im.src=h; mImgs[h]=im; }
  return im.decode?im.decode().catch(()=>{}):Promise.resolve(); })); }
function pintaModeloCanvas(cx,Q,t,Wc,Hc){ const s=Math.min(Wc/MV.W,Hc/MV.H); cx.save(); cx.fillStyle="#111"; cx.fillRect(0,0,Wc,Hc); cx.translate((Wc-MV.W*s)/2,(Hc-MV.H*s)/2); cx.scale(s,s);
  primsCanvas(cx,primsEstaticas(Q)); primsCanvas(cx,primsDinamicas(Q,t,null)); cx.restore(); }

/* ---------- leitor (app, TV) ---------- */
function playerModelo(Q,opts={}){ const svg=document.createElementNS(NS,"svg"); svg.setAttribute("viewBox",`0 0 ${MV.W} ${MV.H}`); svg.setAttribute("class","mos"); svg.setAttribute("role","img"); svg.setAttribute("aria-label","Modelo de jogo: "+Q.nome);
  svg.innerHTML=`<g class="mst"></g><g class="mdin"></g>`; const st=svg.querySelector(".mst"), din=svg.querySelector(".mdin");
  let raf=0, t0=null, sec=0, playing=false, tAtual=0;
  const P={svg,
    setQ(q){ Q=q; st.innerHTML=primsSvg(primsEstaticas(Q)); },
    set(t){ tAtual=mClamp(t,0,Q.passos.length-1); din.innerHTML=primsSvg(primsDinamicas(Q,tAtual,opts.ed?opts.ed():null)); },
    play(fromT){ if(fromT!=null) sec=mSec(Q,fromT); else sec=mSec(Q,tAtual); if(sec>=mDur(Q)-.05) sec=0; playing=true; t0=null; cancelAnimationFrame(raf); raf=requestAnimationFrame(loop); },
    pause(){ playing=false; cancelAnimationFrame(raf); },
    get playing(){ return playing; }, get t(){ return tAtual; }, get id(){ return Q.id; } };
  const loop=ts=>{ if(!playing) return; const mult=opts.mult?opts.mult():1; if(t0==null) t0=ts-sec*1000/mult; sec=(ts-t0)/1000*mult; const D=mDur(Q);
    if(sec>=D){ if(opts.loop&&(typeof opts.loop!=="function"||opts.loop())){ sec=0; t0=ts; } else { playing=false; P.set(Q.passos.length-1); opts.onT&&opts.onT(tAtual); opts.onEnd&&opts.onEnd(); return; } }
    P.set(mT(Q,sec)); opts.onT&&opts.onT(tAtual); raf=requestAnimationFrame(loop); };
  P.setQ(Q); P.set(0); return P; }
function mPara(){ if(mPl&&mPl.playing){ mPl.pause(); renderModeloControlos(); } }

/* ---------- TV ---------- */
function itensModeloTV(ids){ return ids.filter(id=>modelos[id]).map(id=>({k:"M:"+id,titulo:`${modelos[id].nome} · ${subNome(modelos[id].mom,modelos[id].sub)}`,ids:[],modelo:id})); }
function tempoItemTV(x,seg){ return x.modelo&&modelos[x.modelo]?Math.max(seg,mDur(modelos[x.modelo])+.8):seg; }
/* um grupo por momento do jogo; devolve os ids escolhidos pela ordem da lista */
function pickerModelo(box,pre){ const ls=listaModelos();
  MOMENTOS.forEach(([mk,mn,cor])=>{ const q=ls.filter(Q=>Q.mom===mk); if(!q.length) return;
    const g=document.createElement("div"); g.style.cssText="border:1px solid var(--line);border-radius:10px;background:var(--surface-2)";
    g.innerHTML=`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px"><input type="checkbox" class="pdf-gr" style="width:20px;height:20px"><i style="width:9px;height:9px;border-radius:50%;background:${cor}"></i><b style="flex:1;font-family:var(--f-display);font-size:15px"></b><button class="btn sm ghost pdf-ab">Escolher ▾</button></div><div class="pdf-ls" hidden style="display:flex;flex-direction:column;gap:2px;padding:0 10px 8px 40px"></div>`;
    const lst=g.querySelector(".pdf-ls"), gr=g.querySelector(".pdf-gr"), ab=g.querySelector(".pdf-ab");
    q.forEach(Q=>{ const l=document.createElement("label"); l.style.cssText="display:flex;gap:10px;align-items:center;font-size:14.5px;min-height:34px"; l.innerHTML=`<input type="checkbox" class="m-l" style="width:18px;height:18px"> <span></span>`; const i=l.querySelector("input"); i.value=Q.id; i.checked=pre(Q.id); l.querySelector("span").textContent=`${Q.nome} · ${subNome(Q.mom,Q.sub)}`; lst.appendChild(l); });
    const sync=()=>{ const cs=[...lst.querySelectorAll("input")], k=cs.filter(c=>c.checked).length; gr.checked=k===cs.length; gr.indeterminate=k>0&&k<cs.length; g.querySelector("b").textContent=`${mn} · ${k}/${cs.length}`; box.dispatchEvent(new Event("mudou")); };
    gr.onchange=()=>{ lst.querySelectorAll("input").forEach(c=>c.checked=gr.checked); sync(); }; lst.addEventListener("change",sync);
    ab.onclick=()=>{ const v=lst.hidden; lst.hidden=!v; ab.textContent=v?"Fechar ▴":"Escolher ▾"; }; box.appendChild(g); sync(); });
  return ()=>{ const ids=new Set([...box.querySelectorAll("input.m-l:checked")].map(i=>i.value)); return ls.filter(Q=>ids.has(Q.id)).map(Q=>Q.id); }; }
/* um ficheiro de vídeo por quadro */
async function exportaVideosSeparados(ids,seg,progresso){ const it=itensModeloTV(ids);
  for(let i=0;i<it.length;i++){ await exportaVideo([it[i]],seg,m=>progresso(`${i+1}/${it.length} · ${it[i].titulo} · ${m}`)); } }

/* ---------- novo quadro ---------- */
/* liga cada posição a um lugar do onze: primeiro pela mesma sigla, o resto pela ordem */
function slotsPara(poss){ const livres=jogo.onze.slice(), out=poss.map(p=>{ const i=livres.findIndex(o=>o.pos&&o.pos===p); return i>=0?livres.splice(i,1)[0].slot:null; });
  return out.map(s=>s||(livres.length?livres.shift().slot:null)); }
function pecasOnze(){ return jogo.onze.map(o=>({pc:{id:mId("n"),eq:"nos",pos:o.pos||"",n:"",slot:o.slot},...onzeM(o)})); }
function pecasSistema(sis,eq){ if(eq==="nos"&&sis==="onze") return pecasOnze(); const base=SISTEMAS[sis]||SISTEMAS["4-3-3"], sl=eq==="nos"?slotsPara(base.map(b=>b[0])):[];
  return base.map(([pos,x,y],i)=>({pc:{id:mId(eq==="adv"?"a":"n"),eq,pos,n:"",...(sl[i]?{slot:sl[i]}:{})},x:eq==="adv"?105-x:x,y:eq==="adv"?68-y:y})); }
function criaQuadro(o){ const nos=pecasSistema(o.sis,"nos"), adv=o.sisAdv?pecasSistema(o.sisAdv,"adv"):[], bola={id:mId("b"),eq:"bola",pos:"",n:""};
  const pos={}; [...nos,...adv].forEach(p=>pos[p.pc.id]={x:p.x,y:p.y});
  const comAdv=(o.mom==="def"||o.mom==="tad")&&adv.length, ref=comAdv?adv[5]:o.mom==="of"&&o.sub==="constr"?nos[0]:nos[5]; pos[bola.id]={x:ref.x+(comAdv?-2.2:2.4),y:ref.y+.4};
  return normQ({id:mId("q"),nome:o.nome,mom:o.mom,sub:o.sub,ordem:Date.now(),sis:o.sis,sisAdv:o.sisAdv||"",vel:1.2,pausa:1.2,rot:"num",nomes:false,auto:true,
    pecas:[...nos.map(p=>p.pc),...adv.map(p=>p.pc),bola],passos:[{id:mId("p"),nota:"",pos,setas:[],zonas:[]}],trocas:[],criadoEm:new Date().toISOString()}); }
const SIS_NOS=[["onze","Onze do jogo"],...Object.keys(SISTEMAS).map(s=>[s,s])];
function folhaNovoModelo(){ let mom=MOMENTOS[0][0], sub=MOMENTOS[0][3][0][0], sis="onze", sisAdv="4-4-2";
  folha(`<h3>Novo quadro · Modelo de Jogo</h3>
    <label class="f">Nome do quadro<input type="text" id="mn-n" placeholder="Ex.: Saída a 3 com o MDC entre centrais"></label>
    <h4>Momento</h4><div class="seg" id="mn-m">${MOMENTOS.map(m=>`<button data-k="${m[0]}">${m[1]}</button>`).join("")}</div>
    <h4>Subfase</h4><div class="seg" id="mn-s"></div>
    <h4>Equipa SCA</h4><div class="seg" id="mn-y">${SIS_NOS.map(([k,n])=>`<button data-k="${k}">${n}</button>`).join("")}</div>
    <p class="sub" style="margin:0">Os números são sempre os do onze do separador <b>Jogo</b>. Com <b>Onze do jogo</b>, os jogadores começam também nas posições que lá estão.</p>
    <h4>Adversário</h4><div class="seg" id="mn-a"><button data-k="">Sem</button>${Object.keys(SISTEMAS).map(s=>`<button data-k="${s}">${s}</button>`).join("")}</div>
    <p class="sub" style="margin:0">O quadro começa com o passo 1. Depois, em <b>Editar</b>, crias os passos seguintes e arrastas só os jogadores que se mexem.</p>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="mn-ok">Criar quadro</button></div>`,(s,fecha)=>{
    const pinta=()=>{ s.querySelectorAll("#mn-m button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===mom)));
      const ss=s.querySelector("#mn-s"); ss.innerHTML=momDe(mom)[3].map(x=>`<button data-k="${x[0]}" aria-pressed="${x[0]===sub}">${x[1]}</button>`).join("");
      ss.querySelectorAll("button").forEach(b=>b.onclick=()=>{ sub=b.dataset.k; pinta(); });
      s.querySelectorAll("#mn-y button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===sis)));
      s.querySelectorAll("#mn-a button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===sisAdv))); };
    s.querySelectorAll("#mn-m button").forEach(b=>b.onclick=()=>{ mom=b.dataset.k; sub=momDe(mom)[3][0][0]; pinta(); });
    s.querySelectorAll("#mn-y button").forEach(b=>b.onclick=()=>{ sis=b.dataset.k; pinta(); });
    s.querySelectorAll("#mn-a button").forEach(b=>b.onclick=()=>{ sisAdv=b.dataset.k; pinta(); }); pinta();
    s.querySelector("#mn-ok").onclick=()=>{ const nm=s.querySelector("#mn-n").value.trim()||(subNome(mom,sub)+" "+(listaModelos().filter(q=>q.sub===sub).length+1));
      const Q=guardaQ(criaQuadro({nome:nm,mom,sub,sis,sisAdv})); fecha(); mCur=Q.id; mT_=0; mEdit=true; mTool="mover"; mSel=null; renderModelo(); toast("Quadro criado · arrasta os jogadores para o passo 1"); }; }); }

/* ---------- edição ---------- */
function qAtual(){ const ls=listaModelos(); return modelos[mCur]||ls[0]||null; }
function passoAtual(){ return Math.round(mT_); }
function editaQ(fn,semRender){ const Q=clone(qAtual()); if(!Q) return; fn(Q); const N=guardaQ(Q); if(!semRender) renderModelo(); return N; }
function mPt(e){ const p=svgPt(mPl.svg,e); return {x:(p.x-MV.ox)/MV.k,y:(p.y-MV.oy)/MV.k}; }
function ligaEdicao(svg){
  svg.addEventListener("pointerdown",e=>{ if(!mEdit||mPl.playing) return; const Q=qAtual(); if(!Q) return; const k=passoAtual(), m=mPt(e), alvo=e.target.closest("[data-p],[data-s],[data-z]");
    if(alvo&&alvo.dataset.p&&(mTool==="mover"||mTool==="seta")){ const pid=alvo.dataset.p, P=Q.passos[k].pos[pid];
      if(mTool==="seta"){ mDrag={tipo:"seta",x1:P.x,y1:P.y}; mTmp={tmpS:{x1:P.x,y1:P.y,x2:m.x,y2:m.y}}; }
      else mDrag={tipo:"peca",pid,dx:P.x-m.x,dy:P.y-m.y,ox:P.x,oy:P.y,mov:false,q:clone(Q)};
    } else if(alvo&&alvo.dataset.s&&mTool==="mover"){ folhaSetaM(alvo.dataset.s); return; }
    else if(alvo&&alvo.dataset.z&&mTool==="mover"){ const z=Q.passos[k].zonas.find(z=>z.id===alvo.dataset.z); if(!z) return; mDrag={tipo:"zona",zid:z.id,dx:z.x-m.x,dy:z.y-m.y,ox:z.x,oy:z.y,mov:false,q:clone(Q)}; }
    else if(mTool==="seta"){ mDrag={tipo:"seta",x1:m.x,y1:m.y}; mTmp={tmpS:{x1:m.x,y1:m.y,x2:m.x,y2:m.y}}; }
    else if(mTool==="zona"){ mDrag={tipo:"zonaN",x1:m.x,y1:m.y}; mTmp={tmpZ:{x1:m.x,y1:m.y,x2:m.x,y2:m.y}}; }
    else { if(mSel){ mSel=null; mPl.set(k); } return; }
    e.preventDefault(); try{ svg.setPointerCapture(e.pointerId); }catch(x){} });
  svg.addEventListener("pointermove",e=>{ if(!mDrag) return; e.preventDefault(); const m=mPt(e), k=passoAtual();
    if(mDrag.tipo==="peca"){ const Q=mDrag.q, x=mClamp(m.x+mDrag.dx,-3,108), y=mClamp(m.y+mDrag.dy,-2,70); if(Math.hypot(x-mDrag.ox,y-mDrag.oy)>.4) mDrag.mov=true; Q.passos[k].pos[mDrag.pid]={x,y}; mPl.setQ(Q); mPl.set(k); }
    else if(mDrag.tipo==="zona"){ const Q=mDrag.q, z=Q.passos[k].zonas.find(z=>z.id===mDrag.zid); z.x=mClamp(m.x+mDrag.dx,-5,105); z.y=mClamp(m.y+mDrag.dy,-5,68); if(Math.hypot(z.x-mDrag.ox,z.y-mDrag.oy)>.4) mDrag.mov=true; mPl.setQ(Q); mPl.set(k); }
    else if(mDrag.tipo==="seta"){ mTmp.tmpS.x2=m.x; mTmp.tmpS.y2=m.y; mPl.set(k); }
    else if(mDrag.tipo==="zonaN"){ mTmp.tmpZ.x2=m.x; mTmp.tmpZ.y2=m.y; mPl.set(k); } });
  const fim=e=>{ if(!mDrag) return; const D=mDrag, T=mTmp; mDrag=null; mTmp=null; const k=passoAtual();
    if(D.tipo==="peca"){ if(D.mov){ const P=D.q.passos[k].pos[D.pid]; editaQ(Q=>{ Q.passos[k].pos[D.pid]={x:Math.round(P.x*10)/10,y:Math.round(P.y*10)/10}; }); } else { mSel=D.pid; mPl.set(k); folhaPecaM(D.pid); } }
    else if(D.tipo==="zona"){ if(D.mov){ const z=D.q.passos[k].zonas.find(z=>z.id===D.zid); editaQ(Q=>{ const t=Q.passos[k].zonas.find(x=>x.id===D.zid); if(t){ t.x=z.x; t.y=z.y; } }); } else folhaZonaM(D.zid); }
    else if(D.tipo==="seta"){ const s=T.tmpS; if(Math.hypot(s.x2-s.x1,s.y2-s.y1)>2) editaQ(Q=>Q.passos[k].setas.push({id:mId("s"),t:mSetaT,x1:s.x1,y1:s.y1,x2:s.x2,y2:s.y2})); else mPl.set(k); }
    else if(D.tipo==="zonaN"){ const z=T.tmpZ, w=Math.abs(z.x2-z.x1), h=Math.abs(z.y2-z.y1); if(w>2&&h>2) editaQ(Q=>Q.passos[k].zonas.push({id:mId("z"),x:Math.min(z.x1,z.x2),y:Math.min(z.y1,z.y2),w,h,cor:mZonaCor})); else mPl.set(k); } };
  svg.addEventListener("pointerup",fim); svg.addEventListener("pointercancel",fim);
  /* fora da edição: tocar num jogador SCA abre a troca, como nas bolas paradas */
  svg.addEventListener("click",e=>{ if(mEdit||mPl.playing) return; const alvo=e.target.closest("[data-p]"), Q=qAtual(); if(!alvo||!Q) return;
    const pc=Q.pecas.find(p=>p.id===alvo.dataset.p); if(pc&&pc.eq==="nos") folhaSubM(pc.id); }); }
function folhaSubM(pid){ const Q=qAtual(), pc=Q&&Q.pecas.find(p=>p.id===pid); if(!pc) return;
  if(!pc.slot){ toast("Este jogador não está ligado ao onze. Em ✎ Editar, toca nele e escolhe o lugar no onze."); return; }
  const v=numerosQ(Q), num=v[pc.slot], emQ=new Set(Object.values(v)); let sc="este";
  const sup=jogo.suplentes.filter(n=>!emQ.has(n)).sort(byNum), campo=[...emQ].filter(n=>n!==num).sort(byNum);
  const resto=est.plantel.map(p=>p.n).filter(n=>n&&!emQ.has(n)&&!sup.includes(n)).sort(byNum);
  folha(`<h3>Sai o <span class="big"></span></h3><p class="sub" style="margin:-6px 0 0">Escolhe quem entra. Se já estiver neste quadro, os dois trocam. O onze do separador Jogo não muda.</p>
    <div class="seg" role="group"><button data-s="este" aria-pressed="true">Só em ${esc(Q.nome)}</button><button data-s="todos" aria-pressed="false">Em todos os quadros do Modelo</button></div>
    <h4>Suplentes</h4><div class="pgrid" id="gm-sup"></div>
    <h4>Neste quadro · troca</h4><div class="pgrid" id="gm-campo"></div>
    <details class="more"><summary>Resto do plantel</summary><div class="pgrid" id="gm-resto" style="margin-top:8px"></div></details>
    <div class="actions"><button class="btn" data-close>Cancelar</button></div>`,(s,fecha)=>{
    s.querySelector(".big").textContent=rot(num);
    const pick=n=>{ fecha(); const t=()=>({id:mId("t"),sai:num,entra:n});
      if(sc==="este"){ editaQ(Q=>{ Q.trocas.push(t()); }); toast(`${num} → ${n} em ${Q.nome}`); return; }
      const alvos=listaModelos().filter(q=>Object.values(numerosQ(q)).includes(num)), antes=alvos.map(q=>clone(q));
      alvos.forEach(q=>{ const C=clone(q); C.trocas.push(t()); guardaQ(C,true); }); renderModelo();
      toast(`${num} → ${n} em ${alvos.length} ${alvos.length===1?"quadro":"quadros"}`,()=>{ antes.forEach(q=>guardaQ(q,true)); renderModelo(); }); };
    botoesJog(s.querySelector("#gm-sup"),sup,pick); if(!sup.length) s.querySelector("#gm-sup").innerHTML=`<p class="sub">Sem suplentes convocados. Define-os no separador Jogo.</p>`;
    botoesJog(s.querySelector("#gm-campo"),campo,pick); botoesJog(s.querySelector("#gm-resto"),resto,pick);
    s.querySelectorAll(".seg button").forEach(b=>b.onclick=()=>{ sc=b.dataset.s; s.querySelectorAll(".seg button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); }); }); }
function confirma2(btn,txt,acao){ let arm=false, tt=null; const orig=btn.textContent; btn.onclick=()=>{ if(!arm){ arm=true; btn.textContent=txt; btn.style.background="#C00000"; btn.style.color="#fff"; tt=setTimeout(()=>{ arm=false; btn.textContent=orig; btn.style.background=""; btn.style.color=""; },3000); return; } clearTimeout(tt); acao(); }; }
function folhaPecaM(pid){ const Q=qAtual(), pc=Q&&Q.pecas.find(p=>p.id===pid); if(!pc) return;
  const tit=pc.eq==="bola"?"Bola":pc.eq==="adv"?"Adversário":"Jogador SCA";
  folha(`<h3>${tit}</h3>${pc.eq==="bola"?`<p class="sub" style="margin:0">Arrasta a bola no quadro para a mudar de sítio em cada passo.</p>`:`
    <div class="fields"><label class="f">Posição (texto da bolinha)<input type="text" id="mp-p" maxlength="4" value="${esc(pc.pos||"")}"></label>
    ${pc.eq==="nos"?`<label class="f">Lugar no onze (o número segue o separador Jogo)<select id="mp-s"><option value="">— Sem ligação ao onze —</option>${jogo.onze.map(o=>`<option value="${esc(o.slot)}"${o.slot===pc.slot?" selected":""}>${esc(rot(o.n))}${o.pos?" · "+esc(o.pos):""}</option>`).join("")}</select></label>
      <label class="f" id="mp-nl">Jogador do plantel (opcional)<select id="mp-n"><option value="">— Nenhum —</option>${est.plantel.slice().sort(byNum).map(p=>`<option value="${esc(p.n)}"${p.n===pc.n?" selected":""}>${esc(rot(p.n))}</option>`).join("")}</select></label>`:`<label class="f">Número (opcional)<input type="text" id="mp-n" maxlength="3" value="${esc(pc.n||"")}"></label>`}</div>`}
    <div class="actions"><button class="btn danger l" id="mp-del">Apagar ${pc.eq==="bola"?"bola":"peça"}</button><button class="btn" data-close>Fechar</button>${pc.eq!=="bola"?`<button class="btn primary" id="mp-ok">Guardar</button>`:""}</div>`,(s,fecha)=>{
    confirma2(s.querySelector("#mp-del"),"Toca outra vez para apagar",()=>{ fecha(); mSel=null; editaQ(Q=>{ Q.pecas=Q.pecas.filter(p=>p.id!==pid); Q.passos.forEach(P=>delete P.pos[pid]); }); });
    const ss=s.querySelector("#mp-s"), nl=s.querySelector("#mp-nl"); if(ss){ const mostra=()=>nl.hidden=!!ss.value; ss.onchange=mostra; mostra(); }
    const ok=s.querySelector("#mp-ok"); if(ok) ok.onclick=()=>{ const pos=s.querySelector("#mp-p").value.trim().toUpperCase(), n=s.querySelector("#mp-n").value.trim(), sl=ss?ss.value:""; fecha();
      editaQ(Q=>{ const p=Q.pecas.find(p=>p.id===pid); if(!p) return; p.pos=pos;
        if(!ss){ p.n=n; return; }
        if(sl){ const outro=Q.pecas.find(x=>x.id!==pid&&x.eq==="nos"&&x.slot===sl); if(outro){ if(p.slot) outro.slot=p.slot; else delete outro.slot; } p.slot=sl; p.n=""; } else { delete p.slot; p.n=n; } }); }; }); }
function folhaSetaM(sid){ const Q=qAtual(), k=passoAtual(), S=Q.passos[k].setas.find(s=>s.id===sid); if(!S) return; let t=S.t||"corrida";
  folha(`<h3>Seta · passo ${k+1}</h3><h4>Tipo</h4><div class="seg" id="ms-t">${Object.entries(SETA_T).map(([k_,v])=>`<button data-k="${k_}">${v[0]}</button>`).join("")}</div>
    <div class="actions"><button class="btn danger l" id="ms-del">Apagar seta</button><button class="btn" id="ms-inv">⇄ Inverter sentido</button><button class="btn primary" data-close>Fechar</button></div>`,(s,fecha)=>{
    const pinta=()=>s.querySelectorAll("#ms-t button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===t)));
    s.querySelectorAll("#ms-t button").forEach(b=>b.onclick=()=>{ t=b.dataset.k; pinta(); editaQ(Q=>{ const x=Q.passos[k].setas.find(x=>x.id===sid); if(x) x.t=t; }); }); pinta();
    s.querySelector("#ms-inv").onclick=()=>editaQ(Q=>{ const x=Q.passos[k].setas.find(x=>x.id===sid); if(x){ [x.x1,x.y1,x.x2,x.y2]=[x.x2,x.y2,x.x1,x.y1]; } });
    s.querySelector("#ms-del").onclick=()=>{ fecha(); editaQ(Q=>{ Q.passos[k].setas=Q.passos[k].setas.filter(x=>x.id!==sid); }); }; }); }
function folhaZonaM(zid){ const Q=qAtual(), k=passoAtual(), Z=Q.passos[k].zonas.find(z=>z.id===zid); if(!Z) return;
  folha(`<h3>Zona · passo ${k+1}</h3><p class="sub" style="margin:0">Arrasta a zona no quadro para a mexer. No passo seguinte ela é copiada e desliza se a mexeres.</p>
    <h4>Cor</h4><div class="seg" id="mz-c">${CORES_ZONA.map(([c,n])=>`<button data-c="${c}">${n}</button>`).join("")}</div>
    <h4>Tamanho</h4><div class="seg"><button data-d="w-">Largura −</button><button data-d="w+">Largura +</button><button data-d="h-">Altura −</button><button data-d="h+">Altura +</button></div>
    <div class="actions"><button class="btn danger l" id="mz-del">Apagar zona</button><button class="btn primary" data-close>Fechar</button></div>`,(s,fecha)=>{
    let cor=Z.cor; const pinta=()=>s.querySelectorAll("#mz-c button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.c===cor)));
    s.querySelectorAll("#mz-c button").forEach(b=>b.onclick=()=>{ cor=b.dataset.c; pinta(); editaQ(Q=>{ const z=Q.passos[k].zonas.find(z=>z.id===zid); if(z) z.cor=cor; }); }); pinta();
    s.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>editaQ(Q=>{ const z=Q.passos[k].zonas.find(z=>z.id===zid); if(!z) return; const [d,sg]=[b.dataset.d[0],b.dataset.d[1]], v=sg==="+"?2:-2;
      if(d==="w"){ const nw=mClamp(z.w+v,2,110); z.x-=(nw-z.w)/2; z.w=nw; } else { const nh=mClamp(z.h+v,2,72); z.y-=(nh-z.h)/2; z.h=nh; } }));
    s.querySelector("#mz-del").onclick=()=>{ fecha(); editaQ(Q=>{ Q.passos[k].zonas=Q.passos[k].zonas.filter(z=>z.id!==zid); }); }; }); }
function addPeca(eq){ const k=passoAtual(), Q=qAtual(); if(!Q) return; if(eq==="bola"&&Q.pecas.some(p=>p.eq==="bola")){ toast("Este quadro já tem bola."); return; }
  const id=mId(eq==="adv"?"a":eq==="bola"?"b":"n"), nN=Q.pecas.filter(p=>p.eq===eq).length;
  editaQ(Q=>{ Q.pecas.push({id,eq,pos:eq==="bola"?"":eq==="adv"?String(nN+1):"J"+(nN+1),n:""}); const x=eq==="adv"?62:eq==="bola"?52.5:44, y=34+((nN%5)-2)*3; Q.passos.forEach(P=>P.pos[id]={x,y}); });
  mSel=id; renderModelo(); toast(eq==="bola"?"Bola adicionada ao centro":"Peça adicionada · arrasta-a para o sítio; toca nela para mudar a posição"); }
function trocaSistema(eq,sis){ const k=passoAtual(); editaQ(Q=>{
  if(eq==="adv"){ const ant=Q.pecas.filter(p=>p.eq==="adv").map(p=>p.id); Q.pecas=Q.pecas.filter(p=>p.eq!=="adv"); Q.passos.forEach(P=>ant.forEach(id=>delete P.pos[id])); Q.sisAdv=sis||"";
    if(sis){ const nv=pecasSistema(sis,"adv"); const bola=Q.pecas.filter(p=>p.eq==="bola"); Q.pecas=[...Q.pecas.filter(p=>p.eq!=="bola"),...nv.map(p=>p.pc),...bola]; Q.passos.forEach(P=>nv.forEach(p=>P.pos[p.pc.id]={x:p.x,y:p.y})); } }
  else if(sis==="onze"){ const nos=Q.pecas.filter(p=>p.eq==="nos"), usados=new Set(), noOnze=s=>jogo.onze.some(o=>o.slot===s); Q.sis="onze";
    jogo.onze.forEach(o=>{ let pc=nos.find(p=>p.slot===o.slot&&!usados.has(p.id))||nos.find(p=>!usados.has(p.id)&&!noOnze(p.slot)); const m=onzeM(o);
      if(!pc){ pc={id:mId("n"),eq:"nos",pos:"",n:""}; const bola=Q.pecas.filter(p=>p.eq==="bola"); Q.pecas=[...Q.pecas.filter(p=>p.eq!=="bola"),pc,...bola]; Q.passos.forEach(P=>P.pos[pc.id]={...m}); }
      usados.add(pc.id); pc.slot=o.slot; pc.pos=o.pos||""; pc.n=""; Q.passos[k].pos[pc.id]=m; }); }
  else { const nos=Q.pecas.filter(p=>p.eq==="nos"), base=SISTEMAS[sis]; Q.sis=sis; const sl=slotsPara(base.map(b=>b[0]));
    base.forEach(([pos,x,y],i)=>{ const pc=nos[i]; if(!pc) return; pc.pos=pos; if(!pc.slot&&sl[i]&&!nos.some(p=>p.slot===sl[i])) pc.slot=sl[i]; Q.passos[k].pos[pc.id]={x,y}; }); } }); }
function novoPasso(){ const k=passoAtual(); editaQ(Q=>{ const P=Q.passos[k]; Q.passos.splice(k+1,0,{id:mId("p"),nota:"",pos:clone(P.pos),setas:[],zonas:clone(P.zonas)}); },true); mT_=k+1; mSel=null; renderModelo(); toast(`Passo ${k+2} criado · mexe só o que muda`); }
function moverPasso(d){ const k=passoAtual(), Q=qAtual(), j=k+d; if(!Q||j<0||j>=Q.passos.length) return; editaQ(Q=>{ [Q.passos[k],Q.passos[j]]=[Q.passos[j],Q.passos[k]]; },true); mT_=j; renderModelo(); }
function apagaPasso(k0){ const k=k0!=null?k0:passoAtual(), Q=qAtual(); if(!Q||!Q.passos[k]) return; if(Q.passos.length<2){ toast("O quadro precisa de pelo menos um passo."); return; } mPara();
  editaQ(Q=>{ Q.passos.splice(k,1); },true); mT_=Math.max(0,k-1); mSel=null; renderModelo(); toast(`Passo ${k+1} apagado`,desfazModelo); }
function espelhaQ(Q){ const C=clone(Q), M={DD:"DE",DE:"DD",ED:"EE",EE:"ED",MD:"ME",ME:"MD"}; C.id=mId("q"); C.nome=trocaLado(Q.nome)!==Q.nome?trocaLado(Q.nome):Q.nome+" (espelhado)"; C.ordem=Q.ordem+.5;
  /* o jogador acompanha o lado: quem era DD passa a DE e fica com o lugar do DE do onze */
  const slotDe=pos=>{ const os=jogo.onze.filter(o=>o.pos===pos); return os.length===1?os[0].slot:null; };
  C.pecas.forEach(p=>{ if(!M[p.pos]) return; p.pos=M[p.pos]; if(p.eq==="nos"&&p.slot){ const s=slotDe(p.pos); if(s) p.slot=s; } }); C.passos.forEach(P=>{ P.id=mId("p"); Object.values(P.pos).forEach(p=>p.y=68-p.y); P.setas.forEach(s=>{ s.id=mId("s"); s.y1=68-s.y1; s.y2=68-s.y2; }); P.zonas.forEach(z=>{ z.y=68-z.y-z.h; }); P.nota=trocaPal(P.nota||""); }); return C; }
function moveNaLista(d){ const Q=qAtual(); if(!Q) return; const ls=listaModelos().filter(q=>q.mom===Q.mom&&q.sub===Q.sub), i=ls.findIndex(q=>q.id===Q.id), j=i+d; if(j<0||j>=ls.length) return;
  const A=clone(ls[i]), B=clone(ls[j]); let oa=A.ordem, ob=B.ordem; if(oa===ob){ oa=i; ob=j; } A.ordem=ob; B.ordem=oa; guardaQ(B,true); guardaQ(A); renderModelo(); }

/* ---------- interface ---------- */
let mNotaT=null;
function renderModelo(){ const view=$("view-m"); if(!view||view.hidden) return; const Q=qAtual();
  if(Q) mCur=Q.id; try{ localStorage.setItem("sca-modelo-cur",mCur||""); }catch(e){}
  renderModeloNav(Q); const stage=$("m-stage");
  if(!Q){ if(mPl){ mPl.pause(); mPl=null; } stage.innerHTML=`<div class="m-vazio"><b>Ainda não há quadros do Modelo de Jogo.</b><span>Cada quadro é uma sequência de passos animados: crias o passo 1, copias para o passo 2 e arrastas só o que muda.</span><button class="btn primary" id="m-novo2">+ Criar o primeiro quadro</button></div>`;
    $("m-novo2").onclick=folhaNovoModelo; $("m-tit").textContent="Modelo de Jogo"; $("m-tag").hidden=true; $("m-bar").innerHTML=""; $("m-ebar").hidden=true; $("m-play").innerHTML=""; $("m-panel").innerHTML=`<header><h2>Modelo de Jogo</h2><p class="sub">Quadros animados para os quatro momentos do jogo.</p></header>`; return; }
  mT_=mClamp(mT_,0,Q.passos.length-1);
  if(!mPl||mPl.id!==Q.id||!stage.contains(mPl.svg)){ if(mPl) mPl.pause(); stage.innerHTML="";
    mPl=playerModelo(Q,{ed:()=>({...(mTmp||{}),edit:mEdit}),loop:()=>mLoop,mult:()=>mMult,onT:t=>{ mT_=t; marcaPasso(); },onEnd:()=>renderModeloControlos()});
    stage.appendChild(mPl.svg); ligaEdicao(mPl.svg); } else mPl.setQ(Q);
  stage.classList.toggle("editing",mEdit);
  if(!mPl.playing){ if(mEdit) mT_=Math.round(mT_); mPl.set(mT_); }
  const M=momDe(Q.mom); $("m-tit").textContent=Q.nome; const tg=$("m-tag"); tg.hidden=false; tg.textContent=subNome(Q.mom,Q.sub).toUpperCase(); tg.style.background=M[2];
  $("m-bar").innerHTML=mEdit?`<button class="btn sm" id="m-und" title="Desfazer (Ctrl+Z)"${mUndo.length?"":" disabled"}>↶ Desfazer</button><button class="btn sm dark" id="m-ed">✓ Concluir</button>`:`<button class="btn sm" id="m-rot" title="Mostrar nas bolinhas o número do jogador ou a posição">Nº ⇄ Posição</button><button class="btn sm" id="m-ed">✎ Editar</button><button class="btn sm" id="m-fs" title="Apresentar os quadros do Modelo de Jogo">⛶ Apresentar</button><button class="btn sm" id="m-vid" title="Exportar a animação deste quadro em vídeo MP4">⬇ Vídeo</button>`;
  $("m-ed").onclick=()=>{ mEdit=!mEdit; mSel=null; mTool="mover"; if(mEdit) mPara(); renderModelo(); };
  if($("m-und")) $("m-und").onclick=desfazModelo;
  if($("m-rot")) $("m-rot").onclick=()=>{ const N=trocaRot(Q.id); renderModelo(); toast(N.rot==="num"?"Bolinhas com o número do jogador":"Bolinhas com a posição"); };
  if($("m-fs")) $("m-fs").onclick=()=>{ mPara(); apresentaModelo(Q.id); };
  if($("m-vid")) $("m-vid").onclick=e=>{ mPara(); videoQuadro(Q.id,e.currentTarget); };
  const eb=$("m-ebar"); eb.hidden=!mEdit;
  if(mEdit){ const nP=Q.passos.length; eb.innerHTML=`<b>A editar · passo ${passoAtual()+1}</b><div class="seg" id="m-tool"><button data-k="mover">✥ Mover</button><button data-k="seta">↗ Seta</button><button data-k="zona">▭ Zona</button></div>
      <div class="seg" id="m-sub"></div>${nP>1?`<button class="btn sm danger" id="m-ap">🗑 Apagar passo ${passoAtual()+1}</button>`:""}`;
    if($("m-ap")) confirma2($("m-ap"),"Toca outra vez para apagar",()=>apagaPasso());
    eb.querySelectorAll("#m-tool button").forEach(b=>{ b.setAttribute("aria-pressed",String(b.dataset.k===mTool)); b.onclick=()=>{ mTool=b.dataset.k; renderModelo(); }; });
    const sb=eb.querySelector("#m-sub");
    if(mTool==="seta"){ sb.innerHTML=Object.entries(SETA_T).map(([k,v])=>`<button data-k="${k}" aria-pressed="${k===mSetaT}"><i style="display:inline-block;width:18px;height:4px;background:${v[1]};border:1px solid #0003;vertical-align:middle;margin-right:5px"></i>${v[0]}</button>`).join(""); sb.querySelectorAll("button").forEach(b=>b.onclick=()=>{ mSetaT=b.dataset.k; renderModelo(); }); }
    else if(mTool==="zona"){ sb.innerHTML=CORES_ZONA.map(([c,n])=>`<button data-c="${c}" aria-pressed="${c===mZonaCor}"><i style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${c};border:1px solid #0004;vertical-align:-1px;margin-right:5px"></i>${n}</button>`).join(""); sb.querySelectorAll("button").forEach(b=>b.onclick=()=>{ mZonaCor=b.dataset.c; renderModelo(); }); }
    else sb.hidden=true; }
  renderModeloControlos(); renderModeloPainel(Q); }
function renderModeloNav(Q){ const nav=$("m-nav"), ls=listaModelos(); let h=`<button class="newl" id="m-novo">+ Novo quadro</button>`;
  MOMENTOS.forEach(([mk,mn,cor,subs])=>{ const q=ls.filter(x=>x.mom===mk); h+=`<div class="grp"><h3><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cor};margin-right:6px"></i>${mn}</h3><ul>`;
    if(!q.length) h+=`<li><span class="m-nada">Sem quadros</span></li>`;
    q.forEach((x,i)=>{ h+=`<li><button data-id="${esc(x.id)}" aria-current="${Q&&x.id===Q.id}"><span class="n">${i+1}</span><span class="m-nm">${esc(x.nome)}<small>${esc(subNome(x.mom,x.sub))} · ${x.passos.length} ${x.passos.length===1?"passo":"passos"}</small></span></button></li>`; });
    h+=`</ul></div>`; });
  nav.innerHTML=h; $("m-novo").onclick=folhaNovoModelo;
  nav.querySelectorAll("button[data-id]").forEach(b=>{ b.onclick=()=>{ if(b.dataset.id===mCur) return; mPara(); mCur=b.dataset.id; mT_=0; mSel=null; mUndo=mUndo.filter(u=>u.id===mCur); renderModelo(); };
    b.oncontextmenu=e=>{ const Q=modelos[b.dataset.id]; if(Q) menuContexto(e,[[`🗑 Apagar quadro “${Q.nome}”`,()=>apagaQuadro(Q.id),"perigo"]]); }; }); }
function marcaPasso(){ const Q=qAtual(); if(!Q) return; const pv=passoVisivel(Q,mT_); document.querySelectorAll("#m-play .mpasso").forEach((b,i)=>b.setAttribute("aria-current",String(i===pv)));
  document.querySelectorAll("#m-panel ol.rows li").forEach((li,i)=>li.classList.toggle("here",i===pv)); }
function renderModeloControlos(){ const Q=qAtual(), box=$("m-play"); if(!Q||!box) return; const n=Q.passos.length, pl=mPl&&mPl.playing;
  box.innerHTML=`<button class="btn sm" id="mp-ini" title="Início" aria-label="Voltar ao passo 1">⏮</button><button class="btn sm primary" id="mp-pl" style="min-width:96px">${pl?"⏸ Pausa":"▶ Animar"}</button>
    <div class="mpassos">${Q.passos.map((_,i)=>`<button class="mpasso" data-i="${i}" aria-label="Passo ${i+1}">${i+1}</button>`).join("")}${mEdit?`<button class="mpasso mmais" id="mp-add" title="Novo passo: copia o atual">+ Passo</button>`:""}</div>
    <span class="msp"></span><div class="seg mvel" id="mp-v">${[[.5,"0,5×"],[1,"1×"],[1.5,"1,5×"]].map(([v,t])=>`<button data-v="${v}" aria-pressed="${v===mMult}">${t}</button>`).join("")}</div>
    <button class="btn sm" id="mp-loop" aria-pressed="${mLoop}" title="Repetir em ciclo">🔁</button>`;
  box.querySelector("#mp-ini").onclick=()=>{ mPara(); mT_=0; mPl.set(0); renderModelo(); };
  box.querySelector("#mp-pl").onclick=()=>{ if(mPl.playing){ mPl.pause(); mT_=mPl.t; } else { if(mEdit){ mSel=null; } const from=mT_>=n-1-1e-6?0:mT_; mPl.play(from); } renderModeloControlos(); };
  box.querySelectorAll(".mpasso[data-i]").forEach(b=>{ b.onclick=()=>{ mPara(); mT_=+b.dataset.i; mSel=null; mPl.set(mT_); renderModelo(); }; b.oncontextmenu=e=>menuPasso(e,+b.dataset.i); });
  if(box.querySelector("#mp-add")) box.querySelector("#mp-add").onclick=()=>{ mPara(); novoPasso(); };
  box.querySelectorAll("#mp-v button").forEach(b=>b.onclick=()=>{ const was=mPl.playing; if(was) mPl.pause(); mMult=+b.dataset.v; if(was) mPl.play(mPl.t); renderModeloControlos(); });
  box.querySelector("#mp-loop").onclick=()=>{ mLoop=!mLoop; renderModeloControlos(); };
  marcaPasso(); }
function renderModeloPainel(Q){ const pn=$("m-panel"), k=passoAtual(), M=momDe(Q.mom), adv=Q.pecas.some(p=>p.eq==="adv"), dur=mDur(Q);
  if(!mEdit){ pn.innerHTML=`<header><h2>Passos</h2><p class="sub">${esc(M[1])} · ${esc(subNome(Q.mom,Q.sub))} · SCA ${Q.sis==="onze"?"(onze do jogo)":esc(Q.sis||"")}${adv?" vs "+esc(Q.sisAdv||"adversário"):""} · ${Math.round(dur)} s</p></header>
      <ol class="rows">${Q.passos.map((P,i)=>`<li data-i="${i}" class="${i===passoVisivel(Q,mT_)?"here":""}" style="cursor:pointer;grid-template-columns:26px 1fr auto"><span class="ix">${i+1}</span><div style="font-size:14.5px;white-space:pre-wrap">${P.nota?esc(P.nota):`<span style="color:var(--muted)">Sem texto</span>`}</div>${Q.passos.length>1?`<button class="btn sm ghost m-xp" data-i="${i}" aria-label="Apagar passo ${i+1}" style="min-width:44px">✕</button>`:"<span></span>"}</li>`).join("")}</ol>
      <p class="sub" style="padding:0 14px 6px">Toca num passo para o ver parado, ou em <b>▶ Animar</b>. <b>Toca num jogador</b> para o trocar, como nas bolas paradas. Para a TV, escolhe <b>Modelo de Jogo</b> em <b>📺 TV</b>.</p>
      <div class="add"><h3>Trocas neste quadro</h3>${Q.trocas.length?`<ul class="evl">${Q.trocas.map(t=>`<li><span style="flex:1">↓ ${esc(rot(t.sai))}  ↑ ${esc(rot(t.entra))}</span><button class="icon x" data-t="${esc(t.id)}" aria-label="Apagar troca">✕</button></li>`).join("")}</ul>
        <button class="btn sm" id="mt-rep">Repor o onze do jogo</button>`:`<p class="sub" style="margin:0">Sem trocas: o quadro mostra o onze do separador Jogo.</p>`}</div>`;
    pn.querySelectorAll("li[data-i]").forEach(li=>{ li.onclick=()=>{ mPara(); mT_=+li.dataset.i; mPl.set(mT_); renderModelo(); }; li.oncontextmenu=e=>menuPasso(e,+li.dataset.i); });
    /* ✕ apaga o passo com 2 toques; o toque não chega à linha (que escolheria o passo) */
    pn.querySelectorAll(".m-xp").forEach(b=>{ b.addEventListener("click",e=>e.stopPropagation()); confirma2(b,"Apagar?",()=>apagaPasso(+b.dataset.i)); });
    pn.querySelectorAll("button[data-t]").forEach(b=>b.onclick=()=>editaQ(Q=>{ Q.trocas=Q.trocas.filter(t=>t.id!==b.dataset.t); }));
    if(pn.querySelector("#mt-rep")) confirma2(pn.querySelector("#mt-rep"),"Toca outra vez para tirar as trocas",()=>editaQ(Q=>{ Q.trocas=[]; })); return; }
  const P=Q.passos[k], idxL=listaModelos().filter(q=>q.mom===Q.mom&&q.sub===Q.sub), iL=idxL.findIndex(q=>q.id===Q.id);
  pn.innerHTML=`<header><h2>Passo ${k+1} de ${Q.passos.length}</h2><p class="sub">Arrasta os jogadores para a posição deste passo. A animação liga cada passo ao seguinte.</p></header>
    <div class="add" style="border-top:0">
      <label class="f">Texto do passo (aparece ao lado do campo)<textarea id="me-nota" rows="3" style="border:1px solid var(--line);border-radius:8px;padding:8px 10px;font:inherit;background:var(--surface);color:var(--ink);resize:vertical">${esc(P.nota||"")}</textarea></label>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm primary" id="me-np">+ Passo seguinte</button><button class="btn sm" id="me-pe" ${k?"":"disabled"} aria-label="Mover passo para trás">◀</button><button class="btn sm" id="me-pd" ${k<Q.passos.length-1?"":"disabled"} aria-label="Mover passo para a frente">▶</button><button class="btn sm danger" id="me-ap">Apagar passo</button></div>
      <h3>Peças</h3>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" id="me-an">+ Jogador SCA</button><button class="btn sm" id="me-aa">+ Adversário</button><button class="btn sm" id="me-ab"${Q.pecas.some(p=>p.eq==="bola")?" disabled":""}>+ Bola</button></div>
      <div class="fields"><label class="f">Sistema SCA (passo atual)<select id="me-sis">${SIS_NOS.map(([k,n])=>`<option value="${k}"${k===Q.sis?" selected":""}>${n}</option>`).join("")}</select></label>
      <label class="f">Equipa adversária<select id="me-adv"><option value="">Sem adversário</option>${Object.keys(SISTEMAS).map(s=>`<option${adv&&s===Q.sisAdv?" selected":""}>${s}</option>`).join("")}</select></label></div>
      <button class="btn sm" id="me-onze">↺ Pôr o onze do jogo neste passo</button>
      <h3>Mostrar</h3>
      <div class="seg" id="me-rot"><button data-k="num">Número na bolinha</button><button data-k="pos">Posição na bolinha</button></div>
      <div class="picks"><label><input type="checkbox" id="me-nm"${Q.nomes?" checked":""}> Nomes por baixo</label><label><input type="checkbox" id="me-au"${Q.auto?" checked":""}> Setas automáticas do movimento</label></div>
      <div class="fields"><label class="f">Movimento entre passos<select id="me-vel">${[.6,.8,1,1.2,1.5,2,2.5,3].map(v=>`<option value="${v}"${v===Q.vel?" selected":""}>${String(v).replace(".",",")} s</option>`).join("")}</select></label>
      <label class="f">Pausa em cada passo<select id="me-pau">${[.5,.8,1,1.2,1.5,2,3,4].map(v=>`<option value="${v}"${v===Q.pausa?" selected":""}>${String(v).replace(".",",")} s</option>`).join("")}</select></label></div>
      <h3>Quadro</h3>
      <label class="f">Nome<input type="text" id="me-nome" value="${esc(Q.nome)}"></label>
      <div class="fields"><label class="f">Momento<select id="me-mom">${MOMENTOS.map(m=>`<option value="${m[0]}"${m[0]===Q.mom?" selected":""}>${m[1]}</option>`).join("")}</select></label>
      <label class="f">Subfase<select id="me-sub">${M[3].map(s=>`<option value="${s[0]}"${s[0]===Q.sub?" selected":""}>${s[1]}</option>`).join("")}</select></label></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" id="me-up" ${iL>0?"":"disabled"}>▲ Subir na lista</button><button class="btn sm" id="me-dn" ${iL<idxL.length-1?"":"disabled"}>▼ Descer</button><button class="btn sm" id="me-dup">⧉ Duplicar</button><button class="btn sm" id="me-esp">⇅ Duplicar espelhado</button></div>
      <button class="btn danger" id="me-del">Apagar este quadro</button>
    </div>`;
  const nota=pn.querySelector("#me-nota"); nota.oninput=()=>{ clearTimeout(mNotaT); const v=nota.value; mNotaT=setTimeout(()=>{ editaQ(Q=>{ Q.passos[k].nota=v; },true); mPl.setQ(qAtual()); mPl.set(k); },500); };
  pn.querySelector("#me-np").onclick=novoPasso; pn.querySelector("#me-pe").onclick=()=>moverPasso(-1); pn.querySelector("#me-pd").onclick=()=>moverPasso(1);
  confirma2(pn.querySelector("#me-ap"),"Toca outra vez",()=>apagaPasso());
  pn.querySelector("#me-an").onclick=()=>addPeca("nos"); pn.querySelector("#me-aa").onclick=()=>addPeca("adv"); pn.querySelector("#me-ab").onclick=()=>addPeca("bola");
  pn.querySelector("#me-sis").onchange=e=>trocaSistema("nos",e.target.value); pn.querySelector("#me-adv").onchange=e=>trocaSistema("adv",e.target.value);
  pn.querySelector("#me-onze").onclick=()=>{ trocaSistema("nos","onze"); toast(`Onze do jogo no passo ${k+1} · Ctrl+Z para desfazer`); };
  pn.querySelectorAll("#me-rot button").forEach(b=>{ b.setAttribute("aria-pressed",String(b.dataset.k===Q.rot)); b.onclick=()=>editaQ(Q=>{ Q.rot=b.dataset.k; }); });
  pn.querySelector("#me-nm").onchange=e=>editaQ(Q=>{ Q.nomes=e.target.checked; }); pn.querySelector("#me-au").onchange=e=>editaQ(Q=>{ Q.auto=e.target.checked; });
  pn.querySelector("#me-vel").onchange=e=>editaQ(Q=>{ Q.vel=+e.target.value; }); pn.querySelector("#me-pau").onchange=e=>editaQ(Q=>{ Q.pausa=+e.target.value; });
  const nm=pn.querySelector("#me-nome"); nm.onchange=()=>{ const v=nm.value.trim(); if(v) editaQ(Q=>{ Q.nome=v; }); };
  pn.querySelector("#me-mom").onchange=e=>editaQ(Q=>{ Q.mom=e.target.value; Q.sub=momDe(Q.mom)[3][0][0]; Q.ordem=Date.now(); });
  pn.querySelector("#me-sub").onchange=e=>editaQ(Q=>{ Q.sub=e.target.value; Q.ordem=Date.now(); });
  pn.querySelector("#me-up").onclick=()=>moveNaLista(-1); pn.querySelector("#me-dn").onclick=()=>moveNaLista(1);
  pn.querySelector("#me-dup").onclick=()=>{ const C=clone(Q); C.id=mId("q"); C.nome=Q.nome+" (cópia)"; C.ordem=Q.ordem+.5; C.passos.forEach(P=>P.id=mId("p")); const N=guardaQ(C); mCur=N.id; mT_=0; renderModelo(); toast("Quadro duplicado"); };
  pn.querySelector("#me-esp").onclick=()=>{ const N=guardaQ(espelhaQ(Q)); mCur=N.id; mT_=0; renderModelo(); toast("Quadro espelhado criado (corredor contrário)"); };
  confirma2(pn.querySelector("#me-del"),"Toca outra vez para apagar o quadro",()=>apagaQuadro(Q.id)); }
function apagaQuadro(id){ const Q=modelos[id]; if(!Q) return; mPara(); pushMUndo(id); delete modelos[id]; apagaDoc("modelo/"+id); guardaModLocal();
  if(mCur===id){ mCur=null; mEdit=false; mT_=0; } renderModelo(); toast(`Quadro “${Q.nome}” apagado`,desfazModelo); }
/* menu do botão direito do rato (PC): o clique na opção é a confirmação */
function menuContexto(e,itens){ e.preventDefault(); fechaMenuContexto(); const m=document.createElement("div"); m.className="mmenu"; m.setAttribute("role","menu");
  itens.forEach(([txt,acao,cls])=>{ const b=document.createElement("button"); b.setAttribute("role","menuitem"); b.textContent=txt; if(cls) b.className=cls; b.onclick=()=>{ fechaMenuContexto(); acao(); }; m.appendChild(b); });
  document.body.appendChild(m); const r=m.getBoundingClientRect(); m.style.left=Math.min(e.clientX,innerWidth-r.width-8)+"px"; m.style.top=Math.min(e.clientY,innerHeight-r.height-8)+"px";
  document.addEventListener("pointerdown",foraMenu,true); document.addEventListener("keydown",escMenu,true); addEventListener("scroll",fechaMenuContexto,true); }
function foraMenu(e){ if(!e.target.closest(".mmenu")) fechaMenuContexto(); }
function escMenu(e){ if(e.key==="Escape"){ e.stopPropagation(); fechaMenuContexto(); } }
function fechaMenuContexto(){ document.querySelectorAll(".mmenu").forEach(m=>m.remove()); document.removeEventListener("pointerdown",foraMenu,true); document.removeEventListener("keydown",escMenu,true); removeEventListener("scroll",fechaMenuContexto,true); }
function menuPasso(e,i){ const Q=qAtual(); if(!Q) return; if(Q.passos.length<2){ e.preventDefault(); toast("O quadro precisa de pelo menos um passo."); return; }
  menuContexto(e,[[`🗑 Apagar passo ${i+1}`,()=>apagaPasso(i),"perigo"]]); }

/* ---------- vídeo de um quadro ---------- */
async function videoQuadro(id,btn){ if(btn) btn.disabled=true;
  try{ await exportaVideo(itensModeloTV([id]),0,m=>toast(m)); }catch(err){ if(err?.code!=="declined") toast("Não foi possível gerar o vídeo ("+(err?.code||err?.message||"erro")+")."); }
  finally{ if(btn) btn.disabled=false; } }

/* ---------- apresentar (como nas bolas paradas: avanças tu, quadro a quadro) ---------- */
let mApr=null;
function apresentaModelo(id0){ const ls=listaModelos(); if(!ls.length){ toast("Ainda não há quadros do Modelo de Jogo."); return; } mPara(); if(mApr) mApr.fecha();
  let i=Math.max(0,ls.findIndex(q=>q.id===(id0||mCur))), pl=null;
  const root=document.createElement("div"); root.className="present"; root.setAttribute("role","dialog"); root.setAttribute("aria-label","Apresentação do Modelo de Jogo");
  root.innerHTML=`<div class="pstage"></div><div class="pbar"><button id="ma-a">‹ Anterior</button><button id="ma-ini" aria-label="Voltar ao passo 1">⏮</button><button id="ma-pl" style="min-width:120px">▶ Animar</button><div class="t"></div><button id="ma-rot" title="Mostrar nas bolinhas o número do jogador ou a posição">Nº ⇄ Posição</button><button id="ma-v">⬇ Vídeo</button><button id="ma-b">Seguinte ›</button><button id="ma-x">Fechar</button></div>`;
  document.body.appendChild(root); const st=root.querySelector(".pstage"), tt=root.querySelector(".t"), bp=root.querySelector("#ma-pl");
  const estado=()=>{ const Q=modelos[ls[i].id]||ls[i]; bp.textContent=pl&&pl.playing?"⏸ Pausa":"▶ Animar"; tt.textContent=`${i+1}/${ls.length} · ${Q.nome} · passo ${passoVisivel(Q,pl?pl.t:0)+1}/${Q.passos.length}`; };
  const mostra=()=>{ if(pl) pl.pause(); const Q=modelos[ls[i].id]||ls[i]; st.innerHTML=""; pl=playerModelo(Q,{onT:estado,onEnd:estado}); st.appendChild(pl.svg); estado(); };
  const anda=d=>{ i=(i+d+ls.length)%ls.length; mostra(); };
  const animar=()=>{ if(pl.playing) pl.pause(); else pl.play(pl.t>=(modelos[ls[i].id]||ls[i]).passos.length-1-1e-6?0:pl.t); estado(); };
  const kd=e=>{ if($("sheet-root").innerHTML) return; if(e.key==="Escape") fecha(); else if(e.key==="ArrowRight"){ e.preventDefault(); anda(1); } else if(e.key==="ArrowLeft"){ e.preventDefault(); anda(-1); } else if(e.key===" "){ e.preventDefault(); animar(); } };
  const fecha=()=>{ if(pl) pl.pause(); root.remove(); document.removeEventListener("keydown",kd); mApr=null; };
  document.addEventListener("keydown",kd);
  root.querySelector("#ma-a").onclick=()=>anda(-1); root.querySelector("#ma-b").onclick=()=>anda(1); root.querySelector("#ma-x").onclick=fecha;
  root.querySelector("#ma-ini").onclick=()=>{ pl.pause(); pl.set(0); estado(); }; bp.onclick=animar;
  root.querySelector("#ma-rot").onclick=()=>{ const N=trocaRot(ls[i].id); pl.setQ(N); if(!pl.playing) pl.set(pl.t); renderModeloSeguro(); };
  root.querySelector("#ma-v").onclick=e=>{ pl.pause(); estado(); videoQuadro(ls[i].id,e.currentTarget); };
  /* iPad: deslizar muda de quadro; um toque anima ou pausa */
  let x0=null; st.addEventListener("touchstart",e=>{ x0=e.touches[0].clientX; },{passive:true});
  st.addEventListener("touchend",e=>{ if(x0===null) return; const dx=e.changedTouches[0].clientX-x0; x0=null; if(Math.abs(dx)>50){ anda(dx<0?1:-1); e.preventDefault(); } });
  st.addEventListener("click",()=>animar());
  mApr={fecha}; mostra(); }

/* dados de fora (onze, plantel) mudaram: atualizar sem estragar o que se está a escrever ou a arrastar */
function renderModeloSeguro(){ const v=$("view-m"); if(!v||v.hidden||mDrag) return; const a=document.activeElement; if(a&&a.closest&&a.closest("#m-panel")) return;
  if(mPl&&mPl.playing){ const Q=qAtual(); if(Q) mPl.setQ(Q); return; } renderModelo(); }

document.addEventListener("keydown",e=>{ const v=$("view-m"); if(!v||v.hidden||$("sheet-root").innerHTML||document.querySelector(".tv")||mApr) return; const t=e.target.tagName||""; if(/INPUT|TEXTAREA|SELECT/.test(t)||e.target.isContentEditable) return;
  if((e.ctrlKey||e.metaKey)&&(e.key==="z"||e.key==="Z")){ e.preventDefault(); if(mEdit||mUndo.length) desfazModelo(); return; }
  const Q=qAtual(); if(!Q||!mPl) return;
  if(e.key===" "){ e.preventDefault(); $("mp-pl")&&$("mp-pl").click(); }
  else if(e.key==="ArrowRight"||e.key==="ArrowLeft"){ e.preventDefault(); mPara(); mT_=mClamp(Math.round(mT_)+(e.key==="ArrowRight"?1:-1),0,Q.passos.length-1); mPl.set(mT_); renderModelo(); }
  else if((e.key==="Delete"||e.key==="Backspace")&&mEdit&&mSel){ e.preventDefault(); const id=mSel; mSel=null; editaQ(Q=>{ Q.pecas=Q.pecas.filter(p=>p.id!==id); Q.passos.forEach(P=>delete P.pos[id]); }); } });

/* ---------- sincronização ---------- */
function ligaModeloDb(){ if(!db) return; db.collection("modelo").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
    q.docs.forEach(d=>{ const x=d.data(); if(x){ const c={...x}; delete c.atualizadoEm; try{ m[d.id]=normQ({...c,id:d.id}); }catch(e){} } });
    mergeCol("modelo/",m,modelos); if(JSON.stringify(m)!==JSON.stringify(modelos)){ modelos=m; guardaModLocal(); if(!mDrag&&!(mPl&&mPl.playing)&&!(document.activeElement&&document.activeElement.id==="me-nota")) renderModelo(); } },()=>{}); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaModeloDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();

