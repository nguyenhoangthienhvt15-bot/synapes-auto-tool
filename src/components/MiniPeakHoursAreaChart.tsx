import React, { useState } from 'react';

interface MarketPoint {
  year: string;
  value: number;
  yoy: string;
}

const MARKET_SIZE_DATA: MarketPoint[] = [
  { year: '2021', value: 64, yoy: 'Base' },
  { year: '2022', value: 98, yoy: '+53.1%' },
  { year: '2023', value: 136, yoy: '+38.8%' },
  { year: '2024', value: 184, yoy: '+35.3%' },
  { year: '2025', value: 232, yoy: '+26.1%' },
];

const Y_TICKS = [0, 50, 100, 150, 200, 250];

/**
 * Biểu đồ Market Size Growth hiển thị ở cột trái Sidebar.
 * Thiết kế tối giản chuẩn báo cáo thị trường: tiêu đề xanh rêu #4B6A53 bo tròn,
 * trục Y (0..250), trục X (2021..2025) và đường gấp khúc #1E3F2B với các điểm vuông.
 */
export const MiniPeakHoursAreaChart: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 236;
  const height = 148;
  const padLeft = 28;
  const padRight = 14;
  const padTop = 12;
  const padBottom = 24;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const maxY = 250;

  const getX = (idx: number) =>
    padLeft + (idx / Math.max(1, MARKET_SIZE_DATA.length - 1)) * plotW;
  const getY = (val: number) =>
    padTop + plotH - (Math.max(0, Math.min(maxY, val)) / maxY) * plotH;

  const polylinePoints = MARKET_SIZE_DATA.map((pt, i) => `${getX(i).toFixed(1)},${getY(pt.value).toFixed(1)}`).join(' ');
  const activePoint = hoveredIdx !== null ? MARKET_SIZE_DATA[hoveredIdx] : MARKET_SIZE_DATA[MARKET_SIZE_DATA.length - 1];

  return (
    <div
      className="rounded-xl border border-black/[0.08] bg-white p-2.5 shadow-2xs select-none"
      data-testid="market-size-growth-widget"
    >
      {/* Header Pill */}
      <div className="flex items-center justify-center mb-1.5">
        <div className="px-3.5 py-1 rounded-full bg-[#4B6A53] text-white text-[11px] font-bold tracking-wide shadow-2xs">
          Market Size Growth
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label="Biểu đồ Market Size Growth giai đoạn 2021 đến 2025"
        >
          {/* Horizontal gridlines + Y labels */}
          {Y_TICKS.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={tick === 0 ? '#94A3B8' : '#E2E8F0'}
                  strokeWidth={tick === 0 ? 1 : 0.75}
                />
                <text
                  x={padLeft - 5}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8.5"
                  fill="#475569"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Vertical Left Y Axis Line */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + plotH}
            stroke="#94A3B8"
            strokeWidth={1}
          />

          {/* Main Polyline */}
          <polyline
            fill="none"
            stroke="#1E3F2B"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={polylinePoints}
          />

          {/* Square Vertex Markers + X-Axis Year Labels */}
          {MARKET_SIZE_DATA.map((pt, idx) => {
            const cx = getX(idx);
            const cy = getY(pt.value);
            const isHovered = hoveredIdx === idx;
            const boxSize = isHovered ? 7 : 5.5;
            return (
              <g
                key={pt.year}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Invisible wider hit target */}
                <circle cx={cx} cy={cy} r={11} fill="transparent" />
                <rect
                  x={cx - boxSize / 2}
                  y={cy - boxSize / 2}
                  width={boxSize}
                  height={boxSize}
                  fill="#1E3F2B"
                  stroke="#FFFFFF"
                  strokeWidth={1}
                />
                <text
                  x={cx}
                  y={padTop + plotH + 13}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight={isHovered ? '700' : '500'}
                  fill={isHovered ? '#1E3F2B' : '#475569'}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {pt.year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Subtle footer readout */}
      <div className="flex items-center justify-between px-1 pt-0.5 border-t border-zinc-100 text-[9.5px] font-mono text-zinc-500">
        <span>Năm {activePoint.year}</span>
        <span className="font-semibold text-[#1E3F2B]">
          {activePoint.value}B ({activePoint.yoy})
        </span>
      </div>
    </div>
  );
};
