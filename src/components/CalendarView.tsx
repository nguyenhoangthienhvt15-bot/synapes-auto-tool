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

/**
 * Họa tiết Xoáy Âm Dương khắc ván gỗ đặc trưng trên thân con vật trong Tranh Dân Gian Đông Hồ.
 */
const DongHoYinYangSwirl: React.FC<{ cx: number; cy: number; r?: number; ink?: string; light?: string }> = ({
  cx,
  cy,
  r = 10,
  ink = '#171310',
  light = '#F6F1E2',
}) => (
  <g transform={`translate(${cx}, ${cy})`}>
    <circle r={r} fill={light} stroke={ink} strokeWidth="2.1" />
    <path
      d={`M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${r / 2} ${r / 2} 0 0 1 0 0 A ${r / 2} ${r / 2} 0 0 0 0 ${-r} Z`}
      fill={ink}
    />
    <circle cx={0} cy={-r / 2} r={Math.max(1.4, r * 0.19)} fill={light} />
    <circle cx={0} cy={r / 2} r={Math.max(1.4, r * 0.19)} fill={ink} />
  </g>
);

/**
 * Gò đất khoáng vật son/lục & cụm cỏ 5 nhánh khắc mộc (đặc trưng bức Vinh Quy Bái Tổ).
 */
const DongHoEarthyMoundBase: React.FC<{ ink: string; son: string; luc: string; diep: string }> = ({
  ink,
  son,
  luc,
  diep,
}) => (
  <g>
    {/* Nền gò đất son & xanh lục */}
    <path
      d="M34 139 Q56 127 78 139 Q98 131 118 139 Q142 126 168 139 L186 139"
      fill="none"
      stroke={ink}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path d="M40 139 Q58 128 77 139 Z" fill={son} stroke={ink} strokeWidth="1.9" strokeLinejoin="round" />
    <path d="M126 139 Q146 127 167 139 Z" fill={luc} stroke={ink} strokeWidth="1.9" strokeLinejoin="round" />
    {/* Cụm cỏ khắc gỗ 5 ngọn */}
    <path
      d="M90 138 L83 128 M92 138 L89 125 M94 138 L94 123 M96 138 L100 126 M98 138 L106 130"
      stroke={ink}
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M113 138 L108 129 M115 138 L113 127 M117 138 L118 126 M119 138 L124 129"
      stroke={ink}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    {/* Đóa hoa đất nhỏ */}
    <circle cx="102" cy="136" r="2.1" fill={diep} stroke={ink} strokeWidth="1.3" />
    <circle cx="107" cy="135" r="2.3" fill={son} stroke={ink} strokeWidth="1.3" />
  </g>
);

/**
 * Bức Tranh Khắc Gỗ Dân Gian Đông Hồ chuẩn mực — tái hiện trọn vẹn chất liệu Giấy Điệp chổi lá thông,
 * bảng màu khoáng vật tự nhiên (Son đất #8D281B, Lục chàm #2B5834, Hoa hòe #E1AD36, Trắng điệp #F6F1E2),
 * nét khắc răng lược song song, gấm hoa thị lục giác, gò cỏ & chữ Hán-Nôm khắc mộc.
 */
export const DongHoZodiacPainting: React.FC<{
  zodiac: DongHoZodiacMeta;
  large?: boolean;
  onClick?: () => void;
}> = ({ zodiac, large = false, onClick }) => {
  const INK = '#171310';
  const DIEP_WHITE = '#F5EFE0';
  const SON = '#8D281B';
  const HOE = '#E1AD36';
  const LUC = '#2B5834';
  const TERRA = '#E4B395';
  const isHoeBg = zodiac.paperTone === 'hoe-gold';
  const uid = `dh-${zodiac.key}-${zodiac.month}-${large ? 'lg' : 'sm'}`;

  return (
    <div
      onClick={onClick}
      className={`relative flex-shrink-0 overflow-hidden select-none transition-transform ${
        large ? 'w-full max-w-[460px] rounded-md shadow-xl' : 'rounded-sm shadow-sm hover:scale-[1.03] cursor-pointer'
      }`}
      style={
        large
          ? { aspectRatio: '220 / 156', backgroundColor: isHoeBg ? '#DFC252' : '#ECE6D4' }
          : { width: 172, height: 122, backgroundColor: isHoeBg ? '#DFC252' : '#ECE6D4' }
      }
      title={`${zodiac.paintingTitle} (${zodiac.hanNom.join('')}) — Nhấn để phóng to Triển lãm 12 Tranh Đông Hồ`}
      data-testid={large ? 'dong-ho-zodiac-large' : 'dong-ho-zodiac-emblem'}
      data-zodiac-key={zodiac.key}
      data-zodiac-month={zodiac.month}
    >
      <svg
        viewBox="0 0 220 156"
        className="w-full h-full block"
        role="img"
        aria-label={`Tranh dân gian Đông Hồ: ${zodiac.paintingTitle}`}
      >
        <defs>
          {/* Giấy Dó quét Hồ Điệp / Hoa Hòe */}
          <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="1" y2="1">
            {isHoeBg ? (
              <>
                <stop offset="0%" stopColor="#E4C85E" />
                <stop offset="50%" stopColor="#D8B949" />
                <stop offset="100%" stopColor="#CCA83B" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#F2ECE0" />
                <stop offset="55%" stopColor="#EAE3D2" />
                <stop offset="100%" stopColor="#DED4BE" />
              </>
            )}
          </linearGradient>

          {/* Kết cấu vệt chổi lá thông quét ngang nổi gân + lấp lánh vỏ sò điệp */}
          <pattern id={`${uid}-diep-brush`} width="72" height="10" patternUnits="userSpaceOnUse">
            <line
              x1="0"
              y1="2"
              x2="72"
              y2="1.7"
              stroke={isHoeBg ? '#C6A334' : '#D5C9AE'}
              strokeWidth="0.95"
              opacity="0.72"
            />
            <line
              x1="4"
              y1="5.1"
              x2="70"
              y2="5.4"
              stroke={isHoeBg ? '#F2DC83' : '#FBF8EF'}
              strokeWidth="0.85"
              opacity="0.68"
            />
            <line
              x1="0"
              y1="8.3"
              x2="72"
              y2="8.0"
              stroke={isHoeBg ? '#BE9B2F' : '#CFC3A6'}
              strokeWidth="0.65"
              opacity="0.6"
            />
            <circle cx="14" cy="3.4" r="0.55" fill="#FFFDF6" opacity="0.85" />
            <circle cx="38" cy="6.8" r="0.65" fill="#FFFDF6" opacity="0.78" />
            <circle cx="59" cy="2.6" r="0.45" fill="#FFFDF6" opacity="0.82" />
            <circle cx="26" cy="8.9" r="0.45" fill="#FFFDF6" opacity="0.7" />
          </pattern>

          {/* Họa tiết Gấm Hoa Thị Lục Giác (như yên ngựa Thánh Gióng) */}
          <pattern id={`${uid}-brocade`} width="14" height="14" patternUnits="userSpaceOnUse">
            <rect width="14" height="14" fill={HOE} />
            <polygon
              points="7,0.8 13,4.2 13,9.8 7,13.2 1,9.8 1,4.2"
              fill="none"
              stroke={INK}
              strokeWidth="1.05"
            />
            <circle cx="7" cy="7" r="2.2" fill={SON} stroke={INK} strokeWidth="0.6" />
            <circle cx="7" cy="7" r="0.8" fill={DIEP_WHITE} />
          </pattern>

          {/* Bộ lọc nét khắc bản gỗ thị mộc mạc (nhẹ vừa đủ sắc nét) */}
          <filter id={`${uid}-woodcut`} x="-4%" y="-4%" width="108%" height="108%">
            <feTurbulence type="fractalNoise" baseFrequency="0.085" numOctaves="2" seed={zodiac.month * 7} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.75" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* 1. LỚP NỀN GIẤY ĐIỆP CHỔI LÁ THÔNG */}
        <rect x="0" y="0" width="220" height="156" fill={`url(#${uid}-paper)`} />
        <rect x="0" y="0" width="220" height="156" fill={`url(#${uid}-diep-brush)`} />

        {/* 2. KHUNG VIỀN MỰC TÀU KHẮC VÁN GỖ THỦ CÔNG (như Vinh Quy Bái Tổ) */}
        <path
          d="M 8 8 Q 110 7.2 212 8.5 Q 213 78 211.5 147.5 Q 110 148.8 7.5 147 Q 6.8 78 8 8 Z"
          fill="none"
          stroke={INK}
          strokeWidth="2.4"
          strokeLinejoin="round"
          filter={`url(#${uid}-woodcut)`}
        />

        {/* 3. CHỮ HÁN-NÔM KHẮC MỘC TRỰC TIẾP TRÊN GIẤY ĐIỆP & TRIỆN ĐÔNG HỒ */}
        <g transform="translate(26, 20)" filter={`url(#${uid}-woodcut)`}>
          <text
            x="0"
            y="14"
            fontSize="16"
            fontWeight="900"
            fill={INK}
            fontFamily="'Noto Serif', 'PMingLiU', 'SimSun', serif"
            opacity="0.92"
          >
            {zodiac.hanNom[0]}
          </text>
          <text
            x="0"
            y="32"
            fontSize="16"
            fontWeight="900"
            fill={INK}
            fontFamily="'Noto Serif', 'PMingLiU', 'SimSun', serif"
            opacity="0.92"
          >
            {zodiac.hanNom[1]}
          </text>
        </g>

        {/* Triện đỏ khắc ván góc phải trên */}
        <g transform="translate(187, 15)" filter={`url(#${uid}-woodcut)`}>
          <rect x="0" y="0" width="16" height="24" fill={SON} stroke={INK} strokeWidth="0.9" opacity="0.9" />
          <text x="8" y="10.5" textAnchor="middle" fontSize="6.5" fontWeight="800" fill={DIEP_WHITE} fontFamily="serif">
            {zodiac.chiName.toUpperCase()}
          </text>
          <line x1="2.5" y1="13" x2="13.5" y2="13" stroke={DIEP_WHITE} strokeWidth="0.6" opacity="0.85" />
          <text x="8" y="21" textAnchor="middle" fontSize="5.4" fontWeight="700" fill={DIEP_WHITE} fontFamily="serif">
            東湖
          </text>
        </g>

        {/* 4. GÒ ĐẤT SON/LỤC & BỤI CỎ KHẮC MỘC CHÂN TRANH */}
        <DongHoEarthyMoundBase ink={INK} son={SON} luc={LUC} diep={DIEP_WHITE} />

        {/* 5. CHỦ THỂ 12 LINH THÚ KHẮC GỖ ĐÔNG HỒ (ĐẦY ĐỦ RĂNG LƯỢC, GẤM LỤC GIÁC, VÂN KHÁNH, SEN ĐỎ) */}
        <g filter={`url(#${uid}-woodcut)`}>
          {zodiac.key === 'rat' && (
            /* THÁNG 1: ĐÁM CƯỚI CHUỘT — Chuột quan áo bào gấm, mũ cánh chuồn, thổi kèn trước cờ lọng */
            <g>
              {/* Ngọn cờ lễ rước phấp phới (kiểu Vinh Quy Bái Tổ) */}
              <line x1="56" y1="133" x2="51" y2="28" stroke={INK} strokeWidth="2.3" />
              <path
                d="M51 28 C34 26, 23 31, 20 55 C34 58, 46 57, 52 51 Z"
                fill={SON}
                stroke={INK}
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <rect x="27" y="34" width="17" height="14" fill="none" stroke={DIEP_WHITE} strokeWidth="1.5" />
              <path d="M22 30 L14 25 M21 37 L13 35 M20 44 L12 45 M21 51 L15 55" stroke={INK} strokeWidth="1.9" strokeLinecap="round" />

              {/* Đuôi chuột dài uốn cong khắc răng lược */}
              <path d="M62 110 C42 112, 34 86, 46 74 C52 68, 59 73, 54 79" stroke={INK} strokeWidth="3.8" fill="none" strokeLinecap="round" />
              {/* Áo bào đỏ son viền gấm lục giác */}
              <path
                d="M62 114 C60 80, 82 65, 114 67 C134 69, 144 86, 138 114 L128 134 L72 134 Z"
                fill={SON}
                stroke={INK}
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {/* Dải yếm gấm hoa thị lục giác & vân khánh */}
              <path d="M80 71 Q104 83 128 71 L122 93 Q104 103 86 93 Z" fill={`url(#${uid}-brocade)`} stroke={INK} strokeWidth="2.2" />
              {/* Khắc răng lược gấu áo */}
              <path
                d="M77 129 V134 M83 129 V134 M89 129 V134 M95 129 V134 M101 129 V134 M107 129 V134 M113 129 V134 M119 129 V134"
                stroke={DIEP_WHITE}
                strokeWidth="1.6"
              />
              <DongHoYinYangSwirl cx={92} cy={109} r={9} ink={INK} light={DIEP_WHITE} />

              {/* Tai chuột kép & Đầu */}
              <circle cx="114" cy="43" r="13.5" fill={DIEP_WHITE} stroke={INK} strokeWidth="2.8" />
              <circle cx="114" cy="43" r="6.8" fill={TERRA} stroke={INK} strokeWidth="1.6" />
              <path
                d="M107 52 C118 38, 152 40, 168 58 C154 68, 124 72, 107 62 Z"
                fill={DIEP_WHITE}
                stroke={INK}
                strokeWidth="2.8"
                strokeLinejoin="round"
              />
              {/* Nét khắc răng lược dưới cằm chuột */}
              <path d="M116 64 L118 68 M122 65 L124 69 M128 65 L130 69 M134 65 L136 69 M140 64 L142 68" stroke={INK} strokeWidth="1.5" />
              {/* Mũ cánh chuồn xanh lục */}
              <path d="M110 43 L127 26 L142 42 Z" fill={LUC} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M101 37 C89 31, 88 41, 104 42" fill={LUC} stroke={INK} strokeWidth="2" />
              {/* Kèn đồng lễ cưới */}
              <path d="M138 79 L186 58 L192 73 L140 87 Z" fill={HOE} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
              {/* Mắt, mũi son & ria khắc mộc */}
              <ellipse cx="137" cy="52" rx="4.2" ry="2.8" fill={DIEP_WHITE} stroke={INK} strokeWidth="2" />
              <circle cx="138" cy="52" r="1.7" fill={INK} />
              <circle cx="166" cy="57" r="3.5" fill={SON} stroke={INK} strokeWidth="2" />
              <path d="M159 61 L176 62 M158 65 L174 71" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
              {/* Chân bước */}
              <path d="M84 134 L76 140 L89 140 M116 134 L126 140 L137 140" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" />
            </g>
          )}

          {zodiac.key === 'ox' && (
            /* THÁNG 2: MỤC ĐỒNG THỔI SÁO — Trâu mộng khắc răng lược, em bé áo nâu son cưỡi lưng thổi sáo */
            <g>
              {/* Mây vàng Đông Hồ */}
              <path d="M22 44 C30 33, 47 34, 52 42 C60 39, 67 45, 62 51 L22 50 Z" fill={HOE} stroke={INK} strokeWidth="2.1" />
              {/* Bốn chân trâu khắc gân */}
              <path
                d="M58 104 L52 138 L61 138 L68 106 M78 106 L75 138 L85 138 L88 106 M124 104 L121 138 L131 138 L134 104 M144 102 L149 138 L159 138 L154 101"
                fill="#403B37"
                stroke={INK}
                strokeWidth="2.6"
                strokeLinejoin="round"
              />
              {/* Đuôi trâu */}
              <path d="M44 76 C30 82, 30 109, 39 119" stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
              <path d="M39 119 C34 127, 44 129, 44 119 Z" fill={INK} />
              {/* Thân trâu đồ sộ */}
              <path
                d="M42 80 C44 58, 78 53, 118 57 C142 60, 158 66, 160 87 C157 107, 134 111, 98 110 C64 110, 41 100, 42 80 Z"
                fill="#4E4843"
                stroke={INK}
                strokeWidth="3.1"
              />
              {/* Nét khắc răng lược song song dọc ức & bụng trâu (kiểu Em bé ôm vịt) */}
              <path
                d="M56 105 L58 112 M62 106 L64 113 M68 107 L70 114 M74 108 L76 115 M80 108 L82 115 M86 108 L88 115 M92 108 L94 115 M98 108 L100 115 M104 108 L106 115 M110 108 L112 115 M116 107 L118 114"
                stroke={DIEP_WHITE}
                strokeWidth="1.7"
              />
              <DongHoYinYangSwirl cx={82} cy={83} r={11.5} ink={INK} light={DIEP_WHITE} />

              {/* Đứa trẻ mục đồng (mặt hồng đất nét Đông Hồ như Em bé ôm vịt) */}
              <path d="M95 57 L116 57 L113 38 L97 38 Z" fill={SON} stroke={INK} strokeWidth="2.4" />
              <path d="M97 41 Q105 46 113 41" stroke={LUC} strokeWidth="3.2" fill="none" />
              <circle cx="105" cy="30" r="8.5" fill={TERRA} stroke={INK} strokeWidth="2.4" />
              <path d="M100 28 H103 M107 28 H110 M103 33 Q105 35 108 33" stroke={INK} strokeWidth="1.5" strokeLinecap="round" fill="none" />
              {/* Nón lá vàng hoa hòe */}
              <path d="M91 25 L105 13 L119 25 Z" fill={HOE} stroke={INK} strokeWidth="2.3" strokeLinejoin="round" />
              {/* Ống sáo trúc xanh lá chàm */}
              <line x1="104" y1="32" x2="132" y2="35" stroke={LUC} strokeWidth="3" strokeLinecap="round" />

              {/* Đầu trâu & Cặp sừng bán nguyệt khắc vân */}
              <path d="M148 63 C162 52, 184 60, 190 78 C189 89, 173 94, 156 88 Z" fill="#46403B" stroke={INK} strokeWidth="2.8" />
              <path
                d="M153 57 C140 36, 155 24, 167 32 C159 35, 156 44, 161 54 Z"
                fill={DIEP_WHITE}
                stroke={INK}
                strokeWidth="2.6"
              />
              <path
                d="M167 57 C177 36, 196 35, 196 49 C188 45, 180 50, 175 61 Z"
                fill={DIEP_WHITE}
                stroke={INK}
                strokeWidth="2.6"
              />
              {/* Khắc răng lược trên sừng & mặt trâu */}
              <path d="M150 48 H157 M151 42 H158 M185 41 L191 45 M182 47 L188 51" stroke={INK} strokeWidth="1.4" />
              <circle cx="186" cy="86" r="5" fill="none" stroke={HOE} strokeWidth="2.6" />
              <ellipse cx="169" cy="69" rx="4.2" ry="2.8" fill={DIEP_WHITE} stroke={INK} strokeWidth="1.8" />
              <circle cx="170" cy="69" r="1.6" fill={INK} />
            </g>
          )}

          {zodiac.key === 'tiger' && (
            /* THÁNG 3: NGŨ HỔ THẦN TƯỚNG — Hoàng Hổ uy nghi gấm lục giác, vân lửa son, răng lược ức */
            <g>
              {/* Ngọn lửa & Mây cuộn son đỏ bên hổ (phong cách Thánh Gióng) */}
              <path d="M174 96 C192 92, 198 72, 184 58 C186 70, 176 74, 172 64 C168 78, 160 88, 174 96 Z" fill={SON} stroke={INK} strokeWidth="2.2" />
              {/* Đuôi hổ uốn cong khắc vằn */}
              <path d="M46 108 C22 103, 18 62, 42 56 C55 53, 59 67, 49 72" stroke={INK} strokeWidth="7" fill="none" strokeLinecap="round" />
              <path d="M46 108 C22 103, 18 62, 42 56 C55 53, 59 67, 49 72" stroke={HOE} strokeWidth="4" fill="none" strokeLinecap="round" />

              {/* Thân hổ chầu bọc giáp gấm hoa hòe */}
              <path
                d="M46 112 C46 78, 74 63, 114 64 C142 66, 154 84, 150 112 L144 136 L130 136 L127 115 L76 115 L70 136 L55 136 Z"
                fill={HOE}
                stroke={INK}
                strokeWidth="3.1"
                strokeLinejoin="round"
              />
              {/* Đệm yên gấm hoa thị lục giác trên lưng hổ */}
              <path d="M74 65 L122 65 L117 92 L79 92 Z" fill={`url(#${uid}-brocade)`} stroke={INK} strokeWidth="2.2" />
              {/* Vằn hổ & răng lược bụng */}
              <path d="M58 76 C63 86, 56 97, 63 106 M132 75 C137 85, 130 96, 136 106" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
              <path
                d="M80 115 L81 122 M86 115 L87 122 M92 115 L93 122 M98 115 L99 122 M104 115 L105 122 M110 115 L111 122 M116 115 L117 122 M122 115 L123 122"
                stroke={INK}
                strokeWidth="1.6"
              />
              <DongHoYinYangSwirl cx={97} cy={101} r={9} ink={SON} light={DIEP_WHITE} />

              {/* Bờm ức trắng vỏ điệp khắc răng lược */}
              <path d="M132 68 C148 74, 156 90, 145 103 C131 106, 126 89, 132 68 Z" fill={DIEP_WHITE} stroke={INK} strokeWidth="2.5" />
              <path d="M136 74 H143 M137 80 H145 M137 86 H146 M136 92 H144" stroke={INK} strokeWidth="1.5" />

              {/* Đầu Hổ uy nghi trán chữ Vương 王 */}
              <circle cx="154" cy="59" r="23" fill={HOE} stroke={INK} strokeWidth="3.1" />
              <path d="M134 42 L130 29 L144 37 Z M174 42 L178 29 L164 37 Z" fill={SON} stroke={INK} strokeWidth="2.5" />
              <path d="M147 41 H161 M148 46.5 H160 M147 52 H161 M154 41 V52" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
              {/* Mắt xếch khắc mộc */}
              <path d="M139 56 Q145 52 150 56 Q145 60 139 56 Z M158 56 Q164 52 169 56 Q164 60 158 56 Z" fill={DIEP_WHITE} stroke={INK} strokeWidth="2" />
              <circle cx="144.5" cy="56" r="1.8" fill={INK} />
              <circle cx="163.5" cy="56" r="1.8" fill={INK} />
              <ellipse cx="154" cy="67" rx="8.5" ry="5.8" fill={DIEP_WHITE} stroke={INK} strokeWidth="2" />
              <polygon points="150,64 158,64 154,69" fill={SON} />
              <path d="M135 66 L122 63 M135 70 L122 73 M173 66 L186 63 M173 70 L186 73" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
              <path d="M150 112 L166 137 L148 137 L143 116" fill={HOE} stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
            </g>
          )}

          {zodiac.key === 'cat' && (
            /* THÁNG 4: MÈO NGOẠM CÁ — Yếm vân khánh lục giác, cá chép khắc vây răng lược, hoa sen đỏ */
            <g>
              {/* Đóa sen đỏ bên trái (phong cách Phú Quý) */}
              <path d="M40 128 C34 106, 46 92, 54 88 C61 95, 67 109, 59 124 Z" fill={SON} stroke={INK} strokeWidth="2.3" />
              <path d="M46 119 L49 95 M52 119 L54 92 M57 119 L59 99" stroke={DIEP_WHITE} strokeWidth="1.4" />
              <path d="M48 130 C32 126, 26 114, 34 109 C44 109, 52 119, 48 130 Z" fill={LUC} stroke={INK} strokeWidth="2" />

              {/* Đuôi mèo cuộn */}
              <path d="M56 116 C32 116, 35 74, 56 71 C66 70, 67 82, 58 84" stroke={INK} strokeWidth="7" fill="none" strokeLinecap="round" />
              <path d="M56 116 C32 116, 35 74, 56 71 C66 70, 67 82, 58 84" stroke="#D99B2B" strokeWidth="4" fill="none" strokeLinecap="round" />

              {/* Thân mèo ngồi vững chãi */}
              <path
                d="M60 124 C57 86, 79 67, 108 69 C130 72, 138 97, 132 124 L121 138 L68 138 Z"
                fill="#D99B2B"
                stroke={INK}
                strokeWidth="3.1"
              />
              {/* Bụng điệp khắc răng lược */}
              <ellipse cx="103" cy="108" rx="17" ry="20" fill={DIEP_WHITE} stroke={INK} strokeWidth="2.2" />
              <path d="M90 100 L85 101 M89 106 L84 107 M90 112 L85 113 M116 100 L121 101 M117 106 L122 107 M116 112 L121 113" stroke={INK} strokeWidth="1.5" />
              <DongHoYinYangSwirl cx={80} cy={98} r={9.5} ink={INK} light={DIEP_WHITE} />

              {/* Vòng cổ vân khánh đỏ-lục (kiểu Em bé ôm vịt) */}
              <path d="M81 71 Q106 83 130 70 L124 81 Q106 89 87 81 Z" fill={SON} stroke={INK} strokeWidth="2.1" />
              <path d="M92 78 C95 83, 101 83, 104 78 C108 83, 114 83, 117 78" stroke={DIEP_WHITE} strokeWidth="1.8" fill="none" />
              <circle cx="106" cy="83" r="4.5" fill={HOE} stroke={INK} strokeWidth="2" />

              {/* Đầu mèo & Tai */}
              <path d="M86 43 L78 21 L99 35 Z M126 43 L134 21 L113 35 Z" fill="#D99B2B" stroke={INK} strokeWidth="2.7" strokeLinejoin="round" />
              <path d="M87 38 L83 27 L94 34 Z M125 38 L129 27 L118 34 Z" fill={SON} />
              <circle cx="106" cy="52" r="20" fill="#D99B2B" stroke={INK} strokeWidth="3.1" />
              <ellipse cx="98" cy="49" rx="4.5" ry="3.4" fill={DIEP_WHITE} stroke={INK} strokeWidth="2" />
              <ellipse cx="114" cy="49" rx="4.5" ry="3.4" fill={DIEP_WHITE} stroke={INK} strokeWidth="2" />
              <line x1="98" y1="46.5" x2="98" y2="51.5" stroke={INK} strokeWidth="2.1" strokeLinecap="round" />
              <line x1="114" y1="46.5" x2="114" y2="51.5" stroke={INK} strokeWidth="2.1" strokeLinecap="round" />

              {/* Cá chép xanh lục khắc vây răng lược ngoạm ngang miệng */}
              <path d="M107 60 C130 53, 158 60, 174 73 C156 81, 128 79, 107 65 Z" fill={LUC} stroke={INK} strokeWidth="2.6" />
              <polygon points="171,73 186,61 183,83" fill={SON} stroke={INK} strokeWidth="2.3" />
              <path d="M132 62 Q136 67 132 72 M141 62 Q145 67 141 72 M150 63 Q154 68 150 73 M175 69 L183 66 M175 73 L184 73 M175 77 L182 79" stroke={DIEP_WHITE} strokeWidth="1.6" fill="none" />
            </g>
          )}

          {zodiac.key === 'dragon' && (
            /* THÁNG 5: LONG CHẦU NHẬT — Thanh Long vảy gấm chầu Nhật Ngọc rực lửa son & mây ngũ sắc */
            <g>
              {/* Nhật Ngọc đỏ son bốc lửa (kiểu mây lửa Thánh Gióng) */}
              <circle cx="164" cy="47" r="14" fill={SON} stroke={INK} strokeWidth="2.8" />
              <circle cx="164" cy="47" r="6.5" fill={HOE} />
              <path d="M156 31 C160 19, 170 20, 172 31 C180 26, 188 34, 179 40" stroke={SON} strokeWidth="3.2" fill="none" strokeLinecap="round" />

              {/* Thân rồng chữ S khắc gỗ */}
              <path
                d="M32 117 C42 87, 74 82, 84 101 C95 120, 128 117, 136 92 C142 75, 119 64, 116 49"
                stroke={INK}
                strokeWidth="20"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M32 117 C42 87, 74 82, 84 101 C95 120, 128 117, 136 92 C142 75, 119 64, 116 49"
                stroke={LUC}
                strokeWidth="13.5"
                fill="none"
                strokeLinecap="round"
              />
              {/* Bụng rồng đốt trắng điệp & gấm vảy */}
              <path
                d="M35 121 C45 92, 73 88, 82 105 C92 123, 125 121, 133 96"
                stroke={DIEP_WHITE}
                strokeWidth="3.2"
                strokeDasharray="3 4"
                fill="none"
              />
              {/* Sống lưng vây lửa vàng hoa hòe */}
              <path
                d="M30 104 L38 90 L47 95 L56 80 L67 86 L77 77 L86 92 L98 103 L111 106 L123 98 L133 84"
                stroke={HOE}
                strokeWidth="3.2"
                fill="none"
                strokeLinejoin="round"
              />
              {/* Đầu rồng thần uy nghi */}
              <path d="M92 39 C103 27, 134 28, 142 46 L131 58 L97 56 Z" fill={LUC} stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
              <path d="M100 31 C89 19, 78 24, 85 32 M109 29 C103 16, 95 19, 99 28" stroke={HOE} strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M138 42 Q148 39 153 33" stroke={SON} strokeWidth="2.6" fill="none" strokeLinecap="round" />
              <circle cx="119" cy="40" r="3.4" fill={DIEP_WHITE} stroke={INK} strokeWidth="1.8" />
              <circle cx="119.8" cy="40" r="1.6" fill={INK} />
              <DongHoYinYangSwirl cx={62} cy={97} r={8.5} ink={INK} light={DIEP_WHITE} />
              {/* Cụm mây ngũ sắc dưới rồng */}
              <path d="M148 122 C156 108, 174 109, 179 119 C187 116, 195 123, 190 129 L146 129 Z" fill={HOE} stroke={INK} strokeWidth="2.2" />
            </g>
          )}

          {zodiac.key === 'snake' && (
            /* THÁNG 6: LINH XÀ KHẮC MỘC — Rắn cuộn chữ S gấm hoa thị bên khóm trúc & hoa sen son */
            <g>
              {/* Khóm trúc & sen đỏ */}
              <path d="M158 134 V56 M168 134 V72" stroke={LUC} strokeWidth="3.4" />
              <path d="M155 74 H161 M165 92 H171 M155 108 H161" stroke={INK} strokeWidth="1.8" />
              <ellipse cx="147" cy="76" rx="8.5" ry="3.1" transform="rotate(-22 147 76)" fill={LUC} stroke={INK} strokeWidth="1.4" />
              <ellipse cx="177" cy="64" rx="8.5" ry="3.1" transform="rotate(20 177 64)" fill={LUC} stroke={INK} strokeWidth="1.4" />
              <path d="M170 57 C165 44, 176 36, 181 33 C186 38, 192 48, 184 58 Z" fill={SON} stroke={INK} strokeWidth="2.1" />
              <path d="M175 54 L177 38 M180 54 L182 40" stroke={DIEP_WHITE} strokeWidth="1.2" />

              {/* Thân rắn cuộn nhịp nhàng */}
              <path
                d="M44 117 C44 89, 134 97, 131 119 C129 135, 61 132, 63 110 C66 86, 118 81, 115 59 C112 44, 84 44, 84 59"
                stroke={INK}
                strokeWidth="18"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M44 117 C44 89, 134 97, 131 119 C129 135, 61 132, 63 110 C66 86, 118 81, 115 59 C112 44, 84 44, 84 59"
                stroke={LUC}
                strokeWidth="11.5"
                fill="none"
                strokeLinecap="round"
              />
              {/* Hoa văn vảy lục giác vàng hoa hòe */}
              <path d="M55 117 L66 110 L76 118 M88 124 L100 118 L111 125 M74 99 L87 93 L99 100" stroke={HOE} strokeWidth="2.8" fill="none" />
              {/* Đầu rắn có mào đỏ */}
              <path d="M71 53 C71 39, 96 39, 101 55 C95 65, 76 65, 71 53 Z" fill={LUC} stroke={INK} strokeWidth="2.8" />
              <path d="M84 41 L92 29 L96 42" fill={SON} stroke={INK} strokeWidth="2.1" />
              <circle cx="80" cy="51" r="2.9" fill={DIEP_WHITE} stroke={INK} strokeWidth="1.6" />
              <circle cx="79.5" cy="51" r="1.4" fill={INK} />
              <path d="M69 56 L56 59 L52 54 M56 59 L52 63" stroke={SON} strokeWidth="2.3" strokeLinecap="round" fill="none" />
              <DongHoYinYangSwirl cx={96} cy={115} r={8.5} ink={INK} light={DIEP_WHITE} />
            </g>
          )}

          {zodiac.key === 'horse' && (
            /* THÁNG 7: THÁNH GIÓNG VINH QUY — Bạch mã phi nước đại, yên gấm lục giác hoa thị, khóm tre & mây lửa son */
            <g>
              {/* Mây ngũ sắc góc trái & lửa son bên phải (y như tranh mẫu 1 Thánh Gióng!) */}
              <path d="M18 134 C25 119, 44 118, 49 128 C58 124, 66 130, 62 137 L18 137 Z" fill={LUC} stroke={INK} strokeWidth="2" />
              <path d="M180 86 C195 79, 200 62, 189 48 C191 60, 182 65, 178 55 C173 68, 166 78, 180 86 Z" fill={SON} stroke={INK} strokeWidth="2.1" />
              <path d="M150 38 C156 26, 174 26, 178 36 C185 33, 190 40, 184 45 L150 45 Z" fill={SON} stroke={INK} strokeWidth="2" />
              {/* Khóm tre vàng nhổ gốc phía sau */}
              <path d="M52 46 L112 72" stroke={HOE} strokeWidth="4.6" strokeLinecap="round" />
              <path d="M52 46 L112 72" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeDasharray="10 3" />
              <path d="M52 46 L42 39 M52 46 L41 46 M52 46 L45 53" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
              <ellipse cx="88" cy="49" rx="7" ry="2.3" transform="rotate(-28 88 49)" fill={LUC} stroke={INK} strokeWidth="1.1" />
              <ellipse cx="97" cy="56" rx="7" ry="2.3" transform="rotate(-18 97 56)" fill={LUC} stroke={INK} strokeWidth="1.1" />

              {/* Đuôi ngựa xanh chàm khắc sóng */}
              <path d="M62 79 C42 69, 39 54, 48 45 C56 58, 61 69, 67 76 Z" fill={LUC} stroke={INK} strokeWidth="2.4" />
              <path d="M52 54 Q57 63 63 72" stroke={DIEP_WHITE} strokeWidth="1.4" fill="none" />

              {/* Bốn chân bạch mã tung vó */}
              <path
                d="M68 97 L46 123 L53 128 L77 101 M136 93 L169 102 L168 109 L133 101 M141 102 L166 119 L161 126 L133 109"
                fill={DIEP_WHITE}
                stroke={INK}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Thân Bạch Mã vỏ điệp */}
              <path
                d="M62 84 C65 67, 98 65, 132 69 C149 72, 155 88, 143 103 C118 109, 82 109, 62 84 Z"
                fill={DIEP_WHITE}
                stroke={INK}
                strokeWidth="2.9"
              />
              {/* Cổ & Đầu Bạch Mã vươn cao, bờm khắc răng lược song song */}
              <path d="M126 70 L138 44 L158 49 L144 82 Z" fill={DIEP_WHITE} stroke={INK} strokeWidth="2.7" strokeLinejoin="round" />
              <path d="M124 66 L133 48 M128 60 L119 60 M131 54 L122 54 M134 48 L125 48" stroke={INK} strokeWidth="2.1" strokeLinecap="round" />
              <path d="M138 44 L148 34 L152 43 L172 56 L166 66 L146 61 Z" fill={DIEP_WHITE} stroke={INK} strokeWidth="2.7" strokeLinejoin="round" />
              <circle cx="151" cy="49" r="2.7" fill={DIEP_WHITE} stroke={INK} strokeWidth="1.7" />
              <circle cx="151.6" cy="49" r="1.3" fill={INK} />

              {/* Tấm lót yên gấm lục giác hoa thị & tua khắc răng lược (trung tâm bức Thánh Gióng!) */}
              <circle cx="107" cy="95" r="17" fill={INK} />
              <circle cx="107" cy="95" r="13.5" fill={`url(#${uid}-brocade)`} stroke={LUC} strokeWidth="2.2" />
              {/* Tua yên ngựa răng lược buông xuống */}
              <path d="M88 108 L83 122 M93 109 L88 123 M98 110 L93 124 M103 111 L98 125 M108 111 L103 125" stroke={INK} strokeWidth="1.9" strokeLinecap="round" />

              {/* Vòng cổ vân khánh đen điểm trắng trên ức ngựa */}
              <path d="M131 75 Q143 82 152 75 L150 85 Q141 90 130 84 Z" fill={INK} />
              <circle cx="135" cy="80" r="1.6" fill={DIEP_WHITE} />
              <circle cx="141" cy="82" r="1.6" fill={DIEP_WHITE} />
              <circle cx="147" cy="80" r="1.6" fill={DIEP_WHITE} />

              {/* Tướng quân áo lục giáp son cưỡi ngựa */}
              <path d="M96 69 L92 43 L115 41 L118 69 Z" fill={LUC} stroke={INK} strokeWidth="2.4" />
              <path d="M98 49 Q107 58 115 49 L114 63 Q106 67 99 63 Z" fill={SON} stroke={INK} strokeWidth="1.9" />
              <circle cx="106" cy="31" r="8.5" fill={DIEP_WHITE} stroke={INK} strokeWidth="2.3" />
              <path d="M99 27 Q107 20 115 27" stroke={INK} strokeWidth="3.2" fill="none" />
              <circle cx="109" cy="31" r="1.4" fill={INK} />
            </g>
          )}

          {zodiac.key === 'goat' && (
            /* THÁNG 8: TAM DƯƠNG KHAI THÁI — Dê trắng vỏ điệp sừng xoắn, lông ức & bụng khắc răng lược */
            <g>
              {/* Chân dê mảnh khỏe */}
              <path d="M64 104 L59 136 M81 104 L78 136 M121 104 L124 136 M137 104 L142 136" stroke={INK} strokeWidth="4.4" strokeLinecap="round" />
              {/* Thân dê trắng vỏ điệp */}
              <path
                d="M54 88 C54 63, 84 59, 127 63 C146 66, 154 83, 146 102 C125 110, 76 110, 54 88 Z"
                fill={DIEP_WHITE}
                stroke={INK}
                strokeWidth="3.1"
              />
              {/* Nét khắc răng lược dọc lông bụng & lưng dê */}
              <path
                d="M66 102 L67 109 M73 104 L74 111 M80 105 L81 112 M87 106 L88 113 M94 106 L95 113 M101 106 L102 113 M108 106 L109 113 M115 105 L116 112 M122 104 L123 111"
                stroke={INK}
                strokeWidth="1.7"
              />
              <DongHoYinYangSwirl cx={87} cy={84} r={10.5} ink={SON} light={DIEP_WHITE} />
              {/* Đuôi dê nhỏ */}
              <path d="M54 80 C43 74, 42 86, 53 88" fill={DIEP_WHITE} stroke={INK} strokeWidth="2.6" />
              {/* Cổ đeo vòng đỏ & Đầu dê sừng xoắn */}
              <path d="M126 67 L142 38 L173 50 L166 64 L141 77 Z" fill={DIEP_WHITE} stroke={INK} strokeWidth="2.9" strokeLinejoin="round" />
              <path d="M144 38 C134 19, 113 22, 116 37 C118 30, 132 29, 137 41" fill={HOE} stroke={INK} strokeWidth="2.7" strokeLinejoin="round" />
              <path d="M152 38 C152 19, 172 20, 170 35" fill="none" stroke={INK} strokeWidth="3.3" strokeLinecap="round" />
              {/* Râu dê khắc răng lược & Vòng cổ vân khánh */}
              <path d="M162 63 C166 77, 158 83, 155 72 Z" fill={HOE} stroke={INK} strokeWidth="2.1" />
              <path d="M127 68 Q138 75 148 68" stroke={SON} strokeWidth="4.5" fill="none" />
              <circle cx="155" cy="50" r="2.9" fill={DIEP_WHITE} stroke={INK} strokeWidth="1.8" />
              <circle cx="155.8" cy="50" r="1.4" fill={INK} />
            </g>
          )}

          {zodiac.key === 'monkey' && (
            /* THÁNG 9: HẦU VƯƠNG DÂNG ĐÀO — Yếm gấm lục giác, đào tiên son đỏ & lá lục */
            <g>
              {/* Đuôi uốn cong */}
              <path d="M64 111 C34 108, 30 62, 52 57 C64 54, 65 68, 56 71" stroke={INK} strokeWidth="6.4" fill="none" strokeLinecap="round" />
              <path d="M64 111 C34 108, 30 62, 52 57 C64 54, 65 68, 56 71" stroke="#B96428" strokeWidth="3.3" fill="none" strokeLinecap="round" />
              {/* Thân khỉ ngồi gập gối */}
              <path
                d="M64 115 C62 82, 84 65, 111 71 C130 76, 135 101, 124 123 L62 132 Z"
                fill="#B96428"
                stroke={INK}
                strokeWidth="3.1"
              />
              {/* Áo yếm gấm lục giác & Xoáy Âm Dương */}
              <path d="M76 74 Q94 86 114 75 L110 95 Q94 102 79 95 Z" fill={`url(#${uid}-brocade)`} stroke={INK} strokeWidth="2" />
              <DongHoYinYangSwirl cx={85} cy={104} r={9} ink={INK} light={DIEP_WHITE} />
              {/* Khắc răng lược lông khỉ dọc đùi & tay */}
              <path d="M67 125 L70 131 M73 125 L76 131 M79 124 L82 130 M85 123 L88 129 M91 122 L94 128" stroke={DIEP_WHITE} strokeWidth="1.6" />

              {/* Đầu khỉ & Hai tai lớn */}
              <circle cx="80" cy="49" r="8.5" fill="#B96428" stroke={INK} strokeWidth="2.5" />
              <circle cx="80" cy="49" r="4.5" fill={TERRA} />
              <circle cx="126" cy="49" r="8.5" fill="#B96428" stroke={INK} strokeWidth="2.5" />
              <circle cx="126" cy="49" r="4.5" fill={TERRA} />
              <circle cx="103" cy="50" r="19.5" fill="#B96428" stroke={INK} strokeWidth="3.1" />
              <path d="M87 48 C87 37, 119 37, 119 48 C120 63, 86 63, 87 48 Z" fill={TERRA} stroke={INK} strokeWidth="2" />
              <circle cx="96" cy="48" r="2.5" fill={INK} />
              <circle cx="110" cy="48" r="2.5" fill={INK} />
              <path d="M97 58 Q103 62 109 58" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />

              {/* Tay dâng Đào Tiên Đỏ Thắm & Lá Xanh Chàm */}
              <path d="M122 83 Q142 88 150 80" stroke="#B96428" strokeWidth="8.5" strokeLinecap="round" fill="none" />
              <path d="M122 83 Q142 88 150 80" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <path
                d="M148 82 C142 60, 161 48, 169 42 C176 52, 188 66, 180 82 C172 95, 153 95, 148 82 Z"
                fill={SON}
                stroke={INK}
                strokeWidth="2.8"
              />
              <path d="M153 79 C151 67, 161 57, 169 51 C170 64, 165 79, 153 79 Z" fill={HOE} opacity="0.78" />
              <path d="M156 89 Q145 101 139 90 Q148 83 156 89 Z M172 89 Q186 101 189 88 Q179 81 172 89 Z" fill={LUC} stroke={INK} strokeWidth="2" />
            </g>
          )}

          {zodiac.key === 'rooster' && (
            /* THÁNG 10: GÀ ĐẠI CÁT HOA HỒNG — Lông đuôi & cánh 3 tầng màu khoáng + răng lược song song (giống cánh vịt Phú Quý!) */
            <g>
              {/* Bộ lông đuôi tam sắc khắc răng lược */}
              <path d="M81 86 C48 61, 31 75, 34 103 C45 84, 62 81, 78 95 Z" fill={LUC} stroke={INK} strokeWidth="2.7" />
              <path d="M86 80 C53 45, 29 51, 27 77 C42 62, 62 65, 81 86 Z" fill={HOE} stroke={INK} strokeWidth="2.7" />
              <path d="M91 77 C64 31, 37 31, 31 53 C51 42, 70 51, 86 80 Z" fill={SON} stroke={INK} strokeWidth="2.7" />

              {/* Chân gà cựa nhọn vàng hoa hòe */}
              <path d="M102 113 L97 137 M88 137 H107 M126 113 L129 137 M120 137 H139" stroke={HOE} strokeWidth="4.6" strokeLinecap="round" />
              <path d="M102 113 L97 137 M88 137 H107 M126 113 L129 137 M120 137 H139" stroke={INK} strokeWidth="1.9" strokeLinecap="round" />

              {/* Thân gà trắng vỏ điệp / vàng hoa hòe & răng lược ngực */}
              <path
                d="M75 88 C78 66, 118 61, 140 77 C154 91, 140 119, 108 119 C83 119, 72 105, 75 88 Z"
                fill={DIEP_WHITE}
                stroke={INK}
                strokeWidth="3.1"
              />
              {/* Nét khắc răng lược chạy viền bụng gà (như bụng vịt bức Phú Quý) */}
              <path
                d="M84 112 L86 118 M91 114 L93 119 M98 115 L100 120 M105 115 L107 120 M112 115 L114 120 M119 114 L121 119 M126 112 L128 118 M133 108 L135 114"
                stroke={INK}
                strokeWidth="1.7"
              />
              {/* Cánh gà 3 tầng lông vũ (son đỏ + lục chàm + hoa hòe — giống hệt cánh vịt Phú Quý!) */}
              <path d="M88 85 C102 78, 124 83, 130 98 C114 106, 94 103, 88 85 Z" fill={SON} stroke={INK} strokeWidth="2.4" />
              <path d="M96 86 C108 82, 122 86, 127 96 L98 95 Z" fill={LUC} stroke={INK} strokeWidth="1.7" />
              <path d="M101 91 C111 89, 120 92, 124 98 L102 99 Z" fill={HOE} stroke={INK} strokeWidth="1.5" />
              <DongHoYinYangSwirl cx={106} cy={95} r={7.5} ink={INK} light={DIEP_WHITE} />

              {/* Cổ & Đầu gà trống vươn cao */}
              <path d="M121 75 C127 50, 141 42, 157 48 C160 61, 146 78, 135 83 Z" fill={HOE} stroke={INK} strokeWidth="2.9" />
              <path d="M127 65 L122 65 M129 60 L124 60 M131 55 L126 55" stroke={INK} strokeWidth="1.6" />
              {/* Mào cờ son 5 răng cưa & tích gà */}
              <path d="M134 46 L131 30 L141 37 L146 26 L151 37 L160 30 L157 46 Z" fill={SON} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M153 59 C157 69, 146 72, 146 61 Z" fill={SON} stroke={INK} strokeWidth="2.1" />
              <polygon points="157,49 175,53 157,58" fill={HOE} stroke={INK} strokeWidth="2.3" strokeLinejoin="round" />
              <circle cx="147" cy="50" r="2.9" fill={DIEP_WHITE} stroke={INK} strokeWidth="1.7" />
              <circle cx="147.8" cy="50" r="1.4" fill={INK} />

              {/* Đóa hoa hồng / búp sen góc phải dưới */}
              <path d="M164 134 C160 118, 171 108, 178 104 C184 111, 189 122, 181 134 Z" fill={SON} stroke={INK} strokeWidth="2.1" />
              <path d="M170 128 L174 110 M176 128 L179 111" stroke={DIEP_WHITE} strokeWidth="1.3" />
            </g>
          )}

          {zodiac.key === 'dog' && (
            /* THÁNG 11: KHUYỂN VÀNG PHÚ QUÝ — Chó vàng cổ đeo yếm vân khánh ngũ sắc, răng lược bụng */
            <g>
              {/* Đuôi lá đề cong */}
              <path d="M64 109 C45 101, 42 77, 58 74 C66 74, 68 85, 61 89" fill={HOE} stroke={INK} strokeWidth="2.9" />
              {/* Thân chó vàng ngồi chầu */}
              <path
                d="M66 120 C64 88, 86 67, 118 69 C137 72, 143 96, 137 123 L134 137 L121 137 L120 115 L88 115 L85 137 L66 137 Z"
                fill={HOE}
                stroke={INK}
                strokeWidth="3.1"
                strokeLinejoin="round"
              />
              {/* Răng lược khắc viền ức & chân */}
              <path d="M128 84 L134 83 M130 90 L136 89 M131 96 L137 95 M131 102 L137 101 M92 115 V121 M98 115 V121 M104 115 V121 M110 115 V121 M116 115 V121" stroke={INK} strokeWidth="1.6" />
              <DongHoYinYangSwirl cx={92} cy={95} r={10} ink={SON} light={DIEP_WHITE} />

              {/* Yếm cổ vân khánh đỏ-lục & chuông vàng */}
              <path d="M102 70 Q120 82 138 69 L134 80 Q119 88 105 80 Z" fill={SON} stroke={INK} strokeWidth="2.2" />
              <path d="M108 77 Q114 82 120 78 Q126 82 132 77" stroke={DIEP_WHITE} strokeWidth="1.8" fill="none" />
              <circle cx="122" cy="83" r="5" fill={DIEP_WHITE} stroke={INK} strokeWidth="2.2" />

              {/* Đầu chó & Tai vểnh */}
              <path d="M104 42 L99 22 L118 35 Z M137 42 L148 23 L145 43 Z" fill={SON} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
              <path
                d="M102 52 C102 35, 142 33, 151 50 C162 51, 164 63, 151 67 C132 71, 102 67, 102 52 Z"
                fill={HOE}
                stroke={INK}
                strokeWidth="3.1"
              />
              <circle cx="157" cy="55" r="4" fill={INK} />
              <circle cx="126" cy="50" r="3.4" fill={DIEP_WHITE} stroke={INK} strokeWidth="1.8" />
              <circle cx="127" cy="50" r="1.6" fill={INK} />
            </g>
          )}

          {zodiac.key === 'pig' && (
            /* THÁNG 12: LỢN ĐÀN ÂM DƯƠNG — Kiệt tác kinh điển, 2 xoáy Âm Dương, lông răng lược & lá ráy */
            <g>
              {/* Đuôi xoắn ốc */}
              <path d="M51 85 C39 81, 38 67, 47 67 C54 67, 54 75, 47 77" stroke={INK} strokeWidth="2.9" fill="none" strokeLinecap="round" />
              {/* Bốn chân ngắn mập mạp */}
              <path
                d="M65 110 L62 136 L74 136 L78 113 M95 113 L94 136 L106 136 L107 114 M130 113 L130 136 L142 136 L144 113 M155 107 L159 135 L170 135 L166 104"
                fill="#E7997E"
                stroke={INK}
                strokeWidth="2.9"
                strokeLinejoin="round"
              />
              {/* Thân lợn hồng sỏi đồi */}
              <path
                d="M50 85 C50 55, 92 50, 144 54 C171 57, 185 72, 180 96 C174 117, 139 118, 100 117 C65 117, 50 104, 50 85 Z"
                fill="#E7997E"
                stroke={INK}
                strokeWidth="3.2"
              />
              {/* HAI XOÁY ÂM DƯƠNG ĐẶC TRƯNG ĐÔNG HỒ */}
              <DongHoYinYangSwirl cx={79} cy={83} r={13} ink={INK} light={DIEP_WHITE} />
              <DongHoYinYangSwirl cx={123} cy={82} r={12} ink={SON} light={DIEP_WHITE} />
              {/* Nét khắc răng lược dưới bụng & đùi lợn (đặc trưng Lợn Đàn Đông Hồ) */}
              <path
                d="M66 111 L68 117 M73 113 L75 119 M80 114 L82 120 M87 114 L89 120 M94 114 L96 120 M101 114 L103 120 M108 114 L110 120 M115 114 L117 120 M122 114 L124 120"
                stroke={DIEP_WHITE}
                strokeWidth="1.8"
              />
              {/* Bờm lưng xanh lục chàm */}
              <path d="M81 53 Q97 44 114 52 Q129 45 144 54" stroke={LUC} strokeWidth="4.2" fill="none" strokeLinecap="round" />
              {/* Tai to rủ xuống màu đỏ son & 2 chấm trắng vỏ điệp */}
              <path d="M144 61 C133 69, 133 89, 149 85 C158 81, 156 65, 144 61 Z" fill={SON} stroke={INK} strokeWidth="2.8" />
              <circle cx="159" cy="64" r="2.8" fill={DIEP_WHITE} />
              <circle cx="167" cy="65" r="2.3" fill={DIEP_WHITE} />
              {/* Mắt cười & Mõm vàng hoa hòe */}
              <ellipse cx="165" cy="77" rx="4.4" ry="3.2" fill={DIEP_WHITE} stroke={INK} strokeWidth="2.1" />
              <circle cx="166" cy="77" r="1.7" fill={INK} />
              <ellipse cx="187" cy="82" rx="5.8" ry="8.2" transform="rotate(-12 187 82)" fill={HOE} stroke={INK} strokeWidth="2.7" />
              <circle cx="185.5" cy="79.5" r="1.4" fill={INK} />
              <circle cx="189" cy="84" r="1.4" fill={INK} />
              {/* Bông lá ráy xanh lục góc phải dưới */}
              <path d="M174 134 Q188 107 202 122 Q188 139 174 134 Z" fill={LUC} stroke={INK} strokeWidth="2.2" />
              <path d="M178 130 L195 122" stroke={DIEP_WHITE} strokeWidth="1.4" />
            </g>
          )}
        </g>
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
          <DongHoZodiacPainting
            zodiac={currentZodiac}
            onClick={() => {
              setActiveMuseumMonth(currentZodiac.month);
              setShowZodiacMuseumModal(true);
            }}
          />

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#141413] tracking-tight flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#8B261D]" />
                <span>Lịch Phát Sóng Video</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  setActiveMuseumMonth(currentZodiac.month);
                  setShowZodiacMuseumModal(true);
                }}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F5EFE0] text-[#8D281B] border border-[#8D281B]/25 hover:bg-[#E4C85E]/40 transition cursor-pointer"
                data-testid="open-dong-ho-museum-btn"
              >
                Tháng {currentZodiac.month} ({currentZodiac.chiName}): {currentZodiac.paintingTitle}
              </button>
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
