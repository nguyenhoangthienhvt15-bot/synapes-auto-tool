import type {
  AIProviderId,
  StoryboardScene,
  Skill,
  AspectRatio,
  VideoGenre,
} from '../types';
import { PROVIDERS } from './aiModelDiscoveryService';

export type TopicDomain =
  | 'geopolitics'
  | 'news'
  | 'finance'
  | 'science'
  | 'history'
  | 'food'
  | 'travel'
  | 'sports'
  | 'ai-cyber'
  | 'hardware';

export interface ResearchHeadlineItem {
  title: string;
  source: string;
  pubDate?: string;
}

export interface ResearchVisualItem {
  id: string;
  title: string;
  url: string;
  proxyUrl: string;
  source: string;
}

export interface TopicResearchPayload {
  query: string;
  domain: TopicDomain;
  headlines: ResearchHeadlineItem[];
  wikiSummary: string;
  visuals: ResearchVisualItem[];
}

export interface GenerateScriptParams {
  prompt: string;
  skillId?: string;
  skills: Skill[];
  aspectRatio: AspectRatio;
  targetDurationMin: number;
  provider: AIProviderId;
  model: string;
  apiKey: string;
  endpointUrl?: string;
  onProgress?: (stepText: string, percent: number) => void;
}

export interface GeneratedScriptResult {
  success: boolean;
  isLiveApi: boolean;
  modelUsed: string;
  providerUsed: string;
  videoGenre: VideoGenre;
  topicDomain: TopicDomain;
  newsTickerText?: string;
  title: string;
  description: string;
  tags: string[];
  productLink?: string;
  musicTrack: {
    name: string;
    license: string;
    volume: number;
  };
  voiceoverTrack: {
    name: string;
    voiceName: string;
  };
  duration: number;
  storyboard: StoryboardScene[];
  videoUrl: string;
  thumbnailUrl: string;
  engineMessage: string;
}

// Kho chủ đề & Bản tin ngẫu nhiên đa lĩnh vực phục vụ tạo nhanh 1 chạm
export interface RandomTopicPreset {
  id: string;
  category: string;
  label: string;
  prompt: string;
  suggestedCommand: string;
}

export const RANDOM_TOPIC_PRESETS: RandomTopicPreset[] = [
  {
    id: 'geo-iran-us',
    category: 'Thời sự Quốc tế',
    label: 'Chiến sự & Căng thẳng Mỹ - Iran',
    prompt: 'Tạo bản tin thời sự phân tích tình hình căng thẳng địa chính trị và quân sự giữa Iran và Mỹ tại Trung Đông',
    suggestedCommand: '/daily-news',
  },
  {
    id: 'geo-sea-trade',
    category: 'Thời sự Quốc tế',
    label: 'An ninh Hàng hải Biển Đỏ & Chuỗi cung ứng',
    prompt: 'Bản tin đặc biệt về an ninh tuyến hàng hải quốc tế Biển Đỏ và tác động tới thương mại toàn cầu',
    suggestedCommand: '/daily-news',
  },
  {
    id: 'geo-ukraine-europe',
    category: 'Thời sự Quốc tế',
    label: 'Cục diện Xung đột Nga - Ukraine & NATO',
    prompt: 'Điểm tin toàn cảnh diễn biến mới nhất xung đột Nga - Ukraine và các động thái ngoại giao từ châu Âu',
    suggestedCommand: '/daily-news',
  },
  {
    id: 'fin-gold-record',
    category: 'Tài chính & Vĩ mô',
    label: 'Biến động Giá Vàng Thế giới & SJC',
    prompt: 'Bản tin tài chính phân tích nguyên nhân giá vàng thế giới biến động mạnh và dự báo xu hướng dòng tiền trú ẩn',
    suggestedCommand: '/daily-news',
  },
  {
    id: 'fin-fed-rates',
    category: 'Tài chính & Vĩ mô',
    label: 'Chính sách Lãi suất FED & Tỷ giá USD',
    prompt: 'Phân tích quyết định lãi suất của Cục Dự trữ Liên bang Mỹ FED và tác động trực tiếp đến thị trường chứng khoán Việt Nam',
    suggestedCommand: '/premium-craft',
  },
  {
    id: 'sci-blackhole-jwst',
    category: 'Khoa học & Vũ trụ',
    label: 'Kính viễn vọng James Webb & Hố đen',
    prompt: 'Phim tài liệu khám phá những phát hiện chấn động của kính viễn vọng không gian James Webb về các thiên hà sơ khai',
    suggestedCommand: '/cinematic-director',
  },
  {
    id: 'sci-mars-colony',
    category: 'Khoa học & Vũ trụ',
    label: 'Hành trình Đưa Con Người Lên Sao Hỏa',
    prompt: 'Khám phá kế hoạch chinh phục Sao Hỏa bằng tàu vũ trụ thế hệ mới và thách thức sinh tồn ngoài Trái Đất',
    suggestedCommand: '/cinematic-director',
  },
  {
    id: 'his-dien-bien-phu',
    category: 'Lịch sử & Hồ sơ',
    label: 'Chiến dịch Điện Biên Phủ Lừng Lẫy Năm Châu',
    prompt: 'Phim tài liệu lịch sử tái hiện hào khí Chiến dịch Điện Biên Phủ 1954 và nghệ thuật quân sự Việt Nam',
    suggestedCommand: '/storytelling',
  },
  {
    id: 'his-ancient-egypt',
    category: 'Lịch sử & Hồ sơ',
    label: 'Giải Mã Bí Ẩn Đại Kim Tự Tháp Giza',
    prompt: 'Hồ sơ khảo cổ giải mã kỹ thuật xây dựng Đại Kim Tự Tháp Giza của nền văn minh Ai Cập cổ đại',
    suggestedCommand: '/cinematic-director',
  },
  {
    id: 'life-hanoi-cuisine',
    category: 'Ẩm thực & Du lịch',
    label: 'Tinh hoa Ẩm thực Phố cổ Hà Nội mùa thu',
    prompt: 'Khám phá hành trình văn hóa ẩm thực đường phố Hà Nội từ phở gia truyền đến cà phê trứng phố cổ',
    suggestedCommand: '/storytelling',
  },
  {
    id: 'life-ha-giang',
    category: 'Ẩm thực & Du lịch',
    label: 'Cung đường Đèo Mã Pí Lèng - Hà Giang',
    prompt: 'Video điện ảnh khám phá vẻ đẹp hùng vĩ của cao nguyên đá Đồng Văn và đèo Mã Pí Lèng Hà Giang',
    suggestedCommand: '/cinematic-director',
  },
  {
    id: 'ai-semiconductor-war',
    category: 'Công nghệ & AI',
    label: 'Cuộc đua Siêu Chip Bán Dẫn AI 2nm Toàn Cầu',
    prompt: 'Bản tin phân tích cuộc đua chiến lược ngành công nghiệp bán dẫn 2 nanomet và hạ tầng siêu máy tính AI',
    suggestedCommand: '/tech-review',
  },
];

// Giữ export cho các module phần cứng Apple khi đúng lĩnh vực 'hardware'
export const REAL_IPHONE_18_INTERNET_IMAGES = [
  'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=1400&q=85',
];

// Kho ảnh HD dự phòng phân tách tuyệt đối theo 10 lĩnh vực (Không bao giờ trộn ảnh iPhone sang chủ đề khác)
export const CLIENT_DOMAIN_PHOTO_POOLS: Record<TopicDomain, string[]> = {
  geopolitics: [
    'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=85',
  ],
  news: [
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=85',
  ],
  finance: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1400&q=85',
  ],
  science: [
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1400&q=85',
  ],
  history: [
    'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=1400&q=85',
  ],
  food: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85',
  ],
  travel: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=85',
  ],
  sports: [
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=85',
  ],
  'ai-cyber': [
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=85',
  ],
  hardware: REAL_IPHONE_18_INTERNET_IMAGES,
};

const SCENE_VIDEO_CLIPS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
];

/**
 * Phân loại lĩnh vực chủ đề (TopicDomain) phía Client
 */
export function classifyTopicDomainClient(text: string): TopicDomain {
  const q = (text || '').toLowerCase();

  if (
    /chiến sự|chiến tranh|quân sự|iran|israel|ukraine|nato|tên lửa|hạt nhân|biển đông|biển đỏ|biên giới|xung đột|hạm đội|tàu sân bay|không kích|cấm vận|ngoại giao|địa chính trị|lầu năm góc|trung đông|triều tiên|đài loan|war|military|missile|conflict|pentagon|navy/.test(
      q
    )
  ) {
    return 'geopolitics';
  }

  if (
    /giá vàng|vàng sjc|chứng khoán|cổ phiếu|vn-index|bitcoin|crypto|lãi suất|lạm phát|fed|ngân hàng|tỷ giá|usd|bất động sản|nhà đất|kinh tế|tài chính|thuế quan|thương mại|xuất khẩu|gdp|gold|stock|market|finance|economy/.test(
      q
    )
  ) {
    return 'finance';
  }

  if (
    /lịch sử|cổ đại|triều đại|chiến dịch|điện biên phủ|kim tự tháp|ai cập|đế chế|la mã|khảo cổ|di sản|văn minh|history|ancient|empire|pyramid/.test(
      q
    )
  ) {
    return 'history';
  }

  if (
    /vũ trụ|sao hỏa|hố đen|thiên hà|james webb|nasa|spacex|khoa học|vật lý|lượng tử|y học|sinh học|dna|space|universe|mars|science|quantum/.test(
      q
    )
  ) {
    return 'science';
  }

  if (
    /ẩm thực|món ăn|nấu ăn|phở|bún|cà phê|nhà hàng|đường phố|đặc sản|công thức|bếp|food|cooking|cuisine|coffee/.test(
      q
    )
  ) {
    return 'food';
  }

  if (
    /du lịch|khám phá|đà lạt|hạ long|sapa|hà giang|mã pí lèng|phú quốc|hội an|nhật bản|châu âu|thiên nhiên|travel|nature|landscape/.test(
      q
    )
  ) {
    return 'travel';
  }

  if (
    /bóng đá|thể thao|world cup|ngoại hạng anh|champions league|u23|đội tuyển|marathon|football|soccer|sports/.test(
      q
    )
  ) {
    return 'sports';
  }

  if (
    /iphone|ipad|macbook|samsung|galaxy|xiaomi|pixel|oppo|smartphone|điện thoại|laptop|tai nghe|máy ảnh|apple/.test(
      q
    )
  ) {
    return 'hardware';
  }

  if (/trí tuệ nhân tạo|\bai\b|chatgpt|gemini|claude|deepseek|robot|bán dẫn|siêu chip|cyber| dữ liệu lớn/.test(q)) {
    return 'ai-cyber';
  }

  return 'news';
}

/**
 * Nhận diện thể loại trình diễn Video (VideoGenre) để chọn đúng gói đồ họa & giọng đọc
 */
export function detectVideoGenre(
  rawPrompt: string,
  coreSubject: string,
  domain: TopicDomain,
  skill?: Skill
): VideoGenre {
  const combined = `${rawPrompt} ${coreSubject} ${skill?.command || ''}`.toLowerCase();

  if (domain === 'hardware' && !/bản tin|thời sự/.test(rawPrompt.toLowerCase())) {
    return 'apple-keynote';
  }
  if (domain === 'finance') {
    return 'finance-analysis';
  }
  if (
    domain === 'geopolitics' ||
    domain === 'news' ||
    skill?.command === '/daily-news' ||
    /bản tin|thời sự|tin tức|tin nóng|điểm tin|24h|breaking/.test(combined)
  ) {
    return 'news-broadcast';
  }
  if (domain === 'history' || domain === 'science' || /phim tài liệu|hồ sơ|giải mã|bí ẩn/.test(combined)) {
    return 'documentary';
  }
  return 'viral-social';
}

/**
 * Kiểm tra xem người dùng có đang yêu cầu hệ thống tự chọn một bản tin/chủ đề ngẫu nhiên không
 */
function isGenericRandomTopicRequest(rawPrompt: string): boolean {
  const clean = rawPrompt
    .replace(/^\/[a-z0-9-_]+:\s*/i, '')
    .trim()
    .toLowerCase();

  if (/ngẫu\s*nhiên|bất\s*kỳ|tùy\s*ý|random/.test(clean)) {
    return true;
  }

  // Nếu sau khi bỏ các từ "tạo bản tin thời sự hôm nay" mà không còn chủ thể cụ thể nào
  const stripped = clean
    .replace(
      /\b(hãy|vui lòng|giúp tôi|tiến hành|tạo|làm|viết|dựng|một|bản tin|thời sự|tin tức|tin nóng|video|kịch bản|hôm nay|mới nhất|24h|nhanh)\b/g,
      ''
    )
    .trim();

  return stripped.length < 3;
}

/**
 * Làm sạch câu lệnh của người dùng để trích xuất đúng chủ đề cốt lõi (KHÔNG BAO GIỜ lặp lại "Tạo bản tin về...")
 * Ví dụ: "Tạo bản tin về tình hình chiến sự Iran và Mỹ" -> "Tình hình chiến sự Iran và Mỹ"
 */
function truncateHeadlineWords(text: string, maxLen: number = 42): string {
  const clean = text.trim();
  if (clean.length <= maxLen) return clean;
  const sub = clean.slice(0, maxLen);
  const lastSpace = sub.lastIndexOf(' ');
  return (lastSpace > 14 ? sub.slice(0, lastSpace) : sub).trim();
}

export function extractCleanSubject(rawPrompt: string): string {
  let text = (rawPrompt || '').trim();
  // Bỏ command ở đầu nếu có (vd: /daily-news: ...)
  text = text.replace(/^\/[a-z0-9-_]+:\s*/i, '').trim();

  // Xóa nhiều vòng các cụm từ mệnh lệnh mở đầu tiếng Việt & tiếng Anh
  const leadingPatterns = [
    /^(xin\s+hãy|hãy|vui\s+lòng|giúp\s+tôi|nhờ\s+bạn|tiến\s+hành|thực\s+hiện)\s+/i,
    /^(khởi\s+tạo|tạo|làm|xây\s+dựng|viết|soạn|dựng|biên\s+tập|sản\s+xuất|lên\s+ý\s+tưởng)\s+(cho\s+tôi\s+|giúp\s+tôi\s+)?/i,
    /^(một\s+|1\s+)?(dự\s+án\s+)?(kịch\s+bản\s+)?(bản\s+tin\s+thời\s+sự|bản\s+tin\s+nhanh|bản\s+tin\s+nóng|bản\s+tin\s+24h|bản\s+tin|điểm\s+tin|tin\s+tức|tin\s+nóng|phóng\s+sự|phim\s+tài\s+liệu|chương\s+trình|video|videp|clip|shorts|reels)\s*/i,
    /^(ngắn\s+|dài\s+|chi\s+tiết\s+|chuyên\s+sâu\s+|toàn\s+diện\s+|nóng\s+hổi\s+|mới\s+nhất\s+)+/i,
    /^(giới\s+thiệu|review|đánh\s+giá|phân\s+tích|tổng\s+hợp|cập\s+nhật|tìm\s+hiểu|khám\s+phá|giải\s+mã|kể\s+chuyện|thuyết\s+minh|nói)\s+(chi\s+tiết\s+|toàn\s+diện\s+|chuyên\s+sâu\s+)?/i,
    /^(về\s+chủ\s+đề|về\s+sự\s+kiện|về\s+vấn\s+đề|về\s+sản\s+phẩm|xoay\s+quanh|liên\s+quan\s+đến|về|cho)\s+/i,
  ];

  for (let pass = 0; pass < 5; pass++) {
    let changed = false;
    for (const regex of leadingPatterns) {
      const next = text.replace(regex, '').trim();
      if (next !== text && next.length >= 2) {
        text = next;
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Bỏ dấu ngoặc kép thừa ở 2 đầu nếu có
  text = text.replace(/^["'“”]+|["'“”]+$/g, '').trim();

  // Chuẩn hóa chữ hoa các tên riêng phổ biến
  text = text
    .replace(/\biphone\b/gi, 'iPhone')
    .replace(/\bipad\b/gi, 'iPad')
    .replace(/\bmacbook\b/gi, 'MacBook')
    .replace(/\bsamsung\b/gi, 'Samsung')
    .replace(/\bchatgpt\b/gi, 'ChatGPT')
    .replace(/\bnato\b/gi, 'NATO')
    .replace(/\bfed\b/gi, 'FED')
    .replace(/\bsjc\b/gi, 'SJC')
    .replace(/\biran\b/gi, 'Iran')
    .replace(/\bisrael\b/gi, 'Israel')
    .replace(/\bukraine\b/gi, 'Ukraine');

  if (!text || text.length < 2) {
    return 'Thời sự Quốc tế & Thế giới 24h';
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Sinh URL hình ảnh thực tế đúng 100% lĩnh vực chủ đề (thông qua CORS Image Proxy an toàn cho Canvas)
 */
export function buildAiSceneImageUrl(
  visualPrompt: string,
  aspectRatio: AspectRatio,
  sceneIndex: number,
  topicDomain?: string,
  researchVisuals?: ResearchVisualItem[]
): string {
  const resolvedDomain: TopicDomain =
    (topicDomain as TopicDomain) && CLIENT_DOMAIN_PHOTO_POOLS[topicDomain as TopicDomain]
      ? (topicDomain as TopicDomain)
      : classifyTopicDomainClient(visualPrompt);

  const idx = Math.max(0, sceneIndex - 1);

  // 1. Ưu tiên ảnh thực tế từ Wikipedia / Wikimedia Commons nếu có từ bước nghiên cứu chủ đề
  if (researchVisuals && researchVisuals.length > 0 && idx < researchVisuals.length) {
    const picked = researchVisuals[idx % researchVisuals.length];
    if (picked?.proxyUrl) return picked.proxyUrl;
    if (picked?.url) {
      return `/api/image-proxy?domain=${resolvedDomain}&idx=${idx}&url=${encodeURIComponent(picked.url)}`;
    }
  }

  // 2. Đối với phần cứng iPhone/Apple thực sự: khớp ảnh chi tiết phần cứng
  if (resolvedDomain === 'hardware') {
    const lower = (visualPrompt || '').toLowerCase();
    let hwUrl = REAL_IPHONE_18_INTERNET_IMAGES[idx % REAL_IPHONE_18_INTERNET_IMAGES.length];
    if (/chip|silicon|a20|a19|2nm|neural/.test(lower)) hwUrl = REAL_IPHONE_18_INTERNET_IMAGES[2];
    else if (/camera|lens|periscope|optic|48mp/.test(lower)) hwUrl = REAL_IPHONE_18_INTERNET_IMAGES[3];
    else if (/display|oled|screen|120hz|bezel/.test(lower)) hwUrl = REAL_IPHONE_18_INTERNET_IMAGES[1];
    else if (/battery|magsafe|charging/.test(lower)) hwUrl = REAL_IPHONE_18_INTERNET_IMAGES[4];
    return `/api/image-proxy?domain=hardware&idx=${idx}&url=${encodeURIComponent(hwUrl)}`;
  }

  // 3. Đối với mọi chủ đề Thời sự / Chiến sự / Tài chính / Khoa học / Lịch sử / Đời sống:
  // Kết hợp kho ảnh báo chí HD theo đúng domain để hiển thị tức thì (<50ms) và sắc nét 100%
  const pool = CLIENT_DOMAIN_PHOTO_POOLS[resolvedDomain] || CLIENT_DOMAIN_PHOTO_POOLS.news;
  const curatedUrl = pool[idx % pool.length];

  // Nếu người dùng bấm "Render lại ảnh" (sceneIndex > 15), gọi sinh ảnh AI Pollinations theo đúng visualPrompt
  if (sceneIndex > 15 && visualPrompt) {
    const w = aspectRatio === '9:16' ? 720 : 1280;
    const h = aspectRatio === '9:16' ? 1280 : 720;
    const aiGenUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      visualPrompt.slice(0, 260)
    )}?width=${w}&height=${h}&seed=${sceneIndex * 37}&nologo=true`;
    return `/api/image-proxy?domain=${resolvedDomain}&idx=${idx}&url=${encodeURIComponent(aiGenUrl)}`;
  }

  return `/api/image-proxy?domain=${resolvedDomain}&idx=${idx}&url=${encodeURIComponent(curatedUrl)}`;
}

/**
 * Thu thập dữ liệu tin tức Google News RSS & Wikipedia thời gian thực từ Backend
 */
async function fetchRealtimeTopicResearch(query: string): Promise<TopicResearchPayload> {
  const fallbackDomain = classifyTopicDomainClient(query);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const resp = await fetch(`/api/topic-research?q=${encodeURIComponent(query)}`, {
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (resp.ok) {
      const data = await resp.json();
      return {
        query,
        domain: (data.domain as TopicDomain) || fallbackDomain,
        headlines: Array.isArray(data.headlines) ? data.headlines : [],
        wikiSummary: String(data.wikiSummary || ''),
        visuals: Array.isArray(data.visuals) ? data.visuals : [],
      };
    }
  } catch {
    // Fallback offline gracefully
  }
  return {
    query,
    domain: fallbackDomain,
    headlines: [],
    wikiSummary: '',
    visuals: [],
  };
}

/**
 * Xây dựng System Prompt chuyên biệt theo từng Thể loại (Thời sự / Tài chính / Tài liệu / Đời sống / Công nghệ)
 * Có nhúng trực tiếp dữ liệu tin tức Google News RSS & Wikipedia mới nhất
 */
function buildDirectorSystemPrompt(
  rawPrompt: string,
  coreSubject: string,
  videoGenre: VideoGenre,
  domain: TopicDomain,
  research: TopicResearchPayload,
  skill: Skill | undefined,
  aspectRatio: AspectRatio,
  targetDurationMin: number
): string {
  const isShort = aspectRatio === '9:16';
  const sceneCount = isShort ? 6 : 6;

  const roleInstruction =
    videoGenre === 'news-broadcast'
      ? `Bạn là Tổng Biên Tập & Đạo Diễn Bản Tin Thời Sự Quốc Tế 24h (chuẩn VTV1, Reuters, BBC World News). Phong cách: Chính xác, khách quan, sắc bén, dẫn dắt dữ kiện thực tế có chiều sâu địa chính trị - xã hội. TUYỆT ĐỐI CẤM dùng văn mẫu quảng cáo sản phẩm công nghệ (như "siêu phẩm", "tuyệt tác công nghệ", "thay đổi cuộc chơi") cho bản tin thời sự!`
      : videoGenre === 'finance-analysis'
        ? `Bạn là Giám Đốc Phân Tích Kinh Tế Vĩ Mô & Tài Chính (chuẩn Bloomberg / CafeF). Phong cách: Rành mạch, có số liệu, phân tích nguyên nhân - hệ quả và xu hướng dòng vốn.`
        : videoGenre === 'documentary'
          ? `Bạn là Đạo Diễn Phim Tài Liệu Khoa Học & Lịch Sử (chuẩn National Geographic / Netflix Documentary). Phong cách: Tự sự cuốn hút, giàu tri thức xác thực và chiều sâu lịch sử.`
          : videoGenre === 'apple-keynote'
            ? `Bạn là Đạo Diễn Thương Mại Công Nghệ Cao Cấp. Phong cách: Điềm tĩnh, súc tích, tập trung vào thiết kế kỹ thuật và trải nghiệm thực tế.`
            : `Bạn là Đạo Diễn Nội Dung Sáng Tạo Đa Nền Tảng. Phong cách: Tự nhiên, giàu cảm xúc, lôi cuốn người xem ngay từ 3 giây đầu.`;

  const liveNewsBlock =
    research.headlines.length > 0
      ? `\nTIN TỨC THỜI GIAN THỰC VỪA THU THẬP (BẮT BUỘC CẬP NHẬT VÀO NỘI DUNG KỊCH BẢN):\n` +
      research.headlines
        .slice(0, 6)
        .map((h, i) => `  ${i + 1}. [${h.source}] ${h.title}`)
        .join('\n')
      : '';

  const wikiBlock = research.wikiSummary
    ? `\nTHÔNG TIN BỐI CẢNH THỰC TẾ:\n${research.wikiSummary.slice(0, 900)}`
    : '';

  return `${roleInstruction}

NHIỆM VỤ: Biên soạn kịch bản video hoàn chỉnh gồm đúng ${sceneCount} phân cảnh về chủ đề: "${coreSubject}" (Yêu cầu gốc của người dùng: "${rawPrompt}").
- Lĩnh vực phân loại: ${domain.toUpperCase()} | Thể loại đồ họa: ${videoGenre.toUpperCase()}
- Bộ Skill: "${skill?.name || 'Biên kịch Chuyên nghiệp'}" (${skill?.tone || 'Chính xác, cuốn hút'})
- Khung hình: ${isShort ? '9:16 (Shorts / Reels / TikTok)' : `16:9 (Bản tin / Phim ngang YouTube, mục tiêu ${targetDurationMin} phút)`}
${liveNewsBlock}
${wikiBlock}

QUY TẮC NGHIÊM NGẶT (BẮT BUỘC TUÂN THỦ 100%):
1. TUYỆT ĐỐI KHÔNG lặp lại nguyên văn mệnh lệnh của người dùng (như "Tạo bản tin về...", "Làm video về...") trong "title", "headline" hay "voiceover".
2. Tiêu đề "title" phải viết chuẩn báo chí / điện ảnh đúng với chủ đề "${coreSubject}".
3. Lời dẫn "voiceover" mỗi cảnh dài 30 - 48 từ tiếng Việt tự nhiên, giàu thông tin thực tế, bám sát diễn biến mới nhất ở trên.
4. "visualPrompt" viết bằng tiếng Anh mô tả hình ảnh báo chí / điện ảnh chân thực ĐÚNG CHỦ ĐỀ "${coreSubject}" (tuyệt đối không mô tả điện thoại hay studio công nghệ nếu chủ đề là thời sự, chiến sự, tài chính, lịch sử, ẩm thực...).
5. "newsTicker": Một chuỗi tóm tắt 3-4 dòng tin vắn ngăn cách bởi " • " để chạy chữ trực tiếp dưới đáy màn hình bản tin.

TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON HỢP LỆ (không kèm giải thích ngoài JSON):
{
  "title": "Tiêu đề chuẩn xác, sắc sảo về ${coreSubject}",
  "description": "Mô tả chi tiết nội dung video kèm mốc thời gian từng phần",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
  "newsTicker": "TIN NÓNG: Điểm tin số 1 • Diễn biến quan trọng số 2 • Nhận định chuyên gia số 3",
  "musicGenre": "Broadcast News Orchestral Pulse",
  "scenes": [
    {
      "sceneNumber": 1,
      "headline": "01. TIÊU ĐIỂM MỞ ĐẦU NGẮN GỌN (TỐI ĐA 7 TỪ)",
      "durationSec": 8,
      "voiceover": "Lời dẫn tiếng Việt chuẩn xác, sắc bén cho phân cảnh 1...",
      "visualPrompt": "Authentic photojournalistic wide shot of ${coreSubject}, dramatic natural lighting, 35mm lens, 8k ultra detailed",
      "cameraMotion": "dolly-in",
      "lightingStyle": "volumetric",
      "sfx": "Broadcast News Stinger + Deep Pulse",
      "transition": "fade"
    }
  ]
}`;
}

/**
 * Trích xuất & làm sạch JSON an toàn từ phản hồi LLM (xử lý cả xuống dòng thô và dấu phẩy thừa)
 */
function extractJsonFromText(rawText: string): any {
  let cleaned = (rawText || '').trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '').trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // Xóa dấu phẩy thừa trước } hoặc ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(cleaned);
  } catch {
    // Sửa lỗi ký tự xuống dòng chưa escape bên trong chuỗi JSON
    let inStr = false;
    let escaped = false;
    let repaired = '';
    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escaped) {
        repaired += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        repaired += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inStr = !inStr;
        repaired += ch;
        continue;
      }
      if (inStr && (ch === '\n' || ch === '\r')) {
        repaired += ' ';
        continue;
      }
      repaired += ch;
    }
    return JSON.parse(repaired);
  }
}

/**
 * Lọc bỏ phần suy nghĩ nội bộ (`thought: true`) trên các dòng Gemini 2.5 / Gemini 3.x
 */
function extractGeminiCandidateText(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return '';
  const nonThought = parts.filter((p: any) => !p?.thought && typeof p?.text === 'string');
  if (nonThought.length > 0) {
    return nonThought.map((p: any) => p.text).join('\n').trim();
  }
  const anyText = parts.filter((p: any) => typeof p?.text === 'string');
  return anyText.length > 0 ? anyText[anyText.length - 1].text.trim() : '';
}

/**
 * Gọi LLM thông qua Server Proxy (/api/llm-generate) để tránh 100% lỗi CORS cho mọi nhà cung cấp
 */
async function callServerLlmProxy(
  provider: AIProviderId,
  model: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  endpointUrl?: string
): Promise<{ data: any; actualModel: string }> {
  const resp = await fetch('/api/llm-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      model,
      apiKey,
      systemPrompt,
      userPrompt: `[YÊU CẦU]: Hãy tạo kịch bản JSON hoàn chỉnh, bám sát thực tế cho chủ đề "${userPrompt}".`,
      endpointUrl,
    }),
  });

  if (!resp.ok) {
    const errObj = await resp.json().catch(() => null);
    throw new Error(errObj?.error || `LLM Proxy HTTP ${resp.status}`);
  }

  const json = await resp.json();
  if (!json?.text) {
    throw new Error('Empty LLM proxy response');
  }
  const parsed = extractJsonFromText(json.text);
  if (!parsed || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    throw new Error('Invalid JSON structure from LLM');
  }
  return { data: parsed, actualModel: json.actualModel || model };
}

/**
 * Gọi trực tiếp Gemini API phía trình duyệt (dự phòng khi chạy tĩnh không qua Node proxy)
 */
async function callGeminiDirectBrowser(
  preferredModel: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  endpointUrl?: string
): Promise<{ data: any; actualModel: string }> {
  const base = (endpointUrl || 'https://generativelanguage.googleapis.com/v1beta')
    .trim()
    .replace(/\/+$/, '');

  const cleanPreferred = preferredModel.replace(/^models\//, '').trim() || 'gemini-3.6-flash';
  const isNonScript = /tts|imagen|-image|embedding|veo|audio|-live|aqa/i.test(cleanPreferred);

  const candidateModels = Array.from(
    new Set([
      ...(isNonScript ? [] : [cleanPreferred]),
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemma-4-26b-a4b-it',
      'gemini-2.5-flash',
    ])
  );

  let lastError: Error | null = null;

  for (const mod of candidateModels) {
    try {
      const url = `${base}/models/${encodeURIComponent(mod)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const contents = [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n[YÊU CẦU]: Viết kịch bản JSON hoàn chỉnh cho "${userPrompt}".`,
            },
          ],
        },
      ];

      let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (res.status === 400) {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: { temperature: 0.65, maxOutputTokens: 8192 },
          }),
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = extractGeminiCandidateText(data);
      if (text) {
        const parsed = extractJsonFromText(text);
        if (parsed && Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
          return { data: parsed, actualModel: mod };
        }
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Không thể kết nối Gemini API.');
}

/**
 * ĐỘNG CƠ BIÊN KỊCH BÁO CHÍ & ĐIỆN ẢNH ĐA THỂ LOẠI NỘI BỘ
 * Tự động tổng hợp từ dữ liệu Google News RSS & Wikipedia thời gian thực cho MỌI chủ đề bất kỳ
 */
function generateBespokeMultiGenreScript(
  coreSubject: string,
  videoGenre: VideoGenre,
  domain: TopicDomain,
  research: TopicResearchPayload,
  skill: Skill | undefined
): any {
  const h1 = research.headlines[0]?.title;
  const h2 = research.headlines[1]?.title;
  const h3 = research.headlines[2]?.title;
  const src1 = research.headlines[0]?.source || 'các hãng thông tấn quốc tế';
  const src2 = research.headlines[1]?.source || 'giới phân tích chiến lược';

  // Tách 1-2 câu ngắn gọn từ Wikipedia nếu có
  const wikiClean = (research.wikiSummary || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 35 && s.length < 220);
  const wikiFact1 = wikiClean[0] || '';

  // 1. CHẾ ĐỘ BẢN TIN THỜI SỰ / ĐỊA CHÍNH TRỊ / CHIẾN SỰ 24H
  if (videoGenre === 'news-broadcast') {
    const isGeopolitics = domain === 'geopolitics';
    const title = isGeopolitics
      ? `Bản Tin Đặc Biệt: Toàn Cảnh ${coreSubject} — Diễn Biến Nóng & Tác Động Chiến Lược`
      : `Bản Tin Thời Sự 24h: Tiêu Điểm ${coreSubject} & Cập Nhật Mới Nhất`;

    const tickerItems =
      research.headlines.length > 0
        ? research.headlines.slice(0, 4).map((h) => `[${h.source.toUpperCase()}] ${h.title}`)
        : [
          `TRỰC TIẾP 24H: Theo dõi sát diễn biến ${coreSubject}`,
          'Cập nhật liên tục từ các hãng thông tấn quốc tế và giới quan sát khu vực',
          'Phân tích đa chiều tác động ngoại giao, an ninh và kinh tế toàn cầu',
        ];

    const scenes = [
      {
        sceneNumber: 1,
        headline: `01. TIÊU ĐIỂM NÓNG: ${truncateHeadlineWords(coreSubject.toUpperCase(), 42)}`,
        durationSec: 8,
        voiceover: h1
          ? `Kính chào quý vị đang theo dõi Bản tin Đặc biệt. Tâm điểm chú ý của dư luận quốc tế hôm nay đổ dồn vào ${coreSubject}. Theo ghi nhận mới nhất từ ${src1}, ${h1}.`
          : `Kính chào quý vị đang theo dõi Bản tin Thời sự Đặc biệt. Tâm điểm chú ý của dư luận trong nước và quốc tế đang đổ dồn về ${coreSubject} với hàng loạt diễn biến dồn dập và hết sức đáng chú ý.`,
        visualPrompt: `Breaking news broadcast photojournalism wide shot of ${coreSubject}, dramatic real-world atmosphere, 35mm lens, 8k press photography`,
        cameraMotion: 'dolly-in',
        lightingStyle: 'studio-clean',
        sfx: 'Breaking News Broadcast Stinger + Deep Pulse',
        transition: 'fade',
      },
      {
        sceneNumber: 2,
        headline: isGeopolitics
          ? '02. DIỄN BIẾN THỰC ĐỊA & CÁN CÂN ĐỐI ĐẦU'
          : '02. BỐI CẢNH & NGUYÊN NHÂN CỐT LÕI',
        durationSec: 9,
        voiceover: wikiFact1
          ? `Nhìn vào bức tranh tổng thể, giới quan sát chỉ rõ nền tảng cốt lõi của vấn đề. ${wikiFact1} Chính những mâu thuẫn tích tụ này đã đẩy cục diện bước sang giai đoạn nhạy cảm mới.`
          : `Nhìn lại chuỗi sự kiện vừa qua, căng thẳng xoay quanh ${coreSubject} không bùng phát ngẫu nhiên mà bắt nguồn từ những bước đi chiến lược và lợi ích cốt lõi khó dung hòa giữa các bên liên quan.`,
        visualPrompt: `Strategic command map and satellite reconnaissance overview of ${coreSubject}, photojournalistic documentary style, 8k`,
        cameraMotion: 'pan-right',
        lightingStyle: 'volumetric',
        sfx: 'Radar Telemetry Sweep + Low Tension Drone',
        transition: 'dissolve',
      },
      {
        sceneNumber: 3,
        headline: '03. CẬP NHẬT TỪ TRUYỀN THÔNG QUỐC TẾ',
        durationSec: 9,
        voiceover: h2
          ? `Trong diễn biến liên quan vừa được ${src2} công bố: ${h2}. Động thái này ngay lập tức buộc các bên phải điều chỉnh trạng thái sẵn sàng và tăng cường các biện pháp răn đe chiến lược.`
          : `Các nguồn tin thực địa và truyền thông quốc tế liên tục phát đi tín hiệu cho thấy mức độ cảnh giác đang được đẩy lên cao nhất, kéo theo nhiều cuộc họp tham vấn khẩn cấp ở cấp cao.`,
        visualPrompt: `International press briefing and diplomatic flags representing ${coreSubject}, crisp broadcast photojournalism, 85mm lens`,
        cameraMotion: 'orbit',
        lightingStyle: 'rembrandt',
        sfx: 'Press Camera Shutters + Subtle Whoosh',
        transition: 'cut',
      },
      {
        sceneNumber: 4,
        headline: isGeopolitics
          ? '04. TÁC ĐỘNG AN NINH & CHUỖI CUNG ỨNG TOÀN CẦU'
          : '04. TÁC ĐỘNG ĐA CHIỀU TỚI XÃ HỘI & KINH TẾ',
        durationSec: 8,
        voiceover: h3
          ? `Không chỉ dừng lại ở khía cạnh chính trị, sức nóng của ${coreSubject} đã lan sang thị trường toàn cầu. Ghi nhận thực tế cho thấy: ${h3}, tạo áp lực lớn lên giá năng lượng và chuỗi vận tải quốc tế.`
          : `Sức nóng từ ${coreSubject} đang tạo ra hiệu ứng dây chuyền rõ nét lên thị trường tài chính, giá dầu mỏ cũng như tâm lý thận trọng của giới đầu tư trên khắp các châu lục.`,
        visualPrompt: `Global energy shipping routes and financial market screens reacting to ${coreSubject}, dramatic cinematic realism, 8k`,
        cameraMotion: 'crane-up',
        lightingStyle: 'studio-clean',
        sfx: 'Data Ticker Pulse + Atmospheric Riser',
        transition: 'dissolve',
      },
      {
        sceneNumber: 5,
        headline: '05. PHẢN ỨNG NGOẠI GIAO & CÁC BÊN LIÊN QUAN',
        durationSec: 8,
        voiceover: `Trên bàn cờ ngoại giao, cộng đồng quốc tế đang nỗ lực kêu gọi kiềm chế tối đa nhằm ngăn chặn nguy cơ leo thang ngoài tầm kiểm soát, đồng thời mở ra các kênh đối thoại hậu trường đầy căng thẳng.`,
        visualPrompt: `United Nations and international diplomatic summit table discussing ${coreSubject}, dramatic architectural lighting, 35mm lens, 8k`,
        cameraMotion: 'pan-left',
        lightingStyle: 'volumetric',
        sfx: 'Subtle Orchestral Tension + Transition Hit',
        transition: 'cut',
      },
      {
        sceneNumber: 6,
        headline: '06. NHẬN ĐỊNH CHUYÊN GIA & DỰ BÁO KỊCH BẢN',
        durationSec: 8,
        voiceover: `Giới phân tích nhận định những ngày sắp tới sẽ mang tính quyết định đối với toàn bộ cục diện ${coreSubject}. Chúng tôi sẽ tiếp tục cập nhật ngay khi có thông tin mới nhất. Quý vị nhận định thế nào về tình hình này?`,
        visualPrompt: `Modern live television newsroom studio wrap-up with world map backdrop covering ${coreSubject}, slow Dolly Out shot, 8k broadcast quality`,
        cameraMotion: 'dolly-out',
        lightingStyle: 'studio-clean',
        sfx: 'Broadcast News Finale Theme',
        transition: 'fade',
      },
    ];

    return {
      title,
      newsTicker: tickerItems.join('  •  '),
      musicGenre: 'Broadcast Breaking News Pulse (Commercial Master)',
      tags: ['BanTin24h', 'ThoiSuQuocTe', 'TinNong', 'PhanTichChienLuoc', 'DiaChinhTri'],
      scenes,
    };
  }

  // 2. CHẾ ĐỘ PHÂN TÍCH TÀI CHÍNH / KINH TẾ VĨ MÔ
  if (videoGenre === 'finance-analysis') {
    const title = `Tiêu Điểm Tài Chính: Giải Mã ${coreSubject} & Xu Hướng Dòng Tiền Mới Nhất`;
    const tickerItems =
      research.headlines.length > 0
        ? research.headlines.slice(0, 4).map((h) => `${h.title} (${h.source})`)
        : [
          `THỊ TRƯỜNG 24H: Cập nhật biến động ${coreSubject}`,
          'Theo dõi sát động thái chính sách tiền tệ, tỷ giá và dòng vốn đầu tư tổ chức',
        ];

    const scenes = [
      {
        sceneNumber: 1,
        headline: `01. BIẾN ĐỘNG TÂM ĐIỂM: ${truncateHeadlineWords(coreSubject.toUpperCase(), 38)}`,
        durationSec: 8,
        voiceover: h1
          ? `Chào mừng quý nhà đầu tư đến với Bản tin Phân tích Thị trường. Tâm điểm tài chính hôm nay ghi nhận biến động mạnh xoay quanh ${coreSubject}. Theo ${src1}, ${h1}.`
          : `Chào mừng quý vị đến với Tiêu điểm Tài chính. Phiên giao dịch hôm nay chứng kiến sự dịch chuyển đáng chú ý của dòng tiền lớn xoay quanh ${coreSubject}, thu hút sự quan tâm đặc biệt của giới đầu tư.`,
        visualPrompt: `Financial stock exchange trading floor and live market charts showing ${coreSubject}, crisp Bloomberg style photography, 8k`,
        cameraMotion: 'dolly-in',
        lightingStyle: 'studio-clean',
        sfx: 'Market Bell & Financial Data Pulse',
        transition: 'fade',
      },
      {
        sceneNumber: 2,
        headline: '02. ĐỘNG LỰC VĨ MÔ ĐẰNG SAU NHỊP BIẾN ĐỘNG',
        durationSec: 8,
        voiceover: `Phân tích sâu các chỉ báo kinh tế vĩ mô cho thấy sự thay đổi kỳ vọng lãi suất, áp lực lạm phát và nhu cầu phòng vệ rủi ro chính là ba lực đẩy trực tiếp định hình xu hướng của ${coreSubject}.`,
        visualPrompt: `Macroeconomic data analytics terminal and central bank skyline representing ${coreSubject}, shallow depth of field, 8k`,
        cameraMotion: 'pan-right',
        lightingStyle: 'volumetric',
        sfx: 'Smooth Data Sweep',
        transition: 'dissolve',
      },
      {
        sceneNumber: 3,
        headline: '03. DỮ LIỆU THỊ TRƯỜNG & PHẢN ỨNG NHÀ ĐẦU TƯ',
        durationSec: 8,
        voiceover: h2
          ? `Số liệu cập nhật từ ${src2} cũng nhấn mạnh: ${h2}. Thanh khoản thị trường tăng vọt phản ánh cuộc đấu trí quyết liệt giữa lực cầu bắt đáy và áp lực chốt lời ngắn hạn.`
          : `Thanh khoản trên thị trường ghi nhận mức tăng trưởng đột biến so với trung bình tuần trước, phản ánh tâm lý nhạy bén của cả khối ngoại lẫn nhà đầu tư cá nhân trong nước.`,
        visualPrompt: `Gold bullion vault and global currency trading screens illustrating ${coreSubject}, cinematic lighting, 8k`,
        cameraMotion: 'orbit',
        lightingStyle: 'rembrandt',
        sfx: 'Subtle Digital Chime + Whoosh',
        transition: 'cut',
      },
      {
        sceneNumber: 4,
        headline: '04. TÁC ĐỘNG LIÊN THỊ TRƯỜNG & TỶ GIÁ',
        durationSec: 8,
        voiceover: `Mọi nhịp rung lắc của ${coreSubject} đều tạo hiệu ứng lan tỏa trực tiếp sang tỷ giá ngoại hối, chi phí vốn doanh nghiệp và mặt bằng định giá các nhóm ngành trụ cột trong quý tới.`,
        visualPrompt: `Global trade container port and financial district towers at dusk representing ${coreSubject}, aerial crane shot, 8k`,
        cameraMotion: 'crane-up',
        lightingStyle: 'golden-hour',
        sfx: 'Deep Sub Pulse',
        transition: 'dissolve',
      },
      {
        sceneNumber: 5,
        headline: '05. KỊCH BẢN QUẢN TRỊ RỦI RO & CHIẾN LƯỢC',
        durationSec: 8,
        voiceover: `Trong bối cảnh biên độ dao động mở rộng, các chuyên gia khuyến nghị ưu tiên kỷ luật quản trị danh mục, phân bổ tỷ trọng hợp lý và tuyệt đối tránh tâm lý mua đuổi theo đám đông.`,
        visualPrompt: `Executive financial analyst reviewing portfolio strategy charts on ${coreSubject}, clean modern office lighting, 85mm lens`,
        cameraMotion: 'dolly-out',
        lightingStyle: 'studio-clean',
        sfx: 'Broadcast Closing Chord',
        transition: 'fade',
      },
    ];

    return {
      title,
      newsTicker: tickerItems.join('  •  '),
      musicGenre: 'Financial Market Pulse Ambient',
      tags: ['TaiChinh24h', 'KinhTeViMo', 'XuHuongDongTien', 'DauTu', 'ThiTruong'],
      scenes,
    };
  }

  // 3. CHẾ ĐỘ PHIM TÀI LIỆU KHOA HỌC / LỊCH SỬ / KHÁM PHÁ
  if (videoGenre === 'documentary') {
    const title = `Hồ Sơ Khám Phá: Giải Mã Toàn Diện ${coreSubject}`;
    const scenes = [
      {
        sceneNumber: 1,
        headline: `01. DẤU ẤN MỞ ĐẦU: ${truncateHeadlineWords(coreSubject.toUpperCase(), 40)}`,
        durationSec: 8,
        voiceover: wikiFact1
          ? `Trong dòng chảy vĩ đại của tri thức nhân loại, ${coreSubject} luôn giữ một vị trí đặc biệt đầy cuốn hút. ${wikiFact1}`
          : `Trong hành trình khám phá những cột mốc vĩ đại của lịch sử và khoa học, ${coreSubject} hiện lên như một câu chuyện phi thường chứa đựng biết bao bài học và bí ẩn vượt thời gian.`,
        visualPrompt: `Epic National Geographic documentary opening wide shot of ${coreSubject}, dramatic volumetric god rays, 35mm cinema lens, 8k`,
        cameraMotion: 'dolly-in',
        lightingStyle: 'volumetric',
        sfx: 'Documentary Orchestral Swell',
        transition: 'fade',
      },
      {
        sceneNumber: 2,
        headline: '02. BỐI CẢNH HÌNH THÀNH & DỮ KIỆN CỐT LÕI',
        durationSec: 9,
        voiceover: `Khi lật mở từng lớp tư liệu lưu trữ và bằng chứng thực tế, các nhà nghiên cứu đã tái hiện lại bức tranh toàn cảnh đầy sống động về quá trình hình thành và phát triển của ${coreSubject}.`,
        visualPrompt: `Detailed archival documentary close-up showcasing authentic context of ${coreSubject}, warm Rembrandt lighting, 85mm lens, 8k`,
        cameraMotion: 'pan-right',
        lightingStyle: 'rembrandt',
        sfx: 'Archival Page & Atmospheric Wind',
        transition: 'dissolve',
      },
      {
        sceneNumber: 3,
        headline: '03. BƯỚC NGOẶT QUYẾT ĐỊNH LÀM NÊN KỲ TÍCH',
        durationSec: 9,
        voiceover: h1
          ? `Đáng chú ý hơn, những công bố nghiên cứu gần đây tiếp tục mang đến góc nhìn mới: ${h1}, làm sáng tỏ thêm những chi tiết từng gây tranh luận suốt nhiều thập kỷ.`
          : `Chính tại thời khắc thử thách khắc nghiệt nhất, những yếu tố đột phá đã hội tụ để tạo nên bước ngoặt lịch sử, định hình giá trị trường tồn cho ${coreSubject}.`,
        visualPrompt: `Dramatic cinematic perspective capturing the pivotal moment of ${coreSubject}, rich film grain, volumetric atmosphere, 8k`,
        cameraMotion: 'orbit',
        lightingStyle: 'golden-hour',
        sfx: 'Deep Timpani Impact + Riser',
        transition: 'cut',
      },
      {
        sceneNumber: 4,
        headline: '04. Ý NGHĨA KHOA HỌC & GIÁ TRỊ DI SẢN',
        durationSec: 8,
        voiceover: `Vượt ra khỏi phạm vi của một sự kiện đơn lẻ, những giá trị đúc kết từ ${coreSubject} đã đặt nền móng quan trọng cho nhận thức của thế giới hiện đại ngày hôm nay.`,
        visualPrompt: `Sweeping aerial crane shot illustrating the enduring legacy of ${coreSubject}, breathtaking natural light, 8k documentary cinematography`,
        cameraMotion: 'crane-up',
        lightingStyle: 'volumetric',
        sfx: 'Ethereal Choir & Sub-Bass',
        transition: 'dissolve',
      },
      {
        sceneNumber: 5,
        headline: '05. LỜI KẾT & SUY NGẪM VƯỢT THỜI GIAN',
        durationSec: 8,
        voiceover: `Khép lại hồ sơ khám phá hôm nay, ${coreSubject} vẫn là minh chứng sống động cho khát vọng vươn tới chân lý của con người. Hãy để lại góc nhìn của bạn ở phần bình luận bên dưới!`,
        visualPrompt: `Majestic golden hour wide shot concluding the documentary story of ${coreSubject}, slow Dolly Out, 35mm cinema film look, 8k`,
        cameraMotion: 'dolly-out',
        lightingStyle: 'golden-hour',
        sfx: 'Cinematic Documentary Finale Chord',
        transition: 'fade',
      },
    ];

    return {
      title,
      musicGenre: 'Epic Documentary Orchestral Score',
      tags: ['PhimTaiLieu', 'KhamPha', 'KienThuc', 'HoSoLichSu', 'KhoaHoc'],
      scenes,
    };
  }

  // 4. CHẾ ĐỘ PHẦN CỨNG / CÔNG NGHỆ (CHỈ KHI ĐÚNG DOMAIN HARDWARE)
  if (videoGenre === 'apple-keynote') {
    const title = `Đánh Giá Chuyên Sâu ${coreSubject} — Thiết Kế, Hiệu Năng & Trải Nghiệm Thực Tế`;
    const scenes = [
      {
        sceneNumber: 1,
        headline: `01. LỘ DIỆN THIẾT KẾ ${coreSubject.toUpperCase()}`,
        durationSec: 8,
        voiceover: `Ngay trước mắt chúng ta là ${coreSubject} — thế hệ thiết bị mới nhất gây ấn tượng mạnh nhờ ngôn ngữ thiết kế nguyên khối tinh xảo, độ hoàn thiện vật liệu cao cấp và cảm giác cầm nắm cực kỳ đầm tay.`,
        visualPrompt: `Studio hardware reveal of ${coreSubject}, sleek industrial craftsmanship, slow Dolly In, 35mm lens, clean studio rim lighting, 8k`,
        cameraMotion: 'dolly-in',
        lightingStyle: 'studio-clean',
        sfx: 'Sub-Bass Drop + Metallic Shimmer',
        transition: 'fade',
      },
      {
        sceneNumber: 2,
        headline: '02. KHÔNG GIAN HIỂN THỊ & TẦN SỐ QUÉT 120HZ',
        durationSec: 8,
        voiceover: `Điểm nhấn thị giác nổi bật trên ${coreSubject} nằm ở tấm nền độ phân giải cao với viền siêu mỏng, độ sáng vượt trội hiển thị rõ nét ngay cả dưới nắng gắt cùng chuyển động mượt mà ở tần số 120Hz.`,
        visualPrompt: `Close-up showcase of ${coreSubject} high-brightness OLED display, vibrant color accuracy, smooth Orbit shot, 85mm lens, 8k`,
        cameraMotion: 'orbit',
        lightingStyle: 'cyberpunk',
        sfx: 'Clean UI Shimmer',
        transition: 'dissolve',
      },
      {
        sceneNumber: 3,
        headline: '03. KIẾN TRÚC VI XỬ LÝ & HIỆU NĂNG AI',
        durationSec: 8,
        voiceover: `Bên trong thân máy mỏng gọn của ${coreSubject} là thế hệ chip xử lý tiến trình mới tích hợp nhân tăng tốc trí tuệ nhân tạo, xử lý mượt mà các tác vụ dựng hình nặng mà vẫn kiểm soát nhiệt độ ấn tượng.`,
        visualPrompt: `Macro shot of semiconductor processor architecture powering ${coreSubject}, FPV zoom, volumetric lighting, 8k`,
        cameraMotion: 'fpv-zoom',
        lightingStyle: 'volumetric',
        sfx: 'Neural Pulse Hum',
        transition: 'cut',
      },
      {
        sceneNumber: 4,
        headline: '04. HỆ THỐNG QUANG HỌC & QUAY PHIM CHUYÊN NGHIỆP',
        durationSec: 8,
        voiceover: `Cụm ống kính quang học thế hệ mới kết hợp thuật toán xử lý hình ảnh thông minh giúp ${coreSubject} tái tạo dải tương phản động rộng và độ chi tiết sắc nét trong cả môi trường thiếu sáng.`,
        visualPrompt: `Macro tracking shot across optical camera array of ${coreSubject}, sapphire glass reflections, Pan Right, 85mm macro lens, 8k`,
        cameraMotion: 'pan-right',
        lightingStyle: 'rembrandt',
        sfx: 'Mechanical Shutter Click',
        transition: 'dissolve',
      },
      {
        sceneNumber: 5,
        headline: '05. TỔNG KẾT & GIÁ TRỊ TRẢI NGHIỆM THỰC TẾ',
        durationSec: 8,
        voiceover: `Tổng hòa giữa thiết kế bền bỉ, hiệu năng mạnh mẽ và thời lượng pin dài hơi, ${coreSubject} là lựa chọn rất đáng cân nhắc trong phân khúc hiện nay. Đâu là nâng cấp bạn yêu thích nhất?`,
        visualPrompt: `Hero wide studio showcase of ${coreSubject} on dark minimalist surface, slow Dolly Out, 8k commercial photography`,
        cameraMotion: 'dolly-out',
        lightingStyle: 'studio-clean',
        sfx: 'Clean Commercial Finale Chord',
        transition: 'fade',
      },
    ];

    return {
      title,
      musicGenre: 'Minimal Tech Commercial Synth',
      tags: ['ReviewCongNghe', 'TechStudio', coreSubject.replace(/\s+/g, '')],
      scenes,
    };
  }

  // 5. CHẾ ĐỘ ĐỜI SỐNG / ẨM THỰC / DU LỊCH / VIRAL XÃ HỘI
  const title = `Khám Phá Trọn Vẹn ${coreSubject} — Những Góc Nhìn Đắt Giá Nhất`;
  const scenes = [
    {
      sceneNumber: 1,
      headline: `01. HÀNH TRÌNH KHÁM PHÁ ${truncateHeadlineWords(coreSubject.toUpperCase(), 38)}`,
      durationSec: 8,
      voiceover: wikiFact1
        ? `Nếu bạn đang tìm kiếm một trải nghiệm thực sự đáng nhớ, hãy cùng chúng tôi đến ngay với ${coreSubject}. ${wikiFact1}`
        : `Nếu bạn từng tự hỏi điều gì làm nên sức hút đặc biệt của ${coreSubject}, hãy cùng theo dõi trọn vẹn hành trình khám phá chân thực và sống động ngay sau đây.`,
      visualPrompt: `Vibrant cinematic establishing shot of ${coreSubject}, natural golden sunlight, 35mm lens, authentic atmosphere, 8k`,
      cameraMotion: 'dolly-in',
      lightingStyle: 'golden-hour',
      sfx: 'Warm Acoustic Swell + Whoosh',
      transition: 'fade',
    },
    {
      sceneNumber: 2,
      headline: '02. NÉT ĐẶC SẮC TẠO NÊN BẢN SẮC RIÊNG',
      durationSec: 8,
      voiceover: `Điểm chạm đầu tiên chinh phục mọi giác quan chính là sự hòa quyện tinh tế giữa không gian, con người và những giá trị nguyên bản được gìn giữ trọn vẹn tại ${coreSubject}.`,
      visualPrompt: `Authentic close-up detail shot capturing the rich texture and culture of ${coreSubject}, shallow depth of field, 85mm lens, 8k`,
      cameraMotion: 'orbit',
      lightingStyle: 'rembrandt',
      sfx: 'Natural Ambient Transition',
      transition: 'dissolve',
    },
    {
      sceneNumber: 3,
      headline: '03. TRẢI NGHIỆM THỰC TẾ ĐẦY CẢM HỨNG',
      durationSec: 8,
      voiceover: h1
        ? `Đặc biệt trong thời gian gần đây, ${h1}, càng khiến ${coreSubject} trở thành tâm điểm được cộng đồng yêu thích và chia sẻ rộng rãi.`
        : `Từng khoảnh khắc trải nghiệm thực tế đều mang lại nguồn năng lượng tươi mới, mở ra những góc nhìn thú vị mà qua ảnh chụp thông thường khó lòng cảm nhận hết được.`,
      visualPrompt: `Dynamic tracking shot following real-life experience of ${coreSubject}, crisp natural daylight, 60fps cinematic look, 8k`,
      cameraMotion: 'pan-right',
      lightingStyle: 'studio-clean',
      sfx: 'Upbeat Rhythm Hit',
      transition: 'cut',
    },
    {
      sceneNumber: 4,
      headline: '04. KINH NGHIỆM & LƯU Ý ĐÁNG GIÁ',
      durationSec: 8,
      voiceover: `Để có trải nghiệm trọn vẹn nhất với ${coreSubject}, thời điểm lý tưởng và sự chuẩn bị kỹ lưỡng về lịch trình sẽ giúp bạn tận hưởng trọn vẹn từng khoảnh khắc đáng giá.`,
      visualPrompt: `Scenic aerial perspective overlooking ${coreSubject}, atmospheric morning mist and warm sunbeams, 8k photography`,
      cameraMotion: 'crane-up',
      lightingStyle: 'volumetric',
      sfx: 'Soft Chime & Breeze',
      transition: 'dissolve',
    },
    {
      sceneNumber: 5,
      headline: '05. LỜI KẾT & CHIA SẺ CÙNG CỘNG ĐỒNG',
      durationSec: 8,
      voiceover: `Hy vọng hành trình khám phá ${coreSubject} vừa rồi đã mang đến cho bạn nhiều cảm hứng mới mẻ. Bạn ấn tượng nhất với chi tiết nào? Hãy chia sẻ ngay dưới phần bình luận nhé!`,
      visualPrompt: `Warm sunset wide shot concluding the story of ${coreSubject}, slow Dolly Out camera movement, 35mm cinema look, 8k`,
      cameraMotion: 'dolly-out',
      lightingStyle: 'golden-hour',
      sfx: 'Warm Acoustic Finale',
      transition: 'fade',
    },
  ];

  return {
    title,
    musicGenre: 'Inspiring Acoustic & Cinematic Pulse',
    tags: [
      coreSubject.replace(/[^a-zA-Z0-9À-ỹ]/g, '').slice(0, 22) || 'KhamPha',
      'TraiNghiem',
      'XuHuong',
      ...(skill?.defaultTags?.map((t) => t.replace(/^#/, '')).slice(0, 2) || ['SynapesStudio']),
    ],
    scenes,
  };
}

/**
 * Chọn hồ sơ giọng đọc Tiếng Việt chuẩn xác theo từng Thể loại Video
 */
function pickDefaultVoiceForGenre(
  videoGenre: VideoGenre,
  domain: TopicDomain
): { id: string; label: string; speed: number; pitch: number } {
  if (videoGenre === 'news-broadcast' || videoGenre === 'finance-analysis') {
    return {
      id: 'vi-dn-male-1',
      label: 'Anh Văn Quang (Phát thanh viên Thời sự 24h — Rõ ràng, Dõng dạc)',
      speed: 1.05,
      pitch: 0.92,
    };
  }
  if (videoGenre === 'documentary') {
    return {
      id: 'vi-hn-male-1',
      label: 'Anh Hoàng (Hà Nội — Giọng Trầm Phóng Sự & Tài Liệu)',
      speed: 1.0,
      pitch: 0.88,
    };
  }
  if (domain === 'food' || domain === 'travel') {
    return {
      id: 'vi-sg-female-1',
      label: 'Chị Diệu Thảo (Sài Gòn — Truyền cảm, Gần gũi)',
      speed: 1.08,
      pitch: 1.12,
    };
  }
  if (videoGenre === 'apple-keynote') {
    return {
      id: 'vi-apple-keynote-male',
      label: 'Anh Tuấn Kiệt (Keynote Master — Giọng Trầm Điện Ảnh)',
      speed: 0.98,
      pitch: 0.86,
    };
  }
  return {
    id: 'vi-sg-male-1',
    label: 'Anh Nam Minh (Sài Gòn — Năng động, Cuốn hút)',
    speed: 1.12,
    pitch: 0.96,
  };
}

/**
 * HÀM CHÍNH: Nghiên cứu chủ đề thời gian thực + Gọi LLM + Tổ hợp dự án Video đa phân cảnh
 */
export async function generateAiVideoScript(
  params: GenerateScriptParams
): Promise<GeneratedScriptResult> {
  const {
    prompt,
    skillId,
    skills,
    aspectRatio,
    targetDurationMin,
    provider,
    model,
    apiKey,
    endpointUrl,
    onProgress,
  } = params;

  const skill = skills.find((s) => s.id === skillId || s.command === skillId);
  const provMeta = PROVIDERS.find((p) => p.id === provider);
  const provName = provMeta?.name || provider;

  // 1. Kiểm tra nếu người dùng yêu cầu "Tạo bản tin ngẫu nhiên" không chỉ định chủ đề cụ thể
  const isRandomReq = isGenericRandomTopicRequest(prompt);
  let coreSubject = isRandomReq
    ? RANDOM_TOPIC_PRESETS[Math.floor(Math.random() * RANDOM_TOPIC_PRESETS.length)].prompt
    : extractCleanSubject(prompt);

  if (isRandomReq) {
    coreSubject = extractCleanSubject(coreSubject);
  }

  onProgress?.(`Đang tra cứu dữ liệu thời gian thực & báo chí cho "${coreSubject}"...`, 20);

  // 2. Tra cứu Google News RSS + Wikipedia + Ảnh báo chí thực tế từ Backend
  let research = await fetchRealtimeTopicResearch(coreSubject);

  // Nếu là bản tin ngẫu nhiên và Google News trả về tin nóng thực tế, có thể lấy ngay tiêu điểm nóng nhất
  if (isRandomReq && research.headlines.length > 0 && /thời sự|quốc tế/i.test(prompt)) {
    const liveTopHeadline = research.headlines[0].title;
    if (liveTopHeadline && liveTopHeadline.length > 15) {
      coreSubject = liveTopHeadline;
      research = await fetchRealtimeTopicResearch(coreSubject);
    }
  }

  const domain: TopicDomain = research.domain || classifyTopicDomainClient(coreSubject);
  const videoGenre: VideoGenre = detectVideoGenre(prompt, coreSubject, domain, skill);

  const systemPrompt = buildDirectorSystemPrompt(
    prompt,
    coreSubject,
    videoGenre,
    domain,
    research,
    skill,
    aspectRatio,
    targetDurationMin
  );

  let rawJson: any = null;
  let isLiveApi = false;
  let actualModelUsed = model;
  let engineMessage = '';

  // 3. Gọi tới API của nhà cung cấp nếu người dùng đã gắn API Key
  if (apiKey && apiKey.trim().length > 5 && provider !== 'plugin') {
    try {
      onProgress?.(`Đang kết nối ${provName} (${model}) biên soạn kịch bản "${coreSubject}"...`, 48);

      try {
        const proxyRes = await callServerLlmProxy(
          provider,
          model,
          apiKey,
          systemPrompt,
          coreSubject,
          endpointUrl
        );
        rawJson = proxyRes.data;
        actualModelUsed = proxyRes.actualModel;
      } catch (proxyErr) {
        // Dự phòng gọi trực tiếp trên trình duyệt cho Gemini nếu proxy không phản hồi
        if (provider === 'gemini') {
          const directRes = await callGeminiDirectBrowser(
            model,
            apiKey,
            systemPrompt,
            coreSubject,
            endpointUrl
          );
          rawJson = directRes.data;
          actualModelUsed = directRes.actualModel;
        } else {
          throw proxyErr;
        }
      }

      if (rawJson && Array.isArray(rawJson.scenes) && rawJson.scenes.length > 0) {
        isLiveApi = true;
        engineMessage = `Đã biên kịch trực tiếp bởi ${provName} (${actualModelUsed}) kết hợp dữ liệu thời gian thực.`;
      }
    } catch (err: any) {
      console.warn('Live LLM API fallback triggered:', err);
      actualModelUsed = 'Live News & Cinema Engine';
      engineMessage = `Đã kích hoạt Động cơ Biên kịch Báo chí & Điện ảnh Thời gian thực cho "${coreSubject}".`;
    }
  } else {
    actualModelUsed = 'Live News & Cinema Engine';
  }

  // 4. Nếu chưa có API Key hoặc API quá tải: Sử dụng Động cơ Biên kịch Đa Thể Loại dựa trên dữ liệu thực tế vừa thu thập
  if (!rawJson || !Array.isArray(rawJson.scenes) || rawJson.scenes.length === 0) {
    onProgress?.(`Đang biên tập kịch bản ${videoGenre === 'news-broadcast' ? 'Bản tin 24h' : 'Điện ảnh'} từ nguồn tin thực tế...`, 70);
    rawJson = generateBespokeMultiGenreScript(coreSubject, videoGenre, domain, research, skill);
    if (!engineMessage) {
      engineMessage = `Đã hoàn tất dựng kịch bản & hình ảnh thực tế cho "${coreSubject}".`;
    }
  }

  onProgress?.('Đang đồng bộ hình ảnh báo chí thực tế, gói đồ họa & giọng đọc phát thanh viên...', 90);

  const motions: StoryboardScene['cameraMotion'][] = [
    'dolly-in',
    'pan-right',
    'orbit',
    'crane-up',
    'pan-left',
    'dolly-out',
  ];
  const lightings: StoryboardScene['lightingStyle'][] = [
    'studio-clean',
    'volumetric',
    'rembrandt',
    'golden-hour',
    'cyberpunk',
  ];

  const defaultVoice = pickDefaultVoiceForGenre(videoGenre, domain);
  const isHardwareKeynote = videoGenre === 'apple-keynote' && domain === 'hardware';

  let accumulatedSec = 0;
  const storyboard: StoryboardScene[] = (rawJson.scenes || []).map((sc: any, idx: number) => {
    const dur = Math.max(5, Math.min(15, Number(sc.durationSec) || 8));
    const startSec = accumulatedSec;
    const endSec = startSec + dur;
    accumulatedSec = endSec;

    const startMinStr = Math.floor(startSec / 60).toString().padStart(2, '0');
    const startSecStr = (startSec % 60).toString().padStart(2, '0');
    const endMinStr = Math.floor(endSec / 60).toString().padStart(2, '0');
    const endSecStr = (endSec % 60).toString().padStart(2, '0');

    const visualPrompt =
      sc.visualPrompt ||
      `Authentic photojournalistic shot of ${coreSubject}, 35mm lens, dramatic natural lighting, 8k`;

    const aiImageUrl =
      sc.imageUrl ||
      buildAiSceneImageUrl(visualPrompt, aspectRatio, idx + 1, domain, research.visuals);

    const clipUrl = SCENE_VIDEO_CLIPS[idx % SCENE_VIDEO_CLIPS.length];
    const cameraMotion = motions.includes(sc.cameraMotion)
      ? sc.cameraMotion
      : motions[idx % motions.length];
    const lightingStyle = lightings.includes(sc.lightingStyle)
      ? sc.lightingStyle
      : lightings[idx % lightings.length];

    const lowerHeadline = (sc.headline || visualPrompt || '').toLowerCase();
    // CHỈ kích hoạt hiệu ứng bóc tách chip / lá khẩu camera khi dự án thực sự là phần cứng công nghệ!
    const isChipScene =
      isHardwareKeynote &&
      (lowerHeadline.includes('chip') ||
        lowerHeadline.includes('silicon') ||
        lowerHeadline.includes('vi xử lý'));
    const isOpticsScene =
      isHardwareKeynote &&
      (lowerHeadline.includes('camera') ||
        lowerHeadline.includes('quang học') ||
        lowerHeadline.includes('ống kính'));

    const cleanHeadline = String(
      sc.headline || `0${idx + 1}. ${coreSubject.toUpperCase().slice(0, 38)}`
    ).replace(/tạo\s+bản\s+tin\s+về\s+/gi, '');

    return {
      id: idx + 1,
      sceneNumber: idx + 1,
      headline: cleanHeadline,
      timeRange: `${startMinStr}:${startSecStr} - ${endMinStr}:${endSecStr}`,
      startSec,
      endSec,
      voiceover:
        sc.voiceover ||
        `Cập nhật diễn biến quan trọng tiếp theo xoay quanh ${coreSubject} từ nguồn dữ liệu thực tế.`,
      visualPrompt,
      imageUrl: aiImageUrl,
      clipUrl,
      cameraMotion,
      lightingStyle,
      sfx: sc.sfx || 'Broadcast Transition Pulse',
      transition: sc.transition === 'fade' || sc.transition === 'dissolve' ? sc.transition : 'cut',
      voiceId: defaultVoice.id,
      voiceLanguage: 'vi',
      voiceSpeed: defaultVoice.speed,
      voicePitch: defaultVoice.pitch,
      explodedView: isChipScene,
      apertureBlades: isOpticsScene,
      appleMotion3d: isHardwareKeynote
        ? isChipScene
          ? 'exploded-chip'
          : isOpticsScene
            ? 'aperture-zoom'
            : 'titanium-orbit'
        : 'none',
    };
  });

  const totalDuration = accumulatedSec || 48;
  const heroThumbnail =
    storyboard[0]?.imageUrl ||
    buildAiSceneImageUrl(coreSubject, aspectRatio, 1, domain, research.visuals);

  const cleanFinalTitle = String(rawJson.title || `Toàn Cảnh ${coreSubject}`)
    .replace(/^tạo\s+bản\s+tin\s+về\s+/i, '')
    .trim();

  const timelineDesc = storyboard
    .map((s) => `${s.timeRange.split(' - ')[0]} — ${s.headline}`)
    .join('\n');

  const finalDescription =
    rawJson.description ||
    `${cleanFinalTitle}\n\nMỐC NỘI DUNG CHÍNH:\n${timelineDesc}`;

  const newsTickerText =
    rawJson.newsTicker ||
    (research.headlines.length > 0
      ? research.headlines
        .slice(0, 4)
        .map((h) => `[${h.source}] ${h.title}`)
        .join('  •  ')
      : storyboard.map((s) => s.headline?.replace(/^\d+\.\s*/, '')).join('  •  '));

  onProgress?.('Hoàn tất kết xuất dự án Video! Đang mở Bàn dựng Đa phân cảnh...', 100);

  return {
    success: true,
    isLiveApi,
    modelUsed: actualModelUsed,
    providerUsed: isLiveApi ? provName : 'SYNAPES Studio',
    videoGenre,
    topicDomain: domain,
    newsTickerText,
    title: cleanFinalTitle,
    description: finalDescription,
    tags:
      Array.isArray(rawJson.tags) && rawJson.tags.length > 0
        ? rawJson.tags
        : [
          coreSubject.replace(/[^a-zA-Z0-9À-ỹ]/g, '').slice(0, 20) || 'TinNong24h',
          videoGenre === 'news-broadcast' ? 'BanTinThoiSu' : 'SynapesStudio',
          'PhanTichChuyenSau',
        ],
    productLink: rawJson.productLink || 'https://synapes.ai/studio',
    musicTrack: {
      name:
        rawJson.musicGenre ||
        (videoGenre === 'news-broadcast'
          ? 'Broadcast Breaking News Orchestral Pulse'
          : 'Cinematic Studio Score'),
      license: 'Bản quyền thương mại SYNAPES Audio Engine',
      volume: 18,
    },
    voiceoverTrack: {
      name: defaultVoice.label,
      voiceName: defaultVoice.id,
    },
    duration: totalDuration,
    storyboard,
    videoUrl: SCENE_VIDEO_CLIPS[0],
    thumbnailUrl: heroThumbnail,
    engineMessage,
  };
}
