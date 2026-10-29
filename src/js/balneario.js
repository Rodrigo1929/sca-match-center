/* ---------- Rankings para fora (v100): PDF da tabela completa e cartaz do balneário (A3) ----------
   Tudo calculado na hora (compStats e meinhoStats) com o filtro escolhido; nada se grava. As fotos vêm de fotos/{chave}. */
async function guardaFicheiro(nomeF,data,tipo){ let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
  if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type:tipo})); a.download=nomeF; document.body.appendChild(a); a.click(); a.remove(); return; }
  await dl.save({filename:nomeF,data:data instanceof Blob?new Uint8Array(await data.arrayBuffer()):data}); }
async function carregaJsPdf(tabelas){ if(!window.jspdf) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  if(tabelas&&!window.jspdf.jsPDF.API.autoTable) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"); }
const ordPts=(a,b)=>b.Pts-a.Pts||b.DG-a.DG||b.GM-a.GM||b.golos-a.golos||a.nome.localeCompare(b.nome,"pt");
const golJ=x=>x.J?x.golos/x.J:0;
const ordGol=(a,b)=>b.golos-a.golos||golJ(b)-golJ(a)||a.nome.localeCompare(b.nome,"pt");
const ordGR=(a,b)=>a.med-b.med||b.J-a.J||a.nome.localeCompare(b.nome,"pt");
const ordMh=(a,b)=>b.tot-a.tot||b.med-a.med||a.nome.localeCompare(b.nome,"pt");
/* top 5 (com quem empata no 5.º lugar), o rei (ou reis, se empatarem) e os dois seguintes «na corrida» */
function rankListas(F){ const S=compStats(F), R=meinhoStats(F), lst=o=>Object.entries(o).map(([c,x])=>({...x,c}));
  const P=lst(S.P), top=(ls,ord,val,igual)=>{ const s=ls.filter(x=>val(x)>0).sort(ord); return s.length<=5?s:s.filter((x,i)=>i<5||igual(x,s[4])); };
  const rei=t=>{ const ls=lst(R[t]).filter(x=>x.tot>0).sort(ordMh), m=ls.length?ls[0].tot:0; return {reis:ls.filter(x=>x.tot===m),corrida:ls.filter(x=>x.tot<m).slice(0,2),m}; };
  const ult=F.ls.filter(U=>U.data).sort((a,b)=>a.data.localeCompare(b.data)).pop();
  return {S,R,P:P.slice().sort(ordPts),GR:lst(S.GR).sort(ordGR),M21:lst(R["21"]).filter(x=>x.tot||x.nUT).sort(ordMh),MC:lst(R.cueca).filter(x=>x.tot||x.nUT).sort(ordMh),
    champions:top(P,ordPts,x=>x.Pts,(a,b)=>a.Pts===b.Pts&&a.DG===b.DG&&a.GM===b.GM&&a.golos===b.golos),
    golo:top(P,ordGol,x=>x.golos,(a,b)=>a.golos===b.golos&&golJ(a)===golJ(b)),
    meinho:rei("21"),cueca:rei("cueca"),filtro:filtroTxt(F),ate:ult?`até à UT${ult.numero} (${dataPt_(ult.data).slice(0,5)})`:""}; }
/* fotos em círculo para várias chaves de uma vez (PNG; sem foto = null) */
async function fotosCirc(cs,px,borda,cor){ const m={}; await Promise.all([...new Set(cs)].map(async c=>{ m[c]=await fotoCirculo(fotoDeChaveT(c),px,borda,cor); })); return m; }
const nomeFich=(base,F)=>nomeCsv(base,F).replace(/\.csv$/,"");

/* ---------- PDF A4 com a tabela completa (classificação, GR, Rei do Meinho e Rei das Cuecas) ---------- */
async function pdfRankings(F){ await carregaJsPdf(true); const L=rankListas(F);
  const doc=new window.jspdf.jsPDF({unit:"pt",format:"a4"}), PW=595.28, M=32, RED=[192,0,0], INK=[27,26,23], MUT=[110,106,98];
  const fc=await fotosCirc([...L.P,...L.GR,...L.M21,...L.MC].map(x=>x.c),96), png={}; Object.entries(fc).forEach(([c,cv])=>{ if(cv) png[c]=cv.toDataURL("image/png"); });
  const T=(t,x,y,o={})=>{ doc.setFont("helvetica",o.b?"bold":"normal"); doc.setFontSize(o.s||10); doc.setTextColor(...(o.c||INK)); doc.text(String(t),x,y,o.al?{align:o.al}:undefined); };
  doc.setFillColor(...RED); doc.rect(0,0,PW,84,"F");
  T("SC ANGRENSE · COMPETIÇÃO INTERNA",M,26,{b:1,s:9,c:[255,225,225]}); T("Rankings",M,56,{b:1,s:24,c:[255,255,255]});
  T([L.filtro,L.ate,"gerado a "+new Date().toLocaleDateString("pt-PT")].filter(Boolean).join("  ·  "),M,74,{s:9,c:[255,225,225]});
  if(IMG_DATA["slides/logo.png"]){ doc.setFillColor(255,255,255); doc.circle(PW-M-30,42,32,"F"); try{ doc.addImage(IMG_DATA["slides/logo.png"],"PNG",PW-M-54,18,48,48); }catch(e){} }
  let y=104;
  const titulo=t=>{ if(y>740){ doc.addPage(); y=M; } T(t.toUpperCase(),M,y+12,{b:1,s:10,c:RED}); doc.setDrawColor(...RED); doc.setLineWidth(1.2); doc.line(M,y+16,PW-M,y+16); y+=24; };
  /* coluna 1 = foto (desenhada por cima da célula vazia), coluna 2 = nome */
  const tabela=(head,ls,linha,o={})=>{ doc.autoTable({startY:y,head:[head],body:ls.map(linha),margin:{left:M,right:M},theme:"grid",
      styles:{font:"helvetica",fontSize:8.5,cellPadding:{top:4,bottom:4,left:3,right:3},minCellHeight:20,valign:"middle",textColor:INK,lineColor:[220,216,206],lineWidth:.5},
      headStyles:{fillColor:[245,243,238],textColor:MUT,fontStyle:"bold",fontSize:7.5,halign:"center"},columnStyles:{0:{halign:"center",cellWidth:22},1:{cellWidth:24},2:{halign:"left",fontStyle:"bold"},...(o.cols||{})},
      didParseCell:d=>{ if(d.section==="body"&&d.column.index>2) d.cell.styles.halign="center"; if(o.dest&&d.section==="body"&&d.column.index===o.dest) d.cell.styles.fontStyle="bold"; },
      didDrawCell:d=>{ if(d.section!=="body"||d.column.index!==1) return; const x=ls[d.row.index], s=Math.min(d.cell.height-4,18), cx=d.cell.x+(d.cell.width-s)/2, cy=d.cell.y+(d.cell.height-s)/2;
        if(png[x.c]) doc.addImage(png[x.c],"PNG",cx,cy,s,s); else { doc.setFillColor(233,227,214); doc.circle(cx+s/2,cy+s/2,s/2,"F"); doc.setFont("helvetica","bold"); doc.setFontSize(6.5); doc.setTextColor(122,10,10); doc.text(iniciais(x.nome),cx+s/2,cy+s/2+2.3,{align:"center"}); } }});
    y=doc.lastAutoTable.finalY+16; };
  titulo("Classificação · Liga e Champions");
  if(L.P.length) tabela(["#","","Atleta",...COLS_C.map(c=>c[1])],L.P,(x,i)=>[i+1,"",x.nome,...COLS_C.map(([k])=>k==="PtsJ"?f1(x[k]):x[k])],{dest:7});
  else { T("Sem jogos terminados neste filtro.",M,y,{s:9.5,c:MUT}); y+=18; }
  titulo("Guarda-redes");
  if(L.GR.length) tabela(["#","","GR",...COLS_G.map(c=>c[1])],L.GR,(x,i)=>[i+1,"",x.nome,...COLS_G.map(([k])=>k==="med"?f1(x[k]):x[k])],{dest:9});
  else { T("Ainda sem GR indicados em jogos terminados.",M,y,{s:9.5,c:MUT}); y+=18; }
  [["Rei do Meinho (21 passes)",L.M21],["Rei das Cuecas",L.MC]].forEach(([t,ls])=>{ titulo(t);
    if(ls.length) tabela(["#","","Atleta","Total","UT com meinho","Média por UT"],ls,(x,i)=>[i+1,"",x.nome,x.tot,x.nUT,f1(x.med)],{dest:3});
    else { T("Sem UT com meinho neste filtro.",M,y,{s:9.5,c:MUT}); y+=18; } });
  T("Pontos 3-1-0 por jogador (o resultado da equipa em que jogou); só contam jogos com «Fim do jogo». Desempate: Pts, DG, GM, golos. Os GR têm a tabela deles.",M,Math.min(y,800),{s:7.5,c:MUT});
  const np=doc.getNumberOfPages(); for(let i=1;i<=np;i++){ doc.setPage(i); T(`SC Angrense · Rankings da competição interna · ${i}/${np}`,PW/2,824,{s:7.5,c:MUT,al:"center"}); }
  return doc; }
async function guardaPdfRankings(F,botao){ if(botao) botao.disabled=true; toast("A gerar o PDF…");
  try{ const doc=await pdfRankings(F); await guardaFicheiro(nomeFich("Rankings",F)+".pdf",new Uint8Array(doc.output("arraybuffer")),"application/pdf"); toast("PDF pronto"); }
  catch(e){ if(e?.code!=="declined") toast(e?.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet.":"Não foi possível gerar o PDF ("+(e?.code||e?.message||"erro")+")"); }
  finally{ if(botao) botao.disabled=false; } }

/* ---------- cartaz do balneário: A3 vertical (2480×3508), desenhado em canvas ---------- */
const CZ={W:2480,H:3508,red:"#C00000",dred:"#7A0A0A",cream:"#FBF7EE",ink:"#1B1A17",gold:"#D4A017",mut:"#7A7364",pale:"#FFD9D9",card:"#FBEFD8"};
async function cartazCanvas(F){ const L=rankListas(F), W=CZ.W, H=CZ.H, cv=document.createElement("canvas"); cv.width=W; cv.height=H; const c=cv.getContext("2d");
  try{ await Promise.all([document.fonts.load('700 40px "RC Modelo"'),document.fonts.load('400 40px "RC Modelo"')]); }catch(e){}
  const fnt=(px,b)=>`${b===false?400:700} ${px}px "RC Modelo","Arial Narrow",Arial,sans-serif`;
  const txt=(t,x,y,px,cor,al="left",b=true,maxW=0)=>{ let s=px; c.font=fnt(s,b); while(maxW&&s>12&&c.measureText(t).width>maxW){ s-=2; c.font=fnt(s,b); } c.fillStyle=cor; c.textAlign=al; c.textBaseline="alphabetic"; c.fillText(t,x,y); };
  const roda=(x,y,r,cor)=>{ c.fillStyle=cor; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill(); };
  const caixa=(x,y,w,h,r,cor)=>{ c.fillStyle=cor; c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); c.fill(); };
  const imgs={}; await Promise.all(["slides/logo.png","rankings/rei-dos-meinhos-720.jpg","rankings/rei-das-cuecas-720.jpg"].filter(k=>IMG_DATA[k]).map(async k=>{ try{ imgs[k]=await imgDeUrl(IMG_DATA[k]); }catch(e){} }));
  const fc=await fotosCirc([...L.champions,...L.golo,...L.meinho.reis,...L.cueca.reis].map(x=>x.c),600);
  /* bolinha do atleta: anel, foto (ou iniciais) e o lugar num emblema dourado */
  const atleta=(x,cx,cy,d,anel,pos)=>{ roda(cx,cy,d/2,anel); const f=fc[x.c], r=d/2-Math.max(8,d*.035);
    if(f) c.drawImage(f,cx-r,cy-r,2*r,2*r); else { roda(cx,cy,r,"#E9E3D6"); txt(iniciais(x.nome),cx,cy+r*.32,Math.round(r*.9),CZ.dred,"center"); }
    if(pos){ const br=Math.max(40,d*.13), bx=cx+d*.36, by=cy-d*.36; roda(bx,by,br,CZ.gold); roda(bx,by,br-6,CZ.cream); roda(bx,by,br-12,CZ.gold); txt(String(pos),bx,by+br*.42,Math.round(br*1.15),CZ.dred,"center"); } };
  c.fillStyle=CZ.cream; c.fillRect(0,0,W,H);
  /* cabeçalho */
  c.fillStyle=CZ.red; c.fillRect(0,0,W,470); c.fillStyle=CZ.gold; c.fillRect(0,470,W,14);
  txt("SC ANGRENSE  ·  BALNEÁRIO",150,130,58,CZ.pale); txt("QUADRO DE HONRA",150,310,200,"#FFFFFF","left",true,1720);
  txt([L.filtro,L.ate].filter(Boolean).join("  ·  "),150,400,60,CZ.pale,"left",false,1720);
  if(imgs["slides/logo.png"]){ roda(W-300,235,175,"#FFFFFF"); const im=imgs["slides/logo.png"], k=250/Math.max(im.naturalWidth,im.naturalHeight); c.drawImage(im,W-300-im.naturalWidth*k/2,235-im.naturalHeight*k/2,im.naturalWidth*k,im.naturalHeight*k); }
  /* top 5: o 1.º grande à esquerda, os outros em fila à direita */
  const secao=(y0,tit,sub,ls,val,vazio)=>{ txt(tit,150,y0+96,104,CZ.dred); txt(sub,W-150,y0+96,54,CZ.mut,"right",false); c.fillStyle=CZ.red; c.fillRect(150,y0+124,W-300,8);
    if(!ls.length){ txt(vazio,W/2,y0+460,64,CZ.mut,"center",false); return; }
    const [p,...rs]=ls, cx=480, cy=y0+180+260; atleta(p,cx,cy,520,CZ.gold,1);
    txt(p.nome,cx,y0+800,80,CZ.ink,"center",true,640); txt(val(p),cx,y0+880,72,CZ.red,"center");
    const x0=900, larg=W-150-x0, sw=larg/Math.max(4,rs.length), d=Math.min(290,sw-50);
    rs.forEach((x,i)=>{ const sx=x0+sw*(i+.5), sy=y0+250+d/2, pos=ls.findIndex(z=>z===x)+1, w=String(x.nome).split(/\s+/);
      atleta(x,sx,sy,d,CZ.red,pos); txt(w[0]||"",sx,sy+d/2+80,56,CZ.ink,"center",true,sw-24); txt(w.slice(1).join(" "),sx,sy+d/2+142,56,CZ.ink,"center",true,sw-24);
      txt(val(x),sx,sy+d/2+214,56,CZ.red,"center"); }); };
  secao(530,"HOMEM-CHAMPIONS","quem soma mais pontos",L.champions,x=>`${x.Pts} ${x.Pts===1?"PT":"PTS"}`,"Ainda sem jogos terminados neste período");
  secao(1460,"HOMEM-GOLO","quem marca mais golos",L.golo,x=>`${x.golos} ${x.golos===1?"GOLO":"GOLOS"}`,"Ainda sem golos neste período");
  /* trono da vergonha: a ilustração com a foto do rei num medalhão */
  txt("·  TRONO DA VERGONHA  ·",W/2,2470,84,CZ.dred,"center");
  const trono=(x0,tit,k,rei,un)=>{ const w=1060, y0=2520, h=880; caixa(x0,y0,w,h,36,CZ.dred);
    const im=imgs[k]; caixa(x0+30,y0+30,560,h-60,24,"#FFFFFF"); if(im){ const s=Math.min(540/im.naturalWidth,(h-80)/im.naturalHeight), iw=im.naturalWidth*s, ih=im.naturalHeight*s; c.drawImage(im,x0+30+(560-iw)/2,y0+30+(h-60-ih)/2,iw,ih); }
    const rx=x0+590+(w-590)/2; txt(tit,rx,y0+110,62,CZ.gold,"center",true,w-640);
    if(!rei.reis.length){ txt("Trono vazio",rx,y0+440,64,CZ.card,"center",false); return; }
    const n=Math.min(3,rei.reis.length), d=n===1?300:n===2?200:140;
    rei.reis.slice(0,n).forEach((x,i)=>atleta(x,rx+(i-(n-1)/2)*(d+16),y0+150+d/2,d,CZ.gold,0));
    const yt=y0+150+d+80, ny=yt+(n-1)*66; rei.reis.slice(0,n).forEach((x,i)=>txt(x.nome,rx,yt+i*66,n===1?64:54,"#FFFFFF","center",true,w-640));
    txt(`${rei.m} ${rei.m===1?un[0]:un[1]}`+(rei.reis.length>1?" · partilham o trono":""),rx,ny+76,50,CZ.card,"center",false,w-640);
    if(rei.corrida.length){ txt("Na corrida ao trono:",rx,ny+150,44,CZ.gold,"center",false,w-640); rei.corrida.forEach((x,i)=>txt(`${x.nome} · ${x.tot}`,rx,ny+206+i*56,46,CZ.card,"center",false,w-640)); } };
  trono(150,"REI DO MEINHO","rankings/rei-dos-meinhos-720.jpg",L.meinho,["× 21 passes","× 21 passes"]);
  trono(W-150-1060,"REI DAS CUECAS","rankings/rei-das-cuecas-720.jpg",L.cueca,["cueca","cuecas"]);
  /* rodapé */
  c.fillStyle=CZ.ink; c.fillRect(0,H-90,W,90);
  txt("Só contam jogos com «Fim do jogo» · GR fora dos pontos e dos golos · atualizado a "+new Date().toLocaleDateString("pt-PT"),150,H-32,40,"#B9B2A3","left",false,1800);
  txt("SCA Performance",W-150,H-32,40,"#B9B2A3","right");
  return cv; }
function folhaCartaz(F){ let cv=null;
  folha(`<h3>Cartaz do balneário</h3><p class="sub" style="margin:0">${esc(filtroTxt(F))} · Homem-Champions, Homem-Golo, Rei do Meinho e Rei das Cuecas. A3 vertical (também imprime em A4). Usa o filtro escolhido.</p>
    <div class="cz-prev" id="cz-p"><p class="sub">A preparar o cartaz…</p></div>
    <div class="actions"><button class="btn" data-close>Fechar</button><button class="btn" id="cz-j" disabled>⬇ Imagem (JPG)</button><button class="btn primary" id="cz-pdf" disabled>⬇ PDF A3</button></div>`,async(s)=>{
    const q=x=>s.querySelector(x);
    try{ cv=await cartazCanvas(F); const im=new Image(); im.alt="Pré-visualização do cartaz"; im.src=cv.toDataURL("image/jpeg",.7); q("#cz-p").replaceChildren(im); q("#cz-j").disabled=false; q("#cz-pdf").disabled=false; }
    catch(e){ q("#cz-p").innerHTML=`<p class="sub">Não consegui desenhar o cartaz (${esc(e?.message||"erro")}).</p>`; return; }
    q("#cz-j").onclick=async()=>{ try{ const b=await new Promise(ok=>cv.toBlob(ok,"image/jpeg",.92)); await guardaFicheiro(nomeFich("Cartaz",F)+".jpg",b,"image/jpeg"); toast("Cartaz guardado"); }catch(e){ if(e?.code!=="declined") toast("Não foi possível guardar ("+(e?.code||e?.message||"erro")+")"); } };
    q("#cz-pdf").onclick=async()=>{ const b=q("#cz-pdf"); b.disabled=true;
      try{ await carregaJsPdf(false); const doc=new window.jspdf.jsPDF({unit:"mm",format:"a3"}); doc.addImage(cv.toDataURL("image/jpeg",.92),"JPEG",0,0,297,420,undefined,"FAST");
        await guardaFicheiro(nomeFich("Cartaz",F)+".pdf",new Uint8Array(doc.output("arraybuffer")),"application/pdf"); toast("Cartaz guardado"); }
      catch(e){ if(e?.code!=="declined") toast(e?.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet.":"Não foi possível guardar ("+(e?.code||e?.message||"erro")+")"); }
      finally{ b.disabled=false; } }; }); }
