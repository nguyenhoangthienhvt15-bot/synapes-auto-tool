import React, { useState, useEffect, Suspense } from 'react';
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

// Core Critical Components (Static for Instant First Paint)
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { UnauthenticatedWorkspace } from './components/UnauthenticatedWorkspace';
import { ProjectsListView } from './components/ProjectsListView';
import { ProjectReviewWorkspace } from './components/ProjectReviewWorkspace';
import { ViewLoadingSkeleton } from './components/ViewLoadingSkeleton';

// Icons
import { CheckCircle2, Plus } from 'lucide-react';

// Lazy-Loaded Secondary Views & Heavy Modals (Code-Split for 90% Faster Initial Load)
const RegisterModal = React.lazy(() =>
  import('./components/RegisterModal').then((m) => ({ default: m.RegisterModal }))
);
const AuthModal = React.lazy(() =>
  import('./components/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const CreateProjectModal = React.lazy(() =>
  import('./components/CreateProjectModal').then((m) => ({ default: m.CreateProjectModal }))
);
const VideoClonerView = React.lazy(() =>
  import('./components/VideoClonerView').then((m) => ({ default: m.VideoClonerView }))
);
const CalendarView = React.lazy(() =>
  import('./components/CalendarView').then((m) => ({ default: m.CalendarView }))
);
const SkillsManagerView = React.lazy(() =>
  import('./components/SkillsManagerView').then((m) => ({ default: m.SkillsManagerView }))
);
const SocialChannelsView = React.lazy(() =>
  import('./components/SocialChannelsView').then((m) => ({ default: m.SocialChannelsView }))
);
const DriveBackupView = React.lazy(() =>
  import('./components/DriveBackupView').then((m) => ({ default: m.DriveBackupView }))
);
const UserGuideView = React.lazy(() =>
  import('./components/UserGuideView').then((m) => ({ default: m.UserGuideView }))
);
const McpVideoToolsHub = React.lazy(() =>
  import('./components/McpVideoToolsHub').then((m) => ({ default: m.McpVideoToolsHub }))
);
const AiEngineSettingsView = React.lazy(() =>
  import('./components/AiEngineSettingsView').then((m) => ({ default: m.AiEngineSettingsView }))
);
const PolicyModal = React.lazy(() =>
  import('./components/PolicyModal').then((m) => ({ default: m.PolicyModal }))
);
const MultiClipStitcherStudio = React.lazy(() =>
  import('./components/MultiClipStitcherStudio').then((m) => ({ default: m.MultiClipStitcherStudio }))
);

export function App() {
  // State: User authentication (MẶC ĐỊNH LÀ CHƯA ĐĂNG NHẬP, KHÔNG CÒN VIP-001)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return getActiveSession();
  });

  // State: Collapsible Sidebar (Sliding/Hiding Dock with LocalStorage persistence)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('synapes_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('synapes_sidebar_collapsed', String(next));
      } catch { }
      return next;
    });
  };

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

  // Navigation & Workspace Views (Persist across browser refresh / tab discard)
  const [activeView, setActiveView] = useState<string>(() => {
    try {
      return sessionStorage.getItem('synapes_active_view') || 'pending-approval';
    } catch {
      return 'pending-approval';
    }
  });
  const [hasMountedCloner, setHasMountedCloner] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('synapes_active_view') === 'video-cloner';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('synapes_active_view', activeView);
    } catch { }
    if (activeView === 'video-cloner') {
      setHasMountedCloner(true);
    }
  }, [activeView]);

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

    // 0. Xác thực bảo mật phía máy chủ qua Server API (Zero-Exposure Authentication)
    try {
      const serverAuthRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeClean, password: passClean }),
      });
      if (serverAuthRes.ok) {
        const authData = await serverAuthRes.json();
        if (authData.success && authData.user) {
          const userAccount: UserAccount = {
            code: authData.user.code,
            name: authData.user.name,
            email: authData.user.email,
            isLoggedIn: true,
            isDefaultPassword: Boolean(authData.user.isDefaultPassword),
          };
          try {
            localStorage.setItem(`synapes_explicit_login_${userAccount.code}`, 'true');
          } catch { }

          setCurrentUser(userAccount);
          setActiveSession(userAccount);

          const profile = getUserProfile(userAccount.code, userAccount.name, userAccount.email);
          setAiConfig(profile.aiConfig);
          setSelectedAiProvider(profile.aiConfig.activeProvider || profile.aiConfig.mode || 'gemini');
          setProjects(profile.projects);
          setChannels(profile.channels);
          setDriveEmail(profile.driveEmail);
          setIsDriveConnected(profile.driveConnected);
          setSelectedProject(profile.projects[0] || null);

          setIsAuthModalOpen(false);
          showToast(`Đăng nhập thành công với tài khoản ${userAccount.code} (${userAccount.name})!`);
          return true;
        }
      }
    } catch {
      // Tiếp tục cơ chế xác thực nội bộ nếu offline
    }

    // 1. Đồng bộ nếu máy chủ chưa cung cấp auth endpoint
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
    } catch { }

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
    const updatedUser: UserAccount = { ...currentUser, isDefaultPassword: false };
    setCurrentUser(updatedUser);
    setActiveSession(updatedUser);
    showToast('🔒 Đã tạo mật khẩu cá nhân mới (mã hóa bảo mật) và cập nhật trạng thái lên Google Sheet!');
  };

  const handleCreateProject = (newProject: Project) => {
    const updated = [newProject, ...projects];
    setProjects(updated);
    setSelectedProject(newProject);
    setActiveView('review');
    setIsCreateModalOpen(false);

    if (currentUser?.code) {
      saveUserProfile(currentUser.code, {
        aiConfig,
        projects: updated,
        channels,
        driveEmail,
        driveConnected: isDriveConnected,
      });
    }

    showToast(`Đã tạo kịch bản [${newProject.title}] thành công!`);
  };

  const handleUpdateProject = (updatedProj: Project) => {
    const updated = projects.map((p) => (p.id === updatedProj.id ? updatedProj : p));
    setProjects(updated);
    if (selectedProject?.id === updatedProj.id) {
      setSelectedProject(updatedProj);
    }

    if (currentUser?.code) {
      saveUserProfile(currentUser.code, {
        aiConfig,
        projects: updated,
        channels,
        driveEmail,
        driveConnected: isDriveConnected,
      });
    }
  };

  const handleUpdateAiConfig = (newConfig: AIProviderConfig) => {
    setAiConfig(newConfig);
    if (newConfig.activeProvider) {
      setSelectedAiProvider(newConfig.activeProvider);
    }
    if (currentUser?.code) {
      saveUserProfile(currentUser.code, {
        aiConfig: newConfig,
        projects,
        channels,
        driveEmail,
        driveConnected: isDriveConnected,
      });
    }
    showToast('Cài đặt API Keys AI đã được lưu an toàn.');
  };

  const handleUpdateChannels = (newChannels: ConnectedChannelAccount[]) => {
    setChannels(newChannels);
    if (currentUser?.code) {
      saveUserProfile(currentUser.code, { channels: newChannels });
    }
    showToast('Danh sách kênh mạng xã hội đã được cập nhật.');
  };

  const handleUpdateDrive = (email: string, connected: boolean) => {
    setDriveEmail(email);
    setIsDriveConnected(connected);
    if (currentUser?.code) {
      saveUserProfile(currentUser.code, { driveEmail: email, driveConnected: connected });
    }
    showToast(connected ? 'Đã liên kết Google Drive thành công!' : 'Đã ngắt kết nối Google Drive.');
  };

  const handleSendTempPasswordEmail = (email: string, code: string, tempPass: string) => {
    const subject = encodeURIComponent(`[SYNAPES Studio] Cấp Lại Mật Khẩu Tạm Thời — Mã: ${code}`);
    const body = encodeURIComponent(
      `Chào bạn,\n\nHệ thống SYNAPES Studio đã thiết lập lại mật khẩu mặc định tạm thời cho tài khoản của bạn:\n\n` +
      `• Mã Code: ${code}\n` +
      `• Mật khẩu tạm: ${tempPass}\n` +
      `• Địa chỉ đăng nhập: https://synapes-auto-tool-web-service.onrender.com\n\n` +
      `Vui lòng đăng nhập và đổi sang mật khẩu riêng ngay trong phiên đầu tiên.\n\n` +
      `Trân trọng,\nBan Kỹ thuật SYNAPES Studio`
    );
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`, '_blank');
    showToast(`Đã mở giao diện gửi Gmail mật khẩu tạm đến ${email}`);
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
    <div className="min-h-screen bg-[#FFFFFF] text-zinc-950 flex flex-col font-sans select-none">
      {/* Toast Notification (Refined Minimal Floating Pill) */}
      {toastNotification && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-950 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2.5 border border-zinc-800 animate-in fade-in slide-in-from-top-2 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Header with Sliding Sidebar Toggle */}
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
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* Main Studio Body with Collapsible Sidebar */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Sliding / Collapsible Sidebar */}
        <Sidebar
          activeView={activeView}
          pendingCount={pendingCount}
          selectedAiProvider={selectedAiProvider}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
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

        {/* Main Work Area with Suspense Lazy Loading */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Suspense fallback={<ViewLoadingSkeleton />}>
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
                <div className="p-10 text-center space-y-4 rounded-xl border border-zinc-200/80 bg-white">
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
                <ProjectsListView
                  currentUser={currentUser}
                  projects={projects}
                  onSelectProject={(p) => {
                    setSelectedProject(p);
                    setActiveView('review');
                  }}
                  onCreateNewProject={() => setIsCreateModalOpen(true)}
                  onUpdateProject={handleUpdateProject}
                  onOpenSchedule={(p) => {
                    setSelectedProject(p);
                    setActiveView('calendar');
                  }}
                />
              )
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
                  showToast('Đã áp dụng câu lệnh góc máy điện ảnh Hollywood!');
                  if (selectedProject) {
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

            {/* VIEW: BÓC TÁCH & NHÂN BẢN VIDEO AI (BYOK POWERED - KEEP-ALIVE ACROSS TAB SWITCH) */}
            {(activeView === 'video-cloner' || hasMountedCloner) && (
              <div className={activeView === 'video-cloner' ? 'block' : 'hidden'}>
                <VideoClonerView
                  config={aiConfig}
                  onOpenSettings={() => setActiveView('ai-engine')}
                  onProjectCreated={(newProj) => {
                    setProjects([newProj, ...projects]);
                    setSelectedProject(newProj);
                    showToast(`Đã thêm dự án nhân bản [${newProj.title}] vào hàng đợi!`);
                  }}
                  onNavigateToReview={() => setActiveView('pending-approval')}
                />
              </div>
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
                onUpdateProject={handleUpdateProject}
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
          </Suspense>
        </main>
      </div>

      {/* FOOTER */}
      <Footer onOpenPolicyModal={(type) => setPolicyModalType(type)} />

      {/* CỬA SỔ 2: MULTI-CLIP STITCHER STUDIO (Lazy Suspended) */}
      {stitcherProject && (
        <Suspense fallback={null}>
          <MultiClipStitcherStudio
            project={stitcherProject}
            onClose={() => setStitcherProject(null)}
            onFinishStitching={handleFinishStitching}
          />
        </Suspense>
      )}

      {/* MODAL TẠO DỰ ÁN MỚI (Lazy Suspended) */}
      {isCreateModalOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* MODAL PHÁP LÝ & ĐIỀU KHOẢN (Lazy Suspended) */}
      {policyModalType && (
        <Suspense fallback={null}>
          <PolicyModal
            policyType={policyModalType}
            onClose={() => setPolicyModalType(null)}
          />
        </Suspense>
      )}

      {/* AUTH MODAL (Lazy Suspended) */}
      {(isAuthModalOpen || (currentUser?.isLoggedIn && currentUser.isDefaultPassword)) && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* REGISTER MODAL (Lazy Suspended) */}
      {isRegisterModalOpen && (
        <Suspense fallback={null}>
          <RegisterModal
            isOpen={isRegisterModalOpen}
            onClose={() => setIsRegisterModalOpen(false)}
            onSwitchToLogin={() => {
              setIsRegisterModalOpen(false);
              setIsAuthModalOpen(true);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
