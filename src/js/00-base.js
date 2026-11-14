
const DEF_LANCES = {{LANCES_BASE}};
const ONZE_DEF = [{"slot":"1","n":"1","pos":"GR","x":7460,"y":37580},{"slot":"30","n":"30","pos":"DE","x":21618,"y":18192},{"slot":"6","n":"6","pos":"DC","x":19259,"y":31292},{"slot":"22","n":"22","pos":"DC","x":19259,"y":43868},{"slot":"3","n":"3","pos":"DD","x":21618,"y":56968},{"slot":"8","n":"8","pos":"MC","x":31844,"y":37580},{"slot":"79","n":"79","pos":"MC","x":41283,"y":26052},{"slot":"40","n":"40","pos":"MC","x":41283,"y":49108},{"slot":"7","n":"7","pos":"EE","x":54656,"y":19764},{"slot":"11","n":"11","pos":"PL","x":58589,"y":37580},{"slot":"4","n":"4","pos":"ED","x":54656,"y":55396}];
const PLANTEL_DEF = ["1","3","4","5","6","7","8","10","11","15","19","20","22","30","40","77","79"].map(n=>({n,nome:""}));
const W=91440, H=68580, PT=127;
const LS_KEY="sca-bolas-paradas-v2";
const ESTILOS={
  normal:{fill:"#C00000",stroke:"#000000",sw:94,color:"#FFFFFF",nome:"Normal"},
  gr:{fill:"#FFFF00",stroke:"#000000",sw:94,color:"#000000",nome:"Guarda-redes"},
  destaque:{fill:"#C00000",stroke:"#FFFF00",sw:286,color:"#FFFFFF",nome:"Destaque"},
  alternativa:{fill:"#FFFFFF",stroke:"#F79646",sw:254,color:"#FF0000",nome:"Alternativa"}
};
/* v123: oculto = fora do separador Bolas Paradas (antes «Quadro»; o Onze passa para a Palestra; os outros ficam escondidos). Os dados e o desenho ficam. v123.2: o Quadro Dinâmico volta */
const ESPECIAIS=[
  {id:"onze",tipo:"JOGO",nome:"Onze Titular",oculto:true,fundo:"pitch",dinamico:"onze",bolas:[],legs:[],ordem:0},
  {id:"encaixe",tipo:"JOGO",nome:"Possíveis Encaixes",fundo:"pitch",dinamico:"encaixe",bolas:[],legs:[],ordem:.5},
  {id:"intervalo",tipo:"JOGO",nome:"Indicações ao Intervalo",oculto:true,fundo:"pitch-full",campoV:2,semCabecalho:true,arrastavel:true,bolas:null,legs:[],ordem:1},
  /* v112.6: quadro livre para falar de opções táticas — sem trocas, sem Ao vivo, sem onze, sem ligação a outros lances (as cópias também são livres) */
  {id:"livre",tipo:"JOGO",nome:"Quadro Livre",fundo:"pitch-setores",campoV:2,semCabecalho:true,arrastavel:true,livre:true,bolas:null,legs:[],ordem:1.2},
  /* v112.11: quadro dinâmico dos espaços — como o livre; as zonas calculam-se das posições do adversário */
  {id:"espacos",tipo:"JOGO",nome:"Quadro Dinâmico",fundo:"pitch-espacos",campoV:2,semCabecalho:true,arrastavel:true,livre:true,espacos:true,bolas:null,legs:[],ordem:1.25},
  {id:"notas",tipo:"JOGO",nome:"Notas do Jogo",oculto:true,fundo:"b-head",dinamico:"notas",bolas:[],legs:[],ordem:2},
  {id:"estat",tipo:"JOGO",nome:"Estatística",oculto:true,fundo:"b-head",dinamico:"estat",bolas:[],legs:[],ordem:1.5}
];
function mapaCampo(o,alvo="pitch-full"){ const a=[2740,11380,81400,63780], b=FUNDOS[alvo].campo;
  const fx=x=>Math.round(b[0]+(x-a[0])/(a[2]-a[0])*(b[2]-b[0])), fy=y=>Math.round(b[1]+(y-a[1])/(a[3]-a[1])*(b[3]-b[1]));
  const C=JSON.parse(JSON.stringify(o)); (C.bolas||[]).forEach(p=>{p.cx=fx(p.cx);p.cy=fy(p.cy);}); (C.adv||[]).forEach(p=>{p.cx=fx(p.cx);p.cy=fy(p.cy);}); (C.bj||[]).forEach(p=>{p.cx=fx(p.cx);p.cy=fy(p.cy);});
  (C.setas||[]).forEach(p=>{p.x1=fx(p.x1);p.y1=fy(p.y1);p.x2=fx(p.x2);p.y2=fy(p.y2); if(p.qx!=null){p.qx=fx(p.qx);p.qy=fy(p.qy);} });
  (C.textos||[]).forEach(p=>{p.x=fx(p.x);p.y=fy(p.y);}); (C.legs||[]).forEach(p=>{p.x=fx(p.x);p.y=fy(p.y);});
  C.campoV=2; C.fundo=alvo; return C; }
function bolasDoOnze(){ const gk=jogo.onze[0]&&jogo.onze[0].slot; return jogo.onze.map(o=>{ const e=o.slot===gk?ESTILOS.gr:ESTILOS.normal; return {slot:o.slot,cx:o.x,cy:o.y,r:1450,fs:12,fill:e.fill,stroke:e.stroke,sw:e.sw,color:e.color}; }); }
const FUNDOS={"pitch-full":{campo:[1100,1100,90340,67480]},"pitch-setores":{campo:[1100,6400,90340,62200]},"pitch-espacos":{campo:[1100,1500,90340,60500]},"b-meio":{campo:[640,8020,67870,62610]},"b-campo":{campo:[2740,11380,81400,63780]},"pitch":{campo:[2740,11380,81400,63780]}};
const CORES_SETA=[["#000000","Preto"],["#C00000","Vermelho"],["#4F81BD","Azul"],["#9BBB59","Verde"],["#F79646","Laranja"],["#FFC000","Amarelo"]];
let modoSeta=false, corSeta="#000000";
const LOGO_A={x:82391,y:446,w:7254,h:6589}, LOGO_B={x:83111,y:1166,w:7254,h:6589};
function logo(svg,L){ if(L&&L.semCabecalho) return; const p=(L&&(["3","4","5"].includes(String(L.id))||["b-meio","s03","s04","s05"].includes(L.fundo)))?LOGO_A:LOGO_B;
  el("image",{href:"slides/logo.png",x:p.x,y:p.y,width:p.w,height:p.h,preserveAspectRatio:"xMidYMid meet","pointer-events":"none"},svg); }
let nomesOn=false; try{ nomesOn=localStorage.getItem("sca-nomes")==="1"; }catch(e){}
/* v112.22: quadros livres (Livre / Dinâmico) mostram a posição do lugar no Onze em vez do número */
let posOn=false; try{ posOn=localStorage.getItem("sca-pos")==="1"; }catch(e){}
/* campo inteiro desenhado (105x70 m) */
function campo(svg,semCab,rect,dims){
  if(!semCab) el("image",{href:"slides/b-head.jpg",x:0,y:0,width:W,height:H,preserveAspectRatio:"none"},svg);
  const [x0,y0,x1,y1]=rect||FUNDOS.pitch.campo, w=x1-x0, h=y1-y0, m=w/((dims&&dims[0])||105), my=h/((dims&&dims[1])||68), lw=190, g=el("g",{},svg);
  const n=18; for(let i=0;i<n;i++) el("rect",{x:x0+i*w/n,y:y0,width:w/n+1,height:h,fill:i%2?"#EEEEEE":"#FFFFFF"},g);
  const L={fill:"none",stroke:"#111","stroke-width":lw};
  const cy=y0+h/2, pa=40.32*my, ga=18.32*my, gw=7.32*my;
  [[x0,1],[x1,-1]].forEach(([gx,d])=>{
    el("rect",{x:d>0?gx:gx-16.5*m,y:cy-pa/2,width:16.5*m,height:pa,...L},g);
    el("rect",{x:d>0?gx:gx-5.5*m,y:cy-ga/2,width:5.5*m,height:ga,...L},g);
    el("circle",{cx:gx+d*11*m,cy,r:lw*1.6,fill:"#111"},g);
    const a=Math.acos(5.5/9.15), px=gx+d*11*m;
    el("path",{d:`M ${gx+d*16.5*m} ${cy-9.15*my*Math.sin(a)} A ${9.15*m} ${9.15*my} 0 0 ${d>0?1:0} ${gx+d*16.5*m} ${cy+9.15*my*Math.sin(a)}`,...L},g);
    const gx2=d>0?gx-2*m:gx; el("rect",{x:gx2,y:cy-gw/2,width:2*m,height:gw,fill:"#D9D9D9",stroke:"#111","stroke-width":lw*.8},g);
    for(let k=1;k<4;k++) el("line",{x1:gx2,x2:gx2+2*m,y1:cy-gw/2+k*gw/4,y2:cy-gw/2+k*gw/4,stroke:"#888","stroke-width":60},g);
  });
  el("line",{x1:x0+w/2,x2:x0+w/2,y1:y0,y2:y1,...L},g);
  el("ellipse",{cx:x0+w/2,cy,rx:9.15*m,ry:9.15*my,...L},g);
  el("circle",{cx:x0+w/2,cy,r:lw*1.6,fill:"#111"},g);
  [[x0,y0,0,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]].forEach(([cx,cy_,dx,dy])=>{ const r=1.2*m;
    el("path",{d:`M ${cx+(dx||1)*r*(dx?1:0)} ${cy_} A ${r} ${r} 0 0 ${dx*dy>0?1:0} ${cx} ${cy_+dy*r}`,...L},g); });
  el("rect",{x:x0,y:y0,width:w,height:h,...L,"stroke-width":lw*1.3},g);
}
/* v112.8: campo com 5 corredores (limites da grande e da pequena área) e 3 terços, legendas por fora: em cima a organização ofensiva, em baixo a defensiva (atacamos para a direita) */
const TERCOS_OF=["1.ª fase · Construção","2.ª fase · Ligação / Criação","3.ª fase · Finalização / Decisão"];
/* v112.11: na defesa a 1.ª fase é a pressão (lê-se ao contrário) */
const TERCOS_DEF=["3.ª fase · Defesa da baliza (bloco baixo)","2.ª fase · Equilíbrio (bloco médio)","1.ª fase · Pressão (bloco alto)"];
/* v112.23: as linhas dos 3 terços e dos 5 corredores servem também de fundo ao Quadro Dinâmico */
function gridSetores(svg,R,fs){ const [x0,y0,x1,y1]=R, w=x1-x0, h=y1-y0, g=el("g",{"pointer-events":"none"},svg), T={stroke:"#7F7F7F","stroke-width":120,"stroke-dasharray":"700 450",fill:"none"};
  [1,2].forEach(k=>el("line",{x1:x0+k*w/3,x2:x0+k*w/3,y1:y0,y2:y1,...T,stroke:"#1B1A17","stroke-width":160},g));
  [13.84,24.84,43.16,54.16].forEach(m=>{ const y=y0+m/68*h; el("line",{x1:x0,x2:x1,y1:y,y2:y,...T},g); });
  /* títulos das fases por fora do campo: em cima a ofensiva, em baixo a defensiva */
  const txt=(x,y,t,cor)=>{ el("text",{x,y,"text-anchor":"middle","font-size":fs,fill:cor,class:"lbl"},g).textContent=t; };
  TERCOS_OF.forEach((t,k)=>txt(x0+(k+.5)*w/3,y0-Math.min(fs*.75,y0-fs*.75),t,"#C00000"));
  TERCOS_DEF.forEach((t,k)=>txt(x0+(k+.5)*w/3,y1+fs*1.55,t,"#1F497D"));
  return g; }
function campoSetores(svg){ const R=FUNDOS["pitch-setores"].campo; campo(svg,true,R); gridSetores(svg,R,11*PT); }
/* v112.11: Quadro Dinâmico — espaços em relação às linhas do adversário (atacamos para a direita, o adversário defende a baliza da direita).
   Linhas: peças com «linha» escolhida à mão (1, 2, 3, gr); as outras repartem-se pelas 2 maiores distâncias em x (de trás para a frente: 1.ª linha de pressão = a mais perto da nossa baliza) */
/* cores escolhidas pelo Rodrigo (05/11/2026): verde, amarelo, azul, laranja, roxo */
const ESPACOS=[["Construção","antes da 1.ª linha de pressão","#1E7A46"],["Ligação","entre a 1.ª e a 2.ª linha","#FFC000"],["Criação","entre a 2.ª e a 3.ª linha","#0070C0"],["Largura","fora do bloco, por fora","#F79646"],["Profundidade","atrás da última linha, até ao GR","#7030A0"]];
function linhasAdv(adv){ const ps=(adv||[]).map((a,i)=>({x:a.cx,y:a.cy,i,l:a.linha||(a.gr?"gr":"")}));
  const gr=ps.find(p=>p.l==="gr")||null, L=[[],[],[]], auto=ps.filter(p=>p!==gr&&!["1","2","3"].includes(p.l)).sort((a,b)=>a.x-b.x);
  ps.forEach(p=>{ if(["1","2","3"].includes(p.l)) L[+p.l-1].push(p); });
  if(auto.length){ const cortes=auto.slice(1).map((p,k)=>[p.x-auto[k].x,k+1]).sort((a,b)=>b[0]-a[0]).slice(0,2).map(c=>c[1]).sort((a,b)=>a-b);
    let g=0; auto.forEach((p,k)=>{ if(cortes.includes(k)) g++; L[g].push(p); }); }
  return {L:L.map(l=>l.sort((a,b)=>a.y-b.y)),gr}; }
function xDaLinha(l,y){ if(!l.length) return null; if(y<=l[0].y) return l[0].x; if(y>=l[l.length-1].y) return l[l.length-1].x;
  for(let k=1;k<l.length;k++) if(y<=l[k].y){ const a=l[k-1], b=l[k], t=(y-a.y)/((b.y-a.y)||1); return a.x+t*(b.x-a.x); } return l[l.length-1].x; }
/* v113.9: a Largura começa no adversário mais largo (como antes) e acaba no NOSSO jogador mais aberto desse lado, entre a 1.ª e a 3.ª linha
   (colado à linha lateral = até à linha, como antes; por dentro = zona mais pequena; sem ninguém nosso mais aberto que o adversário = sem Largura desse lado).
   Sem peças nossas no quadro, vai até à linha lateral. */
function limitesLargura(L,R,nos,yA,yB){ const [x0,y0,x1,y1]=R, my=(y1-y0)/68; if(!nos||!nos.length) return [y0,y1];
  const xa=Math.min(...L[0].map(p=>p.x))-3*my, xb=Math.max(...L[2].map(p=>p.x))+3*my, ns=nos.filter(b=>b.cx>=xa&&b.cx<=xb);
  const cima=ns.filter(b=>b.cy<yA).map(b=>b.cy), baixo=ns.filter(b=>b.cy>yB).map(b=>b.cy);
  return [cima.length?Math.max(y0,Math.min(...cima)-my):yA, baixo.length?Math.min(y1,Math.max(...baixo)+my):yB]; }
function zonasEspacos(adv,R,nos){ const [x0,y0,x1,y1]=R, my=(y1-y0)/68, {L,gr}=linhasAdv(adv); if(L.some(l=>!l.length)) return null;
  const todos=L.flat(), yA=Math.max(y0,Math.min(...todos.map(p=>p.y))-my), yB=Math.min(y1,Math.max(...todos.map(p=>p.y))+my), xG=gr?Math.max(gr.x,x0):x1, [lc,lb]=limitesLargura(L,R,nos,yA,yB);
  const f=[y=>x0,y=>xDaLinha(L[0],y),y=>Math.max(xDaLinha(L[0],y),xDaLinha(L[1],y)),y=>Math.max(xDaLinha(L[0],y),xDaLinha(L[1],y),xDaLinha(L[2],y)),y=>Math.max(xG,xDaLinha(L[0],y),xDaLinha(L[1],y),xDaLinha(L[2],y))];
  const faixa=(a,b,ya,yb)=>{ if(yb-ya<1) return null; const n=24, ys=[...Array(n+1)].map((_,k)=>ya+(yb-ya)*k/n);
    return {pts:ys.map(y=>[f[a](y),y]).concat(ys.slice().reverse().map(y=>[f[b](y),y])),cx:(f[a]((ya+yb)/2)+f[b]((ya+yb)/2))/2,cy:(ya+yb)/2,w:f[b]((ya+yb)/2)-f[a]((ya+yb)/2),h:yb-ya}; };
  return {L,yA,yB,z:[[0,faixa(0,1,y0,y1)],[1,faixa(1,2,yA,yB)],[2,faixa(2,3,yA,yB)],[3,faixa(1,3,lc,yA)],[3,faixa(1,3,yB,lb)],[4,faixa(3,4,y0,y1)]].filter(z=>z[1])}; }
function desenhaEspacos(svg,adv,velho,nos){ const R=FUNDOS["pitch-espacos"].campo, [x0,y0,x1,y1]=R, g=el("g",{class:"espacos","pointer-events":"none"});
  if(velho){ velho.parentNode.insertBefore(g,velho); velho.remove(); } else svg.appendChild(g);
  const Z=zonasEspacos(adv,R,nos), fs=12*PT;
  if(!Z){ el("text",{x:(x0+x1)/2,y:(y0+y1)/2,"text-anchor":"middle","font-size":fs,fill:"#1B1A17",class:"lbl"},g).textContent="Põe pelo menos 3 adversários de campo para ver os espaços"; return g; }
  Z.z.forEach(([k,z])=>{ el("polygon",{points:z.pts.map(p=>p.map(Math.round).join(",")).join(" "),fill:ESPACOS[k][2],"fill-opacity":.28,stroke:"none"},g); });
  Z.L.forEach(l=>{ const n=24, d=[...Array(n+1)].map((_,k)=>{ const y=Z.yA+(Z.yB-Z.yA)*k/n; return `${k?"L":"M"} ${Math.round(xDaLinha(l,y))} ${Math.round(y)}`; }).join(" ");
    el("path",{d,fill:"none",stroke:"#C00000","stroke-width":170,"stroke-linejoin":"round"},g); });   // v112.24/25: vermelho e cheio, para não se confundirem com o grid (preto/cinzento, tracejado)
  Z.z.forEach(([k,z])=>{ if(z.w<2500||z.h<2500) return; const f2=Math.min(fs,z.w/(textW(ESPACOS[k][0],fs,700)/fs)*.9);
    el("text",{x:Math.round(z.cx),y:Math.round(z.cy+f2*.35),"text-anchor":"middle","font-size":f2,fill:"#1B1A17",stroke:"#FFFFFF","stroke-width":f2*.18,"paint-order":"stroke",class:"lbl"},g).textContent=ESPACOS[k][0]; });
  return g; }
function legendaEspacos(svg){ const [x0,,x1,y1]=FUNDOS["pitch-espacos"].campo, n=ESPACOS.length, w=(x1-x0)/n, fs=9.5*PT, g=el("g",{"pointer-events":"none"},svg);
  ESPACOS.forEach(([nm,def,c],k)=>{ const x=x0+k*w, y=y1+4000; el("rect",{x:x+200,y:y-fs*.8,width:fs*.9,height:fs*.9,fill:c,"fill-opacity":.55,stroke:c,"stroke-width":60},g);
    const t=el("text",{x:x+200+fs*1.25,y,"font-size":fs,class:"lbl"},g); el("tspan",{fill:"#1B1A17","font-weight":800},t).textContent=nm; el("tspan",{x:x+200+fs*1.25,dy:fs*1.15,fill:"#55524B","font-weight":400,"font-size":fs*.82},t).textContent=def; }); }
/* posições de partida: o onze do adversário do jogo atual (como no Encaixe) ou um 1-4-4-2 */
function advEspacos(){ const R=FUNDOS["pitch-espacos"].campo, [x0,y0,x1,y1]=R, mx=m=>Math.round(x0+m/105*(x1-x0)), my=m=>Math.round(y0+m/68*(y1-y0));
  const A=typeof advJ==="function"?advJ():null, C=(A&&A.cores)||{cam:"#1F4E9A",cam2:"#FFFFFF",gr:"#2E9E4F"};
  const peca=(cx,cy,gr)=>({cx,cy,r:1450,fill:gr?C.gr:C.cam,stroke:C.cam2,sw:160,...(gr?{gr:true}:{})});
  try{ const on=advEmCampo().on, E=normEncaixe(jogo.encaixe).adv;
    if(on.length>=8){ const P=FUNDOS.pitch.campo, ps=on.map((o,i)=>{ const q=E[o.slot]||{x:o.x,y:o.y}; return {x:(q.x-P[0])/(P[2]-P[0])*105,y:(q.y-P[1])/(P[3]-P[1])*68,gr:o.slot==="GR"||(i===0&&!on.some(z=>z.slot==="GR"))}; });
      const g=ps.find(p=>p.gr), media=ps.reduce((a,p)=>a+p.x,0)/ps.length, vira=g&&g.x<media;
      if(ps.every(p=>isFinite(p.x)&&isFinite(p.y))) return ps.map(p=>peca(mx(vira?105-p.x:p.x),my(p.y),p.gr)); } }catch(e){}
  return [[102,34,1],[84,9],[86,26],[86,42],[84,59],[68,10],[70,27],[70,41],[68,58],[54,29],[54,39]].map(([x,y,gr])=>peca(mx(x),my(y),!!gr)); }
function etiqueta(parent,x,y,txt,fs){ fs=fs||9*PT; const tw=textW(txt,fs,700)+700;
  el("rect",{x:x-tw/2,y,width:tw,height:fs*1.35,rx:300,fill:"rgba(27,26,23,.85)"},parent);
  el("text",{x,y:y+fs*1.0,"text-anchor":"middle","font-size":fs,fill:"#fff",class:"lbl"},parent).textContent=txt; }

let est={plantel:PLANTEL_DEF.slice(),linhas:[],fase:"pre"};
let jogo={adversario:"",data:"",onze:ONZE_DEF.map(o=>({...o})),suplentes:[]};
let lancesDb={};
let notas={itens:[]};
let hist={};
let advs={};   // planteis das equipas adversárias (adversarios/<id>)