import React, { useEffect, useMemo, useState } from 'react';
import { Project, ConnectedChannelAccount } from '../types';
import { getAuthHeaders } from '../services/userProfileService';

export interface TrafficTimePoint {
  slot: string;
  hour?: number;
  tiktok: number;
  facebook: number;
  youtube: number;
  total: number;
  isCurrentHour?: boolean;
}

export interface PlatformTrafficResponse {
  success: boolean;
  updatedAt: string;
  eventCount: number;
  unit?: string;
  geo?: {
    countryCode: string;
    countryName: string;
    timezone: string;
    currentHour: number;
    dateStr?: string;
    timeStr?: string;
  };
  series: TrafficTimePoint[];
  totals: {
    tiktok: number;
    facebook: number;
    youtube: number;
    all: number;
  };
  activeVideos: {
    tiktok: number;
    facebook: number;
    youtube: number;
  };
  engagementRate: {
    tiktok: number;
    facebook: number;
    youtube: number;
  };
  peakWindow: string;
  peakTraffic: number;
}

interface MiniPeakHoursAreaChartProps {
  userCode?: string;
  projects?: Project[];
  channels?: ConnectedChannelAccount[];
}

type PlatformKey = 'all' | 'tiktok' | 'facebook' | 'youtube';

const TiktokLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-label="TikTok">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.32a6.34 6.34 0 0 0-.85-.06A6.34 6.34 0 0 0 3.14 15.6a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.86-4.49V8.52a8.27 8.27 0 0 0 4.88 1.62V6.69z" />
  </svg>
);

const FacebookLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#1D4ED8" aria-label="Facebook">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const YoutubeLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#DC2626" aria-label="YouTube">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const DEFAULT_SLOTS = Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, '0')}:00`);

function computeLocalTrafficSnapshot(
  projects: Project[] = [],
  channels: ConnectedChannelAccount[] = []
): PlatformTrafficResponse {
  const ttConn = channels.some((c) => c.platform === 'tiktok' && c.status === 'connected');
  const fbConn = channels.some((c) => c.platform === 'facebook' && c.status === 'connected');
  const ytConn = channels.some((c) => c.platform === 'youtube' && c.status === 'connected');

  const ttCount = ttConn ? projects.filter((p) => (p.targetChannels || []).includes('tiktok')).length : 0;
  const fbCount = fbConn ? projects.filter((p) => (p.targetChannels || []).includes('facebook')).length : 0;
  const ytCount = ytConn ? projects.filter((p) => (p.targetChannels || []).includes('youtube')).length : 0;

  const curHour = new Date().getHours();
  const ytStatsViewCount = ytConn ? Math.max(0, Number((channels.find((c) => c.platform === 'youtube') as any)?.stats?.viewCount || 0)) : 0;

  // Trung thực tuyệt đối (FAKE-04): Chỉ hiển thị số liệu thật (YouTube stats API hoặc sự kiện đã ghi nhận), 0 khi chưa có.
  const series: TrafficTimePoint[] = DEFAULT_SLOTS.map((slot, h) => {
    const youtube = h === curHour && ytStatsViewCount > 0 ? ytStatsViewCount : 0;
    return {
      slot,
      hour: h,
      tiktok: 0,
      facebook: 0,
      youtube,
      total: youtube,
      isCurrentHour: h === curHour,
    };
  });

  const totals = {
    tiktok: 0,
    facebook: 0,
    youtube: series.reduce((acc, s) => acc + s.youtube, 0),
    all: series.reduce((acc, s) => acc + s.total, 0),
  };
  const peak = totals.all > 0 ? ([...series].sort((a, b) => b.total - a.total)[0] || series[curHour]) : series[curHour];

  return {
    success: true,
    updatedAt: new Date().toISOString(),
    eventCount: 0,
    unit: '1h',
    geo: {
      countryCode: 'VN',
      countryName: 'Việt Nam',
      timezone: 'Asia/Ho_Chi_Minh',
      currentHour: curHour,
    },
    series,
    totals,
    activeVideos: { tiktok: ttCount, facebook: fbCount, youtube: ytCount },
    engagementRate: {
      tiktok: 0,
      facebook: 0,
      youtube: 0,
    },
    peakWindow: totals.all > 0 ? peak.slot : '--:--',
    peakTraffic: totals.all > 0 ? peak.total : 0,
  };
}

function formatCompactNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

/**
 * Biểu đồ Lưu Lượng Truy Cập Thực Tế Đa Nền Tảng (TikTok, Facebook, YouTube).
 * Đồng bộ trực tiếp với API `/api/analytics/platform-traffic`, số lượng dự án video
 * và trạng thái kênh đang hoạt động của người dùng.
 */
export const MiniPeakHoursAreaChart: React.FC<MiniPeakHoursAreaChartProps> = ({
  userCode = '',
  projects = [],
  channels = [],
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey>('all');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [traffic, setTraffic] = useState<PlatformTrafficResponse>(() =>
    computeLocalTrafficSnapshot(projects, channels)
  );

  const projectCountByPlatform = useMemo(
    () => ({
      tt: projects.filter((p) => (p.targetChannels || []).includes('tiktok')).length,
      fb: projects.filter((p) => (p.targetChannels || []).includes('facebook')).length,
      yt: projects.filter((p) => (p.targetChannels || []).includes('youtube')).length,
    }),
    [projects]
  );

  const connectedCount = useMemo(
    () => channels.filter((c) => c.status === 'connected' && ['youtube', 'tiktok', 'facebook'].includes(c.platform)).length,
    [channels]
  );

  useEffect(() => {
    let cancelled = false;
    const localFallback = computeLocalTrafficSnapshot(projects, channels);
    setTraffic(localFallback);

    const fetchTraffic = () => {
      const authHeaders = userCode ? getAuthHeaders(userCode) : {};
      if (!userCode) return;
      const url = `/api/analytics/platform-traffic?userCode=${encodeURIComponent(userCode)}&tt=${projectCountByPlatform.tt}&fb=${projectCountByPlatform.fb}&yt=${projectCountByPlatform.yt}&connected=${connectedCount}`;
      fetch(url, { credentials: 'include', headers: authHeaders })
        .then((r) => (r.ok ? r.json() : null))
        .then((json: PlatformTrafficResponse | null) => {
          if (!cancelled && json && json.success && Array.isArray(json.series) && json.series.length > 0) {
            setTraffic(json);
          }
        })
        .catch(() => {
          // Keep computed workspace snapshot if offline
        });
    };

    fetchTraffic();
    // Khi người dùng kết nối kênh cá nhân (YouTube/TikTok/Facebook), quét cập nhật định kỳ 180 phút/lần
    const scanTimer = connectedCount > 0 ? window.setInterval(fetchTraffic, 180 * 60 * 1000) : null;

    return () => {
      cancelled = true;
      if (scanTimer !== null) window.clearInterval(scanTimer);
    };
  }, [userCode, projectCountByPlatform, projects, channels, connectedCount]);

  const width = 248;
  const height = 108;
  const padLeft = 28;
  const padRight = 10;
  const padTop = 10;
  const padBottom = 18;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const series = traffic.series;
  const maxVal = useMemo(() => {
    let m = 0;
    for (const pt of series) {
      const candidate =
        selectedPlatform === 'all'
          ? Math.max(pt.tiktok, pt.facebook, pt.youtube)
          : pt[selectedPlatform];
      if (candidate > m) m = candidate;
    }
    if (m <= 0) return 0;
    if (m < 10) return Math.ceil(m * 1.2);
    return Math.ceil((m * 1.15) / 10) * 10;
  }, [series, selectedPlatform]);

  const getX = (idx: number) =>
    padLeft + (idx / Math.max(1, series.length - 1)) * plotW;
  const getY = (val: number) =>
    maxVal <= 0
      ? padTop + plotH
      : padTop + plotH - (Math.max(0, Math.min(maxVal, val)) / maxVal) * plotH;

  const buildPolyline = (key: 'tiktok' | 'facebook' | 'youtube') =>
    series.map((pt, i) => `${getX(i).toFixed(1)},${getY(pt[key]).toFixed(1)}`).join(' ');

  const buildAreaPath = (key: 'tiktok' | 'facebook' | 'youtube') => {
    if (series.length === 0) return '';
    const linePts = series.map((pt, i) => `${getX(i).toFixed(1)},${getY(pt[key]).toFixed(1)}`).join(' L ');
    const baseRight = `${getX(series.length - 1).toFixed(1)},${(padTop + plotH).toFixed(1)}`;
    const baseLeft = `${getX(0).toFixed(1)},${(padTop + plotH).toFixed(1)}`;
    return `M ${linePts} L ${baseRight} L ${baseLeft} Z`;
  };

  const activePoint =
    hoveredIdx !== null
      ? series[hoveredIdx]
      : series.find((s) => s.isCurrentHour) || series[traffic.geo?.currentHour ?? 20] || series[series.length - 1];
  const yTicks = maxVal <= 0 ? [0] : [0, Math.round(maxVal * 0.5), maxVal];

  const showTiktok = selectedPlatform === 'all' || selectedPlatform === 'tiktok';
  const showFacebook = selectedPlatform === 'all' || selectedPlatform === 'facebook';
  const showYoutube = selectedPlatform === 'all' || selectedPlatform === 'youtube';

  return (
    <div
      className="rounded-xl border border-black/[0.08] bg-white p-2.5 shadow-2xs select-none space-y-2"
      data-testid="platform-traffic-chart-widget"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connectedCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
          <span className="text-[10.5px] font-bold text-[#141413] tracking-tight truncate">
            {connectedCount > 0
              ? `${traffic.geo?.countryName || 'Việt Nam'} • Quét kênh mỗi 180p`
              : 'Chưa kết nối kênh (0 lượt xem)'}
          </span>
        </div>
        <span className="text-[9px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded flex-shrink-0">
          {connectedCount > 0 ? `Peak ${traffic.peakWindow}` : '180p / lần'}
        </span>
      </div>

      {/* Platform Switcher Pills with Official Platform Brand Logos */}
      <div className="grid grid-cols-4 gap-1 bg-[#F4F1EA] p-0.5 rounded-lg border border-black/[0.06] text-[9.5px] font-semibold">
        {[
          { key: 'all' as PlatformKey, title: 'Tất cả 3 nền tảng' },
          { key: 'tiktok' as PlatformKey, title: 'TikTok' },
          { key: 'facebook' as PlatformKey, title: 'Facebook' },
          { key: 'youtube' as PlatformKey, title: 'YouTube' },
        ].map((tab) => {
          const active = selectedPlatform === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedPlatform(tab.key)}
              title={tab.title}
              aria-label={tab.title}
              data-testid={`traffic-tab-${tab.key}`}
              className={`py-1 rounded-md transition cursor-pointer flex items-center justify-center ${
                active
                  ? 'bg-white text-[#141413] shadow-2xs font-bold ring-1 ring-black/5'
                  : 'text-zinc-500 hover:text-zinc-900 opacity-75 hover:opacity-100'
              }`}
            >
              {tab.key === 'all' && <span className="text-[9px]">24h</span>}
              {tab.key === 'tiktok' && <TiktokLogoIcon className="w-3.5 h-3.5 text-[#141413]" />}
              {tab.key === 'facebook' && <FacebookLogoIcon className="w-3.5 h-3.5" />}
              {tab.key === 'youtube' && <YoutubeLogoIcon className="w-3.5 h-3.5" />}
            </button>
          );
        })}
      </div>

      {/* Multi-Platform Area SVG Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label="Biểu đồ lưu lượng truy cập thực tế TikTok, Facebook và YouTube"
        >
          <defs>
            <linearGradient id="tt-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#141413" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#141413" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="fb-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="yt-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y Labels */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={tick === 0 ? '#A1A1AA' : '#ECE9E1'}
                  strokeWidth={tick === 0 ? 1 : 0.75}
                />
                <text
                  x={padLeft - 4}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8"
                  fill="#71717A"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {formatCompactNumber(tick)}
                </text>
              </g>
            );
          })}

          {/* Platform Area Fills */}
          {showFacebook && <path d={buildAreaPath('facebook')} fill="url(#fb-grad)" />}
          {showYoutube && <path d={buildAreaPath('youtube')} fill="url(#yt-grad)" />}
          {showTiktok && <path d={buildAreaPath('tiktok')} fill="url(#tt-grad)" />}

          {/* Platform Trend Lines */}
          {showFacebook && (
            <polyline
              fill="none"
              stroke="#1D4ED8"
              strokeWidth={1.7}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={buildPolyline('facebook')}
            />
          )}
          {showYoutube && (
            <polyline
              fill="none"
              stroke="#DC2626"
              strokeWidth={1.75}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={buildPolyline('youtube')}
            />
          )}
          {showTiktok && (
            <polyline
              fill="none"
              stroke="#141413"
              strokeWidth={1.85}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={buildPolyline('tiktok')}
            />
          )}

          {/* Interactive Hover Guide & Vertex Dots */}
          {series.map((pt, idx) => {
            const cx = getX(idx);
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={pt.slot}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect x={cx - 4.5} y={padTop} width={9} height={plotH + 16} fill="transparent" />
                {(isHovered || pt.isCurrentHour) && (
                  <line
                    x1={cx}
                    y1={padTop}
                    x2={cx}
                    y2={padTop + plotH}
                    stroke={pt.isCurrentHour && !isHovered ? '#10B981' : '#141413'}
                    strokeDasharray="2 2"
                    strokeWidth={0.9}
                    opacity={0.55}
                  />
                )}
                {showFacebook && (
                  <circle
                    cx={cx}
                    cy={getY(pt.facebook)}
                    r={isHovered ? 3 : 1.3}
                    fill="#1D4ED8"
                    stroke="#FFFFFF"
                    strokeWidth={isHovered ? 0.9 : 0.4}
                  />
                )}
                {showYoutube && (
                  <circle
                    cx={cx}
                    cy={getY(pt.youtube)}
                    r={isHovered ? 3 : 1.3}
                    fill="#DC2626"
                    stroke="#FFFFFF"
                    strokeWidth={isHovered ? 0.9 : 0.4}
                  />
                )}
                {showTiktok && (
                  <circle
                    cx={cx}
                    cy={getY(pt.tiktok)}
                    r={isHovered ? 3.2 : 1.4}
                    fill="#141413"
                    stroke="#FFFFFF"
                    strokeWidth={isHovered ? 0.9 : 0.4}
                  />
                )}
                {(idx === 0 || idx === 6 || idx === 12 || idx === 18 || idx === 23 || isHovered) && (
                  <text
                    x={cx}
                    y={padTop + plotH + 13}
                    textAnchor="middle"
                    fontSize="7.4"
                    fontWeight={isHovered ? '700' : '500'}
                    fill={isHovered ? '#141413' : '#71717A'}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {pt.slot}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Live Multi-Platform Telemetry Footer */}
      <div className="pt-1.5 border-t border-black/[0.06] space-y-1 text-[9.5px] font-mono">
        {traffic.totals.all === 0 && (
          <div className="text-[8.5px] text-zinc-500 bg-zinc-50 border border-black/[0.05] rounded px-1.5 py-0.5 truncate" title="Chưa ghi nhận lượt xem thực từ YouTube API hoặc sự kiện phát sóng">
            0 lượt xem thực • Chỉ hiển thị số liệu đo được
          </div>
        )}
        <div className="flex items-center justify-between text-zinc-500">
          <span>Khung {activePoint?.slot || traffic.peakWindow}</span>
          <span className="font-bold text-[#141413]" data-testid="traffic-total-readout">
            {formatCompactNumber(
              selectedPlatform === 'all'
                ? activePoint?.total || 0
                : activePoint?.[selectedPlatform] || 0
            )}{' '}
            lượt xem/h
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-center pt-0.5">
          <div className="rounded bg-zinc-100 px-1 py-1 border border-black/[0.05] flex flex-col items-center gap-0.5">
            <span className="inline-flex items-center gap-1 text-[8px] text-zinc-600">
              <TiktokLogoIcon className="w-2.5 h-2.5 text-[#141413]" />
              <span>({traffic.activeVideos.tiktok}v)</span>
            </span>
            <span className="font-bold text-[#141413]">{formatCompactNumber(traffic.totals.tiktok)}</span>
          </div>
          <div className="rounded bg-blue-50/70 px-1 py-1 border border-blue-200/60 flex flex-col items-center gap-0.5">
            <span className="inline-flex items-center gap-1 text-[8px] text-blue-700">
              <FacebookLogoIcon className="w-2.5 h-2.5" />
              <span>({traffic.activeVideos.facebook}v)</span>
            </span>
            <span className="font-bold text-blue-800">{formatCompactNumber(traffic.totals.facebook)}</span>
          </div>
          <div className="rounded bg-red-50/70 px-1 py-1 border border-red-200/60 flex flex-col items-center gap-0.5">
            <span className="inline-flex items-center gap-1 text-[8px] text-red-700">
              <YoutubeLogoIcon className="w-2.5 h-2.5" />
              <span>({traffic.activeVideos.youtube}v)</span>
            </span>
            <span className="font-bold text-red-700">{formatCompactNumber(traffic.totals.youtube)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
