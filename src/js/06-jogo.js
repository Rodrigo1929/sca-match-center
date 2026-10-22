/* ---------- Jogo ---------- */
function desenhaEstat(opts={}){
  const svg=el("svg",{viewBox:`0 0 ${W} ${H}`,role:"img","aria-label":"Estatística"});
  el("rect",{x:0,y:0,width:W,height:H,fill:"#fff"},svg);
  el("image",{href:"slides/b-head.jpg",x:0,y:0,width:W,height:H,preserveAspectRatio:"none"},svg);
  const E=estatJogo(), tj=tempoJogo(), seg2=(tj!=null&&tj>=2700)||vParte()===2, ver=seg2?"t":"1", S=ver==="t"?E.t:E["1"];
  const t=el("text",{x:9300,y:6050,"font-size":30*PT,"font-weight":700,class:"legtxt"},svg);
  el("tspan",{fill:"#000"},t).textContent=seg2?"Estatística do Jogo":"Estatística ao Intervalo"; if(jogo.adversario) el("tspan",{fill:"#C00000"},t).textContent=" · vs "+jogo.adversario;
  const cx=W/2, top=12500, linhas=ESTAT_LINHAS.filter(([k])=>k!=="vermelho"||S.nos.vermelho||S.eles.vermelho), lh=Math.min(6200,(H-top-2500)/(linhas.length+1));
  const T=(x,y,txt,o={})=>{ const e=el("text",{x,y,"text-anchor":o.a||"middle","font-size":(o.s||18)*PT,"font-weight":o.b?800:400,fill:o.c||"#1B1A17",class:"legtxt"},svg); e.textContent=txt; return e; };
  T(cx-26000,top,"SC ANGRENSE",{s:22,b:1,c:"#C00000"}); T(cx+26000,top,(jogo.adversario||"ADVERSÁRIO").toUpperCase(),{s:22,b:1,c:"#1F497D"});
  const pl=placar(); T(cx,top,`${pl.nos} – ${pl.eles}`,{s:30,b:1});
  linhas.forEach(([k,l],i)=>{ const y=top+lh*(i+1.1), a=S.nos[k], b=S.eles[k], va=a==null?"–":a+(k==="posse"?"%":""), vb=b==null?"–":b+(k==="posse"?"%":"");
    T(cx-26000,y,va,{s:26,b:1}); T(cx+26000,y,vb,{s:26,b:1}); T(cx,y-lh*.18,l,{s:15,c:"#55524B"});
    const tot=(+a||0)+(+b||0), pa=tot?(+a||0)/tot:.5, bw=30000, bx=cx-bw/2, by=y+lh*.08;
    el("rect",{x:bx,y:by,width:bw,height:650,rx:325,fill:"#ECEAE4"},svg); el("rect",{x:bx,y:by,width:bw*pa,height:650,rx:325,fill:"#C00000"},svg); el("rect",{x:bx+bw*pa,y:by,width:bw*(1-pa),height:650,rx:325,fill:"#1F497D"},svg);
    if(seg2&&k!=="posse"){ T(cx-26000+3600,y-200,`(1.ªP ${E["1"].nos[k]??"–"})`,{s:11,c:"#9A958B",a:"start"}); T(cx+26000-3600,y-200,`(1.ªP ${E["1"].eles[k]??"–"})`,{s:11,c:"#9A958B",a:"end"}); } });
  logo(svg,{});
  return svg; }
function desenhaNotasJogo(opts={}){
  const svg=el("svg",{viewBox:`0 0 ${W} ${H}`,role:"img","aria-label":"Notas do jogo"});
  el("rect",{x:0,y:0,width:W,height:H,fill:"#fff"},svg);
  el("image",{href:"slides/b-head.jpg",x:0,y:0,width:W,height:H,preserveAspectRatio:"none"},svg);
  const t=el("text",{x:9300,y:6050,"font-size":30*PT,"font-weight":700,class:"legtxt"},svg);
  el("tspan",{fill:"#000"},t).textContent="Notas do Jogo"; if(jogo.adversario) el("tspan",{fill:"#C00000"},t).textContent=" · vs "+jogo.adversario;
  const it=notas.itens.map((n,i)=>({...n,i})).sort((a,b)=>seg(a.t)-seg(b.t));
  if(!it.length){ const e=el("text",{x:W/2,y:H/2,"text-anchor":"middle","font-size":18*PT,fill:"#9A958B",class:"legtxt"},svg);
    e.textContent=opts.clean?"Sem notas":"Sem notas. Toca em “+ Nota” durante o jogo."; return svg; }
  const top=10500, bot=H-1800, colW=40500, cols=[3200,47200];
  let fs=17*PT, blocos;
  const montar=()=>{ blocos=it.map(n=>({n,ls:quebra(n.txt||"",fs,colW-fs*3.4-(linkVideo(n)?1700:0),700)})); };
  const altura=b=>b.ls.length*fs*1.22+fs*0.95;
  for(let k=0;k<12;k++){ montar(); let c=0,y=top,ok=true; for(const b of blocos){ const h=altura(b); if(y+h>bot){ c++; y=top; if(c>1){ ok=false; break; } } y+=h; } if(ok) break; fs*=0.9; }
  let c=0, y=top;
  // separador entre colunas
  el("line",{x1:45200,x2:45200,y1:top,y2:bot,stroke:"#E2DCCB","stroke-width":80},svg);
  blocos.forEach(b=>{ const h=altura(b); if(y+h>bot&&c===0){ c=1; y=top; }
    const x=cols[c], g=el("g",{class:"leg",style:"cursor:pointer"},svg), cat=CATS[b.n.cat]||CATS.out;
    el("rect",{x:x-200,y:y-fs*0.3,width:colW+400,height:h-fs*0.35,rx:250,fill:"transparent"},g);
    el("rect",{x,y:y+fs*0.05,width:260,height:b.ls.length*fs*1.22-fs*0.1,rx:100,fill:cat[1]},g);
    el("text",{x:x+fs*2.9,y:y+fs*0.95,"text-anchor":"end","font-size":fs,"font-weight":800,fill:"#C00000",class:"legtxt"},g).textContent=b.n.t||"–";
    b.ls.forEach((ln,j)=>{ el("text",{x:x+fs*3.4,y:y+fs*0.95+j*fs*1.22,"font-size":fs,"font-weight":700,fill:"#1B1A17",class:"legtxt"},g).textContent=ln; });
    if(!opts.clean) g.addEventListener("click",()=>folhaNota(b.n.i));
    const lv=linkVideo(b.n); if(lv){ const a=el("a",{href:lv,target:"_blank",rel:"noopener"},svg); a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",lv);
      const cx=x+colW-700, cy=y+fs*0.6; el("circle",{cx,cy,r:fs*0.62,fill:"#C00000"},a); el("path",{d:`M ${cx-fs*0.2} ${cy-fs*0.3} L ${cx+fs*0.32} ${cy} L ${cx-fs*0.2} ${cy+fs*0.3} z`,fill:"#fff"},a);
      a.addEventListener("click",e=>e.stopPropagation()); }
    y+=h; });
  return svg;
}
function folhaNota(i){
  const ed=i!=null, N=ed?notas.itens[i]:{t:"",txt:"",cat:"of"};
  const tj=tempoJogo(); let cat=N.cat||"of"; let parte=N.parte||((jogo.relogio&&jogo.relogio.base>=2700)||(tj!=null&&tj>=2700)?2:1);
  const lv=ed?linkVideo(N):null;
  folha(`<h3>${ed?"Editar nota":"Nova nota"}</h3>
    <div class="fields"><label class="f">Minuto (m:ss)<input type="text" id="nt-m" inputmode="numeric" placeholder="5:15"></label>
    <div class="f" style="justify-content:flex-end"><button class="btn sm" id="nt-agora" type="button">${tj!=null?"⏱ Agora ("+fmt(tj)+")":"⏱ Relógio parado"}</button></div></div>
    <div class="seg" role="group" aria-label="Parte" id="nt-pt"><button data-p="1">1ª parte</button><button data-p="2">2ª parte</button></div>
    ${lv?`<div style="display:flex;flex-direction:column;gap:8px"><span class="sub" style="margin:0">O lance está aos <b>${hms(tempoVideo(N))}</b> do vídeo. Escolhe como abrir:</span>
      <div class="styles" id="nt-vid">${[["embed","▶ Leitor simples"],["app","▶ App YouTube"],["web","▶ YouTube no navegador"]].map(([k,n])=>`<a class="btn sm ${k===modoVideo?"primary":""}" data-m="${k}" href="${linkVideoModo(N,null,k)}" target="_blank" rel="noopener">${n}</a>`).join("")}</div>
      <span class="sub" style="margin:0">A opção a vermelho é a usada pelo ▶ do diapositivo. Se outra abrir no sítio certo, toca nela e fica essa.</span></div>`:(ed&&jogo.video&&jogo.video.url&&(N.parte===2?jogo.video.k2==null:jogo.video.k1==null)?`<p class="sub" style="margin:0">Falta indicar no ⏱ › Vídeo o início da ${N.parte===2?"2ª":"1ª"} parte para esta nota ter ligação.</p>`:"")}
    <div class="seg" role="group" aria-label="Tipo" id="nt-cat">${Object.entries(CATS).map(([k,[n]])=>`<button data-c="${k}">${n}</button>`).join("")}</div>
    <label class="f">O que aconteceu<textarea id="nt-x" rows="3" style="border:1px solid var(--line);border-radius:8px;padding:10px;font:inherit;background:var(--surface);color:var(--ink);width:100%" placeholder="Ex.: Canto contra — 7 perdeu a marcação ao 2º poste"></textarea></label>
    <div class="actions">${ed?'<button class="btn danger l" id="nt-del">Apagar</button>':''}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="nt-ok">Guardar</button></div>`,(s,fecha)=>{
    const m=s.querySelector("#nt-m"), x=s.querySelector("#nt-x");
    m.value=ed?(N.t||""):(tj!=null?fmt(tj):""); x.value=N.txt||"";
    const bs=s.querySelectorAll("#nt-cat button"); const upd=()=>bs.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.c===cat)));
    bs.forEach(b=>b.onclick=()=>{cat=b.dataset.c;upd();}); upd();
    s.querySelectorAll("#nt-vid a").forEach(a=>a.addEventListener("click",()=>{ modoVideo=a.dataset.m; try{ localStorage.setItem("sca-modo-video",modoVideo); }catch(e){} s.querySelectorAll("#nt-vid a").forEach(x=>x.classList.toggle("primary",x===a)); setTimeout(render,50); }));
    const ps=s.querySelectorAll("#nt-pt button"); const updp=()=>ps.forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.p===parte)));
    ps.forEach(b=>b.onclick=()=>{parte=+b.dataset.p;updp();}); updp();
    s.querySelector("#nt-agora").onclick=()=>{ const t=tempoJogo(); if(t!=null) m.value=fmt(t); };
    if(ed&&N.autor){ nomeDe(N.autor).then(nm=>{ if(nm){ const p_=document.createElement("p"); p_.className="sub"; p_.style.margin="0"; p_.textContent="Registada por "+nm; s.querySelector("h3").after(p_); } }); }
    const ok=()=>{ const n={id:N.id||Math.random().toString(36).slice(2,9),t:m.value.trim(),txt:x.value.trim(),cat,parte,...((N.autor||meuId)?{autor:N.autor||meuId}:{})};
      if(!n.txt&&!n.t){ fecha(); return; }
      const its=notas.itens.slice(); if(ed) its[i]=n; else its.push(n); guardaNotas({itens:its}); fecha(); if(!ed) toast("Nota guardada"); };
    s.querySelector("#nt-ok").onclick=ok;
    x.addEventListener("keydown",e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); ok(); } });
    const d=s.querySelector("#nt-del"); if(d) d.onclick=()=>{ const its=notas.itens.slice(); const rem=its.splice(i,1)[0]; guardaNotas({itens:its}); fecha(); toast("Nota apagada",()=>{ const r_=notas.itens.slice(); r_.push(rem); guardaNotas({itens:r_}); }); };
    setTimeout(()=>x.focus(),40);
  });
}
function folhaRelogio(){
  const rl=jogo.relogio||{};
  folha(`<h3>Relógio do jogo <span class="big" id="rl-t"></span></h3>
    <p class="sub" style="margin:0">O minuto entra automaticamente nas notas. Fica igual no iPad e no PC.</p>
    <div class="styles"><button id="rl-1">▶ Iniciar 1ª parte</button><button id="rl-2">▶ Iniciar 2ª parte (45:00)</button><button id="rl-p">${rl.correr?"⏸ Pausar":"▶ Retomar"}</button><button id="rl-a">Acertar…</button></div>
    <h4>Vídeo</h4><div class="styles"><button id="rl-v">🎥 Configurar vídeo do YouTube</button></div>
    <h4>Novo jogo</h4><div class="styles"><button id="rl-z">Parar e pôr a 0:00</button><button id="rl-n">Apagar todas as notas</button></div>
    <div class="actions"><button class="btn dark" data-close>Fechar</button></div>`,(s,fecha)=>{
    const tt=s.querySelector("#rl-t"); const tick=()=>{ const t=tempoJogo(); tt.textContent=t==null?"0:00":fmt(t); }; tick(); const iv=setInterval(()=>{ if(!document.body.contains(tt)) clearInterval(iv); else tick(); },1000);
    const set=r_=>{ guardaJogo({...jogo,relogio:r_},true); fecha(); };
    s.querySelector("#rl-1").onclick=()=>set({base:0,inicio:Date.now(),correr:true});
    s.querySelector("#rl-2").onclick=()=>set({base:45*60,inicio:Date.now(),correr:true});
    s.querySelector("#rl-p").onclick=()=>{ const t=tempoJogo()||0; set(rl.correr?{base:t,correr:false}:{base:t,inicio:Date.now(),correr:true}); };
    s.querySelector("#rl-a").onclick=()=>{ const v=window.prompt?null:null; const inp=document.createElement("input"); inp.type="text"; inp.placeholder="Ex.: 23:40"; inp.style.marginTop="8px";
      const b=document.createElement("button"); b.className="btn sm primary"; b.textContent="Acertar"; b.style.marginLeft="8px";
      b.onclick=()=>{ const sc=seg(inp.value.trim()); if(sc<1e9) set({base:sc,inicio:Date.now(),correr:!!rl.correr}); };
      s.querySelector("#rl-a").after(inp,b); inp.focus(); };
    s.querySelector("#rl-v").onclick=()=>{ fecha(); folhaVideo(); };
    s.querySelector("#rl-z").onclick=()=>set({base:0,correr:false});
    s.querySelector("#rl-n").onclick=()=>{ const prev=notas.itens.slice(); guardaNotas({itens:[]}); fecha(); toast("Notas apagadas",()=>guardaNotas({itens:prev})); };
  });
}
function folhaVideo(){
  const V=jogo.video||{};
  folha(`<h3>Vídeo do jogo</h3><p class="sub" style="margin:0">Cola o link do YouTube e indica em que ponto do vídeo começa cada parte. Cada nota passa a ter ▶ para abrir o lance.</p>
    <label class="f">Link do YouTube<input type="text" id="vd-u" placeholder="https://www.youtube.com/watch?v=…"></label>
    <div class="fields"><label class="f">Início 1ª parte no vídeo<input type="text" id="vd-1" placeholder="Ex.: 12:30 ou 1:02:15"></label><label class="f">Início 2ª parte no vídeo<input type="text" id="vd-2" placeholder="Ex.: 1:10:05"></label></div>
    <label class="f">Abrir quantos segundos antes do minuto da nota<select id="vd-a"><option>5</option><option>10</option><option>15</option><option>20</option><option>30</option></select></label>
    <p class="sub" style="margin:0">Dica: no YouTube, pausa no pontapé de saída e copia o tempo que aparece no vídeo. Num direto ainda a decorrer, o YouTube pode não deixar saltar para trás; depois de terminar funciona sempre.</p>
    <div class="actions"><button class="btn danger l" id="vd-x">Limpar</button><button class="btn" data-close>Cancelar</button><button class="btn primary" id="vd-ok">Guardar</button></div>`,(s,fecha)=>{
    const u=s.querySelector("#vd-u"), a=s.querySelector("#vd-1"), b=s.querySelector("#vd-2"), an=s.querySelector("#vd-a");
    u.value=V.url||""; a.value=V.k1!=null?hms(V.k1):""; b.value=V.k2!=null?hms(V.k2):""; an.value=String(V.antes??10);
    s.querySelector("#vd-ok").onclick=()=>{ if(u.value.trim()&&!ytId(u.value)){ toast("Esse link não parece ser do YouTube."); return; }
      guardaJogo({...jogo,video:{url:u.value.trim(),k1:a.value.trim()?lerHms(a.value):null,k2:b.value.trim()?lerHms(b.value):null,antes:+an.value}},true); fecha(); toast("Vídeo configurado"); };
    s.querySelector("#vd-x").onclick=()=>{ guardaJogo({...jogo,video:null},true); fecha(); };
  });
}
function desenhaOnze(o_={}){
  const arrasta=!o_.clean||!!o_.arrastar, toca=!o_.clean||!!o_.arrastar;
  const svg=el("svg",{viewBox:`0 0 ${W} ${H}`,role:"img","aria-label":"Onze inicial"});
  campo(svg,false);
  const t=el("text",{x:9300,y:6050,"font-size":30*PT,"font-weight":700,class:"legtxt"},svg);
  el("tspan",{fill:"#000"},t).textContent=o_.quadro?"Onze Titular":"Onze base"; if(jogo.adversario){ el("tspan",{fill:"#C00000"},t).textContent=" · vs "+jogo.adversario; }
  if(jogo.suplentes.length){
    const fs=12*PT, y0=66350, t2=el("text",{x:2800,y:y0,"font-size":fs,class:"legtxt"},svg);
    el("tspan",{fill:"#C00000","font-weight":800},t2).textContent="Suplentes:  ";
    const txt=jogo.suplentes.slice().sort(byNum).map(n=>n+(nome(n)?" "+nome(n):"")).join("   ·   ");
    el("tspan",{fill:"#1B1A17","font-weight":700},t2).textContent=txt;
    const need=textW("Suplentes:  "+txt,fs,700); if(need>86000){ t2.setAttribute("textLength",86000); t2.setAttribute("lengthAdjust","spacingAndGlyphs"); }
  }
  const gk=titulares()[0];
  jogo.onze.forEach((o,i)=>{
    const g=el("g",{class:"bola",tabindex:toca?0:-1,role:toca?"button":"presentation","aria-label":`${o.pos||""} ${o.n}`},svg);
    const r=1750, e=i===0?ESTILOS.gr:ESTILOS.normal;
    el("circle",{cx:o.x,cy:o.y,r:r*1.6,fill:"transparent"},g);
    el("circle",{cx:o.x,cy:o.y,r,fill:e.fill,stroke:e.stroke,"stroke-width":110},g);
    el("text",{x:o.x,y:o.y+15*PT*.35,"text-anchor":"middle","font-size":15*PT,fill:e.color,class:"num"},g).textContent=o.n;
    const lab=[o.pos,nome(o.n)].filter(Boolean).join(" · ");
    if(lab) etiqueta(g,o.x,o.y+r+250,lab,9*PT);
    if(!toca) return;
    let start=null,moved=false;

    g.addEventListener("touchstart",ev=>{ ev.preventDefault(); },{passive:false});
    g.addEventListener("pointerdown",ev=>{ if(!arrasta) return; ev.preventDefault(); g.setPointerCapture(ev.pointerId); start=svgPt(svg,ev); moved=false; dragging=true; });
    g.addEventListener("pointermove",ev=>{ if(!start) return; const p=svgPt(svg,ev); const dx=p.x-start.x, dy=p.y-start.y; if(Math.hypot(dx,dy)>350) moved=true; if(moved) g.setAttribute("transform",`translate(${dx} ${dy})`); });
    g.addEventListener("pointerup",ev=>{ if(!start) return; const p=svgPt(svg,ev); const dx=p.x-start.x, dy=p.y-start.y; start=null; dragging=false;
      if(moved){ pushUndo({tipo:"onze",antes:clone(jogo.onze)}); const J=clone(jogo); J.onze[i].x=Math.round(o.x+dx); J.onze[i].y=Math.round(o.y+dy); guardaJogo(J); } else if(!o_.clean) folhaOnze(i); });
    g.addEventListener("pointercancel",()=>{ start=null; dragging=false; renderJogo(); });
    g.addEventListener("keydown",ev=>{ if(ev.key==="Enter"||ev.key===" "){ ev.preventDefault(); folhaOnze(i);} });
  });
  return svg;
}
function folhaOnze(i){
  const o=jogo.onze[i];
  folha(`<h3><span class="big"></span> · titular</h3><label class="f">Posição (sigla)<input type="text" id="o-pos" maxlength="6" placeholder="Ex.: DC"></label>
    <h4>Jogador nesta posição</h4><div class="pgrid" id="o-g"></div>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="o-ok">Guardar</button></div>`,(s,fecha)=>{
    s.querySelector(".big").textContent=rot(o.n);
    let esc_=o.n; const inp=s.querySelector("#o-pos"); inp.value=o.pos||"";
    const grid=s.querySelector("#o-g");
    const nums=est.plantel.map(p=>p.n).filter(Boolean).sort(byNum);
    botoesJog(grid,nums,n=>{ esc_=n; grid.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.querySelector("b").textContent===n))); },
      n=>{ const j=jogo.onze.findIndex(x=>x.n===n); return j>=0&&j!==i?"titular · troca":jogo.suplentes.includes(n)?"suplente":""; });
    grid.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.querySelector("b").textContent===o.n)));
    s.querySelector("#o-ok").onclick=()=>{
      const J=clone(jogo); const j=J.onze.findIndex(x=>x.n===esc_);
      if(j>=0&&j!==i) J.onze[j].n=o.n;          // troca entre titulares
      J.onze[i].n=esc_; J.onze[i].pos=inp.value.trim().toUpperCase();
      J.suplentes=J.suplentes.filter(n=>n!==esc_);
      guardaJogo(J); fecha(); };
  });
}
function avisoSup(){ const C=COMPS[jogo.comp]||COMPS.taca, el_=$("j-nsup"); if(!el_) return; el_.style.background=C.sup&&jogo.suplentes.length>C.sup?"#E00000":""; el_.title=C.sup?`${C.nome}: máximo ${C.sup} suplentes`:""; }
function renderFichaCampos(){ const box=$("fj-body"); if(!box||box.contains(document.activeElement)) return; const J=jogo, S=est.staff||{};
  const inp=(id,lab,val,ph,tipo)=>`<label class="f">${lab}<input type="${tipo||"text"}" id="${id}" value="${esc(val||"")}" placeholder="${ph||""}"></label>`;
  const opc=v=>`<option value="">—</option>`+est.plantel.filter(p=>p.n).sort((a,b)=>byNum(a.n,b.n)).map(p=>`<option value="${esc(p.n)}"${p.n===v?" selected":""}>${esc(p.n+" · "+p.nome)}</option>`).join("");
  box.innerHTML=`<div class="fields">${inp("fj-prova","Prova",J.prova,(COMPS[J.comp]||COMPS.taca).nome)}${inp("fj-jornada","Jornada",J.jornada,"Ex.: 5")}</div>
    <div class="fields">${inp("fj-local","Local",J.local,"Ex.: Estádio João Paulo II")}${inp("fj-hora","Hora",J.hora,"","time")}</div>
    <div class="fields"><label class="f">Jogamos<select id="fj-casa"><option value="casa">Em casa (Visitado)</option><option value="fora">Fora (Visitante)</option></select></label>${inp("fj-esc","Escalão",J.escalao,"Seniores")}</div>
    <div class="fields">${inp("fj-ri","Resultado ao intervalo (se diferente do automático)",J.resInt,"Ex.: 1-0")}<label class="f">Competição<select id="fj-comp">${Object.entries(COMPS).map(([k,v])=>`<option value="${k}">${esc(v.nome)}</option>`).join("")}</select></label></div>
    <h4 style="margin:10px 0 4px">Equipa técnica</h4>
    <div class="fields">${STAFF.filter(([k])=>!k.startsWith("cap")).map(([k,l])=>inp("fs-"+k,l,S[k])).join("")}</div>
    <h4 style="margin:10px 0 4px">Capitães</h4>
    <div class="fields">${STAFF.filter(([k])=>k.startsWith("cap")).map(([k,l])=>`<label class="f">${l}<select id="fs-${k}">${opc(S[k])}</select></label>`).join("")}</div>
    <div class="actions" style="margin-top:10px"><button class="btn primary" id="fj-pdf">⬇ Ficha de jogo (PDF)</button></div>`;
  $("fj-casa").value=J.casa||"casa"; $("fj-comp").value=J.comp||"taca";
  const gJ=()=>{ clearTimeout(fjT); fjT=setTimeout(()=>guardaJogo({...jogo,prova:$("fj-prova").value.trim(),jornada:$("fj-jornada").value.trim(),local:$("fj-local").value.trim(),hora:$("fj-hora").value,casa:$("fj-casa").value,escalao:$("fj-esc").value.trim(),resInt:$("fj-ri").value.trim(),comp:$("fj-comp").value},true),500); };
  const gS=()=>{ clearTimeout(fsT); fsT=setTimeout(()=>guardaEst({...est,staff:Object.fromEntries(STAFF.map(([k])=>[k,$("fs-"+k).value.trim()]))},true),500); };
  ["fj-prova","fj-jornada","fj-local","fj-hora","fj-esc","fj-ri"].forEach(id=>$(id).addEventListener("input",gJ)); ["fj-casa","fj-comp"].forEach(id=>$(id).addEventListener("change",gJ));
  STAFF.forEach(([k])=>$("fs-"+k).addEventListener(k.startsWith("cap")?"change":"input",gS));
  $("fj-pdf").onclick=e=>guardaFicha(e.currentTarget); }
let fjT=null, fsT=null;
function renderJogo(){ setTimeout(renderFichaCampos,0); setTimeout(avisoSup,0);
  $("jogo-tit").textContent=jogo.adversario?`vs ${jogo.adversario}${jogo.data?" · "+new Date(jogo.data+"T12:00").toLocaleDateString("pt-PT"):""}`:"Preparação · Jogo · Análise";
  if(dragging) return;
  const st=$("jstage"); st.innerHTML=""; st.appendChild(desenhaOnze());
  if(document.activeElement!==$("j-adv")) $("j-adv").value=jogo.adversario||"";
  if(document.activeElement!==$("j-data")) $("j-data").value=jogo.data||"";
  const lu=$("j-lineup"); lu.innerHTML="";
  jogo.onze.forEach(o=>{ const li=document.createElement("li"); li.innerHTML=`<span class="p"></span><b></b><span></span>`;
    li.children[0].textContent=o.pos||""; li.children[1].textContent=o.n; li.children[2].textContent=nome(o.n)||"—"; lu.appendChild(li); });
  const sp=$("j-sup"); sp.innerHTML=""; $("j-nsup").textContent=jogo.suplentes.length;
  const tit=new Set(titulares());
  est.plantel.map(p=>p.n).filter(n=>n&&!tit.has(n)).sort(byNum).forEach(n=>{
    const b=document.createElement("button"); b.className="chip"; b.setAttribute("aria-pressed",String(jogo.suplentes.includes(n)));
    b.innerHTML=`<b></b><span></span>`; b.children[0].textContent=n; b.children[1].textContent=nome(n)||"";
    b.onclick=()=>{ const J=clone(jogo); J.suplentes=J.suplentes.includes(n)?J.suplentes.filter(x=>x!==n):[...J.suplentes,n].sort(byNum); guardaJogo(J); };
    sp.appendChild(b); });
  if(!sp.childElementCount) sp.innerHTML=`<p class="sub">Todos os jogadores do plantel são titulares. Adiciona jogadores no separador Plantel.</p>`;
}
let jTimer=null;
["j-adv","j-data"].forEach(id=>$(id).addEventListener("input",()=>{ clearTimeout(jTimer); jTimer=setTimeout(()=>{ const J=clone(jogo); J.adversario=$("j-adv").value.trim(); J.data=$("j-data").value; guardaJogo(J,true); },600); }));
