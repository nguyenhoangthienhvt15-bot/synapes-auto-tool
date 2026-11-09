import { UserRegistrationData } from '../types';
import { STAMP_BASE64 } from '../data/stampBase64';
import { QR_CODE_BASE64 } from '../data/qrCodeBase64';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Trình tạo văn bản Hợp Đồng Điện Tử Tổng Quát SYNAPES Studio
 * Thiết kế chuẩn 2 trang A4 độc lập (794px x 1123px) chống 100% lỗi cắt dòng khi chuyển trang
 * và chống tràn lề phải trên mọi trình đọc PDF (WPS Office, Adobe Reader, Chrome PDF).
 */

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateContractDocHtml(data: UserRegistrationData): string {
  const currentDate = new Date();
  const day = currentDate.getDate().toString().padStart(2, '0');
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const year = currentDate.getFullYear();
  const dateFormatted = `${day}/${month}/${year}`;

  const fullNameDisplay = escapeHtml(data.fullName) || 'Khách hàng SYNAPES';
  const idCardDisplay = escapeHtml(data.idCardNumber) || 'Chưa cung cấp';
  const dobDisplay = escapeHtml(data.dob) || 'Không cung cấp';
  const genderDisplay = escapeHtml(data.gender) || 'Không cung cấp';
  const phoneDisplay = escapeHtml(data.phone) || 'Không cung cấp';
  const emailDisplay = escapeHtml(data.email) || 'Không cung cấp';
  const addressDisplay = escapeHtml(data.address) || 'Không cung cấp';

  // Lấy ảnh chữ ký tay người dùng (nếu có trong dữ liệu hoặc trong bộ nhớ lưu trữ theo email người dùng)
  const signatureDisplay = data.signatureImage || (typeof window !== 'undefined'
    ? (data.email ? localStorage.getItem(`synapes_user_signature_${data.email.toLowerCase()}`) || '' : '')
    : '');

  // Xác định gói và phương thức
  const pkg = data.contractPackage || (data.contractCategory === 'enterprise' ? 'enterprise_deposit' : 'personal_deposit');
  const isEnterprise = data.contractCategory === 'enterprise' || pkg.startsWith('enterprise');
  const isDeposit = pkg.includes('deposit') || (data.depositAmount !== undefined && data.totalAmount !== undefined && data.depositAmount < data.totalAmount);

  const depositAmount = data.depositAmount || (isEnterprise ? 2500000 : 1250000);
  const totalAmount = data.totalAmount || (isEnterprise ? 5490000 : 2550000);
  const originalAmount = data.originalAmount || (isEnterprise ? 6250000 : 3250000);
  const deliveryDays = data.deliveryDays || (isEnterprise ? 7 : 5);

  const formatVnd = (n: number) => n.toLocaleString('vi-VN') + ' VNĐ';
  const isFinalHandover = Boolean(data.isFinalDelivered);

  const contractTitle = isDeposit
    ? (isFinalHandover
      ? 'HỢP ĐỒNG BÀN GIAO SẢN PHẨM HOÀN CHỈNH & XÁC NHẬN THANH TOÁN ĐỦ 100% GIÁ TRỊ'
      : 'HỢP ĐỒNG ĐẶT CỌC CUNG CẤP HỆ THỐNG CÔNG NGHỆ & DỊCH VỤ PHẦN MỀM')
    : 'HỢP ĐỒNG CUNG CẤP DỊCH VỤ PHẦN MỀM & BẢN QUYỀN HỆ THỐNG CÔNG NGHỆ';

  const contractSubtitle = isFinalHandover
    ? '(BIÊN BẢN BÀN GIAO HOÀN TẤT & QUYẾT TOÁN 100% — KÍCH HOẠT VĨNH VIỄN)'
    : (isEnterprise
      ? '(GÓI TOÀN HỆ THỐNG CAO CẤP — HẠN MỨC CHỨC NĂNG TỐI ĐA)'
      : '(GÓI CÁ NHÂN HÓA — TỰ ĐỘNG HÓA SÁNG TẠO NỘI DUNG ĐA TẦNG)');

  return `
    <div id="pdf-contract-wrapper" style="width: 794px; background-color: #ffffff; color: #111827; font-family: 'Times New Roman', Times, serif; margin: 0; padding: 0;">
      <style>
        #pdf-contract-wrapper * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        #pdf-contract-wrapper .pdf-a4-page {
          width: 794px;
          height: 1123px;
          padding: 40px 54px 44px 54px;
          background-color: #ffffff;
          color: #111827;
          position: relative;
          overflow: hidden;
          font-family: "Times New Roman", Times, serif;
          font-size: 10.2pt;
          line-height: 1.4;
          page-break-after: always;
        }
        #pdf-contract-wrapper .header-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          text-align: center;
          margin-bottom: 12px;
          width: 100%;
        }
        #pdf-contract-wrapper .header-left {
          width: 46%;
        }
        #pdf-contract-wrapper .header-right {
          width: 52%;
        }
        #pdf-contract-wrapper .title-org {
          font-size: 9.8pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0;
          color: #0f172a;
        }
        #pdf-contract-wrapper .title-sub {
          font-size: 9.2pt;
          font-weight: bold;
          margin: 2px 0;
          color: #1e293b;
        }
        #pdf-contract-wrapper .title-code {
          font-size: 8.8pt;
          margin-top: 2px;
          color: #334155;
        }
        #pdf-contract-wrapper .line-decor {
          width: 48%;
          height: 1px;
          background: #374151;
          margin: 3px auto;
        }
        #pdf-contract-wrapper .contract-title {
          text-align: center;
          margin: 12px 0 10px 0;
        }
        #pdf-contract-wrapper .contract-title h1 {
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0;
          color: #0f172a;
          letter-spacing: 0.2px;
        }
        #pdf-contract-wrapper .contract-title h2 {
          font-size: 10.2pt;
          font-weight: bold;
          margin: 3px 0 2px 0;
          color: #1e293b;
        }
        #pdf-contract-wrapper .contract-title p {
          font-size: 8.8pt;
          font-style: italic;
          margin: 2px 0 0 0;
          text-indent: 0;
          text-align: center;
          color: #475569;
        }
        #pdf-contract-wrapper .legal-box {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 8.4pt;
          line-height: 1.34;
          margin-bottom: 10px;
          color: #1e293b;
          width: 100%;
        }
        #pdf-contract-wrapper .legal-box b {
          font-size: 8.6pt;
          display: block;
          margin-bottom: 2px;
          color: #0f172a;
        }
        #pdf-contract-wrapper .section-title {
          font-size: 10.4pt;
          font-weight: bold;
          margin: 8px 0 3px 0;
          color: #0f172a;
        }
        #pdf-contract-wrapper .party-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 6px 10px;
          margin-bottom: 6px;
          width: 100%;
        }
        #pdf-contract-wrapper .party-title {
          font-weight: bold;
          margin-bottom: 2px;
          text-transform: uppercase;
          font-size: 9.4pt;
          color: #0f172a;
        }
        #pdf-contract-wrapper ul.party-info {
          list-style-type: none;
          padding-left: 0;
          margin: 0;
          font-size: 9.5pt;
          line-height: 1.36;
          color: #1e293b;
        }
        #pdf-contract-wrapper ul.party-info li {
          margin-bottom: 1.5px;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        #pdf-contract-wrapper p {
          text-indent: 20px;
          margin: 3px 0;
          text-align: justify;
          font-size: 9.8pt;
          line-height: 1.4;
          color: #1e293b;
          width: 100%;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        #pdf-contract-wrapper .signature-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 18px;
          width: 100%;
        }
        #pdf-contract-wrapper .signature-box {
          width: 48%;
          text-align: center;
          position: relative;
        }
        #pdf-contract-wrapper .signature-title {
          font-weight: bold;
          text-transform: uppercase;
          font-size: 9.8pt;
          margin-bottom: 2px;
          color: #0f172a;
        }
        #pdf-contract-wrapper .signature-role {
          font-size: 8.8pt;
          font-weight: bold;
          margin-bottom: 2px;
          color: #1e293b;
        }
        #pdf-contract-wrapper .signature-sub {
          font-style: italic;
          font-size: 8.4pt;
          color: #4b5563;
          margin-bottom: 6px;
        }
        #pdf-contract-wrapper .signature-name {
          font-weight: bold;
          font-size: 10.4pt;
          color: #0f172a;
          text-transform: uppercase;
          margin-top: 3px;
        }
        #pdf-contract-wrapper .signed-badge {
          font-size: 8.4pt;
          font-style: italic;
          margin-top: 2px;
        }
        #pdf-contract-wrapper .signed-buyer {
          color: #15803d;
        }
        #pdf-contract-wrapper .signed-seller {
          color: #b91c1c;
        }
        #pdf-contract-wrapper .stamp-container {
          position: relative;
          height: 125px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 2px auto;
        }
        #pdf-contract-wrapper .stamp-img {
          width: 122px;
          height: 122px;
          object-fit: contain;
          transform: rotate(-1.5deg);
          filter: contrast(1.05);
          pointer-events: none;
        }
        #pdf-contract-wrapper .buyer-sign-box {
          height: 125px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 2px auto;
        }
        #pdf-contract-wrapper .buyer-seal-badge {
          border: 1.5px dashed #15803d;
          background: #f0fdf4;
          color: #15803d;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 8.6pt;
          font-weight: bold;
        }
        #pdf-contract-wrapper .payment-box {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 6px 10px;
          margin: 6px 0;
          font-size: 8.8pt;
        }
        #pdf-contract-wrapper .page-footer {
          position: absolute;
          bottom: 20px;
          left: 54px;
          right: 54px;
          border-top: 1px solid #cbd5e1;
          padding-top: 5px;
          display: flex;
          justify-content: space-between;
          font-size: 8pt;
          color: #64748b;
          font-style: italic;
        }
      </style>

      <!-- ==================== TRANG 1 / 2 ==================== -->
      <div id="pdf-page-1" class="pdf-a4-page">
        <!-- Header Quốc hiệu Tiêu ngữ -->
        <div class="header-grid">
          <div class="header-left">
            <div class="title-org">HỆ THỐNG CÔNG NGHỆ SYNAPES</div>
            <div class="title-sub">BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO</div>
            <div class="line-decor"></div>
            <div class="title-code">Số: 05/2026/HĐĐT-SYNAPES</div>
          </div>
          <div class="header-right">
            <div class="title-org">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="title-sub">Độc lập - Tự do - Hạnh phúc</div>
            <div class="line-decor"></div>
            <div class="title-code"><i>Thành phố Hồ Chí Minh, ngày ${day} tháng ${month} năm ${year}</i></div>
          </div>
        </div>

        <!-- Tiêu đề Hợp đồng -->
        <div class="contract-title">
          <h1>${contractTitle}</h1>
          <h2>NỀN TẢNG SẢN XUẤT VIDEO TỰ ĐỘNG SYNAPES STUDIO</h2>
          <p>${contractSubtitle}</p>
        </div>

        <!-- Căn cứ pháp lý -->
        <div class="legal-box">
          <b>CĂN CỨ PHÁP LÝ THI HÀNH:</b>
          <div>- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015 của Quốc hội nước CHXHCN Việt Nam;</div>
          <div>- Căn cứ Luật Giao dịch điện tử số 20/2023/QH15 ngày 22/06/2023 (công nhận tính pháp lý của chứng từ điện tử);</div>
          <div>- Căn cứ Luật Công nghệ thông tin số 67/2006/QH11 và Luật An toàn thông tin mạng số 86/2015/QH13;</div>
          <div>- Căn cứ Luật An ninh mạng số 24/2018/QH14 và Luật Sở hữu trí tuệ số 50/2005/QH11 (sửa đổi, bổ sung 2022);</div>
          <div>- Căn cứ Nghị định số 13/2023/NĐ-CP (bảo vệ dữ liệu cá nhân) và Nghị định số 147/2024/NĐ-CP của Chính phủ.</div>
        </div>

        <p style="text-indent: 0; margin-bottom: 5px;">
          Hôm nay, ngày <b>${dateFormatted}</b>, tại Thành phố Hồ Chí Minh, hai bên chúng tôi gồm:
        </p>

        <!-- Thông tin Bên A -->
        <div class="party-box">
          <div class="party-title">BÊN A: BÊN CUNG CẤP HỆ THỐNG PHẦN MỀM (SYNAPES STUDIO)</div>
          <ul class="party-info">
            <li>• <b>Đơn vị phát triển:</b> Nền tảng Tự động hóa Nội dung số SYNAPES Studio</li>
            <li>• <b>Đại diện pháp lý:</b> <b>KS. NGUYỄN HOÀNG THIỆN</b></li>
            <li>• <b>Số CCCD / CMND:</b> <b style="color: #0f172a; font-family: monospace;">072206002509</b></li>
            <li>• <b>Địa chỉ thường trú:</b> Gò Vấp, TP HCM</li>
            <li>• <b>Chức vụ:</b> <b>Trưởng ban Chuyển đổi số & Trí tuệ nhân tạo</b></li>
            <li>• <b>Hộp thư điện tử chính thức:</b> nguyenhoangthien.hvt.15@gmail.com</li>
            <li>• <b>Cổng dịch vụ trực tuyến:</b> https://synapes-auto-tool.onrender.com</li>
            <li>• <b>Tài khoản thanh toán:</b> Timo Digital Bank by BVBank — STK: <b>0983396354</b> (Chủ TK: NGUYEN HOANG THIEN)</li>
          </ul>
        </div>

        <!-- Thông tin Bên B -->
        <div class="party-box">
          <div class="party-title">BÊN B: BÊN MUA HÀNG & SỬ DỤNG HỆ THỐNG (KHÁCH HÀNG)</div>
          <ul class="party-info">
            <li>• <b>Họ và tên khách hàng:</b> <b>${fullNameDisplay}</b></li>
            <li>• <b>Số CCCD / CMND:</b> <b style="color: #0f172a; font-family: monospace;">${idCardDisplay}</b></li>
            <li>• <b>Ngày tháng năm sinh:</b> ${dobDisplay} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Giới tính:</b> ${genderDisplay}</li>
            <li>• <b>Số điện thoại liên hệ:</b> ${phoneDisplay}</li>
            <li>• <b>Gmail nhận bàn giao & tài khoản:</b> ${emailDisplay}</li>
            <li>• <b>Địa chỉ hiện tại:</b> ${addressDisplay}</li>
          </ul>
        </div>

        <p style="text-indent: 0; margin: 5px 0 3px 0;">
          Sau khi nghiên cứu đầy đủ các quy định, hai bên thống nhất ký kết Hợp đồng với 05 điều khoản cam kết chi tiết:
        </p>

        <div class="section-title">Điều 1. Quyền hạn (hạn mức) và danh mục chức năng hệ thống cung cấp</div>
        ${isEnterprise ? `
        <p>
          1.1. <b>Hạn mức chức năng tối đa:</b> Bên B được sử dụng toàn bộ hạn mức cao nhất của hệ thống SYNAPES Studio dành cho doanh nghiệp và tổ chức chuyên nghiệp, không giới hạn lưu lượng sản xuất và số lượng kênh xuất bản.
        </p>
        <p>
          1.2. <b>Danh mục tính năng cao cấp:</b> Tự động hóa chức năng tạo - đăng tải video tuân thủ cấu trúc đa tầng; Phân hệ <b>AI Video Reverse Engineering & Video DNA Cloner</b> (bóc tách cấu trúc video mẫu, trích xuất visual hook 3s đầu viral, bóc tách kịch bản chi tiết và gợi ý prompt AI sinh ảnh/video tương tự); Biên tập chuẩn 16:9 và 9:16; Báo cáo đánh giá xu hướng thời gian thực; Mở rộng và cập nhật chức năng liên tục theo thời gian thực; Cơ chế BYOK (Bring Your Own Keys) an toàn thông tin tuyệt đối.
        </p>
        ` : `
        <p>
          1.1. <b>Phạm vi cá nhân hóa:</b> Bên B được quyền khai thác hệ thống SYNAPES Studio phiên bản Cá Nhân Hóa phục vụ nhu cầu sáng tạo video đơn kênh chuyên nghiệp.
        </p>
        <p>
          1.2. <b>Danh mục tính năng:</b> Tự động hóa chức năng tạo - đăng tải và tuân thủ cấu trúc đa tầng (Hook 3s, triển khai nội dung, kêu gọi hành động); Biên tập chuyên nghiệp tối ưu cả Video Dài YouTube (16:9) và Video Ngắn TikTok/Reels/Shorts (9:16); Đưa ra các báo cáo đánh giá về các xu hướng hiện thực; Cung cấp các đánh giá dữ liệu thời gian thực; Quản lý lịch phát sóng giờ vàng (Goldtime).
        </p>
        `}

        <div class="section-title">Điều 2. Giá trị hợp đồng, nghĩa vụ bàn giao & phương thức thanh toán</div>
        <p>
          2.1. <b>Giá trị hợp đồng:</b> Gói ký kết là <b>${data.contractPackageName || (isEnterprise ? 'Hợp đồng toàn hệ' : 'Hợp đồng cá nhân hóa')}</b>.
          ${isFinalHandover ? `
          Tổng giá trị bàn giao toàn vẹn của hệ thống là <b>${formatVnd(totalAmount)}</b>. <b>Xác nhận thanh toán:</b> Bên B đã hoàn tất chi trả đủ 100% giá trị hợp đồng (bao gồm tiền đặt cọc ${formatVnd(depositAmount)} và tiền quyết toán hoàn tất bàn giao ${formatVnd(totalAmount - depositAmount)}). Bên A xác nhận đã nhận đủ toàn bộ số tiền và không còn khiếu nại hay công nợ nào phát sinh giữa hai bên.
          ` : isDeposit ? `
          Giá đặt cọc là <b>${formatVnd(depositAmount)}</b>. Tổng giá trị toàn vẹn bàn giao hệ thống là <b>${formatVnd(totalAmount)}</b> (Giá giảm ưu đãi từ giá gốc niêm yết: <span style="text-decoration: line-through;">${formatVnd(originalAmount)}</span>). Số tiền còn lại <b>${formatVnd(totalAmount - depositAmount)}</b> sẽ được thanh toán khi hoàn tất bàn giao.
          ` : `
          Tổng giá trị thanh toán trọn gói 100% một lần là <b>${formatVnd(totalAmount)}</b> (Giá giảm ưu đãi từ giá gốc niêm yết: <span style="text-decoration: line-through;">${formatVnd(originalAmount)}</span>).
          `}
        </p>
        <p>
          2.2. <b>Nghĩa vụ bàn giao của Bên A:</b>
          ${isFinalHandover ? `
          <b>Bàn giao sản phẩm hoàn chỉnh:</b> Bên A chính thức bàn giao sản phẩm hệ thống phần mềm SYNAPES Studio hoàn chỉnh cho Bên B (bao gồm cả trường hợp hoàn thành và bàn giao sớm hơn thời hạn ${deliveryDays} ngày theo thỏa thuận để Bên B kịp thời khai thác thực tế). Kèm theo đó là Mã Code đăng nhập, Mật khẩu và quyền truy cập vĩnh viễn đã được gửi trực tiếp về Gmail <b>${emailDisplay}</b> của Bên B.
          ` : isDeposit ? `
          Người bán (Bên A) có nghĩa vụ bàn giao sản phẩm (hệ thống) đúng thời hạn, tính từ thời điểm đặt cọc là <b>${deliveryDays} ngày</b> (chấp nhận bàn giao sớm hơn hạn khi Kỹ sư hoàn tất triển khai). Khi bàn giao, Kỹ sư/Dev của Bên A xác nhận Bên B đã thanh toán đầy đủ số tiền còn lại và gửi thông báo hoàn tất bàn giao kèm tài khoản đăng nhập về Gmail của Bên B.
          ` : `
          Bên A có nghĩa vụ cấp đủ Mã Code đăng nhập, Mật khẩu cùng bản hợp đồng chính thức gửi về Gmail của Bên B ngay sau khi Kỹ sư duyệt xác nhận.
          `}
        </p>

        <div class="page-footer">
          <span>Hợp đồng điện tử SYNAPES Studio — Số: 05/2026/HĐĐT-SYNAPES</span>
          <span>Trang 1 / 2</span>
        </div>
      </div>

      <!-- ==================== TRANG 2 / 2 ==================== -->
      <div id="pdf-page-2" class="pdf-a4-page" style="padding-top: 42px;">
        <div class="section-title" style="margin-top: 0;">Điều 3. Thời hạn hiệu lực, cam kết bảo hành toàn thời gian & tính chính thống</div>
        <p>
          3.1. <b>Thời hạn hợp đồng:</b> Hợp đồng và quyền sử dụng hệ thống có tính <b>VĨNH VIỄN</b> kể từ thời điểm ký kết thành công giữa hai bên.
        </p>
        <p>
          3.2. <b>Cam kết bảo hành:</b> Bên bán (Bên A) cam kết bảo hành và cung cấp giải pháp bảo hành toàn thời gian cho toàn bộ phần mềm hệ thống, hỗ trợ kỹ thuật và khắc phục sự cố 24/7.
        </p>
        <p>
          3.3. <b>Tính chính thống:</b> Nền tảng SYNAPES Studio là hệ thống công nghệ chính thống, được bảo hộ bản quyền và trực tiếp phát triển, điều hành bởi Ban Chuyển đổi số & Trí tuệ nhân tạo (Trưởng ban: KS. Nguyễn Hoàng Thiện).
        </p>

        <div class="section-title">Điều 4. Bảo mật dữ liệu & an toàn thông tin chuẩn DMCA</div>
        <p>
          4.1. <b>Bảo vệ an toàn thông tin:</b> Hệ thống tuân thủ nghiêm ngặt Luật An toàn thông tin mạng 2015, Nghị định 13/2023/NĐ-CP và tiêu chuẩn bản quyền kỹ thuật số quốc tế DMCA. Toàn bộ cơ sở dữ liệu và khóa API của Bên B được mã hóa AES-256 trong môi trường Sandbox độc lập.
        </p>
        <p>
          4.2. <b>Quyền tác giả nội dung:</b> Bên B là chủ sở hữu quyền tác giả duy nhất và toàn vẹn 100% đối với mọi kịch bản và video xuất bản. Bên A không đòi hỏi bất kỳ quyền sở hữu thương mại hay phân chia doanh thu nào từ sản phẩm của Bên B.
        </p>

        <div class="section-title">Điều 5. Quyền miễn trừ trách nhiệm & quản trị rủi ro</div>
        <p>
          5.1. <b>Quyền miễn trừ của Bên A:</b> Bên A được miễn trừ hoàn toàn mọi trách nhiệm pháp lý, bồi thường thiệt hại hoặc tranh chấp phát sinh trong trường hợp Bên B tự ý sử dụng khóa API lậu, key không rõ nguồn gốc, hoặc tự ý sử dụng hình ảnh, âm thanh, video có bản quyền của bên thứ ba mà chưa được cấp phép.
        </p>
        <p>
          5.2. <b>Trách nhiệm của Bên B:</b> Bên B cam kết tự chịu hoàn toàn trách nhiệm trước pháp luật về tính chân thực, bản quyền tài nguyên và sự tuân thủ các quy định pháp luật an ninh mạng đối với các sản phẩm do mình tạo lập và xuất bản.
        </p>

        <!-- Khung tóm tắt thanh toán & QR chuyển khoản -->
        <div class="payment-box">
          <div style="font-weight: bold; color: #0f172a; margin-bottom: 2px;">THÔNG TIN TÀI KHOẢN THANH TOÁN CHÍNH THỨC CỦA ĐẠI DIỆN BÊN A:</div>
          <div>• Ngân hàng: <b>Timo Digital Bank by BVBank</b> — Số tài khoản: <b style="font-family: monospace;">0983396354</b> — Chủ TK: <b>NGUYEN HOANG THIEN</b></div>
          <div>• Số tiền thực hiện: <b>${formatVnd(isDeposit ? depositAmount : totalAmount)}</b> ${isDeposit ? `(Đặt cọc - Bàn giao sau ${deliveryDays} ngày)` : '(Thanh toán 100%)'}</div>
        </div>

        <!-- Phần chữ ký 2 bên -->
        <div class="signature-grid">
          <div class="signature-box">
            <div class="signature-title">ĐẠI DIỆN MUA HÀNG (BÊN B)</div>
            <div class="signature-role">KHÁCH HÀNG KÝ XÁC NHẬN</div>
            <div class="signature-sub"><i>(Chữ ký điện tử xác nhận cam kết)</i></div>

            <div class="buyer-sign-box">
              ${signatureDisplay ? `
                <div style="height: 52px; margin-bottom: 5px; display: flex; align-items: center; justify-content: center;">
                  <img src="${signatureDisplay}" style="max-height: 48px; max-width: 170px; object-fit: contain;" alt="Chữ ký tay Bên B" />
                </div>
              ` : `
                <div style="height: 18px;"></div>
              `}
              <div class="buyer-seal-badge">
                ĐÃ KÝ XÁC NHẬN ĐIỆN TỬ<br/>
                <span style="font-size: 8pt; font-weight: normal;">Ngày: ${dateFormatted}</span><br/>
                <span style="font-size: 7.8pt; font-weight: normal; font-family: monospace;">CCCD: ${idCardDisplay}</span>
              </div>
            </div>

            <div class="signature-name">${fullNameDisplay}</div>
            <div class="signed-badge signed-buyer">✓ Đã hiểu & chịu trách nhiệm điều khoản</div>
          </div>

          <div class="signature-box">
            <div class="signature-title">ĐẠI DIỆN GIAO DỊCH (BÊN A)</div>
            <div class="signature-role">TRƯỞNG BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO</div>
            <div class="signature-sub"><i>(Ký, đóng dấu xác thực điện tử)</i></div>

            <div class="stamp-container">
              <img class="stamp-img" src="${STAMP_BASE64}" alt="Con dấu Trưởng ban" />
            </div>

            <div class="signature-name">KS. NGUYỄN HOÀNG THIỆN</div>
            <div style="font-size: 8pt; color: #475569; font-family: monospace; margin-top: 1px;">CCCD: 072206002509</div>
            <div class="signed-badge signed-seller">✓ Đã ký & đóng dấu mộc đỏ Trưởng ban</div>
          </div>
        </div>

        <div class="page-footer">
          <span>Hợp đồng điện tử SYNAPES Studio — Khách hàng: ${fullNameDisplay} (${idCardDisplay})</span>
          <span>Trang 2 / 2</span>
        </div>
      </div>
    </div>
  `;
}

export function generateContractHtml(data: UserRegistrationData): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Hợp Đồng Điện Tử Dịch Vụ SYNAPES Studio - ${data.fullName}</title>
</head>
<body style="margin: 0; padding: 0; background: #ffffff;">
  ${generateContractDocHtml(data)}
</body>
</html>`;
}

/**
 * Kết xuất trực tiếp từng trang A4 (#pdf-page-1 và #pdf-page-2) qua html2canvas + jsPDF
 */
export async function downloadPersonalizedContractPdf(data: UserRegistrationData): Promise<void> {
  const cleanName = (data.fullName || 'SYNAPES').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '');
  const isFinalHandover = Boolean(data.isFinalDelivered);
  const filename = isFinalHandover
    ? `HOP_DONG_BAN_GIAO_HOAN_CHINH_SYNAPES_${cleanName || 'KHACH_HANG'}.pdf`
    : `HOP_DONG_DICH_VU_SYNAPES_${cleanName || 'KHACH_HANG'}.pdf`;

  const container = document.createElement('div');
  container.id = 'temp-pdf-contract-host';
  container.style.position = 'fixed';
  container.style.top = '0px';
  container.style.left = '0px';
  container.style.width = '794px';
  container.style.zIndex = '-9999';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';
  container.innerHTML = generateContractDocHtml(data);
  document.body.appendChild(container);

  try {
    const page1El = container.querySelector('#pdf-page-1') as HTMLElement;
    const page2El = container.querySelector('#pdf-page-2') as HTMLElement;

    if (!page1El || !page2El) {
      throw new Error('Không tìm thấy thành phần trang PDF.');
    }

    const canvasOptions = {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
      windowWidth: 794,
    };

    const [canvas1, canvas2] = await Promise.all([
      html2canvas(page1El, canvasOptions),
      html2canvas(page2El, canvasOptions)
    ]);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const imgData1 = canvas1.toDataURL('image/jpeg', 0.96);
    pdf.addImage(imgData1, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    pdf.addPage('a4', 'portrait');
    const imgData2 = canvas2.toDataURL('image/jpeg', 0.96);
    pdf.addImage(imgData2, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    pdf.save(filename);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

export function printPersonalizedContractPdf(data: UserRegistrationData): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(generateContractDocHtml(data));
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}
