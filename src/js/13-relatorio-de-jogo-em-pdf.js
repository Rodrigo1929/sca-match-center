/* ---------- relatório de jogo em PDF ---------- */
function jogoAtualRel(){ return {...snapshotJogo(),resultado:placar()}; }
async function relatorioPdf(G){
  if(!window.jspdf) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  if(!window.jspdf.jsPDF.API.autoTable) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
  const doc=new window.jspdf.jsPDF({unit:"pt",format:"a4"}), PW=595.28, M=36, RED=[192,0,0], INK=[27,26,23], MUT=[110,106,98];
  const C=COMPS[G.comp]||null, regs=(G.analise?.regs)||[], posse=G.analise?.posse||{};
  const nm=n=>{ const p=(G.onze||[]).concat(G.suplentes||[]).find(x=>x.n===n); return p?.nome||nome(n)||""; }, rotN=n=>n?`${n} ${nm(n)}`.trim():"";
  const T=(txt,x,y,o={})=>{ doc.setFont("helvetica",o.b?"bold":"normal"); doc.setFontSize(o.s||10); doc.setTextColor(...(o.c||INK)); doc.text(String(txt),x,y,o.al?{align:o.al}:undefined); };
  let y=M;
  const titulo=t=>{ if(y>760){ doc.addPage(); y=M; } T(t.toUpperCase(),M,y+12,{b:1,s:10,c:RED}); doc.setDrawColor(...RED); doc.setLineWidth(1.2); doc.line(M,y+16,PW-M,y+16); y+=24; };
  const tabela=(head,body,o={})=>{ doc.autoTable({startY:y,head:[head],body,margin:{left:M,right:M},theme:"grid",styles:{font:"helvetica",fontSize:o.fs||8.5,cellPadding:3,textColor:INK,lineColor:[220,216,206],lineWidth:.5},
      headStyles:{fillColor:[245,243,238],textColor:MUT,fontStyle:"bold",fontSize:7.5},columnStyles:o.cols||{},didParseCell:o.dpc}); y=doc.lastAutoTable.finalY+14; };
  // cabeçalho
  doc.setFillColor(...RED); doc.rect(0,0,PW,92,"F");
  T("RELATÓRIO DE JOGO",M,30,{b:1,s:9,c:[255,225,225]});
  T(`SC Angrense  ${G.resultado?.nos??"-"} - ${G.resultado?.eles??"-"}  ${G.adversario||"Adversário"}`,M,60,{b:1,s:22,c:[255,255,255]});
  T([C?.nome,G.data?new Date(G.data+"T12:00").toLocaleDateString("pt-PT"):""].filter(Boolean).join("  ·  "),M,80,{s:10,c:[255,225,225]});
  y=112;
  // golos e cartões
  const ev=(G.eventos||[]).slice().sort((a,b)=>(minSeg(a.min)??0)-(minSeg(b.min)??0));
  if(ev.length){ titulo("Golos e cartões"); tabela(["Min","Evento","Jogador","Nota"],ev.map(e=>[e.min||"",EVT[e.tipo]?.[1]||e.tipo,e.n?rotN(e.n):"",e.obs||""]),{cols:{0:{cellWidth:40}}}); }
  // onze e minutos
  const mins=G.minutos||[]; const cart={}; ev.forEach(e=>{ if(!e.n) return; if(e.tipo==="amarelo") cart[e.n]=(cart[e.n]||"")+"A"; if(e.tipo==="vermelho") cart[e.n]=(cart[e.n]||"")+"V"; });
  const subsR=G.subsReais||[];
  if((G.onze||[]).length){ titulo("Onze, substituições e minutos");
    const lin=(G.onze||[]).map(o=>{ const sb=subsR.find(l=>l.sai===o.n), mm=mins.find(x=>x.n===o.n); return [o.n,o.nome||nm(o.n),o.pos||"",sb?(sb.int?"Sai ao intervalo":"Sai "+sb.min):"",mm?mm.min+"'":"",cart[o.n]?cart[o.n].replace("AA","2A").replace(/A/,"Amarelo ").replace("V","Vermelho"):""]; });
    subsR.forEach(l=>{ const mm=mins.find(x=>x.n===l.entra); lin.push([l.entra,nm(l.entra),"Suplente",(l.int?"Entra ao intervalo":"Entra "+l.min)+` (por ${l.sai})`,mm?mm.min+"'":"",cart[l.entra]?cart[l.entra].replace("AA","2A").replace(/A/,"Amarelo ").replace("V","Vermelho"):""]); });
    tabela(["Nº","Jogador","Pos.","Substituição","Min","Cartão"],lin,{cols:{0:{cellWidth:28},4:{cellWidth:36,halign:"right"}}});
    if(C&&C.subs<99) { T(`${subsR.length} de ${C.subs} substituições · ${paragensDe(subsR.map((l,i)=>({...l,id:"s"+i}))).length} de ${C.paragens} paragens (intervalo não conta)`,M,y-4,{s:8,c:MUT}); y+=8; } }
  // posse
  if(posse["1"]){ titulo("Posse e tempo útil"); const z={nos:0,eles:0,div:0,fora:0}; const P1={...z,...posse["1"]}, P2={...z,...posse["2"]}, Tt={}; Object.keys(z).forEach(k=>Tt[k]=P1[k]+P2[k]);
    const row=(n,a)=>{ const u=a.nos+a.eles+a.div, p=a.nos+a.eles?Math.round(a.nos/(a.nos+a.eles)*100):null; return [n,fmt(a.nos),fmt(a.eles),fmt(a.div),fmt(a.fora),fmt(u),p==null?"-":p+"% / "+(100-p)+"%"]; };
    tabela(["","Nossa","Adversário","Dividida","Bola fora","Tempo útil","Posse SCA / ADV"],[row("1.ª parte",P1),row("2.ª parte",P2),row("Total",Tt)],{dpc:d=>{ if(d.section==="body"&&d.row.index===2) d.cell.styles.fontStyle="bold"; }}); }
  { const cs=ev.filter(e=>e.tipo==="canto"); if(cs.length){ titulo("Cantos SC Angrense");
    const ZN={"1º":"1º poste","2º":"2º poste","PA":"Pequena-área"}, RS={C:"Corte",FB:"Finalização à baliza",FF:"Finalização fora"};
    tabela(["Min","Canto usado","Zona","Ação"],cs.map(e=>[e.min||"",e.bpl?nomeBpl(e.bpl):"",ZN[e.zona]||"",RS[e.res]||""]),{cols:{0:{cellWidth:40}}}); } }
  if(regs.length){
    titulo("Eficácia por origem"); tabela(["Origem","Ações","Remates","Enquadr.","Golos","Perdas","Remates adv.","Golos adv."],eficacia(regs).map(L=>[L.nome.replace("↳","  -"),L.nos.acoes,L.nos.rem,L.nos.enq,L.nos.golos,L.nos.perdas,L.eles.rem,L.eles.golos]));
    // ações por jogador
    const usadas=[...new Set(regs.map(x=>x.ac))]; const nomesA=usadas.map(id=>regs.find(x=>x.ac===id).acao||acaoDe(id).nome);
    const chave=x=>x.eq==="eles"?"ADV":(x.j||"COL"); const ks=[...new Set(regs.map(chave))].sort((a,b)=>(a==="ADV")-(b==="ADV")||(a==="COL")-(b==="COL")||byNum(a,b));
    titulo("Ações por jogador");
    tabela(["Jogador",...nomesA,"Total"],ks.map(k=>{ const v=usadas.map(id=>regs.filter(x=>chave(x)===k&&x.ac===id).length); return [k==="ADV"?"Adversário":k==="COL"?"Coletivo":rotN(k),...v.map(n=>n||""),v.reduce((a,b)=>a+b,0)]; }),{fs:7,cols:{0:{cellWidth:90}}});
    // mapa
    if(y>520){ doc.addPage(); y=M; } titulo("Mapa das ações do SC Angrense (ataque para a direita)");
    const pts=regs.filter(x=>x.eq==="nos").map(x=>({x:x.x,y:x.y,...(x.x2!=null?{x2:x.x2,y2:x.y2,lw:180}:{}),cor:acaoDe(x.ac).cor,r:850,txt:x.j||"",op:.9}));
    const jpg=await svgParaJpeg(campoAnalise(null,pts),await cssFontes(),1600); const wImg=PW-2*M, hImg=wImg*H/W; doc.addImage(jpg,"JPEG",M,y,wImg,hImg,undefined,"FAST"); y+=hImg+10;
    const leg=[...new Set(regs.filter(x=>x.eq==="nos").map(x=>x.ac))]; let lx=M; leg.forEach(id=>{ const a=acaoDe(id); const rgb=a.cor.match(/\w\w/g).map(h=>parseInt(h,16)); doc.setFillColor(...rgb); doc.rect(lx,y-7,7,7,"F"); T(a.nome,lx+10,y,{s:7.5,c:MUT}); lx+=doc.getTextWidth(a.nome)+24; if(lx>PW-M-80){ lx=M; y+=12; } }); y+=16; }
  // notas
  if((G.notas||[]).length){ titulo("Notas do jogo"); tabela(["Min","Parte","Nota"],G.notas.slice().sort((a,b)=>(seg(a.t))-(seg(b.t))).map(n=>[n.t||"",n.parte+".ª",n.txt||""]),{cols:{0:{cellWidth:40},1:{cellWidth:40}}}); }
  if(G.obs){ titulo("Observações"); doc.setFont("helvetica","normal"); doc.setFontSize(9.5); doc.setTextColor(...INK); const ls=doc.splitTextToSize(G.obs,PW-2*M); doc.text(ls,M,y); y+=ls.length*12; }
  const np=doc.getNumberOfPages(); for(let i=1;i<=np;i++){ doc.setPage(i); T(`SC Angrense · Relatório de jogo vs ${G.adversario||""} · ${i}/${np}`,PW/2,820,{s:7.5,c:MUT,al:"center"}); }
  return doc; }
async function guardaRelatorio(G,botao){ return guardaPdfRel(()=>relatorioPdf(G),`Relatorio_SCA_vs_${(G.adversario||"jogo").replace(/[^\wÀ-ÿ-]+/g,"_")}_${G.data||new Date().toISOString().slice(0,10)}.pdf`,botao); }
async function guardaPdfRel(gera,nomeF,botao){ if(botao) botao.disabled=true; toast("A gerar o relatório…");
  try{ const doc=await gera(); const buf=doc.output("arraybuffer");
    let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
    if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([buf],{type:"application/pdf"})); a.download=nomeF; document.body.appendChild(a); a.click(); a.remove(); }
    else { await dl.save({filename:nomeF,data:new Uint8Array(buf)}); toast("Relatório guardado"); } }
  catch(e){ if(e?.code!=="declined") toast(e?.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet.":"Não foi possível gerar o relatório ("+(e?.code||e?.message||"erro")+")"); }
  finally{ if(botao) botao.disabled=false; } }
/* v112.12: todas as ações do Pós-jogo partidas por atleta (uma página por atleta, para enviar aos jogadores; podem ver os colegas).
   F = fonteRel() (jogo atual ou arquivado). Índice na 1.ª página com ligação para cada atleta; no fim, ações coletivas (sem jogador) e do adversário. */
async function acoesAtletaPdf(F){
  if(!window.jspdf) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  if(!window.jspdf.jsPDF.API.autoTable) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
  const doc=new window.jspdf.jsPDF({unit:"pt",format:"a4"}), PW=595.28, M=36, RED=[192,0,0], INK=[27,26,23], MUT=[110,106,98];
  const T=(txt,x,y,o={})=>{ doc.setFont("helvetica",o.b?"bold":"normal"); doc.setFontSize(o.s||10); doc.setTextColor(...(o.c||INK)); doc.text(String(txt),x,y,o.al?{align:o.al}:undefined); };
  const R=F.arq?F.arq.resultado:placar(), res=R&&(R.nos!==""||R.eles!=="")?`${R.nos??"-"} - ${R.eles??"-"}`:"-", jogoTxt=`SC Angrense ${res} ${F.adversario||"Adversário"}`, data=F.data?new Date(F.data+"T12:00").toLocaleDateString("pt-PT"):"";
  const regs=F.regs.slice().sort((a,b)=>a.parte-b.parte||a.seg-b.seg), nomeA=id=>F.acao(id).nome;
  const grupos=[...new Set(regs.filter(r_=>r_.eq!=="eles"&&r_.j).map(r_=>r_.j))].sort(byNum).map(k=>({tit:`${k} · ${F.nome(k)||""}`.replace(/ · $/,""),ls:regs.filter(r_=>r_.eq!=="eles"&&r_.j===k)}));
  const col=regs.filter(r_=>r_.eq!=="eles"&&!r_.j), adv=regs.filter(r_=>r_.eq==="eles");
  if(col.length) grupos.push({tit:"Coletivo (sem jogador)",ls:col}); if(adv.length) grupos.push({tit:F.adversario||"Adversário",ls:adv,adv:true});
  const cab=(t,sub,h)=>{ doc.setFillColor(...RED); doc.rect(0,0,PW,h,"F"); T(sub,M,24,{b:1,s:8.5,c:[255,225,225]}); T(t,M,h-18,{b:1,s:h>80?22:18,c:[255,255,255]}); };
  cab(jogoTxt,`AÇÕES POR ATLETA${data?"  ·  "+data:""}`,92);
  const conta=ls=>{ const c={}; ls.forEach(r_=>{ const n=nomeA(r_.ac); c[n]=(c[n]||0)+1; }); return Object.entries(c).sort((a,b)=>b[1]-a[1]); };
  const paginas=[];
  grupos.forEach(G=>{ doc.addPage(); paginas.push(doc.getNumberOfPages()); cab(G.tit,`${G.adv?"ADVERSÁRIO":"AÇÕES DO ATLETA"}  ·  ${jogoTxt}${data?"  ·  "+data:""}`,70);
    const go=G.ls.filter(r_=>r_.go).length, resumo=conta(G.ls).map(([n,v])=>`${n} ${v}`).join("  ·  ")+(go?`  ·  ⭐ Grandes oportunidades ${go}`:"");
    doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(...INK); const ls=doc.splitTextToSize(`${G.ls.length} ${G.ls.length===1?"ação":"ações"}:  ${resumo.replace(/⭐ /g,"")}`,PW-2*M); doc.text(ls,M,92); const y0=92+ls.length*11+6;
    const lk=G.ls.map(r_=>F.video?linkVideoModo({t:minutoReg(r_),parte:r_.parte},F.video,"web"):null);
    doc.autoTable({startY:y0,head:[["Min","Parte","Ação","Tipo","Origem","G. oport.","Vídeo"]],body:G.ls.map((r_,i)=>[minutoReg(r_),r_.parte+".ª",nomeA(r_.ac),r_.tipo||"",ORIG[r_.or||"org"]+(r_.or==="bp"&&r_.bpl?" · "+nomeBpl(r_.bpl):""),r_.go?"Sim":"",lk[i]?"Ver lance":""]),
      margin:{left:M,right:M,top:M},theme:"grid",styles:{font:"helvetica",fontSize:8.5,cellPadding:3,textColor:INK,lineColor:[220,216,206],lineWidth:.5},headStyles:{fillColor:[245,243,238],textColor:MUT,fontStyle:"bold",fontSize:7.5},
      columnStyles:{0:{cellWidth:42},1:{cellWidth:34},5:{cellWidth:46,halign:"center"},6:{cellWidth:52,textColor:RED,fontStyle:"bold"}},
      didDrawCell:d=>{ if(d.section==="body"&&d.column.index===6&&lk[d.row.index]) doc.link(d.cell.x,d.cell.y,d.cell.width,d.cell.height,{url:lk[d.row.index]}); } }); });
  /* índice na 1.ª página (tocar no nome abre a página do atleta) */
  doc.setPage(1);
  if(!grupos.length) T("Este jogo ainda não tem ações registadas no Pós-jogo.",M,124,{s:10,c:MUT});
  else { T("ÍNDICE",M,124,{b:1,s:10,c:RED}); doc.setDrawColor(...RED); doc.setLineWidth(1.2); doc.line(M,128,PW-M,128);
    doc.autoTable({startY:136,head:[["Atleta","Ações","Grandes oport.","Página"]],body:grupos.map((G,i)=>[G.tit,G.ls.length,G.ls.filter(r_=>r_.go).length||"",paginas[i]]),margin:{left:M,right:M},theme:"grid",
      styles:{font:"helvetica",fontSize:9,cellPadding:4,textColor:INK,lineColor:[220,216,206],lineWidth:.5},headStyles:{fillColor:[245,243,238],textColor:MUT,fontStyle:"bold",fontSize:7.5},columnStyles:{1:{halign:"right",cellWidth:50},2:{halign:"right",cellWidth:80},3:{halign:"right",cellWidth:50}},
      didDrawCell:d=>{ if(d.section==="body") doc.link(d.cell.x,d.cell.y,d.cell.width,d.cell.height,{pageNumber:paginas[d.row.index]}); } });
    if(!F.video) T("Sem vídeo do jogo configurado: as ações saem sem ligação ao lance.",M,doc.lastAutoTable.finalY+16,{s:8,c:MUT}); }
  const np=doc.getNumberOfPages(); for(let i=1;i<=np;i++){ doc.setPage(i); T(`SC Angrense · Ações por atleta vs ${F.adversario||""} · ${i}/${np}`,PW/2,820,{s:7.5,c:MUT,al:"center"}); }
  return doc; }
function guardaAcoesAtleta(F,botao){ return guardaPdfRel(()=>acoesAtletaPdf(F),`Acoes_por_atleta_SCA_vs_${(F.adversario||"jogo").replace(/[^\wÀ-ÿ-]+/g,"_")}_${F.data||new Date().toISOString().slice(0,10)}.pdf`,botao); }
/* jogadores do jogo: titulares, quem entrou e quem tem ações registadas */
function jogadoresRel(G){ return [...new Set([...(G.onze||[]).map(o=>o.n),...(G.subsReais||[]).map(l=>l.entra),...((G.analise?.regs)||[]).filter(x=>x.eq==="nos"&&x.j).map(x=>x.j)])].filter(Boolean).sort(byNum); }
const nomeJogRel=(G,k)=>{ const p=(G.onze||[]).concat(G.suplentes||[]).find(x=>x.n===k); return p?.nome||nome(k)||""; };
