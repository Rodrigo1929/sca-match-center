/* ---------- Vídeos do Pós-jogo (v115, V1: parar e desenhar) ----------
   videos/{id} = { id, jogo: "atual" | <id do jogo arquivado>, titulo, desc, js: [nº], temT, parte, seg,
     fonte: {nome, tam, dur, w, h} (o clip original, que fica no computador),
     pausas: [{id, t (segundos do clip), dur (segundos parado), pecas, cal, escuro}] (desenhos com as peças do editor de imagens),
     saida: {id, tam, dur, w, h, em, chave} | null (vídeo final MP4 no armazenamento do link), criadoPor, criadoEm, alteradoPor, alteradoEm }
   Decidido pelo Rodrigo (13/11/2026): edita-se no computador (o iPad vê); o clip original fica no PC (o armazenamento do link aceita
   até 20 MiB por ficheiro) e só o vídeo final fica na app; o vídeo final leva o som do clip, em silêncio nas paragens. */
const VD_LS="sca-videos-v1", VD_MAX=20*1024*1024, VD_FPS=25, VD_MUXER="https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.js";
let videos={}; try{ videos=JSON.parse(localStorage.getItem(VD_LS)||"{}")||{}; }catch(e){ videos={}; }
function normPausaVd(p){ p=p||{}; return {id:/^[\w-]{4,40}$/.test(String(p.id||""))?String(p.id):uId("pz"),t:imNum(p.t,0,0,36000),dur:imNum(p.dur,3,.5,30),
  pecas:(Array.isArray(p.pecas)?p.pecas:[]).map(normPecaIm).filter(Boolean).slice(0,300),cal:normCalIm(p.cal),escuro:imNum(p.escuro,0,0,.8)}; }
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
const vdChave=V=>{ const s=JSON.stringify(V.pausas.map(p=>[p.t,p.dur,p.pecas,p.cal,p.escuro])); let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return String(h>>>0); };
const vdT=t=>{ t=Math.max(0,+t||0); const m=Math.floor(t/60), s=t-m*60; return `${m}:${s<10?"0":""}${s.toFixed(1)}`; };
const vdDurTot=V=>V.fonte.dur+V.pausas.reduce((a,p)=>a+p.dur,0);
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
  $("vd-pos").oninput=e=>{ vdPara(); v.currentTime=+e.target.value; };
  $("vd-grav").onclick=vdExporta; $("vd-ok").onclick=fechaEditorVideo;
  document.addEventListener("keydown",vdTecla); vdTitulo(); vdPainel(); vdFicha(); vdCtl(); }
function fechaEditorVideo(){ if(!vdEd) return; vdPara(); vdGravaJa(); document.removeEventListener("keydown",vdTecla); const r=$("vded-root"); if(r) r.innerHTML=""; URL.revokeObjectURL(vdEd.url); vdEd=null; renderVideos(); }
function vdTecla(e){ if(!vdEd||imEd||$("vd-prog")||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||"")) return;
  if(e.key===" "){ e.preventDefault(); vdPlay(); } else if(e.key==="ArrowLeft"){ e.preventDefault(); vdPasso(-1); } else if(e.key==="ArrowRight"){ e.preventDefault(); vdPasso(1); } }
function vdGrava(){ clearTimeout(vdEd.tSave); vdEd.tSave=setTimeout(vdGravaJa,600); }
function vdGravaJa(){ if(!vdEd) return; clearTimeout(vdEd.tSave); const N=gravaVideo(vdEd.V); vdEd.V.alteradoEm=N.alteradoEm; vdEd.V.alteradoPor=N.alteradoPor; }
const vdTitulo=()=>{ const t=document.querySelector(".vded .imed-tit"); if(t) t.textContent="Vídeo · "+(vdEd.V.titulo||"sem título"); };
const vdPausaEm=t=>vdEd.V.pausas.find(p=>Math.abs(p.t-t)<.06);
function vdCtl(){ if(!vdEd) return; const v=vdEd.v, V=vdEd.V; $("vd-t").textContent=`${vdT(v.currentTime)} / ${vdT(V.fonte.dur)}`; $("vd-pos").value=v.currentTime;
  $("vd-play").textContent=vdEd.tocar?"⏸":"▶"; $("vd-play").setAttribute("aria-label",vdEd.tocar?"Parar":"Tocar");
  const d=V.fonte.dur||1; $("vd-marcas").innerHTML=V.pausas.map(p=>`<button class="vd-marca${vdEd.congelada===p||(!vdEd.tocar&&vdPausaEm(v.currentTime)===p)?" on":""}" data-id="${esc(p.id)}" style="left:${(p.t/d*100).toFixed(3)}%" title="Paragem ${vdT(p.t)} · ${p.dur} s" aria-label="Ir para a paragem ${vdT(p.t)}"></button>`).join("");
  $("vd-marcas").querySelectorAll("button").forEach(b=>b.onclick=()=>{ vdPara(); const p=V.pausas.find(x=>x.id===b.dataset.id); if(p) v.currentTime=p.t; }); }
/* camada do desenho por cima do vídeo: na paragem em que o vídeo está parado, ou na que está a ser mostrada ao tocar */
const vdPseudoI=(V,p)=>({img:{id:"vf",w:V.fonte.w,h:V.fonte.h},pecas:p.pecas,cal:p.cal,escuro:p.escuro,crop:null});
function vdDesenhaOv(){ if(!vdEd) return; const o=$("vd-ov"); if(!o) return; const v=vdEd.v, p=vdEd.congelada||(!vdEd.tocar&&vdPausaEm(v.currentTime));
  o.innerHTML=p?imCamadaSvg(vdPseudoI(vdEd.V,p),"vo_",false,-1):""; vdCtl(); }
function vdPara(){ if(!vdEd) return; vdEd.tocar=false; clearTimeout(vdEd.tCong); vdEd.congelada=null; vdEd.v.pause(); vdDesenhaOv(); }
function vdPasso(n){ vdPara(); const v=vdEd.v; v.currentTime=Math.max(0,Math.min(vdEd.V.fonte.dur,v.currentTime+n/VD_FPS)); }
/* tocar: o vídeo para em cada paragem o tempo marcado, com o desenho, e continua (como no vídeo final) */
function vdPlay(){ if(!vdEd) return; const v=vdEd.v; if(vdEd.tocar){ vdPara(); return; } if(v.ended||v.currentTime>=vdEd.V.fonte.dur-.05) v.currentTime=0;
  vdEd.tocar=true; vdEd.desde=v.currentTime-.001; const p=vdPausaEm(v.currentTime); if(p&&p.t>vdEd.desde){ vdEd.desde=p.t; vdCongela(p); return; }
  v.play().catch(()=>{}); vdVigia(); vdCtl(); }
function vdVigia(){ const v=vdEd.v, cb=(now,meta)=>{ if(!vdEd||!vdEd.tocar) return; const m=meta.mediaTime, p=vdEd.V.pausas.find(x=>x.t>vdEd.desde&&x.t<=m+.5/VD_FPS); vdEd.desde=m;
    if(p){ v.pause(); v.currentTime=p.t; vdEd.desde=p.t; vdCongela(p); return; } if(!v.ended) v.requestVideoFrameCallback(cb); };
  if(v.requestVideoFrameCallback) v.requestVideoFrameCallback(cb); }
function vdCongela(p){ vdEd.congelada=p; vdDesenhaOv(); clearTimeout(vdEd.tCong);
  vdEd.tCong=setTimeout(()=>{ if(!vdEd) return; vdEd.congelada=null; if(vdEd.tocar){ vdEd.v.play().catch(()=>{}); vdVigia(); } vdDesenhaOv(); },p.dur*1000); }
/* nova paragem no sítio onde o vídeo está, e abre logo o desenho; se já houver uma ali, abre essa */
function vdNovaPausa(){ vdPara(); const V=vdEd.V, t=Math.round(vdEd.v.currentTime*100)/100; let p=vdPausaEm(t);
  if(!p){ if(V.pausas.length>=60){ toast("Máximo de 60 paragens."); return; } const ant=V.pausas.filter(x=>x.t<t).pop();
    p=normPausaVd({id:uId("pz"),t,dur:3,cal:ant?ant.cal:null}); V.pausas.push(p); V.pausas.sort((a,b)=>a.t-b.t); vdGrava(); vdPainel(); }
  vdDesenha(p.id); }
/* desenhar uma paragem: a imagem parada vai para o editor de imagens (as mesmas peças, a perspetiva, os menus) */
async function vdDesenha(pid){ const V=vdEd.V, p=V.pausas.find(x=>x.id===pid); if(!p) return; vdPara(); const v=vdEd.v;
  if(Math.abs(v.currentTime-p.t)>.001){ await new Promise(ok=>{ v.addEventListener("seeked",ok,{once:true}); v.currentTime=p.t; }); }
  const cv=document.createElement("canvas"); cv.width=V.fonte.w; cv.height=V.fonte.h; cv.getContext("2d").drawImage(v,0,0,cv.width,cv.height);
  const b=await new Promise(ok=>cv.toBlob(ok,"image/jpeg",.9)), fid="vf_"+p.id; if(xImgUrl[fid]) URL.revokeObjectURL(xImgUrl[fid]); xImgUrl[fid]=URL.createObjectURL(b);
  abreEditorImagem(null,{I:{id:p.id,jogo:V.jogo,js:V.js,titulo:`Paragem aos ${vdT(p.t)}`,temT:false,parte:1,seg:0,img:{id:fid,w:V.fonte.w,h:V.fonte.h},crop:null,escuro:p.escuro,cal:p.cal,pecas:clone(p.pecas)},
    grava:J=>{ const P=vdEd&&vdEd.V.pausas.find(x=>x.id===pid); if(!P) return; P.pecas=J.pecas.map(normPecaIm).filter(Boolean); P.cal=normCalIm(J.cal); P.escuro=imNum(J.escuro,0,0,.8); vdGrava(); },
    fecha:()=>{ vdPainel(); vdDesenhaOv(); },
    ficha:bx=>{ const P=vdEd.V.pausas.find(x=>x.id===pid); bx.innerHTML=`<h4>Paragem do vídeo</h4><p class="sub" style="margin:0">Aos ${esc(vdT(P.t))} do clip. O vídeo fica parado com este desenho e depois continua.</p>
      <label class="f">Tempo parado (${P.dur} s)<input type="range" id="vf-dur" min="1" max="15" step="0.5" value="${P.dur}"></label>`;
      bx.querySelector("#vf-dur").oninput=e=>{ P.dur=+e.target.value; bx.querySelector(".f").firstChild.textContent=`Tempo parado (${P.dur} s)`; vdGrava(); }; }}); }
function vdPainel(){ const bx=$("vd-pz"); if(!bx||!vdEd) return; const V=vdEd.V;
  bx.innerHTML=V.pausas.length?V.pausas.map(p=>`<div class="vd-pzl" data-id="${esc(p.id)}"><button class="btn sm" data-a="ir" title="Ir para a paragem">⏸ ${esc(vdT(p.t))}</button>
      <label class="f" style="flex:1;min-width:110px">Parado ${p.dur} s<input type="range" data-a="dur" min="1" max="15" step="0.5" value="${p.dur}"></label>
      <button class="btn sm" data-a="des">✎ Desenhar${p.pecas.length?` (${p.pecas.length})`:""}</button><button class="btn sm ghost danger" data-a="del" aria-label="Apagar paragem">🗑</button></div>`).join("")
    :`<p class="sub" style="margin:0">Ainda não há paragens. Põe o vídeo no momento certo (▶, a barra, ou as setas ← → imagem a imagem) e toca em <b>⏸ Parar aqui e desenhar</b>.</p>`;
  bx.querySelectorAll(".vd-pzl").forEach(L=>{ const p=V.pausas.find(x=>x.id===L.dataset.id);
    L.querySelector('[data-a="ir"]').onclick=()=>{ vdPara(); vdEd.v.currentTime=p.t; };
    L.querySelector('[data-a="des"]').onclick=()=>vdDesenha(p.id);
    const r=L.querySelector('[data-a="dur"]'); r.oninput=()=>{ p.dur=+r.value; r.parentNode.firstChild.textContent=`Parado ${p.dur} s`; vdGrava(); };
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
async function vdCamadaImg(V,p,W,H){ const sv=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${V.fonte.w} ${V.fonte.h}">${imCamadaSvg(vdPseudoI(V,p),"vx_",false,-1)}</svg>`;
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
    pr.txt("A preparar os desenhos…"); const cam={}; for(const p of V.pausas) if(p.pecas.length) cam[p.id]=await vdCamadaImg(V,p,W,H);
    const cv=document.createElement("canvas"); cv.width=W; cv.height=H; const cx=cv.getContext("2d"), dF=Math.round(1e6/VD_FPS);
    let ult=-1, nFr=0; const meteFr=(ts,key)=>{ if(ts<=ult) return; const fr=new VideoFrame(cv,{timestamp:ts,duration:dF}); enc.encode(fr,{keyFrame:key||nFr%(VD_FPS*2)===0}); fr.close(); ult=ts; nFr++; if(erro) throw erro; };
    const seek=t=>new Promise(ok=>{ v.addEventListener("seeked",ok,{once:true}); v.currentTime=t; });
    const pausas=V.pausas.slice(); let off=0, i=0;
    const congela=async p=>{ await seek(p.t); cx.drawImage(v,0,0,W,H); if(cam[p.id]) cx.drawImage(cam[p.id],0,0,W,H); const n=Math.max(1,Math.round(p.dur*VD_FPS)), t0=Math.round(p.t*1e6)+off;
      for(let f=0;f<n;f++){ meteFr(t0+f*dF,f===0); while(enc.encodeQueueSize>8) await new Promise(ok=>setTimeout(ok,4)); } off+=Math.round(p.dur*1e6); };
    v.muted=true; await seek(0);
    while(!cancelou){
      while(i<pausas.length&&pausas[i].t<=v.currentTime+.5/VD_FPS){ await congela(pausas[i]); i++; }
      if(v.currentTime>=V.fonte.dur-.02) break;
      const prox=pausas[i];
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
