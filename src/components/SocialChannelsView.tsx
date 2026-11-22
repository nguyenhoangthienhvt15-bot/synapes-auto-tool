import React, { useState, useEffect } from 'react';
import {
  Share2, ShieldCheck, CheckCircle2, ExternalLink, RefreshCw, Key, ArrowLeft,
  LogIn, LogOut, UploadCloud, Check, AlertCircle, X, Sparkles, Video, Play
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
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    status: 'disconnected',
    apiScope: 'youtube.upload, youtube.readonly (Direct Upload 5–10 phút)',
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
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
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
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
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
    avatarUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100&auto=format&fit=crop&q=80',
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

export const SocialChannelsView: React.FC<SocialChannelsViewProps> = ({
  currentUser,
  channels: propsChannels,
  onUpdateChannels,
  onOpenLogin,
  onBack,
  initialPlatform = 'all',
}) => {
  const [channels, setChannels] = useState<ConnectedChannelAccount[]>(() => {
    if (propsChannels && propsChannels.length > 0) return propsChannels;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_CHANNELS;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'youtube' | 'tiktok' | 'facebook' | 'drive'>(initialPlatform);
  const [activeGuide, setActiveGuide] = useState<'google' | 'tiktok' | 'meta'>('google');
  const [loginModalPlatform, setLoginModalPlatform] = useState<'youtube' | 'tiktok' | 'facebook' | 'drive' | null>(null);

  // Form đăng nhập kênh mới — luôn để trống, bắt buộc nhập Credential/Token thực
  const [inputChannelName, setInputChannelName] = useState('');
  const [inputHandle, setInputHandle] = useState('');
  const [inputEmailOrId, setInputEmailOrId] = useState('');
  const [inputOAuthToken, setInputOAuthToken] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTestingUpload, setIsTestingUpload] = useState<string | null>(null);

  // Đồng bộ khi propsChannels thay đổi từ App (theo phiên người dùng đăng nhập)
  useEffect(() => {
    if (propsChannels) {
      setChannels(propsChannels);
    }
  }, [propsChannels]);

  useEffect(() => {
    if (initialPlatform) {
      setActiveFilter(initialPlatform);
    }
  }, [initialPlatform]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenLoginModal = (platform: 'youtube' | 'tiktok' | 'facebook' | 'drive') => {
    if (!currentUser || !currentUser.isLoggedIn) {
      showToast('⚠️ Vui lòng đăng nhập tài khoản Studio của bạn trước khi liên kết kênh.');
      if (onOpenLogin) onOpenLogin();
      return;
    }
    setLoginModalPlatform(platform);
    setInputChannelName('');
    setInputHandle('');
    setInputEmailOrId('');
    setInputOAuthToken('');
    setAuthError(null);
  };

  const handleConfirmLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginModalPlatform || isSubmittingLogin) return;

    const plat = loginModalPlatform;
    const channelNameClean = inputChannelName.trim();
    const handleClean = inputHandle.trim();
    const emailOrIdClean = inputEmailOrId.trim();
    const tokenClean = inputOAuthToken.trim();

    if (channelNameClean.length < 2 || handleClean.length < 2 || !emailOrIdClean) {
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

      const now = new Date();
      const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
      const idMap: Record<string, 'yt' | 'tt' | 'fb' | 'gd'> = {
        youtube: 'yt',
        tiktok: 'tt',
        facebook: 'fb',
        drive: 'gd',
      };
      const targetId = idMap[plat];

      if (plat === 'drive') {
        try {
          localStorage.setItem('synapes_drive_email', emailOrIdClean);
          localStorage.setItem('synapes_drive_connected', 'true');
        } catch (err) {
          console.warn('Could not save drive login', err);
        }
      }

      const updated = channels.map((c) => {
        if (c.id === targetId) {
          return {
            ...c,
            name: channelNameClean,
            handle: handleClean,
            status: 'connected' as const,
            connectedAt: dateStr,
            tokenExpiry: `Đã xác thực OAuth (${data.maskedToken || 'Token Verified'})`,
          };
        }
        return c;
      });

      setChannels(updated);
      onUpdateChannels?.(updated);
      showToast(`Đã xác thực và liên kết tài khoản ${channelNameClean} thành công!`);
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
    try {
      await fetch('/api/channels/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(currentUser?.code),
        },
        body: JSON.stringify({
          userCode: currentUser?.code || '',
          platform: platformMap[channelId] || channelId,
        }),
      });
    } catch {
      // ignore network error on disconnect cleanup
    }

    const updated = channels.map((c) => {
      if (c.id === channelId) {
        return {
          ...c,
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
        showToast(`✅ [Xác Thực Máy Chủ]: Kênh [${channel.name}] (${channel.handle}) có OAuth Token hợp lệ (${data.maskedToken}).`);
      } else {
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

          return (
            <div key={chan.id} className="studio-card p-4 space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Header Kênh */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={chan.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={chan.name}
                      className="w-9 h-9 rounded-full object-cover border border-black/10 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-zinc-900 text-xs truncate">{chan.name}</h3>
                        {isConnected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" title="Đang hoạt động"></span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono truncate">{chan.handle}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border flex-shrink-0 flex items-center gap-1 ${isConnected
                        ? 'bg-zinc-100 text-zinc-800 border-zinc-200'
                        : 'bg-red-50 text-red-600 border-red-200'
                      }`}
                  >
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>ĐÃ LIÊN KẾT</span>
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
                  <div className="text-[10px] text-zinc-400 font-mono pt-1 border-t border-black/5 truncate">
                    Quyền API: {chan.apiScope}
                  </div>
                </div>
              </div>

              {/* Các nút thao tác đăng nhập & quản lý */}
              <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2 text-xs">
                {isConnected ? (
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
                      {/* Đổi tài khoản */}
                      <button
                        onClick={() => handleOpenLoginModal(chan.platform)}
                        className="btn-secondary py-1 px-2.5 text-[11px]"
                        title="Đổi sang tài khoản khác"
                      >
                        Đổi tài khoản
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
            <li>Truy cập <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-zinc-900 font-medium underline">Google Cloud Console</a>.</li>
            <li>Kích hoạt <strong>YouTube Data API v3</strong> và <strong>Google Drive API</strong>.</li>
            <li>Đăng nhập bằng tài khoản Google sở hữu kênh YouTube và chấp thuận quyền <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-[11px]">youtube.upload</code> để đăng video 5–10 phút tự động.</li>
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
      {loginModalPlatform && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-black/10 max-w-md w-full p-5 shadow-2xl space-y-4">
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
                      ? 'Ủy quyền Google Drive API (drive.file) để tự động sao lưu dự án'
                      : 'Ủy quyền OAuth 2.0 để xuất bản video tự động'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLoginModalPlatform(null)}
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
                  {loginModalPlatform === 'drive' ? 'Tên Kho Lưu Trữ / Workspace *' : 'Tên Kênh / Fanpage *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={loginModalPlatform === 'drive' ? 'Ví dụ: Kho Lưu Trữ Studio' : 'Ví dụ: Kênh Tin Công Nghệ'}
                  value={inputChannelName}
                  onChange={(e) => setInputChannelName(e.target.value)}
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">
                  {loginModalPlatform === 'drive' ? 'Thư Mục / URL Google Drive *' : 'Handle / URL Kênh (@...) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={loginModalPlatform === 'drive' ? 'Ví dụ: https://drive.google.com/drive/folders/...' : 'Ví dụ: @ten_kenh_cua_ban'}
                  value={inputHandle}
                  onChange={(e) => setInputHandle(e.target.value)}
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">
                  {loginModalPlatform === 'drive' ? 'Email Google Drive (Gmail / Workspace) *' : 'Email Quản Trị / Client ID *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="name@company.com hoặc Channel/Page ID"
                  value={inputEmailOrId}
                  onChange={(e) => setInputEmailOrId(e.target.value)}
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>

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
                      ? 'ya29.a0... (YouTube Data API v3 OAuth Token)'
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

              <div className="p-2.5 rounded-lg bg-zinc-50 border border-black/5 text-zinc-500 text-[11px] flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>
                  {loginModalPlatform === 'drive'
                    ? 'Chỉ cấp quyền drive.file: Ứng dụng chỉ được đọc/ghi tệp do chính nó tải lên, bảo vệ tối đa dữ liệu người dùng.'
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
                    ? 'Đang xác thực...'
                    : loginModalPlatform === 'drive'
                      ? 'Xác Nhận & Cấp Quyền Google Drive'
                      : 'Xác Thực & Liên Kết Kênh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
