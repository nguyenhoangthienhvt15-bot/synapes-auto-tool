import React from 'react';
import { ShieldCheck, CheckCircle2, FileText, AlertCircle } from 'lucide-react';

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
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span>Điều khoản sử dụng phần mềm</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenPolicyModal?.('privacy')}
                className="hover:text-[#0071E3] transition text-left flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" />
                <span>Bảo mật dữ liệu & Token API</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenPolicyModal?.('copyright')}
                className="hover:text-[#0071E3] transition text-left flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0071E3]" />
                <span>Quyền sở hữu trí tuệ kịch bản</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenPolicyModal?.('disclaimer')}
                className="hover:text-[#0071E3] transition text-left flex items-center gap-1.5 cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-[#FF9500]" />
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
            <p className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" fill="url(#gemini-footer-grad)" />
                <defs>
                  <linearGradient id="gemini-footer-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1BA1E3" />
                    <stop offset="50%" stopColor="#5B7FFF" />
                    <stop offset="100%" stopColor="#C473FF" />
                  </linearGradient>
                </defs>
              </svg>
              <span>Google Gemini 2.0</span>
            </p>
            <p className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
                <path fill="#FFFFFF" d="m9.545 15.568 6.273-3.568-6.273-3.568z"/>
              </svg>
              <span>YouTube Data API v3</span>
            </p>
            <p className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#000000">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.68a6.34 6.34 0 0 0 10.74 4.54 6.29 6.29 0 0 0 1.93-4.55V8.87a8.28 8.28 0 0 0 4.82 1.54V6.96a4.85 4.85 0 0 1-1-.27z"/>
              </svg>
              <span>TikTok Posting API</span>
            </p>
            <p className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#0081FB">
                <path d="M16.92 5.08c-2.17 0-3.9 1.4-4.92 2.92-1.02-1.52-2.75-2.92-4.92-2.92C3.12 5.08 0 8.35 0 12.38c0 4.02 3.12 7.29 7.08 7.29 2.17 0 3.9-1.4 4.92-2.92 1.02 1.52 2.75 2.92 4.92 2.92 3.96 0 7.08-3.27 7.08-7.29 0-4.03-3.12-7.3-7.08-7.3zm-9.84 12.1c-2.6 0-4.61-2.1-4.61-4.8 0-2.7 2.01-4.8 4.61-4.8 1.83 0 3.2 1.15 4.06 2.54-.86 1.39-2.23 2.54-4.06 2.54zm9.84 0c-1.83 0-3.2-1.15-4.06-2.54.86-1.39 2.23-2.54 4.06-2.54 2.6 0 4.61 2.1 4.61 4.8 0 2.7-2.01 4.8-4.61 4.8z"/>
              </svg>
              <span>Meta Graph API</span>
            </p>
            <p className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 87 78">
                <path d="m6.6 66.8 17.1-29.6 13.8 23.9H13.8c-3.8 0-6.3-1.6-7.2-4.3z" fill="#0066DA"/>
                <path d="M43.7 25 29.9 1.2C28.5.4 27 0 25.4 0h-1.6l27.5 47.6 13.8-23.9z" fill="#00AC47"/>
                <path d="M59.8 53H27.5L13.8 76.8c1.4.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.2-.4 4.5-1.2z" fill="#2684FC"/>
                <path d="m73.4 26.5-12.7-22C59.4 2.3 56.9 0 53 0L36.8 28.1l16.2 28h27.5c0-1.6-.4-3.1-1.2-4.5z" fill="#FFBA00"/>
              </svg>
              <span>Google Drive API</span>
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
