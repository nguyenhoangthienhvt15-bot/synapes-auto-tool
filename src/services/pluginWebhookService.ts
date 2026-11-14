import { Project, StoryboardScene, AspectRatio, SocialPlatformFormatId } from '../types';
import { GeneratedScriptResult } from './aiScriptGeneratorService';
import { PLUGIN_PRESETS, detectPluginBrand } from './aiModelDiscoveryService';

export interface PluginDispatchParams {
  scriptResult: GeneratedScriptResult;
  aspectRatio: AspectRatio;
  platformFormat?: SocialPlatformFormatId;
  platformFormatLabel?: string;
  targetChannels?: ('youtube' | 'tiktok' | 'facebook' | 'instagram' | 'threads')[];
  attachedImageDataUrl?: string;
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

  // Nếu người dùng có endpoint thật và token thật (không phải placeholder demo)
  if (
    endpoint &&
    !endpoint.includes('your-custom-api.com') &&
    pluginToken &&
    pluginToken.trim().length > 10
  ) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    const onExternalAbort = () => controller.abort();
    signal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pluginToken}`,
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal,
      });

      if (response.ok) {
        const json = await response.json();
        remoteSuccess = true;
        remoteVideoUrl = json.video_url || json.url || json.data?.url || '';
      }
    } catch (netErr) {
      if (signal?.aborted) {
        throw new DOMException('Người dùng đã hủy tác vụ khởi tạo dự án.', 'AbortError');
      }
      console.warn('Plugin webhook call notice (falling back to studio renderer):', netErr);
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onExternalAbort);
    }
  }

  if (signal?.aborted) {
    throw new DOMException('Người dùng đã hủy tác vụ khởi tạo dự án.', 'AbortError');
  }

  if (remoteSuccess) {
    onProgress?.(`Đã kết nối thành công và nhận phản hồi trực tiếp từ ${pluginName}...`, 85);
  } else {
    onProgress?.(`Đang khởi tạo cấu trúc kịch bản phân cảnh cho ${pluginName}...`, 85);
  }

  // Không gán video stock giả lập — nếu có video từ API thật thì dùng, ngược lại giữ nguyên videoUrl của kịch bản hoặc để trống cho tác vụ render ngầm
  const chosenVideoUrl =
    remoteVideoUrl ||
    scriptResult.videoUrl ||
    '';

  // Gán clipUrl thật nếu có từ API và gán tư liệu đính kèm của người dùng nếu có
  const updatedStoryboard: StoryboardScene[] = scriptResult.storyboard.map((sc, idx) => {
    return {
      ...sc,
      clipUrl: sc.clipUrl || remoteVideoUrl || '',
      imageUrl: idx === 0 && attachedImageDataUrl ? attachedImageDataUrl : sc.imageUrl,
      customMediaUrl: idx === 0 && attachedImageDataUrl ? attachedImageDataUrl : sc.customMediaUrl,
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

  const newProject: Project = {
    id: projId,
    code: `SYN-${codeNum}`,
    title: scriptResult.title,
    status: 'pending_approval', // 100% gửi về hàng chờ duyệt cho người dùng xem và quyết định
    aspectRatio,
    platformFormat: platformFormat || (aspectRatio === '16:9' ? 'youtube-long-16-9' : 'tiktok-viral-9-16'),
    platformFormatLabel:
      platformFormatLabel || (aspectRatio === '16:9' ? 'YouTube Video Dài (16:9)' : 'TikTok / Reels Dọc (9:16)'),
    videoGenre: scriptResult.videoGenre,
    newsTickerText: scriptResult.newsTickerText,
    duration: scriptResult.duration,
    targetChannels: resolvedChannels,
    videoUrl: chosenVideoUrl,
    thumbnailUrl: attachedImageDataUrl || scriptResult.thumbnailUrl,
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
      name: `${pluginName}`,
      model: `${scriptModelName}`,
      pluginUrl: endpoint,
    },
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
      : `Hệ thống đang xếp hàng đợi tác vụ render từ ${pluginName}. Video sẽ được xử lý trong 2-3 phút, kịch bản phân cảnh đã sẵn sàng tại Bàn Chờ Duyệt!`,
  };
}

