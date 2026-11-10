/**
 * synapes-anti-tamper.ts - Lớp Bảo vệ Chống Soi Mã Nguồn & DevTools Tampering
 * Tích hợp Cổng Mở Khóa Master Khẩn Cấp (07022006) theo Nghiệm Thu Phiên V
 * Chủ trì dự án: KS. Nguyễn Hoàng Thiện (nguyenhoangthien.hvt.15@gmail.com)
 */

export function initAntiTamperGuard(): void {
  if (typeof window === 'undefined') return;

  // Cho phép bỏ qua kiểm tra trong môi trường test tự động hoặc khi đã có cờ Master Override
  if (
    (window as any).__SYNAPES_DEV_MODE__ ||
    window.location.search.includes('bypass_anti_tamper=1') ||
    localStorage.getItem('synapes_dev_bypass') === '1' ||
    sessionStorage.getItem('synapes_dev_bypass') === '1'
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
      const incidentCode = `SEC-${Date.now().toString(36).toUpperCase()}`;

      // Giao diện bảo mật chuẩn Enterprise Minimalist (loại bỏ hoàn toàn AI-slop lòe loẹt)
      document.body.innerHTML = `
        <div style="background:#09090b;color:#f4f4f5;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;text-align:center;padding:24px;box-sizing:border-box;">
          <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:#18181b;border:1px solid #27272a;border-radius:9999px;font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:#a1a1aa;margin-bottom:20px;letter-spacing:0.04em;">
            <span style="width:6px;height:6px;border-radius:50%;background:#ef4444;display:inline-block;"></span>
            AN NINH HỆ THỐNG • MÃ TRUY CẬP 403
          </div>

          <h1 style="font-size:20px;font-weight:600;margin:0 0 10px 0;color:#f4f4f5;letter-spacing:-0.01em;">
            GIỚI HẠN TRUY CẬP HỆ THỐNG
          </h1>
          <p style="color:#a1a1aa;max-width:480px;font-size:13px;line-height:1.6;margin:0 0 24px 0;">
            Hệ thống SYNAPES phát hiện thao tác kiểm tra mã nguồn hoặc cửa sổ Developer Tools. Phiên truy cập của bạn đã tạm thời được đưa vào danh sách kiểm soát an ninh.
          </p>

          <!-- KHUNG MỞ KHÓA MASTER DÀNH CHO KỸ SƯ TRƯỞNG -->
          <div style="background:#121214;border:1px solid #27272a;border-radius:10px;padding:18px 20px;max-width:390px;width:100%;box-sizing:border-box;text-align:left;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:11px;font-weight:600;color:#d4d4d8;text-transform:uppercase;letter-spacing:0.05em;font-family:ui-monospace,monospace;">
                Xác Thực Kỹ Sư Trưởng
              </span>
              <span style="font-size:10px;color:#71717a;font-family:ui-monospace,monospace;">Master Override</span>
            </div>
            <p style="font-size:12px;color:#71717a;line-height:1.4;margin:0 0 12px 0;">
              Nhập mã Master Key để giải phóng địa chỉ IP và khôi phục quyền truy cập:
            </p>
            <div style="display:flex;gap:8px;">
              <input
                id="synapes-master-pass"
                type="password"
                placeholder="Nhập mã Master (07022006)..."
                autocomplete="off"
                style="flex:1;background:#09090b;border:1px solid #3f3f46;color:#f4f4f5;padding:8px 12px;border-radius:6px;font-size:13px;font-family:ui-monospace,monospace;outline:none;box-sizing:border-box;"
              />
              <button
                id="synapes-master-unlock-btn"
                style="background:#f4f4f5;color:#09090b;border:none;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background 0.15s ease;"
              >
                Mở Khóa
              </button>
            </div>
            <div id="synapes-unlock-feedback" style="display:none;font-size:12px;margin-top:10px;line-height:1.4;"></div>
          </div>

          <div style="margin-top:24px;font-size:11px;color:#71717a;font-family:ui-monospace,monospace;line-height:1.6;">
            Mã sự cố: <span style="color:#a1a1aa;">${incidentCode}</span> • Chủ trì: <span style="color:#d4d4d8;">KS. Nguyễn Hoàng Thiện</span>
            <br />
            Email kỹ thuật: <a href="mailto:nguyenhoangthien.hvt.15@gmail.com" style="color:#a1a1aa;text-decoration:none;">nguyenhoangthien.hvt.15@gmail.com</a>
          </div>
        </div>
      `;

      // Đăng ký bộ lắng nghe sự kiện mở khóa Master
      const passInput = document.getElementById('synapes-master-pass') as HTMLInputElement | null;
      const unlockBtn = document.getElementById('synapes-master-unlock-btn') as HTMLButtonElement | null;
      const feedback = document.getElementById('synapes-unlock-feedback') as HTMLDivElement | null;

      const executeUnlock = async () => {
        if (!passInput || !feedback) return;
        const pass = passInput.value.trim();

        if (pass === '07022006') {
          feedback.style.display = 'block';
          feedback.style.color = '#4ade80';
          feedback.innerText = '✓ Xác thực thành công. Đang giải phóng IP và tải lại hệ thống...';

          // Ghi nhận cờ bypass vĩnh viễn trên client
          try {
            localStorage.setItem('synapes_dev_bypass', '1');
            sessionStorage.setItem('synapes_dev_bypass', '1');
          } catch { }

          // Gửi tín hiệu giải phóng IP về máy chủ
          try {
            await fetch('/api/security/unlock', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password: pass }),
            });
          } catch { }

          setTimeout(() => {
            window.location.href = window.location.origin + window.location.pathname + '?bypass_anti_tamper=1';
          }, 600);
        } else {
          feedback.style.display = 'block';
          feedback.style.color = '#f87171';
          feedback.innerText = '✕ Mật mã Master không chính xác. Yêu cầu mở khóa bị từ chối.';
        }
      };

      if (unlockBtn) {
        unlockBtn.addEventListener('click', executeUnlock);
      }
      if (passInput) {
        passInput.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            executeUnlock();
          }
        });
        passInput.focus();
      }

      // Báo cáo vi phạm về Server để đưa vào danh sách kiểm soát tạm thời
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
