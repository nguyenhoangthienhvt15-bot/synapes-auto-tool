const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
} = require('docx');

const TARGET_DIR = 'C:\\Users\\84364\\Documents\\DỰ ÁN WEB APP AUTO TOOL\\Phiên họp thứ chín';
const DOCS_DIR = path.resolve(__dirname, '../../docs_typst');

async function generateDocxV9() {
  const border = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  const makeCell = (text, bold = false, fill = undefined) =>
    new TableCell({
      borders: border,
      shading: fill ? { fill } : undefined,
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold, size: 21, font: 'Arial' })],
        }),
      ],
    });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'BÁO CÁO KIỂM TOÁN TOÀN DIỆN VÀ NGHIỆM THU HỆ THỐNG SYNAPES STUDIO — PHIÊN HỌP THỨ CHÍN (SESSION IX)',
                bold: true,
                size: 30,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Chủ trì: Kỹ sư trưởng Nguyễn Hoàng Thiện (CCCD: 072206002509 • Gò Vấp, TP.HCM • Email: nguyenhoangthien.hvt.15@gmail.com)',
                bold: true,
                size: 22,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Tài khoản: SNP_2611092202 | Pass: SNP_378UPH | Master IP Unlock: 07022006 | Dự án: Hoạt hình 3D Côn Trùng Nhảy Múa Hát Đếm Số (1–10)',
                size: 20,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '1. MA TRẬN KHẮC PHỤC TRIỆT ĐỂ 7 LỖI GỐC TỪ PHIÊN 1 ĐẾN PHIÊN 8',
                bold: true,
                size: 25,
                font: 'Arial',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Mã RC', true, 'E2E8F0'),
                  makeCell('Vấn đề từ Phiên 1–8', true, 'E2E8F0'),
                  makeCell('Nguyên nhân Gốc rễ', true, 'E2E8F0'),
                  makeCell('Giải pháp Khắc phục tại Phiên 9', true, 'E2E8F0'),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('RC-01', true),
                  makeCell('Hoạt hình 3D bị gắn nhãn Bản tin Thời sự 24h và lấy ảnh tin tức.'),
                  makeCell('Thiếu miền animation-3d và thể loại 3d-animation trong bộ phân loại.'),
                  makeCell('Bổ sung animation-3d và 3d-animation trên cả Client & Server, tắt băng chữ thời sự cho hoạt hình 3D.'),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('RC-02', true),
                  makeCell('Nhân vật biến dạng giữa các cảnh và sai số lượng đếm từ 1 đến 10.'),
                  makeCell('Sử dụng ảnh tĩnh AI độc lập cho từng cảnh gây lệch số lượng.'),
                  makeCell('Tách phông nền Sân khấu 3D Pixar sạch và kết xuất chính xác N = 1..10 nhân vật 3D có gắn số thứ tự 1..N.'),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('RC-03', true),
                  makeCell('Nhân vật chỉ lắc khung ảnh tĩnh và còn dính thanh HUD đen trên đầu.'),
                  makeCell('Dùng bg.crop() trên ảnh phẳng và vẽ hộp đen HUD ở mép trên.'),
                  makeCell('Xây dựng Skeletal 3D Phong/Subsurface Shaded Insect Rigging 9 khớp (vỗ cánh 22Hz, tay chân 2 khớp, nhép miệng Lip-Sync) và xóa thanh HUD đen.'),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('RC-04', true),
                  makeCell('Cổng /api/video-deconstruct bỏ qua phản hồi Gemini LLM.'),
                  makeCell('Đọc nhầm resp.data thay vì JSON.parse(resp.text) ở dòng 2376.'),
                  makeCell('Sửa thành JSON.parse(resp.text) kết hợp Cascade 3 mô hình Gemini.'),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('RC-05', true),
                  makeCell('Lỗ hổng vượt rào khóa IP qua ?bypass_anti_tamper=1 và Reflected XSS.'),
                  makeCell('Ngoại lệ URL chưa xác thực và nội suy trực tiếp clientIp vào HTML.'),
                  makeCell('Bắt buộc mở khóa qua /api/security/unlock (07022006) và lọc escapeHtml(clientIp).'),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('RC-06', true),
                  makeCell('Không tua được thanh thời gian video .mp4 trên trình duyệt.'),
                  makeCell('server.js thiếu xử lý HTTP 206 Partial Content (Range: bytes=...).'),
                  makeCell('Bổ sung đầy đủ HTTP 206 Partial Content và Accept-Ranges: bytes.'),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('RC-07', true),
                  makeCell('So sánh mật khẩu đăng nhập SNP_2611092202 bằng toán tử ===.'),
                  makeCell('Chưa đồng bộ hàm constantTimeVerify tại verifyUserCredentialsServerSide.'),
                  makeCell('Nâng cấp lên constantTimeVerify (crypto.timingSafeEqual).'),
                ],
              }),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: '2. KẾT QUẢ THỰC NGHIỆM DỰ ÁN HOẠT HÌNH 3D CÔN TRÙNG NHẢY MÚA HÁT ĐẾM SỐ (1 ĐẾN 10)',
                bold: true,
                size: 25,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Hệ thống đã kết xuất thành công 2 tệp video chuẩn Full HD 1920x1080 @ 30fps (H.264 CRF 17 + AAC 192kbps Stereo) tại thư mục Phiên họp thứ chín: (1) VIDEO_HOAT_HINH_3D_CON_TRUNG_NHAY_MUA_HAT_DEM_SO_1_DEN_10.mp4 (bản đầy đủ 36.0 giây đi qua 10 cảnh đếm số từ 1 đến 10) và (2) VIDEO_CON_TRUNG_3D_DEM_SO_20S.mp4 (bản rút gọn 20.0 giây). Mỗi nhân vật côn trùng 3D đều có khối cầu/ellipsoid tô bóng Phong + Subsurface Scattering, vỗ cánh 22Hz, bật nhảy Squash & Stretch 130 BPM, vẫy tay 2 khớp, chớp mắt và nhép miệng Lip-Sync theo giọng hát tiếng Việt.',
                size: 22,
                font: 'Arial',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath1 = path.join(
    TARGET_DIR,
    'BAO_CAO_KIEM_TOAN_TOAN_DIEN_VA_NGHIEM_THU_HE_THONG_PHIEN_IX.docx'
  );
  const outPath2 = path.join(
    DOCS_DIR,
    'BAO_CAO_KIEM_TOAN_TOAN_DIEN_VA_NGHIEM_THU_HE_THONG_PHIEN_IX.docx'
  );
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(outPath1, buffer);
  fs.writeFileSync(outPath2, buffer);
  console.log('[DOCX V9 GENERATED]:', outPath1);
}

generateDocxV9().catch((err) => {
  console.error(err);
  process.exit(1);
});
