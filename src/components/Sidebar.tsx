import React, { useState } from 'react';
import {
  Plus, Sparkles, Clock, Calendar, Folder, Share2,
  HardDrive, Cpu, BookOpen, ChevronDown, Key
} from 'lucide-react';
import { MiniPeakHoursAreaChart } from './MiniPeakHoursAreaChart';

interface SidebarProps {
  activeView: string;
  pendingCount: number;
  onSelectView: (view: string) => void;
  onOpenCreateModal: () => void;
  onSelectAiProvider?: (provider: string) => void;
  selectedAiProvider?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  pendingCount,
  onSelectView,
  onOpenCreateModal,
  onSelectAiProvider,
  selectedAiProvider,
}) => {
  const [isAiModuleOpen, setIsAiModuleOpen] = useState(true);
  return (
    <aside className="w-60 bg-[#FBFBFA] border-r border-black/[0.07] p-3 flex flex-col justify-between flex-shrink-0 min-h-[calc(100vh-3.25rem)] overflow-y-auto select-none scrollbar-none">
      <div className="space-y-4">

        {/* Primary Action Button */}
        <button
          onClick={onOpenCreateModal}
          className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-black text-white font-medium text-xs shadow-2xs flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Dự Án Video Mới</span>
        </button>

        {/* SECTION 1: SẢN XUẤT */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Sản Xuất
          </div>
          <div className="space-y-0.5">
            <button
              onClick={onOpenCreateModal}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-normal text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70 transition text-left cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              <span>Tạo kịch bản từ Prompt</span>
            </button>

            <button
              onClick={() => onSelectView('skills')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${activeView === 'skills'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                <span>Kho Skills & Prompts</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 2: DUYỆT & ĐIỀU PHỐI */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Kiểm Duyệt
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('pending-approval')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${activeView === 'pending-approval' || activeView === 'review'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Chờ phê duyệt</span>
              </div>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-zinc-900 text-white">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectView('calendar')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${activeView === 'calendar'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Lịch phát sóng</span>
              </div>
            </button>

            <button
              onClick={() => onSelectView('in-progress')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${activeView === 'in-progress'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder className="w-3.5 h-3.5 text-zinc-500" />
                <span>Tất cả dự án</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 3: PHÂN PHỐI & LIÊN KẾT TÀI KHOẢN MẠNG XÃ HỘI */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Liên Kết Kênh & Đăng Tải
          </div>
          <div className="space-y-0.5">
            {/* 1. Kênh YouTube */}
            <button
              onClick={() => onSelectView('connect-youtube')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer group ${activeView === 'connect-youtube'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span>Kênh YouTube</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 group-hover:bg-white border border-black/5">
                OAuth
              </span>
            </button>

            {/* 2. Tài khoản TikTok */}
            <button
              onClick={() => onSelectView('connect-tiktok')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer group ${activeView === 'connect-tiktok'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-black" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.68a6.34 6.34 0 0 0 10.74 4.54 6.29 6.29 0 0 0 1.93-4.55V8.87a8.28 8.28 0 0 0 4.82 1.54V6.96a4.85 4.85 0 0 1-1-.27z" />
                </svg>
                <span>Tài khoản TikTok</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 group-hover:bg-white border border-black/5">
                Posting
              </span>
            </button>

            {/* 3. Tài khoản Facebook */}
            <button
              onClick={() => onSelectView('connect-facebook')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer group ${activeView === 'connect-facebook'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#0866FF]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Tài khoản Facebook</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 group-hover:bg-white border border-black/5">
                Reels
              </span>
            </button>

            {/* 4. Google Drive Cloud */}
            <button
              onClick={() => onSelectView('drive-backup')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${activeView === 'drive-backup'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                <span>Google Drive Cloud</span>
              </div>
            </button>

            {/* 5. Quản lý tất cả kênh */}
            <button
              onClick={() => onSelectView('channels')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${activeView === 'channels'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Quản Lý Kênh & API</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 4: HỆ THỐNG / HẠ TẦNG */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Hạ Tầng
          </div>
          <div className="space-y-0.5">
            {/* Nút tùy chọn gom: API Keys AI Module */}
            <button
              onClick={() => {
                onSelectView('ai-engine');
                setIsAiModuleOpen(!isAiModuleOpen);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                activeView === 'ai-engine'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
              }`}
              title="Cấu hình API Keys các nhà cung cấp AI"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                <span>API Keys AI Module</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                  isAiModuleOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Các danh mục nhà cung cấp AI con */}
            {isAiModuleOpen && (
              <div className="pl-3.5 pr-1 py-1 space-y-0.5 border-l border-zinc-200 ml-3.5 animate-fade-in text-[11px]">
                {/* 1. GPT (OpenAI) */}
                <button
                  onClick={() => {
                    onSelectAiProvider?.('openai');
                    onSelectView('ai-engine');
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition text-left cursor-pointer ${
                    activeView === 'ai-engine' && selectedAiProvider === 'openai'
                      ? 'bg-zinc-200 text-zinc-950 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                  title="OpenAI GPT API Key"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#10A37F]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                  </svg>
                  <span className="truncate">GPT (OpenAI)</span>
                </button>

                {/* 2. Claude (Anthropic) */}
                <button
                  onClick={() => {
                    onSelectAiProvider?.('claude');
                    onSelectView('ai-engine');
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition text-left cursor-pointer ${
                    activeView === 'ai-engine' && selectedAiProvider === 'claude'
                      ? 'bg-zinc-200 text-zinc-950 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                  title="Anthropic Claude API Key"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#D97757">
                    <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
                  </svg>
                  <span className="truncate">Claude (Anthropic)</span>
                </button>

                {/* 3. DeepSeek */}
                <button
                  onClick={() => {
                    onSelectAiProvider?.('deepseek');
                    onSelectView('ai-engine');
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition text-left cursor-pointer ${
                    activeView === 'ai-engine' && selectedAiProvider === 'deepseek'
                      ? 'bg-zinc-200 text-zinc-950 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                  title="DeepSeek AI API Key"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M3.5 14.5C3.5 9.5 7.5 5.5 12.5 5.5C17.5 5.5 21.5 9 21.5 14C21.5 17 19.5 19.5 16.5 19.5C13.5 19.5 12 17.5 10 17.5C8 17.5 6.5 19 4.5 18C3.8 17 3.5 15.8 3.5 14.5Z" fill="#1E6FFF"/>
                    <circle cx="8" cy="12" r="1.5" fill="#FFFFFF"/>
                  </svg>
                  <span className="truncate">DeepSeek AI</span>
                </button>

                {/* 4. Grok (xAI) */}
                <button
                  onClick={() => {
                    onSelectAiProvider?.('grok');
                    onSelectView('ai-engine');
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition text-left cursor-pointer ${
                    activeView === 'ai-engine' && selectedAiProvider === 'grok'
                      ? 'bg-zinc-200 text-zinc-950 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                  title="Grok (xAI) API Key"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="12" fill="#000000" />
                    <path
                      fill="#ffffff"
                      d="m19.25 5.08l-9.52 9.67l6.64-4.96c.33-.24.79-.15.95.23c.82 1.99.45 4.39-1.17 6.03c-1.63 1.64-3.89 2.01-5.96 1.18l-2.26 1.06c3.24 2.24 7.18 1.69 9.64-.8c1.95-1.97 2.56-4.66 1.99-7.09c-.82-3.56.2-4.98 2.29-7.89L22 2.3zm-9.53 9.67h.01zm-1.37 1.21c-2.33-2.25-1.92-5.72.06-7.73c1.47-1.48 3.87-2.09 5.97-1.2l2.25-1.05c-3.23-2.25-7.17-1.69-9.64.8c-2.11 2.13-2.77 5.41-1.63 8.21c.85 2.09-.54 3.57-1.95 5.06l-.28.3l6.35-5.73z"
                      transform="translate(12, 12) scale(0.72) translate(-12, -12)"
                    />
                  </svg>
                  <span className="truncate">Grok (xAI)</span>
                </button>

                {/* 5. Gemini (Google) */}
                <button
                  onClick={() => {
                    onSelectAiProvider?.('gemini');
                    onSelectView('ai-engine');
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition text-left cursor-pointer ${
                    activeView === 'ai-engine' && selectedAiProvider === 'gemini'
                      ? 'bg-zinc-200 text-zinc-950 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                  title="Google Gemini API Key"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" fill="url(#gemini-sidebar-item-grad)" />
                    <defs>
                      <linearGradient id="gemini-sidebar-item-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#1BA1E3" />
                        <stop offset="50%" stopColor="#5B7FFF" />
                        <stop offset="100%" stopColor="#C473FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="truncate">Gemini (Google)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: HỖ TRỢ & HƯỚNG DẪN */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 tracking-wider px-2 mb-1 uppercase font-mono">
            Tài Liệu & Hướng Dẫn
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('user-guide')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                activeView === 'user-guide'
                  ? 'bg-zinc-200/70 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                <span>Hướng dẫn sử dụng</span>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Khung Biểu Đồ Miền Giờ Vàng Thời Gian Thực (TikTok, YouTube, Facebook) */}
      <div className="pt-2">
        <MiniPeakHoursAreaChart />
      </div>
    </aside>
  );
};
