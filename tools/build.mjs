// Monta a app num único ficheiro HTML (dist/index.html), pronto a publicar no link da app.
// Uso: node tools/build.mjs        (sem dependências externas)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(raiz, p), "utf8");
const troca = (txt, marca, valor) => {
  const partes = txt.split(marca);
  if (partes.length !== 2) throw new Error(`Marcador ${marca} encontrado ${partes.length - 1} vezes (esperado 1)`);
  return partes.join(valor);
};

// imagens e letras embutidas (a app tem de funcionar no iPad sem pedir ficheiros externos)
const manifesto = JSON.parse(ler("assets/manifest.json"));
const imgData = "{" + Object.entries(manifesto).map(([nome, prefixo]) => {
  const b64 = readFileSync(join(raiz, "assets", nome)).toString("base64");
  return JSON.stringify(nome) + ": " + JSON.stringify(prefixo + b64);
}).join(", ") + "}";

const ordem = JSON.parse(ler("src/js/ordem.json"));
let app = ordem.map((f) => ler("src/" + f)).join("\n");
app = troca(app, "{{IMG_DATA}}", imgData);
app = troca(app, "{{LANCES_BASE}}", ler("src/data/lances-base.json"));

let html = ler("src/page.html");
html = troca(html, "{{CSS}}", ler("src/styles.css"));
html = troca(html, "{{APP_JS}}", app);
html = troca(html, "{{MODELO_JS}}", ler("src/js/modelo-de-jogo.js"));
html = troca(html, "{{EXERC_JS}}", ler("src/js/exercicios.js"));

mkdirSync(join(raiz, "dist"), { recursive: true });
writeFileSync(join(raiz, "dist/index.html"), html);
console.log(`dist/index.html · ${(Buffer.byteLength(html) / 1048576).toFixed(2)} MB`);
