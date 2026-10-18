/* Subtitulos quemados: un subtitulo grande por plano (CLAUDE.md), en formato ASS.
   Los tiempos por palabra quedan guardados en audio/tiempos.json para un karaoke futuro. */
const { partirTexto } = require("./compositor");

/* ASS usa &HAABBGGRR. */
const col = (hex, alfa = "00") => {
  const h = hex.replace("#", "");
  return `&H${alfa}${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`.toUpperCase();
};

/* margenV es la distancia al borde de abajo. En vertical se deja alto para que la
   interfaz de TikTok/Reels no tape el texto, pero no tanto como para pisarle la cara
   al personaje: con frases de 3 a 12 palabras el subtitulo cabe en una o dos lineas. */
const ESTILO = {
  "16x9": { resX: 1920, resY: 1080, tam: 62, borde: 5.5, sombra: 3, margenV: 88, margenH: 190, max: 42 },
  "9x16": { resX: 1080, resY: 1920, tam: 64, borde: 6, sombra: 3, margenV: 370, margenH: 60, max: 27 },
};

const reloj = s => {
  const cs = Math.max(0, Math.round(s * 100));
  const h = Math.floor(cs / 360000), m = Math.floor(cs / 6000) % 60, seg = Math.floor(cs / 100) % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(seg).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
};

/* Un bloque Dialogue por plano, con fade corto y maximo 3 lineas. */
function ass(planos, tiempos, fmt) {
  const E = ESTILO[fmt];
  if (!E) throw new Error(`Formato sin estilo de subtitulo: ${fmt}`);

  const cabecera = `[Script Info]
ScriptType: v4.00+
PlayResX: ${E.resX}
PlayResY: ${E.resY}
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Base,Arial Black,${E.tam},${col("f2ebdf")},${col("ffffff")},${col("161618")},${col("000000", "A0")},0,0,0,0,100,100,1,0,1,${E.borde},${E.sombra},2,${E.margenH},${E.margenH},${E.margenV},1
Style: Grito,Arial Black,${Math.round(E.tam * 1.16)},${col("ffffff")},${col("ffffff")},${col("8c1f49")},${col("000000", "A0")},0,0,0,0,100,100,2,0,1,${E.borde + 1},${E.sombra},2,${E.margenH},${E.margenH},${E.margenV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  let t = 0;
  const lineas = [];
  for (const p of planos) {
    const d = tiempos[p.id]?.duracion || 2;
    const texto = (p.narracion || "").trim();
    if (texto) {
      const cuerpo = partirTexto(texto, E.max).slice(0, 3)
        .join("\\N").replace(/\{/g, "(").replace(/\}/g, ")");
      const fin = t + Math.min(d, (tiempos[p.id]?.audio || d) + 0.45);
      const estilo = p.subtitulo === "grito" ? "Grito" : "Base";
      lineas.push(`Dialogue: 0,${reloj(t + 0.04)},${reloj(fin)},${estilo},,0,0,0,,{\\fad(110,140)}${cuerpo}`);
    }
    t += d;
  }
  return `${cabecera}\n${lineas.join("\n")}\n`;
}

module.exports = { ass, ESTILO };
