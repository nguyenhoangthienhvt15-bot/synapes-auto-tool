import React, { useState } from 'react';
import {
  Plus, Sparkles, Clock, Calendar, Folder, Share2,
  HardDrive, Cpu, BookOpen, ChevronDown, Key
} from 'lucide-react';
import { MiniPeakHoursAreaChart } from './MiniPeakHoursAreaChart';

interface SidebarProps {
  activeView: string;
  pendingCount: number;
  onSelectView: (view: string) => void;
  onOpenCreateModal: () => void;
  onSelectAiProvider?: (provider: string) => void;
  selectedAiProvider?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  pendingCount,
  onSelectView,
  onOpenCreateModal,
  onSelectAiProvider,
  selectedAiProvider,
}) => {
  const [isAiModuleOpen, setIsAiModuleOpen] = useState(true);
  return (
    <aside className="w-60 bg-[#FBFBFA] border-r border-black/[0.07] p-3 flex flex-col justify-between flex-shrink-0 min-h-[calc(100vh-3.25rem)] overflow-y-auto select-none scrollbar-none">
      <div className="space-y-4">

        {/* Primary Action Button */}
        <button
          onClick={onOpenCreateModal}
          className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-black text-white font-medium text-xs shadow-2xs flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Dự Án Video Mới</span>
        </button>

        {/* SECTION 1: SẢN XUẤT */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Sản Xuất
          </div>
          <div className="space-y-0.5">
            <button
              onClick={onOpenCreateModal}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-normal text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70 transition text-left cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              <span>Tạo kịch bản từ Prompt</span>
            </button>

            <button
              onClick={() => onSelectView('skills')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${activeView === 'skills'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                <span>Kho Skills & Prompts</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 2: DUYỆT & ĐIỀU PHỐI */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Kiểm Duyệt
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('pending-approval')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${activeView === 'pending-approval' || activeView === 'review'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Chờ phê duyệt</span>
              </div>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-zinc-900 text-white">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectView('calendar')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${activeView === 'calendar'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Lịch phát sóng</span>
              </div>
            </button>

            <button
              onClick={() => onSelectView('in-progress')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${activeView === 'in-progress'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder className="w-3.5 h-3.5 text-zinc-500" />
                <span>Tất cả dự án</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 3: PHÂN PHỐI & LIÊN KẾT TÀI KHOẢN MẠNG XÃ HỘI */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Liên Kết Kênh & Đăng Tải
          </div>
          <div className="space-y-0.5">
            {/* 1. Kênh YouTube */}
            <button
              onClick={() => onSelectView('connect-youtube')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer group ${activeView === 'connect-youtube'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span>Kênh YouTube</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 group-hover:bg-white border border-black/5">
                OAuth
              </span>
            </button>

            {/* 2. Tài khoản TikTok */}
            <button
              onClick={() => onSelectView('connect-tiktok')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer group ${activeView === 'connect-tiktok'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-black" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.68a6.34 6.34 0 0 0 10.74 4.54 6.29 6.29 0 0 0 1.93-4.55V8.87a8.28 8.28 0 0 0 4.82 1.54V6.96a4.85 4.85 0 0 1-1-.27z" />
                </svg>
                <span>Tài khoản TikTok</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 group-hover:bg-white border border-black/5">
                Posting
              </span>
            </button>

            {/* 3. Tài khoản Facebook */}
            <button
              onClick={() => onSelectView('connect-facebook')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer group ${activeView === 'connect-facebook'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#0866FF]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Tài khoản Facebook</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 group-hover:bg-white border border-black/5">
                Reels
              </span>
            </button>

            {/* 4. Google Drive Cloud */}
            <button
              onClick={() => onSelectView('drive-backup')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${activeView === 'drive-backup'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                <span>Google Drive Cloud</span>
              </div>
            </button>

            {/* 5. Quản lý tất cả kênh */}
            <button
              onClick={() => onSelectView('channels')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${activeView === 'channels'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Quản Lý Kênh & API</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 4: HỆ THỐNG / HẠ TẦNG */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Hạ Tầng
          </div>
          <div className="space-y-0.5">
            {/* Nút tùy chọn gom: API Keys AI Module */}
            <button
              onClick={() => {
                onSelectView('ai-engine');
                setIsAiModuleOpen(!isAiModuleOpen);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                activeView === 'ai-engine'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
              }`}
              title="Cấu hình API Keys các nhà cung cấp AI"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                <span>API Keys AI Module</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                  isAiModuleOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Các danh mục nhà cung cấp AI con */}
            {isAiModuleOpen && (
              <div className="pl-3.5 pr-1 py-1 space-y-0.5 border-l border-zinc-200 ml-3.5 animate-fade-in text-[11px]">
                {/* 1. GPT (OpenAI) */}
                <button
                  onClick={() => {
                    onSelectAiProvider?.('openai');
                    onSelectView('ai-engine');
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition text-left cursor-pointer ${
                    activeView === 'ai-engine' && selectedAiProvider === 'openai'
                      ? 'bg-zinc-200 text-zinc-950 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                  title="OpenAI GPT API Key"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#10A37F]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                  </svg>
                  <span className="truncate">GPT (OpenAI)</span>
                </button>

                {/* 2. Claude (Anthropic) */}
                <button
                  onClick={() => {
                    onSelectAiProvider?.('claude');
                    onSelectView('ai-engine');
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition text-left cursor-pointer ${
                    activeView === 'ai-engine' && selectedAiProvider === 'claude'
                      ? 'bg-zinc-200 text-zinc-950 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                  title="Anthropic Claude API Key"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#D97706]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1.5l1.6 6.8 6.8 1.6-6.8 1.6L12 18.3l-1.6-6.8L3.6 9.9l6.8-1.6L12 1.5zm6.5 13.5l.8 3.4 3.4.8-3.4.8-.8 3.4-.8-3.4-3.4-.8 3.4-.8.8-3.4z"/>
                  </svg>
                  <span className="truncate">Claude (Anthropic)</span>
                </button>

                {/* 3. DeepSeek */}
                <button
                  onClick={() => {
                    onSelectAiProvider?.('deepseek');
                    onSelectView('ai-engine');
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition text-left cursor-pointer ${
                    activeView === 'ai-engine' && selectedAiProvider === 'deepseek'
                      ? 'bg-zinc-200 text-zinc-950 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                  title="DeepSeek AI API Key"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M3.5 14.5C3.5 9.5 7.5 5.5 12.5 5.5C17.5 5.5 21.5 9 21.5 14C21.5 17 19.5 19.5 16.5 19.5C13.5 19.5 12 17.5 10 17.5C8 17.5 6.5 19 4.5 18C3.8 17 3.5 15.8 3.5 14.5Z" fill="#1E6FFF"/>
                    <circle cx="8" cy="12" r="1.5" fill="#FFFFFF"/>
                  </svg>
                  <span className="truncate">DeepSeek AI</span>
                </button>

                {/* 4. Grok (xAI) */}
                <button
                  onClick={() => {
                    onSelectAiProvider?.('grok');
                    onSelectView('ai-engine');
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition text-left cursor-pointer ${
                    activeView === 'ai-engine' && selectedAiProvider === 'grok'
                      ? 'bg-zinc-200 text-zinc-950 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                  title="xAI Grok API Key"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-black" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="truncate">Grok (xAI)</span>
                </button>

                {/* 5. Gemini (Google) */}
                <button
                  onClick={() => {
                    onSelectAiProvider?.('gemini');
                    onSelectView('ai-engine');
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition text-left cursor-pointer ${
                    activeView === 'ai-engine' && selectedAiProvider === 'gemini'
                      ? 'bg-zinc-200 text-zinc-950 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                  title="Google Gemini API Key"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" fill="url(#gemini-sidebar-item-grad)" />
                    <defs>
                      <linearGradient id="gemini-sidebar-item-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#1BA1E3" />
                        <stop offset="50%" stopColor="#5B7FFF" />
                        <stop offset="100%" stopColor="#C473FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="truncate">Gemini (Google)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: HỖ TRỢ & HƯỚNG DẪN */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Tài Liệu & Hướng Dẫn
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('user-guide')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                activeView === 'user-guide'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                <span>Hướng dẫn sử dụng</span>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Khung Biểu Đồ Miền Giờ Vàng Thời Gian Thực (TikTok, YouTube, Facebook) */}
      <div className="pt-2">
        <MiniPeakHoursAreaChart />
      </div>
    </aside>
  );
};
