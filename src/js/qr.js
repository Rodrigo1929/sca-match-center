/* ---------- QR code (v103): gerador próprio, sem pedidos a sites externos ----------
   Modo byte (UTF-8), correção de erros M, versões 1 a 20 (até ~360 caracteres), máscara escolhida pela penalização do padrão.
   Segue o algoritmo da norma ISO/IEC 18004 (como a implementação de referência de Nayuki). qrMatriz(texto) → matriz [y][x] de booleanos (true = escuro). */
const QR_ECC_M=[10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26];   // códigos de correção por bloco (v1..v20)
const QR_BLOCOS_M=[1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16];              // nº de blocos (v1..v20)
function qrModulosDados(v){ let r=(16*v+128)*v+64; if(v>=2){ const n=Math.floor(v/7)+2; r-=(25*n-10)*n-55; if(v>=7) r-=36; } return r; }
const qrCapacidade=v=>Math.floor(qrModulosDados(v)/8)-QR_ECC_M[v-1]*QR_BLOCOS_M[v-1];
function qrMul(x,y){ let z=0; for(let i=7;i>=0;i--){ z=(z<<1)^((z>>>7)*0x11D); z^=((y>>>i)&1)*x; } return z&255; }
function qrDivisor(g){ const r=new Array(g).fill(0); r[g-1]=1; let raiz=1; for(let i=0;i<g;i++){ for(let j=0;j<g;j++){ r[j]=qrMul(r[j],raiz); if(j+1<g) r[j]^=r[j+1]; } raiz=qrMul(raiz,2); } return r; }
function qrResto(dados,div){ const r=new Array(div.length).fill(0); for(const b of dados){ const f=b^r.shift(); r.push(0); div.forEach((c,i)=>{ r[i]^=qrMul(c,f); }); } return r; }
function qrMatriz(texto){ const bytes=[...new TextEncoder().encode(String(texto))];
  let v=1; for(;v<=20;v++){ if(4+(v<=9?8:16)+bytes.length*8<=qrCapacidade(v)*8) break; } if(v>20) throw new Error("qr: texto demasiado longo");
  /* bits: modo byte, comprimento, dados, terminador e enchimento */
  const bits=[], poe=(val,n)=>{ for(let i=n-1;i>=0;i--) bits.push((val>>>i)&1); }, cap=qrCapacidade(v)*8;
  poe(4,4); poe(bytes.length,v<=9?8:16); bytes.forEach(b=>poe(b,8)); poe(0,Math.min(4,cap-bits.length)); while(bits.length%8) bits.push(0);
  const dados=[]; for(let i=0;i<bits.length;i+=8) dados.push(bits.slice(i,i+8).reduce((a,b)=>a*2+b,0)); for(let p=0xEC;dados.length<qrCapacidade(v);p^=0xEC^0x11) dados.push(p);
  /* blocos com os códigos de correção, intercalados */
  const nb=QR_BLOCOS_M[v-1], ecc=QR_ECC_M[v-1], brutos=Math.floor(qrModulosDados(v)/8), curtos=nb-brutos%nb, lenCurto=Math.floor(brutos/nb), div=qrDivisor(ecc), blocos=[];
  for(let i=0,k=0;i<nb;i++){ const d=dados.slice(k,k+lenCurto-ecc+(i<curtos?0:1)); k+=d.length; const e=qrResto(d,div); if(i<curtos) d.push(0); blocos.push(d.concat(e)); }
  const cw=[]; for(let i=0;i<blocos[0].length;i++) blocos.forEach((b,j)=>{ if(i!==lenCurto-ecc||j>=curtos) cw.push(b[i]); });
  /* padrões fixos */
  const n=v*4+17, M=Array.from({length:n},()=>new Array(n).fill(false)), F=Array.from({length:n},()=>new Array(n).fill(false)), poeF=(x,y,d)=>{ M[y][x]=d; F[y][x]=true; };
  for(let i=0;i<n;i++){ poeF(6,i,i%2===0); poeF(i,6,i%2===0); }
  [[3,3],[n-4,3],[3,n-4]].forEach(([cx,cy])=>{ for(let dy=-4;dy<=4;dy++) for(let dx=-4;dx<=4;dx++){ const x=cx+dx, y=cy+dy, d=Math.max(Math.abs(dx),Math.abs(dy)); if(x>=0&&x<n&&y>=0&&y<n) poeF(x,y,d!==2&&d!==4); } });
  const al=[]; if(v>1){ const na=Math.floor(v/7)+2, passo=Math.ceil((v*4+4)/(na*2-2))*2; al.push(6); for(let p=n-7;al.length<na;p-=passo) al.splice(1,0,p); }
  al.forEach((a,i)=>al.forEach((b,j)=>{ if((i===0&&j===0)||(i===0&&j===al.length-1)||(i===al.length-1&&j===0)) return; for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) poeF(a+dx,b+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1); }));
  const formato=mask=>{ const d=(0<<3)|mask; let r=d; for(let i=0;i<10;i++) r=(r<<1)^((r>>>9)*0x537); const b=((d<<10)|r)^0x5412, bit=i=>((b>>>i)&1)===1;
    for(let i=0;i<=5;i++) poeF(8,i,bit(i)); poeF(8,7,bit(6)); poeF(8,8,bit(7)); poeF(7,8,bit(8)); for(let i=9;i<15;i++) poeF(14-i,8,bit(i));
    for(let i=0;i<8;i++) poeF(n-1-i,8,bit(i)); for(let i=8;i<15;i++) poeF(8,n-15+i,bit(i)); poeF(8,n-8,true); };
  formato(0);
  if(v>=7){ let r=v; for(let i=0;i<12;i++) r=(r<<1)^((r>>>11)*0x1F25); const b=(v<<12)|r; for(let i=0;i<18;i++){ const d=((b>>>i)&1)===1, a=n-11+i%3, c=Math.floor(i/3); poeF(a,c,d); poeF(c,a,d); } }
  /* dados em ziguezague, de baixo para cima e de cima para baixo, duas colunas de cada vez */
  let ib=0; for(let dir=n-1;dir>=1;dir-=2){ if(dir===6) dir=5; for(let k=0;k<n;k++) for(let j=0;j<2;j++){ const x=dir-j, sobe=((dir+1)&2)===0, y=sobe?n-1-k:k;
    if(!F[y][x]&&ib<cw.length*8){ M[y][x]=((cw[ib>>>3]>>>(7-(ib&7)))&1)===1; ib++; } } }
  /* máscara: experimenta as 8 e fica com a de menor penalização */
  const cond=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
  const aplica=m=>{ for(let y=0;y<n;y++) for(let x=0;x<n;x++) if(!F[y][x]&&cond[m](x,y)) M[y][x]=!M[y][x]; };
  const pen=()=>{ let p=0; const linha=get=>{ let run=1; for(let i=1;i<=n;i++){ if(i<n&&get(i)===get(i-1)){ run++; continue; } if(run>=5) p+=3+run-5; run=1; }
      const s=[]; for(let i=0;i<n;i++) s.push(get(i)?1:0); const a=[1,0,1,1,1,0,1,0,0,0,0], b=[0,0,0,0,1,0,1,1,1,0,1];
      for(let i=0;i+11<=n;i++){ if(a.every((q,k)=>s[i+k]===q)) p+=40; if(b.every((q,k)=>s[i+k]===q)) p+=40; } };
    for(let y=0;y<n;y++) linha(x=>M[y][x]); for(let x=0;x<n;x++) linha(y=>M[y][x]);
    for(let y=0;y<n-1;y++) for(let x=0;x<n-1;x++){ const c=M[y][x]; if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1]) p+=3; }
    let esc=0; M.forEach(r=>r.forEach(c=>{ if(c) esc++; })); p+=Math.floor(Math.abs(esc*20-n*n*10)/(n*n))*10; return p; };
  let melhor=0, pMin=Infinity; for(let m=0;m<8;m++){ aplica(m); formato(m); const p=pen(); if(p<pMin){ pMin=p; melhor=m; } aplica(m); }
  aplica(melhor); formato(melhor); return M; }
/* desenha o QR num PDF (jsPDF), em vetores: nítido em qualquer tamanho; com margem branca de 4 módulos */
function qrNoPdf(doc,texto,x,y,lado){ const M=qrMatriz(texto), n=M.length, m=lado/(n+8);
  doc.setFillColor(255,255,255); doc.rect(x,y,lado,lado,"F"); doc.setFillColor(0,0,0);
  for(let r=0;r<n;r++){ let c=0; while(c<n){ if(!M[r][c]){ c++; continue; } let k=c; while(k<n&&M[r][k]) k++; doc.rect(x+(c+4)*m,y+(r+4)*m,(k-c)*m+.02,m+.02,"F"); c=k; } } }
