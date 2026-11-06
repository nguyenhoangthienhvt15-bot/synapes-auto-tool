import React, { useState, useEffect } from 'react';
import { UserAccount, EngineerSheetRow } from '../types';
import { Lock, User, KeyRound, Shield, AlertCircle, ArrowRight, CheckCircle2, X, RefreshCw, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { RegisterModal } from './RegisterModal';
import {
  generateUserPassword,
  generateUserCode,
  getStoredRegistrations,
  resetToTempPassword,
  fetchGoogleSheetLive,
  sendForgotPasswordViaSheet,
} from '../services/googleSheetService';

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
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotAttempts, setForgotAttempts] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('synapes_forgot_attempts') || '0');
    } catch {
      return 0;
    }
  });
  const [isForgotLocked, setIsForgotLocked] = useState<boolean>(() => {
    try {
      return Number(localStorage.getItem('synapes_forgot_attempts') || '0') >= 5;
    } catch {
      return false;
    }
  });
  const [forgotSuccessData, setForgotSuccessData] = useState<{ email: string; code: string } | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessData(null);

    if (forgotAttempts >= 5 || isForgotLocked) {
      setIsForgotLocked(true);
      setForgotError('🚫 TÍNH NĂNG ĐÃ BỊ KHÓA: Bạn đã nhập sai quá 5 lần liên tiếp. Để bảo đảm an toàn, vui lòng liên hệ Kỹ sư qua Gmail: nguyenhoangthien.hvt.15@gmail.com.');
      return;
    }

    const emailClean = forgotEmail.trim().toLowerCase();
    const phoneClean = forgotPhone.trim().replace(/\D/g, '');

    if (!emailClean || !phoneClean) {
      setForgotError('Vui lòng nhập đầy đủ Gmail và Số điện thoại đã đăng ký.');
      return;
    }

    setIsSubmittingForgot(true);

    try {
      // 0. Đồng bộ dữ liệu mới nhất trực tiếp từ cả 2 tab Google Sheet trước khi đối soát
      const liveRows = await fetchGoogleSheetLive().catch(() => null);
      const activeSheetRows = liveRows && liveRows.length > 0 ? liveRows : sheetRows;

      const phoneTail = phoneClean.length >= 9 ? phoneClean.slice(-9) : phoneClean;

      // 1. Kiểm tra đối soát với hồ sơ đăng ký người dùng (trên trang "THÔNG TIN NGƯỜI DÙNG")
      const storedRegs = getStoredRegistrations();
      const regMatch = storedRegs.find((r) => {
        const rEmail = (r.email || '').trim().toLowerCase();
        const rPhone = (r.phone || '').trim().replace(/\D/g, '');
        const rPhoneTail = rPhone.length >= 9 ? rPhone.slice(-9) : rPhone;
        return rEmail === emailClean && (rPhone === phoneClean || (phoneTail.length >= 8 && rPhoneTail === phoneTail));
      });

      // 2. Kiểm tra với danh bạ Sheet ("Quản Lý Mật Khẩu")
      const sheetMatch = activeSheetRows.find((r) => {
        const rEmail = (r.registeredGmail || '').trim().toLowerCase();
        const notesPhone = (r.engineerNotes || '').replace(/\D/g, '');
        return (
          rEmail === emailClean &&
          (Boolean(regMatch) ||
            (phoneTail.length >= 8 && notesPhone.includes(phoneTail)) ||
            (!notesPhone && phoneClean.length >= 9))
        );
      });

      const matched = regMatch || sheetMatch;

      if (!matched) {
        const newAttempts = forgotAttempts + 1;
        setForgotAttempts(newAttempts);
        try {
          localStorage.setItem('synapes_forgot_attempts', String(newAttempts));
        } catch {}

        if (newAttempts >= 5) {
          setIsForgotLocked(true);
          setForgotError('🚫 Bạn đã nhập sai thông tin 5 lần liên tiếp! Tính năng Quên mật khẩu đã bị đóng để bảo mật tài khoản. Vui lòng liên hệ Kỹ sư qua Gmail: nguyenhoangthien.hvt.15@gmail.com để được hỗ trợ mở khóa.');
        } else {
          setForgotError(`⚠️ Gmail hoặc Số điện thoại không trùng khớp với hồ sơ đăng ký trên Google Sheet. Bạn còn ${5 - newAttempts} lần thử.`);
        }
        return;
      }

      // 3. Nếu đúng thông tin: Tạo lại mật khẩu mặc định mới dạng SNP_[3 số + 3 chữ]
      const newDefaultPass = generateUserPassword();
      const matchedCode =
        regMatch?.assignedCode ||
        sheetMatch?.code ||
        generateUserCode(regMatch?.dob || '01/01/2000');
      const matchedName = regMatch?.fullName || sheetMatch?.clientName || 'Khách hàng SYNAPES';

      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

      // Cập nhật vào danh sách Sheet cục bộ
      const baseRows = activeSheetRows.length > 0 ? activeSheetRows : sheetRows;
      const updatedRows = baseRows.map((item) => {
        if (item.code === matchedCode || item.registeredGmail.toLowerCase() === emailClean) {
          return {
            ...item,
            currentTempPassword: newDefaultPass,
            lastIssuedTime: timeString,
            accountStatus: 'temp_password_active' as const,
            engineerNotes: `${item.engineerNotes} | [${timeString}] Hệ thống cấp lại pass mặc định qua Quên mật khẩu.`,
          };
        }
        return item;
      });

      onUpdateSheetRow(updatedRows);
      resetToTempPassword(matchedCode, newDefaultPass);

      // 4. Gửi lệnh lên Google Sheet Apps Script để cập nhật mật khẩu trên cả 2 tab Sheet & gửi Gmail thực tế cho khách hàng
      await sendForgotPasswordViaSheet({
        email: emailClean,
        phone: forgotPhone.trim(),
        code: matchedCode,
        newPassword: newDefaultPass,
        fullName: matchedName,
      });

      // Đồng bộ thông báo UI
      onSendTempPasswordEmail(emailClean, matchedCode, newDefaultPass);

      // Xóa số lần nhập sai khi đã thành công
      setForgotAttempts(0);
      try {
        localStorage.removeItem('synapes_forgot_attempts');
      } catch {}

      setForgotSuccessData({
        email: emailClean,
        code: matchedCode,
      });
    } finally {
      setIsSubmittingForgot(false);
    }
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
              <h3 className="text-zinc-950 font-bold text-sm">Lấy Lại Mật Khẩu Đăng Nhập</h3>
            </div>

            {isForgotLocked ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-red-800">
                    <Lock className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>Tính Năng Đã Bị Khóa An Toàn</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Bạn đã nhập sai thông tin đối soát quá 5 lần liên tiếp. Hệ thống đã tự động đóng tính năng quên mật khẩu để bảo vệ tài khoản của bạn.
                  </p>
                  <div className="pt-1">
                    <a
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=nguyenhoangthien.hvt.15@gmail.com&su=LI%C3%8AN%20H%E1%BB%86%20NH%C3%80%20PH%C3%81T%20TRI%E1%BB%82N&body=K%C3%ADnh%20g%E1%BB%ADi%20K%E1%BB%B9%20s%C6%B0%20Nguy%E1%BB%85n%20Ho%C3%A0ng%20Thi%E1%BB%87n,%20t%C3%B4i%20c%E1%BA%A7n%20h%E1%BB%97%20tr%E1%BB%A3%20m%E1%BB%9F%20kh%C3%B3a%20v%C3%A0%20c%E1%BA%A5p%20l%E1%BA%A1i%20m%E1%BA%ADt%20kh%E1%BA%A9u%20t%C3%A0i%20kho%E1%BA%A3n%20SYNAPES%20Studio."
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-800 hover:text-red-950 underline cursor-pointer"
                    >
                      <span>Gửi Gmail liên hệ Kỹ sư mở khóa</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn-secondary w-full py-2 cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : !forgotSuccessData ? (
              <form onSubmit={handleForgotSubmit} className="space-y-3 text-xs">
                <p className="text-zinc-600 text-xs leading-relaxed">
                  Vui lòng nhập lại chính xác <strong>Gmail</strong> và <strong>Số điện thoại</strong> đã đăng ký. Hệ thống sẽ đối soát với Google Sheet quản trị và tự động cấp lại mật khẩu mặc định mới gửi về Gmail của bạn.
                </p>

                {forgotError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs leading-relaxed animate-in fade-in">
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Gmail đăng ký tài khoản *</label>
                  <input
                    type="email"
                    required
                    placeholder="vidu@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-2 text-xs text-zinc-950 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Số điện thoại đăng ký *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0912 345 678"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-2 text-xs text-zinc-950 font-mono focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="p-2 bg-amber-50/70 border border-amber-200/60 rounded-lg text-[11px] text-amber-800 font-mono">
                  Lưu ý: Bạn còn <strong>{5 - forgotAttempts}</strong> lần thử. Nhập sai quá 5 lần tính năng sẽ tự động đóng.
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
                    disabled={isSubmittingForgot}
                    className="btn-primary cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmittingForgot && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Xác Thực & Cấp Lại</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs animate-in fade-in">
                <div className="p-3.5 rounded-lg bg-zinc-50 border border-black/[0.06] space-y-2.5 text-zinc-800">
                  <div className="text-zinc-950 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã gửi mật khẩu mới về Gmail!
                  </div>
                  <p className="leading-relaxed">
                    Hệ thống đã tạo lại mật khẩu mặc định mới cho Mã Code: <strong className="text-zinc-950 font-mono">{forgotSuccessData.code}</strong> và gửi trực tiếp đến hộp thư Gmail: <strong className="text-zinc-950 font-mono">{forgotSuccessData.email}</strong>.
                  </p>
                  <div className="p-2.5 bg-white rounded-lg border border-black/[0.06] text-[11px] text-zinc-600 leading-relaxed">
                    🔒 <strong>Bảo mật tài khoản:</strong> Mật khẩu cấp mới không hiển thị trên trang Web. Vui lòng mở hộp thư đến (hoặc mục Spam/Quảng cáo) của Gmail đã đăng ký để nhận mật khẩu và đăng nhập.
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
                      setLoginCode(forgotSuccessData.code);
                      setLoginPass('');
                      setShowForgotModal(false);
                    }}
                    className="btn-primary cursor-pointer"
                  >
                    Quay Lại Đăng Nhập
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
