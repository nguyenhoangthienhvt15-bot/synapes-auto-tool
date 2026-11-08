import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';
import { Bell, KeyRound, LogOut, Shield, ChevronRight, BookOpen, Terminal, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentUser: UserAccount | null;
  pendingCount: number;
  activeView: string;
  onSelectView: (view: string) => void;
  onLogout: () => void;
  onOpenChangePass: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  pendingCount,
  activeView,
  onSelectView,
  onLogout,
  onOpenChangePass,
  onOpenLogin,
  onOpenRegister,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

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

  return (
    <header className="h-13 px-4 sm:px-6 bg-[#FBFBFA]/90 backdrop-blur-md border-b border-black/[0.08] flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Brand & Studio Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectView('pending-approval')}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
          title="SYNAPES Video Studio"
        >
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-black/10 flex items-center justify-center p-0.5 overflow-hidden shadow-2xs">
            <img
              src="/logo.jpg"
              alt="SYNAPES"
              className="w-full h-full object-cover rounded-md"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-950 text-[13px] tracking-tight">
              SYNAPES
            </span>
            <span className="text-zinc-300">/</span>
            <span className="text-[11px] font-medium text-zinc-500">
              Studio
            </span>
          </div>
        </button>

        {/* Live System Indicator */}
        <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-zinc-200 text-[11px] text-zinc-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>{currentTime || '00:00'}</span>
        </div>
      </div>

      {/* Center: Linear-style Studio Segmented Navigation */}
      <div className="hidden lg:flex items-center">
        <nav className="studio-segmented-container">
          <button
            onClick={() => onSelectView('pending-approval')}
            className={`studio-segmented-item flex items-center gap-1.5 cursor-pointer ${activeView === 'pending-approval' || activeView === 'review'
                ? 'active'
                : ''
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
            className={`studio-segmented-item cursor-pointer ${activeView === 'in-progress' ? 'active' : ''
              }`}
          >
            Tất Cả Dự Án
          </button>

          <button
            onClick={() => onSelectView('calendar')}
            className={`studio-segmented-item cursor-pointer ${activeView === 'calendar' ? 'active' : ''
              }`}
          >
            Lịch Phát Sóng
          </button>

          <button
            onClick={() => onSelectView('video-cloner')}
            className={`studio-segmented-item flex items-center gap-1.5 cursor-pointer ${activeView === 'video-cloner' ? 'active' : ''
              }`}
            title="Bóc tách & Nhân bản Video bằng API Keys cá nhân"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Nhân Bản Video (BYOK)</span>
          </button>

          <button
            onClick={() => onSelectView('mcp-tools')}
            className={`studio-segmented-item flex items-center gap-1.5 cursor-pointer ${activeView === 'mcp-tools' ? 'active' : ''
              }`}
            title="Khối MCP Servers & Công cụ Video AI"
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-500" />
            <span>Khối MCP & Video Tools</span>
          </button>

          <button
            onClick={() => onSelectView('user-guide')}
            className={`studio-segmented-item flex items-center gap-1.5 cursor-pointer ${activeView === 'user-guide' ? 'active' : ''
              }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
            <span>Hướng Dẫn Sử Dụng</span>
          </button>
        </nav>
      </div>

      {/* Right: Studio Controls & User State */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <button
          onClick={() => onSelectView('pending-approval')}
          className="relative p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
          title="Kịch bản chờ duyệt"
        >
          <Bell className="w-4 h-4" />
          {pendingCount > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-zinc-900 ring-2 ring-[#FBFBFA]"></span>
          )}
        </button>

        {/* User Account Capsule */}
        {currentUser && currentUser.isLoggedIn ? (
          <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100/90 border border-black/[0.05] text-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-mono font-semibold tracking-tight">
                {currentUser.code}
              </span>
            </div>

            <button
              onClick={onOpenChangePass}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition cursor-pointer"
              title="Đổi mật khẩu bảo mật"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
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
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-black/10 text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
              >
                <span>Đăng Ký</span>
              </button>
            )}
            <button
              onClick={onOpenLogin}
              className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer"
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
