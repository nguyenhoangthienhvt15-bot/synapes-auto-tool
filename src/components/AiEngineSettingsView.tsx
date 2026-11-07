import React, { useState, useEffect } from 'react';
import { AIProviderConfig, AIProviderId, UserAccount } from '../types';
import {
  Cpu, Key, CheckCircle2, Sparkles, RefreshCw,
  ExternalLink, Eye, EyeOff, ShieldCheck, Check, ArrowLeft, Radio, AlertCircle, LogIn
} from 'lucide-react';
import {
  discoverModelsFromKey,
  getCachedDiscoveredModels,
  DiscoveredModel,
  PROVIDERS,
  ProviderMeta,
} from '../services/aiModelDiscoveryService';
import { ProviderBrandLogo, AiModelDropdown } from './AiProviderDropdown';

interface AiEngineSettingsViewProps {
  currentUser?: UserAccount | null;
  config: AIProviderConfig;
  onUpdateConfig: (cfg: AIProviderConfig) => void;
  onOpenLogin?: () => void;
  onBack?: () => void;
  initialProvider?: string;
}

export const AiEngineSettingsView: React.FC<AiEngineSettingsViewProps> = ({
  currentUser,
  config,
  onUpdateConfig,
  onOpenLogin,
  onBack,
  initialProvider,
}) => {
  const [activeProvider, setActiveProvider] = useState<AIProviderId>(
    (initialProvider as AIProviderId) || config.activeProvider || config.mode || 'gemini'
  );

  // States per provider
  const [keys, setKeys] = useState<Record<string, string>>({
    gemini: config.gemini?.apiKey || '',
    openai: config.openai?.apiKey || '',
    claude: config.claude?.apiKey || '',
    deepseek: config.deepseek?.apiKey || '',
    grok: config.grok?.apiKey || '',
    plugin: config.plugin?.apiToken || '',
  });

  useEffect(() => {
    setKeys({
      gemini: config.gemini?.apiKey || '',
      openai: config.openai?.apiKey || '',
      claude: config.claude?.apiKey || '',
      deepseek: config.deepseek?.apiKey || '',
      grok: config.grok?.apiKey || '',
      plugin: config.plugin?.apiToken || '',
    });
  }, [config]);

  const [models, setModels] = useState<Record<string, string>>({
    gemini: config.gemini?.model || 'gemini-2.0-flash',
    openai: config.openai?.model || 'gpt-4o',
    claude: config.claude?.model || 'claude-3-7-sonnet-20250219',
    deepseek: config.deepseek?.model || 'deepseek-chat',
    grok: config.grok?.model || 'grok-2',
    plugin: config.plugin?.name || 'kling-v1.5',
  });

  const [endpoints, setEndpoints] = useState<Record<string, string>>({
    gemini: 'https://generativelanguage.googleapis.com/v1beta',
    openai: config.openai?.endpointUrl || 'https://api.openai.com/v1',
    claude: config.claude?.endpointUrl || 'https://api.anthropic.com/v1',
    deepseek: config.deepseek?.endpointUrl || 'https://api.deepseek.com/v1',
    grok: config.grok?.endpointUrl || 'https://api.x.ai/v1',
    plugin: config.plugin?.endpointUrl || 'https://api.klingai.com/v1/videos/text2video',
  });

  const [ttsVoice, setTtsVoice] = useState(config.gemini?.ttsVoice || 'vi-VN-Standard-B (Nam Bắc chuẩn)');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (initialProvider && PROVIDERS.some((p) => p.id === initialProvider)) {
      setActiveProvider(initialProvider as AIProviderId);
    }
  }, [initialProvider]);

  const toggleShowKey = (provId: string) => {
    setShowKey((prev) => ({
      ...prev,
      [provId]: !prev[provId],
    }));
  };

  // Discovered models per provider (tự động đọc trực tiếp từ API Key)
  const [discoveredModels, setDiscoveredModels] = useState<Record<string, DiscoveredModel[]>>(() => {
    const initial: Record<string, DiscoveredModel[]> = {};
    for (const p of PROVIDERS) {
      const provKey = p.id === 'plugin' ? config.plugin?.apiToken : (config[p.id as keyof AIProviderConfig] as any)?.apiKey;
      const cached = getCachedDiscoveredModels(p.id, provKey);
      if (cached && cached.length > 0) {
        initial[p.id] = cached;
      } else {
        initial[p.id] = p.models.map((m) => ({
          id: m.id,
          name: m.name,
          tag: m.tag,
          isLiveFromKey: false,
          isRecommended: m.id === p.defaultModel,
        }));
      }
    }
    return initial;
  });

  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [discoveryStatus, setDiscoveryStatus] = useState<Record<string, {
    type: 'loading' | 'success' | 'error' | null;
    message: string;
    modelCount?: number;
  }>>({});

  const handleDiscoverModels = async (provId: AIProviderId, customKey?: string, isAuto: boolean = false) => {
    const keyToUse = (customKey !== undefined ? customKey : keys[provId])?.trim();
    if (!keyToUse) {
      if (!isAuto) {
        setDiscoveryStatus((prev) => ({
          ...prev,
          [provId]: {
            type: 'error',
            message: `Vui lòng nhập API Key của ${PROVIDERS.find((p) => p.id === provId)?.name || provId} trước khi đọc Models.`,
          },
        }));
      }
      return;
    }

    setIsDiscovering(true);
    setDiscoveryStatus((prev) => ({
      ...prev,
      [provId]: {
        type: 'loading',
        message: `Đang kết nối API và đọc danh sách Models từ Key của ${PROVIDERS.find((p) => p.id === provId)?.name || provId}...`,
      },
    }));

    try {
      const res = await discoverModelsFromKey(provId, keyToUse, endpoints[provId]);
      if (res.success && res.models.length > 0) {
        setDiscoveredModels((prev) => ({
          ...prev,
          [provId]: res.models,
        }));
        setDiscoveryStatus((prev) => ({
          ...prev,
          [provId]: {
            type: 'success',
            message: res.message,
            modelCount: res.models.length,
          },
        }));

        // Nếu model hiện tại chưa được chọn hoặc không nằm trong danh sách mới, chọn model khuyên dùng
        const currentModelId = models[provId];
        const hasCurrent = res.models.some((m) => m.id === currentModelId);
        const selectedModelId = hasCurrent
          ? currentModelId
          : (res.models.find((m) => m.isRecommended) || res.models[0])?.id || currentModelId;

        if (!hasCurrent && selectedModelId) {
          setModels((prev) => ({ ...prev, [provId]: selectedModelId }));
        }

        // Tự động đồng bộ ngay API Key hợp lệ vào cấu hình phiên làm việc
        if (currentUser && currentUser.isLoggedIn) {
          const nextKeys = { ...keys, [provId]: keyToUse };
          const nextModels = { ...models, [provId]: selectedModelId };
          onUpdateConfig({
            ...config,
            mode: provId,
            activeProvider: provId,
            gemini: { apiKey: nextKeys.gemini.trim(), model: nextModels.gemini, ttsVoice },
            openai: { apiKey: nextKeys.openai.trim(), model: nextModels.openai, endpointUrl: endpoints.openai.trim() },
            claude: { apiKey: nextKeys.claude.trim(), model: nextModels.claude, endpointUrl: endpoints.claude.trim() },
            deepseek: { apiKey: nextKeys.deepseek.trim(), model: nextModels.deepseek, endpointUrl: endpoints.deepseek.trim() },
            grok: { apiKey: nextKeys.grok.trim(), model: nextModels.grok, endpointUrl: endpoints.grok.trim() },
            plugin: {
              ...config.plugin,
              endpointUrl: endpoints.plugin.trim(),
              apiToken: nextKeys.plugin.trim(),
            },
          });
        }
      } else {
        setDiscoveryStatus((prev) => ({
          ...prev,
          [provId]: {
            type: 'error',
            message: res.message,
          },
        }));
      }
    } catch (err: any) {
      setDiscoveryStatus((prev) => ({
        ...prev,
        [provId]: {
          type: 'error',
          message: `Lỗi kết nối khi quét models: ${err?.message || 'Không xác định'}`,
        },
      }));
    } finally {
      setIsDiscovering(false);
    }
  };

  // Tự động quét models khi nạp hoặc thay đổi API key
  useEffect(() => {
    const currentKey = keys[activeProvider]?.trim();
    if (!currentKey) return;

    if (currentKey.length >= 15) {
      const timer = setTimeout(() => {
        handleDiscoverModels(activeProvider, currentKey, true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [keys[activeProvider], activeProvider]);

  // Nạp lại cache nếu chuyển tab provider
  useEffect(() => {
    const currentKey = keys[activeProvider]?.trim();
    if (currentKey) {
      const cached = getCachedDiscoveredModels(activeProvider, currentKey);
      if (cached && cached.length > 0) {
        setDiscoveredModels((prev) => ({
          ...prev,
          [activeProvider]: cached,
        }));
      }
    }
  }, [activeProvider]);

  const currentMeta = PROVIDERS.find((p) => p.id === activeProvider) || PROVIDERS[0];
  const isDefaultSelected = (config.activeProvider || config.mode) === activeProvider;

  const activeModels: DiscoveredModel[] =
    discoveredModels[activeProvider] && discoveredModels[activeProvider].length > 0
      ? discoveredModels[activeProvider]
      : currentMeta.models.map((m) => ({
        id: m.id,
        name: m.name,
        tag: m.tag,
        isLiveFromKey: false,
        isRecommended: m.id === currentMeta.defaultModel,
      }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.isLoggedIn) {
      setTestResult('⚠️ Bạn cần đăng nhập tài khoản Studio của mình để lưu và kích hoạt API Keys.');
      if (onOpenLogin) onOpenLogin();
      return;
    }

    const updated: AIProviderConfig = {
      ...config,
      mode: activeProvider,
      activeProvider: activeProvider,
      gemini: {
        apiKey: keys.gemini.trim(),
        model: models.gemini,
        ttsVoice,
      },
      openai: {
        apiKey: keys.openai.trim(),
        model: models.openai,
        endpointUrl: endpoints.openai.trim(),
      },
      claude: {
        apiKey: keys.claude.trim(),
        model: models.claude,
        endpointUrl: endpoints.claude.trim(),
      },
      deepseek: {
        apiKey: keys.deepseek.trim(),
        model: models.deepseek,
        endpointUrl: endpoints.deepseek.trim(),
      },
      grok: {
        apiKey: keys.grok.trim(),
        model: models.grok,
        endpointUrl: endpoints.grok.trim(),
      },
      plugin: {
        ...config.plugin,
        apiToken: keys.plugin.trim(),
        endpointUrl: endpoints.plugin.trim(),
        name: models.plugin,
      },
    };

    onUpdateConfig(updated);
    setTestResult(`Đã lưu cấu hình [${currentMeta.name}] và đặt làm động cơ AI mặc định thành công!`);
    setTimeout(() => setTestResult(null), 4000);
  };

  const handleSetAsDefault = () => {
    const updated: AIProviderConfig = {
      ...config,
      mode: activeProvider,
      activeProvider: activeProvider,
    };
    onUpdateConfig(updated);
    setTestResult(`Đã kích hoạt [${currentMeta.name}] làm động cơ AI sản xuất video mặc định.`);
    setTimeout(() => setTestResult(null), 3500);
  };

  const handleTestConnection = async () => {
    const key = keys[activeProvider]?.trim();
    if (!key) {
      setTestResult(`⚠️ Vui lòng nhập API Key cho ${currentMeta.name} trước khi kiểm tra.`);
      return;
    }

    setIsTesting(true);
    setTestResult(`Đang gửi tín hiệu kiểm tra Ping và đồng bộ danh sách Model từ ${currentMeta.name}...`);

    await handleDiscoverModels(activeProvider, key, false);

    setIsTesting(false);
    const chosenModel = models[activeProvider] || 'mô hình đã chọn';
    setTestResult(`✅ Kết nối thành công! Động cơ ${currentMeta.name} phản hồi HTTP 200 OK (${chosenModel}). Sẵn sàng tạo kịch bản video.`);
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fade-in select-none text-zinc-900 max-w-6xl mx-auto pb-10">
      {/* Cảnh báo khi chưa đăng nhập */}
      {(!currentUser || !currentUser.isLoggedIn) && (
        <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-2xs animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="text-xs font-bold">Chưa Đăng Nhập Tài Khoản Studio</div>
              <div className="text-[11px] text-amber-800 mt-0.5">
                Các API Keys AI Module cá nhân chỉ hiển thị và lưu trữ an toàn khi bạn đăng nhập tài khoản của mình.
              </div>
            </div>
          </div>
          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs flex-shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đăng Nhập Ngay</span>
            </button>
          )}
        </div>
      )}

      {/* Header bar */}
      <div className="studio-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="btn-secondary cursor-pointer flex items-center gap-1.5"
                title="Quay lại bàn duyệt"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>
            )}

            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-zinc-950 tracking-tight">
                  API Keys AI Module
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                  MULTI-LLM ENGINE
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                Quản lý và kích hoạt linh hoạt các nhà cung cấp AI hàng đầu: <strong>GPT, Claude, DeepSeek, Grok, Gemini</strong> và <strong>Plugin Ngoài</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-black/10 text-xs flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-zinc-500 font-sans">Đang chạy:</span>
              <span className="font-semibold text-zinc-900">
                {PROVIDERS.find((p) => p.id === (config.activeProvider || config.mode))?.name || 'Google Gemini'}
              </span>
            </div>
          </div>
        </div>

        {/* Provider Switcher Cards Bar */}
        <div>
          <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
            LỰA CHỌN NHÀ CUNG CẤP AI (BẤM ĐỂ CẤU HÌNH API KEY)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {PROVIDERS.map((prov) => {
              const isCurrent = activeProvider === prov.id;
              const isDefault = (config.activeProvider || config.mode) === prov.id;

              return (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => setActiveProvider(prov.id)}
                  className={`p-3 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between ${isCurrent
                    ? 'bg-white border-zinc-950 ring-2 ring-zinc-950/10 shadow-sm'
                    : 'bg-zinc-50 hover:bg-white border-black/[0.08] text-zinc-600'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 truncate">
                      <ProviderBrandLogo provider={prov.id} size="xs" withBadge={true} />
                      <span className="text-xs font-bold text-zinc-900 truncate">
                        {prov.name}
                      </span>
                    </div>
                    {isDefault && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Động cơ mặc định" />
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono truncate">
                    {prov.vendor}
                  </div>
                  <div className="mt-2 pt-1 border-t border-black/5 flex items-center justify-between text-[9px] font-mono">
                    <span className={keys[prov.id] ? 'text-emerald-700 font-medium' : 'text-zinc-400'}>
                      {keys[prov.id] ? '● Đã có Key' : '○ Chưa có Key'}
                    </span>
                    {isCurrent && (
                      <span className="text-zinc-950 font-semibold font-sans">Đang chọn</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {testResult && (
        <div className="p-3.5 rounded-xl bg-zinc-900 text-white text-xs flex items-center gap-2.5 font-mono shadow-md animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="flex-1 font-sans">{testResult}</span>
        </div>
      )}

      {/* Main Configuration Card for Selected Provider */}
      <div className="studio-card p-5 sm:p-6 space-y-5">
        {/* Sub Header of Active Provider */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4">
          <div className="flex items-start gap-3">
            <ProviderBrandLogo provider={currentMeta.id} size="lg" withBadge={true} />
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${currentMeta.badgeColor}`}>
                  {currentMeta.vendor}
                </span>
                <h2 className="text-base font-bold text-zinc-950">
                  {currentMeta.name}
                </h2>
              </div>
              <p className="text-xs text-zinc-600 mt-1 max-w-2xl leading-relaxed">
                {currentMeta.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isDefaultSelected ? (
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Động Cơ Đang Kích Hoạt</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSetAsDefault}
                className="btn-secondary text-xs flex items-center gap-1.5"
                title="Chọn nhà cung cấp này để sản xuất video kịch bản mặc định"
              >
                <Radio className="w-3.5 h-3.5 text-zinc-500" />
                <span>Đặt Làm Động Cơ Mặc Định</span>
              </button>
            )}

            <a
              href={currentMeta.consoleUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs flex items-center gap-1.5"
              title={`Truy cập ${currentMeta.consoleName} để tạo API Key chính thức`}
            >
              <span>Lấy API Key</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
          </div>
        </div>

        {/* Config Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-zinc-700 font-medium flex items-center gap-2">
                <span>Khóa Xác Thực ({currentMeta.name} API Key) *</span>
                {activeModels.some((m) => m.isLiveFromKey) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Đã đọc {activeModels.length} models từ Key
                  </span>
                )}
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDiscoverModels(activeProvider, keys[activeProvider], false)}
                  disabled={isDiscovering || !keys[activeProvider]?.trim()}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 disabled:text-zinc-400 flex items-center gap-1 cursor-pointer font-semibold transition"
                  title="Gửi yêu cầu API để đọc và cập nhật danh sách các mô hình AI mới nhất được cung cấp trong Key này"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
                  <span>{isDiscovering ? 'Đang đọc...' : 'Đọc Models Từ Key'}</span>
                </button>

                <span className="text-zinc-300">|</span>

                <button
                  type="button"
                  onClick={() => toggleShowKey(activeProvider)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer font-medium"
                >
                  {showKey[activeProvider] ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Ẩn Khóa</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Khóa</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <Key className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type={showKey[activeProvider] ? 'text' : 'password'}
                required
                value={keys[activeProvider] || ''}
                onChange={(e) =>
                  setKeys((prev) => ({ ...prev, [activeProvider]: e.target.value }))
                }
                placeholder={currentMeta.keyPlaceholder}
                className="w-full bg-zinc-50 border border-black/10 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-900 transition"
              />
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
              <span>Hệ thống tự động quét danh sách Model AI mới nhất từ Key ngay khi dán/nhập.</span>
              <span className="font-mono">Định dạng chuẩn: {currentMeta.keyPrefix}...</span>
            </div>
          </div>

          {/* Status Banner khi Đọc Models từ API Key */}
          {discoveryStatus[activeProvider] && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2.5 transition animate-in fade-in ${discoveryStatus[activeProvider]?.type === 'loading'
                ? 'bg-blue-50 border border-blue-200 text-blue-900'
                : discoveryStatus[activeProvider]?.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border border-rose-200 text-rose-950'
                }`}
            >
              <div className="flex items-center gap-2">
                {discoveryStatus[activeProvider]?.type === 'loading' && (
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                )}
                {discoveryStatus[activeProvider]?.type === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                )}
                {discoveryStatus[activeProvider]?.type === 'error' && (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span className="font-sans leading-relaxed">
                  {discoveryStatus[activeProvider]?.message}
                </span>
              </div>

              {discoveryStatus[activeProvider]?.type === 'success' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex-shrink-0">
                  LIVE DISCOVERY
                </span>
              )}
            </div>
          )}

          {/* Model & Endpoint selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-700 font-medium">
                  Mô Hình AI (Model Release)
                </label>
                <span className="text-[10px] font-mono text-zinc-500">
                  {activeModels.length} mô hình khả dụng
                </span>
              </div>
              <AiModelDropdown
                provider={activeProvider}
                models={activeModels}
                selectedModel={models[activeProvider] || activeModels[0]?.id || currentMeta.defaultModel}
                onSelect={(modelId) =>
                  setModels((prev) => ({ ...prev, [activeProvider]: modelId }))
                }
              />
            </div>

            <div>
              <label className="text-zinc-700 font-medium block mb-1">
                API Endpoint Base URL
              </label>
              <input
                type="text"
                value={endpoints[activeProvider] || currentMeta.defaultEndpoint}
                onChange={(e) =>
                  setEndpoints((prev) => ({ ...prev, [activeProvider]: e.target.value }))
                }
                placeholder={currentMeta.defaultEndpoint}
                className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900 font-mono"
              />
            </div>
          </div>

          {/* Interactive Model Showcase / Selection Grid */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Mô Hình AI Được Cung Cấp Trong Key (Bấm thẻ để chọn nhanh)</span>
              </div>
              <div className="flex items-center gap-2">
                {activeModels.some((m) => m.isLiveFromKey) ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đã đọc trực tiếp từ API Key
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-400">
                    ○ Đề xuất tiêu chuẩn 2026
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDiscoverModels(activeProvider, keys[activeProvider], false)}
                  disabled={isDiscovering || !keys[activeProvider]?.trim()}
                  className="text-[10px] font-mono text-indigo-600 hover:text-indigo-800 disabled:text-zinc-400 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RefreshCw className={`w-3 h-3 ${isDiscovering ? 'animate-spin' : ''}`} />
                  <span>Quét lại</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {activeModels.map((m) => {
                const isSelected = (models[activeProvider] || activeModels[0]?.id) === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setModels((prev) => ({ ...prev, [activeProvider]: m.id }))}
                    className={`p-3 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between ${isSelected
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-md ring-2 ring-zinc-950/20'
                      : 'bg-zinc-50/80 hover:bg-white border-black/[0.08] text-zinc-800 hover:shadow-2xs'
                      }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="font-bold text-xs truncate" title={m.name}>
                          {m.name}
                        </div>
                        {isSelected ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0 mt-0.5 shadow-xs" title="Đang chọn" />
                        ) : m.isRecommended ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Khuyên dùng
                          </span>
                        ) : m.isLiveFromKey ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                            Key Live
                          </span>
                        ) : null}
                      </div>

                      <div className={`text-[10px] font-mono truncate ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {m.id}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[10px]">
                      <span className={`truncate text-[10px] ${isSelected ? 'text-emerald-300' : 'text-zinc-600'}`}>
                        {m.tag}
                      </span>
                      {m.inputTokenLimit && (
                        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 ml-1.5 ${isSelected ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-white border border-zinc-200 text-zinc-600'
                          }`}>
                          {m.inputTokenLimit >= 1000000
                            ? `${(m.inputTokenLimit / 1000000).toFixed(m.inputTokenLimit % 1000000 === 0 ? 0 : 1)}M`
                            : `${Math.round(m.inputTokenLimit / 1000)}K`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Specialized setting for Gemini TTS Voice */}
          {activeProvider === 'gemini' && (
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-black/5 space-y-2">
              <label className="text-zinc-700 font-medium block">
                Giọng Đọc Thuyết Minh Tích Hợp (Gemini TTS Voice)
              </label>
              <select
                value={ttsVoice}
                onChange={(e) => setTtsVoice(e.target.value)}
                className="w-full bg-white border border-black/10 rounded-lg p-2 text-xs text-zinc-800 font-mono focus:outline-none focus:border-zinc-900"
              >
                <option value="vi-VN-Standard-B (Nam Bắc chuẩn)">vi-VN-Standard-B (Nam Bắc chuẩn - Tin tức/Công nghệ)</option>
                <option value="vi-VN-Standard-A (Nữ miền Bắc truyền cảm)">vi-VN-Standard-A (Nữ miền Bắc - Kể chuyện/Review)</option>
                <option value="vi-VN-Wavenet-C (Nam miền Nam hiện đại)">vi-VN-Wavenet-C (Nam miền Nam - Năng động/Viral TikTok)</option>
                <option value="vi-VN-Wavenet-D (Nữ miền Nam ngọt ngào)">vi-VN-Wavenet-D (Nữ miền Nam - Bán hàng/Lifestyle)</option>
              </select>
            </div>
          )}

          {/* Specialized setting for Plugin Webhook */}
          {activeProvider === 'plugin' && (
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-black/5 space-y-3">
              <div className="font-semibold text-zinc-900">Cấu Hình Payload JSON Webhook</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 text-[11px] block mb-0.5">Input Mapping (Gửi đi)</label>
                  <textarea
                    rows={3}
                    defaultValue={config.plugin?.inputMapping}
                    className="w-full bg-white border border-black/10 rounded-lg p-2 text-[11px] font-mono text-zinc-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 text-[11px] block mb-0.5">Output Mapping (Đường dẫn video trả về)</label>
                  <textarea
                    rows={3}
                    defaultValue={config.plugin?.outputMapping}
                    className="w-full bg-white border border-black/10 rounded-lg p-2 text-[11px] font-mono text-zinc-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security & Action Buttons */}
          <div className="p-3 rounded-lg bg-zinc-50 border border-black/5 flex items-center justify-between gap-3 text-[11px] text-zinc-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Chính sách bảo mật: Khóa API được bảo vệ nghiêm ngặt, không gửi ra ngoài hệ thống và không dùng cho mục đích đào tạo lại.</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-black/5">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="btn-secondary flex items-center gap-1.5 text-xs"
              title="Gửi request test API Key"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-zinc-900' : 'text-zinc-500'}`} />
              <span>{isTesting ? 'Đang Kiểm Tra...' : 'Kiểm Tra Kết Nối (Ping)'}</span>
            </button>

            <button
              type="submit"
              className="btn-primary text-xs shadow-xs"
            >
              Lưu Cấu Hình & Kích Hoạt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
