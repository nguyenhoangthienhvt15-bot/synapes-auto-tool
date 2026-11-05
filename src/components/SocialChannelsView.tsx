import React, { useState } from 'react';
import { Share2, ShieldCheck, CheckCircle2, ExternalLink, RefreshCw, Key, ArrowLeft } from 'lucide-react';

interface SocialChannelsViewProps {
  onBack?: () => void;
}

export const SocialChannelsView: React.FC<SocialChannelsViewProps> = ({ onBack }) => {
  const [channels] = useState([
    {
      id: 'yt',
      name: 'YouTube Channel Official',
      platform: 'YouTube',
      handle: '@TechReviewerOfficial (520K subs)',
      status: 'connected',
      apiScope: 'youtube.upload, youtube.readonly',
      tokenExpiry: 'Còn 58 ngày (Tự động gia hạn)',
    },
    {
      id: 'tt',
      name: 'TikTok Creator Shop',
      platform: 'TikTok',
      handle: '@techreviewer_vn (180K followers)',
      status: 'connected',
      apiScope: 'video.upload, video.publish, link.anchor',
      tokenExpiry: 'Đã xác thực Direct Posting API',
    },
    {
      id: 'fb',
      name: 'Facebook Fanpage Công Nghệ',
      platform: 'Facebook',
      handle: 'Cộng Đồng Yêu Công Nghệ AI (95K likes)',
      status: 'connected',
      apiScope: 'pages_manage_posts, pages_read_engagement',
      tokenExpiry: 'Vĩnh viễn (Page Access Token)',
    },
    {
      id: 'gd',
      name: 'Google Drive Backup Storage',
      platform: 'Google Drive',
      handle: 'synapes.backup@gmail.com (Dung lượng: 120GB/2TB)',
      status: 'connected',
      apiScope: 'drive.file (Bảo mật tối đa, chỉ truy cập file app tạo)',
      tokenExpiry: 'OAuth 2.0 Refresh Token',
    },
  ]);

  const [activeGuide, setActiveGuide] = useState<'google' | 'tiktok' | 'meta'>('google');

  return (
    <div className="space-y-4 animate-fade-in select-none">
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
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Kênh Phân Phối & Quản Lý OAuth API</h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              Cấp quyền xuất bản tự động lên YouTube, TikTok, Facebook Reels và sao lưu đám mây
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1.5 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
          <span>OAuth Encrypted (AES-256)</span>
        </span>
      </div>

      {/* Grid Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {channels.map((chan) => (
          <div key={chan.id} className="studio-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900 text-xs">{chan.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-zinc-700" />
                <span>ĐÃ KẾT NỐI</span>
              </span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50/70 border border-black/5 text-xs space-y-1">
              <div className="text-zinc-900 font-mono text-[11px] font-medium">{chan.handle}</div>
              <div className="text-[11px] text-zinc-500">
                <span className="font-medium text-zinc-700">Quyền hạn: </span>
                <span className="font-mono">{chan.apiScope}</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono pt-0.5">
                {chan.tokenExpiry}
              </div>
            </div>

            <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs">
              <button
                onClick={() => alert(`Đã làm mới token cho ${chan.name}`)}
                className="text-zinc-500 hover:text-zinc-900 transition flex items-center gap-1.5 font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Làm mới token</span>
              </button>
              <button
                onClick={() => alert('Cổng OAuth nền tảng đang hoạt động...')}
                className="text-zinc-900 hover:text-black flex items-center gap-1 font-medium transition"
              >
                <span>Cấu hình</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Guide Card */}
      <div className="studio-card p-4 sm:p-5 space-y-3.5 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-zinc-700" />
            <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wider font-mono">
              Quy Trình Cấp Token & Kết Nối API
            </span>
          </div>

          <div className="studio-segmented-container">
            <button
              onClick={() => setActiveGuide('google')}
              className={`studio-segmented-item ${activeGuide === 'google' ? 'active' : ''}`}
            >
              1. Google / YouTube
            </button>
            <button
              onClick={() => setActiveGuide('tiktok')}
              className={`studio-segmented-item ${activeGuide === 'tiktok' ? 'active' : ''}`}
            >
              2. TikTok
            </button>
            <button
              onClick={() => setActiveGuide('meta')}
              className={`studio-segmented-item ${activeGuide === 'meta' ? 'active' : ''}`}
            >
              3. Facebook
            </button>
          </div>
        </div>

        {activeGuide === 'google' && (
          <ol className="list-decimal list-inside space-y-2 text-zinc-600 leading-relaxed text-xs">
            <li>Truy cập <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-zinc-900 font-medium underline">Google Cloud Console</a>.</li>
            <li>Kích hoạt <strong>YouTube Data API v3</strong> và <strong>Google Drive API</strong>.</li>
            <li>Tạo OAuth 2.0 Client ID (Web Application) và dán thông tin kết nối bảo mật.</li>
          </ol>
        )}

        {activeGuide === 'tiktok' && (
          <ol className="list-decimal list-inside space-y-2 text-zinc-600 leading-relaxed text-xs">
            <li>Truy cập <a href="https://developers.tiktok.com" target="_blank" rel="noreferrer" className="text-zinc-900 font-medium underline">TikTok for Developers</a>.</li>
            <li>Đăng ký Content Posting API và cấp quyền <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-[11px]">video.publish</code> trực tiếp.</li>
          </ol>
        )}

        {activeGuide === 'meta' && (
          <ol className="list-decimal list-inside space-y-2 text-zinc-600 leading-relaxed text-xs">
            <li>Truy cập <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-zinc-900 font-medium underline">Meta for Developers</a>.</li>
            <li>Tạo App dạng Business và kích hoạt Graph API Reels Publishing Permissions.</li>
          </ol>
        )}
      </div>
    </div>
  );
};
