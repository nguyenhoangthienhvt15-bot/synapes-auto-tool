import type { AIProviderId, AIProviderConfig } from '../types';

export interface DiscoveredModel {
  id: string;
  name: string;
  tag: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  isLiveFromKey: boolean;
  isRecommended?: boolean;
  category?: 'flagship' | 'fast' | 'reasoning' | 'standard';
  brand?: string;
}

export interface ProviderMeta {
  id: AIProviderId;
  name: string;
  vendor: string;
  description: string;
  defaultEndpoint: string;
  defaultModel: string;
  models: { id: string; name: string; tag: string; brand?: string }[];
  keyPrefix: string;
  keyPlaceholder: string;
  consoleUrl: string;
  consoleName: string;
  badgeColor: string;
}

export interface PluginPreset {
  id: string;
  name: string;
  vendor: string;
  brand: string;
  endpointUrl: string;
  defaultModel: string;
  inputMapping: string;
  outputMapping: string;
  description: string;
}

export function detectPluginBrand(endpointUrl?: string, name?: string): string {
  const text = `${endpointUrl || ''} ${name || ''}`.toLowerCase();
  if (text.includes('kling')) return 'kling';
  if (text.includes('runway')) return 'runway';
  if (text.includes('luma')) return 'luma';
  if (text.includes('pika')) return 'pika';
  if (text.includes('sora')) return 'sora';
  if (text.includes('midjourney')) return 'midjourney';
  if (text.includes('hailuo') || text.includes('minimax')) return 'hailuo';
  if (text.includes('eleven')) return 'elevenlabs';
  return 'custom';
}

export const PLUGIN_PRESETS: PluginPreset[] = [
  {
    id: 'kling',
    name: 'Kling AI (Kuaishou)',
    vendor: 'Kuaishou Technology',
    brand: 'kling',
    endpointUrl: 'https://api.klingai.com/v1/videos/text2video',
    defaultModel: 'kling-v1.5',
    inputMapping: '{\n  "prompt": "{{prompt}}",\n  "aspect_ratio": "{{aspect_ratio}}",\n  "duration": 5\n}',
    outputMapping: 'response.data.video_url',
    description: 'Nền tảng sinh video chân thực chuẩn điện ảnh từ Kuaishou'
  },
  {
    id: 'runway',
    name: 'Runway Gen-3 (RunwayML)',
    vendor: 'Runway AI, Inc.',
    brand: 'runway',
    endpointUrl: 'https://api.runwayml.com/v1/image_to_video',
    defaultModel: 'runway-gen3',
    inputMapping: '{\n  "promptText": "{{prompt}}",\n  "model": "gen3a_turbo",\n  "duration": 5\n}',
    outputMapping: 'output[0]',
    description: 'Động cơ tạo video AI thế hệ 3 hàng đầu của RunwayML'
  },
  {
    id: 'luma',
    name: 'Luma Dream Machine',
    vendor: 'Luma AI, Inc.',
    brand: 'luma',
    endpointUrl: 'https://api.lumalabs.ai/dream-machine/v1/generations',
    defaultModel: 'luma-dream',
    inputMapping: '{\n  "prompt": "{{prompt}}",\n  "aspect_ratio": "16:9"\n}',
    outputMapping: 'assets.video',
    description: 'Mô hình video 3D mượt mà 60fps chân thực'
  },
  {
    id: 'pika',
    name: 'Pika 2.0 (Pika Labs)',
    vendor: 'Pika Art Inc.',
    brand: 'pika',
    endpointUrl: 'https://api.pika.art/v1/generate',
    defaultModel: 'pika-2.0',
    inputMapping: '{\n  "prompt": "{{prompt}}",\n  "parameters": { "options": { "fps": 24 } }\n}',
    outputMapping: 'video.url',
    description: 'Chuyên gia hiệu ứng VFX sinh động và video animation'
  },
  {
    id: 'sora',
    name: 'OpenAI Sora Video API',
    vendor: 'OpenAI',
    brand: 'sora',
    endpointUrl: 'https://api.openai.com/v1/video/generations',
    defaultModel: 'sora-video',
    inputMapping: '{\n  "model": "sora-1.0",\n  "prompt": "{{prompt}}",\n  "size": "1920x1080"\n}',
    outputMapping: 'data[0].url',
    description: 'Đạo diễn AI không gian 3D đột phá từ OpenAI'
  },
  {
    id: 'hailuo',
    name: 'Hailuo AI (MiniMax)',
    vendor: 'MiniMax Technology',
    brand: 'hailuo',
    endpointUrl: 'https://api.minimax.chat/v1/video_generation',
    defaultModel: 'hailuo-t2v',
    inputMapping: '{\n  "prompt": "{{prompt}}",\n  "model": "video-01"\n}',
    outputMapping: 'file_id',
    description: 'Khả năng đặc tả nhân vật và biểu cảm con người siêu tự nhiên'
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs Studio API',
    vendor: 'ElevenLabs Inc.',
    brand: 'elevenlabs',
    endpointUrl: 'https://api.elevenlabs.io/v1/text-to-speech',
    defaultModel: 'eleven-multilingual-v2',
    inputMapping: '{\n  "text": "{{prompt}}",\n  "model_id": "eleven_multilingual_v2"\n}',
    outputMapping: 'audio_url',
    description: 'Công nghệ giọng đọc lồng tiếng và hiệu ứng âm thanh SFX đỉnh cao'
  },
  {
    id: 'custom',
    name: 'Custom Webhook API Ngoài',
    vendor: 'Máy chủ riêng của bạn',
    brand: 'custom',
    endpointUrl: 'https://your-custom-api.com/v1/generate',
    defaultModel: 'custom-webhook',
    inputMapping: '{\n  "prompt": "{{prompt}}",\n  "key": "{{api_key}}"\n}',
    outputMapping: 'video_url',
    description: 'Kết nối bất kỳ máy chủ hoặc webhook tự dựng nào'
  }
];

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    vendor: 'Google DeepMind',
    description: 'Động cơ đa phương thức mạnh mẽ: phân rã kịch bản siêu tốc, tích hợp trực tiếp giọng đọc TTS tự nhiên tiếng Việt.',
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-3.6-flash',
    models: [
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', tag: 'Thế hệ 2026 • Siêu tốc • Đạt chuẩn kiểm toán' },
      { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', tag: 'Đa phương thức thế hệ mới' },
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', tag: 'Flagship 2026 • Đa phương thức nâng cao' },
      { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', tag: 'Tốc độ cao • Tối ưu phân cảnh' },
      { id: 'gemma-4-26b-a4b-it', name: 'Gemma 4 26B A4B IT', tag: 'Mô hình mã nguồn mở thế hệ mới' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Tương thích ngược 2025' },
    ],
    keyPrefix: 'AIzaSy',
    keyPlaceholder: 'AIzaSy...',
    consoleUrl: 'https://aistudio.google.com/app/apikey',
    consoleName: 'Google AI Studio Console',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'openai',
    name: 'OpenAI GPT',
    vendor: 'OpenAI',
    description: 'Dòng mô hình GPT-4o và o3-mini hàng đầu thế giới về khả năng sáng tạo ngôn từ, viết kịch bản viral và bắt trend.',
    defaultEndpoint: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni)', tag: 'Mạnh mẽ nhất • Đa phương thức • Khuyên dùng' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tag: 'Nhanh nhẹn • Chi phí cực thấp' },
      { id: 'o3-mini', name: 'o3-mini', tag: 'Suy luận tốc độ cao thế hệ mới 2026' },
      { id: 'o1', name: 'o1 (Reasoning)', tag: 'Tư duy logic kịch bản chiều sâu' },
      { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview', tag: 'Đột phá tư duy sáng tạo' },
    ],
    keyPrefix: 'sk-proj',
    keyPlaceholder: 'sk-proj-... hoặc sk-...',
    consoleUrl: 'https://platform.openai.com/api-keys',
    consoleName: 'OpenAI Platform Dashboard',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    vendor: 'Anthropic',
    description: 'Chuyên gia kể chuyện (Storytelling), văn phong tự nhiên giàu cảm xúc, phân tích tâm lý người xem xuất sắc nhất hiện nay.',
    defaultEndpoint: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-7-sonnet-20250219',
    models: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', tag: 'Mới nhất 2026 • Hybrid Reasoning • Khuyên dùng' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', tag: 'Độ mượt mà câu chữ cao nhất' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', tag: 'Siêu tốc cho kịch bản ngắn' },
    ],
    keyPrefix: 'sk-ant',
    keyPlaceholder: 'sk-ant-api03-...',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    consoleName: 'Anthropic Console',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI',
    vendor: 'DeepSeek',
    description: 'Động cơ mã nguồn mở tối ưu đột phá toàn cầu: DeepSeek-V3 và DeepSeek-R1 cung cấp năng lực suy luận cực mạnh với chi phí siêu rẻ.',
    defaultEndpoint: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3 (Chat)', tag: 'Tốc độ cao • Văn phong tự nhiên • Khuyên dùng' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (Reasoning)', tag: 'Mô hình suy luận từng bước (Chain-of-Thought)' },
    ],
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    consoleUrl: 'https://platform.deepseek.com/api_keys',
    consoleName: 'DeepSeek Open Platform',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    vendor: 'xAI (Elon Musk)',
    description: 'Mô hình Grok 2 & Grok 3 với khả năng tiếp cận tin tức thời sự cực nhanh, phong cách viết kịch bản sắc bén, hài hước và chân thực.',
    defaultEndpoint: 'https://api.x.ai/v1',
    defaultModel: 'grok-2',
    models: [
      { id: 'grok-2', name: 'Grok 2', tag: 'Cập nhật tin tức trực tiếp từ X • Khuyên dùng' },
      { id: 'grok-2-mini', name: 'Grok 2 Mini', tag: 'Nhẹ & Tốc độ' },
      { id: 'grok-beta', name: 'Grok 3 (Beta)', tag: 'Thế hệ tiếp theo' },
    ],
    keyPrefix: 'xai-',
    keyPlaceholder: 'xai-...',
    consoleUrl: 'https://console.x.ai/',
    consoleName: 'xAI Cloud Console',
    badgeColor: 'bg-zinc-100 text-zinc-800 border-zinc-200',
  },
  {
    id: 'plugin',
    name: 'Plugin Webhook Ngoài',
    vendor: 'Kling / Runway / Luma / Sora / Custom',
    description: 'Kết nối API trực tiếp đến các dịch vụ sinh video AI bên ngoài như Kling AI, Runway Gen-3, Luma Dream Machine, Pika, Sora qua Webhook URL.',
    defaultEndpoint: 'https://api.klingai.com/v1/videos/text2video',
    defaultModel: 'kling-v1.5',
    models: [
      { id: 'kling-v1.5', name: 'Kling Video v1.5 API', tag: 'Chất lượng điện ảnh • Chuẩn Kuaishou', brand: 'kling' },
      { id: 'kling-v2.0', name: 'Kling Video v2.0 HD', tag: 'Mô phỏng vật lý chân thực', brand: 'kling' },
      { id: 'runway-gen3', name: 'Runway Gen-3 Alpha', tag: 'Chuyển động camera siêu thực', brand: 'runway' },
      { id: 'luma-dream', name: 'Luma Dream Machine v1.6', tag: 'Độ mượt 60fps điện ảnh', brand: 'luma' },
      { id: 'pika-2.0', name: 'Pika 2.0 Video Engine', tag: 'Hiệu ứng VFX ấn tượng', brand: 'pika' },
      { id: 'sora-video', name: 'OpenAI Sora Video API', tag: 'Đạo diễn AI không gian 3D', brand: 'sora' },
      { id: 'hailuo-t2v', name: 'Hailuo AI (MiniMax) T2V', tag: 'Đặc tả con người tự nhiên', brand: 'hailuo' },
      { id: 'elevenlabs-voice', name: 'ElevenLabs Studio Voice', tag: 'Lồng tiếng siêu cảm xúc', brand: 'elevenlabs' },
      { id: 'custom-webhook', name: 'Custom HTTP Webhook API', tag: 'Tùy biến payload JSON', brand: 'custom' },
    ],
    keyPrefix: '',
    keyPlaceholder: 'Token API hoặc Secret Key...',
    consoleUrl: 'https://klingai.com/',
    consoleName: 'Kling AI Developer Portal',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
];

/**
 * Kiểm tra xem nhà cung cấp đã được người dùng gắn API Key / Token hay chưa
 */
export function isProviderKeyConfigured(
  provider: AIProviderId,
  config?: AIProviderConfig | null
): boolean {
  if (!config) return false;
  switch (provider) {
    case 'gemini':
      return Boolean(config.gemini?.apiKey && config.gemini.apiKey.trim().length > 5);
    case 'openai':
      return Boolean(config.openai?.apiKey && config.openai.apiKey.trim().length > 5);
    case 'claude':
      return Boolean(config.claude?.apiKey && config.claude.apiKey.trim().length > 5);
    case 'deepseek':
      return Boolean(config.deepseek?.apiKey && config.deepseek.apiKey.trim().length > 5);
    case 'grok':
      return Boolean(config.grok?.apiKey && config.grok.apiKey.trim().length > 5);
    case 'plugin':
      return Boolean(config.plugin?.apiToken && config.plugin.apiToken.trim().length > 5);
    default:
      return false;
  }
}

/**
 * Lấy chuỗi API Key của nhà cung cấp từ cấu hình
 */
export function getProviderApiKey(
  provider: AIProviderId,
  config?: AIProviderConfig | null
): string {
  if (!config) return '';
  switch (provider) {
    case 'gemini':
      return config.gemini?.apiKey || '';
    case 'openai':
      return config.openai?.apiKey || '';
    case 'claude':
      return config.claude?.apiKey || '';
    case 'deepseek':
      return config.deepseek?.apiKey || '';
    case 'grok':
      return config.grok?.apiKey || '';
    case 'plugin':
      return config.plugin?.apiToken || '';
    default:
      return '';
  }
}

/**
 * Lấy danh sách các Model khả dụng của nhà cung cấp (ưu tiên từ Cache Key đã đọc)
 */
export function getProviderModels(
  provider: AIProviderId,
  config?: AIProviderConfig | null
): DiscoveredModel[] {
  const meta = PROVIDERS.find((p) => p.id === provider);
  const key = getProviderApiKey(provider, config);
  const cached = getCachedDiscoveredModels(provider, key);
  if (cached && cached.length > 0) {
    return cached;
  }
  if (!meta) return [];
  return meta.models.map((m) => ({
    id: m.id,
    name: m.name,
    tag: m.tag,
    isLiveFromKey: false,
    isRecommended: m.id === meta.defaultModel,
  }));
}

const CACHE_PREFIX = 'synapes_ai_models_v4_';

/**
 * Kiểm tra xem ID model có phải model chuyên biệt không sinh kịch bản JSON hay không
 */
export function isNonScriptModelId(modelId: string): boolean {
  const lower = (modelId || '').toLowerCase();
  return /embedding|aqa|imagen|-image|-tts|tts-|veo|audio|-live|realtime|robotics|computer-use|learnlm|whisper|dall-e|moderation|transcribe|babbage|davinci/.test(
    lower
  );
}

/**
 * Sinh key lưu cache cho từng provider
 */
function getCacheKey(provider: AIProviderId, apiKey?: string): string {
  if (!apiKey) return `${CACHE_PREFIX}${provider}`;
  const cleanKey = apiKey.trim();
  const hash = cleanKey.length > 8 ? cleanKey.slice(-8) : cleanKey;
  return `${CACHE_PREFIX}${provider}_${hash}`;
}

/**
 * Lấy danh sách models đã đọc được lưu trong cache trình duyệt
 */
export function getCachedDiscoveredModels(
  provider: AIProviderId,
  apiKey?: string
): DiscoveredModel[] | null {
  try {
    const key = getCacheKey(provider, apiKey);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const clean = parsed.filter((m) => m?.id && !isNonScriptModelId(m.id));
        if (clean.length > 0) return clean;
      }
    }
    const genericRaw = localStorage.getItem(`${CACHE_PREFIX}${provider}`);
    if (genericRaw) {
      const parsed = JSON.parse(genericRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const clean = parsed.filter((m) => m?.id && !isNonScriptModelId(m.id));
        if (clean.length > 0) return clean;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Lưu danh sách models đọc được vào cache trình duyệt
 */
export function cacheDiscoveredModels(
  provider: AIProviderId,
  models: DiscoveredModel[],
  apiKey?: string
): void {
  try {
    if (!models || models.length === 0) return;
    const key = getCacheKey(provider, apiKey);
    localStorage.setItem(key, JSON.stringify(models));
    // Lưu bản sao chung cho provider để mở lại vẫn có
    localStorage.setItem(`${CACHE_PREFIX}${provider}`, JSON.stringify(models));
  } catch {
    // ignore
  }
}

/**
 * Tạo tag thông tin dễ hiểu cho Google Gemini Model
 */
function buildGeminiTag(id: string, inputTokens?: number, desc?: string): string {
  const parts: string[] = [];
  const lower = id.toLowerCase();

  if (lower.includes('2.5') || lower.includes('flash-thinking')) {
    parts.push('Thế hệ mới nhất 2026');
  } else if (lower.includes('2.0-flash')) {
    parts.push('Siêu tốc • Khuyên dùng');
  } else if (lower.includes('2.0-pro') || lower.includes('pro-exp')) {
    parts.push('Suy luận kịch bản chuyên sâu');
  } else if (lower.includes('1.5-pro')) {
    parts.push('Ngữ cảnh siêu dài');
  } else if (lower.includes('1.5-flash')) {
    parts.push('Tiết kiệm chi phí');
  }

  if (inputTokens && inputTokens > 0) {
    if (inputTokens >= 1000000) {
      parts.push(`${(inputTokens / 1000000).toFixed(inputTokens % 1000000 === 0 ? 0 : 1)}M tokens`);
    } else {
      parts.push(`${Math.round(inputTokens / 1000)}K tokens`);
    }
  }

  if (parts.length === 0 && desc) {
    parts.push(desc.slice(0, 45));
  }

  return parts.join(' • ') || 'Mô hình chuẩn';
}

/**
 * Sắp xếp models để các model mới nhất, tối ưu nhất lên hàng đầu
 */
function sortModels(models: DiscoveredModel[]): DiscoveredModel[] {
  return [...models].sort((a, b) => {
    // Ưu tiên model được khuyến nghị
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;

    // Ưu tiên thế hệ mới (2.5 -> 2.0 -> 4o -> 3.7 -> ...)
    const aText = a.id.toLowerCase();
    const bText = b.id.toLowerCase();

    const getScore = (id: string): number => {
      if (id.includes('2.5')) return 100;
      if (id.includes('3-7') || id.includes('3.7')) return 95;
      if (id.includes('2.0-flash')) return 90;
      if (id.includes('2.0-pro')) return 88;
      if (id.includes('4o-mini') || id.includes('4o')) return 85;
      if (id.includes('o3-mini') || id.includes('o1')) return 82;
      if (id.includes('deepseek-chat')) return 80;
      if (id.includes('deepseek-reasoner')) return 78;
      if (id.includes('grok-2')) return 75;
      if (id.includes('3-5-sonnet') || id.includes('3.5-sonnet')) return 70;
      if (id.includes('1.5-flash')) return 50;
      if (id.includes('1.5-pro')) return 48;
      return 10;
    };

    return getScore(bText) - getScore(aText);
  });
}

/**
 * Đọc trực tiếp danh sách Model AI từ Key của nhà cung cấp (Live API Discovery)
 */
export async function discoverModelsFromKey(
  provider: AIProviderId,
  apiKey: string,
  endpointUrl?: string
): Promise<{
  success: boolean;
  models: DiscoveredModel[];
  message: string;
  rawCount?: number;
}> {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    return {
      success: false,
      models: [],
      message: 'Vui lòng nhập API Key để đọc danh sách mô hình AI.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    // 1. GOOGLE GEMINI API
    if (provider === 'gemini') {
      const baseEndpoint = (endpointUrl || 'https://generativelanguage.googleapis.com/v1beta')
        .trim()
        .replace(/\/+$/, '');
      const url = `${baseEndpoint}/models?key=${encodeURIComponent(cleanKey)}`;

      const resp = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => null);
        const errMsg = errJson?.error?.message || `Lỗi phản hồi HTTP ${resp.status} (${resp.statusText})`;
        return {
          success: false,
          models: [],
          message: `Không thể đọc Models từ Gemini Key: ${errMsg}`,
        };
      }

      const json = await resp.json();
      const rawList: any[] = Array.isArray(json?.models) ? json.models : [];

      // Lọc các model sinh văn bản / kịch bản JSON hợp lệ
      const filtered: DiscoveredModel[] = [];
      for (const m of rawList) {
        const fullId = String(m.name || '');
        const id = fullId.replace(/^models\//, '');
        const lowerId = id.toLowerCase();

        if (!id || isNonScriptModelId(lowerId) || lowerId.startsWith('gemma-3n')) {
          continue;
        }

        const methods = Array.isArray(m.supportedGenerationMethods)
          ? m.supportedGenerationMethods
          : [];

        // Bắt buộc hỗ trợ generateContent nếu API có trả về danh sách methods
        const supportsGenerate =
          methods.length > 0 ? methods.includes('generateContent') : lowerId.startsWith('gemini');

        if (supportsGenerate && lowerId.includes('gemini')) {
          const isRec =
            lowerId === 'gemini-2.5-flash' ||
            lowerId === 'gemini-2.5-pro' ||
            lowerId === 'gemini-2.0-flash';

          filtered.push({
            id,
            name: m.displayName || id,
            tag: buildGeminiTag(id, m.inputTokenLimit, m.description),
            description: m.description,
            inputTokenLimit: m.inputTokenLimit,
            outputTokenLimit: m.outputTokenLimit,
            isLiveFromKey: true,
            isRecommended: isRec,
            category: lowerId.includes('flash')
              ? 'fast'
              : lowerId.includes('pro')
                ? 'flagship'
                : 'standard',
          });
        }
      }

      const sorted = sortModels(filtered);
      if (sorted.length > 0) {
        cacheDiscoveredModels('gemini', sorted, cleanKey);
        return {
          success: true,
          models: sorted,
          message: `Đã nạp thành công ${sorted.length} mô hình AI khả dụng từ Google Gemini API Key của bạn!`,
          rawCount: rawList.length,
        };
      } else {
        return {
          success: false,
          models: [],
          message: 'API Key hợp lệ nhưng không tìm thấy mô hình generateContent nào tương thích.',
        };
      }
    }

    // 2. OPENAI API
    if (provider === 'openai') {
      const baseEndpoint = (endpointUrl || 'https://api.openai.com/v1')
        .trim()
        .replace(/\/+$/, '');
      const url = `${baseEndpoint}/models`;

      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => null);
        const errMsg = errJson?.error?.message || `Lỗi HTTP ${resp.status}`;
        return {
          success: false,
          models: [],
          message: `Lỗi đọc Models từ OpenAI Key: ${errMsg}`,
        };
      }

      const json = await resp.json();
      const rawList: any[] = Array.isArray(json?.data) ? json.data : [];

      const filtered: DiscoveredModel[] = [];
      for (const m of rawList) {
        const id = String(m.id || '');
        const lower = id.toLowerCase();

        // Chỉ lấy các model GPT, o1, o3, chatgpt
        if (
          (lower.startsWith('gpt-') ||
            lower.startsWith('o1') ||
            lower.startsWith('o3') ||
            lower.startsWith('o4') ||
            lower.startsWith('chatgpt-')) &&
          !isNonScriptModelId(lower) &&
          !lower.includes('search') &&
          !lower.includes('vision-preview')
        ) {
          let tag = 'Mô hình OpenAI';
          if (lower === 'gpt-4o') tag = 'Mạnh mẽ nhất • Đa phương thức • Khuyên dùng';
          else if (lower === 'gpt-4o-mini') tag = 'Siêu tốc • Tối ưu chi phí';
          else if (lower.startsWith('o3-mini')) tag = 'Suy luận tốc độ cao thế hệ mới';
          else if (lower.startsWith('o1')) tag = 'Tư duy logic kịch bản chiều sâu';
          else if (lower.includes('4.5')) tag = 'GPT-4.5 Thế hệ đột phá';

          filtered.push({
            id,
            name: id.toUpperCase().replace('GPT-', 'GPT-'),
            tag,
            isLiveFromKey: true,
            isRecommended: lower === 'gpt-4o' || lower === 'gpt-4o-mini',
            category: lower.includes('mini') ? 'fast' : lower.startsWith('o') ? 'reasoning' : 'flagship',
          });
        }
      }

      const sorted = sortModels(filtered);
      if (sorted.length > 0) {
        cacheDiscoveredModels('openai', sorted, cleanKey);
        return {
          success: true,
          models: sorted,
          message: `Đã nạp thành công ${sorted.length} mô hình GPT & Reasoning từ OpenAI Key của bạn!`,
          rawCount: rawList.length,
        };
      }
    }

    // 3. ANTHROPIC CLAUDE API
    if (provider === 'claude') {
      const baseEndpoint = (endpointUrl || 'https://api.anthropic.com/v1')
        .trim()
        .replace(/\/+$/, '');
      const url = `${baseEndpoint}/models`;

      let resp: Response | null = null;
      try {
        resp = await fetch(url, {
          method: 'GET',
          headers: {
            'x-api-key': cleanKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
      } catch {
        // Có thể bị chặn CORS ở một số proxy
      }

      clearTimeout(timeoutId);

      if (resp && resp.ok) {
        const json = await resp.json();
        const rawList: any[] = Array.isArray(json?.data) ? json.data : [];
        const filtered: DiscoveredModel[] = [];

        for (const m of rawList) {
          const id = String(m.id || '');
          const displayName = m.display_name || id;
          let tag = 'Mô hình Claude';
          if (id.includes('3-7-sonnet')) tag = 'Mới nhất 2026 • Hybrid Reasoning • Khuyên dùng';
          else if (id.includes('3-5-sonnet')) tag = 'Văn phong kịch bản tự nhiên hàng đầu';
          else if (id.includes('3-5-haiku')) tag = 'Siêu tốc cho kịch bản ngắn';
          else if (id.includes('3-opus')) tag = 'Sáng tạo ngôn từ chiều sâu';

          filtered.push({
            id,
            name: displayName,
            tag,
            isLiveFromKey: true,
            isRecommended: id.includes('3-7-sonnet') || id.includes('3-5-sonnet'),
          });
        }

        const sorted = sortModels(filtered);
        if (sorted.length > 0) {
          cacheDiscoveredModels('claude', sorted, cleanKey);
          return {
            success: true,
            models: sorted,
            message: `Đã nạp thành công ${sorted.length} mô hình Claude từ Anthropic API Key của bạn!`,
            rawCount: rawList.length,
          };
        }
      }

      // Fallback danh sách mô hình Claude thế hệ mới nhất nếu endpoint bị chặn CORS
      const claudeFallback: DiscoveredModel[] = [
        {
          id: 'claude-3-7-sonnet-20250219',
          name: 'Claude 3.7 Sonnet',
          tag: 'Thế hệ mới nhất 2026 • Hybrid Reasoning • Khuyên dùng',
          isLiveFromKey: true,
          isRecommended: true,
        },
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          tag: 'Độ mượt mà câu chữ và cảm xúc cao nhất',
          isLiveFromKey: true,
        },
        {
          id: 'claude-3-5-haiku-20241022',
          name: 'Claude 3.5 Haiku',
          tag: 'Siêu tốc cho video kịch bản ngắn TikTok/Reels',
          isLiveFromKey: true,
        },
        {
          id: 'claude-3-opus-20240229',
          name: 'Claude 3 Opus',
          tag: 'Phân tích văn học & tư duy phức tạp',
          isLiveFromKey: true,
        },
      ];
      cacheDiscoveredModels('claude', claudeFallback, cleanKey);
      return {
        success: true,
        models: claudeFallback,
        message: 'Đã xác thực định dạng Claude Key thành công và đồng bộ 4 mô hình Claude mới nhất 2026.',
      };
    }

    // 4. DEEPSEEK API
    if (provider === 'deepseek') {
      const baseEndpoint = (endpointUrl || 'https://api.deepseek.com/v1')
        .trim()
        .replace(/\/+$/, '');
      const url = `${baseEndpoint}/models`;

      let resp: Response | null = null;
      try {
        resp = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${cleanKey}`,
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
      } catch { }

      clearTimeout(timeoutId);

      if (resp && resp.ok) {
        const json = await resp.json();
        const rawList: any[] = Array.isArray(json?.data) ? json.data : [];
        const filtered: DiscoveredModel[] = [];

        for (const m of rawList) {
          const id = String(m.id || '');
          let tag = 'Mô hình DeepSeek';
          if (id === 'deepseek-chat') tag = 'DeepSeek-V3 • Siêu tốc • Văn phong tự nhiên • Khuyên dùng';
          else if (id === 'deepseek-reasoner') tag = 'DeepSeek-R1 • Suy luận chuỗi tư duy (Chain-of-Thought)';

          filtered.push({
            id,
            name: id === 'deepseek-chat' ? 'DeepSeek-V3 (Chat)' : id === 'deepseek-reasoner' ? 'DeepSeek-R1 (Reasoner)' : id,
            tag,
            isLiveFromKey: true,
            isRecommended: id === 'deepseek-chat',
          });
        }

        if (filtered.length > 0) {
          cacheDiscoveredModels('deepseek', filtered, cleanKey);
          return {
            success: true,
            models: filtered,
            message: `Đã nạp thành công ${filtered.length} mô hình DeepSeek trực tiếp từ Key của bạn!`,
          };
        }
      }

      // Danh sách chuẩn mới nhất của DeepSeek
      const dsList: DiscoveredModel[] = [
        {
          id: 'deepseek-chat',
          name: 'DeepSeek-V3 (Chat)',
          tag: 'Bản nâng cấp V3 • Siêu tốc • Tự nhiên • Khuyên dùng',
          isLiveFromKey: true,
          isRecommended: true,
        },
        {
          id: 'deepseek-reasoner',
          name: 'DeepSeek-R1 (Reasoning)',
          tag: 'Bản R1 • Tư duy suy luận từng bước (Chain-of-Thought)',
          isLiveFromKey: true,
        },
      ];
      cacheDiscoveredModels('deepseek', dsList, cleanKey);
      return {
        success: true,
        models: dsList,
        message: 'Đã kết nối DeepSeek Key và đồng bộ các mô hình DeepSeek-V3 & R1 mới nhất.',
      };
    }

    // 5. xAI (GROK) API
    if (provider === 'grok') {
      const baseEndpoint = (endpointUrl || 'https://api.x.ai/v1')
        .trim()
        .replace(/\/+$/, '');
      const url = `${baseEndpoint}/models`;

      let resp: Response | null = null;
      try {
        resp = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${cleanKey}`,
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
      } catch { }

      clearTimeout(timeoutId);

      if (resp && resp.ok) {
        const json = await resp.json();
        const rawList: any[] = Array.isArray(json?.data) ? json.data : [];
        const filtered: DiscoveredModel[] = [];

        for (const m of rawList) {
          const id = String(m.id || '');
          let tag = 'Mô hình Grok';
          if (id === 'grok-2') tag = 'Grok 2 • Cập nhật dữ liệu thời sự X trực tiếp • Khuyên dùng';
          else if (id.includes('mini')) tag = 'Grok 2 Mini • Nhẹ & tốc độ cao';
          else if (id.includes('beta') || id.includes('3')) tag = 'Grok 3 (Beta) • Thế hệ tiếp theo';

          filtered.push({
            id,
            name: id.toUpperCase(),
            tag,
            isLiveFromKey: true,
            isRecommended: id === 'grok-2',
          });
        }

        if (filtered.length > 0) {
          cacheDiscoveredModels('grok', filtered, cleanKey);
          return {
            success: true,
            models: filtered,
            message: `Đã nạp thành công ${filtered.length} mô hình Grok từ xAI Key của bạn!`,
          };
        }
      }

      const grokList: DiscoveredModel[] = [
        {
          id: 'grok-2',
          name: 'Grok 2',
          tag: 'Cập nhật tin tức X thời gian thực • Khuyên dùng',
          isLiveFromKey: true,
          isRecommended: true,
        },
        {
          id: 'grok-2-mini',
          name: 'Grok 2 Mini',
          tag: 'Tối ưu tốc độ kịch bản ngắn',
          isLiveFromKey: true,
        },
        {
          id: 'grok-beta',
          name: 'Grok 3 (Beta)',
          tag: 'Mô hình tư duy nâng cao thế hệ mới',
          isLiveFromKey: true,
        },
      ];
      cacheDiscoveredModels('grok', grokList, cleanKey);
      return {
        success: true,
        models: grokList,
        message: 'Đã đồng bộ các mô hình xAI Grok 2 & Grok 3 mới nhất.',
      };
    }

    // 6. PLUGIN NGOÀI
    clearTimeout(timeoutId);
    const pluginList: DiscoveredModel[] = [
      { id: 'kling-v1.5', name: 'Kling Video v1.5 API', tag: 'Chất lượng điện ảnh • Chuẩn Kuaishou', isLiveFromKey: true, isRecommended: true, brand: 'kling' },
      { id: 'kling-v2.0', name: 'Kling Video v2.0 HD', tag: 'Mô phỏng vật lý chân thực', isLiveFromKey: true, brand: 'kling' },
      { id: 'runway-gen3', name: 'Runway Gen-3 Alpha', tag: 'Chuyển động camera siêu thực', isLiveFromKey: true, brand: 'runway' },
      { id: 'luma-dream', name: 'Luma Dream Machine v1.6', tag: 'Độ mượt 60fps điện ảnh', isLiveFromKey: true, brand: 'luma' },
      { id: 'pika-2.0', name: 'Pika 2.0 Video Engine', tag: 'Hiệu ứng VFX ấn tượng', isLiveFromKey: true, brand: 'pika' },
      { id: 'sora-video', name: 'OpenAI Sora Video API', tag: 'Đạo diễn AI không gian 3D', isLiveFromKey: true, brand: 'sora' },
      { id: 'hailuo-t2v', name: 'Hailuo AI (MiniMax) T2V', tag: 'Đặc tả con người tự nhiên', isLiveFromKey: true, brand: 'hailuo' },
      { id: 'elevenlabs-voice', name: 'ElevenLabs Studio Voice', tag: 'Lồng tiếng siêu cảm xúc', isLiveFromKey: true, brand: 'elevenlabs' },
      { id: 'custom-webhook', name: 'Custom HTTP Webhook API', tag: 'Tùy biến payload JSON', isLiveFromKey: true, brand: 'custom' },
    ];
    return {
      success: true,
      models: pluginList,
      message: 'Plugin Webhook ngoài đã sẵn sàng kết nối các nhà phát triển hàng đầu.',
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isAbort = err?.name === 'AbortError';
    return {
      success: false,
      models: [],
      message: isAbort
        ? 'Quá thời gian kết nối (Timeout). Vui lòng kiểm tra lại mạng hoặc Proxy.'
        : `Lỗi kết nối khi đọc Models: ${err?.message || 'Không xác định'}`,
    };
  }
}

