# AutoVideo AI WebApp - Hệ Thống Đăng Tải Video Đa Nền Tảng (YouTube, TikTok, Facebook)

Hệ thống quản lý sản xuất và xuất bản video tự động hóa bằng AI, kết hợp kiểm duyệt cuối cùng (Human-in-the-loop), ghép nối timeline nhiều clip (5–10 phút), tối ưu khung giờ vàng và sao lưu Google Drive.

---

## 🚀 Hướng Dẫn Khởi Động Nhanh

### Cách 1: Khởi Động Nhanh Siêu Tốc (Khuyên Dùng cho Người Dùng)
- Nhấp đúp chuột vào tệp `start.bat` trong thư mục `c:\Users\84364\autovideo-webapp`.
- Hệ thống tự động biên dịch và kích hoạt máy chủ Production tối ưu hóa trên cổng **`http://localhost:10000`**.
- Thời gian tải trang phản hồi cực nhanh (< 10ms) nhờ cơ chế nén Gzip, In-memory RAM Cache và ETag 304.

### Cách 2: Chế Độ Nhà Phát Triển (Dành cho Lập Trình Viên)
- Nhấp đúp chuột vào tệp `dev.bat` hoặc chạy lệnh:
```bash
cd c:\Users\84364\autovideo-webapp
npm run dev
```
- Truy cập tại `http://localhost:5173` để sửa code và hot-reload trực tiếp.

---

## 🔑 Tài Khoản Đăng Nhập & Cơ Chế Quản Lý

Hệ thống hoạt động theo cơ chế **Mã Code được cấp kèm mật khẩu mặc định**.
Bảng Google Sheet của Kỹ Sư được tích hợp trực tiếp để quản trị và cấp lại mật khẩu.

| Mã Code | Tên Khách Hàng | Gmail Đăng Ký | Mật Khẩu Mặc Định / Tạm | Trạng Thái Tài Khoản |
| :--- | :--- | :--- | :--- | :--- |
| `VIP-001` | Nguyễn Văn A (Tech Reviewer) | `nguyenhoangthien.hvt.15@gmail.com` | `AutoPass@8912` | 🟢 Khách đã đổi pass riêng |
| `VIP-002` | Trần Thị B (Shop Mỹ Phẩm B) | `shopb.cosmetics@gmail.com` | `Reset#4421` | 🟡 Vừa cấp lại pass (Chưa login) |
| `VIP-003` | Lê Hoàng Nam (Agency Truyền Thông) | `nam.le@agency.vn` | `Start@2026` | 🟢 Khách đã đổi pass riêng |

> 💡 **Tính năng "Bạn quên mật khẩu?":**
> Khách bấm nút *"Bạn quên mật khẩu?"* $\rightarrow$ Hệ thống tự sinh mật khẩu tạm `Auto-XXXXXX`, gửi thư về Gmail của khách và cập nhật lên Google Sheet cho Kỹ Sư. Khi khách đăng nhập, hệ thống bắt buộc đổi mật khẩu riêng (mật khẩu này được hash an toàn, không hiển thị trên Sheet).

---

## 🌟 Các Phân Hệ Tính Năng Cốt Lõi Đã Triển Khai

1. **Cửa Sổ 1: Trình Duyệt Dự Án (Split-View Workspace)**
   - **Cột Trái (Media Stage):** Video Player chuyển đổi tỷ lệ 16:9 (YouTube) & 9:16 (TikTok/Reels), chế độ Mockup giả lập giao diện TikTok/YouTube.
   - **Cột Phải (Project Inspector):** Kịch bản Storyboard phân cảnh (cho phép sửa trực tiếp lời thoại), Thông tin bài đăng, gợi ý Thẻ Tag, ô gắn Link sản phẩm/Affiliate Bio, chọn kênh đăng (YouTube, TikTok, Facebook).
   - **Thanh Hành Động Duyệt:** `[ ✅ PHÊ DUYỆT & ĐĂNG NGAY ]`, `[ 🕒 Đăng theo Khung Giờ Vàng (19:30) ]`, `[ ✏️ Yêu cầu AI sửa lại ]`.
   - **Tiến trình xuất bản:** Mô phỏng đẩy API YouTube, TikTok Direct Post và sao lưu tự động vào Google Drive (`Drive/Du_An_Video/2026/11/Ten_Video.mp4`).

2. **Cửa Sổ 2: Multi-Clip Video Stitcher Studio (Ghép nối 5–10 phút chuẩn YouTube)**
   - Nối kết hợp nhiều clip ngắn (8–10 giây) thành video dài 5–10 phút.
   - **Đồng hồ đo thời lượng thông minh:**
     - `< 5 phút`: ⚠️ Báo vàng chưa đạt chuẩn video dài YouTube.
     - `5 - 10 phút`: 🟢 Báo xanh đạt chuẩn hoàn hảo YouTube.
     - `> 10 phút`: 🛑 Báo đỏ vượt quá giới hạn tối đa 10 phút.
   - **Timeline kéo thả:** Sắp xếp thứ tự clip, chọn hiệu ứng chuyển cảnh (Fade, Cut, Dissolve), nạp clip từ kịch bản, dán link ngoài hoặc tải từ máy.
   - **Rãnh Master Audio:** Mix giọng đọc lồng tiếng và nhạc nền BGM (15-20% volume).

3. **Kiến Trúc AI Động Cơ Kép (Dual-Engine)**
   - **Lựa chọn 1 (Gemini Native Engine):** Dùng API Key của Google Gemini 2.0 Flash / 1.5 Pro để trọn gói viết kịch bản, lồng tiếng Google TTS và tự động ghép MP4.
   - **Lựa chọn 2 (Custom Plugin URL):** Kết nối qua Webhook URL của Kling AI, Runway Gen-3 hoặc Server riêng của khách với cơ chế ánh xạ Payload JSON.

4. **Hệ Thống Kho Skills & Prompt Mẫu**
   - Hỗ trợ gọi nhanh qua cú pháp lệnh `/tech-review`, `/daily-news`, `/product-sales`, `/storytelling`.
   - Cho phép tải lên file cấu hình Skill (.json) và tự tạo Skill thủ công.

5. **Chân Trang (Footer) 4 Cột & Nút Liên Hệ Nhà Phát Triển**
   - **Cột 1:** Tổng đài hỗ trợ kỹ thuật, hotline kỹ sư, Zalo OA trực 08:00 - 22:00.
   - **Cột 2:** Điều khoản dịch vụ, Chính sách bảo mật Token AES-256, Bản quyền nội dung AI, Quy định miễn trừ.
   - **Cột 3:** Hệ sinh thái tích hợp (Google Gemini, YouTube API v3, TikTok Direct Post, Meta Reels API, Kling AI).
   - **Cột 4:** Bản quyền chính thức (Badge DMCA Protected, Đã công chứng pháp lý, Thông báo Bộ Công Thương).
   - **Nút "LIÊN HỆ NHÀ PHÁT TRIỂN":** Mở trực tiếp trình soạn thư Gmail gửi đến `nguyenhoangthien.hvt.15@gmail.com` với tiêu đề `LIÊN HỆ NHÀ PHÁT TRIỂN`.
