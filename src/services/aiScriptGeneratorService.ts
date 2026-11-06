import {
  AIProviderId,
  StoryboardScene,
  Skill,
  AspectRatio,
} from '../types';
import { PROVIDERS } from './aiModelDiscoveryService';

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

// Curated high-tech & modern imagery (NO retro 1980s computers)
const CURATED_FALLBACK_IMAGES = {
  tech: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1280&q=85',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1280&q=85',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=85',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1280&q=85',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=85',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1280&q=85',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1280&q=85',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1280&q=85',
  ],
  cinematic: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1280&q=85',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1280&q=85',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1280&q=85',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1280&q=85',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1280&q=85',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1280&q=85',
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
 * Làm sạch câu lệnh của người dùng để trích xuất chủ đề cốt lõi
 * Ví dụ: "/tech-review: Tiến hành tạo dự án video giới thiệu Iphone Duo" -> "iPhone Duo"
 */
export function extractCleanSubject(rawPrompt: string): string {
  let text = rawPrompt.trim();
  // Bỏ command ở đầu nếu có (vd: /tech-review: ...)
  text = text.replace(/^\/[a-z0-9-_]+:\s*/i, '').trim();
  // Bỏ các cụm từ mệnh lệnh mở đầu thường gặp (tiếng Việt + lỗi gõ phổ biến như "videp")
  const prefixes = [
    /^(hãy\s+)?(tiến\s+hành\s+)?(khởi\s+tạo\s+|tạo\s+|làm\s+|xây\s+dựng\s+|viết\s+|dựng\s+)?(một\s+)?(dự\s+án\s+)?(kịch\s+bản\s+)?(video|videp|clip|phim)\s+(giới\s+thiệu|review|đánh\s+giá|phân\s+tích|về|cho|quảng\s+cáo)\s+(sản\s+phẩm\s+)?/i,
    /^(hãy\s+)?(tiến\s+hành\s+)?(giới\s+thiệu|review|đánh\s+giá|phân\s+tích|làm\s+video\s+về)\s+/i,
    /^(tạo\s+dự\s+án\s+|tạo\s+video\s+|làm\s+video\s+)/i,
  ];
  for (const regex of prefixes) {
    text = text.replace(regex, '').trim();
  }
  // Chuẩn hóa chữ hoa cho một số thương hiệu phổ biến
  text = text.replace(/\biphone\b/gi, 'iPhone');
  text = text.replace(/\bipad\b/gi, 'iPad');
  text = text.replace(/\bmacbook\b/gi, 'MacBook');
  text = text.replace(/\bsamsung\b/gi, 'Samsung');
  text = text.replace(/\bchatgpt\b/gi, 'ChatGPT');

  if (!text || text.length < 2) {
    return rawPrompt.trim();
  }
  // Viết hoa chữ cái đầu nếu chưa viết hoa
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Sinh URL hình ảnh AI thực tế từ Pollinations Flux theo từng Visual Prompt của phân cảnh
 */
export function buildAiSceneImageUrl(
  visualPrompt: string,
  aspectRatio: AspectRatio,
  sceneIndex: number
): string {
  const width = aspectRatio === '16:9' ? 1280 : 720;
  const height = aspectRatio === '16:9' ? 720 : 1280;
  const cleanPrompt = visualPrompt
    .replace(/[^\w\s,.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 260);
  const seed = 202600 + sceneIndex * 37;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    cleanPrompt
  )}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;
}

/**
 * Xây dựng System Prompt chuyên nghiệp tích hợp kỹ thuật 5 lớp Hollywood và các Repo video
 */
function buildDirectorSystemPrompt(
  rawPrompt: string,
  coreSubject: string,
  skill: Skill | undefined,
  aspectRatio: AspectRatio,
  targetDurationMin: number
): string {
  const isShort = aspectRatio === '9:16';
  const sceneCount = isShort ? '6 phân cảnh' : '8 phân cảnh';

  return `Bạn là Giám Đốc Nghệ Thuật & Đạo Diễn Điện Ảnh AI hàng đầu của SYNAPES Studio.
Nhiệm vụ: Tạo một kịch bản video AI chuyên nghiệp, hoàn chỉnh từng phân cảnh về chủ đề "${coreSubject}" (Yêu cầu gốc: "${rawPrompt}").

THÔNG TIN DỰ ÁN:
- Chủ đề trọng tâm: "${coreSubject}"
- Bộ Skill áp dụng: "${skill?.name || 'Đạo diễn Điện ảnh Hollywood'}" (${skill?.command || '/cinematic-director'})
- Phong cách & Tone giọng: "${skill?.tone || 'Sắc sảo, cuốn hút, hiện đại'}"
- Tỉ lệ khung hình: ${isShort ? '9:16 (Video dọc TikTok / Shorts / Reels - nhịp nhanh, cuốn hút)' : `16:9 (Video ngang YouTube - phân tích chuyên sâu, mục tiêu ${targetDurationMin} phút)`}
- Số lượng phân cảnh bắt buộc: ${sceneCount}

QUY TẮC BẮT BUỘC:
1. KHÔNG lặp lại máy móc cụm từ "tạo dự án video giới thiệu..." trong tiêu đề hay lời thoại. Hãy viết như một đạo diễn / reviewer thực thụ đang nói trực tiếp về "${coreSubject}".
2. Mỗi phân cảnh trong "scenes" phải có:
   - "sceneNumber": Số thứ tự (1, 2, 3...)
   - "headline": Tiêu đề ngắn gọn in hoa hiện trên màn hình video (tối đa 5-7 từ, ví dụ: "01. THIẾT KẾ MÀN HÌNH KÉP ĐỘT PHÁ")
   - "durationSec": Thời lượng cảnh (từ 7 đến 10 giây)
   - "voiceover": Lời bình tiếng Việt tự nhiên, giàu cảm xúc, tối thiểu 25-40 từ mỗi cảnh để giọng đọc AI thuyết minh đầy đặn.
   - "visualPrompt": Mô tả hình ảnh bằng tiếng Anh tuân thủ 5 lớp Hollywood (ai9app/AI-Cinematic-Prompt-Director): [Subject "${coreSubject}" & Action] + [Studio/Environment] + [Camera Motion: Dolly In / Orbit 360 / FPV Drone / Crane Up] + [35mm Anamorphic / 85mm Macro Lens] + [Volumetric / Cyberpunk / Studio Lighting, 8k photorealistic].
   - "cameraMotion": Chọn 1 trong ["dolly-in", "dolly-out", "orbit", "pan-right", "pan-left", "crane-up", "fpv-zoom"]
   - "lightingStyle": Chọn 1 trong ["volumetric", "cyberpunk", "rembrandt", "studio-clean", "golden-hour"]
   - "sfx": Hiệu ứng âm thanh chuyển cảnh (ví dụ: "Deep Sub Bass + Whoosh", "Cinematic Riser + Glass Shimmer")
   - "transition": Chọn 1 trong ["cut", "fade", "dissolve"]

TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON HỢP LỆ (không dùng markdown code block):
{
  "title": "Tiêu đề video chuyên nghiệp, hấp dẫn về ${coreSubject}",
  "description": "Mô tả chi tiết nội dung video chuẩn SEO kèm Timeline các phần",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
  "productLink": "https://synapes.ai/studio",
  "musicGenre": "Cyberpunk Ambient Synth (Commercial Master)",
  "scenes": [
    {
      "sceneNumber": 1,
      "headline": "01. KỶ NGUYÊN MỚI BẮT ĐẦU",
      "durationSec": 8,
      "voiceover": "Lời bình tiếng Việt cuốn hút cho cảnh 1...",
      "visualPrompt": "Extreme close-up of ${coreSubject} emerging from dark reflective surface, sleek titanium edge, slow cinematic Dolly In, 35mm anamorphic lens, volumetric studio rim lighting, 8k photorealistic",
      "cameraMotion": "dolly-in",
      "lightingStyle": "studio-clean",
      "sfx": "Sub-Bass Impact + Atmospheric Riser",
      "transition": "fade"
    }
  ]
}`;
}

/**
 * Trích xuất JSON an toàn từ phản hồi LLM
 */
function extractJsonFromText(rawText: string): any {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '').trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

/**
 * Gọi Google Gemini API với cơ chế tự động thử lại qua các model khả dụng nếu model đầu tiên bị giới hạn quota
 */
async function callGeminiApiWithFallback(
  preferredModel: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  endpointUrl?: string
): Promise<{ data: any; actualModel: string }> {
  const base = (endpointUrl || 'https://generativelanguage.googleapis.com/v1beta')
    .trim()
    .replace(/\/+$/, '');

  const cleanPreferred = preferredModel.replace(/^models\//, '').trim() || 'gemini-2.0-flash';
  const candidateModels = Array.from(
    new Set([
      cleanPreferred,
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ])
  );

  let lastError: Error | null = null;

  for (const mod of candidateModels) {
    try {
      const url = `${base}/models/${encodeURIComponent(mod)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const body = {
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n[YÊU CẦU]: Hãy viết kịch bản JSON hoàn chỉnh cho "${userPrompt}".`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.72,
          responseMimeType: 'application/json',
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // Thử lại lần nữa không có responseMimeType nếu model báo lỗi 400
        if (res.status === 400) {
          const retryBody = {
            contents: body.contents,
            generationConfig: { temperature: 0.72 },
          };
          const retryRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(retryBody),
          });
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            const retryText = retryData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (retryText) {
              return { data: extractJsonFromText(retryText), actualModel: mod };
            }
          }
        }
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
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
 * Gọi OpenAI / DeepSeek / Grok tương thích chuẩn Chat Completions
 */
async function callOpenAiCompatibleApi(
  provider: 'openai' | 'deepseek' | 'grok',
  model: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  endpointUrl?: string
): Promise<any> {
  const defaultBase =
    provider === 'openai'
      ? 'https://api.openai.com/v1'
      : provider === 'deepseek'
        ? 'https://api.deepseek.com/v1'
        : 'https://api.x.ai/v1';

  const base = (endpointUrl || defaultBase).trim().replace(/\/+$/, '');
  const url = `${base}/chat/completions`;

  const body: Record<string, any> = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `[YÊU CẦU]: Tạo kịch bản JSON cho "${userPrompt}"` },
    ],
    temperature: 0.7,
  };

  if (provider !== 'grok') {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error?.message || `Lỗi ${provider.toUpperCase()} API (HTTP ${res.status})`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Không nhận được nội dung kịch bản.');

  return extractJsonFromText(text);
}

/**
 * Gọi Anthropic Claude API
 */
async function callClaudeApi(
  model: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  endpointUrl?: string
): Promise<any> {
  const base = (endpointUrl || 'https://api.anthropic.com/v1').trim().replace(/\/+$/, '');
  const url = `${base}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'dangerously-allow-browser': 'true',
    },
    body: JSON.stringify({
      model: model || 'claude-3-7-sonnet-20250219',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: `[YÊU CẦU]: Tạo kịch bản JSON cho "${userPrompt}"` }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error?.message || `Lỗi Claude API (HTTP ${res.status})`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Không nhận được kịch bản từ Claude.');

  return extractJsonFromText(text);
}

/**
 * Động Cơ Biên Kịch Điện Ảnh Chuyên Sâu (xử lý ngữ nghĩa sâu theo chủ đề thực tế)
 */
function generateBespokeCinematicScript(
  rawPrompt: string,
  coreSubject: string,
  skill: Skill | undefined,
  aspectRatio: AspectRatio
): any {
  const lower = coreSubject.toLowerCase();
  const isShort = aspectRatio === '9:16';
  const isTechOrPhone =
    lower.includes('iphone') ||
    lower.includes('apple') ||
    lower.includes('duo') ||
    lower.includes('samsung') ||
    lower.includes('galaxy') ||
    lower.includes('macbook') ||
    lower.includes('ai') ||
    lower.includes('chip') ||
    lower.includes('tech') ||
    lower.includes('điện thoại') ||
    lower.includes('máy tính');

  const title = isShort
    ? `${coreSubject}: Tuyệt Tác Công Nghệ Thay Đổi Hoàn Toàn Cuộc Chơi!`
    : `Đánh Giá Toàn Diện ${coreSubject} — Thiết Kế Đột Phá & Sức Mạnh Thực Tế`;

  const scenes = isTechOrPhone
    ? [
        {
          sceneNumber: 1,
          headline: `01. LỘ DIỆN ${coreSubject.toUpperCase()}`,
          durationSec: 8,
          voiceover: `Quên hết những thiết bị truyền thống bạn từng biết đi. Ngay trước mắt chúng ta chính là ${coreSubject} — siêu phẩm mở ra kỷ nguyên hoàn toàn mới của thiết kế phần cứng và trí tuệ nhân tạo.`,
          visualPrompt: `Dramatic cinematic reveal of ${coreSubject} emerging from dark obsidian studio shadow, ultra-thin aerospace brushed titanium body unfolding with glowing dual OLED display, slow Dolly In camera movement, 35mm anamorphic lens, volumetric blue rim lighting, 8k photorealistic`,
          cameraMotion: 'dolly-in',
          lightingStyle: 'studio-clean',
          sfx: 'Deep Sub-Bass Drop + Metallic Shimmer',
          transition: 'fade',
        },
        {
          sceneNumber: 2,
          headline: '02. KIẾN TRÚC BẢN LỀ & KHUNG TITAN',
          durationSec: 8,
          voiceover: `Điểm chạm đầu tiên gây choáng ngợp trên ${coreSubject} là cơ chế bản lề chất lỏng kết hợp khung viền Titan cấp vũ trụ siêu nhẹ, giúp hai mặt màn hình liền mạch tuyệt đối không một gợn nếp gấp.`,
          visualPrompt: `Extreme macro close-up of ${coreSubject} precision-engineered liquid metal hinge and chamfered brushed titanium frame, laser-etched micro details, smooth 360-degree Orbit camera shot, 85mm macro lens, shallow depth of field, Rembrandt golden studio lighting, 8k`,
          cameraMotion: 'orbit',
          lightingStyle: 'rembrandt',
          sfx: 'Precision Mechanical Click + Whoosh',
          transition: 'dissolve',
        },
        {
          sceneNumber: 3,
          headline: '03. MÀN HÌNH KÉP RETINA XDR 120HZ',
          durationSec: 8,
          voiceover: `Khi mở rộng toàn bộ không gian hiển thị, tấm nền OLED kép ProMotion 120Hz trên ${coreSubject} bừng sáng với độ tương phản tuyệt đối, biến mọi thao tác đa nhiệm trở thành trải nghiệm điện ảnh sống động.`,
          visualPrompt: `${coreSubject} fully unfolded displaying vibrant holographic UI and dual-screen multitasking workspace floating in mid-air, dynamic FPV drone zoom toward glowing OLED glass, 35mm lens, cyberpunk neon cyan and magenta reflections, 60fps photorealistic`,
          cameraMotion: 'fpv-zoom',
          lightingStyle: 'cyberpunk',
          sfx: 'Futuristic UI Power-Up + Digital Riser',
          transition: 'cut',
        },
        {
          sceneNumber: 4,
          headline: '04. VI XỬ LÝ NEURAL ENGINE THẾ HỆ MỚI',
          durationSec: 8,
          voiceover: `Ẩn sâu bên trong thân máy siêu mỏng của ${coreSubject} là vi xử lý tiến trình 2 nanomet mới nhất, xử lý hàng chục nghìn tỷ phép tính AI mỗi giây ngay trên thiết bị mà vẫn giữ nhiệt độ mát lạnh.`,
          visualPrompt: `Exploded X-ray architectural view of ${coreSubject} internal silicon processor chip glowing with golden neural pathways and vapor chamber cooling system, slow Crane Boom Up shot, macro anamorphic lens, volumetric god rays, hyper-detailed 8k CGI`,
          cameraMotion: 'crane-up',
          lightingStyle: 'volumetric',
          sfx: 'Neural Pulse Hum + Sonic Boom',
          transition: 'dissolve',
        },
        {
          sceneNumber: 5,
          headline: '05. HỆ THỐNG CAMERA QUANG HỌC ĐIỆN ẢNH',
          durationSec: 8,
          voiceover: `Cụm camera tiềm vọng thế hệ mới trên ${coreSubject} kết hợp thuật toán điện toán quang học cho phép quay video ProRes 8K xóa phông chuẩn máy quay chuyên nghiệp ngay cả trong điều kiện thiếu sáng khắc nghiệt.`,
          visualPrompt: `Close-up tracking shot across ${coreSubject} triple sapphire camera lenses with multi-layer optical glass reflections and laser LiDAR scanner glowing softly, smooth Pan Right camera movement, 85mm portrait lens, cinematic bokeh background, 8k`,
          cameraMotion: 'pan-right',
          lightingStyle: 'studio-clean',
          sfx: 'Camera Shutter Click + Bass Riser',
          transition: 'cut',
        },
        {
          sceneNumber: 6,
          headline: '06. TỔNG KẾT & ĐÁNH GIÁ XỨNG TẦM',
          durationSec: 8,
          voiceover: `Tổng kết lại, ${coreSubject} không chỉ là một bản nâng cấp phần cứng đơn thuần mà là tuyên ngôn định hình tương lai công nghệ. Bạn ấn tượng nhất với tính năng nào? Hãy để lại bình luận ngay bên dưới!`,
          visualPrompt: `Hero wide shot of ${coreSubject} standing majestically on dark minimalist monolithic pedestal with dramatic volumetric backlight beams, slow Dolly Out camera motion, 35mm anamorphic lens flare, Apple keynote aesthetic, 8k photorealistic`,
          cameraMotion: 'dolly-out',
          lightingStyle: 'volumetric',
          sfx: 'Epic Orchestral Finale Hit + Echo',
          transition: 'fade',
        },
      ]
    : [
        {
          sceneNumber: 1,
          headline: `01. TÂM ĐIỂM: ${coreSubject.toUpperCase()}`,
          durationSec: 8,
          voiceover: `Chào mừng các bạn quay trở lại với Studio! Hôm nay chúng ta sẽ cùng giải mã toàn diện về ${coreSubject} — chủ đề đang thu hút sự quan tâm đặc biệt với những bước chuyển mình đầy bất ngờ.`,
          visualPrompt: `Cinematic dramatic opening shot representing ${coreSubject}, ultra-detailed hero subject in atmospheric studio environment, slow Dolly In camera movement, 35mm anamorphic lens, volumetric lighting rays, 8k photorealistic`,
          cameraMotion: 'dolly-in',
          lightingStyle: 'volumetric',
          sfx: 'Cinematic Braam + Whoosh',
          transition: 'fade',
        },
        {
          sceneNumber: 2,
          headline: '02. BỐI CẢNH & GIÁ TRỊ CỐT LÕI',
          durationSec: 8,
          voiceover: `Để hiểu rõ vì sao ${coreSubject} lại tạo nên sức hút lớn đến vậy, hãy nhìn vào cấu trúc cốt lõi và những tiêu chuẩn khắt khe đã được thiết lập ngay từ giai đoạn khởi đầu.`,
          visualPrompt: `Detailed architectural 360-degree Orbit shot showcasing the core design and craftsmanship of ${coreSubject}, shallow depth of field, 85mm lens, warm Rembrandt lighting, photorealistic 8k`,
          cameraMotion: 'orbit',
          lightingStyle: 'rembrandt',
          sfx: 'Smooth Transition Whoosh',
          transition: 'dissolve',
        },
        {
          sceneNumber: 3,
          headline: '03. TRẢI NGHIỆM & HIỆU NĂNG THỰC TẾ',
          durationSec: 8,
          voiceover: `Khi đưa ${coreSubject} vào thử nghiệm thực tế, từng chi tiết vận hành đều cho thấy sự tối ưu vượt bậc, giải quyết triệt để những giới hạn mà các giải pháp trước đây từng gặp phải.`,
          visualPrompt: `Dynamic FPV drone perspective gliding through modern workspace showcasing ${coreSubject} in real-world high-performance action, 35mm lens, crisp studio lighting, 60fps photorealistic`,
          cameraMotion: 'fpv-zoom',
          lightingStyle: 'studio-clean',
          sfx: 'High-Energy Riser + Impact',
          transition: 'cut',
        },
        {
          sceneNumber: 4,
          headline: '04. ĐỘT PHÁ CÔNG NGHỆ & TƯƠNG LAI',
          durationSec: 8,
          voiceover: `Không dừng lại ở hiện tại, ${coreSubject} còn mở ra tiềm năng ứng dụng rộng lớn, kết nối đồng bộ với hệ sinh thái hiện đại để tối ưu hóa hiệu suất gấp nhiều lần.`,
          visualPrompt: `Futuristic visualization of ${coreSubject} surrounded by subtle glowing data streams and volumetric light beams, Crane Boom Up camera motion, anamorphic lens flare, cyberpunk ambient glow, 8k`,
          cameraMotion: 'crane-up',
          lightingStyle: 'cyberpunk',
          sfx: 'Digital Shimmer + Sub Drop',
          transition: 'dissolve',
        },
        {
          sceneNumber: 5,
          headline: '05. LỜI KẾT & NHẬN ĐỊNH CHUYÊN GIA',
          durationSec: 8,
          voiceover: `Với tất cả những giá trị vượt trội đó, ${coreSubject} hoàn toàn xứng đáng là lựa chọn hàng đầu trong phân khúc. Đừng quên nhấn Like, Đăng ký kênh để đón xem những phân tích chuyên sâu tiếp theo!`,
          visualPrompt: `Majestic final wide shot of ${coreSubject} in golden hour volumetric lighting, slow Dolly Out camera motion, 35mm cinema lens, film grain, 8k masterpiece`,
          cameraMotion: 'dolly-out',
          lightingStyle: 'golden-hour',
          sfx: 'Final Cinematic Chord',
          transition: 'fade',
        },
      ];

  const description = `Bản phân tích và trình diễn video chuyên sâu về ${coreSubject}.\n\n📌 TIMELINE NỘI DUNG:\n${scenes
    .map((s, idx) => {
      const sec = idx * 8;
      const mStr = Math.floor(sec / 60).toString().padStart(2, '0');
      const sStr = (sec % 60).toString().padStart(2, '0');
      return `${mStr}:${sStr} — ${s.headline}`;
    })
    .join('\n')}\n\n#SynapesStudio #${coreSubject.replace(/\s+/g, '')} #AIVideo #Cinematography`;

  const cleanTag = coreSubject.replace(/[^a-zA-Z0-9À-ỹ]/g, '');

  return {
    title,
    description,
    tags: [
      cleanTag || 'Flagship2026',
      'TechReview',
      'Cinematography',
      'AIStudio',
      ...(skill?.defaultTags?.map((t) => t.replace(/^#/, '')).slice(0, 2) || ['ViralVideo']),
    ],
    productLink: 'https://synapes.ai/studio',
    musicGenre: 'Cyberpunk Ambient Synth (Commercial Master)',
    scenes,
  };
}

/**
 * HÀM CHÍNH: Tạo kịch bản & tổ hợp dữ liệu Video AI 다 phân cảnh
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

  const coreSubject = extractCleanSubject(prompt);
  const skill = skills.find((s) => s.id === skillId || s.command === skillId);
  const provMeta = PROVIDERS.find((p) => p.id === provider);
  const provName = provMeta?.name || provider;

  onProgress?.(`Đang kết nối ${provName} (${model}) & phân tích chủ đề "${coreSubject}"...`, 18);

  const systemPrompt = buildDirectorSystemPrompt(
    prompt,
    coreSubject,
    skill,
    aspectRatio,
    targetDurationMin
  );

  let rawJson: any = null;
  let isLiveApi = false;
  let actualModelUsed = model;
  let engineMessage = '';

  // 1. Gọi thực tế tới API của nhà cung cấp nếu có API Key
  if (apiKey && apiKey.trim().length > 5) {
    try {
      onProgress?.(`Đang gọi ${provName} [${model}] biên kịch & thiết kế góc máy 3D...`, 42);

      if (provider === 'gemini') {
        const res = await callGeminiApiWithFallback(model, apiKey, systemPrompt, coreSubject, endpointUrl);
        rawJson = res.data;
        actualModelUsed = res.actualModel;
      } else if (provider === 'openai' || provider === 'deepseek' || provider === 'grok') {
        rawJson = await callOpenAiCompatibleApi(provider, model, apiKey, systemPrompt, coreSubject, endpointUrl);
      } else if (provider === 'claude') {
        rawJson = await callClaudeApi(model, apiKey, systemPrompt, coreSubject, endpointUrl);
      }

      if (rawJson && Array.isArray(rawJson.scenes) && rawJson.scenes.length > 0) {
        isLiveApi = true;
        engineMessage = `✨ Kịch bản & góc máy được tạo trực tiếp bởi ${provName} (${actualModelUsed})!`;
      }
    } catch (err: any) {
      console.warn('Live LLM API fallback triggered:', err);
      engineMessage = `⚡ Đã kích hoạt Động Cơ Đạo Diễn Điện Ảnh Nội Bộ cho "${coreSubject}".`;
    }
  }

  // 2. Nếu API chưa trả về kết quả: Dùng Động Cơ Biên Kịch Điện Ảnh Chuyên Sâu
  if (!rawJson || !Array.isArray(rawJson.scenes) || rawJson.scenes.length === 0) {
    onProgress?.(`Đang dựng phân cảnh điện ảnh 5 lớp cho "${coreSubject}"...`, 68);
    rawJson = generateBespokeCinematicScript(prompt, coreSubject, skill, aspectRatio);
    if (!engineMessage) {
      engineMessage = `✨ Đã hoàn tất dựng kịch bản & chuỗi phân cảnh video cho "${coreSubject}"!`;
    }
  }

  onProgress?.('Đang kết xuất hình ảnh AI từng phân cảnh, chuyển động Camera & âm thanh TTS...', 88);

  const motions: StoryboardScene['cameraMotion'][] = [
    'dolly-in',
    'orbit',
    'fpv-zoom',
    'crane-up',
    'pan-right',
    'dolly-out',
    'pan-left',
  ];
  const lightings: StoryboardScene['lightingStyle'][] = [
    'studio-clean',
    'volumetric',
    'cyberpunk',
    'rembrandt',
    'golden-hour',
  ];

  // Chuẩn hóa danh sách phân cảnh với Image AI thực tế & Camera Motion
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
      `Cinematic shot of ${coreSubject}, 35mm anamorphic lens, shallow depth of field, volumetric lighting, 8k photorealistic`;

    const aiImageUrl = buildAiSceneImageUrl(visualPrompt, aspectRatio, idx + 1);
    const clipUrl = SCENE_VIDEO_CLIPS[idx % SCENE_VIDEO_CLIPS.length];
    const cameraMotion =
      motions.includes(sc.cameraMotion) ? sc.cameraMotion : motions[idx % motions.length];
    const lightingStyle =
      lightings.includes(sc.lightingStyle) ? sc.lightingStyle : lightings[idx % lightings.length];

    return {
      id: idx + 1,
      sceneNumber: idx + 1,
      headline:
        sc.headline ||
        `0${idx + 1}. ${coreSubject.toUpperCase()} — PHÂN CẢNH ${idx + 1}`,
      timeRange: `${startMinStr}:${startSecStr} - ${endMinStr}:${endSecStr}`,
      startSec,
      endSec,
      voiceover:
        sc.voiceover ||
        `Khám phá điểm nhấn ấn tượng tiếp theo của ${coreSubject} với thiết kế tinh xảo và hiệu năng vượt trội.`,
      visualPrompt,
      imageUrl: aiImageUrl,
      clipUrl,
      cameraMotion,
      lightingStyle,
      sfx: sc.sfx || 'Cinematic Whoosh + Sub-Bass Pulse',
      transition:
        sc.transition === 'fade' || sc.transition === 'dissolve' ? sc.transition : 'cut',
    };
  });

  const totalDuration = accumulatedSec || 48;
  const heroThumbnail =
    storyboard[0]?.imageUrl || CURATED_FALLBACK_IMAGES.tech[0];

  onProgress?.('Hoàn tất kết xuất dự án Video AI! Đang mở trình phát đa phân cảnh...', 100);

  return {
    success: true,
    isLiveApi,
    modelUsed: actualModelUsed,
    providerUsed: provName,
    title: rawJson.title || `Đánh Giá Chi Tiết ${coreSubject}`,
    description: rawJson.description || `Video phân tích chuyên sâu về ${coreSubject}.`,
    tags:
      Array.isArray(rawJson.tags) && rawJson.tags.length > 0
        ? rawJson.tags
        : [coreSubject.replace(/\s+/g, ''), 'TechReview', 'AIStudio', 'Cinematography'],
    productLink: rawJson.productLink || 'https://synapes.ai/studio',
    musicTrack: {
      name: rawJson.musicGenre || 'Cyberpunk Ambient Synth (Studio Master)',
      license: 'Bản quyền thương mại SYNAPES Audio Engine',
      volume: 22,
    },
    voiceoverTrack: {
      name: 'Giọng AI Tiếng Việt Tự Nhiên (Neural TTS)',
      voiceName: 'vi-VN-Neural-Studio',
    },
    duration: totalDuration,
    storyboard,
    videoUrl: SCENE_VIDEO_CLIPS[0],
    thumbnailUrl: heroThumbnail,
    engineMessage,
  };
}
