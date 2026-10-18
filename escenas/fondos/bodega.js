/* Trastienda: cajas, estanteria metalica y el bidon de agua. Luz de linterna.
   opts: luz true|false, agua 0-1 (cuanta queda en el bidon). */
const P = require("../props");

module.exports = {
  nombre: "bodega",
  anclas: { "16x9": { x: 760, y: 950, escala: 1.2 }, "9x16": { x: 500, y: 1560, escala: 1.6 } },
  aire: { polvo: 1.1, grano: 0.06, vineta: 0.74 },

  dibujar({ w, h, luz = false, agua = 0.6 }) {
    const vert = h > w;
    const piso = Math.round(h * (vert ? 0.76 : 0.74));
    const g = "bo" + (vert ? "v" : "h");

    const base = `<defs>
        <linearGradient id="${g}p" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${luz ? "#59605c" : "#23272d"}"/><stop offset="1" stop-color="${luz ? "#3c423f" : "#15181d"}"/></linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#${g}p)"/>
      <rect y="${piso}" width="${w}" height="${h - piso}" fill="${luz ? "#4a4f4c" : "#1c1f24"}"/>
      <path d="M0 ${piso} L${w} ${piso}" ${P.O(5)}/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M${(w / 8) * i} ${piso * 0.12} L${(w / 8) * i} ${piso}" stroke="#000" stroke-width="3" opacity=".14"/>`).join("")}`;

    const muebles = vert
      ? `${P.enPiso(w * 0.04, piso + 20, 1.0, "gondola", P.gondola({ vacia: true }))}
         ${P.enPiso(w * 0.1, piso + 120, 1.1, "caja", P.caja({}))}
         ${P.enPiso(w * 0.46, piso + 108, 0.95, "caja", P.caja({ abierta: true }))}
         ${P.enPiso(w * 0.66, piso + 230, 1.35, "bidon", P.bidon({ nivel: agua }))}
         ${P.enPiso(w * 0.9, piso + 40, 0.9, "escoba", P.escoba())}`
      : `${P.enPiso(w * 0.06, piso + 18, 0.95, "gondola", P.gondola({ vacia: true }))}
         ${P.enPiso(w * 0.36, piso + 90, 1.0, "caja", P.caja({}))}
         ${P.enPiso(w * 0.52, piso + 96, 0.85, "caja", P.caja({ abierta: true }))}
         ${P.enPiso(w * 0.78, piso + 170, 1.25, "bidon", P.bidon({ nivel: agua }))}
         ${P.enPiso(w * 0.94, piso + 20, 0.85, "escoba", P.escoba())}`;

    return `${base}${muebles}`;
  },
};
