/* Resuelve la carpeta de una historia y carga su guion. Acepta "historias/001-slug", "001-slug" o "001". */
const fs = require("fs");
const path = require("path");
const { RAIZ } = require("./bin");

function carpeta(arg) {
  if (!arg) throw new Error("Falta la historia. Ejemplo: npm run escenas -- historias/001-demo");
  const directo = path.resolve(RAIZ, arg);
  if (fs.existsSync(directo) && fs.statSync(directo).isDirectory()) return directo;
  const base = path.join(RAIZ, "historias");
  const clave = path.basename(arg);
  const cand = fs.existsSync(base) ? fs.readdirSync(base).filter(d => d === clave || d.startsWith(clave + "-")) : [];
  if (cand.length === 1) return path.join(base, cand[0]);
  if (cand.length > 1) throw new Error(`"${arg}" es ambiguo: ${cand.join(", ")}`);
  throw new Error(`No encuentro la historia "${arg}" en historias/`);
}

function cargar(arg) {
  const dir = carpeta(arg);
  const archivo = path.join(dir, "guion.json");
  if (!fs.existsSync(archivo)) throw new Error(`Falta ${path.relative(RAIZ, archivo)}`);
  const guion = JSON.parse(fs.readFileSync(archivo, "utf8"));
  if (!Array.isArray(guion.planos) || !guion.planos.length) throw new Error("El guion no tiene planos.");
  guion.planos.forEach((p, i) => { p.id = p.id || "p" + String(i + 1).padStart(2, "0"); });
  return { dir, slug: path.basename(dir), id: path.basename(dir).split("-")[0], guion };
}

const mkdir = d => (fs.mkdirSync(d, { recursive: true }), d);

module.exports = { carpeta, cargar, mkdir };

/* Parser minimo: --clave valor y --bandera. Devuelve { pos, flags }. */
function args(argv) {
  const pos = [], flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const v = argv[i + 1];
      if (v && !v.startsWith("--")) { flags[k] = v; i++; } else flags[k] = true;
    } else pos.push(a);
  }
  return { pos, flags };
}
module.exports.args = args;
