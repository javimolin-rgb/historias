/* Living de un departamento, de noche: ventana con la ciudad, sofa, lampara calida.
   Se recompone segun el formato en vez de recortarse: en vertical los muebles se apilan. */
const P = require("../props");

module.exports = {
  nombre: "living-noche",
  /* Donde pararse si el guion no lo dice (pies del personaje). */
  anclas: { "16x9": { x: 660, y: 930, escala: 1.3 }, "9x16": { x: 470, y: 1560, escala: 1.75 } },
  aire: { polvo: 0.9, grano: 0.055, vineta: 0.62 },

  dibujar({ w, h, lampara = true, cortina = false }) {
    const vert = h > w;
    const piso = Math.round(h * (vert ? 0.76 : 0.72));
    const g = "ln" + (vert ? "v" : "h");

    const base = `<defs>
        <linearGradient id="${g}p" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#172244"/><stop offset=".72" stop-color="#2b3e70"/><stop offset="1" stop-color="#243358"/></linearGradient>
        <linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4a3626"/><stop offset="1" stop-color="#281c14"/></linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#${g}p)"/>
      <rect y="${piso}" width="${w}" height="${h - piso}" fill="url(#${g}s)"/>`;

    /* Duelas en fuga hacia el centro, y juntas transversales que se separan al acercarse. */
    let suelo = "";
    for (let i = -8; i <= 20; i++) {
      const x0 = w / 2 + i * (w / 16), x1 = w / 2 + i * (w / 5.2);
      suelo += `<path d="M${x0.toFixed(0)} ${piso} L${x1.toFixed(0)} ${h}" stroke="#1b120d" stroke-width="3" opacity=".4"/>`;
    }
    for (let k = 1; k <= 3; k++) {
      const y = piso + (h - piso) * (k / 3.4) ** 1.7;
      suelo += `<path d="M0 ${y.toFixed(0)} L${w} ${y.toFixed(0)}" stroke="#1b120d" stroke-width="3" opacity=".3"/>`;
    }
    const zocalo = `<rect y="${piso - 26}" width="${w}" height="26" fill="#3a4466"/>
      <path d="M0 ${piso} L${w} ${piso}" stroke="#161618" stroke-width="5"/>`;

    const ventana = P.ventanaCiudad({ semilla: 3, encendidas: 0.26, persiana: cortina });

    const pared = vert
      ? `${P.poner(w * 0.06, h * 0.215, 1.25, ventana)}
         ${P.poner(w * 0.62, h * 0.3, 1.0, P.cuadro(250, 185))}`
      : `${P.poner(w * 0.07, h * 0.165, 1.05, ventana)}
         ${P.poner(w * 0.4, h * 0.2, 1.0, P.cuadro(230, 170))}
         ${P.poner(w * 0.63, h * 0.18, 0.62, P.estante({ lleno: true }))}`;

    /* Todo lo que toca el suelo se apoya con enPiso: nada queda flotando. */
    const muebles = vert
      ? `${P.poner(w * 0.08, piso + 60, 1.0, P.alfombra(w * 0.82, 170))}
         ${P.enPiso(w * 0.55, piso + 36, 0.92, "lampara", P.lampara({ prendida: lampara }))}
         ${P.sombra(w * 0.46, piso + 108, w * 0.42, 34, 0.32)}
         ${P.enPiso(w * 0.1, piso + 108, 0.92, "sofa", P.sofa({}))}
         ${P.enPiso(w * 0.08, piso + 285, 0.9, "mesa", P.mesa({}))}
         ${P.enPiso(w * 0.74, piso + 250, 0.95, "latas", P.latas(3))}
         ${P.enPiso(w * 0.02, piso + 150, 0.95, "bidon", P.bidon({ nivel: 0.8 }))}`
      : `${P.poner(w * 0.22, piso + 70, 1.0, P.alfombra(w * 0.46, 150))}
         ${P.enPiso(w * 0.82, piso + 34, 0.95, "lampara", P.lampara({ prendida: lampara }))}
         ${P.sombra(w * 0.66, piso + 122, 300, 38, 0.32)}
         ${P.enPiso(w * 0.53, piso + 122, 0.95, "sofa", P.sofa({}))}
         ${P.enPiso(w * 0.44, piso + 210, 0.82, "mesa", P.mesa({}))}
         ${P.enPiso(w * 0.03, piso + 92, 0.95, "bidon", P.bidon({ nivel: 0.8 }))}
         ${P.enPiso(w * 0.16, piso + 205, 0.85, "latas", P.latas(3))}
         ${P.enPiso(w * 0.92, piso + 170, 0.85, "planta", P.planta())}`;

    /* Charco de luz en el suelo bajo la lampara. */
    const charco = lampara
      ? P.luz(w * (vert ? 0.63 : 0.9), piso + (vert ? 60 : 70), w * 0.6, (h - piso) * 1.1, "#f2c27a", 0.3)
      : "";

    return `${base}${suelo}${zocalo}${pared}${charco}${muebles}`;
  },
};
