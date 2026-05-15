# Iconos

Esta carpeta es para los iconos de la extensión (PNG: 16, 48 y 128 px).

Para no romper el load de la extensión, **el manifest.json NO referencia iconos**
hasta que los agregues. Una vez que tengas los archivos:

1. Generá 3 PNGs cuadrados con el logo de MetaDash:
   - `icon16.png` (16×16)
   - `icon48.png` (48×48)
   - `icon128.png` (128×128)

2. Actualizá `manifest.json` agregando dentro de `"action"`:
   ```json
   "default_icon": {
     "16": "icons/icon16.png",
     "48": "icons/icon48.png",
     "128": "icons/icon128.png"
   }
   ```

3. Agregá también a nivel raíz del manifest:
   ```json
   "icons": {
     "16": "icons/icon16.png",
     "48": "icons/icon48.png",
     "128": "icons/icon128.png"
   }
   ```

**Sugerencia rápida:** podés generar los 3 tamaños desde un SVG con
[realfavicongenerator.net](https://realfavicongenerator.net/) o con
ImageMagick (`convert source.png -resize 48x48 icon48.png`).
