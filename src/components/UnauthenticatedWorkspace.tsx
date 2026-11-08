import React from 'react';
import {
  KeyRound, BookOpen, Lock, ArrowRight, Video,
  Cpu, Share2, ShieldCheck, CheckCircle2, FileText
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
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-10 animate-in fade-in duration-200 select-none">
      {/* Hero Welcome Card */}
      <div className="p-8 sm:p-12 text-center relative rounded-xl border border-zinc-200/90 bg-white shadow-2xs">
        <div className="relative z-10 max-w-2xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-mono tracking-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
            <span>CHƯA XÁC THỰC PHIÊN LÀM VIỆC • VUI LÒNG ĐĂNG NHẬP</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight leading-snug">
            Nền Tảng Tự Động Hóa Sản Xuất & Điều Phối Nội Dung Số
          </h1>

          <p className="text-zinc-600 text-xs sm:text-[13px] leading-relaxed max-w-xl mx-auto">
            Hệ thống cung cấp giải pháp khép kín từ nghiên cứu chủ đề, phân rã kịch bản đa mô thức, tạo phân cảnh video 16:9 và 9:16 đến đồng bộ xuất bản đa kênh có kiểm duyệt.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenLogin}
              className="btn-primary px-5 py-2.5 text-xs sm:text-sm flex items-center gap-2 shadow-xs hover:shadow transition cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Đăng Nhập Tài Khoản Studio</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>

            <button
              onClick={onOpenRegister}
              className="px-5 py-2.5 rounded-md border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-900 font-medium text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <FileText className="w-4 h-4 text-zinc-700" />
              <span>Đăng Ký Ký Hợp Đồng Mới</span>
            </button>

            <button
              onClick={onOpenGuide}
              className="px-4 py-2.5 text-xs text-zinc-500 hover:text-zinc-900 transition flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Hướng Dẫn Sử Dụng A-Z</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Pillars Grid (Refined Craft Minimalist Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1: AI Engine */}
        <div className="p-5 rounded-lg border border-zinc-200/80 bg-white hover:border-zinc-300 transition space-y-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-[13px] font-semibold text-zinc-900 tracking-tight">Động Cơ Xử Lý Đa Mô Thức Độc Lập</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Mỗi tài khoản lưu trữ và mã hóa riêng biệt các khóa API (Gemini 2.5, Claude 3.7 Sonnet, GPT-4o, DeepSeek-V3, Grok) kết hợp với các Webhook Engine ngoại vi.
          </p>
        </div>

        {/* Pillar 2: Video Production */}
        <div className="p-5 rounded-lg border border-zinc-200/80 bg-white hover:border-zinc-300 transition space-y-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800">
            <Video className="w-4 h-4" />
          </div>
          <h3 className="text-[13px] font-semibold text-zinc-900 tracking-tight">Phòng Thu Kịch Bản & Ghép Cảnh Đa Tầng</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Hỗ trợ khuôn mẫu Video Dài (16:9) và Video Ngắn / Shorts (9:16), kiểm soát lời thoại lồng tiếng TTS tự nhiên tiếng Việt và ghép nối thành phẩm trong Cửa sổ 2.
          </p>
        </div>

        {/* Pillar 3: Social Channels */}
        <div className="p-5 rounded-lg border border-zinc-200/80 bg-white hover:border-zinc-300 transition space-y-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800">
            <Share2 className="w-4 h-4" />
          </div>
          <h3 className="text-[13px] font-semibold text-zinc-900 tracking-tight">Điều Phối Xuất Bản Đa Nền Tảng</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Đồng bộ lịch phát sóng giờ vàng (Goldtime 18:00 - 20:30) cho YouTube, TikTok, Facebook Reels và sao lưu tự động tệp dự án về Google Drive cá nhân.
          </p>
        </div>

        {/* Pillar 4: Security & Compliance */}
        <div className="p-5 rounded-lg border border-zinc-200/80 bg-white hover:border-zinc-300 transition space-y-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-[13px] font-semibold text-zinc-900 tracking-tight">Bảo Mật AES-256 & Pháp Lý Hợp Đồng</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Tuân thủ Nghị định 13/2023/NĐ-CP và Luật Sở hữu trí tuệ. Hợp đồng điện tử ký số có con dấu đỏ tròn của Trưởng ban và quy trình kiểm duyệt 2 cấp chặt chẽ.
          </p>
        </div>
      </div>

      {/* Trust & Compliance Banner */}
      <div className="p-4 rounded-lg bg-zinc-50/80 border border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Hệ thống bảo mật tiêu chuẩn DMCA & mã hóa bcrypt một chiều cho mật khẩu người dùng.</span>
        </div>
        <button
          onClick={onOpenRegister}
          className="text-zinc-900 font-semibold hover:underline flex items-center gap-1 cursor-pointer flex-shrink-0"
        >
          <span>Khám phá các gói hợp đồng</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
