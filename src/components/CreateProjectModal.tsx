import React, { useState, useEffect, useRef } from 'react';
import {
  Skill,
  Project,
  AIProviderConfig,
  AIProviderId,
  StoryboardScene,
  SocialPlatformFormatId,
  PlatformFormatPreset,
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
import { generateAiVideoScript, GeneratedScriptResult } from '../services/aiScriptGeneratorService';
import { dispatchScriptToPluginEngine } from '../services/pluginWebhookService';
import { AiProviderDropdown, AiModelDropdown, ProviderBrandLogo } from './AiProviderDropdown';

interface CreateProjectModalProps {
  skills: Skill[];
  aiConfig: AIProviderConfig;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
  onOpenAiSettings?: (provider?: AIProviderId) => void;
  onAddSkill?: (newSkill: Skill) => void;
}

const PLATFORM_FORMAT_PRESETS: PlatformFormatPreset[] = [
  {
    id: 'youtube-long-16-9',
    platform: 'youtube',
    platformLabel: 'YouTube',
    title: 'YouTube Video Dài',
    aspectRatio: '16:9',
    displayRatio: '16:9',
    resolution: '1920x1080 (16:9)',
    recommendedMinutes: 8,
    description: 'Màn hình ngang chuẩn YouTube, phân tích chuyên sâu & kể chuyện dài',
    promptStyleHint: 'YouTube 16:9 ngang, kể chuyện có chiều sâu và giữ chân người xem',
  },
  {
    id: 'youtube-shorts-9-16',
    platform: 'youtube',
    platformLabel: 'YouTube',
    title: 'YouTube Shorts',
    aspectRatio: '9:16',
    displayRatio: '9:16',
    resolution: '1080x1920 (9:16)',
    recommendedMinutes: 1,
    description: 'Video dọc dưới 60 giây tối ưu đề xuất YouTube Shorts',
    promptStyleHint: 'YouTube Shorts 9:16 dọc, mở đầu nhanh gọn và súc tích',
  },
  {
    id: 'tiktok-viral-9-16',
    platform: 'tiktok',
    platformLabel: 'TikTok',
    title: 'TikTok Viral',
    aspectRatio: '9:16',
    displayRatio: '9:16',
    resolution: '1080x1920 (9:16)',
    recommendedMinutes: 1,
    description: 'Hook 3 giây đầu, nhịp cắt nhanh & phụ đề dọc cho TikTok',
    promptStyleHint: 'TikTok 9:16 nhịp cắt nhanh, hook 3 giây đầu gây tò mò',
  },
  {
    id: 'instagram-reels-9-16',
    platform: 'instagram',
    platformLabel: 'Instagram',
    title: 'Instagram Reels',
    aspectRatio: '9:16',
    displayRatio: '9:16',
    resolution: '1080x1920 (9:16)',
    recommendedMinutes: 1,
    description: 'Thẩm mỹ điện ảnh, chuyển cảnh mượt tối ưu Instagram Reels',
    promptStyleHint: 'Instagram Reels 9:16 chú trọng bố cục thị giác và chuyển cảnh mượt',
  },
  {
    id: 'instagram-feed-4-5',
    platform: 'instagram',
    platformLabel: 'Instagram',
    title: 'Instagram Feed (4:5)',
    aspectRatio: '9:16',
    displayRatio: '4:5',
    resolution: '1080x1350 (4:5)',
    recommendedMinutes: 1,
    description: 'Khung dọc 4:5 chiếm trọn diện tích bảng tin Instagram Feed',
    promptStyleHint: 'Instagram Feed 4:5 nổi bật giữa khung hình di động',
  },
  {
    id: 'facebook-reels-9-16',
    platform: 'facebook',
    platformLabel: 'Facebook',
    title: 'Facebook Reels',
    aspectRatio: '9:16',
    displayRatio: '9:16',
    resolution: '1080x1920 (9:16)',
    recommendedMinutes: 1,
    description: 'Tăng giữ chân & chia sẻ tự nhiên trên Facebook Reels',
    promptStyleHint: 'Facebook Reels 9:16 dễ đồng cảm, thúc đẩy bình luận và chia sẻ',
  },
  {
    id: 'facebook-watch-16-9',
    platform: 'facebook',
    platformLabel: 'Facebook',
    title: 'Facebook Watch',
    aspectRatio: '16:9',
    displayRatio: '16:9',
    resolution: '1920x1080 (16:9)',
    recommendedMinutes: 5,
    description: 'Video ngang trung-dài tối ưu trang Fanpage & Facebook Watch',
    promptStyleHint: 'Facebook Watch 16:9 dẫn dắt mạch lạc, giữ chân phút đầu',
  },
  {
    id: 'threads-video-9-16',
    platform: 'threads',
    platformLabel: 'Threads',
    title: 'Threads Video',
    aspectRatio: '9:16',
    displayRatio: '9:16',
    resolution: '1080x1920 (9:16)',
    recommendedMinutes: 1,
    description: 'Clip dọc ngắn trực diện, mở màn nhanh gợi thảo luận trên Threads',
    promptStyleHint: 'Threads 9:16 ngắn gọn, đi thẳng trọng tâm kích thích tranh luận',
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

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  skills: initialSkills,
  aiConfig,
  onClose,
  onCreateProject,
  onOpenAiSettings,
  onAddSkill,
}) => {
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [selectedPlatformFormat, setSelectedPlatformFormat] =
    useState<SocialPlatformFormatId>('youtube-long-16-9');
  const [allSkills, setAllSkills] = useState<Skill[]>(initialSkills);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);
  const [promptText, setPromptText] = useState('');
  const [targetDurationMin, setTargetDurationMin] = useState<number>(8);

  // Tách riêng đính kèm Hình ảnh (Data URL đa phương thức) và Tệp Âm thanh (Object URL)
  const [attachedImage, setAttachedImage] = useState<{
    name: string;
    size: number;
    dataUrl: string;
  } | null>(null);
  const [attachedAudio, setAttachedAudio] = useState<{
    name: string;
    size: number;
    objectUrl: string;
  } | null>(null);
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

  // Cơ chế tạo video qua công cụ Plugin: Ý tưởng -> Model AI gợi ý kịch bản -> Gửi sang Plugin -> Chuyển về Chờ Duyệt
  const [workflowStep, setWorkflowStep] = useState<'input' | 'script_preview'>('input');
  const [selectedPluginTool, setSelectedPluginTool] = useState<string>(() => {
    if (aiConfig.plugin?.endpointUrl) {
      const b = detectPluginBrand(aiConfig.plugin.endpointUrl);
      const match = PLUGIN_PRESETS.find((p) => p.brand === b);
      if (match) return match.id;
    }
    return 'kling';
  });
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

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSuggestingScript(true);
    setIsGenerating(true);
    setGenerationStep(`Model AI (${selectedModel}) đang phân tích đề tài & gợi ý kịch bản phân cảnh...`);
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
        platformFormatLabel: `${selectedPlatformPreset.title} (${selectedPlatformPreset.resolution})`,
        targetDurationMin,
        attachedImageDataUrl: attachedImage?.dataUrl,
        attachedImageName: attachedImage?.name,
        attachedAudioUrl: attachedAudio?.objectUrl,
        attachedAudioName: attachedAudio?.name,
        signal: controller.signal,
        provider: selectedProvider,
        model: selectedModel,
        apiKey,
        endpointUrl: endpoint,
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

  // Cập nhật câu thoại của cảnh trong bản xem trước kịch bản
  const handleUpdatePreviewSceneVoiceover = (sceneId: number, text: string) => {
    setPreviewScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, voiceover: text } : s))
    );
  };

  // Cập nhật visual prompt của cảnh trong bản xem trước kịch bản
  const handleUpdatePreviewScenePrompt = (sceneId: number, text: string) => {
    setPreviewScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, visualPrompt: text } : s))
    );
  };

  // Bước 3 & 4: Gửi kịch bản sang công cụ Plugin và chuyển sản phẩm video về Bàn Chờ Duyệt
  const handleDispatchScriptToPlugin = async () => {
    const finalPrompt = promptText.trim();
    if (!finalPrompt) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setKeyErrorNotice(null);

    try {
      let scriptToDispatch = suggestedScript;

      // Nếu chưa chạy gợi ý trước đó, tạo kịch bản ngay
      if (!scriptToDispatch) {
        setGenerationStep(`Model AI (${selectedModel}) đang khởi tạo kịch bản phân cảnh...`);
        setGenerationPercent(18);

        const apiKey = getProviderApiKey(selectedProvider, aiConfig);
        const endpoint = (aiConfig[selectedProvider as keyof AIProviderConfig] as any)?.endpointUrl;

        scriptToDispatch = await generateAiVideoScript({
          prompt: finalPrompt,
          skillId: selectedSkillId || undefined,
          skills: allSkills,
          aspectRatio,
          platformFormat: selectedPlatformFormat,
          platformFormatLabel: `${selectedPlatformPreset.title} (${selectedPlatformPreset.resolution})`,
          targetDurationMin,
          attachedImageDataUrl: attachedImage?.dataUrl,
          attachedImageName: attachedImage?.name,
          attachedAudioUrl: attachedAudio?.objectUrl,
          attachedAudioName: attachedAudio?.name,
          signal: controller.signal,
          provider: selectedProvider,
          model: selectedModel,
          apiKey,
          endpointUrl: endpoint,
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
        scriptToDispatch = {
          ...scriptToDispatch,
          storyboard: previewScenes,
        };
      }

      const provMeta = PROVIDERS.find((p) => p.id === selectedProvider);
      const pluginPreset = PLUGIN_PRESETS.find((p) => p.id === selectedPluginTool) || PLUGIN_PRESETS[0];
      const pluginEndpoint =
        selectedPluginTool === 'custom'
          ? aiConfig.plugin?.endpointUrl || pluginPreset.endpointUrl
          : pluginPreset.endpointUrl;
      const pluginToken = aiConfig.plugin?.apiToken;

      const result = await dispatchScriptToPluginEngine({
        scriptResult: scriptToDispatch,
        aspectRatio,
        platformFormat: selectedPlatformFormat,
        platformFormatLabel: `${selectedPlatformPreset.title} (${selectedPlatformPreset.resolution})`,
        targetChannels: [selectedPlatformPreset.platform],
        attachedImageDataUrl: attachedImage?.dataUrl,
        attachedAudioUrl: attachedAudio?.objectUrl,
        signal: controller.signal,
        scriptModelName: selectedModel,
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
      onCreateProject(result.project);
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

              <div className="grid grid-cols-2 gap-2.5">
                <div
                  onClick={() => {
                    setAspectRatio('16:9');
                    if (selectedPlatformPreset.aspectRatio !== '16:9') {
                      setSelectedPlatformFormat('youtube-long-16-9');
                      setTargetDurationMin(8);
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
                    Định dạng màn hình ngang 16:9 tiêu chuẩn cho YouTube và Facebook Watch
                  </div>
                </div>

                <div
                  onClick={() => {
                    setAspectRatio('9:16');
                    if (selectedPlatformPreset.aspectRatio !== '9:16') {
                      setSelectedPlatformFormat('tiktok-viral-9-16');
                      setTargetDurationMin(1);
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
                    Định dạng dọc chuẩn Shorts, TikTok, Instagram Reels, Facebook Reels & Threads
                  </div>
                </div>
              </div>

              {/* Chọn định dạng chi tiết theo nền tảng mạng xã hội */}
              <div className="pt-1">
                <div className="text-[11px] font-medium text-zinc-600 mb-1.5 flex items-center justify-between">
                  <span>Định dạng tối ưu theo nền tảng xuất bản (Instagram, Facebook, TikTok, YouTube, Threads):</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PLATFORM_FORMAT_PRESETS.map((preset) => {
                    const isSelected = selectedPlatformFormat === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlatformFormat(preset.id);
                          setAspectRatio(preset.aspectRatio);
                          setTargetDurationMin(preset.recommendedMinutes);
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

            {/* 3. CHỦ ĐỀ HOẶC KỊCH BẢN NỘI DUNG */}
            <div className="space-y-1.5">
              <label className="text-zinc-800 font-semibold block">
                3. Chủ đề hoặc Kịch bản nội dung *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Nhập nội dung, đề tài hoặc dàn ý kịch bản bạn muốn sản xuất (Ví dụ: Giới thiệu kiến trúc vi xử lý mới, Phân tích thị trường tài chính, Phim tư liệu lịch sử...)..."
                value={promptText}
                onChange={(e) => {
                  setPromptText(e.target.value);
                  if (suggestedScript) {
                    setSuggestedScript(null);
                    setPreviewScenes([]);
                  }
                }}
                className="w-full bg-white border border-black/[0.12] rounded-xl p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 leading-relaxed transition"
              />
            </div>

            {/* 4. CƠ CHẾ PLUGIN & MÔ HÌNH AI BIÊN KỊCH */}
            <div className="p-3.5 rounded-xl bg-zinc-50/90 border border-black/[0.08] space-y-3">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-950 text-xs">
                  <Workflow className="w-3.5 h-3.5 text-indigo-600" />
                  <span>4. Quy trình Model AI gợi ý kịch bản & Công cụ Plugin tạo video</span>
                </div>
                {onOpenAiSettings && (
                  <button
                    type="button"
                    onClick={() => onOpenAiSettings(selectedProvider)}
                    className="text-[11px] text-zinc-600 hover:text-zinc-950 flex items-center gap-1 cursor-pointer font-medium"
                    title="Mở trang cấu hình API Keys"
                  >
                    <Key className="w-3 h-3 text-zinc-500" />
                    <span>Quản lý API Keys</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              {/* Breadcrumb quy trình 4 bước */}
              <div className="grid grid-cols-4 gap-1.5 p-2 bg-white rounded-lg border border-black/[0.05] text-[10.5px]">
                <div className="flex items-center gap-1.5 text-zinc-800 font-semibold">
                  <span className="w-4 h-4 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[9px] font-mono">1</span>
                  <span className="truncate">Ý tưởng</span>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-mono">2</span>
                  <span className="truncate">Model AI</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-mono">3</span>
                  <span className="truncate">Plugin Tool</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                  <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[9px] font-mono">4</span>
                  <span className="truncate">Chờ Duyệt</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bước 2: Model AI gợi ý kịch bản */}
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

                {/* Bước 3: Công cụ Plugin Video */}
                <div className="space-y-1.5">
                  <label className="text-zinc-800 font-semibold block text-[11px] flex items-center gap-1.5">
                    <Workflow className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Công cụ trong Plugin nhận kịch bản</span>
                  </label>

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

                  {/* Plugin card details */}
                  {(() => {
                    const activePreset = PLUGIN_PRESETS.find((p) => p.id === selectedPluginTool) || PLUGIN_PRESETS[0];
                    return (
                      <div className="p-2.5 rounded-lg bg-white border border-black/[0.06] text-[11px] space-y-1 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <ProviderBrandLogo provider="plugin" pluginBrand={activePreset.brand} size="xs" withBadge={false} />
                          <span className="font-semibold text-zinc-950">{activePreset.name}</span>
                          <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 ml-auto">
                            Đã sẵn sàng
                          </span>
                        </div>
                        <p className="text-[10.5px] text-zinc-500 leading-snug line-clamp-2">
                          {activePreset.description}
                        </p>
                      </div>
                    );
                  })()}
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

            {/* 5. TƯ LIỆU ĐÍNH KÈM (TÁCH RIÊNG ẢNH & AUDIO) */}
            <div className="space-y-2 pt-1 border-t border-black/[0.06]">
              <label className="text-zinc-800 font-semibold block text-xs">
                5. Tư liệu đính kèm (Tùy chọn)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 5A. Đính kèm Hình Ảnh */}
                <div className="p-3 rounded-xl border border-black/[0.08] bg-zinc-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 text-[11px] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                      <span>Hình ảnh tư liệu (PNG, JPG, WebP)</span>
                    </span>
                  </div>
                  {attachedImage ? (
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-black/[0.08] shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {attachedImage.dataUrl ? (
                          <img
                            src={attachedImage.dataUrl}
                            alt={attachedImage.name}
                            className="w-8 h-8 rounded object-cover border border-black/[0.08] flex-shrink-0"
                          />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono text-zinc-900 truncate">
                            {attachedImage.name}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-medium">
                            {(attachedImage.size / 1024).toFixed(0)} KB • Đã nạp ảnh cho AI Vision
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedImage(null);
                          if (imageInputRef.current) imageInputRef.current.value = '';
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Gỡ ảnh đã chọn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-700 border border-black/[0.1] text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Chọn tệp hình ảnh từ máy</span>
                    </button>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const dataUrl = await compressImageToDataUrl(file);
                        if (!isMountedRef.current) return;
                        setAttachedImage({ name: file.name, size: file.size, dataUrl });
                        setKeyErrorNotice(null);
                      } catch (readErr: any) {
                        setKeyErrorNotice(readErr?.message || 'Không đọc được tệp hình ảnh.');
                      }
                    }}
                  />
                </div>

                {/* 5B. Đính kèm Tệp Âm Thanh */}
                <div className="p-3 rounded-xl border border-black/[0.08] bg-zinc-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 text-[11px] flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tệp âm thanh / Voice (MP3, WAV, AAC)</span>
                    </span>
                  </div>
                  {attachedAudio ? (
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-black/[0.08] shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Music className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono text-zinc-900 truncate">
                            {attachedAudio.name}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-medium">
                            {(attachedAudio.size / 1024).toFixed(0)} KB • Đã nạp Audio Track
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
                      <span>Chọn tệp âm thanh từ máy</span>
                    </button>
                  )}
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
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
                    }}
                  />
                </div>
              </div>
            </div>

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
                  disabled={isGenerating || !promptText.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-semibold border border-black/[0.12] transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cho phép Model AI viết kịch bản phân cảnh để bạn duyệt trước khi gửi sang Plugin"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Model AI Gợi Ý Kịch Bản</span>
                </button>

                {/* Nút 2: Gửi thẳng sang Plugin và chuyển về Hàng Chờ Duyệt */}
                <button
                  type="submit"
                  disabled={isGenerating || !promptText.trim()}
                  className={
                    isGenerating || !promptText.trim()
                      ? 'px-3.5 py-1.5 rounded-lg bg-zinc-200 text-zinc-400 text-xs font-medium cursor-not-allowed border border-black/5 flex items-center gap-1.5'
                      : 'btn-primary cursor-pointer flex items-center gap-1.5 px-4 py-1.5'
                  }
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'Đang Khởi Tạo...' : 'Gửi Plugin & Chờ Duyệt'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* WORKFLOW STEP 2: XEM LƯỚT KỊCH BẢN DO MODEL AI GỢI Ý & GỬI SANG PLUGIN */
          <div className="space-y-4 text-xs animate-in fade-in duration-150">
            {/* Header thanh kịch bản */}
            <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200/80 flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-950 text-xs">
                    Kịch Bản Được Gợi Ý Bởi {PROVIDERS.find((p) => p.id === selectedProvider)?.name} ({selectedModel})
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-100 text-indigo-900 border border-indigo-300">
                    {previewScenes.length} Phân cảnh
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  Bạn có thể đọc lướt, chỉnh sửa câu thoại hoặc visual prompt của từng cảnh trước khi điều phối sang công cụ Plugin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWorkflowStep('input')}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-900 text-[11px] font-medium hover:bg-indigo-100 transition cursor-pointer flex items-center gap-1"
              >
                <span>← Sửa ý tưởng</span>
              </button>
            </div>

            {/* Danh sách phân cảnh kịch bản có thể chỉnh sửa */}
            <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
              {previewScenes.map((scene, idx) => (
                <div
                  key={scene.id || idx}
                  className="p-3 rounded-xl bg-white border border-black/[0.08] shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] border-b border-black/[0.05] pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-mono font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-zinc-900 truncate">
                        {scene.headline || `Cảnh 0${idx + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
                      <span>{scene.cameraMotion}</span>
                      <span>•</span>
                      <span>{(scene.endSec - scene.startSec) || 8}s</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-zinc-500 block mb-0.5">
                      Lời thuyết minh (Voiceover Tiếng Việt):
                    </label>
                    <textarea
                      rows={2}
                      value={scene.voiceover}
                      onChange={(e) => handleUpdatePreviewSceneVoiceover(scene.id, e.target.value)}
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
                      onChange={(e) => handleUpdatePreviewScenePrompt(scene.id, e.target.value)}
                      className="w-full bg-zinc-50 border border-black/[0.08] rounded-lg px-2 py-1 text-[11px] font-mono text-zinc-700 focus:outline-none focus:border-zinc-950 focus:bg-white transition"
                    />
                  </div>
                </div>
              ))}
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                disabled={isGenerating}
                className="btn-primary cursor-pointer flex items-center gap-2 px-5 py-2 font-bold shadow-xs"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>
                  {isGenerating ? 'Đang Tạo Video Qua Plugin...' : 'Gửi Sang Plugin & Chuyển Về Chờ Duyệt'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
