/* Biblioteca de props reutilizables. Mismo estilo que el personaje:
   contorno negro #161618 de 4-5 px, uniones redondeadas, colores planos con degradados suaves,
   luz desde arriba a la izquierda. Cada prop se dibuja en su caja local y se coloca con poner().
   Node y navegador. */
(function (root) {
  const K = "#161618";
  const O = (w = 5) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  let uid = 0;
  const id = p => `${p}${uid++}`;

  /* Coloca un prop: x,y es la esquina superior izquierda de su caja local. */
  const poner = (x, y, s, contenido) => `<g transform="translate(${x} ${y}) scale(${s})">${contenido}</g>`;

  /* ---------- texturas y luz de ambiente ---------- */

  /* Vineta: oscurece los bordes del cuadro. */
  function vineta(w, h, fuerza = 0.55) {
    const g = id("vi");
    return `<defs><radialGradient id="${g}" cx="50%" cy="45%" r="75%">
      <stop offset=".45" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="${fuerza}"/></radialGradient></defs>
      <rect width="${w}" height="${h}" fill="url(#${g})"/>`;
  }

  /* Grano suave: ruido fractal muy tenue para que no se vea plano. */
  function grano(w, h, op = 0.06) {
    const g = id("gr");
    return `<defs><filter id="${g}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>
      <feColorMatrix type="saturate" values="0"/></filter></defs>
      <rect width="${w}" height="${h}" filter="url(#${g})" opacity="${op}"/>`;
  }

  /* Halo de luz. El degradado llega a cero justo en el borde de la elipse para que no
     aparezca el canto del circulo, y se compone en modo screen: suma luz en vez de pintar gris. */
  function luz(x, y, w, h, color = "#f2c27a", op = 0.3) {
    const g = id("lz");
    return `<defs><radialGradient id="${g}" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${color}" stop-opacity="${op}"/>
      <stop offset=".42" stop-color="${color}" stop-opacity="${(op * 0.45).toFixed(3)}"/>
      <stop offset=".75" stop-color="${color}" stop-opacity="${(op * 0.12).toFixed(3)}"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" fill="url(#${g})" style="mix-blend-mode:screen"/>`;
  }

  /* Cono de luz dirigido (lampara, linterna, rendija de puerta). De (x,y) hacia abajo.
     Va desenfocado: un cono de bordes duros se lee como carton, no como luz. */
  function cono(x, y, anchoArriba, anchoAbajo, alto, color = "#f2c27a", op = 0.26, desenfoque = 26) {
    const g = id("co"), f = id("cf");
    return `<defs>
        <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${color}" stop-opacity="${op}"/>
          <stop offset=".5" stop-color="${color}" stop-opacity="${(op * 0.42).toFixed(3)}"/>
          <stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient>
        <filter id="${f}" x="-40%" y="-20%" width="180%" height="150%">
          <feGaussianBlur stdDeviation="${desenfoque}"/></filter>
      </defs>
      <g style="mix-blend-mode:screen" filter="url(#${f})">
        <path d="M${x - anchoArriba / 2} ${y} L${x + anchoArriba / 2} ${y} L${x + anchoAbajo / 2} ${y + alto} L${x - anchoAbajo / 2} ${y + alto} Z"
          fill="url(#${g})"/></g>`;
  }

  /* Sombra elipsoidal en el piso, para apoyar objetos y al personaje. */
  const sombra = (x, y, rx, ry = rx * 0.22, op = 0.3) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#000" opacity="${op}"/>`;

  /* Capa de aire que va ENCIMA del personaje: polvo, lluvia, grano y vineta.
     Siempre se dibuja al final para que nada quede "pegado" sobre el grano. */
  function atmosfera(w, h, { polvo: nPolvo = 0.6, lluvia: nLluvia = 0, grano: g = 0.055, vineta: v = 0.6 } = {}) {
    const vert = h > w;
    return `${nPolvo ? polvo(w, h, Math.round((vert ? 34 : 44) * nPolvo), 0.18) : ""}
      ${nLluvia ? lluvia(w, h, Math.round(80 * nLluvia), 0.14) : ""}
      ${g ? grano(w, h, g) : ""}
      ${v ? vineta(w, h, v) : ""}`;
  }

  /* Lluvia: lineas diagonales. La capa se mueve en ffmpeg. */
  function lluvia(w, h, n = 90, op = 0.18) {
    let d = "";
    for (let i = 0; i < n; i++) {
      const x = (i * 97.3) % w, y = (i * 231.7) % h, l = 30 + (i % 5) * 14;
      d += `M${x.toFixed(0)} ${y.toFixed(0)} l${(l * 0.3).toFixed(0)} ${l} `;
    }
    return `<path d="${d}" stroke="#cfe2f2" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="${op}"/>`;
  }

  /* Polvo flotando: puntitos claros. */
  function polvo(w, h, n = 40, op = 0.25) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = (i * 173.1) % w, y = (i * 311.9) % h, r = 1.5 + (i % 4) * 1.1;
      s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#fff" opacity="${(op * (0.4 + (i % 5) / 7)).toFixed(2)}"/>`;
    }
    return s;
  }

  /* ---------- fondo de ciudad ---------- */

  /* Skyline: edificios con ventanas encendidas. Caja: anchoxalto. Determinista. */
  function skyline(ancho, alto, semilla = 1, encendidas = 0.3) {
    let r = semilla * 9301 + 49297;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    let s = "", x = -20;
    while (x < ancho + 20) {
      const w = 50 + rnd() * 90, hh = alto * (0.3 + rnd() * 0.65), y = alto - hh;
      s += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${(hh + 10).toFixed(0)}" fill="#141c33"/>`;
      const cols = Math.max(1, Math.floor(w / 26)), filas = Math.max(1, Math.floor(hh / 30));
      for (let c = 0; c < cols; c++) for (let f = 0; f < filas; f++) {
        if (rnd() > encendidas) continue;
        const vx = x + 10 + c * 26, vy = y + 14 + f * 30;
        if (vx + 12 > x + w - 4) continue;
        s += `<rect x="${vx.toFixed(0)}" y="${vy.toFixed(0)}" width="12" height="16" fill="${rnd() > .3 ? "#f2c27a" : "#8fd0f0"}" opacity="${(0.5 + rnd() * 0.5).toFixed(2)}"/>`;
      }
      x += w + 6 + rnd() * 16;
    }
    return s;
  }

  /* ---------- props ---------- */

  /* Ventana con la ciudad detras. Caja: 360x440 (marco incluido). */
  function ventanaCiudad({ semilla = 1, encendidas = 0.3, luna = true, persiana = false } = {}) {
    const c = id("vn"), g = id("vg");
    return `<defs><clipPath id="${c}"><rect x="18" y="18" width="324" height="404" rx="6"/></clipPath>
      <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#101a36"/><stop offset="1" stop-color="#2b3e70"/></linearGradient></defs>
      <rect x="0" y="0" width="360" height="440" rx="10" fill="#4a5168" ${O()}/>
      <rect x="18" y="18" width="324" height="404" rx="6" fill="url(#${g})"/>
      <g clip-path="url(#${c})">
        ${luna ? `<circle cx="252" cy="92" r="30" fill="#f4f1e4" opacity=".92"/><circle cx="262" cy="84" r="30" fill="#1a2444" opacity=".55"/>` : ""}
        ${poner(18, 150, 1, skyline(324, 272, semilla, encendidas))}
        ${persiana ? Array.from({ length: 14 }, (_, i) => `<rect x="18" y="${20 + i * 29}" width="324" height="12" fill="#1d2335" opacity=".55"/>`).join("") : ""}
        <rect x="18" y="18" width="150" height="404" fill="#8fd0f0" opacity=".05"/>
      </g>
      <rect x="18" y="18" width="324" height="404" rx="6" fill="none" ${O(4)}/>
      <path d="M180 18 L180 422 M18 220 L342 220" ${O(5)}/>`;
  }

  /* Sofa de tres cuerpos. Caja: 520x240. */
  function sofa({ color = "#7a5f52", oscuro = "#4e3b32" } = {}) {
    const g = id("so");
    return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>
      <rect x="14" y="40" width="492" height="120" rx="24" fill="${color}" ${O()}/>
      <rect x="0" y="120" width="520" height="86" rx="20" fill="${color}" ${O()}/>
      <rect x="40" y="128" width="200" height="60" rx="14" fill="${oscuro}" opacity=".5"/>
      <rect x="276" y="128" width="200" height="60" rx="14" fill="${oscuro}" opacity=".5"/>
      <rect x="0" y="104" width="62" height="102" rx="20" fill="${color}" ${O()}/>
      <rect x="458" y="104" width="62" height="102" rx="20" fill="${color}" ${O()}/>
      <path d="M60 206 L60 232 M460 206 L460 232" ${O(7)}/>
      <rect x="0" y="40" width="520" height="166" rx="24" fill="url(#${g})"/>`;
  }

  /* Lampara de pie. Caja 200x490: la base apoya en y=490. prendida = cono hacia el piso. */
  function lampara({ prendida = true, alto = 490 } = {}) {
    const g = id("la");
    const vastago = alto - 50;
    return `${prendida ? cono(100, 120, 170, 620, alto + 40, "#ffcf87", .26, 30) : ""}
      ${prendida ? luz(100, 90, 520, 380, "#f2c27a", .34) : ""}
      <defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>
      <path d="M97 112 L103 ${vastago}" ${O(7)}/>
      <ellipse cx="100" cy="${alto - 20}" rx="62" ry="18" fill="#3b3f52" ${O()}/>
      <path d="M34 36 L166 36 L196 118 L4 118 Z" fill="${prendida ? "#f2c27a" : "#b8a98f"}" ${O()}/>
      <path d="M34 36 L166 36 L196 118 L4 118 Z" fill="url(#${g})"/>
      ${prendida ? `<ellipse cx="100" cy="118" rx="94" ry="13" fill="#fff5dc" opacity=".85"/>` : ""}`;
  }

  /* Puerta cerrada, con mirilla opcional. Caja: 300x640. */
  function puerta({ color = "#6b4a36", mirilla = true, cerrojo = true } = {}) {
    const g = id("pu");
    return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>
      <rect x="-14" y="-14" width="328" height="654" fill="#3c3022" ${O()}/>
      <rect x="0" y="0" width="300" height="640" fill="${color}" ${O()}/>
      <rect x="28" y="36" width="244" height="220" rx="6" fill="none" ${O(4)}/>
      <rect x="28" y="296" width="244" height="300" rx="6" fill="none" ${O(4)}/>
      <circle cx="252" cy="340" r="15" fill="#d8c07a" ${O(4)}/>
      ${cerrojo ? `<rect x="222" y="246" width="56" height="22" rx="8" fill="#9aa3ad" ${O(4)}/>` : ""}
      ${mirilla ? `<circle cx="150" cy="150" r="13" fill="#2b2b2f" ${O(4)}/><circle cx="146" cy="146" r="4" fill="#c9d4de" opacity=".7"/>` : ""}
      <rect x="0" y="0" width="300" height="640" fill="url(#${g})"/>`;
  }

  /* Vista por la mirilla: circulo con ojo de pez. contenido = SVG ya escalado dentro del circulo.
     Caja: 2R x 2R (el centro queda en R,R). */
  function mirilla(R, contenido) {
    const c = id("mi"), g = id("mg");
    return `<defs><clipPath id="${c}"><circle cx="${R}" cy="${R}" r="${R - 8}"/></clipPath>
      <radialGradient id="${g}" cx="50%" cy="50%" r="50%">
        <stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient></defs>
      <circle cx="${R}" cy="${R}" r="${R}" fill="#0d0e12"/>
      <g clip-path="url(#${c})">${contenido}<circle cx="${R}" cy="${R}" r="${R - 8}" fill="url(#${g})"/></g>
      <circle cx="${R}" cy="${R}" r="${R - 8}" fill="none" stroke="${K}" stroke-width="10"/>
      <circle cx="${R}" cy="${R}" r="${R - 2}" fill="none" stroke="#3a3f4d" stroke-width="6"/>`;
  }

  /* Estante de tres niveles con cosas encima. Caja: 420x420. */
  function estante({ color = "#8a6a4e", lleno = true } = {}) {
    const tabla = y => `<rect x="0" y="${y}" width="420" height="18" rx="4" fill="${color}" ${O(4)}/>`;
    const cosas = lleno
      ? `${poner(30, 50, .8, latas(3))}${poner(250, 46, .9, bidon())}
         <rect x="150" y="60" width="26" height="76" rx="3" fill="#b9c6a6" ${O(4)}/>
         <rect x="182" y="52" width="26" height="84" rx="3" fill="#c87a6b" ${O(4)}/>
         ${poner(40, 220, .7, latas(4))}
         <rect x="250" y="222" width="120" height="78" rx="6" fill="#c2a06a" ${O(4)}/>
         <path d="M250 250 L370 250" ${O(3)}/>`
      : "";
    return `<rect x="-10" y="-10" width="440" height="430" fill="#241f1a" opacity=".35"/>
      ${tabla(140)}${tabla(302)}${tabla(402)}
      <path d="M6 0 L6 420 M414 0 L414 420" ${O(6)}/>${cosas}`;
  }

  /* Bidon de agua con nivel variable (0 a 1). Caja: 120x170. */
  function bidon({ nivel = 0.7 } = {}) {
    const c = id("bi");
    const h = 112 * nivel;
    return `<defs><clipPath id="${c}"><rect x="10" y="40" width="100" height="112" rx="12"/></clipPath></defs>
      <rect x="10" y="40" width="100" height="112" rx="12" fill="#cfe2f2" opacity=".5" ${O(4)}/>
      <g clip-path="url(#${c})"><rect x="10" y="${152 - h}" width="100" height="${h}" fill="#5aa6d8" opacity=".85"/>
        <rect x="10" y="${152 - h}" width="100" height="6" fill="#8fd0f0"/></g>
      <rect x="10" y="40" width="100" height="112" rx="12" fill="none" ${O(4)}/>
      <rect x="44" y="16" width="32" height="28" rx="4" fill="#9aa3ad" ${O(4)}/>
      <rect x="36" y="6" width="48" height="16" rx="6" fill="#5b6472" ${O(4)}/>
      <path d="M22 56 L22 140" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".45"/>`;
  }

  /* Pila de latas de conserva. Caja: ~ (n*46)x80. */
  function latas(n = 3, color = "#c87a6b") {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = i * 46, y = (i % 2) * 4;
      s += `<rect x="${x}" y="${20 + y}" width="40" height="58" rx="5" fill="${color}" ${O(4)}/>
        <ellipse cx="${x + 20}" cy="${22 + y}" rx="20" ry="7" fill="#d9d2c4" ${O(4)}/>
        <rect x="${x}" y="${38 + y}" width="40" height="18" fill="#f2ebdf" opacity=".85"/>
        <path d="M${x + 6} ${26 + y} L${x + 6} ${72 + y}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".3"/>`;
    }
    return s;
  }

  /* Camara de seguridad en la pared. Caja: 190x120. led rojo. */
  function camaraSeguridad({ led = true, mirar = "izquierda" } = {}) {
    const esp = mirar === "derecha" ? `transform="translate(190 0) scale(-1 1)"` : "";
    return `<g ${esp}><rect x="150" y="10" width="34" height="30" rx="6" fill="#6b7280" ${O(4)}/>
      <path d="M150 26 L116 40" ${O(7)}/>
      <path d="M26 20 L116 36 L104 92 L14 72 Z" fill="#9aa3ad" ${O()}/>
      <ellipse cx="22" cy="46" rx="14" ry="26" fill="#2b2b2f" ${O(4)}/>
      <circle cx="20" cy="40" r="5" fill="#c9d4de" opacity=".6"/>
      ${led ? `<circle cx="96" cy="52" r="7" fill="#ff4d4d" ${O(3)}/><circle cx="96" cy="52" r="16" fill="#ff4d4d" opacity=".25"/>` : `<circle cx="96" cy="52" r="7" fill="#5b2222" ${O(3)}/>`}</g>`;
  }

  /* Mesa de centro baja. Caja 380x150: las patas llegan a y=150. */
  function mesa({ color = "#6b4a36", oscuro = "#4a3122" } = {}) {
    return `<path d="M58 44 L62 142 M322 44 L318 142" ${O(10)}/>
      <path d="M62 112 L318 112" ${O(6)}/>
      <rect x="0" y="22" width="380" height="26" rx="9" fill="${color}" ${O()}/>
      <rect x="0" y="40" width="380" height="8" rx="4" fill="${oscuro}" opacity=".6"/>
      <rect x="18" y="27" width="150" height="7" rx="3" fill="#fff" opacity=".18"/>`;
  }

  /* Cuadro colgado. Caja: anchoxalto. */
  function cuadro(ancho = 200, alto = 150, { marco = "#8a6a4e", tela = "#3a4a6b" } = {}) {
    return `<rect x="0" y="0" width="${ancho}" height="${alto}" rx="4" fill="${marco}" ${O()}/>
      <rect x="14" y="14" width="${ancho - 28}" height="${alto - 28}" fill="${tela}" ${O(4)}/>
      <path d="M14 ${alto - 44} L${ancho * 0.35} ${alto * 0.45} L${ancho * 0.55} ${alto - 44} Z" fill="#20304d"/>
      <circle cx="${ancho * 0.72}" cy="${alto * 0.36}" r="${alto * 0.09}" fill="#e8d9a8" opacity=".7"/>
      <rect x="14" y="14" width="${ancho - 28}" height="${alto - 28}" fill="#fff" opacity=".06"/>`;
  }

  /* Alfombra en perspectiva. Caja: anchoxalto, apoyada en el piso. */
  function alfombra(ancho = 620, alto = 150, color = "#5b3b4a") {
    return `<path d="M${ancho * 0.12} 0 L${ancho * 0.88} 0 L${ancho} ${alto} L0 ${alto} Z" fill="${color}" ${O()}/>
      <path d="M${ancho * 0.18} ${alto * 0.28} L${ancho * 0.82} ${alto * 0.28} L${ancho * 0.88} ${alto * 0.76} L${ancho * 0.12} ${alto * 0.76} Z"
        fill="none" stroke="#d9a13b" stroke-width="5" opacity=".45"/>`;
  }

  /* Planta en maceta. Caja: 180x260, apoya en y=260. */
  function planta() {
    const hoja = (rx, ry, rot) => `<ellipse cx="90" cy="110" rx="${rx}" ry="${ry}" fill="#3f6b4a" ${O(4)} transform="rotate(${rot} 90 150)"/>`;
    return `${hoja(26, 66, -38)}${hoja(26, 72, -12)}${hoja(26, 66, 16)}${hoja(22, 56, 44)}
      <path d="M58 200 L122 200 L112 258 L68 258 Z" fill="#a06a4e" ${O()}/>
      <rect x="52" y="188" width="76" height="20" rx="6" fill="#b87a5a" ${O(4)}/>`;
  }

  /* Celular que brilla en la oscuridad. Caja: 70x130. */
  function celular({ prendido = true, color = "#8fd0f0" } = {}) {
    return `${prendido ? poner(-115, -100, 1, luz(150, 60, 420, 380, color, .4)) : ""}
      <rect x="0" y="0" width="70" height="130" rx="10" fill="#22252e" ${O(4)}/>
      <rect x="6" y="10" width="58" height="108" rx="5" fill="${prendido ? color : "#11131a"}"/>
      ${prendido ? `<rect x="14" y="30" width="42" height="7" rx="3" fill="#fff" opacity=".7"/>
        <rect x="14" y="46" width="30" height="7" rx="3" fill="#fff" opacity=".55"/>
        <rect x="14" y="62" width="38" height="7" rx="3" fill="#fff" opacity=".45"/>` : ""}`;
  }

  /* Vela encendida. Caja: 70x150. */
  function vela({ prendida = true } = {}) {
    return `${prendida ? poner(-165, -170, 1, luz(200, 190, 560, 520, "#f2c27a", .4)) : ""}
      <rect x="18" y="46" width="34" height="96" rx="6" fill="#f2ebdf" ${O(4)}/>
      <path d="M35 46 L35 34" ${O(3)}/>
      ${prendida ? `<path d="M35 34 q13 -14 0 -32 q-13 18 0 32z" fill="#f2c27a" ${O(3)}/>
        <path d="M35 24 q6 -7 0 -16 q-6 9 0 16z" fill="#fff5dc"/>` : ""}`;
  }

  /* Caja de carton. Caja: 180x140. */
  function caja({ abierta = false } = {}) {
    return `<rect x="0" y="30" width="180" height="110" rx="5" fill="#b8905c" ${O()}/>
      <path d="M0 30 L90 0 L180 30 L90 56 Z" fill="${abierta ? "#8a6a3e" : "#c9a16b"}" ${O(4)}/>
      <path d="M90 56 L90 140" ${O(3)}/>`;
  }

  /* Reja o portón metálico. Caja: anchoxalto. */
  function reja(ancho, alto) {
    let s = `<rect x="0" y="0" width="${ancho}" height="${alto}" fill="#1a1d26" opacity=".5"/>`;
    for (let x = 0; x <= ancho; x += 54) s += `<path d="M${x} 0 L${x} ${alto}" ${O(7)}/>`;
    s += `<path d="M0 10 L${ancho} 10 M0 ${alto - 10} L${ancho} ${alto - 10}" ${O(9)}/>`;
    return s;
  }

  /* Letrero de pared con texto. Caja: anchox70. */
  const letrero = (ancho, texto, color = "#b9c6a6") =>
    `<rect x="0" y="0" width="${ancho}" height="70" rx="8" fill="${color}" ${O(4)}/>
     <text x="${ancho / 2}" y="48" font-family="Arial Black, Arial, sans-serif" font-size="38" fill="${K}" text-anchor="middle">${texto}</text>`;

  /* Alto de la caja de cada prop: sirve para apoyarlos exactamente en la linea del piso. */
  const CAJA = { ventanaCiudad: 440, sofa: 232, lampara: 490, puerta: 640, estante: 420,
    bidon: 170, latas: 80, camaraSeguridad: 120, mesa: 150, celular: 130, vela: 150,
    caja: 140, cuadro: 150, alfombra: 150, planta: 260 };

  /* Apoya un prop en el piso: x es su borde izquierdo, yPiso donde toca el suelo. */
  const enPiso = (x, yPiso, s, nombre, contenido) =>
    poner(x, yPiso - CAJA[nombre] * s, s, contenido);

  const api = { poner, enPiso, CAJA, cono, atmosfera, O, K, vineta, grano, luz, sombra, lluvia, polvo, skyline,
    ventanaCiudad, sofa, lampara, puerta, mirilla, estante, bidon, latas,
    camaraSeguridad, mesa, celular, vela, caja, reja, letrero, cuadro, alfombra, planta };
  /* Los props especificos de una historia viven en su propio archivo y se suman aqui,
     para que las escenas tengan un solo lugar de donde pedirlos. */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
    const extra = require("./estacion.js");
    Object.assign(api.CAJA, extra.CAJA);
    for (const [k, v] of Object.entries(extra)) if (k !== "CAJA") api[k] = v;
  } else root.Props = api;
})(typeof window !== "undefined" ? window : globalThis);
