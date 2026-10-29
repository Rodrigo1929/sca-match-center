// Cópia diária das bases de dados das duas apps (corre na tarefa agendada "Cópia diária SCA").
// A tarefa lê cada coleção com o Claude (ArtifactData, out_dir) para <pasta>/_leitura/<app>/<coleção>/<doc>.json
// e depois corre:  node tools/copia-diaria.mjs "<pasta>"
// Para cada app, junta os documentos num ficheiro <pasta>/<app>/<AAAA-MM-DD>.json, só se algo mudou desde a última cópia.
// A cópia do Match Center fica no formato da «Cópia de segurança» da app (Histórico › Repor cópia).
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const pasta = process.argv[2];
if (!pasta || !existsSync(pasta)) { console.error("Uso: node tools/copia-diaria.mjs <pasta das cópias>"); process.exit(1); }
const leitura = join(pasta, "_leitura");
const hoje = new Date().toLocaleDateString("sv-SE"); // AAAA-MM-DD na hora local

// todos os documentos lidos de uma app: {"coleção/.../doc": dados}
function leDocs(dir) { const out = {};
  const anda = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); if (statSync(p).isDirectory()) return anda(p);
    if (f.endsWith(".json")) out[relative(dir, p).split(sep).join("/").replace(/\.json$/, "")] = JSON.parse(readFileSync(p, "utf8")); });
  if (existsSync(dir)) anda(dir); return out; }
// JSON com as chaves por ordem, para comparar sem depender da ordem de leitura
const canon = (v) => Array.isArray(v) ? "[" + v.map(canon).join(",") + "]" : v && typeof v === "object" ? "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}" : JSON.stringify(v);

function colecao(docs, nome) { const out = {}; Object.entries(docs).forEach(([k, v]) => { const i = k.lastIndexOf("/"); if (k.slice(0, i) === nome) out[k.slice(i + 1)] = { ...v, id: k.slice(i + 1) }; }); return out; }
const lista = (o) => Object.values(o).sort((a, b) => (a.c || 0) - (b.c || 0));
// SCA Performance (antes Match Center): o mesmo formato de exportaCopia (src/js/15-copia-de-seguranca.js)
function copiaMatchCenter(d) { const doc = (k) => d[k] || null;
  const jogo = { ...(doc("jogo/atual") || {}), eventos: lista(colecao(d, "eventos")), subs: lista(colecao(d, "subs")), subsAdv: lista(colecao(d, "subsAdv")) };
  return { est: doc("estado/atual"), jogo, notas: doc("jogo/notas") || { itens: [] }, vivo: doc("jogo/vivo"),
    an: { ...(doc("analise/atual") || {}), regs: lista(colecao(d, "regs")) }, anCfg: doc("analise/config") || {},
    lancesDb: colecao(d, "lances"), hist: colecao(d, "historico"), modelo: colecao(d, "modelo"), exercicios: colecao(d, "exercicios"),
    uts: colecao(d, "uts"), semanas: colecao(d, "semanas"), calendario: colecao(d, "calendario"), anual: colecao(d, "anual"), ciclos: colecao(d, "ciclos"),
    tv: doc("tv/config"), adversarios: colecao(d, "adversarios"),
    compJogos: colecao(d, "compJogos"), compGolos: colecao(d, "compGolos"), meinho: colecao(d, "meinho"), histTreino: colecao(d, "histTreino"), fotos: colecao(d, "fotos") }; }

// documentos que têm de existir: sem eles a leitura ficou a meio e a cópia não se faz (nunca substituir uma cópia boa por uma incompleta)
const APPS = { "match-center": { nome: "SCA Performance", forma: copiaMatchCenter, precisa: ["estado/atual", "jogo/atual"] },
  "observacao": { nome: "SCA Observação", forma: (d) => ({ docs: d }), precisa: ["obs/"] } };
const resumo = [];
for (const [app, A] of Object.entries(APPS)) {
  const docs = leDocs(join(leitura, app)), n = Object.keys(docs).length;
  if (!n) { resumo.push(`${A.nome}: nada lido (cópia não feita)`); continue; }
  const falta = A.precisa.filter((p) => !Object.keys(docs).some((k) => p.endsWith("/") ? k.startsWith(p) : k === p));
  if (falta.length) { resumo.push(`${A.nome}: leitura incompleta, falta ${falta.join(", ")} (cópia não feita)`); continue; }
  const dados = A.forma(docs), dir = join(pasta, app); mkdirSync(dir, { recursive: true });
  const antigas = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  const ultima = antigas.pop(); // se já houver cópia de hoje e algo mudou desde então, é substituída
  const igual = ultima && (() => { try { const U = JSON.parse(readFileSync(join(dir, ultima), "utf8")); delete U.app; delete U.versao; delete U.criadaEm; delete U.ndocs; return canon(U) === canon(dados); } catch (e) { return false; } })();
  if (igual) { resumo.push(`${A.nome}: sem alterações desde ${ultima.slice(0, 10)} (${n} documentos)`); continue; }
  writeFileSync(join(dir, hoje + ".json"), JSON.stringify({ app: A.nome, versao: 1, criadaEm: new Date().toISOString(), ndocs: n, ...dados }));
  resumo.push(`${A.nome}: cópia guardada em ${app}/${hoje}.json (${n} documentos)`);
}
// a leitura é apagada para a próxima cópia não juntar documentos que entretanto deixaram de existir
try { rmSync(leitura, { recursive: true, force: true }); }
catch (e) { Object.keys(APPS).forEach((app) => { try { rmSync(join(leitura, app), { recursive: true, force: true }); } catch (e2) { resumo.push(`Aviso: não consegui apagar ${join(leitura, app)} (${e2.code})`); } }); }
console.log(resumo.join("\n"));
