import React from 'react';
import { Project } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4 text-red-500" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

interface CalendarViewProps {
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onBack?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ projects, onSelectProject, onBack }) => {
  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Header */}
      <div className="apple-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold border border-black/[0.08] transition apple-btn-tap flex items-center gap-1.5 shadow-2xs mr-1"
              title="Thoát lịch đăng, quay lại bàn duyệt"
            >
              <span>← Quay Lại</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] flex-shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1D1D1F] tracking-tight">Lịch Xuất Bản & Khung Giờ Vàng</h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              Hệ thống tự động canh giờ đăng video vào thời điểm người dùng tương tác cao nhất
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#FAF9F5] p-1 rounded-xl border border-black/[0.08]">
          <button className="p-1 rounded-lg hover:bg-zinc-200 text-zinc-600">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-zinc-800 px-2 font-numeric">
            Tháng 11, 2026
          </span>
          <button className="p-1 rounded-lg hover:bg-zinc-200 text-zinc-600">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Khung giờ vàng đề xuất */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="apple-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
              <YoutubeIcon className="w-3.5 h-3.5 text-[#FF3B30]" /> YouTube Dài (16:9)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-semibold font-numeric">
              18:00 - 20:30
            </span>
          </div>
          <p className="text-zinc-500 text-[11px] leading-relaxed">
            Khán giả xem trên TV và máy tính. Tối ưu thuật toán gợi ý video từ 5–10 phút hoàn chỉnh.
          </p>
        </div>

        <div className="apple-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
              <span>🎵</span> TikTok Shorts & Reels
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold font-numeric">
              11:30 - 13:00
            </span>
          </div>
          <p className="text-zinc-500 text-[11px] leading-relaxed">
            Giờ nghỉ trưa học sinh sinh viên & văn phòng. Tỉ lệ click link sản phẩm tiếp thị cao nhất.
          </p>
        </div>

        <div className="apple-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
              <span>📘</span> Facebook Reels
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#0071E3] border border-blue-200 font-semibold font-numeric">
              20:00 - 22:30
            </span>
          </div>
          <p className="text-zinc-500 text-[11px] leading-relaxed">
            Thời điểm giải trí buổi tối trên điện thoại, lượng tương tác và chia sẻ đạt đỉnh điểm.
          </p>
        </div>
      </div>

      {/* Danh sách video đã lên lịch */}
      <div className="apple-card p-5 space-y-3">
        <h3 className="text-[#1D1D1F] font-bold text-sm">Hàng Đợi Lập Lịch Phát Sóng (Queue)</h3>

        <div className="space-y-2">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj)}
              className="p-3 rounded-xl bg-[#FAF9F5] border border-black/[0.06] hover:border-black/[0.14] hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <img
                  src={proj.thumbnailUrl}
                  alt={proj.title}
                  className="w-14 h-9 object-cover rounded-lg bg-zinc-200 border border-black/[0.08]"
                />
                <div>
                  <h4 className="text-[#1D1D1F] font-semibold text-xs hover:text-[#0071E3] transition">
                    {proj.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                    <span className="font-numeric text-zinc-700">
                      {Math.floor(proj.duration / 60)}m{proj.duration % 60}s
                    </span>
                    <span>•</span>
                    <span className="capitalize">{proj.aspectRatio === '16:9' ? 'Ngang (16:9)' : 'Dọc (9:16)'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-semibold text-[#34C759] font-numeric">
                    {proj.scheduledTime || 'Chưa định lịch'}
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${proj.status === 'published'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : proj.status === 'scheduled'
                        ? 'bg-blue-50 text-[#0071E3] border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                >
                  {proj.status === 'published'
                    ? 'Đã phát sóng'
                    : proj.status === 'scheduled'
                      ? 'Đã hẹn giờ'
                      : 'Chờ duyệt'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
