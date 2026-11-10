/**
 * synapes-anti-tamper.ts - Lớp Bảo vệ Chống Soi Mã Nguồn & DevTools Tampering
 * Thiết kế kiến trúc theo Báo cáo Đánh giá Phiên họp 1 — Hội đồng Kỹ thuật
 * Chủ trì dự án: KS. Nguyễn Hoàng Thiện
 */

export function initAntiTamperGuard(): void {
  if (typeof window === 'undefined') return;

  // Cho phép bỏ qua kiểm tra trong môi trường test tự động (Playwright/CI) hoặc dev bypass
  if (
    (window as any).__SYNAPES_DEV_MODE__ ||
    window.location.search.includes('bypass_anti_tamper=1') ||
    localStorage.getItem('synapes_dev_bypass') === '1'
  ) {
    return;
  }

  let devtoolsDetected = false;
  let violationCount = 0;

  // 1. Vô hiệu hóa phím tắt soi mã nguồn (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    const isCmdOrCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;

    if (
      e.key === 'F12' ||
      (isCmdOrCtrl && isShift && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
      (isCmdOrCtrl && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S'))
    ) {
      e.preventDefault();
      e.stopPropagation();
      triggerViolation('keyboard_shortcut_tampering');
      return false;
    }
  }, true);

  // 2. Chặn chuột phải (Context Menu)
  window.addEventListener('contextmenu', (e: MouseEvent) => {
    e.preventDefault();
    return false;
  }, true);

  // 3. Bẫy kích thước cửa sổ (Window Dimension & OuterWidth Delta Trap)
  const threshold = 160;
  setInterval(() => {
    if (devtoolsDetected) return;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    if (widthThreshold || heightThreshold) {
      triggerViolation('devtools_dock_detected');
    }
  }, 1200);

  // 4. Bẫy Debugger Vô Hạn (Infinite Debugger Loop)
  setInterval(() => {
    if (devtoolsDetected) return;
    const startTime = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    const endTime = performance.now();
    if (endTime - startTime > 100) {
      triggerViolation('debugger_paused_inspection');
    }
  }, 2000);

  // Hàm xử lý khi phát hiện hành vi vi phạm
  async function triggerViolation(reason: string): Promise<void> {
    violationCount++;
    if (violationCount >= 2 && !devtoolsDetected) {
      devtoolsDetected = true;

      // Xóa sạch DOM để kẻ gian không nhìn thấy nội dung giao diện
      document.body.innerHTML = `
        <div style="background:#09090b;color:#ef4444;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px;box-sizing:border-box;">
          <div style="font-size:48px;margin-bottom:16px;">🚫</div>
          <h1 style="font-size:24px;font-weight:bold;margin-bottom:12px;color:#f87171;letter-spacing:-0.02em;">CẢNH BÁO VI PHẠM BẢO MẬT HỆ THỐNG</h1>
          <p style="color:#a1a1aa;max-width:520px;font-size:14px;line-height:1.6;margin-bottom:20px;">
            Hệ thống SYNAPES phát hiện hành vi cố ý can thiệp vào mã nguồn dự án qua Công cụ Phát triển (Developer Tools / Source Inspection).
            Địa chỉ IP, danh tính phiên và thiết bị của bạn đã được ghi nhận vào nhật ký an ninh.
          </p>
          <div style="padding:10px 18px;background:#27272a;color:#f4f4f5;border-radius:8px;font-family:monospace;font-size:13px;border:1px solid #3f3f46;">
            Hành động: <span style="color:#ef4444;font-weight:bold;">ĐÃ KHÓA TRUY CẬP TẠM THỜI (403 BANNED)</span>
          </div>
          <p style="color:#71717a;font-size:12px;margin-top:24px;">Mã sự cố an ninh: SEC-${Date.now().toString(36).toUpperCase()} • Kỹ sư giám sát: KS. Nguyễn Hoàng Thiện</p>
        </div>
      `;

      // Báo cáo vi phạm về Server để khóa IP và tài khoản
      try {
        await fetch('/api/security/report-violation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            violationType: reason,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          }),
        });
      } catch {
        // Ignored
      }
    }
  }
}
