#set page(
  paper: "a4",
  margin: (top: 2cm, bottom: 2cm, left: 2.5cm, right: 2cm),
  footer: [
    #line(length: 100%, stroke: 0.5pt + luma(180))
    #grid(
      columns: (1fr, 1fr),
      align: (left, right),
      [#text(size: 9pt, fill: luma(100), style: "italic")[Cơ chế phê duyệt & Miễn trừ trách nhiệm pháp lý - SYNAPES Auto Tool]],
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
    #text(size: 10pt)[*HỘI ĐỒNG KIỂM DUYỆT & PHÁP LÝ*] \
    #line(length: 40%, stroke: 0.6pt)
    #v(2pt)
    #text(size: 9.5pt)[Số: 04/2026/QC-SYNAPES/PD-MTTN]
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
  #text(size: 14pt, weight: "bold")[QUY CHẾ PHÊ DUYỆT KIỂM SOÁT NỘI DUNG SỐ]\
  #v(2pt)
  #text(size: 12pt, weight: "bold")[VÀ ĐIỀU KHOẢN MIỄN TRỪ TRÁCH NHIỆM PHÁP LÝ LIÊN QUAN]\
  #text(size: 10pt, style: "italic")[(Tuân thủ Luật An ninh mạng 2018 và Nghị định số 147/2024/NĐ-CP)]
]

#v(12pt)

// Căn cứ pháp lý
#block(
  fill: rgb("#f8f9fa"),
  inset: 10pt,
  radius: 4pt,
  stroke: 0.5pt + rgb("#e9ecef")
)[
  #text(weight: "bold")[CĂN CỨ PHÁP LÝ THI HÀNH VÀ GIỚI HẠN TRÁCH NHIỆM:]
  #set par(first-line-indent: 0pt, leading: 0.65em)
  - _Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24 tháng 11 năm 2015 về trách nhiệm bồi thường thiệt hại;_
  - _Căn cứ Luật An ninh mạng số 24/2018/QH14 ngày 12 tháng 06 năm 2018 (Điều 8, Điều 16 về các hành vi bị cấm);_
  - _Căn cứ Luật Báo chí số 103/2016/QH13 ngày 05 tháng 04 năm 2016 của Quốc hội;_
  - _Căn cứ Nghị định số 72/2013/NĐ-CP và Nghị định số 27/2018/NĐ-CP của Chính phủ về quản lý, cung cấp, sử dụng dịch vụ Internet và thông tin trên mạng;_
  - _Căn cứ Nghị định số 147/2024/NĐ-CP ngày 09 tháng 11 năm 2024 của Chính phủ về quản lý, cung cấp, sử dụng dịch vụ Internet và thông tin trên mạng (quy định trách nhiệm của người sử dụng mạng xã hội);_
  - _Căn cứ Điều khoản dịch vụ và Chính sách cộng đồng của Google LLC (YouTube), Meta Platforms Inc. (Facebook) và Bytedance Ltd. (TikTok)._
]

#v(10pt)

#text(weight: "bold", size: 12pt)[Điều 1. Nguyên lý vận hành Human-In-The-Loop (Con người giám sát và phê duyệt)]

1. Hệ thống phần mềm SYNAPES Auto Tool hoạt động theo cơ chế trợ lý công nghệ thông minh với nguyên tắc cốt lõi: *Trí tuệ nhân tạo (AI) chỉ giữ vai trò hỗ trợ khởi tạo bản thảo; Con người (Khách Hàng) giữ quyền kiểm soát và phê duyệt tối cao.*

2. Hệ thống thiết lập quy trình bắt buộc:
- Mọi video do AI tạo dựng kịch bản và ghép nối đều được giữ ở trạng thái chờ duyệt (Pending Review);
- Người Sử Dụng bắt buộc phải tự mình xem xét, nghe thử, kiểm tra thông điệp trên bảng điều khiển Studio;
- Hệ thống chỉ thực hiện lệnh đẩy video lên các mạng xã hội khi và chỉ khi Người Sử Dụng chủ động nhấn nút *"Phê duyệt & Đăng ngay"* hoặc thiết lập lịch đăng tải cụ thể.

#v(8pt)
#text(weight: "bold", size: 12pt)[Điều 2. Phân định trách nhiệm đối với nội dung phát tán trên mạng xã hội]

1. Căn cứ Điều 16 Luật An ninh mạng năm 2018 và Điều 36 Nghị định 147/2024/NĐ-CP, Khách Hàng là chủ thể đứng tên tài khoản mạng xã hội và là người trực tiếp ra lệnh phát sóng, do đó Khách Hàng chịu trách nhiệm pháp lý độc lập, duy nhất và tối hậu trước pháp luật về tính chính xác, tính hợp pháp và các hệ quả truyền thông từ video được phát tán.

2. Bên Cung Cấp SYNAPES là đơn vị cung cấp hạ tầng công nghệ kỹ thuật trung gian thuần túy (Intermediary Service Provider), không tham gia vào công tác định hướng dư luận, không can thiệp nội dung kịch bản mang tính cá nhân của Khách Hàng và được miễn trừ hoàn toàn trách nhiệm liên đới đối với mọi phát ngôn, hình ảnh hoặc tranh chấp phát sinh từ nội dung do Khách Hàng phê duyệt phát hành.

#v(8pt)
#text(weight: "bold", size: 12pt)[Điều 3. Các hành vi nghiêm cấm tuyệt đối trên hệ thống]

Khách Hàng cam kết tuyệt đối *KHÔNG* sử dụng hệ thống phần mềm SYNAPES Auto Tool để tạo dựng, sản xuất hoặc hỗ trợ phát tán các nội dung sau:
- Tuyên truyền chống phá Nhà nước, xâm phạm an ninh quốc gia, trật tự an toàn xã hội theo Điều 8 Luật An ninh mạng 2018;
- Kích động chiến tranh, khủng bố, hận thù dân tộc, kỳ thị tôn giáo hoặc bạo lực;
- Xúc phạm uy tín, danh dự, nhân phẩm của tổ chức, cá nhân hoặc vu khống, thông tin sai sự thật (fake news);
- Nội dung khiêu dâm, đồi trụy hoặc các hình thức cờ bạc, cá độ trái phép bị pháp luật nghiêm cấm;
- Giả mạo cơ quan nhà nước, tổ chức hoặc cá nhân khác nhằm mục đích trục lợi hoặc lừa đảo.

#v(8pt)
#text(weight: "bold", size: 12pt)[Điều 4. Miễn trừ trách nhiệm về chính sách API và tài khoản bên thứ ba]

1. Bên Cung Cấp SYNAPES không chịu trách nhiệm bồi thường trong các tình huống sau:
- Tài khoản YouTube, TikTok hoặc Facebook của Khách Hàng bị hạn chế, cảnh cáo (strike) hoặc vô hiệu hóa do chính sách thuật toán độc lập của các nền tảng mạng xã hội hoặc do vi phạm tiêu chuẩn cộng đồng mà Khách Hàng đã gây ra trong quá khứ;
- Sự cố gián đoạn kết nối bắt nguồn từ việc nền tảng thứ ba (Google, Meta, TikTok) thay đổi đột ngột chính sách API, thời gian bảo trì máy chủ toàn cầu của đối tác hoặc sự cố gián đoạn đường truyền cáp quang biển quốc tế;
- Rủi ro mất mát dữ liệu do Khách Hàng tự ý chia sẻ thông tin đăng nhập hoặc để lộ máy tính cho bên thứ ba sử dụng trái phép.

#v(8pt)
#text(weight: "bold", size: 12pt)[Điều 5. Cam kết mức độ dịch vụ (SLA) và giới hạn trách nhiệm tài chính]

1. Bên Cung Cấp cam kết thời gian hoạt động ổn định của phần mềm đạt tỷ lệ 99,5% (SLA Uptime). Đội ngũ kỹ thuật trực vận hành sẵn sàng tiếp nhận và phản hồi các thắc mắc kỹ thuật trong vòng 02 (hai) giờ làm việc.

2. Trong mọi trường hợp phát sinh tranh chấp hoặc khiếu nại về trách nhiệm bồi thường thiệt hại (nếu có căn cứ xác định lỗi hoàn toàn do lỗi kỹ thuật nghiêm trọng từ Bên Cung Cấp), mức bồi thường thiệt hại tối đa sẽ không vượt quá tổng số tiền phí dịch vụ mà Khách Hàng đã thanh toán thực tế cho Bên Cung Cấp trong 01 (một) tháng gần nhất trước thời điểm xảy ra sự cố.

#v(20pt)

// Chữ ký xác thực
#grid(
  columns: (50%, 50%),
  align: (left, center),
  [
    #text(weight: "bold")[*NƠI NHẬN:*]\
    #set text(size: 10pt)
    #set par(first-line-indent: 0pt, leading: 0.5em)
    - Cơ quan quản lý truyền thông số (để phối hợp);\
    - Khách hàng và người sử dụng dịch vụ;\
    - Đội ngũ Vận hành & Giám sát API;\
    - Lưu: Hồ sơ miễn trừ pháp lý số 04/2026.
  ],
  [
    #text(weight: "bold")[CHỦ TỊCH HỘI ĐỒNG PHÁP CHẾ SYNAPES]\
    #text(size: 10pt, style: "italic")[(Đã thẩm định và ban hành trên toàn hệ thống)]\
    #v(35pt)
    #text(weight: "bold", size: 11pt)[BAN ĐIỀU HÀNH & KIỂM DUYỆT CÔNG NGHỆ]
  ]
)
