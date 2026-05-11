/**
 * MetaDash Spy — DOM Parser
 *
 * Estrategia: en vez de selectores CSS frágiles (Meta usa clases hash que
 * cambian todo el tiempo), localizamos los ad cards por patrones de TEXTO
 * ("Identificador de la biblioteca:" / "Library ID:") que son estables.
 *
 * Algoritmo:
 *   1. Buscar todos los text nodes que contienen un library_id
 *   2. Para cada uno, subir el árbol DOM hasta que el padre contenga
 *      MÁS de un library_id — eso marca el límite exacto de la card
 *   3. Extraer toda la data del card usando regex + heurísticas robustas
 */

const MDSpyParser = (() => {

  function findAdCards(labels) {
    const re = new RegExp(labels.libraryIdRegex.source, 'i');
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (!node.textContent) return NodeFilter.FILTER_REJECT;
          return re.test(node.textContent)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const seen = new Map();
    let node;
    while ((node = walker.nextNode())) {
      const match = node.textContent.match(re);
      if (!match) continue;
      const id = match[1];
      if (seen.has(id)) continue;

      // Subir hasta que el padre contenga > 1 library_id (límite del card)
      let card = node.parentElement;
      let parent = card?.parentElement;
      while (parent && parent !== document.body) {
        const text = parent.innerText || '';
        const ids = text.match(labels.libraryIdGlobal) || [];
        if (ids.length > 1) break;
        card = parent;
        parent = parent.parentElement;
      }

      if (card) seen.set(id, card);
    }

    return Array.from(seen.entries()).map(([id, card]) => ({ id, card }));
  }

  function extractStatus(text, labels) {
    if (labels.statusInactive.test(text)) return 'Inactivo';
    if (labels.statusActive.test(text)) return 'Activo';
    return 'Desconocido';
  }

  function extractStartDate(text, labels) {
    const m = text.match(labels.startedOnRegex);
    return m ? m[1].trim() : '';
  }

  function extractVariations(text, labels) {
    const m = text.match(labels.variationsRegex);
    return m ? parseInt(m[1], 10) : 1;
  }

  function extractPageName(card, fullText) {
    // 1) Buscar el primer link que NO sea metadata (no contiene "Identificador"/"Library ID")
    const links = card.querySelectorAll('a[role="link"], a[href*="facebook.com/"]');
    for (const a of links) {
      const t = (a.innerText || '').trim();
      if (
        t &&
        t.length > 1 &&
        t.length < 80 &&
        !/Identificador|Library ID|Ver resumen|See ad details|Ver detalles/i.test(t) &&
        !/^\d+$/.test(t)
      ) {
        return t;
      }
    }
    // 2) Fallback: primer <span> con texto "tipo título"
    const spans = card.querySelectorAll('span, strong, h3, h4');
    for (const s of spans) {
      const t = (s.innerText || '').trim();
      if (t && t.length > 1 && t.length < 60 && !/^\d/.test(t) && !/Identificador|Library ID|Activo|Inactivo|Active/i.test(t)) {
        return t;
      }
    }
    return '';
  }

  function extractMediaType(card) {
    if (card.querySelector('video')) return 'video';
    const imgs = Array.from(card.querySelectorAll('img')).filter((img) => {
      // Filtrar avatares pequeños / íconos
      const rect = img.getBoundingClientRect();
      return rect.width > 100 && rect.height > 100;
    });
    if (imgs.length > 2) return 'carousel';
    if (imgs.length >= 1) return 'image';
    return 'unknown';
  }

  function extractCTA(card, labels) {
    const candidates = card.querySelectorAll('div[role="button"], a[role="button"], button');
    for (const b of candidates) {
      const t = (b.innerText || '').trim();
      if (!t || t.length > 40) continue;
      if (labels.knownCTAs.test(t)) return t;
    }
    // Fallback: cualquier botón corto que parezca CTA (mayúscula inicial, sin números)
    for (const b of candidates) {
      const t = (b.innerText || '').trim();
      if (t && t.length > 2 && t.length < 25 && /^[A-ZÁÉÍÓÚÑ]/.test(t) && !/\d/.test(t)) {
        return t;
      }
    }
    return '';
  }

  function extractDestinationURL(card) {
    const links = card.querySelectorAll('a[href]');
    for (const a of links) {
      const href = a.href || '';
      if (!href || href.startsWith('#')) continue;
      if (/facebook\.com|fbcdn\.net|instagram\.com\/p\//.test(href)) continue;
      // URL externa - probablemente destino
      try {
        const u = new URL(href);
        if (u.hostname && u.hostname !== window.location.hostname) {
          return u.hostname + (u.pathname !== '/' ? u.pathname : '');
        }
      } catch (_) {}
    }
    return '';
  }

  function extractAdText(card, labels) {
    // Estrategia: buscar el bloque de texto MÁS LARGO que no sea metadata
    const blocks = [];
    const els = card.querySelectorAll('span, div[dir="auto"], p');
    for (const el of els) {
      // Solo texto directo (no recursivo) para no duplicar
      let direct = '';
      for (const n of el.childNodes) {
        if (n.nodeType === Node.TEXT_NODE) direct += n.textContent;
      }
      direct = direct.trim();
      if (!direct || direct.length < 30) continue;
      if (/Identificador de la biblioteca|Library ID|En circulación|Started running|Plataformas|Platforms/i.test(direct)) continue;
      blocks.push(direct);
    }

    if (blocks.length === 0) {
      // Fallback: agarrar el innerText completo y filtrar líneas de metadata
      const full = (card.innerText || '').split('\n').map(l => l.trim()).filter(l =>
        l.length > 25 &&
        !/Identificador de la biblioteca|Library ID|En circulación|Started running|^Activo$|^Inactivo$|^Active$|^Inactive$|Plataformas:|Platforms:/i.test(l)
      );
      return full.slice(0, 8).join('\n').slice(0, 1500);
    }

    // Devolver los 2-3 bloques más largos, deduplicados
    const uniq = Array.from(new Set(blocks));
    uniq.sort((a, b) => b.length - a.length);
    return uniq.slice(0, 3).join('\n').slice(0, 1500);
  }

  function extractPlatforms(card, text, labels) {
    // 1) Línea explícita "Plataformas: X, Y, Z"
    const m = text.match(labels.platformsRegex);
    if (m) {
      return m[1]
        .split(/[,·•]/)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 8);
    }
    // 2) Detectar por aria-label en íconos
    const KNOWN = ['Facebook', 'Instagram', 'Messenger', 'Audience Network', 'Threads'];
    const found = new Set();
    const labelled = card.querySelectorAll('[aria-label]');
    for (const el of labelled) {
      const a = el.getAttribute('aria-label') || '';
      for (const p of KNOWN) {
        if (a.includes(p)) found.add(p);
      }
    }
    return Array.from(found);
  }

  function extractExtraText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const flags = [];
    for (const l of lines) {
      if (/BONO|BONUS|SOLO POR HOY|TODAY ONLY|DESCUENTO|OFF|GRATIS|FREE|GARANTÍA|GUARANTEE|ENTREGA INMEDIATA|INSTANT/i.test(l)) {
        flags.push(l);
      }
    }
    return Array.from(new Set(flags)).slice(0, 5).join(' | ');
  }

  function parseCard(card, id, labels) {
    const text = card.innerText || '';
    const startRaw = extractStartDate(text, labels);
    const startIso = MDSpyI18N.parseDate(startRaw, labels);

    return {
      library_id: id,
      status: extractStatus(text, labels),
      start_date: startRaw,
      start_date_iso: startIso,
      days_active: MDSpyI18N.daysBetween(startIso),
      page_name: extractPageName(card, text),
      ad_text: extractAdText(card, labels),
      cta_text: extractCTA(card, labels),
      destination_url: extractDestinationURL(card),
      media_type: extractMediaType(card),
      platforms: extractPlatforms(card, text, labels),
      variation_count: extractVariations(text, labels),
      extra_text: extractExtraText(text),
      scraped_at: new Date().toISOString(),
    };
  }

  function scan() {
    const labels = MDSpyI18N.detect();
    const cards = findAdCards(labels);
    const ads = cards.map(({ id, card }) => {
      try {
        return parseCard(card, id, labels);
      } catch (e) {
        console.warn('[MetaDash Spy] error parsing card', id, e);
        return null;
      }
    }).filter(Boolean);
    return { ads, language: labels === MDSpyI18N.ES ? 'es' : 'en' };
  }

  function getSearchQuery() {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get('q') || url.searchParams.get('view_all_page_id') || '';
    } catch (_) {
      return '';
    }
  }

  function estimateTotal() {
    // Buscar textos tipo "~130 anuncios" / "About 130 ads" en la página
    const text = (document.body?.innerText || '').slice(0, 30000);
    const m = text.match(/(?:~|aproximadamente|about)\s*(\d{1,5})\s*(?:anuncios|resultados|ads|results)/i)
      || text.match(/(\d{2,5})\s*(?:resultados|results)/i);
    return m ? parseInt(m[1], 10) : null;
  }

  return { scan, getSearchQuery, estimateTotal, findAdCards };
})();
