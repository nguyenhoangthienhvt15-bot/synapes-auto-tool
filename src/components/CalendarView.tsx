import React from 'react';
import { Project } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Video, Music, Share2, Clock, ArrowLeft } from 'lucide-react';

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
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
    <div className="space-y-4 animate-fade-in select-none">
      {/* Header Bar */}
      <div className="studio-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-secondary flex items-center gap-1.5"
              title="Quay lại bàn duyệt"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          )}

          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Lịch Xuất Bản & Khung Giờ Phát Sóng</h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              Tự động điều phối lịch đăng tải tối ưu theo khung giờ tương tác cao nhất của từng nền tảng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-black/5 self-start md:self-auto">
          <button className="p-1 rounded hover:bg-white text-zinc-600 transition" aria-label="Tháng trước">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-medium text-zinc-800 px-2.5">
            11 / 2026
          </span>
          <button className="p-1 rounded hover:bg-white text-zinc-600 transition" aria-label="Tháng sau">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Golden Hours Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="studio-card p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900 flex items-center gap-2">
              <YoutubeIcon className="w-3.5 h-3.5 text-zinc-900" />
              <span>YouTube Video (16:9)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
              18:00 – 20:30
            </span>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Phục vụ người xem TV và máy tính. Đẩy mạnh đề xuất video định dạng dài từ 5–10 phút trọn vẹn.
          </p>
        </div>

        <div className="studio-card p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900 flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-zinc-900" />
              <span>TikTok Shorts (9:16)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
              11:30 – 13:00
            </span>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Giờ nghỉ trưa tập trung học sinh, sinh viên và nhân viên văn phòng. Tỉ lệ click anchor link cao.
          </p>
        </div>

        <div className="studio-card p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900 flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-zinc-900" />
              <span>Facebook Reels</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
              20:00 – 22:30
            </span>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Khung giờ giải trí gia đình trên thiết bị di động, lượng tương tác và chia sẻ cộng đồng đạt đỉnh.
          </p>
        </div>
      </div>

      {/* Queue Table Card */}
      <div className="studio-card overflow-hidden">
        <div className="px-4 py-3 border-b border-black/5 bg-zinc-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider font-mono">
              Hàng Đợi Lập Lịch Phát Sóng (Queue)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            {projects.length} dự án
          </span>
        </div>

        <div className="divide-y divide-black/5">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj)}
              className="p-3.5 hover:bg-zinc-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={proj.thumbnailUrl}
                  alt={proj.title}
                  className="w-16 h-10 object-cover rounded-md bg-zinc-200 border border-black/10 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-medium text-zinc-900 group-hover:text-black truncate transition">
                    {proj.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                    <span className="font-mono text-zinc-700">
                      {Math.floor(proj.duration / 60)}m{proj.duration % 60}s
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span className="font-mono text-zinc-500">{proj.aspectRatio}</span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-zinc-500 truncate">{proj.targetChannels.join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-xs font-mono text-zinc-700 font-medium">
                    {proj.scheduledTime || 'Chưa hẹn giờ'}
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border ${proj.status === 'published'
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : proj.status === 'scheduled'
                        ? 'bg-zinc-100 text-zinc-800 border-zinc-200'
                        : 'bg-white text-zinc-600 border-zinc-200'
                    }`}
                >
                  {proj.status === 'published'
                    ? 'ĐÃ PHÁT'
                    : proj.status === 'scheduled'
                      ? 'ĐÃ HẸN GIỜ'
                      : 'CHỜ DUYỆT'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
