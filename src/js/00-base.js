
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
const ESPECIAIS=[
  {id:"onze",tipo:"JOGO",nome:"Onze Titular",fundo:"pitch",dinamico:"onze",bolas:[],legs:[],ordem:0},
  {id:"encaixe",tipo:"JOGO",nome:"Encaixe",fundo:"pitch",dinamico:"encaixe",bolas:[],legs:[],ordem:.5},
  {id:"intervalo",tipo:"JOGO",nome:"Indicações ao Intervalo",fundo:"pitch-full",campoV:2,semCabecalho:true,arrastavel:true,bolas:null,legs:[],ordem:1},
  {id:"notas",tipo:"JOGO",nome:"Notas do Jogo",fundo:"b-head",dinamico:"notas",bolas:[],legs:[],ordem:2},
  {id:"estat",tipo:"JOGO",nome:"Estatística",fundo:"b-head",dinamico:"estat",bolas:[],legs:[],ordem:1.5}
];
function mapaCampo(o){ const a=[2740,11380,81400,63780], b=[1100,1100,90340,67480];
  const fx=x=>Math.round(b[0]+(x-a[0])/(a[2]-a[0])*(b[2]-b[0])), fy=y=>Math.round(b[1]+(y-a[1])/(a[3]-a[1])*(b[3]-b[1]));
  const C=JSON.parse(JSON.stringify(o)); (C.bolas||[]).forEach(p=>{p.cx=fx(p.cx);p.cy=fy(p.cy);}); (C.adv||[]).forEach(p=>{p.cx=fx(p.cx);p.cy=fy(p.cy);}); (C.bj||[]).forEach(p=>{p.cx=fx(p.cx);p.cy=fy(p.cy);});
  (C.setas||[]).forEach(p=>{p.x1=fx(p.x1);p.y1=fy(p.y1);p.x2=fx(p.x2);p.y2=fy(p.y2); if(p.qx!=null){p.qx=fx(p.qx);p.qy=fy(p.qy);} });
  (C.textos||[]).forEach(p=>{p.x=fx(p.x);p.y=fy(p.y);}); (C.legs||[]).forEach(p=>{p.x=fx(p.x);p.y=fy(p.y);});
  C.campoV=2; C.fundo="pitch-full"; return C; }
function bolasDoOnze(){ const gk=jogo.onze[0]&&jogo.onze[0].slot; return jogo.onze.map(o=>{ const e=o.slot===gk?ESTILOS.gr:ESTILOS.normal; return {slot:o.slot,cx:o.x,cy:o.y,r:1450,fs:12,fill:e.fill,stroke:e.stroke,sw:e.sw,color:e.color}; }); }
const FUNDOS={"pitch-full":{campo:[1100,1100,90340,67480]},"b-meio":{campo:[640,8020,67870,62610]},"b-campo":{campo:[2740,11380,81400,63780]},"pitch":{campo:[2740,11380,81400,63780]}};
const CORES_SETA=[["#000000","Preto"],["#C00000","Vermelho"],["#4F81BD","Azul"],["#9BBB59","Verde"],["#F79646","Laranja"],["#FFC000","Amarelo"]];
let modoSeta=false, corSeta="#000000";
const LOGO_A={x:82391,y:446,w:7254,h:6589}, LOGO_B={x:83111,y:1166,w:7254,h:6589};
function logo(svg,L){ if(L&&L.semCabecalho) return; const p=(L&&(["3","4","5"].includes(String(L.id))||["b-meio","s03","s04","s05"].includes(L.fundo)))?LOGO_A:LOGO_B;
  el("image",{href:"slides/logo.png",x:p.x,y:p.y,width:p.w,height:p.h,preserveAspectRatio:"xMidYMid meet","pointer-events":"none"},svg); }
let nomesOn=false; try{ nomesOn=localStorage.getItem("sca-nomes")==="1"; }catch(e){}
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
function etiqueta(parent,x,y,txt,fs){ fs=fs||9*PT; const tw=textW(txt,fs,700)+700;
  el("rect",{x:x-tw/2,y,width:tw,height:fs*1.35,rx:300,fill:"rgba(27,26,23,.85)"},parent);
  el("text",{x,y:y+fs*1.0,"text-anchor":"middle","font-size":fs,fill:"#fff",class:"lbl"},parent).textContent=txt; }

let est={plantel:PLANTEL_DEF.slice(),linhas:[],fase:"pre"};
let jogo={adversario:"",data:"",onze:ONZE_DEF.map(o=>({...o})),suplentes:[]};
let lancesDb={};
let notas={itens:[]};
let hist={};
let advs={};   // planteis das equipas adversárias (adversarios/<id>)