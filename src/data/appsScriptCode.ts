/**
 * Single-Source Stub (AUD-22): Loại bỏ nhúng tĩnh ~492KB vào JS Bundle.
 * Truy xuất bản chuẩn duy nhất google-apps-script/Code.js từ API máy chủ khi cần.
 */
import { getAuthHeaders } from '../services/userProfileService';

export const APPS_SCRIPT_TEMPLATE_ENDPOINT = '/api/system/apps-script-template';

export async function fetchAppsScriptTemplate(): Promise<string> {
  const res = await fetch(APPS_SCRIPT_TEMPLATE_ENDPOINT, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return String(data?.code || '');
}
