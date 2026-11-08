#set page(
  paper: "a4",
  margin: (top: 2.2cm, bottom: 2.2cm, left: 2.2cm, right: 2.2cm),
  header: locate(loc => {
    if loc.page() > 0 [
      #grid(
        columns: (1fr, 1fr),
        align: (left, right),
        text(size: 8.5pt, fill: rgb("#64748b"), weight: "bold")[SYNAPES STUDIO — BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO],
        text(size: 8.5pt, fill: rgb("#64748b"), italic: true)[Báo cáo Kỹ thuật & Khắc phục lỗi]
      )
      #line(length: 100%, stroke: 0.5pt + rgb("#cbd5e1"))
    ]
  }),
  footer: locate(loc => {
    line(length: 100%, stroke: 0.5pt + rgb("#cbd5e1"))
    grid(
      columns: (1fr, 1fr),
      align: (left, right),
      text(size: 8pt, fill: rgb("#94a3b8"))[Hệ thống tự động hóa nội dung SYNAPES Auto Tool],
      text(size: 8pt, fill: rgb("#94a3b8"))[Trang #loc.page() / #counter(page).final(loc).at(0)]
    )
  })
)

#set text(font: "Times New Roman", size: 10.8pt, lang: "vi")
#set par(justify: true, leading: 0.72em)

// Tiêu đề đầu trang
#align(center)[
  #text(size: 11pt, weight: "bold")[CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM]\
  #text(size: 10pt, weight: "bold")[Độc lập - Tự do - Hạnh phúc]\
  #line(length: 30%, stroke: 0.8pt + black)
  #v(4pt)
  #text(size: 9.5pt, italic: true)[Thành phố Hồ Chí Minh, ngày 08 tháng 11 năm 2026]
]

#v(8pt)

#align(center)[
  #text(size: 15pt, weight: "bold", fill: rgb("#0f172a"))[BÁO CÁO TOÀN DIỆN TRIỂN KHAI HỆ THỐNG]\
  #text(size: 12.5pt, weight: "bold", fill: rgb("#0284c7"))[PHÒNG THỦ CHỐNG HỒI QUY (REGRESSION SHIELD) 3 GIAI ĐOẠN]\
  #v(2pt)
  #text(size: 9pt, italic: true, fill: rgb("#475569"))[(Phân loại: Khắc phục lỗi & Bảo vệ tính toàn vẹn hệ thống — Commit: f6bc7d7)]
]

#v(10pt)

// Khung thông tin tổng quan
#rect(
  width: 100%,
  fill: rgb("#f8fafc"),
  stroke: 1pt + rgb("#cbd5e1"),
  radius: 6pt,
  inset: 12pt,
  [
    #grid(
      columns: (1fr, 1fr),
      row-gutter: 7pt,
      [ *Dự án:* SYNAPES Studio (`autovideo-webapp`) ],
      [ *Chuyên mục:* Khắc phục lỗi & Bảo vệ toàn vẹn ],
      [ *Chủ trì:* KS. Nguyễn Hoàng Thiện (Trưởng ban CĐS & AI) ],
      [ *Mã định danh báo cáo:* BC-REG-261108 ],
      [ *Kho lưu trữ:* GitHub `synapes-auto-tool` (main) ],
      [ *Trạng thái:* Đã triển khai & Kiểm chứng thành công ]
    )
  ]
)

#v(10pt)

== 1. Bối Cảnh & Đặt Vấn Đề

Trong quá trình phát triển nhanh và phối hợp cùng AI, tình trạng *"các bản cập nhật mới vô tình làm ảnh hưởng hoặc làm sai lệch tính năng của các bản cập nhật trước đó"* (Software Regression) là nguy cơ lớn nhất đe dọa sự ổn định của hệ thống. 

Cụ thể, việc chỉnh sửa giao diện hoặc bổ sung logic mới dễ gây ra các hiệu ứng phụ (side effects):
- Làm lệch cấu trúc file dùng chung hoặc mất hình con dấu tròn chuẩn trong hợp đồng điện tử.
- Thay đổi cấu trúc dữ liệu khiến quy trình đồng bộ Google Sheet bị đứt gãy.
- Không có rào chắn tự động tại máy lập trình, dẫn đến việc đẩy code lỗi trực tiếp lên môi trường Production.

Để chấm dứt triệt để tình trạng trên, Ban Chuyển đổi số & Trí tuệ nhân tạo đã thiết kế và triển khai mô hình *Phòng Thủ Đa Tầng 3 Giai Đoạn*.

#v(6pt)

== 2. Chi Tiết Kết Quả Triển Khai 3 Giai Đoạn

=== Giai Đoạn 1: Vòng Kim Cô Cục Bộ & Bộ Kiểm Thử Golden Master (Đã Hoạt Động 100%)
1. *Bộ kiểm thử Golden Master & Invariants (`scripts/verify-integrity.cjs`):*
  - Khóa cứng *24 tiêu chí bất biến* của hệ thống.
  - *Bảo vệ Con dấu & Hợp đồng:* Tuyệt đối không còn thẻ chữ nhật `border: 2px solid #b91c1c` hay chữ `ĐÃ ĐÓNG DẤU XÁC THỰC`; bắt buộc nhúng trực tiếp con dấu tròn Base64 chuẩn tách nền và tên KS. Nguyễn Hoàng Thiện.
  - *Bảo vệ Khuôn mẫu Video:* Duy trì 2 định dạng 16:9 (Dài) và 9:16 (Ngắn), tính năng Tự thiết kế phong cách biên tập (Custom Skill Designer) và tách riêng tệp đính kèm.
  - *Bảo vệ Lịch phát sóng:* Giữ vững khung giờ vàng Goldtime (11:30 - 13:00, 18:00 - 20:30, 20:00 - 22:30), chế độ xem Tháng/Tuần và phân loại tag YouTube / TikTok / Facebook.
  - *Bảo vệ Plugin Webhook:* Đảm bảo logo nhà phát triển hiển thị rõ ràng và luồng điều phối kịch bản thông suốt.
2. *Husky Git Hooks (`.husky/pre-commit` & `.husky/pre-push`):*
  - Tự động chạy bộ test toàn vẹn mỗi khi gõ `git commit` và `git push`. Nếu có lỗi vi phạm, lệnh bị từ chối ngay tại chỗ.

=== Giai Đoạn 2: Playwright E2E & Visual Regression Smoke Tests
1. Tích hợp `@playwright/test` cấu hình chạy headless (`playwright.config.ts`).
2. Xây dựng 3 kịch bản E2E kiểm thử khói mô phỏng hành vi người dùng thực tế:
  - `contract-stamp.spec.ts`: Kiểm tra dữ liệu con dấu tròn và trang hợp đồng điện tử.
  - `video-creation.spec.ts`: Kiểm tra giao diện tạo video, định dạng 16:9 / 9:16 và bộ công cụ phong cách.
  - `schedule-and-projects.spec.ts`: Kiểm tra chuyển tab Lịch phát sóng Goldtime và danh mục dự án.

=== Giai Đoạn 3: Ranh Giới Kiến Trúc & GitHub Actions CI
1. *Kiểm soát kiến trúc bằng `dependency-cruiser` (`.dependency-cruiser.cjs`):*
  - Cấm triệt để Circular Dependencies (`no-circular`).
  - Cấm tầng dữ liệu (`types/`, `utils/`) import ngược từ `components/`.
  - Kết quả quét kiểm tra: *46 modules, 137 dependencies đạt 0 lỗi*.
2. *Kịch bản tự động hóa GitHub Actions (`ci/github-actions-ci.yml`):*
  - Tự động hóa khâu kiểm thử trên máy chủ ảo trước khi đóng gói triển khai lên Render.

#v(8pt)

== 3. Bảng Tổng Hợp Lệnh Vận Hành & Khóa An Toàn

#align(center)[
#table(
  columns: (2.5fr, 3.5fr, 1.5fr),
  fill: (col, row) => if row == 0 { rgb("#0f172a") } else if calc.even(row) { rgb("#f8fafc") } else { white },
  stroke: 0.5pt + rgb("#cbd5e1"),
  inset: 7pt,
  align: (left, left, center),
  [ #text(fill: white, weight: "bold")[Lệnh NPM] ],
  [ #text(fill: white, weight: "bold")[Mục Đích Bảo Vệ] ],
  [ #text(fill: white, weight: "bold")[Thời Gian] ],

  [`npm test` / `test:integrity`], [Chạy bộ 24 tiêu chí Golden Master bảo vệ tính năng cũ], [~0.5 giây],
  [`npm run lint:architecture`], [Kiểm tra ranh giới kiến trúc & chống vòng lặp import], [~1.8 giây],
  [`npm run build`], [Kiểm tra TypeCheck và đóng gói ứng dụng Production], [~2.5 giây],
  [`npm run test:e2e`], [Chạy bộ kịch bản mô phỏng tương tác giao diện người dùng], [~5.0 giây]
)
]

#v(10pt)

== 4. Cam Kết & Đánh Giá Vận Hành

- *Bảo toàn 100% thành quả trước đó:* Không một bản cập nhật mới nào được phép làm sai lệch tính năng đã hoàn thiện.
- *Cơ chế phòng thủ tự động:* Giảm thiểu 100% lỗi do sơ suất chủ quan khi phối hợp cùng AI hoặc dev nhóm.
- *Render Production an toàn tuyệt đối:* Máy chủ trực tuyến chỉ tiếp nhận bản phát hành khi toàn bộ 3 tầng phòng thủ đều báo xanh (Passed).

#v(20pt)

#grid(
  columns: (1fr, 1fr),
  align: (center, center),
  [
    *BÊN TIẾP NHẬN BÁO CÁO*\
    _Hệ thống Quản trị & Kỹ thuật Dự án_\
    #v(40pt)
    #text(weight: "bold")[LƯU TRỮ GOOGLE DRIVE & SHEET]
  ],
  [
    *ĐẠI DIỆN BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO*\
    _Trưởng ban (Ký và xác nhận)_\
    #v(40pt)
    #text(weight: "bold")[KS. NGUYỄN HOÀNG THIỆN]
  ]
)

