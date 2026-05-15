/**
 * MetaDash Spy — Service Worker
 *
 * Mínimo: solo expone helpers para el historial de escaneos.
 * El historial se guarda en chrome.storage.local (no sync — los reportes pueden pesar).
 */

const HISTORY_KEY = 'mdspy_history';
const HISTORY_MAX = 20;

async function getHistory() {
  const data = await chrome.storage.local.get(HISTORY_KEY);
  return data[HISTORY_KEY] || [];
}

async function saveToHistory(entry) {
  const history = await getHistory();
  const minimal = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    scraped_at: entry.meta?.scraped_at,
    search_query: entry.meta?.search_query,
    page_name: entry.meta?.page_name,
    total_detected: entry.meta?.total_detected,
    summary: entry.summary,
  };
  history.unshift(minimal);
  if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
  await chrome.storage.local.set({ [HISTORY_KEY]: history });
  return minimal;
}

async function clearHistory() {
  await chrome.storage.local.set({ [HISTORY_KEY]: [] });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === 'history.get') {
        sendResponse({ ok: true, history: await getHistory() });
      } else if (request.action === 'history.save') {
        const saved = await saveToHistory(request.entry);
        sendResponse({ ok: true, entry: saved });
      } else if (request.action === 'history.clear') {
        await clearHistory();
        sendResponse({ ok: true });
      }
    } catch (e) {
      sendResponse({ ok: false, error: String(e?.message || e) });
    }
  })();
  return true; // async response
});
