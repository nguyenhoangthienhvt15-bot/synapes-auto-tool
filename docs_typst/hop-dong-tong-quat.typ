#set page(
  paper: "a4",
  margin: (top: 2cm, bottom: 2cm, left: 2.5cm, right: 2cm),
  footer: [
    #line(length: 100%, stroke: 0.5pt + luma(180))
    #grid(
      columns: (1fr, 1fr),
      align: (left, right),
      [#text(size: 8.5pt, fill: luma(100), style: "italic")[Hợp đồng dịch vụ phần mềm SYNAPES Studio — Văn bản điện tử]],
      [#text(size: 8.5pt, fill: luma(100))[Trang #context counter(page).display("1/1", both: true)]]
    )
  ]
)

#set text(
  font: "Times New Roman",
  size: 10.5pt,
  lang: "vi"
)

#set par(
  justify: true,
  leading: 0.65em,
  first-line-indent: 1cm
)

// Header tiêu ngữ
#grid(
  columns: (45%, 55%),
  align: (center, center),
  [
    #text(size: 9.5pt)[*HỆ THỐNG CÔNG NGHỆ SYNAPES*] \
    #text(size: 9.5pt)[*BAN CHUYỂN ĐỔI SỐ & AI*] \
    #line(length: 40%, stroke: 0.6pt)
    #v(1pt)
    #text(size: 8.5pt)[Số: 05/2026/HĐĐT-SYNAPES]
  ],
  [
    #text(size: 10pt)[*CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM*] \
    #text(size: 10pt)[*Độc lập - Tự do - Hạnh phúc*] \
    #line(length: 50%, stroke: 0.8pt)
    #v(1pt)
    #text(size: 8.5pt, style: "italic")[Thành phố Hồ Chí Minh, ngày 05 tháng 11 năm 2026]
  ]
)

#v(10pt)

// Tiêu đề hợp đồng
#align(center)[
  #text(size: 13pt, weight: "bold")[HỢP ĐỒNG ĐIỆN TỬ CUNG CẤP & SỬ DỤNG DỊCH VỤ PHẦN MỀM]\
  #v(1pt)
  #text(size: 11pt, weight: "bold")[NỀN TẢNG SẢN XUẤT VIDEO TỰ ĐỘNG SYNAPES STUDIO]\
  #text(size: 9pt, style: "italic")[(Hợp đồng tổng quát xác lập quyền hạn, nghĩa vụ, bảo mật và trách nhiệm pháp lý)]
]

#v(6pt)

// Căn cứ pháp lý
#block(
  fill: rgb("#f8f9fa"),
  inset: 7pt,
  radius: 3pt,
  stroke: 0.5pt + rgb("#e9ecef")
)[
  #text(weight: "bold", size: 9pt)[CĂN CỨ PHÁP LÝ THI HÀNH:]
  #set par(first-line-indent: 0pt, leading: 0.55em)
  #text(size: 8.5pt)[
    - _Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015 của Quốc hội nước CHXHCN Việt Nam;_ \
    - _Căn cứ Luật Giao dịch điện tử số 20/2023/QH15 ngày 22/06/2023 (quy định giá trị pháp lý chứng từ điện tử);_ \
    - _Căn cứ Luật Công nghệ thông tin số 67/2006/QH11 ngày 29/06/2006 của Quốc hội;_ \
    - _Căn cứ Luật An toàn thông tin mạng số 86/2015/QH13 và Luật An ninh mạng số 24/2018/QH14;_ \
    - _Căn cứ Luật Sở hữu trí tuệ số 50/2005/QH11 và Luật sửa đổi, bổ sung số 07/2022/QH15;_ \
    - _Căn cứ Nghị định số 13/2023/NĐ-CP của Chính phủ về bảo vệ dữ liệu cá nhân;_ \
    - _Căn cứ Nghị định số 147/2024/NĐ-CP của Chính phủ về quản lý, cung cấp và sử dụng dịch vụ Internet._
  ]
]

#v(6pt)
#set par(first-line-indent: 0pt)
Hôm nay, ngày 05 tháng 11 năm 2026, tại Hệ thống Nền tảng Đám mây SYNAPES Studio, hai bên chúng tôi gồm:

#v(3pt)
#text(weight: "bold")[BÊN A: BÊN CUNG CẤP DỊCH VỤ NỀN TẢNG (SYNAPES STUDIO)]
- *Đơn vị phát triển:* Nền tảng Tự động hóa Nội dung số SYNAPES Studio
- *Đại diện giao dịch:* *KS. NGUYỄN HOÀNG THIỆN*
- *Chức vụ:* *Trưởng ban Chuyển đổi số & Trí tuệ nhân tạo*
- *Hộp thư điện tử chính thức:* nguyenhoangthien.hvt.15\@gmail.com
- *Cổng dịch vụ trực tuyến:* https://synapes-auto-tool.onrender.com

#v(3pt)
#text(weight: "bold")[BÊN B: BÊN MUA HÀNG VÀ SỬ DỤNG DỊCH VỤ (KHÁCH HÀNG)]
- *Họ và tên:* [HỌ VÀ TÊN KHÁCH HÀNG ĐĂNG KÝ]
- *Ngày tháng năm sinh:* [NGÀY/THÁNG/NĂM SINH] #h(1cm) *Giới tính:* [GIỚI TÍNH]
- *Số điện thoại:* [SỐ ĐIỆN THOẠI KHÁCH HÀNG]
- *Gmail đăng ký nhận tài khoản:* [GMAIL ĐĂNG KÝ CỦA KHÁCH HÀNG]
- *Địa chỉ hiện tại:* [ĐỊA CHỈ THỰC TẾ / TỌA ĐỘ BẢN ĐỒ ĐỊNH VỊ GPS]

#v(4pt)
Hai bên cùng thống nhất ký kết Hợp đồng dịch vụ điện tử này với các điều khoản tổng quát cam kết như sau:

#set par(first-line-indent: 1cm)

#v(4pt)
#text(weight: "bold", size: 11pt)[Điều 1. Quy chế cung cấp và sử dụng phần mềm SYNAPES Studio]
1. Bên A cấp quyền truy cập phần mềm dạng dịch vụ (SaaS) SYNAPES Auto Tool cho Bên B thông qua Mã Code định danh (`SNP_...`) và mật khẩu mã hóa sau khi hồ sơ đăng ký được phê duyệt.
2. Bên B được toàn quyền sử dụng các Module công nghệ bao gồm: Phân tích và biên soạn kịch bản video AI (OpenAI GPT, Claude, Gemini, DeepSeek, Grok), tạo giọng đọc AI (TTS), biên tập cắt ghép đa phân cảnh tự động (MultiClip Stitcher) và tích hợp API phát sóng.
3. Bên B cam kết quản lý an toàn thông tin đăng nhập, không thực hiện hành vi sao chép trái phép mã nguồn, can thiệp luồng dữ liệu (reverse-engineering) hoặc tấn công từ chối dịch vụ (DDoS) vào hạ tầng máy chủ của Bên A.

#v(4pt)
#text(weight: "bold", size: 11pt)[Điều 2. Cam kết bảo mật dữ liệu cá nhân & an toàn Token API]
1. Tuân thủ nghiêm ngặt Nghị định số 13/2023/NĐ-CP, Bên A áp dụng chuẩn mã hóa quân sự AES-256-GCM đối với toàn bộ thông tin đăng ký và dữ liệu dự án của Bên B.
2. Các khóa chứng thực API cá nhân (API Keys của AI Models, YouTube Data API, TikTok Posting API, Meta Graph API, Google Drive Refresh Token) được lưu trữ cô lập tại vùng nhớ mã hóa an toàn. Bên A tuyệt đối không chia sẻ, không chuyển giao và không thương mại hóa dữ liệu riêng tư của Bên B cho bất kỳ bên thứ ba nào.

#v(4pt)
#text(weight: "bold", size: 11pt)[Điều 3. Quyền sở hữu trí tuệ đối với kịch bản và sản phẩm video]
1. Căn cứ Luật Sở hữu trí tuệ năm 2005 (sửa đổi, bổ sung năm 2022) và Công ước Berne: Bên B là chủ sở hữu quyền tác giả duy nhất và toàn vẹn đối với mọi kịch bản văn học, tư liệu sáng tạo và sản phẩm video hoàn thiện được xuất bản từ hệ thống.
2. Bên A không đòi hỏi bất kỳ quyền sở hữu, bản quyền thương mại hay quyền chia sẻ doanh thu nào từ kênh phân phối và nội dung video do Bên B sáng tạo.

#v(4pt)
#text(weight: "bold", size: 11pt)[Điều 4. Cơ chế phê duyệt kiểm soát nội dung & Miễn trừ trách nhiệm]
1. *Cơ chế kiểm soát có con người (Human-in-the-loop):* Phần mềm hoạt động với cơ chế kiểm duyệt bắt buộc; toàn bộ video chỉ được đưa vào hàng đợi đăng tải sau khi Bên B đã trực tiếp xem duyệt và chủ động bấm nút xác nhận phê duyệt xuất bản.
2. Bên B cam kết tuân thủ Điều 8 và Điều 16 Luật An ninh mạng năm 2018 và Nghị định số 147/2024/NĐ-CP; tự chịu hoàn toàn trách nhiệm trước pháp luật về tính chân thực, bản quyền âm thanh hình ảnh và hậu quả pháp lý liên quan đến nội dung do mình phát tán lên các nền tảng mạng xã hội. Bên A được miễn trừ hoàn toàn trách nhiệm liên đới đối với các tranh chấp nội dung do Bên B gây ra.

#v(4pt)
#text(weight: "bold", size: 11pt)[Điều 5. Hiệu lực hợp đồng và phương thức thực hiện]
1. Hợp đồng điện tử này có giá trị pháp lý tương đương bản hợp đồng giấy theo Điều 13 và Điều 34 Luật Giao dịch điện tử số 20/2023/QH15, có hiệu lực kể từ thời điểm Bên B tích chọn chấp nhận và ký điện tử trên hệ thống WebApp.
2. Dữ liệu đăng ký được lưu trữ chính thức tại Bảng tính quản trị `Thông tin người dùng` của hệ thống SYNAPES Studio và được kích hoạt cấp Mã Code, Mật khẩu gửi về hộp thư điện tử của Bên B sau khi Kỹ sư Bên A tích duyệt hồ sơ.

#v(15pt)

// Phần chữ ký 2 bên
#grid(
  columns: (50%, 50%),
  align: (center, center),
  [
    #text(weight: "bold")[ĐẠI DIỆN MUA HÀNG (BÊN B)] \
    #text(size: 9pt, style: "italic")[(Ký, ghi rõ họ tên)] \
    #v(35pt)
    #text(weight: "bold", size: 11pt)[[HỌ VÀ TÊN KHÁCH HÀNG]] \
    #text(size: 9pt, fill: rgb("#16a34a"), style: "italic")[✓ Đã ký điện tử xác thực qua WebApp]
  ],
  [
    #text(weight: "bold")[ĐẠI DIỆN GIAO DỊCH (BÊN A)] \
    #text(size: 9.5pt, weight: "bold")[TRƯỞNG BAN CHUYỂN ĐỔI SỐ & TRÍ TUỆ NHÂN TẠO] \
    #text(size: 9pt, style: "italic")[(Ký, đóng dấu điện tử)] \
    #v(5pt)
    #block(height: 70pt)[
      #place(center + top)[
        #image("../public/stamp-truong-ban.png", width: 75pt)
      ]
      #v(42pt)
      #text(weight: "bold", size: 11pt)[KS. NGUYỄN HOÀNG THIỆN] \
      #text(size: 9pt, fill: rgb("#b91c1c"), style: "italic")[✓ Đã xác thực con dấu & ký điện tử]
    ]
  ]
)

