# HƯỚNG DẪN KÍCH HOẠT TỰ ĐỘNG GHI GOOGLE SHEET & GỬI GMAIL (SYNAPES STUDIO)

Bảng tính quản trị: [Google Sheet SYNAPES Studio](https://docs.google.com/spreadsheets/d/1E9zec8lX52-ofleS0MG-oRSc8k_hK9aBtC1XBaqNafY/edit?usp=sharing)

---

## Bước 1: Dán mã nguồn & Cấp quyền gửi Gmail tự động khi tích Checkbox
1. Mở Google Sheet trên trình duyệt, trên thanh menu chọn **Tiện ích mở rộng (Extensions)** ➔ **Apps Script**.
2. Xóa toàn bộ mã cũ trong tệp `Code.gs` và dán toàn bộ nội dung từ tệp [`Code.js`](./Code.js) vào.
3. Nhấn **Ctrl + S** (hoặc biểu tượng đĩa mềm 💾) để lưu.
4. Tại thanh công cụ phía trên, đảm bảo hàm đang chọn là **`setupUserRegistrationSheet`** (hàm đầu tiên mặc định), sau đó nhấn nút **▶ Chạy (Run)**.
5. Khi bảng cấp quyền của Google hiện ra:
   - Nhấn **Xem lại quyền (Review permissions)** ➔ Chọn tài khoản Gmail của Kỹ sư.
   - Nhấn **Nâng cao (Advanced)** ➔ **Đi tới ... (không an toàn)** ➔ Nhấn **Cho phép (Allow)**.
6. Sau khi chạy xong, hệ thống sẽ tự động:
   - Làm sạch các dòng trống thừa trên trang tính **`THÔNG TIN NGƯỜI DÙNG`** để dữ liệu mới luôn ghi chuẩn từ **Dòng 2**.
   - Tự động cài đặt **Installable Trigger (`onInstallableEdit`)** để ngay khi Kỹ sư tích chọn Checkbox ở **Cột I (Duyệt Cấp Tài Khoản)**, hệ thống tự động sinh Mã Code (`SNP_YYMMDD + DDMM`), Mật khẩu (`SNP_3số3chữ`), đồng bộ sang trang **`Quản Lý Mật Khẩu`** và gửi **Gmail kèm bản mềm Hợp đồng PDF có dấu đỏ** cho khách hàng.

---

## Bước 2: Triển khai Web App để WebApp tự động ghi dữ liệu đăng ký lên Sheet
1. Tại góc trên bên phải cửa sổ **Apps Script**, nhấn nút **Triển khai (Deploy)** ➔ **Triển khai mới (New deployment)**.
2. Nhấn biểu tượng bánh răng ⚙️ bên cạnh "Chọn loại" ➔ Chọn **Ứng dụng web (Web app)**.
3. Cấu hình như sau:
   - **Thực thi dưới dạng (Execute as):** *Tôi (Me)*.
   - **Ai có quyền truy cập (Who has access):** Chọn **Bất kỳ ai (Anyone)**.
4. Nhấn **Triển khai (Deploy)** và sao chép đường dẫn **URL ứng dụng web** (có dạng `https://script.google.com/macros/s/.../exec`).
5. Quay lại bảng tính Google Sheet, trên thanh menu bấm **`🚀 SYNAPES Studio`** ➔ **`🔗 2. Gắn Link Web App`** và dán URL vừa sao chép vào (hoặc bấm lại nút **▶ Chạy** hàm `setupUserRegistrationSheet` một lần nữa để hệ thống tự động gắn URL vào Sheet).
   - Ngay khi URL được lưu trên Sheet, WebApp `https://synapes-auto-tool.onrender.com` sẽ **tự động phát hiện URL này** và đẩy toàn bộ thông tin người dùng đăng ký (ở cả Bước 1 "Tiếp tục" và Bước 2 "Ký hợp đồng") cùng tính năng "Quên mật khẩu" trực tiếp lên Google Sheet & gửi Gmail tự động!
