# Historias: canal de historias animadas de supervivencia en español

Este repo produce videos completos de punta a punta: guion, escenas dibujadas en código, voz, subtítulos y montaje.
Formatos: YouTube largo (16:9, 1920x1080) y cortos verticales para TikTok, Reels y Shorts (9:16, 1080x1920).

## Referencias que imitamos (formato, no contenido)

- Instagram `@beaniesurvives`: «30 días atrapado en el piso 30» (2:46). Personaje de palitos con gorro mostaza y fondos detallados.
- YouTube «Last Carriage» (11:53): 30 días atrapado en un vagón del metro.

Lo que funciona en ambos:
- Serie «30 días atrapado en…» con contador «DÍA X / 30» y un panel (HUD) de recursos que van bajando: agua, comida, batería.
- Narración en **segunda persona** con frases cortas («Tú no te mueves.»). Un subtítulo grande por plano.
- Personaje mínimo que casi no se anima. El detalle está en el fondo y en la luz.
- **Tarjetas de datos reales** («Regla 7-10», cuánto dura un congelador sin luz): el espectador siente que aprende algo.
- Tensión barata de animar: mirilla de la puerta, cámaras de seguridad, una voz conocida que no es quien parece, un giro final.

No copiamos tramas de esos canales. Las historias son originales.

## Personaje oficial (no cambiar sin que el usuario lo pida)

- Código fuente: `personajes/personaje.js`. Usa siempre este módulo y no redibujes el personaje a mano.
  - `Personaje.dibujar({pose, expr, mirar, x, y, escala})` devuelve un `<g>` SVG. `x`, `y` son la posición de los pies; con escala 1 mide 300 px.
  - Poses: `quieto`, `sosteniendo`, `brazos_arriba`, `manos_juntas`, `caminando`. Expresiones: `normal`, `sorpresa`, `nervioso`, `cerrados`. `mirar`: `izquierda` | `derecha`.
  - Si se necesita una pose o expresión nueva, agrégala al módulo con el mismo estilo y reutilízala.
- Aspecto: cuerpo de palitos negros (6 px), cabeza blanca redonda con sombra gris abajo a la derecha, ojitos ovalados mirando de lado, sin boca y **sin bufanda**.
- Seña distintiva: gorro de lana **frambuesa** (`#c8336b`, oscuro `#8c1f49`) con 2 rayas crema (`#f2ebdf`) curvas. El canto tiene un tejido que sigue la curva y se junta hacia los bordes.
- Referencia visual: `personajes/personaje.html` (página aprobada por el usuario). Las páginas `propuestas.html`, `opciones.html`, `estilo.html` y `gorros.html` son descartes del casting.
- Nombre del personaje y de la cuenta: **por definir**. Proponer opciones antes de publicar el primer video.

## Estilo visual de las escenas

Todo se dibuja como **SVG en código**, en el mismo estilo del personaje. No se usan generadores de imágenes con IA.

- Contorno negro `#161618` de 4–5 px, uniones redondeadas, colores planos con degradados suaves para dar volumen. Luz desde arriba a la izquierda.
- Paletas de escena: noche (`#1c2848`→`#2b3e70`), lámpara cálida (`#f2c27a`→`#5a3e2c`), baño o hospital verde (`#b9c6a6`), concreto (`#7a8087`). Las escenas de miedo usan oscuridad y una sola fuente de luz.
- Fondos más ricos que el personaje: ventanas con ciudad, muebles, puertas, objetos. Arma una **biblioteca de props** reutilizables en `escenas/props/` (puerta, sofá, ventana con skyline, lámpara, estante, bidón de agua, latas, mirilla, cámara de seguridad).
- Viñeta, grano suave y sombras de ambiente para que no se vea plano.
- Composición: el personaje ocupa entre 1/4 y 1/3 del alto del cuadro. Deja zona segura para subtítulos en el tercio inferior.

## Animación: «mismo cuadro, piezas que cambian»

- Cada plano es una escena SVG con 1 a 3 estados (por ejemplo, ojos normales → sorpresa). No hay animación cuadro a cuadro.
- El movimiento sale de ffmpeg: zoom y paneo lentos (Ken Burns), cortes, fundidos, temblor de cámara en los sustos, parpadeo de luz.
- Microanimaciones baratas: parpadeo (expresión `cerrados` durante 0,15 s), luz que titila, lluvia o polvo en una capa.

## Fórmula de guion

1. **Gancho (0–3 s):** la situación límite en una frase. «Todos los teléfonos del vagón dicen lo mismo.»
2. **Reglas del juego:** el encierro, cuántos días son y qué recursos hay (se muestra el HUD).
3. **Días con escalada:** cada bloque «DÍA X» trae un problema nuevo. Cada 3–4 bloques, una tarjeta con un dato real.
4. **Giro:** alguien o algo no es lo que parece.
5. **Final:** salida o cliffhanger, y una pregunta al espectador («¿Tú habrías abierto la puerta?»).

Estilo de narración: segunda persona, presente, frases de 3 a 12 palabras, español latino neutro, sin groserías fuertes.
**Los datos de las tarjetas deben ser reales y verificables.** Anota la fuente en el guion.

Duraciones: corto vertical de 60–90 s, versión Instagram de 2–3 min, YouTube de 8–12 min.

## Formato del guion (`historias/NNN-slug/guion.json`)

```json
{
  "titulo": "30 días atrapado en ...",
  "voz": "es-MX-JorgeNeural",
  "planos": [
    { "id": "p01", "escena": "living-noche", "personaje": {"pose":"sosteniendo","expr":"normal","x":620,"y":900},
      "narracion": "Son las 23:40 y tu teléfono vibra.", "hud": {"dia":1,"agua":"45 L","comida":"25 días"},
      "camara": "zoom-in-lento", "sfx": ["vibracion"], "tarjeta": null }
  ]
}
```

La duración de cada plano sale de la duración de su audio, más un respiro de unos 0,3 s.

## Pipeline (comandos de Node)

- `npm run voz -- historias/NNN`: genera un audio por plano con edge-tts (`.mp3` y subtítulos con tiempos por palabra).
- `npm run escenas -- historias/NNN`: compone cada plano (fondo + personaje + HUD + tarjeta) y lo renderiza a PNG con Playwright. Se renderiza en 16:9 y en 9:16; en la versión vertical se recompone, no basta con recortar.
- `npm run video -- historias/NNN`: ffmpeg aplica cámara y transiciones, agrega voz, música y efectos, y quema los subtítulos. Salida: `salida/NNN-youtube.mp4` y `salida/NNN-vertical.mp4`.
- `npm run todo -- historias/NNN`: corre los tres pasos en orden.

Audio: la música y los efectos van en `assets/audio/` y son libres de derechos (Pixabay o la biblioteca de audio de YouTube). Antes de publicar, registra la licencia de cada pista en `assets/audio/LICENCIAS.md`.

## Estructura

```
personajes/    personaje.js (oficial) y páginas del casting
escenas/       fondos SVG por lugar y props/ reutilizables
historias/     NNN-slug/guion.json, audio/, planos/
assets/audio/  música y efectos
scripts/       voz, escenas y video
salida/        videos finales (no se versionan: van en .gitignore)
```

## Reglas de trabajo

- Antes de renderizar un video completo, muestra 3–4 planos clave en PNG y espera la aprobación del usuario.
- No subas al repo videos, audios generados ni planos renderizados (todo eso va en `.gitignore`). Sí se suben el código, los guiones y las escenas SVG.
- Responde al usuario en español.
