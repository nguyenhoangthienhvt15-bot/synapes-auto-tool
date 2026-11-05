import React from 'react';
import { FileText } from 'lucide-react';

interface PolicyModalProps {
  policyType: string | null;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ policyType, onClose }) => {
  if (!policyType) return null;

  // Keyboard shortcut: Press Escape to close modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-black/[0.08] max-w-xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto text-xs space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1F] tracking-tight">
                {policyType === 'terms' && 'Điều Khoản Dịch Vụ Phần Mềm'}
                {policyType === 'privacy' && 'Chính Sách Bảo Mật Dữ Liệu & Token'}
                {policyType === 'copyright' && 'Cam Kết Quyền Sở Hữu Trí Tuệ & Bản Quyền'}
                {policyType === 'disclaimer' && 'Cơ Chế Phê Duyệt & Miễn Trừ Trách Nhiệm'}
              </h3>
              <p className="text-zinc-500 text-[11px]">Hợp đồng dịch vụ công nghệ số HD-TECH/2026-AUTOPUB</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-sm p-1">
            ✕
          </button>
        </div>

        <div className="space-y-3 text-zinc-700 leading-relaxed">
          {policyType === 'terms' && (
            <>
              <p><strong className="text-zinc-900">1. Phạm vi cung cấp:</strong> Hệ thống WebApp cung cấp công cụ tự động hóa sản xuất video thông minh bằng AI, kết hợp trình duyệt kịch bản, ghép nối timeline và phân phối lên YouTube, TikTok, Facebook.</p>
              <p><strong className="text-zinc-900">2. Mã truy cập:</strong> Khách hàng được cấp Mã Code độc nhất kèm mật khẩu mặc định khởi tạo. Khách hàng có quyền và nghĩa vụ đổi sang mật khẩu cá nhân để bảo vệ tài khoản.</p>
              <p><strong className="text-zinc-900">3. Giới hạn thời lượng:</strong> Theo thỏa thuận kỹ thuật, video dài trên YouTube được thiết kế trong định hạn từ 5 đến 10 phút; video ngắn trên TikTok và Facebook dưới 60 giây.</p>
            </>
          )}

          {policyType === 'privacy' && (
            <>
              <p><strong className="text-zinc-900">1. Mã hóa Token OAuth:</strong> Toàn bộ Refresh Token và Access Token kết nối YouTube Data API, Meta Graph API, TikTok Posting API và Google Drive đều được mã hóa bằng thuật toán AES-256-GCM. Không một nhân sự nào có quyền giải mã trái phép.</p>
              <p><strong className="text-zinc-900">2. Mật khẩu cá nhân của khách:</strong> Mật khẩu do khách hàng tự đặt được băm một chiều (bcrypt hash) và KHÔNG BAO GIỜ lưu trữ dưới dạng đọc được trên bất kỳ bảng biểu hay Google Sheet nào.</p>
              <p><strong className="text-zinc-900">3. Bảo mật Google Drive:</strong> Ứng dụng chỉ sử dụng phạm vi quyền <code>drive.file</code>, nghĩa là hệ thống chỉ đọc và ghi các file video do chính hệ thống tạo ra, hoàn toàn không có quyền xem hay can thiệp vào các tài liệu cá nhân khác của bạn trên Drive.</p>
            </>
          )}

          {policyType === 'copyright' && (
            <>
              <p><strong className="text-zinc-900">1. Quyền sở hữu 100%:</strong> Khách hàng là chủ sở hữu hợp pháp duy nhất của mọi sản phẩm video, kịch bản, âm thanh và hình ảnh được sản xuất hoàn thiện thông qua hệ thống.</p>
              <p><strong className="text-zinc-900">2. Không tái đào tạo dữ liệu:</strong> Mọi prompt ý tưởng, file mẫu, kịch bản gốc và tài nguyên do khách hàng tải lên cam kết KHÔNG được sử dụng để tái huấn luyện (re-train) các mô hình AI khác nếu không có văn bản chấp thuận của khách.</p>
              <p><strong className="text-zinc-900">3. Kho nhạc bản quyền thương mại:</strong> Toàn bộ nhạc nền tích hợp trong hệ thống đều là kho nhạc có bản quyền thương mại (Royalty-free) hoặc thuộc thư viện thương mại của YouTube Audio Library / TikTok Commercial Music Library, bảo vệ kênh không bị phạt gậy Content ID.</p>
            </>
          )}

          {policyType === 'disclaimer' && (
            <>
              <p><strong className="text-zinc-900">1. Trình duyệt cuối cùng (Human-in-the-loop):</strong> Mọi video trước khi đăng tải chính thức lên YouTube, TikTok hay Facebook đều phải qua bước kiểm tra và phê duyệt cuối cùng của Khách hàng trên WebApp.</p>
              <p><strong className="text-zinc-900">2. Trách nhiệm nội dung:</strong> Sau khi Khách hàng bấm nút "Phê duyệt & Đăng ngay" hoặc "Hẹn giờ đăng", Khách hàng chịu trách nhiệm cuối cùng về tính pháp lý và thông điệp truyền thông của video trên các nền tảng mạng xã hội.</p>
              <p><strong className="text-zinc-900">3. Cam kết SLA Uptime:</strong> Hệ thống cam kết thời gian hoạt động ổn định 99.5%, các sự cố gián đoạn do chính sách API bên thứ ba (Google, Meta, TikTok) sẽ được đội ngũ kỹ sư hỗ trợ xử lý trong vòng 2 giờ làm việc.</p>
            </>
          )}
        </div>

        <div className="pt-3 border-t border-black/[0.06] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
