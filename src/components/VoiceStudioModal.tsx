import React, { useState } from 'react';
import { VoiceProfile } from '../types';
import { VOICE_PROFILES, auditionVoice } from '../services/voiceStudioService';
import {
  Mic,
  Volume2,
  Play,
  Square,
  Sparkles,
  X,
  Check,
  Sliders,
  Radio,
  Globe,
  Layers,
} from 'lucide-react';

interface VoiceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVoiceId?: string;
  currentVoiceSpeed?: number;
  currentVoicePitch?: number;
  currentSceneNumber?: number;
  currentSceneVoiceover?: string;
  onApplyVoice: (settings: {
    voiceId: string;
    speed: number;
    pitch: number;
    applyToAll: boolean;
  }) => void;
}

export const VoiceStudioModal: React.FC<VoiceStudioModalProps> = ({
  isOpen,
  onClose,
  activeVoiceId,
  currentVoiceSpeed = 1.05,
  currentVoicePitch = 1.0,
  currentSceneNumber = 1,
  currentSceneVoiceover = '',
  onApplyVoice,
}) => {
  if (!isOpen) return null;

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    activeVoiceId || 'vi-hn-male-1'
  );
  const [speed, setSpeed] = useState<number>(currentVoiceSpeed);
  const [pitch, setPitch] = useState<number>(currentVoicePitch);
  const [applyToAll, setApplyToAll] = useState<boolean>(true);
  const [isAuditioning, setIsAuditioning] = useState<boolean>(false);
  const [testText, setTestText] = useState<string>(
    currentSceneVoiceover || 'Chào mừng các bạn đến với video review công nghệ AI thế hệ mới trên SYNAPES Studio.'
  );
  const [filterRegion, setFilterRegion] = useState<'All' | 'Bắc' | 'Nam' | 'Trung' | 'AI Neural'>('All');

  const selectedVoice =
    VOICE_PROFILES.find((v) => v.id === selectedVoiceId) || VOICE_PROFILES[0];

  const filteredVoices =
    filterRegion === 'All'
      ? VOICE_PROFILES
      : VOICE_PROFILES.filter((v) => v.region === filterRegion);

  const handleAudition = () => {
    if (isAuditioning) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsAuditioning(false);
      return;
    }

    setIsAuditioning(true);
    auditionVoice(
      selectedVoice,
      testText,
      speed,
      pitch,
      () => setIsAuditioning(true),
      () => setIsAuditioning(false)
    );
  };

  const handleConfirm = () => {
    onApplyVoice({
      voiceId: selectedVoiceId,
      speed,
      pitch,
      applyToAll,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.08] flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-sm">
              <Mic className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                <span>Phòng Thu Lồng Tiếng AI (Voice Studio)</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-100 text-emerald-800">
                  v3.5 Live
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500">
                Tùy chỉnh giọng đọc Tiếng Việt chuẩn đa vùng miền, tốc độ & cao độ điện ảnh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Region Tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
            <div className="flex items-center gap-1">
              {(['All', 'Bắc', 'Nam', 'Trung', 'AI Neural'] as const).map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setFilterRegion(reg)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    filterRegion === reg
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {reg === 'All' ? 'Tất cả' : `Miền ${reg}`}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              {filteredVoices.length} giọng sẵn sàng
            </span>
          </div>

          {/* Voice Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
            {filteredVoices.map((voice) => {
              const isSelected = selectedVoiceId === voice.id;
              return (
                <div
                  key={voice.id}
                  onClick={() => {
                    setSelectedVoiceId(voice.id);
                    setSpeed(voice.rate);
                    setPitch(voice.pitch);
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-zinc-50/60 border-black/[0.06] hover:bg-zinc-100/60 hover:border-black/[0.12]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-zinc-950 text-xs">{voice.name}</span>
                        {voice.isRecommended && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Khuyên dùng
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {voice.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-1.5 py-0.2 rounded bg-white text-zinc-700 border border-black/[0.06] text-[9px] font-mono font-medium">
                        {voice.gender} • {voice.region}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sliders: Rate & Pitch */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-black/[0.06] space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-800">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-zinc-600" />
                <span>Tinh Chỉnh Tần Số & Tốc Độ Giọng: {selectedVoice.name}</span>
              </span>
              <span className="font-mono text-indigo-600">
                {speed.toFixed(2)}x Tốc độ • {pitch.toFixed(2)}x Cao độ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-[11px] text-zinc-600 mb-1">
                  <span>Tốc độ đọc (Speed / Rate)</span>
                  <span className="font-mono font-bold text-zinc-900">{speed}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-zinc-900 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-400 font-mono mt-0.5">
                  <span>0.75x (Chậm)</span>
                  <span>1.0x (Chuẩn)</span>
                  <span>1.25x (Viral)</span>
                  <span>1.5x (Nhanh)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-zinc-600 mb-1">
                  <span>Cao độ giọng (Pitch)</span>
                  <span className="font-mono font-bold text-zinc-900">{pitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.25"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-zinc-900 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-400 font-mono mt-0.5">
                  <span>0.8x (Trầm uy lực)</span>
                  <span>1.0x (Tự nhiên)</span>
                  <span>1.25x (Sáng/Thanh)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Voice Audition Section */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-700 flex items-center justify-between">
              <span>Đoạn văn bản nghe thử (Audition Text):</span>
              <button
                type="button"
                onClick={() => setTestText(currentSceneVoiceover || selectedVoice.sampleSentence)}
                className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
              >
                Khôi phục lời thoại cảnh {currentSceneNumber}
              </button>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="flex-1 bg-white border border-black/[0.1] rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                placeholder="Nhập câu thoại muốn nghe thử..."
              />
              <button
                type="button"
                onClick={handleAudition}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                  isAuditioning
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                }`}
              >
                {isAuditioning ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Nghe Thử</span>
                  </>
                )}
              </button>
            </div>

            {/* Audio Waveform Simulator */}
            {isAuditioning && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-zinc-950 text-emerald-400 text-[10px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Đang phát qua bộ tổng hợp giọng nói AI Studio...</span>
                <div className="flex items-end gap-1 h-3 ml-auto">
                  <div className="w-1 bg-emerald-400 rounded-full animate-bounce h-2"></div>
                  <div className="w-1 bg-emerald-400 rounded-full animate-bounce h-3 delay-75"></div>
                  <div className="w-1 bg-emerald-400 rounded-full animate-bounce h-1 delay-150"></div>
                  <div className="w-1 bg-emerald-400 rounded-full animate-bounce h-3 delay-100"></div>
                </div>
              </div>
            )}
          </div>

          {/* Scope selection */}
          <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs">
            <span className="text-zinc-700 font-medium">Phạm vi áp dụng giọng:</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-800">
                <input
                  type="radio"
                  name="applyScope"
                  checked={!applyToAll}
                  onChange={() => setApplyToAll(false)}
                  className="text-zinc-900 focus:ring-0"
                />
                <span>Chỉ cảnh hiện tại (Cảnh {currentSceneNumber})</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-800 font-semibold">
                <input
                  type="radio"
                  name="applyScope"
                  checked={applyToAll}
                  onChange={() => setApplyToAll(true)}
                  className="text-zinc-900 focus:ring-0"
                />
                <span>Toàn bộ phân cảnh ({applyToAll ? 'Đã chọn' : ''})</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-black/[0.08] bg-zinc-50 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">
            {selectedVoice.name} • {speed}x • {pitch}x
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-black text-white transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lưu & Áp Dụng Lồng Tiếng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
