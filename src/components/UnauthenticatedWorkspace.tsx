import React from 'react';
import {
  Shield, KeyRound, Sparkles, BookOpen, Lock,
  ArrowRight, Video, Cpu, Share2, HardDrive, CheckCircle2
} from 'lucide-react';

interface UnauthenticatedWorkspaceProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenGuide: () => void;
}

export const UnauthenticatedWorkspace: React.FC<UnauthenticatedWorkspaceProps> = ({
  onOpenLogin,
  onOpenRegister,
  onOpenGuide,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-200 select-none">
      {/* Hero Welcome Card */}
      <div className="studio-card p-6 sm:p-10 text-center relative overflow-hidden border border-black/[0.08] bg-gradient-to-b from-white via-[#FCFCFB] to-[#F7F7F5] shadow-xs">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-200/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-black/[0.06] text-zinc-700 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>CHƯA ĐĂNG NHẬP PHIÊN LÀM VIỆC</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight leading-tight">
            Chào Mừng Đến Với SYNAPES Video Studio
          </h1>

          <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed">
            Hệ thống tự động hóa kịch bản, sản xuất video phân cảnh ngắn/dài bằng AI và đăng tải đa kênh.
            Để xem các dự án video, bảo mật cấu hình API Keys và đồng bộ kênh cá nhân, vui lòng đăng nhập tài khoản của bạn.
          </p>

          {/* Action Buttons */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenLogin}
              className="btn-primary px-5 py-2.5 text-xs sm:text-sm flex items-center gap-2 shadow-sm hover:shadow cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Đăng Nhập Tài Khoản Studio</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>

            <button
              onClick={onOpenRegister}
              className="btn-secondary px-5 py-2.5 text-xs sm:text-sm flex items-center gap-2 hover:bg-zinc-100 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Đăng Ký Tài Khoản Mới</span>
            </button>

            <button
              onClick={onOpenGuide}
              className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-900 transition flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Hướng Dẫn Sử Dụng A-Z</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1: AI Engine */}
        <div className="studio-card p-5 space-y-2 border border-black/[0.06] hover:border-black/[0.12] transition">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">API Keys AI Module Riêng Biệt</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Mỗi tài khoản được cấp quyền lưu trữ độc lập các API Keys từ Gemini 2.0 Flash, Claude 3.7 Sonnet, OpenAI GPT-4o, DeepSeek và Grok của riêng bạn.
          </p>
        </div>

        {/* Pillar 2: Video Production */}
        <div className="studio-card p-5 space-y-2 border border-black/[0.06] hover:border-black/[0.12] transition">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Video className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">Bàn Duyệt Kịch Bản & Ghép Clip</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Xem trước video phân cảnh 5-10 giây, kiểm soát lời thoại lồng tiếng TTS tự nhiên chuẩn tiếng Việt và ghép video thành phẩm trong Cửa sổ 2.
          </p>
        </div>

        {/* Pillar 3: Social Channels */}
        <div className="studio-card p-5 space-y-2 border border-black/[0.06] hover:border-black/[0.12] transition">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Share2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">Kênh Xuất Bản YouTube, TikTok, Facebook</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Đăng nhập tài khoản mạng xã hội của riêng bạn để tự động lên lịch phát sóng vào khung giờ vàng, đăng video và theo dõi số liệu trực tiếp.
          </p>
        </div>

        {/* Pillar 4: Google Drive Storage */}
        <div className="studio-card p-5 space-y-2 border border-black/[0.06] hover:border-black/[0.12] transition">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <HardDrive className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">Lưu Trữ Google Drive Độc Lập</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Đồng bộ an toàn mọi thước phim phân rã và video hoàn chỉnh vào Google Drive cá nhân với phạm vi quyền <code>drive.file</code> bảo mật tuyệt đối.
          </p>
        </div>
      </div>

      {/* Trust & Policy Note */}
      <div className="p-4 rounded-xl bg-zinc-100/70 border border-black/[0.05] flex items-start sm:items-center justify-between gap-3 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Hệ thống bảo vệ dữ liệu khách hàng theo Nghị định 13/2023/NĐ-CP và Luật An ninh mạng 2018.</span>
        </div>
        <button
          onClick={onOpenRegister}
          className="text-emerald-700 font-semibold hover:underline flex-shrink-0 cursor-pointer"
        >
          Ký hợp đồng & nhận mã ngay &rarr;
        </button>
      </div>
    </div>
  );
};
