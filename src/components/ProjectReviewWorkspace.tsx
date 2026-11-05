import React, { useState } from 'react';
import { Project } from '../types';
import {
  Play, Volume2, CheckCircle2, Clock,
  Edit3, Film, ExternalLink, Smartphone, Monitor,
  Link2, Search, Sparkles
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
    setPublishProgress(12);
    setPublishStepText('Đang xác thực OAuth 2.0 & Token bảo mật (AES-256)...');
    setIsPublishComplete(false);

    setTimeout(() => {
      setPublishProgress(45);
      setPublishStepText('Đang đăng tải video lên YouTube Data API v3 & TikTok Posting API...');
    }, 1100);

    setTimeout(() => {
      setPublishProgress(82);
      setPublishStepText('Đang đồng bộ và lưu trữ bản gốc vào Google Drive...');
    }, 2200);

    setTimeout(() => {
      setPublishProgress(100);
      setPublishStepText('Xuất bản thành công trên các nền tảng!');
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
    <div className="space-y-4 animate-fade-in text-[#1D1D1F]">
      {/* Top Bar: Apple HIG Clean Card */}
      <div className="apple-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold border border-black/[0.08] transition apple-btn-tap flex items-center gap-1.5 shadow-2xs"
              title="Thoát chế độ duyệt, quay về danh sách tất cả dự án"
            >
              <span>← Quay Lại Dự Án</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-[#1D1D1F] tracking-tight">{project.title}</h2>
              {project.status === 'pending_approval' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF9500] pulse-dot"></span>
                  Chờ duyệt
                </span>
              ) : project.status === 'scheduled' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#0071E3] border border-blue-200 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Đã lên lịch
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Đã xuất bản
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-2">
              <span>Thời lượng:</span>
              <strong className="text-zinc-900 font-numeric font-semibold">{formatSeconds(project.duration)}</strong>
              <span>•</span>
              <span>Động cơ:</span>
              <span className="text-[#0071E3] font-medium">{project.aiSource.name}</span>
            </p>
          </div>
        </div>

        {/* Nút bấm Cửa sổ 2: Trình Ghép Nối Clip 5-10 phút */}
        <button
          onClick={() => onOpenStitcherStudio(project)}
          className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-900 text-xs font-medium border border-black/[0.1] shadow-xs flex items-center gap-2 transition apple-btn-tap"
        >
          <Film className="w-4 h-4 text-[#0071E3]" />
          <span>Mở Trình Ghép Nối Clip (5–10 phút)</span>
        </button>
      </div>

      {/* Main Split-View: Left 58% (Media Stage) - Right 42% (Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ================= CỘT TRÁI (58%): MEDIA STAGE ================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="apple-card p-5 space-y-4">

            {/* Apple Segmented Ratio Switcher & Mockups */}
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] text-xs">
              <div className="apple-segmented-container">
                <button
                  onClick={() => setAspectRatio('16:9')}
                  className={`apple-segmented-item flex items-center gap-1.5 ${aspectRatio === '16:9' ? 'active' : ''
                    }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> 16:9 (YouTube)
                </button>
                <button
                  onClick={() => setAspectRatio('9:16')}
                  className={`apple-segmented-item flex items-center gap-1.5 ${aspectRatio === '9:16' ? 'active' : ''
                    }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> 9:16 (TikTok/Reels)
                </button>
              </div>

              {/* Mockup selector */}
              <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                <span>Lớp phủ:</span>
                <button
                  onClick={() => setShowSocialMockup(showSocialMockup === 'tiktok' ? 'none' : 'tiktok')}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition apple-btn-tap ${showSocialMockup === 'tiktok'
                      ? 'bg-zinc-900 text-white shadow-2xs'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                    }`}
                >
                  TikTok
                </button>
                <button
                  onClick={() => setShowSocialMockup(showSocialMockup === 'youtube' ? 'none' : 'youtube')}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition apple-btn-tap ${showSocialMockup === 'youtube'
                      ? 'bg-zinc-900 text-white shadow-2xs'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                    }`}
                >
                  YouTube
                </button>
              </div>
            </div>

            {/* Video Player Frame with Apple Bezel */}
            <div
              className={`w-full mx-auto bg-black rounded-2xl overflow-hidden relative border border-black/[0.08] flex items-center justify-center shadow-inner ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16] max-h-[500px]'
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
                      <div className="font-semibold text-sm">@synapes_creator</div>
                      <div className="text-[11px] line-clamp-2 text-zinc-200">
                        {project.metadata.title} {project.metadata.tags.map((t) => `#${t} `)}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-300">
                        <span>🎵</span>
                        <span>{project.musicTrack.name}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-3 text-xs">
                      <div className="flex flex-col items-center">
                        <span className="text-xl">❤️</span>
                        <span className="text-[10px]">12.4K</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xl">💬</span>
                        <span className="text-[10px]">482</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xl">🔗</span>
                        <span className="text-[10px]">Chia sẻ</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tactile Play Button */}
              {!isPlaying && (
                <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px] flex items-center justify-center">
                  <button
                    onClick={() => {
                      const v = document.querySelector('video');
                      if (v) {
                        v.play();
                        setIsPlaying(true);
                      }
                    }}
                    className="w-14 h-14 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow-xl transition apple-btn-tap hover:bg-zinc-50"
                  >
                    <Play className="w-6 h-6 ml-1 fill-zinc-900 text-zinc-900" />
                  </button>
                </div>
              )}
            </div>

            {/* Audio Track Info with Soundwave Bars */}
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-black/[0.05] flex items-center justify-between text-xs text-zinc-600">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-zinc-900 font-semibold">{project.musicTrack.name}</div>
                  <div className="text-[10px] text-zinc-400">Bản quyền thương mại • {project.musicTrack.license}</div>
                </div>
              </div>

              {/* Soundwave Bars Indicator */}
              <div className="flex items-center gap-3">
                <div className="flex items-end gap-0.5 h-4">
                  <div className="w-1 bg-emerald-500 rounded-full wave-bar-1"></div>
                  <div className="w-1 bg-emerald-500 rounded-full wave-bar-2"></div>
                  <div className="w-1 bg-emerald-500 rounded-full wave-bar-3"></div>
                  <div className="w-1 bg-emerald-500 rounded-full wave-bar-4"></div>
                </div>
                <span className="text-[11px] font-numeric font-medium text-zinc-700 bg-white px-2 py-0.5 rounded border border-black/[0.06]">
                  {project.musicTrack.volume}%
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAiRevisionModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium border border-black/[0.06] transition apple-btn-tap flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Sửa kịch bản</span>
                </button>
                <button
                  onClick={() => handleStartPublishing(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0071E3] border border-blue-200 text-xs font-medium transition apple-btn-tap flex items-center gap-1.5"
                  title="Hẹn giờ tự động đăng vào khung giờ vàng 19:30"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Đăng Giờ Vàng (19:30)</span>
                </button>
              </div>

              {/* Nút Phê duyệt chính chuẩn Apple Emerald Green */}
              <button
                onClick={() => handleStartPublishing(false)}
                className="px-5 py-2.5 rounded-xl bg-[#34C759] hover:bg-[#30B552] text-white font-semibold text-xs shadow-xs transition apple-btn-tap flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>PHÊ DUYỆT & ĐĂNG NGAY</span>
              </button>
            </div>

          </div>
        </div>

        {/* ================= CỘT PHẢI (42%): PROJECT INSPECTOR ================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="apple-card p-5">

            {/* Apple Segmented Tabs */}
            <div className="pb-4 mb-4 border-b border-black/[0.06]">
              <div className="apple-segmented-container w-full">
                <button
                  onClick={() => setActiveTab('storyboard')}
                  className={`apple-segmented-item flex-1 text-center ${activeTab === 'storyboard' ? 'active' : ''
                    }`}
                >
                  Kịch bản Phân cảnh ({project.storyboard.length})
                </button>

                <button
                  onClick={() => setActiveTab('metadata')}
                  className={`apple-segmented-item flex-1 text-center ${activeTab === 'metadata' ? 'active' : ''
                    }`}
                >
                  Nội dung & Kênh Đăng
                </button>
              </div>
            </div>

            {/* TAB 1: KỊCH BẢN STORYBOARD */}
            {activeTab === 'storyboard' && (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                <div className="p-3 bg-zinc-50 rounded-xl border border-black/[0.04] text-[11px] text-zinc-500 flex items-center justify-between">
                  <span>Bấm vào lời thoại để chỉnh sửa trực tiếp</span>
                  <span className="text-emerald-600 font-numeric font-semibold">Tổng: {formatSeconds(project.duration)}</span>
                </div>

                {project.storyboard.map((scene) => (
                  <div
                    key={scene.id}
                    className="p-3.5 rounded-xl bg-[#FAF9F5] border border-black/[0.06] hover:border-black/[0.12] transition space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-white border border-black/[0.06] flex items-center justify-center text-[10px] font-bold text-zinc-700">
                          {scene.sceneNumber}
                        </span>
                        <span className="text-zinc-900 font-semibold">Cảnh {scene.sceneNumber}</span>
                      </div>
                      <span className="font-numeric text-zinc-500 text-[11px] bg-white px-2 py-0.5 rounded-md border border-black/[0.04]">
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
                            className="w-full bg-white border border-[#0071E3] rounded-xl p-2.5 text-xs text-zinc-900 focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingSceneId(null)}
                              className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-900"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSaveSceneEdit(scene.id)}
                              className="px-3.5 py-1 bg-[#0071E3] text-white rounded-lg text-xs font-medium"
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
                          className="text-xs text-zinc-700 leading-relaxed cursor-pointer p-2 rounded-xl bg-white hover:bg-zinc-50 border border-transparent hover:border-black/[0.08] transition"
                          title="Bấm để sửa lời thoại"
                        >
                          "{scene.voiceover}"
                        </p>
                      )}
                    </div>

                    {/* Visual Prompt Pill */}
                    <div className="text-[11px] text-zinc-500 flex items-start gap-1">
                      <span className="text-zinc-700 font-medium">Prompt:</span>
                      <span className="italic text-zinc-500 line-clamp-2">{scene.visualPrompt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: NỘI DUNG & KÊNH ĐĂNG */}
            {activeTab === 'metadata' && (
              <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1 text-xs">
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
                    className="w-full bg-white border border-black/[0.1] rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#0071E3]"
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
                    className="w-full bg-white border border-black/[0.1] rounded-xl p-3 text-xs text-zinc-800 focus:outline-none focus:border-[#0071E3] leading-relaxed"
                  ></textarea>
                </div>

                {/* Thẻ Tags */}
                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Thẻ Tags (Hashtags)</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {project.metadata.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-black/[0.06] text-[11px] font-mono flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="text-zinc-400 hover:text-zinc-800 ml-0.5"
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
                      className="flex-1 bg-white border border-black/[0.1] rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-[#0071E3]"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-medium apple-btn-tap"
                    >
                      Thêm
                    </button>
                  </div>
                </div>

                {/* Link sản phẩm */}
                <div>
                  <label className="text-zinc-700 font-medium block mb-1 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-emerald-600" />
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
                    className="w-full bg-white border border-black/[0.1] rounded-xl px-3 py-2 text-xs text-emerald-700 font-mono focus:outline-none focus:border-[#0071E3]"
                  />
                </div>

                {/* Kênh phát sóng */}
                <div className="pt-2 border-t border-black/[0.06]">
                  <label className="text-zinc-700 font-medium block mb-2">Kênh xuất bản đồng thời:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['youtube', 'tiktok', 'facebook'].map((chan) => (
                      <label
                        key={chan}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 border border-black/[0.04] cursor-pointer hover:bg-zinc-100 transition"
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
                          className="rounded text-[#34C759] focus:ring-0"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="apple-card p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            {/* Nút X Thoát / Hủy */}
            <button
              onClick={() => setIsPublishingModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-black/[0.05] transition"
              title="Đóng / Hủy cửa sổ xuất bản"
            >
              ✕
            </button>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">
                {isPublishComplete ? 'Đã Xuất Bản Thành Công' : 'Đang Đăng Tải Đa Nền Tảng...'}
              </h3>
              <p className="text-zinc-500 text-xs mt-1">{publishStepText}</p>
            </div>

            <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden shimmer-active">
              <div
                className="bg-[#34C759] h-full rounded-full transition-all duration-300"
                style={{ width: `${publishProgress}%` }}
              ></div>
            </div>

            {!isPublishComplete && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPublishingModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-medium transition apple-btn-tap"
                >
                  Hủy Bỏ / Dừng Đăng
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
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs flex items-center gap-1 transition"
                  >
                    <span>Xem YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://drive.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs flex items-center gap-1 transition"
                  >
                    <span>Mở Drive Backup</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <button
                  onClick={() => setIsPublishingModalOpen(false)}
                  className="w-full py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-medium transition apple-btn-tap"
                >
                  Đóng & Hoàn Tất
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL YÊU CẦU AI SỬA LẠI */}
      {showAiRevisionModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAiRevisionModal(false);
          }}
        >
          <div className="apple-card p-6 max-w-md w-full shadow-2xl relative">
            {/* Nút X Thoát */}
            <button
              onClick={() => setShowAiRevisionModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-black/[0.05] transition"
              title="Đóng cửa sổ sửa kịch bản"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#AF52DE]" />
              <h3 className="text-zinc-900 font-bold text-sm">Yêu cầu Chỉnh Sửa Kịch Bản AI</h3>
            </div>
            <p className="text-zinc-500 text-xs mb-3">
              Nhập chỉ dẫn biên tập lại các phân cảnh kịch bản:
            </p>

            <textarea
              rows={4}
              placeholder="VD: Rút ngắn cảnh mở đầu còn 5 giây, đổi phong cách dẫn truyện sang sôi nổi hơn..."
              value={revisionPrompt}
              onChange={(e) => setRevisionPrompt(e.target.value)}
              className="w-full bg-white border border-black/[0.1] rounded-xl p-3 text-xs text-zinc-900 focus:outline-none focus:border-[#0071E3]"
            ></textarea>

            <div className="mt-4 flex justify-end gap-2 border-t border-black/[0.06] pt-3">
              <button
                onClick={() => setShowAiRevisionModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-medium transition apple-btn-tap"
              >
                Hủy / Thoát
              </button>
              <button
                onClick={() => {
                  alert('Đã gửi yêu cầu chỉnh sửa đến AI Engine.');
                  setShowAiRevisionModal(false);
                }}
                className="px-4 py-1.5 bg-[#0071E3] text-white rounded-xl text-xs font-medium apple-btn-tap"
              >
                Gửi Lệnh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
