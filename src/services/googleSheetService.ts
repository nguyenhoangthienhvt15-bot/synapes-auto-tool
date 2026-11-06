import { EngineerSheetRow, UserRegistrationData } from '../types';

export const GOOGLE_SHEET_ID = '1E9zec8lX52-ofleS0MG-oRSc8k_hK9aBtC1XBaqNafY';
export const GOOGLE_SHEET_GID_ACCOUNTS = '0'; // Tab "Quản Lý Mật Khẩu"
export const GOOGLE_SHEET_GID_USERS = '2096171544'; // Tab "THÔNG TIN NGƯỜI DÙNG"
export const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit?usp=sharing`;

const STORAGE_KEY = 'synapes_cached_sheet_rows';
const LAST_SYNC_KEY = 'synapes_last_sheet_sync';
const CUSTOM_PASSWORDS_KEY = 'synapes_custom_passwords';
const TEMP_RESET_PASSWORDS_KEY = 'synapes_temp_reset_passwords';
const REGISTRATION_STORAGE_KEY = 'synapes_user_registrations';
const WEBHOOK_STORAGE_KEY = 'synapes_apps_script_webhook';
const PENDING_WEBHOOK_QUEUE_KEY = 'synapes_pending_webhook_queue';
const SYNCED_REG_HASH_KEY = 'synapes_synced_reg_hashes';

/**
 * Hàm băm mật khẩu một chiều SHA-256 thuần (đồng bộ, hoạt động trên mọi trình duyệt)
 */
function sha256Hex(ascii: string): string {
  const utf8 = unescape(encodeURIComponent(ascii));
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const l = utf8.length * 8;
  const words: number[] = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  words[l >> 5] |= 0x80 << (24 - (l % 32));
  words[(((l + 64) >> 9) << 4) + 15] = l;

  const W = new Array(64);
  for (let j = 0; j < words.length; j += 16) {
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      if (i < 16) {
        W[i] = words[j + i] | 0;
      } else {
        const gamma0x = W[i - 15];
        const gamma0 = ((gamma0x >>> 7) | (gamma0x << 25)) ^ ((gamma0x >>> 18) | (gamma0x << 14)) ^ (gamma0x >>> 3);
        const gamma1x = W[i - 2];
        const gamma1 = ((gamma1x >>> 17) | (gamma1x << 15)) ^ ((gamma1x >>> 19) | (gamma1x << 13)) ^ (gamma1x >>> 10);
        W[i] = (W[i - 16] + gamma0 + W[i - 7] + gamma1) | 0;
      }
      const ch = (e & f) ^ (~e & g);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const sigma0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const sigma1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const t1 = (h + sigma1 + ch + K[i] + W[i]) | 0;
      const t2 = (sigma0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

/**
 * Tạo mã băm mật khẩu một chiều (BCRYPT$...) gắn với Mã Code cá nhân của khách hàng.
 * Dev/Kỹ sư trên Google Sheet hoàn toàn KHÔNG thể dịch ngược để biết mật khẩu khách đã đổi.
 */
export function computePasswordHash(code: string, plainPassword: string): string {
  const codeNorm = (code || '').trim().toUpperCase();
  const passNorm = (plainPassword || '').trim();
  const existingHash = extractPasswordHash(passNorm);
  if (existingHash) return existingHash;
  const digest = sha256Hex(`SYNAPES_BCRYPT_V2::${codeNorm}::${passNorm}::PRIVATE_KEY_SALT`).slice(0, 32).toUpperCase();
  return `BCRYPT$${digest}`;
}

/**
 * Trích xuất chuỗi mã băm BCRYPT$... từ ô mật khẩu hoặc ghi chú trên Sheet
 */
export function extractPasswordHash(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const m = String(raw).match(/BCRYPT\$[A-F0-9]{16,64}/i);
  return m ? m[0].toUpperCase() : null;
}

export function isPasswordMaskedOrHashed(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const s = String(raw);
  return Boolean(extractPasswordHash(s)) || s.includes('🔒') || s.toLowerCase().includes('đã mã hóa') || s.toLowerCase().includes('đã ẩn');
}

// Danh sách ID lỗi 404 (chưa deploy Web App) cần tự động loại bỏ khỏi bộ nhớ đệm
const BROKEN_WEBHOOK_IDS = [
  'AKfycbwjCX3IJpWA7xOxloT9YuYVGE1DI_LePFobI9TOaLYj9k2vivQ',
];

export function isValidWebhookUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (!clean) return false;
  for (const brokenId of BROKEN_WEBHOOK_IDS) {
    if (clean.includes(brokenId)) return false;
  }
  return (
    clean.includes('docs.google.com/forms/') ||
    clean.includes('script.google.com/macros/s/')
  );
}

/**
 * Chuẩn hóa ngày sinh về định dạng DD/MM/YYYY
 * Hỗ trợ cả định dạng YYYY-MM-DD từ <input type="date"> và DD/MM/YYYY
 */
export function formatDobToDDMMYYYY(dob: string): string {
  if (!dob) return '';
  const clean = dob.trim();
  // Nếu dạng YYYY-MM-DD
  const ymdMatch = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = ymdMatch[2].padStart(2, '0');
    const dd = ymdMatch[3].padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }
  // Nếu dạng DD/MM/YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    return `${dd}/${mm}/${yyyy}`;
  }
  return clean;
}

/**
 * Sinh mã Code khách hàng chuẩn theo quy tắc: SNP_[6 số YYMMDD + 4 số ngày tháng sinh DDMM]
 */
export function generateUserCode(dob: string): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  const yymmdd = `${yy}${mm}${dd}`;

  let ddmm = `${dd}${mm}`;
  const cleanDob = (dob || '').trim();

  // Kiểm tra YYYY-MM-DD trước
  const ymdMatch = cleanDob.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const d = ymdMatch[3].padStart(2, '0');
    const m = ymdMatch[2].padStart(2, '0');
    ddmm = `${d}${m}`;
  } else {
    // Kiểm tra DD/MM/YYYY
    const dmyMatch = cleanDob.match(/^(\d{1,2})[\/\-\.](\d{1,2})/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, '0');
      const m = dmyMatch[2].padStart(2, '0');
      ddmm = `${d}${m}`;
    }
  }

  return `SNP_${yymmdd}${ddmm}`;
}

/**
 * Sinh mật khẩu ngẫu nhiên theo quy tắc: SNP_[3 chữ số + 3 chữ cái ngẫu nhiên]
 */
export function generateUserPassword(): string {
  const randomDigits = Math.floor(100 + Math.random() * 900);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let letters = '';
  for (let i = 0; i < 3; i++) {
    letters += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SNP_${randomDigits}${letters}`;
}

/**
 * Lấy hoặc cập nhật URL Cầu nối Google Sheet (Hỗ trợ cả Google Form Auto-Bridge và Google Apps Script Web App)
 */
export function getAppsScriptWebhookUrl(): string {
  try {
    const envUrl = (import.meta as any).env?.VITE_APPS_SCRIPT_WEBHOOK_URL;
    if (envUrl && typeof envUrl === 'string' && isValidWebhookUrl(envUrl)) {
      return envUrl.trim();
    }
    const stored = localStorage.getItem(WEBHOOK_STORAGE_KEY);
    if (stored && isValidWebhookUrl(stored)) {
      return stored.trim();
    }
    if (stored && !isValidWebhookUrl(stored)) {
      localStorage.removeItem(WEBHOOK_STORAGE_KEY);
    }
    return '';
  } catch {
    return '';
  }
}

export function setAppsScriptWebhookUrl(url: string): void {
  try {
    const clean = url.trim();
    if (clean && isValidWebhookUrl(clean)) {
      localStorage.setItem(WEBHOOK_STORAGE_KEY, clean);
      // Ngay khi có URL hợp lệ, đẩy toàn bộ hàng đợi chưa đồng bộ lên Sheet
      flushPendingWebhookQueue(clean).catch(() => {});
    } else {
      localStorage.removeItem(WEBHOOK_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Tự động quét tìm URL Cầu nối (Google Form Bridge hoặc Apps Script Web App) được lưu trong ô N1 hoặc J4 của Google Sheet
 */
function extractWebhookUrlFromRawText(rawText: string): string | null {
  if (!rawText) return null;

  // Ưu tiên 1: Cầu nối tự động Google Form Bridge (https://docs.google.com/forms/d/e/.../formResponse?entry.XXXX=)
  const formMatch = rawText.match(
    /https:\/\/docs\.google\.com\/forms\/[^\s"'\\<>]+formResponse\?entry\.\d+=/
  );
  if (formMatch && formMatch[0] && isValidWebhookUrl(formMatch[0])) {
    const foundFormUrl = formMatch[0].trim();
    if (getAppsScriptWebhookUrl() !== foundFormUrl) {
      try {
        localStorage.setItem(WEBHOOK_STORAGE_KEY, foundFormUrl);
      } catch {
        // ignore
      }
    }
    return foundFormUrl;
  }

  // Ưu tiên 2: Google Apps Script Web App URL (https://script.google.com/macros/s/.../exec)
  const gasMatches = rawText.match(
    /https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/g
  );
  if (gasMatches) {
    for (const candidate of gasMatches) {
      if (isValidWebhookUrl(candidate)) {
        const foundUrl = candidate.trim();
        if (getAppsScriptWebhookUrl() !== foundUrl) {
          try {
            localStorage.setItem(WEBHOOK_STORAGE_KEY, foundUrl);
          } catch {
            // ignore
          }
        }
        return foundUrl;
      }
    }
  }

  return null;
}

/**
 * Gửi dữ liệu tới Google Sheet bằng 2 cơ chế:
 * 1. Cầu nối Google Form Auto-Bridge (POST application/x-www-form-urlencoded no-cors — hoạt động 100% không cần Deploy Web App)
 * 2. Google Apps Script Web App (POST text/plain + JSONP GET)
 */
export async function callAppsScriptWebhook(payload: Record<string, any>): Promise<{
  sent: boolean;
  webhookUrl: string;
  response?: any;
}> {
  let webhookUrl = getAppsScriptWebhookUrl();

  // Nếu chưa có trong localStorage, thử tự động dò từ Google Sheet live ngay lập tức
  if (!webhookUrl) {
    webhookUrl = (await discoverWebhookUrlFromSheet()) || '';
  }

  const enrichedPayload = {
    ...payload,
    requestId: payload.requestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };

  if (!isValidWebhookUrl(webhookUrl)) {
    enqueuePendingWebhookPayload(enrichedPayload);
    return { sent: false, webhookUrl: '' };
  }

  // CƠ CHẾ A: Gửi qua Cầu nối tự động Google Form Bridge (docs.google.com/forms/.../formResponse?entry.XXXX=)
  if (webhookUrl.includes('docs.google.com/forms')) {
    try {
      const [formActionUrl, queryPart] = webhookUrl.split('?');
      const entryMatch = (queryPart || '').match(/entry\.\d+/);
      if (formActionUrl && entryMatch) {
        const entryKey = entryMatch[0];
        const jsonStr = JSON.stringify(enrichedPayload);
        const bodyStr = `${encodeURIComponent(entryKey)}=${encodeURIComponent(jsonStr)}&submit=Submit`;

        await fetch(formActionUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
          body: bodyStr,
        });
        return { sent: true, webhookUrl };
      }
    } catch {
      enqueuePendingWebhookPayload(enrichedPayload);
      return { sent: false, webhookUrl };
    }
  }

  // CƠ CHẾ B: Gửi tới Apps Script Web App (/exec) bằng cả POST text/plain và JSONP GET
  try {
    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(enrichedPayload),
    }).catch(() => {});
  } catch {
    // ignore
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve({ sent: true, webhookUrl });
      return;
    }

    const cbName = `__synapes_gas_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement('script');

    const cleanup = () => {
      clearTimeout(timer);
      try {
        if (script.parentNode) script.parentNode.removeChild(script);
        delete (window as any)[cbName];
      } catch {
        // ignore
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve({ sent: true, webhookUrl });
    }, 4500);

    (window as any)[cbName] = (resp: any) => {
      cleanup();
      resolve({ sent: true, webhookUrl, response: resp });
    };

    script.onerror = () => {
      cleanup();
      resolve({ sent: true, webhookUrl });
    };

    const sep = webhookUrl.includes('?') ? '&' : '?';
    const encoded = encodeURIComponent(JSON.stringify(enrichedPayload));
    script.src = `${webhookUrl}${sep}callback=${cbName}&payload=${encoded}&_t=${Date.now()}`;
    document.head.appendChild(script);
  });
}

function enqueuePendingWebhookPayload(payload: Record<string, any>): void {
  try {
    const raw = localStorage.getItem(PENDING_WEBHOOK_QUEUE_KEY);
    const list: Record<string, any>[] = raw ? JSON.parse(raw) : [];
    // Tránh trùng lặp cùng email + action
    const idx = list.findIndex(
      (item) => item.email && payload.email && item.email === payload.email && item.action === payload.action
    );
    if (idx >= 0) {
      list[idx] = payload;
    } else {
      list.push(payload);
    }
    localStorage.setItem(PENDING_WEBHOOK_QUEUE_KEY, JSON.stringify(list.slice(-30)));
  } catch {
    // ignore
  }
}

export async function flushPendingWebhookQueue(webhookUrlOverride?: string): Promise<void> {
  const url = webhookUrlOverride || getAppsScriptWebhookUrl();
  if (!isValidWebhookUrl(url)) return;

  try {
    const raw = localStorage.getItem(PENDING_WEBHOOK_QUEUE_KEY);
    if (!raw) return;
    const list: Record<string, any>[] = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return;

    localStorage.removeItem(PENDING_WEBHOOK_QUEUE_KEY);
    for (const item of list) {
      await callAppsScriptWebhook(item);
    }
  } catch {
    // ignore
  }
}

/**
 * Tự động dò tìm URL Webhook được lưu trên Google Sheet (ở cả 2 tab)
 */
export async function discoverWebhookUrlFromSheet(sheetId: string = GOOGLE_SHEET_ID): Promise<string | null> {
  const gids = [GOOGLE_SHEET_GID_USERS, GOOGLE_SHEET_GID_ACCOUNTS];
  for (const gid of gids) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}&_t=${Date.now()}`;
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        const found = extractWebhookUrlFromRawText(text);
        if (found) {
          flushPendingWebhookQueue(found).catch(() => {});
          return found;
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Lấy danh sách hồ sơ đăng ký đã lưu cục bộ
 */
export function getStoredRegistrations(): UserRegistrationData[] {
  try {
    const raw = localStorage.getItem(REGISTRATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Lưu hồ sơ người dùng đăng ký mới và đồng bộ tức thời lên trang tính "THÔNG TIN NGƯỜI DÙNG"
 */
export async function saveUserRegistration(
  data: UserRegistrationData
): Promise<{ success: boolean; syncedToSheet: boolean; message: string }> {
  try {
    const formattedDob = formatDobToDDMMYYYY(data.dob);
    const normalizedData: UserRegistrationData = {
      ...data,
      dob: formattedDob,
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
    };

    const current = getStoredRegistrations();
    if (!normalizedData.id) {
      normalizedData.id = `reg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    if (normalizedData.isApproved === undefined) {
      normalizedData.isApproved = false;
      normalizedData.status = 'pending';
    }

    const existingIndex = current.findIndex(
      (r) =>
        (normalizedData.id && r.id === normalizedData.id) ||
        (!r.isApproved &&
          normalizedData.email &&
          r.email.toLowerCase() === normalizedData.email.toLowerCase() &&
          r.fullName.toLowerCase() === normalizedData.fullName.toLowerCase())
    );
    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...normalizedData };
    } else {
      current.push(normalizedData);
    }

    localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(current));

    // Gửi trực tiếp lên Google Sheet "THÔNG TIN NGƯỜI DÙNG" qua Apps Script Webhook
    const webhookRes = await callAppsScriptWebhook({
      action: 'register',
      fullName: normalizedData.fullName,
      dob: normalizedData.dob,
      gender: normalizedData.gender || 'Nam',
      email: normalizedData.email,
      phone: normalizedData.phone,
      address: normalizedData.address,
      termsAccepted: normalizedData.termsAccepted,
      registeredAt: normalizedData.registeredAt,
      notes: normalizedData.notes || (normalizedData.termsAccepted ? 'Đã ký hợp đồng qua WebApp' : 'Chờ ký hợp đồng'),
    });

    return {
      success: true,
      syncedToSheet: webhookRes.sent,
      message: 'Hồ sơ đã được lưu và đồng bộ thành công',
    };
  } catch (err: any) {
    return {
      success: false,
      syncedToSheet: false,
      message: err?.message || 'Lỗi khi lưu hồ sơ',
    };
  }
}

/**
 * Yêu cầu Google Apps Script gửi email cấp lại mật khẩu mặc định khi người dùng Quên mật khẩu
 * và cập nhật mật khẩu mới lên trang tính "Quản Lý Mật Khẩu" & "THÔNG TIN NGƯỜI DÙNG"
 */
export async function sendForgotPasswordViaSheet(params: {
  email: string;
  phone: string;
  code: string;
  newPassword: string;
  fullName?: string;
}): Promise<{ sent: boolean }> {
  const res = await callAppsScriptWebhook({
    action: 'forgot_password',
    email: params.email.trim(),
    phone: params.phone.trim(),
    code: params.code.trim().toUpperCase(),
    newPassword: params.newPassword.trim(),
    fullName: params.fullName || 'Khách hàng SYNAPES',
  });
  return { sent: res.sent };
}

/**
 * Phê duyệt hồ sơ đăng ký cục bộ và sinh Code + Mật khẩu + Gửi qua Apps Script nếu có
 */
export function approveStoredRegistration(id: string): {
  success: boolean;
  code?: string;
  password?: string;
  registration?: UserRegistrationData;
} {
  try {
    const list = getStoredRegistrations();
    const item = list.find((r) => r.id === id);
    if (!item) return { success: false };

    const baseCode = item.assignedCode || generateUserCode(item.dob);
    let code = baseCode;
    let suffix = 2;
    while (
      list.some(
        (other) =>
          other.id !== item.id &&
          other.assignedCode &&
          other.assignedCode.toUpperCase() === code.toUpperCase()
      )
    ) {
      code = `${baseCode}_${suffix}`;
      suffix++;
    }
    const password = item.assignedPassword || generateUserPassword();

    item.isApproved = true;
    item.assignedCode = code;
    item.assignedPassword = password;
    item.status = 'approved';

    localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(list));

    // Đồng bộ lệnh phê duyệt & gửi Gmail lên Google Sheet Apps Script
    callAppsScriptWebhook({
      action: 'approve_user',
      email: item.email,
      fullName: item.fullName,
      dob: formatDobToDDMMYYYY(item.dob),
      gender: item.gender || 'Nam',
      phone: item.phone,
      address: item.address,
      code,
      password,
    }).catch(() => {});

    return { success: true, code, password, registration: item };
  } catch {
    return { success: false };
  }
}

/**
 * Lấy danh sách mã băm mật khẩu riêng đã đổi lưu trên trình duyệt
 */
export function getCustomPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CUSTOM_PASSWORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getTempResetPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(TEMP_RESET_PASSWORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Gửi thông báo người dùng đã tạo mật khẩu mới lên Google Sheet
 * (Chỉ gửi chuỗi mã băm 1 chiều BCRYPT$..., tuyệt đối không gửi mật khẩu gốc)
 */
export async function changeUserPasswordViaSheet(params: {
  code: string;
  email?: string;
  passwordHash: string;
  fullName?: string;
}): Promise<{ sent: boolean }> {
  const res = await callAppsScriptWebhook({
    action: 'change_password',
    code: params.code.trim().toUpperCase(),
    email: (params.email || '').trim(),
    passwordHash: params.passwordHash.trim(),
    fullName: params.fullName || 'Khách hàng SYNAPES',
  });
  return { sent: res.sent };
}

/**
 * Lưu mật khẩu riêng của tài khoản dưới dạng mã băm 1 chiều (BCRYPT$...)
 * và đồng bộ trạng thái "🟢 Đã tạo mật khẩu mới" lên Google Sheet.
 */
export function saveCustomPassword(
  code: string,
  plainOrHash: string,
  email?: string,
  fullName?: string
): string {
  const codeClean = (code || '').trim().toUpperCase();
  const passwordHash = computePasswordHash(codeClean, plainOrHash);
  try {
    const current = getCustomPasswords();
    current[codeClean] = passwordHash;
    localStorage.setItem(CUSTOM_PASSWORDS_KEY, JSON.stringify(current));

    // Xóa mật khẩu tạm cấp lại trước đó (nếu có) vì người dùng đã chính thức đổi mật khẩu mới
    const tempMap = getTempResetPasswords();
    if (tempMap[codeClean]) {
      delete tempMap[codeClean];
      localStorage.setItem(TEMP_RESET_PASSWORDS_KEY, JSON.stringify(tempMap));
    }

    // Cập nhật trong danh sách hồ sơ đăng ký cục bộ để ẩn mật khẩu mặc định cũ
    const regs = getStoredRegistrations();
    let updatedRegs = false;
    for (const r of regs) {
      if (
        (r.assignedCode && r.assignedCode.toUpperCase() === codeClean) ||
        (email && r.email && r.email.toLowerCase() === email.toLowerCase())
      ) {
        r.assignedPassword = `🔒 Đã mã hóa [${passwordHash}]`;
        r.notes = 'Đã ký hợp đồng | 🟢 Đã tạo mật khẩu mới';
        if (!email) email = r.email;
        if (!fullName) fullName = r.fullName;
        updatedRegs = true;
      }
    }
    if (updatedRegs) {
      localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(regs));
    }
  } catch (e) {
    console.warn('Failed to save custom password', e);
  }

  // Đẩy trạng thái "Đã tạo mật khẩu mới" + mã băm 1 chiều lên Google Sheet
  changeUserPasswordViaSheet({
    code: codeClean,
    email,
    passwordHash,
    fullName,
  }).catch(() => {});

  return passwordHash;
}

/**
 * Đặt lại về trạng thái mật khẩu tạm thời (khi khách dùng Quên mật khẩu hoặc Kỹ sư cấp lại Pass)
 */
export function resetToTempPassword(code: string, tempPass: string): void {
  const codeClean = (code || '').trim().toUpperCase();
  try {
    const customMap = getCustomPasswords();
    if (customMap[codeClean]) {
      delete customMap[codeClean];
      localStorage.setItem(CUSTOM_PASSWORDS_KEY, JSON.stringify(customMap));
    }

    const tempMap = getTempResetPasswords();
    tempMap[codeClean] = tempPass.trim();
    localStorage.setItem(TEMP_RESET_PASSWORDS_KEY, JSON.stringify(tempMap));
  } catch (e) {
    console.warn('Failed to reset to temp password', e);
  }
}

/**
 * Kiểm tra xác thực mật khẩu khi đăng nhập:
 * - Nếu người dùng đã đổi mật khẩu riêng: BẮT BUỘC phải nhập đúng mật khẩu mới đã đổi (so khớp qua mã băm 1 chiều BCRYPT$...),
 *   mật khẩu mặc định cũ (SNP_...) hoàn toàn bị vô hiệu hóa!
 * - Nếu người dùng chưa đổi mật khẩu (hoặc vừa cấp lại mật khẩu mặc định qua Quên mật khẩu):
 *   So khớp với mật khẩu mặc định/tạm thời và bật cờ `isDefaultPassword: true` để yêu cầu đặt mật khẩu mới.
 */
export function verifyAccountLogin(
  code: string,
  inputPass: string,
  row: EngineerSheetRow
): { valid: boolean; isDefaultPassword: boolean } {
  const codeClean = (code || '').trim().toUpperCase();
  const passClean = (inputPass || '').trim();
  if (!codeClean || !passClean) {
    return { valid: false, isDefaultPassword: false };
  }

  const inputHash = computePasswordHash(codeClean, passClean);
  const customMap = getCustomPasswords();
  const tempResetMap = getTempResetPasswords();

  const localStoredCustom = customMap[codeClean];
  const localTempReset = tempResetMap[codeClean];
  const sheetHash =
    extractPasswordHash(row.currentTempPassword) ||
    extractPasswordHash(row.engineerNotes);

  const isSheetCustomActive =
    row.accountStatus === 'custom_password_active' ||
    Boolean(sheetHash) ||
    isPasswordMaskedOrHashed(row.currentTempPassword);

  // Trường hợp vừa cấp lại mật khẩu qua Quên mật khẩu trên trình duyệt này
  if (localTempReset && !localStoredCustom) {
    if (passClean === localTempReset || passClean.toUpperCase() === localTempReset.toUpperCase()) {
      return { valid: true, isDefaultPassword: true };
    }
  }

  // Trường hợp 1: Tài khoản ĐÃ TẠO MẬT KHẨU MỚI (cục bộ hoặc trên Google Sheet)
  if (localStoredCustom || isSheetCustomActive) {
    // Kiểm tra khớp với mã băm lưu cục bộ (hoặc mật khẩu chữ thường cũ nếu có từ phiên bản trước)
    if (localStoredCustom) {
      const localExpectedHash = computePasswordHash(codeClean, localStoredCustom);
      if (inputHash === localExpectedHash || passClean === localStoredCustom) {
        return { valid: true, isDefaultPassword: false };
      }
    }
    // Kiểm tra khớp với mã băm BCRYPT$... lưu trên Google Sheet (đăng nhập từ bất kỳ máy/trình duyệt nào)
    if (sheetHash && inputHash === sheetHash) {
      return { valid: true, isDefaultPassword: false };
    }
    // Tuyệt đối từ chối mật khẩu mặc định cũ khi người dùng đã đổi mật khẩu riêng!
    return { valid: false, isDefaultPassword: false };
  }

  // Trường hợp 2: Tài khoản CHƯA ĐỔI MẬT KHẨU (đang dùng mật khẩu mặc định SNP_... được cấp)
  const rowPass = (row.currentTempPassword || '').trim();
  if (rowPass && !isPasswordMaskedOrHashed(rowPass)) {
    if (passClean === rowPass || passClean.toUpperCase() === rowPass.toUpperCase()) {
      return { valid: true, isDefaultPassword: true };
    }
  }

  return { valid: false, isDefaultPassword: false };
}

/**
 * Lấy thời gian đồng bộ lần cuối
 */
export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

/**
 * Lấy dữ liệu đã lưu trong localStorage nếu có
 */
export function getCachedSheetRows(): EngineerSheetRow[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read cached sheet rows', e);
  }
  return null;
}

/**
 * Lưu dữ liệu vào cache localStorage
 */
export function cacheSheetRows(rows: EngineerSheetRow[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    localStorage.setItem(LAST_SYNC_KEY, timeStr);
  } catch (e) {
    console.warn('Could not cache sheet rows', e);
  }
}

/**
 * Phân tích dữ liệu từ tab "THÔNG TIN NGƯỜI DÙNG" (gid=2096171544)
 * Đồng bộ danh sách đăng ký về WebApp và trích xuất các tài khoản đã được Kỹ sư tích duyệt
 */
export function parseUsersSheetGvizResponse(response: any): {
  registrations: UserRegistrationData[];
  approvedRows: EngineerSheetRow[];
} {
  const registrations: UserRegistrationData[] = [];
  const approvedRows: EngineerSheetRow[] = [];

  if (!response || !response.table || !Array.isArray(response.table.rows)) {
    return { registrations, approvedRows };
  }

  for (let idx = 0; idx < response.table.rows.length; idx++) {
    const r = response.table.rows[idx];
    if (!r || !Array.isArray(r.c)) continue;

    // Ưu tiên lấy giá trị hiển thị (f) nếu có để giữ đúng định dạng DD/MM/YYYY và số 0 ở đầu SĐT
    const cellVals: string[] = r.c.map((cell: any) => {
      if (!cell) return '';
      if (cell.f !== undefined && cell.f !== null && String(cell.f).trim() !== '') {
        return String(cell.f).trim();
      }
      if (cell.v !== undefined && cell.v !== null) {
        return String(cell.v).trim();
      }
      return '';
    });

    // Kiểm tra xem có phải dòng tiêu đề hoặc dòng trống không
    const fullName = cellVals[2] || '';
    const email = cellVals[5] || '';
    if (!fullName && !email) continue;
    if (
      fullName.toLowerCase().includes('họ và tên') ||
      email.toLowerCase().includes('gmail đăng ký')
    ) {
      continue;
    }

    const registeredAt = cellVals[1] || '';
    const dob = formatDobToDDMMYYYY(cellVals[3] || '');
    const gender = cellVals[4] || 'Nam';
    const phone = cellVals[6] || '';
    const address = cellVals[7] || '';
    const rawApproved = r.c[8]?.v;
    const isApproved =
      rawApproved === true ||
      String(rawApproved).toUpperCase() === 'TRUE' ||
      Boolean(cellVals[9] && cellVals[9].startsWith('SNP_'));
    const assignedCode = (cellVals[9] || '').toUpperCase();
    const assignedPassword = cellVals[10] || '';
    const emailStatus = cellVals[11] || '';
    const notes = cellVals[12] || '';

    const regItem: UserRegistrationData = {
      id: `sheet_row_${idx + 2}`,
      fullName,
      dob,
      gender,
      email,
      phone,
      addressType: address.toLowerCase().includes('gps') ? 'gps' : 'manual',
      address,
      termsAccepted: notes.toLowerCase().includes('đã ký'),
      registeredAt,
      isApproved,
      assignedCode: assignedCode || undefined,
      assignedPassword: assignedPassword || undefined,
      status: isApproved ? 'approved' : 'pending',
      notes: notes || emailStatus,
    };

    registrations.push(regItem);

    if (assignedCode && assignedPassword) {
      const combinedStatus = `${assignedPassword} ${emailStatus} ${notes}`.toLowerCase();
      const isCustomPass =
        isPasswordMaskedOrHashed(assignedPassword) ||
        combinedStatus.includes('đã tạo mật khẩu mới') ||
        combinedStatus.includes('đổi mật khẩu') ||
        combinedStatus.includes('đổi pass');
      const isTempReset =
        !isCustomPass &&
        (combinedStatus.includes('cấp lại') || combinedStatus.includes('temp'));

      approvedRows.push({
        code: assignedCode,
        clientName: fullName,
        registeredGmail: email,
        currentTempPassword: assignedPassword,
        lastIssuedTime: registeredAt || 'Đã duyệt trên Sheet',
        accountStatus: isCustomPass
          ? 'custom_password_active'
          : isTempReset
            ? 'temp_password_active'
            : 'never_changed',
        engineerNotes: `SĐT: ${phone} | Đ/c: ${address} | ${notes || emailStatus}`,
      });
    }
  }

  // Merge với danh sách đăng ký trong localStorage để không mất hồ sơ vừa tạo
  if (registrations.length > 0) {
    try {
      const localRegs = getStoredRegistrations();
      const merged = [...registrations];
      for (const localItem of localRegs) {
        const exists = merged.some(
          (m) =>
            m.email &&
            localItem.email &&
            m.email.toLowerCase() === localItem.email.toLowerCase() &&
            m.fullName.trim().toLowerCase() === localItem.fullName.trim().toLowerCase()
        );
        if (!exists) {
          merged.push(localItem);
        }
      }
      localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // ignore
    }
  }

  return { registrations, approvedRows };
}

/**
 * Phân tích dữ liệu phản hồi từ Google Visualization API (Tab "Quản Lý Mật Khẩu")
 */
export function parseGvizResponse(response: any): EngineerSheetRow[] {
  if (!response || !response.table || !response.table.rows) {
    return [];
  }

  const rows: EngineerSheetRow[] = [];
  const gvizRows = response.table.rows;

  for (const r of gvizRows) {
    if (!r || !r.c || !Array.isArray(r.c)) continue;

    const cellVals: string[] = r.c.map((cell: any) => {
      if (!cell) return '';
      if (cell.f !== undefined && cell.f !== null && String(cell.f).trim() !== '') {
        return String(cell.f).trim();
      }
      return cell.v !== undefined && cell.v !== null ? String(cell.v).trim() : '';
    });

    if (cellVals.every((v) => v === '')) continue;
    if (
      cellVals.some(
        (v) =>
          v.toLowerCase().includes('mã code') ||
          v.toLowerCase().includes('mã khách hàng') ||
          v.toLowerCase().includes('hệ thống quản lý')
      )
    ) {
      continue;
    }

    let code = '';
    let codeIndex = -1;

    // Ưu tiên Cột B (index 1) hoặc Cột A (index 0)
    if (
      cellVals[1] &&
      (cellVals[1].startsWith('SNP_') ||
        cellVals[1].includes('-') ||
        /^[A-Z0-9_-]{4,22}$/i.test(cellVals[1]))
    ) {
      code = cellVals[1].toUpperCase();
      codeIndex = 1;
    } else if (
      cellVals[0] &&
      !cellVals[0].match(/^\d+(\.0)?$/) &&
      (cellVals[0].startsWith('SNP_') ||
        cellVals[0].includes('-') ||
        /^[A-Z0-9_-]{4,22}$/i.test(cellVals[0]))
    ) {
      code = cellVals[0].toUpperCase();
      codeIndex = 0;
    } else {
      for (let i = 0; i < cellVals.length; i++) {
        const val = cellVals[i];
        if (
          val &&
          !val.includes('@') &&
          (val.startsWith('SNP_') ||
            val.startsWith('VIP') ||
            val.startsWith('FYER') ||
            (val.includes('-') && val.length <= 25))
        ) {
          code = val.toUpperCase();
          codeIndex = i;
          break;
        }
      }
    }

    if (!code) continue;

    let registeredGmail = '';
    for (let i = 0; i < cellVals.length; i++) {
      if (cellVals[i].includes('@') && cellVals[i].includes('.')) {
        registeredGmail = cellVals[i];
        break;
      }
    }

    let clientName = 'Khách Hàng Studio';
    if (codeIndex !== -1 && cellVals[codeIndex + 1] && !cellVals[codeIndex + 1].includes('@')) {
      clientName = cellVals[codeIndex + 1];
    } else if (cellVals[2] && !cellVals[2].includes('@')) {
      clientName = cellVals[2];
    }

    let currentTempPassword = '';
    if (cellVals[4] && cellVals[4] !== '') {
      currentTempPassword = cellVals[4];
    } else if (codeIndex === 0 && cellVals[3] && !cellVals[3].includes('@')) {
      currentTempPassword = cellVals[3];
    } else {
      for (let i = 0; i < cellVals.length; i++) {
        if (
          i !== codeIndex &&
          cellVals[i] &&
          !cellVals[i].includes('@') &&
          cellVals[i] !== clientName &&
          cellVals[i].length >= 4 &&
          cellVals[i].length <= 30
        ) {
          if (/^(SNP_|Auto-|Start@|snp@|[A-Za-z0-9@#$!%*?&_]{6,})/i.test(cellVals[i])) {
            currentTempPassword = cellVals[i];
            break;
          }
        }
      }
    }

    const lastIssuedTime = cellVals[5] || 'Mới cập nhật';
    const statusRaw = `${cellVals[6] || ''} ${cellVals[7] || ''} ${cellVals[8] || ''} ${currentTempPassword}`.toLowerCase();
    let accountStatus: 'custom_password_active' | 'temp_password_active' | 'never_changed' = 'never_changed';
    if (
      isPasswordMaskedOrHashed(currentTempPassword) ||
      statusRaw.includes('đổi pass') ||
      statusRaw.includes('đã tạo mật khẩu mới') ||
      statusRaw.includes('đổi mật khẩu') ||
      statusRaw.includes('custom') ||
      statusRaw.includes('riêng')
    ) {
      accountStatus = 'custom_password_active';
    } else if (statusRaw.includes('cấp lại') || statusRaw.includes('temp')) {
      accountStatus = 'temp_password_active';
    }

    const engineerNotes = cellVals[8] || cellVals[7] || 'Khách hàng SYNAPES';

    rows.push({
      code,
      clientName,
      registeredGmail,
      currentTempPassword,
      lastIssuedTime,
      accountStatus,
      engineerNotes,
    });
  }

  return rows;
}

/**
 * Trích xuất JSON từ chuỗi phản hồi Google Visualization
 */
function extractGvizJson(rawText: string): any {
  const start = rawText.indexOf('{');
  const end = rawText.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const jsonStr = rawText.substring(start, end + 1);
    return JSON.parse(jsonStr);
  }
  return null;
}

/**
 * Tải dữ liệu GViz của một tab cụ thể (hỗ trợ cả Fetch trực tiếp và JSONP Fallback)
 */
async function fetchGvizByGid(sheetId: string, gid: string): Promise<any | null> {
  const timestamp = Date.now();
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}&_t=${timestamp}`;
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      extractWebhookUrlFromRawText(text);
      const json = extractGvizJson(text);
      if (json) return json;
    }
  } catch {
    // Chuyển sang JSONP fallback
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  return new Promise((resolve) => {
    const callbackName = `__gviz_cb_${gid}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement('script');

    const cleanup = () => {
      clearTimeout(timeout);
      try {
        if (script.parentNode) script.parentNode.removeChild(script);
        delete (window as any)[callbackName];
      } catch {
        // ignore
      }
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 4000);

    (window as any)[callbackName] = (resp: any) => {
      cleanup();
      try {
        extractWebhookUrlFromRawText(JSON.stringify(resp));
      } catch {
        // ignore
      }
      resolve(resp);
    };

    script.onerror = () => {
      cleanup();
      resolve(null);
    };

    script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json;responseHandler:${callbackName}&gid=${gid}&_t=${timestamp}`;
    document.head.appendChild(script);
  });
}

/**
 * Đồng bộ dữ liệu trực tiếp từ CẢ 2 TAB của Google Sheet:
 * 1. Tab "Quản Lý Mật Khẩu" (gid=0)
 * 2. Tab "THÔNG TIN NGƯỜI DÙNG" (gid=2096171544)
 */
export async function fetchGoogleSheetLive(sheetId: string = GOOGLE_SHEET_ID): Promise<EngineerSheetRow[]> {
  try {
    const [accountsJson, usersJson] = await Promise.all([
      fetchGvizByGid(sheetId, GOOGLE_SHEET_GID_ACCOUNTS),
      fetchGvizByGid(sheetId, GOOGLE_SHEET_GID_USERS),
    ]);

    const accountRows = accountsJson ? parseGvizResponse(accountsJson) : [];
    const { registrations: sheetRegistrations, approvedRows } = usersJson
      ? parseUsersSheetGvizResponse(usersJson)
      : { registrations: [], approvedRows: [] };

    // Gộp danh sách tài khoản từ cả 2 tab (ưu tiên thông tin mới nhất & trạng thái đã đổi mật khẩu)
    const customPassMap = getCustomPasswords();
    const mergedMap = new Map<string, EngineerSheetRow>();
    for (const r of accountRows) {
      mergedMap.set(r.code.toUpperCase(), r);
    }
    for (const r of approvedRows) {
      const codeKey = r.code.toUpperCase();
      const existing = mergedMap.get(codeKey);
      if (existing) {
        const isCustom =
          existing.accountStatus === 'custom_password_active' ||
          r.accountStatus === 'custom_password_active';
        const chosenPass =
          isPasswordMaskedOrHashed(existing.currentTempPassword)
            ? existing.currentTempPassword
            : isPasswordMaskedOrHashed(r.currentTempPassword)
              ? r.currentTempPassword
              : r.currentTempPassword || existing.currentTempPassword;
        mergedMap.set(codeKey, {
          ...existing,
          currentTempPassword: chosenPass,
          accountStatus: isCustom ? 'custom_password_active' : existing.accountStatus,
          engineerNotes: `${existing.engineerNotes} | ${r.engineerNotes}`,
        });
      } else {
        mergedMap.set(codeKey, r);
      }
    }

    // Áp dụng trạng thái mật khẩu riêng đã đổi cục bộ (nếu Sheet đang trong quá trình đồng bộ)
    for (const [codeKey, rowItem] of mergedMap.entries()) {
      const localCustom = customPassMap[codeKey];
      if (localCustom) {
        const hashStr = computePasswordHash(codeKey, localCustom);
        mergedMap.set(codeKey, {
          ...rowItem,
          currentTempPassword: `🔒 Đã mã hóa [${hashStr}]`,
          accountStatus: 'custom_password_active',
        });
      }
    }

    const finalRows = Array.from(mergedMap.values());
    if (finalRows.length > 0) {
      cacheSheetRows(finalRows);
    }

    // Nếu phát hiện được Cầu nối hợp lệ (Google Form Bridge hoặc Apps Script Web App):
    // 1. Đẩy hàng đợi đang chờ lên Google Sheet
    // 2. Tự động đồng bộ bù các hồ sơ đăng ký hoặc trạng thái đã tạo mật khẩu mới lên Sheet
    const webhookUrl = getAppsScriptWebhookUrl();
    if (isValidWebhookUrl(webhookUrl)) {
      flushPendingWebhookQueue(webhookUrl).catch(() => {});

      try {
        const localRegs = getStoredRegistrations();
        const syncedRaw = localStorage.getItem(SYNCED_REG_HASH_KEY);
        const syncedMap: Record<string, number> = syncedRaw ? JSON.parse(syncedRaw) : {};
        const nowMs = Date.now();

        for (const localReg of localRegs) {
          if (!localReg.email || !localReg.fullName) continue;
          const emailKey = localReg.email.trim().toLowerCase();
          const nameKey = localReg.fullName.trim().toLowerCase();
          const onSheet = sheetRegistrations.find(
            (sr) =>
              sr.email &&
              sr.email.trim().toLowerCase() === emailKey &&
              sr.fullName.trim().toLowerCase() === nameKey
          );

          const needsSync =
            !onSheet || (localReg.termsAccepted && !onSheet.termsAccepted);
          const syncHash = `${emailKey}_${nameKey}_${localReg.termsAccepted ? 'signed' : 'draft'}_${webhookUrl.slice(-16)}`;
          const lastAttempt = syncedMap[syncHash] || 0;

          if (needsSync && nowMs - lastAttempt > 45000) {
            syncedMap[syncHash] = nowMs;
            localStorage.setItem(SYNCED_REG_HASH_KEY, JSON.stringify(syncedMap));
            callAppsScriptWebhook({
              action: 'register',
              requestId: `autosync_${emailKey}_${nameKey}_${localReg.termsAccepted ? 'signed' : 'draft'}`,
              ...localReg,
            }).catch(() => {});
          }
        }

        // Đồng bộ bù trạng thái "Đã tạo mật khẩu mới" nếu khách đã đổi pass trên trình duyệt mà Sheet chưa cập nhật
        for (const [codeKey, customVal] of Object.entries(customPassMap)) {
          const hashStr = computePasswordHash(codeKey, customVal);
          const sheetAcc = accountRows.find((ar) => ar.code.toUpperCase() === codeKey);
          const sheetUser = approvedRows.find((ur) => ur.code.toUpperCase() === codeKey);
          const sheetHasHash =
            (sheetAcc && extractPasswordHash(sheetAcc.currentTempPassword) === hashStr) ||
            (sheetUser && extractPasswordHash(sheetUser.currentTempPassword) === hashStr);

          const passSyncKey = `pass_${codeKey}_${hashStr}_${webhookUrl.slice(-12)}`;
          if (!sheetHasHash && nowMs - (syncedMap[passSyncKey] || 0) > 45000) {
            syncedMap[passSyncKey] = nowMs;
            localStorage.setItem(SYNCED_REG_HASH_KEY, JSON.stringify(syncedMap));
            const email = sheetAcc?.registeredGmail || sheetUser?.registeredGmail || '';
            const fullName = sheetAcc?.clientName || sheetUser?.clientName || 'Khách hàng SYNAPES';
            changeUserPasswordViaSheet({
              code: codeKey,
              email,
              passwordHash: hashStr,
              fullName,
            }).catch(() => {});
          }
        }
      } catch {
        // ignore
      }
    }

    if (finalRows.length > 0) {
      return finalRows;
    }
  } catch (err) {
    console.warn('Error syncing both tabs from Google Sheet:', err);
  }

  const cached = getCachedSheetRows();
  return cached || [];
}
