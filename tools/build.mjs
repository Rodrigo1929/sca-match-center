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
// ficheiros iguais (ex.: s08, s09 e s10) entram uma só vez; as chaves de IMG_DATA ficam todas
const manifesto = JSON.parse(ler("assets/manifest.json"));
const unicos = [], posDe = new Map();
const chaves = Object.entries(manifesto).map(([nome, prefixo]) => {
  const v = prefixo + readFileSync(join(raiz, "assets", nome)).toString("base64");
  if (!posDe.has(v)) { posDe.set(v, unicos.length); unicos.push(v); }
  return JSON.stringify(nome) + ": d[" + posDe.get(v) + "]";
});
const imgData = "(()=>{ const d=[" + unicos.map((v) => JSON.stringify(v)).join(", ") + "]; return {" + chaves.join(", ") + "}; })()";

const ordem = JSON.parse(ler("src/js/ordem.json"));
let app = ordem.map((f) => ler("src/" + f)).join("\n");
app = troca(app, "{{IMG_DATA}}", imgData);
app = troca(app, "{{LANCES_BASE}}", ler("src/data/lances-base.json"));

let html = ler("src/page.html");
html = troca(html, "{{CSS}}", ler("src/styles.css"));
html = troca(html, "{{APP_JS}}", app);
html = troca(html, "{{MODELO_JS}}", ler("src/js/modelo-de-jogo.js") + "\n" + ler("src/js/principios.js") + "\n" + ler("src/js/modelo-pptx.js"));
html = troca(html, "{{EXERC_JS}}", ler("src/js/exercicios.js") + "\n" + ler("src/js/qr.js") + "\n" + ler("src/js/livro.js"));
html = troca(html, "{{TREINO_JS}}", ler("src/js/treino.js") + "\n" + ler("src/js/semana.js") + "\n" + ler("src/js/anual.js") + "\n" + ler("src/js/tempos.js") + "\n" + ler("src/js/competicao.js") + "\n" + ler("src/js/balneario.js") + "\n" + ler("src/js/microciclo.js"));

// PptxGenJS (MIT) embutido como texto: só se lê ao exportar o Modelo de Jogo em PowerPoint (sem pedidos externos). Fica no fim: o texto da biblioteca não passa por outros marcadores.
html = troca(html, "{{PPTX_LIB}}", ler("src/vendor/pptxgen.min.js"));
// jsPDF, AutoTable (MIT), SheetJS (Apache-2.0) e mp4-muxer (MIT) também embutidos como texto, para os PDF, o Excel e o vídeo funcionarem sem rede (carregaScript usa-os).
// "<!--" e "<script" dentro de um <script> mudam a forma como o HTML o lê: \x3c é o mesmo "<" nas strings e regex onde aparecem.
for (const [marca, f] of [["{{JSPDF_LIB}}", "jspdf.umd.min.js"], ["{{AUTOTABLE_LIB}}", "jspdf.plugin.autotable.min.js"], ["{{XLSX_LIB}}", "xlsx.full.min.js"], ["{{MP4_LIB}}", "mp4-muxer.js"]]) {
  // o SheetJS tem U+FFFD de propósito nas tabelas de codificação (dentro de strings); escrito como \ufffd é o mesmo carácter e o publicador aceita
  const js = ler("src/vendor/" + f).replace(/<!--/g, "\\x3c!--").replace(/<script/gi, "\\x3cscript").replace(/\uFFFD/g, "\\ufffd");
  if (/<\/script/i.test(js)) throw new Error(f + " tem </script>");
  html = troca(html, marca, js);
}

mkdirSync(join(raiz, "dist"), { recursive: true });
writeFileSync(join(raiz, "dist/index.html"), html);
console.log(`dist/index.html · ${(Buffer.byteLength(html) / 1048576).toFixed(2)} MB`);

// App de observação de adversários (link próprio, só com este separador)
{
  const logo = "data:image/png;base64," + readFileSync(join(raiz, "assets/slides/logo.png")).toString("base64");
  let obs = troca(ler("observacao/page.html"), "{{LOGO}}", logo);
  obs = troca(obs, "{{BOLA}}", "data:image/png;base64," + readFileSync(join(raiz, "assets/slides/bola.png")).toString("base64"));
  obs = troca(obs, "{{PLANTEIS}}", JSON.stringify(JSON.parse(ler("observacao/planteis.json"))));
  writeFileSync(join(raiz, "dist/observacao.html"), obs);
  console.log(`dist/observacao.html · ${(Buffer.byteLength(obs) / 1024).toFixed(0)} KB`);
}
