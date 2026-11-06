import React, { useState } from 'react';
import { Project, StoryboardScene } from '../types';
import { AiCinemaPlayer } from './AiCinemaPlayer';
import { VoiceStudioModal } from './VoiceStudioModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { buildAiSceneImageUrl } from '../services/aiScriptGeneratorService';
import {
  Volume2, CheckCircle2, Clock,
  Edit3, Film, ExternalLink, Smartphone, Monitor,
  Link2, Sparkles, X, Check, Camera, RefreshCw,
  Mic, Keyboard, Plus, Scissors, Trash2, Copy
} from 'lucide-react';

interface ProjectReviewWorkspaceProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onOpenStitcherStudio: (project: Project) => void;
  onBackToList?: () => void;
}

export const ProjectReviewWorkspace: React.FC<ProjectReviewWorkspaceProps> = ({
  project,
  onUpdateProject,
  onOpenStitcherStudio,
  onBackToList,
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

  // Voice Studio & Keyboard Shortcuts Modals
  const [isVoiceStudioOpen, setIsVoiceStudioOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [voiceStudioTargetSceneId, setVoiceStudioTargetSceneId] = useState<number | null>(null);

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

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleApplyVoiceSettings = ({
    voiceId,
    speed,
    pitch,
    applyToAll,
  }: {
    voiceId: string;
    speed: number;
    pitch: number;
    applyToAll: boolean;
  }) => {
    const updated = project.storyboard.map((s) => {
      if (applyToAll || s.id === (voiceStudioTargetSceneId || activeSceneId)) {
        return {
          ...s,
          voiceId,
          voiceSpeed: speed,
          voicePitch: pitch,
        };
      }
      return s;
    });

    onUpdateProject({
      ...project,
      voiceoverTrack: {
        name: `Voice AI (${voiceId})`,
        voiceName: voiceId,
      },
      storyboard: updated,
    });
  };

  const handleAddNewScene = () => {
    const newId = Math.max(0, ...project.storyboard.map((s) => s.id)) + 1;
    const lastScene = project.storyboard[project.storyboard.length - 1];
    const startSec = lastScene ? lastScene.endSec : 0;
    const endSec = startSec + 8;
    const newScene: StoryboardScene = {
      id: newId,
      sceneNumber: project.storyboard.length + 1,
      startSec,
      endSec,
      timeRange: `${formatSeconds(startSec)} - ${formatSeconds(endSec)} (8s)`,
      headline: `CẢNH MỚI ${project.storyboard.length + 1}`,
      voiceover: 'Tiếp tục phân tích chi tiết về giá trị đột phá và trải nghiệm thực tế.',
      visualPrompt: 'Cinematic 8k commercial close up of modern high-tech device, studio lighting, depth of field',
      cameraMotion: 'dolly-in',
      lightingStyle: 'studio-clean',
      transition: 'dissolve',
    };
    onUpdateProject({
      ...project,
      duration: project.duration + 8,
      storyboard: [...project.storyboard, newScene],
    });
    setActiveSceneId(newId);
  };

  const handleStartPublishing = (isGoldenHour: boolean = false) => {
    setIsPublishingModalOpen(true);
    setPublishProgress(15);
    setPublishStepText('Xác thực phân quyền OAuth 2.0 & Token (AES-256)...');
    setIsPublishComplete(false);

    setTimeout(() => {
      setPublishProgress(45);
      setPublishStepText('Đăng tải video lên YouTube Data API v3 & TikTok API...');
    }, 1100);

    setTimeout(() => {
      setPublishProgress(82);
      setPublishStepText('Sao lưu dự án gốc vào Google Drive...');
    }, 2200);

    setTimeout(() => {
      setPublishProgress(100);
      setPublishStepText('Xuất bản thành công trên các kênh!');
      setIsPublishComplete(true);

      const updated: Project = {
        ...project,
        status: isGoldenHour ? 'scheduled' : 'published',
        scheduledTime: isGoldenHour ? (project.scheduledTime || '19:30 - Tối nay (Khung giờ vàng)') : undefined,
        driveBackupUrl: 'https://drive.google.com/drive/folders/AutoVideo_Backup_VIP001',
        publishedUrls: {
          youtube: 'https://youtube.com/watch?v=sample_ai_video',
          tiktok: 'https://tiktok.com/@creator/video/sample_ai_short',
          facebook: 'https://facebook.com/reel/sample_ai_reel',
        },
      };
      onUpdateProject(updated);
    }, 3400);
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
        const newSeed = (Date.now() % 8000) + sceneId * 37;
        return {
          ...s,
          visualPrompt: editingPromptText,
          cameraMotion: inferCameraFromPrompt(editingPromptText, s.cameraMotion),
          lightingStyle: inferLightingFromPrompt(editingPromptText, s.lightingStyle),
          imageUrl: buildAiSceneImageUrl(editingPromptText, aspectRatio, newSeed),
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
          imageUrl: buildAiSceneImageUrl(s.visualPrompt, aspectRatio, newSeed),
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
              {project.status === 'pending_approval' ? (
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
            <p className="text-zinc-500 text-xs mt-1 flex items-center gap-2">
              <span>Thời lượng:</span>
              <strong className="text-zinc-900 font-mono font-medium">{formatSeconds(project.duration)}</strong>
              <span>•</span>
              <span>Động cơ:</span>
              <span className="text-zinc-700 font-medium">{project.aiSource.name}</span>
            </p>
          </div>
        </div>

        {/* Cửa sổ 2: Trình Ghép Nối Clip 5-10 phút */}
        <button
          onClick={() => onOpenStitcherStudio(project)}
          className="btn-secondary cursor-pointer"
        >
          <Film className="w-3.5 h-3.5 text-zinc-600" />
          <span>Ghép Nối Clip (5–10 phút)</span>
        </button>
      </div>

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
              onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
            />

            {/* Audio Track Info Pod */}
            <div className="p-3 rounded-lg bg-zinc-50 border border-black/[0.05] flex items-center justify-between text-xs text-zinc-600">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-white border border-black/[0.06] flex items-center justify-center text-zinc-700">
                  <Volume2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-zinc-900 font-semibold">{project.musicTrack.name}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">Bản quyền thương mại • {project.musicTrack.license}</div>
                </div>
              </div>

              {/* Minimal Waveform */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-end gap-0.5 h-3.5">
                  <div className="w-1 bg-zinc-900 rounded-full wave-bar-1"></div>
                  <div className="w-1 bg-zinc-900 rounded-full wave-bar-2"></div>
                  <div className="w-1 bg-zinc-900 rounded-full wave-bar-3"></div>
                  <div className="w-1 bg-zinc-900 rounded-full wave-bar-4"></div>
                </div>
                <span className="text-[10px] font-mono font-medium text-zinc-700 bg-white px-1.5 py-0.2 rounded border border-black/[0.06]">
                  {project.musicTrack.volume}%
                </span>
              </div>
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
                  onClick={() => handleStartPublishing(true)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium border border-black/[0.06] transition flex items-center gap-1.5 cursor-pointer"
                  title="Hẹn giờ tự động đăng vào khung giờ vàng 19:30"
                >
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Đăng Giờ Vàng (19:30)</span>
                </button>
              </div>

              {/* Primary Approval Action Button */}
              <button
                onClick={() => handleStartPublishing(false)}
                className="btn-primary cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>PHÊ DUYỆT & ĐĂNG NGAY</span>
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
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-mono font-bold ${isCurrentScene
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-black/[0.08] text-zinc-700'
                            }`}>
                            {scene.sceneNumber}
                          </span>
                          <span className="text-zinc-900 font-semibold text-[11px]">
                            {scene.headline || `Cảnh ${scene.sceneNumber}`}
                          </span>
                          {scene.cameraMotion && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-100/80 text-indigo-700 font-mono text-[9px] uppercase">
                              🎥 {scene.cameraMotion}
                            </span>
                          )}
                          {scene.customMediaUrl && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800 font-mono text-[9px]">
                              B-Roll riêng
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVoiceStudioTargetSceneId(scene.id);
                              setIsVoiceStudioOpen(true);
                            }}
                            className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 text-indigo-600 border border-black/[0.06] text-[9px] font-mono flex items-center gap-0.5 transition cursor-pointer"
                            title="Tùy chỉnh giọng đọc riêng cho cảnh này"
                          >
                            <Mic className="w-2.5 h-2.5" />
                            <span>Giọng</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegenerateSceneVisual(scene.id);
                            }}
                            className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 text-zinc-600 hover:text-indigo-600 border border-black/[0.06] text-[9px] font-mono flex items-center gap-1 transition cursor-pointer"
                            title="Tạo lại khung hình AI mới cho cảnh này"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>Render lại ảnh</span>
                          </button>
                          <span className="font-mono text-zinc-500 text-[10px] bg-white px-1.5 py-0.2 rounded border border-black/[0.04]">
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

                        {/* Quick Cinematic Camera Presets (1-Click Inject) */}
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="text-[9px] text-zinc-400 font-mono">Gợi ý:</span>
                          {[
                            { label: '+ Dolly In', tag: 'Cinematic Dolly In camera motion, smooth forward push' },
                            { label: '+ Orbit 360°', tag: 'Smooth 360-degree orbit shot around subject' },
                            { label: '+ FPV Drone', tag: 'Dynamic FPV drone dive weave shot' },
                            { label: '+ 35mm Lens', tag: 'Shot on 35mm anamorphic lens, shallow depth of field' },
                            { label: '+ Volumetric Rays', tag: 'Atmospheric volumetric god rays, cinematic lighting' },
                            { label: '+ Jump-Cut 2.5s', tag: 'Fast-paced 2.5s jump cut retention pacing' },
                          ].map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              onClick={() => handleInjectCameraTag(scene.id, preset.tag)}
                              className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-600 text-zinc-600 border border-black/5 transition cursor-pointer"
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
                {isPublishComplete ? 'Xuất Bản Thành Công' : 'Đang Đăng Tải Đa Nền Tảng...'}
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
                <div className="flex items-center justify-center gap-2">
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-xs flex items-center gap-1"
                  >
                    <span>YouTube</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                  <a
                    href="https://drive.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-xs flex items-center gap-1"
                  >
                    <span>Drive Backup</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
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
              <h3 className="text-zinc-950 font-bold text-sm">Chỉnh Sửa Kịch Bản AI</h3>
            </div>
            <p className="text-zinc-500 text-xs">
              Nhập chỉ dẫn biên tập các phân cảnh kịch bản:
            </p>

            <textarea
              rows={4}
              placeholder="VD: Rút ngắn cảnh mở đầu còn 5 giây, đổi phong cách dẫn truyện sang sôi nổi hơn..."
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
                  if (revisionPrompt.trim()) {
                    const updatedStoryboard = project.storyboard.map((s, idx) => {
                      const nextPrompt = `${s.visualPrompt}, ${revisionPrompt.trim()}`;
                      const newSeed = (Date.now() % 9000) + idx * 101;
                      return {
                        ...s,
                        visualPrompt: nextPrompt,
                        cameraMotion: inferCameraFromPrompt(nextPrompt, s.cameraMotion),
                        lightingStyle: inferLightingFromPrompt(nextPrompt, s.lightingStyle),
                        imageUrl: buildAiSceneImageUrl(nextPrompt, aspectRatio, newSeed),
                      };
                    });
                    onUpdateProject({
                      ...project,
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

      {/* PHÒNG THU LỒNG TIẾNG AI MODAL */}
      <VoiceStudioModal
        isOpen={isVoiceStudioOpen}
        onClose={() => setIsVoiceStudioOpen(false)}
        activeVoiceId={
          project.storyboard.find((s) => s.id === (voiceStudioTargetSceneId || activeSceneId))?.voiceId ||
          project.voiceoverTrack?.voiceName
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
        onApplyVoice={handleApplyVoiceSettings}
      />

      {/* BẢNG TRA CỨU PHÍM TẮT NLE */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
};
