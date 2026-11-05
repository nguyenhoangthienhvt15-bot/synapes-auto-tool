import React from 'react';
import { ShieldCheck, CheckCircle2, FileText } from 'lucide-react';

interface FooterProps {
  onOpenPolicyModal?: (policyType: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPolicyModal }) => {
  return (
    <footer className="w-full bg-[#FFFFFF] text-zinc-600 text-xs border-t border-black/[0.08] pt-8 pb-8 px-5 lg:px-10 mt-14 select-none">
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
                className="hover:text-[#0071E3] transition text-left flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3 h-3 text-zinc-400" />
                <span>Điều khoản sử dụng phần mềm</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenPolicyModal?.('privacy')}
                className="hover:text-[#0071E3] transition text-left flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3 text-[#34C759]" />
                <span>Bảo mật dữ liệu & Token API</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenPolicyModal?.('copyright')}
                className="hover:text-[#0071E3] transition text-left flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3 text-[#0071E3]" />
                <span>Quyền sở hữu trí tuệ kịch bản</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenPolicyModal?.('disclaimer')}
                className="hover:text-[#0071E3] transition text-left flex items-center gap-1.5 cursor-pointer"
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

        {/* Cột 3: Website Cùng Hệ Sinh Thái */}
        <div className="space-y-3">
          <div className="text-[#1D1D1F] font-bold text-xs tracking-tight uppercase flex items-center justify-between">
            <span>Hệ sinh thái liên kết</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-50 text-[#0071E3] font-semibold border border-blue-200">
              SYNAPES SUITE
            </span>
          </div>

          {/* Logo SYNAPES EDUCHECK */}
          <div className="pt-0.5">
            <a
              href="https://synapeseducheck.onrender.com/"
              target="_blank"
              rel="noopener noreferrer"
              title="Truy cập SYNAPES AUDIT"
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

          {/* Huy hiệu pháp lý Bộ Công Thương & Bản quyền DMCA */}
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

      {/* Bottom Bar: Bản quyền Doanh Nghiệp Chuẩn Mực */}
      <div className="max-w-7xl mx-auto pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 text-zinc-500 text-[10px]">
        <div>
          © 2026 SYNAPES Auto Tool. All rights reserved.
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onOpenPolicyModal?.('terms')} className="hover:text-zinc-800 transition cursor-pointer">
            Điều khoản dịch vụ
          </button>
          <span>•</span>
          <button onClick={() => onOpenPolicyModal?.('privacy')} className="hover:text-zinc-800 transition cursor-pointer">
            Bảo mật API
          </button>
          <span>•</span>
          <button onClick={() => onOpenPolicyModal?.('copyright')} className="hover:text-zinc-800 transition cursor-pointer">
            Bản quyền kịch bản
          </button>
          <span>•</span>
          <button onClick={() => onOpenPolicyModal?.('disclaimer')} className="hover:text-zinc-800 transition cursor-pointer">
            Miễn trừ trách nhiệm
          </button>
        </div>
      </div>
    </footer>
  );
};
