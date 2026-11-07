import React, { useState, useEffect } from 'react';
import { Skill, Project, AIProviderConfig, AIProviderId } from '../types';
import {
  Sparkles,
  Monitor,
  Smartphone,
  Paperclip,
  X,
  Cpu,
  Key,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Shuffle,
  Radio,
  Newspaper,
} from 'lucide-react';
import {
  PROVIDERS,
  DiscoveredModel,
  isProviderKeyConfigured,
  getProviderApiKey,
  getProviderModels,
  discoverModelsFromKey,
} from '../services/aiModelDiscoveryService';
import {
  generateAiVideoScript,
  RANDOM_TOPIC_PRESETS,
  RandomTopicPreset,
} from '../services/aiScriptGeneratorService';
import { AiProviderDropdown, AiModelDropdown } from './AiProviderDropdown';

interface CreateProjectModalProps {
  skills: Skill[];
  aiConfig: AIProviderConfig;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
  onOpenAiSettings?: (provider?: AIProviderId) => void;
}

const TOPIC_CATEGORIES = [
  'Thời sự Quốc tế',
  'Tài chính & Vĩ mô',
  'Khoa học & Vũ trụ',
  'Lịch sử & Hồ sơ',
  'Ẩm thực & Du lịch',
  'Công nghệ & AI',
] as const;

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  skills,
  aiConfig,
  onClose,
  onCreateProject,
  onOpenAiSettings,
}) => {
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [selectedSkillId, setSelectedSkillId] = useState<string>(
    () => skills.find((s) => s.command === '/daily-news')?.id || skills[0]?.id || 'skill-news'
  );
  const [promptText, setPromptText] = useState('');
  const [targetDurationMin, setTargetDurationMin] = useState<number>(8);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [activeTopicCategory, setActiveTopicCategory] = useState<string | null>(null);
  const [lastPresetId, setLastPresetId] = useState<string | null>(null);
  const [isLoadingLiveNews, setIsLoadingLiveNews] = useState(false);

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

  const applySkillByCommand = (cmd: string) => {
    const skill = skills.find((s) => s.command === cmd);
    if (skill) {
      setSelectedSkillId(skill.id);
    }
  };

  const handleQuickCommandSelect = (cmd: string) => {
    const skill = skills.find((s) => s.command === cmd);
    if (!skill) return;
    setSelectedSkillId(skill.id);
    setPromptText((prev) => {
      const stripped = prev.replace(/^\/[a-z0-9-_]+:\s*/i, '').trim();
      if (!stripped) return '';
      return stripped;
    });
  };

  const applyRandomPreset = (categoryFilter?: string): RandomTopicPreset => {
    const pool = categoryFilter
      ? RANDOM_TOPIC_PRESETS.filter((item) => item.category === categoryFilter)
      : RANDOM_TOPIC_PRESETS;
    const filtered = pool.filter((item) => item.id !== lastPresetId);
    const source = filtered.length > 0 ? filtered : pool;
    const picked = source[Math.floor(Math.random() * source.length)] || RANDOM_TOPIC_PRESETS[0];

    setLastPresetId(picked.id);
    setActiveTopicCategory(picked.category);
    setPromptText(picked.prompt);
    applySkillByCommand(picked.suggestedCommand);
    return picked;
  };

  const handlePickLiveBreakingNews = async (): Promise<string> => {
    setIsLoadingLiveNews(true);
    applySkillByCommand('/daily-news');
    setActiveTopicCategory('Thời sự Quốc tế');
    try {
      const queries = [
        'thời sự thế giới địa chính trị mới nhất',
        'tin nóng quốc tế kinh tế quân sự hôm nay',
        'biến động kinh tế thế giới giá vàng dầu mỏ',
      ];
      const q = queries[Math.floor(Math.random() * queries.length)];
      const resp = await fetch(`/api/topic-research?q=${encodeURIComponent(q)}`);
      if (resp.ok) {
        const data = await resp.json();
        const headlines: Array<{ title: string; source?: string }> = Array.isArray(data?.headlines)
          ? data.headlines
          : [];
        if (headlines.length > 0) {
          const item = headlines[Math.floor(Math.random() * Math.min(headlines.length, 6))];
          const cleanHeadline = String(item.title || '')
            .replace(/\s+-\s+[^-]+$/, '')
            .trim();
          if (cleanHeadline.length > 8) {
            const nextPrompt = `Tạo bản tin thời sự phân tích chuyên sâu: ${cleanHeadline}`;
            setPromptText(nextPrompt);
            setScanMessage(
              `Đã lấy tin nóng trực tiếp${item.source ? ` từ ${item.source}` : ''}: "${cleanHeadline}"`
            );
            return nextPrompt;
          }
        }
      }
    } catch {
      // Fallback sang kho chủ đề thời sự chuẩn bên dưới
    } finally {
      setIsLoadingLiveNews(false);
    }

    const fallback = applyRandomPreset('Thời sự Quốc tế');
    return fallback.prompt;
  };

  const executeGeneration = async (overridePrompt?: string) => {
    const finalPrompt = (overridePrompt ?? promptText).trim();
    if (!finalPrompt) return;

    if (!isCurrentKeyConfigured) {
      setScanMessage(
        'Đang khởi chạy Động cơ Biên kịch Báo chí & Điện ảnh Thời gian thực (tự động tra cứu Google News RSS & Wikipedia)...'
      );
    }

    setIsGenerating(true);
    setGenerationStep('Đang kết nối Động cơ AI & phân tích chủ đề thực tế...');
    setGenerationPercent(15);
    setKeyErrorNotice(null);

    try {
      const apiKey = getProviderApiKey(selectedProvider, aiConfig);
      const endpoint = (aiConfig[selectedProvider as keyof AIProviderConfig] as any)?.endpointUrl;

      const generated = await generateAiVideoScript({
        prompt: finalPrompt,
        skillId: selectedSkillId,
        skills,
        aspectRatio,
        targetDurationMin,
        provider: selectedProvider,
        model: selectedModel,
        apiKey,
        endpointUrl: endpoint,
        onProgress: (stepText, pct) => {
          setGenerationStep(stepText);
          if (typeof pct === 'number') {
            setGenerationPercent(pct);
          }
        },
      });

      const now = new Date();
      const projId = `prj-${Date.now()}`;
      const codeNum = Math.floor(100 + Math.random() * 900);

      const newProject: Project = {
        id: projId,
        code: `SYN-${codeNum}`,
        title: generated.title,
        status: 'pending_approval',
        aspectRatio,
        videoGenre: generated.videoGenre,
        newsTickerText: generated.newsTickerText,
        duration: generated.duration,
        targetChannels: aspectRatio === '16:9' ? ['youtube'] : ['tiktok', 'facebook'],
        videoUrl: generated.videoUrl,
        thumbnailUrl: generated.thumbnailUrl,
        musicTrack: generated.musicTrack,
        voiceoverTrack: generated.voiceoverTrack,
        metadata: {
          title: generated.title,
          description: generated.description,
          tags: generated.tags,
          productLink: generated.productLink,
        },
        aiSource: {
          type: selectedProvider,
          name: `${generated.providerUsed} (${generated.modelUsed})`,
          model: generated.modelUsed,
          pluginUrl: selectedProvider === 'plugin' ? aiConfig.plugin?.endpointUrl : undefined,
        },
        createdAt: now.toISOString(),
        storyboard: generated.storyboard,
      };

      onCreateProject(newProject);
      setIsGenerating(false);
      onClose();
    } catch (err: any) {
      console.error('Error generating AI video script:', err);
      setIsGenerating(false);
      setKeyErrorNotice(err?.message || 'Có lỗi xảy ra khi tạo kịch bản video.');
    }
  };

  const handleSimulateCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeGeneration();
  };

  const handleOneClickRandomNewsBroadcast = async () => {
    if (isGenerating) return;
    const chosenPrompt = await handlePickLiveBreakingNews();
    await executeGeneration(chosenPrompt);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isGenerating]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
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
                Khởi Tạo Dự Án Video & Bản Tin Đa Lĩnh Vực
              </h2>
              <p className="text-zinc-500 text-xs">
                Tự động nghiên cứu tin tức thời gian thực, đồng bộ nhà cung cấp AI & hình ảnh đúng 100% chủ đề
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSimulateCreate} className="space-y-4 text-xs">
          {/* 1. Định dạng xuất bản */}
          <div>
            <label className="text-zinc-800 font-semibold block mb-1.5">1. Định dạng khung hình *</label>
            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => {
                  setAspectRatio('16:9');
                  setTargetDurationMin(8);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  aspectRatio === '16:9'
                    ? 'border-zinc-950 bg-zinc-50/90 text-zinc-950 shadow-2xs'
                    : 'border-black/[0.08] bg-white text-zinc-600 hover:border-black/[0.18]'
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5 text-zinc-950">
                  <Monitor className="w-3.5 h-3.5 text-zinc-700" /> Bản Tin / YouTube Ngang (16:9)
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Chuẩn truyền hình HD, phỏng vấn, phim tài liệu & đánh giá sâu
                </div>
              </div>

              <div
                onClick={() => {
                  setAspectRatio('9:16');
                  setTargetDurationMin(1);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  aspectRatio === '9:16'
                    ? 'border-zinc-950 bg-zinc-50/90 text-zinc-950 shadow-2xs'
                    : 'border-black/[0.08] bg-white text-zinc-600 hover:border-black/[0.18]'
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5 text-zinc-950">
                  <Smartphone className="w-3.5 h-3.5 text-zinc-700" /> Shorts / TikTok / Reels Dọc (9:16)
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Điểm tin nhanh 60s, nhịp cắt dồn dập giữ chân người xem
                </div>
              </div>
            </div>
          </div>

          {/* 2. Chọn Bộ Skill / Phong cách đạo diễn */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-zinc-800 font-semibold">2. Phong cách biên tập (Skills)</label>
              <span className="text-[10px] text-zinc-400 font-mono">
                Đang chọn: {skills.find((s) => s.id === selectedSkillId)?.name || 'Mặc định'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => handleQuickCommandSelect(s.command)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition cursor-pointer ${
                    selectedSkillId === s.id
                      ? 'bg-zinc-900 text-white font-medium shadow-2xs'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950 border border-black/[0.06]'
                  }`}
                  title={s.description}
                >
                  {s.command}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Câu lệnh ý tưởng & Bộ tạo Bản tin Ngẫu nhiên */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-zinc-800 font-semibold">
                3. Chủ đề hoặc Câu lệnh kịch bản (Mọi lĩnh vực) *
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePickLiveBreakingNews}
                  disabled={isLoadingLiveNews || isGenerating}
                  className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100/80 text-red-700 border border-red-200/80 text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Quét tin nóng thực tế mới nhất từ Google News RSS"
                >
                  <Radio className={`w-3 h-3 text-red-600 ${isLoadingLiveNews ? 'animate-spin' : 'animate-pulse'}`} />
                  <span>{isLoadingLiveNews ? 'Đang lấy tin...' : 'Lấy Tin Nóng Live'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyRandomPreset()}
                  disabled={isGenerating}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border border-black/[0.08] text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Đổi ngẫu nhiên một chủ đề hấp dẫn từ 6 lĩnh vực"
                >
                  <Shuffle className="w-3 h-3 text-zinc-700" />
                  <span>Đổi Chủ Đề Ngẫu Nhiên</span>
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              required
              placeholder='Nhập bất kỳ chủ đề nào (VD: "Tạo bản tin về tình hình chiến sự Iran và Mỹ", "Biến động giá vàng thế giới", "Giải mã Kim Tự Tháp Ai Cập", hoặc gõ "Tạo bản tin ngẫu nhiên")...'
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-white border border-black/[0.12] rounded-xl p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 leading-relaxed transition"
            />

            {/* Các chip chọn nhanh theo Lĩnh vực */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-zinc-400 font-mono mr-0.5">Gợi ý nhanh:</span>
              {TOPIC_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => applyRandomPreset(cat)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition cursor-pointer ${
                    activeTopicCategory === cat
                      ? 'bg-sky-50 text-sky-800 border-sky-300 font-semibold'
                      : 'bg-white text-zinc-600 border-black/[0.08] hover:border-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 4. ĐỘNG CƠ AI & CHỌN MODEL CÓ LOGO THƯƠNG HIỆU */}
          <div className="p-3.5 rounded-xl bg-zinc-50/90 border border-black/[0.08] space-y-3">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-950 text-xs">
                <Cpu className="w-3.5 h-3.5 text-sky-700" />
                <span>4. Nhà cung cấp AI & Mô hình ngôn ngữ</span>
              </div>
              {onOpenAiSettings && (
                <button
                  type="button"
                  onClick={() => onOpenAiSettings(selectedProvider)}
                  className="text-[11px] text-zinc-600 hover:text-zinc-950 flex items-center gap-1 cursor-pointer font-medium"
                  title="Mở trang cấu hình nạp API Keys AI Module"
                >
                  <Key className="w-3 h-3 text-zinc-500" />
                  <span>Quản lý API Keys</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Bước 1: Chọn Nhà Cung Cấp AI (Có Logo Thương Hiệu Vector SVG) */}
              <div>
                <label className="text-zinc-700 font-semibold block mb-1.5 text-[11px]">
                  Bước 1: Chọn Nhà Cung Cấp AI
                </label>
                <AiProviderDropdown
                  providers={PROVIDERS}
                  selectedProvider={selectedProvider}
                  aiConfig={aiConfig}
                  onSelect={(prov) => setSelectedProvider(prov)}
                />
              </div>

              {/* Bước 2: Chọn Model trong Keys */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-zinc-700 font-semibold text-[11px]">
                    Bước 2: Chọn Model thực thi
                  </label>
                  {isCurrentKeyConfigured && (
                    <button
                      type="button"
                      onClick={handleRefreshModelsFromKey}
                      disabled={isScanningKey}
                      className="text-[10px] text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer font-medium"
                      title="Quét đọc lại danh sách Model trực tiếp từ API Key"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isScanningKey ? 'animate-spin' : ''}`} />
                      <span>{isScanningKey ? 'Đang quét...' : 'Quét lại từ Key'}</span>
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

            {/* Trạng thái nếu CHƯA gắn API Key cho nhà cung cấp đang chọn */}
            {!isCurrentKeyConfigured && (
              <div className="p-2.5 rounded-lg bg-amber-50/90 border border-amber-200/90 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start sm:items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <span className="leading-snug text-[11px]">
                    <strong>{PROVIDERS.find((p) => p.id === selectedProvider)?.name}</strong> chưa gắn API Key. Hệ thống vẫn cho phép tạo ngay bằng <strong>Động cơ Biên kịch Thời sự & Điện ảnh Nội bộ</strong>, hoặc bạn có thể gắn Key để gọi trực tiếp LLM hãng.
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

          {/* 5. Tệp đính kèm */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-zinc-700 font-semibold">5. Tư liệu đính kèm (tùy chọn):</span>
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'audio/*,image/*';
                  input.onchange = (ev: any) => {
                    if (ev.target.files?.[0]) {
                      setAttachedFileName(ev.target.files[0].name);
                    }
                  };
                  input.click();
                }}
                className="btn-secondary cursor-pointer py-1 px-2.5 text-[11px]"
              >
                <Paperclip className="w-3 h-3 text-zinc-500" />
                <span>Đính kèm ảnh/audio</span>
              </button>
              {attachedFileName && (
                <span className="text-zinc-700 font-mono text-[11px] truncate max-w-[200px]">
                  {attachedFileName}
                </span>
              )}
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
              onClick={handleOneClickRandomNewsBroadcast}
              disabled={isGenerating || isLoadingLiveNews}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Tự động săn tin nóng mới nhất và dựng ngay một dự án Bản tin 24h hoàn chỉnh"
            >
              <Newspaper className="w-3.5 h-3.5 text-sky-700" />
              <span>Tạo Bản Tin Ngẫu Nhiên 1-Chạm</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="btn-secondary cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isGenerating || !promptText.trim()}
                className={
                  isGenerating || !promptText.trim()
                    ? 'px-3.5 py-1.5 rounded-lg bg-zinc-200 text-zinc-400 text-xs font-medium cursor-not-allowed border border-black/5 flex items-center gap-1.5'
                    : 'btn-primary cursor-pointer flex items-center gap-1.5 px-4 py-1.5'
                }
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGenerating ? 'Đang Dựng Dự Án...' : 'Tạo Kịch Bản & Video'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
