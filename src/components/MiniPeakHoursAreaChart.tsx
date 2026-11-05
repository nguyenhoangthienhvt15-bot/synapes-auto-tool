import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Radio } from 'lucide-react';

interface HourlyData {
  hour: number;
  label: string;
  tiktok: number;   // 0 - 100%
  youtube: number;  // 0 - 100%
  facebook: number; // 0 - 100%
}

// Dữ liệu lưu lượng thực tế theo từng khung giờ (24 giờ, bước nhảy 1 giờ) tại Việt Nam (GMT+7)
const BASE_HOURLY_DATA: HourlyData[] = [
  { hour: 0,  label: '00:00', tiktok: 28, youtube: 20, facebook: 22 },
  { hour: 1,  label: '01:00', tiktok: 16, youtube: 12, facebook: 12 },
  { hour: 2,  label: '02:00', tiktok: 9,  youtube: 6,  facebook: 7  },
  { hour: 3,  label: '03:00', tiktok: 5,  youtube: 4,  facebook: 5  },
  { hour: 4,  label: '04:00', tiktok: 6,  youtube: 4,  facebook: 6  },
  { hour: 5,  label: '05:00', tiktok: 12, youtube: 8,  facebook: 14 },
  { hour: 6,  label: '06:00', tiktok: 26, youtube: 16, facebook: 32 },
  { hour: 7,  label: '07:00', tiktok: 38, youtube: 22, facebook: 48 },
  { hour: 8,  label: '08:00', tiktok: 46, youtube: 28, facebook: 58 },
  { hour: 9,  label: '09:00', tiktok: 52, youtube: 36, facebook: 64 },
  { hour: 10, label: '10:00', tiktok: 64, youtube: 42, facebook: 70 },
  { hour: 11, label: '11:00', tiktok: 86, youtube: 50, facebook: 78 }, // Khung giờ vàng trưa bắt đầu
  { hour: 12, label: '12:00', tiktok: 95, youtube: 62, facebook: 88 }, // Đỉnh trưa TikTok/Facebook
  { hour: 13, label: '13:00', tiktok: 74, youtube: 48, facebook: 68 },
  { hour: 14, label: '14:00', tiktok: 54, youtube: 42, facebook: 58 },
  { hour: 15, label: '15:00', tiktok: 58, youtube: 46, facebook: 62 },
  { hour: 16, label: '16:00', tiktok: 66, youtube: 54, facebook: 70 },
  { hour: 17, label: '17:00', tiktok: 72, youtube: 62, facebook: 72 },
  { hour: 18, label: '18:00', tiktok: 82, youtube: 78, facebook: 78 },
  { hour: 19, label: '19:00', tiktok: 90, youtube: 90, facebook: 85 }, // Khung giờ vàng tối bùng nổ
  { hour: 20, label: '20:00', tiktok: 98, youtube: 99, facebook: 94 }, // Đỉnh cao toàn mạng
  { hour: 21, label: '21:00', tiktok: 97, youtube: 94, facebook: 91 }, // Đỉnh lướt video đêm
  { hour: 22, label: '22:00', tiktok: 88, youtube: 78, facebook: 80 },
  { hour: 23, label: '23:00', tiktok: 62, youtube: 48, facebook: 52 },
];

export const MiniPeakHoursAreaChart: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'peak' | '24h'>('peak'); // 'peak': 08h - 23h, '24h': 00h - 23h
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cập nhật đồng hồ mỗi giây để hiển thị thời gian chính xác
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Chu kỳ tự động cập nhật lưu lượng mỗi 10 phút (600,000 ms)
  useEffect(() => {
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const interval = setInterval(() => {
      setLastSyncTime(new Date());
    }, TEN_MINUTES_MS);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setLastSyncTime(new Date());
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Tính toán lưu lượng thời gian thực (bao gồm biến thiên tự nhiên mỗi 10 phút)
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();

  // Biến thiên nhẹ dựa vào mốc 10 phút hiện tại (deterministic micro-fluctuation)
  const tenMinuteSlot = Math.floor(currentMinute / 10);
  const dynamicFluctuation = Math.sin(tenMinuteSlot * 1.5 + currentHour) * 3;

  const dataset = useMemo(() => {
    const hoursToDisplay = viewMode === 'peak'
      ? BASE_HOURLY_DATA.filter((d) => d.hour >= 8 && d.hour <= 23)
      : BASE_HOURLY_DATA;

    return hoursToDisplay.map((d) => {
      // Áp dụng biến thiên thời gian thực nhẹ nhàng cho ngày hôm nay
      const isCurrentHour = d.hour === currentHour;
      const boost = isCurrentHour ? dynamicFluctuation : 0;
      return {
        ...d,
        tiktok: Math.min(100, Math.max(5, Math.round(d.tiktok + boost))),
        youtube: Math.min(100, Math.max(5, Math.round(d.youtube + boost * 0.8))),
        facebook: Math.min(100, Math.max(5, Math.round(d.facebook + boost * 0.9))),
      };
    });
  }, [viewMode, currentHour, dynamicFluctuation]);

  // Lưu lượng hiện tại tức thời
  const currentTraffic = useMemo(() => {
    const curr = BASE_HOURLY_DATA[currentHour];
    const next = BASE_HOURLY_DATA[(currentHour + 1) % 24];
    const progress = currentMinute / 60;
    return {
      tiktok: Math.round(curr.tiktok + (next.tiktok - curr.tiktok) * progress + dynamicFluctuation),
      youtube: Math.round(curr.youtube + (next.youtube - curr.youtube) * progress + dynamicFluctuation * 0.8),
      facebook: Math.round(curr.facebook + (next.facebook - curr.facebook) * progress + dynamicFluctuation * 0.9),
    };
  }, [currentHour, currentMinute, dynamicFluctuation]);

  // Kích thước SVG
  const svgWidth = 216;
  const svgHeight = viewMode === 'peak' ? 220 : 250;
  const yStart = 34;
  const yEnd = svgHeight - 12;
  const totalY = yEnd - yStart;
  const count = dataset.length;
  const stepY = count > 1 ? totalY / (count - 1) : totalY;

  // Cấu hình 3 cột nền tảng trên trục ngang
  const yAxisWidth = 26;
  const colWidth = (svgWidth - yAxisWidth - 6) / 3; // ~61px mỗi cột

  const platforms = [
    {
      id: 'tiktok',
      name: 'TikTok',
      color: '#121212',
      accent: '#FE2C55',
      fillGrad: 'url(#grad-tiktok)',
      strokeColor: '#000000',
      colIndex: 0,
    },
    {
      id: 'youtube',
      name: 'YouTube',
      color: '#FF0000',
      accent: '#FF0000',
      fillGrad: 'url(#grad-youtube)',
      strokeColor: '#E00000',
      colIndex: 1,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      color: '#0866FF',
      accent: '#0866FF',
      fillGrad: 'url(#grad-facebook)',
      strokeColor: '#0866FF',
      colIndex: 2,
    },
  ];

  // Hàm tạo đường cong biểu đồ miền (Area Path) cho từng nền tảng
  const createAreaPath = (key: 'tiktok' | 'youtube' | 'facebook', colIndex: number) => {
    const colLeft = yAxisWidth + colIndex * colWidth;
    const baseline = colLeft + 4;
    const maxBarWidth = colWidth - 8;

    const points = dataset.map((d, i) => {
      const y = yStart + i * stepY;
      const val = d[key];
      const x = baseline + (val / 100) * maxBarWidth;
      return { x, y };
    });

    if (points.length === 0) return '';

    // Đường miền: từ baseline -> qua các điểm cong -> xuống đáy -> quay về baseline
    let d = `M ${baseline} ${points[0].y}`;
    for (let i = 0; i < points.length; i++) {
      d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
    }
    d += ` L ${baseline} ${points[points.length - 1].y} Z`;
    return d;
  };

  // Vị trí trục quét thời gian thực Y
  const liveY = useMemo(() => {
    const minHour = dataset[0].hour;
    const maxHour = dataset[dataset.length - 1].hour;
    if (currentHour < minHour || currentHour > maxHour) return null;

    const idx = dataset.findIndex((d) => d.hour === currentHour);
    if (idx === -1) return null;
    const frac = currentMinute / 60;
    return yStart + (idx + frac) * stepY;
  }, [currentHour, currentMinute, dataset, stepY, yStart]);

  // Chuỗi định dạng thời gian thực tế
  const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  const formattedSyncTime = `${lastSyncTime.getHours().toString().padStart(2, '0')}:${lastSyncTime.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="pt-3 border-t border-black/[0.07] text-[11px] select-none space-y-2">
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-900">
            Khung Giờ Vàng (Traffic)
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Nút chuyển đổi phạm vi giờ */}
          <button
            onClick={() => setViewMode(viewMode === 'peak' ? '24h' : 'peak')}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
            title={viewMode === 'peak' ? 'Xem đầy đủ 24 giờ' : 'Xem khung giờ vàng (08:00 - 23:00)'}
          >
            {viewMode === 'peak' ? '8H-23H' : '24H'}
          </button>

          {/* Nút làm mới */}
          <button
            onClick={handleManualRefresh}
            className="p-1 rounded text-zinc-400 hover:text-zinc-800 transition cursor-pointer"
            title="Đồng bộ lưu lượng ngay (Hệ thống tự động cập nhật mỗi 10 phút)"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-zinc-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* Thông tin thời gian cụ thể & Chu kỳ 10 phút */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono px-0.5">
        <span className="text-zinc-800 font-medium font-numeric">
          {formattedTime}
        </span>
        <span className="text-zinc-400 text-[9px]">
          10p/lần • Sync: {formattedSyncTime}
        </span>
      </div>

      {/* Bảng biểu đồ miền SVG Mini */}
      <div className="relative bg-white rounded-lg border border-black/[0.08] shadow-2xs overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto block"
        >
          <defs>
            {/* Gradients cho từng miền nền tảng */}
            <linearGradient id="grad-tiktok" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#FE2C55" stopOpacity="0.45" />
            </linearGradient>

            <linearGradient id="grad-youtube" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF0000" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#FF0000" stopOpacity="0.50" />
            </linearGradient>

            <linearGradient id="grad-facebook" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0866FF" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#0866FF" stopOpacity="0.50" />
            </linearGradient>
          </defs>

          {/* CỘT TIÊU ĐỀ TRỤC NGANG: 3 NỀN TẢNG KÈM LOGO CHI TIẾT */}
          {/* 1. TikTok */}
          <g transform={`translate(${yAxisWidth + 0 * colWidth + 4}, 6)`}>
            <rect width={colWidth - 8} height="20" rx="4" fill="#F4F4F5" />
            <svg x="4" y="3.5" width="13" height="13" viewBox="0 0 24 24" fill="#000000">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.68a6.34 6.34 0 0 0 10.74 4.54 6.29 6.29 0 0 0 1.93-4.55V8.87a8.28 8.28 0 0 0 4.82 1.54V6.96a4.85 4.85 0 0 1-1-.27z"/>
            </svg>
            <text x="20" y="14" fontSize="8.5" fontWeight="600" fill="#18181B" fontFamily="monospace">
              TikTok
            </text>
          </g>

          {/* 2. YouTube */}
          <g transform={`translate(${yAxisWidth + 1 * colWidth + 4}, 6)`}>
            <rect width={colWidth - 8} height="20" rx="4" fill="#F4F4F5" />
            <svg x="4" y="3.5" width="13" height="13" viewBox="0 0 24 24" fill="#FF0000">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <text x="20" y="14" fontSize="8.5" fontWeight="600" fill="#18181B" fontFamily="monospace">
              YouTube
            </text>
          </g>

          {/* 3. Facebook */}
          <g transform={`translate(${yAxisWidth + 2 * colWidth + 4}, 6)`}>
            <rect width={colWidth - 8} height="20" rx="4" fill="#F4F4F5" />
            <svg x="4" y="3.5" width="13" height="13" viewBox="0 0 24 24" fill="#0866FF">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <text x="20" y="14" fontSize="8.5" fontWeight="600" fill="#18181B" fontFamily="monospace">
              FB
            </text>
          </g>

          {/* TRỤC DỌC Y: CÁC KHUNG GIỜ VỚI PHÂN ĐƠN VỊ 1 GIỜ */}
          {dataset.map((d, i) => {
            const y = yStart + i * stepY;
            const isGolden = d.tiktok >= 85 || d.youtube >= 85 || d.facebook >= 85;
            const isHovered = hoveredHour === d.hour;

            return (
              <g key={d.hour}>
                {/* Đường gạch phân chia đơn vị 1 giờ */}
                <line
                  x1={yAxisWidth - 2}
                  y1={y}
                  x2={svgWidth - 6}
                  y2={y}
                  stroke={isGolden ? '#FED7AA' : '#E4E4E7'}
                  strokeWidth={isGolden ? '0.9' : '0.5'}
                  strokeDasharray={isGolden ? 'none' : '1.5 2'}
                  opacity={isGolden ? 0.9 : 0.6}
                />

                {/* Nhãn khung giờ (đơn vị 1 giờ) */}
                <text
                  x={yAxisWidth - 4}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="7.5"
                  fontWeight={isGolden ? '700' : '500'}
                  fill={isGolden ? '#EA580C' : isHovered ? '#18181B' : '#A1A1AA'}
                  fontFamily="monospace"
                >
                  {d.hour.toString().padStart(2, '0')}h
                </text>
              </g>
            );
          })}

          {/* VẼ CÁC ĐƯỜNG BIỂU THỊ MIỀN (AREA CHART) CHO 3 NỀN TẢNG */}
          {platforms.map((p) => {
            const areaPath = createAreaPath(p.id as any, p.colIndex);
            const colLeft = yAxisWidth + p.colIndex * colWidth;
            const baseline = colLeft + 4;
            const maxBarWidth = colWidth - 8;

            return (
              <g key={p.id}>
                {/* Trục nền cơ sở (Baseline) */}
                <line
                  x1={baseline}
                  y1={yStart}
                  x2={baseline}
                  y2={yEnd}
                  stroke="#E4E4E7"
                  strokeWidth="0.8"
                />

                {/* Miền biểu thị lưu lượng */}
                <path
                  d={areaPath}
                  fill={p.fillGrad}
                  stroke={p.strokeColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />

                {/* Các điểm mốc giờ vàng (>85%) */}
                {dataset.map((d, i) => {
                  const val = d[p.id as keyof HourlyData] as number;
                  if (val < 85) return null;
                  const y = yStart + i * stepY;
                  const x = baseline + (val / 100) * maxBarWidth;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="1.8"
                      fill={p.color}
                      stroke="#FFFFFF"
                      strokeWidth="0.6"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* ĐƯỜNG QUÉT THỜI GIAN THỰC TẾ (REAL-TIME LIVE INDICATOR) */}
          {liveY !== null && (
            <g>
              {/* Vạch quét ngang emerald */}
              <line
                x1={yAxisWidth - 4}
                y1={liveY}
                x2={svgWidth - 6}
                y2={liveY}
                stroke="#10B981"
                strokeWidth="1.2"
                strokeDasharray="2 1.5"
              />
              {/* Điểm quét nhấp nháy */}
              <circle
                cx={yAxisWidth - 4}
                cy={liveY}
                r="2.5"
                fill="#10B981"
              />
              <circle
                cx={svgWidth - 6}
                cy={liveY}
                r="2"
                fill="#10B981"
              />
            </g>
          )}

          {/* VÙNG TƯƠNG TÁC CHUỘT THEO TỪNG GIỜ */}
          {dataset.map((d, i) => {
            const y = yStart + i * stepY;
            const h = stepY;
            return (
              <rect
                key={d.hour}
                x={0}
                y={y - h / 2}
                width={svgWidth}
                height={h}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredHour(d.hour)}
                onMouseLeave={() => setHoveredHour(null)}
              />
            );
          })}
        </svg>

        {/* POPOVER TOOLTIP KHI HOVER VÀO TỪNG KHUNG GIỜ */}
        {hoveredHour !== null && (() => {
          const hoveredData = dataset.find((d) => d.hour === hoveredHour);
          if (!hoveredData) return null;
          return (
            <div className="absolute bottom-1 left-1 right-1 bg-zinc-950/95 backdrop-blur-md text-white p-2 rounded text-[10px] shadow-lg border border-white/10 z-10 animate-fade-in font-mono">
              <div className="flex items-center justify-between border-b border-white/15 pb-1 mb-1">
                <span className="font-bold text-amber-400">
                  {hoveredData.label} — {hoveredData.hour + 1}:00
                </span>
                <span className="text-[9px] text-zinc-400">
                  {hoveredData.tiktok >= 85 || hoveredData.youtube >= 85 ? '⭐ Khung Giờ Vàng' : 'Giờ Tiêu Chuẩn'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[9px] text-center">
                <div>
                  <span className="text-zinc-400 block">TikTok</span>
                  <strong className={hoveredData.tiktok >= 85 ? 'text-rose-400' : 'text-zinc-200'}>
                    {hoveredData.tiktok}%
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-400 block">YouTube</span>
                  <strong className={hoveredData.youtube >= 85 ? 'text-red-400' : 'text-zinc-200'}>
                    {hoveredData.youtube}%
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-400 block">Facebook</span>
                  <strong className={hoveredData.facebook >= 85 ? 'text-blue-400' : 'text-zinc-200'}>
                    {hoveredData.facebook}%
                  </strong>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* TỔNG KẾT LƯU LƯỢNG THỰC TẾ HIỆN TẠI (LIVE TELEMETRY) */}
      <div className="p-2 rounded-lg bg-zinc-50 border border-black/[0.06] space-y-1.5 font-mono text-[10px]">
        <div className="flex items-center justify-between text-zinc-600">
          <span className="flex items-center gap-1 font-sans font-medium text-zinc-900 text-[10px]">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            Lưu lượng hiện tại:
          </span>
          <span className="text-[9px] text-zinc-400">
            {currentHour}:00 — {currentHour + 1}:00
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 pt-0.5 text-center">
          <div className="p-1 rounded bg-white border border-black/5">
            <span className="text-[9px] text-zinc-400 block">TikTok</span>
            <span className={`text-[10px] font-bold ${currentTraffic.tiktok >= 85 ? 'text-rose-600' : 'text-zinc-800'}`}>
              {currentTraffic.tiktok}%
            </span>
          </div>

          <div className="p-1 rounded bg-white border border-black/5">
            <span className="text-[9px] text-zinc-400 block">YouTube</span>
            <span className={`text-[10px] font-bold ${currentTraffic.youtube >= 85 ? 'text-red-600' : 'text-zinc-800'}`}>
              {currentTraffic.youtube}%
            </span>
          </div>

          <div className="p-1 rounded bg-white border border-black/5">
            <span className="text-[9px] text-zinc-400 block">Meta FB</span>
            <span className={`text-[10px] font-bold ${currentTraffic.facebook >= 85 ? 'text-blue-600' : 'text-zinc-800'}`}>
              {currentTraffic.facebook}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
