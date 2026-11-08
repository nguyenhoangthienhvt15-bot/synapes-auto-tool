/**
 * ==============================================================================
 * BUILD SCRIPT: GENERATE SYNAPES STUDIO GOOGLE APPS SCRIPT CODE
 * Đồng bộ toàn diện:
 * 1. google-apps-script/Code.js
 * 2. src/components/Code.js
 * 3. src/data/appsScriptCode.ts
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 1. Đọc dữ liệu Con Dấu Đỏ Tròn và VietQR Timo từ file nguồn
const stampContent = fs.readFileSync(path.join(ROOT, 'src', 'data', 'stampBase64.ts'), 'utf8');
const stampMatch = stampContent.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/);
if (!stampMatch) {
  throw new Error('Không tìm thấy ROUND_STAMP_BASE64 hợp lệ trong src/data/stampBase64.ts');
}
const ROUND_STAMP_BASE64 = stampMatch[0];

const qrContent = fs.readFileSync(path.join(ROOT, 'src', 'data', 'qrCodeBase64.ts'), 'utf8');
const qrMatch = qrContent.match(/data:image\/jpeg;base64,[A-Za-z0-9+/=]+/);
if (!qrMatch) {
  throw new Error('Không tìm thấy QR_CODE_BASE64 hợp lệ trong src/data/qrCodeBase64.ts');
}
const TIMO_QR_CODE_BASE64 = qrMatch[0];

console.log('✅ Đã nạp thành công Con dấu đỏ tròn (' + ROUND_STAMP_BASE64.length + ' chars) và QR Code Timo (' + TIMO_QR_CODE_BASE64.length + ' chars)');

// 2. Định nghĩa toàn bộ mã nguồn Google Apps Script đồng bộ 20 cột và 2 phân hệ hợp đồng
const gasCode = `/**
 * ==============================================================================
 * HỆ THỐNG ĐỒNG BỘ GOOGLE SHEET & WEBAPP — SYNAPES STUDIO
 * Tác giả: Kỹ sư Nguyễn Hoàng Thiện (nguyenhoangthien.hvt.15@gmail.com)
 * Chức vụ: Trưởng ban Chuyển đổi số & Trí tuệ nhân tạo
 * WebApp URL: https://synapes-auto-tool-web-service.onrender.com
 * Google Sheet ID: 1E9zec8lX52-ofleS0MG-oRSc8k_hK9aBtC1XBaqNafY
 * ==============================================================================
 */

var SHEET_NAME_USERS = "THÔNG TIN NGƯỜI DÙNG";
var SHEET_NAME_ACCOUNTS = "Quản Lý Mật Khẩu";
var GID_USERS = 2096171544;
var GID_ACCOUNTS = 0;

var QUOTE_TRUONG_BAN = "...Chúng ta đặt câu hỏi cho mọi vấn đề có thể và chúng ta sẽ đưa ra giải pháp có thể và hơn cả là tốt nhất. Mỗi khách hàng là một câu hỏi quý và mỗi giờ phút làm việc của chúng ta là một giải pháp quý...";

var TIMO_BANK_INFO = {
  bankName: "Timo Digital Bank by BVBank",
  accountNumber: "0983396354",
  accountHolder: "NGUYEN HOANG THIEN"
};

/**
 * CON DẤU ĐỎ TRÒN TRƯỞNG BAN NGUYỄN HOÀNG THIỆN (BASE64 TÁCH NỀN TRONG SUỐT)
 */
var ROUND_STAMP_BASE64 = "${ROUND_STAMP_BASE64}";

/**
 * ẢNH MÃ QR CODE CHUYỂN KHOẢN VIETQR TIMO (NGUYEN HOANG THIEN - 0983396354)
 */
var TIMO_QR_CODE_BASE64 = "${TIMO_QR_CODE_BASE64}";

/**
 * NÂNG CẤP BẢNG TÍNH 13 CỘT SANG 20 CỘT CHUẨN TOÀN DIỆN (BẢO TOÀN 100% DỮ LIỆU)
 * Chuyển đổi chính xác các cột cũ, bảo lưu hồ sơ khách hàng, phân loại gói và tạo 2 cấp checkbox
 */
function upgradeLegacySheetTo20Cols(sheet) {
  if (!sheet) return;
  var col4Header = String(sheet.getRange(1, 4).getValue() || "").toLowerCase();
  var isAlready20 = (col4Header.indexOf("cccd") !== -1 || col4Header.indexOf("cmnd") !== -1);
  if (isAlready20) return;

  var lastRow = sheet.getLastRow();
  var numRows = Math.max(lastRow - 1, 0);

  var oldRows = [];
  if (numRows > 0) {
    oldRows = sheet.getRange(2, 1, numRows, Math.max(sheet.getLastColumn(), 13)).getValues();
  }

  // 20 Cột Chuẩn Toàn Diện
  var headers = [
    "STT",
    "Thời Gian Đăng Ký",
    "Họ Và Tên Khách Hàng",
    "Số CCCD / CMND",
    "Ngày Sinh (DD/MM/YYYY)",
    "Giới Tính",
    "Gmail Đăng Ký",
    "Số Điện Thoại",
    "Địa Chỉ Hiện Tại",
    "Loại Hợp Đồng",
    "Gói Ký Kết",
    "Tiền Đặt Cọc (VNĐ)",
    "Tổng Giá Trị (VNĐ)",
    "Hạn Bàn Giao (Số Ngày)",
    "Duyệt Ký Lần 1",
    "Mã Code Khách Hàng",
    "Mật Khẩu Studio",
    "Duyệt Bàn Giao Lần 2",
    "Trạng Thái Gửi Mail",
    "Ghi Chú Hợp Đồng"
  ];

  sheet.getRange(1, 1, 1, headers.length).clearDataValidations();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontFamily("Times New Roman")
    .setFontSize(11)
    .setFontWeight("bold")
    .setBackground("#18181b")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);
  sheet.setRowHeight(1, 42);

  var widths = [50, 140, 185, 130, 120, 85, 210, 120, 240, 150, 190, 130, 130, 110, 115, 150, 130, 125, 185, 195];
  for (var w = 0; w < widths.length; w++) {
    sheet.setColumnWidth(w + 1, widths[w]);
  }
  sheet.setFrozenRows(1);

  if (oldRows.length > 0) {
    var newRows = [];
    for (var i = 0; i < oldRows.length; i++) {
      var r = oldRows[i];
      var stt = r[0] || (i + 1);
      var regTime = r[1] || "";
      var fullName = r[2] || "";
      var dob = r[3] || "";
      var gender = r[4] || "Nam";
      var email = r[5] || "";
      var phone = r[6] || "";
      var address = r[7] || "";
      var oldApproved = (r[8] === true || String(r[8]).toUpperCase() === "TRUE");
      var code = r[9] || "";
      var pass = r[10] || "";
      var status = r[11] || "";
      var notes = String(r[12] || "");

      if (!fullName && !email) continue;

      var cccd = "";
      var cccdMatch = notes.match(/CCCD:\\s*([0-9Xx]+)/i);
      if (cccdMatch) cccd = cccdMatch[1];

      var category = "Hợp đồng cá nhân hóa";
      var pkgName = "Ký đặt cọc dự án cá nhân";
      var deposit = "1.250.000";
      var total = "2.550.000";
      var deliveryDays = 5;

      var lowerNotes = notes.toLowerCase();
      if (lowerNotes.indexOf("toàn hệ") !== -1 || lowerNotes.indexOf("toan he") !== -1) {
        category = "Hợp đồng toàn hệ";
        if (lowerNotes.indexOf("chính thức") !== -1 || lowerNotes.indexOf("100%") !== -1) {
          pkgName = "Ký hợp đồng dự án toàn hệ chính thức";
          deposit = "0";
          total = "5.490.000";
          deliveryDays = 1;
        } else {
          pkgName = "Ký đặt cọc phân bổ";
          deposit = "2.500.000";
          total = "5.490.000";
          deliveryDays = 7;
        }
      } else {
        category = "Hợp đồng cá nhân hóa";
        if (lowerNotes.indexOf("chính thức") !== -1 || (lowerNotes.indexOf("100%") !== -1 && lowerNotes.indexOf("đặt cọc") === -1)) {
          pkgName = "Ký hợp đồng dự án cá nhân";
          deposit = "0";
          total = "2.550.000";
          deliveryDays = 1;
        } else {
          pkgName = "Ký đặt cọc dự án cá nhân";
          deposit = "1.250.000";
          total = "2.550.000";
          deliveryDays = 5;
        }
      }

      var row20 = [
        stt,
        regTime,
        fullName,
        cccd,
        dob,
        gender,
        email,
        phone,
        address,
        category,
        pkgName,
        deposit,
        total,
        deliveryDays,
        oldApproved,
        code,
        pass,
        false,
        status || "⏳ Chờ Kỹ sư duyệt Lần 1 (Gửi HĐ đặt cọc)",
        notes
      ];
      newRows.push(row20);
    }

    if (newRows.length > 0) {
      sheet.getRange(2, 1, newRows.length, 20).clearDataValidations();
      sheet.getRange(2, 1, newRows.length, 20).setValues(newRows);

      var cb15 = sheet.getRange(2, 15, newRows.length, 1);
      cb15.setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
      cb15.setHorizontalAlignment("center");

      var cb18 = sheet.getRange(2, 18, newRows.length, 1);
      cb18.setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
      cb18.setHorizontalAlignment("center");
    }
  }
}

function menuUpgradeTo20Cols() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getUsersSheet(ss, true);
  upgradeLegacySheetTo20Cols(sheet);
  SpreadsheetApp.getUi().alert("✅ ĐÃ NÂNG CẤP BẢNG TÍNH SANG 20 CỘT CHUẨN TOÀN DIỆN!\\n\\nDữ liệu các hàng cũ đã được căn chỉnh chuẩn xác theo 20 cột và 2 phân hệ hợp đồng.");
}

function menuSyncFormResponses() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var count = syncPendingFormBridgeResponses();
  SpreadsheetApp.getUi().alert("✅ ĐÃ ĐỒNG BỘ DỮ LIỆU TỪ GOOGLE FORM!\\n\\nĐã kiểm tra và đồng bộ " + count + " hồ sơ khách hàng mới nhất vào trang THÔNG TIN NGƯỜI DÙNG.");
}

/**
 * 1. HÀM KHỞI TẠO & KÍCH HOẠT TỰ ĐỘNG TOÀN DIỆN (CHẠY ĐẦU TIÊN TRONG APPS SCRIPT)
 * - Cấu hình bảng tính 20 cột chuẩn: STT, Thời Gian, Họ Tên, CCCD/CMND, Ngày Sinh, Giới Tính,
 *   Gmail, SĐT, Địa Chỉ, Loại Hợp Đồng, Gói Ký Kết, Tiền Đặt Cọc, Tổng Giá Trị, Hạn Bàn Giao,
 *   Duyệt Ký Lần 1 (Checkbox), Mã Code, Mật Khẩu, Duyệt Bàn Giao Lần 2 (Checkbox), Trạng Thái Gửi Mail, Ghi Chú.
 * - Khởi tạo & làm sạch trang "THÔNG TIN NGƯỜI DÙNG"
 * - Cài đặt Installable Trigger tự động gửi Gmail khi tích Checkbox
 * - Khởi tạo Cầu nối Google Form Bridge và Cron Cloud Keep-Alive
 */
function setupUserRegistrationSheet() {
  var remainingQuota = MailApp.getRemainingDailyQuota();
  Logger.log("Hạn ngạch gửi Gmail còn lại trong ngày: " + remainingQuota);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getUsersSheet(ss, true);

  // Nâng cấp dữ liệu các dòng cũ từ 13 cột sang 20 cột (bảo toàn 100% dữ liệu)
  upgradeLegacySheetTo20Cols(sheet);

  // 20 Cột Chuẩn Toàn Diện
  var headers = [
    "STT",
    "Thời Gian Đăng Ký",
    "Họ Và Tên Khách Hàng",
    "Số CCCD / CMND",
    "Ngày Sinh (DD/MM/YYYY)",
    "Giới Tính",
    "Gmail Đăng Ký",
    "Số Điện Thoại",
    "Địa Chỉ Hiện Tại",
    "Loại Hợp Đồng",
    "Gói Ký Kết",
    "Tiền Đặt Cọc (VNĐ)",
    "Tổng Giá Trị (VNĐ)",
    "Hạn Bàn Giao (Số Ngày)",
    "Duyệt Ký Lần 1",
    "Mã Code Khách Hàng",
    "Mật Khẩu Studio",
    "Duyệt Bàn Giao Lần 2",
    "Trạng Thái Gửi Mail",
    "Ghi Chú Hợp Đồng"
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  headerRange
    .setFontFamily("Times New Roman")
    .setFontSize(11)
    .setFontWeight("bold")
    .setBackground("#18181b")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);

  sheet.setRowHeight(1, 42);

  // Độ rộng 20 cột tương ứng
  var widths = [50, 140, 185, 130, 120, 85, 210, 120, 240, 150, 190, 130, 130, 110, 115, 150, 130, 125, 185, 195];
  for (var i = 0; i < widths.length; i++) {
    sheet.setColumnWidth(i + 1, widths[i]);
  }

  sheet.setFrozenRows(1);

  // Làm sạch các dòng trống ảo
  cleanUpEmptyGhostRows(sheet);

  // Kích hoạt bộ Cron 24/7 trên Cloud Google giữ Render luôn thức
  installCloudKeepAliveTrigger();

  // Tự động cài đặt Installable Trigger cho phép gửi Gmail khi tích Checkbox
  var triggerInstalled = installAutoEditTrigger(ss);

  // Tự động khởi tạo Cầu nối Google Form Bridge & lưu vào ô N1 / J4
  var bridgeUrl = setupGoogleFormBridge(ss);
  var detectedUrl = bridgeUrl || autoPublishWebhookUrlToSheet(ss);

  syncPendingFormBridgeResponses();
  reconcileAllApprovedUsersToAccountsSheet(ss);

  try {
    var msg =
      "✅ ĐÃ KÍCH HOẠT HỆ THỐNG ĐỒNG BỘ 20 CỘT & 2 PHÂN HỆ HỢP ĐỒNG THÀNH CÔNG!\\n\\n" +
      "1. Trang tính \\"" + sheet.getName() + "\\" đã sẵn sàng tiếp nhận dữ liệu 20 cột từ Dòng 2.\\n" +
      "2. Duyệt Ký Lần 1 (Cột 15): Gửi Gmail xác nhận ký kết & file HĐ PDF có dấu mộc đỏ Trưởng ban.\\n" +
      "   • HĐ Đặt cọc: Hệ thống KHÔNG cấp mã ngay mà hẹn ngày bàn giao sau X ngày.\\n" +
      "   • HĐ Thanh toán 100%: Hệ thống cấp ngay Mã Code + Mật khẩu.\\n" +
      "3. Duyệt Bàn Giao Lần 2 (Cột 18): Bàn giao chính thức và cấp Mã Code + Mật khẩu cho HĐ Đặt cọc.\\n" +
      "4. Bộ kích hoạt tự động gửi Gmail: " + (triggerInstalled ? "ĐÃ BẬT (100%)" : "Đã cập nhật") + ".\\n" +
      "5. Hạn ngạch gửi Gmail hôm nay còn: " + remainingQuota + " thư.\\n";

    if (detectedUrl) {
      msg +=
        "\\n👉 Cầu nối 2 chiều WebApp: " + detectedUrl;
    }

    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    Logger.log("Đã hoàn tất khởi tạo setupUserRegistrationSheet: " + e);
  }
}

/**
 * 2. Tự động thêm Menu tùy chỉnh khi mở Sheet
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("🚀 SYNAPES Studio")
      .addItem("1. ⚡ Thiết Lập Bảng Tính 20 Cột & Duyệt 2 Cấp (Duyệt Lần 1 & Duyệt Lần 2)", "setupUserRegistrationSheet")
      .addItem("⚡ Nâng cấp Bảng tính 13 cột sang 20 cột chuẩn (Bảo toàn dữ liệu)", "menuUpgradeTo20Cols")
      .addItem("🔄 Đồng bộ ngay hồ sơ từ Google Form vào Sheet", "menuSyncFormResponses")
      .addSeparator()
      .addItem("2. 📄 Xem thử mẫu Hợp đồng PDF có con dấu đỏ (Dòng đang chọn)", "previewSelectedUserContractModal")
      .addItem("3. ✅ Duyệt Lần 1 dòng đang chọn (Cột 15 — HĐ Đặt Cọc: Gửi HĐ, KHÔNG cấp pass / HĐ 100%: Cấp pass)", "approveSelectedUserRow")
      .addItem("4. 🚀 Duyệt Bàn giao Lần 2 (Cột 18 — Cấp TK cho HĐ Đặt cọc khi đã giao)", "approveSelectedFinalHandoverRow")
      .addSeparator()
      .addItem("5. ⚡ Duyệt TẤT CẢ hồ sơ đang chờ duyệt Lần 1", "approveAllPendingUsers")
      .addItem("6. 🔄 Đồng bộ toàn bộ tài khoản sang Quản Lý Mật Khẩu", "syncAllAccountsMenu")
      .addItem("7. 🌐 Mở trang WebApp SYNAPES Studio", "openWebAppUrl")
      .addToUi();
  } catch (e) {
    Logger.log("onOpen error: " + e);
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    reconcileAllApprovedUsersToAccountsSheet(ss);
    syncPendingFormBridgeResponses();
  } catch (err) {
    Logger.log("onOpen background check error: " + err);
  }
}

function syncAllAccountsMenu() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  reconcileAllApprovedUsersToAccountsSheet(ss);
  SpreadsheetApp.getUi().alert("✅ Đã đồng bộ toàn bộ tài khoản người dùng sang trang 'Quản Lý Mật Khẩu' thành công!");
}

function getUsersSheet(ss, createIfMissing) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_USERS);
  if (!sheet) {
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getSheetId() === GID_USERS) {
        sheet = sheets[i];
        break;
      }
    }
  }
  if (!sheet && createIfMissing) {
    sheet = ss.insertSheet(SHEET_NAME_USERS);
  }
  return sheet;
}

function isUsersSheet(sheet) {
  if (!sheet) return false;
  var name = sheet.getName().trim().toUpperCase();
  if (name === SHEET_NAME_USERS.toUpperCase()) return true;
  if (name.indexOf("THÔNG TIN") !== -1 || name.indexOf("NGƯỜI DÙNG") !== -1 || name.indexOf("NGUOI DUNG") !== -1) {
    return true;
  }
  try {
    if (sheet.getSheetId() === GID_USERS) return true;
  } catch (e) {}
  return false;
}

function isNew20ColsSheet(sheet) {
  if (!sheet) return false;
  var lastCol = sheet.getLastColumn();
  if (lastCol >= 18) return true;
  var col4Header = String(sheet.getRange(1, 4).getValue() || "").toLowerCase();
  return col4Header.indexOf("cccd") !== -1 || col4Header.indexOf("cmnd") !== -1;
}

function getAccountsSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_ACCOUNTS);
  if (!sheet) {
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getSheetId() === GID_ACCOUNTS) {
        sheet = sheets[i];
        break;
      }
    }
  }
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }
  return sheet;
}

function cleanUpEmptyGhostRows(sheet) {
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var numRows = lastRow - 1;
  var maxCols = Math.max(sheet.getLastColumn(), 20);
  var data = sheet.getRange(2, 1, numRows, maxCols).getDisplayValues();
  var lastRealDataRow = 1;

  for (var i = 0; i < data.length; i++) {
    var fullName = String(data[i][2] || "").trim();
    var email = String(data[i][6] || data[i][5] || "").trim();
    if (fullName !== "" || (email !== "" && email.indexOf("@") !== -1)) {
      lastRealDataRow = i + 2;
    } else {
      if (i < 10) {
        sheet.getRange(i + 2, 1, 1, maxCols).clearContent().clearDataValidations();
      }
    }
  }

  if (lastRow > lastRealDataRow + 5) {
    var clearStart = lastRealDataRow + 1;
    var clearCount = lastRow - lastRealDataRow;
    sheet.getRange(clearStart, 1, clearCount, maxCols).clearContent().clearDataValidations();
  }
}

function installAutoEditTrigger(ss) {
  try {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      var fn = triggers[i].getHandlerFunction();
      if (fn === "onInstallableEdit" || fn === "onEdit") {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }
    ScriptApp.newTrigger("onInstallableEdit")
      .forSpreadsheet(ss)
      .onEdit()
      .create();
    return true;
  } catch (err) {
    Logger.log("Không thể tự tạo Trigger: " + err);
    return false;
  }
}

function setupGoogleFormBridge(ss) {
  try {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    var formUrl = ss.getFormUrl();
    if (formUrl) {
      autoPublishWebhookUrlToSheet(ss, formUrl);
      return formUrl;
    }

    var form = FormApp.create("SYNAPES Studio - Cầu Nối WebApp Tự Động");
    form.setTitle("SYNAPES Studio — Kênh Nhận Dữ Liệu Đăng Ký WebApp")
        .setDescription("Form tự động tiếp nhận hồ sơ đăng ký và hợp đồng từ WebApp.");

    form.addTextItem().setTitle("Họ và tên khách hàng").setRequired(true);
    form.addTextItem().setTitle("Số CCCD / CMND").setRequired(true);
    form.addTextItem().setTitle("Ngày sinh (DD/MM/YYYY)").setRequired(true);
    form.addTextItem().setTitle("Giới tính").setRequired(false);
    form.addTextItem().setTitle("Gmail đăng ký").setRequired(true);
    form.addTextItem().setTitle("Số điện thoại").setRequired(true);
    form.addParagraphTextItem().setTitle("Địa chỉ hiện tại").setRequired(true);
    form.addTextItem().setTitle("Loại Hợp Đồng").setRequired(false);
    form.addTextItem().setTitle("Gói Ký Kết").setRequired(false);
    form.addTextItem().setTitle("Tiền Đặt Cọc").setRequired(false);
    form.addTextItem().setTitle("Tổng Giá Trị").setRequired(false);
    form.addTextItem().setTitle("Hạn Bàn Giao").setRequired(false);
    form.addParagraphTextItem().setTitle("Ghi Chú Hợp Đồng").setRequired(false);

    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

    ScriptApp.newTrigger("onFormBridgeSubmit")
      .forForm(form)
      .onFormSubmit()
      .create();

    var publishedUrl = form.getPublishedUrl();
    autoPublishWebhookUrlToSheet(ss, publishedUrl);
    return publishedUrl;
  } catch (err) {
    Logger.log("setupGoogleFormBridge error: " + err);
    return null;
  }
}

function onFormBridgeSubmit(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    syncPendingFormBridgeResponses();
  } catch (err) {
    Logger.log("onFormBridgeSubmit error: " + err);
  }
}

function syncPendingFormBridgeResponses() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var formUrl = ss.getFormUrl();
    if (!formUrl) return 0;

    var form = FormApp.openByUrl(formUrl);
    var responses = form.getResponses();
    if (!responses || responses.length === 0) return 0;

    var count = 0;
    for (var i = 0; i < responses.length; i++) {
      var itemResponses = responses[i].getItemResponses();
      var payload = {};
      for (var j = 0; j < itemResponses.length; j++) {
        var title = itemResponses[j].getItem().getTitle();
        var val = itemResponses[j].getResponse();
        if (title.indexOf("Họ và tên") !== -1) payload.fullName = val;
        else if (title.indexOf("CCCD") !== -1) payload.idCardNumber = val;
        else if (title.indexOf("Ngày sinh") !== -1) payload.dob = val;
        else if (title.indexOf("Giới tính") !== -1) payload.gender = val;
        else if (title.indexOf("Gmail") !== -1) payload.email = val;
        else if (title.indexOf("Số điện thoại") !== -1) payload.phone = val;
        else if (title.indexOf("Địa chỉ") !== -1) payload.address = val;
        else if (title.indexOf("Loại Hợp Đồng") !== -1) payload.contractCategory = val;
        else if (title.indexOf("Gói Ký Kết") !== -1) payload.contractPackageName = val;
        else if (title.indexOf("Tiền Đặt Cọc") !== -1) payload.depositAmount = val;
        else if (title.indexOf("Tổng Giá Trị") !== -1) payload.totalAmount = val;
        else if (title.indexOf("Hạn Bàn Giao") !== -1) payload.deliveryDays = val;
        else if (title.indexOf("Ghi Chú") !== -1) payload.notes = val;
      }
      if (payload.fullName && payload.email) {
        handleUserRegistrationWebhook(ss, payload);
        count++;
      }
    }
    return count;
  } catch (err) {
    Logger.log("syncPendingFormBridgeResponses error: " + err);
    return 0;
  }
}

function autoPublishWebhookUrlToSheet(ss, customUrl) {
  try {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = getUsersSheet(ss, false);
    var accSheet = getAccountsSheet(ss);

    var url = customUrl || "";
    if (!url) {
      try {
        url = ScriptApp.getService().getUrl();
      } catch (e) {}
    }
    if (!url) {
      try {
        var fUrl = ss.getFormUrl();
        if (fUrl) url = fUrl;
      } catch (e2) {}
    }

    if (url && url.indexOf("docs.google.com/forms") !== -1) {
      url = url.replace("/viewform", "/formResponse").replace("/edit", "/formResponse");
    }

    if (url && usersSheet) {
      usersSheet.getRange("U1").setValue(url).setFontColor("#94a3b8").setFontSize(8);
    }
    if (url && accSheet) {
      accSheet.getRange("J4").setValue(url).setFontColor("#94a3b8").setFontSize(8);
    }
    return url;
  } catch (err) {
    Logger.log("autoPublishWebhookUrlToSheet error: " + err);
    return null;
  }
}

function onInstallableEdit(e) {
  handleSheetCheckboxEdit(e, true);
}

function onEdit(e) {
  handleSheetCheckboxEdit(e, false);
}

/**
 * Xử lý khi Checkbox trên trang "THÔNG TIN NGƯỜI DÙNG" được tích chọn:
 * - Cột 15 (Duyệt Ký Lần 1):
 *   + HĐ Đặt cọc: Gửi Gmail xác nhận ký kết, hẹn ngày nhận sản phẩm sau X ngày (KHÔNG cấp mã ngay) kèm file PDF HĐ đặt cọc có mộc đỏ.
 *   + HĐ Thanh toán 100%: Cấp ngay Mã Code + Mật khẩu, gửi Gmail hướng dẫn kèm file PDF HĐ chính thức có mộc đỏ.
 * - Cột 18 (Duyệt Bàn Giao Lần 2):
 *   + Dành cho HĐ Đặt cọc khi đến hạn và khách đã thanh toán đủ: Cấp Mã Code + Mật khẩu, gửi Gmail bàn giao chính thức kèm file PDF HĐ bàn giao có mộc đỏ.
 * - Hỗ trợ tương thích ngược: Cột 9 trên sheet 13 cột cũ.
 */
function handleSheetCheckboxEdit(e, canSendMail) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  if (!isUsersSheet(sheet)) return;

  var col = e.range.getColumn();
  var row = e.range.getRow();
  if (row < 2) return;

  var isChecked = e.range.getValue();
  if (isChecked !== true && String(isChecked).toUpperCase() !== "TRUE") {
    return;
  }

  var is20Cols = isNew20ColsSheet(sheet);

  // 1. Duyệt Ký Lần 1 tại Cột 15 (Sheet 20 Cột)
  if (is20Cols && col === 15) {
    var mailStatus1 = String(sheet.getRange(row, 19).getDisplayValue() || "");
    if (!canSendMail && (mailStatus1.indexOf("ĐÃ GỬI MAIL") !== -1 || mailStatus1.indexOf("ĐÃ GỬI GMAIL") !== -1)) {
      return;
    }
    processFirstApproval(sheet, row, canSendMail);
    return;
  }

  // 2. Duyệt Bàn Giao Lần 2 tại Cột 18 (Sheet 20 Cột)
  if (is20Cols && col === 18) {
    var mailStatus2 = String(sheet.getRange(row, 19).getDisplayValue() || "");
    if (!canSendMail && mailStatus2.indexOf("ĐÃ BÀN GIAO") !== -1) {
      return;
    }
    processFinalHandoverApproval(sheet, row, canSendMail);
    return;
  }

  // 3. Tương thích ngược: Duyệt Cột 9 (Sheet 13 Cột cũ) -> Nâng cấp tức thì sang 20 cột và duyệt Lần 1
  if (!is20Cols && col === 9) {
    upgradeLegacySheetTo20Cols(sheet);
    sheet.getRange(row, 15).setValue(true);
    processFirstApproval(sheet, row, canSendMail);
    return;
  }
}

/**
 * Chuẩn hóa chuỗi ngày sinh DD/MM/YYYY và trích xuất 4 chữ số DDMM
 */
function parseDobToDDMM(dobRaw, nowDate) {
  var dobStr = String(dobRaw || "").replace(/^'+/, "").trim();
  var defaultDDMM = Utilities.formatDate(nowDate || new Date(), "GMT+7", "ddMM");
  if (!dobStr) return { formattedDob: "", ddmm: defaultDDMM };

  var ymd = dobStr.match(/^(\\d{4})[\\/\\-\\.](\\d{1,2})[\\/\\-\\.](\\d{1,2})/);
  if (ymd) {
    var d1 = ("0" + ymd[3]).slice(-2);
    var m1 = ("0" + ymd[2]).slice(-2);
    return {
      formattedDob: d1 + "/" + m1 + "/" + ymd[1],
      ddmm: d1 + m1
    };
  }

  var dmy = dobStr.match(/^(\\d{1,2})[\\/\\-\\.](\\d{1,2})[\\/\\-\\.](\\d{2,4})/);
  if (dmy) {
    var d2 = ("0" + dmy[1]).slice(-2);
    var m2 = ("0" + dmy[2]).slice(-2);
    var y2 = dmy[3].length === 2 ? "20" + dmy[3] : dmy[3];
    return {
      formattedDob: d2 + "/" + m2 + "/" + y2,
      ddmm: d2 + m2
    };
  }

  return { formattedDob: dobStr, ddmm: defaultDDMM };
}

/**
 * Đảm bảo mỗi khách hàng có một Mã Code duy nhất, không trùng lặp
 */
function ensureUniqueUserCode(ss, baseCode, currentUserSheetRow, currentFullName) {
  var candidate = String(baseCode || "").trim().toUpperCase();
  if (!candidate) return candidate;

  var usedCodes = {};
  var nameClean = String(currentFullName || "").trim().toLowerCase();

  var uSheet = getUsersSheet(ss, false);
  if (uSheet && uSheet.getLastRow() >= 2) {
    var is20 = isNew20ColsSheet(uSheet);
    var codeColIdx = is20 ? 15 : 9; // 0-based index: 15 for col 16, 9 for col 10
    var uData = uSheet.getRange(2, 1, uSheet.getLastRow() - 1, Math.max(uSheet.getLastColumn(), 20)).getDisplayValues();
    for (var i = 0; i < uData.length; i++) {
      var rIdx = i + 2;
      if (rIdx === currentUserSheetRow) continue;
      var cCode = String(uData[i][codeColIdx] || "").trim().toUpperCase();
      if (cCode) {
        usedCodes[cCode] = true;
      }
    }
  }

  var accSheet = getAccountsSheet(ss);
  if (accSheet && accSheet.getLastRow() >= 5) {
    var accData = accSheet.getRange(1, 1, accSheet.getLastRow(), 4).getDisplayValues();
    for (var j = 4; j < accData.length; j++) {
      var aCode = String(accData[j][1] || "").trim().toUpperCase();
      var aName = String(accData[j][2] || "").trim().toLowerCase();
      if (aCode && aName && aName !== nameClean) {
        usedCodes[aCode] = true;
      }
    }
  }

  if (!usedCodes[candidate]) {
    return candidate;
  }

  var suffix = 2;
  while (usedCodes[candidate + "_" + suffix]) {
    suffix++;
  }
  return candidate + "_" + suffix;
}

/**
 * Sinh Mã Code và Mật khẩu mới an toàn
 */
function generateCodeAndPassword(ss, fullName, dobRaw, row) {
  var now = new Date();
  var dobParsed = parseDobToDDMM(dobRaw, now);
  var yymmdd = Utilities.formatDate(now, "GMT+7", "yyMMdd");
  var baseCode = "SNP_" + yymmdd + dobParsed.ddmm;
  var code = ensureUniqueUserCode(ss, baseCode, row, fullName);

  var randomDigits = Math.floor(100 + Math.random() * 900);
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  var randomLetters = "";
  for (var c = 0; c < 3; c++) {
    randomLetters += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  var password = "SNP_" + randomDigits + randomLetters;

  return { code: code, password: password, dobFormatted: dobParsed.formattedDob };
}

/**
 * 4. XỬ LÝ PHÊ DUYỆT LẦN 1 (CỘT 15 - DUYỆT KÝ LẦN 1 TRÊN SHEET 20 CỘT)
 * - Nếu là Hợp đồng Đặt cọc:
 *   + KHÔNG cấp Code và Password ngay (để trống Cột 16 & Cột 17)
 *   + Tính ngày nhận sản phẩm sau X ngày kể từ ngày ký (dựa trên Cột 14 - Hạn bàn giao)
 *   + Gửi Gmail xác nhận ký kết đặt cọc kèm ngày hẹn bàn giao + Bản mềm HĐ đặt cọc PDF có mộc đỏ + QR Code chuyển khoản
 *   + Cập nhật Cột 19: "✅ ĐÃ GỬI MAIL ĐẶT CỌC (Hẹn giao: DD/MM/YYYY)"
 * - Nếu là Hợp đồng Thanh toán 100%:
 *   + Cấp ngay Mã Code (Cột 16) + Mật khẩu (Cột 17)
 *   + Đồng bộ sang trang "Quản Lý Mật Khẩu"
 *   + Gửi Gmail cấp tài khoản + Hướng dẫn chi tiết + Bản mềm HĐ chính thức PDF có mộc đỏ + QR Code
 *   + Cập nhật Cột 19: "✅ ĐÃ GỬI GMAIL CẤP TK (DD/MM/YYYY HH:mm:ss)"
 */
function processFirstApproval(sheet, row, canSendMail) {
  if (canSendMail === undefined) canSendMail = true;

  var displayVals = sheet.getRange(row, 1, 1, 20).getDisplayValues()[0];
  var rawVals = sheet.getRange(row, 1, 1, 20).getValues()[0];

  var fullName = String(displayVals[2] || "").trim();
  var idCardNumber = String(displayVals[3] || "").replace(/^'+/, "").trim();
  var dobRaw = displayVals[4] || "";
  if (rawVals[4] instanceof Date) {
    dobRaw = Utilities.formatDate(rawVals[4], "GMT+7", "dd/MM/yyyy");
  }
  var gender = String(displayVals[5] || "Nam").trim();
  var email = String(displayVals[6] || "").trim();
  var phone = String(displayVals[7] || "").replace(/^'+/, "").trim();
  var address = String(displayVals[8] || "").trim();
  var contractCategory = String(displayVals[9] || "Hợp đồng cá nhân hóa").trim();
  var contractPackageName = String(displayVals[10] || "").trim();
  var depositStr = String(displayVals[11] || "").trim();
  var totalStr = String(displayVals[12] || "").trim();
  var deliveryStr = String(displayVals[13] || "").trim();

  var existingCode = String(displayVals[15] || "").trim();
  var existingPass = String(displayVals[16] || "").trim();

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!fullName || !email || email.indexOf("@") === -1) {
    ss.toast("⚠️ Dòng " + row + " chưa có đầy đủ Họ tên hoặc Gmail hợp lệ!", "SYNAPES Studio", 6);
    return false;
  }

  var depositAmount = parseFloat(depositStr.replace(/[^0-9]/g, "")) || 0;
  var totalAmount = parseFloat(totalStr.replace(/[^0-9]/g, "")) || 0;
  var deliveryDays = parseInt(deliveryStr.replace(/[^0-9]/g, "")) || 0;
  var isDeposit = depositAmount > 0 ||
    contractPackageName.toLowerCase().indexOf("đặt cọc") !== -1 ||
    contractPackageName.toLowerCase().indexOf("deposit") !== -1;

  var now = new Date();
  var nowStr = Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm:ss");

  // Xử lý HỢP ĐỒNG ĐẶT CỌC
  if (isDeposit) {
    if (deliveryDays <= 0) {
      deliveryDays = contractCategory.toLowerCase().indexOf("toàn hệ") !== -1 ? 7 : 5;
    }
    var deliveryDate = new Date(now.getTime() + deliveryDays * 24 * 60 * 60 * 1000);
    var deliveryDateStr = Utilities.formatDate(deliveryDate, "GMT+7", "dd/MM/yyyy");

    // Đảm bảo không cấp mật khẩu ngay
    if (!existingCode) {
      sheet.getRange(row, 16).setValue("(Chờ bàn giao)").setHorizontalAlignment("center").setFontColor("#64748b");
    }
    if (!existingPass) {
      sheet.getRange(row, 17).setValue("(Chờ bàn giao)").setHorizontalAlignment("center").setFontColor("#64748b");
    }

    if (!canSendMail) {
      sheet.getRange(row, 19).setValue("⏳ Đã duyệt ký (Bấm menu SYNAPES Studio ➔ Mục 1 để bật gửi Gmail tự động)");
      return true;
    }

    var mailResult = sendDepositApprovalEmail(
      email,
      fullName,
      idCardNumber,
      dobRaw,
      gender,
      phone,
      address,
      contractCategory,
      contractPackageName,
      depositAmount,
      totalAmount,
      deliveryDays,
      deliveryDateStr
    );

    if (mailResult.success) {
      sheet.getRange(row, 19).setValue("✅ ĐÃ GỬI MAIL ĐẶT CỌC (Hẹn giao: " + deliveryDateStr + ")").setFontColor("#15803d").setFontWeight("bold");
      sheet.getRange(row, 20).setValue("📄 HĐ Đặt Cọc đã ký (Hẹn giao: " + deliveryDateStr + " — Chờ duyệt Cột 18)");
      ss.toast("✅ Đã gửi Gmail xác nhận đặt cọc (Hẹn bàn giao: " + deliveryDateStr + ") tới " + email, "🚀 SYNAPES Studio", 6);
      return true;
    } else {
      sheet.getRange(row, 19).setValue("⚠️ Lỗi gửi mail: " + mailResult.error).setFontColor("#b91c1c");
      ss.toast("⚠️ Lỗi gửi Gmail: " + mailResult.error, "SYNAPES Studio", 8);
      return false;
    }
  }

  // Xử lý HỢP ĐỒNG THANH TOÁN 100%
  var creds = generateCodeAndPassword(ss, fullName, dobRaw, row);
  var code = existingCode && existingCode.indexOf("SNP_") === 0 ? existingCode : creds.code;
  var password = existingPass && existingPass.indexOf("SNP_") === 0 ? existingPass : creds.password;

  sheet.getRange(row, 16).setValue(code).setFontWeight("bold").setHorizontalAlignment("center").setFontColor("#0f172a");
  sheet.getRange(row, 17).setValue(password).setFontWeight("bold").setHorizontalAlignment("center").setFontColor("#b91c1c");

  syncAccountToMainSheet(code, fullName, email, password, phone, address, false);
  reconcileAllApprovedUsersToAccountsSheet(ss);

  if (!canSendMail) {
    sheet.getRange(row, 19).setValue("⏳ Đã tạo Mã (Bấm menu SYNAPES Studio ➔ Mục 1 để bật gửi Gmail tự động)");
    return true;
  }

  var fullMailResult = sendFullApprovalEmail(
    email,
    fullName,
    idCardNumber,
    creds.dobFormatted || dobRaw,
    gender,
    phone,
    address,
    code,
    password,
    contractCategory,
    contractPackageName,
    totalAmount
  );

  if (fullMailResult.success) {
    sheet.getRange(row, 19).setValue("✅ ĐÃ GỬI GMAIL CẤP TK (" + nowStr + ")").setFontColor("#15803d").setFontWeight("bold");
    sheet.getRange(row, 20).setValue("📄 HOP_DONG_SYNAPES_" + code + ".pdf (Đã cấp TK & HĐ 100%)");
    ss.toast("✅ Đã cấp mã " + code + " và gửi Gmail kích hoạt tới " + email, "🚀 SYNAPES Studio", 6);
    return true;
  } else {
    sheet.getRange(row, 19).setValue("⚠️ Lỗi gửi mail: " + fullMailResult.error).setFontColor("#b91c1c");
    ss.toast("⚠️ Lỗi gửi Gmail: " + fullMailResult.error, "SYNAPES Studio", 8);
    return false;
  }
}

/**
 * 5. XỬ LÝ PHÊ DUYỆT BÀN GIAO LẦN 2 (CỘT 18 - DUYỆT BÀN GIAO LẦN 2 TRÊN SHEET 20 CỘT)
 * - Dành cho các hợp đồng đặt cọc khi đến hạn bàn giao sản phẩm:
 *   Kỹ sư/Dev kiểm tra thanh toán đợt cuối thành công, sau đó tích chọn Cột 18 để:
 *   + Tự động sinh Mã Code và Mật khẩu (nếu chưa có)
 *   + Ghi vào Cột 16 & Cột 17 và lưu sang trang "Quản Lý Mật Khẩu"
 *   + Gửi Gmail thông báo bàn giao chính thức, cấp thông tin tài khoản đăng nhập và đính kèm bản HĐ bàn giao chính thức PDF có mộc đỏ
 *   + Cập nhật Cột 19: "✅ ĐÃ BÀN GIAO & GỬI GMAIL (DD/MM/YYYY HH:mm:ss)"
 */
function processFinalHandoverApproval(sheet, row, canSendMail) {
  if (canSendMail === undefined) canSendMail = true;

  var displayVals = sheet.getRange(row, 1, 1, 20).getDisplayValues()[0];
  var rawVals = sheet.getRange(row, 1, 1, 20).getValues()[0];

  var fullName = String(displayVals[2] || "").trim();
  var idCardNumber = String(displayVals[3] || "").replace(/^'+/, "").trim();
  var dobRaw = displayVals[4] || "";
  if (rawVals[4] instanceof Date) {
    dobRaw = Utilities.formatDate(rawVals[4], "GMT+7", "dd/MM/yyyy");
  }
  var gender = String(displayVals[5] || "Nam").trim();
  var email = String(displayVals[6] || "").trim();
  var phone = String(displayVals[7] || "").replace(/^'+/, "").trim();
  var address = String(displayVals[8] || "").trim();
  var contractCategory = String(displayVals[9] || "Hợp đồng cá nhân hóa").trim();
  var contractPackageName = String(displayVals[10] || "").trim();
  var totalStr = String(displayVals[12] || "").trim();
  var totalAmount = parseFloat(totalStr.replace(/[^0-9]/g, "")) || 0;

  var existingCode = String(displayVals[15] || "").trim();
  var existingPass = String(displayVals[16] || "").trim();

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!fullName || !email || email.indexOf("@") === -1) {
    ss.toast("⚠️ Dòng " + row + " chưa có đầy đủ Họ tên hoặc Gmail hợp lệ!", "SYNAPES Studio", 6);
    return false;
  }

  var creds = generateCodeAndPassword(ss, fullName, dobRaw, row);
  var code = (existingCode && existingCode.indexOf("SNP_") === 0) ? existingCode : creds.code;
  var password = (existingPass && existingPass.indexOf("SNP_") === 0) ? existingPass : creds.password;

  sheet.getRange(row, 16).setValue(code).setFontWeight("bold").setHorizontalAlignment("center").setFontColor("#0f172a");
  sheet.getRange(row, 17).setValue(password).setFontWeight("bold").setHorizontalAlignment("center").setFontColor("#b91c1c");

  syncAccountToMainSheet(code, fullName, email, password, phone, address, false);
  reconcileAllApprovedUsersToAccountsSheet(ss);

  var now = new Date();
  var nowStr = Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm:ss");

  if (!canSendMail) {
    sheet.getRange(row, 19).setValue("⏳ Đã duyệt Bàn giao (Bấm menu SYNAPES Studio ➔ Mục 1 để bật gửi Gmail tự động)");
    return true;
  }

  var handoverMailResult = sendFinalHandoverEmail(
    email,
    fullName,
    idCardNumber,
    creds.dobFormatted || dobRaw,
    gender,
    phone,
    address,
    code,
    password,
    contractCategory,
    contractPackageName,
    totalAmount
  );

  if (handoverMailResult.success) {
    sheet.getRange(row, 19).setValue("✅ ĐÃ BÀN GIAO & GỬI GMAIL (" + nowStr + ")").setFontColor("#15803d").setFontWeight("bold");
    sheet.getRange(row, 20).setValue("🎉 BÀN GIAO THÀNH CÔNG — CẤP MÃ " + code);
    ss.toast("✅ Đã bàn giao hệ thống và gửi tài khoản mã " + code + " tới " + email, "🚀 SYNAPES Studio", 6);
    return true;
  } else {
    sheet.getRange(row, 19).setValue("⚠️ Lỗi gửi mail bàn giao: " + handoverMailResult.error).setFontColor("#b91c1c");
    ss.toast("⚠️ Lỗi gửi Gmail: " + handoverMailResult.error, "SYNAPES Studio", 8);
    return false;
  }
}

/**
 * 6. XỬ LÝ PHÊ DUYỆT TƯƠNG THÍCH CHO SHEET 13 CỘT CŨ (TỰ ĐỘNG CHUYỂN ĐỔI SANG 20 CỘT VÀ DUYỆT LẦN 1)
 */
function processLegacyApproval(sheet, row, canSendMail) {
  upgradeLegacySheetTo20Cols(sheet);
  sheet.getRange(row, 15).setValue(true);
  return processFirstApproval(sheet, row, canSendMail);
}

function processUserApproval(sheet, row, canSendMail) {
  var is20 = isNew20ColsSheet(sheet);
  if (is20) {
    return processFirstApproval(sheet, row, canSendMail);
  } else {
    return processLegacyApproval(sheet, row, canSendMail);
  }
}

/**
 * 7. CÁC HÀM GỬI GMAIL VÀ NỘI DUNG CHUẨN DOANH NGHIỆP (POSTMARK / GITHUB PRIMER STANDARD)
 * - Khắc phục 100% lỗi hiển thị ảnh QR: Chuyển đổi Base64 sang Blob và nhúng qua inlineImages (cid:paymentQrCode)
 * - Loại bỏ hoàn toàn anti-pattern AI-slop (Times New Roman, emoji tràn lan, alert box màu mè)
 * - Chuẩn hóa khung chứa 600px, Typography -apple-system, Bảng kê chi tiết và Trích dẫn trang trọng của Trưởng ban
 */

function getTimoQrBlob() {
  try {
    var commaIdx = TIMO_QR_CODE_BASE64.indexOf(",");
    var raw = commaIdx !== -1 ? TIMO_QR_CODE_BASE64.substring(commaIdx + 1) : TIMO_QR_CODE_BASE64;
    var decoded = Utilities.base64Decode(raw);
    return Utilities.newBlob(decoded, "image/jpeg", "vietqr_timo_bvbank.jpg");
  } catch (e) {
    Logger.log("getTimoQrBlob error: " + e);
    return null;
  }
}

function wrapEmailInCorporateLayout(headerSubtitle, documentTitle, contentHtml) {
  return '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '  <meta charset="utf-8" />' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
    '</head>' +
    '<body style="margin: 0; padding: 24px 12px; background-color: #f6f8fa; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif; color: #1f2328; -webkit-font-smoothing: antialiased; line-height: 1.6;">' +
    '  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 620px; width: 100%; margin: 0 auto; background: #ffffff; border: 1px solid #d0d7de; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);">' +
    '    <!-- HEADER -->' +
    '    <tr>' +
    '      <td style="padding: 24px 28px 18px 28px; border-bottom: 1px solid #d0d7de; background: #ffffff;">' +
    '        <div style="font-size: 11px; font-weight: 700; color: #0969da; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">' +
    '          HỆ THỐNG CÔNG NGHỆ SYNAPES STUDIO' +
    '        </div>' +
    '        <div style="font-size: 18px; font-weight: 700; color: #1f2328; line-height: 1.3;">' +
    '          ' + documentTitle + '' +
    '        </div>' +
    '        <div style="font-size: 12.5px; color: #57606a; margin-top: 3px;">' +
    '          ' + headerSubtitle + '' +
    '        </div>' +
    '      </td>' +
    '    </tr>' +
    '    <!-- BODY -->' +
    '    <tr>' +
    '      <td style="padding: 24px 28px;">' +
    '        ' + contentHtml + '' +
    '      </td>' +
    '    </tr>' +
    '    <!-- FOOTER -->' +
    '    <tr>' +
    '      <td style="padding: 20px 28px; background: #f6f8fa; border-top: 1px solid #d0d7de; font-size: 12px; color: #57606a; line-height: 1.55;">' +
    '        <div style="font-weight: 600; color: #24292f; margin-bottom: 4px;">SYNAPES Studio &bull; Ban Chuyển đổi số &amp; Trí tuệ nhân tạo</div>' +
    '        <div>Chủ quản kỹ thuật: <b>KS. Nguyễn Hoàng Thiện</b> &bull; Email: <a href="mailto:nguyenhoangthien.hvt.15@gmail.com" style="color: #0969da; text-decoration: none;">nguyenhoangthien.hvt.15@gmail.com</a></div>' +
    '        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e1e4e8; color: #8c959f; font-size: 11px;">' +
    '          Thư điện tử và tệp tin đính kèm có tính pháp lý xác thực giữa các bên theo chuẩn mã hóa DMCA. Vui lòng bảo mật thông tin tài khoản và không chia sẻ cho bên thứ ba.' +
    '        </div>' +
    '      </td>' +
    '    </tr>' +
    '  </table>' +
    '</body>' +
    '</html>';
}

function buildQuoteAndThanksHtml() {
  return '<div style="margin: 22px 0; padding: 14px 18px; border-left: 3px solid #1f2328; background: #f6f8fa; border-radius: 0 6px 6px 0;">' +
    '  <div style="font-size: 13px; font-style: italic; color: #32383f; line-height: 1.6;">' +
    '    &ldquo;' + QUOTE_TRUONG_BAN + '&rdquo;' +
    '  </div>' +
    '  <div style="margin-top: 8px; font-size: 12.5px; font-weight: 600; color: #1f2328;">' +
    '    KS. NGUYỄN HOÀNG THIỆN &mdash; <span style="font-weight: normal; color: #57606a;">Trưởng ban Chuyển đổi số &amp; Trí tuệ nhân tạo</span>' +
    '  </div>' +
    '</div>';
}

function buildPaymentQrBoxHtml(amount, transferNote) {
  var transferAmountStr = (amount && amount > 0)
    ? (amount.toLocaleString("vi-VN") + " VNĐ")
    : "Theo quy định hợp đồng";

  var qrOnlineUrl = "https://img.vietqr.io/image/970454-0983396354-compact2.png?amount=" + (amount || 0) + "&accountName=NGUYEN%20HOANG%20THIEN";
  var noteClean = transferNote || "SYNAPES STUDIO";

  return '<table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #d0d7de; border-radius: 6px; background: #ffffff; overflow: hidden;">' +
    '  <tr>' +
    '    <td style="background: #f6f8fa; padding: 10px 16px; border-bottom: 1px solid #d0d7de;">' +
    '      <div style="font-size: 11px; font-weight: 700; color: #57606a; text-transform: uppercase; letter-spacing: 0.6px;">' +
    '        THÔNG TIN TÀI KHOẢN THANH TOÁN (VIETQR NAPAS 247)' +
    '      </div>' +
    '    </td>' +
    '  </tr>' +
    '  <tr>' +
    '    <td style="padding: 16px;">' +
    '      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">' +
    '        <tr>' +
    '          <td style="width: 160px; vertical-align: top; text-align: center; padding-right: 16px;">' +
    '            <img src="cid:paymentQrCode" width="150" height="150" style="display: block; width: 150px; height: 150px; border-radius: 4px; border: 1px solid #d0d7de; margin: 0 auto;" alt="VietQR Timo BVBank - 0983396354" />' +
    '            <div style="margin-top: 6px; font-size: 11px; color: #57606a;">Quét mã thanh toán nhanh</div>' +
    '            <div style="margin-top: 3px;"><a href="' + qrOnlineUrl + '" target="_blank" style="font-size: 11px; color: #0969da; text-decoration: none;">Mở ảnh QR dự phòng &rarr;</a></div>' +
    '          </td>' +
    '          <td style="vertical-align: top;">' +
    '            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 13px; line-height: 1.6;">' +
    '              <tr>' +
    '                <td style="padding: 4px 0; color: #57606a; width: 105px;">Ngân hàng:</td>' +
    '                <td style="padding: 4px 0; color: #1f2328; font-weight: 600;">' + TIMO_BANK_INFO.bankName + '</td>' +
    '              </tr>' +
    '              <tr>' +
    '                <td style="padding: 4px 0; color: #57606a;">Số tài khoản:</td>' +
    '                <td style="padding: 4px 0;"><span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 14px; font-weight: 700; color: #0969da; background: #ddf4ff; border: 1px solid #b6e3ff; padding: 2px 7px; border-radius: 4px;">' + TIMO_BANK_INFO.accountNumber + '</span></td>' +
    '              </tr>' +
    '              <tr>' +
    '                <td style="padding: 4px 0; color: #57606a;">Chủ tài khoản:</td>' +
    '                <td style="padding: 4px 0; color: #1f2328; font-weight: 700; text-transform: uppercase;">' + TIMO_BANK_INFO.accountHolder + '</td>' +
    '              </tr>' +
    '              <tr>' +
    '                <td style="padding: 4px 0; color: #57606a;">Số tiền:</td>' +
    '                <td style="padding: 4px 0; color: #1a7f37; font-weight: 700;">' + transferAmountStr + '</td>' +
    '              </tr>' +
    '              <tr>' +
    '                <td style="padding: 4px 0; color: #57606a; vertical-align: top;">Nội dung CK:</td>' +
    '                <td style="padding: 4px 0; color: #1f2328; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px;">' + noteClean + '</td>' +
    '              </tr>' +
    '            </table>' +
    '          </td>' +
    '        </tr>' +
    '      </table>' +
    '    </td>' +
    '  </tr>' +
    '</table>';
}

/**
 * Gửi Gmail Phê Duyệt Ký Đặt Cọc (KHÔNG gửi mã/pass, báo ngày nhận sản phẩm sau X ngày)
 */
function sendDepositApprovalEmail(email, fullName, idCardNumber, dob, gender, phone, address, category, packageName, depositAmount, totalAmount, deliveryDays, deliveryDateStr) {
  try {
    var subject = "[SYNAPES Studio] Xác nhận ký kết hợp đồng đặt cọc & Lịch bàn giao — " + fullName.toUpperCase();

    var htmlContract = generateContractHtmlContent(
      fullName, dob, gender, phone, address, "DEPOSIT_" + (idCardNumber || "SNP"), email,
      idCardNumber, packageName, depositAmount, totalAmount, deliveryDays, true
    );

    var pdfBlob = Utilities.newBlob(htmlContract, "text/html", "HOP_DONG_DAT_COC_SYNAPES_" + fullName.replace(/\s+/g, "_") + ".html")
      .getAs("application/pdf")
      .setName("HOP_DONG_DAT_COC_SYNAPES_" + fullName.replace(/\s+/g, "_") + ".pdf");

    var remainingAmount = Math.max(0, totalAmount - depositAmount);
    var cccdRow = idCardNumber
      ? '      <tr>' +
        '        <td style="padding: 8px 12px; color: #57606a; border-bottom: 1px solid #e1e4e8; width: 40%;">Số CCCD / CMND:</td>' +
        '        <td style="padding: 8px 12px; color: #1f2328; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 600; border-bottom: 1px solid #e1e4e8;">' + idCardNumber + '</td>' +
        '      </tr>'
      : '';

    var contentHtml =
      '<p style="margin: 0 0 14px 0; font-size: 14.5px;">Kính gửi Quý khách hàng <b>' + fullName + '</b>,</p>' +
      '<p style="margin: 0 0 16px 0; font-size: 14px; color: #32383f; line-height: 1.6;">' +
      '  Hồ sơ đăng ký và <b>Hợp đồng đặt cọc dự án</b> sử dụng hệ thống <b>SYNAPES Studio</b> của Quý khách đã được <b>KS. Nguyễn Hoàng Thiện</b> (Trưởng ban Chuyển đổi số &amp; Trí tuệ nhân tạo) phê duyệt thành công.' +
      '</p>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #d0d7de; border-radius: 6px; overflow: hidden; font-size: 13.5px;">' +
      '  <tr style="background: #f6f8fa;">' +
      '    <th colspan="2" style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; color: #57606a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #d0d7de;">' +
      '      THÔNG TIN KÝ KẾT HỢP ĐỒNG ĐẶT CỌC' +
      '    </th>' +
      '  </tr>' +
      '  <tr>' +
      '    <td style="padding: 8px 12px; color: #57606a; border-bottom: 1px solid #e1e4e8; width: 40%;">Gói dịch vụ đã ký:</td>' +
      '    <td style="padding: 8px 12px; color: #1f2328; font-weight: 600; border-bottom: 1px solid #e1e4e8;">' + packageName + ' (' + category + ')</td>' +
      '  </tr>' +
      cccdRow +
      '  <tr>' +
      '    <td style="padding: 8px 12px; color: #57606a; border-bottom: 1px solid #e1e4e8;">Số tiền đặt cọc:</td>' +
      '    <td style="padding: 8px 12px; color: #1a7f37; font-weight: 700; font-size: 15px; border-bottom: 1px solid #e1e4e8;">' + depositAmount.toLocaleString("vi-VN") + ' VNĐ</td>' +
      '  </tr>' +
      '  <tr>' +
      '    <td style="padding: 8px 12px; color: #57606a; border-bottom: 1px solid #e1e4e8;">Tổng giá trị hợp đồng:</td>' +
      '    <td style="padding: 8px 12px; color: #1f2328; font-weight: 600; border-bottom: 1px solid #e1e4e8;">' + totalAmount.toLocaleString("vi-VN") + ' VNĐ <span style="font-size: 12px; font-weight: normal; color: #57606a;">(Còn lại khi bàn giao: <b>' + remainingAmount.toLocaleString("vi-VN") + ' VNĐ</b>)</span></td>' +
      '  </tr>' +
      '  <tr>' +
      '    <td style="padding: 8px 12px; color: #57606a; border-bottom: 1px solid #e1e4e8;">Thời hạn bàn giao:</td>' +
      '    <td style="padding: 8px 12px; color: #1f2328; border-bottom: 1px solid #e1e4e8;">Trong vòng <b>' + deliveryDays + ' ngày</b> kể từ thời điểm ký cọc</td>' +
      '  </tr>' +
      '  <tr>' +
      '    <td style="padding: 8px 12px; color: #57606a;">Dự kiến bàn giao chính thức:</td>' +
      '    <td style="padding: 8px 12px; color: #cf222e; font-weight: 700; font-size: 14px;">' + deliveryDateStr + '</td>' +
      '  </tr>' +
      '</table>' +
      '<div style="background: #f6f8fa; border: 1px solid #d0d7de; border-left: 3px solid #0969da; padding: 12px 16px; border-radius: 4px; margin: 18px 0; font-size: 13px; color: #24292f; line-height: 1.6;">' +
      '  <b>Quy trình bàn giao &amp; cấp tài khoản:</b> Đối với Hợp đồng đặt cọc, hệ thống <b>chưa cấp Mã Code và Mật khẩu đăng nhập</b> tại thời điểm này nhằm đảm bảo hoàn thiện phân hệ cá nhân hóa theo đúng tiến độ. Đúng ngày hẹn bàn giao (<b>' + deliveryDateStr + '</b>), sau khi Quý khách hoàn tất thanh toán phần còn lại và Kỹ sư đối soát thành công, hệ thống sẽ gửi tiếp thư thông báo kèm đầy đủ thông tin tài khoản và Biên bản bàn giao chính thức.' +
      '</div>' +
      buildPaymentQrBoxHtml(depositAmount, (fullName.replace(/[^a-zA-Z0-9]/g, "") + " COC " + (idCardNumber || "")).trim().toUpperCase()) +
      buildQuoteAndThanksHtml() +
      '<p style="margin: 16px 0 0 0; font-size: 13px; color: #57606a;">' +
      '  <b>Tệp tin đính kèm:</b> Bản mềm Hợp đồng đặt cọc (PDF có đầy đủ điều khoản pháp lý và dấu mộc đỏ tròn của Trưởng ban KS. Nguyễn Hoàng Thiện) được đính kèm trực tiếp dưới thư này để Quý khách đối soát và lưu trữ.' +
      '</p>';

    var emailBodyHtml = wrapEmailInCorporateLayout(
      "BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO — PHÊ DUYỆT HỢP ĐỒNG ĐẶT CỌC",
      "XÁC NHẬN KÝ KẾT HỢP ĐỒNG ĐẶT CỌC & HẸN NGÀY BÀN GIAO",
      contentHtml
    );

    var qrBlob = getTimoQrBlob();
    var emailOptions = {
      to: email,
      subject: subject,
      htmlBody: emailBodyHtml,
      attachments: [pdfBlob]
    };
    if (qrBlob) {
      emailOptions.inlineImages = {
        paymentQrCode: qrBlob
      };
    }

    MailApp.sendEmail(emailOptions);
    return { success: true };
  } catch (err) {
    Logger.log("Lỗi gửi Gmail đặt cọc: " + err);
    return { success: false, error: err.toString() };
  }
}

/**
 * Gửi Gmail Phê Duyệt Thanh Toán 100% (Cấp đủ Code + Pass + File Hợp đồng PDF có mộc đỏ + QR Code)
 */
function sendFullApprovalEmail(email, fullName, idCardNumber, dob, gender, phone, address, code, password, category, packageName, totalAmount) {
  try {
    var subject = "[SYNAPES Studio] Thông tin tài khoản đăng nhập & Hợp đồng dịch vụ — Mã: " + code;

    var htmlContract = generateContractHtmlContent(
      fullName, dob, gender, phone, address, code, email,
      idCardNumber, packageName, 0, totalAmount, 0, false
    );

    var pdfBlob = Utilities.newBlob(htmlContract, "text/html", "HOP_DONG_DICH_VU_SYNAPES_" + code + ".html")
      .getAs("application/pdf")
      .setName("HOP_DONG_DICH_VU_SYNAPES_" + code + ".pdf");

    var cccdRow = idCardNumber
      ? '      <tr>' +
        '        <td style="padding: 8px 12px; color: #57606a; border-bottom: 1px solid #e1e4e8; width: 40%;">Số CCCD / CMND:</td>' +
        '        <td style="padding: 8px 12px; color: #1f2328; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 600; border-bottom: 1px solid #e1e4e8;">' + idCardNumber + '</td>' +
        '      </tr>'
      : '';

    var contentHtml =
      '<p style="margin: 0 0 14px 0; font-size: 14.5px;">Kính gửi Quý khách hàng <b>' + fullName + '</b>,</p>' +
      '<p style="margin: 0 0 16px 0; font-size: 14px; color: #32383f; line-height: 1.6;">' +
      '  Hồ sơ đăng ký và <b>Hợp đồng dịch vụ điện tử chính thức</b> sử dụng nền tảng <b>SYNAPES Studio</b> của Quý khách đã được <b>KS. Nguyễn Hoàng Thiện</b> (Trưởng ban Chuyển đổi số &amp; Trí tuệ nhân tạo) phê duyệt thành công.' +
      '</p>' +
      '<!-- BẢNG THÔNG TIN ĐĂNG NHẬP -->' +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 18px 0; border: 1px solid #d0d7de; border-radius: 6px; background: #f6f8fa; overflow: hidden;">' +
      '  <tr>' +
      '    <td style="padding: 10px 16px; background: #eaeef2; border-bottom: 1px solid #d0d7de;">' +
      '      <div style="font-size: 11px; font-weight: 700; color: #57606a; text-transform: uppercase; letter-spacing: 0.6px;">' +
      '        THÔNG TIN TÀI KHOẢN ĐĂNG NHẬP CHÍNH THỨC' +
      '      </div>' +
      '    </td>' +
      '  </tr>' +
      '  <tr>' +
      '    <td style="padding: 18px 16px;">' +
      '      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 13.5px;">' +
      '        <tr>' +
      '          <td style="padding: 6px 0; color: #57606a; width: 140px;">Cổng làm việc:</td>' +
      '          <td style="padding: 6px 0;"><a href="https://synapes-auto-tool-web-service.onrender.com" target="_blank" style="color: #0969da; font-weight: 600; text-decoration: none;">https://synapes-auto-tool-web-service.onrender.com</a></td>' +
      '        </tr>' +
      '        <tr>' +
      '          <td style="padding: 6px 0; color: #57606a;">Mã Code Đăng Nhập:</td>' +
      '          <td style="padding: 6px 0;"><span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px; font-weight: 700; color: #0969da; background: #ddf4ff; border: 1px solid #b6e3ff; padding: 2px 8px; border-radius: 4px; display: inline-block;">' + code + '</span></td>' +
      '        </tr>' +
      '        <tr>' +
      '          <td style="padding: 6px 0; color: #57606a;">Mật Khẩu Mặc Định:</td>' +
      '          <td style="padding: 6px 0;"><span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px; font-weight: 700; color: #cf222e; background: #ffebe9; border: 1px solid #ffcecb; padding: 2px 8px; border-radius: 4px; display: inline-block;">' + password + '</span></td>' +
      '        </tr>' +
      '      </table>' +
      '      <div style="margin-top: 14px; text-align: center;">' +
      '        <a href="https://synapes-auto-tool-web-service.onrender.com" target="_blank" style="display: inline-block; background: #1f2328; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 24px; border-radius: 6px;">Truy Cập SYNAPES Studio &rarr;</a>' +
      '      </div>' +
      '    </td>' +
      '  </tr>' +
      '</table>' +
      '<!-- HƯỚNG DẪN BẢO MẬT -->' +
      '<div style="background: #ffffff; border: 1px solid #d0d7de; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 12.5px; color: #57606a; line-height: 1.6;">' +
      '  <b>Quy định bảo mật &amp; tài khoản:</b> Sau khi đăng nhập bằng mã Code và mật khẩu mặc định, Quý khách vui lòng vào mục Cài đặt để thiết lập mật khẩu cá nhân mới. Mật khẩu được mã hóa an toàn một chiều (bcrypt). Nếu quên mật khẩu, sử dụng tính năng <i>"Quên mật khẩu?"</i> trên giao diện đăng nhập bằng đúng Gmail và SĐT đăng ký.' +
      '</div>' +
      '<!-- TÓM TẮT HỢP ĐỒNG -->' +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #d0d7de; border-radius: 6px; overflow: hidden; font-size: 13.5px;">' +
      '  <tr style="background: #f6f8fa;">' +
      '    <th colspan="2" style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; color: #57606a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #d0d7de;">' +
      '      CHI TIẾT HỢP ĐỒNG DỊCH VỤ CHÍNH THỨC' +
      '    </th>' +
      '  </tr>' +
      '  <tr>' +
      '    <td style="padding: 8px 12px; color: #57606a; border-bottom: 1px solid #e1e4e8; width: 40%;">Gói dịch vụ đã ký:</td>' +
      '    <td style="padding: 8px 12px; color: #1f2328; font-weight: 600; border-bottom: 1px solid #e1e4e8;">' + packageName + ' (' + category + ')</td>' +
      '  </tr>' +
      cccdRow +
      '  <tr>' +
      '    <td style="padding: 8px 12px; color: #57606a; border-bottom: 1px solid #e1e4e8;">Tổng giá trị thanh toán:</td>' +
      '    <td style="padding: 8px 12px; color: #1a7f37; font-weight: 700; font-size: 15px; border-bottom: 1px solid #e1e4e8;">' + totalAmount.toLocaleString("vi-VN") + ' VNĐ (Thanh toán 100%)</td>' +
      '  </tr>' +
      '  <tr>' +
      '    <td style="padding: 8px 12px; color: #57606a;">Thời hạn &amp; quyền hạn:</td>' +
      '    <td style="padding: 8px 12px; color: #1a7f37; font-weight: 600;">Kích hoạt vĩnh viễn &bull; Hạn mức chức năng tối đa</td>' +
      '  </tr>' +
      '</table>' +
      buildPaymentQrBoxHtml(totalAmount, (fullName.replace(/[^a-zA-Z0-9]/g, "") + " FULL " + code).trim().toUpperCase()) +
      buildQuoteAndThanksHtml() +
      '<p style="margin: 16px 0 0 0; font-size: 13px; color: #57606a;">' +
      '  <b>Tệp tin đính kèm:</b> Bản mềm Hợp đồng dịch vụ điện tử chính thức (PDF có đầy đủ điều khoản pháp lý và dấu mộc đỏ tròn của Trưởng ban KS. Nguyễn Hoàng Thiện) được đính kèm trực tiếp dưới thư này để Quý khách lưu trữ.' +
      '</p>';

    var emailBodyHtml = wrapEmailInCorporateLayout(
      "BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO — PHÊ DUYỆT TÀI KHOẢN CHÍNH THỨC",
      "THÔNG BÁO CẤP TÀI KHOẢN ĐĂNG NHẬP & HỢP ĐỒNG DỊCH VỤ",
      contentHtml
    );

    var qrBlob = getTimoQrBlob();
    var emailOptions = {
      to: email,
      subject: subject,
      htmlBody: emailBodyHtml,
      attachments: [pdfBlob]
    };
    if (qrBlob) {
      emailOptions.inlineImages = {
        paymentQrCode: qrBlob
      };
    }

    MailApp.sendEmail(emailOptions);
    return { success: true };
  } catch (err) {
    Logger.log("Lỗi gửi Gmail phê duyệt 100%: " + err);
    return { success: false, error: err.toString() };
  }
}

/**
 * Gửi Gmail Bàn Giao Sản Phẩm Lần 2 (Cấp Mã + Pass sau khi Kỹ sư duyệt Cột 18 cho HĐ Đặt cọc)
 */
function sendFinalHandoverEmail(email, fullName, idCardNumber, dob, gender, phone, address, code, password, category, packageName, totalAmount) {
  try {
    var subject = "[SYNAPES Studio] Biên bản bàn giao hệ thống & Kích hoạt tài khoản — Mã: " + code;

    var htmlContract = generateContractHtmlContent(
      fullName, dob, gender, phone, address, code, email,
      idCardNumber, packageName, 0, totalAmount, 0, false
    );

    var pdfBlob = Utilities.newBlob(htmlContract, "text/html", "BIEN_BAN_BAN_GIAO_SYNAPES_" + code + ".html")
      .getAs("application/pdf")
      .setName("BIEN_BAN_BAN_GIAO_SYNAPES_" + code + ".pdf");

    var cccdRow = idCardNumber
      ? '      <tr>' +
        '        <td style="padding: 8px 12px; color: #57606a; border-bottom: 1px solid #e1e4e8; width: 40%;">Số CCCD / CMND:</td>' +
        '        <td style="padding: 8px 12px; color: #1f2328; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 600; border-bottom: 1px solid #e1e4e8;">' + idCardNumber + '</td>' +
        '      </tr>'
      : '';

    var contentHtml =
      '<p style="margin: 0 0 14px 0; font-size: 14.5px;">Kính gửi Quý khách hàng <b>' + fullName + '</b>,</p>' +
      '<p style="margin: 0 0 16px 0; font-size: 14px; color: #32383f; line-height: 1.6;">' +
      '  Hệ thống sản xuất video tự động <b>SYNAPES Studio</b> của Quý khách theo Hợp đồng đặt cọc đã được đội ngũ Kỹ sư hoàn tất triển khai, kiểm thử tối ưu hóa và xác nhận hoàn tất thanh toán đủ 100%.' +
      '</p>' +
      '<!-- BẢNG THÔNG TIN ĐĂNG NHẬP -->' +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 18px 0; border: 1px solid #d0d7de; border-radius: 6px; background: #f6f8fa; overflow: hidden;">' +
      '  <tr>' +
      '    <td style="padding: 10px 16px; background: #eaeef2; border-bottom: 1px solid #d0d7de;">' +
      '      <div style="font-size: 11px; font-weight: 700; color: #57606a; text-transform: uppercase; letter-spacing: 0.6px;">' +
      '        TÀI KHOẢN TRUY CẬP HỆ THỐNG ĐÃ KÍCH HOẠT' +
      '      </div>' +
      '    </td>' +
      '  </tr>' +
      '  <tr>' +
      '    <td style="padding: 18px 16px;">' +
      '      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 13.5px;">' +
      '        <tr>' +
      '          <td style="padding: 6px 0; color: #57606a; width: 140px;">Cổng làm việc:</td>' +
      '          <td style="padding: 6px 0;"><a href="https://synapes-auto-tool-web-service.onrender.com" target="_blank" style="color: #0969da; font-weight: 600; text-decoration: none;">https://synapes-auto-tool-web-service.onrender.com</a></td>' +
      '        </tr>' +
      '        <tr>' +
      '          <td style="padding: 6px 0; color: #57606a;">Mã Code Đăng Nhập:</td>' +
      '          <td style="padding: 6px 0;"><span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px; font-weight: 700; color: #0969da; background: #ddf4ff; border: 1px solid #b6e3ff; padding: 2px 8px; border-radius: 4px; display: inline-block;">' + code + '</span></td>' +
      '        </tr>' +
      '        <tr>' +
      '          <td style="padding: 6px 0; color: #57606a;">Mật Khẩu Mặc Định:</td>' +
      '          <td style="padding: 6px 0;"><span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px; font-weight: 700; color: #cf222e; background: #ffebe9; border: 1px solid #ffcecb; padding: 2px 8px; border-radius: 4px; display: inline-block;">' + password + '</span></td>' +
      '        </tr>' +
      '        <tr>' +
      '          <td style="padding: 6px 0; color: #57606a;">Trạng thái:</td>' +
      '          <td style="padding: 6px 0;"><span style="color: #1a7f37; font-weight: 700;">ĐÃ BÀN GIAO TOÀN DIỆN &bull; KÍCH HOẠT VĨNH VIỄN</span></td>' +
      '        </tr>' +
      '      </table>' +
      '      <div style="margin-top: 14px; text-align: center;">' +
      '        <a href="https://synapes-auto-tool-web-service.onrender.com" target="_blank" style="display: inline-block; background: #1f2328; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 24px; border-radius: 6px;">Bắt Đầu Sử Dụng SYNAPES Studio &rarr;</a>' +
      '      </div>' +
      '    </td>' +
      '  </tr>' +
      '</table>' +
      '<!-- TÓM TẮT BÀN GIAO -->' +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #d0d7de; border-radius: 6px; overflow: hidden; font-size: 13.5px;">' +
      '  <tr style="background: #f6f8fa;">' +
      '    <th colspan="2" style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; color: #57606a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #d0d7de;">' +
      '      THÔNG TIN BIÊN BẢN BÀN GIAO' +
      '    </th>' +
      '  </tr>' +
      '  <tr>' +
      '    <td style="padding: 8px 12px; color: #57606a; border-bottom: 1px solid #e1e4e8; width: 40%;">Gói giải pháp:</td>' +
      '    <td style="padding: 8px 12px; color: #1f2328; font-weight: 600; border-bottom: 1px solid #e1e4e8;">' + packageName + ' (' + category + ')</td>' +
      '  </tr>' +
      cccdRow +
      '  <tr>' +
      '    <td style="padding: 8px 12px; color: #57606a; border-bottom: 1px solid #e1e4e8;">Tổng giá trị bàn giao:</td>' +
      '    <td style="padding: 8px 12px; color: #1a7f37; font-weight: 700; font-size: 15px; border-bottom: 1px solid #e1e4e8;">' + totalAmount.toLocaleString("vi-VN") + ' VNĐ (Xác nhận hoàn tất 100%)</td>' +
      '  </tr>' +
      '  <tr>' +
      '    <td style="padding: 8px 12px; color: #57606a;">Chính sách bảo hành:</td>' +
      '    <td style="padding: 8px 12px; color: #1f2328;">Bảo hành &amp; hỗ trợ kỹ thuật toàn thời gian</td>' +
      '  </tr>' +
      '</table>' +
      buildPaymentQrBoxHtml(totalAmount, (fullName.replace(/[^a-zA-Z0-9]/g, "") + " HANDOVER " + code).trim().toUpperCase()) +
      buildQuoteAndThanksHtml() +
      '<p style="margin: 16px 0 0 0; font-size: 13px; color: #57606a;">' +
      '  <b>Tệp tin đính kèm:</b> Bản mềm Biên bản bàn giao &amp; Hợp đồng dịch vụ hoàn chỉnh (PDF có dấu mộc đỏ tròn của Trưởng ban KS. Nguyễn Hoàng Thiện) được đính kèm trực tiếp dưới thư này.' +
      '</p>';

    var emailBodyHtml = wrapEmailInCorporateLayout(
      "BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO — BIÊN BẢN BÀN GIAO CHÍNH THỨC",
      "BIÊN BẢN BÀN GIAO HỆ THỐNG & KÍCH HOẠT TÀI KHOẢN",
      contentHtml
    );

    var qrBlob = getTimoQrBlob();
    var emailOptions = {
      to: email,
      subject: subject,
      htmlBody: emailBodyHtml,
      attachments: [pdfBlob]
    };
    if (qrBlob) {
      emailOptions.inlineImages = {
        paymentQrCode: qrBlob
      };
    }

    MailApp.sendEmail(emailOptions);
    return { success: true };
  } catch (err) {
    Logger.log("Lỗi gửi Gmail bàn giao: " + err);
    return { success: false, error: err.toString() };
  }
}

/**
 * Gửi Gmail Cấp Lại Mật Khẩu
 */
function sendForgotPasswordEmail(email, fullName, code, newPassword) {
  try {
    var subject = "[SYNAPES Studio] Cấp lại mật khẩu mặc định — Mã: " + code;
    var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

    var contentHtml =
      '<p style="margin: 0 0 14px 0; font-size: 14.5px;">Kính gửi <b>' + (fullName || "Quý khách hàng") + '</b>,</p>' +
      '<p style="margin: 0 0 16px 0; font-size: 14px; color: #32383f; line-height: 1.6;">' +
      '  Hệ thống đã tiếp nhận yêu cầu đặt lại mật khẩu và đối soát chính xác thông tin đăng ký của bạn vào lúc <b>' + nowStr + '</b>.' +
      '</p>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 18px 0; border: 1px solid #d0d7de; border-radius: 6px; background: #f6f8fa; overflow: hidden;">' +
      '  <tr>' +
      '    <td style="padding: 10px 16px; background: #eaeef2; border-bottom: 1px solid #d0d7de;">' +
      '      <div style="font-size: 11px; font-weight: 700; color: #57606a; text-transform: uppercase; letter-spacing: 0.6px;">' +
      '        THÔNG TIN XÁC THỰC MẬT KHẨU MỚI' +
      '      </div>' +
      '    </td>' +
      '  </tr>' +
      '  <tr>' +
      '    <td style="padding: 18px 16px;">' +
      '      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 13.5px;">' +
      '        <tr>' +
      '          <td style="padding: 6px 0; color: #57606a; width: 140px;">Mã Code Đăng Nhập:</td>' +
      '          <td style="padding: 6px 0;"><span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px; font-weight: 700; color: #0969da; background: #ddf4ff; border: 1px solid #b6e3ff; padding: 2px 8px; border-radius: 4px; display: inline-block;">' + code + '</span></td>' +
      '        </tr>' +
      '        <tr>' +
      '          <td style="padding: 6px 0; color: #57606a;">Mật Khẩu Mặc Định Mới:</td>' +
      '          <td style="padding: 6px 0;"><span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px; font-weight: 700; color: #cf222e; background: #ffebe9; border: 1px solid #ffcecb; padding: 2px 8px; border-radius: 4px; display: inline-block;">' + newPassword + '</span></td>' +
      '        </tr>' +
      '      </table>' +
      '      <div style="margin-top: 14px; text-align: center;">' +
      '        <a href="https://synapes-auto-tool-web-service.onrender.com" target="_blank" style="display: inline-block; background: #1f2328; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 24px; border-radius: 6px;">Đăng Nhập Ngay &rarr;</a>' +
      '      </div>' +
      '    </td>' +
      '  </tr>' +
      '</table>' +
      '<div style="background: #ffffff; border: 1px solid #d0d7de; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 12.5px; color: #57606a; line-height: 1.6;">' +
      '  <b>Lưu ý:</b> Vì lý do an toàn, Quý khách vui lòng đăng nhập và đổi sang mật khẩu riêng ngay trong phiên làm việc đầu tiên.' +
      '</div>' +
      buildPaymentQrBoxHtml(0, ("SYNAPES " + code).trim().toUpperCase()) +
      buildQuoteAndThanksHtml();

    var emailBodyHtml = wrapEmailInCorporateLayout(
      "BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO — BẢO MẬT TÀI KHOẢN",
      "XÁC THỰC CẤP LẠI MẬT KHẨU MẶC ĐỊNH THÀNH CÔNG",
      contentHtml
    );

    var qrBlob = getTimoQrBlob();
    var emailOptions = {
      to: email,
      subject: subject,
      htmlBody: emailBodyHtml
    };
    if (qrBlob) {
      emailOptions.inlineImages = {
        paymentQrCode: qrBlob
      };
    }

    MailApp.sendEmail(emailOptions);
    return { success: true };
  } catch (err) {
    Logger.log("Lỗi gửi mail quên mật khẩu: " + err);
    return { success: false, error: err.toString() };
  }
}

/**
 * 8. TẠO NỘI DUNG HTML HỢP ĐỒNG ĐẦY ĐỦ KÈM CON DẤU ĐỎ TRƯỞNG BAN ĐỂ XUẤT FILE PDF ĐÍNH KÈM GMAIL
 */
function generateContractHtmlContent(fullName, dob, gender, phone, address, code, email, idCardNumber, packageName, depositAmount, totalAmount, deliveryDays, isDepositContract) {
  var now = new Date();
  var day = Utilities.formatDate(now, "GMT+7", "dd");
  var month = Utilities.formatDate(now, "GMT+7", "MM");
  var year = Utilities.formatDate(now, "GMT+7", "yyyy");
  var dateStr = day + "/" + month + "/" + year;

  var depositVal = Number(depositAmount) || 0;
  var totalVal = Number(totalAmount) || 0;
  var daysVal = Number(deliveryDays) || 0;
  var pkgName = packageName || "Hợp đồng dịch vụ phần mềm SYNAPES Studio";
  var cccd = idCardNumber || "";

  var contractTitle = isDepositContract
    ? "HỢP ĐỒNG ĐẶT CỌC DỰ ÁN & BÀN GIAO HỆ THỐNG CÔNG NGHỆ"
    : (pkgName.toLowerCase().indexOf("toàn hệ") !== -1
      ? "HỢP ĐỒNG DỊCH VỤ TOÀN HỆ & BÀN GIAO HỆ THỐNG CHÍNH THỨC"
      : "HỢP ĐỒNG ĐIỆN TỬ CUNG CẤP & SỬ DỤNG DỊCH VỤ PHẦN MỀM");

  var contractSubtitle = isDepositContract
    ? "THỎA THUẬN KÝ KẾT ĐẶT CỌC & CAM KẾT TIẾN ĐỘ BÀN GIAO PHẦN MỀM"
    : "NỀN TẢNG SẢN XUẤT VIDEO TỰ ĐỘNG SYNAPES STUDIO (BẢN CHÍNH THỨC)";

  // Con dấu đỏ tròn Trưởng ban: Nhúng trực tiếp Base64 chuẩn tách nền (Không dùng hộp chữ nhật)
  var stampImgHtml = '<div style="height: 140px; margin: 4px auto; text-align: center;">' +
    '<img src="' + ROUND_STAMP_BASE64 + '" width="135" height="135" style="width: 135px; height: 135px; object-fit: contain; margin: 0 auto; display: block; transform: rotate(-1.5deg);" alt="Con dấu Trưởng ban KS. Nguyễn Hoàng Thiện" />' +
    '</div>';

  return '<!DOCTYPE html>' +
    '<html><head><meta charset="utf-8">' +
    '<style>' +
    '@page { size: A4; margin: 16mm 18mm 16mm 18mm; }' +
    'body { font-family: "Times New Roman", Times, serif; font-size: 10.5pt; line-height: 1.42; color: #111827; margin: 0; padding: 0; }' +
    '.header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }' +
    '.header-table td { text-align: center; vertical-align: top; }' +
    '.title { text-align: center; margin: 12px 0; }' +
    '.title h1 { font-size: 13pt; margin: 0; text-transform: uppercase; color: #0f172a; }' +
    '.title h2 { font-size: 11pt; margin: 3px 0; color: #1e293b; }' +
    '.legal { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 8.8pt; margin-bottom: 10px; border-radius: 4px; }' +
    '.party-box { border: 1px solid #e2e8f0; padding: 7px 12px; margin-bottom: 8px; border-radius: 4px; }' +
    '.financial-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 12px; margin: 8px 0; border-radius: 4px; font-size: 9.5pt; }' +
    '.section { font-weight: bold; font-size: 10.8pt; margin-top: 9px; margin-bottom: 3px; color: #0f172a; }' +
    'p { margin: 4px 0; text-align: justify; text-indent: 20px; }' +
    '.sign-table { width: 100%; border-collapse: collapse; margin-top: 22px; page-break-inside: avoid; }' +
    '.sign-table td { width: 50%; text-align: center; vertical-align: top; }' +
    '</style></head><body>' +
    '<table class="header-table"><tr>' +
    '  <td style="width: 46%;"><b>HỆ THỐNG CÔNG NGHỆ SYNAPES</b><br/><b>BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO</b><br/><small>Số: 05/2026/HĐĐT-SYNAPES</small></td>' +
    '  <td style="width: 54%;"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br/><b>Độc lập - Tự do - Hạnh phúc</b><br/><small><i>Thành phố Hồ Chí Minh, ngày ' + day + ' tháng ' + month + ' năm ' + year + '</i></small></td>' +
    '</tr></table>' +
    '<div class="title">' +
    '  <h1>' + contractTitle + '</h1>' +
    '  <h2>' + contractSubtitle + '</h2>' +
    '  <small><i>(Mã định danh hợp đồng điện tử: ' + code + ')</i></small>' +
    '</div>' +
    '<div class="legal">' +
    '  <b>CĂN CỨ PHÁP LÝ THI HÀNH:</b><br/>' +
    '  - Bộ luật Dân sự số 91/2015/QH13; Luật Giao dịch điện tử số 20/2023/QH15; Luật Công nghệ thông tin số 67/2006/QH11;<br/>' +
    '  - Luật An ninh mạng số 24/2018/QH14; Luật Sở hữu trí tuệ số 50/2005/QH11 & Luật sửa đổi số 07/2022/QH15;<br/>' +
    '  - Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân; Nghị định số 147/2024/NĐ-CP về quản lý dịch vụ Internet.' +
    '</div>' +
    '<p style="text-indent: 0;">Hôm nay, ngày <b>' + dateStr + '</b>, tại Thành phố Hồ Chí Minh (Hệ thống Nền tảng Đám mây SYNAPES Studio), hai bên chúng tôi gồm:</p>' +
    '<div class="party-box">' +
    '  <b>BÊN A: BÊN CUNG CẤP DỊCH VỤ NỀN TẢNG (SYNAPES STUDIO)</b><br/>' +
    '  • Đơn vị phát triển: Nền tảng Tự động hóa Nội dung số SYNAPES Studio<br/>' +
    '  • Đại diện giao dịch: <b>KS. NGUYỄN HOÀNG THIỆN</b> &nbsp;|&nbsp; Chức vụ: <b>Trưởng ban Chuyển đổi số & Trí tuệ nhân tạo</b><br/>' +
    '  • Hộp thư điện tử: nguyenhoangthien.hvt.15@gmail.com &nbsp;|&nbsp; Cổng dịch vụ: https://synapes-auto-tool-web-service.onrender.com' +
    '</div>' +
    '<div class="party-box">' +
    '  <b>BÊN B: BÊN MUA HÀNG VÀ SỬ DỤNG DỊCH VỤ (KHÁCH HÀNG)</b><br/>' +
    '  • Họ và tên khách hàng: <b>' + fullName + '</b> &nbsp;|&nbsp; ' + (cccd ? ('Số CCCD / CMND: <b>' + cccd + '</b> &nbsp;|&nbsp; ') : '') + 'Ngày sinh: ' + dob + ' &nbsp;|&nbsp; Giới tính: ' + (gender || "Nam") + '<br/>' +
    '  • Số điện thoại: ' + phone + ' &nbsp;|&nbsp; Gmail đăng ký: ' + (email || "") + '<br/>' +
    '  • Địa chỉ hiện tại: ' + address +
    '</div>' +
    (depositVal > 0 || totalVal > 0 ? (
      '<div class="financial-box">' +
      '  <b>ĐIỀU KHOẢN TÀI CHÍNH & TIẾN ĐỘ BÀN GIAO:</b><br/>' +
      '  • Gói hợp đồng đã chọn: <b>' + pkgName + '</b><br/>' +
      (depositVal > 0 ? ('  • Tiền đặt cọc dự án: <span style="color: #15803d; font-weight: bold;">' + depositVal.toLocaleString("vi-VN") + ' VNĐ</span> &nbsp;|&nbsp; Tổng giá trị toàn vẹn: <b>' + totalVal.toLocaleString("vi-VN") + ' VNĐ</b><br/>') : ('  • Tổng giá trị hợp đồng thanh toán trọn gói: <span style="color: #15803d; font-weight: bold;">' + totalVal.toLocaleString("vi-VN") + ' VNĐ</span><br/>')) +
      (daysVal > 0 ? ('  • Thời hạn bàn giao sản phẩm: Bên A có nghĩa vụ bàn giao hệ thống đúng thời hạn trong vòng <b>' + daysVal + ' ngày</b> kể từ thời điểm ký đặt cọc.<br/>') : '') +
      '  • Phương thức thanh toán: Chuyển khoản ngân hàng <b>' + TIMO_BANK_INFO.bankName + '</b>, STK: <b>' + TIMO_BANK_INFO.accountNumber + '</b> (' + TIMO_BANK_INFO.accountHolder + ').' +
      '</div>'
    ) : '') +
    '<div class="section">Điều 1. Quy chế cung cấp, quyền hạn và chức năng phần mềm SYNAPES Studio</div>' +
    '<p>1.1. Bên A cung cấp giải pháp công nghệ tự động hóa sản xuất nội dung số SYNAPES Studio cho Bên B với Mã định danh hợp đồng <b>' + code + '</b>.</p>' +
    '<p>1.2. Quyền hạn và phân hệ chức năng: Tự động hóa tạo - đăng tải tuân thủ cấu trúc đa tầng; biên tập chuyên nghiệp khuôn mẫu 16:9 và 9:16 (Shorts/Reels); báo cáo đánh giá xu hướng và dữ liệu thời gian thực; hệ thống an toàn thông tin chuẩn DMCA và mã hóa AES-256; cập nhật mở rộng tính năng theo thời gian thực.</p>' +
    '<div class="section">Điều 2. Cam kết bảo mật dữ liệu cá nhân & an toàn Token API</div>' +
    '<p>2.1. Tuân thủ Nghị định 13/2023/NĐ-CP, Bên A áp dụng chuẩn mã hóa bảo vệ toàn diện dữ liệu và khóa kết nối API của Bên B; cam kết không tiết lộ cho bên thứ ba dưới mọi hình thức.</p>' +
    '<div class="section">Điều 3. Quyền sở hữu trí tuệ đối với kịch bản và sản phẩm video</div>' +
    '<p>3.1. Căn cứ Luật Sở hữu trí tuệ và Công ước Berne: Bên B là chủ sở hữu quyền tác giả duy nhất và toàn vẹn 100% đối với toàn bộ kịch bản và video thành phẩm được tạo ra từ hệ thống.</p>' +
    '<div class="section">Điều 4. Thời hạn hợp đồng, cam kết bảo hành và Miễn trừ trách nhiệm</div>' +
    '<p>4.1. Thời hạn và giá trị hợp đồng có tính chất vĩnh viễn. Bên A cam kết bảo hành và cung cấp giải pháp kỹ thuật toàn thời gian, đảm bảo tính chính thống và vận hành ổn định của hệ thống.</p>' +
    '<p>4.2. Quyền miễn trừ trách nhiệm và rủi ro: Bên B tự quản lý các khóa kết nối API bên thứ ba, tự chịu trách nhiệm về tính hợp pháp của âm thanh, hình ảnh và nội dung do Bên B chủ động tải lên hoặc xuất bản theo quy định pháp luật.</p>' +
    '<div class="section">Điều 5. Hiệu lực hợp đồng</div>' +
    '<p>5.1. Hợp đồng điện tử này có giá trị pháp lý tương đương hợp đồng giấy theo Điều 13 và Điều 34 Luật Giao dịch điện tử số 20/2023/QH15.</p>' +
    '<table class="sign-table"><tr>' +
    '  <td><b>ĐẠI DIỆN MUA HÀNG (BÊN B)</b><br/><i>(Đã ký xác nhận điện tử)</i><br/><br/><div style="border: 1px dashed #15803d; color: #15803d; display: inline-block; padding: 6px 12px; font-size: 8.5pt; font-weight: bold; margin: 10px 0;">ĐÃ KÝ XÁC NHẬN ĐIỆN TỬ<br/>Ngày: ' + dateStr + '</div><br/><b>' + fullName.toUpperCase() + '</b></td>' +
    '  <td><b>ĐẠI DIỆN GIAO DỊCH (BÊN A)</b><br/><b>TRƯỞNG BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO</b><br/><i>(Ký, đóng dấu xác thực điện tử)</i><br/>' + stampImgHtml + '<div style="margin-top: 4px; font-weight: bold;">KS. NGUYỄN HOÀNG THIỆN</div><div style="color: #b91c1c; font-size: 8.5pt; font-style: italic; margin-top: 2px;">✓ Đã ký &amp; đóng dấu Trưởng ban</div></td>' +
    '</tr></table>' +
    '</body></html>';
}

/**
 * 9. ĐỒNG BỘ TÀI KHOẢN SANG TRANG TÍNH "Quản Lý Mật Khẩu" (GID = 0)
 */
function syncAccountToMainSheet(code, name, email, password, phone, address, isReset) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getAccountsSheet(ss);
  if (!sheet) return;

  var maxRow = Math.max(sheet.getLastRow(), 5);
  var data = sheet.getRange(1, 1, maxRow, 9).getDisplayValues();

  var codeClean = String(code || "").trim().toUpperCase();
  var emailClean = String(email || "").trim().toLowerCase();
  var nameClean = String(name || "").trim().toLowerCase();

  var foundRow = -1;

  for (var i = 4; i < data.length; i++) {
    var rCode = String(data[i][1] || "").trim().toUpperCase();
    var rEmail = String(data[i][3] || "").trim().toLowerCase();
    var rName = String(data[i][2] || "").trim().toLowerCase();

    if (codeClean && rCode === codeClean) {
      foundRow = i + 1;
      break;
    }
    if (!codeClean && emailClean && rEmail === emailClean && (!nameClean || rName === nameClean)) {
      foundRow = i + 1;
      break;
    }
  }

  var targetRow = foundRow;
  var isNew = false;

  if (targetRow === -1) {
    isNew = true;
    for (var j = 4; j < data.length; j++) {
      var cellCode = String(data[j][1] || "").trim();
      var cellName = String(data[j][2] || "").trim();
      var cellEmail = String(data[j][3] || "").trim();
      if (cellCode === "" && cellName === "" && cellEmail === "") {
        targetRow = j + 1;
        break;
      }
    }
    if (targetRow === -1) {
      targetRow = maxRow + 1;
    }
  }

  var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm");
  var stt = targetRow - 4;

  var statusText = isReset
    ? "🔄 Đã cấp lại MK (" + nowStr + ")"
    : "🟢 Hoạt động (Chờ đổi MK)";

  var noteText = phone
    ? ("SĐT: " + phone + (address ? " | " + address : ""))
    : (address || "Đăng ký từ WebApp");

  sheet.getRange(targetRow, 1).setValue(stt).setHorizontalAlignment("center");
  sheet.getRange(targetRow, 2).setValue(codeClean).setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(targetRow, 3).setValue(name);
  sheet.getRange(targetRow, 4).setValue(email);
  sheet.getRange(targetRow, 5).setValue(password).setFontWeight("bold");
  sheet.getRange(targetRow, 6).setValue(nowStr).setHorizontalAlignment("center");

  if (sheet.getLastColumn() >= 7) {
    sheet.getRange(targetRow, 7).setValue(statusText);
  }

  if (sheet.getLastColumn() >= 9) {
    sheet.getRange(targetRow, 8).setValue("Pro Studio");
    sheet.getRange(targetRow, 9).setValue(noteText);
  } else if (sheet.getLastColumn() >= 8) {
    sheet.getRange(targetRow, 8).setValue(noteText);
  }
}

/**
 * 10. ĐỒNG BỘ TOÀN DIỆN DANH SÁCH TÀI KHOẢN ĐÃ DUYỆT
 */
function reconcileAllApprovedUsersToAccountsSheet(ss) {
  try {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    var uSheet = getUsersSheet(ss, false);
    if (!uSheet || uSheet.getLastRow() < 2) return;

    var is20 = isNew20ColsSheet(uSheet);
    var lastRow = uSheet.getLastRow();
    var maxCols = Math.max(uSheet.getLastColumn(), 20);
    var uData = uSheet.getRange(2, 1, lastRow - 1, maxCols).getDisplayValues();
    var uRaw = uSheet.getRange(2, 1, lastRow - 1, maxCols).getValues();

    for (var i = 0; i < uData.length; i++) {
      var rIdx = i + 2;
      var fullName = String(uData[i][2] || "").trim();
      var email = String(is20 ? uData[i][6] : uData[i][5] || "").trim();
      if (!fullName || !email) continue;

      var isChecked = is20
        ? (uRaw[i][14] === true || String(uData[i][14]).toUpperCase() === "TRUE" || uRaw[i][17] === true || String(uData[i][17]).toUpperCase() === "TRUE")
        : (uRaw[i][8] === true || String(uData[i][8]).toUpperCase() === "TRUE");

      var codeColIdx = is20 ? 15 : 9;
      var passColIdx = is20 ? 16 : 10;
      var phoneColIdx = is20 ? 7 : 6;
      var addrColIdx = is20 ? 8 : 7;

      var code = String(uData[i][codeColIdx] || "").trim();
      var pass = String(uData[i][passColIdx] || "").trim();
      var phone = String(uData[i][phoneColIdx] || "").trim();
      var address = String(uData[i][addrColIdx] || "").trim();

      if (isChecked || (code && code.indexOf("SNP_") === 0)) {
        if (code && code !== "(Chờ bàn giao)") {
          var uniqueCode = ensureUniqueUserCode(ss, code, rIdx, fullName);
          if (uniqueCode !== code) {
            code = uniqueCode;
            uSheet.getRange(rIdx, codeColIdx + 1).setValue(code);
          }
          syncAccountToMainSheet(code, fullName, email, pass || "SNP_DEFAULT", phone, address, false);
        }
      }
    }
  } catch (err) {
    Logger.log("reconcileAllApprovedUsersToAccountsSheet error: " + err);
  }
}

/**
 * 11. CÁC NÚT MENU XEM HỢP ĐỒNG & DUYỆT TRỰC TIẾP TRÊN SHEET
 */
function previewSelectedUserContractModal() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  if (!isUsersSheet(sheet)) {
    SpreadsheetApp.getUi().alert('⚠️ Vui lòng chuyển sang trang tính "THÔNG TIN NGƯỜI DÙNG" để xem Hợp đồng.');
    return;
  }

  var row = sheet.getActiveCell().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert("⚠️ Vui lòng chọn một dòng thông tin khách hàng (từ dòng 2 trở đi).");
    return;
  }

  var is20 = isNew20ColsSheet(sheet);
  var maxCols = Math.max(sheet.getLastColumn(), 20);
  var vals = sheet.getRange(row, 1, 1, maxCols).getDisplayValues()[0];

  var fullName = String(vals[2] || "").trim();
  var idCardNumber = is20 ? String(vals[3] || "").replace(/^'+/, "").trim() : "";
  var dob = is20 ? String(vals[4] || "") : String(vals[3] || "");
  var gender = is20 ? String(vals[5] || "Nam") : String(vals[4] || "Nam");
  var email = is20 ? String(vals[6] || "") : String(vals[5] || "");
  var phone = is20 ? String(vals[7] || "").replace(/^'+/, "") : String(vals[6] || "").replace(/^'+/, "");
  var address = is20 ? String(vals[8] || "") : String(vals[7] || "");
  var category = is20 ? String(vals[9] || "Hợp đồng cá nhân hóa") : "Hợp đồng cá nhân hóa";
  var packageName = is20 ? String(vals[10] || "") : "Gói Tiêu Chuẩn Studio";
  var depositStr = is20 ? String(vals[11] || "") : "0";
  var totalStr = is20 ? String(vals[12] || "") : "2550000";
  var deliveryStr = is20 ? String(vals[13] || "") : "0";
  var code = is20 ? String(vals[15] || "SNP_PREVIEW") : String(vals[9] || "SNP_PREVIEW");

  var depositAmount = parseFloat(depositStr.replace(/[^0-9]/g, "")) || 0;
  var totalAmount = parseFloat(totalStr.replace(/[^0-9]/g, "")) || 0;
  var deliveryDays = parseInt(deliveryStr.replace(/[^0-9]/g, "")) || 0;
  var isDeposit = depositAmount > 0;

  var htmlContent = generateContractHtmlContent(
    fullName, dob, gender, phone, address, code, email,
    idCardNumber, packageName, depositAmount, totalAmount, deliveryDays, isDeposit
  );

  var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(840)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, "📄 BẢN LƯU HỢP ĐỒNG PDF — " + fullName.toUpperCase());
}

function approveSelectedUserRow() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  if (!isUsersSheet(sheet)) {
    var uSheet = getUsersSheet(ss, false);
    if (uSheet) {
      ss.setActiveSheet(uSheet);
      sheet = uSheet;
    } else {
      SpreadsheetApp.getUi().alert('⚠️ Vui lòng chuyển sang trang tính "THÔNG TIN NGƯỜI DÙNG" để thực hiện!');
      return;
    }
  }

  var row = sheet.getActiveCell().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert("⚠️ Vui lòng chọn một dòng thông tin khách hàng (từ dòng 2 trở đi).");
    return;
  }

  installAutoEditTrigger(ss);
  var is20 = isNew20ColsSheet(sheet);
  if (!is20) {
    upgradeLegacySheetTo20Cols(sheet);
  }
  sheet.getRange(row, 15).setValue(true);
  processFirstApproval(sheet, row, true);
}

function approveSelectedFinalHandoverRow() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  if (!isUsersSheet(sheet)) {
    var uSheet = getUsersSheet(ss, false);
    if (uSheet) {
      ss.setActiveSheet(uSheet);
      sheet = uSheet;
    } else {
      SpreadsheetApp.getUi().alert('⚠️ Vui lòng chuyển sang trang tính "THÔNG TIN NGƯỜI DÙNG" để thực hiện!');
      return;
    }
  }

  var row = sheet.getActiveCell().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert("⚠️ Vui lòng chọn một dòng thông tin khách hàng (từ dòng 2 trở đi).");
    return;
  }

  installAutoEditTrigger(ss);
  var is20 = isNew20ColsSheet(sheet);
  if (!is20) {
    upgradeLegacySheetTo20Cols(sheet);
  }
  sheet.getRange(row, 18).setValue(true);
  processFinalHandoverApproval(sheet, row, true);
}

function approveAllPendingUsers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getUsersSheet(ss, false);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('⚠️ Chưa tìm thấy trang tính "THÔNG TIN NGƯỜI DÙNG".');
    return;
  }

  installAutoEditTrigger(ss);
  if (!isNew20ColsSheet(sheet)) {
    upgradeLegacySheetTo20Cols(sheet);
  }
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    SpreadsheetApp.getUi().alert("ℹ️ Hiện chưa có hồ sơ khách hàng nào trên bảng tính.");
    return;
  }

  var maxCols = Math.max(sheet.getLastColumn(), 20);
  var data = sheet.getRange(2, 1, lastRow - 1, maxCols).getDisplayValues();
  var count = 0;

  for (var i = 0; i < data.length; i++) {
    var fullName = String(data[i][2] || "").trim();
    var email = String(data[i][6] || "").trim();
    if (!fullName || !email || email.indexOf("@") === -1) continue;

    var mailStatus = String(data[i][18] || "").trim();

    if (mailStatus.indexOf("ĐÃ GỬI") === -1 && mailStatus.indexOf("ĐÃ BÀN GIAO") === -1) {
      var targetRow = i + 2;
      sheet.getRange(targetRow, 15).setValue(true);
      if (processFirstApproval(sheet, targetRow, true)) count++;
    }
  }

  SpreadsheetApp.getUi().alert("⚡ ĐÃ DUYỆT & GỬI GMAIL TỰ ĐỘNG CHO " + count + " HỒ SƠ KHÁCH HÀNG!");
}

/**
 * 12. WEBHOOK TIẾP NHẬN DỮ LIỆU TỪ WEBAPP
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  if (params.payload) {
    try {
      var parsedPayload = JSON.parse(params.payload);
      for (var k in parsedPayload) {
        if (parsedPayload.hasOwnProperty(k)) {
          params[k] = parsedPayload[k];
        }
      }
    } catch (ePayload) {}
  }
  var callback = params.callback;
  var action = params.action;

  if (action === "ping" || action === "health") {
    var response = { status: "ok", time: new Date().toISOString(), message: "SYNAPES Apps Script is alive" };
    if (callback) {
      return ContentService.createTextOutput(callback + "(" + JSON.stringify(response) + ")")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var result = processWebhookPayload(params);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + JSON.stringify(result) + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var payload = {};
  if (e && e.postData && e.postData.contents) {
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (err) {
      payload = (e && e.parameter) ? e.parameter : {};
    }
  } else if (e && e.parameter) {
    payload = e.parameter;
  }
  if (payload.payload) {
    try {
      var parsedPost = JSON.parse(payload.payload);
      for (var kp in parsedPost) {
        if (parsedPost.hasOwnProperty(kp)) {
          payload[kp] = parsedPost[kp];
        }
      }
    } catch (ePost) {}
  }

  var result = processWebhookPayload(payload);
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function processWebhookPayload(payload) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = String(payload.action || "").toLowerCase().trim();

    if (action === "register" || (!action && payload.email && (payload.fullName || payload.name))) {
      return handleUserRegistrationWebhook(ss, payload);
    }

    if (action === "forgot_password" || action === "reset_password") {
      return handleForgotPasswordWebhook(ss, payload);
    }

    if (action === "change_password") {
      return handleChangePasswordWebhook(ss, payload);
    }

    if (action === "emergency_report" || action === "system_health_report") {
      return recordEmergencyReportToSheetAndDrive(ss, payload);
    }

    if (action === "approve" || action === "approve_user" || action === "approve_first_stage") {
      var uSheet = getUsersSheet(ss, false);
      if (uSheet) {
        if (!isNew20ColsSheet(uSheet)) {
          upgradeLegacySheetTo20Cols(uSheet);
        }
        var target = findOrCreateUserRowByEmail(uSheet, payload.email, payload.fullName, true);
        if (target && target.row) {
          uSheet.getRange(target.row, 15).setValue(true);
          processFirstApproval(uSheet, target.row, true);
          return { status: "success", action: "approve_first_stage", row: target.row };
        }
      }
    }

    if (action === "approve_final_handover" || action === "approve_second_stage") {
      var uSheet = getUsersSheet(ss, false);
      if (uSheet) {
        if (!isNew20ColsSheet(uSheet)) {
          upgradeLegacySheetTo20Cols(uSheet);
        }
        var target = findOrCreateUserRowByEmail(uSheet, payload.email, payload.fullName, true);
        if (target && target.row) {
          uSheet.getRange(target.row, 18).setValue(true);
          processFinalHandoverApproval(uSheet, target.row, true);
          return { status: "success", action: "approve_final_handover", row: target.row };
        }
      }
    }

    return { status: "unknown_action", action: action };
  } catch (err) {
    Logger.log("processWebhookPayload error: " + err);
    return { status: "error", error: err.toString() };
  }
}

function findOrCreateUserRowByEmail(sheet, email, fullName, isApprovalLookup) {
  var maxRow = Math.max(sheet.getLastRow(), 2);
  var maxCols = Math.max(sheet.getLastColumn(), 20);
  var is20 = isNew20ColsSheet(sheet);
  var data = sheet.getRange(2, 1, maxRow - 1, maxCols).getDisplayValues();

  var emailClean = String(email || "").trim().toLowerCase();
  var nameClean = String(fullName || "").trim().toLowerCase();

  var emailColIdx = is20 ? 6 : 5;
  var codeColIdx = is20 ? 15 : 9;
  var approvedColIdx = is20 ? 14 : 8;

  if (emailClean) {
    for (var i = data.length - 1; i >= 0; i--) {
      var rowName = String(data[i][2] || "").trim().toLowerCase();
      var rowEmail = String(data[i][emailColIdx] || data[i][5] || "").trim().toLowerCase();
      var rowCode = String(data[i][codeColIdx] || "").trim();
      var isRowApproved = String(data[i][approvedColIdx] || "").toUpperCase() === "TRUE" || (rowCode !== "" && rowCode !== "(Chờ bàn giao)");

      if (rowEmail === emailClean && (!nameClean || rowName === nameClean)) {
        if (isApprovalLookup) {
          return { row: i + 2, isExisting: true };
        }
        if (!isRowApproved) {
          return { row: i + 2, isExisting: true };
        }
      }
    }
  }

  for (var j = 0; j < data.length; j++) {
    var rName = String(data[j][2] || "").trim();
    var rMail = String(data[j][emailColIdx] || data[j][5] || "").trim();
    var rCode = String(data[j][codeColIdx] || "").trim();
    if (rName === "" && rMail === "" && rCode === "") {
      return { row: j + 2, isExisting: false };
    }
  }

  return { row: maxRow + 1, isExisting: false };
}

/**
 * Ghi thông tin đăng ký người dùng vào 20 Cột Chuẩn
 */
function handleUserRegistrationWebhook(ss, payload) {
  var sheet = getUsersSheet(ss, true);
  var now = new Date();
  var nowStr = Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm:ss");
  var dobParsed = parseDobToDDMM(payload.dob || "", now);

  var target = findOrCreateUserRowByEmail(sheet, payload.email, payload.fullName, false);
  var targetRow = target.row;
  var stt = targetRow - 1;

  var is20 = isNew20ColsSheet(sheet);

  var existingApproved1 = false;
  var existingCode = "";
  var existingPass = "";
  var existingApproved2 = false;
  var existingMailStatus = "";

  if (target.isExisting) {
    var existingVals = sheet.getRange(targetRow, 1, 1, Math.max(sheet.getLastColumn(), 20)).getDisplayValues()[0];
    if (is20) {
      existingApproved1 = String(existingVals[14] || "").toUpperCase() === "TRUE";
      existingCode = String(existingVals[15] || "").trim();
      existingPass = String(existingVals[16] || "").trim();
      existingApproved2 = String(existingVals[17] || "").toUpperCase() === "TRUE";
      existingMailStatus = String(existingVals[18] || "").trim();
    } else {
      existingApproved1 = String(existingVals[8] || "").toUpperCase() === "TRUE";
      existingCode = String(existingVals[9] || "").trim();
      existingPass = String(existingVals[10] || "").trim();
      existingMailStatus = String(existingVals[11] || "").trim();
    }
  }

  var isSigned = payload.termsAccepted === true || String(payload.notes || "").indexOf("Đã ký") !== -1;
  var mailStatus = existingMailStatus || (isSigned ? "⏳ Chờ Kỹ sư duyệt Hợp đồng" : "Chờ ký hợp đồng");

  var phoneStr = String(payload.phone || "").trim();
  if (phoneStr) phoneStr = "'" + phoneStr;

  var cccdStr = String(payload.idCardNumber || payload.cccd || "").trim();
  if (cccdStr) cccdStr = "'" + cccdStr;

  var dobStr = dobParsed.formattedDob || String(payload.dob || "").trim();
  if (dobStr) dobStr = "'" + dobStr;

  var categoryStr = payload.contractCategory === "enterprise"
    ? "Hợp đồng toàn hệ"
    : "Hợp đồng cá nhân hóa";

  var packageStr = payload.contractPackageName || (payload.contractCategory === "enterprise" ? "Hợp đồng toàn hệ" : "Hợp đồng cá nhân hóa");

  var depositVal = parseFloat(String(payload.depositAmount || "").replace(/[^0-9]/g, "")) || 0;
  var totalVal = parseFloat(String(payload.totalAmount || "").replace(/[^0-9]/g, "")) || 0;
  var daysVal = parseInt(String(payload.deliveryDays || "").replace(/[^0-9]/g, "")) || 0;

  var pkgLower = packageStr.toLowerCase();
  if (depositVal === 0) {
    if (pkgLower.indexOf("cọc dự án cá nhân") !== -1 || pkgLower.indexOf("coc du an ca nhan") !== -1) {
      depositVal = 1250000;
      totalVal = 2550000;
      daysVal = daysVal || 5;
    } else if (pkgLower.indexOf("cọc phân bổ") !== -1 || pkgLower.indexOf("coc phan bo") !== -1) {
      depositVal = 2500000;
      totalVal = 5490000;
      daysVal = daysVal || 5;
    } else if (pkgLower.indexOf("toàn hệ") !== -1 || pkgLower.indexOf("toan he") !== -1) {
      totalVal = totalVal || 5490000;
    } else {
      totalVal = totalVal || 2550000;
    }
  }

  var depositStr = depositVal > 0 ? (depositVal.toLocaleString("vi-VN") + " VNĐ") : "0 VNĐ";
  var totalStr = totalVal > 0 ? (totalVal.toLocaleString("vi-VN") + " VNĐ") : "0 VNĐ";
  var deliveryStr = daysVal > 0 ? (daysVal + " ngày") : (depositVal > 0 ? "5 ngày" : "Bàn giao ngay");

  var contractNote = payload.notes || (isSigned
    ? ("📄 " + packageStr + " (Đã ký điện tử — Chờ duyệt)")
    : "Hồ sơ đăng ký mới");

  // 1. Ghi 20 Cột Chuẩn
  var rowValues = [
    stt,
    payload.registeredAt || nowStr,
    payload.fullName || "",
    cccdStr,
    dobStr,
    payload.gender || "Nam",
    payload.email || "",
    phoneStr,
    payload.address || "",
    categoryStr,
    packageStr,
    depositStr,
    totalStr,
    deliveryStr,
    existingApproved1,
    existingCode,
    existingPass,
    existingApproved2,
    mailStatus,
    contractNote
  ];

  var rowRange = sheet.getRange(targetRow, 1, 1, 20);
  rowRange.setValues([rowValues]);
  rowRange.setFontFamily("Times New Roman").setFontSize(10.5).setVerticalAlignment("middle");

  sheet.getRange(targetRow, 1).setHorizontalAlignment("center");
  sheet.getRange(targetRow, 2).setHorizontalAlignment("center");
  sheet.getRange(targetRow, 4, 1, 3).setHorizontalAlignment("center"); // CCCD, Dob, Gender
  sheet.getRange(targetRow, 8).setHorizontalAlignment("center"); // Phone
  sheet.getRange(targetRow, 10, 1, 5).setHorizontalAlignment("center"); // Category, Package, Deposit, Total, Delivery
  sheet.getRange(targetRow, 15).insertCheckboxes();
  sheet.getRange(targetRow, 16, 1, 2).setHorizontalAlignment("center"); // Code, Pass
  sheet.getRange(targetRow, 18).insertCheckboxes();
  sheet.getRange(targetRow, 19).setHorizontalAlignment("center");

  if (isSigned) {
    var contractSummaryNote =
      "📄 BẢN LƯU HỢP ĐỒNG DỊCH VỤ ĐIỆN TỬ (PDF)\\n" +
      "------------------------------------------\\n" +
      "• Đại diện Bên A: KS. Nguyễn Hoàng Thiện (Trưởng ban CĐS & TTNT)\\n" +
      "• Khách hàng (Bên B): " + (payload.fullName || "") + " (Đã ký điện tử)\\n" +
      (cccdStr ? ("• Số CCCD / CMND: " + cccdStr.replace(/^'+/, "") + "\\n") : "") +
      "• Ngày sinh: " + (dobParsed.formattedDob || payload.dob || "") + " | Giới tính: " + (payload.gender || "Nam") + "\\n" +
      "• SĐT: " + phoneStr.replace(/^'+/, "") + " | Gmail: " + (payload.email || "") + "\\n" +
      "• Loại hợp đồng: " + categoryStr + " | Gói: " + packageStr + "\\n" +
      "• Tiền đặt cọc: " + depositStr + " | Tổng giá trị: " + totalStr + "\\n" +
      "• Hạn bàn giao: " + deliveryStr + "\\n" +
      "• Thời điểm ký: " + (payload.registeredAt || nowStr) + "\\n" +
      "------------------------------------------\\n" +
      "👉 QUY TRÌNH DUYỆT:\\n" +
      "1. DUYỆT LẦN 1 (Cột 15): Gửi thư xác nhận ký kết kèm HĐ PDF có mộc đỏ Trưởng ban. (Với HĐ Đặt cọc: Không cấp mã ngay mà hẹn ngày bàn giao sau X ngày; Với HĐ 100%: Cấp ngay Mã Code + Mật khẩu).\\n" +
      "2. DUYỆT BÀN GIAO LẦN 2 (Cột 18): Áp dụng cho HĐ Đặt cọc khi đến ngày giao hàng và khách thanh toán đủ tiền, Kỹ sư tích Cột 18 để bàn giao và cấp tài khoản.";
    sheet.getRange(targetRow, 20).setNote(contractSummaryNote);
  }

  return {
    status: "success",
    action: "register",
    row: targetRow,
    package: packageStr,
    notes: contractNote
  };
}

function handleForgotPasswordWebhook(ss, payload) {
  var email = String(payload.email || "").trim().toLowerCase();
  var phone = String(payload.phone || "").trim();
  var code = String(payload.code || "").trim().toUpperCase();
  var newPassword = String(payload.newPassword || "").trim();
  var fullName = String(payload.fullName || "Khách hàng SYNAPES").trim();

  if (!email || !newPassword) {
    return { status: "error", message: "Missing email or newPassword" };
  }

  var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

  var uSheet = getUsersSheet(ss, false);
  if (uSheet && uSheet.getLastRow() >= 2) {
    var is20 = isNew20ColsSheet(uSheet);
    var maxCols = Math.max(uSheet.getLastColumn(), 20);
    var uData = uSheet.getRange(2, 1, uSheet.getLastRow() - 1, maxCols).getDisplayValues();

    var mailColIdx = is20 ? 6 : 5;
    var codeColIdx = is20 ? 15 : 9;
    var passColIdx = is20 ? 16 : 10;
    var statusColIdx = is20 ? 18 : 11;

    for (var i = 0; i < uData.length; i++) {
      var rMail = String(uData[i][mailColIdx] || uData[i][5] || "").trim().toLowerCase();
      var rCode = String(uData[i][codeColIdx] || "").trim().toUpperCase();
      if ((code && rCode === code) || (!code && rMail === email.toLowerCase())) {
        var rIdx = i + 2;
        if (!code && rCode) code = rCode;
        if (uData[i][2]) fullName = uData[i][2];
        uSheet.getRange(rIdx, passColIdx + 1).setValue(newPassword).setFontWeight("bold").setFontColor("#b91c1c");
        uSheet.getRange(rIdx, statusColIdx + 1).setValue("🔄 Đã cấp lại MK (" + nowStr + ")");
        break;
      }
    }
  }

  if (code) {
    syncAccountToMainSheet(code, fullName, email, newPassword, phone, "", true);
  }

  var mailRes = sendForgotPasswordEmail(email, fullName, code || "SYNAPES_USER", newPassword);

  return {
    status: "success",
    action: "forgot_password",
    emailSent: mailRes.success
  };
}

function handleChangePasswordWebhook(ss, payload) {
  var code = String(payload.code || "").trim().toUpperCase();
  var email = String(payload.email || "").trim().toLowerCase();
  var passwordHash = String(payload.passwordHash || "").trim();
  var fullName = String(payload.fullName || "").trim();

  if (!code && !email) {
    return { status: "error", message: "Missing code or email" };
  }

  var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm");
  var maskedPassValue = passwordHash
    ? "🔒 Đã mã hóa [" + passwordHash + "]"
    : "🔒 Đã ẩn (Khách đã đổi MK)";

  var uSheet = getUsersSheet(ss, false);
  if (uSheet && uSheet.getLastRow() >= 2) {
    var is20 = isNew20ColsSheet(uSheet);
    var maxCols = Math.max(uSheet.getLastColumn(), 20);
    var uData = uSheet.getRange(2, 1, uSheet.getLastRow() - 1, maxCols).getDisplayValues();

    var mailColIdx = is20 ? 6 : 5;
    var codeColIdx = is20 ? 15 : 9;
    var passColIdx = is20 ? 16 : 10;
    var statusColIdx = is20 ? 18 : 11;
    var noteColIdx = is20 ? 19 : 12;

    for (var i = 0; i < uData.length; i++) {
      var rMail = String(uData[i][mailColIdx] || uData[i][5] || "").trim().toLowerCase();
      var rCode = String(uData[i][codeColIdx] || "").trim().toUpperCase();
      if ((code && rCode === code) || (!code && email && rMail === email)) {
        var rIdx = i + 2;
        if (!code && rCode) code = rCode;
        if (!fullName && uData[i][2]) fullName = uData[i][2];
        if (!email && rMail) email = rMail;
        uSheet
          .getRange(rIdx, passColIdx + 1)
          .setValue(maskedPassValue)
          .setFontWeight("bold")
          .setFontColor("#0f766e")
          .setHorizontalAlignment("center");
        uSheet
          .getRange(rIdx, statusColIdx + 1)
          .setValue("🟢 Đã tạo mật khẩu mới (" + nowStr + ")")
          .setFontColor("#15803d")
          .setFontWeight("bold");
        uSheet
          .getRange(rIdx, noteColIdx + 1)
          .setValue("Đã ký hợp đồng | 🟢 Đã tạo mật khẩu mới");
        break;
      }
    }
  }

  var accSheet = getAccountsSheet(ss);
  if (accSheet && accSheet.getLastRow() >= 5) {
    var maxRow = accSheet.getLastRow();
    var accData = accSheet.getRange(1, 1, maxRow, 9).getDisplayValues();
    var foundAccRow = -1;

    for (var j = 4; j < accData.length; j++) {
      var aCode = String(accData[j][1] || "").trim().toUpperCase();
      var aEmail = String(accData[j][3] || "").trim().toLowerCase();
      if ((code && aCode === code) || (!code && email && aEmail === email)) {
        foundAccRow = j + 1;
        break;
      }
    }

    if (foundAccRow !== -1) {
      accSheet
        .getRange(foundAccRow, 5)
        .setValue(maskedPassValue)
        .setFontWeight("bold")
        .setFontColor("#0f766e");
      accSheet.getRange(foundAccRow, 6).setValue(nowStr).setHorizontalAlignment("center");
      accSheet.getRange(foundAccRow, 7).setValue("🟢 Khách đã đổi pass riêng");
      accSheet
        .getRange(foundAccRow, 9)
        .setValue("Mật khẩu riêng mã hóa một chiều an toàn");
    } else if (code) {
      syncAccountToMainSheet(code, fullName || "Khách hàng SYNAPES", email, maskedPassValue, "", "", false);
      for (var k = 5; k <= accSheet.getLastRow(); k++) {
        var checkCode = String(accSheet.getRange(k, 2).getDisplayValue() || "").trim().toUpperCase();
        if (checkCode === code) {
          accSheet.getRange(k, 7).setValue("🟢 Khách đã đổi pass riêng");
          accSheet
            .getRange(k, 9)
            .setValue("Mật khẩu riêng mã hóa một chiều an toàn");
          break;
        }
      }
    }
  }

  return {
    status: "success",
    action: "change_password",
    code: code
  };
}

function syncToWebApp() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  reconcileAllApprovedUsersToAccountsSheet(ss);
  SpreadsheetApp.getUi().alert("✅ Đã hoàn tất đồng bộ 2 chiều với WebApp!");
}

function openWebAppUrl() {
  var html =
    '<script>window.open("https://synapes-auto-tool-web-service.onrender.com", "_blank");google.script.host.close();</script>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html), "Đang mở SYNAPES Studio...");
}

function recordEmergencyReportToSheetAndDrive(ss, payload) {
  try {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    var reportSheetName = "NHẬT KÝ SỰ CỐ & SỨC KHỎE";
    var sheet = ss.getSheetByName(reportSheetName);
    if (!sheet) {
      sheet = ss.insertSheet(reportSheetName);
      var headers = ["STT", "Thời Gian", "Loại Sự Cố", "Mức Độ", "Mô Tả Chi Tiết", "Hành Động Khắc Phục", "Trạng Thái"];
      var hRange = sheet.getRange(1, 1, 1, headers.length);
      hRange.setValues([headers]);
      hRange.setBackground("#991b1b").setFontColor("#ffffff").setFontWeight("bold");
    }

    var nextRow = sheet.getLastRow() + 1;
    var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
    var rowData = [
      nextRow - 1,
      nowStr,
      payload.incidentType || "AUTO_HEAL",
      payload.severity || "MEDIUM",
      payload.description || "Tự động phát hiện và khắc phục",
      payload.actionTaken || "Restart / Reconnect",
      "ĐÃ XỬ LÝ"
    ];

    sheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);
    return { status: "success", action: "emergency_report", row: nextRow };
  } catch (err) {
    Logger.log("recordEmergencyReportToSheetAndDrive error: " + err);
    return { status: "error", error: err.toString() };
  }
}

function runCloudKeepAliveAndBackgroundCron() {
  var endpoints = [
    "https://synapes-auto-tool-web-service.onrender.com/ping",
    "https://synapes-auto-tool-web-service.onrender.com/healthz"
  ];

  for (var i = 0; i < endpoints.length; i++) {
    try {
      var response = UrlFetchApp.fetch(endpoints[i], { muteHttpExceptions: true, validateHttpsCertificates: false });
      Logger.log("Keep-alive ping " + endpoints[i] + " -> Status: " + response.getResponseCode());
    } catch (e) {
      Logger.log("runCloudKeepAliveAndBackgroundCron ping error (" + endpoints[i] + "): " + e);
    }
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    syncPendingFormBridgeResponses();
  } catch (e) {
    Logger.log("runCloudKeepAliveAndBackgroundCron bridge sync error: " + e);
  }
}

function installCloudKeepAliveTrigger() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === "runCloudKeepAliveAndBackgroundCron") {
        return true;
      }
    }
    ScriptApp.newTrigger("runCloudKeepAliveAndBackgroundCron")
      .timeBased()
      .everyMinutes(5)
      .create();
    return true;
  } catch (err) {
    Logger.log("installCloudKeepAliveTrigger error: " + err);
    return false;
  }
}
`;

// 3. Ghi file google-apps-script/Code.js
const gasPath = path.join(ROOT, 'google-apps-script', 'Code.js');
fs.writeFileSync(gasPath, gasCode, 'utf8');
console.log('✅ Đã cập nhật file: ' + gasPath);

// 4. Ghi file src/components/Code.js
const compGasPath = path.join(ROOT, 'src', 'components', 'Code.js');
fs.writeFileSync(compGasPath, gasCode, 'utf8');
console.log('✅ Đã cập nhật file: ' + compGasPath);

// 5. Ghi file src/data/appsScriptCode.ts
const appsScriptTsPath = path.join(ROOT, 'src', 'data', 'appsScriptCode.ts');
const tsContent = `/**
 * Mã nguồn Google Apps Script đồng bộ tự động 2 chiều cho Google Sheet:
 * - Tab: "THÔNG TIN NGƯỜI DÙNG" (20 Cột Chuẩn & 2 Phân hệ Hợp đồng Cá nhân / Toàn hệ)
 * - Tự động gửi Gmail với Con dấu đỏ tròn KS. Nguyễn Hoàng Thiện & VietQR Timo
 */

export const APPS_SCRIPT_CODE = ${JSON.stringify(gasCode)};
`;
fs.writeFileSync(appsScriptTsPath, tsContent, 'utf8');
console.log('✅ Đã cập nhật file: ' + appsScriptTsPath);

console.log('\n🎉 ĐỒNG BỘ MÃ NGUỒN APPS SCRIPT HOÀN TẤT THÀNH CÔNG!');

