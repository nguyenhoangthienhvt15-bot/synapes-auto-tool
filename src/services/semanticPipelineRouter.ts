export type SemanticFlowId = 'news_finance' | '3d_animation_kids' | 'science_math_explainer';

export interface AudienceComplianceReport {
  isMadeForKids: boolean;
  audienceRating: 'MADE_FOR_KIDS_G' | 'GENERAL_ALL_AGES' | 'FINANCIAL_ADVISORY_16_PLUS';
  coppaSafe: boolean;
  requiredDisclaimers: string[];
  seoKeywords: string[];
  recommendedChapters: Array<{ timestamp: string; label: string }>;
  safetyFlags: string[];
}

export interface SemanticPipelineRoute {
  flowId: SemanticFlowId;
  flowLabel: string;
  lockWikimediaSearch: boolean;
  lockReason: string | null;
  preferredRenderEngine: 'web-broll-news' | 'comfyui-wan21-3d' | 'threejs-manim-diagram';
  enableCharacterVault: boolean;
  enableLipSyncEngine: boolean;
  enableFactCheckNews: boolean;
  matchedSignals: string[];
  compliance: AudienceComplianceReport;
}

const ANIMATION_3D_SIGNALS = [
  'hoạt hình',
  '3d',
  'pixar',
  'disney',
  'cartoon',
  'kids',
  'trẻ em',
  'thiếu nhi',
  'cổ tích',
  'thỏ',
  'cáo',
  'gấu',
  'nhân vật',
  'storytelling',
  'vẽ tranh giấy',
  'anime',
  'phiêu lưu',
];

const SCIENCE_MATH_SIGNALS = [
  'toán học',
  'vật lý',
  'hóa học',
  'sinh học',
  'định lý',
  'phương trình',
  'tích phân',
  'hình học',
  'manim',
  'lượng tử',
  'vũ trụ',
  'nasa',
  'thuật toán',
  'algorithm',
  'neural',
  'scientific',
  'science',
  'mathematics',
  'geometry',
  'kiến trúc hệ thống',
];

const NEWS_FINANCE_SIGNALS = [
  'giá vàng',
  'sjc',
  'chứng khoán',
  'tài chính',
  'ngân hàng',
  'lạm phát',
  'thời sự',
  'bản tin',
  'tin tức',
  'kinh tế',
  'crypto',
  'bitcoin',
  'thị trường',
  'breaking news',
  'daily-news',
  'gdp',
  'usd',
];

function collectMatches(haystack: string, tokens: string[]): string[] {
  return tokens.filter((tok) => haystack.includes(tok));
}

/**
 * Classifies audience safety, YouTube COPPA "Made for Kids" status, SEO tags, and chapter scaffolding.
 */
export function classifyAudienceCompliance(
  prompt: string,
  flowId: SemanticFlowId,
  durationSec = 60
): AudienceComplianceReport {
  const low = (prompt || '').toLowerCase();
  const kidsSignals = ['trẻ em', 'thiếu nhi', 'bé', 'kids', 'cổ tích', 'hoạt hình', 'bài học cho bé', 'pixar'];
  const isKidsPrompt = kidsSignals.some((k) => low.includes(k));
  const isMadeForKids = flowId === '3d_animation_kids' || isKidsPrompt;

  const isFinance =
    flowId === 'news_finance' &&
    ['giá vàng', 'sjc', 'chứng khoán', 'tài chính', 'crypto', 'bitcoin', 'đầu tư', 'lãi suất'].some((k) =>
      low.includes(k)
    );

  const safetyFlags: string[] = [];
  const requiredDisclaimers: string[] = [];

  if (isMadeForKids) {
    safetyFlags.push('COPPA: Tắt bình luận cá nhân hóa & quảng cáo nhắm mục tiêu');
    safetyFlags.push('Nội dung an toàn lứa tuổi G / Thiếu nhi');
    requiredDisclaimers.push('Made for Kids (YouTube COPPA Compliant — An toàn cho trẻ em)');
  }
  if (isFinance) {
    safetyFlags.push('Tài chính: Cần gắn nhãn nguồn trích dẫn thực tế & ngày cập nhật');
    requiredDisclaimers.push('Thông tin mang tính tham khảo thị trường, không phải khuyến nghị đầu tư tài chính.');
  }

  const rawWords = (prompt || '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 6);

  const seoBase =
    flowId === '3d_animation_kids'
      ? ['HoatHinh3D', 'KeChuyenThieuNhi', 'Animation3D', 'PixarStyle']
      : flowId === 'science_math_explainer'
        ? ['KhoaHoc', 'GiaiThichTrucQuan', 'STEM', '3DExplainer']
        : ['TinTuc24h', 'PhanTichThiTruong', 'BanTinAI', 'ThoiSu'];

  const seoKeywords = Array.from(new Set([...seoBase, ...rawWords])).slice(0, 8);

  const clampedDur = Math.max(15, Math.min(120, Math.round(durationSec || 60)));
  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${Math.floor(s % 60)
      .toString()
      .padStart(2, '0')}`;

  const recommendedChapters = [
    { timestamp: '00:00', label: 'Mở đầu & Hook thu hút' },
    { timestamp: fmtTime(Math.round(clampedDur * 0.2)), label: flowId === '3d_animation_kids' ? 'Bối cảnh & Nhân vật chính' : 'Dữ liệu & Trọng tâm vấn đề' },
    { timestamp: fmtTime(Math.round(clampedDur * 0.55)), label: flowId === 'science_math_explainer' ? 'Mô phỏng trực quan 3D' : 'Diễn biến cao trào / Phân tích' },
    { timestamp: fmtTime(Math.round(clampedDur * 0.85)), label: 'Tổng kết & Thông điệp chính' },
  ];

  return {
    isMadeForKids,
    audienceRating: isMadeForKids
      ? 'MADE_FOR_KIDS_G'
      : isFinance
        ? 'FINANCIAL_ADVISORY_16_PLUS'
        : 'GENERAL_ALL_AGES',
    coppaSafe: true,
    requiredDisclaimers,
    seoKeywords,
    recommendedChapters,
    safetyFlags,
  };
}

/**
 * Semantic Intent & Pipeline Router separating News/Finance, 3D Kids Animation (locks Wikimedia), and Science/Math.
 */
export function routeSemanticPipeline(
  prompt: string,
  skillCommand?: string | null,
  durationSec = 60
): SemanticPipelineRoute {
  const combined = `${prompt || ''} ${skillCommand || ''}`.toLowerCase();

  const animHits = collectMatches(combined, ANIMATION_3D_SIGNALS);
  const scienceHits = collectMatches(combined, SCIENCE_MATH_SIGNALS);
  const newsHits = collectMatches(combined, NEWS_FINANCE_SIGNALS);

  const explicitCmd = (skillCommand || '').toLowerCase();
  let flowId: SemanticFlowId = 'news_finance';
  let matchedSignals = newsHits;

  if (
    explicitCmd.includes('storytelling') ||
    explicitCmd.includes('3d-animation') ||
    explicitCmd.includes('pixar') ||
    animHits.length > Math.max(newsHits.length, scienceHits.length)
  ) {
    flowId = '3d_animation_kids';
    matchedSignals = animHits.length > 0 ? animHits : [explicitCmd || '3d_animation'];
  } else if (
    explicitCmd.includes('apple-keynote-3d') ||
    scienceHits.length > newsHits.length
  ) {
    flowId = 'science_math_explainer';
    matchedSignals = scienceHits.length > 0 ? scienceHits : [explicitCmd || 'science_explainer'];
  }

  const compliance = classifyAudienceCompliance(prompt, flowId, durationSec);

  if (flowId === '3d_animation_kids') {
    return {
      flowId,
      flowLabel: 'Luồng 2: Hoạt Hình 3D & Storytelling (Khóa Wikimedia)',
      lockWikimediaSearch: true,
      lockReason:
        'Tự động khóa tìm ảnh Wikimedia/tin tức để bảo vệ Character Consistency Vault và thẩm mỹ phim hoạt hình 3D.',
      preferredRenderEngine: 'comfyui-wan21-3d',
      enableCharacterVault: true,
      enableLipSyncEngine: true,
      enableFactCheckNews: false,
      matchedSignals,
      compliance,
    };
  }

  if (flowId === 'science_math_explainer') {
    return {
      flowId,
      flowLabel: 'Luồng 3: Khoa Học, Toán & Kiến Trúc 3D (Manim + Three.js)',
      lockWikimediaSearch: false,
      lockReason: null,
      preferredRenderEngine: 'threejs-manim-diagram',
      enableCharacterVault: false,
      enableLipSyncEngine: true,
      enableFactCheckNews: false,
      matchedSignals,
      compliance,
    };
  }

  return {
    flowId: 'news_finance',
    flowLabel: 'Luồng 1: Thời Sự, Tài Chính & Dữ Liệu Thực Tế Internet',
    lockWikimediaSearch: false,
    lockReason: null,
    preferredRenderEngine: 'web-broll-news',
    enableCharacterVault: false,
    enableLipSyncEngine: true,
    enableFactCheckNews: true,
    matchedSignals: matchedSignals.length > 0 ? matchedSignals : ['general_news_documentary'],
    compliance,
  };
}
