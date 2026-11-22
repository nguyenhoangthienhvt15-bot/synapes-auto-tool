import {
  AIProviderConfig,
  ConnectedChannelAccount,
  Project,
  UserAccount,
} from '../types';
import {
  DEFAULT_AI_CONFIG,
  INITIAL_PROJECTS,
} from '../data/mockData';

export interface UserPersonalizationPrefs {
  defaultAspectRatio?: '16:9' | '9:16';
  defaultPlatform?: 'youtube' | 'tiktok' | 'facebook';
  preferredVoiceGender?: 'male' | 'female';
  autoCloudBackup?: boolean;
  lastServerBackupAt?: string;
  lastBackupChecksum?: string;
}

export interface UserProfileData {
  code: string;
  name: string;
  email: string;
  aiConfig: AIProviderConfig;
  channels: ConnectedChannelAccount[];
  driveEmail: string;
  driveConnected: boolean;
  projects: Project[];
  preferences?: UserPersonalizationPrefs;
}

const ACTIVE_SESSION_KEY = 'synapes_active_user_session';
const USER_DATA_PREFIX = 'synapes_user_profile_';

export const EMPTY_AI_CONFIG: AIProviderConfig = {
  mode: 'gemini',
  activeProvider: 'gemini',
  gemini: {
    apiKey: '',
    model: 'gemini-2.0-flash',
    ttsVoice: 'vi-VN-Standard-B (Nam Bắc chuẩn)',
  },
  openai: {
    apiKey: '',
    model: 'gpt-4o',
    endpointUrl: 'https://api.openai.com/v1',
  },
  claude: {
    apiKey: '',
    model: 'claude-3-7-sonnet-20250219',
    endpointUrl: 'https://api.anthropic.com/v1',
  },
  deepseek: {
    apiKey: '',
    model: 'deepseek-chat',
    endpointUrl: 'https://api.deepseek.com/v1',
  },
  grok: {
    apiKey: '',
    model: 'grok-2',
    endpointUrl: 'https://api.x.ai/v1',
  },
  plugin: {
    id: 'kling-default',
    name: 'Kling Video Gen v1.5 (URL Plugin)',
    endpointUrl: 'https://api.klingai.com/v1/videos/text2video',
    apiToken: '',
    inputMapping: '{"prompt": "{prompt}", "duration": {duration}, "aspect_ratio": "{aspect_ratio}"}',
    outputMapping: '{"video_url": "data.video_url"}',
    timeoutSeconds: 120,
  },
  threeDEngine: {
    provider: 'huggingface-zerogpu',
    apiKey: '',
    workerUrl: '',
    modelId: 'tencent/Hunyuan3D-2mv',
  },
};

export const getDisconnectedChannels = (
  userName: string = '',
  userEmail: string = ''
): ConnectedChannelAccount[] => [
  {
    id: 'yt',
    platform: 'youtube',
    name: 'Kênh YouTube',
    handle: userEmail ? `@${userEmail.split('@')[0]}` : 'Chưa liên kết',
    status: 'disconnected',
    apiScope: 'youtube.upload, youtube.readonly (Direct Upload 5–10 phút)',
    tokenExpiry: 'Chưa cấp quyền',
    connectedAt: '',
    stats: {
      metricLabel: 'Người đăng ký',
      metricValue: '0 subs',
      totalPublishedVideos: 0,
    },
  },
  {
    id: 'tt',
    platform: 'tiktok',
    name: 'Tài khoản TikTok Creator',
    handle: 'Chưa liên kết',
    status: 'disconnected',
    apiScope: 'video.upload, video.publish, link.anchor',
    tokenExpiry: 'Chưa cấp quyền',
    connectedAt: '',
    stats: {
      metricLabel: 'Lượt theo dõi',
      metricValue: '0 followers',
      totalPublishedVideos: 0,
    },
  },
  {
    id: 'fb',
    platform: 'facebook',
    name: 'Facebook Fanpage / Reels',
    handle: 'Chưa liên kết',
    status: 'disconnected',
    apiScope: 'pages_manage_posts, reels_upload',
    tokenExpiry: 'Chưa cấp quyền',
    connectedAt: '',
    stats: {
      metricLabel: 'Lượt thích trang',
      metricValue: '0 likes',
      totalPublishedVideos: 0,
    },
  },
  {
    id: 'gd',
    platform: 'drive',
    name: 'Google Drive Storage',
    handle: userEmail || 'Chưa liên kết',
    status: 'disconnected',
    apiScope: 'drive.file (Bảo mật thư mục riêng)',
    tokenExpiry: 'Chưa cấp quyền',
    connectedAt: '',
    stats: {
      metricLabel: 'Dung lượng đã dùng',
      metricValue: '0 GB / 15 GB',
      totalPublishedVideos: 0,
    },
  },
];

/**
 * Lấy phiên đăng nhập hiện tại từ localStorage
 * Trả về null nếu chưa đăng nhập (không còn mặc định VIP-001)
 */
export function getActiveSession(): UserAccount | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const user: UserAccount = JSON.parse(raw);
    if (user && user.isLoggedIn && user.code) {
      return user;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Lưu phiên đăng nhập của người dùng
 */
export function setActiveSession(user: UserAccount | null): void {
  try {
    if (user && user.isLoggedIn) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch (err) {
    console.warn('Could not set active session', err);
  }
}

/**
 * Xóa hoàn toàn phiên đăng nhập (Đăng xuất)
 */
export function clearActiveSession(): void {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (err) {
    console.warn('Could not clear active session', err);
  }
}

/**
 * Lấy toàn bộ dữ liệu hồ sơ cá nhân của người dùng (API Keys, Kênh, Dự án...)
 * Dựa trên Mã Code được cấp
 */
export function getUserProfile(
  code: string,
  fallbackName: string = '',
  fallbackEmail: string = ''
): UserProfileData {
  const codeClean = (code || '').trim().toUpperCase();
  const storageKey = `${USER_DATA_PREFIX}${codeClean}`;

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed: UserProfileData = JSON.parse(raw);
      const rawCfg = parsed.aiConfig || EMPTY_AI_CONFIG;
      const sanitizedGeminiKey =
        rawCfg.gemini?.apiKey === 'AIzaSyA8B2C9D10E_DEMO_KEY_OFFICIAL'
          ? ''
          : rawCfg.gemini?.apiKey || '';
      const sanitizedAiConfig = {
        ...rawCfg,
        gemini: {
          ...rawCfg.gemini,
          apiKey: sanitizedGeminiKey,
          model: rawCfg.gemini?.model || 'gemini-2.5-flash',
        },
      };
      return {
        code: codeClean,
        name: parsed.name || fallbackName,
        email: parsed.email || fallbackEmail,
        aiConfig: sanitizedAiConfig,
        channels: parsed.channels || getDisconnectedChannels(fallbackName, fallbackEmail),
        driveEmail: parsed.driveEmail || fallbackEmail,
        driveConnected: !!parsed.driveConnected,
        projects: parsed.projects || [],
      };
    }
  } catch (err) {
    console.warn(`Error reading profile for ${codeClean}`, err);
  }

  // Tài khoản VIP-001 cũng khởi tạo ở trạng thái chưa liên kết kênh/Drive giả lập
  if (codeClean === 'VIP-001') {
    const demoProfile: UserProfileData = {
      code: 'VIP-001',
      name: fallbackName || 'Anh Hoàng Nam (Studio Media Tech)',
      email: fallbackEmail || 'hoangnam.media@gmail.com',
      aiConfig: DEFAULT_AI_CONFIG,
      channels: getDisconnectedChannels(fallbackName, fallbackEmail),
      driveEmail: fallbackEmail || '',
      driveConnected: false,
      projects: INITIAL_PROJECTS,
    };
    saveUserProfile('VIP-001', demoProfile);
    return demoProfile;
  }

  // Khách hàng thông thường hoặc tài khoản mới cấp (SNP_...)
  const freshProfile: UserProfileData = {
    code: codeClean,
    name: fallbackName,
    email: fallbackEmail,
    aiConfig: { ...EMPTY_AI_CONFIG },
    channels: getDisconnectedChannels(fallbackName, fallbackEmail),
    driveEmail: fallbackEmail,
    driveConnected: false,
    projects: [],
  };

  saveUserProfile(codeClean, freshProfile);
  return freshProfile;
}

/**
 * Lưu hồ sơ người dùng vào LocalStorage + tự động đồng bộ sao lưu lên máy chủ (Cloud Backup)
 */
const syncTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function getAuthHeaders(userCode?: string): Record<string, string> {
  try {
    let code = String(userCode || '').trim().toUpperCase();
    let token = '';
    if (code) {
      token = sessionStorage.getItem(`synapes_auth_token_${code}`) || localStorage.getItem(`synapes_auth_token_${code}`) || '';
    }
    if (!token) {
      const activeRaw = localStorage.getItem('synapes_active_user_v1');
      if (activeRaw) {
        const activeUser = JSON.parse(activeRaw);
        const activeCode = String(activeUser?.code || '').trim().toUpperCase();
        if (activeCode) {
          token =
            sessionStorage.getItem(`synapes_auth_token_${activeCode}`) ||
            localStorage.getItem(`synapes_auth_token_${activeCode}`) ||
            '';
        }
      }
    }
    if (!token) {
      token = sessionStorage.getItem('synapes_auth_token') || '';
    }
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
        'X-Synapes-Auth-Token': token,
      };
    }
  } catch {
    // ignore storage access issues
  }
  return {};
}

export async function syncUserProfileToServer(
  code: string,
  explicitData?: UserProfileData
): Promise<{ success: boolean; updatedAt?: string; sha256Checksum?: string; error?: string }> {
  const codeClean = (code || '').trim().toUpperCase();
  if (!codeClean) return { success: false, error: 'Missing user code' };
  const payload = explicitData || getUserProfile(codeClean);
  try {
    const resp = await fetch('/api/user/profile-backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(codeClean),
      },
      body: JSON.stringify({ userCode: codeClean, profile: payload }),
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok && data?.success) {
      try {
        const storageKey = `${USER_DATA_PREFIX}${codeClean}`;
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed: UserProfileData = JSON.parse(raw);
          parsed.preferences = {
            ...(parsed.preferences || {}),
            lastServerBackupAt: data.updatedAt,
            lastBackupChecksum: data.sha256Checksum,
          };
          localStorage.setItem(storageKey, JSON.stringify(parsed));
        }
      } catch {
        // ignore localStorage metadata write error
      }
      return {
        success: true,
        updatedAt: data.updatedAt,
        sha256Checksum: data.sha256Checksum,
      };
    }
    return { success: false, error: data?.error || `HTTP ${resp.status}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

function mergeProjectsServerFirst(
  serverProjects: Project[] = [],
  localProjects: Project[] = []
): Project[] {
  const merged: Project[] = [];
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();

  for (const p of [...serverProjects, ...localProjects]) {
    if (!p || !p.id) continue;
    const normTitle = (p.title || '').trim().toLowerCase();
    if (seenIds.has(p.id) || (normTitle && seenTitles.has(normTitle))) {
      continue;
    }
    seenIds.add(p.id);
    if (normTitle) seenTitles.add(normTitle);
    merged.push(p);
  }
  return merged;
}

export async function restoreUserProfileFromServer(
  code: string
): Promise<{ success: boolean; profile?: UserProfileData; checksumValid?: boolean; updatedAt?: string; error?: string }> {
  const codeClean = (code || '').trim().toUpperCase();
  if (!codeClean) return { success: false, error: 'Thiếu mã tài khoản.' };
  try {
    const resp = await fetch(`/api/user/profile-backup?code=${encodeURIComponent(codeClean)}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(codeClean),
      },
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok && data?.success && data.profile) {
      const storageKey = `${USER_DATA_PREFIX}${codeClean}`;
      const localProfile = getUserProfile(codeClean);
      const serverProfile = data.profile as UserProfileData;
      const mergedProjects = mergeProjectsServerFirst(
        Array.isArray(serverProfile.projects) ? serverProfile.projects : [],
        Array.isArray(localProfile.projects) ? localProfile.projects : []
      );
      const mergedAiConfig: AIProviderConfig = {
        ...localProfile.aiConfig,
        ...(serverProfile.aiConfig || {}),
        gemini: {
          ...localProfile.aiConfig?.gemini,
          ...(serverProfile.aiConfig?.gemini || {}),
          apiKey:
            localProfile.aiConfig?.gemini?.apiKey ||
            serverProfile.aiConfig?.gemini?.apiKey ||
            '',
        },
      };
      const merged: UserProfileData = {
        ...localProfile,
        ...serverProfile,
        code: codeClean,
        aiConfig: mergedAiConfig,
        projects: mergedProjects,
        preferences: {
          ...(localProfile.preferences || {}),
          ...(serverProfile.preferences || {}),
          lastServerBackupAt: data.updatedAt,
          lastBackupChecksum: data.sha256Checksum,
        },
      };
      localStorage.setItem(storageKey, JSON.stringify(merged));
      return {
        success: true,
        profile: merged,
        checksumValid: Boolean(data.checksumValid),
        updatedAt: data.updatedAt,
      };
    }
    return { success: false, error: data?.error || 'Không tìm thấy bản sao lưu máy chủ.' };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export function exportUserProfileBackupFile(code: string): boolean {
  const codeClean = (code || '').trim().toUpperCase();
  if (!codeClean) return false;
  try {
    const profile = getUserProfile(codeClean);
    const exportObj = {
      schema: 'SYNAPES_STUDIO_BACKUP_V2',
      exportedAt: new Date().toISOString(),
      userCode: codeClean,
      profile,
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SYNAPES_Backup_${codeClean}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export function saveUserProfile(
  code: string,
  data: Partial<UserProfileData>
): void {
  if (!code) return;
  const codeClean = code.trim().toUpperCase();
  const storageKey = `${USER_DATA_PREFIX}${codeClean}`;

  // Đọc trực tiếp từ localStorage thay vì gọi getUserProfile() để tránh đệ quy vô hạn khi chưa có bản ghi
  let existing: UserProfileData = {
    code: codeClean,
    name: '',
    email: '',
    aiConfig: { ...EMPTY_AI_CONFIG },
    channels: getDisconnectedChannels(),
    driveEmail: '',
    driveConnected: false,
    projects: [],
  };
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        existing = { ...existing, ...parsed };
      }
    }
  } catch {
    // ignore corrupt stored JSON and overwrite cleanly
  }

  const updated: UserProfileData = {
    ...existing,
    ...data,
    code: codeClean,
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (err) {
    console.warn(`LocalStorage quota exceeded for ${codeClean}, pruning transient media cache & syncing immediately`, err);
    try {
      const prunedProjects = (updated.projects || []).map((p, idx) =>
        idx > 5
          ? {
              ...p,
              customAudioUrl: p.customAudioUrl?.startsWith('data:') ? '' : p.customAudioUrl,
              storyboard: (p.storyboard || []).map((s) => ({
                ...s,
                imageUrl: s.imageUrl?.startsWith('data:') ? '' : s.imageUrl,
                customAudioUrl: s.customAudioUrl?.startsWith('data:') ? '' : s.customAudioUrl,
                customMediaUrl: s.customMediaUrl?.startsWith('data:') ? '' : s.customMediaUrl,
              })),
            }
          : p
      );
      localStorage.setItem(storageKey, JSON.stringify({ ...updated, projects: prunedProjects }));
    } catch {
      // ignore if still full; immediate server sync preserves data
    }
    void syncUserProfileToServer(codeClean, updated);
    return;
  }

  const prevTimer = syncTimers.get(codeClean);
  if (prevTimer) clearTimeout(prevTimer);
  syncTimers.set(
    codeClean,
    setTimeout(() => {
      void syncUserProfileToServer(codeClean, updated);
    }, 650)
  );
}

