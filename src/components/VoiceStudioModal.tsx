import React, { useState, useEffect, useRef } from 'react';
import { Project, VoiceProfile, VoiceLanguage } from '../types';
import {
  VIETNAMESE_VOICE_PROFILES,
  ENGLISH_VOICE_PROFILES,
  auditionVoice,
  stopVoiceAudition,
  getActiveVoiceSpectrum,
  synthesizeNeuralVoiceToWav,
} from '../services/voiceStudioService';
import {
  Mic,
  Play,
  Square,
  X,
  Check,
  Sliders,
  Languages,
  AudioWaveform,
  Volume2,
  Upload,
  Trash2,
  Sparkles,
  Loader2,
  FileAudio,
} from 'lucide-react';

interface VoiceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
  activeVoiceId?: string;
  activeLanguage?: VoiceLanguage;
  currentVoiceSpeed?: number;
  currentVoicePitch?: number;
  currentSceneNumber?: number;
  currentSceneVoiceover?: string;
  existingMasterAudioUrl?: string;
  onApplyVoice: (settings: {
    voiceId: string;
    language: VoiceLanguage;
    speed: number;
    pitch: number;
    masterAudioDataUrl?: string;
    masterAudioLabel?: string;
    applyToAll: boolean;
  }) => void;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Không thể chuyển đổi tệp âm thanh sang Data URL.'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Lỗi đọc dữ liệu âm thanh.'));
    reader.readAsDataURL(blob);
  });
}

export const VoiceStudioModal: React.FC<VoiceStudioModalProps> = ({
  isOpen,
  onClose,
  project,
  activeVoiceId,
  activeLanguage = 'vi',
  currentVoiceSpeed = 1.02,
  currentVoicePitch = 1.0,
  currentSceneVoiceover = '',
  existingMasterAudioUrl = '',
  onApplyVoice,
}) => {
  const [studioTab, setStudioTab] = useState<'mic' | 'ai'>('mic');
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceLanguage>(activeLanguage);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    activeVoiceId || (activeLanguage === 'en' ? 'en-us-guy' : 'vi-hn-male-1')
  );
  const [speed, setSpeed] = useState<number>(currentVoiceSpeed);
  const [pitch, setPitch] = useState<number>(currentVoicePitch);
  const [isAuditioning, setIsAuditioning] = useState<boolean>(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [activeEngineLabel, setActiveEngineLabel] = useState<string>(
    'Neural TTS + WSOLA Formant DSP'
  );
  const [spectrumBars, setSpectrumBars] = useState<number[]>(new Array(20).fill(12));
  const [filterRegion, setFilterRegion] = useState<string>('All');

  // Whole-video script (all scenes concatenated)
  const buildFullProjectScript = () => {
    if (project?.storyboard?.length) {
      return project.storyboard
        .map((s) => (s.voiceover || '').trim())
        .filter(Boolean)
        .join('. ');
    }
    return currentSceneVoiceover || '';
  };

  const [fullScriptText, setFullScriptText] = useState<string>(buildFullProjectScript);
  const [isSynthesizingMasterAi, setIsSynthesizingMasterAi] = useState<boolean>(false);
  const [aiStatusNote, setAiStatusNote] = useState<string | null>(null);

  // Unified Whole-Video Microphone Recording State
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const [recordingSec, setRecordingSec] = useState<number>(0);
  const [micDataUrl, setMicDataUrl] = useState<string>(existingMasterAudioUrl || '');
  const [micLabel, setMicLabel] = useState<string>(
    existingMasterAudioUrl ? 'Bản thu Master đang gắn cho toàn video' : ''
  );
  const [micError, setMicError] = useState<string | null>(null);
  const [micBars, setMicBars] = useState<number[]>(new Array(24).fill(10));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const micAnalyserTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const audioUploadRef = useRef<HTMLInputElement | null>(null);

  const cleanupMicStream = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (micAnalyserTimerRef.current) {
      clearInterval(micAnalyserTimerRef.current);
      micAnalyserTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (micAudioCtxRef.current) {
      micAudioCtxRef.current.close().catch(() => {});
      micAudioCtxRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFullScriptText(buildFullProjectScript());
      setMicDataUrl(existingMasterAudioUrl || '');
      setMicLabel(existingMasterAudioUrl ? 'Bản thu Master đang gắn cho toàn video' : '');
      setMicError(null);
      setAiStatusNote(null);
    } else {
      stopVoiceAudition();
      setIsAuditioning(false);
      setPlayingVoiceId(null);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      setIsRecordingMic(false);
      cleanupMicStream();
    }
    return () => {
      cleanupMicStream();
    };
  }, [isOpen, project?.id, existingMasterAudioUrl]);

  useEffect(() => {
    if (!isAuditioning) {
      setSpectrumBars(new Array(20).fill(12));
      return;
    }
    const timer = setInterval(() => {
      setSpectrumBars(getActiveVoiceSpectrum(20));
    }, 55);
    return () => clearInterval(timer);
  }, [isAuditioning]);

  if (!isOpen) return null;

  const availableVoices =
    selectedLanguage === 'en' ? ENGLISH_VOICE_PROFILES : VIETNAMESE_VOICE_PROFILES;
  const selectedVoice =
    availableVoices.find((v) => v.id === selectedVoiceId) || availableVoices[0];

  const filteredVoices =
    filterRegion === 'All'
      ? availableVoices
      : availableVoices.filter((v) =>
          filterRegion === 'Apple Keynote'
            ? v.id.includes('apple') || v.region.toLowerCase().includes('apple')
            : v.region.toLowerCase().includes(filterRegion.toLowerCase())
        );

  const handleStartMicRecording = async () => {
    setMicError(null);
    stopVoiceAudition();
    setIsAuditioning(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanupMicStream();
        setIsRecordingMic(false);
        setMicBars(new Array(24).fill(10));
        if (blob.size > 0) {
          try {
            const dataUrl = await blobToDataUrl(blob);
            setMicDataUrl(dataUrl);
            setMicLabel(
              `Bản thu Micro toàn video (${Math.max(1, Math.round(blob.size / 1024))} KB)`
            );
          } catch (e: any) {
            setMicError(e?.message || 'Không lưu được dữ liệu thu âm.');
          }
        }
      };

      // Live visualizer from mic stream
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const aCtx = new AudioCtx();
        micAudioCtxRef.current = aCtx;
        const src = aCtx.createMediaStreamSource(stream);
        const analyser = aCtx.createAnalyser();
        analyser.fftSize = 64;
        src.connect(analyser);
        const freqArr = new Uint8Array(analyser.frequencyBinCount);
        micAnalyserTimerRef.current = setInterval(() => {
          analyser.getByteFrequencyData(freqArr);
          const next = Array.from({ length: 24 }, (_, idx) => {
            const val = freqArr[idx % freqArr.length] || 0;
            return Math.max(10, Math.min(100, Math.round((val / 255) * 100)));
          });
          setMicBars(next);
        }, 65);
      } catch {}

      mediaRecorderRef.current = recorder;
      recorder.start(200);
      setIsRecordingMic(true);
      setRecordingSec(0);
      timerRef.current = setInterval(() => {
        setRecordingSec((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      cleanupMicStream();
      setIsRecordingMic(false);
      setMicError(
        err?.name === 'NotAllowedError'
          ? 'Trình duyệt chưa được cấp quyền Micro. Vui lòng bật Micro hoặc tải tệp thu âm từ máy.'
          : err?.message || 'Không thể khởi tạo Micro trên thiết bị này.'
      );
    }
  };

  const handleStopMicRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleUploadMasterAudio = async (file: File) => {
    setMicError(null);
    try {
      const dataUrl = await blobToDataUrl(file);
      setMicDataUrl(dataUrl);
      setMicLabel(`File Master: ${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`);
    } catch (err: any) {
      setMicError(err?.message || 'Không đọc được tệp âm thanh đã chọn.');
    }
  };

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
      : fullScriptText.trim() || voice.sampleSentence;

    setSelectedVoiceId(voice.id);
    setSpeed(rateToUse);
    setPitch(pitchToUse);
    setIsAuditioning(true);
    setPlayingVoiceId(voice.id);

    auditionVoice(
      voice,
      textToUse.slice(0, 320),
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

  const handleApplyMicTrack = () => {
    stopVoiceAudition();
    onApplyVoice({
      voiceId: selectedVoice.id,
      language: selectedLanguage,
      speed,
      pitch,
      masterAudioDataUrl: micDataUrl || undefined,
      masterAudioLabel: micLabel || 'Thu Âm Micro Toàn Video',
      applyToAll: true,
    });
    onClose();
  };

  const handleApplyAiMasterTrack = async () => {
    stopVoiceAudition();
    const scriptToSpeak = fullScriptText.trim();
    if (!scriptToSpeak) {
      onApplyVoice({
        voiceId: selectedVoice.id,
        language: selectedLanguage,
        speed,
        pitch,
        masterAudioDataUrl: undefined,
        masterAudioLabel: `Voice AI (${selectedVoice.name})`,
        applyToAll: true,
      });
      onClose();
      return;
    }

    setIsSynthesizingMasterAi(true);
    setAiStatusNote('Đang tổng hợp file Master WAV liên tục cho toàn bộ video...');
    try {
      const result = await synthesizeNeuralVoiceToWav(scriptToSpeak, selectedVoice, {
        rate: speed,
        pitch,
      });
      const masterDataUrl = await blobToDataUrl(result.blob);
      URL.revokeObjectURL(result.url);
      onApplyVoice({
        voiceId: selectedVoice.id,
        language: selectedLanguage,
        speed,
        pitch,
        masterAudioDataUrl: masterDataUrl,
        masterAudioLabel: `${selectedVoice.name} • Master WAV (${result.durationSec}s)`,
        applyToAll: true,
      });
      onClose();
    } catch {
      setAiStatusNote('Đang áp dụng hồ sơ giọng AI đồng bộ từng phân cảnh...');
      onApplyVoice({
        voiceId: selectedVoice.id,
        language: selectedLanguage,
        speed,
        pitch,
        masterAudioDataUrl: undefined,
        masterAudioLabel: `Voice AI (${selectedVoice.name})`,
        applyToAll: true,
      });
      onClose();
    } finally {
      setIsSynthesizingMasterAi(false);
    }
  };

  const handleClose = () => {
    stopVoiceAudition();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    cleanupMicStream();
    onClose();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      data-testid="voice-studio-modal"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-black/[0.08] flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-sm">
              <Mic className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2 flex-wrap">
                <span>Phòng Thu Giọng Toàn Video</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Master Audio Liên Tục
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500">
                Thu âm micro hoặc lồng tiếng AI một mạch xuyên suốt toàn bộ video (không cắt rời từng cảnh)
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

        {/* Mode Switcher Tabs (Unified Whole-Video Only) */}
        <div className="px-5 pt-3 pb-2 bg-zinc-50/70 border-b border-black/[0.06] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStudioTab('mic')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              studioTab === 'mic'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-black/[0.08] hover:text-zinc-950'
            }`}
            data-testid="tab-mic-whole-video"
          >
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span>Thu Âm Micro Toàn Video</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioTab('ai')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              studioTab === 'ai'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-black/[0.08] hover:text-zinc-950'
            }`}
            data-testid="tab-ai-whole-video"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lồng Tiếng Giọng AI Toàn Video</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {studioTab === 'mic' ? (
            <>
              {/* Teleprompter Toàn Video */}
              <div className="rounded-xl border border-black/[0.08] bg-zinc-950 text-zinc-100 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>KỊCH BẢN TELEPROMPTER TOÀN VIDEO ({project?.storyboard?.length || 1} PHÂN CẢNH)</span>
                  <span className="text-emerald-400">
                    Tổng thời lượng: {project ? formatTimer(project.duration) : '00:36'}
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {project?.storyboard?.length ? (
                    project.storyboard.map((sc) => (
                      <div key={sc.id} className="p-2 rounded-lg bg-white/5 border border-white/10 text-[11px] leading-relaxed">
                        <span className="font-mono text-sky-400 font-bold mr-1.5">
                          [{sc.timeRange}] {sc.headline || `Cảnh ${sc.sceneNumber}`}:
                        </span>
                        <span className="text-zinc-100">{sc.voiceover}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-200">{fullScriptText}</p>
                  )}
                </div>
              </div>

              {/* Controls Thu Âm Micro & Upload Audio Master */}
              <div className="p-4 rounded-xl border border-black/[0.08] bg-zinc-50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!isRecordingMic ? (
                      <button
                        type="button"
                        onClick={handleStartMicRecording}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        data-testid="btn-start-mic-record"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Bắt Đầu Thu Toàn Video</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopMicRecording}
                        className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs animate-pulse"
                      >
                        <Square className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        <span>Dừng Thu ({formatTimer(recordingSec)})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => audioUploadRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-800 border border-black/[0.1] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Tải File Thu Âm (.MP3/.WAV)</span>
                    </button>
                    <input
                      ref={audioUploadRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) await handleUploadMasterAudio(f);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {/* Live 24-bar Mic Waveform */}
                  <div className="flex items-center gap-2 bg-zinc-900 text-white px-3 py-1.5 rounded-lg">
                    <AudioWaveform className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <div className="flex items-end gap-0.5 h-4 w-28">
                      {micBars.map((val, i) => (
                        <div
                          key={i}
                          style={{ height: `${isRecordingMic ? val : 14}%` }}
                          className={`flex-1 rounded-t transition-all duration-75 ${
                            isRecordingMic ? 'bg-rose-400' : 'bg-zinc-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-300">
                      {isRecordingMic ? formatTimer(recordingSec) : 'Micro Ready'}
                    </span>
                  </div>
                </div>

                {micError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                    {micError}
                  </div>
                )}

                {micDataUrl ? (
                  <div className="p-3 rounded-xl bg-white border border-emerald-300/80 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                        <FileAudio className="w-4 h-4 text-emerald-600" />
                        <span>{micLabel || 'Bản thu âm Master toàn video'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMicDataUrl('');
                          setMicLabel('');
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Xóa bản thu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <audio
                      controls
                      src={micDataUrl}
                      className="w-full h-9"
                      data-testid="voice-studio-audio-preview"
                    />
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-zinc-300 text-center text-[11px] text-zinc-500">
                    Chưa có bản thu âm Master. Nhấn <strong>Bắt Đầu Thu Toàn Video</strong> hoặc tải lên tệp ghi âm sẵn để áp dụng xuyên suốt cả video.
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Language Switcher & Region Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-100/80 border border-black/[0.05]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Ngôn ngữ:</span>
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
                      className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                        selectedLanguage === 'vi' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      🇻🇳 Tiếng Việt (8 Giọng)
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
                      className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                        selectedLanguage === 'en' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      🇺🇸 English (5 Voices)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  {(selectedLanguage === 'vi'
                    ? ['All', 'Apple Keynote', 'Bắc', 'Nam', 'Trung', 'AI Neural']
                    : ['All', 'America', 'Kingdom', 'AI Neural']
                  ).map((reg) => (
                    <button
                      key={reg}
                      type="button"
                      onClick={() => setFilterRegion(reg)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition cursor-pointer ${
                        filterRegion === reg
                          ? 'bg-zinc-900 text-white shadow-sm'
                          : 'bg-white text-zinc-600 hover:text-zinc-900 border border-black/[0.06]'
                      }`}
                    >
                      {reg === 'All' ? 'Tất cả' : reg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[210px] overflow-y-auto pr-1">
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
                          : 'bg-zinc-50/70 border-black/[0.07] hover:bg-zinc-100/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-950 text-xs">{voice.name}</div>
                          <div className="text-[10px] text-indigo-600 font-semibold mt-0.5 font-mono">
                            {voice.toneTag}
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">{voice.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-semibold ${
                              isMale ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-pink-50 text-pink-800 border-pink-200'
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
                      <div className="pt-1.5 border-t border-black/[0.06] flex items-center justify-between gap-2">
                        <span className="text-[9px] font-mono text-zinc-500 truncate">
                          {voice.rate}x • Pitch {voice.pitch}x
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerVoicePreview(voice, true, voice.rate, voice.pitch);
                          }}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 ${
                            isThisCardPlaying ? 'bg-rose-600 text-white animate-pulse' : 'bg-zinc-900 hover:bg-indigo-600 text-white'
                          }`}
                        >
                          {isThisCardPlaying ? <Square className="w-2.5 h-2.5 fill-white" /> : <Play className="w-2.5 h-2.5 fill-white" />}
                          <span>{isThisCardPlaying ? 'Dừng' : 'Nghe thử'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Speed & Pitch Sliders */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-black/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-700 font-semibold mb-1">
                    <span className="flex items-center gap-1"><Sliders className="w-3 h-3" /> Tốc độ đọc (Speed)</span>
                    <span className="font-mono text-zinc-950">{speed.toFixed(2)}x</span>
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
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-700 font-semibold mb-1">
                    <span>Cao độ thanh quản (Pitch)</span>
                    <span className="font-mono text-zinc-950">{pitch.toFixed(2)}x</span>
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
                </div>
              </div>

              {/* Full Video Script Text + Audition */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-700">
                  <span>Lời thoại toàn bộ video (áp dụng thành 1 track âm thanh liên tục):</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-end gap-0.5 h-3.5 w-16">
                      {spectrumBars.map((val, idx) => (
                        <div
                          key={idx}
                          style={{ height: `${isAuditioning ? val : 15}%` }}
                          className={`flex-1 rounded-t ${isAuditioning ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerVoicePreview(selectedVoice, false, speed, pitch)}
                      className="px-2.5 py-1 rounded bg-zinc-900 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{isAuditioning ? 'Dừng thử' : 'Nghe thử đoạn đầu'}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={fullScriptText}
                  onChange={(e) => setFullScriptText(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg p-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 leading-relaxed"
                />
                {aiStatusNote && (
                  <div className="text-[11px] font-mono text-indigo-700">{aiStatusNote} ({activeEngineLabel})</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-black/[0.08] bg-zinc-50 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-zinc-600 font-mono">
            {studioTab === 'mic'
              ? micLabel || 'Chế độ Micro toàn video'
              : `${selectedVoice.name} • ${selectedVoice.region} • ${speed.toFixed(2)}x`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 transition cursor-pointer"
            >
              Hủy
            </button>
            {studioTab === 'mic' ? (
              <button
                type="button"
                disabled={!micDataUrl}
                onClick={handleApplyMicTrack}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                  micDataUrl
                    ? 'bg-zinc-950 hover:bg-zinc-800 text-white'
                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                }`}
                data-testid="btn-apply-voice-master"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Áp Dụng Bản Thu Vào Video</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isSynthesizingMasterAi}
                onClick={handleApplyAiMasterTrack}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-60"
                data-testid="btn-apply-ai-voice-master"
              >
                {isSynthesizingMasterAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Áp Dụng Giọng AI Vào Video</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
