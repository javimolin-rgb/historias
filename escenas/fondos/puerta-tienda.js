/* Primer plano de la puerta de vidrio: es el plano del giro, cuando alguien golpea.
   La puerta tiene que dominar el cuadro, asi que ocupa casi todo el alto.
   opts: ceniza 0-1, silueta true|false, luz true|false, golpeando true|false. */
const P = require("../props");

module.exports = {
  nombre: "puerta-tienda",
  anclas: { "16x9": { x: 690, y: 1030, escala: 1.5 }, "9x16": { x: 290, y: 1750, escala: 1.6 } },
  aire: { polvo: 0.5, grano: 0.06, vineta: 0.74 },

  dibujar({ w, h, ceniza = 0.4, silueta = false, luz = false }) {
    const vert = h > w;
    const piso = Math.round(h * (vert ? 0.9 : 0.93));
    const g = "pt" + (vert ? "v" : "h");
    const pared = luz ? ["#8d9a86", "#4e5a49"] : ["#262c34", "#13171d"];

    const base = `<defs><linearGradient id="${g}p" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${pared[0]}"/><stop offset="1" stop-color="${pared[1]}"/></linearGradient></defs>
      <rect width="${w}" height="${h}" fill="url(#${g}p)"/>
      <rect y="${piso}" width="${w}" height="${h - piso}" fill="${luz ? "#8a8d82" : "#1d2128"}"/>
      <path d="M0 ${piso} L${w} ${piso}" ${P.O(5)}/>`;

    /* La puerta ocupa el alto completo: el vidrio es el protagonista de este plano. */
    const escala = (piso - h * 0.04) / 620;
    const ancho = 340 * escala;
    const x = vert ? w * 0.24 : w * 0.49;

    /* La silueta se dibuja aqui y no en el prop: hay que controlar que la cabeza y los
       hombros queden POR ENCIMA de la ceniza, si no el visitante parece una luna. */
    const nivel = 560 * Math.max(0, Math.min(1, ceniza));
    const techoCeniza = 586 - nivel;                     // donde empieza la ceniza en el vidrio
    const cabeza = Math.max(118, techoCeniza - 104);     // la cabeza siempre por encima
    const figura = silueta
      ? `<g opacity=".88" fill="#1e2228">
           <circle cx="170" cy="${cabeza.toFixed(0)}" r="54"/>
           <path d="M${170 - 42} ${(cabeza + 48).toFixed(0)} L${170 + 42} ${(cabeza + 48).toFixed(0)}
             L${170 + 104} 586 L${170 - 104} 586 Z"/>
           <path d="M${170 - 104} ${(cabeza + 112).toFixed(0)} L${170 - 134} ${(cabeza + 230).toFixed(0)}"
             stroke="#1e2228" stroke-width="26" stroke-linecap="round"/>
         </g>`
      : "";

    const puerta = P.enPiso(x, piso, escala, "puertaVidrio",
      P.puertaVidrio({ ceniza, luzAfuera: luz ? "#8a8d93" : "#6f737b" }).replace(
        /(<g clip-path="url\(#pv\d+\)">)/, `$1${figura}`));

    const sucio = P.poner(x + 22 * escala, piso - 586 * escala, escala, P.rayasVidrio(296, 560));

    /* Algo en primer plano para que la pared no quede pelada. */
    const contexto = vert
      ? `${P.enPiso(w * 0.74, piso + 10, 1.0, "gondola", P.gondola({ vacio: 0.8, semilla: 9 }))}`
      : `${P.enPiso(-w * 0.06, piso + 10, 1.3, "gondola", P.gondola({ vacio: 0.8, semilla: 9 }))}
         ${P.poner(w * 0.07, h * 0.1, 0.8, P.letrero(w * 0.16, "SALIDA", "#5f6b59"))}
         ${P.enPiso(w * 0.9, piso + 14, 1.1, "escoba", P.escoba())}
         ${P.enPiso(w * 0.82, piso + 20, 1.0, "bidon", P.bidon({ nivel: 0.15 }))}`;

    return `${base}${contexto}${puerta}${sucio}
      ${P.poner(x - ancho * 0.16, piso - 14, 1, P.montonCeniza(ancho * 1.32, (h - piso) * 1.6 * (0.3 + ceniza * 0.7), 6))}
      ${silueta ? P.luz(x + ancho / 2, piso - 330 * escala, ancho * 2.4, h * 0.8, "#cfd4dc", 0.12) : ""}`;
  },
};
