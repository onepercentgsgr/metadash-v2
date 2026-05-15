/**
 * MetaDash Spy — i18n / label detection
 * Detecta si la Ads Library está en español o inglés y expone los labels
 * para que el parser sea idioma-agnóstico.
 */

const MDSpyI18N = (() => {
  const ES = {
    libraryIdRegex: /(?:Identificador de la biblioteca|ID de la biblioteca):\s*(\d+)/i,
    libraryIdGlobal: /(?:Identificador de la biblioteca|ID de la biblioteca):\s*\d+/gi,
    statusActive: /Activo|En curso/i,
    statusInactive: /Inactivo|Finalizado/i,
    startedOnRegex: /En circulación desde el\s+([^\n.]+?)(?:\.|$|\n)/i,
    variationsRegex: /(\d+)\s+anuncios usan este contenido y texto/i,
    platformsRegex: /Plataformas?:\s*([^\n]+)/i,
    months: {
      'enero': 0, 'ene': 0, 'ene.': 0,
      'febrero': 1, 'feb': 1, 'feb.': 1,
      'marzo': 2, 'mar': 2, 'mar.': 2,
      'abril': 3, 'abr': 3, 'abr.': 3,
      'mayo': 4, 'may': 4, 'may.': 4,
      'junio': 5, 'jun': 5, 'jun.': 5,
      'julio': 6, 'jul': 6, 'jul.': 6,
      'agosto': 7, 'ago': 7, 'ago.': 7,
      'septiembre': 8, 'sept': 8, 'sep': 8, 'sep.': 8, 'sept.': 8,
      'octubre': 9, 'oct': 9, 'oct.': 9,
      'noviembre': 10, 'nov': 10, 'nov.': 10,
      'diciembre': 11, 'dic': 11, 'dic.': 11,
    },
    knownCTAs: /^(Comprar|Más información|Compra ahora|Compra|Reservar|Registrarse|Solicitar oferta|Descargar|Enviar mensaje|Suscribirme|Ver más|Obtener oferta|Contactarnos|Pedir ahora|Ver oferta)$/i,
  };

  const EN = {
    libraryIdRegex: /Library ID:\s*(\d+)/i,
    libraryIdGlobal: /Library ID:\s*\d+/gi,
    statusActive: /\bActive\b/i,
    statusInactive: /\bInactive\b/i,
    startedOnRegex: /Started running on\s+([^\n.]+?)(?:\.|$|\n)/i,
    variationsRegex: /(\d+)\s+ads use this creative and text/i,
    platformsRegex: /Platforms?:\s*([^\n]+)/i,
    months: {
      'January': 0, 'Jan': 0, 'Jan.': 0,
      'February': 1, 'Feb': 1, 'Feb.': 1,
      'March': 2, 'Mar': 2, 'Mar.': 2,
      'April': 3, 'Apr': 3, 'Apr.': 3,
      'May': 4,
      'June': 5, 'Jun': 5, 'Jun.': 5,
      'July': 6, 'Jul': 6, 'Jul.': 6,
      'August': 7, 'Aug': 7, 'Aug.': 7,
      'September': 8, 'Sept': 8, 'Sep': 8, 'Sep.': 8, 'Sept.': 8,
      'October': 9, 'Oct': 9, 'Oct.': 9,
      'November': 10, 'Nov': 10, 'Nov.': 10,
      'December': 11, 'Dec': 11, 'Dec.': 11,
    },
    knownCTAs: /^(Shop Now|Learn More|Sign Up|Book Now|Get Offer|Send Message|Subscribe|Download|Order Now|Buy Now|Contact Us|See More|Apply Now)$/i,
  };

  function detect() {
    const sample = (document.body?.innerText || '').slice(0, 8000);
    if (ES.libraryIdRegex.test(sample) || /Resultados de la búsqueda|Biblioteca de anuncios/i.test(sample)) return ES;
    if (EN.libraryIdRegex.test(sample) || /Ad Library|Search Results/i.test(sample)) return EN;
    return (document.documentElement.lang || '').startsWith('es') ? ES : EN;
  }

  /** Parsea una fecha en formato español o inglés a YYYY-MM-DD. */
  function parseDate(raw, labels) {
    if (!raw) return null;
    const clean = raw.replace(/\s+/g, ' ').trim();
    // Patrones soportados:
    //   "28 de feb. de 2026"  → ES
    //   "4 de abril de 2026"  → ES
    //   "Feb 28, 2026"        → EN
    //   "February 28, 2026"   → EN
    let day, monthIdx, year;

    const esMatch = clean.match(/(\d{1,2})\s+de\s+([A-Za-záéíóúñ.]+)\s+de\s+(\d{4})/i);
    if (esMatch) {
      day = parseInt(esMatch[1], 10);
      const monthKey = esMatch[2].toLowerCase().replace(/\.$/, '');
      monthIdx = labels.months[monthKey] ?? labels.months[monthKey + '.'];
      year = parseInt(esMatch[3], 10);
    } else {
      const enMatch = clean.match(/([A-Za-z]+\.?)\s+(\d{1,2}),?\s+(\d{4})/);
      if (enMatch) {
        const monthKey = enMatch[1];
        monthIdx = labels.months[monthKey] ?? labels.months[monthKey.replace(/\.$/, '')];
        day = parseInt(enMatch[2], 10);
        year = parseInt(enMatch[3], 10);
      }
    }
    if (day == null || monthIdx == null || year == null) return null;
    const mm = String(monthIdx + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  function daysBetween(isoDate) {
    if (!isoDate) return null;
    const then = new Date(isoDate + 'T00:00:00');
    if (isNaN(then.getTime())) return null;
    return Math.max(0, Math.floor((Date.now() - then.getTime()) / 86400000));
  }

  return { detect, parseDate, daysBetween, ES, EN };
})();
