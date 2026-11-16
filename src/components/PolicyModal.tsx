import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink, Download, X } from 'lucide-react';

interface PolicyModalProps {
  policyType: string | null;
  onClose: () => void;
}

interface PolicyArticle {
  heading: string;
  body: string;
}

interface PolicyDocInfo {
  id: string;
  title: string;
  shortTitle: string;
  docNumber: string;
  pdfPath: string;
  icon: React.ComponentType<{ className?: string }>;
  legalHighlights: string[];
  articles: PolicyArticle[];
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
    ],
    articles: [
      {
        heading: 'Điều 1. Phạm vi áp dụng và Tư cách pháp lý sử dụng',
        body: 'Nền tảng SYNAPES Auto Video Studio cung cấp bộ công cụ biên kịch AI, nhân bản giọng nói VoiceStudio ULTRA và dựng/xuất bản video đa kênh cho khách hàng có mã tài khoản hợp lệ đã xác thực qua Hợp đồng điện tử hoặc tài khoản kiểm định được cấp phép.'
      },
      {
        heading: 'Điều 2. Bảo vệ tài khoản, giới hạn đổi mật khẩu & an toàn truy cập',
        body: 'Mỗi Mã Code chỉ phục vụ tổ chức/cá nhân sở hữu hợp lệ. Tài khoản áp dụng giới hạn đổi mật khẩu tối đa 03 lần/ngày theo thời gian thực để chống dò quét; mọi mật khẩu mặc định hoặc mật khẩu cũ bị khóa hiệu lực ngay lập tức sau khi đổi mật khẩu cá nhân mới.'
      },
      {
        heading: 'Điều 3. Cơ chế BYOK & Tuân thủ quy định nhà cung cấp thứ ba',
        body: 'Khách hàng tự quản trị API Key (Gemini, OpenAI, Claude, DeepSeek, Grok, ElevenLabs) hoặc URL Plugin HTTPS riêng. Hệ thống chỉ xử lý tác vụ theo đúng chỉ thị của chủ sở hữu Key và không tái sử dụng dữ liệu đầu vào cho mục đích khác.'
      },
      {
        heading: 'Điều 4. Điều khoản thi hành và Giải quyết tranh chấp',
        body: 'Quy chế có hiệu lực từ ngày ban hành và được chuẩn hóa đồng nhất cả trên bản xem trực tuyến và tệp PDF tải về. Mọi tranh chấp (nếu có) được giải quyết trên tinh thần hợp tác và tuân thủ pháp luật Việt Nam hiện hành.'
      }
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
      'Chuẩn mã hóa BCRYPT & Token Session Signed'
    ],
    articles: [
      {
        heading: 'Điều 1. Mã hóa một chiều & Bảo vệ thông tin xác thực',
        body: 'Mật khẩu người dùng được băm một chiều (BCRYPT$ SHA-256 Salted Hash) trước khi lưu trữ và đồng bộ lên Google Sheet. Tuyệt đối không lưu mật khẩu cá nhân dạng văn bản thuần sau khi người dùng đã thiết lập mật khẩu riêng.'
      },
      {
        heading: 'Điều 2. Phân tách hồ sơ dữ liệu theo từng Mã Code',
        body: 'Mọi dự án video, danh sách kênh OAuth 2.0, lịch phát sóng và khóa API riêng (BYOK) đều được phân vùng độc lập theo User Code, hỗ trợ sao lưu Google Drive và khôi phục dữ liệu an toàn.'
      },
      {
        heading: 'Điều 3. Kiểm soát an toàn kết nối & Chống truy cập trái phép',
        body: 'Hệ thống áp dụng Content Security Policy (CSP), chặn kết nối HTTP localhost không an toàn từ dịch vụ Web công khai, kiểm tra chữ ký phiên HMAC và giới hạn tần suất (Rate Limiting) cho các điểm cuối xác thực.'
      },
      {
        heading: 'Điều 4. Quyền kiểm soát, trích xuất và xóa dữ liệu của Chủ thể',
        body: 'Chủ tài khoản có toàn quyền sao lưu, tải xuống toàn bộ dữ liệu dự án, ngắt kết nối Google Drive hoặc yêu cầu xóa vĩnh viễn dữ liệu bất cứ lúc nào theo đúng Nghị định 13/2023/NĐ-CP.'
      }
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
    ],
    articles: [
      {
        heading: 'Điều 1. Quyền sở hữu kịch bản, hình ảnh & video thành phẩm',
        body: 'Toàn bộ kịch bản, tệp âm thanh thuyết minh, phụ đề SRT và video hoàn thiện do người dùng khởi tạo từ tài khoản hợp lệ thuộc quyền khai thác thương mại hợp pháp của chủ tài khoản đó.'
      },
      {
        heading: 'Điều 2. Cam kết nhân bản giọng nói hợp pháp (Voice Cloning Ethics)',
        body: 'Khi sử dụng VoiceStudio ULTRA để nhân bản giọng nói từ tệp ghi âm mẫu, người dùng cam kết đó là giọng nói của chính mình hoặc đã có văn bản chấp thuận hợp pháp từ chủ thể giọng nói.'
      },
      {
        heading: 'Điều 3. Tư liệu Wikimedia Commons & Kho mã nguồn mở chuẩn giấy phép',
        body: 'Các nguồn tư liệu B-Roll, kiến thức Wikimedia Commons/Wikipedia và các lõi dựng video mã nguồn mở (Remotion, Manim, Editly, MoneyPrinterTurbo) được sử dụng đúng phạm vi giấy phép công khai.'
      }
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
    ],
    articles: [
      {
        heading: 'Điều 1. Nguyên tắc Con người phê duyệt cuối (Human-in-the-loop)',
        body: 'Mọi sản phẩm video sau khi sinh đều được chuyển về Bàn Chờ Duyệt để Chủ tài khoản/Biên tập viên rà soát lời dẫn, hình ảnh, nhãn dữ liệu và chủ động quyết định phê duyệt xuất bản.'
      },
      {
        heading: 'Điều 2. Trách nhiệm xác thực thông tin & Nguồn API',
        body: 'Hệ thống miễn trừ trách nhiệm pháp lý nếu người dùng tự ý đưa nội dung vi phạm pháp luật, sử dụng API Key/Plugin không chính thống, nguồn giả mạo hoặc phát hành nội dung không kiểm chứng.'
      },
      {
        heading: 'Điều 3. Hiệu lực áp dụng thống nhất',
        body: 'Quy chế này được áp dụng thống nhất giữa bản văn bản pháp lý chuẩn hóa trên hệ thống WebApp và tệp PDF lưu trữ chính thức.'
      }
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${isSelected
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

        {/* Uniform A4 Document Reader (Zero Browser Blockage Across Desktop & Mobile) */}
        <div className="flex-1 bg-zinc-200/70 p-3 sm:p-5 overflow-y-auto min-h-0" data-testid="policy-document-viewer">
          <div className="mx-auto max-w-3xl bg-white rounded-lg border border-black/15 shadow-md p-6 sm:p-10 space-y-5 text-zinc-900">
            {/* Official Header Block */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-zinc-900 pb-4 text-center sm:text-left">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-950">
                  HỆ THỐNG SYNAPES AUTO VIDEO STUDIO
                </div>
                <div className="text-[10.5px] font-mono text-zinc-600 mt-0.5">{currentDoc.docNumber}</div>
              </div>
              <div className="text-center">
                <div className="text-[11px] font-bold uppercase text-zinc-950">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-[11px] font-semibold text-zinc-800 border-b border-zinc-800 inline-block pb-0.5">
                  Độc lập – Tự do – Hạnh phúc
                </div>
              </div>
            </div>

            <div className="text-center space-y-1.5 pt-1">
              <h1 className="text-base sm:text-lg font-bold text-zinc-950 leading-snug uppercase">
                {currentDoc.title}
              </h1>
              <p className="text-[11px] text-zinc-500 font-mono">
                Ban hành thống nhất bởi Ban Chuyển đổi số &amp; Trí tuệ nhân tạo — SYNAPES Studio
              </p>
            </div>

            <div className="space-y-4 pt-2 text-[12.5px] leading-relaxed">
              {currentDoc.articles.map((art, i) => (
                <div key={i} className="space-y-1">
                  <h2 className="font-bold text-zinc-950">{art.heading}</h2>
                  <p className="text-zinc-700 text-justify">{art.body}</p>
                </div>
              ))}
            </div>

            <div className="pt-5 border-t border-black/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="text-[11px] text-zinc-500 space-y-0.5 font-mono">
                <div>Mã hiệu văn bản: {currentDoc.docNumber}</div>
                <div>Địa điểm ban hành: Gò Vấp, TP. Hồ Chí Minh</div>
                <div>Trạng thái: Hiệu lực chính thức • Đồng bộ PDF</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-[10.5px] font-bold uppercase text-zinc-800">
                  ĐẠI DIỆN ĐƠN VỊ BAN HÀNH
                </div>
                <img
                  src="/stamp-truong-ban.png"
                  alt="Con dấu đỏ KS. Nguyễn Hoàng Thiện"
                  className="w-24 h-24 mx-auto object-contain opacity-95"
                />
                <div className="text-xs font-bold text-zinc-950">KS. Nguyễn Hoàng Thiện</div>
                <div className="text-[10px] text-zinc-600">Trưởng ban CĐS &amp; Trí tuệ nhân tạo</div>
              </div>
            </div>
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
