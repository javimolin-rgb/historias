#!/usr/bin/env node
/* Compone cada plano y lo rasteriza con Chromium: escena (fondo + personaje + camara) y
   capa fija (HUD o tarjeta). Se renderiza en 16:9 y en 9:16, recomponiendo la escena.
   Uso: npm run escenas -- historias/001-demo [--solo p01,p04] [--formato 16x9] */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { chromiumPath } = require("./lib/bin");
const { cargar, mkdir, args } = require("./lib/historia");
const C = require("./lib/compositor");

async function main() {
  const { pos, flags } = args(process.argv.slice(2));
  const { dir, guion, slug } = cargar(pos[0]);
  const solo = flags.solo ? new Set(String(flags.solo).split(",").map(s => s.trim())) : null;
  const formatos = flags.formato ? [String(flags.formato)] : Object.keys(C.FORMATOS);

  const exe = chromiumPath();
  if (!exe) throw new Error("No encuentro Chromium. Corre: npx playwright install chromium");
  const navegador = await chromium.launch({ executablePath: exe });

  const planos = guion.planos.filter(p => !solo || solo.has(p.id));
  const barras = C.calcularBarras(guion.planos);
  const indice = new Map(guion.planos.map((p, i) => [p.id, i]));
  let n = 0;

  for (const fmt of formatos) {
    const F = C.FORMATOS[fmt];
    if (!F) throw new Error(`Formato desconocido: ${fmt}`);
    const salida = mkdir(path.join(dir, "planos", fmt));

    /* Escena: se rasteriza mas grande que la salida para dejarle aire al zoom. */
    const pagEscena = await navegador.newPage({
      viewport: { width: F.w, height: F.h }, deviceScaleFactor: F.margen,
    });
    const pagCapa = await navegador.newPage({
      viewport: { width: F.w, height: F.h }, deviceScaleFactor: 1,
    });
    /* Cada capa se guarda recortada a su panel; aqui queda donde pegarla en el cuadro. */
    const cajasFile = path.join(salida, "capas.json");
    const cajas = fs.existsSync(cajasFile) ? JSON.parse(fs.readFileSync(cajasFile, "utf8")) : {};

    for (const p of planos) {
      await pagEscena.setContent(C.html(C.svgEscena(p, fmt)));
      await pagEscena.screenshot({ path: path.join(salida, `${p.id}.png`) });

      const capa = C.svgOverlay(p, fmt, barras[indice.get(p.id)]);
      const ruta = path.join(salida, `capa-${p.id}.png`);
      if (capa) {
        await pagCapa.setViewportSize({ width: capa.caja.w, height: capa.caja.h });
        await pagCapa.setContent(C.html(capa.svg, true));
        await pagCapa.screenshot({ path: ruta, omitBackground: true });
        cajas[p.id] = capa.caja;
      } else {
        delete cajas[p.id];
        if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
      }

      n++;
      process.stdout.write(`\r  ${fmt}  ${p.id}  (${n}/${planos.length * formatos.length})   `);
    }
    fs.writeFileSync(cajasFile, JSON.stringify(cajas, null, 2));
    await pagEscena.close();
    await pagCapa.close();
  }

  await navegador.close();
  console.log(`\n${n} PNG en ${path.relative(process.cwd(), path.join(dir, "planos"))}/  [${slug}]`);
}

main().catch(e => { console.error("\nescenas:", e.message); process.exit(1); });
