/* ---------- exportar PDF dos quadros ---------- */
/* v113.5: as bibliotecas vêm embutidas na app (<script type="text/plain" id="lib-…">): funcionam sem rede. A CDN só fica para o caso de a cópia faltar. */
const LIB_EMB=[[/jspdf-autotable/,"lib-autotable"],[/jspdf\//,"lib-jspdf"],[/xlsx/,"lib-xlsx"],[/mp4-muxer/,"lib-mp4"]], libFeita={};
function carregaScript(src){ const e=LIB_EMB.find(([re])=>re.test(src)), el=e&&document.getElementById(e[1]);
  if(el&&el.textContent.length>1000){ if(!libFeita[e[1]]){ const s_=document.createElement("script"); s_.textContent=el.textContent; document.head.appendChild(s_); libFeita[e[1]]=true; } return Promise.resolve(); }
  return new Promise((ok,ko)=>{ const s_=document.createElement("script"); s_.src=src; s_.onload=ok; s_.onerror=()=>ko(new Error("script")); document.head.appendChild(s_); }); }
const _dataUrl={};
async function paraDataUrl(u){ if(IMG_DATA[u]) return IMG_DATA[u]; if(_dataUrl[u]) return _dataUrl[u]; const bl=await (await fetch(u)).blob();
  const d=await new Promise((ok,ko)=>{ const fr=new FileReader(); fr.onload=()=>ok(fr.result); fr.onerror=ko; fr.readAsDataURL(bl); }); _dataUrl[u]=d; return d; }
async function cssFontes(){ const f4=await paraDataUrl("fonts/rc-400.ttf"), f7=await paraDataUrl("fonts/rc-700.ttf");
  return `@font-face{font-family:"RC PDF";font-weight:400;src:url(${f4}) format("truetype")}@font-face{font-family:"RC PDF";font-weight:700;src:url(${f7}) format("truetype")}
  text{font-family:"RC PDF","Roboto Condensed","Arial Narrow",Arial,sans-serif}.num,.lbl{font-weight:700}`; }
async function svgParaJpeg(svg,css,larg,alt){ alt=alt||Math.round(larg*H/W); const C=svg.cloneNode(true); C.setAttribute("xmlns","http://www.w3.org/2000/svg"); C.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");
  C.setAttribute("width",larg); C.setAttribute("height",alt);
  const st=document.createElementNS("http://www.w3.org/2000/svg","style"); st.textContent=css; C.insertBefore(st,C.firstChild);
  for(const im of C.querySelectorAll("image")){ const h=im.getAttribute("href")||im.getAttribute("xlink:href"); if(h&&!h.startsWith("data:")){ try{ const d_=await paraDataUrl(h); im.setAttribute("href",d_); im.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",d_); }catch(e){} } }
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(C)],{type:"image/svg+xml"}));
  try{ const img=new Image(); await new Promise((ok,ko)=>{ img.onload=ok; img.onerror=()=>ko(new Error("svg")); img.src=url; }); if(img.decode) try{ await img.decode(); }catch(e){}
    const cv=document.createElement("canvas"); cv.width=larg; cv.height=alt; const cx=cv.getContext("2d"); cx.fillStyle="#fff"; cx.fillRect(0,0,cv.width,cv.height); cx.drawImage(img,0,0,cv.width,cv.height);
    return cv.toDataURL("image/jpeg",0.9); } finally { URL.revokeObjectURL(url); } }
function folhaPdf(){ const grupos=[["JOGO","Jogo (Onze, Possíveis Encaixes, Intervalo, Notas)",false],["DEF","Defensivos",true],["OF","Ofensivos",true],["REF","Referência",true]];
  folha(`<h3>Exportar PDF</h3><p class="sub" style="margin:0">Uma página por quadro, como no modo apresentação, com as trocas e alterações atuais.</p>
    <div id="pdf-g" style="display:flex;flex-direction:column;gap:6px;max-height:52vh;overflow:auto"></div>
    <p class="sub" id="pdf-p" style="margin:0"></p>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="pdf-ok">⬇ Gerar PDF</button></div>`,(s,fecha)=>{
    const box=s.querySelector("#pdf-g"), pp=s.querySelector("#pdf-p");
    const resumo=()=>{ const n=box.querySelectorAll("input.pdf-l:checked").length; pp.textContent=n?`${n} ${n===1?"quadro selecionado":"quadros selecionados"}`:"Nenhum quadro selecionado"; };
    grupos.forEach(([t,n,on])=>{ const ls=lances().filter(l=>l.tipo===t); if(!ls.length) return;
      const g=document.createElement("div"); g.style.cssText="border:1px solid var(--line);border-radius:10px;background:var(--surface-2)";
      g.innerHTML=`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px"><input type="checkbox" class="pdf-gr" style="width:20px;height:20px" aria-label="Grupo"><b style="flex:1;font-family:var(--f-display);font-size:15px"></b><button class="btn sm ghost pdf-ab" aria-expanded="false">Escolher ▾</button></div><div class="pdf-ls" hidden style="display:flex;flex-direction:column;gap:2px;padding:0 10px 8px 40px"></div>`;
      g.querySelector("b").textContent=n; const lst=g.querySelector(".pdf-ls"), gr=g.querySelector(".pdf-gr"), ab=g.querySelector(".pdf-ab");
      ls.forEach(L=>{ const l=document.createElement("label"); l.style.cssText="display:flex;gap:10px;align-items:center;font-size:14.5px;min-height:34px";
        l.innerHTML=`<input type="checkbox" class="pdf-l" style="width:18px;height:18px"> <span></span>`; const i=l.querySelector("input"); i.value=L.id; i.checked=on; l.querySelector("span").textContent=L.nome; lst.appendChild(l); });
      const sync=()=>{ const cs=[...lst.querySelectorAll("input")], k=cs.filter(c=>c.checked).length; gr.checked=k===cs.length; gr.indeterminate=k>0&&k<cs.length;
        g.querySelector("b").textContent=`${n} · ${k}/${cs.length}`; resumo(); };
      gr.onchange=()=>{ lst.querySelectorAll("input").forEach(c=>c.checked=gr.checked); sync(); };
      lst.addEventListener("change",sync);
      ab.onclick=()=>{ const v=lst.hidden; lst.hidden=!v; ab.setAttribute("aria-expanded",String(v)); ab.textContent=v?"Fechar ▴":"Escolher ▾"; };
      box.appendChild(g); sync(); });
    s.querySelector("#pdf-ok").onclick=async e=>{ const bt=e.currentTarget; if(bt.disabled) return;
      const ids=new Set([...box.querySelectorAll("input.pdf-l:checked")].map(i=>i.value)); const lista=lances().filter(l=>ids.has(l.id));
      if(!lista.length){ toast("Escolhe pelo menos um quadro."); return; }
      bt.disabled=true;
      try{
        pp.textContent="A preparar…";
        if(!window.jspdf) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
        const css=await cssFontes(); try{ await document.fonts.ready; }catch(e){}
        const doc=new window.jspdf.jsPDF({orientation:"landscape",unit:"pt",format:[720,540],compress:true});
        for(let k=0;k<lista.length;k++){ pp.textContent=`A desenhar ${k+1} de ${lista.length}: ${lista[k].nome}`;
          const jpg=await svgParaJpeg(desenha(lista[k],{clean:true,semAnim:true}),css,2000);
          if(k) doc.addPage([720,540],"landscape"); doc.addImage(jpg,"JPEG",0,0,720,540,undefined,"FAST"); }
        pp.textContent="A guardar…";
        const nomeF=`SCA_Bolas_Paradas_${(jogo.adversario||"quadros").replace(/[^\wÀ-ÿ-]+/g,"_")}_${jogo.data||new Date().toISOString().slice(0,10)}.pdf`;
        const buf=doc.output("arraybuffer");
        let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
        if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([buf],{type:"application/pdf"})); a.download=nomeF; document.body.appendChild(a); a.click(); a.remove(); fecha(); return; }
        await dl.save({filename:nomeF,data:new Uint8Array(buf)}); fecha(); toast(`PDF guardado · ${lista.length} páginas`);
      }catch(err){ bt.disabled=false;
        if(err?.code==="declined"){ pp.textContent=""; return; }
        pp.textContent=err?.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet e tenta de novo.":"Não foi possível gerar o PDF ("+(err?.code||err?.message||"erro")+")."; } };
  }); }
/* v113.2: um lance ligado com metade ou mais das peças soltas conta como setup próprio */
function eProprio(L){ if(!L||!L.base) return false; const n=Object.keys(pecasPos(L)).length; return n>0&&soltasDe(L).length>=n/2; }
/* variantes de um setup = o slide inicial + os lances que o seguem (sem posição própria) */
function grupoSetup(L){ if(eProprio(L)) return [L]; const B=(L.base&&baseDe(L))||L; return [B,...seguidoresDe(B.id).filter(x=>!eProprio(x))]; }
/* lê das caixas de texto de cada lance: «Sinal – …», «Sinais …:» + linhas, «Variantes:» / «Soluções:» + linhas */
function infoTextos(L){ const out={sinais:[],nota:"",lista:null,titLista:""};
  (L.textos||[]).forEach(T=>{ const ps=(T.paras||[]).map(P=>(P.runs||[]).map(r=>r.t||"").join("").trim()).filter(Boolean); if(!ps.length) return;
    const p0=ps[0]; let m;
    if((m=p0.match(/^sinal\s*[–—-]\s*(.+)$/i))) out.sinais.push(m[1].trim());
    else if(/^sinais\b/i.test(p0)){ const n=(p0.match(/\(([^)]*)\)/)||[])[1]; if(n) out.nota=n; out.sinais.push(...ps.slice(1)); }
    else if((m=p0.match(/^(variantes|soluções|solucoes)\s*:?\s*$/i))&&ps.length>1&&!out.lista){ out.titLista=m[1][0].toUpperCase()+m[1].slice(1).toLowerCase(); out.lista=ps.slice(1); } });
  return out; }
const RX_SINAL=/m[ãa]os?\b|bra[çc]os?|x no ar|cabe[çc]a|punho|dedo/i;
/* v113.3: nos cantos ofensivos entra também o Cristo Rei do mesmo lado (e a folha do Cristo Rei mostra os cantos desse lado) */
const ladoDe=L=>/\bdir/i.test(L.nome||"")?"D":/\besq/i.test(L.nome||"")?"E":"";
const eCristo=L=>L&&L.tipo==="OF"&&/^cristo rei/i.test(L.nome||""), eCantoOF=L=>L&&L.tipo==="OF"&&/^canto/i.test(L.nome||"");
function grupoPainel(L){ let G=grupoSetup(L);
  if(eCantoOF(G[0])){ const cr=lances().filter(x=>eCristo(x)&&ladoDe(x)===ladoDe(G[0])&&!G.includes(x)); G=G.concat(cr); }
  else if(eCristo(L)){ const B=lances().find(x=>eCantoOF(x)&&!x.base&&ladoDe(x)===ladoDe(L)&&seguidoresDe(x.id).length); if(B){ const g=grupoSetup(B); G=g.concat(G.filter(x=>!g.includes(x))); } }
  return G; }
function painelVariantes(svg,L){ const G=grupoPainel(L), infos=G.map(x=>({L:x,...infoTextos(x)})), comLista=infos.find(i=>i.lista);
  let itens=[], tit="Variantes e sinais";
  if(comLista){ tit=(comLista.titLista==="Soluções"?"Soluções":"Variantes")+" e sinais";
    itens=comLista.lista.map(t=>{ let nome=t, sinal="", m=t.match(/^(.*?)\s*\(([^()]*)\)\s*$/); if(m&&RX_SINAL.test(m[2])){ nome=m[1]; sinal=m[2]; }
      const chave=nome.replace(/^\d+[.)]\s*/,"").split(/\s+[-–]\s+/)[0].trim().toLowerCase();
      return {nome,sinais:sinal?[sinal]:[],atual:!!chave&&L.nome.toLowerCase().includes(chave)}; });
    if(!itens.some(i=>i.sinais.length)) tit=comLista.titLista==="Soluções"?"Soluções":"Variantes"; }
  else{ const comum=infos.length>1?infos[0].sinais.join("|"):null;
    itens=infos.map(i=>({nome:i.L.nome,sinais:i.sinais,nota:i.nota,atual:i.L.id===L.id}));
    if(!itens.some(i=>i.sinais.length)) return; }
  /* fundos de campo inteiro (sem espaço livre à direita): a folha alarga para a direita e o quadro fica ao lado */
  const cheio=["s15","pitch","pitch-full","pitch-setores","pitch-espacos"].includes(L.fundo)||(L.bolas||[]).concat(L.adv||[]).some(b=>b.cx>66500), EXT=25500;
  if(cheio) svg.setAttribute("viewBox",`0 0 ${W+EXT} ${H}`);
  const x0=cheio?W+1800:68300, x1=cheio?W+EXT-1800:89700, wMax=x1-x0-900, y0=9200, y1=66600;
  const linhas=(t,fs,w)=>{ const out=[]; let cur=""; String(t).split(/\s+/).forEach(p=>{ const c=cur?cur+" "+p:p; if(cur&&textW(c,fs,w)>wMax){ out.push(cur); cur=p; } else cur=c; }); if(cur) out.push(cur); return out; };
  const monta=k=>{ const fN=12.5*PT*k, fS=11*PT*k, fH=13*PT*k, ops=[]; let y=fH*1.1;
    ops.push(["h",tit.toUpperCase(),fH,y]); y+=fH*.55; ops.push(["ln",y]); y+=fH*1.25;
    itens.forEach((it,ix)=>{ const yi=y-fN*.95;
      linhas(it.nome,fN,700).forEach(t=>{ ops.push(["n",t,fN,y,it.atual]); y+=fN*1.22; });
      if(it.nota){ linhas("("+it.nota+")",fS*.9,400).forEach(t=>{ ops.push(["o",t,fS*.9,y]); y+=fS*1.15; }); }
      it.sinais.forEach(sn=>{ linhas((it.sinais.length>1?"":"Sinal: ")+sn,fS,400).forEach((t,j)=>{ ops.push(["s",t,fS,y,j===0&&it.sinais.length===1]); y+=fS*1.2; }); });
      if(it.atual) ops.push(["bar",yi,y-fN*.75]);
      y+=fN*.65; });
    return {ops,h:y}; };
  let k=1, M=monta(k); while(M.h>y1-y0&&k>.55){ k-=.05; M=monta(k); }
  const g=el("g",{class:"variantes","pointer-events":"none"},svg);
  M.ops.forEach(o=>{ const y=y0+(o[0]==="ln"||o[0]==="bar"?0:o[3]);
    if(o[0]==="h") el("text",{x:x0,y,"font-size":o[2],"font-weight":700,fill:"#C00000",class:"legtxt"},g).textContent=o[1];
    else if(o[0]==="ln") el("rect",{x:x0,y:y0+o[1],width:x1-x0,height:220,fill:"#C8A75E"},g);
    else if(o[0]==="bar") el("rect",{x:x0-650,y:y0+o[1],width:240,height:o[2]-o[1],fill:"#C00000",rx:80},g);
    else if(o[0]==="n") el("text",{x:x0,y,"font-size":o[2],"font-weight":700,fill:o[4]?"#C00000":"#1B1A17",class:"legtxt"},g).textContent=o[1];
    else if(o[0]==="o") el("text",{x:x0,y,"font-size":o[2],"font-style":"italic",fill:"#6B675E",class:"legtxt"},g).textContent=o[1];
    else if(o[0]==="s"){ const t=el("text",{x:x0+500,y,"font-size":o[2],fill:"#1B1A17",class:"legtxt"},g);
      if(o[4]&&o[1].startsWith("Sinal: ")){ el("tspan",{"font-weight":700,fill:"#6B675E"},t).textContent="Sinal: "; el("tspan",{},t).textContent=o[1].slice(7); } else t.textContent=o[1]; } }); }
/* ---------- v113: setups iniciais para imprimir (A4 horizontal, 1 por folha, sem setas) ----------
   Vêm marcados os slides iniciais (com lances ligados) e os lances ligados com posição própria (metade ou mais das peças soltas, ex.: Canto Aberto).
   Os restantes lances que seguem outro aparecem com ↳, desmarcados. */
function folhaSetups(){ const grupos=[["DEF","Defensivos"],["OF","Ofensivos"]];
  const cand=L=>!L.dinamico&&L.bolas&&L.bolas.length;
  const proprio=eProprio;
  folha(`<h3>🖨 Imprimir setups</h3><p class="sub" style="margin:0">Ofensivos: posição inicial só com bolas e números, e à direita as variantes e o sinal de cada uma. Defensivos: o quadro completo, com legendas, setas e textos. A4 horizontal, um por folha, com os jogadores atuais. Vêm marcados os slides iniciais e os lances com posição própria (★). Os lances que seguem outro (↳) podes juntar à mão.</p>
    <div id="su-g" style="display:flex;flex-direction:column;gap:10px;max-height:52vh;overflow:auto"></div>
    <p class="sub" id="su-p" style="margin:0"></p>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="su-ok">⬇ Gerar PDF</button></div>`,(s,fecha)=>{
    const box=s.querySelector("#su-g"), pp=s.querySelector("#su-p");
    const resumo=()=>{ const n=box.querySelectorAll("input:checked").length; pp.textContent=n?`${n} ${n===1?"setup selecionado":"setups selecionados"}`:"Nenhum setup selecionado"; };
    let tot=0;
    grupos.forEach(([t,n])=>{ const ls=lances().filter(l=>l.tipo===t&&cand(l)); if(!ls.length) return; tot+=ls.length;
      const g=document.createElement("div"); g.innerHTML=`<b style="font-family:var(--f-display);font-size:13px;letter-spacing:1px;text-transform:uppercase;color:var(--muted)"></b>`; g.querySelector("b").textContent=n;
      ls.forEach(L=>{ const segue=!!L.base, ini=seguidoresDe(L.id).length>0||proprio(L), l=document.createElement("label"); l.style.cssText="display:flex;gap:10px;align-items:center;font-size:14.5px;min-height:38px";
        l.innerHTML=`<input type="checkbox" style="width:20px;height:20px"> <span></span>`; const i=l.querySelector("input"); i.value=L.id; i.checked=ini; l.querySelector("span").textContent=(ini?"★ ":segue?"↳ ":"")+L.nome; g.appendChild(l); });
      box.appendChild(g); });
    if(!tot) box.innerHTML=`<p class="empty" style="padding:0">Não há lances defensivos ou ofensivos no Quadro.</p>`;
    if(!box.querySelector("input:checked")) box.querySelectorAll("input").forEach(i=>{ const L=lances().find(x=>x.id===i.value); i.checked=!(L&&L.base); });
    box.addEventListener("change",resumo); resumo();
    s.querySelector("#su-ok").onclick=async e=>{ const bt=e.currentTarget; if(bt.disabled) return;
      const ids=new Set([...box.querySelectorAll("input:checked")].map(i=>i.value)); const lista=lances().filter(l=>ids.has(l.id));
      if(!lista.length){ toast("Escolhe pelo menos um setup."); return; }
      bt.disabled=true;
      try{
        pp.textContent="A preparar…";
        if(!window.jspdf) await carregaScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
        const css=await cssFontes(); try{ await document.fonts.ready; }catch(e){}
        const doc=new window.jspdf.jsPDF({orientation:"landscape",unit:"pt",format:"a4",compress:true});
        const PW=841.89, PH=595.28, M=22;
        for(let k=0;k<lista.length;k++){ pp.textContent=`A desenhar ${k+1} de ${lista.length}: ${lista[k].nome}`;
          const sv=desenha(lista[k],{clean:true,semAnim:true,setup:lista[k].tipo!=="DEF"}), vb=(sv.getAttribute("viewBox")||`0 0 ${W} ${H}`).split(/\s+/).map(Number), ar=vb[2]/vb[3];
          let h_=PH-2*M, w_=h_*ar; if(w_>PW-2*M){ w_=PW-2*M; h_=w_/ar; }
          const jpg=await svgParaJpeg(sv,css,Math.round(2400*vb[2]/W),Math.round(2400*vb[3]/W));
          if(k) doc.addPage("a4","landscape"); doc.addImage(jpg,"JPEG",(PW-w_)/2,(PH-h_)/2,w_,h_,undefined,"FAST"); }
        pp.textContent="A guardar…";
        const nomeF=`SCA_Setups_Bolas_Paradas_${new Date().toISOString().slice(0,10)}.pdf`;
        const buf=doc.output("arraybuffer");
        let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
        if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([buf],{type:"application/pdf"})); a.download=nomeF; document.body.appendChild(a); a.click(); a.remove(); fecha(); return; }
        await dl.save({filename:nomeF,data:new Uint8Array(buf)}); fecha(); toast(`PDF guardado · ${lista.length} ${lista.length===1?"página":"páginas"}`);
      }catch(err){ bt.disabled=false;
        if(err?.code==="declined"){ pp.textContent=""; return; }
        pp.textContent=err?.message==="script"?"Não consegui carregar o gerador de PDF. Verifica a internet e tenta de novo.":"Não foi possível gerar o PDF ("+(err?.code||err?.message||"erro")+")."; } };
  }); }
