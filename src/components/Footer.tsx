import React from 'react';
import { Mail, ExternalLink, Headphones, ShieldCheck, CheckCircle2, Cpu, FileText } from 'lucide-react';

interface FooterProps {
  onOpenPolicyModal?: (policyType: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPolicyModal }) => {
  const developerEmail = 'nguyenhoangthien.hvt.15@gmail.com';
  const mailSubject = encodeURIComponent('LIÊN HỆ NHÀ PHÁT TRIỂN');
  const gmailDirectUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${developerEmail}&su=${mailSubject}`;
  const mailtoUrl = `mailto:${developerEmail}?subject=${mailSubject}`;

  return (
    <footer className="w-full bg-[#FFFFFF] text-zinc-600 text-xs border-t border-black/[0.08] pt-8 pb-8 px-5 lg:px-10 mt-14 select-none">
      {/* Top Banner: Apple Connected Developer & SLA Ribbon */}
      <div className="max-w-7xl mx-auto mb-7 pb-5 border-b border-black/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black/[0.04] border border-black/[0.06] flex items-center justify-center text-[#0071E3]">
            <Headphones className="w-4 h-4 text-[#0071E3]" />
          </div>
          <div>
            <h4 className="text-[#1D1D1F] font-semibold text-xs tracking-tight">
              SYNAPES Auto Tool — Trung Tâm Điều Hành & Duyệt Xuất Bản Video Đa Nền Tảng
            </h4>
            <p className="text-zinc-500 text-[11px]">
              Tự động hóa kịch bản đa phong cách • Ghép clip 5-10 phút • Phê duyệt trực quan trước khi phát sóng
            </p>
          </div>
        </div>

        {/* Nút bấm Liên hệ Nhà phát triển chuẩn Apple */}
        <div className="flex items-center gap-2">
          <a
            href={gmailDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Mở trình soạn thư Gmail gửi trực tiếp đến Kỹ sư phát triển"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium shadow-xs transition active:scale-[0.98]"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>LIÊN HỆ NHÀ PHÁT TRIỂN</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          <a
            href={mailtoUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-zinc-700 text-xs border border-black/[0.06] transition"
            title="Mở ứng dụng Mail mặc định"
          >
            <span>Mailto</span>
          </a>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-[11px] leading-relaxed">

        {/* Cột 1: Điều Khoản & Pháp Lý */}
        <div className="space-y-3">
          <div className="text-[#1D1D1F] font-bold text-xs tracking-tight uppercase">
            Điều Khoản & Chính Sách
          </div>
          <ul className="space-y-1.5 text-zinc-600">
            <li>
              <button
                onClick={() => onOpenPolicyModal?.('terms')}
                className="hover:text-[#0071E3] transition text-left flex items-center gap-1.5"
              >
                <FileText className="w-3 h-3 text-zinc-400" />
                <span>Điều khoản sử dụng phần mềm</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenPolicyModal?.('privacy')}
                className="hover:text-[#0071E3] transition text-left flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3 h-3 text-[#34C759]" />
                <span>Bảo mật dữ liệu & Token API</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenPolicyModal?.('copyright')}
                className="hover:text-[#0071E3] transition text-left flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3 text-[#0071E3]" />
                <span>Quyền sở hữu trí tuệ kịch bản</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenPolicyModal?.('disclaimer')}
                className="hover:text-[#0071E3] transition text-left flex items-center gap-1.5"
              >
                <span className="text-zinc-400 font-mono">•</span>
                <span>Cơ chế phê duyệt & Miễn trừ trách nhiệm</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Cột 2: Hệ Sinh Thái Tích Hợp */}
        <div className="space-y-3">
          <div className="text-[#1D1D1F] font-bold text-xs tracking-tight uppercase">
            Hạ Tầng Tích Hợp
          </div>
          <div className="space-y-1.5 text-zinc-600">
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3]"></span>
              <span><strong>Google Gemini 2.0</strong> — Phân rã kịch bản & TTS</span>
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]"></span>
              <span><strong>YouTube Data API v3</strong> — Đăng video 5–10 phút</span>
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900"></span>
              <span><strong>TikTok Posting API</strong> — Video ngắn gắn link</span>
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2]"></span>
              <span><strong>Meta Graph API</strong> — Facebook Reels</span>
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span>
              <span><strong>Google Drive API</strong> — Tự động lưu trữ dự án</span>
            </p>
          </div>
        </div>

        {/* Cột 3: Website Cùng Nhà Phát Triển */}
        <div className="space-y-3">
          <div className="text-[#1D1D1F] font-bold text-xs tracking-tight uppercase flex items-center justify-between">
            <span>Website cùng nhà phát triển</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-50 text-[#0071E3] font-semibold border border-blue-200">
              SYNAPES ECOSYSTEM
            </span>
          </div>

          {/* Logo SYNAPES AUDIT (Bấm vào điều hướng trực tiếp đến trang web) */}
          <div className="pt-0.5">
            <a
              href="https://synapeseducheck.onrender.com/"
              target="_blank"
              rel="noopener noreferrer"
              title="Truy cập SYNAPES AUDIT (synapeseducheck.onrender.com)"
              className="inline-flex items-center justify-center p-2 rounded-2xl bg-white hover:bg-zinc-50 border border-black/[0.08] hover:border-[#0071E3]/50 shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 group"
            >
              <img
                src="/synapes-educheck-logo.jpg"
                alt="SYNAPES AUDIT"
                className="w-14 h-14 object-contain rounded-xl group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.jpg';
                }}
              />
            </a>
          </div>

          {/* Huy hiệu pháp lý Bộ Công Thương & Bản quyền */}
          <div className="pt-2 flex items-center flex-wrap gap-3">
            {/* Logo Đã Thông Báo Bộ Công Thương */}
            <a
              href="http://online.gov.vn"
              target="_blank"
              rel="noopener noreferrer"
              title="Đã thông báo Bộ Công Thương (online.gov.vn)"
              className="inline-block hover:opacity-90 transition active:scale-95"
            >
              <img
                src="/bct-da-thong-bao.png"
                alt="Đã Thông Báo Bộ Công Thương"
                className="h-8 w-auto object-contain"
              />
            </a>

            {/* Logo Nói Không Với Hàng Giả - Bộ Công Thương */}
            <a
              href="http://online.gov.vn"
              target="_blank"
              rel="noopener noreferrer"
              title="Nói Không Với Hàng Giả - Bộ Công Thương"
              className="inline-block hover:opacity-90 transition active:scale-95"
            >
              <img
                src="/bct-noi-khong-hang-gia.png"
                alt="Nói Không Với Hàng Giả - Bộ Công Thương"
                className="h-9 w-auto object-contain"
              />
            </a>

            {/* Huy hiệu DMCA Protected Chính Thức */}
            <a
              href="https://www.dmca.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Chứng nhận bảo vệ bản quyền số DMCA Protected"
              className="inline-block hover:opacity-90 transition active:scale-95"
            >
              <img
                src="/dmca-protected.png"
                alt="DMCA Protected"
                className="h-7 w-auto object-contain rounded-xs"
              />
            </a>
          </div>
        </div>

      </div>

      {/* Bottom Bar: Bản quyền & Giao diện Apple */}
      <div className="max-w-7xl mx-auto pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 text-zinc-500 text-[10px]">
        <div>
          © 2026 SYNAPES Auto Tool • Kỹ sư Nguyễn Hoàng Thiện
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onOpenPolicyModal?.('terms')} className="hover:text-zinc-800 transition">
            Điều khoản dịch vụ
          </button>
          <span>•</span>
          <button onClick={() => onOpenPolicyModal?.('privacy')} className="hover:text-zinc-800 transition">
            Bảo mật API
          </button>
          <span>•</span>
          <a href={gmailDirectUrl} target="_blank" rel="noopener noreferrer" className="text-[#0071E3] font-numeric font-medium hover:underline">
            {developerEmail}
          </a>
        </div>
      </div>
    </footer>
  );
};
