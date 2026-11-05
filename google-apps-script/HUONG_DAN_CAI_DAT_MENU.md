# HƯỚNG DẪN CÀI ĐẶT MENU ĐỒNG BỘ TRÊN GOOGLE SHEET

Để thêm menu **"🚀 SYNAPES Auto Tool"** trực tiếp lên giao diện Google Sheet của bạn (với tính năng cập nhật thông tin lên web ngay, tự động sinh mật khẩu và gửi Gmail), bạn chỉ cần làm theo 4 bước sau:

---

### Bước 1: Mở trình soạn thảo Google Apps Script trên Sheet
1. Mở trang Google Sheet của bạn: [https://docs.google.com/spreadsheets/d/1E9zec8lX52-ofleS0MG-oRSc8k_hK9aBtC1XBaqNafY/edit](https://docs.google.com/spreadsheets/d/1E9zec8lX52-ofleS0MG-oRSc8k_hK9aBtC1XBaqNafY/edit)
2. Trên thanh menu trên cùng của Google Sheet, bấm vào:
   👉 **Tiện ích mở rộng** (Extensions) ➔ Chọn **Apps Script**.

---

### Bước 2: Dán mã Apps Script
1. Xóa toàn bộ nội dung mẫu đang có trong tệp `Code.gs`.
2. Sao chép và dán toàn bộ đoạn mã trong tệp `google-apps-script/Code.js` vào đây.
3. Bấm biểu tượng 💾 **Lưu dự án** (Save project) hoặc nhấn tổ hợp phím `Ctrl + S`.

---

### Bước 3: Cấp quyền chạy lần đầu
1. Tại thanh công cụ phía trên trong Apps Script, chọn hàm `onOpen` và bấm nút ▶️ **Chạy** (Run).
2. Google sẽ hiện hộp thoại *"Yêu cầu cấp quyền"* (Authorization Required) ➔ Bấm **Xem lại quyền** (Review Permissions).
3. Chọn tài khoản Google của bạn ➔ Bấm **Nâng cao** (Advanced) ➔ Bấm **Đi tới Dự án không tên (không an toàn)** ➔ Bấm **Cho phép** (Allow).
*(Đây là bước tiêu chuẩn của Google khi tự viết script nội bộ cho bảng tính của chính mình).*

---

### Bước 4: Tận hưởng kết quả
1. Quay lại trang Google Sheet và tải lại trang (nhấn **F5**).
2. Bạn sẽ thấy một menu mới xuất hiện ngay cạnh menu "Trợ giúp" có tên:
   **🚀 SYNAPES Auto Tool**
   * 🔄 **Cập nhật dữ liệu lên WebApp ngay**: Xác nhận trạng thái đồng bộ thời gian thực với website.
   * 🔑 **Tạo mật khẩu ngẫu nhiên cho dòng đang chọn**: Tự động tạo pass `Auto-XXXXXX` và ghi thời gian cấp.
   * 📧 **Gửi email mật khẩu cho khách qua Gmail**: Gửi thông tin tài khoản đến Gmail của khách bằng 1 click.
   * 🌐 **Mở WebApp Studio**: Mở nhanh website hệ thống.
