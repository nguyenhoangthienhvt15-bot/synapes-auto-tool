import React, { useState } from 'react';
import { Project, UserAccount } from '../types';
import {
  Plus,
  Search,
  Filter,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Calendar,
  ExternalLink,
  Tag,
  Film,
  Mic,
  Share2,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TiktokIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.32a6.34 6.34 0 0 0-.85-.06A6.34 6.34 0 0 0 3.14 15.6a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.86-4.49V8.52a8.27 8.27 0 0 0 4.88 1.62V6.69z" />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface ProjectsListViewProps {
  currentUser: UserAccount;
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onCreateNewProject: () => void;
  onUpdateProject?: (updated: Project) => void;
  onOpenSchedule?: (p: Project) => void;
}

type PlatformFilter = 'all' | 'youtube' | 'tiktok' | 'facebook';
type StatusFilter = 'all' | 'pending_approval' | 'scheduled' | 'published';

export const ProjectsListView: React.FC<ProjectsListViewProps> = ({
  currentUser,
  projects,
  onSelectProject,
  onCreateNewProject,
  onOpenSchedule,
}) => {
  // Bộ lọc
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [aspectFilter, setAspectFilter] = useState<'all' | '16:9' | '9:16'>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Chế độ xem: Grid vs List
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');

  // Danh sách các project ID đang mở rộng chi tiết
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleExpandAll = () => {
    const allExpanded = projects.every((p) => expandedIds[p.id]);
    if (allExpanded) {
      setExpandedIds({});
    } else {
      const next: Record<string, boolean> = {};
      projects.forEach((p) => {
        next[p.id] = true;
      });
      setExpandedIds(next);
    }
  };

  // Đếm số lượng theo nền tảng
  const youtubeCount = projects.filter((p) => p.targetChannels.includes('youtube')).length;
  const tiktokCount = projects.filter((p) => p.targetChannels.includes('tiktok')).length;
  const facebookCount = projects.filter((p) => p.targetChannels.includes('facebook')).length;

  // Lọc danh sách
  const filteredProjects = projects.filter((p) => {
    if (platformFilter !== 'all' && !p.targetChannels.includes(platformFilter)) {
      return false;
    }
    if (statusFilter !== 'all' && p.status !== statusFilter) {
      return false;
    }
    if (aspectFilter !== 'all' && p.aspectRatio !== aspectFilter) {
      return false;
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(kw);
      const matchDesc = p.metadata.description?.toLowerCase().includes(kw);
      const matchTags = p.metadata.tags?.some((t) => t.toLowerCase().includes(kw));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Header Bar */}
      <div className="studio-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-950 tracking-tight">
              Tất Cả Dự Án Của {currentUser.name}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-mono font-bold">
              {projects.length} Video
            </span>
          </div>
          <p className="text-zinc-500 text-xs mt-0.5">
            Phân loại rõ nét theo kênh phát sóng (YouTube, TikTok, Facebook) kèm biểu mở rộng thông số kỹ thuật, kịch bản và giờ đăng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleExpandAll}
            className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer"
            title="Mở rộng / Thu gọn toàn bộ biểu chi tiết"
          >
            {projects.every((p) => expandedIds[p.id]) ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Thu Gọn Hết</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Mở Rộng Chi Tiết</span>
              </>
            )}
          </button>

          <button
            onClick={onCreateNewProject}
            className="btn-primary cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Dự Án Mới</span>
          </button>
        </div>
      </div>

      {/* FILTER & CLASSIFICATION BAR */}
      <div className="studio-card p-3.5 space-y-3">
        {/* Row 1: Platform Tags Filter (Bổ sung rõ phân loại theo Tag) */}
        <div>
          <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>PHÂN LOẠI THEO KÊNH PHÁT SÓNG (TAGS)</span>
            <span className="text-zinc-500 font-sans">Chọn để lọc video theo từng nền tảng</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tag Tất Cả */}
            <button
              type="button"
              onClick={() => setPlatformFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                platformFilter === 'all'
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-2xs'
                  : 'bg-white hover:bg-zinc-50 border-black/10 text-zinc-700'
              }`}
            >
              <span>Tất Cả Kênh</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/10">
                {projects.length}
              </span>
            </button>

            {/* Tag YouTube (16:9 & Shorts) */}
            <button
              type="button"
              onClick={() => setPlatformFilter('youtube')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                platformFilter === 'youtube'
                  ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                  : 'bg-red-50/80 hover:bg-red-100/80 text-red-700 border-red-200'
              }`}
            >
              <YoutubeIcon className={`w-3.5 h-3.5 ${platformFilter === 'youtube' ? 'text-white' : 'text-red-600'}`} />
              <span>Video YouTube (16:9)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${platformFilter === 'youtube' ? 'bg-white/20 text-white' : 'bg-red-200/70 text-red-800'}`}>
                {youtubeCount}
              </span>
            </button>

            {/* Tag TikTok (9:16) */}
            <button
              type="button"
              onClick={() => setPlatformFilter('tiktok')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                platformFilter === 'tiktok'
                  ? 'bg-zinc-950 text-cyan-400 border-zinc-950 shadow-2xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
              }`}
            >
              <TiktokIcon className={`w-3.5 h-3.5 ${platformFilter === 'tiktok' ? 'text-cyan-400' : 'text-zinc-900'}`} />
              <span>TikTok Shorts (9:16)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${platformFilter === 'tiktok' ? 'bg-white/10 text-cyan-300' : 'bg-zinc-300/80 text-zinc-800'}`}>
                {tiktokCount}
              </span>
            </button>

            {/* Tag Facebook (Reels & Feed) */}
            <button
              type="button"
              onClick={() => setPlatformFilter('facebook')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                platformFilter === 'facebook'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 border-blue-200'
              }`}
            >
              <FacebookIcon className={`w-3.5 h-3.5 ${platformFilter === 'facebook' ? 'text-white' : 'text-blue-600'}`} />
              <span>Facebook Reels</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${platformFilter === 'facebook' ? 'bg-white/20 text-white' : 'bg-blue-200/70 text-blue-800'}`}>
                {facebookCount}
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: Search, Status, Aspect Ratio, Display Mode */}
        <div className="pt-2 border-t border-black/5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm dự án theo tên, chủ đề, tag..."
                className="w-full bg-white border border-black/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="bg-white border border-black/10 rounded-xl px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending_approval">⏳ Chờ duyệt (Pending)</option>
              <option value="scheduled">🕒 Đã lên lịch</option>
              <option value="published">🟢 Đã phát sóng</option>
            </select>

            {/* Aspect Ratio Filter */}
            <select
              value={aspectFilter}
              onChange={(e) => setAspectFilter(e.target.value as any)}
              className="bg-white border border-black/10 rounded-xl px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none"
            >
              <option value="all">Tất cả khung hình</option>
              <option value="16:9">16:9 Ngang (YouTube)</option>
              <option value="9:16">9:16 Dọc (Shorts/TikTok)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-black/5">
            <button
              onClick={() => setDisplayMode('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                displayMode === 'grid' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-500'
              }`}
              title="Xem dạng thẻ lưới"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDisplayMode('list')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                displayMode === 'list' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-500'
              }`}
              title="Xem dạng danh sách mở rộng"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* PROJECT CARDS / LIST */}
      {filteredProjects.length === 0 ? (
        <div className="studio-card p-12 text-center space-y-3">
          <Film className="w-8 h-8 text-zinc-400 mx-auto" />
          <p className="text-xs text-zinc-500">
            Không tìm thấy dự án nào phù hợp với bộ lọc hiện tại.
          </p>
          <button
            onClick={() => {
              setPlatformFilter('all');
              setStatusFilter('all');
              setAspectFilter('all');
              setSearchKeyword('');
            }}
            className="btn-secondary text-xs inline-flex items-center gap-1"
          >
            Đặt Lại Bộ Lọc
          </button>
        </div>
      ) : (
        <div
          className={
            displayMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {filteredProjects.map((proj) => {
            const isExpanded = Boolean(expandedIds[proj.id]);
            const isYt = proj.targetChannels.includes('youtube');
            const isTt = proj.targetChannels.includes('tiktok');
            const isFb = proj.targetChannels.includes('facebook');

            return (
              <div
                key={proj.id}
                className="studio-card studio-card-hover overflow-hidden transition flex flex-col justify-between group border border-black/10 hover:border-zinc-950"
              >
                {/* Card Top: Thumbnail & Tags */}
                <div>
                  <div
                    onClick={() => onSelectProject(proj)}
                    className="aspect-video w-full bg-zinc-950 relative overflow-hidden cursor-pointer"
                  >
                    <img
                      src={proj.thumbnailUrl}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg">
                        <span className="text-xs ml-0.5">▶</span>
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-white font-mono text-[10px] font-medium border border-white/10">
                      {Math.floor(proj.duration / 60)}:{((proj.duration % 60)).toString().padStart(2, '0')}
                    </span>

                    {/* Aspect Ratio Badge */}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-zinc-200 text-[10px] font-mono border border-white/10">
                      {proj.aspectRatio}
                    </span>

                    {/* Platform Tag Badges (Bổ sung rõ ràng trên thẻ) */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {isYt && (
                        <span className="px-1.5 py-0.5 rounded bg-red-600/90 backdrop-blur-xs text-white text-[9px] font-bold flex items-center gap-0.5 shadow-sm">
                          <YoutubeIcon className="w-2.5 h-2.5" />
                          <span>YouTube</span>
                        </span>
                      )}
                      {isTt && (
                        <span className="px-1.5 py-0.5 rounded bg-black/90 backdrop-blur-xs text-cyan-300 text-[9px] font-bold flex items-center gap-0.5 shadow-sm">
                          <TiktokIcon className="w-2.5 h-2.5" />
                          <span>TikTok</span>
                        </span>
                      )}
                      {isFb && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-600/90 backdrop-blur-xs text-white text-[9px] font-bold flex items-center gap-0.5 shadow-sm">
                          <FacebookIcon className="w-2.5 h-2.5" />
                          <span>Reels</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        onClick={() => onSelectProject(proj)}
                        className="text-zinc-950 font-bold text-xs line-clamp-2 hover:text-zinc-700 cursor-pointer transition leading-snug"
                      >
                        {proj.title}
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => toggleExpand(proj.id, e)}
                        className="p-1 rounded-md hover:bg-zinc-100 text-zinc-500 transition cursor-pointer flex-shrink-0"
                        title={isExpanded ? 'Thu gọn' : 'Xem biểu mở rộng chi tiết'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-900" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <p className="text-zinc-500 text-[11px] line-clamp-2 leading-relaxed">
                      {proj.metadata.description}
                    </p>

                    {/* Quick Row: Giờ Đăng & Trạng Thái */}
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-zinc-600">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span className="font-mono text-[10px] font-medium">
                          {proj.scheduledTime || 'Chưa hẹn giờ'}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          proj.status === 'published'
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : proj.status === 'scheduled'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        {proj.status === 'published'
                          ? 'Đã phát sóng'
                          : proj.status === 'scheduled'
                            ? 'Đã lên lịch'
                            : 'Chờ duyệt'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BIỂU MỞ RỘNG (EXPANDABLE DETAIL ACCORDION) */}
                {isExpanded && (
                  <div className="p-3.5 bg-zinc-50/90 border-t border-black/[0.08] text-xs space-y-2.5 animate-fade-in">
                    <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                      THÔNG SỐ MỞ RỘNG & KẾ HOẠCH XUẤT BẢN
                    </div>

                    {/* Chủ đề chính */}
                    <div className="p-2 rounded-lg bg-white border border-black/5 space-y-0.5">
                      <div className="text-[10px] font-mono text-zinc-400">CHỦ ĐỀ KỊCH BẢN (TOPIC):</div>
                      <div className="font-bold text-zinc-900 text-[11px]">
                        {proj.title}
                      </div>
                    </div>

                    {/* Giờ đăng & Kế hoạch phát sóng */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-white border border-black/5">
                        <div className="text-[10px] font-mono text-zinc-400">GIỜ PHÁT SÓNG:</div>
                        <div className="font-mono font-bold text-emerald-700 mt-0.5">
                          {proj.scheduledTime || '⚠️ Chưa hẹn giờ'}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-black/5">
                        <div className="text-[10px] font-mono text-zinc-400">ĐỘ PHÂN GIẢI:</div>
                        <div className="font-mono font-bold text-zinc-800 mt-0.5">
                          {proj.aspectRatio === '16:9' ? '1080p (1920x1080)' : '1080p (1080x1920)'}
                        </div>
                      </div>
                    </div>

                    {/* Phân cảnh & Giọng đọc */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-white border border-black/5">
                        <div className="text-[10px] font-mono text-zinc-400">SỐ PHÂN CẢNH:</div>
                        <div className="font-mono font-bold text-zinc-800 mt-0.5">
                          {proj.storyboard?.length || 5} phân cảnh (Scenes)
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-black/5">
                        <div className="text-[10px] font-mono text-zinc-400">ĐỘNG CƠ AI:</div>
                        <div className="font-mono font-bold text-zinc-800 mt-0.5 truncate">
                          {proj.aiSource?.name || 'Google Gemini 2.0'}
                        </div>
                      </div>
                    </div>

                    {/* Hook mở đầu kịch bản */}
                    {proj.storyboard && proj.storyboard[0] && (
                      <div className="p-2 rounded-lg bg-white border border-black/5">
                        <div className="text-[10px] font-mono text-zinc-400">HOOK MỞ ĐẦU (SCENE 1):</div>
                        <p className="text-[11px] text-zinc-700 italic line-clamp-2 mt-0.5 leading-relaxed">
                          "{proj.storyboard[0].voiceover}"
                        </p>
                      </div>
                    )}

                    {/* Thẻ Tags */}
                    {proj.metadata.tags && proj.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {proj.metadata.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-zinc-200/70 text-zinc-700 text-[10px] font-mono"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action buttons inside expanded */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-black/5">
                      <button
                        type="button"
                        onClick={() => onOpenSchedule?.(proj)}
                        className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1 cursor-pointer"
                      >
                        <Calendar className="w-3 h-3 text-zinc-600" />
                        <span>Hẹn Giờ Vàng</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectProject(proj)}
                        className="btn-primary text-xs px-3 py-1 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Bàn Duyệt Kịch Bản</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Bar: Action to view or expand */}
                <div className="px-3.5 py-2.5 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-zinc-500 bg-zinc-50/50">
                  <span className="capitalize text-zinc-600 font-mono text-[10px] font-semibold">
                    {proj.targetChannels.join(' • ')}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => toggleExpand(proj.id, e)}
                    className="text-[11px] font-bold text-zinc-800 hover:text-black flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Thu gọn' : 'Biểu mở rộng'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
