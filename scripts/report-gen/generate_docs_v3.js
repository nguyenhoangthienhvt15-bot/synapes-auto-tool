const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber
} = require('docx');

const borderThin = {
  top: { style: BorderStyle.SINGLE, size: 4, color: 'D4D4D8' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D4D4D8' },
  left: { style: BorderStyle.SINGLE, size: 4, color: 'D4D4D8' },
  right: { style: BorderStyle.SINGLE, size: 4, color: 'D4D4D8' },
};

function createCallout(title, content, colorHex, bgHex) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      left: { style: BorderStyle.SINGLE, size: 24, color: colorHex },
      top: { style: BorderStyle.SINGLE, size: 4, color: 'E4E4E7' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E4E4E7' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'E4E4E7' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: bgHex, type: ShadingType.CLEAR },
            margins: { top: 180, bottom: 180, left: 240, right: 240 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: title, bold: true, color: colorHex, size: 21 }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: content, color: '27272A', size: 19 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createCodeBlock(codeText) {
  const lines = codeText.split('\n');
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderThin,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F4F4F5', type: ShadingType.CLEAR },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            children: lines.map(line => new Paragraph({
              children: [
                new TextRun({ text: line, font: 'Consolas', size: 17, color: '18181B' })
              ],
              spacing: { after: 20, line: 240 }
            }))
          })
        ]
      })
    ]
  });
}

function p(text, options = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: 'Segoe UI',
        size: options.size || 20,
        bold: options.bold || false,
        italics: options.italic || false,
        color: options.color || '18181B',
      })
    ],
    alignment: options.alignment || AlignmentType.LEFT,
    spacing: { after: options.after || 120, before: options.before || 0, line: 300 }
  });
}

function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: '4F46E5' }
    }
  });
}

function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
  });
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Segoe UI', size: 20, color: '18181B' },
        paragraph: { spacing: { line: 300, after: 120 } }
      }
    },
    heading1: {
      run: { font: 'Segoe UI', size: 28, bold: true, color: '1E1B4B' },
      paragraph: { spacing: { before: 360, after: 180 } }
    },
    heading2: {
      run: { font: 'Segoe UI', size: 23, bold: true, color: '312E81' },
      paragraph: { spacing: { before: 240, after: 120 } }
    }
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "SYNAPES STUDIO — BÁO CÁO ĐÁNH GIÁ NGHIỆM THU & BẢN VẼ CẤU TRÚC (PHIÊN III)", size: 16, color: "71717A" }),
                new TextRun({ text: "\t\tNGHIỆM THU THỰC TẾ", size: 16, color: "A1A1AA" }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Đồng hành Kỹ thuật: nguyenhoangthien.hvt.15@gmail.com", size: 16, color: "A1A1AA" }),
                new TextRun({ text: "\t\tTrang ", size: 16, color: "71717A" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, bold: true, color: "4F46E5" }),
              ],
            }),
          ],
        }),
      },
      children: [
        // BÌA
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 720, after: 200 },
          children: [
            new TextRun({ text: "HỘI ĐỒNG THẨM ĐỊNH & NGHIỆM THU KỸ THUẬT ĐỘC LẬP", size: 22, bold: true, color: "4F46E5" }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 },
          children: [
            new TextRun({ text: "BÁO CÁO ĐÁNH GIÁ MỨC ĐỘ HOÀN THÀNH CỦA ĐỘI NGŨ KỸ SƯ DỰA TRÊN 2 PHIÊN HỌP & BẢN VẼ CẤU TRÚC TRIỂN KHAI CHI TIẾT", size: 32, bold: true, color: "09090B" }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 720 },
          children: [
            new TextRun({ text: "Khảo sát thực nghiệm URL: https://synapes-auto-tool-web-service.onrender.com/ | Tinh thần: Công minh — Thẳng thắn", size: 20, italics: true, color: "52525B" }),
          ]
        }),

        // HỘP THÔNG TIN DỰ ÁN
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: borderThin,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: 'F4F4F5', type: ShadingType.CLEAR },
                  margins: { top: 200, bottom: 200, left: 240, right: 240 },
                  children: [
                    p("Chủ trì Dự án: KS. Nguyễn Hoàng Thiện", { bold: true }),
                    p("Email Tiếp nhận Báo cáo: nguyenhoangthien.hvt.15@gmail.com", { bold: true }),
                    p("Hình thức Thẩm định: Network & Bundle Inspection trên Live Production", { bold: true }),
                    p("Kết quả Nghiệm thu Tổng thể: 50.5 / 100 Điểm (Đạt mức Chuyển giao một phần)", { bold: true }),
                    p("Thời gian Hoàn tất: 10 Tháng 11, 2026 (Phiên họp thứ III)", { bold: true }),
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 360 } }),

        // PHẦN 1
        h1("PHẦN 1: BẢNG TỔNG HỢP ĐIỂM NGHIỆM THU THEO TỪNG HẠNG MỤC"),
        p("Theo yêu cầu của Chủ trì dự án (KS. Nguyễn Hoàng Thiện), Hội đồng kỹ sư đã kiểm toán trực tiếp bản build mới nhất vừa được đưa lên máy chủ Render:"),
        p("1. Bảo mật Anti-DevTools & Khóa IP (Trọng số 15%): ĐẠT 13.5 / 15 (90%) — Đội ngũ đã viết hàm mr() chặn F12, chuột phải, debugger và dựng endpoint khóa IP 24h hoạt động thật."),
        p("2. Xuất Dự Án CapCut Draft JSON (Trọng số 15%): ĐẠT 11.0 / 15 (73%) — Đã viết hàm g(e) và _(e) sinh draft_content.json chuẩn micro-giây của CapCut PC."),
        p("3. Nâng cấp Kịch bản & Cinematic Skills (Trọng số 10%): ĐẠT 8.0 / 10 (80%) — Bổ sung các kỹ năng Apple Keynote 3D, Haptic Sound Design, Netflix Subtitles rất xuất sắc."),
        p("4. Xóa bỏ Fake Activity trong Video Gen (Trọng số 25%): ĐẠT 7.5 / 25 (30%) — CHƯA ĐẠT. Vẫn còn mảng clip stock mixkit.co và setTimeout tăng % ảo."),
        p("5. Ghép Nối Video Bằng Worker Thật (Trọng số 15%): ĐẠT 5.0 / 15 (33%) — CHƯA ĐẠT. Nút ghép video trên web vẫn chạy 4 hàm setTimeout trong 3.8 giây."),
        p("6. Đóng Google Sheet & CSDL Tập trung (Trọng số 10%): ĐẠT 1.5 / 10 (15%) — NGUY HIỂM. Link Google Sheet CSV vẫn mở công khai, làm lộ CCCD, ngày sinh và mật khẩu."),
        p("7. Tự phục hồi & Báo lỗi về Gmail Dev (Trọng số 10%): ĐẠT 4.0 / 10 (40%) — Đã gắn email vào thông báo lỗi bảo mật, chưa có Worker Watchdog tự gửi email cứu hộ."),
        
        p("TỔNG ĐIỂM TOÀN DIỆN: 50.5 / 100 ĐIỂM (Mức Trung bình — Đạt bước chuyển giao nền tảng, cần bứt phá ở phần lõi backend).", { bold: true }),

        // PHẦN 2
        h1("PHẦN 2: PHÂN TÍCH CHI TIẾT THỰC TRẠNG: ĐIỂM SÁNG & ĐIỂM TỒN ĐỌNG"),
        h2("2.1. Điểm sáng đáng biểu dương (Đội ngũ đã làm thật sự)"),
        createCallout(
          "ĐIỂM SÁNG 1: BẪY BẢO MẬT ANTI-DEVTOOLS VÀ KHÓA IP ĐÃ CHẠY THẬT",
          "Đội ngũ kỹ sư đã tiếp thu rất nhanh bản thiết kế của Phiên 2: Đưa hàm mr() vào bundle, chặn F12, chuột phải, kiểm tra outerWidth. Khi chúng tôi gửi test vi phạm, máy chủ Render đã trả về { success: true, banned: true, clientIp: '113.161.54.225', duration: '24h' } và chặn đứng mọi request tiếp theo bằng mã HTTP 403 Forbidden kèm tên và Gmail của KS. Nguyễn Hoàng Thiện!",
          "16A34A",
          "ECFDF5"
        ),

        new Paragraph({ spacing: { before: 100 } }),

        createCallout(
          "ĐIỂM SÁNG 2: TÍNH NĂNG XUẤT DỰ ÁN CAPCUT DRAFT ĐÃ HOÀN THÀNH",
          "Trong file MultiClipStitcherStudio, hàm g(e) và _(e) đã tự động trích xuất timeline thành file draft_content_SYNAPES.json có cấu trúc tracks video, audio, text chuẩn CapCut PC, kèm nút tải phụ đề .SRT và kịch bản .JSON rất tiện lợi cho người dùng.",
          "16A34A",
          "ECFDF5"
        ),

        h2("2.2. Điểm tồn đọng cần phê bình thẳng thắn (Chưa giải quyết tận gốc)"),
        createCallout(
          "TỒN ĐỌNG 1: MẢNG VIDEO MIXKIT STOCK VÀ TIMER ẢO VẪN CÒN TRONG BUNDLE",
          "Trong CreateProjectModal, mảng ue chứa các URL mixkit-futuristic-city, mixkit-close-up-of-motherboard vẫn còn nguyên. Vì video AI luôn cần 45-120s mới render xong, nên khi Webhook chưa kịp phản hồi, code lại fallback về bốc ngẫu nhiên clip Mixkit. Người dùng vẫn đang nhận video giả mạo!",
          "DC2626",
          "FEF2F2"
        ),

        new Paragraph({ spacing: { before: 100 } }),

        createCallout(
          "TỒN ĐỌNG 2: GOOGLE SHEET VẪN ĐANG MỞ CÔNG KHAI!",
          "Tại thời điểm 15:11 ngày 10/11/2026, đường dẫn Google Sheet CSV vẫn trả về HTTP 200 OK và phơi bày toàn bộ dữ liệu CCCD, ngày sinh, số điện thoại, mật khẩu của khách hàng. Đây là lỗ hổng an ninh cấp bách nhất cần xử lý ngay lập tức!",
          "DC2626",
          "FEF2F2"
        ),

        // PHẦN 3
        h1("PHẦN 3: LƯU ĐỒ CẤU TRÚC TRIỂN KHAI VÀ THUẬT TOÁN ĐÍCH THỰC"),
        p("Bản vẽ kiến trúc chuẩn Enterprise mà đội ngũ kỹ sư bắt buộc phải hoàn thiện:"),
        createCodeBlock(
`+-----------------------------------------------------------------------------------+
|                             NGƯỜI DÙNG / TRÌNH DUYỆT                              |
|  - React + Vite SPA (Storyboarding UI, Prompt Director, Live Preview, BYOK)       |
|  - Anti-DevTools Guard (Chặn F12, Chặn Chuột phải, Bẫy Debugger) [ĐÃ CÓ]          |
+-----------------------------------------+-----------------------------------------+
                                          | HTTPS / WSS (WebSocket)
                                          v
+-----------------------------------------------------------------------------------+
|                     REVERSE PROXY & GATEWAY (NGINX / TRAEFIK)                     |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                       CORE BACKEND SERVICE (FASTAPI / NODEJS)                     |
|  +------------------------+  +--------------------------+  +-------------------+  |
|  |  BYOK Key Vault        |  |  Agentic Conductor       |  |  Security Manager |  |
|  |  (AES-256-GCM Encrypt) |  |  (MCP Server & Planner)  |  |  (Auto-Ban & Log) |  |
|  +------------------------+  +--------------------------+  +-------------------+  |
+--------------------+--------------------+--------------------+--------------------+
                     |                    |                    |
                     v                    v                    v
           +-------------------+  +---------------+  +-------------------+
           | REDIS (JOB QUEUE) |  | POSTGRESQL DB |  | MINIO (S3 STORAGE)|
           +---------+---------+  +---------------+  +-------------------+
                     |
                     v
+-----------------------------------------------------------------------------------+
|                      DISTRIBUTED ASYNC WORKERS (CELERY / BULLMQ)                  |
|  1. VIDEO WORKER: Polling tiến độ thật từ Kling/Runway (45s-120s), xóa Mixkit     |
|  2. CHAINING FRAME: Lấy Last Frame Scene N làm Start Frame Scene N+1 (Móc xích)   |
|  3. HEADLESS FFMPEG: Concat demuxer thật 100%, áp 3D LUT điện ảnh, mix audio      |
+-----------------------------------------------------------------------------------+`
        ),

        // PHẦN 4
        h1("PHẦN 4: LỘ TRÌNH 3 BƯỚC HÀNH ĐỘNG ĐỂ ĐẠT 100 ĐIỂM NGHIỆM THU"),
        p("1. Bước 1 (Trong 24h tới): Khóa ngay quyền chia sẻ của Google Sheet trên Google Drive, chuyển sang chế độ riêng tư (Chỉ mình tôi)."),
        p("2. Bước 2: Xóa triệt để mảng video Mixkit stock trong CreateProjectModal. Hiển thị thông báo hàng đợi chân thực cho người dùng."),
        p("3. Bước 3: Khởi chạy tệp docker-compose.yml đã có sẵn trong thư mục dự án để đưa toàn bộ quá trình render video và FFmpeg concat xuống tầng Worker ngầm."),

        new Paragraph({ spacing: { before: 200 } }),
        createCallout(
          "KẾT LUẬN TỪ HỘI ĐỒNG THẨM ĐỊNH",
          "Đội ngũ kỹ sư đã cho thấy sự cầu tiến và khả năng hiện thực hóa rất nhanh các ý tưởng của 2 phiên họp (Anti-DevTools và CapCut draft). Chỉ cần vượt qua bước cản cuối cùng là diệt trừ mảng mock video và bảo mật CSDL, hệ thống SYNAPES Studio sẽ đạt độ hoàn thiện 100% xứng tầm doanh nghiệp!",
          "10B981",
          "ECFDF5"
        )
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  const outputPath = path.join(__dirname, '..', '..', 'docs_typst', 'BAO_CAO_DANH_GIA_NGHIEM_THU_VA_KIEN_TRUC_TRIEN_KHAI_V3.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('DOCX V3 successfully generated at:', outputPath);
});
