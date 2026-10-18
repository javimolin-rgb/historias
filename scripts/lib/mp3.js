/* Duracion de un mp3 recorriendo los encabezados de frame MPEG.
   Sirve de respaldo cuando no hay ffprobe: edge-tts entrega MPEG-2 Layer 3 a 24 kHz. */
const fs = require("fs");

const BITRATES = {
  1: { 1: [0,32,64,96,128,160,192,224,256,288,320,352,384,416,448],
       2: [0,32,48,56,64,80,96,112,128,160,192,224,256,320,384],
       3: [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320] },
  2: { 1: [0,32,48,56,64,80,96,112,128,144,160,176,192,224,256],
       2: [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160],
       3: [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160] },
};
const SAMPLERATES = { 1: [44100,48000,32000], 2: [22050,24000,16000], 2.5: [11025,12000,8000] };
const MUESTRAS = { 1: { 1:384, 2:1152, 3:1152 }, 2: { 1:384, 2:1152, 3:576 } };

function duracion(archivo) {
  const b = fs.readFileSync(archivo);
  let i = 0;
  // Saltar la etiqueta ID3v2 si esta presente.
  if (b.length > 10 && b.toString("latin1", 0, 3) === "ID3")
    i = 10 + ((b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9]);

  let seg = 0;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff || (b[i + 1] & 0xe0) !== 0xe0) { i++; continue; }
    const verBits = (b[i + 1] >> 3) & 3;
    const version = verBits === 3 ? 1 : verBits === 2 ? 2 : verBits === 0 ? 2.5 : null;
    const capa = 4 - ((b[i + 1] >> 1) & 3);
    const brIdx = (b[i + 2] >> 4) & 15;
    const srIdx = (b[i + 2] >> 2) & 3;
    if (!version || capa > 3 || capa < 1 || brIdx === 0 || brIdx === 15 || srIdx === 3) { i++; continue; }

    const sr = SAMPLERATES[version][srIdx];
    const br = BITRATES[version === 2.5 ? 2 : version][capa][brIdx] * 1000;
    const muestras = MUESTRAS[version === 2.5 ? 2 : version][capa];
    const pad = (b[i + 2] >> 1) & 1;
    const largo = capa === 1
      ? Math.floor((12 * br / sr + pad) * 4)
      : Math.floor(muestras / 8 * br / sr + pad);
    if (largo < 4) { i++; continue; }
    seg += muestras / sr;
    i += largo;
  }
  return seg;
}

module.exports = { duracion };
