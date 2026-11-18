import React, { useState, useEffect } from 'react';
import { CoreVideoRepo, Skill } from '../types';
import { SYSTEM_CORE_VIDEO_REPOS } from '../data/mockData';
import { Sparkles, Plus, Upload, Trash2, X, Play, GitBranch, ExternalLink, CheckCircle2, Cpu, Film } from 'lucide-react';

export const CORE_VIDEO_REPOS_STORAGE_KEY = 'synapes_core_video_repos_v1';

interface SkillsManagerViewProps {
  skills: Skill[];
  onAddSkill: (newSkill: Skill) => void;
  onDeleteSkill: (id: string) => void;
  onBack?: () => void;
}

export const SkillsManagerView: React.FC<SkillsManagerViewProps> = ({
  skills,
  onAddSkill,
  onDeleteSkill,
  onBack,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddRepoModal, setShowAddRepoModal] = useState(false);
  const [activeSampleVideo, setActiveSampleVideo] = useState<{ title: string; url: string; subtitle: string } | null>(null);

  const [coreRepos, setCoreRepos] = useState<CoreVideoRepo[]>(() => {
    try {
      const saved = localStorage.getItem(CORE_VIDEO_REPOS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sysById = new Map(SYSTEM_CORE_VIDEO_REPOS.map((r) => [r.id, r]));
          const existingIds = new Set(parsed.map((r: CoreVideoRepo) => r.id));
          const refreshed = parsed.map((r: CoreVideoRepo) => {
            const sys = sysById.get(r.id);
            return sys ? { ...sys, enabled: r.enabled } : r;
          });
          const merged = [
            ...SYSTEM_CORE_VIDEO_REPOS.filter((s) => !existingIds.has(s.id)),
            ...refreshed,
          ];
          return merged;
        }
      }
    } catch { }
    return SYSTEM_CORE_VIDEO_REPOS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(CORE_VIDEO_REPOS_STORAGE_KEY, JSON.stringify(coreRepos));
    } catch { }
  }, [coreRepos]);

  // Add Repo State
  const [repoName, setRepoName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [repoRole, setRepoRole] = useState('');
  const [repoCapabilities, setRepoCapabilities] = useState('3D Character Rigging, Video Editing, Motion Graphics');
  const [isVerifyingRepo, setIsVerifyingRepo] = useState(false);
  const [repoInspectError, setRepoInspectError] = useState<string | null>(null);

  // Add Slash Skill State
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [category] = useState('Công nghệ');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  const handleToggleCoreRepo = (repoId: string) => {
    setCoreRepos((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleAddCoreRepoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetInput = (repoName.trim() || repoUrl.trim());
    if (!targetInput || isVerifyingRepo) return;

    setIsVerifyingRepo(true);
    setRepoInspectError(null);
    try {
      const resp = await fetch('/api/github-repo/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: repoName.trim(),
          repoUrl: repoUrl.trim(),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.success) {
        setRepoInspectError(
          data?.error || 'Không xác thực được kho mã nguồn trên GitHub API. Vui lòng kiểm tra lại owner/repo.'
        );
        return;
      }

      const customCaps = repoCapabilities
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const mergedCaps = Array.from(new Set([...(data.capabilities || []), ...customCaps])).slice(0, 5);

      const newRepo: CoreVideoRepo = {
        id: `core-gh-${Date.now()}`,
        repo: data.repo,
        repoUrl: data.repoUrl,
        title: `${data.repo} (${data.language || 'Open Source'})`,
        stars: data.stars || 'Verified ★',
        roleInEngine:
          repoRole.trim() ||
          data.description ||
          'Đã xác thực từ GitHub API và tích hợp vào pipeline biên kịch & AiCinemaPlayer.',
        capabilities: mergedCaps,
        enabled: true,
        sampleVideoUrl: data.sampleVideoUrl || '/skill-samples/editly-sample.webm',
      };
      setCoreRepos((prev) => [newRepo, ...prev.filter((r) => r.repo.toLowerCase() !== newRepo.repo.toLowerCase())]);
      setShowAddRepoModal(false);
      setRepoName('');
      setRepoUrl('');
      setRepoRole('');
      setRepoInspectError(null);
    } catch (err: any) {
      setRepoInspectError(err?.message || 'Lỗi kết nối máy chủ khi xác thực GitHub Repository.');
    } finally {
      setIsVerifyingRepo(false);
    }
  };

  const handleUploadSkillFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const uploadedSkill: Skill = {
          id: `skill-up-${Date.now()}`,
          name: parsed.name || file.name.replace(/\.[^/.]+$/, ''),
          command: parsed.command || `/${file.name.replace(/\.[^/.]+$/, '').toLowerCase()}`,
          category: parsed.category || 'Mở rộng',
          description: parsed.description || 'Kỹ năng nạp từ file cấu hình',
          tone: parsed.tone || 'Chuyên nghiệp',
          defaultTags: parsed.defaultTags || ['AI', 'Video'],
          systemPrompt: parsed.systemPrompt || 'Prompt chuẩn hóa từ tệp tin',
        };
        onAddSkill(uploadedSkill);
        alert(`Đã nạp file skill [${uploadedSkill.name}] thành công!`);
      } catch (err) {
        alert('File không hợp lệ. Vui lòng chọn file JSON định dạng skill chuẩn.');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: name.trim(),
      command: command.startsWith('/') ? command.trim() : `/${command.trim()}`,
      category,
      description: description.trim(),
      tone: tone.trim() || 'Chuyên nghiệp, cuốn hút',
      defaultTags: tagsInput.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean),
      systemPrompt: systemPrompt.trim(),
    };
    onAddSkill(newSkill);
    setShowAddModal(false);
    setName('');
    setCommand('');
    setDescription('');
    setTone('');
    setTagsInput('');
    setSystemPrompt('');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150 select-none text-zinc-900">
      <div className="studio-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-secondary cursor-pointer"
              title="Quay lại bàn duyệt"
            >
              <span>← Quay Lại</span>
            </button>
          )}

          <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-black/[0.06] flex items-center justify-center text-white flex-shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-950 tracking-tight">Kho Skills &amp; Prompts</h2>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-600 text-white tracking-wider">
                LABS
              </span>
            </div>
            <p className="text-zinc-500 text-xs mt-0.5">
              Tích hợp Engine dựng/edit video &amp; nhân vật 3D từ GitHub vào hệ thống &amp; Quản lý mẫu <code>/skill-name</code> kèm video mẫu
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRepoInspectError(null);
              setShowAddRepoModal(true);
            }}
            className="btn-secondary cursor-pointer whitespace-nowrap"
          >
            <GitBranch className="w-3.5 h-3.5 text-emerald-700" />
            <span>+ Tích Hợp Repo GitHub</span>
          </button>

          <label className="btn-secondary cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-zinc-500" />
            <span>Nạp File JSON</span>
            <input
              type="file"
              accept=".json,.yaml,.txt"
              onChange={handleUploadSkillFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Skill</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: CORE GITHUB VIDEO REPOS DIRECTLY INJECTED INTO ENGINE */}
      <div className="studio-card p-4 sm:p-5 space-y-3 border-emerald-500/20 bg-gradient-to-br from-emerald-50/30 via-white to-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-700" />
            <div>
              <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wide">
                Core Video &amp; 3D Character Engines Tích Hợp Trực Tiếp (GitHub Verified)
              </h3>
              <p className="text-[11px] text-zinc-500">
                Các thư viện dựng video NLE, hoạt hình nhân vật 3D &amp; đồ họa mã nguồn mở được kết nối trực tiếp vào AiCinemaPlayer và bộ sinh kịch bản
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Đang kích hoạt: {coreRepos.filter((r) => r.enabled).length}/{coreRepos.length} Engines
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {coreRepos.map((repo) => (
            <div
              key={repo.id}
              className={`p-3.5 rounded-xl border transition flex flex-col justify-between gap-2.5 ${
                repo.enabled
                  ? 'bg-white border-emerald-300/80 shadow-2xs'
                  : 'bg-zinc-50/70 border-black/[0.06] opacity-75'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-zinc-950 truncate">{repo.repo}</span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9.5px] font-mono font-semibold">
                        {repo.stars}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-emerald-800 mt-0.5">{repo.title}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCoreRepo(repo.id)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border cursor-pointer flex-shrink-0 transition ${
                      repo.enabled
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-zinc-500 border-zinc-300 hover:text-zinc-900'
                    }`}
                  >
                    {repo.enabled ? 'ACTIVE ✓' : 'PAUSED'}
                  </button>
                </div>

                <p className="text-[11px] text-zinc-600 leading-relaxed">{repo.roleInEngine}</p>

                <div className="flex flex-wrap gap-1">
                  {repo.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 text-[9.5px] font-mono"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between gap-2 text-[10.5px]">
                {repo.sampleVideoUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSampleVideo({
                        title: `Sản phẩm mẫu • ${repo.repo}`,
                        url: repo.sampleVideoUrl!,
                        subtitle: repo.roleInEngine,
                      })
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-950 text-white font-medium hover:bg-black cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-emerald-400" />
                    <span>Xem Video Demo</span>
                  </button>
                ) : (
                  <span className="text-zinc-400 font-mono">Engine Lõi</span>
                )}
                <a
                  href={repo.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-950 font-mono"
                >
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: SLASH SKILLS WITH SAMPLE PRODUCT VIDEOS */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-zinc-700" />
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wide">
              Slash-Command Skills Kèm Video Sản Phẩm Mẫu ({skills.length})
            </h3>
          </div>
          <span className="text-[10.5px] text-zinc-500">Bấm &ldquo;Xem Sản Phẩm Mẫu&rdquo; để kiểm tra chất lượng đầu ra thực tế</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="studio-card p-4 space-y-2.5 hover:border-black/20 transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-mono font-medium text-xs flex-shrink-0">
                      {skill.command}
                    </span>
                    <span className="text-zinc-950 font-semibold text-xs truncate">{skill.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono flex-shrink-0">
                    {skill.category}
                  </span>
                </div>

                <p className="text-zinc-600 text-xs leading-relaxed">{skill.description}</p>

                <div className="flex flex-wrap gap-1">
                  {skill.defaultTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.2 rounded bg-zinc-50 text-zinc-600 text-[10px] font-mono border border-black/[0.04]"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2.5 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
                <span>Tông giọng: <strong className="text-zinc-800 font-medium">{skill.tone}</strong></span>
                <div className="flex items-center gap-2">
                  {(skill.sampleVideoUrl || '/skill-samples/remotion-sample.webm') && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSampleVideo({
                          title: skill.sampleVideoTitle || `Video Mẫu • ${skill.command}`,
                          url: skill.sampleVideoUrl || '/skill-samples/remotion-sample.webm',
                          subtitle: skill.description,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-semibold cursor-pointer shadow-2xs"
                      data-testid={`play-skill-sample-${skill.id}`}
                    >
                      <Play className="w-3 h-3" />
                      <span>Xem Sản Phẩm Mẫu</span>
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteSkill(skill.id)}
                    className="text-zinc-400 hover:text-red-600 transition p-1 cursor-pointer"
                    title="Xóa skill"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Sample Video Player */}
      {activeSampleVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveSampleVideo(null);
          }}
          data-testid="skill-sample-video-modal"
        >
          <div className="bg-zinc-950 text-white rounded-2xl border border-white/15 max-w-3xl w-full p-4 sm:p-5 shadow-2xl space-y-3 relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{activeSampleVideo.title}</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">{activeSampleVideo.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSampleVideo(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <video
              controls
              autoPlay
              playsInline
              src={activeSampleVideo.url}
              className="w-full rounded-xl bg-black border border-white/10 max-h-[65vh]"
            />
          </div>
        </div>
      )}

      {/* Modal Inject Custom Core GitHub Repo */}
      {showAddRepoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddRepoModal(false);
          }}
        >
          <div className="studio-card max-w-md w-full p-6 shadow-2xl space-y-3.5 text-xs relative">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
              <h3 className="text-zinc-950 font-bold text-sm">Tích Hợp Repo / Engine Video Mới Vào Hệ Thống</h3>
              <button
                type="button"
                onClick={() => setShowAddRepoModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCoreRepoSubmit} className="space-y-3">
              <div>
                <label className="text-zinc-700 font-medium block mb-1">Tên Repo GitHub (owner/repo) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: VideoRetalking / Open-Sora / LivePortrait"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-zinc-700 font-medium block mb-1">URL GitHub / Plugin Engine</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-zinc-700 font-medium block mb-1">Vai trò tích hợp trực tiếp vào lõi Render *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ví dụ: Đồng bộ chuyển động khẩu hình và phân cảnh B-Roll tự động..."
                  value={repoRole}
                  onChange={(e) => setRepoRole(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-zinc-700 font-medium block mb-1">Tính năng cốt lõi (phân tách dấu phẩy)</label>
                <input
                  type="text"
                  value={repoCapabilities}
                  onChange={(e) => setRepoCapabilities(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-1.5 text-xs"
                />
              </div>
              {repoInspectError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] leading-snug">
                  {repoInspectError}
                </div>
              )}
              <div className="pt-2 flex justify-end gap-2 border-t border-black/[0.06]">
                <button type="button" onClick={() => setShowAddRepoModal(false)} className="btn-secondary cursor-pointer">
                  Hủy
                </button>
                <button type="submit" disabled={isVerifyingRepo} className="btn-primary cursor-pointer disabled:opacity-50">
                  {isVerifyingRepo ? 'Đang xác thực GitHub API...' : 'Xác Thực & Tích Hợp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Skill */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="studio-card max-w-md w-full p-6 shadow-2xl space-y-3.5 text-xs relative">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
              <h3 className="text-zinc-950 font-bold text-sm">Tạo Skill Kịch Bản Mới</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Tên Skill *</label>
                  <input
                    type="text"
                    required
                    placeholder="Review Công Nghệ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Cú pháp *</label>
                  <input
                    type="text"
                    required
                    placeholder="/tech-review"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-1.5 text-xs text-zinc-950 font-mono font-medium focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">Mô tả *</label>
                <input
                  type="text"
                  required
                  placeholder="Kịch bản review công nghệ có hook 3 giây đầu..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">System Prompt chỉ đạo AI *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Chia kịch bản thành các phân đoạn 10s..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg p-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono"
                ></textarea>
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
                  Lưu Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
