/* Movimientos de camara sobre un PNG fijo.
   El plano se decodifica UNA vez y se repite con el filtro loop: hacerlo con "-loop 1"
   vuelve a decodificar el PNG en cada cuadro y el montaje se pone tres veces mas lento.
   Por eso cada movimiento devuelve { antes, despues }: lo que se hace una sola vez
   (normalizar el tamano) y lo que se evalua cuadro a cuadro.
   El PNG viene mas grande que la salida (margen 1.34), asi que z=1 muestra la escena
   completa y el zoom recorta sin perder nitidez. */

const FPS = 30;
const MARGEN = 1.34;

const trabajo = (W, H, m = MARGEN) => `scale=${Math.round(W * m / 2) * 2}:${Math.round(H * m / 2) * 2}`;

/* Panear con crop es mas suave que con zoompan: crop evalua x e y en cada cuadro
   y no trunca la posicion como lo hace zoompan. */
function paneo(dir, W, H, dur, z = 1.1) {
  const avance = dir === "derecha" ? `t/${dur.toFixed(3)}` : `(1-t/${dur.toFixed(3)})`;
  return {
    antes: trabajo(W, H),
    despues: `crop=w='iw/${z}':h='ih/${z}':x='(iw-iw/${z})*${avance}':y='(ih-ih/${z})/2',scale=${W}:${H}`,
  };
}

function zoom(de, a, W, H, dur, centro = "medio") {
  const n = Math.max(2, Math.round(dur * FPS));
  const y = centro === "arriba" ? `ih/2-(ih/zoom/1.6)` : centro === "abajo" ? `ih/2-(ih/zoom/3)` : `ih/2-(ih/zoom/2)`;
  return {
    antes: trabajo(W, H),
    despues: `zoompan=z='${de}+(${(a - de).toFixed(4)})*on/${n}':x='iw/2-(iw/zoom/2)':y='${y}':d=1:s=${W}x${H}:fps=${FPS}`,
  };
}

/* Temblor de camara para los sustos. */
function temblor(W, H, fuerza = 1) {
  const z = 1.08, a = (9 * fuerza).toFixed(1), b = (7 * fuerza).toFixed(1);
  return {
    antes: trabajo(W, H),
    despues: `crop=w='iw/${z}':h='ih/${z}':x='(iw-iw/${z})/2+${a}*sin(n*1.9)':y='(ih-ih/${z})/2+${b}*sin(n*2.7)',scale=${W}:${H}`,
  };
}

/* camara del guion -> filtros. */
function filtros(camara, W, H, dur) {
  switch (camara) {
    case "zoom-in-lento":   return zoom(1.0, 1.15, W, H, dur);
    case "zoom-in":         return zoom(1.0, 1.26, W, H, dur);
    case "zoom-in-cara":    return zoom(1.0, 1.3, W, H, dur, "arriba");
    case "zoom-out-lento":  return zoom(1.15, 1.0, W, H, dur);
    case "zoom-out":        return zoom(1.3, 1.0, W, H, dur);
    case "paneo-derecha":   return paneo("derecha", W, H, dur);
    case "paneo-izquierda": return paneo("izquierda", W, H, dur);
    case "temblor":         return temblor(W, H, 1);
    case "temblor-fuerte":  return temblor(W, H, 2.2);
    case "fijo":
    case undefined:
    case null:              return { antes: `scale=${W}:${H}`, despues: "" };
    default: throw new Error(`Camara desconocida: "${camara}". Usa: fijo, zoom-in-lento, zoom-in, zoom-in-cara, zoom-out-lento, zoom-out, paneo-izquierda, paneo-derecha, temblor, temblor-fuerte.`);
  }
}

module.exports = { filtros, FPS, MARGEN };
