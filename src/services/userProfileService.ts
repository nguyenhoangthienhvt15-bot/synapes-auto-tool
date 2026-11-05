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

export interface UserProfileData {
  code: string;
  name: string;
  email: string;
  aiConfig: AIProviderConfig;
  channels: ConnectedChannelAccount[];
  driveEmail: string;
  driveConnected: boolean;
  projects: Project[];
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
      return {
        code: codeClean,
        name: parsed.name || fallbackName,
        email: parsed.email || fallbackEmail,
        aiConfig: parsed.aiConfig || EMPTY_AI_CONFIG,
        channels: parsed.channels || getDisconnectedChannels(fallbackName, fallbackEmail),
        driveEmail: parsed.driveEmail || fallbackEmail,
        driveConnected: !!parsed.driveConnected,
        projects: parsed.projects || [],
      };
    }
  } catch (err) {
    console.warn(`Error reading profile for ${codeClean}`, err);
  }

  // Dành cho tài khoản thử nghiệm VIP-001 nếu đăng nhập trực tiếp
  if (codeClean === 'VIP-001') {
    const demoProfile: UserProfileData = {
      code: 'VIP-001',
      name: fallbackName || 'Anh Hoàng Nam (Studio Media Tech)',
      email: fallbackEmail || 'hoangnam.media@gmail.com',
      aiConfig: DEFAULT_AI_CONFIG,
      channels: [
        {
          id: 'yt',
          platform: 'youtube',
          name: 'YouTube Channel Official',
          handle: '@TechReviewerOfficial',
          avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
          status: 'connected',
          apiScope: 'youtube.upload, youtube.readonly (Direct Upload 5–10 phút)',
          tokenExpiry: 'Còn 58 ngày (Tự động gia hạn)',
          connectedAt: '04/11/2026',
          stats: {
            metricLabel: 'Người đăng ký',
            metricValue: '520.000 subs',
            totalPublishedVideos: 48,
            lastPublishedTime: '10:45 - 04/11/2026',
          },
        },
        {
          id: 'tt',
          platform: 'tiktok',
          name: 'TikTok Creator Shop VN',
          handle: '@techreviewer_vn',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          status: 'connected',
          apiScope: 'video.upload, video.publish, link.anchor (TikTok Shop Affiliate)',
          tokenExpiry: 'Đã xác thực Direct Posting API',
          connectedAt: '03/11/2026',
          stats: {
            metricLabel: 'Lượt theo dõi',
            metricValue: '180.000 followers',
            totalPublishedVideos: 112,
            lastPublishedTime: '12:15 - 04/11/2026',
          },
        },
        {
          id: 'fb',
          platform: 'facebook',
          name: 'Facebook Fanpage Công Nghệ',
          handle: 'Cộng Đồng Yêu Công Nghệ AI',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          status: 'connected',
          apiScope: 'pages_manage_posts, pages_read_engagement, reels_upload',
          tokenExpiry: 'Vĩnh viễn (Page Access Token)',
          connectedAt: '01/11/2026',
          stats: {
            metricLabel: 'Lượt thích trang',
            metricValue: '95.000 likes',
            totalPublishedVideos: 64,
            lastPublishedTime: '20:10 - 03/11/2026',
          },
        },
        {
          id: 'gd',
          platform: 'drive',
          name: 'Google Drive Backup Storage',
          handle: 'synapes.backup@gmail.com',
          avatarUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100&auto=format&fit=crop&q=80',
          status: 'connected',
          apiScope: 'drive.file (Bảo mật tối đa, chỉ truy cập thư mục app tạo)',
          tokenExpiry: 'OAuth 2.0 Refresh Token',
          connectedAt: '28/10/2026',
          stats: {
            metricLabel: 'Dung lượng đã dùng',
            metricValue: '124 GB / 2 TB',
            totalPublishedVideos: 224,
            lastPublishedTime: '11:00 - 05/11/2026',
          },
        },
      ],
      driveEmail: 'synapes.backup@gmail.com',
      driveConnected: true,
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
 * Lưu hồ sơ người dùng
 */
export function saveUserProfile(
  code: string,
  data: Partial<UserProfileData>
): void {
  if (!code) return;
  const codeClean = code.trim().toUpperCase();
  const storageKey = `${USER_DATA_PREFIX}${codeClean}`;

  try {
    const existing = getUserProfile(codeClean);
    const updated: UserProfileData = {
      ...existing,
      ...data,
      code: codeClean,
    };
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (err) {
    console.warn(`Could not save user profile for ${codeClean}`, err);
  }
}
