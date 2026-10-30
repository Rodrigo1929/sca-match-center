/* ---------- gravação ---------- */
let soLeitura=false;
function setStatus(k,t){ if(soLeitura&&k!=="local") return; const s=$("status"); s.className="status "+k; s.querySelector("span").textContent=t; }
function normEst(d){ return {
  plantel:Array.isArray(d?.plantel)?d.plantel.map(p=>({n:String(p.n??"").trim(),nome:String(p.nome??""),...(POS_UT.some(x=>x[0]===String(p.pos))?{pos:String(p.pos)}:{}),...(ESC_FORM.includes(p.esc)?{esc:p.esc}:{}),...(String(p.alc??"").trim()?{alc:String(p.alc).trim()}:{})})):PLANTEL_DEF.slice(),
  fase:d?.fase==="jogo"?"jogo":"pre",
  ordem:Array.isArray(d?.ordem)?d.ordem.map(String):[],
  staff:Object.fromEntries(STAFF.map(([k])=>[k,String(d?.staff?.[k]||"")])),
  linhas:Array.isArray(d?.linhas)?d.linhas.filter(l=>l&&l.sai&&l.entra).map(l=>({id:String(l.id||Math.random().toString(36).slice(2,9)),sai:String(l.sai),entra:String(l.entra),modo:l.modo==="todos"?"todos":"lances",...(l.modo==="todos"?{}:{lances:(l.lances||[]).map(String)}),...(l.pre?{pre:true}:{}),...(l.int?{int:true}:{}),...(l.min?{min:String(l.min)}:{}),...(l.slot?{slot:String(l.slot)}:{})})):[] }; }
function normNotas(d){ return {itens:Array.isArray(d?.itens)?d.itens.filter(n=>n&&(n.txt||n.t)).map(n=>({id:String(n.id||Math.random().toString(36).slice(2,9)),t:String(n.t||""),txt:String(n.txt||""),cat:CATS[n.cat]?n.cat:"out",...(n.autor?{autor:String(n.autor)}:{}),parte:n.parte===2?2:(n.parte===1?1:(seg(n.t)>=2700&&seg(n.t)<1e9?2:1))})):[]}; }
function guardaNotas(n){ notas=normNotas(n); guardaLocal(); render(); gravaDoc("jogo/notas",notas); }
function normJogo(d){ const on=Array.isArray(d?.onze)&&d.onze.length?d.onze:ONZE_DEF;
  return {video:d?.video&&typeof d.video==="object"?{url:String(d.video.url||""),k1:d.video.k1==null?null:+d.video.k1,k2:d.video.k2==null?null:+d.video.k2,antes:d.video.antes==null?10:+d.video.antes}:null,relogio:d?.relogio&&typeof d.relogio==="object"?{base:+d.relogio.base||0,inicio:+d.relogio.inicio||0,correr:!!d.relogio.correr}:{base:0,correr:false},adversario:String(d?.adversario||""),data:String(d?.data||""),onze:on.map(o=>({slot:String(o.slot),n:String(o.n),pos:String(o.pos||""),x:+o.x||0,y:+o.y||0})),suplentes:Array.isArray(d?.suplentes)?d.suplentes.map(String):[],
    comp:COMPS[d?.comp]?d.comp:"taca",
    subs:Array.isArray(d?.subs)?d.subs.filter(l=>l&&l.sai&&l.entra).map((l,i)=>({id:String(l.id||Math.random().toString(36).slice(2,9)),sai:String(l.sai),entra:String(l.entra),min:String(l.min||""),...(l.int?{int:true}:{}),c:+l.c||i})).sort((a,b)=>a.c-b.c):[],
    prova:String(d?.prova||""),jornada:String(d?.jornada||""),calId:String(d?.calId||""),local:String(d?.local||""),casa:d?.casa==="fora"?"fora":"casa",hora:String(d?.hora||""),escalao:String(d?.escalao||"Seniores"),resInt:String(d?.resInt||""),
    eventos:Array.isArray(d?.eventos)?d.eventos.filter(e=>e&&EVT[e.tipo]).map((e,i)=>({id:String(e.id||Math.random().toString(36).slice(2,9)),tipo:String(e.tipo),c:+e.c||i,min:String(e.min||""),...(e.n?{n:String(e.n)}:{}),...(e.obs?{obs:String(e.obs)}:{}),
      ...(Array.isArray(e.gt)&&e.gt.length?{gt:e.gt.map(String)}:{}),...(e.as?{as:String(e.as)}:{}),...(e.ast?{ast:String(e.ast)}:{}),...(e.na?{na:String(e.na)}:{}),...(e.pa?{pa:String(e.pa)}:{}),...(e.zona?{zona:String(e.zona)}:{}),...(e.res?{res:String(e.res)}:{}),...(e.bpl?{bpl:String(e.bpl)}:{})})):[],
    adv:normAdvJogo(d?.adv),subsAdv:normSubsAdv(d?.subsAdv),encaixe:normEncaixe(d?.encaixe)}; }
function guardaLocal(){ try{ localStorage.setItem(LS_KEY,JSON.stringify({est,jogo,lancesDb,notas,hist,an,anCfg,vivo,advs})); }catch(e){} }