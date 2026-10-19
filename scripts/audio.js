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

/* ---------------- efectos ----------------

   Criterios, despues de que la primera version sonara a fallo tecnico y no a sonido:
   - Nada arranca ni corta de golpe: todo pasa por bordes(), si no se oye un clic digital.
   - Nada de barridos de frecuencia ni portadoras puras: eso es lo que suena a "error".
   - Todo filtrado por debajo de los 4 kHz. El filo agudo es lo que molesta sobre la voz.
   - Son efectos de apoyo, no de primer plano: se mezclan bajos en el guion (volumenSfx). */

/* Normaliza un efecto a un pico comodo y le suaviza los bordes. */
function acabar(canales, picoObjetivo = 0.7) {
  const p = Math.max(...canales.map(W.pico)) || 1;
  const g = picoObjetivo / p;
  return canales.map(c => W.bordes(Float64Array.from(c, v => v * g), 14));
}

const EFECTOS = {
  /* Celular vibrando sobre una superficie dura. */
  vibracion() {
    const n = Math.round(1.8 * SR), x = new Float64Array(n);
    const traqueteo = W.pasabajos(W.ruidoMarron(n, 5), 1400);
    for (let pulso = 0; pulso < 3; pulso++) {
      const desde = Math.round(pulso * 0.6 * SR), largo = Math.round(0.3 * SR);
      for (let i = 0; i < largo; i++) {
        const t = i / SR, idx = desde + i;
        if (idx >= n) break;
        /* ataque de 25 ms: a 1 ms se oye el clic antes que el zumbido */
        const env = Math.min(1, i / (0.025 * SR)) * Math.min(1, (largo - i) / (0.05 * SR));
        x[idx] += (Math.sin(tau * 56 * t) * 0.5 + Math.sin(tau * 112 * t) * 0.12) * env;
        x[idx] += traqueteo[idx] * 0.22 * env;
      }
    }
    return acabar([x, Float64Array.from(x, v => v * 0.95)]);
  },

  /* Tres golpes en una puerta. El cuerpo lo da la resonancia de la madera, no un tono. */
  golpes() {
    const n = Math.round(2.1 * SR), x = new Float64Array(n);
    const ruido = W.pasabajos(W.ruidoMarron(n, 11), 2200);
    const madera = W.banda(ruido, 165, 2.4);
    for (let k = 0; k < 3; k++) {
      const desde = Math.round((0.12 + k * 0.5) * SR);
      const env = W.envolvente(Math.round(0.5 * SR), 0.006, 0.065);
      for (let i = 0; i < env.length && desde + i < n; i++)
        x[desde + i] += (madera[desde + i] * 1.5 + ruido[desde + i] * 0.4) * env[i] * (k === 1 ? 1 : 0.86);
    }
    return acabar([x, Float64Array.from(x, v => v * 0.9)]);
  },

  /* Techo crujiendo bajo peso: roce lento, sin oscilador a la vista. */
  crujido() {
    const n = Math.round(2.4 * SR);
    const r = W.pasabajos(W.ruidoMarron(n, 17), 1500);
    const cuerpo = W.banda(r, 420, 3);
    const x = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const fase = i / n;
      /* el roce va y viene: dos lobulos, no una rampa */
      const env = (Math.sin(Math.PI * fase) ** 1.6) * (0.6 + 0.4 * Math.sin(tau * fase * 2.5));
      x[i] = (cuerpo[i] * 2.2 + r[i] * 0.5) * Math.max(0, env);
    }
    return acabar([x, Float64Array.from(x, (v, i) => v * (0.82 + 0.18 * Math.sin(i / 11000)))], 0.6);
  },

  /* Racha de viento con ceniza. */
  viento() {
    const n = Math.round(3.6 * SR);
    const a = W.pasabajos(W.ruidoMarron(n, 23), 700);
    const b = W.pasabajos(W.ruidoMarron(n, 29), 620);
    const L = new Float64Array(n), R = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const fase = i / n, env = Math.sin(Math.PI * fase) ** 1.7;
      L[i] = a[i] * env; R[i] = b[i] * env;
    }
    return acabar([L, R], 0.6);
  },

  /* Radio sin senal. Sin portadora: ese pitido de 1 kHz era justo lo que sonaba a error. */
  estatica() {
    const n = Math.round(2.8 * SR);
    const r = W.pasaaltos(W.pasabajos(W.ruidoMarron(n, 41), 2600), 500);
    const x = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      /* parpadeo lento: a 11 Hz sonaba a interferencia digital */
      const parpadeo = 0.55 + 0.45 * Math.sin(tau * 1.3 * t) * Math.sin(tau * 2.9 * t);
      x[i] = r[i] * 2.2 * parpadeo * Math.sin(Math.PI * i / n) ** 0.5;
    }
    return acabar([x, Float64Array.from(x, v => v * 0.92)], 0.55);
  },

  /* Interruptor o rele: un golpe seco y corto, grave, sin brillo. */
  clic() {
    const n = Math.round(0.5 * SR), x = new Float64Array(n);
    const r = W.pasabajos(W.ruidoMarron(n, 3), 1200);
    const env = W.envolvente(n, 0.004, 0.035);
    for (let i = 0; i < n; i++) x[i] = (W.banda(r, 220, 2)[0] * 0 + r[i] * 1.4) * env[i];
    const cuerpo = W.banda(x, 190, 2.5);
    for (let i = 0; i < n; i++) x[i] = x[i] * 0.5 + cuerpo[i] * 1.6;
    return acabar([x, x], 0.6);
  },

  /* Golpe de tension: una hinchazon grave que crece y se va. Sin barrido ni transitorio. */
  impacto() {
    const n = Math.round(2.6 * SR), x = new Float64Array(n);
    const r = W.pasabajos(W.ruidoMarron(n, 13), 500);
    const grave = W.banda(r, 70, 1.8);
    for (let i = 0; i < n; i++) {
      const t = i / SR, fase = i / n;
      /* ataque de 180 ms: lo que daba miedo era el golpe, pero tambien lo que sonaba a fallo */
      const env = Math.min(1, t / 0.18) * Math.exp(-Math.max(0, t - 0.18) * 1.9);
      x[i] = (grave[i] * 2.6 + Math.sin(tau * 48 * t) * 0.25) * env;
    }
    return acabar([x, x], 0.62);
  },

  /* Persiana metalica: traqueteo con puerta suave, no recortada. */
  persiana() {
    const n = Math.round(2.4 * SR), x = new Float64Array(n);
    const r = W.pasabajos(W.ruidoMarron(n, 19), 1900);
    const metal = W.banda(r, 760, 2.6);
    for (let i = 0; i < n; i++) {
      const t = i / SR, fase = i / n;
      /* la puerta es una sinusoide elevada, no un umbral: recortar producia stutter digital */
      const traqueteo = 0.3 + 0.7 * Math.max(0, Math.sin(tau * 19 * t)) ** 1.5;
      const env = fase < 0.7 ? 1 - fase * 0.35 : Math.max(0, (1 - fase) / 0.3);
      x[i] = (metal[i] * 1.6 + r[i] * 0.5) * traqueteo * env;
    }
    return acabar([x, Float64Array.from(x, v => v * 0.88)], 0.58);
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
      const d = W.escribir(ruta, fn());
      hechos.push(`sfx/${nombre}.wav  ${d.toFixed(2)}s`);
    }
  }

  console.log(hechos.map(h => "  " + h).join("\n"));
  console.log(`\n${hechos.length} archivos en assets/audio/ (sintetizados aqui: sin derechos de terceros)`);
}

if (require.main === module) main();
module.exports = { cama, EFECTOS };
