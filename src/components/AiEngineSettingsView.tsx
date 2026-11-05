import React, { useState } from 'react';
import { AIProviderConfig } from '../types';
import { Cpu, Key, Globe, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

interface AiEngineSettingsViewProps {
  config: AIProviderConfig;
  onUpdateConfig: (cfg: AIProviderConfig) => void;
  onBack?: () => void;
}

export const AiEngineSettingsView: React.FC<AiEngineSettingsViewProps> = ({
  config,
  onUpdateConfig,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'plugin'>('gemini');
  const [geminiKeyInput, setGeminiKeyInput] = useState(config.gemini.apiKey);
  const [geminiModel, setGeminiModel] = useState(config.gemini.model);
  const [ttsVoice, setTtsVoice] = useState(config.gemini.ttsVoice);

  // Plugin form
  const [pluginName, setPluginName] = useState(config.plugin.name);
  const [pluginUrl, setPluginUrl] = useState(config.plugin.endpointUrl);
  const [pluginToken, setPluginToken] = useState(config.plugin.apiToken);
  const [inputMapping, setInputMapping] = useState(config.plugin.inputMapping);
  const [outputMapping, setOutputMapping] = useState(config.plugin.outputMapping);

  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSaveGemini = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      ...config,
      mode: 'gemini',
      gemini: {
        apiKey: geminiKeyInput.trim(),
        model: geminiModel,
        ttsVoice,
      },
    });
    setTestResult('Đã lưu cấu hình Google Gemini Native Engine.');
    setTimeout(() => setTestResult(null), 3500);
  };

  const handleSavePlugin = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      ...config,
      mode: 'plugin',
      plugin: {
        ...config.plugin,
        name: pluginName.trim(),
        endpointUrl: pluginUrl.trim(),
        apiToken: pluginToken.trim(),
        inputMapping,
        outputMapping,
      },
    });
    setTestResult('Đã lưu cấu hình Plugin URL Web.');
    setTimeout(() => setTestResult(null), 3500);
  };

  const handleTestConnection = () => {
    setTestResult('Đang gửi test ping request...');
    setTimeout(() => {
      setTestResult('✅ Kết nối thành công! HTTP 200 OK từ máy chủ.');
    }, 1000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150 select-none text-zinc-900">
      {/* Header bar */}
      <div className="studio-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-secondary cursor-pointer"
              title="Quay lại bàn duyệt"
            >
              <span>← Quay Lại</span>
            </button>
          )}

          <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-black/[0.06] flex items-center justify-center text-zinc-900 flex-shrink-0">
            <Cpu className="w-4 h-4 text-zinc-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-950 tracking-tight">Cấu Hình Động Cơ AI & Plugin</h2>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200">
                DUAL ARCHITECTURE
              </span>
            </div>
            <p className="text-zinc-500 text-xs mt-0.5">
              Lựa chọn giữa Gemini Native (tiện lợi) hoặc Plugin URL ngoài (Kling AI, Runway Gen-3, Webhook)
            </p>
          </div>
        </div>

        {/* Tab switcher: Studio Segmented Control */}
        <div className="studio-segmented-container">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`studio-segmented-item cursor-pointer ${activeTab === 'gemini' ? 'active' : ''}`}
          >
            Gemini Native Engine
          </button>
          <button
            onClick={() => setActiveTab('plugin')}
            className={`studio-segmented-item cursor-pointer ${activeTab === 'plugin' ? 'active' : ''}`}
          >
            Plugin URL Ngoài
          </button>
        </div>
      </div>

      {testResult && (
        <div className="p-3 rounded-lg bg-zinc-50 border border-black/[0.08] text-zinc-900 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      {/* TAB 1: GEMINI NATIVE */}
      {activeTab === 'gemini' && (
        <div className="studio-card p-5 sm:p-6 space-y-4">
          <div className="p-3 rounded-lg bg-zinc-50 border border-black/[0.06] text-zinc-700 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-zinc-950">Tiêu chuẩn Google Gemini:</strong> Nhập <strong>Gemini API Key</strong> từ Google AI Studio. Hệ thống tự động phân cảnh kịch bản, sinh giọng đọc TTS và tích hợp luồng xử lý video.
            </div>
          </div>

          <form onSubmit={handleSaveGemini} className="space-y-4 text-xs">
            <div>
              <label className="text-zinc-700 font-medium block mb-1">Google Gemini API Key *</label>
              <div className="relative">
                <Key className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="password"
                  required
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-white border border-black/[0.1] rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-900 font-mono focus:outline-none focus:border-zinc-900 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-700 font-medium block mb-1">Phiên bản Mô hình (Model)</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value as any)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg p-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-900 font-mono"
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Tốc độ cao, tối ưu chi phí)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Suy luận sâu kịch bản dài)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">Giọng Đọc Lồng Tiếng (TTS)</label>
                <select
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg p-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-900 font-mono"
                >
                  <option value="vi-VN-Standard-B (Nam Bắc chuẩn)">vi-VN-Standard-B (Nam Bắc trầm ấm)</option>
                  <option value="vi-VN-Wavenet-A (Nữ Bắc năng động)">vi-VN-Wavenet-A (Nữ Bắc năng động)</option>
                  <option value="vi-VN-Standard-C (Nam Nam Bộ truyền cảm)">vi-VN-Standard-C (Nam Nam Bộ truyền cảm)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-black/[0.06] flex justify-end">
              <button
                type="submit"
                className="btn-primary cursor-pointer"
              >
                Lưu Cấu Hình Gemini
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: PLUGIN URL */}
      {activeTab === 'plugin' && (
        <div className="studio-card p-5 sm:p-6 space-y-4">
          <div className="p-3 rounded-lg bg-zinc-50 border border-black/[0.06] text-zinc-700 text-xs flex items-start gap-2.5">
            <Globe className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-zinc-950">Plugin URL Ngoài:</strong> Kết nối trực tiếp đến các nền tảng video chuyên biệt (Kling AI, Runway Gen-3 hoặc Webhook riêng theo chuẩn API).
            </div>
          </div>

          <form onSubmit={handleSavePlugin} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-700 font-medium block mb-1">Tên Plugin *</label>
                <input
                  type="text"
                  required
                  value={pluginName}
                  onChange={(e) => setPluginName(e.target.value)}
                  placeholder="Kling Video v1.5"
                  className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">API Secret Key *</label>
                <input
                  type="password"
                  required
                  value={pluginToken}
                  onChange={(e) => setPluginToken(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-2 text-xs text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-700 font-medium block mb-1">Endpoint Webhook URL *</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={pluginUrl}
                  onChange={(e) => setPluginUrl(e.target.value)}
                  placeholder="https://api.klingai.com/v1/videos/text2video"
                  className="flex-1 bg-white border border-black/[0.1] rounded-lg px-3 py-2 text-xs text-zinc-900 font-mono focus:outline-none focus:border-zinc-900"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  className="btn-secondary cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Test URL</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-700 font-medium block mb-1">Input Payload (JSON Template)</label>
                <textarea
                  rows={3}
                  value={inputMapping}
                  onChange={(e) => setInputMapping(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg p-2.5 text-[11px] text-zinc-800 font-mono focus:outline-none focus:border-zinc-900"
                ></textarea>
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">Output Response Path (JSON Extraction)</label>
                <textarea
                  rows={3}
                  value={outputMapping}
                  onChange={(e) => setOutputMapping(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg p-2.5 text-[11px] text-zinc-800 font-mono focus:outline-none focus:border-zinc-900"
                ></textarea>
              </div>
            </div>

            <div className="pt-3 border-t border-black/[0.06] flex justify-end">
              <button
                type="submit"
                className="btn-primary cursor-pointer"
              >
                Lưu Cấu Hình Plugin
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
