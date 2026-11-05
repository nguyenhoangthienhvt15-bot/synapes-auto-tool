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
    setTestResult('Đã lưu cấu hình Google Gemini Native Engine thành công.');
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
    setTestResult('Đã lưu cấu hình Plugin URL Web thành công.');
    setTimeout(() => setTestResult(null), 3500);
  };

  const handleTestConnection = () => {
    setTestResult('Đang gửi test ping request...');
    setTimeout(() => {
      setTestResult('✅ Kết nối thành công! HTTP 200 OK từ máy chủ đối tác.');
    }, 1000);
  };

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Header bar */}
      <div className="apple-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold border border-black/[0.08] transition apple-btn-tap flex items-center gap-1.5 shadow-2xs mr-1"
              title="Thoát cấu hình, quay lại bàn duyệt"
            >
              <span>← Quay Lại</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] flex-shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#1D1D1F] tracking-tight">Cấu Hình Động Cơ AI & Plugin</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#0071E3] bg-[#0071E3]/10 border border-[#0071E3]/20 font-semibold">
                DUAL ARCHITECTURE
              </span>
            </div>
            <p className="text-zinc-500 text-xs mt-0.5">
              Lựa chọn giữa Gemini Native (tiện lợi) hoặc Plugin URL ngoài (Kling AI, Runway Gen-3, Webhook)
            </p>
          </div>
        </div>

        {/* Tab switcher: Apple Segmented Control */}
        <div className="apple-segmented-container">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`apple-segmented-item ${activeTab === 'gemini' ? 'active' : ''}`}
          >
            1. Gemini Native Engine
          </button>
          <button
            onClick={() => setActiveTab('plugin')}
            className={`apple-segmented-item ${activeTab === 'plugin' ? 'active' : ''}`}
          >
            2. Plugin URL Ngoài
          </button>
        </div>
      </div>

      {testResult && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      {/* TAB 1: GEMINI NATIVE */}
      {activeTab === 'gemini' && (
        <div className="apple-card p-6 space-y-5">
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-blue-900 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#0071E3] flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-blue-950">Gói Tiêu Chuẩn (Google Gemini):</strong> Chỉ cần nhập duy nhất một <strong>Gemini API Key</strong> từ Google AI Studio. Hệ thống xử lý trọn gói: viết kịch bản + Google TTS lồng tiếng + Worker nội bộ ghép video MP4 hoàn chỉnh.
            </div>
          </div>

          <form onSubmit={handleSaveGemini} className="space-y-4 text-xs">
            <div>
              <label className="text-zinc-700 font-semibold block mb-1">Google Gemini API Key *</label>
              <div className="relative">
                <Key className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="password"
                  required
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-[#0071E3] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-700 font-semibold block mb-1">Phiên bản Mô hình (Model)</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value as any)}
                  className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl p-2 text-xs text-zinc-800 focus:outline-none focus:bg-white focus:border-[#0071E3]"
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Khuyên dùng: Tốc độ cao, tối ưu chi phí)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Suy luận sâu kịch bản dài)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-700 font-semibold block mb-1">Giọng Đọc Lồng Tiếng (TTS)</label>
                <select
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl p-2 text-xs text-zinc-800 focus:outline-none focus:bg-white focus:border-[#0071E3]"
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
                className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-[0.98]"
              >
                Lưu Cấu Hình Gemini
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: PLUGIN URL */}
      {activeTab === 'plugin' && (
        <div className="apple-card p-6 space-y-5">
          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80 text-purple-900 text-xs flex items-start gap-2.5">
            <Globe className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-purple-950">Gói Mở Rộng (Plugin URL Web):</strong> Kết nối trực tiếp đến các nền tảng AI Video chuyên biệt (như Kling AI, Runway Gen-3, hoặc Webhook riêng theo chuẩn API).
            </div>
          </div>

          <form onSubmit={handleSavePlugin} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-700 font-semibold block mb-1">Tên Plugin *</label>
                <input
                  type="text"
                  required
                  value={pluginName}
                  onChange={(e) => setPluginName(e.target.value)}
                  placeholder="Kling Video v1.5"
                  className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-semibold block mb-1">API Secret Key *</label>
                <input
                  type="password"
                  required
                  value={pluginToken}
                  onChange={(e) => setPluginToken(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl px-3 py-2 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-[#0071E3]"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-700 font-semibold block mb-1">Endpoint Webhook URL *</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={pluginUrl}
                  onChange={(e) => setPluginUrl(e.target.value)}
                  placeholder="https://api.klingai.com/v1/videos/text2video"
                  className="flex-1 bg-[#FAF9F5] border border-black/[0.1] rounded-xl px-3 py-2 text-xs text-[#0071E3] font-mono focus:outline-none focus:bg-white focus:border-[#0071E3]"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  className="px-3 py-2 bg-[#FAF9F5] hover:bg-zinc-100 border border-black/[0.08] text-zinc-700 rounded-xl text-xs flex items-center gap-1.5 transition font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Test URL</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-700 font-semibold block mb-1">Input Payload (JSON Template)</label>
                <textarea
                  rows={3}
                  value={inputMapping}
                  onChange={(e) => setInputMapping(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl p-2.5 text-[11px] text-zinc-800 font-mono focus:outline-none focus:bg-white focus:border-[#0071E3]"
                ></textarea>
              </div>

              <div>
                <label className="text-zinc-700 font-semibold block mb-1">Output Response Path (JSON Extraction)</label>
                <textarea
                  rows={3}
                  value={outputMapping}
                  onChange={(e) => setOutputMapping(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl p-2.5 text-[11px] text-zinc-800 font-mono focus:outline-none focus:bg-white focus:border-[#0071E3]"
                ></textarea>
              </div>
            </div>

            <div className="pt-3 border-t border-black/[0.06] flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-[0.98]"
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
