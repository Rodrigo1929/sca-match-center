
/* ================= EXERCÍCIOS · repositório para as Unidades de Treino ================= */
const PARTES=[["inicial","Parte inicial","#B8963F"],["fundamental","Parte fundamental","#C00000"],["final","Parte final","#1F3A5F"]];
/* caderno de exercícios do clube (Rodrigo Fonte, 27/10/2026): categoria = o que se treina (campo momento), formato = como se treina (campo tipo);
   subdivisões (campo sub): a Preparação do Jogador em duas e as 4 categorias do Modelo de Jogo nas subfases dele */
const MOM_EX=[["prep","Preparação do Jogador"],["fund","Fundamentos do Jogo"],["princ","Princípios do Jogo"],["of","Organização Ofensiva"],["def","Organização Defensiva"],["tda","Transição Ofensiva"],["tad","Transição Defensiva"],["fin","Finalização"],["esq","Esquemas Táticos"]];
const SUB_EX={prep:[["ativ","Ativação e preparação"],["cap","Capacidades motoras"]],...Object.fromEntries(MOMENTOS.map(m=>[m[0],m[3]]))};   // nas 4 do Modelo de Jogo, as subfases dele
const TIPOS_EX=[["analitico","Exercício Analítico"],["circuito","Circuito"],["rondo","Rondo"],["mpb","MPB"],["posicional","Jogo Posicional"],["vagas","Vagas"],["setorial","Situação Setorial"],["intersetorial","Situação Intersetorial"],["reduzido","Jogo Reduzido"],["condicionado","Jogo Condicionado"],["formal","Jogo Formal"],["competicao","Competição"]];
const subEx=E=>rotuloDe(SUB_EX[E.momento]||[],E.sub);
const catEx=E=>rotuloDe(MOM_EX,E.momento)+(E.sub&&subEx(E)?" · "+subEx(E):"");
/* classificação antiga (momento + tipo) → categorias e formatos novos */
function migraCatEx(d){ let momento=String(d.momento||""), tipo=String(d.tipo||""), sub=String(d.sub||"");
  if(!TIPOS_EX.some(t=>t[0]===tipo)){ const v=tipo; tipo={estrategico:"condicionado"}[v]||"";
    if(v==="ativacao"&&!momento){ momento="prep"; sub="ativ"; } else if(v==="fisico"&&!momento){ momento="prep"; sub="cap"; }
    else if(v==="finalizacao"&&(!momento||momento==="of")){ momento="fin"; sub=""; } else if(v==="bolaparada"&&!momento) momento="esq"; }
  if(momento==="bpof"||momento==="bpdef") momento="esq";
  if(!MOM_EX.some(m=>m[0]===momento)) momento="";
  if(!(SUB_EX[momento]||[]).some(x=>x[0]===sub)) sub="";
  return {momento,sub,tipo}; }
const X_LS="sca-exercicios-v1";
const parteDe=k=>PARTES.find(p=>p[0]===k)||PARTES[1];
const rotuloDe=(L,k)=>(L.find(x=>x[0]===k)||[0,""])[1];

let exercicios={}; try{ exercicios=JSON.parse(localStorage.getItem(X_LS)||"{}")||{}; }catch(e){ exercicios={}; }
let xCur=null, xPl=null, xFiltro={q:"",mom:"",tipo:""};
try{ xCur=localStorage.getItem("sca-ex-cur")||null; const f=JSON.parse(localStorage.getItem("sca-ex-filtro")||"null"); if(f) xFiltro={...xFiltro,...f}; }catch(e){}
if(!MOM_EX.some(m=>m[0]===xFiltro.mom)) xFiltro.mom=""; if(!TIPOS_EX.some(t=>t[0]===xFiltro.tipo)) xFiltro.tipo="";
const xId=()=>"x"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);

/* ligações (vídeos, artigos): só http/https; ficam no repositório, nunca na UT nem nos PDF */
const urlOk=u=>{ u=String(u??"").trim(); if(!/^https?:\/\/\S+$/i.test(u)) return false; try{ return /^https?:$/.test(new URL(u).protocol); }catch(e){ return false; } };
const hostDe=u=>{ try{ return new URL(String(u).trim()).hostname.replace(/^www\./,""); }catch(e){ return "Ligação"; } };
/* conta para a estatística de tempos: sem escolha, só a parte fundamental (aquecimento e retorno à calma não contam); cada UT pode mudar */
const contaExDef=E=>typeof E.contaTempo==="boolean"?E.contaTempo:E.parte==="fundamental";
function normEx(d){ const s=v=>String(v??"").trim(), L=v=>(Array.isArray(v)?v.map(s):s(v).split(/\n/).map(x=>x.trim())).filter(Boolean), n=v=>{ const x=Math.round(+v); return isFinite(x)&&x>0?x:0; };
  const D=d.duracao||{}, {momento,sub,tipo}=migraCatEx(d);
  const E={id:s(d.id)||xId(), nome:s(d.nome)||"Sem nome", parte:PARTES.some(p=>p[0]===d.parte)?d.parte:"fundamental", momento, sub, tipo,
    formato:s(d.formato), espaco:{txt:s(d.espaco&&d.espaco.txt)},
    duracao:{series:n(D.series),pratica:n(D.pratica),pausa:n(D.pausa),total:n(D.total)||null},
    objetivos:s(d.objetivos), objEsp:L(d.objEsp),   // v99: objetivos gerais (campo antigo) e específicos (um por linha; não saem no PDF da UT)
    comportamentos:L(d.comportamentos), condicionantes:L(d.condicionantes), descricao:s(d.descricao), variantes:L(d.variantes), material:L(d.material),
    ligacoes:{modelo:L(d.ligacoes&&d.ligacoes.modelo), lances:L(d.ligacoes&&d.ligacoes.lances)},
    links:(Array.isArray(d.links)?d.links:[]).filter(x=>x&&urlOk(x.url)).map(x=>({t:s(x.t)||hostDe(x.url),url:s(x.url),...(x.pub?{pub:true}:{})})),   // pub (v103): sai no livro para fora do clube
    n:n(d.n),   // v103: nº fixo do repositório (1, 2, 3… pela data de criação)
    contaTempo:typeof d.contaTempo==="boolean"?d.contaTempo:null,
    comp:d.comp==="liga"||d.comp==="champions"?d.comp:"", meinho:!!d.meinho,   // v95: competição interna (etiqueta) e meinho
    criadoPor:s(d.criadoPor), criadoEm:s(d.criadoEm), alteradoPor:s(d.alteradoPor), alteradoEm:s(d.alteradoEm)};
  if(d.figura&&typeof d.figura==="object"){ const F={};
    if(d.figura.quadro&&typeof d.figura.quadro==="object") F.quadro=d.figura.quadro;
    const im=d.figura.imagem; if(im&&/^[\w-]{8,64}$/.test(String(im.id||""))) F.imagem={id:String(im.id),w:n(im.w)||1600,h:n(im.h)||900};
    if(F.quadro||F.imagem){ F.usa=F.imagem&&(d.figura.usa==="imagem"||!F.quadro)?"imagem":"quadro"; E.figura=F; } }
  return E; }
Object.keys(exercicios).forEach(id=>{ try{ exercicios[id]=normEx({...exercicios[id],id}); }catch(e){ delete exercicios[id]; } });

/* ---------- tempos: "3'", "1'30", "1,30" (= 1'30), "30 s", "8'M" ---------- */
function lerDur(t){ t=String(t??"").trim().toLowerCase().replace(/\s+/g,"").replace(/[´’`]/g,"'").replace(/'m$/,"'"); if(!t) return 0;
  let m=t.match(/^(\d+)[:',.](\d{1,2})(?:s|seg)?$/); if(m) return (+m[1])*60+(+m[2]);
  m=t.match(/^(\d+)(?:s|seg|segs|segundos)$/); if(m) return +m[1];
  m=t.match(/^(\d+)(?:'|m|min|minutos)?$/); if(m) return (+m[1])*60;
  return NaN; }
function fmtTempo(s){ if(!s) return "–"; if(s<60) return s+" s"; const m=Math.floor(s/60), r=s%60; return r?`${m}'${String(r).padStart(2,"0")}`:`${m}'`; }
function contaDur(D){ return D.series&&D.pratica?D.series*D.pratica+Math.max(0,D.series-1)*D.pausa:D.pratica||0; }
function totalEx(E){ return E.duracao.total||contaDur(E.duracao); }

/* ---------- gravação (um documento por exercício, pela fila pendentes) ---------- */
function guardaExLocal(){ try{ localStorage.setItem(X_LS,JSON.stringify(exercicios)); }catch(e){} }
const proxNumEx=()=>Math.max(0,...Object.values(exercicios).map(x=>x.n||0))+1;
function guardaEx(E,semRender){ const N=normEx({...E,alteradoPor:meuId||E.alteradoPor||"",alteradoEm:new Date().toISOString()}); if(!N.n) N.n=proxNumEx(); exercicios[N.id]=N; guardaExLocal(); gravaDoc("exercicios/"+N.id,N); if(!semRender) renderEx(); return N; }
function apagaEx(id){ const E=exercicios[id]; if(!E) return; const antes=clone(E); delete exercicios[id]; guardaExLocal(); apagaDoc("exercicios/"+id); if(xCur===id) xCur=null; renderEx();
  toast(`Exercício “${E.nome}” apagado`,()=>{ exercicios[id]=antes; guardaExLocal(); gravaDoc("exercicios/"+id,antes); xCur=id; renderEx(); }); }
function duplicaEx(id){ const E=exercicios[id]; if(!E) return; const N=guardaEx({...clone(E),id:xId(),n:0,nome:E.nome+" (cópia)",criadoPor:meuId||"",criadoEm:new Date().toISOString()},true); xCur=N.id; renderEx(); toast("Exercício duplicado"); }
function repoeExercicios(X){ Object.keys(exercicios).forEach(id=>{ if(!X[id]) apagaDoc("exercicios/"+id); }); exercicios={};
  Object.entries(X||{}).forEach(([id,E])=>{ exercicios[id]=normEx({...E,id}); gravaDoc("exercicios/"+id,exercicios[id]); }); guardaExLocal(); renderEx(); }

/* ---------- figura: desenhada com o editor do Modelo de Jogo (id "fx:<id>") ---------- */
function temFigura(E){ return !!(E&&E.figura&&E.figura.quadro); }
const usaImagem=E=>!!(E&&E.figura&&E.figura.imagem&&E.figura.usa==="imagem");
function cabFigura(E){ return `${parteDe(E.parte)[1]}${E.formato?" · "+E.formato:""} – `; }
/* figura nova: só bolinhas (sem números nem posições), sem onze; fig = sem painel do passo */
/* figuraQde serve também as cópias de exercícios guardadas nas UT */
function figuraQde(E){ return normQ({...(temFigura(E)?E.figura.quadro:{rot:"nada",auto:true,sis:"",pecas:[]}),id:"fx:"+E.id,nome:E.nome,cab:cabFigura(E),fig:true}); }
function figuraQ(id){ const E=exercicios[id]; return E?figuraQde(E):null; }
function guardaFigura(id,Q){ const E=exercicios[id]; if(!E) return; const q=clone(Q); delete q.id; delete q.nome; delete q.cab; delete q.fig;
  guardaEx({...clone(E),figura:{...(E.figura||{}),quadro:q,usa:"quadro"}},true); }

/* ---------- figura por imagem: guardada no armazenamento de ficheiros do link (assets); o exercício guarda só o id ---------- */
let xAssets; const xImgUrl={};
async function assetsEx(){ if(xAssets!==undefined) return xAssets; try{ xAssets=window.claude&&window.claude.use?await window.claude.use("assets"):null; }catch(e){ xAssets=null; } return xAssets; }
const srcImagem=im=>xImgUrl[im.id]||"/_blob/"+im.id;
/* fotos do iPad ou prints grandes: no máximo 1600 px no lado maior, JPEG */
async function reduzImagem(file,max=1600,png=false){ const url=URL.createObjectURL(file);   // png: mantém o fundo transparente (emblemas)
  try{ const img=new Image(); await new Promise((ok,ko)=>{ img.onload=ok; img.onerror=()=>ko(new Error("imagem")); img.src=url; });
    const f=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)), w=Math.max(1,Math.round(img.naturalWidth*f)), h=Math.max(1,Math.round(img.naturalHeight*f));
    const cv=document.createElement("canvas"); cv.width=w; cv.height=h; const cx=cv.getContext("2d"); if(!png){ cx.fillStyle="#fff"; cx.fillRect(0,0,w,h); } cx.drawImage(img,0,0,w,h);
    const blob=await new Promise(ok=>png?cv.toBlob(ok,"image/png"):cv.toBlob(ok,"image/jpeg",.85)); if(!blob) throw new Error("imagem"); return {blob,w,h}; }
  finally{ URL.revokeObjectURL(url); } }
const ERR_ASSETS={too_large:"A imagem é demasiado grande.",unsupported_type:"Esse tipo de ficheiro não é aceite. Usa uma foto ou imagem (JPG ou PNG).",quota_or_state:"O espaço para imagens do link está cheio.",rate_limited:"Muitas tentativas seguidas. Espera um pouco e tenta de novo.",upstream_auth:"Sessão expirada. Recarrega a página.",not_granted:"Sem permissão para carregar imagens neste link."};
function folhaImagemEx(id){ const E=exercicios[id]; if(!E) return; const im=E.figura&&E.figura.imagem;
  folha(`<h3>Imagem da figura</h3><p class="sub" style="margin:0">Uma foto ou print da figura (por exemplo, das UT antigas). Fica guardada no link para toda a equipa. É reduzida para no máximo 1600 px. Precisa de internet para carregar.</p>
    ${im?`<div class="xi-prev"><img alt="Imagem atual da figura"></div>`:""}
    ${im&&temFigura(E)?`<h4>Mostrar na ficha</h4><div class="seg" id="xi-u"><button data-k="quadro">Figura desenhada</button><button data-k="imagem">Imagem</button></div>`:""}
    <input type="file" id="xi-f" accept="image/*" hidden>
    <p class="sub" id="xi-st" style="margin:0"></p>
    <div class="actions">${im?`<button class="btn danger l" id="xi-del">Tirar imagem</button>`:""}<button class="btn" data-close>Fechar</button><button class="btn primary" id="xi-esc" disabled>${im?"Trocar imagem":"Escolher imagem ou foto"}</button></div>`,async(s,fecha)=>{
    const q=x=>s.querySelector(x), st=q("#xi-st"), esc_=q("#xi-esc");
    if(im){ const i=q(".xi-prev img"); i.src=srcImagem(im); i.onerror=()=>{ i.replaceWith(Object.assign(document.createElement("span"),{className:"sub",textContent:"Não consegui mostrar a imagem (sem rede ou sem acesso)."})); }; }
    s.querySelectorAll("#xi-u button").forEach(b=>{ b.setAttribute("aria-pressed",String(b.dataset.k===E.figura.usa)); b.onclick=()=>{ const X=exercicios[id]; guardaEx({...clone(X),figura:{...X.figura,usa:b.dataset.k}}); fecha(); }; });
    if(q("#xi-del")) confirma2(q("#xi-del"),"Toca outra vez para tirar",()=>{ const X=exercicios[id], antes=clone(X), F={...X.figura}; delete F.imagem; F.usa="quadro"; fecha();
      guardaEx({...clone(X),figura:F.quadro?F:undefined}); toast("Imagem tirada",()=>{ guardaEx(antes); }); });
    const A=await assetsEx();
    if(!A){ st.textContent="Neste aparelho não é possível carregar imagens: precisas de acesso de edição ao link no claude.ai."; return; }
    esc_.disabled=false; esc_.onclick=()=>q("#xi-f").click();
    q("#xi-f").onchange=async()=>{ const f=q("#xi-f").files[0]; if(!f) return; if(navigator.onLine===false){ st.textContent="Sem internet: liga-te à rede para carregar a imagem."; return; }
      esc_.disabled=true; st.textContent="A preparar a imagem…";
      try{ const {blob,w,h}=await reduzImagem(f); st.textContent="A enviar…";
        let r; try{ r=await A.upload(blob,{type:"image/jpeg"}); }catch(e){ if(e&&e.code==="store_unavailable"){ await new Promise(ok=>setTimeout(ok,1500)); r=await A.upload(blob,{type:"image/jpeg"}); } else throw e; }
        xImgUrl[r.id]=r.url; const X=exercicios[id]; guardaEx({...clone(X),figura:{...(X.figura||{}),imagem:{id:r.id,w,h},usa:"imagem"}}); fecha(); toast("Imagem guardada na figura"); }
      catch(e){ esc_.disabled=false; st.textContent=(e&&ERR_ASSETS[e.code])||(e&&e.message==="imagem"?"Não consegui abrir esse ficheiro como imagem.":"Não foi possível guardar a imagem ("+((e&&(e.code||e.message))||"erro")+")."); } }; }); }
function xPara(){ if(xPl&&xPl.playing) xPl.pause(); }

/* ---------- lista, pesquisa e filtros ---------- */
function exFiltrados(){ const q=xFiltro.q.trim().toLowerCase();
  return Object.values(exercicios).filter(E=>(!xFiltro.mom||E.momento===xFiltro.mom)&&(!xFiltro.tipo||E.tipo===xFiltro.tipo)
    &&(!q||[E.nome,E.formato,E.espaco.txt,E.descricao,E.objetivos,...E.objEsp,rotuloDe(TIPOS_EX,E.tipo),catEx(E),...E.comportamentos,...E.variantes,...E.material].join(" ").toLowerCase().includes(q)))
    .sort((a,b)=>a.nome.localeCompare(b.nome,"pt")); }
function guardaFiltro(){ try{ localStorage.setItem("sca-ex-filtro",JSON.stringify(xFiltro)); }catch(e){} }
function renderExFiltros(){ const bx=$("x-filtros"); if($("x-q")) return;
  bx.innerHTML=`<input type="search" id="x-q" placeholder="Pesquisar exercícios…" aria-label="Pesquisar exercícios">
    <select id="x-fm" aria-label="Categoria"><option value="">Todas as categorias</option>${MOM_EX.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join("")}</select>
    <select id="x-ft" aria-label="Formato do exercício"><option value="">Todos os formatos</option>${TIPOS_EX.map(t=>`<option value="${t[0]}">${t[1]}</option>`).join("")}</select>
    <span class="sub" id="x-n"></span><button class="btn" id="x-livro">📕 Livro de exercícios</button><button class="btn primary" id="x-novo">+ Novo exercício</button>`;
  $("x-livro").onclick=()=>folhaLivros();
  const q=$("x-q"), fm=$("x-fm"), ft=$("x-ft"); q.value=xFiltro.q; fm.value=xFiltro.mom; ft.value=xFiltro.tipo;
  q.oninput=()=>{ xFiltro.q=q.value; guardaFiltro(); renderExNav(exFiltrados(),exercicios[xCur]); };
  fm.onchange=()=>{ xFiltro.mom=fm.value; guardaFiltro(); renderEx(); }; ft.onchange=()=>{ xFiltro.tipo=ft.value; guardaFiltro(); renderEx(); };
  $("x-novo").onclick=()=>folhaEx(null); }
function renderExNav(ls,E){ const nav=$("x-nav"), tot=Object.keys(exercicios).length;
  $("x-n").textContent=tot?(ls.length===tot?`${tot} ${tot===1?"exercício":"exercícios"}`:`${ls.length} de ${tot}`):"";
  let h=""; PARTES.forEach(([pk,pn,cor])=>{ const q=ls.filter(x=>x.parte===pk); h+=`<div class="grp"><h3><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cor};margin-right:6px"></i>${pn}</h3><ul>`;
    if(!q.length) h+=`<li><span class="m-nada">${tot?"Nenhum com estes filtros":"Sem exercícios"}</span></li>`;
    q.forEach((x,i)=>{ const t=totalEx(x); h+=`<li><button data-id="${esc(x.id)}" aria-current="${!!E&&x.id===E.id}"><span class="n" title="Nº do repositório">${x.n||"–"}</span><span class="m-nm">${esc(x.nome)}<small>${esc([rotuloDe(TIPOS_EX,x.tipo),x.formato,t?fmtTempo(t):""].filter(Boolean).join(" · "))}</small></span></button></li>`; });
    h+=`</ul></div>`; });
  nav.innerHTML=h;
  nav.querySelectorAll("button[data-id]").forEach(b=>{ b.onclick=()=>{ xCur=b.dataset.id; renderEx(); };
    b.oncontextmenu=e=>{ const X=exercicios[b.dataset.id]; if(X) menuContexto(e,[["⧉ Duplicar",()=>duplicaEx(X.id)],[`🗑 Apagar “${X.nome}”`,()=>apagaEx(X.id),"perigo"]]); }; }); }

/* ---------- ecrã ---------- */
function renderEx(){ const v=$("view-x"); if(!v||v.hidden) return; renderExFiltros();
  const ls=exFiltrados(); let E=exercicios[xCur]||null; if(!E){ E=ls[0]||Object.values(exercicios)[0]||null; xCur=E?E.id:null; }
  try{ localStorage.setItem("sca-ex-cur",xCur||""); }catch(e){}
  renderExNav(ls,E); renderExFicha(E); renderExFigura(E); renderExPainel(E); }
function abreEx(id){ if(exercicios[id]) xCur=id; renderEx(); }
const linhasHtml=(a,ord)=>a.length?`<${ord?"ol":"ul"}>${a.map(x=>`<li>${esc(x)}</li>`).join("")}</${ord?"ol":"ul"}>`:"";
function renderExFicha(E){ const bx=$("x-ficha"), bar=$("x-bar"), tg=$("x-tag");
  if(!E){ $("x-tit").textContent="Exercícios"; tg.hidden=true; bar.innerHTML="";
    bx.innerHTML=`<div class="m-vazio"><b>Ainda não há exercícios no repositório.</b><span>Cada exercício tem a ficha da Unidade de Treino: espaço, duração, objetivos, descrição, variantes e figura. Mais tarde, as UT vão buscar os exercícios aqui.</span><button class="btn primary" id="x-novo2">+ Criar o primeiro exercício</button></div>`;
    $("x-novo2").onclick=()=>folhaEx(null); return; }
  const P=parteDe(E.parte);
  $("x-tit").textContent=E.nome; tg.hidden=false; tg.textContent=P[1].toUpperCase(); tg.style.background=P[2];
  bar.innerHTML=`<button class="btn sm" id="x-ed">✎ Editar ficha</button><button class="btn sm" id="x-fig">✎ ${temFigura(E)?"Editar":"Desenhar"} figura</button><button class="btn sm" id="x-img">🖼 Imagem</button><button class="btn sm" id="x-dup">⧉ Duplicar</button><button class="btn sm" id="x-pdf">⬇ PDF</button>`;
  $("x-ed").onclick=()=>folhaEx(E.id); $("x-fig").onclick=()=>{ xPara(); mEntraFig(E.id); }; $("x-img").onclick=()=>folhaImagemEx(E.id); $("x-dup").onclick=()=>duplicaEx(E.id);
  $("x-pdf").onclick=e=>guardaPdfEx(E.id,e.currentTarget);
  bx.innerHTML=fichaHtml(E,E.n?"· Nº "+E.n:""); }
/* ficha com o desenho da ficha de UT do clube (repositório e cópias nas UT); num = nº do exercício na UT */
function fichaHtml(E,num){ const P=parteDe(E.parte), D=E.duracao, tot=totalEx(E), tit=E.nome+(E.formato&&!E.nome.includes(E.formato)?" – "+E.formato:"");
  return `<div class="exf">
    <div class="exf-cab"><span>EXERCÍCIO${num?" "+num:""}</span><span>${esc(P[1].toUpperCase())}</span></div>
    <div class="exf-g">
      <div>
        <div class="exf-h exf-2"><span>ESPAÇO</span><span>DURAÇÃO</span></div>
        <div class="exf-2"><div class="exf-esp">${esc(E.espaco.txt||"–")}</div>
          <table class="exf-dur"><tr><th>TOTAL</th><td>${fmtTempo(tot)}</td></tr><tr><th>SÉRIES / REPS.</th><td>${D.series||"–"}</td></tr><tr><th>TEMPO PRÁTICA</th><td>${fmtTempo(D.pratica)}</td></tr><tr><th>PAUSA</th><td>${fmtTempo(D.pausa)}</td></tr></table></div>
        <div class="exf-h">OBJETIVOS E CONDICIONANTES</div>
        <div class="exf-txt"><b class="exf-tit">${esc(tit)}</b>${E.objetivos?`<p>${esc(E.objetivos)}</p>`:""}${E.objEsp.length?`<b>Objetivos específicos:</b>${linhasHtml(E.objEsp)}`:""}${E.comportamentos.length?`<b>Comportamentos-chave:</b>${linhasHtml(E.comportamentos)}`:""}${E.condicionantes.length?`<b>Condicionantes:</b>${linhasHtml(E.condicionantes)}`:""}</div>
      </div>
      <div>
        <div class="exf-h">DESCRIÇÃO</div><div class="exf-txt">${E.descricao?`<p>${esc(E.descricao)}</p>`:`<p class="sub">Sem descrição.</p>`}</div>
        <div class="exf-h">VARIANTES DO EXERCÍCIO</div><div class="exf-txt">${E.variantes.length?linhasHtml(E.variantes,true):`<p class="sub">Sem variantes.</p>`}</div>
      </div>
    </div></div>`; }
function renderExFigura(E){ const st=$("x-stage"), pb=$("x-play"); if(xPl){ xPl.pause(); xPl=null; }
  if(!E){ st.innerHTML=""; st.hidden=true; pb.hidden=true; return; } st.hidden=false;
  if(usaImagem(E)){ pb.hidden=true; st.innerHTML=`<div class="x-img"><img alt="Figura do exercício"></div>`; const i=st.querySelector("img"); i.src=srcImagem(E.figura.imagem);
    i.onerror=()=>{ st.innerHTML=`<div class="m-vazio"><b>Imagem indisponível</b><span>Não consegui mostrar a imagem da figura (sem rede ou sem acesso ao link).</span></div>`; }; return; }
  if(!temFigura(E)){ st.innerHTML=`<div class="m-vazio"><b>Sem figura</b><span>Desenha a figura com o editor do Modelo de Jogo: jogadores, adversários, bola, setas, zonas e passos animados.</span><button class="btn primary" id="x-fig2">✎ Desenhar figura</button></div>`;
    st.querySelector(".m-vazio").insertAdjacentHTML("beforeend",`<button class="btn" id="x-img2">🖼 Ou carregar uma imagem</button>`);
    $("x-fig2").onclick=()=>mEntraFig(E.id); $("x-img2").onclick=()=>folhaImagemEx(E.id); pb.hidden=true; return; }
  const Q=figuraQ(E.id), estado=()=>{ const b=$("x-pl"); if(b) b.textContent=xPl&&xPl.playing?"⏸ Pausa":"▶ Animar"; };
  st.innerHTML=""; xPl=playerModelo(Q,{onT:estado,onEnd:estado}); st.appendChild(xPl.svg);
  if(Q.passos.length<2){ pb.hidden=true; return; }
  pb.hidden=false; pb.innerHTML=`<button class="btn sm" id="x-ini" aria-label="Voltar ao passo 1">⏮</button><button class="btn sm primary" id="x-pl" style="min-width:96px">▶ Animar</button><span class="sub">${Q.passos.length} passos</span>`;
  $("x-ini").onclick=()=>{ xPl.pause(); xPl.set(0); estado(); };
  $("x-pl").onclick=()=>{ if(xPl.playing) xPl.pause(); else xPl.play(xPl.t>=Q.passos.length-1-1e-6?0:xPl.t); estado(); }; }
const dataHora=iso=>{ try{ return new Date(iso).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}); }catch(e){ return ""; } };
function renderExPainel(E){ const pn=$("x-panel");
  if(!E){ pn.innerHTML=`<header><h2>Repositório de exercícios</h2><p class="sub">Exercícios para as Unidades de Treino, com a ficha do clube.</p></header>`; return; }
  const lM=E.ligacoes.modelo.filter(id=>modelos[id]), lL=E.ligacoes.lances.map(id=>lances().find(l=>l.id===id)).filter(Boolean);
  const quem=(id,em)=>`<b data-u="${esc(id)}">${id?"…":"—"}</b>${em?" · "+esc(dataHora(em)):""}`;
  pn.innerHTML=`<header><h2>Classificação</h2><p class="sub">Para encontrar o exercício e, mais tarde, montar as UT.</p></header>
    <dl class="exd"><dt>Parte</dt><dd>${esc(parteDe(E.parte)[1])}</dd><dt>Categoria</dt><dd>${esc(catEx(E)||"–")}</dd>
      <dt>Formato</dt><dd>${esc(rotuloDe(TIPOS_EX,E.tipo)||"–")}</dd><dt>Estrutura</dt><dd>${esc(E.formato||"–")}</dd>
      <dt>Tempos</dt><dd>${contaExDef(E)?"Conta para a estatística":"Não conta"}${E.contaTempo===null?" (pela parte)":""}</dd>
      <dt>Competição interna</dt><dd>${E.comp?(E.comp==="liga"?"Liga":"Champions"):"–"}</dd><dt>Meinho</dt><dd>${E.meinho?"Sim":"–"}</dd></dl>
    <div class="add"><h3>Material</h3>${E.material.length?`<div class="picks">${E.material.map(m=>`<label>${esc(m)}</label>`).join("")}</div>`:`<p class="sub" style="margin:0">Sem material indicado.</p>`}</div>
    <div class="add"><h3>Ligações</h3>${lM.length||lL.length?`<div class="xlig">${lM.map(id=>`<button class="btn sm" data-m="${esc(id)}">Modelo · ${esc(modelos[id].nome)}</button>`).join("")}${lL.map(L=>`<button class="btn sm" data-l="${esc(L.id)}">Bola parada · ${esc(L.nome)}</button>`).join("")}</div>`:`<p class="sub" style="margin:0">Sem ligações a quadros do Modelo de Jogo ou de bolas paradas.</p>`}</div>
    <div class="add"><h3>Vídeos e ligações</h3>${E.links.length?`<ul class="xlinks">${E.links.map(x=>`<li><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.t)}</a><small>${esc(hostDe(x.url))}</small></li>`).join("")}</ul>`:`<p class="sub" style="margin:0">Sem ligações.</p>`}<p class="sub" style="margin:0">Só no repositório: não passam para as UT nem para os PDF.</p></div>
    <div class="add"><h3>Autoria</h3><p class="sub" style="margin:0">Criado por ${quem(E.criadoPor,E.criadoEm)}</p>${E.alteradoEm?`<p class="sub" style="margin:0">Última alteração: ${quem(E.alteradoPor,E.alteradoEm)}</p>`:""}</div>`;
  pn.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{ mCur=b.dataset.m; setTab("m"); });
  pn.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{ curId=b.dataset.l; setTab("q"); render(); });
  preencheNomes(pn); }
/* nomes de quem criou/alterou: só se guarda o id; o nome vem sempre na hora */
async function preencheNomes(root){ const els=[...root.querySelectorAll("[data-u]")].filter(e=>e.dataset.u); if(!els.length) return;
  const resto=e=>e.textContent=e.dataset.u===meuId?"ti":"alguém da equipa";
  if(!usr||!usr.profiles){ els.forEach(resto); return; }
  try{ const ps=await usr.profiles([...new Set(els.map(e=>e.dataset.u))]); els.forEach(e=>{ const p=ps&&ps[e.dataset.u]; if(p&&p.name) e.textContent=p.name; else resto(e); }); }catch(e){ els.forEach(resto); } }

/* ---------- ficha: criar e editar ---------- */
function folhaEx(id){ const E0=id?exercicios[id]:null, E=E0?clone(E0):normEx({id:xId()}); if(!E0) E.nome="";
  let parte=E.parte, mom=E.momento, sub=E.sub, tipo=E.tipo, conta=E.contaTempo, comp=E.comp, mh=E.meinho, lk=E.links.map(x=>({...x})); const D=E.duracao, tt=s=>s?fmtTempo(s):"";
  const ta=(i,lab,val,rows,ph)=>`<label class="f">${lab}<textarea id="${i}" rows="${rows}" placeholder="${esc(ph||"")}">${esc(val)}</textarea></label>`;
  const ligM=listaModelos(), ligL=lances().filter(l=>l.tipo==="OF"||l.tipo==="DEF");
  folha(`<h3>${E0?"Editar exercício":"Novo exercício"}</h3>
    <label class="f">Nome (título a vermelho na ficha)<input type="text" id="xe-n" value="${esc(E.nome)}" placeholder="Ex.: MPB Posicional"></label>
    <div class="fields"><label class="f">Estrutura (nº de jogadores)<input type="text" id="xe-fo" value="${esc(E.formato)}" placeholder="Ex.: 8+2×4+GR"></label><label class="f">Espaço<input type="text" id="xe-es" value="${esc(E.espaco.txt)}" placeholder="Ex.: 1/2 campo, dupla área, 8x8"></label></div>
    <h4>Parte da UT</h4><div class="seg" id="xe-p">${PARTES.map(p=>`<button data-k="${p[0]}">${p[1]}</button>`).join("")}</div>
    <h4>Categoria do exercício</h4><div class="seg" id="xe-m">${MOM_EX.map(m=>`<button data-k="${m[0]}">${m[1]}</button>`).join("")}</div>
    <div class="seg" id="xe-s"></div>
    <h4>Formato do exercício</h4><div class="seg" id="xe-t">${TIPOS_EX.map(t=>`<button data-k="${t[0]}">${t[1]}</button>`).join("")}</div>
    <h4>Duração</h4>
    <div class="xe-dur"><label class="f">Séries / reps.<input type="text" inputmode="numeric" id="xe-se" value="${D.series||""}"></label><label class="f">Tempo prática<input type="text" id="xe-pr" value="${tt(D.pratica)}" placeholder="Ex.: 3' ou 2'30"></label><label class="f">Pausa<input type="text" id="xe-pa" value="${tt(D.pausa)}" placeholder="Ex.: 1'30 ou 30 s"></label><label class="f">Total<input type="text" id="xe-to" value="${tt(D.total)}"></label></div>
    <p class="sub" id="xe-dt" style="margin:0"></p>
    ${ta("xe-ob","Objetivos gerais",E.objetivos,3)}
    ${ta("xe-oe","Objetivos específicos (um por linha; não saem no PDF da UT)",E.objEsp.join("\n"),4)}
    ${ta("xe-co","Comportamentos-chave (um por linha)",E.comportamentos.join("\n"),3)}
    ${ta("xe-cd","Condicionantes / regras (uma por linha)",E.condicionantes.join("\n"),2,"Ex.: Circulação a 1 toque")}
    ${ta("xe-de","Descrição",E.descricao,5)}
    ${ta("xe-va","Variantes do exercício (uma por linha)",E.variantes.join("\n"),2)}
    ${ta("xe-ma","Material (um por linha)",E.material.join("\n"),2,"Ex.: Bolas\nCones\nColetes\nMini-balizas")}
    <h4>Estatística de tempos</h4><div class="seg" id="xe-ct"><button data-k="">Pela parte</button><button data-k="1">Conta</button><button data-k="0">Não conta</button></div>
    <p class="sub" id="xe-ctd" style="margin:0"></p>
    <h4>Competição interna</h4><div class="seg" id="xe-cp"><button data-k="">Não</button><button data-k="liga">Liga</button><button data-k="champions">Champions</button></div>
    <h4>Meinho</h4><div class="seg" id="xe-mh"><button data-k="">Não</button><button data-k="1">Sim (Rei do Meinho e Rei das Cuecas)</button></div>
    <p class="sub" style="margin:0">Vêm ativas ao pôr o exercício numa UT, com selo no exercício e no PDF da UT; cada UT pode anular ou ativar.</p>
    <h4>Vídeos e ligações</h4><div class="xe-lk" id="xe-lk"></div><button class="btn sm" id="xe-lka" type="button">+ Ligação</button>
    <p class="sub" style="margin:0">Título e endereço (http:// ou https://). Abrem numa janela nova. Só ficam no repositório: não passam para as UT nem para os PDF.</p>
    <details class="more"><summary>Ligações a quadros do Modelo de Jogo e de bolas paradas</summary><div class="picks" id="xe-lg" style="margin-top:8px">
      ${ligM.map(Q=>`<label><input type="checkbox" data-m="${esc(Q.id)}"${E.ligacoes.modelo.includes(Q.id)?" checked":""}> Modelo · ${esc(Q.nome)}</label>`).join("")}
      ${ligL.map(L=>`<label><input type="checkbox" data-l="${esc(L.id)}"${E.ligacoes.lances.includes(L.id)?" checked":""}> ${esc(L.nome)}</label>`).join("")}
      ${ligM.length||ligL.length?"":`<span class="sub">Ainda não há quadros para ligar.</span>`}</div></details>
    <div class="actions">${E0?`<button class="btn danger l" id="xe-del">Apagar exercício</button>`:""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="xe-ok">${E0?"Guardar":"Criar exercício"}</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x);
    const pinta=()=>{ s.querySelectorAll("#xe-p button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===parte)));
      s.querySelectorAll("#xe-m button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===mom)));
      s.querySelectorAll("#xe-t button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===tipo)));
      const ss=q("#xe-s"), subs=SUB_EX[mom]||[]; ss.hidden=!subs.length;
      ss.innerHTML=subs.map(x=>`<button data-k="${x[0]}" aria-pressed="${x[0]===sub}">${x[1]}</button>`).join("");
      ss.querySelectorAll("button").forEach(b=>b.onclick=()=>{ sub=sub===b.dataset.k?"":b.dataset.k; pinta(); }); };
    const pintaCt=()=>{ s.querySelectorAll("#xe-ct button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===(conta===null?"":conta?"1":"0"))));
      q("#xe-ctd").textContent=conta===null?`Pela parte: ${parte==="fundamental"?"conta":"não conta"} (só a parte fundamental conta). Cada UT pode mudar.`:"Cada UT pode mudar."; };
    s.querySelectorAll("#xe-ct button").forEach(b=>b.onclick=()=>{ conta=b.dataset.k===""?null:b.dataset.k==="1"; pintaCt(); });
    const pintaM=()=>{ s.querySelectorAll("#xe-cp button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===comp))); s.querySelectorAll("#xe-mh button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===(mh?"1":"")))); };
    s.querySelectorAll("#xe-cp button").forEach(b=>b.onclick=()=>{ comp=b.dataset.k; pintaM(); }); s.querySelectorAll("#xe-mh button").forEach(b=>b.onclick=()=>{ mh=!!b.dataset.k; pintaM(); }); pintaM();
    /* ligações: acrescentar, tirar e mudar a ordem */
    const pintaLk=()=>{ const bx=q("#xe-lk"); bx.innerHTML=lk.map((x,i)=>`<div class="xe-lkr" data-i="${i}"><input type="text" data-f="t" value="${esc(x.t)}" placeholder="Título" aria-label="Título da ligação"><input type="url" data-f="url" value="${esc(x.url)}" placeholder="https://…" aria-label="Endereço" autocapitalize="off" spellcheck="false">
        <button class="btn sm xe-pub" type="button" data-a="pub" aria-pressed="${!!x.pub}" title="Público: sai no livro de exercícios para fora do clube">${x.pub?"🌐 Público":"🔒 Interno"}</button><button class="icon" type="button" data-a="up" aria-label="Subir" ${i?"":"disabled"}>▲</button><button class="icon" type="button" data-a="dn" aria-label="Descer" ${i<lk.length-1?"":"disabled"}>▼</button><button class="icon" type="button" data-a="x" aria-label="Tirar ligação">✕</button></div>`).join("");
      bx.querySelectorAll(".xe-lkr").forEach(r=>{ const i=+r.dataset.i;
        r.querySelectorAll("input").forEach(inp=>inp.oninput=()=>{ lk[i][inp.dataset.f]=inp.value; inp.classList.remove("bad"); });
        r.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{ const a=b.dataset.a; if(a==="pub") lk[i].pub=!lk[i].pub; else if(a==="x") lk.splice(i,1); else { const j=i+(a==="up"?-1:1); [lk[i],lk[j]]=[lk[j],lk[i]]; } pintaLk(); }); }); };
    q("#xe-lka").onclick=()=>{ lk.push({t:"",url:""}); pintaLk(); const r=q("#xe-lk").lastElementChild; if(r) r.querySelector("input").focus(); }; pintaLk();
    s.querySelectorAll("#xe-p button").forEach(b=>b.onclick=()=>{ parte=b.dataset.k; pinta(); pintaCt(); });
    s.querySelectorAll("#xe-m button").forEach(b=>b.onclick=()=>{ mom=mom===b.dataset.k?"":b.dataset.k; sub=""; pinta(); });
    s.querySelectorAll("#xe-t button").forEach(b=>b.onclick=()=>{ tipo=tipo===b.dataset.k?"":b.dataset.k; pinta(); }); pinta(); pintaCt();
    /* duração: o total sugerido é a conta; escrever um total sobrepõe-se */
    const dur=()=>({series:Math.max(0,parseInt(q("#xe-se").value)||0),pratica:lerDur(q("#xe-pr").value),pausa:lerDur(q("#xe-pa").value),total:lerDur(q("#xe-to").value)});
    const mostraConta=()=>{ const d=dur(), bad=["pratica","pausa","total"].filter(k=>isNaN(d[k])); const dt=q("#xe-dt");
      if(bad.length){ dt.innerHTML=`<b style="color:var(--red)">Tempo que não percebo.</b> Usa por exemplo 3', 2'30, 1,30 ou 30 s.`; return; }
      const c=contaDur(d); q("#xe-to").placeholder=c?"Conta: "+fmtTempo(c):"";
      dt.textContent=c?(d.series>1?`Conta: ${d.series} × ${fmtTempo(d.pratica)}${d.pausa?` + ${d.series-1} × ${fmtTempo(d.pausa)} de pausa`:""} = ${fmtTempo(c)}.`:`Conta: ${fmtTempo(c)}.`)+(d.total?` Total escrito à mão: ${fmtTempo(d.total)}.`:" Deixa o total vazio para usar a conta."):""; };
    ["#xe-se","#xe-pr","#xe-pa","#xe-to"].forEach(i=>q(i).addEventListener("input",mostraConta)); mostraConta();
    if(q("#xe-del")) confirma2(q("#xe-del"),"Toca outra vez para apagar",()=>{ fecha(); apagaEx(E0.id); });
    q("#xe-ok").onclick=()=>{ const nome=q("#xe-n").value.trim(); if(!nome){ toast("Escreve o nome do exercício."); q("#xe-n").focus(); return; }
      const d=dur(); if(["pratica","pausa","total"].some(k=>isNaN(d[k]))){ toast("Corrige os tempos da duração."); return; }
      const lks=[], mal=lk.findIndex(x=>{ const t=String(x.t||"").trim(), u=String(x.url||"").trim(); if(!t&&!u) return false; if(!urlOk(u)) return true; lks.push({t,url:u,...(x.pub?{pub:true}:{})}); return false; });
      if(mal>=0){ const inp=s.querySelectorAll("#xe-lk .xe-lkr")[mal]?.querySelector("[data-f=url]");
        if(inp){ inp.classList.add("bad"); inp.focus(); } toast("Endereço da ligação inválido: tem de começar por http:// ou https://"); return; }
      const N={...E,contaTempo:conta,links:lks,comp,meinho:mh,nome,formato:q("#xe-fo").value,espaco:{...E.espaco,txt:q("#xe-es").value},parte,momento:mom,sub,tipo,
        duracao:{series:d.series,pratica:d.pratica,pausa:d.pausa,total:d.total||null},
        objetivos:q("#xe-ob").value,objEsp:q("#xe-oe").value,comportamentos:q("#xe-co").value,condicionantes:q("#xe-cd").value,descricao:q("#xe-de").value,variantes:q("#xe-va").value,material:q("#xe-ma").value,
        ligacoes:{modelo:[...s.querySelectorAll("#xe-lg input[data-m]:checked")].map(i=>i.dataset.m),lances:[...s.querySelectorAll("#xe-lg input[data-l]:checked")].map(i=>i.dataset.l)}};
      if(!E0){ N.criadoPor=meuId||""; N.criadoEm=new Date().toISOString(); }
      fecha(); const R=guardaEx(N,true); xCur=R.id; renderEx();
      if(E0) toast("Exercício guardado",()=>{ guardaEx(E0,true); renderEx(); }); else toast("Exercício criado · desenha a figura em ✎ Desenhar figura"); }; }); }

/* ---------- PDF da ficha do exercício (desenho da ficha de UT do clube, A4 ao alto) ---------- */
/* as letras do PDF (helvetica) não têm todos os símbolos */
const pdfTxt=s=>String(s??"").replace(/→/g,"-").replace(/[–—]/g,"-").replace(/…/g,"...").replace(/[‘’]/g,"'").replace(/[“”]/g,'"');
/* imagem que não carrega (sem rede, sem acesso, apagada): o PDF sai na mesma, com uma nota no lugar da figura */
async function figuraJpegEx(E){ if(usaImagem(E)){ const im=E.figura.imagem;
    try{ const r=await fetch(srcImagem(im)); if(!r.ok) throw new Error("imagem"); const bl=await r.blob(); if(!/^image\/jpe?g$/.test(bl.type)) throw new Error("imagem");
      const d=await new Promise((ok,ko)=>{ const fr=new FileReader(); fr.onload=()=>ok(fr.result); fr.onerror=ko; fr.readAsDataURL(bl); }); return {d,w:im.w,h:im.h}; }
    catch(e){ return {falta:true,w:im.w,h:im.h}; } }
  if(!temFigura(E)) return null; await mCarregaImgs(); try{ await document.fonts.ready; await document.fonts.load('700 40px "RC Modelo"'); }catch(e){}
  const cv=document.createElement("canvas"); cv.width=1600; cv.height=900; pintaModeloCanvas(cv.getContext("2d"),figuraQde(E),0,1600,900); return {d:cv.toDataURL("image/jpeg",.9),w:1600,h:900}; }
/* desenha a figura numa caixa do PDF; sem imagem disponível, escreve a nota */
function figuraNoPdf(doc,fig,x,y,w,h){ try{ if(!fig.falta){ doc.addImage(fig.d,"JPEG",x,y,w,h,undefined,"FAST"); return; } }catch(e){}
  doc.setFont("helvetica","italic"); doc.setFontSize(8); doc.setTextColor(110,106,98); doc.text(doc.splitTextToSize("Figura indisponível: a imagem não carregou (sem rede ou sem acesso ao link).",w-16),x+w/2,y+h/2,{align:"center"}); }
/* ficha no PDF com o desenho da UT do clube; k = escala das letras; hMax = altura fixa (o texto que não cabe acaba em "…", como no Excel) */
function fichaExPdf(doc,E,x0,y0,W,o={}){ const k=o.k||1, fim=o.hMax?y0+o.hMax:1e9, RED=[192,0,0], INK=[27,26,23], MUT=[110,106,98], GR=[236,234,228], LN=[200,196,186];
  const T=(txt,x,y,s,op={})=>{ doc.setFont("helvetica",op.b?(op.i?"bolditalic":"bold"):(op.i?"italic":"normal")); doc.setFontSize(s*k); doc.setTextColor(...(op.c||INK)); doc.text(pdfTxt(txt),x,y,op.al?{align:op.al}:undefined); };
  const linhas=(txt,w,s,b)=>{ doc.setFont("helvetica",b?"bold":"normal"); doc.setFontSize(s*k); return doc.splitTextToSize(pdfTxt(txt),w); };
  const P=parteDe(E.parte), D=E.duracao, metade=W/2, xR=x0+metade, pad=6*k, hb=18*k, hc=14*k, rh=15*k;
  doc.setFillColor(...INK); doc.rect(x0,y0,metade,hb,"F"); doc.setFillColor(...RED); doc.rect(xR,y0,metade,hb,"F");
  T(o.num?"EXERCÍCIO "+o.num:"EXERCÍCIO",x0+metade/2,y0+hb*.7,10,{b:1,i:1,c:[255,255,255],al:"center"}); T(P[1].toUpperCase(),xR+metade/2,y0+hb*.7,10,{b:1,c:[255,255,255],al:"center"});
  const y=y0+hb, cab=(txt,x,yy,w)=>{ doc.setFillColor(...GR); doc.rect(x,yy,w,hc,"F"); doc.setDrawColor(...LN); doc.setLineWidth(.5); doc.line(x,yy+hc,x+w,yy+hc); T(txt,x+w/2,yy+hc*.72,7.5,{b:1,c:MUT,al:"center"}); return yy+hc; };
  /* coluna esquerda: espaço + duração, objetivos e condicionantes */
  let yL=y; const wE=metade*.42, wD=metade-wE;
  cab("ESPAÇO",x0,yL,wE); cab("DURAÇÃO",x0+wE,yL,wD); yL+=hc;
  [["TOTAL",fmtTempo(totalEx(E))],["SÉRIES / REPS.",D.series?String(D.series):"-"],["TEMPO PRÁTICA",fmtTempo(D.pratica)],["PAUSA",fmtTempo(D.pausa)]].forEach(([l,v],i)=>{ const yy=yL+i*rh;
    T(l,x0+wE+wD*.62,yy+rh*.7,7,{c:MUT,al:"right"}); T(v.replace("–","-"),x0+wE+wD*.8,yy+rh*.7,9.5,{b:1,al:"center"}); if(i){ doc.setDrawColor(...LN); doc.line(x0+wE,yy,x0+metade,yy); } });
  doc.setDrawColor(...LN); doc.line(x0+wE,yL,x0+wE,yL+4*rh);
  const espL=linhas((E.espaco.txt||"-").toUpperCase(),wE-2*pad,9.5,1); espL.slice(0,3).forEach((l,i)=>T(l,x0+wE/2,yL+2*rh-(Math.min(espL.length,3)-1)*6*k+i*12*k+3*k,9.5,{b:1,al:"center"}));
  yL+=4*rh; yL=cab("OBJETIVOS E CONDICIONANTES",x0,yL,metade)+pad;
  /* escreve linhas numa coluna até ao fim do bloco; a última que não cabe vira "…" */
  const coluna=(xc,ref)=>(txt,op={})=>{ const s=op.s||8.5, lh=(s+2.5)*k; for(const l of linhas(txt,metade-2*pad-(op.ind||0)*k,s,op.b)){ if(ref.cheio) return;
      if(ref.y+lh>fim-pad*.5){ ref.cheio=true; T("…",xc+pad,Math.min(ref.y+lh,fim-2),s,{b:1,c:MUT}); return; } ref.y+=lh; T(l,xc+pad+(op.ind||0)*k,ref.y,s,op); } };
  const L={y:yL}, bloco=coluna(x0,L);
  bloco(E.nome+(E.formato&&!E.nome.includes(E.formato)?" - "+E.formato:""),{b:1,s:10,c:RED});
  if(E.objetivos){ L.y+=2*k; bloco(E.objetivos); }
  if(E.objEsp.length&&!o.semEsp){ L.y+=3*k; bloco("Objetivos específicos:",{b:1}); E.objEsp.forEach(c=>bloco("• "+c.replace(/^[-•]\s*/,""),{ind:4})); }
  if(E.comportamentos.length){ L.y+=3*k; bloco("Comportamentos-chave:",{b:1}); E.comportamentos.forEach(c=>bloco("• "+c,{ind:4})); }
  if(E.condicionantes.length){ L.y+=3*k; bloco("Condicionantes:",{b:1}); E.condicionantes.forEach(c=>bloco("• "+c,{ind:4})); }
  /* coluna direita: descrição e variantes */
  const R={y:cab("DESCRIÇÃO",xR,y,metade)+pad}, blocoR=coluna(xR,R);
  if(E.descricao) String(E.descricao).split(/\n/).forEach(p=>blocoR(p||" ")); else blocoR("Sem descrição.",{c:MUT});
  if(!R.cheio&&R.y+hc+pad<fim){ R.y+=pad+2*k; R.y=cab("VARIANTES DO EXERCÍCIO",xR,R.y,metade)+pad;
    if(E.variantes.length) E.variantes.forEach((v,i)=>blocoR(`${i+1}) ${v}`)); else blocoR("Sem variantes.",{c:MUT}); }
  const yF=o.hMax?fim:Math.max(L.y,R.y)+pad+2*k;
  doc.setDrawColor(...INK); doc.setLineWidth(.9); doc.rect(x0,y0,W,yF-y0); doc.setDrawColor(...LN); doc.setLineWidth(.5); doc.line(xR,y,xR,yF);
  return yF; }
async function pdfExercicio(E){
  if(!window.jspdf) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const doc=new window.jspdf.jsPDF({unit:"pt",format:"a4"}), PW=595.28, PH=841.89, M=28, W=PW-2*M, RED=[192,0,0], INK=[27,26,23], MUT=[110,106,98], GR=[236,234,228], LN=[200,196,186];
  const T=(txt,x,y,o={})=>{ doc.setFont("helvetica",o.b?(o.i?"bolditalic":"bold"):(o.i?"italic":"normal")); doc.setFontSize(o.s||9); doc.setTextColor(...(o.c||INK)); doc.text(pdfTxt(txt),x,y,o.al?{align:o.al}:undefined); };
  const linhas=(txt,w,s)=>{ doc.setFont("helvetica","normal"); doc.setFontSize(s); return doc.splitTextToSize(pdfTxt(txt),w); };
  /* cabeçalho do clube */
  doc.setFillColor(...RED); doc.rect(0,0,PW,58,"F");
  /* emblema monocromático (branco com transparência) para o cabeçalho vermelho */
  if(IMG_DATA["slides/logo-pdf.png"]) try{ doc.addImage(IMG_DATA["slides/logo-pdf.png"],"PNG",M,6,52,46); }catch(e){}
  T("SPORT CLUB ANGRENSE",M+56,26,{b:1,s:14,c:[255,255,255]}); T("Ficha de exercício · Repositório para as Unidades de Treino",M+56,42,{s:9,c:[255,225,225]});
  T("COMPROMISSO | RESILIÊNCIA | UNIÃO | ATITUDE | PAIXÃO | ALEGRIA",PW-M,26,{b:1,i:1,s:7,c:[255,225,225],al:"right"});
  let y=fichaExPdf(doc,E,M,74,W,{num:E.n?"· Nº "+E.n:""})+10;
  /* classificação e material numa linha */
  const cls=[E.momento&&("Categoria: "+catEx(E)),rotuloDe(TIPOS_EX,E.tipo)&&("Formato: "+rotuloDe(TIPOS_EX,E.tipo)),E.material.length&&("Material: "+E.material.join(", "))].filter(Boolean).join("   |   ");
  if(cls){ linhas(cls,W,8).forEach(l=>{ y+=10; T(l,M,y,{s:8,c:MUT}); }); y+=6; }
  /* figura */
  const fig=await figuraJpegEx(E);
  if(fig){ let w=W, h=W*fig.h/fig.w; const livre=PH-40-y; if(h>livre){ if(livre>=220){ h=livre; w=h*fig.w/fig.h; } else { doc.addPage(); y=M; if(h>PH-40-y){ h=PH-40-y; w=h*fig.w/fig.h; } } }
    doc.setDrawColor(...LN); doc.rect(M+(W-w)/2,y,w,h); figuraNoPdf(doc,fig,M+(W-w)/2,y,w,h); }
  const np=doc.getNumberOfPages(); for(let i=1;i<=np;i++){ doc.setPage(i); T(`SC Angrense · Ficha de exercício · ${E.nome} · ${new Date().toLocaleDateString("pt-PT")}${np>1?` · ${i}/${np}`:""}`,PW/2,PH-18,{s:7.5,c:MUT,al:"center"}); }
  return doc; }
async function guardaPdfEx(id,botao){ const E=exercicios[id]; if(!E) return; if(botao) botao.disabled=true; toast("A gerar o PDF do exercício…");
  try{ const doc=await pdfExercicio(E), buf=doc.output("arraybuffer"), nomeF=`SCA_Exercicio_${E.nome.replace(/[^\wÀ-ÿ-]+/g,"_")}.pdf`;
    let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
    if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([buf],{type:"application/pdf"})); a.download=nomeF; document.body.appendChild(a); a.click(); a.remove(); }
    else { await dl.save({filename:nomeF,data:new Uint8Array(buf)}); toast("PDF do exercício guardado"); } }
  catch(e){ if(e?.code!=="declined") toast(e?.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet.":"Não foi possível gerar o PDF ("+(e?.code||e?.message||"erro")+")"); }
  finally{ if(botao) botao.disabled=false; } }

/* ---------- sincronização ---------- */
function ligaExDb(){ if(!db) return; db.collection("exercicios").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
    q.docs.forEach(d=>{ const x=lerDoc(d); if(x){ const c={...x}; delete c.atualizadoEm; try{ m[d.id]=normEx({...c,id:d.id}); }catch(e){} } });
    mergeCol("exercicios/",m,exercicios); if(JSON.stringify(m)!==JSON.stringify(exercicios)){ exercicios=m; guardaExLocal();
      if(!$("sheet-root").innerHTML&&!(xPl&&xPl.playing)) renderEx(); if(mFig) renderModeloSeguro(); } },()=>{}); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaExDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();
