# HƯỚNG DẪN CÀI ĐẶT HỆ THỐNG DUYỆT TỰ ĐỘNG & GỬI HỢP ĐỒNG TRÊN GOOGLE SHEET

Hệ thống cung cấp cơ chế **tự động duyệt cấp tài khoản**, tự động sinh **Mã Code** (`SNP_...`), **Mật khẩu**, và gửi **Gmail kèm bản mềm Hợp đồng PDF** khi Kỹ sư / Dev tích duyệt trên Google Sheet.

Trang tính mục tiêu: [https://docs.google.com/spreadsheets/d/1E9zec8lX52-ofleS0MG-oRSc8k_hK9aBtC1XBaqNafY/edit](https://docs.google.com/spreadsheets/d/1E9zec8lX52-ofleS0MG-oRSc8k_hK9aBtC1XBaqNafY/edit)

---

### Bước 1: Mở trình soạn thảo Google Apps Script
1. Mở trang Google Sheet trên trình duyệt của bạn.
2. Trên thanh menu trên cùng của Google Sheet, bấm vào:
   👉 **Tiện ích mở rộng** (Extensions) ➔ Chọn **Apps Script**.

---

### Bước 2: Dán mã Apps Script mới nhất
1. Mở tệp `Code.gs` trong Apps Script.
2. Sao chép và dán toàn bộ đoạn mã trong tệp `google-apps-script/Code.js` vào đây.
3. Bấm biểu tượng 💾 **Lưu dự án** (Save project) hoặc nhấn tổ hợp phím `Ctrl + S`.

---

### Bước 3: Cấp quyền chạy & Tạo menu
1. Tại thanh công cụ phía trên trong Apps Script, chọn hàm `onOpen` và bấm nút ▶️ **Chạy** (Run).
2. Google sẽ hiện hộp thoại *"Yêu cầu cấp quyền"* (Authorization Required) ➔ Bấm **Xem lại quyền** (Review Permissions).
3. Chọn tài khoản Google của bạn ➔ Bấm **Nâng cao** (Advanced) ➔ Bấm **Đi tới Dự án (không an toàn)** ➔ Bấm **Cho phép** (Allow).
*(Quyền này cần thiết để Apps Script có thể gửi email qua Gmail và thao tác trên Sheet).*

---

### Bước 4: Khởi tạo trang "Thông tin người dùng"
1. Quay lại trang Google Sheet và tải lại trang (nhấn **F5**).
2. Bạn sẽ thấy menu mới **"🚀 SYNAPES Studio"** trên thanh công cụ.
3. Bấm vào menu **🚀 SYNAPES Studio** ➔ Chọn **📋 Khởi tạo & Trang trí trang "Thông tin người dùng"**.
4. Hệ thống sẽ tự động tạo một trang tính đẹp mắt với:
   * 13 cột thông tin chuẩn nhận diện pháp lý.
   * **Cột I có nút tích chọn (Checkbox) duyệt cấp tài khoản**.
   * Cột J (Mã Code) & Cột K (Mật khẩu) tự động điền khi Kỹ sư tích duyệt.
   * Cột L ghi nhận lịch sử gửi Gmail tự động kèm file Hợp đồng PDF.

---

### Bước 5: Cách thức hoạt động khi có khách đăng ký mới
* Khi khách hàng hoàn tất đăng ký trên WebApp, thông tin sẽ được tự động ghi nhận vào trang **"Thông tin người dùng"**.
* Khi Kỹ sư / Dev bấm **tích chọn vào ô Checkbox ở Cột I**:
  1. Hệ thống tự động tạo **Mã Code Khách Hàng**: dạng `SNP_[6 số YYMMDD + 4 số ngày tháng sinh khách hàng]`.
  2. Hệ thống tự động tạo **Mật Khẩu**: dạng `SNP_[3 số + 3 chữ cái ngẫu nhiên]`.
  3. Hệ thống tự động tạo file **Hợp đồng điện tử PDF hoàn chỉnh** (kèm đầy đủ thông tin hai bên, 4 điều khoản pháp lý và chữ ký, con dấu đỏ của Trưởng ban KS Nguyễn Hoàng Thiện).
  4. Hệ thống tự động gửi **Gmail** chứa Mã Code, Mật khẩu và đính kèm file Hợp đồng PDF đến Gmail khách hàng đã đăng ký.
  5. Cập nhật trạng thái Cột L: `✅ ĐÃ GỬI GMAIL (Thời gian: ...)`.
