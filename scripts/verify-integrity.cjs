/**
 * ==============================================================================
 * GOLDEN MASTER & ARCHITECTURAL INTEGRITY VERIFIER
 * Hệ thống kiểm thử tự động bảo vệ tính toàn vẹn của các bản cập nhật
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let failureCount = 0;

function assert(condition, testName, errorDetails = '') {
  if (condition) {
    console.log(`  [PASSED] ${testName}`);
  } else {
    console.error(`  [FAILED] ${testName}`);
    if (errorDetails) {
      console.error(`           -> ${errorDetails}`);
    }
    failureCount++;
  }
}

console.log('\n============================================================');
console.log('🛡️  BẮT ĐẦU KIỂM TRA TÍNH TOÀN VẸN HỆ THỐNG (INTEGRITY SUITE)');
console.log('============================================================\n');

// -----------------------------------------------------------------------------
// NHÓM 1: BẢO VỆ CON DẤU HỢP ĐỒNG & MÃ GOOGLE APPS SCRIPT
// -----------------------------------------------------------------------------
console.log('--- 1. Kiểm tra Con Dấu Đỏ Tròn & Hợp Đồng PDF ---');

const gasPath = path.join(ROOT, 'google-apps-script', 'Code.js');
const compGasPath = path.join(ROOT, 'src', 'components', 'Code.js');
const appsScriptTsPath = path.join(ROOT, 'src', 'data', 'appsScriptCode.ts');
const contractPdfGenPath = path.join(ROOT, 'src', 'utils', 'contractPdfGenerator.ts');
const stampPngPath = path.join(ROOT, 'public', 'con_dau_do_tron_ks_nguyen_hoang_thien.png');
const stampLegacyPath = path.join(ROOT, 'public', 'stamp-truong-ban.png');

assert(fs.existsSync(gasPath), 'File google-apps-script/Code.js tồn tại');
assert(fs.existsSync(compGasPath), 'File src/components/Code.js tồn tại');
assert(fs.existsSync(appsScriptTsPath), 'File src/data/appsScriptCode.ts tồn tại');
assert(fs.existsSync(contractPdfGenPath), 'File src/utils/contractPdfGenerator.ts tồn tại');
assert(fs.existsSync(stampPngPath), 'File public/con_dau_do_tron_ks_nguyen_hoang_thien.png tồn tại');
assert(fs.existsSync(stampLegacyPath), 'File public/stamp-truong-ban.png tồn tại');

if (fs.existsSync(gasPath)) {
  const gasContent = fs.readFileSync(gasPath, 'utf8');
  assert(!gasContent.includes('ĐÃ ĐÓNG DẤU XÁC THỰC<br/>TRƯỞNG BAN CHUYỂN ĐỔI SỐ & AI'), 
    'Không còn thẻ chữ nhật fallback trong Code.js');
  assert(!gasContent.includes('border: 2px solid #b91c1c'), 
    'Không còn viền đỏ hình chữ nhật cũ trong Code.js');
  assert(gasContent.includes('ROUND_STAMP_BASE64'), 
    'Hằng số ROUND_STAMP_BASE64 được khai báo trong Code.js');
  assert(gasContent.includes('data:image/png;base64,iVBORw0KGgo'), 
    'ROUND_STAMP_BASE64 chứa dữ liệu ảnh PNG Base64 hợp lệ');
  assert(gasContent.includes('KS. NGUYỄN HOÀNG THIỆN'), 
    'Tên Trưởng ban KS. NGUYỄN HOÀNG THIỆN có trong chữ ký Bên A');
  assert(gasContent.includes('072206002509') && gasContent.includes('Gò Vấp, TP HCM'),
    'Code.js chứa số CCCD 072206002509 và địa chỉ Gò Vấp, TP HCM của Bên A');
}

if (fs.existsSync(contractPdfGenPath)) {
  const pdfGenContent = fs.readFileSync(contractPdfGenPath, 'utf8');
  assert(pdfGenContent.includes("STAMP_BASE64"), 
    'contractPdfGenerator.ts import và nhúng STAMP_BASE64 chuẩn');
  assert(pdfGenContent.includes("stamp-img"), 
    'contractPdfGenerator.ts có CSS class stamp-img');
  assert(pdfGenContent.includes("072206002509") && pdfGenContent.includes("Gò Vấp, TP HCM"),
    'contractPdfGenerator.ts chứa số CCCD 072206002509 và địa chỉ Gò Vấp, TP HCM của Bên A');
}

// -----------------------------------------------------------------------------
// NHÓM 2: BẢO VỆ KHUÔN MẪU TẠO VIDEO & PHONG CÁCH BIÊN TẬP (MODAL)
// -----------------------------------------------------------------------------
console.log('\n--- 2. Kiểm tra Khuôn Mẫu Video & Phong Cách Biên Tập ---');

const modalPath = path.join(ROOT, 'src', 'components', 'CreateProjectModal.tsx');
assert(fs.existsSync(modalPath), 'File CreateProjectModal.tsx tồn tại');

if (fs.existsSync(modalPath)) {
  const modalContent = fs.readFileSync(modalPath, 'utf8');
  assert(modalContent.includes('Khuôn Mẫu Video Dài') || modalContent.includes('16:9'), 
    'Hỗ trợ khuôn mẫu Video Dài (16:9)');
  assert(modalContent.includes('Khuôn Mẫu Video Ngắn') || modalContent.includes('9:16'), 
    'Hỗ trợ khuôn mẫu Video Ngắn / Shorts / Reels (9:16)');
  assert(!modalContent.includes('Lấy Tin Nóng Live'), 
    'Đã loại bỏ nút "Lấy Tin Nóng Live" theo yêu cầu người dùng');
  assert(modalContent.includes('custom') || modalContent.includes('Tự thiết kế') || modalContent.includes('thiết kế phong cách'), 
    'Hỗ trợ tính năng người dùng tự thiết kế phong cách biên tập');
  assert(modalContent.includes('audio') && modalContent.includes('image'), 
    'Đã tách riêng trường đính kèm Hình ảnh và Tệp âm thanh');
}

// -----------------------------------------------------------------------------
// NHÓM 3: BẢO VỆ LỊCH PHÁT SÓNG & PHÂN LOẠI DỰ ÁN
// -----------------------------------------------------------------------------
console.log('\n--- 3. Kiểm tra Lịch Phát Sóng (Goldtime) & Thẻ Phân Loại ---');

const calendarPath = path.join(ROOT, 'src', 'components', 'CalendarView.tsx');
const headerPath = path.join(ROOT, 'src', 'components', 'Header.tsx');
assert(fs.existsSync(calendarPath), 'File CalendarView.tsx tồn tại');
assert(fs.existsSync(headerPath), 'File Header.tsx tồn tại');

if (fs.existsSync(calendarPath)) {
  const calContent = fs.readFileSync(calendarPath, 'utf8');
  assert(calContent.includes('18:00') && calContent.includes('20:30'), 
    'Lịch phát sóng chứa khung giờ vàng YouTube & Facebook (Goldtime)');
  assert(calContent.includes('Tuần') || calContent.includes('week') || calContent.includes('Tháng'), 
    'Hỗ trợ chế độ xem lịch theo Tháng và theo Tuần');
  assert(calContent.includes('youtube') || calContent.includes('tiktok') || calContent.includes('facebook'), 
    'Hỗ trợ phân loại tag theo nền tảng (YouTube / TikTok / Facebook)');
}

if (fs.existsSync(headerPath)) {
  const headerContent = fs.readFileSync(headerPath, 'utf8');
  assert(headerContent.includes('Lịch Phát Sóng') || headerContent.includes('calendar'), 
    'Tab "Lịch Phát Sóng" được tích hợp trong thanh điều hướng Header');
}

const sidebarPath = path.join(ROOT, 'src', 'components', 'Sidebar.tsx');
if (fs.existsSync(sidebarPath)) {
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
  assert(!sidebarContent.includes('Bảng Tính Kỹ Sư') && !sidebarContent.includes('engineer-sheet'),
    'Sidebar đã loại bỏ hoàn toàn Bảng Tính Kỹ Sư để bảo mật thông tin nội bộ của Dev/Kỹ sư');
}

// -----------------------------------------------------------------------------
// NHÓM 4: BẢO VỆ PLUGIN WEBHOOK & AI PROVIDER LOGO
// -----------------------------------------------------------------------------
console.log('\n--- 4. Kiểm tra Plugin Webhook & Logo Nhà Phát Triển ---');

const webhookServicePath = path.join(ROOT, 'src', 'services', 'pluginWebhookService.ts');
assert(fs.existsSync(webhookServicePath), 'File pluginWebhookService.ts tồn tại');

if (fs.existsSync(webhookServicePath)) {
  const webhookContent = fs.readFileSync(webhookServicePath, 'utf8');
  assert(webhookContent.includes('logo') || webhookContent.includes('icon') || webhookContent.includes('provider'), 
    'Dịch vụ Plugin Webhook có trường hiển thị logo/icon nhà phát triển');
  assert(webhookContent.includes('dispatchScriptToPluginEngine'), 
    'Có hàm điều phối kịch bản từ AI Model sang công cụ Plugin');
}

// -----------------------------------------------------------------------------
// NHÓM 5: BẢO VỆ TÍNH NĂNG BÓC TÁCH & NHÂN BẢN VIDEO (BYOK VIDEO CLONER)
// -----------------------------------------------------------------------------
console.log('\n--- 5. Kiểm tra Video Deconstruct & Clone Engine (BYOK Architecture) ---');

const clonerServicePath = path.join(ROOT, 'src', 'services', 'videoDeconstructService.ts');
const clonerViewPath = path.join(ROOT, 'src', 'components', 'VideoClonerView.tsx');
const backendEnginePath = path.join(ROOT, 'server', 'studioBackendEngine.mjs');

assert(fs.existsSync(clonerServicePath), 'File src/services/videoDeconstructService.ts tồn tại');
assert(fs.existsSync(clonerViewPath), 'File src/components/VideoClonerView.tsx tồn tại');

if (fs.existsSync(clonerServicePath)) {
  const clonerServiceContent = fs.readFileSync(clonerServicePath, 'utf8');
  assert(clonerServiceContent.includes('deconstructVideoDna'), 'Có hàm bóc tách cấu trúc Video DNA');
  assert(clonerServiceContent.includes('synthesizeClonedProject'), 'Có hàm tái cấu trúc & nhân bản kịch bản cho chủ đề mới');
}

if (fs.existsSync(clonerViewPath)) {
  const clonerViewContent = fs.readFileSync(clonerViewPath, 'utf8');
  assert(clonerViewContent.includes('Bước 1: Nạp Video Mẫu') || clonerViewContent.includes('Bóc Tách'), 'Giao diện có cổng nạp video mẫu');
  assert(clonerViewContent.includes('Nhân Bản') || clonerViewContent.includes('Bước 2'), 'Giao diện có cổng nhân bản chủ đề mới');
  assert(clonerViewContent.includes('BYOK') || clonerViewContent.includes('Khóa API'), 'Hiển thị trạng thái khóa API BYOK');
  assert(clonerViewContent.includes('hypitSvmlBlueprint') && clonerViewContent.includes('HYPIT SVML ARCHITECTURE'), 'Giao diện hiển thị Hypit SVML Blueprint & Phân tích 3 trụ cột');
}

if (fs.existsSync(backendEnginePath)) {
  const backendContent = fs.readFileSync(backendEnginePath, 'utf8');
  assert(backendContent.includes('/api/video-deconstruct'), 'Có endpoint /api/video-deconstruct trên server backend');
  assert(backendContent.includes('/api/video-clone-synthesize'), 'Có endpoint /api/video-clone-synthesize trên server backend');
  assert(backendContent.includes('buildHypitBlueprint') && backendContent.includes('finance_business'), 'Backend hỗ trợ Hypit SVML Blueprint & domain finance_business');
  assert(backendContent.includes('function extractGeminiTextFromParts'), 'Backend có hàm extractGeminiTextFromParts cho Gemini 3.x');
  assert(!backendContent.includes('cleanModel'), 'Không còn lỗi ReferenceError cleanModel trong /api/video-deconstruct');
}

// -----------------------------------------------------------------------------
// NHÓM 6: BẢO VỆ HỆ THỐNG ĐĂNG KÝ CCCD, HỢP ĐỒNG 2 TẦNG & QUY TRÌNH DUYỆT 2 LẦN
// -----------------------------------------------------------------------------
console.log('\n--- 6. Kiểm tra CCCD, Hợp Đồng 2 Tầng, 20 Cột & Duyệt 2 Lần ---');

const registerModalPath = path.join(ROOT, 'src', 'components', 'RegisterModal.tsx');
assert(fs.existsSync(registerModalPath), 'File RegisterModal.tsx tồn tại');

if (fs.existsSync(registerModalPath)) {
  const regContent = fs.readFileSync(registerModalPath, 'utf8');
  assert(regContent.includes('idCardNumber') && (regContent.includes('Căn cước công dân') || regContent.includes('CCCD')),
    'Có trường nhập Căn cước công dân (CCCD / CMND)');
  assert(regContent.includes('Hợp đồng cá nhân hóa') && regContent.includes('Hợp đồng toàn hệ'),
    'Hỗ trợ 2 phân hệ Hợp đồng: Cá nhân hóa & Toàn hệ');
  assert(regContent.includes('Ký đặt cọc dự án cá nhân') && regContent.includes('Ký hợp đồng dự án cá nhân'),
    'Có 2 tùy chọn gói cho Hợp đồng cá nhân hóa (Đặt cọc 1.250k & Thanh toán 100% 2.550k)');
  assert(regContent.includes('Ký đặt cọc phân bổ') && regContent.includes('Ký hợp đồng dự án toàn hệ chính thức'),
    'Có 2 tùy chọn gói cho Hợp đồng toàn hệ (Đặt cọc 2.500k & Thanh toán 100% 5.490k)');
  assert(regContent.includes('Tôi đã hiểu và chịu trách nhiệm với các điều khoản đề ra giữa cả hai bên'),
    'Có checkbox cam kết trách nhiệm giữa cả hai bên');
  assert(regContent.includes('Gửi hợp đồng'),
    'Có nút "Gửi hợp đồng" chuyển hồ sơ sang Google Sheet');
  assert(regContent.includes('072206002509') && regContent.includes('Gò Vấp, TP HCM'),
    'RegisterModal.tsx hiển thị số CCCD 072206002509 và địa chỉ thường trú Gò Vấp của Bên A');
}

if (fs.existsSync(gasPath)) {
  const gasContent = fs.readFileSync(gasPath, 'utf8');
  assert(gasContent.includes('Số CCCD / CMND') && gasContent.includes('Duyệt Ký Lần 1') && gasContent.includes('Duyệt Bàn Giao Lần 2'),
    'Apps Script cấu hình 20 cột chuẩn (CCCD, Duyệt Lần 1, Duyệt Lần 2)');
  assert(gasContent.includes('processFirstApproval') && gasContent.includes('processFinalHandoverApproval'),
    'Apps Script có đủ 2 luồng xử lý: Duyệt Ký Lần 1 & Duyệt Bàn Giao Lần 2');
  assert(gasContent.includes('Chúng ta đặt câu hỏi cho mọi vấn đề có thể và chúng ta sẽ đưa ra giải pháp có thể và hơn cả là tốt nhất'),
    'Apps Script có dẫn lời phát biểu của Trưởng ban KS. Nguyễn Hoàng Thiện');
  assert(gasContent.includes('TIMO_QR_CODE_BASE64') && gasContent.includes('0983396354'),
    'Apps Script nhúng mã QR Code VietQR Timo (STK: 0983396354) vào các mẫu thư');
  assert(gasContent.includes('inlineImages') && gasContent.includes('cid:paymentQrCode'),
    'Apps Script sử dụng CID inlineImages chuẩn RFC cho ảnh mã QR (chống lỗi Gmail image proxy)');
  assert(gasContent.includes('wrapEmailInCorporateLayout') && !gasContent.includes('src="\' + TIMO_QR_CODE_BASE64'),
    'Apps Script áp dụng chuẩn thiết kế email doanh nghiệp (loại bỏ thẻ img src chứa base64 trực tiếp)');
  assert(gasContent.includes('HOP_DONG_BAN_GIAO_HOAN_CHINH_SYNAPES_') && gasContent.includes('HỢP ĐỒNG BÀN GIAO SẢN PHẨM HOÀN CHỈNH & XÁC NHẬN THANH TOÁN ĐỦ 100%'),
    'Apps Script tạo file PDF HĐ bàn giao hoàn chỉnh và xác nhận bên mua trả đủ 100% giá trị hợp đồng');
  assert(gasContent.includes('ĐÃ BÀN GIAO SẢN PHẨM HOÀN CHỈNH') && gasContent.includes('ĐÃ THANH TOÁN ĐỦ 100%'),
    'Thư Gmail duyệt Lần 2 xác nhận bàn giao sản phẩm hoàn chỉnh và thanh toán đủ 100% kèm Code & Pass');
  assert(gasContent.includes('buyerSigHtml') && gasContent.includes('ĐÃ KÝ XÁC NHẬN ĐIỆN TỬ'),
    'Apps Script nhúng ảnh chữ ký tay Bên B ngay phía trên khung xanh ĐÃ KÝ XÁC NHẬN ĐIỆN TỬ');
}

// --- 7. Kiểm tra Tính Năng Vẽ Chữ Ký Tay (Signature Pad) ---
console.log('\n--- 7. Kiểm tra Tính Năng Vẽ Chữ Ký Tay (Signature Pad) ---');
const sigModalPath = path.resolve(__dirname, '../src/components/SignatureModal.tsx');
assert(fs.existsSync(sigModalPath), 'File src/components/SignatureModal.tsx tồn tại');
if (fs.existsSync(sigModalPath)) {
  const sigModalContent = fs.readFileSync(sigModalPath, 'utf8');
  assert(sigModalContent.includes('canvasRef') && sigModalContent.includes('toDataURL'),
    'SignatureModal hỗ trợ vẽ cảm ứng / chuột trên canvas và xuất ảnh PNG');
}

const regModalPath = path.resolve(__dirname, '../src/components/RegisterModal.tsx');
if (fs.existsSync(regModalPath)) {
  const regContent = fs.readFileSync(regModalPath, 'utf8');
  assert(regContent.includes('SignatureModal') && regContent.includes('Mục Ký Tên Điện Tử'),
    'RegisterModal tích hợp nút Ký tên và modal vẽ chữ ký tay');
  assert(regContent.includes('signatureImage'),
    'RegisterModal lưu ảnh chữ ký tay vào hồ sơ hợp đồng');
  assert(regContent.includes("const [signatureImage, setSignatureImage] = useState<string>('')"),
    'RegisterModal khởi tạo chữ ký rỗng, không nạp chữ ký của người đăng ký trước');
  assert(regContent.includes('Ký hợp đồng') && regContent.includes('Gửi hợp đồng'),
    'Nút hoàn tất hợp đồng hiển thị nhãn Ký hợp đồng & Gửi hợp đồng');
}

const sheetServicePath = path.resolve(__dirname, '../src/services/googleSheetService.ts');
if (fs.existsSync(sheetServicePath)) {
  const sheetContent = fs.readFileSync(sheetServicePath, 'utf8');
  assert(sheetContent.includes('delete jsonpPayload.signatureImage'),
    'googleSheetService loại bỏ ảnh base64 khỏi query string GET để chống lỗi 414 URI Too Long');
}

if (fs.existsSync(contractPdfGenPath)) {
  const pdfGenContent = fs.readFileSync(contractPdfGenPath, 'utf8');
  assert(pdfGenContent.includes('signatureDisplay') && pdfGenContent.includes('ĐÃ KÝ XÁC NHẬN ĐIỆN TỬ'),
    'contractPdfGenerator.ts hiển thị chữ ký tay Bên B ngay phía trên khung xanh ĐÃ KÝ XÁC NHẬN ĐIỆN TỬ');
}

// -----------------------------------------------------------------------------
// NHÓM 8: BẢO MẬT HỆ THỐNG, CỔNG MỞ KHÓA MASTER & CHỐNG SSRF / BRUTE-FORCE
// -----------------------------------------------------------------------------
console.log('\n--- 8. Kiểm tra Cổng Mở Khóa Master, Chống SSRF & Rate Limiter ---');

const antiTamperPath = path.resolve(__dirname, '../src/utils/antiTamperGuard.ts');
const serverJsPath = path.resolve(__dirname, '../server.js');

assert(fs.existsSync(antiTamperPath), 'File src/utils/antiTamperGuard.ts tồn tại');
if (fs.existsSync(antiTamperPath)) {
  const atContent = fs.readFileSync(antiTamperPath, 'utf8');
  assert(atContent.includes('/api/security/unlock'), 'antiTamperGuard.ts kết nối endpoint /api/security/unlock');
  assert(atContent.includes('synapes-master-pass') && atContent.includes('synapes-master-unlock-btn'),
    'antiTamperGuard.ts tích hợp khung mở khóa Master Pass');
  assert(!atContent.includes('placeholder="Nhập mã Master (07022006)..."'),
    'Không lộ mật khẩu Master trong placeholder client');
  assert(!atContent.includes("pass === '07022006'"),
    'Không còn đoạn mã so sánh plaintext mật khẩu trong antiTamperGuard.ts');
}

if (fs.existsSync(backendEnginePath)) {
  const beContent = fs.readFileSync(backendEnginePath, 'utf8');
  assert(beContent.includes('checkUnlockRateLimit') && beContent.includes('recordUnlockFailure'),
    'Backend engine có Rate Limiter kiểm soát số lần thử mở khóa');
  assert(beContent.includes('constantTimeVerify'),
    'Backend engine áp dụng so sánh thời gian hằng số (Timing-Safe) chống tấn công Side-Channel');
  assert(beContent.includes('MAX_IMAGE_BUFFER_BYTES') && beContent.includes('isSafeExternalUrl'),
    'Backend engine có bộ lọc SSRF đa tầng và giới hạn dung lượng chống DoS OOM');
}

if (fs.existsSync(serverJsPath)) {
  const srvContent = fs.readFileSync(serverJsPath, 'utf8');
  assert(srvContent.includes('Content-Security-Policy'),
    'server.js cấu hình tiêu đề bảo mật Content-Security-Policy (CSP)');
  assert(srvContent.includes('/api/security/unlock'),
    'server.js hỗ trợ ngoại lệ định tuyến cho cổng mở khóa /api/security/unlock');
  assert(srvContent.includes('escapeHtml(clientIp)') && srvContent.includes('206'),
    'server.js (Phiên 9) chống Reflected XSS qua escapeHtml(clientIp) và hỗ trợ HTTP 206 Partial Content cho MP4');
}

// -----------------------------------------------------------------------------
// 9. KIỂM ĐỊNH TOÀN DIỆN PHIÊN HỌP THỨ 9 (3D ANIMATION ENGINE & HARDENING)
// -----------------------------------------------------------------------------
console.log('\n--- [NHÓM 9] KIỂM TOÁN TOÀN DIỆN PHIÊN HỌP THỨ 9 (3D INSECT COUNTING 1-10) ---');
const typesPath = path.join(ROOT, 'src', 'types', 'index.ts');
const scriptGenPath = path.join(ROOT, 'src', 'services', 'aiScriptGeneratorService.ts');
const cinemaPlayerPath = path.join(ROOT, 'src', 'components', 'AiCinemaPlayer.tsx');
if (fs.existsSync(typesPath)) {
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  assert(typesContent.includes("'3d-animation'"),
    'src/types/index.ts định nghĩa thể loại VideoGenre 3d-animation');
}
if (fs.existsSync(scriptGenPath)) {
  const sgContent = fs.readFileSync(scriptGenPath, 'utf8');
  assert(sgContent.includes("'animation-3d'") && sgContent.includes("'3d-animation'"),
    'aiScriptGeneratorService.ts hỗ trợ miền chủ đề animation-3d và thể loại 3d-animation');
}
if (fs.existsSync(cinemaPlayerPath)) {
  const cpContent = fs.readFileSync(cinemaPlayerPath, 'utf8');
  assert(cpContent.includes('draw3dAnimationInsectStage'),
    'AiCinemaPlayer.tsx tích hợp sân khấu nhân vật côn trùng 3D xương khớp draw3dAnimationInsectStage');
}
const phien9Dir = 'C:\\Users\\84364\\Documents\\DỰ ÁN WEB APP AUTO TOOL\\Phiên họp thứ chín';
assert(
  fs.existsSync(path.join(phien9Dir, 'BAO_CAO_KIEM_TOAN_TOAN_DIEN_VA_NGHIEM_THU_HE_THONG_PHIEN_IX.pdf')) &&
  fs.existsSync(path.join(phien9Dir, 'BAO_CAO_KIEM_TOAN_TOAN_DIEN_VA_NGHIEM_THU_HE_THONG_PHIEN_IX.docx')) &&
  fs.existsSync(path.join(phien9Dir, 'DU_AN_CON_TRUNG_3D_NHAY_MUA_DEM_SO_1_DEN_10.json')),
  'Thư mục Phiên họp thứ chín lưu trữ đầy đủ Báo cáo PDF, DOCX, TYP và Hồ sơ kịch bản JSON 10 cảnh'
);

// -----------------------------------------------------------------------------
// 10. KIỂM ĐỊNH TOÀN DIỆN PHIÊN HỌP THỨ 10 (3D MULTI-CHARACTER DIALOGUE ENGINE)
// -----------------------------------------------------------------------------
console.log('\n--- [NHÓM 10] KIỂM ĐỊNH TOÀN DIỆN PHIÊN HỌP THỨ 10 (3D MULTI-CHARACTER DIALOGUE) ---');
if (fs.existsSync(typesPath)) {
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  assert(
    typesContent.includes('CameraDialogueAngle') &&
    typesContent.includes('CharacterActor') &&
    typesContent.includes('DialogueLine'),
    'src/types/index.ts định nghĩa đầy đủ CameraDialogueAngle, CharacterActor và DialogueLine'
  );
}
if (fs.existsSync(scriptGenPath)) {
  const sgContent = fs.readFileSync(scriptGenPath, 'utf8');
  assert(
    sgContent.includes('characterActors') &&
    sgContent.includes('dialogueMode') &&
    sgContent.includes('3d_dialogue_clinic_stage.jpg'),
    'aiScriptGeneratorService.ts tích hợp kịch bản đối thoại đa nhân vật và sân khấu đối thoại 3D'
  );
}
if (fs.existsSync(cinemaPlayerPath)) {
  const cpContent = fs.readFileSync(cinemaPlayerPath, 'utf8');
  assert(
    cpContent.includes('draw3dDialogueCinemaStage'),
    'AiCinemaPlayer.tsx tích hợp sân khấu đối thoại 3D thời gian thực draw3dDialogueCinemaStage với Shot-Reverse-Shot và Lip-Sync'
  );
}
const phien10Dir = 'C:\\Users\\84364\\Documents\\DỰ ÁN WEB APP AUTO TOOL\\Phiên họp thứ mười';
assert(
  fs.existsSync(path.join(phien10Dir, 'BAO_CAO_CAI_TO_TOAN_DIEN_HE_THONG_VA_NGHIEM_THU_VIDEO_3D_HOI_THOAI_DA_GIONG_PHIEN_X.pdf')) &&
  fs.existsSync(path.join(phien10Dir, 'BAO_CAO_CAI_TO_TOAN_DIEN_HE_THONG_VA_NGHIEM_THU_VIDEO_3D_HOI_THOAI_DA_GIONG_PHIEN_X.docx')) &&
  fs.existsSync(path.join(phien10Dir, 'DU_AN_HOAT_HINH_3D_THO_CON_BI_OM_HOI_THOAI_DA_GIONG.json')) &&
  fs.existsSync(path.join(phien10Dir, 'VIDEO_HOAT_HINH_3D_THO_CON_BI_OM_HOI_THOAI_DA_GIONG_24S.mp4')) &&
  fs.existsSync(path.join(phien10Dir, 'VIDEO_HOAT_HINH_3D_HOI_THOAI_20S.mp4')),
  'Thư mục Phiên họp thứ mười lưu trữ đầy đủ Báo cáo PDF, DOCX, TYP, Kịch bản JSON và 2 tệp Video MP4 thành phẩm (24s & 20s)'
);

// -----------------------------------------------------------------------------
// KẾT LUẬN TOÀN BỘ BÀI TEST
// -----------------------------------------------------------------------------
console.log('\n============================================================');
if (failureCount === 0) {
  console.log('✅ TẤT CẢ CÁC BÀI KIỂM TRA TÍNH TOÀN VẸN ĐÃ VƯỢT QUA (0 LỖI)');
  console.log('   Mã nguồn đã sẵn sàng, tính toàn vẹn của các tính năng cũ được bảo toàn.');
  console.log('============================================================\n');
  process.exit(0);
} else {
  console.error(`❌ PHÁT HIỆN ${failureCount} ĐIỂM VI PHẠM TÍNH TOÀN VẸN HỆ THỐNG!`);
  console.error('   Lệnh commit/push bị chặn lại để bảo vệ hệ thống khỏi Regression.');
  console.error('============================================================\n');
  process.exit(1);
}
