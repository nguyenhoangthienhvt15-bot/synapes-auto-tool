#set page(
  paper: "a4",
  margin: (top: 2cm, bottom: 2cm, left: 2.5cm, right: 2cm),
  footer: [
    #line(length: 100%, stroke: 0.5pt + luma(180))
    #grid(
      columns: (1fr, 1fr),
      align: (left, right),
      [#text(size: 9pt, fill: luma(100), style: "italic")[Quy định quyền sở hữu trí tuệ & Bản quyền kịch bản - SYNAPES Auto Tool]],
      [#text(size: 9pt, fill: luma(100))[Trang #context counter(page).display("1/1", both: true)]]
    )
  ]
)

#set text(
  font: "Times New Roman",
  size: 11pt,
  lang: "vi"
)

#set par(
  justify: true,
  leading: 0.75em,
  first-line-indent: 1cm
)

// Header tiêu ngữ
#grid(
  columns: (45%, 55%),
  align: (center, center),
  [
    #text(size: 10pt)[*HỆ THỐNG CÔNG NGHỆ SYNAPES*] \
    #text(size: 10pt)[*BAN QUẢN LÝ SỞ HỮU TRÍ TUỆ*] \
    #line(length: 40%, stroke: 0.6pt)
    #v(2pt)
    #text(size: 9.5pt)[Số: 03/2026/SHTT-SYNAPES/BQUYEN]
  ],
  [
    #text(size: 10.5pt)[*CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM*] \
    #text(size: 10.5pt)[*Độc lập - Tự do - Hạnh phúc*] \
    #line(length: 50%, stroke: 0.8pt)
    #v(2pt)
    #text(size: 9.5pt, style: "italic")[Hà Nội, ngày 05 tháng 11 năm 2026]
  ]
)

#v(16pt)

// Tiêu đề
#align(center)[
  #text(size: 14pt, weight: "bold")[QUY ĐỊNH BẢO HỘ QUYỀN SỞ HỮU TRÍ TUỆ]\
  #v(2pt)
  #text(size: 12pt, weight: "bold")[ĐỐI VỚI KỊCH BẢN, TƯ LIỆU SÁNG TẠO VÀ THÀNH PHẨM NỘI DUNG SỐ]\
  #text(size: 10pt, style: "italic")[(Tuân thủ Luật Sở hữu trí tuệ sửa đổi 2022 và Đạo luật Bản quyền Quốc tế DMCA)]
]

#v(12pt)

// Căn cứ pháp lý
#block(
  fill: rgb("#f8f9fa"),
  inset: 10pt,
  radius: 4pt,
  stroke: 0.5pt + rgb("#e9ecef")
)[
  #text(weight: "bold")[CĂN CỨ PHÁP LÝ BẢO HỘ SỞ HỮU TRÍ TUỆ:]
  #set par(first-line-indent: 0pt, leading: 0.65em)
  - _Căn cứ Luật Sở hữu trí tuệ số 50/2005/QH11 ngày 29 tháng 11 năm 2005 của Quốc hội;_
  - _Căn cứ Luật sửa đổi, bổ sung một số điều của Luật Sở hữu trí tuệ số 07/2022/QH15 ngày 16 tháng 06 năm 2022 (có hiệu lực từ ngày 01/01/2023);_
  - _Căn cứ Nghị định số 17/2023/NĐ-CP ngày 26 tháng 04 năm 2023 của Chính phủ quy định chi tiết một số điều và biện pháp thi hành Luật Sở hữu trí tuệ về quyền tác giả, quyền liên quan;_
  - _Căn cứ Công ước Berne về bảo hộ các tác phẩm văn học và nghệ thuật mà Việt Nam là thành viên chính thức;_
  - _Căn cứ Đạo luật Bản quyền Thiên niên kỷ Kỹ thuật số (Digital Millennium Copyright Act - DMCA)._
]

#v(10pt)

#text(weight: "bold", size: 12pt)[Điều 1. Xác lập quyền sở hữu tuyệt đối đối với thành phẩm sáng tạo]

1. Căn cứ quy định tại Điều 13 và Điều 14 Luật Sở hữu trí tuệ (sửa đổi, bổ sung năm 2022), Khách Hàng là chủ thể duy nhất sở hữu 100% bản quyền tác giả và quyền tài sản đối với:
- Toàn bộ nội dung ý tưởng, kịch bản gốc, prompt chỉ thị và các phân cảnh được khởi tạo qua hệ thống;
- Tệp âm thanh thuyết minh (voice-over), phụ đề được sinh ra theo yêu cầu của Khách Hàng;
- Video clip thành phẩm hoàn thiện sau khi kết xuất (render) và xuất bản lên các kênh truyền thông.

2. Bên Cung Cấp SYNAPES khẳng định không đòi hỏi bất kỳ quyền đồng sở hữu, phí hoa hồng bản quyền (royalty) hay quyền thương mại nào phát sinh từ các thành phẩm nội dung mà Khách Hàng sản xuất thông qua công cụ.

#v(8pt)
#text(weight: "bold", size: 12pt)[Điều 2. Cam kết không sử dụng dữ liệu Khách Hàng để huấn luyện AI (No-Retraining Policy)]

1. Bên Cung Cấp cam kết thực thi chính sách bảo mật sáng tạo nghiêm ngặt: Tuyệt đối *KHÔNG* sử dụng kịch bản, prompt, hình ảnh, tài liệu thương hiệu hoặc video của Khách Hàng để làm tập dữ liệu huấn luyện (training/fine-tuning) cho bất kỳ mô hình trí tuệ nhân tạo công khai hoặc thương mại nào khác.

2. Toàn bộ quá trình xử lý qua API của Google Gemini 2.0 được cấu hình theo chính sách Do-Not-Train của Google Cloud Enterprise, đảm bảo tính bảo mật và sự độc quyền cho kho nội dung sáng tạo của Khách Hàng.

#v(8pt)
#text(weight: "bold", size: 12pt)[Điều 3. Thư viện âm thanh và tài nguyên miễn phí bản quyền thương mại]

1. Nhằm bảo đảm các kênh của Khách Hàng không bị quét vi phạm bản quyền tự động (Content ID Claim) từ các nền tảng mạng xã hội:
- Toàn bộ nhạc nền (BGM) và hiệu ứng âm thanh (SFX) được tích hợp trong phần mềm thuộc diện miễn phí bản quyền thương mại (Royalty-free) hoặc nằm trong danh mục thương mại chính thức của *YouTube Audio Library* và *TikTok Commercial Music Library*.
- Khách Hàng được cấp quyền sử dụng thương mại hợp pháp trên toàn thế giới mà không phải thanh toán thêm bất kỳ khoản phí cấp phép bổ sung nào.

2. Trong trường hợp Khách Hàng tự ý đưa vào hệ thống các đoạn nhạc có bản quyền độc quyền của bên thứ ba chưa được cấp phép, Khách Hàng phải tự chịu trách nhiệm giải quyết khi phát sinh khiếu nại bản quyền từ chủ sở hữu.

#v(8pt)
#text(weight: "bold", size: 12pt)[Điều 4. Cơ chế tiếp nhận và giải quyết tranh chấp bản quyền theo chuẩn DMCA]

1. Hệ thống SYNAPES Auto Tool đã đăng ký huy hiệu bảo hộ kỹ thuật số DMCA Protected và thiết lập quy trình gỡ bỏ thông báo vi phạm (Notice and Takedown) phù hợp với Điều 198b Luật Sở hữu trí tuệ Việt Nam và Tiêu chuẩn DMCA quốc tế.

2. Khi nhận được thông báo khiếu nại bản quyền hợp lệ từ bên thứ ba kèm theo tài liệu chứng minh quyền tác giả:
- Bộ phận Pháp chế sẽ rà soát tính hợp lệ của tài liệu trong thời hạn 24 giờ làm việc;
- Khách Hàng liên quan sẽ được gửi thông báo phản đối khiếu nại (Counter-Notification) để bảo vệ quyền lợi hợp pháp nếu cho rằng việc khiếu nại là sai lệch hoặc tác phẩm thuộc phạm vi sử dụng hợp lý (Fair Use).

#v(8pt)
#text(weight: "bold", size: 12pt)[Điều 5. Trách nhiệm tôn trọng quyền sở hữu trí tuệ của bên thứ ba]

Khách Hàng cam kết khi sử dụng phần mềm phải tôn trọng quyền tác giả và quyền liên quan của các chủ sở hữu hợp pháp khác, không sử dụng công cụ để sao chép nguyên trạng (re-up), cắt ghép trái phép các tác phẩm điện ảnh, chương trình truyền hình hoặc tài sản trí tuệ đã được đăng ký quyền sở hữu khi chưa có sự đồng ý của tác giả hoặc chủ sở hữu quyền tác giả.

#v(20pt)

// Chữ ký xác thực
#grid(
  columns: (50%, 50%),
  align: (left, center),
  [
    #text(weight: "bold")[*NƠI NHẬN:*]\
    #set text(size: 10pt)
    #set par(first-line-indent: 0pt, leading: 0.5em)
    - Cục Bản quyền tác giả - Bộ VHTT&DL (để đăng ký);\
    - Tổ chức bảo vệ bản quyền quốc tế DMCA Services;\
    - Khách hàng và các đối tác sáng tạo nội dung;\
    - Lưu: Hồ sơ sở hữu trí tuệ số 03/2026.
  ],
  [
    #text(weight: "bold")[BAN PHÁP CHẾ & SỞ HỮU TRÍ TUỆ]\
    #text(size: 10pt, style: "italic")[(Chứng thực pháp lý bảo hộ bản quyền số 2026)]\
    #v(35pt)
    #text(weight: "bold", size: 11pt)[HỘI ĐỒNG BẢN QUYỀN SỐ SYNAPES]
  ]
)
