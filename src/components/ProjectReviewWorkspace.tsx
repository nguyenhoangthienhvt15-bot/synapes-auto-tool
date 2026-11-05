import React, { useState } from 'react';
import { Project } from '../types';
import {
  Play, Volume2, CheckCircle2, Clock,
  Edit3, Film, ExternalLink, Smartphone, Monitor,
  Link2, Search, Sparkles, X, Check
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>(project.aspectRatio);
  const [showSocialMockup, setShowSocialMockup] = useState<'none' | 'tiktok' | 'youtube'>('none');
  const [editingSceneId, setEditingSceneId] = useState<number | null>(null);
  const [editingVoiceoverText, setEditingVoiceoverText] = useState('');

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
                  className={`studio-segmented-item flex items-center gap-1.5 cursor-pointer ${
                    aspectRatio === '16:9' ? 'active' : ''
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> 16:9 (YouTube)
                </button>
                <button
                  onClick={() => setAspectRatio('9:16')}
                  className={`studio-segmented-item flex items-center gap-1.5 cursor-pointer ${
                    aspectRatio === '9:16' ? 'active' : ''
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
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                    showSocialMockup === 'tiktok'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  TikTok
                </button>
                <button
                  onClick={() => setShowSocialMockup(showSocialMockup === 'youtube' ? 'none' : 'youtube')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                    showSocialMockup === 'youtube'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  YouTube
                </button>
              </div>
            </div>

            {/* Video Player Viewport */}
            <div
              className={`w-full mx-auto bg-zinc-950 rounded-xl overflow-hidden relative border border-black/10 flex items-center justify-center ${
                aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16] max-h-[480px]'
              }`}
            >
              <video
                src={project.videoUrl}
                poster={project.thumbnailUrl}
                controls={false}
                playsInline
                loop
                className="w-full h-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* TikTok Overlay Mockup */}
              {showSocialMockup === 'tiktok' && (
                <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between text-white bg-gradient-to-t from-black/80 via-transparent to-black/30">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span>Đang theo dõi</span>
                    <span className="border-b-2 border-white pb-0.5 font-bold">Dành cho bạn</span>
                    <Search className="w-4 h-4 opacity-80" />
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="max-w-[70%] space-y-1 text-xs">
                      <div className="font-semibold text-sm">@synapes_studio</div>
                      <div className="text-[11px] line-clamp-2 text-zinc-200">
                        {project.metadata.title} {project.metadata.tags.map((t) => `#${t} `)}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-300 font-mono">
                        <span>🎵</span>
                        <span>{project.musicTrack.name}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2.5 text-xs font-mono">
                      <div className="flex flex-col items-center">
                        <span className="text-lg">❤️</span>
                        <span className="text-[10px]">12.4K</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-lg">💬</span>
                        <span className="text-[10px]">482</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-lg">🔗</span>
                        <span className="text-[10px]">Chia sẻ</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tactile Play Button */}
              {!isPlaying && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <button
                    onClick={() => {
                      const v = document.querySelector('video');
                      if (v) {
                        v.play();
                        setIsPlaying(true);
                      }
                    }}
                    className="w-12 h-12 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow-lg transition hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Play className="w-5 h-5 ml-0.5 fill-zinc-900 text-zinc-900" />
                  </button>
                </div>
              )}
            </div>

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
                  className={`studio-segmented-item flex-1 text-center cursor-pointer ${
                    activeTab === 'storyboard' ? 'active' : ''
                  }`}
                >
                  Phân Cảnh Kịch Bản ({project.storyboard.length})
                </button>

                <button
                  onClick={() => setActiveTab('metadata')}
                  className={`studio-segmented-item flex-1 text-center cursor-pointer ${
                    activeTab === 'metadata' ? 'active' : ''
                  }`}
                >
                  Nội Dung & Kênh Đăng
                </button>
              </div>
            </div>

            {/* TAB 1: STORYBOARD */}
            {activeTab === 'storyboard' && (
              <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-black/[0.04] text-[11px] text-zinc-500 flex items-center justify-between">
                  <span>Bấm vào lời thoại để sửa trực tiếp</span>
                  <span className="text-zinc-900 font-mono font-semibold">Tổng: {formatSeconds(project.duration)}</span>
                </div>

                {project.storyboard.map((scene) => (
                  <div
                    key={scene.id}
                    className="p-3 rounded-lg bg-zinc-50/70 border border-black/[0.05] hover:border-black/[0.12] transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-white border border-black/[0.08] flex items-center justify-center text-[10px] font-mono font-bold text-zinc-700">
                          {scene.sceneNumber}
                        </span>
                        <span className="text-zinc-900 font-semibold text-[11px]">Cảnh {scene.sceneNumber}</span>
                      </div>
                      <span className="font-mono text-zinc-500 text-[10px] bg-white px-1.5 py-0.2 rounded border border-black/[0.04]">
                        {scene.timeRange}
                      </span>
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

                    {/* Visual Prompt Indicator */}
                    <div className="text-[11px] text-zinc-500 flex items-start gap-1">
                      <span className="text-zinc-700 font-medium text-[10px] font-mono">PROMPT:</span>
                      <span className="text-zinc-500 line-clamp-2 text-[11px]">{scene.visualPrompt}</span>
                    </div>
                  </div>
                ))}
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
                  alert('Đã gửi yêu cầu chỉnh sửa đến AI Engine.');
                  setShowAiRevisionModal(false);
                }}
                className="btn-primary cursor-pointer"
              >
                Gửi Lệnh Sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
