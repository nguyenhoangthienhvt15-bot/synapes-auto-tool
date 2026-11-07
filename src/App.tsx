import React, { useState, useEffect } from 'react';
import {
  Project, UserAccount, EngineerSheetRow, Skill, AIProviderConfig, ConnectedChannelAccount
} from './types';
import {
  INITIAL_SHEET_ROWS, INITIAL_SKILLS, MCP_VIDEO_SERVERS
} from './data/mockData';
import {
  fetchGoogleSheetLive, getCachedSheetRows, cacheSheetRows, getLastSyncTime,
  saveCustomPassword, getStoredRegistrations, verifyAccountLogin
} from './services/googleSheetService';
import {
  getActiveSession, setActiveSession, clearActiveSession,
  getUserProfile, saveUserProfile, EMPTY_AI_CONFIG, getDisconnectedChannels
} from './services/userProfileService';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { RegisterModal } from './components/RegisterModal';
import { UnauthenticatedWorkspace } from './components/UnauthenticatedWorkspace';
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
import { McpVideoToolsHub } from './components/McpVideoToolsHub';

// Icons
import { CheckCircle2, Plus } from 'lucide-react';

export function App() {
  // State: User authentication (MẶC ĐỊNH LÀ CHƯA ĐĂNG NHẬP, KHÔNG CÒN VIP-001)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return getActiveSession();
  });

  // State: Google Sheet for Devs (ưu tiên cache hoặc mặc định từ Sheet)
  const [sheetRows, setSheetRows] = useState<EngineerSheetRow[]>(() => {
    const cached = getCachedSheetRows();
    return cached && cached.length > 0 ? cached : INITIAL_SHEET_ROWS;
  });
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getLastSyncTime());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // State: Projects & Skills & AI Config & Kênh (Khởi tạo theo tài khoản thực tế)
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS);
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(EMPTY_AI_CONFIG);
  const [selectedAiProvider, setSelectedAiProvider] = useState<string>('gemini');
  const [channels, setChannels] = useState<ConnectedChannelAccount[]>(getDisconnectedChannels());
  const [driveEmail, setDriveEmail] = useState<string>('');
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(false);

  // Navigation & Workspace Views
  const [activeView, setActiveView] = useState<string>('pending-approval');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

  // Nạp toàn bộ thông tin cá nhân (API Keys, kênh mạng xã hội, dự án) khi người dùng đăng nhập
  useEffect(() => {
    if (currentUser && currentUser.isLoggedIn && currentUser.code) {
      const profile = getUserProfile(currentUser.code, currentUser.name, currentUser.email);
      setAiConfig(profile.aiConfig);
      setSelectedAiProvider(profile.aiConfig.activeProvider || profile.aiConfig.mode || 'gemini');
      setProjects(profile.projects);
      setChannels(profile.channels);
      setDriveEmail(profile.driveEmail);
      setIsDriveConnected(profile.driveConnected);
      setSelectedProject(profile.projects[0] || null);
    } else {
      // Khi chưa đăng nhập: Không hiển thị dữ liệu tài khoản VIP-001 hay kênh của người khác
      setAiConfig(EMPTY_AI_CONFIG);
      setProjects([]);
      setChannels(getDisconnectedChannels());
      setDriveEmail('');
      setIsDriveConnected(false);
      setSelectedProject(null);
    }
  }, [currentUser?.code, currentUser?.isLoggedIn]);

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

    // 2. Tìm hàng tài khoản trong danh sách Sheet hiện tại, khởi tạo, hoặc hồ sơ đăng ký đã duyệt
    let row = currentRows.find((r) => r.code.toUpperCase() === codeClean);
    if (!row) {
      row = INITIAL_SHEET_ROWS.find((r) => r.code.toUpperCase() === codeClean);
    }
    if (!row) {
      const approved = getStoredRegistrations().find(
        (r) => r.isApproved && r.assignedCode && r.assignedCode.toUpperCase() === codeClean
      );
      if (approved && approved.assignedCode) {
        row = {
          code: approved.assignedCode,
          clientName: approved.fullName,
          registeredGmail: approved.email,
          currentTempPassword: approved.assignedPassword || 'AutoPass@8912',
          lastIssuedTime: approved.registeredAt,
          accountStatus: 'never_changed',
          engineerNotes: 'Hồ sơ duyệt từ hệ thống',
        };
      }
    }

    if (!row) {
      return false;
    }

    const authCheck = verifyAccountLogin(codeClean, passClean, row);
    if (!authCheck.valid) {
      return false;
    }

    const userAccount: UserAccount = {
      code: row.code,
      name: row.clientName,
      email: row.registeredGmail,
      isLoggedIn: true,
      isDefaultPassword: authCheck.isDefaultPassword,
    };

    try {
      localStorage.setItem(`synapes_explicit_login_${row.code}`, 'true');
    } catch {}

    setCurrentUser(userAccount);
    setActiveSession(userAccount);

    // Nạp toàn bộ dữ liệu người dùng đã lưu trước đó trong tài khoản được cấp
    const profile = getUserProfile(row.code, row.clientName, row.registeredGmail);
    setAiConfig(profile.aiConfig);
    setSelectedAiProvider(profile.aiConfig.activeProvider || profile.aiConfig.mode || 'gemini');
    setProjects(profile.projects);
    setChannels(profile.channels);
    setDriveEmail(profile.driveEmail);
    setIsDriveConnected(profile.driveConnected);
    setSelectedProject(profile.projects[0] || null);

    setIsAuthModalOpen(false);
    showToast(`Đăng nhập thành công với tài khoản ${row.code} (${row.clientName})!`);
    return true;
  };

  const handleLogout = () => {
    clearActiveSession();
    setCurrentUser(null);
    setAiConfig(EMPTY_AI_CONFIG);
    setProjects([]);
    setChannels(getDisconnectedChannels());
    setDriveEmail('');
    setIsDriveConnected(false);
    setSelectedProject(null);
    setActiveView('pending-approval');
    showToast('Đã đăng xuất khỏi tài khoản Studio.');
  };

  const handleForceChangePassword = (newPass: string) => {
    if (!currentUser) return;
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    const passHash = saveCustomPassword(
      currentUser.code,
      newPass,
      currentUser.email,
      currentUser.name
    );

    const updated = sheetRows.map((r) => {
      if (r.code.toUpperCase() === currentUser.code.toUpperCase()) {
        return {
          ...r,
          currentTempPassword: `🔒 Đã mã hóa [${passHash}]`,
          lastIssuedTime: timeString,
          accountStatus: 'custom_password_active' as const,
          engineerNotes: `${r.engineerNotes} | 🟢 Đã tạo mật khẩu mới (${timeString})`,
        };
      }
      return r;
    });

    setSheetRows(updated);
    cacheSheetRows(updated);
    const updatedUser = { ...currentUser, isDefaultPassword: false };
    setCurrentUser(updatedUser);
    setActiveSession(updatedUser);
    showToast('🔒 Đã tạo mật khẩu cá nhân mới (mã hóa bảo mật) và cập nhật trạng thái lên Google Sheet!');
  };

  const handleSendTempPasswordEmail = (email: string, _code: string, _tempPass: string) => {
    showToast(`📧 Đã gửi mật khẩu cấp mới đến hộp thư Gmail: ${email}. Vui lòng kiểm tra email!`);
  };

  const handleUpdateProject = (updated: Project) => {
    const updatedProjects = projects.map((p) => (p.id === updated.id ? updated : p));
    setProjects(updatedProjects);
    if (selectedProject?.id === updated.id) {
      setSelectedProject(updated);
    }
    if (currentUser?.code) {
      saveUserProfile(currentUser.code, { projects: updatedProjects });
    }
    showToast(`Đã cập nhật dự án.`);
  };

  const handleCreateProject = (newProj: Project) => {
    const projWithUser: Project = {
      ...newProj,
      code: currentUser?.code || 'GUEST',
    };
    const updatedProjects = [projWithUser, ...projects];
    setProjects(updatedProjects);
    setSelectedProject(projWithUser);
    setActiveView('review');
    if (currentUser?.code) {
      saveUserProfile(currentUser.code, { projects: updatedProjects });
    }
    showToast(`Đã tạo kịch bản cho dự án mới.`);
  };

  const handleUpdateAiConfig = (cfg: AIProviderConfig) => {
    setAiConfig(cfg);
    if (cfg.activeProvider) {
      setSelectedAiProvider(cfg.activeProvider);
    }
    if (currentUser?.code) {
      saveUserProfile(currentUser.code, { aiConfig: cfg });
    }
    showToast(`Đã lưu cấu hình API Keys AI Module.`);
  };

  const handleUpdateChannels = (newChannels: ConnectedChannelAccount[]) => {
    setChannels(newChannels);
    if (currentUser?.code) {
      saveUserProfile(currentUser.code, { channels: newChannels });
    }
  };

  const handleUpdateDrive = (email: string, connected: boolean) => {
    setDriveEmail(email);
    setIsDriveConnected(connected);
    if (currentUser?.code) {
      saveUserProfile(currentUser.code, { driveEmail: email, driveConnected: connected });
    }
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
        onOpenRegister={() => setIsRegisterModalOpen(true)}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeView={activeView}
          pendingCount={pendingCount}
          selectedAiProvider={selectedAiProvider}
          onSelectAiProvider={(prov) => {
            setSelectedAiProvider(prov);
            handleUpdateAiConfig({ ...aiConfig, activeProvider: prov as any });
          }}
          onSelectView={(v) => {
            setActiveView(v);
            if (v === 'pending-approval') {
              const pending = projects.find((p) => p.status === 'pending_approval');
              if (pending) setSelectedProject(pending);
            }
          }}
          onOpenCreateModal={() => {
            if (!currentUser || !currentUser.isLoggedIn) {
              showToast('⚠️ Vui lòng đăng nhập tài khoản để tạo và lưu dự án video.');
              setIsAuthModalOpen(true);
              return;
            }
            setIsCreateModalOpen(true);
          }}
        />

        {/* Main Work Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">

          {/* VIEW: CHỜ PHÊ DUYỆT (REVIEW WORKSPACE - CỬA SỔ 1) */}
          {(activeView === 'pending-approval' || activeView === 'review') && (
            !currentUser || !currentUser.isLoggedIn ? (
              <UnauthenticatedWorkspace
                onOpenLogin={() => setIsAuthModalOpen(true)}
                onOpenRegister={() => setIsRegisterModalOpen(true)}
                onOpenGuide={() => setActiveView('user-guide')}
              />
            ) : selectedProject ? (
              <ProjectReviewWorkspace
                project={selectedProject}
                onUpdateProject={handleUpdateProject}
                onOpenStitcherStudio={(p) => setStitcherProject(p)}
                onBackToList={() => setActiveView('in-progress')}
              />
            ) : (
              <div className="studio-card p-10 text-center space-y-4">
                <h3 className="text-sm font-semibold text-zinc-900">Chưa Có Kịch Bản Video Nào Trong Tài Khoản</h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  Tài khoản của bạn chưa có dự án video nào. Nhấn nút bên dưới để tạo kịch bản từ Prompt và bắt đầu sản xuất.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-primary inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Dự Án Video Mới</span>
                </button>
              </div>
            )
          )}

          {/* VIEW: TẤT CẢ DỰ ÁN */}
          {activeView === 'in-progress' && (
            !currentUser || !currentUser.isLoggedIn ? (
              <UnauthenticatedWorkspace
                onOpenLogin={() => setIsAuthModalOpen(true)}
                onOpenRegister={() => setIsRegisterModalOpen(true)}
                onOpenGuide={() => setActiveView('user-guide')}
              />
            ) : (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="studio-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-zinc-950 tracking-tight">Tất Cả Dự Án Của {currentUser.name}</h2>
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

                {projects.length === 0 ? (
                  <div className="studio-card p-12 text-center space-y-3">
                    <p className="text-xs text-zinc-500">Chưa có dự án nào được lưu trong tài khoản [{currentUser.code}].</p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="btn-primary inline-flex items-center gap-1.5 text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tạo Dự Án Video Đầu Tiên</span>
                    </button>
                  </div>
                ) : (
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
                )}
              </div>
            )
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

          {/* VIEW: CẤU HÌNH API KEYS AI MODULE */}
          {activeView === 'ai-engine' && (
            <AiEngineSettingsView
              currentUser={currentUser}
              config={aiConfig}
              initialProvider={selectedAiProvider}
              onBack={() => setActiveView('pending-approval')}
              onOpenLogin={() => setIsAuthModalOpen(true)}
              onUpdateConfig={handleUpdateAiConfig}
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

          {/* VIEW: KHỐI MCP SERVERS & CÔNG CỤ DỰNG VIDEO CHUYÊN NGHIỆP */}
          {activeView === 'mcp-tools' && (
            <McpVideoToolsHub
              servers={MCP_VIDEO_SERVERS}
              onBack={() => setActiveView('pending-approval')}
              onApplyPromptToProject={(promptText) => {
                showToast('✨ Đã áp dụng câu lệnh góc máy điện ảnh Hollywood!');
                if (selectedProject) {
                  // Cập nhật phân cảnh đầu tiên hoặc prompt tổng thể
                  const updatedStoryboard = selectedProject.storyboard.map((s, idx) =>
                    idx === 0 ? { ...s, visualPrompt: promptText } : s
                  );
                  const updated = {
                    ...selectedProject,
                    storyboard: updatedStoryboard,
                  };
                  setSelectedProject(updated);
                  setProjects(projects.map((p) => (p.id === updated.id ? updated : p)));
                  setActiveView('review');
                } else {
                  setIsCreateModalOpen(true);
                }
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
                currentUser={currentUser}
                channels={channels}
                onUpdateChannels={handleUpdateChannels}
                onOpenLogin={() => setIsAuthModalOpen(true)}
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
              currentUser={currentUser}
              projects={projects}
              driveEmail={driveEmail}
              isConnected={isDriveConnected}
              onUpdateDrive={handleUpdateDrive}
              onOpenLogin={() => setIsAuthModalOpen(true)}
              onBack={() => setActiveView('pending-approval')}
            />
          )}

          {/* VIEW: HƯỚNG DẪN SỬ DỤNG TỪ A-Z */}
          {activeView === 'user-guide' && (
            <UserGuideView
              onBack={() => setActiveView('pending-approval')}
              onNavigateView={(view) => setActiveView(view)}
              onOpenCreateModal={() => {
                if (!currentUser || !currentUser.isLoggedIn) {
                  showToast('⚠️ Vui lòng đăng nhập tài khoản để tạo và lưu dự án video.');
                  setIsAuthModalOpen(true);
                  return;
                }
                setIsCreateModalOpen(true);
              }}
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
          aiConfig={aiConfig}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateProject={handleCreateProject}
          onAddSkill={(newSkill) => {
            setSkills((prev) => [newSkill, ...prev.filter((item) => item.id !== newSkill.id)]);
            showToast(`Đã lưu phong cách biên tập: ${newSkill.name}`);
          }}
          onOpenAiSettings={(prov) => {
            setIsCreateModalOpen(false);
            if (prov) {
              setSelectedAiProvider(prov);
            }
            setActiveView('ai-engine');
          }}
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

      {/* REGISTER MODAL ĐỘC LẬP TỪ HEADER HOẶC BANNER */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsAuthModalOpen(true);
        }}
      />
    </div>
  );
}

export default App;
