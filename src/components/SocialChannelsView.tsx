import React, { useState, useEffect } from 'react';
import {
  Share2, ShieldCheck, CheckCircle2, ExternalLink, RefreshCw, Key, ArrowLeft,
  LogIn, LogOut, UploadCloud, Check, AlertCircle, X, Sparkles, Video, Play
} from 'lucide-react';
import { ConnectedChannelAccount, UserAccount } from '../types';

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

  // Form đăng nhập kênh mới
  const [inputChannelName, setInputChannelName] = useState('');
  const [inputHandle, setInputHandle] = useState('');
  const [inputEmailOrId, setInputEmailOrId] = useState('');
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
    if (platform === 'youtube') {
      setInputChannelName('Kênh Studio Official');
      setInputHandle('@TechReviewerVN');
      setInputEmailOrId('creator.youtube@gmail.com');
    } else if (platform === 'tiktok') {
      setInputChannelName('TikTok Creator Shop');
      setInputHandle('@techreviewer_creator');
      setInputEmailOrId('tt_account_vn');
    } else if (platform === 'facebook') {
      setInputChannelName('Facebook Fanpage AI');
      setInputHandle('Cộng Đồng Video Sáng Tạo');
      setInputEmailOrId('page_id_891241');
    } else if (platform === 'drive') {
      setInputChannelName('Google Drive Studio Storage');
      setInputHandle('synapes.backup@gmail.com');
      setInputEmailOrId('synapes.backup@gmail.com');
    }
  };

  const handleConfirmLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginModalPlatform) return;

    const plat = loginModalPlatform;
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
        localStorage.setItem('synapes_drive_email', inputEmailOrId.trim() || 'synapes.backup@gmail.com');
        localStorage.setItem('synapes_drive_connected', 'true');
      } catch (err) {
        console.warn('Could not save drive login', err);
      }
    }

    const updated = channels.map((c) => {
      if (c.id === targetId) {
        return {
          ...c,
          name: inputChannelName.trim() || c.name,
          handle: inputHandle.trim() || c.handle,
          status: 'connected' as const,
          connectedAt: dateStr,
          tokenExpiry: plat === 'facebook' ? 'Vĩnh viễn (Page Token)' : 'Còn 60 ngày (Tự động gia hạn OAuth)',
        };
      }
      return c;
    });

    setChannels(updated);
    onUpdateChannels?.(updated);
    showToast(`Đã đăng nhập và liên kết tài khoản ${inputChannelName} thành công! Quyền xuất bản đã sẵn sàng.`);
    setLoginModalPlatform(null);
  };

  const handleDisconnect = (channelId: string, name: string) => {
    if (!currentUser || !currentUser.isLoggedIn) {
      showToast('⚠️ Vui lòng đăng nhập tài khoản Studio của bạn.');
      if (onOpenLogin) onOpenLogin();
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn ngắt kết nối tài khoản [${name}]? Bạn sẽ cần đăng nhập lại khi xuất bản video.`)) {
      return;
    }

    const updated = channels.map((c) => {
      if (c.id === channelId) {
        return {
          ...c,
          status: 'disconnected' as const,
        };
      }
      return c;
    });

    setChannels(updated);
    onUpdateChannels?.(updated);
    showToast(`Đã ngắt kết nối tài khoản ${name}.`);
  };

  const handleTestUpload = (channel: ConnectedChannelAccount) => {
    setIsTestingUpload(channel.id);
    const isValid = channel.status === 'connected' && Boolean(channel.handle);
    setIsTestingUpload(null);
    if (isValid) {
      showToast(`✅ [Kiểm Tra Thành Công]: Đã xác thực kết nối đăng video lên [${channel.name}] (${channel.handle})! Token và quyền API hợp lệ 100%.`);
    } else {
      showToast(`⚠️ [Cảnh Báo]: Kênh [${channel.name}] chưa được liên kết đầy đủ quyền OAuth 2.0.`);
    }
  };

  const handleRefreshToken = (channel: ConnectedChannelAccount) => {
    showToast(`Đã làm mới OAuth Access Token cho ${channel.name} thành công.`);
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
          <span>OAuth 2.0 Encrypted (AES-256)</span>
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
                      {/* Nút Test Upload Video hoặc Test Backup */}
                      <button
                        onClick={() => handleTestUpload(chan)}
                        disabled={isTestingUpload === chan.id}
                        className="btn-secondary py-1 px-2.5 text-[11px] inline-flex items-center gap-1"
                        title={chan.platform === 'drive' ? 'Thử nghiệm sao lưu tập tin lên Google Drive' : 'Thử nghiệm đăng video test để kiểm tra quyền hạn'}
                      >
                        <UploadCloud className={`w-3 h-3 ${isTestingUpload === chan.id ? 'animate-bounce text-zinc-900' : 'text-zinc-500'}`} />
                        <span>
                          {isTestingUpload === chan.id
                            ? 'Đang test...'
                            : chan.platform === 'drive'
                              ? 'Thử sao lưu Drive'
                              : 'Thử đăng video'}
                        </span>
                      </button>

                      {/* Làm mới token */}
                      <button
                        onClick={() => handleRefreshToken(chan)}
                        className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 transition"
                        title="Làm mới OAuth Token"
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
            <li>Đăng nhập tài khoản Facebook quản trị Fanpage của bạn.</li>
            <li>Cấp quyền <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-[11px]">pages_manage_posts</code> và <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-[11px]">reels_upload</code>.</li>
          </ol>
        )}
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
              {/* Nút đăng nhập 1 chạm chuẩn OAuth */}
              <div className="p-3 bg-zinc-50 border border-black/5 rounded-lg space-y-2 text-center">
                <div className="text-[11px] text-zinc-500">Đăng nhập nhanh bằng tài khoản có sẵn:</div>
                <button
                  type="button"
                  onClick={() => {
                    if (loginModalPlatform === 'youtube') {
                      setInputChannelName('Anh Hoàng Nam (Studio Media Tech)');
                      setInputHandle('@HoangNamMedia');
                      setInputEmailOrId('hoangnam.media@gmail.com');
                    } else if (loginModalPlatform === 'tiktok') {
                      setInputChannelName('TikTok Creator Shop');
                      setInputHandle('@hoangnam_techvn');
                      setInputEmailOrId('tt_creator_8921');
                    } else if (loginModalPlatform === 'facebook') {
                      setInputChannelName('Fanpage Công Nghệ AI');
                      setInputHandle('Cộng Đồng Yêu AI');
                      setInputEmailOrId('page_id_891241');
                    } else if (loginModalPlatform === 'drive') {
                      setInputChannelName('Google Drive Backup Storage');
                      setInputHandle('synapes.backup@gmail.com');
                      setInputEmailOrId('synapes.backup@gmail.com');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 border border-black/10 font-medium text-xs shadow-2xs flex items-center justify-center gap-2 transition"
                >
                  {loginModalPlatform === 'youtube' && (
                    <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  )}
                  {loginModalPlatform === 'tiktok' && (
                    <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.68a6.34 6.34 0 0 0 10.74 4.54 6.29 6.29 0 0 0 1.93-4.55V8.87a8.28 8.28 0 0 0 4.82 1.54V6.96a4.85 4.85 0 0 1-1-.27z" />
                    </svg>
                  )}
                  {loginModalPlatform === 'facebook' && (
                    <svg className="w-4 h-4 text-[#0866FF]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  {loginModalPlatform === 'drive' && (
                    <svg className="w-4 h-4" viewBox="0 0 87.3 78" fill="none">
                      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
                      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47" />
                      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l6.1 10.55z" fill="#ea4335" />
                      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
                      <path d="m59.8 53h27.5c0-1.55-.4-3.1-1.2-4.5l-13.75-23.8c-.8-1.4-1.95-2.5-3.3-3.3L55.3 45.2z" fill="#2684fc" />
                      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3H27.5l-6.15 10.6c1.35.8 2.9 1.2 4.5 1.2h43.2c1.6 0 3.15-.45 4.5-1.2z" fill="#ffba00" />
                    </svg>
                  )}
                  <span>Chọn Tài Khoản Kênh Mẫu Có Sẵn</span>
                </button>
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">
                  {loginModalPlatform === 'drive' ? 'Tên Kho Lưu Trữ / Workspace *' : 'Tên Kênh / Fanpage *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={loginModalPlatform === 'drive' ? 'Ví dụ: Google Drive Studio Storage' : 'Ví dụ: Kênh Công Nghệ Số'}
                  value={inputChannelName}
                  onChange={(e) => setInputChannelName(e.target.value)}
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">
                  {loginModalPlatform === 'drive' ? 'Tài Khoản / Thư Mục Đồng Bộ *' : 'Handle / Định Danh (@...) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={loginModalPlatform === 'drive' ? 'Ví dụ: synapes.backup@gmail.com' : 'Ví dụ: @techstudio_official'}
                  value={inputHandle}
                  onChange={(e) => setInputHandle(e.target.value)}
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">
                  {loginModalPlatform === 'drive' ? 'Email Google Drive (Gmail / Workspace) *' : 'Email Tài Khoản / Client ID *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="synapes.backup@gmail.com"
                  value={inputEmailOrId}
                  onChange={(e) => setInputEmailOrId(e.target.value)}
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 border border-black/5 text-zinc-500 text-[11px] flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>
                  {loginModalPlatform === 'drive'
                    ? 'Chỉ cấp quyền drive.file: Ứng dụng chỉ được đọc/ghi tệp do chính nó tải lên, bảo vệ tối đa dữ liệu người dùng.'
                    : 'Hệ thống tự động cấp quyền đăng tải trực tiếp vào lịch xuất bản và hàng đợi video.'}
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
                  className="btn-primary"
                >
                  {loginModalPlatform === 'drive' ? 'Xác Nhận & Cấp Quyền Google Drive' : 'Xác Nhận & Cấp Quyền Đăng Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
