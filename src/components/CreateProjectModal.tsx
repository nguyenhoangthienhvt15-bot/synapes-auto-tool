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
  Info,
} from 'lucide-react';
import {
  PROVIDERS,
  DiscoveredModel,
  isProviderKeyConfigured,
  getProviderApiKey,
  getProviderModels,
  discoverModelsFromKey,
} from '../services/aiModelDiscoveryService';
import { generateAiVideoScript } from '../services/aiScriptGeneratorService';
import { AiProviderDropdown, AiModelDropdown } from './AiProviderDropdown';

interface CreateProjectModalProps {
  skills: Skill[];
  aiConfig: AIProviderConfig;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
  onOpenAiSettings?: (provider?: AIProviderId) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  skills,
  aiConfig,
  onClose,
  onCreateProject,
  onOpenAiSettings,
}) => {
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);
  const [promptText, setPromptText] = useState('');
  const [targetDurationMin, setTargetDurationMin] = useState<number>(8);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);

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

  // Chọn hoặc Hủy chọn phong cách biên tập (Toggle)
  const handleQuickCommandSelect = (cmd: string) => {
    const skill = skills.find((s) => s.command === cmd);
    if (!skill) return;

    if (selectedSkillId === skill.id) {
      // Bấm lần thứ hai: HỦY CHỌN phong cách
      setSelectedSkillId(null);
    } else {
      // Bấm lần đầu: CHỌN phong cách
      setSelectedSkillId(skill.id);
    }
  };

  const activeSkill = skills.find((s) => s.id === selectedSkillId) || null;
  const displaySkillInfo = hoveredSkill || activeSkill;

  const executeGeneration = async () => {
    const finalPrompt = promptText.trim();
    if (!finalPrompt) return;

    setIsGenerating(true);
    setGenerationStep('Đang khởi tạo cấu trúc kịch bản và phân tích dữ liệu chủ đề...');
    setGenerationPercent(15);
    setKeyErrorNotice(null);

    try {
      const apiKey = getProviderApiKey(selectedProvider, aiConfig);
      const endpoint = (aiConfig[selectedProvider as keyof AIProviderConfig] as any)?.endpointUrl;

      const generated = await generateAiVideoScript({
        prompt: finalPrompt,
        skillId: selectedSkillId || undefined,
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

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeGeneration();
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
                Khởi Tạo Dự Án Video
              </h2>
              <p className="text-zinc-500 text-xs">
                Thiết lập khuôn mẫu định dạng, phong cách biên tập và cấu hình mô hình AI
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

        <form onSubmit={handleSubmitCreate} className="space-y-4 text-xs">
          {/* 1. KHUÔN MẪU ĐỊNH DẠNG VIDEO */}
          <div>
            <label className="text-zinc-800 font-semibold block mb-1.5">
              1. Khuôn mẫu định dạng video *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => {
                  setAspectRatio('16:9');
                  setTargetDurationMin(8);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  aspectRatio === '16:9'
                    ? 'border-zinc-950 bg-zinc-50/90 text-zinc-950 shadow-2xs ring-1 ring-zinc-950/5'
                    : 'border-black/[0.08] bg-white text-zinc-600 hover:border-black/[0.18]'
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5 text-zinc-950 text-xs">
                  <Monitor className="w-4 h-4 text-zinc-800" />
                  <span>Khuôn Mẫu Video Dài (16:9)</span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                  Định dạng màn hình ngang 16:9 tiêu chuẩn cho YouTube và các nền tảng truyền hình
                </div>
              </div>

              <div
                onClick={() => {
                  setAspectRatio('9:16');
                  setTargetDurationMin(1);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  aspectRatio === '9:16'
                    ? 'border-zinc-950 bg-zinc-50/90 text-zinc-950 shadow-2xs ring-1 ring-zinc-950/5'
                    : 'border-black/[0.08] bg-white text-zinc-600 hover:border-black/[0.18]'
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5 text-zinc-950 text-xs">
                  <Smartphone className="w-4 h-4 text-zinc-800" />
                  <span>Khuôn Mẫu Video Ngắn (9:16)</span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                  Định dạng màn hình dọc 9:16 tiêu chuẩn cho Shorts, TikTok và Meta Reels
                </div>
              </div>
            </div>
          </div>

          {/* 2. CHỌN PHONG CÁCH BIÊN TẬP (TOGGLE & HOVER TOOLTIP CARD) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="text-zinc-800 font-semibold">2. Phong cách biên tập (Skills)</label>
                <span className="text-[10px] text-zinc-400 font-normal">
                  (Bấm để chọn, bấm lại để hủy)
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {selectedSkillId
                  ? `Đang áp dụng: ${activeSkill?.name || 'Đã chọn'}`
                  : 'Mặc định (Tự do)'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => {
                const isSelected = selectedSkillId === s.id;
                const isHovered = hoveredSkill?.id === s.id;
                return (
                  <div key={s.id} className="relative inline-block">
                    <button
                      type="button"
                      onClick={() => handleQuickCommandSelect(s.command)}
                      onMouseEnter={() => setHoveredSkill(s)}
                      onMouseOver={() => setHoveredSkill(s)}
                      onMouseLeave={() => setHoveredSkill((cur) => (cur?.id === s.id ? null : cur))}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-950 text-white font-medium shadow-2xs ring-1 ring-zinc-950'
                          : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/70 border border-black/[0.06]'
                      }`}
                    >
                      {s.command}
                    </button>

                    {/* Khung thông tin nhỏ tóm tắt nội dung phong cách khi di chuột */}
                    {isHovered && (
                      <div className="absolute left-0 top-full mt-1.5 z-50 w-72 p-2.5 bg-zinc-950 text-white rounded-xl shadow-2xl text-left pointer-events-none border border-white/10 animate-in fade-in zoom-in-95 duration-100">
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
                        {/* Mũi tên chỉ lên */}
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
              rows={4}
              required
              placeholder="Nhập nội dung, đề tài hoặc dàn ý kịch bản bạn muốn sản xuất (Ví dụ: Giới thiệu kiến trúc vi xử lý mới, Phân tích thị trường tài chính, Phim tư liệu lịch sử...)..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-white border border-black/[0.12] rounded-xl p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 leading-relaxed transition"
            />
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
                  title="Mở trang cấu hình API Keys"
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
          <div className="pt-3 border-t border-black/[0.06] flex items-center justify-end gap-2">
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
        </form>
      </div>
    </div>
  );
};
