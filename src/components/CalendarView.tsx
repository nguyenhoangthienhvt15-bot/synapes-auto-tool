import React, { useEffect, useState } from 'react';
import { Project } from '../types';
import {
  Calendar as CalendarIcon,
  CalendarCheck2,
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
  Trash2,
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

// Bảng tra 12 Tranh Dân Gian Đông Hồ theo 12 tháng — chuẩn mực khắc ván gỗ thị & giấy điệp truyền thống
interface DongHoZodiacMeta {
  month: number;
  key: 'rat' | 'ox' | 'tiger' | 'cat' | 'dragon' | 'snake' | 'horse' | 'goat' | 'monkey' | 'rooster' | 'dog' | 'pig';
  chiName: string;
  paintingTitle: string;
  hanNom: [string, string];
  paperTone: 'hoe-gold' | 'diep-cream';
  craftNote: string;
  primaryPigment: string;
  secondaryPigment: string;
  accentPigment: string;
}

const ZODIAC_BY_MONTH: readonly DongHoZodiacMeta[] = [
  {
    month: 1,
    key: 'rat',
    chiName: 'Tý',
    paintingTitle: 'Đám Cưới Chuột',
    hanNom: ['鼠', '婚'],
    paperTone: 'hoe-gold',
    craftNote: 'Nét khắc ván gỗ thị, chuột quan đội mũ cánh chuồn áo bào đỏ son thổi kèn lọng rước kiệu.',
    primaryPigment: '#8D281B',
    secondaryPigment: '#2B5834',
    accentPigment: '#E1AD36',
  },
  {
    month: 2,
    key: 'ox',
    chiName: 'Sửu',
    paintingTitle: 'Mục Đồng Thổi Sáo',
    hanNom: ['牧', '童'],
    paperTone: 'diep-cream',
    craftNote: 'Trâu mộng khắc nét răng lược, mục đồng vấn khăn áo nâu son ngồi lưng trâu thổi sáo trúc trên gò cỏ.',
    primaryPigment: '#322C27',
    secondaryPigment: '#2B5834',
    accentPigment: '#E1AD36',
  },
  {
    month: 3,
    key: 'tiger',
    chiName: 'Dần',
    paintingTitle: 'Ngũ Hổ Thần Tướng',
    hanNom: ['五', '虎'],
    paperTone: 'hoe-gold',
    craftNote: 'Hoàng Hổ uy nghi trán chữ Vương, thân điểm hoa văn gấm lục giác, vân mây cuộn & bùa hộ mệnh.',
    primaryPigment: '#E1AD36',
    secondaryPigment: '#8D281B',
    accentPigment: '#2B5834',
  },
  {
    month: 4,
    key: 'cat',
    chiName: 'Mão',
    paintingTitle: 'Mèo Ngoạm Cá',
    hanNom: ['吉', '貓'],
    paperTone: 'diep-cream',
    craftNote: 'Mèo vàng hoa hòe bờm khắc răng lược, cổ đeo yếm vân khánh ngoạm cá chép vây khắc gân.',
    primaryPigment: '#D99B2B',
    secondaryPigment: '#8D281B',
    accentPigment: '#2B5834',
  },
  {
    month: 5,
    key: 'dragon',
    chiName: 'Thìn',
    paintingTitle: 'Long Chầu Nhật',
    hanNom: ['飛', '龍'],
    paperTone: 'hoe-gold',
    craftNote: 'Thanh Long vảy gấm chầu nhật ngọc rực lửa đỏ son giữa cụm mây cuộn ngũ sắc Đông Hồ.',
    primaryPigment: '#2B5834',
    secondaryPigment: '#8D281B',
    accentPigment: '#E1AD36',
  },
  {
    month: 6,
    key: 'snake',
    chiName: 'Tỵ',
    paintingTitle: 'Linh Xà Khắc Mộc',
    hanNom: ['靈', '蛇'],
    paperTone: 'diep-cream',
    craftNote: 'Linh xà cuộn chữ S vảy hoa thị lục giác bên khóm trúc & hoa sen đỏ trên nền điệp vỏ sò.',
    primaryPigment: '#2B5834',
    secondaryPigment: '#E1AD36',
    accentPigment: '#8D281B',
  },
  {
    month: 7,
    key: 'horse',
    chiName: 'Ngọ',
    paintingTitle: 'Thánh Gióng Vinh Quy',
    hanNom: ['榮', '歸'],
    paperTone: 'diep-cream',
    craftNote: 'Bạch mã phi nước đại bờm khắc răng lược, yên gấm lục giác hoa thị, mây lửa son & khóm tre ngà.',
    primaryPigment: '#8D281B',
    secondaryPigment: '#2B5834',
    accentPigment: '#E1AD36',
  },
  {
    month: 8,
    key: 'goat',
    chiName: 'Mùi',
    paintingTitle: 'Tam Dương Khai Thái',
    hanNom: ['三', '陽'],
    paperTone: 'hoe-gold',
    craftNote: 'Dê trắng vỏ điệp sừng xoắn thong dong trên gò đất đỏ-xanh, lông ức khắc răng lược song song.',
    primaryPigment: '#F4EFE0',
    secondaryPigment: '#8D281B',
    accentPigment: '#2B5834',
  },
  {
    month: 9,
    key: 'monkey',
    chiName: 'Thân',
    paintingTitle: 'Hầu Vương Dâng Đào',
    hanNom: ['獻', '壽'],
    paperTone: 'hoe-gold',
    craftNote: 'Linh hầu áo bào yếm vân khánh gấm hoa thị nâng trái đào tiên đỏ son & lá xanh chàm.',
    primaryPigment: '#B96428',
    secondaryPigment: '#8D281B',
    accentPigment: '#2B5834',
  },
  {
    month: 10,
    key: 'rooster',
    chiName: 'Dậu',
    paintingTitle: 'Gà Đại Cát Hoa Hồng',
    hanNom: ['大', '吉'],
    paperTone: 'hoe-gold',
    craftNote: 'Gà trống mào cờ son đất, bộ lông cánh & đuôi tam sắc xếp lớp răng lược bên búp sen hồng.',
    primaryPigment: '#E1AD36',
    secondaryPigment: '#8D281B',
    accentPigment: '#2B5834',
  },
  {
    month: 11,
    key: 'dog',
    chiName: 'Tuất',
    paintingTitle: 'Khuyển Vàng Phú Quý',
    hanNom: ['富', '貴'],
    paperTone: 'diep-cream',
    craftNote: 'Khuyển vàng hoa hòe đeo yếm vân khánh ngũ sắc ngồi vững trên gò cỏ, lông bụng khắc răng lược.',
    primaryPigment: '#D99B2B',
    secondaryPigment: '#8D281B',
    accentPigment: '#2B5834',
  },
  {
    month: 12,
    key: 'pig',
    chiName: 'Hợi',
    paintingTitle: 'Lợn Đàn Âm Dương',
    hanNom: ['陰', '陽'],
    paperTone: 'hoe-gold',
    craftNote: 'Kiệt tác Lợn Đàn Đông Hồ — thân hồng đất điểm 2 xoáy Âm Dương, lông ức răng lược bên khóm lá ráy.',
    primaryPigment: '#D98B72',
    secondaryPigment: '#8D281B',
    accentPigment: '#2B5834',
  },
];

const DONG_HO_IMAGE_BY_KEY: Record<DongHoZodiacMeta['key'], string> = {
  rat: '/dong-ho/zodiac-01-ty.jpg',
  ox: '/dong-ho/zodiac-02-suu.jpg',
  tiger: '/dong-ho/zodiac-03-dan.jpg',
  cat: '/dong-ho/zodiac-04-mao.jpg',
  dragon: '/dong-ho/zodiac-05-thin.jpg',
  snake: '/dong-ho/zodiac-06-ty-ran.jpg',
  horse: '/dong-ho/zodiac-07-ngo.jpg',
  goat: '/dong-ho/zodiac-08-mui.jpg',
  monkey: '/dong-ho/zodiac-09-than.jpg',
  rooster: '/dong-ho/zodiac-10-dau.jpg',
  dog: '/dong-ho/zodiac-11-tuat.jpg',
  pig: '/dong-ho/zodiac-12-hoi.jpg',
};

/**
 * Bức Tranh Khắc Gỗ Dân Gian Đông Hồ chuẩn mực — bản khắc ván gỗ thị & giấy điệp truyền thống
 * tái hiện nguyên bản tranh Đông Hồ dân gian Việt Nam qua 12 Con Giáp.
 */
export const DongHoZodiacPainting: React.FC<{
  zodiac: DongHoZodiacMeta;
  large?: boolean;
  compact?: boolean;
  onClick?: () => void;
}> = ({ zodiac, large = false, compact = false, onClick }) => {
  const isHoeBg = zodiac.paperTone === 'hoe-gold';
  const imgSrc = DONG_HO_IMAGE_BY_KEY[zodiac.key] || '/dong-ho/zodiac-01-ty.jpg';

  return (
    <div
      onClick={onClick}
      className={`relative flex-shrink-0 overflow-hidden select-none transition-transform duration-300 border-2 border-[#171310]/85 ${
        large
          ? 'w-full max-w-[460px] rounded-md shadow-xl'
          : 'rounded-sm shadow-sm hover:scale-[1.03] cursor-pointer'
      }`}
      style={
        large
          ? { aspectRatio: '4 / 3', backgroundColor: isHoeBg ? '#DFC252' : '#ECE6D4' }
          : compact
            ? { width: 96, height: 72, backgroundColor: isHoeBg ? '#DFC252' : '#ECE6D4' }
            : { width: 172, height: 129, backgroundColor: isHoeBg ? '#DFC252' : '#ECE6D4' }
      }
      title={`${zodiac.paintingTitle} (${zodiac.hanNom.join('')}) — Nhấn để phóng to Triển lãm 12 Tranh Đông Hồ`}
      data-testid={large ? 'dong-ho-zodiac-large' : 'dong-ho-zodiac-emblem'}
      data-zodiac-key={zodiac.key}
      data-zodiac-month={zodiac.month}
    >
      <img
        src={imgSrc}
        alt={`Tranh dân gian Đông Hồ: ${zodiac.paintingTitle}`}
        loading={large ? 'eager' : 'lazy'}
        className="w-full h-full object-cover block"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(23,19,16,0.28), inset 0 0 12px rgba(141,40,27,0.10)',
        }}
      />
    </div>
  );
};

// Các mốc giờ gợi ý tiêu chuẩn của hệ sinh thái (tương thích kiểm thử)
export const GOLDEN_TIME_PRESETS = [
  {
    id: 'yt-peak',
    platform: 'youtube',
    time: '19:30',
    label: 'YouTube (19:30 - Tối)',
    description: 'Khung giờ tối phổ biến cho khán giả xem trên TV & PC.',
    color: 'border-red-200 bg-red-50 text-red-700',
  },
  {
    id: 'tt-lunch',
    platform: 'tiktok',
    time: '12:00',
    label: 'TikTok Trưa (12:00)',
    description: 'Khung giờ nghỉ trưa có lượt lướt video ngắn cao.',
    color: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  },
  {
    id: 'tt-evening',
    platform: 'tiktok',
    time: '18:00',
    label: 'Chiều Tối (18:00)',
    description: 'Khung giờ tan tầm kết nối đồng đều các kênh.',
    color: 'border-zinc-300 bg-zinc-900 text-white',
  },
  {
    id: 'fb-family',
    platform: 'facebook',
    time: '20:30',
    label: 'Facebook Reels (20:30)',
    description: 'Khung giờ buổi tối thuận lợi cho thảo luận cộng đồng.',
    color: 'border-blue-200 bg-blue-50 text-blue-700',
  },
];

const getLocalIsoDate = (dt: Date): string =>
  `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')}`;

export const CalendarView: React.FC<CalendarViewProps> = ({
  projects,
  onSelectProject,
  onBack,
  onUpdateProject,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [todayDate, setTodayDate] = useState<Date>(() => new Date());
  const [ipGeoClock, setIpGeoClock] = useState<{
    countryCode: string;
    countryName: string;
    timezone: string;
    dateStr: string;
    timeStr: string;
  } | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [platformFilter, setPlatformFilter] = useState<'all' | 'youtube' | 'tiktok' | 'facebook'>('all');

  // State mở rộng xem cho từng ngày
  const [selectedDayModal, setSelectedDayModal] = useState<Date | null>(null);

  // State chỉnh sửa lịch phát sóng (thủ công hoặc Goldtime)
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>(() => getLocalIsoDate(new Date()));
  const [scheduleTime, setScheduleTime] = useState<string>('19:30');

  useEffect(() => {
    let active = true;
    fetch('/api/system/ip-time')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data || !data.year || !data.month || !data.day) return;
        const ipDate = new Date(Number(data.year), Number(data.month) - 1, Number(data.day));
        if (!Number.isNaN(ipDate.getTime())) {
          setTodayDate(ipDate);
          setCurrentDate(ipDate);
          setScheduleDate(getLocalIsoDate(ipDate));
          setIpGeoClock({
            countryCode: String(data.countryCode || 'VN'),
            countryName: String(data.countryName || 'Việt Nam'),
            timezone: String(data.timezone || 'Asia/Ho_Chi_Minh'),
            dateStr: String(data.dateStr || ''),
            timeStr: String(data.timeStr || ''),
          });
        }
      })
      .catch(() => {
        // Fallback giữ nguyên ngày/giờ cục bộ từ trình duyệt
      });
    return () => {
      active = false;
    };
  }, []);

  // Triển lãm phóng to 12 Bức Tranh Khắc Gỗ Dân Gian Đông Hồ
  const [showZodiacMuseumModal, setShowZodiacMuseumModal] = useState<boolean>(false);
  const [activeMuseumMonth, setActiveMuseumMonth] = useState<number | null>(null);

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

    let dateStr = getLocalIsoDate(todayDate);
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
      if (!parsed || parsed.dateStr !== key) return false;
      if (platformFilter !== 'all' && !p.targetChannels.includes(platformFilter)) return false;
      return true;
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
      setScheduleDate(getLocalIsoDate(todayDate));
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

  // Áp dụng nhanh gợi ý mốc giờ từ hệ thống
  const handleApplyGoldtimePreset = (preset: typeof GOLDEN_TIME_PRESETS[0]) => {
    setScheduleTime(preset.time);
    showToast(`Đã áp dụng mốc giờ: ${preset.label}`);
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
    setCurrentDate(new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()));
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
    { id: 'noon', label: 'Buổi Trưa', timeRange: '11:30 – 13:30', isGold: false },
    { id: 'afternoon', label: 'Buổi Chiều', timeRange: '14:00 – 18:00', isGold: false },
    { id: 'evening', label: 'Buổi Tối', timeRange: '18:00 – 22:30', isGold: false },
  ];
  const currentZodiac = ZODIAC_BY_MONTH[month % 12];

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-3.5 rounded-xl bg-zinc-950 text-white text-xs flex items-center gap-2.5 font-medium shadow-2xl border border-zinc-800 animate-slide-up">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar cân đối với huy hiệu Tranh Dân Gian Đông Hồ (chống bóp nghẹt cột tiêu đề) */}
      <div className="studio-card p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-secondary flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 cursor-pointer"
              title="Quay lại bàn duyệt"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          )}

          {/* Bức Tranh Khắc Gỗ Đông Hồ 12 Con Giáp thu gọn cố định kích thước */}
          <div className="flex-shrink-0 w-24">
            <DongHoZodiacPainting
              zodiac={currentZodiac}
              compact
              onClick={() => {
                setActiveMuseumMonth(currentZodiac.month);
                setShowZodiacMuseumModal(true);
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#141413] tracking-tight flex items-center gap-2 whitespace-nowrap">
                <CalendarIcon className="w-4 h-4 text-[#8B261D] flex-shrink-0" />
                <span>Lịch Phát Sóng Video</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  setActiveMuseumMonth(currentZodiac.month);
                  setShowZodiacMuseumModal(true);
                }}
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#F5EFE0] text-[#8D281B] border border-[#8D281B]/25 hover:bg-[#E4C85E]/40 transition cursor-pointer whitespace-nowrap"
                data-testid="open-dong-ho-museum-btn"
              >
                Tháng {currentZodiac.month} ({currentZodiac.chiName}): {currentZodiac.paintingTitle}
              </button>
              <span
                className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap"
                data-testid="calendar-ip-clock"
                title={ipGeoClock ? `Múi giờ theo IP: ${ipGeoClock.timezone}` : 'Thời gian hệ thống'}
              >
                Hôm nay: {todayDate.getDate().toString().padStart(2, '0')}/{(todayDate.getMonth() + 1).toString().padStart(2, '0')}/{todayDate.getFullYear()}
                {ipGeoClock ? ` • ${ipGeoClock.countryName} (${ipGeoClock.countryCode})` : ''}
              </span>
            </div>
            <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
              Quản lý lịch xuất bản theo ngày/giờ riêng cho từng video trên YouTube, TikTok và Facebook
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

      {/* Compact Platform Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPlatformFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
              platformFilter === 'all'
                ? 'bg-zinc-950 text-white border-zinc-950'
                : 'bg-white text-zinc-700 border-black/[0.1] hover:bg-zinc-50'
            }`}
          >
            Tất cả nền tảng
          </button>
          <button
            type="button"
            onClick={() => setPlatformFilter('youtube')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              platformFilter === 'youtube'
                ? 'bg-red-50 text-red-700 border-red-300'
                : 'bg-white text-zinc-700 border-black/[0.1] hover:bg-zinc-50'
            }`}
          >
            <YoutubeIcon className="w-3.5 h-3.5 text-red-600" />
            <span>YouTube</span>
          </button>
          <button
            type="button"
            onClick={() => setPlatformFilter('tiktok')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              platformFilter === 'tiktok'
                ? 'bg-zinc-900 text-white border-zinc-950'
                : 'bg-white text-zinc-700 border-black/[0.1] hover:bg-zinc-50'
            }`}
          >
            <TiktokIcon className="w-3.5 h-3.5" />
            <span>TikTok</span>
          </button>
          <button
            type="button"
            onClick={() => setPlatformFilter('facebook')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              platformFilter === 'facebook'
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-zinc-700 border-black/[0.1] hover:bg-zinc-50'
            }`}
          >
            <FacebookIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Facebook</span>
          </button>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          Nhấn vào từng ô ngày hoặc video để chỉnh ngày/giờ phát sóng riêng
        </span>
      </div>

      {/* VIEW 1: LỊCH THÁNG (MONTH CALENDAR GRID) */}
      {viewMode === 'month' && (
        <div className="studio-card overflow-hidden">
          {/* Calendar Header Row */}
          <div className="grid grid-cols-7 border-b border-black/[0.08] bg-[#F7F4EE] text-center text-xs font-bold font-mono text-[#141413] py-2.5">
            <div>Thứ Hai</div>
            <div>Thứ Ba</div>
            <div>Thứ Tư</div>
            <div>Thứ Năm</div>
            <div>Thứ Sáu</div>
            <div className="text-red-700">Thứ Bảy</div>
            <div className="text-red-700">Chủ Nhật</div>
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-black/[0.06] bg-zinc-100/30">
            {calendarDays.map((dayDate, idx) => {
              if (!dayDate) {
                return <div key={`empty-${idx}`} className="min-h-28 bg-zinc-50/40 p-2" />;
              }

              const dayProjects = getProjectsForDate(dayDate);
              const isToday =
                dayDate.getDate() === todayDate.getDate() &&
                dayDate.getMonth() === todayDate.getMonth() &&
                dayDate.getFullYear() === todayDate.getFullYear();

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
                const isToday =
                  d.getDate() === todayDate.getDate() &&
                  d.getMonth() === todayDate.getMonth() &&
                  d.getFullYear() === todayDate.getFullYear();
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
                <div className="p-2.5 flex flex-col justify-center text-left bg-zinc-50/50">
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
                      className="p-1.5 flex flex-col gap-1 transition cursor-pointer hover:bg-zinc-50 bg-white"
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

                  {/* Button Chỉnh Sửa Lịch Phát Sóng */}
                  <button
                    type="button"
                    onClick={() => handleOpenScheduleModal(proj)}
                    className="btn-secondary px-2.5 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                    title="Tùy chỉnh ngày giờ phát sóng riêng"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Đổi Giờ Hẹn</span>
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

      {/* MODAL 2: TÙY CHỈNH LỊCH PHÁT SÓNG RIÊNG CHO TỪNG VIDEO */}
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

              {/* 2. KHUNG GIỜ GỢI Ý NHANH */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
                    <span>2. Mốc Giờ Phát Sóng Phổ Biến</span>
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

      {/* MODAL TRIỂN LÃM 12 TRANH DÂN GIAN ĐÔNG HỒ PHÓNG ĐẠI CHẤT LƯỢNG CAO */}
      {showZodiacMuseumModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setShowZodiacMuseumModal(false)}
          data-testid="dong-ho-museum-modal"
        >
          <div
            className="w-full max-w-4xl bg-[#FAF6EC] border border-[#8D281B]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-black/10 flex items-center justify-between bg-[#F3E9D2]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#171310]">
                  Bộ Sưu Tập 12 Bức Tranh Khắc Gỗ Dân Gian Đông Hồ
                </h3>
                <p className="text-xs text-[#6E5A45]">
                  Chất liệu Giấy Điệp quét chổi lá thông & bảng màu khoáng vật tự nhiên (Sỏi son, Lá chàm, Hoa hòe, Vỏ sò điệp)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowZodiacMuseumModal(false)}
                className="p-1.5 rounded-lg hover:bg-black/10 text-[#171310] cursor-pointer"
                aria-label="Đóng triển lãm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              {(() => {
                const selectedZ =
                  ZODIAC_BY_MONTH.find((z) => z.month === (activeMuseumMonth || currentZodiac.month)) || currentZodiac;
                return (
                  <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-xl bg-white/80 border border-[#8D281B]/15 shadow-xs">
                    <DongHoZodiacPainting zodiac={selectedZ} large />
                    <div className="flex-1 space-y-3 text-left">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#8D281B]/10 text-[#8D281B] text-xs font-bold">
                        <span>Tháng {selectedZ.month} • Địa Chi: {selectedZ.chiName}</span>
                        <span>• {selectedZ.hanNom.join('')}</span>
                      </div>
                      <h4 className="text-xl font-bold text-[#171310]">{selectedZ.paintingTitle}</h4>
                      <p className="text-sm text-zinc-700 leading-relaxed">{selectedZ.craftNote}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs font-medium text-zinc-500">Sắc khoáng chủ đạo:</span>
                        <span className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: selectedZ.primaryPigment }} title="Màu chính" />
                        <span className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: selectedZ.secondaryPigment }} title="Màu phụ" />
                        <span className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: selectedZ.accentPigment }} title="Màu điểm" />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Lưới thu nhỏ 12 con giáp để chọn xem nhanh */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {ZODIAC_BY_MONTH.map((z) => {
                  const isActive = z.month === (activeMuseumMonth || currentZodiac.month);
                  return (
                    <button
                      key={z.key}
                      type="button"
                      onClick={() => setActiveMuseumMonth(z.month)}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col items-center gap-1.5 ${
                        isActive
                          ? 'bg-white border-[#8D281B] ring-2 ring-[#8D281B]/30 shadow-sm'
                          : 'bg-white/60 border-black/10 hover:bg-white'
                      }`}
                    >
                      <DongHoZodiacPainting zodiac={z} />
                      <div className="w-full flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-[#171310] truncate">{z.paintingTitle}</span>
                        <span className="text-[10px] font-mono text-[#8D281B] font-semibold">T{z.month}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
