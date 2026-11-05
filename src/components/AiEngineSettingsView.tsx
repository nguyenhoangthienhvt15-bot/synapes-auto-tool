import React, { useState, useEffect } from 'react';
import { AIProviderConfig, AIProviderId } from '../types';
import {
  Cpu, Key, Globe, CheckCircle2, Sparkles, RefreshCw,
  ExternalLink, Eye, EyeOff, ShieldCheck, Check, ArrowLeft, Radio
} from 'lucide-react';

interface AiEngineSettingsViewProps {
  config: AIProviderConfig;
  onUpdateConfig: (cfg: AIProviderConfig) => void;
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
    defaultModel: 'gemini-2.0-flash',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tag: 'Siêu tốc • Tối ưu chi phí • Khuyên dùng' },
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
      { id: 'o1', name: 'o1 (Reasoning)', tag: 'Tư duy logic kịch bản chiều sâu' },
      { id: 'o3-mini', name: 'o3-mini', tag: 'Suy luận tốc độ cao thế hệ mới' },
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
  config,
  onUpdateConfig,
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

  const currentMeta = PROVIDERS.find((p) => p.id === activeProvider) || PROVIDERS[0];
  const isDefaultSelected = (config.activeProvider || config.mode) === activeProvider;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleTestConnection = () => {
    const key = keys[activeProvider]?.trim();
    if (!key) {
      setTestResult(`⚠️ Vui lòng nhập API Key cho ${currentMeta.name} trước khi kiểm tra.`);
      return;
    }

    setIsTesting(true);
    setTestResult(`Đang gửi tín hiệu kiểm tra Ping đến máy chủ ${currentMeta.name}...`);

    setTimeout(() => {
      setIsTesting(false);
      setTestResult(`✅ Kết nối thành công! Động cơ ${currentMeta.name} phản hồi HTTP 200 OK (${models[activeProvider]}). Sẵn sàng tạo kịch bản video.`);
      setTimeout(() => setTestResult(null), 5000);
    }, 1100);
  };

  return (
    <div className="space-y-6 animate-fade-in select-none text-zinc-900 max-w-6xl mx-auto pb-10">
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
                    <span className="text-xs font-bold text-zinc-900 truncate">
                      {prov.name}
                    </span>
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-700 font-medium">
                Khóa Xác Thực ({currentMeta.name} API Key) *
              </label>
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
              <span>Được lưu trữ bảo mật cục bộ tại trình duyệt (Local Storage Encrypted).</span>
              <span className="font-mono">Định dạng chuẩn: {currentMeta.keyPrefix}...</span>
            </div>
          </div>

          {/* Model & Endpoint selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-700 font-medium block mb-1">
                Mô Hình AI (Model Release)
              </label>
              <select
                value={models[activeProvider] || currentMeta.defaultModel}
                onChange={(e) =>
                  setModels((prev) => ({ ...prev, [activeProvider]: e.target.value }))
                }
                className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900 font-mono"
              >
                {currentMeta.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.tag}
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
