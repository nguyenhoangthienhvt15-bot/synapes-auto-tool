import { EngineerSheetRow } from '../types';

export const GOOGLE_SHEET_ID = '1E9zec8lX52-ofleS0MG-oRSc8k_hK9aBtC1XBaqNafY';
export const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit?usp=sharing`;

const STORAGE_KEY = 'synapes_cached_sheet_rows';
const LAST_SYNC_KEY = 'synapes_last_sheet_sync';

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
 * Phân tích dữ liệu phản hồi từ Google Visualization API
 */
export function parseGvizResponse(response: any): EngineerSheetRow[] {
  if (!response || !response.table || !response.table.rows) {
    return [];
  }

  const rows: EngineerSheetRow[] = [];
  const gvizRows = response.table.rows;

  for (const r of gvizRows) {
    if (!r || !r.c) continue;

    // Col B (index 1): Mã Code
    const codeRaw = r.c[1]?.v;
    if (!codeRaw || String(codeRaw).trim() === '') continue;
    const code = String(codeRaw).trim().toUpperCase();

    // Col C (index 2): Tên khách hàng / Studio
    const clientName = r.c[2]?.v ? String(r.c[2].v).trim() : 'Khách Hàng Studio';

    // Col D (index 3): Gmail đăng ký
    const registeredGmail = r.c[3]?.v ? String(r.c[3].v).trim() : '';

    // Col E (index 4): Mật khẩu tạm / Mặc định
    const currentTempPassword = r.c[4]?.v !== undefined && r.c[4]?.v !== null ? String(r.c[4].v).trim() : '';

    // Col F (index 5): Thời gian cấp gần nhất
    const lastIssuedTime = r.c[5]?.f || (r.c[5]?.v !== undefined && r.c[5]?.v !== null ? String(r.c[5].v).trim() : '');

    // Col G (index 6): Trạng thái mật khẩu
    const statusRaw = r.c[6]?.v ? String(r.c[6].v).trim() : '';
    let accountStatus: 'custom_password_active' | 'temp_password_active' | 'never_changed' = 'never_changed';
    if (statusRaw.includes('đổi pass riêng') || statusRaw.includes('custom')) {
      accountStatus = 'custom_password_active';
    } else if (statusRaw.includes('cấp lại') || statusRaw.includes('temp')) {
      accountStatus = 'temp_password_active';
    }

    // Col I (index 8) hoặc Col H (index 7): Ghi chú
    const notesPart1 = r.c[8]?.v ? String(r.c[8].v).trim() : '';
    const pkgPart = r.c[7]?.v ? String(r.c[7].v).trim() : '';
    const engineerNotes = notesPart1 ? `${pkgPart ? `[${pkgPart}] ` : ''}${notesPart1}` : pkgPart || 'Khách hàng SYNAPES';

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
 * Đồng bộ dữ liệu trực tiếp từ Google Sheet:
 * Cách 1: fetch() trực tiếp (Google Sheet hỗ trợ CORS cho domain web)
 * Cách 2: JSONP fallback qua thẻ <script>
 * Cách 3: Đọc cache localStorage đã lưu
 */
export async function fetchGoogleSheetLive(sheetId: string = GOOGLE_SHEET_ID): Promise<EngineerSheetRow[]> {
  // 1. Thử fetch() trực tiếp
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

  // 2. Fallback: JSONP
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
