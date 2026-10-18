# Cómo dejar todo listo en tu computador

## 1. Instala estos 5 programas (una sola vez)

| Programa | Para qué sirve | Windows | Mac |
|---|---|---|---|
| **Git** | Bajar este proyecto y guardar cambios | https://git-scm.com/download/win | Viene con el Mac (si no, `xcode-select --install`) |
| **Node.js LTS** | Dibujar las escenas y correr el pipeline | https://nodejs.org (botón «LTS») | https://nodejs.org (botón «LTS») |
| **Python 3** | Generar las voces (edge-tts) | https://www.python.org/downloads/ (marca «Add Python to PATH») | https://www.python.org/downloads/ |
| **ffmpeg** | Armar el video: unir imágenes, voz y subtítulos | En PowerShell: `winget install Gyan.FFmpeg` | `brew install ffmpeg` (con Homebrew: https://brew.sh) |
| **Claude Code** | Trabajar conmigo en tu carpeta local | App de escritorio de Claude (pestaña Code) o en PowerShell: `irm https://claude.ai/install.ps1 \| iex` | App de escritorio de Claude (pestaña Code) o en Terminal: `curl -fsSL https://claude.ai/install.sh \| bash` |

Después de instalar, cierra y vuelve a abrir la terminal. Para comprobar que todo quedó instalado, cada uno de estos comandos debe mostrar una versión:

```
git --version
node --version
python --version      (en Mac: python3 --version)
ffmpeg -version
claude --version
```

No necesitas instalar nada más a mano. Las librerías del proyecto (Playwright para dibujar y edge-tts para la voz) las instala Claude Code en el primer paso.

No necesitas claves de pago: las escenas se dibujan en código y la voz es gratis con edge-tts.

## 2. Baja el proyecto

Abre una terminal en la carpeta donde quieras guardarlo, por ejemplo Documentos, y ejecuta:

```
git clone https://github.com/javimolin-rgb/historias.git
cd historias
git checkout claude/vibrant-ritchie-u0vvtx
```

Si el repo es privado y Git te pide iniciar sesión, entra con tu cuenta de GitHub en la ventana que aparece.

## 3. Abre Claude Code en esa carpeta

- **App de escritorio:** pestaña Code → elige la carpeta `historias`.
- **Terminal:** dentro de la carpeta `historias`, escribe `claude`.

Claude Code lee solo el archivo `CLAUDE.md` con todas las reglas del proyecto: el personaje, el estilo, la fórmula de las historias y el pipeline.

## 4. Pega este prompt como primer mensaje

```
Lee CLAUDE.md y personajes/personaje.js. Vamos a producir la primera historia de prueba del canal, de punta a punta, en esta carpeta local.

Hazlo en este orden y detente donde indico para que yo apruebe:

1. Entorno: verifica que git, node, python y ffmpeg funcionen. Crea package.json, instala playwright (con chromium) y edge-tts, y arma .gitignore (salida/, audios y planos renderizados). Si falta algo, dime exactamente qué instalar.

2. Pipeline mínimo: crea scripts/ con los comandos voz, escenas, video y todo, tal como los describe CLAUDE.md. Pruébalo con una demo de 10 segundos: 2 planos, el personaje en un living de noche, voz y subtítulos. Muéstrame el mp4. ALTO: espera mi visto bueno.

3. Voz: genera la misma frase con 4 voces de edge-tts (2 de es-MX, 1 de es-CL y 1 de es-US) para que yo elija.

4. Historia: proponme 3 premisas originales del tipo «30 días atrapado en…», cada una con su gancho de 1 frase. ALTO: yo elijo una.

5. Guion: escribe guion.json de la versión Instagram (2 a 3 minutos) con la fórmula de CLAUDE.md. Usa datos reales con fuente. ALTO: yo apruebo el texto.

6. Escenas: arma los fondos SVG y los props que necesite la historia, en el mismo estilo del personaje. Muéstrame 4 planos clave en PNG. ALTO: los apruebo.

7. Render final: genera el video horizontal y el vertical, con música y efectos libres de derechos (dime cuáles descargar y dónde ponerlos si no los tengo). Entrégame las rutas de los mp4.

8. Guarda en git el código, el guion y las escenas (no los videos) y súbelo a la rama actual.

Trabaja autónomo entre los puntos de ALTO. Si una decisión es solo técnica, tómala tú. Si cambia cómo se ve o cómo suena el video, pregúntame.
```

## Qué esperar

- **Paso 2:** el primer video de prueba debería estar listo en unos 15 a 30 minutos.
- **Paso 6:** las escenas son lo que más trabajo lleva. Cada historia nueva reutiliza los props de las anteriores, así que se vuelve más rápido con cada video.
- **Si edge-tts deja de funcionar** (es un servicio gratis no oficial de Microsoft), pídele a Claude Code que cambie a Piper (voz offline, gratis) o a ElevenLabs (de pago, mejor calidad).
