// Synapes Companion MV3 Background Service Worker
// Handles CORS-free fact harvesting, 1-click character cutout context menu, Offscreen WebCodecs & Native Messaging.

const CHARACTER_CUTOUT_MENU_ID = 'synapes-cutout-character-vault';
const NATIVE_HOST_NAME = 'com.synapes.native.ffmpeg';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CHARACTER_CUTOUT_MENU_ID,
    title: 'Tách nền & Lưu vào Character Consistency Vault (Synapes)',
    contexts: ['image'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== CHARACTER_CUTOUT_MENU_ID || !info.srcUrl) return;
  const existing = await chrome.storage.local.get('synapes_character_vault');
  const list = Array.isArray(existing.synapes_character_vault) ? existing.synapes_character_vault : [];
  list.unshift({
    id: `vault_${Date.now()}`,
    sourceImageUrl: info.srcUrl,
    pageUrl: info.pageUrl || '',
    cutoutMode: 'rembg-alpha-ready',
    savedAt: new Date().toISOString(),
  });
  await chrome.storage.local.set({ synapes_character_vault: list.slice(0, 30) });
});

async function harvestWikimediaAndWikiCorsFree(query) {
  const cleanQ = (query || '').trim();
  if (!cleanQ) {
    throw new Error('Empty query cannot be harvested.');
  }

  const [wikiRes, commonsRes] = await Promise.all([
    fetch(
      `https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQ)}&format=json&origin=*`,
      { signal: AbortSignal.timeout(8000) }
    ),
    fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(cleanQ)}&gsrlimit=6&prop=imageinfo&iiprop=url|mime&format=json&origin=*`,
      { signal: AbortSignal.timeout(8000) }
    ),
  ]);

  if (!wikiRes.ok && !commonsRes.ok) {
    throw new Error(`CORS-free harvest HTTP failure (${wikiRes.status}/${commonsRes.status})`);
  }

  const wikiJson = wikiRes.ok ? await wikiRes.json() : { query: { search: [] } };
  const commonsJson = commonsRes.ok ? await commonsRes.json() : { query: { pages: {} } };

  const pages = commonsJson?.query?.pages ? Object.values(commonsJson.query.pages) : [];
  const visuals = pages
    .map((p) => ({
      title: String(p.title || '').replace(/^File:/i, ''),
      url: p.imageinfo?.[0]?.url || '',
      mime: p.imageinfo?.[0]?.mime || '',
    }))
    .filter((v) => v.url && v.mime.startsWith('image/'));

  return {
    query: cleanQ,
    wikiHits: (wikiJson?.query?.search || []).slice(0, 3),
    visuals,
  };
}

async function ensureOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (contexts.length > 0) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['BLOBS', 'WORKERS'],
    justification: 'Encode WebCodecs H.264/AAC video frames without blocking active UI tab or leaking memory.',
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'HARVEST_TOPIC_DATA') {
    harvestWikimediaAndWikiCorsFree(message.query)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((err) => sendResponse({ ok: false, error: err?.message || 'Harvest failed' }));
    return true;
  }

  if (message?.type === 'DISPATCH_EXTRACTED_DNA') {
    chrome.storage.local.get('synapes_dna_queue').then(async (store) => {
      const queue = Array.isArray(store.synapes_dna_queue) ? store.synapes_dna_queue : [];
      queue.unshift(message.payload);
      await chrome.storage.local.set({ synapes_dna_queue: queue.slice(0, 20) });
      sendResponse({ ok: true, count: queue.length });
    });
    return true;
  }

  if (message?.type === 'START_OFFSCREEN_WEBCODECS_EXPORT') {
    ensureOffscreenDocument()
      .then(() => chrome.runtime.sendMessage({ target: 'offscreen', ...message }))
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ ok: false, error: err?.message || 'Offscreen export failed' }));
    return true;
  }

  if (message?.type === 'NATIVE_FFMPEG_MUX') {
    try {
      chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, message.payload, (nativeRes) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ ok: true, nativeRes });
        }
      });
    } catch (err) {
      sendResponse({ ok: false, error: err?.message || 'Native host unavailable' });
    }
    return true;
  }
});
