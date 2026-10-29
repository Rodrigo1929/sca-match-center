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
async function guardaRelatorio(G,botao){ if(botao) botao.disabled=true; toast("A gerar o relatório…");
  try{ const doc=await relatorioPdf(G); const buf=doc.output("arraybuffer");
    const nomeF=`Relatorio_SCA_vs_${(G.adversario||"jogo").replace(/[^\wÀ-ÿ-]+/g,"_")}_${G.data||new Date().toISOString().slice(0,10)}.pdf`;
    let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
    if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([buf],{type:"application/pdf"})); a.download=nomeF; document.body.appendChild(a); a.click(); a.remove(); }
    else { await dl.save({filename:nomeF,data:new Uint8Array(buf)}); toast("Relatório guardado"); } }
  catch(e){ if(e?.code!=="declined") toast(e?.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet.":"Não foi possível gerar o relatório ("+(e?.code||e?.message||"erro")+")"); }
  finally{ if(botao) botao.disabled=false; } }
/* ---------- relatório pós-jogo para os jogadores: um para o grupo e um por jogador (só as ações dele) ---------- */
async function relatorioJogadoresPdf(G,n){
  if(!window.jspdf) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  if(!window.jspdf.jsPDF.API.autoTable) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
  const doc=new window.jspdf.jsPDF({unit:"pt",format:"a4"}), PW=595.28, M=36, RED=[192,0,0], INK=[27,26,23], MUT=[110,106,98];
  const C=COMPS[G.comp]||null, todas=(G.analise?.regs)||[], regs=n?todas.filter(x=>x.eq==="nos"&&x.j===n):todas.filter(x=>x.eq==="nos"), E=G.estat;
  const nm=k=>{ const p=(G.onze||[]).concat(G.suplentes||[]).find(x=>x.n===k); return p?.nome||(todas.find(x=>x.j===k)||{}).nome||nome(k)||""; }, rotN=k=>k?`${k} ${nm(k)}`.trim():"";
  const T=(txt,x,y,o={})=>{ doc.setFont("helvetica",o.b?"bold":"normal"); doc.setFontSize(o.s||10); doc.setTextColor(...(o.c||INK)); doc.text(String(txt),x,y,o.al?{align:o.al}:undefined); };
  let y=M;
  const titulo=t=>{ if(y>760){ doc.addPage(); y=M; } T(t.toUpperCase(),M,y+12,{b:1,s:10,c:RED}); doc.setDrawColor(...RED); doc.setLineWidth(1.2); doc.line(M,y+16,PW-M,y+16); y+=24; };
  const tabela=(head,body,o={})=>{ doc.autoTable({startY:y,head:[head],body,margin:{left:M,right:M},theme:"grid",styles:{font:"helvetica",fontSize:o.fs||9,cellPadding:3.5,textColor:INK,lineColor:[220,216,206],lineWidth:.5},
      headStyles:{fillColor:[245,243,238],textColor:MUT,fontStyle:"bold",fontSize:8},columnStyles:o.cols||{},didParseCell:o.dpc}); y=doc.lastAutoTable.finalY+14; };
  // cabeçalho
  doc.setFillColor(...RED); doc.rect(0,0,PW,n?112:92,"F");
  T(n?"PÓS-JOGO · RELATÓRIO INDIVIDUAL":"PÓS-JOGO · RELATÓRIO DA EQUIPA",M,30,{b:1,s:9,c:[255,225,225]});
  T(`SC Angrense  ${G.resultado?.nos??"-"} - ${G.resultado?.eles??"-"}  ${G.adversario||"Adversário"}`,M,60,{b:1,s:22,c:[255,255,255]});
  T([C?.nome,G.data?new Date(G.data+"T12:00").toLocaleDateString("pt-PT"):""].filter(Boolean).join("  ·  "),M,80,{s:10,c:[255,225,225]});
  if(n) T(rotN(n),M,102,{b:1,s:13,c:[255,255,255]});
  if(n){ const fj=await fotoCirculo(String(n),300,12,"#FFFFFF"); if(fj) doc.addImage(fj.toDataURL("image/png"),"PNG",PW-M-90,11,90,90); }   // v100: foto do atleta
  y=n?132:112;
  // resultado e estatística
  const ev=(G.eventos||[]).slice().sort((a,b)=>(minSeg(a.min)??0)-(minSeg(b.min)??0)), golos=ev.filter(e=>e.tipo==="golo"||e.tipo==="golo_adv"), minC=m=>m?String(m).split(":")[0]+"' ":"";
  titulo("Resultado e estatística");
  if(golos.length){ T("Golos: "+golos.map(e=>minC(e.min)+(e.tipo==="golo"?(e.n?nm(e.n)||e.n:"SC Angrense"):(G.adversario||"Adversário"))).join("  ·  "),M,y,{s:9.5}); y+=16; }
  if(E&&E.t) tabela(["","SC Angrense",G.adversario||"Adversário"],ESTAT_LINHAS.map(([k,l])=>[l,...["nos","eles"].map(e=>{ const v=E.t[e][k]; return v==null?"-":v+(k==="posse"?"%":""); })]),{cols:{1:{halign:"center"},2:{halign:"center"}}});
  if(n){ const mm=(G.minutos||[]).find(x=>x.n===n), ct=ev.filter(e=>e.n===n&&(e.tipo==="amarelo"||e.tipo==="vermelho")).map(e=>(e.tipo==="amarelo"?"Amarelo ":"Vermelho ")+minC(e.min).trim()),
      gl=ev.filter(e=>e.tipo==="golo"&&e.n===n).length, as=ev.filter(e=>e.tipo==="golo"&&e.as===n).length;
    T([mm?`Minutos jogados: ${mm.min}'`:"",gl?`Golos: ${gl}`:"",as?`Assistências: ${as}`:"",ct.join(", ")].filter(Boolean).join("   ·   ")||"Sem minutos registados neste jogo.",M,y,{b:1,s:10}); y+=18; }
  // ações: no grupo por jogador; no individual as dele, por tipo e por parte
  if(!todas.length){ titulo("Ações"); T("Este jogo ainda não tem ações registadas no Pós-jogo.",M,y,{s:9.5,c:MUT}); y+=16; }
  else if(n){ titulo("As tuas ações");
    if(!regs.length){ T("Sem ações registadas para ti neste jogo.",M,y,{s:9.5,c:MUT}); y+=16; }
    else { const tipos=[...new Set(regs.map(x=>x.ac+"|"+(x.tipo||"")))];
      tabela(["Ação","1.ª parte","2.ª parte","Total"],tipos.map(k=>{ const [ac,tp]=k.split("|"), rs=regs.filter(x=>x.ac===ac&&(x.tipo||"")===tp);
        return [(rs[0].acao||acaoDe(ac).nome)+(tp?" ("+tp+")":""),rs.filter(x=>x.parte===1).length||"",rs.filter(x=>x.parte===2).length||"",rs.length]; }),{cols:{1:{halign:"center"},2:{halign:"center"},3:{halign:"center",fontStyle:"bold"}}}); } }
  else { const usadas=[...new Set(regs.map(x=>x.ac))], nomesA=usadas.map(id=>regs.find(x=>x.ac===id).acao||acaoDe(id).nome), ks=[...new Set(regs.map(x=>x.j||"COL"))].sort((a,b)=>(a==="COL")-(b==="COL")||byNum(a,b));
    titulo("Ações por jogador"); tabela(["Jogador",...nomesA,"Total"],ks.map(k=>{ const v=usadas.map(id=>regs.filter(x=>(x.j||"COL")===k&&x.ac===id).length); return [k==="COL"?"Coletivo":rotN(k),...v.map(c=>c||""),v.reduce((a,b)=>a+b,0)]; }),{fs:7.5,cols:{0:{cellWidth:100}}}); }
  // mapa
  if(regs.length){ if(y+24+(PW-2*M)*H/W+30>800){ doc.addPage(); y=M; } titulo(n?"Mapa das tuas ações (atacamos para a direita)":"Mapa das ações da equipa (atacamos para a direita)");
    const pts=regs.map(x=>({x:x.x,y:x.y,...(x.x2!=null?{x2:x.x2,y2:x.y2,lw:180}:{}),cor:acaoDe(x.ac).cor,r:850,txt:n?"":x.j||"",op:.9}));
    const jpg=await svgParaJpeg(campoAnalise(null,pts),await cssFontes(),1600), wImg=PW-2*M, hImg=wImg*H/W; doc.addImage(jpg,"JPEG",M,y,wImg,hImg,undefined,"FAST"); y+=hImg+10;
    let lx=M; [...new Set(regs.map(x=>x.ac))].forEach(id=>{ const a=acaoDe(id), rgb=a.cor.match(/\w\w/g).map(h=>parseInt(h,16)), txt=regs.find(x=>x.ac===id).acao||a.nome;
      doc.setFillColor(...rgb); doc.rect(lx,y-7,7,7,"F"); T(txt,lx+10,y,{s:7.5,c:MUT}); lx+=doc.getTextWidth(txt)+24; if(lx>PW-M-80){ lx=M; y+=12; } }); }
  const np=doc.getNumberOfPages(); for(let i=1;i<=np;i++){ doc.setPage(i); T(`SC Angrense · Pós-jogo vs ${G.adversario||""}${n?" · "+rotN(n):""} · ${i}/${np}`,PW/2,820,{s:7.5,c:MUT,al:"center"}); }
  return doc; }
/* jogadores do jogo: titulares, quem entrou e quem tem ações registadas */
function jogadoresRel(G){ return [...new Set([...(G.onze||[]).map(o=>o.n),...(G.subsReais||[]).map(l=>l.entra),...((G.analise?.regs)||[]).filter(x=>x.eq==="nos"&&x.j).map(x=>x.j)])].filter(Boolean).sort(byNum); }
const nomeJogRel=(G,k)=>{ const p=(G.onze||[]).concat(G.suplentes||[]).find(x=>x.n===k); return p?.nome||nome(k)||""; };
async function guardaPdfJogadores(G,quem){ const base=`PosJogo_SCA_vs_${(G.adversario||"jogo").replace(/[^\wÀ-ÿ-]+/g,"_")}_${G.data||new Date().toISOString().slice(0,10)}`;
  let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
  for(const n of quem){ toast(n?`A gerar o PDF do ${n}…`:"A gerar o PDF da equipa…");
    try{ const doc=await relatorioJogadoresPdf(G,n), buf=doc.output("arraybuffer"), nomeF=`${base}_${n?[n,nomeJogRel(G,n)].filter(Boolean).join("_").replace(/[^\wÀ-ÿ-]+/g,"_"):"equipa"}.pdf`;
      if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([buf],{type:"application/pdf"})); a.download=nomeF; document.body.appendChild(a); a.click(); a.remove(); }
      else await dl.save({filename:nomeF,data:new Uint8Array(buf)}); }
    catch(e){ if(e?.code==="declined") continue; toast(e?.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet.":"Não foi possível gerar o PDF ("+(e?.code||e?.message||"erro")+")"); return; } }
  toast(quem.length>1?`${quem.length} PDF prontos`:"PDF pronto"); }
function folhaPdfJogadores(G){ const js=jogadoresRel(G), regs=(G.analise?.regs)||[], sel=new Set(js.filter(k=>regs.some(x=>x.j===k)));
  folha(`<h3>PDF para os jogadores · vs ${esc(G.adversario||"")}</h3>
    <p class="sub" style="margin:0">Resultado e estatística, ações por jogador e mapa das ações. Sem as notas nem os pormenores da equipa técnica.</p>
    <button class="btn primary" id="pj-g" style="align-self:flex-start">⬇ Relatório da equipa (para o grupo)</button>
    <h4 style="margin-bottom:0">Individuais <span class="sub">(um PDF por jogador, só com as ações dele)</span></h4>
    ${js.length?`<div class="chips" id="pj-js">${js.map(k=>`<button class="chip" data-k="${esc(k)}"><b>${esc(k)}</b><span>${esc(nomeJogRel(G,k))}</span></button>`).join("")}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" id="pj-t">Todos</button><button class="btn sm" id="pj-n">Nenhum</button></div>`:`<p class="sub" style="margin:0">Sem jogadores neste jogo.</p>`}
    <div class="actions"><button class="btn" data-close>Fechar</button><button class="btn primary" id="pj-i">⬇ Individuais (<span id="pj-c">0</span>)</button></div>`,(s,fecha)=>{
    const pinta=()=>{ s.querySelectorAll("#pj-js .chip").forEach(b=>b.setAttribute("aria-pressed",String(sel.has(b.dataset.k)))); s.querySelector("#pj-c").textContent=sel.size; }; pinta();
    s.querySelectorAll("#pj-js .chip").forEach(b=>b.onclick=()=>{ const k=b.dataset.k; if(sel.has(k)) sel.delete(k); else sel.add(k); pinta(); });
    if(s.querySelector("#pj-t")){ s.querySelector("#pj-t").onclick=()=>{ js.forEach(k=>sel.add(k)); pinta(); }; s.querySelector("#pj-n").onclick=()=>{ sel.clear(); pinta(); }; }
    s.querySelector("#pj-g").onclick=()=>{ fecha(); guardaPdfJogadores(G,[null]); };
    s.querySelector("#pj-i").onclick=()=>{ if(!sel.size){ toast("Escolhe pelo menos um jogador."); return; } fecha(); guardaPdfJogadores(G,js.filter(k=>sel.has(k))); }; }); }
