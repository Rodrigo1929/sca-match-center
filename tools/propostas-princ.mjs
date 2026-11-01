// Gera docs/propostas-princ-2627.json: proposta de princípios (1 principal + até 3 secundários)
// para os exercícios do repositório, para o Rodrigo rever na app (Exercícios › Rever propostas).
// Uso: node tools/propostas-princ.mjs <lista.txt>   (lista: "id#n nome [...]", uma linha por exercício)
import fs from "node:fs";
const B="baixa";
// n: [principal, [secundários], confiança?]
const P={
10:["OO-4",["OO-4.3","OO-3.1"]],11:["OO-4",["OO-4.3","OD-2.2"]],12:["TO-4",["TD-1","TD-4.2"]],
15:["OO-3.5",["OO-1.2","OO-3.1"]],16:["OO-1",["OO-3.3","OO-1.2","TD-1"]],17:["OO-3",["OO-3.2","OO-1.6","OO-3.4"]],
18:["OO-2",["OO-R2","OO-2.2"]],22:["OO-2.2",["OO-2.1","OO-4.5","OO-3.5"]],24:["OO-R4",[]],
28:["OO-3.5",["OO-1.2","OO-3.1"]],29:["OO-3.1",["OO-1.1","OO-1.2"]],30:["OO-1",["OO-1.3","OO-1.1","OO-1.5"]],
32:["OO-3",["OO-3.1","OO-2.1","OO-3.4"]],33:["OO-3.1",["OO-3.5"]],35:["OO-1",["OO-1.3","OO-1.1","OO-1.5"]],
36:["OO-3.1",["OO-1.1","OO-2.2"]],38:["OO-1.4",["TD-1","OO-3.3"]],39:["OD-4",["OD-4.1","OD-1.1","OD-1.2"]],
40:["OD-4.2",["OD-2.2","OD-4.1"]],41:["OD-5",["OD-5.2","OD-5.3","OD-4.1"]],44:["OD-5.4",["OD-2.2"]],
45:["OD-4",["OD-4.1","OD-1.1","OD-1.2"]],46:["OO-R4",["OD-2.3"],B],47:["OO-3.3",["OO-1.4","TO-1"]],
48:["OD-3",["OD-2.1","OD-1.2","OD-4.2"]],49:["OO-3.1",["OO-3.5"]],50:["OD-2",["OD-2.1","OD-2.3"]],
51:["OD-3",["OD-2.1","OD-3.2","OD-5"]],52:["OD-3",["OD-2.1","OD-3.2","OD-4.1"]],54:["OO-3.3",["OO-1.2"]],
55:["OO-3.1",["OO-4.3"]],56:["TD-4",["TD-4.1","TD-4.2","TD-1"]],57:["OO-R4",[]],
60:["OO-1",["OO-1.1","OO-3.2","OO-3.1"]],63:["OO-4",["OO-4.3","OD-2.2"]],64:["OO-4.5",["OO-4.1","OO-4.4","OO-4.3"]],
67:["OD-1",["OD-1.2","OD-5.2","OD-1.1"]],70:["OO-R3",["OO-R4","OO-3.1"]],73:["OO-1.2",["OO-3.5","OO-3.4"]],
74:["OO-R4",["OO-4.3"]],75:["OO-3.3",["OO-1.4","TO-1"]],76:["OO-3.3",["OO-1.4","TO-1"]],
77:["OO-1.4",["TD-1","TO-1","OO-1.2"]],79:["OO-3.3",["OO-1.2"]],84:["OO-3",["OO-3.2","OO-1.6","OO-3.4"]],
85:["OO-3.3",["OO-3.5"],B],87:["OO-3",["OO-3.2","OO-1.6","OO-3.4"]],89:["TD-1",["TO-2.1","TO-1","OO-1.4"]],
90:["OO-2",["OO-3.5","OO-1.2"]],91:["OO-2",["OO-3.3","OO-4.3","OO-R2"]],92:["OO-2.2",["OO-3.4","OO-5"]],
94:["OO-1.2",["OO-3.3","TD-1.1"]],95:["OO-3.3",["OO-3.4","TD-1","OO-4.3"]],96:["OO-R1",["OO-1.1","OO-3.2"]],
97:["OD-2",["OD-3.2","OD-4.1","OD-3.3"]],100:["OO-4",["OO-2.1","OO-2.2","OO-4.5"]],
101:["OO-4",["OO-4.3","OO-3.1","OD-2.2"]],102:["OO-3.2",["OO-3.4","OO-2.1"]],103:["OO-3.1",["OO-4.2","TO-1"]],
104:["OO-R1",["OO-1","OO-1.3"]],106:["OO-R4",["OO-2.2","TD-1"]],107:["OO-R1",["OO-1.1","OO-3.2"]],
109:["TD-1",["TD-1.1","TD-2.1"]],111:["OO-1.2",["OO-3.1"],B],112:["TO-3",["TO-4","TO-1","TO-2.1"]],
113:["OO-4",["TO-4","OO-3.1"]],114:["OO-3.3",["OO-3.2","OO-2.2"]],115:["OO-3.1",["OO-2.2","OO-4.2","TR-1.1"]],
116:["OO-1.2",["OO-3.5"],B],117:["OD-5",["OD-4.2","OD-5.2","OD-4.1"]],118:["OD-5",["OD-5.2","OD-1.2","OD-5.5"]],
119:["TD-1",["TD-1.1","OO-1.2"]],120:["OO-1.2",["TD-1"],B],121:["TO-3",["OO-3.3","TO-1"]],122:["OO-4.3",["OO-1.2"]],
124:["OO-1",["TD-1","OD-4.2","OO-3.3"],B],125:["OO-3",["OO-3.4","OO-3.5","OO-4.3"]],126:["TR-1.1",["OO-2","OO-R3"]],
127:["OO-R4",["TD-1"]],128:["OO-R4",[]],130:["TO-4",["TO-3","OO-R4"]],131:["OO-2",["OO-1.1","OO-2.1","OO-R2"]],
132:["TR-6",["TR-1.1","TR-6.2","OO-R3"]],133:["OO-R4",["OO-4.3"]],134:["TD-1",["TD-1.1","TD-2.1"]],
135:["OO-3.3",["OO-1.2","TD-1.1"]],136:["OO-3.1",["TO-1","OO-3.3"]],137:["OO-3.2",["OO-2.1","OO-3.4"]],
142:["OO-1.4",["OD-2.2","OD-4.2"]],143:["TD-1.1",["TD-2.1","OD-2.2"]],144:["OO-R3",["OO-4.1","OO-4.2","OO-3.4"]],
145:["TR-6.1",["OO-4.3","OO-R4"],B],147:["OO-1.4",["OO-3.3","TD-1"]],148:["OO-2",["OO-R2","OO-2.2"]],
149:["OO-1.4",["TD-1","TO-1","OO-R4"]],151:["OO-3.3",["TR-1.1","TD-1","OD-4.1"]],155:["OO-1.6",["OO-1.2","OO-3.3"]],
156:["OO-R1",["OO-1.1","OO-1.3","OO-3.2"]],158:["OO-3.3",["OO-4.5","OO-3.2","OO-2.2"]],
159:["OO-R1",["OO-1.1","OO-1.3","OO-1"]],160:["OO-3.3",["OO-3.2","OO-2.2","OO-R4"]],161:["OO-1",["TD-1"],B],
163:["OO-3.5",["OO-1.2","OO-3.3"]],164:["OO-R2",["OO-R3","OO-2"]],165:["OO-4",["OO-3.1","OO-4.3","OO-R4"]],
166:["TD-1",["TD-1.1","OO-1.4"],B],
};
const modelo=JSON.parse(fs.readFileSync(new URL("../docs/modelo-2627.json",import.meta.url)));
const cods=new Set(Object.values(modelo.principios).map(p=>p.cod));
const linhas=fs.readFileSync(process.argv[2],"utf8").split("\n").filter(Boolean);
const out={};let erros=0;
for(const l of linhas){
  const m=l.match(/^(\S+)#(\d+) /); if(!m) continue;
  const [ ,id,n]=m, p=P[+n]; if(!p) continue;
  for(const c of [p[0],...p[1]]) if(!cods.has(c)){console.error("código desconhecido",c,"no",n);erros++;}
  if(p[1].length>3||new Set([p[0],...p[1]]).size!==1+p[1].length){console.error("secundários inválidos",n);erros++;}
  out[id]={p:p[0],s:p[1],conf:p[2]||"media"};
}
if(erros) process.exit(1);
fs.writeFileSync(new URL("../docs/propostas-princ-2627.json",import.meta.url),JSON.stringify({versao:"2026-10-31",propostas:out},null,1));
console.log(Object.keys(out).length,"propostas;",linhas.length-Object.keys(out).length,"sem proposta");
