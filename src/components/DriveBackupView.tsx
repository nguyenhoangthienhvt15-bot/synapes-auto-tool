import React, { useState, useEffect } from 'react';
import { Project, UserAccount } from '../types';
import { HardDrive, ExternalLink, CheckCircle2, Folder, ArrowLeft, LogIn, X, Check, ShieldCheck, AlertCircle, Download, FileText, Film, CloudUpload } from 'lucide-react';

interface DriveBackupViewProps {
  currentUser?: UserAccount | null;
  projects: Project[];
  driveEmail?: string;
  isConnected?: boolean;
  onUpdateDrive?: (email: string, isConnected: boolean) => void;
  onOpenLogin?: () => void;
  onBack?: () => void;
}

interface DriveArchivePayload {
  projectId: string;
  title: string;
  format: string;
  aspectRatio: string;
  syncedAt: string;
  driveEmail?: string;
  externalFolderUrl?: string;
  thumbnailUrl?: string;
  hasCustomAudio?: boolean;
  sceneCount: number;
  srtContent: string;
  storyboard: Array<{
    sceneNumber: number;
    startTime: number;
    endTime: number;
    dialogue: string;
    visualNotes: string;
    imageUrl?: string;
  }>;
}

function buildLocalArchiveManifest(project: Project, driveEmail: string, externalFolderUrl: string): DriveArchivePayload {
  const scenes = Array.isArray(project.storyboard) ? project.storyboard : [];
  const pad2 = (n: number) => String(Math.floor(n)).padStart(2, '0');
  const formatSrt = (sec: number) => {
    const s = Math.max(0, Number(sec) || 0);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    const ms = Math.round((s - Math.floor(s)) * 1000);
    return `${pad2(hrs)}:${pad2(mins)}:${pad2(secs)},${String(ms).padStart(3, '0')}`;
  };
  const srtContent = scenes
    .map((sc, idx) => {
      const start = Number(sc.startSec ?? idx * 8);
      const end = Number(sc.endSec ?? start + 8);
      return `${idx + 1}\n${formatSrt(start)} --> ${formatSrt(end)}\n${(sc.voiceover || sc.visualPrompt || sc.headline || `Phân cảnh ${idx + 1}`).trim()}`;
    })
    .join('\n\n');

  return {
    projectId: project.id,
    title: project.title,
    format: project.platformFormat || project.videoGenre || 'youtube',
    aspectRatio: project.aspectRatio,
    syncedAt: new Date().toISOString(),
    driveEmail,
    externalFolderUrl,
    thumbnailUrl: project.thumbnailUrl,
    hasCustomAudio: Boolean(project.customAudioUrl),
    sceneCount: scenes.length,
    srtContent,
    storyboard: scenes.map((sc, idx) => ({
      sceneNumber: sc.sceneNumber || idx + 1,
      startTime: Number(sc.startSec ?? idx * 8),
      endTime: Number(sc.endSec ?? (idx + 1) * 8),
      dialogue: sc.voiceover || '',
      visualNotes: sc.visualPrompt || sc.headline || '',
      imageUrl: sc.imageUrl || '',
    })),
  };
}

export const DriveBackupView: React.FC<DriveBackupViewProps> = ({
  currentUser,
  projects,
  driveEmail: propsDriveEmail,
  isConnected: propsIsConnected,
  onUpdateDrive,
  onOpenLogin,
  onBack,
}) => {
  const publishedProjects = projects.filter(
    (p) => Boolean(p.driveBackupUrl) || p.status === 'published' || p.status === 'scheduled'
  );

  const [driveEmail, setDriveEmail] = useState<string>(() => {
    if (propsDriveEmail !== undefined) return propsDriveEmail;
    try {
      return localStorage.getItem('synapes_drive_email') || '';
    } catch {
      return '';
    }
  });

  const [isConnected, setIsConnected] = useState<boolean>(() => {
    if (propsIsConnected !== undefined) return propsIsConnected;
    try {
      return localStorage.getItem('synapes_drive_connected') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (propsDriveEmail !== undefined) setDriveEmail(propsDriveEmail);
    if (propsIsConnected !== undefined) setIsConnected(propsIsConnected);
  }, [propsDriveEmail, propsIsConnected]);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [inputEmail, setInputEmail] = useState(driveEmail || currentUser?.email || '');
  const [inputAccountName, setInputAccountName] = useState('');
  const [inputOAuthToken, setInputOAuthToken] = useState('');
  const [inputFolderUrl, setInputFolderUrl] = useState('');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [syncedProjectsMap, setSyncedProjectsMap] = useState<Record<string, string>>({});
  const [isSyncingProjectId, setIsSyncingProjectId] = useState<string | null>(null);
  const [archiveModalData, setArchiveModalData] = useState<{ project: Project; archive: DriveArchivePayload } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenLoginModal = () => {
    if (!currentUser || !currentUser.isLoggedIn) {
      showToast('⚠️ Vui lòng đăng nhập tài khoản Studio của bạn trước khi kết nối Google Drive.');
      if (onOpenLogin) onOpenLogin();
      return;
    }
    setInputEmail(driveEmail || currentUser?.email || '');
    setInputAccountName('');
    setInputOAuthToken('');
    setInputFolderUrl(driveFolderUrl || '');
    setAuthError(null);
    setShowLoginModal(true);
  };

  const handleConfirmLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingLogin) return;

    const email = inputEmail.trim();
    const token = inputOAuthToken.trim();
    const accountName = inputAccountName.trim() || email.split('@')[0] || 'Google Drive Studio';
    const folderUrl = inputFolderUrl.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAuthError('Vui lòng nhập Email Google (Gmail hoặc Google Workspace) hợp lệ.');
      return;
    }
    if (token.length < 16) {
      setAuthError('OAuth 2.0 Access Token phải có ít nhất 16 ký tự thực hợp lệ.');
      return;
    }
    if (folderUrl && !/^https:\/\/drive\.google\.com\//i.test(folderUrl)) {
      setAuthError('URL thư mục Google Drive phải bắt đầu bằng https://drive.google.com/');
      return;
    }

    setAuthError(null);
    setIsSubmittingLogin(true);
    try {
      const resp = await fetch('/api/drive/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userCode: currentUser?.code || 'DEFAULT',
          email,
          accountName,
          oauthToken: token,
          folderUrl,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        setAuthError(data?.error || 'Xác thực Google Drive OAuth Token thất bại.');
        return;
      }

      setDriveEmail(email);
      setDriveFolderUrl(folderUrl);
      setIsConnected(true);
      onUpdateDrive?.(email, true);
      setShowLoginModal(false);
      showToast(`Đã xác thực Google Drive [${email}] (${data.maskedToken || 'Token OK'}) thành công!`);
    } catch (err) {
      setAuthError('Không thể kết nối máy chủ xác thực Drive: ' + String((err as Error)?.message || err));
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentUser || !currentUser.isLoggedIn) {
      showToast('⚠️ Vui lòng đăng nhập tài khoản Studio của bạn.');
      if (onOpenLogin) onOpenLogin();
      return;
    }

    if (confirm(`Bạn có chắc muốn ngắt liên kết tài khoản Drive [${driveEmail}]? Các bản sao lưu tự động sẽ tạm dừng.`)) {
      try {
        await fetch('/api/drive/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userCode: currentUser?.code || 'DEFAULT' }),
        });
      } catch {
        // ignore network disconnect cleanup error
      }
      setIsConnected(false);
      onUpdateDrive?.('', false);
      showToast('Đã ngắt kết nối tài khoản Google Drive.');
    }
  };

  const handleSyncProject = async (proj: Project) => {
    if (!isConnected) {
      showToast('⚠️ Vui lòng đăng nhập & xác thực OAuth Token Google Drive trước khi đồng bộ.');
      handleOpenLoginModal();
      return;
    }
    setIsSyncingProjectId(proj.id);
    try {
      const resp = await fetch('/api/drive/sync-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userCode: currentUser?.code || 'DEFAULT',
          driveEmail,
          project: proj,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data?.success) {
        setSyncedProjectsMap((prev) => ({ ...prev, [proj.id]: data.syncedAt || new Date().toISOString() }));
        showToast(`✅ Đã đồng bộ gói dữ liệu & phụ đề SRT của [${proj.title}] lên kho lưu trữ!`);
      } else {
        showToast(`⚠️ ${data?.error || 'Không thể đồng bộ dự án lúc này.'}`);
      }
    } catch {
      showToast('⚠️ Lỗi kết nối máy chủ khi đồng bộ dự án.');
    } finally {
      setIsSyncingProjectId(null);
    }
  };

  const handleOpenArchivePreview = async (proj: Project) => {
    try {
      const resp = await fetch(`/api/drive/archive/${encodeURIComponent(proj.id)}`);
      const data = await resp.json().catch(() => null);
      if (resp.ok && data?.success && data.archive) {
        setArchiveModalData({ project: proj, archive: data.archive });
        return;
      }
    } catch {
      // fall back to local manifest below
    }
    const localArchive = buildLocalArchiveManifest(proj, driveEmail, driveFolderUrl);
    setArchiveModalData({ project: proj, archive: localArchive });
  };

  const triggerBlobDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-white/10 flex items-center gap-2 animate-slide-up">
          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cảnh báo khi chưa đăng nhập */}
      {(!currentUser || !currentUser.isLoggedIn) && (
        <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-2xs animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="text-xs font-bold">Chưa Đăng Nhập Tài Khoản Studio</div>
              <div className="text-[11px] text-amber-800 mt-0.5">
                Google Drive Storage đang ở trạng thái chưa liên kết. Vui lòng đăng nhập tài khoản của bạn để kết nối và tự động sao lưu dữ liệu.
              </div>
            </div>
          </div>
          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs flex-shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đăng Nhập Ngay</span>
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="studio-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-secondary flex items-center gap-1.5"
              title="Quay lại bàn duyệt"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          )}

          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center flex-shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Thư Viện Sao Lưu Google Drive</h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              Đồng bộ dữ liệu video phân rã và thành phẩm lên không gian lưu trữ đám mây
            </p>
          </div>
        </div>

        {/* Nút hành động tài khoản và mở Drive */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {isConnected ? (
            <>
              <div
                className="px-2.5 py-1 rounded-md bg-zinc-50 border border-black/10 text-xs flex items-center gap-1.5"
                title={`Đang kết nối: ${driveEmail}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="font-mono text-zinc-900 font-medium truncate max-w-[180px] sm:max-w-xs">{driveEmail}</span>
              </div>

              <button
                onClick={handleOpenLoginModal}
                className="btn-secondary flex items-center gap-1.5 text-xs font-medium"
                title="Đăng nhập tài khoản Google Drive khác"
              >
                <LogIn className="w-3.5 h-3.5 text-zinc-700" />
                <span>Đăng nhập tài khoản</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleOpenLoginModal}
              className="btn-primary flex items-center gap-1.5 text-xs shadow-xs font-medium"
              title="Đăng nhập và ủy quyền tài khoản Google Drive"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập tài khoản</span>
            </button>
          )}

          <a
            href={driveFolderUrl || 'https://drive.google.com/drive/my-drive'}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary flex items-center gap-1.5 self-start sm:self-auto text-xs"
          >
            <span>Mở Google Drive</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>
        </div>
      </div>

      <div className="studio-card p-3 text-xs text-zinc-600 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 truncate">
          <Folder className="w-4 h-4 text-zinc-700 flex-shrink-0" />
          <div className="truncate">
            <span className="text-zinc-500">Đường dẫn đồng bộ mặc định: </span>
            <span className="font-mono text-zinc-900 font-medium">My Drive / Du_An_Video / 2026 / 11 /</span>
          </div>
        </div>

        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="text-[11px] text-zinc-400 hover:text-red-600 transition flex-shrink-0"
            title="Ngắt kết nối tài khoản"
          >
            Ngắt kết nối
          </button>
        )}
      </div>

      {/* Table */}
      <div className="studio-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 text-zinc-500 border-b border-black/5 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium">Tên Video & Tập Tin</th>
                <th className="py-2.5 px-4 font-medium">Tỉ Lệ</th>
                <th className="py-2.5 px-4 font-medium">Thời Lượng</th>
                <th className="py-2.5 px-4 font-medium">Kênh Phát Sóng</th>
                <th className="py-2.5 px-4 font-medium">Trạng Thái Đồng Bộ</th>
                <th className="py-2.5 px-4 font-medium text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {publishedProjects.map((proj) => (
                <tr key={proj.id} className="hover:bg-zinc-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={proj.thumbnailUrl}
                        alt={proj.title}
                        className="w-14 h-9 object-cover rounded bg-zinc-200 border border-black/10 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-zinc-900 truncate max-w-xs">{proj.title}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {proj.id}_final_1080p.mp4
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-600 text-[11px]">
                    {proj.aspectRatio}
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-600 text-[11px]">
                    {Math.floor(proj.duration / 60)}m{proj.duration % 60}s
                  </td>
                  <td className="py-3 px-4 text-zinc-600 text-[11px]">
                    {proj.targetChannels.join(', ')}
                  </td>
                  <td className="py-3 px-4">
                    {syncedProjectsMap[proj.id] ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>ĐÃ ĐỒNG BỘ</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">
                        <span>{isConnected ? 'CHỜ ĐỒNG BỘ' : 'CHƯA KẾT NỐI DRIVE'}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSyncProject(proj)}
                        disabled={isSyncingProjectId === proj.id}
                        className="btn-secondary py-1 px-2 text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        title="Đồng bộ gói dữ liệu & phụ đề lên kho lưu trữ"
                      >
                        <CloudUpload className="w-3 h-3 text-zinc-500" />
                        <span>{isSyncingProjectId === proj.id ? 'Đang lưu...' : 'Đồng bộ'}</span>
                      </button>
                      <button
                        type="button"
                        data-testid="drive-view-archive-btn"
                        onClick={() => handleOpenArchivePreview(proj)}
                        className="btn-secondary py-1 px-2.5 text-[11px] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Film className="w-3 h-3 text-zinc-500" />
                        <span>Xem file</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Đăng nhập & Cấp quyền Google Drive */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-black/10 max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-black/10 flex items-center justify-center p-1.5 flex-shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 87.3 78" fill="none">
                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
                    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47" />
                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l6.1 10.55z" fill="#ea4335" />
                    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
                    <path d="m59.8 53h27.5c0-1.55-.4-3.1-1.2-4.5l-13.75-23.8c-.8-1.4-1.95-2.5-3.3-3.3L55.3 45.2z" fill="#2684fc" />
                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3H27.5l-6.15 10.6c1.35.8 2.9 1.2 4.5 1.2h43.2c1.6 0 3.15-.45 4.5-1.2z" fill="#ffba00" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-zinc-900 font-semibold text-xs uppercase tracking-wider font-mono">
                    Xác Thực & Kết Nối Google Drive
                  </h3>
                  <p className="text-zinc-500 text-xs">Nhập Email Google và OAuth Access Token thực để lưu trữ dự án</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmLogin} className="space-y-3.5 text-xs">
              {authError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="text-zinc-700 font-medium block mb-1">
                  Tên Định Danh Kho Lưu Trữ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kho Video Công Nghệ"
                  value={inputAccountName}
                  onChange={(e) => setInputAccountName(e.target.value)}
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">
                  Email Tài Khoản Google (Gmail / Google Workspace) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com hoặc user@company.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">
                  Google OAuth 2.0 Access Token * (tối thiểu 16 ký tự)
                </label>
                <input
                  type="password"
                  required
                  minLength={16}
                  data-testid="drive-oauth-token-input"
                  placeholder="ya29.a0... (Token phạm vi drive.file từ Google Cloud / OAuth Playground)"
                  value={inputOAuthToken}
                  onChange={(e) => setInputOAuthToken(e.target.value)}
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">
                  URL Thư Mục Google Drive Đích (Tùy chọn)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={inputFolderUrl}
                  onChange={(e) => setInputFolderUrl(e.target.value)}
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>

              {/* Chi tiết quyền hạn Drive */}
              <div className="p-2.5 rounded-lg bg-zinc-50 border border-black/5 space-y-1.5 text-[11px] text-zinc-600">
                <div className="flex items-center gap-1.5 font-medium text-zinc-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Quyền hạn yêu cầu: https://www.googleapis.com/auth/drive.file</span>
                </div>
                <p className="text-zinc-500 leading-relaxed pl-5">
                  Chỉ cho phép ứng dụng đọc và ghi các tệp dự án do chính nó tạo lập, không truy cập dữ liệu riêng tư khác trên Drive của bạn.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="btn-primary disabled:opacity-60"
                >
                  {isSubmittingLogin ? 'Đang xác thực...' : 'Xác Thực & Cấp Quyền Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Drive Archive Inspector & Video Preview Modal (thay thế link 404 ngoài) */}
      {archiveModalData && (
        <div
          data-testid="drive-archive-modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl border border-black/10 max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-black/5">
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Gói Lưu Trữ Dự Án · Drive Archive Inspector
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 truncate mt-0.5">
                  {archiveModalData.archive.title}
                </h3>
                <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  ID: {archiveModalData.archive.projectId} · {archiveModalData.archive.aspectRatio} · {archiveModalData.archive.sceneCount} phân cảnh
                </div>
              </div>
              <button
                type="button"
                onClick={() => setArchiveModalData(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
                aria-label="Đóng trình xem gói lưu trữ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail & Storyboard Frames Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-black/10 bg-zinc-950 overflow-hidden">
                {archiveModalData.archive.thumbnailUrl ? (
                  <img
                    src={archiveModalData.archive.thumbnailUrl}
                    alt={archiveModalData.archive.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center text-zinc-500 text-xs">
                    Không có ảnh bìa
                  </div>
                )}
                <div className="px-3 py-2 text-[11px] text-zinc-300 bg-zinc-900 flex items-center justify-between">
                  <span>{archiveModalData.archive.projectId}_manifest.json</span>
                  <span className="font-mono text-emerald-400">Sẵn sàng</span>
                </div>
              </div>

              <div className="rounded-lg border border-black/10 bg-zinc-50 p-3 flex flex-col justify-between gap-2">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Tệp Thành Phần Có Thể Tải Xuống</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Truy xuất trực tiếp dữ liệu kịch bản phân cảnh, file phụ đề chuẩn .SRT và âm thanh Master của dự án (không dẫn link hỏng 404).
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-black/5">
                  <button
                    type="button"
                    onClick={() =>
                      triggerBlobDownload(
                        `${archiveModalData.archive.projectId}_manifest.json`,
                        JSON.stringify(archiveModalData.archive, null, 2),
                        'application/json;charset=utf-8'
                      )
                    }
                    className="w-full btn-secondary py-1.5 px-3 text-[11px] flex items-center justify-between cursor-pointer"
                  >
                    <span>Tải Manifest Dự Án (.JSON)</span>
                    <Download className="w-3.5 h-3.5 text-zinc-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      triggerBlobDownload(
                        `${archiveModalData.archive.projectId}_subtitles.srt`,
                        archiveModalData.archive.srtContent || '1\n00:00:00,000 --> 00:00:08,000\nSYNAPES Studio',
                        'text/plain;charset=utf-8'
                      )
                    }
                    className="w-full btn-secondary py-1.5 px-3 text-[11px] flex items-center justify-between cursor-pointer"
                  >
                    <span>Tải Phụ Đề Video (.SRT)</span>
                    <Download className="w-3.5 h-3.5 text-zinc-500" />
                  </button>

                  {archiveModalData.project.customAudioUrl && (
                    <a
                      href={archiveModalData.project.customAudioUrl}
                      download={`${archiveModalData.archive.projectId}_master_audio.wav`}
                      className="w-full btn-secondary py-1.5 px-3 text-[11px] flex items-center justify-between"
                    >
                      <span>Tải Âm Thanh Master</span>
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Scene Preview List */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Danh Sách Phân Cảnh Đã Đóng Gói ({archiveModalData.archive.storyboard.length})
              </div>
              <div className="max-h-44 overflow-y-auto divide-y divide-black/5 rounded-lg border border-black/10 bg-zinc-50/50">
                {archiveModalData.archive.storyboard.map((sc) => (
                  <div key={sc.sceneNumber} className="px-3 py-2 text-xs flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] text-zinc-500">
                        Cảnh #{sc.sceneNumber} · {sc.startTime}s – {sc.endTime}s
                      </div>
                      <div className="text-zinc-800 line-clamp-2 mt-0.5">
                        {sc.dialogue || sc.visualNotes}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2">
              {archiveModalData.archive.externalFolderUrl ? (
                <a
                  href={archiveModalData.archive.externalFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-zinc-700 hover:text-zinc-900 underline inline-flex items-center gap-1"
                >
                  <span>Mở thư mục Drive đã cấu hình</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-[11px] text-zinc-500">
                  Lưu trữ nội bộ xác thực · Có thể gắn URL thư mục Drive thực khi kết nối
                </span>
              )}
              <button
                type="button"
                onClick={() => setArchiveModalData(null)}
                className="btn-primary text-xs px-4 py-1.5 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
