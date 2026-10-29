/* ---------- Livro de exercícios em PDF (v103, Entrega C) ----------
   livros/{id} = { nome, titulo, versao: "interna"|"fora", filtros: { parte, momento, sub, tipo, formato, espaco: [valores], comp: ""|"liga"|"champions"|"qualquer", meinho: bool },
                   mais: [id de exercício acrescentado à mão], menos: [id tirado à mão], gerado: { em, n } }
   O livro guarda as escolhas, não os exercícios: ao gerar outra vez, entram as fichas como estão no repositório.
   Versão para fora do clube: figura sem nomes, nomes e alcunhas do Plantel trocados por «jogador», sem autoria e só com as ligações públicas. */
const CAP_LIVRO=[["prep","PJ"],["fund","FJ"],["princ","PR"],["of","OO"],["def","OD"],["tda","TO"],["tad","TD"],["fin","FI"],["esq","ET"],["","OU"]];
const nomeCapLivro=k=>k?rotuloDe(MOM_EX,k):"Outros";
const LV_LS="sca-livros-v1";
let livros={}; try{ livros=JSON.parse(localStorage.getItem(LV_LS)||"{}")||{}; }catch(e){}
function normLivro(d){ const s=v=>String(v??"").trim(), A=v=>(Array.isArray(v)?v:[]).map(s).filter(Boolean), f=d.filtros||{};
  return {id:s(d.id)||uId("lv"),nome:s(d.nome)||"Livro de exercícios",titulo:s(d.titulo),versao:d.versao==="fora"?"fora":"interna",
    filtros:{parte:A(f.parte),momento:A(f.momento),sub:A(f.sub),tipo:A(f.tipo),formato:A(f.formato),espaco:A(f.espaco),comp:["liga","champions","qualquer"].includes(f.comp)?f.comp:"",meinho:!!f.meinho},
    mais:A(d.mais),menos:A(d.menos),gerado:d.gerado&&d.gerado.em?{em:s(d.gerado.em),n:Math.round(+d.gerado.n)||0}:null,
    criadoPor:s(d.criadoPor),criadoEm:s(d.criadoEm),alteradoPor:s(d.alteradoPor),alteradoEm:s(d.alteradoEm)}; }
Object.keys(livros).forEach(id=>{ try{ livros[id]=normLivro({...livros[id],id}); }catch(e){ delete livros[id]; } });
const guardaLivrosLocal=()=>{ try{ localStorage.setItem(LV_LS,JSON.stringify(livros)); }catch(e){} };
function gravaLivro(L){ const N=normLivro({...L,alteradoPor:meuId||"",alteradoEm:new Date().toISOString(),...(L.criadoEm?{}:{criadoPor:meuId||"",criadoEm:new Date().toISOString()})}); livros[N.id]=N; guardaLivrosLocal(); gravaDoc("livros/"+N.id,N); return N; }
function apagaLivro(id){ const L=livros[id]; if(!L) return; delete livros[id]; guardaLivrosLocal(); apagaDoc("livros/"+id); toast(`Livro «${L.nome}» apagado`,()=>{ livros[id]=L; guardaLivrosLocal(); gravaDoc("livros/"+id,L); }); }
function repoeLivros(B){ if(!B.livros) return; Object.keys(livros).forEach(id=>{ if(!B.livros[id]) apagaDoc("livros/"+id); }); livros={};
  Object.entries(B.livros).forEach(([id,x])=>{ try{ livros[id]=normLivro({...x,id}); gravaDoc("livros/"+id,livros[id]); }catch(e){} }); guardaLivrosLocal(); }
function ligaLivrosDb(){ if(!db) return; db.collection("livros").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
  q.docs.forEach(d=>{ const x=lerDoc(d); if(x){ delete x.atualizadoEm; try{ m[d.id]=normLivro({...x,id:d.id}); }catch(e){} } });
  mergeCol("livros/",m,livros); if(JSON.stringify(m)!==JSON.stringify(livros)){ livros=m; guardaLivrosLocal(); } },()=>{}); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaLivrosDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();

/* ---------- seleção: filtros (vazio = todos) + à mão ---------- */
const espacoEx=E=>String(E.espaco&&E.espaco.txt||"").trim();
function passaFiltros(E,f){ const em=(lista,v)=>!lista.length||lista.includes(v);
  return em(f.parte,E.parte)&&em(f.momento,E.momento||"")&&(!f.sub.length||f.sub.includes(E.momento+"."+E.sub))&&em(f.tipo,E.tipo||"")&&em(f.formato,E.formato||"")&&em(f.espaco,espacoEx(E))
    &&(!f.comp||(f.comp==="qualquer"?!!E.comp:E.comp===f.comp))&&(!f.meinho||E.meinho); }
function exDoLivro(L){ const sel=new Set(Object.values(exercicios).filter(E=>passaFiltros(E,L.filtros)).map(E=>E.id)); L.mais.forEach(id=>{ if(exercicios[id]) sel.add(id); }); L.menos.forEach(id=>sel.delete(id));
  return [...sel].map(id=>exercicios[id]); }
/* capítulos pela categoria do caderno do clube; dentro, pela subfase e pelo nome; numeração do livro (ex.: OO-03) */
function capitulosLivro(exs){ return CAP_LIVRO.map(([k,sig])=>{ const subs=(SUB_EX[k]||[]).map(x=>x[0]);
    const ls=exs.filter(E=>(MOM_EX.some(m=>m[0]===E.momento)?E.momento:"")===k).sort((a,b)=>{ const ia=subs.indexOf(a.sub), ib=subs.indexOf(b.sub); return (ia<0?99:ia)-(ib<0?99:ib)||a.nome.localeCompare(b.nome,"pt"); });
    return {k,sig,nome:nomeCapLivro(k),exs:ls.map((E,i)=>({E,cod:`${sig}-${String(i+1).padStart(2,"0")}`}))}; }).filter(c=>c.exs.length); }
/* nomes e alcunhas do Plantel (e jogadores de fora das UT) para a versão para fora */
function nomesParaTirar(){ const s=new Set(), mete=t=>{ t=String(t||"").trim(); if(t.length>=3) s.add(t); };
  est.plantel.forEach(p=>{ mete(p.nome); const w=String(p.nome||"").trim().split(/\s+/); if(w.length>1) mete(w[0]+" "+w[w.length-1]); String(p.alc||"").split(/[,;]/).forEach(mete); });
  Object.values(typeof uts!=="undefined"?uts:{}).forEach(U=>(U.extras||[]).forEach(x=>{ mete(x.nome); String(x.alc||"").split(/[,;]/).forEach(mete); }));
  return [...s].sort((a,b)=>b.length-a.length); }
function tiraNomes(txt,nomes){ let t=String(txt||""), mudou=false;
  nomes.forEach(n=>{ const re=new RegExp(`(^|[^\\p{L}])${n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(?=$|[^\\p{L}])`,"giu"); t=t.replace(re,(m,a)=>{ mudou=true; return a+"jogador"; }); }); return {t,mudou}; }
function exParaFora(E,nomes){ let mudou=false; const lim=v=>{ const r=tiraNomes(v,nomes); if(r.mudou) mudou=true; return r.t; }, L=v=>v.map(lim);
  const F={...clone(E),nome:lim(E.nome),objetivos:lim(E.objetivos),objEsp:L(E.objEsp),comportamentos:L(E.comportamentos),condicionantes:L(E.condicionantes),descricao:lim(E.descricao),variantes:L(E.variantes),
    links:E.links.filter(x=>x.pub),criadoPor:"",alteradoPor:""};
  if(F.figura&&F.figura.quadro) F.figura={...F.figura,quadro:{...F.figura.quadro,nomes:false}};
  return {E:F,mudou}; }
/* avisos antes de gerar */
function avisosLivro(L){ const exs=exDoLivro(L), nomes=L.versao==="fora"?nomesParaTirar():[];
  const semFig=exs.filter(E=>!usaImagem(E)&&!temFigura(E)), incomp=exs.filter(E=>!E.descricao||!totalEx(E)||!E.objetivos||!E.momento);
  const img=L.versao==="fora"?exs.filter(usaImagem):[], comNomes=L.versao==="fora"?exs.filter(E=>exParaFora(E,nomes).mudou):[];
  return {exs,semFig,incomp,img,comNomes}; }

/* ---------- folhas ---------- */
function folhaLivros(){ const ls=Object.values(livros).sort((a,b)=>a.nome.localeCompare(b.nome,"pt"));
  folha(`<h3>📕 Livros de exercícios</h3><p class="sub" style="margin:0">Cada livro guarda os filtros, a seleção à mão e a versão; ao gerar outra vez entram as fichas como estão no repositório.</p>
    ${ls.length?`<ul class="evl">${ls.map(L=>`<li><button class="lnk lv-it" data-id="${esc(L.id)}"><b>${esc(L.nome)}</b> · ${L.versao==="fora"?"para fora do clube":"interno"} · ${exDoLivro(L).length} exercícios${L.gerado?` · gerado a ${esc(dataHora(L.gerado.em))}`:""}</button></li>`).join("")}</ul>`:`<p class="sub" style="margin:0">Ainda sem livros.</p>`}
    <div class="actions"><button class="btn" data-close>Fechar</button><button class="btn primary" id="lv-novo">+ Novo livro</button></div>`,(s,fecha)=>{
    s.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>{ fecha(); folhaLivro(b.dataset.id); }); s.querySelector("#lv-novo").onclick=()=>{ fecha(); folhaLivro(null); }; }); }
function folhaLivro(id){ const L=clone(id&&livros[id]?livros[id]:normLivro({id:uId("lv")})); let pesq="";
  const todos=()=>Object.values(exercicios), uniq=a=>[...new Set(a.filter(Boolean))].sort((x,y)=>x.localeCompare(y,"pt"));
  const dims=()=>[["parte","Parte da UT",PARTES.map(p=>[p[0],p[1]])],["momento","Momento / categoria",[...MOM_EX,["","Sem categoria"]]],
    ["sub","Subfase",L.filtros.momento.flatMap(m=>(SUB_EX[m]||[]).map(([k,n])=>[m+"."+k,n]))],["tipo","Tipo",TIPOS_EX],
    ["formato","Formato",uniq(todos().map(E=>E.formato)).map(v=>[v,v])],["espaco","Espaço",uniq(todos().map(espacoEx)).map(v=>[v,v])]];
  folha(`<h3>${id?"Livro de exercícios":"Novo livro de exercícios"}</h3>
    <div class="fields"><label class="f">Nome (só na app)<input type="text" id="lv-n" value="${esc(L.nome)}"></label><label class="f">Título na capa<input type="text" id="lv-t" value="${esc(L.titulo)}" placeholder="Ex.: Caderno de Exercícios 2026/27"></label></div>
    <h4>Versão</h4><div class="seg" id="lv-v"><button data-k="interna">Interna (ficha completa, autoria e todas as ligações)</button><button data-k="fora">Para fora do clube</button></div>
    <h4 style="margin-bottom:0">1 · Filtros <span class="sub">(nenhum escolhido = todos)</span></h4><div id="lv-f"></div>
    <h4 style="margin-bottom:0">2 · Exercícios <span class="sub" id="lv-c"></span></h4>
    <input type="search" id="lv-q" placeholder="Procurar para acrescentar à mão" aria-label="Procurar exercício"><div id="lv-l" class="lv-lista"></div>
    <div class="actions">${id?`<button class="btn danger l" id="lv-del">Apagar livro</button>`:""}<button class="btn" data-close>Fechar</button><button class="btn" id="lv-ok">Guardar</button><button class="btn primary" id="lv-gera">⬇ Gerar PDF</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x);
    const pintaV=()=>s.querySelectorAll("#lv-v button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===L.versao)));
    s.querySelectorAll("#lv-v button").forEach(b=>b.onclick=()=>{ L.versao=b.dataset.k; pintaV(); }); pintaV();
    const pintaF=()=>{ q("#lv-f").innerHTML=dims().filter(([,,ops])=>ops.length).map(([k,n,ops])=>`<div class="lv-dim"><small>${n}</small><div class="chips">${ops.map(([v,t])=>`<button class="chip" data-d="${k}" data-v="${esc(v)}" aria-pressed="${L.filtros[k].includes(v)}">${esc(t)}</button>`).join("")}</div></div>`).join("")
        +`<div class="lv-dim"><small>Competição interna e meinho</small><div class="chips">${[["liga","Liga"],["champions","Champions"],["qualquer","Liga ou Champions"]].map(([v,t])=>`<button class="chip" data-c="${v}" aria-pressed="${L.filtros.comp===v}">${t}</button>`).join("")}<button class="chip" id="lv-mh" aria-pressed="${L.filtros.meinho}">Meinho</button></div></div>`;
      q("#lv-f").querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{ const a=L.filtros[b.dataset.d], v=b.dataset.v, i=a.indexOf(v); if(i<0) a.push(v); else a.splice(i,1);
        if(b.dataset.d==="momento") L.filtros.sub=L.filtros.sub.filter(x=>L.filtros.momento.includes(x.split(".")[0])); pintaF(); pintaL(); });
      q("#lv-f").querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{ L.filtros.comp=L.filtros.comp===b.dataset.c?"":b.dataset.c; pintaF(); pintaL(); });
      q("#lv-mh").onclick=()=>{ L.filtros.meinho=!L.filtros.meinho; pintaF(); pintaL(); }; };
    const pintaL=()=>{ const sel=new Set(exDoLivro(L).map(E=>E.id)), f=semAcento(pesq);
      const ls=todos().filter(E=>sel.has(E.id)||passaFiltros(E,L.filtros)||(f&&semAcento(E.nome+" "+E.n).includes(f))).sort((a,b)=>(a.n||1e9)-(b.n||1e9)||a.nome.localeCompare(b.nome,"pt"));
      q("#lv-c").textContent=`(${sel.size} selecionados)`;
      q("#lv-l").innerHTML=ls.length?ls.map(E=>`<label class="lv-ex"><input type="checkbox" data-x="${esc(E.id)}"${sel.has(E.id)?" checked":""}><span><b>${E.n?"Nº "+E.n+" · ":""}${esc(E.nome)}</b><small>${esc([catEx(E),rotuloDe(TIPOS_EX,E.tipo)].filter(Boolean).join(" · "))}</small></span></label>`).join(""):`<p class="sub">Nenhum exercício com estes filtros.</p>`;
      q("#lv-l").querySelectorAll("[data-x]").forEach(c=>c.onchange=()=>{ const x=c.dataset.x, filtro=passaFiltros(exercicios[x],L.filtros);
        L.mais=L.mais.filter(y=>y!==x); L.menos=L.menos.filter(y=>y!==x); if(c.checked&&!filtro) L.mais.push(x); if(!c.checked&&filtro) L.menos.push(x); pintaL(); }); };
    q("#lv-q").oninput=()=>{ pesq=q("#lv-q").value; pintaL(); };
    pintaF(); pintaL();
    const le=()=>{ L.nome=q("#lv-n").value.trim()||"Livro de exercícios"; L.titulo=q("#lv-t").value.trim(); };
    if(q("#lv-del")) confirma2(q("#lv-del"),"Toca outra vez para apagar",()=>{ fecha(); apagaLivro(L.id); });
    q("#lv-ok").onclick=()=>{ le(); fecha(); gravaLivro(L); toast("Livro guardado"); };
    q("#lv-gera").onclick=()=>{ le(); const N=gravaLivro(L); fecha(); folhaAvisosLivro(N.id); }; }); }
function folhaAvisosLivro(id){ const L=livros[id]; if(!L) return; const A=avisosLivro(L);
  if(!A.exs.length){ toast("O livro não tem exercícios: muda os filtros ou acrescenta à mão."); folhaLivro(id); return; }
  const lista=(t,ls)=>ls.length?`<h4 style="margin-bottom:0">${t} <span class="count">${ls.length}</span></h4><p class="sub" style="margin:0">${ls.slice(0,12).map(E=>esc((E.n?"Nº "+E.n+" ":"")+E.nome)).join(" · ")}${ls.length>12?` · e mais ${ls.length-12}`:""}</p>`:"";
  const algum=A.semFig.length||A.incomp.length||A.img.length||A.comNomes.length;
  folha(`<h3>Gerar «${esc(L.nome)}»</h3><p class="sub" style="margin:0">${A.exs.length} exercícios · ${L.versao==="fora"?"versão para fora do clube":"versão interna"} · um por página. Pode demorar 1 a 2 minutos.</p>
    ${algum?"":`<p class="mc-av ok" style="margin:0">✓ Todos os exercícios têm figura e ficha completa.</p>`}
    ${lista("Sem figura",A.semFig)}${lista("Ficha incompleta (sem descrição, duração, objetivos ou categoria)",A.incomp)}
    ${lista("Figura em imagem: confirma que não aparecem nomes (a app não os consegue tirar de uma imagem)",A.img)}${lista("Nomes ou alcunhas do Plantel trocados por «jogador» no texto",A.comNomes)}
    <p class="sub" id="lv-st" style="margin:0"></p>
    <div class="actions"><button class="btn" id="lv-volta">Voltar</button><button class="btn" id="lv-x" hidden>Cancelar</button><button class="btn primary" id="lv-go">${algum?"Gerar na mesma":"Gerar PDF"}</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x); let ctl=null;
    q("#lv-volta").onclick=()=>{ if(ctl) ctl.cancelado=true; fecha(); folhaLivro(id); };
    q("#lv-x").onclick=()=>{ if(ctl) ctl.cancelado=true; };
    q("#lv-go").onclick=async()=>{ ctl={cancelado:false}; q("#lv-go").disabled=true; q("#lv-x").hidden=false; const st=q("#lv-st");
      try{ const {doc,n}=await pdfLivro(L,(i,t)=>{ st.textContent=`A preparar ${i} de ${t}…`; },ctl);
        st.textContent="A guardar…"; const nomeF=`Livro_SCA_${L.nome.replace(/[^\wÀ-ÿ-]+/g,"_")}_${L.versao==="fora"?"para_fora":"interno"}_${isoDia(new Date())}.pdf`;
        await guardaFicheiro(nomeF,new Uint8Array(doc.output("arraybuffer")),"application/pdf"); gravaLivro({...livros[id],gerado:{em:new Date().toISOString(),n}}); fecha(); toast(`Livro gerado · ${n} exercícios`); }
      catch(e){ q("#lv-go").disabled=false; q("#lv-x").hidden=true;
        st.textContent=e&&e.message==="cancelado"?"Cancelado.":e&&e.code==="declined"?"":e&&e.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet.":"Não foi possível gerar ("+((e&&(e.code||e.message))||"erro")+")."; } }; }); }

/* ---------- PDF: capa, índice com páginas, um separador por capítulo e um exercício por página ---------- */
async function reduzJpegLivro(fig,max=1200){ if(!fig||fig.falta||!fig.d) return fig; try{ const im=await imgDeUrl(fig.d), k=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight));
  if(k>=1&&/jpeg/.test(fig.d.slice(0,30))) return fig; const cv=document.createElement("canvas"); cv.width=Math.round(im.naturalWidth*k); cv.height=Math.round(im.naturalHeight*k);
  const c=cv.getContext("2d"); c.fillStyle="#fff"; c.fillRect(0,0,cv.width,cv.height); c.drawImage(im,0,0,cv.width,cv.height); return {d:cv.toDataURL("image/jpeg",.82),w:cv.width,h:cv.height}; }catch(e){ return fig; } }
async function pdfLivro(L,prog,ctl){ if(!window.jspdf) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const fora=L.versao==="fora", nomes=fora?nomesParaTirar():[], caps=capitulosLivro(exDoLivro(L).map(E=>fora?exParaFora(E,nomes).E:E)), total=caps.reduce((a,c)=>a+c.exs.length,0);
  const doc=new window.jspdf.jsPDF({unit:"pt",format:"a4"}), PW=595.28, PH=841.89, M=34, W=PW-2*M, RED=[192,0,0], INK=[27,26,23], MUT=[110,106,98], LN=[200,196,186];
  const T=(t,x,y,o={})=>{ doc.setFont("helvetica",o.b?(o.i?"bolditalic":"bold"):(o.i?"italic":"normal")); doc.setFontSize(o.s||9); doc.setTextColor(...(o.c||INK)); doc.text(pdfTxt(t),x,y,o.al?{align:o.al}:undefined); };
  const hoje=new Date(), ano=hoje.getMonth()>=6?hoje.getFullYear():hoje.getFullYear()-1, epoca=`${ano}/${String(ano+1).slice(2)}`;
  /* páginas: 1 capa, depois o índice (linhas por página), um separador por capítulo e um exercício por página */
  const LPP=42, linhasIdx=caps.reduce((a,c)=>a+2+c.exs.length+new Set(c.exs.map(x=>x.E.sub||"")).size,0)-1, pIdx=Math.max(1,Math.ceil(linhasIdx/LPP));
  let p=1+pIdx; caps.forEach(c=>{ c.pag=++p; c.exs.forEach(x=>{ x.pag=++p; }); });
  /* capa */
  doc.setFillColor(...RED); doc.rect(0,0,PW,250,"F");
  if(IMG_DATA["slides/logo.png"]){ doc.setFillColor(255,255,255); doc.circle(PW/2,250,78,"F"); try{ doc.addImage(IMG_DATA["slides/logo.png"],"PNG",PW/2-58,192,116,116); }catch(e){} }
  T("SPORT CLUB ANGRENSE",PW/2,110,{b:1,s:20,c:[255,255,255],al:"center"}); T("Livro de exercícios",PW/2,140,{s:13,c:[255,225,225],al:"center"});
  doc.setFont("helvetica","bold"); doc.setFontSize(30); doc.setTextColor(...INK); doc.splitTextToSize(pdfTxt(L.titulo||L.nome),W-40).slice(0,3).forEach((l,i)=>doc.text(l,PW/2,400+i*36,{align:"center"}));
  T(`Época ${epoca}`,PW/2,520,{b:1,s:14,c:RED,al:"center"}); T(fora?"Versão para fora do clube":"Versão interna",PW/2,545,{s:12,al:"center"});
  T(`${total} exercícios · ${caps.length} ${caps.length===1?"capítulo":"capítulos"}`,PW/2,570,{s:11,c:MUT,al:"center"}); T(hoje.toLocaleDateString("pt-PT"),PW/2,592,{s:11,c:MUT,al:"center"});
  T("COMPROMISSO | RESILIÊNCIA | UNIÃO | ATITUDE | PAIXÃO | ALEGRIA",PW/2,PH-40,{b:1,i:1,s:8,c:MUT,al:"center"});
  /* índice (cada linha leva à página) */
  doc.addPage(); let y=M+20, lin=0; T("ÍNDICE",M,y,{b:1,s:16,c:RED}); y+=22;
  const linhaIdx=(txt,pag,o={})=>{ if(lin>=LPP){ doc.addPage(); y=M+20; lin=0; } lin++; const x=M+(o.ind||0);
    T(txt,x,y,{s:o.s||9,b:o.b,i:o.i,c:o.c}); if(pag){ T(String(pag),PW-M,y,{s:o.s||9,b:o.b,al:"right"}); doc.setDrawColor(...LN); doc.setLineDashPattern([1,2],0);
      doc.setFont("helvetica",o.b?"bold":"normal"); doc.setFontSize(o.s||9); const tw=doc.getTextWidth(pdfTxt(txt)); doc.line(x+tw+4,y-2,PW-M-22,y-2); doc.setLineDashPattern([],0); doc.link(M,y-10,W,13,{pageNumber:pag}); }
    y+=o.b?16:13; };
  caps.forEach(c=>{ linhaIdx(`${c.sig} · ${c.nome.toUpperCase()}`,c.pag,{b:1,s:10.5,c:RED}); let sub=null;
    c.exs.forEach(x=>{ const s=x.E.sub||""; if(s!==sub){ sub=s; linhaIdx(s?subEx(x.E):"Sem subfase",0,{i:1,s:8.5,c:MUT,ind:8}); }
      linhaIdx(`${x.cod}  ${x.E.nome}${x.E.n?`  (Nº ${x.E.n})`:""}`,x.pag,{ind:16}); }); lin++; y+=4; });
  while(doc.getNumberOfPages()<1+pIdx) doc.addPage();   // o índice ocupa sempre as páginas contadas antes (as ligações apontam para lá)
  /* capítulos e exercícios */
  let feitos=0;
  for(const c of caps){ if(ctl&&ctl.cancelado) throw new Error("cancelado");
    doc.addPage(); doc.setFillColor(...RED); doc.rect(0,0,PW,PH*.42,"F"); T(c.sig,M,170,{b:1,s:64,c:[255,255,255]}); T(c.nome.toUpperCase(),M,215,{b:1,s:24,c:[255,255,255]});
    T(`${c.exs.length} ${c.exs.length===1?"exercício":"exercícios"}`,M,245,{s:12,c:[255,225,225]}); let yc=PH*.42+40;
    const porSub=[]; c.exs.forEach(x=>{ const s=x.E.sub||""; let g=porSub.find(z=>z.s===s); if(!g) porSub.push(g={s,ls:[]}); g.ls.push(x); });
    porSub.forEach(g=>{ if(yc>PH-60) return; T(g.s?subEx(g.ls[0].E):"Sem subfase",M,yc,{b:1,s:11,c:RED}); yc+=16; g.ls.forEach(x=>{ if(yc>PH-60) return; T(`${x.cod}  ${x.E.nome}`,M+10,yc,{s:9.5}); doc.link(M,yc-10,W,13,{pageNumber:x.pag}); yc+=13; }); yc+=8; });
    for(const x of c.exs){ if(ctl&&ctl.cancelado) throw new Error("cancelado"); feitos++; if(prog) prog(feitos,total);
      const E=x.E; doc.addPage();
      doc.setFillColor(...INK); doc.rect(0,0,PW,30,"F"); T("SC ANGRENSE · LIVRO DE EXERCÍCIOS",M,19,{b:1,s:8,c:[255,255,255]}); T(`${c.sig} · ${c.nome.toUpperCase()}`,PW-M,19,{b:1,s:8,c:[255,200,200],al:"right"});
      T(x.cod,M,62,{b:1,s:24,c:RED}); doc.setFont("helvetica","bold"); doc.setFontSize(24); const cw=doc.getTextWidth(x.cod);
      T(E.nome,M+cw+12,56,{b:1,s:12}); T([E.sub?subEx(E):"",rotuloDe(TIPOS_EX,E.tipo),E.n?`Nº ${E.n} do repositório`:""].filter(Boolean).join(" · "),M+cw+12,70,{s:8.5,c:MUT});
      let yy=82; const fig=await reduzJpegLivro(await figuraJpegEx(E));
      if(fig){ let w=W, h=W*fig.h/fig.w; if(h>300){ h=300; w=h*fig.w/fig.h; } doc.setDrawColor(...LN); doc.rect(M+(W-w)/2,yy,w,h); figuraNoPdf(doc,fig,M+(W-w)/2,yy,w,h); yy+=h+10; }
      else { T("Sem figura.",M,yy+14,{i:1,s:9,c:MUT}); yy+=26; }
      const lks=E.links, lado=74, porLinha=Math.floor((W+14)/(lado+30)), hQR=lks.length?Math.ceil(lks.length/porLinha)*(lado+30)+18:0;
      const meta=fora?"":[E.criadoEm?`Criado a ${dataPt_(E.criadoEm.slice(0,10))}`:"",E.alteradoEm?`alterado a ${dataPt_(E.alteradoEm.slice(0,10))}`:""].filter(Boolean).join(" · ");
      const fimFicha=PH-34-hQR-(meta?12:0); fichaExPdf(doc,E,M,yy,W,{hMax:fimFicha-yy,num:x.cod});
      if(meta) T(`Autoria: ${meta}`,M,fimFicha+10,{s:7.5,c:MUT});
      if(lks.length){ let qx=M, qy=PH-34-hQR+14; T(fora?"Ligações":"Ligações (vídeos e documentos)",M,qy-4,{b:1,s:8,c:MUT});
        lks.forEach((k,i)=>{ if(i&&i%porLinha===0){ qx=M; qy+=lado+30; } try{ qrNoPdf(doc,k.url,qx,qy,lado); doc.link(qx,qy,lado,lado,{url:k.url}); }catch(e){}
          doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...INK); doc.text(doc.splitTextToSize(pdfTxt(k.t),lado+24).slice(0,2),qx+lado/2,qy+lado+9,{align:"center"}); qx+=lado+30; }); }
      if(feitos%4===0) await new Promise(ok=>setTimeout(ok,0)); } }
  const np=doc.getNumberOfPages(); for(let i=2;i<=np;i++){ doc.setPage(i); T(`${L.titulo||L.nome} · ${fora?"versão para fora":"versão interna"} · ${i}/${np}`,PW/2,PH-14,{s:7,c:MUT,al:"center"}); }
  return {doc,n:total,caps}; }
