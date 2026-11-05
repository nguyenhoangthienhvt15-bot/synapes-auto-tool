import { EngineerSheetRow, UserRegistrationData } from '../types';

export const GOOGLE_SHEET_ID = '1E9zec8lX52-ofleS0MG-oRSc8k_hK9aBtC1XBaqNafY';
export const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit?usp=sharing`;

const STORAGE_KEY = 'synapes_cached_sheet_rows';
const LAST_SYNC_KEY = 'synapes_last_sheet_sync';
const CUSTOM_PASSWORDS_KEY = 'synapes_custom_passwords';
const REGISTRATION_STORAGE_KEY = 'synapes_user_registrations';

/**
 * Sinh mã Code khách hàng chuẩn theo quy tắc: SNP_[6 số YYMMDD + 4 số ngày tháng sinh DDMM]
 */
export function generateUserCode(dob: string): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  const yymmdd = `${yy}${mm}${dd}`;

  let ddmm = '0101';
  const match = dob.match(/(\d{1,2})[\/\-\.](\d{1,2})/);
  if (match) {
    const d = match[1].padStart(2, '0');
    const m = match[2].padStart(2, '0');
    ddmm = `${d}${m}`;
  } else {
    ddmm = `${dd}${mm}`;
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
 * Lưu hồ sơ người dùng đăng ký mới
 */
export async function saveUserRegistration(data: UserRegistrationData): Promise<{ success: boolean; message: string }> {
  try {
    const current = getStoredRegistrations();
    if (!data.id) {
      data.id = `reg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    if (data.isApproved === undefined) {
      data.isApproved = false;
      data.status = 'pending';
    }

    // Nếu email hoặc ID đã tồn tại thì cập nhật thay vì tạo trùng lặp
    const existingIndex = current.findIndex(
      (r) => (data.email && r.email === data.email) || (data.id && r.id === data.id)
    );
    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...data };
    } else {
      current.unshift(data);
    }

    localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(current));

    // Đồng bộ gửi thông tin đến Google Apps Script Webhook nếu có cấu hình
    try {
      const webhookUrl = localStorage.getItem('synapes_apps_script_webhook');
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch(() => {});
      }
    } catch {
      // ignore network errors for offline resiliency
    }

    return { success: true, message: 'Hồ sơ đã được lưu thành công' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Lỗi khi lưu hồ sơ' };
  }
}

/**
 * Phê duyệt hồ sơ đăng ký cục bộ và sinh Code + Mật khẩu
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
 * Phân tích dữ liệu phản hồi từ Google Visualization API với cơ chế tự thích ứng cột (Auto-Adaptive Column Detection)
 */
export function parseGvizResponse(response: any): EngineerSheetRow[] {
  if (!response || !response.table || !response.table.rows) {
    return [];
  }

  const rows: EngineerSheetRow[] = [];
  const gvizRows = response.table.rows;

  for (const r of gvizRows) {
    if (!r || !r.c || !Array.isArray(r.c)) continue;

    // Lấy mảng giá trị của hàng
    const cellVals: string[] = r.c.map((cell: any) =>
      cell && (cell.v !== undefined && cell.v !== null) ? String(cell.v).trim() : ''
    );

    // Bỏ qua dòng trống hoặc dòng tiêu đề
    if (cellVals.every((v) => v === '')) continue;
    if (cellVals.some((v) => v.toLowerCase().includes('mã code') || v.toLowerCase().includes('mã khách hàng'))) {
      continue;
    }

    // Tự động tìm cột Code: cột có dạng FYER-..., VIP-..., hoặc mã chữ hoa có gạch nối
    let code = '';
    let codeIndex = -1;

    // Ưu tiên 1: Cột B (index 1) hoặc Cột A (index 0)
    if (cellVals[1] && (cellVals[1].includes('-') || /^[A-Z0-9_-]{3,20}$/i.test(cellVals[1]))) {
      code = cellVals[1].toUpperCase();
      codeIndex = 1;
    } else if (cellVals[0] && (cellVals[0].includes('-') || /^[A-Z0-9_-]{3,20}$/i.test(cellVals[0]))) {
      code = cellVals[0].toUpperCase();
      codeIndex = 0;
    } else {
      // Tìm trong bất kỳ cột nào
      for (let i = 0; i < cellVals.length; i++) {
        const val = cellVals[i];
        if (val && !val.includes('@') && (val.startsWith('VIP') || val.startsWith('FYER') || (val.includes('-') && val.length <= 25))) {
          code = val.toUpperCase();
          codeIndex = i;
          break;
        }
      }
    }

    if (!code) continue;

    // Tìm cột Gmail: cột chứa ký tự '@'
    let registeredGmail = '';
    for (let i = 0; i < cellVals.length; i++) {
      if (cellVals[i].includes('@') && cellVals[i].includes('.')) {
        registeredGmail = cellVals[i];
        break;
      }
    }

    // Tên khách hàng: Thường nằm sau cột Mã Code
    let clientName = 'Khách Hàng Studio';
    if (codeIndex !== -1 && cellVals[codeIndex + 1] && !cellVals[codeIndex + 1].includes('@')) {
      clientName = cellVals[codeIndex + 1];
    } else if (cellVals[2] && !cellVals[2].includes('@')) {
      clientName = cellVals[2];
    }

    // Mật khẩu tạm: Thường nằm ở cột E (index 4) hoặc sau Gmail
    let currentTempPassword = '';
    if (cellVals[4] && cellVals[4] !== '') {
      currentTempPassword = cellVals[4];
    } else if (codeIndex === 0 && cellVals[3] && !cellVals[3].includes('@')) {
      currentTempPassword = cellVals[3];
    } else {
      for (let i = 0; i < cellVals.length; i++) {
        if (i !== codeIndex && cellVals[i] && !cellVals[i].includes('@') && cellVals[i] !== clientName && cellVals[i].length >= 4 && cellVals[i].length <= 30) {
          if (/^(Auto-|Start@|snp@|[A-Za-z0-9@#$!%*?&]{6,})/i.test(cellVals[i])) {
            currentTempPassword = cellVals[i];
            break;
          }
        }
      }
    }

    // Thời gian cấp
    const lastIssuedTime = cellVals[5] || cellVals[6] || 'Mới cập nhật';

    // Trạng thái mật khẩu
    const statusRaw = (cellVals[6] || cellVals[7] || '').toLowerCase();
    let accountStatus: 'custom_password_active' | 'temp_password_active' | 'never_changed' = 'never_changed';
    if (statusRaw.includes('đổi pass') || statusRaw.includes('custom') || statusRaw.includes('riêng')) {
      accountStatus = 'custom_password_active';
    } else if (statusRaw.includes('cấp lại') || statusRaw.includes('temp')) {
      accountStatus = 'temp_password_active';
    }

    // Ghi chú
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
 * Đồng bộ dữ liệu trực tiếp từ Google Sheet
 */
export async function fetchGoogleSheetLive(sheetId: string = GOOGLE_SHEET_ID): Promise<EngineerSheetRow[]> {
  try {
    const timestamp = Date.now();
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&_t=${timestamp}`;
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    });

    if (res.ok) {
      const text = await res.text();
      const json = extractGvizJson(text);
      if (json) {
        const rows = parseGvizResponse(json);
        if (rows.length > 0) {
          cacheSheetRows(rows);
          return rows;
        }
      }
    }
  } catch (err) {
    console.warn('Direct fetch from Google Sheet failed, trying JSONP fallback...', err);
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      const cached = getCachedSheetRows();
      resolve(cached || []);
      return;
    }

    const callbackName = `__gviz_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement('script');

    const timeout = setTimeout(() => {
      cleanup();
      console.warn('JSONP timed out, using cached sheet rows');
      const cached = getCachedSheetRows();
      resolve(cached || []);
    }, 4000);

    const cleanup = () => {
      clearTimeout(timeout);
      try {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        delete (window as any)[callbackName];
      } catch (e) {
        // ignore
      }
    };

    (window as any)[callbackName] = (resp: any) => {
      cleanup();
      try {
        const rows = parseGvizResponse(resp);
        if (rows.length > 0) {
          cacheSheetRows(rows);
          resolve(rows);
        } else {
          const cached = getCachedSheetRows();
          resolve(cached || []);
        }
      } catch (err) {
        console.error('Error parsing JSONP Google Sheet data:', err);
        const cached = getCachedSheetRows();
        resolve(cached || []);
      }
    };

    script.onerror = () => {
      cleanup();
      const cached = getCachedSheetRows();
      resolve(cached || []);
    };

    script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${callbackName}&_t=${Date.now()}`;
    document.head.appendChild(script);
  });
}
