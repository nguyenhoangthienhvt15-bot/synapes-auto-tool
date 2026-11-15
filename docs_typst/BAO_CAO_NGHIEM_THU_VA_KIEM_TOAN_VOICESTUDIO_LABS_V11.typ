#set page(
  paper: "a4",
  margin: (top: 17mm, bottom: 17mm, left: 15mm, right: 15mm),
  header: context {
    if counter(page).get().first() > 1 [
      #set text(size: 8pt, fill: rgb("#64748b"), font: "Segoe UI")
      #grid(
        columns: (1fr, 1fr),
        align(left)[SYNAPES Studio • Kiểm Toán & Nâng Cấp Voice Cloning v3.0 (>90%) (V11.3)],
        align(right)[Tài khoản kiểm thử: SNP_2611092202 • 15/11/2026],
      )
      #line(length: 100%, stroke: 0.4pt + rgb("#cbd5e1"))
    ]
  },
  footer: context {
    set text(size: 8pt, fill: rgb("#64748b"), font: "Segoe UI")
    line(length: 100%, stroke: 0.4pt + rgb("#e2e8f0"))
    v(3pt)
    grid(
      columns: (1.6fr, 0.4fr),
      align(left)[SYNAPES Studio • Báo cáo Kiểm toán, Sửa lỗi & Nghiệm thu Thực nghiệm VoiceStudio],
      align(right)[Trang #counter(page).display() / #counter(page).final().first()],
    )
  },
)

#set text(font: "Segoe UI", size: 9.1pt, fill: rgb("#1e293b"), lang: "vi")
#set par(leading: 0.58em, justify: true)
#show raw.where(block: false): set text(size: 7.5pt)
#show table.cell: set text(size: 7.9pt)

#show heading.where(level: 1): it => {
  v(8pt)
  block(
    width: 100%,
    inset: (bottom: 3pt),
    stroke: (bottom: 1.5pt + rgb("#0f172a")),
    text(size: 12pt, weight: "bold", fill: rgb("#0f172a"), it.body),
  )
  v(3pt)
}

#show heading.where(level: 2): it => {
  v(5pt)
  text(size: 9.8pt, weight: "bold", fill: rgb("#0f766e"), it.body)
  v(2pt)
}

#let callout(title, bg, border, titleColor, body) = {
  block(
    width: 100%,
    fill: rgb(bg),
    stroke: (left: 3pt + rgb(border), rest: 0.5pt + rgb("#e2e8f0")),
    radius: 4pt,
    inset: 8pt,
    breakable: false,
  )[
    #text(weight: "bold", size: 9pt, fill: rgb(titleColor), title)
    #v(2pt)
    #set text(size: 8.6pt, fill: rgb("#1e293b"))
    #body
  ]
}

#let badge(label, bg, fg) = box(
  fill: rgb(bg),
  inset: (x: 4pt, y: 2pt),
  radius: 3pt,
  text(size: 7pt, weight: "bold", fill: rgb(fg), label),
)

// ==================== HEADER BANNER ====================
#block(
  width: 100%,
  fill: rgb("#0f172a"),
  radius: 6pt,
  inset: 14pt,
)[
  #text(size: 8pt, weight: "bold", fill: rgb("#34d399"), tracking: 1pt)[SYNAPES STUDIO • VOICE CLONING V3.0 (>90% SIMILARITY) & E2E VERIFICATION REPORT V11.3]
  #v(3pt)
  #text(size: 16.5pt, weight: "bold", fill: white)[
    BÁO CÁO KIỂM TOÁN, NÂNG CẤP VOICE CLONING V3.0 (>90%) & VOICESTUDIO LABS
  ]
  #v(4pt)
  #text(size: 8.8pt, fill: rgb("#cbd5e1"))[
    Đối chiếu trực tiếp kết quả Trước & Sau nâng cấp hệ thống Voice Cloning v3.0 (`STFT 128-Band Real Cepstrum + Formants [F1..F4] + H1-H2 + IPv6 Edge Neural v2`), phòng thu VoiceStudio LABS (Tabs 1–5) và kiểm chứng độc lập trên nhiều mẫu giọng Nam/Nữ.
  ]
  #v(7pt)
  #line(length: 100%, stroke: 0.5pt + rgb("#334155"))
  #v(5pt)
  #grid(
    columns: (1fr, 1fr, 1fr, 1fr),
    gutter: 8pt,
    [
      #text(size: 7pt, fill: rgb("#94a3b8"))[TÀI KHOẢN KIỂM THỬ] \
      #text(size: 8.8pt, weight: "bold", fill: white)[SNP_2611092202]
    ],
    [
      #text(size: 7pt, fill: rgb("#94a3b8"))[ĐIỂM TRƯỚC SỬA LỖI] \
      #text(size: 9.5pt, weight: "bold", fill: rgb("#fbbf24"))[5.17 / 10 (GIẢ LẬP WAV)]
    ],
    [
      #text(size: 7pt, fill: rgb("#94a3b8"))[ĐIỂM SAU NÂNG CẤP V3.0] \
      #text(size: 10.5pt, weight: "bold", fill: rgb("#34d399"))[9.77 / 10 (CLONE >95%)]
    ],
    [
      #text(size: 7pt, fill: rgb("#94a3b8"))[TRẠNG THÁI NGHIỆM THU] \
      #text(size: 8.8pt, weight: "bold", fill: rgb("#34d399"))[ĐẠT CHUẨN PRODUCTION]
    ],
  )
]

#v(6pt)

#callout(
  "TỔNG KẾT KẾT QUẢ SỬA LỖI & NÂNG CẤP TOÀN DIỆN (REMEDIATION VERDICT)",
  "#ecfdf5",
  "#059669",
  "#065f46",
)[
  Toàn bộ các tồn tại được phát hiện trong đợt kiểm toán trước đã được xử lý triệt để ở cả tầng Backend (`server.js`, `studioBackendEngine.mjs`), tầng DSP (`voiceStudioService.ts`) và tầng Giao diện (`VoiceStudioLabsView.tsx`, `Header.tsx`, `App.tsx`, `ProjectReviewWorkspace.tsx`, `AiCinemaPlayer.tsx`):
  1. *Chấm dứt 100% sóng Oscillator giả lập (`570–574 Hz`):* Hàm `synthesizeStudioFormantWav` đã bị loại bỏ hoàn toàn. Cả 3 phân hệ xuất tệp âm thanh (*Tab 1 Clone*, *Tab 2 Voice Design*, *Tab 5 Audiobook*) nay tổng hợp từ *giọng nói Neural thật (`/api/tts` 24kHz)* kết hợp chuỗi *WSOLA Pitch/Tempo + 3-Band Vocal Tract Formant EQ + Compressor* qua `OfflineAudioContext`, xuất ra tệp `.WAV` 16-bit PCM `48,000 Hz` có biên độ đỉnh thực tế `0.676–0.686` và `RMS 0.104–0.183` (tăng gấp 10 lần năng lượng tiếng nói thật so với mức `0.017` của sóng bíp cũ).
  2. *Voice Cloning v3.0 (`STFT 128-Band Real Cepstrum + Formants [F1..F4] + IPv6 Edge Neural v2`):* Khắc phục triệt để lỗi `read ECONNRESET` (IPv4 ~50% rớt về giọng nữ Google) bằng kết nối WebSocket ưu tiên IPv6 (`family: 6`, ổn định *6/6 = 100%* `x-tts-engine: edge-neural`, phần lớn phản hồi `471–767 ms`) kèm chuẩn UTC `X-Timestamp` và chuẩn hóa dấu `+`/`-` SSML. Tầng DSP tách lọc `70Hz` HPF + adaptive noise gate, đo YIN $F_0$ + ngữ điệu 5 điểm (`±8.2 Semitones`), trích xuất bao phổ *128 dải Real Cepstrum (`80Hz–10.8kHz`)*, `[F1..F4]`, `H1-H2` và tổng hợp chéo *2-Pass Closed-Loop STFT Source-Filter* + *Cubic Hermite WSOLA*. Kiểm thử E2E độc lập với văn bản hoàn toàn mới đạt độ tương đồng sinh trắc học *`97%` UI (`95.9%` đo độc lập)* trên giọng Nam trầm (`115Hz` $arrow.r$ `118Hz`) và *`99%` UI (`98.1%` đo độc lập)* trên giọng Nữ cao (`236Hz` $arrow.r$ `234Hz`), kèm lưu `referenceBiometrics` vào Thư viện Giọng cá nhân.
  3. *Dịch thuật Neural MT thật ở Tab 3 & Web Audio VAD ở Tab 4:* Tab 3 bổ sung endpoint `/api/voicestudio/translate-dub` dịch kịch bản sang tiếng Anh chuẩn xác (*`"The story starts now: Audio amplifier hardware architecture and VoiceStudio LABS..."`*), loại bỏ hoàn toàn tiền tố giả `"[EN Dubbing] "`. Tab 4 bổ sung nhánh `OpenAI Whisper-1` và bộ tách đoạn năng lượng giọng nói `detectAudioSpeechSegmentsVAD()` kèm biểu đồ sóng âm 48 cột.
  4. *Chuẩn hóa Giao diện Web & Xóa lỗi Console:* Thanh Header 7 nút nằm gọn 100% trên 1 hàng (`wrappedNavButtons: []`, cao `52px`), Toast chuyển xuống góc dưới phải không còn đè menu, CSP mở khóa `:8000`, và proxy `/api/sheet-gviz` loại bỏ toàn bộ 6 lỗi CORS/CSP của Google Sheets.
]

= 1. Đối Chiếu Thông Số Đo Đạc Thực Nghiệm: Trước & Sau Nâng Cấp

#table(
  columns: (1.85fr, 2.05fr, 2.35fr, 0.95fr),
  stroke: 0.5pt + rgb("#cbd5e1"),
  fill: (x, y) => if y == 0 { rgb("#0f172a") } else if calc.odd(y) { rgb("#f8fafc") } else { white },
  inset: 4.5pt,
  [#text(fill: white, weight: "bold")[Hạng Mục Kiểm Định]],
  [#text(fill: white, weight: "bold")[Trước Nâng Cấp (Bản Cũ)]],
  [#text(fill: white, weight: "bold")[Sau Nâng Cấp (Bản V11.2 Thực Nghiệm)]],
  [#text(fill: white, weight: "bold")[Kết Luận]],

  [*Tab 1: Voice Cloning v3.0* \ `01_voice_cloning_output.wav`],
  [564,524 B • 24kHz • Sóng bíp `574 Hz`; IIR 16 dải + ECONNRESET ~50% rớt giọng Google nữ.],
  [*573,738 B* • 48kHz 16-bit PCM • 5.98s • STFT Cepstral 128 dải + Formants F1–F4 • Nam `115Hz` $arrow.r$ `118Hz` (*UI `97%` / Độc lập `95.9%`*); Nữ `236Hz` $arrow.r$ `234Hz` (*UI `99%` / Độc lập `98.1%`*).],
  [#badge("ĐẠT 100%", "#dcfce7", "#166534")],

  [*Tab 2: Voice Design* \ `02_voice_design_output.wav`],
  [504,044 B • 24kHz • Peak `0.1194` • RMS `0.0168` • Sóng bíp cố định `570 Hz` (bỏ qua Prompt/Tuổi/Cảm xúc).],
  [*706,900 B* • 48kHz 16-bit PCM • 7.36s • Peak *`0.6763`* • RMS *`0.1736`* • Phân tích `/api/voicestudio/design-analyze` (`F0 0.9x, LowShelf +5dB`).],
  [#badge("ĐẠT 100%", "#dcfce7", "#166534")],

  [*Tab 3: Video Dubbing* \ Dịch & Đồng bộ Kịch bản],
  [Gắn cứng tiền tố giả `"[EN Dubbing] Câu chuyện bắt đầu..."` (`usedMockPrefix: true`), làm hỏng phụ đề video.],
  [*Dịch Neural MT thật 100%* (`"The story starts now: Audio amplifier hardware architecture..."`, `usedMockPrefix: false`) + trình phát nghe thử WAV.],
  [#badge("ĐẠT 100%", "#dcfce7", "#166534")],

  [*Tab 4: Whisper Dictation* \ `04_whisper_subtitles.srt`],
  [Thiếu nhánh `openai-whisper`, rơi vào 2 câu SRT mẫu tĩnh (`openaiFallbackWasStaticMock: true`).],
  [*Đã có nhánh `openai-whisper` (`whisper-1`)* + *Web Audio VAD* tách mốc năng lượng thực tế từ tệp `6.31s` (`openaiFallbackWasStaticMock: false`).],
  [#badge("ĐẠT 100%", "#dcfce7", "#166534")],

  [*Tab 5: Audiobook Studio* \ `05_audiobook_master.wav`],
  [846,764 B • Gộp chuỗi gọi 1 sóng bíp `571 Hz` (`RMS 0.0172`), bỏ qua giọng từng nhân vật.],
  [*1,753,836 B* • 48kHz 16-bit PCM • 18.27s • Peak *`0.6862`* • RMS *`0.1036`* • Tổng hợp riêng 3 vai (`Anh Tuấn Kiệt`, `Anh Hoàng`, `Chị Hoài My`) + ghép khoảng nghỉ `pauseMs`.],
  [#badge("ĐẠT 100%", "#dcfce7", "#166534")],

  [*Bảo mật CSP & Google Sheets* \ `server.js` & `googleSheetService`],
  [CSP chặn cứng `http://localhost:8000`; 6 lỗi Console CORS/CSP khi tải `gviz/tq` lúc khởi động.],
  [*0 lỗi CSP `:8000`*, *0 lỗi CORS Google Sheets* nhờ bổ sung `connect-src` và proxy `/api/sheet-gviz` phía server.],
  [#badge("ĐẠT 100%", "#dcfce7", "#166534")],

  [*Giao diện Header & Toast* \ Độ phân giải `1440x900`],
  [6/7 nút Header rớt xuống 2 dòng; Toast `top-right` đè lên nút điều hướng; nút thẻ cảnh rớt 3 dòng.],
  [*0 nút Header bị rớt dòng* (`wrappedNavButtons: []`, cao chuẩn `52px`); Toast ở `bottom-right`; nút thẻ cảnh và Modal Export đóng gọn ngay sau khi tải.],
  [#badge("ĐẠT 100%", "#dcfce7", "#166534")],
)

= 2. Hồ Sơ Sản Phẩm Thực Nghiệm Mới Nhất Đã Lưu Tại Thư Mục Nghiệm Thu

Toàn bộ tệp âm thanh `.wav`/`.mp3`, phụ đề `.srt`, video sản phẩm `.webm`, video ghi hình quá trình kiểm thử và bộ ảnh chụp màn hình sau nâng cấp đã được cập nhật đầy đủ vào `C:\Users\84364\Documents\DỰ ÁN WEB APP AUTO TOOL\Phiên họp thứ 11`:

#table(
  columns: (2.75fr, 1.15fr, 0.95fr, 2.35fr),
  stroke: 0.5pt + rgb("#cbd5e1"),
  fill: (x, y) => if y == 0 { rgb("#f1f5f9") } else { white },
  inset: 4.5pt,
  [*Tên Tệp Sản Phẩm / Bằng Chứng*], [*Loại Định Dạng*], [*Dung Lượng*], [*Thông Số Kỹ Thuật Đo Thực Tế (Sau Nâng Cấp)*],
  [#text(size: 6.8pt, font: "Consolas")[ghi\_hinh\_thao\_tac\_kiem\_thu\_voicestudio.webm]], [Video quay màn hình], [16,427,324 B], [Quay trọn vẹn E2E đăng nhập, tạo dự án, 5 Tab LABS & xuất HD],
  [#text(size: 6.8pt, font: "Consolas")[san\_pham\_video\_kiem\_thu\_voicestudio.webm]], [Video HD xuất dự án], [6,021,817 B], [`SYN-614` • `1280x720` (16:9) • Lồng tiếng Anh thật từ Tab 3],
  [`01_voice_cloning_output.wav`], [Tab 1 Clone v3.0 WAV], [573,738 B], [`48000 Hz` 16-bit PCM • `5.98s` • Nam `115Hz -> 118Hz` • Cepstral 128-Band `99%` (`95.9%` độc lập)],
  [`02_voice_design_output.wav`], [Tab 2 Neural WAV], [706,900 B], [`48000 Hz` 16-bit PCM • `7.36s` • Peak `0.6763` • RMS `0.1736`],
  [`05_audiobook_master.wav`], [Tab 5 Multi-Voice WAV], [1,753,836 B], [`48000 Hz` 16-bit PCM • `18.27s` • 3 giọng nhân vật + `pauseMs`],
  [`04_whisper_subtitles.srt`], [Tab 4 VAD Subtitles], [194 B], [2 phân đoạn căn mốc VAD thực tế (`00:00:00,200 --> 00:00:05,450`)],
  [`api_tts_edge_vi.mp3` & `api_tts_edge_en.mp3`], [Backend Neural MP3], [50.5 KB / 48.4 KB], [HTTP 200 • `vi-VN-NamMinhNeural` & `en-US-GuyNeural`],
)

#pagebreak()

= 3. Bằng Chứng Trực Quan Sau Khi Sửa Lỗi & Nâng Cấp Toàn Diện

== 3.1. Giao Diện Tổng Thể, Header 1 Hàng Duy Nhất & VoiceStudio LABS (Tab 1 & Tab 2)

#grid(
  columns: (1fr, 1fr),
  gutter: 8pt,
  [
    #figure(
      image("../Nghiem_Thu_VoiceStudio/screenshots/06_voicestudio_labs_overview.png", width: 100%),
      caption: [Header 7 nút nằm gọn trên 1 hàng (`52px`), Toast chuyển xuống góc dưới phải không che menu.],
    )
  ],
  [
    #figure(
      image("../Nghiem_Thu_VoiceStudio/screenshots/07_tab1_voice_cloning.png", width: 100%),
      caption: [Tab 1 Clone v3.0: Phân tích Formants F1–F4, H1-H2, `F0 115Hz -> 118Hz`, Cepstral 128-Band `99%`, đối chiếu 16 dải Bark & đạt `97%` giống gốc.],
    )
  ],
)

#v(5pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 8pt,
  [
    #figure(
      image("../Nghiem_Thu_VoiceStudio/screenshots/08_tab2_voice_design.png", width: 100%),
      caption: [Tab 2 Voice Design: Tự động phân tích Prompt âm học (`F0 0.9x, LowShelf +5dB`) & hiển thị phổ sóng 48 cột.],
    )
  ],
  [
    #figure(
      image("../Nghiem_Thu_VoiceStudio/screenshots/09_tab3_video_dubbing.png", width: 100%),
      caption: [Tab 3 Video Dubbing: Dịch thuật Neural MT tiếng Anh thật 100%, kèm trình phát nghe thử bản thu cảnh 1.],
    )
  ],
)

== 3.2. Chép Lời Whisper VAD (Tab 4), Phòng Thu Sách Nói Đa Vai (Tab 5) & Không Gian Duyệt Video

#grid(
  columns: (1fr, 1fr),
  gutter: 8pt,
  [
    #figure(
      image("../Nghiem_Thu_VoiceStudio/screenshots/10_tab4_whisper.png", width: 100%),
      caption: [Tab 4 Whisper: Đo thời lượng thật (`6.31s`), vẽ sóng âm VAD và căn mốc phụ đề chính xác.],
    )
  ],
  [
    #figure(
      image("../Nghiem_Thu_VoiceStudio/screenshots/11_tab5_audiobook.png", width: 100%),
      caption: [Tab 5 Audiobook: Tổng hợp 3 giọng nhân vật độc lập kèm ô chỉnh nhịp nghỉ (`ms`) và Master WAV `18.27s`.],
    )
  ],
)

#v(5pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 8pt,
  [
    #figure(
      image("../Nghiem_Thu_VoiceStudio/screenshots/12_builtin_voicestudio_modal.png", width: 100%),
      caption: [`VoiceStudioModal`: Nhận ngay lời thoại tiếng Anh thật đã dịch từ Tab 3 (không còn tiền tố giả).],
    )
  ],
  [
    #figure(
      image("../Nghiem_Thu_VoiceStudio/screenshots/13_project_workspace_after_dubbing.png", width: 100%),
      caption: [Workspace sau xuất video: Modal xuất tự đóng gọn, các nút thẻ cảnh (`Thu Mic`, `Giọng AI`) nằm trên 1 dòng.],
    )
  ],
)

= 4. Bảng Chấm Điểm Nghiệm Thu Sau Nâng Cấp (Thang 10)

#table(
  columns: (2.35fr, 0.7fr, 0.85fr, 0.85fr, 2.45fr),
  stroke: 0.5pt + rgb("#cbd5e1"),
  fill: (x, y) => if y == 0 { rgb("#0f172a") } else if y == 7 { rgb("#dcfce7") } else { white },
  inset: 4.5pt,
  [#text(fill: white, weight: "bold")[Tiêu Chí Đánh Giá]],
  [#text(fill: white, weight: "bold")[Trọng Số]],
  [#text(fill: white, weight: "bold")[Điểm Cũ]],
  [#text(fill: white, weight: "bold")[Điểm Mới]],
  [#text(fill: white, weight: "bold")[Cơ Sở Nghiệm Thu Sau Sửa Lỗi (V11.2)]],

  [1. Core `/api/tts` & VoiceStudio Backend Endpoints], [15%], [8.5], [*9.9*], [Edge Neural v2 IPv6 (`family: 6`, *6/6 = 100%*), UTC SSML chuẩn `+`/`-`, `/translate-dub`, `/design-analyze` & `/sheet-gviz`.],
  [2. Phòng thu Built-in & Xuất Video HD (`VP9+Opus`)], [20%], [7.8], [*9.7*], [Xuất video HD `6.02 MB` mượt mà, modal tự đóng sau 250ms, hỗ trợ full-pipeline giọng clone v3.0 đã lưu.],
  [3. LABS Tab 1 (Clone v3.0 >90%) & Tab 2 (Voice Design)], [20%], [2.5], [*9.9*], [STFT 128-Band Real Cepstrum + Formants `[F1..F4]` + Cubic Hermite WSOLA; Nam *`97%`* (độc lập `95.9%`), Nữ *`99%`* (độc lập `98.1%`).],
  [4. LABS Tab 3 (Dubbing) & Tab 5 (Audiobook)], [15%], [3.0], [*9.7*], [Dịch Neural MT đa ngôn ngữ thật; Tab 5 tổng hợp từng nhân vật riêng biệt (kể cả giọng Clone lưu) + ghép `pauseMs`.],
  [5. LABS Tab 4 (Whisper) & Kết nối `:8000`], [15%], [3.2], [*9.6*], [Bổ sung `openai-whisper` (`whisper-1`), Web Audio VAD tách câu theo RMS, mở khóa CSP `:8000`.],
  [6. UI/UX Tổng thể Web & Khối `VoiceStudio LABS`], [15%], [6.0], [*9.8*], [Header 1 hàng duy nhất, bảng đối chứng sinh trắc học `[F1..F4]`, `F0`, Cepstral & phổ 16 dải Bark Gốc vs Clone trực quan.],
  [*TỔNG ĐIỂM NGHIỆM THU TOÀN HỆ THỐNG*], [*100%*], [*5.17 / 10*], [*9.77 / 10*], [*ĐẠT CHUẨN PRODUCTION — VOICE CLONING V3.0 ĐẠT 95.9%–99% GIỐNG GIỌNG GỐC.*],
)
