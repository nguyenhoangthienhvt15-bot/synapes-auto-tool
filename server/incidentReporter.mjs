/**
 * incidentReporter.mjs - Hệ thống Tự Phục Hồi (Self-Healing) & Cảnh Báo Sự Cố Tự Động
 * Thiết kế kiến trúc theo Báo cáo Đánh giá Phiên họp 1 — Hội đồng Kỹ thuật
 * Chủ trì dự án: KS. Nguyễn Hoàng Thiện (nguyenhoangthien.hvt.15@gmail.com)
 */

import fs from 'fs';
import path from 'path';
import tls from 'tls';

const INCIDENT_LOGS_DIR = path.resolve(process.cwd(), 'data', 'incidents');
const ALERT_EMAIL = 'nguyenhoangthien.hvt.15@gmail.com';

/**
 * Trình gửi email SMTP Daemon trực tiếp theo chuẩn RFC 5321 & RFC 5322
 */
export async function sendSmtpDaemonEmail(subject, textBody, recipient = ALERT_EMAIL) {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // 1. Lưu bản sao thư mục outbox để daemon nền tiếp tục gửi nếu mất kết nối
  const outboxDir = path.resolve(process.cwd(), 'data', 'mail_outbox');
  try {
    if (!fs.existsSync(outboxDir)) fs.mkdirSync(outboxDir, { recursive: true });
    const emlFile = path.join(outboxDir, `mail_${Date.now()}.eml`);
    const emlContent = [
      `From: SYNAPES Watchdog Daemon <no-reply@synapes.studio>`,
      `To: <${recipient}>`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      textBody,
    ].join('\r\n');
    fs.writeFileSync(emlFile, emlContent, 'utf8');
  } catch (fsErr) {
    console.warn('Lỗi lưu mail outbox:', fsErr.message);
  }

  // 2. Nếu có thông tin đăng nhập SMTP, thực hiện kết nối TLS gửi thư trực tiếp
  if (user && pass) {
    return new Promise((resolve) => {
      const socket = tls.connect({ host, port, rejectUnauthorized: false }, () => {
        let step = 0;
        socket.on('data', (data) => {
          const resp = data.toString();
          if (step === 0 && resp.startsWith('220')) {
            socket.write(`EHLO synapes.studio\r\n`);
            step++;
          } else if (step === 1 && resp.startsWith('250')) {
            socket.write(`AUTH LOGIN\r\n`);
            step++;
          } else if (step === 2 && resp.startsWith('334')) {
            socket.write(`${Buffer.from(user).toString('base64')}\r\n`);
            step++;
          } else if (step === 3 && resp.startsWith('334')) {
            socket.write(`${Buffer.from(pass).toString('base64')}\r\n`);
            step++;
          } else if (step === 4 && resp.startsWith('235')) {
            socket.write(`MAIL FROM:<${user}>\r\n`);
            step++;
          } else if (step === 5 && resp.startsWith('250')) {
            socket.write(`RCPT TO:<${recipient}>\r\n`);
            step++;
          } else if (step === 6 && resp.startsWith('250')) {
            socket.write(`DATA\r\n`);
            step++;
          } else if (step === 7 && resp.startsWith('354')) {
            const raw = [
              `From: "SYNAPES Watchdog" <${user}>`,
              `To: <${recipient}>`,
              `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
              `Date: ${new Date().toUTCString()}`,
              `MIME-Version: 1.0`,
              `Content-Type: text/plain; charset=UTF-8`,
              ``,
              textBody,
              `.`,
              ``,
            ].join('\r\n');
            socket.write(raw);
            step++;
          } else if (step === 8 && resp.startsWith('250')) {
            socket.write(`QUIT\r\n`);
            resolve({ success: true, method: 'smtp_tls' });
          }
        });
      });

      socket.on('error', (err) => {
        console.warn('Lỗi kết nối SMTP Daemon:', err.message);
        resolve({ success: false, error: err.message });
      });

      setTimeout(() => {
        try { socket.destroy(); } catch {}
        resolve({ success: false, error: 'SMTP Timeout' });
      }, 8000);
    });
  }

  return { success: true, method: 'outbox_queued' };
}

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

  console.warn(`[INCIDENT ALERT] ${incidentId} đã được lập biên bản và sẵn sàng gửi về ${ALERT_EMAIL}`);

  // 3. Tự động gửi cảnh báo khẩn cấp qua SMTP Daemon
  sendSmtpDaemonEmail(`[CẢNH BÁO KHẨN CẤP SYNAPES STUDIO] — MÃ SỰ CỐ: ${incidentId}`, emailBody, ALERT_EMAIL).catch((err) => {
    console.warn('Lỗi SMTP Daemon:', err);
  });

  // 4. Tự động chuyển tiếp cảnh báo khẩn cấp tới Gmail Trưởng ban KS. Nguyễn Hoàng Thiện qua Google Apps Script Webhook Relay
  const webhookUrl = process.env.APPS_SCRIPT_WEBHOOK_URL || process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (webhookUrl && webhookUrl.startsWith('https://script.google.com/')) {
    try {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'emergency_report',
          incidentType: rcaRoot.slice(0, 50),
          severity: 'CRITICAL',
          description: `Sự cố: ${taskName} - ${rcaRoot}`,
          emailBody: emailBody,
          targetEmail: ALERT_EMAIL,
          actionTaken: rcaAction,
        }),
      }).catch((e) => console.warn('Lỗi gửi webhook cảnh báo sự cố:', e.message));
    } catch {
      // Ignored
    }
  }

  return incidentData;
}

