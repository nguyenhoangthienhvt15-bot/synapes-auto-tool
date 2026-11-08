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
