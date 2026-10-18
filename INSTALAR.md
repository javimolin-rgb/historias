# Instalar y correr el pipeline

Probado en este equipo: macOS 12.6 (Monterey), Intel x86_64, sin Homebrew.

## Qué hace falta

| Herramienta | Estado aquí | Para qué |
|---|---|---|
| git 2.37 | ya estaba | versionar |
| Node 24 / npm 11 | ya estaba | todo el pipeline |
| Python 3.12 | ya estaba | edge-tts |
| edge-tts 7.3.1 | instalado con `pip3 install --user edge-tts` | voz y subtítulos |
| Playwright + Chromium | instalado con `npm install` | rasterizar las escenas SVG a PNG |
| ffmpeg + ffprobe 9.0.2 | descargados a `bin/` | montaje, cámara, audio, subtítulos quemados |

## Pasos

```bash
npm install
pip3 install --user edge-tts
```

### Chromium

`npx playwright install chromium` **falla en macOS 12**: las versiones nuevas de Playwright ya no
publican binarios para este sistema (`Playwright does not support chromium on mac12`).
En este equipo quedó una revisión anterior en la caché y el pipeline la usa directamente:
`scripts/lib/bin.js` busca en `~/Library/Caches/ms-playwright/` y toma la revisión más alta que
exista, en vez de confiar en la que pide Playwright. No hay que hacer nada más.

Si algún día esa caché se borra, hay dos salidas: instalar una versión vieja de Playwright
(`npm i -D playwright@1.49` y luego `npx playwright install chromium`), o apuntar
`chromiumPath()` a un Chrome ya instalado.

### ffmpeg

No hay Homebrew en el equipo y el ffmpeg que trae Playwright no sirve: está compilado con
`--disable-everything` y solo exporta VP8/webm, sin H.264, sin AAC y sin los filtros
`zoompan`, `subtitles` ni `amix` que usa el montaje.

Se descargó un build estático completo de <https://ffmpeg.martin-riedl.de> (versión 9.0.2,
con `libx264`, `libass`, `libfreetype`) y quedó en `bin/`:

```bash
curl -fsSL -o ffmpeg.zip  "https://ffmpeg.martin-riedl.de/redirect/latest/macos/amd64/release/ffmpeg.zip"
curl -fsSL -o ffprobe.zip "https://ffmpeg.martin-riedl.de/redirect/latest/macos/amd64/release/ffprobe.zip"
unzip -o ffmpeg.zip -d bin && unzip -o ffprobe.zip -d bin && chmod +x bin/ffmpeg bin/ffprobe
```

`bin/` está en `.gitignore`: son ~190 MB y no se versionan. Para verificar:

```bash
npm run video -- --check
```

(evermeet.cx, la fuente habitual de ffmpeg para Mac, respondía 429 y 410 al intentarlo.)

## Comandos

```bash
npm run voz     -- historias/001-slug   # un mp3 y un .srt por plano, más audio/tiempos.json
npm run escenas -- historias/001-slug   # PNG de cada plano en 16:9 y 9:16
npm run video   -- historias/001-slug   # salida/001-youtube.mp4 y salida/001-vertical.mp4
npm run todo    -- historias/001-slug   # los tres en orden
npm run voces   -- "frase de prueba"    # compara voces de edge-tts en pruebas/voces/
```

Opciones útiles:

- `--solo p01,p04` — trabaja solo esos planos (para iterar sin rehacer todo).
- `--formato 16x9` o `--formato 9x16` — un solo formato.
- `--rapido` — encode de previsualización (más rápido, archivo más chico).
- `--calidad maxima` — encode más lento para la versión que se publica.

## Audio

La música va en `assets/audio/musica/` y los efectos en `assets/audio/sfx/`, con el nombre que
use el guion (`"sfx": ["vibracion"]` busca `assets/audio/sfx/vibracion.mp3`). Si falta un
archivo el montaje avisa y sigue sin él. Las licencias se anotan en `assets/audio/LICENCIAS.md`.
