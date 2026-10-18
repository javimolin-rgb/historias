#!/usr/bin/env node
/* Prueba la misma frase con varias voces de edge-tts para elegir la del canal.
   Uso: npm run voces -- "frase a probar" [--voces es-MX-JorgeNeural,es-CL-LorenzoNeural] */
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { edgeTts, RAIZ, ffprobe } = require("./lib/bin");
const mp3 = require("./lib/mp3");
const { args } = require("./lib/historia");

const POR_DEFECTO = ["es-MX-JorgeNeural", "es-MX-DaliaNeural", "es-CL-LorenzoNeural", "es-US-AlonsoNeural"];

const correr = (cmd, a) => new Promise((ok, mal) =>
  execFile(cmd, a, { maxBuffer: 1 << 24 }, (e, so, se) => e ? mal(new Error((se || e.message).toString().trim())) : ok(so)));

(async () => {
  const { pos, flags } = args(process.argv.slice(2));
  const frase = pos[0] || "Son las 23:40 y tu telefono vibra. No es una llamada. Es una alerta.";
  const voces = flags.voces ? String(flags.voces).split(",").map(s => s.trim()) : POR_DEFECTO;
  const salida = path.join(RAIZ, "pruebas", "voces");
  fs.mkdirSync(salida, { recursive: true });
  const [py, base] = edgeTts();

  console.log(`frase: "${frase}"\n`);
  for (const v of voces) {
    const destino = path.join(salida, `${v}.mp3`);
    await correr(py, [...base, "--voice", v, "--text", frase,
      `--rate=${flags.rate || "+0%"}`, `--pitch=${flags.pitch || "+0Hz"}`,
      "--write-media", destino, "--write-subtitles", destino.replace(/\.mp3$/, ".srt"), "--no-progress"]);
    let d = 0;
    const fp = ffprobe();
    if (fp) { try { d = parseFloat((await correr(fp, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", destino])).toString()); } catch {} }
    if (!d) d = mp3.duracion(destino);
    console.log(`  ${v.padEnd(24)} ${d.toFixed(2)}s   ${path.relative(RAIZ, destino)}`);
  }
  console.log(`\nEscuchalas en ${path.relative(RAIZ, salida)}/`);
})().catch(e => { console.error("voces:", e.message); process.exit(1); });
