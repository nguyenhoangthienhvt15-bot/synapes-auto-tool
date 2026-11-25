import React, { useState, useEffect } from 'react';
import { UserAccount, ContractCategory } from '../types';
import {
  Bell, KeyRound, LogOut, BookOpen, Film,
  PanelLeftClose, PanelLeftOpen, AudioLines, CloudDownload
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserAccount | null;
  pendingCount: number;
  activeView: string;
  userPlanTier?: ContractCategory;
  loginAnimTrigger?: number;
  onSelectView: (view: string) => void;
  onLogout: () => void;
  onOpenChangePass: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onCloudBackup?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  pendingCount,
  activeView,
  loginAnimTrigger = 0,
  onSelectView,
  onLogout,
  onOpenChangePass,
  onOpenLogin,
  onOpenRegister,
  onCloudBackup,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLogoAnimating, setIsLogoAnimating] = useState<boolean>(false);

  useEffect(() => {
    if (!loginAnimTrigger || loginAnimTrigger <= 0) return;
    setIsLogoAnimating(false);
    const raf = requestAnimationFrame(() => setIsLogoAnimating(true));
    const timer = setTimeout(() => setIsLogoAnimating(false), 6100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [loginAnimTrigger]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        `${now.getHours().toString().padStart(2, '0')}:${now
          .getMinutes()
          .toString()
          .padStart(2, '0')}`
      );
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  // Global shortcut Ctrl+B / Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onToggleSidebar?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleSidebar]);

  return (
    <header className="h-14 px-4 sm:px-6 bg-[#FDFCF9]/95 backdrop-blur-md border-b border-black/[0.08] flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Brand, Sidebar Toggle & Studio Lockup */}
      <div className="flex items-center gap-2.5">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-[#141413] hover:bg-[#F1EEE7] transition cursor-pointer flex items-center justify-center mr-0.5"
            title={isSidebarCollapsed ? "Mở rộng thanh điều hướng (Ctrl+B)" : "Thu gọn thanh điều hướng (Ctrl+B)"}
            aria-label="Toggle sidebar"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-[#141413]" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-[#141413]" />
            )}
          </button>
        )}

        <button
          onClick={() => onSelectView('pending-approval')}
          onDoubleClick={(e) => {
            e.preventDefault();
            setIsLogoAnimating(false);
            requestAnimationFrame(() => setIsLogoAnimating(true));
            setTimeout(() => setIsLogoAnimating(false), 6100);
          }}
          className={`flex items-center gap-2.5 text-left group cursor-pointer px-2 py-1 rounded-xl hover:bg-[#F4F1EA]/70 transition ${
            isLogoAnimating ? 'synapes-brand-anim' : ''
          }`}
          data-testid="synapes-brand-lockup"
          title="SYNAPES Studio — Nhấp đúp để phát hiệu ứng thương hiệu"
        >
          <span className="synapes-rgb-sweep" aria-hidden="true" />
          <div className="synapes-logo-box relative w-8 h-8 rounded-lg bg-[#141413] border border-[#141413]/20 flex items-center justify-center p-0.5 overflow-hidden shadow-xs flex-shrink-0">
            <img
              src="/logo.jpg"
              alt="SYNAPES Studio"
              className="w-full h-full object-cover rounded-[5px]"
            />
          </div>

          <div className="flex flex-col leading-none select-none">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-[#141413] text-[14.5px] tracking-[0.04em] inline-flex">
                {'SYNAPES'.split('').map((ch, idx) => (
                  <span
                    key={`syn-${idx}`}
                    className="synapes-char"
                    style={{ '--char-idx': idx } as React.CSSProperties}
                  >
                    {ch}
                  </span>
                ))}
              </span>
              <span
                className="px-1.5 py-0.5 rounded-md bg-[#141413] text-[#FAF8F4] text-[9px] font-mono font-bold tracking-[0.14em] uppercase inline-flex items-center shadow-2xs"
                style={{ '--char-idx': 7 } as React.CSSProperties}
              >
                {'STUDIO'.split('').map((ch, idx) => (
                  <span
                    key={`st-${idx}`}
                    className="synapes-char"
                    style={{ '--char-idx': 8 + idx } as React.CSSProperties}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            </div>
            <span className="hidden sm:block text-[9.5px] font-medium text-[#6B6A64] tracking-tight mt-0.5">
              AI Video & Voiceover Production
            </span>
          </div>
        </button>

        {/* Live System Indicator */}
        <div className="hidden 2xl:flex items-center gap-1.5 pl-2.5 border-l border-black/[0.08] text-[11px] text-zinc-500 font-mono whitespace-nowrap flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{currentTime || '00:00'}</span>
        </div>
      </div>

      {/* Center: Linear-style Studio Segmented Navigation */}
      <div className="hidden xl:flex items-center min-w-0 flex-1 justify-center px-2 overflow-hidden">
        <nav className="inline-flex items-center p-1 bg-zinc-100/90 rounded-lg border border-zinc-200/80 text-xs gap-0.5 whitespace-nowrap max-w-full overflow-x-auto scrollbar-none">
          <button
            onClick={() => onSelectView('pending-approval')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
              activeView === 'pending-approval' || activeView === 'review'
                ? 'bg-white text-zinc-950 shadow-2xs border border-zinc-200/60 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
          >
            <span>Trình Duyệt Kịch Bản</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-900 text-white font-mono font-medium">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectView('in-progress')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer whitespace-nowrap flex-shrink-0 ${
              activeView === 'in-progress'
                ? 'bg-white text-zinc-950 shadow-2xs border border-zinc-200/60 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
          >
            Tất Cả Dự Án
          </button>

          <button
            onClick={() => onSelectView('calendar')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer whitespace-nowrap flex-shrink-0 ${
              activeView === 'calendar'
                ? 'bg-white text-zinc-950 shadow-2xs border border-zinc-200/60 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
          >
            Lịch Phát Sóng
          </button>

          <button
            onClick={() => onSelectView('video-cloner')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
              activeView === 'video-cloner'
                ? 'bg-white text-zinc-950 shadow-2xs border border-zinc-200/60 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
            title="Bóc tách cấu trúc DNA & Nhân bản Video mẫu (BYOK LABS • Mở cho mọi loại gói)"
          >
            <Film className="w-3.5 h-3.5 text-zinc-700" />
            <span>Nhân Bản Video (BYOK)</span>
            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-amber-600 text-white tracking-wider">
              LABS
            </span>
          </button>

          <button
            onClick={() => onSelectView('voice-studio-labs')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
              activeView === 'voice-studio-labs'
                ? 'bg-white text-zinc-950 shadow-2xs border border-zinc-200/60 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
            title="VoiceStudio ULTRA • Nhân bản giọng nói, Thiết kế giọng, Chép lời Whisper & Sách nói"
          >
            <AudioLines className="w-3.5 h-3.5 text-emerald-700" />
            <span>VoiceStudio</span>
            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-emerald-700 text-white tracking-wider">
              ULTRA
            </span>
          </button>

          <button
            onClick={() => onSelectView('user-guide')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
              activeView === 'user-guide'
                ? 'bg-white text-zinc-950 shadow-2xs border border-zinc-200/60 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
            <span>Hướng Dẫn</span>
          </button>
        </nav>
      </div>

      {/* Right: Studio Controls & User State */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <button
          onClick={() => onSelectView('pending-approval')}
          className="relative p-2 rounded-md text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
          title="Kịch bản chờ duyệt"
        >
          <Bell className="w-4 h-4" />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-zinc-900 ring-2 ring-white"></span>
          )}
        </button>

        {/* User Account Capsule */}
        {currentUser && currentUser.isLoggedIn ? (
          <div className="flex items-center gap-1.5 pl-2 border-l border-black/[0.08]">
            {onCloudBackup && (
              <button
                onClick={onCloudBackup}
                data-testid="header-cloud-backup-btn"
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-[10.5px] font-semibold transition cursor-pointer"
                title="Sao lưu & tải file dự phòng toàn bộ dự án, kênh & cấu hình cá nhân"
              >
                <CloudDownload className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sao Lưu</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenChangePass}
              data-testid="header-account-btn"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F4F1EA] hover:bg-[#EAE5DA] border border-black/[0.08] hover:border-black/[0.18] text-[#141413] transition cursor-pointer"
              title={`Tài khoản ${currentUser.code}${currentUser.name ? ` (${currentUser.name})` : ''} — Bấm để đổi mật khẩu bảo mật`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-mono font-semibold tracking-tight">
                {currentUser.code}
              </span>
            </button>

            <button
              onClick={onOpenChangePass}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition cursor-pointer"
              title="Đổi mật khẩu bảo mật"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
              title="Đăng xuất khỏi phiên"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="pl-2 border-l border-zinc-200 flex items-center gap-2 flex-shrink-0">
            {onOpenRegister && (
              <button
                onClick={onOpenRegister}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-300 text-xs font-medium text-zinc-800 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <span>Đăng Ký</span>
              </button>
            )}
            <button
              onClick={onOpenLogin}
              className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Đăng Nhập</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
