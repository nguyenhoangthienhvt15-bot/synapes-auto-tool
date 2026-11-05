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
          <div className="text-zinc-900 font-semibold text-xs tracking-tight uppercase font-mono">
            Điều Khoản & Chính Sách
          </div>
          <ul className="space-y-1.5 text-zinc-600">
            <li>
              <button
                onClick={() => onOpenPolicyModal?.('terms')}
                className="hover:text-zinc-950 transition text-left flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span>Điều khoản sử dụng phần mềm</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenPolicyModal?.('privacy')}
                className="hover:text-zinc-950 transition text-left flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                <span>Bảo mật dữ liệu & Token API</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenPolicyModal?.('copyright')}
                className="hover:text-zinc-950 transition text-left flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Quyền sở hữu trí tuệ kịch bản</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenPolicyModal?.('disclaimer')}
                className="hover:text-zinc-950 transition text-left flex items-center gap-2 cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
                <span>Cơ chế phê duyệt & Miễn trừ trách nhiệm</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Cột 2: Hạ Tầng Tích Hợp (AI Models & Nền Tảng) */}
        <div className="space-y-3">
          <div className="text-zinc-900 font-semibold text-xs tracking-tight uppercase font-mono">
            Hạ Tầng Tích Hợp
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-zinc-600">
            {/* 1. Google Gemini */}
            <a
              href="https://gemini.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-zinc-950 transition group cursor-pointer"
              title="Truy cập trang chủ Google Gemini"
            >
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
              <span className="group-hover:underline">Google Gemini</span>
            </a>

            {/* 2. OpenAI GPT */}
            <a
              href="https://openai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-zinc-950 transition group cursor-pointer"
              title="Truy cập trang chủ OpenAI (ChatGPT / GPT)"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#10A37F]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
              </svg>
              <span className="group-hover:underline">OpenAI GPT</span>
            </a>

            {/* 3. Anthropic Claude */}
            <a
              href="https://claude.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-zinc-950 transition group cursor-pointer"
              title="Truy cập trang chủ Anthropic Claude"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#D97757">
                <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
              </svg>
              <span className="group-hover:underline">Anthropic Claude</span>
            </a>

            {/* 4. DeepSeek AI */}
            <a
              href="https://www.deepseek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-zinc-950 transition group cursor-pointer"
              title="Truy cập trang chủ DeepSeek AI"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M3.5 14.5C3.5 9.5 7.5 5.5 12.5 5.5C17.5 5.5 21.5 9 21.5 14C21.5 17 19.5 19.5 16.5 19.5C13.5 19.5 12 17.5 10 17.5C8 17.5 6.5 19 4.5 18C3.8 17 3.5 15.8 3.5 14.5Z" fill="#1E6FFF"/>
                <circle cx="8" cy="12" r="1.5" fill="#FFFFFF"/>
              </svg>
              <span className="group-hover:underline">DeepSeek AI</span>
            </a>

            {/* 5. Grok */}
            <a
              href="https://grok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-zinc-950 transition group cursor-pointer"
              title="Truy cập trang chủ Grok (grok.com)"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12" fill="#000000" />
                <path
                  fill="#ffffff"
                  d="m19.25 5.08l-9.52 9.67l6.64-4.96c.33-.24.79-.15.95.23c.82 1.99.45 4.39-1.17 6.03c-1.63 1.64-3.89 2.01-5.96 1.18l-2.26 1.06c3.24 2.24 7.18 1.69 9.64-.8c1.95-1.97 2.56-4.66 1.99-7.09c-.82-3.56.2-4.98 2.29-7.89L22 2.3zm-9.53 9.67h.01zm-1.37 1.21c-2.33-2.25-1.92-5.72.06-7.73c1.47-1.48 3.87-2.09 5.97-1.2l2.25-1.05c-3.23-2.25-7.17-1.69-9.64.8c-2.11 2.13-2.77 5.41-1.63 8.21c.85 2.09-.54 3.57-1.95 5.06l-.28.3l6.35-5.73z"
                  transform="translate(12, 12) scale(0.72) translate(-12, -12)"
                />
              </svg>
              <span className="group-hover:underline">Grok</span>
            </a>

            {/* 6. YouTube Data API */}
            <a
              href="https://developers.google.com/youtube/v3"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-zinc-950 transition group cursor-pointer"
              title="Truy cập YouTube Data API"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                <path fill="#FFFFFF" d="m9.545 15.568 6.273-3.568-6.273-3.568z" />
              </svg>
              <span className="group-hover:underline">YouTube Data API</span>
            </a>

            {/* 7. TikTok Posting API */}
            <a
              href="https://developers.tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-zinc-950 transition group cursor-pointer"
              title="Truy cập TikTok for Developers"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#000000">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.68a6.34 6.34 0 0 0 10.74 4.54 6.29 6.29 0 0 0 1.93-4.55V8.87a8.28 8.28 0 0 0 4.82 1.54V6.96a4.85 4.85 0 0 1-1-.27z" />
              </svg>
              <span className="group-hover:underline">TikTok Posting API</span>
            </a>

            {/* 8. Meta Graph API */}
            <a
              href="https://developers.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-zinc-950 transition group cursor-pointer"
              title="Truy cập Meta for Developers"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#0081FB">
                <path d="M16.92 5.08c-2.17 0-3.9 1.4-4.92 2.92-1.02-1.52-2.75-2.92-4.92-2.92C3.12 5.08 0 8.35 0 12.38c0 4.02 3.12 7.29 7.08 7.29 2.17 0 3.9-1.4 4.92-2.92 1.02 1.52 2.75 2.92 4.92 2.92 3.96 0 7.08-3.27 7.08-7.29 0-4.03-3.12-7.3-7.08-7.3zm-9.84 12.1c-2.6 0-4.61-2.1-4.61-4.8 0-2.7 2.01-4.8 4.61-4.8 1.83 0 3.2 1.15 4.06 2.54-.86 1.39-2.23 2.54-4.06 2.54zm9.84 0c-1.83 0-3.2-1.15-4.06-2.54.86-1.39 2.23-2.54 4.06-2.54 2.6 0 4.61 2.1 4.61 4.8 0 2.7-2.01 4.8-4.61 4.8z" />
              </svg>
              <span className="group-hover:underline">Meta Graph API</span>
            </a>

            {/* 9. Google Drive API */}
            <a
              href="https://developers.google.com/drive"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-zinc-950 transition group cursor-pointer"
              title="Truy cập Google Drive API"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 87 78">
                <path d="m6.6 66.8 17.1-29.6 13.8 23.9H13.8c-3.8 0-6.3-1.6-7.2-4.3z" fill="#0066DA" />
                <path d="M43.7 25 29.9 1.2C28.5.4 27 0 25.4 0h-1.6l27.5 47.6 13.8-23.9z" fill="#00AC47" />
                <path d="M59.8 53H27.5L13.8 76.8c1.4.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.2-.4 4.5-1.2z" fill="#2684FC" />
                <path d="m73.4 26.5-12.7-22C59.4 2.3 56.9 0 53 0L36.8 28.1l16.2 28h27.5c0-1.6-.4-3.1-1.2-4.5z" fill="#FFBA00" />
              </svg>
              <span className="group-hover:underline">Google Drive API</span>
            </a>
          </div>
        </div>

        {/* Cột 3: Website Cùng Hệ Sinh Thái */}
        <div className="space-y-3">
          <div className="text-zinc-900 font-semibold text-xs tracking-tight uppercase font-mono flex items-center justify-between">
            <span>Hệ sinh thái liên kết</span>
            <span className="text-[10px] font-mono text-zinc-400">
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
              className="inline-flex items-center justify-center p-2 rounded-lg bg-white hover:bg-zinc-50 border border-black/[0.08] hover:border-black/20 shadow-2xs transition group"
            >
              <img
                src="/synapes-educheck-logo.jpg"
                alt="SYNAPES AUDIT"
                className="w-12 h-12 object-contain rounded-md group-hover:scale-102 transition-transform duration-150"
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
          <span>•</span>
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=nguyenhoangthien.hvt.15@gmail.com&su=LI%C3%8AN%20H%E1%BB%86%20NH%C3%80%20PH%C3%81T%20TRI%E1%BB%82N"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-900 font-medium transition"
            title="Gửi Gmail đến nguyenhoangthien.hvt.15@gmail.com"
          >
            Liên hệ nhà phát triển
          </a>
        </div>
      </div>
    </footer>
  );
};
