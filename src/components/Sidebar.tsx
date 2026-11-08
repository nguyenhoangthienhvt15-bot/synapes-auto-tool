import React, { useState } from 'react';
import {
  Plus, Sparkles, Clock, Calendar, Folder, Share2,
  HardDrive, Cpu, BookOpen, ChevronDown, Terminal
} from 'lucide-react';
import { MiniPeakHoursAreaChart } from './MiniPeakHoursAreaChart';
import { ProviderBrandLogo } from './AiProviderDropdown';

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
              onClick={() => onSelectView('video-cloner')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${activeView === 'video-cloner'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
              title="Phân tích bóc tách & Nhân bản Video bằng API Keys cá nhân"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Nhân Bản Video (BYOK)</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                Mới
              </span>
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

            <button
              onClick={() => onSelectView('mcp-tools')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${activeView === 'mcp-tools'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
              title="Khối MCP Server & Bộ công cụ dựng video AI chuyên nghiệp"
            >
              <div className="flex items-center gap-2.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                <span>Khối MCP & Video Tools</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-indigo-50 text-indigo-600 border border-indigo-200/50">
                9 Repos
              </span>
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
                {[
                  { id: 'gemini', label: 'Google Gemini' },
                  { id: 'openai', label: 'OpenAI GPT' },
                  { id: 'claude', label: 'Anthropic Claude' },
                  { id: 'deepseek', label: 'DeepSeek AI' },
                  { id: 'grok', label: 'xAI Grok' },
                  { id: 'plugin', label: 'Plugin Webhook' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectAiProvider?.(item.id);
                      onSelectView('ai-engine');
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition text-left cursor-pointer ${
                      activeView === 'ai-engine' && selectedAiProvider === item.id
                        ? 'bg-zinc-200 text-zinc-950 font-semibold'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                    }`}
                    title={`Cấu hình API Key cho ${item.label}`}
                  >
                    <ProviderBrandLogo provider={item.id} size="xs" withBadge={false} />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
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
