// YouTube / TikTok DNA & Chapter / Transcript Extractor Content Script
(function injectSynapesDnaButton() {
  const BTN_ID = 'synapes-dna-extract-btn';

  function extractPageDna() {
    const url = window.location.href;
    const isTikTok = url.includes('tiktok.com');
    const titleEl =
      document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
      document.querySelector('h1') ||
      document.querySelector('title');
    const title = (titleEl?.textContent || document.title || '').trim();

    const chapterEls = Array.from(document.querySelectorAll('ytd-macro-markers-list-item-renderer'));
    const chapters = chapterEls
      .map((el) => ({
        label: (el.querySelector('#details h4')?.textContent || '').trim(),
        time: (el.querySelector('#time')?.textContent || '').trim(),
      }))
      .filter((c) => c.label);

    const videoEl = document.querySelector('video');
    const durationSec = videoEl && Number.isFinite(videoEl.duration) ? Math.round(videoEl.duration) : 60;

    return {
      sourceUrl: url,
      platform: isTikTok ? 'tiktok' : 'youtube',
      title,
      durationSec,
      chapters,
      capturedAt: new Date().toISOString(),
    };
  }

  function ensureButton() {
    if (document.getElementById(BTN_ID)) return;
    const host =
      document.querySelector('#top-row.ytd-watch-metadata #actions') ||
      document.querySelector('#above-the-fold #title') ||
      document.body;
    if (!host) return;

    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.textContent = '🎬 Bóc Tách DNA & Chuyển Về Synapes Studio';
    btn.style.cssText = [
      'margin: 6px 8px;',
      'padding: 7px 14px;',
      'border-radius: 999px;',
      'background: #09090b;',
      'color: #ffffff;',
      'font-size: 12px;',
      'font-weight: 700;',
      'border: 1px solid rgba(56,189,248,0.6);',
      'cursor: pointer;',
      'z-index: 99999;',
    ].join('');

    btn.addEventListener('click', () => {
      const dnaPayload = extractPageDna();
      btn.textContent = '⏳ Đang gửi DNA sang Synapes...';
      chrome.runtime.sendMessage({ type: 'DISPATCH_EXTRACTED_DNA', payload: dnaPayload }, (res) => {
        if (chrome.runtime.lastError || !res?.ok) {
          btn.textContent = '⚠ Mở popup Synapes để cấu hình URL Studio';
        } else {
          btn.textContent = '✅ Đã lưu DNA vào hàng đợi Synapes!';
        }
        setTimeout(() => {
          btn.textContent = '🎬 Bóc Tách DNA & Chuyển Về Synapes Studio';
        }, 3200);
      });
    });

    if (host === document.body) {
      btn.style.position = 'fixed';
      btn.style.bottom = '18px';
      btn.style.right = '18px';
    }
    host.appendChild(btn);
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'EXTRACT_CURRENT_TAB_DNA') {
      sendResponse({ ok: true, payload: extractPageDna() });
    }
  });

  ensureButton();
  const observer = new MutationObserver(() => ensureButton());
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
