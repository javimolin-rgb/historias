#!/usr/bin/env node
/* Genera la musica y los efectos del canal por sintesis, aqui mismo.
   Asi no dependemos de pistas de terceros ni de sus licencias: el audio es del repo.
   Uso: npm run audio            (genera todo en assets/audio/)
        npm run audio -- musica  (solo la cama de musica) */
const fs = require("fs");
const path = require("path");
const { RAIZ } = require("./lib/bin");
const W = require("./lib/wav.js");
const { SR, tau } = W;

const mkdir = d => (fs.mkdirSync(d, { recursive: true }), d);

/* ---------------- musica ---------------- */

/* Cama de tension para ir debajo de la voz.
   Dos decisiones que importan:
   - El centro tonal va entre 150 y 1500 Hz. Un drone de 55 Hz se ve lindo en el medidor
     pero el parlante de un telefono no lo reproduce, y esto se publica en TikTok.
   - Cada capa se mezcla a un nivel medido, no a ojo: el viento tapaba el acorde entero.
   Lo "tenue" se consigue en la mezcla del video (volumenMusica), no dejando el archivo sordo.
   La vuelta dura 64 s y cada frecuencia es multiplo exacto de 1/64 Hz, para que ffmpeg
   pueda repetirla sin que se oiga la costura. */
function cama({ largo = 64 } = {}) {
  const n = largo * SR;
  const par = () => [new Float64Array(n), new Float64Array(n)];

  /* Acorde que respira: la menor y fa mayor, 16 s cada uno. Es la referencia de nivel. */
  const acorde = par();
  const LA_m = [220, 261.5625, 329.5], FA = [174.625, 220, 261.5625];
  for (let c = 0; c < largo / 16; c++) {
    for (const f of (c % 2 ? FA : LA_m)) {
      for (let i = 0; i < 16 * SR; i++) {
        const idx = c * 16 * SR + i, t = idx / SR, fase = i / (16 * SR);
        const env = Math.sin(Math.PI * fase) ** 2;
        /* un poco de segundo armonico le saca el filo de sinusoide pura */
        const v = (Math.sin(tau * f * t) + Math.sin(tau * f * 2 * t) * 0.22) * env;
        acorde[0][idx] += v; acorde[1][idx] += v * 0.86;
      }
    }
  }

  /* Dos sinusoides apenas desafinadas laten entre si: movimiento sin melodia. */
  const drone = par();
  for (const [f, g, detune, pan] of [[110, 1, 0.25, -0.35], [164.75, 0.55, 0.1875, 0.35], [55, 0.6, 0.125, 0]]) {
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const v = (Math.sin(tau * f * t) + Math.sin(tau * (f + detune) * t)) * 0.5 * g;
      drone[0][i] += v * (1 - pan * 0.45); drone[1][i] += v * (1 + pan * 0.45);
    }
  }

  /* Nota alta suelta cada 8 s: da movimiento sin volverse melodia. */
  const campanas = par();
  const env = W.envolvente(Math.round(3.4 * SR), 0.05, 0.9);
  const altas = [880, 1320, 1047.5, 880, 659.5, 880, 1320, 659.5];
  for (let k = 0; k * 8 < largo; k++) {
    const desde = Math.round((k * 8 + 2) * SR), f = altas[k % altas.length];
    for (let i = 0; i < env.length && desde + i < n; i++) {
      const v = Math.sin(tau * f * (desde + i) / SR) * env[i];
      campanas[0][desde + i] += v * (k % 2 ? 1 : 0.6);
      campanas[1][desde + i] += v * (k % 2 ? 0.6 : 1);
    }
  }

  /* Pulso grave espaciado: marca el tiempo sin convertirse en ritmo. */
  const pulsos = par();
  const envP = W.envolvente(Math.round(1.2 * SR), 0.012, 0.16);
  for (let k = 0; k * 3.2 < largo; k++) {
    const desde = Math.round(k * 3.2 * SR);
    for (let i = 0; i < envP.length && desde + i < n; i++) {
      const t = (desde + i) / SR;
      const v = (Math.sin(tau * 82 * t) * 0.6 + Math.sin(tau * 41 * t) * 0.5) * envP[i];
      pulsos[0][desde + i] += v; pulsos[1][desde + i] += v;
    }
  }

  /* Viento con ceniza: ruido marron en la banda que si sale por un parlante chico. */
  const aire = s => W.pasaaltos(W.pasabajos(W.ruidoMarron(n, s), 1600), 240);
  const viento = [aire(7), aire(31)];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const lfo = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(tau * t / 21.333)) * (0.5 + 0.5 * Math.sin(tau * t / 8));
    viento[0][i] *= lfo; viento[1][i] *= lfo;
  }

  const mezcla = W.mezclar([
    { buf: acorde, db: 0 },
    { buf: drone, db: -7 },
    { buf: campanas, db: -13 },
    { buf: pulsos, db: -11 },
    { buf: viento, db: -20 },
  ], { rmsObjetivo: -18 });

  /* El ruido no cierra el bucle solo: se cruza el final con el principio. */
  const cruce = Math.round(2 * SR);
  for (const c of mezcla) {
    for (let i = 0; i < cruce; i++) {
      const k = i / cruce;
      c[i] = c[i] * k + c[n - cruce + i] * (1 - k);
    }
  }
  return mezcla.map(c => c.subarray(0, n - cruce));
}

/* ---------------- efectos ---------------- */

const EFECTOS = {
  /* Celular vibrando sobre una mesa: zumbido grave con traqueteo encima. */
  vibracion() {
    const n = Math.round(1.9 * SR), x = new Float64Array(n);
    const traqueteo = W.pasabajos(W.ruidoMarron(n, 5), 2400);
    for (let pulso = 0; pulso < 3; pulso++) {
      const desde = Math.round(pulso * 0.62 * SR), largo = Math.round(0.34 * SR);
      for (let i = 0; i < largo; i++) {
        const t = i / SR, idx = desde + i;
        if (idx >= n) break;
        const env = Math.min(1, i / (0.01 * SR)) * Math.min(1, (largo - i) / (0.02 * SR));
        x[idx] += (Math.sin(tau * 58 * t) * 0.5 + Math.sin(tau * 116 * t) * 0.18) * env;
        x[idx] += traqueteo[idx] * 0.35 * env;
      }
    }
    return [x, x];
  },

  /* Tres golpes en una puerta: impacto con cuerpo de madera. */
  golpes() {
    const n = Math.round(2.2 * SR), x = new Float64Array(n);
    const ruido = W.ruidoMarron(n, 11);
    for (let k = 0; k < 3; k++) {
      const desde = Math.round((0.1 + k * 0.52) * SR);
      const env = W.envolvente(Math.round(0.6 * SR), 0.002, 0.075);
      for (let i = 0; i < env.length && desde + i < n; i++) {
        const t = i / SR;
        x[desde + i] += (Math.sin(tau * 92 * t) * 0.6 + Math.sin(tau * 147 * t) * 0.3
          + W.pasabajos(ruido.subarray(desde, desde + 1), 900)[0] * 0) * env[i];
        x[desde + i] += ruido[desde + i] * 0.5 * env[i];
      }
    }
    return [x, Float64Array.from(x, v => v * 0.92)];
  },

  /* Techo crujiendo bajo peso: roce lento que sube de tono. */
  crujido() {
    const n = Math.round(2.6 * SR), x = new Float64Array(n);
    const r = W.pasabajos(W.ruidoMarron(n, 17), 1100);
    for (let i = 0; i < n; i++) {
      const t = i / SR, fase = i / n;
      const env = Math.sin(Math.PI * fase) ** 1.4;
      const rechinar = Math.sin(tau * (180 + 90 * fase) * t + Math.sin(tau * 7 * t) * 2);
      x[i] = (rechinar * 0.22 + r[i] * 0.8) * env;
    }
    return [x, Float64Array.from(x, (v, i) => v * (0.8 + 0.2 * Math.sin(i / 9000)))];
  },

  /* Racha de viento con ceniza. */
  viento() {
    const n = Math.round(4 * SR);
    const a = W.pasabajos(W.ruidoMarron(n, 23), 900);
    const b = W.pasabajos(W.ruidoMarron(n, 29), 760);
    const L = new Float64Array(n), R = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const fase = i / n, env = Math.sin(Math.PI * fase) ** 1.6;
      L[i] = a[i] * 1.1 * env; R[i] = b[i] * 1.1 * env;
    }
    return [L, R];
  },

  /* Radio con estatica y portadora: lo que suena cuando no hay nadie del otro lado. */
  estatica() {
    const n = Math.round(3 * SR);
    const r = W.pasaaltos(W.pasabajos(W.ruidoMarron(n, 41), 5200), 300);
    const x = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const parpadeo = 0.6 + 0.4 * Math.sin(tau * 3.1 * t) * Math.sin(tau * 11.7 * t);
      x[i] = r[i] * 2.4 * parpadeo + Math.sin(tau * 1000 * t) * 0.012;
    }
    return [x, Float64Array.from(x, v => v * 0.9)];
  },

  /* Interruptor o linterna. */
  clic() {
    const n = Math.round(0.35 * SR), x = new Float64Array(n);
    const r = W.ruidoMarron(n, 3);
    const env = W.envolvente(n, 0.0008, 0.012);
    for (let i = 0; i < n; i++) x[i] = (r[i] * 1.6 + Math.sin(tau * 1800 * i / SR) * 0.3) * env[i];
    return [x, x];
  },

  /* Golpe seco de tension para los sustos. */
  impacto() {
    const n = Math.round(2.4 * SR), x = new Float64Array(n);
    const env = W.envolvente(n, 0.003, 0.5);
    const r = W.pasabajos(W.ruidoMarron(n, 13), 2000);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const barrido = 120 * Math.exp(-t * 2.2) + 32;
      x[i] = (Math.sin(tau * barrido * t) * 0.8 + r[i] * 0.6) * env[i];
    }
    return [x, x];
  },

  /* Persiana metalica bajando y trabandose. */
  persiana() {
    const n = Math.round(2.8 * SR), x = new Float64Array(n);
    const r = W.pasabajos(W.ruidoMarron(n, 19), 3000);
    for (let i = 0; i < n; i++) {
      const t = i / SR, fase = i / n;
      const traqueteo = Math.sin(tau * 26 * t) > 0.6 ? 1 : 0.25;
      const env = fase < 0.75 ? 1 - fase * 0.4 : Math.max(0, (1 - fase) / 0.25);
      x[i] = r[i] * 1.5 * traqueteo * env;
    }
    return [x, Float64Array.from(x, v => v * 0.88)];
  },
};

/* ---------------- cli ---------------- */

function main() {
  const que = process.argv.slice(2).filter(a => !a.startsWith("--"));
  const base = path.join(RAIZ, "assets", "audio");
  const hechos = [];

  if (!que.length || que.includes("musica")) {
    const dir = mkdir(path.join(base, "musica"));
    const ruta = path.join(dir, "ceniza.wav");
    const d = W.escribir(ruta, cama({ largo: 64 }));
    hechos.push(`musica/ceniza.wav  ${d.toFixed(1)}s`);
  }

  if (!que.length || que.includes("sfx")) {
    const dir = mkdir(path.join(base, "sfx"));
    for (const [nombre, fn] of Object.entries(EFECTOS)) {
      const ruta = path.join(dir, `${nombre}.wav`);
      const d = W.escribir(ruta, fn().map(c => Float64Array.from(c, W.suavizar)));
      hechos.push(`sfx/${nombre}.wav  ${d.toFixed(2)}s`);
    }
  }

  console.log(hechos.map(h => "  " + h).join("\n"));
  console.log(`\n${hechos.length} archivos en assets/audio/ (sintetizados aqui: sin derechos de terceros)`);
}

if (require.main === module) main();
module.exports = { cama, EFECTOS };
