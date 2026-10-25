// Verificação rápida: monta a app e confirma que os scripts não têm erros de sintaxe.
// Uso: node tools/check.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
execFileSync(process.execPath, [join(raiz, "tools/build.mjs")], { stdio: "inherit" });
const html = readFileSync(join(raiz, "dist/index.html"), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
if (scripts.length !== 4) throw new Error(`Esperados 4 blocos <script>, encontrados ${scripts.length}`);
const tmp = mkdtempSync(join(tmpdir(), "sca-"));
const f = join(tmp, "todos.js");
writeFileSync(f, scripts.join("\n;\n"));
execFileSync(process.execPath, ["--check", f], { stdio: "inherit" });
// Os scripts partilham o âmbito global: um nome de topo repetido noutro script substitui o primeiro sem dar erro.
const vistos = new Map(), repetidos = [];
scripts.forEach((s, i) => { for (const m of s.matchAll(/^(?:async\s+function|function|const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) {
  if (vistos.has(m[1])) repetidos.push(`${m[1]} (scripts ${vistos.get(m[1]) + 1} e ${i + 1})`); else vistos.set(m[1], i); } });
if (repetidos.length) throw new Error("Nomes de topo repetidos entre scripts: " + repetidos.join(", "));
console.log(`Sintaxe OK · ${scripts.length} scripts · ${vistos.size} nomes de topo sem repetições`);
// App de observação: um único <script>
{
  const obs = readFileSync(join(raiz, "dist/observacao.html"), "utf8");
  const sc = [...obs.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (sc.length !== 1) throw new Error(`Observação: esperado 1 bloco <script>, encontrados ${sc.length}`);
  const f2 = join(tmp, "observacao.js"); writeFileSync(f2, sc[0]);
  execFileSync(process.execPath, ["--check", f2], { stdio: "inherit" });
  console.log("Observação · sintaxe OK");
}
