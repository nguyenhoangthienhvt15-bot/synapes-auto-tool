import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Radio, Server, Activity, ShieldCheck, Sparkles, ChevronRight, X, ExternalLink } from 'lucide-react';
import { getRealtimeTelemetry, SystemTelemetryState } from '../services/realtimeTelemetryService';

// Thuật toán làm mịn đường cong Bézier bậc 3 theo trục dọc (Vertical Cubic Bézier Spline)
function getSmoothVerticalAreaPath(
  points: { x: number; y: number }[],
  baselineX: number,
  smoothing: number = 0.22
): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${baselineX} ${points[0].y} L ${points[0].x} ${points[0].y} Z`;

  let path = `M ${baselineX} ${points[0].y.toFixed(1)} L ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const prevPrev = points[i - 2] || prev;
    const next = points[i + 1] || curr;

    const dy = curr.y - prev.y;
    const slopePrev = (curr.x - prevPrev.x) / ((curr.y - prevPrev.y) || 1);
    const slopeCurr = (next.x - prev.x) / ((next.y - prev.y) || 1);

    const cp1x = prev.x + slopePrev * (dy * smoothing);
    const cp1y = prev.y + dy * 0.36;

    const cp2x = curr.x - slopeCurr * (dy * smoothing);
    const cp2y = curr.y - dy * 0.36;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }

  const last = points[points.length - 1];
  const first = points[0];
  path += ` L ${baselineX} ${last.y.toFixed(1)} L ${baselineX} ${first.y.toFixed(1)} Z`;
  return path;
}

function getSmoothVerticalStrokePath(
  points: { x: number; y: number }[],
  smoothing: number = 0.22
): string {
  if (points.length === 0) return '';
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const prevPrev = points[i - 2] || prev;
    const next = points[i + 1] || curr;

    const dy = curr.y - prev.y;
    const slopePrev = (curr.x - prevPrev.x) / ((curr.y - prevPrev.y) || 1);
    const slopeCurr = (next.x - prev.x) / ((next.y - prev.y) || 1);

    const cp1x = prev.x + slopePrev * (dy * smoothing);
    const cp1y = prev.y + dy * 0.36;

    const cp2x = curr.x - slopeCurr * (dy * smoothing);
    const cp2y = curr.y - dy * 0.36;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  return path;
}

export const MiniPeakHoursAreaChart: React.FC = () => {
  const [telemetry, setTelemetry] = useState<SystemTelemetryState>(getRealtimeTelemetry);
  const [now, setNow] = useState(new Date());
  const [viewMode, setViewMode] = useState<'peak' | '24h'>('peak');
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Cập nhật đồng hồ mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Chu kỳ tự động đồng bộ Telemetry mỗi 10 phút (600,000 ms)
  useEffect(() => {
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const interval = setInterval(() => {
      setTelemetry(getRealtimeTelemetry());
    }, TEN_MINUTES_MS);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setTelemetry(getRealtimeTelemetry());
      setIsSyncing(false);
    }, 500);
  };

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Danh sách mốc giờ hiển thị
  const displayPoints = useMemo(() => {
    return viewMode === 'peak'
      ? telemetry.hourlyPoints.filter((p) => p.hour >= 8 && p.hour <= 23)
      : telemetry.hourlyPoints;
  }, [telemetry, viewMode]);

  // Kích thước biểu đồ SVG
  const svgWidth = 222;
  const svgHeight = viewMode === 'peak' ? 228 : 260;
  const yStart = 36;
  const yEnd = svgHeight - 12;
  const totalY = yEnd - yStart;
  const count = displayPoints.length;
  const stepY = count > 1 ? totalY / (count - 1) : totalY;

  // Cấu hình 3 cột nền tảng
  const yAxisWidth = 28;
  const colWidth = (svgWidth - yAxisWidth - 6) / 3; // ~62px

  const platforms = [
    {
      id: 'tiktok' as const,
      name: 'TikTok',
      color: '#121212',
      accentColor: '#FE2C55',
      gradId: 'grad-smooth-tiktok',
      strokeColor: '#FE2C55',
      colIndex: 0,
      ccu: telemetry.platforms.tiktok.activeCcuEstimate,
      pct: telemetry.platforms.tiktok.bandwidthLoadPct,
    },
    {
      id: 'youtube' as const,
      name: 'YouTube',
      color: '#FF0000',
      accentColor: '#FF0000',
      gradId: 'grad-smooth-youtube',
      strokeColor: '#FF0000',
      colIndex: 1,
      ccu: telemetry.platforms.youtube.activeCcuEstimate,
      pct: telemetry.platforms.youtube.bandwidthLoadPct,
    },
    {
      id: 'facebook' as const,
      name: 'Meta FB',
      color: '#0866FF',
      accentColor: '#0866FF',
      gradId: 'grad-smooth-facebook',
      strokeColor: '#0866FF',
      colIndex: 2,
      ccu: telemetry.platforms.facebook.activeCcuEstimate,
      pct: telemetry.platforms.facebook.bandwidthLoadPct,
    },
  ];

  // Tính toán đường cong mượt mà cho từng nền tảng
  const paths = useMemo(() => {
    return platforms.map((p) => {
      const colLeft = yAxisWidth + p.colIndex * colWidth;
      const baseline = colLeft + 4;
      const maxBarWidth = colWidth - 8;

      const points = displayPoints.map((d, i) => {
        const y = yStart + i * stepY;
        const val = d[p.id];
        const x = baseline + (val / 100) * maxBarWidth;
        return { x, y };
      });

      return {
        id: p.id,
        area: getSmoothVerticalAreaPath(points, baseline, 0.22),
        stroke: getSmoothVerticalStrokePath(points, 0.22),
        points,
        baseline,
      };
    });
  }, [displayPoints, colWidth, stepY, yAxisWidth, yStart]);

  // Vị trí trục quét thời gian thực (Laser Scanline)
  const liveY = useMemo(() => {
    const minH = displayPoints[0].hour;
    const maxH = displayPoints[displayPoints.length - 1].hour;
    if (currentHour < minH || currentHour > maxH) return null;

    const idx = displayPoints.findIndex((d) => d.hour === currentHour);
    if (idx === -1) return null;
    const fraction = currentMinute / 60;
    return yStart + (idx + fraction) * stepY;
  }, [currentHour, currentMinute, displayPoints, stepY, yStart]);

  // Thời gian đếm ngược đến lần sync kế tiếp
  const countdownMinutes = Math.floor(telemetry.nextSyncCountdownSec / 60);
  const countdownSeconds = telemetry.nextSyncCountdownSec % 60;
  const countdownStr = `${countdownMinutes}:${countdownSeconds.toString().padStart(2, '0')}`;
  const syncTimeStr = `${telemetry.lastUpdated.getHours().toString().padStart(2, '0')}:${telemetry.lastUpdated.getMinutes().toString().padStart(2, '0')}`;
  const liveClockStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  return (
    <div className="pt-2 border-t border-black/[0.08] text-[11px] select-none space-y-2">
      {/* HEADER: TELEMETRY STREAM STATUS */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono font-bold tracking-tight text-zinc-900 uppercase">
            Audience Telemetry
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Nút kiểm tra MCP Inspector */}
          <button
            onClick={() => setShowInspectorModal(true)}
            className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
            title="Mở bảng kiểm chứng kỹ thuật MCP Server & Telemetry Engine"
          >
            <Server className="w-3 h-3" />
          </button>

          {/* Toggle 8H-23H vs 24H */}
          <button
            onClick={() => setViewMode(viewMode === 'peak' ? '24h' : 'peak')}
            className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
            title={viewMode === 'peak' ? 'Chuyển sang xem 24 giờ' : 'Chuyển sang khung giờ vàng (08:00 - 23:00)'}
          >
            {viewMode === 'peak' ? '8H–23H' : '24H'}
          </button>

          {/* Nút refresh tức thì */}
          <button
            onClick={handleManualSync}
            className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
            title="Đồng bộ lại tức thì"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-zinc-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* THÔNG TIN MỐC THỜI GIAN CỤ THỂ & NHỊP 10 PHÚT */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono px-0.5">
        <span className="text-zinc-900 font-bold font-numeric flex items-center gap-1">
          <Activity className="w-3 h-3 text-emerald-600" />
          {liveClockStr}
        </span>
        <span className="text-zinc-400 text-[9px]">
          Sync: {syncTimeStr} • {countdownStr}
        </span>
      </div>

      {/* KHUNG BIỂU ĐỒ MIỀN SVG CHUẨN CUBIC BÉZIER */}
      <div className="relative bg-white rounded-lg border border-black/[0.08] shadow-2xs overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto block"
        >
          <defs>
            {/* Gradients chuyên nghiệp, mượt mà và sâu lắng */}
            <linearGradient id="grad-smooth-tiktok" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#121212" stopOpacity="0.08" />
              <stop offset="60%" stopColor="#FE2C55" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#FE2C55" stopOpacity="0.55" />
            </linearGradient>

            <linearGradient id="grad-smooth-youtube" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF0000" stopOpacity="0.08" />
              <stop offset="60%" stopColor="#FF0000" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#FF0000" stopOpacity="0.60" />
            </linearGradient>

            <linearGradient id="grad-smooth-facebook" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0866FF" stopOpacity="0.08" />
              <stop offset="60%" stopColor="#0866FF" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#0866FF" stopOpacity="0.58" />
            </linearGradient>

            {/* Dải highlight giờ vàng */}
            <linearGradient id="golden-noon-highlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF9500" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#FF9500" stopOpacity="0.14" />
            </linearGradient>

            <linearGradient id="golden-evening-highlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF9500" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FF9500" stopOpacity="0.18" />
            </linearGradient>
          </defs>

          {/* DẢI HIGHLIGHT CÁC KHUNG GIỜ VÀNG TRÊN NỀN BIỂU ĐỒ */}
          {displayPoints.map((d, i) => {
            if (!d.isGoldenHour) return null;
            const y = yStart + i * stepY;
            const h = stepY;
            return (
              <rect
                key={`gold-${d.hour}`}
                x={yAxisWidth - 2}
                y={y - h / 2}
                width={svgWidth - yAxisWidth}
                height={h}
                fill={d.goldenHourType === 'noon_peak' ? 'url(#golden-noon-highlight)' : 'url(#golden-evening-highlight)'}
              />
            );
          })}

          {/* CỘT TIÊU ĐỀ TRỤC NGANG: 3 NỀN TẢNG KÈM LOGO CHI TIẾT */}
          {/* 1. TikTok */}
          <g transform={`translate(${yAxisWidth + 0 * colWidth + 2}, 6)`}>
            <rect width={colWidth - 4} height="22" rx="4" fill="#F4F4F5" />
            <svg x="4" y="4.5" width="13" height="13" viewBox="0 0 24 24" fill="#000000">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.68a6.34 6.34 0 0 0 10.74 4.54 6.29 6.29 0 0 0 1.93-4.55V8.87a8.28 8.28 0 0 0 4.82 1.54V6.96a4.85 4.85 0 0 1-1-.27z"/>
            </svg>
            <text x="19" y="14.5" fontSize="8.5" fontWeight="700" fill="#18181B" fontFamily="monospace">
              TikTok
            </text>
          </g>

          {/* 2. YouTube */}
          <g transform={`translate(${yAxisWidth + 1 * colWidth + 2}, 6)`}>
            <rect width={colWidth - 4} height="22" rx="4" fill="#F4F4F5" />
            <svg x="4" y="4.5" width="13" height="13" viewBox="0 0 24 24" fill="#FF0000">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <text x="19" y="14.5" fontSize="8.5" fontWeight="700" fill="#18181B" fontFamily="monospace">
              YouTube
            </text>
          </g>

          {/* 3. Facebook */}
          <g transform={`translate(${yAxisWidth + 2 * colWidth + 2}, 6)`}>
            <rect width={colWidth - 4} height="22" rx="4" fill="#F4F4F5" />
            <svg x="4" y="4.5" width="13" height="13" viewBox="0 0 24 24" fill="#0866FF">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <text x="19" y="14.5" fontSize="8.5" fontWeight="700" fill="#18181B" fontFamily="monospace">
              Meta FB
            </text>
          </g>

          {/* TRỤC DỌC Y: CÁC KHUNG GIỜ VỚI PHÂN ĐƠN VỊ 1 GIỜ CHUẨN MỰC */}
          {displayPoints.map((d, i) => {
            const y = yStart + i * stepY;
            const isGolden = d.isGoldenHour;
            const isHovered = hoveredHour === d.hour;

            return (
              <g key={d.hour}>
                {/* Đường gạch phân chia đơn vị 1 giờ */}
                <line
                  x1={yAxisWidth - 2}
                  y1={y}
                  x2={svgWidth - 6}
                  y2={y}
                  stroke={isGolden ? '#FDBA74' : '#E4E4E7'}
                  strokeWidth={isGolden ? '0.8' : '0.45'}
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
                  fill={isGolden ? '#C2410C' : isHovered ? '#18181B' : '#71717A'}
                  fontFamily="monospace"
                >
                  {d.hour.toString().padStart(2, '0')}h
                </text>
              </g>
            );
          })}

          {/* VẼ ĐƯỜNG BIỂU THỊ MIỀN CUBIC BÉZIER MƯỢT MÀ */}
          {paths.map((p, idx) => {
            const platformConfig = platforms[idx];
            return (
              <g key={p.id}>
                {/* Trục nền cơ sở (Baseline) */}
                <line
                  x1={p.baseline}
                  y1={yStart}
                  x2={p.baseline}
                  y2={yEnd}
                  stroke="#E4E4E7"
                  strokeWidth="0.8"
                />

                {/* Miền diện tích đã được làm mịn bằng cubic Bézier */}
                <path
                  d={p.area}
                  fill={`url(#${platformConfig.gradId})`}
                  opacity="0.95"
                />

                {/* Đường nét cong viền ngoài mượt mà */}
                <path
                  d={p.stroke}
                  fill="none"
                  stroke={platformConfig.strokeColor}
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Các điểm neo mốc giờ vàng */}
                {p.points.map((pt, pIdx) => {
                  const dataPoint = displayPoints[pIdx];
                  if (!dataPoint.isGoldenHour) return null;
                  return (
                    <circle
                      key={`pt-${p.id}-${pIdx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r="1.8"
                      fill={platformConfig.strokeColor}
                      stroke="#FFFFFF"
                      strokeWidth="0.75"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* VẠCH QUÉT LASER THỜI GIAN THỰC (REAL-TIME SCANLINE) */}
          {liveY !== null && (
            <g>
              <line
                x1={yAxisWidth - 4}
                y1={liveY}
                x2={svgWidth - 6}
                y2={liveY}
                stroke="#10B981"
                strokeWidth="1.2"
                strokeDasharray="2 1.5"
              />
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

          {/* VÙNG TƯƠNG TÁC CHUỘT CHO TỪNG GIỜ */}
          {displayPoints.map((d, i) => {
            const y = yStart + i * stepY;
            const h = stepY;
            return (
              <rect
                key={`hit-${d.hour}`}
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

        {/* POPOVER TOOLTIP KHI HOVER VÀO KHUNG GIỜ */}
        {hoveredHour !== null && (() => {
          const hoveredData = displayPoints.find((d) => d.hour === hoveredHour);
          if (!hoveredData) return null;
          return (
            <div className="absolute bottom-1 left-1 right-1 bg-zinc-950/95 backdrop-blur-md text-white p-2 rounded text-[10px] shadow-lg border border-white/10 z-10 animate-fade-in font-mono">
              <div className="flex items-center justify-between border-b border-white/15 pb-1 mb-1">
                <span className="font-bold text-amber-400">
                  {hoveredData.label} — {hoveredData.hour + 1}:00
                </span>
                <span className="text-[9px] text-zinc-300">
                  {hoveredData.isGoldenHour ? '⭐ Khung Giờ Vàng Đỉnh' : 'Giờ Thường Lệ'}
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
                  <span className="text-zinc-400 block">Meta FB</span>
                  <strong className={hoveredData.facebook >= 85 ? 'text-blue-400' : 'text-zinc-200'}>
                    {hoveredData.facebook}%
                  </strong>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* BẢNG LIVE TELEMETRY VÀ CHỈ SỐ CCU TRỰC TIẾP */}
      <div className="p-2 rounded-lg bg-zinc-50 border border-black/[0.06] space-y-1.5 font-mono text-[10px]">
        <div className="flex items-center justify-between text-zinc-600">
          <span className="flex items-center gap-1 font-sans font-medium text-zinc-900 text-[10px]">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            Lưu lượng thời gian thực:
          </span>
          <span className="text-[9px] text-zinc-400">
            {currentHour}:00 — {currentHour + 1}:00
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 pt-0.5 text-center">
          {platforms.map((p) => (
            <div key={p.id} className="p-1 rounded bg-white border border-black/5">
              <span className="text-[9px] text-zinc-400 block font-sans">{p.name}</span>
              <div className="text-[10px] font-bold text-zinc-900 font-numeric">
                {p.pct}%
              </div>
              <div className="text-[8.5px] text-zinc-400 font-numeric">
                {p.ccu}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* POPUP MCP SERVER & TELEMETRY ENGINE INSPECTOR */}
      {showInspectorModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-black/10 max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-zinc-900 font-semibold text-xs uppercase tracking-wider font-mono">
                    Model Context Protocol (MCP) Telemetry Engine
                  </h3>
                  <p className="text-zinc-500 text-xs">Hệ thống thu thập dữ liệu thời gian thực đa nền tảng</p>
                </div>
              </div>
              <button
                onClick={() => setShowInspectorModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 bg-zinc-50 border border-black/5 rounded-lg space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">MCP Server ID:</span>
                  <span className="text-zinc-900 font-bold">{telemetry.mcpServerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Giao thức & Phiên bản:</span>
                  <span className="text-zinc-900">{telemetry.mcpServerVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nguồn thu thập:</span>
                  <span className="text-zinc-900 text-[10px]">{telemetry.dataSource}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Độ trễ API (Latency):</span>
                  <span className="text-emerald-700 font-bold">{telemetry.latencyMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Mẫu quan trắc (Sample Nodes):</span>
                  <span className="text-zinc-900">{telemetry.sampleNodeCount.toLocaleString('vi-VN')} sessions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Độ tin cậy thuật toán:</span>
                  <span className="text-zinc-900 font-bold">{telemetry.confidenceScore}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-zinc-900 block font-mono text-[11px] uppercase">
                  Khuyến nghị thời điểm xuất bản (Best Time To Post):
                </span>
                <div className="space-y-1.5">
                  <div className="p-2.5 rounded bg-zinc-50 border border-black/5">
                    <strong className="text-zinc-900 block">TikTok Short-Form Engine:</strong>
                    <span className="text-zinc-600 text-[11px]">
                      Khung giờ vàng: <span className="font-mono font-bold text-rose-600">{telemetry.platforms.tiktok.bestPostingWindow}</span>.
                      Tốc độ tăng trưởng: {telemetry.platforms.tiktok.trendVelocity}. Độ tuổi chủ lực: {telemetry.platforms.tiktok.primaryAudienceAge}.
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-zinc-50 border border-black/5">
                    <strong className="text-zinc-900 block">YouTube Data API v3 (Long-Form 5–10 Phút):</strong>
                    <span className="text-zinc-600 text-[11px]">
                      Khung giờ vàng: <span className="font-mono font-bold text-red-600">{telemetry.platforms.youtube.bestPostingWindow}</span>.
                      Tốc độ tăng trưởng: {telemetry.platforms.youtube.trendVelocity}. Độ tuổi chủ lực: {telemetry.platforms.youtube.primaryAudienceAge}.
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-zinc-50 border border-black/5">
                    <strong className="text-zinc-900 block">Meta Graph API (Facebook Reels):</strong>
                    <span className="text-zinc-600 text-[11px]">
                      Khung giờ vàng: <span className="font-mono font-bold text-blue-600">{telemetry.platforms.facebook.bestPostingWindow}</span>.
                      Tốc độ tăng trưởng: {telemetry.platforms.facebook.trendVelocity}.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowInspectorModal(false)}
                  className="btn-primary"
                >
                  Đóng Bảng Kiểm Chứng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
