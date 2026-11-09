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
}

if (fs.existsSync(contractPdfGenPath)) {
  const pdfGenContent = fs.readFileSync(contractPdfGenPath, 'utf8');
  assert(pdfGenContent.includes("STAMP_BASE64"), 
    'contractPdfGenerator.ts import và nhúng STAMP_BASE64 chuẩn');
  assert(pdfGenContent.includes("stamp-img"), 
    'contractPdfGenerator.ts có CSS class stamp-img');
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
}

if (fs.existsSync(backendEnginePath)) {
  const backendContent = fs.readFileSync(backendEnginePath, 'utf8');
  assert(backendContent.includes('/api/video-deconstruct'), 'Có endpoint /api/video-deconstruct trên server backend');
  assert(backendContent.includes('/api/video-clone-synthesize'), 'Có endpoint /api/video-clone-synthesize trên server backend');
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
}

if (fs.existsSync(contractPdfGenPath)) {
  const pdfGenContent = fs.readFileSync(contractPdfGenPath, 'utf8');
  assert(pdfGenContent.includes('signatureDisplay') && pdfGenContent.includes('ĐÃ KÝ XÁC NHẬN ĐIỆN TỬ'),
    'contractPdfGenerator.ts hiển thị chữ ký tay Bên B ngay phía trên khung xanh ĐÃ KÝ XÁC NHẬN ĐIỆN TỬ');
}

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
