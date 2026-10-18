#!/usr/bin/env node
/* Corre voz, escenas y video en orden sobre la misma historia.
   Uso: npm run todo -- historias/001-demo [--formato 16x9] */
const path = require("path");
const { spawn } = require("child_process");

const argv = process.argv.slice(2);
const pasos = ["voz", "escenas", "video"];

(async () => {
  for (const paso of pasos) {
    console.log(`\n== ${paso} ==`);
    const codigo = await new Promise(ok => {
      const p = spawn(process.execPath, [path.join(__dirname, `${paso}.js`), ...argv], { stdio: "inherit" });
      p.on("close", ok);
    });
    if (codigo !== 0) { console.error(`\n"${paso}" fallo. Me detengo.`); process.exit(codigo); }
  }
})();
