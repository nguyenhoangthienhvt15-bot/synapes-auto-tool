import React, { useState, useRef, useEffect } from 'react';
import {
  AudioLines, Mic, Square, Upload, Play, Download, Sparkles,
  FileText, BookOpen, Server, CheckCircle2, AlertCircle,
  Sliders, Plus, Trash2, Copy, ArrowLeft, Volume2, RefreshCw, ShieldCheck, Activity
} from 'lucide-react';
import {
  AIProviderConfig, Project, UserAccount, VoiceLanguage, VoiceProfile
} from '../types';
import {
  ALL_VOICE_PROFILES,
  ENGLISH_VOICE_PROFILES,
  VIETNAMESE_VOICE_PROFILES,
  auditionVoice,
  stopVoiceAudition,
  bindExclusiveAudioElement,
  analyzeReferenceAudioBuffer,
  synthesizeNeuralVoiceToWav,
  synthesizeMultiSpeakerAudiobookToWav,
  detectAudioSpeechSegmentsVAD,
  computeBlobBiometricSimilarity,
  ReferenceVoiceAnalysis,
} from '../services/voiceStudioService';

interface VoiceStudioLabsViewProps {
  currentUser?: UserAccount | null;
  projects: Project[];
  aiConfig: AIProviderConfig;
  onUpdateAiConfig?: (config: AIProviderConfig) => void;
  onUpdateProject?: (updated: Project) => void;
  onBack?: () => void;
}

type VoiceLabsTab = 'cloning' | 'design' | 'whisper' | 'audiobook';

interface CustomVoicePreset {
  id: string;
  name: string;
  engine: string;
  pitch: number;
  rate: number;
  warmthDb: number;
  gender: 'Nam' | 'Nữ' | 'Trung tính';
  description: string;
  createdAt: string;
  baseVoiceId?: string;
  referenceBiometrics?: VoiceProfile['referenceBiometrics'];
}

interface WhisperSegment {
  id: number;
  startSec: number;
  endSec: number;
  text: string;
}

interface AudiobookLine {
  id: string;
  speaker: string;
  voiceId: string;
  text: string;
  pauseMs: number;
}

function formatSrtTimestamp(sec: number): string {
  const safe = Math.max(0, sec);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = Math.floor(safe % 60);
  const ms = Math.round((safe - Math.floor(safe)) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function buildVoiceProfileFromCustom(preset: CustomVoicePreset): VoiceProfile {
  const isFemale = preset.gender === 'Nữ';
  const matchedBase =
    ALL_VOICE_PROFILES.find((v) => v.id === preset.baseVoiceId) ||
    (isFemale ? VIETNAMESE_VOICE_PROFILES.find((v) => v.gender === 'Nữ') : VIETNAMESE_VOICE_PROFILES[0]) ||
    ALL_VOICE_PROFILES[0];

  return {
    ...matchedBase,
    id: preset.id,
    name: preset.name,
    language: matchedBase?.language || 'vi',
    gender: isFemale ? 'Nữ' : 'Nam',
    region: matchedBase?.region || 'Miền Bắc',
    toneTag: `ULTRA • ${preset.engine}`,
    description: preset.description,
    sampleSentence: 'Xin chào, đây là giọng nói Neural được tổng hợp từ SYNAPES VoiceStudio ULTRA.',
    pitch: preset.pitch,
    rate: preset.rate,
    neuralVoiceId: isFemale ? 'vi-VN-HoaiMyNeural' : 'vi-VN-NamMinhNeural',
    geminiVoiceName: isFemale ? 'Aoede' : 'Charon',
    openaiVoiceName: isFemale ? 'nova' : 'onyx',
    dspDetuneCents: Math.round((preset.pitch - 1) * 900),
    acousticSignature: `${preset.engine} • Warmth ${preset.warmthDb >= 0 ? '+' : ''}${preset.warmthDb}dB`,
    formantEq: {
      lowShelfHz: 220,
      lowGainDb: preset.warmthDb,
      midPeakingHz: 2100,
      midGainDb: 3.5,
      highShelfHz: 5200,
      highGainDb: 2.5,
    },
    referenceBiometrics: preset.referenceBiometrics,
  };
}

const WaveformBars: React.FC<{ peaks: number[]; label?: string; durationSec?: number }> = ({
  peaks,
  label,
  durationSec,
}) => {
  if (!peaks || peaks.length === 0) return null;
  return (
    <div className="p-2.5 rounded-lg bg-zinc-950 text-white space-y-1.5 border border-zinc-800">
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <Activity className="w-3 h-3" />
          <span>{label || 'Phổ Sóng Âm Thực Tế (24kHz PCM)'}</span>
        </span>
        {typeof durationSec === 'number' && durationSec > 0 && (
          <span>{durationSec.toFixed(2)}s • 16-bit WAV</span>
        )}
      </div>
      <div className="h-9 flex items-end gap-[2px] pt-1">
        {peaks.map((val, idx) => (
          <div
            key={idx}
            className="flex-1 bg-emerald-400/85 rounded-t-[1px] transition-all"
            style={{ height: `${Math.max(12, Math.min(100, val))}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export const VoiceStudioLabsView: React.FC<VoiceStudioLabsViewProps> = ({
  currentUser,
  projects: _projects,
  aiConfig,
  onUpdateAiConfig,
  onUpdateProject: _onUpdateProject,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<VoiceLabsTab>('cloning');
  const cloneAudioRef = useRef<HTMLAudioElement | null>(null);
  const designAudioRef = useRef<HTMLAudioElement | null>(null);
  const audiobookAudioRef = useRef<HTMLAudioElement | null>(null);
  const [localEndpoint, setLocalEndpoint] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('synapes_voicestudio_endpoint') || '';
      if (/localhost|127\.0\.0\.1/i.test(saved)) return '';
      return saved;
    } catch {
      return '';
    }
  });
  const [pluginModels, setPluginModels] = useState<{ id: string; label: string }[]>([]);
  const [serverStatus, setServerStatus] = useState<'idle' | 'checking' | 'connected' | 'studio-neural'>('studio-neural');
  const [activeEngineBadge, setActiveEngineBadge] = useState<string>('Studio ULTRA Engine (24kHz VTLN)');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [customVoices, setCustomVoices] = useState<CustomVoicePreset[]>(() => {
    try {
      const saved = localStorage.getItem('synapes_voicestudio_custom_voices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Tab 1: Voice Cloning state
  const [cloneEngine, setCloneEngine] = useState<string>('qwen3-tts');
  const [cloneName, setCloneName] = useState<string>('Giọng Nhân Bản Studio #1');
  const [refAudioFile, setRefAudioFile] = useState<{
    name: string;
    url: string;
    sizeKb: number;
    blob?: Blob;
  } | null>(null);
  const [refAnalysis, setRefAnalysis] = useState<ReferenceVoiceAnalysis | null>(null);
  const [refTranscript, setRefTranscript] = useState<string>(
    'Hôm nay chúng ta sẽ cùng phân tích kiến trúc phần cứng và quy trình tối ưu hiệu năng âm thanh.'
  );
  const [cloneTargetText, setCloneTargetText] = useState<string>(
    'Chào mừng bạn đến với SYNAPES VoiceStudio ULTRA. Bản thu này sử dụng công nghệ nhân bản giọng nói Zero-Shot định dạng Formant VTLN theo mẫu âm thanh bạn vừa cung cấp.'
  );
  const [cloneConsent, setCloneConsent] = useState<boolean>(false);
  const [clonePitch, setClonePitch] = useState<number>(1.0);
  const [cloneRate, setCloneRate] = useState<number>(1.0);
  const [cloneWarmthDb, setCloneWarmthDb] = useState<number>(3.5);
  const [cloneGender, setCloneGender] = useState<'Nam' | 'Nữ' | 'Trung tính'>('Nam');
  const [cloneMode, setCloneMode] = useState<'spectral-neural-clone' | 'direct-voice-remaster'>('spectral-neural-clone');
  const [isRecordingClone, setIsRecordingClone] = useState<boolean>(false);
  const [cloneOutputUrl, setCloneOutputUrl] = useState<string>('');
  const [cloneOutputDuration, setCloneOutputDuration] = useState<number>(0);
  const [cloneOutputPeaks, setCloneOutputPeaks] = useState<number[]>([]);
  const [cloneOutputF0Hz, setCloneOutputF0Hz] = useState<number>(0);
  const [cloneSpectralMatchScore, setCloneSpectralMatchScore] = useState<number>(0);
  const [cloneOutputFormants, setCloneOutputFormants] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [cloneOutputBark16, setCloneOutputBark16] = useState<number[]>([]);
  const [cloneF0MatchScore, setCloneF0MatchScore] = useState<number>(0);
  const [cloneFormantMatchScore, setCloneFormantMatchScore] = useState<number>(0);
  const [cloneCepstralMatchScore, setCloneCepstralMatchScore] = useState<number>(0);
  const [isSynthesizingClone, setIsSynthesizingClone] = useState<boolean>(false);

  // Tab 2: Voice Design state
  const [designPrompt, setDesignPrompt] = useState<string>(
    'Giọng nam trung niên 34 tuổi, âm sắc trầm ấm uy lực, nhịp điệu điềm tĩnh chuẩn mực cho video review phần cứng và phim tài liệu.'
  );
  const [designName, setDesignName] = useState<string>('MC Tài Liệu Trầm Ấm');
  const [designGender, setDesignGender] = useState<'Nam' | 'Nữ' | 'Trung tính'>('Nam');
  const [designAge, setDesignAge] = useState<'18-25' | '26-45' | '46+'>('26-45');
  const [designEmotion, setDesignEmotion] = useState<string>('Điềm tĩnh • Chuyên sâu');
  const [designPitch, setDesignPitch] = useState<number>(0.94);
  const [designRate, setDesignRate] = useState<number>(1.0);
  const [designWarmth, setDesignWarmth] = useState<number>(4.0);
  const [designSampleText, setDesignSampleText] = useState<string>(
    'Mỗi chi tiết trên bo mạch đều được thiết kế chính xác để mang lại dải động trung thực và độ méo hài cực thấp.'
  );
  const [designBlueprintSummary, setDesignBlueprintSummary] = useState<string>('');
  const [designOutputUrl, setDesignOutputUrl] = useState<string>('');
  const [designOutputDuration, setDesignOutputDuration] = useState<number>(0);
  const [designOutputPeaks, setDesignOutputPeaks] = useState<number[]>([]);
  const [isDesigning, setIsDesigning] = useState<boolean>(false);

  // Tab 3: Whisper Dictation state
  const [whisperEngine, setWhisperEngine] = useState<'studio-vad-whisper' | 'groq-whisper' | 'openai-whisper' | 'browser-live'>('studio-vad-whisper');
  const [whisperFileName, setWhisperFileName] = useState<string>('');
  const [whisperDurationSec, setWhisperDurationSec] = useState<number>(0);
  const [whisperPeaks, setWhisperPeaks] = useState<number[]>([]);
  const [whisperSegments, setWhisperSegments] = useState<WhisperSegment[]>([]);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isLiveDictating, setIsLiveDictating] = useState<boolean>(false);

  // Tab 5: Audiobook Multi-Speaker Studio state
  const [audiobookLines, setAudiobookLines] = useState<AudiobookLine[]>([
    {
      id: 'ab-1',
      speaker: 'Người dẫn chuyện',
      voiceId: ALL_VOICE_PROFILES[0]?.id || 'vi-male-north-1',
      text: 'Chương một: Khi tín hiệu analog bước vào kỷ nguyên xử lý số độ phân giải cao.',
      pauseMs: 400,
    },
    {
      id: 'ab-2',
      speaker: 'Kỹ sư trưởng',
      voiceId: ALL_VOICE_PROFILES[1]?.id || ALL_VOICE_PROFILES[0]?.id || 'vi-male-north-2',
      text: 'Hãy lắng nghe sự khác biệt khi từng tầng khuếch đại được căn chỉnh đồng pha.',
      pauseMs: 500,
    },
  ]);
  const [audiobookMasterUrl, setAudiobookMasterUrl] = useState<string>('');
  const [audiobookMasterDuration, setAudiobookMasterDuration] = useState<number>(0);
  const [audiobookMasterPeaks, setAudiobookMasterPeaks] = useState<number[]>([]);
  const [isRenderingAudiobook, setIsRenderingAudiobook] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    try {
      localStorage.setItem('synapes_voicestudio_custom_voices', JSON.stringify(customVoices));
    } catch { }
  }, [customVoices]);

  useEffect(() => {
    try {
      localStorage.setItem('synapes_voicestudio_endpoint', localEndpoint);
    } catch { }
  }, [localEndpoint]);

  // Verify built-in Studio Neural Engine on mount
  useEffect(() => {
    fetch('/api/voicestudio/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.status === 'ok') {
          setServerStatus('studio-neural');
          setActiveEngineBadge('Studio ULTRA Engine (/api/tts • 24kHz VTLN)');
        }
      })
      .catch(() => {});
  }, []);

  const handleCheckLocalServer = async () => {
    const cleanUrl = localEndpoint.trim().replace(/\/$/, '');
    if (!cleanUrl) {
      setPluginModels([]);
      setServerStatus('studio-neural');
      setActiveEngineBadge('Studio ULTRA Engine (/api/tts • 24kHz VTLN)');
      setStatusMessage('Vui lòng nhập URL Voice Plugin HTTPS (ví dụ: https://voice-plugin.domain.com) để mở rộng mô hình.');
      return;
    }
    if (/localhost|127\.0\.0\.1/i.test(cleanUrl) || !/^https:\/\//i.test(cleanUrl)) {
      setStatusMessage('Chỉ hỗ trợ kết nối Voice Plugin qua giao thức HTTPS công khai trên Web (đã khóa localhost/HTTP nội bộ).');
      return;
    }

    setServerStatus('checking');
    setStatusMessage('');
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(`${cleanUrl}/health`, {
        method: 'GET',
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        let extraModels: { id: string; label: string }[] = [];
        try {
          const mRes = await fetch(`${cleanUrl}/v1/models`);
          if (mRes.ok) {
            const mData = await mRes.json();
            const arr = Array.isArray(mData?.models) ? mData.models : Array.isArray(mData?.data) ? mData.data : [];
            extraModels = arr
              .map((item: any) => ({
                id: `plugin::${String(item?.id || item?.name || '').trim()}`,
                label: `${item?.name || item?.id} (Voice Plugin HTTPS)`,
              }))
              .filter((x: any) => x.id !== 'plugin::');
          }
        } catch { }
        setPluginModels(extraModels);
        setServerStatus('connected');
        setActiveEngineBadge(`HTTPS Voice Plugin (${new URL(cleanUrl).hostname})`);
        setStatusMessage(`Đã kết nối Voice Plugin HTTPS tại ${cleanUrl}${extraModels.length ? ` • Tải ${extraModels.length} mô hình` : ''}.`);
        return;
      }
    } catch {
      // Fall through to built-in Studio ULTRA Engine
    }

    try {
      const studioRes = await fetch('/api/voicestudio/health');
      if (studioRes.ok) {
        setServerStatus('studio-neural');
        setActiveEngineBadge('Studio ULTRA Engine (/api/tts • 24kHz VTLN)');
        setStatusMessage(
          `Không kết nối được Voice Plugin (${cleanUrl}) — Đã kích hoạt Studio ULTRA Engine (24kHz Formant-Warp VTLN + BYOK Cloud APIs).`
        );
        return;
      }
    } catch { }

    setServerStatus('studio-neural');
    setStatusMessage('Đang sử dụng Studio ULTRA Engine (/api/tts 24kHz VTLN + BYOK Cloud APIs).');
  };

  const handleInspectReferenceBlob = async (fileOrBlob: Blob, name: string) => {
    const url = URL.createObjectURL(fileOrBlob);
    setRefAudioFile({
      name,
      url,
      sizeKb: Math.max(1, Math.round(fileOrBlob.size / 1024)),
      blob: fileOrBlob,
    });
    try {
      const analysis = await analyzeReferenceAudioBuffer(fileOrBlob);
      setRefAnalysis(analysis);
      setCloneGender(analysis.inferredGender);
      setClonePitch(analysis.recommendedPitch);
      setCloneRate(analysis.recommendedRate);
      setCloneWarmthDb(analysis.warmthDb);
      setStatusMessage(
        `Đã trích xuất DNA giọng v3.0 [${name}]: F0 thanh quản ${analysis.fundamentalHz}Hz (${analysis.inferredGender}) • Formants [${analysis.formantsHz.join(' · ')}]Hz • Ngữ điệu ±${analysis.pitchRangeSemitones}st • Phổ Cepstral 128 dải.`
      );
    } catch {
      setStatusMessage(`Đã nạp tệp mẫu [${name}].`);
    }
  };

  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      // Đồng thời nhận diện lời nói thực tế khi thu Micro để tự động điền Reference Transcript
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      let recInstance: any = null;
      if (SpeechRec) {
        try {
          recInstance = new SpeechRec();
          recInstance.lang = 'vi-VN';
          recInstance.continuous = true;
          recInstance.interimResults = true;
          let finalTranscript = '';
          recInstance.onresult = (ev: any) => {
            let chunk = '';
            for (let i = ev.resultIndex; i < ev.results.length; i++) {
              chunk += ev.results[i][0].transcript;
              if (ev.results[i].isFinal) {
                finalTranscript += ev.results[i][0].transcript + ' ';
              }
            }
            const combined = (finalTranscript || chunk).trim();
            if (combined.length > 2) {
              setRefTranscript(combined);
            }
          };
          recInstance.start();
        } catch { }
      }

      recorder.onstop = () => {
        if (recInstance) {
          try { recInstance.stop(); } catch { }
        }
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const fileName = `Thu_Am_Mau_${new Date().toLocaleTimeString('vi-VN').replace(/:/g, '-')}.webm`;
        stream.getTracks().forEach((t) => t.stop());
        handleInspectReferenceBlob(blob, fileName);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(200);
      setIsRecordingClone(true);
      setStatusMessage('Đang thu âm giọng mẫu từ Micro (tối đa 10 giây — bấm "Dừng Ghi Âm" khi đọc xong)...');

      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecordingClone(false);
        }
      }, 10500);
    } catch {
      setStatusMessage('Trình duyệt chưa cấp quyền Micro hoặc thiết bị không có Micro.');
    }
  };

  const stopMicRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingClone(false);
  };

  const handleSynthesizeClone = async () => {
    if (!cloneConsent) {
      setStatusMessage('Vui lòng xác nhận quyền sở hữu / sự đồng ý hợp pháp trước khi nhân bản giọng.');
      return;
    }
    if (!cloneTargetText.trim() && cloneMode !== 'direct-voice-remaster') return;
    setIsSynthesizingClone(true);
    setCloneOutputUrl('');
    setStatusMessage('');
    try {
      let generatedUrl = '';
      let finalMatchScore = 0;
      let finalOutputF0Hz = refAnalysis?.fundamentalHz || 130;

      // 1. If connected to external HTTPS Voice Plugin Server, upload actual reference audio via FormData
      if (serverStatus === 'connected' && /^https:\/\//i.test(localEndpoint) && cloneMode !== 'direct-voice-remaster') {
        try {
          const form = new FormData();
          form.append('engine', cloneEngine.replace(/^plugin::/, ''));
          form.append('text', cloneTargetText);
          form.append('reference_text', refTranscript);
          form.append('pitch', String(clonePitch));
          form.append('speed', String(cloneRate));
          if (refAudioFile?.blob) {
            form.append('file', refAudioFile.blob, refAudioFile.name);
          }
          const res = await fetch(`${localEndpoint.replace(/\/$/, '')}/v1/voice-clone`, {
            method: 'POST',
            body: form,
          });
          if (res.ok) {
            const blob = await res.blob();
            generatedUrl = URL.createObjectURL(blob);
            const sim = await computeBlobBiometricSimilarity(refAnalysis, blob);
            if (sim) {
              finalMatchScore = sim.spectralMatchScore;
              finalOutputF0Hz = sim.outputF0Hz;
              setCloneOutputDuration(sim.durationSec);
              setCloneOutputPeaks(sim.waveformPeaks);
              setCloneOutputF0Hz(sim.outputF0Hz);
              setCloneSpectralMatchScore(sim.spectralMatchScore);
              setCloneOutputFormants(sim.outputFormantsHz);
              setCloneOutputBark16(sim.outputBark16);
              setCloneF0MatchScore(sim.f0MatchScore);
              setCloneFormantMatchScore(sim.formantMatchScore);
              setCloneCepstralMatchScore(sim.cepstralMatchScore);
            }
          }
        } catch { }
      }

      // 2. If OpenAI BYOK Voice API is selected and configured
      if (!generatedUrl && cloneEngine === 'byok-openai-audio' && aiConfig.openai?.apiKey && cloneMode !== 'direct-voice-remaster') {
        try {
          const base = (aiConfig.openai.endpointUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
          const openAiVoice = (cloneGender || refAnalysis?.inferredGender) === 'Nữ' ? 'nova' : 'onyx';
          const res = await fetch(`${base}/audio/speech`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${aiConfig.openai.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'tts-1-hd',
              input: cloneTargetText,
              voice: openAiVoice,
              speed: Math.max(0.5, Math.min(2.0, cloneRate)),
              response_format: 'wav',
            }),
          });
          if (res.ok) {
            const blob = await res.blob();
            const sim = await computeBlobBiometricSimilarity(refAnalysis, blob);
            generatedUrl = URL.createObjectURL(blob);
            if (sim) {
              finalMatchScore = sim.spectralMatchScore;
              finalOutputF0Hz = sim.outputF0Hz;
              setCloneOutputDuration(sim.durationSec);
              setCloneOutputPeaks(sim.waveformPeaks);
              setCloneOutputF0Hz(sim.outputF0Hz);
              setCloneSpectralMatchScore(sim.spectralMatchScore);
              setCloneOutputFormants(sim.outputFormantsHz);
              setCloneOutputBark16(sim.outputBark16);
              setCloneF0MatchScore(sim.f0MatchScore);
              setCloneFormantMatchScore(sim.formantMatchScore);
              setCloneCepstralMatchScore(sim.cepstralMatchScore);
            }
          }
        } catch { }
      }

      // 3. If ElevenLabs BYOK is selected and configured
      if (!generatedUrl && cloneEngine === 'byok-eleven' && aiConfig.elevenlabs?.apiKey && cloneMode !== 'direct-voice-remaster') {
        try {
          const voiceId = aiConfig.elevenlabs.voiceId || '21m00Tcm4TlvDq8ikWAM';
          const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
              'xi-api-key': aiConfig.elevenlabs.apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: cloneTargetText,
              model_id: 'eleven_multilingual_v2',
            }),
          });
          if (res.ok) {
            const blob = await res.blob();
            const sim = await computeBlobBiometricSimilarity(refAnalysis, blob);
            generatedUrl = URL.createObjectURL(blob);
            if (sim) {
              finalMatchScore = sim.spectralMatchScore;
              finalOutputF0Hz = sim.outputF0Hz;
              setCloneOutputDuration(sim.durationSec);
              setCloneOutputPeaks(sim.waveformPeaks);
              setCloneOutputF0Hz(sim.outputF0Hz);
              setCloneSpectralMatchScore(sim.spectralMatchScore);
              setCloneOutputFormants(sim.outputFormantsHz);
              setCloneOutputBark16(sim.outputBark16);
              setCloneF0MatchScore(sim.f0MatchScore);
              setCloneFormantMatchScore(sim.formantMatchScore);
              setCloneCepstralMatchScore(sim.cepstralMatchScore);
            }
          }
        } catch { }
      }

      // 3. Studio Neural Engine v3.0 (Edge Neural v2 + STFT Cepstral 128-Band Vocal Tract Envelope & Formants F1-F4)
      const effectiveGender = cloneGender || refAnalysis?.inferredGender || 'Nam';
      const activeAnalysis: ReferenceVoiceAnalysis | null = refAnalysis
        ? {
            ...refAnalysis,
            inferredGender: effectiveGender,
          }
        : null;

      const previewProfile = buildVoiceProfileFromCustom({
        id: 'clone-preview',
        name: cloneName,
        engine: cloneEngine.toUpperCase(),
        pitch: clonePitch,
        rate: cloneRate,
        warmthDb: cloneWarmthDb,
        gender: effectiveGender,
        description: `Clone từ ${refAudioFile?.name || 'mẫu cấu hình'}`,
        createdAt: new Date().toISOString(),
      });

      if (!generatedUrl) {
        const useDirectBlob =
          cloneMode === 'direct-voice-remaster' && refAudioFile?.blob ? refAudioFile.blob : null;
        const renderedWav = await synthesizeNeuralVoiceToWav(cloneTargetText, previewProfile, {
          pitch: clonePitch,
          rate: cloneRate,
          warmthDb: cloneWarmthDb,
          midGainDb: 3.6,
          highGainDb: 2.6,
          referenceAnalysis: activeAnalysis,
          directReferenceBlob: useDirectBlob,
          cloneEngine,
        });
        generatedUrl = renderedWav.url;
        finalMatchScore = renderedWav.spectralMatchScore ?? 0;
        finalOutputF0Hz = renderedWav.outputF0Hz || refAnalysis?.fundamentalHz || 130;
        setCloneOutputDuration(renderedWav.durationSec);
        setCloneOutputPeaks(renderedWav.waveformPeaks);
        setCloneOutputF0Hz(finalOutputF0Hz);
        setCloneSpectralMatchScore(finalMatchScore);
        setCloneOutputFormants(renderedWav.outputFormantsHz || [0, 0, 0, 0]);
        setCloneOutputBark16(renderedWav.outputSpectralEnvelope16 || []);
        setCloneF0MatchScore(renderedWav.f0MatchScore ?? 0);
        setCloneFormantMatchScore(renderedWav.formantMatchScore ?? 0);
        setCloneCepstralMatchScore(renderedWav.cepstralMatchScore ?? 0);
      }

      // Đồng bộ phát duy nhất trên chính <audio ref={cloneAudioRef}> hiển thị ở UI để tránh chồng 2 luồng tiếng khi bấm Play/Pause
      stopVoiceAudition();
      setCloneOutputUrl(generatedUrl);
      setTimeout(() => {
        if (cloneAudioRef.current) {
          bindExclusiveAudioElement(cloneAudioRef.current);
          cloneAudioRef.current.currentTime = 0;
          cloneAudioRef.current.play().catch(() => {});
        }
      }, 60);
      setStatusMessage(
        cloneMode === 'direct-voice-remaster' && refAudioFile?.blob
          ? `Đã tái tạo & xử lý Master trực tiếp trên sóng âm giọng thu [${refAudioFile.name}] (${effectiveGender} • F0 ${finalOutputF0Hz}Hz)!`
          : `Voice Clone v4.0 Formant Warping hoàn tất (${effectiveGender} • ${cloneEngine} • F0 gốc ${refAnalysis?.fundamentalHz || 130}Hz -> Clone ${finalOutputF0Hz}Hz • Độ khớp ${finalMatchScore}%)!`
      );
    } catch (err) {
      setStatusMessage(`Lỗi tổng hợp giọng: ${String(err)}`);
    } finally {
      setIsSynthesizingClone(false);
    }
  };

  const handleSaveCustomVoice = (preset: Omit<CustomVoicePreset, 'id' | 'createdAt'>) => {
    const item: CustomVoicePreset = {
      ...preset,
      id: `labs-voice-${Date.now()}`,
      createdAt: new Date().toLocaleTimeString('vi-VN'),
    };
    setCustomVoices((prev) => [item, ...prev]);
    setStatusMessage(`Đã lưu giọng [${item.name}] vào thư viện VoiceStudio ULTRA (đã đồng bộ chọn nhanh khi tạo video).`);
  };

  const handlePreviewVoiceDesign = async () => {
    setIsDesigning(true);
    setStatusMessage('');
    try {
      let targetPitch = designPitch;
      let targetRate = designRate;
      let targetWarmth = designWarmth;
      let midGain = 3.4;
      let highGain = 2.5;
      let resolvedGender = designGender;
      let baseVoiceId = designGender === 'Nữ' ? 'vi-hn-female-1' : 'vi-hn-male-1';

      // Call backend /api/voicestudio/design-analyze to extract acoustic parameters from natural prompt
      try {
        const analyzeRes = await fetch('/api/voicestudio/design-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: designPrompt,
            gender: designGender,
            age: designAge,
            emotion: designEmotion,
          }),
        });
        if (analyzeRes.ok) {
          const parsed = await analyzeRes.json();
          if (parsed?.ok) {
            targetPitch = parsed.pitch ?? designPitch;
            targetRate = parsed.rate ?? designRate;
            targetWarmth = parsed.warmthDb ?? designWarmth;
            midGain = parsed.midGainDb ?? 3.4;
            highGain = parsed.highGainDb ?? 2.5;
            baseVoiceId = parsed.recommendedVoiceId || baseVoiceId;
            if (parsed.gender === 'Nam' || parsed.gender === 'Nữ') {
              resolvedGender = parsed.gender;
              setDesignGender(parsed.gender);
            }
            if (parsed.age && (parsed.age === '18-25' || parsed.age === '26-45' || parsed.age === '46+')) {
              setDesignAge(parsed.age);
            }
            setDesignPitch(targetPitch);
            setDesignRate(targetRate);
            setDesignWarmth(targetWarmth);
            setDesignBlueprintSummary(parsed.acousticSummary || '');
          }
        }
      } catch { }

      const profile = buildVoiceProfileFromCustom({
        id: 'design-preview',
        name: designName,
        engine: 'VoiceDesign',
        pitch: targetPitch,
        rate: targetRate,
        warmthDb: targetWarmth,
        gender: resolvedGender,
        description: designPrompt,
        createdAt: '',
        baseVoiceId,
      });

      const renderedWav = await synthesizeNeuralVoiceToWav(designSampleText, profile, {
        pitch: targetPitch,
        rate: targetRate,
        warmthDb: targetWarmth,
        midGainDb: midGain,
        highGainDb: highGain,
      });

      stopVoiceAudition();
      setDesignOutputUrl(renderedWav.url);
      setDesignOutputDuration(renderedWav.durationSec);
      setDesignOutputPeaks(renderedWav.waveformPeaks);
      setTimeout(() => {
        if (designAudioRef.current) {
          bindExclusiveAudioElement(designAudioRef.current);
          designAudioRef.current.currentTime = 0;
          designAudioRef.current.play().catch(() => {});
        }
      }, 60);
      setStatusMessage(
        `Đã thiết kế & tổng hợp giọng Neural "${designName}" (${renderedWav.durationSec}s • 24kHz WAV).`
      );
    } catch (err) {
      setStatusMessage(`Lỗi tổng hợp giọng thiết kế: ${String(err)}`);
    } finally {
      setIsDesigning(false);
    }
  };

  const handleWhisperTranscribeFile = async (file: File) => {
    setWhisperFileName(file.name);
    setIsTranscribing(true);
    setStatusMessage('');
    try {
      // 1. OpenAI Whisper-1 BYOK (newly added complete implementation!)
      if (whisperEngine === 'openai-whisper' && aiConfig.openai?.apiKey) {
        try {
          const form = new FormData();
          form.append('file', file);
          form.append('model', 'whisper-1');
          form.append('response_format', 'verbose_json');
          const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${aiConfig.openai.apiKey}` },
            body: form,
          });
          if (res.ok) {
            const data = await res.json();
            const segs: WhisperSegment[] = Array.isArray(data.segments)
              ? data.segments.map((s: any, idx: number) => ({
                  id: idx + 1,
                  startSec: Number(Number(s.start ?? idx * 4).toFixed(2)),
                  endSec: Number(Number(s.end ?? (idx + 1) * 4).toFixed(2)),
                  text: String(s.text || '').trim(),
                }))
              : [{ id: 1, startSec: 0, endSec: 5, text: String(data.text || '').trim() }];
            setWhisperSegments(segs);
            setStatusMessage(`Đã tách ${segs.length} phân đoạn phụ đề bằng OpenAI Whisper-1 BYOK.`);
            return;
          }
        } catch { }
      }

      // 2. Groq Whisper Large-v3-Turbo BYOK
      if (whisperEngine === 'groq-whisper' && aiConfig.groq?.apiKey) {
        try {
          const form = new FormData();
          form.append('file', file);
          form.append('model', 'whisper-large-v3-turbo');
          form.append('response_format', 'verbose_json');
          const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${aiConfig.groq.apiKey}` },
            body: form,
          });
          if (res.ok) {
            const data = await res.json();
            const segs: WhisperSegment[] = Array.isArray(data.segments)
              ? data.segments.map((s: any, idx: number) => ({
                  id: idx + 1,
                  startSec: Number(Number(s.start ?? idx * 4).toFixed(2)),
                  endSec: Number(Number(s.end ?? (idx + 1) * 4).toFixed(2)),
                  text: String(s.text || '').trim(),
                }))
              : [{ id: 1, startSec: 0, endSec: 5, text: String(data.text || '').trim() }];
            setWhisperSegments(segs);
            setStatusMessage(`Đã tách ${segs.length} phân đoạn phụ đề bằng Groq Whisper Turbo BYOK.`);
            return;
          }
        } catch { }
      }

      // 3. External Cloud HTTPS Voice Plugin Whisper (if connected)
      if (serverStatus === 'connected' && /^https:\/\//i.test(localEndpoint)) {
        try {
          const form = new FormData();
          form.append('file', file);
          const res = await fetch(`${localEndpoint.replace(/\/$/, '')}/v1/transcribe`, {
            method: 'POST',
            body: form,
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.segments)) {
              setWhisperSegments(data.segments);
              setStatusMessage(`Đã chép lời qua Faster-Whisper Local (${data.segments.length} câu).`);
              return;
            }
          }
        } catch { }
      }

      // 4. Real Web Audio VAD (Voice Activity Detection) — NEVER inject unrelated project scripts!
      const vadResult = await detectAudioSpeechSegmentsVAD(file, []);
      setWhisperDurationSec(vadResult.durationSec);
      setWhisperPeaks(vadResult.waveformPeaks);
      setWhisperSegments(vadResult.segments);
      if (vadResult.isNonSpeechTone) {
        setStatusMessage(
          `⚠️ Từ chối tách phụ đề giả cho [${file.name}]: ${vadResult.toneReason || 'Sóng âm không phải tiếng nói.'}`
        );
      } else {
        setStatusMessage(
          `Đã đo hoạt động giọng nói (VAD) thực tế [${file.name}] (${vadResult.durationSec}s • ${vadResult.segments.length} phân đoạn). Để chuyển âm thanh thành chữ chính xác (ASR), vui lòng chọn Groq/OpenAI Whisper (BYOK) hoặc kết nối Voice Plugin HTTPS.`
        );
      }
    } catch (err) {
      setStatusMessage(`Không thể giải mã tệp âm thanh: ${String(err)}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleToggleBrowserDictation = () => {
    if (isLiveDictating) {
      recognitionRef.current?.stop();
      setIsLiveDictating(false);
      return;
    }
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setStatusMessage('Trình duyệt hiện tại không hỗ trợ Web SpeechRecognition — hãy dùng Chrome/Edge hoặc tải file âm thanh lên.');
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'vi-VN';
    rec.continuous = true;
    rec.interimResults = false;
    let startOffset = whisperSegments.length > 0 ? whisperSegments[whisperSegments.length - 1].endSec : 0;
    rec.onresult = (event: any) => {
      const latest = event.results[event.results.length - 1];
      const transcript = latest?.[0]?.transcript?.trim();
      if (transcript) {
        const dur = Math.max(2.5, Math.min(8, transcript.split(/\s+/).length * 0.45));
        const seg: WhisperSegment = {
          id: Date.now(),
          startSec: startOffset,
          endSec: startOffset + dur,
          text: transcript,
        };
        startOffset += dur;
        setWhisperSegments((prev) => [...prev, seg]);
      }
    };
    rec.onerror = () => setIsLiveDictating(false);
    rec.onend = () => setIsLiveDictating(false);
    recognitionRef.current = rec;
    rec.start();
    setIsLiveDictating(true);
    setStatusMessage('Đang nghe Micro & chép lời trực tiếp...');
  };

  const handleDownloadSrt = () => {
    const srt = whisperSegments
      .map(
        (seg, i) =>
          `${i + 1}\n${formatSrtTimestamp(seg.startSec)} --> ${formatSrtTimestamp(seg.endSec)}\n${seg.text}\n`
      )
      .join('\n');
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'VoiceStudio_Subtitles.srt';
    a.click();
  };

  const handleRenderAudiobookMaster = async () => {
    if (audiobookLines.length === 0) return;
    setIsRenderingAudiobook(true);
    setStatusMessage('');
    try {
      const customProfiles = customVoices.map((c) => buildVoiceProfileFromCustom(c));
      const renderedMaster = await synthesizeMultiSpeakerAudiobookToWav(audiobookLines, customProfiles);
      setAudiobookMasterUrl(renderedMaster.url);
      setAudiobookMasterDuration(renderedMaster.durationSec);
      setAudiobookMasterPeaks(renderedMaster.waveformPeaks);
      setStatusMessage(
        `Đã tổng hợp Master Audiobook Đa Nhân Vật (${audiobookLines.length} phân đoạn • ${renderedMaster.durationSec}s • 24kHz PCM WAV)!`
      );
    } catch (err) {
      setStatusMessage(`Lỗi ghép Master Audiobook: ${String(err)}`);
    } finally {
      setIsRenderingAudiobook(false);
    }
  };

  const availableStudioVoices: { id: string; label: string }[] = [
    ...ALL_VOICE_PROFILES.map((v) => ({ id: v.id, label: `${v.name} (${v.language.toUpperCase()})` })),
    ...customVoices.map((c) => ({ id: c.id, label: `[ULTRA] ${c.name} (${c.engine})` })),
  ];

  const TABS: { id: VoiceLabsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'cloning', label: '1. Nhân Bản Giọng (Clone)', icon: Mic },
    { id: 'design', label: '2. Thiết Kế Giọng (Prompt)', icon: Sliders },
    { id: 'whisper', label: '3. Chép Lời Whisper', icon: FileText },
    { id: 'audiobook', label: '4. Phòng Thu Sách Nói', icon: BookOpen },
  ];

  return (
    <div className="space-y-4 w-full max-w-[1380px] mx-auto min-w-0 overflow-x-hidden">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-zinc-200/90 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition cursor-pointer flex-shrink-0"
              title="Quay lại Workspace"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-9 h-9 rounded-lg bg-zinc-950 text-white flex items-center justify-center flex-shrink-0">
            <AudioLines className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-base font-semibold text-[#141413] tracking-tight">
                SYNAPES VoiceStudio
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-700 text-white">
                ULTRA
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                Neural 24kHz • Formant VTLN v4.0 • Web Audio VAD
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
              Phòng thu giọng nói đa tầng: Nhân bản giọng Zero-Shot, Thiết kế giọng theo mô tả, Chép lời phụ đề SRT &amp; Sách nói đa nhân vật.
            </p>
          </div>
        </div>

        {/* Cloud Voice Plugin & Engine Status Bar (HTTPS Only — Zero Localhost) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5">
            <Server className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <input
              type="url"
              value={localEndpoint}
              onChange={(e) => setLocalEndpoint(e.target.value)}
              placeholder="https://voice-plugin.domain.com"
              className="text-[11px] font-mono text-zinc-800 bg-transparent focus:outline-none w-48 sm:w-56"
              aria-label="VoiceStudio HTTPS Plugin URL"
            />
            <button
              onClick={handleCheckLocalServer}
              className="px-2 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-medium hover:bg-black transition cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${serverStatus === 'checking' ? 'animate-spin' : ''}`} />
              <span>Kết Nối Plugin</span>
            </button>
          </div>

          <span className="px-2.5 py-1.5 rounded-lg text-[10.5px] font-mono border bg-emerald-50/90 border-emerald-200 text-emerald-900 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeEngineBadge}</span>
          </span>
        </div>
      </div>

      {/* Status Toast Inline */}
      {statusMessage && (
        <div className="px-3.5 py-2 rounded-lg bg-zinc-900 text-white text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage('')}
            className="text-[10px] text-zinc-400 hover:text-white cursor-pointer flex-shrink-0"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Segmented Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 border border-zinc-200/80 rounded-xl overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                active
                  ? 'bg-white text-zinc-950 font-semibold shadow-2xs border border-zinc-200/70'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ZERO-SHOT VOICE CLONING */}
      {activeTab === 'cloning' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200/90 p-4 space-y-4 min-w-0">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wide">
                Nhân Bản Giọng Nói Zero-Shot (5–15 giây mẫu)
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">
                Acoustic DNA F0 + Neural TTS 24kHz
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-700 block mb-1">Tên Giọng Nhân Bản</label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-zinc-900"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-700 block mb-1">Mô Hình Nhân Bản (Mở rộng theo API Key & Plugin)</label>
                <select
                  value={cloneEngine}
                  onChange={(e) => setCloneEngine(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none focus:border-zinc-900"
                >
                  <optgroup label="SYNAPES Formant & VTLN DSP + Edge Neural Core (Local Browser DSP)">
                    <option value="qwen3-tts">SYNAPES VTLN Neutral Clone (Formant-Warp v4.0)</option>
                    <option value="xttsv2">SYNAPES Multilingual VTLN (Formant-Warp v4.0)</option>
                    <option value="fish-speech">SYNAPES Acoustic High-Presence (Formant-Warp v4.0)</option>
                  </optgroup>
                  <optgroup label="Mô Hình Cloud BYOK Theo API Key Hệ Thống">
                    <option value="byok-gemini-audio">
                      Gemini 2.5 Native Audio Clone {aiConfig.gemini?.apiKey ? '(Đã có Key ✓)' : '(BYOK / Studio)'}
                    </option>
                    <option value="byok-openai-audio">
                      OpenAI GPT-4o Audio / TTS-1-HD {aiConfig.openai?.apiKey ? '(Đã có Key ✓)' : '(Cần OpenAI Key)'}
                    </option>
                    <option value="byok-eleven">
                      ElevenLabs Multilingual v2 {aiConfig.elevenlabs?.apiKey ? '(Đã có Key ✓)' : '(Cần ElevenLabs Key)'}
                    </option>
                  </optgroup>
                  {pluginModels.length > 0 && (
                    <optgroup label="Mô Hình Từ Voice Plugin HTTPS Đã Kết Nối">
                      {pluginModels.map((pm) => (
                        <option key={pm.id} value={pm.id}>{pm.label}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            {/* Upload / Record reference audio */}
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-zinc-800">
                  Bước A: Cung cấp tệp giọng mẫu gốc (WAV / MP3 / M4A)
                </span>
                <div className="flex items-center gap-2">
                  <label className="px-2.5 py-1 rounded-md bg-white border border-zinc-300 text-[11px] font-medium text-zinc-800 hover:bg-zinc-100 cursor-pointer inline-flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Tải Audio Mẫu</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          handleInspectReferenceBlob(f, f.name);
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={isRecordingClone ? stopMicRecording : startMicRecording}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer transition ${
                      isRecordingClone
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-900 text-white hover:bg-black'
                    }`}
                  >
                    {isRecordingClone ? <Square className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    <span>{isRecordingClone ? 'Dừng Ghi Âm' : 'Thu Micro 10s'}</span>
                  </button>
                </div>
              </div>

              {refAudioFile && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 p-2 rounded bg-white border border-zinc-200">
                    <span className="text-[11px] font-mono text-zinc-700 truncate">
                      {refAudioFile.name} ({refAudioFile.sizeKb} KB)
                    </span>
                    <audio controls src={refAudioFile.url} onPlay={(e) => bindExclusiveAudioElement(e.currentTarget)} className="h-7 max-w-[240px]" />
                  </div>
                  {refAnalysis && (
                    <div className="space-y-2 bg-white p-2.5 rounded border border-zinc-200/80">
                      <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono">
                        <div>
                          <span className="text-zinc-400 block">Tần số F0 (YIN):</span>
                          <strong className="text-zinc-900">{refAnalysis.fundamentalHz} Hz ({cloneGender})</strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 block">Pitch khớp:</span>
                          <strong className="text-emerald-700">{refAnalysis.recommendedPitch}x</strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 block">Độ ấm EQ:</span>
                          <strong className="text-zinc-900">{refAnalysis.warmthDb >= 0 ? `+${refAnalysis.warmthDb}` : refAnalysis.warmthDb} dB</strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 block">Năng lượng:</span>
                          <strong className="text-zinc-900">{refAnalysis.rmsDb} dBFS</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1.5 border-t border-zinc-100 text-[9.5px] font-mono">
                        <div>
                          <span className="text-zinc-400 block">Formants (F1..F4):</span>
                          <strong className="text-zinc-900">[{refAnalysis.formantsHz.join(' · ')}] Hz</strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 block">Dây thanh (H1-H2):</span>
                          <strong className="text-zinc-900">{refAnalysis.h1H2Db >= 0 ? `+${refAnalysis.h1H2Db}` : refAnalysis.h1H2Db} dB</strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 block">Ngữ điệu (Pitch Dynamics):</span>
                          <strong className="text-zinc-900">±{refAnalysis.pitchRangeSemitones} Semitones (σ={refAnalysis.pitchStdHz}Hz)</strong>
                        </div>
                      </div>

                      {refAnalysis.spectralEnvelopeDb && refAnalysis.spectralEnvelopeDb.length > 0 && (
                        <div className="pt-1 border-t border-zinc-100">
                          <div className="flex items-center justify-between text-[9.5px] font-mono text-zinc-500 mb-1">
                            <span>Phổ Thanh Quản Cepstral 128 Dải & 16 Dải Bark (80Hz – 10.8kHz):</span>
                            <div className="inline-flex items-center gap-1">
                              <span>Giới tính giọng nền:</span>
                              {(['Nam', 'Nữ', 'Trung tính'] as const).map((g) => (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() => setCloneGender(g)}
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-semibold cursor-pointer ${
                                    cloneGender === g
                                      ? 'bg-zinc-900 text-white'
                                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                  }`}
                                >
                                  {g}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-16 gap-1 h-9 items-end bg-zinc-950 px-2 py-1.5 rounded">
                            {refAnalysis.spectralEnvelopeDb.map((db, idx) => {
                              const pct = Math.max(12, Math.min(100, Math.round(((db + 16) / 32) * 100)));
                              return (
                                <div key={idx} className="flex flex-col items-center h-full justify-end">
                                  <div
                                    className="w-full rounded-xs bg-emerald-400"
                                    style={{ height: `${pct}%` }}
                                    title={`Band #${idx + 1}: ${db > 0 ? '+' : ''}${db} dB`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10.5px] font-medium text-zinc-600">
                    Lời thoại chính xác trong tệp mẫu (Reference Transcript):
                  </label>
                  <button
                    type="button"
                    onClick={() => setCloneTargetText(refTranscript)}
                    className="text-[10px] font-medium text-emerald-700 hover:underline cursor-pointer"
                  >
                    Dùng lời vừa thu làm văn bản đích →
                  </button>
                </div>
                <input
                  type="text"
                  value={refTranscript}
                  onChange={(e) => setRefTranscript(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white text-xs focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-1.5">
              <label className="text-[10.5px] font-semibold text-zinc-800 block">
                Chế Độ Tái Tạo Giọng Nhân Bản:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setCloneMode('spectral-neural-clone')}
                  className={`px-2.5 py-1.5 rounded-md text-left text-[10.5px] border transition cursor-pointer ${
                    cloneMode === 'spectral-neural-clone'
                      ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  1. Nhân Bản STFT Cepstral 128 Dải & Formants F1-F4 (Đọc Văn Bản Mới)
                </button>
                <button
                  type="button"
                  onClick={() => setCloneMode('direct-voice-remaster')}
                  className={`px-2.5 py-1.5 rounded-md text-left text-[10.5px] border transition cursor-pointer ${
                    cloneMode === 'direct-voice-remaster'
                      ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  2. Tái Tạo & Biến Đổi Trực Tiếp Sóng Âm Giọng Thu Của Bạn
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-700 block mb-1">
                Văn bản muốn tổng hợp bằng giọng nhân bản:
              </label>
              <textarea
                rows={3}
                value={cloneTargetText}
                onChange={(e) => setCloneTargetText(e.target.value)}
                disabled={cloneMode === 'direct-voice-remaster'}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex justify-between text-[11px] text-zinc-600 mb-1">
                  <span>Cao độ (Pitch)</span>
                  <span className="font-mono font-semibold">{clonePitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.75}
                  max={1.35}
                  step={0.02}
                  value={clonePitch}
                  onChange={(e) => setClonePitch(Number(e.target.value))}
                  className="w-full accent-zinc-900"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-zinc-600 mb-1">
                  <span>Tốc độ đọc (Speed)</span>
                  <span className="font-mono font-semibold">{cloneRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={1.35}
                  step={0.05}
                  value={cloneRate}
                  onChange={(e) => setCloneRate(Number(e.target.value))}
                  className="w-full accent-zinc-900"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950 cursor-pointer">
              <input
                type="checkbox"
                checked={cloneConsent}
                onChange={(e) => setCloneConsent(e.target.checked)}
                className="mt-0.5 accent-zinc-900"
              />
              <span>
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-amber-700" />
                Tôi cam kết tệp giọng mẫu hoàn toàn hợp pháp, thuộc quyền sở hữu của tôi hoặc có văn bản đồng ý sử dụng từ chủ thể.
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleSynthesizeClone}
                disabled={isSynthesizingClone || !cloneConsent}
                className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSynthesizingClone ? 'Đang Tổng Hợp...' : 'Khởi Tạo Bản Thu Nhân Bản'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const effectiveGender = cloneGender || refAnalysis?.inferredGender || 'Nam';
                  handleSaveCustomVoice({
                    name: cloneName,
                    engine: cloneEngine.toUpperCase(),
                    pitch: clonePitch,
                    rate: cloneRate,
                    warmthDb: cloneWarmthDb,
                    gender: effectiveGender,
                    description: `Voice Clone v3.0 (${refAudioFile?.name || 'Custom Sample'} • F0 ${refAnalysis?.fundamentalHz || 130}Hz • Formants [${(refAnalysis?.formantsHz || [0, 0, 0, 0]).join('·')}]Hz)`,
                    referenceBiometrics: refAnalysis
                      ? {
                          fundamentalHz: refAnalysis.fundamentalHz,
                          pitchStdHz: refAnalysis.pitchStdHz,
                          pitchRangeSemitones: refAnalysis.pitchRangeSemitones,
                          f0Contour5Pt: refAnalysis.f0Contour5Pt,
                          inferredGender: effectiveGender,
                          formantsHz: refAnalysis.formantsHz,
                          h1H2Db: refAnalysis.h1H2Db,
                          cepstralEnvelopeDb: refAnalysis.cepstralEnvelopeDb.map((v) => Number(v.toFixed(2))),
                          spectralEnvelopeDb: refAnalysis.spectralEnvelopeDb.map((v) => Number(v.toFixed(2))),
                          warmthDb: cloneWarmthDb,
                          recommendedRate: cloneRate || refAnalysis.recommendedRate,
                        }
                      : undefined,
                  });
                }}
                className="px-3 py-2 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium cursor-pointer"
              >
                Lưu Vào Thư Viện Giọng
              </button>
            </div>
          </div>

          {/* Right column: Output & Saved Library */}
          <div className="lg:col-span-5 space-y-4 min-w-0">
            <div className="bg-white rounded-xl border border-zinc-200/90 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wide">
                  Kết Quả Âm Thanh Đã Tổng Hợp (.WAV)
                </h3>
                {cloneOutputUrl && (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold">
                    F0: {cloneOutputF0Hz || refAnalysis?.fundamentalHz || 130}Hz •{' '}
                    {cloneSpectralMatchScore > 0 ? `Tương đồng đo thực: ${cloneSpectralMatchScore}%` : 'Chưa có mẫu đối chứng'}
                  </span>
                )}
              </div>
              {cloneOutputUrl ? (
                <div className="space-y-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  <WaveformBars
                    peaks={cloneOutputPeaks}
                    label="Phổ Giọng Nhân Bản Neural v3.0 (STFT 128-Band Cepstral & Formant Matched)"
                    durationSec={cloneOutputDuration}
                  />
                  {refAnalysis && (
                    <div className="p-2.5 rounded-md bg-white border border-zinc-200/90 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                        <div className="p-1.5 rounded bg-zinc-50 border border-zinc-100">
                          <span className="text-zinc-400 block">F0 Gốc → Clone ({cloneF0MatchScore}%):</span>
                          <strong className="text-zinc-900">
                            {refAnalysis.fundamentalHz}Hz → {cloneOutputF0Hz || refAnalysis.fundamentalHz}Hz
                          </strong>
                        </div>
                        <div className="p-1.5 rounded bg-zinc-50 border border-zinc-100">
                          <span className="text-zinc-400 block">Formants F1-F4 ({cloneFormantMatchScore}%):</span>
                          <strong className="text-zinc-900 break-all">
                            [{refAnalysis.formantsHz.join('·')}] → [{(cloneOutputFormants[0] ? cloneOutputFormants : refAnalysis.formantsHz).join('·')}]Hz
                          </strong>
                        </div>
                        <div className="p-1.5 rounded bg-zinc-50 border border-zinc-100">
                          <span className="text-zinc-400 block">Cepstral 128-Band:</span>
                          <strong className="text-emerald-700">
                            {cloneCepstralMatchScore}% match
                          </strong>
                        </div>
                      </div>
                      {cloneOutputBark16.length === 16 && refAnalysis.spectralEnvelopeDb.length === 16 && (
                        <div className="pt-1 border-t border-zinc-100">
                          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 mb-1">
                            <span>Đối chiếu Phổ 16 Dải Bark:</span>
                            <span className="inline-flex items-center gap-2">
                              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-emerald-400 inline-block" /> Gốc</span>
                              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-cyan-400 inline-block" /> Clone</span>
                            </span>
                          </div>
                          <div className="grid grid-cols-16 gap-1 h-10 items-end bg-zinc-950 px-2 py-1.5 rounded">
                            {refAnalysis.spectralEnvelopeDb.map((refDb, idx) => {
                              const outDb = cloneOutputBark16[idx] ?? refDb;
                              const refPct = Math.max(10, Math.min(100, Math.round(((refDb + 16) / 32) * 100)));
                              const outPct = Math.max(10, Math.min(100, Math.round(((outDb + 16) / 32) * 100)));
                              return (
                                <div key={idx} className="flex items-end gap-[1px] h-full justify-center" title={`Band #${idx + 1}: Gốc ${refDb}dB vs Clone ${outDb}dB`}>
                                  <div className="w-1/2 rounded-xs bg-emerald-400" style={{ height: `${refPct}%` }} />
                                  <div className="w-1/2 rounded-xs bg-cyan-400" style={{ height: `${outPct}%` }} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <audio ref={cloneAudioRef} controls src={cloneOutputUrl} onPlay={(e) => bindExclusiveAudioElement(e.currentTarget)} className="w-full" />
                  <a
                    href={cloneOutputUrl}
                    download={`${cloneName.replace(/\s+/g, '_')}.wav`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 text-white text-[11px] font-medium hover:bg-black"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải Xuống File Master (.WAV)</span>
                  </a>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 py-6 text-center border border-dashed border-zinc-200 rounded-lg">
                  Chưa có bản thu nào — bấm "Khởi Tạo Bản Thu Nhân Bản" để nghe thử và xuất WAV.
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-zinc-200/90 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wide">
                  Thư Viện Giọng Cá Nhân ({customVoices.length})
                </h3>
                <span className="text-[10px] font-mono text-zinc-500">User: {currentUser?.code || 'Studio'}</span>
              </div>
              {customVoices.length === 0 ? (
                <p className="text-[11px] text-zinc-500">Chưa có giọng cá nhân nào được lưu.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customVoices.map((cv) => (
                    <div
                      key={cv.id}
                      className="p-2.5 rounded-lg border border-zinc-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-900 truncate">{cv.name}</div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          {cv.engine} • {cv.gender} • Pitch {cv.pitch.toFixed(2)}x
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => auditionVoice(buildVoiceProfileFromCustom(cv), cloneTargetText)}
                          className="p-1.5 rounded border border-zinc-200 hover:bg-zinc-100 cursor-pointer"
                          title="Nghe thử giọng"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-zinc-700" />
                        </button>
                        <button
                          onClick={() => setCustomVoices((prev) => prev.filter((item) => item.id !== cv.id))}
                          className="p-1.5 rounded border border-zinc-200 hover:bg-red-50 text-zinc-500 hover:text-red-600 cursor-pointer"
                          title="Xóa giọng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VOICE DESIGN FROM NATURAL PROMPT */}
      {activeTab === 'design' && (
        <div className="bg-white rounded-xl border border-zinc-200/90 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wide">
                Thiết Kế Giọng Nói Bằng Prompt Mô Tả (VoiceDesign Neural 24kHz)
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Phân tích ngữ nghĩa Prompt để tự động hiệu chỉnh dải tần Formant, cao độ thanh quản và tổng hợp giọng nói Neural thật.
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-zinc-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-700 block mb-1">Tên Nhân Vật / Giọng Mới</label>
              <input
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-700 block mb-1">Giới Tính & Nhóm Tuổi</label>
              <div className="flex gap-2">
                <select
                  value={designGender}
                  onChange={(e) => setDesignGender(e.target.value as any)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Trung tính">Trung tính</option>
                </select>
                <select
                  value={designAge}
                  onChange={(e) => setDesignAge(e.target.value as any)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white"
                >
                  <option value="18-25">18–25 tuổi</option>
                  <option value="26-45">26–45 tuổi</option>
                  <option value="46+">46+ tuổi</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-700 block mb-1">Sắc Thái Diễn Cảm</label>
              <input
                type="text"
                value={designEmotion}
                onChange={(e) => setDesignEmotion(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-700 block mb-1">
              Prompt Mô Tả Âm Sắc Chi Tiết:
            </label>
            <textarea
              rows={2}
              value={designPrompt}
              onChange={(e) => setDesignPrompt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
            <div>
              <div className="flex justify-between text-[11px] text-zinc-600 mb-1">
                <span>Cao độ thanh quản (Pitch)</span>
                <span className="font-mono font-semibold">{designPitch.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.72}
                max={1.38}
                step={0.02}
                value={designPitch}
                onChange={(e) => setDesignPitch(Number(e.target.value))}
                className="w-full accent-zinc-900"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-zinc-600 mb-1">
                <span>Nhịp nhả chữ (Tempo)</span>
                <span className="font-mono font-semibold">{designRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.3}
                step={0.05}
                value={designRate}
                onChange={(e) => setDesignRate(Number(e.target.value))}
                className="w-full accent-zinc-900"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-zinc-600 mb-1">
                <span>Độ ấm trầm phòng thu (Warmth EQ)</span>
                <span className="font-mono font-semibold">{designWarmth > 0 ? '+' : ''}{designWarmth} dB</span>
              </div>
              <input
                type="range"
                min={-6}
                max={8}
                step={0.5}
                value={designWarmth}
                onChange={(e) => setDesignWarmth(Number(e.target.value))}
                className="w-full accent-zinc-900"
              />
            </div>
          </div>

          {designBlueprintSummary && (
            <div className="px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-[11px] font-mono text-zinc-700">
              Cấu hình âm học từ Prompt: <strong className="text-zinc-950">{designBlueprintSummary}</strong>
            </div>
          )}

          <div>
            <label className="text-[11px] font-medium text-zinc-700 block mb-1">Câu Thoại Kiểm Thử:</label>
            <input
              type="text"
              value={designSampleText}
              onChange={(e) => setDesignSampleText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePreviewVoiceDesign}
              disabled={isDesigning}
              className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isDesigning ? 'Đang Tổng Hợp...' : 'Tạo & Nghe Thử Giọng Thiết Kế'}</span>
            </button>
            <button
              onClick={() =>
                handleSaveCustomVoice({
                  name: designName,
                  engine: 'VoiceDesign',
                  pitch: designPitch,
                  rate: designRate,
                  warmthDb: designWarmth,
                  gender: designGender,
                  description: `${designAge} • ${designEmotion} • ${designPrompt}`,
                })
              }
              className="px-3.5 py-2 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-900 text-xs font-medium cursor-pointer"
            >
              Lưu Giọng Thiết Kế Vào Studio
            </button>
            {designOutputUrl && (
              <a
                href={designOutputUrl}
                download={`${designName.replace(/\s+/g, '_')}.wav`}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải WAV</span>
              </a>
            )}
          </div>

          {designOutputUrl && (
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2">
              <WaveformBars
                peaks={designOutputPeaks}
                label={`Phổ Âm Giọng Thiết Kế: ${designName}`}
                durationSec={designOutputDuration}
              />
              <audio ref={designAudioRef} controls src={designOutputUrl} onPlay={(e) => bindExclusiveAudioElement(e.currentTarget)} className="w-full" />
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WHISPER DICTATION & SUBTITLES */}
      {activeTab === 'whisper' && (
        <div className="bg-white rounded-xl border border-zinc-200/90 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wide">
                Chép Lời Whisper & Xuất Phụ Đề (.SRT / .TXT)
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Hỗ trợ OpenAI Whisper-1 (BYOK), Groq Whisper Turbo, Cloud HTTPS Voice Plugin, Studio Web Audio VAD hoặc đọc Micro trực tiếp.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={whisperEngine}
                onChange={(e) => setWhisperEngine(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white"
              >
                <option value="studio-vad-whisper">Studio Web Audio Energy + Spectral-Flux VAD (24kHz)</option>
                <option value="groq-whisper">Groq Whisper Turbo (BYOK)</option>
                <option value="openai-whisper">OpenAI Whisper-1 (BYOK)</option>
                <option value="browser-live">Micro Trực Tiếp (Trình duyệt)</option>
              </select>

              <label className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-medium cursor-pointer inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>{isTranscribing ? 'Đang Tách Chữ...' : 'Tải Audio / Video'}</span>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleWhisperTranscribeFile(f);
                  }}
                />
              </label>

              <button
                onClick={handleToggleBrowserDictation}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                  isLiveDictating ? 'bg-red-600 text-white' : 'bg-zinc-950 text-white hover:bg-black'
                }`}
              >
                {isLiveDictating ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isLiveDictating ? 'Dừng Chép Lời' : 'Chép Lời Micro Trực Tiếp'}</span>
              </button>
            </div>
          </div>

          {whisperFileName && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-zinc-600 flex items-center justify-between">
                <span>
                  Tệp đang xử lý: <strong className="text-zinc-900">{whisperFileName}</strong>
                </span>
                {whisperDurationSec > 0 && (
                  <span>Thời lượng đo thực tế: <strong>{whisperDurationSec}s</strong></span>
                )}
              </div>
              <WaveformBars
                peaks={whisperPeaks}
                label={`Phân Tích Hoạt Động Giọng Nói (VAD): ${whisperFileName}`}
                durationSec={whisperDurationSec}
              />
            </div>
          )}

          {whisperSegments.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-zinc-200 rounded-xl text-xs text-zinc-500">
              Tải lên một file âm thanh/video hoặc nhấn "Chép Lời Micro Trực Tiếp" để bắt đầu tạo timeline phụ đề.
            </div>
          ) : (
            <div className="space-y-2">
              {whisperSegments.map((seg, idx) => (
                <div key={seg.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80">
                  <span className="px-2 py-1 rounded bg-white border border-zinc-200 text-[10px] font-mono text-zinc-600 flex-shrink-0">
                    #{idx + 1} • {seg.startSec.toFixed(1)}s–{seg.endSec.toFixed(1)}s
                  </span>
                  <input
                    type="text"
                    value={seg.text}
                    onChange={(e) =>
                      setWhisperSegments((prev) =>
                        prev.map((s) => (s.id === seg.id ? { ...s, text: e.target.value } : s))
                      )
                    }
                    className="flex-1 px-2.5 py-1 rounded border border-zinc-200 bg-white text-xs"
                  />
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleDownloadSrt}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Phụ Đề (.SRT)</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(whisperSegments.map((s) => s.text).join('\n'));
                    setStatusMessage('Đã sao chép toàn bộ văn bản chép lời.');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao Chép Văn Bản</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIOBOOK MULTI-SPEAKER STUDIO */}
      {activeTab === 'audiobook' && (
        <div className="bg-white rounded-xl border border-zinc-200/90 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wide">
                Phòng Thu Sách Nói & Kịch Hội Thoại Đa Nhân Vật
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Phân vai từng dòng thoại với chất giọng Neural riêng biệt, ngắt nhịp chuẩn (ms) và xuất Master Audiobook WAV.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setAudiobookLines((prev) => [
                    ...prev,
                    {
                      id: `ab-${Date.now()}`,
                      speaker: `Nhân vật #${prev.length + 1}`,
                      voiceId: ALL_VOICE_PROFILES[prev.length % ALL_VOICE_PROFILES.length]?.id || 'vi-male-north-1',
                      text: 'Tín hiệu đầu ra đã đạt độ cân bằng hoàn hảo trên toàn dải tần âm thanh.',
                      pauseMs: 400,
                    },
                  ])
                }
                className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Câu Thoại</span>
              </button>
              <button
                onClick={handleRenderAudiobookMaster}
                disabled={isRenderingAudiobook}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isRenderingAudiobook ? 'Đang Ghép...' : 'Xuất Master Audiobook'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {audiobookLines.map((line, idx) => (
              <div key={line.id} className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10.5px] font-mono font-bold text-zinc-500">#{idx + 1}</span>
                  <input
                    type="text"
                    value={line.speaker}
                    onChange={(e) =>
                      setAudiobookLines((prev) =>
                        prev.map((l) => (l.id === line.id ? { ...l, speaker: e.target.value } : l))
                      )
                    }
                    className="px-2.5 py-1 rounded border border-zinc-200 bg-white text-xs font-semibold w-36"
                  />
                  <select
                    value={line.voiceId}
                    onChange={(e) =>
                      setAudiobookLines((prev) =>
                        prev.map((l) => (l.id === line.id ? { ...l, voiceId: e.target.value } : l))
                      )
                    }
                    className="px-2.5 py-1 rounded border border-zinc-200 bg-white text-xs flex-1 min-w-[180px]"
                  >
                    {availableStudioVoices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 text-[10.5px] font-mono text-zinc-500">
                    <span>Nghỉ:</span>
                    <input
                      type="number"
                      min={80}
                      max={3000}
                      step={50}
                      value={line.pauseMs}
                      onChange={(e) =>
                        setAudiobookLines((prev) =>
                          prev.map((l) => (l.id === line.id ? { ...l, pauseMs: Number(e.target.value) } : l))
                        )
                      }
                      className="w-16 px-1.5 py-0.5 rounded border border-zinc-200 bg-white text-xs text-center"
                    />
                    <span>ms</span>
                  </div>
                  <button
                    onClick={() => {
                      const custom = customVoices.find((c) => c.id === line.voiceId);
                      const prof =
                        ALL_VOICE_PROFILES.find((v) => v.id === line.voiceId) ||
                        (custom ? buildVoiceProfileFromCustom(custom) : ALL_VOICE_PROFILES[0]);
                      auditionVoice(prof, line.text);
                    }}
                    className="p-1.5 rounded border border-zinc-200 bg-white hover:bg-zinc-100 cursor-pointer"
                    title="Nghe thử dòng thoại này"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-zinc-700" />
                  </button>
                  <button
                    onClick={() => setAudiobookLines((prev) => prev.filter((l) => l.id !== line.id))}
                    className="p-1.5 rounded border border-zinc-200 bg-white hover:bg-red-50 text-zinc-500 hover:text-red-600 cursor-pointer"
                    title="Xóa dòng thoại"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={line.text}
                  onChange={(e) =>
                    setAudiobookLines((prev) =>
                      prev.map((l) => (l.id === line.id ? { ...l, text: e.target.value } : l))
                    )
                  }
                  className="w-full px-3 py-1.5 rounded border border-zinc-200 bg-white text-xs"
                />
              </div>
            ))}
          </div>

          {audiobookMasterUrl && (
            <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-2.5">
              <WaveformBars
                peaks={audiobookMasterPeaks}
                label={`Master Audiobook Đa Nhân Vật (${audiobookLines.length} vai)`}
                durationSec={audiobookMasterDuration}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <audio ref={audiobookAudioRef} controls src={audiobookMasterUrl} onPlay={(e) => bindExclusiveAudioElement(e.currentTarget)} className="flex-1 min-w-[240px]" />
                <a
                  href={audiobookMasterUrl}
                  download="SYNAPES_Audiobook_Master.wav"
                  className="px-3.5 py-2 rounded-lg bg-zinc-950 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải File Master Audiobook (.WAV)</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Engine Architecture Notice */}
      {!onUpdateAiConfig ? null : (
        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <span>
              Mọi tệp .WAV xuất ra đều được tổng hợp từ giọng nói Neural thực tế (24kHz PCM + Formant-Warp VTLN v4.0) hoặc qua Cloud Voice Plugin HTTPS / BYOK Cloud APIs.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
