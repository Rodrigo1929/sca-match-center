/* ---------- TV: apresentação automática e vídeo ---------- */
function pickerQuadros(box,pre){ const grupos=[["JOGO","Jogo (Onze, Encaixe, Intervalo, Estatística, Notas)"],["DEF","Defensivos"],["OF","Ofensivos"],["REF","Referência"]];
  grupos.forEach(([t,n])=>{ const ls=lances().filter(l=>l.tipo===t); if(!ls.length) return;
    const g=document.createElement("div"); g.style.cssText="border:1px solid var(--line);border-radius:10px;background:var(--surface-2)";
    g.innerHTML=`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px"><input type="checkbox" class="pdf-gr" style="width:20px;height:20px"><b style="flex:1;font-family:var(--f-display);font-size:15px"></b><button class="btn sm ghost pdf-ab">Escolher ▾</button></div><div class="pdf-ls" hidden style="display:flex;flex-direction:column;gap:2px;padding:0 10px 8px 40px"></div>`;
    const lst=g.querySelector(".pdf-ls"), gr=g.querySelector(".pdf-gr"), ab=g.querySelector(".pdf-ab");
    ls.forEach(L=>{ const l=document.createElement("label"); l.style.cssText="display:flex;gap:10px;align-items:center;font-size:14.5px;min-height:34px"; l.innerHTML=`<input type="checkbox" class="pdf-l" style="width:18px;height:18px"> <span></span>`; const i=l.querySelector("input"); i.value=L.id; i.checked=pre(L); l.querySelector("span").textContent=L.nome; lst.appendChild(l); });
    const sync=()=>{ const cs=[...lst.querySelectorAll("input")], k=cs.filter(c=>c.checked).length; gr.checked=k===cs.length; gr.indeterminate=k>0&&k<cs.length; g.querySelector("b").textContent=`${n} · ${k}/${cs.length}`; box.dispatchEvent(new Event("mudou")); };
    gr.onchange=()=>{ lst.querySelectorAll("input").forEach(c=>c.checked=gr.checked); sync(); }; lst.addEventListener("change",sync);
    ab.onclick=()=>{ const v=lst.hidden; lst.hidden=!v; ab.textContent=v?"Fechar ▴":"Escolher ▾"; }; box.appendChild(g); sync(); });
  return ()=>{ const ids=new Set([...box.querySelectorAll("input.pdf-l:checked")].map(i=>i.value)); return lances().filter(l=>ids.has(l.id)); }; }
let tvCfg=(()=>{ try{ return JSON.parse(localStorage.getItem("sca-tv"))||null; }catch(e){ return null; } })();
function guardaTvCfg(c){ tvCfg=c; try{ localStorage.setItem("sca-tv",JSON.stringify(c)); }catch(e){} gravaDoc("tv/config",c); }
function ordenaTV(it,ordem){ if(!ordem||!ordem.length) return it; const pos=new Map(ordem.map((k,i)=>[k,i])); let ult=-1;
  const rk=it.map((x,i)=>{ if(pos.has(x.k)){ ult=pos.get(x.k); return [ult,0,i]; } return [ult,1,i]; });
  return it.map((x,i)=>[x,rk[i]]).sort((a,b)=>a[1][0]-b[1][0]||a[1][1]-b[1][1]||a[1][2]-b[1][2]).map(a=>a[0]); }
/* duas TVs: Bolas paradas e Modelo de Jogo, cada uma com a sua escolha, ordem e tempo (guardados para todos os aparelhos) */
function folhaTV(modo0){ const C=tvCfg||{}, CM=C.modelo||{};
  let modo=modo0==="m"||modo0==="b"?modo0:(!$("view-m").hidden?"m":"b");
  const B={seg:C.seg||15,junta:C.junta!==false,ordem:(C.ordem||[]).slice(),conhec:new Set(C.conhecidos||[]),sel:new Set(C.sel||[])};
  const M={seg:CM.seg||8,ordem:(CM.ordem||[]).slice(),conhec:new Set(CM.conhecidos||C.conhecidosM||[]),sel:new Set(CM.sel||C.selM||[])};
  folha(`<h3>📺 TV antes do jogo</h3>
    <div class="seg" role="group" id="tv-modo" aria-label="O que mostrar"><button data-m="b">Bolas paradas</button><button data-m="m">Modelo de Jogo</button></div>
    <p class="sub" id="tv-ex" style="margin:0"></p>
    <div id="tv-g" style="display:flex;flex-direction:column;gap:6px;max-height:30vh;overflow:auto"></div>
    <div id="tv-jw"><h4>Juntar quadros do mesmo lado</h4><div class="seg" role="group" id="tv-j"><button data-j="1">Sim · vários por ecrã</button><button data-j="0">Não · um por ecrã</button></div></div>
    <h4 id="tv-st">Segundos por ecrã</h4><div class="seg" role="group" id="tv-s">${[5,8,10,15,20,30].map(x=>`<button data-s="${x}">${x} s</button>`).join("")}</div>
    <div style="display:flex;align-items:center;gap:8px"><h4 style="flex:1;margin:0">Ordem dos ecrãs</h4><button class="btn sm ghost" id="tv-r">Repor ordem</button></div>
    <div id="tv-o" style="display:flex;flex-direction:column;gap:4px;max-height:28vh;overflow:auto"></div>
    <p class="sub" id="tv-p" style="margin:0"></p>
    <div class="actions" style="justify-content:stretch;flex-wrap:wrap"><button class="btn" data-close>Fechar</button><button class="btn" id="tv-vs" style="flex:1;min-height:52px">⬇ Um vídeo por quadro</button><button class="btn" id="tv-v" style="flex:1;min-height:52px">⬇ Vídeo MP4</button><button class="btn primary" id="tv-ok" style="flex:1;min-height:52px">▶ Mostrar no ecrã</button></div>`,(s,fecha)=>{
    const box=s.querySelector("#tv-g"), pp=s.querySelector("#tv-p"), ob=s.querySelector("#tv-o");
    let lista=()=>[], listaM=()=>[];
    const E=()=>modo==="m"?M:B;
    const itens=()=>modo==="m"?ordenaTV(itensModeloTV(listaM()),M.ordem):ordenaTV(itensTV(lista(),B.junta),B.ordem);
    const n=()=>modo==="m"?listaM().length:lista().length;
    /* a escolha da TV que não está aberta mantém-se como estava */
    let tG=null; const grava=()=>{ clearTimeout(tG); tG=setTimeout(()=>guardaTvCfg({seg:B.seg,junta:B.junta,ordem:B.ordem,sel:[...B.sel],conhecidos:[...B.conhec],
      modelo:{seg:M.seg,ordem:M.ordem,sel:[...M.sel],conhecidos:[...M.conhec]}}),400); };
    const lembra=()=>{ if(modo==="m"){ M.sel=new Set(listaM()); M.conhec=new Set(Object.keys(modelos)); } else { B.sel=new Set(lista().map(l=>l.id)); B.conhec=new Set(lances().map(l=>l.id)); } };
    const mexe=(it,k,d)=>{ const ks=it.map(x=>x.k); const j=k+d; if(j<0||j>=ks.length) return; [ks[k],ks[j]]=[ks[j],ks[k]]; E().ordem=ks; resumo(); grava(); };
    const resumo=()=>{ const it=itens(), t=Math.round(it.reduce((a,x)=>a+tempoItemTV(x,E().seg),0));
      pp.innerHTML=n()?`${n()} quadros em <b>${it.length} ecrãs</b> · ciclo de ${Math.floor(t/60)} min ${t%60} s`:"Nenhum quadro selecionado";
      ob.innerHTML=""; it.forEach((x,k)=>{ const row=document.createElement("div"); row.style.cssText="display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:8px;padding:2px 4px 2px 10px;background:var(--surface-2)";
        row.innerHTML=`<b style="width:22px;color:var(--muted)">${k+1}</b><span style="flex:1;font-size:14.5px"></span><button class="btn sm ghost" aria-label="Subir" style="min-width:44px">▲</button><button class="btn sm ghost" aria-label="Descer" style="min-width:44px">▼</button>`;
        row.querySelector("span").textContent=x.titulo+(x.ids.length>1?` (${x.ids.length})`:"");
        const [up,dn]=row.querySelectorAll("button"); up.disabled=k===0; dn.disabled=k===it.length-1; up.onclick=()=>mexe(it,k,-1); dn.onclick=()=>mexe(it,k,1); ob.appendChild(row); }); };
    let pronto=false; box.addEventListener("mudou",()=>{ if(!pronto) return; lembra(); resumo(); grava(); });
    const ps=()=>s.querySelectorAll("#tv-s button").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.s===E().seg)));
    const pj=()=>s.querySelectorAll("#tv-j button").forEach(b=>b.setAttribute("aria-pressed",String((b.dataset.j==="1")===B.junta)));
    const monta=()=>{ pronto=false; box.innerHTML=""; lista=()=>[]; listaM=()=>[];
      s.querySelectorAll("#tv-modo button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.m===modo)));
      const m=modo==="m"; s.querySelector("#tv-jw").hidden=m; s.querySelector("#tv-vs").hidden=!m;
      s.querySelector("#tv-st").textContent=m?"Segundos mínimos por ecrã (a animação passa sempre inteira)":"Segundos por ecrã";
      s.querySelector("#tv-ex").textContent=m?"Os quadros animados do Modelo de Jogo, em ciclo, um por ecrã.":"Os quadros das bolas paradas e do jogo, em ciclo.";
      if(m){ if(!Object.keys(modelos).length) box.innerHTML=`<p class="sub" style="margin:0">Ainda não há quadros do Modelo de Jogo.</p>`;
        else listaM=pickerModelo(box,id=>M.conhec.has(id)?M.sel.has(id):true); }
      else lista=pickerQuadros(box,L=>B.conhec.has(L.id)?B.sel.has(L.id):(L.id==="onze"||L.tipo==="DEF"||L.tipo==="OF"));
      lembra(); pj(); ps(); resumo(); pronto=true; };
    s.querySelectorAll("#tv-modo button").forEach(b=>b.onclick=()=>{ if(b.dataset.m===modo) return; modo=b.dataset.m; monta(); });
    s.querySelectorAll("#tv-j button").forEach(b=>b.onclick=()=>{ const nj=b.dataset.j==="1"; if(nj===B.junta) return; B.junta=nj; B.seg=B.junta?Math.max(B.seg,15):Math.min(B.seg,8); pj(); ps(); resumo(); grava(); });
    s.querySelectorAll("#tv-s button").forEach(b=>b.onclick=()=>{ E().seg=+b.dataset.s; ps(); resumo(); grava(); });
    s.querySelector("#tv-r").onclick=()=>{ E().ordem=[]; resumo(); grava(); };
    monta();
    const falha=err=>{ if(err?.code!=="declined") pp.textContent="Não foi possível gerar o vídeo ("+(err?.code||err?.message||"erro")+")."; };
    s.querySelector("#tv-ok").onclick=()=>{ if(!n()){ toast("Escolhe pelo menos um quadro."); return; } grava(); fecha(); modoTV(itens(),E().seg); };
    s.querySelector("#tv-v").onclick=async e=>{ if(!n()){ toast("Escolhe pelo menos um quadro."); return; } grava(); const bt=e.currentTarget; bt.disabled=true;
      try{ await exportaVideo(itens(),E().seg,m=>pp.textContent=m); fecha(); }catch(err){ falha(err); } finally{ bt.disabled=false; } };
    s.querySelector("#tv-vs").onclick=async e=>{ if(!n()){ toast("Escolhe pelo menos um quadro."); return; } grava(); const bt=e.currentTarget; bt.disabled=true;
      try{ await exportaVideosSeparados(itens().map(x=>x.modelo),0,m=>pp.textContent=m); fecha(); }catch(err){ falha(err); } finally{ bt.disabled=false; } };
  }); }
function grupoTV(L){ const n=L.nome||"", lado=/esq/i.test(n)?"Esq":/dir/i.test(n)?"Dir":"", nl={Esq:" Esquerda",Dir:" Direita","":""}[lado];
  if(L.tipo==="DEF") return ["1DEF","Bolas Paradas Defensivas"]; if(L.tipo==="REF") return ["1REF","Referências"]; if(L.tipo!=="OF") return null;
  if(/canto|cristo/i.test(n)) return ["2C"+lado,"Cantos"+nl]; if(/livre/i.test(n)) return ["3L"+lado,"Livres"+nl];
  if(/lan[cç]amento/i.test(n)) return ["4T"+lado,"Lançamentos"+nl]; return ["5O","Outros lances ofensivos"]; }
function itensTV(lista,junta){ if(!junta){ const refs=lista.filter(L=>L.tipo==="REF"), out=[]; let posto=false;
    lista.forEach(L=>{ if(L.tipo!=="REF"||refs.length<2){ out.push({k:"L:"+L.id,titulo:L.nome,ids:[L.id]}); return; } if(posto) return; posto=true;
      const np=Math.ceil(refs.length/6); for(let p=0;p<np;p++) out.push({k:"G:1REF:"+p,titulo:"Referências"+(np>1?` (${p+1}/${np})`:""),ids:refs.slice(p*6,p*6+6).map(l=>l.id)}); });
    return out; }
  const antes=[], depois=[], g=new Map();
  lista.forEach(L=>{ const k=grupoTV(L); if(!k){ (g.size?depois:antes).push({k:"L:"+L.id,titulo:L.nome,ids:[L.id]}); return; } if(!g.has(k[0])) g.set(k[0],{titulo:k[1],ls:[]}); g.get(k[0]).ls.push(L); });
  const ord=[...g.keys()].sort((a,b)=>{ const o=x=>x.replace("Esq","0").replace("Dir","1"); return o(a)<o(b)?-1:1; });
  const meio=[]; ord.forEach(k=>{ const G=g.get(k), np=Math.ceil(G.ls.length/6); for(let p=0;p<np;p++){ const fat=G.ls.slice(p*6,p*6+6); meio.push({k:"G:"+k+":"+p,titulo:G.titulo+(np>1?` (${p+1}/${np})`:""),ids:fat.map(l=>l.id)}); } });
  return [...antes,...meio,...depois]; }
function desenhaItemTV(it){ const ls=it.ids.map(id=>lances().find(l=>l.id===id)).filter(Boolean); if(!ls.length) return null;
  if(ls.length===1) return desenha(ls[0],{clean:true,semAnim:true});
  const VW=1920, VH=1080, svg=document.createElementNS(NS,"svg"); svg.setAttribute("viewBox",`0 0 ${VW} ${VH}`); svg.setAttribute("class","mos");
  el("rect",{x:0,y:0,width:VW,height:VH,fill:"#fff"},svg);
  const t=el("text",{x:40,y:72,"font-size":58,"font-weight":700,class:"legtxt"},svg); el("tspan",{fill:"#000"},t).textContent=it.titulo;
  if(jogo.adversario) el("tspan",{fill:"#C00000"},t).textContent=" · vs "+jogo.adversario;
  el("rect",{x:40,y:92,width:VW-80,height:6,fill:"#C9B26B"},svg);
  const n=ls.length, cols=n<=3?n:n===4?2:3, rows=n<=3?1:2, gap=24, top=118, bot=VH-20, aw=VW-80;
  const cw0=(aw-gap*(cols-1))/cols, ch0=(bot-top-gap*(rows-1))/rows, cw=Math.min(cw0,ch0*4/3), ch=cw*3/4;
  const ox=40+(aw-(cw*cols+gap*(cols-1)))/2, oy=top+((bot-top)-(ch*rows+gap*(rows-1)))/2;
  ls.forEach((L,i)=>{ const c=i%cols, r_=Math.floor(i/cols), linha=Math.min(cols,n-r_*cols), dx=(cols-linha)*(cw+gap)/2;
    const x=ox+dx+c*(cw+gap), y=oy+r_*(ch+gap), sv=desenha(L,{clean:true,semAnim:true});
    sv.setAttribute("x",x); sv.setAttribute("y",y); sv.setAttribute("width",cw); sv.setAttribute("height",ch); svg.appendChild(sv);
    el("rect",{x,y,width:cw,height:ch,fill:"none",stroke:"#bbb","stroke-width":2},svg); });
  return svg; }
let tvEstado=null;
async function modoTV(itens,seg){ const ids=itens; const root=document.createElement("div"); root.className="tv"; root.innerHTML=`<div class="tvst"></div><div class="tvprog" style="width:0"></div><div class="tvbar off"><button id="tv-a">‹</button><button id="tv-pa">⏸ Pausa</button><button id="tv-b">›</button><span id="tv-n" style="min-width:140px;text-align:center"></span><button id="tv-x">Sair</button></div>`;
  document.body.appendChild(root); let k=0, pausa=false, timer=null, barT=null, wl=null;
  try{ wl=await navigator.wakeLock?.request("screen"); }catch(e){}
  try{ await (root.requestFullscreen?.()||root.webkitRequestFullscreen?.()); }catch(e){}
  const bar=root.querySelector(".tvbar"), prog=root.querySelector(".tvprog");
  let anim=null, animK=-1;
  const mostra=()=>{ const it=itens[k], st=root.querySelector(".tvst"), dur=tempoItemTV(it,seg);
    if(it.modelo&&anim&&animK===k){ if(pausa) anim.pause(); else if(!anim.playing) anim.play(); }
    else { if(anim) anim.pause(); anim=null; animK=-1; st.innerHTML="";
      if(it.modelo){ const Q=modelos[it.modelo]; if(Q){ anim=playerModelo(Q,{loop:true}); animK=k; st.appendChild(anim.svg); if(!pausa) anim.play(0); } }
      else { const sv=desenhaItemTV(it); if(sv) st.appendChild(sv); } }
    root.querySelector("#tv-n").textContent=`${k+1}/${itens.length} · ${it.titulo}`;
    prog.style.transition="none"; prog.style.width="0"; requestAnimationFrame(()=>{ prog.style.transition=pausa?"none":`width ${dur}s linear`; if(!pausa) prog.style.width="100%"; });
    clearTimeout(timer); if(!pausa) timer=setTimeout(()=>{ k=(k+1)%ids.length; mostra(); },dur*1000); };
  const mostraBar=()=>{ bar.classList.remove("off"); root.style.cursor="default"; clearTimeout(barT); barT=setTimeout(()=>{ bar.classList.add("off"); root.style.cursor="none"; },3000); };
  root.addEventListener("pointermove",mostraBar); root.addEventListener("click",e=>{ if(!e.target.closest(".tvbar")) mostraBar(); });
  const sair=()=>{ if(anim) anim.pause(); clearTimeout(timer); clearTimeout(barT); try{ wl?.release(); }catch(e){} try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){} root.remove(); document.removeEventListener("keydown",kd); tvEstado=null; };
  const kd=e=>{ if(e.key==="Escape") sair(); if(e.key==="ArrowRight"){ k=(k+1)%ids.length; mostra(); } if(e.key==="ArrowLeft"){ k=(k-1+ids.length)%ids.length; mostra(); } if(e.key===" "){ e.preventDefault(); root.querySelector("#tv-pa").click(); } };
  document.addEventListener("keydown",kd);
  root.querySelector("#tv-x").onclick=sair; root.querySelector("#tv-a").onclick=()=>{ k=(k-1+ids.length)%ids.length; mostra(); mostraBar(); }; root.querySelector("#tv-b").onclick=()=>{ k=(k+1)%ids.length; mostra(); mostraBar(); };
  root.querySelector("#tv-pa").onclick=e=>{ pausa=!pausa; e.currentTarget.textContent=pausa?"▶ Continuar":"⏸ Pausa"; mostra(); mostraBar(); };
  tvEstado={sair}; mostra(); mostraBar(); }
async function exportaVideo(lista,seg,progresso){ const Wv=1920,Hv=1080,fpsS=5,fpsM=25, temM=lista.some(x=>x.modelo), css=await cssFontes(); try{ await document.fonts.ready; if(temM){ await document.fonts.load('700 40px "RC Modelo"'); await mCarregaImgs(); } }catch(e){}
  const cv=document.createElement("canvas"); cv.width=Wv; cv.height=Hv; const cx=cv.getContext("2d");
  const imgs=[]; for(let k=0;k<lista.length;k++){ progresso(`A preparar ${k+1} de ${lista.length}: ${lista[k].titulo}`);
    if(lista[k].modelo){ const Q=modelos[lista[k].modelo]; imgs.push(Q?{Q,dur:tempoItemTV(lista[k],seg)}:null); continue; }
    const sv=desenhaItemTV(lista[k]); if(!sv){ imgs.push(null); continue; } const mos=sv.getAttribute("class")==="mos", jpg=await svgParaJpeg(sv,css,mos?1920:1440,1080); const im=new Image(); await new Promise((ok,ko)=>{ im.onload=ok; im.onerror=ko; im.src=jpg; }); imgs.push({im,mos,dur:seg}); }
  const pinta=(k,sec)=>{ const I=imgs[k]; if(I.Q){ pintaModeloCanvas(cx,I.Q,mT(I.Q,Math.min(sec||0,mDur(I.Q))),Wv,Hv); return; } const {im,mos}=I; cx.fillStyle="#111"; cx.fillRect(0,0,Wv,Hv); if(mos) cx.drawImage(im,0,0,Wv,Hv); else cx.drawImage(im,(Wv-1440)/2,0,1440,1080); };
  const so1M=lista.length===1&&lista[0].modelo&&modelos[lista[0].modelo];
  const soM=lista.every(x=>x.modelo), hoje=new Date().toISOString().slice(0,10);
  const nomeF=so1M?`SCA_Modelo_${String(modelos[lista[0].modelo].nome).replace(/[^\wÀ-ÿ-]+/g,"_")}`:soM?`SCA_Modelo_de_Jogo_${hoje}`:`SCA_Quadros_TV_${(jogo.adversario||"jogo").replace(/[^\wÀ-ÿ-]+/g,"_")}_${jogo.data||new Date().toISOString().slice(0,10)}`;
  const totS=imgs.reduce((a,I)=>a+(I?I.dur:0),0);
  let dados=null, ext="mp4";
  if(window.VideoEncoder&&window.VideoFrame){
    if(!window.Mp4Muxer) await carregaScript("https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.js");
    let cfg=null; for(const codec of ["avc1.640028","avc1.4d0028","avc1.42e028"]){ const c={codec,width:Wv,height:Hv,bitrate:temM?5_000_000:2_500_000,framerate:temM?fpsM:fpsS}; try{ if((await VideoEncoder.isConfigSupported(c)).supported){ cfg=c; break; } }catch(e){} }
    if(cfg){ const muxer=new Mp4Muxer.Muxer({target:new Mp4Muxer.ArrayBufferTarget(),video:{codec:"avc",width:Wv,height:Hv},fastStart:"in-memory"});
      let erro=null; const enc=new VideoEncoder({output:(ch,meta)=>muxer.addVideoChunk(ch,meta),error:e=>{ erro=e; }}); enc.configure(cfg);
      let tUs=0;
      for(let k=0;k<lista.length;k++){ const I=imgs[k]; if(!I) continue; progresso(`A gravar vídeo ${k+1} de ${lista.length}…`); const fps=I.Q?fpsM:fpsS, nF=Math.max(1,Math.round(I.dur*fps)), dUs=Math.round(1e6/fps);
        if(!I.Q) pinta(k,0);
        for(let f=0;f<nF;f++){ if(I.Q) pinta(k,f/fps); const fr=new VideoFrame(cv,{timestamp:tUs,duration:dUs}); enc.encode(fr,{keyFrame:f===0||(I.Q&&f%50===0)}); fr.close(); tUs+=dUs;
          while(enc.encodeQueueSize>8) await new Promise(ok=>setTimeout(ok,5)); if(erro) throw erro; } }
      await enc.flush(); if(erro) throw erro; muxer.finalize(); dados=new Uint8Array(muxer.target.buffer); }
  }
  if(!dados){ /* recurso: gravação em tempo real (WebM) */
    if(!window.MediaRecorder||!cv.captureStream) throw new Error("este browser não grava vídeo");
    ext=MediaRecorder.isTypeSupported("video/mp4")?"mp4":"webm"; const st=cv.captureStream(temM?fpsM:fpsS), rec=new MediaRecorder(st,{mimeType:ext==="mp4"?"video/mp4":"video/webm",videoBitsPerSecond:temM?5_000_000:2_500_000}); const partes=[];
    rec.ondataavailable=e=>{ if(e.data.size) partes.push(e.data); }; const fim=new Promise(ok=>rec.onstop=ok); rec.start(1000);
    let falta=totS;
    for(let k=0;k<lista.length;k++){ const I=imgs[k]; if(!I) continue;
      if(I.Q){ const t0=performance.now(); let el_=0; while(el_<I.dur){ pinta(k,el_); progresso(`A gravar em tempo real ${k+1}/${lista.length} · faltam ${Math.ceil(falta-el_)} s`); await new Promise(ok=>setTimeout(ok,1000/fpsM)); el_=(performance.now()-t0)/1000; } falta-=I.dur; }
      else { pinta(k,0); for(let x=0;x<I.dur;x++){ progresso(`A gravar em tempo real ${k+1}/${lista.length} · faltam ${Math.ceil(falta-x)} s`); await new Promise(ok=>setTimeout(ok,1000)); pinta(k,0); } falta-=I.dur; } }
    rec.stop(); await fim; dados=new Uint8Array(await new Blob(partes).arrayBuffer()); }
  progresso("A guardar…");
  let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
  if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([dados],{type:"video/"+ext})); a.download=nomeF+"."+ext; document.body.appendChild(a); a.click(); a.remove(); return; }
  await dl.save({filename:nomeF+"."+ext,data:dados}); toast(`Vídeo guardado · ${lista.length} ${lista.length===1?"ecrã":"ecrãs"} · ${totS<90?Math.round(totS)+" s":Math.round(totS/60*10)/10+" min"}`); }
/* gravação com fila de pendentes (sobrevive a falhas de rede e a recarregar a página) */
const PEND_KEY="sca-pendentes"; let pendentes={}, pendSeq=0, pend=0;
try{ pendentes=JSON.parse(localStorage.getItem(PEND_KEY)||"{}")||{}; }catch(e){ pendentes={}; }
function salvaPend(){ try{ localStorage.setItem(PEND_KEY,JSON.stringify(pendentes)); }catch(e){} }
function nPend(){ return Object.keys(pendentes).length; }
function estadoPend(falhou){ if(!db) return; const n=nPend();
  if(!n){ setStatus("ok","Guardado · sincronizado"); return; }
  const t=`${n} ${n===1?"alteração":"alterações"} por enviar`;
  setStatus(falhou||navigator.onLine===false?"local":"busy",(falhou||navigator.onLine===false?"Sem rede — ":"A enviar — ")+t+(falhou?" (reenvio automático)":"")); }
function comTempo(p,ms){ return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej({code:"timeout"}),ms))]); }
let emVoo=0; const filaVoo=[];
function vaga(){ return new Promise(ok=>{ if(emVoo<6){ emVoo++; ok(); } else filaVoo.push(ok); }); }
function liberta(){ const nx=filaVoo.shift(); if(nx) nx(); else emVoo=Math.max(0,emVoo-1); }
function envia(path){ const P=pendentes[path]; if(!P||!db||soLeitura) return; const st=P.s;
  queues[path]=(queues[path]||Promise.resolve()).catch(()=>{}).then(()=>{ const cur=pendentes[path]; if(!cur||cur.s!==st) return;
      return vaga().then(()=>comTempo(cur.del?db.doc(path).delete():db.doc(path).set({...cur.b,atualizadoEm:new Date().toISOString()}),15000)).finally(liberta); })
    .then(()=>{ if(pendentes[path]&&pendentes[path].s===st){ delete pendentes[path]; salvaPend(); } estadoPend(false); })
    .catch(e=>{ if(e?.code==="invalid_argument"||e?.code==="permission_denied"){ setStatus("local","Só leitura: sem permissão para gravar"); return; } estadoPend(true); }); }
function gravaDoc(path,body){
  if(!db){ setStatus("local","Guardado só neste aparelho"); return; }
  if(soLeitura) return;
  pendentes[path]={s:(++pendSeq)+"-"+Date.now(),b:body}; salvaPend(); estadoPend(false); envia(path); }
function apagaDoc(path){ if(!db||soLeitura) return; pendentes[path]={s:(++pendSeq)+"-"+Date.now(),del:true}; salvaPend(); envia(path); }
function reenviaTudo(){ if(!db) return; Object.keys(pendentes).forEach(envia); }
window.addEventListener("online",()=>{ reenviaTudo(); estadoPend(false); });
window.addEventListener("offline",()=>estadoPend(true));
setInterval(()=>{ if(db&&nPend()) reenviaTudo(); },20000);
document.addEventListener("visibilitychange",()=>{ if(!document.hidden&&db&&nPend()) reenviaTudo(); });
/* versão do servidor nunca substitui o que ainda está por enviar */
function mergeCol(prefixo,m,local){ Object.entries(pendentes).forEach(([p,v])=>{ if(!p.startsWith(prefixo)) return; const id=p.slice(prefixo.length); if(v.del) delete m[id]; else if(local[id]) m[id]=local[id]; }); return m; }
function guardaEst(n,soft){ est=normEst(n); guardaLocal(); soft?(renderNav(),renderBoard(),renderRows(),renderForm()):render(); gravaDoc("estado/atual",est); }
function guardaJogo(n,soft){ const antes=jogo; jogo=normJogo(n); guardaLocal(); if(!soft){ renderJogo(); } render();
  gravaCol("eventos",antes.eventos,jogo.eventos); gravaCol("subs",antes.subs,jogo.subs); gravaCol("subsAdv",antes.subsAdv||[],jogo.subsAdv);
  const sem=j=>semCol(semCol(semCol(j,"eventos"),"subs"),"subsAdv"), base=j=>JSON.stringify(sem(j)); if(base(antes)!==base(jogo)||!jogoMigrado){ jogoMigrado=true; gravaDoc("jogo/atual",sem(jogo)); } renderSubsAdv(); }
const EIXO={s03:["x",34252],s04:["x",34252],s05:["x",34252],"b-meio":["x",34252],s07:["x",45720],s08:["x",33293],s09:["x",33293],s10:["x",33293],s11:["x",33293],s12:["x",33293],s13:["x",33293],s14:["x",33293],s15:["y",38462]};
function eixoDe(L){ if(EIXO[L.fundo]) return EIXO[L.fundo]; const f=FUNDOS[L.fundo]?.campo; return f?["y",Math.round((f[1]+f[3])/2)]:["x",W/2]; }
function espelha(L){ const C=clone(L), [ax,c]=eixoDe(L), m=v=>Math.round(2*c-v);
  const P=(o,a,b)=>{ if(o[a]!=null) o[a]=m(o[a]); if(b&&o[b]!=null) o[b]=m(o[b]); };
  const k=ax==="x"?["cx","x1","x2","qx"]:["cy","y1","y2","qy"];
  [...(C.bolas||[]),...(C.adv||[]),...(C.bj||[])].forEach(o=>P(o,k[0]));
  (C.setas||[]).forEach(o=>{ P(o,k[1],k[2]); P(o,k[3]); });
  (C.formas||[]).forEach(F=>{ if(ax==="x") F.x=Math.round(2*c-(F.x+F.w)); else F.y=Math.round(2*c-(F.y+F.h)); });
  (C.textos||[]).forEach(T=>{ const txt=(T.paras||[]).map(p=>(p.runs||[]).map(r_=>r_.t).join("")).join("").trim();
    if(txt.length&&txt.length<=4){ if(ax==="x") T.x=Math.round(2*c-(T.x+T.w)); else T.y=Math.round(2*c-(T.y+T.h)); }
    (T.paras||[]).forEach(p=>(p.runs||[]).forEach(r_=>{ r_.t=trocaPal(r_.t); })); });
  return C; }
function trocaPal(t){ const M={Direito:"Esquerdo",Esquerdo:"Direito",Direita:"Esquerda",Esquerda:"Direita",direito:"esquerdo",esquerdo:"direito",direita:"esquerda",esquerda:"direita",DIREITO:"ESQUERDO",ESQUERDO:"DIREITO",DIREITA:"ESQUERDA",ESQUERDA:"DIREITA"};
  return String(t).replace(/Direit[oa]|Esquerd[oa]|direit[oa]|esquerd[oa]|DIREIT[OA]|ESQUERD[OA]/g,w=>M[w]||w); }
function trocaLado(n){ const T=[["Esquerdo","Direito"],["Esquerda","Direita"],["Esq.","Dir."],["Esq","Dir"],["esquerdo","direito"],["esquerda","direita"]];
  let out=n, mudou=false; out=out.replace(/Esquerdo|Direito|Esquerda|Direita|Esq\.|Dir\.|\bEsq\b|\bDir\b|esquerdo|direito|esquerda|direita/g,w=>{ for(const [a,b] of T){ if(w===a){mudou=true;return b;} if(w===b){mudou=true;return a;} } return w; });
  return mudou?out:n+" (espelhado)"; }
function folhaDup(){ const L=lanceAtual();
  if(L.dinamico){ duplicaLance(false); return; }
  const [ax]=eixoDe(L);
  folha(`<h3>Duplicar “${esc(L.nome)}”</h3><p class="sub" style="margin:0">A cópia fica a seguir ao original. Legendas e textos ficam iguais.</p>
    <div class="actions" style="justify-content:stretch"><button class="btn" id="dp-i" style="flex:1;min-height:56px">⧉ Igual</button><button class="btn primary" id="dp-e" style="flex:1;min-height:56px">⇄ Espelhado (${ax==="x"?"lado contrário":"outro corredor"})</button></div>
    <div class="actions"><button class="btn" data-close>Cancelar</button></div>`,(s,fecha)=>{
    s.querySelector("#dp-i").onclick=()=>{ fecha(); duplicaLance(false); }; s.querySelector("#dp-e").onclick=()=>{ fecha(); duplicaLance(true); }; }); }
function duplicaLance(esp){ const L=lanceAtual();
  if(L.dinamico){ toast(L.dinamico==="onze"?"O Onze Titular é sempre o do jogo — duplica antes as Indicações ou cria um lance novo.":L.dinamico==="encaixe"?"O Encaixe é sempre o do jogo e não se duplica.":"As Notas do Jogo não se duplicam."); return; }
  const id="L"+Date.now().toString(36), nomes=new Set(lances().map(l=>l.nome));
  const b0=esp?trocaLado(L.nome):L.nome+" (cópia)"; let nm=b0, k=2; while(nomes.has(nm)) nm=`${b0} ${k++}`;
  const N={...(esp?espelha(L):clone(L)),id,nome:nm,ordem:(L.ordem||0)+0.5}; delete N.original; delete N.apagado;
  const ids=lances().map(l=>l.id); ids.splice(ids.indexOf(L.id)+1,0,id);
  est={...est,ordem:ids}; gravaDoc("estado/atual",est);
  curId=id; guardaLance(N);
  toast(`“${nm}” criado a seguir ao original`,()=>{ const C=clone(lancesDb[id]); C.apagado=true; curId=L.id; est={...est,ordem:est.ordem.filter(x=>x!==id)}; gravaDoc("estado/atual",est); guardaLance(C); }); }
$("btn-dup")&&($("btn-dup").onclick=folhaDup);
$("btn-undo").onclick=desfazQuadro;
document.addEventListener("keydown",e=>{ if((e.ctrlKey||e.metaKey)&&(e.key==="z"||e.key==="Z")&&$("view-a").hidden&&$("view-v").hidden&&$("view-m").hidden&&$("view-x").hidden&&$("view-u").hidden&&!$("sheet-root").innerHTML){ const t=e.target.tagName||""; if(/INPUT|TEXTAREA|SELECT/.test(t)||e.target.isContentEditable) return; e.preventDefault(); desfazQuadro(); } });
$("btn-pdf")&&($("btn-pdf").onclick=folhaPdf);
$("btn-tv").onclick=()=>folhaTV();
/* desfazer alterações nos quadros (bolinhas, setas, textos, onze…) */
let undoQ=[], aDesfazer=false;
function pushUndo(it){ if(aDesfazer) return; undoQ.push(it); if(undoQ.length>60) undoQ.shift(); atualizaUndo(); }
function atualizaUndo(){ const b=$("btn-undo"); if(b) b.disabled=!undoQ.length; const pb=document.getElementById("pundo"); if(pb) pb.disabled=!undoQ.length; }
function desfazQuadro(){ const it=undoQ.pop(); if(!it){ toast("Nada para desfazer."); return; } aDesfazer=true;
  try{ if(it.tipo==="onze") guardaJogo({...jogo,onze:it.antes});
    else if(it.tipo==="encaixe") guardaJogo({...jogo,encaixe:it.antes},true);
    else if(it.tipo==="advonze") guardaAdvJogo({...advJ(),onze:it.antes});
    else if(it.antes) guardaLance(it.antes);
    else { delete lancesDb[it.id]; apagaDoc("lances/"+it.id); guardaLocal(); render(); } }
  finally{ aDesfazer=false; } atualizaUndo(); if(presentOpen) renderPresent(); toast("Alteração desfeita"); }
function guardaLance(L){ pushUndo({tipo:"lance",id:L.id,antes:lancesDb[L.id]?clone(lancesDb[L.id]):null}); const C=clone(L); delete C.original; lancesDb[C.id]=C; guardaLocal(); render(); gravaDoc("lances/"+C.id,C); }
