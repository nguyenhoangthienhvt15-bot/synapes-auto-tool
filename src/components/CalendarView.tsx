import React, { useState } from 'react';
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

// Bảng tra 12 Tranh Dân Gian Đông Hồ theo 12 tháng — chuẩn màu khoáng vật & xoáy Âm Dương cổ truyền
interface DongHoZodiacMeta {
  month: number;
  key: 'rat' | 'ox' | 'tiger' | 'cat' | 'dragon' | 'snake' | 'horse' | 'goat' | 'monkey' | 'rooster' | 'dog' | 'pig';
  chiName: string;
  paintingTitle: string;
  primaryPigment: string;
  secondaryPigment: string;
  accentPigment: string;
}

const ZODIAC_BY_MONTH: readonly DongHoZodiacMeta[] = [
  { month: 1, key: 'rat', chiName: 'Tý', paintingTitle: 'Đám Cưới Chuột', primaryPigment: '#B43222', secondaryPigment: '#295769', accentPigment: '#DFA12A' },
  { month: 2, key: 'ox', chiName: 'Sửu', paintingTitle: 'Mục Đồng Thổi Sáo', primaryPigment: '#36322F', secondaryPigment: '#3D6C4A', accentPigment: '#DFA12A' },
  { month: 3, key: 'tiger', chiName: 'Dần', paintingTitle: 'Ngũ Hổ Thần Tướng', primaryPigment: '#DFA12A', secondaryPigment: '#B43222', accentPigment: '#295769' },
  { month: 4, key: 'cat', chiName: 'Mão', paintingTitle: 'Mèo Ngoạm Cá', primaryPigment: '#DC8C27', secondaryPigment: '#B43222', accentPigment: '#295769' },
  { month: 5, key: 'dragon', chiName: 'Thìn', paintingTitle: 'Long Chầu Nhật', primaryPigment: '#295769', secondaryPigment: '#DFA12A', accentPigment: '#B43222' },
  { month: 6, key: 'snake', chiName: 'Tỵ', paintingTitle: 'Linh Xà Khắc Mộc', primaryPigment: '#3D6C4A', secondaryPigment: '#DFA12A', accentPigment: '#B43222' },
  { month: 7, key: 'horse', chiName: 'Ngọ', paintingTitle: 'Xích Thố Vinh Quy', primaryPigment: '#A93221', secondaryPigment: '#DFA12A', accentPigment: '#295769' },
  { month: 8, key: 'goat', chiName: 'Mùi', paintingTitle: 'Tam Dương Khai Thái', primaryPigment: '#EFE7D4', secondaryPigment: '#B43222', accentPigment: '#3D6C4A' },
  { month: 9, key: 'monkey', chiName: 'Thân', paintingTitle: 'Hầu Vương Dâng Đào', primaryPigment: '#B66328', secondaryPigment: '#C73828', accentPigment: '#3D6C4A' },
  { month: 10, key: 'rooster', chiName: 'Dậu', paintingTitle: 'Gà Đại Cát', primaryPigment: '#DFA12A', secondaryPigment: '#B43222', accentPigment: '#295769' },
  { month: 11, key: 'dog', chiName: 'Tuất', paintingTitle: 'Khuyển Vàng Giữ Lộc', primaryPigment: '#D19329', secondaryPigment: '#B43222', accentPigment: '#295769' },
  { month: 12, key: 'pig', chiName: 'Hợi', paintingTitle: 'Lợn Đàn Âm Dương', primaryPigment: '#DF8B72', secondaryPigment: '#B43222', accentPigment: '#3D6C4A' },
];

/**
 * Họa tiết Xoáy Âm Dương đặc trưng trên thân con vật trong Tranh Dân Gian Đông Hồ.
 */
const DongHoYinYangSwirl: React.FC<{ cx: number; cy: number; r?: number; ink?: string; light?: string }> = ({
  cx,
  cy,
  r = 9,
  ink = '#1A1613',
  light = '#FBF5E6',
}) => (
  <g transform={`translate(${cx}, ${cy})`}>
    <circle r={r} fill={light} stroke={ink} strokeWidth="1.5" />
    <path
      d={`M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${r / 2} ${r / 2} 0 0 1 0 0 A ${r / 2} ${r / 2} 0 0 0 0 ${-r} Z`}
      fill={ink}
    />
    <circle cx={0} cy={-r / 2} r={Math.max(1.2, r * 0.17)} fill={light} />
    <circle cx={0} cy={r / 2} r={Math.max(1.2, r * 0.17)} fill={ink} />
  </g>
);

/**
 * Khung Tranh Khắc Gỗ Dân Gian Đông Hồ — Giấy Điệp Vàng Ấm, Viền Khắc Mộc,
 * Triện Son Cổ Truyền và 12 Bức Họa Con Giáp Tĩnh Ở Góc Trên Bên Trái Lịch Biểu.
 */
const DongHoZodiacPainting: React.FC<{ zodiac: DongHoZodiacMeta }> = ({ zodiac }) => {
  const INK = '#191512';
  const DIEP_PAPER = '#F3E4C3';
  const DIEP_CREAM = '#FAF3E1';
  const SON = '#A92A1E';
  const HOE = '#DE9D24';
  const CHAM = '#275466';
  const LUC = '#386847';
  const uid = `dh-${zodiac.key}-${zodiac.month}`;

  return (
    <div
      className="relative flex-shrink-0 rounded-lg overflow-hidden border border-[#7E2319]/40 shadow-sm bg-[#F3E4C3]"
      style={{ width: 126, height: 88 }}
      title={`${zodiac.paintingTitle} — Tranh Dân Gian Đông Hồ`}
      data-testid="dong-ho-zodiac-emblem"
      data-zodiac-key={zodiac.key}
      data-zodiac-month={zodiac.month}
    >
      <svg
        viewBox="0 0 168 118"
        className="w-full h-full block"
        role="img"
        aria-label={`Tranh dân gian Đông Hồ: ${zodiac.paintingTitle}`}
      >
        <defs>
          {/* Chất liệu giấy điệp ánh vỏ sò & vệt chổi lá thông */}
          <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F6E9CB" />
            <stop offset="55%" stopColor="#F1DFAF" />
            <stop offset="100%" stopColor="#E6CF9B" />
          </linearGradient>
          <pattern id={`${uid}-brush`} width="24" height="6" patternUnits="userSpaceOnUse">
            <line x1="0" y1="1.5" x2="24" y2="1.2" stroke="#E5CE9A" strokeWidth="0.7" opacity="0.55" />
            <line x1="2" y1="4.5" x2="22" y2="4.7" stroke="#FDF8EC" strokeWidth="0.6" opacity="0.65" />
            <circle cx="7" cy="2.8" r="0.45" fill="#FFFDF7" opacity="0.8" />
            <circle cx="19" cy="5.2" r="0.4" fill="#FFFDF7" opacity="0.75" />
          </pattern>
        </defs>

        {/* Lớp nền Giấy Điệp */}
        <rect x="0" y="0" width="168" height="118" fill={`url(#${uid}-paper)`} />
        <rect x="0" y="0" width="168" height="118" fill={`url(#${uid}-brush)`} />

        {/* Họa tiết góc mây cổ / hoa thị 4 góc khung gỗ */}
        <path d="M8 22 Q8 8 22 8 M160 22 Q160 8 146 8 M8 96 Q8 110 22 110 M160 96 Q160 110 146 110" stroke={SON} strokeWidth="2.2" fill="none" />
        <rect x="5" y="5" width="158" height="108" rx="3" fill="none" stroke={INK} strokeWidth="2.4" />
        <rect x="9" y="9" width="150" height="100" rx="2" fill="none" stroke={SON} strokeWidth="1.2" strokeDasharray="16 2" />

        {/* Nền cụm mây khánh & lá trúc dân gian phía sau */}
        <path d="M18 96 Q44 88 84 93 Q125 98 150 91" stroke={LUC} strokeWidth="1.8" fill="none" opacity="0.65" />
        <path d="M22 28 C27 21, 37 21, 41 27 C46 24, 52 28, 49 33 C40 34, 29 33, 22 28 Z" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.4" opacity="0.85" />
        <path d="M114 23 C120 17, 130 18, 133 23 C138 22, 142 26, 138 30 L114 29 Z" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.3" opacity="0.75" />

        {/* TRIỆN SON ĐÔNG HỒ GÓC PHẢI TRÊN */}
        <g transform="translate(136, 15)">
          <rect x="0" y="0" width="18" height="26" rx="1.5" fill={SON} stroke={INK} strokeWidth="1" />
          <text x="9" y="11" textAnchor="middle" fontSize="6.8" fontWeight="800" fill={DIEP_CREAM} fontFamily="serif">
            {zodiac.chiName.toUpperCase()}
          </text>
          <line x1="3" y1="14" x2="15" y2="14" stroke={DIEP_CREAM} strokeWidth="0.7" opacity="0.8" />
          <text x="9" y="22" textAnchor="middle" fontSize="5.2" fontWeight="700" fill={DIEP_CREAM} fontFamily="serif">
            Đ.HỒ
          </text>
        </g>

        {/* =============== ĐỒ HỌA KHẮC GỖ 12 CON GIÁP ĐÔNG HỒ =============== */}
        {zodiac.key === 'rat' && (
          /* THÁNG 1: ĐÁM CƯỚI CHUỘT — Chuột quan cưỡi kiệu thổi kèn đội mũ cánh chuồn */
          <g>
            {/* Đuôi uốn lượn khắc mộc */}
            <path d="M40 76 C22 72, 18 52, 29 45 C36 40, 41 47, 36 52" stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
            {/* Thân áo bào đỏ son */}
            <path d="M42 78 C42 56, 62 46, 86 48 C102 50, 108 64, 104 78 L98 92 L46 92 Z" fill={SON} stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
            {/* Yếm hoa vàng & Xoáy Âm Dương */}
            <path d="M58 51 Q76 62 94 52 L90 66 Q76 74 60 66 Z" fill={HOE} stroke={INK} strokeWidth="2" />
            <DongHoYinYangSwirl cx={62} cy={74} r={8} ink={INK} light={DIEP_CREAM} />
            {/* Tai chuột tròn kép & Đầu */}
            <circle cx="90" cy="34" r="10.5" fill={DIEP_CREAM} stroke={INK} strokeWidth="2.6" />
            <circle cx="90" cy="34" r="5.2" fill="#DF8B72" stroke={INK} strokeWidth="1.5" />
            <path d="M84 42 C92 32, 118 34, 128 48 C118 55, 96 57, 84 49 Z" fill={DIEP_CREAM} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
            {/* Mũ cánh chuồn xanh chàm */}
            <path d="M84 36 L98 25 L110 35 Z" fill={CHAM} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M77 32 C69 27, 68 35, 79 36" fill={CHAM} stroke={INK} strokeWidth="1.8" />
            {/* Kèn đồng / Hoa cúc cầm tay */}
            <path d="M111 58 L138 45 L142 54 L112 63 Z" fill={HOE} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
            {/* Mắt khắc mộc & Ria */}
            <ellipse cx="107" cy="43" rx="3.2" ry="2.2" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.8" />
            <circle cx="108" cy="43" r="1.4" fill={INK} />
            <circle cx="127" cy="47.5" r="2.8" fill={SON} stroke={INK} strokeWidth="1.8" />
            <path d="M122 51 L136 53 M121 54 L134 59" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
            {/* Chân bước nhịp nhàng */}
            <path d="M56 92 L50 100 L59 100 M88 92 L95 100 L103 100" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          </g>
        )}

        {zodiac.key === 'ox' && (
          /* THÁNG 2: MỤC ĐỒNG THỔI SÁO / TRÂU MỘNG ĐÔNG HỒ */
          <g>
            {/* Đuôi vắt */}
            <path d="M36 56 C26 60, 26 78, 32 86" stroke={INK} strokeWidth="2.8" fill="none" strokeLinecap="round" />
            <path d="M32 86 C28 92, 35 94, 36 86 Z" fill={INK} />
            {/* Bốn chân trâu vững chãi */}
            <path d="M46 78 L42 99 L49 99 L54 79 M62 79 L60 99 L67 99 L70 79 M92 78 L90 99 L97 99 L100 78 M108 77 L111 99 L118 99 L115 76" fill="#46403C" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
            {/* Thân trâu vạm vỡ */}
            <path d="M35 58 C37 42, 62 39, 90 42 C108 44, 120 49, 122 65 C120 79, 102 82, 76 81 C50 81, 34 74, 35 58 Z" fill="#4E4843" stroke={INK} strokeWidth="2.8" />
            {/* Bụng vằn sáng vỏ điệp & Xoáy Âm Dương */}
            <path d="M48 74 Q76 80 105 74" stroke={DIEP_CREAM} strokeWidth="2.2" fill="none" />
            <DongHoYinYangSwirl cx={62} cy={59} r={9.5} ink={INK} light={DIEP_PAPER} />
            {/* Đứa trẻ mục đồng đội nón lá thổi sáo trên lưng trâu */}
            <path d="M71 42 L85 42 L83 28 L73 28 Z" fill={SON} stroke={INK} strokeWidth="2" />
            <circle cx="78" cy="23" r="5.5" fill={DIEP_CREAM} stroke={INK} strokeWidth="2" />
            <path d="M68 20 L78 12 L88 20 Z" fill={HOE} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
            <line x1="78" y1="25" x2="96" y2="27" stroke={LUC} strokeWidth="2.4" strokeLinecap="round" />
            {/* Đầu trâu & Sừng cong bán nguyệt */}
            <path d="M112 46 C122 38, 138 44, 143 58 C142 66, 130 69, 118 65 Z" fill="#46403C" stroke={INK} strokeWidth="2.6" />
            <path d="M116 42 C106 27, 117 18, 126 24 C120 26, 118 33, 122 40 Z" fill={DIEP_CREAM} stroke={INK} strokeWidth="2.4" />
            <path d="M126 42 C133 27, 147 26, 147 36 C141 33, 135 37, 132 45 Z" fill={DIEP_CREAM} stroke={INK} strokeWidth="2.4" />
            {/* Khuyên mũi vàng đồng */}
            <circle cx="139" cy="64" r="4" fill="none" stroke={HOE} strokeWidth="2.2" />
            <ellipse cx="127" cy="51" rx="3" ry="2.1" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.6" />
            <circle cx="127.8" cy="51" r="1.2" fill={INK} />
          </g>
        )}

        {zodiac.key === 'tiger' && (
          /* THÁNG 3: NGŨ HỔ ĐÔNG HỒ — Hoàng Hổ uy nghi trán chữ Vương */
          <g>
            {/* Đuôi vồng gợn sóng */}
            <path d="M36 76 C18 72, 16 42, 34 38 C43 36, 46 46, 39 50" stroke={INK} strokeWidth="5.2" fill="none" strokeLinecap="round" />
            <path d="M36 76 C18 72, 16 42, 34 38 C43 36, 46 46, 39 50" stroke={HOE} strokeWidth="2.8" fill="none" strokeLinecap="round" />
            {/* Thân hổ chầu vàng hoa hòe */}
            <path d="M37 78 C37 54, 58 44, 86 45 C106 46, 114 60, 112 78 L108 98 L98 98 L96 81 L58 81 L54 98 L43 98 Z" fill={HOE} stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
            {/* Vằn hổ khắc gỗ đen tuyền */}
            <path d="M52 49 C56 56, 51 64, 56 71 M66 47 C70 55, 64 64, 70 72 M80 48 C83 56, 78 65, 83 72" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <DongHoYinYangSwirl cx={67} cy={63} r={7.5} ink={SON} light={DIEP_CREAM} />
            {/* Bờm ức trắng vỏ điệp & yếm đỏ */}
            <path d="M98 48 C110 52, 116 64, 108 74 C98 76, 94 64, 98 48 Z" fill={DIEP_CREAM} stroke={INK} strokeWidth="2.2" />
            {/* Đầu Hổ uy nghi nhìn thẳng chéo */}
            <circle cx="116" cy="42" r="17" fill={HOE} stroke={INK} strokeWidth="2.8" />
            <path d="M101 29 L98 20 L108 26 Z M131 29 L134 20 L124 26 Z" fill={SON} stroke={INK} strokeWidth="2.2" />
            {/* Chữ Vương 王 trên trán */}
            <path d="M111 29 H121 M112 33 H120 M111 37 H121 M116 29 V37" stroke={INK} strokeWidth="1.9" strokeLinecap="round" />
            {/* Mắt hổ xếch & má ria */}
            <path d="M105 40 Q109 37 113 40 Q109 43 105 40 Z M119 40 Q123 37 127 40 Q123 43 119 40 Z" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.8" />
            <circle cx="109" cy="40" r="1.4" fill={INK} />
            <circle cx="123" cy="40" r="1.4" fill={INK} />
            <ellipse cx="116" cy="48" rx="6.5" ry="4.5" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.8" />
            <polygon points="113,46 119,46 116,49.5" fill={SON} />
            <path d="M102 47 L93 45 M102 50 L93 52 M130 47 L139 45 M130 50 L139 52" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
            {/* Móng vuốt trước */}
            <path d="M114 78 L126 98 L112 98 L108 82" fill={HOE} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
          </g>
        )}

        {zodiac.key === 'cat' && (
          /* THÁNG 4: MÈO VÀNG NGOẠM CÁ CHÉP ĐÔNG HỒ */
          <g>
            {/* Đuôi mèo cuộn thanh thoát */}
            <path d="M40 82 C20 82, 22 50, 38 48 C46 47, 47 56, 40 58" stroke={INK} strokeWidth="5.4" fill="none" strokeLinecap="round" />
            <path d="M40 82 C20 82, 22 50, 38 48 C46 47, 47 56, 40 58" stroke="#DE9D24" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            {/* Thân mèo ngồi */}
            <path d="M42 88 C40 60, 56 46, 78 48 C94 50, 100 68, 96 88 L88 98 L48 98 Z" fill="#E39729" stroke={INK} strokeWidth="2.8" />
            <ellipse cx="74" cy="76" rx="13" ry="15" fill={DIEP_CREAM} stroke={INK} strokeWidth="2" />
            <DongHoYinYangSwirl cx={56} cy={68} r={8} ink={INK} light={DIEP_CREAM} />
            {/* Vòng cổ đỏ & chuông vàng */}
            <path d="M58 51 Q76 58 94 49" stroke={SON} strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="76" cy="56" r="4" fill={HOE} stroke={INK} strokeWidth="1.8" />
            {/* Đầu mèo & tai nhọn */}
            <path d="M62 29 L56 14 L72 23 Z M92 29 L98 14 L82 23 Z" fill="#E39729" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M63 26 L60 18 L68 23 Z M91 26 L94 18 L86 23 Z" fill={SON} />
            <circle cx="77" cy="36" r="15" fill="#E39729" stroke={INK} strokeWidth="2.8" />
            {/* Mắt mèo hạnh nhân */}
            <ellipse cx="71" cy="34" rx="3.4" ry="2.6" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.8" />
            <ellipse cx="83" cy="34" rx="3.4" ry="2.6" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.8" />
            <line x1="71" y1="32" x2="71" y2="36" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="83" y1="32" x2="83" y2="36" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
            {/* Chú Cá Chép xanh chàm ngoạm ở miệng mèo */}
            <path d="M77 42 C94 38, 114 43, 126 52 C113 58, 92 56, 77 46 Z" fill={CHAM} stroke={INK} strokeWidth="2.2" />
            <polygon points="124,52 135,44 133,59" fill={SON} stroke={INK} strokeWidth="2" />
            <path d="M95 44 Q98 48 95 52 M103 44 Q106 48 103 52 M111 45 Q114 49 111 53" stroke={DIEP_CREAM} strokeWidth="1.4" fill="none" />
          </g>
        )}

        {zodiac.key === 'dragon' && (
          /* THÁNG 5: LONG CHẦU NHẬT — Rồng Xanh Chàm uốn lượn bên Nhật Nguyệt đỏ son */
          <g>
            {/* Viên Nhật Ngọc đỏ son bốc hỏa */}
            <circle cx="118" cy="36" r="10.5" fill={SON} stroke={INK} strokeWidth="2.4" />
            <circle cx="118" cy="36" r="5" fill={HOE} />
            <path d="M113 24 Q118 16 123 24" stroke={SON} strokeWidth="2.2" fill="none" />
            {/* Thân rồng chữ S khắc gỗ */}
            <path
              d="M25 84 C32 62, 55 58, 62 72 C70 86, 94 84, 100 66 C104 54, 88 46, 86 35"
              stroke={INK}
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M25 84 C32 62, 55 58, 62 72 C70 86, 94 84, 100 66 C104 54, 88 46, 86 35"
              stroke={CHAM}
              strokeWidth="9.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Đường sống lưng vây vàng hoa hòe */}
            <path
              d="M23 76 L29 66 L36 69 L42 58 L50 62 L58 55 L64 66 L73 74 L82 77 L91 71 L98 60"
              stroke={HOE}
              strokeWidth="2.6"
              fill="none"
              strokeLinejoin="round"
            />
            {/* Đầu rồng thần uy nghi */}
            <path d="M68 28 C76 19, 98 20, 104 33 L96 42 L72 40 Z" fill={CHAM} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M74 22 C66 13, 58 17, 63 23 M80 21 C76 11, 70 13, 73 20" stroke={HOE} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M101 30 Q109 28 112 24" stroke={SON} strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="88" cy="29" r="2.6" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.5" />
            <circle cx="88.6" cy="29" r="1.2" fill={INK} />
            <DongHoYinYangSwirl cx={46} cy={70} r={6.5} ink={INK} light={DIEP_CREAM} />
          </g>
        )}

        {zodiac.key === 'snake' && (
          /* THÁNG 6: LINH XÀ KHẮC MỘC — Rắn cuộn hình chữ S bên khóm trúc xanh */
          <g>
            {/* Khóm trúc dân gian */}
            <path d="M116 96 V40 M124 96 V52" stroke={LUC} strokeWidth="2.4" />
            <ellipse cx="109" cy="54" rx="6" ry="2.2" transform="rotate(-20 109 54)" fill={LUC} stroke={INK} strokeWidth="1" />
            <ellipse cx="129" cy="46" rx="6" ry="2.2" transform="rotate(20 129 46)" fill={LUC} stroke={INK} strokeWidth="1" />
            {/* Thân rắn cuộn nhịp nhàng */}
            <path
              d="M32 84 C32 64, 98 70, 96 86 C94 98, 44 96, 46 80 C48 62, 86 58, 84 42 C82 32, 62 32, 62 42"
              stroke={INK}
              strokeWidth="12.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M32 84 C32 64, 98 70, 96 86 C94 98, 44 96, 46 80 C48 62, 86 58, 84 42 C82 32, 62 32, 62 42"
              stroke={LUC}
              strokeWidth="8.2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Hoa văn vảy kim cương vàng-son */}
            <path d="M40 84 L48 79 L56 85 M64 89 L73 85 L82 90 M54 71 L64 67 L73 72" stroke={HOE} strokeWidth="2.2" fill="none" />
            {/* Đầu rắn thần có mào */}
            <path d="M52 38 C52 28, 70 28, 74 39 C70 46, 56 46, 52 38 Z" fill={LUC} stroke={INK} strokeWidth="2.4" />
            <path d="M62 29 L67 21 L70 30" fill={SON} stroke={INK} strokeWidth="1.6" />
            <circle cx="58" cy="36" r="2.2" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.4" />
            <circle cx="57.8" cy="36" r="1" fill={INK} />
            <path d="M51 40 L42 42 L39 39 M42 42 L39 45" stroke={SON} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <DongHoYinYangSwirl cx={70} cy={83} r={6.5} ink={INK} light={DIEP_CREAM} />
          </g>
        )}

        {zodiac.key === 'horse' && (
          /* THÁNG 7: XÍCH THỐ VINH QUY — Ngựa đỏ son tung vó bờm sóng */
          <g>
            {/* Đuôi ngựa đen tung bay */}
            <path d="M36 58 C20 55, 16 74, 24 88 C29 76, 31 68, 38 66 Z" fill={INK} stroke={INK} strokeWidth="2" />
            {/* Bốn chân tung vó */}
            <path d="M45 74 L35 98 L41 99 L52 76 M58 75 L56 99 L63 99 L65 75 M94 74 L112 91 L108 97 L87 77 M100 68 L124 76 L122 83 L96 74" fill={SON} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
            {/* Thân ngựa đỏ son & yên gấm hoa hòe */}
            <path d="M36 60 C38 46, 65 44, 92 46 C106 48, 112 62, 102 74 C82 78, 52 78, 36 60 Z" fill={SON} stroke={INK} strokeWidth="2.8" />
            <path d="M58 46 L86 46 L82 63 L62 63 Z" fill={HOE} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M62 49 H82 L80 59 H64 Z" fill={CHAM} stroke={INK} strokeWidth="1.4" />
            <DongHoYinYangSwirl cx={49} cy={60} r={7.5} ink={INK} light={DIEP_CREAM} />
            {/* Cổ ngựa vươn cao & Bờm khắc sóng */}
            <path d="M88 48 L104 26 L122 30 L108 58 Z" fill={SON} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M88 44 Q91 34 97 35 Q96 27 104 26 L98 46 Z" fill={INK} />
            {/* Đầu ngựa & Dây cương vàng */}
            <path d="M104 26 L112 16 L116 25 L133 34 L128 42 L111 38 Z" fill={SON} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M116 28 L128 38 M112 37 L96 47" stroke={HOE} strokeWidth="2" />
            <circle cx="116" cy="29" r="2.2" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.5" />
            <circle cx="116.5" cy="29" r="1.1" fill={INK} />
          </g>
        )}

        {zodiac.key === 'goat' && (
          /* THÁNG 8: TAM DƯƠNG KHAI THÁI — Dê trắng vỏ điệp sừng xoắn thong dong */
          <g>
            {/* Chân dê mảnh khỏe */}
            <path d="M48 76 L44 98 M60 76 L58 98 M90 76 L92 98 M102 76 L106 98" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
            {/* Thân dê trắng vỏ điệp viền mây */}
            <path d="M40 64 C40 46, 62 43, 94 46 C108 48, 114 60, 108 74 C92 80, 56 80, 40 64 Z" fill={DIEP_CREAM} stroke={INK} strokeWidth="2.8" />
            <DongHoYinYangSwirl cx={64} cy={61} r={8.5} ink={SON} light={DIEP_PAPER} />
            {/* Đuôi dê nhỏ */}
            <path d="M40 58 C32 54, 31 62, 39 64" fill={DIEP_CREAM} stroke={INK} strokeWidth="2.2" />
            {/* Cổ & Đầu dê vươn cao với cặp sừng xoắn */}
            <path d="M94 49 L106 28 L129 36 L124 46 L105 56 Z" fill={DIEP_CREAM} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M107 28 C100 14, 84 16, 86 27 C88 22, 98 21, 102 30" fill={HOE} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M113 28 C113 14, 128 15, 126 26" fill="none" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
            {/* Chòm râu dê & Lạc đỏ */}
            <path d="M122 46 C125 56, 119 60, 117 52 Z" fill={HOE} stroke={INK} strokeWidth="1.8" />
            <path d="M95 50 Q103 55 110 50" stroke={SON} strokeWidth="3.2" fill="none" />
            <circle cx="116" cy="36" r="2.2" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.6" />
            <circle cx="116.5" cy="36" r="1" fill={INK} />
          </g>
        )}

        {zodiac.key === 'monkey' && (
          /* THÁNG 9: HẦU VƯƠNG DÂNG ĐÀO TIÊN — Chú Khỉ nâng Đào Tiên đỏ ửng */
          <g>
            {/* Đuôi uốn cong dài */}
            <path d="M48 80 C25 78, 22 44, 38 40 C47 38, 48 48, 41 50" stroke={INK} strokeWidth="4.8" fill="none" strokeLinecap="round" />
            <path d="M48 80 C25 78, 22 44, 38 40 C47 38, 48 48, 41 50" stroke="#BA6727" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            {/* Thân khỉ ngồi gập gối */}
            <path d="M48 82 C46 58, 62 46, 82 50 C96 54, 100 72, 92 88 L46 94 Z" fill="#BA6727" stroke={INK} strokeWidth="2.8" />
            <DongHoYinYangSwirl cx={63} cy={70} r={7.5} ink={INK} light={DIEP_CREAM} />
            {/* Đầu khỉ lanh lợi & hai tai lớn truyền thống */}
            <circle cx="59" cy="34" r="6.5" fill="#BA6727" stroke={INK} strokeWidth="2.2" />
            <circle cx="59" cy="34" r="3.4" fill="#F2BE8D" />
            <circle cx="93" cy="34" r="6.5" fill="#BA6727" stroke={INK} strokeWidth="2.2" />
            <circle cx="93" cy="34" r="3.4" fill="#F2BE8D" />
            <circle cx="76" cy="35" r="14.5" fill="#BA6727" stroke={INK} strokeWidth="2.8" />
            <path d="M64 33 C64 25, 88 25, 88 33 C89 44, 63 44, 64 33 Z" fill="#F5D7A8" stroke={INK} strokeWidth="1.8" />
            <circle cx="71" cy="33" r="2" fill={INK} />
            <circle cx="81" cy="33" r="2" fill={INK} />
            <circle cx="67" cy="38" r="2.2" fill={SON} opacity="0.65" />
            <circle cx="85" cy="38" r="2.2" fill={SON} opacity="0.65" />
            <path d="M72 41 Q76 44 80 41" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            {/* Hai tay dâng Trái Đào Tiên Đỏ Thắm & Lá Xanh Chàm */}
            <path d="M90 58 Q104 62 110 56" stroke="#BA6727" strokeWidth="6.5" strokeLinecap="round" fill="none" />
            <path d="M90 58 Q104 62 110 56" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M108 58 C104 42, 118 33, 124 29 C129 36, 138 46, 132 58 C126 67, 112 67, 108 58 Z" fill={SON} stroke={INK} strokeWidth="2.4" />
            <path d="M111 56 C110 47, 118 40, 124 35 C125 45, 121 56, 111 56 Z" fill={HOE} opacity="0.7" />
            <path d="M114 63 Q106 72 102 64 Q108 59 114 63 Z M126 63 Q136 72 138 63 Q131 58 126 63 Z" fill={LUC} stroke={INK} strokeWidth="1.6" />
          </g>
        )}

        {zodiac.key === 'rooster' && (
          /* THÁNG 10: GÀ ĐẠI CÁT — Tranh Đông Hồ Kinh Điển (Mào cờ đỏ, đuôi 5 màu khoáng) */
          <g>
            {/* Bộ lông đuôi cong vút đa sắc khoáng Đông Hồ */}
            <path d="M58 60 C34 42, 22 52, 24 72 C32 58, 44 56, 56 66 Z" fill={CHAM} stroke={INK} strokeWidth="2.4" />
            <path d="M62 56 C38 30, 20 35, 19 54 C30 43, 44 45, 58 60 Z" fill={LUC} stroke={INK} strokeWidth="2.4" />
            <path d="M66 54 C46 20, 26 20, 22 36 C36 28, 50 35, 62 56 Z" fill={SON} stroke={INK} strokeWidth="2.4" />
            {/* Chân gà vàng đứng hiên ngang */}
            <path d="M74 80 L70 98 M64 98 H78 M92 80 L94 98 M87 98 H101" stroke={HOE} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M74 80 L70 98 M64 98 H78 M92 80 L94 98 M87 98 H101" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
            {/* Thân gà vạm vỡ & cánh gấm */}
            <path d="M54 62 C56 46, 86 42, 102 54 C112 64, 102 84, 78 84 C60 84, 52 74, 54 62 Z" fill={HOE} stroke={INK} strokeWidth="2.8" />
            <path d="M62 60 C72 54, 88 58, 92 70 C80 76, 66 74, 62 60 Z" fill={SON} stroke={INK} strokeWidth="2.2" />
            <DongHoYinYangSwirl cx={78} cy={65} r={6.5} ink={INK} light={DIEP_CREAM} />
            {/* Cổ & Đầu gà trống vươn cao */}
            <path d="M88 52 C92 34, 102 28, 114 32 C116 42, 106 54, 98 58 Z" fill={DIEP_CREAM} stroke={INK} strokeWidth="2.6" />
            {/* Mào cờ đỏ son 5 răng cưa & tích gà */}
            <path d="M97 31 L95 19 L102 24 L106 16 L110 24 L116 19 L114 31 Z" fill={SON} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M111 40 C114 48, 106 50, 106 42 Z" fill={SON} stroke={INK} strokeWidth="1.8" />
            {/* Mỏ vàng cứng */}
            <polygon points="114,33 128,36 114,40" fill={HOE} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
            <circle cx="107" cy="34" r="2.2" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.5" />
            <circle cx="107.6" cy="34" r="1.1" fill={INK} />
          </g>
        )}

        {zodiac.key === 'dog' && (
          /* THÁNG 11: KHUYỂN VÀNG GIỮ LỘC — Chó vàng ngồi canh nhà cổ đeo lục lạc đỏ */
          <g>
            {/* Đuôi lá đề cong */}
            <path d="M46 78 C32 72, 30 54, 42 52 C48 52, 49 60, 44 63" fill={HOE} stroke={INK} strokeWidth="2.6" />
            {/* Thân chó vàng ngồi chầu */}
            <path d="M48 86 C46 62, 62 46, 86 48 C100 50, 104 68, 100 88 L98 98 L88 98 L87 82 L64 82 L62 98 L48 98 Z" fill={HOE} stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
            <DongHoYinYangSwirl cx={67} cy={67} r={8} ink={SON} light={DIEP_CREAM} />
            {/* Cổ đeo vòng đỏ & Lục lạc đồng */}
            <path d="M74 49 Q88 56 101 48" stroke={SON} strokeWidth="4.2" fill="none" strokeLinecap="round" />
            <circle cx="90" cy="54" r="4.2" fill={DIEP_CREAM} stroke={INK} strokeWidth="2" />
            {/* Đầu chó & tai vểnh */}
            <path d="M76 28 L72 13 L86 23 Z M100 28 L108 14 L106 29 Z" fill={SON} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M74 36 C74 23, 104 22, 110 34 C118 35, 120 44, 110 47 C96 50, 74 47, 74 36 Z" fill={HOE} stroke={INK} strokeWidth="2.8" />
            <circle cx="115" cy="38" r="3.2" fill={INK} />
            <circle cx="92" cy="34" r="2.6" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.6" />
            <circle cx="92.8" cy="34" r="1.2" fill={INK} />
          </g>
        )}

        {zodiac.key === 'pig' && (
          /* THÁNG 12: LỢN ĐÀN ÂM DƯƠNG — Kiệt Tác Kinh Điển Làng Đông Hồ */
          <g>
            {/* Đuôi xoắn ốc nhỏ */}
            <path d="M36 60 C27 57, 26 47, 33 47 C38 47, 38 53, 33 54" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
            {/* Bốn chân ngắn mập mạp */}
            <path d="M46 78 L44 96 L53 96 L56 80 M68 80 L67 96 L76 96 L77 81 M94 80 L94 96 L103 96 L104 80 M112 76 L115 95 L123 95 L120 74" fill="#E99A7E" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
            {/* Thân lợn mũm mĩm màu hồng sỏi đồi */}
            <path d="M35 60 C35 38, 66 34, 104 37 C124 39, 134 50, 130 68 C126 83, 100 84, 72 83 C46 83, 35 74, 35 60 Z" fill="#E99A7E" stroke={INK} strokeWidth="2.8" />
            {/* HAI XOÁY ÂM DƯƠNG KINH ĐIỂN TRÊN THÂN LỢN ĐÔNG HỒ */}
            <DongHoYinYangSwirl cx={56} cy={59} r={10.5} ink={INK} light={DIEP_CREAM} />
            <DongHoYinYangSwirl cx={89} cy={58} r={9.5} ink={SON} light={DIEP_CREAM} />
            {/* Bờm lưng xanh/vàng đặc trưng */}
            <path d="M58 37 Q70 30 82 36 Q93 31 104 37" stroke={LUC} strokeWidth="3.2" fill="none" strokeLinecap="round" />
            {/* Tai to rủ xuống che má & 2 chấm trắng điệp trên trán */}
            <path d="M104 42 C96 48, 96 63, 108 60 C114 57, 113 45, 104 42 Z" fill={SON} stroke={INK} strokeWidth="2.4" />
            <circle cx="115" cy="44" r="2.2" fill={DIEP_CREAM} />
            <circle cx="121" cy="45" r="1.8" fill={DIEP_CREAM} />
            {/* Mắt cười & Mõm hếch duyên dáng */}
            <ellipse cx="120" cy="54" rx="3.4" ry="2.5" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.8" />
            <circle cx="121" cy="54" r="1.3" fill={INK} />
            <ellipse cx="136" cy="58" rx="4.5" ry="6.2" transform="rotate(-12 136 58)" fill="#DFA12A" stroke={INK} strokeWidth="2.4" />
            <circle cx="135" cy="56" r="1.1" fill={INK} />
            <circle cx="137.5" cy="59.5" r="1.1" fill={INK} />
            {/* Bông lá ráy xanh góc dưới */}
            <path d="M134 94 Q146 76 154 88 Q144 98 134 94 Z" fill={LUC} stroke={INK} strokeWidth="1.8" />
          </g>
        )}

        {/* Khung dải tên tác phẩm dân gian phía dưới tranh */}
        <rect x="18" y="99" width="132" height="12" rx="2" fill={DIEP_CREAM} stroke={INK} strokeWidth="1.2" opacity="0.92" />
        <text x="84" y="107.6" textAnchor="middle" fontSize="7.4" fontWeight="700" fill={SON} fontFamily="serif" letterSpacing="0.5">
          {zodiac.paintingTitle.toUpperCase()}
        </text>
      </svg>
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

export const CalendarView: React.FC<CalendarViewProps> = ({
  projects,
  onSelectProject,
  onBack,
  onUpdateProject,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 10, 8)); // Tháng 11 năm 2026
  const [platformFilter, setPlatformFilter] = useState<'all' | 'youtube' | 'tiktok' | 'facebook'>('all');

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

      {/* Header Bar với Tranh Dân Gian Đông Hồ tĩnh ở góc trên bên trái Lịch Biểu */}
      <div className="studio-card p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
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

          {/* Bức Tranh Khắc Gỗ Đông Hồ 12 Con Giáp đứng yên cố định ở góc trên bên trái */}
          <DongHoZodiacPainting zodiac={currentZodiac} />

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#141413] tracking-tight flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#8B261D]" />
                <span>Lịch Phát Sóng Video</span>
              </h2>
            </div>
            <p className="text-zinc-500 text-xs mt-1">
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
    </div>
  );
};
