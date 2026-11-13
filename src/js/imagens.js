/* ---------- Imagens do Pós-jogo (v114, Entrega 1A) ----------
   imagens/{id} = { id, jogo: "atual" | <id do jogo arquivado>, titulo, desc, rid (registo do Pós-jogo), parte, seg (segundos dentro da parte),
     js: [nº], princ: {p, s[]} | null, img: {id, w, h} (print no armazenamento de imagens do link), crop: {x, y, w, h} (frações) | null,
     escuro (0–0,8: escurecer à volta das luzes), pecas: [...], criadoPor, criadoEm, alteradoPor, alteradoEm }
   Peças: um só «material» por tipo, com propriedades (cor, tamanho, traço, pontas, preenchimento…) — decidido pelo Rodrigo (12/11/2026).
   Coordenadas em frações da imagem (x da largura, y da altura); tamanhos em frações da largura.
   Só servem os relatórios pós-jogo (não entram na biblioteca do Modelo). Ao arquivar o jogo, as do jogo atual passam para o arquivo. */
const IM_LS="sca-imagens-v1";
let imagens={}; try{ imagens=JSON.parse(localStorage.getItem(IM_LS)||"{}")||{}; }catch(e){ imagens={}; }
const IM_CORES=[["#FFD400","Amarelo"],["#E00000","Vermelho"],["#1E9E4A","Verde"],["#1F6FE0","Azul"],["#FFFFFF","Branco"],["#111111","Preto"],["#F7841E","Laranja"],["#8E44AD","Roxo"]];
const IM_TRACO=[["cheio","Cheio"],["trac","Tracejado"],["pontos","Pontos"]];
const IM_FERR=[["mover","✥ Mover"],["seta","↗ Seta"],["circ","◯ Círculo"],["lig","🔗 Ligação"],["luz","🔦 Luz"],["zona","▱ Zona"],["txt","T Texto"],["num","① Nº"],["marca","✗✓ Marca"],["livre","✎ Caneta"],["cal","📐 Campo"],["crop","⛶ Recortar"]];
/* v114.2 · perspetiva: o Rodrigo encosta 4 pegas aos cantos de um retângulo marcado na relva; [nome, lado de cima (1→2) em m, lado 2→3 em m] */
const IM_REF={ga:["Grande área",16.5,40.3],pa:["Pequena área",5.5,18.3],meio:["Meio-campo",52.5,68],campo:["Campo inteiro",105,68],olho:["A olho (quadrado)",10,10]};
const imNum=(v,d,a,b)=>{ const n=+v; return isFinite(n)?Math.min(b,Math.max(a,n)):d; }, imCor=c=>/^#[0-9A-Fa-f]{6}$/.test(c||"")?c:"#FFD400";
/* homografia de 4 pontos a[i] → b[i] (h33 = 1), por eliminação de Gauss; null se os pontos estiverem alinhados */
function imHomog(a,b){ const A=[],B=[]; for(let i=0;i<4;i++){ const [x,y]=a[i],[u,v]=b[i]; A.push([x,y,1,0,0,0,-u*x,-u*y]); B.push(u); A.push([0,0,0,x,y,1,-v*x,-v*y]); B.push(v); }
  for(let c=0;c<8;c++){ let m=c; for(let r=c+1;r<8;r++) if(Math.abs(A[r][c])>Math.abs(A[m][c])) m=r; [A[c],A[m]]=[A[m],A[c]]; [B[c],B[m]]=[B[m],B[c]]; const d=A[c][c]; if(Math.abs(d)<1e-12) return null;
    for(let r=0;r<8;r++){ if(r===c) continue; const k=A[r][c]/d; if(!k) continue; for(let j=c;j<8;j++) A[r][j]-=k*A[c][j]; B[r]-=k*B[c]; } }
  return [...B.map((v,i)=>v/A[i][i]),1]; }
const imAplicaW=(h,q)=>{ const w=h[6]*q[0]+h[7]*q[1]+h[8]; return [(h[0]*q[0]+h[1]*q[1]+h[2])/w,(h[3]*q[0]+h[4]*q[1]+h[5])/w,w]; };
const imAplica=(h,q)=>imAplicaW(h,q).slice(0,2);
/* K = {H: chão (m) → imagem (frações), Hi: imagem → chão, A, B} da calibração da imagem; null sem calibração */
let imKc={k:"",v:null};
function imK(I){ if(!I||!I.cal) return null; const key=JSON.stringify(I.cal); if(imKc.k===key) return imKc.v;
  const r=IM_REF[I.cal.ref]||IM_REF.ga, [A,B]=I.cal.rod?[r[2],r[1]]:[r[1],r[2]], G=[[0,0],[A,0],[A,B],[0,B]], H=imHomog(G,I.cal.pts), Hi=imHomog(I.cal.pts,G);
  imKc={k:key,v:H&&Hi?{H,Hi,A,B}:null}; return imKc.v; }
/* círculo (ou elipse a×b) deitado na relva à volta do ponto (x, y) da imagem, em px; null se a perspetiva não der */
function imCircChao(K,x,y,a,b,W,H){ const g=imAplica(K.Hi,[x,y]), out=[];
  for(let k=0;k<40;k++){ const t=k/40*2*Math.PI, q=imAplicaW(K.H,[g[0]+a*Math.cos(t),g[1]+b*Math.sin(t)]); if(!(q[2]>0)||!isFinite(q[0])||Math.abs(q[0])>4||Math.abs(q[1])>4) return null; out.push([q[0]*W,q[1]*H]); }
  return out; }
function normPecaIm(p){ if(!p||typeof p!=="object") return null; const f=v=>imNum(v,.5,-.5,1.5), s=v=>String(v??""), tr=IM_TRACO.some(x=>x[0]===p.tr)||p.tr==="onda"?p.tr:"cheio";
  const b={t:p.t,c:imCor(p.c),w:imNum(p.w,1,.3,4),tr,...(/^[\w-]{1,24}$/.test(p.pk||"")?{pk:p.pk}:{})}, chao=p.chao?{chao:true}:{};
  if(p.t==="seta") return {...b,x1:f(p.x1),y1:f(p.y1),x2:f(p.x2),y2:f(p.y2),...(p.qx!=null?{qx:f(p.qx),qy:f(p.qy)}:{}),pt:["fim","duas","nenhuma"].includes(p.pt)?p.pt:"fim"};
  if(p.t==="circ") return {...b,x:f(p.x),y:f(p.y),rx:imNum(p.rx,.04,.005,.6),ry:imNum(p.ry,.015,.003,.6),op:imNum(p.op,.15,0,.8),...(p.chao?{chao:true,m:imNum(p.m,1.2,.2,20)}:{})};
  if(p.t==="lig"){ const pts=(Array.isArray(p.pts)?p.pts:[]).map(q=>[f(q[0]),f(q[1])]).slice(0,12); return pts.length?{...b,pts,op:imNum(p.op,.2,0,.8),rx:imNum(p.rx,.03,.005,.2),...(p.chao?{chao:true,m:imNum(p.m,1.2,.2,20)}:{})}:null; }
  if(p.t==="luz") return {...b,x:f(p.x),y:f(p.y),rx:imNum(p.rx,.035,.005,.4),alt:imNum(p.alt,3.2,0,10),op:imNum(p.op,.5,.05,.9)};
  if(p.t==="zona"){ const pts=Array.isArray(p.pts)&&p.pts.length===4?p.pts.map(q=>[f(q[0]),f(q[1])]):null;
    return {...b,f:p.f==="elip"?"elip":"poli",...(p.f==="elip"?{x:f(p.x),y:f(p.y),rx:imNum(p.rx,.08,.005,.8),ry:imNum(p.ry,.05,.003,.8),...(p.chao?{a:imNum(p.a,4,.3,80),b:imNum(p.b,3,.3,80)}:{})}:{pts:pts||[[.4,.4],[.6,.4],[.6,.6],[.4,.6]]}),op:imNum(p.op,.3,0,.8),risc:!!p.risc,...chao}; }
  if(p.t==="txt") return {...b,x:f(p.x),y:f(p.y),s:s(p.s).slice(0,80)||"Texto",tam:imNum(p.tam,1,.4,4)};
  if(p.t==="num") return {...b,x:f(p.x),y:f(p.y),n:s(p.n).slice(0,3)||"1",tam:imNum(p.tam,1,.4,4)};
  if(p.t==="marca") return {...b,x:f(p.x),y:f(p.y),k:p.k==="ok"?"ok":"x",tam:imNum(p.tam,1,.4,4)};
  if(p.t==="livre"){ const pts=(Array.isArray(p.pts)?p.pts:[]).map(q=>[f(q[0]),f(q[1])]).slice(0,600); return pts.length>1?{...b,pts}:null; }
  return null; }
const normCalIm=c=>c&&Array.isArray(c.pts)&&c.pts.length===4?{pts:c.pts.map(q=>[imNum(q&&q[0],.5,-.5,1.5),imNum(q&&q[1],.5,-.5,1.5)]),ref:IM_REF[c.ref]?c.ref:"ga",rod:!!c.rod}:null;
function normImagem(d){ const s=v=>String(v??"").trim(), im=d.img||{};
  const cr=d.crop&&isFinite(+d.crop.w)&&+d.crop.w>.02&&+d.crop.h>.02?{x:imNum(d.crop.x,0,0,1),y:imNum(d.crop.y,0,0,1),w:imNum(d.crop.w,1,.02,1),h:imNum(d.crop.h,1,.02,1)}:null;
  return {id:s(d.id)||uId("im"),jogo:s(d.jogo)||"atual",titulo:s(d.titulo).slice(0,120),desc:String(d.desc??"").slice(0,2000),rid:s(d.rid),parte:d.parte===2||d.parte==="2"?2:1,seg:Math.max(0,Math.round(+d.seg)||0),temT:!!d.temT,
    js:[...new Set((Array.isArray(d.js)?d.js:[]).map(s).filter(Boolean))].slice(0,22),princ:d.princ&&d.princ.p?{p:s(d.princ.p),s:(Array.isArray(d.princ.s)?d.princ.s:[]).map(s).filter(Boolean).slice(0,3)}:null,
    img:/^[\w-]{8,64}$/.test(s(im.id))?{id:s(im.id),w:Math.round(+im.w)||1600,h:Math.round(+im.h)||900}:null,crop:cr,escuro:imNum(d.escuro,0,0,.8),
    cal:normCalIm(d.cal),
    pecas:(Array.isArray(d.pecas)?d.pecas:[]).map(normPecaIm).filter(Boolean).slice(0,300),
    criadoPor:s(d.criadoPor),criadoEm:s(d.criadoEm),alteradoPor:s(d.alteradoPor),alteradoEm:s(d.alteradoEm)}; }
Object.keys(imagens).forEach(id=>{ try{ imagens[id]=normImagem({...imagens[id],id}); }catch(e){ delete imagens[id]; } });
const guardaImagensLocal=()=>{ try{ localStorage.setItem(IM_LS,JSON.stringify(imagens)); }catch(e){} };
function gravaImagem(I){ const N=normImagem({...I,alteradoPor:meuId||I.alteradoPor||"",alteradoEm:new Date().toISOString()}); imagens[N.id]=N; guardaImagensLocal(); gravaDoc("imagens/"+N.id,N); return N; }
function apagaImagem(id){ if(!imagens[id]) return; delete imagens[id]; guardaImagensLocal(); apagaDoc("imagens/"+id); }
const imagensDe=jg=>Object.values(imagens).filter(I=>I.jogo===jg).sort((a,b)=>(a.temT?0:1)-(b.temT?0:1)||a.parte-b.parte||a.seg-b.seg||a.criadoEm.localeCompare(b.criadoEm));
/* ao arquivar o jogo, as imagens do jogo em curso passam para o jogo arquivado */
function arquivaImagens(id){ Object.values(imagens).filter(I=>I.jogo==="atual").forEach(I=>gravaImagem({...I,jogo:id})); }
function repoeImagens(B){ if(!B.imagens) return; Object.keys(imagens).forEach(id=>{ if(!B.imagens[id]) apagaDoc("imagens/"+id); }); imagens={};
  Object.entries(B.imagens).forEach(([id,x])=>{ try{ imagens[id]=normImagem({...x,id}); gravaDoc("imagens/"+id,imagens[id]); }catch(e){} }); guardaImagensLocal(); }
function ligaImagensDb(){ if(!db) return; db.collection("imagens").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
  q.docs.forEach(d=>{ const x=lerDoc(d); if(x){ delete x.atualizadoEm; try{ m[d.id]=normImagem({...x,id:d.id}); }catch(e){} } });
  mergeCol("imagens/",m,imagens); if(JSON.stringify(m)!==JSON.stringify(imagens)){ imagens=m; guardaImagensLocal(); if(!imEd&&!$("view-a").hidden&&anVista==="img") renderImagens(); } },()=>{}); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaImagensDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();

/* ---------- jogo: lances, jogadores, vídeo ---------- */
const imJogoG=jg=>jg==="atual"?null:hist[jg]||null;
const imRegs=jg=>{ const G=imJogoG(jg); return ((jg==="atual"?an.regs:(G&&G.analise&&G.analise.regs))||[]).slice().sort((a,b)=>a.parte-b.parte||a.seg-b.seg); };
function imJogadores(jg){ const G=imJogoG(jg);
  if(!G){ const ns=[...new Set([...titulares(),...(jogo.suplentes||[]),...((jogo.subs||[]).map(s=>s.entra))])].filter(Boolean); return ns.sort(byNum).map(n=>({n,nome:nome(n)})); }
  const m=new Map(); (G.onze||[]).concat(G.suplentes||[]).forEach(o=>{ if(o&&o.n&&!m.has(o.n)) m.set(o.n,o.nome||nome(o.n)); }); return [...m].map(([n,nm])=>({n,nome:nm})).sort((a,b)=>byNum(a.n,b.n)); }
const imPrimUlt=s=>{ const w=String(s||"").trim().split(/\s+/).filter(Boolean); return w.length>1?w[0]+" "+w[w.length-1]:(w[0]||""); };
const imNomeJ=(jg,n)=>(imJogadores(jg).find(x=>x.n===n)||{}).nome||nome(n)||"";
const imVideo=jg=>{ const G=imJogoG(jg); return jg==="atual"?jogo.video:(G&&G.video); };
const imMinuto=I=>I.temT?minutoReg(I):"";
function imLinkVideo(I){ const V=imVideo(I.jogo); if(!I.temT||!V||!V.url) return null; try{ return linkVideoModo({t:minutoReg(I),parte:I.parte},V,"web"); }catch(e){ return null; } }

/* ---------- desenho (SVG; o mesmo no ecrã, no editor e no PNG) ---------- */
let imMedeCx=null; const imTextW=(t,fs)=>{ if(!imMedeCx) imMedeCx=document.createElement("canvas").getContext("2d"); imMedeCx.font=`700 ${fs}px Arial, Helvetica, sans-serif`; return imMedeCx.measureText(t).width; };
const imClaro=c=>{ const v=parseInt(imCor(c).slice(1),16); return ((v>>16)*299+((v>>8)&255)*587+(v&255)*114)/1000>150; };
const imDash=(tr,sw)=>tr==="trac"?` stroke-dasharray="${(sw*3.2).toFixed(1)} ${(sw*2.2).toFixed(1)}"`:tr==="pontos"?` stroke-dasharray="0.1 ${(sw*2.3).toFixed(1)}"`:"";
const imCap=tr=>tr==="trac"?"butt":"round";
/* linha aos S ao longo do caminho (reta ou curva q); começa e acaba em zero para a ponta ficar direita */
function imOnda(x1,y1,x2,y2,q,A,lam){ const B=t=>q?[(1-t)*(1-t)*x1+2*(1-t)*t*q[0]+t*t*x2,(1-t)*(1-t)*y1+2*(1-t)*t*q[1]+t*t*y2]:[x1+(x2-x1)*t,y1+(y2-y1)*t];
  const N=64, b=[]; for(let i=0;i<=N;i++) b.push(B(i/N)); const cum=[0]; for(let i=1;i<=N;i++) cum.push(cum[i-1]+Math.hypot(b[i][0]-b[i-1][0],b[i][1]-b[i-1][1]));
  const tot=cum[N]; if(tot<lam) return b; const ond=Math.max(1,Math.round(tot/lam)), l=tot/ond, M=Math.max(24,ond*12), out=[];
  for(let j=0;j<=M;j++){ const sj=tot*j/M; let i=1; while(i<N&&cum[i]<sj) i++; const f=(sj-cum[i-1])/((cum[i]-cum[i-1])||1), x=b[i-1][0]+(b[i][0]-b[i-1][0])*f, y=b[i-1][1]+(b[i][1]-b[i-1][1])*f;
    const dx=b[i][0]-b[i-1][0], dy=b[i][1]-b[i-1][1], dl=Math.hypot(dx,dy)||1, w=A*Math.sin(2*Math.PI*sj/l); out.push([x-dy/dl*w,y+dx/dl*w]); }
  return out; }
const imR=v=>Math.round(v*10)/10, imPts=a=>a.map(q=>imR(q[0])+","+imR(q[1])).join(" ");
function imSetaSvg(p,W,H,at){ const sw=W*.0032*p.w, x1=p.x1*W, y1=p.y1*H, x2=p.x2*W, y2=p.y2*H, q=p.qx!=null?[p.qx*W,p.qy*H]:null;
  const L=Math.hypot(x2-x1,y2-y1); if(L<2) return ""; const hl=Math.min(sw*4.4,L*.45), hw=sw*2.5;
  const ponta=(tx,ty,fx,fy)=>{ const dx=tx-fx, dy=ty-fy, dl=Math.hypot(dx,dy)||1, ux=dx/dl, uy=dy/dl, bx=tx-ux*hl, by=ty-uy*hl; return {b:[bx+ux*hl*.25,by+uy*hl*.25],pol:[[tx,ty],[bx-uy*hw,by+ux*hw],[bx+uy*hw,by-ux*hw]]}; };
  const fim=p.pt!=="nenhuma"?ponta(x2,y2,...(q||[x1,y1])):null, ini=p.pt==="duas"?ponta(x1,y1,...(q||[x2,y2])):null;
  const a=ini?ini.b:[x1,y1], z=fim?fim.b:[x2,y2];
  const d=p.tr==="onda"?"M "+imOnda(a[0],a[1],z[0],z[1],q,sw*1.7,sw*8).map(r=>imR(r[0])+" "+imR(r[1])).join(" L "):q?`M ${imR(a[0])} ${imR(a[1])} Q ${imR(q[0])} ${imR(q[1])} ${imR(z[0])} ${imR(z[1])}`:`M ${imR(a[0])} ${imR(a[1])} L ${imR(z[0])} ${imR(z[1])}`;
  const tr=p.tr==="onda"?"cheio":p.tr, cab=[fim,ini].filter(Boolean).map(h=>`<polygon points="${imPts(h.pol)}" fill="${p.c}" stroke="rgba(0,0,0,.45)" stroke-width="${imR(sw*.5)}" stroke-linejoin="round"/>`).join("");
  return `<g${at}><path d="${d}" fill="none" stroke="rgba(0,0,0,.42)" stroke-width="${imR(sw*1.9)}" stroke-linecap="${imCap(tr)}" stroke-linejoin="round"${imDash(tr,sw)}/>`+
    `<path d="${d}" fill="none" stroke="${p.c}" stroke-width="${imR(sw)}" stroke-linecap="${imCap(tr)}" stroke-linejoin="round"${imDash(tr,sw)}/>${cab}`+
    (at?`<path d="${d}" fill="none" stroke="rgba(0,0,0,0)" stroke-width="${imR(Math.max(sw*5,W*.018))}"/>`:"")+`</g>`; }
/* forma de um círculo no chão: polígono em perspetiva (com calibração) ou elipse; devolve o início da etiqueta SVG */
function imFormaCirc(K,chao,x,y,a,b,rx,ry,W,H){ const pl=K&&chao?imCircChao(K,x,y,a,b,W,H):null;
  return pl?`<polygon points="${imPts(pl)}"`:`<ellipse cx="${imR(x*W)}" cy="${imR(y*H)}" rx="${imR(rx*W)}" ry="${imR(ry*W)}"`; }
/* riscado da zona deitado na relva: linhas a 45° no chão, projetadas e cortadas pela zona */
function imRiscChao(K,pts,W,H,cor,id){ const g=pts.map(q=>imAplica(K.Hi,q)), xs=g.map(q=>q[0]), ys=g.map(q=>q[1]), x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
  const s=Math.max(.4,Math.max(x1-x0,y1-y0)/14), L=[];
  for(let c=x0-y1;c<=x1-y0;c+=s*Math.SQRT2){ const a=Math.max(x0,y0+c), b=Math.min(x1,y1+c); if(a>=b) continue; const p=imAplicaW(K.H,[a,a-c]), q=imAplicaW(K.H,[b,b-c]); if(p[2]>0&&q[2]>0) L.push(`M ${imR(p[0]*W)} ${imR(p[1]*H)} L ${imR(q[0]*W)} ${imR(q[1]*H)}`); }
  return `<defs><clipPath id="${id}"><polygon points="${imPts(pts.map(q=>[q[0]*W,q[1]*H]))}"/></clipPath></defs><path d="${L.join(" ")}" clip-path="url(#${id})" stroke="${cor}" stroke-width="${imR(W*.0026)}" fill="none"/>`; }
function imPecaSvg(p,W,H,i,uid,ed,K){ const at=ed?` data-i="${i}"`:"", X=v=>imR(v*W), Y=v=>imR(v*H), sw=W*.003*p.w;
  const traco=()=>`stroke="${p.c}" stroke-width="${imR(sw)}" stroke-linecap="${imCap(p.tr)}"${imDash(p.tr,sw)}`, halo=()=>`stroke="rgba(0,0,0,.4)" stroke-width="${imR(sw*1.9)}" stroke-linecap="${imCap(p.tr)}"${imDash(p.tr,sw)}`;
  switch(p.t){
    case "seta": return imSetaSvg(p,W,H,at);
    case "circ": { const e=imFormaCirc(K,p.chao,p.x,p.y,p.m,p.m,p.rx,p.ry,W,H);
      return `<g${at}>${e} fill="${p.c}" fill-opacity="${p.op}" stroke="none"/>${e} fill="none" ${halo()} stroke-linejoin="round"/>${e} fill="none" ${traco()} stroke-linejoin="round"/></g>`; }
    case "lig": { const fs=p.pts.map(q=>imFormaCirc(K,p.chao,q[0],q[1],p.m,p.m,p.rx,p.rx*.38,W,H)), m=`${uid}g${i}`, d=p.pts.length>1?"M "+p.pts.map(q=>X(q[0])+" "+Y(q[1])).join(" L "):"";
      /* a linha não entra dentro dos círculos (máscara) */
      return `<g${at}><defs><mask id="${m}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>${fs.map(e=>`${e} fill="#000"/>`).join("")}</mask></defs>`+
        (d?`<path d="${d}" fill="none" mask="url(#${m})" ${halo()} stroke-linejoin="round"/><path d="${d}" fill="none" mask="url(#${m})" ${traco()} stroke-linejoin="round"/>`:"")+
        fs.map(e=>`${e} fill="${p.c}" fill-opacity="${p.op}" stroke="none"/>${e} fill="none" ${halo()} stroke-linejoin="round"/>${e} fill="none" ${traco()} stroke-linejoin="round"/>`).join("")+
        (ed&&d?`<path d="${d}" fill="none" stroke="rgba(0,0,0,0)" stroke-width="${imR(Math.max(sw*5,W*.018))}"/>`:"")+`</g>`; }
    case "luz": { const cx=p.x*W, cy=p.y*H, rx=p.rx*W, ry=rx*.36, top=cy-rx*p.alt, tw=rx*.32, g=`${uid}l${i}`;
      return `<g${at}><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.c}" stop-opacity="0"/><stop offset="1" stop-color="${p.c}" stop-opacity="${p.op}"/></linearGradient></defs>`+
        (p.alt>0?`<polygon points="${imPts([[cx-tw,top],[cx+tw,top],[cx+rx,cy],[cx-rx,cy]])}" fill="url(#${g})"/>`:"")+
        `<ellipse cx="${imR(cx)}" cy="${imR(cy)}" rx="${imR(rx)}" ry="${imR(ry)}" fill="${p.c}" fill-opacity="${imR(p.op*.7*100)/100}" ${traco()}/></g>`; }
    case "zona": { const forma=p.f==="elip"?imFormaCirc(K,p.chao,p.x,p.y,p.a,p.b,p.rx,p.ry,W,H):`<polygon points="${imPts(p.pts.map(q=>[q[0]*W,q[1]*H]))}"`;
      /* com perspetiva, o riscado segue a relva (zona de 4 cantos) */
      if(p.risc&&K&&p.chao&&p.f!=="elip") return `<g${at}>${forma} fill="${p.c}" fill-opacity="${imR(p.op*.5*100)/100}" stroke="none"/>${imRiscChao(K,p.pts,W,H,p.c,`${uid}k${i}`)}${forma} fill="none" ${traco()} stroke-linejoin="round"/></g>`;
      const pre=p.risc?`url(#${uid}h${i})`:p.c, fo=p.risc?Math.max(.6,p.op+.3):p.op, defs=p.risc?`<defs><pattern id="${uid}h${i}" patternUnits="userSpaceOnUse" width="${imR(W*.012)}" height="${imR(W*.012)}" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${imR(W*.012)}" stroke="${p.c}" stroke-width="${imR(W*.004)}"/></pattern></defs>`:"";
      return `<g${at}>${defs}${forma} fill="${pre}" fill-opacity="${fo}" stroke="none"/>${forma} fill="none" ${traco()} stroke-linejoin="round"/></g>`; }
    case "txt": { const fs=W*.021*p.tam, tw=imTextW(p.s,fs), pad=fs*.5, w=tw+pad*2, h=fs*1.55, x=p.x*W-w/2, y=p.y*H-h/2;
      return `<g${at}><rect x="${imR(x)}" y="${imR(y)}" width="${imR(w)}" height="${imR(h)}" rx="${imR(fs*.32)}" fill="${p.c}" stroke="rgba(0,0,0,.35)" stroke-width="${imR(fs*.06)}"/>`+
        `<text x="${imR(p.x*W)}" y="${imR(p.y*H+fs*.36)}" font-size="${imR(fs)}" font-weight="700" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" fill="${imClaro(p.c)?"#111111":"#FFFFFF"}">${esc(p.s)}</text></g>`; }
    case "num": { const r=W*.016*p.tam;
      return `<g${at}><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${imR(r)}" fill="${p.c}" stroke="rgba(0,0,0,.45)" stroke-width="${imR(r*.12)}"/><text x="${X(p.x)}" y="${imR(p.y*H+r*.4)}" font-size="${imR(r*1.15)}" font-weight="700" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" fill="${imClaro(p.c)?"#111111":"#FFFFFF"}">${esc(p.n)}</text></g>`; }
    case "marca": { const r=W*.02*p.tam, cx=p.x*W, cy=p.y*H, w=r*.3, d=p.k==="ok"?`M ${imR(cx-r)} ${imR(cy)} L ${imR(cx-r*.3)} ${imR(cy+r*.7)} L ${imR(cx+r)} ${imR(cy-r*.8)}`:`M ${imR(cx-r)} ${imR(cy-r)} L ${imR(cx+r)} ${imR(cy+r)} M ${imR(cx+r)} ${imR(cy-r)} L ${imR(cx-r)} ${imR(cy+r)}`;
      return `<g${at}><path d="${d}" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="${imR(w*1.6)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${p.c}" stroke-width="${imR(w)}" stroke-linecap="round" stroke-linejoin="round"/>`+
        (ed?`<circle cx="${imR(cx)}" cy="${imR(cy)}" r="${imR(r*1.2)}" fill="rgba(0,0,0,0)"/>`:"")+`</g>`; }
    case "livre": { const pts=imPts(p.pts.map(q=>[q[0]*W,q[1]*H]));
      return `<g${at}><polyline points="${pts}" fill="none" ${halo()} stroke-linejoin="round"/><polyline points="${pts}" fill="none" ${traco()} stroke-linejoin="round"/>`+(ed?`<polyline points="${pts}" fill="none" stroke="rgba(0,0,0,0)" stroke-width="${imR(Math.max(sw*5,W*.018))}"/>`:"")+`</g>`; } }
  return ""; }
/* camada por cima do print: escurecer à volta das luzes, peças, e no editor a seleção e as pegas */
function imCamadaSvg(I,uid,ed,sel,cal){ const W=I.img?I.img.w:1600, H=I.img?I.img.h:900, K=imK(I); let o="";
  const luzes=I.pecas.filter(p=>p.t==="luz");
  if(I.escuro>0&&luzes.length) o+=`<defs><mask id="${uid}m"><rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>${luzes.map(p=>`<ellipse cx="${imR(p.x*W)}" cy="${imR(p.y*H-p.rx*W*p.alt*.45)}" rx="${imR(p.rx*W*1.25)}" ry="${imR(p.rx*W*Math.max(.6,p.alt*.62))}" fill="#000"/>`).join("")}</mask></defs><rect x="0" y="0" width="${W}" height="${H}" fill="#000" fill-opacity="${I.escuro}" mask="url(#${uid}m)"/>`;
  I.pecas.forEach((p,i)=>{ o+=imPecaSvg(p,W,H,i,uid,ed,K); });
  if(ed&&cal&&I.cal) o+=imGrelhaSvg(I,K,W,H);
  else if(ed&&sel>=0&&I.pecas[sel]) o+=imPegasSvg(I.pecas[sel],W,H,sel,K);
  return o; }
/* ferramenta Campo: grelha do chão (passo de 1–10 m) e as 4 pegas douradas da calibração */
function imGrelhaSvg(I,K,W,H){ const r=W*.0095; let o="";
  if(K){ const {A,B}=K, st=[1,2,5,10].find(v=>Math.max(A,B)/v<=10)||20, P=g=>{ const q=imAplicaW(K.H,g); return q[2]>0&&Math.abs(q[0])<3&&Math.abs(q[1])<3?[q[0]*W,q[1]*H]:null; };
    const linha=(a,b)=>{ const pts=[]; for(let k=0;k<=24;k++){ const q=P([a[0]+(b[0]-a[0])*k/24,a[1]+(b[1]-a[1])*k/24]); if(q) pts.push(q); else if(pts.length) break; } return pts.length>1?`<polyline points="${imPts(pts)}" fill="none" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="${imR(W*.0012)}"/>`:""; };
    for(let x=Math.ceil(-A/st)*st;x<=2*A;x+=st) o+=linha([x,-B],[x,2*B]);
    for(let y=Math.ceil(-B/st)*st;y<=2*B;y+=st) o+=linha([-A,y],[2*A,y]);
    o+=`<polygon points="${imPts(I.cal.pts.map(q=>[q[0]*W,q[1]*H]))}" fill="#B8963F" fill-opacity=".14" stroke="#FFD400" stroke-width="${imR(W*.0028)}"/>`; }
  else o+=`<polygon points="${imPts(I.cal.pts.map(q=>[q[0]*W,q[1]*H]))}" fill="none" stroke="#E00000" stroke-width="${imR(W*.0028)}" stroke-dasharray="${imR(W*.008)} ${imR(W*.005)}"/>`;
  return o+I.cal.pts.map((q,k)=>`<circle data-h="c:${k}" cx="${imR(q[0]*W)}" cy="${imR(q[1]*H)}" r="${imR(r)}" fill="#FFD400" stroke="#1B1A17" stroke-width="${imR(r*.25)}"/><text x="${imR(q[0]*W)}" y="${imR(q[1]*H+r*.38)}" font-size="${imR(r*1.1)}" font-weight="700" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" fill="#1B1A17" pointer-events="none">${k+1}</text>`).join(""); }
function imPegasSvg(p,W,H,i,K){ const r=W*.0085, pega=(x,y,k,cor="#FFFFFF")=>`<circle data-h="${i}:${k}" cx="${imR(x)}" cy="${imR(y)}" r="${imR(r)}" fill="${cor}" stroke="#1B1A17" stroke-width="${imR(r*.25)}"/>`;
  const noChao=(x,y,dx,dy,k)=>{ const g=imAplica(K.Hi,[x,y]), q=imAplica(K.H,[g[0]+dx,g[1]+dy]); return pega(q[0]*W,q[1]*H,k); };
  if(p.t==="seta"){ const mx=p.qx!=null?(p.x1+2*p.qx+p.x2)/4:(p.x1+p.x2)/2, my=p.qx!=null?(p.y1+2*p.qy+p.y2)/4:(p.y1+p.y2)/2; return pega(p.x1*W,p.y1*H,"a")+pega(p.x2*W,p.y2*H,"b")+pega(mx*W,my*H,"q","#B8963F"); }
  if(K&&p.chao&&p.t==="circ") return noChao(p.x,p.y,p.m,0,"m");
  if(K&&p.chao&&p.t==="zona"&&p.f==="elip") return noChao(p.x,p.y,p.a,0,"a")+noChao(p.x,p.y,0,p.b,"b");
  if(p.t==="lig") return p.pts.map((q,k)=>pega(q[0]*W,q[1]*H,"p"+k)).join("");
  if(p.t==="circ"||(p.t==="zona"&&p.f==="elip")) return pega((p.x+p.rx)*W,p.y*H,"rx")+pega(p.x*W,p.y*H+p.ry*W,"ry");
  if(p.t==="luz") return pega((p.x+p.rx)*W,p.y*H,"rx")+pega(p.x*W,p.y*H-p.rx*W*p.alt,"alt","#B8963F");
  if(p.t==="zona") return p.pts.map((q,k)=>pega(q[0]*W,q[1]*H,"p"+k)).join("");
  if(["txt","num","marca"].includes(p.t)){ const [x,y]=imPosTam(p,W,H); return pega(x,y,"tam"); }
  return ""; }
/* sítio da pega do tamanho (canto de baixo à direita), em px */
function imPosTam(p,W,H){ if(p.t==="txt"){ const fs=W*.021*p.tam, w=imTextW(p.s,fs)+fs; return [p.x*W+w/2,p.y*H+fs*.78]; } const r=W*(p.t==="num"?.016:.02)*p.tam; return [p.x*W+r,p.y*H+r]; }
let imUid=0;
function svgImagem(I,o={}){ const W=I.img?I.img.w:1600, H=I.img?I.img.h:900, c=I.crop||{x:0,y:0,w:1,h:1}, uid=o.uid||("im"+(++imUid)+"_");
  const fundo=I.img?`<image href="${esc(srcImagem(I.img))}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>`:`<rect x="0" y="0" width="${W}" height="${H}" fill="#2B3A2E"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${imR(c.x*W)} ${imR(c.y*H)} ${imR(c.w*W)} ${imR(c.h*H)}"${o.attrs||""}>${fundo}<g class="im-ov">${imCamadaSvg(I,uid,!!o.ed,o.sel??-1,!!o.cal)}</g></svg>`; }

/* PNG: o print (recortado) com a camada desenhada por cima; no máximo 1920 px no lado maior */
async function canvasImagem(I){ const W=I.img.w, H=I.img.h, c=I.crop||{x:0,y:0,w:1,h:1}, sw=c.w*W, sh=c.h*H, k=Math.min(1,1920/Math.max(sw,sh));
  const cv=document.createElement("canvas"); cv.width=Math.round(sw*k); cv.height=Math.round(sh*k); const cx=cv.getContext("2d");
  const carrega=src=>new Promise((ok,ko)=>{ const im=new Image(); im.onload=()=>ok(im); im.onerror=()=>ko(new Error("imagem")); im.src=src; });
  const base=await carrega(srcImagem(I.img)); cx.drawImage(base,c.x*base.naturalWidth,c.y*base.naturalHeight,c.w*base.naturalWidth,c.h*base.naturalHeight,0,0,cv.width,cv.height);
  const sv=`<svg xmlns="http://www.w3.org/2000/svg" width="${cv.width}" height="${cv.height}" viewBox="${imR(c.x*W)} ${imR(c.y*H)} ${imR(sw)} ${imR(sh)}">${imCamadaSvg(I,"px_",false,-1)}</svg>`;
  const url=URL.createObjectURL(new Blob([sv],{type:"image/svg+xml"})); try{ cx.drawImage(await carrega(url),0,0,cv.width,cv.height); } finally{ URL.revokeObjectURL(url); }
  return cv; }
const nomeFichImg=I=>`SCA_${(I.titulo||"imagem").replace(/[^\wÀ-ÿ-]+/g,"_").slice(0,40)}${I.temT?"_"+minutoReg(I).replace(":","m"):""}.png`;
async function exportaPngImagem(I,bt){ if(bt) bt.disabled=true; try{ const cv=await canvasImagem(I), b=await new Promise(ok=>cv.toBlob(ok,"image/png")); await guardaFicheiro(nomeFichImg(I),b,"image/png"); toast("Imagem guardada"); }
  catch(e){ if(e?.code!=="declined") toast("Não foi possível criar a imagem ("+(e?.code||e?.message||"erro")+")"); } finally{ if(bt) bt.disabled=false; } }

/* ---------- carregar um print novo (colar, arrastar, escolher) ---------- */
let imJogo="atual";
async function novaImagem(file){ if(!file||!/^image\//.test(file.type||"")){ toast("Escolhe uma imagem (print do vídeo)."); return; }
  toast("A carregar a imagem…");
  try{ const {blob,w,h}=await reduzImagem(file,1920), A=await assetsEx(); if(!A){ toast("As imagens só se guardam no link da app."); return; }
    let r; try{ r=await A.upload(blob,{type:"image/jpeg"}); }catch(e){ if(e&&e.code==="store_unavailable"){ await new Promise(ok=>setTimeout(ok,1500)); r=await A.upload(blob,{type:"image/jpeg"}); } else throw e; }
    xImgUrl[r.id]=r.url; const I=gravaImagem({id:uId("im"),jogo:imJogo,img:{id:r.id,w,h},criadoPor:meuId||"",criadoEm:new Date().toISOString(),pecas:[]}); abreEditorImagem(I.id); }
  catch(e){ toast(e&&e.message==="imagem"?"Não consegui abrir esse ficheiro como imagem.":"Não foi possível guardar a imagem ("+((e&&(e.code||e.message))||"erro")+")."); } }
document.addEventListener("paste",e=>{ if(imEd||$("view-a").hidden||anVista!=="img"||$("sheet-root").innerHTML) return;
  const it=[...((e.clipboardData&&e.clipboardData.items)||[])].find(x=>/^image\//.test(x.type)); if(!it) return; e.preventDefault(); novaImagem(it.getAsFile()); });

/* ---------- lista (Pós-jogo › Imagens) ---------- */
function renderImagens(){ const box=$("a-imagens"); if(!box) return; const js=Object.entries(hist).sort(([,a],[,b])=>String(b.data||"").localeCompare(String(a.data||"")));
  if(imJogo!=="atual"&&!hist[imJogo]) imJogo="atual"; const L=imagensDe(imJogo);
  box.innerHTML=`<div class="an-top" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <select id="im-jogo" aria-label="Jogo" style="min-height:40px;flex:1 1 260px;width:auto;max-width:100%"><option value="atual">Jogo atual${jogo.adversario?" · vs "+esc(jogo.adversario):""}</option>${js.map(([k,J])=>`<option value="${esc(k)}">Arquivo · vs ${esc(J.adversario||"(sem adversário)")} · ${esc(dataPt(J.data))}</option>`).join("")}</select>
      <label class="btn primary" style="cursor:pointer">+ Nova imagem<input type="file" id="im-file" accept="image/*" hidden></label></div>
    <p class="sub" style="margin:6px 0 10px">Tira um print do vídeo e <b>cola-o aqui (Ctrl+V)</b>, arrasta-o para esta caixa ou escolhe-o com «+ Nova imagem». Cada imagem fica ligada a um momento do jogo, aos jogadores e aos princípios, e entra nos relatórios pós-jogo.</p>
    <div class="imgrid" id="im-grid">${L.length?L.map(I=>{ const lv=imLinkVideo(I);
      return `<div class="imcard" data-id="${esc(I.id)}"><button class="imth" data-a="ed" aria-label="Editar imagem">${svgImagem(I,{attrs:' preserveAspectRatio="xMidYMid meet"'})}</button>
        <div class="imtx"><b>${I.temT?`<span class="imt">${esc(I.parte)}.ª · ${esc(imMinuto(I))}</span> `:""}${esc(I.titulo||"Sem título")}</b>
        ${I.js.length?`<small>${I.js.map(n=>esc(n+" "+imNomeJ(I.jogo,n))).join(", ")}</small>`:""}${I.princ&&typeof chipsPrinc==="function"?`<div class="imch">${chipsPrinc(I.princ,true)}</div>`:""}
        <div class="actions" style="justify-content:flex-start;margin-top:6px"><button class="btn sm" data-a="ed">✎ Editar</button><button class="btn sm" data-a="png">⬇ PNG</button>${lv?`<a class="btn sm" href="${esc(lv)}" target="_blank" rel="noopener">▶ Vídeo</a>`:""}<button class="btn sm ghost danger" data-a="del">🗑</button></div></div></div>`; }).join("")
      :`<p class="sub" style="padding:24px;text-align:center">Ainda não há imagens deste jogo.</p>`}</div>`;
  const sel=$("im-jogo"); sel.value=imJogo; sel.onchange=()=>{ imJogo=sel.value; renderImagens(); };
  $("im-file").onchange=e=>{ const f=e.target.files[0]; e.target.value=""; if(f) novaImagem(f); };
  const g=$("im-grid"); g.ondragover=e=>{ e.preventDefault(); g.classList.add("sobre"); }; g.ondragleave=()=>g.classList.remove("sobre");
  g.ondrop=e=>{ e.preventDefault(); g.classList.remove("sobre"); const f=[...(e.dataTransfer.files||[])].find(x=>/^image\//.test(x.type)); if(f) novaImagem(f); };
  g.querySelectorAll(".imcard").forEach(c=>{ const id=c.dataset.id; c.querySelectorAll("[data-a]").forEach(b=>{
    if(b.dataset.a==="ed") b.onclick=()=>abreEditorImagem(id);
    else if(b.dataset.a==="png") b.onclick=()=>exportaPngImagem(imagens[id],b);
    else if(b.dataset.a==="del") confirma2(b,"Apagar?",()=>{ const antes=clone(imagens[id]); apagaImagem(id); renderImagens(); toast("Imagem apagada",()=>{ gravaImagem(antes); renderImagens(); }); }); }); }); }

/* ---------- editor ---------- */
let imEd=null;   // {I, sel, ferr, undo[], redo[], drag, estilo{ferr: props}}
const imPadrao={seta:{c:"#FFD400",w:1,tr:"cheio",pt:"fim"},circ:{c:"#FFD400",w:1,tr:"cheio",op:.15,m:1.2},lig:{c:"#FFD400",w:1,tr:"cheio",op:.2,rx:.03,m:1.2},luz:{c:"#FFFFFF",w:1,tr:"cheio",op:.5,alt:3.2},zona:{c:"#1F6FE0",w:1,tr:"cheio",op:.3,risc:false,f:"poli"},
  txt:{c:"#111111",tam:1},num:{c:"#E00000",tam:1},marca:{c:"#E00000",tam:1,k:"x"},livre:{c:"#FFD400",w:1,tr:"cheio"}};
let imEstilo=(()=>{ try{ return {...clone(imPadrao),...JSON.parse(localStorage.getItem("sca-im-estilo")||"{}")}; }catch(e){ return clone(imPadrao); } })();
const guardaEstiloIm=()=>{ try{ localStorage.setItem("sca-im-estilo",JSON.stringify(imEstilo)); }catch(e){} };
/* op (v115, vídeos): editar um desenho que não é uma imagem do Pós-jogo — {I, grava(I), fecha(), ficha(caixa)}; sem PNG nem Recortar */
function abreEditorImagem(id,op){ const I0=op?op.I:imagens[id]; if(!I0) return; imEd={I:clone(I0),sel:-1,ferr:"mover",undo:[],redo:[],drag:null,tSave:null,lig:null,op:op||null};
  let r=$("imed-root"); if(!r){ r=document.createElement("div"); r.id="imed-root"; document.body.appendChild(r); }
  r.innerHTML=`<div class="imed" role="dialog" aria-label="Editor de imagem">
    <div class="imed-top"><b class="imed-tit"></b><span class="sp"></span><button class="btn sm" id="ie-undo">↶ Desfazer</button><button class="btn sm" id="ie-redo">↷ Refazer</button><button class="btn sm" id="ie-png">⬇ PNG</button><button class="btn sm primary" id="ie-ok">✓ Concluir</button></div>
    <div class="imed-ferr" id="ie-ferr">${IM_FERR.filter(([k])=>!(op&&k==="crop")).map(([k,t])=>`<button data-f="${k}">${t}</button>`).join("")}</div>
    <div class="imed-corpo"><div class="imed-palco" id="ie-palco"></div><div class="imed-lado"><div id="ie-prop"></div><div id="ie-ficha"></div></div></div></div>`;
  r.querySelectorAll("#ie-ferr button").forEach(b=>b.onclick=()=>{ if(imEd.lig!=null) imFimLig(true); const f=b.dataset.f;
    if(f==="cal"&&!imEd.I.cal){ imMarca(); imEd.I.cal={pts:[[.3,.3],[.7,.3],[.85,.75],[.15,.75]],ref:"ga",rod:false}; imGrava(); }
    imEd.ferr=f; imEd.sel=-1; imDesenha(); imPainel(); });
  $("ie-undo").onclick=imDesfaz; $("ie-redo").onclick=imRefaz; $("ie-png").onclick=e=>{ imGravaJa(); exportaPngImagem(imagens[imEd.I.id],e.currentTarget); }; $("ie-png").hidden=!!op; $("ie-ok").onclick=fechaEditorImagem;
  document.addEventListener("keydown",imTecla); imDesenha(); imPainel(); imFicha(); }
function fechaEditorImagem(){ if(!imEd) return; imFechaMenu(); if(imEd.lig!=null) imFimLig(true); imGravaJa(); document.removeEventListener("keydown",imTecla); const r=$("imed-root"); if(r) r.innerHTML=""; const op=imEd.op; imEd=null; if(op) op.fecha(); else renderImagens(); }
function imTecla(e){ if(!imEd||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||"")) return;
  if(imEd.op&&imEd.op.tecla&&imEd.op.tecla(e)){ e.preventDefault(); return; }   // v117: ← → mudam o tempo do vídeo
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){ e.preventDefault(); e.shiftKey?imRefaz():imDesfaz(); }
  else if((e.key==="Delete"||e.key==="Backspace")&&imEd.sel>=0){ e.preventDefault(); imApagaSel(); }
  else if((e.key==="Enter"||e.key==="Escape")&&imEd.lig!=null){ e.preventDefault(); imFimLig(); }
  else if(e.key==="Escape"&&$("ie-menu")) imFechaMenu();
  else if(e.key==="Escape"){ imEd.sel=-1; imEd.ferr="mover"; imDesenha(); imPainel(); } }
const imFoto=()=>JSON.stringify({pecas:imEd.I.pecas,crop:imEd.I.crop,escuro:imEd.I.escuro,cal:imEd.I.cal});
function imMarca(){ imEd.undo.push(imFoto()); if(imEd.undo.length>80) imEd.undo.shift(); imEd.redo=[]; }
function imRepoe(s){ const o=JSON.parse(s); Object.assign(imEd.I,{cal:null},o); imEd.sel=-1; imEd.lig=null; imDesenha(); imPainel(); imGrava(); }
/* acabar a ligação em curso: com menos de 2 jogadores não fica; depois volta ao Mover (manter = fica na ferramenta escolhida) */
function imFimLig(manter){ const I=imEd.I, i=imEd.lig; imEd.lig=null; const L=I.pecas[i];
  if(L&&L.t==="lig"){ if(L.pts.length<2){ I.pecas.splice(i,1); imEd.sel=-1; } else imEd.sel=i; }
  if(!manter) imEd.ferr="mover"; imDesenha(); imPainel(); imGrava(); }
function imDesfaz(){ if(!imEd||!imEd.undo.length){ toast("Nada para desfazer."); return; } imEd.redo.push(imFoto()); imRepoe(imEd.undo.pop()); }
function imRefaz(){ if(!imEd||!imEd.redo.length) return; imEd.undo.push(imFoto()); imRepoe(imEd.redo.pop()); }
function imGrava(){ clearTimeout(imEd.tSave); imEd.tSave=setTimeout(imGravaJa,500); }
/* o editor trabalha sempre no mesmo objeto (os botões do painel e da ficha guardam-no); grava-se uma cópia normalizada */
function imGravaJa(){ if(!imEd) return; clearTimeout(imEd.tSave); if(imEd.op){ imEd.op.grava(clone(imEd.I)); return; } const N=gravaImagem(imEd.I); imEd.I.alteradoEm=N.alteradoEm; imEd.I.alteradoPor=N.alteradoPor; }
function imApagaSel(){ const i=imEd.sel; if(i<0) return; imMarca(); imEd.I.pecas.splice(i,1); imEd.sel=-1; imDesenha(); imPainel(); imGrava(); }
function imDuplica(){ const I=imEd.I, P=I.pecas[imEd.sel]; if(!P) return; imMarca(); const C=clone(P); delete C.pk; imMove(C,clone(P),.02,.02); I.pecas.push(normPecaIm(C)); imEd.sel=I.pecas.length-1; imDesenha(); imPainel(); imGrava(); }
/* v114.2.1: menu da peça — botão direito do rato, ou toque longo no iPad (pedido do Rodrigo) */
function imMenu(i,x,y){ imFechaMenu(); if(!imEd||!imEd.I.pecas[i]) return; imEd.sel=i; imDesenha(); imPainel();
  const m=document.createElement("div"); m.className="immenu"; m.id="ie-menu"; m.setAttribute("role","menu");
  m.innerHTML=`<button role="menuitem" data-a="dup">⧉ Duplicar</button><button role="menuitem" data-a="del" class="perigo">🗑 Apagar</button>`;
  document.querySelector(".imed").appendChild(m); const r=m.getBoundingClientRect();
  m.style.left=Math.max(8,Math.min(x,innerWidth-r.width-8))+"px"; m.style.top=Math.max(8,Math.min(y,innerHeight-r.height-8))+"px";
  m.querySelector('[data-a="dup"]').onclick=()=>{ imFechaMenu(); imDuplica(); }; m.querySelector('[data-a="del"]').onclick=()=>{ imFechaMenu(); imApagaSel(); };
  setTimeout(()=>document.addEventListener("pointerdown",imForaMenu,true),0); }
function imForaMenu(e){ if(!e.target.closest("#ie-menu")) imFechaMenu(); }
function imFechaMenu(){ const m=$("ie-menu"); if(m) m.remove(); document.removeEventListener("pointerdown",imForaMenu,true); }
function imDesenha(){ const pal=$("ie-palco"); if(!pal||!imEd) return; const I=imEd.I;
  $("ie-ferr").querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.f===imEd.ferr)));
  $("imed-root").querySelector(".imed-tit").textContent=(I.titulo||"Imagem")+(I.temT?` · ${I.parte}.ª parte ${minutoReg(I)}`:"");
  let svg=pal.querySelector("svg");
  if(!svg||svg.dataset.crop!==JSON.stringify(I.crop)){ pal.innerHTML=svgImagem(I,{uid:"ed_",ed:true,sel:imEd.sel,cal:imEd.ferr==="cal",attrs:` class="imed-svg" style="touch-action:none" preserveAspectRatio="xMidYMid meet"`}); svg=pal.querySelector("svg"); svg.dataset.crop=JSON.stringify(I.crop); imLigaPalco(svg); }
  else svg.querySelector(".im-ov").innerHTML=imCamadaSvg(I,"ed_",true,imEd.sel,imEd.ferr==="cal");
  if(imEd.drag&&imEd.drag.crop){ const c=imEd.drag.crop, W=I.img.w, H=I.img.h; svg.querySelector(".im-ov").insertAdjacentHTML("beforeend",`<rect x="${imR(c.x*W)}" y="${imR(c.y*H)}" width="${imR(c.w*W)}" height="${imR(c.h*H)}" fill="rgba(255,255,255,.15)" stroke="#FFFFFF" stroke-width="${imR(W*.003)}" stroke-dasharray="${imR(W*.01)} ${imR(W*.006)}"/>`); }
  $("ie-undo").disabled=!imEd.undo.length; $("ie-redo").disabled=!imEd.redo.length; }
const imPt=(svg,e)=>{ const m=svg.getScreenCTM().inverse(), p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m); return {x:p.x/imEd.I.img.w,y:p.y/imEd.I.img.h}; };
function imNova(t,pt){ const E={...clone(imEstilo[t]||{})}; let p;
  if(t==="circ") p={t,x:pt.x,y:pt.y,rx:.035,ry:.013,...E,...(imK(imEd.I)?{chao:true}:{})};
  else if(t==="luz") p={t,x:pt.x,y:pt.y,rx:.03,...E};
  else if(t==="txt"){ const jn=imEd.I.js[0]; p={t,x:pt.x,y:pt.y,s:jn?`${jn}. ${(imNomeJ(imEd.I.jogo,jn)||"").split(" ")[0]}`.trim():"Jogador",...E}; }
  else if(t==="num"){ const n=imEd.I.pecas.filter(x=>x.t==="num").length+1; p={t,x:pt.x,y:pt.y,n:String(n),...E}; }
  else if(t==="marca") p={t,x:pt.x,y:pt.y,...E};
  return normPecaIm(p); }
/* peças umas em cima das outras: escolhe a que tem o centro (ou o ponto) mais perto do toque, para se poder mexer em qualquer uma */
function imMaisPerto(e,pt,i0){ const I=imEd.I, W=I.img.w, H=I.img.h, is=[...new Set(document.elementsFromPoint(e.clientX,e.clientY).map(el=>el.closest&&el.closest("[data-i]")).filter(Boolean).map(el=>+el.dataset.i))].filter(i=>I.pecas[i]);
  if(is.length<2) return i0; const d=(x,y)=>Math.hypot((x-pt.x)*W,(y-pt.y)*H);
  const dist=p=>p.pts?Math.min(...p.pts.map(q=>d(q[0],q[1]))):p.x1!=null?Math.min(d(p.x1,p.y1),d(p.x2,p.y2),d((p.x1+p.x2)/2,(p.y1+p.y2)/2)):d(p.x,p.y);
  return is.reduce((b,i)=>dist(I.pecas[i])<dist(I.pecas[b])?i:b,is[0]); }
function imLigaPalco(svg){
  svg.addEventListener("pointerdown",e=>{ if(!imEd||e.button===2) return; e.preventDefault(); const I=imEd.I, pt=imPt(svg,e), alvo=e.target.closest("[data-h],[data-i]"), f=imEd.ferr, K=imK(I);
    /* depois de criar uma peça volta ao Mover; com Ctrl carregado fica na mesma ferramenta (pedido do Rodrigo) */
    const fica=e.ctrlKey||e.metaKey, D={x0:e.clientX,y0:e.clientY,p0:pt,mov:false,antes:imFoto(),fica};
    if(f==="lig"){ const L=imEd.lig!=null&&I.pecas[imEd.lig]&&I.pecas[imEd.lig].t==="lig"?I.pecas[imEd.lig]:null;
      if(!L){ imMarca(); I.pecas.push(normPecaIm({t:"lig",pts:[[pt.x,pt.y]],...clone(imEstilo.lig),...(K?{chao:true}:{})})); imEd.lig=imEd.sel=I.pecas.length-1; }
      else { const u=L.pts[L.pts.length-1];
        /* tocar outra vez no último jogador acaba a ligação */
        if(L.pts.length>=2&&Math.hypot((u[0]-pt.x)*I.img.w,(u[1]-pt.y)*I.img.h)<I.img.w*.015){ imFimLig(fica); return; }
        if(L.pts.length<12) L.pts.push([pt.x,pt.y]); }
      imDesenha(); imPainel(); imGrava(); return; }
    /* v119.1: com uma ferramenta de desenhar, tocar em cima de outra peça (ou das pegas dela) desenha uma peça nova por cima (pedido do Rodrigo) */
    if(alvo&&alvo.dataset.h&&(f==="mover"||(f==="cal"&&alvo.dataset.h.startsWith("c:")))){ const [i,k]=alvo.dataset.h.split(":"); if(i==="c") Object.assign(D,{tipo:"cal",k:+k}); else Object.assign(D,{tipo:"pega",i:+i,k,orig:clone(I.pecas[+i])}); }
    else if(f==="cal") D.tipo="nada";
    else if(f==="mover"){ if(alvo&&alvo.dataset.i!=null){ const i=imMaisPerto(e,pt,+alvo.dataset.i), era=imEd.sel===i; imEd.sel=i; Object.assign(D,{tipo:"mover",i,orig:clone(I.pecas[i]),era});
        if(e.pointerType!=="mouse"){ const cx=e.clientX, cy=e.clientY; D.lp=setTimeout(()=>{ if(!D.mov&&imEd) imMenu(i,cx,cy); },550); } }
      else { imEd.sel=-1; D.tipo="nada"; } }
    else if(f==="seta") Object.assign(D,{tipo:"criar",nova:normPecaIm({t:"seta",x1:pt.x,y1:pt.y,x2:pt.x,y2:pt.y,...clone(imEstilo.seta)})});
    else if(f==="zona"){ const z=imEstilo.zona, ch=K?{chao:true}:{}; Object.assign(D,{tipo:"criar",nova:normPecaIm(z.f==="elip"?{t:"zona",f:"elip",x:pt.x,y:pt.y,rx:.006,ry:.004,a:.3,b:.3,...clone(z),...ch}:{t:"zona",f:"poli",pts:[[pt.x,pt.y],[pt.x,pt.y],[pt.x,pt.y],[pt.x,pt.y]],...clone(z),...ch})}); }
    else if(f==="livre") Object.assign(D,{tipo:"criar",nova:{t:"livre",pts:[[pt.x,pt.y]],...clone(imEstilo.livre)}});
    else if(f==="crop") Object.assign(D,{tipo:"crop",crop:{x:pt.x,y:pt.y,w:0,h:0}});
    else { const p=imNova(f,pt); if(p){ imMarca(); I.pecas.push(p); imEd.sel=I.pecas.length-1; if(!fica) imEd.ferr="mover"; imDesenha(); imPainel(); imGrava(); } return; }
    if(D.tipo==="criar"){ I.pecas.push(D.nova); D.i=I.pecas.length-1; imEd.sel=D.i; }
    imEd.drag=D; imDesenha(); imPainel();
    const mv=ev=>{ const p=imPt(svg,ev), dx=p.x-D.p0.x, dy=p.y-D.p0.y; if(Math.hypot(ev.clientX-D.x0,ev.clientY-D.y0)>5){ D.mov=true; clearTimeout(D.lp); } if(!D.mov) return;
      const P=I.pecas[D.i];
      if(D.tipo==="cal"){ I.cal.pts[D.k]=[p.x,p.y]; imDesenha(); return; }
      if(D.tipo==="mover"){ if(K&&P.chao&&P.t==="zona"&&P.pts) imMoveChao(P,D.orig,K,D.p0,p); else imMove(P,D.orig,dx,dy); }
      else if(D.tipo==="pega") imPega(P,D.orig,D.k,p);
      else if(D.tipo==="criar"){ const a=D.p0; if(P.t==="seta"){ P.x2=p.x; P.y2=p.y; } else if(P.t==="livre") P.pts.push([p.x,p.y]);
        else if(P.f==="elip"&&P.chao&&K){ const g0=imAplica(K.Hi,[a.x,a.y]), g=imAplica(K.Hi,[p.x,p.y]); P.a=Math.max(.3,Math.abs(g[0]-g0[0])); P.b=Math.max(.3,Math.abs(g[1]-g0[1])); }
        else if(P.f==="elip"){ P.rx=Math.max(.006,Math.abs(dx)); P.ry=Math.max(.004,Math.abs(dy)*I.img.h/I.img.w); }
        /* zona com perspetiva: retângulo no chão entre o ponto inicial e o dedo, projetado na imagem */
        else if(P.chao&&K){ const g0=imAplica(K.Hi,[a.x,a.y]), g=imAplica(K.Hi,[p.x,p.y]); P.pts=[[g0[0],g0[1]],[g[0],g0[1]],[g[0],g[1]],[g0[0],g[1]]].map(q=>imAplica(K.H,q)); }
        else P.pts=[[a.x,a.y],[p.x,a.y],[p.x,p.y],[a.x,p.y]]; }
      else if(D.tipo==="crop") D.crop={x:Math.min(D.p0.x,p.x),y:Math.min(D.p0.y,p.y),w:Math.abs(dx),h:Math.abs(dy)};
      imDesenha(); };
    const up=()=>{ clearTimeout(D.lp); window.removeEventListener("pointermove",mv); window.removeEventListener("pointerup",up); window.removeEventListener("pointercancel",up); imEd&&(imEd.drag=null); if(!imEd) return;
      if(D.tipo==="cal"){ if(D.mov){ imEd.undo.push(D.antes); imEd.redo=[]; imGrava(); } }
      else if(D.tipo==="criar"){ const P=I.pecas[D.i], peq=P.t==="seta"?Math.hypot(P.x2-P.x1,P.y2-P.y1)<.012:P.t==="livre"?P.pts.length<3:!D.mov;
        if(peq){ I.pecas.splice(D.i,1); imEd.sel=-1; } else { if(P.t==="livre") I.pecas[D.i]=normPecaIm(P); imEd.undo.push(D.antes); imEd.redo=[]; if(!D.fica) imEd.ferr="mover"; imGrava(); } }
      else if(D.tipo==="crop"){ const c=D.crop; if(c.w>.05&&c.h>.05){ imEd.undo.push(D.antes); imEd.redo=[]; I.crop={x:Math.max(0,c.x),y:Math.max(0,c.y),w:Math.min(1-Math.max(0,c.x),c.w),h:Math.min(1-Math.max(0,c.y),c.h)}; imEd.ferr="mover"; imGrava(); toast("Imagem recortada · «Sem recorte» no painel para voltar"); } }
      else if(D.mov&&(D.tipo==="mover"||D.tipo==="pega")){ imEd.undo.push(D.antes); imEd.redo=[]; imGrava(); }
      imDesenha(); imPainel(); };
    window.addEventListener("pointermove",mv); window.addEventListener("pointerup",up); window.addEventListener("pointercancel",up); });
  svg.addEventListener("contextmenu",e=>{ const a=e.target.closest("[data-i]"); if(!a) return; e.preventDefault(); if($("ie-menu")) return; imMenu(+a.dataset.i,e.clientX,e.clientY); }); }
function imMove(P,O,dx,dy){ const m=(a,b)=>{ if(O[a]!=null) P[a]=O[a]+dx; if(O[b]!=null) P[b]=O[b]+dy; };
  if(P.t==="seta"){ m("x1","y1"); m("x2","y2"); if(O.qx!=null) m("qx","qy"); }
  else if(P.pts) P.pts=O.pts.map(q=>[q[0]+dx,q[1]+dy]);
  else m("x","y"); }
/* zona com perspetiva: desliza na relva (os cantos andam o mesmo nº de metros) */
function imMoveChao(P,O,K,p0,p){ const a=imAplica(K.Hi,[p0.x,p0.y]), b=imAplica(K.Hi,[p.x,p.y]), d=[b[0]-a[0],b[1]-a[1]];
  P.pts=O.pts.map(q=>{ const g=imAplica(K.Hi,q); return imAplica(K.H,[g[0]+d[0],g[1]+d[1]]); }); }
function imPega(P,O,k,p){ const I=imEd.I, ar=I.img.h/I.img.w, K=imK(I);
  if(P.t==="seta"){ if(k==="a"){ P.x1=p.x; P.y1=p.y; } else if(k==="b"){ P.x2=p.x; P.y2=p.y; } else { P.qx=2*p.x-(O.x1+O.x2)/2; P.qy=2*p.y-(O.y1+O.y2)/2; } }
  else if((k==="m"||k==="a"||k==="b")&&K){ const c=imAplica(K.Hi,[P.x,P.y]), g=imAplica(K.Hi,[p.x,p.y]);
    if(k==="m") P.m=Math.max(.2,Math.min(20,Math.hypot(g[0]-c[0],g[1]-c[1]))); else P[k]=Math.max(.3,Math.min(80,Math.abs(k==="a"?g[0]-c[0]:g[1]-c[1]))); }
  else if(k==="rx") P.rx=Math.max(.005,Math.abs(p.x-P.x));
  else if(k==="ry") P.ry=Math.max(.003,Math.abs(p.y-P.y)*ar);
  else if(k==="alt") P.alt=Math.max(0,Math.min(10,(P.y-p.y)*ar/P.rx));
  else if(k[0]==="p") P.pts[+k.slice(1)]=[p.x,p.y];
  else if(k==="tam"){ const W=I.img.w, H=I.img.h, [hx,hy]=imPosTam(O,W,H), d0=Math.hypot(hx-O.x*W,hy-O.y*H)||1, d=Math.hypot(p.x*W-P.x*W,p.y*H-P.y*H); P.tam=Math.max(.4,Math.min(4,O.tam*d/d0)); } }

/* painel da peça escolhida (ou das opções da ferramenta) */
function imPainel(){ const bx=$("ie-prop"); if(!bx||!imEd) return; const I=imEd.I, i=imEd.sel, P=I.pecas[i], f=imEd.ferr;
  const alvo=P||(imEstilo[f]?imEstilo[f]:null), tipo=P?P.t:f;
  const seg=(id,ops,v)=>`<div class="seg" id="${id}">${ops.map(([k,t])=>`<button data-k="${k}" aria-pressed="${String(k)===String(v)}">${t}</button>`).join("")}</div>`;
  const nomes={seta:"Seta",circ:"Círculo",lig:"Ligação",luz:"Luz",zona:"Zona",txt:"Texto",num:"Número",marca:"Marca",livre:"Caneta"}, K=imK(I);
  let h="";
  if(alvo){ h+=`<h4>${P?nomes[tipo]+" (selecionada)":"Novas peças · "+nomes[tipo]}</h4>`;
    if(tipo==="lig"&&imEd.lig!=null&&(!P||imEd.lig===i)) h+=`<p class="sub" style="margin:0">Toca em cada jogador, pela ordem da linha. Para acabar toca outra vez no último (ou Enter).</p><button class="btn sm primary" id="ie-fimlig">✓ Terminar ligação</button>`;
    else if(tipo==="lig"&&!P) h+=`<p class="sub" style="margin:0">Toca em cada jogador, pela ordem da linha: cada um fica com o seu círculo e a linha liga-os.</p>`;
    if(["circ","lig","zona"].includes(tipo)&&!P) h+=`<p class="sub" style="margin:0">${K?"📐 Com a perspetiva do campo.":"Sem perspetiva: usa <b>📐 Campo</b> para as peças ficarem deitadas na relva."}</p>`;
    h+=`<div class="imcores">${IM_CORES.map(([c,n])=>`<button data-c="${c}" title="${n}" aria-label="Cor: ${n}" aria-pressed="${alvo.c===c}"><i style="background:${c}"></i></button>`).join("")}<label title="Outra cor"><input type="color" id="ie-cor" value="${alvo.c}"></label></div>`;
    if(["seta","circ","lig","zona","livre"].includes(tipo)) h+=`<label class="f">Espessura<input type="range" id="ie-w" min="0.3" max="4" step="0.1" value="${alvo.w}"></label>`+seg("ie-tr",tipo==="seta"?[...IM_TRACO,["onda","Aos S"]]:IM_TRACO,alvo.tr);
    if(tipo==="seta") h+=seg("ie-pt",[["fim","→ Uma ponta"],["duas","↔ Duas"],["nenhuma","— Sem ponta"]],alvo.pt)+(P&&P.qx!=null?`<button class="btn sm" id="ie-reta">― Tirar a curva</button>`:"");
    if(tipo==="circ"||tipo==="lig"||tipo==="zona"||tipo==="luz") h+=`<label class="f">${tipo==="luz"?"Intensidade":"Preenchimento"}<input type="range" id="ie-op" min="${tipo==="luz"?.05:0}" max="${tipo==="luz"?.9:.8}" step="0.05" value="${alvo.op}"></label>`;
    /* tamanho do círculo: em metros com perspetiva, em fração da largura sem ela (a Ligação não tem pega de tamanho) */
    const emM=P?!!(P.chao&&K):!!K;
    if(tipo==="lig"||(tipo==="circ"&&emM)) h+=emM?`<label class="f">Tamanho do círculo (${imR(alvo.m??1.2)} m)<input type="range" id="ie-m" min="0.3" max="6" step="0.1" value="${alvo.m??1.2}"></label>`:`<label class="f">Tamanho do círculo<input type="range" id="ie-lrx" min="0.01" max="0.1" step="0.002" value="${alvo.rx??.03}"></label>`;
    if(tipo==="luz") h+=`<label class="f">Altura do feixe<input type="range" id="ie-alt" min="0" max="8" step="0.2" value="${alvo.alt}"></label>`;
    if(tipo==="zona") h+=seg("ie-zf",[["poli","▱ 4 cantos"],["elip","◯ Elipse"]],alvo.f)+seg("ie-risc",[["0","Cheia"],["1","Riscada"]],alvo.risc?"1":"0");
    if(tipo==="marca") h+=seg("ie-k",[["x","✗ Errado"],["ok","✓ Certo"]],alvo.k);
    if(["txt","num","marca"].includes(tipo)) h+=`<label class="f">Tamanho<input type="range" id="ie-tam" min="0.4" max="4" step="0.1" value="${alvo.tam}"></label>`;
    if(P&&tipo==="txt") h+=`<label class="f">Texto<input type="text" id="ie-s" value="${esc(P.s)}" maxlength="80"></label><div class="imjog">${imJogadores(I.jogo).map(x=>`<button class="btn sm" data-jt="${esc(x.n)}">${esc(x.n)}. ${esc((x.nome||"").split(" ")[0])}</button>`).join("")}</div>`;
    if(P&&tipo==="num") h+=`<label class="f">Número<input type="text" id="ie-n" value="${esc(P.n)}" maxlength="3"></label>`;
    if(P) h+=`<div class="actions" style="justify-content:flex-start"><button class="btn sm" id="ie-dup">⧉ Duplicar</button><button class="btn sm" id="ie-cima">⤒ Para a frente</button><button class="btn sm" id="ie-baixo">⤓ Para trás</button><button class="btn sm danger" id="ie-del">🗑 Apagar</button></div>`; }
  else if(f==="cal"&&I.cal) h+=`<h4>📐 Perspetiva do campo</h4><p class="sub" style="margin:0">Arrasta as 4 pegas amarelas para os 4 cantos de um retângulo marcado na relva (por exemplo a grande área), pela ordem 1-2-3-4 à volta. A grelha tem de ficar deitada na relva. Depois os círculos, as ligações e as zonas novas seguem a perspetiva.</p>
      <label class="f">Que retângulo é?</label>${seg("ie-ref",Object.entries(IM_REF).map(([k,v])=>[k,v[0]]),I.cal.ref)}
      <p class="sub" style="margin:0">${K?`Lado 1→2: ${imR(K.A)} m · lado 2→3: ${imR(K.B)} m`:"<b>As pegas estão mal colocadas</b> (cruzadas ou em linha)."}</p>
      <div class="actions" style="justify-content:flex-start"><button class="btn sm" id="ie-rod">↻ Trocar os lados</button><button class="btn sm danger" id="ie-semcal">Tirar perspetiva</button><button class="btn sm primary" id="ie-calok">✓ Feito</button></div>`;
  else if(f==="crop") h+=`<h4>Recortar</h4><p class="sub" style="margin:0">Arrasta na imagem para escolher a parte que fica.</p>`;
  else h+=`<h4>Editar</h4><p class="sub" style="margin:0">Escolhe uma ferramenta em cima e toca ou arrasta na imagem. Depois de criares uma peça volta ao <b>✥ Mover</b>; com <b>Ctrl</b> carregado ficas na mesma ferramenta para fazer várias. Com <b>✥ Mover</b>, toca numa peça para a escolher, arrasta-a, e usa as pegas (brancas e dourada) para mudar o tamanho, a forma ou a curva.</p>`;
  if(I.pecas.some(p=>p.t==="luz")) h+=`<label class="f">Escurecer à volta das luzes<input type="range" id="ie-esc" min="0" max="0.8" step="0.05" value="${I.escuro}"></label>`;
  if(I.crop) h+=`<button class="btn sm" id="ie-semcrop">⛶ Sem recorte</button>`;
  bx.innerHTML=h;
  const q=s=>bx.querySelector(s), muda=(fn,marca=true)=>{ if(P){ if(marca) imMarca(); fn(P); I.pecas[i]=normPecaIm(P); imDesenha(); imGrava(); } if(!P||true){ fn(imEstilo[tipo]||{}); guardaEstiloIm(); } };
  bx.querySelectorAll(".imcores button").forEach(b=>b.onclick=()=>{ muda(o=>o.c=b.dataset.c); imPainel(); });
  if(q("#ie-cor")) q("#ie-cor").onchange=e=>{ muda(o=>o.c=e.target.value.toUpperCase()); imPainel(); };
  const rng=(id,k)=>{ const r=q(id); if(!r) return; let marcou=false; r.oninput=()=>{ muda(o=>o[k]=+r.value,!marcou); marcou=true; }; r.onchange=()=>{ marcou=false; }; };
  rng("#ie-w","w"); rng("#ie-op","op"); rng("#ie-alt","alt"); rng("#ie-tam","tam"); rng("#ie-m","m"); rng("#ie-lrx","rx");
  if(q("#ie-m")) q("#ie-m").addEventListener("change",()=>imPainel());
  if(q("#ie-fimlig")) q("#ie-fimlig").onclick=()=>imFimLig();
  if(q("#ie-ref")) q("#ie-ref").querySelectorAll("button").forEach(b=>b.onclick=()=>{ imMarca(); I.cal.ref=b.dataset.k; imDesenha(); imPainel(); imGrava(); });
  if(q("#ie-rod")) q("#ie-rod").onclick=()=>{ imMarca(); I.cal.rod=!I.cal.rod; imDesenha(); imPainel(); imGrava(); };
  if(q("#ie-semcal")) q("#ie-semcal").onclick=()=>{ imMarca(); I.cal=null; imEd.ferr="mover"; imDesenha(); imPainel(); imGrava(); toast("Perspetiva tirada · Desfazer para voltar"); };
  if(q("#ie-calok")) q("#ie-calok").onclick=()=>{ imEd.ferr="mover"; imDesenha(); imPainel(); };
  const sg=(id,k,cv=v=>v)=>{ const s=q(id); if(s) s.querySelectorAll("button").forEach(b=>b.onclick=()=>{ muda(o=>o[k]=cv(b.dataset.k)); imPainel(); }); };
  sg("#ie-tr","tr"); sg("#ie-pt","pt"); sg("#ie-k","k"); sg("#ie-risc","risc",v=>v==="1");
  if(q("#ie-zf")) q("#ie-zf").querySelectorAll("button").forEach(b=>b.onclick=()=>{ const fz=b.dataset.k;
    if(P&&P.chao&&K&&fz!==P.f){ imMarca();
      /* com perspetiva a troca faz-se no chão: retângulo do chão ↔ elipse do chão com os mesmos metros */
      if(fz==="elip"){ const g=P.pts.map(q=>imAplica(K.Hi,q)), xs=g.map(q=>q[0]), ys=g.map(q=>q[1]), c=imAplica(K.H,[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2]);
        I.pecas[i]=normPecaIm({...P,f:"elip",x:c[0],y:c[1],a:(Math.max(...xs)-Math.min(...xs))/2,b:(Math.max(...ys)-Math.min(...ys))/2,pts:undefined}); }
      else { const g=imAplica(K.Hi,[P.x,P.y]); I.pecas[i]=normPecaIm({...P,f:"poli",pts:[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sy])=>imAplica(K.H,[g[0]+sx*P.a,g[1]+sy*P.b]))}); }
      imDesenha(); imGrava(); }
    else if(P){ imMarca(); if(fz==="elip"&&P.f!=="elip"){ const xs=P.pts.map(q=>q[0]), ys=P.pts.map(q=>q[1]), cx=(Math.min(...xs)+Math.max(...xs))/2, cy=(Math.min(...ys)+Math.max(...ys))/2;
        I.pecas[i]=normPecaIm({...P,f:"elip",x:cx,y:cy,rx:(Math.max(...xs)-Math.min(...xs))/2,ry:(Math.max(...ys)-Math.min(...ys))/2*I.img.h/I.img.w,pts:undefined}); }
      else if(fz==="poli"&&P.f==="elip"){ const ry=P.ry*I.img.w/I.img.h; I.pecas[i]=normPecaIm({...P,f:"poli",pts:[[P.x-P.rx,P.y-ry],[P.x+P.rx,P.y-ry],[P.x+P.rx,P.y+ry],[P.x-P.rx,P.y+ry]]}); }
      imDesenha(); imGrava(); }
    imEstilo.zona.f=fz; guardaEstiloIm(); imPainel(); });
  if(q("#ie-reta")) q("#ie-reta").onclick=()=>{ muda(o=>{ delete o.qx; delete o.qy; }); imPainel(); };
  if(q("#ie-s")){ let m=false; q("#ie-s").oninput=e=>{ if(!m){ imMarca(); m=true; } P.s=e.target.value||"Texto"; imDesenha(); imGrava(); }; }
  bx.querySelectorAll("[data-jt]").forEach(b=>b.onclick=()=>{ imMarca(); const n=b.dataset.jt; P.s=`${n}. ${(imNomeJ(I.jogo,n)||"").split(" ")[0]}`.trim(); imDesenha(); imPainel(); imGrava(); });
  if(q("#ie-n")){ let m=false; q("#ie-n").oninput=e=>{ if(!m){ imMarca(); m=true; } P.n=e.target.value||"1"; imDesenha(); imGrava(); }; }
  if(q("#ie-dup")) q("#ie-dup").onclick=imDuplica;
  if(q("#ie-cima")) q("#ie-cima").onclick=()=>{ if(i>=I.pecas.length-1) return; imMarca(); I.pecas.splice(i,1); I.pecas.push(P); imEd.sel=I.pecas.length-1; imDesenha(); imGrava(); };
  if(q("#ie-baixo")) q("#ie-baixo").onclick=()=>{ if(i<=0) return; imMarca(); I.pecas.splice(i,1); I.pecas.unshift(P); imEd.sel=0; imDesenha(); imGrava(); };
  if(q("#ie-del")) q("#ie-del").onclick=imApagaSel;
  if(q("#ie-esc")){ let m=false; q("#ie-esc").oninput=e=>{ if(!m){ imMarca(); m=true; } I.escuro=+e.target.value; imDesenha(); imGrava(); }; q("#ie-esc").onchange=()=>{ m=false; }; }
  if(q("#ie-semcrop")) q("#ie-semcrop").onclick=()=>{ imMarca(); I.crop=null; imDesenha(); imPainel(); imGrava(); }; }

/* ficha da imagem: título, descrição, momento do jogo, jogadores, princípios */
function imFicha(){ const bx=$("ie-ficha"); if(!bx||!imEd) return; if(imEd.op){ bx.innerHTML=""; if(imEd.op.ficha) imEd.op.ficha(bx); return; } const I=imEd.I, regs=imRegs(I.jogo), nm=n=>imNomeJ(I.jogo,n);
  const opReg=r_=>`${r_.parte}.ª ${minutoReg(r_)} · ${descReg(r_)}${r_.j?" · "+r_.j+" "+nm(r_.j):r_.eq==="eles"?" · Adversário":""}`;
  bx.innerHTML=`<h4>Ficha da imagem</h4>
    <label class="f">Título<input type="text" id="if-t" maxlength="120" placeholder="Ex.: Pressão alta depois da perda" value="${esc(I.titulo)}"></label>
    <label class="f">Descrição do lance<textarea id="if-d" rows="4" placeholder="O que aconteceu, o que queremos e o que falhou">${esc(I.desc)}</textarea></label>
    <label class="f">Momento do jogo (lance do Pós-jogo)<select id="if-r"><option value="">${regs.length?"— escolher um lance registado —":"(sem lances registados neste jogo)"}</option>${regs.map(r_=>`<option value="${esc(r_.id)}">${esc(opReg(r_))}</option>`).join("")}</select></label>
    <div class="fields"><label class="f">Parte<select id="if-p"><option value="1">1.ª parte</option><option value="2">2.ª parte</option></select></label><label class="f">Minuto do jogo (mm:ss)<input type="text" id="if-m" inputmode="numeric" placeholder="52:30" value="${I.temT?esc(minutoReg(I)):""}"></label></div>
    <h4>Jogadores na imagem</h4><div class="imjog" id="if-js">${imJogadores(I.jogo).map(x=>`<button class="btn sm" data-n="${esc(x.n)}" aria-pressed="${I.js.includes(x.n)}">${esc(x.n)} ${esc(imPrimUlt(x.nome))}</button>`).join("")}</div>
    <p class="sub" style="margin:0">A imagem entra no relatório de grupo e no relatório individual de cada jogador escolhido.</p>
    <h4>Modelo de Jogo</h4><div id="if-pr"></div>`;
  const q=s=>bx.querySelector(s), salva=()=>{ imDesenha(); imGrava(); };
  q("#if-r").value=I.rid&&regs.some(r_=>r_.id===I.rid)?I.rid:""; q("#if-p").value=String(I.parte);
  q("#if-t").oninput=e=>{ I.titulo=e.target.value; salva(); }; q("#if-d").oninput=e=>{ I.desc=e.target.value; salva(); };
  q("#if-r").onchange=e=>{ const r_=regs.find(x=>x.id===e.target.value); if(!r_){ I.rid=""; salva(); return; } I.rid=r_.id; I.parte=r_.parte; I.seg=r_.seg; I.temT=true; if(r_.j&&!I.js.includes(r_.j)) I.js.push(r_.j); if(!I.titulo) I.titulo=descReg(r_); salva(); imFicha(); };
  const lerT=()=>{ const v=q("#if-m").value.trim(), p=+q("#if-p").value; if(!v){ I.temT=false; I.rid=""; salva(); return; } const s_=seg(v); if(!(s_<1e9)) return; I.parte=p; I.seg=Math.max(0,s_-(p===2?2700:0)); I.temT=true; I.rid=""; q("#if-r").value=""; salva(); };
  q("#if-m").onchange=lerT; q("#if-p").onchange=lerT;
  q("#if-js").querySelectorAll("button").forEach(b=>b.onclick=()=>{ const n=b.dataset.n; I.js=I.js.includes(n)?I.js.filter(x=>x!==n):[...I.js,n]; b.setAttribute("aria-pressed",String(I.js.includes(n))); salva(); });
  const pr=q("#if-pr"), pintaPr=()=>{ pr.innerHTML=(I.princ&&typeof chipsPrinc==="function"?`<div class="imch">${chipsPrinc(I.princ)}</div>`:`<p class="sub" style="margin:0">Sem princípios ligados.</p>`)+
      (typeof folhaEscolhePrinc==="function"?`<button class="btn sm" id="if-prb">🎯 ${I.princ?"Mudar princípios":"Ligar a princípios"}</button>`:"");
    const b=pr.querySelector("#if-prb"); if(b) b.onclick=()=>folhaEscolhePrinc(`Princípios · ${I.titulo||"imagem"}`,I.princ,p=>{ I.princ=p&&p.p?{p:p.p,s:(p.s||[]).slice(0,3)}:null; salva(); pintaPr(); }); };
  pintaPr(); }
