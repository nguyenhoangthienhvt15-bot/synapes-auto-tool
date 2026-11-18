import { saveEncryptedVault, unlockEncryptedVault } from './vault-crypto.js';

const passInput = document.getElementById('vault-pass');
const keyInput = document.getElementById('vault-key');
const saveBtn = document.getElementById('save-vault-btn');
const extractBtn = document.getElementById('extract-dna-btn');
const statusEl = document.getElementById('status');

saveBtn?.addEventListener('click', async () => {
  try {
    const pass = (passInput?.value || '').trim();
    const apiKey = (keyInput?.value || '').trim();
    if (!apiKey) {
      const unlocked = await unlockEncryptedVault(pass);
      statusEl.textContent = unlocked
        ? `Vault đã mở khóa (${unlocked.updatedAt || 'OK'}).`
        : 'Chưa có key nào được lưu trong Vault.';
      return;
    }
    await saveEncryptedVault(pass, { geminiKey: apiKey, updatedAt: new Date().toISOString() });
    statusEl.textContent = 'Đã mã hóa AES-GCM & lưu BYOK Key cục bộ an toàn!';
    if (keyInput) keyInput.value = '';
  } catch (err) {
    statusEl.textContent = `Lỗi Vault: ${err?.message || 'Sai passphrase'}`;
  }
});

extractBtn?.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('Không tìm thấy tab đang mở.');
    chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_CURRENT_TAB_DNA' }, (res) => {
      if (chrome.runtime.lastError || !res?.ok) {
        statusEl.textContent = 'Mở video YouTube hoặc TikTok để bóc tách DNA.';
      } else {
        chrome.runtime.sendMessage({ type: 'DISPATCH_EXTRACTED_DNA', payload: res.payload });
        statusEl.textContent = `Đã bóc tách DNA: ${res.payload.title?.slice(0, 48)} (${res.payload.durationSec}s)`;
      }
    });
  } catch (err) {
    statusEl.textContent = err?.message || 'Lỗi trích xuất DNA';
  }
});
