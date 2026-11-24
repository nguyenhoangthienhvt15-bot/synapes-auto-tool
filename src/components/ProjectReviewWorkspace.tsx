import React, { useState, useRef, Suspense } from 'react';
import { Project, StoryboardScene, VoiceLanguage } from '../types';
import { AiCinemaPlayer } from './AiCinemaPlayer';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import {
  normalizeBgmVolumeRatio,
  bindExclusiveAudioElement,
} from '../services/voiceStudioService';

const VoiceStudioModal = lazyWithRetry(() =>
  import('./VoiceStudioModal').then((m) => ({ default: m.VoiceStudioModal }))
);
const KeyboardShortcutsModal = lazyWithRetry(() =>
  import('./KeyboardShortcutsModal').then((m) => ({ default: m.KeyboardShortcutsModal }))
);
import {
  buildAiSceneImageUrl,
  classifyTopicDomainClient,
  extractCleanSubject,
} from '../services/aiScriptGeneratorService';
import { ProviderBrandLogo } from './AiProviderDropdown';
import { getAuthHeaders } from '../services/userProfileService';
import {
  Volume2, CheckCircle2, Clock,
  Edit3, Film, ExternalLink, Smartphone, Monitor,
  Link2, Sparkles, X, Check, Camera, RefreshCw,
  Mic, Keyboard, Plus, Scissors, Trash2, Copy, Download,
  Music, Upload
} from 'lucide-react';

interface ProjectReviewWorkspaceProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onOpenStitcherStudio: (project: Project) => void;
  onBackToList?: () => void;
  onDeleteProject?: (projectId: string) => void;
  onNavigateView?: (view: string) => void;
}

export const ProjectReviewWorkspace: React.FC<ProjectReviewWorkspaceProps> = ({
  project,
  onUpdateProject,
  onOpenStitcherStudio,
  onBackToList,
  onDeleteProject,
  onNavigateView,
}) => {
  const [activeTab, setActiveTab] = useState<'storyboard' | 'metadata'>('storyboard');
  const [activeSceneId, setActiveSceneId] = useState<number | null>(
    project.storyboard[0]?.id ?? null
  );
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>(project.aspectRatio);
  const [showSocialMockup, setShowSocialMockup] = useState<'none' | 'tiktok' | 'youtube'>('none');
  const [editingSceneId, setEditingSceneId] = useState<number | null>(null);
  const [editingVoiceoverText, setEditingVoiceoverText] = useState('');
  const [editingScenePromptId, setEditingScenePromptId] = useState<number | null>(null);
  const [editingPromptText, setEditingPromptText] = useState('');

  // Voice Studio, Per-Video Schedule Picker & Keyboard Shortcuts Modals
  const [isVoiceStudioOpen, setIsVoiceStudioOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [voiceStudioTargetSceneId, setVoiceStudioTargetSceneId] = useState<number | null>(null);
  const [showSchedulePickerModal, setShowSchedulePickerModal] = useState(false);
  const [schedulePickDate, setSchedulePickDate] = useState('2026-11-15');
  const [schedulePickTime, setSchedulePickTime] = useState('20:00');

  // Publishing progress modal
  const [isPublishingModalOpen, setIsPublishingModalOpen] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishStepText, setPublishStepText] = useState('');
  const [isPublishComplete, setIsPublishComplete] = useState(false);

  // New tag input
  const [customTagInput, setCustomTagInput] = useState('');

  // AI revision modal
  const [showAiRevisionModal, setShowAiRevisionModal] = useState(false);
  const [revisionPrompt, setRevisionPrompt] = useState('');

  // Custom Background Music (MP3/WAV/OGG/M4A) upload & controls
  const bgmFileInputRef = useRef<HTMLInputElement | null>(null);
  const [bgmUploadError, setBgmUploadError] = useState<string | null>(null);

  const handleUploadCustomBgm = (file: File | undefined) => {
    if (!file) return;
    setBgmUploadError(null);
    if (file.size > 12 * 1024 * 1024) {
      setBgmUploadError('File nhạc nền vượt quá giới hạn 12MB. Vui lòng chọn tệp gọn nhẹ hơn.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = typeof ev.target?.result === 'string' ? ev.target.result : '';
      if (!dataUrl) {
        setBgmUploadError('Không thể đọc dữ liệu file âm thanh.');
        return;
      }
      let decodedDurationSec: number | undefined;
      try {
        const arr = await file.arrayBuffer();
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const tmpCtx = new AudioCtx();
          const decoded = await tmpCtx.decodeAudioData(arr);
          decodedDurationSec = Number(decoded.duration.toFixed(1));
          tmpCtx.close().catch(() => {});
        }
      } catch { }

      onUpdateProject({
        ...project,
        musicTrack: {
          ...(project.musicTrack || { name: file.name, license: 'User Uploaded BGM', volume: 24 }),
          name: file.name,
          license: 'Nhạc nền tải lên (MP3/WAV/OGG)',
          volume: project.musicTrack?.volume ?? 24,
          customBgmUrl: dataUrl,
          customBgmFileName: file.name,
          customBgmDurationSec: decodedDurationSec,
          loop: project.musicTrack?.loop ?? true,
          fadeInSec: project.musicTrack?.fadeInSec ?? 0.45,
          fadeOutSec: project.musicTrack?.fadeOutSec ?? 0.6,
          duckingEnabled: project.musicTrack?.duckingEnabled ?? true,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleApplyVoiceSettings = ({
    voiceId,
    language,
    speed,
    pitch,
    masterAudioDataUrl,
    masterAudioLabel,
    applyToAll,
  }: {
    voiceId: string;
    language: VoiceLanguage;
    speed: number;
    pitch: number;
    masterAudioDataUrl?: string;
    masterAudioLabel?: string;
    applyToAll: boolean;
  }) => {
    const targetSceneId = voiceStudioTargetSceneId || activeSceneId;
    const updated = project.storyboard.map((s) => {
      const isTarget = applyToAll || s.id === targetSceneId;
      if (isTarget) {
        return {
          ...s,
          voiceId,
          voiceLanguage: language,
          voiceSpeed: speed,
          voicePitch: pitch,
          ...(masterAudioDataUrl ? { customAudioUrl: undefined, isCustomRecorded: false } : {}),
        };
      }
      return s;
    });

    onUpdateProject({
      ...project,
      customAudioUrl: masterAudioDataUrl || undefined,
      voiceoverTrack: {
        name: masterAudioLabel || `Voice Master (${voiceId})`,
        voiceName: voiceId,
        audioUrl: masterAudioDataUrl || undefined,
        isCustomMasterAudio: Boolean(masterAudioDataUrl),
      },
      storyboard: updated,
    });

    // Đồng bộ Player phát lại ngay từ đầu với Track Master mới
    setTimeout(() => {
      const p = (window as any).__SYNAPES_PLAYER;
      if (p) {
        p.seekTo?.(0);
        p.setPlaying?.(true);
      }
    }, 80);
  };

  const projDomain = classifyTopicDomainClient(
    `${project.title} ${(project.metadata?.tags || []).join(' ')}`
  );

  const handleAddNewScene = () => {
    const newId = Math.max(0, ...project.storyboard.map((s) => s.id)) + 1;
    const lastScene = project.storyboard[project.storyboard.length - 1];
    const startSec = lastScene ? lastScene.endSec : 0;
    const endSec = startSec + 8;
    const cleanTopic = extractCleanSubject(project.title);
    const visualPrompt = `Editorial documentary photography of ${cleanTopic}, dramatic natural lighting, 8k photojournalism`;
    const newScene: StoryboardScene = {
      id: newId,
      sceneNumber: project.storyboard.length + 1,
      startSec,
      endSec,
      timeRange: `${formatSeconds(startSec)} - ${formatSeconds(endSec)} (8s)`,
      headline: `0${project.storyboard.length + 1}. DIỄN BIẾN TIẾP THEO`,
      voiceover: `Tiếp nối bức tranh toàn cảnh về ${cleanTopic}, các dữ kiện thực tế mới nhất đang mở ra những góc nhìn đáng chú ý.`,
      visualPrompt,
      imageUrl: buildAiSceneImageUrl(visualPrompt, aspectRatio, project.storyboard.length + 1, projDomain),
      cameraMotion: 'dolly-in',
      lightingStyle: 'volumetric',
      transition: 'dissolve',
      voiceId: lastScene?.voiceId,
      voiceLanguage: lastScene?.voiceLanguage || 'vi',
      voiceSpeed: lastScene?.voiceSpeed,
      voicePitch: lastScene?.voicePitch,
      explodedView: false,
      apertureBlades: false,
      appleMotion3d: project.videoGenre === 'apple-keynote' ? 'titanium-orbit' : 'none',
    };
    onUpdateProject({
      ...project,
      duration: project.duration + 8,
      storyboard: [...project.storyboard, newScene],
    });
    setActiveSceneId(newId);
  };

  const handleStartPublishing = async (
    isScheduled: boolean = false,
    pickedDateStr?: string,
    pickedTimeStr?: string
  ) => {
    const dStr = pickedDateStr || schedulePickDate || '2026-11-15';
    const tStr = pickedTimeStr || schedulePickTime || '20:00';
    const parts = dStr.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dStr;
    const scheduledLabel = `${tStr}, ${formattedDate} (Lịch phát sóng)`;

    setIsPublishingModalOpen(true);
    setIsPublishComplete(false);
    setPublishProgress(20);
    setPublishStepText('Đang xác thực OAuth Token kênh đích và đồng bộ gói lưu trữ máy chủ AES-256...');

    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    };

    const verifiedChannels: string[] = [];
    const failedChannels: string[] = [];
    const verifiedPublishedUrls: Record<string, string> = {};

    const targets = Array.isArray(project.targetChannels) && project.targetChannels.length > 0
      ? project.targetChannels
      : ['youtube'];

    for (let i = 0; i < targets.length; i++) {
      const pf = targets[i];
      setPublishProgress(25 + Math.round(((i + 1) / targets.length) * 40));
      try {
        const resp = await fetch('/api/channels/verify-publish', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            platform: pf,
            projectId: project.id,
          }),
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && data?.success) {
          verifiedChannels.push(pf);
          if (data.handleOrUrl) {
            verifiedPublishedUrls[pf] = data.handleOrUrl;
          }
        } else {
          failedChannels.push(`${pf.toUpperCase()} (${data?.error || 'Chưa xác thực OAuth'})`);
        }
      } catch {
        failedChannels.push(`${pf.toUpperCase()} (Lỗi kết nối kiểm định OAuth)`);
      }
    }

    setPublishProgress(80);
    let realArchiveUrl = project.driveBackupUrl || '';
    try {
      const syncResp = await fetch('/api/drive/sync-project', {
        method: 'POST',
        headers,
        body: JSON.stringify({ project }),
      });
      const syncData = await syncResp.json().catch(() => ({}));
      if (syncResp.ok && syncData?.success) {
        realArchiveUrl = syncData.externalFolderUrl || syncData.archiveUrl || realArchiveUrl;
      }
    } catch {
      // keep existing realArchiveUrl without fabricating Google Drive URLs
    }

    setPublishProgress(100);
    setIsPublishComplete(true);

    if (verifiedChannels.length === 0) {
      setPublishStepText(
        `Chưa thể xuất bản ra MXH vì chưa có kênh nào xác thực OAuth 2.0 hợp lệ (${failedChannels.join('; ')}). Đã lưu gói dự án trung thực vào Kho Lưu Trữ Máy Chủ AES-256${realArchiveUrl ? ` (${realArchiveUrl})` : ''}.`
      );
      if (realArchiveUrl) {
        onUpdateProject({
          ...project,
          driveBackupUrl: realArchiveUrl,
        });
      }
      return;
    }

    setPublishStepText(
      isScheduled
        ? `Đã xác thực OAuth cho [${verifiedChannels.join(', ')}] và duyệt hẹn giờ vào lúc ${tStr} ngày ${formattedDate}!`
        : `Đã xác thực OAuth và đồng bộ xuất bản thật cho [${verifiedChannels.join(', ')}]${failedChannels.length > 0 ? `. Bỏ qua kênh chưa kết nối: ${failedChannels.join(', ')}` : ''}.`
    );

    const updated: Project = {
      ...project,
      status: isScheduled ? 'scheduled' : 'published',
      scheduledTime: isScheduled ? scheduledLabel : undefined,
      driveBackupUrl: realArchiveUrl || undefined,
      publishedUrls: verifiedPublishedUrls,
    };
    onUpdateProject(updated);
  };

  const handleSaveSceneEdit = (sceneId: number) => {
    const updatedStoryboard = project.storyboard.map((s) => {
      if (s.id === sceneId) {
        return { ...s, voiceover: editingVoiceoverText };
      }
      return s;
    });
    onUpdateProject({ ...project, storyboard: updatedStoryboard });
    setEditingSceneId(null);
  };

  const inferCameraFromPrompt = (prompt: string, fallback?: StoryboardScene['cameraMotion']): StoryboardScene['cameraMotion'] => {
    const p = prompt.toLowerCase();
    if (p.includes('fpv') || p.includes('drone')) return 'fpv-zoom';
    if (p.includes('orbit') || p.includes('360')) return 'orbit';
    if (p.includes('crane') || p.includes('rise') || p.includes('rising')) return 'crane-up';
    if (p.includes('dolly out') || p.includes('pull back')) return 'dolly-out';
    if (p.includes('pan right') || p.includes('tracking')) return 'pan-right';
    if (p.includes('pan left')) return 'pan-left';
    if (p.includes('dolly in') || p.includes('push')) return 'dolly-in';
    return fallback || 'dolly-in';
  };

  const inferLightingFromPrompt = (prompt: string, fallback?: StoryboardScene['lightingStyle']): StoryboardScene['lightingStyle'] => {
    const p = prompt.toLowerCase();
    if (p.includes('cyberpunk') || p.includes('neon')) return 'cyberpunk';
    if (p.includes('rembrandt') || p.includes('chiaroscuro')) return 'rembrandt';
    if (p.includes('golden') || p.includes('warm')) return 'golden-hour';
    if (p.includes('studio') || p.includes('apple') || p.includes('clean')) return 'studio-clean';
    if (p.includes('volumetric') || p.includes('rays')) return 'volumetric';
    return fallback || 'volumetric';
  };

  const handleSavePromptEdit = (sceneId: number) => {
    const updatedStoryboard = project.storyboard.map((s) => {
      if (s.id === sceneId) {
        const newSeed = (Date.now() % 8000) + sceneId * 37 + 20;
        return {
          ...s,
          customMediaUrl: undefined,
          visualPrompt: editingPromptText,
          cameraMotion: inferCameraFromPrompt(editingPromptText, s.cameraMotion),
          lightingStyle: inferLightingFromPrompt(editingPromptText, s.lightingStyle),
          imageUrl: buildAiSceneImageUrl(editingPromptText, aspectRatio, newSeed, projDomain),
        };
      }
      return s;
    });
    onUpdateProject({ ...project, storyboard: updatedStoryboard });
    setEditingScenePromptId(null);
    setActiveSceneId(sceneId);
  };

  const handleInjectCameraTag = (sceneId: number, tag: string) => {
    const updatedStoryboard = project.storyboard.map((s) => {
      if (s.id === sceneId) {
        const cleanPrompt = s.visualPrompt.trim();
        const hasTagAlready = cleanPrompt.toLowerCase().includes(tag.toLowerCase());
        const nextPrompt = hasTagAlready
          ? cleanPrompt
          : `${cleanPrompt}${cleanPrompt.endsWith('.') || cleanPrompt.endsWith(',') ? ' ' : ', '}${tag}`;
        return {
          ...s,
          visualPrompt: nextPrompt,
          cameraMotion: inferCameraFromPrompt(nextPrompt, s.cameraMotion),
          lightingStyle: inferLightingFromPrompt(nextPrompt, s.lightingStyle),
        };
      }
      return s;
    });
    onUpdateProject({ ...project, storyboard: updatedStoryboard });
    setActiveSceneId(sceneId);
  };

  const handleRegenerateSceneVisual = (sceneId: number) => {
    const updatedStoryboard = project.storyboard.map((s) => {
      if (s.id === sceneId) {
        const newSeed = Math.floor(Math.random() * 90000) + 1000;
        return {
          ...s,
          customMediaUrl: undefined,
          imageUrl: buildAiSceneImageUrl(s.visualPrompt, aspectRatio, newSeed, projDomain),
        };
      }
      return s;
    });
    onUpdateProject({ ...project, storyboard: updatedStoryboard });
    setActiveSceneId(sceneId);
  };

  const handleAddTag = () => {
    if (!customTagInput.trim()) return;
    const clean = customTagInput.trim().replace(/^#/, '');
    if (!project.metadata.tags.includes(clean)) {
      onUpdateProject({
        ...project,
        metadata: {
          ...project.metadata,
          tags: [...project.metadata.tags, clean],
        },
      });
    }
    setCustomTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateProject({
      ...project,
      metadata: {
        ...project.metadata,
        tags: project.metadata.tags.filter((t) => t !== tagToRemove),
      },
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150 text-zinc-900">
      {/* Top Bar: Architectural Studio Card */}
      <div className="studio-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium border border-black/[0.06] transition flex items-center gap-1.5 cursor-pointer"
              title="Quay về danh sách tất cả dự án"
            >
              <span>← Quay lại</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-zinc-950 tracking-tight">{project.title}</h2>
              {project.status === 'pending_approval' || (project.status as string) === 'pending' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 text-zinc-800 border border-zinc-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Chờ duyệt
                </span>
              ) : project.status === 'scheduled' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 text-zinc-800 border border-zinc-200 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-zinc-500" /> Đã lên lịch
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 text-zinc-800 border border-zinc-200 flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600" /> Đã phát sóng
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-xs mt-1 flex flex-wrap items-center gap-2">
              <span>Thời lượng:</span>
              <strong className="text-zinc-900 font-mono font-medium">{formatSeconds(project.duration)}</strong>
              <span>•</span>
              <span>Động cơ:</span>
              <span className="inline-flex items-center gap-1.5 text-zinc-800 font-medium">
                <ProviderBrandLogo provider={project.aiSource.type} size="xs" withBadge={false} />
                <span>{project.aiSource.name}</span>
              </span>
            </p>
          </div>
        </div>

        {/* Cửa sổ 2: Trình Ghép Nối Clip 5-10 phút & Xóa dự án */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenStitcherStudio(project)}
            className="btn-secondary cursor-pointer"
          >
            <Film className="w-3.5 h-3.5 text-zinc-600" />
            <span>Ghép Nối Clip (5–10 phút)</span>
          </button>

          {onDeleteProject && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Bạn có chắc muốn xóa dự án "${project.title}" (${project.code}) khỏi danh sách?`
                  )
                ) {
                  onDeleteProject(project.id);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Xóa dự án này khỏi SYNAPES Studio"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Dự Án</span>
            </button>
          )}
        </div>
      </div>

      {/* Pending Approval Inspection Banner (Bàn làm việc Chờ Duyệt) */}
      {(project.status === 'pending_approval' || (project.status as string) === 'pending') && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 text-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start md:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-amber-300 flex items-center justify-center shadow-xs flex-shrink-0">
              <ProviderBrandLogo provider={project.aiSource.type} size="sm" withBadge={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-950">
                  Video Tạo Từ Công Cụ {project.aiSource.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  ĐANG CHỜ DUYỆT
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-0.5">
                {project.aiSource.model ? (
                  <>Kịch bản do <strong>{project.aiSource.model}</strong> gợi ý • Phân cảnh do <strong>{project.aiSource.name}</strong> hoàn tất render.</>
                ) : (
                  <>Sản phẩm video hoàn thiện từ Plugin sẵn sàng để xem xét.</>
                )}
                {' '}Vui lòng kiểm tra kỹ video trên trình phát HD bên dưới trước khi phê duyệt.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
            <button
              onClick={() => setShowAiRevisionModal(true)}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-medium border border-zinc-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Yêu cầu sửa lại phân cảnh hoặc âm thanh"
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Yêu Cầu Sửa Lại</span>
            </button>
            <button
              onClick={() => setShowSchedulePickerModal(true)}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Chọn ngày và giờ đăng riêng cho video này"
              data-testid="btn-schedule-publish-top"
            >
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Duyệt Hẹn Giờ Đăng</span>
            </button>
            <button
              onClick={() => handleStartPublishing(false)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Duyệt sản phẩm và xuất bản ngay"
              data-testid="btn-publish-now-top"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Duyệt Đăng Ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Split-View: Media Stage (58%) & Project Inspector (42%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* LEFT COLUMN: MEDIA STAGE */}
        <div className="lg:col-span-7 space-y-4">
          <div className="studio-card p-4 sm:p-5 space-y-4">

            {/* Segmented Ratio & Overlay Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] text-xs">
              <div className="studio-segmented-container">
                <button
                  onClick={() => setAspectRatio('16:9')}
                  className={`studio-segmented-item flex items-center gap-1.5 cursor-pointer ${aspectRatio === '16:9' ? 'active' : ''
                    }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> 16:9 (YouTube)
                </button>
                <button
                  onClick={() => setAspectRatio('9:16')}
                  className={`studio-segmented-item flex items-center gap-1.5 cursor-pointer ${aspectRatio === '9:16' ? 'active' : ''
                    }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> 9:16 (Shorts/Reels)
                </button>
              </div>

              {/* Mockup selector */}
              <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                <span className="font-mono text-zinc-400">Lớp phủ:</span>
                <button
                  onClick={() => setShowSocialMockup(showSocialMockup === 'tiktok' ? 'none' : 'tiktok')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${showSocialMockup === 'tiktok'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                    }`}
                >
                  TikTok
                </button>
                <button
                  onClick={() => setShowSocialMockup(showSocialMockup === 'youtube' ? 'none' : 'youtube')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${showSocialMockup === 'youtube'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                    }`}
                >
                  YouTube
                </button>
              </div>
            </div>

            {/* Real-Time 60fps AI Cinema Video Engine & NLE Editing Sequencer */}
            <AiCinemaPlayer
              project={project}
              aspectRatio={aspectRatio}
              showSocialMockup={showSocialMockup}
              activeSceneId={activeSceneId}
              onSelectScene={(sceneId) => setActiveSceneId(sceneId)}
              onUpdateProject={onUpdateProject}
              onOpenVoiceStudio={() => {
                setVoiceStudioTargetSceneId(activeSceneId || project.storyboard[0]?.id || 1);
                setIsVoiceStudioOpen(true);
              }}
              onOpenStitcherStudio={() => onOpenStitcherStudio(project)}
              onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
            />

            {/* Audio Track & Custom BGM (MP3/WAV) Upload Mixer Pod */}
            <div
              data-testid="audio-track-pod"
              className="p-3.5 rounded-xl bg-zinc-50 border border-black/[0.06] space-y-2.5 text-xs text-zinc-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-black/[0.08] flex items-center justify-center text-zinc-800 shrink-0 shadow-2xs">
                    {project.musicTrack?.customBgmUrl ? (
                      <Music className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-zinc-900 font-semibold flex items-center gap-2 flex-wrap">
                      <span className="truncate">
                        {project.voiceoverTrack?.name || project.musicTrack?.name || 'Neural Voiceover + BGM Studio'}
                      </span>
                      {project.customAudioUrl && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold">
                          Master Audio Toàn Video
                        </span>
                      )}
                      {project.musicTrack?.customBgmUrl && (
                        <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-mono text-[9px] font-bold">
                          Nhạc nền MP3 riêng
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono truncate">
                      Nhạc nền: {project.musicTrack?.customBgmFileName || project.musicTrack?.name || 'SYNAPES Ambient Score'}
                      {project.musicTrack?.customBgmDurationSec ? ` (${project.musicTrack.customBgmDurationSec}s)` : ''} •{' '}
                      {project.musicTrack?.license || 'SYNAPES Audio Engine'}
                    </div>
                  </div>
                </div>

                {/* Upload & Waveform Readout */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    data-testid="bgm-upload-btn"
                    onClick={() => bgmFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3 h-3" />
                    <span>
                      {project.musicTrack?.customBgmUrl ? 'Đổi nhạc nền (MP3/WAV)' : 'Tải nhạc nền (MP3/WAV)'}
                    </span>
                  </button>
                  {project.musicTrack?.customBgmUrl && (
                    <button
                      type="button"
                      data-testid="bgm-remove-btn"
                      onClick={() =>
                        onUpdateProject({
                          ...project,
                          musicTrack: {
                            ...(project.musicTrack || { name: 'SYNAPES Ambient Score', license: 'Royalty-Free Studio BGM', volume: 22 }),
                            name: 'SYNAPES Ambient Score',
                            license: 'Royalty-Free Studio BGM',
                            customBgmUrl: undefined,
                            customBgmFileName: undefined,
                            customBgmDurationSec: undefined,
                          },
                        })
                      }
                      className="px-2 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Gỡ nhạc nền riêng, dùng lại nhạc mặc định"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Gỡ BGM</span>
                    </button>
                  )}
                  <div className="flex items-end gap-0.5 h-3.5 pl-1">
                    <div className="w-1 bg-zinc-900 rounded-full wave-bar-1"></div>
                    <div className="w-1 bg-zinc-900 rounded-full wave-bar-2"></div>
                    <div className="w-1 bg-zinc-900 rounded-full wave-bar-3"></div>
                    <div className="w-1 bg-zinc-900 rounded-full wave-bar-4"></div>
                  </div>
                  <span
                    data-testid="bgm-volume-badge"
                    className="text-[10px] font-mono font-bold text-zinc-800 bg-white px-2 py-0.5 rounded border border-black/[0.08]"
                  >
                    {Math.round(normalizeBgmVolumeRatio(project.musicTrack?.volume) * 100)}%
                  </span>
                </div>
              </div>

              <input
                ref={bgmFileInputRef}
                data-testid="bgm-upload-input"
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
                className="hidden"
                onChange={(e) => {
                  handleUploadCustomBgm(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />

              {/* Mixer Controls: Volume 0–100%, Loop & Auto-Ducking */}
              <div className="pt-2 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                  <span className="text-[10.5px] font-semibold text-zinc-600 shrink-0">Âm lượng nhạc nền:</span>
                  <input
                    data-testid="bgm-volume-slider"
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(normalizeBgmVolumeRatio(project.musicTrack?.volume) * 100)}
                    onChange={(e) => {
                      const nextVol = Number(e.target.value);
                      onUpdateProject({
                        ...project,
                        musicTrack: {
                          ...(project.musicTrack || {
                            name: 'SYNAPES Ambient Score',
                            license: 'SYNAPES Audio Engine',
                            volume: nextVol,
                          }),
                          volume: nextVol,
                        },
                      });
                    }}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    data-testid="bgm-loop-toggle"
                    onClick={() =>
                      onUpdateProject({
                        ...project,
                        musicTrack: {
                          ...(project.musicTrack || {
                            name: 'SYNAPES Ambient Score',
                            license: 'SYNAPES Audio Engine',
                            volume: 22,
                          }),
                          loop: project.musicTrack?.loop === false,
                        },
                      })
                    }
                    className={`px-2 py-1 rounded-md text-[10.5px] font-semibold border transition cursor-pointer ${
                      project.musicTrack?.loop !== false
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-white text-zinc-500 border-black/[0.08]'
                    }`}
                  >
                    {project.musicTrack?.loop !== false ? '✓ Lặp vô tận' : 'Phát 1 lần'}
                  </button>

                  <button
                    type="button"
                    data-testid="bgm-ducking-toggle"
                    onClick={() =>
                      onUpdateProject({
                        ...project,
                        musicTrack: {
                          ...(project.musicTrack || {
                            name: 'SYNAPES Ambient Score',
                            license: 'SYNAPES Audio Engine',
                            volume: 22,
                          }),
                          duckingEnabled: project.musicTrack?.duckingEnabled === false,
                        },
                      })
                    }
                    className={`px-2 py-1 rounded-md text-[10.5px] font-semibold border transition cursor-pointer ${
                      project.musicTrack?.duckingEnabled !== false
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        : 'bg-white text-zinc-500 border-black/[0.08]'
                    }`}
                    title="Tự động hạ nhẹ nhạc nền khi AI/MC đang đọc thoại để giữ giọng nói rõ nét"
                  >
                    {project.musicTrack?.duckingEnabled !== false ? '✓ Auto-Ducking Giọng Nói' : 'Tắt Auto-Ducking'}
                  </button>
                </div>
              </div>

              {project.musicTrack?.customBgmUrl && (
                <div className="pt-1">
                  <audio
                    controls
                    src={project.musicTrack.customBgmUrl}
                    onPlay={(e) => bindExclusiveAudioElement(e.currentTarget)}
                    className="w-full h-8 rounded-lg"
                  />
                </div>
              )}

              {bgmUploadError && (
                <div className="text-[11px] text-rose-600 font-medium bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg">
                  {bgmUploadError}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-3 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAiRevisionModal(true)}
                  className="btn-secondary cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Sửa kịch bản</span>
                </button>
                <button
                  onClick={() => setShowSchedulePickerModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold border border-black/[0.06] transition flex items-center gap-1.5 cursor-pointer"
                  title="Chọn ngày và giờ phát sóng riêng cho video này"
                  data-testid="btn-schedule-publish-bottom"
                >
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Duyệt Hẹn Giờ Đăng</span>
                </button>
              </div>

              {/* Primary Approval Action Button */}
              <button
                onClick={() => handleStartPublishing(false)}
                className="btn-primary cursor-pointer"
                data-testid="btn-publish-now-bottom"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Duyệt Đăng Ngay</span>
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: PROJECT INSPECTOR */}
        <div className="lg:col-span-5 space-y-4">
          <div className="studio-card p-4 sm:p-5">

            {/* Tabs */}
            <div className="pb-3 mb-3 border-b border-black/[0.06]">
              <div className="studio-segmented-container w-full">
                <button
                  onClick={() => setActiveTab('storyboard')}
                  className={`studio-segmented-item flex-1 text-center cursor-pointer ${activeTab === 'storyboard' ? 'active' : ''
                    }`}
                >
                  Phân Cảnh Kịch Bản ({project.storyboard.length})
                </button>

                <button
                  onClick={() => setActiveTab('metadata')}
                  className={`studio-segmented-item flex-1 text-center cursor-pointer ${activeTab === 'metadata' ? 'active' : ''
                    }`}
                >
                  Nội Dung & Kênh Đăng
                </button>
              </div>
            </div>

            {/* TAB 1: STORYBOARD */}
            {activeTab === 'storyboard' && (
              <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-black/[0.04] text-[11px] text-zinc-500 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAddNewScene}
                      className="px-2 py-1 rounded bg-zinc-900 hover:bg-black text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs transition"
                      title="Thêm phân cảnh mới 8 giây"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>Thêm Cảnh (+8s)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceStudioTargetSceneId(activeSceneId || 1);
                        setIsVoiceStudioOpen(true);
                      }}
                      className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                      title="Mở phòng thu lồng tiếng AI"
                    >
                      <Mic className="w-3 h-3 text-indigo-600" />
                      <span>Phòng Thu Giọng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsShortcutsModalOpen(true)}
                      className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-black/[0.06] text-[10px] cursor-pointer transition"
                      title="Phím tắt NLE (?)"
                    >
                      <Keyboard className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-zinc-900 font-mono font-semibold">Tổng: {formatSeconds(project.duration)}</span>
                </div>

                {project.storyboard.map((scene) => {
                  const isCurrentScene = activeSceneId === scene.id;
                  return (
                    <div
                      key={scene.id}
                      onClick={() => setActiveSceneId(scene.id)}
                      className={`p-3 rounded-lg border transition space-y-1.5 cursor-pointer ${isCurrentScene
                        ? 'bg-indigo-50/40 border-indigo-400 shadow-sm'
                        : 'bg-zinc-50/70 border-black/[0.05] hover:border-black/[0.14]'
                        }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 ${isCurrentScene
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-black/[0.08] text-zinc-700'
                            }`}>
                            {scene.sceneNumber}
                          </span>
                          <span className="text-zinc-900 font-semibold text-[11px] truncate max-w-[180px]" title={scene.headline || `Cảnh ${scene.sceneNumber}`}>
                            {scene.headline || `Cảnh ${scene.sceneNumber}`}
                          </span>
                          {scene.cameraMotion && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-100/80 text-indigo-700 font-mono text-[9px] uppercase whitespace-nowrap flex-shrink-0">
                              🎥 {scene.cameraMotion}
                            </span>
                          )}
                          {scene.customMediaUrl && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800 font-mono text-[9px] whitespace-nowrap flex-shrink-0">
                              B-Roll riêng
                            </span>
                          )}
                          {scene.customAudioUrl && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-mono text-[9px] flex items-center gap-1 font-bold whitespace-nowrap flex-shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                              Thu âm mic
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegenerateSceneVisual(scene.id);
                            }}
                            className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 text-zinc-600 hover:text-indigo-600 border border-black/[0.06] text-[9px] font-mono flex items-center gap-1 transition cursor-pointer whitespace-nowrap flex-shrink-0"
                            title="Tạo lại khung hình AI mới cho cảnh này"
                          >
                            <RefreshCw className="w-2.5 h-2.5 flex-shrink-0" />
                            <span>Render lại ảnh</span>
                          </button>
                          <span className="font-mono text-zinc-500 text-[10px] bg-white px-1.5 py-0.2 rounded border border-black/[0.04] whitespace-nowrap flex-shrink-0">
                            {scene.timeRange}
                          </span>
                        </div>
                      </div>

                      {/* Voiceover Text (Inline Edit) */}
                      <div>
                        {editingSceneId === scene.id ? (
                          <div className="space-y-2">
                            <textarea
                              rows={3}
                              value={editingVoiceoverText}
                              onChange={(e) => setEditingVoiceoverText(e.target.value)}
                              className="w-full bg-white border border-zinc-900 rounded-lg p-2.5 text-xs text-zinc-900 focus:outline-none"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingSceneId(null)}
                                className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={() => handleSaveSceneEdit(scene.id)}
                                className="px-3 py-1 bg-zinc-900 text-white rounded-md text-xs font-medium cursor-pointer"
                              >
                                Lưu
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p
                            onClick={() => {
                              setEditingSceneId(scene.id);
                              setEditingVoiceoverText(scene.voiceover);
                            }}
                            className="text-xs text-zinc-800 leading-relaxed cursor-pointer p-2 rounded-lg bg-white hover:bg-zinc-100/70 border border-transparent hover:border-black/[0.06] transition"
                            title="Bấm để sửa lời thoại"
                          >
                            "{scene.voiceover}"
                          </p>
                        )}
                      </div>

                      {/* Visual Prompt Indicator with Cinematic Quick-Inject */}
                      <div className="pt-1.5 border-t border-black/[0.04] space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 text-zinc-700 font-mono font-medium">
                            <Camera className="w-3 h-3 text-indigo-600" />
                            <span>GÓC MÁY & VISUAL PROMPT:</span>
                          </div>
                          <button
                            onClick={() => {
                              if (editingScenePromptId === scene.id) {
                                setEditingScenePromptId(null);
                              } else {
                                setEditingScenePromptId(scene.id);
                                setEditingPromptText(scene.visualPrompt);
                              }
                            }}
                            className="text-[10px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                          >
                            {editingScenePromptId === scene.id ? 'Đóng' : 'Chỉnh sửa'}
                          </button>
                        </div>

                        {editingScenePromptId === scene.id ? (
                          <div className="space-y-1.5">
                            <textarea
                              rows={3}
                              value={editingPromptText}
                              onChange={(e) => setEditingPromptText(e.target.value)}
                              className="w-full bg-white border border-indigo-500 rounded-md p-2 text-[11px] text-zinc-900 focus:outline-none"
                              placeholder="Mô tả phân cảnh, góc máy, ánh sáng, chi tiết..."
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingScenePromptId(null)}
                                className="px-2 py-0.5 text-[11px] text-zinc-500 hover:text-zinc-800"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={() => handleSavePromptEdit(scene.id)}
                                className="px-2.5 py-0.5 bg-zinc-900 text-white rounded text-[11px] font-medium"
                              >
                                Lưu Prompt
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p
                            onClick={() => {
                              setEditingScenePromptId(scene.id);
                              setEditingPromptText(scene.visualPrompt);
                            }}
                            className="text-[11px] text-zinc-600 leading-snug line-clamp-2 bg-white/70 p-1.5 rounded border border-black/[0.04] hover:border-black/[0.1] cursor-pointer"
                            title="Bấm để chỉnh sửa câu lệnh góc máy"
                          >
                            {scene.visualPrompt}
                          </p>
                        )}

                        {/* Direct Apple 3D Motion Stage & Scene Duration Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-black/[0.04]">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] text-zinc-500 font-mono">Đồ họa 3D:</span>
                            {[
                              { id: 'exploded-chip', label: '3D Bóc Tách Chip' },
                              { id: 'aperture-zoom', label: 'Lá Khẩu Cơ Học' },
                              { id: 'titanium-orbit', label: 'Quỹ Đạo Titan' },
                              { id: 'none', label: 'Tắt 3D' },
                            ].map((m3d) => {
                              const current3d =
                                scene.appleMotion3d ||
                                (scene.explodedView
                                  ? 'exploded-chip'
                                  : scene.apertureBlades
                                    ? 'aperture-zoom'
                                    : 'titanium-orbit');
                              const isActive3d = current3d === m3d.id;
                              return (
                                <button
                                  key={m3d.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updated = project.storyboard.map((s) =>
                                      s.id === scene.id
                                        ? {
                                            ...s,
                                            appleMotion3d: m3d.id as any,
                                            explodedView: m3d.id === 'exploded-chip',
                                            apertureBlades: m3d.id === 'aperture-zoom',
                                          }
                                        : s
                                    );
                                    onUpdateProject({ ...project, storyboard: updated });
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition cursor-pointer border ${
                                    isActive3d
                                      ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                                      : 'bg-white text-zinc-600 border-black/[0.08] hover:bg-zinc-100'
                                  }`}
                                >
                                  {m3d.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Scene Duration Quick Selector */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-zinc-400 font-mono">Thời lượng:</span>
                            {[5, 8, 10, 12].map((durSec) => {
                              const currentDur = Math.round((scene.endSec || 8) - (scene.startSec || 0));
                              return (
                                <button
                                  key={durSec}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    let acc = 0;
                                    const reindexed = project.storyboard.map((s) => {
                                      const d = s.id === scene.id ? durSec : Math.max(3, (s.endSec || 8) - (s.startSec || 0));
                                      const st = acc;
                                      const en = st + d;
                                      acc = en;
                                      const sm = Math.floor(st / 60).toString().padStart(2, '0');
                                      const ss = Math.floor(st % 60).toString().padStart(2, '0');
                                      const em = Math.floor(en / 60).toString().padStart(2, '0');
                                      const es = Math.floor(en % 60).toString().padStart(2, '0');
                                      return {
                                        ...s,
                                        startSec: st,
                                        endSec: en,
                                        timeRange: `${sm}:${ss} - ${em}:${es}`,
                                      };
                                    });
                                    onUpdateProject({
                                      ...project,
                                      duration: acc,
                                      storyboard: reindexed,
                                    });
                                  }}
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono transition cursor-pointer border ${
                                    currentDur === durSec
                                      ? 'bg-zinc-900 text-white border-zinc-900 font-bold'
                                      : 'bg-white text-zinc-600 border-black/[0.06] hover:bg-zinc-100'
                                  }`}
                                >
                                  {durSec}s
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Quick Cinematic Camera Presets (1-Click Inject) */}
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="text-[9px] text-zinc-400 font-mono">Góc máy:</span>
                          {[
                            { label: '+ Dolly In', tag: 'Cinematic Dolly In camera motion, smooth forward push' },
                            { label: '+ Orbit 360°', tag: 'Smooth 360-degree orbit shot around subject' },
                            { label: '+ FPV Drone', tag: 'Dynamic FPV drone dive weave shot' },
                            { label: '+ 35mm Lens', tag: 'Shot on 35mm anamorphic lens, shallow depth of field' },
                            { label: '+ Volumetric Rays', tag: 'Atmospheric volumetric god rays, cinematic lighting' },
                          ].map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              onClick={() => handleInjectCameraTag(scene.id, preset.tag)}
                              className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-600 border border-black/5 transition cursor-pointer"
                              title={`Chèn vào prompt: ${preset.tag}`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: METADATA */}
            {activeTab === 'metadata' && (
              <div className="space-y-3.5 max-h-[540px] overflow-y-auto pr-1 text-xs">
                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Tiêu đề Video (Title) *</label>
                  <input
                    type="text"
                    value={project.metadata.title}
                    onChange={(e) =>
                      onUpdateProject({
                        ...project,
                        metadata: { ...project.metadata, title: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Mô tả Nội dung (Description) *</label>
                  <textarea
                    rows={4}
                    value={project.metadata.description}
                    onChange={(e) =>
                      onUpdateProject({
                        ...project,
                        metadata: { ...project.metadata, description: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-black/[0.1] rounded-lg p-2.5 text-xs text-zinc-800 focus:outline-none focus:border-zinc-900 leading-relaxed"
                  ></textarea>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Thẻ Tags (Hashtags)</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {project.metadata.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-black/[0.06] text-[11px] font-mono flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="text-zinc-400 hover:text-zinc-900 ml-0.5 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Thêm tag mới..."
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      className="flex-1 bg-white border border-black/[0.1] rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="btn-secondary cursor-pointer"
                    >
                      Thêm
                    </button>
                  </div>
                </div>

                {/* Product link */}
                <div>
                  <label className="text-zinc-700 font-medium block mb-1 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Link Sản Phẩm / Bio (TikTok/Reels)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={project.metadata.productLink || ''}
                    onChange={(e) =>
                      onUpdateProject({
                        ...project,
                        metadata: { ...project.metadata, productLink: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-2 text-xs text-zinc-800 font-mono focus:outline-none focus:border-zinc-900"
                  />
                </div>

                {/* Target Channels */}
                <div className="pt-2 border-t border-black/[0.06]">
                  <label className="text-zinc-700 font-medium block mb-2">Kênh xuất bản đồng thời:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['youtube', 'tiktok', 'facebook'].map((chan) => (
                      <label
                        key={chan}
                        className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 border border-black/[0.04] cursor-pointer hover:bg-zinc-100 transition"
                      >
                        <input
                          type="checkbox"
                          checked={project.targetChannels.includes(chan as any)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...project.targetChannels, chan as any]
                              : project.targetChannels.filter((c) => c !== chan);
                            onUpdateProject({ ...project, targetChannels: next });
                          }}
                          className="rounded text-zinc-900 focus:ring-0"
                        />
                        <span className="text-zinc-800 font-medium text-xs capitalize">{chan}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Export SRT Subtitles & Project Blueprint JSON */}
                <div className="pt-3 border-t border-black/[0.06] space-y-2">
                  <label className="text-zinc-700 font-medium block">Tài nguyên Hậu kỳ & Phụ đề:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const toSrtTime = (sec: number) => {
                          const hrs = Math.floor(sec / 3600).toString().padStart(2, '0');
                          const mins = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
                          const secs = Math.floor(sec % 60).toString().padStart(2, '0');
                          return `${hrs}:${mins}:${secs},000`;
                        };
                        const srtContent = project.storyboard
                          .map((s, idx) => `${idx + 1}\n${toSrtTime(s.startSec)} --> ${toSrtTime(s.endSec)}\n${s.voiceover}\n`)
                          .join('\n');
                        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${project.code || 'SYNAPES'}_Subtitles.srt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="btn-secondary text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Tải Phụ Đề (.SRT)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${project.code || 'SYNAPES'}_Master_Blueprint.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="btn-secondary text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Xuất Kịch Bản (.JSON)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* MODAL TIẾN TRÌNH XUẤT BẢN */}
      {isPublishingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="studio-card p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsPublishingModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 mb-3 border border-black/[0.06]">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900">
                {isPublishComplete
                  ? (publishStepText.startsWith('Chưa thể') ? 'Đã Lưu Archive Máy Chủ (Chờ OAuth)' : 'Xuất Bản Thành Công')
                  : 'Đang Xác Thực OAuth & Đồng Bộ...'}
              </h3>
              <p className="text-zinc-500 text-xs mt-1 font-mono">{publishStepText}</p>
            </div>

            <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-zinc-900 h-full rounded-full transition-all duration-300"
                style={{ width: `${publishProgress}%` }}
              ></div>
            </div>

            {!isPublishComplete && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPublishingModalOpen(false)}
                  className="btn-secondary cursor-pointer"
                >
                  Dừng Đăng
                </button>
              </div>
            )}

            {isPublishComplete && (
              <div className="pt-3 border-t border-black/[0.06] flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPublishingModalOpen(false);
                      onNavigateView?.('social-channels');
                    }}
                    className="btn-secondary text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Kênh Đã Xuất Bản</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPublishingModalOpen(false);
                      onNavigateView?.('calendar');
                    }}
                    className="btn-secondary text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Xem Lịch Phát Sóng</span>
                    <Clock className="w-3 h-3 text-zinc-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPublishingModalOpen(false);
                      onNavigateView?.('drive-backup');
                    }}
                    className="btn-secondary text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Kho Lưu Trữ AES-256</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </button>
                </div>

                <button
                  onClick={() => setIsPublishingModalOpen(false)}
                  className="btn-primary w-full cursor-pointer"
                >
                  Hoàn Tất
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL YÊU CẦU AI SỬA LẠI */}
      {showAiRevisionModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAiRevisionModal(false);
          }}
        >
          <div className="studio-card p-6 max-w-md w-full shadow-2xl relative space-y-3">
            <button
              onClick={() => setShowAiRevisionModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition cursor-pointer"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-700" />
              <h3 className="text-zinc-950 font-bold text-sm">Chỉnh Sửa Kịch Bản & Đồ Họa AI</h3>
            </div>
            <p className="text-zinc-500 text-xs">
              Chọn nhanh mẫu tối ưu hoặc nhập chỉ dẫn biên tập cho toàn bộ phân cảnh:
            </p>

            {/* Quick AI Revision Presets */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Chuẩn Bản Tin Thời Sự 24h (Góc máy phóng sự, dải tin nóng)',
                'Nhịp chuyển cảnh nhanh 5 giây/cảnh chuẩn Shorts & Reels',
                'Phim tài liệu điện ảnh (Ánh sáng chiều sâu, góc máy Crane & Orbit)',
              ].map((presetText) => (
                <button
                  key={presetText}
                  type="button"
                  onClick={() => setRevisionPrompt(presetText)}
                  className="px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-700 text-[10px] font-medium transition cursor-pointer border border-black/[0.06]"
                >
                  + {presetText}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              placeholder="VD: Chuyển sang phong cách bản tin thời sự 24h, rút ngắn mỗi cảnh còn 6 giây, đổi góc máy Orbit..."
              value={revisionPrompt}
              onChange={(e) => setRevisionPrompt(e.target.value)}
              className="w-full bg-white border border-black/[0.1] rounded-lg p-3 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
            ></textarea>

            <div className="flex justify-end gap-2 border-t border-black/[0.06] pt-3">
              <button
                onClick={() => setShowAiRevisionModal(false)}
                className="btn-secondary cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const trimmedRev = revisionPrompt.trim();
                  if (trimmedRev) {
                    const lowerRev = trimmedRev.toLowerCase();
                    const numMatch = lowerRev.match(/(\d+)\s*(giây|s\b)/);
                    const requestedDur = numMatch ? Math.max(4, Math.min(30, parseInt(numMatch[1], 10))) : null;
                    const wantApple3d =
                      projDomain === 'hardware' &&
                      (lowerRev.includes('3d') || lowerRev.includes('apple') || lowerRev.includes('bóc tách'));
                    const wantNews = lowerRev.includes('bản tin') || lowerRev.includes('thời sự');
                    const wantReplaceImage = /đổi ảnh|thay ảnh|ảnh mới|b-roll/i.test(lowerRev);

                    const parsedClauses = trimmedRev
                      .split(/\r?\n|;\s*/)
                      .map((line) => line.replace(/^\d+[.)\-:]\s*/, '').trim())
                      .filter((line) => line.length >= 4);
                    const clauses = parsedClauses.length > 0 ? parsedClauses : [trimmedRev];

                    let acc = 0;
                    const updatedStoryboard = project.storyboard.map((s, idx) => {
                      const sceneDirective =
                        clauses.length > 1 ? clauses[idx % clauses.length] : trimmedRev;
                      const nextPrompt = `${s.visualPrompt}, ${sceneDirective}`;
                      const nextHeadline =
                        clauses.length > 1
                          ? `${String(idx + 1).padStart(2, '0')}. ${sceneDirective.slice(0, 44).toUpperCase()}`
                          : `${(s.headline || `0${idx + 1}`).replace(/\s*•.*$/, '')} • ${sceneDirective.slice(0, 26).toUpperCase()}`;
                      const nextVoiceover =
                        clauses.length > 1
                          ? sceneDirective
                          : `${(s.voiceover || '').replace(/[.!?]+$/, '')}. Đặc biệt: ${sceneDirective}.`;

                      const keepCustomMedia = Boolean(s.customMediaUrl) && !wantReplaceImage;
                      const newSeed = (Date.now() % 900) + idx * 7 + 20;
                      const dur = requestedDur || Math.max(4, (s.endSec || 8) - (s.startSec || 0));
                      const st = acc;
                      const en = st + dur;
                      acc = en;
                      const sm = Math.floor(st / 60).toString().padStart(2, '0');
                      const ss = Math.floor(st % 60).toString().padStart(2, '0');
                      const em = Math.floor(en / 60).toString().padStart(2, '0');
                      const es = Math.floor(en % 60).toString().padStart(2, '0');

                      return {
                        ...s,
                        headline: nextHeadline,
                        voiceover: nextVoiceover,
                        customMediaUrl: keepCustomMedia ? s.customMediaUrl : undefined,
                        customMediaType: keepCustomMedia ? s.customMediaType : undefined,
                        startSec: st,
                        endSec: en,
                        timeRange: `${sm}:${ss} - ${em}:${es}`,
                        visualPrompt: nextPrompt,
                        cameraMotion: inferCameraFromPrompt(nextPrompt, s.cameraMotion),
                        lightingStyle: inferLightingFromPrompt(nextPrompt, s.lightingStyle),
                        imageUrl: keepCustomMedia
                          ? s.imageUrl
                          : buildAiSceneImageUrl(nextPrompt, aspectRatio, newSeed, projDomain),
                        explodedView: wantApple3d ? idx === 3 || s.explodedView : false,
                        apertureBlades: wantApple3d ? idx === 4 || s.apertureBlades : false,
                        appleMotion3d: (wantApple3d
                          ? idx === 3
                            ? 'exploded-chip'
                            : idx === 4
                              ? 'aperture-zoom'
                              : 'titanium-orbit'
                          : 'none') as StoryboardScene['appleMotion3d'],
                      };
                    });
                    onUpdateProject({
                      ...project,
                      videoGenre: wantNews ? 'news-broadcast' : project.videoGenre,
                      duration: acc,
                      storyboard: updatedStoryboard,
                    });
                  }
                  setRevisionPrompt('');
                  setShowAiRevisionModal(false);
                }}
                className="btn-primary cursor-pointer"
              >
                Áp Dụng & Render Lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHÒNG THU GIỌNG TOÀN VIDEO MODAL (Lazy Suspended) */}
      {isVoiceStudioOpen && (
        <Suspense fallback={null}>
          <VoiceStudioModal
            isOpen={isVoiceStudioOpen}
            onClose={() => setIsVoiceStudioOpen(false)}
            project={project}
            activeVoiceId={
              project.storyboard.find((s) => s.id === (voiceStudioTargetSceneId || activeSceneId))?.voiceId ||
              project.voiceoverTrack?.voiceName
            }
            activeLanguage={
              project.storyboard.find((s) => s.id === (voiceStudioTargetSceneId || activeSceneId))?.voiceLanguage || 'vi'
            }
            currentVoiceSpeed={
              project.storyboard.find((s) => s.id === (voiceStudioTargetSceneId || activeSceneId))?.voiceSpeed || 1.05
            }
            currentVoicePitch={
              project.storyboard.find((s) => s.id === (voiceStudioTargetSceneId || activeSceneId))?.voicePitch || 1.0
            }
            currentSceneNumber={
              project.storyboard.find((s) => s.id === (voiceStudioTargetSceneId || activeSceneId))?.sceneNumber || 1
            }
            currentSceneVoiceover={
              project.storyboard.find((s) => s.id === (voiceStudioTargetSceneId || activeSceneId))?.voiceover || ''
            }
            existingMasterAudioUrl={
              project.customAudioUrl || project.voiceoverTrack?.audioUrl || ''
            }
            onApplyVoice={handleApplyVoiceSettings}
          />
        </Suspense>
      )}

      {/* MODAL CHỌN NGÀY & GIỜ HẸN ĐĂNG RIÊNG CHO VIDEO NÀY */}
      {showSchedulePickerModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowSchedulePickerModal(false)}
          data-testid="project-schedule-modal"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-black/10 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-black/[0.08] bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-zinc-950">Duyệt Hẹn Giờ Đăng Video</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSchedulePickerModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 border border-black/[0.06] text-zinc-700">
                <div className="font-bold text-zinc-950 truncate">{project.title}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Lịch hẹn này sẽ đồng bộ trực tiếp lên trang <strong>Lịch Phát Sóng</strong> theo ngày/giờ bạn chọn.
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">Ngày phát sóng</label>
                  <input
                    type="date"
                    value={schedulePickDate}
                    onChange={(e) => setSchedulePickDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-black/15 font-mono text-zinc-900 bg-white"
                    data-testid="input-schedule-date"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">Giờ phát sóng</label>
                  <input
                    type="time"
                    value={schedulePickTime}
                    onChange={(e) => setSchedulePickTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-black/15 font-mono text-zinc-900 bg-white"
                    data-testid="input-schedule-time"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-zinc-500 mr-1">Chọn nhanh:</span>
                {['09:00', '12:00', '18:00', '20:00', '20:30'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSchedulePickTime(t)}
                    className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold border transition cursor-pointer ${
                      schedulePickTime === t
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-black/[0.08] bg-zinc-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSchedulePickerModal(false)}
                className="btn-secondary text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSchedulePickerModal(false);
                  handleStartPublishing(true, schedulePickDate, schedulePickTime);
                }}
                className="btn-primary text-xs cursor-pointer"
                data-testid="btn-confirm-schedule-publish"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Xác Nhận Duyệt Hẹn Giờ Đăng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BẢNG TRA CỨU PHÍM TẮT NLE (Lazy Suspended) */}
      {isShortcutsModalOpen && (
        <Suspense fallback={null}>
          <KeyboardShortcutsModal
            isOpen={isShortcutsModalOpen}
            onClose={() => setIsShortcutsModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};
