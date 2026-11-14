import type {
  AIProviderId,
  StoryboardScene,
  Skill,
  AspectRatio,
  SocialPlatformFormatId,
  VideoGenre,
  CharacterActor,
  CameraDialogueAngle,
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
  | 'hardware'
  | 'animation-3d'
  | 'creative';

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
  skills?: Skill[];
  aspectRatio: AspectRatio;
  platformFormat?: SocialPlatformFormatId;
  platformFormatLabel?: string;
  targetDurationMin: number;
  provider: AIProviderId;
  model: string;
  apiKey: string;
  endpointUrl?: string;
  attachedImageDataUrl?: string;
  attachedImageName?: string;
  attachedAudioUrl?: string;
  attachedAudioName?: string;
  signal?: AbortSignal;
  onProgress?: (stepText: string, percent: number) => void;
}

export interface GeneratedScriptResult {
  success: boolean;
  isLiveApi: boolean;
  modelUsed: string;
  providerUsed: string;
  videoGenre: VideoGenre;
  topicDomain: TopicDomain;
  platformFormat?: SocialPlatformFormatId;
  platformFormatLabel?: string;
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
    audioUrl?: string;
  };
  duration: number;
  characterActors?: CharacterActor[];
  dialogueMode?: boolean;
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
  'animation-3d': [
    '/3d_dialogue_clinic_stage.jpg',
    '/3d_dialogue_garden_stage.jpg',
    '/3d_forest_stage_1.jpg',
    '/3d_forest_stage_2.jpg',
    '/3d_insect_scene_1.jpg',
    '/3d_insect_scene_2.jpg',
  ],
  creative: [
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=85',
  ],
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
    /hoạt hình|3d|pixar|disney|thiếu nhi|đếm số|nhảy múa|côn trùng|cào cào|châu chấu|bọ rùa|ong vàng|bướm|kiến|chú thỏ|đàn thỏ|thỏ con|thỏ bông|bị ốm|bác sĩ|nói chuyện|đối thoại|hội thoại|dialogue|nhiều giọng|nhiều kiểu giọng|nursery rhyme|counting song|cartoon|animation|insect|grasshopper|rabbit|bunny/.test(
      q
    )
  ) {
    return 'animation-3d';
  }

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

  if (/trí tuệ nhân tạo|\bai\b|chatgpt|gemini|claude|deepseek|robot|bán dẫn|siêu chip|cyber|dữ liệu lớn/.test(q)) {
    return 'ai-cyber';
  }

  if (
    /bản tin|thời sự|tin tức|tin nóng|điểm tin|24h|báo chí|phóng sự|chính sách|pháp luật|bão|lũ|thời tiết|breaking news|\bnews\b/.test(
      q
    )
  ) {
    return 'news';
  }

  return 'creative';
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

  if (
    domain === 'animation-3d' ||
    /hoạt hình|3d|pixar|disney|đếm số|côn trùng|cào cào|chú thỏ|thiếu nhi|nhảy múa|animation|cartoon/.test(combined)
  ) {
    return '3d-animation';
  }
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

  // 0. Đối với Hoạt hình 3D (animation-3d): Luôn ưu tiên Sân khấu 3D Pixar nội bộ sắc nét (tuyệt đối không lấy ảnh báo chí Wikipedia)
  if (resolvedDomain === 'animation-3d') {
    const animPool = CLIENT_DOMAIN_PHOTO_POOLS['animation-3d'];
    return animPool[idx % animPool.length];
  }

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

function createUserAbortError(): Error {
  const err = new Error('Đã hủy khởi tạo dự án theo yêu cầu người dùng.');
  err.name = 'AbortError';
  return err;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw createUserAbortError();
  }
}

async function fetchWithTimeoutAndSignal(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  externalSignal?: AbortSignal
): Promise<Response> {
  throwIfAborted(externalSignal);

  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (externalSignal?.aborted) {
      throw createUserAbortError();
    }
    if (timedOut) {
      throw new Error(`Kết nối quá thời gian (${Math.round(timeoutMs / 1000)}s)`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

/**
 * Thu thập dữ liệu tin tức Google News RSS & Wikipedia thời gian thực từ Backend
 */
async function fetchRealtimeTopicResearch(
  query: string,
  externalSignal?: AbortSignal
): Promise<TopicResearchPayload> {
  const fallbackDomain = classifyTopicDomainClient(query);
  try {
    const resp = await fetchWithTimeoutAndSignal(
      `/api/topic-research?q=${encodeURIComponent(query)}`,
      {},
      5000,
      externalSignal
    );
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
  } catch (err: any) {
    if (err?.name === 'AbortError' || externalSignal?.aborted) {
      throw createUserAbortError();
    }
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
  targetDurationMin: number,
  platformFormatLabel?: string,
  hasAttachedImage?: boolean
): string {
  const isShort = aspectRatio === '9:16';
  const isCountingSong = /đếm\s*số|1\s*đến\s*10|một\s*đến\s*mười|counting/i.test(`${rawPrompt} ${coreSubject}`);
  const sceneCount = videoGenre === '3d-animation' && isCountingSong ? 10 : isShort ? 5 : 6;

  const roleInstruction =
    videoGenre === '3d-animation'
      ? `Bạn là Tổng Đạo Diễn Phim Hoạt Hình 3D (chuẩn Pixar / Disney). Phong cách: Tươi sáng, sinh động, mô tả chuyển động hình thể nhân vật 3D rõ ràng và giữ tính nhất quán tạo hình nhân vật 100% xuyên suốt mọi khung hình.`
      : videoGenre === 'news-broadcast'
      ? `Bạn là Tổng Biên Tập & Đạo Diễn Bản Tin Thời Sự Quốc Tế 24h (chuẩn VTV1, Reuters, BBC World News). Phong cách: Chính xác, khách quan, sắc bén, dẫn dắt dữ kiện thực tế có chiều sâu địa chính trị - xã hội. TUYỆT ĐỐI CẤM dùng văn mẫu quảng cáo sản phẩm công nghệ (như "siêu phẩm", "tuyệt tác công nghệ", "thay đổi cuộc chơi") cho bản tin thời sự!`
      : videoGenre === 'finance-analysis'
        ? `Bạn là Giám Đốc Phân Tích Kinh Tế Vĩ Mô & Tài Chính (chuẩn Bloomberg / CafeF). Phong cách: Rành mạch, có số liệu, phân tích nguyên nhân - hệ quả và xu hướng dòng vốn.`
        : videoGenre === 'documentary'
          ? `Bạn là Đạo Diễn Phim Tài Liệu Khoa Học & Lịch Sử (chuẩn National Geographic / Netflix Documentary). Phong cách: Tự sự cuốn hút, giàu tri thức xác thực và chiều sâu lịch sử.`
          : videoGenre === 'apple-keynote'
            ? `Bạn là Đạo Diễn Thương Mại Công Nghệ Cao Cấp. Phong cách: Điềm tĩnh, súc tích, tập trung vào thiết kế kỹ thuật và trải nghiệm thực tế.`
            : `Bạn là Đạo Diễn Nội Dung Sáng Tạo Đa Nền Tảng. Phong cách: Tự nhiên, giàu cảm xúc, kể chuyện hình ảnh cuốn hút ngay từ 3 giây đầu.`;

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

  const attachmentNote = hasAttachedImage
    ? `\nTƯ LIỆU HÌNH ẢNH ĐÍNH KÈM: Người dùng có đính kèm ảnh gốc làm điểm khởi đầu. BẮT BUỘC bám sát chi tiết nhân vật, bối cảnh và màu sắc từ ảnh đính kèm trong toàn bộ kịch bản và visualPrompt!`
    : '';

  return `${roleInstruction}

NHIỆM VỤ: Biên soạn kịch bản video hoàn chỉnh gồm đúng ${sceneCount} phân cảnh về chủ đề: "${coreSubject}" (Yêu cầu gốc của người dùng: "${rawPrompt}").
- Định dạng xuất bản mục tiêu: ${platformFormatLabel || (isShort ? '9:16 (Shorts / Reels / TikTok)' : `16:9 (YouTube / Video dài ${targetDurationMin} phút)`)}
- Lĩnh vực phân loại: ${domain.toUpperCase()} | Thể loại đồ họa: ${videoGenre.toUpperCase()}
- Bộ Skill: "${skill?.name || 'Biên kịch Chuyên nghiệp'}" (${skill?.tone || 'Chính xác, cuốn hút'})
- Khung hình: ${isShort ? '9:16 (Dọc chuẩn TikTok / Reels / Shorts / Threads)' : `16:9 (Ngang chuẩn YouTube / Facebook Watch, mục tiêu ${targetDurationMin} phút)`}
${liveNewsBlock}
${wikiBlock}
${attachmentNote}

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
  endpointUrl?: string,
  imageDataUrl?: string,
  externalSignal?: AbortSignal
): Promise<{ data: any; actualModel: string }> {
  const resp = await fetchWithTimeoutAndSignal(
    '/api/llm-generate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        model,
        apiKey,
        systemPrompt,
        userPrompt: `[YÊU CẦU]: Hãy tạo kịch bản JSON hoàn chỉnh, bám sát thực tế cho chủ đề "${userPrompt}".`,
        endpointUrl,
        imageDataUrl,
      }),
    },
    11000,
    externalSignal
  );

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
  endpointUrl?: string,
  imageDataUrl?: string,
  externalSignal?: AbortSignal
): Promise<{ data: any; actualModel: string }> {
  const base = (endpointUrl || 'https://generativelanguage.googleapis.com/v1beta')
    .trim()
    .replace(/\/+$/, '');

  const cleanPreferred = preferredModel.replace(/^models\//, '').trim() || 'gemini-2.0-flash';
  const isAliasOrPreview = /^(gemini-3\.[5-9]|gemma-4)/i.test(cleanPreferred);
  const isNonScript = /tts|imagen|-image|embedding|veo|audio|-live|aqa/i.test(cleanPreferred);

  const candidateModels = Array.from(
    new Set([
      ...(!isNonScript && !isAliasOrPreview ? [cleanPreferred] : []),
      'gemini-2.0-flash',
      'gemini-2.5-flash',
    ])
  );

  const parts: any[] = [
    {
      text: `${systemPrompt}\n\n[YÊU CẦU]: Viết kịch bản JSON hoàn chỉnh cho "${userPrompt}".`,
    },
  ];
  const imgMatch =
    typeof imageDataUrl === 'string'
      ? imageDataUrl.trim().match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/)
      : null;
  if (imgMatch) {
    parts.push({
      inlineData: {
        mimeType: imgMatch[1],
        data: imgMatch[2],
      },
    });
  }

  let lastError: Error | null = null;

  for (const mod of candidateModels) {
    throwIfAborted(externalSignal);
    try {
      const url = `${base}/models/${encodeURIComponent(mod)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const contents = [{ parts }];

      let res = await fetchWithTimeoutAndSignal(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.65,
              maxOutputTokens: 2500,
              responseMimeType: 'application/json',
            },
          }),
        },
        7000,
        externalSignal
      );

      if (res.status === 400) {
        res = await fetchWithTimeoutAndSignal(
          url,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: { temperature: 0.65, maxOutputTokens: 2500 },
            }),
          },
          7000,
          externalSignal
        );
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
      if (err?.name === 'AbortError' || externalSignal?.aborted) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Không thể kết nối Gemini API.');
}

function splitPromptClauses(rawPrompt: string, coreSubject: string): string[] {
  const source = (coreSubject || rawPrompt || '').trim();
  const clauses = source
    .split(/[\n.!?;]+|,\s+(?=[A-ZÀ-Ỹa-zà-ỹ0-9])/g)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6);
  return clauses.length > 0 ? clauses : [source];
}

/**
 * ĐỘNG CƠ BIÊN KỊCH BÁO CHÍ & ĐIỆN ẢNH ĐA THỂ LOẠI NỘI BỘ
 * Tự động tổng hợp từ dữ liệu Google News RSS & Wikipedia thời gian thực cho MỌI chủ đề bất kỳ
 */
function generateBespokeMultiGenreScript(
  rawPrompt: string,
  coreSubject: string,
  videoGenre: VideoGenre,
  domain: TopicDomain,
  research: TopicResearchPayload,
  skill: Skill | undefined,
  platformFormat?: SocialPlatformFormatId,
  platformFormatLabel?: string,
  hasAttachedImage?: boolean
): any {
  const h1 = research.headlines[0]?.title;
  const h2 = research.headlines[1]?.title;
  const h3 = research.headlines[2]?.title;
  const src1 = research.headlines[0]?.source || 'các hãng thông tấn quốc tế';
  const src2 = research.headlines[1]?.source || 'giới phân tích chiến lược';
  const promptClauses = splitPromptClauses(rawPrompt, coreSubject);
  const fullTextSignal = `${rawPrompt} ${coreSubject}`;

  // Tách 1-2 câu ngắn gọn từ Wikipedia nếu có
  const wikiClean = (research.wikiSummary || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 35 && s.length < 220);
  const wikiFact1 = wikiClean[0] || '';

  // 0. CHẾ ĐỘ HOẠT HÌNH 3D ĐỐI THOẠI ĐA NHÂN VẬT & SÁNG TẠO THEO PROMPT
  if (videoGenre === '3d-animation' || domain === 'animation-3d') {
    const isRabbitDialogue = /thỏ\s*con|thỏ\s*hồng|bị\s*ốm|bác\s*sĩ\s*gấu/i.test(fullTextSignal);
    const isInsectCounting = /côn\s*trùng|cào\s*cào|châu\s*chấu|đếm\s*số|1\s*đến\s*10|một\s*đến\s*mười/i.test(
      fullTextSignal
    );

    if (isRabbitDialogue) {
      const title = `Phim Hoạt Hình 3D Đối Thoại: Thỏ Con Bị Ốm & Các Bạn Nhỏ (Đa Giọng Thoại)`;
      const characterActors: CharacterActor[] = [
        {
          id: 'tho-con',
          name: 'Thỏ Con (Pink Bunny)',
          roleDescription: 'Bé thỏ hồng đáng yêu, bị đau bụng ôm lọ thuốc mếu máo',
          avatarUrl: '/3d_dialogue_clinic_stage.jpg',
          voiceId: 'vi-child-female',
          voiceName: 'Giọng Bé Gái Mếu Máo (Pitch +35%)',
          voiceSpeed: 1.05,
          voicePitch: 1.35,
          themeColor: '#ec4899',
          defaultEmotion: 'crying',
        },
        {
          id: 'cuu-bong',
          name: 'Cừu Bông (Fluffy Sheep)',
          roleDescription: 'Bạn cừu lông xoăn trắng lanh lợi, lo lắng khuyên bạn',
          avatarUrl: '/3d_dialogue_clinic_stage.jpg',
          voiceId: 'vi-child-male',
          voiceName: 'Giọng Bé Trai Lanh Lợi (Pitch +18%)',
          voiceSpeed: 1.1,
          voicePitch: 1.18,
          themeColor: '#0ea5e9',
          defaultEmotion: 'worried',
        },
        {
          id: 'meo-con',
          name: 'Mèo Con Nơ Hồng (Cute Kitten)',
          roleDescription: 'Bạn mèo con cài nơ ngọt ngào, động viên Thỏ uống thuốc',
          avatarUrl: '/3d_dialogue_clinic_stage.jpg',
          voiceId: 'vi-gentle-female',
          voiceName: 'Giọng Bé Gái Dịu Dàng (Pitch +25%)',
          voiceSpeed: 1.02,
          voicePitch: 1.25,
          themeColor: '#f59e0b',
          defaultEmotion: 'caring',
        },
        {
          id: 'bac-si',
          name: 'Bác Sĩ Gấu (Doctor Bear)',
          roleDescription: 'Bác sĩ thú y hiền từ, ân cần dặn dò ăn chín uống sôi',
          avatarUrl: '/3d_dialogue_clinic_stage.jpg',
          voiceId: 'vi-mature-male',
          voiceName: 'Giọng Trầm Ấm Ân Cần (Pitch -10%)',
          voiceSpeed: 0.96,
          voicePitch: 0.9,
          themeColor: '#10b981',
          defaultEmotion: 'caring',
        },
      ];

      const dialogueScenes = [
        {
          sceneNumber: 1,
          speakerId: 'tho-con',
          speakerName: 'Thỏ Con',
          cameraAngle: 'two-shot' as CameraDialogueAngle,
          headline: '01. THỎ CON ÔM BỤNG ĐAU — MẾU MÁO',
          durationSec: 4,
          voiceover: 'Oa oa... Mẹ ơi con đau bụng quá, thuốc đắng lắm con không muốn uống đâu!',
          voiceId: 'vi-child-female',
          voicePitch: 1.35,
          voiceSpeed: 1.05,
          visualPrompt: 'Pixar 3D animation cute pink rabbit sitting on nursery floor crying holding medicine bottle, soft yellow room lighting, 8k',
          imageUrl: '/3d_dialogue_clinic_stage.jpg',
          cameraMotion: 'dolly-in',
          lightingStyle: 'studio-clean',
          sfx: 'Soft sad xylophone + crying snuffle',
          transition: 'dissolve',
        },
        {
          sceneNumber: 2,
          speakerId: 'cuu-bong',
          speakerName: 'Cừu Bông',
          cameraAngle: 'shot-reverse-shot' as CameraDialogueAngle,
          headline: '02. CỪU BÔNG LO LẮNG HỎI THĂM',
          durationSec: 4,
          voiceover: 'Bạn Thỏ ơi đừng khóc nữa mà! Bạn ăn quả xanh uống nước lã nên mới bị đau bụng đấy!',
          voiceId: 'vi-child-male',
          voicePitch: 1.18,
          voiceSpeed: 1.1,
          visualPrompt: 'Pixar 3D animation fluffy white sheep with big expressive eyes gesturing with concern in cozy clinic room, 8k',
          imageUrl: '/3d_dialogue_clinic_stage.jpg',
          cameraMotion: 'pan-right',
          lightingStyle: 'studio-clean',
          sfx: 'Gentle harp chime + step rustle',
          transition: 'dissolve',
        },
        {
          sceneNumber: 3,
          speakerId: 'meo-con',
          speakerName: 'Mèo Con Nơ Hồng',
          cameraAngle: 'over-the-shoulder' as CameraDialogueAngle,
          headline: '03. MÈO CON DỊU DÀNG KHUYÊN BẠN',
          durationSec: 4,
          voiceover: 'Đúng rồi đó Thỏ con ơi! Ngoan ngoãn uống một thìa si-rô ngọt này là hết đau ngay thôi!',
          voiceId: 'vi-gentle-female',
          voicePitch: 1.25,
          voiceSpeed: 1.02,
          visualPrompt: 'Pixar 3D animation cute peach kitten wearing pink ribbon bow smiling warmly encouraging friend, 8k',
          imageUrl: '/3d_dialogue_clinic_stage.jpg',
          cameraMotion: 'orbit',
          lightingStyle: 'golden-hour',
          sfx: 'Sparkle bell sound + soft purr',
          transition: 'dissolve',
        },
        {
          sceneNumber: 4,
          speakerId: 'bac-si',
          speakerName: 'Bác Sĩ Gấu',
          cameraAngle: 'close-up-speaker' as CameraDialogueAngle,
          headline: '04. BÁC SĨ ÂN CẦN DẶN DÒ',
          durationSec: 4,
          voiceover: 'Bác sĩ dặn nhé: Từ nay Thỏ con phải nhớ ăn chín, uống sôi, rửa sạch tay trước khi ăn nhé!',
          voiceId: 'vi-mature-male',
          voicePitch: 0.9,
          voiceSpeed: 0.96,
          visualPrompt: 'Pixar 3D animation gentle doctor holding small spoon and medicine, warm clinic atmosphere, 8k',
          imageUrl: '/3d_dialogue_clinic_stage.jpg',
          cameraMotion: 'pan-left',
          lightingStyle: 'rembrandt',
          sfx: 'Warm acoustic cello + clock tick',
          transition: 'dissolve',
        },
        {
          sceneNumber: 5,
          speakerId: 'tho-con',
          speakerName: 'Thỏ Con',
          cameraAngle: 'close-up-speaker' as CameraDialogueAngle,
          headline: '05. THỎ CON UỐNG THUỐC — CƯỜI TƯƠI',
          durationSec: 4,
          voiceover: 'Dạ vâng ạ! Thuốc ngọt như kẹo dâu ấy! Con hết đau bụng rồi, khỏe re rồi nè!',
          voiceId: 'vi-child-female',
          voicePitch: 1.3,
          voiceSpeed: 1.08,
          visualPrompt: 'Pixar 3D animation cute pink rabbit happily clapping paws smiling wide, bright sparkling eyes, 8k',
          imageUrl: '/3d_dialogue_clinic_stage.jpg',
          cameraMotion: 'dolly-out',
          lightingStyle: 'golden-hour',
          sfx: 'Cheerful chime + cartoon pop',
          transition: 'dissolve',
        },
        {
          sceneNumber: 6,
          speakerId: 'tho-con',
          speakerName: 'Cả Ba Bạn Nhỏ',
          cameraAngle: 'master-shot' as CameraDialogueAngle,
          headline: '06. CÙNG NHAU RA VƯỜN HOA NHẢY MÚA',
          durationSec: 4,
          voiceover: 'Hoan hô! Thỏ con khỏi ốm rồi! Chúng mình cùng ra vườn hoa bắt bướm nhảy múa thôi nào!',
          voiceId: 'vi-child-female',
          voicePitch: 1.25,
          voiceSpeed: 1.1,
          visualPrompt: 'Pixar 3D animation wide shot of pink bunny, white sheep and peach kitten dancing joyfully together in a sunny flower meadow, 8k',
          imageUrl: '/3d_dialogue_garden_stage.jpg',
          cameraMotion: 'crane-up',
          lightingStyle: 'golden-hour',
          sfx: 'Celebration trumpet fanfare + lively acoustic rhythm',
          transition: 'fade',
        },
      ];

      return {
        title,
        newsTicker: 'PHIM HOẠT HÌNH 3D THIẾU NHI • THỎ CON BỊ ỐM & BÀI HỌC ĂN CHÍN UỐNG SÔI • ĐA GIỌNG THOẠI ĐỐI ỨNG',
        musicGenre: 'Gentle Acoustic Storytelling to Upbeat Kids Marimba',
        tags: ['HoatHinh3D', 'ThoConBiOm', 'DoiThoai3D', 'DaGiongThoai', 'ChunChin3D', 'SynapesStudioX'],
        characterActors,
        dialogueMode: true,
        scenes: dialogueScenes,
      };
    }

    if (isInsectCounting) {
      const title = `Vũ Hội Côn Trùng 3D Nhảy Múa Hát Đếm Số Từ 1 Đến 10 — ${coreSubject}`;
      const countingVerses = [
        { n: 1, name: 'MỘT CHÚ CÀO CÀO XANH', lyric: 'Số Một! Một chú cào cào xanh lá bật nhảy thật cao, vỗ đôi cánh mỏng hát vang lời chào ngày mới!' },
        { n: 2, name: 'HAI CHÚ ONG VÀNG CHĂM CHỈ', lyric: 'Số Hai! Một, hai! Hai chú ong vàng rực rỡ đập cánh xoay vòng, cùng nhau nhảy múa dưới nắng mai!' },
        { n: 3, name: 'BA BẠN BỌ RÙA ĐỐM ĐỎ', lyric: 'Số Ba! Một, hai, ba! Ba bạn bọ rùa áo đỏ chấm bi lắc lư theo nhịp trống rộn ràng!' },
        { n: 4, name: 'BỐN CÁNH BƯỚM NGỌC BÍCH', lyric: 'Số Bốn! Một, hai, ba, bốn! Bốn bạn bướm ngọc bích vẫy đôi cánh lấp lánh bay lượn quanh đài hoa!' },
        { n: 5, name: 'NĂM BẠN KIẾN NHỎ ĐỒNG CA', lyric: 'Số Năm! Một, hai, ba, bốn, năm! Năm bạn kiến nhỏ vui tươi vỗ tay nhịp nhàng hát vang bài ca đếm số!' },
        { n: 6, name: 'SÁU BẠN CÔN TRÙNG HÒA NHỊP', lyric: 'Số Sáu! Một, hai, ba, bốn, năm, sáu! Sáu người bạn côn trùng cùng bật nhảy khỏe khoắn trên sân khấu rừng xanh!' },
        { n: 7, name: 'BẢY VŨ CÔNG RỪNG CỔ TÍCH', lyric: 'Số Bảy! Một, hai, ba, bốn, năm, sáu, bảy! Bảy vũ công tí hon xoay vòng dưới cầu vồng bảy sắc lung linh!' },
        { n: 8, name: 'TÁM NHẠC CÔNG VỖ CÁNH', lyric: 'Số Tám! Một, hai, ba, bốn, năm, sáu, bảy, tám! Tám chú côn trùng đáng yêu đập cánh rộn rã theo điệu nhạc vui!' },
        { n: 9, name: 'CHÍN NGƯỜI BẠN TỎA SÁNG', lyric: 'Số Chín! Một, hai, ba, bốn, năm, sáu, bảy, tám, chín! Chín bạn nhỏ nắm tay nhau nhảy điệu vũ hội mùa xuân!' },
        { n: 10, name: 'MƯỜI BẠN CÔN TRÙNG ĐẠI HỢP XƯỚNG', lyric: 'Số Mười! Một, hai, ba, bốn, năm, sáu, bảy, tám, chín, mười! Đủ mười bạn côn trùng 3D cùng nhảy múa hát vang chào các bé!' },
      ];
      const animPool = CLIENT_DOMAIN_PHOTO_POOLS['animation-3d'];
      const scenes = countingVerses.map((v, i) => ({
        sceneNumber: v.n,
        headline: `${String(v.n).padStart(2, '0')}. SỐ ${v.n} — ${v.name}`,
        durationSec: 4,
        voiceover: v.lyric,
        visualPrompt: `Pixar 3D animation wide shot of exactly ${v.n} cute 3D articulated cartoon insects dancing and singing number ${v.n} on an enchanted mossy forest stump stage, subsurface scattering, 60fps skeletal motion, 8k`,
        imageUrl: animPool[i % animPool.length],
        cameraMotion: i % 2 === 0 ? 'dolly-in' : 'orbit',
        lightingStyle: 'golden-hour',
        sfx: 'Cheerful 130BPM Marimba & Cartoon Boing + Wing Buzz',
        transition: 'dissolve',
      }));

      return {
        title,
        newsTicker: 'VŨ HỘI HOẠT HÌNH 3D PIXAR • CÙNG CÁC BẠN CÔN TRÙNG NHẢY MÚA HÁT ĐẾM SỐ TỪ 1 ĐẾN 10',
        musicGenre: 'Upbeat Kids 3D Animation Marimba & Xylophone 130BPM',
        tags: ['HoatHinh3D', 'ConTrungNhayMua', 'HatDemSo1Den10', 'NhacThieuNhi3D', 'Synapes3DStudio'],
        scenes,
      };
    }

    // Các prompt hoạt hình 3D / nhân vật tự do theo đúng yêu cầu người dùng
    const c1 = promptClauses[0] || coreSubject;
    const c2 = promptClauses[1] || coreSubject;
    const animPool = CLIENT_DOMAIN_PHOTO_POOLS['animation-3d'];
    const custom3dTitle = `${coreSubject}${platformFormatLabel ? ` (${platformFormatLabel})` : ''}`;
    const custom3dScenes = [
      {
        sceneNumber: 1,
        headline: `01. MỞ MÀN: ${truncateHeadlineWords(c1.toUpperCase(), 38)}`,
        durationSec: 5,
        voiceover: hasAttachedImage
          ? `Từ khung hình tư liệu gốc đầy sống động: ${c1}. Hãy cùng bước vào thế giới chuyển động 3D rực rỡ ngay từ giây đầu tiên!`
          : `Câu chuyện bắt đầu ngay lúc này: ${c1}. Một khởi đầu tươi sáng đầy bất ngờ đang chờ đón phía trước!`,
        visualPrompt: `Pixar 3D animation stylized scene faithful to reference visual: ${coreSubject}, expressive characters, warm sunlight, 35mm cinema lens, 8k`,
        imageUrl: animPool[1],
        cameraMotion: 'dolly-in',
        lightingStyle: 'golden-hour',
        sfx: 'Magical Harp Swell + Soft Cartoon Pop',
        transition: 'fade',
      },
      {
        sceneNumber: 2,
        headline: '02. NHÂN VẬT TỎA SÁNG & TƯƠNG TÁC',
        durationSec: 5,
        voiceover: `Từng biểu cảm đáng yêu và cử chỉ tinh nghịch xoay quanh ${c2} bắt đầu trở nên sống động hơn bao giờ hết.`,
        visualPrompt: `3D Pixar medium shot focusing on main character personality and playful interaction of ${coreSubject}, subsurface scattering, 8k`,
        imageUrl: animPool[2],
        cameraMotion: 'orbit',
        lightingStyle: 'studio-clean',
        sfx: 'Playful Marimba Groove',
        transition: 'dissolve',
      },
      {
        sceneNumber: 3,
        headline: '03. CAO TRÀO BẤT NGỜ & CẢM XÚC',
        durationSec: 6,
        voiceover: `Điểm nhấn đắt giá nhất chính là khoảnh khắc ${coreSubject} tạo nên tình huống thú vị khiến người xem không thể rời mắt.`,
        visualPrompt: `Dynamic 3D animation action frame showcasing key story moment of ${coreSubject}, volumetric god rays, crisp 60fps motion, 8k`,
        imageUrl: animPool[3],
        cameraMotion: 'pan-right',
        lightingStyle: 'volumetric',
        sfx: 'Upbeat Adventure Rise',
        transition: 'cut',
      },
      {
        sceneNumber: 4,
        headline: '04. THÔNG ĐIỆP NGỌT NGÀO & KẾT THÚC VUI TƯƠI',
        durationSec: 5,
        voiceover: `Khép lại câu chuyện đáng yêu về ${coreSubject}. Bạn thích khoảnh khắc nào nhất? Hãy thả tim và chia sẻ ngay cùng bạn bè nhé!`,
        visualPrompt: `Warm heartwarming 3D animation finale wide shot of ${coreSubject}, slow Dolly Out under golden sunset, 8k`,
        imageUrl: animPool[0],
        cameraMotion: 'dolly-out',
        lightingStyle: 'golden-hour',
        sfx: 'Warm Celebration Chime',
        transition: 'fade',
      },
    ];

    return {
      title: custom3dTitle,
      newsTicker: `HOẠT HÌNH 3D SÁNG TẠO • ${coreSubject.toUpperCase()}`,
      musicGenre: 'Playful 3D Storytelling Acoustic & Marimba',
      tags: ['HoatHinh3D', 'KeChuyenSangTao', 'SynapesStudio', platformFormat || 'video-3d'],
      scenes: custom3dScenes,
    };
  }

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

  // 5. CHẾ ĐỘ SÁNG TẠO THEO PROMPT TỰ DO / MẠNG XÃ HỘI (INSTAGRAM, FACEBOOK, TIKTOK, THREADS, YOUTUBE)
  const clause1 = promptClauses[0] || coreSubject;
  const clause2 = promptClauses[1] || coreSubject;
  const clause3 = promptClauses[2] || h1 || coreSubject;
  const platformTag = platformFormatLabel || 'Đa Nền Tảng';
  const isShortPlatform = platformFormat ? !platformFormat.includes('16-9') : false;

  const title = `${coreSubject}${platformFormatLabel ? ` — Chuẩn ${platformFormatLabel}` : ''}`;
  const scenes = [
    {
      sceneNumber: 1,
      headline: `01. HOOK MỞ MÀN: ${truncateHeadlineWords(clause1.toUpperCase(), 38)}`,
      durationSec: isShortPlatform ? 5 : 7,
      voiceover: hasAttachedImage
        ? `Hãy nhìn thật kỹ khung hình gốc ngay lúc này: ${clause1}. Chỉ trong vài giây tới, bạn sẽ chứng kiến câu chuyện sống động bước ra từ chính bức ảnh này!`
        : wikiFact1
          ? `${clause1}. ${wikiFact1}`
          : `Khoan lướt qua! Hãy cùng theo dõi ngay câu chuyện về ${clause1} với góc nhìn cực kỳ lôi cuốn dành riêng cho ${platformTag}.`,
      visualPrompt: `${hasAttachedImage ? 'Image-to-video motion starting seamlessly from uploaded reference image: ' : 'Vibrant cinematic opening frame of '}${coreSubject}, dynamic natural light, crisp 35mm lens, 8k`,
      cameraMotion: 'dolly-in',
      lightingStyle: 'golden-hour',
      sfx: 'Warm Acoustic Swell + Hook Whoosh',
      transition: 'fade',
    },
    {
      sceneNumber: 2,
      headline: '02. DIỄN BIẾN CHÍNH & CHI TIẾT ĐẮT GIÁ',
      durationSec: isShortPlatform ? 6 : 8,
      voiceover: `Đi sâu vào từng khoảnh khắc thực tế xoay quanh ${clause2}, mọi chuyển động ánh sáng, biểu cảm và nhịp điệu đều được dẫn dắt tự nhiên để giữ trọn sự chú ý.`,
      visualPrompt: `Expressive medium tracking shot revealing key action and character details of ${clause2}, shallow depth of field, 85mm lens, 8k`,
      cameraMotion: 'orbit',
      lightingStyle: 'rembrandt',
      sfx: 'Natural Ambient Transition',
      transition: 'dissolve',
    },
    {
      sceneNumber: 3,
      headline: '03. ĐIỂM NHẤN CAO TRÀO & BỨT PHÁ CẢM XÚC',
      durationSec: isShortPlatform ? 6 : 8,
      voiceover: h1
        ? `Đặc biệt khi kết hợp với góc nhìn thực tế: ${clause3}, câu chuyện càng trở nên sinh động, giàu năng lượng và dễ dàng lan tỏa mạnh mẽ.`
        : `Đây chính là giây phút cao trào đắt giá nhất trong hành trình ${coreSubject} — nơi mọi chi tiết hội tụ tạo nên cảm xúc chân thực khó quên.`,
      visualPrompt: `Dynamic high-energy visual shot highlighting the climax of ${coreSubject}, vibrant color grading, smooth 60fps cinema look, 8k`,
      cameraMotion: 'pan-right',
      lightingStyle: 'studio-clean',
      sfx: 'Upbeat Rhythm Hit',
      transition: 'cut',
    },
    {
      sceneNumber: 4,
      headline: `04. TỐI ƯU KHUNG HÌNH ${platformTag.toUpperCase()}`,
      durationSec: isShortPlatform ? 5 : 7,
      voiceover: `Nhịp cắt cảnh, âm thanh nền và góc quay được căn chỉnh chuẩn tỷ lệ ${platformTag}, giúp người xem cảm nhận trọn vẹn từng chi tiết ngay từ lần chạm đầu tiên.`,
      visualPrompt: `Scenic artistic perspective showcasing the atmosphere of ${coreSubject}, warm sunbeams and balanced framing, 8k cinematography`,
      cameraMotion: 'crane-up',
      lightingStyle: 'volumetric',
      sfx: 'Soft Chime & Breeze',
      transition: 'dissolve',
    },
    {
      sceneNumber: 5,
      headline: '05. KẾT THÚC & KÊU GỌI TƯƠNG TÁC',
      durationSec: isShortPlatform ? 5 : 7,
      voiceover: `Và đó là trọn vẹn câu chuyện về ${coreSubject}. Bạn ấn tượng nhất với giây thứ mấy? Hãy bình luận và chia sẻ video này ngay nhé!`,
      visualPrompt: `Warm concluding wide shot of ${coreSubject}, slow Dolly Out camera movement, 35mm cinema look, 8k`,
      cameraMotion: 'dolly-out',
      lightingStyle: 'golden-hour',
      sfx: 'Warm Acoustic Finale',
      transition: 'fade',
    },
  ];

  return {
    title,
    musicGenre: 'Inspiring Acoustic & Modern Social Pulse',
    tags: [
      coreSubject.replace(/[^a-zA-Z0-9À-ỹ]/g, '').slice(0, 22) || 'SangTaoNoiDung',
      platformFormat || 'DaNenTang',
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
  if (videoGenre === '3d-animation' || domain === 'animation-3d') {
    return {
      id: 'vi-sg-female-1',
      label: 'Chị Diệu Thảo (Giọng Ca Hoạt Hình Thiếu Nhi 3D — Trong trẻo, Vui tươi)',
      speed: 1.08,
      pitch: 1.15,
    };
  }
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
    skills = [],
    aspectRatio,
    platformFormat,
    platformFormatLabel,
    targetDurationMin,
    provider,
    model,
    apiKey,
    endpointUrl,
    attachedImageDataUrl,
    attachedAudioUrl,
    attachedAudioName,
    signal,
    onProgress,
  } = params;

  throwIfAborted(signal);

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

  const prelimDomain = classifyTopicDomainClient(coreSubject);
  const needsLiveResearch =
    isRandomReq ||
    (prelimDomain !== 'creative' &&
      prelimDomain !== 'animation-3d' &&
      (!attachedImageDataUrl ||
        /bản tin|thời sự|tin tức|chiến sự|giá vàng|chứng khoán|iphone|khoa học|lịch sử/i.test(prompt)));

  let research: TopicResearchPayload = {
    query: coreSubject,
    domain: prelimDomain,
    headlines: [],
    wikiSummary: '',
    visuals: [],
  };

  if (needsLiveResearch) {
    onProgress?.(`Đang tra cứu dữ liệu thời gian thực & báo chí cho "${coreSubject}"...`, 22);
    // 2. Tra cứu Google News RSS + Wikipedia + Ảnh báo chí thực tế từ Backend
    research = await fetchRealtimeTopicResearch(coreSubject, signal);
    throwIfAborted(signal);

    // Nếu là bản tin ngẫu nhiên và Google News trả về tin nóng thực tế, có thể lấy ngay tiêu điểm nóng nhất
    if (isRandomReq && research.headlines.length > 0 && /thời sự|quốc tế/i.test(prompt)) {
      const liveTopHeadline = research.headlines[0].title;
      if (liveTopHeadline && liveTopHeadline.length > 15) {
        coreSubject = liveTopHeadline;
        research = await fetchRealtimeTopicResearch(coreSubject, signal);
        throwIfAborted(signal);
      }
    }
  } else {
    onProgress?.(`Đang phân tích ý tưởng & tư liệu đính kèm cho "${coreSubject}"...`, 28);
  }

  const domain: TopicDomain = prelimDomain === 'creative' || prelimDomain === 'animation-3d'
    ? prelimDomain
    : research.domain || prelimDomain;
  const videoGenre: VideoGenre = detectVideoGenre(prompt, coreSubject, domain, skill);

  const systemPrompt = buildDirectorSystemPrompt(
    prompt,
    coreSubject,
    videoGenre,
    domain,
    research,
    skill,
    aspectRatio,
    targetDurationMin,
    platformFormatLabel,
    Boolean(attachedImageDataUrl)
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
          endpointUrl,
          attachedImageDataUrl,
          signal
        );
        rawJson = proxyRes.data;
        actualModelUsed = proxyRes.actualModel;
      } catch (proxyErr: any) {
        if (proxyErr?.name === 'AbortError' || signal?.aborted) {
          throw createUserAbortError();
        }
        // Dự phòng gọi trực tiếp trên trình duyệt cho Gemini nếu proxy không phản hồi
        if (provider === 'gemini') {
          onProgress?.(`Đang chuyển sang kênh kết nối trực tiếp ${provName}...`, 62);
          const directRes = await callGeminiDirectBrowser(
            model,
            apiKey,
            systemPrompt,
            coreSubject,
            endpointUrl,
            attachedImageDataUrl,
            signal
          );
          rawJson = directRes.data;
          actualModelUsed = directRes.actualModel;
        } else {
          throw proxyErr;
        }
      }

      if (rawJson && Array.isArray(rawJson.scenes) && rawJson.scenes.length > 0) {
        isLiveApi = true;
        engineMessage = `Đã biên kịch trực tiếp bởi ${provName} (${actualModelUsed}) kết hợp dữ liệu thực tế.`;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || signal?.aborted) {
        throw createUserAbortError();
      }
      console.warn('Live LLM API fallback triggered:', err);
      actualModelUsed = 'SYNAPES Studio Creative Engine';
      engineMessage = `Đã kích hoạt Động cơ Biên kịch Thông minh SYNAPES Studio cho "${coreSubject}".`;
    }
  } else {
    actualModelUsed = 'SYNAPES Studio Creative Engine';
  }

  throwIfAborted(signal);

  // 4. Nếu chưa có API Key hoặc API quá tải: Sử dụng Động cơ Biên kịch Đa Thể Loại dựa trên dữ liệu & Prompt thực tế
  if (!rawJson || !Array.isArray(rawJson.scenes) || rawJson.scenes.length === 0) {
    onProgress?.(
      `Đang biên tập kịch bản ${videoGenre === 'news-broadcast' ? 'Bản tin 24h' : platformFormatLabel || 'Sáng tạo'} bám sát Prompt...`,
      75
    );
    rawJson = generateBespokeMultiGenreScript(
      prompt,
      coreSubject,
      videoGenre,
      domain,
      research,
      skill,
      platformFormat,
      platformFormatLabel,
      Boolean(attachedImageDataUrl)
    );
    if (!engineMessage) {
      engineMessage = `Đã hoàn tất dựng kịch bản & hình ảnh cho "${coreSubject}".`;
    }
  }

  throwIfAborted(signal);
  onProgress?.('Đang đồng bộ hình ảnh, tư liệu đính kèm, gói đồ họa & giọng đọc...', 92);

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

  const minSceneDur = videoGenre === '3d-animation' ? 3 : 5;
  let accumulatedSec = 0;
  const storyboard: StoryboardScene[] = (rawJson.scenes || []).map((sc: any, idx: number) => {
    const dur = Math.max(minSceneDur, Math.min(15, Number(sc.durationSec) || (videoGenre === '3d-animation' ? 4 : 8)));
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
      idx === 0 && attachedImageDataUrl
        ? attachedImageDataUrl
        : sc.imageUrl ||
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
      ...(idx === 0 && attachedImageDataUrl
        ? {
            customMediaUrl: attachedImageDataUrl,
            customMediaType: 'image' as const,
          }
        : {}),
      ...(idx === 0 && attachedAudioUrl
        ? {
            customAudioUrl: attachedAudioUrl,
          }
        : {}),
      clipUrl,
      cameraMotion,
      lightingStyle,
      sfx: sc.sfx || 'Broadcast Transition Pulse',
      transition: sc.transition === 'fade' || sc.transition === 'dissolve' ? sc.transition : 'cut',
      voiceId: sc.voiceId || defaultVoice.id,
      voiceLanguage: 'vi',
      voiceSpeed: typeof sc.voiceSpeed === 'number' ? sc.voiceSpeed : defaultVoice.speed,
      voicePitch: typeof sc.voicePitch === 'number' ? sc.voicePitch : defaultVoice.pitch,
      speakerId: sc.speakerId,
      speakerName: sc.speakerName,
      speakerAvatarUrl: sc.speakerAvatarUrl,
      cameraAngle: sc.cameraAngle,
      dialogueLines: sc.dialogueLines,
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
    attachedImageDataUrl ||
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
    platformFormat,
    platformFormatLabel,
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
      name: attachedAudioUrl && attachedAudioName ? `Tệp đính kèm: ${attachedAudioName}` : defaultVoice.label,
      voiceName: defaultVoice.id,
      ...(attachedAudioUrl ? { audioUrl: attachedAudioUrl } : {}),
    },
    duration: totalDuration,
    characterActors: rawJson.characterActors,
    dialogueMode: Boolean(rawJson.dialogueMode),
    storyboard,
    videoUrl: SCENE_VIDEO_CLIPS[0],
    thumbnailUrl: heroThumbnail,
    engineMessage,
  };
}
