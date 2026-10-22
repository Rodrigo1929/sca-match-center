/* ---------- Plantel ---------- */
/* posições do sistema no campo do plantel das UT (como na ficha do clube): [nº, nome, x, y] em fração do meio campo, baliza em cima */
const POS_UT=[["1","GR",.5,.05],["2","DC direito",.278,.36],["3","DC meio",.5,.35],["4","DC esquerdo",.722,.36],["7","Ala direito",.075,.5],["5","Ala esquerdo",.925,.5],
  ["8","Médio direito",.32,.61],["6","Médio esquerdo",.68,.62],["10","Avançado direito",.16,.775],["9","Ponta de lança",.5,.795],["11","Avançado esquerdo",.84,.775]];
const nomePosUT=k=>{ const p=POS_UT.find(x=>x[0]===k); return p?`${p[0]} · ${p[1]}`:""; };
let pTimer=null;
function renderPlantel(){
  const tb=$("ptb"); if(tb.contains(document.activeElement)) return;
  tb.innerHTML=""; const tit=new Set(titulares());
  est.plantel.forEach((p,i)=>{
    const tr=document.createElement("tr");
    const est_=tit.has(p.n)?'<span class="badge t">TITULAR</span>':jogo.suplentes.includes(p.n)?'<span class="badge s">SUPLENTE</span>':'';
    tr.innerHTML=`<td class="num"><input type="text" inputmode="numeric" id="pn-${i}" aria-label="Número"></td><td><input type="text" id="pm-${i}" aria-label="Nome" placeholder="Nome ou alcunha"></td>
      <td><select id="pp-${i}" aria-label="Posição no campo do plantel (UT)"><option value="">—</option>${POS_UT.map(([k,n])=>`<option value="${k}">${k} · ${n}</option>`).join("")}</select></td><td>${est_}</td><td><button class="icon" aria-label="Remover">✕</button></td>`;
    const [inN,inM]=tr.querySelectorAll("input"), inP=tr.querySelector("select"); inN.value=p.n; inM.value=p.nome||""; inP.value=p.pos||"";
    const upd=()=>{ clearTimeout(pTimer); pTimer=setTimeout(()=>{ const pl=est.plantel.slice(); pl[i]={n:inN.value.trim(),nome:inM.value.trim(),...(inP.value?{pos:inP.value}:{})}; guardaEst({...est,plantel:pl},true); },600); };
    inN.oninput=upd; inM.oninput=upd; inP.onchange=upd;
    tr.querySelector(".icon").onclick=()=>{ if(tit.has(p.n)){ toast("É titular: troca-o primeiro no separador Jogo."); return; }
      const pl=est.plantel.slice(); const rem=pl.splice(i,1)[0]; guardaEst({...est,plantel:pl}); toast(`Jogador ${rem.n} removido`,()=>{ const r=est.plantel.slice(); r.splice(i,0,rem); guardaEst({...est,plantel:r}); }); };
    tb.appendChild(tr);
  });
}
$("p-add").onclick=()=>{ guardaEst({...est,plantel:[...est.plantel,{n:"",nome:""}]}); setTimeout(()=>{ const x=$("pn-"+(est.plantel.length-1)); if(x) x.focus(); },50); };
