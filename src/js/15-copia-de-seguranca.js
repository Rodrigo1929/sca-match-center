/* ---------- cópia de segurança ---------- */
function ultimaCopia(){ try{ return localStorage.getItem("sca-ultima-copia")||""; }catch(e){ return ""; } }
function infoCopia(){ const el_=$("h-bkinfo"); if(!el_) return; const u=ultimaCopia(); el_.textContent=u?`Última cópia feita neste aparelho: ${new Date(u).toLocaleString("pt-PT")}. Recomendado: depois de cada jogo.`:"Ainda não fizeste nenhuma cópia neste aparelho. Recomendado: depois de cada jogo."; }
async function exportaCopia(){ const B={app:"SCA Performance",versao:1,criadaEm:new Date().toISOString(),est,jogo,lancesDb,notas,hist,an,anCfg,vivo,modelo:(typeof modelos!=="undefined"?modelos:{}),exercicios:(typeof exercicios!=="undefined"?exercicios:{}),uts:(typeof uts!=="undefined"?uts:{}),semanas:(typeof semanas!=="undefined"?semanas:{}),calendario:(typeof calendario!=="undefined"?calendario:{}),anual:(typeof anual!=="undefined"?anual:{}),ciclos:(typeof ciclos!=="undefined"?ciclos:{}),adversarios:advs,compJogos:(typeof compJogos!=="undefined"?compJogos:{}),compGolos:(typeof compGolos!=="undefined"?compGolos:{}),meinho:(typeof meinhoRegs!=="undefined"?meinhoRegs:{}),histTreino:(typeof histTreino!=="undefined"?histTreino:{}),fotos:(typeof fotos!=="undefined"?fotos:{}),tv:tvCfg||null};
  const nomeF=`Copia_SCA_Performance_${new Date().toISOString().slice(0,16).replace(/[T:]/g,"-")}.json`, txt=JSON.stringify(B);
  let dl=null; try{ dl=await window.claude.use("downloads"); }catch(e){}
  try{ if(!dl){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([txt],{type:"application/json"})); a.download=nomeF; document.body.appendChild(a); a.click(); a.remove(); }
    else await dl.save({filename:nomeF,data:txt});
    try{ localStorage.setItem("sca-ultima-copia",new Date().toISOString()); }catch(e){} infoCopia(); toast(`Cópia guardada · ${Object.keys(hist).length} jogos no histórico, ${an.regs.length} ações`); }
  catch(e){ if(e?.code!=="declined") toast("Não foi possível guardar a cópia ("+(e?.code||"erro")+")"); } }
function repoeCopia(B){ if(!B||!["SCA Performance","SCA Match Center","SCA Bolas Paradas"].includes(B.app)||!B.est){ toast("Este ficheiro não é uma cópia desta aplicação."); return; }
  const nL=Object.keys(B.lancesDb||{}).length, nH=Object.keys(B.hist||{}).length, nR=(B.an?.regs||[]).length;
  folha(`<h3>Repor esta cópia?</h3><p class="sub" style="margin:0">Cópia de <b>${esc(new Date(B.criadaEm).toLocaleString("pt-PT"))}</b>: ${nL} lances editados, ${nH} jogos no histórico, ${nR} ações de análise${B.jogo?.adversario?`, jogo vs ${esc(B.jogo.adversario)}`:""}.</p>
    <p class="sub" style="margin:0;color:var(--red)"><b>Substitui tudo o que está agora na aplicação</b>, para todos os aparelhos. Antes de repor, é feita automaticamente uma cópia do estado atual.</p>
    <div class="actions" style="justify-content:stretch"><button class="btn" data-close style="flex:1;min-height:56px">Cancelar</button><button class="btn" id="rp-ok" style="flex:1;min-height:56px;background:#C00000;color:#fff;border-color:#C00000">Sim, repor cópia</button></div>`,(s_,fecha)=>{
    s_.querySelector("#rp-ok").onclick=async()=>{ fecha(); await exportaCopia();
      guardaEst(B.est); guardaJogo(B.jogo||{},true); guardaNotas(B.notas||{itens:[]}); guardaCfg(B.anCfg||{}); guardaAn(B.an||{regs:[]}); guardaVivo(B.vivo||null);
      const novos=B.lancesDb||{}; Object.keys(lancesDb).forEach(id=>{ if(!novos[id]){ delete lancesDb[id]; apagaDoc("lances/"+id); } }); Object.values(novos).forEach(L=>{ lancesDb[L.id]=L; gravaDoc("lances/"+L.id,L); });
      const H=B.hist||{}; Object.keys(hist).forEach(id=>{ if(!H[id]) apagaDoc("historico/"+id); }); Object.entries(H).forEach(([id,J])=>gravaDoc("historico/"+id,J)); hist=clone(H);
      if(B.modelo&&typeof repoeModelos==="function") repoeModelos(B.modelo);
      if(B.exercicios&&typeof repoeExercicios==="function") repoeExercicios(B.exercicios);
      if(B.uts&&typeof repoeUTs==="function") repoeUTs(B.uts);
      if((B.semanas||B.calendario)&&typeof repoeSemanas==="function") repoeSemanas(B.semanas,B.calendario);
      if((B.anual||B.ciclos)&&typeof repoeAnual==="function") repoeAnual(B.anual,B.ciclos);
      if(B.tv) guardaTvCfg(B.tv);
      if((B.compJogos||B.compGolos||B.meinho||B.histTreino)&&typeof repoeCompeticao==="function") repoeCompeticao(B); if(B.fotos&&typeof repoeFotos==="function") repoeFotos(B);
      if(B.adversarios){ const A=B.adversarios; Object.keys(advs).forEach(id=>{ if(!A[id]) apagaDoc("adversarios/"+id); }); advs={}; Object.entries(A).forEach(([id,t])=>{ advs[id]=normAdvEquipa(t,id); gravaDoc("adversarios/"+id,advs[id]); }); }
      guardaLocal(); render(); renderHist(); toast("Cópia reposta"); }; }); }