import React, { useState } from 'react';
import { Share2, HardDrive, ShieldCheck, CheckCircle2, ExternalLink, RefreshCw, Key } from 'lucide-react';

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

  const [activeGuide, setActiveGuide] = useState<'google' | 'tiktok' | 'meta' | null>('google');

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Header */}
      <div className="apple-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold border border-black/[0.08] transition apple-btn-tap flex items-center gap-1.5 shadow-2xs mr-1"
              title="Thoát kênh phân phối, quay lại bàn duyệt"
            >
              <span>← Quay Lại</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] flex-shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1D1D1F] tracking-tight">Kênh Phân Phối & API</h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              Ủy quyền xuất bản lên YouTube, TikTok, Facebook Reels và sao lưu Drive an toàn
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Token Encrypted (AES-256)
        </span>
      </div>

      {/* Grid Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((chan) => (
          <div key={chan.id} className="apple-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1D1D1F] text-xs">{chan.name}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã kết nối
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-black/[0.06] text-xs space-y-1">
              <div className="text-zinc-800 font-mono font-medium text-[11px]">{chan.handle}</div>
              <div className="text-[10px] text-zinc-500">
                <span className="font-semibold text-zinc-600">Quyền: </span>{chan.apiScope}
              </div>
            </div>

            <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-[11px]">
              <button
                onClick={() => alert(`Đã làm mới token cho ${chan.name}`)}
                className="text-zinc-500 hover:text-zinc-800 transition flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" /> Làm mới token
              </button>
              <button
                onClick={() => alert('Cổng OAuth nền tảng...')}
                className="text-[#0071E3] hover:underline flex items-center gap-1 font-semibold"
              >
                Cấu hình <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Hướng dẫn kết nối */}
      <div className="apple-card p-5 space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <span className="text-[#1D1D1F] font-bold flex items-center gap-1.5">
            <Key className="w-4 h-4 text-[#FF9500]" />
            Hướng dẫn kết nối API nền tảng
          </span>

          <div className="apple-segmented-container">
            <button
              onClick={() => setActiveGuide('google')}
              className={`apple-segmented-item ${activeGuide === 'google' ? 'active' : ''}`}
            >
              1. Google/YouTube
            </button>
            <button
              onClick={() => setActiveGuide('tiktok')}
              className={`apple-segmented-item ${activeGuide === 'tiktok' ? 'active' : ''}`}
            >
              2. TikTok
            </button>
            <button
              onClick={() => setActiveGuide('meta')}
              className={`apple-segmented-item ${activeGuide === 'meta' ? 'active' : ''}`}
            >
              3. Facebook
            </button>
          </div>
        </div>

        {activeGuide === 'google' && (
          <ol className="list-decimal list-inside space-y-1.5 text-zinc-600 leading-relaxed text-[11px]">
            <li>Truy cập <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-[#0071E3] underline font-medium">Google Cloud Console</a>.</li>
            <li>Bật <strong>YouTube Data API v3</strong> và <strong>Google Drive API</strong>.</li>
            <li>Tạo OAuth 2.0 Client ID (Web Application) và dán thông tin kết nối bảo mật.</li>
          </ol>
        )}

        {activeGuide === 'tiktok' && (
          <ol className="list-decimal list-inside space-y-1.5 text-zinc-600 leading-relaxed text-[11px]">
            <li>Truy cập <a href="https://developers.tiktok.com" target="_blank" rel="noreferrer" className="text-[#0071E3] underline font-medium">TikTok for Developers</a>.</li>
            <li>Đăng ký Content Posting API và cấp quyền <code>video.publish</code> trực tiếp.</li>
          </ol>
        )}

        {activeGuide === 'meta' && (
          <ol className="list-decimal list-inside space-y-1.5 text-zinc-600 leading-relaxed text-[11px]">
            <li>Truy cập <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-[#0071E3] underline font-medium">Meta for Developers</a>.</li>
            <li>Tạo App dạng Business và kích hoạt Graph API Reels Publishing Permissions.</li>
          </ol>
        )}
      </div>
    </div>
  );
};
