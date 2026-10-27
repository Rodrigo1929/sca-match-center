/* ---------- exportar PDF dos quadros ---------- */
function carregaScript(src){ return new Promise((ok,ko)=>{ const s_=document.createElement("script"); s_.src=src; s_.onload=ok; s_.onerror=()=>ko(new Error("script")); document.head.appendChild(s_); }); }
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
function folhaPdf(){ const grupos=[["JOGO","Jogo (Onze, Encaixe, Intervalo, Notas)",false],["DEF","Defensivos",true],["OF","Ofensivos",true],["REF","Referência",true]];
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