import React, { useState } from 'react';
import { Project } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowLeft,
  Sparkles,
  CalendarDays,
  ListOrdered,
  Plus,
  X,
  Check,
  Edit3,
  CalendarCheck2,
  Trash2,
  ExternalLink,
  Flame,
  Zap,
} from 'lucide-react';

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TiktokIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.32a6.34 6.34 0 0 0-.85-.06A6.34 6.34 0 0 0 3.14 15.6a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.86-4.49V8.52a8.27 8.27 0 0 0 4.88 1.62V6.69z" />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface CalendarViewProps {
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onBack?: () => void;
  onUpdateProject?: (updated: Project) => void;
}

type ViewMode = 'month' | 'week' | 'queue';

// Các mốc giờ vàng tiêu chuẩn của hệ sinh thái
export const GOLDEN_TIME_PRESETS = [
  {
    id: 'yt-peak',
    platform: 'youtube',
    time: '19:30',
    label: 'YouTube (19:30 - Tối)',
    description: 'Khung giờ vàng xem trên TV & PC, tập trung khán giả xem video dài 5–10 phút.',
    color: 'border-red-200 bg-red-50 text-red-700',
  },
  {
    id: 'tt-lunch',
    platform: 'tiktok',
    time: '12:00',
    label: 'TikTok Nghỉ Trưa (12:00)',
    description: 'Giờ ăn trưa của giới trẻ và dân văn phòng, tỷ lệ click anchor link cao.',
    color: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  },
  {
    id: 'tt-evening',
    platform: 'tiktok',
    time: '20:15',
    label: 'TikTok Giải Trí (20:15)',
    description: 'Thời điểm lướt video ngắn trước khi đi ngủ, độ tương tác và chia sẻ mạnh.',
    color: 'border-zinc-300 bg-zinc-900 text-white',
  },
  {
    id: 'fb-family',
    platform: 'facebook',
    time: '20:30',
    label: 'Facebook Reels (20:30)',
    description: 'Khung giờ sinh hoạt gia đình, lượng tương tác thảo luận cộng đồng đạt đỉnh.',
    color: 'border-blue-200 bg-blue-50 text-blue-700',
  },
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  projects,
  onSelectProject,
  onBack,
  onUpdateProject,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 10, 8)); // Tháng 11 năm 2026

  // State mở rộng xem cho từng ngày
  const [selectedDayModal, setSelectedDayModal] = useState<Date | null>(null);

  // State chỉnh sửa lịch phát sóng (thủ công hoặc Goldtime)
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('2026-11-08');
  const [scheduleTime, setScheduleTime] = useState<string>('19:30');

  // Thông báo toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Trích xuất ngày từ chuỗi scheduledTime của project
  const parseProjectDate = (proj: Project): { dateStr: string; timeStr: string } | null => {
    if (!proj.scheduledTime) return null;
    const str = proj.scheduledTime;
    // Hỗ trợ dạng "19:30, 08/11/2026" hoặc "2026-11-08 19:30" hoặc "19:30 - Tối nay"
    const dateMatch = str.match(/(\d{4}-\d{2}-\d{2})/) || str.match(/(\d{2}\/\d{2}\/\d{4})/);
    const timeMatch = str.match(/(\d{1,2}:\d{2})/);

    let dateStr = '2026-11-08';
    if (dateMatch) {
      if (dateMatch[1].includes('/')) {
        const [d, m, y] = dateMatch[1].split('/');
        dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      } else {
        dateStr = dateMatch[1];
      }
    }
    const timeStr = timeMatch ? timeMatch[1] : '19:30';
    return { dateStr, timeStr };
  };

  // Lấy các project theo ngày cụ thể (YYYY-MM-DD)
  const getProjectsForDate = (date: Date): Project[] => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const key = `${y}-${m}-${d}`;

    return projects.filter((p) => {
      const parsed = parseProjectDate(p);
      if (!parsed) return false;
      return parsed.dateStr === key;
    });
  };

  // Mở modal đặt lịch cho project
  const handleOpenScheduleModal = (proj: Project, defaultDate?: Date) => {
    setEditingProject(proj);
    const parsed = parseProjectDate(proj);
    if (parsed) {
      setScheduleDate(parsed.dateStr);
      setScheduleTime(parsed.timeStr);
    } else if (defaultDate) {
      const y = defaultDate.getFullYear();
      const m = (defaultDate.getMonth() + 1).toString().padStart(2, '0');
      const d = defaultDate.getDate().toString().padStart(2, '0');
      setScheduleDate(`${y}-${m}-${d}`);
      setScheduleTime('19:30');
    } else {
      setScheduleDate('2026-11-08');
      setScheduleTime('19:30');
    }
  };

  // Lưu lịch phát sóng thủ công hoặc giờ vàng
  const handleSaveSchedule = () => {
    if (!editingProject || !onUpdateProject) return;

    // Định dạng ngày giờ hiển thị
    const [y, m, d] = scheduleDate.split('-');
    const formattedDate = `${d}/${m}/${y}`;
    const fullScheduleStr = `${scheduleTime}, ${formattedDate} (Lịch phát sóng)`;

    const updated: Project = {
      ...editingProject,
      status: 'scheduled',
      scheduledTime: fullScheduleStr,
    };

    onUpdateProject(updated);
    setEditingProject(null);
    showToast(`Đã lưu lịch phát sóng cho dự án: "${editingProject.title.slice(0, 30)}..." lúc ${scheduleTime} ngày ${formattedDate}`);
  };

  // Áp dụng nhanh gợi ý Goldtime từ hệ thống
  const handleApplyGoldtimePreset = (preset: typeof GOLDEN_TIME_PRESETS[0]) => {
    setScheduleTime(preset.time);
    showToast(`Đã áp dụng gợi ý Giờ Vàng: ${preset.label}`);
  };

  // Tự động phân bổ Giờ Vàng tối ưu theo Kênh của dự án
  const handleAutoAssignGoldtime = (proj: Project) => {
    let optimalTime = '19:30';
    if (proj.targetChannels.includes('tiktok') && proj.aspectRatio === '9:16') {
      optimalTime = '12:00';
    } else if (proj.targetChannels.includes('facebook')) {
      optimalTime = '20:30';
    } else {
      optimalTime = '19:30';
    }

    const todayStr = '08/11/2026';
    const updated: Project = {
      ...proj,
      status: 'scheduled',
      scheduledTime: `${optimalTime}, ${todayStr} (Khung giờ vàng đề xuất)`,
    };

    onUpdateProject?.(updated);
    showToast(`⚡ Đã tự động phân bổ vào Giờ Vàng tối ưu (${optimalTime}) cho ${proj.targetChannels.join(', ')}`);
  };

  // Hủy hẹn giờ
  const handleRemoveSchedule = (proj: Project) => {
    if (!onUpdateProject) return;
    const updated: Project = {
      ...proj,
      status: 'pending_approval',
      scheduledTime: undefined,
    };
    onUpdateProject(updated);
    setEditingProject(null);
    showToast(`Đã hủy lịch hẹn của dự án: "${proj.title.slice(0, 25)}..."`);
  };

  // Điều hướng tháng
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 10, 8));
  };

  // Tính toán các ngày trong tháng hiện tại
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-based
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Thứ của ngày 1 (0: CN, 1: T2, ..., 6: T7) -> Chuyển sang T2 = 0, CN = 6
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  // Danh sách 7 ngày trong tuần cho Week View
  const getWeekDates = (): Date[] => {
    const dates: Date[] = [];
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh sang Thứ 2
    const monday = new Date(curr.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(monday);
      nextDate.setDate(monday.getDate() + i);
      dates.push(nextDate);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Khung thời gian tuần
  const timeBlocks = [
    { id: 'morning', label: 'Buổi Sáng', timeRange: '08:00 – 11:30', isGold: false },
    { id: 'noon', label: 'Buổi Trưa (🌟 Goldtime TikTok)', timeRange: '11:30 – 13:30', isGold: true, goldPlatform: 'tiktok' },
    { id: 'afternoon', label: 'Buổi Chiều', timeRange: '14:00 – 18:00', isGold: false },
    { id: 'evening', label: 'Buổi Tối (🌟 Goldtime YouTube & FB)', timeRange: '18:00 – 22:30', isGold: true, goldPlatform: 'youtube' },
  ];

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-3.5 rounded-xl bg-zinc-950 text-white text-xs flex items-center gap-2.5 font-medium shadow-2xl border border-zinc-800 animate-slide-up">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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

          <div className="w-9 h-9 rounded-lg bg-zinc-950 text-white flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-950 tracking-tight">Lịch Xuất Bản & Khung Giờ Phát Sóng</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-semibold">
                Goldtime AI
              </span>
            </div>
            <p className="text-zinc-500 text-xs mt-0.5">
              Tùy chỉnh lịch phát sóng thủ công hoặc tự động điều phối theo khung giờ vàng tương tác cao của YouTube, TikTok, Facebook
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Date Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Mode Tabs */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-xl border border-black/5">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'month' ? 'bg-white text-zinc-950 font-bold shadow-2xs' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Lịch Tháng</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'week' ? 'bg-white text-zinc-950 font-bold shadow-2xs' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <CalendarCheck2 className="w-3.5 h-3.5" />
              <span>Lịch Tuần</span>
            </button>
            <button
              onClick={() => setViewMode('queue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'queue' ? 'bg-white text-zinc-950 font-bold shadow-2xs' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Hàng Đợi ({projects.length})</span>
            </button>
          </div>

          {/* Month/Year Navigation */}
          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-xl border border-black/5">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-white text-zinc-600 transition cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleToday}
              className="text-xs font-mono font-bold text-zinc-900 px-2 py-0.5 rounded hover:bg-white transition cursor-pointer"
              title="Về tháng hiện tại"
            >
              {(month + 1).toString().padStart(2, '0')} / {year}
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-white text-zinc-600 transition cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Golden Hours Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="studio-card p-4 space-y-2 border-l-4 border-l-red-500 bg-linear-to-br from-red-50/20 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-950 flex items-center gap-2">
              <YoutubeIcon className="w-4 h-4 text-red-600" />
              <span>YouTube Video (16:9)</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
              18:00 – 20:30 (Đỉnh: 19:30)
            </span>
          </div>
          <p className="text-zinc-600 text-[11px] leading-relaxed">
            Khung giờ xem TV & PC cao điểm. Đẩy mạnh đề xuất video định dạng dài 5–10 phút trọn vẹn và đạt doanh thu AdSense cao.
          </p>
        </div>

        <div className="studio-card p-4 space-y-2 border-l-4 border-l-zinc-950 bg-linear-to-br from-zinc-100/40 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-950 flex items-center gap-2">
              <TiktokIcon className="w-4 h-4 text-zinc-950" />
              <span>TikTok Shorts (9:16)</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-white border border-zinc-800">
              11:30 – 13:00 & 20:15
            </span>
          </div>
          <p className="text-zinc-600 text-[11px] leading-relaxed">
            Giờ nghỉ trưa và lướt ban đêm tập trung học sinh, sinh viên, nhân viên văn phòng. Thuật toán phân phối nhanh, tỉ lệ click bio cao.
          </p>
        </div>

        <div className="studio-card p-4 space-y-2 border-l-4 border-l-blue-500 bg-linear-to-br from-blue-50/20 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-950 flex items-center gap-2">
              <FacebookIcon className="w-4 h-4 text-blue-600" />
              <span>Facebook Reels</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              20:00 – 22:30 (Đỉnh: 20:30)
            </span>
          </div>
          <p className="text-zinc-600 text-[11px] leading-relaxed">
            Khung giờ sinh hoạt gia đình trên thiết bị di động, lượng tương tác thảo luận, bình luận và chia sẻ cộng đồng đạt đỉnh.
          </p>
        </div>
      </div>

      {/* VIEW 1: LỊCH THÁNG (MONTH CALENDAR GRID) */}
      {viewMode === 'month' && (
        <div className="studio-card overflow-hidden">
          {/* Calendar Header Row */}
          <div className="grid grid-cols-7 border-b border-black/[0.08] bg-zinc-50/70 text-center text-xs font-bold font-mono text-zinc-600 py-2.5">
            <div>Thứ Hai</div>
            <div>Thứ Ba</div>
            <div>Thứ Tư</div>
            <div>Thứ Năm</div>
            <div>Thứ Sáu</div>
            <div className="text-red-600">Thứ Bảy</div>
            <div className="text-red-600">Chủ Nhật</div>
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-black/[0.06] bg-zinc-100/30">
            {calendarDays.map((dayDate, idx) => {
              if (!dayDate) {
                return <div key={`empty-${idx}`} className="min-h-28 bg-zinc-50/40 p-2" />;
              }

              const dayProjects = getProjectsForDate(dayDate);
              const isToday =
                dayDate.getDate() === 8 &&
                dayDate.getMonth() === 10 &&
                dayDate.getFullYear() === 2026;

              return (
                <div
                  key={dayDate.toISOString()}
                  onClick={() => setSelectedDayModal(dayDate)}
                  className={`min-h-28 p-2 flex flex-col justify-between transition cursor-pointer group relative ${
                    isToday ? 'bg-amber-50/30 ring-1 ring-amber-400/50' : 'bg-white hover:bg-zinc-50/80'
                  }`}
                >
                  {/* Top Bar of Day */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                        isToday
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-zinc-700 group-hover:text-zinc-950'
                      }`}
                    >
                      {dayDate.getDate()}
                    </span>

                    {dayProjects.length > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-900 text-white font-semibold">
                        {dayProjects.length} clip
                      </span>
                    )}
                  </div>

                  {/* Scheduled Items Preview */}
                  <div className="space-y-1.5 flex-1 overflow-hidden">
                    {dayProjects.slice(0, 3).map((proj) => {
                      const parsed = parseProjectDate(proj);
                      const isYt = proj.targetChannels.includes('youtube');
                      const isTt = proj.targetChannels.includes('tiktok');
                      const isFb = proj.targetChannels.includes('facebook');

                      return (
                        <div
                          key={proj.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenScheduleModal(proj, dayDate);
                          }}
                          className="px-2 py-1 rounded-md text-[10px] font-medium border border-black/10 flex items-center justify-between gap-1 shadow-2xs hover:scale-[1.02] transition bg-white"
                          title={`${proj.title} • ${parsed?.timeStr || '19:30'}`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {isYt && <YoutubeIcon className="w-3 h-3 text-red-600 flex-shrink-0" />}
                            {isTt && <TiktokIcon className="w-3 h-3 text-zinc-950 flex-shrink-0" />}
                            {isFb && <FacebookIcon className="w-3 h-3 text-blue-600 flex-shrink-0" />}
                            <span className="truncate text-zinc-900 font-sans">{proj.title}</span>
                          </div>
                          <span className="font-mono text-zinc-600 font-bold flex-shrink-0 text-[9px]">
                            {parsed?.timeStr || '19:30'}
                          </span>
                        </div>
                      );
                    })}

                    {dayProjects.length > 3 && (
                      <div className="text-[10px] text-zinc-500 font-mono text-center">
                        +{dayProjects.length - 3} video nữa...
                      </div>
                    )}
                  </div>

                  {/* Hover Quick Action */}
                  <div className="mt-1 pt-1 border-t border-black/[0.04] flex items-center justify-between text-[10px] text-zinc-400 group-hover:text-zinc-600">
                    <span className="font-mono text-[9px]">Xem chi tiết</span>
                    <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: LỊCH TUẦN (WEEK VIEW WITH TIME BLOCKS) */}
      {viewMode === 'week' && (
        <div className="studio-card overflow-hidden">
          <div className="p-3 border-b border-black/[0.08] bg-zinc-50/70 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 font-mono uppercase tracking-wider">
              Lịch Biểu Theo Tuần (Khung Giờ 24H)
            </span>
            <span className="text-[11px] text-zinc-500 font-sans">
              Bấm vào từng khung giờ hoặc ngày để tinh chỉnh lịch xuất bản
            </span>
          </div>

          <div className="divide-y divide-black/[0.08]">
            {/* Header Columns for 7 Days */}
            <div className="grid grid-cols-8 bg-zinc-100/50 text-center py-2.5 font-mono text-xs font-bold text-zinc-700 divide-x divide-black/[0.06]">
              <div className="text-zinc-400">Khung Giờ</div>
              {weekDates.map((d, i) => {
                const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                const isToday = d.getDate() === 8 && d.getMonth() === 10;
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDayModal(d)}
                    className={`cursor-pointer hover:bg-white transition ${isToday ? 'text-amber-700 font-black' : ''}`}
                  >
                    <span>{dayNames[d.getDay()]}</span>{' '}
                    <span className="text-[11px] font-mono text-zinc-500">
                      ({d.getDate()}/{d.getMonth() + 1})
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Time Blocks Rows */}
            {timeBlocks.map((block) => (
              <div key={block.id} className="grid grid-cols-8 divide-x divide-black/[0.06] min-h-24">
                {/* Block Label */}
                <div
                  className={`p-2.5 flex flex-col justify-center text-left ${
                    block.isGold ? 'bg-amber-50/40 border-l-4 border-l-amber-500' : 'bg-zinc-50/50'
                  }`}
                >
                  <div className="text-xs font-bold text-zinc-900 leading-tight">{block.label}</div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{block.timeRange}</div>
                </div>

                {/* 7 Days in this block */}
                {weekDates.map((d, i) => {
                  const dayProjs = getProjectsForDate(d);
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDayModal(d)}
                      className={`p-1.5 flex flex-col gap-1 transition cursor-pointer hover:bg-zinc-50 ${
                        block.isGold ? 'bg-amber-50/10' : 'bg-white'
                      }`}
                    >
                      {dayProjs.map((p) => (
                        <div
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenScheduleModal(p, d);
                          }}
                          className="p-1 rounded bg-white border border-black/10 text-[10px] font-medium shadow-2xs hover:border-zinc-950 truncate"
                        >
                          <div className="font-bold text-zinc-950 truncate">{p.title}</div>
                          <div className="text-[9px] font-mono text-zinc-500 flex items-center justify-between">
                            <span>{p.aspectRatio}</span>
                            <span className="text-emerald-700 font-bold">Lên lịch</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: HÀNG ĐỢI DANH SÁCH (QUEUE VIEW) */}
      {viewMode === 'queue' && (
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
                className="p-3.5 hover:bg-zinc-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div
                  onClick={() => onSelectProject(proj)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                >
                  <img
                    src={proj.thumbnailUrl}
                    alt={proj.title}
                    className="w-16 h-10 object-cover rounded-md bg-zinc-200 border border-black/10 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 group-hover:text-black truncate transition">
                      {proj.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                      <span className="font-mono text-zinc-700">
                        {Math.floor(proj.duration / 60)}m{proj.duration % 60}s
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span className="font-mono text-zinc-500">{proj.aspectRatio}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-zinc-500 truncate capitalize">{proj.targetChannels.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* Schedule Status & Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-xs font-mono text-zinc-800 font-bold">
                      {proj.scheduledTime || 'Chưa hẹn giờ'}
                    </div>
                  </div>

                  {/* Button Gán Nhanh Giờ Vàng */}
                  <button
                    type="button"
                    onClick={() => handleAutoAssignGoldtime(proj)}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-medium flex items-center gap-1 transition cursor-pointer shadow-2xs"
                    title="Tự động gán giờ vàng tối ưu cho kênh"
                  >
                    <Zap className="w-3 h-3 text-amber-600" />
                    <span>Giờ Vàng</span>
                  </button>

                  {/* Button Chỉnh Sửa Giờ Thủ Công */}
                  <button
                    type="button"
                    onClick={() => handleOpenScheduleModal(proj)}
                    className="btn-secondary px-2.5 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                    title="Tùy chỉnh lịch phát sóng thủ công"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Đổi Giờ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: MỞ RỘNG XEM CHO TỪNG NGÀY (DAY DETAIL MODAL) */}
      {selectedDayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="studio-card w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
            {/* Modal Header */}
            <div className="p-4 border-b border-black/[0.08] bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-sm">
                  {selectedDayModal.getDate()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-950">
                    Chi Tiết Lịch Xuất Bản Ngày {selectedDayModal.getDate()}/{selectedDayModal.getMonth() + 1}/{selectedDayModal.getFullYear()}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Quản lý danh sách các clip đã lên lịch và dự án hàng đợi cần phát sóng trong ngày này
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDayModal(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Section 1: Video Đã Lên Lịch Trong Ngày Này */}
              <div>
                <div className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>VIDEO ĐÃ LÊN LỊCH TRONG NGÀY ({getProjectsForDate(selectedDayModal).length})</span>
                  <span className="text-emerald-700 font-sans font-medium">Sẵn sàng xuất bản tự động</span>
                </div>

                {getProjectsForDate(selectedDayModal).length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-zinc-300 text-center space-y-2">
                    <Clock className="w-6 h-6 text-zinc-400 mx-auto" />
                    <p className="text-xs text-zinc-500">Chưa có video nào được lên lịch cho ngày này.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getProjectsForDate(selectedDayModal).map((proj) => {
                      const parsed = parseProjectDate(proj);
                      return (
                        <div
                          key={proj.id}
                          className="p-3 rounded-xl border border-black/10 bg-white hover:border-zinc-950 transition flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={proj.thumbnailUrl}
                              alt={proj.title}
                              className="w-14 h-10 object-cover rounded-md bg-zinc-200 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-zinc-950 truncate">{proj.title}</h4>
                              <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-emerald-700 font-bold">{parsed?.timeStr}</span>
                                <span>•</span>
                                <span className="font-mono">{proj.aspectRatio}</span>
                                <span>•</span>
                                <span className="capitalize">{proj.targetChannels.join(', ')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleOpenScheduleModal(proj, selectedDayModal)}
                              className="btn-secondary px-2 py-1 text-xs"
                            >
                              Đổi Giờ
                            </button>
                            <button
                              onClick={() => handleRemoveSchedule(proj)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition"
                              title="Hủy lịch phát sóng"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Hàng Đợi Chưa Hẹn Giờ (Có thể đưa vào ngày này) */}
              <div>
                <div className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  DỰ ÁN TRONG HÀNG ĐỢI (BẤM ĐỂ ĐƯA VÀO NGÀY NÀY)
                </div>
                <div className="space-y-2">
                  {projects
                    .filter((p) => !p.scheduledTime || p.status === 'pending_approval')
                    .map((proj) => (
                      <div
                        key={proj.id}
                        className="p-2.5 rounded-xl border border-black/[0.08] bg-zinc-50 hover:bg-white transition flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-zinc-900 truncate">{proj.title}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {proj.aspectRatio} • {proj.targetChannels.join(', ')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenScheduleModal(proj, selectedDayModal)}
                          className="btn-primary text-xs px-2.5 py-1 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Lên Lịch Ngày Này</span>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-black/[0.08] bg-zinc-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedDayModal(null)}
                className="btn-secondary text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TÙY CHỈNH LỊCH PHÁT SÓNG (THỦ CÔNG HOẶC GỢI Ý GOLDTIME) */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="studio-card w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-slide-up">
            {/* Header */}
            <div className="p-4 border-b border-black/[0.08] bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-900" />
                <h3 className="text-sm font-bold text-zinc-950">Tùy Chỉnh Lịch Xuất Bản Video</h3>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="p-1 rounded-lg hover:bg-zinc-200 text-zinc-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Project Quick Info */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-black/5 flex items-center gap-3">
                <img
                  src={editingProject.thumbnailUrl}
                  alt={editingProject.title}
                  className="w-12 h-12 object-cover rounded-lg border border-black/10 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-950 truncate">{editingProject.title}</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    Kênh: <strong className="text-zinc-800 capitalize">{editingProject.targetChannels.join(', ')}</strong> • Khung hình: {editingProject.aspectRatio}
                  </div>
                </div>
              </div>

              {/* 1. CHỌN NGÀY PHÁT SÓNG */}
              <div>
                <label className="text-xs font-bold text-zinc-900 block mb-1">
                  1. Chọn Ngày Phát Sóng
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                />
              </div>

              {/* 2. GỢI Ý GOLDTIME (GIỜ VÀNG HỆ THỐNG) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>2. Gợi Ý Khung Giờ Vàng (Goldtime) Đạt Đỉnh Tương Tác</span>
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500">1-Click Chọn</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {GOLDEN_TIME_PRESETS.map((preset) => {
                    const isSelected = scheduleTime === preset.time;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyGoldtimePreset(preset)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-2xs'
                            : 'bg-white hover:bg-zinc-50 border-black/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-zinc-950 truncate">{preset.label}</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-800">
                            {preset.time}
                          </span>
                        </div>
                        <div className="text-[9px] text-zinc-500 leading-snug line-clamp-2">
                          {preset.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. TÙY CHỈNH THỦ CÔNG (MANUAL TIME) */}
              <div>
                <label className="text-xs font-bold text-zinc-900 block mb-1">
                  3. Hoặc Nhập Giờ Cụ Thể (Thủ Công)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="flex-1 bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                  />
                  <div className="flex items-center gap-1">
                    {['12:00', '18:30', '19:30', '20:30'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setScheduleTime(t)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer ${
                          scheduleTime === t
                            ? 'bg-zinc-950 text-white border-zinc-950'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-black/5 text-xs text-zinc-600 flex items-center justify-between">
                <span>Dự kiến phát sóng:</span>
                <span className="font-mono font-bold text-zinc-950">
                  {scheduleTime} • {scheduleDate}
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-3.5 border-t border-black/[0.08] bg-zinc-50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleRemoveSchedule(editingProject)}
                className="btn-secondary text-xs text-red-600 hover:bg-red-50"
              >
                Hủy Hẹn Giờ
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="btn-secondary text-xs"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="btn-primary text-xs shadow-xs"
                >
                  Lưu Lịch Phát Sóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
