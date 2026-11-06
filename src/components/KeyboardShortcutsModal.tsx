import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: 'Điều Khiển Phát Video (Playback)',
      items: [
        { key: 'Space', desc: 'Phát / Tạm dừng video (Play / Pause)' },
        { key: '← / →', desc: 'Lùi / Tiến 1 giây trên timeline' },
        { key: 'Shift + ← / →', desc: 'Nhảy về phân cảnh trước / phân cảnh tiếp theo' },
        { key: 'J / K / L', desc: 'Tua lùi 2x / Tạm dừng / Tua nhanh 2x (Chuẩn NLE)' },
        { key: 'M', desc: 'Bật / Tắt tiếng toàn bộ (Mute / Unmute)' },
        { key: 'F', desc: 'Chế độ xem toàn màn hình (Fullscreen)' },
      ],
    },
    {
      category: 'Công Cụ Biên Tập Phân Cảnh (Editing Suite)',
      items: [
        { key: 'S', desc: 'Tách phân cảnh tại vị trí playhead (Split Scene)' },
        { key: 'Shift + S', desc: 'Chụp ảnh màn hình 4K khung hình hiện tại (Snapshot)' },
        { key: 'Ctrl + D', desc: 'Nhân đôi phân cảnh đang chọn (Duplicate Scene)' },
        { key: 'Delete', desc: 'Xóa phân cảnh đang chọn khỏi timeline' },
        { key: 'Alt + ↑ / ↓', desc: 'Di chuyển đổi thứ tự phân cảnh' },
        { key: 'E', desc: 'Mở trình sửa lời thoại phân cảnh đang chọn' },
      ],
    },
    {
      category: 'Đồ Họa & Phòng Thu (Studio Modules)',
      items: [
        { key: 'V', desc: 'Mở Phòng Thu Lồng Tiếng AI (Voice Studio)' },
        { key: 'C', desc: 'Mở Bảng Bộ Lọc Màu Điện Ảnh (Color Grade & LUTs)' },
        { key: 'R', desc: 'Mở Trình Kết Xuất & Tải Video Thực Tế (Export Video)' },
        { key: '? / H', desc: 'Mở / Đóng bảng phím tắt trợ giúp này' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 select-none animate-in fade-in duration-150"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.08] flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-sm">
              <Keyboard className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                <span>Phím Tắt Biên Tập Video Chuyên Nghiệp</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-200 text-zinc-800">
                  NLE Standard
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500">
                Tối ưu tốc độ dựng video tương đương Premiere Pro, CapCut & DaVinci Resolve
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h3 className="font-bold text-zinc-800 text-xs border-b border-black/[0.06] pb-1">
                {group.category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className="p-2 rounded-lg bg-zinc-50 border border-black/[0.05] flex items-center justify-between gap-2"
                  >
                    <span className="text-zinc-600 text-[11px]">{item.desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-white text-zinc-900 font-mono text-[10px] font-bold border border-black/[0.12] shadow-xs shrink-0">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-black/[0.08] bg-zinc-50 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Nhấn <kbd className="px-1.5 py-0.2 rounded bg-white border border-black/10 font-mono text-[10px] font-bold">Esc</kbd> để đóng</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-900 text-white rounded-md text-xs font-medium cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
