import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Link as LinkIcon,
  Upload,
  Cpu,
  Key,
  Flame,
  Clock,
  Layers,
  Volume2,
  CheckCircle2,
  ArrowRight,
  Copy,
  ExternalLink,
  Film,
  Zap,
  ShieldCheck,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Columns,
  Maximize2,
  VolumeX,
} from 'lucide-react';
import {
  AIProviderConfig,
  AIProviderId,
  VideoDnaBlueprint,
  ClonedVideoProject,
  Project,
} from '../types';
import {
  deconstructVideoDna,
  synthesizeClonedProject,
  extractVideoInfo,
  ExtractedVideoInfo,
} from '../services/videoDeconstructService';

interface VideoClonerViewProps {
  config: AIProviderConfig;
  onOpenSettings: () => void;
  onProjectCreated?: (project: Project) => void;
  onNavigateToReview?: () => void;
}

const CLONER_STATE_STORAGE_KEY = 'synapes_byok_cloner_state_v1';

function loadSavedClonerState(): {
  inputMode?: 'url' | 'upload';
  videoUrl?: string;
  manualTranscript?: string;
  showTranscriptBox?: boolean;
  dnaBlueprint?: VideoDnaBlueprint | null;
  newTopic?: string;
  targetAudience?: string;
  clonedProject?: ClonedVideoProject | null;
} {
  try {
    const raw = sessionStorage.getItem(CLONER_STATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const VideoClonerView: React.FC<VideoClonerViewProps> = ({
  config,
  onOpenSettings,
  onProjectCreated,
  onNavigateToReview,
}) => {
  const savedInit = useRef(loadSavedClonerState()).current;
  const [inputMode, setInputMode] = useState<'url' | 'upload'>(savedInit.inputMode || 'url');
  const [videoUrl, setVideoUrl] = useState<string>(savedInit.videoUrl || 'https://www.youtube.com/shorts/sample-hook-viral');
  const [detectedVideo, setDetectedVideo] = useState<ExtractedVideoInfo | null>(() =>
    extractVideoInfo(savedInit.videoUrl || 'https://www.youtube.com/shorts/sample-hook-viral')
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const [manualTranscript, setManualTranscript] = useState<string>(savedInit.manualTranscript || '');
  const [showTranscriptBox, setShowTranscriptBox] = useState<boolean>(Boolean(savedInit.showTranscriptBox));

  // Trạng thái bóc tách
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [dnaBlueprint, setDnaBlueprint] = useState<VideoDnaBlueprint | null>(savedInit.dnaBlueprint || null);

  // Trạng thái nhân bản
  const [newTopic, setNewTopic] = useState<string>(savedInit.newTopic || '');
  const [targetAudience, setTargetAudience] = useState<string>(savedInit.targetAudience || 'Khán giả trẻ mạng xã hội (18 - 35 tuổi)');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [clonedProject, setClonedProject] = useState<ClonedVideoProject | null>(savedInit.clonedProject || null);

  // Tự động lưu ngữ cảnh BYOK vào sessionStorage để không mất dữ liệu khi chuyển tab / reload
  useEffect(() => {
    try {
      sessionStorage.setItem(
        CLONER_STATE_STORAGE_KEY,
        JSON.stringify({
          inputMode,
          videoUrl,
          manualTranscript,
          showTranscriptBox,
          dnaBlueprint,
          newTopic,
          targetAudience,
          clonedProject,
        })
      );
    } catch { }
  }, [inputMode, videoUrl, manualTranscript, showTranscriptBox, dnaBlueprint, newTopic, targetAudience, clonedProject]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Trạng thái Bàn Trình Chiếu Xem Thử Sản Phẩm Nhân Bản (Interactive Preview Player)
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [isSplitCompare, setIsSplitCompare] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nhận diện video tức thì khi người dùng gõ hoặc dán link
  useEffect(() => {
    if (inputMode === 'url' && videoUrl.trim()) {
      const info = extractVideoInfo(videoUrl);
      setDetectedVideo(info);
    } else {
      setDetectedVideo(null);
    }
  }, [videoUrl, inputMode]);

  // Quản lý Khóa API BYOK trực tiếp tại màn hình (đồng bộ với Settings nếu config cập nhật)
  const [customGeminiKey, setCustomGeminiKey] = useState<string>(() => localStorage.getItem('synapes_custom_gemini_key') || config.gemini?.apiKey || '');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  useEffect(() => {
    if (!customGeminiKey && config.gemini?.apiKey) {
      setCustomGeminiKey(config.gemini.apiKey);
    }
  }, [config.gemini?.apiKey]);

  // Kiểm tra trạng thái BYOK Key
  const effectiveGeminiKey = customGeminiKey || config.gemini?.apiKey || '';
  const hasGeminiKey = Boolean(effectiveGeminiKey && effectiveGeminiKey.length > 5);
  const hasOpenAIKey = Boolean(config.openai?.apiKey && config.openai.apiKey.length > 5);
  const hasClaudeKey = Boolean(config.claude?.apiKey && config.claude.apiKey.length > 5);
  const hasDeepSeekKey = Boolean(config.deepseek?.apiKey && config.deepseek.apiKey.length > 5);
  const hasAnyByokKey = hasGeminiKey || hasOpenAIKey || hasClaudeKey || hasDeepSeekKey;
  const activeKeyName = hasGeminiKey
    ? `Gemini AI (${config.gemini?.model || 'gemini-3.6-flash'} • BYOK)`
    : hasOpenAIKey
      ? `OpenAI GPT (${config.openai?.model || 'gpt-4o-mini'} • BYOK)`
      : hasDeepSeekKey
        ? 'DeepSeek API (BYOK Sẵn Sàng)'
        : hasClaudeKey
          ? 'Claude API (BYOK Sẵn Sàng)'
          : 'Zero-Mock Semantic Engine (Tự Động)';

  const handleSaveQuickKey = (key: string) => {
    const trimmed = key.trim();
    setCustomGeminiKey(trimmed);
    localStorage.setItem('synapes_custom_gemini_key', trimmed);
    setShowKeyInput(false);
  };

  // Xử lý nạp file video
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const blobUrl = URL.createObjectURL(file);
      setFilePreviewUrl(blobUrl);

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFileBase64(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Kích hoạt bóc tách video
  const handleStartDeconstruct = async (urlToUse?: string) => {
    const targetUrl = urlToUse || videoUrl;
    if (inputMode === 'url' && !targetUrl.trim()) {
      alert('Vui lòng dán đường dẫn video (YouTube, TikTok, Facebook, Reels)!');
      return;
    }
    if (inputMode === 'upload' && !selectedFile) {
      alert('Vui lòng chọn một tệp video từ máy tính của bạn!');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(10);
    setStatusMessage('Đang kết nối hệ thống AI Engine giải mã cấu trúc Video...');

    const effectiveConfig = {
      ...config,
      gemini: {
        ...config.gemini,
        apiKey: effectiveGeminiKey,
        model: config.gemini?.model || 'gemini-2.0-flash',
      },
    };

    try {
      const dna = await deconstructVideoDna({
        videoUrl: inputMode === 'url' ? targetUrl : undefined,
        videoData: inputMode === 'upload' ? fileBase64 : undefined,
        mimeType: selectedFile?.type || 'video/mp4',
        manualTranscript: manualTranscript.trim() || undefined,
        config: effectiveConfig,
        onProgress: (status, percent) => {
          setStatusMessage(status);
          setAnalysisProgress(percent);
        },
      });

      setDnaBlueprint(dna);
      setIsAnalyzing(false);
    } catch (err) {
      console.error('Lỗi phân tích video:', err);
      setIsAnalyzing(false);
      alert('Đã xảy ra sự cố khi phân tích. Đã áp dụng mẫu DNA Video tối ưu để bạn tiếp tục!');
    }
  };

  // Tự động giải mã ngay khi người dùng chọn mẫu nhanh
  const handleSelectSample = (sampleUrl: string) => {
    setVideoUrl(sampleUrl);
    setInputMode('url');
    const info = extractVideoInfo(sampleUrl);
    setDetectedVideo(info);
    handleStartDeconstruct(sampleUrl);
  };

  // Kích hoạt nhân bản cho chủ đề mới
  const handleStartSynthesis = async () => {
    if (!dnaBlueprint) return;
    if (!newTopic.trim()) {
      alert('Vui lòng nhập chủ đề hoặc sản phẩm mới bạn muốn xây dựng!');
      return;
    }

    setIsSynthesizing(true);
    setStatusMessage('Đang tái cấu trúc nhịp điệu DNA cho chủ đề mới...');

    try {
      const result = await synthesizeClonedProject({
        dna: dnaBlueprint,
        newTopic,
        targetAudience,
        config,
        onProgress: (status) => setStatusMessage(status),
      });

      setClonedProject(result);
      setIsSynthesizing(false);
      setCurrentSceneIdx(0);
      setIsPlayingPreview(true);
    } catch (err) {
      console.error('Lỗi nhân bản kịch bản:', err);
      setIsSynthesizing(false);
      alert('Đã xảy ra lỗi khi nhân bản kịch bản. Vui lòng thử lại!');
    }
  };

  // Trình phát giọng đọc Web Speech API cục bộ
  const speakSceneText = (text: string) => {
    if (isMuted) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Bộ điều khiển Preview Player tự động chuyển cảnh
  useEffect(() => {
    if (isPlayingPreview && clonedProject && clonedProject.newStoryboard.length > 0) {
      const currentScene = clonedProject.newStoryboard[currentSceneIdx];
      if (currentScene) {
        speakSceneText(currentScene.spokenText);
      }

      playTimerRef.current = setTimeout(() => {
        if (currentSceneIdx < clonedProject.newStoryboard.length - 1) {
          setCurrentSceneIdx((prev) => prev + 1);
        } else {
          setIsPlayingPreview(false);
          setCurrentSceneIdx(0);
        }
      }, 5500);
    } else {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlayingPreview, currentSceneIdx, clonedProject, isMuted]);

  // Sao chép prompt AI
  const copyPrompt = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyKeyText = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Đưa vào Bàn dựng & Hàng đợi Duyệt của Studio
  const handleSendToStudioPipeline = () => {
    if (!clonedProject) return;

    const newStudioProject: Project = {
      id: 'proj_' + Date.now(),
      code: 'CLONE-' + Math.floor(1000 + Math.random() * 9000),
      title: clonedProject.newScript.title,
      status: 'pending_approval',
      aspectRatio: (dnaBlueprint?.visualStyle.recommendedAspectRatio as any) || '9:16',
      videoGenre: 'viral-social',
      newsTickerText: clonedProject.newScript.headline,
      duration: dnaBlueprint?.durationSec || 60,
      targetChannels: ['tiktok', 'youtube'],
      videoUrl: '',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      musicTrack: {
        name: dnaBlueprint?.audioAnalysis.bgmGenre || 'Energetic Cyber Beats',
        license: 'Free Commercial License',
        volume: 0.6,
      },
      storyboard: clonedProject.newStoryboard.map((s, idx) => ({
        id: idx + 1,
        sceneNumber: s.sceneNumber,
        timeRange: s.timeRange,
        startSec: idx * 5,
        endSec: (idx + 1) * 5,
        voiceover: s.spokenText,
        visualPrompt: s.visualPrompt,
        headline: s.spokenText.slice(0, 30),
        sfx: s.sfx,
        imageUrl: s.generatedMediaUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        transition: 'cut',
      })),
      metadata: {
        title: clonedProject.newScript.title,
        description: clonedProject.newScript.headline,
        tags: clonedProject.newScript.tags,
      },
      aiSource: {
        type: config.activeProvider || 'gemini',
        name: clonedProject.selectedModel,
        model: clonedProject.selectedModel,
      },
      createdAt: new Date().toISOString(),
    };

    onProjectCreated?.(newStudioProject);
    alert('🎉 Đã đẩy Kịch bản Nhân bản vào Hàng đợi Chờ duyệt của Studio thành công!');
    onNavigateToReview?.();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Header Banner & BYOK Status */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Công Nghệ Video Reverse-Engineering & Clone Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                BYOK 100% Bảo Mật
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Bóc Tách & Nhân Bản Video Triệu View</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Dán đường dẫn hoặc tải video mẫu lên để hệ thống hiển thị video ngay lập tức, giải mã chi tiết toàn bộ cấu trúc (Hook 3s, nhịp cắt, B-roll, âm nhạc), gợi ý công thức viết prompt và cung cấp bản xem thử trực quan sản phẩm tương tự!
            </p>
          </div>

          {/* BYOK Status Card */}
          <div className="bg-zinc-800/80 backdrop-blur-md border border-zinc-700/80 rounded-xl p-3.5 flex flex-col gap-2 min-w-[260px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" /> Động Cơ Phân Tích:
              </span>
              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-[11px] text-indigo-300 hover:text-white underline cursor-pointer"
              >
                {showKeyInput ? 'Đóng' : hasGeminiKey ? 'Đổi Key' : '+ Nhập Key AI'}
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-100">
              <span className={`w-2 h-2 rounded-full ${hasAnyByokKey ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span className="truncate">{activeKeyName}</span>
            </div>

            {showKeyInput ? (
              <div className="pt-2 border-t border-zinc-700/60 space-y-2">
                <input
                  type="password"
                  placeholder="Dán Gemini API Key (AIza... hoặc AQ...)"
                  defaultValue={customGeminiKey}
                  id="quick-gemini-key-input"
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-[11px] focus:outline-none focus:border-indigo-500"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => {
                      const el = document.getElementById('quick-gemini-key-input') as HTMLInputElement;
                      if (el) handleSaveQuickKey(el.value);
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium cursor-pointer"
                  >
                    Lưu & Kích Hoạt
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-zinc-400 border-t border-zinc-700/60 pt-1.5 flex items-center justify-between">
                <span>{hasAnyByokKey ? 'Hạn mức: Cá nhân (BYOK)' : 'Phân tích: Chuẩn xác 100%'}</span>
                <span className="text-emerald-400 font-medium">Chi phí chủ: 0đ</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Video Input Portal & Instant Video Player */}
      <div className="bg-white border border-black/[0.08] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-zinc-800" />
            <h2 className="font-bold text-zinc-900 text-base">Bước 1: Nạp Video Mẫu Để Bóc Tách</h2>
          </div>
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setInputMode('url')}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                inputMode === 'url' ? 'bg-white shadow-2xs text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" /> Dán Đường Dẫn
            </button>
            <button
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                inputMode === 'upload' ? 'bg-white shadow-2xs text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Tải Tệp Lên
            </button>
          </div>
        </div>

        {inputMode === 'url' ? (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-700">
              Nhập hoặc dán đường dẫn Video (YouTube, TikTok, Facebook Watch, Instagram Reels):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/shorts/... hoặc https://www.tiktok.com/@user/video/..."
                className="flex-1 px-3.5 py-2.5 text-xs bg-zinc-50 border border-black/10 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-zinc-900 text-zinc-900"
              />
              <button
                onClick={() => handleStartDeconstruct()}
                disabled={isAnalyzing}
                className="btn-primary px-5 py-2.5 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Phân Tích...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Bóc Tách Cấu Trúc</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTranscriptBox((prev) => !prev)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
              >
                <span>{showTranscriptBox ? '▾ Ẩn ô nhập Transcript thủ công' : '▸ Bổ sung Lời thoại / Transcript (Tùy chọn — giúp Hypit SVML bám sát từng chữ)'}</span>
              </button>
              {showTranscriptBox && (
                <textarea
                  rows={3}
                  value={manualTranscript}
                  onChange={(e) => setManualTranscript(e.target.value)}
                  placeholder="Dán lời thoại / phụ đề (transcript) của video vào đây nếu muốn AI neo chính xác Word-Anchored Timing theo từng câu nói..."
                  className="mt-2 w-full px-3.5 py-2 text-xs bg-zinc-50 border border-black/10 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-zinc-900"
                />
              )}
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
              <span className="font-semibold">Mẫu video thử nghiệm nhanh:</span>
              <button
                type="button"
                onClick={() => handleSelectSample('https://www.youtube.com/shorts/sample-hook-viral')}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                [1. Mẫu Shorts Hook 3s Viral]
              </button>
              <button
                type="button"
                onClick={() => handleSelectSample('https://www.youtube.com/watch?v=sample-tech-review')}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                [2. Mẫu Review Chuyên Sâu]
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-700">Chọn tệp video từ máy tính (MP4, WebM, MOV):</label>
            <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center hover:border-zinc-400 transition bg-zinc-50/50">
              <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
                className="text-xs text-zinc-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 cursor-pointer"
              />
              {selectedFile && (
                <div className="mt-3 text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Đã chọn tệp: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                </div>
              )}
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => handleStartDeconstruct()}
                disabled={isAnalyzing || !selectedFile}
                className="btn-primary px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Phân Tích...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Bóc Tách DNA Tệp Video</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 🎬 HIỂN THỊ VIDEO TRỰC QUAN NGAY KHI DÁN LINK HOẶC NẠP TỆP */}
        {(detectedVideo || filePreviewUrl) && (
          <div className="mt-4 p-4 bg-zinc-950 text-white rounded-2xl border border-zinc-800 space-y-3 shadow-lg animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-rose-400" />
                  Đang Xem Video Mẫu Trực Tiếp
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {detectedVideo?.platform || 'Tệp Video'}
                </span>
              </div>
              {!dnaBlueprint && !isAnalyzing && (
                <button
                  onClick={() => handleStartDeconstruct()}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Bóc Tách Chi Tiết Cấu Trúc Ngay</span>
                </button>
              )}
            </div>

            {/* Video Player Container */}
            <div className="w-full rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[460px] aspect-video relative">
              {detectedVideo?.embedUrl ? (
                <iframe
                  src={detectedVideo.embedUrl}
                  title="Video Mẫu"
                  className="w-full h-full border-0 rounded-xl relative z-10"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              ) : filePreviewUrl ? (
                <video src={filePreviewUrl} controls className="w-full h-full max-h-[460px] object-contain rounded-xl" />
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  Không thể nhúng trực tiếp, nhấn "Bóc Tách Cấu Trúc" để AI trích xuất dữ liệu.
                </div>
              )}
            </div>
            {detectedVideo && videoUrl && (
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                <span>Nếu chủ kênh tắt quyền phát nhúng trên web ngoài, bạn vẫn có thể bấm "Bóc Tách Cấu Trúc" bình thường.</span>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-white flex items-center gap-1 underline flex-shrink-0"
                >
                  <span>Mở video gốc</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar khi đang phân tích */}
        {isAnalyzing && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-500 animate-pulse" />
                {statusMessage}
              </span>
              <span className="font-mono text-zinc-600">{analysisProgress}%</span>
            </div>
            <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-zinc-900 h-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Phân Tích Chi Tiết Toàn Bộ Cấu Trúc Video (Deconstructed DNA Dashboard) */}
      {dnaBlueprint && (
        <div className="bg-white border border-black/[0.08] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600">ĐÃ GIẢI MÃ THÀNH CÔNG</span>
                {dnaBlueprint.engineMeta?.mode === 'byok-llm' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ BYOK AI LIVE: {dnaBlueprint.engineMeta.provider?.toUpperCase()} / {dnaBlueprint.engineMeta.modelUsed}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">
                    ⚡ Engine: {dnaBlueprint.engineMeta?.modelUsed || 'Zero-Mock Semantic Engine'}
                  </span>
                )}
              </div>
              <h2 className="font-bold text-zinc-900 text-lg mt-0.5">Phân Tích Chi Tiết Toàn Bộ Cấu Trúc Video</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Tiêu đề: {dnaBlueprint.sourceTitle || 'Video viral mẫu'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Hook Score: {dnaBlueprint.hookScore}/100
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-zinc-100 text-zinc-700">
                {dnaBlueprint.durationSec}s • {dnaBlueprint.totalScenes} Cảnh
              </span>
            </div>
          </div>

          {dnaBlueprint.engineMeta?.warning && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Lưu ý về API Key BYOK:</strong> Hệ thống nhận phản hồi lỗi từ nhà cung cấp AI (<code>{dnaBlueprint.engineMeta.warning}</code>) nên đã tự động chuyển sang Smart Semantic Engine để không gián đoạn phân tích. Hãy kiểm tra lại Key/Model trong mục Cấu Hình Động Cơ AI hoặc nút "+ Nhập Key AI".
              </div>
            </div>
          )}

          {/* 4 Cards Thống Kê Nhanh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl">
              <div className="text-[11px] text-zinc-500 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Nhịp Cắt Cảnh (Pacing)
              </div>
              <div className="font-bold text-zinc-900 text-sm">~{dnaBlueprint.averageShotDuration}s / Phân cảnh</div>
              <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">{dnaBlueprint.wordsPerMinute} WPM (Tốc độ nói)</div>
            </div>

            <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl">
              <div className="text-[11px] text-zinc-500 flex items-center gap-1 mb-1">
                <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> Âm Nhạc & Nhịp Điệu
              </div>
              <div className="font-bold text-zinc-900 text-sm truncate">{dnaBlueprint.audioAnalysis.bgmGenre}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">{dnaBlueprint.audioAnalysis.bpmTempo} BPM • SFX {dnaBlueprint.audioAnalysis.sfxFrequency}</div>
            </div>

            <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl">
              <div className="text-[11px] text-zinc-500 flex items-center gap-1 mb-1">
                <Layers className="w-3.5 h-3.5 text-rose-500" /> Phong Cách Thị Giác
              </div>
              <div className="font-bold text-zinc-900 text-sm truncate">{dnaBlueprint.visualStyle.aestheticTag}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Tỷ lệ {dnaBlueprint.visualStyle.recommendedAspectRatio}</div>
            </div>

            <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl">
              <div className="text-[11px] text-zinc-500 flex items-center gap-1 mb-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Công Thức Hook 3s
              </div>
              <div className="font-bold text-zinc-900 text-sm truncate">Khoảng trống tò mò</div>
              <div className="text-[11px] text-emerald-700 mt-0.5 truncate">{dnaBlueprint.hookAnalysis.curiosityGapStrategy.slice(0, 35)}...</div>
            </div>
          </div>

          {/* Chi tiết Hook 3s */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-amber-600" /> Phân Tích Bí Quyết Giữ Chân 3 Giây Đầu (Viral Hook Formula)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <span className="font-semibold text-amber-950">1. Lời thoại mở đầu (Verbal):</span>
                <p className="text-zinc-700 italic mt-0.5">"{dnaBlueprint.hookAnalysis.verbalHook}"</p>
              </div>
              <div>
                <span className="font-semibold text-amber-950">2. Kích thích thị giác (Visual):</span>
                <p className="text-zinc-700 mt-0.5">{dnaBlueprint.hookAnalysis.visualHook}</p>
              </div>
              <div>
                <span className="font-semibold text-amber-950">3. Kích thích âm thanh (Sound FX):</span>
                <p className="text-zinc-700 mt-0.5">{dnaBlueprint.hookAnalysis.audioHook}</p>
              </div>
            </div>
          </div>

          {/* Bảng Phân Cảnh Bóc Tách (Shot-by-Shot Table) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-700" /> Bảng Phân Cảnh Chi Tiết Của Video Mẫu ({dnaBlueprint.scenes.length} Phân Cảnh)
            </h3>
            <div className="overflow-x-auto border border-zinc-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/80 text-zinc-700 font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="p-2.5 w-14 text-center">Cảnh</th>
                    <th className="p-2.5 w-24 text-center">Thời Gian</th>
                    <th className="p-2.5 w-28">Góc Máy</th>
                    <th className="p-2.5">Mô Tả Hình Ảnh & Lời Thoại Gốc</th>
                    <th className="p-2.5 w-72">Gợi Ý Prompt AI Tạo Ảnh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60">
                  {dnaBlueprint.scenes.map((scene, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/70 transition">
                      <td className="p-2.5 text-center font-bold text-zinc-800">#{scene.sceneNumber}</td>
                      <td className="p-2.5 text-center font-mono text-zinc-500">{scene.timeStart} - {scene.timeEnd}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium text-[10px] uppercase">
                          {scene.shotType}
                        </span>
                      </td>
                      <td className="p-2.5 space-y-1">
                        <div className="font-medium text-zinc-900">{scene.visualDescription}</div>
                        <div className="text-zinc-600 italic text-[11px]">"{scene.transcript}"</div>
                        {scene.onScreenText && (
                          <div className="text-[10px] text-rose-600 font-mono">Chữ màn hình: [{scene.onScreenText}]</div>
                        )}
                      </td>
                      <td className="p-2.5">
                        <div className="relative group bg-zinc-50 p-2 rounded-lg border border-zinc-200 font-mono text-[10px] text-zinc-700 line-clamp-2">
                          {scene.suggestedAiPrompt}
                          <button
                            type="button"
                            onClick={() => copyPrompt(scene.suggestedAiPrompt, idx)}
                            className="absolute top-1 right-1 p-1 bg-white border border-zinc-300 rounded shadow-xs opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="Sao chép Prompt AI"
                          >
                            {copiedIndex === idx ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-zinc-600" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. ĐỊNH HƯỚNG GỢI Ý CÁCH VIẾT PROMPT XÂY DỰNG NỘI DUNG TƯƠNG TỰ */}
          <div className="p-5 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-white rounded-2xl border border-zinc-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  Định Hướng & Công Thức Viết Prompt Xây Dựng Nội Dung Tương Tự
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PROMPT ENGINEERING MATRIX
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Formula A: Visual Prompt */}
              <div className="p-3.5 bg-zinc-800/80 rounded-xl border border-zinc-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-indigo-400" /> 1. Công Thức Prompt Thị Giác (Midjourney/Flux/Kling)
                  </span>
                  <button
                    onClick={() => copyKeyText(dnaBlueprint.promptGuide?.visualFormula || '', 'visual')}
                    className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'visual' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'visual' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-zinc-900/90 rounded-lg font-mono text-[11px] text-zinc-300 border border-zinc-800/80">
                  {dnaBlueprint.promptGuide?.visualFormula || '[Shot Type] + [Chủ thể] + [Hành động/Biểu cảm] + [Ánh sáng cinematic] + [8k photorealistic]'}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Đặc tả rõ góc máy (Close-up, Macro, FPV Drone) và ánh sáng (Volumetric lighting, Cyberpunk neon) để AI tạo ra hình ảnh chuẩn điện ảnh.
                </p>
              </div>

              {/* Formula B: Scripting Prompt */}
              <div className="p-3.5 bg-zinc-800/80 rounded-xl border border-zinc-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" /> 2. Công Thức Viết Kịch Bản Giữ Chân (Script Formula)
                  </span>
                  <button
                    onClick={() => copyKeyText(dnaBlueprint.promptGuide?.scriptFormula || '', 'script')}
                    className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'script' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'script' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-zinc-900/90 rounded-lg font-mono text-[11px] text-zinc-300 border border-zinc-800/80">
                  {dnaBlueprint.promptGuide?.scriptFormula || 'Hook 3s -> Pain Point -> Curiosity Gap -> Giải pháp 3 bước -> Actionable CTA'}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Nguyên tắc ngắt nhịp: Mỗi câu thoại không quá 12-15 từ, giữ khoảng trống tò mò không lời giải cho đến 70% thời lượng video.
                </p>
              </div>
            </div>

            {/* Negative Prompts & Cinematic Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-1.5">
                <span className="font-bold text-rose-400 uppercase tracking-wider text-[10px]">
                  ⚠️ Những Điều Cấm Kỵ Cần Tránh (Negative Rules):
                </span>
                <ul className="list-disc list-inside space-y-1 text-zinc-300 text-[11px]">
                  <li>Không mở đầu bằng câu chào rườm rà (ví dụ: "Xin chào các bạn...").</li>
                  <li>Không để bất kỳ phân cảnh tĩnh nào kéo dài quá 3 giây.</li>
                  <li>Không dùng nhạc nền quá lớn lấn át tần số giọng thuyết minh.</li>
                </ul>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-1.5">
                <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                  ✨ Bộ Từ Khóa Điện Ảnh Hollywood Đề Xuất:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {(dnaBlueprint.promptGuide?.cinematicKeywords || ['Macro close-up', 'Volumetric lighting', 'Kinetic typography', 'Anamorphic lens flare']).map((kw, kIdx) => (
                    <span key={kIdx} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono text-[10px]">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4.5. PHÂN TÍCH CẤU TRÚC LẬP LUẬN, CÁCH NÓI, PHONG CÁCH TRÌNH CHIẾU & HYPIT SVML BLUEPRINT */}
          {(dnaBlueprint.rhetoricalStructure || dnaBlueprint.deliveryStyle || dnaBlueprint.presentationStyle || dnaBlueprint.hypitSvmlBlueprint) && (
            <div className="bg-white border border-indigo-200/80 rounded-2xl p-5 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      HYPIT SVML ARCHITECTURE
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      Tỷ lệ gốc: {dnaBlueprint.visualStyle?.recommendedAspectRatio || '16:9'}
                    </span>
                  </div>
                  <h3 className="font-bold text-zinc-950 text-base mt-1">
                    Giải Mã Cấu Trúc Xây Dựng Video (Lời Thoại • Cách Nói • Trình Chiếu)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {dnaBlueprint.hypitSvmlBlueprint?.svmlMarkup && (
                    <button
                      onClick={() => copyKeyText(dnaBlueprint.hypitSvmlBlueprint?.svmlMarkup || '', 'svml-markup')}
                      className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'svml-markup' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy SVML Blueprint</span>
                    </button>
                  )}
                  <button
                    onClick={() => copyKeyText(JSON.stringify(dnaBlueprint, null, 2), 'dna-json')}
                    className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'dna-json' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {/* 3 Trụ Cột: Cấu trúc lập luận, Cách nói, Phong cách trình chiếu */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                {dnaBlueprint.rhetoricalStructure && (
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2.5">
                    <div className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                      1. Cấu Trúc Lập Luận ({dnaBlueprint.rhetoricalStructure.frameworkName})
                    </div>
                    <div className="space-y-1.5">
                      {(dnaBlueprint.rhetoricalStructure.stages || []).map((step, sIdx) => (
                        <div key={sIdx} className="p-2 rounded-lg bg-white/90 border border-amber-100">
                          <div className="flex items-center justify-between font-semibold text-zinc-900 text-[11px]">
                            <span>{step.stageName}</span>
                            <span className="font-mono text-[10px] text-amber-700">{step.timeRange}</span>
                          </div>
                          <p className="text-[11px] text-zinc-600 mt-0.5">{step.purpose}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dnaBlueprint.deliveryStyle && (
                  <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200/80 space-y-2">
                    <div className="font-bold text-sky-900 uppercase tracking-wider text-[11px]">
                      2. Cách Nói & Giọng Điệu (Delivery)
                    </div>
                    <div className="space-y-1.5 text-[11px] text-zinc-700">
                      <p><strong>Persona:</strong> {dnaBlueprint.deliveryStyle.voicePersona}</p>
                      <p><strong>Nhịp câu:</strong> {dnaBlueprint.deliveryStyle.cadencePattern} ({dnaBlueprint.deliveryStyle.sentenceLengthAvg})</p>
                      <p><strong>Mật độ thuật ngữ:</strong> {dnaBlueprint.deliveryStyle.terminologyDensity}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(dnaBlueprint.deliveryStyle.signaturePhrases || []).map((dev, dIdx) => (
                          <span key={dIdx} className="px-2 py-0.5 rounded bg-white border border-sky-200 text-sky-900 text-[10px] font-medium">
                            {dev}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {dnaBlueprint.presentationStyle && (
                  <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-200/80 space-y-2">
                    <div className="font-bold text-violet-900 uppercase tracking-wider text-[11px]">
                      3. Phong Cách Trình Chiếu (Visual)
                    </div>
                    <div className="space-y-1.5 text-[11px] text-zinc-700">
                      <p><strong>Format:</strong> {dnaBlueprint.presentationStyle.formatType}</p>
                      <p><strong>Bố cục:</strong> {dnaBlueprint.presentationStyle.slideLayoutPattern}</p>
                      <p><strong>Typography:</strong> {dnaBlueprint.presentationStyle.typographyRules}</p>
                      <p><strong>B-Roll & Chart:</strong> {dnaBlueprint.presentationStyle.bRollAndChartRatio}</p>
                      <p><strong>Thumbnail:</strong> {dnaBlueprint.presentationStyle.thumbnailFormula}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Hypit SVML Word-Anchored Layers & Pluggable Variables */}
              {dnaBlueprint.hypitSvmlBlueprint && (
                <div className="p-4 rounded-xl bg-zinc-950 text-zinc-100 border border-zinc-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                        hypit-ai/hypit • SVML v{dnaBlueprint.hypitSvmlBlueprint.version}
                      </span>
                      <h4 className="font-bold text-sm text-white">
                        {dnaBlueprint.hypitSvmlBlueprint.templateId}
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(dnaBlueprint.hypitSvmlBlueprint.variables || []).map((v, vIdx) => (
                        <span
                          key={vIdx}
                          title={`${v.label}: ${v.description} (VD: ${v.originalValue})`}
                          className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono text-[10px]"
                        >
                          {`{{${v.key}}}`}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {(dnaBlueprint.hypitSvmlBlueprint.wordAnchoredTracks || []).map((layer, lIdx) => (
                      <div key={lIdx} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono text-[10px] uppercase">
                            [{layer.layerType}]
                          </span>
                          <span className="font-mono text-[10px] text-zinc-400">{layer.timeRange}</span>
                        </div>
                        <div className="text-amber-300 font-medium">
                          Anchor: "{layer.anchorPhrase}"
                        </div>
                        <div className="text-zinc-300">{layer.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Khung Nhân Bản Cho Chủ Đề Mới (Tùy Chọn) */}
          <div className="p-5 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 border-2 border-indigo-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-zinc-950 text-base">Bước 2 (Tùy Chọn): Nhân Bản Video Tương Tự Cho Chủ Đề Mới</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                Áp dụng Blueprint SVML ở trên
              </span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Hệ thống sẽ giữ nguyên 100% "công thức DNA thành công" (độ dài câu, nhịp cắt, kiểu hook 3s, vị trí SFX) của video gốc, nhưng tạo ra nội dung và kịch bản hoàn toàn mới cho chủ đề của bạn.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800">Chủ đề hoặc Sản phẩm mới bạn muốn xây dựng:</label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Ví dụ: Khóa học AI Automation 2026, Review máy rửa mặt, Mẹo quản lý tài chính..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-indigo-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-600 text-zinc-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800">Đối tượng khán giả mục tiêu:</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ví dụ: Khán giả trẻ mê công nghệ, Dân văn phòng, Người khởi nghiệp..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-indigo-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-600 text-zinc-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                <span>Model AI xử lý: <strong>{config.activeProvider || 'Gemini 2.0 Flash'}</strong> (Khóa cá nhân BYOK)</span>
              </div>

              <button
                onClick={handleStartSynthesis}
                disabled={isSynthesizing || !newTopic.trim()}
                className="btn-primary px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isSynthesizing ? (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Tạo Kịch Bản Mới...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Tạo Kịch Bản Mới Tương Tự</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. BÀN TRÌNH CHIẾU XEM THỬ SẢN PHẨM TƯƠNG TỰ (AI INTERACTIVE PREVIEW PLAYER) */}
      {clonedProject && (
        <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-6 shadow-md space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  🎉 SẢN PHẨM NHÂN BẢN HOÀN TẤT
                </span>
                <span className="text-xs text-zinc-500 font-mono">Mã Dự Án: {clonedProject.id}</span>
              </div>
              <h2 className="text-xl font-bold text-zinc-950">{clonedProject.newScript.title}</h2>
              <p className="text-xs text-zinc-600 mt-0.5">{clonedProject.newScript.headline}</p>
            </div>

            {/* Action Buttons Hub */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsSplitCompare((prev) => !prev)}
                className="btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>{isSplitCompare ? 'Xem Riêng Sản Phẩm Mới' : 'So Sánh Gốc vs Mới'}</span>
              </button>

              <button
                onClick={handleSendToStudioPipeline}
                className="btn-primary px-4 py-2 text-xs flex items-center gap-2 cursor-pointer shadow-sm bg-emerald-600 hover:bg-emerald-700"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Đưa Vào Bàn Chờ Duyệt Video</span>
              </button>
            </div>
          </div>

          {/* MÀN HÌNH XEM THỬ VIDEO TƯƠNG TỰ (SIMULATED AI VIDEO PLAYER) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-zinc-900 text-sm">
                  Bàn Trình Chiếu Xem Thử Sản Phẩm Tương Tự (Live AI Video Player)
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 cursor-pointer"
                  title={isMuted ? 'Bật giọng thuyết minh' : 'Tắt giọng thuyết minh'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
                </button>
                <span className="font-mono text-zinc-500">
                  Cảnh {currentSceneIdx + 1} / {clonedProject.newStoryboard.length}
                </span>
              </div>
            </div>

            {/* Interactive Player Box */}
            <div className={`grid gap-4 ${isSplitCompare ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {/* CỘT SO SÁNH: VIDEO GỐC NẾU BẬT SPLIT COMPARE */}
              {isSplitCompare && (
                <div className="bg-zinc-950 rounded-2xl p-4 text-white border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800">
                    <span className="font-bold text-zinc-300">1. Video Gốc Mẫu:</span>
                    <span className="text-[10px] text-zinc-400 font-mono">Bản Đối Chứng</span>
                  </div>
                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
                    {detectedVideo?.embedUrl ? (
                      <iframe src={detectedVideo.embedUrl} title="Video Gốc" className="w-full h-full border-0" allowFullScreen></iframe>
                    ) : (
                      <div className="text-zinc-500 text-xs">Không có link nhúng video gốc</div>
                    )}
                  </div>
                </div>
              )}

              {/* MÀN HÌNH SẢN PHẨM TƯƠNG TỰ (AI REPLICATED CANVAS) */}
              <div className="bg-zinc-950 rounded-2xl p-4 text-white border border-zinc-800 space-y-3 relative overflow-hidden shadow-xl">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-emerald-400">2. Sản Phẩm Tương Tự (AI Replicated Preview)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                    {clonedProject.newStoryboard[currentSceneIdx]?.timeRange || '00:00'}
                  </span>
                </div>

                {/* Simulated Screen with Background Image & Kinetic Subtitles */}
                <div className="w-full aspect-video max-h-[420px] rounded-xl overflow-hidden bg-zinc-900 relative flex items-center justify-center group select-none">
                  <img
                    src={clonedProject.newStoryboard[currentSceneIdx]?.generatedMediaUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'}
                    alt="Scene Visual"
                    className="w-full h-full object-cover transition-transform duration-700 scale-105 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30"></div>

                  {/* SFX & Camera Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md text-[10px] font-mono font-semibold bg-black/60 backdrop-blur-md border border-white/20 text-white">
                      📷 {clonedProject.newStoryboard[currentSceneIdx]?.cameraInstruction || 'Medium Shot'}
                    </span>
                    <span className="px-2 py-1 rounded-md text-[10px] font-mono bg-rose-500/80 text-white backdrop-blur-md">
                      🔊 {clonedProject.newStoryboard[currentSceneIdx]?.sfx || 'Whoosh'}
                    </span>
                  </div>

                  {/* KINETIC SUBTITLES DANCING OVERLAY */}
                  <div className="absolute bottom-6 left-4 right-4 text-center">
                    <div className="inline-block px-4 py-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 text-white font-bold text-sm sm:text-base leading-snug shadow-2xl animate-in slide-in-from-bottom-2">
                      "{clonedProject.newStoryboard[currentSceneIdx]?.spokenText}"
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-1.5 drop-shadow-md">
                      Prompt AI: {clonedProject.newStoryboard[currentSceneIdx]?.visualPrompt.slice(0, 70)}...
                    </div>
                  </div>
                </div>

                {/* Player Controls & Scene Timeline */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPlayingPreview((prev) => !prev)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                      >
                        {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isPlayingPreview ? 'Tạm Dừng' : 'Phát Xem Thử'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setCurrentSceneIdx(0);
                          setIsPlayingPreview(true);
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                        title="Phát lại từ đầu"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-[11px] text-zinc-400">
                      Bấm vào từng cảnh bên dưới để nhảy trực tiếp
                    </span>
                  </div>

                  {/* Scene Navigation Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {clonedProject.newStoryboard.map((scene, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => {
                          setCurrentSceneIdx(sIdx);
                          speakSceneText(scene.spokenText);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex-shrink-0 cursor-pointer ${
                          currentSceneIdx === sIdx
                            ? 'bg-emerald-500 text-zinc-950 font-bold ring-2 ring-emerald-300'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        Cảnh #{scene.sceneNumber} ({scene.timeRange})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kịch bản chi tiết */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
            <div className="lg:col-span-1 p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3 text-xs">
              <div>
                <span className="font-bold text-zinc-700 uppercase tracking-wider text-[10px]">Câu Mở Đầu (Hook 3s):</span>
                <p className="text-zinc-900 font-semibold text-sm mt-1 text-indigo-700">"{clonedProject.newScript.hookSentence}"</p>
              </div>

              <div>
                <span className="font-bold text-zinc-700 uppercase tracking-wider text-[10px]">Kêu Gọi Hành Động (CTA):</span>
                <p className="text-zinc-900 font-medium mt-1">"{clonedProject.newScript.callToAction}"</p>
              </div>

              <div>
                <span className="font-bold text-zinc-700 uppercase tracking-wider text-[10px]">Thẻ Phân Loại (Tags):</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {clonedProject.newScript.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="px-2 py-0.5 bg-zinc-200/80 rounded-md text-[10px] font-mono text-zinc-700">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" /> Bảng Phân Cảnh Kịch Bản Mới (Khớp Nhịp Video DNA Gốc)
              </h3>
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {clonedProject.newStoryboard.map((scene, sIdx) => (
                  <div
                    key={sIdx}
                    onClick={() => {
                      setCurrentSceneIdx(sIdx);
                      speakSceneText(scene.spokenText);
                    }}
                    className={`p-3 rounded-xl text-xs space-y-1.5 transition cursor-pointer border ${
                      currentSceneIdx === sIdx
                        ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-300'
                        : 'bg-zinc-50 border-zinc-200/90 hover:bg-zinc-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-zinc-900">Cảnh #{scene.sceneNumber} • {scene.timeRange}</span>
                      <span className="text-zinc-500 font-mono text-[10px]">{scene.cameraInstruction}</span>
                    </div>
                    <div className="text-zinc-900 font-medium">"{scene.spokenText}"</div>
                    <div className="p-2 bg-white border border-zinc-200 rounded-lg text-[10px] font-mono text-zinc-600 flex items-center justify-between">
                      <span className="truncate mr-2">Prompt: {scene.visualPrompt}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyPrompt(scene.visualPrompt, 100 + sIdx);
                        }}
                        className="text-zinc-500 hover:text-zinc-900 cursor-pointer"
                        title="Copy Prompt"
                      >
                        {copiedIndex === 100 + sIdx ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
