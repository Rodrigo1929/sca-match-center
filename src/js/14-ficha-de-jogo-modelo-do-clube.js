/* ---------- ficha de jogo (modelo do clube) ---------- */
function minFicha(m){ const v=typeof m==="number"?m:minSeg(m); if(v==null) return String(m||""); return (Math.floor(v/60)+1)+"'"; }
function fichaDados(G){ const F=G.ficha||{}, ev=(G.eventos||[]).slice().sort((a,b)=>(minSeg(a.min)??0)-(minSeg(b.min)??0)), regs=(G.analise?.regs)||[];
  const nm=n=>{ const p=(G.onze||[]).concat(G.suplentes||[]).find(x=>x.n===n); return p?.nome||nome(n)||""; };
  const mins=G.minutos||[], subsR=G.subsReais||[];
  const ordem=[...(G.onze||[]).map(o=>o.n),...subsR.map(l=>l.entra),...(G.suplentes||[]).map(x=>x.n)]; const vistos=new Set();
  const linhas=ordem.filter(n=>n&&!vistos.has(n)&&vistos.add(n)).slice(0,20).map(n=>{ const m=mins.find(x=>x.n===n), am=ev.filter(e=>e.tipo==="amarelo"&&e.n===n), vm=ev.find(e=>e.tipo==="vermelho"&&e.n===n);
    const jogou=!!m&&(m.fim==null||m.fim>m.ini);
    return {nome:`${n}  ${nm(n)}`,eq1:jogou&&m.ini<2700,eq2:jogou&&(m.fim==null||m.fim>2700)&&!(m.fim!=null&&m.fim<=2700),min:m?m.min+"'":"",am1:am[0]?minFicha(am[0].min):"",am2:am[1]?minFicha(am[1].min):"",verm:vm?minFicha(vm.min):(am[1]?minFicha(am[1].min):"")}; });
  const subs=subsR.map(l=>({min:l.int?"Int.":minFicha(l.min),entra:l.entra,sai:l.sai}));
  let fin=regs.filter(x=>x.eq==="nos"&&["re","rd","rb","golo"].includes(x.ac)).sort((a,b)=>a.parte-b.parte||a.seg-b.seg).map(x=>({min:minFicha((x.parte===2?2700:0)+x.seg),n:x.j||"",a:x.ac==="golo"?"G":x.ac==="re"?"RE":"RF"}));
  if(!fin.length) fin=ev.filter(e=>e.tipo==="golo").map(e=>({min:minFicha(e.min),n:e.n||"",a:"G"}));
  let cantos=ev.filter(e=>e.tipo==="canto").map(e=>({min:minFicha(e.min),zona:e.zona||"",res:e.res||""}));
  if(!cantos.length) cantos=regs.filter(x=>x.eq==="nos"&&x.ac==="can").sort((a,b)=>a.parte-b.parte||a.seg-b.seg).map(x=>({min:minFicha((x.parte===2?2700:0)+x.seg),zona:x.tipo==="1º poste"?"1º":x.tipo==="2º poste"?"2º":x.tipo==="Pequena-área"?"PA":"",res:""}));
  const golos=ev.filter(e=>e.tipo==="golo").map(e=>({min:minFicha(e.min),n:e.n||"",a:(e.gt||[]).join(" ")}));
  const assist=ev.filter(e=>e.tipo==="golo"&&e.as).map(e=>({min:minFicha(e.min),n:e.as,a:e.ast||""}));
  const sofr=ev.filter(e=>e.tipo==="golo_adv").map(e=>({min:minFicha(e.min),n:e.na||"",a:(e.gt||[]).join(" ")}));
  const gN=G.resultado?.nos!==""&&G.resultado?.nos!=null?+G.resultado.nos:ev.filter(e=>e.tipo==="golo").length, gE=G.resultado?.eles!==""&&G.resultado?.eles!=null?+G.resultado.eles:ev.filter(e=>e.tipo==="golo_adv").length;
  let iN=ev.filter(e=>e.tipo==="golo"&&(minSeg(e.min)??0)<2700).length, iE=ev.filter(e=>e.tipo==="golo_adv"&&(minSeg(e.min)??0)<2700).length;
  const mI=String(F.resInt||"").match(/(\d+)\s*[-xX:]\s*(\d+)/); if(mI){ iN=+mI[1]; iE=+mI[2]; }
  const casa=F.casa!=="fora", adv=G.adversario||"";
  const st=F.staff||{}, cap=k=>st[k]?`${st[k]}  ${(F.staffNomes&&F.staffNomes[k])||nome(st[k])}`:"";
  const dt=G.data?new Date(G.data+"T12:00"):null;
  return {prova:F.prova||(COMPS[G.comp]||{}).nome||"",jornada:F.jornada||"",local:F.local||"",visitado:casa?"SC Angrense":adv,visitante:casa?adv:"SC Angrense",
    data:dt?dt.toLocaleDateString("pt-PT",{day:"2-digit",month:"short",year:"numeric"}).replace(".",""):"",hora:F.hora||"",escalao:F.escalao||"Seniores",
    staff:[st.diretor,st.treinador,st.adjunto,st.trgr,st.prepfis,st.psicologa,st.saude].map(x=>x||""),caps:[cap("cap1"),cap("cap2"),cap("cap3")],
    linhas,subs,fin,cantos,golos,assist,sofr,int:casa?[iN,iE]:[iE,iN],fim:casa?[gN,gE]:[gE,gN]}; }
async function fichaPdf(G){
  if(!window.jspdf) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const D=fichaDados(G), doc=new window.jspdf.jsPDF({unit:"pt",format:"a4"}), K=72/110, X=v=>v*K;
  const RED=[192,0,0], GR=[217,217,217], LN=[166,166,166];
  const box=(x1,y1,x2,y2,fill,line)=>{ if(fill){ doc.setFillColor(...fill); } doc.setDrawColor(...(line||LN)); doc.setLineWidth(.6); doc.rect(X(x1),X(y1),X(x2-x1),X(y2-y1),fill&&line?"FD":fill?"F":"S"); };
  const txt=(t,x,y,o={})=>{ doc.setFont("helvetica",o.b?"bold":"normal"); doc.setFontSize(o.s||9); doc.setTextColor(...(o.c||[0,0,0])); let v=String(t??"");
    if(o.w){ while(v.length>1&&doc.getTextWidth(v)>X(o.w)) v=v.slice(0,-1); } doc.text(v,X(x),X(y),{align:o.al||"left",baseline:"middle"}); };
  const img=async(u,x,y,w,h)=>{ try{ doc.addImage(await paraDataUrl(u),"PNG",X(x),X(y),X(w),X(h)); }catch(e){} };
  // cabeçalho
  doc.setFillColor(...RED); doc.rect(X(60),X(2),X(722),X(75),"F");
  await img("ficha/sca.png",68,0,56,74);
  txt("SPORT CLUB ANGRENSE",142,35,{s:11,c:[255,255,255]}); txt("FICHA DE JOGO",598,50,{s:11,c:[255,255,255]});
  [["Prova",115,88],["Jornada",350,88],["Local",427,88],["Visitado",115,124],["Visitante",288,124],["Data",461,124],["Hora",567,124],["Escalão",669,124]].forEach(([t,x,y])=>txt(t,x,y,{s:9.5}));
  const gb=(x1,y1,x2,y2,v,al,s)=>{ box(x1,y1,x2,y2,GR); txt(v,al==="l"?x1+4:(x1+x2)/2,(y1+y2)/2+1,{al:al==="l"?"left":"center",s:s||9.5,w:x2-x1-6}); };
  gb(112,95,320,116,D.prova,"l",8.5); gb(355,95,390,116,D.jornada); gb(424,95,782,116,D.local,null,9);
  gb(112,136,250,158,D.visitado,null,9); gb(286,136,424,158,D.visitante,null,9); gb(459,136,532,158,D.data,null,8.5); gb(563,136,632,158,D.hora); gb(667,136,782,158,D.escalao,null,9);
  doc.setDrawColor(0,0,0); doc.setLineWidth(1.2); doc.line(X(60),X(164),X(782),X(164));
  // tabela de jogadores
  txt("Eq.",113,198,{s:6}); txt("1ªP",113,209,{s:6}); txt("Eq.",148,198,{s:6}); txt("2ªP",148,209,{s:6}); txt("Nome",183,218,{s:7});
  await img("ficha/relogio.png",427,185,30,32);
  doc.setFillColor(255,217,102); doc.setDrawColor(0,0,0); doc.setLineWidth(.5); doc.rect(X(504),X(197),X(14),X(20),"FD"); doc.rect(X(530),X(195),X(14),X(20),"FD"); doc.rect(X(540),X(180),X(14),X(20),"FD");
  doc.setFillColor(255,0,0); doc.rect(X(577),X(189),X(15),X(23),"F");
  await img("ficha/cruz.png",736,172,40,42);
  const y0=228, rh=(661-228)/20;
  for(let i=0;i<20;i++){ const y=y0+i*rh, L=D.linhas[i];
    [[112,147],[147,182],[182,389],[424,459],[493,528],[528,563],[563,597]].forEach(([a,b])=>box(a,y,b,y+rh));
    if(L){ if(L.eq1) txt("X",129.5,y+rh/2+1,{al:"center",b:1,s:9}); if(L.eq2) txt("X",164.5,y+rh/2+1,{al:"center",b:1,s:9});
      txt(L.nome,188,y+rh/2+1,{s:9,w:196}); txt(L.min,441.5,y+rh/2+1,{al:"center",s:8.5}); txt(L.am1,510.5,y+rh/2+1,{al:"center",s:8}); txt(L.am2,545.5,y+rh/2+1,{al:"center",s:8}); txt(L.verm,580,y+rh/2+1,{al:"center",s:8}); } }
  // staff
  ["Diretor","Treinador","Tr. Adjunto","Tr. Guarda-Redes","Preparador Físico","Psicóloga","Técnico de Saúde"].forEach((t,k)=>{ const yl=218+k*40, yb=yl+9; txt(t,634,yl,{s:8.5}); box(632,yb,782,yb+21); txt(D.staff[k],636,yb+11,{s:8.5,w:142}); });
  doc.setDrawColor(...LN); doc.line(X(632),X(500),X(782),X(500));
  [["Capitão",510,519],["Sub Capitão",550,559],["3º Capitão",590,599]].forEach(([t,yl,yb],k)=>{ txt(t,634,yl,{s:8.5}); box(632,yb,782,yb+22,[200,200,200],null); txt(D.caps[k],636,yb+12,{s:8,w:142}); });
  // grelhas
  const grelha=(tit,ty,rows,itens,cols0,x2,legenda,ly)=>{ txt(tit,62,ty,{b:1,s:10.5,c:RED}); const nc=Math.max(cols0,itens.length), cw=(x2-112)/nc;
    rows.forEach(([lab,f],ri)=>{ const ya=ty+12+ri*19; txt(lab,110,ya+10,{al:"right",s:8.5}); for(let c=0;c<nc;c++){ box(112+c*cw,ya,112+(c+1)*cw,ya+19); const it=itens[c]; if(it) txt(f(it),112+c*cw+cw/2,ya+10,{al:"center",s:nc>14?7:8.5,w:cw-2}); } });
    if(legenda) txt(legenda,114,ly,{s:6,c:RED}); };
  grelha("Substituições:",688,[["Minuto",x=>x.min],["Entrou",x=>x.entra],["Saiu",x=>x.sai]],D.subs,12,528);
  grelha("Finalizações",767,[["Minuto",x=>x.min],["Nº",x=>x.n],["Ação",x=>x.a]],D.fin,12,528,"RE - Remate Enquadrado   RF - Remate Falhado   G - Golo",843);
  grelha("Cantos SC Angrense",862,[["Minuto",x=>x.min],["Zona",x=>x.zona],["Ação",x=>x.res]],D.cantos,12,528,"1º - 1º Poste  2º - 2º Poste  PA - Pequena-Área   |   C - Corte  FB - Finalização à Baliza  FF - Finalização Fora",938);
  grelha("Golos Marcados",973,[["Minuto",x=>x.min],["Nº",x=>x.n],["Ação",x=>x.a]],D.golos,19,782);
  grelha("Assistências",1048,[["Minuto",x=>x.min],["Nº",x=>x.n],["Ação",x=>x.a]],D.assist,19,782,"DA - Dentro de Área  FA - Fora de Área  L - Livre  C - Canto  P - Penalty  AG - Auto-Golo  CB - Cabeça  JI - Jogada Individual",1126);
  grelha("Golos Sofridos",1145,[["Minuto",x=>x.min],["Nº",x=>x.n],["Ação",x=>x.a]],D.sofr,19,782);
  // partes, tempo, resultados
  txt("Nº de Partes:",698,688,{al:"right",s:8.5}); box(701,678,782,699,[200,200,200],null); txt("2",741.5,689,{al:"center",b:1,s:12});
  txt("Tempo Total de Jogo:",698,728,{al:"right",s:8.5}); box(701,718,782,739,[200,200,200],null); txt("90'",741.5,729,{al:"center",b:1,s:12});
  const res=(tit,ty,v)=>{ txt(tit,689,ty,{al:"center",b:1,s:10,c:RED}); doc.setDrawColor(0,0,0); doc.setLineWidth(1.3); doc.rect(X(617),X(ty+14),X(68),X(62)); doc.rect(X(719),X(ty+14),X(68),X(62));
    txt("X",702,ty+45,{al:"center",b:1,s:14}); txt(v[0],651,ty+45,{al:"center",b:1,s:22}); txt(v[1],753,ty+45,{al:"center",b:1,s:22}); };
  res("Resultado ao Intervalo",767,D.int); res("Resultado ao Final",862,D.fim);
  return doc; }
async function guardaFicha(botao,G){ if(botao) botao.disabled=true; toast("A gerar a ficha de jogo…");
  try{ G=G||{...snapshotJogo(),resultado:placar()}; const doc=await fichaPdf(G); const buf=doc.output("arraybuffer");
    const nomeF=`Ficha_de_Jogo_SCA_vs_${(G.adversario||"jogo").replace(/[^\wÀ-ÿ-]+/g,"_")}_${G.data||new Date().toISOString().slice(0,10)}.pdf`;
    let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
    if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([buf],{type:"application/pdf"})); a.download=nomeF; document.body.appendChild(a); a.click(); a.remove(); }
    else { await dl.save({filename:nomeF,data:new Uint8Array(buf)}); toast("Ficha de jogo guardada"); } }
  catch(e){ if(e?.code!=="declined") toast(e?.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet.":"Não foi possível gerar a ficha ("+(e?.code||e?.message||"erro")+")"); }
  finally{ if(botao) botao.disabled=false; } }