/**
 * MetaDash Spy — Auto Analyzer
 *
 * Recibe el array de ads parseados y devuelve inteligencia accionable:
 *   - Señales de scaling (ads viejos rentables, mucha variación, volumen)
 *   - Patrones de hooks (frases repetidas → control del competidor)
 *   - Winner probable (más variaciones = más scaling)
 *   - Prioridad de descarga (qué videos analizar primero)
 */

const MDSpyAnalyzer = (() => {

  function summarize(ads) {
    const videos = ads.filter(a => a.media_type === 'video').length;
    const images = ads.filter(a => a.media_type === 'image').length;
    const carousels = ads.filter(a => a.media_type === 'carousel').length;
    const unknown = ads.filter(a => a.media_type === 'unknown').length;

    const withDate = ads.filter(a => a.start_date_iso).sort((a, b) => a.start_date_iso.localeCompare(b.start_date_iso));
    const oldest = withDate[0] || null;
    const newest = withDate[withDate.length - 1] || null;

    const platforms = new Set();
    for (const a of ads) {
      for (const p of a.platforms || []) platforms.add(p);
    }

    return {
      total: ads.length,
      videos,
      images,
      carousels,
      unknown,
      oldest_ad_date: oldest?.start_date_iso || null,
      oldest_ad_days: oldest?.days_active || null,
      oldest_ad_id: oldest?.library_id || null,
      newest_ad_date: newest?.start_date_iso || null,
      ads_with_5plus_variations: ads.filter(a => (a.variation_count || 0) >= 5).length,
      ads_with_10plus_variations: ads.filter(a => (a.variation_count || 0) >= 10).length,
      max_variations: ads.reduce((m, a) => Math.max(m, a.variation_count || 0), 0),
      platforms: Array.from(platforms),
    };
  }

  function scalingSignals(ads, summary) {
    const out = [];
    if (summary.oldest_ad_days != null && summary.oldest_ad_days > 90) {
      out.push(`Ad más viejo activo hace ${summary.oldest_ad_days} días — oro puro, ganador comprobado`);
    } else if (summary.oldest_ad_days != null && summary.oldest_ad_days > 60) {
      out.push(`Ad sobrevive ${summary.oldest_ad_days} días — scaling rentable confirmado`);
    } else if (summary.oldest_ad_days != null && summary.oldest_ad_days > 30) {
      out.push(`Ad activo hace ${summary.oldest_ad_days} días — empezó a funcionar`);
    }
    if (summary.max_variations >= 10) {
      out.push(`${summary.max_variations} variaciones del mismo contenido — duplicación masiva del ganador`);
    } else if (summary.max_variations >= 5) {
      out.push(`${summary.max_variations} variaciones del control — testing activo de un winner`);
    }
    if (ads.length >= 50) {
      out.push(`${ads.length}+ ads detectados — operación seria de adquisición paga`);
    } else if (ads.length >= 20) {
      out.push(`${ads.length} ads activos — están escalando algo que funciona`);
    } else if (ads.length >= 5) {
      out.push(`${ads.length} ads activos — testing en marcha, algo encontraron`);
    } else {
      out.push(`Solo ${ads.length} ads activos — todavía en fase de test temprano`);
    }
    return out;
  }

  function normalizeHook(text) {
    if (!text) return '';
    return text
      .slice(0, 80)
      .replace(/[^\p{L}\p{N}\s¿?¡!]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  function hookPatterns(ads) {
    const map = new Map();
    for (const ad of ads) {
      const key = normalizeHook(ad.ad_text);
      if (!key || key.length < 15) continue;
      const prev = map.get(key) || {
        hook: ad.ad_text.split('\n')[0].slice(0, 100),
        frequency: 0,
        max_variations: 0,
        sample_id: ad.library_id,
      };
      prev.frequency += 1;
      prev.max_variations = Math.max(prev.max_variations, ad.variation_count || 1);
      if ((ad.variation_count || 1) > prev.max_variations - 0.1) prev.sample_id = ad.library_id;
      map.set(key, prev);
    }
    return Array.from(map.values())
      .sort((a, b) => (b.max_variations * 10 + b.frequency) - (a.max_variations * 10 + a.frequency))
      .slice(0, 8);
  }

  function detectWinner(ads) {
    if (!ads.length) return null;
    return ads.reduce((max, ad) =>
      (ad.variation_count || 1) > (max.variation_count || 1) ? ad : max
    , ads[0]);
  }

  function downloadPriority(ads, winner) {
    const out = [];
    if (winner) {
      out.push({
        library_id: winner.library_id,
        reason: `Winner probable — ${winner.variation_count} variaciones del mismo contenido`,
        hook_preview: (winner.ad_text || '').split('\n')[0].slice(0, 80),
      });
    }
    const withDate = ads.filter(a => a.start_date_iso).sort((a, b) => a.start_date_iso.localeCompare(b.start_date_iso));
    const oldest = withDate[0];
    if (oldest && oldest.library_id !== winner?.library_id) {
      out.push({
        library_id: oldest.library_id,
        reason: `Ad más viejo activo — ${oldest.days_active} días corriendo`,
        hook_preview: (oldest.ad_text || '').split('\n')[0].slice(0, 80),
      });
    }
    // Tercer candidato: ad con 2-5 variaciones reciente (nuevo test)
    const recentTest = ads.find(a =>
      a.library_id !== winner?.library_id &&
      a.library_id !== oldest?.library_id &&
      (a.variation_count || 0) >= 2 &&
      (a.variation_count || 0) <= 5
    );
    if (recentTest) {
      out.push({
        library_id: recentTest.library_id,
        reason: `${recentTest.variation_count} variaciones — posible nuevo ángulo en test`,
        hook_preview: (recentTest.ad_text || '').split('\n')[0].slice(0, 80),
      });
    }
    return out;
  }

  function analyze(ads) {
    if (!ads || ads.length === 0) {
      return {
        summary: { total: 0 },
        scaling_signals: [],
        hook_patterns: [],
        probable_winner: null,
        download_priority: [],
      };
    }
    const summary = summarize(ads);
    return {
      summary,
      scaling_signals: scalingSignals(ads, summary),
      hook_patterns: hookPatterns(ads),
      probable_winner: detectWinner(ads),
      download_priority: downloadPriority(ads, detectWinner(ads)),
    };
  }

  return { analyze };
})();
