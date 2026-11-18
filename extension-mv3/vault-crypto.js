// Zero-Trust AES-GCM 256-bit BYOK Vault (PBKDF2 100,000 iterations)
// Plaintext API keys stay encrypted in chrome.storage.local and never leave the browser unencrypted.

const VAULT_STORAGE_KEY = 'synapes_encrypted_byok_vault_v1';
const PBKDF2_ITERATIONS = 100000;

async function deriveAesKey(passphrase, saltBytes) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function saveEncryptedVault(passphrase, payloadObj) {
  if (!passphrase || passphrase.length < 4) {
    throw new Error('Passphrase must be at least 4 characters.');
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveAesKey(passphrase, salt);
  const encoded = new TextEncoder().encode(JSON.stringify(payloadObj));
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);

  const record = {
    salt: Array.from(salt),
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(cipherBuf)),
    updatedAt: Date.now(),
  };
  await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: record });
  return record;
}

export async function unlockEncryptedVault(passphrase) {
  const data = await chrome.storage.local.get(VAULT_STORAGE_KEY);
  const record = data[VAULT_STORAGE_KEY];
  if (!record) return null;

  const salt = new Uint8Array(record.salt);
  const iv = new Uint8Array(record.iv);
  const cipherBytes = new Uint8Array(record.ciphertext);
  const aesKey = await deriveAesKey(passphrase, salt);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, cipherBytes);
  return JSON.parse(new TextDecoder().decode(plainBuf));
}
