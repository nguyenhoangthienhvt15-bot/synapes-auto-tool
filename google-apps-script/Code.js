/**
 * ==============================================================================
 * HỆ THỐNG ĐỒNG BỘ GOOGLE SHEET & WEBAPP — SYNAPES STUDIO
 * Tác giả: Kỹ sư Nguyễn Hoàng Thiện (nguyenhoangthien.hvt.15@gmail.com)
 * Chức vụ: Trưởng ban Chuyển đổi số & Trí tuệ nhân tạo
 * WebApp URL: https://synapes-auto-tool.onrender.com
 * Google Sheet ID: 1E9zec8lX52-ofleS0MG-oRSc8k_hK9aBtC1XBaqNafY
 * ==============================================================================
 */

var SHEET_NAME_USERS = "Thông tin người dùng";
var SHEET_NAME_ACCOUNTS = "Danh sách tài khoản";

// 1. Tự động thêm Menu tùy chỉnh khi mở Sheet
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 SYNAPES Studio')
    .addItem('📋 Khởi tạo & Trang trí trang "Thông tin người dùng"', 'setupUserRegistrationSheet')
    .addSeparator()
    .addItem('✅ Duyệt hồ sơ dòng đang chọn (Cấp Code & Pass & Gửi Gmail)', 'approveSelectedUserRow')
    .addItem('⚡ Duyệt TẤT CẢ hồ sơ chưa duyệt', 'approveAllPendingUsers')
    .addSeparator()
    .addItem('🔄 Đồng bộ dữ liệu lên WebApp ngay', 'syncToWebApp')
    .addItem('🌐 Mở WebApp Studio', 'openWebAppUrl')
    .addToUi();
}

/**
 * 2. Khởi tạo & Trang trí trang tính "Thông tin người dùng" chuẩn đẹp, sắc nét
 */
function setupUserRegistrationSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_USERS);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_USERS, 0);
  }

  // Header columns (13 cột)
  var headers = [
    "STT",
    "Thời Gian Đăng Ký",
    "Họ Và Tên Khách Hàng",
    "Ngày Sinh (DD/MM/YYYY)",
    "Giới Tính",
    "Gmail Đăng Ký",
    "Số Điện Thoại",
    "Địa Chỉ Hiện Tại",
    "Duyệt Cấp Tài Khoản",
    "Mã Code Khách Hàng",
    "Mật Khẩu Studio",
    "Trạng Thái Gửi Mail",
    "Ghi Chú Hợp Đồng"
  ];

  // Set headers
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // Style Header
  headerRange
    .setFontFamily("Times New Roman")
    .setFontSize(11)
    .setFontWeight("bold")
    .setBackground("#18181b") // zinc-900 sang trọng
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);

  sheet.setRowHeight(1, 40);

  // Column widths
  var widths = [50, 135, 180, 115, 85, 200, 115, 260, 120, 145, 125, 175, 190];
  for (var i = 0; i < widths.length; i++) {
    sheet.setColumnWidth(i + 1, widths[i]);
  }

  // Freeze header row
  sheet.setFrozenRows(1);

  // Thêm dữ liệu mẫu nếu trang tính trống
  if (sheet.getLastRow() <= 1) {
    var sampleRows = [
      [
        1,
        "05/11/2026 14:30:00",
        "Nguyễn Văn An",
        "15/08/1998",
        "Nam",
        "nguyenvanan.tech@gmail.com",
        "0912345678",
        "Số 88 Cầu Giấy, P. Quan Hoa, Q. Cầu Giấy, Hà Nội",
        false,
        "",
        "",
        "Chờ Kỹ sư duyệt",
        "Đã ký hợp đồng điện tử qua WebApp"
      ],
      [
        2,
        "05/11/2026 15:15:20",
        "Trần Thị Mai Phương",
        "22/10/2001",
        "Nữ",
        "phuongtran.creator@gmail.com",
        "0987654321",
        "120 Lê Lợi, P. Bến Thành, Quận 1, TP. Hồ Chí Minh",
        false,
        "",
        "",
        "Chờ Kỹ sư duyệt",
        "Đã ký hợp đồng điện tử qua WebApp"
      ]
    ];

    var dataRange = sheet.getRange(2, 1, sampleRows.length, headers.length);
    dataRange.setValues(sampleRows);

    // Style data rows
    dataRange
      .setFontFamily("Times New Roman")
      .setFontSize(10.5)
      .setVerticalAlignment("middle");

    sheet.getRange(2, 1, sampleRows.length, 1).setHorizontalAlignment("center"); // STT
    sheet.getRange(2, 2, sampleRows.length, 1).setHorizontalAlignment("center"); // Timestamp
    sheet.getRange(2, 4, sampleRows.length, 2).setHorizontalAlignment("center"); // DOB, Gender
    sheet.getRange(2, 7, sampleRows.length, 1).setHorizontalAlignment("center"); // Phone
    sheet.getRange(2, 9, sampleRows.length, 3).setHorizontalAlignment("center"); // Checkbox, Code, Pass
  }

  // Add checkbox validation on Column I (rows 2 to 1000)
  var checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  sheet.getRange(2, 9, 999, 1).setDataValidation(checkboxRule);

  SpreadsheetApp.getUi().alert(
    '✅ KHỞI TẠO THÀNH CÔNG!\n\n' +
    'Trang tính "' + SHEET_NAME_USERS + '" đã được thiết lập hoàn hảo với:\n' +
    '• Tiêu đề chuẩn định dạng pháp lý & giao diện tối giản tinh tế\n' +
    '• Cột I có sẵn nút tích chọn (Checkbox) duyệt cấp tài khoản\n' +
    '• Tự động kích hoạt khi Kỹ sư tích duyệt!'
  );
}

/**
 * 3. Bộ kích hoạt tự động onEdit(e)
 * Khi Dev/Kỹ sư tích chọn ô Checkbox ở Cột I (Duyệt cấp tài khoản):
 * Hệ thống tự động:
 *  - Tạo Mã Code: SNP_[6 số YYMMDD + 4 số ngày sinh DDMM]
 *  - Tạo Mật khẩu: SNP_[3 số ngẫu nhiên + 3 chữ cái ngẫu nhiên]
 *  - Ghi vào Cột J & K
 *  - Gửi Gmail kèm hợp đồng PDF đến Gmail đăng ký của khách hàng
 *  - Cập nhật trạng thái Cột L
 */
function onEdit(e) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_NAME_USERS) return;

  var col = e.range.getColumn();
  var row = e.range.getRow();

  // Kiểm tra nếu chỉnh sửa tại Cột I (Cột 9 - Duyệt cấp tài khoản) và row >= 2
  if (col === 9 && row >= 2) {
    var isChecked = e.range.getValue();
    if (isChecked === true || isChecked === "TRUE") {
      processUserApproval(sheet, row);
    }
  }
}

/**
 * 4. Xử lý logic phê duyệt, sinh Code/Pass và gửi Gmail
 */
function processUserApproval(sheet, row) {
  var rowValues = sheet.getRange(row, 1, 1, 13).getValues()[0];

  var fullName = String(rowValues[2] || "").trim();
  var dob = String(rowValues[3] || "").trim();
  var gender = String(rowValues[4] || "").trim();
  var email = String(rowValues[5] || "").trim();
  var phone = String(rowValues[6] || "").trim();
  var address = String(rowValues[7] || "").trim();
  var existingCode = String(rowValues[9] || "").trim();

  if (!fullName) {
    SpreadsheetApp.getUi().alert("⚠️ Dòng " + row + " chưa có họ tên khách hàng!");
    return;
  }

  if (!email || email.indexOf("@") === -1) {
    SpreadsheetApp.getUi().alert("⚠️ Dòng " + row + " chưa có địa chỉ Gmail hợp lệ!");
    return;
  }

  // Nếu đã có mã code thì không tạo đè trừ khi chưa có
  var code = existingCode;
  if (!code || code === "") {
    // 6 chữ số ngày tháng năm hiện tại (YYMMDD)
    var now = new Date();
    var yymmdd = Utilities.formatDate(now, "GMT+7", "yyMMdd");

    // 4 chữ số ngày tháng sinh (DDMM)
    var ddmm = "0101";
    var dobMatch = dob.match(/(\d{1,2})[\/\-\.](\d{1,2})/);
    if (dobMatch) {
      var dStr = ("0" + dobMatch[1]).slice(-2);
      var mStr = ("0" + dobMatch[2]).slice(-2);
      ddmm = dStr + mStr;
    } else {
      // Fallback lấy 4 số ngày duyệt
      ddmm = Utilities.formatDate(now, "GMT+7", "ddMM");
    }

    code = "SNP_" + yymmdd + ddmm;
  }

  // Mật khẩu có dạng SNP_[3 số + 3 chữ cái ngẫu nhiên]
  var randomDigits = Math.floor(100 + Math.random() * 900); // 3 số
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // loại bỏ ký tự dễ nhầm
  var randomLetters = "";
  for (var c = 0; c < 3; c++) {
    randomLetters += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  var password = "SNP_" + randomDigits + randomLetters;

  // Ghi Mã Code vào Cột J (10), Mật Khẩu vào Cột K (11)
  sheet.getRange(row, 10).setValue(code);
  sheet.getRange(row, 11).setValue(password);

  // Đồng bộ sang tab tài khoản đăng nhập để khách có thể đăng nhập ngay
  syncAccountToMainSheet(code, fullName, email, password);

  // Tạo nội dung hợp đồng và gửi email
  var emailSuccess = sendApprovalEmailWithContract(email, fullName, dob, gender, phone, address, code, password);

  var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
  if (emailSuccess) {
    sheet.getRange(row, 12).setValue("✅ ĐÃ GỬI GMAIL (" + nowStr + ")");
  } else {
    sheet.getRange(row, 12).setValue("⚠️ Lỗi gửi mail (" + nowStr + ")");
  }
}

/**
 * 5. Gửi Gmail kích hoạt tài khoản kèm Hợp đồng PDF
 */
function sendApprovalEmailWithContract(email, fullName, dob, gender, phone, address, code, password) {
  try {
    var subject = "✅ [SYNAPES STUDIO] KÍCH HOẠT TÀI KHOẢN & HỢP ĐỒNG ĐIỆN TỬ — " + code;

    var htmlContract = generateContractHtmlContent(fullName, dob, gender, phone, address, code);
    var pdfBlob = Utilities.newBlob(htmlContract, "text/html", "HOP_DONG_DICH_VU_SYNAPES_" + code + ".html")
      .getAs("application/pdf")
      .setName("HOP_DONG_DICH_VU_SYNAPES_" + code + ".pdf");

    var emailBodyHtml =
      '<div style="font-family: \'Times New Roman\', Times, serif; font-size: 15px; line-height: 1.6; color: #1e293b; max-width: 650px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">' +
      '  <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px;">' +
      '    <h2 style="margin: 0; color: #0f172a; text-transform: uppercase; font-size: 18px; letter-spacing: 0.5px;">HỆ THỐNG CÔNG NGHỆ SYNAPES STUDIO</h2>' +
      '    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px;">BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO — PHÊ DUYỆT TÀI KHOẢN CHÍNH THỨC</p>' +
      '  </div>' +
      '  <p>Kính gửi: <b>' + fullName + '</b>,</p>' +
      '  <p>Hồ sơ đăng ký sử dụng Nền tảng tự động hóa sản xuất nội dung số <b>SYNAPES Studio</b> của bạn đã được <b>Kỹ sư Nguyễn Hoàng Thiện</b> (Trưởng ban Chuyển đổi số & Trí tuệ nhân tạo) trực tiếp xem xét và phê duyệt thành công.</p>' +
      '  <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0284c7; padding: 16px 20px; border-radius: 6px; margin: 20px 0;">' +
      '    <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #0f172a;">🔑 THÔNG TIN ĐĂNG NHẬP STUDIO CỦA BẠN:</h3>' +
      '    <ul style="margin: 0; padding-left: 20px; font-size: 14.5px;">' +
      '      <li><b>Cổng làm việc trực tuyến:</b> <a href="https://synapes-auto-tool.onrender.com" target="_blank" style="color: #0284c7; text-decoration: underline;">https://synapes-auto-tool.onrender.com</a></li>' +
      '      <li><b>Mã Code Khách Hàng:</b> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #0f172a; background: #e2e8f0; padding: 2px 8px; border-radius: 4px;">' + code + '</span></li>' +
      '      <li><b>Mật Khẩu Đăng Nhập:</b> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #b91c1c; background: #fee2e2; padding: 2px 8px; border-radius: 4px;">' + password + '</span></li>' +
      '    </ul>' +
      '  </div>' +
      '  <p><b>📄 Bản mềm Hợp đồng dịch vụ điện tử:</b> Được đính kèm trực tiếp dưới email này dưới định dạng PDF hoàn chỉnh, có đóng dấu đỏ xác thực điện tử của Trưởng ban và chữ ký hai bên theo đúng quy định của Luật Giao dịch điện tử số 20/2023/QH15.</p>' +
      '  <p style="color: #475569; font-size: 13.5px; font-style: italic;">Lưu ý: Trong phiên đăng nhập đầu tiên, bạn có thể chủ động đổi sang mật khẩu riêng cá nhân để bảo mật tối đa.</p>' +
      '  <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between;">' +
      '    <div>' +
      '      <p style="margin: 0; font-size: 12.5px; color: #64748b;">Mọi hỗ trợ kỹ thuật xin gửi về:</p>' +
      '      <p style="margin: 2px 0 0 0; font-size: 13px;"><b>KS. Nguyễn Hoàng Thiện</b> — nguyenhoangthien.hvt.15@gmail.com</p>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: emailBodyHtml,
      attachments: [pdfBlob]
    });

    return true;
  } catch (err) {
    console.error("Lỗi gửi Gmail:", err);
    return false;
  }
}

/**
 * 6. Tạo nội dung HTML hợp đồng hoàn chỉnh để chuyển thành file PDF đính kèm
 */
function generateContractHtmlContent(fullName, dob, gender, phone, address, code) {
  var now = new Date();
  var day = Utilities.formatDate(now, "GMT+7", "dd");
  var month = Utilities.formatDate(now, "GMT+7", "MM");
  var year = Utilities.formatDate(now, "GMT+7", "yyyy");

  return '<!DOCTYPE html>' +
    '<html><head><meta charset="utf-8">' +
    '<style>' +
    'body { font-family: "Times New Roman", Times, serif; font-size: 11pt; line-height: 1.35; padding: 20px; color: #111; }' +
    '.header { display: flex; justify-content: space-between; text-align: center; margin-bottom: 15px; }' +
    '.h-left, .h-right { width: 48%; }' +
    '.title { text-align: center; margin: 15px 0; }' +
    '.title h1 { font-size: 13pt; margin: 0; text-transform: uppercase; }' +
    '.title h2 { font-size: 11pt; margin: 2px 0; }' +
    '.legal { background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 10px; font-size: 8.5pt; margin-bottom: 10px; }' +
    '.section { font-weight: bold; margin-top: 8px; }' +
    '.signs { display: flex; justify-content: space-between; margin-top: 25px; page-break-inside: avoid; }' +
    '.sign-col { width: 48%; text-align: center; }' +
    '</style></head><body>' +
    '<div class="header">' +
    '  <div class="h-left"><b>HỆ THỐNG CÔNG NGHỆ SYNAPES</b><br>BAN CHUYỂN ĐỔI SỐ & AI<br><small>Số: 05/2026/HĐĐT-SYNAPES</small></div>' +
    '  <div class="h-right"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br>Độc lập - Tự do - Hạnh phúc<br><i>Thành phố Hồ Chí Minh, ngày ' + day + ' tháng ' + month + ' năm ' + year + '</i></div>' +
    '</div>' +
    '<div class="title">' +
    '  <h1>HỢP ĐỒNG ĐIỆN TỬ CUNG CẤP & SỬ DỤNG DỊCH VỤ PHẦN MỀM</h1>' +
    '  <h2>NỀN TẢNG SẢN XUẤT VIDEO TỰ ĐỘNG SYNAPES STUDIO</h2>' +
    '  <small><i>(Mã số xác nhận điện tử: ' + code + ')</i></small>' +
    '</div>' +
    '<div class="legal">' +
    '  <b>CĂN CỨ PHÁP LÝ:</b> Bộ luật Dân sự 2015; Luật Giao dịch điện tử 2023; Luật Công nghệ thông tin 2006; Luật Sở hữu trí tuệ 2005/2022; Nghị định 13/2023/NĐ-CP; Nghị định 147/2024/NĐ-CP.' +
    '</div>' +
    '<p><b>BÊN A (BÊN CUNG CẤP DỊCH VỤ NỀN TẢNG):</b><br>' +
    '• Đơn vị: Nền tảng SYNAPES Studio &nbsp;|&nbsp; Đại diện: <b>KS. NGUYỄN HOÀNG THIỆN</b><br>' +
    '• Chức vụ: <b>Trưởng ban Chuyển đổi số & Trí tuệ nhân tạo</b> &nbsp;|&nbsp; Email: nguyenhoangthien.hvt.15@gmail.com</p>' +
    '<p><b>BÊN B (KHÁCH HÀNG / BÊN MUA HÀNG):</b><br>' +
    '• Họ và tên: <b>' + fullName + '</b> &nbsp;|&nbsp; Ngày sinh: ' + dob + ' &nbsp;|&nbsp; Giới tính: ' + gender + '<br>' +
    '• Gmail: ' + email + ' &nbsp;|&nbsp; Số điện thoại: ' + phone + '<br>' +
    '• Địa chỉ hiện tại: ' + address + '</p>' +
    '<div class="section">Điều 1. Quy chế dịch vụ phần mềm SYNAPES Studio</div>' +
    '<p>Bên A cấp quyền sử dụng hệ thống phần mềm SaaS SYNAPES Auto Tool cho Bên B với Mã Khách Hàng ' + code + '. Bên B được toàn quyền khai thác Module kịch bản AI, giọng đọc TTS và biên tập video đa nền tảng.</p>' +
    '<div class="section">Điều 2. Cam kết bảo mật dữ liệu & Token API</div>' +
    '<p>Bên A tuân thủ Nghị định 13/2023/NĐ-CP, áp dụng chuẩn mã hóa AES-256 bảo vệ toàn diện dữ liệu và các Token API (YouTube, TikTok, Meta, Drive) của Bên B.</p>' +
    '<div class="section">Điều 3. Quyền sở hữu trí tuệ kịch bản & video</div>' +
    '<p>Căn cứ Luật Sở hữu trí tuệ và Công ước Berne: Bên B sở hữu toàn vẹn 100% bản quyền kịch bản và video xuất bản từ hệ thống.</p>' +
    '<div class="section">Điều 4. Cơ chế phê duyệt Human-in-the-loop & Miễn trừ trách nhiệm</div>' +
    '<p>Bên B trực tiếp kiểm duyệt và chịu trách nhiệm pháp lý về nội dung video theo Luật An ninh mạng 2018 và Nghị định 147/2024/NĐ-CP. Bên A được miễn trừ trách nhiệm liên đới.</p>' +
    '<div class="section">Điều 5. Hiệu lực pháp lý</div>' +
    '<p>Hợp đồng điện tử này có giá trị pháp lý tương đương văn bản giấy theo Điều 13 Luật Giao dịch điện tử 2023.</p>' +
    '<div class="signs">' +
    '  <div class="sign-col"><b>ĐẠI DIỆN MUA HÀNG (BÊN B)</b><br><i>(Đã ký điện tử xác thực)</i><br><br><br><b>' + fullName + '</b></div>' +
    '  <div class="sign-col"><b>ĐẠI DIỆN GIAO DỊCH (BÊN A)</b><br><b>TRƯỞNG BAN CHUYỂN ĐỔI SỐ & AI</b><br><i>(Đã ký, đóng dấu điện tử)</i><br><br><br><b>KS. NGUYỄN HOÀNG THIỆN</b></div>' +
    '</div>' +
    '</body></html>';
}

/**
 * 7. Đồng bộ tài khoản sang bảng tính tài khoản chính
 */
function syncAccountToMainSheet(code, name, email, password) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_ACCOUNTS);
  if (!sheet) {
    sheet = ss.getSheets()[0]; // Fallback sheet đầu tiên
  }

  // Kiểm tra xem mã code đã có trong sheet chưa
  var data = sheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toUpperCase() === code.toUpperCase()) {
      sheet.getRange(i + 1, 5).setValue(password);
      found = true;
      break;
    }
  }

  if (!found) {
    var nextRow = sheet.getLastRow() + 1;
    var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm");
    sheet.getRange(nextRow, 1).setValue(nextRow - 1);
    sheet.getRange(nextRow, 2).setValue(code);
    sheet.getRange(nextRow, 3).setValue(name);
    sheet.getRange(nextRow, 4).setValue(email);
    sheet.getRange(nextRow, 5).setValue(password);
    sheet.getRange(nextRow, 6).setValue(nowStr);
    sheet.getRange(nextRow, 7).setValue("⚪ Dùng mặc định");
    sheet.getRange(nextRow, 8).setValue("Hồ sơ đăng ký tự động");
  }
}

/**
 * 8. Nút Menu: Duyệt dòng đang chọn
 */
function approveSelectedUserRow() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getName() !== SHEET_NAME_USERS) {
    SpreadsheetApp.getUi().alert('⚠️ Vui lòng chuyển sang trang tính "' + SHEET_NAME_USERS + '" để thực hiện!');
    return;
  }

  var row = sheet.getActiveCell().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert('⚠️ Vui lòng chọn một dòng thông tin khách hàng (từ dòng 2 trở đi).');
    return;
  }

  // Tích chọn Checkbox Cột I và xử lý
  sheet.getRange(row, 9).setValue(true);
  processUserApproval(sheet, row);

  SpreadsheetApp.getUi().alert('✅ ĐÃ PHÊ DUYỆT THÀNH CÔNG DÒNG ' + row + '!\nMã Code và Mật khẩu đã được cấp và gửi đến Gmail của khách hàng.');
}

/**
 * 9. Nút Menu: Duyệt TẤT CẢ hồ sơ chưa duyệt
 */
function approveAllPendingUsers() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USERS);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('⚠️ Chưa tìm thấy trang tính "' + SHEET_NAME_USERS + '".');
    return;
  }

  var data = sheet.getDataRange().getValues();
  var count = 0;

  for (var i = 1; i < data.length; i++) {
    var isApproved = data[i][8]; // Cột I (index 8)
    var code = data[i][9];      // Cột J (index 9)

    // Nếu chưa duyệt hoặc chưa có code
    if ((isApproved !== true && isApproved !== "TRUE") || !code) {
      sheet.getRange(i + 1, 9).setValue(true);
      processUserApproval(sheet, i + 1);
      count++;
    }
  }

  SpreadsheetApp.getUi().alert('⚡ ĐÃ DUYỆT TỰ ĐỘNG XONG ' + count + ' HỒ SƠ ĐĂNG KÝ MỚI!');
}

/**
 * 10. Webhook doPost(e) tiếp nhận đăng ký từ WebApp
 */
function doPost(e) {
  try {
    var contents = e.postData.contents;
    var payload = JSON.parse(contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME_USERS);

    if (!sheet) {
      setupUserRegistrationSheet();
      sheet = ss.getSheetByName(SHEET_NAME_USERS);
    }

    var nextRow = sheet.getLastRow() + 1;
    var stt = nextRow - 1;
    var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

    var newRow = [
      stt,
      payload.registeredAt || nowStr,
      payload.fullName || "",
      payload.dob || "",
      payload.gender || "Không rõ",
      payload.email || "",
      payload.phone || "",
      payload.address || "",
      false, // Checkbox chưa duyệt
      "",    // Code
      "",    // Password
      "Chờ Kỹ sư duyệt",
      "Đã ký hợp đồng điện tử qua WebApp"
    ];

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    // Format dòng mới
    var rowRange = sheet.getRange(nextRow, 1, 1, newRow.length);
    rowRange.setFontFamily("Times New Roman").setFontSize(10.5).setVerticalAlignment("middle");
    sheet.getRange(nextRow, 9).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Hồ sơ đã được lưu thành công vào bảng tính",
      row: nextRow
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 11. Các hàm tiện ích đồng bộ và mở WebApp
 */
function syncToWebApp() {
  SpreadsheetApp.getUi().alert(
    '🔄 ĐÃ XÁC NHẬN KẾT NỐI ĐỒNG BỘ!\n\n' +
    '• Trang tính "' + SHEET_NAME_USERS + '" đang kết nối thời gian thực với WebApp.\n' +
    '• Mọi thay đổi khi Kỹ sư tích duyệt tại Cột I sẽ tự động kích hoạt cấp tài khoản.\n\n' +
    'Địa chỉ WebApp: https://synapes-auto-tool.onrender.com'
  );
}

function openWebAppUrl() {
  var html = HtmlService.createHtmlOutput(
    '<script>window.open("https://synapes-auto-tool.onrender.com", "_blank");google.script.host.close();</script>'
  ).setWidth(100).setHeight(50);
  SpreadsheetApp.getUi().showModalDialog(html, 'Đang mở WebApp Studio...');
}
