# MetaDash Spy — Chrome Extension

Extensión Chrome (Manifest V3) que lee la **Biblioteca de Anuncios de Meta**
(facebook.com/ads/library) y exporta los datos estructurados para alimentar
MetaDash (Spy de Ads + Investigador de Mercado).

## Qué hace

- Lee los anuncios visibles en el DOM de la Ads Library (sin auto-scroll, sin
  requests a los servers de Meta, sin scraping vía API no autorizada).
- Extrae por cada ad: `library_id`, estado, fecha de inicio, días activo,
  nombre de página, copy completo, CTA, URL destino, tipo de medio
  (video/imagen/carrusel), plataformas y cantidad de variaciones.
- Genera un análisis automático: señales de scaling, hooks repetidos,
  winner probable, y prioridad de descarga de videos.
- Exporta en 3 formatos:
  - **TXT** — reporte legible optimizado para pegar en Claude / MetaDash
  - **JSON** — estructurado, listo para importar a MetaDash vía API
  - **CSV** — tabla plana para Excel/Sheets
- Mantiene historial local de los últimos 20 escaneos (`chrome.storage.local`).

## Por qué es segura (anti-ban)

- **Permisos mínimos:** `activeTab`, `storage`, `scripting` — solo se activa
  en la URL `facebook.com/ads/library/*`.
- **No hace requests** a Meta. Solo lee el DOM ya cargado por el navegador.
- **No hace auto-scroll** ni paginación automática. El usuario scrollea
  manualmente y la extensión lee lo que quedó visible.
- **No accede a Business Manager** ni a cookies sensibles.
- **No inyecta scripts** que modifiquen el comportamiento de la página.

## Instalación (modo dev — para vos)

1. Abrí Chrome y andá a `chrome://extensions`.
2. Activá **Modo desarrollador** (arriba a la derecha).
3. Click en **Cargar extensión sin empaquetar**.
4. Seleccioná esta carpeta (`metadash-spy-extension/`).
5. Listo. Va a aparecer el ícono en la barra (sin imagen por ahora — ver
   `icons/README.md` para agregar iconos cuando quieras).

> **Recomendación:** usá un perfil de Chrome **separado** (no logueado en tu
> Business Manager) por seguridad. La extensión no toca esos datos, pero es
> buena práctica para auditorías de competencia.

## Uso

1. Abrí `facebook.com/ads/library`, hacé una búsqueda (marca, dominio, palabra clave).
2. Scrolleá hasta cargar todos los ads que querés analizar.
3. Click en el ícono de la extensión.
4. Click en **Escanear anuncios visibles**.
5. Mirá el resumen (total, videos vs imágenes, ad más viejo, max variaciones,
   señales de scaling, winner probable).
6. Click en **TXT** para descargar el reporte legible, **JSON** para importarlo
   a MetaDash, o **CSV** para tabla.

## Pipeline completo en MetaDash

```
1. Abrir Ads Library → buscar competidor → scrollear
       ↓
2. Click extensión → "Escanear" → "Exportar TXT"
       ↓
3. Leer TXT → identificar WINNER → descargar el video manualmente
       ↓
4. Subir el video a MetaDash → /spy → análisis Claude Vision
       ↓
5. (Próximamente) Subir JSON a MetaDash → componente "Biblioteca"
       ↓
6. Investigador combina las 3 fuentes → REPORTE FINAL → infoproducto
```

## Estructura del código

```
metadash-spy-extension/
├── manifest.json              # MV3
├── content/
│   ├── i18n.js                # detecta español/inglés + parser de fechas
│   ├── parser.js              # parser DOM robusto (text-pattern based)
│   ├── analyzer.js            # señales, hooks, winner, prioridad
│   └── content.js             # message listener — orquesta scan
├── popup/
│   ├── popup.html
│   ├── popup.css              # tema oscuro MetaDash
│   ├── popup.js               # UI + comunicación con content script
│   └── exporter.js            # TXT / JSON / CSV
├── background/
│   └── service-worker.js      # storage del historial
└── icons/
    └── README.md              # cómo agregar iconos (no incluidos)
```

## Estrategia de parsing (lo importante)

Meta usa clases CSS dinámicas (`x-r2g4w`, `_4_jq`, etc.) que cambian cada
deploy. Si dependieras de selectores CSS específicos, la extensión se rompe
cada 2 semanas.

**Mi enfoque:** localizar los ad cards por **patrones de texto** (los strings
"Identificador de la biblioteca:" en español o "Library ID:" en inglés son
estables porque son labels traducidos del producto). Una vez detectado un
`library_id`, subo el árbol DOM hasta que el padre contiene **más de uno** —
ese es el límite exacto del card. Después extraigo cada campo con regex
sobre el `innerText` del card y heurísticas estructurales (imgs grandes
para detectar carruseles, botones con texto CTA conocido, etc.).

Ventajas:
- Independiente de las clases generadas por Meta.
- Bilingüe (español/inglés) sin esfuerzo adicional.
- Si Meta agrega ads sin cambiar los labels, sigue funcionando.

Si Meta cambia los labels (improbable, son strings del producto), basta
con editar `content/i18n.js`.

## Roadmap

- **v1.0** (actual): scan, análisis local, exportar TXT/JSON/CSV.
- **v1.1**: importación directa a MetaDash vía
  `POST /api/spy/import-library` con token del usuario.
- **v1.2**: componente "Biblioteca" en MetaDash con tabla + filtros + acciones.
- **v1.3**: tracking temporal (re-escanear cada semana y mostrar evolución
  del competidor).
