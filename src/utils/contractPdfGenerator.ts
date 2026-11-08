import { UserRegistrationData } from '../types';
import { STAMP_BASE64 } from '../data/stampBase64';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Trình tạo văn bản Hợp Đồng Điện Tử Tổng Quát SYNAPES Studio
 * Thiết kế chuẩn 2 trang A4 độc lập (794px x 1123px) chống 100% lỗi cắt dòng khi chuyển trang
 * và chống tràn lề phải trên mọi trình đọc PDF (WPS Office, Adobe Reader, Chrome PDF).
 */

export function generateContractDocHtml(data: UserRegistrationData): string {
  const currentDate = new Date();
  const day = currentDate.getDate().toString().padStart(2, '0');
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const year = currentDate.getFullYear();
  const dateFormatted = `${day}/${month}/${year}`;

  const fullNameDisplay = data.fullName || 'Khách hàng SYNAPES';
  const dobDisplay = data.dob || 'Không cung cấp';
  const genderDisplay = data.gender || 'Không cung cấp';
  const phoneDisplay = data.phone || 'Không cung cấp';
  const emailDisplay = data.email || 'Không cung cấp';
  const addressDisplay = data.address || 'Không cung cấp';

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
          padding: 44px 56px 48px 56px;
          background-color: #ffffff;
          color: #111827;
          position: relative;
          overflow: hidden;
          font-family: "Times New Roman", Times, serif;
          font-size: 10.5pt;
          line-height: 1.42;
          page-break-after: always;
        }
        #pdf-contract-wrapper .header-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          text-align: center;
          margin-bottom: 14px;
          width: 100%;
        }
        #pdf-contract-wrapper .header-left {
          width: 46%;
        }
        #pdf-contract-wrapper .header-right {
          width: 52%;
        }
        #pdf-contract-wrapper .title-org {
          font-size: 10pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0;
          color: #0f172a;
        }
        #pdf-contract-wrapper .title-sub {
          font-size: 9.5pt;
          font-weight: bold;
          margin: 2px 0;
          color: #1e293b;
        }
        #pdf-contract-wrapper .title-code {
          font-size: 9pt;
          margin-top: 3px;
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
          margin: 14px 0 12px 0;
        }
        #pdf-contract-wrapper .contract-title h1 {
          font-size: 13pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0;
          color: #0f172a;
          letter-spacing: 0.2px;
        }
        #pdf-contract-wrapper .contract-title h2 {
          font-size: 11pt;
          font-weight: bold;
          margin: 3px 0 2px 0;
          color: #1e293b;
        }
        #pdf-contract-wrapper .contract-title p {
          font-size: 9pt;
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
          padding: 8px 12px;
          font-size: 8.8pt;
          line-height: 1.38;
          margin-bottom: 12px;
          color: #1e293b;
          width: 100%;
        }
        #pdf-contract-wrapper .legal-box b {
          font-size: 9pt;
          display: block;
          margin-bottom: 3px;
          color: #0f172a;
        }
        #pdf-contract-wrapper .section-title {
          font-size: 10.8pt;
          font-weight: bold;
          margin: 10px 0 4px 0;
          color: #0f172a;
        }
        #pdf-contract-wrapper .party-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 7px 12px;
          margin-bottom: 8px;
          width: 100%;
        }
        #pdf-contract-wrapper .party-title {
          font-weight: bold;
          margin-bottom: 3px;
          text-transform: uppercase;
          font-size: 9.8pt;
          color: #0f172a;
        }
        #pdf-contract-wrapper ul.party-info {
          list-style-type: none;
          padding-left: 0;
          margin: 0;
          font-size: 10pt;
          line-height: 1.4;
          color: #1e293b;
        }
        #pdf-contract-wrapper ul.party-info li {
          margin-bottom: 2px;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        #pdf-contract-wrapper p {
          text-indent: 22px;
          margin: 4px 0;
          text-align: justify;
          font-size: 10.2pt;
          line-height: 1.44;
          color: #1e293b;
          width: 100%;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        #pdf-contract-wrapper .signature-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 28px;
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
          font-size: 10.2pt;
          margin-bottom: 2px;
          color: #0f172a;
        }
        #pdf-contract-wrapper .signature-role {
          font-size: 9pt;
          font-weight: bold;
          margin-bottom: 2px;
          color: #1e293b;
        }
        #pdf-contract-wrapper .signature-sub {
          font-style: italic;
          font-size: 8.8pt;
          color: #4b5563;
          margin-bottom: 8px;
        }
        #pdf-contract-wrapper .signature-name {
          font-weight: bold;
          font-size: 11pt;
          color: #0f172a;
          text-transform: uppercase;
          margin-top: 4px;
        }
        #pdf-contract-wrapper .signed-badge {
          font-size: 8.8pt;
          font-style: italic;
          margin-top: 3px;
        }
        #pdf-contract-wrapper .signed-buyer {
          color: #15803d;
        }
        #pdf-contract-wrapper .signed-seller {
          color: #b91c1c;
        }
        #pdf-contract-wrapper .stamp-container {
          position: relative;
          height: 135px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 2px auto;
        }
        #pdf-contract-wrapper .stamp-img {
          width: 132px;
          height: 132px;
          object-fit: contain;
          transform: rotate(-1.5deg);
          filter: contrast(1.05);
          pointer-events: none;
        }
        #pdf-contract-wrapper .buyer-sign-box {
          height: 135px;
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
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 9pt;
          font-weight: bold;
        }
        #pdf-contract-wrapper .page-footer {
          position: absolute;
          bottom: 24px;
          left: 56px;
          right: 56px;
          border-top: 1px solid #cbd5e1;
          padding-top: 6px;
          display: flex;
          justify-content: space-between;
          font-size: 8.5pt;
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
          <h1>HỢP ĐỒNG ĐIỆN TỬ CUNG CẤP & SỬ DỤNG DỊCH VỤ PHẦN MỀM</h1>
          <h2>NỀN TẢNG SẢN XUẤT VIDEO TỰ ĐỘNG SYNAPES STUDIO</h2>
          <p>(Hợp đồng dịch vụ tổng quát xác lập quyền hạn, bảo mật dữ liệu và nghĩa vụ pháp lý)</p>
        </div>

        <!-- Căn cứ pháp lý -->
        <div class="legal-box">
          <b>CĂN CỨ PHÁP LÝ THI HÀNH:</b>
          <div>- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015 của Quốc hội nước CHXHCN Việt Nam;</div>
          <div>- Căn cứ Luật Giao dịch điện tử số 20/2023/QH15 ngày 22/06/2023 (quy định giá trị pháp lý chứng từ điện tử);</div>
          <div>- Căn cứ Luật Công nghệ thông tin số 67/2006/QH11 ngày 29/06/2006 của Quốc hội;</div>
          <div>- Căn cứ Luật An toàn thông tin mạng số 86/2015/QH13 và Luật An ninh mạng số 24/2018/QH14;</div>
          <div>- Căn cứ Luật Sở hữu trí tuệ số 50/2005/QH11 và Luật sửa đổi, bổ sung số 07/2022/QH15;</div>
          <div>- Căn cứ Nghị định số 13/2023/NĐ-CP của Chính phủ về bảo vệ dữ liệu cá nhân;</div>
          <div>- Căn cứ Nghị định số 147/2024/NĐ-CP của Chính phủ về quản lý, cung cấp và sử dụng dịch vụ Internet.</div>
        </div>

        <p style="text-indent: 0; margin-bottom: 6px;">
          Hôm nay, ngày <b>${dateFormatted}</b>, tại Thành phố Hồ Chí Minh (Hệ thống Nền tảng Đám mây SYNAPES Studio), hai bên chúng tôi gồm:
        </p>

        <!-- Thông tin Bên A -->
        <div class="party-box">
          <div class="party-title">BÊN A: BÊN CUNG CẤP DỊCH VỤ NỀN TẢNG (SYNAPES STUDIO)</div>
          <ul class="party-info">
            <li>• <b>Đơn vị phát triển:</b> Nền tảng Tự động hóa Nội dung số SYNAPES Studio</li>
            <li>• <b>Đại diện giao dịch:</b> <b>KS. NGUYỄN HOÀNG THIỆN</b></li>
            <li>• <b>Chức vụ:</b> <b>Trưởng ban Chuyển đổi số & Trí tuệ nhân tạo</b></li>
            <li>• <b>Hộp thư điện tử chính thức:</b> nguyenhoangthien.hvt.15@gmail.com</li>
            <li>• <b>Cổng dịch vụ trực tuyến:</b> https://synapes-auto-tool.onrender.com</li>
          </ul>
        </div>

        <!-- Thông tin Bên B -->
        <div class="party-box">
          <div class="party-title">BÊN B: BÊN MUA HÀNG VÀ SỬ DỤNG DỊCH VỤ (KHÁCH HÀNG)</div>
          <ul class="party-info">
            <li>• <b>Họ và tên khách hàng:</b> <b>${fullNameDisplay}</b></li>
            <li>• <b>Ngày tháng năm sinh:</b> ${dobDisplay} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Giới tính:</b> ${genderDisplay}</li>
            <li>• <b>Số điện thoại liên hệ:</b> ${phoneDisplay}</li>
            <li>• <b>Gmail đăng ký nhận tài khoản:</b> ${emailDisplay}</li>
            <li>• <b>Địa chỉ hiện tại:</b> ${addressDisplay}</li>
          </ul>
        </div>

        <p style="text-indent: 0; margin: 6px 0 4px 0;">
          Sau khi nghiên cứu đầy đủ các quy định, hai bên thống nhất ký kết Hợp đồng điện tử với 05 điều khoản cam kết sau:
        </p>

        <div class="section-title">Điều 1. Quy chế cung cấp và sử dụng phần mềm SYNAPES Studio</div>
        <p>
          1.1. Bên A cung cấp giải pháp phần mềm tự động hóa sản xuất nội dung số dạng dịch vụ (SaaS) SYNAPES Auto Tool cho Bên B. Sau khi hồ sơ được phê duyệt, Bên B được cấp Mã Code định danh cá nhân và mật khẩu đăng nhập riêng biệt.
        </p>
        <p>
          1.2. Bên B được quyền khai thác các phân hệ công nghệ gồm: Khởi tạo kịch bản đa mô hình AI (GPT, Claude, Gemini, DeepSeek, Grok), tổng hợp giọng đọc nhân tạo (TTS), biên tập ghép nối cảnh quay (MultiClip Stitcher) và đồng bộ lịch xuất bản đa nền tảng.
        </p>
        <p>
          1.3. Bên B có nghĩa vụ tự bảo mật thông tin tài khoản, đổi mật khẩu cá nhân trong phiên làm việc đầu tiên; nghiêm cấm mọi hành vi dịch ngược mã nguồn, tấn công từ chối dịch vụ (DDoS) hoặc can thiệp trái phép vào hạ tầng máy chủ của Bên A.
        </p>

        <div class="section-title">Điều 2. Cam kết bảo mật dữ liệu cá nhân & an toàn Token API</div>
        <p>
          2.1. Tuân thủ Nghị định số 13/2023/NĐ-CP của Chính phủ, Bên A áp dụng cơ chế mã hóa chuẩn AES-256-GCM và băm mật khẩu một chiều nhằm bảo vệ an toàn tuyệt đối cho hồ sơ định danh và kho lưu trữ dự án của Bên B.
        </p>
        <p>
          2.2. Toàn bộ khóa kết nối API của Bên B (API Keys AI Module, YouTube Data API, TikTok API, Facebook Graph API, Google Drive Cloud) chỉ được sử dụng cho mục đích thực thi tác vụ tự động theo lệnh của Bên B; Bên A cam kết không sao lưu trái phép hoặc tiết lộ cho bất kỳ bên thứ ba nào.
        </p>

        <div class="page-footer">
          <span>Hợp đồng điện tử dịch vụ phần mềm SYNAPES Studio — Số: 05/2026/HĐĐT-SYNAPES</span>
          <span>Trang 1 / 2</span>
        </div>
      </div>

      <!-- ==================== TRANG 2 / 2 ==================== -->
      <div id="pdf-page-2" class="pdf-a4-page" style="padding-top: 48px;">
        <div class="section-title" style="margin-top: 0;">Điều 3. Quyền sở hữu trí tuệ đối với kịch bản và sản phẩm video</div>
        <p>
          3.1. Căn cứ Luật Sở hữu trí tuệ năm 2005 (sửa đổi, bổ sung năm 2022) và Công ước Berne: Bên B là chủ sở hữu quyền tác giả duy nhất và toàn vẹn đối với mọi kịch bản văn học, tư liệu sáng tạo và sản phẩm video hoàn thiện được kết xuất từ hệ thống.
        </p>
        <p>
          3.2. Bên A đóng vai trò là đơn vị cung cấp công cụ kỹ thuật hỗ trợ sản xuất; Bên A không đòi hỏi bất kỳ quyền sở hữu trí tuệ, bản quyền thương mại hay quyền phân chia doanh thu nào phát sinh từ các kênh phân phối nội dung của Bên B.
        </p>

        <div class="section-title">Điều 4. Cơ chế phê duyệt kiểm soát nội dung & Miễn trừ trách nhiệm</div>
        <p>
          4.1. <b>Cơ chế kiểm soát con người (Human-in-the-loop):</b> Hệ thống vận hành theo quy trình kiểm duyệt bắt buộc. Toàn bộ kịch bản và video chỉ được đưa vào hàng đợi xuất bản lên mạng xã hội sau khi Bên B đã trực tiếp xem xét và chủ động bấm nút xác nhận phê duyệt.
        </p>
        <p>
          4.2. Bên B cam kết tuân thủ nghiêm chỉnh Điều 8 và Điều 16 Luật An ninh mạng năm 2018 cùng Nghị định số 147/2024/NĐ-CP; tự chịu hoàn toàn trách nhiệm trước pháp luật về tính hợp pháp, bản quyền hình ảnh/âm thanh và mọi hệ quả pháp lý của nội dung do mình đăng tải. Bên A được miễn trừ toàn bộ trách nhiệm liên đới đối với các vi phạm nội dung từ phía Bên B.
        </p>

        <div class="section-title">Điều 5. Hiệu lực hợp đồng và quy trình kích hoạt tự động</div>
        <p>
          5.1. Hợp đồng điện tử này có giá trị pháp lý tương đương văn bản hợp đồng giấy theo quy định tại Điều 13 và Điều 34 Luật Giao dịch điện tử số 20/2023/QH15, chính thức có hiệu lực kể từ thời điểm Bên B tích chọn xác nhận điều khoản và ký điện tử trên WebApp.
        </p>
        <p>
          5.2. Ngay sau khi ký kết, hồ sơ đăng ký của Bên B được đồng bộ lưu trữ tại trang tính <b>THÔNG TIN NGƯỜI DÙNG</b> của hệ thống quản trị. Khi Kỹ sư phụ trách của Bên A tích duyệt xác thực, hệ thống sẽ tự động khởi tạo Mã Code đăng nhập và Mật khẩu gửi trực tiếp kèm bản mềm Hợp đồng này về địa chỉ Gmail đã đăng ký của Bên B.
        </p>
        <p>
          5.3. Bản hợp đồng điện tử này được lập thành văn bản số hóa có gắn chữ ký xác nhận của hai bên và đóng dấu đỏ chức danh của Đại diện Bên A để làm cơ sở pháp lý thực hiện.
        </p>

        <!-- Phần chữ ký 2 bên -->
        <div class="signature-grid">
          <div class="signature-box">
            <div class="signature-title">ĐẠI DIỆN MUA HÀNG (BÊN B)</div>
            <div class="signature-role">KHÁCH HÀNG ĐĂNG KÝ SỬ DỤNG</div>
            <div class="signature-sub"><i>(Chữ ký điện tử xác nhận)</i></div>

            <div class="buyer-sign-box">
              <div class="buyer-seal-badge">
                ĐÃ KÝ XÁC NHẬN ĐIỆN TỬ<br/>
                <span style="font-size: 8pt; font-weight: normal;">Ngày ký: ${dateFormatted}</span>
              </div>
            </div>

            <div class="signature-name">${fullNameDisplay}</div>
            <div class="signed-badge signed-buyer">✓ Đã ký hợp đồng qua WebApp</div>
          </div>

          <div class="signature-box">
            <div class="signature-title">ĐẠI DIỆN GIAO DỊCH (BÊN A)</div>
            <div class="signature-role">TRƯỞNG BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO</div>
            <div class="signature-sub"><i>(Ký, đóng dấu xác thực điện tử)</i></div>

            <div class="stamp-container">
              <img class="stamp-img" src="${STAMP_BASE64}" alt="Con dấu Trưởng ban" />
            </div>

            <div class="signature-name">KS. NGUYỄN HOÀNG THIỆN</div>
            <div class="signed-badge signed-seller">✓ Đã ký & đóng dấu Trưởng ban</div>
          </div>
        </div>

        <div class="page-footer">
          <span>Hợp đồng điện tử dịch vụ phần mềm SYNAPES Studio — Khách hàng: ${fullNameDisplay}</span>
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
 * Đảm bảo 100% không bao giờ bị lỗi cắt ngang chữ khi chuyển trang hoặc mất chữ lề phải.
 */
export async function downloadPersonalizedContractPdf(data: UserRegistrationData): Promise<void> {
  const cleanName = (data.fullName || 'SYNAPES').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '');
  const filename = `HOP_DONG_DICH_VU_SYNAPES_${cleanName || 'KHACH_HANG'}.pdf`;

  const container = document.createElement('div');
  container.id = 'temp-pdf-contract-host';
  container.style.position = 'fixed';
  container.style.top = '0px';
  container.style.left = '0px';
  container.style.width = '794px';
  container.style.zIndex = '-99999';
  container.style.opacity = '1';
  container.style.backgroundColor = '#ffffff';
  container.style.pointerEvents = 'none';
  container.innerHTML = generateContractDocHtml(data);
  document.body.appendChild(container);

  // Chờ ảnh con dấu Base64 và font chữ sẵn sàng
  await new Promise((resolve) => setTimeout(resolve, 350));

  try {
    const page1El = container.querySelector('#pdf-page-1') as HTMLElement;
    const page2El = container.querySelector('#pdf-page-2') as HTMLElement;

    if (!page1El || !page2El) {
      throw new Error('Không tìm thấy cấu trúc trang hợp đồng PDF');
    }

    const canvasOptions = {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
    };

    const canvas1 = await html2canvas(page1El, canvasOptions);
    const canvas2 = await html2canvas(page2El, canvasOptions);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);
    const imgData2 = canvas2.toDataURL('image/jpeg', 0.98);

    // Trang 1 (khớp tuyệt đối 210mm x 297mm)
    pdf.addImage(imgData1, 'JPEG', 0, 0, 210, 297);

    // Trang 2 (khớp tuyệt đối 210mm x 297mm)
    pdf.addPage('a4', 'portrait');
    pdf.addImage(imgData2, 'JPEG', 0, 0, 210, 297);

    pdf.save(filename);
  } catch (err) {
    console.warn('Lỗi xuất PDF 2 trang, sử dụng phương thức in dự phòng:', err);
    printPersonalizedContractPdf(data);
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Tải xuống tệp PDF Master tổng quát đã được biên dịch chuẩn xác từ Typst
 */
export function downloadMasterPdfFile(clientName?: string): void {
  const link = document.createElement('a');
  link.href = '/documents/hop-dong-tong-quat.pdf';
  const cleanName = (clientName || 'SYNAPES').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
  link.download = `HOP_DONG_DICH_VU_SYNAPES_${cleanName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Cửa sổ in ấn hợp đồng chuẩn hệ thống
 */
export function printPersonalizedContractPdf(data: UserRegistrationData): void {
  const htmlContent = generateContractHtml(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }
}
