#!/usr/bin/env node
/* Montaje final con ffmpeg: camara y transiciones sobre los PNG, HUD fijo encima,
   voz + musica + efectos, y subtitulos quemados. Sale el 16:9 y el 9:16.
   Uso: npm run video -- historias/001-demo [--formato 16x9] [--check] */
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { ffmpeg, RAIZ } = require("./lib/bin");
const { cargar, mkdir, args } = require("./lib/historia");
const C = require("./lib/compositor");
const camara = require("./lib/camara");
const subs = require("./lib/subs");

const FPS = camara.FPS;
const SALIDA = { "16x9": "youtube", "9x16": "vertical" };
/* El grano de las escenas encarece mucho el encode: con "medium" el pase final se va al
   triple de tiempo sin verse mejor. veryfast + crf bajo da mas calidad y mas rapido. */
const CALIDAD = { normal: { preset: "veryfast", crf: "18" }, rapida: { preset: "veryfast", crf: "23" }, maxima: { preset: "medium", crf: "17" } };
const DIP = 0.22;      // fundido a negro entre planos
const ENTRADA = 0.45;  // fundido de apertura
const CIERRE = 0.7;    // fundido de cierre

function correr(bin, argumentos, cwd) {
  return new Promise((ok, mal) => execFile(bin, argumentos, { cwd, maxBuffer: 1 << 26 }, (e, so, se) => {
    if (!e) return ok(so);
    const log = (se || "").toString().trim().split("\n");
    mal(new Error(log.slice(-6).join("\n   ")));
  }));
}

/* Revisa que el ffmpeg instalado traiga lo que el pipeline necesita. */
async function capacidades(bin) {
  const falta = [];
  const enc = (await correr(bin, ["-hide_banner", "-encoders"]).catch(() => "")).toString();
  const fil = (await correr(bin, ["-hide_banner", "-filters"]).catch(() => "")).toString();
  if (!/\blibx264\b/.test(enc)) falta.push("codificador libx264 (video H.264)");
  if (!/\baac\b/.test(enc)) falta.push("codificador aac (audio)");
  if (!/\bsubtitles\b/.test(fil)) falta.push("filtro subtitles (libass, para quemar subtitulos)");
  if (!/\bzoompan\b/.test(fil)) falta.push("filtro zoompan (movimiento de camara)");
  if (!/\bamix\b/.test(fil)) falta.push("filtro amix (mezcla de audio)");
  return falta;
}

/* ---------- audio ---------- */

function buscarPista(carpeta, nombre) {
  const dir = path.join(RAIZ, "assets", "audio", carpeta);
  if (!fs.existsSync(dir)) return null;
  const archivos = fs.readdirSync(dir).filter(f => /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(f));
  if (!archivos.length) return null;
  if (nombre) {
    const m = archivos.find(f => path.basename(f, path.extname(f)).toLowerCase() === String(nombre).toLowerCase());
    return m ? path.join(dir, m) : null;
  }
  return path.join(dir, archivos.sort()[0]);
}

/* Pista de voz del largo exacto del video: cada mp3 rellenado con silencio hasta su plano. */
async function pistaVoz(bin, planos, tiempos, audioDir, tmp) {
  const partes = [];
  for (const p of planos) {
    const d = tiempos[p.id]?.duracion || 2;
    const mp3 = path.join(audioDir, `${p.id}.mp3`);
    const wav = path.join(tmp, `voz-${p.id}.wav`);
    if (fs.existsSync(mp3))
      await correr(bin, ["-y", "-v", "error", "-i", mp3, "-af", "apad", "-t", d.toFixed(3),
        "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", wav]);
    else
      await correr(bin, ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-t", d.toFixed(3), "-c:a", "pcm_s16le", wav]);
    partes.push(wav);
  }
  const lista = path.join(tmp, "voz.txt");
  fs.writeFileSync(lista, partes.map(p => `file '${path.basename(p)}'`).join("\n") + "\n");
  const salida = path.join(tmp, "narracion.wav");
  await correr(bin, ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", "voz.txt",
    "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", "narracion.wav"], tmp);
  partes.forEach(p => fs.unlinkSync(p));
  return salida;
}

/* ---------- video ---------- */

async function segmento(bin, { escena, capa, caja, dur, cam, efecto, fadeIn, fadeOut, W, H, destino }) {
  const t = dur.toFixed(3);
  const entrada = ["-y", "-v", "error", "-framerate", String(FPS), "-i", escena];
  if (capa) entrada.push("-framerate", String(FPS), "-i", capa);

  /* loop va despues de normalizar el tamano: asi el escalado corre una sola vez
     sobre el cuadro ya decodificado, y no una vez por cuadro de salida. */
  const mov = camara.filtros(cam, W, H, dur);
  const REPETIR = "loop=loop=-1:size=1:start=0";
  let v = `[0:v]${mov.antes},${REPETIR}${mov.despues ? "," + mov.despues : ""},setsar=1`;
  if (efecto === "titila") v += `,eq=brightness='0.055*sin(2*PI*t*3.1)+0.03*sin(2*PI*t*7.7)':eval=frame`;
  if (efecto === "oscurece") v += `,eq=brightness='-0.22*t/${t}':eval=frame`;

  /* Los fundidos van DESPUES del overlay: el HUD tambien tiene que irse a negro. */
  let cierre = [];
  if (fadeIn > 0) cierre.push(`fade=t=in:st=0:d=${fadeIn}`);
  if (fadeOut > 0) cierre.push(`fade=t=out:st=${Math.max(0, dur - fadeOut).toFixed(3)}:d=${fadeOut}`);
  const cola = cierre.length ? "," + cierre.join(",") : "";

  const filtro = capa
    ? `${v}[v0];[1:v]format=rgba,${REPETIR},fade=t=in:st=0:d=0.25:alpha=1[c];[v0][c]overlay=${caja?.x || 0}:${caja?.y || 0}:format=auto${cola}[v]`
    : `${v}${cola}[v]`;

  await correr(bin, [...entrada, "-filter_complex", filtro, "-map", "[v]", "-t", t,
    "-r", String(FPS), "-c:v", "libx264", "-preset", "ultrafast", "-crf", "14",
    "-pix_fmt", "yuv420p", "-an", destino]);
}

/* ---------- principal ---------- */

async function main() {
  const { pos, flags } = args(process.argv.slice(2));
  const bin = ffmpeg();

  const falta = await capacidades(bin);
  if (falta.length) {
    console.error(`El ffmpeg de ${bin} no sirve para este pipeline. Le falta:\n  - ${falta.join("\n  - ")}`);
    console.error("\nUsa un build completo (ver INSTALAR.md) y dejalo en bin/ffmpeg.");
    process.exit(1);
  }
  if (flags.check) { console.log(`ffmpeg OK: ${bin}`); return; }

  const { dir, guion, slug, id } = cargar(pos[0]);
  const audioDir = path.join(dir, "audio");
  const tiemposFile = path.join(audioDir, "tiempos.json");
  if (!fs.existsSync(tiemposFile)) throw new Error("Falta audio/tiempos.json. Corre primero: npm run voz");
  const tiempos = JSON.parse(fs.readFileSync(tiemposFile, "utf8")).planos;

  const formatos = flags.formato ? [String(flags.formato)] : Object.keys(C.FORMATOS);
  const q = CALIDAD[flags.calidad || (flags.rapido ? "rapida" : "normal")];
  if (!q) throw new Error(`Calidad desconocida: ${flags.calidad}. Usa: ${Object.keys(CALIDAD).join(", ")}`);
  const planos = guion.planos;
  const total = planos.reduce((s, p) => s + (tiempos[p.id]?.duracion || 2), 0);
  const salidaDir = mkdir(path.join(RAIZ, "salida"));
  const hechos = [];

  const musica = guion.musica === false ? null : buscarPista("musica", guion.musica);
  if (!musica) console.log("  (sin musica: pon un mp3 en assets/audio/musica/)");

  for (const fmt of formatos) {
    const F = C.FORMATOS[fmt];
    if (!F) throw new Error(`Formato desconocido: ${fmt}`);
    const planosDir = path.join(dir, "planos", fmt);
    if (!fs.existsSync(planosDir)) throw new Error(`Faltan los PNG de ${fmt}. Corre primero: npm run escenas`);
    const tmp = mkdir(path.join(dir, ".tmp", fmt));
    const cajasFile = path.join(planosDir, "capas.json");
    const cajas = fs.existsSync(cajasFile) ? JSON.parse(fs.readFileSync(cajasFile, "utf8")) : {};

    /* 1. voz */
    process.stdout.write(`  ${fmt}  voz...`);
    await pistaVoz(bin, planos, tiempos, audioDir, tmp);

    /* 2. un segmento por plano */
    const segs = [];
    for (let i = 0; i < planos.length; i++) {
      const p = planos[i];
      const dur = tiempos[p.id]?.duracion || 2;
      const escena = path.join(planosDir, `${p.id}.png`);
      if (!fs.existsSync(escena)) throw new Error(`Falta ${path.relative(RAIZ, escena)}`);
      const capaRuta = path.join(planosDir, `capa-${p.id}.png`);
      const siguiente = planos[i + 1];
      const destino = path.join(tmp, `seg-${String(i).padStart(3, "0")}.mp4`);

      await segmento(bin, {
        escena, capa: fs.existsSync(capaRuta) ? capaRuta : null, caja: cajas[p.id], dur,
        cam: p.camara, efecto: p.efecto,
        fadeIn: i === 0 ? ENTRADA : (p.transicion === "fundido" ? DIP : 0),
        fadeOut: i === planos.length - 1 ? CIERRE : (siguiente?.transicion === "fundido" ? DIP : 0),
        W: F.w, H: F.h, destino,
      });
      segs.push(destino);
      process.stdout.write(`\r  ${fmt}  plano ${i + 1}/${planos.length}        `);
    }

    /* 3. subtitulos */
    fs.writeFileSync(path.join(tmp, "subs.ass"), subs.ass(planos, tiempos, fmt));

    /* 4. concatenar, quemar subtitulos y mezclar el audio */
    fs.writeFileSync(path.join(tmp, "segs.txt"), segs.map(s => `file '${path.basename(s)}'`).join("\n") + "\n");

    const entradas = ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", "segs.txt", "-i", "narracion.wav"];
    const cadenas = [`[0:v]subtitles=subs.ass[v]`, `[1:a]volume=1.0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[na]`];
    const mezcla = ["[na]"];
    let idx = 2;

    if (musica) {
      entradas.push("-stream_loop", "-1", "-i", musica);
      const vol = guion.volumenMusica ?? 0.13;
      cadenas.push(`[${idx}:a]volume=${vol},afade=t=in:st=0:d=2.5,afade=t=out:st=${Math.max(0, total - 3.5).toFixed(2)}:d=3.5,atrim=0:${total.toFixed(3)},aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[mu]`);
      mezcla.push("[mu]"); idx++;
    }

    /* efectos: cada sfx del guion se pega en el arranque de su plano */
    let t = 0;
    for (const p of planos) {
      for (const nombre of p.sfx || []) {
        const pista = buscarPista("sfx", nombre);
        if (!pista) { console.log(`\n  (falta el efecto "${nombre}" en assets/audio/sfx/)`); continue; }
        entradas.push("-i", pista);
        const ms = Math.round(t * 1000);
        cadenas.push(`[${idx}:a]adelay=${ms}|${ms},volume=${p.volumenSfx ?? 0.5},aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[s${idx}]`);
        mezcla.push(`[s${idx}]`); idx++;
      }
      t += tiempos[p.id]?.duracion || 2;
    }

    /* loudnorm deja el video a -14 LUFS, que es a lo que normalizan YouTube, TikTok e Instagram.
       Sin esto el corte salia a -17,5 y sonaba mas bajo que todo lo demas del feed. */
    const sonoridad = `loudnorm=I=${guion.lufs ?? -14}:TP=-1.5:LRA=11`;
    cadenas.push(mezcla.length > 1
      ? `${mezcla.join("")}amix=inputs=${mezcla.length}:normalize=0:duration=first,${sonoridad}[a]`
      : `[na]${sonoridad}[a]`);

    const nombre = `${id}-${SALIDA[fmt] || fmt}.mp4`;
    const destino = path.join(salidaDir, nombre);
    process.stdout.write(`\r  ${fmt}  montaje final...        `);
    await correr(bin, [...entradas, "-filter_complex", cadenas.join(";"),
      "-map", "[v]", "-map", "[a]",
      "-c:v", "libx264", "-preset", q.preset, "-crf", q.crf, "-pix_fmt", "yuv420p",
      "-profile:v", "high", "-level", "4.1", "-r", String(FPS),
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
      "-movflags", "+faststart", "-t", total.toFixed(3), destino], tmp);

    segs.forEach(s => fs.unlinkSync(s));
    const mb = (fs.statSync(destino).size / 1e6).toFixed(1);
    console.log(`\r  ${fmt}  ${path.relative(RAIZ, destino)}  (${mb} MB)            `);
    hechos.push(destino);
  }

  const m = Math.floor(total / 60), s = Math.round(total % 60);
  console.log(`listo: ${m}:${String(s).padStart(2, "0")}  [${slug}]`);
  return hechos;
}

main().catch(e => { console.error("\nvideo:", e.message); process.exit(1); });
