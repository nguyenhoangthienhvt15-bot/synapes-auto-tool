import React from 'react';
import {
  Plus, Sparkles, Clock, Calendar, Folder, Share2,
  HardDrive, Cpu
} from 'lucide-react';

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
    <aside className="w-60 bg-[#FAF9F5]/70 backdrop-blur-xl border-r border-black/[0.06] p-3.5 flex flex-col justify-between flex-shrink-0 min-h-[calc(100vh-3.5rem)] select-none">
      <div className="space-y-4">

        {/* Nút Tạo dự án mới chuẩn Apple System Blue */}
        <button
          onClick={onOpenCreateModal}
          className="w-full py-2.5 px-3.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium text-xs shadow-xs flex items-center justify-center gap-2 transition apple-btn-tap"
        >
          <Plus className="w-4 h-4" />
          <span>Dự Án Video Mới</span>
        </button>

        {/* PHÂN NHÓM 1: SÁNG TẠO */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2.5 mb-1 uppercase">
            Sáng Tạo Nội Dung
          </div>
          <div className="space-y-0.5">
            <button
              onClick={onOpenCreateModal}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-normal text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.035] transition text-left apple-btn-tap"
            >
              <Plus className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Tạo kịch bản từ Prompt</span>
            </button>

            <button
              onClick={() => onSelectView('skills')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition text-left apple-btn-tap ${activeView === 'skills'
                  ? 'bg-white text-zinc-900 font-semibold shadow-xs border border-black/[0.06]'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.035]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-3.5 h-3.5 text-[#AF52DE]" />
                <span>Kho Skills & Prompts</span>
              </div>
            </button>
          </div>
        </div>

        {/* PHÂN NHÓM 2: QUẢN LÝ & XÉT DUYỆT */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2.5 mb-1 uppercase">
            Quản Lý & Phê Duyệt
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('pending-approval')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition text-left apple-btn-tap ${activeView === 'pending-approval' || activeView === 'review'
                  ? 'bg-white text-zinc-900 font-semibold shadow-xs border border-black/[0.06]'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.035]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5 text-[#FF9500]" />
                <span>Chờ phê duyệt</span>
              </div>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FF3B30] text-white font-numeric">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectView('calendar')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition text-left apple-btn-tap ${activeView === 'calendar'
                  ? 'bg-white text-zinc-900 font-semibold shadow-xs border border-black/[0.06]'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.035]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-3.5 h-3.5 text-[#0071E3]" />
                <span>Lịch đăng & Giờ vàng</span>
              </div>
            </button>

            <button
              onClick={() => onSelectView('in-progress')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition text-left apple-btn-tap ${activeView === 'in-progress'
                  ? 'bg-white text-zinc-900 font-semibold shadow-xs border border-black/[0.06]'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.035]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder className="w-3.5 h-3.5 text-zinc-500" />
                <span>Tất cả dự án</span>
              </div>
            </button>
          </div>
        </div>

        {/* PHÂN NHÓM 3: KHO LƯU TRỮ & PHÂN PHỐI */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2.5 mb-1 uppercase">
            Kênh & Dữ Liệu
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('channels')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition text-left apple-btn-tap ${activeView === 'channels'
                  ? 'bg-white text-zinc-900 font-semibold shadow-xs border border-black/[0.06]'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.035]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Kênh xuất bản (YT/TT/FB)</span>
              </div>
            </button>

            <button
              onClick={() => onSelectView('drive-backup')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition text-left apple-btn-tap ${activeView === 'drive-backup'
                  ? 'bg-white text-zinc-900 font-semibold shadow-xs border border-black/[0.06]'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.035]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-3.5 h-3.5 text-[#FF9500]" />
                <span>Google Drive Cloud</span>
              </div>
            </button>
          </div>
        </div>

        {/* PHÂN NHÓM 4: CẤU HÌNH & HỆ THỐNG */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2.5 mb-1 uppercase">
            Hệ Thống
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('ai-engine')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition text-left apple-btn-tap ${activeView === 'ai-engine'
                  ? 'bg-white text-zinc-900 font-semibold shadow-xs border border-black/[0.06]'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.035]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-3.5 h-3.5 text-[#0071E3]" />
                <span>Động cơ AI (Gemini 2.0)</span>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Golden Hour Status Banner */}
      <div className="pt-3 border-t border-black/[0.06] text-[11px] px-2 space-y-1">
        <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-semibold">
          <span>Giờ vàng hôm nay</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] pulse-dot"></span>
        </div>
        <div className="text-[#1D1D1F] font-numeric font-semibold text-xs flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#FF9500]" />
          <span>19:00 — 21:00</span>
        </div>
        <p className="text-[10px] text-zinc-400 leading-tight">
          Tối ưu hóa lượt xem YouTube & TikTok
        </p>
      </div>
    </aside>
  );
};
