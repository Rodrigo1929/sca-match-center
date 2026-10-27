/* ---------- separadores / apresentação / toast ---------- */
function renderBanco(){ const box=$("banco"); if(!box) return; const vis=!$("view-q").hidden||!$("view-j").hidden; box.hidden=!vis||est.fase==="pre"&&!(jogo.eventos||[]).length&&!(jogo.subs||[]).length; if(box.hidden) return;
  const C=COMPS[jogo.comp]||COMPS.taca, sr=subsReais(), np=paragensDe(sr.lista).length, ns=sr.lista.length, pl=placar(), ct=cartoes();
  const am=Object.entries(ct).filter(([n,c])=>!c.verm&&c.am===1).map(([n])=>n), vm=Object.entries(ct).filter(([n,c])=>c.verm).map(([n])=>n);
  box.innerHTML=`<span class="pl">SCA <em>${pl.nos}</em>–<em>${pl.eles}</em> ${esc((jogo.adversario||"ADV").slice(0,14).toUpperCase())}</span>
    <span class="it ${ns>=C.subs?"alerta":""}">Substituições <b>${ns}/${C.subs>=99?"–":C.subs}</b></span>
    <span class="it ${np>=C.paragens?"alerta":""}">Paragens <b>${np}/${C.paragens>=99?"–":C.paragens}</b></span>
    ${am.length||vm.length?`<span class="crt">${am.map(n=>`<span style="background:#FFD54A;color:#000">🟨 ${esc(n)}</span>`).join("")}${vm.map(n=>`<span style="background:#C00000;color:#fff">🟥 ${esc(n)}</span>`).join("")}</span>`:""}
    <span class="it" style="font-size:12px">${esc(C.nome)}</span>
    <span class="acts"><button class="btn sm" id="bc-golo">⚽ Golo</button><button class="btn sm" id="bc-cart">🟨 Cartão</button><button class="btn sm" id="bc-canto">🚩 Canto</button><button class="btn sm primary" id="bc-pain">Painel</button></span>`;
  $("bc-golo").onclick=()=>folhaEvento("golo"); $("bc-canto").onclick=()=>folhaEvento("canto"); $("bc-cart").onclick=()=>folhaEvento("amarelo"); $("bc-pain").onclick=folhaPainel; }
function minAgora(){ const tj=tempoJogo(); return tj!=null?fmt(tj):""; }
function chips(box,opts,sel,multi,onCh){ box.innerHTML=""; opts.forEach(([k,n])=>{ const b=document.createElement("button"); b.type="button"; b.innerHTML=`<b style="font-family:var(--f-display)">${k}</b> <span>${n}</span>`;
    const on=()=>multi?sel.includes(k):sel[0]===k; b.setAttribute("aria-pressed",String(on()));
    b.onclick=()=>{ if(multi){ const i=sel.indexOf(k); i>=0?sel.splice(i,1):sel.push(k); } else { sel.splice(0,sel.length,...(sel[0]===k?[]:[k])); } box.querySelectorAll("button").forEach((x,j)=>x.setAttribute("aria-pressed",String(multi?sel.includes(opts[j][0]):sel[0]===opts[j][0]))); onCh&&onCh(); };
    box.appendChild(b); }); }
function folhaEvento(tipo0,ev0){ let tipo=ev0?ev0.tipo:tipo0, n=ev0?.n||null, as=ev0?.as||null, pa=ev0?.pa||null; const gt=[...(ev0?.gt||[])], ast=ev0?.ast?[ev0.ast]:[], zona=ev0?.zona?[ev0.zona]:[], res=ev0?.res?[ev0.res]:[];
  const fam=tipo.startsWith("golo")?"golo":tipo==="canto"?"canto":"cartao";
  const grupo=fam==="golo"?["golo","golo_adv"]:fam==="canto"?["canto"]:["amarelo","vermelho","amarelo_adv","vermelho_adv"];
  folha(`<h3>${fam==="golo"?"⚽ Golo":fam==="canto"?"🚩 Canto SC Angrense":"🟨 Cartão"}${ev0?" · editar":""}</h3>
    ${grupo.length>1?`<div class="seg" role="group" id="ev-t">${grupo.map(t=>`<button data-t="${t}">${EVT[t][1]}</button>`).join("")}</div>`:""}
    <label class="f">Minuto<input type="text" id="ev-m" inputmode="numeric" placeholder="Ex.: 23:10"></label>
    <div id="ev-jw"><h4 id="ev-jt">Jogador</h4><div id="ev-j"></div></div>
    <div id="ev-advw"><h4 id="ev-advt">Jogador do adversário (opcional)</h4><div id="ev-adv"></div></div>
    <label class="f" id="ev-nal"><span id="ev-nat">Nº do adversário (opcional)</span><input type="text" id="ev-na" inputmode="numeric"></label>
    <div id="ev-gw"><h4>Tipo de golo</h4><div class="styles" id="ev-g"></div></div>
    <details class="more" id="ev-aw"><summary>Assistência (opcional)</summary><div class="pgrid" id="ev-a" style="margin-top:8px"></div><h4>Tipo de assistência</h4><div class="styles" id="ev-at"></div></details>
    <div id="ev-cw"><label class="f">Canto usado<select id="ev-bpl"></select></label><h4>Zona</h4><div class="styles" id="ev-z"></div><h4>Ação</h4><div class="styles" id="ev-r"></div></div>
    <label class="f" id="ev-ol">Nota (opcional)<input type="text" id="ev-o" placeholder="Ex.: ressalto, 2ª bola"></label>
    <div class="actions">${ev0?`<button class="btn danger l" id="ev-del">Apagar</button>`:""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="ev-ok">${ev0?"Guardar":"Registar"}</button></div>`,(s,fecha)=>{
    const q=x=>s.querySelector(x);
    q("#ev-m").value=ev0?ev0.min:minAgora();
    q("#ev-bpl").innerHTML=`<option value="">— Não indicado —</option>`+lances().filter(l=>l.tipo==="OF").map(l=>`<option value="${esc(l.id)}">${esc(l.nome)}</option>`).join(""); q("#ev-bpl").value=ev0?.bpl||""; q("#ev-o").value=ev0?.obs||""; q("#ev-na").value=ev0?.na||"";
    const em=[...subsReais().campo].sort(byNum);
    const pinta=()=>{ s.querySelectorAll("#ev-t button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.t===tipo)));
      const nosso=!tipo.endsWith("_adv"), golo=tipo.startsWith("golo"), canto=tipo==="canto";
      q("#ev-jw").hidden=!nosso||canto; q("#ev-nal").hidden=nosso; q("#ev-advw").hidden=nosso||!eqAdv();
      q("#ev-nat").textContent=golo?"Nº do adversário que marcou (opcional)":"Nº do adversário (opcional)"; q("#ev-advt").textContent=golo?"Marcador do adversário (opcional)":"Jogador do adversário (opcional)";
      /* adversário: escolhe-se do plantel dele (em campo primeiro) ou escreve-se só o número */
      if(!nosso&&eqAdv()){ const T=eqAdv(), on=advEmCampo().on, emC=p_=>on.some(o=>ehJog(o,p_)), na=q("#ev-na");
        const G=grelhaAdv(q("#ev-adv"),T.plantel.filter(p_=>p_.n||p_.nome).map(p_=>({k:p_.id,n:p_.n,nome:p_.nome,pos:p_.pos,marca:emC(p_)?"em campo":"",ec:emC(p_)})),{sel:pa,pesquisa:true,primeiro:x=>x.ec,onPick:x=>{ pa=x.k; na.value=x.n; }});
        na.oninput=()=>{ const p_=T.plantel.find(x=>x.id===pa); if(!p_||p_.n!==na.value.trim()){ pa=null; G.marca(null); } }; } q("#ev-gw").hidden=!golo; q("#ev-aw").hidden=tipo!=="golo"; q("#ev-cw").hidden=!canto;
      q("#ev-jt").textContent=golo?"Marcador":"Jogador";
      const g=q("#ev-j"); g.innerHTML=""; if(nosso&&!canto){ const ct=cartoes(), marca=x=>ct[x]?.verm?"🟥":ct[x]?.am?"🟨":"", sr=subsReais();
        /* cartões: também para o banco e para quem já saiu (e, se preciso, o resto do plantel) */
        const sairam=[...new Set([...titulares(),...sr.lista.map(l=>l.entra)])].filter(x=>!sr.campo.has(x)).sort(byNum);
        const banco=jogo.suplentes.filter(x=>!sr.campo.has(x)&&!sairam.includes(x)).sort(byNum), resto=est.plantel.map(p=>p.n).filter(x=>x&&!sr.campo.has(x)&&!banco.includes(x)&&!sairam.includes(x)).sort(byNum);
        const marcaSel=()=>g.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.querySelector("b")?.textContent===n))), escolhe=x=>{ n=n===x?null:x; marcaSel(); };
        (golo?[["",em]]:[["Em campo",em],["Banco",banco],["Já saíram",sairam]]).forEach(([t,ls])=>{ if(!ls.length) return; if(t) g.insertAdjacentHTML("beforeend",`<h5 class="evj-h">${t}</h5>`);
          const d=document.createElement("div"); d.className="pgrid"; g.appendChild(d); botoesJog(d,ls,escolhe,marca); });
        if(!golo&&resto.length){ const det=document.createElement("details"); det.className="more"; det.innerHTML=`<summary>Resto do plantel</summary><div class="pgrid" style="margin-top:8px"></div>`; g.appendChild(det);
          botoesJog(det.querySelector(".pgrid"),resto,escolhe,marca); if(n&&resto.includes(n)) det.open=true; }
        marcaSel(); }
      if(golo){ chips(q("#ev-g"),GOLO_COD,gt,true); }
      if(tipo==="golo"){ const ga=q("#ev-a"); ga.innerHTML=""; botoesJog(ga,em,x=>{ as=as===x?null:x; ga.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.querySelector("b").textContent===as))); }); ga.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.querySelector("b").textContent===as))); chips(q("#ev-at"),GOLO_COD.filter(([k])=>k!=="AG"&&k!=="P"),ast,false); if(as) q("#ev-aw").open=true; }
      if(canto){ chips(q("#ev-z"),CANTO_Z,zona,false); chips(q("#ev-r"),CANTO_R,res,false); } };
    s.querySelectorAll("#ev-t button").forEach(b=>b.onclick=()=>{ tipo=b.dataset.t; n=null; pinta(); }); pinta();
    if(q("#ev-del")) q("#ev-del").onclick=()=>{ const prev=clone(jogo.eventos); fecha(); guardaJogo({...jogo,eventos:jogo.eventos.filter(x=>x.id!==ev0.id)},true); toast("Evento apagado",()=>guardaJogo({...jogo,eventos:prev},true)); };
    q("#ev-ok").onclick=()=>{ const nosso=!tipo.endsWith("_adv"); if(nosso&&tipo!=="canto"&&!tipo.startsWith("golo")&&!n){ toast("Escolhe o jogador."); return; }
      const e={id:ev0?.id||Math.random().toString(36).slice(2,9),c:ev0?.c||Date.now(),tipo,min:q("#ev-m").value.trim(),...(nosso&&tipo!=="canto"&&n?{n}:{}),...(q("#ev-o").value.trim()?{obs:q("#ev-o").value.trim()}:{}),
        ...(tipo.startsWith("golo")&&gt.length?{gt:[...gt]}:{}),...(tipo==="golo"&&as?{as}:{}),...(tipo==="golo"&&as&&ast[0]?{ast:ast[0]}:{}),...(!nosso&&q("#ev-na").value.trim()?{na:q("#ev-na").value.trim()}:{}),...(!nosso&&pa?{pa}:{}),
        ...(tipo==="canto"&&zona[0]?{zona:zona[0]}:{}),...(tipo==="canto"&&q("#ev-bpl").value?{bpl:q("#ev-bpl").value}:{}),...(tipo==="canto"&&res[0]?{res:res[0]}:{})};
      const prev=clone(jogo.eventos||[]); const ct0=cartoes(); fecha();
      guardaJogo({...jogo,eventos:ev0?(jogo.eventos||[]).map(x=>x.id===ev0.id?e:x):[...(jogo.eventos||[]),e]},true);
      const aviso=!ev0&&e.tipo==="amarelo"&&ct0[e.n]?.am===1?` · 2.º amarelo: ${rot(e.n)} expulso`:"";
      const avisoAdv=!ev0&&e.tipo==="amarelo_adv"&&(e.na||e.pa)&&(jogo.eventos||[]).filter(x=>x.tipo==="amarelo_adv"&&(e.pa&&x.pa?x.pa===e.pa:x.na===e.na)).length>=2?" · 2.º amarelo: expulso":"";
      toast(`${EVT[e.tipo][0]} ${e.min} ${EVT[e.tipo][1]}${e.n?" · "+rot(e.n):""}${e.na||e.pa?" · "+rotAdv(e.na||"",e.pa):""}${aviso}${avisoAdv}`,()=>guardaJogo({...jogo,eventos:prev},true)); };
  }); }
function folhaPainel(){ const C=COMPS[jogo.comp]||COMPS.taca, sr=subsReais(), par=paragensDe(sr.lista), ct=cartoes();
  const evs=(jogo.eventos||[]).slice().sort((a,b)=>(minSeg(a.min)??0)-(minSeg(b.min)??0));
  const mj=minutosJogados().sort((a,b)=>b.min-a.min||byNum(a.n,b.n)), mx=Math.max(90,...mj.map(x=>x.min));
  folha(`<h3>Painel do jogo · <span class="big"></span></h3>
    <label class="f">Competição<select id="pn-c">${Object.entries(COMPS).map(([k,v])=>`<option value="${k}">${esc(v.nome)}${v.subs<99?` · ${v.subs} subs, ${v.paragens} paragens${v.sup?`, ${v.sup} suplentes`:""}`:""}</option>`).join("")}</select></label>
    <h4>Substituições · ${sr.lista.length}/${C.subs>=99?"–":C.subs} · paragens ${par.length}/${C.paragens>=99?"–":C.paragens} <span class="sub">(intervalo não conta)</span></h4>
    <ul class="evl" id="pn-s"></ul>
    <h4>Golos, cartões e cantos <span class="sub">(toca para editar)</span></h4><ul class="evl" id="pn-e"></ul>
    <div class="actions" style="justify-content:flex-start"><button class="btn sm" id="pn-g">⚽ Golo</button><button class="btn sm" id="pn-k">🟨 Cartão</button><button class="btn sm" id="pn-c2">🚩 Canto</button><button class="btn sm" id="pn-f">⬇ Ficha de jogo</button></div>
    <h4>Minutos jogados</h4><table class="mj"><thead><tr><th>Jogador</th><th>Min</th><th style="width:45%"></th></tr></thead><tbody id="pn-m"></tbody></table>
    <div class="actions"><button class="btn dark" data-close>Fechar</button></div>`,(s,fecha)=>{
    s.querySelector(".big").textContent=`SCA ${placar().nos}–${placar().eles} ${jogo.adversario||""}`;
    const sel=s.querySelector("#pn-c"); sel.value=jogo.comp||"taca"; sel.onchange=()=>{ guardaJogo({...jogo,comp:sel.value},true); fecha(); folhaPainel(); };
    const us=s.querySelector("#pn-s"); if(!sr.lista.length) us.innerHTML=`<li class="sub">Ainda sem substituições.</li>`;
    sr.lista.forEach(l=>{ const li=document.createElement("li"); li.innerHTML=`<span class="t"></span><span style="flex:1"></span><label style="display:flex;gap:4px;align-items:center;font-size:12.5px;color:var(--muted)"><input type="checkbox"> Intervalo</label>`;
      li.querySelector(".t").textContent=l.int?"Int.":(l.min||"?"); li.children[1].textContent=`↓ ${rot(l.sai)}  ↑ ${rot(l.entra)}`;
      const cb=li.querySelector("input"); cb.checked=!!l.int; cb.onchange=()=>{ guardaJogo({...jogo,subs:jogo.subs.map(x=>{ if(x.id!==l.id) return x; const y={...x}; if(cb.checked){ y.int=true; y.min="45:00"; } else delete y.int; return y; })},true); fecha(); folhaPainel(); };
      us.appendChild(li); });
    const ue=s.querySelector("#pn-e"); if(!evs.length) ue.innerHTML=`<li class="sub">Sem golos nem cartões.</li>`;
    evs.forEach(e=>{ const li=document.createElement("li"); li.innerHTML=`<span class="t"></span><span style="flex:1"></span><button class="icon x" aria-label="Apagar">✕</button>`;
      li.querySelector(".t").textContent=e.min||"?"; li.children[1].textContent=`${EVT[e.tipo][0]} ${EVT[e.tipo][1]}${e.n?" · "+rot(e.n):""}${e.gt?" · "+e.gt.join(" "):""}${e.as?" · assist. "+e.as:""}${e.na?" · nº "+e.na:""}${e.bpl?" · "+nomeBpl(e.bpl):""}${e.zona?" · "+e.zona:""}${e.res?" · "+e.res:""}${e.obs?" · "+e.obs:""}`;
      li.style.cursor="pointer"; li.children[1].onclick=()=>{ fecha(); folhaEvento(e.tipo,e); };
      li.querySelector(".x").onclick=()=>{ const prev=clone(jogo.eventos); guardaJogo({...jogo,eventos:jogo.eventos.filter(x=>x.id!==e.id)},true); fecha(); folhaPainel(); toast("Evento apagado",()=>guardaJogo({...jogo,eventos:prev},true)); };
      ue.appendChild(li); });
    s.querySelector("#pn-g").onclick=()=>{ fecha(); folhaEvento("golo"); }; s.querySelector("#pn-c2").onclick=()=>{ fecha(); folhaEvento("canto"); };
    s.querySelector("#pn-f").onclick=e=>guardaFicha(e.currentTarget); s.querySelector("#pn-k").onclick=()=>{ fecha(); folhaEvento("amarelo"); };
    const tb=s.querySelector("#pn-m"); mj.forEach(x=>{ const tr=document.createElement("tr"); const c=ct[x.n];
      tr.innerHTML=`<td></td><td><b>${x.min}'</b></td><td><span class="bar" style="width:${Math.round(x.min/mx*100)}%;background:${x.tit?"var(--red)":"#B8963F"}"></span></td>`;
      tr.children[0].textContent=rot(x.n)+(x.tit?"":" (entrou)")+(c?.verm?" 🟥":c?.am?" 🟨":""); tb.appendChild(tr); });
  }); }
function setTab(t){ if(t!=="m"&&typeof mPara==="function") mPara(); if(t!=="m"&&typeof mSaiFig==="function") mSaiFig(); if(t!=="x"&&typeof xPara==="function") xPara();
  ["q","j","d","p","h","a","v","m","x","u"].forEach(k=>{ $("tab-"+k).setAttribute("aria-selected",String(k===t)); $("view-"+k).hidden=k!==t; }); renderBanco(); if(t==="j") renderJogo(); if(t==="d") renderAdv(); if(t==="h") renderHist(); if(t==="a") renderAnalise(); if(t==="v") renderVivo(); if(t==="m"&&typeof renderModelo==="function") renderModelo(); if(t==="x"&&typeof renderEx==="function") renderEx(); if(t==="u"&&typeof renderUT==="function") renderUT(); }
["q","j","d","p","h","a","v","m","x","u"].forEach(k=>$("tab-"+k).onclick=()=>setTab(k));
function dataPt(d){ return d?new Date(d+"T12:00").toLocaleDateString("pt-PT"):"sem data"; }