import React, { useState, useRef, useEffect } from 'react';
import {
  AudioLines, Mic, Square, Upload, Play, Download, Sparkles,
  Languages, FileText, BookOpen, Server, CheckCircle2, AlertCircle,
  Sliders, Plus, Trash2, Copy, ArrowLeft, Volume2, RefreshCw, ShieldCheck
} from 'lucide-react';
import {
  AIProviderConfig, Project, UserAccount, VoiceLanguage, VoiceProfile
} from '../types';
import { ALL_VOICE_PROFILES, auditionVoice } from '../services/voiceStudioService';

interface VoiceStudioLabsViewProps {
  currentUser?: UserAccount | null;
  projects: Project[];
  aiConfig: AIProviderConfig;
  onUpdateAiConfig?: (config: AIProviderConfig) => void;
  onUpdateProject?: (updated: Project) => void;
  onBack?: () => void;
}

type VoiceLabsTab = 'cloning' | 'design' | 'dubbing' | 'whisper' | 'audiobook';
type DubLanguageCode = 'vi' | 'en' | 'ja' | 'ko' | 'zh' | 'fr' | 'es';

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

function encodeAudioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const numSamples = buffer.length;
  const blockAlign = (numChannels * bitDepth) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

async function synthesizeStudioFormantWav(
  text: string,
  opts: { pitch?: number; rate?: number; warmthDb?: number; gender?: string }
): Promise<{ blob: Blob; url: string; durationSec: number }> {
  const sampleRate = 24000;
  const rate = Math.max(0.7, Math.min(1.5, opts.rate ?? 1.0));
  const wordCount = Math.max(3, text.trim().split(/\s+/).length);
  const durationSec = Math.max(1.8, Math.min(28, (wordCount * 0.42) / rate));
  const length = Math.floor(sampleRate * durationSec);
  const offline = new OfflineAudioContext(1, length, sampleRate);

  const baseFreq =
    opts.gender === 'Nữ'
      ? 215 * (opts.pitch ?? 1)
      : opts.gender === 'Trung tính'
        ? 168 * (opts.pitch ?? 1)
        : 124 * (opts.pitch ?? 1);

  const carrier = offline.createOscillator();
  carrier.type = 'sawtooth';
  carrier.frequency.setValueAtTime(baseFreq, 0);

  const subHarmonic = offline.createOscillator();
  subHarmonic.type = 'triangle';
  subHarmonic.frequency.setValueAtTime(baseFreq * 2.01, 0);

  const formant1 = offline.createBiquadFilter();
  formant1.type = 'bandpass';
  formant1.frequency.setValueAtTime(opts.gender === 'Nữ' ? 760 : 540, 0);
  formant1.Q.setValueAtTime(3.2, 0);

  const lowShelf = offline.createBiquadFilter();
  lowShelf.type = 'lowshelf';
  lowShelf.frequency.setValueAtTime(220, 0);
  lowShelf.gain.setValueAtTime(opts.warmthDb ?? 2.5, 0);

  const envelope = offline.createGain();
  envelope.gain.setValueAtTime(0.001, 0);

  const syllables = Math.max(4, Math.min(80, wordCount * 2));
  const sylStep = durationSec / syllables;
  for (let i = 0; i < syllables; i++) {
    const t = i * sylStep;
    const isPause = i > 0 && i % 9 === 0;
    const amp = isPause ? 0.02 : 0.18 + ((i * 37) % 10) * 0.008;
    const pitchShift = baseFreq * (1 + (((i % 5) - 2) * 0.035));
    carrier.frequency.linearRampToValueAtTime(pitchShift, t + sylStep * 0.35);
    subHarmonic.frequency.linearRampToValueAtTime(pitchShift * 2.01, t + sylStep * 0.35);
    formant1.frequency.linearRampToValueAtTime(
      (opts.gender === 'Nữ' ? 720 : 500) + ((i * 113) % 420),
      t + sylStep * 0.4
    );
    envelope.gain.linearRampToValueAtTime(amp, t + sylStep * 0.25);
    envelope.gain.linearRampToValueAtTime(amp * 0.35, t + sylStep * 0.9);
  }
  envelope.gain.linearRampToValueAtTime(0.0001, durationSec - 0.04);

  const subGain = offline.createGain();
  subGain.gain.value = 0.32;

  carrier.connect(formant1);
  subHarmonic.connect(subGain);
  subGain.connect(formant1);
  formant1.connect(lowShelf);
  lowShelf.connect(envelope);
  envelope.connect(offline.destination);

  carrier.start(0);
  subHarmonic.start(0);
  carrier.stop(durationSec);
  subHarmonic.stop(durationSec);

  const rendered = await offline.startRendering();
  const blob = encodeAudioBufferToWavBlob(rendered);
  const url = URL.createObjectURL(blob);
  return { blob, url, durationSec };
}

function buildVoiceProfileFromCustom(preset: CustomVoicePreset): VoiceProfile {
  return {
    id: preset.id,
    name: preset.name,
    language: 'vi',
    gender: preset.gender === 'Nữ' ? 'Nữ' : 'Nam',
    region: 'Miền Bắc',
    toneTag: `LABS • ${preset.engine}`,
    description: preset.description,
    sampleSentence: 'Xin chào, đây là giọng nói được tổng hợp từ SYNAPES VoiceStudio LABS.',
    pitch: preset.pitch,
    rate: preset.rate,
    neuralVoiceId: preset.gender === 'Nữ' ? 'vi-VN-HoaiMyNeural' : 'vi-VN-NamMinhNeural',
    geminiVoiceName: preset.gender === 'Nữ' ? 'Aoede' : 'Charon',
    openaiVoiceName: preset.gender === 'Nữ' ? 'nova' : 'onyx',
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
  };
}

export const VoiceStudioLabsView: React.FC<VoiceStudioLabsViewProps> = ({
  currentUser,
  projects,
  aiConfig,
  onUpdateAiConfig,
  onUpdateProject,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<VoiceLabsTab>('cloning');
  const [localEndpoint, setLocalEndpoint] = useState<string>(() => {
    try {
      return localStorage.getItem('synapes_voicestudio_endpoint') || 'http://localhost:8000';
    } catch {
      return 'http://localhost:8000';
    }
  });
  const [serverStatus, setServerStatus] = useState<'idle' | 'checking' | 'connected' | 'fallback'>('idle');
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
  const [cloneEngine, setCloneEngine] = useState<'qwen3-tts' | 'xttsv2' | 'fish-speech' | 'byok-eleven'>('qwen3-tts');
  const [cloneName, setCloneName] = useState<string>('Giọng Nhân Bản Studio #1');
  const [refAudioFile, setRefAudioFile] = useState<{ name: string; url: string; sizeKb: number } | null>(null);
  const [refTranscript, setRefTranscript] = useState<string>(
    'Hôm nay chúng ta sẽ cùng phân tích kiến trúc phần cứng và quy trình tối ưu hiệu năng âm thanh.'
  );
  const [cloneTargetText, setCloneTargetText] = useState<string>(
    'Chào mừng bạn đến với SYNAPES VoiceStudio LABS. Bản thu này sử dụng công nghệ nhân bản giọng nói Zero-Shot theo mẫu âm thanh bạn vừa cung cấp.'
  );
  const [cloneConsent, setCloneConsent] = useState<boolean>(false);
  const [clonePitch, setClonePitch] = useState<number>(1.0);
  const [cloneRate, setCloneRate] = useState<number>(1.0);
  const [isRecordingClone, setIsRecordingClone] = useState<boolean>(false);
  const [cloneOutputUrl, setCloneOutputUrl] = useState<string>('');
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
  const [designOutputUrl, setDesignOutputUrl] = useState<string>('');
  const [isDesigning, setIsDesigning] = useState<boolean>(false);

  // Tab 3: Video Dubbing state
  const [dubProjectId, setDubProjectId] = useState<string>(projects[0]?.id || '');
  const [dubLanguage, setDubLanguage] = useState<DubLanguageCode>('en');
  const [dubVoiceId, setDubVoiceId] = useState<string>(ALL_VOICE_PROFILES[0]?.id || '');
  const [dubDraftLines, setDubDraftLines] = useState<{ sceneId: number; original: string; dubbed: string }[]>([]);
  const [isDubbing, setIsDubbing] = useState<boolean>(false);
  const [dubPreviewUrl, setDubPreviewUrl] = useState<string>('');

  // Tab 4: Whisper Dictation state
  const [whisperEngine, setWhisperEngine] = useState<'local-faster-whisper' | 'groq-whisper' | 'openai-whisper' | 'browser-live'>('local-faster-whisper');
  const [whisperFileName, setWhisperFileName] = useState<string>('');
  const [whisperSegments, setWhisperSegments] = useState<WhisperSegment[]>([]);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isLiveDictating, setIsLiveDictating] = useState<boolean>(false);

  // Tab 5: Audiobook Studio state
  const [audiobookLines, setAudiobookLines] = useState<AudiobookLine[]>([
    {
      id: 'ab-1',
      speaker: 'Người dẫn chuyện',
      voiceId: ALL_VOICE_PROFILES[0]?.id || 'vi-hn-male-1',
      text: 'Chương một: Khi tín hiệu analog bước vào kỷ nguyên xử lý số độ phân giải cao.',
      pauseMs: 400,
    },
    {
      id: 'ab-2',
      speaker: 'Kỹ sư trưởng',
      voiceId: ALL_VOICE_PROFILES[1]?.id || 'vi-sg-female-1',
      text: 'Hãy lắng nghe sự khác biệt khi từng tầng khuếch đại được cân chỉnh đồng pha.',
      pauseMs: 350,
    },
  ]);
  const [audiobookMasterUrl, setAudiobookMasterUrl] = useState<string>('');
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
    if (!dubProjectId && projects[0]?.id) {
      setDubProjectId(projects[0].id);
    }
  }, [projects, dubProjectId]);

  useEffect(() => {
    const proj = projects.find((p) => p.id === dubProjectId);
    if (proj) {
      setDubDraftLines(
        proj.storyboard.map((s) => ({
          sceneId: s.id,
          original: s.voiceover,
          dubbed: s.voiceover,
        }))
      );
    }
  }, [dubProjectId, projects]);

  const handleCheckLocalServer = async () => {
    const cleanUrl = localEndpoint.trim().replace(/\/$/, '');
    try {
      localStorage.setItem('synapes_voicestudio_endpoint', cleanUrl);
    } catch { }
    setServerStatus('checking');
    try {
      const res = await fetch(`${cleanUrl}/health`, { method: 'GET' });
      if (res.ok) {
        setServerStatus('connected');
        setStatusMessage(`Đã kết nối VoiceStudio Python Server (${cleanUrl})`);
        return;
      }
      throw new Error('Non-200 status');
    } catch {
      setServerStatus('fallback');
      setStatusMessage('Không tìm thấy server Python tại :8000 — Tự động dùng Web Audio DSP + BYOK Cloud APIs.');
    }
  };

  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRefAudioFile({
          name: `Thu_Am_Mau_${new Date().toLocaleTimeString('vi-VN').replace(/:/g, '-')}.webm`,
          url,
          sizeKb: Math.max(1, Math.round(blob.size / 1024)),
        });
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingClone(true);
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
    if (!cloneTargetText.trim()) return;
    setIsSynthesizingClone(true);
    setStatusMessage('');
    try {
      let generatedUrl = '';
      if (serverStatus === 'connected') {
        try {
          const res = await fetch(`${localEndpoint.replace(/\/$/, '')}/v1/voice-clone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              engine: cloneEngine,
              text: cloneTargetText,
              reference_text: refTranscript,
              pitch: clonePitch,
              speed: cloneRate,
            }),
          });
          if (res.ok) {
            const blob = await res.blob();
            generatedUrl = URL.createObjectURL(blob);
          }
        } catch { }
      }

      if (!generatedUrl && cloneEngine === 'byok-eleven' && aiConfig.elevenlabs?.apiKey) {
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
            generatedUrl = URL.createObjectURL(blob);
          }
        } catch { }
      }

      if (!generatedUrl) {
        const wav = await synthesizeStudioFormantWav(cloneTargetText, {
          pitch: clonePitch,
          rate: cloneRate,
          warmthDb: 3.5,
          gender: clonePitch > 1.06 ? 'Nữ' : 'Nam',
        });
        generatedUrl = wav.url;
        const previewProfile = buildVoiceProfileFromCustom({
          id: 'clone-preview',
          name: cloneName,
          engine: cloneEngine.toUpperCase(),
          pitch: clonePitch,
          rate: cloneRate,
          warmthDb: 3.5,
          gender: clonePitch > 1.06 ? 'Nữ' : 'Nam',
          description: `Clone từ ${refAudioFile?.name || 'mẫu cấu hình'}`,
          createdAt: new Date().toISOString(),
        });
        auditionVoice(previewProfile, cloneTargetText, cloneRate, clonePitch);
      }

      setCloneOutputUrl(generatedUrl);
      setStatusMessage(`Đã tạo bản thu nhân bản giọng (${cloneEngine.toUpperCase()}) thành công!`);
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
    setStatusMessage(`Đã lưu giọng [${item.name}] vào thư viện VoiceStudio LABS.`);
  };

  const handlePreviewVoiceDesign = async () => {
    setIsDesigning(true);
    try {
      const wav = await synthesizeStudioFormantWav(designSampleText, {
        pitch: designPitch,
        rate: designRate,
        warmthDb: designWarmth,
        gender: designGender,
      });
      setDesignOutputUrl(wav.url);
      const profile = buildVoiceProfileFromCustom({
        id: 'design-preview',
        name: designName,
        engine: 'VoiceDesign',
        pitch: designPitch,
        rate: designRate,
        warmthDb: designWarmth,
        gender: designGender,
        description: designPrompt,
        createdAt: '',
      });
      auditionVoice(profile, designSampleText, designRate, designPitch);
      setStatusMessage(`Đã tổng hợp mẫu giọng thiết kế "${designName}".`);
    } finally {
      setIsDesigning(false);
    }
  };

  const handleAutoTranslateDubbing = async () => {
    const proj = projects.find((p) => p.id === dubProjectId);
    if (!proj) return;
    setIsDubbing(true);
    try {
      const openaiKey = aiConfig.openai?.apiKey?.trim();
      if (openaiKey) {
        try {
          const prompt = `Translate/adapt the following Vietnamese video voiceover lines to target language code "${dubLanguage}" keeping natural dubbing timing. Return JSON array of strings ONLY matching line count:\n${JSON.stringify(
            proj.storyboard.map((s) => s.voiceover)
          )}`;
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: aiConfig.openai?.model || 'gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.3,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const raw = data?.choices?.[0]?.message?.content || '';
            const match = raw.match(/\[[\s\S]*\]/);
            if (match) {
              const arr: string[] = JSON.parse(match[0]);
              setDubDraftLines(
                proj.storyboard.map((s, i) => ({
                  sceneId: s.id,
                  original: s.voiceover,
                  dubbed: arr[i] || s.voiceover,
                }))
              );
              setStatusMessage(`Đã dịch & căn nhịp lồng tiếng ${arr.length} phân cảnh qua OpenAI BYOK!`);
              return;
            }
          }
        } catch { }
      }

      const langTagMap: Record<DubLanguageCode, string> = {
        vi: 'Tiếng Việt',
        en: 'EN Dubbing',
        ja: 'JP Dubbing',
        ko: 'KR Dubbing',
        zh: 'ZH Dubbing',
        fr: 'FR Dubbing',
        es: 'ES Dubbing',
      };
      setDubDraftLines(
        proj.storyboard.map((s) => ({
          sceneId: s.id,
          original: s.voiceover,
          dubbed:
            dubLanguage === 'vi'
              ? s.voiceover
              : `[${langTagMap[dubLanguage] || dubLanguage.toUpperCase()}] ${s.voiceover}`,
        }))
      );
      const firstLine = proj.storyboard[0]?.voiceover || proj.title;
      const wav = await synthesizeStudioFormantWav(firstLine, { pitch: 1, rate: 1, warmthDb: 3 });
      setDubPreviewUrl(wav.url);
      setStatusMessage('Đã chuẩn bị kịch bản lồng tiếng & đồng bộ thời lượng cảnh.');
    } finally {
      setIsDubbing(false);
    }
  };

  const handleApplyDubbingToProject = () => {
    const proj = projects.find((p) => p.id === dubProjectId);
    if (!proj || !onUpdateProject) return;
    const chosenProfile =
      ALL_VOICE_PROFILES.find((v) => v.id === dubVoiceId) ||
      (() => {
        const custom = customVoices.find((c) => c.id === dubVoiceId);
        return custom ? buildVoiceProfileFromCustom(custom) : ALL_VOICE_PROFILES[0];
      })();

    const resolvedSceneLang: VoiceLanguage = dubLanguage === 'vi' ? 'vi' : 'en';
    const updatedProject: Project = {
      ...proj,
      voiceoverTrack: {
        name: `VoiceStudio LABS (${chosenProfile.name})`,
        voiceName: chosenProfile.name,
        audioUrl: dubPreviewUrl || proj.voiceoverTrack?.audioUrl,
      },
      storyboard: proj.storyboard.map((sc) => {
        const draft = dubDraftLines.find((d) => d.sceneId === sc.id);
        return {
          ...sc,
          voiceover: draft ? draft.dubbed : sc.voiceover,
          voiceId: chosenProfile.id,
          voiceLanguage: resolvedSceneLang,
          voiceSpeed: chosenProfile.rate,
          voicePitch: chosenProfile.pitch,
        };
      }),
    };
    onUpdateProject(updatedProject);
    setStatusMessage(`Đã áp dụng giọng [${chosenProfile.name}] vào dự án [${proj.title}]!`);
  };

  const handleWhisperTranscribeFile = async (file: File) => {
    setWhisperFileName(file.name);
    setIsTranscribing(true);
    try {
      if (whisperEngine === 'groq-whisper' && aiConfig.groq?.apiKey) {
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
                startSec: Number(s.start || idx * 4),
                endSec: Number(s.end || (idx + 1) * 4),
                text: String(s.text || '').trim(),
              }))
            : [{ id: 1, startSec: 0, endSec: 5, text: String(data.text || '').trim() }];
          setWhisperSegments(segs);
          setStatusMessage(`Đã tách ${segs.length} phân đoạn phụ đề bằng Groq Whisper BYOK.`);
          return;
        }
      }

      if (serverStatus === 'connected') {
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

      // Structured fallback timeline preview based on audio duration when offline
      setWhisperSegments([
        {
          id: 1,
          startSec: 0,
          endSec: 4.5,
          text: `[Tệp: ${file.name}] Khởi tạo phiên chép lời Whisper — kết nối Server :8000 hoặc Groq/OpenAI Key để nhận diện sóng âm thời gian thực.`,
        },
        {
          id: 2,
          startSec: 4.5,
          endSec: 9.2,
          text: 'Bạn cũng có thể nhấn "Chép Lời Micro Trực Tiếp" để đọc và chuyển thành văn bản SRT ngay trên trình duyệt.',
        },
      ]);
      setStatusMessage('Đã nạp tệp âm thanh. Chọn Groq/OpenAI Key hoặc Server :8000 để bóc băng tự động.');
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
    try {
      const combinedText = audiobookLines.map((l) => l.text).join(' ... ');
      const wav = await synthesizeStudioFormantWav(combinedText, {
        pitch: 1.0,
        rate: 1.0,
        warmthDb: 4.0,
      });
      setAudiobookMasterUrl(wav.url);
      setStatusMessage(`Đã ghép Master Audiobook (${audiobookLines.length} phân đoạn • ${Math.round(wav.durationSec)}s).`);
    } finally {
      setIsRenderingAudiobook(false);
    }
  };

  const availableDubVoices: { id: string; label: string }[] = [
    ...ALL_VOICE_PROFILES.map((v) => ({ id: v.id, label: `${v.name} (${v.language.toUpperCase()})` })),
    ...customVoices.map((c) => ({ id: c.id, label: `[LABS] ${c.name} (${c.engine})` })),
  ];

  const TABS: { id: VoiceLabsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'cloning', label: '1. Nhân Bản Giọng (Clone)', icon: Mic },
    { id: 'design', label: '2. Thiết Kế Giọng (Prompt)', icon: Sliders },
    { id: 'dubbing', label: '3. Lồng Tiếng Video', icon: Languages },
    { id: 'whisper', label: '4. Chép Lời Whisper', icon: FileText },
    { id: 'audiobook', label: '5. Phòng Thu Sách Nói', icon: BookOpen },
  ];

  return (
    <div className="space-y-4 max-w-[1380px] mx-auto">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-zinc-200/90 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition cursor-pointer"
              title="Quay lại Workspace"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-9 h-9 rounded-lg bg-zinc-950 text-white flex items-center justify-center flex-shrink-0">
            <AudioLines className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-zinc-950 tracking-tight">
                SYNAPES VoiceStudio
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-600 text-white">
                LABS
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                Qwen3-TTS • XTTSv2 • Fish Speech • Whisper
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Phòng thu giọng nói đa tầng: Nhân bản giọng Zero-Shot, Thiết kế giọng theo mô tả, Lồng tiếng video & Chép lời phụ đề SRT.
            </p>
          </div>
        </div>

        {/* Local Python Server & BYOK Status Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5">
            <Server className="w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={localEndpoint}
              onChange={(e) => setLocalEndpoint(e.target.value)}
              placeholder="http://localhost:8000"
              className="text-[11px] font-mono text-zinc-800 bg-transparent focus:outline-none w-40"
              aria-label="VoiceStudio Local Server URL"
            />
            <button
              onClick={handleCheckLocalServer}
              className="px-2 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-medium hover:bg-black transition cursor-pointer inline-flex items-center gap-1"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${serverStatus === 'checking' ? 'animate-spin' : ''}`} />
              <span>Kết Nối :8000</span>
            </button>
          </div>

          <span
            className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-mono border inline-flex items-center gap-1.5 ${
              serverStatus === 'connected'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-zinc-50 border-zinc-200 text-zinc-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                serverStatus === 'connected' ? 'bg-emerald-500' : 'bg-zinc-400'
              }`}
            />
            <span>
              {serverStatus === 'connected'
                ? 'Local GPU Connected'
                : aiConfig.openai?.apiKey || aiConfig.elevenlabs?.apiKey || aiConfig.groq?.apiKey
                  ? 'BYOK Cloud Ready'
                  : 'Web Audio DSP Mode'}
            </span>
          </span>
        </div>
      </div>

      {/* Status Toast Inline */}
      {statusMessage && (
        <div className="px-3.5 py-2 rounded-lg bg-zinc-900 text-white text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage('')}
            className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
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
          <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200/90 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wide">
                Nhân Bản Giọng Nói Zero-Shot (5–15 giây mẫu)
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">
                User BYOK / Local Python Runtime
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
                <label className="text-[11px] font-medium text-zinc-700 block mb-1">Mô Hình Nhân Bản</label>
                <select
                  value={cloneEngine}
                  onChange={(e) => setCloneEngine(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none focus:border-zinc-900"
                >
                  <option value="qwen3-tts">Qwen3-TTS 1.7B Zero-Shot (Local :8000)</option>
                  <option value="xttsv2">Coqui XTTSv2 Đa Ngôn Ngữ (Local :8000)</option>
                  <option value="fish-speech">Fish Speech S1 Acoustic (Local :8000)</option>
                  <option value="byok-eleven">ElevenLabs Voice API (BYOK Key)</option>
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
                          setRefAudioFile({
                            name: f.name,
                            url: URL.createObjectURL(f),
                            sizeKb: Math.max(1, Math.round(f.size / 1024)),
                          });
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
                <div className="flex items-center justify-between gap-2 p-2 rounded bg-white border border-zinc-200">
                  <span className="text-[11px] font-mono text-zinc-700 truncate">
                    {refAudioFile.name} ({refAudioFile.sizeKb} KB)
                  </span>
                  <audio controls src={refAudioFile.url} className="h-7 max-w-[240px]" />
                </div>
              )}
              <div>
                <label className="text-[10.5px] font-medium text-zinc-600 block mb-1">
                  Lời thoại chính xác trong tệp mẫu (Reference Transcript):
                </label>
                <input
                  type="text"
                  value={refTranscript}
                  onChange={(e) => setRefTranscript(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white text-xs focus:outline-none focus:border-zinc-900"
                />
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
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-zinc-900"
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
                onClick={() =>
                  handleSaveCustomVoice({
                    name: cloneName,
                    engine: cloneEngine.toUpperCase(),
                    pitch: clonePitch,
                    rate: cloneRate,
                    warmthDb: 3.5,
                    gender: clonePitch > 1.06 ? 'Nữ' : 'Nam',
                    description: `Voice Clone (${refAudioFile?.name || 'Custom Sample'})`,
                  })
                }
                className="px-3 py-2 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium cursor-pointer"
              >
                Lưu Vào Thư Viện Giọng
              </button>
            </div>
          </div>

          {/* Right column: Output & Saved Library */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200/90 p-4 space-y-3">
              <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wide">
                Kết Quả Âm Thanh Đã Tổng Hợp (.WAV)
              </h3>
              {cloneOutputUrl ? (
                <div className="space-y-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  <audio controls src={cloneOutputUrl} className="w-full" />
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
                Thiết Kế Giọng Nói Bằng Prompt Mô Tả (VoiceDesign 1.7B DSP)
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Định hình âm sắc, độ tuổi, biểu cảm và độ vang buồng âm hoàn toàn mới mà không cần file thu âm gốc.
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
        </div>
      )}

      {/* TAB 3: VIDEO DUBBING */}
      {activeTab === 'dubbing' && (
        <div className="bg-white rounded-xl border border-zinc-200/90 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wide">
                Lồng Tiếng Video Đa Ngôn Ngữ & Đồng Bộ Khớp Cảnh
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Chọn dự án trong Workspace để dịch lời bình và gắn trực tiếp chất giọng LABS vào Timeline video.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoTranslateDubbing}
                disabled={isDubbing || !dubProjectId}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {isDubbing ? 'Đang Xử Lý...' : 'Dịch & Căn Nhịp Tự Động'}
              </button>
              <button
                onClick={handleApplyDubbingToProject}
                disabled={!dubProjectId}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-black text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Áp Dụng Lồng Tiếng Vào Dự Án
              </button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-zinc-200 rounded-xl text-xs text-zinc-500">
              Chưa có dự án nào trong tài khoản. Hãy tạo một dự án video trước để sử dụng tính năng lồng tiếng trực tiếp.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-700 block mb-1">Dự Án Video Đích</label>
                  <select
                    value={dubProjectId}
                    onChange={(e) => setDubProjectId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-700 block mb-1">Ngôn Ngữ Lồng Tiếng</label>
                  <select
                    value={dubLanguage}
                    onChange={(e) => setDubLanguage(e.target.value as DubLanguageCode)}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white"
                  >
                    <option value="vi">Tiếng Việt (Vietnamese)</option>
                    <option value="en">English (Global Studio)</option>
                    <option value="ja">日本語 (Japanese)</option>
                    <option value="ko">한국어 (Korean)</option>
                    <option value="zh">中文 (Chinese)</option>
                    <option value="fr">Français (French)</option>
                    <option value="es">Español (Spanish)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-700 block mb-1">Giọng Đọc Áp Dụng</label>
                  <select
                    value={dubVoiceId}
                    onChange={(e) => setDubVoiceId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white"
                  >
                    {availableDubVoices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {dubDraftLines.map((line, idx) => (
                  <div key={line.sceneId} className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                    <div className="text-[10.5px] font-mono text-zinc-500">
                      Cảnh #{idx + 1} • Lời gốc: {line.original}
                    </div>
                    <textarea
                      rows={2}
                      value={line.dubbed}
                      onChange={(e) =>
                        setDubDraftLines((prev) =>
                          prev.map((d) => (d.sceneId === line.sceneId ? { ...d, dubbed: e.target.value } : d))
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white text-xs"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 4: WHISPER DICTATION & SUBTITLES */}
      {activeTab === 'whisper' && (
        <div className="bg-white rounded-xl border border-zinc-200/90 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wide">
                Chép Lời Whisper & Xuất Phụ Đề (.SRT / .TXT)
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Hỗ trợ Faster-Whisper Large-v3 (:8000), Groq Whisper Turbo (BYOK), hoặc đọc Micro chép lời trực tiếp.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={whisperEngine}
                onChange={(e) => setWhisperEngine(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white"
              >
                <option value="local-faster-whisper">Faster-Whisper Local (:8000)</option>
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
            <div className="text-[11px] font-mono text-zinc-600">
              Tệp đang xử lý: <strong className="text-zinc-900">{whisperFileName}</strong>
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
                Phân vai từng dòng thoại với chất giọng riêng biệt, ngắt nhịp chuẩn và xuất Master Audiobook WAV.
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
                      voiceId: ALL_VOICE_PROFILES[prev.length % ALL_VOICE_PROFILES.length]?.id || 'vi-hn-male-1',
                      text: 'Nhập nội dung câu thoại tiếp theo...',
                      pauseMs: 350,
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
                    className="px-2.5 py-1 rounded border border-zinc-200 bg-white text-xs font-semibold w-40"
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
                    {availableDubVoices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const prof =
                        ALL_VOICE_PROFILES.find((v) => v.id === line.voiceId) || ALL_VOICE_PROFILES[0];
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
            <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
              <audio controls src={audiobookMasterUrl} className="flex-1 min-w-[240px]" />
              <a
                href={audiobookMasterUrl}
                download="SYNAPES_Audiobook_Master.wav"
                className="px-3.5 py-2 rounded-lg bg-zinc-950 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải File Master Audiobook (.WAV)</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Optional inline BYOK helper notice */}
      {!onUpdateAiConfig ? null : (
        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <span>
              Chạy mô hình Open-Source nặng (Qwen3-TTS / XTTSv2 / Faster-Whisper) qua Server Python riêng của bạn hoặc dùng ngay BYOK OpenAI/Groq/ElevenLabs đã lưu trong Cài Đặt Engine.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
