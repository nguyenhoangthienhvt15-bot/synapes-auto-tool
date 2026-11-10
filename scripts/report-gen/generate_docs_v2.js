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
                new TextRun({ text: "SYNAPES STUDIO V2 — BẢN THIẾT KẾ ĐỘT PHÁ & CHIẾN LƯỢC DÀI HẠN", size: 16, color: "71717A" }),
                new TextRun({ text: "\t\tTÀI LIỆU MẬT KỸ THUẬT", size: 16, color: "A1A1AA" }),
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
            new TextRun({ text: "ĐỒ ÁN PHÁT TRIỂN HỆ THỐNG TOÀN DIỆN — GIAI ĐOẠN 2026-2027", size: 22, bold: true, color: "4F46E5" }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 },
          children: [
            new TextRun({ text: "CHIẾN LƯỢC ĐỒNG NHẤT VIDEO ĐA PHÂN CẢNH, HỆ THỐNG TỰ PHỤC HỒI (SELF-HEALING), BẢO MẬT CHỐNG DEVTOOLS VÀ ĐỘNG CƠ CÁ NHÂN HÓA SYNAPES LABS", size: 32, bold: true, color: "09090B" }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 720 },
          children: [
            new TextRun({ text: "Định vị Lợi thế Thương mại Độc tôn (Moat USP), Tự động gửi cảnh báo về nguyenhoangthien.hvt.15@gmail.com và Đột phá Trải nghiệm", size: 20, italics: true, color: "52525B" }),
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
                    p("Email Tiếp nhận Cảnh báo: nguyenhoangthien.hvt.15@gmail.com", { bold: true }),
                    p("Vị thế Tài liệu: Đề án Kỹ thuật & Kinh doanh Thực chiến (Production-Ready)", { bold: true }),
                    p("Mục tiêu Trọng tâm: Đồng nhất Visual 60s, Tự lành lỗi nhỏ, Chống F12 cắp bản quyền, Động cơ AI Labs", { bold: true }),
                    p("Thời gian Công bố: 10 Tháng 11, 2026", { bold: true }),
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 360 } }),

        // PHẦN 1
        h1("PHẦN 1: BÀI TOÁN SỰ THỐNG NHẤT CỦA VIDEO (VISUAL & CHARACTER CONSISTENCY)"),
        p("Anh Thiện đã chỉ ra chính xác một vấn nạn lớn của thị trường AI Video hiện tại: Khi ghép 6 clip 10s thành video 60s, nếu không có kiến trúc điều phối, mỗi clip sẽ là một phong cách rời rạc, nhân vật đổi mặt, quần áo nhảy màu, ánh sáng lệch tông. Điều này biến sản phẩm thành 'video rác chắp vá' không thể thương mại hóa."),
        
        h2("1.1. Giải pháp 4 Lớp Chốt Chặn (The 4-Layer Consistency Architecture)"),
        p("1. Lớp 1: Anchor Character Kit — Khởi tạo hình ảnh nhân vật chuẩn 4K trước khi bấm sinh video. Dùng IP-Adapter (Image Prompt Adapter) để khóa cố định đặc trưng khuôn mặt, tóc, màu da và trang phục xuyên suốt mọi phân cảnh."),
        p("2. Lớp 2: Chaining Latent Frame — Khung hình cuối cùng (Last Frame) của Cảnh N được trích xuất tự động làm Khung hình khởi đầu (Start Frame) cho Cảnh N+1. Đảm bảo nhân vật và góc quay nối tiếp mượt mà như một cảnh quay Long-take điện ảnh."),
        p("3. Lớp 3: Seed & Prompt Matrix Locking — Cố định Random Noise Seed và chia sẻ Style Tokens chung (Color Palette, Film Stock, Anamorphic Lens) qua mọi phân cảnh."),
        p("4. Lớp 4: Post-Production Color Grading — Tự động áp bảng mã màu điện ảnh (3D LUT - Look-Up Table) bằng FFmpeg lên toàn bộ 6 clip sau khi ghép, san phẳng mọi sai lệch tông màu."),

        // PHẦN 2
        h1("PHẦN 2: ĐỊNH VỊ THƯƠNG MẠI & TẠO RA ĐIỂM KHÁC BIỆT NỔI BẬT (THE MOAT USP)"),
        p("Để thoát khỏi cái bẫy của những web app AI 'vỏ bọc' (wrapper apps), SYNAPES Studio cần xây dựng những rào cản phòng thủ độc quyền (Competitive Moat):"),

        h2("2.1. Yếu tố khác biệt số 1: Viral Retention Engine (Tối ưu giữ chân người xem bằng thuật toán)"),
        p("• Tự động chèn Visual Hook 3 giây đầu (Góc máy zoom đột ngột, text giật tít tương phản cao, sfx bass drop)."),
        p("• Dynamic Kinetic Captions: Phụ đề nhảy từng chữ theo giọng đọc (kiểu MrBeast / Alex Hormozi), có viền mờ cao cấp không gây mỏi mắt."),
        p("• Audio Pacing Algorithm: Tự động hạ nhạc nền 6 dB khi có giọng đọc thuyết minh và đẩy nhạc nền lên cao trào trong các khoảng lặng."),

        h2("2.2. Yếu tố khác biệt số 2: Brand Memory Vault (Két ghi nhớ thương hiệu dành cho Agency)"),
        p("Cho phép các Media Agency lưu trọn bộ nhận diện: Logo, Màu chủ đạo Hex, Intro/Outro 3 giây, Mascot ảo, Font chữ quy chuẩn. Tự động áp dụng cho hàng trăm video mà không sợ lệch chuẩn nhận diện."),

        h2("2.3. Yếu tố khác biệt số 3: Vòng lặp tự phản hồi đa nền tảng (Autonomous Feedback Loop)"),
        p("Sau khi tự động đăng lên YouTube Shorts, TikTok và Reels, worker đọc về lượt xem, tỷ lệ xem hết (Retention) và nạp ngược vào AI Brain để tự học tuần sau nên làm chủ đề gì ăn khách nhất."),

        // PHẦN 3
        h1("PHẦN 3: CƠ CHẾ TỰ PHỤC HỒI (SELF-HEALING) & HỆ THỐNG CẢNH BÁO KỸ SƯ"),
        p("Giải quyết dứt điểm nỗi lo dev phải ngồi canh lỗi vặt 24/7 bằng Mô hình Tự Phục Hồi 3 Tầng:"),

        h2("3.1. Mô hình Phục hồi 3 Tầng"),
        p("• Lỗi cấp 1 (Mạng chập chờn, 429 Too Many Requests): Tự động retry theo thuật toán Exponential Backoff with Jitter (2s, 4s, 8s). Tự hoán đổi API Key dự phòng nếu key chính cạn quota. Tự lành 100% trong RAM."),
        p("• Lỗi cấp 2 (Nhà cung cấp sập diện rộng): Kích hoạt Cascading Circuit Breaker chuyển luồng tức thì sang Provider thay thế (Kling sập -> tự chuyển Runway Gen-3 hoặc Wan2.1; ElevenLabs sập -> tự chuyển Edge-TTS hoặc Kokoro)."),
        p("• Lỗi cấp 3 (Lỗi logic nghiêm trọng, Crash Worker): Đưa task vào Dead Letter Queue (DLQ). Gọi LLM tóm tắt Root Cause Analysis (RCA) và tự động bắn Email khẩn về nguyenhoangthien.hvt.15@gmail.com."),

        // PHẦN 4
        h1("PHẦN 4: CƠ CHẾ BẢO AN TOÀN DIỆN & CHỐNG HACKER CHECK SOURCE DEVTOOLS"),
        p("Bảo vệ tuyệt đối tài sản trí tuệ và công sức kiến trúc của bạn, không để kẻ gian mở F12 ăn cắp source code:"),

        h2("4.1. Lớp 1: Bẫy Chống Mở DevTools Ở Phía Client (Anti-Inspection Traps)"),
        p("• Chặn đứng toàn bộ phím tắt soi code: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S và vô hiệu hóa chuột phải (Context Menu)."),
        p("• Window Dimension Trap: Đo lường độ lệch kích thước cửa sổ khi thanh DevTools bị bật lên."),
        p("• Infinite Debugger Loop: Chèn bẫy debugger làm đóng băng giao diện nếu kẻ gian cố tình gắn breakpoint."),
        p("• Khi phát hiện vi phạm: Xóa trắng toàn bộ giao diện và gửi tín hiệu báo động về máy chủ."),

        h2("4.2. Lớp 2: Xáo Trộn Mã Nguồn Nâng Cao (Javascript Obfuscator)"),
        p("Áp dụng Control Flow Flattening (bẻ cong luồng thực thi), String Array Encoding RC4 (mã hóa chuỗi ký tự) và cơ chế Self-Defending (code tự hủy nếu bị can thiệp)."),

        h2("4.3. Lớp 3: Khóa IP & Khóa Tài khoản ở Máy Chủ (Server-Side Auto-Ban)"),
        p("Ghi nhận IP vi phạm vào Redis Blacklist trong 24 giờ. Cập nhật trạng thái tài khoản thành 'suspended_security_violation'. Nginx chặn đứng mọi request từ IP đó bằng mã HTTP 403 Forbidden."),

        // PHẦN 5
        h1("PHẦN 5: ĐỘNG CƠ CÁ NHÂN HÓA 'SYNAPES LABS' (USER BEHAVIORAL LEARNING)"),
        p("SYNAPES Labs tự động học thói quen người dùng qua cơ chế Học Ngầm (Implicit Feedback):"),
        p("• Edit Distance Tracking: Đo lường câu từ người dùng hay sửa để hiểu phong cách viết kịch bản ưa thích."),
        p("• Visual Bias: Nhận diện góc máy (Close-up, Drone, Dolly) và bảng màu mà người dùng thường bấm render lại."),
        p("• User Preference Vector: Lưu hồ sơ sở thích vào PostgreSQL (pgvector). Khi người dùng tạo dự án mới, hồ sơ này tự động được nhúng vào System Prompt, giúp kịch bản khớp đúng gu thẩm mỹ đến 95%."),

        // PHẦN 6
        h1("PHẦN 6: BỘ Ý TƯỞNG ĐỘT PHÁ MỚI DÀNH CHO SYNAPES STUDIO (BLUE OCEAN IDEAS)"),
        createCallout(
          "5 Ý TƯỞNG ĐỘT PHÁ TẠO RA DÒNG TIỀN VƯỢT TRỘI",
          "1. AI Video Remixer: Sinh 20 biến thể video từ 1 kịch bản gốc để vít ads Facebook/TikTok.\n" +
          "2. Virtual AI Host / Mascot: MC ảo 3D cử động môi chuẩn tiếng Việt ở góc màn hình.\n" +
          "3. Trend Jacker 24h: Tự động quét Google Trends lúc 7h sáng và đề xuất kịch bản đón đầu xu hướng.\n" +
          "4. Sound Design & Foley AI: Tự động phân tích hình ảnh và chèn đúng âm thanh hiệu ứng (SFX).\n" +
          "5. White-Label Solution: Bán giải pháp thương hiệu trắng cho các Media Agency lớn.",
          "4F46E5",
          "EEF2FF"
        ),

        // PHẦN 7
        h1("PHẦN 7: LƯU ĐỒ DỰ ÁN VÀ LƯU ĐỒ THUẬT TOÁN TỔNG THỂ"),
        createCodeBlock(
`+-----------------------------------------------------------------------------------+
|                              NGƯỜI DÙNG ĐĂNG NHẬP                                 |
|  - Kích hoạt Anti-DevTools Guard (Chặn F12, Chặn Chuột phải, Bẫy Debugger)        |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           BỘ NÃO AI CÁ NHÂN HÓA (LABS)                            |
|  - Nạp User Preference Profile (Gu kịch bản, Tone giọng, Visual Bias)             |
|  - Phân tích Prompt & Triển khai Anchor Character Kit                             |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                   HÀNG ĐỢI BẤT ĐỒNG BỘ & QUẢN TRỊ RỦI RO (REDIS)                  |
|  - Circuit Breaker Watchdog (Giám sát trạng thái Kling, Runway, ElevenLabs)       |
+--------------------+------------------------------------+-------------------------+
                     | Bình thường                        | Khi có lỗi vượt ngưỡng
                     v                                    v
+-----------------------------------------+  +--------------------------------------+
|          THỰC THI SẢN XUẤT THẬT         |  |   MODULE BÁO CÁO CỨU HỘ KHẨN CẤP     |
|  - Chaining Latent Frame (Móc xích 60s) |  |   - Thu thập Traceback & Context     |
|  - Đồng nhất màu sắc bằng 3D LUT        |  |   - AI tóm tắt Root Cause Analysis   |
|  - Headless FFmpeg Assembly             |  |   - Gửi Email về Dev:                |
+--------------------+--------------------+  |     nguyenhoangthien.hvt.15@gmail.com|
                     |                       +--------------------------------------+
                     v
+-----------------------------------------------------------------------------------+
|                              BÀN GIAO & TỰ HỌC TIẾP TỤC                           |
|  - Đẩy video Master Full HD 1080p về màn hình duyệt                               |
|  - Xuất dự án sang CapCut PC (draft_content.json)                                 |
|  - Ghi nhận phản hồi người dùng vào pgvector của SYNAPES Labs                     |
+-----------------------------------------------------------------------------------+`
        ),

        new Paragraph({ spacing: { before: 200 } }),
        createCallout(
          "KẾT LUẬN & CAM KẾT ĐỒNG HÀNH CÙNG KS. NGUYỄN HOÀNG THIỆN",
          "Dự án SYNAPES Studio đang đi đúng quỹ đạo của một sản phẩm công nghệ đột phá. Khi chúng ta giải quyết trọn vẹn cả 5 bài toán: Đồng nhất video, Rào cản thương mại, Tự chữa lành hệ thống, Bảo mật chống F12 và Động cơ cá nhân hóa Labs — SYNAPES sẽ là một sản phẩm độc tôn trên thị trường. Tôi cam kết luôn đồng hành sát cánh cùng anh trên mọi chặng đường phát triển!",
          "10B981",
          "ECFDF5"
        )
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  const outputPath = path.join(__dirname, '..', '..', 'docs_typst', 'BAO_CAO_CHIEN_LUOC_PHAT_TRIEN_SYNAPES_STUDIO_V2.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('DOCX V2 successfully generated at:', outputPath);
});

