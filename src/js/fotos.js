/* ---------- Fotos dos atletas (v100) ----------
   fotos/{chave} = { img: { id, w, h }, alteradoPor, alteradoEm }   // a imagem (600×600, já recortada) fica no armazenamento do link (assets)
   chave = nº do plantel; jogadores de fora do plantel: "x-" + nome sem acentos (o mesmo atleta em várias UT) */
const FT_LS="sca-fotos-v1";
let fotos={};
try{ fotos=JSON.parse(localStorage.getItem(FT_LS)||"{}")||{}; }catch(e){}
function normFoto(d){ const s=v=>String(v??"").trim(), im=d.img||{}; if(!s(im.id)) throw new Error("foto");
  return {id:s(d.id),img:{id:s(im.id),w:Math.round(+im.w)||600,h:Math.round(+im.h)||600},alteradoPor:s(d.alteradoPor),alteradoEm:s(d.alteradoEm)}; }
Object.keys(fotos).forEach(id=>{ try{ fotos[id]=normFoto({...fotos[id],id}); }catch(e){ delete fotos[id]; } });
const guardaFotosLocal=()=>{ try{ localStorage.setItem(FT_LS,JSON.stringify(fotos)); }catch(e){} };
const fotoSlug=t=>String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");
/* chave da foto: atleta do plantel (n) ou de fora (k "e:<id>" com nome); nas tabelas da competição, a chave "n:<nº>" ou "x:<nome>" */
const fotoChave=a=>{ if(!a) return ""; const k=String(a.k??a.n??""); return k.startsWith("e:")?"x-"+fotoSlug(a.nome):k; };
const fotoDeChaveT=c=>{ c=String(c||""); return c.startsWith("n:")?c.slice(2):c.startsWith("x:")?"x-"+fotoSlug(c.slice(2)):c; };
const fotoUrl={};
const srcFoto=im=>fotoUrl[im.id]||"/_blob/"+im.id;
const iniciais=nome=>{ const w=String(nome||"").trim().split(/\s+/).filter(Boolean); return w.length?(w[0][0]+(w.length>1?w[w.length-1][0]:"")).toUpperCase():"?"; };
/* bolinha com a foto (ou as iniciais por baixo, quando não há foto ou não carrega) */
function fotoAv(ch,nome,cls=""){ const F=fotos[ch];
  return `<span class="fav${cls?" "+cls:""}" aria-hidden="true"><b>${esc(iniciais(nome))}</b>${F?`<img src="${esc(srcFoto(F.img))}" alt="" loading="lazy">`:""}</span>`; }
const gravaFoto=(ch,img)=>{ const N=normFoto({id:ch,img,alteradoPor:meuId||"",alteradoEm:new Date().toISOString()}); fotos[ch]=N; guardaFotosLocal(); gravaDoc("fotos/"+ch,N); fotosRefresca(); };
const tiraFoto=ch=>{ delete fotos[ch]; guardaFotosLocal(); apagaDoc("fotos/"+ch); fotosRefresca(); };
function fotosRefresca(){ const ptb=$("ptb"); if(ptb&&!ptb.contains(document.activeElement)) renderPlantel(); if(typeof compRefresca==="function") compRefresca(); }
function repoeFotos(B){ const X=B.fotos||{};
  Object.keys(fotos).forEach(id=>{ if(!X[id]){ delete fotos[id]; apagaDoc("fotos/"+id); } });
  Object.entries(X).forEach(([id,v])=>{ try{ fotos[id]=normFoto({...v,id}); gravaDoc("fotos/"+id,fotos[id]); }catch(e){} }); guardaFotosLocal(); }
function ligaFotosDb(){ if(!db) return;
  db.collection("fotos").onSnapshot(q=>{ if(q.metadata?.hasPendingWrites) return; const m={};
    q.docs.forEach(d=>{ const x=lerDoc(d); if(x){ delete x.atualizadoEm; try{ m[d.id]=normFoto({...x,id:d.id}); }catch(e){} } });
    mergeCol("fotos/",m,fotos); if(JSON.stringify(m)!==JSON.stringify(fotos)){ fotos=m; guardaFotosLocal(); fotosRefresca(); } },()=>{}); }
(()=>{ let n=0; const t=setInterval(()=>{ n++; if(db){ clearInterval(t); try{ ligaFotosDb(); }catch(e){} } else if(n>80) clearInterval(t); },250); })();

/* imagem a partir de um ficheiro ou de um blob */
const imgDeUrl=u=>new Promise((ok,ko)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=()=>ko(new Error("imagem")); i.src=u; });
async function imgDeBlob(b){ const u=URL.createObjectURL(b); try{ return await imgDeUrl(u); } finally{ setTimeout(()=>URL.revokeObjectURL(u),2000); } }
/* foto em círculo num canvas (para os PDF e o cartaz); null sem foto ou sem rede */
async function fotoCirculo(ch,px=300,borda=0,cor="#FFFFFF"){ const F=fotos[ch]; if(!F) return null;
  try{ const r=await fetch(srcFoto(F.img)); if(!r.ok) throw new Error("imagem"); const im=await imgDeBlob(await r.blob());
    const cv=document.createElement("canvas"); cv.width=cv.height=px; const c=cv.getContext("2d"), R=px/2;
    if(borda){ c.fillStyle=cor; c.beginPath(); c.arc(R,R,R,0,Math.PI*2); c.fill(); }
    c.save(); c.beginPath(); c.arc(R,R,R-borda,0,Math.PI*2); c.clip(); c.fillStyle="#fff"; c.fillRect(0,0,px,px); c.drawImage(im,borda,borda,px-2*borda,px-2*borda); c.restore(); return cv; }
  catch(e){ return null; } }
/* onde está a pessoa na foto: topo da cabeça e centro (fundo branco ou transparente), para o recorte automático */
function cabecaDe(im){ const W=200, H=Math.max(1,Math.round(im.naturalHeight*W/im.naturalWidth)), cv=document.createElement("canvas"); cv.width=W; cv.height=H;
  const c=cv.getContext("2d"); c.drawImage(im,0,0,W,H); let d; try{ d=c.getImageData(0,0,W,H).data; }catch(e){ return null; }
  const pes=(x,y)=>{ const i=(y*W+x)*4; return d[i+3]>40&&!(d[i]>235&&d[i+1]>235&&d[i+2]>235); };
  let t=-1; for(let y=0;y<H&&t<0;y++) for(let x=0;x<W;x+=2) if(pes(x,y)){ t=y; break; }
  if(t<0||t>H*.6) return null; let sx=0,n=0; for(let y=t;y<Math.min(H,t+.12*H);y++) for(let x=0;x<W;x+=2) if(pes(x,y)){ sx+=x; n++; }
  return n?{t:t/H,cx:sx/n/W}:null; }

/* ---------- folha da foto: escolher, enquadrar (arrastar e zoom) e guardar ---------- */
function folhaFoto(ch,nome){ if(!ch) return; const F=fotos[ch]; let im=null, z=1, ox=0, oy=0;
  folha(`<h3>Foto · ${esc(nome||"atleta")}</h3><p class="sub" style="margin:0">Aparece nos Rankings, na Competição, no cartaz do balneário e no PDF individual. Fica guardada no link para toda a equipa (600×600). Precisa de internet para carregar.</p>
    <div class="ft-ed"><canvas id="ft-cv" width="560" height="560" aria-label="Enquadramento da foto"></canvas><div class="ft-vazio" id="ft-v">${fotoAv(ch,nome,"xl")}</div></div>
    <div id="ft-z" hidden><label class="sub" for="ft-zr">Zoom · arrasta a foto para centrar a cara</label><input type="range" id="ft-zr" min="1" max="4" step="0.01" value="1"></div>
    <input type="file" id="ft-f" accept="image/*" hidden><p class="sub" id="ft-st" style="margin:0"></p>
    <div class="actions">${F?`<button class="btn danger l" id="ft-del">Tirar foto</button>`:""}<button class="btn" data-close>Fechar</button><button class="btn" id="ft-esc" disabled>${F?"Trocar foto":"Escolher foto"}</button><button class="btn primary" id="ft-ok" hidden>Guardar</button></div>`,async(s,fecha)=>{
    const q=x=>s.querySelector(x), cv=q("#ft-cv"), c=cv.getContext("2d"), st=q("#ft-st"), zr=q("#ft-zr"), P=cv.width;
    cv.hidden=true;
    const base=()=>im?P/Math.min(im.naturalWidth,im.naturalHeight):1;   // zoom 1 = o lado menor enche o quadrado
    const limita=()=>{ const k=base()*z, w=im.naturalWidth*k, h=im.naturalHeight*k; ox=Math.min(0,Math.max(P-w,ox)); oy=Math.min(0,Math.max(P-h,oy)); };
    const desenha=()=>{ if(!im) return; limita(); const k=base()*z; c.fillStyle="#fff"; c.fillRect(0,0,P,P); c.drawImage(im,ox,oy,im.naturalWidth*k,im.naturalHeight*k);
      c.save(); c.fillStyle="rgba(27,26,23,.45)"; c.beginPath(); c.rect(0,0,P,P); c.arc(P/2,P/2,P/2-4,0,Math.PI*2,true); c.fill("evenodd"); c.restore(); };
    if(q("#ft-del")) confirma2(q("#ft-del"),"Toca outra vez para tirar",()=>{ const antes=clone(fotos[ch]); fecha(); tiraFoto(ch); toast("Foto tirada",()=>{ fotos[ch]=antes; guardaFotosLocal(); gravaDoc("fotos/"+ch,antes); fotosRefresca(); }); });
    const A=typeof assetsEx==="function"?await assetsEx():null, esc_=q("#ft-esc");
    if(!A){ st.textContent="Neste aparelho não é possível carregar fotos: precisas de acesso de edição ao link no claude.ai."; return; }
    esc_.disabled=false; esc_.onclick=()=>q("#ft-f").click();
    q("#ft-f").onchange=async()=>{ const f=q("#ft-f").files[0]; if(!f) return; st.textContent="A abrir a foto…";
      try{ im=await imgDeBlob(f); }catch(e){ st.textContent="Não consegui abrir esse ficheiro como imagem."; return; }
      /* recorte automático: cabeça no terço de cima, quadrado com ~46% da largura (como nas fotos oficiais); senão, centro */
      const h=cabecaDe(im), W0=im.naturalWidth, H0=im.naturalHeight;
      if(h&&W0>=H0*.8){ const lado=Math.min(W0,H0,.46*W0); z=Math.min(W0,H0)/lado; const k=base()*z; ox=-(h.cx*W0-lado/2)*k; oy=-Math.max(0,h.t*H0-.06*lado)*k; }
      else { z=1; const k=base(); ox=(P-W0*k)/2; oy=(P-H0*k)/2; }
      zr.value=z; q("#ft-z").hidden=false; q("#ft-v").hidden=true; cv.hidden=false; q("#ft-ok").hidden=false; st.textContent=""; desenha(); };
    zr.oninput=()=>{ const k0=base()*z, cx=(P/2-ox)/k0, cy=(P/2-oy)/k0; z=+zr.value; const k=base()*z; ox=P/2-cx*k; oy=P/2-cy*k; desenha(); };
    let arr=null;
    cv.addEventListener("pointerdown",e=>{ if(!im) return; arr={x:e.clientX,y:e.clientY,ox,oy}; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove",e=>{ if(!arr) return; const r=cv.width/(cv.getBoundingClientRect().width||cv.width); ox=arr.ox+(e.clientX-arr.x)*r; oy=arr.oy+(e.clientY-arr.y)*r; desenha(); });
    ["pointerup","pointercancel"].forEach(t=>cv.addEventListener(t,()=>{ arr=null; }));
    q("#ft-ok").onclick=async()=>{ if(!im) return; if(navigator.onLine===false){ st.textContent="Sem internet: liga-te à rede para guardar a foto."; return; }
      const b=q("#ft-ok"); b.disabled=true; esc_.disabled=true; st.textContent="A enviar…";
      try{ const o=document.createElement("canvas"); o.width=o.height=600; const oc=o.getContext("2d"), f=600/P, k=base()*z*f; oc.fillStyle="#fff"; oc.fillRect(0,0,600,600); oc.drawImage(im,ox*f,oy*f,im.naturalWidth*k,im.naturalHeight*k);
        const blob=await new Promise(ok=>o.toBlob(ok,"image/jpeg",.86)); if(!blob) throw new Error("imagem");
        let r; try{ r=await A.upload(blob,{type:"image/jpeg"}); }catch(e){ if(e&&e.code==="store_unavailable"){ await new Promise(ok=>setTimeout(ok,1500)); r=await A.upload(blob,{type:"image/jpeg"}); } else throw e; }
        fotoUrl[r.id]=r.url; fecha(); gravaFoto(ch,{id:r.id,w:600,h:600}); toast("Foto guardada"); }
      catch(e){ b.disabled=false; esc_.disabled=false; st.textContent=(typeof ERR_ASSETS!=="undefined"&&e&&ERR_ASSETS[e.code])||"Não foi possível guardar a foto ("+((e&&(e.code||e.message))||"erro")+")."; } }; }); }
