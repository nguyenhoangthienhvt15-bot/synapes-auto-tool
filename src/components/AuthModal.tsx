import React, { useState, useEffect } from 'react';
import { UserAccount, EngineerSheetRow } from '../types';
import { Lock, User, KeyRound, Shield, AlertCircle, ArrowRight, CheckCircle2, X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { RegisterModal } from './RegisterModal';

interface AuthModalProps {
  currentUser: UserAccount | null;
  sheetRows: EngineerSheetRow[];
  onLogin: (code: string, pass: string) => Promise<boolean> | boolean;
  onLogout: () => void;
  onForceChangePassword: (newPass: string) => void;
  onCloseChangePass?: () => void;
  onClose?: () => void;
  onUpdateSheetRow: (rows: EngineerSheetRow[]) => void;
  onSendTempPasswordEmail: (email: string, code: string, tempPass: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  sheetRows,
  onLogin,
  onForceChangePassword,
  onCloseChangePass,
  onClose,
  onUpdateSheetRow,
  onSendTempPasswordEmail,
}) => {
  const [internalVisible, setInternalVisible] = useState(true);
  const [loginCode, setLoginCode] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Forced password change (lần đầu login với pass mặc định)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changePassError, setChangePassError] = useState<string | null>(null);

  // Quên mật khẩu popup
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotCode, setForgotCode] = useState('');
  const [forgotSuccessData, setForgotSuccessData] = useState<{ tempPass: string; email: string } | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Đóng modal an toàn (hỗ trợ cả phím Esc)
  const handleClose = () => {
    setInternalVisible(false);
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const ok = await onLogin(loginCode.trim(), loginPass);
      if (!ok) {
        setLoginError('Mã Code hoặc Mật khẩu không chính xác. Vui lòng kiểm tra lại thông tin đăng nhập của bạn.');
      }
    } catch {
      setLoginError('Đã xảy ra lỗi khi kiểm tra đăng nhập. Vui lòng thử lại.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleChangePassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError(null);
    if (newPassword.length < 6) {
      setChangePassError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePassError('Xác nhận mật khẩu không trùng khớp.');
      return;
    }
    onForceChangePassword(newPassword);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessData(null);

    const codeClean = forgotCode.trim().toUpperCase();
    const targetRow = sheetRows.find((r) => r.code === codeClean);
    if (!targetRow) {
      setForgotError('Không tìm thấy Mã Code khách hàng trong hệ thống.');
      return;
    }

    const tempPass = `Auto-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const updated = sheetRows.map((item) => {
      if (item.code === targetRow.code) {
        return {
          ...item,
          currentTempPassword: tempPass,
          lastIssuedTime: timeString,
          accountStatus: 'temp_password_active' as const,
          engineerNotes: `${item.engineerNotes} | [${timeString}] Khách yêu cầu cấp lại pass qua WebApp.`,
        };
      }
      return item;
    });

    onUpdateSheetRow(updated);
    onSendTempPasswordEmail(targetRow.registeredGmail, targetRow.code, tempPass);
    setForgotSuccessData({ tempPass, email: targetRow.registeredGmail });
  };

  const isForcedReset = currentUser?.isLoggedIn && currentUser.isDefaultPassword;

  if (!internalVisible) {
    return null;
  }

  return (
    <>
      {/* Login Modal */}
      {(!currentUser || !currentUser.isLoggedIn) && !showRegisterModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div className="bg-white rounded-xl border border-black/[0.1] max-w-sm w-full p-6 sm:p-7 shadow-2xl space-y-4 relative">
            {/* Nút X Đóng */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
              title="Đóng cửa sổ (Esc)"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-9 h-9 mx-auto rounded-lg bg-zinc-100 border border-black/[0.06] flex items-center justify-center text-zinc-900 mb-2">
                <Shield className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-zinc-950 tracking-tight">Đăng Nhập Studio</h2>
              <p className="text-zinc-500 text-xs">Nhập Mã Code và Mật khẩu được cấp để truy cập hệ thống</p>
            </div>

            {loginError && (
              <div className="p-2.5 rounded-lg bg-red-50/80 border border-red-200 text-red-600 text-xs flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-700 font-medium block mb-1">Mã Code Khách Hàng</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value)}
                    placeholder="Nhập mã code của bạn"
                    className="w-full bg-white border border-black/[0.1] rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-950 font-mono font-medium uppercase focus:outline-none focus:border-zinc-900 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-700 font-medium">Mật Khẩu</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotCode(loginCode);
                      setShowForgotModal(true);
                      setForgotSuccessData(null);
                      setForgotError(null);
                    }}
                    className="text-zinc-600 hover:text-zinc-950 hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    Bạn quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full bg-white border border-black/[0.1] rounded-lg pl-8 pr-10 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-2.5 top-2 p-1 text-zinc-400 hover:text-zinc-700 transition rounded cursor-pointer"
                    title={showLoginPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-label={showLoginPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showLoginPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-secondary w-1/3 py-2 cursor-pointer"
                  title="Hủy đăng nhập và quay lại"
                >
                  Hủy / Thoát
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="btn-primary w-2/3 py-2 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang kiểm tra...</span>
                    </>
                  ) : (
                    <>
                      <span>Vào Bàn Làm Việc</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Tùy chọn Bạn chưa có tài khoản? Đăng kí ngay */}
              <div className="pt-3 text-center border-t border-black/[0.06]">
                <span className="text-zinc-500 text-xs">Bạn chưa có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(true)}
                  className="text-zinc-950 font-semibold text-xs hover:underline cursor-pointer transition"
                >
                  Đăng kí ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Force Password Change Modal */}
      {isForcedReset && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && onCloseChangePass) {
              onCloseChangePass();
            }
          }}
        >
          <div className="bg-white rounded-xl border border-black/[0.1] max-w-sm w-full p-6 shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => {
                if (onCloseChangePass) onCloseChangePass();
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
              title="Đóng / Hủy đổi mật khẩu"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-black/[0.06] flex items-center justify-center text-zinc-800 mx-auto">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-zinc-950">Đặt Mật Khẩu Cá Nhân Mới</h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                Bạn đang dùng mật khẩu tạm thời. Vui lòng đặt mật khẩu riêng của bạn để kích hoạt tài khoản.
              </p>
            </div>

            {changePassError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                {changePassError}
              </div>
            )}

            <form onSubmit={handleChangePassSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-700 font-medium block mb-1">Mật khẩu mới *</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white border border-black/[0.1] rounded-lg pl-3 pr-10 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-2 p-1 text-zinc-400 hover:text-zinc-700 transition rounded cursor-pointer"
                    title={showNewPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-label={showNewPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">Xác nhận mật khẩu *</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-black/[0.1] rounded-lg pl-3 pr-10 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-2.5 top-2 p-1 text-zinc-400 hover:text-zinc-700 transition rounded cursor-pointer"
                    title={showConfirmPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-label={showConfirmPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-zinc-50 border border-black/[0.06] rounded-lg text-[11px] text-zinc-600 leading-relaxed font-mono">
                Mật khẩu riêng được mã hóa bằng bcrypt an toàn để bảo vệ tài khoản Studio của bạn.
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseChangePass) onCloseChangePass();
                  }}
                  className="btn-secondary flex-1 py-2 cursor-pointer"
                >
                  Hủy / Để sau
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-2 cursor-pointer"
                >
                  Kích Hoạt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForgotModal(false);
            }
          }}
        >
          <div className="bg-white rounded-xl border border-black/[0.1] max-w-sm w-full p-6 shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
              title="Đóng / Hủy"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
              <h3 className="text-zinc-950 font-bold text-sm">Bạn Quên Mật Khẩu?</h3>
            </div>

            {!forgotSuccessData ? (
              <form onSubmit={handleForgotSubmit} className="space-y-3 text-xs">
                <p className="text-zinc-600 text-xs leading-relaxed">
                  Nhập <strong>Mã Code</strong> của bạn. Hệ thống sẽ tạo mật khẩu tạm thời mới và tự động gửi về địa chỉ Gmail đã đăng ký của bạn.
                </p>

                {forgotError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Mã Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập mã code của bạn"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-2 text-xs text-zinc-950 font-mono uppercase focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn-secondary cursor-pointer"
                  >
                    Hủy / Quay lại
                  </button>
                  <button
                    type="submit"
                    className="btn-primary cursor-pointer"
                  >
                    Tạo & Gửi Gmail
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-lg bg-zinc-50 border border-black/[0.06] space-y-2 text-zinc-800">
                  <div className="text-zinc-950 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã gửi mật khẩu mới
                  </div>
                  <p>
                    Đã gửi đến Gmail: <strong className="text-zinc-950 font-mono">{forgotSuccessData.email}</strong>
                  </p>
                  <div className="p-2 bg-white rounded border border-black/[0.06]">
                    <div className="text-[10px] text-zinc-500 font-mono">Mật khẩu tạm thời:</div>
                    <div className="text-zinc-950 font-mono font-bold mt-0.5">{forgotSuccessData.tempPass}</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn-secondary cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginCode(forgotCode.toUpperCase());
                      setLoginPass(forgotSuccessData.tempPass);
                      setShowForgotModal(false);
                    }}
                    className="btn-primary cursor-pointer"
                  >
                    Điền & Đăng Nhập
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Registration Modal */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => setShowRegisterModal(false)}
      />
    </>
  );
};
