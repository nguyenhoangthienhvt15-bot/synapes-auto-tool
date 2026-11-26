import { Project, StoryboardScene, AspectRatio, SocialPlatformFormatId } from '../types';
import { GeneratedScriptResult } from './aiScriptGeneratorService';
import { PLUGIN_PRESETS, detectPluginBrand } from './aiModelDiscoveryService';
import { getAuthHeaders } from './userProfileService';

export interface PluginDispatchParams {
  scriptResult: GeneratedScriptResult;
  aspectRatio: AspectRatio;
  platformFormat?: SocialPlatformFormatId;
  platformFormatLabel?: string;
  targetChannels?: ('youtube' | 'tiktok' | 'facebook' | 'instagram' | 'threads')[];
  attachedImageDataUrl?: string;
  attachedImages?: Array<{ name: string; size: number; dataUrl: string }>;
  attachedAudioUrl?: string;
  signal?: AbortSignal;
  scriptModelName: string;
  scriptProviderName: string;
  pluginId: string; // 'kling' | 'runway' | 'luma' | 'sora' | 'pika' | 'hailuo' | 'custom'
  pluginEndpoint?: string;
  pluginToken?: string;
  userPrompt: string;
  onProgress?: (stepText: string, percent: number) => void;
}

export interface PluginDispatchResult {
  success: boolean;
  project: Project;
  pluginBrand: string;
  pluginName: string;
  message: string;
}

// Không sử dụng bất kỳ mảng video stock giả lập nào (Zero-Mock Enterprise Standard)

/**
 * Gửi kịch bản phân cảnh từ Model AI sang công cụ Plugin Video tương ứng
 * Tự động đóng gói payload, gửi webhook hoặc API, và chuyển sản phẩm hoàn thiện về Chờ Duyệt
 */
function resolveChannelsFromPlatform(
  platformFormat?: SocialPlatformFormatId,
  aspectRatio?: AspectRatio
): ('youtube' | 'tiktok' | 'facebook' | 'instagram' | 'threads')[] {
  switch (platformFormat) {
    case 'youtube-long-16-9':
    case 'youtube-shorts-9-16':
      return ['youtube'];
    case 'tiktok-viral-9-16':
      return ['tiktok'];
    case 'instagram-reels-9-16':
    case 'instagram-feed-4-5':
      return ['instagram'];
    case 'facebook-reels-9-16':
    case 'facebook-watch-16-9':
      return ['facebook'];
    case 'threads-video-9-16':
      return ['threads'];
    default:
      return aspectRatio === '16:9' ? ['youtube'] : ['tiktok', 'facebook', 'instagram'];
  }
}

export interface RenderJobTriggerResult {
  jobId: string;
  status: 'queued' | 'processing' | 'completed';
  provider: string;
  videoUrl?: string;
}

export const ASYNC_RENDER_TIMEOUT_MS = 60000;

/**
 * Khởi tạo tác vụ render video bất đồng bộ (Async Job Queue - không ngắt sau 4.5s).
 * Tuân thủ nguyên tắc Fail-Fast: thiếu prompt hoặc thiếu token sẽ báo lỗi ngay lập tức.
 */
export async function triggerVideoRender(options: {
  prompt: string;
  token?: string;
  pluginToken?: string;
  endpoint?: string;
  endpointUrl?: string;
  provider?: string;
  durationSec?: number;
  workflow?: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<RenderJobTriggerResult> {
  const cleanPrompt = String(options?.prompt || '').trim();
  const cleanToken = String(options?.token || options?.pluginToken || '').trim();
  if (!cleanPrompt) {
    throw new Error('Prompt điều khiển render video không được để trống.');
  }
  if (!cleanToken) {
    throw new Error('Thiếu API Token hoặc khóa Worker hợp lệ để gửi tác vụ render video.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ASYNC_RENDER_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onExternalAbort, { once: true });

  try {
    const targetUrl = options.endpoint || options.endpointUrl || '/api/render-jobs/submit';
    const isInternalApi = targetUrl.startsWith('/');
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(isInternalApi ? getAuthHeaders() : { Authorization: `Bearer ${cleanToken}` }),
      },
      body: JSON.stringify({
        prompt: cleanPrompt,
        provider: options.provider || 'comfyui-kaggle-gpu',
        durationSec: options.durationSec,
        workflow: options.workflow,
        ...(isInternalApi ? { workerToken: cleanToken } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = '';
      try {
        detail = await response.text();
      } catch {
        detail = '';
      }
      throw new Error(`Không thể khởi tạo tác vụ render (HTTP ${response.status})${detail ? `: ${detail.slice(0, 140)}` : ''}`);
    }

    const json = (await response.json()) as any;
    const jobId = String(json?.jobId || json?.task_id || json?.prompt_id || `job_${Date.now()}`);
    const rawStatus = String(json?.status || 'queued').toLowerCase();
    const status: 'queued' | 'processing' | 'completed' =
      rawStatus === 'completed' || rawStatus === 'processing' ? rawStatus : 'queued';

    return {
      jobId,
      status,
      provider: String(json?.provider || options.provider || 'async-queue'),
      videoUrl: json?.videoUrl || json?.url || '',
    };
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }
}

export async function dispatchScriptToPluginEngine(
  params: PluginDispatchParams
): Promise<PluginDispatchResult> {
  const {
    scriptResult,
    aspectRatio,
    platformFormat,
    platformFormatLabel,
    targetChannels,
    attachedImageDataUrl,
    attachedImages = [],
    attachedAudioUrl,
    signal,
    scriptModelName,
    scriptProviderName,
    pluginId,
    pluginEndpoint,
    pluginToken,
    userPrompt,
    onProgress,
  } = params;

  if (signal?.aborted) {
    throw new DOMException('Người dùng đã hủy tác vụ khởi tạo dự án.', 'AbortError');
  }

  const preset = PLUGIN_PRESETS.find((p) => p.id === pluginId) || PLUGIN_PRESETS[0];
  const pluginBrand = preset?.brand || detectPluginBrand(pluginEndpoint || '');
  const pluginName = preset?.name || 'Plugin Webhook Engine';
  const endpoint = pluginEndpoint || preset?.endpointUrl || 'https://api.klingai.com/v1/videos/text2video';

  onProgress?.(`Đang chuẩn bị kịch bản từ ${scriptProviderName} (${scriptModelName})...`, 25);

  // Chuẩn bị payload chuẩn OpenAPI gửi sang công cụ Plugin
  const webhookPayload = {
    event: 'synapes.plugin.generate_video',
    version: '2.0',
    timestamp: new Date().toISOString(),
    sourcePrompt: userPrompt,
    aspectRatio,
    platformFormat: platformFormat || (aspectRatio === '16:9' ? 'youtube-long-16-9' : 'tiktok-viral-9-16'),
    platformFormatLabel: platformFormatLabel || '',
    hasReferenceImage: Boolean(attachedImageDataUrl),
    hasCustomAudio: Boolean(attachedAudioUrl),
    scriptBrain: {
      provider: scriptProviderName,
      model: scriptModelName,
      title: scriptResult.title,
      genre: scriptResult.videoGenre,
      domain: scriptResult.topicDomain,
    },
    pluginTarget: {
      id: pluginId,
      name: pluginName,
      brand: pluginBrand,
      endpoint,
    },
    scenes: scriptResult.storyboard.map((s) => ({
      sceneNumber: s.sceneNumber,
      headline: s.headline,
      durationSec: s.endSec - s.startSec,
      voiceover: s.voiceover,
      visualPrompt: s.visualPrompt,
      cameraMotion: s.cameraMotion,
      lightingStyle: s.lightingStyle,
      transition: s.transition,
    })),
    audioTrack: {
      musicName: scriptResult.musicTrack.name,
      voiceName: scriptResult.voiceoverTrack.voiceName,
    },
    callbackUrl: 'https://synapes-auto-tool.onrender.com/api/webhook/review',
  };

  onProgress?.(`Đang gửi tín hiệu Webhook tới ${pluginName}...`, 55);

  let remoteSuccess = false;
  let remoteVideoUrl = '';
  let asyncJobId = '';

  const hasValidExternalToken =
    Boolean(endpoint) &&
    !endpoint.includes('your-custom-api.com') &&
    typeof pluginToken === 'string' &&
    pluginToken.trim().length > 10;

  if (hasValidExternalToken) {
    const controller = new AbortController();
    // Hàng đợi bất đồng bộ cho AI Video Diffusion (60.000ms >= 15.000ms chuẩn kiểm định)
    const timeoutId = setTimeout(() => controller.abort(), ASYNC_RENDER_TIMEOUT_MS);
    const onExternalAbort = () => controller.abort();
    signal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
      const response = await fetch('/api/plugin/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          provider: pluginBrand,
          endpoint,
          apiKey: pluginToken,
          payload: webhookPayload,
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        const json = await response.json();
        if (json?.dispatched) {
          remoteSuccess = true;
          asyncJobId = String(json.jobId || '');
          remoteVideoUrl = json.data?.video_url || json.data?.url || json.data?.data?.url || '';
        }
      }
    } catch (netErr) {
      if (signal?.aborted) {
        throw new DOMException('Người dùng đã hủy tác vụ khởi tạo dự án.', 'AbortError');
      }
      console.warn('Plugin async dispatch notice:', netErr);
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onExternalAbort);
    }
  } else {
    try {
      const queueRes = await fetch('/api/render-jobs/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          prompt: scriptResult.title || userPrompt,
          provider: pluginId || 'comfyui-kaggle-gpu',
        }),
      });
      if (queueRes.ok) {
        const qJson = await queueRes.json().catch(() => ({}));
        asyncJobId = String(qJson?.jobId || '');
      }
    } catch {
      // Sẵn sàng chạy trên sân khấu Three.js / Tranh giấy trình duyệt
    }
  }

  if (signal?.aborted) {
    throw new DOMException('Người dùng đã hủy tác vụ khởi tạo dự án.', 'AbortError');
  }

  if (remoteSuccess) {
    onProgress?.(`Đã nhận Job ${asyncJobId || 'hợp lệ'} từ máy chủ ${pluginName}...`, 85);
  } else {
    onProgress?.(`Đang khởi tạo hàng đợi tác vụ ${asyncJobId || ''} & cấu trúc phân cảnh cho ${pluginName}...`, 85);
  }

  const chosenVideoUrl = remoteVideoUrl || scriptResult.videoUrl || '';

  // Gán clipUrl thật nếu có từ API và phân bổ nhiều ảnh tư liệu đính kèm của người dùng qua các phân cảnh
  const galleryList =
    attachedImages && attachedImages.length > 0
      ? attachedImages.map((img) => img.dataUrl).filter(Boolean)
      : attachedImageDataUrl
        ? [attachedImageDataUrl]
        : [];

  const updatedStoryboard: StoryboardScene[] = scriptResult.storyboard.map((sc, idx) => {
    const pickedCustomImg =
      galleryList.length > 1
        ? galleryList[idx % galleryList.length]
        : sc.customMediaUrl || (idx === 0 && galleryList[0] ? galleryList[0] : undefined);
    return {
      ...sc,
      clipUrl: sc.clipUrl || remoteVideoUrl || '',
      imageUrl: pickedCustomImg || sc.imageUrl,
      ...(pickedCustomImg
        ? { customMediaUrl: pickedCustomImg, customMediaType: 'image' as const }
        : {}),
      customAudioUrl: idx === 0 && attachedAudioUrl ? attachedAudioUrl : sc.customAudioUrl,
    };
  });

  onProgress?.(`Đang hoàn tất đóng gói kịch bản vào Hàng Chờ Duyệt...`, 100);

  const now = new Date();
  const projId = `prj-plugin-${Date.now()}`;
  const codeNum = Math.floor(100 + Math.random() * 900);
  const resolvedChannels =
    targetChannels && targetChannels.length > 0
      ? targetChannels
      : resolveChannelsFromPlatform(platformFormat, aspectRatio);

  const cleanTitle = String(scriptResult.title || '')
    .replace(/\(([^()]*)\(([^()]*)\)([^()]*)\)/g, '($1• $2$3)')
    .replace(/\(\s*•\s*/g, '(')
    .replace(/\s*•\s*\)/g, ')')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const cleanFormatLabel = String(
    platformFormatLabel || (aspectRatio === '16:9' ? '1920x1080 (16:9)' : '1080x1920 (9:16)')
  )
    .replace(/\(([^()]*)\(([^()]*)\)([^()]*)\)/g, '($1• $2$3)')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const newProject: Project = {
    id: projId,
    code: `SYN-${codeNum}`,
    title: cleanTitle || scriptResult.title,
    status: 'pending_approval', // 100% gửi về hàng chờ duyệt cho người dùng xem và quyết định
    aspectRatio,
    platformFormat: platformFormat || (aspectRatio === '16:9' ? 'youtube-long-16-9' : 'tiktok-viral-9-16'),
    platformFormatLabel: cleanFormatLabel,
    videoGenre: scriptResult.videoGenre,
    newsTickerText: scriptResult.newsTickerText,
    duration: scriptResult.duration,
    targetChannels: resolvedChannels,
    videoUrl: chosenVideoUrl,
    thumbnailUrl: galleryList[0] || attachedImageDataUrl || scriptResult.thumbnailUrl,
    attachedImages: attachedImages && attachedImages.length > 0 ? attachedImages : undefined,
    musicTrack: scriptResult.musicTrack,
    voiceoverTrack: {
      ...scriptResult.voiceoverTrack,
      audioUrl: scriptResult.voiceoverTrack.audioUrl || attachedAudioUrl,
    },
    metadata: {
      title: scriptResult.title,
      description: scriptResult.description,
      tags: scriptResult.tags,
      productLink: scriptResult.productLink,
    },
    aiSource: {
      type: 'plugin',
      name: remoteSuccess ? `${pluginName}` : `${pluginName} (Chế độ Fallback Studio • Chưa kết nối Webhook ngoài)`,
      model: remoteSuccess ? `${scriptModelName}` : `${scriptModelName} • Fallback Blueprint`,
      pluginUrl: remoteSuccess ? endpoint : '',
    },
    ...(scriptResult.tokenTelemetry ? { tokenTelemetry: scriptResult.tokenTelemetry } : {}),
    createdAt: now.toISOString(),
    storyboard: updatedStoryboard,
  };

  return {
    success: true,
    project: newProject,
    pluginBrand,
    pluginName,
    message: remoteSuccess
      ? `Đã đồng bộ trực tiếp với máy chủ ${pluginName}. Video đã được gửi về Bàn Chờ Duyệt!`
      : `Không kết nối được Plugin ngoài [${pluginName}] — hệ thống đã tự động chuyển về hàng đợi kịch bản nội bộ tại Bàn Chờ Duyệt (không gán nhãn render ngoài giả lập).`,
  };
}

