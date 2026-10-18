/* Personaje oficial del canal: cuerpo de palitos, cabeza blanca con sombra, gorro de lana a rayas color frambuesa.
   Todo se dibuja como SVG en un lienzo de 200 x 300 (la cabeza tiene centro 100,96 y radio 42; los pies llegan a y=292).
   Funciona en el navegador (window.Personaje) y en Node (require("./personaje.js")). */
(function (root) {
  const K = "#161618";
  const LIMB = `stroke="${K}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const OUT = `stroke="${K}" stroke-width="5" stroke-linejoin="round"`;
  let uid = 0;

  const COLORES = {
    frambuesa: { base: "#c8336b", oscuro: "#8c1f49" }, // oficial
    naranjo:   { base: "#d9622b", oscuro: "#99401a" },
    turquesa:  { base: "#1f9e93", oscuro: "#11665e" },
    morado:    { base: "#6c4bb3", oscuro: "#432c7c" },
  };
  const CREMA = "#f2ebdf";

  /* Canto del gorro: dos curvas cuadráticas (P0, control, P2), en coordenadas sin rotar. */
  const CANTO_ARRIBA = [[54, 76], [100, 63], [148, 76]];
  const CANTO_ABAJO = [[56, 100], [100, 87], [146, 100]];
  const q = (c, t) => [0, 1].map(i => (1 - t) * (1 - t) * c[0][i] + 2 * (1 - t) * t * c[1][i] + t * t * c[2][i]);
  const curva = c => `M${c[0]} Q${c[1]} ${c[2]}`;

  function tejido(n) {
    let d = "";
    for (let i = 1; i < n; i++) {
      const t = (1 - Math.cos(Math.PI * i / n)) / 2; // más juntas en los bordes: el canto es un cilindro
      const a = q(CANTO_ARRIBA, t), b = q(CANTO_ABAJO, t);
      const p = k => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k].map(v => v.toFixed(1)).join(" ");
      d += `M${p(.12)} L${p(.88)} `;
    }
    return d;
  }
  const raya = (y, h) => `M40 ${y} Q100 ${y - 14} 160 ${y} L160 ${y + h} Q100 ${y + h - 14} 40 ${y + h} Z`;

  function gorro(color = "frambuesa") {
    const c = COLORES[color], id = "pg" + uid++;
    const COPA = "M60 86 Q56 40 100 38 Q146 40 142 86 Z";
    const CANTO = `${curva(CANTO_ARRIBA)} L${CANTO_ABAJO[2]} Q${CANTO_ABAJO[1]} ${CANTO_ABAJO[0]} Z`;
    return `<defs>
        <clipPath id="${id}d"><path d="${COPA}"/></clipPath>
        <radialGradient id="${id}g" cx="38%" cy="28%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></radialGradient>
        <linearGradient id="${id}c" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".3" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>
        <linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
        <clipPath id="${id}h"><circle cx="100" cy="96" r="40"/></clipPath>
      </defs>
      <g transform="rotate(-5 100 80)">
        <path d="M50 96 Q100 84 150 96 L150 112 Q100 100 50 112 Z" fill="#2a3350" opacity=".22" clip-path="url(#${id}h)"/>
        <path d="${COPA}" fill="${c.base}"/>
        <g clip-path="url(#${id}d)"><path d="${raya(58, 8)}" fill="${CREMA}"/><path d="${raya(72, 8)}" fill="${CREMA}"/></g>
        <path d="${COPA}" fill="url(#${id}g)"/>
        <path d="M116 48 Q127 56 131 68" stroke="${c.oscuro}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="${COPA}" fill="none" ${OUT}/>
        <path d="${CANTO}" fill="${c.base}"/>
        <path d="${tejido(13)}" stroke="${c.oscuro}" stroke-width="3" stroke-linecap="round"/>
        <path d="${CANTO}" fill="url(#${id}c)"/><path d="${CANTO}" fill="url(#${id}v)"/>
        <path d="${curva([[58, 80], [100, 68], [144, 80]])}" stroke="#fff" stroke-opacity=".25" stroke-width="2" fill="none"/>
        <path d="${CANTO}" fill="none" ${OUT}/>
      </g>`;
  }

  /* Expresiones: solo cambian ojos, cejas, gota y líneas de susto. */
  const OJOS = { normal: [4.2, 6.8], sorpresa: [5.5, 9], nervioso: [3.8, 5], cerrados: null,
                 cansado: [4, 4.2], triste: [4, 5.6], duda: [4.2, 6.2] };
  function cara(expr = "normal") {
    const id = "pc" + uid++;
    const r = OJOS[expr];
    const ojos = r
      ? `<ellipse cx="76" cy="110" rx="${r[0]}" ry="${r[1]}" fill="${K}"/><ellipse cx="102" cy="110" rx="${r[0]}" ry="${r[1]}" fill="${K}"/>
         <circle cx="77.5" cy="107" r="1.4" fill="#fff"/><circle cx="103.5" cy="107" r="1.4" fill="#fff"/>`
      : `<path d="M70 111 Q76 115 82 111 M96 111 Q102 115 108 111" stroke="${K}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    const parpados = expr === "cansado"
      ? `<path d="M68 104 L84 104 M94 104 L110 104" stroke="${K}" stroke-width="4" stroke-linecap="round"/>`
      : expr === "triste"
      ? `<path d="M68 99 L84 103 M94 103 L110 99" stroke="${K}" stroke-width="3.5" stroke-linecap="round"/>`
      : expr === "duda"
      ? `<path d="M68 101 L84 97 M95 100 L110 100" stroke="${K}" stroke-width="3.5" stroke-linecap="round"/>`
      : "";
    const extra = parpados + (expr === "nervioso"
      ? `<path d="M69 99 L80 95 M98 96 L108 99" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
         <path d="M134 94 q5 8 0 11 q-5 -3 0 -11z" fill="#8fd0f0" stroke="${K}" stroke-width="2.5"/>`
      : expr === "sorpresa"
      ? `<path d="M60 74 L52 68 M64 64 L58 56 M140 74 L148 68" stroke="${K}" stroke-width="3" stroke-linecap="round"/>` : "");
    return `<defs><clipPath id="${id}"><circle cx="100" cy="96" r="42"/></clipPath></defs>
      <circle cx="100" cy="96" r="42" fill="#d3d8e1"/>
      <circle cx="108" cy="86" r="42" fill="#fff" clip-path="url(#${id})"/>
      <circle cx="100" cy="96" r="42" fill="none" ${OUT}/>${ojos}${extra}`;
  }

  /* Poses: brazos, manos (puntos negros) y piernas. */
  const POSES = {
    quieto:        { brazos: "M100 150 L86 180 L82 208 M100 150 L114 180 L118 208", manos: [[82, 210], [118, 210]] },
    sosteniendo:   { brazos: "M100 150 L84 182 L80 210 M100 150 L118 178 L132 166", manos: [[80, 212], [134, 164]] },
    brazos_arriba: { brazos: "M100 150 L74 138 L54 114 M100 150 L126 138 L146 114", manos: [[52, 111], [148, 111]] },
    manos_juntas:  { brazos: "M100 150 L84 174 L98 182 M100 150 L116 174 L104 184", manos: [[98, 182], [104, 184]] },
    caminando:     { brazos: "M100 150 L86 176 L74 198 M100 150 L112 178 L124 200", manos: [[73, 200], [125, 202]],
                     piernas: "M100 220 L84 288 L72 290 M100 220 L114 286 L126 290" },

    /* --- poses agregadas para las historias de encierro ---
       "cabeza" baja la cabeza y el gorro: sin eso un personaje sentado queda del mismo
       alto que uno de pie. Los pies siguen tocando y=290, asi que el ancla no cambia. */

    /* Sentado en el suelo, piernas estiradas hacia un lado. */
    sentado:       { cabeza: 66, torso: "M100 202 L104 268",
                     brazos: "M102 222 L80 250 L70 276 M102 222 L132 246 L154 262",
                     manos: [[68, 278], [156, 262]],
                     piernas: "M104 268 L158 276 L162 292 M104 268 L146 288 L190 290" },
    /* Encogido contra una pared, rodillas al pecho. */
    encogido:      { cabeza: 54, torso: "M100 192 L100 250",
                     brazos: "M100 206 L70 230 L94 252 M100 206 L130 230 L106 254",
                     manos: [[94, 254], [106, 256]],
                     piernas: "M100 250 L64 262 L74 292 M100 250 L136 262 L126 292" },
    /* Agachado mirando algo en el suelo. */
    agachado:      { cabeza: 46, torso: "M100 184 L100 236",
                     brazos: "M100 196 L76 224 L68 250 M100 196 L124 224 L132 250",
                     manos: [[66, 252], [134, 252]],
                     piernas: "M100 236 L66 262 L58 292 M100 236 L134 264 L142 292" },
    /* Una mano apoyada adelante: en el vidrio, en la puerta, en la pared. */
    tocando:       { brazos: "M100 150 L74 168 L46 172 M100 150 L116 182 L120 210", manos: [[42, 172], [120, 212]] },
    /* Las dos manos adelante, empujando o sosteniendose. */
    empujando:     { brazos: "M100 150 L72 162 L44 160 M100 150 L74 180 L48 186", manos: [[40, 158], [44, 188]] },
    /* Tapandose la cara. */
    cubriendose:   { brazos: "M100 150 L78 132 L84 108 M100 150 L122 132 L116 108", manos: [[82, 104], [118, 104]] },
  };
  const PIERNAS = "M100 220 L92 290 L80 292 M100 220 L110 290 L122 292";

  function cuerpo(pose = "quieto") {
    const p = POSES[pose];
    if (!p) throw new Error(`Pose desconocida: "${pose}". Hay: ${Object.keys(POSES).join(", ")}`);
    return `<path d="${p.torso || "M100 136 L100 220"}" ${LIMB}/><path d="${p.brazos}" ${LIMB}/>
      ${p.manos.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${K}"/>`).join("")}
      <path d="${p.piernas || PIERNAS}" ${LIMB}/>`;
  }

  /* Devuelve un <g> listo para insertar en una escena. x, y = posición de los pies; escala 1 = 300 px de alto. */
  function dibujar({ pose = "quieto", expr = "normal", color = "frambuesa", mirar = "izquierda", x = 100, y = 292, escala = 1 } = {}) {
    const espejo = mirar === "derecha" ? "translate(200 0) scale(-1 1)" : "";
    const dy = (POSES[pose] || {}).cabeza || 0;
    const testa = dy ? `<g transform="translate(0 ${dy})">${cara(expr)}${gorro(color)}</g>` : `${cara(expr)}${gorro(color)}`;
    return `<g transform="translate(${x} ${y}) scale(${escala}) translate(-100 -292)"><g transform="${espejo}">${cuerpo(pose)}${testa}</g></g>`;
  }
  const svg = (o = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 20 200 280">${dibujar(o)}</svg>`;
  const busto = (o = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="24 24 156 136">${cara(o.expr)}${gorro(o.color)}</svg>`;

  const api = { dibujar, svg, busto, cara, gorro, cuerpo, POSES: Object.keys(POSES), EXPRESIONES: Object.keys(OJOS), COLORES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Personaje = api;
})(typeof window !== "undefined" ? window : globalThis);
