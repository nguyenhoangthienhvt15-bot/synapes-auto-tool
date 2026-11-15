import React, { useState, useEffect } from 'react';
import { UserAccount, ContractCategory } from '../types';
import {
  Bell, KeyRound, LogOut, BookOpen, Terminal, Film,
  PanelLeftClose, PanelLeftOpen, Lock, AudioLines
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
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  pendingCount,
  activeView,
  userPlanTier = 'personal',
  loginAnimTrigger = 0,
  onSelectView,
  onLogout,
  onOpenChangePass,
  onOpenLogin,
  onOpenRegister,
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
    <header className="h-13 px-4 sm:px-6 bg-[#FFFFFF] border-b border-zinc-200/80 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Brand, Sidebar Toggle & Studio Breadcrumb */}
      <div className="flex items-center gap-2.5">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer flex items-center justify-center mr-1"
            title={isSidebarCollapsed ? "Mở rộng thanh điều hướng (Ctrl+B)" : "Thu gọn thanh điều hướng (Ctrl+B)"}
            aria-label="Toggle sidebar"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-zinc-700" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-zinc-700" />
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
          className={`flex items-center gap-2.5 text-left group cursor-pointer px-1.5 py-0.5 rounded-lg transition ${
            isLogoAnimating ? 'synapes-brand-anim' : ''
          }`}
          title="SYNAPES Video Studio (Nhấp đúp để phát lại hiệu ứng logo)"
        >
          <span className="synapes-rgb-sweep" aria-hidden="true" />
          <div className="synapes-logo-box w-7 h-7 rounded-md bg-zinc-900 border border-zinc-900/10 flex items-center justify-center p-0.5 overflow-hidden shadow-2xs flex-shrink-0">
            <img
              src="/logo.jpg"
              alt="SYNAPES"
              className="w-full h-full object-cover rounded-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 select-none">
            <span className="font-bold text-zinc-950 text-[13px] tracking-tight inline-flex">
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
              className="text-zinc-300 font-light synapes-char"
              style={{ '--char-idx': 7 } as React.CSSProperties}
            >
              /
            </span>
            <span className="text-[11px] font-medium text-zinc-600 inline-flex">
              {'Studio'.split('').map((ch, idx) => (
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
        </button>

        {/* Live System Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 pl-2.5 border-l border-zinc-200 text-[11px] text-zinc-500 font-mono whitespace-nowrap flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{currentTime || '00:00'}</span>
        </div>
      </div>

      {/* Center: Linear-style Studio Segmented Navigation */}
      <div className="hidden lg:flex items-center min-w-0 max-w-full overflow-hidden">
        <nav className="inline-flex items-center p-1 bg-zinc-100/90 rounded-lg border border-zinc-200/80 text-xs gap-0.5 whitespace-nowrap max-w-full overflow-x-auto">
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
            title={
              userPlanTier === 'enterprise'
                ? 'Bóc tách cấu trúc DNA & Nhân bản Video mẫu (Gói Toàn Hệ ULTRA)'
                : 'Tính năng ULTRA — Chỉ mở khóa cho Gói Trả Phí Toàn Hệ'
            }
          >
            <Film className="w-3.5 h-3.5 text-zinc-700" />
            <span>Nhân Bản Video (BYOK)</span>
            <span
              className={`px-1 py-0.2 rounded text-[8.5px] font-mono font-bold border inline-flex items-center gap-0.5 ${
                userPlanTier === 'enterprise'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}
            >
              {userPlanTier !== 'enterprise' && <Lock className="w-2.5 h-2.5" />}
              <span>ULTRA</span>
            </span>
          </button>

          <button
            onClick={() => onSelectView('voice-studio-labs')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
              activeView === 'voice-studio-labs'
                ? 'bg-white text-zinc-950 shadow-2xs border border-zinc-200/60 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
            title="VoiceStudio LABS • Nhân bản giọng nói, Thiết kế giọng, Lồng tiếng Video & Whisper"
          >
            <AudioLines className="w-3.5 h-3.5 text-emerald-700" />
            <span>VoiceStudio</span>
            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-emerald-600 text-white tracking-wider">
              LABS
            </span>
          </button>

          <button
            onClick={() => onSelectView('mcp-tools')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
              activeView === 'mcp-tools'
                ? 'bg-white text-zinc-950 shadow-2xs border border-zinc-200/60 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
            title="Khối MCP Servers & Công cụ Video AI"
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-500" />
            <span>MCP & Video Tools</span>
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
          <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200/80 text-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-mono font-semibold tracking-tight">
                {currentUser.code}
              </span>
            </div>

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
          <div className="pl-2 border-l border-zinc-200 flex items-center gap-2">
            {onOpenRegister && (
              <button
                onClick={onOpenRegister}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-300 text-xs font-medium text-zinc-800 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer shadow-2xs"
              >
                <span>Đăng Ký</span>
              </button>
            )}
            <button
              onClick={onOpenLogin}
              className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đăng Nhập</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
