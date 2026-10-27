/* ---------- UI: quadro ---------- */
const $=id=>document.getElementById(id);
function renderNav(){
  const nav=$("nav"); nav.innerHTML="";
  const all=lances(); let k=0;
  [["JOGO","Jogo"],["DEF","Defensivos"],["OF","Ofensivos"],["REF","Referência"]].forEach(([t,lab])=>{
    const ls=all.filter(l=>l.tipo===t); if(!ls.length) return;
    const g=document.createElement("div"); g.className="grp"; g.innerHTML=`<h3>${lab}</h3><ul></ul>`;
    ls.forEach(L=>{ k++;
      const b=document.createElement("button");
      const c_=calcula(L), mod=L.bolas.length&&Object.entries(c_.v).some(([s,x])=>x!==c_.base[s]);
      if(mod) b.classList.add("mod");
      b.setAttribute("aria-current",L.id===lanceAtual().id?"true":"false");
      b.innerHTML=`<span class="pega" title="Arrastar para mudar a ordem" aria-hidden="true">⋮⋮</span><span class="n">${k}</span><span></span><span class="dot" title="Com alterações"></span>`;
      b.children[2].textContent=L.nome;
      b.onclick=()=>{curId=L.id;render();};
      const li=document.createElement("li"); li.dataset.id=L.id;
      li.appendChild(b); g.querySelector("ul").appendChild(li); ligaOrdem(b.querySelector(".pega"),li,b);
    });
    nav.appendChild(g);
  });
  const nb=document.createElement("button"); nb.className="newl"; nb.textContent="+ Novo lance"; nb.onclick=folhaNovo; nav.appendChild(nb);
}
function ligaOrdem(pg,li,btn){
  let bloqueiaClick=false;
  btn.addEventListener("click",e=>{ if(bloqueiaClick){ e.stopImmediatePropagation(); e.preventDefault(); bloqueiaClick=false; } },true);
  pg.addEventListener("pointerdown",e=>{ e.preventDefault(); e.stopPropagation(); const ul=li.parentElement;
    const horiz=getComputedStyle($("nav")).flexDirection==="row"; const x0=e.clientX, y0=e.clientY;
    btn.classList.add("arrasta"); dragging=true; let mudou=false, mexeu=false;
    const mv=ev=>{ if(Math.hypot(ev.clientX-x0,ev.clientY-y0)>6) mexeu=true; if(!mexeu) return;
      const irmaos=[...ul.children].filter(x=>x!==li);
      let antes=null; for(const x of irmaos){ const bb=x.querySelector("button").getBoundingClientRect(); if(horiz?ev.clientX<bb.left+bb.width/2:ev.clientY<bb.top+bb.height/2){ antes=x; break; } }
      if(antes!==li.nextElementSibling){ ul.insertBefore(li,antes); mudou=true; } };
    const up=()=>{ window.removeEventListener("pointermove",mv); window.removeEventListener("pointerup",up); window.removeEventListener("pointercancel",up);
      btn.classList.remove("arrasta"); dragging=false; if(mexeu) bloqueiaClick=true; setTimeout(()=>bloqueiaClick=false,400);
      if(mudou){ const ids=[...$("nav").querySelectorAll("li[data-id]")].map(x=>x.dataset.id); const prev=est.ordem.slice();
        guardaEst({...est,ordem:ids}); toast("Ordem dos lances atualizada",()=>guardaEst({...est,ordem:prev})); } else if(!mexeu){ curId=li.dataset.id; render(); } else render(); };
    window.addEventListener("pointermove",mv); window.addEventListener("pointerup",up); window.addEventListener("pointercancel",up); });
}
function renderBoard(){
  const L=lanceAtual(); if(!L) return;
  curId=L.id;
  $("b-tag").className="tag "+L.tipo; $("b-tag").textContent=L.tipo;
  $("b-title").textContent=L.nome;
  $("btn-edit").textContent=editing?"✓ Concluir":"✎ Editar lance";
  $("btn-nomes").setAttribute("aria-pressed",String(nomesOn)); $("btn-nomes").textContent=nomesOn?"✓ Nomes":"Nomes";
  $("editbar").hidden=!editing;
  $("e-reset").hidden=!(L.original&&lancesDb[L.id]);
  const din=L.dinamico==="onze"||L.dinamico==="notas"||L.dinamico==="encaixe";
  ["e-addp","e-addl","e-props","e-del","e-notas","e-seta","e-txt","e-adv"].forEach(id=>$(id).hidden=din);
  if(!editing) modoSeta=false;
  $("e-seta").setAttribute("aria-pressed",String(modoSeta)); $("e-seta").textContent=modoSeta?"✓ A desenhar setas":"+ Seta";
  $("e-cor").hidden=!modoSeta||din; $("e-cor").value=corSeta;
  $("e-notas").textContent=L.notas?"Indicações":"+ Indicações";
  const st=$("stage"); st.classList.toggle("editing",editing); st.innerHTML=""; st.appendChild(desenha(L));
  if(L.dinamico==="notas"){ $("hint").innerHTML=`<span><b>+ Nota</b> (no topo) regista um momento com o minuto do relógio. <b>Toca</b> numa nota para a editar ou apagar.</span>`; $("btn-edit").hidden=true; $("editbar").hidden=true; editing=false; return; }
  if(L.dinamico==="encaixe"){ $("hint").innerHTML=`<span><b>Arrasta</b> as bolinhas das duas equipas; <b>toca</b> numa para ver o nome completo e a posição. As substituições e os cartões marcados no <b>Ao vivo</b> (das duas equipas) atualizam este quadro: bolinha verde = entrou, cartão amarelo, vermelho ou 2.º amarelo = bolinha esbatida. O Onze não muda.</span>`; $("btn-edit").hidden=true; $("editbar").hidden=true; editing=false; return; }
  $("btn-edit").hidden=false;
  $("hint").innerHTML=din?`<span><b>Arrasta</b> as peças ou <b>toca</b> numa para mudar o titular ou a posição. É o mesmo quadro do separador Jogo.</span>`
    :!editing?`<span><b>Arrasta</b> as bolas e as legendas para as mover. <b>Toca</b> numa legenda para a editar e numa bola para ${est.fase==="pre"?"definir quem faz essa tarefa":"substituir"}.</span><span class="legend-chip"><i></i>trocado durante o jogo</span>`:editing?`<span><b>Arrasta</b> para mover. <b>Toca</b> numa bolinha para mudar o estilo ou a posição do onze; numa legenda para escrever a tarefa.</span>`
    :`<span><b>Toca numa bolinha</b> para trocar o jogador.</span><span class="legend-chip"><i></i>trocado durante o jogo</span>`;
  { const L_=lanceAtual(); if(!L_.dinamico){ const d=calcula(L_).dups||[]; if(d.length) $("hint").innerHTML=`<span style="color:#B45F00"><b>⚠ ${d.map(n=>"Nº "+esc(n)).join(", ")} repetido neste lance</b> (anel laranja). Toca numa dessas bolinhas e escolhe quem faz essa tarefa. Para mostrar o mesmo jogador noutro sítio de propósito, usa o estilo <b>Alternativa</b> (bola branca).</span>`+$("hint").innerHTML; } }
}
function renderRows(){
  const pre=est.fase==="pre";
  $("fz-pre").setAttribute("aria-pressed",String(pre)); $("fz-jogo").setAttribute("aria-pressed",String(!pre));
  $("p-tit").firstChild.textContent=pre?"Definições pré-jogo ":"Trocas no jogo ";
  $("p-sub").textContent=pre?"A equipa de cada lance para este jogo. Não conta como troca nem fica realçado. Aplicam-se por ordem; se quem entra já está no lance, os dois trocam."
    :"Só o que muda durante o jogo. Fica realçado a dourado face à equipa definida no pré-jogo. Aplicam-se por ordem; se quem entra já está no lance, os dois trocam.";
  $("f-add").textContent=pre?"Definir":"Adicionar troca";
  const vis=est.linhas.map((l,i)=>[l,i]).filter(([l])=>!!l.pre===pre);
  $("btn-limpa").hidden=pre||!vis.length;
  $("btn-gpre").hidden=!pre||!vis.length;
  const ol=$("rows"); ol.innerHTML=""; $("cnt").textContent=vis.length;
  if(!vis.length){ ol.innerHTML=pre?`<li class="empty" style="display:block"><b>Sem definições.</b> Toca numa bolinha para escolher quem faz cada tarefa neste jogo.</li>`
    :`<li class="empty" style="display:block"><b>Sem trocas.</b> Os lances mostram a equipa definida no pré-jogo.</li>`; return; }
  const L=lanceAtual();
  vis.forEach(([l,i],k)=>{
    const li=document.createElement("li"); li.className=aplica(l,L.id)?"here":"";
    const onde=l.modo==="todos"?"Todos os lances":(l.lances||[]).map(lanceNome).join(", ");
    const se=semEfeito(i);
    li.innerHTML=`<span class="ix">${k+1}</span><div><div class="swap"><span class="out"></span><span class="arr">→</span><span class="in"></span></div>
      <div class="meta"><span class="onde"></span>${se?' · <span class="warn">sem efeito: o '+esc(l.sai)+' não está em campo aí</span>':''}</div></div>
      <div class="rowbtns"><button class="icon" aria-label="Subir" ${k===0?"disabled":""}>▲</button><button class="icon" aria-label="Descer" ${k===vis.length-1?"disabled":""}>▼</button><button class="icon" aria-label="Apagar">✕</button></div>`;
    li.querySelector(".out").textContent=rot(l.sai); li.querySelector(".in").textContent=rot(l.entra); li.querySelector(".onde").textContent=onde+(l.pre?"":(l.min?" · aos "+l.min:" · sem minuto"));
    if(!l.pre){ const md=li.querySelector(".meta"); md.style.cursor="pointer"; md.title="Toca para mudar o minuto"; md.onclick=()=>folhaMin(i); }
    const [up,down,del]=li.querySelectorAll(".rowbtns button");
    up.onclick=()=>mexe(i,-1); down.onclick=()=>mexe(i,1);
    del.onclick=()=>{ const rem=est.linhas[i]; const nl=est.linhas.slice(); nl.splice(i,1); guardaEst({...est,linhas:nl});
      toast(`Alteração ${rem.sai} → ${rem.entra} apagada`,()=>{ const r=est.linhas.slice(); r.splice(i,0,rem); guardaEst({...est,linhas:r}); }); };
    ol.appendChild(li);
  });
}
function grupos(sel,grs){
  const prev=sel.value; sel.innerHTML="";
  grs.forEach(([lab,nums])=>{ if(!nums.length) return; const og=document.createElement("optgroup"); og.label=lab;
    nums.forEach(n=>{ const o=document.createElement("option"); o.value=n; o.textContent=rot(n); og.appendChild(o); }); sel.appendChild(og); });
  if(prev && [...sel.options].some(o=>o.value===prev)) sel.value=prev;
}
function renderForm(){
  const L=lanceAtual();
  const emCampo=L.bolas.length?[...new Set(Object.values(calcula(L).v))].sort(byNum):titulares().slice().sort(byNum);
  const sup=jogo.suplentes.filter(n=>!emCampo.includes(n)).sort(byNum);
  const tit=titulares().filter(n=>!emCampo.includes(n)&&!sup.includes(n)).sort(byNum);
  const resto=est.plantel.map(p=>p.n).filter(n=>n&&!emCampo.includes(n)&&!sup.includes(n)&&!tit.includes(n)).sort(byNum);
  grupos($("f-sai"), scope==="este"?[["Em campo neste lance",emCampo]]:[["Em campo neste lance",emCampo],["Suplentes",sup],["Outros titulares",tit],["Resto do plantel",resto]]);
  grupos($("f-entra"),[["Suplentes",sup],["Em campo (troca)",emCampo],["Outros titulares",tit],["Resto do plantel",resto]]);
  if($("f-entra").value===$("f-sai").value){ const o=[...$("f-entra").options].find(o=>o.value!==$("f-sai").value); if(o) $("f-entra").value=o.value; }
  ["este","todos","esc"].forEach(k=>$("sc-"+k).setAttribute("aria-pressed",String(scope===k)));
  const pk=$("picks"); pk.hidden=scope!=="esc";
  if(scope==="esc"){ const marc=new Set([...pk.querySelectorAll("input:checked")].map(i=>i.value)); pk.innerHTML="";
    lances().filter(l=>l.bolas.length).forEach(l=>{ const lb=document.createElement("label"); lb.innerHTML=`<input type="checkbox" value="${esc(l.id)}"> <span></span>`;
      lb.querySelector("span").textContent=l.nome; if(marc.has(l.id)) lb.querySelector("input").checked=true; pk.appendChild(lb); }); }
}
$("btn-gpre").onclick=()=>{
  const prevL=[], antes=est.linhas.slice();
  lances().forEach(L=>{ if(!L.bolas.length||L.dinamico) return; const c=calcula(L); const fx={...(L.fixo||{})}; let mud=false;
    Object.entries(c.base).forEach(([sl,n])=>{ if(n!==((L.fixo&&L.fixo[sl])||baseOf(sl))){ fx[sl]=n; mud=true; } });
    if(mud){ prevL.push(clone(L)); const C=clone(L); C.fixo=fx; guardaLance(C); } });
  guardaEst({...est,linhas:est.linhas.filter(l=>!l.pre)});
  toast(`Pré-jogo guardado em ${prevL.length} lance(s)`,()=>{ prevL.forEach(L=>guardaLance(L)); guardaEst({...est,linhas:antes}); });
};
function folhaMin(i){ const l=est.linhas[i];
  folha(`<h3>Minuto da troca ${esc(l.sai)} → ${esc(l.entra)}</h3><label class="f">Minuto (m:ss)<input type="text" id="mn-v" inputmode="numeric"></label>
    <div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="mn-ok">Guardar</button></div>`,(s,fecha)=>{
    const v=s.querySelector("#mn-v"); v.value=l.min||""; s.querySelector("#mn-ok").onclick=()=>{ const nl=est.linhas.slice(); nl[i]={...l,min:v.value.trim()}; if(!nl[i].min) delete nl[i].min; guardaEst({...est,linhas:nl}); fecha(); }; setTimeout(()=>v.focus(),40); }); }
function setFase(f){ guardaEst({...est,fase:f}); }
$("fz-pre").onclick=()=>setFase("pre"); $("fz-jogo").onclick=()=>setFase("jogo");
$("btn-limpa").onclick=()=>{ const prev=est.linhas.slice(); guardaEst({...est,linhas:est.linhas.filter(l=>l.pre)}); toast("Trocas do jogo apagadas; as definições pré-jogo mantêm-se",()=>guardaEst({...est,linhas:prev})); };
function mexe(i,d){ const nl=est.linhas.slice(); const pre=!!nl[i].pre; let j=i+d; while(j>=0&&j<nl.length&&!!nl[j].pre!==pre) j+=d;
  if(j<0||j>=nl.length) return; [nl[i],nl[j]]=[nl[j],nl[i]]; guardaEst({...est,linhas:nl}); }
function novaLinha(sai,entra,modo,ids,min,int,slot){
  if(!sai||!entra||sai===entra) return;
  const l={id:Math.random().toString(36).slice(2,9),sai,entra,modo}; if(modo!=="todos") l.lances=ids; if(slot&&modo!=="todos") l.slot=slot; if(est.fase==="pre") l.pre=true;
  if(est.fase!=="pre"){ const tj=tempoJogo(); const mm=(min!=null?String(min):(tj!=null?fmt(tj):"")).trim(); if(mm) l.min=mm; if(int) l.int=true; }
  guardaEst({...est,linhas:[...est.linhas,l]});
  toast(`${est.fase==="pre"?"Definido":"Troca"}: ${sai} → ${entra} em ${modo==="todos"?"todos os lances":ids.map(lanceNome).join(", ")}`);
}
$("f-add").onclick=()=>{
  const L=lanceAtual(); let ids=[L.id], modo="lances";
  if(scope==="todos") modo="todos";
  if(scope==="esc"){ ids=[...$("picks").querySelectorAll("input:checked")].map(i=>i.value); if(!ids.length){ toast("Escolhe pelo menos um lance."); return; } }
  if($("f-sai").value===$("f-entra").value){ toast("Quem sai e quem entra têm de ser diferentes."); return; }
  novaLinha($("f-sai").value,$("f-entra").value,modo,ids);
};
["este","todos","esc"].forEach(k=>$("sc-"+k).onclick=()=>{scope=k;renderForm();});
function passo(d){ const all=lances(); const i=all.findIndex(l=>l.id===lanceAtual().id); curId=all[(i+d+all.length)%all.length].id; render(); }
$("prev").onclick=()=>passo(-1); $("next").onclick=()=>passo(1);
$("btn-rel").onclick=folhaRelogio;
$("btn-nota").onclick=()=>folhaNota(null);
setInterval(()=>{ const t=tempoJogo(); $("rel-t").textContent=t==null?"0:00":fmt(t); $("btn-rel").classList.toggle("dark",!!(jogo.relogio&&jogo.relogio.correr)); },1000);
function setNomes(v){ nomesOn=v; try{ localStorage.setItem("sca-nomes",v?"1":"0"); }catch(e){} render(); }
$("btn-nomes").onclick=()=>setNomes(!nomesOn);
$("btn-edit").onclick=()=>{ editing=!editing; renderBoard(); };
$("e-done").onclick=()=>{ editing=false; renderBoard(); };
