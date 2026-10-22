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
if (scripts.length !== 2) throw new Error(`Esperados 2 blocos <script>, encontrados ${scripts.length}`);
const tmp = mkdtempSync(join(tmpdir(), "sca-"));
const f = join(tmp, "todos.js");
writeFileSync(f, scripts.join("\n;\n"));
execFileSync(process.execPath, ["--check", f], { stdio: "inherit" });
console.log("Sintaxe OK · 2 scripts");
