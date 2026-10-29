/* ---------- Relatório pós-jogo para os jogadores (v104, Entrega D) ----------
   relJog/{jogo} = { msg, msgInd: { "<nº>": texto }, lances: [{ rid, titulo }], exportado: [{ em, por, versao, n }] }
   jogo = id do jogo arquivado; o jogo em curso usa "atual" e passa para o id ao arquivar.
   Nunca saem: quadros de bolas paradas, Modelo de Jogo, informação do adversário, notas internas, estatísticas de treino.
   O individual só tem o resultado, os dados do próprio jogador e os lances em que ele entra (nunca colegas nem comparações). */
const RJ_LS="sca-reljog-v1";
let relJogs={}; try{ relJogs=JSON.parse(localStorage.getItem(RJ_LS)||"{}")||{}; }catch(e){}
function normRelJog(d){ const s=v=>String(v??"").trim(), mi={}; Object.entries(d.msgInd||{}).forEach(([k,v])=>{ if(s(k)&&s(v)) mi[s(k)]=s(v); });
  return {id:s(d.id)||"atual",msg:s(d.msg),msgInd:mi,lances:(Array.isArray(d.lances)?d.lances:[]).filter(x=>x&&s(x.rid)).map(x=>({rid:s(x.rid),titulo:s(x.titulo)})).slice(0,40),
    exportado:(Array.isArray(d.exportado)?d.exportado:[]).filter(x=>x&&x.em).map(x=>({em:s(x.em),por:s(x.por),versao:Math.round(+x.versao)||1,n:Math.round(+x.n)||0})).slice(-30),
    alteradoPor:s(d.alteradoPor),alteradoEm:s(d.alteradoEm)}; }
Object.keys(relJogs).forEach(id=>{ try{ relJogs[id]=normRelJog({...relJogs[id],id}); }catch(e){ delete relJogs[id]; } });
const guardaRelJogLocal=()=>{ try{ localStorage.setItem(RJ_LS,JSON.stringify(relJogs)); }catch(e){} };
const idRelJog=G=>G&&G.id?G.id:"atual";
const relJogDe=G=>relJogs[idRelJog(G)]||normRelJog({id:idRelJog(G)});
function gravaRelJog(R){ const N=normRelJog({...R,alteradoPor:meuId||"",alteradoEm:new Date().toISOString()}); relJogs[N.id]=N; guardaRelJogLocal(); gravaDoc("relJog/"+N.id,N); return N; }
/* ao arquivar o jogo, o que estava preparado para o jogo em curso passa para o jogo arquivado */
function arquivaRelJog(id){ const A=relJogs.atual; if(!A) return; gravaRelJog({...A,id}); delete relJogs.atual; guardaRelJogLocal(); apagaDoc("relJog/atual"); }
function repoeRelJog(B){ if(!B.relJog) return; Object.keys(relJogs).forEach(id=>{ if(!B.relJog[id]) apagaDoc("relJog/"+id); }); relJogs={};
  Object.entries(B.relJog).forEach(([id,x])=>{ try{ relJogs[id]=normRelJog({...x,id}); gravaDoc("relJog/"+id,relJogs[id]); }catch(e){} }); guardaRelJogLocal(); }
function ligaRelJogDb(){ if(!db) return; db.collection("relJog").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
  q.docs.forEach(d=>{ const x=lerDoc(d); if(x){ delete x.atualizadoEm; try{ m[d.id]=normRelJog({...x,id:d.id}); }catch(e){} } });
  mergeCol("relJog/",m,relJogs); if(JSON.stringify(m)!==JSON.stringify(relJogs)){ relJogs=m; guardaRelJogLocal(); } },()=>{}); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaRelJogDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();

/* ---------- dados do jogo (tudo calculado na hora a partir do jogo) ---------- */
const COR_PERDA={"Passe falhado":"#C00000","Drible perdido":"#E07B39","Receção falhada":"#8064A2"};
const COR_REMATE={re:"#1F497D",rd:"#7F9CC0",rb:"#5B6B80",golo:"#B8963F"};
const ESTAT_REL=[["golos","Golos"],["rem","Remates"],["enq","Remates à baliza"],["can","Cantos"],["fal","Faltas cometidas"],["fj","Foras de jogo"],["posse","Posse de bola (%)"]];
function dadosRel(G){ const regs=(G.analise&&G.analise.regs)||[], nos=regs.filter(x=>x.eq==="nos"), ev=(G.eventos||[]).slice().sort((a,b)=>(minSeg(a.min)??0)-(minSeg(b.min)??0));
  const minC=m=>m?String(m).split(":")[0]+"'":"", nm=k=>nomeJogRel(G,k);
  const golos=ev.filter(e=>e.tipo==="golo").map(e=>`${e.n?nm(e.n)||e.n:"SC Angrense"} ${minC(e.min)}`.trim());
  const E=G.estat||null, val=(p,k)=>{ const v=E&&E[p]&&E[p].nos?E[p].nos[k]:null; return v==null?"-":String(v)+(k==="posse"?"%":""); };
  const estat=ESTAT_REL.map(([k,n])=>[n,val("1",k),val("2",k),val("t",k)]);
  const tipos=["Passe falhado","Drible perdido","Receção falhada"], per=nos.filter(x=>x.ac==="per");
  const perdas=[...tipos,""].map(t=>{ const q=per.filter(x=>(x.tipo||"")===t); return [t||"Sem tipo",q.filter(x=>x.parte===1).length,q.filter(x=>x.parte===2).length,q.length]; }).filter((r,i)=>i<3||r[3]);
  return {regs,nos,ev,golos,estat,perdas,C:COMPS[G.comp]||null,res:`${G.resultado?.nos??"-"} - ${G.resultado?.eles??"-"}`,data:G.data?new Date(G.data+"T12:00").toLocaleDateString("pt-PT"):""}; }
const minutosDe=(G,k)=>{ const m=(G.minutos||[]).find(x=>String(x.n)===String(k)); return m?Math.round(+m.min)||0:0; };
function alcunhaRel(G,k){ const p=est.plantel.find(x=>String(x.n)===String(k)), a=p&&String(p.alc||"").split(/[,;]/)[0].trim(); return a||nomeCurto({nome:nomeJogRel(G,k)})||String(k); }
const tituloAuto=(G,x)=>`${x.acao||acaoDe(x.ac).nome}${x.j?" · "+nomeCurto({nome:nomeJogRel(G,x.j)}):""}`;
/* lances escolhidos, pela ordem do jogo, com o minuto e o endereço do YouTube nesse momento */
function lancesRel(G,R,so){ const regs=(G.analise&&G.analise.regs)||[];
  return R.lances.map(l=>{ const x=regs.find(r=>r.id===l.rid); if(!x) return null; const url=G.video?linkVideoModo({t:minutoReg(x),parte:x.parte},G.video,"web"):null;
    return {x,titulo:l.titulo||tituloAuto(G,x),min:minutoReg(x),url,j:x.j||null}; }).filter(Boolean).filter(l=>!so||String(l.j)===String(so))
    .sort((a,b)=>(a.x.parte-b.x.parte)||(a.x.seg-b.x.seg)); }
const pontosMapa=(rs,cor)=>rs.map(x=>({x:x.x,y:x.y,...(x.x2!=null?{x2:x.x2,y2:x.y2,lw:180}:{}),cor:cor(x),r:850,op:.9}));
async function mapaRel(pts,larg=1600){ return svgParaJpeg(campoAnalise(null,pts),await cssFontes(),larg); }
async function emblemaAdvRel(G){ try{ if(typeof listaJogosCal!=="function") return null; const j=listaJogosCal().find(c=>c.data===G.data&&c.emblema); return j?await blobDataUrl(srcImagem(j.emblema)):null; }catch(e){ return null; } }
function acoesJogador(D,k){ const rs=D.nos.filter(x=>String(x.j)===String(k)), tipos=[...new Set(rs.map(x=>x.ac+"|"+(x.tipo||"")))];
  return {rs,linhas:tipos.map(t=>{ const [ac,tp]=t.split("|"), q=rs.filter(x=>x.ac===ac&&(x.tipo||"")===tp); return [(q[0].acao||acaoDe(ac).nome)+(tp?" ("+tp+")":""),q.filter(x=>x.parte===1).length,q.filter(x=>x.parte===2).length,q.length]; })}; }
function cartoesDe(D,k){ return D.ev.filter(e=>String(e.n)===String(k)&&(e.tipo==="amarelo"||e.tipo==="vermelho")).map(e=>(e.tipo==="amarelo"?"Amarelo ":"Vermelho ")+(e.min?String(e.min).split(":")[0]+"'":"")); }

/* ---------- PDF A4 (coletivo: k=null; individual: k = nº do jogador) ---------- */
async function pdfRelJog(G,k,R){ if(!window.jspdf) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  if(!window.jspdf.jsPDF.API.autoTable) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
  const D=dadosRel(G), doc=new window.jspdf.jsPDF({unit:"pt",format:"a4"}), PW=595.28, PH=841.89, M=36, W=PW-2*M, RED=[192,0,0], INK=[27,26,23], MUT=[110,106,98];
  const T=(t,x,y,o={})=>{ doc.setFont("helvetica",o.b?"bold":o.i?"italic":"normal"); doc.setFontSize(o.s||10); doc.setTextColor(...(o.c||INK)); doc.text(pdfTxt(String(t)),x,y,o.al?{align:o.al}:undefined); };
  let y=0; const novaSe=h=>{ if(y+h>PH-40){ doc.addPage(); y=M; } };
  const titulo=t=>{ novaSe(40); T(t.toUpperCase(),M,y+12,{b:1,s:10,c:RED}); doc.setDrawColor(...RED); doc.setLineWidth(1.2); doc.line(M,y+16,PW-M,y+16); y+=26; };
  const tabela=(head,body)=>{ doc.autoTable({startY:y,head:[head],body,margin:{left:M,right:M},theme:"grid",styles:{font:"helvetica",fontSize:9,cellPadding:3.5,textColor:INK,lineColor:[220,216,206],lineWidth:.5},
    headStyles:{fillColor:[245,243,238],textColor:MUT,fontStyle:"bold",fontSize:8,halign:"center"},columnStyles:{1:{halign:"center"},2:{halign:"center"},3:{halign:"center",fontStyle:"bold"}}}); y=doc.lastAutoTable.finalY+16; };
  const texto=(t,o={})=>{ doc.setFont("helvetica",o.b?"bold":"normal"); doc.setFontSize(o.s||10); doc.splitTextToSize(pdfTxt(t),W).forEach(l=>{ novaSe(14); T(l,M,y+10,{s:o.s||10,b:o.b,c:o.c}); y+=(o.s||10)*1.35; }); y+=6; };
  const mapa=async(t,pts,leg)=>{ const mw=W*.8, h=mw*PROP_CAMPO; novaSe(h+56); titulo(t); doc.addImage(await mapaRel(pts),"JPEG",M+(W-mw)/2,y,mw,h,undefined,"FAST"); y+=h+12;
    let lx=M+(W-mw)/2; leg.forEach(([n,c])=>{ const rgb=c.match(/\w\w/g).map(v=>parseInt(v,16)); doc.setFillColor(...rgb); doc.rect(lx,y-7,7,7,"F"); T(n,lx+10,y,{s:7.5,c:MUT}); doc.setFontSize(7.5); lx+=doc.getTextWidth(n)+24; }); y+=14; };
  /* cabeçalho */
  doc.setFillColor(...RED); doc.rect(0,0,PW,k?120:104,"F");
  if(IMG_DATA["slides/logo.png"]){ doc.setFillColor(255,255,255); doc.circle(M+26,48,28,"F"); try{ doc.addImage(IMG_DATA["slides/logo.png"],"PNG",M+4,26,44,44); }catch(e){} }
  const emb=await emblemaAdvRel(G); if(emb){ doc.setFillColor(255,255,255); doc.circle(PW-M-26,48,28,"F"); try{ doc.addImage(emb,"PNG",PW-M-48,26,44,44); }catch(e){} }
  T(k?"PÓS-JOGO · O TEU RELATÓRIO":"PÓS-JOGO · RELATÓRIO DA EQUIPA",PW/2,28,{b:1,s:8.5,c:[255,225,225],al:"center"});
  T(`SC Angrense  ${D.res}  ${G.adversario||"Adversário"}`,PW/2,58,{b:1,s:20,c:[255,255,255],al:"center"});
  T([D.C&&D.C.nome,D.data].filter(Boolean).join("  ·  "),PW/2,78,{s:9.5,c:[255,225,225],al:"center"});
  if(!k&&D.golos.length) T("Golos: "+D.golos.join("  ·  "),PW/2,96,{s:9,c:[255,255,255],al:"center"});
  if(k){ T(`${k} · ${nomeJogRel(G,k)}`,PW/2,104,{b:1,s:13,c:[255,255,255],al:"center"}); const fj=typeof fotoCirculo==="function"?await fotoCirculo(String(k),300,12,"#FFFFFF"):null; if(fj) doc.addImage(fj.toDataURL("image/png"),"PNG",PW-M-110,14,86,86); }
  y=(k?120:104)+22;
  const lances=lancesRel(G,R,k);
  if(!k){
    titulo("Estatística da equipa"); tabela(["","1.ª parte","2.ª parte","Total"],D.estat);
    titulo("Perdas de bola por tipo"); tabela(["Tipo","1.ª parte","2.ª parte","Total"],D.perdas);
    await mapa("Perdas de bola (atacamos para a direita)",pontosMapa(D.nos.filter(x=>x.ac==="per"),x=>COR_PERDA[x.tipo]||"#C00000"),Object.entries(COR_PERDA));
    await mapa("Remates",pontosMapa(D.nos.filter(x=>COR_REMATE[x.ac]),x=>COR_REMATE[x.ac]),[["À baliza",COR_REMATE.re],["Ao lado",COR_REMATE.rd],["Bloqueado",COR_REMATE.rb],["Golo",COR_REMATE.golo]]);
    await mapa("Passes-chave",pontosMapa(D.nos.filter(x=>x.ac==="pc"),()=>"#2E8B57"),[["Passe-chave","#2E8B57"]]);
    if(R.msg){ titulo("Mensagem da equipa técnica"); texto(R.msg,{s:10.5}); } }
  else {
    const mn=minutosDe(G,k), gl=D.ev.filter(e=>e.tipo==="golo"&&String(e.n)===String(k)).length, ct=cartoesDe(D,k);
    titulo("O teu jogo"); texto([`Minutos jogados: ${mn}'`,gl?`Golos: ${gl}`:"",ct.join(", ")].filter(Boolean).join("   ·   "),{b:1});
    const A=acoesJogador(D,k);
    titulo("As tuas ações"); if(A.linhas.length) tabela(["Ação","1.ª parte","2.ª parte","Total"],A.linhas); else texto("Sem ações registadas para ti neste jogo.",{c:MUT});
    if(A.rs.length) await mapa("Mapa das tuas ações (atacamos para a direita)",pontosMapa(A.rs,x=>acaoDe(x.ac).cor),[...new Set(A.rs.map(x=>x.ac))].map(a=>[acaoDe(a).nome,acaoDe(a).cor]));
    if(R.msgInd[k]){ titulo("Mensagem da equipa técnica"); texto(R.msgInd[k],{s:10.5}); } }
  if(lances.length){ titulo(k?"Os teus lances em vídeo":"Lances em vídeo"); const lado=86, por=Math.floor((W+16)/(lado+40));
    for(let i=0;i<lances.length;i+=por){ novaSe(lado+40); lances.slice(i,i+por).forEach((l,j)=>{ const x=M+j*(lado+40);
      if(l.url){ qrNoPdf(doc,l.url,x,y,lado); doc.link(x,y,lado,lado,{url:l.url}); } else { doc.setDrawColor(...MUT); doc.rect(x,y,lado,lado); T("sem vídeo",x+lado/2,y+lado/2,{s:7,c:MUT,al:"center"}); }
      doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(...INK); doc.text(doc.splitTextToSize(pdfTxt(`${l.min} · ${l.titulo}`),lado+34).slice(0,2),x+lado/2,y+lado+10,{align:"center"}); }); y+=lado+34; } }
  const np=doc.getNumberOfPages(); for(let i=1;i<=np;i++){ doc.setPage(i); T(`SC Angrense · Pós-jogo vs ${G.adversario||""}${k?" · "+nomeJogRel(G,k):""} · ${i}/${np}`,PW/2,PH-16,{s:7.5,c:MUT,al:"center"}); }
  return doc; }
const PROP_CAMPO=H/W;   // proporção do campo da análise (altura / largura)

/* ---------- ecrãs 1080×1920 para o WhatsApp ---------- */
async function ecrasRelJog(G,k,R){ const D=dadosRel(G), FW=1080, FH=1920, RED="#C00000", INK="#1B1A17", MUT="#6E6A62", CREAM="#FBF7EE", ecras=[];
  try{ await document.fonts.load('700 40px "RC Modelo"'); }catch(e){}
  const fnt=(px,b=true)=>`${b?700:400} ${px}px "RC Modelo","Arial Narrow",Arial,sans-serif`;
  const novo=()=>{ const cv=document.createElement("canvas"); cv.width=FW; cv.height=FH; const c=cv.getContext("2d"); c.fillStyle=CREAM; c.fillRect(0,0,FW,FH); ecras.push(cv); return c; };
  const txt=(c,t,x,y,px,cor=INK,al="left",b=true,maxW=0)=>{ let s=px; c.font=fnt(s,b); while(maxW&&s>14&&c.measureText(t).width>maxW){ s-=2; c.font=fnt(s,b); } c.fillStyle=cor; c.textAlign=al; c.fillText(t,x,y); };
  const linhas=(c,t,x,y,px,maxW,cor=INK,b=false,lh=1.3)=>{ c.font=fnt(px,b); c.fillStyle=cor; c.textAlign="left"; let yy=y;
    String(t).split(/\n/).forEach(par=>{ let l=""; par.split(/\s+/).forEach(w=>{ const t2=l?l+" "+w:w; if(c.measureText(t2).width>maxW&&l){ c.fillText(l,x,yy); yy+=px*lh; l=w; } else l=t2; }); c.fillText(l,x,yy); yy+=px*lh; }); return yy; };
  const imgs={}; const img=async u=>imgs[u]||(imgs[u]=await imgDeUrl(u));
  const emb=await emblemaAdvRel(G), logo=IMG_DATA["slides/logo.png"];
  const cab=async(c,sub)=>{ c.fillStyle=RED; c.fillRect(0,0,FW,420); if(logo){ c.fillStyle="#fff"; c.beginPath(); c.arc(120,120,78,0,7); c.fill(); const i=await img(logo); c.drawImage(i,60,60,120,120); }
    if(emb){ c.fillStyle="#fff"; c.beginPath(); c.arc(FW-120,120,78,0,7); c.fill(); const i=await img(emb); c.drawImage(i,FW-180,60,120,120); }
    txt(c,sub,FW/2,90,34,"#FFD9D9","center"); txt(c,`${D.res}`,FW/2,230,130,"#fff","center"); txt(c,`SC ANGRENSE vs ${String(G.adversario||"").toUpperCase()}`,FW/2,300,46,"#fff","center",true,FW-80);
    txt(c,[D.C&&D.C.nome,D.data].filter(Boolean).join("  ·  "),FW/2,360,34,"#FFD9D9","center",false,FW-80); };
  const tabelaC=(c,y,head,rows)=>{ const xs=[60,560,720,880], w=FW-120; c.fillStyle="#EFEBE2"; c.fillRect(60,y,w,64); head.forEach((h,i)=>txt(c,h,i?xs[i]+70:xs[0]+12,y+44,30,MUT,i?"center":"left"));
    rows.forEach((r,j)=>{ const yy=y+64+j*62; if(j%2){ c.fillStyle="#F5F2EA"; c.fillRect(60,yy,w,62); } r.forEach((v,i)=>txt(c,String(v),i?xs[i]+70:xs[0]+12,yy+43,i===3?38:34,i===3?RED:INK,i?"center":"left",i===3||!i,i?0:480)); }); return y+64+rows.length*62+30; };
  const tituloC=(c,t,y)=>{ txt(c,t.toUpperCase(),60,y,40,RED); c.fillStyle=RED; c.fillRect(60,y+16,FW-120,5); return y+60; };
  const mapaC=async(c,pts,y,leg,larg=FW-120)=>{ const h=Math.round(larg*PROP_CAMPO), x0=(FW-larg)/2, i=await img(await mapaRel(pts,1400)); c.drawImage(i,x0,y,larg,h); let lx=60, ly=y+h+40;
    leg.forEach(([n,cor])=>{ c.font=fnt(26,false); const w=c.measureText(n).width; if(lx+w+60>FW-60){ lx=60; ly+=40; } c.fillStyle=cor; c.fillRect(lx,ly-22,24,24); txt(c,n,lx+34,ly,26,MUT,"left",false); lx+=w+70; }); return ly+40; };
  const qrC=(c,url,x,y,lado)=>{ const Mq=qrMatriz(url), n=Mq.length, m=lado/(n+8); c.fillStyle="#fff"; c.fillRect(x,y,lado,lado); c.fillStyle="#000"; Mq.forEach((r,yy)=>r.forEach((v,xx)=>{ if(v) c.fillRect(x+(xx+4)*m,y+(yy+4)*m,m+.5,m+.5); })); };
  /* lances em grelha de 2 colunas; no 1.º ecrã pode ir antes a mensagem da equipa técnica; os que não cabem passam para outro ecrã */
  const lancesC=async(ls,titulo,msg)=>{ let i=0, primeiro=true; const lado=250, alt=lado+88;
    while(primeiro||i<ls.length){ const c=novo(); await cab(c,titulo); let y=500;
      if(primeiro&&msg){ y=tituloC(c,"Mensagem da equipa técnica",y); y=linhas(c,msg,60,y+10,40,FW-120,INK,false,1.35)+30; }
      primeiro=false; if(i>=ls.length) break;
      y=tituloC(c,"Lances em vídeo",y); const cabe=Math.max(1,Math.floor((FH-80-y)/alt))*2;
      ls.slice(i,i+cabe).forEach((l,j)=>{ const x=j%2?FW/2+70:110, yy=y+Math.floor(j/2)*alt; if(l.url) qrC(c,l.url,x,yy,lado); else { c.strokeStyle=MUT; c.lineWidth=3; c.strokeRect(x,yy,lado,lado); txt(c,"sem vídeo",x+lado/2,yy+lado/2,30,MUT,"center",false); }
        txt(c,`${l.min} · ${l.titulo}`,x+lado/2,yy+lado+42,28,INK,"center",true,FW/2-60); });
      i+=cabe; txt(c,"Aponta a câmara ao código para ver o lance",FW/2,FH-50,28,MUT,"center",false); } };
  const lances=lancesRel(G,R,k);
  if(!k){
    let c=novo(); await cab(c,"RELATÓRIO DA EQUIPA"); let y=480; if(D.golos.length){ y=linhas(c,"⚽ "+D.golos.join("  ·  "),60,y,36,FW-120,INK,true)+20; }
    y=tituloC(c,"Estatística da equipa",y+20); y=tabelaC(c,y,["","1.ª","2.ª","Total"],D.estat); y=tituloC(c,"Perdas de bola por tipo",y+10); tabelaC(c,y,["","1.ª","2.ª","Total"],D.perdas);
    c=novo(); await cab(c,"PERDAS DE BOLA E REMATES"); y=tituloC(c,"Perdas de bola",500); y=await mapaC(c,pontosMapa(D.nos.filter(x=>x.ac==="per"),x=>COR_PERDA[x.tipo]||RED),y,Object.entries(COR_PERDA));
    y=tituloC(c,"Remates",y+20); await mapaC(c,pontosMapa(D.nos.filter(x=>COR_REMATE[x.ac]),x=>COR_REMATE[x.ac]),y,[["À baliza",COR_REMATE.re],["Ao lado",COR_REMATE.rd],["Bloqueado",COR_REMATE.rb],["Golo",COR_REMATE.golo]]);
    c=novo(); await cab(c,"PASSES-CHAVE E MENSAGEM"); y=tituloC(c,"Passes-chave",500); y=await mapaC(c,pontosMapa(D.nos.filter(x=>x.ac==="pc"),()=>"#2E8B57"),y,[["Passe-chave","#2E8B57"]]);
    if(R.msg){ y=tituloC(c,"Mensagem da equipa técnica",y+20); linhas(c,R.msg,60,y+10,40,FW-120,INK,false,1.35); }
    if(lances.length) await lancesC(lances,"RELATÓRIO DA EQUIPA",""); }
  else {
    const c=novo(); await cab(c,"O TEU RELATÓRIO"); const fj=typeof fotoCirculo==="function"?await fotoCirculo(String(k),300,10,"#FFFFFF"):null;
    let y=470; if(fj){ c.drawImage(fj,60,y,200,200); } txt(c,nomeJogRel(G,k),fj?290:60,y+90,60,INK,"left",true,FW-(fj?350:120)); txt(c,`Nº ${k}`,fj?290:60,y+150,40,RED);
    y+=250; const mn=minutosDe(G,k), gl=D.ev.filter(e=>e.tipo==="golo"&&String(e.n)===String(k)).length, ct=cartoesDe(D,k);
    y=linhas(c,[`${mn}' jogados`,gl?`${gl} ${gl===1?"golo":"golos"}`:"",ct.join(", ")].filter(Boolean).join("   ·   "),60,y,42,FW-120,INK,true)+10;
    const A=acoesJogador(D,k); y=tituloC(c,"As tuas ações",y+10);
    if(A.linhas.length){ y=tabelaC(c,y,["","1.ª","2.ª","Total"],A.linhas.slice(0,8)); const larg=Math.min(FW-120,(FH-40-y)/PROP_CAMPO); if(A.rs.length&&larg>=520) await mapaC(c,pontosMapa(A.rs,x=>acaoDe(x.ac).cor),y,[],larg); }
    else txt(c,"Sem ações registadas para ti neste jogo.",60,y+30,34,MUT,"left",false);
    if(R.msgInd[k]||lances.length) await lancesC(lances,"O TEU RELATÓRIO",R.msgInd[k]||""); }
  return ecras; }

/* ---------- ZIP (sem compressão; pastas Grupo e Individuais) ---------- */
const CRC_T=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
const crc32=b=>{ let c=0xFFFFFFFF; for(let i=0;i<b.length;i++) c=CRC_T[(c^b[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; };
function zipFicheiros(fs){ const enc=new TextEncoder(), partes=[], central=[]; let off=0;
  const u16=v=>[v&255,(v>>>8)&255], u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
  fs.forEach(f=>{ const nome=enc.encode(f.nome), d=f.dados, crc=crc32(d);
    const loc=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(d.length),...u32(d.length),...u16(nome.length),...u16(0)]);
    partes.push(loc,nome,d); central.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(d.length),...u32(d.length),...u16(nome.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nome);
    off+=loc.length+nome.length+d.length; });
  const tamC=central.reduce((a,b)=>a+b.length,0), fim=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(fs.length),...u16(fs.length),...u32(tamC),...u32(off),...u16(0)]);
  return new Blob([...partes,...central,fim],{type:"application/zip"}); }
const nomeFichRel=(G,parte)=>`${G.data||isoDia(new Date())}_${String(G.adversario||"jogo").replace(/[^\wÀ-ÿ-]+/g,"_")}_${String(parte).replace(/[^\wÀ-ÿ-]+/g,"_")}`;
const blobBytes=async b=>new Uint8Array(await b.arrayBuffer());
const cvJpeg=cv=>new Promise(ok=>cv.toBlob(ok,"image/jpeg",.9));

/* ---------- folhas: preparar (mensagens e lances), pré-visualizar e exportar ---------- */
function folhaRelJog(G){ if(!G){ toast("Sem jogo."); return; } const R=clone(relJogDe(G)), regs=((G.analise&&G.analise.regs)||[]).filter(x=>x.eq==="nos"), js=jogadoresRel(G);
  const grupos=[["golo","Golos",x=>x.ac==="golo"],["rem","Remates",x=>["re","rd","rb"].includes(x.ac)],["pc","Passes-chave e cruzamentos",x=>x.ac==="pc"||x.ac==="cr"],["per","Perdas e recuperações",x=>x.ac==="per"||x.ac==="rec"],["out","Outras",x=>!["golo","re","rd","rb","pc","cr","per","rec"].includes(x.ac)]];
  let gr="golo";
  folha(`<h3>📣 Relatório para jogadores · vs ${esc(G.adversario||"")}</h3>
    <p class="sub" style="margin:0">Coletivo para o grupo e um individual por jogador (PDF A4 e ecrãs 1080×1920 para o WhatsApp, tudo num .zip). Nunca saem quadros, Modelo de Jogo, adversário, notas nem dados de treino.${R.exportado.length?` <b>Última exportação: versão ${R.exportado[R.exportado.length-1].versao} a ${esc(dataHora(R.exportado[R.exportado.length-1].em))}.</b>`:""}</p>
    <label class="f">Mensagem da equipa técnica (3 a 4 pontos-chave)<textarea id="rj-m" rows="4" placeholder="• …">${esc(R.msg)}</textarea></label>
    <h4 style="margin-bottom:0">Lances em vídeo <span class="sub" id="rj-c"></span></h4>${G.video&&ytId(G.video.url)?"":`<p class="mc-av" style="margin:0">Este jogo não tem vídeo do YouTube configurado: os lances saem sem QR.</p>`}
    <div class="seg" id="rj-g">${grupos.map(([k,n])=>`<button data-k="${k}">${n}</button>`).join("")}</div><div id="rj-l" class="lv-lista"></div>
    <h4 style="margin-bottom:0">Mensagens individuais <span class="sub">(opcional)</span></h4><div id="rj-i" class="rj-ind">${js.map(k=>`<label class="f"><span><b>${esc(k)}</b> ${esc(nomeJogRel(G,k))} · ${minutosDe(G,k)}'</span><textarea rows="2" data-k="${esc(k)}">${esc(R.msgInd[k]||"")}</textarea></label>`).join("")||`<p class="sub">Sem jogadores neste jogo.</p>`}</div>
    <div class="actions"><button class="btn" data-close>Fechar</button><button class="btn" id="rj-ok">Guardar</button><button class="btn primary" id="rj-pv">👁 Pré-visualizar e exportar</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x);
    const le=()=>{ R.msg=q("#rj-m").value; s.querySelectorAll("#rj-i textarea").forEach(t=>{ R.msgInd[t.dataset.k]=t.value; }); return gravaRelJog(R); };
    const pinta=()=>{ s.querySelectorAll("#rj-g button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===gr))); const f=grupos.find(g=>g[0]===gr)[2], ls=regs.filter(f).sort((a,b)=>(a.parte-b.parte)||(a.seg-b.seg));
      q("#rj-c").textContent=`(${R.lances.length} escolhidos)`;
      q("#rj-l").innerHTML=ls.length?ls.map(x=>{ const l=R.lances.find(y=>y.rid===x.id); return `<div class="rj-la"><label class="lv-ex"><input type="checkbox" data-r="${esc(x.id)}"${l?" checked":""}><span><b>${esc(minutoReg(x))} · ${esc(tituloAuto(G,x))}</b><small>${x.parte}.ª parte</small></span></label>${l?`<input type="text" data-t="${esc(x.id)}" value="${esc(l.titulo)}" placeholder="Título curto (por defeito: ${esc(tituloAuto(G,x))})" aria-label="Título do lance">`:""}</div>`; }).join(""):`<p class="sub">Sem ações deste tipo.</p>`;
      q("#rj-l").querySelectorAll("[data-r]").forEach(c=>c.onchange=()=>{ const id=c.dataset.r; if(c.checked) R.lances.push({rid:id,titulo:""}); else R.lances=R.lances.filter(y=>y.rid!==id); pinta(); });
      q("#rj-l").querySelectorAll("[data-t]").forEach(t=>t.oninput=()=>{ const l=R.lances.find(y=>y.rid===t.dataset.t); if(l) l.titulo=t.value; }); };
    s.querySelectorAll("#rj-g button").forEach(b=>b.onclick=()=>{ gr=b.dataset.k; pinta(); }); pinta();
    q("#rj-ok").onclick=()=>{ le(); fecha(); toast("Relatório guardado"); };
    q("#rj-pv").onclick=()=>{ const N=le(); fecha(); folhaPreviewRelJog(G,N.id); }; }); }
function folhaPreviewRelJog(G,id){ const R=relJogs[id]||normRelJog({id}), js=jogadoresRel(G), quem=[null,...js], vistos=new Set(), cache={}; let cur=null, ctl=null;
  const rot=k=>k?`${k} ${alcunhaRel(G,k)}`:"Grupo";
  folha(`<h3>Pré-visualização · vs ${esc(G.adversario||"")}</h3><p class="sub" style="margin:0">Vê os ecrãs do grupo e de cada jogador (o PDF tem o mesmo conteúdo). ✓ = já visto.</p>
    <div class="chips" id="rp-q">${quem.map((k,i)=>`<button class="chip" data-i="${i}">${esc(rot(k))}</button>`).join("")}</div>
    <div id="rp-v" class="rp-v"><p class="sub">A preparar…</p></div><p class="sub" id="rp-st" style="margin:0"></p>
    <div class="actions"><button class="btn" id="rp-volta">Voltar</button><button class="btn" id="rp-x" hidden>Cancelar</button><button class="btn primary" id="rp-ok">✓ Aprovar e exportar</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x);
    const mostra=async i=>{ cur=i; const k=quem[i]; s.querySelectorAll("#rp-q .chip").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.i===i))); q("#rp-v").innerHTML=`<p class="sub">A preparar ${esc(rot(k))}…</p>`;
      try{ if(!cache[i]) cache[i]=(await ecrasRelJog(G,k,R)).map(cv=>cv.toDataURL("image/jpeg",.7)); if(cur!==i) return;
        q("#rp-v").innerHTML=cache[i].map((u,j)=>`<img src="${u}" alt="${esc(rot(k))} · ecrã ${j+1}">`).join(""); vistos.add(i);
        const b=s.querySelector(`#rp-q [data-i="${i}"]`); if(b&&!b.textContent.startsWith("✓")) b.textContent="✓ "+b.textContent; }
      catch(e){ q("#rp-v").innerHTML=`<p class="sub">Não consegui preparar (${esc(e&&e.message||"erro")}).</p>`; } };
    s.querySelectorAll("#rp-q .chip").forEach(b=>b.onclick=()=>mostra(+b.dataset.i)); mostra(0);
    q("#rp-volta").onclick=()=>{ if(ctl) ctl.cancelado=true; fecha(); folhaRelJog(G); };
    q("#rp-x").onclick=()=>{ if(ctl) ctl.cancelado=true; };
    confirma2(q("#rp-ok"),vistos.size<quem.length?"Toca outra vez: exportar (há ecrãs por ver)":"Toca outra vez para exportar",async()=>{ ctl={cancelado:false}; q("#rp-ok").disabled=true; q("#rp-x").hidden=false; const st=q("#rp-st");
      try{ const fs=[]; let i=0;
        for(const k of quem){ if(ctl.cancelado) throw new Error("cancelado"); i++; st.textContent=`A preparar ${i} de ${quem.length}: ${rot(k)}…`;
          const pasta=k?"Individuais/":"Grupo/", base=nomeFichRel(G,k?alcunhaRel(G,k):"grupo");
          fs.push({nome:pasta+base+".pdf",dados:new Uint8Array((await pdfRelJog(G,k,R)).output("arraybuffer"))});
          const ec=await ecrasRelJog(G,k,R); for(let j=0;j<ec.length;j++) fs.push({nome:`${pasta}${base}_${j+1}.jpg`,dados:await blobBytes(await cvJpeg(ec[j]))}); }
        st.textContent="A juntar no .zip…"; const zip=zipFicheiros(fs);
        await guardaFicheiro(nomeFichRel(G,"relatorio_jogadores")+".zip",zip,"application/zip");
        const R2=relJogs[id]||R, versao=(R2.exportado.length?R2.exportado[R2.exportado.length-1].versao:0)+1;
        gravaRelJog({...R2,exportado:[...R2.exportado,{em:new Date().toISOString(),por:meuId||"",versao,n:fs.length}]}); fecha(); toast(`Relatório exportado · versão ${versao} · ${fs.length} ficheiros`); }
      catch(e){ q("#rp-ok").disabled=false; q("#rp-x").hidden=true; st.textContent=e&&e.message==="cancelado"?"Cancelado.":e&&e.code==="declined"?"":"Não foi possível exportar ("+((e&&(e.code||e.message))||"erro")+")."; } }); }); }
