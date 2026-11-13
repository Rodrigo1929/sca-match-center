/* ---------- Vídeos do Pós-jogo (v115, V1: parar e desenhar) ----------
   videos/{id} = { id, jogo: "atual" | <id do jogo arquivado>, titulo, desc, js: [nº], temT, parte, seg,
     fonte: {nome, tam, dur, w, h} (o clip original, que fica no computador),
     pausas: [{id, t (segundos do clip), dur (segundos parado; 0 = não para), pecas, cal, escuro, ate, mov}] (desenhos com as peças do editor de imagens),
       v117 (V2): depois da paragem as peças andam com os jogadores até «ate»; mov = {pk da peça | "cal": [[t, geometria], …]} (pontos-chave, movimento linear entre eles),
     saida: {id, tam, dur, w, h, em, chave} | null (vídeo final MP4 no armazenamento do link), criadoPor, criadoEm, alteradoPor, alteradoEm }
   Decidido pelo Rodrigo (13/11/2026): edita-se no computador (o iPad vê); o clip original fica no PC (o armazenamento do link aceita
   até 20 MiB por ficheiro) e só o vídeo final fica na app; o vídeo final leva o som do clip, em silêncio nas paragens. */
const VD_LS="sca-videos-v1", VD_MAX=20*1024*1024, VD_FPS=25, VD_MUXER="https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.js";
let videos={}; try{ videos=JSON.parse(localStorage.getItem(VD_LS)||"{}")||{}; }catch(e){ videos={}; }
const VD_GEO=["x","y","x1","y1","x2","y2","qx","qy","rx","ry","a","b","m","pts"];   // o que muda de um ponto-chave para outro (o resto é da peça)
function normMovVd(m){ const o={}, n=v=>imNum(v,0,-100,100); if(!m||typeof m!=="object") return o;
  Object.keys(m).slice(0,301).forEach(k=>{ if(!/^[\w-]{1,24}$/.test(k)||!Array.isArray(m[k])) return;
    const tr=m[k].filter(e=>Array.isArray(e)&&e[1]&&typeof e[1]==="object").map(([t,g])=>{ const G={};
      VD_GEO.forEach(c=>{ if(c==="pts"){ if(Array.isArray(g.pts)) G.pts=g.pts.slice(0,600).map(q=>[n(q&&q[0]),n(q&&q[1])]); } else if(g[c]!=null&&isFinite(+g[c])) G[c]=n(g[c]); });
      return [imNum(t,0,0,36000),G]; }).sort((a,b)=>a[0]-b[0]).slice(0,200);
    if(tr.length) o[k]=tr; }); return o; }
function normPausaVd(p){ p=p||{}; const t=imNum(p.t,0,0,36000); return {id:/^[\w-]{4,40}$/.test(String(p.id||""))?String(p.id):uId("pz"),t,dur:imNum(p.dur,3,0,30),
  pecas:(Array.isArray(p.pecas)?p.pecas:[]).map(normPecaIm).filter(Boolean).slice(0,300),cal:normCalIm(p.cal),escuro:imNum(p.escuro,0,0,.8),ate:imNum(p.ate,t,t,36000),mov:normMovVd(p.mov),
  cam:(Array.isArray(p.cam)?p.cam:[]).filter(e=>Array.isArray(e)&&isFinite(+e[0])).map(e=>[imNum(e[0],t,t,36000),imNum(e[1],0,-3,3),imNum(e[2],0,-3,3)]).sort((a,b)=>a[0]-b[0]).slice(0,1500),...(p.semCam?{semCam:true}:{})}; }
function normVideo(d){ const s=v=>String(v??"").trim(), F=d.fonte||{}, S=d.saida;
  return {id:s(d.id)||uId("vd"),jogo:s(d.jogo)||"atual",titulo:s(d.titulo).slice(0,120),desc:String(d.desc??"").slice(0,2000),
    js:[...new Set((Array.isArray(d.js)?d.js:[]).map(s).filter(Boolean))].slice(0,22),temT:!!d.temT,parte:d.parte===2||d.parte==="2"?2:1,seg:Math.max(0,Math.round(+d.seg)||0),
    fonte:{nome:s(F.nome).slice(0,200),tam:Math.max(0,Math.round(+F.tam)||0),dur:imNum(F.dur,0,0,36000),w:Math.round(+F.w)||1280,h:Math.round(+F.h)||720},
    pausas:(Array.isArray(d.pausas)?d.pausas:[]).map(normPausaVd).sort((a,b)=>a.t-b.t).slice(0,60),
    saida:S&&/^[\w-]{8,64}$/.test(s(S.id))?{id:s(S.id),tam:Math.max(0,Math.round(+S.tam)||0),dur:imNum(S.dur,0,0,36000),w:Math.round(+S.w)||1280,h:Math.round(+S.h)||720,em:s(S.em),chave:s(S.chave)}:null,
    criadoPor:s(d.criadoPor),criadoEm:s(d.criadoEm),alteradoPor:s(d.alteradoPor),alteradoEm:s(d.alteradoEm)}; }
Object.keys(videos).forEach(id=>{ try{ videos[id]=normVideo({...videos[id],id}); }catch(e){ delete videos[id]; } });
const guardaVideosLocal=()=>{ try{ localStorage.setItem(VD_LS,JSON.stringify(videos)); }catch(e){} };
function gravaVideo(V){ const N=normVideo({...V,alteradoPor:meuId||V.alteradoPor||"",alteradoEm:new Date().toISOString()}); videos[N.id]=N; guardaVideosLocal(); gravaDoc("videos/"+N.id,N); return N; }
function apagaVideo(id){ if(!videos[id]) return; delete videos[id]; guardaVideosLocal(); apagaDoc("videos/"+id); }
const videosDe=jg=>Object.values(videos).filter(V=>V.jogo===jg).sort((a,b)=>(a.temT?0:1)-(b.temT?0:1)||a.parte-b.parte||a.seg-b.seg||a.criadoEm.localeCompare(b.criadoEm));
function arquivaVideos(id){ Object.values(videos).filter(V=>V.jogo==="atual").forEach(V=>gravaVideo({...V,jogo:id})); }
function repoeVideos(B){ if(!B.videos) return; Object.keys(videos).forEach(id=>{ if(!B.videos[id]) apagaDoc("videos/"+id); }); videos={};
  Object.entries(B.videos).forEach(([id,x])=>{ try{ videos[id]=normVideo({...x,id}); gravaDoc("videos/"+id,videos[id]); }catch(e){} }); guardaVideosLocal(); }
function ligaVideosDb(){ if(!db) return; db.collection("videos").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
  q.docs.forEach(d=>{ const x=lerDoc(d); if(x){ delete x.atualizadoEm; try{ m[d.id]=normVideo({...x,id:d.id}); }catch(e){} } });
  mergeCol("videos/",m,videos); if(JSON.stringify(m)!==JSON.stringify(videos)){ videos=m; guardaVideosLocal(); if(!vdEd&&!$("view-a").hidden&&anVista==="vid") renderVideos(); } },()=>{}); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaVideosDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();

/* «impressão digital» das paragens: o vídeo final fica desatualizado se mudarem depois de gravado */
const vdChave=V=>{ const s=JSON.stringify(V.pausas.map(p=>{ const a=[p.t,p.dur,p.pecas,p.cal,p.escuro]; return p.ate>p.t?[...a,p.ate,p.mov,p.semCam?0:p.cam]:a; }),(k,v)=>k==="pk"?undefined:v); let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return String(h>>>0); };
const vdT=t=>{ t=Math.max(0,+t||0); const m=Math.floor(t/60), s=t-m*60; return `${m}:${s<10?"0":""}${s.toFixed(1)}`; };
const vdDurTot=V=>V.fonte.dur+V.pausas.reduce((a,p)=>a+p.dur,0);
/* ---------- V2: peças que andam (pontos-chave) ---------- */
const vdGeo=P=>{ const g={}; VD_GEO.forEach(c=>{ if(P[c]!=null) g[c]=clone(P[c]); }); return g; };
/* geometria no tempo t: antes do 1.º ponto-chave fica no 1.º, depois do último fica no último; entre dois, em linha reta
   shortcut: movimento linear (com pontos-chave a cada ~0,5 s chega); curvas suaves se o Rodrigo achar o movimento aos solavancos */
function vdGeoEm(tr,t){ if(!tr||!tr.length) return null; if(t<=tr[0][0]) return tr[0][1]; const n=tr.length-1; if(t>=tr[n][0]) return tr[n][1];
  let i=1; while(tr[i][0]<t) i++; const [ta,a]=tr[i-1], [tb,b]=tr[i], u=(t-ta)/((tb-ta)||1), o={};
  for(const c in b){ const x=a[c], y=b[c]; o[c]=Array.isArray(y)?(Array.isArray(x)&&x.length===y.length?y.map((q,j)=>[x[j][0]+(q[0]-x[j][0])*u,x[j][1]+(q[1]-x[j][1])*u]):x??y):x!=null?x+(y-x)*u:y; }
  return o; }
function vdPoeKey(tr,t,g){ for(let i=tr.length-1;i>=0;i--) if(Math.abs(tr[i][0]-t)<.02) tr.splice(i,1); tr.push([t,clone(g)]); tr.sort((a,b)=>a[0]-b[0]); if(tr.length>200) tr.splice(1,1); }
const vdPecasEm=(p,t)=>p.pecas.map(P=>{ const g=P.pk&&vdGeoEm(p.mov[P.pk],t); return g?normPecaIm({...P,...g}):P; }).filter(Boolean);
const vdCalEm=(p,t)=>{ const g=vdGeoEm(p.mov.cal,t); return p.cal&&g&&g.pts?{...p.cal,pts:clone(g.pts)}:p.cal; };
/* até onde as peças de uma paragem podem andar (a paragem seguinte ou o fim do clip) e até onde andam */
/* v120: as peças que andam já não param na paragem seguinte (pedido do Rodrigo): continuam por cima dela, no máximo até ao fim do clip */
const vdLimSeg=V=>V.fonte.dur;
const vdFimSeg=(V,p)=>Math.min(p.ate,V.fonte.dur);
/* paragens com peças a andar no momento t (podem ser várias ao mesmo tempo), menos «fora» */
const vdAndamEm=(V,t,fora)=>V.pausas.filter(p=>p!==fora&&p.ate>p.t+.02&&p.pecas.length&&p.t<=t+.001&&t<vdFimSeg(V,p));
/* gravar o desenho feito no momento t: o que mudou de sítio nesse momento vira ponto-chave; cor, tamanho… valem para todo o movimento */
const vdIgual=(a,b)=>typeof a==="number"&&typeof b==="number"?Math.abs(a-b)<1e-6:Array.isArray(a)&&Array.isArray(b)?a.length===b.length&&a.every((x,i)=>vdIgual(x,b[i]))
  :a&&b&&typeof a==="object"&&typeof b==="object"?Object.keys(a).join()===Object.keys(b).join()&&Object.keys(a).every(k=>vdIgual(a[k],b[k])):a===b;
function vdGravaPecas(P,J,t,E){ const noIni=Math.abs(t-P.t)<.02, mov=P.mov, ant={}, vistos=new Set(); P.pecas.forEach(x=>{ if(x.pk) ant[x.pk]=x; });
  P.pecas=J.pecas.map((N0,i)=>{ const N=normPecaIm(N0); if(!N) return null;
    if(!N.pk||vistos.has(N.pk)){ N.pk=uId("pk"); if(E&&E.pecas[i]) E.pecas[i].pk=N.pk; } vistos.add(N.pk);
    const A=ant[N.pk], g=vdGeo(N); if(!A){ if(!noIni) mov[N.pk]=[[t,g]]; return N; }
    const gA=vdGeo(A); if(Object.keys(g).join()!==Object.keys(gA).join()){ delete mov[N.pk]; return N; }   // mudou de forma (ex.: elipse ↔ polígono): recomeça parada
    if(vdIgual(g,vdGeoEm(mov[N.pk],t)||gA)) return {...N,...gA};
    if(mov[N.pk]){ vdPoeKey(mov[N.pk],t,g); return {...N,...gA}; }
    if(noIni) return N;
    mov[N.pk]=[[P.t,gA],[t,g]]; return {...N,...gA}; }).filter(Boolean);
  const vivas=new Set(P.pecas.map(x=>x.pk)); Object.keys(mov).forEach(k=>{ if(k!=="cal"&&!vivas.has(k)) delete mov[k]; });
  /* o campo (perspetiva) também pode andar, quando a câmara mexe */
  const C=normCalIm(J.cal);
  if(!C||!P.cal){ P.cal=C; delete mov.cal; }
  else { const ag=vdGeoEm(mov.cal,t)||{pts:P.cal.pts}; P.cal={...P.cal,ref:C.ref,rod:C.rod};
    if(!vdIgual(C.pts,ag.pts)){ if(mov.cal) vdPoeKey(mov.cal,t,{pts:C.pts}); else if(noIni) P.cal=C; else mov.cal=[[P.t,{pts:clone(P.cal.pts)}],[t,{pts:C.pts}]]; } }
  P.escuro=imNum(J.escuro,0,0,.8);
  const ult=Math.max(P.t,...Object.values(mov).map(tr=>tr[tr.length-1][0])); if(ult>P.ate) P.ate=ult; }
/* clips abertos nesta sessão (ficam no computador; nunca vão para a app) */
const vdFich={};
function vdEscolheFich(cb){ const i=document.createElement("input"); i.type="file"; i.accept="video/mp4,video/*"; i.onchange=()=>{ const f=i.files[0]; if(f) cb(f); }; i.click(); }
function vdMeta(f){ return new Promise((ok,ko)=>{ const v=document.createElement("video"), u=URL.createObjectURL(f); v.preload="metadata"; v.muted=true;
  v.onloadedmetadata=()=>{ const r={dur:v.duration,w:v.videoWidth,h:v.videoHeight}; URL.revokeObjectURL(u); isFinite(r.dur)&&r.w?ok(r):ko(new Error("video")); }; v.onerror=()=>{ URL.revokeObjectURL(u); ko(new Error("video")); }; v.src=u; }); }
async function novoVideo(f){ if(!f||!/^video\//.test(f.type||"")&&!/\.(mp4|m4v|mov)$/i.test(f.name||"")){ toast("Escolhe um vídeo (MP4)."); return; }
  try{ const m=await vdMeta(f); const V=gravaVideo({id:uId("vd"),jogo:vdJogo,titulo:String(f.name||"").replace(/\.[^.]+$/,"").slice(0,120),fonte:{nome:f.name,tam:f.size,dur:m.dur,w:m.w,h:m.h},pausas:[],criadoPor:meuId||"",criadoEm:new Date().toISOString()});
    vdFich[V.id]=f; abreEditorVideo(V.id); }
  catch(e){ toast("Não consegui abrir esse vídeo. Usa um MP4 (H.264), no Chrome ou no Edge."); } }

/* ---------- lista (Pós-jogo › Vídeos) ---------- */
let vdJogo="atual";
function renderVideos(){ const box=$("a-videos"); if(!box) return; const js=Object.entries(hist).sort(([,a],[,b])=>String(b.data||"").localeCompare(String(a.data||"")));
  if(vdJogo!=="atual"&&!hist[vdJogo]) vdJogo="atual"; const L=videosDe(vdJogo);
  box.innerHTML=`<div class="an-top" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <select id="vd-jogo" aria-label="Jogo" style="min-height:40px;flex:1 1 260px;width:auto;max-width:100%"><option value="atual">Jogo atual${jogo.adversario?" · vs "+esc(jogo.adversario):""}</option>${js.map(([k,J])=>`<option value="${esc(k)}">Arquivo · vs ${esc(J.adversario||"(sem adversário)")} · ${esc(dataPt(J.data))}</option>`).join("")}</select>
      <label class="btn primary" style="cursor:pointer">+ Novo vídeo<input type="file" id="vd-file" accept="video/mp4,video/*" hidden></label></div>
    <p class="sub" style="margin:6px 0 10px">Edita-se <b>no computador</b>: abre um clip MP4 do lance, para nos momentos certos e desenha. O clip fica no computador; na app ficam as paragens com os desenhos e o <b>vídeo final</b> (com som), que se vê também no iPad.</p>
    <div class="imgrid" id="vd-grid">${L.length?L.map(V=>{ const S=V.saida, velho=S&&S.chave!==vdChave(V);
      return `<div class="imcard" data-id="${esc(V.id)}"><button class="imth vdth" data-a="${S?"ver":"ed"}" aria-label="${S?"Ver vídeo":"Editar vídeo"}">${S?`<video src="${esc(srcImagem(S))}#t=0.5" preload="metadata" muted playsinline></video><span class="vdplay">▶</span>`:`<span class="vdsem">🎬<small>Sem vídeo final</small></span>`}</button>
        <div class="imtx"><b>${V.temT?`<span class="imt">${esc(V.parte)}.ª · ${esc(minutoReg(V))}</span> `:""}${esc(V.titulo||"Sem título")}</b>
        <small>${V.pausas.length} ${V.pausas.length===1?"paragem":"paragens"} · clip ${esc(vdT(V.fonte.dur))}${S?` · vídeo final ${esc(vdT(S.dur))}`:""}</small>
        ${velho?`<small class="vdvelho">⚠ Mudou depois de gravado: grava de novo o vídeo final.</small>`:""}
        <div class="actions" style="justify-content:flex-start;margin-top:6px">${S?`<button class="btn sm" data-a="ver">▶ Ver</button><button class="btn sm" data-a="mp4">⬇ MP4</button>`:""}<button class="btn sm" data-a="ed">✎ Editar</button><button class="btn sm ghost danger" data-a="del">🗑</button></div></div></div>`; }).join("")
      :`<p class="sub" style="padding:24px;text-align:center">Ainda não há vídeos deste jogo.</p>`}</div>`;
  const sel=$("vd-jogo"); sel.value=vdJogo; sel.onchange=()=>{ vdJogo=sel.value; renderVideos(); };
  $("vd-file").onchange=e=>{ const f=e.target.files[0]; e.target.value=""; if(f) novoVideo(f); };
  const g=$("vd-grid"); g.ondragover=e=>{ e.preventDefault(); g.classList.add("sobre"); }; g.ondragleave=()=>g.classList.remove("sobre");
  g.ondrop=e=>{ e.preventDefault(); g.classList.remove("sobre"); const f=[...(e.dataTransfer.files||[])].find(x=>/^video\//.test(x.type)); if(f) novoVideo(f); };
  g.querySelectorAll(".imcard").forEach(c=>{ const id=c.dataset.id; c.querySelectorAll("[data-a]").forEach(b=>{ const a=b.dataset.a;
    if(a==="ed") b.onclick=()=>abreEditorVideo(id);
    else if(a==="ver") b.onclick=()=>vdVer(videos[id]);
    else if(a==="mp4") b.onclick=()=>vdDescarrega(videos[id],b);
    /* shortcut: apagar o vídeo não apaga o MP4 do armazenamento (fica para o Desfazer); limpar à mão se o espaço apertar */
    else if(a==="del") confirma2(b,"Apagar?",()=>{ const antes=clone(videos[id]); apagaVideo(id); renderVideos(); toast("Vídeo apagado",()=>{ gravaVideo(antes); renderVideos(); }); }); }); }); }
const nomeFichVd=V=>`SCA_${(V.titulo||"video").replace(/[^\wÀ-ÿ-]+/g,"_").slice(0,40)}.mp4`;
async function vdDescarrega(V,bt){ if(!V||!V.saida) return; if(bt) bt.disabled=true;
  try{ const b=await (await fetch(srcImagem(V.saida))).blob(); await guardaFicheiro(nomeFichVd(V),b,"video/mp4"); toast("Vídeo guardado"); }
  catch(e){ if(e?.code!=="declined") toast("Não foi possível descarregar o vídeo ("+(e?.code||e?.message||"erro")+")"); } finally{ if(bt) bt.disabled=false; } }
function vdVer(V){ if(!V||!V.saida) return; let r=$("vdver-root"); if(!r){ r=document.createElement("div"); r.id="vdver-root"; document.body.appendChild(r); }
  r.innerHTML=`<div class="vdver" role="dialog" aria-label="Vídeo"><div class="imed-top"><b class="imed-tit">${esc(V.titulo||"Vídeo")}</b><span class="sp"></span><button class="btn sm primary" id="vv-x">✕ Fechar</button></div><video src="${esc(srcImagem(V.saida))}" controls autoplay playsinline></video></div>`;
  const fecha=()=>{ r.innerHTML=""; document.removeEventListener("keydown",esc_); }, esc_=e=>{ if(e.key==="Escape") fecha(); };
  $("vv-x").onclick=fecha; document.addEventListener("keydown",esc_); }

/* ---------- editor (computador) ---------- */
let vdEd=null;   // {V, v (elemento vídeo), url, tocar, desde, congelada, tCong, tSave}
function abreEditorVideo(id){ const V0=videos[id]; if(!V0) return; const f=vdFich[id];
  if(!f){ toast(`Escolhe o clip «${V0.fonte.nome||"do vídeo"}» no computador.`); vdEscolheFich(async g=>{
      try{ const m=await vdMeta(g); if(g.size!==V0.fonte.tam&&Math.abs(m.dur-V0.fonte.dur)>.5) toast("Atenção: este clip não parece o mesmo (tamanho e duração diferentes)."); vdFich[id]=g; abreEditorVideo(id); }
      catch(e){ toast("Não consegui abrir esse vídeo."); } }); return; }
  vdEd={V:clone(V0),url:URL.createObjectURL(f),tocar:false,desde:0,congelada:null,tCong:null,tSave:null};
  let r=$("vded-root"); if(!r){ r=document.createElement("div"); r.id="vded-root"; document.body.appendChild(r); }
  const V=vdEd.V;
  r.innerHTML=`<div class="imed vded" role="dialog" aria-label="Editor de vídeo">
    <div class="imed-top"><b class="imed-tit"></b><span class="sp"></span><button class="btn sm" id="vd-grav">⬇ Gravar vídeo final</button><button class="btn sm primary" id="vd-ok">✓ Concluir</button></div>
    <div class="imed-corpo"><div class="vd-esq"><div class="imed-palco vd-palco"><video id="vd-v" playsinline preload="auto"></video><svg id="vd-ov" class="vd-ov" viewBox="0 0 ${V.fonte.w} ${V.fonte.h}" preserveAspectRatio="xMidYMid meet"></svg></div>
      <div class="vd-linha"><div id="vd-marcas" class="vd-marcas"></div><input type="range" id="vd-pos" min="0" max="${V.fonte.dur}" step="0.01" value="0" aria-label="Posição no clip"></div>
      <div class="vd-ctl"><button class="btn" id="vd-play" aria-label="Tocar">▶</button><button class="btn sm" id="vd-m1" title="Imagem anterior (←)">◀ 1</button><button class="btn sm" id="vd-p1" title="Imagem seguinte (→)">1 ▶</button><span id="vd-t" class="vd-t"></span><span class="sp"></span><button class="btn primary" id="vd-add">⏸ Parar aqui e desenhar</button></div></div>
      <div class="imed-lado"><h4>Paragens</h4><div id="vd-pz"></div><div id="vd-ficha"></div></div></div></div>`;
  const v=vdEd.v=$("vd-v"); v.src=vdEd.url; v.muted=false;
  v.addEventListener("timeupdate",vdCtl); v.addEventListener("seeked",()=>{ vdCtl(); vdDesenhaOv(); }); v.addEventListener("ended",()=>{ vdEd&&(vdEd.tocar=false); vdCtl(); });
  v.addEventListener("loadeddata",()=>{ vdCtl(); vdDesenhaOv(); });
  $("vd-play").onclick=vdPlay; $("vd-m1").onclick=()=>vdPasso(-1); $("vd-p1").onclick=()=>vdPasso(1); $("vd-add").onclick=vdNovaPausa;
  /* barra: arrastar para trás e para a frente (v119.1: antes, parar o vídeo repunha a barra no sítio antigo antes de ler o novo e a barra não mexia) */
  const pos=$("vd-pos"); pos.oninput=()=>{ const t=+pos.value; vdEd.arr=true; if(vdEd.tocar||vdEd.congelada) vdPara(); vdBusca(t); };
  pos.onchange=()=>{ vdEd.arr=false; vdBusca(+pos.value); }; pos.addEventListener("pointerup",()=>{ if(vdEd) vdEd.arr=false; });
  v.addEventListener("seeked",()=>{ if(vdEd&&vdEd.pend!=null){ const t=vdEd.pend; vdEd.pend=null; v.currentTime=t; } });
  $("vd-grav").onclick=vdExporta; $("vd-ok").onclick=fechaEditorVideo;
  document.addEventListener("keydown",vdTecla); vdTitulo(); vdPainel(); vdFicha(); vdCtl(); }
function fechaEditorVideo(){ if(!vdEd) return; vdPara(); vdGravaJa(); document.removeEventListener("keydown",vdTecla); const r=$("vded-root"); if(r) r.innerHTML=""; URL.revokeObjectURL(vdEd.url); vdEd=null; renderVideos(); }
function vdTecla(e){ if(!vdEd||imEd||$("vd-prog")||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||"")) return;
  if(e.key===" "){ e.preventDefault(); vdPlay(); } else if(e.key==="ArrowLeft"){ e.preventDefault(); vdPasso(-1); } else if(e.key==="ArrowRight"){ e.preventDefault(); vdPasso(1); } }
function vdGrava(){ clearTimeout(vdEd.tSave); vdEd.tSave=setTimeout(vdGravaJa,600); }
function vdGravaJa(){ if(!vdEd) return; clearTimeout(vdEd.tSave); const N=gravaVideo(vdEd.V); vdEd.V.alteradoEm=N.alteradoEm; vdEd.V.alteradoPor=N.alteradoPor; }
const vdTitulo=()=>{ const t=document.querySelector(".vded .imed-tit"); if(t) t.textContent="Vídeo · "+(vdEd.V.titulo||"sem título"); };
const vdPausaEm=t=>vdEd.V.pausas.find(p=>Math.abs(p.t-t)<.06);
/* procurar sem encher a fila: enquanto o vídeo está a procurar, guarda só o último sítio pedido */
function vdBusca(t){ const v=vdEd.v; if(v.seeking) vdEd.pend=t; else v.currentTime=t; }
function vdCtl(){ if(!vdEd) return; const v=vdEd.v, V=vdEd.V; $("vd-t").textContent=`${vdT(v.currentTime)} / ${vdT(V.fonte.dur)}`; if(!vdEd.arr) $("vd-pos").value=v.currentTime;
  $("vd-play").textContent=vdEd.tocar?"⏸":"▶"; $("vd-play").setAttribute("aria-label",vdEd.tocar?"Parar":"Tocar");
  const d=V.fonte.dur||1; $("vd-marcas").innerHTML=V.pausas.map(p=>`<button class="vd-marca${vdEd.congelada===p||(!vdEd.tocar&&vdPausaEm(v.currentTime)===p)?" on":""}" data-id="${esc(p.id)}" style="left:${(p.t/d*100).toFixed(3)}%" title="Paragem ${vdT(p.t)} · ${p.dur} s" aria-label="Ir para a paragem ${vdT(p.t)}"></button>`).join("");
  $("vd-marcas").querySelectorAll("button").forEach(b=>b.onclick=()=>{ vdPara(); const p=V.pausas.find(x=>x.id===b.dataset.id); if(p) v.currentTime=p.t; }); }
/* camada do desenho por cima do vídeo: na paragem em que o vídeo está parado, ou na que está a ser mostrada ao tocar */
/* ---------- v118: a câmara mexe (tripé que roda para os lados) ----------
   As peças e o campo guardam-se como estão na imagem do momento da paragem; em cada momento somam o quanto a imagem andou desde aí
   (cam = [[t, dx, dy]] em frações da imagem, medido de 0,1 em 0,1 s). Assim o que está desenhado na relva fica na relva quando a câmara roda,
   e os pontos-chave só servem para o movimento dos jogadores.
   shortcut: só deslocamento (rodar para os lados / para cima); zoom e rodar muito (perspetiva a mudar) não se medem — ajustar o 📐 Campo nesses casos */
const VD_CW=320, VD_CH=180;
function vdCamEm(p,t){ const C=p.cam; if(p.semCam||!C||!C.length) return [0,0]; if(t<=C[0][0]) return [C[0][1],C[0][2]]; const n=C.length-1; if(t>=C[n][0]) return [C[n][1],C[n][2]];
  let i=1; while(C[i][0]<t) i++; const a=C[i-1], b=C[i], u=(t-a[0])/((b[0]-a[0])||1); return [a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u]; }
const vdMexe=(g,dx,dy)=>{ const o={...g}; for(const c of ["x","x1","x2","qx"]) if(o[c]!=null) o[c]+=dx; for(const c of ["y","y1","y2","qy"]) if(o[c]!=null) o[c]+=dy;
  if(o.pts) o.pts=o.pts.map(q=>[q[0]+dx,q[1]+dy]); return o; };
const vdPecasVer=(p,t)=>{ const [dx,dy]=vdCamEm(p,t); return vdPecasEm(p,t).map(P=>dx||dy?normPecaIm(vdMexe(P,dx,dy)):P).filter(Boolean); };
const vdCalVer=(p,t)=>{ const c=vdCalEm(p,t), [dx,dy]=vdCamEm(p,t); return c&&(dx||dy)?{...c,pts:c.pts.map(q=>[q[0]+dx,q[1]+dy])}:c; };
/* imagem pequena só com as bordas (linhas, publicidade, bancada): o que serve para ver quanto a câmara rodou */
function vdBordas(v){ const c=vdBordas.c||(vdBordas.c=document.createElement("canvas")); c.width=VD_CW; c.height=VD_CH; const x=c.getContext("2d",{willReadFrequently:true}); x.drawImage(v,0,0,VD_CW,VD_CH);
  const d=x.getImageData(0,0,VD_CW,VD_CH).data, n=VD_CW*VD_CH, L=new Float32Array(n), g=new Float32Array(n);
  for(let i=0,j=0;i<n;i++,j+=4) L[i]=d[j]*.3+d[j+1]*.59+d[j+2]*.11;
  for(let y=1;y<VD_CH-1;y++) for(let k=1;k<VD_CW-1;k++){ const i=y*VD_CW+k; g[i]=Math.abs(L[i+1]-L[i-1])+Math.abs(L[i+VD_CW]-L[i-VD_CW]); }
  return g; }
/* deslocamento s (px da imagem pequena) com C(x) ≈ R(x − s), procurado à volta de (px, py); sem a faixa de cima (marcador e logótipos da transmissão) */
function vdCasa(R,C,px,py){ const W=VD_CW, H=VD_CH, y0=Math.round(H*.13), y1=Math.round(H*.95), M=new Map();
  const sad=(sx,sy)=>{ const k=sx+","+sy; if(M.has(k)) return M.get(k); let s=0, n=0;
    for(let y=Math.max(y0,y0+sy);y<Math.min(y1,y1+sy);y+=2){ const yr=(y-sy)*W-sx; for(let x=Math.max(2,2+sx);x<Math.min(W-2,W-2+sx);x+=2){ s+=Math.abs(C[y*W+x]-R[yr+x]); n++; } }
    const e=n>400?s/n:Infinity; M.set(k,e); return e; };
  const cx=Math.round(px), cy=Math.round(py); let b={x:cx,y:cy,e:Infinity};
  for(let sy=cy-4;sy<=cy+4;sy++) for(let sx=cx-14;sx<=cx+14;sx++){ const e=sad(sx,sy); if(e<b.e) b={x:sx,y:sy,e}; }
  const sub=(a,m,c)=>{ const d=a-2*m+c; return d>0&&isFinite(d)?Math.max(-.5,Math.min(.5,(a-c)/(2*d))):0; };
  return {x:b.x+sub(sad(b.x-1,b.y),b.e,sad(b.x+1,b.y)),y:b.y+sub(sad(b.x,b.y-1),b.e,sad(b.x,b.y+1)),e:b.e}; }
/* mede a câmara de 0,1 em 0,1 s, desde o último momento medido até «ate»; compara com uma imagem de referência que muda quando a câmara já rodou muito */
async function vdSegueCam(p,ate,v,prog){ const C=p.cam, novo=!C.length; if(novo) C.push([p.t,0,0]); const ult=C[C.length-1]; if(ult[0]>=ate-.05) return false;
  const seek=t=>new Promise(ok=>{ v.addEventListener("seeked",ok,{once:true}); v.currentTime=t; });
  await seek(ult[0]); let R=vdBordas(v), rOff=[ult[1]*VD_CW,ult[2]*VD_CH], tot=rOff.slice(), vel=[0,0];
  if(C.length>1){ const a=C[C.length-2]; vel=[(ult[1]-a[1])*VD_CW,(ult[2]-a[2])*VD_CH]; }
  for(let k=1;;k++){ const t=Math.round((ult[0]+k*.1)*100)/100; if(t>ate+.05) break; await seek(t); const G=vdBordas(v);
    const m=vdCasa(R,G,tot[0]-rOff[0]+vel[0],tot[1]-rOff[1]+vel[1]), n=[rOff[0]+m.x,rOff[1]+m.y];
    vel=[n[0]-tot[0],n[1]-tot[1]]; tot=n; C.push([t,Math.round(tot[0]/VD_CW*1e4)/1e4,Math.round(tot[1]/VD_CH*1e4)/1e4]);
    if(Math.abs(m.x)>VD_CW*.2||Math.abs(m.y)>VD_CH*.15){ R=G; rOff=tot.slice(); }
    if(prog) prog(t); if(C.length>=1500) break; }
  /* pontos-chave marcados antes de haver câmara medida (v117): passam para a imagem do momento da paragem */
  if(novo) Object.values(p.mov).forEach(tr=>tr.forEach(e=>{ if(e[0]>p.t+.02){ const [dx,dy]=vdCamEm(p,e[0]); e[1]=vdMexe(e[1],-dx,-dy); } }));
  return true; }
/* ---------- V3 (v119): seguir o jogador sozinho ----------
   Guarda o aspeto do jogador (um retrato da pessoa, por cima do ponto da peça, que está nos pés) e procura-o nas imagens seguintes,
   de 0,1 em 0,1 s, à volta de onde devia estar (correlação normalizada das cores, em meia resolução); grava um ponto-chave a cada 0,2 s.
   Para quando o perde (tapado, misturado com outros, fora da imagem): aí arrasta-se a peça para o sítio e segue-se outra vez.
   shortcut: procura por semelhança de cor; dois jogadores colados com a mesma camisola podem trocar — corrigir à mão e voltar a seguir */
const VD_TW=640, VD_TH=360, VD_SEGUE=["circ","lig","luz"];
function vdImgMeia(v){ const c=vdImgMeia.c||(vdImgMeia.c=document.createElement("canvas")); c.width=VD_TW; c.height=VD_TH; const x=c.getContext("2d",{willReadFrequently:true}); x.drawImage(v,0,0,VD_TW,VD_TH); return x.getImageData(0,0,VD_TW,VD_TH).data; }
const vdCaixa=(cx,cy,w,h)=>{ const x0=Math.round(cx-w/2), y0=Math.round(cy-h*.88); return x0<0||y0<0||x0+w>VD_TW||y0+h>VD_TH?null:[x0,y0]; };
function vdNormT(T){ let m=0; for(let k=0;k<T.length;k++) m+=T[k]; m/=T.length; let n=0; for(let k=0;k<T.length;k++){ T[k]-=m; n+=T[k]*T[k]; } n=Math.sqrt(n)||1; for(let k=0;k<T.length;k++) T[k]/=n; return T; }
/* retrato w×h com os pés (cx, cy) em baixo ao centro, em RGB, com média 0 e norma 1 */
function vdRetrato(D,cx,cy,w,h){ const c=vdCaixa(cx,cy,w,h); if(!c) return null; const T=new Float32Array(w*h*3);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const i=((c[1]+y)*VD_TW+c[0]+x)*4, k=(y*w+x)*3; T[k]=D[i]; T[k+1]=D[i+1]; T[k+2]=D[i+2]; } return vdNormT(T); }
/* onde está o retrato T à volta de (px, py), até r px: {x, y, s} com s = semelhança (-1 a 1) */
function vdProcura(D,T,w,h,px,py,r){ let b={x:px,y:py,s:-2}; const N=w*h*3;
  for(let cy=Math.round(py-r);cy<=Math.round(py+r);cy++) for(let cx=Math.round(px-r);cx<=Math.round(px+r);cx++){ const c=vdCaixa(cx,cy,w,h); if(!c) continue;
    let s1=0, s2=0, st=0;
    for(let y=0;y<h;y++){ let i=((c[1]+y)*VD_TW+c[0])*4, k=y*w*3; for(let x=0;x<w;x++,i+=4,k+=3){ const R=D[i], G=D[i+1], B=D[i+2]; s1+=R+G+B; s2+=R*R+G*G+B*B; st+=R*T[k]+G*T[k+1]+B*T[k+2]; } }
    const va=s2-s1*s1/N, sc=va>1e-6?st/Math.sqrt(va):-1; if(sc>b.s) b={x:cx,y:cy,s:sc}; }
  return b; }
/* segue os pontos (imagem do momento t0, em frações) até «fim»; cada alvo fica com pos = [[t, x, y]] e, se o perdeu, perdido = t */
async function vdSeguePontos(t0,fim,alvos,v,prog,parar){ const seek=t=>new Promise(ok=>{ v.addEventListener("seeked",ok,{once:true}); v.currentTime=t; });
  await seek(t0); let D=vdImgMeia(v);
  alvos.forEach(a=>{ Object.assign(a,{px:a.x*VD_TW,py:a.y*VD_TH,vx:0,vy:0,mau:0,pos:[[t0,a.x,a.y]]}); a.T=vdRetrato(D,a.px,a.py,a.w,a.h); a.ok=!!a.T; if(!a.ok) a.perdido=t0; });
  for(let k=1;;k++){ const t=Math.round((t0+k*.1)*100)/100; if(t>fim+.001||parar()) break; const vivos=alvos.filter(a=>a.ok); if(!vivos.length) break;
    await seek(t); D=vdImgMeia(v);
    for(const a of vivos){ const b=vdProcura(D,a.T,a.w,a.h,a.px+a.vx,a.py+a.vy,Math.max(10,Math.round(a.w*.9)));
      if(b.s<.45){ a.mau++; a.px+=a.vx; a.py+=a.vy; if(a.mau>=4){ a.ok=false; a.perdido=t; a.pos.splice(a.pos.length-(a.mau-1)); continue; } }
      else { a.mau=0; a.vx=.6*a.vx+.4*(b.x-a.px); a.vy=.6*a.vy+.4*(b.y-a.py); a.px=b.x; a.py=b.y;
        if(b.s>.75){ const N=vdRetrato(D,b.x,b.y,a.w,a.h); if(N){ for(let j=0;j<N.length;j++) a.T[j]=a.T[j]*.85+N[j]*.15; vdNormT(a.T); } } }   // o jogador muda de pose: o retrato atualiza-se devagar
      if(!vdCaixa(a.px,a.py,a.w,a.h)){ a.ok=false; a.perdido=t; continue; }
      a.pos.push([t,a.px/VD_TW,a.py/VD_TH]); }
    if(prog) prog(t); }
  return alvos; }
/* largura do jogador na imagem (fração), pelo tamanho da peça: o círculo à volta dos pés é um pouco mais largo do que ele */
function vdLargJog(P,t,p,x,y){ let rx=p.rx||.03; if(p.chao){ const K=imK({cal:vdCalVer(P,t)}), c=K&&imCircChao(K,x,y,p.m||1.2,p.m||1.2,1,1); if(c){ const xs=c.map(q=>q[0]); rx=(Math.max(...xs)-Math.min(...xs))/2; } } return rx; }
/* os caminhos seguidos viram pontos-chave (a cada 0,2 s, média de 3 medições), na imagem do momento da paragem */
function vdPoeSeguidos(P,I,alvos,t0){ const porPeca=new Map(); alvos.forEach(a=>{ if(!porPeca.has(a.i)) porPeca.set(a.i,[]); porPeca.get(a.i).push(a); }); let ult=t0;
  porPeca.forEach((As,i)=>{ const p=I.pecas[i], A=p&&P.pecas.find(x=>x.pk===p.pk); if(!A) return;
    const tr=P.mov[A.pk]||(P.mov[A.pk]=[[P.t,vdGeo(A)]]), g0=clone(vdGeoEm(tr,t0));
    for(let j=tr.length-1;j>=0;j--) if(tr[j][0]>t0+.01) tr.splice(j,1); vdPoeKey(tr,t0,g0);   // o que estava depois daqui é substituído
    const n=Math.max(...As.map(a=>a.pos.length)), suave=(pos,j)=>{ const q=pos.slice(Math.max(0,j-1),j+2); return j<pos.length?[q.reduce((s,e)=>s+e[1],0)/q.length,q.reduce((s,e)=>s+e[2],0)/q.length]:null; };
    for(let j=2;j<n;j+=2){ const t=As.find(a=>a.pos[j])?.pos[j][0]; if(t==null) break; const [dx,dy]=vdCamEm(P,t), g=clone(vdGeoEm(tr,t));
      As.forEach(a=>{ const q=suave(a.pos,j); if(!q) return; if(a.k>=0){ if(g.pts&&g.pts[a.k]) g.pts[a.k]=[q[0]-dx,q[1]-dy]; } else { g.x=q[0]-dx; g.y=q[1]-dy; } });
      vdPoeKey(tr,t,g); ult=Math.max(ult,t); } });
  if(ult>P.ate) P.ate=ult; return ult; }
const vdPseudoI=(V,p,t)=>({img:{id:"vf",w:V.fonte.w,h:V.fonte.h},pecas:vdPecasVer(p,t),cal:vdCalVer(p,t),escuro:p.escuro,crop:null});
/* camada no tempo t: a paragem parada, ou as peças a andar depois dela */
function vdOv(t){ const o=$("vd-ov"); if(!o||!vdEd) return; const V=vdEd.V, p=vdEd.congelada||(!vdEd.tocar&&vdPausaEm(t)), tt=p?p.t:t;
  o.innerHTML=vdCamadas(V,tt,p).map(([q,x],i)=>imCamadaSvg(vdPseudoI(V,q,x),"vo"+i+"_",false,-1)).join(""); }
/* o que se vê no momento t: as peças a andar (de paragens anteriores) e, por cima, o desenho da paragem «pz» se estiver parado nela */
const vdCamadas=(V,t,pz)=>[...vdAndamEm(V,t,pz).map(q=>[q,t]),...(pz&&pz.pecas.length?[[pz,pz.t]]:[])];
function vdDesenhaOv(){ if(!vdEd) return; vdOv(vdEd.v.currentTime); vdCtl(); }
function vdPara(){ if(!vdEd) return; vdEd.tocar=false; clearTimeout(vdEd.tCong); vdEd.congelada=null; vdEd.v.pause(); vdDesenhaOv(); }
function vdPasso(n){ vdPara(); const v=vdEd.v; v.currentTime=Math.max(0,Math.min(vdEd.V.fonte.dur,v.currentTime+n/VD_FPS)); }
/* tocar: o vídeo para em cada paragem o tempo marcado, com o desenho, e continua (como no vídeo final) */
function vdPlay(){ if(!vdEd) return; const v=vdEd.v; if(vdEd.tocar){ vdPara(); return; } if(v.ended||v.currentTime>=vdEd.V.fonte.dur-.05) v.currentTime=0;
  vdEd.tocar=true; vdEd.desde=v.currentTime-.001; const p=vdPausaEm(v.currentTime); if(p&&p.dur>0&&p.t>vdEd.desde){ vdEd.desde=p.t; vdCongela(p); return; }
  v.play().catch(()=>{}); vdVigia(); vdCtl(); }
function vdVigia(){ const v=vdEd.v, cb=(now,meta)=>{ if(!vdEd||!vdEd.tocar) return; const m=meta.mediaTime, p=vdEd.V.pausas.find(x=>x.t>vdEd.desde&&x.t<=m+.5/VD_FPS); vdEd.desde=m;
    if(p&&p.dur>0){ v.pause(); v.currentTime=p.t; vdEd.desde=p.t; vdCongela(p); return; } vdOv(m); if(!v.ended) v.requestVideoFrameCallback(cb); };
  if(v.requestVideoFrameCallback) v.requestVideoFrameCallback(cb); }
function vdCongela(p){ vdEd.congelada=p; vdDesenhaOv(); clearTimeout(vdEd.tCong);
  vdEd.tCong=setTimeout(()=>{ if(!vdEd) return; vdEd.congelada=null; if(vdEd.tocar){ vdEd.v.play().catch(()=>{}); vdVigia(); } vdDesenhaOv(); },p.dur*1000); }
/* nova paragem no sítio onde o vídeo está, e abre logo o desenho; se já houver uma ali, abre essa */
function vdNovaPausa(){ vdPara(); const V=vdEd.V, t=Math.round(vdEd.v.currentTime*100)/100; let p=vdPausaEm(t);
  if(!p){ if(V.pausas.length>=60){ toast("Máximo de 60 paragens."); return; } const ant=V.pausas.filter(x=>x.t<t).pop();
    p=normPausaVd({id:uId("pz"),t,dur:3,cal:ant?vdCalVer(ant,t):null}); V.pausas.push(p); V.pausas.sort((a,b)=>a.t-b.t); vdGrava(); vdPainel(); }
  vdDesenha(p.id); }
/* desenhar uma paragem: a imagem parada vai para o editor de imagens (as mesmas peças, a perspetiva, os menus) */
async function vdFoto(t){ const V=vdEd.V, v=vdEd.v;
  if(Math.abs(v.currentTime-t)>.001){ await new Promise(ok=>{ v.addEventListener("seeked",ok,{once:true}); v.currentTime=t; }); }
  const cv=document.createElement("canvas"); cv.width=V.fonte.w; cv.height=V.fonte.h; cv.getContext("2d").drawImage(v,0,0,cv.width,cv.height);
  return new Promise(ok=>cv.toBlob(ok,"image/jpeg",.9)); }
const vdDurTxt=d=>d>0?`Tempo parado (${d} s)`:"Sem parar (o vídeo não para aqui)";
async function vdDesenha(pid){ const V=vdEd.V, p=V.pausas.find(x=>x.id===pid); if(!p) return; vdPara();
  const fid="vf_"+p.id, poeFoto=async t=>{ const b=await vdFoto(t); if(xImgUrl[fid]) URL.revokeObjectURL(xImgUrl[fid]); xImgUrl[fid]=URL.createObjectURL(b); };
  await poeFoto(p.t); p.pecas.forEach(x=>{ if(!x.pk) x.pk=uId("pk"); });
  const cur={t:p.t,ocup:false}, achaP=()=>vdEd&&vdEd.V.pausas.find(x=>x.id===pid), tit=()=>`Paragem aos ${vdT(p.t)}`+(cur.t>p.t+.01?` · agora ${vdT(cur.t)}`:"");
  /* V2: mudar o momento do clip dentro do desenho — grava, mostra a imagem desse momento e as peças onde estão nesse momento */
  /* V3: seguir o jogador escolhido (ou todos os círculos, ligações e luzes) a partir deste momento */
  const seguir=async todos=>{ const P=achaP(); if(!P||!imEd||cur.ocup) return; imGravaJa(); const I=imEd.I;
    const idx=(todos?I.pecas.map((_,i)=>i):[imEd.sel]).filter(i=>i>=0&&I.pecas[i]&&VD_SEGUE.includes(I.pecas[i].t));
    if(!idx.length){ toast(todos?"Não há círculos, ligações nem luzes para seguir.":"Escolhe primeiro (com ✥ Mover) o círculo, a ligação ou a luz do jogador."); return; }
    const fim=Math.min(vdLimSeg(vdEd.V,P),cur.t+15); if(fim<cur.t+.15){ toast("Já não há vídeo para seguir daqui (é o fim do clip)."); return; }
    const bt=$("vf-segx"); cur.ocup=true; cur.parar=false; if(bt){ bt.hidden=false; bt.onclick=()=>{ cur.parar=true; }; }
    const diz=x=>{ const e=$("vf-segst"); if(e) e.textContent=x; }; let fimT=cur.t, perdidos=[];
    try{ if(!P.semCam&&await vdSegueCam(P,fim,vdEd.v,x=>diz("📷 A medir a câmara… "+vdT(x)))) vdGrava();
      const alvos=[]; idx.forEach(i=>{ const p=I.pecas[i], pts=p.t==="lig"?p.pts.map((q,k)=>[q,k]):[[[p.x,p.y],-1]];
        pts.forEach(([q,k])=>{ const w=Math.max(10,Math.min(44,Math.round(vdLargJog(P,cur.t,p,q[0],q[1])*VD_TW*1.1))); alvos.push({i,k,x:q[0],y:q[1],w,h:Math.round(w*2.3),nome:p.t==="lig"?"ligação":p.t==="luz"?"luz":"círculo"}); }); });
      await vdSeguePontos(cur.t,fim,alvos,vdEd.v,x=>diz("🎯 A seguir… "+vdT(x)),()=>cur.parar||!imEd);
      if(!imEd) return; fimT=vdPoeSeguidos(P,I,alvos,cur.t); vdGrava(); perdidos=alvos.filter(a=>a.perdido!=null&&a.perdido<fim-.05); }
    catch(e){ toast("Não consegui seguir ("+((e&&e.message)||"erro")+")."); }
    finally{ cur.ocup=false; if(bt) bt.hidden=true; }
    await ir(cur.t,true);
    diz(fimT>cur.t+.05?`Seguido até ${vdT(fimT)}.${perdidos.length?` Perdi ${perdidos.length===1?"o jogador":perdidos.length+" jogadores"} aos ${vdT(Math.min(...perdidos.map(a=>a.perdido)))}: avança até lá, arrasta para o sítio e segue outra vez.`:""} Confere com ▶ ou com 1 s ▶.`:"Não consegui seguir: arrasta a peça para os pés do jogador e tenta outra vez."); };
  const ir=async (t,forca)=>{ const P=achaP(); if(!P||!imEd||cur.ocup) return; cur.ocup=true;
    try{ imGravaJa(); t=Math.round(Math.max(P.t,Math.min(vdLimSeg(vdEd.V,P),t))*100)/100; if(Math.abs(t-cur.t)<.005&&!forca) return;
      if(!P.semCam){ const ag=$("vf-agora"); if(await vdSegueCam(P,t,vdEd.v,x=>{ if(ag) ag.textContent="📷 "+vdT(x); })) vdGrava(); }
      await poeFoto(t); if(!imEd) return; cur.t=t;
      Object.assign(imEd.I,{pecas:clone(vdPecasVer(P,t)),cal:vdCalVer(P,t),titulo:tit()}); imEd.undo=[]; imEd.redo=[]; imEd.lig=null;
      const sv=$("ie-palco").querySelector("svg"); if(sv) sv.dataset.crop="-";   // obriga a trocar a imagem de fundo
      imDesenha(); imPainel(); imFicha(); } finally{ cur.ocup=false; } };
  abreEditorImagem(null,{I:{id:p.id,jogo:V.jogo,js:V.js,titulo:tit(),temT:false,parte:1,seg:0,img:{id:fid,w:V.fonte.w,h:V.fonte.h},crop:null,escuro:p.escuro,cal:vdCalVer(p,p.t),pecas:clone(vdPecasVer(p,p.t))},
    grava:J=>{ const P=achaP(); if(!P) return; const [dx,dy]=vdCamEm(P,cur.t);   // volta à imagem do momento da paragem
      const J2=dx||dy?{...J,pecas:J.pecas.map(x=>vdMexe(x,-dx,-dy)),cal:J.cal&&{...J.cal,pts:J.cal.pts.map(q=>[q[0]-dx,q[1]-dy])}}:J;
      vdGravaPecas(P,J2,cur.t,imEd&&imEd.I); vdGrava(); },
    fecha:()=>{ vdPainel(); vdDesenhaOv(); },
    tecla:e=>{ if((e.key!=="ArrowLeft"&&e.key!=="ArrowRight")||imEd.drag) return false; ir(cur.t+(e.key==="ArrowRight"?1:-1)*(e.shiftKey?1:.2)); return true; },
    ficha:bx=>{ const P=achaP(); if(!P) return; const lim=vdLimSeg(vdEd.V,P), anda=P.ate>P.t+.02;
      bx.innerHTML=`<h4>Paragem do vídeo</h4><p class="sub" style="margin:0">Aos ${esc(vdT(P.t))} do clip. O vídeo fica parado com este desenho e depois continua. As peças que andam continuam por cima das paragens seguintes.</p>
      <label class="f"><span>${vdDurTxt(P.dur)}</span><input type="range" id="vf-dur" min="0" max="15" step="0.5" value="${P.dur}"></label>
      <h4>Peças que andam com os jogadores</h4>
      <p class="sub" style="margin:0">Avança o vídeo e arrasta cada peça para onde o jogador está. A app faz o movimento entre esses pontos.</p>
      <div class="vf-seg"><button class="btn sm primary" id="vf-seg1" title="Segue sozinho o jogador da peça escolhida, a partir deste momento">🎯 Seguir o escolhido</button><button class="btn sm" id="vf-segT" title="Segue todos os círculos, ligações e luzes a partir deste momento">🎯 Seguir todos</button><button class="btn sm ghost" id="vf-segx" hidden>Parar</button></div>
      <p class="sub" id="vf-segst" style="margin:0" aria-live="polite">Põe a peça nos pés do jogador e a app segue-o sozinha. Se o perder, arrasta-o para o sítio e segue outra vez.</p>
      <label class="chk" style="margin:6px 0"><input type="checkbox" id="vf-cam"${P.semCam?"":" checked"}> 📷 A câmara roda (tripé): o desenho fica preso à relva</label>
      <div class="vf-nav"><button class="btn sm" data-d="-1" title="1 s para trás (Shift+←)">◀ 1 s</button><button class="btn sm" data-d="-0.2" title="0,2 s para trás (←)">◀ 0,2</button><b id="vf-agora">${esc(vdT(cur.t))}</b><button class="btn sm" data-d="0.2" title="0,2 s para a frente (→)">0,2 ▶</button><button class="btn sm" data-d="1" title="1 s para a frente (Shift+→)">1 s ▶</button></div>
      <input type="range" id="vf-tl" min="${P.t}" max="${lim}" step="0.04" value="${cur.t}" aria-label="Momento do clip">
      <p class="sub" style="margin:0">${anda?`Andam até ${esc(vdT(vdFimSeg(vdEd.V,P)))}.`:"Ainda não andam: só aparecem na paragem."} Teclas ← → (0,2 s); com Shift, 1 s.</p>
      ${cur.t>P.t+.01||anda?`<button class="btn sm ghost danger" id="vf-fim">⏹ Acabar aqui (${cur.t>P.t+.01?esc(vdT(cur.t)):"não andam"})</button>`:""}`;
      bx.querySelector("#vf-dur").oninput=e=>{ P.dur=+e.target.value; bx.querySelector("#vf-dur").previousElementSibling.textContent=vdDurTxt(P.dur); vdGrava(); };
      bx.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>ir(cur.t+(+b.dataset.d)));
      bx.querySelector("#vf-tl").onchange=e=>ir(+e.target.value);
      bx.querySelector("#vf-seg1").onclick=()=>seguir(false); bx.querySelector("#vf-segT").onclick=()=>seguir(true);
      bx.querySelector("#vf-cam").onchange=e=>{ imGravaJa(); P.semCam=!e.target.checked; vdGrava(); ir(cur.t,true); };
      /* acabar aqui: as peças ficam onde estão neste momento e desaparecem daqui para a frente */
      const fb=bx.querySelector("#vf-fim"); if(fb) confirma2(fb,"Acabar?",()=>{ imGravaJa(); const t=cur.t;
        Object.keys(P.mov).forEach(k=>{ const tr=P.mov[k], g=vdGeoEm(tr,t); vdPoeKey(tr,t,g); P.mov[k]=tr.filter(e=>e[0]<=t+.01); });
        P.ate=t; vdGrava(); imFicha(); toast(t>P.t+.01?`As peças andam até ${vdT(t)}.`:"As peças já não andam."); }); }}); }
function vdPainel(){ const bx=$("vd-pz"); if(!bx||!vdEd) return; const V=vdEd.V;
  const parado=d=>d>0?`Parado ${d} s`:"Sem parar";
  bx.innerHTML=V.pausas.length?V.pausas.map(p=>`<div class="vd-pzl" data-id="${esc(p.id)}"><button class="btn sm" data-a="ir" title="Ir para a paragem">⏸ ${esc(vdT(p.t))}${p.ate>p.t+.02?` → ${esc(vdT(vdFimSeg(V,p)))}`:""}</button>
      <label class="f" style="flex:1;min-width:110px"><span>${parado(p.dur)}</span><input type="range" data-a="dur" min="0" max="15" step="0.5" value="${p.dur}"></label>
      <button class="btn sm" data-a="des">✎ Desenhar${p.pecas.length?` (${p.pecas.length})`:""}</button><button class="btn sm ghost danger" data-a="del" aria-label="Apagar paragem">🗑</button></div>`).join("")
    :`<p class="sub" style="margin:0">Ainda não há paragens. Põe o vídeo no momento certo (▶, a barra, ou as setas ← → imagem a imagem) e toca em <b>⏸ Parar aqui e desenhar</b>.</p>`;
  bx.querySelectorAll(".vd-pzl").forEach(L=>{ const p=V.pausas.find(x=>x.id===L.dataset.id);
    L.querySelector('[data-a="ir"]').onclick=()=>{ vdPara(); vdEd.v.currentTime=p.t; };
    L.querySelector('[data-a="des"]').onclick=()=>vdDesenha(p.id);
    const r=L.querySelector('[data-a="dur"]'); r.oninput=()=>{ p.dur=+r.value; r.previousElementSibling.textContent=parado(p.dur); vdGrava(); };
    confirma2(L.querySelector('[data-a="del"]'),"Apagar?",()=>{ const i=V.pausas.indexOf(p), antes=clone(p); V.pausas.splice(i,1); vdGrava(); vdPainel(); vdDesenhaOv();
      toast("Paragem apagada",()=>{ if(!vdEd) return; V.pausas.push(antes); V.pausas.sort((a,b)=>a.t-b.t); vdGrava(); vdPainel(); vdDesenhaOv(); }); }); }); }
function vdFicha(){ const bx=$("vd-ficha"); if(!bx||!vdEd) return; const V=vdEd.V;
  bx.innerHTML=`<h4>Ficha do vídeo</h4>
    <label class="f">Título<input type="text" id="vf-t" maxlength="120" value="${esc(V.titulo)}"></label>
    <label class="f">Descrição<textarea id="vf-d" rows="3" placeholder="O que se vê, o que queremos">${esc(V.desc)}</textarea></label>
    <div class="fields"><label class="f">Parte<select id="vf-p"><option value="1">1.ª parte</option><option value="2">2.ª parte</option></select></label><label class="f">Minuto do jogo (mm:ss)<input type="text" id="vf-m" inputmode="numeric" placeholder="52:30" value="${V.temT?esc(minutoReg(V)):""}"></label></div>
    <h4>Jogadores no vídeo</h4><div class="imjog" id="vf-js">${imJogadores(V.jogo).map(x=>`<button class="btn sm" data-n="${esc(x.n)}" aria-pressed="${V.js.includes(x.n)}">${esc(x.n)} ${esc(imPrimUlt(x.nome))}</button>`).join("")}</div>
    <p class="sub" style="margin:0">Clip no computador: ${esc(V.fonte.nome)} · ${esc(vdT(V.fonte.dur))} · ${V.fonte.w}×${V.fonte.h}</p>`;
  const q=s=>bx.querySelector(s); q("#vf-p").value=String(V.parte);
  q("#vf-t").oninput=e=>{ V.titulo=e.target.value; vdTitulo(); vdGrava(); }; q("#vf-d").oninput=e=>{ V.desc=e.target.value; vdGrava(); };
  const lerT=()=>{ const v=q("#vf-m").value.trim(), p=+q("#vf-p").value; if(!v){ V.temT=false; vdGrava(); return; } const s_=seg(v); if(!(s_<1e9)) return; V.parte=p; V.seg=Math.max(0,s_-(p===2?2700:0)); V.temT=true; vdGrava(); };
  q("#vf-m").onchange=lerT; q("#vf-p").onchange=lerT;
  q("#vf-js").querySelectorAll("button").forEach(b=>b.onclick=()=>{ const n=b.dataset.n; V.js=V.js.includes(n)?V.js.filter(x=>x!==n):[...V.js,n]; b.setAttribute("aria-pressed",String(V.js.includes(n))); vdGrava(); }); }

/* ---------- vídeo final: MP4 (H.264 + AAC) com as paragens e os desenhos ----------
   A imagem grava-se em tempo real (o clip toca sem som e cada imagem é copiada); nas paragens repete-se a imagem parada com o desenho.
   O som é o do clip, com silêncio nas paragens. Qualidade ajustada para o ficheiro caber nos 20 MiB do armazenamento do link. */
const vdPar=n=>Math.max(2,Math.round(n/2)*2);
async function vdCamadaImg(V,L,W,H){ const sv=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${V.fonte.w} ${V.fonte.h}">${L.map(([p,t],i)=>imCamadaSvg(vdPseudoI(V,p,t),"vx"+i+"_",false,-1)).join("")}</svg>`;
  const u=URL.createObjectURL(new Blob([sv],{type:"image/svg+xml"})); try{ const im=new Image(); await new Promise((ok,ko)=>{ im.onload=ok; im.onerror=ko; im.src=u; }); await im.decode?.().catch(()=>{}); return im; } finally{ setTimeout(()=>URL.revokeObjectURL(u),2000); } }
/* som de saída: o do clip, cortado nas paragens com silêncio; blocos de 0,1 s */
async function vdLeSom(F,sr){ try{ const ac=new (window.AudioContext||window.webkitAudioContext)({sampleRate:sr}); const A=await ac.decodeAudioData(await F.arrayBuffer()); ac.close?.(); return A.length?A:null; }catch(e){ return null; } }   // clip sem som → null
async function vdSom(A,V,enc,nc,sr){
  const ch=[...Array(nc)].map((_,c)=>A.getChannelData(Math.min(c,A.numberOfChannels-1))), seg_=[]; let t0=0;
  for(const p of V.pausas){ seg_.push({de:Math.round(t0*sr),ate:Math.round(p.t*sr)}); seg_.push({sil:Math.round(p.dur*sr)}); t0=p.t; }
  seg_.push({de:Math.round(t0*sr),ate:A.length});
  const B=Math.round(sr/10); let o=0;
  for(const s of seg_){ const n=s.sil!=null?s.sil:Math.max(0,Math.min(A.length,s.ate)-s.de);
    for(let k=0;k<n;k+=B){ const m=Math.min(B,n-k), d=new Float32Array(m*nc);
      if(s.sil==null) for(let c=0;c<nc;c++) d.set(ch[c].subarray(s.de+k,s.de+k+m),c*m);
      const ad=new AudioData({format:"f32-planar",sampleRate:sr,numberOfFrames:m,numberOfChannels:nc,timestamp:Math.round(o/sr*1e6),data:d}); enc.encode(ad); ad.close(); o+=m;
      while(enc.encodeQueueSize>20) await new Promise(ok=>setTimeout(ok,2)); } } }
async function vdExporta(){ if(!vdEd) return; vdPara(); vdGravaJa(); const V=vdEd.V, v=vdEd.v, F=vdFich[V.id];
  if(!window.VideoEncoder||!window.VideoFrame||!v.requestVideoFrameCallback){ toast("Este browser não grava vídeo: usa o Chrome ou o Edge no computador."); return; }
  const k=Math.min(1,1920/V.fonte.w), W=vdPar(V.fonte.w*k), H=vdPar(V.fonte.h*k), tot=vdDurTot(V);
  const pr=vdProgresso(); let cancelou=false; pr.cancela=()=>{ cancelou=true; };
  try{
    if(!window.Mp4Muxer) await carregaScript(VD_MUXER);
    const sr=48000, nc=2, podeSom=!!window.AudioEncoder&&(await AudioEncoder.isConfigSupported({codec:"mp4a.40.2",sampleRate:sr,numberOfChannels:nc,bitrate:128000}).catch(()=>({}))).supported;
    pr.txt("A preparar o som…"); const A=podeSom?await vdLeSom(F,sr):null, temSom=!!A;
    /* o codificador do PC passa ~20 % do pedido (21,5 MB no 1.º teste com 90 %): pedir 70 % dos 20 MiB, em ritmo constante */
    const vbr=Math.max(800_000,Math.min(5_000_000,Math.floor(VD_MAX*.7*8/tot-(temSom?128000:0))));
    let cfg=null; for(const codec of ["avc1.640028","avc1.4d0028","avc1.42e028"]) for(const bitrateMode of ["constant",undefined]){ if(cfg) break; const c={codec,width:W,height:H,bitrate:vbr,framerate:VD_FPS,...(bitrateMode?{bitrateMode}:{})}; try{ if((await VideoEncoder.isConfigSupported(c)).supported) cfg=c; }catch(e){} }
    if(!cfg) throw new Error("sem codificador H.264");
    const muxer=new Mp4Muxer.Muxer({target:new Mp4Muxer.ArrayBufferTarget(),video:{codec:"avc",width:W,height:H},...(temSom?{audio:{codec:"aac",numberOfChannels:nc,sampleRate:sr}}:{}),fastStart:"in-memory",firstTimestampBehavior:"offset"});
    let erro=null; const enc=new VideoEncoder({output:(c,m)=>muxer.addVideoChunk(c,m),error:e=>{ erro=e; }}); enc.configure(cfg);
    if(temSom){ const aenc=new AudioEncoder({output:(c,m)=>muxer.addAudioChunk(c,m),error:e=>{ erro=e; }}); aenc.configure({codec:"mp4a.40.2",sampleRate:sr,numberOfChannels:nc,bitrate:128000});
      await vdSom(A,V,aenc,nc,sr); await aenc.flush(); aenc.close(); if(erro) throw erro; }
    pr.txt("A preparar os desenhos…"); const cam={}; for(const p of V.pausas) if(p.dur>0&&vdCamadas(V,p.t,p).length) cam[p.id]=await vdCamadaImg(V,vdCamadas(V,p.t,p),W,H);
    const cv=document.createElement("canvas"); cv.width=W; cv.height=H; const cx=cv.getContext("2d"), dF=Math.round(1e6/VD_FPS);
    let ult=-1, nFr=0; const meteFr=(ts,key)=>{ if(ts<=ult) return; const fr=new VideoFrame(cv,{timestamp:ts,duration:dF}); enc.encode(fr,{keyFrame:key||nFr%(VD_FPS*2)===0}); fr.close(); ult=ts; nFr++; if(erro) throw erro; };
    const seek=t=>Math.abs(v.currentTime-t)<1e-4&&!v.seeking?Promise.resolve():new Promise(ok=>{ v.addEventListener("seeked",ok,{once:true}); v.currentTime=t; });
    const pausas=V.pausas.slice(); let off=0, i=0;
    /* V2: enquanto há peças a andar (de uma ou mais paragens), grava-se imagem a imagem (procura cada imagem e desenha as peças nesse momento),
       até não haver nada a andar ou até à paragem seguinte */
    const segue=async ate=>{ const m0=v.currentTime; let m=m0;
      for(let j=0;!cancelou;j++){ m=m0+j/VD_FPS; if(m>=ate-1e-3) break; const L=vdCamadas(V,m); if(!L.length) break; await seek(m); cx.drawImage(v,0,0,W,H);
        cx.drawImage(await vdCamadaImg(V,L,W,H),0,0,W,H); meteFr(Math.round(m*1e6)+off); pr.pct((m+off/1e6)/tot);
        while(enc.encodeQueueSize>8) await new Promise(ok=>setTimeout(ok,4)); }
      if(m>m0+1e-6) await seek(Math.min(m,ate)); };
    const congela=async p=>{ if(!(p.dur>0)) return; await seek(p.t); cx.drawImage(v,0,0,W,H); if(cam[p.id]) cx.drawImage(cam[p.id],0,0,W,H); const n=Math.max(1,Math.round(p.dur*VD_FPS)), t0=Math.round(p.t*1e6)+off;
      for(let f=0;f<n;f++){ meteFr(t0+f*dF,f===0); while(enc.encodeQueueSize>8) await new Promise(ok=>setTimeout(ok,4)); } off+=Math.round(p.dur*1e6); };
    v.muted=true; await seek(0);
    while(!cancelou){
      while(!cancelou&&i<pausas.length&&pausas[i].t<=v.currentTime+.5/VD_FPS){ await congela(pausas[i]); i++; }
      if(v.currentTime>=V.fonte.dur-.02) break;
      const prox=pausas[i];
      if(vdCamadas(V,v.currentTime).length){ await segue(prox?prox.t:V.fonte.dur); continue; }
      /* toca até à próxima paragem (ou ao fim), copiando cada imagem que aparece */
      await new Promise((ok,ko)=>{ const cb=(now,meta)=>{ try{ if(cancelou){ v.pause(); ok(); return; } const m=meta.mediaTime;
          if(prox&&m>=prox.t-.5/VD_FPS){ v.pause(); ok(); return; }
          cx.drawImage(v,0,0,W,H); meteFr(Math.round(m*1e6)+off); pr.pct((m+off/1e6)/tot);
          if(v.ended||m>=V.fonte.dur-.5/VD_FPS){ ok(); return; } v.requestVideoFrameCallback(cb); }catch(e){ v.pause(); ko(e); } };
        v.addEventListener("ended",()=>ok(),{once:true}); v.requestVideoFrameCallback(cb); v.play().catch(ko); });
      if(!prox) break; }
    for(;!cancelou&&i<pausas.length;i++) await congela(pausas[i]);   // paragens no fim do clip
    v.pause(); v.muted=false;
    if(cancelou){ enc.close(); toast("Gravação cancelada."); return; }
    pr.txt("A fechar o ficheiro…"); await enc.flush(); if(erro) throw erro; enc.close(); muxer.finalize();
    const blob=new Blob([muxer.target.buffer],{type:"video/mp4"}), mb=(blob.size/1048576).toFixed(1);
    if(blob.size>VD_MAX){ pr.txt(`O vídeo ficou com ${mb} MB (o máximo na app são 20). Fica só no computador.`); await guardaFicheiro(nomeFichVd(V),blob,"video/mp4"); return; }
    pr.txt(`A guardar na app (${mb} MB)…`); const As=await assetsEx(); if(!As){ toast("Na app só se guarda no link; fica só no computador."); await guardaFicheiro(nomeFichVd(V),blob,"video/mp4"); return; }
    const r=await As.upload(blob,{type:"video/mp4"}); xImgUrl[r.id]=r.url; const velho=V.saida&&V.saida.id;
    V.saida={id:r.id,tam:blob.size,dur:tot,w:W,h:H,em:new Date().toISOString(),chave:vdChave(V)}; vdGravaJa();
    if(velho&&velho!==r.id) As.delete(velho).catch(()=>{});   // o vídeo final anterior é substituído
    toast(`Vídeo final gravado na app · ${vdT(tot)} · ${mb} MB${temSom?"":" · sem som"}`);
    await guardaFicheiro(nomeFichVd(V),blob,"video/mp4").catch(()=>{}); }
  catch(e){ toast("Não foi possível gravar o vídeo ("+((e&&(e.code||e.message))||"erro")+")."); }
  finally{ pr.fecha(); if(vdEd){ v.muted=false; v.currentTime=0; } } }
function vdProgresso(){ const d=document.createElement("div"); d.id="vd-prog"; d.className="vd-prog"; d.innerHTML=`<div><b>A gravar o vídeo final</b><p id="vp-t">A começar…</p><div class="vp-barra"><i id="vp-b"></i></div><p class="sub">Deixa esta janela à frente até acabar (demora mais ou menos o tempo do clip).</p><button class="btn sm" id="vp-x">Cancelar</button></div>`;
  document.body.appendChild(d); const o={txt:t=>{ const e=d.querySelector("#vp-t"); if(e) e.textContent=t; },pct:x=>{ const b=d.querySelector("#vp-b"); if(b) b.style.width=Math.round(Math.min(1,x)*100)+"%"; o.txt(`A gravar… ${Math.round(Math.min(1,x)*100)}%`); },fecha:()=>d.remove(),cancela:null};
  d.querySelector("#vp-x").onclick=()=>{ if(o.cancela) o.cancela(); }; return o; }
