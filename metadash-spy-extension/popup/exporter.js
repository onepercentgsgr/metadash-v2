/**
 * MetaDash Spy — Exporters (TXT / JSON / CSV)
 *
 * El TXT está optimizado para pegarlo en Claude o subirlo a MetaDash:
 * lenguaje natural, secciones claras, análisis automático al final.
 */

const MDSpyExporter = (() => {

  function fmtDate(iso) {
    if (!iso) return new Date().toISOString().slice(0, 19).replace('T', ' ');
    try {
      const d = new Date(iso);
      return d.toISOString().slice(0, 19).replace('T', ' ');
    } catch (_) {
      return iso;
    }
  }

  function safeFilename(s) {
    return (s || 'metadash-spy')
      .replace(/[^\w\d-_]/g, '_')
      .slice(0, 60);
  }

  function toTxt(report) {
    const m = report.meta || {};
    const s = report.summary || {};
    const a = report.analysis || {};
    const ads = report.ads || [];

    const lines = [];
    lines.push('===========================================');
    lines.push('REPORTE DE BIBLIOTECA DE ANUNCIOS — METADASH SPY');
    lines.push('===========================================');
    lines.push(`Fecha de escaneo: ${fmtDate(m.scraped_at)}`);
    if (m.search_query) lines.push(`Búsqueda: ${m.search_query}`);
    if (m.page_name) lines.push(`Página detectada: ${m.page_name}`);
    lines.push(`Total de anuncios detectados: ${m.total_detected || 0}${m.total_estimated ? ` (de ~${m.total_estimated} estimados)` : ''}`);
    lines.push('');

    lines.push('--- RESUMEN EJECUTIVO ---');
    lines.push(`Videos: ${s.videos || 0} | Imágenes: ${s.images || 0} | Carruseles: ${s.carousels || 0}${s.unknown ? ` | Sin clasificar: ${s.unknown}` : ''}`);
    if (s.oldest_ad_date) {
      lines.push(`Ad más antiguo activo: ${s.oldest_ad_date}${s.oldest_ad_days ? ` (${s.oldest_ad_days} días)` : ''}`);
    }
    if (s.ads_with_5plus_variations) lines.push(`Ads con +5 variaciones: ${s.ads_with_5plus_variations} (señal de scaling)`);
    if (s.ads_with_10plus_variations) lines.push(`Ads con +10 variaciones: ${s.ads_with_10plus_variations} (señal de scaling fuerte)`);
    if (s.max_variations) lines.push(`Máximo de variaciones en un solo contenido: ${s.max_variations}`);
    if (s.platforms?.length) lines.push(`Plataformas: ${s.platforms.join(', ')}`);
    lines.push('');

    // Ordenar ads por antigüedad (más viejo primero)
    const sorted = [...ads].sort((x, y) => {
      const dx = x.start_date_iso || '9999';
      const dy = y.start_date_iso || '9999';
      return dx.localeCompare(dy);
    });

    lines.push('--- ANUNCIOS (ordenados por antigüedad, más viejo primero) ---');
    lines.push('');
    sorted.forEach((ad, i) => {
      lines.push(`[AD #${i + 1}]`);
      lines.push(`ID: ${ad.library_id}`);
      if (ad.status) lines.push(`Estado: ${ad.status}`);
      if (ad.start_date) {
        const days = ad.days_active != null ? ` (${ad.days_active} días)` : '';
        lines.push(`Activo desde: ${ad.start_date}${days}`);
      }
      if (ad.media_type) lines.push(`Tipo: ${ad.media_type}`);
      if (ad.variation_count) lines.push(`Variaciones: ${ad.variation_count}`);
      if (ad.platforms?.length) lines.push(`Plataformas: ${ad.platforms.join(', ')}`);
      if (ad.page_name) lines.push(`Página: ${ad.page_name}`);
      if (ad.ad_text) {
        lines.push('Copy:');
        ad.ad_text.split('\n').forEach(l => lines.push(`  ${l}`));
      }
      if (ad.cta_text) lines.push(`CTA: ${ad.cta_text}`);
      if (ad.destination_url) lines.push(`URL destino: ${ad.destination_url}`);
      if (ad.extra_text) lines.push(`Nota: ${ad.extra_text}`);
      lines.push('---');
      lines.push('');
    });

    lines.push('--- ANÁLISIS AUTOMÁTICO ---');
    lines.push('');
    if (a.scaling_signals?.length) {
      lines.push('SEÑALES DE SCALING:');
      a.scaling_signals.forEach(sig => lines.push(`- ${sig}`));
      lines.push('');
    }
    if (a.hook_patterns?.length) {
      lines.push('HOOKS DETECTADOS (patrones repetidos):');
      a.hook_patterns.forEach((h, i) => {
        lines.push(`${i + 1}. "${h.hook}" — frecuencia: ${h.frequency}, max variaciones: ${h.max_variations}`);
      });
      lines.push('');
    }
    if (a.probable_winner) {
      lines.push('WINNER PROBABLE:');
      lines.push(`ID: ${a.probable_winner.library_id}`);
      if (a.probable_winner.hook) lines.push(`Hook: "${a.probable_winner.hook}"`);
      if (a.probable_winner.variation_count) lines.push(`Variaciones: ${a.probable_winner.variation_count}`);
      if (a.probable_winner.days_active != null) lines.push(`Días activo: ${a.probable_winner.days_active}`);
      lines.push(`Razón: ${a.probable_winner.reason}`);
      lines.push('');
    }
    if (a.download_priority?.length) {
      lines.push('RECOMENDACIÓN PARA DESCARGA DE VIDEO:');
      a.download_priority.forEach((p, i) => {
        const arrow = i === 0 ? 'primero' : i === 1 ? 'segundo' : 'tercero';
        lines.push(`→ Descargar ${arrow}: ID ${p.library_id} — ${p.reason}`);
        if (p.hook_preview) lines.push(`   "${p.hook_preview}"`);
      });
      lines.push('');
    }
    lines.push('===========================================');
    lines.push(`Generado por MetaDash Spy Extension v1.0`);
    lines.push('===========================================');
    return lines.join('\n');
  }

  function toJson(report) {
    return JSON.stringify(report, null, 2);
  }

  function toCsv(report) {
    const ads = report.ads || [];
    const header = [
      'library_id', 'status', 'start_date_iso', 'days_active', 'media_type',
      'variation_count', 'page_name', 'cta_text', 'destination_url',
      'platforms', 'hook_preview', 'extra_text'
    ];
    const rows = [header.join(',')];
    for (const ad of ads) {
      const hookPreview = (ad.ad_text || '').split('\n')[0].slice(0, 120);
      const row = [
        ad.library_id,
        ad.status,
        ad.start_date_iso || '',
        ad.days_active ?? '',
        ad.media_type,
        ad.variation_count || 1,
        ad.page_name || '',
        ad.cta_text || '',
        ad.destination_url || '',
        (ad.platforms || []).join('|'),
        hookPreview,
        ad.extra_text || '',
      ].map(v => {
        const s = String(v);
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      });
      rows.push(row.join(','));
    }
    return rows.join('\n');
  }

  function download(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportAs(format, report) {
    const tag = safeFilename(report.meta?.page_name || report.meta?.search_query || 'spy');
    const stamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
    const base = `metadash-spy_${tag}_${stamp}`;
    if (format === 'txt') {
      download(`${base}.txt`, toTxt(report), 'text/plain;charset=utf-8');
    } else if (format === 'json') {
      download(`${base}.json`, toJson(report), 'application/json;charset=utf-8');
    } else if (format === 'csv') {
      download(`${base}.csv`, toCsv(report), 'text/csv;charset=utf-8');
    }
  }

  return { exportAs, toTxt, toJson, toCsv };
})();
