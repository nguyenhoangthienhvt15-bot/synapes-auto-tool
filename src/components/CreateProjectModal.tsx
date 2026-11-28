import React, { useState, useEffect, useRef } from 'react';
import {
  Skill,
  Project,
  AIProviderConfig,
  AIProviderId,
  StoryboardScene,
  SocialPlatformFormatId,
  PlatformFormatPreset,
  ContractCategory,
  Model3DStyleId,
  MultiViewReferenceImage,
  Asset3DManifest,
} from '../types';
import {
  Sparkles,
  Monitor,
  Smartphone,
  X,
  Cpu,
  Key,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Info,
  Plus,
  Trash2,
  Image as ImageIcon,
  Music,
  Upload,
  Check,
  Send,
  Workflow,
  Edit3,
  Layers,
  ArrowRight,
  Eye,
  Clock,
  Mic,
  Plug,
  Globe,
} from 'lucide-react';
import {
  PROVIDERS,
  DiscoveredModel,
  isProviderKeyConfigured,
  getProviderApiKey,
  getProviderModels,
  discoverModelsFromKey,
  PLUGIN_PRESETS,
  PluginPreset,
  detectPluginBrand,
} from '../services/aiModelDiscoveryService';
import {
  generateAiVideoScript,
  GeneratedScriptResult,
  fetchRealtimeTopicResearch,
  TopicResearchPayload,
} from '../services/aiScriptGeneratorService';
import { getSavedClonedVoiceProfiles } from '../services/voiceStudioService';
import { dispatchScriptToPluginEngine } from '../services/pluginWebhookService';
import { routeSemanticPipeline } from '../services/semanticPipelineRouter';
import { runMultiAgentWritersRoom, WritersRoomSessionResult } from '../services/multiAgentWritersRoom';
import { AiProviderDropdown, AiModelDropdown, ProviderBrandLogo } from './AiProviderDropdown';
import { MultiView3DBuilderSection } from './MultiView3DBuilderSection';
import { getDefault3DStyleForTier } from '../services/multiView3dService';

interface CreateProjectModalProps {
  skills: Skill[];
  aiConfig: AIProviderConfig;
  userPlanTier?: ContractCategory;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
  onOpenAiSettings?: (provider?: AIProviderId) => void;
  onUpdateAiConfig?: (config: AIProviderConfig) => void;
  onAddSkill?: (newSkill: Skill) => void;
}

const PLATFORM_FORMAT_PRESETS: PlatformFormatPreset[] = [
  {
    id: 'youtube-long-16-9',
    platform: 'youtube',
    platformLabel: '16:9 Ngang',
    title: 'Khung Ngang Full HD • 16:9',
    aspectRatio: '16:9',
    displayRatio: '16:9',
    resolution: '1920x1080 (16:9)',
    recommendedMinutes: 2,
    description: 'Khung hình ngang chuẩn Full HD 1920x1080 (16:9) cho video chuyên sâu & trình chiếu',
    promptStyleHint: '16:9 ngang 1920x1080, kể chuyện có chiều sâu và giữ chân người xem',
  },
  {
    id: 'tiktok-viral-9-16',
    platform: 'tiktok',
    platformLabel: '9:16 Dọc',
    title: 'Khung Dọc Full HD • 9:16',
    aspectRatio: '9:16',
    displayRatio: '9:16',
    resolution: '1080x1920 (9:16)',
    recommendedMinutes: 1,
    description: 'Khung hình dọc chuẩn Full HD 1080x1920 (9:16) tối ưu video ngắn nhịp cắt nhanh',
    promptStyleHint: '9:16 dọc 1080x1920 nhịp cắt nhanh, hook 3 giây đầu gây tò mò',
  },
  {
    id: 'instagram-feed-4-5',
    platform: 'instagram',
    platformLabel: '4:5 Chân Dung',
    title: 'Khung Chân Dung HD • 4:5',
    aspectRatio: '4:5',
    displayRatio: '4:5',
    resolution: '1080x1350 (4:5)',
    recommendedMinutes: 1,
    description: 'Khung hình chân dung 1080x1350 (4:5) tối ưu hiển thị toàn màn hình di động',
    promptStyleHint: '4:5 1080x1350 nổi bật giữa bảng tin di động',
  },
];

async function compressImageToDataUrl(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh đã chọn.'));
    reader.readAsDataURL(file);
  });

  return await new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1280;
      const w = img.naturalWidth || img.width || 1;
      const h = img.naturalHeight || img.height || 1;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

const MAX_VIDEO_DURATION_SEC = 120;

const STUDIO_VOICE_OPTIONS = [
  { id: '', label: 'Tự động theo thể loại Video' },
  { id: 'vi-sg-male-1', label: 'Anh Nam Minh (Sài Gòn — Năng động)' },
  { id: 'vi-sg-female-1', label: 'Chị Diệu Thảo (Sài Gòn — Truyền cảm)' },
  { id: 'vi-dn-male-1', label: 'Anh Văn Quang (Thời sự 24h — Dõng dạc)' },
  { id: 'vi-hn-male-1', label: 'Anh Hoàng (Hà Nội — Trầm Phóng sự)' },
  { id: 'vi-hn-female-1', label: 'Chị Hoài My (Hà Nội — Chuẩn Mực)' },
  { id: 'vi-apple-keynote-male', label: 'Anh Tuấn Kiệt (Keynote Điện Ảnh)' },
];

const CAMERA_MOTION_OPTIONS: { id: StoryboardScene['cameraMotion']; label: string }[] = [
  { id: 'dolly-in', label: 'Dolly-In (Đẩy cận)' },
  { id: 'pan-right', label: 'Pan-Right (Lia phải)' },
  { id: 'orbit', label: 'Orbit (Quay vòng 3D)' },
  { id: 'crane-up', label: 'Crane-Up (Nâng góc cao)' },
  { id: 'pan-left', label: 'Pan-Left (Lia trái)' },
  { id: 'dolly-out', label: 'Dolly-Out (Lùi toàn cảnh)' },
];

function recalculatePreviewTimeline(scenes: StoryboardScene[]): StoryboardScene[] {
  let acc = 0;
  const fmt = (sec: number) =>
    `${Math.floor(sec / 60)
      .toString()
      .padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
  return scenes.map((s, idx) => {
    const dur = Math.max(2, Math.min(120, Math.round((s.endSec || 0) - (s.startSec || 0)) || 6));
    const startSec = acc;
    const endSec = startSec + dur;
    acc = endSec;
    return {
      ...s,
      sceneNumber: idx + 1,
      startSec,
      endSec,
      timeRange: `${fmt(startSec)} - ${fmt(endSec)}`,
    };
  });
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  skills: initialSkills,
  aiConfig,
  userPlanTier = 'personal',
  onClose,
  onCreateProject,
  onOpenAiSettings,
  onUpdateAiConfig,
  onAddSkill,
}) => {
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '4:5'>('16:9');
  const [selectedPlatformFormat, setSelectedPlatformFormat] =
    useState<SocialPlatformFormatId>('youtube-long-16-9');
  const [allSkills, setAllSkills] = useState<Skill[]>(initialSkills);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);
  const [promptText, setPromptText] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(1);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const targetDurationSec = Math.min(
    MAX_VIDEO_DURATION_SEC,
    Math.max(10, durationMinutes * 60 + durationSeconds)
  );
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [imageMotionMode, setImageMotionMode] = useState<
    'consistent-anchor' | 'hybrid-scenes' | 'distribute-gallery'
  >('hybrid-scenes');

  // Ngày 1: Thiết lập Multi-View 3D (1–5 ảnh Lossless PNG) & 6 Chuẩn 3D theo gói
  const [is3DBuilderExpanded, setIs3DBuilderExpanded] = useState(false);
  const [has3DToggledManually, setHas3DToggledManually] = useState(false);
  const [selected3DStyleId, setSelected3DStyleId] = useState<Model3DStyleId>(() =>
    getDefault3DStyleForTier(userPlanTier)
  );
  const [multiViewReferences, setMultiViewReferences] = useState<MultiViewReferenceImage[]>([]);
  const [character3dAssets, setCharacter3dAssets] = useState<Asset3DManifest[]>([]);

  useEffect(() => {
    if (has3DToggledManually) return;
    const lowerPrompt = promptText.toLowerCase();
    const looksLike3D = /\b3d\b|hoạt hình|pixar|isometric|claymation|low-poly|cel-shading|stylized/.test(
      lowerPrompt
    );
    if (looksLike3D && !is3DBuilderExpanded) {
      setIs3DBuilderExpanded(true);
    }
  }, [promptText, has3DToggledManually, is3DBuilderExpanded]);

  const handleDurationMinutesChange = (rawVal: string) => {
    const parsed = parseInt(rawVal || '0', 10);
    const clampedMin = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(2, parsed));
    setDurationMinutes(clampedMin);
    if (clampedMin >= 2) {
      setDurationSeconds(0);
    }
  };

  const handleDurationSecondsChange = (rawVal: string) => {
    const parsed = parseInt(rawVal || '0', 10);
    const clampedSec = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(59, parsed));
    if (durationMinutes >= 2) {
      setDurationSeconds(0);
    } else {
      setDurationSeconds(clampedSec);
    }
  };

  // Tách riêng đính kèm nhiều Hình ảnh tư liệu (tối đa 20 ảnh) và Tệp Âm thanh
  const MAX_ATTACHED_IMAGES = 20;
  const [attachedImages, setAttachedImages] = useState<
    Array<{
      name: string;
      size: number;
      dataUrl: string;
    }>
  >([]);
  const attachedImage = attachedImages[0] || null;
  const [attachedAudio, setAttachedAudio] = useState<{
    name: string;
    size: number;
    objectUrl: string;
    dataUrl?: string;
    durationSec?: number;
  } | null>(null);
  const [attachedAudioRole, setAttachedAudioRole] = useState<'bgm' | 'voiceover'>('bgm');
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const attachedAudioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
      if (attachedAudioUrlRef.current) {
        URL.revokeObjectURL(attachedAudioUrlRef.current);
        attachedAudioUrlRef.current = null;
      }
    };
  }, []);

  // Trạng thái Tự thiết kế phong cách biên tập
  const [isDesigningSkill, setIsDesigningSkill] = useState(false);
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillCommand, setCustomSkillCommand] = useState('');
  const [customSkillDesc, setCustomSkillDesc] = useState('');
  const [customSkillPrompt, setCustomSkillPrompt] = useState('');
  const [skillDesignError, setSkillDesignError] = useState<string | null>(null);

  // Đồng bộ danh sách skills nếu props thay đổi
  useEffect(() => {
    setAllSkills(initialSkills);
  }, [initialSkills]);

  // AI Provider & Models Selection state
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>(() => {
    if (aiConfig.activeProvider && isProviderKeyConfigured(aiConfig.activeProvider, aiConfig)) {
      return aiConfig.activeProvider;
    }
    const firstConfigured = PROVIDERS.find((p) => isProviderKeyConfigured(p.id, aiConfig));
    if (firstConfigured) return firstConfigured.id;
    return aiConfig.activeProvider || aiConfig.mode || 'gemini';
  });

  const isCurrentKeyConfigured = isProviderKeyConfigured(selectedProvider, aiConfig);
  const creationSpeedMode = 'cloud' as const;

  // Cơ chế tạo video qua công cụ Plugin (BẮT BUỘC KẾT NỐI): Ý tưởng -> Model AI gợi ý kịch bản -> Gửi sang Plugin -> Chuyển về Chờ Duyệt
  const [workflowStep, setWorkflowStep] = useState<'input' | 'script_preview'>('input');
  const [selectedPluginTool, setSelectedPluginTool] = useState<string>(() => {
    if (aiConfig.plugin?.endpointUrl) {
      const b = detectPluginBrand(aiConfig.plugin.endpointUrl);
      const match = PLUGIN_PRESETS.find((p) => p.brand === b);
      if (match) return match.id;
    }
    return 'kling';
  });
  const [inlinePluginToken, setInlinePluginToken] = useState<string>(
    () => aiConfig.plugin?.apiToken || ''
  );
  const activePluginPreset =
    PLUGIN_PRESETS.find((p) => p.id === selectedPluginTool) || PLUGIN_PRESETS[0];
  const effectivePluginToken = (aiConfig.plugin?.apiToken || inlinePluginToken || '').trim();
  const effectivePluginEndpoint = (
    (selectedPluginTool === 'custom'
      ? aiConfig.plugin?.endpointUrl
      : activePluginPreset?.endpointUrl || aiConfig.plugin?.endpointUrl) || ''
  ).trim();
  const isPluginConnected =
    effectivePluginToken.length > 5 && effectivePluginEndpoint.length > 0;
  const hasActiveLlmKey = getProviderApiKey(selectedProvider, aiConfig).trim().length > 5;
  const has3DByokConfig =
    aiConfig.threeDEngine?.provider === 'comfyui-kaggle-worker'
      ? /^https:\/\//i.test((aiConfig.threeDEngine?.workerUrl || '').trim())
      : (aiConfig.threeDEngine?.apiKey || '').trim().length > 5;
  const isPure3DWorkflow =
    is3DBuilderExpanded ||
    multiViewReferences.length > 0 ||
    character3dAssets.length > 0 ||
    /\b3d\b|hoạt hình 3d|pixar|isometric|claymation|low-poly|cel-shading|stylized/i.test(promptText);
  const canStartWorkflow = isPluginConnected || (isPure3DWorkflow && (hasActiveLlmKey || has3DByokConfig));

  const [pluginModelsList, setPluginModelsList] = useState<DiscoveredModel[]>(() =>
    getProviderModels('plugin', aiConfig)
  );
  const [selectedPluginModel, setSelectedPluginModel] = useState<string>(
    () => aiConfig.plugin?.model || getProviderModels('plugin', aiConfig)[0]?.id || ''
  );
  const [isScanningPluginModels, setIsScanningPluginModels] = useState(false);
  const [pluginStatusMessage, setPluginStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (aiConfig.plugin?.apiToken && aiConfig.plugin.apiToken !== inlinePluginToken) {
      setInlinePluginToken(aiConfig.plugin.apiToken);
    }
  }, [aiConfig.plugin?.apiToken]);

  const handleScanPluginModels = async (tokenOverride?: string, endpointOverride?: string) => {
    const tokenToUse = (tokenOverride ?? effectivePluginToken).trim();
    const endpointToUse = (endpointOverride ?? effectivePluginEndpoint).trim();
    if (tokenToUse.length <= 5 || !endpointToUse) {
      setPluginStatusMessage('Vui lòng nhập Token Plugin và Endpoint hợp lệ trước khi quét Model.');
      return;
    }
    setIsScanningPluginModels(true);
    setPluginStatusMessage(`Đang quét danh sách Model khả dụng trong Plugin (${activePluginPreset.name})...`);
    try {
      const res = await discoverModelsFromKey('plugin', tokenToUse, endpointToUse);
      if (res.success && res.models.length > 0) {
        setPluginModelsList(res.models);
        const preferred =
          aiConfig.plugin?.model && res.models.some((m) => m.id === aiConfig.plugin?.model)
            ? aiConfig.plugin.model
            : res.models[0].id;
        setSelectedPluginModel(preferred);
        setPluginStatusMessage(`Đã đọc ${res.models.length} Model bên trong Plugin.`);
        if (onUpdateAiConfig) {
          onUpdateAiConfig({
            ...aiConfig,
            plugin: {
              ...aiConfig.plugin,
              endpointUrl: endpointToUse,
              apiToken: tokenToUse,
              model: preferred,
              availableModels: res.models,
              modelsScannedAt: new Date().toISOString(),
            },
          });
        }
      } else {
        setPluginStatusMessage(res.message || 'Không đọc được danh sách Model trong Plugin.');
      }
    } catch (err: any) {
      setPluginStatusMessage(err?.message || 'Lỗi kết nối Plugin khi đọc Model.');
    } finally {
      setIsScanningPluginModels(false);
    }
  };

  useEffect(() => {
    if (isPluginConnected) {
      const cached = aiConfig.plugin?.availableModels;
      if (cached && cached.length > 0) {
        setPluginModelsList(cached);
        setSelectedPluginModel(
          aiConfig.plugin?.model && cached.some((m) => m.id === aiConfig.plugin?.model)
            ? aiConfig.plugin.model
            : cached[0].id
        );
      } else {
        handleScanPluginModels();
      }
    } else {
      setPluginModelsList(getProviderModels('plugin', aiConfig));
    }
  }, [isPluginConnected, selectedPluginTool]);
  const [suggestedScript, setSuggestedScript] = useState<GeneratedScriptResult | null>(null);
  const [previewScenes, setPreviewScenes] = useState<StoryboardScene[]>([]);
  const [isSuggestingScript, setIsSuggestingScript] = useState(false);

  const [modelsList, setModelsList] = useState<DiscoveredModel[]>(() => {
    return getProviderModels(selectedProvider, aiConfig);
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const provConfig = aiConfig[selectedProvider as keyof AIProviderConfig] as any;
    const initialModel = provConfig?.model;
    const initialList = getProviderModels(selectedProvider, aiConfig);
    if (initialModel && initialList.some((m) => m.id === initialModel)) {
      return initialModel;
    }
    return (
      initialList[0]?.id ||
      PROVIDERS.find((p) => p.id === selectedProvider)?.defaultModel ||
      'gemini-2.5-flash'
    );
  });

  const [isScanningKey, setIsScanningKey] = useState(false);
  const [isHarvestingInternet, setIsHarvestingInternet] = useState(false);
  const [harvestedResearch, setHarvestedResearch] = useState<TopicResearchPayload | null>(null);
  const [harvestError, setHarvestError] = useState<string | null>(null);
  const [writersRoomResult, setWritersRoomResult] = useState<WritersRoomSessionResult | null>(null);
  const [isRunningWritersRoom, setIsRunningWritersRoom] = useState(false);
  const savedClonedVoices = getSavedClonedVoiceProfiles();

  const activeSelectedSkillCommand =
    allSkills.find((s) => s.id === selectedSkillId)?.command || null;
  const semanticRoute = routeSemanticPipeline(
    promptText,
    activeSelectedSkillCommand,
    targetDurationSec
  );

  const buildConfiguredFallbackProviders = (primaryProv: AIProviderId) => {
    const candidateIds: AIProviderId[] = ['gemini', 'openai', 'claude', 'deepseek', 'grok'];
    return candidateIds
      .filter((pid) => pid !== primaryProv)
      .map((pid) => {
        const key = getProviderApiKey(pid, aiConfig);
        if (!key || key.trim().length < 6) return null;
        const cfg = (aiConfig[pid as keyof AIProviderConfig] as any) || {};
        return {
          provider: pid,
          model: cfg.model || PROVIDERS.find((p) => p.id === pid)?.defaultModel || '',
          apiKey: key.trim(),
          endpointUrl: cfg.endpointUrl || '',
        };
      })
      .filter(Boolean) as Array<{ provider: AIProviderId; model: string; apiKey: string; endpointUrl?: string }>;
  };

  const isThreeDAnimationIntent = semanticRoute.lockWikimediaSearch;

  const handleRunWritersRoomPreview = async () => {
    const q = (promptText || '').trim();
    if (!q) {
      setHarvestError('Vui lòng nhập chủ đề trước khi chạy Multi-Agent Writers Room.');
      return;
    }
    setIsRunningWritersRoom(true);
    try {
      const apiKey = getProviderApiKey(selectedProvider, aiConfig);
      const endpointUrl = (aiConfig[selectedProvider as keyof AIProviderConfig] as any)?.endpointUrl;
      const room = await runMultiAgentWritersRoom({
        prompt: q,
        route: semanticRoute,
        targetDurationSec,
        aiConfig: apiKey
          ? { provider: selectedProvider, model: selectedModel, apiKey, endpointUrl }
          : undefined,
      });
      setWritersRoomResult(room);
    } catch (err: any) {
      setHarvestError(err?.message || 'Lỗi khi chạy Multi-Agent Writers Room.');
    } finally {
      setIsRunningWritersRoom(false);
    }
  };

  const handleHarvestInternetData = async () => {
    const q = (promptText || '').trim();
    if (!q) {
      setHarvestedResearch(null);
      setHarvestError('Vui lòng nhập chủ đề hoặc nội dung vào ô kịch bản trước khi thu thập dữ liệu Internet.');
      return;
    }
    if (isThreeDAnimationIntent) {
      setHarvestedResearch(null);
      setHarvestError('Đã tự động khóa tìm ảnh Wikimedia/báo chí cho luồng Hoạt hình 3D để bảo toàn nhất quán nhân vật AI (Character Consistency Vault).');
      return;
    }
    setIsHarvestingInternet(true);
    setHarvestError(null);
    try {
      const [topicRes, brollRes] = await Promise.all([
        fetchRealtimeTopicResearch(q),
        fetch(`/api/video-broll-search?q=${encodeURIComponent(q)}&domain=technology`).then((r) =>
          r.ok ? r.json() : null
        ),
      ]);
      const extraVideos = Array.isArray(brollRes?.videos)
        ? brollRes.videos.map((v: any) => ({
            title: String(v.title || q),
            proxyUrl: String(v.proxyUrl || v.url || ''),
            source: String(v.source || 'Wikimedia Commons'),
          }))
        : [];
      const mergedVideos = [...(topicRes.videos || []), ...extraVideos].filter((v) => v.proxyUrl);
      const mergedPayload: TopicResearchPayload = {
        ...topicRes,
        videos: mergedVideos,
      };
      setHarvestedResearch(mergedPayload);
      if (mergedPayload.headlines.length === 0 && !mergedPayload.wikiSummary && mergedPayload.visuals.length === 0 && mergedVideos.length === 0) {
        setHarvestError('Không tìm thấy dữ liệu Internet mới cho từ khóa này — thử từ khóa tiếng Việt/Anh cụ thể hơn.');
      }
    } catch (err: any) {
      setHarvestedResearch(null);
      setHarvestError(err?.message || 'Lỗi kết nối thu thập dữ liệu Internet.');
    } finally {
      setIsHarvestingInternet(false);
    }
  };
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [keyErrorNotice, setKeyErrorNotice] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generationPercent, setGenerationPercent] = useState(12);

  // Đồng bộ danh sách Models khi người dùng chọn đổi nhà cung cấp
  useEffect(() => {
    const list = getProviderModels(selectedProvider, aiConfig);
    setModelsList(list);
    setScanMessage(null);
    setKeyErrorNotice(null);

    const provConfig = aiConfig[selectedProvider as keyof AIProviderConfig] as any;
    const defaultMod = provConfig?.model;
    if (defaultMod && list.some((m) => m.id === defaultMod)) {
      setSelectedModel(defaultMod);
    } else if (list.length > 0) {
      setSelectedModel(list[0].id);
    } else {
      setSelectedModel(PROVIDERS.find((p) => p.id === selectedProvider)?.defaultModel || '');
    }
  }, [selectedProvider, aiConfig]);

  // Quét đọc trực tiếp các Model khả dụng từ API Key
  const handleRefreshModelsFromKey = async () => {
    const key = getProviderApiKey(selectedProvider, aiConfig);
    const provName = PROVIDERS.find((p) => p.id === selectedProvider)?.name || selectedProvider;
    if (!key) {
      setKeyErrorNotice(`Vui lòng gắn API Key cho ${provName} trước khi quét danh sách Models.`);
      return;
    }

    setIsScanningKey(true);
    setScanMessage(`Đang kết nối API đọc các Model từ Key của ${provName}...`);
    setKeyErrorNotice(null);

    try {
      const endpoint = (aiConfig[selectedProvider as keyof AIProviderConfig] as any)?.endpointUrl;
      const res = await discoverModelsFromKey(selectedProvider, key, endpoint);
      if (res.success && res.models.length > 0) {
        setModelsList(res.models);
        setSelectedModel(res.models[0].id);
        setScanMessage(`Đã nạp thành công ${res.models.length} Model kịch bản từ API Key!`);
      } else {
        setScanMessage(null);
        setKeyErrorNotice(res.message || 'Không thể đọc Models từ Key này.');
      }
    } catch (err: any) {
      setScanMessage(null);
      setKeyErrorNotice(err?.message || 'Lỗi khi quét Models từ Key.');
    } finally {
      setIsScanningKey(false);
    }
  };

  // Bấm chọn hoặc bấm lại để HỦY CHỌN (Toggle)
  const handleQuickCommandSelect = (cmd: string) => {
    const skill = allSkills.find((s) => s.command === cmd);
    if (!skill) return;

    if (selectedSkillId === skill.id) {
      setSelectedSkillId(null);
    } else {
      setSelectedSkillId(skill.id);
    }
  };

  // Lưu phong cách biên tập do người dùng tự thiết kế
  const handleSaveCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customSkillName.trim();
    if (!name) {
      setSkillDesignError('Vui lòng nhập tên phong cách.');
      return;
    }

    let raw = customSkillCommand.trim().toLowerCase();
    if (raw.startsWith('/')) raw = raw.slice(1);
    const sanitized = raw.replace(/[^a-z0-9-_]/g, '-').replace(/^-+|-+$/g, '');

    const fallbackCmd = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const cleanCmd = `/${sanitized || fallbackCmd || `custom-${Date.now().toString().slice(-4)}`}`;

    const newSkill: Skill = {
      id: `skill-custom-${Date.now()}`,
      name,
      command: cleanCmd,
      description:
        customSkillDesc.trim() ||
        `Phong cách biên tập "${name}" do người dùng thiết kế riêng với các quy chuẩn định hướng đạo diễn.`,
      category: 'Tự Thiết Kế',
      defaultTags: ['Custom', 'User-Created'],
      tone: 'Tùy Chỉnh',
      systemPrompt:
        customSkillPrompt.trim() ||
        customSkillDesc.trim() ||
        `Biên kịch theo phong cách ${name}, chú trọng tính tự nhiên, bố cục chặt chẽ và nhịp dựng phù hợp.`,
    };

    setAllSkills((prev) => [newSkill, ...prev]);
    setSelectedSkillId(newSkill.id);
    onAddSkill?.(newSkill);

    // Reset form
    setCustomSkillName('');
    setCustomSkillCommand('');
    setCustomSkillDesc('');
    setCustomSkillPrompt('');
    setSkillDesignError(null);
    setIsDesigningSkill(false);
  };

  const activeSkill = allSkills.find((s) => s.id === selectedSkillId) || null;
  const displaySkillInfo = hoveredSkill || activeSkill;

  const selectedPlatformPreset =
    PLATFORM_FORMAT_PRESETS.find((p) => p.id === selectedPlatformFormat) ||
    PLATFORM_FORMAT_PRESETS[0];

  const handleCancelOrClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSuggestingScript(false);
    setIsGenerating(false);
    onClose();
  };

  // Bước 2: Model AI gợi ý kịch bản
  const handleSuggestScript = async () => {
    const finalPrompt = promptText.trim();
    if (!finalPrompt) return;

    if (!canStartWorkflow) {
      setKeyErrorNotice(
        isPure3DWorkflow
          ? 'Dự án 3D thuần BYOK cần ít nhất 1 LLM API Key (Gemini/OpenAI...), 3D Engine Key/Worker ở mục 5B, hoặc Token Plugin ở mục 3.'
          : 'Bắt buộc phải kết nối Plugin tạo video (API Token & Endpoint) trước khi tạo kịch bản hoặc khởi tạo video.'
      );
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSuggestingScript(true);
    setIsGenerating(true);
    setGenerationStep(
      `Model AI (${selectedModel}) & Plugin (${selectedPluginModel || activePluginPreset.name}) đang phân tích đề tài & gợi ý kịch bản...`
    );
    setGenerationPercent(20);
    setKeyErrorNotice(null);

    try {
      const apiKey = getProviderApiKey(selectedProvider, aiConfig);
      const endpoint = (aiConfig[selectedProvider as keyof AIProviderConfig] as any)?.endpointUrl;

      const generated = await generateAiVideoScript({
        prompt: finalPrompt,
        skillId: selectedSkillId || undefined,
        skills: allSkills,
        aspectRatio,
        platformFormat: selectedPlatformFormat,
        platformFormatLabel: `${selectedPlatformPreset.title} • ${selectedPlatformPreset.resolution}`,
        targetDurationMin: Math.max(0.25, targetDurationSec / 60),
        targetDurationSec,
        preferredVoiceId: selectedVoiceId || undefined,
        creationSpeedMode,
        imageMotionMode,
        attachedImageDataUrl: attachedImage?.dataUrl,
        attachedImages: attachedImages.map((img) => img.dataUrl),
        attachedImageName: attachedImages.map((img) => img.name).join(', ') || undefined,
        attachedAudioUrl: attachedAudio?.objectUrl,
        attachedAudioName: attachedAudio?.name,
        signal: controller.signal,
        provider: selectedProvider,
        model: selectedModel,
        apiKey,
        endpointUrl: endpoint,
        fallbackProviders: buildConfiguredFallbackProviders(selectedProvider),
        preHarvestedResearch: harvestedResearch,
        writersRoomDirective: writersRoomResult?.consolidatedPromptDirective,
        onProgress: (stepText, pct) => {
          if (!isMountedRef.current || controller.signal.aborted) return;
          setGenerationStep(stepText);
          if (typeof pct === 'number') {
            setGenerationPercent(pct);
          }
        },
      });

      if (!isMountedRef.current || controller.signal.aborted) return;
      setSuggestedScript(generated);
      setPreviewScenes(generated.storyboard);
      setWorkflowStep('script_preview');
      setIsSuggestingScript(false);
      setIsGenerating(false);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        setIsSuggestingScript(false);
        setIsGenerating(false);
        return;
      }
      console.error('Error suggesting AI script:', err);
      setIsSuggestingScript(false);
      setIsGenerating(false);
      setKeyErrorNotice(err?.message || 'Có lỗi xảy ra khi gợi ý kịch bản.');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  // Cập nhật các trường của cảnh trong bản xem trước kịch bản
  const handleUpdatePreviewSceneField = (sceneId: number, patch: Partial<StoryboardScene>) => {
    setPreviewScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, ...patch } : s))
    );
  };

  const handleUpdatePreviewSceneDuration = (sceneId: number, newDurationSec: number) => {
    const safeDur = Math.max(2, Math.min(120, Number(newDurationSec) || 6));
    setPreviewScenes((prev) =>
      recalculatePreviewTimeline(
        prev.map((s) => (s.id === sceneId ? { ...s, endSec: s.startSec + safeDur } : s))
      )
    );
  };

  const handleAddPreviewScene = () => {
    setPreviewScenes((prev) => {
      const last = prev[prev.length - 1];
      const nextIdx = prev.length + 1;
      const pickedImg =
        attachedImages.length > 0
          ? attachedImages[(nextIdx - 1) % attachedImages.length]
          : attachedImage;
      const shouldUsePicked =
        Boolean(pickedImg?.dataUrl) &&
        (imageMotionMode === 'distribute-gallery' ||
          imageMotionMode === 'consistent-anchor');
      const newScene: StoryboardScene = {
        id: Date.now() + nextIdx,
        sceneNumber: nextIdx,
        headline: `0${nextIdx}. PHÂN CẢNH MỞ RỘNG THEO PROMPT`,
        timeRange: '00:00 - 00:06',
        startSec: last ? last.endSec : 0,
        endSec: (last ? last.endSec : 0) + 6,
        voiceover: `Điểm nhấn tiếp theo làm rõ thông điệp cốt lõi từ yêu cầu: ${promptText.trim().slice(0, 120)}.`,
        visualPrompt: last?.visualPrompt || `Cinematic shot continuing ${promptText.trim().slice(0, 100)}`,
        imageUrl: (shouldUsePicked ? pickedImg?.dataUrl : '') || last?.imageUrl || '',
        ...(shouldUsePicked && pickedImg?.dataUrl
          ? { customMediaUrl: pickedImg.dataUrl, customMediaType: 'image' as const }
          : {}),
        clipUrl: last?.clipUrl || '',
        cameraMotion: CAMERA_MOTION_OPTIONS[nextIdx % CAMERA_MOTION_OPTIONS.length].id,
        lightingStyle: last?.lightingStyle || 'studio-clean',
        sfx: last?.sfx || 'Soft Whoosh Transition',
        transition: 'dissolve',
        voiceId: last?.voiceId || 'vi-sg-male-1',
        voiceLanguage: 'vi',
        voiceSpeed: last?.voiceSpeed || 1.05,
        voicePitch: last?.voicePitch || 1.0,
      };
      return recalculatePreviewTimeline([...prev, newScene]);
    });
  };

  const handleDeletePreviewScene = (sceneId: number) => {
    setPreviewScenes((prev) => {
      if (prev.length <= 1) return prev;
      return recalculatePreviewTimeline(prev.filter((s) => s.id !== sceneId));
    });
  };

  // Bước 3 & 4: Gửi kịch bản sang công cụ Plugin và chuyển sản phẩm video về Bàn Chờ Duyệt
  const handleDispatchScriptToPlugin = async () => {
    const finalPrompt = promptText.trim();
    if (!finalPrompt) return;

    if (!canStartWorkflow) {
      setKeyErrorNotice(
        isPure3DWorkflow
          ? 'Dự án 3D thuần BYOK cần ít nhất 1 LLM API Key, 3D Engine Key/Worker ở mục 5B, hoặc Token Plugin ở mục 3.'
          : 'Bắt buộc phải kết nối Plugin tạo video (API Token & Endpoint) trước khi gửi tạo dự án.'
      );
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setKeyErrorNotice(null);

    try {
      let scriptToDispatch = suggestedScript;

      // Nếu chưa chạy gợi ý trước đó, tạo kịch bản ngay
      if (!scriptToDispatch) {
        setGenerationStep(
          `Model AI (${selectedModel}) & Plugin (${selectedPluginModel || activePluginPreset.name}) đang khởi tạo kịch bản...`
        );
        setGenerationPercent(18);

        const apiKey = getProviderApiKey(selectedProvider, aiConfig);
        const endpoint = (aiConfig[selectedProvider as keyof AIProviderConfig] as any)?.endpointUrl;

        scriptToDispatch = await generateAiVideoScript({
          prompt: finalPrompt,
          skillId: selectedSkillId || undefined,
          skills: allSkills,
          aspectRatio,
          platformFormat: selectedPlatformFormat,
          platformFormatLabel: `${selectedPlatformPreset.title} • ${selectedPlatformPreset.resolution}`,
          targetDurationMin: Math.max(0.17, targetDurationSec / 60),
          targetDurationSec,
          preferredVoiceId: selectedVoiceId || undefined,
          creationSpeedMode,
          imageMotionMode,
          attachedImageDataUrl: attachedImage?.dataUrl,
          attachedImages: attachedImages.map((img) => img.dataUrl),
          attachedImageName: attachedImages.map((img) => img.name).join(', ') || undefined,
          attachedAudioUrl: attachedAudio?.objectUrl,
          attachedAudioName: attachedAudio?.name,
          signal: controller.signal,
          provider: selectedProvider,
          model: selectedModel,
          apiKey,
          endpointUrl: endpoint,
          fallbackProviders: buildConfiguredFallbackProviders(selectedProvider),
          preHarvestedResearch: harvestedResearch,
          writersRoomDirective: writersRoomResult?.consolidatedPromptDirective,
          onProgress: (stepText, pct) => {
            if (!isMountedRef.current || controller.signal.aborted) return;
            setGenerationStep(stepText);
            if (typeof pct === 'number') {
              setGenerationPercent(pct);
            }
          },
        });
      }

      if (!isMountedRef.current || controller.signal.aborted) return;

      // Áp dụng storyboard đã chỉnh sửa nếu có
      if (previewScenes && previewScenes.length > 0) {
        const recomputedTotal = previewScenes.reduce(
          (acc, s) => acc + Math.max(2, Math.round((s.endSec || 0) - (s.startSec || 0)) || 6),
          0
        );
        scriptToDispatch = {
          ...scriptToDispatch,
          duration: recomputedTotal || scriptToDispatch.duration,
          storyboard: previewScenes,
        };
      }

      const provMeta = PROVIDERS.find((p) => p.id === selectedProvider);
      const pluginPreset = PLUGIN_PRESETS.find((p) => p.id === selectedPluginTool) || PLUGIN_PRESETS[0];
      const pluginEndpoint = effectivePluginEndpoint || pluginPreset.endpointUrl;
      const pluginToken = effectivePluginToken;

      const result = await dispatchScriptToPluginEngine({
        scriptResult: scriptToDispatch,
        aspectRatio,
        platformFormat: selectedPlatformFormat,
        platformFormatLabel: `${selectedPlatformPreset.title} • ${selectedPlatformPreset.resolution}`,
        targetChannels: [selectedPlatformPreset.platform],
        attachedImageDataUrl: attachedImage?.dataUrl,
        attachedImages,
        attachedAudioUrl: attachedAudioRole === 'voiceover' ? attachedAudio?.objectUrl : undefined,
        signal: controller.signal,
        scriptModelName: selectedPluginModel ? `${selectedModel} → ${selectedPluginModel}` : selectedModel,
        scriptProviderName: provMeta?.name || selectedProvider,
        pluginId: selectedPluginTool,
        pluginEndpoint,
        pluginToken,
        userPrompt: finalPrompt,
        onProgress: (stepText, pct) => {
          if (!isMountedRef.current || controller.signal.aborted) return;
          setGenerationStep(stepText);
          if (typeof pct === 'number') {
            setGenerationPercent(pct);
          }
        },
      });

      if (!isMountedRef.current || controller.signal.aborted) return;
      const customBgmPatch =
        attachedAudio && attachedAudioRole === 'bgm'
          ? {
              musicTrack: {
                ...(result.project.musicTrack || {
                  name: attachedAudio.name,
                  license: 'User Uploaded Audio',
                  volume: 24,
                }),
                name: attachedAudio.name,
                license: 'Tệp nhạc nền của bạn (MP3/WAV)',
                volume: result.project.musicTrack?.volume ?? 24,
                customBgmUrl: attachedAudio.dataUrl || attachedAudio.objectUrl,
                customBgmFileName: attachedAudio.name,
                customBgmDurationSec: attachedAudio.durationSec,
                loop: true,
                fadeInSec: 0.5,
                fadeOutSec: 0.6,
                duckingEnabled: true,
              },
            }
          : {};

      const enrichedProject: Project = {
        ...result.project,
        ...customBgmPatch,
        ...(isPure3DWorkflow
          ? {
              videoGenre: '3d-animation' as const,
              lockWikimediaSearch: true,
              model3dStyle: selected3DStyleId,
              multiViewReferences,
              character3dAssets,
            }
          : {}),
      };
      onCreateProject(enrichedProject);
      setIsGenerating(false);
      onClose();
    } catch (err: any) {
      if (!isMountedRef.current) return;
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        setIsGenerating(false);
        return;
      }
      console.error('Error dispatching script to plugin:', err);
      setIsGenerating(false);
      setKeyErrorNotice(err?.message || 'Có lỗi xảy ra khi gửi kịch bản sang công cụ Plugin.');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const executeGeneration = async () => {
    await handleDispatchScriptToPlugin();
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeGeneration();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelOrClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancelOrClose();
      }}
    >
      <div className="studio-card p-6 max-w-2xl w-full shadow-2xl relative max-h-[93vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-2xs">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950 tracking-tight">
                Khởi Tạo Dự Án Video
              </h2>
              <p className="text-zinc-500 text-xs">
                Thiết lập khuôn mẫu định dạng, phong cách biên tập và cấu hình mô hình AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelOrClose}
            title={isGenerating ? 'Hủy tác vụ đang chạy & Đóng cửa sổ' : 'Đóng cửa sổ'}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {workflowStep === 'input' ? (
          <form onSubmit={handleSubmitCreate} className="space-y-4 text-xs">
            {/* 1. KHUÔN MẪU ĐỊNH DẠNG VIDEO */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-zinc-800 font-semibold block">
                  1. Khuôn mẫu định dạng video *
                </label>
                <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-black/[0.06]">
                  {selectedPlatformPreset.title} • {selectedPlatformPreset.resolution}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div
                  onClick={() => {
                    setAspectRatio('16:9');
                    if (selectedPlatformPreset.aspectRatio !== '16:9') {
                      setSelectedPlatformFormat('youtube-long-16-9');
                      setDurationMinutes(2);
                      setDurationSeconds(0);
                    }
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${aspectRatio === '16:9'
                      ? 'border-zinc-950 bg-zinc-50/90 text-zinc-950 shadow-2xs ring-1 ring-zinc-950/5'
                      : 'border-black/[0.08] bg-white text-zinc-600 hover:border-black/[0.18]'
                    }`}
                >
                  <div className="font-semibold flex items-center gap-1.5 text-zinc-950 text-xs">
                    <Monitor className="w-4 h-4 text-zinc-800" />
                    <span>Khuôn Mẫu Video Dài (16:9)</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                    Định dạng màn hình ngang Full HD 1920x1080 tiêu chuẩn
                  </div>
                </div>

                <div
                  onClick={() => {
                    setAspectRatio('9:16');
                    if (selectedPlatformPreset.aspectRatio !== '9:16') {
                      setSelectedPlatformFormat('tiktok-viral-9-16');
                      setDurationMinutes(0);
                      setDurationSeconds(30);
                    }
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${aspectRatio === '9:16'
                      ? 'border-zinc-950 bg-zinc-50/90 text-zinc-950 shadow-2xs ring-1 ring-zinc-950/5'
                      : 'border-black/[0.08] bg-white text-zinc-600 hover:border-black/[0.18]'
                    }`}
                >
                  <div className="font-semibold flex items-center gap-1.5 text-zinc-950 text-xs">
                    <Smartphone className="w-4 h-4 text-zinc-800" />
                    <span>Khuôn Mẫu Video Ngắn (9:16)</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                    Định dạng khung dọc 1080x1920 cho video ngắn nhịp độ cao
                  </div>
                </div>
              </div>

              {/* Chọn nhanh Kích thước & Tỷ lệ khung hình hợp nhất */}
              <div className="pt-1">
                <div className="text-[11px] font-medium text-zinc-600 mb-1.5 flex items-center justify-between">
                  <span>Độ phân giải &amp; Tỷ lệ khung hình xuất bản:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PLATFORM_FORMAT_PRESETS.map((preset) => {
                    const isSelected = selectedPlatformFormat === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlatformFormat(preset.id);
                          setAspectRatio(preset.aspectRatio);
                          const nextSec = preset.aspectRatio === '9:16' ? 30 : 120;
                          setDurationMinutes(Math.floor(nextSec / 60));
                          setDurationSeconds(nextSec % 60);
                        }}
                        title={preset.description}
                        className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-zinc-950 bg-zinc-900 text-white shadow-xs'
                            : 'border-black/[0.08] bg-white hover:bg-zinc-50 text-zinc-800 hover:border-black/[0.2]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-[11px] truncate">{preset.title}</span>
                          {isSelected && <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                        </div>
                        <div
                          className={`text-[10px] font-mono mt-0.5 ${
                            isSelected ? 'text-zinc-300' : 'text-zinc-500'
                          }`}
                        >
                          {preset.resolution}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. CHỌN & TỰ THIẾT KẾ PHONG CÁCH BIÊN TẬP */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-zinc-800 font-semibold">2. Phong cách biên tập (Skills)</label>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    (Bấm để chọn, bấm lại để hủy)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDesigningSkill((prev) => !prev)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 text-zinc-800 bg-zinc-100 hover:bg-zinc-200/90 border border-black/[0.08] transition cursor-pointer shadow-2xs"
                    title="Mở bảng tạo phong cách biên tập tùy chỉnh"
                  >
                    <Plus className="w-3 h-3 text-zinc-600" />
                    <span>{isDesigningSkill ? 'Đóng thiết kế' : 'Tự thiết kế phong cách'}</span>
                  </button>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {selectedSkillId
                      ? `Đang áp dụng: ${activeSkill?.name || 'Đã chọn'}`
                      : 'Mặc định (Tự do)'}
                  </span>
                </div>
              </div>

              {/* Bảng Tự Thiết Kế Phong Cách Mới (Mở rộng khi bấm) */}
              {isDesigningSkill && (
                <div className="p-3.5 rounded-xl bg-zinc-100/90 border border-black/[0.09] space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-black/[0.06] pb-1.5">
                    <span className="font-semibold text-zinc-950 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Thiết kế phong cách biên tập riêng</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDesigningSkill(false)}
                      className="text-zinc-400 hover:text-zinc-900 transition p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {skillDesignError && (
                    <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                      <span>{skillDesignError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium text-zinc-700 block mb-1">
                        Tên phong cách *
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Review Tối Giản Điện Ảnh"
                        value={customSkillName}
                        onChange={(e) => setCustomSkillName(e.target.value)}
                        className="w-full bg-white border border-black/[0.12] rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-zinc-700 block mb-1">
                        Cú pháp lệnh gọi nhanh (tùy chọn)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: /minimal-review"
                        value={customSkillCommand}
                        onChange={(e) => setCustomSkillCommand(e.target.value)}
                        className="w-full bg-white border border-black/[0.12] rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-zinc-700 block mb-1">
                      Tóm tắt nội dung phong cách (hiển thị khi di chuột)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Nhịp dựng chậm rãi 6-8s, tập trung cận cảnh chất liệu, phông nền đơn sắc, giọng đọc trầm ấm"
                      value={customSkillDesc}
                      onChange={(e) => setCustomSkillDesc(e.target.value)}
                      className="w-full bg-white border border-black/[0.12] rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-zinc-700 block mb-1">
                      Chỉ đạo đạo diễn AI / System Prompt (tùy chọn)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="VD: Kịch bản tập trung phân tích sâu, giọng điệu sắc sảo, không dùng lời sáo rỗng, bố cục phân cảnh rõ ràng..."
                      value={customSkillPrompt}
                      onChange={(e) => setCustomSkillPrompt(e.target.value)}
                      className="w-full bg-white border border-black/[0.12] rounded-lg p-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsDesigningSkill(false)}
                      className="px-3 py-1 rounded-lg bg-white border border-black/[0.1] text-zinc-700 text-[11px] hover:bg-zinc-50 transition cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomSkill}
                      className="btn-primary py-1 px-3 text-[11px] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Check className="w-3 h-3" />
                      <span>Lưu & Áp Dụng Phong Cách Này</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Danh sách các nút Phong cách biên tập */}
              <div className="flex flex-wrap gap-1.5">
                {allSkills.map((s) => {
                  const isSelected = selectedSkillId === s.id;
                  const isHovered = hoveredSkill?.id === s.id;
                  const isCustom = s.category === 'Tự Thiết Kế' || s.id.startsWith('skill-custom');
                  return (
                    <div key={s.id} className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => handleQuickCommandSelect(s.command)}
                        onMouseEnter={() => setHoveredSkill(s)}
                        onMouseOver={() => setHoveredSkill(s)}
                        onMouseLeave={() => setHoveredSkill((cur) => (cur?.id === s.id ? null : cur))}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition cursor-pointer flex items-center gap-1 ${isSelected
                            ? 'bg-zinc-950 text-white font-medium shadow-2xs ring-1 ring-zinc-950'
                            : isCustom
                              ? 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                              : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/70 border border-black/[0.06]'
                          }`}
                      >
                        <span>{s.command}</span>
                        {isCustom && <span className="text-[9px] text-indigo-500 font-sans">• Tự tạo</span>}
                      </button>

                      {/* Khung thông tin nhỏ tóm tắt nội dung phong cách khi di chuột */}
                      {isHovered && (
                        <div className="absolute left-0 top-full mt-1.5 z-50 w-72 p-2.5 bg-zinc-950 text-white rounded-xl shadow-2xl text-left pointer-events-none border border-white/10 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between gap-1.5 border-b border-white/10 pb-1 mb-1">
                            <span className="font-semibold text-[11px] text-zinc-100 truncate">
                              {s.name}
                            </span>
                            <span className="font-mono text-[9px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded flex-shrink-0">
                              {s.command}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-zinc-300 leading-relaxed line-clamp-3">
                            {s.description || 'Phong cách biên tập nội dung chuyên nghiệp.'}
                          </p>
                          <div className="mt-1 pt-1 border-t border-white/10 text-[9px] text-zinc-400 font-mono flex items-center justify-between">
                            <span>{isSelected ? 'Đang được chọn' : 'Nhấp để kích hoạt'}</span>
                            <span>{isSelected ? 'Bấm để hủy chọn' : 'Tùy chọn'}</span>
                          </div>
                          <div className="absolute left-4 bottom-full w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-zinc-950" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Khung tóm tắt phong cách đang xem hoặc đang kích hoạt */}
              {displaySkillInfo && (
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-black/[0.07] text-xs flex items-start gap-2 animate-in fade-in duration-100">
                  <Info className="w-3.5 h-3.5 text-zinc-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1 leading-snug">
                    <div className="font-semibold text-zinc-900 text-[11px] flex items-center gap-1.5">
                      <span>{displaySkillInfo.name}</span>
                      <span className="font-mono text-[9px] text-zinc-500 font-normal">
                        ({displaySkillInfo.command})
                      </span>
                      {selectedSkillId === displaySkillInfo.id && (
                        <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                          Đang chọn
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                      {displaySkillInfo.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* NHẬP CHỦ ĐỀ / KỊCH BẢN & THỜI LƯỢNG TÙY CHỈNH (MAX 2 PHÚT) */}
            <div className="space-y-2">
              <textarea
                rows={4}
                required
                placeholder="Nhập nội dung, đề tài hoặc gõ từng dòng phân cảnh (Ví dụ: 1. Cảnh mở đầu..., 2. Cận cảnh..., hoặc mô tả trực tiếp yêu cầu video của bạn)..."
                value={promptText}
                onChange={(e) => {
                  const nextVal = e.target.value;
                  setPromptText(nextVal);
                  setHarvestedResearch(null);
                  setHarvestError(null);
                  setWritersRoomResult(null);
                  if (suggestedScript) {
                    setSuggestedScript(null);
                    setPreviewScenes([]);
                  }
                }}
                className="w-full bg-white border border-black/[0.12] rounded-xl p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 leading-relaxed transition"
              />

              {/* Nút Chủ Động Thu Thập Dữ Liệu Thực Tế Từ Internet & Đa Nền Tảng */}
              <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-950">
                    <Globe className="w-3.5 h-3.5 text-sky-600" />
                    <span>Nguồn Dữ Liệu Thực Tế Internet &amp; B-Roll Đa Nền Tảng</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleHarvestInternetData}
                    disabled={isHarvestingInternet || !promptText.trim() || isThreeDAnimationIntent}
                    data-testid="harvest-internet-data-btn"
                    title={
                      isThreeDAnimationIntent
                        ? 'Luồng Hoạt hình 3D tự động khóa tìm ảnh Wikimedia để giữ nhất quán nhân vật'
                        : !promptText.trim()
                          ? 'Vui lòng nhập chủ đề trước khi thu thập dữ liệu Internet'
                          : 'Thu thập dữ liệu báo chí & B-Roll thực tế theo chủ đề đã nhập'
                    }
                    className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3 h-3 ${isHarvestingInternet ? 'animate-spin' : ''}`} />
                    <span>
                      {isHarvestingInternet
                        ? 'Đang Thu Thập...'
                        : isThreeDAnimationIntent
                          ? 'Đã Khóa Ảnh Wikimedia (3D)'
                          : 'Thu Thập Dữ Liệu Internet & B-Roll'}
                    </span>
                  </button>
                </div>
                {isThreeDAnimationIntent && (
                  <p className="text-[10.5px] text-indigo-800 bg-indigo-50 px-2 py-1 rounded border border-indigo-200" data-testid="wikimedia-locked-notice">
                    Chế độ Hoạt hình 3D đang kích hoạt: hệ thống tự động khóa nguồn ảnh Wikimedia/tin tức để bảo vệ Character Consistency Vault.
                  </p>
                )}
                {harvestError && (
                  <p className="text-[10.5px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">{harvestError}</p>
                )}
                {harvestedResearch && (
                  <div className="p-2 rounded-lg bg-white border border-sky-200/70 space-y-1 text-[10.5px]" data-testid="harvested-research-preview">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-sky-900 font-semibold">
                      <span>✓ {harvestedResearch.headlines.length} Tin báo chí</span>
                      <span>• {harvestedResearch.visuals.length} Ảnh tư liệu Wikimedia</span>
                      <span>• {harvestedResearch.videos?.length || 0} Clip B-Roll Video</span>
                      <span>• Wiki: {harvestedResearch.wikiSummary ? 'Đã nạp ✓' : 'Không tìm thấy'}</span>
                    </div>
                    {harvestedResearch.headlines[0] && (
                      <div className="text-zinc-600 truncate">
                        Tiêu điểm: <strong>[{harvestedResearch.headlines[0].source}]</strong> {harvestedResearch.headlines[0].title}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Semantic Intent Router, Audience Compliance & Multi-Agent Writers Room */}
              <div className="p-2.5 rounded-xl bg-zinc-50 border border-black/[0.08] space-y-2" data-testid="semantic-router-panel">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                    <span className="font-semibold text-zinc-900 px-2 py-0.5 rounded-md bg-white border border-black/[0.08]">
                      {semanticRoute.flowLabel}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono font-semibold border ${
                        semanticRoute.compliance.isMadeForKids
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : semanticRoute.compliance.audienceRating === 'FINANCIAL_ADVISORY_16_PLUS'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-zinc-100 text-zinc-700 border-black/[0.08]'
                      }`}
                    >
                      {semanticRoute.compliance.isMadeForKids
                        ? 'Made for Kids (COPPA)'
                        : semanticRoute.compliance.audienceRating}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunWritersRoomPreview}
                    disabled={isRunningWritersRoom || !promptText.trim()}
                    data-testid="run-writers-room-btn"
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[10.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>
                      {isRunningWritersRoom
                        ? '4 Agents đang họp...'
                        : 'Họp 4 Agents (Writers Room)'}
                    </span>
                  </button>
                </div>

                {writersRoomResult && (
                  <div className="p-2 rounded-lg bg-white border border-black/[0.08] space-y-1.5 text-[10.5px]" data-testid="writers-room-summary">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] pb-1">
                      <span className="font-semibold text-zinc-900">
                        Character Vault Seed #{writersRoomResult.characterVault[0]?.fixedSeed} • {writersRoomResult.cinematographerSpecs.length} Shots
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold">
                        Rubric Critic: {writersRoomResult.rubricCritic.totalScore}/100
                      </span>
                    </div>
                    <div className="text-zinc-600 line-clamp-2">
                      {writersRoomResult.storyArchitectScenes.map((sc) => `${sc.beatRole} (${sc.durationSec}s)`).join(' → ')} | SFX: {writersRoomResult.foleySfxCues[0]?.musicBpm} BPM
                    </div>
                  </div>
                )}
              </div>

              {/* Thời lượng tùy chỉnh Phút/Giây (Max 2 phút) & Giọng đọc AI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {/* Thời lượng mục tiêu (Max 120s) */}
                <div className="p-2.5 rounded-xl bg-zinc-50/80 border border-black/[0.07] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-800">
                      <Clock className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Thời lượng Video (Tối đa 2 phút)</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-mono font-semibold">
                      {Math.floor(targetDurationSec / 60)}p {(targetDurationSec % 60).toString().padStart(2, '0')}s
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-zinc-700 font-medium flex-1">
                      <span>Phút (0–2):</span>
                      <input
                        type="number"
                        min={0}
                        max={2}
                        value={durationMinutes}
                        onChange={(e) => handleDurationMinutesChange(e.target.value)}
                        className="w-full bg-white border border-black/[0.12] rounded-lg px-2 py-1 text-xs font-mono font-semibold text-zinc-950 focus:outline-none focus:border-zinc-950"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-zinc-700 font-medium flex-1">
                      <span>Giây (0–59):</span>
                      <input
                        type="number"
                        min={0}
                        max={durationMinutes >= 2 ? 0 : 59}
                        disabled={durationMinutes >= 2}
                        value={durationSeconds}
                        onChange={(e) => handleDurationSecondsChange(e.target.value)}
                        className="w-full bg-white border border-black/[0.12] rounded-lg px-2 py-1 text-xs font-mono font-semibold text-zinc-950 focus:outline-none focus:border-zinc-950 disabled:bg-zinc-100 disabled:text-zinc-400"
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight">
                    Mỗi video dài tối đa 2 phút (120 giây). Muốn làm video dài 5–10 phút, hãy tạo các đoạn 2 phút rồi dùng tính năng <strong>Ghép Nối Video</strong>.
                  </p>
                </div>

                {/* Chọn Giọng đọc AI */}
                <div className="p-2.5 rounded-xl bg-zinc-50/80 border border-black/[0.07] space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-800">
                    <Mic className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Giọng đọc AI (Tiếng Việt)</span>
                  </div>
                  <select
                    value={selectedVoiceId}
                    onChange={(e) => setSelectedVoiceId(e.target.value)}
                    className="w-full bg-white border border-black/[0.1] rounded-lg px-2.5 py-2 text-[11px] font-medium text-zinc-900 focus:outline-none focus:border-zinc-950 cursor-pointer"
                    data-testid="create-project-voice-select"
                  >
                    {savedClonedVoices.length > 0 && (
                      <optgroup label={`Giọng Nhân Bản Từ VoiceStudio ULTRA (${savedClonedVoices.length})`}>
                        {savedClonedVoices.map((cv) => (
                          <option key={cv.id} value={cv.id}>
                            🎙️ {cv.name} ({cv.gender} • {cv.engine})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Giọng Phát Thanh Viên Studio Chuẩn">
                      {STUDIO_VOICE_OPTIONS.map((v) => (
                        <option key={v.id || 'auto'} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-[10px] text-zinc-500 leading-tight">
                    Chọn thẳng giọng đã nhân bản trong VoiceStudio ULTRA hoặc đổi / thu âm trực tiếp sau khi khởi tạo.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. CƠ CHẾ PLUGIN BẮT BUỘC & MÔ HÌNH AI BIÊN KỊCH */}
            <div className="p-3.5 rounded-xl bg-zinc-50/90 border border-black/[0.08] space-y-3">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-950 text-xs">
                  <Workflow className="w-3.5 h-3.5 text-indigo-600" />
                  <span>3. Model AI biên kịch & Plugin tạo video (Bắt buộc kết nối)</span>
                </div>
                {onOpenAiSettings && (
                  <button
                    type="button"
                    onClick={() => onOpenAiSettings('plugin')}
                    className="text-[11px] text-zinc-600 hover:text-zinc-950 flex items-center gap-1 cursor-pointer font-medium"
                    title="Mở trang cấu hình Plugin & API Keys"
                  >
                    <Key className="w-3 h-3 text-zinc-500" />
                    <span>Cài đặt Plugin & Keys</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cột 1: Model AI gợi ý kịch bản */}
                <div className="space-y-1.5">
                  <label className="text-zinc-800 font-semibold block text-[11px] flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Model AI gợi ý kịch bản</span>
                  </label>
                  <AiProviderDropdown
                    providers={PROVIDERS}
                    selectedProvider={selectedProvider}
                    aiConfig={aiConfig}
                    onSelect={(prov) => setSelectedProvider(prov)}
                  />

                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-zinc-500 font-medium">Phiên bản Model:</span>
                      {isCurrentKeyConfigured && (
                        <button
                          type="button"
                          onClick={handleRefreshModelsFromKey}
                          disabled={isScanningKey}
                          className="text-[10px] text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer font-medium"
                          title="Quét đọc lại danh sách Model trực tiếp từ API Key"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${isScanningKey ? 'animate-spin' : ''}`} />
                          <span>Quét lại từ Key</span>
                        </button>
                      )}
                    </div>

                    <AiModelDropdown
                      provider={selectedProvider}
                      models={modelsList}
                      selectedModel={selectedModel}
                      disabled={!isCurrentKeyConfigured}
                      onSelect={(modelId) => setSelectedModel(modelId)}
                    />
                  </div>
                </div>

                {/* Cột 2: Plugin tạo video BẮT BUỘC & đọc Model bên trong Plugin */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-zinc-800 font-semibold text-[11px] flex items-center gap-1.5">
                      <Plug className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Plugin tạo Video (Bắt buộc) *</span>
                    </label>
                    <span
                      className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                        isPluginConnected
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-rose-700 bg-rose-50 border-rose-200'
                      }`}
                    >
                      {isPluginConnected ? 'Đã kết nối' : 'Chưa kết nối'}
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      value={selectedPluginTool}
                      onChange={(e) => setSelectedPluginTool(e.target.value)}
                      className="w-full bg-white border border-black/[0.12] rounded-xl px-3 py-2 text-xs font-semibold text-zinc-950 focus:outline-none focus:border-zinc-950 transition cursor-pointer appearance-none pr-8 shadow-2xs"
                    >
                      {PLUGIN_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.vendor})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-[10px]">
                      ▼
                    </div>
                  </div>

                  {isPluginConnected ? (
                    <div className="p-2.5 rounded-lg bg-white border border-emerald-200 text-[11px] space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ProviderBrandLogo
                            provider="plugin"
                            pluginBrand={activePluginPreset.brand}
                            size="xs"
                            withBadge={false}
                          />
                          <span className="font-semibold text-zinc-950 truncate">
                            Model trong {activePluginPreset.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleScanPluginModels()}
                          disabled={isScanningPluginModels}
                          className="text-[10px] text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer font-medium flex-shrink-0"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${isScanningPluginModels ? 'animate-spin' : ''}`} />
                          <span>Quét Model</span>
                        </button>
                      </div>
                      <select
                        value={selectedPluginModel}
                        onChange={(e) => {
                          const nextMod = e.target.value;
                          setSelectedPluginModel(nextMod);
                          if (onUpdateAiConfig) {
                            onUpdateAiConfig({
                              ...aiConfig,
                              plugin: {
                                ...aiConfig.plugin,
                                endpointUrl: effectivePluginEndpoint,
                                apiToken: effectivePluginToken,
                                model: nextMod,
                              },
                            });
                          }
                        }}
                        className="w-full bg-zinc-50 border border-black/[0.1] rounded-lg px-2 py-1.5 text-[11px] font-mono text-zinc-900 focus:outline-none focus:border-zinc-950 cursor-pointer"
                      >
                        {pluginModelsList.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.description ? `— ${m.description}` : ''}
                          </option>
                        ))}
                      </select>
                      {pluginStatusMessage && (
                        <p className="text-[10px] text-emerald-700 leading-tight">{pluginStatusMessage}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-rose-50/90 border border-rose-200 text-[11px] space-y-2 shadow-2xs">
                      <div className="flex items-start gap-1.5 text-rose-900 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span className="leading-snug text-[10.5px]">
                          Chưa có kết nối Plugin. Dán Token / API Key của Plugin để mở khóa tạo video & tự động đọc Model bên trong Plugin:
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="password"
                          placeholder={`Dán Token ${activePluginPreset.name}...`}
                          value={inlinePluginToken}
                          onChange={(e) => setInlinePluginToken(e.target.value)}
                          className="flex-1 bg-white border border-rose-200 rounded-lg px-2 py-1 text-[11px] font-mono text-zinc-900 focus:outline-none focus:border-zinc-950"
                        />
                        <button
                          type="button"
                          onClick={() => handleScanPluginModels(inlinePluginToken, effectivePluginEndpoint)}
                          disabled={inlinePluginToken.trim().length <= 5 || isScanningPluginModels}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-black text-white text-[10.5px] font-semibold whitespace-nowrap cursor-pointer disabled:opacity-40"
                        >
                          {isScanningPluginModels ? 'Đang kết nối...' : 'Kết nối & Đọc Model'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Trạng thái nếu CHƯA gắn API Key cho nhà cung cấp đang chọn */}
              {!isCurrentKeyConfigured && (
                <div className="p-2.5 rounded-lg bg-amber-50/90 border border-amber-200/90 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start sm:items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <span className="leading-snug text-[11px]">
                      <strong>{PROVIDERS.find((p) => p.id === selectedProvider)?.name}</strong> chưa gắn API Key riêng. Hệ thống sẽ tự động kích hoạt Động cơ Biên kịch Studio Nội bộ để khởi tạo dự án.
                    </span>
                  </div>
                  {onOpenAiSettings && (
                    <button
                      type="button"
                      onClick={() => onOpenAiSettings(selectedProvider)}
                      className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-black text-white font-medium text-[11px] whitespace-nowrap transition cursor-pointer shadow-2xs self-start sm:self-auto"
                    >
                      + Gắn API Key
                    </button>
                  )}
                </div>
              )}

              {scanMessage && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="line-clamp-2">{scanMessage}</span>
                </div>
              )}

              {keyErrorNotice && (
                <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[11px] flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                  <span>{keyErrorNotice}</span>
                </div>
              )}
            </div>

            {/* 4. TƯ LIỆU ĐÍNH KÈM (TÁCH RIÊNG ẢNH & AUDIO) */}
            <div className="space-y-2 pt-1 border-t border-black/[0.06]">
              <label className="text-zinc-800 font-semibold block text-xs">
                4. Tư liệu đính kèm (Tùy chọn)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 5A. Đính kèm Hình Ảnh (Tối đa 20 ảnh cùng lúc) */}
                <div className="p-3 rounded-xl border border-black/[0.08] bg-zinc-50/70 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-900 text-[11px] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                      <span>Hình ảnh tư liệu (PNG, JPG, WebP • Tối đa {MAX_ATTACHED_IMAGES} ảnh)</span>
                    </span>
                    {attachedImages.length > 0 && (
                      <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Đã nạp: {attachedImages.length}/{MAX_ATTACHED_IMAGES} ảnh
                      </span>
                    )}
                  </div>
                  {attachedImages.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          disabled={attachedImages.length >= MAX_ATTACHED_IMAGES}
                          onClick={() => imageInputRef.current?.click()}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition flex items-center gap-1 cursor-pointer ${
                            attachedImages.length >= MAX_ATTACHED_IMAGES
                              ? 'bg-zinc-100 text-zinc-400 border-black/[0.06] cursor-not-allowed'
                              : 'bg-white hover:bg-zinc-100 text-zinc-800 border-black/[0.12] shadow-2xs'
                          }`}
                        >
                          <Upload className="w-3 h-3" />
                          <span>+ Chọn thêm ảnh</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachedImages([]);
                            if (imageInputRef.current) imageInputRef.current.value = '';
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium text-red-600 hover:bg-red-50 border border-red-200/70 transition flex items-center gap-1 cursor-pointer"
                          title="Xóa toàn bộ ảnh đã chọn"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Xóa tất cả</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-40 overflow-y-auto p-1 rounded-lg bg-white border border-black/[0.08]">
                        {attachedImages.map((img, idx) => (
                          <div
                            key={`${img.name}-${idx}`}
                            className="relative group rounded-md overflow-hidden border border-black/[0.08] bg-zinc-100 aspect-video"
                            title={`${img.name} (${Math.round(img.size / 1024)} KB)`}
                          >
                            {img.dataUrl ? (
                              <img
                                src={img.dataUrl}
                                alt={img.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                              </div>
                            )}
                            <span className="absolute bottom-0.5 left-0.5 px-1 rounded bg-black/65 text-white text-[9px] font-mono">
                              #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAttachedImages((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/70 text-white hover:bg-red-600 transition cursor-pointer"
                              title={`Gỡ ${img.name}`}
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Chế độ chuyển động ảnh đính kèm qua nhiều phân cảnh */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-semibold text-zinc-600 mr-0.5">
                          Chế độ dựng ảnh:
                        </span>
                        <button
                          type="button"
                          onClick={() => setImageMotionMode('distribute-gallery')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition cursor-pointer ${
                            imageMotionMode === 'distribute-gallery'
                              ? 'bg-zinc-900 text-white border-zinc-950'
                              : 'bg-white text-zinc-700 border-black/[0.1] hover:border-black/[0.2]'
                          }`}
                          title="Phân bổ toàn bộ bộ sưu tập ảnh đã nạp qua từng phân cảnh"
                        >
                          Phân bổ loạt ảnh theo cảnh
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageMotionMode('hybrid-scenes')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition cursor-pointer ${
                            imageMotionMode === 'hybrid-scenes'
                              ? 'bg-zinc-900 text-white border-zinc-950'
                              : 'bg-white text-zinc-700 border-black/[0.1] hover:border-black/[0.2]'
                          }`}
                          title="Kết hợp ảnh gốc với B-Roll đồng bộ theo prompt"
                        >
                          Kết hợp B-Roll mở rộng
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageMotionMode('consistent-anchor')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition cursor-pointer ${
                            imageMotionMode === 'consistent-anchor'
                              ? 'bg-zinc-900 text-white border-zinc-950'
                              : 'bg-white text-zinc-700 border-black/[0.1] hover:border-black/[0.2]'
                          }`}
                          title="Giữ ảnh chủ đạo xuyên suốt các góc máy Dolly/Pan/Orbit"
                        >
                          Giữ ảnh chủ đạo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-700 border border-black/[0.1] text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Chọn nhiều tệp hình ảnh từ máy (tối đa {MAX_ATTACHED_IMAGES})</span>
                    </button>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const rawFiles = Array.from(e.target.files || []);
                      if (rawFiles.length === 0) return;
                      const remaining = MAX_ATTACHED_IMAGES - attachedImages.length;
                      if (remaining <= 0) {
                        setKeyErrorNotice(`Đã đạt giới hạn tối đa ${MAX_ATTACHED_IMAGES} ảnh tư liệu.`);
                        e.target.value = '';
                        return;
                      }
                      const accepted = rawFiles.slice(0, remaining);
                      try {
                        const loaded = await Promise.all(
                          accepted.map(async (file) => ({
                            name: file.name,
                            size: file.size,
                            dataUrl: await compressImageToDataUrl(file),
                          }))
                        );
                        if (!isMountedRef.current) return;
                        setAttachedImages((prev) => {
                          const next = [...prev, ...loaded].slice(0, MAX_ATTACHED_IMAGES);
                          if (next.length >= 2) {
                            setImageMotionMode('distribute-gallery');
                          }
                          return next;
                        });
                        if (rawFiles.length > remaining) {
                          setKeyErrorNotice(`Chỉ nhận tối đa ${MAX_ATTACHED_IMAGES} ảnh tư liệu; đã nạp ${loaded.length} ảnh đầu tiên.`);
                        } else {
                          setKeyErrorNotice(null);
                        }
                      } catch (readErr: any) {
                        setKeyErrorNotice(readErr?.message || 'Không đọc được tệp hình ảnh.');
                      } finally {
                        e.target.value = '';
                      }
                    }}
                  />
                </div>

                {/* 5B. Đính kèm Tệp Âm Thanh (Nhạc nền MP3 / Giọng đọc Master) */}
                <div className="p-3 rounded-xl border border-black/[0.08] bg-zinc-50/70 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-zinc-900 text-[11px] flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tệp âm thanh (MP3, WAV, OGG, M4A, AAC)</span>
                    </span>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-black/[0.08]">
                      <button
                        type="button"
                        data-testid="create-audio-role-bgm"
                        onClick={() => setAttachedAudioRole('bgm')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                          attachedAudioRole === 'bgm'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        Nhạc nền (BGM)
                      </button>
                      <button
                        type="button"
                        data-testid="create-audio-role-voiceover"
                        onClick={() => setAttachedAudioRole('voiceover')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                          attachedAudioRole === 'voiceover'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        Giọng đọc Master
                      </button>
                    </div>
                  </div>
                  {attachedAudio ? (
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-black/[0.08] shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Music className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono text-zinc-900 truncate flex items-center gap-1.5">
                            <span>{attachedAudio.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                attachedAudioRole === 'bgm'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {attachedAudioRole === 'bgm' ? 'BGM Auto-Ducking' : 'Voice Master'}
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-600 font-medium">
                            {(attachedAudio.size / 1024).toFixed(0)} KB
                            {attachedAudio.durationSec ? ` • ${attachedAudio.durationSec}s` : ''} •{' '}
                            {attachedAudio.dataUrl ? 'Đã lưu bền vững' : 'Đã nạp Audio Track'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (attachedAudioUrlRef.current) {
                            URL.revokeObjectURL(attachedAudioUrlRef.current);
                            attachedAudioUrlRef.current = null;
                          }
                          setAttachedAudio(null);
                          if (audioInputRef.current) audioInputRef.current.value = '';
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Gỡ tệp âm thanh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-700 border border-black/[0.1] text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-zinc-500" />
                      <span>
                        Chọn tệp {attachedAudioRole === 'bgm' ? 'nhạc nền MP3/WAV' : 'giọng đọc Master'} từ máy
                      </span>
                    </button>
                  )}
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (attachedAudioUrlRef.current) {
                        URL.revokeObjectURL(attachedAudioUrlRef.current);
                      }
                      const objectUrl = URL.createObjectURL(file);
                      attachedAudioUrlRef.current = objectUrl;
                      setAttachedAudio({ name: file.name, size: file.size, objectUrl });

                      // Đọc DataURL nếu <= 8MB + đo thời lượng AudioContext để không mất nhạc khi reload
                      if (file.size <= 8 * 1024 * 1024) {
                        const reader = new FileReader();
                        reader.onload = async (ev) => {
                          const dataUrl = typeof ev.target?.result === 'string' ? ev.target.result : undefined;
                          let durationSec: number | undefined;
                          try {
                            const arr = await file.arrayBuffer();
                            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                            if (AudioCtx) {
                              const ctx = new AudioCtx();
                              const decoded = await ctx.decodeAudioData(arr);
                              durationSec = Number(decoded.duration.toFixed(1));
                              ctx.close().catch(() => {});
                            }
                          } catch { }
                          setAttachedAudio((prev) =>
                            prev && prev.objectUrl === objectUrl
                              ? { ...prev, dataUrl, durationSec }
                              : prev
                          );
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 5C. HẠ TẦNG MULTI-VIEW 3D (1–5 ẢNH) & 6 CHUẨN 3D THEO GÓI (BYOK) */}
            <MultiView3DBuilderSection
              userPlanTier={userPlanTier}
              aiConfig={aiConfig}
              onUpdateAiConfig={onUpdateAiConfig}
              onOpenAiSettings={onOpenAiSettings}
              promptText={promptText}
              isExpanded={is3DBuilderExpanded}
              onToggleExpand={() => {
                setHas3DToggledManually(true);
                setIs3DBuilderExpanded((prev) => !prev);
              }}
              selectedStyleId={selected3DStyleId}
              onChangeStyleId={setSelected3DStyleId}
              referenceImages={multiViewReferences}
              onChangeReferenceImages={setMultiViewReferences}
              builtAssets={character3dAssets}
              onAssetBuilt={(manifest) =>
                setCharacter3dAssets((prev) => [
                  manifest,
                  ...prev.filter((item) => item.jobId !== manifest.jobId),
                ])
              }
            />

            {/* Thanh tiến trình khi đang tạo */}
            {isGenerating && (
              <div className="space-y-1.5 pt-2 border-t border-black/[0.06]">
                <div className="text-zinc-700 font-mono text-[11px] flex items-center justify-between gap-2">
                  <span className="truncate">{generationStep}</span>
                  <span className="font-semibold text-zinc-950 flex-shrink-0">{generationPercent}%</span>
                </div>
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-zinc-900 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(10, Math.min(100, generationPercent))}%` }}
                  />
                </div>
              </div>
            )}

            {!canStartWorkflow && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <span>
                    {isPure3DWorkflow
                      ? 'Dự án 3D: Cần nhập LLM Key / 3D Engine Key (Mục 5B) hoặc kết nối Plugin (Mục 3) để khởi tạo.'
                      : 'Bắt buộc kết nối Plugin ở mục 3 trước khi gợi ý kịch bản hoặc khởi tạo video.'}
                  </span>
                </div>
                {onOpenAiSettings && (
                  <button
                    type="button"
                    onClick={() => onOpenAiSettings(isPure3DWorkflow ? 'gemini' : 'plugin')}
                    className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10.5px] whitespace-nowrap cursor-pointer"
                  >
                    {isPure3DWorkflow ? 'Cài đặt Keys' : 'Kết nối Plugin'}
                  </button>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-3 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCancelOrClose}
                className="btn-secondary cursor-pointer"
              >
                {isGenerating ? 'Dừng & Đóng' : 'Hủy'}
              </button>

              <div className="flex items-center gap-2">
                {/* Nút 1: Model AI gợi ý kịch bản để xem và chỉnh sửa trước */}
                <button
                  type="button"
                  onClick={handleSuggestScript}
                  disabled={isGenerating || !promptText.trim() || !canStartWorkflow}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-semibold border border-black/[0.12] transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    canStartWorkflow
                      ? 'Cho phép Model AI viết kịch bản phân cảnh để bạn duyệt trước khi dựng video'
                      : 'Cần kết nối Plugin hoặc BYOK Key (3D)'
                  }
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Model AI Gợi Ý Kịch Bản</span>
                </button>

                {/* Nút 2: Gửi thẳng sang Plugin / Hàng chờ dựng 3D BYOK */}
                <button
                  type="submit"
                  disabled={isGenerating || !promptText.trim() || !canStartWorkflow}
                  className={
                    isGenerating || !promptText.trim() || !canStartWorkflow
                      ? 'px-3.5 py-1.5 rounded-lg bg-zinc-200 text-zinc-400 text-xs font-medium cursor-not-allowed border border-black/5 flex items-center gap-1.5'
                      : 'btn-primary cursor-pointer flex items-center gap-1.5 px-4 py-1.5'
                  }
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isGenerating
                      ? 'Đang Khởi Tạo...'
                      : isPure3DWorkflow && !isPluginConnected
                        ? 'Khởi Tạo Phim 3D (BYOK)'
                        : 'Gửi Plugin & Chờ Duyệt'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* WORKFLOW STEP 2: XEM LƯỚT KỊCH BẢN DO MODEL AI GỢI Ý & GỬI SANG PLUGIN */
          <div className="space-y-4 text-xs animate-in fade-in duration-150">
            {/* Header thanh kịch bản */}
            <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200/80 flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-zinc-950 text-xs">
                    Kịch Bản: {suggestedScript?.modelUsed || selectedModel}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-100 text-indigo-900 border border-indigo-300">
                    {previewScenes.length} Phân cảnh
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-white text-zinc-800 border border-black/[0.08]">
                    Tổng: {previewScenes.reduce((acc, s) => acc + Math.max(2, Math.round((s.endSec || 0) - (s.startSec || 0)) || 6), 0)}s
                  </span>
                  {suggestedScript?.tokenTelemetry && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Tokens: {suggestedScript.tokenTelemetry.promptTokens} in / {suggestedScript.tokenTelemetry.completionTokens} out
                      {suggestedScript.tokenTelemetry.failoverTriggered ? ' • Auto-Failover ✓' : ''}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  Chỉnh sửa trực tiếp tiêu đề cảnh, thời lượng, góc máy, lời thoại hoặc thêm/bớt phân cảnh trước khi điều phối sang Plugin.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAddPreviewScene}
                  disabled={isGenerating}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-black text-white text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Thêm phân cảnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkflowStep('input')}
                  disabled={isGenerating}
                  className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-900 text-[11px] font-medium hover:bg-indigo-100 transition cursor-pointer flex items-center gap-1"
                >
                  <span>← Sửa ý tưởng</span>
                </button>
              </div>
            </div>

            {/* Danh sách phân cảnh kịch bản có thể chỉnh sửa */}
            <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
              {previewScenes.map((scene, idx) => {
                const sceneDuration = Math.max(2, Math.round((scene.endSec || 0) - (scene.startSec || 0)) || 6);
                return (
                  <div
                    key={scene.id || idx}
                    className="p-3 rounded-xl bg-white border border-black/[0.08] shadow-2xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] border-b border-black/[0.05] pb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                        <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-mono font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={scene.headline || `Cảnh 0${idx + 1}`}
                          onChange={(e) => handleUpdatePreviewSceneField(scene.id, { headline: e.target.value })}
                          className="flex-1 bg-zinc-50 border border-black/[0.08] rounded-md px-2 py-1 text-[11px] font-semibold text-zinc-900 focus:outline-none focus:border-zinc-950 focus:bg-white transition"
                          aria-label={`Tiêu đề phân cảnh ${idx + 1}`}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
                        <select
                          value={scene.cameraMotion}
                          onChange={(e) =>
                            handleUpdatePreviewSceneField(scene.id, {
                              cameraMotion: e.target.value as StoryboardScene['cameraMotion'],
                            })
                          }
                          className="bg-zinc-50 border border-black/[0.08] rounded-md px-1.5 py-1 text-[10px] text-zinc-800 cursor-pointer focus:outline-none focus:border-zinc-950"
                          title="Chuyển động góc máy"
                        >
                          {CAMERA_MOTION_OPTIONS.map((cam) => (
                            <option key={cam.id} value={cam.id}>
                              {cam.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1 bg-zinc-50 border border-black/[0.08] rounded-md px-1.5 py-0.5">
                          <input
                            type="number"
                            min={2}
                            max={120}
                            value={sceneDuration}
                            onChange={(e) => handleUpdatePreviewSceneDuration(scene.id, Number(e.target.value))}
                            className="w-10 bg-transparent text-center font-mono text-[10.5px] font-semibold text-zinc-900 focus:outline-none"
                            title="Thời lượng cảnh (giây)"
                          />
                          <span>s</span>
                        </div>
                        {previewScenes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeletePreviewScene(scene.id)}
                            className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Xóa cảnh"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-medium text-zinc-500 block mb-0.5">
                        Lời thuyết minh (Voiceover Tiếng Việt):
                      </label>
                      <textarea
                        rows={2}
                        value={scene.voiceover}
                        onChange={(e) =>
                          handleUpdatePreviewSceneField(scene.id, { voiceover: e.target.value })
                        }
                        className="w-full bg-zinc-50 border border-black/[0.08] rounded-lg p-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:bg-white leading-relaxed transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-medium text-zinc-500 block mb-0.5">
                        Mô tả camera & Visual Prompt gửi sang Plugin:
                      </label>
                      <input
                        type="text"
                        value={scene.visualPrompt}
                        onChange={(e) =>
                          handleUpdatePreviewSceneField(scene.id, { visualPrompt: e.target.value })
                        }
                        className="w-full bg-zinc-50 border border-black/[0.08] rounded-lg px-2 py-1 text-[11px] font-mono text-zinc-700 focus:outline-none focus:border-zinc-950 focus:bg-white transition"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bước 3: Chọn Công Cụ Plugin Video Điều Phối */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-black/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 text-xs flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bước 3: Chọn Công cụ trong Plugin để khởi tạo video</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  Sản phẩm sẽ tự động gửi về Hàng Chờ Duyệt
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {PLUGIN_PRESETS.filter((p) => p.id !== 'elevenlabs').map((preset) => {
                  const isChosen = selectedPluginTool === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPluginTool(preset.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${isChosen
                          ? 'bg-white border-zinc-950 shadow-xs ring-1 ring-zinc-950'
                          : 'bg-white/80 border-black/[0.07] hover:border-black/[0.2]'
                        }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <ProviderBrandLogo provider="plugin" pluginBrand={preset.brand} size="xs" withBadge={false} />
                        <span className="font-semibold text-zinc-950 text-[11px] truncate">
                          {preset.name.split(' ')[0]}
                        </span>
                      </div>
                      <span className="text-[9.5px] text-zinc-500 line-clamp-1">{preset.vendor}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thanh tiến trình khi đang dispatch */}
            {isGenerating && (
              <div className="space-y-1.5 pt-2 border-t border-black/[0.06]">
                <div className="text-zinc-700 font-mono text-[11px] flex items-center justify-between gap-2">
                  <span className="truncate">{generationStep}</span>
                  <span className="font-semibold text-zinc-950 flex-shrink-0">{generationPercent}%</span>
                </div>
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-zinc-900 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(10, Math.min(100, generationPercent))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Nút hành động */}
            <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort();
                      abortControllerRef.current = null;
                    }
                    setIsGenerating(false);
                    setWorkflowStep('input');
                  }}
                  className="btn-secondary cursor-pointer"
                >
                  {isGenerating ? 'Dừng & Quay lại' : '← Quay lại ý tưởng'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelOrClose}
                  className="btn-secondary cursor-pointer"
                >
                  {isGenerating ? 'Dừng & Đóng' : 'Đóng'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleDispatchScriptToPlugin}
                disabled={isGenerating || !canStartWorkflow}
                className="btn-primary cursor-pointer flex items-center gap-2 px-5 py-2 font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>
                  {isGenerating
                    ? 'Đang Khởi Tạo Phim...'
                    : isPure3DWorkflow && !isPluginConnected
                      ? 'Khởi Tạo Dự Án 3D & Chờ Duyệt'
                      : 'Gửi Sang Plugin & Chuyển Về Chờ Duyệt'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
