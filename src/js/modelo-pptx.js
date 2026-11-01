/* ---------- Modelo de Jogo em PowerPoint (v112) ----------
   Gera um .pptx a partir dos princípios e textos da app, no estilo do documento do treinador principal (cores por momento, tabelas).
   A biblioteca (PptxGenJS, MIT) vem embutida no ficheiro da app (<script type="text/plain" id="lib-pptx">) e só se lê ao exportar:
   sem pedidos a sites externos. O ZIP é o da app (zipFicheiros, sem compressão), através de um JSZip mínimo. */
function ZipPptx(){ this.f=[]; this.pre=""; }
ZipPptx.prototype.folder=function(n){ const z=Object.create(ZipPptx.prototype); z.f=this.f; z.pre=this.pre+String(n).replace(/\/?$/,"/"); return z; };
ZipPptx.prototype.file=function(n,d,o){ this.f.push({nome:this.pre+n,d,o:o||{}}); return this; };
ZipPptx.prototype.generateAsync=async function(o){ const enc=new TextEncoder(), fs=[];
  for(const x of this.f){ let b; const d=x.d;
    if(x.o.base64){ const bin=atob(String(d).replace(/^data:[^,]*,/,"")); b=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) b[i]=bin.charCodeAt(i); }
    else if(typeof d==="string") b=enc.encode(d); else if(d instanceof Uint8Array) b=d; else if(d instanceof ArrayBuffer) b=new Uint8Array(d);
    else if(typeof Blob!=="undefined"&&d instanceof Blob) b=new Uint8Array(await d.arrayBuffer()); else b=enc.encode(String(d??""));
    fs.push({nome:x.nome,dados:b}); }
  const blob=zipFicheiros(fs); if(o&&o.type==="base64"){ const u=new Uint8Array(await blob.arrayBuffer()); let s=""; for(let i=0;i<u.length;i+=32768) s+=String.fromCharCode.apply(null,u.subarray(i,i+32768)); return btoa(s); }
  return blob; };
function libPptx(){ if(window.PptxGenJS) return window.PptxGenJS; const el=$("lib-pptx"); if(!el) throw new Error("lib");
  window.PptxGenJS=new Function("JSZip",el.textContent+"\n;return PptxGenJS;")(ZipPptx); return window.PptxGenJS; }

const PX={bg:"F5F4F0",ink:"1B1D22",navy:"17325C",gold:"C9A227",grey:"6B6F76",line:"D9D6CF",dark:"222428",white:"FFFFFF",oo:"23844A",td:"222428",od:"C8102E",to:"2C4E9C",tr:"17325C"};
const PX_TINT={oo:"E8F1EA",td:"E6E6E6",od:"F7E6E8",to:"E7ECF5",tr:"E6EAF1"};
/* constrói a apresentação; devolve o objeto PptxGenJS (os testes leem-no sem gravar) */
function deckModelo(){ const Pptx=libPptx(), pres=new Pptx(); pres.layout="LAYOUT_WIDE"; pres.title="Modelo de Jogo"; pres.company="SC Angrense";
  const W=13.333, M=.6, F="Arial", I=modeloTxt.identidade||{}, hoje=new Date().toLocaleDateString("pt-PT");
  const FOOT=`MODELO DE JOGO · SC ANGRENSE · ${hoje}`;
  pres.defineSlideMaster({title:"CONT",background:{color:PX.bg},objects:[{text:{text:FOOT,options:{x:M,y:7.02,w:9,h:.3,fontSize:8,color:PX.grey,fontFace:F,margin:0}}}],slideNumber:{x:12.2,y:7.02,w:.6,h:.3,fontSize:8,color:PX.grey,fontFace:F,align:"right"}});
  pres.defineSlideMaster({title:"ESC",background:{color:PX.dark}});
  const T=(s,t,o)=>s.addText(t,Object.assign({isTextBox:true,margin:0,fontFace:F,color:PX.ink,valign:"top"},o));
  const head=(kicker,title,cor)=>{ const s=pres.addSlide({masterName:"CONT"});
    s.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:.12,h:7.5,fill:{color:cor},line:{color:cor,width:0}});
    T(s,String(kicker).toUpperCase(),{x:M,y:.32,w:11,h:.3,fontSize:11,bold:true,color:cor});
    T(s,String(title).toUpperCase(),{x:M,y:.62,w:12,h:.6,fontSize:26,bold:true,valign:"middle"});
    s.addShape(pres.shapes.RECTANGLE,{x:M-.02,y:1.3,w:1.3,h:.05,fill:{color:cor},line:{color:cor,width:0}}); return s; };
  const tbl=(s,cab,rows,o)=>{ const fs=o.fs||11, cor=o.cor, tint=o.tint||"EEEEEE";
    const H=cab.map(h=>({text:String(h).toUpperCase(),options:{bold:true,color:PX.white,fill:{color:cor},fontSize:fs,valign:"middle",fontFace:F}}));
    const R=rows.map((r,i)=>r.map((c,j)=>{ const b=typeof c==="string"?{t:c,o:{}}:c; return {text:b.t,options:Object.assign({fontSize:fs,valign:"middle",color:PX.ink,fontFace:F,fill:{color:j===0&&o.first!==false?tint:(i%2?"EFEEEA":"FFFFFF")},bold:j===0&&o.first!==false},b.o)}; }));
    s.addTable([H,...R],{x:o.x||M,y:o.y,w:o.w||W-2*M,colW:o.colW,rowH:o.rowH||.3,margin:[.05,.1,.05,.1],border:{type:"solid",pt:.5,color:PX.line},autoPage:false}); };
  const bul=it=>(it||[]).map((p,j,a)=>({text:p,options:{bullet:true,breakLine:j<a.length-1}}));
  const card=(s,x,y,w,h)=>s.addShape(pres.shapes.RECTANGLE,{x,y,w,h,fill:{color:PX.white},line:{color:PX.line,width:.75}});
  const momCor=k=>PX[k]||PX.navy;
  const divisor=(k)=>{ const Mm=pMom(k), Tt=modeloTxt["mom-"+k]||{}, s=pres.addSlide({masterName:"ESC"}); s.background={color:momCor(k)};
    T(s,Mm[3],{x:M,y:.7,w:3,h:1.2,fontSize:66,bold:true,color:PX.white}); T(s,Mm[1].toUpperCase(),{x:M,y:2.2,w:11,h:.8,fontSize:36,bold:true,color:PX.white});
    s.addShape(pres.shapes.RECTANGLE,{x:M,y:3.25,w:1.3,h:.06,fill:{color:PX.gold},line:{color:PX.gold,width:0}});
    if(Tt.pergunta){ T(s,"PERGUNTA-CHAVE",{x:M,y:3.55,w:5,h:.3,fontSize:11,bold:true,color:PX.gold}); T(s,Tt.pergunta,{x:M,y:3.9,w:11,h:.6,fontSize:22,color:PX.white}); }
    if(Tt.macro){ T(s,"MACROPRINCÍPIO",{x:M,y:4.85,w:5,h:.3,fontSize:11,bold:true,color:PX.gold}); T(s,`«${Tt.macro}»`,{x:M,y:5.2,w:11,h:.5,fontSize:20,bold:true,color:PX.white}); }
    if(Tt.frase) T(s,Tt.frase,{x:M,y:6.55,w:11,h:.4,fontSize:12,color:PX.white}); };
  const linhaTxt=(s,label,txt,cor,y)=>{ T(s,label,{x:M,y,w:1.6,h:.4,fontSize:12,bold:true,color:cor,valign:"middle"}); T(s,txt,{x:M+1.65,y,w:10.5,h:.4,fontSize:13,valign:"middle"}); };

  /* capa */
  let s=pres.addSlide({masterName:"ESC"});
  T(s,"SC ANGRENSE · MODELO DE JOGO",{x:M,y:.9,w:11,h:.4,fontSize:14,bold:true,color:PX.gold});
  T(s,"O NOSSO JOGO",{x:M,y:1.5,w:11,h:1.1,fontSize:60,bold:true,color:PX.white});
  T(s,"Modelo de jogo da equipa sénior · documento da equipa técnica",{x:M,y:2.75,w:11,h:.5,fontSize:22,color:PX.white});
  s.addShape(pres.shapes.RECTANGLE,{x:M,y:3.55,w:1.3,h:.06,fill:{color:PX.gold},line:{color:PX.gold,width:0}});
  T(s,`Exportado da SCA Performance · ${hoje}`,{x:M,y:3.85,w:11,h:.4,fontSize:14,color:PX.gold});
  if(I.lema) T(s,I.lema,{x:M,y:6.3,w:11,h:.5,fontSize:18,bold:true,color:PX.white});

  /* identidade */
  if((I.valores||[]).length){ s=head("Valores inegociáveis","Identidade operacional",PX.navy);
    tbl(s,["Valor","Significado","Comportamentos inegociáveis","Evidência no campo"],I.valores.map(v=>[String(v.nome).toUpperCase(),v.sig||"",(v.comps||[]).join(" · "),v.evid||""]),{y:1.6,cor:PX.navy,tint:PX_TINT.tr,colW:[2.1,2.4,5.1,2.533],fs:11.5,rowH:.95}); }
  if((I.macros||[]).length){ s=head("Uma frase por momento","Macroprincípios",PX.navy);
    I.macros.forEach((m,i)=>{ const x=M+i*4.1, cor=m.mom==="oo"?PX.oo:m.mom==="od"?PX.od:PX.to; card(s,x,1.75,3.8,3.6);
      T(s,m.mom==="oo"?"ORGANIZAÇÃO OFENSIVA":m.mom==="od"?"ORGANIZAÇÃO DEFENSIVA":"TRANSIÇÕES",{x:x+.25,y:1.95,w:3.3,h:.3,fontSize:11,bold:true,color:cor});
      T(s,`«${m.frase}»`,{x:x+.25,y:2.35,w:3.3,h:1,fontSize:20,bold:true}); T(s,m.desc||"",{x:x+.25,y:3.45,w:3.3,h:1.2,fontSize:13,color:PX.grey});
      if(m.valores) T(s,"VALORES: "+String(m.valores).toUpperCase(),{x:x+.25,y:4.8,w:3.3,h:.4,fontSize:10,bold:true,color:cor}); });
    if(I.lema){ T(s,"LEMA DO MODELO",{x:M,y:5.65,w:4,h:.3,fontSize:11,bold:true,color:PX.gold}); T(s,I.lema,{x:M,y:5.95,w:12,h:.5,fontSize:22,bold:true}); } }
  if((I.gerais||[]).length||(I.fundOf||[]).length){ s=head("Base comum de linguagem","Princípios do futebol",PX.navy);
    [["PRINCÍPIOS GERAIS",I.gerais,PX.navy],["FUNDAMENTAIS OFENSIVOS",I.fundOf,PX.oo],["FUNDAMENTAIS DEFENSIVOS",I.fundDef,PX.od]].forEach(([t,it,cor],i)=>{ const x=M+i*4.1; card(s,x,1.7,3.8,4.2);
      T(s,t,{x:x+.25,y:1.9,w:3.3,h:.3,fontSize:12,bold:true,color:cor}); T(s,bul(it),{x:x+.25,y:2.4,w:3.3,h:3.3,fontSize:14,paraSpaceAfter:8}); }); }
  /* quadro-base */
  const momsT=["oo","td","od","to"].filter(k=>princLista().some(P=>P.mom===k));
  if(momsT.length){ s=head("Fundamento do modelo","Quadro-base dos quatro momentos",PX.navy);
    tbl(s,["Momento","Pergunta-chave","Macroprincípio","Princípios do nosso jogo"],momsT.map(k=>{ const Tt=modeloTxt["mom-"+k]||{};
      return [{t:pMom(k)[1].toUpperCase(),o:{fill:{color:momCor(k)},color:PX.white}},Tt.pergunta||"",Tt.macro?`«${Tt.macro}»`:"",princLista().filter(P=>P.mom===k&&P.nivel==="princ").map(P=>P.nome).join(" · ")]; }),
      {y:1.6,cor:PX.navy,colW:[2.4,2.8,2.4,4.533],fs:11,rowH:.8});
    T(s,`Códigos: OO, TD, OD, TO + n.º do princípio (ex.: OD-3) e do microprincípio (ex.: OD-3.2). Cada exercício liga-se a 1 princípio principal e até ${P_MAX_SEC} secundários.`,{x:M,y:6.45,w:12,h:.5,fontSize:10.5,color:PX.grey}); }
  /* estruturas e plano */
  const E=modeloTxt.estruturas||{}, Pl=modeloTxt.plano||{};
  if(E.base||E.alt){ s=head("Estrutura como ferramenta","Uma identidade, duas estruturas",PX.navy);
    if(E.comuns){ T(s,"PRINCÍPIOS COMUNS",{x:M,y:1.55,w:4,h:.3,fontSize:11,bold:true,color:PX.gold}); T(s,E.comuns,{x:M,y:1.85,w:12,h:.35,fontSize:15}); }
    [E.base,E.alt].filter(Boolean).forEach((x,i)=>{ const xx=M+i*6.2; card(s,xx,2.45,5.9,2.9); T(s,String(x.nome||"").toUpperCase(),{x:xx+.3,y:2.65,w:5,h:.3,fontSize:11,bold:true,color:i?PX.od:PX.oo});
      T(s,x.sis||"",{x:xx+.3,y:3,w:5,h:.7,fontSize:30,bold:true}); T(s,x.txt||"",{x:xx+.3,y:3.85,w:5.3,h:1.3,fontSize:14,color:PX.grey}); });
    s.addShape(pres.shapes.RECTANGLE,{x:M,y:5.7,w:9.6,h:.5,fill:{color:PX.navy},line:{color:PX.navy,width:0}}); s.addShape(pres.shapes.RECTANGLE,{x:M+9.6,y:5.7,w:2.533,h:.5,fill:{color:PX.gold},line:{color:PX.gold,width:0}});
    T(s,"80% IDENTIDADE",{x:M,y:5.7,w:9.6,h:.5,fontSize:13,bold:true,color:PX.white,align:"center",valign:"middle"}); T(s,"20% ESTRATÉGIA",{x:M+9.6,y:5.7,w:2.533,h:.5,fontSize:13,bold:true,color:PX.white,align:"center",valign:"middle"}); }
  /* transversais */
  const trs=princLista().filter(P=>P.nivel==="tr");
  if(trs.length){ s=head("Base comum","Princípios transversais",PX.navy);
    trs.slice(0,6).forEach((P,i)=>{ const x=M+(i%2)*6.2, y=1.6+Math.floor(i/2)*1.6; card(s,x,y,5.9,1.4);
      T(s,P.cod,{x:x+.2,y:y+.15,w:.8,h:.3,fontSize:12,bold:true,color:PX.gold}); T(s,P.nome.toUpperCase(),{x:x+1,y:y+.15,w:4.7,h:.3,fontSize:14,bold:true});
      T(s,P.txt||"",{x:x+1,y:y+.48,w:4.7,h:.45,fontSize:12}); const ms=microsDe(P.cod).map(m=>m.nome).join(" · "); if(P.comp||ms) T(s,[P.comp,ms].filter(Boolean).join(" · "),{x:x+1,y:y+.95,w:4.7,h:.4,fontSize:10.5,italic:true,color:PX.oo}); }); }

  /* momentos */
  ["oo","td","od","to"].forEach(k=>{ const ps=princLista().filter(P=>P.mom===k&&P.nivel==="princ"); if(!ps.length) return; const Tt=modeloTxt["mom-"+k]||{}, cor=momCor(k), tint=PX_TINT[k];
    divisor(k);
    s=head("Princípios, comportamentos e indicadores",pMom(k)[1],cor); let y=1.5;
    if(Tt.intencao){ linhaTxt(s,"INTENÇÃO",Tt.intencao,cor,y); y+=.45; } if(Tt.po){ linhaTxt(s,"PRINCÍPIO OP.",Tt.po,cor,y); y+=.5; }
    tbl(s,["Princípio","Comportamento observável","Indicador de sucesso","Microprincípios"],ps.map(P=>[`${P.cod} ${P.nome.toUpperCase()}`,P.comp,P.ind,microsDe(P.cod).map(m=>m.nome).join(" · ")||P.txt]),{y:y+.05,cor,tint,colW:[2.6,3.4,2.8,3.333],fs:10.5,rowH:.7});
    /* microprincípios: blocos por princípio, até ~11 linhas por slide */
    let bloco=[], linhas=0; const despeja=()=>{ if(!bloco.length) return; const sl=head(pMom(k)[1],bloco.map(P=>P.cod).join(" · ")+" · microprincípios",cor); let yy=1.55;
      bloco.forEach(P=>{ const ms=microsDe(P.cod); T(sl,`${P.cod}  ${P.nome.toUpperCase()}`,{x:M,y:yy,w:12,h:.3,fontSize:13,bold:true,color:cor});
        T(sl,[{text:"Comportamento: ",options:{bold:true}},{text:(P.comp||"")+"   "},{text:"Indicador: ",options:{bold:true}},{text:P.ind||""}],{x:M,y:yy+.3,w:12.1,h:.3,fontSize:10,color:PX.grey}); yy+=.65;
        tbl(sl,["Código","Microprincípio","O que queremos ver"],ms.map(m=>[m.cod,m.nome+(m.estado==="construcao"?" (em construção)":""),m.txt]),{y:yy,cor,tint,colW:[.9,3.6,7.633],fs:10.5,rowH:.3});
        yy+=.34+ms.length*.36+.25; }); bloco=[]; linhas=0; };
    ps.filter(P=>microsDe(P.cod).length).forEach(P=>{ const n=microsDe(P.cod).length+2; if(linhas&&linhas+n>12) despeja(); bloco.push(P); linhas+=n; }); despeja();
    /* fases / altura do bloco */
    if((Tt.fases||[]).length){ s=head(k==="od"?"Pressão e altura do bloco":"Da construção à finalização",k==="od"?"Altura do bloco":"Fases",cor);
      tbl(s,[k==="od"?"Altura":"Fase","Objetivo","Comportamentos",k==="od"?"Referências":"Rotina padrão"],Tt.fases.map(f=>[String(f.nome).toUpperCase(),f.obj||"",f.comp||"",f.rot||""]),{y:1.6,cor,tint,colW:[2.2,3.2,4.1,2.633],fs:11.5,rowH:1});
      const rots=princLista().filter(P=>P.mom===k&&P.nivel==="rot"); if(rots.length) T(s,rots.map(r=>`${r.cod} ${r.nome}${r.estado==="construcao"?" (em construção)":""}`).join(" · "),{x:M,y:5.9,w:12.1,h:.4,fontSize:11,color:PX.grey});
      if(Tt.regraFases) T(s,Tt.regraFases,{x:M,y:6.4,w:12.1,h:.35,fontSize:13,bold:true,color:cor,align:"center"}); }
    /* decisão (transições) */
    const D=Tt.decisao; if(D&&(D.sim||D.nao)){ s=head(pMom(k)[1],D.pergunta||"Decisão",cor);
      [[D.sim,PX.oo],[D.nao,PX.od]].forEach(([x,c],i)=>{ if(!x) return; const xx=M+i*6.2; card(s,xx,1.7,5.9,4.2); T(s,String(x.t||"").toUpperCase(),{x:xx+.3,y:1.9,w:5.3,h:.45,fontSize:18,bold:true,color:c});
        T(s,bul(x.itens),{x:xx+.3,y:2.5,w:5.3,h:2.4,fontSize:14,paraSpaceAfter:6}); if(x.nota) T(s,x.nota,{x:xx+.3,y:5.1,w:5.3,h:.6,fontSize:12,italic:true,color:c}); });
      if(D.regra) T(s,D.regra,{x:M,y:6.2,w:12.1,h:.45,fontSize:13,bold:true,color:cor,align:"center"}); }
    /* estruturas por momento */
    const linhasE=k==="oo"?E.ataque:k==="od"?E.defesa:null;
    if((linhasE||[]).length){ s=head(pMom(k)[1],k==="oo"?"Os mesmos princípios em duas estruturas":"Comportamentos defensivos por estrutura",cor);
      tbl(s,[k==="oo"?"Fase":"Referência",(E.base||{}).sis||"Base",(E.alt||{}).sis||"Alternativa"],linhasE.map(r=>[String(r.ref).toUpperCase(),r.base,r.alt]),{y:1.6,cor,tint,colW:[2.2,4.966,4.966],fs:12,rowH:.85}); } });

  /* bolas paradas, plano, indicadores, em construção */
  const B=modeloTxt.bp||{};
  if((B.of||[]).length||(B.def||[]).length){ s=head("Situações específicas","Bolas paradas: anexo ao modelo",PX.gold); if(B.intro) T(s,B.intro,{x:M,y:1.5,w:12,h:.5,fontSize:14});
    [["MATRIZ OFENSIVA",B.of],["MATRIZ DEFENSIVA",B.def]].forEach(([t,it],i)=>{ const x=M+i*6.2; card(s,x,2.2,5.9,3.4); T(s,t,{x:x+.3,y:2.4,w:5,h:.35,fontSize:15,bold:true}); T(s,bul(it),{x:x+.3,y:2.9,w:5.3,h:2.5,fontSize:14,paraSpaceAfter:6}); });
    if(B.prio) T(s,"PRIORIDADES: "+B.prio,{x:M,y:5.9,w:12.1,h:.45,fontSize:13,bold:true,color:"C55A11",align:"center"}); }
  if((Pl.ident||[]).length){ s=head("Identidade e adaptação","Plano estratégico",PX.navy);
    [["80%","IDENTIDADE",Pl.ident,PX.navy],["20%","ADAPTAÇÃO",Pl.adapt,PX.gold]].forEach(([n,t,it,c],i)=>{ const x=M+i*6.2; T(s,n,{x,y:1.6,w:3,h:1,fontSize:54,bold:true,color:c}); T(s,t,{x,y:2.65,w:5,h:.4,fontSize:18,bold:true}); T(s,bul(it),{x,y:3.15,w:5.6,h:2.2,fontSize:15,paraSpaceAfter:6}); });
    if(Pl.regra) T(s,Pl.regra,{x:M,y:5.85,w:12.1,h:.45,fontSize:13,bold:true,color:PX.navy,align:"center"}); }
  const In=modeloTxt.indicadores||{};
  if((In.linhas||[]).length){ s=head("Do princípio à análise","Indicadores observáveis",PX.navy);
    tbl(s,["Momento","Indicadores de jogo","Indicador complementar"],In.linhas.map(r=>[{t:pMom(r.mom)[1].toUpperCase(),o:{fill:{color:momCor(r.mom)},color:PX.white}},r.ind,r.compl||""]),{y:1.6,cor:PX.navy,colW:[2.6,6.5,3.033],fs:11.5,rowH:.95});
    if(In.frase) T(s,`«${In.frase}»`,{x:M,y:6.4,w:12.1,h:.35,fontSize:13,bold:true,color:PX.navy,align:"center"}); }
  const C=modeloTxt.construcao||{};
  if((C.itens||[]).length){ s=head("A decidir e a escrever","Em construção",PX.navy);
    tbl(s,["#","Tema","Situação","Quem decide"],C.itens.map((r,i)=>[String(i+1),r.tema,r.sit,r.quem||""]),{y:1.6,cor:PX.navy,colW:[.5,3,6,2.633],fs:12,rowH:.62}); }
  /* fecho */
  s=pres.addSlide({masterName:"ESC"}); T(s,(I.lema||"O NOSSO JOGO").replace(". ",".\n"),{x:M,y:2,w:11,h:2,fontSize:48,bold:true,color:PX.white});
  s.addShape(pres.shapes.RECTANGLE,{x:M,y:4.35,w:1.3,h:.06,fill:{color:PX.od},line:{color:PX.od,width:0}}); if(I.frase) T(s,I.frase,{x:M,y:4.65,w:11,h:.5,fontSize:18,color:PX.white});
  if((I.valores||[]).length) T(s,I.valores.map(v=>String(v.nome).toUpperCase()).join(" · "),{x:M,y:6.3,w:11,h:.4,fontSize:12,bold:true,color:PX.gold});
  return pres; }
async function exportaModeloPptx(){ if(!temPrinc()){ toast("Ainda não há princípios para exportar."); return; } toast("A preparar o PowerPoint…");
  try{ const pres=deckModelo(), blob=await pres.write({outputType:"blob"});
    await guardaFicheiro(`Modelo_de_Jogo_SCA_${isoDia(new Date())}.pptx`,blob,"application/vnd.openxmlformats-officedocument.presentationml.presentation"); toast("PowerPoint pronto"); }
  catch(e){ if(e?.code==="declined") return; console.error(e); toast("Não foi possível gerar o PowerPoint ("+(e?.message||e?.code||"erro")+")"); } }
