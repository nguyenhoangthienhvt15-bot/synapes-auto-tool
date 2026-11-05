import React from 'react';
import {
  Plus, Sparkles, Clock, Calendar, Folder, Share2,
  HardDrive, Cpu
} from 'lucide-react';
import { MiniPeakHoursAreaChart } from './MiniPeakHoursAreaChart';

interface SidebarProps {
  activeView: string;
  pendingCount: number;
  onSelectView: (view: string) => void;
  onOpenCreateModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  pendingCount,
  onSelectView,
  onOpenCreateModal,
}) => {
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
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                activeView === 'skills'
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
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                activeView === 'pending-approval' || activeView === 'review'
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
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                activeView === 'calendar'
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
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                activeView === 'in-progress'
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

        {/* SECTION 3: PHÂN PHỐI */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Phân Phối & Lưu Trữ
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('channels')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                activeView === 'channels'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Kênh xuất bản</span>
              </div>
            </button>

            <button
              onClick={() => onSelectView('drive-backup')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                activeView === 'drive-backup'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                <span>Google Drive Cloud</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 4: HỆ THỐNG */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Hạ Tầng
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('ai-engine')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                activeView === 'ai-engine'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                <span>Động cơ AI (Gemini 2.0)</span>
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
