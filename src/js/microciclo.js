/* ---------- Resumo do microciclo (v101, Entrega E1) ----------
   Liga-se ao plano semanal e à Época pela segunda-feira da semana: semanas/{seg}, ciclos/micro-{seg} e microResumo/{seg}.
   O que vem das UT (volume, atletas, exercícios), do plano semanal (hora, local, folgas, viagens) e do calendário (jogos) calcula-se na hora;
   só se gravam os textos e os campos acertados à mão (um documento por campo: dois aparelhos não se apagam) e o estado.
   mdPadrao/{MD}            = { regime, objetivo, pi, pf, pfin, nivel, folga }   Padrão MD da Época (uma linha por dia relativo ao jogo)
   regimes/{id}             = { nome, int, cor, ordem, bloco }                    regimes e cores; bloco = cor de FOLGA, JOGO, MD ou ESTÁGIO
   microCampo/{seg}~{campo} = { seg, campo, v }                                    campo = "<dia>.md|regime|nivel|obj|pi|pf|pfin" ou analise, perf, positivos, melhorar
   microResumo/{seg}        = { estado: "rascunho"|"fechado", fechadoEm, fechadoPor, hist: [{acao, em, por}] } */
const MD_LINHAS=["MD+1","MD+2","MD-6","MD-5","MD-4","MD-3","MD-2","MD-1","MD"];
const NIVEIS_VOL=["Baixo","Baixo/Moderado","Moderado","Moderado/Alto","Alto"];
const BLOCOS_MC=[["folga","FOLGA","#F4E690"],["casa","JOGO EM CASA (e o estágio)","#F28E86"],["fora","JOGO FORA (e a viagem)","#B3CEFB"]];   // v105: cores do plano do clube
const PARTES_MC=[["pi","inicial","Parte inicial"],["pf","fundamental","Parte fundamental"],["pfin","final","Parte final"]];
const FINAIS_MC=[["analise","Análise do jogo anterior e observações"],["perf","Análise da performance dos jogadores no último jogo"],["positivos","Pontos positivos"],["melhorar","Pontos a melhorar"]];
const DIAS_MC=["2ª","3ª","4ª","5ª","6ª","Sáb","Dom"], DIAS_MC_PDF=["2ª Feira","3ª Feira","4ª Feira","5ª Feira","6ª Feira","Sábado","Domingo"];
const MC_LS="sca-micro-v1";
let mdPadrao={}, regimes={}, microCampo={}, microResumo={};
try{ const x=JSON.parse(localStorage.getItem(MC_LS)||"{}")||{}; mdPadrao=x.p||{}; regimes=x.r||{}; microCampo=x.c||{}; microResumo=x.e||{}; }catch(e){}
let mcSeg=null; try{ mcSeg=localStorage.getItem("sca-micro-cur")||null; }catch(e){}
const corOk=v=>/^#[0-9a-f]{6}$/i.test(String(v||""))?String(v).toUpperCase():"";
function normMdP(d){ const s=v=>String(v??"").trim(); if(!MD_LINHAS.includes(s(d.id))) throw new Error("md");
  return {id:s(d.id),regime:s(d.regime),objetivo:s(d.objetivo),pi:s(d.pi),pf:s(d.pf),pfin:s(d.pfin),nivel:NIVEIS_VOL.includes(d.nivel)?d.nivel:"",folga:!!d.folga,alteradoPor:s(d.alteradoPor),alteradoEm:s(d.alteradoEm)}; }
function normRegime(d){ const s=v=>String(v??"").trim(); if(!s(d.id)) throw new Error("regime");
  return {id:s(d.id),nome:s(d.nome),int:s(d.int),cor:corOk(d.cor)||"#D9D9D9",ordem:Math.round(+d.ordem)||0,bloco:BLOCOS_MC.some(b=>b[0]===s(d.id))||!!d.bloco,alteradoPor:s(d.alteradoPor),alteradoEm:s(d.alteradoEm)}; }
function normMCampo(d){ const s=v=>String(v??"").trim(), id=s(d.id), i=id.indexOf("~"); if(i<10) throw new Error("campo");
  return {id,seg:id.slice(0,i),campo:id.slice(i+1),v:String(d.v??"").replace(/\s+$/,""),ia:!!d.ia,alteradoPor:s(d.alteradoPor),alteradoEm:s(d.alteradoEm)}; }
function normMResumo(d){ const s=v=>String(v??"").trim();
  return {id:s(d.id),estado:d.estado==="fechado"?"fechado":"rascunho",fechadoEm:s(d.fechadoEm),fechadoPor:s(d.fechadoPor),
    hist:(Array.isArray(d.hist)?d.hist:[]).filter(h=>h&&(h.acao==="fechar"||h.acao==="reabrir")).map(h=>({acao:h.acao,em:s(h.em),por:s(h.por)})).slice(-50)}; }
[[mdPadrao,normMdP],[regimes,normRegime],[microCampo,normMCampo],[microResumo,normMResumo]].forEach(([o,f])=>Object.keys(o).forEach(id=>{ try{ o[id]=f({...o[id],id}); }catch(e){ delete o[id]; } }));
function guardaMicroLocal(){ try{ localStorage.setItem(MC_LS,JSON.stringify({p:mdPadrao,r:regimes,c:microCampo,e:microResumo})); }catch(e){} }
const autoria=()=>({alteradoPor:meuId||"",alteradoEm:new Date().toISOString()});
/* um campo do resumo: v=null volta ao valor automático (apaga o documento); ia=true = rascunho da IA por aprovar (v102) */
function gravaCampoMc(seg,campo,v,ia=false,semRender=false){ const id=seg+"~"+campo;
  if(v===null){ delete microCampo[id]; apagaDoc("microCampo/"+id); }
  else { microCampo[id]=normMCampo({id,seg,campo,v,ia,...autoria()}); gravaDoc("microCampo/"+id,microCampo[id]); }
  guardaMicroLocal(); if(!semRender) renderUT(); }
const campoMc=(seg,campo)=>{ const x=microCampo[seg+"~"+campo]; return x?x.v:null; };
const iaMc=(seg,campo)=>{ const x=microCampo[seg+"~"+campo]; return !!(x&&x.ia); };
/* aprovar um rascunho da IA: fica como escrito à mão; os objetivos passam para o microciclo da Época */
function aprovaCampoMc(seg,campo,semRender){ const x=microCampo[seg+"~"+campo]; if(!x||!x.ia) return;
  if(campo==="objPrin"||campo==="objSec"){ const W_=semanaMicro(seg), M=W_.M||{tipo:"micro",inicio:seg,n:W_.n||0}; guardaCiclo({...M,[campo]:x.v}); gravaCampoMc(seg,campo,null,false,true); }
  else gravaCampoMc(seg,campo,x.v,false,true);
  if(!semRender) renderUT(); }
const gravaMdP=P=>{ const N=normMdP({...P,...autoria()}); mdPadrao[N.id]=N; gravaDoc("mdPadrao/"+N.id,N); guardaMicroLocal(); return N; };
const gravaRegime=R=>{ const N=normRegime({...R,...autoria()}); regimes[N.id]=N; gravaDoc("regimes/"+N.id,N); guardaMicroLocal(); return N; };
const rotRegime=R=>R?`${R.nome}${R.int?` (${R.int})`:""}`:"";
const corBloco=k=>(regimes[k]&&regimes[k].cor)||(BLOCOS_MC.find(b=>b[0]===k)||[0,0,"#D9D9D9"])[2];
/* cor e texto de um bloco do dia: jogo e estágio/viagem pela cor do jogo (casa / fora) com texto branco, como no plano do clube */
const corBlocoMc=B=>B.cor||corBloco(B.k);
const tintaBlocoMc=B=>B.cor?"#FFFFFF":tintaDe(corBloco(B.k));
const listaRegimes=()=>Object.values(regimes).filter(R=>!R.bloco).sort((a,b)=>a.ordem-b.ordem||a.nome.localeCompare(b.nome,"pt"));
/* texto escuro ou claro conforme a cor de fundo */
const tintaDe=hex=>{ const h=corOk(hex)||"#FFFFFF", r=parseInt(h.slice(1,3),16), g=parseInt(h.slice(3,5),16), b=parseInt(h.slice(5,7),16); return (r*299+g*587+b*114)/1000<140?"#FFFFFF":"#1B1A17"; };
const hhMc=t=>t?t.replace(":","h"):"";

/* ---------- a semana: tudo calculado na hora ---------- */
function semanaMicro(seg){ const fim=diaMais(seg,6), hoje=isoDia(new Date()), S=semanas[seg]||null, M=ciclos["micro-"+seg]||Object.values(ciclos).find(c=>c.tipo==="micro"&&c.inicio===seg)||null;
  const Me=mesoDe(seg)||mesoDe(fim), E=microResumo[seg]||normMResumo({id:seg}), uSem=Object.values(uts).filter(U=>U.data>=seg&&U.data<=fim).sort((a,b)=>a.data.localeCompare(b.data)||a.numero-b.numero);
  const dias=diasDaSemana(seg).map(d=>{ const us=uSem.filter(U=>U.data===d), js=jogosDoDia(d), jOf=js.find(jogoOficial)||null, jJT=js.find(j=>!jogoOficial(j))||null;
    const z=S?S.dias[d]:null, ses=z?[...z.manha,...z.tarde]:[], trs=ses.filter(x=>x.tipo==="treino"), via=ses.find(x=>x.tipo==="viagem"), A=anual[d];
    const mdM=campoMc(seg,d+".md"), mdA=mdAuto(d), md=mdM!==null?mdM:mdA, treina=us.length>0||trs.length>0, P=(treina||jJT||!z)?mdPadrao[md]||null:null;   // dia sem treino no plano: sem textos do Padrão MD
    let bloco=null;
    if(jOf) bloco={k:"md",cor:corJogo(jOf),txt:`MD · ${jOf.adversario||"JOGO"}`.toUpperCase(),sub:[jOf.hora?hhMc(jOf.hora):"",jOf.casa?localCurto(campoLocal(jOf)||LOCAL_CASA):(campoLocal(jOf)||jOf.destino||"")].filter(Boolean).join(" · "),desde:"hora"};
    else if(!treina&&jJT) bloco={k:"jogo",cor:corJogo(jJT),txt:`JOGO-TREINO · ${jJT.adversario||""}`.toUpperCase(),sub:[jJT.hora?hhMc(jJT.hora):"",jJT.casa?localCurto(campoLocal(jJT)||LOCAL_CASA):(campoLocal(jJT)||"")].filter(Boolean).join(" · "),desde:"partes"};
    else if(!treina&&via) bloco={k:"estagio",cor:corJogo(jogoLigado(d)),txt:"ESTÁGIO / DESLOCAÇÃO",sub:via.txt||via.local||"",desde:"local"};
    else if(!treina&&((z&&z.folga)||(A&&A.tipo==="folga")||(!z&&P&&P.folga))) bloco={k:"folga",txt:"FOLGA",sub:"",desde:"hora"};
    const rgM=campoMc(seg,d+".regime"), regime=rgM!==null?rgM:(P?P.regime:""), nvM=campoMc(seg,d+".nivel"), nivel=nvM!==null?nvM:(P?P.nivel:"");
    const seg_=us.reduce((a,U)=>a+totalUT(U),0), min=Math.round(seg_/60);
    const hora=bloco&&bloco.k==="estagio"?[via.ini,via.fim].filter(Boolean).map(hhMc).join(" - "):trs.map(x=>[x.ini,x.fim].filter(Boolean).map(hhMc).join(" - ")).filter(Boolean).join(" / ");
    const local=[...new Set(trs.map(x=>localCurto(x.local)).filter(Boolean))].join(" / ");
    const utTxt=us.length?us.map(U=>"UT "+U.numero).join(" + "):trs.some(x=>x.treino)?trs.filter(x=>x.treino).map(x=>"UT "+x.treino).join(" + "):(jJT&&!treina?"JOGO-TREINO":"");
    const objM=campoMc(seg,d+".obj"), obj=objM!==null?objM:(P?P.objetivo:"");
    const partes={}; PARTES_MC.forEach(([k,parte])=>{ const m=campoMc(seg,d+"."+k), exs=us.flatMap(U=>principaisUT(U).filter(l=>l.copia.parte===parte).map(l=>l.copia.nome));
      partes[k]={v:m!==null?m:[P?P[k]:"",exs.map(n=>"• "+n).join("\n")].filter(Boolean).join("\n\n"),man:m!==null,ia:iaMc(seg,d+"."+k)}; });
    return {d,md,mdA,mdMan:mdM!==null,P,us,jOf,jJT,bloco,treina,regime,R:regimes[regime]||null,regMan:rgM!==null,nivel,nivMan:nvM!==null,min,hora,local,utTxt,obj,objMan:objM!==null,objIA:iaMc(seg,d+".obj"),partes}; });
  /* atletas: diferentes que treinaram (P, CO) pelo menos uma vez; GR pela posição no Plantel; L = marcados com lesão */
  const tr=new Map(), les=new Set(); uSem.forEach(U=>atletasUT(U).forEach(a=>{ const p=U.presencas[a.k]; if(p==="P"||p==="CO") tr.set(chaveT(a),a); if(p==="L") les.add(chaveT(a)); }));
  const gr=[...tr.values()].filter(ehGR).length;
  const fechado=E.estado==="fechado", pronto=!fechado&&uSem.length>0&&uSem.every(U=>U.data<hoje&&Object.keys(U.presencas||{}).length>0)&&!dias.some(x=>x.treina&&!x.us.length&&x.d>=hoje);   // sem treinos do plano ainda por dar
  const alteradas=fechado?uSem.filter(U=>(U.alteradoEm||"")>(E.fechadoEm||"")):[];
  const G=Object.values(hist).filter(J=>J.data&&J.data<seg&&J.comp!=="livre").sort((a,b)=>b.data.localeCompare(a.data))[0]||null;
  /* objetivos da semana: os do microciclo da Época; sem eles, o rascunho da IA */
  const obj=Object.fromEntries(["objPrin","objSec"].map(k=>{ const c=M&&M[k], r=microCampo[seg+"~"+k]; return [k,c?{v:c,ia:false}:r?{v:r.v,ia:!!r.ia}:{v:"",ia:false}]; }));
  const nIA=Object.values(microCampo).filter(c=>c.seg===seg&&c.ia).length;
  return {obj,nIA,seg,fim,S,M,Me,E,n:(M&&M.n)||(S&&S.numero)||0,nDif:!!(M&&S&&M.n&&S.numero&&M.n!==S.numero),dias,uSem,gr,jg:tr.size-gr,l:les.size,fechado,pronto,alteradas,G}; }
const nAtletasTxt=W_=>`${W_.gr}GR + ${W_.jg}JG (${W_.l}L)`;
const volTxt=x=>[x.min?`${x.min}'M`:"",x.nivel?x.nivel.toUpperCase().replace("/"," / "):""].filter(Boolean).join(" | ");
/* jogo anterior (último oficial do Histórico antes da semana): resumo automático */
function jogoAnteriorTxt(G){ if(!G) return ""; const t=G.estat&&G.estat.t, C=COMPS[G.comp];
  const l1=`SC Angrense ${G.resultado?.nos??"-"}-${G.resultado?.eles??"-"} ${G.adversario||"Adversário"}${C?" · "+C.nome:""}${G.data?" · "+dataPt_(G.data):""}`;
  const l2=t?ESTAT_LINHAS.filter(([k])=>["posse","rem","enq","can","fal"].includes(k)).map(([k,n])=>`${n}: ${t.nos[k]??"-"}${k==="posse"?"%":""} – ${t.eles[k]??"-"}${k==="posse"?"%":""}`).join(" · "):"";
  return [l1,l2].filter(Boolean).join("\n"); }
function jogaramTxt(G){ if(!G) return ""; return (G.minutos||[]).filter(x=>+x.min>0).sort((a,b)=>b.min-a.min).map(x=>`${x.n} ${nomeCurto({nome:x.nome})} ${x.min}'`).join(" · "); }
function estadoMc(seg){ const W_=semanaMicro(seg); return W_.fechado?["fechado","🔒 Fechado"]:W_.pronto?["pronto","Pronto a fechar"]:["rascunho","Rascunho"]; }
function listaMicros(){ const ini=`${aEpoca}-07-01`, fim=`${aEpoca+1}-06-30`, ks=new Set([...Object.values(ciclos).filter(c=>c.tipo==="micro").map(c=>c.inicio),...Object.keys(semanas),segundaDe(isoDia(new Date()))]);
  return [...ks].filter(s=>s>=segundaDe(ini)&&s<=fim).sort().reverse(); }

/* ---------- ecrã (Treino › Micro) ---------- */
function renderMicro(){ const ls=listaMicros(); if(!mcSeg||!ls.includes(mcSeg)) mcSeg=ls.includes(segundaDe(isoDia(new Date())))?segundaDe(isoDia(new Date())):ls[0]||segundaDe(isoDia(new Date()));
  renderMicroNav(ls); renderMicroCorpo(); renderMicroPainel(); }
function renderMicroNav(ls){ const nav=$("u-nav");
  nav.innerHTML=modoUTHtml()+`<button class="newl" id="mc-pad">⚙ Padrão MD e regimes</button><div class="grp"><h3>Microciclos ${aEpoca}/${String(aEpoca+1).slice(2)}</h3><ul>${ls.map(s=>{ const W_=semanaMicro(s), [k,t]=estadoMc(s);
    return `<li><button data-seg="${s}" aria-current="${s===mcSeg}"><span class="n">${W_.n||"–"}</span><span class="m-nm">${esc(dataCurta(s))} a ${esc(dataCurta(W_.fim))}<small class="mc-e ${k}">${esc(t)}</small></span></button></li>`; }).join("")}</ul></div>`;
  ligaModoUT(nav); $("mc-pad").onclick=folhaPadraoMD;
  nav.querySelectorAll("[data-seg]").forEach(b=>b.onclick=()=>{ mcSeg=b.dataset.seg; try{ localStorage.setItem("sca-micro-cur",mcSeg); }catch(e){} renderUT(); }); }
function renderMicroCorpo(){ const W_=semanaMicro(mcSeg), bx=$("u-corpo"), tg=$("u-tag"), per=W_.Me?((PERIODOS.find(p=>p[0]===W_.Me.periodo)||[])[1]||"").replace("Período ",""):"";
  $("u-tit").textContent=`Microciclo ${W_.n||"?"} · ${dataCurta(W_.seg)} a ${dataCurta(W_.fim)}`; tg.hidden=false; tg.textContent=W_.fechado?"FECHADO":"MICRO"; tg.style.background=W_.fechado?"#1B1A17":"#C00000";
  const ed=!W_.fechado, cel=(d,c,html,cls="")=>`<td class="${cls}${ed?" mc-ed":""}"${ed?` data-e="${d}|${c}"`:""}>${html}</td>`, txt=(v,man,ia)=>`${ia?'<i class="mc-iab">IA</i>':""}<span class="${man?"":"mc-pad"}">${esc(v||"—").replace(/\n/g,"<br>")}</span>`;
  $("u-bar").innerHTML=`${ed?`<button class="btn sm" id="mc-ia"${mcIA?" disabled":""}>✨ Gerar com IA</button>`:""}<button class="btn sm" id="mc-pdf">⬇ PDF</button>`; $("mc-pdf").onclick=e=>guardaPdfMicro(W_.seg,e.currentTarget);
  if($("mc-ia")) $("mc-ia").onclick=()=>geraMc(W_.seg,{tipo:"semana"});
  const linhas=[["data","Data"],["hora","Hora"],["local","Local"],["regime","Regime"],["vol","Volume"],["ut","Unidade de Treino"],["obj","Objetivo principal da UT"],["pi","Parte inicial"],["pf","Parte fundamental"],["pfin","Parte final"]];
  const ini={hora:1,local:2,partes:7};
  let h="";
  if(mcIA&&mcIA.seg===W_.seg) h+=`<p class="mc-av ia"><span id="mc-ia-t">${esc(mcIA.txt)}</span><button class="btn sm" id="mc-ia-x">Cancelar</button></p>`;
  if(W_.nDif) h+=`<p class="mc-av">⚠ O nº do microciclo na Época (${W_.M.n}) é diferente do nº do plano semanal (${W_.S.numero}). Acerta um deles.</p>`;
  if(W_.pronto) h+=`<p class="mc-av ok">✓ <b>Microciclo pronto a fechar</b>: a última UT já foi dada e todas têm presenças. Revê os textos e fecha no painel.</p>`;
  if(W_.alteradas.length) h+=`<p class="mc-av">⚠ <b>UT alterada depois do fecho</b>: ${W_.alteradas.map(U=>"UT "+U.numero).join(", ")}. O texto do resumo não mudou sozinho.</p>`;
  h+=`<div class="mc-cab"><div><small>Macrociclo</small><b>${esc(per||"—")}</b></div><div><small>Mesociclo</small><b>${W_.Me?esc(String(W_.Me.n).padStart(2,"0")+(W_.Me.nome?" | "+W_.Me.nome:"")):"—"}</b></div>
    <div><small>Microciclo</small><b>${W_.n?String(W_.n).padStart(2,"0"):"—"}</b></div><div><small>Duração</small><b>${esc(W_.seg.slice(8,10)+"/"+W_.seg.slice(5,7))} a ${esc(W_.fim.slice(8,10)+"/"+W_.fim.slice(5,7))}</b></div><div><small>Nº</small><b>${esc(nAtletasTxt(W_))}</b></div></div>
    <div class="mc-objs"><button class="mc-ob"${ed?"":" disabled"} data-ob="objPrin"><small>Objetivos principais</small>${txt(W_.obj.objPrin.v,!!W_.obj.objPrin.v,W_.obj.objPrin.ia)}</button><button class="mc-ob"${ed?"":" disabled"} data-ob="objSec"><small>Objetivos secundários</small>${txt(W_.obj.objSec.v,!!W_.obj.objSec.v,W_.obj.objSec.ia)}</button></div>`;
  h+=`<div class="tblwrap mc-wrap"><table class="mc-tab"><thead><tr><th class="mc-lab">Dia</th>${W_.dias.map((x,i)=>{ const cor=x.bloco&&x.bloco.desde==="hora"?corBlocoMc(x.bloco):x.R?x.R.cor:"#E9E3D6";
    return `<th><div class="mc-h"><span class="mc-dia">${DIAS_MC[i]}</span><button class="mc-md"${ed?` data-e="${x.d}|md"`:" disabled"} style="background:${cor};color:${tintaDe(cor)}" aria-label="Dia relativo ao jogo">${esc(x.md||"—")}${x.mdMan?"*":""}</button></div></th>`; }).join("")}</tr></thead><tbody>`;
  linhas.forEach(([k,n],r)=>{ h+=`<tr class="mc-r-${k}"><th class="mc-lab">${n}</th>`;
    W_.dias.forEach(x=>{ const B=x.bloco;
      if(B){ const r0=ini[B.desde]; if(r>r0) return; if(r===r0){ const cor=corBlocoMc(B); h+=`<td class="mc-bloco" rowspan="${linhas.length-r0}" style="background:${cor};color:${tintaBlocoMc(B)}"><span>${esc(B.txt)}${B.sub?`<small>${esc(B.sub)}</small>`:""}</span></td>`; return; } }
      if(k==="data"){ h+=`<td>${esc(x.d.slice(8,10)+"/"+x.d.slice(5,7))}</td>`; return; }
      if(k==="hora"){ h+=`<td>${esc(x.hora||"")}</td>`; return; }
      if(k==="local"){ h+=`<td>${esc(x.local||"")}</td>`; return; }
      if(k==="regime"){ const cor=x.R?x.R.cor:""; h+=cel(x.d,"regime",x.R?`<span class="${x.regMan?"":"mc-pad"}">${esc(rotRegime(x.R))}</span>`:txt("",false),"mc-reg").replace("<td ",`<td style="${cor?`background:${cor};color:${tintaDe(cor)}`:""}" `); return; }
      if(k==="vol"){ h+=cel(x.d,"nivel",`<span class="${x.nivMan?"":"mc-pad"}">${esc(volTxt(x)||"—")}</span>`); return; }
      if(k==="ut"){ h+=`<td class="mc-ut">${esc(x.utTxt)}${ed&&diaIA(x)?`<button class="mc-iad" data-g="${x.d}" aria-label="Regenerar este dia com IA"${mcIA?" disabled":""}>✨</button>`:""}</td>`; return; }
      if(k==="obj"){ h+=cel(x.d,"obj",txt(x.obj,x.objMan,x.objIA),"mc-obj"); return; }
      const p=x.partes[k]; h+=cel(x.d,k,txt(p.v,p.man,p.ia),"mc-txt"); });
    h+=`</tr>`; });
  h+=`</tbody></table></div><p class="sub" style="margin:4px 14px 12px">Toca numa célula para escrever. Em cinzento: texto automático (Padrão MD e exercícios das UT); o que escreves fica a preto; IA = rascunho da IA por aprovar. ✨ refaz esse dia com a IA. * = MD acertado à mão.</p>`;
  const G=W_.G, auto={analise:jogoAnteriorTxt(G),perf:G?"Jogaram: "+(jogaramTxt(G)||"—"):""};
  h+=`<div class="mc-finais">${FINAIS_MC.map(([k,n])=>{ const v=campoMc(W_.seg,k); return `<section><h4>${esc(n)}</h4>${auto[k]?`<p class="mc-auto">${esc(auto[k]).replace(/\n/g,"<br>")}</p>`:""}
    <button class="mc-fin"${ed?"":" disabled"} data-f="${k}">${iaMc(W_.seg,k)?'<i class="mc-iab">IA</i>':""}${v?esc(v).replace(/\n/g,"<br>"):`<span class="mc-pad">${ed?"Toca para escrever":"—"}</span>`}</button></section>`; }).join("")}</div>`;
  if(!W_.G) h+=`<p class="sub" style="margin:0 14px 14px">Sem jogo oficial arquivado no Histórico antes desta semana.</p>`;
  bx.innerHTML=h;
  bx.querySelectorAll("[data-g]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); geraMc(W_.seg,{tipo:"dia",d:b.dataset.g}); });
  if($("mc-ia-x")) $("mc-ia-x").onclick=()=>{ if(mcIA) mcIA.ctrl.abort(); };
  bx.querySelectorAll("[data-e]").forEach(td=>td.onclick=()=>{ const [d,c]=td.dataset.e.split("|"); folhaCampoDia(W_.seg,d,c); });
  bx.querySelectorAll("[data-ob]").forEach(b=>b.onclick=()=>folhaObjMicro(W_.seg,b.dataset.ob));
  bx.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>folhaTextoMc(W_.seg,b.dataset.f,(FINAIS_MC.find(f=>f[0]===b.dataset.f)||[])[1],campoMc(W_.seg,b.dataset.f)||"","",["positivos","melhorar"].includes(b.dataset.f)?{pontos:1}:null)); }
function renderMicroPainel(){ const W_=semanaMicro(mcSeg), E=W_.E, pn=$("u-panel"), [k,t]=estadoMc(mcSeg);
  pn.innerHTML=`<header><h2>Estado</h2><p class="sub"><span class="mc-e ${k}">${esc(t)}</span>${W_.fechado&&E.fechadoEm?` · ${esc(dataHora(E.fechadoEm))}`:""}</p></header>
    <div class="add"><p class="sub" style="margin:0 0 8px">${W_.uSem.length} UT · ${esc(nAtletasTxt(W_))}${W_.S?"":" · sem plano semanal"}</p>
      ${W_.nIA&&!W_.fechado?`<p class="mc-av ia" style="margin:0 0 8px">${W_.nIA} ${W_.nIA===1?"texto da IA por aprovar":"textos da IA por aprovar"}</p><button class="btn" id="mc-apr" style="margin-bottom:8px">✓ Aprovar todos os textos IA</button>`:""}
      ${W_.fechado?`<button class="btn" id="mc-re">Reabrir microciclo</button><p class="sub" style="margin:6px 0 0">Fechado: os campos ficam só de leitura.</p>`
        :`<button class="btn primary" id="mc-fe">🔒 Fechar microciclo</button><p class="sub" style="margin:6px 0 0">${W_.pronto?"Pronto a fechar.":"Ainda há UT por dar ou sem presenças; podes fechar na mesma."}${W_.nIA?` Há ${W_.nIA} textos da IA por aprovar.`:""}</p>`}
      ${E.hist.length?`<h3 style="margin-top:12px">Histórico</h3><ul class="uavisos">${E.hist.slice().reverse().map(x=>`<li>${x.acao==="fechar"?"Fechado":"Reaberto"} · ${esc(dataHora(x.em))}</li>`).join("")}</ul>`:""}</div>`;
  if($("mc-apr")) confirma2($("mc-apr"),"Toca outra vez para aprovar todos",()=>{ Object.values(microCampo).filter(c=>c.seg===mcSeg&&c.ia).forEach(c=>aprovaCampoMc(mcSeg,c.campo,true)); renderUT(); toast("Textos da IA aprovados"); });
  const b=$("mc-fe")||$("mc-re"); confirma2(b,"Toca outra vez para confirmar",()=>mudaEstadoMc(mcSeg,W_.fechado?"reabrir":"fechar")); }
function mudaEstadoMc(seg,acao){ const E=microResumo[seg]||normMResumo({id:seg}), em=new Date().toISOString();
  const N=normMResumo({...E,id:seg,estado:acao==="fechar"?"fechado":"rascunho",...(acao==="fechar"?{fechadoEm:em,fechadoPor:meuId||""}:{}),hist:[...E.hist,{acao,em,por:meuId||""}]});
  microResumo[seg]=N; gravaDoc("microResumo/"+seg,N); guardaMicroLocal(); renderUT(); toast(acao==="fechar"?"Microciclo fechado":"Microciclo reaberto"); }

/* ---------- folhas de edição ---------- */
function folhaTextoMc(seg,campo,titulo,v,auto,ctx){ const tem=campoMc(seg,campo)!==null, ia=iaMc(seg,campo), meu=tem&&!ia;
  folha(`<h3>${esc(titulo)}${ia?' <i class="mc-iab">IA</i>':""}</h3>${auto?`<p class="sub" style="margin:0">Automático: ${esc(auto).replace(/\n/g,"<br>")}</p>`:""}
    ${ia?`<p class="sub" style="margin:0">Rascunho da IA: revê, corrige se for preciso e aprova.</p>`:""}
    <textarea id="mt-v" rows="8">${esc(v)}</textarea>
    <div class="actions">${tem?`<button class="btn l" id="mt-rp">↺ Automático</button>`:""}${ctx?`<button class="btn" id="mt-ia"${mcIA?" disabled":""}>✨ ${meu?"Substituir pela IA":"Regenerar"}</button>`:""}<button class="btn" data-close>Cancelar</button>${ia?`<button class="btn" id="mt-apr">✓ Aprovar</button>`:""}<button class="btn primary" id="mt-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x); setTimeout(()=>q("#mt-v").focus(),50);
    if(q("#mt-apr")) q("#mt-apr").onclick=()=>{ fecha(); aprovaCampoMc(seg,campo); toast("Aprovado"); };
    if(q("#mt-ia")){ const vai=()=>{ fecha(); geraMc(seg,ctx.pontos?{tipo:"pontos",forcar:meu?campo:""}:{tipo:"campo",d:ctx.d,k:ctx.k,forcar:meu}); };
      if(meu) confirma2(q("#mt-ia"),"Toca outra vez: substitui o teu texto",vai); else q("#mt-ia").onclick=vai; }
    if(q("#mt-rp")) confirma2(q("#mt-rp"),"Toca outra vez: volta ao automático",()=>{ fecha(); gravaCampoMc(seg,campo,null); toast("Voltou ao automático"); });
    q("#mt-ok").onclick=()=>{ const antes=campoMc(seg,campo); fecha(); gravaCampoMc(seg,campo,q("#mt-v").value); toast("Guardado",()=>gravaCampoMc(seg,campo,antes)); }; }); }
function folhaCampoDia(seg,d,c){ const W_=semanaMicro(seg); if(W_.fechado){ toast("Microciclo fechado: reabre para editar."); return; } const x=W_.dias.find(y=>y.d===d); if(!x) return;
  const dia=`${DIAS_SEM[(new Date(d+"T12:00").getDay()+6)%7].toLowerCase()} ${dataCurta(d)}`, campo=d+"."+c, tem=campoMc(seg,campo)!==null;
  const escolha=(titulo,ops,atual,autoTxt)=>folha(`<h3>${esc(titulo)} · ${esc(dia)}</h3><div class="chips mc-ops">${ops.map(([v,n,cor])=>`<button class="chip" data-v="${esc(v)}" aria-pressed="${tem&&v===atual}"${cor?` style="background:${cor};color:${tintaDe(cor)}"`:""}>${esc(n)}</button>`).join("")}</div>
    <div class="actions">${tem?`<button class="btn l" id="mo-rp">↺ ${esc(autoTxt)}</button>`:""}<button class="btn" data-close>Fechar</button></div>`,(s,fecha)=>{
    s.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{ fecha(); gravaCampoMc(seg,campo,b.dataset.v); });
    if(s.querySelector("#mo-rp")) s.querySelector("#mo-rp").onclick=()=>{ fecha(); gravaCampoMc(seg,campo,null); }; });
  if(c==="md") return escolha("Dia relativo ao jogo",[...MD_LINHAS.map(m=>[m,m]),["","Sem MD"]],x.md,`Automático (${x.mdA||"sem MD"})`);
  if(c==="regime") return escolha("Regime",listaRegimes().map(R=>[R.id,rotRegime(R),R.cor]),x.regime,"Como no Padrão MD");
  if(c==="nivel") return escolha(`Volume${x.min?` · ${x.min}' (soma das UT, sem complementares)`:""}`,NIVEIS_VOL.map(n=>[n,n]),x.nivel,"Como no Padrão MD");
  if(c==="obj") return folhaTextoMc(seg,campo,"Objetivo principal da UT · "+dia,x.obj,x.P?x.P.objetivo:"",diaIA(x)?{d,k:"obj"}:null);
  const P=PARTES_MC.find(p=>p[0]===c); if(P) return folhaTextoMc(seg,campo,P[2]+" · "+dia,x.partes[c].v,"",diaIA(x)?{d,k:c}:null); }
function folhaObjMicro(seg,k){ const W_=semanaMicro(seg); if(W_.fechado) return; const O=W_.obj[k];
  folha(`<h3>${k==="objPrin"?"Objetivos principais":"Objetivos secundários"} · microciclo ${W_.n||""}${O.ia?' <i class="mc-iab">IA</i>':""}</h3><p class="sub" style="margin:0">${O.ia?"Rascunho da IA: só passa para o microciclo da Época quando guardares ou aprovares.":"Ficam no microciclo da Época (Treino › Ano)."}</p>
    <textarea id="mo-v" rows="5">${esc(O.v)}</textarea><div class="actions"><button class="btn" data-close>Cancelar</button>${O.ia?`<button class="btn" id="mo-apr">✓ Aprovar</button>`:""}<button class="btn primary" id="mo-ok">Guardar</button></div>`,(s,fecha)=>{
    if(s.querySelector("#mo-apr")) s.querySelector("#mo-apr").onclick=()=>{ fecha(); aprovaCampoMc(seg,k); toast("Objetivos aprovados"); };
    s.querySelector("#mo-ok").onclick=()=>{ const M=W_.M||{tipo:"micro",inicio:seg,n:W_.n||(W_.S&&W_.S.numero)||0}; fecha(); guardaCiclo({...M,[k]:s.querySelector("#mo-v").value.trim()}); if(microCampo[seg+"~"+k]) gravaCampoMc(seg,k,null,false,true); renderUT(); toast("Objetivos guardados"); }; }); }
/* Padrão MD da Época: uma linha por dia relativo ao jogo; e os regimes com as cores */
function folhaPadraoMD(){ folha(`<h3>Padrão MD</h3><p class="sub" style="margin:0">O que cada dia relativo ao jogo traz por defeito para o resumo do microciclo (regime, objetivo, textos das partes, volume sugerido). No resumo, tudo se pode mudar dia a dia.</p>
    <ul class="evl">${MD_LINHAS.map(m=>{ const P=mdPadrao[m], R=P&&regimes[P.regime]; return `<li><button class="lnk mc-pl" data-m="${m}"><b>${m}</b> · ${P?(P.folga?"FOLGA":esc(rotRegime(R)||"sem regime"))+(P.objetivo?" · "+esc(P.objetivo):""):'<span class="sub">vazio</span>'}</button></li>`; }).join("")}</ul>
    <div class="actions"><button class="btn l" id="pm-rg">Regimes e cores</button><button class="btn primary" data-close>Fechar</button></div>`,(s,fecha)=>{
    s.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{ fecha(); folhaLinhaMD(b.dataset.m); }); s.querySelector("#pm-rg").onclick=()=>{ fecha(); folhaRegimes(); }; }); }
function folhaLinhaMD(m){ const P=mdPadrao[m]||normMdP({id:m});
  folha(`<h3>Padrão ${esc(m)}</h3>
    <label class="f">Regime<select id="pl-r"><option value="">—</option>${listaRegimes().map(R=>`<option value="${esc(R.id)}"${R.id===P.regime?" selected":""}>${esc(rotRegime(R))}</option>`).join("")}</select></label>
    <label class="f">Volume sugerido<select id="pl-n"><option value="">—</option>${NIVEIS_VOL.map(n=>`<option${n===P.nivel?" selected":""}>${n}</option>`).join("")}</select></label>
    <label style="display:flex;gap:8px;align-items:center;font-size:14px;min-height:40px"><input type="checkbox" id="pl-f"${P.folga?" checked":""} style="accent-color:var(--red);width:20px;height:20px"> Folga (o dia aparece em bloco FOLGA quando não há treino)</label>
    <label class="f">Objetivo principal da UT<input type="text" id="pl-o" value="${esc(P.objetivo)}"></label>
    ${PARTES_MC.map(([k,,n])=>`<label class="f">${n}<textarea id="pl-${k}" rows="3">${esc(P[k])}</textarea></label>`).join("")}
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="pl-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x);
    q("#pl-ok").onclick=()=>{ const antes=mdPadrao[m]?clone(mdPadrao[m]):null; fecha();
      gravaMdP({...P,regime:q("#pl-r").value,nivel:q("#pl-n").value,folga:q("#pl-f").checked,objetivo:q("#pl-o").value.trim(),...Object.fromEntries(PARTES_MC.map(([k])=>[k,q("#pl-"+k).value.trim()]))}); renderUT();
      toast(`Padrão ${m} guardado`,()=>{ if(antes){ mdPadrao[m]=antes; gravaDoc("mdPadrao/"+m,antes); } else { delete mdPadrao[m]; apagaDoc("mdPadrao/"+m); } guardaMicroLocal(); renderUT(); }); }; }); }
function folhaRegimes(){ const rs=listaRegimes().map(R=>({...R})), novos=[];
  const linha=(R,i)=>`<div class="mc-rg" data-i="${i}"><input type="color" value="${esc(R.cor)}" aria-label="Cor"><input type="text" class="rg-n" value="${esc(R.nome)}" placeholder="Nome (ex.: FORÇA / CONTRAÇÃO)" aria-label="Nome"><input type="text" class="rg-i" value="${esc(R.int)}" placeholder="++" aria-label="Intensidade" style="width:70px"></div>`;
  folha(`<h3>Regimes e cores</h3><p class="sub" style="margin:0">Nome, símbolo de intensidade e cor de cada regime. As cores dos blocos (folga, jogo, Match Day, estágio) também se mudam aqui.</p>
    <div id="rg-l">${rs.map(linha).join("")}</div><button class="btn sm" id="rg-add" style="align-self:flex-start">+ Regime</button>
    <h4 style="margin-bottom:0">Blocos</h4>${BLOCOS_MC.map(([k,n])=>`<label class="mc-rg"><input type="color" data-b="${k}" value="${esc(corBloco(k))}" aria-label="Cor ${esc(n)}"><span>${esc(n)}</span></label>`).join("")}
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="rg-ok">Guardar</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x);
    q("#rg-add").onclick=()=>{ const R={id:uId("rg"),nome:"",int:"",cor:"#D9D9D9",ordem:(rs.length+novos.length+1)*10}; novos.push(R); q("#rg-l").insertAdjacentHTML("beforeend",linha(R,rs.length+novos.length-1)); };
    q("#rg-ok").onclick=()=>{ const todos=[...rs,...novos]; let n=0;
      s.querySelectorAll("#rg-l .mc-rg").forEach(el=>{ const R=todos[+el.dataset.i], [c,nm,it]=el.querySelectorAll("input"), N={...R,cor:c.value,nome:nm.value.trim(),int:it.value.trim()};
        if(!N.nome) return; if(JSON.stringify([N.cor.toUpperCase(),N.nome,N.int])!==JSON.stringify([R.cor,R.nome,R.int])||!regimes[R.id]){ gravaRegime(N); n++; } });
      s.querySelectorAll("[data-b]").forEach(el=>{ const k=el.dataset.b; if(el.value.toUpperCase()!==corBloco(k)){ gravaRegime({...(regimes[k]||{id:k,nome:(BLOCOS_MC.find(b=>b[0]===k)||[])[1]}),cor:el.value,bloco:true}); n++; } });
      fecha(); renderUT(); toast(n?`${n} ${n===1?"regime guardado":"regimes guardados"}`:"Sem alterações"); }; }); }

/* ---------- redação pela IA (v102, Entrega E2): capacidade sample do link; só quando se toca no botão ----------
   Um pedido por dia (o progresso vê-se e um dia que falhe não estraga os outros), depois os objetivos da semana e os pontos.
   O que vem entra como rascunho (ia: true); nunca escreve por cima de um texto escrito ou aprovado à mão, exceto em «Substituir pela IA». */
let mcIA=null, mcSample;
async function sampleMc(){ if(mcSample!==undefined) return mcSample; try{ mcSample=window.claude&&window.claude.use?await window.claude.use("sample"):null; }catch(e){ mcSample=null; } return mcSample; }
const ERR_IA={not_granted:"Sem autorização para usar o Claude neste link.",sampling_disabled:"O Claude não está disponível nesta conta.",not_declared:"Esta versão do link não tem a IA ativa: recarrega a página.",
  capability_disabled:"A IA não está disponível neste aparelho.",capability_removed:"A IA não está disponível nesta versão do claude.ai.",rate_limited:"Muitos pedidos ou limite de utilização atingido. Tenta mais tarde.",
  session_expired:"Sessão expirada: entra outra vez no claude.ai.",invalid_json:"A IA respondeu num formato inválido: nesse pedido não se gravou nada. Tenta outra vez.",refused:"A IA recusou este pedido.",
  empty_completion:"A IA não respondeu nada.",upstream_error:"Falha de ligação à IA. Tenta outra vez.",prompt_too_large:"Pedido demasiado grande para a IA."};
const diaIA=x=>x.treina||!!(x.bloco&&x.bloco.k==="jogo");   // dias com textos para a IA (no jogo-treino só o objetivo)
const camposIA=x=>x.bloco&&x.bloco.k==="jogo"?["obj"]:["obj","pi","pf","pfin"];
const ESTILO_IA=`Escreve em português de Portugal (nunca do Brasil), com frases curtas e técnicas, como um adjunto escreve o documento do clube. 2 a 5 linhas por parte, sem enfeites.
Usa só os exercícios e conteúdos que estão nos dados: não inventes exercícios, tempos nem conteúdos. Corrige gralhas.
Se o dia for o estímulo principal da semana (o de maior carga e volume), começa a Parte Fundamental com "PRINCIPAL ESTÍMULO DA SEMANA:" em maiúsculas.
Termina a Parte Final com "Registo de PSE" só quando algum exercício ou nota da UT falar em PSE.
O objetivo principal da UT é uma frase curta em MAIÚSCULAS (ex.: "FORÇA-BASE + DUELOS").`;
const txtLista=v=>Array.isArray(v)?v.filter(Boolean).join("; "):String(v||"");
function exIA(l){ const E=l.copia, D=E.duracao||{};
  return {parte:E.parte,nome:E.nome,classificacao:typeof catEx==="function"?catEx(E):"",tipo:typeof rotuloDe==="function"&&typeof TIPOS_EX!=="undefined"?rotuloDe(TIPOS_EX,E.tipo):E.tipo||"",
    formato:E.formato||"",espaco:(E.espaco&&E.espaco.txt)||"",objetivos:txtLista(E.objetivos),
    duracao:D.total?`${Math.round(D.total/60)}'`:D.series&&D.pratica?`${D.series} × ${Math.round(D.pratica/6)/10}'`:"",
    complementar:!!l.pai,notas:[txtLista(E.variantes),txtLista(E.condicionantes)].filter(Boolean).join(" · ")}; }
function pedidoDiaIA(W_,x){ const P=x.P||{};
  const dados={dia:`${DIAS_MC_PDF[W_.dias.indexOf(x)]} ${dataPt_(x.d)}`,md:x.md||"sem MD",regime:rotRegime(x.R),volume:volTxt(x),
    padrao_md:{objetivo:P.objetivo||"",parte_inicial:P.pi||"",parte_fundamental:P.pf||"",parte_final:P.pfin||""},
    objetivos_microciclo:{principais:W_.obj.objPrin.v,secundarios:W_.obj.objSec.v},
    semana:W_.dias.map(y=>({dia:dataPt_(y.d).slice(0,5),md:y.md,regime:rotRegime(y.R),minutos:y.min,bloco:y.bloco?y.bloco.txt:""})),
    uts:x.us.map(U=>({ut:U.numero,exercicios:U.exercicios.map(exIA)})),jogo_treino:x.jJT?x.jJT.adversario||"sim":""};
  return `${ESTILO_IA}\n\nEscreve o resumo deste dia do microciclo (Sport Club Angrense, equipa sénior).${x.us.length?"":" A UT ainda não existe: usa o Padrão MD e o regime."}\n\nDados:\n${JSON.stringify(dados)}\n\nResponde só com um objeto JSON: {"objetivo_ut": "...", "parte_inicial": "...", "parte_fundamental": "...", "parte_final": "..."}`; }
function pedidoSemanaIA(W_){ const dados={microciclo:W_.n,mesociclo:W_.Me?{n:W_.Me.n,designacao:W_.Me.nome||"",periodo:W_.Me.periodo}:null,
    dias:W_.dias.map(y=>({dia:dataPt_(y.d).slice(0,5),md:y.md,regime:rotRegime(y.R),objetivo:y.obj,bloco:y.bloco?y.bloco.txt:"",exercicios:y.us.flatMap(U=>principaisUT(U).map(l=>l.copia.nome))}))};
  return `${ESTILO_IA}\n\nPropõe os objetivos deste microciclo para o documento do clube: 1 a 3 frases curtas cada.\n\nDados:\n${JSON.stringify(dados)}\n\nResponde só com um objeto JSON: {"objetivos_principais": "...", "objetivos_secundarios": "..."}`; }
function pedidoPontosIA(W_){ const dados={jogo_anterior:jogoAnteriorTxt(W_.G),jogaram:jogaramTxt(W_.G),analise_escrita:campoMc(W_.seg,"analise")||"",performance_escrita:campoMc(W_.seg,"perf")||""};
  return `${ESTILO_IA}\n\nA partir da análise do jogo anterior, propõe pontos positivos e pontos a melhorar (3 a 5 de cada, uma linha por ponto, começada por "• "). Usa só o que está nos dados.\n\nDados:\n${JSON.stringify(dados)}\n\nResponde só com um objeto JSON: {"pontos_positivos": "...", "pontos_a_melhorar": "..."}`; }
/* grava um texto da IA como rascunho: nunca por cima do que foi escrito ou aprovado à mão, exceto quando se escolhe substituir */
function aplicaIA(seg,campo,v,forcar){ if(typeof v!=="string"||!v.trim()) return 0; const x=microCampo[seg+"~"+campo]; if(x&&!x.ia&&!forcar) return 0; gravaCampoMc(seg,campo,v.trim(),true,true); return 1; }
const objIA=r=>{ if(!r||typeof r!=="object"||Array.isArray(r)) throw {code:"invalid_json"}; return r; };
function iaTexto(t){ if(mcIA) mcIA.txt=t; const el=$("mc-ia-t"); if(el) el.textContent=t; }
async function geraMc(seg,alvo){ if(mcIA){ toast("A IA já está a escrever."); return; }
  let W_=semanaMicro(seg); if(W_.fechado){ toast("Microciclo fechado: reabre para usar a IA."); return; }
  const S=await sampleMc(); if(!S){ toast("A IA não está disponível aqui: o resumo continua com os textos automáticos."); return; }
  const dias=alvo.tipo==="semana"?W_.dias.filter(diaIA):alvo.d?W_.dias.filter(x=>x.d===alvo.d):[];
  const objs=alvo.tipo==="semana"&&["objPrin","objSec"].some(k=>!W_.obj[k].v||W_.obj[k].ia);
  const pontos=alvo.tipo==="pontos"||(alvo.tipo==="semana"&&!!(W_.G||campoMc(seg,"analise")));
  const total=dias.length+(objs?1:0)+(pontos?1:0); if(!total){ toast("Não há dias com treino para a IA escrever."); return; }
  mcIA={seg,ctrl:new AbortController(),txt:"A IA está a escrever…"}; renderUT();
  let n=0, passo=0, erro=null; const op={signal:mcIA.ctrl.signal,modelTier:"default",cache:false};
  try{
    for(const x of dias){ passo++; iaTexto(`A IA está a escrever… (${passo} de ${total}: ${DIAS_MC_PDF[W_.dias.indexOf(x)]})`);
      const r=objIA(await S.json(pedidoDiaIA(W_,x),op)), m={obj:r.objetivo_ut,pi:r.parte_inicial,pf:r.parte_fundamental,pfin:r.parte_final};
      (alvo.tipo==="campo"?[alvo.k]:camposIA(x)).forEach(k=>{ n+=aplicaIA(seg,x.d+"."+k,m[k],alvo.tipo==="campo"&&!!alvo.forcar); }); }
    if(objs){ passo++; iaTexto(`A IA está a escrever… (${passo} de ${total}: objetivos da semana)`); W_=semanaMicro(seg);
      const r=objIA(await S.json(pedidoSemanaIA(W_),op)); [["objPrin",r.objetivos_principais],["objSec",r.objetivos_secundarios]].forEach(([k,v])=>{ if(!(W_.M&&W_.M[k])) n+=aplicaIA(seg,k,v,false); }); }
    if(pontos){ passo++; iaTexto(`A IA está a escrever… (${passo} de ${total}: pontos positivos e a melhorar)`);
      const r=objIA(await S.json(pedidoPontosIA(W_),op)); n+=aplicaIA(seg,"positivos",r.pontos_positivos,alvo.forcar==="positivos"); n+=aplicaIA(seg,"melhorar",r.pontos_a_melhorar,alvo.forcar==="melhorar"); } }
  catch(e){ erro=e||{}; }
  mcIA=null; renderUT();
  if(erro){ if(["not_granted","sampling_disabled","not_declared","capability_disabled","capability_removed"].includes(erro.code)) mcSample=null;
    toast(erro.code==="cancelled"?`Cancelado${n?` · ${n} ${n===1?"texto gravado":"textos gravados"}`:""}`:(ERR_IA[erro.code]||"Não foi possível usar a IA ("+(erro.code||erro.message||"erro")+").")+(n?` ${n} textos já ficaram gravados.`:"")); return; }
  toast(n?`IA: ${n} ${n===1?"texto em rascunho":"textos em rascunho"} para aprovar`:"Nada mudou: os textos escritos por ti ficaram como estavam."); }

/* ---------- PDF A4 horizontal, no layout do Excel do clube ---------- */
async function pdfMicro(seg){ await carregaJsPdf(false); const W_=semanaMicro(seg), doc=new window.jspdf.jsPDF({unit:"pt",format:"a4",orientation:"landscape"}), PW=841.89, PH=595.28, M=18;
  const rgb=h=>{ h=corOk(h)||"#FFFFFF"; return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16)); }, RED=[192,0,0], INK=[27,26,23], MUT=[110,106,98], LIN=[150,146,138];
  const T=(t,x,y,o={})=>{ doc.setFont("helvetica",o.b?"bold":o.i?"italic":"normal"); doc.setFontSize(o.s||8); doc.setTextColor(...(o.c||INK)); doc.text(String(t),x,y,{...(o.al?{align:o.al}:{}),...(o.ang?{angle:o.ang}:{})}); };
  const caixa=(x,y,w,h,fill)=>{ doc.setDrawColor(...LIN); doc.setLineWidth(.5); if(fill){ doc.setFillColor(...rgb(fill)); doc.rect(x,y,w,h,"FD"); } else doc.rect(x,y,w,h); };
  const texto=(t,x,y,w,h,o={})=>{ const s=o.s||7; doc.setFont("helvetica",o.b?"bold":"normal"); doc.setFontSize(s); const ls=doc.splitTextToSize(String(t||""),w-6), lh=s*1.18, max=Math.max(1,Math.floor((h-4)/lh)), mostra=ls.slice(0,max);
    if(ls.length>max&&mostra.length) mostra[mostra.length-1]=mostra[mostra.length-1].replace(/.{0,2}$/,"…");
    doc.setTextColor(...(o.c||INK)); const y0=o.mid?y+h/2-(mostra.length*lh)/2+s*.85:y+s+2; mostra.forEach((l,i)=>doc.text(l,o.al==="center"?x+w/2:x+3,y0+i*lh,o.al==="center"?{align:"center"}:undefined)); };
  const ano=+seg.slice(0,4)-(+seg.slice(5,7)<7?1:0);
  /* cabeçalho */
  if(IMG_DATA["slides/logo.png"]) try{ doc.addImage(IMG_DATA["slides/logo.png"],"PNG",M,M-4,40,40); }catch(e){}
  T("SPORT CLUB ANGRENSE",M+48,M+12,{b:1,s:12}); T("MICROCICLO DAS UNIDADES DE TREINO",PW/2,M+26,{b:1,s:15,al:"center"}); T(`ÉPOCA ${ano}-${ano+1}`,PW-M,M+12,{b:1,s:11,al:"right"});
  let y=M+44; const per=W_.Me?((PERIODOS.find(p=>p[0]===W_.Me.periodo)||[])[1]||"").replace("Período ",""):"";
  const info=[["Macrociclo: ",per?per[0].toUpperCase()+per.slice(1):"—",150],["Mesociclo Nº: ",W_.Me?String(W_.Me.n).padStart(2,"0")+(W_.Me.nome?" | "+W_.Me.nome:""):"—",260],["Microciclo Nº: ",W_.n?String(W_.n).padStart(2,"0"):"—",110],
    ["Duração: ",`${W_.seg.slice(8,10)}/${W_.seg.slice(5,7)} a ${W_.fim.slice(8,10)}/${W_.fim.slice(5,7)}`,140],["Nº: ",nAtletasTxt(W_),0]];
  let x=M; info.forEach(([a,b,w],i)=>{ const ww=w||PW-M-x; caixa(x,y,ww,16); T(a,x+4,y+11,{b:1,s:8}); doc.setFont("helvetica","bold"); const aw=doc.getTextWidth(a); T(b,x+4+aw,y+11,{s:8}); x+=ww; });
  y+=16; [["Objetivos Principais: ",W_.obj.objPrin.v],["Objetivos Secundários: ",W_.obj.objSec.v]].forEach(([a,b])=>{ doc.setFont("helvetica","normal"); doc.setFontSize(7.5);
    const ls=doc.splitTextToSize(a+(b||""),PW-2*M-8), h=Math.max(14,ls.length*9+5); caixa(M,y,PW-2*M,h); T(a,M+4,y+10,{b:1,s:7.5}); doc.setFont("helvetica","bold"); const aw=doc.getTextWidth(a);
    doc.setFont("helvetica","normal"); doc.splitTextToSize(b||"",PW-2*M-8-aw).forEach((l,i)=>T(l,M+4+aw,y+10+i*9,{s:7.5})); y+=h; });
  y+=6;
  /* grelha: coluna de rótulos + 7 dias */
  const LW=92, CW=(PW-2*M-LW)/7, MDW=26, xs=W_.dias.map((_,i)=>M+LW+i*CW);
  const fixas=[["dia",15],["data",12],["hora",12],["local",12],["regime",15],["vol",12],["ut",12],["obj",30]];
  const sp=PH-M-14-y-fixas.reduce((a,f)=>a+f[1],0);
  /* altura das partes: o texto tem de caber; se não couber, a letra diminui */
  let fs=7, hs=[0,0,0];
  for(;fs>=4.6;fs-=.4){ doc.setFontSize(fs); hs=PARTES_MC.map(([k])=>Math.max(30,...W_.dias.map(x=>x.bloco?0:doc.splitTextToSize(x.partes[k].v||"",CW-6).length*fs*1.18+6))); if(hs.reduce((a,b)=>a+b,0)<=sp) break; }
  const extra=Math.max(0,sp-hs.reduce((a,b)=>a+b,0)); hs=hs.map((h,i)=>h+extra*[.27,.48,.25][i]);
  const rows=[...fixas,...PARTES_MC.map(([k],i)=>[k,hs[i]])], ry={}; let yy=y; rows.forEach(([k,h])=>{ ry[k]=[yy,h]; yy+=h; });
  const rot={dia:"Dia",data:"Data",hora:"Hora",local:"Local:",regime:"Regime",vol:"Volume",ut:"Unidade de Treino:",obj:"Objetivo Principal da UT:"};
  Object.entries(rot).forEach(([k,n])=>{ const [y1,h]=ry[k]; caixa(M,y1,LW,h); texto(n,M,y1,LW,h,{b:1,s:k==="dia"?9:7.5,mid:1}); });
  const yp=ry.pi[0], hp=yy-yp; caixa(M,yp,18,hp); T("OBJETIVOS",M+12,yp+hp/2+22,{b:1,s:9,ang:90});
  PARTES_MC.forEach(([k,,n])=>{ const [y1,h]=ry[k]; caixa(M+18,y1,LW-18,h); texto(n.toUpperCase(),M+18,y1,LW-18,h,{b:1,s:7.5,mid:1,al:"center"}); });
  W_.dias.forEach((x,i)=>{ const X=xs[i], B=x.bloco, ini={hora:"hora",local:"local",partes:"pi"}[B?B.desde:""], cor=x.R?x.R.cor:"";
    const [yd,hd]=ry.dia, corMd=B&&B.desde==="hora"?corBlocoMc(B):cor||"#E9E3D6"; caixa(X,yd,CW-MDW,hd,"#C00000"); texto(DIAS_MC_PDF[i],X,yd,CW-MDW,hd,{b:1,s:8,c:[255,255,255],mid:1,al:"center"});
    caixa(X+CW-MDW,yd,MDW,hd,corMd); texto(x.md?x.md.replace("MD","")||"J":"",X+CW-MDW,yd,MDW,hd,{b:1,s:7,c:rgb(tintaDe(corMd)),mid:1,al:"center"});
    const valores={data:`${x.d.slice(8,10)}/${x.d.slice(5,7)}`,hora:x.hora,local:x.local,regime:rotRegime(x.R),vol:volTxt(x),ut:x.utTxt,obj:x.obj};
    let parar=false; rows.slice(1).forEach(([k])=>{ if(parar) return; const [y1,h]=ry[k];
      if(B&&k===ini){ const hb=yy-y1, cb=corBlocoMc(B); caixa(X,y1,CW,hb,cb); const tc=rgb(tintaBlocoMc(B)); let s=Math.min(22,CW*.32); doc.setFont("helvetica","bold"); doc.setFontSize(s);
        while(s>8&&doc.getTextWidth(B.txt)>hb-20){ s-=1; doc.setFontSize(s); } const tw=doc.getTextWidth(B.txt), cx=X+CW/2+(B.sub?-s*.15:s*.35);
        T(B.txt,cx,y1+hb/2+tw/2,{b:1,s,c:tc,ang:90}); if(B.sub){ doc.setFontSize(9); const sw=doc.getTextWidth(B.sub); T(B.sub,cx+s*.9,y1+hb/2+sw/2,{s:9,c:tc,ang:90}); } parar=true; return; }
      if(k==="regime"){ caixa(X,y1,CW,h,cor||null); texto(valores.regime,X,y1,CW,h,{b:1,s:6.8,c:cor?rgb(tintaDe(cor)):INK,mid:1,al:"center"}); return; }
      if(k in valores){ caixa(X,y1,CW,h); texto(valores[k],X,y1,CW,h,{b:k==="ut"||k==="obj",s:k==="obj"?6.3:7,c:k==="ut"?RED:INK,mid:1,al:"center"}); return; }
      caixa(X,y1,CW,h); texto(x.partes[k].v,X,y1,CW,h,{s:fs}); }); });
  T(`SC Angrense · Microciclo ${W_.n||""} · ${W_.fechado?"fechado":"rascunho"} · gerado a ${new Date().toLocaleDateString("pt-PT")}`,PW/2,PH-8,{s:6.5,c:MUT,al:"center"});
  /* 2.ª página: blocos finais */
  doc.addPage("a4","landscape"); y=M; const G=W_.G, auto={analise:jogoAnteriorTxt(G),perf:G?"Jogaram: "+(jogaramTxt(G)||"—"):""};
  T(`MICROCICLO ${W_.n?String(W_.n).padStart(2,"0"):""} · ${W_.seg.slice(8,10)}/${W_.seg.slice(5,7)} A ${W_.fim.slice(8,10)}/${W_.fim.slice(5,7)}`,M,y+12,{b:1,s:11,c:RED}); y+=22;
  const hBl=(PH-M-14-y)/2-4, wBl=(PW-2*M-8)/2;
  FINAIS_MC.forEach(([k,n],i)=>{ const bx=M+(i%2)*(wBl+8), by=y+Math.floor(i/2)*(hBl+8); caixa(bx,by,wBl,hBl); T(n.toUpperCase()+":",bx+5,by+12,{b:1,s:8.5});
    let yy2=by+18; if(auto[k]){ doc.setFontSize(7.5); const ls=doc.splitTextToSize(auto[k],wBl-10); ls.forEach((l,j)=>T(l,bx+5,yy2+8+j*9,{s:7.5,c:MUT,i:1})); yy2+=ls.length*9+6; }
    texto(campoMc(seg,k)||"",bx+2,yy2,wBl-4,by+hBl-yy2,{s:8.5}); });
  T(`SC Angrense · Microciclo ${W_.n||""}`,PW/2,PH-8,{s:6.5,c:MUT,al:"center"});
  return doc; }
async function guardaPdfMicro(seg,botao){ if(botao) botao.disabled=true; toast("A gerar o PDF…");
  try{ const W_=semanaMicro(seg), doc=await pdfMicro(seg); await guardaFicheiro(`Microciclo_${String(W_.n||0).padStart(2,"0")}_SCA_${seg}.pdf`,new Uint8Array(doc.output("arraybuffer")),"application/pdf"); toast("PDF pronto"); }
  catch(e){ if(e?.code!=="declined") toast(e?.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet.":"Não foi possível gerar o PDF ("+(e?.code||e?.message||"erro")+")"); }
  finally{ if(botao) botao.disabled=false; } }

/* ---------- cópia de segurança e sincronização ---------- */
function repoeMicro(B){ [["mdPadrao",mdPadrao,normMdP],["regimes",regimes,normRegime],["microCampo",microCampo,normMCampo],["microResumo",microResumo,normMResumo]].forEach(([c,o,f])=>{ if(!B[c]) return; const X=B[c];
  Object.keys(o).forEach(id=>{ if(!X[id]){ delete o[id]; apagaDoc(c+"/"+id); } }); Object.entries(X).forEach(([id,v])=>{ try{ o[id]=f({...v,id}); gravaDoc(c+"/"+id,o[id]); }catch(e){} }); }); guardaMicroLocal(); }
function ligaMicroDb(){ if(!db) return;
  [["mdPadrao",()=>mdPadrao,v=>mdPadrao=v,normMdP],["regimes",()=>regimes,v=>regimes=v,normRegime],["microCampo",()=>microCampo,v=>microCampo=v,normMCampo],["microResumo",()=>microResumo,v=>microResumo=v,normMResumo]].forEach(([c,get,set,f])=>
    db.collection(c).onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
      q.docs.forEach(d=>{ const x=lerDoc(d); if(x){ delete x.atualizadoEm; try{ m[d.id]=f({...x,id:d.id}); }catch(e){} } });
      mergeCol(c+"/",m,get()); if(JSON.stringify(m)!==JSON.stringify(get())){ set(m); guardaMicroLocal(); if(!$("sheet-root").innerHTML&&uModo==="micro") renderUT(); } },()=>{})); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaMicroDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();
