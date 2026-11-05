#set page(
  paper: "a4",
  margin: (top: 2cm, bottom: 2cm, left: 2.5cm, right: 2cm),
  footer: [
    #line(length: 100%, stroke: 0.5pt + luma(180))
    #grid(
      columns: (1fr, 1fr),
      align: (left, right),
      [#text(size: 9pt, fill: luma(100), style: "italic")[Hệ thống SYNAPES Auto Tool - Quy chế dịch vụ phần mềm]],
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
    #text(size: 10pt)[*BAN ĐIỀU HÀNH NỀN TẢNG*] \
    #line(length: 40%, stroke: 0.6pt)
    #v(2pt)
    #text(size: 9.5pt)[Số: 01/2026/QĐ-SYNAPES/ĐKSD]
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
  #text(size: 14pt, weight: "bold")[QUY CHẾ VÀ ĐIỀU KHOẢN SỬ DỤNG DỊCH VỤ PHẦN MỀM]\
  #v(2pt)
  #text(size: 12pt, weight: "bold")[NỀN TẢNG TỰ ĐỘNG HÓA SẢN XUẤT NỘI DUNG SỐ SYNAPES AUTO TOOL]\
  #text(size: 10pt, style: "italic")[(Ban hành kèm theo Quyết định số 01/2026/QĐ-SYNAPES)]
]

#v(12pt)

// Căn cứ pháp lý
#block(
  fill: rgb("#f8f9fa"),
  inset: 10pt,
  radius: 4pt,
  stroke: 0.5pt + rgb("#e9ecef")
)[
  #text(weight: "bold")[CĂN CỨ PHÁP LÝ THI HÀNH:]
  #set par(first-line-indent: 0pt, leading: 0.65em)
  - _Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24 tháng 11 năm 2015 của Quốc hội;_
  - _Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14 tháng 06 năm 2005 của Quốc hội;_
  - _Căn cứ Luật Giao dịch điện tử số 20/2023/QH15 ngày 22 tháng 06 năm 2023 (có hiệu lực từ ngày 01/07/2024);_
  - _Căn cứ Luật Công nghệ thông tin số 67/2006/QH11 ngày 29 tháng 06 năm 2006 của Quốc hội;_
  - _Căn cứ Luật An ninh mạng số 24/2018/QH14 ngày 12 tháng 06 năm 2018 của Quốc hội;_
  - _Căn cứ Nghị định số 52/2013/NĐ-CP và Nghị định số 85/2021/NĐ-CP của Chính phủ về thương mại điện tử;_
  - _Căn cứ Nghị định số 147/2024/NĐ-CP ngày 09 tháng 11 năm 2024 của Chính phủ về quản lý, cung cấp, sử dụng dịch vụ Internet và thông tin trên mạng._
]

#v(10pt)

#text(weight: "bold", size: 12pt)[Điều 1. Phạm vi điều chỉnh và đối tượng áp dụng]

1. Bản Quy chế này quy định các điều kiện, quyền hạn, nghĩa vụ và trách nhiệm pháp lý giữa đơn vị phát triển nền tảng công nghệ SYNAPES (sau đây gọi tắt là "Bên Cung Cấp") và tổ chức, cá nhân tham gia đăng ký, kích hoạt và sử dụng hệ thống phần mềm SYNAPES Auto Tool (sau đây gọi tắt là "Khách Hàng" hoặc "Người Sử Dụng").

2. Dịch vụ phần mềm SYNAPES Auto Tool là giải pháp phần mềm dạng dịch vụ (SaaS) hỗ trợ phân rã kịch bản thông minh bằng trí tuệ nhân tạo (AI), tạo giọng đọc tự động (TTS), biên tập video tự động và tích hợp phân phối nội dung đa kênh lên YouTube, TikTok, Facebook theo tiêu chuẩn kỹ thuật số.

#v(8pt)
#text(weight: "bold", size: 12pt)[Điều 2. Mã truy cập (Access Code) và bảo mật tài khoản]

1. Theo quy định tại Điều 13 Luật Giao dịch điện tử số 20/2023/QH15, mỗi Khách Hàng khi hoàn tất thủ tục đăng ký sẽ được khởi tạo một Mã Khách Hàng độc nhất (Code) kèm mật khẩu mặc định để đăng nhập phiên làm việc ban đầu.

2. Khách Hàng có quyền và trách nhiệm bắt buộc phải tiến hành đổi sang mật khẩu bảo mật cá nhân ngay trong phiên đăng nhập đầu tiên. Hệ thống áp dụng thuật toán băm mật khẩu một chiều (bcrypt), Bên Cung Cấp không lưu trữ và không có quyền truy xuất mật khẩu cá nhân của Khách Hàng.

3. Khách Hàng chịu hoàn toàn trách nhiệm bảo mật thiết bị đăng nhập và các tác vụ phát sinh từ tài khoản của mình. Trường hợp phát hiện nghi vấn lộ lọt thông tin, Khách Hàng phải thông báo ngay cho bộ phận hỗ trợ kỹ thuật để phong tỏa phiên làm việc tạm thời.

#v(8pt)
#text(weight: "bold", size: 12pt)[Điều 3. Quy chuẩn thời lượng và giới hạn kỹ thuật sản xuất video]

1. Căn cứ thỏa thuận cung cấp dịch vụ và thông số tối ưu hạ tầng mạng máy tính:
- *Định dạng video dài (YouTube Video):* Thời lượng được thiết kế trong khung tiêu chuẩn từ 05 (năm) phút đến 10 (mười) phút nhằm đảm bảo chất lượng thuật toán phân phối nội dung và tính ổn định khi render.
- *Định dạng video ngắn (TikTok Shorts / Facebook Reels):* Thời lượng giới hạn dưới 60 (sáu mươi) giây, tỷ lệ khung hình 9:16 tối ưu cho thiết bị di động.

2. Khách Hàng cam kết không thực hiện các hành vi cố tình chèn mã độc, can thiệp luồng dữ liệu (reverse-engineering), khai thác lỗ hổng hoặc gửi yêu cầu dồn dập (DDoS) gây nghẽn tắc hệ thống máy chủ xử lý video.

#v(8pt)
#text(weight: "bold", size: 12pt)[Điều 4. Quyền và nghĩa vụ của Người Sử Dụng]

1. *Quyền của Khách Hàng:*
- Được toàn quyền khai thác các tính năng tự động hóa kịch bản, thư viện giọng đọc AI và công cụ kết xuất video theo gói dịch vụ đã kích hoạt;
- Được yêu cầu hỗ trợ kỹ thuật 24/7 đối với các lỗi phát sinh thuộc về hạ tầng phần mềm cốt lõi;
- Được bảo lưu toàn vẹn tài sản số, kịch bản sáng tạo và thành phẩm video theo quy định bảo hộ sở hữu trí tuệ.

2. *Nghĩa vụ của Khách Hàng:*
- Tuân thủ nghiêm ngặt các quy định của Luật An ninh mạng năm 2018; không sử dụng phần mềm để tạo dựng, biên tập hoặc phát tán các nội dung xuyên tạc, chống phá Nhà nước, kích động bạo lực, vi phạm thuần phong mỹ tục hoặc xâm phạm quyền, lợi ích hợp pháp của tổ chức, cá nhân khác;
- Chịu trách nhiệm về tính pháp lý và bản quyền của hình ảnh, văn bản, âm thanh do chính Khách Hàng tải lên hệ thống.

#v(8pt)
#text(weight: "bold", size: 12pt)[Điều 5. Quyền và trách nhiệm của Bên Cung Cấp SYNAPES]

1. Đảm bảo tính khả dụng kỹ thuật của hệ thống với cam kết tỷ lệ thời gian hoạt động (SLA Uptime) đạt tối thiểu 99,5% mỗi tháng, ngoại trừ các đợt bảo trì định kỳ có thông báo trước.

2. Kịp thời cập nhật các phiên bản điều chỉnh mã nguồn khi các nhà mạng đối tác (Google, Meta, TikTok) thay đổi thông số giao tiếp API nhằm duy trì luồng xuất bản video không bị gián đoạn.

#v(8pt)
#text(weight: "bold", size: 12pt)[Điều 6. Điều khoản thi hành và giải quyết tranh chấp]

1. Bản Quy chế này có hiệu lực kể từ ngày ban hành và tự động áp dụng đối với mọi Khách Hàng ngay khi truy cập vào hệ thống phần mềm SYNAPES Auto Tool.

2. Mọi tranh chấp phát sinh từ hoặc liên quan đến việc sử dụng phần mềm sẽ được ưu tiên giải quyết thông qua thương lượng, hòa giải trên tinh thần tôn trọng quyền lợi hợp pháp của các bên. Trường hợp không thể tự thỏa thuận, tranh chấp sẽ được đưa ra giải quyết tại Tòa án nhân dân có thẩm quyền theo quy định của pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.

#v(20pt)

// Chữ ký xác thực
#grid(
  columns: (50%, 50%),
  align: (left, center),
  [
    #text(weight: "bold")[*NƠI NHẬN:*]\
    #set text(size: 10pt)
    #set par(first-line-indent: 0pt, leading: 0.5em)
    - Ban Lãnh đạo điều hành SYNAPES;\
    - Khách hàng sử dụng hệ thống;\
    - Bộ phận Pháp chế & Kỹ thuật;\
    - Lưu: Hồ sơ kỹ thuật số số 01/2026.
  ],
  [
    #text(weight: "bold")[TM. HỘI ĐỒNG ĐIỀU HÀNH SYNAPES]\
    #text(size: 10pt, style: "italic")[(Đã ký và xác thực điện tử qua chữ ký số số học)]\
    #v(35pt)
    #text(weight: "bold", size: 11pt)[BAN PHÁP CHẾ & BẢO ĐẢM DỊCH VỤ]
  ]
)
