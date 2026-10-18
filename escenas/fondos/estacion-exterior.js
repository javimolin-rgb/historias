/* Estacion de servicio en la ruta, de noche, con ceniza cayendo.
   opts: ceniza 0-1 (cuanta hay en el suelo), luces (si el techo esta encendido), hora "tarde"|"noche". */
const P = require("../props");

module.exports = {
  nombre: "estacion-exterior",
  anclas: { "16x9": { x: 700, y: 980, escala: 1.25 }, "9x16": { x: 470, y: 1640, escala: 1.7 } },
  aire: { polvo: 0, grano: 0.05, vineta: 0.6 },

  dibujar({ w, h, ceniza = 0.2, luces = true, hora = "noche" }) {
    const vert = h > w;
    const piso = Math.round(h * (vert ? 0.78 : 0.74));
    const g = "ee" + (vert ? "v" : "h");
    const cielo = hora === "tarde"
      ? ["#8e8275", "#6d6a67", "#4a4a4e"]
      : ["#1b1e26", "#2b3038", "#3a3d45"];

    const base = `<defs>
        <linearGradient id="${g}c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${cielo[0]}"/><stop offset=".6" stop-color="${cielo[1]}"/><stop offset="1" stop-color="${cielo[2]}"/></linearGradient>
        <linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#5e6168"/><stop offset="1" stop-color="#34373d"/></linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#${g}c)"/>
      <rect y="${piso}" width="${w}" height="${h - piso}" fill="url(#${g}s)"/>`;

    /* Cerros apenas insinuados detras: dan profundidad sin robar atencion. */
    const cerros = `<path d="M0 ${piso} L${w * 0.18} ${piso - h * 0.11} L${w * 0.34} ${piso - h * 0.04}
        L${w * 0.52} ${piso - h * 0.13} L${w * 0.72} ${piso - h * 0.05} L${w} ${piso - h * 0.09} L${w} ${piso} Z"
        fill="#3e4149" opacity=".75"/>`;

    /* Ruta: la linea del medio se pierde bajo la ceniza. */
    const ruta = `<rect y="${piso}" width="${w}" height="${(h - piso) * 0.42}" fill="#2f3238"/>
      ${ceniza < 0.6 ? Array.from({ length: 7 }, (_, i) =>
        `<rect x="${(w / 6.4) * i + 20}" y="${piso + (h - piso) * 0.2}" width="${w * 0.07}" height="9" rx="4" fill="#c9c4b4" opacity="${(0.8 - ceniza).toFixed(2)}"/>`).join("") : ""}`;

    /* Techo de la estacion y sus luces. */
    /* En 9:16 el techo baja: con el techo arriba del todo quedaban dos postes larguisimos
       cruzando medio cuadro vacio. */
    const anchoTecho = vert ? w * 1.12 : w * 0.78;
    const xTecho = vert ? -w * 0.06 : w * 0.16;
    const yTecho = vert ? h * 0.42 : h * 0.14;
    const altoTecho = h * (vert ? 0.07 : 0.1);
    const techo = `${P.poner(xTecho, yTecho, 1, P.techoChapa(anchoTecho, altoTecho, { pandeo: ceniza * 0.5 }))}
      <path d="M${xTecho + anchoTecho * 0.1} ${yTecho + altoTecho} L${xTecho + anchoTecho * 0.12} ${piso}" ${P.O(11)}/>
      <path d="M${xTecho + anchoTecho * 0.9} ${yTecho + altoTecho} L${xTecho + anchoTecho * 0.88} ${piso}" ${P.O(11)}/>
      ${luces ? [0.28, 0.52, 0.76].map(k =>
        P.cono(xTecho + anchoTecho * k, yTecho + altoTecho, 90, 560, piso - yTecho - altoTecho * 0.8, "#ffe6b0", 0.32, 36)).join("") : ""}`;

    const muebles = vert
      ? `${P.enPiso(w * 0.04, piso + 36, 1.25, "surtidor", P.surtidor({ pantalla: luces }))}
         ${P.enPiso(w * 0.58, piso + 58, 1.35, "surtidor", P.surtidor({ pantalla: false }))}
         ${P.enPiso(w * 0.6, h * 0.47, 0.82, "cartelEstacion", P.cartelEstacion({ encendido: luces }))}
         ${P.enPiso(w * 0.84, piso + 96, 1.0, "conoVial", P.conoVial())}`
      : `${P.enPiso(w * 0.24, piso + 34, 0.92, "surtidor", P.surtidor({ pantalla: luces }))}
         ${P.enPiso(w * 0.52, piso + 48, 1.0, "surtidor", P.surtidor({ pantalla: false }))}
         ${P.enPiso(w * 0.03, piso + 10, 0.72, "cartelEstacion", P.cartelEstacion({ encendido: luces }))}
         ${P.enPiso(w * 0.86, piso + 70, 0.75, "conoVial", P.conoVial())}`;

    /* Ceniza en el suelo: tapa las bases y aplana el horizonte. */
    const polvo = ceniza > 0.05
      ? `${P.poner(0, piso + (h - piso) * 0.1, 1, P.montonCeniza(w, (h - piso) * 0.55 * ceniza, 3))}
         ${P.poner(-w * 0.1, piso + (h - piso) * 0.42, 1, P.montonCeniza(w * 1.2, (h - piso) * 0.5 * ceniza, 9))}`
      : "";

    return `${base}${cerros}${ruta}${techo}${muebles}${polvo}`;
  },

  /* Lo que va delante del personaje: la ceniza en el aire y la neblina. */
  delante({ w, h, ceniza = 0.2, cayendo = true }) {
    return `${cayendo ? P.cenizaCayendo(w, h, Math.round(140 + 180 * ceniza), 0.55) : ""}
      ${P.neblina(w, h, 0.18 + 0.3 * ceniza)}`;
  },
};
