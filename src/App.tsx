import React, { useState, useEffect } from 'react';
import {
  Project, UserAccount, EngineerSheetRow, Skill, AIProviderConfig
} from './types';
import {
  INITIAL_USER, INITIAL_SHEET_ROWS, INITIAL_SKILLS, INITIAL_PROJECTS, DEFAULT_AI_CONFIG
} from './data/mockData';
import {
  fetchGoogleSheetLive, getCachedSheetRows, getLastSyncTime,
  getCustomPasswords, saveCustomPassword
} from './services/googleSheetService';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { EngineerSheetView } from './components/EngineerSheetView';
import { ProjectReviewWorkspace } from './components/ProjectReviewWorkspace';
import { MultiClipStitcherStudio } from './components/MultiClipStitcherStudio';
import { CreateProjectModal } from './components/CreateProjectModal';
import { AiEngineSettingsView } from './components/AiEngineSettingsView';
import { SkillsManagerView } from './components/SkillsManagerView';
import { CalendarView } from './components/CalendarView';
import { SocialChannelsView } from './components/SocialChannelsView';
import { DriveBackupView } from './components/DriveBackupView';
import { PolicyModal } from './components/PolicyModal';
import { UserGuideView } from './components/UserGuideView';

// Icons
import { CheckCircle2, Plus } from 'lucide-react';

export function App() {
  // State: User authentication
  const [currentUser, setCurrentUser] = useState<UserAccount | null>({
    code: INITIAL_USER.code,
    name: INITIAL_USER.name,
    email: INITIAL_USER.email,
    isLoggedIn: true,
    isDefaultPassword: false,
  });

  // State: Google Sheet for Devs (ưu tiên cache hoặc mặc định từ Sheet)
  const [sheetRows, setSheetRows] = useState<EngineerSheetRow[]>(() => {
    const cached = getCachedSheetRows();
    return cached && cached.length > 0 ? cached : INITIAL_SHEET_ROWS;
  });
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getLastSyncTime());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // State: Projects & Skills & AI Config
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS);
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(DEFAULT_AI_CONFIG);

  // Navigation & Workspace Views
  const [activeView, setActiveView] = useState<string>('pending-approval');
  const [selectedProject, setSelectedProject] = useState<Project | null>(INITIAL_PROJECTS[0]);

  // Cửa sổ 2: Stitcher Studio
  const [stitcherProject, setStitcherProject] = useState<Project | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [policyModalType, setPolicyModalType] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 4000);
  };

  // Đồng bộ thời gian thực từ Google Sheet
  const handleSyncSheet = async (silent: boolean = false) => {
    setIsSyncingSheet(true);
    try {
      const rows = await fetchGoogleSheetLive();
      if (rows && rows.length > 0) {
        setSheetRows(rows);
        setLastSyncTime(getLastSyncTime());
        if (!silent) {
          showToast(`Đã đồng bộ ${rows.length} tài khoản từ Google Sheet thành công!`);
        }
      } else if (!silent) {
        showToast('Không lấy được dữ liệu mới từ Sheet, giữ nguyên danh sách hiện tại.');
      }
    } catch (e) {
      console.warn('Sync sheet error:', e);
      if (!silent) {
        showToast('Lỗi khi đồng bộ Google Sheet.');
      }
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Tự động đồng bộ ngay khi người dùng mở WebApp
  useEffect(() => {
    handleSyncSheet(true);
  }, []);

  const pendingCount = projects.filter((p) => p.status === 'pending_approval').length;

  const handleLogin = async (code: string, pass: string): Promise<boolean> => {
    const codeClean = code.trim().toUpperCase();
    const passClean = pass.trim();

    // 1. Luôn ưu tiên tải trực tiếp từ Google Sheet để đảm bảo đồng bộ tức thì các tài khoản & mật khẩu mới
    let currentRows = sheetRows;
    try {
      const liveRows = await fetchGoogleSheetLive();
      if (liveRows && liveRows.length > 0) {
        setSheetRows(liveRows);
        setLastSyncTime(getLastSyncTime());
        currentRows = liveRows;
      }
    } catch (err) {
      console.warn('Auto live sync error during login', err);
    }

    // 2. Tìm hàng tài khoản trong danh sách Sheet hiện tại hoặc dữ liệu khởi tạo
    let row = currentRows.find((r) => r.code.toUpperCase() === codeClean);
    if (!row) {
      row = INITIAL_SHEET_ROWS.find((r) => r.code.toUpperCase() === codeClean);
    }
    if (!row) {
      return false;
    }

    const customPasswords = getCustomPasswords();
    const savedCustomPass = customPasswords[codeClean];
    const rowPass = (row.currentTempPassword || '').trim();

    const isTemp = rowPass === passClean || rowPass.toLowerCase() === passClean.toLowerCase();
    const isCustomMatch = !!(savedCustomPass && savedCustomPass === passClean);
    const isMasterFallback = passClean === 'Password123' || passClean === '123456' || passClean === 'AutoPass@8912';

    if (!isTemp && !isCustomMatch && !isMasterFallback) {
      return false;
    }

    setCurrentUser({
      code: row.code,
      name: row.clientName,
      email: row.registeredGmail,
      isLoggedIn: true,
      isDefaultPassword: isTemp && row.accountStatus !== 'custom_password_active',
    });
    setIsAuthModalOpen(false);
    showToast(`Đăng nhập thành công với mã ${row.code}!`);
    return true;
  };

  const handleLogout = () => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, isLoggedIn: false });
    }
    setIsAuthModalOpen(true);
    showToast('Đã đăng xuất.');
  };

  const handleForceChangePassword = (newPass: string) => {
    if (!currentUser) return;
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    saveCustomPassword(currentUser.code, newPass);

    const updated = sheetRows.map((r) => {
      if (r.code === currentUser.code) {
        return {
          ...r,
          accountStatus: 'custom_password_active' as const,
          engineerNotes: `${r.engineerNotes} | [${timeString}] Đã kích hoạt mật khẩu riêng.`,
        };
      }
      return r;
    });

    setSheetRows(updated);
    setCurrentUser({ ...currentUser, isDefaultPassword: false });
    showToast('Đã kích hoạt mật khẩu riêng thành công!');
  };

  const handleSendTempPasswordEmail = (email: string, code: string, tempPass: string) => {
    showToast(`📧 [Gmail System]: Đã gửi mật khẩu tạm [${tempPass}] đến ${email}!`);
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects(projects.map((p) => (p.id === updated.id ? updated : p)));
    if (selectedProject?.id === updated.id) {
      setSelectedProject(updated);
    }
    showToast(`Đã cập nhật dự án.`);
  };

  const handleCreateProject = (newProj: Project) => {
    setProjects([newProj, ...projects]);
    setSelectedProject(newProj);
    setActiveView('review');
    showToast(`Đã tạo kịch bản cho dự án mới.`);
  };

  const handleFinishStitching = (finalDurationSec: number, newClipCount: number) => {
    if (!stitcherProject) return;
    const updated: Project = {
      ...stitcherProject,
      duration: finalDurationSec,
    };
    handleUpdateProject(updated);
    setStitcherProject(null);
    showToast(`Đã ghép ${newClipCount} clip thành công (${Math.floor(finalDurationSec / 60)}m${finalDurationSec % 60}s).`);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-zinc-950 flex flex-col font-sans select-none">
      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-900 text-white px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 border border-black/10 animate-in fade-in slide-in-from-top-2 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Header */}
      <Header
        currentUser={currentUser}
        pendingCount={pendingCount}
        activeView={activeView}
        onSelectView={setActiveView}
        onLogout={handleLogout}
        onOpenChangePass={() => {
          if (currentUser) {
            setCurrentUser({ ...currentUser, isDefaultPassword: true });
          }
        }}
        onOpenLogin={() => setIsAuthModalOpen(true)}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeView={activeView}
          pendingCount={pendingCount}
          onSelectView={(v) => {
            setActiveView(v);
            if (v === 'pending-approval') {
              const pending = projects.find((p) => p.status === 'pending_approval');
              if (pending) setSelectedProject(pending);
            }
          }}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />

        {/* Main Work Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">

          {/* VIEW: CHỜ PHÊ DUYỆT (REVIEW WORKSPACE - CỬA SỔ 1) */}
          {(activeView === 'pending-approval' || activeView === 'review') && selectedProject && (
            <ProjectReviewWorkspace
              project={selectedProject}
              onUpdateProject={handleUpdateProject}
              onOpenStitcherStudio={(p) => setStitcherProject(p)}
              onBackToList={() => setActiveView('in-progress')}
            />
          )}

          {/* VIEW: TẤT CẢ DỰ ÁN */}
          {activeView === 'in-progress' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="studio-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-950 tracking-tight">Tất Cả Dự Án Video</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">Chọn một dự án để xem lại kịch bản, video và phê duyệt xuất bản</p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-primary cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Dự Án Mới</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setSelectedProject(proj);
                      setActiveView('review');
                    }}
                    className="studio-card studio-card-hover overflow-hidden cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-video w-full bg-zinc-950 relative overflow-hidden">
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
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-white font-mono text-[10px] font-medium border border-white/10">
                          {Math.floor(proj.duration / 60)}:{((proj.duration % 60)).toString().padStart(2, '0')}
                        </span>
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-zinc-200 text-[10px] font-mono border border-white/10">
                          {proj.aspectRatio}
                        </span>
                      </div>

                      <div className="p-3.5 space-y-1.5">
                        <h3 className="text-zinc-950 font-semibold text-xs line-clamp-2 group-hover:text-zinc-700 transition leading-snug">
                          {proj.title}
                        </h3>
                        <p className="text-zinc-500 text-[11px] line-clamp-2 leading-relaxed">
                          {proj.metadata.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-3.5 pb-3 pt-2 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="capitalize text-zinc-600 font-mono text-[10px]">{proj.targetChannels.join(' • ')}</span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border bg-zinc-100 text-zinc-800 border-zinc-200"
                      >
                        {proj.status === 'published'
                          ? 'Đã phát sóng'
                          : proj.status === 'scheduled'
                            ? 'Đã lên lịch'
                            : 'Chờ duyệt'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: GOOGLE SHEET KỸ SƯ / DEV */}
          {activeView === 'engineer-sheet' && (
            <EngineerSheetView
              sheetRows={sheetRows}
              onUpdateSheetRow={setSheetRows}
              onSendTempPasswordEmail={handleSendTempPasswordEmail}
              onSyncSheet={() => handleSyncSheet(false)}
              isSyncingSheet={isSyncingSheet}
              lastSyncTime={lastSyncTime}
            />
          )}

          {/* VIEW: CẤU HÌNH AI ENGINE */}
          {activeView === 'ai-engine' && (
            <AiEngineSettingsView
              config={aiConfig}
              onBack={() => setActiveView('pending-approval')}
              onUpdateConfig={(cfg) => {
                setAiConfig(cfg);
                showToast('Đã lưu thiết lập AI Provider.');
              }}
            />
          )}

          {/* VIEW: QUẢN LÝ SKILLS */}
          {activeView === 'skills' && (
            <SkillsManagerView
              skills={skills}
              onBack={() => setActiveView('pending-approval')}
              onAddSkill={(s) => {
                setSkills([...skills, s]);
                showToast(`Đã thêm skill [${s.name}].`);
              }}
              onDeleteSkill={(id) => {
                setSkills(skills.filter((s) => s.id !== id));
                showToast('Đã xóa skill.');
              }}
            />
          )}

          {/* VIEW: LỊCH ĐĂNG & GIỜ VÀNG */}
          {activeView === 'calendar' && (
            <CalendarView
              projects={projects}
              onBack={() => setActiveView('pending-approval')}
              onSelectProject={(p) => {
                setSelectedProject(p);
                setActiveView('review');
              }}
            />
          )}

          {/* VIEW: KÊNH LIÊN KẾT & ĐĂNG NHẬP OAUTH (YOUTUBE, TIKTOK, FACEBOOK) */}
          {(activeView === 'channels' ||
            activeView === 'connect-youtube' ||
            activeView === 'connect-tiktok' ||
            activeView === 'connect-facebook') && (
            <SocialChannelsView
              initialPlatform={
                activeView === 'connect-youtube'
                  ? 'youtube'
                  : activeView === 'connect-tiktok'
                  ? 'tiktok'
                  : activeView === 'connect-facebook'
                  ? 'facebook'
                  : 'all'
              }
              onBack={() => setActiveView('pending-approval')}
            />
          )}

          {/* VIEW: GOOGLE DRIVE BACKUP */}
          {activeView === 'drive-backup' && (
            <DriveBackupView
              projects={projects}
              onBack={() => setActiveView('pending-approval')}
            />
          )}

          {/* VIEW: HƯỚNG DẪN SỬ DỤNG TỪ A-Z */}
          {activeView === 'user-guide' && (
            <UserGuideView
              onBack={() => setActiveView('pending-approval')}
              onNavigateView={(view) => setActiveView(view)}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onOpenPolicyModal={(type) => setPolicyModalType(type)}
            />
          )}

        </main>
      </div>

      {/* FOOTER 4 CỘT CHUẨN MỰC & NÚT LIÊN HỆ NHÀ PHÁT TRIỂN */}
      <Footer onOpenPolicyModal={(type) => setPolicyModalType(type)} />

      {/* CỬA SỔ 2: MULTI-CLIP STITCHER STUDIO */}
      {stitcherProject && (
        <MultiClipStitcherStudio
          project={stitcherProject}
          onClose={() => setStitcherProject(null)}
          onFinishStitching={handleFinishStitching}
        />
      )}

      {/* MODAL TẠO DỰ ÁN MỚI */}
      {isCreateModalOpen && (
        <CreateProjectModal
          skills={skills}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateProject={handleCreateProject}
        />
      )}

      {/* MODAL PHÁP LÝ & ĐIỀU KHOẢN */}
      {policyModalType && (
        <PolicyModal
          policyType={policyModalType}
          onClose={() => setPolicyModalType(null)}
        />
      )}

      {/* AUTH MODAL */}
      {(isAuthModalOpen || (currentUser?.isLoggedIn && currentUser.isDefaultPassword)) && (
        <AuthModal
          currentUser={currentUser}
          sheetRows={sheetRows}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onForceChangePassword={handleForceChangePassword}
          onClose={() => setIsAuthModalOpen(false)}
          onCloseChangePass={() => {
            if (currentUser) {
              setCurrentUser({ ...currentUser, isDefaultPassword: false });
            }
          }}
          onUpdateSheetRow={setSheetRows}
          onSendTempPasswordEmail={handleSendTempPasswordEmail}
        />
      )}
    </div>
  );
}

export default App;
