import React, { useState } from 'react';
import { UserAccount, EngineerSheetRow } from '../types';
import { Lock, User, KeyRound, Shield, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  currentUser: UserAccount | null;
  sheetRows: EngineerSheetRow[];
  onLogin: (code: string, pass: string) => boolean;
  onLogout: () => void;
  onForceChangePassword: (newPass: string) => void;
  onCloseChangePass?: () => void;
  onUpdateSheetRow: (rows: EngineerSheetRow[]) => void;
  onSendTempPasswordEmail: (email: string, code: string, tempPass: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  sheetRows,
  onLogin,
  onForceChangePassword,
  onCloseChangePass,
  onUpdateSheetRow,
  onSendTempPasswordEmail,
}) => {
  const [loginCode, setLoginCode] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Forced password change (lần đầu login với pass mặc định)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassError, setChangePassError] = useState<string | null>(null);

  // Quên mật khẩu popup
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotCode, setForgotCode] = useState('');
  const [forgotSuccessData, setForgotSuccessData] = useState<{ tempPass: string; email: string } | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const ok = onLogin(loginCode.trim(), loginPass);
    if (!ok) {
      setLoginError('Mã Code hoặc Mật khẩu không chính xác. Vui lòng kiểm tra lại với Kỹ sư.');
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
      setForgotError('Không tìm thấy Mã Code trong hệ thống quản trị của Kỹ sư.');
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
          engineerNotes: `${item.engineerNotes} | [${timeString}] Khách quên pass -> Tự động cấp pass mới & gửi Gmail.`,
        };
      }
      return item;
    });

    onUpdateSheetRow(updated);
    onSendTempPasswordEmail(targetRow.registeredGmail, targetRow.code, tempPass);
    setForgotSuccessData({ tempPass, email: targetRow.registeredGmail });
  };

  const isForcedReset = currentUser?.isLoggedIn && currentUser.isDefaultPassword;

  return (
    <>
      {/* Login Modal */}
      {(!currentUser || !currentUser.isLoggedIn) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl border border-black/[0.08] max-w-sm w-full p-7 shadow-2xl space-y-5 animate-scale-up">
            {/* Window traffic lights */}
            <div className="flex items-center gap-1.5 pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]"></span>
            </div>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0071E3]/10 border border-[#0071E3]/20 flex items-center justify-center text-[#0071E3] mb-2">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#1D1D1F] tracking-tight">Đăng Nhập Studio</h2>
              <p className="text-zinc-500 text-xs">Mã Code được Kỹ sư cấp kèm mật khẩu mặc định</p>
            </div>

            {loginError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
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
                    placeholder="VIP-001"
                    className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl pl-8 pr-3 py-2 text-xs text-[#0071E3] font-mono font-semibold uppercase focus:outline-none focus:bg-white focus:border-[#0071E3] transition"
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
                    className="text-[#0071E3] hover:underline text-[11px] font-medium"
                  >
                    Bạn quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="password"
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Mật khẩu"
                    className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-800 focus:outline-none focus:bg-white focus:border-[#0071E3] transition"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 space-y-0.5">
                <div className="font-semibold text-amber-950">Tài khoản demo sẵn sàng:</div>
                <div className="font-mono text-amber-800">• Mã: <strong>VIP-001</strong> | Pass: <strong>AutoPass@8912</strong></div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <span>Vào Bàn Làm Việc</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Force Password Change Modal */}
      {isForcedReset && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget && onCloseChangePass) {
              onCloseChangePass();
            }
          }}
        >
          <div className="bg-white rounded-2xl border border-black/[0.08] max-w-sm w-full p-6 shadow-2xl space-y-4 relative">
            {/* Nút X Thoát / Đóng */}
            {onCloseChangePass && (
              <button
                onClick={onCloseChangePass}
                className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-black/[0.05] transition"
                title="Đóng / Hủy đổi mật khẩu"
              >
                ✕
              </button>
            )}

            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 mx-auto">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-[#1D1D1F]">Đặt Mật Khẩu Cá Nhân Mới</h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                Bạn đang dùng mật khẩu tạm thời. Vui lòng đặt mật khẩu riêng của bạn để kích hoạt tài khoản.
              </p>
            </div>

            {changePassError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                {changePassError}
              </div>
            )}

            <form onSubmit={handleChangePassSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-700 font-medium block mb-1">Mật khẩu mới *</label>
                <input
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">Xác nhận mật khẩu *</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-[#0071E3]"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 leading-relaxed">
                Mật khẩu riêng được mã hóa an toàn. Sheet kỹ sư sẽ chuyển sang <strong className="text-emerald-700">Khách đã đổi pass riêng</strong>.
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-black/[0.06]">
                {onCloseChangePass && (
                  <button
                    type="button"
                    onClick={onCloseChangePass}
                    className="flex-1 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition apple-btn-tap"
                  >
                    Hủy / Để sau
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#34C759] hover:bg-[#30D158] text-white font-semibold rounded-xl text-xs transition apple-btn-tap shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl border border-black/[0.08] max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <h3 className="text-[#1D1D1F] font-bold text-sm">Bạn Quên Mật Khẩu?</h3>
              <button onClick={() => setShowForgotModal(false)} className="text-zinc-400 hover:text-zinc-700 text-xs">
                ✕
              </button>
            </div>

            {!forgotSuccessData ? (
              <form onSubmit={handleForgotSubmit} className="space-y-3 text-xs">
                <p className="text-zinc-600 text-xs leading-relaxed">
                  Nhập <strong>Mã Code</strong> của bạn. Hệ thống sẽ sinh mật khẩu tạm mới, cập nhật lên Sheet Kỹ Sư và tự động gửi thông báo về Gmail của bạn.
                </p>

                {forgotError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Mã Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="VIP-001"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl px-3 py-2 text-xs text-[#0071E3] font-mono font-semibold uppercase focus:outline-none focus:bg-white focus:border-[#0071E3]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#0071E3] text-white rounded-xl text-xs font-medium shadow-xs"
                  >
                    Tạo & Gửi Gmail
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-emerald-900">
                  <div className="text-emerald-800 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã gửi mật khẩu mới
                  </div>
                  <p>
                    Đã gửi đến Gmail: <strong className="text-emerald-950 font-mono">{forgotSuccessData.email}</strong>
                  </p>
                  <div className="p-2 bg-white rounded border border-emerald-200">
                    <div className="text-[10px] text-zinc-500">Mật khẩu tạm (đã lưu trên Sheet):</div>
                    <div className="text-[#FF9500] font-mono font-bold mt-0.5">{forgotSuccessData.tempPass}</div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setLoginCode(forgotCode.toUpperCase());
                      setLoginPass(forgotSuccessData.tempPass);
                      setShowForgotModal(false);
                    }}
                    className="px-4 py-1.5 bg-[#0071E3] text-white rounded-xl text-xs font-medium shadow-xs"
                  >
                    Điền & Đăng Nhập
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
