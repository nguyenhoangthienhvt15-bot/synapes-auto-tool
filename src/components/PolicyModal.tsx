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
    legalHighlights: [
      'Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân',
      'Luật An toàn thông tin mạng số 86/2015/QH13',
      'Luật An ninh mạng số 24/2018/QH14',
      'Chuẩn mã hóa AES-256-GCM'
    ]
  },
  copyright: {
    id: 'copyright',
    title: 'QUY ĐỊNH BẢO HỘ QUYỀN SỞ HỮU TRÍ TUỆ ĐỐI VỚI KỊCH BẢN & NỘI DUNG SỐ',
    shortTitle: 'Quyền sở hữu trí tuệ kịch bản',
    docNumber: 'Số: 03/2026/SHTT-SYNAPES/BQUYEN',
    pdfPath: '/documents/so-huu-tri-tue.pdf',
    icon: CheckCircle2,
    legalHighlights: [
      'Luật Sở hữu trí tuệ số 50/2005/QH11 & sửa đổi 07/2022/QH15',
      'Nghị định số 17/2023/NĐ-CP',
      'Công ước Berne về bảo hộ tác phẩm',
      'Đạo luật DMCA'
    ]
  },
  disclaimer: {
    id: 'disclaimer',
    title: 'QUY CHẾ PHÊ DUYỆT KIỂM SOÁT NỘI DUNG & MIỄN TRỪ TRÁCH NHIỆM PHÁP LÝ',
    shortTitle: 'Phê duyệt & Miễn trừ trách nhiệm',
    docNumber: 'Số: 04/2026/QC-SYNAPES/PD-MTTN',
    pdfPath: '/documents/mien-tru-trach-nhiem.pdf',
    icon: AlertCircle,
    legalHighlights: [
      'Luật An ninh mạng năm 2018 (Điều 8 & Điều 16)',
      'Nghị định số 147/2024/NĐ-CP',
      'Cơ chế Human-in-the-loop (Con người phê duyệt cuối)',
      'Tiêu chuẩn cộng đồng YouTube, Meta, TikTok API'
    ]
  }
};

export const PolicyModal: React.FC<PolicyModalProps> = ({ policyType, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>(policyType || 'terms');

  useEffect(() => {
    if (policyType && POLICY_DOCS[policyType]) {
      setActiveTab(policyType);
    }
  }, [policyType]);

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
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl border border-black/10 max-w-5xl w-full h-[90vh] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="px-5 py-3.5 bg-zinc-50/80 border-b border-black/5 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center flex-shrink-0">
              <DocIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-semibold text-zinc-900 truncate tracking-tight uppercase font-mono">
                  {currentDoc.title}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                  {currentDoc.docNumber}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                Văn bản pháp quy điện tử — Hệ thống SYNAPES Auto Tool
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={currentDoc.pdfPath}
              download
              title="Tải tệp PDF về máy"
              className="btn-secondary py-1 px-2.5 text-xs inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Tải PDF</span>
            </a>
            <a
              href={currentDoc.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở PDF trong tab mới"
              className="btn-primary py-1 px-2.5 text-xs inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mở Tab Mới</span>
            </a>
            <button
              onClick={onClose}
              title="Đóng (Esc)"
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="px-5 py-2 bg-white border-b border-black/5 flex items-center gap-1.5 overflow-x-auto flex-shrink-0 scrollbar-none">
          {Object.values(POLICY_DOCS).map((doc) => {
            const isSelected = doc.id === activeTab;
            const TabIcon = doc.icon;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveTab(doc.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{doc.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* PDF viewer frame */}
        <div className="flex-1 bg-zinc-100/50 p-2 sm:p-3 overflow-hidden flex flex-col min-h-0">
          <div className="w-full h-full bg-white rounded-lg border border-black/10 overflow-hidden relative shadow-inner">
            <iframe
              key={currentDoc.pdfPath}
              src={`${currentDoc.pdfPath}#toolbar=1&navpanes=0&view=FitH`}
              title={currentDoc.title}
              className="w-full h-full border-0"
            />
          </div>
        </div>

        {/* Legal citations footer */}
        <div className="px-5 py-2.5 bg-zinc-50/90 border-t border-black/5 flex items-center justify-between gap-4 flex-shrink-0 text-[11px] text-zinc-600">
          <div className="flex items-center gap-2 overflow-x-auto truncate">
            <span className="font-medium text-zinc-800 flex-shrink-0">Căn cứ pháp lý:</span>
            {currentDoc.legalHighlights.map((law, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-white border border-zinc-200 text-zinc-700 whitespace-nowrap flex-shrink-0 text-[10px] font-mono"
              >
                {law}
              </span>
            ))}
          </div>
          <button
            onClick={onClose}
            className="btn-secondary py-1 px-3 text-xs flex-shrink-0 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
