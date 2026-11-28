import React, { useState, useEffect, useRef } from 'react';
import {
  Share2, ShieldCheck, CheckCircle2, ExternalLink, RefreshCw, Key, ArrowLeft,
  LogIn, LogOut, UploadCloud, Check, AlertCircle, X, Copy, HardDrive
} from 'lucide-react';
import { ConnectedChannelAccount, UserAccount } from '../types';
import { getAuthHeaders } from '../services/userProfileService';

interface SocialChannelsViewProps {
  currentUser?: UserAccount | null;
  channels?: ConnectedChannelAccount[];
  onUpdateChannels?: (channels: ConnectedChannelAccount[]) => void;
  onOpenLogin?: () => void;
  onBack?: () => void;
  initialPlatform?: 'all' | 'youtube' | 'tiktok' | 'facebook' | 'drive';
}

const STORAGE_KEY = 'synapes_connected_social_channels';

const DEFAULT_CHANNELS: ConnectedChannelAccount[] = [
  {
    id: 'yt',
    platform: 'youtube',
    name: 'YouTube Channel',
    handle: 'Chưa liên kết kênh',
    avatarUrl: '',
    status: 'disconnected',
    apiScope: 'youtube.upload, youtube.readonly (YouTube Data API v3)',
    tokenExpiry: 'Chưa cấp OAuth Token',
    connectedAt: '',
    stats: {
      metricLabel: 'Người đăng ký',
      metricValue: '0',
      totalPublishedVideos: 0,
      lastPublishedTime: 'Chưa có',
    },
  },
  {
    id: 'tt',
    platform: 'tiktok',
    name: 'TikTok Creator',
    handle: 'Chưa liên kết kênh',
    avatarUrl: '',
    status: 'disconnected',
    apiScope: 'video.upload, video.publish, link.anchor (TikTok Shop Affiliate)',
    tokenExpiry: 'Chưa cấp OAuth Token',
    connectedAt: '',
    stats: {
      metricLabel: 'Lượt theo dõi',
      metricValue: '0',
      totalPublishedVideos: 0,
      lastPublishedTime: 'Chưa có',
    },
  },
  {
    id: 'fb',
    platform: 'facebook',
    name: 'Facebook Fanpage',
    handle: 'Chưa liên kết Fanpage',
    avatarUrl: '',
    status: 'disconnected',
    apiScope: 'pages_manage_posts, pages_read_engagement, reels_upload',
    tokenExpiry: 'Chưa cấp Page Access Token',
    connectedAt: '',
    stats: {
      metricLabel: 'Lượt thích trang',
      metricValue: '0',
      totalPublishedVideos: 0,
      lastPublishedTime: 'Chưa có',
    },
  },
  {
    id: 'gd',
    platform: 'drive',
    name: 'Google Drive Storage',
    handle: 'Chưa liên kết Google Drive',
    avatarUrl: '',
    status: 'disconnected',
    apiScope: 'drive.file (Chỉ truy cập thư mục do ứng dụng tạo)',
    tokenExpiry: 'Chưa cấp OAuth 2.0 Token',
    connectedAt: '',
    stats: {
      metricLabel: 'Dung lượng đã dùng',
      metricValue: 'Chưa đồng bộ',
      totalPublishedVideos: 0,
      lastPublishedTime: 'Chưa có',
    },
  },
];

const PLATFORM_ID_MAP: Record<string, 'yt' | 'tt' | 'fb' | 'gd'> = {
  youtube: 'yt',
  tiktok: 'tt',
  facebook: 'fb',
  drive: 'gd',
};

function formatDateDDMMYYYY(isoOrNow?: string): string {
  const d = isoOrNow ? new Date(isoOrNow) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function formatMetricCount(val: unknown): string {
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0) return '0';
  return n.toLocaleString('vi-VN');
}

function formatScopeList(scopes: unknown, fallback: string): string {
  if (!Array.isArray(scopes) || scopes.length === 0) return fallback;
  return scopes
    .map((s) => String(s).replace('https://www.googleapis.com/auth/', ''))
    .join(', ');
}

interface ServerChannelRecord {
  platform?: string;
  channelName?: string;
  handleOrUrl?: string;
  emailOrId?: string;
  avatarUrl?: string;
  channelId?: string;
  maskedToken?: string;
  status?: 'connected' | 'disconnected' | 'reauth_needed';
  verificationMode?: string;
  grantedScopes?: string[];
  connectedAt?: string;
  hasRefreshToken?: boolean;
  stats?: {
    subscriberCount?: number;
    videoCount?: number;
  };
}

function mergeServerChannelRecord(
  list: ConnectedChannelAccount[],
  rec: ServerChannelRecord | null | undefined
): ConnectedChannelAccount[] {
  if (!rec || !rec.platform) return list;
  const targetId = PLATFORM_ID_MAP[String(rec.platform).toLowerCase()];
  if (!targetId) return list;

  return list.map((c) => {
    if (c.id !== targetId) return c;
    const isReauth = rec.status === 'reauth_needed';
    const nextStatus = isReauth ? ('reauth_needed' as const) : ('connected' as const);
    return {
      ...c,
      name: rec.channelName || c.name,
      handle: rec.handleOrUrl || c.handle,
      email: rec.emailOrId || c.email,
      channelId: rec.channelId || c.channelId,
      avatarUrl: rec.avatarUrl || '',
      status: nextStatus,
      verificationMode: rec.verificationMode || c.verificationMode,
      hasRefreshToken: Boolean(rec.hasRefreshToken),
      connectedAt: formatDateDDMMYYYY(rec.connectedAt) || c.connectedAt,
      tokenExpiry: isReauth
        ? 'OAuth Token hết hạn / bị thu hồi — cần đăng nhập lại'
        : `Đã xác thực OAuth (${rec.maskedToken || 'Verified'})${rec.hasRefreshToken ? ' • Auto-Refresh' : ''}`,
      apiScope: formatScopeList(rec.grantedScopes, c.apiScope),
      stats: {
        ...c.stats,
        metricValue:
          rec.stats && typeof rec.stats.subscriberCount === 'number'
            ? formatMetricCount(rec.stats.subscriberCount)
            : c.stats.metricValue,
        totalPublishedVideos:
          rec.stats && typeof rec.stats.videoCount === 'number'
            ? rec.stats.videoCount
            : c.stats.totalPublishedVideos,
      },
    };
  });
}

const PlatformGlyph: React.FC<{ platform: ConnectedChannelAccount['platform'] }> = ({ platform }) => {
  if (platform === 'youtube') {
    return (
      <div className="w-9 h-9 rounded-full bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </div>
    );
  }
  if (platform === 'tiktok') {
    return (
      <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-zinc-900" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.68a6.34 6.34 0 0 0 10.74 4.54 6.29 6.29 0 0 0 1.93-4.55V8.87a8.28 8.28 0 0 0 4.82 1.54V6.96a4.85 4.85 0 0 1-1-.27z" />
        </svg>
      </div>
    );
  }
  if (platform === 'facebook') {
    return (
      <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-[#0866FF]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
      <HardDrive className="w-4 h-4 text-emerald-700" />
    </div>
  );
};

function sanitizeDisconnectedChannels(list: ConnectedChannelAccount[]): ConnectedChannelAccount[] {
  return list.map((c) => {
    if (c.status !== 'disconnected') return c;
    const def = DEFAULT_CHANNELS.find((d) => d.id === c.id);
    return {
      ...c,
      handle: def?.handle || 'Chưa liên kết kênh',
      email: '',
      avatarUrl: '',
    };
  });
}

export const SocialChannelsView: React.FC<SocialChannelsViewProps> = ({
  currentUser,
  channels: propsChannels,
  onUpdateChannels,
  onOpenLogin,
  onBack,
  initialPlatform = 'all',
}) => {
  const [channels, setChannels] = useState<ConnectedChannelAccount[]>(() => {
    if (propsChannels && propsChannels.length > 0) return sanitizeDisconnectedChannels(propsChannels);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return sanitizeDisconnectedChannels(parsed);
      }
    } catch {
      // fallback
    }
    return DEFAULT_CHANNELS;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'youtube' | 'tiktok' | 'facebook' | 'drive'>(initialPlatform);
  const [activeGuide, setActiveGuide] = useState<'google' | 'tiktok' | 'meta'>('google');
  const [loginModalPlatform, setLoginModalPlatform] = useState<'youtube' | 'tiktok' | 'facebook' | 'drive' | null>(null);
  const [loginTab, setLoginTab] = useState<'oauth_popup' | 'manual_token'>('oauth_popup');
  const [oauthConfig, setOauthConfig] = useState<{ serverConfigured: boolean; redirectUri: string } | null>(null);
  const [inputLoginHint, setInputLoginHint] = useState('');
  const [inputOAuthClientId, setInputOAuthClientId] = useState('');
  const [inputOAuthClientSecret, setInputOAuthClientSecret] = useState('');
  const [copiedKey, setCopiedKey] = useState<'redirect' | 'scopes' | null>(null);

  // Form đăng nhập kênh (luôn để trống khi mở, hỗ trợ auto-fill từ YouTube Data API v3)
  const [inputChannelName, setInputChannelName] = useState('');
  const [inputHandle, setInputHandle] = useState('');
  const [inputEmailOrId, setInputEmailOrId] = useState('');
  const [inputOAuthToken, setInputOAuthToken] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTestingUpload, setIsTestingUpload] = useState<string | null>(null);
  const [avatarBrokenIds, setAvatarBrokenIds] = useState<Record<string, boolean>>({});

  const channelsRef = useRef<ConnectedChannelAccount[]>(channels);
  channelsRef.current = channels;
  const onUpdateChannelsRef = useRef(onUpdateChannels);
  onUpdateChannelsRef.current = onUpdateChannels;
  const oauthPollTimerRef = useRef<number | null>(null);

  const stopOAuthPoll = () => {
    if (oauthPollTimerRef.current !== null) {
      window.clearInterval(oauthPollTimerRef.current);
      oauthPollTimerRef.current = null;
    }
  };

  useEffect(() => () => stopOAuthPoll(), []);

  // Đồng bộ khi propsChannels thay đổi từ App (theo phiên người dùng đăng nhập)
  useEffect(() => {
    if (propsChannels) {
      setChannels(sanitizeDisconnectedChannels(propsChannels));
    }
  }, [propsChannels]);

  useEffect(() => {
    if (initialPlatform) {
      setActiveFilter(initialPlatform);
    }
  }, [initialPlatform]);

  // Tải cấu hình Google OAuth 2.0 & đồng bộ trạng thái kênh xác thực thực trên máy chủ
  useEffect(() => {
    let cancelled = false;
    fetch('/api/oauth/google/config-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.success) {
          setOauthConfig({
            serverConfigured: Boolean(d.serverConfigured),
            redirectUri: String(d.redirectUri || `${window.location.origin}/api/oauth/google/callback`),
          });
        }
      })
      .catch(() => {});

    if (!currentUser?.isLoggedIn || !currentUser?.code) {
      return () => {
        cancelled = true;
      };
    }

    fetch('/api/channels/status', {
      credentials: 'include',
      headers: { ...getAuthHeaders(currentUser.code) },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.success || !d.channels) return;
        let next = channelsRef.current;
        for (const rec of Object.values(d.channels) as ServerChannelRecord[]) {
          next = mergeServerChannelRecord(next, rec);
        }
        setChannels(next);
        onUpdateChannelsRef.current?.(next);
      })
      .catch(() => {});

    fetch('/api/drive/status', {
      credentials: 'include',
      headers: { ...getAuthHeaders(currentUser.code) },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.success) return;
        const driveRec: ServerChannelRecord = {
          platform: 'drive',
          channelName: d.accountName || (d.email ? `Google Drive (${d.email})` : 'Google Drive Storage'),
          handleOrUrl: d.folderUrl || d.email || 'Chưa liên kết Google Drive',
          emailOrId: d.email || '',
          maskedToken: d.maskedToken || '',
          verificationMode: d.verificationMode || '',
          connectedAt: d.connectedAt || '',
          status: d.connected ? 'connected' : 'disconnected',
        };
        const next = mergeServerChannelRecord(channelsRef.current, driveRec);
        setChannels(next);
        onUpdateChannelsRef.current?.(next);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [currentUser?.isLoggedIn, currentUser?.code]);

  // Lắng nghe kết quả OAuth 2.0 callback từ popup Google
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const msg = event.data;
      if (!msg || msg.type !== 'SYNAPES_GOOGLE_OAUTH_RESULT') return;

      stopOAuthPoll();
      setIsSubmittingLogin(false);

      if (msg.success && msg.channel) {
        const updated = mergeServerChannelRecord(channelsRef.current, msg.channel as ServerChannelRecord);
        setChannels(updated);
        onUpdateChannelsRef.current?.(updated);
        if (msg.platform === 'drive' && msg.channel.emailOrId) {
          try {
            localStorage.setItem('synapes_drive_email', msg.channel.emailOrId);
            localStorage.setItem('synapes_drive_connected', 'true');
          } catch {
            // ignore storage error
          }
        }
        setLoginModalPlatform(null);
        setAuthError(null);
        showToast(msg.message || `Đã đăng nhập Google và liên kết kênh "${msg.channel.channelName}" thành công!`);
      } else {
        setAuthError(msg.message || 'Xác thực Google OAuth 2.0 thất bại.');
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleCopyText = async (key: 'redirect' | 'scopes', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
    } catch {
      showToast('⚠️ Không thể tự động sao chép, vui lòng bôi đen để copy thủ công.');
    }
  };

  const handleOpenLoginModal = (platform: 'youtube' | 'tiktok' | 'facebook' | 'drive') => {
    if (!currentUser || !currentUser.isLoggedIn) {
      showToast('⚠️ Vui lòng đăng nhập tài khoản Studio của bạn trước khi liên kết kênh.');
      if (onOpenLogin) onOpenLogin();
      return;
    }
    stopOAuthPoll();
    const isGooglePlatform = platform === 'youtube' || platform === 'drive';
    const userEmail = String(currentUser?.email || '').trim();
    const gmailHint = userEmail.includes('@') && !userEmail.endsWith('.example.com') ? userEmail : '';

    setLoginModalPlatform(platform);
    setLoginTab(isGooglePlatform ? 'oauth_popup' : 'manual_token');
    setInputLoginHint(gmailHint);
    setInputChannelName('');
    setInputHandle('');
    setInputEmailOrId(gmailHint);
    setInputOAuthToken('');
    setAuthError(null);
    setIsSubmittingLogin(false);
  };

  const handleStartGoogleOAuthPopup = async () => {
    if (!loginModalPlatform || isSubmittingLogin) return;
    const plat = loginModalPlatform;
    if (plat !== 'youtube' && plat !== 'drive') return;

    const clientIdClean = inputOAuthClientId.trim();
    if (!oauthConfig?.serverConfigured && !clientIdClean) {
      setAuthError(
        'Máy chủ chưa cấu hình sẵn Google OAuth Client ID. Vui lòng nhập OAuth Client ID (*.apps.googleusercontent.com) từ Google Cloud Console bên trên, hoặc chuyển sang Tab 2 "Xác thực qua Access Token (ya29.a0...)" để kết nối nhanh qua Google OAuth Playground.'
      );
      return;
    }

    setAuthError(null);
    setIsSubmittingLogin(true);
    const popup = window.open(
      'about:blank',
      'synapes_google_oauth',
      'width=540,height=700,menubar=no,toolbar=no,status=no,resizable=yes,scrollbars=yes'
    );

    try {
      const resp = await fetch('/api/oauth/google/start', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(currentUser?.code),
        },
        body: JSON.stringify({
          userCode: currentUser?.code || '',
          platform: plat,
          loginHint: inputLoginHint.trim(),
          clientId: clientIdClean,
          clientSecret: inputOAuthClientSecret.trim(),
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success || !data?.authUrl) {
        if (popup && !popup.closed) popup.close();
        setIsSubmittingLogin(false);
        setAuthError(data?.error || 'Không thể khởi tạo phiên đăng nhập Google OAuth 2.0.');
        return;
      }

      if (popup && !popup.closed) {
        popup.location.href = data.authUrl;
        popup.focus();
      } else {
        const reopened = window.open(data.authUrl, 'synapes_google_oauth', 'width=540,height=700');
        if (!reopened) {
          setIsSubmittingLogin(false);
          setAuthError('Trình duyệt đã chặn cửa sổ popup Google Sign-In. Vui lòng cho phép popup cho trang web này rồi bấm thử lại.');
          return;
        }
      }

      stopOAuthPoll();
      const startedAt = Date.now();
      oauthPollTimerRef.current = window.setInterval(() => {
        if ((popup && popup.closed) || Date.now() - startedAt > 180000) {
          stopOAuthPoll();
          setIsSubmittingLogin(false);
        }
      }, 600);
    } catch (err) {
      if (popup && !popup.closed) popup.close();
      setIsSubmittingLogin(false);
      setAuthError('Lỗi kết nối máy chủ khi tạo Google OAuth URL: ' + String((err as Error)?.message || err));
    }
  };

  const handleConfirmLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginModalPlatform || isSubmittingLogin) return;

    const plat = loginModalPlatform;
    const isGooglePlatform = plat === 'youtube' || plat === 'drive';
    const channelNameClean = inputChannelName.trim();
    const handleClean = inputHandle.trim();
    const emailOrIdClean = inputEmailOrId.trim();
    const tokenClean = inputOAuthToken.trim();

    if (!isGooglePlatform && (channelNameClean.length < 2 || handleClean.length < 2 || !emailOrIdClean)) {
      setAuthError('Vui lòng nhập đầy đủ Tên Kênh, @Handle/URL và Email/Client ID.');
      return;
    }
    if (tokenClean.length < 16) {
      setAuthError('OAuth Access Token / API Key phải có ít nhất 16 ký tự hợp lệ.');
      return;
    }

    setAuthError(null);
    setIsSubmittingLogin(true);
    try {
      const resp = await fetch('/api/channels/connect', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(currentUser?.code),
        },
        body: JSON.stringify({
          userCode: currentUser?.code || '',
          platform: plat,
          channelName: channelNameClean,
          handleOrUrl: handleClean,
          emailOrId: emailOrIdClean,
          oauthToken: tokenClean,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        setAuthError(data?.error || 'Xác thực OAuth Access Token thất bại. Vui lòng kiểm tra lại.');
        return;
      }

      if (plat === 'drive' && (data.emailOrId || emailOrIdClean)) {
        try {
          localStorage.setItem('synapes_drive_email', data.emailOrId || emailOrIdClean);
          localStorage.setItem('synapes_drive_connected', 'true');
        } catch (err) {
          console.warn('Could not save drive login', err);
        }
      }

      const updated = mergeServerChannelRecord(channelsRef.current, {
        platform: plat,
        channelName: data.channelName || channelNameClean,
        handleOrUrl: data.handleOrUrl || handleClean,
        emailOrId: data.emailOrId || emailOrIdClean,
        avatarUrl: data.avatarUrl || '',
        channelId: data.channelId || '',
        maskedToken: data.maskedToken,
        status: 'connected',
        verificationMode: data.verificationMode,
        grantedScopes: data.grantedScopes,
        connectedAt: data.connectedAt || new Date().toISOString(),
        stats: data.stats,
      });

      setChannels(updated);
      onUpdateChannels?.(updated);
      showToast(data.message || `Đã xác thực và liên kết tài khoản ${data.channelName || channelNameClean} thành công!`);
      setLoginModalPlatform(null);
    } catch (err) {
      setAuthError('Không thể kết nối máy chủ xác thực OAuth: ' + String((err as Error)?.message || err));
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleDisconnect = async (channelId: string, name: string) => {
    if (!currentUser || !currentUser.isLoggedIn) {
      showToast('⚠️ Vui lòng đăng nhập tài khoản Studio của bạn.');
      if (onOpenLogin) onOpenLogin();
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn ngắt kết nối tài khoản [${name}]? Bạn sẽ cần xác thực lại Token khi xuất bản video.`)) {
      return;
    }

    const platformMap: Record<string, string> = { yt: 'youtube', tt: 'tiktok', fb: 'facebook', gd: 'drive' };
    const resolvedPlatform = platformMap[channelId] || channelId;
    try {
      await fetch('/api/channels/disconnect', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(currentUser?.code),
        },
        body: JSON.stringify({
          userCode: currentUser?.code || '',
          platform: resolvedPlatform,
        }),
      });
    } catch {
      // ignore network error on disconnect cleanup
    }
    if (resolvedPlatform === 'drive') {
      try {
        localStorage.removeItem('synapes_drive_email');
        localStorage.removeItem('synapes_drive_connected');
      } catch {
        // ignore storage error
      }
    }

    const defaultCard = DEFAULT_CHANNELS.find((d) => d.id === channelId);
    const updated = channels.map((c) => {
      if (c.id === channelId) {
        return defaultCard ? { ...defaultCard } : {
          ...c,
          avatarUrl: '',
          handle: c.platform === 'facebook' ? 'Chưa liên kết Fanpage' : 'Chưa liên kết kênh',
          status: 'disconnected' as const,
          tokenExpiry: 'Chưa cấp OAuth Token',
          connectedAt: '',
        };
      }
      return c;
    });

    setChannels(updated);
    onUpdateChannels?.(updated);
    showToast(`Đã ngắt kết nối tài khoản ${name}.`);
  };

  const handleTestUpload = async (channel: ConnectedChannelAccount) => {
    setIsTestingUpload(channel.id);
    try {
      const resp = await fetch('/api/channels/verify-publish', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(currentUser?.code),
        },
        body: JSON.stringify({
          userCode: currentUser?.code || '',
          platform: channel.platform,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data?.success) {
        const updated = mergeServerChannelRecord(channelsRef.current, {
          platform: channel.platform,
          ...data,
          status: 'connected',
        });
        setChannels(updated);
        onUpdateChannels?.(updated);
        showToast(
          `✅ [${data.liveVerified ? 'Live Google API Verified' : 'Server Verified'}]: Kênh "${data.channelName || channel.name}" (${data.handleOrUrl || channel.handle}) sẵn sàng (${data.maskedToken}${data.expiresIn ? ` • còn ${Math.round(Number(data.expiresIn) / 60)} phút` : ''}).`
        );
      } else {
        if (resp.status === 401 || data?.status === 'reauth_needed') {
          const updated = mergeServerChannelRecord(channelsRef.current, {
            platform: channel.platform,
            status: 'reauth_needed',
          });
          setChannels(updated);
          onUpdateChannels?.(updated);
        }
        showToast(`⚠️ ${data?.error || `Kênh [${channel.name}] chưa xác thực OAuth Access Token thực trên máy chủ.`}`);
      }
    } catch {
      showToast(`⚠️ Không thể kiểm tra trạng thái OAuth trên máy chủ.`);
    } finally {
      setIsTestingUpload(null);
    }
  };

  const handleRefreshToken = (channel: ConnectedChannelAccount) => {
    handleOpenLoginModal(channel.platform);
  };

  const filteredChannels = channels.filter((c) => {
    if (activeFilter === 'all') return true;
    return c.platform === activeFilter;
  });

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-medium animate-slide-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
                Các kênh mạng xã hội đang ở trạng thái chưa liên kết. Vui lòng đăng nhập tài khoản được cấp để xem và đồng bộ dữ liệu kênh của riêng bạn.
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
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Trung Tâm Đăng Nhập & Liên Kết Kênh (OAuth 2.0)</h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              Đăng nhập tài khoản YouTube, TikTok và Facebook để cấp quyền cho công cụ tự động đăng video
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1.5 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
          <span>OAuth Verified • AES-256-GCM Server Encryption</span>
        </span>
      </div>

      {/* Filter Tabs by Platform */}
      <div className="studio-card p-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${activeFilter === 'all'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
        >
          Tất Cả Kênh ({channels.length})
        </button>

        <button
          onClick={() => setActiveFilter('youtube')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${activeFilter === 'youtube'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
        >
          <svg className="w-3.5 h-3.5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <span>YouTube Channel</span>
        </button>

        <button
          onClick={() => setActiveFilter('tiktok')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${activeFilter === 'tiktok'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
        >
          <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.68a6.34 6.34 0 0 0 10.74 4.54 6.29 6.29 0 0 0 1.93-4.55V8.87a8.28 8.28 0 0 0 4.82 1.54V6.96a4.85 4.85 0 0 1-1-.27z" />
          </svg>
          <span>TikTok Creator</span>
        </button>

        <button
          onClick={() => setActiveFilter('facebook')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${activeFilter === 'facebook'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
        >
          <svg className="w-3.5 h-3.5 text-[#0866FF]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>Facebook Fanpage</span>
        </button>
      </div>

      {/* Grid Danh Sách Kênh & Thẻ Đăng Nhập */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredChannels.map((chan) => {
          const isConnected = chan.status === 'connected';
          const needsReauth = chan.status === 'reauth_needed';
          const showAvatarImg = Boolean(chan.avatarUrl) && !avatarBrokenIds[chan.id];

          return (
            <div key={chan.id} className="studio-card p-4 space-y-3.5 flex flex-col justify-between" data-testid={`channel-card-${chan.platform}`}>
              <div className="space-y-3">
                {/* Header Kênh */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {showAvatarImg ? (
                      <img
                        src={chan.avatarUrl}
                        alt={chan.name}
                        onError={() => setAvatarBrokenIds((prev) => ({ ...prev, [chan.id]: true }))}
                        className="w-9 h-9 rounded-full object-cover border border-black/10 flex-shrink-0"
                      />
                    ) : (
                      <PlatformGlyph platform={chan.platform} />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-zinc-900 text-xs truncate">{chan.name}</h3>
                        {isConnected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" title="Đang hoạt động"></span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono truncate">{chan.handle}</div>
                      {chan.email && (isConnected || needsReauth) && (
                        <div className="text-[10px] text-zinc-400 truncate">{chan.email}</div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border flex-shrink-0 flex items-center gap-1 ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : needsReauth
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>ĐÃ LIÊN KẾT</span>
                      </>
                    ) : needsReauth ? (
                      <>
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>CẦN ĐĂNG NHẬP LẠI</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        <span>CHƯA KẾT NỐI</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Chi tiết Quyền hạn & Thống kê */}
                <div className="p-3 rounded-lg bg-zinc-50/70 border border-black/5 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-500">{chan.stats.metricLabel}:</span>
                    <strong className="text-zinc-900 font-numeric">{chan.stats.metricValue}</strong>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-500">Video đã xuất bản:</span>
                    <strong className="text-zinc-900 font-numeric">{chan.stats.totalPublishedVideos} video</strong>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono pt-1 border-t border-black/5 truncate" title={chan.tokenExpiry}>
                    {isConnected || needsReauth ? chan.tokenExpiry : `Quyền API: ${chan.apiScope}`}
                  </div>
                </div>
              </div>

              {/* Các nút thao tác đăng nhập & quản lý */}
              <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2 text-xs">
                {isConnected || needsReauth ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      {/* Nút Kiểm Tra Token Thực hoặc Test Backup */}
                      <button
                        onClick={() => handleTestUpload(chan)}
                        disabled={isTestingUpload === chan.id}
                        className="btn-secondary py-1 px-2.5 text-[11px] inline-flex items-center gap-1"
                        title={chan.platform === 'drive' ? 'Kiểm tra kết nối lưu trữ Google Drive thực' : 'Kiểm tra quyền OAuth Token xuất bản video trên máy chủ'}
                      >
                        <UploadCloud className={`w-3 h-3 ${isTestingUpload === chan.id ? 'animate-bounce text-zinc-900' : 'text-zinc-500'}`} />
                        <span>
                          {isTestingUpload === chan.id
                            ? 'Đang xác thực...'
                            : chan.platform === 'drive'
                              ? 'Kiểm tra Drive'
                              : 'Kiểm tra Token'}
                        </span>
                      </button>

                      {/* Cập nhật lại OAuth Token */}
                      <button
                        onClick={() => handleOpenLoginModal(chan.platform)}
                        className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 transition"
                        title="Cập nhật lại OAuth Token"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Đổi tài khoản / Đăng nhập lại */}
                      <button
                        onClick={() => handleOpenLoginModal(chan.platform)}
                        className="btn-secondary py-1 px-2.5 text-[11px]"
                        title={needsReauth ? 'Đăng nhập lại để cấp mới OAuth Token' : 'Đổi sang tài khoản khác'}
                      >
                        {needsReauth ? 'Đăng Nhập Lại' : 'Đổi tài khoản'}
                      </button>

                      {/* Ngắt kết nối */}
                      <button
                        onClick={() => handleDisconnect(chan.id, chan.name)}
                        className="p-1 rounded text-zinc-400 hover:text-red-600 transition"
                        title="Đăng xuất / Ngắt kết nối tài khoản"
                      >
                        <LogOut className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">Tài khoản chưa được ủy quyền</span>
                    <button
                      onClick={() => handleOpenLoginModal(chan.platform)}
                      className="btn-primary py-1 px-3 text-xs inline-flex items-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Đăng Nhập Tài Khoản</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide Card */}
      <div className="studio-card p-4 sm:p-5 space-y-3.5 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-zinc-700" />
            <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wider font-mono">
              Quy Trình Cấp Token & Kết Nối API Phân Phối
            </span>
          </div>

          <div className="studio-segmented-container">
            <button
              onClick={() => setActiveGuide('google')}
              className={`studio-segmented-item ${activeGuide === 'google' ? 'active' : ''}`}
            >
              1. YouTube API v3
            </button>
            <button
              onClick={() => setActiveGuide('tiktok')}
              className={`studio-segmented-item ${activeGuide === 'tiktok' ? 'active' : ''}`}
            >
              2. TikTok Posting
            </button>
            <button
              onClick={() => setActiveGuide('meta')}
              className={`studio-segmented-item ${activeGuide === 'meta' ? 'active' : ''}`}
            >
              3. Facebook Reels
            </button>
          </div>
        </div>

        {activeGuide === 'google' && (
          <ol className="list-decimal list-inside space-y-2 text-zinc-600 leading-relaxed text-xs">
            <li><strong>Cách 1 (Google Cloud Console OAuth 2.0):</strong> Tạo Web Application Client tại <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-zinc-900 font-medium underline">Google Cloud Credentials</a>, bật <strong>YouTube Data API v3</strong> và thêm Authorized Redirect URI <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-[11px]">{oauthConfig?.redirectUri || '/api/oauth/google/callback'}</code>.</li>
            <li><strong>Cách 2 (Nhanh qua OAuth 2.0 Playground):</strong> Truy cập <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noreferrer" className="text-zinc-900 font-medium underline">OAuth 2.0 Playground</a>, cấp quyền <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-[11px]">youtube.readonly</code> + <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-[11px]">youtube.upload</code> rồi dán Access Token (<code className="font-mono">ya29.a0...</code>).</li>
            <li>Hệ thống tự động gọi <code className="font-mono">tokeninfo</code> &amp; <code className="font-mono">youtube/v3/channels?mine=true</code> để xác thực tài khoản Google và đồng bộ Tên Kênh, <code className="font-mono">@handle</code>, Avatar &amp; Subscriber thật.</li>
          </ol>
        )}

        {activeGuide === 'tiktok' && (
          <ol className="list-decimal list-inside space-y-2 text-zinc-600 leading-relaxed text-xs">
            <li>Truy cập <a href="https://developers.tiktok.com" target="_blank" rel="noreferrer" className="text-zinc-900 font-medium underline">TikTok for Developers</a>.</li>
            <li>Đăng nhập tài khoản TikTok Creator / TikTok Shop Affiliate của bạn.</li>
            <li>Cấp quyền <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-[11px]">video.publish</code> để công cụ tải video ngắn và tự động gắn link sản phẩm.</li>
          </ol>
        )}

        {activeGuide === 'meta' && (
          <ol className="list-decimal list-inside space-y-2 text-zinc-600 leading-relaxed text-xs">
            <li>Truy cập <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-zinc-900 font-medium underline">Meta for Developers</a>.</li>
            <li>Đăng nhập tài khoản Facebook quản trị Fanpage của bạn -&gt; Graph API Explorer.</li>
            <li>Cấp quyền <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-[11px]">pages_manage_posts</code> và <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-[11px]">reels_upload</code>, sau đó nhấn Generate Page Access Token.</li>
          </ol>
        )}

        <div className="pt-3 border-t border-black/5 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-7 text-[11px] text-zinc-600 leading-relaxed space-y-1">
            <div className="font-semibold text-zinc-900">Lưu ý bảo mật OAuth 2.0 Đa Kênh:</div>
            <p>
              Sau khi sao chép OAuth Access Token (YouTube <code className="font-mono">ya29.a0...</code>, TikTok <code className="font-mono">act.xxx...</code>, Meta Page Token <code className="font-mono">EAABsb...</code>), bấm nút <strong>Đăng Nhập / Đổi Tài Khoản</strong> trên từng thẻ kênh bên trên để xác thực và thử xuất bản video mẫu.
            </p>
          </div>
          <div className="lg:col-span-5 rounded-lg border border-black/10 overflow-hidden bg-zinc-100 shadow-2xs">
            <img
              src="/guide-screenshots/social-oauth-guide.png"
              alt="Minh họa cấu hình OAuth YouTube, TikTok và Facebook"
              className="w-full h-auto object-cover block"
            />
          </div>
        </div>
      </div>

      {/* POPUP ĐĂNG NHẬP & ỦY QUYỀN TÀI KHOẢN KÊNH MỚI */}
      {loginModalPlatform && (() => {
        const isGooglePlatform = loginModalPlatform === 'youtube' || loginModalPlatform === 'drive';
        const effectiveRedirectUri =
          oauthConfig?.redirectUri ||
          `${typeof window !== 'undefined' ? window.location.origin : ''}/api/oauth/google/callback`;
        const playgroundScopes =
          loginModalPlatform === 'drive'
            ? 'https://www.googleapis.com/auth/drive.file\nhttps://www.googleapis.com/auth/userinfo.email'
            : 'https://www.googleapis.com/auth/youtube.readonly\nhttps://www.googleapis.com/auth/youtube.upload\nhttps://www.googleapis.com/auth/userinfo.email';

        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-black/10 max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-black/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                    <LogIn className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-zinc-900 font-semibold text-xs uppercase tracking-wider font-mono">
                      Đăng Nhập Tài Khoản {loginModalPlatform === 'youtube' ? 'YouTube' : loginModalPlatform === 'tiktok' ? 'TikTok' : loginModalPlatform === 'facebook' ? 'Facebook' : 'Google Drive'}
                    </h3>
                    <p className="text-zinc-500 text-xs">
                      {loginModalPlatform === 'drive'
                        ? 'Ủy quyền Google Drive API (drive.file) qua OAuth 2.0 thực tế'
                        : 'Ủy quyền OAuth 2.0 & YouTube Data API v3 để đồng bộ kênh thật'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Đóng hộp thoại"
                  onClick={() => {
                    stopOAuthPoll();
                    setLoginModalPlatform(null);
                  }}
                  className="text-zinc-400 hover:text-zinc-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isGooglePlatform && (
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-zinc-100 border border-black/5 text-[11px] font-medium">
                  <button
                    type="button"
                    data-testid="yt-oauth-tab-popup"
                    onClick={() => {
                      setLoginTab('oauth_popup');
                      setAuthError(null);
                    }}
                    className={`py-1.5 px-2.5 rounded-md transition cursor-pointer ${
                      loginTab === 'oauth_popup'
                        ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    1. Đăng nhập Google (OAuth 2.0)
                  </button>
                  <button
                    type="button"
                    data-testid="yt-oauth-tab-token"
                    onClick={() => {
                      setLoginTab('manual_token');
                      setAuthError(null);
                    }}
                    className={`py-1.5 px-2.5 rounded-md transition cursor-pointer ${
                      loginTab === 'manual_token'
                        ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    2. Access Token (OAuth Playground)
                  </button>
                </div>
              )}

              {authError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {isGooglePlatform && loginTab === 'oauth_popup' ? (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-zinc-700 font-medium block mb-1">
                      Tài khoản Google dự kiến đăng nhập (login_hint)
                    </label>
                    <input
                      type="email"
                      data-testid="google-oauth-login-hint"
                      placeholder="tai-khoan-google-cua-ban@gmail.com"
                      value={inputLoginHint}
                      onChange={(e) => setInputLoginHint(e.target.value)}
                      className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-900"
                    />
                  </div>

                  {oauthConfig?.serverConfigured ? (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>
                        Máy chủ đã cấu hình sẵn Google OAuth 2.0 Client. Nhấn nút bên dưới để mở trang đăng nhập Google chính thức (<code className="font-mono">accounts.google.com</code>) và cấp quyền cho kênh YouTube của bạn.
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-[11px] space-y-2.5">
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>Cấu hình OAuth Client ID (hoặc chuyển Tab 2 nếu dùng OAuth Playground)</span>
                      </div>
                      <p className="text-amber-900 leading-relaxed">
                        Biến môi trường <code className="font-mono">GOOGLE_CLIENT_ID</code> trên máy chủ chưa được nạp. Để đăng nhập bằng cửa sổ Google chính thức, tạo Web Application OAuth Client tại Google Cloud Console và thêm đúng Redirect URI sau:
                      </p>
                      <div className="flex items-center gap-1.5 bg-white border border-amber-200 rounded px-2 py-1.5">
                        <code
                          data-testid="google-oauth-redirect-uri"
                          className="text-[10px] font-mono text-zinc-800 truncate flex-1 select-all"
                        >
                          {effectiveRedirectUri}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyText('redirect', effectiveRedirectUri)}
                          className="px-2 py-0.5 rounded bg-zinc-900 text-white text-[10px] inline-flex items-center gap-1 flex-shrink-0 cursor-pointer"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>{copiedKey === 'redirect' ? 'Đã chép' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="space-y-2 pt-1">
                        <div>
                          <label className="text-amber-950 font-medium block mb-1">
                            Google OAuth Client ID *
                          </label>
                          <input
                            type="text"
                            data-testid="google-oauth-client-id"
                            placeholder="123456789-xxxx.apps.googleusercontent.com"
                            value={inputOAuthClientId}
                            onChange={(e) => setInputOAuthClientId(e.target.value)}
                            className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-zinc-900 focus:outline-none focus:border-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="text-amber-950 font-medium block mb-1">
                            Google OAuth Client Secret (khuyên dùng cho Offline Refresh Token)
                          </label>
                          <input
                            type="password"
                            data-testid="google-oauth-client-secret"
                            placeholder="GOCSPX-..."
                            value={inputOAuthClientSecret}
                            onChange={(e) => setInputOAuthClientSecret(e.target.value)}
                            className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-zinc-900 focus:outline-none focus:border-zinc-900"
                          />
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between">
                        <a
                          href="https://console.cloud.google.com/apis/credentials"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-medium text-amber-950 underline inline-flex items-center gap-1"
                        >
                          <span>Mở Google Cloud Credentials</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setLoginTab('manual_token');
                            setAuthError(null);
                          }}
                          className="text-[11px] font-semibold text-zinc-900 underline cursor-pointer"
                        >
                          Dùng Token nhanh (Tab 2) →
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-black/5 text-zinc-600 text-[11px] flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Sau khi bạn đăng nhập tài khoản Google (<strong className="font-mono">{inputLoginHint || 'tai-khoan-google-cua-ban@gmail.com'}</strong>) và bấm Cho phép, hệ thống tự động gọi <strong>YouTube Data API v3</strong> để đồng bộ Tên Kênh, <code className="font-mono">@handle</code>, Avatar, Số Subscriber &amp; Số video thật.
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-black/5">
                    <button
                      type="button"
                      onClick={() => {
                        stopOAuthPoll();
                        setLoginModalPlatform(null);
                      }}
                      className="btn-secondary"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      data-testid="google-oauth-start-btn"
                      onClick={handleStartGoogleOAuthPopup}
                      disabled={isSubmittingLogin}
                      className="btn-primary disabled:opacity-60 inline-flex items-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{isSubmittingLogin ? 'Đang chờ Google OAuth...' : 'Đăng nhập bằng Google (OAuth 2.0)'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConfirmLogin} className="space-y-3 text-xs">
                  {isGooglePlatform && (
                    <div className="p-3 rounded-lg bg-zinc-50 border border-black/10 text-[11px] text-zinc-700 space-y-2">
                      <div className="font-semibold text-zinc-900 flex items-center justify-between gap-2">
                        <span>Hướng dẫn lấy Token nhanh trong 30 giây (không cần tạo Client ID):</span>
                        <a
                          href="https://developers.google.com/oauthplayground/"
                          target="_blank"
                          rel="noreferrer"
                          data-testid="oauth-playground-link"
                          className="text-zinc-900 underline inline-flex items-center gap-1 font-medium flex-shrink-0"
                        >
                          <span>OAuth Playground</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-zinc-600">
                        <li>Mở <strong>Google OAuth 2.0 Playground</strong>, chép các scope dưới đây vào ô <em>Input your own scopes</em> rồi bấm <strong>Authorize APIs</strong> và đăng nhập bằng <strong>{inputLoginHint || 'tai-khoan-google-cua-ban@gmail.com'}</strong>.</li>
                        <li>Bấm <strong>Exchange authorization code for tokens</strong> để nhận <code className="font-mono">Access token (ya29.a0...)</code> và dán vào ô bên dưới.</li>
                      </ol>
                      <div className="flex items-start gap-1.5 bg-white border border-black/10 rounded px-2 py-1.5">
                        <pre className="text-[10px] font-mono text-zinc-700 flex-1 whitespace-pre-wrap select-all m-0">{playgroundScopes}</pre>
                        <button
                          type="button"
                          onClick={() => handleCopyText('scopes', playgroundScopes.replace(/\n/g, ' '))}
                          className="px-2 py-0.5 rounded bg-zinc-900 text-white text-[10px] inline-flex items-center gap-1 flex-shrink-0 cursor-pointer"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>{copiedKey === 'scopes' ? 'Đã chép' : 'Copy Scopes'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-zinc-700 font-medium block mb-1">
                      OAuth 2.0 Access Token / API Key * (tối thiểu 16 ký tự)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={16}
                      data-testid="social-oauth-token-input"
                      placeholder={
                        loginModalPlatform === 'youtube'
                          ? 'ya29.a0... (Dán Access Token từ Google OAuth Playground)'
                          : loginModalPlatform === 'tiktok'
                            ? 'act.xxx... (TikTok Creator Content Posting Token)'
                            : loginModalPlatform === 'facebook'
                              ? 'EAABsb... (Meta Graph Page Access Token)'
                              : 'ya29.a0... (Google Drive OAuth Token)'
                      }
                      value={inputOAuthToken}
                      onChange={(e) => setInputOAuthToken(e.target.value)}
                      className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-700 font-medium block mb-1">
                      {loginModalPlatform === 'drive'
                        ? 'Email Google Drive (tự động nhận diện nếu để trống)'
                        : isGooglePlatform
                          ? 'Email Quản Trị / Gmail (tùy chọn — tự động đọc từ Google)'
                          : 'Email Quản Trị / Client ID *'}
                    </label>
                    <input
                      type="text"
                      required={!isGooglePlatform}
                      placeholder={isGooglePlatform ? 'tai-khoan-google-cua-ban@gmail.com' : 'name@company.com hoặc Channel/Page ID'}
                      value={inputEmailOrId}
                      onChange={(e) => setInputEmailOrId(e.target.value)}
                      className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-zinc-700 font-medium block mb-1">
                        {isGooglePlatform
                          ? 'Tên Kênh (tự động lấy từ YouTube)'
                          : 'Tên Kênh / Fanpage *'}
                      </label>
                      <input
                        type="text"
                        required={!isGooglePlatform}
                        placeholder={isGooglePlatform ? 'Tự động đồng bộ từ API' : 'Ví dụ: Kênh Tin Công Nghệ'}
                        value={inputChannelName}
                        onChange={(e) => setInputChannelName(e.target.value)}
                        className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-700 font-medium block mb-1">
                        {isGooglePlatform
                          ? '@Handle (tự động lấy từ YouTube)'
                          : 'Handle / URL Kênh (@...) *'}
                      </label>
                      <input
                        type="text"
                        required={!isGooglePlatform}
                        placeholder={isGooglePlatform ? '@tu_dong_dong_bo' : 'Ví dụ: @ten_kenh_cua_ban'}
                        value={inputHandle}
                        onChange={(e) => setInputHandle(e.target.value)}
                        className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-900"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-black/5 text-zinc-500 text-[11px] flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>
                      {loginModalPlatform === 'drive'
                        ? 'Máy chủ xác thực live qua oauth2.googleapis.com/tokeninfo và kiểm tra phạm vi drive.file.'
                        : isGooglePlatform
                          ? 'Máy chủ kiểm tra tokeninfo + truy vấn YouTube Data API v3 (channels?mine=true) để đồng bộ kênh thật.'
                          : 'Token được kiểm tra định dạng trên máy chủ trước khi liên kết với hàng đợi xuất bản video.'}
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-black/5">
                    <button
                      type="button"
                      onClick={() => setLoginModalPlatform(null)}
                      className="btn-secondary"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingLogin}
                      className="btn-primary disabled:opacity-60"
                    >
                      {isSubmittingLogin
                        ? 'Đang xác thực với Google...'
                        : loginModalPlatform === 'drive'
                          ? 'Xác Nhận & Cấp Quyền Google Drive'
                          : 'Xác Thực & Liên Kết Kênh'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
