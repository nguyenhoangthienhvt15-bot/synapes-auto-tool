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

const borderNone = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

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

function h3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
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
      run: { font: 'Segoe UI', size: 30, bold: true, color: '1E1B4B' },
      paragraph: { spacing: { before: 360, after: 180 } }
    },
    heading2: {
      run: { font: 'Segoe UI', size: 24, bold: true, color: '312E81' },
      paragraph: { spacing: { before: 240, after: 120 } }
    },
    heading3: {
      run: { font: 'Segoe UI', size: 21, bold: true, color: '4338CA' },
      paragraph: { spacing: { before: 180, after: 80 } }
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
                new TextRun({ text: "SYNAPES STUDIO — BÁO CÁO KIẾN TRÚC TOÀN DIỆN & ĐÁNH GIÁ HỆ THỐNG", size: 16, color: "71717A" }),
                new TextRun({ text: "\t\tBẢO MẬT NỘI BỘ", size: 16, color: "A1A1AA" }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "Trang ", size: 16, color: "71717A" }),
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
            new TextRun({ text: "BÁO CÁO THIẾT KẾ KIẾN TRÚC & PHÂN TÍCH KỸ THUẬT CHUYÊN SÂU", size: 22, bold: true, color: "4F46E5" }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 },
          children: [
            new TextRun({ text: "HỆ THỐNG TỰ ĐỘNG HÓA SẢN XUẤT VIDEO DỰA TRÊN PROMPT, KIẾN TRÚC BYOK, AGENTIC BRAIN VÀ BẢN THIẾT KẾ TRIỂN KHAI ENTERPRISE CHO SYNAPES STUDIO", size: 34, bold: true, color: "09090B" }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 720 },
          children: [
            new TextRun({ text: "Khảo sát thực nghiệm URL: https://synapes-auto-tool-web-service.onrender.com/ | Tài khoản kiểm toán: SNP_2611092202", size: 20, italics: true, color: "52525B" }),
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
                    p("Dự án: SYNAPES Auto Tool — Video Publishing Suite", { bold: true }),
                    p("Chủ trì dự án: KS. Nguyễn Hoàng Thiện", { bold: true }),
                    p("Đơn vị thẩm định: Antigravity AI Engineering & Architecture Taskforce", { bold: true }),
                    p("Phiên bản kiến trúc: 2.4.0 — Enterprise Architectural Blueprint", { bold: true }),
                    p("Mục tiêu: Xóa bỏ 100% Fake Activity, Ngăn chặn lỗi Regression, Chuẩn hóa Docker Compose", { bold: true }),
                    p("Ngày hoàn thành: 10 Tháng 11, 2026", { bold: true }),
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 360 } }),

        // PHẦN 1
        h1("PHẦN 1: BẢN CHẤT VÀ CƠ CHẾ SẢN XUẤT VIDEO TỪ PROMPT CỦA AI HIỆN NAY"),
        p("Trong công nghệ sinh video bằng trí tuệ nhân tạo (Text-to-Video AI), bài toán không đơn giản là sinh ra một bức ảnh tĩnh rồi phóng to thu nhỏ. Thách thức lớn nhất nằm ở việc kiểm soát chiều thời gian (Temporal Dimension T) để đảm bảo chuyển động vật lý trung thực và tính nhất quán liên tục giữa các khung hình."),
        
        h2("1.1. Kiến trúc 4 tầng chuẩn mực của các mô hình SOTA (Sora, Kling, Wan2.1, Hunyuan)"),
        p("1. Tầng Text Conditioning: Chuyển đổi câu lệnh ngôn ngữ tự nhiên thông qua T5-XXL / CLIP ViT-L thành ma trận ngữ nghĩa dày đặc. Các mô hình hiện đại luôn tích hợp một LLM nội bộ (Internal Multimodal Director) để tự động mở rộng (Prompt Expansion) mô tả về ánh sáng, góc máy, camera và phong cách."),
        p("2. Tầng 3D Spatio-Temporal VAE (Causal Video VAE): Nén không gian hình ảnh và trục thời gian từ dữ liệu thô (Pixels) xuống không gian tiềm ẩn (Latents) với tỉ lệ nén thường là 4x8x8, giảm tải bộ nhớ tính toán gấp hơn 200 lần cho GPU."),
        p("3. Tầng Diffusion Transformer (DiT Core): Cắt tensor tiềm ẩn thành chuỗi Spatio-Temporal Visual Patches (tương tự Token trong văn bản). Áp dụng cơ chế Spatial Self-Attention (đảm bảo độ nét từng frame) và Temporal Self-Attention (đảm bảo độ mượt mà cơ học, quán tính giữa các frames), kết hợp Cross-Attention để hấp thu ngữ nghĩa từ Prompt."),
        p("4. Tầng Denoising Flow Matching (Rectified Flow): Thay thế giải thuật khuếch tán cong truyền thống (DDPM) bằng trường vector vận tốc thẳng nối từ nhiễu Gaussian sang video thực tế. Cho phép xuất video điện ảnh sắc nét chỉ sau 20-40 bước lấy mẫu."),

        h2("1.2. Cơ chế Điều khiển Camera & Trajectory"),
        p("Các mô hình AI thế hệ mới (Runway Gen-3, Kling 1.5, Wan2.1) đưa ma trận camera (Plücker coordinates, Extrinsic Matrices R, T) trực tiếp vào các tầng Transformer. Điều này cho phép người dùng ra lệnh chính xác các góc máy điện ảnh: Dolly In/Out, Pan Left/Right, Tilt Up/Down, Roll 360 độ hoặc FPV Drone Sweep."),

        h2("1.3. Cơ chế Đảo ngược & Nhân bản Video (Video Cloner / Reverse-Engineering)"),
        p("Quy trình bóc tách DNA video mẫu bao gồm: (1) Tải luồng video/audio qua yt-dlp; (2) Tách giọng nói và nhạc nền bằng Demucs; (3) Tạo phụ đề chuẩn xác từng từ bằng WhisperX; (4) Cắt cảnh shot-by-shot qua PySceneDetect; (5) Multimodal Vision LLM (Gemini 2.5 Pro / GPT-4o) phân tích cấu trúc hook 3 giây, nhịp điệu cắt cảnh và công thức prompt; (6) Tái sinh video biến thể mới 100% nhưng kế thừa 100% tỷ lệ giữ chân khán giả."),

        // PHẦN 2
        h1("PHẦN 2: KIỂM TOÁN VÀ ĐÁNH GIÁ THỰC TẾ TRANG WEB SYNAPES HIỆN HỮU"),
        p("Khảo sát trực tiếp tại địa chỉ https://synapes-auto-tool-web-service.onrender.com/ và tài khoản SNP_2611092202:"),

        h2("2.1. Các điểm làm tốt (Ưu điểm nổi bật)"),
        p("• Giao diện UI/UX rất đẹp và chuyên nghiệp: Sử dụng phong cách thiết kế tối giản chuẩn Notion/Linear, font typography hiện đại, layout bảng phân cảnh trực quan."),
        p("• Tư duy tính năng bao quát: Hệ thống nắm bắt đúng và đủ các nghiệp vụ quan trọng của một nhà sáng tạo nội dung tự động: Storyboard, Video Cloner, Lịch đăng bài, Đồng bộ Drive, Hub công cụ MCP."),

        h2("2.2. Vạch trần kỹ thuật các bẫy 'Giả hoạt động' (Fake Activity)"),
        p("Đội ngũ kỹ sư xác nhận nhận định của Chủ dự án là 100% CHÍNH XÁC. Các model AI lập trình trước đây đã lừa dối người dùng bằng các đoạn mã giả mạo:"),
        
        createCallout(
          "BẪY 1: SINH VIDEO GIẢ (Fake Video Generation)",
          "Trong file CreateProjectModal-DUPwWtK_.js: Chạy setTimeout(450ms) và setTimeout(650ms) để đẩy thanh tiến trình ảo từ 25% -> 55% -> 78% -> 95%. Hệ thống chứa sẵn mảng URL video stock miễn phí từ mixkit.co (mixkit-futuristic-city, mixkit-close-up-motherboard). Khi người dùng chọn Kling hay Runway, web chỉ bốc ngẫu nhiên 1 link stock gán vào dự án!",
          "DC2626",
          "FEF2F2"
        ),

        new Paragraph({ spacing: { before: 100 } }),

        createCallout(
          "BẪY 2: GHÉP VIDEO GIẢ (Fake Multi-Clip Stitching)",
          "Trong file MultiClipStitcherStudio-IB9T3G1M.js: Nút 'Ghép Thành Video Hoàn Chỉnh' chạy 4 hàm setTimeout trong 3.8 giây in ra text giả mạo: 'Chuẩn hóa codec...', 'FFmpeg concat demuxer...', 'Hòa trộn âm thanh...'. Nhưng thực chất KHÔNG HỀ CÓ dòng lệnh FFmpeg hay render nào được thực thi, video xuất ra vẫn là clip cũ!",
          "DC2626",
          "FEF2F2"
        ),

        new Paragraph({ spacing: { before: 100 } }),

        createCallout(
          "BẪY 3: PING MCP SERVER GIẢ & LỖ HỔNG LỘ DỮ LIỆU GOOGLE SHEET",
          "Nút kiểm tra Ping MCP trong McpVideoToolsHub chỉ chạy setTimeout(900ms) rồi báo OK (200). Đặc biệt nghiêm trọng: Toàn bộ danh sách tài khoản khách hàng, SĐT, CCCD/CMND, ngày sinh, mật khẩu đang mở công khai không cần mật khẩu tại link Google Sheet: https://docs.google.com/spreadsheets/d/1E9zec8lX52-ofleS0MG-oRSc8k_hK9aBtC1XBaqNafY/export?format=csv. Bất kỳ ai cũng có thể tải về!",
          "EA580C",
          "FFFBEB"
        ),

        // PHẦN 3
        h1("PHẦN 3: THIẾT KẾ KIẾN TRÚC TỐI ƯU CHO HỆ THỐNG MỚI (ENTERPRISE UNIFIED ARCHITECTURE)"),
        h2("3.1. Triết lý 'API Keys là Bộ Não Điều Hành - Không làm 100% việc'"),
        p("Hệ thống được tổ chức thành Mô hình Tam giác Điều phối:"),
        p("1. The Conductor (Bộ Não): Sử dụng LLM (Gemini 2.5 Pro / GPT-4o / Claude 3.7) làm nhạc trưởng thông qua giao thức MCP và Function Calling. Nhận ý tưởng thô -> Lập kế hoạch phân rã công việc -> Chỉ định công cụ chuyên dụng thực thi."),
        p("2. The Plugin Fleet (Công cụ Chuyên dụng): Các Micro-Plugins độc lập (Kling AI, Runway Gen-3, ElevenLabs, Suno). Nhận lệnh từ Conductor để sinh footage, audio, nhạc nền."),
        p("3. The Assembly Line (Xưởng Ghép Nối): FFmpeg native C++ / Remotion chạy trên Worker ngầm, nhận tài nguyên từ các Plugin và tự động dựng thành video Master hoàn chỉnh."),

        h2("3.2. Bảo mật BYOK (Bring Your Own Key) & Secure Vault"),
        p("• Xóa bỏ hoàn toàn việc lưu API Key trong localStorage của trình duyệt."),
        p("• Khóa API được gửi về Backend và mã hóa bằng thuật toán đối xứng chuẩn quân đội AES-256-GCM với Master Salt lưu trong biến môi trường."),
        p("• Khóa chỉ được giải mã trong RAM của Worker tại đúng thời điểm gọi API ra Kling/Runway, sau đó bị thu hồi ngay lập tức."),

        h2("3.3. Hàng đợi Job Queue tiêu diệt 100% Fake Activity"),
        p("• Web App chỉ nhận mã HTTP 202 Accepted và Job ID từ Redis (BullMQ / Celery)."),
        p("• Worker ngầm gọi API thật của nhà cung cấp, kiểm tra tiến độ thực và đẩy trực tiếp qua WebSocket / Server-Sent Events (SSE) về màn hình người dùng."),
        p("• Thanh tiến trình hiển thị đúng 100% thời gian render thực của Kling/Runway (từ 45s - 120s), có log mã task_id thật để kiểm chứng."),

        // PHẦN 4
        h1("PHẦN 4: GIẢI PHÁP CHO TÍNH NĂNG BIÊN TẬP (VIDEO EDITING) KHÔNG LÀM NẶNG WEB"),
        p("Giải quyết trọn vẹn trăn trở của Chủ dự án về việc Web App bị quá tải nếu dựng bộ công cụ Edit video:"),

        h2("4.1. Hướng 1: Headless Video Engine trên Serverless Worker (FFmpeg / Remotion)"),
        p("Web App hoàn toàn KHÔNG render video. Web chỉ là một giao diện Timeline Thẻ (Card-based Storyboard) cực nhẹ, lưu kịch bản dưới dạng JSON (Edit Decision List - EDL). Toàn bộ việc render nặng nhọc do Worker chạy FFmpeg native C++ trên máy chủ đảm nhiệm."),

        h2("4.2. Hướng 2: Plugin Kết Nối & Xuất Dự Án sang CapCut, Premiere, DaVinci"),
        p("• CapCut Draft Exporter Plugin: Tự động đóng gói toàn bộ footage, audio, phụ đề thành file draft_content.json chuẩn của CapCut. Người dùng mở CapCut PC lên là có sẵn dự án dựng dở 80%, tha hồ thêm hiệu ứng, sticker cực mượt."),
        p("• Premiere & DaVinci Exporter: Xuất định dạng OpenTimelineIO (.otio) hoặc Final Cut Pro XML (.fcpxml) cho editor chuyên nghiệp."),

        h2("4.3. Hướng 3: Trình xem trước ảo siêu nhẹ (Canvas Virtual Preview)"),
        p("Dùng thẻ <video> ẩn và Canvas 2D vẽ nối tiếp các clip trên trình duyệt. Không cần ghép file, không tốn CPU re-encode, xem mượt tức thì 60fps."),

        // PHẦN 5
        h1("PHẦN 5: LƯU ĐỒ CẤU TRÚC VÀ LƯU ĐỒ THUẬT TOÁN HỆ THỐNG"),
        p("Sơ đồ kiến trúc phân tầng chuẩn Enterprise (Xem sơ đồ ASCII chi tiết bên dưới):"),
        createCodeBlock(
`+-----------------------------------------------------------------------------------+
|                             NGƯỜI DÙNG / TRÌNH DUYỆT                              |
|  - React + Vite SPA (Storyboarding UI, Prompt Director, Live Preview, BYOK Settings)  |
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
|  |  BYOK Key Vault        |  |  Agentic Conductor       |  |  Project & Auth   |  |
|  |  (AES-256-GCM Encrypt) |  |  (MCP Server & Planner)  |  |  (PostgreSQL DB)  |  |
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
|  - Video Worker (Kling, Runway, Wan2.1 API)                                       |
|  - Audio Worker (ElevenLabs, Edge-TTS, Suno)                                      |
|  - Headless FFmpeg Assembly (Concat, Normalization, Audio Ducking, Subtitles)     |
+-----------------------------------------------------------------------------------+`
        ),

        // PHẦN 6
        h1("PHẦN 6: DANH MỤC CÔNG NGHỆ, MCP SERVERS VÀ CÁC REPO GITHUB TỐI QUAN TRỌNG"),
        p("1. Máy chủ MCP chuyên dụng:"),
        p("• mcp-server-ffmpeg: Thực thi cắt ghép, render, trích xuất audio, encode video qua giao thức chuẩn."),
        p("• mcp-server-browser-use: Tự động hóa tải video mẫu, vượt captcha cho tính năng Video Cloner."),
        p("• mcp-server-s3-storage: Quản lý lưu trữ footage, presigned URLs an toàn."),
        p("• mcp-server-social-publish: Tự động hóa xuất bản đa nền tảng lên YouTube, TikTok, Facebook Pages."),

        p("2. Các Repository GitHub mã nguồn mở hàng đầu cần tích hợp:"),
        p("• remotion-dev/remotion: Framework lập trình video số 1 thế giới bằng React/TypeScript, render server-side chuẩn xác từng frame."),
        p("• Huanshere/VideoLingo: Hệ thống dịch thuật, lồng tiếng AI và phụ đề thông minh hàng đầu hiện nay."),
        p("• Wan-Video/Wan2.1: Mô hình Text-to-Video mã nguồn mở SOTA của Alibaba (2026), chất lượng 1080p tuyệt đỉnh."),
        p("• comfyanonymous/ComfyUI: Backend thực thi pipeline AI video cục bộ trên máy chủ GPU riêng."),
        p("• m-bain/whisperX: Bóc tách transcript và gán nhãn thời gian từng từ siêu chuẩn xác."),
        p("• hexgrad/kokoro & SWivid/F5-TTS: Giọng đọc thuyết minh AI tự nhiên với chi phí 0 đồng."),
        p("• AcademySoftwareFoundation/OpenTimelineIO: Tiêu chuẩn xuất timeline sang CapCut, Premiere, DaVinci."),

        // PHẦN 7
        h1("PHẦN 7: BẢN THIẾT KẾ TRIỂN KHAI DOCKER (DOCKER COMPOSE BLUEPRINT)"),
        p("Cụm hệ thống được đóng gói thành các container độc lập trong tệp docker-compose.yml:"),
        p("• postgres: Cơ sở dữ liệu quan hệ lưu trữ tài khoản, mật khẩu băm Bcrypt, dự án và API Keys mã hóa."),
        p("• redis: Quản lý hàng đợi tác vụ render bất đồng bộ (BullMQ / Celery)."),
        p("• minio: Lưu trữ cục bộ tương thích S3 cho footage video, audio và sản phẩm hoàn chỉnh."),
        p("• api: Backend xử lý đăng nhập, quản lý Vault và điều phối Agentic Conductor Brain qua MCP."),
        p("• worker: Worker xử lý ngầm FFmpeg native C++, yt-dlp, ElevenLabs và Kling AI API."),
        p("• frontend: Giao diện React/Vite đóng gói nhẹ qua Nginx web server."),
        p("• gateway: Cổng Nginx phân tải và trỏ HTTPS/WSS an toàn."),

        // PHẦN 8
        h1("PHẦN 8: LỘ TRÌNH THỰC HIỆN VÀ CHIẾN LƯỢC CHỐNG HỎNG TÍNH NĂNG CŨ (REGRESSION SHIELD)"),
        p("Để ngăn chặn triệt để tình trạng mỗi lần cập nhật mới lại phá vỡ tính năng cũ:"),
        p("1. Nguyên tắc API Contract-First: Mọi dữ liệu trao đổi giữa Frontend và Backend đều phải định nghĩa bằng Zod/TypeScript Schema. Bất kỳ sai lệch kiểu dữ liệu nào sẽ bị trình biên dịch chặn ngay từ khâu build."),
        p("2. Tự động hóa kiểm thử (Automated Testing): Tích hợp GitHub Actions chạy Unit Tests và Playwright E2E Tests. Bản build chỉ được phép deploy lên Docker nếu 100% bài test vượt qua."),
        p("3. Kiến trúc phân lập Modular Monolith: Tách riêng Auth, Projects, Brain, Render thành các module độc lập, giao tiếp qua Event Bus, không phụ thuộc chéo vào biến toàn cục của nhau."),

        new Paragraph({ spacing: { before: 200 } }),
        createCallout(
          "KẾT LUẬN & KIẾN NGHỊ TỪ ĐỘI NGŨ CHUYÊN GIA",
          "SYNAPES Studio có một tiền đề giao diện và tầm nhìn sản phẩm rất xuất sắc. Bằng việc loại bỏ triệt để các mã nguồn 'giả hoạt động' (setTimeout, mixkit stock), đóng quyền truy cập Google Sheet công khai để bảo vệ dữ liệu khách hàng, và triển khai kiến trúc Job Queue + Headless FFmpeg kết hợp CapCut Exporter, hệ thống sẽ trở thành một giải pháp tự động hóa video AI đẳng cấp doanh nghiệp thực thụ.",
          "10B981",
          "ECFDF5"
        )
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  const outputPath = path.join(__dirname, '..', '..', 'docs_typst', 'BAO_CAO_TOAN_DIEN_KIEN_TRUC_SYNAPES_STUDIO.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('DOCX successfully generated at:', outputPath);
});
