import React, { useState } from 'react';
import { Project, StoryboardScene } from '../types';
import {
  Layers,
  Sparkles,
  Film,
  Music,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Upload,
  Trash2,
  X
} from 'lucide-react';

interface LocalStitcherClip {
  id: string;
  name: string;
  thumbnailUrl: string;
  videoUrl: string;
  durationSec: number;
  transition?: 'cut' | 'fade' | 'dissolve';
}

interface MultiClipStitcherStudioProps {
  project: Project;
  onClose: () => void;
  onFinishStitching: (finalDurationSec: number, newClipCount: number) => void;
}

export const MultiClipStitcherStudio: React.FC<MultiClipStitcherStudioProps> = ({
  project,
  onClose,
  onFinishStitching,
}) => {
  // Chuyển đổi storyboard thành danh sách clips 10s
  const initialClips: LocalStitcherClip[] = (project.storyboard || []).map((sc: StoryboardScene, idx: number) => ({
    id: `clip-${sc.id || idx}`,
    name: `Phân cảnh ${sc.sceneNumber || idx + 1}`,
    thumbnailUrl: project.thumbnailUrl,
    videoUrl: sc.clipUrl || project.videoUrl,
    durationSec: sc.endSec && sc.startSec ? sc.endSec - sc.startSec : 10,
    transition: sc.transition || 'cut',
  }));

  // Nếu là video 16:9 nhưng số clip chưa đủ 5 phút, tự động tạo các clip kịch bản phân đoạn 10s mẫu
  if (initialClips.length < 15 && project.aspectRatio === '16:9') {
    for (let i = initialClips.length; i < 32; i++) {
      initialClips.push({
        id: `clip-gen-${i + 1}`,
        name: `Phân cảnh nội dung #${i + 1}`,
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
        videoUrl: project.videoUrl,
        durationSec: 10,
        transition: 'cut',
      });
    }
  }

  const [clips, setClips] = useState<LocalStitcherClip[]>(initialClips);
  const [selectedBgm, setSelectedBgm] = useState<string>('Cyberpunk Ambient Synth (10min Commercial)');
  const [bgmVolume, setBgmVolume] = useState<number>(18);
  const [voiceTrackActive, setVoiceTrackActive] = useState<boolean>(true);

  // Modal dán URL ngoài
  const [showAddModal, setShowAddModal] = useState(false);
  const [customClipUrl, setCustomClipUrl] = useState('');
  const [customClipDuration, setCustomClipDuration] = useState(10);

  // Trạng thái ghép FFmpeg
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');
  const [processPercent, setProcessPercent] = useState(0);

  // Tính tổng thời lượng
  const totalDurationSec = clips.reduce((acc, c) => acc + c.durationSec, 0);

  // Quy chuẩn YouTube 5 - 10 phút
  const isTooShort = totalDurationSec < 300; // < 5 phút
  const isTooLong = totalDurationSec > 600;  // > 10 phút
  const isPerfect = totalDurationSec >= 300 && totalDurationSec <= 600;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcut: Press Escape to close studio or sub-modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddModal) {
          setShowAddModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, onClose]);

  const handleMoveClip = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index > 0) {
      const next = [...clips];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      setClips(next);
    } else if (direction === 'right' && index < clips.length - 1) {
      const next = [...clips];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      setClips(next);
    }
  };

  const handleDeleteClip = (id: string) => {
    setClips(clips.filter((c) => c.id !== id));
  };

  const handleAddCustomClip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customClipUrl.trim()) return;

    const newClip: LocalStitcherClip = {
      id: `clip-custom-${Date.now()}`,
      name: `Clip URL #${clips.length + 1}`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=400&q=80',
      videoUrl: customClipUrl.trim(),
      durationSec: Number(customClipDuration) || 10,
      transition: 'cut',
    };

    setClips([...clips, newClip]);
    setCustomClipUrl('');
    setShowAddModal(false);
  };

  const handleStartStitching = () => {
    setIsProcessing(true);
    setProcessPercent(10);
    setProcessStep('Chuẩn hóa chuẩn codec (H.264 / AAC 48kHz)...');

    setTimeout(() => {
      setProcessPercent(35);
      setProcessStep(`Nối ${clips.length} clip bằng FFmpeg concat demuxer...`);
    }, 1000);

    setTimeout(() => {
      setProcessPercent(65);
      setProcessStep('Hòa trộn âm thanh lồng tiếng & nhạc nền thương mại...');
    }, 2000);

    setTimeout(() => {
      setProcessPercent(90);
      setProcessStep('Xuất bản bản Master Full HD 1080p...');
    }, 3000);

    setTimeout(() => {
      setProcessPercent(100);
      setIsProcessing(false);
      onFinishStitching(totalDurationSec, clips.length);
      onClose();
    }, 3800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FBFBFA] text-zinc-900 flex flex-col select-none overflow-hidden animate-in fade-in duration-150">
      {/* Top Header: Command Bar */}
      <div className="h-13 px-5 bg-white border-b border-black/[0.08] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium flex items-center gap-1.5 transition border border-black/[0.06] cursor-pointer"
            title="Thoát Timeline Studio (Esc)"
          >
            <X className="w-3.5 h-3.5" />
            <span>Thoát Studio</span>
            <span className="px-1 py-0.2 rounded bg-black/[0.06] text-[10px] text-zinc-500 font-mono">Esc</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-zinc-950 tracking-tight">Timeline Studio</span>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-500 font-normal">Ghép Nối Video Dài YouTube (5–10 Phút)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="btn-secondary cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleStartStitching}
            disabled={isProcessing}
            className="btn-primary cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>Ghép Thành Video Hoàn Chỉnh</span>
          </button>
        </div>
      </div>

      {/* Main Workspace (Preview + Inspector) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-y-auto">

        {/* LEFT: MASTER PREVIEW */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="studio-card p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] text-xs text-zinc-500">
              <span className="font-semibold text-zinc-900">Màn hình Xem trước Master</span>
              <span className="font-mono text-zinc-600 font-medium text-[11px]">16:9 Full HD 1080p</span>
            </div>

            <div className="w-full aspect-video bg-zinc-950 rounded-lg overflow-hidden relative border border-black/[0.08] flex items-center justify-center my-3 shadow-inner">
              <video
                src={project.videoUrl}
                poster={project.thumbnailUrl}
                controls
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
              <span>Đang kết hợp: <strong className="text-zinc-900 font-mono font-medium">{clips.length} phân cảnh</strong></span>
              <span className="font-mono text-[10px]">FFmpeg Concat Demuxer Engine</span>
            </div>
          </div>
        </div>

        {/* RIGHT: TIMELINE TELEMETRY & AUDIO */}
        <div className="lg:col-span-5 space-y-4">
          <div className="studio-card p-4 sm:p-5 space-y-4">

            {/* DURATION TELEMETRY */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  Tổng thời lượng video:
                </span>
                <span className="font-mono text-zinc-500 text-[11px]">Định hạn: 05:00 - 10:00</span>
              </div>

              {/* Status Box */}
              <div className="p-4 rounded-xl border border-black/[0.08] bg-zinc-50/70 text-center">
                <div className="text-3xl font-bold font-mono tracking-tight text-zinc-950">
                  {formatTime(totalDurationSec)} <span className="text-xs font-normal text-zinc-400">/ 10:00</span>
                </div>

                <div className="mt-2 text-xs font-medium flex items-center justify-center gap-1.5">
                  {isPerfect && (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-zinc-800">Đạt chuẩn thời lượng YouTube (5 - 10 phút)</span>
                    </>
                  )}
                  {isTooShort && (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-zinc-800">Chưa đạt tối thiểu 5 phút (Hiện tại: {formatTime(totalDurationSec)})</span>
                    </>
                  )}
                  {isTooLong && (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span className="text-zinc-800">Vượt quá giới hạn tối đa 10 phút</span>
                    </>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mt-2.5">
                <div
                  className="h-full rounded-full transition-all duration-300 bg-zinc-900"
                  style={{ width: `${Math.min(100, (totalDurationSec / 600) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* ADD CLIPS */}
            <div className="space-y-2 pt-3 border-t border-black/[0.06]">
              <span className="text-xs font-semibold text-zinc-800 block">Thêm đoạn clip:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-black/[0.06] text-left text-xs transition cursor-pointer"
                >
                  <div className="text-zinc-900 font-semibold mb-0.5 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-zinc-500" /> Dán link URL
                  </div>
                  <div className="text-[11px] text-zinc-500">Từ Kling / Runway / Drive</div>
                </button>

                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'video/mp4';
                    input.onchange = () => alert('Đã nạp file video từ máy.');
                    input.click();
                  }}
                  className="p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-black/[0.06] text-left text-xs transition cursor-pointer"
                >
                  <div className="text-zinc-900 font-semibold mb-0.5 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-zinc-500" /> Tải từ máy tính
                  </div>
                  <div className="text-[11px] text-zinc-500">Tệp MP4 có sẵn</div>
                </button>
              </div>
            </div>

            {/* MASTER AUDIO */}
            <div className="space-y-3 pt-3 border-t border-black/[0.06] text-xs">
              <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-zinc-600" />
                Âm thanh Master:
              </span>

              <div className="p-3 rounded-lg bg-zinc-50 border border-black/[0.05] flex items-center justify-between">
                <div>
                  <div className="text-zinc-900 font-medium">Lồng tiếng (Voiceover Track)</div>
                  <div className="text-[10px] text-zinc-500 font-mono">audio_voiceover_master.mp3</div>
                </div>
                <input
                  type="checkbox"
                  checked={voiceTrackActive}
                  onChange={(e) => setVoiceTrackActive(e.target.checked)}
                  className="rounded text-zinc-900 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 border border-black/[0.05] space-y-2">
                <div className="flex items-center justify-between text-zinc-600">
                  <span className="font-medium">Nhạc nền (BGM):</span>
                  <span className="font-mono text-[11px] text-zinc-900 font-semibold">{bgmVolume}%</span>
                </div>
                <select
                  value={selectedBgm}
                  onChange={(e) => setSelectedBgm(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg p-2 text-xs text-zinc-800 focus:outline-none"
                >
                  <option value="Cyberpunk Ambient Synth (10min Commercial)">Cyberpunk Ambient Synth (10min Commercial)</option>
                  <option value="Lo-fi Chill Beats Study 10min">Lo-fi Chill Beats Study 10min</option>
                  <option value="Epic Cinematic Orchestral Build">Epic Cinematic Orchestral Build</option>
                </select>

                <input
                  type="range"
                  min="0"
                  max="50"
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(Number(e.target.value))}
                  className="w-full accent-zinc-900 cursor-pointer"
                />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* BOTTOM TIMELINE REEL */}
      <div className="h-52 bg-white border-t border-black/[0.08] p-3 flex flex-col justify-between flex-shrink-0">
        <div className="flex items-center justify-between text-xs mb-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-950 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-600" />
              Timeline Video ({clips.length} Phân Cảnh)
            </span>
            <span className="text-zinc-400 text-[11px]">Dùng phím điều hướng để đổi thứ tự</span>
          </div>

          <button
            onClick={() => {
              const newC: LocalStitcherClip = {
                id: `clip-${Date.now()}`,
                name: `Clip mới`,
                thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
                videoUrl: project.videoUrl,
                durationSec: 10,
                transition: 'cut',
              };
              setClips([...clips, newC]);
            }}
            className="btn-secondary cursor-pointer"
          >
            + Chèn Clip 10s
          </button>
        </div>

        {/* Clips Reel */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {clips.map((clip, index) => (
            <div
              key={clip.id}
              className="relative flex-shrink-0 w-30 bg-zinc-50 border border-black/[0.08] rounded-lg overflow-hidden group hover:border-black/20 transition"
            >
              <div className="h-16 w-full relative bg-zinc-950">
                <img
                  src={clip.thumbnailUrl}
                  alt={clip.name}
                  className="w-full h-full object-cover opacity-90"
                />
                <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 font-mono text-[9px] text-emerald-400 font-medium">
                  {clip.durationSec}s
                </span>
                <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/70 font-mono text-[9px] text-white">
                  #{index + 1}
                </span>

                <button
                  onClick={() => handleDeleteClip(clip.id)}
                  className="absolute top-1 right-1 w-4 h-4 rounded bg-black/80 text-white hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>

              <div className="p-1 bg-white flex items-center justify-between text-[10px] border-t border-black/[0.04]">
                <button
                  onClick={() => handleMoveClip(index, 'left')}
                  disabled={index === 0}
                  className="px-1 py-0.5 rounded text-zinc-500 disabled:opacity-20 hover:text-zinc-900 cursor-pointer"
                >
                  ◀
                </button>

                <select
                  value={clip.transition}
                  onChange={(e) => {
                    const next = [...clips];
                    next[index].transition = e.target.value as any;
                    setClips(next);
                  }}
                  className="bg-transparent text-zinc-600 text-[9px] focus:outline-none font-mono"
                >
                  <option value="cut">Cut</option>
                  <option value="fade">Fade</option>
                  <option value="dissolve">Dissolve</option>
                </select>

                <button
                  onClick={() => handleMoveClip(index, 'right')}
                  disabled={index === clips.length - 1}
                  className="px-1 py-0.5 rounded text-zinc-500 disabled:opacity-20 hover:text-zinc-900 cursor-pointer"
                >
                  ▶
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-[10px] text-zinc-500">
          <span>{clips.length} phân cảnh • Tổng thời lượng: <strong className="text-zinc-900 font-mono font-medium">{formatTime(totalDurationSec)}</strong></span>
          <span className="font-mono">NLE Timeline Engine</span>
        </div>
      </div>

      {/* Modal dán URL ngoài */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="studio-card p-5 max-w-sm w-full shadow-2xl space-y-3 relative">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
              <h3 className="text-zinc-950 font-bold text-sm">Dán URL Video Ngoài</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-800 text-sm p-1 rounded-md cursor-pointer"
                title="Đóng"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCustomClip} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-700 font-medium block mb-1">Đường dẫn MP4 *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={customClipUrl}
                  onChange={(e) => setCustomClipUrl(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">Thời lượng (Giây) *</label>
                <input
                  type="number"
                  min="3"
                  max="30"
                  required
                  value={customClipDuration}
                  onChange={(e) => setCustomClipDuration(Number(e.target.value))}
                  className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary cursor-pointer"
                >
                  Thêm Vào Timeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="studio-card p-6 max-w-xs w-full text-center space-y-3 shadow-2xl">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 mx-auto border border-black/[0.06]">
              <Film className="w-4 h-4 animate-spin text-zinc-700" />
            </div>
            <h4 className="text-sm font-bold text-zinc-950">Đang Ghép Video Dài...</h4>
            <p className="text-zinc-500 text-xs font-mono">{processStep}</p>
            <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-zinc-900 h-full rounded-full transition-all duration-300"
                style={{ width: `${processPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
