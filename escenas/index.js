/* Registro de fondos. El guion nombra la escena y aqui se resuelve el modulo. */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "fondos");
const fondos = {};
for (const f of fs.readdirSync(DIR).filter(f => f.endsWith(".js"))) {
  const m = require(path.join(DIR, f));
  fondos[m.nombre || path.basename(f, ".js")] = m;
}

function fondo(nombre) {
  const f = fondos[nombre];
  if (!f) throw new Error(`Escena desconocida: "${nombre}". Disponibles: ${Object.keys(fondos).join(", ")}`);
  return f;
}

module.exports = { fondo, lista: () => Object.keys(fondos) };
