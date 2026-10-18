/* Props de la historia 001: estacion de servicio en la ruta, bajo ceniza volcanica.
   Mismo estilo que escenas/props/index.js: contorno #161618 de 4-5 px, colores planos,
   luz desde arriba a la izquierda. Cada prop se dibuja en su caja local. */
(function (root) {
  const base = typeof require !== "undefined" ? require("./index.js") : root.Props;
  const { O, K, poner, luz, cono, sombra } = base;
  let uid = 0;
  const id = p => `${p}${uid++}`;

  const CENIZA = { clara: "#9a9ca3", media: "#73767e", oscura: "#4e5159", polvo: "#b7b9bf" };

  /* Surtidor de combustible. Caja 180x340, apoya en y=340. */
  function surtidor({ color = "#c2452f", pantalla = false } = {}) {
    const g = id("su");
    return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>
      <rect x="18" y="300" width="144" height="40" rx="8" fill="#5b6472" ${O()}/>
      <rect x="26" y="40" width="128" height="268" rx="12" fill="${color}" ${O()}/>
      <rect x="44" y="64" width="92" height="72" rx="6" fill="${pantalla ? "#2e4a3a" : "#20242c"}" ${O(4)}/>
      ${pantalla ? `<path d="M56 90 L124 90 M56 110 L104 110" stroke="#7fc96b" stroke-width="6" stroke-linecap="round"/>` : ""}
      <rect x="44" y="156" width="92" height="22" rx="6" fill="#e8e2d4" ${O(4)}/>
      <rect x="44" y="190" width="92" height="22" rx="6" fill="#e8e2d4" opacity=".55" ${O(4)}/>
      <path d="M154 230 q34 10 30 48 L184 300" ${O(7)}/>
      <rect x="168" y="298" width="30" height="46" rx="8" fill="#2e333d" ${O(4)}/>
      <rect x="26" y="40" width="128" height="268" rx="12" fill="url(#${g})"/>`;
  }

  /* Mostrador de la tienda con caja registradora. Caja 520x220, apoya en y=220. */
  function mostrador({ color = "#6f7a6a", registradora = true } = {}) {
    return `<rect x="0" y="54" width="520" height="166" rx="8" fill="${color}" ${O()}/>
      <rect x="-12" y="34" width="544" height="30" rx="8" fill="#8d9a86" ${O()}/>
      <rect x="-12" y="52" width="544" height="10" fill="#000" opacity=".16"/>
      <path d="M40 80 L40 214 M480 80 L480 214" stroke="#000" stroke-width="3" opacity=".2"/>
      ${registradora ? `<rect x="330" y="-36" width="150" height="72" rx="8" fill="#3c424e" ${O()}/>
        <rect x="346" y="-24" width="78" height="34" rx="4" fill="#8fd0f0" opacity=".5" ${O(3)}/>
        <rect x="434" y="-20" width="34" height="26" rx="4" fill="#5b6472" ${O(3)}/>` : ""}
      <rect x="60" y="-18" width="90" height="18" rx="5" fill="#c2452f" ${O(4)}/>`;
  }

  /* Gondola de tienda: tres baldas con productos. Caja 440x340, apoya en y=340. */
  function gondola({ vacia = false, vacio = 0, semilla = 2 } = {}) {
    let r = semilla * 7919;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    const COL = ["#c87a6b", "#d9a13b", "#b9c6a6", "#8fa8d0", "#c2452f", "#e8e2d4"];
    let cosas = "";
    if (!vacia) {
      for (const y of [96, 196, 296]) {
        let x = 22;
        while (x < 400) {
          const w = 26 + rnd() * 20, h = 44 + rnd() * 26;
          /* vacio 0-1 controla cuantos huecos hay: la tienda se vacia dia a dia */
          if (rnd() > 0.82 - vacio * 0.72) { x += w + 10; continue; }
          cosas += `<rect x="${x.toFixed(0)}" y="${(y - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" rx="4" fill="${COL[Math.floor(rnd() * COL.length)]}" ${O(3)}/>`;
          x += w + 7;
        }
      }
    }
    return `<rect x="0" y="0" width="440" height="340" fill="#2f333c" opacity=".25"/>
      ${[100, 200, 300, 340].map(y => `<rect x="0" y="${y}" width="440" height="14" rx="3" fill="#9aa3ad" ${O(4)}/>`).join("")}
      <path d="M8 0 L8 340 M432 0 L432 340" ${O(6)}/>${cosas}`;
  }

  /* Refrigerador de bebidas con puerta de vidrio. Caja 300x470, apoya en y=470. */
  function refrigerador({ encendido = true, vacio = false } = {}) {
    const c = id("re");
    /* Sin corriente las botellas quedan en penumbra: con el color vivo parecia encendido. */
    const frio = encendido ? ["#5aa6d8", "#7fc96b"] : ["#2d4654", "#31493a"];
    const balda = encendido ? "#9aa3ad" : "#474c55";
    const botellas = vacio ? "" : [120, 230, 340].map((y, f) => {
      let s = "";
      for (let i = 0; i < 6; i++) {
        if ((i + f) % 5 === 3) continue;
        s += `<rect x="${34 + i * 40}" y="${y - 54}" width="26" height="54" rx="8" fill="${frio[f % 2]}" ${O(3)}/>`;
      }
      return s + `<rect x="24" y="${y}" width="252" height="8" fill="${balda}"/>`;
    }).join("");
    return `<defs><clipPath id="${c}"><rect x="16" y="24" width="268" height="406" rx="6"/></clipPath></defs>
      <rect x="0" y="0" width="300" height="470" rx="12" fill="#5b6472" ${O()}/>
      <rect x="16" y="24" width="268" height="406" rx="6" fill="${encendido ? "#1d3340" : "#15171d"}"/>
      <g clip-path="url(#${c})">${botellas}
        ${encendido ? `<rect x="16" y="24" width="268" height="30" fill="#cfe2f2" opacity=".5"/>` : ""}
        <path d="M30 24 L150 430" stroke="#fff" stroke-width="26" opacity=".07"/>
        <path d="M110 24 L230 430" stroke="#fff" stroke-width="14" opacity=".05"/></g>
      <rect x="16" y="24" width="268" height="406" rx="6" fill="none" ${O(4)}/>
      <rect x="252" y="190" width="14" height="90" rx="7" fill="#c9d4de" ${O(3)}/>`;
  }

  /* Puerta de vidrio de la tienda, con ceniza acumulandose afuera (0 a 1)
     y, si se pide, una silueta del otro lado. Caja 340x620, apoya en y=620. */
  function puertaVidrio({ ceniza = 0, silueta = false, luzAfuera = "#8a8d93" } = {}) {
    const c = id("pv"), g = id("pg");
    const h = 560 * Math.max(0, Math.min(1, ceniza));
    return `<defs><clipPath id="${c}"><rect x="22" y="26" width="296" height="560" rx="4"/></clipPath>
      <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${luzAfuera}"/><stop offset="1" stop-color="#5c5f67"/></linearGradient></defs>
      <rect x="0" y="0" width="340" height="620" rx="6" fill="#7e858f" ${O()}/>
      <rect x="22" y="26" width="296" height="560" rx="4" fill="url(#${g})"/>
      <g clip-path="url(#${c})">
        ${silueta ? `<ellipse cx="170" cy="250" rx="62" ry="68" fill="#2c2f36" opacity=".82"/>
          <path d="M108 586 Q170 330 232 586 Z" fill="#2c2f36" opacity=".82"/>` : ""}
        ${h > 0 ? `<path d="M22 ${586 - h} Q170 ${586 - h - 54} 318 ${586 - h * 0.78} L318 586 L22 586 Z" fill="${CENIZA.clara}"/>
          <path d="M22 ${586 - h} Q170 ${586 - h - 54} 318 ${586 - h * 0.78}" fill="none" stroke="${CENIZA.polvo}" stroke-width="5"/>` : ""}
        <path d="M40 26 L130 586" stroke="#fff" stroke-width="30" opacity=".08"/>
      </g>
      <rect x="22" y="26" width="296" height="560" rx="4" fill="none" ${O(4)}/>
      <path d="M170 26 L170 586" ${O(5)}/>
      <rect x="196" y="286" width="18" height="76" rx="9" fill="#c9d4de" ${O(4)}/>
      <rect x="126" y="286" width="18" height="76" rx="9" fill="#c9d4de" ${O(4)}/>`;
  }

  /* Monton de ceniza acumulada contra algo. Caja anchoxalto, apoya abajo. */
  function montonCeniza(ancho = 400, alto = 120, semilla = 1) {
    let r = semilla * 104729;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const x = (ancho * i) / 8;
      const y = alto - Math.sin((Math.PI * i) / 8) ** 0.7 * alto * (0.72 + rnd() * 0.28);
      pts.push(`${x.toFixed(0)} ${y.toFixed(0)}`);
    }
    return `<path d="M0 ${alto} L${pts.join(" L")} L${ancho} ${alto} Z" fill="${CENIZA.clara}" ${O(4)}/>
      <path d="M0 ${alto} L${pts.join(" L")}" fill="none" stroke="${CENIZA.polvo}" stroke-width="4" stroke-linejoin="round" opacity=".3"/>`;
  }

  /* Auto tapado de ceniza. Caja 540x250, apoya en y=250. */
  function autoCubierto({ color = "#4e5159" } = {}) {
    return `<path d="M40 180 L78 104 Q90 84 118 84 L400 84 Q428 86 442 108 L492 180 Z" fill="${color}" ${O()}/>
      <path d="M118 104 L250 104 L250 162 L96 162 Z" fill="#2f333c" opacity=".7"/>
      <path d="M270 104 L394 104 L420 162 L270 162 Z" fill="#2f333c" opacity=".7"/>
      <rect x="20" y="176" width="492" height="46" rx="14" fill="${color}" ${O()}/>
      <circle cx="130" cy="224" r="34" fill="#23262d" ${O()}/><circle cx="406" cy="224" r="34" fill="#23262d" ${O()}/>
      <path d="M30 176 Q110 128 180 142 Q260 72 330 96 Q420 76 500 176 Z" fill="${CENIZA.clara}"/>
      <path d="M30 176 Q110 128 180 142 Q260 72 330 96 Q420 76 500 176" fill="none" stroke="${CENIZA.polvo}" stroke-width="5" stroke-linejoin="round"/>
      ${poner(0, 196, 1, montonCeniza(540, 56, 4))}`;
  }

  /* Radio a pilas. Caja 200x120, apoya en y=120. */
  function radio({ encendida = false } = {}) {
    return `<rect x="0" y="20" width="200" height="100" rx="12" fill="#6b5f4e" ${O()}/>
      <rect x="14" y="36" width="96" height="68" rx="6" fill="#2e333d" ${O(4)}/>
      ${[0, 1, 2, 3, 4].map(i => `<path d="M${22 + i * 20} 44 L${22 + i * 20} 96" stroke="#555c68" stroke-width="5"/>`).join("")}
      <circle cx="150" cy="56" r="18" fill="#c9d4de" ${O(4)}/>
      <path d="M150 56 L160 46" ${O(3)}/>
      <rect x="126" y="86" width="52" height="14" rx="7" fill="#3c424e" ${O(3)}/>
      <circle cx="${186}" cy="${34}" r="7" fill="${encendida ? "#ff4d4d" : "#4a2222"}" ${O(3)}/>
      <path d="M182 20 L206 -40" ${O(5)}/>
      ${encendida ? poner(-60, -70, 1, luz(260, 90, 420, 300, "#ff9a6b", 0.22)) : ""}`;
  }

  /* Linterna con haz. Caja 150x60; el haz sale hacia la derecha. */
  function linterna({ encendida = true, largo = 760 } = {}) {
    return `${encendida ? `<g transform="translate(150 30) rotate(8)">${cono(0, -90, 54, 420, largo, "#fff3d6", 0.3, 34)}</g>` : ""}
      <rect x="0" y="12" width="104" height="38" rx="10" fill="#3c424e" ${O(4)}/>
      <path d="M104 6 L146 0 L146 62 L104 56 Z" fill="#9aa3ad" ${O(4)}/>
      ${encendida ? `<ellipse cx="146" cy="31" rx="9" ry="30" fill="#fff3d6"/>` : `<ellipse cx="146" cy="31" rx="9" ry="30" fill="#5b6472"/>`}`;
  }

  /* Techo de la estacion visto desde abajo, con vigas. Caja anchoxalto. */
  function techoChapa(ancho, alto, { pandeo = 0 } = {}) {
    const p = pandeo * alto * 0.5;
    let s = `<path d="M0 0 L${ancho} 0 L${ancho} ${alto} Q${ancho / 2} ${alto + p} 0 ${alto} Z" fill="#5c6068" ${O()}/>`;
    for (let i = 1; i < 7; i++) {
      const x = (ancho * i) / 7;
      s += `<path d="M${x} 0 L${x} ${alto + p * Math.sin((Math.PI * i) / 7)}" stroke="#3f434b" stroke-width="7"/>`;
    }
    s += `<path d="M0 ${alto * 0.55} Q${ancho / 2} ${alto * 0.55 + p} ${ancho} ${alto * 0.55}" fill="none" ${O(8)}/>`;
    if (pandeo > 0.25)
      s += `<path d="M${ancho * 0.42} ${alto * 0.2} L${ancho * 0.46} ${alto * 0.75} M${ancho * 0.56} ${alto * 0.3} L${ancho * 0.52} ${alto * 0.8}"
             stroke="#1b1d22" stroke-width="5" stroke-linecap="round"/>`;
    return s;
  }

  /* Cartel de la estacion sobre un poste. Caja 300x420, apoya en y=420. */
  function cartelEstacion({ texto = "RUTA 7", encendido = false } = {}) {
    return `<path d="M142 150 L158 420" ${O(10)}/>
      <rect x="0" y="0" width="300" height="150" rx="14" fill="${encendido ? "#c2452f" : "#6e4a42"}" ${O()}/>
      <rect x="16" y="16" width="268" height="118" rx="8" fill="${encendido ? "#e8e2d4" : "#9a958c"}" ${O(4)}/>
      <text x="150" y="98" font-family="Arial Black, Arial, sans-serif" font-size="58" fill="#2c2f36" text-anchor="middle">${texto}</text>
      ${encendido ? poner(-110, -110, 1, luz(260, 180, 760, 560, "#ffb27a", 0.2)) : ""}`;
  }

  /* Cono vial. Caja 110x130, apoya en y=130. */
  const conoVial = () => `<path d="M48 10 L62 10 L92 112 L18 112 Z" fill="#d9622b" ${O(4)}/>
      <path d="M36 60 L74 60 L80 80 L30 80 Z" fill="#e8e2d4"/>
      <rect x="4" y="108" width="102" height="22" rx="8" fill="#d9622b" ${O(4)}/>`;

  /* Escoba apoyada. Caja 90x330, apoya en y=330. */
  const escoba = () => `<path d="M58 0 L36 282" ${O(8)}/>
      <path d="M14 282 L62 282 L72 330 L4 330 Z" fill="#b8905c" ${O(4)}/>
      ${[0, 1, 2, 3].map(i => `<path d="M${18 + i * 15} 290 L${12 + i * 17} 328" stroke="#7a6038" stroke-width="4"/>`).join("")}`;

  /* Ceniza cayendo: capa de puntos. Mas lenta y mas gruesa que la lluvia. */
  function cenizaCayendo(w, h, n = 150, op = 0.5) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = (i * 149.7) % w, y = (i * 263.1) % h, r = 1.8 + (i % 5) * 1.5;
      s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="${CENIZA.polvo}" opacity="${(op * (0.35 + (i % 6) / 9)).toFixed(2)}"/>`;
    }
    return s;
  }

  /* Niebla de ceniza: baja el contraste del fondo como lo hace el aire sucio. */
  function neblina(w, h, fuerza = 0.35, color = "#9a9ca3") {
    const g = id("nb");
    return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${color}" stop-opacity="${fuerza}"/>
      <stop offset=".55" stop-color="${color}" stop-opacity="${fuerza * 0.5}"/>
      <stop offset="1" stop-color="${color}" stop-opacity="${fuerza * 0.9}"/></linearGradient></defs>
      <rect width="${w}" height="${h}" fill="url(#${g})"/>`;
  }

  /* Marca de dedos / rayas en el vidrio sucio. Caja anchoxalto. */
  const rayasVidrio = (ancho, alto) =>
    `<path d="M${ancho * 0.2} ${alto * 0.3} Q${ancho * 0.3} ${alto * 0.55} ${ancho * 0.24} ${alto * 0.8}
       M${ancho * 0.34} ${alto * 0.28} Q${ancho * 0.44} ${alto * 0.55} ${ancho * 0.38} ${alto * 0.82}
       M${ancho * 0.48} ${alto * 0.32} Q${ancho * 0.58} ${alto * 0.56} ${ancho * 0.52} ${alto * 0.78}"
       fill="none" stroke="#d6d8dd" stroke-width="14" stroke-linecap="round" opacity=".5"/>`;

  const api = { CENIZA, surtidor, mostrador, gondola, refrigerador, puertaVidrio, montonCeniza,
    autoCubierto, radio, linterna, techoChapa, cartelEstacion, conoVial, escoba,
    cenizaCayendo, neblina, rayasVidrio };
  const CAJA = { surtidor: 340, mostrador: 220, gondola: 340, refrigerador: 470, puertaVidrio: 620,
    autoCubierto: 250, radio: 120, linterna: 60, cartelEstacion: 420, conoVial: 130, escoba: 330 };
  api.CAJA = CAJA;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PropsEstacion = api;
})(typeof window !== "undefined" ? window : globalThis);
