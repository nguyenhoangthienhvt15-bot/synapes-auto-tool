import React, { useState } from 'react';
import {
  Plus, Film, Clock, Calendar, Folder, Share2,
  HardDrive, Cpu, BookOpen, ChevronDown, Terminal,
  PanelLeftClose, PanelLeftOpen, Layers, Table
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  pendingCount,
  onSelectView,
  onOpenCreateModal,
  onSelectAiProvider,
  selectedAiProvider,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [isAiModuleOpen, setIsAiModuleOpen] = useState(true);

  // ---------------------------------------------------------------------------
  // COMPACT SLIDING DOCK MODE (When sidebar is collapsed: w-14 / 56px)
  // ---------------------------------------------------------------------------
  if (isCollapsed) {
    return (
      <aside className="w-14 bg-[#FFFFFF] border-r border-zinc-200/80 py-3 px-2 flex flex-col justify-between flex-shrink-0 min-h-[calc(100vh-3.25rem)] select-none transition-all duration-200 ease-in-out">
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
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeView === 'video-cloner'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-zinc-300'
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
            title="Nhân Bản Video (BYOK)"
          >
            <Film className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectView('calendar')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeView === 'calendar'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-zinc-300'
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
            title="Lịch Phát Sóng (Goldtime)"
          >
            <Calendar className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectView('mcp-tools')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeView === 'mcp-tools'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-zinc-300'
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
            title="Khối MCP Servers & Video Tools"
          >
            <Terminal className="w-4 h-4" />
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

          <button
            onClick={() => onSelectView('engineer-sheet')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeView === 'engineer-sheet'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-zinc-300'
                : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
            title="Bảng Tính Kỹ Sư & Phê Duyệt"
          >
            <Table className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Expand Toggle Button */}
        {onToggleCollapse && (
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
    <aside className="w-60 bg-[#FFFFFF] border-r border-zinc-200/80 p-3.5 flex flex-col justify-between flex-shrink-0 min-h-[calc(100vh-3.25rem)] overflow-y-auto select-none scrollbar-none transition-all duration-200 ease-in-out">
      <div className="space-y-4">

        {/* Primary Action Button */}
        <button
          onClick={onOpenCreateModal}
          className="w-full py-2.5 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs shadow-2xs flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
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
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-normal text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition text-left cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              <span>Tạo kịch bản từ Prompt</span>
            </button>

            <button
              onClick={() => onSelectView('video-cloner')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                activeView === 'video-cloner'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
              title="Phân tích bóc tách cấu trúc DNA & Nhân bản Video"
            >
              <div className="flex items-center gap-2.5">
                <Film className="w-3.5 h-3.5 text-zinc-700" />
                <span>Nhân Bản Video (BYOK)</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                PRO
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
            </button>

            <button
              onClick={() => onSelectView('mcp-tools')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                activeView === 'mcp-tools'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
              title="Khối MCP Server & Bộ công cụ dựng video AI chuyên nghiệp"
            >
              <div className="flex items-center gap-2.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-700" />
                <span>Khối MCP & Video Tools</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
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
                <span>Lịch Phát Sóng (Goldtime)</span>
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

            <button
              onClick={() => onSelectView('engineer-sheet')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                activeView === 'engineer-sheet'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Table className="w-3.5 h-3.5 text-zinc-500" />
                <span>Bảng Tính Kỹ Sư & Phê Duyệt</span>
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

      {/* Peak Hours Area Chart & Collapse Action */}
      <div className="pt-3 border-t border-zinc-200/60 space-y-2">
        <MiniPeakHoursAreaChart />

        {onToggleCollapse && (
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
