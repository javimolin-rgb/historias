#!/usr/bin/env node
/* Genera un mp3 por plano con edge-tts, mas los subtitulos con tiempos por palabra,
   y guarda audio/tiempos.json con la duracion de cada plano (audio + respiro).
   Uso: npm run voz -- historias/001-demo [--solo p01] [--voz es-MX-JorgeNeural] */
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { ffprobe, edgeTts } = require("./lib/bin");
const { cargar, mkdir, args } = require("./lib/historia");
const mp3 = require("./lib/mp3");

const RESPIRO = 0.12; // aire al final de cada plano; el guion puede cambiarlo con "respiro"

const correr = (cmd, argumentos) => new Promise((ok, mal) =>
  execFile(cmd, argumentos, { maxBuffer: 1 << 24 }, (e, so, se) =>
    e ? mal(new Error((se || e.message).toString().trim().split("\n").slice(-3).join(" "))) : ok(so)));

/* Duracion real del mp3: ffprobe si esta, si no leemos los frames MPEG. */
async function duracion(archivo) {
  const fp = ffprobe();
  if (fp) {
    try {
      const o = await correr(fp, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", archivo]);
      const d = parseFloat(o.toString().trim());
      if (d > 0) return d;
    } catch {}
  }
  return mp3.duracion(archivo);
}

/* El SRT de edge-tts trae un bloque por palabra: lo pasamos a [{inicio,fin,palabra}]. */
function leerPalabras(srt) {
  if (!fs.existsSync(srt)) return [];
  const t = s => {
    const m = s.match(/(\d+):(\d+):(\d+)[,.](\d+)/);
    return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000 : 0;
  };
  return fs.readFileSync(srt, "utf8").trim().split(/\n\s*\n/).map(b => {
    const l = b.trim().split("\n");
    const tiempo = l.find(x => x.includes("-->"));
    if (!tiempo) return null;
    const [a, z] = tiempo.split("-->");
    return { inicio: t(a), fin: t(z), palabra: l.slice(l.indexOf(tiempo) + 1).join(" ").trim() };
  }).filter(Boolean);
}

async function main() {
  const { pos, flags } = args(process.argv.slice(2));
  const { dir, guion, slug } = cargar(pos[0]);
  const solo = flags.solo ? new Set(String(flags.solo).split(",").map(s => s.trim())) : null;
  const vozGlobal = flags.voz || guion.voz || "es-MX-JorgeNeural";
  const salida = mkdir(path.join(dir, "audio"));
  const [py, base] = edgeTts();

  const tiempos = {};
  const previo = path.join(salida, "tiempos.json");
  if (fs.existsSync(previo)) Object.assign(tiempos, JSON.parse(fs.readFileSync(previo, "utf8")).planos || {});

  for (const p of guion.planos) {
    if (solo && !solo.has(p.id)) continue;
    const mp3Ruta = path.join(salida, `${p.id}.mp3`);
    const srtRuta = path.join(salida, `${p.id}.srt`);
    const texto = (p.narracion || "").trim();

    if (!texto) { // plano mudo: dura lo que diga el guion, o 2 s
      tiempos[p.id] = { audio: 0, duracion: p.duracion || 2, palabras: [] };
      if (fs.existsSync(mp3Ruta)) fs.unlinkSync(mp3Ruta);
      process.stdout.write(`\r  ${p.id}  (sin narracion)        `);
      continue;
    }

    /* Los valores negativos van pegados con "=": argparse lee "-4%" como si fuera otra opcion. */
    await correr(py, [...base, "--voice", p.voz || vozGlobal, "--text", texto,
      `--rate=${p.rate || guion.rate || "+0%"}`, `--pitch=${p.pitch || guion.pitch || "+0Hz"}`,
      "--write-media", mp3Ruta, "--write-subtitles", srtRuta, "--no-progress"]);

    const d = await duracion(mp3Ruta);
    tiempos[p.id] = {
      audio: +d.toFixed(3),
      duracion: +(Math.max(d, 0.8) + (p.respiro ?? guion.respiro ?? RESPIRO)).toFixed(3),
      palabras: leerPalabras(srtRuta),
    };
    process.stdout.write(`\r  ${p.id}  ${d.toFixed(2)}s  "${texto.slice(0, 38)}"      `);
  }

  const total = guion.planos.reduce((s, p) => s + (tiempos[p.id]?.duracion || 0), 0);
  fs.writeFileSync(previo, JSON.stringify({ voz: vozGlobal, total: +total.toFixed(2), planos: tiempos }, null, 2));
  const m = Math.floor(total / 60), s = Math.round(total % 60);
  console.log(`\n${guion.planos.length} planos · ${m}:${String(s).padStart(2, "0")} de video · voz ${vozGlobal}  [${slug}]`);
}

main().catch(e => { console.error("\nvoz:", e.message); process.exit(1); });
