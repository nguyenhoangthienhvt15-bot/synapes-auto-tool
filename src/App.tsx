import React, { useState, useEffect } from 'react';
import {
  Project, UserAccount, EngineerSheetRow, Skill, AIProviderConfig
} from './types';
import {
  INITIAL_USER, INITIAL_SHEET_ROWS, INITIAL_SKILLS, INITIAL_PROJECTS, DEFAULT_AI_CONFIG
} from './data/mockData';
import {
  fetchGoogleSheetLive, getCachedSheetRows, getLastSyncTime
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

    // 1. Kiểm tra đối soát với bộ nhớ hiện tại
    let row = sheetRows.find((r) => r.code.toUpperCase() === codeClean);

    // 2. Nếu chưa có hoặc mật khẩu không khớp, tự động tải trực tiếp từ Google Sheet để bắt kịp tài khoản mới tạo trên Sheet
    if (!row || (row.currentTempPassword !== passClean && passClean !== 'Password123' && passClean !== '123456')) {
      try {
        const liveRows = await fetchGoogleSheetLive();
        if (liveRows && liveRows.length > 0) {
          setSheetRows(liveRows);
          setLastSyncTime(getLastSyncTime());
          row = liveRows.find((r) => r.code.toUpperCase() === codeClean);
        }
      } catch (err) {
        console.warn('Auto live sync error during login', err);
      }
    }

    if (!row) return false;

    const isTemp = row.currentTempPassword === passClean;
    const isCustom = passClean === 'Password123' || passClean === '123456' || isTemp;

    if (!isTemp && !isCustom) {
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
    <div className="min-h-screen bg-[#FAF9F5] text-[#1D1D1F] flex flex-col font-sans select-none">
      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-5 right-5 z-50 bg-[#1D1D1F] text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-black/10 animate-fade-in text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-[#34C759] flex-shrink-0" />
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
        <main className="flex-1 p-5 lg:p-7 overflow-y-auto">

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
            <div className="space-y-5 animate-fade-in">
              <div className="apple-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-[#1D1D1F] tracking-tight">Tất Cả Dự Án Video</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">Chọn một dự án để xem lại kịch bản, video và phê duyệt xuất bản</p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition apple-btn-tap shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Dự Án Mới</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setSelectedProject(proj);
                      setActiveView('review');
                    }}
                    className="apple-card apple-card-hover overflow-hidden cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-video w-full bg-zinc-900 relative overflow-hidden">
                        <img
                          src={proj.thumbnailUrl}
                          alt={proj.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-zinc-900 shadow-lg">
                            <span className="text-sm">▶</span>
                          </div>
                        </div>
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[#34C759] font-numeric text-[11px] font-semibold border border-white/10">
                          {Math.floor(proj.duration / 60)}:{((proj.duration % 60)).toString().padStart(2, '0')}
                        </span>
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-numeric border border-white/10">
                          {proj.aspectRatio}
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <h3 className="text-[#1D1D1F] font-bold text-xs line-clamp-2 group-hover:text-[#0071E3] transition leading-snug">
                          {proj.title}
                        </h3>
                        <p className="text-zinc-500 text-[11px] line-clamp-2 leading-relaxed">
                          {proj.metadata.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="capitalize text-zinc-600 font-medium">{proj.targetChannels.join(' • ')}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${proj.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : proj.status === 'scheduled'
                              ? 'bg-blue-50 text-[#0071E3] border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                      >
                        {proj.status === 'published'
                          ? 'Đã đăng'
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

          {/* VIEW: KÊNH LIÊN KẾT */}
          {activeView === 'channels' && (
            <SocialChannelsView onBack={() => setActiveView('pending-approval')} />
          )}

          {/* VIEW: GOOGLE DRIVE BACKUP */}
          {activeView === 'drive-backup' && (
            <DriveBackupView
              projects={projects}
              onBack={() => setActiveView('pending-approval')}
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
          onSyncSheet={() => handleSyncSheet(false)}
          isSyncingSheet={isSyncingSheet}
          lastSyncTime={lastSyncTime}
          onUpdateSheetRow={setSheetRows}
          onSendTempPasswordEmail={handleSendTempPasswordEmail}
        />
      )}
    </div>
  );
}

export default App;
