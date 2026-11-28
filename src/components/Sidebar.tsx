import React, { useState } from 'react';
import {
  Plus, Film, Clock, Calendar, Folder, Share2,
  HardDrive, Cpu, BookOpen, ChevronDown,
  PanelLeftClose, PanelLeftOpen, Layers, AudioLines
} from 'lucide-react';
import { ContractCategory, Project, ConnectedChannelAccount } from '../types';
import { MiniPeakHoursAreaChart } from './MiniPeakHoursAreaChart';
import { ProviderBrandLogo } from './AiProviderDropdown';

interface SidebarProps {
  activeView: string;
  pendingCount: number;
  userCode?: string;
  projects?: Project[];
  channels?: ConnectedChannelAccount[];
  onSelectView: (view: string) => void;
  onOpenCreateModal: () => void;
  onSelectAiProvider?: (provider: string) => void;
  selectedAiProvider?: string;
  userPlanTier?: ContractCategory;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  drawerMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  pendingCount,
  userCode = '',
  projects = [],
  channels = [],
  onSelectView,
  onOpenCreateModal,
  onSelectAiProvider,
  selectedAiProvider,
  isCollapsed = false,
  onToggleCollapse,
  drawerMode = false,
}) => {
  const [isAiModuleOpen, setIsAiModuleOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // COMPACT SLIDING DOCK MODE (When sidebar is collapsed: w-14 / 56px, desktop only)
  // ---------------------------------------------------------------------------
  if (isCollapsed && !drawerMode) {
    return (
      <aside className="hidden md:flex w-14 bg-[#FDFCF9] border-r border-black/[0.08] py-3 px-2 flex-col justify-between flex-shrink-0 min-h-[calc(100vh-3.5rem)] select-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <div className="flex flex-col items-center gap-2">
          {/* New Project Quick Trigger */}
          <button
            onClick={onOpenCreateModal}
            className="w-10 h-10 rounded-lg bg-zinc-900 hover:bg-black text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs"
            title="Dự Án Video Mới"
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="w-8 h-px bg-zinc-200 my-1"></div>

          {/* Nav Icons */}
          <button
            onClick={() => onSelectView('pending-approval')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer relative ${
              activeView === 'pending-approval' || activeView === 'review'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-zinc-300'
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
            title="Trình Duyệt Kịch Bản"
          >
            <Clock className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-zinc-950"></span>
            )}
          </button>

          <button
            onClick={() => onSelectView('in-progress')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeView === 'in-progress'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-zinc-300'
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
            title="Tất Cả Dự Án"
          >
            <Folder className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectView('video-cloner')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer relative ${
              activeView === 'video-cloner'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-zinc-300'
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
            title="Nhân Bản Video (BYOK) • LABS (Mở cho mọi loại gói)"
          >
            <Film className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 px-1 rounded text-[6.5px] font-mono font-bold bg-amber-600 text-white border border-amber-700">
              LABS
            </span>
          </button>

          <button
            onClick={() => onSelectView('voice-studio-labs')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer relative ${
              activeView === 'voice-studio-labs'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-zinc-300'
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
            title="VoiceStudio ULTRA • Nhân bản giọng, Thiết kế giọng, Chép lời Whisper & Sách nói"
          >
            <AudioLines className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 px-1 rounded text-[6.5px] font-mono font-bold bg-emerald-700 text-white border border-emerald-800">
              ULTRA
            </span>
          </button>

          <button
            onClick={() => onSelectView('calendar')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeView === 'calendar'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-zinc-300'
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
            title="Lịch Phát Sóng"
          >
            <Calendar className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectView('ai-engine')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeView === 'ai-engine'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-zinc-300'
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
            title="Cài Đặt Động Cơ AI & Khóa API"
          >
            <Cpu className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectView('skills')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer relative ${
              activeView === 'skills'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-zinc-300'
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
            title="Kho Skills & Prompts LABS — Động Cơ Video GitHub & Video Mẫu"
          >
            <Layers className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 px-1 rounded text-[6.5px] font-mono font-bold bg-amber-600 text-white border border-amber-700">
              LABS
            </span>
          </button>

          <button
            onClick={() => onSelectView('channels')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeView === 'channels'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-zinc-300'
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
            title="Quản Lý Kênh & Mạng Xã Hội"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Expand Toggle Button */}
        {onToggleCollapse && !drawerMode && (
          <button
            onClick={onToggleCollapse}
            className="w-10 h-10 mx-auto rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 flex items-center justify-center transition cursor-pointer"
            title="Mở rộng thanh điều hướng (Ctrl+B)"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </aside>
    );
  }

  // ---------------------------------------------------------------------------
  // FULL EXPANDED CRAFT SIDEBAR MODE (w-60 / 240px)
  // ---------------------------------------------------------------------------
  return (
    <aside
      className={
        drawerMode
          ? 'flex w-72 max-w-[85vw] bg-[#FDFCF9] border-r border-black/[0.08] p-3 flex-col justify-between h-full overflow-y-auto select-none scrollbar-none'
          : 'hidden md:flex w-60 bg-[#FDFCF9] border-r border-black/[0.08] p-3 flex-col justify-between flex-shrink-0 min-h-[calc(100vh-3.5rem)] overflow-y-auto select-none scrollbar-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
      }
    >
      <div className="space-y-3">

        {/* Primary Action Button */}
        <button
          onClick={onOpenCreateModal}
          className="w-full py-2 px-3 rounded-xl bg-[#141413] hover:bg-black text-[#FAF8F4] font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
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
              onClick={() => onSelectView('video-cloner')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                activeView === 'video-cloner'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
              title="Phân tích bóc tách cấu trúc DNA & Nhân bản Video (BYOK LABS • Mở cho mọi loại gói)"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Film className="w-3.5 h-3.5 text-zinc-700 flex-shrink-0" />
                <span className="truncate">Nhân Bản Video (BYOK)</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-600 text-white flex-shrink-0">
                LABS
              </span>
            </button>

            <button
              onClick={() => onSelectView('voice-studio-labs')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                activeView === 'voice-studio-labs'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
              title="VoiceStudio ULTRA — Nhân bản giọng, Thiết kế giọng, Chép lời Whisper & Sách nói"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AudioLines className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                <span className="truncate">VoiceStudio</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-700 text-white flex-shrink-0">
                ULTRA
              </span>
            </button>

            <button
              onClick={() => onSelectView('skills')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                activeView === 'skills'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-3.5 h-3.5 text-zinc-500" />
                <span>Kho Skills & Prompts</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-600 text-white flex-shrink-0">
                LABS
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
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                activeView === 'pending-approval' || activeView === 'review'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Trình Duyệt Kịch Bản</span>
              </div>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-950 text-white font-mono font-medium">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectView('in-progress')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                activeView === 'in-progress'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder className="w-3.5 h-3.5 text-zinc-500" />
                <span>Tất Cả Dự Án</span>
              </div>
            </button>

            <button
              onClick={() => onSelectView('calendar')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                activeView === 'calendar'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Lịch Phát Sóng</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 3: KHO NGUYÊN LIỆU & KÊNH */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Kết Nối & Lưu Trữ
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('drive-backup')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                activeView === 'drive-backup'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                <span>Google Drive Cloud</span>
              </div>
            </button>

            <button
              onClick={() => onSelectView('channels')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                activeView === 'channels'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Quản Lý Kênh & Mạng Xã Hội</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 4: HỆ THỐNG / HẠ TẦNG */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Hạ Tầng AI
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => {
                onSelectView('ai-engine');
                setIsAiModuleOpen(!isAiModuleOpen);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                activeView === 'ai-engine'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
              title="Cấu hình API Keys các nhà cung cấp AI"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                <span>Cấu Hình Động Cơ AI</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                  isAiModuleOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isAiModuleOpen && (
              <div className="pl-3.5 pr-1 py-1 space-y-0.5 border-l border-zinc-200 ml-3.5 animate-in fade-in duration-150 text-[11px]">
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

        {/* SECTION 5: HƯỚNG DẪN */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Tài Liệu
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('user-guide')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                activeView === 'user-guide'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
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

      {/* Live Platform Traffic Area Chart & Collapse Action */}
      <div className="pt-3 border-t border-black/[0.06] space-y-2">
        <MiniPeakHoursAreaChart
          userCode={userCode}
          projects={projects}
          channels={channels}
        />

        {onToggleCollapse && !drawerMode && (
          <button
            onClick={onToggleCollapse}
            className="w-full py-1.5 px-2 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 flex items-center justify-center gap-1.5 text-[11px] transition cursor-pointer"
            title="Thu gọn thanh điều hướng (Ctrl+B)"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
            <span>Thu gọn thanh bên</span>
          </button>
        )}
      </div>
    </aside>
  );
};
