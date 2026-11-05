import React from 'react';
import { UserAccount } from '../types';
import { Bell, KeyRound, LogOut, Mail, ExternalLink } from 'lucide-react';

interface HeaderProps {
  currentUser: UserAccount | null;
  pendingCount: number;
  activeView: string;
  onSelectView: (view: string) => void;
  onLogout: () => void;
  onOpenChangePass: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  pendingCount,
  activeView,
  onSelectView,
  onLogout,
  onOpenChangePass,
}) => {
  const developerEmail = 'nguyenhoangthien.hvt.15@gmail.com';
  const mailSubject = encodeURIComponent('LIÊN HỆ NHÀ PHÁT TRIỂN');
  const gmailDirectUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${developerEmail}&su=${mailSubject}`;

  return (
    <header className="h-14 px-4 sm:px-6 apple-header flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Synapes Brand Logo & Tagline */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => onSelectView('pending-approval')}
          title="Trang chủ SYNAPES Auto Tool"
        >
          <div className="w-9 h-9 rounded-xl bg-white border border-black/[0.08] shadow-xs p-0.5 flex items-center justify-center transition group-hover:scale-105 group-active:scale-95">
            <img
              src="/logo.jpg"
              alt="Synapes Logo"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 leading-none">
              <span className="font-bold text-[#1D1D1F] text-[14px] tracking-tight">
                SYNAPES
              </span>
              <span className="text-[10px] font-medium text-zinc-500 bg-black/[0.04] px-2 py-0.5 rounded-full border border-black/[0.05]">
                Auto Tool
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-normal mt-0.5 tracking-tight hidden sm:inline">
              Automated Multi-Platform Video Publisher
            </span>
          </div>
        </div>
      </div>

      {/* Center: Apple Physical Segmented Switcher */}
      <div className="hidden lg:flex items-center">
        <div className="apple-segmented-container">
          <button
            onClick={() => onSelectView('pending-approval')}
            className={`apple-segmented-item flex items-center gap-1.5 ${
              activeView === 'pending-approval' || activeView === 'review' ? 'active' : ''
            }`}
          >
            <span>Trình Duyệt Kịch Bản</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FF3B30] text-white font-semibold font-numeric">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectView('in-progress')}
            className={`apple-segmented-item ${activeView === 'in-progress' ? 'active' : ''}`}
          >
            Tất Cả Dự Án
          </button>

          <button
            onClick={() => onSelectView('calendar')}
            className={`apple-segmented-item ${activeView === 'calendar' ? 'active' : ''}`}
          >
            Lịch Phát Sóng
          </button>
        </div>
      </div>

      {/* Right: Developer Contact & User Controls */}
      <div className="flex items-center gap-2">
        {/* Nút Liên hệ Nhà phát triển */}
        <a
          href={gmailDirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium border border-black/[0.08] shadow-xs transition apple-btn-tap"
          title="Gửi email trao đổi trực tiếp với Kỹ sư Nguyễn Hoàng Thiện"
        >
          <Mail className="w-3.5 h-3.5 text-[#0071E3]" />
          <span className="hidden sm:inline">Liên Hệ Dev</span>
          <ExternalLink className="w-3 h-3 text-zinc-400" />
        </a>

        {/* Chuông Thông Báo */}
        <button
          onClick={() => onSelectView('pending-approval')}
          className="relative p-2 rounded-full bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 border border-black/[0.06] shadow-xs transition apple-btn-tap"
          title="Video đang chờ duyệt"
        >
          <Bell className="w-3.5 h-3.5" />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF3B30] ring-2 ring-white"></span>
          )}
        </button>

        {/* User Account Controls */}
        {currentUser && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-black/[0.08]">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-black/[0.06] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#34C759]"></span>
              <span className="text-[11px] font-numeric text-zinc-700 font-medium">
                {currentUser.code}
              </span>
            </div>

            <button
              onClick={onOpenChangePass}
              className="p-1.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 border border-black/[0.06] shadow-2xs transition apple-btn-tap"
              title="Đổi mật khẩu tài khoản"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#FF9500]" />
            </button>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-full bg-white hover:bg-red-50 text-zinc-400 hover:text-[#FF3B30] border border-black/[0.06] shadow-2xs transition apple-btn-tap"
              title="Đăng xuất"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
