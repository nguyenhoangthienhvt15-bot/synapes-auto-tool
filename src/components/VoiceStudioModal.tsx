import React, { useState, useEffect } from 'react';
import { VoiceProfile, VoiceLanguage } from '../types';
import {
  VIETNAMESE_VOICE_PROFILES,
  ENGLISH_VOICE_PROFILES,
  auditionVoice,
  stopVoiceAudition,
  getActiveVoiceSpectrum,
} from '../services/voiceStudioService';
import {
  Mic,
  Play,
  Square,
  X,
  Check,
  Sliders,
  Languages,
  MonitorPlay,
  FileEdit,
  AudioWaveform,
  Volume2,
} from 'lucide-react';

interface VoiceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVoiceId?: string;
  activeLanguage?: VoiceLanguage;
  currentVoiceSpeed?: number;
  currentVoicePitch?: number;
  currentSceneNumber?: number;
  currentSceneVoiceover?: string;
  onOpenLiveDubbingModal?: () => void;
  onApplyVoice: (settings: {
    voiceId: string;
    language: VoiceLanguage;
    speed: number;
    pitch: number;
    updatedText?: string;
    applyToAll: boolean;
  }) => void;
}

export const VoiceStudioModal: React.FC<VoiceStudioModalProps> = ({
  isOpen,
  onClose,
  activeVoiceId,
  activeLanguage = 'vi',
  currentVoiceSpeed = 1.02,
  currentVoicePitch = 0.86,
  currentSceneNumber = 1,
  currentSceneVoiceover = '',
  onOpenLiveDubbingModal,
  onApplyVoice,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceLanguage>(activeLanguage);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    activeVoiceId || (activeLanguage === 'en' ? 'en-us-guy' : 'vi-hn-male-1')
  );
  const [speed, setSpeed] = useState<number>(currentVoiceSpeed);
  const [pitch, setPitch] = useState<number>(currentVoicePitch);
  const [applyToAll, setApplyToAll] = useState<boolean>(true);
  const [isAuditioning, setIsAuditioning] = useState<boolean>(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [activeEngineLabel, setActiveEngineLabel] = useState<string>(
    'Neural TTS + WSOLA Vocal Tract Formant DSP'
  );
  const [spectrumBars, setSpectrumBars] = useState<number[]>(new Array(16).fill(10));

  // Editable scene text
  const [editedVoiceover, setEditedVoiceover] = useState<string>(currentSceneVoiceover);
  const [filterRegion, setFilterRegion] = useState<string>('All');

  useEffect(() => {
    if (isOpen) {
      setEditedVoiceover(currentSceneVoiceover);
    } else {
      stopVoiceAudition();
      setIsAuditioning(false);
      setPlayingVoiceId(null);
    }
  }, [isOpen, currentSceneVoiceover]);

  // Live 16-bar Web Audio Spectrum animation while auditioning
  useEffect(() => {
    if (!isAuditioning) {
      setSpectrumBars(new Array(16).fill(10));
      return;
    }
    const timer = setInterval(() => {
      setSpectrumBars(getActiveVoiceSpectrum(16));
    }, 55);
    return () => clearInterval(timer);
  }, [isAuditioning]);

  if (!isOpen) return null;

  // Select current voice profiles by language
  const availableVoices =
    selectedLanguage === 'en' ? ENGLISH_VOICE_PROFILES : VIETNAMESE_VOICE_PROFILES;

  const selectedVoice =
    availableVoices.find((v) => v.id === selectedVoiceId) || availableVoices[0];

  const filteredVoices =
    filterRegion === 'All'
      ? availableVoices
      : availableVoices.filter((v) =>
          v.region.toLowerCase().includes(filterRegion.toLowerCase())
        );

  // Trigger audition for any specific voice card (or the currently selected voice)
  const triggerVoicePreview = (
    voice: VoiceProfile,
    useSampleSentence = false,
    overrideRate?: number,
    overridePitch?: number
  ) => {
    if (isAuditioning && playingVoiceId === voice.id) {
      stopVoiceAudition();
      setIsAuditioning(false);
      setPlayingVoiceId(null);
      return;
    }

    const rateToUse = overrideRate ?? (voice.id === selectedVoiceId ? speed : voice.rate);
    const pitchToUse = overridePitch ?? (voice.id === selectedVoiceId ? pitch : voice.pitch);
    const textToUse = useSampleSentence
      ? voice.sampleSentence
      : editedVoiceover?.trim() || voice.sampleSentence;

    setSelectedVoiceId(voice.id);
    setSpeed(rateToUse);
    setPitch(pitchToUse);
    setIsAuditioning(true);
    setPlayingVoiceId(voice.id);

    auditionVoice(
      voice,
      textToUse,
      rateToUse,
      pitchToUse,
      () => {
        setIsAuditioning(true);
        setPlayingVoiceId(voice.id);
      },
      () => {
        setIsAuditioning(false);
        setPlayingVoiceId(null);
      },
      (engineName) => setActiveEngineLabel(engineName)
    );
  };

  const handleConfirm = () => {
    stopVoiceAudition();
    onApplyVoice({
      voiceId: selectedVoice.id,
      language: selectedLanguage,
      speed,
      pitch,
      updatedText: editedVoiceover,
      applyToAll,
    });
    onClose();
  };

  const handleClose = () => {
    stopVoiceAudition();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-black/[0.08] flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-sm">
              <Mic className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2 flex-wrap">
                <span>Phòng Thu Lồng Tiếng AI (AI Voice Studio)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  WSOLA Vocal Tract & Formant DSP
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500">
                Phân tách thực tế dải âm Nam (Baritone/Tenor) & Nữ (Mezzo/Soprano) theo từng vùng miền
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
          {/* Top Bar: Language Switcher & Live Direct Dubbing Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-100/80 border border-black/[0.05]">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-zinc-600" />
                <span>Ngôn ngữ lồng tiếng:</span>
              </span>
              <div className="flex bg-white rounded-lg p-0.5 border border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    stopVoiceAudition();
                    setIsAuditioning(false);
                    setPlayingVoiceId(null);
                    setSelectedLanguage('vi');
                    const firstVi = VIETNAMESE_VOICE_PROFILES[0];
                    setSelectedVoiceId(firstVi.id);
                    setSpeed(firstVi.rate);
                    setPitch(firstVi.pitch);
                    setFilterRegion('All');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    selectedLanguage === 'vi'
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span>🇻🇳</span>
                  <span>Tiếng Việt (6 Giọng Thực)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopVoiceAudition();
                    setIsAuditioning(false);
                    setPlayingVoiceId(null);
                    setSelectedLanguage('en');
                    const firstEn = ENGLISH_VOICE_PROFILES[0];
                    setSelectedVoiceId(firstEn.id);
                    setSpeed(firstEn.rate);
                    setPitch(firstEn.pitch);
                    setFilterRegion('All');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    selectedLanguage === 'en'
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span>🇺🇸 🇬🇧</span>
                  <span>English (5 Voices)</span>
                </button>
              </div>
            </div>

            {onOpenLiveDubbingModal && (
              <button
                type="button"
                onClick={() => {
                  stopVoiceAudition();
                  onClose();
                  onOpenLiveDubbingModal();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Mở cửa sổ thứ 3 vừa xem video vừa thu âm trực tiếp bằng micro"
              >
                <MonitorPlay className="w-3.5 h-3.5" />
                <span>Thu Âm Trực Tiếp (Cửa Sổ Thứ 3)</span>
              </button>
            )}
          </div>

          {/* Region Tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] pb-2">
            <div className="flex items-center gap-1 flex-wrap">
              {selectedLanguage === 'vi'
                ? ['All', 'Bắc', 'Nam', 'Trung', 'AI Neural'].map((reg) => (
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
                      {reg === 'All'
                        ? 'Tất cả giọng Việt'
                        : reg === 'AI Neural'
                        ? 'AI Neural'
                        : `Miền ${reg}`}
                    </button>
                  ))
                : ['All', 'America', 'Kingdom', 'AI Neural'].map((reg) => (
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
                      {reg === 'All'
                        ? 'All English Voices'
                        : reg === 'America'
                        ? 'US English'
                        : reg === 'Kingdom'
                        ? 'UK British'
                        : 'Fast Neural'}
                    </button>
                  ))}
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              Bấm <b>Nghe thử</b> trên từng thẻ để so sánh tông giọng
            </span>
          </div>

          {/* Voice Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[250px] overflow-y-auto pr-1">
            {filteredVoices.map((voice) => {
              const isSelected = selectedVoiceId === voice.id;
              const isThisCardPlaying = isAuditioning && playingVoiceId === voice.id;
              const isMale = voice.gender === 'Nam' || voice.gender === 'Male';

              return (
                <div
                  key={voice.id}
                  onClick={() => {
                    setSelectedVoiceId(voice.id);
                    setSpeed(voice.rate);
                    setPitch(voice.pitch);
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-zinc-50/70 border-black/[0.07] hover:bg-zinc-100/70 hover:border-black/[0.15]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-zinc-950 text-xs">{voice.name}</span>
                        {voice.isRecommended && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Khuyên dùng
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-indigo-600 font-semibold mt-0.5 font-mono">
                        {voice.toneTag}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {voice.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-semibold ${
                          isMale
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-pink-50 text-pink-800 border-pink-200'
                        }`}
                      >
                        {voice.gender} • {voice.region}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Acoustic Signature + Direct Audition Button */}
                  <div className="pt-1.5 border-t border-black/[0.06] flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono text-zinc-500 truncate">
                      {voice.acousticSignature || `${voice.rate}x • Pitch ${voice.pitch}x`}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerVoicePreview(voice, true, voice.rate, voice.pitch);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 ${
                        isThisCardPlaying
                          ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                          : 'bg-zinc-900 hover:bg-indigo-600 text-white shadow-xs'
                      }`}
                    >
                      {isThisCardPlaying ? (
                        <>
                          <Square className="w-2.5 h-2.5 fill-white" />
                          <span>Dừng</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-2.5 h-2.5 fill-white" />
                          <span>Nghe thử</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sliders: Rate & Pitch + Live Spectrum */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-black/[0.06] space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-800 flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tinh Chỉnh Tần Số & Tốc Độ: {selectedVoice.name}</span>
              </span>
              <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {speed.toFixed(2)}x Tốc độ • {pitch.toFixed(2)}x Cao độ (
                {selectedVoice.dspDetuneCents && selectedVoice.dspDetuneCents < 0
                  ? `${selectedVoice.dspDetuneCents}c Trầm`
                  : `+${selectedVoice.dspDetuneCents || 0}c Sáng`}
                )
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-[11px] text-zinc-600 mb-1">
                  <span>Tốc độ đọc (Speed / Tempo)</span>
                  <span className="font-mono font-bold text-zinc-900">{speed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.02"
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
                  <span>Cao độ thanh quản (Vocal Pitch)</span>
                  <span className="font-mono font-bold text-zinc-900">{pitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.70"
                  max="1.35"
                  step="0.02"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-zinc-900 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-400 font-mono mt-0.5">
                  <span>0.70x (Nam Trầm)</span>
                  <span>1.0x (Tự nhiên)</span>
                  <span>1.35x (Nữ Cao)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Script & Test Voice Audition Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-700">
              <span className="flex items-center gap-1">
                <FileEdit className="w-3.5 h-3.5 text-zinc-500" />
                <span>Nội dung thoại Cảnh {currentSceneNumber} (Tự do chỉnh sửa):</span>
              </span>
              <button
                type="button"
                onClick={() => setEditedVoiceover(selectedVoice.sampleSentence)}
                className="text-[10px] text-indigo-600 hover:underline cursor-pointer font-semibold"
              >
                Dùng câu mẫu chuẩn của {selectedVoice.name}
              </button>
            </div>
            <textarea
              rows={2}
              value={editedVoiceover}
              onChange={(e) => setEditedVoiceover(e.target.value)}
              className="w-full bg-white border border-black/[0.1] rounded-lg p-2.5 text-xs text-zinc-900 font-medium focus:outline-none focus:border-zinc-900 leading-relaxed"
              placeholder="Nhập nội dung thoại bạn muốn giọng đọc phát..."
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerVoicePreview(selectedVoice, false, speed, pitch)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                    isAuditioning
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  }`}
                >
                  {isAuditioning ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>Dừng Phát Thử</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Đọc Thử Lời Thoại Cảnh ({selectedVoice.name})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Real-time 16-bar Web Audio Spectrum Visualizer */}
              <div className="flex items-center gap-2 bg-zinc-900 text-white px-3 py-1.5 rounded-lg">
                <AudioWaveform className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="flex items-end gap-0.5 h-4 w-24">
                  {spectrumBars.map((val, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${ isAuditioning ? val : 15 }%` }}
                      className={`flex-1 rounded-t transition-all duration-75 ${
                        isAuditioning ? 'bg-emerald-400' : 'bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-zinc-300 truncate max-w-[180px]">
                  {isAuditioning ? activeEngineLabel : 'Sẵn sàng kiểm âm'}
                </span>
              </div>
            </div>
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
                <span>Chỉ cảnh {currentSceneNumber}</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-800 font-semibold">
                <input
                  type="radio"
                  name="applyScope"
                  checked={applyToAll}
                  onChange={() => setApplyToAll(true)}
                  className="text-zinc-900 focus:ring-0"
                />
                <span>Toàn bộ video ({applyToAll ? 'Đã chọn' : ''})</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-black/[0.08] bg-zinc-50 flex items-center justify-between">
          <span className="text-[11px] text-zinc-600 font-mono font-medium">
            {selectedVoice.name} • {selectedVoice.gender} ({selectedVoice.region}) •{' '}
            {speed.toFixed(2)}x
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm"
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
