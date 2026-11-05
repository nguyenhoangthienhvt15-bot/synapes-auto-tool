import { UserRegistrationData } from '../types';

/**
 * Trình tạo văn bản Hợp Đồng Điện Tử Tổng Quát SYNAPES Studio
 * Kết hợp đầy đủ 4 đề mục pháp lý, thông tin đại diện hai bên và con dấu Trưởng ban.
 */

export function generateContractHtml(data: UserRegistrationData): string {
  const currentDate = new Date();
  const day = currentDate.getDate().toString().padStart(2, '0');
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const year = currentDate.getFullYear();
  const dateFormatted = `${day}/${month}/${year}`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Hợp Đồng Điện Tử Dịch Vụ SYNAPES Studio - ${data.fullName}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 20mm 18mm 25mm;
    }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 20px;
    }
    .header-grid {
      display: flex;
      justify-content: space-between;
      text-align: center;
      margin-bottom: 12px;
    }
    .header-left, .header-right {
      width: 48%;
    }
    .title-org {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0;
    }
    .title-sub {
      font-size: 9.5pt;
      font-weight: bold;
      margin: 1px 0;
    }
    .title-code {
      font-size: 8.5pt;
      margin-top: 2px;
    }
    .line-decor {
      width: 45%;
      height: 1px;
      background: #374151;
      margin: 2px auto;
    }
    .contract-title {
      text-align: center;
      margin: 16px 0 10px 0;
    }
    .contract-title h1 {
      font-size: 13.5pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0;
      color: #0f172a;
    }
    .contract-title h2 {
      font-size: 11.5pt;
      font-weight: bold;
      margin: 2px 0;
      color: #1e293b;
    }
    .contract-title p {
      font-size: 9.5pt;
      font-style: italic;
      margin: 1px 0;
      color: #475569;
    }
    .legal-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 8.5pt;
      line-height: 1.35;
      margin-bottom: 12px;
    }
    .legal-box b {
      font-size: 9pt;
      display: block;
      margin-bottom: 3px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      margin: 10px 0 4px 0;
      color: #0f172a;
    }
    .party-title {
      font-weight: bold;
      margin-top: 6px;
      margin-bottom: 2px;
      text-transform: uppercase;
      font-size: 10pt;
    }
    ul.party-info {
      list-style-type: none;
      padding-left: 0;
      margin: 0 0 6px 0;
      font-size: 10.5pt;
    }
    ul.party-info li {
      margin-bottom: 2px;
    }
    p {
      text-indent: 24px;
      margin: 4px 0;
      text-align: justify;
    }
    .signature-grid {
      display: flex;
      justify-content: space-between;
      margin-top: 25px;
      page-break-inside: avoid;
    }
    .signature-box {
      width: 48%;
      text-align: center;
      position: relative;
    }
    .signature-title {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 10.5pt;
      margin-bottom: 1px;
    }
    .signature-sub {
      font-style: italic;
      font-size: 9pt;
      color: #4b5563;
      margin-bottom: 40px;
    }
    .signature-sub-signed {
      font-style: italic;
      font-size: 9pt;
      color: #4b5563;
      margin-bottom: 10px;
    }
    .signature-name {
      font-weight: bold;
      font-size: 11.5pt;
      color: #0f172a;
      text-transform: uppercase;
    }
    .signed-badge {
      font-size: 9pt;
      font-style: italic;
      margin-top: 2px;
    }
    .signed-buyer {
      color: #15803d;
    }
    .signed-seller {
      color: #b91c1c;
    }
    .stamp-container {
      position: relative;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: -20px auto 5px auto;
    }
    .stamp-img {
      width: 140px;
      height: auto;
      transform: rotate(-3deg);
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- Header Quốc hiệu Tiêu ngữ -->
  <div class="header-grid">
    <div class="header-left">
      <div class="title-org">HỆ THỐNG CÔNG NGHỆ SYNAPES</div>
      <div class="title-sub">BAN CHUYỂN ĐỔI SỐ & AI</div>
      <div class="line-decor"></div>
      <div class="title-code">Số: 05/2026/HĐĐT-SYNAPES</div>
    </div>
    <div class="header-right">
      <div class="title-org">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
      <div class="title-sub">Độc lập - Tự do - Hạnh phúc</div>
      <div class="line-decor"></div>
      <div class="title-code"><i>Hà Nội, ngày ${day} tháng ${month} năm ${year}</i></div>
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
    Hôm nay, ngày ${dateFormatted}, tại Hệ thống Nền tảng Đám mây SYNAPES Studio, hai bên chúng tôi gồm:
  </p>

  <!-- Thông tin Bên A -->
  <div class="party-title">BÊN A: BÊN CUNG CẤP DỊCH VỤ NỀN TẢNG (SYNAPES STUDIO)</div>
  <ul class="party-info">
    <li>• <b>Đơn vị phát triển:</b> Nền tảng Tự động hóa Nội dung số SYNAPES Studio</li>
    <li>• <b>Đại diện giao dịch:</b> <b>KS. NGUYỄN HOÀNG THIỆN</b></li>
    <li>• <b>Chức vụ:</b> <b>Trưởng ban Chuyển đổi số & Trí tuệ nhân tạo</b></li>
    <li>• <b>Email chính thức:</b> nguyenhoangthien.hvt.15@gmail.com</li>
    <li>• <b>Hạ tầng cổng điện tử:</b> https://synapes-auto-tool.onrender.com</li>
  </ul>

  <!-- Thông tin Bên B -->
  <div class="party-title">BÊN B: BÊN MUA HÀNG VÀ SỬ DỤNG DỊCH VỤ (KHÁCH HÀNG)</div>
  <ul class="party-info">
    <li>• <b>Họ và tên:</b> <b>${data.fullName}</b></li>
    <li>• <b>Ngày tháng năm sinh:</b> ${data.dob} &nbsp;&nbsp;&nbsp;&nbsp; <b>Giới tính:</b> ${data.gender || 'Không cung cấp'}</li>
    <li>• <b>Số điện thoại:</b> ${data.phone}</li>
    <li>• <b>Gmail đăng ký:</b> ${data.email}</li>
    <li>• <b>Địa chỉ hiện tại:</b> ${data.address}</li>
  </ul>

  <p style="text-indent: 0; margin: 8px 0 4px 0;">
    Hai bên cùng thỏa thuận và thống nhất ký kết Hợp đồng điện tử này với các điều khoản cam kết chi tiết sau:
  </p>

  <div class="section-title">Điều 1. Quy chế cung cấp và sử dụng phần mềm SYNAPES Studio</div>
  <p>
    1.1. Bên A cấp quyền khai thác phần mềm dạng dịch vụ (SaaS) SYNAPES Auto Tool cho Bên B thông qua Mã Code định danh duy nhất (dạng <code>SNP_...</code>) và mật khẩu bảo mật sau khi hồ sơ được phê duyệt trên Bảng tính quản trị.
  </p>
  <p>
    1.2. Bên B được toàn quyền sử dụng các Module công nghệ bao gồm: Phân tích & sáng tạo kịch bản video AI (OpenAI GPT, Claude, Gemini, DeepSeek, Grok), chuyển văn bản thành giọng đọc (TTS), biên tập cắt ghép đa phân cảnh tự động (MultiClip Stitcher) và tích hợp API phát sóng đa kênh.
  </p>
  <p>
    1.3. Bên B cam kết quản lý an toàn thông tin đăng nhập, không can thiệp luồng mã nguồn (reverse-engineering), không khai thác lỗ hổng hoặc gửi yêu cầu dồn dập (DDoS) gây nghẽn tắc hệ thống máy chủ của Bên A.
  </p>

  <div class="section-title">Điều 2. Cam kết bảo mật dữ liệu cá nhân & an toàn Token API</div>
  <p>
    2.1. Tuân thủ nghiêm ngặt Nghị định số 13/2023/NĐ-CP, Bên A áp dụng chuẩn mã hóa quân sự AES-256-GCM đối với toàn bộ thông tin đăng ký và dữ liệu video của Bên B.
  </p>
  <p>
    2.2. Các khóa chứng thực API cá nhân (API Keys của AI Models, YouTube Data API, TikTok Posting API, Meta Graph API, Google Drive Refresh Token) được bảo vệ cô lập tại vùng nhớ mã hóa an toàn. Bên A cam kết tuyệt đối không chia sẻ, không chuyển giao và không thương mại hóa dữ liệu riêng tư của Bên B cho bất kỳ bên thứ ba nào.
  </p>

  <div class="section-title">Điều 3. Quyền sở hữu trí tuệ đối với kịch bản và sản phẩm video</div>
  <p>
    3.1. Căn cứ Luật Sở hữu trí tuệ năm 2005 (sửa đổi, bổ sung năm 2022) và Công ước Berne: Bên B là chủ sở hữu quyền tác giả duy nhất và toàn vẹn đối với mọi kịch bản văn học, tư liệu sáng tạo và sản phẩm video hoàn thiện được kết xuất từ hệ thống.
  </p>
  <p>
    3.2. Bên A không đòi hỏi bất kỳ quyền sở hữu, bản quyền thương mại hay quyền chia sẻ doanh thu nào từ các kênh phân phối và nội dung video do Bên B sáng tạo.
  </p>

  <div class="section-title">Điều 4. Cơ chế phê duyệt kiểm soát nội dung & Miễn trừ trách nhiệm</div>
  <p>
    4.1. <b>Cơ chế kiểm soát con người (Human-in-the-loop):</b> Phần mềm hoạt động theo quy chế phê duyệt bắt buộc; toàn bộ video chỉ được đưa vào hàng đợi đăng tải sau khi Bên B đã trực tiếp xem xét và chủ động bấm nút xác nhận phê duyệt xuất bản.
  </p>
  <p>
    4.2. Bên B cam kết tuân thủ Điều 8 và Điều 16 Luật An ninh mạng năm 2018 và Nghị định số 147/2024/NĐ-CP; tự chịu hoàn toàn trách nhiệm trước pháp luật về tính chân thực, bản quyền âm thanh hình ảnh và hậu quả pháp lý liên quan đến nội dung do mình phát tán lên các nền tảng mạng xã hội. Bên A được miễn trừ hoàn toàn trách nhiệm liên đới đối với các tranh chấp nội dung do Bên B gây ra.
  </p>

  <div class="section-title">Điều 5. Hiệu lực hợp đồng và phương thức thực hiện</div>
  <p>
    5.1. Hợp đồng điện tử này có giá trị pháp lý tương đương bản hợp đồng giấy theo Điều 13 và Điều 34 Luật Giao dịch điện tử số 20/2023/QH15, có hiệu lực kể từ thời điểm Bên B tích chọn chấp nhận và ký điện tử trên hệ thống WebApp.
  </p>
  <p>
    5.2. Dữ liệu đăng ký được lưu trữ chính thức tại Bảng tính quản trị <code>Thông tin người dùng</code> của hệ thống SYNAPES Studio và được kích hoạt cấp Mã Code, Mật khẩu gửi về hộp thư điện tử của Bên B sau khi Kỹ sư Bên A tích duyệt hồ sơ.
  </p>

  <!-- Phần chữ ký 2 bên -->
  <div class="signature-grid">
    <div class="signature-box">
      <div class="signature-title">ĐẠI DIỆN MUA HÀNG (BÊN B)</div>
      <div class="signature-sub"><i>(Ký, ghi rõ họ tên)</i></div>
      <div style="height: 55px;"></div>
      <div class="signature-name">${data.fullName}</div>
      <div class="signed-badge signed-buyer">✓ Đã ký điện tử xác thực qua WebApp</div>
    </div>

    <div class="signature-box">
      <div class="signature-title">ĐẠI DIỆN GIAO DỊCH (BÊN A)</div>
      <div style="font-size: 9.5pt; font-weight: bold; margin-bottom: 2px;">TRƯỞNG BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO</div>
      <div class="signature-sub-signed"><i>(Ký, đóng dấu điện tử)</i></div>

      <div class="stamp-container">
        <img class="stamp-img" src="/stamp-truong-ban.png" alt="Con dấu Trưởng ban" />
      </div>

      <div class="signature-name">KS. NGUYỄN HOÀNG THIỆN</div>
      <div class="signed-badge signed-seller">✓ Đã xác thực con dấu & ký điện tử</div>
    </div>
  </div>
</body>
</html>`;
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
 * Mở cửa sổ in ấn chuyên dụng để lưu thành tệp PDF hoàn chỉnh cá nhân hóa
 */
export function printPersonalizedContractPdf(data: UserRegistrationData): void {
  const html = generateContractHtml(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  }
}

