import React, { useState, useRef, useEffect, useId } from 'react';
import { AIProviderId, AIProviderConfig } from '../types';
import {
  ProviderMeta,
  DiscoveredModel,
  isProviderKeyConfigured,
} from '../services/aiModelDiscoveryService';
import { ChevronDown, Check, Lock, CheckCircle2, Sparkles } from 'lucide-react';

interface ProviderBrandLogoProps {
  provider: AIProviderId | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  withBadge?: boolean;
}

/**
 * Logo nhận diện chính thức dạng Vector SVG sắc nét cho từng Nhà cung cấp AI
 */
export const ProviderBrandLogo: React.FC<ProviderBrandLogoProps> = ({
  provider,
  size = 'sm',
  withBadge = true,
}) => {
  const uid = useId().replace(/:/g, '');
  const iconDim =
    size === 'xs'
      ? 'w-3.5 h-3.5'
      : size === 'sm'
        ? 'w-4 h-4'
        : size === 'md'
          ? 'w-5 h-5'
          : 'w-6 h-6';

  const boxDim =
    size === 'xs'
      ? 'w-5 h-5 rounded-md'
      : size === 'sm'
        ? 'w-7 h-7 rounded-lg'
        : size === 'md'
          ? 'w-8 h-8 rounded-lg'
          : 'w-10 h-10 rounded-xl';

  const renderSvg = () => {
    switch (provider) {
      case 'gemini':
        return (
          <svg className={iconDim} viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id={`gem-grad-${uid}`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1A73E8" />
                <stop offset="52%" stopColor="#6665FF" />
                <stop offset="100%" stopColor="#C964CF" />
              </linearGradient>
            </defs>
            <path
              d="M12 1.2C12 7.16 7.16 12 1.2 12C7.16 12 12 16.84 12 22.8C12 16.84 16.84 12 22.8 12C16.84 12 12 7.16 12 1.2Z"
              fill={`url(#gem-grad-${uid})`}
            />
          </svg>
        );

      case 'openai':
        return (
          <svg className={`${iconDim} text-[#10A37F]`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
          </svg>
        );

      case 'claude':
        return (
          <svg className={iconDim} viewBox="0 0 24 24" fill="#D97757">
            <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
          </svg>
        );

      case 'deepseek':
        return (
          <svg className={iconDim} viewBox="0 0 24 24" fill="none">
            <path
              d="M2.8 13.8C2.8 8.6 6.9 4.8 12.2 4.8C16.2 4.8 19.3 7.1 20.4 10.4C21.3 9.8 22.3 8.8 22.8 7.6C23.1 9.9 22.1 12.1 20.5 13.3C20.2 16.9 17.3 19.4 13.4 19.4C10.1 19.4 7.9 17.8 5.9 17.8C4.6 17.8 3.6 18.4 2.7 19C2.9 17.5 2.8 15.6 2.8 13.8Z"
              fill="#2563EB"
            />
            <path
              d="M6.4 14.8C8.4 16.1 11.4 16.4 14.3 15.2"
              stroke="#93C5FD"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="8.5" cy="11.2" r="1.4" fill="#FFFFFF" />
          </svg>
        );

      case 'grok':
        return (
          <svg className={iconDim} viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#09090B" />
            <path
              d="M17.8 5.5L8.2 15.4L14.2 10.8C14.6 10.5 15.1 10.7 15.3 11.1C16 12.9 15.6 15.1 14.1 16.6C12.6 18.1 10.5 18.4 8.6 17.6L6.6 18.6C9.5 20.6 13.1 20.1 15.4 17.8C17.2 16 17.8 13.5 17.2 11.3C16.5 8.2 17.4 6.9 19.3 4.3L20.1 3.2L17.8 5.5ZM7.1 15.9C5 13.9 5.4 10.7 7.2 8.9C8.5 7.5 10.7 7 12.6 7.8L14.7 6.8C11.7 4.8 8.1 5.3 5.9 7.6C4 9.5 3.4 12.5 4.4 15.1C5.2 17 3.9 18.4 2.6 19.7L2.4 20L8.2 14.8L7.1 15.9Z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case 'plugin':
      default:
        return (
          <svg className={iconDim} viewBox="0 0 24 24" fill="none">
            <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="#0284C7" fillOpacity="0.12" stroke="#0369A1" strokeWidth="1.6" />
            <path d="M8 12H16M16 12L12.5 8.5M16 12L12.5 15.5" stroke="#0369A1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
    }
  };

  if (!withBadge) {
    return renderSvg();
  }

  const badgeBg =
    provider === 'gemini'
      ? 'bg-blue-50/90 border-blue-200/70'
      : provider === 'openai'
        ? 'bg-emerald-50/90 border-emerald-200/70'
        : provider === 'claude'
          ? 'bg-orange-50/90 border-orange-200/70'
          : provider === 'deepseek'
            ? 'bg-indigo-50/90 border-indigo-200/70'
            : provider === 'grok'
              ? 'bg-zinc-100 border-zinc-300/80'
              : 'bg-sky-50/90 border-sky-200/70';

  return (
    <span
      className={`${boxDim} ${badgeBg} border inline-flex items-center justify-center flex-shrink-0 shadow-2xs`}
    >
      {renderSvg()}
    </span>
  );
};

interface AiProviderDropdownProps {
  providers: ProviderMeta[];
  selectedProvider: AIProviderId;
  aiConfig: AIProviderConfig;
  onSelect: (provider: AIProviderId) => void;
}

/**
 * Custom Dropdown chọn Nhà Cung Cấp AI có Logo Thương Hiệu chính thức & Trạng Thái API Key
 */
export const AiProviderDropdown: React.FC<AiProviderDropdownProps> = ({
  providers,
  selectedProvider,
  aiConfig,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeMeta = providers.find((p) => p.id === selectedProvider) || providers[0];
  const activeHasKey = isProviderKeyConfigured(activeMeta.id, aiConfig);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-white border rounded-xl px-2.5 py-2 text-xs text-zinc-900 flex items-center justify-between gap-2 transition cursor-pointer shadow-2xs ${
          isOpen
            ? 'border-zinc-950 ring-2 ring-zinc-950/10'
            : 'border-black/[0.12] hover:border-zinc-400'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <ProviderBrandLogo provider={activeMeta.id} size="sm" withBadge={true} />
          <div className="text-left min-w-0">
            <div className="font-bold text-zinc-950 truncate flex items-center gap-1.5">
              <span>{activeMeta.name}</span>
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  activeHasKey ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
              />
            </div>
            <div className="text-[10px] text-zinc-500 truncate">
              {activeHasKey ? 'Đã gắn API Key • Sẵn sàng' : `${activeMeta.vendor} • Chưa gắn Key`}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-zinc-900' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white rounded-xl border border-black/[0.12] shadow-2xl py-1.5 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 border-b border-black/[0.05] mb-1">
            Chọn Nhà Cung Cấp AI
          </div>
          {providers.map((p) => {
            const hasKey = isProviderKeyConfigured(p.id, aiConfig);
            const isSelected = p.id === selectedProvider;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelect(p.id);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-2 flex items-center justify-between gap-2 text-left transition cursor-pointer ${
                  isSelected ? 'bg-zinc-950/[0.05]' : 'hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ProviderBrandLogo provider={p.id} size="sm" withBadge={true} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-950 flex items-center gap-1.5 truncate">
                      <span>{p.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-zinc-950 flex-shrink-0" />}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">{p.vendor}</div>
                  </div>
                </div>

                {hasKey ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium flex items-center gap-1 flex-shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Đã gắn Key</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 text-[10px] font-medium flex items-center gap-1 flex-shrink-0">
                    <Lock className="w-2.5 h-2.5 text-amber-500" />
                    <span>Chưa gắn Key</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface AiModelDropdownProps {
  provider: AIProviderId;
  models: DiscoveredModel[];
  selectedModel: string;
  disabled?: boolean;
  onSelect: (modelId: string) => void;
}

/**
 * Custom Dropdown chọn Model AI kèm Logo nhà cung cấp & Nhãn năng lực
 */
export const AiModelDropdown: React.FC<AiModelDropdownProps> = ({
  provider,
  models,
  selectedModel,
  disabled = false,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentModel =
    models.find((m) => m.id === selectedModel) ||
    models[0] || { id: selectedModel, name: selectedModel, tag: 'Mô hình chuẩn', isLiveFromKey: false };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (disabled) {
    return (
      <div className="w-full bg-zinc-100/90 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-400 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span className="truncate">Chế độ Đạo Diễn AI Nội Bộ (Gắn Key để mở Model riêng)</span>
        </div>
        <span className="text-[10px] text-amber-600 font-mono font-medium flex-shrink-0">Auto</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-white border rounded-xl px-2.5 py-2 text-xs text-zinc-900 flex items-center justify-between gap-2 transition cursor-pointer shadow-2xs ${
          isOpen
            ? 'border-zinc-950 ring-2 ring-zinc-950/10'
            : 'border-black/[0.12] hover:border-zinc-400'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ProviderBrandLogo provider={provider} size="xs" withBadge={true} />
          <div className="text-left min-w-0">
            <div className="font-bold text-zinc-950 truncate flex items-center gap-1.5">
              <span>{currentModel.name}</span>
              {currentModel.isRecommended && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-mono font-semibold">
                  Khuyên dùng
                </span>
              )}
            </div>
            <div className="text-[10px] text-zinc-500 truncate">{currentModel.tag || currentModel.id}</div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-zinc-900' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white rounded-xl border border-black/[0.12] shadow-2xl py-1.5 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 border-b border-black/[0.05] mb-1 flex items-center justify-between">
            <span>Danh sách Models ({models.length})</span>
            <Sparkles className="w-3 h-3 text-emerald-500" />
          </div>
          {models.map((m) => {
            const isSelected = m.id === selectedModel;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSelect(m.id);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-2 flex items-center justify-between gap-2 text-left transition cursor-pointer ${
                  isSelected ? 'bg-zinc-950/[0.05]' : 'hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ProviderBrandLogo provider={provider} size="xs" withBadge={false} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-950 flex items-center gap-1.5 truncate">
                      <span>{m.name}</span>
                      {m.isRecommended && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-mono">
                          Top
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {m.tag || m.id}
                    </div>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-zinc-950 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
