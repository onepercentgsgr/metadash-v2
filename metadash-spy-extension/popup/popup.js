/**
 * MetaDash Spy — Popup
 *
 * Detecta el estado de la pestaña activa, comunica con el content script,
 * muestra el resumen y dispara las exportaciones.
 */

const $ = (id) => document.getElementById(id);

let currentReport = null;
let activeTabId = null;

const ADS_LIB_URL = /^https:\/\/www\.facebook\.com\/ads\/library\//i;

function showState(name) {
  ['state-off', 'state-ready', 'state-result', 'state-error'].forEach((id) => {
    $(id).classList.toggle('hidden', id !== `state-${name}`);
  });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToContent(action, payload = {}) {
  if (!activeTabId) throw new Error('No active tab');
  return await chrome.tabs.sendMessage(activeTabId, { action, ...payload });
}

function extractQueryFromUrl(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get('q') || u.searchParams.get('view_all_page_id') || '';
  } catch (_) { return ''; }
}

function paintReady(url) {
  const q = extractQueryFromUrl(url);
  $('current-query').textContent = q || '(sin búsqueda activa)';
}

function paintResult(report) {
  const m = report.meta || {};
  const s = report.summary || {};
  const a = report.analysis || {};

  $('r-total').textContent = m.total_detected || 0;
  $('r-query').textContent = (m.search_query || m.page_name || '(sin búsqueda)').slice(0, 50);
  $('r-videos').textContent = s.videos || 0;
  $('r-images').textContent = s.images || 0;
  $('r-oldest').textContent = s.oldest_ad_days != null ? `${s.oldest_ad_days}d` : '—';
  $('r-maxvar').textContent = s.max_variations || 0;

  // Señales
  const signalsBlock = $('signals-block');
  const signalsList = $('signals-list');
  signalsList.innerHTML = '';
  if (a.scaling_signals?.length) {
    signalsBlock.classList.remove('hidden');
    for (const sig of a.scaling_signals) {
      const li = document.createElement('li');
      li.textContent = sig;
      signalsList.appendChild(li);
    }
  } else {
    signalsBlock.classList.add('hidden');
  }

  // Winner
  const winnerBlock = $('winner-block');
  if (a.probable_winner) {
    winnerBlock.classList.remove('hidden');
    $('winner-hook').textContent = `"${a.probable_winner.hook || '(sin hook visible)'}"`;
    const parts = [];
    if (a.probable_winner.variation_count) parts.push(`${a.probable_winner.variation_count} variaciones`);
    if (a.probable_winner.days_active != null) parts.push(`${a.probable_winner.days_active}d activo`);
    parts.push(`ID ${a.probable_winner.library_id}`);
    $('winner-meta').textContent = parts.join(' · ');
  } else {
    winnerBlock.classList.add('hidden');
  }
}

async function runScan() {
  $('scan-progress').classList.remove('hidden');
  $('btn-scan').disabled = true;
  try {
    // Intento normal — si el content script ya está cargado, responde rápido
    let resp;
    try {
      resp = await sendToContent('scan');
    } catch (_) {
      // Si no está cargado (manifest no inyectado todavía), forzar
      await chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        files: [
          'content/i18n.js',
          'content/parser.js',
          'content/analyzer.js',
          'content/content.js',
        ],
      }).catch(() => { /* puede fallar si no hay permiso scripting; está OK */ });
      await new Promise(r => setTimeout(r, 200));
      resp = await sendToContent('scan');
    }

    if (!resp?.ok) throw new Error(resp?.error || 'No se pudo escanear el DOM');

    currentReport = resp.report;

    if ((currentReport.meta?.total_detected || 0) === 0) {
      showState('error');
      $('error-msg').textContent =
        'No detecté anuncios en la página. Confirmá que cargaron resultados ' +
        '(scrolleá un poco) y volvé a escanear.';
      return;
    }

    paintResult(currentReport);
    showState('result');

    // Guardar en historial
    chrome.runtime.sendMessage({ action: 'history.save', entry: currentReport })
      .then(() => loadHistory())
      .catch(() => {});
  } catch (e) {
    showState('error');
    $('error-msg').textContent = e?.message || 'Error desconocido';
  } finally {
    $('scan-progress').classList.add('hidden');
    $('btn-scan').disabled = false;
  }
}

async function loadHistory() {
  try {
    const resp = await chrome.runtime.sendMessage({ action: 'history.get' });
    const list = $('history-list');
    list.innerHTML = '';
    const history = resp?.history || [];
    if (history.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'history-empty';
      empty.textContent = 'Sin escaneos guardados todavía.';
      list.appendChild(empty);
      return;
    }
    for (const h of history) {
      const li = document.createElement('li');
      const date = h.scraped_at ? new Date(h.scraped_at) : null;
      const dateStr = date ? `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}` : '—';
      li.innerHTML = `
        <span class="h-query" title="${(h.search_query || h.page_name || '').replace(/"/g, '&quot;')}">${h.page_name || h.search_query || '(sin búsqueda)'}</span>
        <span class="h-count">${h.total_detected || 0}</span>
        <span class="h-date">${dateStr}</span>
      `;
      list.appendChild(li);
    }
  } catch (_) {}
}

async function init() {
  const tab = await getActiveTab();
  activeTabId = tab?.id;

  if (!tab?.url || !ADS_LIB_URL.test(tab.url)) {
    showState('off');
    loadHistory();
    return;
  }

  paintReady(tab.url);
  showState('ready');
  loadHistory();
}

// Wiring
document.addEventListener('DOMContentLoaded', () => {
  $('btn-scan').addEventListener('click', runScan);
  $('btn-rescan').addEventListener('click', () => {
    showState('ready');
    getActiveTab().then(t => t?.url && paintReady(t.url));
  });
  $('btn-retry').addEventListener('click', init);

  document.querySelectorAll('[data-export]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const format = btn.getAttribute('data-export');
      if (currentReport && format) {
        MDSpyExporter.exportAs(format, currentReport);
      }
    });
  });

  $('btn-clear-history').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ action: 'history.clear' });
    loadHistory();
  });

  init();
});
