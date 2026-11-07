import React, { useState, useEffect, useRef } from 'react';
import { Skill, Project, AIProviderConfig, AIProviderId } from '../types';
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
  onAddSkill?: (newSkill: Skill) => void;
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
  const [allSkills, setAllSkills] = useState<Skill[]>(initialSkills);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);
  const [promptText, setPromptText] = useState('');
  const [targetDurationMin, setTargetDurationMin] = useState<number>(8);

  // Tách riêng đính kèm Hình ảnh và Tệp Âm thanh
  const [attachedImage, setAttachedImage] = useState<{ name: string; size: number } | null>(null);
  const [attachedAudio, setAttachedAudio] = useState<{ name: string; size: number } | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

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
        skills: allSkills,
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
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition cursor-pointer flex items-center gap-1 ${
                        isSelected
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
                      <ImageIcon className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono text-zinc-900 truncate">
                          {attachedImage.name}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {(attachedImage.size / 1024).toFixed(0)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
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
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAttachedImage({ name: file.name, size: file.size });
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
                        <div className="text-[10px] text-zinc-400">
                          {(attachedAudio.size / 1024).toFixed(0)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedAudio(null)}
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
                    if (file) setAttachedAudio({ name: file.name, size: file.size });
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
