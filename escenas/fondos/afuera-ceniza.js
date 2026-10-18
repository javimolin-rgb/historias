/* El mundo de afuera cuando ya no queda ruta: todo gris, el auto enterrado, el cartel asomando.
   opts: ceniza 0-1, huellas true|false, hora "dia"|"tarde". */
const P = require("../props");

module.exports = {
  nombre: "afuera-ceniza",
  anclas: { "16x9": { x: 700, y: 950, escala: 1.1 }, "9x16": { x: 470, y: 1580, escala: 1.5 } },
  aire: { polvo: 0, grano: 0.05, vineta: 0.55 },

  dibujar({ w, h, ceniza = 0.9, huellas = false, hora = "dia" }) {
    const vert = h > w;
    const piso = Math.round(h * (vert ? 0.68 : 0.64));
    const g = "ac" + (vert ? "v" : "h");
    const cielo = hora === "tarde" ? ["#a08f7e", "#7e7365", "#5d5953"] : ["#b4b2ab", "#94938f", "#777875"];

    const base = `<defs>
        <linearGradient id="${g}c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${cielo[0]}"/><stop offset=".7" stop-color="${cielo[1]}"/><stop offset="1" stop-color="${cielo[2]}"/></linearGradient>
        <linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#9a9ca3"/><stop offset="1" stop-color="#babcc1"/></linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#${g}c)"/>
      <rect y="${piso}" width="${w}" height="${h - piso}" fill="url(#${g}s)"/>`;

    /* La columna del volcan al fondo: es lo que explica todo el cuadro y evita
       que el cielo quede como un vacio beige. */
    const volcan = `<path d="M${w * 0.58} ${piso - h * 0.02} L${w * 0.7} ${piso - h * 0.13} L${w * 0.82} ${piso - h * 0.02} Z"
        fill="#6f6e6b" opacity=".55"/>
      <path d="M${w * 0.665} ${piso - h * 0.13} Q${w * 0.6} ${h * 0.36} ${w * 0.68} ${h * 0.2}
        Q${w * 0.74} ${h * 0.05} ${w * 0.9} ${-h * 0.02} L${w * 1.05} ${-h * 0.02}
        Q${w * 0.86} ${h * 0.12} ${w * 0.8} ${h * 0.3} Q${w * 0.76} ${piso - h * 0.08} ${w * 0.715} ${piso - h * 0.13} Z"
        fill="#86857f" opacity=".45"/>
      <rect y="${piso - h * 0.16}" width="${w}" height="${h * 0.16}" fill="#a3a29c" opacity=".35"/>`;

    /* Postes de luz torcidos con el cable colgando: lo unico vertical que queda. */
    const postes = [0.23, 0.46, 0.68].map((k, i) => {
      const x = w * k, alto = h * (0.2 - i * 0.035), inclina = (i % 2 ? 1 : -1) * w * 0.012;
      return `<path d="M${x} ${piso - (h - piso) * 0.1} L${x + inclina} ${piso - (h - piso) * 0.1 - alto}" ${P.O(8)}/>`;
    }).join("") + `<path d="M${w * 0.23} ${piso - h * 0.2} Q${w * 0.35} ${piso - h * 0.13} ${w * 0.46} ${piso - h * 0.17}
        Q${w * 0.57} ${piso - h * 0.11} ${w * 0.68} ${piso - h * 0.14}" fill="none" stroke="#3f4147" stroke-width="4" opacity=".7"/>`;

    /* Lomas de ceniza: desplazadas entre si, porque alineadas se leian como rayas. */
    let lomas = "";
    for (let k = 0; k < 4; k++) {
      const y = piso - (h - piso) * 0.06 + k * (h - piso) * 0.16;
      const ancho = w * (1.25 + k * 0.1), dx = -w * (0.1 + (k % 2) * 0.16);
      lomas += P.poner(dx, y, 1, P.montonCeniza(ancho, (h - piso) * (0.18 + k * 0.1), 3 + k * 7));
    }

    const cosas = vert
      ? `${P.enPiso(w * 0.04, piso + (h - piso) * 0.3, 0.74, "autoCubierto", P.autoCubierto({}))}
         ${P.enPiso(w * 0.6, piso - (h - piso) * 0.06, 0.6, "cartelEstacion", P.cartelEstacion({ encendido: false }))}`
      : `${P.enPiso(w * 0.5, piso + (h - piso) * 0.34, 0.8, "autoCubierto", P.autoCubierto({}))}
         ${P.enPiso(w * 0.04, piso - (h - piso) * 0.02, 0.66, "cartelEstacion", P.cartelEstacion({ encendido: false }))}`;

    /* Huellas que se alejan. Son DOS rastros, no uno: es lo que dice el final de la historia
       y es lo ultimo que ve el espectador. */
    let rastro = "";
    if (huellas) {
      for (const [dx, dy, op] of [[0, 0, 1], [-w * 0.055, (h - piso) * 0.1, 0.85]]) {
        for (let i = 0; i < 11; i++) {
          const t = i / 10;
          const x = w * (0.4 + t * (vert ? 0.36 : 0.5)) + dx * (1 - t);
          const y = h - (h - piso) * 0.82 * (1 - t) - (h - piso) * 0.08 + dy * (1 - t);
          const r = (1 - t) * (w * 0.012) + w * 0.0035;
          for (const k of [0, 1])
            rastro += `<ellipse cx="${(x + r * 2.3 * k).toFixed(0)}" cy="${(y + r * 0.9 * k).toFixed(0)}"
              rx="${r.toFixed(1)}" ry="${(r * 0.55).toFixed(1)}" fill="#6f727a"
              opacity="${((0.5 - t * 0.26) * op).toFixed(2)}"/>`;
        }
      }
    }

    return `${base}${volcan}${postes}${lomas}${cosas}${rastro}`;
  },

  delante({ w, h, ceniza = 0.9, cayendo = false }) {
    return `${cayendo ? P.cenizaCayendo(w, h, 110, 0.4) : ""}${P.neblina(w, h, 0.22, "#c3c2bd")}`;
  },
};
