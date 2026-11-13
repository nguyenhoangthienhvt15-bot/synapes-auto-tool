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

  // 3. Giám sát docked DevTools nhẹ nhàng (không gây khựng CPU hay khóa nhầm khi thu phóng / chuyển tab)
  const guardStartedAt = Date.now();
  const dockedThreshold = 340;
  setInterval(() => {
    if (devtoolsDetected) return;
    if (Date.now() - guardStartedAt < 6000) return;
    if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
    if (window.outerWidth < 900 || window.outerHeight < 600) return;

    const widthThreshold = window.outerWidth - window.innerWidth > dockedThreshold;
    const heightThreshold = window.outerHeight - window.innerHeight > dockedThreshold;
    if (widthThreshold || heightThreshold) {
      triggerViolation('devtools_dock_detected');
    } else if (violationCount > 0) {
      violationCount = 0;
    }
  }, 5000);

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
                placeholder="Nhập mã Master Key..."
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
        if (!pass) {
          feedback.style.display = 'block';
          feedback.style.color = '#f87171';
          feedback.innerText = '✕ Vui lòng nhập mã Master Key.';
          return;
        }

        try {
          // 1. Xác thực trực tiếp qua Backend API bảo mật
          const resp = await fetch('/api/security/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pass }),
          });
          const data = await resp.json().catch(() => ({}));

          if (resp.ok && data.success) {
            feedback.style.display = 'block';
            feedback.style.color = '#4ade80';
            feedback.innerText = '✓ Xác thực thành công. Đang giải phóng IP và tải lại hệ thống...';

            try {
              localStorage.setItem('synapes_dev_bypass', '1');
              sessionStorage.setItem('synapes_dev_bypass', '1');
              if (data.token) localStorage.setItem('synapes_bypass_token', data.token);
            } catch { }

            setTimeout(() => {
              window.location.href = window.location.origin + window.location.pathname + '?bypass_anti_tamper=1';
            }, 600);
            return;
          }

          if (resp.status === 429) {
            feedback.style.display = 'block';
            feedback.style.color = '#f87171';
            feedback.innerText = '✕ ' + (data.error || 'Đã vượt quá số lần thử. Vui lòng đợi.');
            return;
          }

          feedback.style.display = 'block';
          feedback.style.color = '#f87171';
          feedback.innerText = '✕ ' + (data.error || 'Mật mã Master không chính xác.');
        } catch {
          // 2. Dự phòng ngoại tuyến (Offline Cryptographic Verification)
          try {
            const encoder = new TextEncoder();
            const data = encoder.encode(pass);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

            // Hash chuẩn SHA-256 của Master Key
            if (hashHex === '0a45ddc25271095c13715e2349bfb98525839a9c7e0620036aaeb6b238f93931') {
              feedback.style.display = 'block';
              feedback.style.color = '#4ade80';
              feedback.innerText = '✓ Xác thực ngoại tuyến thành công. Đang tải lại hệ thống...';
              localStorage.setItem('synapes_dev_bypass', '1');
              sessionStorage.setItem('synapes_dev_bypass', '1');
              setTimeout(() => {
                window.location.href = window.location.origin + window.location.pathname + '?bypass_anti_tamper=1';
              }, 600);
              return;
            }
          } catch { }

          feedback.style.display = 'block';
          feedback.style.color = '#f87171';
          feedback.innerText = '✕ Mật mã Master không chính xác hoặc máy chủ không phản hồi.';
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
