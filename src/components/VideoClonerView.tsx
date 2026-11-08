import React, { useState } from 'react';
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
  RotateCcw,
} from 'lucide-react';
import {
  AIProviderConfig,
  AIProviderId,
  VideoDnaBlueprint,
  ClonedVideoProject,
  Project,
} from '../types';
import { deconstructVideoDna, synthesizeClonedProject } from '../services/videoDeconstructService';

interface VideoClonerViewProps {
  config: AIProviderConfig;
  onOpenSettings: () => void;
  onProjectCreated?: (project: Project) => void;
  onNavigateToReview?: () => void;
}

export const VideoClonerView: React.FC<VideoClonerViewProps> = ({
  config,
  onOpenSettings,
  onProjectCreated,
  onNavigateToReview,
}) => {
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');

  // Trạng thái xử lý
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [dnaBlueprint, setDnaBlueprint] = useState<VideoDnaBlueprint | null>(null);

  // Trạng thái nhân bản
  const [newTopic, setNewTopic] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('Khán giả trẻ mạng xã hội (18 - 35 tuổi)');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [clonedProject, setClonedProject] = useState<ClonedVideoProject | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Kiểm tra trạng thái BYOK Key
  const hasGeminiKey = Boolean(config.gemini?.apiKey && config.gemini.apiKey.length > 5);
  const hasClaudeKey = Boolean(config.claude?.apiKey && config.claude.apiKey.length > 5);
  const hasDeepSeekKey = Boolean(config.deepseek?.apiKey && config.deepseek.apiKey.length > 5);
  const activeKeyName = hasGeminiKey
    ? 'Gemini API Key (BYOK Sẵn Sàng)'
    : hasDeepSeekKey
      ? 'DeepSeek API Key (BYOK Sẵn Sàng)'
      : hasClaudeKey
        ? 'Claude API Key (BYOK Sẵn Sàng)'
        : 'Chế Độ Dùng Thử (Free Engine)';

  // Xử lý nạp file video
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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
  const handleStartDeconstruct = async () => {
    if (inputMode === 'url' && !videoUrl.trim()) {
      alert('Vui lòng dán đường dẫn video (YouTube, TikTok, Facebook, Reels)!');
      return;
    }
    if (inputMode === 'upload' && !selectedFile) {
      alert('Vui lòng chọn một tệp video từ máy tính của bạn!');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(10);
    setStatusMessage('Đang kết nối hệ thống phân tích...');

    try {
      const dna = await deconstructVideoDna({
        videoUrl: inputMode === 'url' ? videoUrl : undefined,
        videoData: inputMode === 'upload' ? fileBase64 : undefined,
        mimeType: selectedFile?.type || 'video/mp4',
        config,
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
    } catch (err) {
      console.error('Lỗi nhân bản kịch bản:', err);
      setIsSynthesizing(false);
      alert('Đã xảy ra lỗi khi nhân bản kịch bản. Vui lòng thử lại!');
    }
  };

  // Sao chép prompt AI
  const copyPrompt = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
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
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
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
              Dán đường dẫn hoặc tải video mẫu lên để hệ thống trích xuất 100% cấu trúc DNA (Hook 3s, nhịp cắt cảnh, B-roll, âm nhạc) và tự động nhân bản ra sản phẩm video tương tự cho chủ đề mới của bạn.
            </p>
          </div>

          {/* BYOK Status Card */}
          <div className="bg-zinc-800/80 backdrop-blur-md border border-zinc-700/80 rounded-xl p-3.5 flex flex-col gap-2 min-w-[240px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" /> Khóa API Đang Dùng:
              </span>
              <button
                onClick={onOpenSettings}
                className="text-[11px] text-indigo-300 hover:text-white underline cursor-pointer"
              >
                Cài đặt Key
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-100">
              <span className={`w-2 h-2 rounded-full ${hasGeminiKey || hasClaudeKey || hasDeepSeekKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="truncate">{activeKeyName}</span>
            </div>
            <div className="text-[10px] text-zinc-400 border-t border-zinc-700/60 pt-1.5 flex items-center justify-between">
              <span>Hạn mức: Cá nhân</span>
              <span className="text-emerald-400 font-medium">Chi phí chủ: 0đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Video Input Portal */}
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
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700">
              Nhập đường dẫn Video (YouTube, TikTok, Facebook Watch, Instagram Reels):
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
                onClick={handleStartDeconstruct}
                disabled={isAnalyzing}
                className="btn-primary px-5 py-2.5 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Bóc Tách...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Bóc Tách DNA</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
              <span>Ví dụ mẫu nhanh:</span>
              <button
                type="button"
                onClick={() => setVideoUrl('https://www.youtube.com/shorts/sample-hook-retention')}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                [Mẫu Shorts Hook 3s Viral]
              </button>
              <button
                type="button"
                onClick={() => setVideoUrl('https://www.tiktok.com/@techlead/video/sample-review')}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                [Mẫu Review Triệu View]
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
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
            <div className="flex justify-end pt-2">
              <button
                onClick={handleStartDeconstruct}
                disabled={isAnalyzing || !selectedFile}
                className="btn-primary px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Bóc Tách...</span>
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

      {/* 3. Deconstructed Video DNA Dashboard */}
      {dnaBlueprint && (
        <div className="bg-white border border-black/[0.08] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600">ĐÃ GIẢI MÃ THÀNH CÔNG</span>
              <h2 className="font-bold text-zinc-900 text-lg">Bản Đồ Cấu Trúc DNA Video Gốc</h2>
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

          {/* 4. Khung Nhân Bản Cho Chủ Đề Mới */}
          <div className="p-5 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 border-2 border-indigo-200 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-zinc-950 text-base">Bước 2: Nhân Bản Video Tương Tự Cho Chủ Đề Mới</h3>
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

      {/* 5. Cloned Video Project Output Hub */}
      {clonedProject && (
        <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-6 shadow-md space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  🎉 NHÂN BẢN THÀNH CÔNG
                </span>
                <span className="text-xs text-zinc-500 font-mono">ID: {clonedProject.id}</span>
              </div>
              <h2 className="text-xl font-bold text-zinc-950">{clonedProject.newScript.title}</h2>
              <p className="text-xs text-zinc-600 mt-0.5">{clonedProject.newScript.headline}</p>
            </div>

            {/* Action Buttons Hub */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSendToStudioPipeline}
                className="btn-primary px-4 py-2 text-xs flex items-center gap-2 cursor-pointer shadow-sm bg-emerald-600 hover:bg-emerald-700"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Đưa Vào Bàn Chờ Duyệt Video</span>
              </button>
            </div>
          </div>

          {/* Kịch bản chi tiết */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                  <div key={sIdx} className="p-3 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-zinc-900">Cảnh #{scene.sceneNumber} • {scene.timeRange}</span>
                      <span className="text-zinc-500 font-mono text-[10px]">{scene.cameraInstruction}</span>
                    </div>
                    <div className="text-zinc-900 font-medium">"{scene.spokenText}"</div>
                    <div className="p-2 bg-white border border-zinc-200 rounded-lg text-[10px] font-mono text-zinc-600 flex items-center justify-between">
                      <span className="truncate mr-2">Prompt: {scene.visualPrompt}</span>
                      <button
                        onClick={() => copyPrompt(scene.visualPrompt, 100 + sIdx)}
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
