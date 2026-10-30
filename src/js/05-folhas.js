/* ---------- folhas ---------- */
function folha(html,onOpen){
  const root=$("sheet-root");
  root.innerHTML=`<div class="sheet-bg"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  const fecha=()=>{ root.innerHTML=""; document.removeEventListener("keydown",k); };
  const k=e=>{ if(e.key==="Escape") fecha(); }; document.addEventListener("keydown",k);
  root.querySelector(".sheet-bg").addEventListener("click",e=>{ if(e.target.classList.contains("sheet-bg")) fecha(); });
  root.querySelectorAll("[data-close]").forEach(b=>b.onclick=fecha);
  onOpen(root.querySelector(".sheet"),fecha);
  const f=root.querySelector("input,button:not([data-close])"); if(f) f.focus();
}
function botoesJog(grid,nums,onPick,marca){
  nums.forEach(n=>{ const b=document.createElement("button");
    b.innerHTML=`<b></b><span></span>${marca&&marca(n)?`<small>${marca(n)}</small>`:""}`;
    b.querySelector("b").textContent=n; b.querySelector("span").textContent=nome(n)||" ";
    b.onclick=()=>onPick(n); grid.appendChild(b); });
}
/* substituição */
function folhaSub(L,num,slotToque){
  let sc="este";
  const emCampo=new Set(Object.values(calcula(L).v));
  const sup=jogo.suplentes.filter(n=>n!==num&&!emCampo.has(n)).sort(byNum);
  const campo=[...emCampo].filter(n=>n!==num).sort(byNum);
  const resto=est.plantel.map(p=>p.n).filter(n=>n&&n!==num&&!emCampo.has(n)&&!sup.includes(n)).sort(byNum);
  const pre=est.fase==="pre";
  folha(`<h3>${pre?"Tarefa do":"Sai o"} <span class="big"></span></h3><p class="sub" style="margin:-6px 0 0">${pre?"Pré-jogo: escolhe quem faz esta tarefa. Não conta como troca.":"Escolhe quem entra."} Se já estiver em campo neste lance, os dois trocam de tarefa.</p>
    <div class="seg" role="group"><button data-s="este" aria-pressed="true">Só em ${esc(L.nome)}</button><button data-s="todos" aria-pressed="false">Em todos os lances</button></div>
    ${pre?"":`<div style="display:flex;gap:10px;align-items:flex-end"><label class="f" style="flex:1">Minuto da substituição<input type="text" id="sb-min" inputmode="numeric" placeholder="Ex.: 63:20"></label><label style="display:flex;gap:6px;align-items:center;font-size:14px;min-height:42px"><input type="checkbox" id="sb-int" style="width:20px;height:20px"> Ao intervalo</label></div><p class="sub" id="sb-cont" style="margin:0"></p>`}
    <h4>Suplentes</h4><div class="pgrid" id="g-sup"></div>
    <h4>Em campo neste lance · troca</h4><div class="pgrid" id="g-campo"></div>
    <details class="more"><summary>Resto do plantel</summary><div class="pgrid" id="g-resto" style="margin-top:8px"></div></details>
    <details class="more" id="sb-luzd"><summary>💡 Destacar este jogador</summary><div id="sb-luz" style="margin-top:8px"></div></details>
    <div class="actions"><button class="btn" data-close>Cancelar</button></div>`,(s,fecha)=>{
    { const vv=calcula(L).v, idx=L.bolas.map((B,i)=>vv[B.slot]===num?i:-1).filter(i=>i>=0); const box=s.querySelector("#sb-luz");
      if(!idx.length||L.dinamico) s.querySelector("#sb-luzd").hidden=true;
      else box.appendChild(linhaLuz(L.bolas[idx[0]].luz,c=>{ const C=clone(L); idx.forEach(i=>{ if(c) C.bolas[i].luz=c; else delete C.bolas[i].luz; }); guardaLance(C); fecha(); toast(c?`Nº ${num} em destaque`:"Destaque retirado"); })); }
    s.querySelector(".big").textContent=rot(num);
    const mi=s.querySelector("#sb-min"); if(mi){ const tj=tempoJogo(); mi.value=tj!=null?fmt(tj):""; }
    if(!pre){ const C=COMPS[jogo.comp]||COMPS.taca, sr=subsReais(), np=paragensDe(sr.lista).length, ct=cartoes();
      s.querySelector("#sb-cont").innerHTML=`${esc(C.nome)}: <b>${sr.lista.length}/${C.subs>=99?"–":C.subs}</b> substituições · <b>${np}/${C.paragens>=99?"–":C.paragens}</b> paragens${ct[num]?.am&&!ct[num]?.verm?` · <b style="color:var(--red)">🟨 ${esc(num)} tem amarelo</b>`:""}`;
      if(sr.lista.length>=C.subs) s.querySelector("#sb-cont").innerHTML+=` · <b style="color:var(--red)">limite atingido</b>`; }
    const pick=n=>{ const mv=mi?mi.value:null, it=!!s.querySelector("#sb-int")?.checked;
      fecha(); novaLinha(num,n,sc==="todos"?"todos":"lances",[L.id],it?"45:00":mv,it,sc!=="todos"&&slotToque&&(calcula(L).dups||[]).includes(num)?slotToque:null); };
    const ctm=n=>{ const c=cartoes()[n]; return c?.verm?"🟥":c?.am?"🟨":""; };
    botoesJog(s.querySelector("#g-sup"),sup,pick,ctm);
    if(!sup.length) s.querySelector("#g-sup").innerHTML=`<p class="sub">Sem suplentes convocados. Define-os no separador Jogo.</p>`;
    botoesJog(s.querySelector("#g-campo"),campo,pick,n=>(ctm(n)?ctm(n)+" ":"")+"troca");
    botoesJog(s.querySelector("#g-resto"),resto,pick);
    s.querySelectorAll(".seg button").forEach(b=>b.onclick=()=>{ sc=b.dataset.s; s.querySelectorAll(".seg button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); });
  });
}
function opcSlots(sel,atual,L){ const v=L?calcula(L).v:{};
  jogo.onze.forEach(o=>{ const op=document.createElement("option"); op.value=o.slot; const n=v[o.slot]??o.n, ja=L&&L.bolas.some(b=>b.slot===o.slot);
    op.textContent=`${n}${nome(n)?" · "+nome(n):""}${o.pos?" · "+o.pos:""}${n!==o.n?` (no onze: ${o.n})`:""}${ja?" — já está neste lance":""}`; sel.appendChild(op); });
  if(atual!=null) sel.value=atual;
}
function miniBola(st){ return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="${st.fill}" stroke="${st.stroke}" stroke-width="${Math.max(1,st.sw/90)}"/></svg>`; }
/* editar bolinha */
function folhaBola(L,i){
  const B=L.bolas[i], LB=baseDe(L), solta=LB&&!eAlternativa(B)&&soltasDe(L).includes(B.slot);
  const nSeg=eAlternativa(B)?0:seguidoresDe(L.id).length;
  folha(`<h3>Bolinha</h3><label class="f">Jogador nesta bolinha (${nSeg?`neste lance e nos ${nSeg} que o seguem`:"neste lance"})<select id="s-jog"></select></label>
    <label class="f">Posição no onze base que representa <span class="sub">(avançado)</span><select id="s-slot"></select></label>
    ${LB&&!eAlternativa(B)?`<p class="sub" style="margin:0">${solta?`Posição própria neste lance (não segue o «${esc(LB.nome)}»).`:`Segue a posição do «${esc(LB.nome)}». Arrastá-la aqui deixa-a no seu sítio só neste lance.`}</p>${solta?`<button class="btn" id="s-segue">↺ Voltar a seguir o «${esc(LB.nome)}»</button>`:""}`:""}
    <h4>Estilo</h4><div class="styles" id="s-est"></div>
    <h4>Destaque (luz)</h4><div id="s-luz"></div>
    <div class="actions"><button class="btn danger l" id="s-rem">Remover bolinha</button><button class="btn" id="s-dup">Duplicar</button><button class="btn dark" data-close>Fechar</button></div>`,(s,fecha)=>{
    opcSlots(s.querySelector("#s-slot"),B.slot,L);
    { const sg=s.querySelector("#s-segue"); if(sg) sg.onclick=()=>{ fecha(); voltaSeguir(L,B.slot); }; }
    { const sj=s.querySelector("#s-jog"), v=calcula(L).v, atual=v[B.slot];
      const lista=[...new Set([...est.plantel.map(p=>p.n).filter(Boolean),atual])].sort(byNum);
      sj.innerHTML=lista.map(n=>{ const onde=Object.entries(v).find(([sl,x])=>x===n&&sl!==B.slot&&L.bolas.some(b=>b.slot===sl&&!eAlternativa(b))); return `<option value="${esc(n)}">${esc(n)}${nome(n)?" · "+esc(nome(n)):""}${onde?" — já está neste lance (troca)":""}</option>`; }).join(""); sj.value=atual;
      sj.onchange=()=>{ const novo=sj.value; if(novo===atual) return; const C=clone(L); C.fixo={...(C.fixo||{})};
        if(!eAlternativa(B)) Object.entries(v).forEach(([sl,x])=>{ if(x===novo&&sl!==B.slot) C.fixo[sl]=atual; });
        C.fixo[B.slot]=novo;
        /* v108.1: no slide inicial, a mesma troca passa aos lances que o seguem (quem era o `atual` passa a `novo`; se o `novo` lá estava, trocam) */
        const junto=[]; if(!eAlternativa(B)) seguidoresDe(L.id).forEach(F=>{ const vf=vDoLance(F), D=copiaLance(F); D.fixo={...(D.fixo||{})}; let m=false;
          Object.entries(vf).forEach(([sl,x])=>{ if(x===atual){ D.fixo[sl]=novo; m=true; } else if(x===novo){ D.fixo[sl]=atual; m=true; } }); if(m) junto.push(D); });
        const quem=`${novo}${nome(novo)?" · "+nome(novo):""}`;
        guardaLance(C,{junto,msg:junto.length?`${atual} → ${quem} neste lance e em ${junto.length} lance${junto.length>1?"s":""} que o seguem (${junto.map(x=>x.nome).join(", ")})`:`Bolinha passa a ${quem} neste lance`}); fecha(); }; }
    s.querySelector("#s-slot").onchange=e=>{ const C=clone(L), novo=e.target.value, velho=C.bolas[i].slot;
      if(!eAlternativa(C.bolas[i])&&C.bolas.some((b,k)=>k!==i&&b.slot===novo&&!eAlternativa(b))){ C.bolas.forEach((b,k)=>{ if(k!==i&&b.slot===novo) b.slot=velho; }); C.bolas[i].slot=novo; guardaLance(C); toast("Esse jogador já estava neste lance: as duas bolinhas trocaram de jogador."); return; }
      C.bolas[i].slot=novo; guardaLance(C); };
    const box=s.querySelector("#s-est");
    Object.entries(ESTILOS).forEach(([k,st])=>{ const b=document.createElement("button");
      b.setAttribute("aria-pressed",String(B.fill===st.fill&&B.stroke===st.stroke));
      b.innerHTML=miniBola(st)+`<span>${st.nome}</span>`;
      b.onclick=()=>{ const C=clone(L); Object.assign(C.bolas[i],{fill:st.fill,stroke:st.stroke,sw:st.sw,color:st.color}); guardaLance(C); fecha(); };
      box.appendChild(b); });
    s.querySelector("#s-luz").appendChild(linhaLuz(B.luz,c=>{ const C=clone(L); if(c) C.bolas[i].luz=c; else delete C.bolas[i].luz; guardaLance(C); fecha(); }));
    s.querySelector("#s-rem").onclick=()=>{ const C=clone(L); C.bolas.splice(i,1); guardaLance(C); fecha(); toast("Bolinha removida",()=>guardaLance(L)); };
    s.querySelector("#s-dup").onclick=()=>{ const C=clone(L); const d=clone(B); d.cx+=B.r*3; C.bolas.push(d); guardaLance(C); fecha(); };
  });
}
function novaBola(L){
  folha(`<h3>Nova bolinha</h3><label class="f">Jogador<select id="n-jog"></select></label>
    <p class="sub" id="n-info" style="margin:0"></p>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="n-ok">Adicionar</button></div>`,(s,fecha)=>{
    const v=calcula(L).v, noLance=n=>Object.entries(v).find(([sl,x])=>x===n&&L.bolas.some(b=>b.slot===sl&&!eAlternativa(b)));
    const sj=s.querySelector("#n-jog"), lista=est.plantel.map(p=>p.n).filter(Boolean).sort(byNum);
    sj.innerHTML=lista.map(n=>`<option value="${esc(n)}">${esc(n)}${nome(n)?" · "+esc(nome(n)):""}${noLance(n)?" — já está neste lance (entra como Alternativa)":""}</option>`).join("");
    const primeiro=lista.find(n=>!noLance(n)); if(primeiro) sj.value=primeiro;
    const info=()=>{ s.querySelector("#n-info").textContent=noLance(sj.value)?"Este jogador já tem bolinha neste lance: a nova entra como Alternativa (bola branca).":""; }; sj.onchange=info; info();
    /* escolhe a posição (slot) para o jogador: a dele se já existir, senão uma do onze livre neste lance, senão uma só deste lance */
    const slotPara=(C,n)=>{ const ja=noLance(n); if(ja) return {slot:ja[0],alt:true};
      const usados=new Set(C.bolas.map(b=>b.slot)); const o=jogo.onze.find(o=>!usados.has(o.slot)&&(v[o.slot]??o.n)===n)||jogo.onze.find(o=>o.n===n&&!usados.has(o.slot))||jogo.onze.find(o=>!usados.has(o.slot));
      const sl=o?o.slot:"p"+n; C.fixo={...(C.fixo||{})}; if(baseOf(sl)!==n||(C.fixo[sl]&&C.fixo[sl]!==n)) C.fixo[sl]=n; return {slot:sl,alt:false}; };
    const sel={value:null};
    s.querySelector("#n-ok").onclick=()=>{ const C=clone(L); const f=FUNDOS[L.fundo]?.campo||[2000,9000,66000,62000];
      const esc_=slotPara(C,sj.value); sel.value=esc_.slot; const jaEsta=esc_.alt;
      const st=jaEsta?ESTILOS.alternativa:sj.value===titulares()[0]?ESTILOS.gr:ESTILOS.normal;
      /* procura um sítio livre perto do centro, para a bolinha nova não ficar escondida por baixo de outra */
      const cx0=(f[0]+f[2])/2, cy0=(f[1]+f[3])/2, ocup=[...C.bolas,...(C.adv||[])]; let px=cx0, py=cy0;
      for(let k=0;k<60;k++){ const ang=k*2.4, rad=k?1800+k*700:0, x=cx0+Math.cos(ang)*rad, y=cy0+Math.sin(ang)*rad;
        if(x<f[0]+1500||x>f[2]-1500||y<f[1]+1500||y>f[3]-1500) continue; if(ocup.every(b=>Math.hypot(b.cx-x,b.cy-y)>3600)){ px=x; py=y; break; } }
      C.bolas.push({slot:sel.value,cx:Math.round(px),cy:Math.round(py),r:1450,fs:12,fill:st.fill,stroke:st.stroke,sw:st.sw,color:st.color});
      guardaLance(C); fecha(); toast(jaEsta?"Esse jogador já está no lance: entrou como Alternativa (bola branca). Arrasta-a para o sítio.":"Bolinha adicionada (a piscar). Arrasta-a para o sítio.");
      setTimeout(()=>{ const gs=document.querySelectorAll('#stage svg g.bola[role=button]'), g=gs[C.bolas.length-1]; if(g){ const c=g.querySelectorAll("circle")[2]; if(c){ const a=el("animate",{attributeName:"r",values:`${1450};${2300};${1450}`,dur:"0.6s",repeatCount:"4"},c); a.beginElement&&a.beginElement(); } } },80); };
  });
}
/* editar legenda */
function folhaLegenda(L,i){
  const G=L.legs[i];
  folha(`<h3>Legenda</h3><label class="f">Jogador<select id="l-slot"></select></label>
    <label class="f">Tarefa<input type="text" id="l-txt" placeholder="Ex.: Defesa zonal"></label>
    <div class="styles"><button id="l-m">Mais estreita</button><button id="l-p">Mais larga</button><button id="l-am">A−</button><button id="l-ap">A+</button></div>
    <div class="actions"><button class="btn danger l" id="l-rem">Remover legenda</button><button class="btn" data-close>Cancelar</button><button class="btn primary" id="l-ok">Guardar</button></div>`,(s,fecha)=>{
    opcSlots(s.querySelector("#l-slot"),G.slot,L);
    const orig=(G.parts||[]).map(p=>p.t).join("");
    const inp=s.querySelector("#l-txt"); inp.value=orig;
    const ok=()=>{ const C=clone(L); C.legs[i].slot=s.querySelector("#l-slot").value;
      if(inp.value!==orig) C.legs[i].parts=[{t:inp.value.trim(),c:"#000000",b:false}];
      guardaLance(C); fecha(); };
    let dw=0, dfs=0; [["#l-m",()=>dw-=2000],["#l-p",()=>dw+=2000],["#l-am",()=>dfs-=2],["#l-ap",()=>dfs+=2]].forEach(([id,f])=>{ const b=s.querySelector(id); b.onclick=()=>{ f(); b.setAttribute("aria-pressed","true"); setTimeout(()=>b.setAttribute("aria-pressed","false"),250); }; });
    const ok0=ok; const ok2=()=>{ if(dw||dfs){ const C=clone(L); const G2=C.legs[i]; G2.slot=s.querySelector("#l-slot").value; if(inp.value!==orig) G2.parts=[{t:inp.value.trim(),c:"#000000",b:false}];
      G2.w=Math.max(6000,G2.w+dw); if(dfs){ G2.fs=Math.max(10,(G2.fs||18)+dfs); G2.h=Math.round(G2.fs*PT*1.62); } guardaLance(C); fecha(); } else ok0(); };
    s.querySelector("#l-ok").onclick=ok2; inp.addEventListener("keydown",e=>{ if(e.key==="Enter") ok2(); });
    s.querySelector("#l-rem").onclick=()=>{ const C=clone(L); C.legs.splice(i,1); guardaLance(C); fecha(); toast("Legenda removida",()=>guardaLance(L)); };
    setTimeout(()=>inp.focus(),30);
  });
}
function novaLegenda(L){
  folha(`<h3>Nova legenda</h3><label class="f">Jogador<select id="nl-slot"></select></label><label class="f">Tarefa<input type="text" id="nl-txt" placeholder="Ex.: Marcação HxH"></label>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="nl-ok">Adicionar</button></div>`,(s,fecha)=>{
    const sel=s.querySelector("#nl-slot"); opcSlots(sel,null,L);
    const falta=jogo.onze.find(o=>!L.legs.some(g=>g.slot===o.slot)); if(falta) sel.value=falta.slot;
    const ok=()=>{ const C=clone(L); const last=C.legs.slice().sort((a,b)=>b.y-a.y)[0];
      const g=last?{x:last.x,y:last.y+last.h+630,w:last.w,h:last.h}:{x:66602,y:14035,w:23350,h:3693};
      if(g.y+g.h>H-500){ g.y=14035; g.x=Math.max(500,g.x-24000); }
      C.legs.push({slot:sel.value,...g,fs:18,parts:[{t:s.querySelector("#nl-txt").value.trim(),c:"#000000",b:false}]});
      guardaLance(C); fecha(); };
    s.querySelector("#nl-ok").onclick=ok; s.querySelector("#nl-txt").addEventListener("keydown",e=>{ if(e.key==="Enter") ok(); });
  });
}
function folhaProps(L){
  let tipo=L.tipo;
  folha(`<h3>Lance</h3><label class="f">Nome<input type="text" id="pp-n"></label>
    <div class="seg" role="group" aria-label="Tipo"><button data-t="DEF">Defensivo</button><button data-t="OF">Ofensivo</button><button data-t="REF">Referência</button></div>
    ${L.titulo?"":'<p class="sub" style="margin:0">O título dentro do esquema faz parte do desenho original; o nome muda na lista e no cabeçalho.</p>'}
    <h4>Posição inicial</h4><div id="pp-base"></div>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="pp-ok">Guardar</button></div>`,(s,fecha)=>{
    const inp=s.querySelector("#pp-n"); inp.value=L.nome;
    const segs=s.querySelectorAll(".seg button"); const upd=()=>segs.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.t===tipo)));
    segs.forEach(b=>b.onclick=()=>{tipo=b.dataset.t;upd();}); upd();
    /* v108: posição inicial igual à de outro lance (o slide inicial) */
    const pb=s.querySelector("#pp-base"), segs_=seguidoresDe(L.id), so=soltasDe(L);
    if(segs_.length) pb.innerHTML=`<p class="sub" style="margin:0">É o <b>slide inicial</b> de: ${segs_.map(x=>esc(x.nome)).join(", ")}. Mexer aqui nas bolinhas, na bola ou nos adversários muda-os também.</p>`;
    else { const opc=lances().filter(x=>x.id!==L.id&&!x.base&&!x.dinamico&&x.bolas&&x.bolas.length);
      pb.innerHTML=`<label class="f">Posição inicial igual a<select id="pp-b"><option value="">— própria deste lance —</option>${opc.map(x=>`<option value="${esc(x.id)}">${esc(x.nome)}</option>`).join("")}</select></label>
        <p class="sub" style="margin:0">As bolinhas, a bola e os adversários seguem esse lance; as setas, as tarefas e os textos ficam deste.${L.base&&so.length?` Soltas neste lance: ${so.map(k=>esc(nomePecaL(L,k))).join(", ")}.`:""}</p>${L.base&&so.length?`<button class="btn" id="pp-todas">↺ Voltar a seguir todas</button>`:""}`;
      s.querySelector("#pp-b").value=L.base&&opc.some(x=>x.id===L.base)?L.base:"";
      const td=s.querySelector("#pp-todas"); if(td) td.onclick=()=>{ const B=baseDe(L); if(!B) return; const C=copiaLance(L); movePecas(C,paraBase(C,B)); C.soltas=[]; guardaLance(C,{segue:true}); fecha(); toast(`Tudo volta a seguir o «${B.nome}»`); }; }
    s.querySelector("#pp-ok").onclick=()=>{ const C=clone(L); C.nome=inp.value.trim()||L.nome; C.tipo=tipo;
      const sb=s.querySelector("#pp-b"), nb=sb?sb.value:L.base||""; let msg=null;
      if(sb&&nb!==(L.base||"")){ if(!nb){ desligaBase(C); msg="Este lance passa a ter a sua posição inicial"; }
        else { const B=lances().find(x=>x.id===nb); ligaBase(C,B); msg=`Posição inicial igual ao «${B.nome}» (o que arrastares depois neste lance fica no seu sítio)`; } }
      guardaLance(C,{segue:true}); fecha(); if(msg) toast(msg); };
  });
}
function folhaNovo(){
  const L=lanceAtual(); let tipo="OF", base="b-meio";
  folha(`<h3>Novo lance</h3><label class="f">Nome<input type="text" id="nv-n" placeholder="Ex.: Canto Dir. Fechado"></label>
    <div class="seg" role="group" aria-label="Tipo"><button data-t="DEF">Defensivo</button><button data-t="OF">Ofensivo</button></div>
    <h4>Começar a partir de</h4>
    <div class="seg" role="group" aria-label="Base" id="nv-b"><button data-b="b-meio">Meio-campo em branco</button><button data-b="pitch">Campo inteiro em branco</button><button data-b="dup">Duplicar “${esc(L.nome)}”</button></div>
    <label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="nv-bj" checked style="width:20px;height:20px"> Colocar bola (fica ao centro, arrastas para o sítio)</label>
    <p class="sub" style="margin:0">Em branco: as 11 bolinhas do onze base aparecem prontas a arrastar, com legendas por preencher.</p>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="nv-ok">Criar lance</button></div>`,(s,fecha)=>{
    const st=s.querySelectorAll(".seg[aria-label=Tipo] button"), sb=s.querySelectorAll("#nv-b button");
    const upd=()=>{ st.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.t===tipo))); sb.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.b===base))); };
    st.forEach(b=>b.onclick=()=>{tipo=b.dataset.t;upd();}); sb.forEach(b=>b.onclick=()=>{base=b.dataset.b;upd();}); upd();
    s.querySelector("#nv-ok").onclick=()=>{
      const nomeL=s.querySelector("#nv-n").value.trim()||"Novo lance";
      const id="L"+Date.now().toString(36);
      const ordem=Math.max(0,...lances().map(l=>l.ordem||0))+1;
      let N;
      if(base==="dup"){ N={...clone(L),id,nome:nomeL,tipo,ordem,original:false}; }
      else {
        N={id,nome:nomeL,tipo,ordem,fundo:base,titulo:true,bolas:[],legs:[]};
        const gk=titulares()[0];
        jogo.onze.forEach((o,k)=>{
          let cx,cy;
          if(base==="pitch"){ cx=o.x; cy=o.y; }
          else { const f=FUNDOS["b-meio"].campo; cx=Math.round(f[0]+3000+k*((f[2]-f[0]-6000)/10)); cy=f[3]-6500; }
          const e=o.n===gk?ESTILOS.gr:ESTILOS.normal;
          N.bolas.push({slot:o.slot,cx,cy,r:1450,fs:12,fill:e.fill,stroke:e.stroke,sw:e.sw,color:e.color});
          if(base==="b-meio") N.legs.push({slot:o.slot,x:69200,y:9200+k*4430,w:21600,h:3693,fs:18,parts:[]});
        });
      }
      if(base!=="dup"){ N.bj=s.querySelector("#nv-bj").checked?[{...centroCampo(N),r:1000}]:[]; }
      else if(!s.querySelector("#nv-bj").checked) N.bj=[]; else if(!(N.bj||[]).length) N.bj=[{...centroCampo(N),r:1000}];
      delete N.original;
      curId=id; editing=true; guardaLance(N); fecha(); toast("Lance criado. Arrasta as bolinhas e toca nas legendas.");
    };
  });
}
function folhaNotas(L){
  folha(`<h3>Indicações</h3><label class="f">Uma indicação por linha<textarea id="nt-t" rows="8" style="border:1px solid var(--line);border-radius:8px;padding:10px;font:inherit;background:var(--surface);color:var(--ink);width:100%"></textarea></label>
    <div class="actions">${L.notas?'<button class="btn danger l" id="nt-rem">Remover caixa</button>':''}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="nt-ok">Guardar</button></div>`,(s,fecha)=>{
    const ta=s.querySelector("#nt-t"); ta.value=(L.notas?.lines||[]).join("\n");
    if(L.notas&&L.notas.lines.length===1&&/^Escreve aqui/.test(L.notas.lines[0])) ta.value="";
    s.querySelector("#nt-ok").onclick=()=>{ const C=clone(L); const lines=ta.value.split("\n").map(x=>x.trim()).filter(Boolean);
      C.notas={...(L.notas||{x:3600,y:44500,w:30000}),lines}; guardaLance(C); fecha(); };
    const rm=s.querySelector("#nt-rem"); if(rm) rm.onclick=()=>{ const C=clone(L); delete C.notas; guardaLance(C); fecha(); toast("Caixa de indicações removida",()=>guardaLance(L)); };
    setTimeout(()=>ta.focus(),30);
  });
}
$("e-notas").onclick=()=>folhaNotas(lanceAtual());
$("e-cor").innerHTML=CORES_SETA.map(([c,n])=>`<option value="${c}">${n}</option>`).join("");
$("e-cor").onchange=e=>{ corSeta=e.target.value; };
$("e-seta").onclick=()=>{ modoSeta=!modoSeta; renderBoard(); if(modoSeta) toast("Arrasta no campo para desenhar a seta"); };
$("e-txt").onclick=()=>novoTexto(lanceAtual());
$("e-adv").onclick=()=>novoAdv(lanceAtual());
$("e-bj").onclick=()=>novaBJ(lanceAtual());
$("e-forma").onclick=()=>folhaNovaForma(lanceAtual());
$("e-addp").onclick=()=>novaBola(lanceAtual());
$("e-addl").onclick=()=>novaLegenda(lanceAtual());
$("e-props").onclick=()=>folhaProps(lanceAtual());
$("e-reset").onclick=()=>{ const L=lanceAtual(); const prev=lancesDb[L.id];
  apagaDoc("lances/"+L.id); delete lancesDb[L.id]; guardaLocal(); render(); toast("Lance reposto como no original",()=>{ guardaLance(prev); }); };
$("e-del").onclick=()=>{ const L=lanceAtual();
  folha(`<h3>Apagar “${esc(L.nome)}”?</h3><p class="sub" style="margin:0">As alterações que só se aplicam a este lance ficam sem efeito.${L.original?" Os lances do PowerPoint podem ser repostos mais tarde.":""}</p>
  <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="d-ok">Apagar lance</button></div>`,(s,fecha)=>{
    s.querySelector("#d-ok").onclick=()=>{ fecha(); editing=false;
      if(L.original){ lancesDb[L.id]={id:L.id,apagado:true}; gravaDoc("lances/"+L.id,lancesDb[L.id]); }
      else { delete lancesDb[L.id]; apagaDoc("lances/"+L.id); }
      guardaLocal(); curId=lances()[0]?.id; render(); toast("Lance apagado"); };
  });
};
