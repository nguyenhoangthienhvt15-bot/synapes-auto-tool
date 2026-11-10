/**
 * incidentReporter.mjs - Hệ thống Tự Phục Hồi (Self-Healing) & Cảnh Báo Sự Cố Tự Động
 * Thiết kế kiến trúc theo Báo cáo Đánh giá Phiên họp 1 — Hội đồng Kỹ thuật
 * Chủ trì dự án: KS. Nguyễn Hoàng Thiện (nguyenhoangthien.hvt.15@gmail.com)
 */

import fs from 'fs';
import path from 'path';

const INCIDENT_LOGS_DIR = path.resolve(process.cwd(), 'data', 'incidents');
const ALERT_EMAIL = 'nguyenhoangthien.hvt.15@gmail.com';

// Đảm bảo thư mục lưu trữ sự cố tồn tại
try {
  if (!fs.existsSync(INCIDENT_LOGS_DIR)) {
    fs.mkdirSync(INCIDENT_LOGS_DIR, { recursive: true });
  }
} catch {
  // Ignored
}

// ==============================================================================
// 1. TẦNG 1 & 2: EXPONENTIAL BACKOFF & CASCADING CIRCUIT BREAKER
// ==============================================================================
export class CascadingCircuitBreaker {
  constructor(serviceName, thresholdFailures = 3, resetTimeoutMs = 60000) {
    this.serviceName = serviceName;
    this.failureCount = 0;
    this.thresholdFailures = thresholdFailures;
    this.resetTimeoutMs = resetTimeoutMs;
    this.state = 'CLOSED'; // CLOSED (Bình thường), OPEN (Ngắt mạch, chuyển fallback), HALF_OPEN
    this.lastFailureTime = 0;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.thresholdFailures) {
      this.state = 'OPEN';
    }
  }

  isOpen() {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }
}

export const CIRCUIT_BREAKERS = {
  kling: new CascadingCircuitBreaker('KlingAI'),
  runway: new CascadingCircuitBreaker('RunwayGen3'),
  elevenlabs: new CascadingCircuitBreaker('ElevenLabsTTS'),
  database: new CascadingCircuitBreaker('DatabasePostgres'),
};

/**
 * Tầng 1: Exponential Backoff with Jitter
 */
export async function executeWithRetry(fn, maxRetries = 3, baseDelayMs = 1500) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      const jitter = Math.random() * 500;
      const delay = Math.pow(2, attempt) * baseDelayMs + jitter;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ==============================================================================
// 2. TẦNG 3: DISPATCH CRITICAL INCIDENT & TỰ SOẠN BÁO CÁO GỬI VỀ EMAIL
// ==============================================================================
export async function dispatchCriticalIncident(error, taskContext = {}) {
  const timestamp = new Date();
  const timeFormatted = timestamp.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const incidentId = `INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const stack = error?.stack || String(error);
  const taskName = taskContext.task_name || taskContext.taskName || 'Hệ thống Studio Backend';
  const userCode = taskContext.user_code || taskContext.userCode || 'Anonymous / Vãng lai';

  // 1. Phân tích nguyên nhân sơ bộ (Root Cause Analysis - RCA)
  let rcaRoot = 'Không xác định';
  let rcaImpact = 'Cục bộ tại tác vụ hiện tại';
  let rcaAction = 'Kiểm tra đường truyền mạng và quota API';

  if (stack.includes('429') || stack.includes('Quota')) {
    rcaRoot = 'Cạn kiệt hạn ngạch (Quota Exceeded / Rate Limit 429) của nhà cung cấp API.';
    rcaImpact = 'Không thể gọi API sinh nội dung trong chu kỳ hiện tại.';
    rcaAction = 'Đổi API Key trong BYOK Vault hoặc nạp thêm Credits.';
  } else if (stack.includes('ECONNREFUSED') || stack.includes('ETIMEDOUT')) {
    rcaRoot = 'Sập kết nối mạng hoặc nhà cung cấp (Kling/Runway/ElevenLabs) ngắt máy chủ.';
    rcaImpact = 'Kích hoạt Circuit Breaker chuyển sang Provider dự phòng.';
    rcaAction = 'Kiểm tra trạng thái cổng dịch vụ của bên thứ ba.';
  } else if (stack.includes('tampering') || stack.includes('devtools')) {
    rcaRoot = 'Phát hiện hành vi can thiệp trái phép qua Developer Tools / F12.';
    rcaImpact = 'Địa chỉ IP vi phạm đã bị đưa vào danh sách đen (Blacklist 24h).';
    rcaAction = 'Đối soát nhật ký an ninh và xác minh tài khoản nếu là khách hàng.';
  }

  const emailBody = `
[CẢNH BÁO KHẨN CẤP SYNAPES STUDIO] — MÃ SỰ CỐ: ${incidentId}

Kính gửi Kỹ sư Nguyễn Hoàng Thiện,
Hệ thống vừa ghi nhận một sự cố vượt ngưỡng tự phục hồi hoặc cảnh báo an ninh quan trọng:

• Thời gian phát hiện: ${timeFormatted}
• Mã người dùng / Phiên: ${userCode}
• Module gặp sự cố: ${taskName}

==================================================
PHÂN TÍCH NHANH TỪ AI VỆ SĨ (ROOT CAUSE ANALYSIS):
1. Bản chất nguyên nhân (Root Cause):
   ${rcaRoot}

2. Phạm vi ảnh hưởng (Impact Scope):
   ${rcaImpact}

3. Hành động đề xuất khắc phục (Recommended Action):
   ${rcaAction}
==================================================

CHI TIẾT LOG KỸ THUẬT (TRACEBACK / CONTEXT):
${stack}

Thông tin bổ sung:
${JSON.stringify(taskContext, null, 2)}

Trân trọng,
SYNAPES Self-Healing Watchdog Daemon
Kỹ sư phụ trách: KS. Nguyễn Hoàng Thiện
`.trim();

  // 2. Lưu nhật ký sự cố vào đĩa cứng an toàn
  const incidentFile = path.join(INCIDENT_LOGS_DIR, `${incidentId}.json`);
  const incidentData = {
    incidentId,
    timestamp: timestamp.toISOString(),
    timeFormatted,
    taskName,
    userCode,
    rca: { rcaRoot, rcaImpact, rcaAction },
    stack,
    context: taskContext,
    emailBody,
  };

  try {
    fs.writeFileSync(incidentFile, JSON.stringify(incidentData, null, 2), 'utf8');
  } catch (fsErr) {
    console.error('Không thể ghi file incident log:', fsErr);
  }

  console.warn(`[INCIDENT ALERT] ${incidentId} đã được lập biên bản và chuẩn bị gửi về ${ALERT_EMAIL}`);

  return incidentData;
}
