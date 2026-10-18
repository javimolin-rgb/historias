/* Interior del minimercado de la estacion. Es donde transcurre casi toda la historia,
   asi que acepta opciones para envejecerlo: la luz que se corta, las gondolas que se vacian,
   la ceniza que sube por el vidrio.
   opts: luz true|false, emergencia true|false, vacio 0-1, ceniza 0-1,
         pandeo 0-1 (cuanto cede el techo bajo la ceniza), fuga true|false (ceniza colandose). */
const P = require("../props");

module.exports = {
  nombre: "tienda",
  anclas: { "16x9": { x: 980, y: 1010, escala: 1.4 }, "9x16": { x: 540, y: 1620, escala: 1.75 } },
  aire: { polvo: 0.7, grano: 0.055, vineta: 0.62 },

  dibujar({ w, h, luz = true, vacio = 0, ceniza = 0, emergencia = false, pandeo = 0, fuga = false }) {
    const vert = h > w;
    const piso = Math.round(h * (vert ? 0.78 : 0.78));
    const g = "ti" + (vert ? "v" : "h");
    /* Con luz: fluorescente verdoso de minimercado. Sin luz: todo se va al azul frio. */
    const pared = luz ? ["#9fae92", "#7d8b74", "#5f6b59"] : ["#2b323a", "#222830", "#1a1f26"];
    const suelo = luz ? ["#b9bcae", "#8a8d82"] : ["#2f343c", "#22262c"];
    const tinta = luz ? "#000" : "#000";

    const base = `<defs>
        <linearGradient id="${g}p" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${pared[0]}"/><stop offset=".7" stop-color="${pared[1]}"/><stop offset="1" stop-color="${pared[2]}"/></linearGradient>
        <linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${suelo[0]}"/><stop offset="1" stop-color="${suelo[1]}"/></linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#${g}p)"/>
      <rect y="${piso}" width="${w}" height="${h - piso}" fill="url(#${g}s)"/>
      <path d="M0 ${piso} L${w} ${piso}" ${P.O(5)}/>`;

    /* Piso de palmetas en fuga hacia el centro. */
    let baldosas = "";
    for (let i = -7; i <= 20; i++) {
      const x0 = w / 2 + i * (w / 15), x1 = w / 2 + i * (w / 4.6);
      baldosas += `<path d="M${x0.toFixed(0)} ${piso} L${x1.toFixed(0)} ${h}" stroke="${tinta}" stroke-width="3" opacity=".16"/>`;
    }
    for (let k = 1; k <= 3; k++) {
      const y = piso + (h - piso) * (k / 3.3) ** 1.8;
      baldosas += `<path d="M0 ${y.toFixed(0)} L${w} ${y.toFixed(0)}" stroke="${tinta}" stroke-width="3" opacity=".13"/>`;
    }

    /* Dos tubos fluorescentes separados de verdad. Apagados siguen ahi, como rayas muertas. */
    const tubos = (vert ? [0.085, 0.235] : [0.055, 0.145]).map(k => {
      const ancho = w * (vert ? 0.78 : 0.56);
      const x = (w - ancho) / 2;
      const y = h * k;
      return `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${ancho.toFixed(0)}" height="${(h * 0.017).toFixed(0)}" rx="7"
          fill="${luz ? "#f8f5e6" : "#454b54"}" ${P.O(4)}/>
        ${luz ? P.cono(w / 2, y + h * 0.017, ancho * 0.9, ancho * 2, piso - y, "#eaf0d8", 0.2, 50) : ""}`;
    }).join("");

    /* La pared no puede quedar pelada: cartel, reloj y afiche. */
    const muro = vert
      ? `${P.poner(w * 0.5, h * 0.145, 1.0, P.letrero(w * 0.44, "ABIERTO 24 H", "#c2452f"))}
         <circle cx="${w * 0.24}" cy="${h * 0.175}" r="${w * 0.075}" fill="#e8e2d4" ${P.O(4)}/>
         <path d="M${w * 0.24} ${h * 0.175} L${w * 0.24} ${h * 0.14} M${w * 0.24} ${h * 0.175} L${w * 0.282} ${h * 0.184}" ${P.O(5)}/>`
      : `${P.poner(w * 0.4, h * 0.22, 1.05, P.letrero(w * 0.22, "ABIERTO 24 H", "#c2452f"))}
         <circle cx="${w * 0.66}" cy="${h * 0.26}" r="${h * 0.045}" fill="#e8e2d4" ${P.O(4)}/>
         <path d="M${w * 0.66} ${h * 0.26} L${w * 0.66} ${h * 0.232} M${w * 0.66} ${h * 0.26} L${w * 0.688} ${h * 0.266}" ${P.O(5)}/>
         ${P.poner(w * 0.25, h * 0.2, 1, P.cuadro(w * 0.1, h * 0.15, { marco: "#5f6b59", tela: "#8d9a86" }))}`;

    const vidrio = P.puertaVidrio({ ceniza, luzAfuera: luz ? "#8a8d93" : "#6a6d74" });

    /* Los muebles ocupan de verdad el cuadro: con escalas chicas la tienda parecia una maqueta. */
    const muebles = vert
      /* En 9:16 la camara esta mas cerca: los muebles se superponen y llenan el alto,
         en vez de quedar chiquitos contra una pared enorme. */
      ? `${P.enPiso(-w * 0.04, piso + 10, 1.72, "puertaVidrio", vidrio)}
         ${P.enPiso(w * 0.45, piso + 46, 1.5, "refrigerador", P.refrigerador({ encendido: luz, vacio: vacio > 0.6 }))}
         ${P.enPiso(-w * 0.04, piso + 170, 1.7, "gondola", P.gondola({ vacia: vacio > 0.95, vacio, semilla: 2 + Math.round(vacio * 6) }))}
         ${P.enPiso(w * 0.02, piso + 400, 1.6, "mostrador", P.mostrador({}))}`
      : `${P.enPiso(w * 0.015, piso + 18, 1.24, "puertaVidrio", vidrio)}
         ${P.enPiso(w * 0.26, piso + 14, 1.22, "gondola", P.gondola({ vacia: vacio > 0.95, vacio, semilla: 2 + Math.round(vacio * 6) }))}
         ${P.enPiso(w * 0.76, piso + 28, 1.15, "refrigerador", P.refrigerador({ encendido: luz, vacio: vacio > 0.6 }))}
         ${P.enPiso(w * 0.42, piso + 176, 1.2, "mostrador", P.mostrador({}))}`;

    /* El techo solo aparece cuando empieza a ceder: el peso de la ceniza se tiene que ver. */
    const altoTecho = h * (vert ? 0.06 : 0.105);
    const hundido = altoTecho + pandeo * h * (vert ? 0.13 : 0.17);
    const techo = pandeo > 0
      ? `<path d="M0 0 L${w} 0 L${w} ${altoTecho} Q${w / 2} ${hundido} 0 ${altoTecho} Z" fill="${luz ? "#63705b" : "#161b22"}" ${P.O(5)}/>
         <path d="M0 ${altoTecho} Q${w / 2} ${hundido} ${w} ${altoTecho}" fill="none" stroke="${luz ? "#8d9a86" : "#39414c"}" stroke-width="4" opacity=".8"/>
         ${[0.2, 0.4, 0.6, 0.8].map(k => `<path d="M${w * k} 0 L${w * k} ${altoTecho + (hundido - altoTecho) * Math.sin(Math.PI * k)}" stroke="${luz ? "#4e5a49" : "#1b212a"}" stroke-width="7"/>`).join("")}
         ${pandeo > 0.45 ? `<path d="M${w * 0.44} ${h * 0.012} L${w * 0.48} ${hundido - 6} M${w * 0.56} ${h * 0.02} L${w * 0.53} ${hundido - 10}"
             stroke="#12151a" stroke-width="6" stroke-linecap="round"/>` : ""}`
      : "";

    /* La ceniza que se cuela por la junta. Cae a un costado a proposito: por el centro
       le pasaba por encima de la cabeza al personaje y se leia como un rayon en la imagen. */
    const xFuga = vert ? w * 0.78 : w * 0.3;
    const chorro = fuga
      ? `<path d="M${xFuga} ${hundido - 4} L${xFuga + w * 0.004} ${piso + (h - piso) * 0.22}"
           stroke="#b7b9bf" stroke-width="${(w * 0.0035).toFixed(1)}" opacity=".38"/>
         <ellipse cx="${xFuga + w * 0.004}" cy="${piso + (h - piso) * 0.22}" rx="${w * 0.016}" ry="${(h - piso) * 0.05}" fill="#b7b9bf" opacity=".25"/>
         ${P.poner(xFuga - w * 0.05, piso + (h - piso) * 0.14, 1, P.montonCeniza(w * 0.11, (h - piso) * 0.12, 12))}`
      : "";

    /* Luz de emergencia: una sola fuente calida que deja el resto en sombra. */
    const vela = emergencia
      ? P.luz(w * (vert ? 0.5 : 0.6), piso - h * 0.1, w * 1.2, h * 0.85, "#ffb870", 0.34)
      : "";

    return `${base}${baldosas}${tubos}${muro}${muebles}${techo}${chorro}${vela}`;
  },
};
