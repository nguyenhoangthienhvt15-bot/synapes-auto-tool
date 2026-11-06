import React, { useState, useEffect } from 'react';
import { AIProviderConfig, AIProviderId, UserAccount } from '../types';
import {
  Cpu, Key, Globe, CheckCircle2, Sparkles, RefreshCw,
  ExternalLink, Eye, EyeOff, ShieldCheck, Check, ArrowLeft, Radio, AlertCircle, LogIn
} from 'lucide-react';
import {
  discoverModelsFromKey,
  getCachedDiscoveredModels,
  DiscoveredModel,
} from '../services/aiModelDiscoveryService';

interface AiEngineSettingsViewProps {
  currentUser?: UserAccount | null;
  config: AIProviderConfig;
  onUpdateConfig: (cfg: AIProviderConfig) => void;
  onOpenLogin?: () => void;
  onBack?: () => void;
  initialProvider?: string;
}

interface ProviderMeta {
  id: AIProviderId;
  name: string;
  vendor: string;
  description: string;
  defaultEndpoint: string;
  defaultModel: string;
  models: { id: string; name: string; tag: string }[];
  keyPrefix: string;
  keyPlaceholder: string;
  consoleUrl: string;
  consoleName: string;
  badgeColor: string;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    vendor: 'Google DeepMind',
    description: 'Động cơ đa phương thức mạnh mẽ: phân rã kịch bản siêu tốc, tích hợp trực tiếp giọng đọc TTS tự nhiên tiếng Việt.',
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Thế hệ mới nhất 2026 • Siêu tốc • Khuyên dùng' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tag: 'Suy luận kịch bản chuyên sâu thế hệ mới' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tag: 'Tốc độ cao • Tối ưu chi phí' },
      { id: 'gemini-2.0-pro-exp', name: 'Gemini 2.0 Pro Experimental', tag: 'Suy luận kịch bản phức tạp' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', tag: 'Ngữ cảnh dài 2M tokens' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', tag: 'Tiết kiệm tài nguyên' },
    ],
    keyPrefix: 'AIzaSy',
    keyPlaceholder: 'AIzaSy...',
    consoleUrl: 'https://aistudio.google.com/app/apikey',
    consoleName: 'Google AI Studio Console',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'openai',
    name: 'OpenAI GPT',
    vendor: 'OpenAI',
    description: 'Dòng mô hình GPT-4o và o3-mini hàng đầu thế giới về khả năng sáng tạo ngôn từ, viết kịch bản viral và bắt trend.',
    defaultEndpoint: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni)', tag: 'Mạnh mẽ nhất • Đa phương thức • Khuyên dùng' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tag: 'Nhanh nhẹn • Chi phí cực thấp' },
      { id: 'o3-mini', name: 'o3-mini', tag: 'Suy luận tốc độ cao thế hệ mới 2026' },
      { id: 'o1', name: 'o1 (Reasoning)', tag: 'Tư duy logic kịch bản chiều sâu' },
      { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview', tag: 'Đột phá tư duy sáng tạo' },
    ],
    keyPrefix: 'sk-proj',
    keyPlaceholder: 'sk-proj-... hoặc sk-...',
    consoleUrl: 'https://platform.openai.com/api-keys',
    consoleName: 'OpenAI Platform Dashboard',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    vendor: 'Anthropic',
    description: 'Chuyên gia kể chuyện (Storytelling), văn phong tự nhiên giàu cảm xúc, phân tích tâm lý người xem xuất sắc nhất hiện nay.',
    defaultEndpoint: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-7-sonnet-20250219',
    models: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', tag: 'Mới nhất 2026 • Hybrid Reasoning • Khuyên dùng' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', tag: 'Độ mượt mà câu chữ cao nhất' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', tag: 'Siêu tốc cho kịch bản ngắn' },
    ],
    keyPrefix: 'sk-ant',
    keyPlaceholder: 'sk-ant-api03-...',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    consoleName: 'Anthropic Console',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI',
    vendor: 'DeepSeek',
    description: 'Động cơ mã nguồn mở tối ưu đột phá toàn cầu: DeepSeek-V3 và DeepSeek-R1 cung cấp năng lực suy luận cực mạnh với chi phí siêu rẻ.',
    defaultEndpoint: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3 (Chat)', tag: 'Tốc độ cao • Văn phong tự nhiên • Khuyên dùng' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (Reasoning)', tag: 'Mô hình suy luận từng bước (Chain-of-Thought)' },
    ],
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    consoleUrl: 'https://platform.deepseek.com/api_keys',
    consoleName: 'DeepSeek Open Platform',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    vendor: 'xAI (Elon Musk)',
    description: 'Mô hình Grok 2 & Grok 3 với khả năng tiếp cận tin tức thời sự cực nhanh, phong cách viết kịch bản sắc bén, hài hước và chân thực.',
    defaultEndpoint: 'https://api.x.ai/v1',
    defaultModel: 'grok-2',
    models: [
      { id: 'grok-2', name: 'Grok 2', tag: 'Cập nhật tin tức trực tiếp từ X • Khuyên dùng' },
      { id: 'grok-2-mini', name: 'Grok 2 Mini', tag: 'Nhẹ & Tốc độ' },
      { id: 'grok-beta', name: 'Grok 3 (Beta)', tag: 'Thế hệ tiếp theo' },
    ],
    keyPrefix: 'xai-',
    keyPlaceholder: 'xai-...',
    consoleUrl: 'https://console.x.ai/',
    consoleName: 'xAI Cloud Console',
    badgeColor: 'bg-zinc-100 text-zinc-800 border-zinc-200',
  },
  {
    id: 'plugin',
    name: 'Plugin Webhook Ngoài',
    vendor: 'Kling / Runway / Custom',
    description: 'Kết nối API trực tiếp đến các dịch vụ sinh video AI bên ngoài như Kling AI, Runway Gen-3, Luma Dream Machine qua Webhook URL.',
    defaultEndpoint: 'https://api.klingai.com/v1/videos/text2video',
    defaultModel: 'kling-v1.5',
    models: [
      { id: 'kling-v1.5', name: 'Kling Video v1.5 API', tag: 'Chất lượng điện ảnh' },
      { id: 'runway-gen3', name: 'Runway Gen-3 Alpha', tag: 'Tạo clip siêu mượt' },
      { id: 'custom-webhook', name: 'Custom HTTP Webhook', tag: 'Tùy biến payload JSON' },
    ],
    keyPrefix: '',
    keyPlaceholder: 'Token API hoặc Secret Key...',
    consoleUrl: 'https://klingai.com/',
    consoleName: 'Kling AI Developer Portal',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
];

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
        if (!hasCurrent) {
          const recommended = res.models.find((m) => m.isRecommended) || res.models[0];
          if (recommended) {
            setModels((prev) => ({ ...prev, [provId]: recommended.id }));
          }
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
                  className={`p-3 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-white border-zinc-950 ring-2 ring-zinc-950/10 shadow-sm'
                      : 'bg-zinc-50 hover:bg-white border-black/[0.08] text-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 truncate">
                      {prov.id === 'gemini' && (
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                          <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" fill="url(#gemini-card-grad)" />
                          <defs>
                            <linearGradient id="gemini-card-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                              <stop offset="0%" stopColor="#1BA1E3" />
                              <stop offset="50%" stopColor="#5B7FFF" />
                              <stop offset="100%" stopColor="#C473FF" />
                            </linearGradient>
                          </defs>
                        </svg>
                      )}
                      {prov.id === 'openai' && (
                        <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#10A37F]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                        </svg>
                      )}
                      {prov.id === 'claude' && (
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#D97757">
                          <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
                        </svg>
                      )}
                      {prov.id === 'deepseek' && (
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                          <path d="M3.5 14.5C3.5 9.5 7.5 5.5 12.5 5.5C17.5 5.5 21.5 9 21.5 14C21.5 17 19.5 19.5 16.5 19.5C13.5 19.5 12 17.5 10 17.5C8 17.5 6.5 19 4.5 18C3.8 17 3.5 15.8 3.5 14.5Z" fill="#1E6FFF"/>
                          <circle cx="8" cy="12" r="1.5" fill="#FFFFFF"/>
                        </svg>
                      )}
                      {prov.id === 'grok' && (
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="12" fill="#000000" />
                          <path
                            fill="#ffffff"
                            d="m19.25 5.08l-9.52 9.67l6.64-4.96c.33-.24.79-.15.95.23c.82 1.99.45 4.39-1.17 6.03c-1.63 1.64-3.89 2.01-5.96 1.18l-2.26 1.06c3.24 2.24 7.18 1.69 9.64-.8c1.95-1.97 2.56-4.66 1.99-7.09c-.82-3.56.2-4.98 2.29-7.89L22 2.3zm-9.53 9.67h.01zm-1.37 1.21c-2.33-2.25-1.92-5.72.06-7.73c1.47-1.48 3.87-2.09 5.97-1.2l2.25-1.05c-3.23-2.25-7.17-1.69-9.64.8c-2.11 2.13-2.77 5.41-1.63 8.21c.85 2.09-.54 3.57-1.95 5.06l-.28.3l6.35-5.73z"
                            transform="translate(12, 12) scale(0.72) translate(-12, -12)"
                          />
                        </svg>
                      )}
                      {prov.id === 'plugin' && (
                        <Globe className="w-3.5 h-3.5 flex-shrink-0 text-purple-600" />
                      )}
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
              className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2.5 transition animate-in fade-in ${
                discoveryStatus[activeProvider]?.type === 'loading'
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
              <select
                value={models[activeProvider] || activeModels[0]?.id || currentMeta.defaultModel}
                onChange={(e) =>
                  setModels((prev) => ({ ...prev, [activeProvider]: e.target.value }))
                }
                className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900 font-mono"
              >
                {activeModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.isLiveFromKey ? '⚡ (Từ Key)' : ''} — {m.tag}
                  </option>
                ))}
              </select>
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
                    className={`p-3 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                      isSelected
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
                        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 ml-1.5 ${
                          isSelected ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-white border border-zinc-200 text-zinc-600'
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
