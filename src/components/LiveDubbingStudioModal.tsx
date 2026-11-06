import React, { useState, useEffect, useRef } from 'react';
import { StoryboardScene, Project } from '../types';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  RotateCcw,
  Check,
  X,
  Volume2,
  MonitorPlay,
  FileText,
  AlertCircle,
  Sparkles,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface LiveDubbingStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  scene: StoryboardScene;
  aspectRatio: '16:9' | '9:16';
  onSaveRecordedVoice: (sceneId: number, audioBlobUrl: string, durationSec: number, updatedText: string) => void;
}

export const LiveDubbingStudioModal: React.FC<LiveDubbingStudioModalProps> = ({
  isOpen,
  onClose,
  project,
  scene,
  aspectRatio,
  onSaveRecordedVoice,
}) => {
  if (!isOpen) return null;

  const [scriptText, setScriptText] = useState<string>(scene.voiceover);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(scene.customAudioUrl || null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState<boolean>(false);
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);

  // Video playback sync state
  const [videoPlayTime, setVideoPlayTime] = useState<number>(0);
  const sceneDuration = Math.max(3, scene.endSec - scene.startSec);

  // Refs for media recording and Web Audio metering
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recordTimerRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Microphone on mount
  useEffect(() => {
    let isMounted = true;

    async function initMic() {
      try {
        setMicError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        audioStreamRef.current = stream;

        // Setup VU Meter Analyser
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          src.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateMeter = () => {
            if (!isMounted) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setMicVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        }
      } catch (err: any) {
        console.warn('Microphone error:', err);
        setMicError('Không thể truy cập Microphone. Vui lòng cấp quyền micro trên trình duyệt của bạn.');
      }
    }

    initMic();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Video loop while recording or previewing
  useEffect(() => {
    let timer: any;
    if (isRecording || isPlayingRecorded) {
      const stepMs = 50;
      timer = setInterval(() => {
        setVideoPlayTime((prev) => {
          const next = prev + stepMs / 1000;
          if (next >= sceneDuration) {
            return 0; // loop
          }
          return next;
        });
      }, stepMs);
    } else {
      setVideoPlayTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording, isPlayingRecorded, sceneDuration]);

  // Start Countdown then Record
  const handleStartRecordingCountdown = () => {
    if (!audioStreamRef.current) {
      alert('Chưa nhận được tín hiệu Microphone. Vui lòng kiểm tra quyền truy cập micro.');
      return;
    }

    setCountdown(3);
    const countTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countTimer);
          startActualRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startActualRecording = () => {
    if (!audioStreamRef.current) return;
    audioChunksRef.current = [];

    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(audioStreamRef.current, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setRecordedBlobUrl(url);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      setVideoPlayTime(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (e: any) {
      alert('Lỗi khởi động bộ ghi âm: ' + e?.message);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
  };

  const handleTogglePlayRecorded = () => {
    if (!recordedBlobUrl) return;

    if (isPlayingRecorded) {
      previewAudioRef.current?.pause();
      setIsPlayingRecorded(false);
      return;
    }

    const audio = new Audio(recordedBlobUrl);
    previewAudioRef.current = audio;
    audio.onended = () => setIsPlayingRecorded(false);
    audio.onerror = () => setIsPlayingRecorded(false);
    audio.play();
    setIsPlayingRecorded(true);
  };

  const handleSaveAndApply = () => {
    if (!recordedBlobUrl) {
      alert('Bạn chưa thực hiện thu âm bản ghi nào.');
      return;
    }
    onSaveRecordedVoice(scene.id, recordedBlobUrl, recordingSeconds || sceneDuration, scriptText);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200"
      onClick={(e) => !isRecording && e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-950 text-white rounded-2xl max-w-4xl w-full shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-md animate-pulse">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Cửa Sổ Phòng Thu Âm Trực Tiếp (Live Dubbing Studio)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
                  CỬA SỔ THỨ 3 • LIVE MONITOR
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Quan sát video đang dựng trong thời gian thực để lồng tiếng chuẩn xác đến từng giây
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isRecording}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-30 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Split Grid: Live Monitor (Left) & Teleprompter / Mic Deck (Right) */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto">
          {/* LEFT: LIVE VIDEO MONITOR (CỬA SỔ THỨ 3) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <MonitorPlay className="w-4 h-4 text-emerald-400" />
                <span>Màn Hình Giám Sát Cảnh {scene.sceneNumber}</span>
              </span>
              <span className="font-mono text-zinc-400 text-[11px] bg-zinc-900 px-2 py-0.5 rounded border border-white/10">
                {scene.timeRange}
              </span>
            </div>

            {/* Video Preview Box */}
            <div
              className={`w-full bg-zinc-900 rounded-xl overflow-hidden relative border border-white/10 shadow-lg flex items-center justify-center ${
                aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16] max-h-[360px]'
              }`}
            >
              <img
                src={scene.imageUrl || scene.customMediaUrl}
                alt="Scene Preview"
                className="w-full h-full object-cover transition-transform duration-300"
                style={{
                  transform: isRecording || isPlayingRecorded ? 'scale(1.08)' : 'scale(1.0)',
                }}
              />

              {/* On-screen Telemetry Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 p-3 flex flex-col justify-between pointer-events-none">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-zinc-950/80 text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    SYNC LIVE
                  </span>
                  <span className="text-[11px] font-mono font-bold text-white bg-black/60 px-1.5 py-0.2 rounded">
                    {videoPlayTime.toFixed(1)}s / {sceneDuration}s
                  </span>
                </div>

                {/* Subtitle in video monitor */}
                <div className="bg-black/70 backdrop-blur-xs p-2 rounded-lg text-center text-xs text-white font-medium border border-white/10">
                  "{scriptText.slice(0, 65)}..."
                </div>
              </div>

              {/* Countdown overlay 3-2-1 */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-rose-600 text-white font-black text-4xl flex items-center justify-center shadow-2xl animate-bounce">
                    {countdown}
                  </div>
                </div>
              )}
            </div>

            {/* Progress sync bar */}
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-75"
                style={{ width: `${(videoPlayTime / sceneDuration) * 100}%` }}
              />
            </div>
          </div>

          {/* RIGHT: TELEPROMPTER & LIVE MICROPHONE RECORDER */}
          <div className="lg:col-span-7 space-y-4">
            {/* Teleprompter Script Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Lời Thoại Nhắc Vở (Teleprompter)</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {scriptText.split(/\s+/).filter(Boolean).length} từ • ~{sceneDuration}s
                </span>
              </div>
              <textarea
                rows={4}
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                disabled={isRecording}
                placeholder="Nhập hoặc chỉnh sửa lời thoại bạn chuẩn bị đọc..."
                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-zinc-100 font-medium focus:outline-none focus:border-indigo-500 leading-relaxed disabled:opacity-60"
              />
            </div>

            {/* Mic Meter & VU Status */}
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tín Hiệu Microphone:</span>
                </span>
                <span className="font-mono text-[11px] text-zinc-400">
                  {micError ? 'Chưa kết nối' : `Đang nhận diện: ${micVolumeLevel}%`}
                </span>
              </div>

              {/* Dynamic VU Meter Bar */}
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500"
                  style={{ width: `${micVolumeLevel}%` }}
                />
              </div>

              {micError && (
                <div className="p-2 rounded bg-rose-950/70 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{micError}</span>
                </div>
              )}
            </div>

            {/* Recording Controls Deck */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartRecordingCountdown}
                    disabled={countdown !== null}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    <Mic className="w-4 h-4" />
                    <span>{recordedBlobUrl ? 'Thu Âm Lại' : 'Bắt Đầu Thu Âm (Mic)'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-zinc-950" />
                    <span>Dừng Thu Âm ({recordingSeconds}s)</span>
                  </button>
                )}

                {/* If recorded, allow playback */}
                {recordedBlobUrl && !isRecording && (
                  <button
                    type="button"
                    onClick={handleTogglePlayRecorded}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer border border-white/10"
                  >
                    {isPlayingRecorded ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                    <span>{isPlayingRecorded ? 'Tạm Dừng' : 'Nghe Lại Bản Thu'}</span>
                  </button>
                )}
              </div>

              {/* Status info */}
              <div className="text-right text-[11px] text-zinc-400 font-mono">
                {isRecording ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    Đang ghi âm: {recordingSeconds}s
                  </span>
                ) : recordedBlobUrl ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã có bản thu sẵn sàng
                  </span>
                ) : (
                  <span>Sẵn sàng ghi âm giọng của bạn</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-zinc-900/90 flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-mono text-[11px]">
            Cảnh {scene.sceneNumber}: {scene.headline || 'Không có tiêu đề'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isRecording}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition cursor-pointer disabled:opacity-40"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              disabled={!recordedBlobUrl || isRecording}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              <span>Áp Dụng Lồng Tiếng Này Vào Cảnh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
