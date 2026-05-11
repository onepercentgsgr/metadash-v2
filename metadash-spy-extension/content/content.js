/**
 * MetaDash Spy — Content Script
 *
 * Recibe mensajes del popup y orquesta el scan + analyze.
 * NO hace auto-scroll. NO hace requests. Solo lee el DOM visible.
 */

(function () {
  if (window.__metaDashSpyInstalled) return;
  window.__metaDashSpyInstalled = true;

  function buildReport() {
    const { ads, language } = MDSpyParser.scan();
    const analysis = MDSpyAnalyzer.analyze(ads);
    return {
      meta: {
        scraped_at: new Date().toISOString(),
        url: window.location.href,
        search_query: MDSpyParser.getSearchQuery(),
        total_detected: ads.length,
        total_estimated: MDSpyParser.estimateTotal(),
        page_name: analysis.probable_winner?.page_name || (ads[0]?.page_name || ''),
        language,
      },
      summary: analysis.summary,
      ads,
      analysis: {
        scaling_signals: analysis.scaling_signals,
        hook_patterns: analysis.hook_patterns,
        probable_winner: analysis.probable_winner
          ? {
              library_id: analysis.probable_winner.library_id,
              hook: (analysis.probable_winner.ad_text || '').split('\n')[0].slice(0, 120),
              variation_count: analysis.probable_winner.variation_count,
              days_active: analysis.probable_winner.days_active,
              reason: `${analysis.probable_winner.variation_count} variaciones — máxima duplicación del control`,
            }
          : null,
        download_priority: analysis.download_priority,
      },
    };
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      if (request.action === 'ping') {
        sendResponse({ ok: true, version: '1.0.0' });
        return false;
      }
      if (request.action === 'scan') {
        const report = buildReport();
        sendResponse({ ok: true, report });
        return false;
      }
      if (request.action === 'quick_count') {
        const { ads } = MDSpyParser.scan();
        sendResponse({ ok: true, count: ads.length });
        return false;
      }
    } catch (e) {
      console.error('[MetaDash Spy] content error:', e);
      sendResponse({ ok: false, error: String(e?.message || e) });
    }
    return false;
  });
})();
