import fs from 'fs';
import path from 'path';

/**
 * Nạp biến môi trường từ tệp `.env` ở thư mục gốc dự án nếu có
 * mà không ghi đè biến đã được cấp bởi hệ điều hành (Render/Docker).
 */
export function loadLocalEnvFile(envFilePath = path.resolve(process.cwd(), '.env')) {
  try {
    if (!fs.existsSync(envFilePath)) return false;
    const raw = fs.readFileSync(envFilePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key && !(key in process.env)) {
        process.env[key] = val;
      }
    }
    return true;
  } catch {
    return false;
  }
}

loadLocalEnvFile();
