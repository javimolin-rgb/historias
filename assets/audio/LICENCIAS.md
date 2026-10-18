# Licencias del audio

## Música

| Archivo | Origen | Licencia |
|---|---|---|
| `musica/ceniza.wav` | Generada en este repo por `scripts/audio.js` (síntesis propia, sin samples de terceros) | Obra del proyecto. Uso libre, sin atribución a nadie más. |

`ceniza.wav` es una cama de tensión de 62 s pensada para ir muy por debajo de la voz:
acorde de la menor alternando con fa mayor cada 16 s, drone en la, una nota alta suelta
cada 8 s, un pulso grave cada 3,2 s y una capa de viento (ruido marrón filtrado).
El bucle cierra con un cruce de 2 s para que `-stream_loop` no haga clic.

En el guion se mezcla al 8,5 % (`"volumenMusica": 0.085`).

## Efectos

Todos generados por `scripts/audio.js`. Misma condición que la música: obra del proyecto.

| Archivo | Qué es |
|---|---|
| `sfx/vibracion.wav` | Celular vibrando sobre una superficie dura |
| `sfx/golpes.wav` | Tres golpes en una puerta |
| `sfx/crujido.wav` | Estructura crujiendo bajo peso |
| `sfx/viento.wav` | Racha de viento |
| `sfx/estatica.wav` | Radio sin señal, con portadora |
| `sfx/clic.wav` | Interruptor |
| `sfx/impacto.wav` | Golpe grave de tensión |
| `sfx/persiana.wav` | Persiana metálica trabándose |

Para regenerarlos: `npm run audio`.

## Si en el futuro se usa música de terceros

Anotar aquí el archivo, el autor, el enlace y la licencia exacta **antes** de publicar.
Fuentes aceptadas: Pixabay (Content License) y la Biblioteca de audio de YouTube.
Si la pista pide atribución, el texto va en la descripción del video.
