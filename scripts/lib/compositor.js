/* Compone cada plano en SVG: la escena (fondo + personaje) y, aparte, la capa de HUD y tarjeta.
   Se separan porque la escena recibe el movimiento de camara en ffmpeg y el HUD debe quedar quieto. */
const Personaje = require("../../personajes/personaje.js");
const { fondo } = require("../../escenas");
const P = require("../../escenas/props");

const K = "#161618";
const CREMA = "#f2ebdf";
const FUENTE = "Arial Black, Arial, Helvetica, sans-serif";
const xml = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* El PNG de la escena se renderiza mas grande que la salida para que el zoom no pixele. */
const FORMATOS = {
  "16x9": { w: 1920, h: 1080, margen: 1.34 },
  "9x16": { w: 1080, h: 1920, margen: 1.34 },
};

/* ---------- escena ---------- */

function svgEscena(plano, fmt) {
  const F = FORMATOS[fmt];
  const esc = fondo(plano.escena);
  const dib = esc.dibujar({ w: F.w, h: F.h, ...(plano.escenaOpts || {}) });

  let pj = "";
  if (plano.personaje) {
    const ancla = (esc.anclas && esc.anclas[fmt]) || { x: F.w / 2, y: F.h * 0.88, escala: 1.2 };
    const prop = fmt === "9x16" && plano.personaje.v ? { ...plano.personaje, ...plano.personaje.v } : plano.personaje;
    const x = prop.x ?? ancla.x, y = prop.y ?? ancla.y, escala = prop.escala ?? ancla.escala;
    /* El guion da coordenadas del formato horizontal: en vertical se reubica con el ancla. */
    const X = fmt === "9x16" && prop.x === plano.personaje.x && !plano.personaje.v
      ? ancla.x + (plano.personaje.x - FORMATOS["16x9"].w / 2) * 0.42 : x;
    const Y = fmt === "9x16" && !plano.personaje.v ? ancla.y : y;
    const E = fmt === "9x16" && !plano.personaje.v ? ancla.escala : escala;
    pj = P.sombra(X, Y + 4, 112 * E, 22 * E, 0.34) + Personaje.dibujar({ ...prop, x: X, y: Y, escala: E });
  }

  /* Props sueltos que pide el plano. Se posicionan en relativo (rx, ry de 0 a 1) para que
     la misma linea del guion sirva en 16:9 y en 9:16; "v" permite corregir uno a mano. */
  const props = (lista = []) => lista.map(it => {
    const o = fmt === "9x16" && it.v ? { ...it, ...it.v } : it;
    const dibujo = P[o.nombre];
    if (typeof dibujo !== "function") throw new Error(`Prop desconocido: "${o.nombre}"`);
    const esc = o.escala ?? 1;
    const x = o.x ?? (o.rx ?? 0.5) * F.w;
    const y = o.y ?? (o.ry ?? 0.8) * F.h;
    const cuerpo = dibujo(...(Array.isArray(o.args) ? o.args : [o.opts || {}]));
    const g = o.piso === false || P.CAJA[o.nombre] == null
      ? P.poner(x, y, esc, cuerpo)
      : P.enPiso(x, y, esc, o.nombre, cuerpo);
    const espejo = o.mirar === "derecha" ? `<g transform="translate(${2 * x} 0) scale(-1 1)">${g}</g>` : g;
    return (o.sombra ? P.sombra(x + (P.CAJA[o.nombre] || 100) * esc * 0.3, y, 90 * esc, 18 * esc, 0.3) : "") + espejo;
  }).join("");

  /* Orden: fondo, props de atras, personaje, props de adelante, y recien ahi el aire
     (grano y vineta), para que nada quede pegado encima del grano. */
  const opts = plano.escenaOpts || {};
  const delante = esc.delante ? esc.delante({ w: F.w, h: F.h, ...opts }) : "";
  const atras = props((plano.props || []).filter(p => !p.delante));
  const encima = props((plano.props || []).filter(p => p.delante));
  const aire = P.atmosfera(F.w, F.h, { ...(esc.aire || {}), ...(opts.aire || {}) });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${F.w}" height="${F.h}" viewBox="0 0 ${F.w} ${F.h}">${dib}${atras}${pj}${encima}${delante}${aire}</svg>`;
}

/* ---------- HUD ---------- */

const RECURSOS = [
  { clave: "agua", etiqueta: "AGUA", color: "#5aa6d8" },
  { clave: "comida", etiqueta: "COMIDA", color: "#d9a13b" },
  { clave: "bateria", etiqueta: "BATERÍA", color: "#7fc96b" },
];

function hudSvg(hud, fmt, barras = {}) {
  const F = FORMATOS[fmt];
  const vert = fmt === "9x16";
  const esc = vert ? 1.16 : 1;
  const W = 430 * esc;
  const filas = RECURSOS.filter(r => hud[r.clave] != null);
  const FILA = 66 * esc;
  const alto = 92 * esc + filas.length * FILA + 10 * esc;
  const x = vert ? Math.round((F.w - W) / 2) : 54;
  const y = vert ? 64 : 52;

  const dia = hud.dia != null
    ? `<text x="${26 * esc}" y="${60 * esc}" font-family="${FUENTE}" font-size="${48 * esc}" fill="${CREMA}" letter-spacing="2">DÍA ${hud.dia}</text>
       <text x="${W - 26 * esc}" y="${60 * esc}" font-family="${FUENTE}" font-size="${28 * esc}" fill="#9aa3ad" text-anchor="end">/ ${hud.total || 30}</text>`
    : "";

  /* Etiqueta y valor en la misma linea, y la barra debajo a todo el ancho:
     asi un valor largo ("25 días") nunca se encima con la barra. */
  const cuerpo = filas.map((r, i) => {
    const fy = 92 * esc + i * FILA;
    const pct = Math.max(0, Math.min(1, barras[r.clave] ?? 1));
    const bw = W - 52 * esc;
    return `<text x="${26 * esc}" y="${fy + 20 * esc}" font-family="${FUENTE}" font-size="${21 * esc}" fill="#9aa3ad" letter-spacing="1.5">${r.etiqueta}</text>
      <text x="${W - 26 * esc}" y="${fy + 21 * esc}" font-family="${FUENTE}" font-size="${24 * esc}" fill="${CREMA}" text-anchor="end">${xml(hud[r.clave])}</text>
      <rect x="${26 * esc}" y="${fy + 32 * esc}" width="${bw}" height="${13 * esc}" rx="${6.5 * esc}" fill="#000" opacity=".5"/>
      <rect x="${26 * esc}" y="${fy + 32 * esc}" width="${(bw * pct).toFixed(1)}" height="${13 * esc}" rx="${6.5 * esc}" fill="${r.color}"/>`;
  }).join("");

  const svg = `<rect x="0" y="0" width="${W}" height="${alto}" rx="${20 * esc}" fill="#10131c" opacity=".8"/>
    <rect x="0" y="0" width="${W}" height="${alto}" rx="${20 * esc}" fill="none" stroke="${K}" stroke-width="4"/>
    <rect x="2" y="2" width="${W - 4}" height="${alto - 4}" rx="${18 * esc}" fill="none" stroke="#3b4a66" stroke-width="2" opacity=".6"/>
    ${dia}${cuerpo}`;
  /* Solo ocupa su panel: la caja le ahorra a ffmpeg componer 1920x1080 por cuadro. */
  return { svg, caja: { x: Math.round(x), y: Math.round(y), w: Math.ceil(W), h: Math.ceil(alto) } };
}

/* ---------- tarjeta de dato real ---------- */

function partirTexto(txt, max) {
  const palabras = txt.split(/\s+/);
  const lineas = [];
  let l = "";
  for (const p of palabras) {
    if ((l + " " + p).trim().length > max) { lineas.push(l.trim()); l = p; }
    else l = (l + " " + p).trim();
  }
  if (l) lineas.push(l);
  return lineas;
}

function tarjetaSvg(t, fmt) {
  const F = FORMATOS[fmt];
  const vert = fmt === "9x16";
  const W = vert ? F.w * 0.86 : F.w * 0.58;
  const esc = vert ? 1.05 : 1;
  const maxCar = vert ? 26 : 30;
  const lineas = partirTexto(t.texto, maxCar);
  const lh = 52 * esc;
  const alto = 150 * esc + lineas.length * lh + 56 * esc;
  const x = (F.w - W) / 2, y = (F.h - alto) / 2 - (vert ? F.h * 0.06 : 0);

  const cuerpo = lineas.map((l, i) =>
    `<text x="${W / 2}" y="${(140 * esc) + i * lh}" font-family="${FUENTE}" font-size="${40 * esc}" fill="${CREMA}" text-anchor="middle">${xml(l)}</text>`).join("");

  const svg = `<rect width="${F.w}" height="${F.h}" fill="#07090f" opacity=".66"/>
    <g transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${W}" height="${alto}" rx="${26 * esc}" fill="#152033" opacity=".97"/>
      <rect x="0" y="0" width="${W}" height="${alto}" rx="${26 * esc}" fill="none" stroke="${K}" stroke-width="5"/>
      <rect x="0" y="0" width="${W}" height="${7 * esc}" rx="3" fill="#c8336b"/>
      <text x="${W / 2}" y="${72 * esc}" font-family="${FUENTE}" font-size="${28 * esc}" fill="#c8336b" text-anchor="middle" letter-spacing="4">${xml(t.titulo || "DATO REAL")}</text>
      ${cuerpo}
      <text x="${W / 2}" y="${alto - 28 * esc}" font-family="Arial, Helvetica, sans-serif" font-size="${22 * esc}" fill="#8e9bab" text-anchor="middle">${xml(t.fuente || "")}</text>
    </g>`;
  return { svg, caja: { x: 0, y: 0, w: F.w, h: F.h } };
}

/* Rotulo de serie para los primeros planos. En los canales de referencia la premisa la da
   el titulo en pantalla, no la narracion: sin esto el espectador tarda 15 segundos en saber
   de que va el video, y en vertical eso es una eternidad. */
function rotuloSvg(rotulo, fmt) {
  const F = FORMATOS[fmt];
  const vert = fmt === "9x16";
  const arriba = typeof rotulo === "string" ? "" : (rotulo.arriba || "");
  const texto = typeof rotulo === "string" ? rotulo : rotulo.texto;
  const esc = vert ? 1 : 1.12;
  const maxCar = vert ? 15 : 20;
  const lineas = partirTexto(texto, maxCar);
  const tam = (vert ? 86 : 78) * esc;
  const lh = tam * 1.06;
  const y0 = vert ? F.h * 0.17 : F.h * 0.2;

  const cuerpo = lineas.map((l, i) =>
    `<text x="${F.w / 2}" y="${y0 + i * lh}" font-family="${FUENTE}" font-size="${tam}" fill="${CREMA}"
       text-anchor="middle" stroke="${K}" stroke-width="${tam * 0.14}" stroke-linejoin="round" paint-order="stroke">${xml(l)}</text>`).join("");

  const encabezado = arriba
    ? `<text x="${F.w / 2}" y="${y0 - tam * 1.2}" font-family="${FUENTE}" font-size="${tam * 0.4}" fill="#c8336b"
         text-anchor="middle" letter-spacing="${tam * 0.09}" stroke="${K}" stroke-width="${tam * 0.09}"
         stroke-linejoin="round" paint-order="stroke">${xml(arriba)}</text>` : "";

  const alto = y0 + lineas.length * lh + tam * 0.3;
  const svg = `${encabezado}${cuerpo}
    <rect x="${F.w / 2 - tam * 1.1}" y="${y0 + (lineas.length - 1) * lh + tam * 0.42}" width="${tam * 2.2}" height="${tam * 0.1}" rx="${tam * 0.05}" fill="#c8336b"/>`;
  return { svg, caja: { x: 0, y: 0, w: F.w, h: Math.ceil(alto) } };
}

/* Capa fija encima de la camara: HUD y/o tarjeta. Devuelve null si el plano no lleva nada. */
function svgOverlay(plano, fmt, barras = {}) {
  const capa = plano.tarjeta ? tarjetaSvg(plano.tarjeta, fmt)
    : plano.rotulo ? rotuloSvg(plano.rotulo, fmt)
    : plano.hud ? hudSvg(plano.hud, fmt, barras) : null;
  if (!capa) return null;
  const { x, y, w, h } = capa.caja;
  /* El SVG se recorta a la caja: lo que se rasteriza es solo el panel. */
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${capa.svg}</svg>`,
    rotulo: !!plano.rotulo,
    caja: capa.caja,
  };
}

/* Pagina minima para que Chromium rasterice el SVG sin margenes ni scroll. */
const html = (svg, transparente = false) =>
  `<!doctype html><meta charset="utf-8"><style>
     html,body{margin:0;padding:0;overflow:hidden;background:${transparente ? "transparent" : "#000"}}
     svg{display:block}
   </style>${svg}`;

/* Barras del HUD: se infiere el maximo de cada recurso a lo largo del guion. */
function calcularBarras(planos) {
  const max = {};
  const num = v => { const m = String(v).match(/-?[\d.,]+/); return m ? parseFloat(m[0].replace(",", ".")) : null; };
  for (const p of planos) for (const r of RECURSOS) {
    const v = p.hud && p.hud[r.clave] != null ? num(p.hud[r.clave]) : null;
    if (v != null) max[r.clave] = Math.max(max[r.clave] ?? 0, v);
  }
  return planos.map(p => {
    const b = {};
    for (const r of RECURSOS) {
      const v = p.hud && p.hud[r.clave] != null ? num(p.hud[r.clave]) : null;
      b[r.clave] = v != null && max[r.clave] ? v / max[r.clave] : 1;
    }
    return b;
  });
}

module.exports = { FORMATOS, svgEscena, svgOverlay, html, calcularBarras, partirTexto, FUENTE };
