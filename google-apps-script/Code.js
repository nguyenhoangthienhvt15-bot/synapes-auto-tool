/**
 * ==============================================================================
 * HỆ THỐNG ĐỒNG BỘ GOOGLE SHEET & WEBAPP — SYNAPES STUDIO
 * Tác giả: Kỹ sư Nguyễn Hoàng Thiện (nguyenhoangthien.hvt.15@gmail.com)
 * Chức vụ: Trưởng ban Chuyển đổi số & Trí tuệ nhân tạo
 * WebApp URL: https://synapes-auto-tool.onrender.com
 * Google Sheet ID: 1E9zec8lX52-ofleS0MG-oRSc8k_hK9aBtC1XBaqNafY
 * ==============================================================================
 */

var SHEET_NAME_USERS = "THÔNG TIN NGƯỜI DÙNG";
var SHEET_NAME_ACCOUNTS = "Quản Lý Mật Khẩu";
var GID_USERS = 2096171544;
var GID_ACCOUNTS = 0;

/**
 * 1. HÀM KHỞI TẠO & KÍCH HOẠT TỰ ĐỘNG TOÀN DIỆN (CHẠY ĐẦU TIÊN TRONG APPS SCRIPT)
 * - Cấp quyền gửi Gmail (MailApp), quyền bảng tính (SpreadsheetApp) và quyền Trigger (ScriptApp)
 * - Khởi tạo & làm sạch trang "THÔNG TIN NGƯỜI DÙNG" (xóa các dòng trống ảo để ghi từ dòng 2)
 * - Tự động cài đặt Installable Trigger (onInstallableEdit) để khi tích Checkbox Cột I sẽ gửi được Gmail ngay
 * - Tự động lưu URL Web App vào ô N1 & J4 để WebApp tự động kết nối 2 chiều không cần cấu hình thủ công
 */
function setupUserRegistrationSheet() {
  // Kích hoạt kiểm tra quyền gửi Gmail & Fetch ngay khi bấm Run
  var remainingQuota = MailApp.getRemainingDailyQuota();
  Logger.log("Hạn ngạch gửi Gmail còn lại trong ngày: " + remainingQuota);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getUsersSheet(ss, true);

  // Header columns (13 cột chuẩn)
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

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // Trang trí Header
  headerRange
    .setFontFamily("Times New Roman")
    .setFontSize(11)
    .setFontWeight("bold")
    .setBackground("#18181b")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);

  sheet.setRowHeight(1, 40);

  // Độ rộng các cột
  var widths = [50, 140, 185, 120, 85, 210, 120, 260, 125, 150, 130, 185, 195];
  for (var i = 0; i < widths.length; i++) {
    sheet.setColumnWidth(i + 1, widths[i]);
  }

  sheet.setFrozenRows(1);

  // Làm sạch các dòng trống chỉ có Checkbox FALSE (tránh lỗi nhảy xuống dòng 1001)
  cleanUpEmptyGhostRows(sheet);

  // Tự động cài đặt Installable Trigger cho phép gửi Gmail khi tích chọn Checkbox Cột I
  var triggerInstalled = installAutoEditTrigger(ss);

  // Tự động khởi tạo Cầu nối Google Form (Zero-Deploy Bridge) & lưu vào ô N1 / J4
  // Giúp WebApp tự động đẩy dữ liệu đăng ký vào Sheet 100% mà KHÔNG cần Deploy Web App thủ công!
  var bridgeUrl = setupGoogleFormBridge(ss);
  var detectedUrl = bridgeUrl || autoPublishWebhookUrlToSheet(ss);

  // Quét ngay các hồ sơ đang chờ trong Cầu nối (nếu có) và trải đều các tài khoản đã duyệt
  syncPendingFormBridgeResponses();
  reconcileAllApprovedUsersToAccountsSheet(ss);

  try {
    var msg =
      "✅ ĐÃ KÍCH HOẠT HỆ THỐNG ĐỒNG BỘ TỰ ĐỘNG 2 CHIỀU THÀNH CÔNG!\n\n" +
      "1. Trang tính \"" + sheet.getName() + "\" đã sẵn sàng tiếp nhận dữ liệu từ Dòng 2.\n" +
      "2. Bộ kích hoạt tự động gửi Gmail khi tích Checkbox Cột I: " + (triggerInstalled ? "ĐÃ BẬT (100%)" : "Đã cập nhật") + ".\n" +
      "3. Hạn ngạch gửi Gmail hôm nay còn: " + remainingQuota + " thư.\n";

    if (detectedUrl) {
      msg +=
        "4. Đã tự động khởi tạo Cầu nối 2 chiều với WebApp (Zero-Deploy):\n" +
        detectedUrl + "\n\n" +
        "👉 Bây giờ bạn chỉ cần mở lại WebApp (F5), mọi thông tin người dùng đã đăng ký sẽ tự động đổ thẳng vào Dòng 2 của trang 'THÔNG TIN NGƯỜI DÙNG'!";
    }

    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    Logger.log("Đã hoàn tất khởi tạo trong trình biên dịch Apps Script. Bridge URL: " + detectedUrl);
  }
}

/**
 * 2. Tự động thêm Menu tùy chỉnh khi mở Sheet
 */
function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    autoPublishWebhookUrlToSheet(ss);
    syncPendingFormBridgeResponses();
    reconcileAllApprovedUsersToAccountsSheet(ss);
  } catch (e) {}

  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🚀 SYNAPES Studio")
    .addItem("📋 1. Khởi tạo & Bật kết nối tự động 2 chiều + Gmail (Khuyên dùng)", "setupUserRegistrationSheet")
    .addItem("🔗 2. Gắn Link Web App tùy chỉnh (Nếu dùng Deploy Web App)", "connectWebAppWebhookPrompt")
    .addSeparator()
    .addItem("📄 Xem bản Hợp đồng PDF của dòng đang chọn", "previewSelectedUserContractModal")
    .addItem("✅ Duyệt dòng đang chọn (Cấp Code + Pass + Gửi Gmail kèm HĐ PDF)", "approveSelectedUserRow")
    .addItem("⚡ Duyệt TẤT CẢ hồ sơ đang chờ duyệt", "approveAllPendingUsers")
    .addItem("📧 Gửi lại Gmail tài khoản & Hợp đồng PDF cho dòng đang chọn", "resendEmailForSelectedRow")
    .addSeparator()
    .addItem("🔄 Đồng bộ dữ liệu từ WebApp ngay lập tức", "syncToWebApp")
    .addItem("🌐 Mở WebApp Studio", "openWebAppUrl")
    .addToUi();
}

/**
 * Tìm trang tính "THÔNG TIN NGƯỜI DÙNG" (không phân biệt chữ hoa/thường hoặc tìm theo GID)
 */
function getUsersSheet(ss, createIfMissing) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var s = sheets[i];
    var nameNorm = s.getName().trim().toLowerCase();
    if (
      s.getSheetId() === GID_USERS ||
      nameNorm === "thông tin người dùng" ||
      nameNorm === "thong tin nguoi dung"
    ) {
      return s;
    }
  }
  if (createIfMissing) {
    return ss.insertSheet(SHEET_NAME_USERS);
  }
  return null;
}

function isUsersSheet(sheet) {
  if (!sheet) return false;
  var nameNorm = sheet.getName().trim().toLowerCase();
  return (
    sheet.getSheetId() === GID_USERS ||
    nameNorm === "thông tin người dùng" ||
    nameNorm === "thong tin nguoi dung"
  );
}

/**
 * Tìm trang tính "Quản Lý Mật Khẩu" (không phân biệt chữ hoa/thường hoặc tìm theo GID = 0)
 */
function getAccountsSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var s = sheets[i];
    var nameNorm = s.getName().trim().toLowerCase();
    if (
      nameNorm === "quản lý mật khẩu" ||
      nameNorm === "quản lí mật khẩu" ||
      nameNorm === "quan ly mat khau" ||
      nameNorm === "danh sách tài khoản"
    ) {
      return s;
    }
  }
  for (var j = 0; j < sheets.length; j++) {
    if (sheets[j].getSheetId() === GID_ACCOUNTS) {
      return sheets[j];
    }
  }
  return sheets[0];
}

/**
 * Dọn dẹp các dòng trống chỉ chứa Checkbox FALSE để dữ liệu mới luôn ghi chuẩn từ dòng 2
 */
function cleanUpEmptyGhostRows(sheet) {
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var numRows = lastRow - 1;
  var data = sheet.getRange(2, 1, numRows, 13).getDisplayValues();
  var lastRealDataRow = 1;

  for (var i = 0; i < data.length; i++) {
    var fullName = String(data[i][2] || "").trim();
    var email = String(data[i][5] || "").trim();
    if (fullName !== "" || email !== "") {
      lastRealDataRow = i + 2;
    } else {
      // Nếu dòng đầu tiên (dòng 2, 3) trống tên/email nhưng còn chữ thừa ở cột A, L, M thì xóa sạch
      if (i < 10) {
        sheet.getRange(i + 2, 1, 1, 13).clearContent().clearDataValidations();
      }
    }
  }

  // Xóa nội dung và checkbox thừa từ sau dòng có dữ liệu thật cuối cùng
  if (lastRow > lastRealDataRow + 5) {
    var clearStart = lastRealDataRow + 1;
    var clearCount = lastRow - lastRealDataRow;
    sheet.getRange(clearStart, 1, clearCount, 13).clearContent().clearDataValidations();
  }
}

/**
 * Cài đặt Installable Trigger `onInstallableEdit` để có toàn quyền gọi MailApp.sendEmail khi tích Checkbox
 */
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
    Logger.log("Không thể tự tạo Trigger (cần chạy trong quyền Editor): " + err);
    return false;
  }
}

/**
 * Tự động khởi tạo Cầu nối Google Form (Zero-Deploy Bridge)
 * Giúp WebApp tự động đẩy dữ liệu đăng ký vào Sheet & gửi Gmail 100% TỰ ĐỘNG
 * mà Kỹ sư KHÔNG CẦN phải thao tác Deploy Web App thủ công.
 */
function setupGoogleFormBridge(ss) {
  try {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    var props = PropertiesService.getScriptProperties();
    var existingBridgeUrl = props.getProperty("SYNAPES_FORM_BRIDGE_URL") || "";
    var existingFormId = props.getProperty("SYNAPES_FORM_BRIDGE_ID") || "";

    var form = null;
    if (existingFormId) {
      try {
        form = FormApp.openById(existingFormId);
      } catch (e) {
        form = null;
      }
    }

    if (!form || !existingBridgeUrl || existingBridgeUrl.indexOf("docs.google.com/forms") === -1) {
      form = FormApp.create("SYNAPES_STUDIO_AUTO_BRIDGE");
      try {
        form.setRequireLogin(false);
      } catch (e) {}
      try {
        form.setAcceptingResponses(true);
        form.setCollectEmail(false);
        form.setShowLinkToRespondAgain(false);
      } catch (e) {}

      var item = form.addParagraphTextItem().setTitle("PAYLOAD_JSON");
      var sampleResp = form.createResponse().withItemResponse(item.createResponse("SYNAPES_MARKER"));
      var prefillUrl = sampleResp.toPrefilledUrl();
      var entryMatch = prefillUrl.match(/(entry\.\d+)=/);
      var formActionUrl = prefillUrl.split("?")[0].replace(/\/viewform.*$/, "/formResponse");

      if (formActionUrl && entryMatch) {
        existingBridgeUrl = formActionUrl + "?" + entryMatch[1] + "=";
        existingFormId = form.getId();
        props.setProperty("SYNAPES_FORM_BRIDGE_URL", existingBridgeUrl);
        props.setProperty("SYNAPES_FORM_BRIDGE_ID", existingFormId);
      }
    }

    if (form) {
      var triggers = ScriptApp.getProjectTriggers();
      var hasFormTrigger = false;
      var hasTimeTrigger = false;
      for (var i = 0; i < triggers.length; i++) {
        var fn = triggers[i].getHandlerFunction();
        if (fn === "onFormBridgeSubmit") hasFormTrigger = true;
        if (fn === "syncPendingFormBridgeResponses") hasTimeTrigger = true;
      }
      if (!hasFormTrigger) {
        ScriptApp.newTrigger("onFormBridgeSubmit")
          .forForm(form)
          .onFormSubmit()
          .create();
      }
      if (!hasTimeTrigger) {
        ScriptApp.newTrigger("syncPendingFormBridgeResponses")
          .timeBased()
          .everyMinutes(1)
          .create();
      }
    }

    if (existingBridgeUrl && existingBridgeUrl.indexOf("docs.google.com/forms") !== -1) {
      var usersSheet = getUsersSheet(ss, false);
      if (usersSheet) {
        usersSheet.getRange("N1").setValue(existingBridgeUrl).setFontColor("#94a3b8").setFontSize(8);
      }
      var accSheet = getAccountsSheet(ss);
      if (accSheet) {
        accSheet.getRange("J4").setValue(existingBridgeUrl).setFontColor("#94a3b8").setFontSize(8);
      }
      return existingBridgeUrl;
    }
  } catch (err) {
    Logger.log("setupGoogleFormBridge error: " + err);
  }
  return "";
}

/**
 * Bộ kích hoạt tức thời (< 1 giây) khi WebApp gửi dữ liệu qua Cầu nối Google Form
 */
function onFormBridgeSubmit(e) {
  try {
    if (e && e.response) {
      var itemResponses = e.response.getItemResponses();
      for (var i = 0; i < itemResponses.length; i++) {
        var rawText = String(itemResponses[i].getResponse() || "").trim();
        if (rawText && rawText.charAt(0) === "{") {
          var payload = JSON.parse(rawText);
          if (!payload.requestId) {
            payload.requestId = "form_" + e.response.getId();
          }
          processWebhookPayload(payload);
        }
      }
    }
  } catch (err) {
    Logger.log("onFormBridgeSubmit error: " + err);
  }
  syncPendingFormBridgeResponses();
}

/**
 * Quét bổ sung các phản hồi gần nhất trong Cầu nối Google Form để đảm bảo không bao giờ sót hồ sơ
 */
function syncPendingFormBridgeResponses() {
  try {
    var props = PropertiesService.getScriptProperties();
    var formId = props.getProperty("SYNAPES_FORM_BRIDGE_ID");
    if (!formId) return 0;

    var form = FormApp.openById(formId);
    var responses = form.getResponses();
    var count = 0;
    var startIdx = Math.max(0, responses.length - 30);
    for (var i = startIdx; i < responses.length; i++) {
      var itemResps = responses[i].getItemResponses();
      for (var j = 0; j < itemResps.length; j++) {
        var raw = String(itemResps[j].getResponse() || "").trim();
        if (raw && raw.charAt(0) === "{") {
          try {
            var payload = JSON.parse(raw);
            if (!payload.requestId) {
              payload.requestId = "form_resp_" + responses[i].getId();
            }
            var res = processWebhookPayload(payload);
            if (res && res.status === "success") {
              count++;
            }
          } catch (e) {}
        }
      }
    }
    return count;
  } catch (err) {
    return 0;
  }
}

/**
 * Tự động ghi URL Cầu nối hợp lệ (Google Form Bridge hoặc Web App đã Deploy) vào ô N1 và J4
 * Tự động xóa bỏ các URL lỗi 404 chưa deploy.
 */
function autoPublishWebhookUrlToSheet(ss, customUrl) {
  try {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    var props = PropertiesService.getScriptProperties();
    var url = customUrl || props.getProperty("SYNAPES_FORM_BRIDGE_URL") || "";

    if (!url) {
      var uSheet = getUsersSheet(ss, false);
      if (uSheet) {
        var existing = String(uSheet.getRange("N1").getValue() || "").trim();
        // Loại bỏ URL ảo 404 chưa deploy trước đây
        if (existing.indexOf("AKfycbwjCX3IJpWA7xOxloT9YuYVGE1DI_LePFobI9TOaLYj9k2vivQ") !== -1) {
          uSheet.getRange("N1").clearContent();
          var aSheet = getAccountsSheet(ss);
          if (aSheet) aSheet.getRange("J4").clearContent();
          existing = "";
        }
        if (
          existing.indexOf("docs.google.com/forms") !== -1 ||
          existing.indexOf("script.google.com") !== -1
        ) {
          url = existing;
        }
      }
    }

    if (
      url &&
      (url.indexOf("docs.google.com/forms") !== -1 || url.indexOf("script.google.com") !== -1)
    ) {
      var usersSheet = getUsersSheet(ss, false);
      if (usersSheet) {
        usersSheet.getRange("N1").setValue(url).setFontColor("#94a3b8").setFontSize(8);
      }
      var accSheet = getAccountsSheet(ss);
      if (accSheet) {
        accSheet.getRange("J4").setValue(url).setFontColor("#94a3b8").setFontSize(8);
      }
      return url;
    }
  } catch (err) {
    Logger.log("autoPublishWebhookUrlToSheet error: " + err);
  }
  return "";
}

/**
 * Hộp thoại cho phép Kỹ sư dán nhanh URL Web App (/exec) ngay trên Google Sheet
 */
function connectWebAppWebhookPrompt() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var currentUrl = autoPublishWebhookUrlToSheet(ss);

  var promptMsg =
    "Để WebApp tự động đẩy thông tin người dùng đăng ký vào trang \"THÔNG TIN NGƯỜI DÙNG\":\n\n" +
    "1. Trong cửa sổ Apps Script, bấm nút [Triển khai] (Deploy) ở góc trên bên phải ➔ [Triển khai mới] (New deployment).\n" +
    "2. Chọn loại: [Ứng dụng web] (Web app).\n" +
    "3. Mục 'Ai có quyền truy cập' (Who has access): Chọn [Bất kỳ ai] (Anyone) ➔ Bấm [Triển khai].\n" +
    "4. Sao chép URL Web App (có dạng https://script.google.com/macros/s/.../exec) và dán vào ô bên dưới:\n" +
    (currentUrl ? "\n(Hiện đang kết nối: " + currentUrl + ")" : "");

  var res = ui.prompt("🔗 KẾT NỐI ĐỒNG BỘ 2 CHIỀU VỚI WEBAPP", promptMsg, ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() === ui.Button.OK) {
    var inputUrl = String(res.getResponseText() || "").trim();
    if (inputUrl && inputUrl.indexOf("script.google.com") !== -1) {
      autoPublishWebhookUrlToSheet(ss, inputUrl);
      installAutoEditTrigger(ss);
      ui.alert(
        "✅ KẾT NỐI THÀNH CÔNG!\n\n" +
        "Đã lưu URL Webhook vào Bảng tính:\n" + inputUrl + "\n\n" +
        "Từ bây giờ, mọi khách hàng bấm 'Tiếp tục' hoặc 'Ký hợp đồng' trên WebApp sẽ tự động hiện ngay trên trang 'THÔNG TIN NGƯỜI DÙNG'!"
      );
    } else if (currentUrl) {
      ui.alert("✅ Hệ thống vẫn đang giữ kết nối với URL:\n" + currentUrl);
    } else {
      ui.alert("⚠️ URL không hợp lệ. Vui lòng dán đường dẫn bắt đầu bằng https://script.google.com/macros/s/.../exec");
    }
  }
}

/**
 * 3. BỘ KÍCH HOẠT TỰ ĐỘNG KHI KỸ SƯ TÍCH DUYỆT CHECKBOX Ở CỘT I (CỘT 9)
 * Hỗ trợ cả Installable Trigger (onInstallableEdit - gửi được Gmail) và Simple Trigger (onEdit dự phòng)
 */
function onInstallableEdit(e) {
  handleSheetCheckboxEdit(e, true);
}

function onEdit(e) {
  // Nếu đã có Installable Trigger thì nhường cho onInstallableEdit xử lý để gửi được Gmail
  try {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === "onInstallableEdit") {
        return;
      }
    }
  } catch (err) {
    // Trong Simple Trigger, ScriptApp.getProjectTriggers() có thể bị chặn nếu chưa cấp quyền
  }
  handleSheetCheckboxEdit(e, false);
}

function handleSheetCheckboxEdit(e, canSendMail) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  if (!isUsersSheet(sheet)) return;

  var col = e.range.getColumn();
  var row = e.range.getRow();

  // Kiểm tra chỉnh sửa tại Cột I (Cột 9 - Duyệt cấp tài khoản) và từ dòng 2 trở đi
  if (col === 9 && row >= 2) {
    var isChecked = e.range.getValue();
    if (isChecked === true || String(isChecked).toUpperCase() === "TRUE") {
      // Nếu chạy từ Simple Trigger mà cột L đã báo gửi mail rồi thì không chạy đè
      var currentStatus = String(sheet.getRange(row, 12).getDisplayValue() || "");
      if (!canSendMail && currentStatus.indexOf("ĐÃ GỬI GMAIL") !== -1) {
        return;
      }
      processUserApproval(sheet, row, canSendMail);
    }
  }
}

/**
 * Chuẩn hóa chuỗi ngày sinh DD/MM/YYYY và trích xuất 4 chữ số DDMM
 */
function parseDobToDDMM(dobRaw, nowDate) {
  var dobStr = String(dobRaw || "").replace(/^'+/, "").trim();
  var defaultDDMM = Utilities.formatDate(nowDate || new Date(), "GMT+7", "ddMM");
  if (!dobStr) return { formattedDob: "", ddmm: defaultDDMM };

  // Trường hợp YYYY-MM-DD
  var ymd = dobStr.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymd) {
    var d1 = ("0" + ymd[3]).slice(-2);
    var m1 = ("0" + ymd[2]).slice(-2);
    return {
      formattedDob: d1 + "/" + m1 + "/" + ymd[1],
      ddmm: d1 + m1
    };
  }

  // Trường hợp DD/MM/YYYY
  var dmy = dobStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
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
 * Đảm bảo mỗi khách hàng (mỗi dòng trên THÔNG TIN NGƯỜI DÙNG) có một Mã Code duy nhất,
 * không bao giờ bị trùng Mã Code với khách hàng ở dòng khác (kể cả khi trùng ngày sinh và duyệt cùng ngày).
 */
function ensureUniqueUserCode(ss, baseCode, currentUserSheetRow, currentFullName) {
  var candidate = String(baseCode || "").trim().toUpperCase();
  if (!candidate) return candidate;

  var usedCodes = {};
  var nameClean = String(currentFullName || "").trim().toLowerCase();

  // 1. Quét các dòng khác trên trang "THÔNG TIN NGƯỜI DÙNG"
  var uSheet = getUsersSheet(ss, false);
  if (uSheet && uSheet.getLastRow() >= 2) {
    var uData = uSheet.getRange(2, 1, uSheet.getLastRow() - 1, 11).getDisplayValues();
    for (var i = 0; i < uData.length; i++) {
      var rIdx = i + 2;
      if (rIdx === currentUserSheetRow) continue;
      var cCode = String(uData[i][9] || "").trim().toUpperCase();
      if (cCode) {
        usedCodes[cCode] = true;
      }
    }
  }

  // 2. Quét các dòng của người dùng khác trên trang "Quản Lý Mật Khẩu"
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
 * 4. XỬ LÝ PHÊ DUYỆT HỒ SƠ, TỰ ĐỘNG SINH CODE + MẬT KHẨU, LƯU SANG "Quản Lý Mật Khẩu" & GỬI GMAIL KÈM PDF
 */
function processUserApproval(sheet, row, canSendMail) {
  if (canSendMail === undefined) canSendMail = true;

  // Dùng getDisplayValues() để giữ nguyên định dạng ngày sinh DD/MM/YYYY và số 0 đầu số điện thoại
  var displayVals = sheet.getRange(row, 1, 1, 13).getDisplayValues()[0];
  var rawVals = sheet.getRange(row, 1, 1, 13).getValues()[0];

  var fullName = String(displayVals[2] || "").trim();
  var dobRaw = displayVals[3] || "";
  if (rawVals[3] instanceof Date) {
    dobRaw = Utilities.formatDate(rawVals[3], "GMT+7", "dd/MM/yyyy");
  }
  var gender = String(displayVals[4] || "Nam").trim();
  var email = String(displayVals[5] || "").trim();
  var phone = String(displayVals[6] || "").trim();
  var address = String(displayVals[7] || "").trim();
  var existingCode = String(displayVals[9] || "").trim();
  var existingPass = String(displayVals[10] || "").trim();

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!fullName || !email || email.indexOf("@") === -1) {
    ss.toast("⚠️ Dòng " + row + " chưa có đầy đủ Họ tên hoặc Gmail hợp lệ!", "SYNAPES Studio", 6);
    return false;
  }

  var now = new Date();
  var dobParsed = parseDobToDDMM(dobRaw, now);
  var dob = dobParsed.formattedDob || dobRaw;

  // Sinh Mã Code: SNP_[6 số ngày tháng năm YYMMDD + 4 chữ số ngày tháng sinh DDMM]
  // Đồng thời kiểm tra chống trùng lặp với các dòng khác để không bao giờ ghi đè người dùng trước
  var yymmdd = Utilities.formatDate(now, "GMT+7", "yyMMdd");
  var baseCode = (existingCode && existingCode.indexOf("SNP_") === 0)
    ? existingCode
    : ("SNP_" + yymmdd + dobParsed.ddmm);
  var code = ensureUniqueUserCode(ss, baseCode, row, fullName);

  // Sinh Mật khẩu: SNP_[3 chữ số ngẫu nhiên + 3 chữ cái in hoa ngẫu nhiên]
  var password = existingPass;
  if (!password || (password.indexOf("SNP_") !== 0 && password.indexOf("BCRYPT$") === -1)) {
    var randomDigits = Math.floor(100 + Math.random() * 900);
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    var randomLetters = "";
    for (var c = 0; c < 3; c++) {
      randomLetters += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    password = "SNP_" + randomDigits + randomLetters;
  }

  // Ghi Mã Code vào Cột J (10) và Mật Khẩu vào Cột K (11)
  sheet.getRange(row, 10).setValue(code).setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(row, 11).setValue(password).setFontWeight("bold").setFontColor("#b91c1c").setHorizontalAlignment("center");

  // Lưu tài khoản sang trang tính "Quản Lý Mật Khẩu" (trải đều từng hàng riêng biệt)
  syncAccountToMainSheet(code, fullName, email, password, phone, address, false);
  reconcileAllApprovedUsersToAccountsSheet(ss);

  var nowStr = Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm:ss");

  if (!canSendMail) {
    sheet.getRange(row, 12).setValue("⏳ Đã tạo Mã (Bấm menu SYNAPES Studio ➔ Mục 1 để bật gửi Gmail tự động)");
    return true;
  }

  // Gửi Gmail thông tin đăng nhập + hướng dẫn + bản mềm Hợp đồng PDF
  var emailResult = sendApprovalEmailWithContract(email, fullName, dob, gender, phone, address, code, password);

  if (emailResult.success) {
    sheet.getRange(row, 12).setValue("✅ ĐÃ GỬI GMAIL (" + nowStr + ")").setFontColor("#15803d").setFontWeight("bold");
    sheet.getRange(row, 13).setValue("📄 HOP_DONG_DICH_VU_SYNAPES_" + code + ".pdf (Đã duyệt & Đã gửi Gmail)");
    ss.toast("✅ Đã cấp mã " + code + " và gửi Gmail kèm Hợp đồng PDF tới " + email, "🚀 SYNAPES Studio", 6);
    return true;
  } else {
    sheet.getRange(row, 12).setValue("⚠️ Lỗi gửi mail: " + emailResult.error).setFontColor("#b91c1c");
    ss.toast("⚠️ Lỗi gửi Gmail: " + emailResult.error, "SYNAPES Studio", 8);
    return false;
  }
}

/**
 * 5. GỬI GMAIL KÍCH HOẠT TÀI KHOẢN KÈM HƯỚNG DẪN ĐĂNG NHẬP, CƠ CHẾ QUÊN MẬT KHẨU & FILE HỢP ĐỒNG PDF
 */
function sendApprovalEmailWithContract(email, fullName, dob, gender, phone, address, code, password) {
  try {
    var subject = "✅ [SYNAPES STUDIO] THÔNG TIN ĐĂNG NHẬP & HỢP ĐỒNG DỊCH VỤ ĐIỆN TỬ — " + code;

    var htmlContract = generateContractHtmlContent(fullName, dob, gender, phone, address, code, email);
    var pdfBlob = Utilities.newBlob(htmlContract, "text/html", "HOP_DONG_DICH_VU_SYNAPES_" + code + ".html")
      .getAs("application/pdf")
      .setName("HOP_DONG_DICH_VU_SYNAPES_" + code + ".pdf");

    var emailBodyHtml =
      '<div style="font-family: \'Times New Roman\', Times, serif; font-size: 15px; line-height: 1.6; color: #1e293b; max-width: 660px; margin: 0 auto; padding: 25px; border: 1px solid #cbd5e1; border-radius: 12px; background: #ffffff;">' +
      '  <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px;">' +
      '    <h2 style="margin: 0; color: #0f172a; text-transform: uppercase; font-size: 18px; letter-spacing: 0.5px;">HỆ THỐNG CÔNG NGHỆ SYNAPES STUDIO</h2>' +
      '    <p style="margin: 4px 0 0 0; color: #475569; font-size: 13px; font-weight: bold;">BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO — THÔNG BÁO CẤP TÀI KHOẢN CHÍNH THỨC</p>' +
      '  </div>' +
      '  <p>Kính gửi Khách hàng: <b>' + fullName + '</b>,</p>' +
      '  <p>Hồ sơ đăng ký và Hợp đồng dịch vụ điện tử sử dụng nền tảng <b>SYNAPES Studio</b> của bạn đã được <b>KS. Nguyễn Hoàng Thiện</b> (Trưởng ban Chuyển đổi số & Trí tuệ nhân tạo) phê duyệt thành công.</p>' +
      '  <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0f172a; padding: 16px 20px; border-radius: 6px; margin: 18px 0;">' +
      '    <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #0f172a;">🔑 THÔNG TIN TÀI KHOẢN ĐĂNG NHẬP CỦA BẠN:</h3>' +
      '    <ul style="margin: 0; padding-left: 20px; font-size: 14.5px;">' +
      '      <li><b>Cổng làm việc trực tuyến:</b> <a href="https://synapes-auto-tool.onrender.com" target="_blank" style="color: #0284c7; font-weight: bold;">https://synapes-auto-tool.onrender.com</a></li>' +
      '      <li><b>Mã Code Đăng Nhập:</b> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #0f172a; background: #e2e8f0; padding: 2px 8px; border-radius: 4px;">' + code + '</span></li>' +
      '      <li><b>Mật Khẩu Mặc Định:</b> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #b91c1c; background: #fee2e2; padding: 2px 8px; border-radius: 4px;">' + password + '</span></li>' +
      '    </ul>' +
      '  </div>' +
      '  <div style="background: #f1f5f9; padding: 14px 18px; border-radius: 6px; margin: 15px 0; font-size: 13.5px;">' +
      '    <h4 style="margin: 0 0 6px 0; color: #0f172a;">📖 HƯỚNG DẪN ĐĂNG NHẬP & SỬ DỤNG:</h4>' +
      '    <ol style="margin: 0; padding-left: 18px; color: #334155;">' +
      '      <li>Truy cập <a href="https://synapes-auto-tool.onrender.com" target="_blank" style="color: #0284c7;">https://synapes-auto-tool.onrender.com</a> và nhấn nút <b>Đăng Nhập</b> ở góc trên bên phải.</li>' +
      '      <li>Nhập chính xác <b>Mã Code</b> (<code>' + code + '</code>) và <b>Mật Khẩu</b> (<code>' + password + '</code>) được cấp ở trên.</li>' +
      '      <li>Ngay trong phiên đăng nhập đầu tiên, bạn có thể chủ động thiết lập mật khẩu cá nhân riêng để bảo mật tuyệt đối dữ liệu kênh và API Keys.</li>' +
      '    </ol>' +
      '  </div>' +
      '  <div style="background: #fefce8; border: 1px solid #fde047; padding: 14px 18px; border-radius: 6px; margin: 15px 0; font-size: 13.5px;">' +
      '    <h4 style="margin: 0 0 6px 0; color: #854d0e;">🔒 HƯỚNG DẪN CƠ CHẾ LẤY LẠI MẬT KHẨU KHI QUÊN:</h4>' +
      '    <p style="margin: 0 0 6px 0; color: #713f12;">Khi quên mật khẩu đăng nhập, bạn thực hiện theo quy trình bảo mật sau:</p>' +
      '    <ul style="margin: 0; padding-left: 18px; color: #713f12;">' +
      '      <li>Tại cửa sổ Đăng Nhập trên WebApp, bấm vào tùy chọn <b>"Bạn quên mật khẩu?"</b>.</li>' +
      '      <li>Nhập lại chính xác <b>Gmail đã đăng ký</b> (<code>' + email + '</code>) và <b>Số điện thoại đã đăng ký</b> (<code>' + phone + '</code>).</li>' +
      '      <li>Hệ thống sẽ tự động kiểm tra đối soát trên trang tính quản trị. Nếu thông tin chính xác, hệ thống sẽ tạo lại mật khẩu mặc định mới cho Mã Code <code>' + code + '</code> và gửi ngay về Gmail này.</li>' +
      '      <li><b>Lưu ý an ninh:</b> Nếu nhập sai thông tin xác thực quá <b>05 lần</b>, hệ thống sẽ tự động đóng tính năng quên mật khẩu để bảo vệ tài khoản.</li>' +
      '    </ul>' +
      '  </div>' +
      '  <p><b>📄 Bản mềm Hợp đồng dịch vụ điện tử (PDF):</b> Được đính kèm trực tiếp dưới thư này với đầy đủ thông tin hai bên, chữ ký xác nhận và con dấu đỏ của Trưởng ban Chuyển đổi số & Trí tuệ nhân tạo.</p>' +
      '  <div style="margin-top: 25px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569;">' +
      '    <p style="margin: 0;">Trân trọng,</p>' +
      '    <p style="margin: 3px 0 0 0; color: #0f172a;"><b>KS. NGUYỄN HOÀNG THIỆN</b> — Trưởng ban Chuyển đổi số & Trí tuệ nhân tạo</p>' +
      '    <p style="margin: 2px 0 0 0;">Email hỗ trợ: <a href="mailto:nguyenhoangthien.hvt.15@gmail.com">nguyenhoangthien.hvt.15@gmail.com</a></p>' +
      '  </div>' +
      '</div>';

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: emailBodyHtml,
      attachments: [pdfBlob]
    });

    return { success: true };
  } catch (err) {
    Logger.log("Lỗi gửi Gmail phê duyệt: " + err);
    return { success: false, error: err.toString() };
  }
}

/**
 * 6. GỬI GMAIL CẤP LẠI MẬT KHẨU MẶC ĐỊNH KHI NGƯỜI DÙNG QUÊN MẬT KHẨU
 */
function sendForgotPasswordEmail(email, fullName, code, newPassword) {
  try {
    var subject = "🔑 [SYNAPES STUDIO] CẤP LẠI MẬT KHẨU MẶC ĐỊNH — MÃ CODE: " + code;
    var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

    var emailBodyHtml =
      '<div style="font-family: \'Times New Roman\', Times, serif; font-size: 15px; line-height: 1.6; color: #1e293b; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px; background: #ffffff;">' +
      '  <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px;">' +
      '    <h2 style="margin: 0; color: #0f172a; text-transform: uppercase; font-size: 17px;">HỆ THỐNG CÔNG NGHỆ SYNAPES STUDIO</h2>' +
      '    <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12.5px;">XÁC THỰC CẤP LẠI MẬT KHẨU MẶC ĐỊNH THÀNH CÔNG</p>' +
      '  </div>' +
      '  <p>Xin chào <b>' + (fullName || "Khách hàng SYNAPES") + '</b>,</p>' +
      '  <p>Hệ thống đã tiếp nhận yêu cầu lấy lại mật khẩu và đối soát chính xác thông tin Gmail & Số điện thoại đăng ký của bạn vào lúc <b>' + nowStr + '</b>.</p>' +
      '  <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #16a34a; padding: 15px 18px; border-radius: 6px; margin: 18px 0;">' +
      '    <div style="font-size: 14.5px; margin-bottom: 6px;"><b>• Mã Code Đăng Nhập:</b> <span style="font-family: monospace; font-weight: bold; font-size: 15px; background: #e2e8f0; padding: 2px 8px; border-radius: 4px;">' + code + '</span></div>' +
      '    <div style="font-size: 14.5px;"><b>• Mật Khẩu Mặc Định Mới:</b> <span style="font-family: monospace; font-weight: bold; font-size: 16px; color: #b91c1c; background: #fee2e2; padding: 2px 8px; border-radius: 4px;">' + newPassword + '</span></div>' +
      '  </div>' +
      '  <p style="font-size: 13.5px; color: #334155;">Vui lòng sử dụng mật khẩu mặc định mới này để đăng nhập tại <a href="https://synapes-auto-tool.onrender.com" target="_blank">https://synapes-auto-tool.onrender.com</a> và thiết lập lại mật khẩu cá nhân của bạn.</p>' +
      '  <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12.5px; color: #64748b;">' +
      '    <b>Ban Chuyển đổi số & Trí tuệ nhân tạo SYNAPES</b> — KS. Nguyễn Hoàng Thiện (nguyenhoangthien.hvt.15@gmail.com)' +
      '  </div>' +
      '</div>';

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: emailBodyHtml
    });
    return { success: true };
  } catch (err) {
    Logger.log("Lỗi gửi mail quên mật khẩu: " + err);
    return { success: false, error: err.toString() };
  }
}

/**
 * 7. TẠO NỘI DUNG HTML HỢP ĐỒNG ĐẦY ĐỦ KÈM CON DẤU ĐỎ TRƯỞNG BAN ĐỂ XUẤT FILE PDF ĐÍNH KÈM GMAIL
 */
function generateContractHtmlContent(fullName, dob, gender, phone, address, code, email) {
  var now = new Date();
  var day = Utilities.formatDate(now, "GMT+7", "dd");
  var month = Utilities.formatDate(now, "GMT+7", "MM");
  var year = Utilities.formatDate(now, "GMT+7", "yyyy");
  var dateStr = day + "/" + month + "/" + year;

  // Tải con dấu Trưởng ban từ cổng WebApp chuyển sang Base64 để nhúng trực tiếp vào PDF
  var stampImgHtml = '<div style="border: 2px solid #b91c1c; color: #b91c1c; padding: 8px 14px; display: inline-block; font-weight: bold; font-size: 9pt; border-radius: 4px; margin: 8px 0;">ĐÃ ĐÓNG DẤU XÁC THỰC<br/>TRƯỞNG BAN CHUYỂN ĐỔI SỐ & AI</div>';
  try {
    var resp = UrlFetchApp.fetch("https://synapes-auto-tool.onrender.com/stamp-truong-ban.png", { muteHttpExceptions: true });
    if (resp.getResponseCode() === 200) {
      var b64 = Utilities.base64Encode(resp.getContent());
      stampImgHtml = '<img src="data:image/png;base64,' + b64 + '" style="width: 145px; height: auto; display: block; margin: 4px auto;" />';
    }
  } catch (e) {}

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
    '  <h1>HỢP ĐỒNG ĐIỆN TỬ CUNG CẤP & SỬ DỤNG DỊCH VỤ PHẦN MỀM</h1>' +
    '  <h2>NỀN TẢNG SẢN XUẤT VIDEO TỰ ĐỘNG SYNAPES STUDIO</h2>' +
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
    '  • Hộp thư điện tử: nguyenhoangthien.hvt.15@gmail.com &nbsp;|&nbsp; Cổng dịch vụ: https://synapes-auto-tool.onrender.com' +
    '</div>' +
    '<div class="party-box">' +
    '  <b>BÊN B: BÊN MUA HÀNG VÀ SỬ DỤNG DỊCH VỤ (KHÁCH HÀNG)</b><br/>' +
    '  • Họ và tên khách hàng: <b>' + fullName + '</b> &nbsp;|&nbsp; Ngày sinh: ' + dob + ' &nbsp;|&nbsp; Giới tính: ' + (gender || "Nam") + '<br/>' +
    '  • Số điện thoại: ' + phone + ' &nbsp;|&nbsp; Gmail đăng ký: ' + (email || "") + '<br/>' +
    '  • Địa chỉ hiện tại: ' + address +
    '</div>' +
    '<div class="section">Điều 1. Quy chế cung cấp và sử dụng dịch vụ phần mềm SYNAPES Studio</div>' +
    '<p>1.1. Bên A cấp quyền sử dụng phần mềm tự động hóa sản xuất nội dung số (SaaS) SYNAPES Auto Tool cho Bên B với Mã Code định danh <b>' + code + '</b>.</p>' +
    '<p>1.2. Bên B được khai thác toàn diện các phân hệ: Khởi tạo kịch bản đa mô hình AI (GPT, Claude, Gemini, DeepSeek, Grok), giọng đọc nhân tạo (TTS), biên tập ghép cảnh (MultiClip Stitcher) và đồng bộ xuất bản đa kênh.</p>' +
    '<div class="section">Điều 2. Cam kết bảo mật dữ liệu cá nhân & an toàn Token API</div>' +
    '<p>2.1. Tuân thủ Nghị định 13/2023/NĐ-CP, Bên A áp dụng chuẩn mã hóa AES-256-GCM bảo vệ toàn diện dữ liệu dự án và khóa kết nối API (AI Models, YouTube, TikTok, Meta, Google Drive) của Bên B; cam kết không tiết lộ cho bất kỳ bên thứ ba nào.</p>' +
    '<div class="section">Điều 3. Quyền sở hữu trí tuệ đối với kịch bản và sản phẩm video</div>' +
    '<p>3.1. Căn cứ Luật Sở hữu trí tuệ và Công ước Berne: Bên B là chủ sở hữu quyền tác giả duy nhất và toàn vẹn 100% đối với toàn bộ kịch bản và video thành phẩm được tạo ra từ hệ thống.</p>' +
    '<div class="section">Điều 4. Cơ chế phê duyệt kiểm soát nội dung & Miễn trừ trách nhiệm</div>' +
    '<p>4.1. Phần mềm vận hành theo cơ chế kiểm duyệt con người (Human-in-the-loop). Bên B trực tiếp kiểm duyệt nội dung trước khi xuất bản và tự chịu trách nhiệm pháp lý theo Luật An ninh mạng 2018 và Nghị định 147/2024/NĐ-CP.</p>' +
    '<div class="section">Điều 5. Hiệu lực hợp đồng</div>' +
    '<p>5.1. Hợp đồng điện tử này có giá trị pháp lý tương đương hợp đồng giấy theo Điều 13 và Điều 34 Luật Giao dịch điện tử số 20/2023/QH15.</p>' +
    '<table class="sign-table"><tr>' +
    '  <td><b>ĐẠI DIỆN MUA HÀNG (BÊN B)</b><br/><i>(Đã ký xác nhận điện tử)</i><br/><br/><div style="border: 1px dashed #15803d; color: #15803d; display: inline-block; padding: 6px 12px; font-size: 8.5pt; font-weight: bold; margin: 10px 0;">ĐÃ KÝ XÁC NHẬN ĐIỆN TỬ<br/>Ngày: ' + dateStr + '</div><br/><b>' + fullName.toUpperCase() + '</b></td>' +
    '  <td><b>ĐẠI DIỆN GIAO DỊCH (BÊN A)</b><br/><b>TRƯỞNG BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO</b><br/><i>(Ký, đóng dấu xác thực điện tử)</i><br/>' + stampImgHtml + '<b>KS. NGUYỄN HOÀNG THIỆN</b></td>' +
    '</tr></table>' +
    '</body></html>';
}

/**
 * 8. ĐỒNG BỘ TÀI KHOẢN SANG TRANG TÍNH "Quản Lý Mật Khẩu" (GID = 0)
 * Tự động tìm dòng trống đầu tiên từ dòng 5 trở đi (STT 1, 2, 3, 4...)
 * Tuyệt đối KHÔNG ghi đè người dùng B lên hàng của người dùng A (kể cả khi dùng chung Gmail test)
 */
function syncAccountToMainSheet(code, name, email, password, phone, address, isReset) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getAccountsSheet(ss);
  if (!sheet) return;

  var maxRow = Math.max(sheet.getLastRow(), 15);
  var data = sheet.getRange(1, 1, maxRow, 9).getDisplayValues();

  // Xác định dòng tiêu đề "MÃ CODE KHÁCH HÀNG" (thường ở dòng 4 trên "Quản Lý Mật Khẩu" hoặc dòng 1)
  var startDataRow = 5;
  for (var h = 0; h < Math.min(data.length, 6); h++) {
    var colBHeader = String(data[h][1] || "").toLowerCase();
    if (colBHeader.indexOf("mã code") !== -1 || colBHeader.indexOf("mã khách hàng") !== -1) {
      startDataRow = h + 2; // Dòng ngay sau tiêu đề (dòng 5 = STT 1)
      break;
    }
  }

  var codeClean = String(code || "").trim().toUpperCase();
  var nameClean = String(name || "").trim().toLowerCase();

  var targetRow = -1;
  var existingRow = -1;

  // Bước 1: Chỉ cập nhật lại dòng cũ nếu TRÙNG MÃ CODE và CÙNG TÊN KHÁCH HÀNG (hoặc khi cấp lại pass cho đúng Mã Code đó)
  // Tuyệt đối KHÔNG gộp theo Gmail để tránh ghi đè khi nhiều khách hàng / tài khoản dùng chung Gmail
  for (var i = startDataRow - 1; i < data.length; i++) {
    var rowCode = String(data[i][1] || "").trim().toUpperCase();
    var rowName = String(data[i][2] || "").trim().toLowerCase();
    if (codeClean && rowCode === codeClean) {
      if (isReset || !rowName || !nameClean || rowName === nameClean) {
        existingRow = i + 1;
        break;
      }
    }
  }

  if (existingRow !== -1) {
    targetRow = existingRow;
  } else {
    // Bước 2: Tìm dòng trống đầu tiên từ startDataRow (dòng 5 = STT 1, dòng 6 = STT 2, dòng 7 = STT 3...)
    // nơi Cột B (Mã Code) và Cột C (Tên khách hàng) đang trống để trải đều dữ liệu
    for (var j = startDataRow - 1; j < data.length; j++) {
      var cCode = String(data[j][1] || "").trim();
      var cName = String(data[j][2] || "").trim();
      if (cCode === "" && cName === "") {
        targetRow = j + 1;
        break;
      }
    }
    if (targetRow === -1) {
      targetRow = maxRow + 1;
    }
  }

  var stt = targetRow - startDataRow + 1;
  var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm");
  var isHashedPass = String(password || "").indexOf("BCRYPT$") !== -1 || String(password || "").indexOf("🔒") !== -1;
  var statusText = isHashedPass
    ? "🟢 Khách đã đổi pass riêng"
    : (isReset ? "🟡 Vừa cấp lại pass tạm" : "⚪ Dùng mặc định");
  var noteText = "SĐT: " + (phone || "N/A") + (address ? " | Đ/c: " + address : "");

  sheet.getRange(targetRow, 1).setValue(stt).setHorizontalAlignment("center");
  sheet.getRange(targetRow, 2).setValue(code).setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange(targetRow, 3).setValue(name);
  sheet.getRange(targetRow, 4).setValue(email);
  sheet.getRange(targetRow, 5).setValue(password).setFontWeight("bold");
  sheet.getRange(targetRow, 6).setValue(nowStr).setHorizontalAlignment("center");

  try {
    sheet.getRange(targetRow, 7).setValue(statusText);
  } catch (err) {
    // Nếu ô có Data Validation khác thì bỏ qua lỗi validation
  }

  // Kiểm tra số cột của bảng (9 cột trên Quản Lý Mật Khẩu)
  if (sheet.getMaxColumns() >= 9) {
    sheet.getRange(targetRow, 8).setValue("Pro Studio");
    if (!existingRow || isReset) {
      sheet.getRange(targetRow, 9).setValue(noteText);
    }
  } else if (sheet.getMaxColumns() >= 8) {
    sheet.getRange(targetRow, 8).setValue(noteText);
  }
}

/**
 * Đối soát và trải đều toàn bộ các hồ sơ đã duyệt từ "THÔNG TIN NGƯỜI DÙNG" sang "Quản Lý Mật Khẩu"
 * Đảm bảo mọi người dùng A, B, C... đã được tích duyệt đều xuất hiện đầy đủ ở các hàng 1, 2, 3...
 */
function reconcileAllApprovedUsersToAccountsSheet(ss) {
  try {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    var uSheet = getUsersSheet(ss, false);
    if (!uSheet || uSheet.getLastRow() < 2) return;

    var lastRow = uSheet.getLastRow();
    var uData = uSheet.getRange(2, 1, lastRow - 1, 13).getDisplayValues();
    var uRaw = uSheet.getRange(2, 1, lastRow - 1, 13).getValues();

    for (var i = 0; i < uData.length; i++) {
      var rIdx = i + 2;
      var fullName = String(uData[i][2] || "").trim();
      var email = String(uData[i][5] || "").trim();
      if (!fullName || !email) continue;

      var isChecked = uRaw[i][8] === true || String(uData[i][8]).toUpperCase() === "TRUE";
      var code = String(uData[i][9] || "").trim();
      var pass = String(uData[i][10] || "").trim();
      var phone = String(uData[i][6] || "").trim();
      var address = String(uData[i][7] || "").trim();

      if (isChecked || (code && code.indexOf("SNP_") === 0)) {
        // Đảm bảo mã code của dòng này không trùng với dòng phía trên
        if (code) {
          var uniqueCode = ensureUniqueUserCode(ss, code, rIdx, fullName);
          if (uniqueCode !== code) {
            code = uniqueCode;
            uSheet.getRange(rIdx, 10).setValue(code);
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
 * 9. CÁC NÚT MENU XEM HỢP ĐỒNG PDF & DUYỆT HỒ SƠ TRỰC TIẾP TRÊN SHEET
 */
function previewSelectedUserContractModal() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  if (!isUsersSheet(sheet)) {
    var uSheet = getUsersSheet(ss, false);
    if (uSheet) {
      ss.setActiveSheet(uSheet);
      sheet = uSheet;
    } else {
      SpreadsheetApp.getUi().alert('⚠️ Vui lòng chuyển sang trang tính "THÔNG TIN NGƯỜI DÙNG" để xem Hợp đồng PDF!');
      return;
    }
  }

  var row = sheet.getActiveCell().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert("⚠️ Vui lòng chọn một dòng thông tin khách hàng (từ dòng 2 trở đi).");
    return;
  }

  var vals = sheet.getRange(row, 1, 1, 13).getDisplayValues()[0];
  var fullName = String(vals[2] || "").trim();
  var dob = String(vals[3] || "").trim();
  var gender = String(vals[4] || "Nam").trim();
  var email = String(vals[5] || "").trim();
  var phone = String(vals[6] || "").trim();
  var address = String(vals[7] || "").trim();
  var code = String(vals[9] || "CHỜ_CẤP_MÃ").trim();

  if (!fullName) {
    SpreadsheetApp.getUi().alert("⚠️ Dòng " + row + " chưa có thông tin khách hàng.");
    return;
  }

  var htmlContent = generateContractHtmlContent(fullName, dob, gender, phone, address, code, email);
  var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(820)
    .setHeight(680);
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
  sheet.getRange(row, 9).setValue(true);
  var ok = processUserApproval(sheet, row, true);
  if (ok) {
    SpreadsheetApp.getUi().alert(
      "✅ ĐÃ PHÊ DUYỆT & GỬI GMAIL THÀNH CÔNG (DÒNG " + row + ")!\n\n" +
      "• Mã Code và Mật khẩu đã được tạo tự động.\n" +
      "• Đã lưu sang trang tính 'Quản Lý Mật Khẩu'.\n" +
      "• Đã gửi Gmail kèm Hợp đồng PDF có dấu đỏ tới khách hàng."
    );
  }
}

function resendEmailForSelectedRow() {
  approveSelectedUserRow();
}

function approveAllPendingUsers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getUsersSheet(ss, false);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('⚠️ Chưa tìm thấy trang tính "THÔNG TIN NGƯỜI DÙNG".');
    return;
  }

  installAutoEditTrigger(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    SpreadsheetApp.getUi().alert("ℹ️ Hiện chưa có hồ sơ khách hàng nào trên bảng tính.");
    return;
  }

  var data = sheet.getRange(2, 1, lastRow - 1, 13).getDisplayValues();
  var count = 0;

  for (var i = 0; i < data.length; i++) {
    var fullName = String(data[i][2] || "").trim();
    var email = String(data[i][5] || "").trim();
    if (!fullName || !email || email.indexOf("@") === -1) continue;

    var code = String(data[i][9] || "").trim();
    var mailStatus = String(data[i][11] || "").trim();

    if (!code || mailStatus.indexOf("ĐÃ GỬI GMAIL") === -1) {
      var targetRow = i + 2;
      sheet.getRange(targetRow, 9).setValue(true);
      if (processUserApproval(sheet, targetRow, true)) {
        count++;
      }
    }
  }

  SpreadsheetApp.getUi().alert("⚡ ĐÃ DUYỆT & GỬI GMAIL TỰ ĐỘNG CHO " + count + " HỒ SƠ KHÁCH HÀNG!");
}

/**
 * 10. WEBHOOK TIẾP NHẬN DỮ LIỆU TỪ WEBAPP (HỖ TRỢ CẢ doGet JSONP VÀ doPost)
 */
function doGet(e) {
  var result = {
    status: "ok",
    message: "SYNAPES Studio Google Sheet Webhook is active"
  };

  if (e && e.parameter && e.parameter.payload) {
    try {
      var payload = JSON.parse(e.parameter.payload);
      result = processWebhookPayload(payload);
    } catch (err) {
      result = { status: "error", message: err.toString() };
    }
  }

  var jsonStr = JSON.stringify(result);
  if (e && e.parameter && e.parameter.callback) {
    return ContentService.createTextOutput(e.parameter.callback + "(" + jsonStr + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(jsonStr)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result = { status: "ok" };
  try {
    var raw = "";
    if (e && e.postData && e.postData.contents) {
      raw = e.postData.contents;
    } else if (e && e.parameter && e.parameter.payload) {
      raw = e.parameter.payload;
    }
    if (raw) {
      var payload = JSON.parse(raw);
      result = processWebhookPayload(payload);
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Xử lý tập trung mọi yêu cầu từ WebApp gửi về Google Sheet:
 * - action = "register" (Bước 1: Chờ ký hợp đồng / Bước 2: Đã ký hợp đồng qua WebApp)
 * - action = "forgot_password" (Cấp lại mật khẩu mặc định & gửi Gmail)
 * - action = "approve_user" (Duyệt cấp tài khoản & gửi Gmail)
 * - action = "save_webhook_url" (Lưu URL Webhook vào ô N1 & J4)
 */
function processWebhookPayload(payload) {
  if (!payload) return { status: "error", message: "Empty payload" };

  // Chống xử lý trùng lặp bằng cả CacheService và PropertiesService
  if (payload.requestId) {
    try {
      var cache = CacheService.getScriptCache();
      if (cache.get(payload.requestId)) {
        return { status: "already_processed", requestId: payload.requestId };
      }
      var props = PropertiesService.getScriptProperties();
      var historyRaw = props.getProperty("PROCESSED_REQ_IDS") || "[]";
      var historyList = JSON.parse(historyRaw);
      if (historyList.indexOf(payload.requestId) !== -1) {
        return { status: "already_processed", requestId: payload.requestId };
      }
      historyList.push(payload.requestId);
      if (historyList.length > 80) {
        historyList = historyList.slice(historyList.length - 80);
      }
      props.setProperty("PROCESSED_REQ_IDS", JSON.stringify(historyList));
      cache.put(payload.requestId, "1", 21600);
    } catch (e) {}
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {}

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = payload.action || "register";

    if (action === "save_webhook_url" && payload.webhookUrl) {
      autoPublishWebhookUrlToSheet(ss, payload.webhookUrl);
      return { status: "success", message: "Saved webhook URL to sheet" };
    }

    if (action === "forgot_password") {
      return handleForgotPasswordWebhook(ss, payload);
    }

    if (action === "change_password") {
      return handleChangePasswordWebhook(ss, payload);
    }

    if (action === "approve_user") {
      var uSheet = getUsersSheet(ss, true);
      var target = findOrCreateUserRowByEmail(uSheet, payload.email, payload.fullName, true);
      if (!target.isExisting && payload.email) {
        handleUserRegistrationWebhook(ss, {
          fullName: payload.fullName || "Khách hàng SYNAPES",
          dob: payload.dob || "01/01/2000",
          gender: payload.gender || "Nam",
          email: payload.email,
          phone: payload.phone || "",
          address: payload.address || "",
          termsAccepted: true,
          notes: "📄 HOP_DONG_DICH_VU_SYNAPES.pdf (Đã ký — Chờ duyệt)"
        });
        target = findOrCreateUserRowByEmail(uSheet, payload.email, payload.fullName, true);
      }
      if (target.row >= 2) {
        if (payload.code) {
          uSheet.getRange(target.row, 10).setValue(payload.code);
        }
        if (payload.password) {
          uSheet.getRange(target.row, 11).setValue(payload.password);
        }
        uSheet.getRange(target.row, 9).setValue(true);
        processUserApproval(uSheet, target.row, true);
      }
      return { status: "success", action: "approve_user" };
    }

    // Mặc định: action === "register" (Cập nhật thông tin đăng ký lên trang "THÔNG TIN NGƯỜI DÙNG")
    return handleUserRegistrationWebhook(ss, payload);
  } catch (err) {
    return { status: "error", message: err.toString() };
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

/**
 * Tìm dòng của người dùng hoặc tìm dòng trống đầu tiên (từ dòng 2 trở đi)
 * - Khi đăng ký mới (isApprovalLookup = false): Chỉ cập nhật dòng cũ nếu CÙNG HỌ TÊN + CÙNG GMAIL
 *   VÀ dòng đó CHƯA ĐƯỢC DUYỆT (để Bước 2 "Ký hợp đồng" cập nhật tiếp vào dòng nháp vừa tạo ở Bước 1).
 *   Nếu là người dùng khác (họ tên khác) hoặc dòng trước đã được duyệt cấp mã, BẮT BUỘC ghi xuống hàng mới tiếp theo!
 */
function findOrCreateUserRowByEmail(sheet, email, fullName, isApprovalLookup) {
  var maxRow = Math.max(sheet.getLastRow(), 2);
  var data = sheet.getRange(2, 1, maxRow - 1, 13).getDisplayValues();
  var rawApprovedVals = sheet.getRange(2, 9, maxRow - 1, 1).getValues();
  var emailClean = String(email || "").trim().toLowerCase();
  var nameClean = String(fullName || "").trim().toLowerCase();

  // 1. Tìm từ dưới lên dòng nháp của đúng người dùng này (cùng Họ tên + cùng Gmail)
  if (emailClean) {
    for (var i = data.length - 1; i >= 0; i--) {
      var rowName = String(data[i][2] || "").trim().toLowerCase();
      var rowEmail = String(data[i][5] || "").trim().toLowerCase();
      var rowCode = String(data[i][9] || "").trim();
      var isRowApproved =
        rawApprovedVals[i][0] === true ||
        String(data[i][8] || "").toUpperCase() === "TRUE" ||
        rowCode !== "";

      if (rowEmail === emailClean && (!nameClean || rowName === nameClean)) {
        if (isApprovalLookup) {
          return { row: i + 2, isExisting: true };
        }
        // Khi đăng ký trên WebApp: Chỉ ghi cập nhật vào dòng CHƯA DUYỆT của đúng người đó
        // Tuyệt đối không ghi đè vào dòng đã duyệt trước đó
        if (!isRowApproved) {
          return { row: i + 2, isExisting: true };
        }
      }
    }
  }

  // 2. Tìm dòng trống đầu tiên từ dòng 2 trở đi (Hàng 1 -> Hàng 2 -> Hàng 3...) để trải đều dữ liệu
  for (var j = 0; j < data.length; j++) {
    var rName = String(data[j][2] || "").trim();
    var rMail = String(data[j][5] || "").trim();
    var rCode = String(data[j][9] || "").trim();
    if (rName === "" && rMail === "" && rCode === "") {
      return { row: j + 2, isExisting: false };
    }
  }

  return { row: maxRow + 1, isExisting: false };
}

/**
 * Ghi hoặc cập nhật thông tin người dùng đăng ký vào trang "THÔNG TIN NGƯỜI DÙNG"
 */
function handleUserRegistrationWebhook(ss, payload) {
  var sheet = getUsersSheet(ss, true);
  var now = new Date();
  var nowStr = Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm:ss");
  var dobParsed = parseDobToDDMM(payload.dob || "", now);

  var target = findOrCreateUserRowByEmail(sheet, payload.email, payload.fullName, false);
  var targetRow = target.row;
  var stt = targetRow - 1;

  var existingApproved = false;
  var existingCode = "";
  var existingPass = "";
  var existingMailStatus = "";

  if (target.isExisting) {
    var existingVals = sheet.getRange(targetRow, 1, 1, 13).getDisplayValues()[0];
    var existingRaw = sheet.getRange(targetRow, 9).getValue();
    existingApproved = existingRaw === true || String(existingRaw).toUpperCase() === "TRUE";
    existingCode = String(existingVals[9] || "").trim();
    existingPass = String(existingVals[10] || "").trim();
    existingMailStatus = String(existingVals[11] || "").trim();
  }

  var isSigned = payload.termsAccepted === true || String(payload.notes || "").indexOf("Đã ký") !== -1;
  var mailStatus = existingMailStatus || (isSigned ? "⏳ Chờ Ban quản lý duyệt" : "Chờ khách ký hợp đồng");
  if (isSigned && (mailStatus === "Chờ khách ký hợp đồng" || mailStatus === "Chờ Kỹ sư duyệt")) {
    mailStatus = "⏳ Chờ Ban quản lý duyệt";
  }
  var contractNote = payload.notes || (isSigned ? "📄 Hợp đồng PDF đã ký — Chờ Ban quản lý duyệt" : "Chờ ký hợp đồng");

  var phoneStr = String(payload.phone || "").trim();
  if (phoneStr && phoneStr.charAt(0) === "0") {
    phoneStr = "'" + phoneStr;
  }
  var dobStr = dobParsed.formattedDob || String(payload.dob || "").trim();
  if (dobStr) {
    dobStr = "'" + dobStr;
  }

  var rowValues = [
    stt,
    payload.registeredAt || nowStr,
    payload.fullName || "",
    dobStr,
    payload.gender || "Nam",
    payload.email || "",
    phoneStr,
    payload.address || "",
    existingApproved,
    existingCode,
    existingPass,
    mailStatus,
    contractNote
  ];

  var rowRange = sheet.getRange(targetRow, 1, 1, 13);
  rowRange.setValues([rowValues]);
  rowRange.setFontFamily("Times New Roman").setFontSize(10.5).setVerticalAlignment("middle");

  sheet.getRange(targetRow, 1).setHorizontalAlignment("center");
  sheet.getRange(targetRow, 2).setHorizontalAlignment("center");
  sheet.getRange(targetRow, 4, 1, 2).setHorizontalAlignment("center");
  sheet.getRange(targetRow, 7).setHorizontalAlignment("center");
  sheet.getRange(targetRow, 9).insertCheckboxes();
  sheet.getRange(targetRow, 9, 1, 3).setHorizontalAlignment("center");

  // Lưu trữ thông tin bản mềm Hợp đồng PDF đã ký ngay trên ô Cột M để Kỹ sư kiểm tra & xác nhận
  if (isSigned) {
    var contractSummaryNote =
      "📄 BẢN LƯU HỢP ĐỒNG DỊCH VỤ ĐIỆN TỬ (PDF)\n" +
      "------------------------------------------\n" +
      "• Đại diện Bên A: KS. Nguyễn Hoàng Thiện (Trưởng ban CĐS & TTNT)\n" +
      "• Đại diện Bên B (Mua hàng): " + (payload.fullName || "") + " (Đã ký điện tử)\n" +
      "• Ngày sinh: " + (dobParsed.formattedDob || payload.dob || "") + " | Giới tính: " + (payload.gender || "Nam") + "\n" +
      "• Số điện thoại: " + (payload.phone || "") + "\n" +
      "• Gmail nhận HĐ & Tài khoản: " + (payload.email || "") + "\n" +
      "• Địa chỉ thực tế: " + (payload.address || "") + "\n" +
      "• Thời điểm ký: " + (payload.registeredAt || nowStr) + "\n" +
      "------------------------------------------\n" +
      "👉 HƯỚNG DẪN DUYỆT: Tích chọn ô Checkbox tại Cột I (Duyệt Cấp Tài Khoản) để hệ thống tự động sinh Mã Code + Mật khẩu và gửi kèm file PDF Hợp đồng hoàn chỉnh tới Gmail khách hàng.";
    sheet.getRange(targetRow, 13).setNote(contractSummaryNote);
  }

  return {
    status: "success",
    action: "register",
    row: targetRow,
    notes: contractNote
  };
}

/**
 * Xử lý Quên mật khẩu: Cập nhật mật khẩu mặc định mới lên cả 2 trang tính và gửi Gmail cho người dùng
 */
function handleForgotPasswordWebhook(ss, payload) {
  var email = String(payload.email || "").trim();
  var phone = String(payload.phone || "").trim();
  var code = String(payload.code || "").trim().toUpperCase();
  var newPassword = String(payload.newPassword || "").trim();
  var fullName = String(payload.fullName || "Khách hàng SYNAPES").trim();

  if (!email || !newPassword) {
    return { status: "error", message: "Missing email or newPassword" };
  }

  var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

  // 1. Cập nhật trên trang "THÔNG TIN NGƯỜI DÙNG" nếu có
  var uSheet = getUsersSheet(ss, false);
  if (uSheet && uSheet.getLastRow() >= 2) {
    var uData = uSheet.getRange(2, 1, uSheet.getLastRow() - 1, 13).getDisplayValues();
    for (var i = 0; i < uData.length; i++) {
      var rMail = String(uData[i][5] || "").trim().toLowerCase();
      var rCode = String(uData[i][9] || "").trim().toUpperCase();
      if ((code && rCode === code) || (!code && rMail === email.toLowerCase())) {
        var rIdx = i + 2;
        if (!code && rCode) code = rCode;
        if (uData[i][2]) fullName = uData[i][2];
        uSheet.getRange(rIdx, 11).setValue(newPassword).setFontWeight("bold").setFontColor("#b91c1c");
        uSheet.getRange(rIdx, 12).setValue("🔄 Đã cấp lại MK (" + nowStr + ")");
        break;
      }
    }
  }

  // 2. Cập nhật trên trang "Quản Lý Mật Khẩu"
  if (code) {
    syncAccountToMainSheet(code, fullName, email, newPassword, phone, "", true);
  }

  // 3. Gửi Gmail chứa mật khẩu mặc định mới cho người dùng
  var mailRes = sendForgotPasswordEmail(email, fullName, code || "SYNAPES_USER", newPassword);

  return {
    status: "success",
    action: "forgot_password",
    emailSent: mailRes.success
  };
}

/**
 * Xử lý khi người dùng đổi mật khẩu cá nhân mới trên WebApp:
 * - Xóa mật khẩu tạm trên cả 2 trang tính và thay bằng mã băm một chiều (🔒 Đã mã hóa [BCRYPT$...])
 *   để Dev/Kỹ sư hoàn toàn không biết mật khẩu riêng của người dùng, nhưng người dùng đăng nhập
 *   ở bất kỳ thiết bị nào vẫn đối chiếu mã băm thành công.
 * - Cập nhật trạng thái "🟢 Đã tạo mật khẩu mới" / "🟢 Khách đã đổi pass riêng" trên Google Sheet.
 */
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

  // 1. Cập nhật trên trang "THÔNG TIN NGƯỜI DÙNG"
  var uSheet = getUsersSheet(ss, false);
  if (uSheet && uSheet.getLastRow() >= 2) {
    var uData = uSheet.getRange(2, 1, uSheet.getLastRow() - 1, 13).getDisplayValues();
    for (var i = 0; i < uData.length; i++) {
      var rMail = String(uData[i][5] || "").trim().toLowerCase();
      var rCode = String(uData[i][9] || "").trim().toUpperCase();
      if ((code && rCode === code) || (!code && email && rMail === email)) {
        var rIdx = i + 2;
        if (!code && rCode) code = rCode;
        if (!fullName && uData[i][2]) fullName = uData[i][2];
        if (!email && rMail) email = rMail;
        uSheet
          .getRange(rIdx, 11)
          .setValue(maskedPassValue)
          .setFontWeight("bold")
          .setFontColor("#0f766e")
          .setHorizontalAlignment("center");
        uSheet
          .getRange(rIdx, 12)
          .setValue("🟢 Đã tạo mật khẩu mới (" + nowStr + ")")
          .setFontColor("#15803d")
          .setFontWeight("bold");
        uSheet
          .getRange(rIdx, 13)
          .setValue("Đã ký hợp đồng | 🟢 Đã tạo mật khẩu mới");
        break;
      }
    }
  }

  // 2. Cập nhật trên trang "Quản Lý Mật Khẩu"
  var accSheet = getAccountsSheet(ss);
  if (accSheet) {
    var maxRow = Math.max(accSheet.getLastRow(), 5);
    var accData = accSheet.getRange(1, 1, maxRow, 9).getDisplayValues();
    var startDataRow = 5;
    for (var h = 0; h < Math.min(accData.length, 6); h++) {
      var colBHeader = String(accData[h][1] || "").toLowerCase();
      if (colBHeader.indexOf("mã code") !== -1 || colBHeader.indexOf("mã khách hàng") !== -1) {
        startDataRow = h + 2;
        break;
      }
    }

    var foundAccRow = -1;
    for (var j = startDataRow - 1; j < accData.length; j++) {
      var cCode = String(accData[j][1] || "").trim().toUpperCase();
      var cMail = String(accData[j][3] || "").trim().toLowerCase();
      if ((code && cCode === code) || (!code && email && cMail !== "" && cMail === email)) {
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
      try {
        accSheet.getRange(foundAccRow, 7).setValue("🟢 Khách đã đổi pass riêng");
      } catch (err) {}
      if (accSheet.getMaxColumns() >= 9) {
        accSheet
          .getRange(foundAccRow, 9)
          .setValue("🟢 Đã tạo mật khẩu mới (" + nowStr + ") — Mật khẩu riêng đã ẩn bảo mật");
      }
    } else if (code) {
      syncAccountToMainSheet(code, fullName || "Khách hàng SYNAPES", email, maskedPassValue, "", "", false);
      var newMaxRow = accSheet.getLastRow();
      for (var k = startDataRow; k <= newMaxRow; k++) {
        var checkCode = String(accSheet.getRange(k, 2).getDisplayValue() || "").trim().toUpperCase();
        if (checkCode === code) {
          try {
            accSheet.getRange(k, 7).setValue("🟢 Khách đã đổi pass riêng");
          } catch (err2) {}
          if (accSheet.getMaxColumns() >= 9) {
            accSheet
              .getRange(k, 9)
              .setValue("🟢 Đã tạo mật khẩu mới (" + nowStr + ") — Mật khẩu riêng đã ẩn bảo mật");
          }
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

/**
 * 11. TIỆN ÍCH ĐỒNG BỘ & MỞ WEBAPP
 */
function syncToWebApp() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  installAutoEditTrigger(ss);
  var bridgeUrl = setupGoogleFormBridge(ss);
  var syncedCount = syncPendingFormBridgeResponses();
  reconcileAllApprovedUsersToAccountsSheet(ss);
  var url = bridgeUrl || autoPublishWebhookUrlToSheet(ss);

  SpreadsheetApp.getUi().alert(
    "🔄 ĐÃ ĐỒNG BỘ DỮ LIỆU VỚI WEBAPP!\n\n" +
    "• Đã quét và cập nhật " + syncedCount + " hồ sơ mới từ Cầu nối tự động.\n" +
    "• Trang \"THÔNG TIN NGƯỜI DÙNG\" và \"Quản Lý Mật Khẩu\" đang kết nối thời gian thực với WebApp.\n" +
    "• Bộ kích hoạt tự động gửi Gmail khi tích Checkbox Cột I: ĐÃ BẬT.\n" +
    (url ? "• Cầu nối 2 chiều đang hoạt động: " + url + "\n" : "") +
    "\nĐịa chỉ WebApp: https://synapes-auto-tool.onrender.com"
  );
}

function openWebAppUrl() {
  var html = HtmlService.createHtmlOutput(
    '<script>window.open("https://synapes-auto-tool.onrender.com", "_blank");google.script.host.close();</script>'
  ).setWidth(120).setHeight(50);
  SpreadsheetApp.getUi().showModalDialog(html, "Đang mở WebApp Studio...");
}
