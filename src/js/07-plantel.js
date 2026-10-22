/* ---------- Plantel ---------- */
let pTimer=null;
function renderPlantel(){
  const tb=$("ptb"); if(tb.contains(document.activeElement)) return;
  tb.innerHTML=""; const tit=new Set(titulares());
  est.plantel.forEach((p,i)=>{
    const tr=document.createElement("tr");
    const est_=tit.has(p.n)?'<span class="badge t">TITULAR</span>':jogo.suplentes.includes(p.n)?'<span class="badge s">SUPLENTE</span>':'';
    tr.innerHTML=`<td class="num"><input type="text" inputmode="numeric" id="pn-${i}" aria-label="Número"></td><td><input type="text" id="pm-${i}" aria-label="Nome" placeholder="Nome ou alcunha"></td><td>${est_}</td><td><button class="icon" aria-label="Remover">✕</button></td>`;
    const [inN,inM]=tr.querySelectorAll("input"); inN.value=p.n; inM.value=p.nome||"";
    const upd=()=>{ clearTimeout(pTimer); pTimer=setTimeout(()=>{ const pl=est.plantel.slice(); pl[i]={n:inN.value.trim(),nome:inM.value.trim()}; guardaEst({...est,plantel:pl},true); },600); };
    inN.oninput=upd; inM.oninput=upd;
    tr.querySelector(".icon").onclick=()=>{ if(tit.has(p.n)){ toast("É titular: troca-o primeiro no separador Jogo."); return; }
      const pl=est.plantel.slice(); const rem=pl.splice(i,1)[0]; guardaEst({...est,plantel:pl}); toast(`Jogador ${rem.n} removido`,()=>{ const r=est.plantel.slice(); r.splice(i,0,rem); guardaEst({...est,plantel:r}); }); };
    tb.appendChild(tr);
  });
}
$("p-add").onclick=()=>{ guardaEst({...est,plantel:[...est.plantel,{n:"",nome:""}]}); setTimeout(()=>{ const x=$("pn-"+(est.plantel.length-1)); if(x) x.focus(); },50); };
