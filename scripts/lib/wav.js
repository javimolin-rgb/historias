/* Escribe un WAV PCM 16 bits a partir de muestras en coma flotante (-1 a 1). */
const fs = require("fs");

function escribir(ruta, canales, sr = 48000) {
  const n = canales[0].length, nc = canales.length;
  const datos = Buffer.alloc(n * nc * 2);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nc; c++) {
      const v = Math.max(-1, Math.min(1, canales[c][i]));
      datos.writeInt16LE(Math.round(v * 32767), (i * nc + c) * 2);
    }
  }
  const cab = Buffer.alloc(44);
  cab.write("RIFF", 0); cab.writeUInt32LE(36 + datos.length, 4); cab.write("WAVE", 8);
  cab.write("fmt ", 12); cab.writeUInt32LE(16, 16); cab.writeUInt16LE(1, 20);
  cab.writeUInt16LE(nc, 22); cab.writeUInt32LE(sr, 24);
  cab.writeUInt32LE(sr * nc * 2, 28); cab.writeUInt16LE(nc * 2, 32); cab.writeUInt16LE(16, 34);
  cab.write("data", 36); cab.writeUInt32LE(datos.length, 40);
  fs.writeFileSync(ruta, Buffer.concat([cab, datos]));
  return n / sr;
}

/* --- piezas de sintesis --- */

const SR = 48000;
const tau = Math.PI * 2;

/* Ruido marron: ruido blanco integrado. Suena a viento, no a estatica. */
function ruidoMarron(n, semilla = 1) {
  let r = semilla, y = 0;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    r = (r * 1103515245 + 12345) & 0x7fffffff;
    const blanco = (r / 0x3fffffff) - 1;
    y = (y + 0.02 * blanco) / 1.02;
    out[i] = y * 12;
  }
  return out;
}

/* Pasabajos de un polo. corte en Hz. */
function pasabajos(x, corte, sr = SR) {
  const a = Math.exp(-tau * corte / sr);
  const out = new Float64Array(x.length);
  let y = 0;
  for (let i = 0; i < x.length; i++) { y = (1 - a) * x[i] + a * y; out[i] = y; }
  return out;
}

/* Pasaaltos de un polo. */
function pasaaltos(x, corte, sr = SR) {
  const bajo = pasabajos(x, corte, sr);
  const out = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = x[i] - bajo[i];
  return out;
}

/* Envolvente de ataque y caida exponencial, en segundos. */
function envolvente(n, ataque, caida, sr = SR) {
  const out = new Float64Array(n);
  const na = Math.max(1, Math.round(ataque * sr));
  for (let i = 0; i < n; i++) {
    const a = i < na ? i / na : 1;
    const d = Math.exp(-Math.max(0, i - na) / (caida * sr));
    out[i] = a * d;
  }
  return out;
}

/* Limitador suave: evita que la suma recorte feo. */
const suavizar = x => Math.tanh(x * 1.2) * 0.92;

/* Mezcla sumando en sitio. */
function sumar(destino, fuente, ganancia = 1, desde = 0) {
  for (let i = 0; i < fuente.length && desde + i < destino.length; i++)
    destino[desde + i] += fuente[i] * ganancia;
}

/* Entra y sale desde cero. Un efecto que arranca o corta de golpe suena a error digital,
   no al sonido que pretende ser: ese clic es lo primero que se escucha. */
function bordes(x, ms = 12, sr = SR) {
  const n = Math.max(2, Math.round(ms * sr / 1000));
  for (let i = 0; i < n && i < x.length; i++) {
    const k = i / n;
    x[i] *= k;
    x[x.length - 1 - i] *= k;
  }
  return x;
}

/* Resonancia suave: deja pasar una banda y apaga el resto. Da cuerpo sin agregar filo. */
function banda(x, centro, q = 2.2, sr = SR) {
  const bajo = pasabajos(x, centro * (1 + 1 / (2 * q)), sr);
  return pasaaltos(bajo, centro * (1 - 1 / (2 * q)) * 0.8, sr);
}

/* RMS de un canal, en dBFS. */
function rms(x) {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return 10 * Math.log10(s / x.length + 1e-12);
}
const pico = x => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);

/* Mezcla capas estereo poniendo cada una al nivel pedido (dB relativos a la primera).
   Mezclar "a ojo" fue justo lo que hizo que el viento se comiera la musica. */
function mezclar(capas, { rmsObjetivo = -17, picoMaximo = 0.89 } = {}) {
  const n = capas[0].buf[0].length;
  const L = new Float64Array(n), R = new Float64Array(n);
  const ref = rms(capas[0].buf[0]);
  for (const capa of capas) {
    const propio = rms(capa.buf[0]);
    const g = Math.pow(10, (ref + (capa.db || 0) - propio) / 20);
    for (let i = 0; i < n; i++) { L[i] += capa.buf[0][i] * g; R[i] += capa.buf[1][i] * g; }
  }
  /* Primero al RMS pedido; si aun asi algun pico se pasa, se baja todo (sin distorsionar). */
  let g = Math.pow(10, (rmsObjetivo - rms(L)) / 20);
  const p = Math.max(pico(L), pico(R)) * g;
  if (p > picoMaximo) g *= picoMaximo / p;
  for (let i = 0; i < n; i++) { L[i] *= g; R[i] *= g; }
  return [L, R];
}

module.exports = { escribir, ruidoMarron, pasabajos, pasaaltos, banda, bordes, envolvente, suavizar, sumar, rms, pico, mezclar, SR, tau };
