import React, { useState, useEffect } from 'react';
import { Project, UserAccount } from '../types';
import { HardDrive, ExternalLink, CheckCircle2, Folder, ArrowLeft, LogIn, X, Check, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

interface DriveBackupViewProps {
  currentUser?: UserAccount | null;
  projects: Project[];
  driveEmail?: string;
  isConnected?: boolean;
  onUpdateDrive?: (email: string, isConnected: boolean) => void;
  onOpenLogin?: () => void;
  onBack?: () => void;
}

export const DriveBackupView: React.FC<DriveBackupViewProps> = ({
  currentUser,
  projects,
  driveEmail: propsDriveEmail,
  isConnected: propsIsConnected,
  onUpdateDrive,
  onOpenLogin,
  onBack,
}) => {
  const publishedProjects = projects.filter((p) => p.driveBackupUrl);

  const [driveEmail, setDriveEmail] = useState<string>(() => {
    if (propsDriveEmail !== undefined) return propsDriveEmail;
    try {
      return localStorage.getItem('synapes_drive_email') || '';
    } catch {
      return '';
    }
  });

  const [isConnected, setIsConnected] = useState<boolean>(() => {
    if (propsIsConnected !== undefined) return propsIsConnected;
    try {
      return localStorage.getItem('synapes_drive_connected') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (propsDriveEmail !== undefined) setDriveEmail(propsDriveEmail);
    if (propsIsConnected !== undefined) setIsConnected(propsIsConnected);
  }, [propsDriveEmail, propsIsConnected]);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [inputEmail, setInputEmail] = useState(driveEmail || currentUser?.email || '');
  const [inputAccountName, setInputAccountName] = useState('Google Drive Studio Storage');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenLoginModal = () => {
    if (!currentUser || !currentUser.isLoggedIn) {
      showToast('⚠️ Vui lòng đăng nhập tài khoản Studio của bạn trước khi kết nối Google Drive.');
      if (onOpenLogin) onOpenLogin();
      return;
    }
    setInputEmail(driveEmail || currentUser?.email || 'synapes.backup@gmail.com');
    setShowLoginModal(true);
  };

  const handleConfirmLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = inputEmail.trim() || currentUser?.email || 'synapes.backup@gmail.com';
    setDriveEmail(email);
    setIsConnected(true);
    onUpdateDrive?.(email, true);
    setShowLoginModal(false);
    showToast(`Đã kết nối tài khoản Google Drive [${email}] và cấp quyền drive.file thành công!`);
  };

  const handleDisconnect = () => {
    if (!currentUser || !currentUser.isLoggedIn) {
      showToast('⚠️ Vui lòng đăng nhập tài khoản Studio của bạn.');
      if (onOpenLogin) onOpenLogin();
      return;
    }

    if (confirm(`Bạn có chắc muốn ngắt liên kết tài khoản Drive [${driveEmail}]? Các bản sao lưu tự động sẽ tạm dừng.`)) {
      setIsConnected(false);
      onUpdateDrive?.(driveEmail, false);
      showToast('Đã ngắt kết nối tài khoản Google Drive.');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-white/10 flex items-center gap-2 animate-slide-up">
          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cảnh báo khi chưa đăng nhập */}
      {(!currentUser || !currentUser.isLoggedIn) && (
        <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-2xs animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="text-xs font-bold">Chưa Đăng Nhập Tài Khoản Studio</div>
              <div className="text-[11px] text-amber-800 mt-0.5">
                Google Drive Storage đang ở trạng thái chưa liên kết. Vui lòng đăng nhập tài khoản của bạn để kết nối và tự động sao lưu dữ liệu.
              </div>
            </div>
          </div>
          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs flex-shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đăng Nhập Ngay</span>
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="studio-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-secondary flex items-center gap-1.5"
              title="Quay lại bàn duyệt"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          )}

          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center flex-shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Thư Viện Sao Lưu Google Drive</h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              Đồng bộ dữ liệu video phân rã và thành phẩm lên không gian lưu trữ đám mây
            </p>
          </div>
        </div>

        {/* Nút hành động tài khoản và mở Drive */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {isConnected ? (
            <>
              <div
                className="px-2.5 py-1 rounded-md bg-zinc-50 border border-black/10 text-xs flex items-center gap-1.5"
                title={`Đang kết nối: ${driveEmail}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="font-mono text-zinc-900 font-medium truncate max-w-[180px] sm:max-w-xs">{driveEmail}</span>
              </div>

              <button
                onClick={handleOpenLoginModal}
                className="btn-secondary flex items-center gap-1.5 text-xs font-medium"
                title="Đăng nhập tài khoản Google Drive khác"
              >
                <LogIn className="w-3.5 h-3.5 text-zinc-700" />
                <span>Đăng nhập tài khoản</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleOpenLoginModal}
              className="btn-primary flex items-center gap-1.5 text-xs shadow-xs font-medium"
              title="Đăng nhập và ủy quyền tài khoản Google Drive"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập tài khoản</span>
            </button>
          )}

          <a
            href="https://drive.google.com"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary flex items-center gap-1.5 self-start sm:self-auto text-xs"
          >
            <span>Mở Google Drive</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>
        </div>
      </div>

      <div className="studio-card p-3 text-xs text-zinc-600 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 truncate">
          <Folder className="w-4 h-4 text-zinc-700 flex-shrink-0" />
          <div className="truncate">
            <span className="text-zinc-500">Đường dẫn đồng bộ mặc định: </span>
            <span className="font-mono text-zinc-900 font-medium">My Drive / Du_An_Video / 2026 / 11 /</span>
          </div>
        </div>

        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="text-[11px] text-zinc-400 hover:text-red-600 transition flex-shrink-0"
            title="Ngắt kết nối tài khoản"
          >
            Ngắt kết nối
          </button>
        )}
      </div>

      {/* Table */}
      <div className="studio-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 text-zinc-500 border-b border-black/5 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium">Tên Video & Tập Tin</th>
                <th className="py-2.5 px-4 font-medium">Tỉ Lệ</th>
                <th className="py-2.5 px-4 font-medium">Thời Lượng</th>
                <th className="py-2.5 px-4 font-medium">Kênh Phát Sóng</th>
                <th className="py-2.5 px-4 font-medium">Trạng Thái Đồng Bộ</th>
                <th className="py-2.5 px-4 font-medium text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {publishedProjects.map((proj) => (
                <tr key={proj.id} className="hover:bg-zinc-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={proj.thumbnailUrl}
                        alt={proj.title}
                        className="w-14 h-9 object-cover rounded bg-zinc-200 border border-black/10 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-zinc-900 truncate max-w-xs">{proj.title}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {proj.id}_final_1080p.mp4
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-600 text-[11px]">
                    {proj.aspectRatio}
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-600 text-[11px]">
                    {Math.floor(proj.duration / 60)}m{proj.duration % 60}s
                  </td>
                  <td className="py-3 px-4 text-zinc-600 text-[11px]">
                    {proj.targetChannels.join(', ')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-800 border border-zinc-200">
                      <CheckCircle2 className="w-3 h-3 text-zinc-700" />
                      <span>ĐÃ ĐỒNG BỘ</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={proj.driveBackupUrl || 'https://drive.google.com'}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary py-1 px-2.5 text-[11px] inline-flex items-center gap-1"
                    >
                      <span>Xem file</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Đăng nhập & Cấp quyền Google Drive */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-black/10 max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-black/10 flex items-center justify-center p-1.5 flex-shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 87.3 78" fill="none">
                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
                    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47" />
                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l6.1 10.55z" fill="#ea4335" />
                    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
                    <path d="m59.8 53h27.5c0-1.55-.4-3.1-1.2-4.5l-13.75-23.8c-.8-1.4-1.95-2.5-3.3-3.3L55.3 45.2z" fill="#2684fc" />
                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3H27.5l-6.15 10.6c1.35.8 2.9 1.2 4.5 1.2h43.2c1.6 0 3.15-.45 4.5-1.2z" fill="#ffba00" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-zinc-900 font-semibold text-xs uppercase tracking-wider font-mono">
                    Đăng Nhập Tài Khoản Google Drive
                  </h3>
                  <p className="text-zinc-500 text-xs">Cấp quyền Google Drive API để tự động đồng bộ video</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmLogin} className="space-y-3.5 text-xs">
              {/* Nút gợi ý tài khoản mẫu */}
              <div className="p-3 bg-zinc-50 border border-black/5 rounded-lg space-y-2 text-center">
                <div className="text-[11px] text-zinc-500">Đăng nhập nhanh với tài khoản Google Studio:</div>
                <button
                  type="button"
                  onClick={() => {
                    setInputEmail('synapes.backup@gmail.com');
                    setInputAccountName('Google Drive Studio Storage');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 border border-black/10 font-medium text-xs shadow-2xs flex items-center justify-center gap-2 transition"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Sử dụng: synapes.backup@gmail.com</span>
                </button>
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">
                  Tên Định Danh Kho Lưu Trữ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Google Drive Studio Storage"
                  value={inputAccountName}
                  onChange={(e) => setInputAccountName(e.target.value)}
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">
                  Email Tài Khoản Google (Gmail / Google Workspace) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com hoặc user@company.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>

              {/* Chi tiết quyền hạn Drive */}
              <div className="p-2.5 rounded-lg bg-zinc-50 border border-black/5 space-y-1.5 text-[11px] text-zinc-600">
                <div className="flex items-center gap-1.5 font-medium text-zinc-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Quyền hạn yêu cầu: https://www.googleapis.com/auth/drive.file</span>
                </div>
                <p className="text-zinc-500 leading-relaxed pl-5">
                  Phạm vi bảo mật thu hẹp: Chỉ cho phép ứng dụng SYNAPES đọc và tải lên các tệp do chính nó quản lý. Hệ thống không có quyền xem hay chỉnh sửa các tài liệu riêng tư khác trong Drive của bạn.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Xác Nhận & Cấp Quyền Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
