/* Ubica los binarios externos (ffmpeg, ffprobe, chromium) sin depender del PATH del usuario. */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const RAIZ = path.resolve(__dirname, "..", "..");

function primeroQueExista(candidatos) {
  for (const c of candidatos) {
    if (!c) continue;
    try { if (fs.statSync(c).isFile()) return c; } catch {}
  }
  return null;
}

function enPath(nombre) {
  try {
    return execFileSync("/usr/bin/which", [nombre], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || null;
  } catch { return null; }
}

/* ffmpeg y ffprobe: bin/ del repo primero, para no pelear con el PATH. */
function buscar(nombre) {
  return primeroQueExista([
    path.join(RAIZ, "bin", nombre),
    enPath(nombre),
    `/usr/local/bin/${nombre}`,
    `/opt/homebrew/bin/${nombre}`,
    `/opt/local/bin/${nombre}`,
  ]);
}

const ffmpeg = () => {
  const b = buscar("ffmpeg");
  if (!b) throw new Error("No encuentro ffmpeg. Pon el binario en bin/ffmpeg o instalalo en el PATH (ver INSTALAR.md).");
  return b;
};
const ffprobe = () => buscar("ffprobe"); // opcional: si falta, medimos el mp3 a mano

/* edge-tts: el modulo de python es mas confiable que el script, que suele no estar en el PATH. */
const edgeTts = () => ["python3", ["-m", "edge_tts"]];

/* Chromium de Playwright. En macOS 12 la version nueva de Playwright ya no instala el browser,
   asi que aceptamos cualquier revision que haya quedado en la cache. */
function chromiumPath() {
  const cache = path.join(os.homedir(), "Library", "Caches", "ms-playwright");
  let dirs = [];
  try { dirs = fs.readdirSync(cache); } catch { return null; }
  const rev = d => Number((d.match(/-(\d+)$/) || [])[1] || 0);
  const candidatos = [];
  for (const d of dirs.filter(d => d.startsWith("chromium_headless_shell-")).sort((a, b) => rev(b) - rev(a)))
    candidatos.push(path.join(cache, d, "chrome-headless-shell-mac-x64", "chrome-headless-shell"));
  for (const d of dirs.filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => rev(b) - rev(a)))
    candidatos.push(path.join(cache, d, "chrome-mac-x64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"));
  return primeroQueExista(candidatos);
}

module.exports = { RAIZ, ffmpeg, ffprobe, edgeTts, chromiumPath, buscar, enPath };
