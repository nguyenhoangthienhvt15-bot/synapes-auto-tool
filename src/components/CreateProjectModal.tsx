import React, { useState, useEffect } from 'react';
import { Skill, Project, AIProviderConfig, AIProviderId } from '../types';
import {
  Sparkles, Monitor, Smartphone, Paperclip, X,
  Cpu, Key, AlertCircle, CheckCircle2, RefreshCw, ExternalLink, ShieldAlert
} from 'lucide-react';
import {
  PROVIDERS, DiscoveredModel,
  isProviderKeyConfigured, getProviderApiKey, getProviderModels,
  discoverModelsFromKey
} from '../services/aiModelDiscoveryService';
import { generateAiVideoScript } from '../services/aiScriptGeneratorService';

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
  const [selectedSkillId, setSelectedSkillId] = useState<string>('sk-1');
  const [promptText, setPromptText] = useState('');
  const [targetDurationMin, setTargetDurationMin] = useState<number>(8); // Mặc định 8 phút cho YouTube
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
    return initialList[0]?.id || PROVIDERS.find((p) => p.id === selectedProvider)?.defaultModel || 'gemini-2.5-flash';
  });

  const [isScanningKey, setIsScanningKey] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [keyErrorNotice, setKeyErrorNotice] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

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
        setScanMessage(`Đã nạp thành công ${res.models.length} Model khả dụng từ API Key!`);
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

  const handleQuickCommandSelect = (cmd: string) => {
    const skill = skills.find((s) => s.command === cmd);
    if (skill) {
      setSelectedSkillId(skill.id);
      setPromptText((prev) => `${skill.command}: ${prev || skill.description}`);
    }
  };

  const handleSimulateCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    // Thông báo nếu chưa gắn Key nhưng vẫn cho phép tiếp tục với Động cơ Đạo Diễn Điện Ảnh Nội Bộ
    const hasKey = isCurrentKeyConfigured;
    if (!hasKey) {
      setScanMessage('⚡ Đang sử dụng Động Cơ Đạo Diễn Điện Ảnh Nội Bộ (Hollywood Studio) để tạo kịch bản...');
    }

    setIsGenerating(true);
    setGenerationStep('Đang khởi tạo kết nối tới Động cơ AI...');
    setKeyErrorNotice(null);

    try {
      const apiKey = getProviderApiKey(selectedProvider, aiConfig);
      const endpoint = (aiConfig[selectedProvider as keyof AIProviderConfig] as any)?.endpointUrl;

      const generated = await generateAiVideoScript({
        prompt: promptText,
        skillId: selectedSkillId,
        skills,
        aspectRatio,
        targetDurationMin,
        provider: selectedProvider,
        model: selectedModel,
        apiKey,
        endpointUrl: endpoint,
        onProgress: (stepText) => {
          setGenerationStep(stepText);
        },
      });

      const now = new Date();
      const projId = `prj-${Date.now()}`;
      const codeNum = Math.floor(100 + Math.random() * 900);

      const provMeta = PROVIDERS.find((p) => p.id === selectedProvider);
      const provName = provMeta?.name || selectedProvider;

      const newProject: Project = {
        id: projId,
        code: `SYN-${codeNum}`,
        title: generated.title,
        status: 'pending_approval',
        aspectRatio,
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
          name: `${provName} (${generated.modelUsed})`,
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

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="studio-card p-6 max-w-xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-black/[0.06] flex items-center justify-center text-zinc-900">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950 tracking-tight">Tạo Dự Án Kịch Bản Mới</h2>
              <p className="text-zinc-500 text-xs">Đồng bộ nhà cung cấp AI & Models thực tế từ API Keys đã gắn</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSimulateCreate} className="space-y-4 text-xs">
          {/* 1. Định dạng xuất bản */}
          <div>
            <label className="text-zinc-800 font-semibold block mb-1.5">1. Định dạng xuất bản *</label>
            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => {
                  setAspectRatio('16:9');
                  setTargetDurationMin(8);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition ${aspectRatio === '16:9'
                    ? 'border-zinc-950 bg-zinc-50/80 text-zinc-950 shadow-2xs'
                    : 'border-black/[0.08] bg-white text-zinc-600 hover:border-black/[0.15]'
                  }`}
              >
                <div className="font-semibold flex items-center gap-1.5 text-zinc-950">
                  <Monitor className="w-3.5 h-3.5 text-zinc-700" /> Video Dài YouTube (16:9)
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">5 – 10 phút theo tiêu chuẩn</div>
              </div>

              <div
                onClick={() => setAspectRatio('9:16')}
                className={`p-3 rounded-lg border cursor-pointer transition ${aspectRatio === '9:16'
                    ? 'border-zinc-950 bg-zinc-50/80 text-zinc-950 shadow-2xs'
                    : 'border-black/[0.08] bg-white text-zinc-600 hover:border-black/[0.15]'
                  }`}
              >
                <div className="font-semibold flex items-center gap-1.5 text-zinc-950">
                  <Smartphone className="w-3.5 h-3.5 text-zinc-700" /> Shorts / TikTok / Reels (9:16)
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Dưới 60s, gắn link tiếp thị</div>
              </div>
            </div>
          </div>

          {/* 2. Chọn Bộ Skill / Lệnh nhanh */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-800 font-semibold">2. Chọn Bộ Skill / Lệnh nhanh</label>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {skills.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => handleQuickCommandSelect(s.command)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${selectedSkillId === s.id
                      ? 'bg-zinc-900 text-white font-medium'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-black/[0.06]'
                    }`}
                >
                  {s.command}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Câu lệnh ý tưởng (Prompt) */}
          <div>
            <label className="text-zinc-800 font-semibold block mb-1">3. Câu lệnh ý tưởng (Prompt) *</label>
            <textarea
              rows={3}
              required
              placeholder="VD: Xây dựng kịch bản video giới thiệu thiết bị công nghệ mới..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-white border border-black/[0.1] rounded-lg p-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 leading-relaxed transition"
            ></textarea>
          </div>

          {/* 4. ĐỘNG CƠ AI & CHỌN MODEL TRONG KEYS (ĐỒNG BỘ THEO API KEYS) */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-black/[0.08] space-y-3">
            <div className="flex items-center justify-between border-b border-black/[0.05] pb-2">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-950 text-xs">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span>4. Động cơ AI & Model (Đồng bộ danh sách từ API Keys) *</span>
              </div>
              {onOpenAiSettings && (
                <button
                  type="button"
                  onClick={() => onOpenAiSettings(selectedProvider)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-950 flex items-center gap-1 cursor-pointer font-medium"
                  title="Mở trang cài đặt nạp API Keys AI Module"
                >
                  <Key className="w-3 h-3 text-zinc-400" />
                  <span>Nạp API Keys</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Bước 1: Chọn Nhà Cung Cấp */}
              <div>
                <label className="text-zinc-700 font-semibold block mb-1 text-[11px]">
                  Bước 1: Chọn Nhà Cung Cấp AI:
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value as AIProviderId)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg p-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 font-medium"
                >
                  {PROVIDERS.map((p) => {
                    const hasKey = isProviderKeyConfigured(p.id, aiConfig);
                    return (
                      <option key={p.id} value={p.id}>
                        {hasKey ? '🟢' : '🔒'} {p.name} {hasKey ? '(Đã gắn API Key)' : '(Chưa gắn API Key)'}
                      </option>
                    );
                  })}
                </select>
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400">{PROVIDERS.find((p) => p.id === selectedProvider)?.vendor}</span>
                  {isCurrentKeyConfigured ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đã gắn API Key
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Chưa có API Key
                    </span>
                  )}
                </div>
              </div>

              {/* Bước 2: Chọn Model trong Keys */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-700 font-semibold text-[11px]">
                    Bước 2: Chọn Model trong Keys:
                  </label>
                  {isCurrentKeyConfigured && (
                    <button
                      type="button"
                      onClick={handleRefreshModelsFromKey}
                      disabled={isScanningKey}
                      className="text-[10px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
                      title="Quét đọc lại danh sách Model trực tiếp từ API Key"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isScanningKey ? 'animate-spin' : ''}`} />
                      <span>{isScanningKey ? 'Đang đọc...' : 'Quét lại Model'}</span>
                    </button>
                  )}
                </div>

                {isCurrentKeyConfigured ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-white border border-black/[0.1] rounded-lg p-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 font-medium"
                  >
                    {modelsList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.tag ? `— ${m.tag}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full bg-zinc-100/90 border border-zinc-200 rounded-lg p-2 text-xs text-zinc-400 italic flex items-center justify-between">
                    <span>(Khóa: Cần gắn API Key trước)</span>
                    <span className="text-[10px] text-amber-600 font-mono font-medium">Locked</span>
                  </div>
                )}

                <div className="mt-1 text-[10px] text-zinc-500">
                  {isCurrentKeyConfigured ? (
                    <span className="text-emerald-700 font-medium">
                      {modelsList.find((m) => m.id === selectedModel)?.isLiveFromKey
                        ? '✓ Model được cấp trực tiếp từ Key của bạn'
                        : `✓ ${modelsList.length} Model khả dụng theo Key`}
                    </span>
                  ) : (
                    <span className="text-amber-600">
                      Gắn API Key của nhà phát triển này để mở khóa Model
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Trạng thái nếu CHƯA gắn API Key */}
            {!isCurrentKeyConfigured && (
              <div className="p-2.5 rounded-lg bg-amber-50/90 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start sm:items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <span className="leading-snug text-[11px]">
                    Bạn chưa gắn API Key cho <strong>{PROVIDERS.find((p) => p.id === selectedProvider)?.name}</strong>. Vui lòng gắn API Key để mở khóa danh sách Model tương ứng.
                  </span>
                </div>
                {onOpenAiSettings && (
                  <button
                    type="button"
                    onClick={() => onOpenAiSettings(selectedProvider)}
                    className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px] whitespace-nowrap transition cursor-pointer shadow-2xs self-start sm:self-auto"
                  >
                    + Gắn API Key Ngay
                  </button>
                )}
              </div>
            )}

            {/* Thông báo quét trực tiếp từ Key */}
            {scanMessage && (
              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>{scanMessage}</span>
              </div>
            )}

            {keyErrorNotice && (
              <div className="p-2 rounded bg-red-50 border border-red-200 text-red-800 text-[11px] flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                <span>{keyErrorNotice}</span>
              </div>
            )}
          </div>

          {/* 5. Tệp đính kèm */}
          <div>
            <label className="text-zinc-800 font-semibold block mb-1">5. Tệp đính kèm (audio/ảnh demo - tùy chọn)</label>
            <div className="flex items-center gap-2">
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
                className="btn-secondary cursor-pointer"
              >
                <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                <span>Chọn tệp</span>
              </button>
              {attachedFileName && (
                <span className="text-zinc-700 font-mono text-[11px] truncate">{attachedFileName}</span>
              )}
            </div>
          </div>

          {/* Thanh tiến trình khi đang tạo */}
          {isGenerating && (
            <div className="space-y-1.5 pt-2 border-t border-black/[0.06]">
              <div className="text-zinc-600 font-mono text-xs flex items-center justify-between">
                <span>{generationStep}</span>
                <span className="animate-pulse">Đang xử lý...</span>
              </div>
              <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-zinc-900 h-full rounded-full w-2/3 animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-2">
            <div>
              {!isCurrentKeyConfigured && (
                <span className="text-[11px] text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Cần gắn API Key trước khi tạo
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
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
                disabled={isGenerating || !isCurrentKeyConfigured}
                className={!isCurrentKeyConfigured
                  ? 'px-3 py-1.5 rounded-lg bg-zinc-200 text-zinc-400 text-xs font-medium cursor-not-allowed border border-black/5 flex items-center gap-1.5'
                  : 'btn-primary cursor-pointer flex items-center gap-1.5'
                }
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{!isCurrentKeyConfigured ? '🔒 Cần Gắn API Key' : 'Tạo Kịch Bản'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
