import type {
  AIProviderId,
  StoryboardScene,
  SceneMetricItem,
  Skill,
  AspectRatio,
  SocialPlatformFormatId,
  VideoGenre,
  CharacterActor,
  CameraDialogueAngle,
  TokenTelemetry,
  CoreVideoRepo,
} from '../types';
import { PROVIDERS } from './aiModelDiscoveryService';
import { SYSTEM_CORE_VIDEO_REPOS } from '../data/mockData';
import { getSavedClonedVoiceProfiles } from './voiceStudioService';

export function getActiveCoreVideoRepos(): CoreVideoRepo[] {
  try {
    const raw = localStorage.getItem('synapes_core_video_repos_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((r: CoreVideoRepo) => r && r.enabled);
      }
    }
  } catch { }
  return SYSTEM_CORE_VIDEO_REPOS.filter((r) => r.enabled);
}

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

export interface ResearchVideoItem {
  id: string;
  title: string;
  url: string;
  proxyUrl: string;
  thumbnailUrl?: string;
  source: string;
}

export interface TopicResearchPayload {
  query: string;
  domain: TopicDomain;
  headlines: ResearchHeadlineItem[];
  wikiSummary: string;
  visuals: ResearchVisualItem[];
  videos?: ResearchVideoItem[];
  englishKeywords?: string;
}

export interface GenerateScriptParams {
  prompt: string;
  skillId?: string;
  skills?: Skill[];
  aspectRatio: AspectRatio;
  platformFormat?: SocialPlatformFormatId;
  platformFormatLabel?: string;
  targetDurationMin: number;
  targetDurationSec?: number;
  preferredVoiceId?: string;
  creationSpeedMode?: 'turbo' | 'cloud';
  imageMotionMode?: 'consistent-anchor' | 'hybrid-scenes' | 'distribute-gallery';
  provider: AIProviderId;
  model: string;
  apiKey: string;
  endpointUrl?: string;
  fallbackProviders?: Array<{ provider: AIProviderId; model: string; apiKey: string; endpointUrl?: string }>;
  preHarvestedResearch?: TopicResearchPayload | null;
  attachedImageDataUrl?: string;
  attachedImages?: string[];
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
  tokenTelemetry?: TokenTelemetry;
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
  hardware: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=85',
  ],
  'animation-3d': [
    '/3d_dialogue_clinic_stage.jpg',
    '/3d_dialogue_garden_stage.jpg',
    '/3d_forest_stage_1.jpg',
    '/3d_forest_stage_2.jpg',
    '/3d_insect_scene_1.jpg',
    '/3d_insect_scene_2.jpg',
  ],
  creative: [
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85',
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
    /phần cứng|mạch\s*điện|khuếch đại|mạch\s*khuếch|bo mạch|vi mạch|linh kiện|điện tử|bán dẫn|vi xử lý|transistor|tụ điện|điện trở|oscilloscope|amply|amplifier|circuit|pcb|hardware|audio|loa|cảm biến|cơ khí|iphone|ipad|macbook|samsung|galaxy|xiaomi|pixel|oppo|smartphone|điện thoại|laptop|tai nghe|airpods|máy ảnh|apple/.test(
      q
    )
  ) {
    return 'hardware';
  }

  if (
    /hoạt hình|pixar|disney|cartoon|anime|cổ tích|thần thoại|côn trùng|cào cào|châu chấu|bọ rùa|đom đóm|ong vàng|bướm|kiến nhỏ|chú kiến|sâu nhỏ|vườn hoa|chú thỏ|đàn thỏ|thỏ con|thỏ bông|bị ốm|bác sĩ gấu|đối thoại|hội thoại|dialogue|nhiều giọng|nhiều kiểu giọng|nursery rhyme|counting song|đếm số|nhảy múa|thiếu nhi|insect|grasshopper|rabbit|bunny|3d character|3d cartoon/.test(
      q
    )
  ) {
    return 'animation-3d';
  }

  // Ưu tiên nhận diện Khoa học Năng lượng Sạch & Bán dẫn AI trước Địa chính trị / Lịch sử
  if (
    /(?<![\p{L}\p{N}])(?:trí tuệ nhân tạo|ai|nvidia|jensen huang|openai|chatgpt|gemini|claude|deepseek|bán dẫn|vi mạch|siêu chip|tiến trình 2nm|2nm|siêu máy tính|trung tâm dữ liệu|data center|supercomputer|semiconductor|microchip)(?![\p{L}\p{N}])/iu.test(
      q
    )
  ) {
    return 'ai-cyber';
  }

  if (
    /(?<![\p{L}\p{N}])(?:năng lượng hạt nhân|điện hạt nhân|lò phản ứng|smr|vũ trụ|sao hỏa|hố đen|thiên hà|james webb|nasa|spacex|khoa học|vật lý|lượng tử|y học|sinh học|dna|space|universe|mars|science|quantum)(?![\p{L}\p{N}])/iu.test(
      q
    )
  ) {
    return 'science';
  }

  if (
    /chiến sự|chiến tranh|quân sự|iran|israel|ukraine|nato|tên lửa|(?:vũ khí|đầu đạn|tên lửa|chiến tranh|thử)\s+hạt nhân|biển đông|biển đỏ|biên giới|xung đột|hạm đội|tàu sân bay|không kích|cấm vận|ngoại giao|địa chính trị|lầu năm góc|trung đông|triều tiên|đài loan|war|military|missile|conflict|pentagon|navy/.test(
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

  if (
    /trí tuệ nhân tạo|\bai\b|nvidia|jensen huang|openai|chatgpt|gemini|claude|deepseek|robot|bán dẫn|siêu chip|cyber|dữ liệu lớn|kế nhiệm|ceo|tập đoàn công nghệ/.test(
      q
    )
  ) {
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
  const promptTextOnly = `${rawPrompt} ${coreSubject}`.toLowerCase();
  const combined = `${promptTextOnly} ${skill?.command || ''}`.toLowerCase();

  if (
    domain === 'animation-3d' ||
    skill?.command === '/3d-character' ||
    /hoạt hình|pixar|disney|cartoon|anime|côn trùng|cào cào|châu chấu|chú thỏ|bộ xương hoạt hình|đếm số|thiếu nhi|nhảy múa|animation|3d character|nhân vật 3d|3d cartoon/.test(
      combined
    )
  ) {
    return '3d-animation';
  }
  if (
    (domain === 'hardware' || skill?.command === '/apple-keynote-3d' || skill?.command === '/apple-design') &&
    !/bản tin|thời sự/.test(promptTextOnly)
  ) {
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
    /^(một\s+|1\s+)?(dự\s+án\s+)?(kịch\s+bản\s+)?(bản\s+tin\s+thời\s+sự|bản\s+tin\s+nhanh|bản\s+tin\s+nóng|bản\s+tin\s+24h|bản\s+tin|điểm\s+tin|tin\s+tức|tin\s+nóng|phóng\s+sự|phim\s+tài\s+liệu(?:\s+khoa\s+học|\s+công\s+nghệ|\s+lịch\s+sử)?|chương\s+trình|video|videp|clip|shorts|reels)(?:\s+(?:năm\s+)?20\d\d)?\s*:?\s*/i,
    /^(này\s+)?(sẽ\s+)?(tập\s+trung\s+vào\s+việc|tập\s+trung\s+vào|xoay\s+quanh\s+việc|nói\s+về\s+việc|phân\s+tích\s+việc|đề\s+cập\s+đến\s+việc|kể\s+về\s+việc)\s+/i,
    /^(ngắn\s+|dài\s+|chi\s+tiết\s+|chuyên\s+sâu\s+|toàn\s+diện\s+|nóng\s+hổi\s+|mới\s+nhất\s+|sẽ\s+)+/i,
    /^(giới\s+thiệu|review|đánh\s+giá|phân\s+tích|tổng\s+hợp|cập\s+nhật|tìm\s+hiểu|khám\s+phá|giải\s+mã|kể\s+chuyện|thuyết\s+minh|nói|tập\s+trung)\s+(chi\s+tiết\s+|toàn\s+diện\s+|chuyên\s+sâu\s+)?/i,
    /^(vào\s+việc|về\s+việc|về\s+chủ\s+đề|về\s+sự\s+kiện|về\s+vấn\s+đề|về\s+sản\s+phẩm|xoay\s+quanh|liên\s+quan\s+đến|về|cho|việc)\s+/i,
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

const TOPIC_RESEARCH_CACHE = new Map<string, TopicResearchPayload>();
const SCRIPT_RESULT_CACHE = new Map<string, GeneratedScriptResult>();

interface SemanticVisualRule {
  pattern: RegExp;
  urls: string[];
}

const SEMANTIC_VISUAL_RULES: SemanticVisualRule[] = [
  {
    pattern: /mạch|khuếch đại|amply|amplifier|pcb|bo mạch|vi mạch|linh kiện|bán dẫn|transistor|tụ điện|điện trở|oscilloscope|audio|loa|phần cứng|circuit|hardware|\bic\b/i,
    urls: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1400&q=85',
    ],
  },
  {
    pattern: /\b(vịt|đàn vịt|chú vịt|thiên nga|ngỗng|duck|duckling|swan|goose)\b|hồ sen|ao sen|lotus pond/i,
    urls: [
      'https://images.unsplash.com/photo-1459682687441-7761439a709d?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1555852095-64e7428df0fa?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
    ],
  },
  {
    pattern: /\b(mèo|chú mèo|mèo con|cat|kitten|kitty)\b/i,
    urls: [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=1400&q=85',
    ],
  },
  {
    pattern: /\b(chó|cún|chú chó|dog|puppy|corgi|shiba|golden retriever)\b/i,
    urls: [
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1400&q=85',
    ],
  },
  {
    pattern: /\b(biển|đại dương|bãi biển|hoàng hôn|bình minh|ocean|sea|beach|sunset|sunrise)\b/i,
    urls: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1400&q=85',
    ],
  },
  {
    pattern: /\b(rừng|núi|thác nước|thiên nhiên|cây xanh|forest|mountain|waterfall|nature|jungle)\b/i,
    urls: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85',
    ],
  },
  {
    pattern: /\b(cà phê|trà|bánh|coffee|cafe|espresso|latte|tea|bakery)\b/i,
    urls: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1400&q=85',
    ],
  },
  {
    pattern: /\b(vũ trụ|không gian|phi hành gia|mặt trăng|sao hỏa|space|astronaut|moon|galaxy|cosmos)\b/i,
    urls: [
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=1400&q=85',
    ],
  },
  {
    pattern: /\b(thành phố|đô thị|đường phố|ban đêm|neon|city|urban|street|tokyo|saigon|hanoi)\b/i,
    urls: [
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1400&q=85',
    ],
  },
  {
    pattern: /\b(xe|ô tô|siêu xe|mô tô|car|supercar|racing|automotive)\b/i,
    urls: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=85',
    ],
  },
  {
    pattern: /\b(thời trang|làm đẹp|skincare|fashion|style|makeup|beauty|studio)\b/i,
    urls: [
      'https://images.unsplash.com/photo-1483985988655-e837288018dd?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=85',
    ],
  },
];

function matchSemanticSceneVisual(text: string, idx: number): string | null {
  if (!text) return null;
  for (const rule of SEMANTIC_VISUAL_RULES) {
    if (rule.pattern.test(text)) {
      return rule.urls[idx % rule.urls.length];
    }
  }
  return null;
}

export function enhanceDirectorPrompt(
  rawPrompt: string,
  platformFormatLabel?: string,
  hasAttachedImage?: boolean
): string {
  const clean = extractCleanSubject(rawPrompt || '');
  const subject = clean === 'Thời sự Quốc tế & Thế giới 24h' && (!rawPrompt || rawPrompt.trim().length < 4)
    ? 'Câu chuyện sáng tạo giàu cảm xúc'
    : clean;
  const formatLine = platformFormatLabel ? ` (Tối ưu khung hình ${platformFormatLabel})` : '';
  const imageAnchor = hasAttachedImage
    ? ' Bắt đầu mượt mà từ ảnh gốc đính kèm, giữ đồng nhất nhân vật và ánh sáng xuyên suốt.'
    : '';

  return [
    `Chủ đề chính: ${subject}${formatLine}.${imageAnchor}`,
    `1. Mở màn Hook 3s: Giới thiệu trực diện bối cảnh và nhân vật trung tâm của ${subject} với góc máy cận cảnh giàu cảm xúc.`,
    `2. Diễn biến chuyển động: Theo sát hành động nổi bật của ${subject}, tăng nhịp cắt cảnh mượt và âm thanh hiện trường sống động.`,
    `3. Điểm nhấn cao trào: Khoảnh khắc bùng nổ tạo sự bất ngờ hoặc giá trị cốt lõi xoay quanh ${subject}.`,
    `4. Kết thúc & Tương tác: Khung hình toàn cảnh ấm áp kèm câu hỏi gợi mở bình luận từ người xem.`,
  ].join('\n');
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

  // 0. Đối với Hoạt hình 3D (animation-3d): ưu tiên Sân khấu 3D Pixar nội bộ cho kịch bản thỏ/côn trùng;
  // nếu visualPrompt mô tả đối tượng cụ thể ngoài (vịt, mèo, vũ trụ...) vẫn ưu tiên khớp ảnh ngữ nghĩa chuẩn Prompt!
  if (resolvedDomain === 'animation-3d') {
    const isClassicStage = /thỏ\s*con|bunny|rabbit|côn\s*trùng|grasshopper|insect|ladybug|clinic stage/i.test(
      visualPrompt || ''
    );
    if (!isClassicStage) {
      const animSemantic = matchSemanticSceneVisual(visualPrompt, idx);
      if (animSemantic) {
        return `/api/image-proxy?domain=${resolvedDomain}&idx=${idx}&url=${encodeURIComponent(animSemantic)}`;
      }
    }
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

  // 2. Đối với phần cứng & điện tử: ưu tiên khớp ảnh ngữ nghĩa (bo mạch, amplifier, cảm biến...) trước khi dùng ảnh Apple/iPhone
  if (resolvedDomain === 'hardware') {
    const hwSemantic = matchSemanticSceneVisual(visualPrompt, idx);
    const lower = (visualPrompt || '').toLowerCase();
    const isApplePhoneTopic = /iphone|ipad|macbook|apple\b|m4\b|a20\b|titanium|pro max|camera lens/.test(lower);
    if (hwSemantic && !isApplePhoneTopic) {
      return `/api/image-proxy?domain=hardware&idx=${idx}&url=${encodeURIComponent(hwSemantic)}`;
    }
    if (isApplePhoneTopic) {
      let hwUrl = REAL_IPHONE_18_INTERNET_IMAGES[idx % REAL_IPHONE_18_INTERNET_IMAGES.length];
      if (/chip|silicon|a20|a19|2nm|neural/.test(lower)) hwUrl = REAL_IPHONE_18_INTERNET_IMAGES[2];
      else if (/camera|lens|periscope|optic|48mp/.test(lower)) hwUrl = REAL_IPHONE_18_INTERNET_IMAGES[3];
      else if (/display|oled|screen|120hz|bezel/.test(lower)) hwUrl = REAL_IPHONE_18_INTERNET_IMAGES[1];
      else if (/battery|magsafe|charging/.test(lower)) hwUrl = REAL_IPHONE_18_INTERNET_IMAGES[4];
      return `/api/image-proxy?domain=hardware&idx=${idx}&url=${encodeURIComponent(hwUrl)}`;
    }
    const hwPool = CLIENT_DOMAIN_PHOTO_POOLS.hardware;
    return `/api/image-proxy?domain=hardware&idx=${idx}&url=${encodeURIComponent(hwPool[idx % hwPool.length])}`;
  }

  // 2.5 Khớp kho ảnh ngữ nghĩa đa tầng theo đúng từ khóa đối tượng/bối cảnh trong Prompt
  const semanticMatch = matchSemanticSceneVisual(visualPrompt, idx);
  if (semanticMatch && (sceneIndex <= 15 || idx > 0)) {
    return `/api/image-proxy?domain=${resolvedDomain}&idx=${idx}&url=${encodeURIComponent(semanticMatch)}`;
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
export async function fetchRealtimeTopicResearch(
  query: string,
  externalSignal?: AbortSignal
): Promise<TopicResearchPayload> {
  const cacheKey = (query || '').trim().toLowerCase();
  const cached = TOPIC_RESEARCH_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  const fallbackDomain = classifyTopicDomainClient(query);
  try {
    const resp = await fetchWithTimeoutAndSignal(
      `/api/topic-research?q=${encodeURIComponent(query)}`,
      {},
      6500,
      externalSignal
    );
    if (resp.ok) {
      const data = await resp.json();
      const payload: TopicResearchPayload = {
        query,
        domain: (data.domain as TopicDomain) || fallbackDomain,
        headlines: Array.isArray(data.headlines) ? data.headlines : [],
        wikiSummary: String(data.wikiSummary || ''),
        visuals: Array.isArray(data.visuals) ? data.visuals : [],
        videos: Array.isArray(data.videos) ? data.videos : [],
        englishKeywords: String(data.englishKeywords || ''),
      };
      if (TOPIC_RESEARCH_CACHE.size > 30) TOPIC_RESEARCH_CACHE.clear();
      TOPIC_RESEARCH_CACHE.set(cacheKey, payload);
      return payload;
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
    videos: [],
    englishKeywords: '',
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
  const targetTotalSec = Math.round((targetDurationMin || 1) * 60);
  const sceneCount =
    videoGenre === '3d-animation' && isCountingSong
      ? 10
      : isShort
        ? 5
        : targetTotalSec >= 105
          ? 8
          : 6;

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

  const activeRepos = getActiveCoreVideoRepos();
  const coreRepoBlock =
    activeRepos.length > 0
      ? `\n[CORE VIDEO ENGINES ĐÃ BƠM TRỰC TIẾP]: ${activeRepos
          .map((r) => `${r.repo} (${r.capabilities.slice(0, 2).join(', ')})`)
          .join(' • ')}. Hãy thiết kế cảnh hỗ trợ HUD số liệu, ngắt câu phụ đề chuẩn điện ảnh và chuyển động camera mượt.`
      : '';

  return `${roleInstruction}

NHIỆM VỤ: Biên soạn kịch bản video hoàn chỉnh gồm đúng ${sceneCount} phân cảnh về chủ đề: "${coreSubject}" (Yêu cầu gốc của người dùng: "${rawPrompt}").
- Định dạng xuất bản mục tiêu: ${platformFormatLabel || (isShort ? '9:16 (Shorts / Reels / TikTok)' : `16:9 (Video dài ${targetDurationMin} phút)`)}
- Lĩnh vực phân loại: ${domain.toUpperCase()} | Thể loại đồ họa: ${videoGenre.toUpperCase()}
- Bộ Skill: "${skill?.name || 'Biên kịch Chuyên nghiệp'}" (${skill?.tone || 'Chính xác, cuốn hút'})
- Khung hình: ${isShort ? '9:16 (Dọc 1080x1920)' : `16:9 (Ngang 1920x1080, mục tiêu ${targetDurationMin} phút)`}
${liveNewsBlock}
${wikiBlock}
${attachmentNote}${coreRepoBlock}

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
  externalSignal?: AbortSignal,
  extraMeta?: {
    rawPrompt?: string;
    clauses?: string[];
    sceneCount?: number;
    durationSeconds?: number;
    videoGenre?: string;
    domain?: string;
    platformFormatLabel?: string;
    mode?: 'llm' | 'studio-research';
    fallbackProviders?: Array<{ provider: AIProviderId; model: string; apiKey: string; endpointUrl?: string }>;
  }
): Promise<{ data: any; actualModel: string; actualProvider?: string; tokenTelemetry?: TokenTelemetry }> {
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
        ...(extraMeta || {}),
      }),
    },
    16000,
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
  return {
    data: parsed,
    actualModel: json.actualModel || model,
    actualProvider: json.actualProvider || provider,
    tokenTelemetry: json.tokenTelemetry,
  };
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

  const cleanPreferred = preferredModel.replace(/^models\//, '').trim() || 'gemini-3-flash-preview';
  const isNonScript = /tts|imagen|-image|embedding|veo|audio|-live|aqa/i.test(cleanPreferred);

  const candidateModels = Array.from(
    new Set([
      ...(!isNonScript ? [cleanPreferred] : []),
      'gemini-3-flash-preview',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-3.1-pro-preview',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
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

      const supportsThinkBudget = /^(?:gemini-2\.5|gemini-3\.[5-9]|gemini-3-flash)/i.test(mod);
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
              ...(supportsThinkBudget ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
            },
          }),
        },
        20000,
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
          20000,
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
  const nonEmptyLines = (rawPrompt || '')
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 6);

  const numberedSceneLines = nonEmptyLines
    .filter((line) => /^\s*(?:\d+[\.\):]|Cảnh\s*\d+:|Scene\s*\d+:)/i.test(line))
    .map((line) => line.replace(/^\s*(?:\d+[\.\):]|[-•*]|Cảnh\s*\d+:|Scene\s*\d+:)\s*/i, '').trim())
    .filter((line) => line.length >= 6);

  if (numberedSceneLines.length >= 2) {
    return numberedSceneLines.slice(0, 8);
  }

  const rawLines = nonEmptyLines
    .map((line) => line.replace(/^\s*(?:\d+[\.\):]|[-•*]|Cảnh\s*\d+:|Scene\s*\d+:)\s*/i, '').trim())
    .filter((line) => line.length >= 6 && !/^chủ đề(?:\s+chính)?:/i.test(line));

  if (rawLines.length >= 2) {
    return rawLines.slice(0, 8);
  }

  const source = (coreSubject || rawPrompt || '').trim();
  const compoundSplit = source
    .split(/\s*(?:cũng\s+như|đồng\s+thời|bên\s+cạnh\s+đó|ngoài\s+ra|cùng\s+với|;\s*)\s*|[.!?]+/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8);
  if (compoundSplit.length >= 2) {
    return compoundSplit.slice(0, 8);
  }
  const clauses = source
    .split(/,\s+(?=[A-ZÀ-Ỹa-zà-ỹ0-9])/g)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6);
  return clauses.length > 0 ? clauses : [source];
}

interface ParsedPromptDetails {
  beats: string[];
  quotedLines: string[];
  moodHint: string;
}

function parsePromptStructure(rawPrompt: string, coreSubject: string): ParsedPromptDetails {
  const beats = splitPromptClauses(rawPrompt, coreSubject);
  const quotedLines: string[] = [];
  const quoteRegex = /["“]([^"”]{4,160})["”]/g;
  let m: RegExpExecArray | null;
  while ((m = quoteRegex.exec(rawPrompt || '')) !== null) {
    if (m[1]) quotedLines.push(m[1].trim());
  }

  const lower = (rawPrompt || '').toLowerCase();
  const moodHint = /hài|vui|dễ thương|tinh nghịch|ấm áp/.test(lower)
    ? 'warm playful cheerful atmosphere'
    : /kịch tính|gay cấn|bí ẩn|hồi hộp|hành động/.test(lower)
      ? 'dramatic suspenseful high-contrast cinema'
      : /buồn|cảm động|sâu lắng|lãng mạn|bình yên/.test(lower)
        ? 'emotional poetic golden hour light'
        : 'crisp cinematic natural lighting';

  return { beats, quotedLines, moodHint };
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
  hasAttachedImage?: boolean,
  targetDurationSec?: number
): any {
  const h1 = research.headlines[0]?.title;
  const h2 = research.headlines[1]?.title;
  const h3 = research.headlines[2]?.title;
  const src1 = research.headlines[0]?.source || 'các hãng thông tấn quốc tế';
  const src2 = research.headlines[1]?.source || 'giới phân tích chiến lược';
  const promptClauses = splitPromptClauses(rawPrompt, coreSubject);
  const fullTextSignal = `${rawPrompt} ${coreSubject}`;

  // Tách 1-2 câu sạch sẽ từ Wikipedia (xóa bỏ ngoặc ngày sinh/trích dẫn thô như "(sinh ngày 17 tháng 2 năm 1963)")
  const wikiClean = (research.wikiSummary || '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[^:]{2,40}:\s*/, '').trim())
    .filter((s) => s.length > 30 && s.length < 180 && !/\b(?:sinh ngày|tên khai sinh|là một doanh nhân người Mỹ)\b/i.test(s));
  const wikiFact1 = wikiClean[0] || '';

  // 0. CHẾ ĐỘ HOẠT HÌNH 3D ĐỐI THOẠI ĐA NHÂN VẬT & SÁNG TẠO THEO PROMPT
  if (videoGenre === '3d-animation' || domain === 'animation-3d') {
    const isMotherDuck3d = /vịt\s*mẹ|đàn\s*vịt|vịt\s*con|lông\s*vàng|hvuA-jg9N7s/i.test(
      fullTextSignal
    );
    const isCountrysideFable3d = !isMotherDuck3d && /mất\s*bò|làm\s*chuồng|đàn\s*gà|gà\s*con|đồng\s*quê|chăn\s*trâu|be-ti|bo-vang|dan-ga-con/i.test(
      fullTextSignal
    );
    const isRabbitDialogue = /thỏ\s*con|thỏ\s*hồng|bị\s*ốm|bác\s*sĩ\s*gấu/i.test(fullTextSignal);
    const isInsectCounting = /côn\s*trùng|cào\s*cào|châu\s*chấu|đếm\s*số|1\s*đến\s*10|một\s*đến\s*mười/i.test(
      fullTextSignal
    );

    if (isMotherDuck3d) {
      const title = 'Vịt Mẹ Và Đàn Con — Vịt Con Lông Vàng 3D (Glow Studios Reference Pipeline)';
      const characterActors: CharacterActor[] = [
        {
          id: 'vit-me',
          name: 'Vịt Mẹ Trắng (Chóp Cánh Xanh Ngọc)',
          roleDescription: 'Vịt mẹ thân trắng, vòng cổ & chóp cánh xanh ngọc, ngậm lá hướng dẫn đàn con tập thể dục',
          avatarUrl: '',
          voiceId: 'vi-gentle-female',
          voiceName: 'Giọng Ca Vịt Mẹ Dịu Dàng (HoaiMy Chuẩn)',
          voiceSpeed: 1.02,
          voicePitch: 1.08,
          themeColor: '#06b6d4',
          defaultEmotion: 'caring',
        },
        {
          id: 'dan-vit-con',
          name: '5 Chú Vịt Con Lông Vàng',
          roleDescription: '5 chú vịt con bầu bĩnh 3 chỏm lông đầu, chú đầu đàn đội mũ hoa đỏ cuống xanh',
          avatarUrl: '',
          voiceId: 'vi-child-female',
          voiceName: 'Đồng Ca Thiếu Nhi Vịt Con (HoaiMy +30% Pitch)',
          voiceSpeed: 1.08,
          voicePitch: 1.3,
          themeColor: '#eab308',
          defaultEmotion: 'playful',
        },
        {
          id: 'ga-trong',
          name: 'Gà Trống Ngũ Sắc',
          roleDescription: 'Gà trống đứng trên mái ngói đỏ gáy báo thức bình minh',
          avatarUrl: '',
          voiceId: 'vi-mature-male',
          voiceName: 'Giọng Gà Trống Khỏe Khoắn',
          voiceSpeed: 1.0,
          voicePitch: 0.98,
          themeColor: '#dc2626',
          defaultEmotion: 'happy',
        },
      ];

      const duckScenes = [
        {
          sceneNumber: 1,
          speakerId: 'dan-vit-con',
          speakerName: 'Vịt Con Mũ Hoa Đỏ',
          cameraAngle: 'close-up-speaker' as CameraDialogueAngle,
          headline: '01. THỨC DẬY TRONG RỔ MÂY NHÀ GỖ VÒM',
          durationSec: 5,
          voiceover: 'Bình minh rạng rỡ rồi, chú vịt con đội mũ hoa đỏ vươn vai thức dậy trong rổ mây ấm áp!',
          voiceId: 'vi-child-female',
          voicePitch: 1.28,
          voiceSpeed: 1.05,
          visualPrompt: '3D yellow duckling with red green flower hat waking in wicker basket inside wooden coop arch, Glow Studios style',
          imageUrl: '',
          cameraMotion: 'dolly-in',
          lightingStyle: 'golden-hour',
          sfx: 'Soft Morning Harp + Baby Duck Chirp',
          transition: 'fade',
        },
        {
          sceneNumber: 2,
          speakerId: 'ga-trong',
          speakerName: 'Gà Trống Mái Ngói',
          cameraAngle: 'master-shot' as CameraDialogueAngle,
          headline: '02. GÀ TRỐNG GÁY SÁNG TRÊN MÁI NGÓI ĐỎ',
          durationSec: 5,
          voiceover: 'Ò ó o! Ông mặt trời lên cao, gà trống ngũ sắc cất tiếng gáy vang gọi cả xóm nhỏ ra sân!',
          voiceId: 'vi-mature-male',
          voicePitch: 0.98,
          voiceSpeed: 1.02,
          visualPrompt: '3D colorful rooster crowing on stepped terracotta red tiled roof against bright sunlit sky',
          imageUrl: '',
          cameraMotion: 'pan-right',
          lightingStyle: 'golden-hour',
          sfx: 'Rooster Crow + Cheerful Xylophone',
          transition: 'dissolve',
        },
        {
          sceneNumber: 3,
          speakerId: 'vit-me',
          speakerName: 'Vịt Mẹ & 5 Vịt Con',
          cameraAngle: 'over-the-shoulder' as CameraDialogueAngle,
          headline: '03. MỘT HAI MỘT HAI — THỂ DỤC PHÀNH PHẠCH',
          durationSec: 6,
          voiceover: 'Vịt mẹ xòe mỏ gọi đàn con nhỏ, thể dục nhanh nhanh! Một hai, một hai! Giơ chân lên nào, vẫy cho đều phạch phành phạch!',
          voiceId: 'vi-gentle-female',
          voicePitch: 1.1,
          voiceSpeed: 1.06,
          visualPrompt: 'Over shoulder 3D white Mother Duck with cyan wingtips standing on mossy daisy rock leading 5 yellow ducklings wing exercise',
          imageUrl: '',
          cameraMotion: 'orbit',
          lightingStyle: 'studio-clean',
          sfx: 'Kids Exercise Drumbeat 122BPM + Wing Flap',
          transition: 'dissolve',
        },
        {
          sceneNumber: 4,
          speakerId: 'dan-vit-con',
          speakerName: 'Đàn Vịt Con & Chú Ong',
          cameraAngle: 'two-shot' as CameraDialogueAngle,
          headline: '04. LON TON XUỐNG CẦU GỖ BÊN CHÚ ONG VÀNG',
          durationSec: 5,
          voiceover: 'Đàn vịt lon ton chạy theo vịt mẹ qua cầu ván gỗ cong, bên cạnh chú ong vàng vỗ cánh vo ve thật vui!',
          voiceId: 'vi-child-female',
          voicePitch: 1.28,
          voiceSpeed: 1.06,
          visualPrompt: '3D yellow ducklings waddling down curved wooden plank bridge over turquoise pond with flying striped cartoon bee',
          imageUrl: '',
          cameraMotion: 'pan-left',
          lightingStyle: 'golden-hour',
          sfx: 'Bee Buzz + Wooden Steps + Quack Quack',
          transition: 'dissolve',
        },
        {
          sceneNumber: 5,
          speakerId: 'vit-me',
          speakerName: 'Đàn Vịt Khua Nước Bơi Đi',
          cameraAngle: 'shot-reverse-shot' as CameraDialogueAngle,
          headline: '05. KHUA NƯỚC BƠI ĐI CHÂN NHƯ MÁI CHÈO',
          durationSec: 6,
          voiceover: 'Ùm xuống ao sâu tắm mát thật thích! Cạp cạp cạp! Đàn vịt khua nước bơi đi chân như mái chèo giữa hoa lục bình!',
          voiceId: 'vi-gentle-female',
          voicePitch: 1.12,
          voiceSpeed: 1.05,
          visualPrompt: '3D ducklings swimming across bright cyan pond surrounded by lily pads and purple hyacinths',
          imageUrl: '',
          cameraMotion: 'dolly-out',
          lightingStyle: 'golden-hour',
          sfx: 'Water Splash + Paddle Ripples + Duck Quack Chorus',
          transition: 'dissolve',
        },
        {
          sceneNumber: 6,
          speakerId: 'dan-vit-con',
          speakerName: 'Hội Xuân Đu Quay 3D',
          cameraAngle: 'master-shot' as CameraDialogueAngle,
          headline: '06. VÒNG ĐU QUAY ĐỎ RỰC RỠ KẾT MÀN VUI NHỘN',
          durationSec: 6,
          voiceover: 'Hoan hô! Cả đàn vịt con cùng ngồi trên khoang đỏ vòng đu quay khổng lồ vẫy cánh hát vang bài ca thiếu nhi!',
          voiceId: 'vi-child-female',
          voicePitch: 1.24,
          voiceSpeed: 1.05,
          visualPrompt: '3D white steel-spoked Ferris wheel with glossy red capsule gondolas carrying happy ducklings above green hills',
          imageUrl: '',
          cameraMotion: 'crane-up',
          lightingStyle: 'golden-hour',
          sfx: 'Upbeat Kids Finale Brass + Marimba 122BPM',
          transition: 'fade',
        },
      ];

      return {
        title,
        newsTicker: '',
        musicGenre: 'Upbeat Kids Exercise Pop & Xylophone 122BPM',
        tags: ['VitMeVaDanCon', 'VitConLongVang', 'HoatHinh3D', 'NhacThieuNhi3D', 'GlowStudiosStyle'],
        characterActors,
        dialogueMode: true,
        scenes: duckScenes,
      };
    }

    if (isCountrysideFable3d) {
      const title = 'Mất Bò Mới Lo Làm Chuồng & Đàn Gà Con Mới Nở (Hoạt Hình 3D Đồng Quê)';
      const characterActors: CharacterActor[] = [
        {
          id: 'be-ti',
          name: 'Cậu Bé Tí (Chăn Bò)',
          roleDescription: 'Cậu bé chăn bò mặc áo bà ba nâu, đội nón lá, tính tình hay quên đóng then chuồng',
          avatarUrl: '',
          voiceId: 'vi-child-male',
          voiceName: 'Bé Trai Lanh Lợi (NamMinh +20% Pitch)',
          voiceSpeed: 1.06,
          voicePitch: 1.2,
          themeColor: '#d97706',
          defaultEmotion: 'playful',
        },
        {
          id: 'tho-bun',
          name: 'Thỏ Trắng Bun',
          roleDescription: 'Bạn thỏ tinh anh sống gần rặng tre, nhắc Tí gia cố cửa chuồng gỗ',
          avatarUrl: '',
          voiceId: 'vi-child-female',
          voiceName: 'Bé Gái Trong Trẻo (HoaiMy +26% Pitch)',
          voiceSpeed: 1.04,
          voicePitch: 1.26,
          themeColor: '#0ea5e9',
          defaultEmotion: 'caring',
        },
        {
          id: 'dan-ga-con',
          name: 'Đàn Gà Con Mới Nở',
          roleDescription: '5 chú gà con vàng rực nhảy múa quanh gà mẹ bên bờ suối xanh',
          avatarUrl: '',
          voiceId: 'vi-child-female',
          voiceName: 'Đàn Gà Con Líu Lo (HoaiMy +38% Pitch)',
          voiceSpeed: 1.12,
          voicePitch: 1.38,
          themeColor: '#eab308',
          defaultEmotion: 'happy',
        },
        {
          id: 'bo-vang',
          name: 'Bò Vàng & Người Kể Chuyện',
          roleDescription: 'Chú bò vàng đeo chuông đồng hiền lành và lời dẫn câu chuyện ngụ ngôn',
          avatarUrl: '',
          voiceId: 'vi-mature-male',
          voiceName: 'Người Kể Chuyện Ấm Áp (NamMinh Chuẩn)',
          voiceSpeed: 1.0,
          voicePitch: 0.96,
          themeColor: '#16a34a',
          defaultEmotion: 'happy',
        },
      ];

      const countrysideScenes = [
        {
          sceneNumber: 1,
          speakerId: 'bo-vang',
          speakerName: 'Người Kể Chuyện',
          cameraAngle: 'master-shot' as CameraDialogueAngle,
          headline: '01. BÌNH MINH LÀNG QUÊ YÊN Ả',
          durationSec: 4,
          voiceover: 'Sáng sớm bên rặng tre xanh, chuông bò leng keng vang khắp triền đê ngập tràn nắng vàng.',
          voiceId: 'vi-mature-male',
          voicePitch: 0.96,
          voiceSpeed: 1.0,
          visualPrompt: 'Pixar 3D stylized Vietnamese countryside meadow morning golden light, wooden barn, calf, chicks by creek, 8k',
          imageUrl: '',
          cameraMotion: 'dolly-in',
          lightingStyle: 'golden-hour',
          sfx: 'Morning Flute + Creek Water + Soft Cowbell',
          transition: 'fade',
        },
        {
          sceneNumber: 2,
          speakerId: 'dan-ga-con',
          speakerName: 'Đàn Gà Con Mới Nở',
          cameraAngle: 'close-up-speaker' as CameraDialogueAngle,
          headline: '02. ĐÀN GÀ CON MỚI NỞ VUI ĐÙA',
          durationSec: 4,
          voiceover: 'Chiếp chiếp chiếp! Đàn gà con lông vàng óng ánh tung tăng nhảy múa theo điệu nhạc ban mai!',
          voiceId: 'vi-child-female',
          voicePitch: 1.38,
          voiceSpeed: 1.12,
          visualPrompt: 'Cute 3D baby yellow chicks flapping wings hopping happily beside mother hen, Glow Studios inspired, 8k',
          imageUrl: '',
          cameraMotion: 'orbit',
          lightingStyle: 'golden-hour',
          sfx: 'Chick Chirping + Upbeat Kids Marimba 116BPM',
          transition: 'dissolve',
        },
        {
          sceneNumber: 3,
          speakerId: 'tho-bun',
          speakerName: 'Thỏ Trắng Bun',
          cameraAngle: 'two-shot' as CameraDialogueAngle,
          headline: '03. THỎ BUN NHẮC CỬA CHUỒNG LỎNG LẺO',
          durationSec: 4,
          voiceover: 'Anh Tí ơi! Cánh cửa chuồng bò bị tuột đinh kìa, lát trưa gió to là bò đi lạc mất đấy!',
          voiceId: 'vi-child-female',
          voicePitch: 1.26,
          voiceSpeed: 1.04,
          visualPrompt: '3D white bunny in blue vest pointing excitedly at loose wooden barn door warning shepherd boy Be Ti, 8k',
          imageUrl: '',
          cameraMotion: 'pan-right',
          lightingStyle: 'studio-clean',
          sfx: 'Wooden Creak + Alert Pluck',
          transition: 'dissolve',
        },
        {
          sceneNumber: 4,
          speakerId: 'be-ti',
          speakerName: 'Cậu Bé Tí',
          cameraAngle: 'over-the-shoulder' as CameraDialogueAngle,
          headline: '04. MẢI CHƠI QUÊN CHỐT CỬA — BÒ ĐI LẠC',
          durationSec: 4,
          voiceover: 'Ôi không! Tí mải thả diều nên quên sửa chuồng, Bò Vàng đẩy tung cửa gỗ đi tuốt ra đồng xa mất rồi!',
          voiceId: 'vi-child-male',
          voicePitch: 1.2,
          voiceSpeed: 1.06,
          visualPrompt: 'Over shoulder 3D shot of Be Ti shocked seeing empty barn gate and golden cow wandering across meadow hills, 8k',
          imageUrl: '',
          cameraMotion: 'dolly-out',
          lightingStyle: 'volumetric',
          sfx: 'Dramatic Bass Swell + Distant Cowbell',
          transition: 'cut',
        },
        {
          sceneNumber: 5,
          speakerId: 'tho-bun',
          speakerName: 'Thỏ Trắng Bun',
          cameraAngle: 'shot-reverse-shot' as CameraDialogueAngle,
          headline: '05. CÙNG BẠN BÈ TÌM BÒ & RÚT RA BÀI HỌC',
          durationSec: 4,
          voiceover: 'Đừng lo anh Tí ơi! Thỏ và đàn gà con thấy dấu chân bên suối rồi, mình dắt Bò Vàng về sửa chuồng ngay nhé!',
          voiceId: 'vi-child-female',
          voicePitch: 1.26,
          voiceSpeed: 1.05,
          visualPrompt: '3D reverse shot bunny and chicks guiding Be Ti toward creek wooden path, warm teamwork, 8k',
          imageUrl: '',
          cameraMotion: 'pan-left',
          lightingStyle: 'golden-hour',
          sfx: 'Footsteps on Grass + Cheerful Harp',
          transition: 'dissolve',
        },
        {
          sceneNumber: 6,
          speakerId: 'be-ti',
          speakerName: 'Cậu Bé Tí',
          cameraAngle: 'two-shot' as CameraDialogueAngle,
          headline: '06. ĐÓNG VÁN CHẮC CHẮN — KHÔNG ĐỂ MẤT BÒ NỮA',
          durationSec: 4,
          voiceover: 'Cốc cốc cốc! Tí đóng lại ba thanh gỗ thật chắc, từ nay nhớ làm chuồng trước chứ không đợi mất bò mới lo!',
          voiceId: 'vi-child-male',
          voicePitch: 1.18,
          voiceSpeed: 1.05,
          visualPrompt: '3D two-shot Be Ti hammering new solid planks onto barn fence while bunny hands nails, sunny glow, 8k',
          imageUrl: '',
          cameraMotion: 'dolly-in',
          lightingStyle: 'golden-hour',
          sfx: 'Wooden Hammer Knock + Warm Bell',
          transition: 'dissolve',
        },
        {
          sceneNumber: 7,
          speakerId: 'bo-vang',
          speakerName: 'Cả Nhóm Đồng Ca',
          cameraAngle: 'master-shot' as CameraDialogueAngle,
          headline: '07. ĐOẠN KẾT VUI TƯƠI BÊN LÀNG QUÊ XANH',
          durationSec: 4,
          voiceover: 'Hoan hô! Phòng bệnh hơn chữa bệnh, cẩn thận từ đầu để ngày nào đồng quê cũng rộn rã tiếng cười vui!',
          voiceId: 'vi-mature-male',
          voicePitch: 1.02,
          voiceSpeed: 1.04,
          visualPrompt: 'Pixar 3D wide celebration shot of Be Ti, golden cow inside sturdy barn, dancing chicks and bunny singing together, 8k',
          imageUrl: '',
          cameraMotion: 'crane-up',
          lightingStyle: 'golden-hour',
          sfx: 'Upbeat Kids Finale Fanfare',
          transition: 'fade',
        },
      ];

      return {
        title,
        newsTicker: '',
        musicGenre: 'Vietnamese Countryside Marimba & Flute 116BPM',
        tags: ['HoatHinh3D', 'MatBoMoiLoLamChuong', 'DanGaCon', 'PixarDongQue', 'ThieuNhi3D'],
        characterActors,
        dialogueMode: true,
        scenes: countrysideScenes,
      };
    }

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
    const { beats: prompt3dBeats, quotedLines: quoted3d, moodHint: mood3d } = parsePromptStructure(
      rawPrompt,
      coreSubject
    );
    const desired3dDur = targetDurationSec && targetDurationSec > 0 ? targetDurationSec : 24;
    const per3dDur = Math.max(4, Math.min(10, Math.round(desired3dDur / Math.max(4, prompt3dBeats.length))));
    const c1 = prompt3dBeats[0] || coreSubject;
    const c2 = prompt3dBeats[1] || coreSubject;
    const c3 = prompt3dBeats[2] || quoted3d[0] || coreSubject;
    const c4 = prompt3dBeats[3] || coreSubject;
    const custom3dTitle = `${coreSubject}${platformFormatLabel ? ` (${platformFormatLabel})` : ''}`;
    const custom3dScenes = [
      {
        sceneNumber: 1,
        headline: `01. MỞ MÀN: ${truncateHeadlineWords(c1.toUpperCase(), 38)}`,
        durationSec: per3dDur,
        voiceover: hasAttachedImage
          ? `Từ khung hình tư liệu gốc đầy sống động: ${c1}. Hãy cùng bước vào thế giới chuyển động 3D rực rỡ ngay từ giây đầu tiên!`
          : `Câu chuyện bắt đầu ngay lúc này: ${c1}. ${quoted3d[0] ? `"${quoted3d[0]}" — ` : ''}Một khởi đầu tươi sáng đầy bất ngờ đang chờ đón phía trước!`,
        visualPrompt: `Pixar 3D animation stylized scene of ${c1}, expressive characters, ${mood3d}, 35mm cinema lens, 8k`,
        cameraMotion: 'dolly-in',
        lightingStyle: 'golden-hour',
        sfx: 'Magical Harp Swell + Soft Cartoon Pop',
        transition: 'fade',
      },
      {
        sceneNumber: 2,
        headline: `02. ${prompt3dBeats[1] ? truncateHeadlineWords(c2.toUpperCase(), 38) : 'NHÂN VẬT TỎA SÁNG & TƯƠNG TÁC'}`,
        durationSec: per3dDur,
        voiceover: prompt3dBeats[1]
          ? `${c2}. Từng biểu cảm, ánh mắt và chuyển động 3D đều bám sát từng chi tiết bạn đã mô tả.`
          : `Từng biểu cảm đáng yêu và cử chỉ tinh nghịch xoay quanh ${coreSubject} bắt đầu trở nên sống động hơn bao giờ hết.`,
        visualPrompt: `3D Pixar medium tracking shot of ${c2}, personality and playful interaction, subsurface scattering, 8k`,
        cameraMotion: 'orbit',
        lightingStyle: 'studio-clean',
        sfx: 'Playful Marimba Groove',
        transition: 'dissolve',
      },
      {
        sceneNumber: 3,
        headline: `03. ${prompt3dBeats[2] ? truncateHeadlineWords(c3.toUpperCase(), 38) : 'CAO TRÀO BẤT NGỜ & CẢM XÚC'}`,
        durationSec: per3dDur,
        voiceover: prompt3dBeats[2]
          ? `Bước sang phân đoạn cao trào: ${c3}, tạo nên điểm nhấn cảm xúc khiến người xem không thể rời mắt.`
          : `Điểm nhấn đắt giá nhất chính là khoảnh khắc ${coreSubject} tạo nên tình huống thú vị khiến người xem không thể rời mắt.`,
        visualPrompt: `Dynamic 3D animation action frame depicting ${c3}, ${mood3d}, volumetric god rays, 60fps, 8k`,
        cameraMotion: 'pan-right',
        lightingStyle: 'volumetric',
        sfx: 'Upbeat Adventure Rise',
        transition: 'cut',
      },
      {
        sceneNumber: 4,
        headline: `04. ${prompt3dBeats[3] ? truncateHeadlineWords(c4.toUpperCase(), 38) : 'THÔNG ĐIỆP & KẾT THÚC VUI TƯƠI'}`,
        durationSec: per3dDur,
        voiceover: prompt3dBeats[3]
          ? `${c4}. Bạn thích khoảnh khắc nào nhất trong câu chuyện "${coreSubject}"? Hãy thả tim và bình luận ngay nhé!`
          : `Khép lại câu chuyện đáng yêu về ${coreSubject}. Bạn thích khoảnh khắc nào nhất? Hãy thả tim và chia sẻ ngay cùng bạn bè nhé!`,
        visualPrompt: `Warm heartwarming 3D animation finale wide shot of ${c4}, slow Dolly Out under golden sunset, 8k`,
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

  // 1. CHẾ ĐỘ BẢN TIN THỜI SỰ / ĐỊA CHÍNH TRỊ / CÔNG NGHỆ & XÃ HỘI 24H
  if (videoGenre === 'news-broadcast') {
    const isGeopolitics = domain === 'geopolitics';
    const c1 = (promptClauses[0] || coreSubject).trim();
    const c2 = promptClauses[1] ? promptClauses[1].trim() : '';
    const title = isGeopolitics
      ? `Bản Tin Đặc Biệt: Toàn Cảnh ${coreSubject} — Diễn Biến Nóng & Tác Động Chiến Lược`
      : c2
        ? `Bản Tin Tiêu Điểm: ${truncateHeadlineWords(c1, 48)} & ${truncateHeadlineWords(c2, 46)}`
        : `Bản Tin Thời Sự 24h: ${truncateHeadlineWords(c1, 78)}`;

    const tickerItems =
      research.headlines.length > 0
        ? research.headlines.slice(0, 4).map((h) => `[${h.source.toUpperCase()}] ${h.title}`)
        : [
          `TIÊU ĐIỂM 24H: ${c1}`,
          ...(c2 ? [`GÓC KHUẤT & CÂU CHUYỆN ĐẰNG SAU: ${c2}`] : []),
          'Phân tích đa chiều dựa trên dữ kiện thực tế và bối cảnh thị trường',
        ];

    const scenes = isGeopolitics
      ? [
          {
            sceneNumber: 1,
            headline: `01. TIÊU ĐIỂM NÓNG: ${truncateHeadlineWords(c1.toUpperCase(), 42)}`,
            durationSec: 8,
            voiceover: h1
              ? `Kính chào quý vị đang theo dõi Bản tin Đặc biệt. Tâm điểm chú ý của dư luận quốc tế hôm nay đổ dồn vào ${c1}. Theo ghi nhận mới nhất từ ${src1}, ${h1}.`
              : `Kính chào quý vị đang theo dõi Bản tin Thời sự Đặc biệt. Tâm điểm chú ý của dư luận quốc tế đang đổ dồn về ${c1} với hàng loạt diễn biến hết sức đáng chú ý.`,
            visualPrompt: `Breaking news broadcast photojournalism wide shot of ${c1}, dramatic real-world atmosphere, 35mm lens, 8k press photography`,
            cameraMotion: 'dolly-in',
            lightingStyle: 'studio-clean',
            sfx: 'Breaking News Broadcast Stinger + Deep Pulse',
            transition: 'fade',
          },
          {
            sceneNumber: 2,
            headline: '02. DIỄN BIẾN THỰC ĐỊA & CÁN CÂN ĐỐI ĐẦU',
            durationSec: 9,
            voiceover: wikiFact1
              ? `Nhìn vào bức tranh tổng thể, giới quan sát chỉ rõ nền tảng cốt lõi của vấn đề. ${wikiFact1} Chính những mâu thuẫn tích tụ này đã đẩy cục diện bước sang giai đoạn nhạy cảm mới.`
              : `Nhìn lại chuỗi sự kiện vừa qua, tình hình xoay quanh ${c1} bắt nguồn từ những bước đi chiến lược và lợi ích cốt lõi khó dung hòa giữa các bên liên quan.`,
            visualPrompt: `Strategic command map and satellite reconnaissance overview of ${c1}, photojournalistic documentary style, 8k`,
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
              ? `Trong diễn biến liên quan vừa được ${src2} công bố: ${h2}. Động thái này ngay lập tức buộc các bên phải điều chỉnh trạng thái sẵn sàng.`
              : `Các nguồn tin thực địa và truyền thông quốc tế liên tục phát đi tín hiệu cho thấy mức độ cảnh giác đang được đẩy lên cao nhất.`,
            visualPrompt: `International press briefing and diplomatic flags representing ${c1}, crisp broadcast photojournalism, 85mm lens`,
            cameraMotion: 'orbit',
            lightingStyle: 'rembrandt',
            sfx: 'Press Camera Shutters + Subtle Whoosh',
            transition: 'cut',
          },
          {
            sceneNumber: 4,
            headline: '04. TÁC ĐỘNG AN NINH & CHUỖI CUNG ỨNG TOÀN CẦU',
            durationSec: 8,
            voiceover: h3
              ? `Không chỉ dừng lại ở khía cạnh chính trị, sức nóng của ${c1} đã lan sang thị trường toàn cầu. Ghi nhận thực tế cho thấy: ${h3}, tạo áp lực lớn lên giá năng lượng và chuỗi vận tải quốc tế.`
              : `Sức nóng từ ${c1} đang tạo ra hiệu ứng dây chuyền rõ nét lên thị trường tài chính, giá năng lượng cũng như tâm lý thận trọng của giới đầu tư toàn cầu.`,
            visualPrompt: `Global energy shipping routes and financial market screens reacting to ${c1}, dramatic cinematic realism, 8k`,
            cameraMotion: 'crane-up',
            lightingStyle: 'studio-clean',
            sfx: 'Data Ticker Pulse + Atmospheric Riser',
            transition: 'dissolve',
          },
          {
            sceneNumber: 5,
            headline: '05. PHẢN ỨNG NGOẠI GIAO & CÁC BÊN LIÊN QUAN',
            durationSec: 8,
            voiceover: `Trên bàn cờ ngoại giao, cộng đồng quốc tế đang nỗ lực kêu gọi kiềm chế tối đa nhằm ngăn chặn nguy cơ leo thang ngoài tầm kiểm soát, đồng thời mở ra các kênh đối thoại hậu trường.`,
            visualPrompt: `United Nations and international diplomatic summit table discussing ${c1}, dramatic architectural lighting, 35mm lens, 8k`,
            cameraMotion: 'pan-left',
            lightingStyle: 'volumetric',
            sfx: 'Subtle Orchestral Tension + Transition Hit',
            transition: 'cut',
          },
          {
            sceneNumber: 6,
            headline: '06. NHẬN ĐỊNH CHUYÊN GIA & DỰ BÁO KỊCH BẢN',
            durationSec: 8,
            voiceover: `Giới phân tích nhận định những ngày sắp tới sẽ mang tính quyết định đối với toàn bộ cục diện ${c1}. Chúng tôi sẽ tiếp tục cập nhật ngay khi có thông tin mới nhất.`,
            visualPrompt: `Modern live television newsroom studio wrap-up with world map backdrop covering ${c1}, slow Dolly Out shot, 8k broadcast quality`,
            cameraMotion: 'dolly-out',
            lightingStyle: 'studio-clean',
            sfx: 'Broadcast News Finale Theme',
            transition: 'fade',
          },
        ]
      : [
          {
            sceneNumber: 1,
            headline: `01. TIÊU ĐIỂM: ${truncateHeadlineWords(c1.toUpperCase(), 44)}`,
            durationSec: 9,
            voiceover: h1
              ? `Kính chào quý vị đang theo dõi bản tin tiêu điểm hôm nay. Câu chuyện đang thu hút sự quan tâm đặc biệt từ dư luận chính là việc ${c1}. Theo ghi nhận từ ${src1}, ${h1}.`
              : `Kính chào quý vị đang theo dõi bản tin tiêu điểm hôm nay. Câu chuyện đang thu hút sự chú ý lớn từ công chúng và giới chuyên môn chính là việc ${c1} — bước ngoặt mang nhiều ý nghĩa chiến lược.`,
            visualPrompt: `Editorial broadcast documentary opening shot illustrating ${c1}, authentic photojournalism, crisp 35mm lens, 8k`,
            cameraMotion: 'dolly-in',
            lightingStyle: 'studio-clean',
            sfx: 'Broadcast Opening Pulse',
            transition: 'fade',
          },
          {
            sceneNumber: 2,
            headline: '02. BỐI CẢNH LỊCH SỬ & TẦM NHÌN DÀI HẠN',
            durationSec: 9,
            voiceover: wikiFact1
              ? `Để hiểu rõ tầm quan trọng của bước chuyển này, cần nhìn lại nền tảng lịch sử: ${wikiFact1} Đó là lý do câu chuyện tìm lớp lãnh đạo kế cận luôn được giới quan sát đặt lên hàng đầu.`
              : `Đằng sau mỗi quyết định quan trọng về nhân sự và chiến lược là cả một hành trình tích lũy nhiều thập kỷ, nơi bản sắc sáng tạo và kỷ luật vận hành đóng vai trò sống còn.`,
            visualPrompt: `Documentary corporate leadership architecture and innovation center illustrating ${c1}, clean natural light, 50mm lens, 8k`,
            cameraMotion: 'pan-right',
            lightingStyle: 'volumetric',
            sfx: 'Clean Editorial Transition',
            transition: 'dissolve',
          },
          {
            sceneNumber: 3,
            headline: c2
              ? `03. GÓC KHUẤT ĐỜI TƯ: ${truncateHeadlineWords(c2.toUpperCase(), 40)}`
              : '03. CHÂN DUNG & NHỮNG GIÁ TRỊ PHÍA SAU HẬU TRƯỜNG',
            durationSec: 9,
            voiceover: c2
              ? `Song hành với câu chuyện điều hành là ${c2}. Dù gắn bó suốt nhiều thập kỷ qua, nhân vật này luôn chọn lối sống kín tiếng, hiếm khi xuất hiện trước truyền thông đại chúng.`
              : h2
                ? `Theo thông tin từ ${src2}, ${h2}. Những chi tiết hậu trường ít được biết đến này đang giúp công chúng nhìn rõ hơn con người và triết lý đằng sau các quyết sách lớn.`
                : `Ít ai biết rằng đằng sau ánh đèn sân khấu là sự đồng hành lặng lẽ, bền bỉ qua nhiều thế hệ, giữ cho bộ máy vận hành luôn ổn định và kiên định với mục tiêu dài hạn.`,
            visualPrompt: `Intimate documentary still life and dignified portrait atmosphere highlighting ${c2 || c1}, warm natural chiaroscuro, 85mm lens, 8k`,
            cameraMotion: 'orbit',
            lightingStyle: 'golden-hour',
            sfx: 'Warm Documentary Piano Swell',
            transition: 'dissolve',
          },
          {
            sceneNumber: 4,
            headline: c2 ? '04. HƠN 4 THẬP KỶ GẮN BÓ & DẤU ẤN THẦM LẶNG' : '04. DỮ KIỆN THỰC TẾ & TÁC ĐỘNG ĐA CHIỀU',
            durationSec: 9,
            voiceover: h2
              ? `Ghi nhận từ ${src2} cho biết thêm: ${h2}. Chính sự tảo tần, hậu thuẫn tinh thần và tầm nhìn nhân văn phía sau hậu trường đã tạo nên điểm tựa vững chắc hiếm thấy.`
              : `Từ những ngày đầu khởi nghiệp đầy thử thách cho đến khi gặt hái thành công vang dội, sự thấu hiểu và gắn bó bền chặt suốt hàng chục năm luôn là giá trị cốt lõi được công chúng ngưỡng mộ.`,
            visualPrompt: `Timeless archival documentary study representing 40 years of partnership and dedication behind ${c2 || c1}, warm editorial photography, 8k`,
            cameraMotion: 'pan-left',
            lightingStyle: 'rembrandt',
            sfx: 'Subtle Film Transition',
            transition: 'cut',
          },
          {
            sceneNumber: 5,
            headline: '05. TÁC ĐỘNG TỚI THỊ TRƯỜNG & THẾ HỆ KẾ CẬN',
            durationSec: 8,
            voiceover: h3
              ? `Trên góc độ chuyên môn, ${h3}. Dư luận kỳ vọng những giá trị cốt lõi và văn hóa kỷ luật sẽ tiếp tục được kế thừa trọn vẹn trong giai đoạn chuyển giao sắp tới.`
              : `Giới quan sát nhận định bài toán kế nhiệm không chỉ đo bằng năng lực điều hành ngắn hạn, mà còn nằm ở việc giữ vững bản sắc, niềm tin của cộng đồng và di sản bền vững suốt nhiều thập kỷ.`,
            visualPrompt: `Modern innovation laboratory and forward-looking executive transition editorial photography for ${c1}, 35mm lens, 8k`,
            cameraMotion: 'crane-up',
            lightingStyle: 'studio-clean',
            sfx: 'Modern Broadcast Pulse',
            transition: 'dissolve',
          },
          {
            sceneNumber: 6,
            headline: '06. TỔNG KẾT & GÓC NHÌN BÌNH LUẬN',
            durationSec: 8,
            voiceover: `Khép lại bản tin hôm nay, câu chuyện về ${c1}${c2 ? ` cùng ${c2}` : ''} mở ra nhiều suy ngẫm về tầm nhìn lãnh đạo và giá trị đồng hành thầm lặng. Quý vị có nhận định gì về câu chuyện này? Hãy chia sẻ bên dưới bình luận nhé!`,
            visualPrompt: `Clean editorial closing wide shot concluding the story of ${c1}, slow dolly out, natural contrast, 8k`,
            cameraMotion: 'dolly-out',
            lightingStyle: 'studio-clean',
            sfx: 'Broadcast News Finale Theme',
            transition: 'fade',
          },
        ];

    return {
      title,
      newsTicker: tickerItems.join('  •  '),
      musicGenre: isGeopolitics
        ? 'Broadcast Breaking News Pulse (Commercial Master)'
        : 'Documentary Editorial Score',
      tags: isGeopolitics
        ? ['BanTin24h', 'ThoiSuQuocTe', 'TinNong', 'PhanTichChienLuoc', 'DiaChinhTri']
        : ['BanTinTieuDiem', 'PhanTichChuyenSau', 'DoanhNhan', 'CongNghe'],
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
  const { beats: socialBeats, quotedLines: socialQuotes, moodHint: socialMood } = parsePromptStructure(
    rawPrompt,
    coreSubject
  );
  const platformTag = platformFormatLabel || 'Đa Nền Tảng';
  const isShortPlatform = platformFormat
    ? !platformFormat.includes('16-9')
    : (targetDurationSec ? targetDurationSec <= 60 : true);

  const desiredTotalSec =
    targetDurationSec && targetDurationSec > 0 ? targetDurationSec : isShortPlatform ? 30 : 48;
  const targetCount = desiredTotalSec <= 18 ? 3 : desiredTotalSec <= 40 ? 4 : 5;
  const perSceneSec = Math.max(4, Math.min(12, Math.round(desiredTotalSec / targetCount)));

  const title = `${coreSubject}${platformFormatLabel ? ` — Chuẩn ${platformFormatLabel}` : ''}`;
  const defaultCameraFlow: StoryboardScene['cameraMotion'][] = [
    'dolly-in',
    'pan-right',
    'orbit',
    'crane-up',
    'dolly-out',
  ];
  const defaultLightingFlow: StoryboardScene['lightingStyle'][] = [
    'golden-hour',
    'studio-clean',
    'volumetric',
    'rembrandt',
    'golden-hour',
  ];

  // Nếu người dùng nhập kịch bản nhiều ý (>= 3 ý / dòng), dựng phân cảnh 1:1 theo từng ý của người dùng
  const hasExplicitMultiBeats = socialBeats.length >= 3;
  const scenes = hasExplicitMultiBeats
    ? socialBeats.slice(0, Math.max(targetCount, Math.min(6, socialBeats.length))).map((beat, idx) => {
      const cleanBeat = beat.trim();
      const quoted = socialQuotes[idx] ? ` "${socialQuotes[idx]}"` : '';
      return {
        sceneNumber: idx + 1,
        headline: `${String(idx + 1).padStart(2, '0')}. ${truncateHeadlineWords(cleanBeat.toUpperCase(), 38)}`,
        durationSec: perSceneSec,
        voiceover: `${cleanBeat}.${quoted}`.replace(/\.\./g, '.'),
        visualPrompt: `${hasAttachedImage ? 'Smooth image-to-video motion keeping reference character consistent: ' : ''}${cleanBeat} (${coreSubject}), ${socialMood}, crisp 35mm cinema lens, 8k`,
        cameraMotion: defaultCameraFlow[idx % defaultCameraFlow.length],
        lightingStyle: defaultLightingFlow[idx % defaultLightingFlow.length],
        sfx: idx === 0 ? 'Warm Acoustic Swell + Hook Whoosh' : idx === socialBeats.length - 1 ? 'Warm Acoustic Finale' : 'Natural Ambient Transition',
        transition: idx === 0 || idx === socialBeats.length - 1 ? 'fade' : idx % 2 === 1 ? 'dissolve' : 'cut',
      };
    })
    : [
      {
        sceneNumber: 1,
        headline: `01. HOOK MỞ MÀN: ${truncateHeadlineWords((socialBeats[0] || coreSubject).toUpperCase(), 38)}`,
        durationSec: perSceneSec,
        voiceover: hasAttachedImage
          ? `Ngay từ khung hình gốc đầu tiên: ${socialBeats[0] || coreSubject}.${socialQuotes[0] ? ` "${socialQuotes[0]}"` : ''} Cùng khám phá chuyển động sống động bước ra từ chính bức ảnh này!`
          : wikiFact1
            ? `${socialBeats[0] || coreSubject}. ${wikiFact1}`
            : `Khoan lướt qua! Hãy cùng theo dõi ngay câu chuyện về ${socialBeats[0] || coreSubject} dành riêng cho khung hình ${platformTag}.`,
        visualPrompt: `${hasAttachedImage ? 'Image-to-video motion starting seamlessly from uploaded reference image: ' : 'Vibrant cinematic opening frame of '}${coreSubject}, ${socialMood}, crisp 35mm lens, 8k`,
        cameraMotion: 'dolly-in',
        lightingStyle: 'golden-hour',
        sfx: 'Warm Acoustic Swell + Hook Whoosh',
        transition: 'fade',
      },
      {
        sceneNumber: 2,
        headline: '02. DIỄN BIẾN CHÍNH & CHI TIẾT ĐẮT GIÁ',
        durationSec: perSceneSec,
        voiceover: `Đi sâu vào từng khoảnh khắc thực tế xoay quanh ${socialBeats[1] || coreSubject}, từng chuyển động ánh sáng, biểu cảm và nhịp điệu đều giữ trọn sự chú ý.${socialQuotes[0] ? ` "${socialQuotes[0]}"` : ''}`,
        visualPrompt: `Expressive medium tracking shot revealing key action and details of ${socialBeats[1] || coreSubject}, ${socialMood}, 85mm lens, 8k`,
        cameraMotion: 'orbit',
        lightingStyle: 'rembrandt',
        sfx: 'Natural Ambient Transition',
        transition: 'dissolve',
      },
      {
        sceneNumber: 3,
        headline: '03. ĐIỂM NHẤN CAO TRÀO & BỨT PHÁ CẢM XÚC',
        durationSec: perSceneSec,
        voiceover: h1
          ? `Đặc biệt khi kết hợp với góc nhìn thực tế: ${h1}, câu chuyện về ${coreSubject} càng trở nên sinh động và lan tỏa mạnh mẽ.`
          : `Đây chính là khoảnh khắc cao trào đắt giá nhất của ${coreSubject} — nơi mọi chi tiết trong bối cảnh hội tụ tạo cảm xúc chân thực khó quên.`,
        visualPrompt: `Dynamic high-energy visual shot highlighting climax of ${coreSubject}, ${socialMood}, smooth 60fps cinema look, 8k`,
        cameraMotion: 'pan-right',
        lightingStyle: 'studio-clean',
        sfx: 'Upbeat Rhythm Hit',
        transition: 'cut',
      },
      ...(targetCount >= 4
        ? [
          {
            sceneNumber: 4,
            headline: `04. KẾT THÚC & KÊU GỌI TƯƠNG TÁC`,
            durationSec: perSceneSec,
            voiceover: `Và đó là trọn vẹn câu chuyện "${coreSubject}" chuẩn tỷ lệ ${platformTag}. Bạn ấn tượng nhất với giây thứ mấy? Hãy bình luận và chia sẻ ngay nhé!`,
            visualPrompt: `Warm concluding wide shot of ${coreSubject}, slow Dolly Out camera movement, ${socialMood}, 35mm cinema look, 8k`,
            cameraMotion: 'dolly-out',
            lightingStyle: 'golden-hour',
            sfx: 'Warm Acoustic Finale',
            transition: 'fade',
          },
        ]
        : []),
      ...(targetCount >= 5
        ? [
          {
            sceneNumber: 5,
            headline: '05. DƯ ÂM & LỜI NHẮN CUỐI VIDEO',
            durationSec: perSceneSec,
            voiceover: `Đừng quên lưu lại video về ${coreSubject} và theo dõi kênh để đón xem những tập sáng tạo tiếp theo!`,
            visualPrompt: `Scenic closing panorama of ${coreSubject}, gentle crane up, golden sunlight, 8k cinematography`,
            cameraMotion: 'crane-up',
            lightingStyle: 'volumetric',
            sfx: 'Soft Chime & Breeze',
            transition: 'fade',
          },
        ]
        : []),
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

const PREFERRED_VOICE_MAP: Record<string, { id: string; label: string; speed: number; pitch: number }> = {
  'vi-sg-male-1': { id: 'vi-sg-male-1', label: 'Anh Nam Minh (Sài Gòn — Năng động, Cuốn hút)', speed: 1.12, pitch: 0.96 },
  'vi-sg-female-1': { id: 'vi-sg-female-1', label: 'Chị Diệu Thảo (Sài Gòn — Trong trẻo, Truyền cảm)', speed: 1.06, pitch: 1.12 },
  'vi-dn-male-1': { id: 'vi-dn-male-1', label: 'Anh Văn Quang (Thời sự 24h — Rõ ràng, Dõng dạc)', speed: 1.05, pitch: 0.92 },
  'vi-hn-male-1': { id: 'vi-hn-male-1', label: 'Anh Hoàng (Hà Nội — Trầm ấm Phóng sự & Tài liệu)', speed: 1.0, pitch: 0.88 },
  'vi-hn-female-1': { id: 'vi-hn-female-1', label: 'Chị Mai Linh (Hà Nội — Chuẩn Mực, Tin cậy)', speed: 1.04, pitch: 1.05 },
  'vi-apple-keynote-male': { id: 'vi-apple-keynote-male', label: 'Anh Tuấn Kiệt (Keynote — Trầm Điện Ảnh)', speed: 0.98, pitch: 0.86 },
};

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
 * Chạy đua hedged giữa Server LLM Proxy và gọi trực tiếp Gemini API trên trình duyệt:
 * Proxy khởi động trước 600ms; nếu quá 600ms hoặc Proxy lỗi, chạy song song Gemini Direct và hủy luồng chậm hơn.
 */
async function raceGeminiProxyAndDirect(params: {
  model: string;
  apiKey: string;
  systemPrompt: string;
  coreSubject: string;
  endpointUrl?: string;
  attachedImageDataUrl?: string;
  signal?: AbortSignal;
  onHedgeStart?: () => void;
}): Promise<{ data: any; actualModel: string }> {
  throwIfAborted(params.signal);
  const proxyCtrl = new AbortController();
  const directCtrl = new AbortController();
  const onParentAbort = () => {
    proxyCtrl.abort();
    directCtrl.abort();
  };
  params.signal?.addEventListener('abort', onParentAbort, { once: true });

  return new Promise<{ data: any; actualModel: string }>((resolve, reject) => {
    let settled = false;
    let directStarted = false;
    let pendingCount = 1;
    let lastErr: any = null;
    let hedgeTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (hedgeTimer) {
        clearTimeout(hedgeTimer);
        hedgeTimer = null;
      }
      params.signal?.removeEventListener('abort', onParentAbort);
    };

    const finishResolve = (res: { data: any; actualModel: string }, winner: 'proxy' | 'direct') => {
      if (settled) return;
      settled = true;
      cleanup();
      if (winner === 'proxy') directCtrl.abort();
      else proxyCtrl.abort();
      resolve(res);
    };

    const maybeRejectAll = () => {
      if (settled) return;
      if (params.signal?.aborted) {
        settled = true;
        cleanup();
        reject(createUserAbortError());
        return;
      }
      if (directStarted && pendingCount <= 0) {
        settled = true;
        cleanup();
        reject(lastErr || new Error('Cả Proxy và Direct Gemini đều không phản hồi'));
      }
    };

    const startDirect = () => {
      if (settled || directStarted) return;
      directStarted = true;
      if (hedgeTimer) {
        clearTimeout(hedgeTimer);
        hedgeTimer = null;
      }
      if (params.signal?.aborted) {
        maybeRejectAll();
        return;
      }
      pendingCount += 1;
      params.onHedgeStart?.();
      callGeminiDirectBrowser(
        params.model,
        params.apiKey,
        params.systemPrompt,
        params.coreSubject,
        params.endpointUrl,
        params.attachedImageDataUrl,
        directCtrl.signal
      )
        .then((res) => finishResolve(res, 'direct'))
        .catch((err) => {
          pendingCount -= 1;
          lastErr = err;
          maybeRejectAll();
        });
    };

    hedgeTimer = setTimeout(startDirect, 600);

    callServerLlmProxy(
      'gemini',
      params.model,
      params.apiKey,
      params.systemPrompt,
      params.coreSubject,
      params.endpointUrl,
      params.attachedImageDataUrl,
      proxyCtrl.signal
    )
      .then((res) => finishResolve(res, 'proxy'))
      .catch((err) => {
        pendingCount -= 1;
        lastErr = err;
        if (params.signal?.aborted) {
          maybeRejectAll();
          return;
        }
        if (!directStarted) {
          startDirect();
        } else {
          maybeRejectAll();
        }
      });
  });
}

interface SkillDirectorDirectives {
  motions: StoryboardScene['cameraMotion'][];
  lightings: StoryboardScene['lightingStyle'][];
  sfxList: string[];
  preferredTransition: 'cut' | 'fade' | 'dissolve';
  visualDirective: string;
  pacingSummary: string;
  tagHint: string;
}

function normalizeParenFormatting(input: string): string {
  return String(input || '')
    .replace(/\(([^()]*)\(([^()]*)\)([^()]*)\)/g, '($1• $2$3)')
    .replace(/\(\s*•\s*/g, '(')
    .replace(/\s*•\s*\)/g, ')')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function resolveSkillDirectives(skill?: Skill): SkillDirectorDirectives {
  const cmd = (skill?.command || '').toLowerCase().trim();
  const customContext = `${skill?.name || ''} ${skill?.tone || ''} ${skill?.systemPrompt || ''}`.toLowerCase();

  switch (cmd) {
    case '/tech-review':
    case '/apple-design':
    case '/apple-keynote-3d':
      return {
        motions: ['orbit', 'dolly-in', 'crane-up', 'pan-right', 'dolly-out'],
        lightings: ['studio-clean', 'volumetric', 'cyberpunk', 'rembrandt'],
        sfxList: ['Precision Titanium Click', 'Tactile Shutter Macro', 'Subtle Bass Whoosh'],
        preferredTransition: 'cut',
        visualDirective: 'Apple Keynote dark-studio rim lighting, anodized metallic reflections, crisp macro lens focus',
        pacingSummary: 'Phong cách Keynote / Đánh giá phần cứng chuẩn Studio, ánh sáng viền sắc nét.',
        tagHint: cmd.replace(/^\//, '').replace(/-/g, ''),
      };
    case '/daily-news':
      return {
        motions: ['dolly-in', 'pan-right', 'pan-left', 'dolly-out'],
        lightings: ['studio-clean', 'volumetric', 'golden-hour'],
        sfxList: ['Broadcast Breaking Pulse', 'Editorial News Whoosh', 'Live Data Chime'],
        preferredTransition: 'cut',
        visualDirective: 'broadcast photojournalism, crisp newsroom clarity, authentic documentary composition',
        pacingSummary: 'Nhịp bản tin thời sự 24h nhanh, dữ kiện rõ ràng, chuyển cảnh dứt khoát.',
        tagHint: 'BanTin24h',
      };
    case '/product-sales':
      return {
        motions: ['dolly-in', 'orbit', 'pan-right', 'crane-up'],
        lightings: ['golden-hour', 'studio-clean', 'volumetric'],
        sfxList: ['Cash Register Sparkle', 'Product Reveal Swish', 'Upbeat Commercial Pop'],
        preferredTransition: 'cut',
        visualDirective: 'high-conversion commercial product lighting, clean hero framing, appetizing texture detail',
        pacingSummary: 'Cấu trúc bán hàng Hook-Problem-Proof-CTA tốc độ cao.',
        tagHint: 'BanHangChuyenDoi',
      };
    case '/premium-craft':
    case '/cinematic-director':
    case '/storytelling':
    case '/cinematic-pacing':
      return {
        motions: ['crane-up', 'dolly-in', 'orbit', 'pan-right', 'dolly-out'],
        lightings: ['rembrandt', 'golden-hour', 'volumetric', 'studio-clean'],
        sfxList: ['Cinematic Atmos Swell', 'Deep Film Riser', 'Anamorphic Lens Sweep'],
        preferredTransition: 'dissolve',
        visualDirective: 'anamorphic 35mm cinema composition, soft golden-hour film grain, atmospheric depth of field',
        pacingSummary: 'Đạo diễn điện ảnh kể chuyện giàu cảm xúc, chuyển cảnh dissolve mượt mà.',
        tagHint: 'DienAnhStory',
      };
    case '/retention-master':
    case '/autocut-pacing':
    case '/remotion-motion':
    case '/apple-subtitles':
      return {
        motions: ['dolly-in', 'pan-right', 'pan-left', 'orbit', 'crane-up'],
        lightings: ['cyberpunk', 'studio-clean', 'volumetric', 'golden-hour'],
        sfxList: ['Dynamic Cut Whoosh', 'Kinetic UI Snap', 'Retention Pattern Interrupt'],
        preferredTransition: 'cut',
        visualDirective: 'high-retention dynamic framing, kinetic graphic clarity, crisp foreground subject separation',
        pacingSummary: 'Tối ưu giữ chân người xem nhịp cắt 2-4s, nhấn mạnh điểm chuyển cảnh.',
        tagHint: 'GiuChanNguoiXem',
      };
    case '/3d-character':
    case '/3d-presenter':
      return {
        motions: ['orbit', 'dolly-in', 'pan-right', 'dolly-out'],
        lightings: ['studio-clean', 'volumetric', 'golden-hour'],
        sfxList: ['3D Stage Whoosh', 'Character Expression Pop', 'Clean Broadcast Chime'],
        preferredTransition: 'dissolve',
        visualDirective: '3D character studio lighting, rim-light depth, SadTalker lip-sync framing, Three.js camera orbit',
        pacingSummary: 'Đạo diễn nhân vật 3D với khẩu hình đồng bộ Neural TTS, ánh sáng 3D Rim-Light và chuyển cảnh mượt.',
        tagHint: 'NhanVat3D',
      };
    case '/video-edit-pro':
      return {
        motions: ['dolly-in', 'pan-right', 'pan-left', 'orbit', 'crane-up'],
        lightings: ['studio-clean', 'rembrandt', 'volumetric'],
        sfxList: ['Beat-Sync Cut Snap', 'MoviePy LUT Whoosh', 'Auto Ducking Transition'],
        preferredTransition: 'dissolve',
        visualDirective: 'NLE multi-track compositing, Editly GL dissolve transitions, balanced LUT contrast',
        pacingSummary: 'Dựng hậu kỳ NLE chuyên sâu theo nhịp Beat-Cut, chỉnh màu LUT và lớp phủ PiP.',
        tagHint: 'VideoEditPro',
      };
    case '/paper-art':
      return {
        motions: ['dolly-in', 'pan-right', 'pan-left', 'dolly-out'],
        lightings: ['golden-hour', 'studio-clean'],
        sfxList: ['Sketch Pencil Stroke', 'Craft Paper Turn', 'Warm Acoustic Chime'],
        preferredTransition: 'dissolve',
        visualDirective: 'Rough.js hand-drawn kraft paper illustration, cut-paper shadows, PaperFold transition',
        pacingSummary: 'Hoạt hình vẽ tranh giấy thủ công (Rough.js), chuyển cảnh lật trang PaperFold/PageCurl mượt mà.',
        tagHint: 'VeTranhGiay',
      };
    case '/motion-transitions':
      return {
        motions: ['orbit', 'dolly-in', 'crane-up', 'fpv-zoom'],
        lightings: ['volumetric', 'studio-clean', 'cyberpunk'],
        sfxList: ['Cinematic Whip Whoosh', 'Subtle Bass Drop', 'Optical Lens Sweep'],
        preferredTransition: 'dissolve',
        visualDirective: 'GL-Transitions WebGL shader transition, GSAP kinetic typography, clean cinema 1080p frame',
        pacingSummary: 'Dựng phim chuyển cảnh WebGL GL-Transitions & đồ họa GSAP không rác overlay.',
        tagHint: 'GLTransitions',
      };
    case '/videolingo-dub':
    case '/haptic-sound-design':
      return {
        motions: ['dolly-in', 'orbit', 'pan-right', 'dolly-out'],
        lightings: ['studio-clean', 'rembrandt', 'volumetric'],
        sfxList: ['Haptic Tactile Click', 'Binaural Spatial Ambience', 'Clean Dialogue Presence'],
        preferredTransition: 'fade',
        visualDirective: 'clean dialogue-friendly composition, balanced spatial headroom, subtle ambient lighting',
        pacingSummary: 'Ưu tiên khẩu hình/giọng thuyết minh đa ngôn ngữ và thiết kế âm thanh xúc giác.',
        tagHint: 'AmThanhHaptic',
      };
    default: {
      const wantsDarkCinema = /điện ảnh|cinema|kể chuyện|cảm xúc|story|dramatic|rembrandt|film/i.test(
        customContext
      );
      const wantsFast = /nhanh|viral|tiktok|short|giữ chân|retention|sales|bán hàng/i.test(
        customContext
      );
      return {
        motions: wantsFast
          ? ['dolly-in', 'pan-right', 'orbit', 'pan-left']
          : wantsDarkCinema
            ? ['crane-up', 'dolly-in', 'orbit', 'dolly-out']
            : ['dolly-in', 'pan-right', 'orbit', 'crane-up', 'pan-left', 'dolly-out'],
        lightings: wantsDarkCinema
          ? ['rembrandt', 'volumetric', 'golden-hour', 'studio-clean']
          : ['studio-clean', 'volumetric', 'golden-hour', 'rembrandt', 'cyberpunk'],
        sfxList: wantsDarkCinema
          ? ['Cinematic Atmos Swell', 'Warm Tape Ambience', 'Subtle Film Transition']
          : ['Clean Studio Pulse', 'Editorial Whoosh', 'Tactile Frame Shift'],
        preferredTransition: wantsDarkCinema ? 'dissolve' : 'cut',
        visualDirective: skill?.tone
          ? `${skill.tone}, crisp studio photography, coherent visual continuity`
          : 'authentic 35mm natural composition, balanced lighting, sharp focus',
        pacingSummary: skill?.description || (skill?.name ? `Áp dụng Skill ${skill.name}.` : ''),
        tagHint: skill?.command
          ? skill.command.replace(/^\//, '').replace(/[^a-zA-Z0-9À-ỹ]/g, '')
          : '',
      };
    }
  }
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
    targetDurationSec,
    preferredVoiceId,
    creationSpeedMode = 'cloud',
    imageMotionMode = 'consistent-anchor',
    provider,
    model,
    apiKey,
    endpointUrl,
    fallbackProviders = [],
    preHarvestedResearch = null,
    attachedImageDataUrl,
    attachedImages = [],
    attachedAudioUrl,
    attachedAudioName,
    signal,
    onProgress,
  } = params;

  const attachedImageList = Array.from(
    new Set(
      (attachedImages && attachedImages.length > 0
        ? attachedImages
        : attachedImageDataUrl
          ? [attachedImageDataUrl]
          : []
      ).filter(Boolean)
    )
  ).slice(0, 20);
  const primaryAttachedImage = attachedImageList[0] || attachedImageDataUrl;

  throwIfAborted(signal);

  const skill = skills.find((s) => s.id === skillId || s.command === skillId);
  const provMeta = PROVIDERS.find((p) => p.id === provider);
  const provName = provMeta?.name || provider;

  // 1. Kiểm tra nếu người dùng yêu cầu "Tạo bản tin ngẫu nhiên" không chỉ định chủ đề cụ thể
  const isRandomReq = isGenericRandomTopicRequest(prompt);
  const resolvedDurationSec =
    typeof targetDurationSec === 'number' && targetDurationSec > 0
      ? targetDurationSec
      : Math.max(15, Math.round((targetDurationMin || 3) * 60));

  const cacheKey = !isRandomReq
    ? JSON.stringify({
      p: prompt.trim().toLowerCase(),
      s: skillId || '',
      a: aspectRatio,
      pf: platformFormat || '',
      td: resolvedDurationSec,
      pv: preferredVoiceId || '',
      sm: creationSpeedMode,
      im: imageMotionMode,
      img: attachedImageList.map((u) => `${u.slice(0, 32)}_${u.length}`).join('|'),
      aud: attachedAudioName || '',
      audUrl: attachedAudioUrl ? `${attachedAudioUrl.slice(0, 48)}_${attachedAudioUrl.length}` : '',
      pr: creationSpeedMode === 'turbo' ? 'turbo' : provider,
      md: creationSpeedMode === 'turbo' ? 'turbo' : model,
    })
    : '';

  if (cacheKey && SCRIPT_RESULT_CACHE.has(cacheKey)) {
    onProgress?.('⚡ Đã khôi phục tức thì kịch bản & phân cảnh từ bộ nhớ đệm...', 100);
    const cached = SCRIPT_RESULT_CACHE.get(cacheKey)!;
    return {
      ...cached,
      storyboard: cached.storyboard.map((sc) => ({
        ...sc,
        dialogueLines: sc.dialogueLines ? [...sc.dialogueLines] : undefined,
      })),
    };
  }

  let coreSubject = isRandomReq
    ? RANDOM_TOPIC_PRESETS[Math.floor(Math.random() * RANDOM_TOPIC_PRESETS.length)].prompt
    : extractCleanSubject(prompt);

  if (isRandomReq) {
    coreSubject = extractCleanSubject(coreSubject);
  }

  const prelimDomain = classifyTopicDomainClient(coreSubject);
  const isTurboMode = creationSpeedMode === 'turbo';
  const needsLiveResearch =
    !isTurboMode &&
    (isRandomReq ||
      (prelimDomain !== 'creative' &&
        prelimDomain !== 'animation-3d'));

  let research: TopicResearchPayload = preHarvestedResearch
    ? {
        ...preHarvestedResearch,
        headlines: [...(preHarvestedResearch.headlines || [])],
        visuals: [...(preHarvestedResearch.visuals || [])],
        videos: [...(preHarvestedResearch.videos || [])],
      }
    : {
        query: coreSubject,
        domain: prelimDomain,
        headlines: [],
        wikiSummary: '',
        visuals: [],
      };

  const hasPreHarvested = Boolean(
    preHarvestedResearch &&
      (preHarvestedResearch.headlines?.length > 0 ||
        preHarvestedResearch.wikiSummary ||
        preHarvestedResearch.visuals?.length > 0 ||
        (preHarvestedResearch.videos?.length || 0) > 0)
  );

  if (needsLiveResearch && !hasPreHarvested) {
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
    onProgress?.(
      isTurboMode
        ? `⚡ Chế độ Siêu tốc: Đang bóc tách trực tiếp từng câu prompt cho "${coreSubject}"...`
        : `Đang phân tích ý tưởng & tư liệu đính kèm cho "${coreSubject}"...`,
      isTurboMode ? 55 : 28
    );
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
    resolvedDurationSec / 60,
    platformFormatLabel,
    attachedImageList.length > 0
  );

  let rawJson: any = null;
  let isLiveApi = false;
  let actualModelUsed = isTurboMode ? 'SYNAPES Turbo Director Engine' : model;
  let actualProviderUsed: string = provider;
  let capturedTelemetry: TokenTelemetry | undefined;
  let engineMessage = isTurboMode
    ? `⚡ Đã dựng siêu tốc bám sát 100% prompt "${coreSubject}" trong <1s.`
    : '';

  // 3. Gọi tới LLM API (kèm Auto-Failover giữa các API Key còn token) HOẶC Server Research Director
  const hasRealLlmKey = Boolean(apiKey && apiKey.trim().length > 5 && provider !== 'plugin');
  const hasFallbacks = Array.isArray(fallbackProviders) && fallbackProviders.length > 0;
  if (!isTurboMode) {
    try {
      onProgress?.(
        hasRealLlmKey
          ? `Đang kết nối ${provName} (${model})${hasFallbacks ? ` + ${fallbackProviders.length} Key dự phòng` : ''} biên soạn kịch bản "${coreSubject}"...`
          : `Đang kết nối Động cơ Biên kịch & Nghiên cứu Dữ liệu cho "${coreSubject}"...`,
        48
      );

      if (hasRealLlmKey && provider === 'gemini' && !hasFallbacks) {
        const geminiRes = await raceGeminiProxyAndDirect({
          model,
          apiKey,
          systemPrompt,
          coreSubject,
          endpointUrl,
          attachedImageDataUrl: primaryAttachedImage,
          signal,
          onHedgeStart: () => {
            onProgress?.(`Đang tăng tốc kết nối trực tiếp ${provName} (${model})...`, 64);
          },
        });
        rawJson = geminiRes.data;
        actualModelUsed = geminiRes.actualModel;
        capturedTelemetry = {
          provider: 'gemini',
          model: actualModelUsed,
          promptTokens: Math.max(180, Math.round((systemPrompt.length + coreSubject.length) / 3.8)),
          completionTokens: Math.max(240, Math.round(JSON.stringify(rawJson).length / 4)),
          totalTokens:
            Math.max(180, Math.round((systemPrompt.length + coreSubject.length) / 3.8)) +
            Math.max(240, Math.round(JSON.stringify(rawJson).length / 4)),
          keyStatus: 'active',
          failoverTriggered: false,
          attemptedProviders: [`gemini:${actualModelUsed}`],
        };
      } else {
        const extractedClauses = splitPromptClauses(prompt, coreSubject);
        const proxyRes = await callServerLlmProxy(
          provider,
          model,
          hasRealLlmKey ? apiKey : '',
          systemPrompt,
          coreSubject,
          endpointUrl,
          primaryAttachedImage,
          signal,
          {
            rawPrompt: prompt,
            clauses: extractedClauses,
            sceneCount: aspectRatio === '9:16' ? 5 : resolvedDurationSec >= 105 ? 8 : 6,
            durationSeconds: resolvedDurationSec,
            videoGenre,
            domain,
            platformFormatLabel,
            mode: hasRealLlmKey ? 'llm' : 'studio-research',
            fallbackProviders,
          }
        );
        rawJson = proxyRes.data;
        actualModelUsed = proxyRes.actualModel;
        actualProviderUsed = proxyRes.actualProvider || provider;
        capturedTelemetry = proxyRes.tokenTelemetry;
      }

      if (rawJson && Array.isArray(rawJson.scenes) && rawJson.scenes.length > 0) {
        isLiveApi = true;
        engineMessage = hasRealLlmKey
          ? `Đã biên kịch trực tiếp bởi ${actualProviderUsed.toUpperCase()} (${actualModelUsed})${capturedTelemetry?.failoverTriggered ? ' [Auto-Failover ✓]' : ''} bám sát yêu cầu.`
          : `Đã tổng hợp kịch bản đa nhánh bám sát yêu cầu từ dữ liệu thực tế (${actualModelUsed}).`;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || signal?.aborted) {
        throw createUserAbortError();
      }
      console.warn('Live LLM API fallback triggered:', err);
      actualModelUsed = 'SYNAPES Studio Creative Engine';
      engineMessage = `Đã kích hoạt Động cơ Biên kịch Thông minh SYNAPES Studio cho "${coreSubject}".`;
      capturedTelemetry = {
        provider: 'synapes-studio-core',
        model: actualModelUsed,
        promptTokens: Math.max(150, Math.round(prompt.length / 3)),
        completionTokens: 540,
        totalTokens: Math.max(150, Math.round(prompt.length / 3)) + 540,
        keyStatus: hasRealLlmKey ? 'quota_failover_studio_core' : 'studio_core',
        failoverTriggered: hasRealLlmKey,
        failoverReason: hasRealLlmKey ? String(err?.message || 'Quota/timeout fallback') : '',
        attemptedProviders: [provider, ...fallbackProviders.map((f) => f.provider), 'studio-core'],
      };
    }
  }

  throwIfAborted(signal);

  // 4. Nếu đang ở chế độ Siêu tốc, chưa có API Key hoặc API quá tải: Sử dụng Động cơ Biên kịch Đa Thể Loại bám sát Prompt thực tế
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
      Boolean(attachedImageDataUrl),
      resolvedDurationSec
    );
    if (!engineMessage) {
      engineMessage = `Đã hoàn tất dựng kịch bản & hình ảnh cho "${coreSubject}".`;
    }
  }

  throwIfAborted(signal);
  onProgress?.('Đang đồng bộ hình ảnh, tư liệu đính kèm, gói đồ họa & giọng đọc...', 92);

  const skillDirectives = resolveSkillDirectives(skill);
  const motions = skillDirectives.motions;
  const lightings = skillDirectives.lightings;

  const matchedSavedClone = preferredVoiceId
    ? getSavedClonedVoiceProfiles().find((cv) => cv.id === preferredVoiceId)
    : undefined;
  const preferredVoice = matchedSavedClone
    ? {
        id: matchedSavedClone.id,
        label: `${matchedSavedClone.name} (Clone ULTRA)`,
        speed: matchedSavedClone.rate || 1.0,
        pitch: matchedSavedClone.pitch || 1.0,
      }
    : preferredVoiceId
      ? PREFERRED_VOICE_MAP[preferredVoiceId]
      : undefined;
  const defaultVoice = preferredVoice || pickDefaultVoiceForGenre(videoGenre, domain);
  const isHardwareKeynote = videoGenre === 'apple-keynote' && domain === 'hardware';

  const buildSceneMetricsForDomain = (
    sc: any,
    idx: number
  ): SceneMetricItem[] => {
    if (Array.isArray(sc?.sceneMetrics) && sc.sceneMetrics.length >= 2) {
      return sc.sceneMetrics.slice(0, 3);
    }
    const voText = String(sc?.voiceover || '').trim();
    const wordCount = voText ? voText.split(/\s+/).filter(Boolean).length : 0;
    const durSec = Math.max(2, Number(sc?.durationSec) || 8);
    const wpm = Math.round((wordCount / durSec) * 60);
    const srcName = research.headlines[idx % Math.max(1, research.headlines.length)]?.source || 'Studio Core';
    const headlineCount = research.headlines.length;
    const visualCount = research.visuals.length;

    return [
      { label: 'NHỊP ĐỌC THOẠI', value: `${wordCount} từ (${durSec}s)`, delta: `${wpm} từ/phút` },
      { label: 'NGUỒN ĐỐI CHIẾU', value: srcName.slice(0, 14), delta: `${headlineCount} tin RSS` },
      { label: 'KHO TƯ LIỆU B-ROLL', value: `${visualCount} tệp HD`, delta: `Cảnh 0${idx + 1}` },
    ];
  };

  let rawScenes: any[] = Array.isArray(rawJson.scenes) ? [...rawJson.scenes] : [];
  const desiredSceneCount =
    aspectRatio !== '9:16' && resolvedDurationSec >= 105 && rawScenes.length < 8
      ? 8
      : rawScenes.length;

  if (desiredSceneCount > rawScenes.length && rawScenes.length >= 2) {
    const closingScene = rawScenes.pop();
    const extraAngles = [
      {
        headline: 'BỐI CẢNH QUỐC TẾ & DỮ LIỆU ĐỐI CHIẾU',
        motion: 'pan-right',
        lighting: 'volumetric',
        buildVo: (h: any, w: string) =>
          h?.title
            ? `Theo dữ liệu đối chiếu từ ${h.source || 'truyền thông quốc tế'}, ${h.title}. Chi tiết này giúp làm rõ toàn bộ bức tranh vận động của ${coreSubject} ở quy mô vĩ mô.`
            : w
              ? `Mở rộng góc nhìn từ nền tảng tri thức thực tế: ${w}. Điều này khẳng định vai trò cốt lõi của ${coreSubject} trong xu thế hiện đại.`
              : `Nhìn từ lăng kính đối chiếu quốc tế, các chuyển biến quanh ${coreSubject} đang tạo ra làn sóng dịch chuyển rõ rệt về cấu trúc vận hành.`,
      },
      {
        headline: 'PHÂN TÍCH ĐỘNG LỰC & TÁC ĐỘNG ĐA CHIỀU',
        motion: 'orbit',
        lighting: 'studio-clean',
        buildVo: (h: any) =>
          h?.title
            ? `Đào sâu vào yếu tố cốt lõi, nguồn tin từ ${h.source || 'chuyên trang phân tích'} ghi nhận: ${h.title}. Các chỉ số thực nghiệm cho thấy xu hướng này sẽ tiếp tục gia tăng.`
            : `Đào sâu vào cấu trúc bên trong, sự giao thoa giữa hạ tầng kỹ thuật và nhu cầu thực tiễn đang biến ${coreSubject} thành tâm điểm thu hút nguồn lực đầu tư.`,
      },
      {
        headline: 'TRIỂN VỌNG GIAI ĐOẠN MỚI & KỊCH BẢN PHÁT TRIỂN',
        motion: 'crane-up',
        lighting: 'golden-hour',
        buildVo: (h: any) =>
          h?.title
            ? `Hướng về lộ trình sắp tới, ${h.title} được giới chuyên gia đánh giá là chỉ báo quan trọng định hình giai đoạn phát triển tiếp theo của ${coreSubject}.`
            : `Bước sang chu kỳ tiếp theo, bài toán cân bằng giữa tốc độ tăng trưởng và tính bền vững sẽ là thước đo quyết định vị thế dài hạn của ${coreSubject}.`,
      },
    ];

    let angleCursor = 0;
    while (rawScenes.length < desiredSceneCount - 1) {
      const nextNum = rawScenes.length + 1;
      const spec = extraAngles[angleCursor % extraAngles.length];
      const h = research.headlines[(nextNum + 1) % Math.max(1, research.headlines.length)];
      const wikiSnippet = research.wikiSummary ? research.wikiSummary.split('. ').slice(1, 3).join('. ') : '';
      rawScenes.push({
        sceneNumber: nextNum,
        headline: `${String(nextNum).padStart(2, '0')}. ${spec.headline}`,
        durationSec: Math.round(resolvedDurationSec / desiredSceneCount),
        voiceover: spec.buildVo(h, wikiSnippet),
        visualPrompt: `Editorial documentary B-roll sequence illustrating ${spec.headline.toLowerCase()} of ${coreSubject}, 35mm cinema lens, 8k`,
        cameraMotion: spec.motion,
        lightingStyle: spec.lighting,
        sfx: 'Clean Editorial Transition',
        transition: 'dissolve',
        sourceCitation: h?.source || 'Google News & Wikimedia Commons',
      });
      angleCursor += 1;
    }
    if (closingScene) {
      const finalNum = rawScenes.length + 1;
      closingScene.sceneNumber = finalNum;
      closingScene.headline = String(closingScene.headline || '').replace(
        /^\d+\./,
        `${String(finalNum).padStart(2, '0')}.`
      );
      rawScenes.push(closingScene);
    }
  }
  const minSceneDur =
    resolvedDurationSec <= 20 ? 2 : resolvedDurationSec <= 40 || videoGenre === '3d-animation' ? 3 : 4;
  const maxSceneDur = Math.max(
    30,
    Math.ceil(resolvedDurationSec / Math.max(1, rawScenes.length)) + 15
  );
  const scaledDurations = rawScenes.map((s) =>
    Math.max(
      minSceneDur,
      Math.min(maxSceneDur, Number(s?.durationSec) || (videoGenre === '3d-animation' ? 4 : 8))
    )
  );
  const rawSum = scaledDurations.reduce((acc, d) => acc + d, 0);
  if (
    typeof targetDurationSec === 'number' &&
    targetDurationSec > 0 &&
    rawScenes.length > 0 &&
    rawSum !== targetDurationSec
  ) {
    const ratio = targetDurationSec / Math.max(1, rawSum);
    let running = 0;
    for (let i = 0; i < scaledDurations.length; i++) {
      if (i === scaledDurations.length - 1) {
        scaledDurations[i] = Math.max(minSceneDur, Math.min(maxSceneDur, targetDurationSec - running));
      } else {
        scaledDurations[i] = Math.max(
          minSceneDur,
          Math.min(maxSceneDur, Math.round(scaledDurations[i] * ratio))
        );
        running += scaledDurations[i];
      }
    }
  }

  let accumulatedSec = 0;
  const storyboard: StoryboardScene[] = rawScenes.map((sc: any, idx: number) => {
    const dur = scaledDurations[idx] ?? 6;
    const startSec = accumulatedSec;
    const endSec = startSec + dur;
    accumulatedSec = endSec;

    const startMinStr = Math.floor(startSec / 60).toString().padStart(2, '0');
    const startSecStr = (startSec % 60).toString().padStart(2, '0');
    const endMinStr = Math.floor(endSec / 60).toString().padStart(2, '0');
    const endSecStr = (endSec % 60).toString().padStart(2, '0');

    const baseVisualPrompt =
      sc.visualPrompt ||
      `Authentic photojournalistic shot of ${coreSubject}, 35mm lens, dramatic natural lighting, 8k`;
    const visualPrompt =
      skill && !baseVisualPrompt.toLowerCase().includes(skillDirectives.visualDirective.slice(0, 20).toLowerCase())
        ? `${baseVisualPrompt}, ${skillDirectives.visualDirective}`
        : baseVisualPrompt;

    const attachedImgForScene =
      attachedImageList.length > 1
        ? attachedImageList[idx % attachedImageList.length]
        : attachedImageList.length === 1 && (imageMotionMode !== 'hybrid-scenes' || idx === 0)
          ? attachedImageList[0]
          : undefined;

    const aiImageUrl = attachedImgForScene
      ? attachedImgForScene
      : sc.imageUrl ||
        buildAiSceneImageUrl(visualPrompt, aspectRatio, idx + 1, domain, research.visuals);

    const secondaryImageUrl =
      research.visuals && research.visuals.length > 1
        ? research.visuals[
            (idx + Math.max(1, Math.floor(research.visuals.length / 2))) % research.visuals.length
          ].proxyUrl
        : buildAiSceneImageUrl(
            `${visualPrompt}, close-up detail evidence shot`,
            aspectRatio,
            idx + 5,
            domain,
            research.visuals
          );

    const isAnimationMode = videoGenre === '3d-animation';
    const matchedResearchVideo =
      research.videos && research.videos.length > 0
        ? research.videos[idx % research.videos.length]
        : undefined;
    const rawClipCandidate =
      sc.clipUrl && String(sc.clipUrl).startsWith('/api/video-proxy')
        ? sc.clipUrl
        : matchedResearchVideo?.proxyUrl ||
          (!isAnimationMode
            ? `/api/video-proxy?domain=${encodeURIComponent(domain)}&idx=${idx}`
            : SCENE_VIDEO_CLIPS[idx % SCENE_VIDEO_CLIPS.length]);

    const sourceCitation = String(
      sc.sourceCitation ||
        research.headlines[idx % Math.max(1, research.headlines.length)]?.source ||
        matchedResearchVideo?.source ||
        'Google News & Wikimedia Commons'
    );
    const sceneMetrics = buildSceneMetricsForDomain(sc, idx);
    const clipUrl = rawClipCandidate;
    const cameraMotion =
      skill && skillDirectives.motions.length > 0
        ? motions[idx % motions.length]
        : motions.includes(sc.cameraMotion)
          ? sc.cameraMotion
          : motions[idx % motions.length];
    const lightingStyle =
      skill && skillDirectives.lightings.length > 0
        ? lightings[idx % lightings.length]
        : lightings.includes(sc.lightingStyle)
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

    const useExplicitNarratorVoice = Boolean(preferredVoice && !sc.speakerId);

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
      secondaryImageUrl,
      sourceCitation,
      sceneMetrics,
      subShotMode: sc.subShotMode || 'auto',
      ...(attachedImgForScene
        ? {
          customMediaUrl: attachedImgForScene,
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
      sfx:
        skill
          ? skillDirectives.sfxList[idx % skillDirectives.sfxList.length]
          : sc.sfx || skillDirectives.sfxList[idx % skillDirectives.sfxList.length],
      transition:
        skill
          ? skillDirectives.preferredTransition
          : sc.transition === 'fade' || sc.transition === 'dissolve'
            ? sc.transition
            : skillDirectives.preferredTransition,
      voiceId: useExplicitNarratorVoice ? preferredVoice!.id : sc.voiceId || defaultVoice.id,
      voiceLanguage: 'vi',
      voiceSpeed: useExplicitNarratorVoice
        ? preferredVoice!.speed
        : typeof sc.voiceSpeed === 'number'
          ? sc.voiceSpeed
          : defaultVoice.speed,
      voicePitch: useExplicitNarratorVoice
        ? preferredVoice!.pitch
        : typeof sc.voicePitch === 'number'
          ? sc.voicePitch
          : defaultVoice.pitch,
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

  const totalDuration = accumulatedSec || resolvedDurationSec || 48;
  const heroThumbnail =
    attachedImageDataUrl ||
    storyboard[0]?.imageUrl ||
    buildAiSceneImageUrl(coreSubject, aspectRatio, 1, domain, research.visuals);

  const cleanFinalTitle = normalizeParenFormatting(
    String(rawJson.title || `Toàn Cảnh ${coreSubject}`).replace(/^tạo\s+bản\s+tin\s+về\s+/i, '')
  );

  const timelineDesc = storyboard
    .map((s) => `${s.timeRange.split(' - ')[0]} — ${s.headline}`)
    .join('\n');

  const skillDescBanner = skill
    ? `\n\nPHONG CÁCH BIÊN TẬP (SKILL): ${skill.name} (${skill.command})${skillDirectives.pacingSummary ? ` — ${skillDirectives.pacingSummary}` : ''}`
    : '';

  const finalDescription =
    (rawJson.description || `${cleanFinalTitle}\n\nMỐC NỘI DUNG CHÍNH:\n${timelineDesc}`) +
    (skill ? skillDescBanner : '');

  const baseTags: string[] =
    Array.isArray(rawJson.tags) && rawJson.tags.length > 0
      ? [...rawJson.tags]
      : [
          coreSubject.replace(/[^a-zA-Z0-9À-ỹ]/g, '').slice(0, 20) || 'TinNong24h',
          videoGenre === 'news-broadcast' ? 'BanTinThoiSu' : 'SynapesStudio',
          'PhanTichChuyenSau',
        ];
  if (skillDirectives.tagHint && !baseTags.includes(skillDirectives.tagHint)) {
    baseTags.unshift(skillDirectives.tagHint);
  }

  const newsTickerText =
    rawJson.newsTicker ||
    (research.headlines.length > 0
      ? research.headlines
        .slice(0, 4)
        .map((h) => `[${h.source}] ${h.title}`)
        .join('  •  ')
      : storyboard.map((s) => s.headline?.replace(/^\d+\.\s*/, '')).join('  •  '));

  onProgress?.('Hoàn tất kết xuất dự án Video! Đang mở Bàn dựng Đa phân cảnh...', 100);

  const finalResult: GeneratedScriptResult = {
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
    tags: baseTags,
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
    ...(capturedTelemetry
      ? { tokenTelemetry: capturedTelemetry }
      : {
          tokenTelemetry: {
            provider: actualProviderUsed,
            model: actualModelUsed,
            promptTokens: Math.max(120, Math.round(prompt.length / 3)),
            completionTokens: 480,
            totalTokens: Math.max(120, Math.round(prompt.length / 3)) + 480,
            keyStatus: isTurboMode ? 'turbo_local' : 'active',
            failoverTriggered: false,
            attemptedProviders: [actualProviderUsed],
          },
        }),
  };

  if (cacheKey) {
    if (SCRIPT_RESULT_CACHE.size >= 30) {
      const oldestKey = SCRIPT_RESULT_CACHE.keys().next().value;
      if (oldestKey) SCRIPT_RESULT_CACHE.delete(oldestKey);
    }
    SCRIPT_RESULT_CACHE.set(cacheKey, {
      ...finalResult,
      storyboard: finalResult.storyboard.map((sc) => ({
        ...sc,
        dialogueLines: sc.dialogueLines ? [...sc.dialogueLines] : undefined,
      })),
    });
  }

  return finalResult;
}
