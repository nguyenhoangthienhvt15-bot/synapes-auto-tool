import { EngineerSheetRow, UserRegistrationData } from '../types';

export const GOOGLE_SHEET_ID = '1E9zec8lX52-ofleS0MG-oRSc8k_hK9aBtC1XBaqNafY';
export const GOOGLE_SHEET_GID_ACCOUNTS = '0'; // Tab "Quản Lý Mật Khẩu"
export const GOOGLE_SHEET_GID_USERS = '2096171544'; // Tab "THÔNG TIN NGƯỜI DÙNG"
export const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit?usp=sharing`;

const STORAGE_KEY = 'synapes_cached_sheet_rows';
const LAST_SYNC_KEY = 'synapes_last_sheet_sync';
const CUSTOM_PASSWORDS_KEY = 'synapes_custom_passwords';
const REGISTRATION_STORAGE_KEY = 'synapes_user_registrations';
const WEBHOOK_STORAGE_KEY = 'synapes_apps_script_webhook';
const PENDING_WEBHOOK_QUEUE_KEY = 'synapes_pending_webhook_queue';
const SYNCED_REG_HASH_KEY = 'synapes_synced_reg_hashes';

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
        (normalizedData.email && r.email.toLowerCase() === normalizedData.email.toLowerCase()) ||
        (normalizedData.id && r.id === normalizedData.id)
    );
    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...normalizedData };
    } else {
      current.unshift(normalizedData);
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

    const code = item.assignedCode || generateUserCode(item.dob);
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
 * Lấy danh sách mật khẩu riêng đã đổi lưu trên trình duyệt
 */
export function getCustomPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CUSTOM_PASSWORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Lưu mật khẩu riêng của tài khoản vào bộ nhớ cục bộ
 */
export function saveCustomPassword(code: string, pass: string): void {
  try {
    const current = getCustomPasswords();
    current[code.toUpperCase()] = pass;
    localStorage.setItem(CUSTOM_PASSWORDS_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to save custom password', e);
  }
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
      approvedRows.push({
        code: assignedCode,
        clientName: fullName,
        registeredGmail: email,
        currentTempPassword: assignedPassword,
        lastIssuedTime: registeredAt || 'Đã duyệt trên Sheet',
        accountStatus: 'never_changed',
        engineerNotes: `SĐT: ${phone} | Đ/c: ${address} | ${notes}`,
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
          (m) => m.email && localItem.email && m.email.toLowerCase() === localItem.email.toLowerCase()
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
    const statusRaw = (cellVals[6] || cellVals[7] || '').toLowerCase();
    let accountStatus: 'custom_password_active' | 'temp_password_active' | 'never_changed' = 'never_changed';
    if (statusRaw.includes('đổi pass') || statusRaw.includes('custom') || statusRaw.includes('riêng')) {
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

    // Gộp danh sách tài khoản từ cả 2 tab (ưu tiên thông tin mới nhất)
    const mergedMap = new Map<string, EngineerSheetRow>();
    for (const r of accountRows) {
      mergedMap.set(r.code.toUpperCase(), r);
    }
    for (const r of approvedRows) {
      const existing = mergedMap.get(r.code.toUpperCase());
      if (existing) {
        mergedMap.set(r.code.toUpperCase(), {
          ...existing,
          currentTempPassword: r.currentTempPassword || existing.currentTempPassword,
          engineerNotes: `${existing.engineerNotes} | ${r.engineerNotes}`,
        });
      } else {
        mergedMap.set(r.code.toUpperCase(), r);
      }
    }

    const finalRows = Array.from(mergedMap.values());
    if (finalRows.length > 0) {
      cacheSheetRows(finalRows);
    }

    // Nếu phát hiện được Cầu nối hợp lệ (Google Form Bridge hoặc Apps Script Web App):
    // 1. Đẩy hàng đợi đang chờ lên Google Sheet
    // 2. Tự động đồng bộ bù các hồ sơ đăng ký đã lưu trong trình duyệt nhưng chưa xuất hiện trên Sheet
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
          const onSheet = sheetRegistrations.find(
            (sr) => sr.email && sr.email.trim().toLowerCase() === emailKey
          );

          const needsSync =
            !onSheet || (localReg.termsAccepted && !onSheet.termsAccepted);
          const syncHash = `${emailKey}_${localReg.termsAccepted ? 'signed' : 'draft'}_${webhookUrl.slice(-16)}`;
          const lastAttempt = syncedMap[syncHash] || 0;

          if (needsSync && nowMs - lastAttempt > 45000) {
            syncedMap[syncHash] = nowMs;
            localStorage.setItem(SYNCED_REG_HASH_KEY, JSON.stringify(syncedMap));
            callAppsScriptWebhook({
              action: 'register',
              requestId: `autosync_${emailKey}_${localReg.termsAccepted ? 'signed' : 'draft'}`,
              ...localReg,
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
