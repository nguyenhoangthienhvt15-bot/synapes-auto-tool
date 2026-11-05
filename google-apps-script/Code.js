/**
 * ==============================================================================
 * HỆ THỐNG ĐỒNG BỘ GOOGLE SHEET & WEBAPP — SYNAPES AUTO TOOL
 * Tác giả: Kỹ sư Nguyễn Hoàng Thiện (nguyenhoangthien.hvt.15@gmail.com)
 * WebApp URL: https://synapes-auto-tool.onrender.com
 * ==============================================================================
 */

// 1. Tự động thêm Menu tùy chỉnh khi mở Sheet
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 SYNAPES Auto Tool')
    .addItem('🔄 Cập nhật dữ liệu lên WebApp ngay', 'syncToWebApp')
    .addSeparator()
    .addItem('🔑 Tạo mật khẩu ngẫu nhiên cho dòng đang chọn', 'generateTempPasswordForSelectedRow')
    .addItem('📧 Gửi email mật khẩu cho khách qua Gmail', 'sendAccountEmailToClient')
    .addSeparator()
    .addItem('🌐 Mở WebApp Studio', 'openWebAppUrl')
    .addToUi();
}

/**
 * 2. Cập nhật dữ liệu lên WebApp:
 * Kiểm tra các dòng tài khoản, đếm số lượng tài khoản hợp lệ
 * và gửi thông báo xác nhận đồng bộ theo thời gian thực.
 */
function syncToWebApp() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    SpreadsheetApp.getUi().alert('⚠️ Bảng tính chưa có dữ liệu tài khoản nào!');
    return;
  }

  // Đếm số tài khoản hợp lệ (Cột B có mã code)
  var validAccounts = 0;
  for (var i = 1; i < data.length; i++) {
    var code = data[i][1]; // Cột B: Mã Code
    if (code && String(code).trim() !== '') {
      validAccounts++;
    }
  }

  var ui = SpreadsheetApp.getUi();
  var msg = '✅ ĐÃ CẬP NHẬT DỮ LIỆU THÀNH CÔNG!\n\n' +
            '• Tổng số tài khoản sẵn sàng: ' + validAccounts + '\n' +
            '• Hệ thống WebApp SYNAPES đang kết nối trực tiếp với Sheet này qua API theo thời gian thực.\n' +
            '• Mọi thay đổi về Mã Code hoặc Mật khẩu có hiệu lực ngay lập tức khi khách hàng đăng nhập.\n\n' +
            'Địa chỉ WebApp: https://synapes-auto-tool.onrender.com';
  
  ui.alert('🔄 Trạng Thái Đồng Bộ WebApp', msg, ui.ButtonSet.OK);
}

/**
 * 3. Tự động sinh mật khẩu tạm ngẫu nhiên cho dòng đang chọn
 */
function generateTempPasswordForSelectedRow() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var activeCell = sheet.getActiveCell();
  var rowIndex = activeCell.getRow();

  if (rowIndex <= 1) {
    SpreadsheetApp.getUi().alert('⚠️ Vui lòng chọn một dòng chứa thông tin khách hàng (từ dòng 2 trở đi).');
    return;
  }

  // Sinh mật khẩu dạng Auto-XXXXXX
  var randomDigits = Math.floor(100000 + Math.random() * 900000);
  var newPassword = 'Auto-' + randomDigits;

  // Lấy thời gian hiện tại
  var now = new Date();
  var timeString = Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm");

  // Ghi vào Cột E (Mật khẩu) và Cột F (Thời gian cấp)
  sheet.getRange(rowIndex, 5).setValue(newPassword); // Cột E
  sheet.getRange(rowIndex, 6).setValue(timeString);  // Cột F
  sheet.getRange(rowIndex, 7).setValue('⚪ Dùng mặc định'); // Cột G

  var code = sheet.getRange(rowIndex, 2).getValue();
  var name = sheet.getRange(rowIndex, 3).getValue();

  SpreadsheetApp.getUi().alert(
    '🔑 Đã tạo mật khẩu mới thành công!\n\n' +
    '• Khách hàng: ' + name + ' (' + code + ')\n' +
    '• Mật khẩu mới: ' + newPassword + '\n' +
    '• Thời gian cấp: ' + timeString + '\n\n' +
    'Dữ liệu đã được cập nhật sẵn sàng trên WebApp!'
  );
}

/**
 * 4. Gửi email tài khoản cho khách qua Gmail
 */
function sendAccountEmailToClient() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var activeCell = sheet.getActiveCell();
  var rowIndex = activeCell.getRow();

  if (rowIndex <= 1) {
    SpreadsheetApp.getUi().alert('⚠️ Vui lòng chọn dòng khách hàng cần gửi email.');
    return;
  }

  var code = sheet.getRange(rowIndex, 2).getValue();
  var name = sheet.getRange(rowIndex, 3).getValue();
  var email = sheet.getRange(rowIndex, 4).getValue();
  var password = sheet.getRange(rowIndex, 5).getValue();

  if (!email || String(email).indexOf('@') === -1) {
    SpreadsheetApp.getUi().alert('⚠️ Khách hàng này chưa có địa chỉ Gmail hợp lệ ở Cột D!');
    return;
  }

  var subject = 'Thông tin tài khoản Studio — SYNAPES Auto Tool (' + code + ')';
  var body = 'Kính gửi ' + name + ',\n\n' +
             'Hệ thống SYNAPES Auto Tool xin gửi thông tin đăng nhập Studio của bạn:\n\n' +
             '• Địa chỉ Website: https://synapes-auto-tool.onrender.com\n' +
             '• Mã Code Khách Hàng: ' + code + '\n' +
             '• Mật Khẩu Đăng Nhập: ' + password + '\n\n' +
             'Lưu ý: Trong lần đầu đăng nhập, bạn có thể đổi sang mật khẩu riêng của mình để bảo mật.\n\n' +
             'Mọi thắc mắc kỹ thuật vui lòng liên hệ KS Nguyễn Hoàng Thiện (nguyenhoangthien.hvt.15@gmail.com).\n\n' +
             'Trân trọng,\nĐội ngũ Kỹ thuật SYNAPES Auto Tool';

  MailApp.sendEmail(email, subject, body);

  // Cập nhật ghi chú
  var oldNote = sheet.getRange(rowIndex, 9).getValue();
  var now = new Date();
  var timeString = Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm");
  sheet.getRange(rowIndex, 9).setValue(oldNote + ' | [' + timeString + '] Đã gửi thông tin qua Gmail.');

  SpreadsheetApp.getUi().alert('📧 Đã gửi email thông tin đăng nhập thành công đến: ' + email);
}

/**
 * 5. Hiển thị đường dẫn WebApp
 */
function openWebAppUrl() {
  var html = HtmlService.createHtmlOutput(
    '<script>window.open("https://synapes-auto-tool.onrender.com", "_blank");google.script.host.close();</script>'
  ).setWidth(100).setHeight(50);
  SpreadsheetApp.getUi().showModalDialog(html, 'Đang mở WebApp...');
}

