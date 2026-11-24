import React, { useRef, useState } from 'react';
import {
  AIProviderConfig,
  AIProviderId,
  Asset3DManifest,
  Byok3DEngineProvider,
  CharacterViewSlot,
  ContractCategory,
  Model3DStyleId,
  MultiViewReferenceImage,
} from '../types';
import {
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  ExternalLink,
  Key,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { BYOK_3D_ENGINE_PRESETS } from '../services/aiModelDiscoveryService';
import {
  computeGeometryConfidence,
  is3DStyleAllowedForTier,
  MODEL_3D_STYLE_CATALOG,
  prepareMultiViewLosslessSlot,
  Reconstruct3DResponse,
  resolveActiveByokLlmCredentials,
  submitMultiView3DReconstruction,
  VIEW_SLOT_DEFINITIONS,
} from '../services/multiView3dService';

interface MultiView3DBuilderSectionProps {
  userPlanTier: ContractCategory;
  aiConfig: AIProviderConfig;
  onUpdateAiConfig?: (config: AIProviderConfig) => void;
  onOpenAiSettings?: (provider?: AIProviderId) => void;
  promptText: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedStyleId: Model3DStyleId;
  onChangeStyleId: (styleId: Model3DStyleId) => void;
  referenceImages: MultiViewReferenceImage[];
  onChangeReferenceImages: (images: MultiViewReferenceImage[]) => void;
  builtAssets: Asset3DManifest[];
  onAssetBuilt: (manifest: Asset3DManifest) => void;
}

export const MultiView3DBuilderSection: React.FC<MultiView3DBuilderSectionProps> = ({
  userPlanTier,
  aiConfig,
  onUpdateAiConfig,
  onOpenAiSettings,
  promptText,
  isExpanded,
  onToggleExpand,
  selectedStyleId,
  onChangeStyleId,
  referenceImages,
  onChangeReferenceImages,
  builtAssets,
  onAssetBuilt,
}) => {
  const slotInputRefs = useRef<Partial<Record<CharacterViewSlot, HTMLInputElement | null>>>({});
  const [characterName, setCharacterName] = useState('Nhân vật chính 3D');
  const [inline3DProvider, setInline3DProvider] = useState<Byok3DEngineProvider>(
    aiConfig.threeDEngine?.provider || 'huggingface-zerogpu'
  );
  const [inline3DApiKey, setInline3DApiKey] = useState(aiConfig.threeDEngine?.apiKey || '');
  const [inline3DWorkerUrl, setInline3DWorkerUrl] = useState(
    aiConfig.threeDEngine?.workerUrl || ''
  );
  const [slotLoading, setSlotLoading] = useState<CharacterViewSlot | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [isReconstructing, setIsReconstructing] = useState(false);
  const [buildResponse, setBuildResponse] = useState<Reconstruct3DResponse | null>(null);

  const confidence = computeGeometryConfidence(referenceImages);
  const byokLlm = resolveActiveByokLlmCredentials(aiConfig);
  const active3DPreset =
    BYOK_3D_ENGINE_PRESETS.find((p) => p.id === inline3DProvider) || BYOK_3D_ENGINE_PRESETS[0];

  const effective3DKey = (inline3DApiKey || aiConfig.threeDEngine?.apiKey || '').trim();
  const effectiveWorkerUrl = (inline3DWorkerUrl || aiConfig.threeDEngine?.workerUrl || '').trim();
  const has3DCredential = active3DPreset.requiresWorkerUrl
    ? /^https:\/\//i.test(effectiveWorkerUrl)
    : effective3DKey.length > 5;

  const persistInline3DConfig = (
    nextProvider: Byok3DEngineProvider = inline3DProvider,
    nextKey: string = inline3DApiKey,
    nextWorkerUrl: string = inline3DWorkerUrl
  ) => {
    if (!onUpdateAiConfig) return;
    const preset =
      BYOK_3D_ENGINE_PRESETS.find((p) => p.id === nextProvider) || BYOK_3D_ENGINE_PRESETS[0];
    onUpdateAiConfig({
      ...aiConfig,
      threeDEngine: {
        provider: nextProvider,
        apiKey: nextKey.trim(),
        workerUrl: nextWorkerUrl.trim(),
        modelId:
          aiConfig.threeDEngine?.provider === nextProvider && aiConfig.threeDEngine?.modelId
            ? aiConfig.threeDEngine.modelId
            : preset.defaultModel,
        verifiedAt: aiConfig.threeDEngine?.verifiedAt,
      },
    });
  };

  const handleSelectSlotFile = async (slot: CharacterViewSlot, file?: File | null) => {
    if (!file) return;
    setSlotLoading(slot);
    setSlotError(null);
    try {
      const prepared = await prepareMultiViewLosslessSlot(file, slot);
      const next = [
        ...referenceImages.filter((item) => item.slot !== slot),
        prepared,
      ].sort((a, b) => {
        const orderA = VIEW_SLOT_DEFINITIONS.find((s) => s.slot === a.slot)?.order ?? 99;
        const orderB = VIEW_SLOT_DEFINITIONS.find((s) => s.slot === b.slot)?.order ?? 99;
        return orderA - orderB;
      });
      onChangeReferenceImages(next.slice(0, 5));
    } catch (err: any) {
      setSlotError(err?.message || 'Không thể xử lý ảnh PNG Lossless cho khe đã chọn.');
    } finally {
      setSlotLoading(null);
    }
  };

  const handleTriggerReconstruct = async () => {
    setSlotError(null);
    if (!confidence.hasFront) {
      setSlotError('Bắt buộc tải tối thiểu 1 ảnh tại Khe 1 (Chính diện) trước khi dựng mô hình 3D.');
      return;
    }

    const activeStyleMeta =
      MODEL_3D_STYLE_CATALOG.find((s) => s.id === selectedStyleId) || MODEL_3D_STYLE_CATALOG[0];
    const effectiveConfig: AIProviderConfig = {
      ...aiConfig,
      threeDEngine: {
        provider: inline3DProvider,
        apiKey: effective3DKey,
        workerUrl: effectiveWorkerUrl,
        modelId: active3DPreset.defaultModel,
      },
    };

    if (onUpdateAiConfig) {
      onUpdateAiConfig(effectiveConfig);
    }

    setIsReconstructing(true);
    try {
      const result = await submitMultiView3DReconstruction(
        {
          characterId: `char_${Date.now()}`,
          characterName: characterName.trim() || 'Nhân vật 3D',
          role: 'protagonist',
          styleId: selectedStyleId,
          planTier: userPlanTier,
          referenceImages,
          targetPolyCount: activeStyleMeta.targetPolyCount,
          autoRig: true,
          sourcePrompt: promptText.trim(),
        },
        effectiveConfig
      );
      setBuildResponse(result);
      if (result.manifest) {
        onAssetBuilt(result.manifest);
      }
    } catch (err: any) {
      setBuildResponse({
        success: false,
        httpStatus: 500,
        error: err?.message || 'Không thể kết nối Backend điều phối Multi-View 3D.',
      });
    } finally {
      setIsReconstructing(false);
    }
  };

  return (
    <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 overflow-hidden">
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-indigo-50/70 transition cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
            <Box className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-zinc-950 flex flex-wrap items-center gap-1.5">
              <span>5B. Dựng Mô hình 3D Thực thụ (1–5 Ảnh &amp; Chuẩn 3D • BYOK)</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-600 text-white tracking-wider">
                LABS
              </span>
              <span className="px-1.5 py-0.2 rounded bg-white border border-indigo-200 text-indigo-800 text-[10px] font-mono">
                Mở mọi gói • 6/6 chuẩn
              </span>
            </div>
            <div className="text-[10.5px] text-zinc-600 truncate">
              Khay ảnh đa góc Lossless PNG (Alpha) • Khai thác trực tiếp BYOK API Keys của bạn
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {referenceImages.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
              {referenceImages.length}/5 ảnh • {confidence.pct}%
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-600" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-3.5 pt-2 border-t border-indigo-200/70 bg-white/80 space-y-3.5">
          {/* 1. BỘ CHỌN 6 CHUẨN MÔ HÌNH 3D THEO GÓI */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-zinc-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Chọn Chuẩn Mô hình 3D LABS (Mở khóa cả 6/6 chuẩn cho mọi gói)</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                Gói hiện tại: <strong className="text-zinc-900">{userPlanTier === 'enterprise' ? 'Toàn hệ' : 'Cá nhân hóa'}</strong> • <span className="text-amber-700 font-semibold">LABS mở khóa 6/6 chuẩn</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {MODEL_3D_STYLE_CATALOG.map((style) => {
                const allowed = is3DStyleAllowedForTier(style.id, userPlanTier);
                const isSelected = selectedStyleId === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    disabled={!allowed}
                    onClick={() => {
                      if (allowed) onChangeStyleId(style.id);
                    }}
                    title={style.description}
                    className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-600 ring-1 ring-indigo-600 text-zinc-950 shadow-2xs'
                        : 'bg-white border-black/[0.08] hover:border-indigo-300 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold truncate">{style.name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-600 text-white">
                          LABS
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-emerald-50 text-emerald-700">
                          {style.polyBudgetLabel}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-snug">
                      {style.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. KHAY 5 KHE ẢNH ĐA GÓC (1–5 ẢNH LOSSLESS PNG ALPHA) */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-zinc-900">
                Tải lên 1–5 Ảnh Tham chiếu Đa góc (Lossless PNG Alpha • Không nén mờ JPEG)
              </span>
              {referenceImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onChangeReferenceImages([]);
                    setBuildResponse(null);
                  }}
                  className="text-[10px] text-rose-600 hover:underline font-medium cursor-pointer"
                >
                  Xóa cả {referenceImages.length} góc ảnh
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {VIEW_SLOT_DEFINITIONS.map((def) => {
                const imgItem = referenceImages.find((r) => r.slot === def.slot);
                const isBusy = slotLoading === def.slot;
                const isSharpOk = imgItem ? imgItem.laplacianSharpness >= 80 : true;
                return (
                  <div
                    key={def.slot}
                    className={`rounded-xl border p-2 flex flex-col justify-between gap-1.5 ${
                      imgItem
                        ? 'bg-white border-indigo-300 shadow-2xs'
                        : def.required
                          ? 'bg-indigo-50/40 border-dashed border-indigo-300'
                          : 'bg-zinc-50/70 border-dashed border-black/[0.12]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-zinc-900 truncate">
                        {def.order}. {def.label.split(' (')[0]}
                        {def.required && <span className="text-rose-600">*</span>}
                      </span>
                      {imgItem && (
                        <button
                          type="button"
                          onClick={() =>
                            onChangeReferenceImages(
                              referenceImages.filter((r) => r.slot !== def.slot)
                            )
                          }
                          className="p-0.5 rounded text-zinc-400 hover:text-rose-600 cursor-pointer"
                          title={`Xóa ${def.label}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {imgItem ? (
                      <div className="space-y-1">
                        <div
                          className="aspect-square rounded-lg border border-black/10 overflow-hidden flex items-center justify-center"
                          style={{
                            backgroundImage:
                              'linear-gradient(45deg, #f4f4f5 25%, transparent 25%), linear-gradient(-45deg, #f4f4f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f4f4f5 75%), linear-gradient(-45deg, transparent 75%, #f4f4f5 75%)',
                            backgroundSize: '12px 12px',
                            backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                          }}
                        >
                          <img
                            src={imgItem.dataUrl}
                            alt={def.label}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono">
                          <span className="text-zinc-500">
                            {imgItem.width}×{imgItem.height}
                          </span>
                          <span
                            className={`px-1 rounded font-semibold ${
                              isSharpOk
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                            title="Điểm độ nét Laplacian (khuyến nghị >= 80)"
                          >
                            Nét {Math.round(imgItem.laplacianSharpness)}
                          </span>
                        </div>
                        <div className="text-[8.5px] font-mono text-zinc-400 truncate">
                          SHA: {imgItem.sha256.slice(0, 10)}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => slotInputRefs.current[def.slot]?.click()}
                        className="aspect-square rounded-lg bg-white/90 hover:bg-white border border-black/[0.06] flex flex-col items-center justify-center p-1.5 text-center transition cursor-pointer gap-1"
                        title={def.hint}
                      >
                        <Upload className="w-4 h-4 text-indigo-600" />
                        <span className="text-[9.5px] font-medium text-zinc-700 leading-tight">
                          {isBusy ? 'Đang nạp...' : def.required ? 'Ảnh gốc*' : '+ Tải góc'}
                        </span>
                      </button>
                    )}

                    <input
                      ref={(el) => {
                        slotInputRefs.current[def.slot] = el;
                      }}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        await handleSelectSlotFile(def.slot, file);
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Geometry Confidence Meter */}
            <div className="p-2.5 rounded-xl bg-zinc-50 border border-black/[0.08] space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
                <span className="font-semibold text-zinc-800">{confidence.label}</span>
                <span className="font-mono font-bold text-indigo-700">
                  {confidence.recommendedEngine}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    confidence.pct >= 90
                      ? 'bg-emerald-600'
                      : confidence.pct >= 74
                        ? 'bg-indigo-600'
                        : 'bg-zinc-400'
                  }`}
                  style={{ width: `${confidence.pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3. THANH TRẠNG THÁI & NHẬP NHANH BYOK API KEY CHO VISION QC + 3D ENGINE */}
          <div className="p-3 rounded-xl bg-zinc-50 border border-black/[0.08] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-900">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>Cơ chế BYOK (Bắt buộc dùng API Keys của bạn)</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span
                  className={`px-2 py-0.5 rounded font-mono border ${
                    byokLlm
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-zinc-100 text-zinc-600 border-black/10'
                  }`}
                >
                  {byokLlm
                    ? `Vision QC: ${byokLlm.provider.toUpperCase()} (${byokLlm.model})`
                    : 'Vision QC: Chưa gắn LLM Key (Bỏ qua bước hỏi Vision)'}
                </span>
                {onOpenAiSettings && (
                  <button
                    type="button"
                    onClick={() => onOpenAiSettings()}
                    className="px-2 py-0.5 rounded bg-white hover:bg-zinc-100 border border-black/10 text-zinc-800 font-semibold cursor-pointer"
                  >
                    Cài đặt Keys
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <div className="sm:col-span-4">
                <select
                  value={inline3DProvider}
                  onChange={(e) => {
                    const nextProv = e.target.value as Byok3DEngineProvider;
                    setInline3DProvider(nextProv);
                    persistInline3DConfig(nextProv, inline3DApiKey, inline3DWorkerUrl);
                  }}
                  className="w-full bg-white border border-black/10 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-zinc-900 focus:outline-none focus:border-indigo-600"
                >
                  {BYOK_3D_ENGINE_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.split(' (')[0]} {p.isFreeTierAvailable ? '• Free' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                {active3DPreset.requiresWorkerUrl ? (
                  <input
                    type="url"
                    value={inline3DWorkerUrl}
                    onChange={(e) => setInline3DWorkerUrl(e.target.value)}
                    onBlur={() => persistInline3DConfig()}
                    placeholder={active3DPreset.defaultEndpoint}
                    className="w-full bg-white border border-black/10 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-zinc-900 focus:outline-none focus:border-indigo-600"
                  />
                ) : (
                  <input
                    type="password"
                    value={inline3DApiKey}
                    onChange={(e) => setInline3DApiKey(e.target.value)}
                    onBlur={() => persistInline3DConfig()}
                    placeholder={`Dán Key ${active3DPreset.name.split(' (')[0]} (${active3DPreset.keyPlaceholder.slice(0, 12)}...)`}
                    className="w-full bg-white border border-black/10 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-zinc-900 focus:outline-none focus:border-indigo-600"
                  />
                )}
              </div>

              <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-2">
                <a
                  href={active3DPreset.consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-indigo-600 hover:underline inline-flex items-center gap-0.5 font-mono"
                >
                  <span>Lấy Key</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold ${
                    has3DCredential
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {has3DCredential ? 'Key Ready ✓' : 'Thiếu 3D Key'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Tên nhân vật / đối tượng 3D..."
                className="flex-1 bg-white border border-black/10 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-900 focus:outline-none focus:border-indigo-600"
              />
              <button
                type="button"
                disabled={isReconstructing || referenceImages.length === 0}
                onClick={handleTriggerReconstruct}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shadow-2xs"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>
                  {isReconstructing
                    ? 'Đang kiểm định & gửi BYOK...'
                    : `Kiểm định & Khởi tạo Mô hình 3D (${referenceImages.length} ảnh)`}
                </span>
              </button>
            </div>
          </div>

          {slotError && (
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{slotError}</span>
            </div>
          )}

          {buildResponse && (
            <div
              className={`p-2.5 rounded-xl border text-[11px] space-y-1.5 ${
                buildResponse.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between gap-2 font-bold">
                <span className="flex items-center gap-1.5">
                  {buildResponse.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                  )}
                  <span>
                    {buildResponse.success
                      ? `Đã khởi tạo Job 3D: ${buildResponse.manifest?.jobId}`
                      : `HTTP ${buildResponse.httpStatus} • ${buildResponse.code || 'Cần hành động'}`}
                  </span>
                </span>
                {typeof buildResponse.geometryConfidencePct === 'number' && (
                  <span className="font-mono text-[10px]">
                    Confidence: {buildResponse.geometryConfidencePct}% • {buildResponse.recommendedEngine}
                  </span>
                )}
              </div>
              {buildResponse.error && <p className="leading-snug">{buildResponse.error}</p>}
              {buildResponse.qcReport && (
                <div className="text-[10px] font-mono space-y-0.5 text-zinc-700 pt-1 border-t border-black/5">
                  <div>
                    Sharpness TB: {buildResponse.qcReport.averageSharpness} • SHA-256 Angles:{' '}
                    {(buildResponse.sourceImageHashes || []).map((h) => h.slice(0, 8)).join(', ')}
                  </div>
                  {buildResponse.qcReport.visionConsistencyNote && (
                    <div className="text-indigo-800">
                      Vision QC (BYOK): {buildResponse.qcReport.visionConsistencyNote}
                    </div>
                  )}
                  {buildResponse.qcReport.warnings.length > 0 && (
                    <div className="text-amber-800">
                      Lưu ý: {buildResponse.qcReport.warnings.join(' | ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {builtAssets.length > 0 && (
            <div className="text-[10.5px] font-mono text-emerald-800 bg-emerald-50/70 border border-emerald-200 rounded-lg px-2.5 py-1.5">
              Đã gắn {builtAssets.length} manifest mô hình 3D vào dự án ({builtAssets[builtAssets.length - 1].jobId}).
            </div>
          )}
        </div>
      )}
    </div>
  );
};
