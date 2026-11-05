import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink, Download, X } from 'lucide-react';

interface PolicyModalProps {
  policyType: string | null;
  onClose: () => void;
}

interface PolicyDocInfo {
  id: string;
  title: string;
  shortTitle: string;
  docNumber: string;
  pdfPath: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  legalHighlights: string[];
}

const POLICY_DOCS: Record<string, PolicyDocInfo> = {
  terms: {
    id: 'terms',
    title: 'QUY CHẾ VÀ ĐIỀU KHOẢN SỬ DỤNG DỊCH VỤ PHẦN MỀM',
    shortTitle: 'Điều khoản sử dụng',
    docNumber: 'Số: 01/2026/QĐ-SYNAPES/ĐKSD',
    pdfPath: '/documents/dieu-khoan-su-dung.pdf',
    icon: FileText,
    accentColor: '#0071E3',
    legalHighlights: [
      'Bộ luật Dân sự số 91/2015/QH13',
      'Luật Giao dịch điện tử số 20/2023/QH15',
      'Luật Công nghệ thông tin số 67/2006/QH11',
      'Nghị định số 147/2024/NĐ-CP'
    ]
  },
  privacy: {
    id: 'privacy',
    title: 'CHÍNH SÁCH BẢO VỆ DỮ LIỆU CÁ NHÂN & AN TOÀN BẢO MẬT TOKEN API',
    shortTitle: 'Bảo mật dữ liệu & Token',
    docNumber: 'Số: 02/2026/CSBM-SYNAPES/DATA-API',
    pdfPath: '/documents/bao-mat-du-lieu.pdf',
    icon: ShieldCheck,
    accentColor: '#34C759',
    legalHighlights: [
      'Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân',
      'Luật An toàn thông tin mạng số 86/2015/QH13',
      'Luật An ninh mạng số 24/2018/QH14',
      'Mật mã học chuẩn AES-256-GCM & Tiêu chuẩn FIPS 140-3'
    ]
  },
  copyright: {
    id: 'copyright',
    title: 'QUY ĐỊNH BẢO HỘ QUYỀN SỞ HỮU TRÍ TUỆ ĐỐI VỚI KỊCH BẢN & NỘI DUNG SỐ',
    shortTitle: 'Quyền sở hữu trí tuệ kịch bản',
    docNumber: 'Số: 03/2026/SHTT-SYNAPES/BQUYEN',
    pdfPath: '/documents/so-huu-tri-tue.pdf',
    icon: CheckCircle2,
    accentColor: '#0071E3',
    legalHighlights: [
      'Luật Sở hữu trí tuệ số 50/2005/QH11 & sửa đổi số 07/2022/QH15',
      'Nghị định số 17/2023/NĐ-CP',
      'Công ước Berne về bảo hộ tác phẩm nghệ thuật',
      'Đạo luật Bản quyền Thiên niên kỷ DMCA Protected'
    ]
  },
  disclaimer: {
    id: 'disclaimer',
    title: 'QUY CHẾ PHÊ DUYỆT KIỂM SOÁT NỘI DUNG & MIỄN TRỪ TRÁCH NHIỆM PHÁP LÝ',
    shortTitle: 'Phê duyệt & Miễn trừ trách nhiệm',
    docNumber: 'Số: 04/2026/QC-SYNAPES/PD-MTTN',
    pdfPath: '/documents/mien-tru-trach-nhiem.pdf',
    icon: AlertCircle,
    accentColor: '#FF9500',
    legalHighlights: [
      'Luật An ninh mạng năm 2018 (Điều 8 & Điều 16)',
      'Nghị định số 147/2024/NĐ-CP về quản lý dịch vụ Internet',
      'Nguyên lý Human-in-the-loop (Con người phê duyệt cuối)',
      'Tiêu chuẩn cộng đồng YouTube, Meta, TikTok API'
    ]
  }
};

export const PolicyModal: React.FC<PolicyModalProps> = ({ policyType, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>(policyType || 'terms');

  // Đồng bộ tab khi props thay đổi
  useEffect(() => {
    if (policyType && POLICY_DOCS[policyType]) {
      setActiveTab(policyType);
    }
  }, [policyType]);

  // Keyboard shortcut: Press Escape to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!policyType) return null;

  const currentDoc = POLICY_DOCS[activeTab] || POLICY_DOCS.terms;
  const DocIcon = currentDoc.icon;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-black/[0.1] max-w-5xl w-full h-[92vh] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header trên cùng */}
        <div className="px-5 py-3.5 bg-zinc-50/80 border-b border-black/[0.08] flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs"
              style={{ backgroundColor: `${currentDoc.accentColor}15`, color: currentDoc.accentColor }}
            >
              <DocIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-[#1D1D1F] truncate tracking-tight">
                  {currentDoc.title}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/[0.05] text-zinc-600 font-semibold border border-black/[0.05]">
                  {currentDoc.docNumber}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#0071E3] font-semibold border border-blue-200">
                  Font Times New Roman • Chuẩn Báo Cáo
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                Văn bản pháp quy điện tử chính thức — Hệ thống SYNAPES Auto Tool
              </p>
            </div>
          </div>

          {/* Các nút tác vụ nhanh */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a
              href={currentDoc.pdfPath}
              download
              title="Tải tệp PDF về máy"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-semibold border border-black/[0.08] shadow-2xs transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Tải PDF</span>
            </a>
            <a
              href={currentDoc.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở PDF trong tab mới để in hoặc xem toàn màn hình"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-2xs transition active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mở Tab Mới</span>
            </a>
            <button
              onClick={onClose}
              title="Đóng (Phím Esc)"
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-black/[0.05] transition ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thanh chuyển đổi tab nhanh giữa 4 tài liệu pháp lý */}
        <div className="px-5 py-2 bg-white border-b border-black/[0.06] flex items-center gap-2 overflow-x-auto flex-shrink-0 scrollbar-none">
          {Object.values(POLICY_DOCS).map((doc) => {
            const isSelected = doc.id === activeTab;
            const TabIcon = doc.icon;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveTab(doc.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{doc.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Khung xem trước PDF trực tiếp */}
        <div className="flex-1 bg-zinc-100/60 p-2 sm:p-3 overflow-hidden flex flex-col min-h-0">
          <div className="w-full h-full bg-white rounded-xl border border-black/[0.08] shadow-inner overflow-hidden relative">
            <iframe
              key={currentDoc.pdfPath}
              src={`${currentDoc.pdfPath}#toolbar=1&navpanes=0&view=FitH`}
              title={currentDoc.title}
              className="w-full h-full border-0"
            />
          </div>
        </div>

        {/* Footer ghi chú căn cứ pháp luật */}
        <div className="px-5 py-2.5 bg-zinc-50 border-t border-black/[0.06] flex items-center justify-between gap-4 flex-shrink-0 text-[11px] text-zinc-600">
          <div className="flex items-center gap-2 overflow-x-auto truncate">
            <span className="font-semibold text-zinc-800 flex-shrink-0">Căn cứ pháp lý cốt lõi:</span>
            {currentDoc.legalHighlights.map((law, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-white border border-black/[0.06] text-zinc-700 whitespace-nowrap flex-shrink-0"
              >
                {law}
              </span>
            ))}
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-semibold transition flex-shrink-0 cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
