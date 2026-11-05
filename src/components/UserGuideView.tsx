import React, { useState, useEffect } from 'react';
import {
  BookOpen, Search, ArrowRight, CheckCircle2, Play, Pause, RotateCcw,
  Sparkles, KeyRound, Clock, Folder, Calendar, Share2, HardDrive,
  Cpu, FileText, ExternalLink, ShieldCheck, HelpCircle, Eye, EyeOff,
  ChevronRight, ArrowLeft, Layers, Video, Monitor, AlertCircle
} from 'lucide-react';

interface UserGuideViewProps {
  onBack?: () => void;
  onNavigateView: (view: string) => void;
  onOpenCreateModal: () => void;
  onOpenPolicyModal?: (type: string) => void;
}

interface GuideModule {
  id: string;
  stepNumber: string;
  category: 'auth' | 'ai' | 'skills' | 'review' | 'stitcher' | 'traffic' | 'calendar' | 'channels' | 'drive' | 'legal' | 'changelog';
  title: string;
  shortDesc: string;
  badge: string;
  steps: {
    number: number;
    title: string;
    description: string;
    note?: string;
  }[];
  actionLabel?: string;
  actionView?: string;
  proTips: string[];
  mockupType: 'auth' | 'ai' | 'skills' | 'review' | 'stitcher' | 'traffic' | 'calendar' | 'channels' | 'drive' | 'legal' | 'changelog';
}

export const UserGuideView: React.FC<UserGuideViewProps> = ({
  onBack,
  onNavigateView,
  onOpenCreateModal,
  onOpenPolicyModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTabMode, setActiveTabMode] = useState<Record<string, 'mockup' | 'simulation'>>({});
  const [simStep, setSimStep] = useState<Record<string, number>>({});
  const [isSimPlaying, setIsSimPlaying] = useState<Record<string, boolean>>({});

  // Mock Eye toggle demo for Auth
  const [demoShowPass, setDemoShowPass] = useState(false);

  // Auto-play simulation interval
  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];
    Object.keys(isSimPlaying).forEach((modId) => {
      if (isSimPlaying[modId]) {
        const interval = setInterval(() => {
          setSimStep((prev) => {
            const current = prev[modId] || 0;
            return { ...prev, [modId]: (current + 1) % 3 };
          });
        }, 3200);
        intervals.push(interval);
      }
    });
    return () => intervals.forEach(clearInterval);
  }, [isSimPlaying]);

  const toggleSimPlay = (modId: string) => {
    setIsSimPlaying((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  const setModuleTabMode = (modId: string, mode: 'mockup' | 'simulation') => {
    setActiveTabMode((prev) => ({
      ...prev,
      [modId]: mode,
    }));
    if (mode === 'simulation' && isSimPlaying[modId] === undefined) {
      setIsSimPlaying((prev) => ({ ...prev, [modId]: true }));
    }
  };

  const categories = [
    { id: 'all', label: 'Tất Cả (Từ A-Z)' },
    { id: 'auth', label: '1. Đăng Nhập & Mật Khẩu' },
    { id: 'ai', label: '2. Kịch Bản AI & Prompt' },
    { id: 'review', label: '3. Kiểm Duyệt & Ghép Video' },
    { id: 'traffic', label: '4. Giờ Vàng & Lịch Đăng' },
    { id: 'channels', label: '5. Mạng Xã Hội & Google Drive' },
    { id: 'legal', label: '6. Hồ Sơ Pháp Lý PDF' },
    { id: 'changelog', label: '7. Nhật Ký Cập Nhật Mới' },
  ];

  const guideModules: GuideModule[] = [
    {
      id: 'auth-guide',
      stepNumber: 'BƯỚC 01 / 10',
      category: 'auth',
      title: 'Đăng Nhập Studio & Quản Lý Mật Khẩu Khách Hàng',
      shortDesc: 'Xác thực tài khoản bằng Mã Code định danh được cấp, cơ chế xem/ẩn mật khẩu an toàn và đồng bộ tức thời từ Google Sheet.',
      badge: 'Bảo Mật Xác Thực',
      steps: [
        {
          number: 1,
          title: 'Nhấp nút "Đăng Nhập" trên thanh Header',
          description: 'Tại góc trên cùng bên phải màn hình, nhấp nút "Đăng Nhập" để mở hộp thoại bảo mật Studio.',
        },
        {
          number: 2,
          title: 'Điền Mã Code Khách Hàng được cấp',
          description: 'Nhập mã Code như VIP-001, PRO-002, DEV-001... Hệ thống đã đồng bộ danh bạ từ Google Sheet kỹ sư theo thời gian thực.',
        },
        {
          number: 3,
          title: 'Nhập Mật Khẩu & Sử dụng nút icon Con Mắt',
          description: 'Nhập mật khẩu của bạn. Bạn có thể nhấp vào biểu tượng Con Mắt 👁️ ở góc phải ô nhập để xem rõ các ký tự mật khẩu, tránh gõ nhầm trước khi đăng nhập.',
          note: 'Mật khẩu khởi tạo mặc định có thể được đổi thành mật khẩu riêng bất cứ lúc nào.',
        },
        {
          number: 4,
          title: 'Đổi mật khẩu cá nhân (Tùy chọn)',
          description: 'Sau khi vào bàn làm việc, nhấp biểu tượng Chìa Khóa 🔑 trên Header để đổi sang mật khẩu bí mật của riêng bạn.',
        },
      ],
      actionLabel: 'Thử Mở Đổi Mật Khẩu',
      actionView: 'auth-modal',
      proTips: [
        'Mã Code và mật khẩu được mã hóa an toàn tại trình duyệt (Local Storage).',
        'Nếu quên mật khẩu, liên hệ quản trị viên để nhận mã khôi phục tạm thời qua Google Sheet.',
      ],
      mockupType: 'auth',
    },
    {
      id: 'ai-prompt-guide',
      stepNumber: 'BƯỚC 02 / 10',
      category: 'ai',
      title: 'Tạo Dự Án Kịch Bản Video Mới Với Động Cơ AI Gemini 2.0',
      shortDesc: 'Khởi tạo kịch bản video phân rã đa phân cảnh hoàn chỉnh chỉ từ một câu Prompt mô tả ngắn gọn và tùy chọn tỉ lệ chuẩn đa nền tảng.',
      badge: 'Động Cơ AI Gemini 2.0',
      steps: [
        {
          number: 1,
          title: 'Bấm nút "+ Dự Án Video Mới"',
          description: 'Bấm nút nổi bật màu đen ở đầu Sidebar bên trái hoặc phím tắt trên giao diện.',
        },
        {
          number: 2,
          title: 'Chọn Tỉ Lệ Khung Hình Chuẩn Nền Tảng',
          description: 'Chọn 16:9 cho YouTube Long-form (5-10 phút) hoặc 9:16 cho TikTok, YouTube Shorts, Facebook Reels (dưới 60 giây).',
        },
        {
          number: 3,
          title: 'Nhập Ý Tưởng / Prompt Mô Tả & Giọng Đọc',
          description: 'Gõ chủ đề bạn muốn làm video (ví dụ: "Review 5 công nghệ AI thay đổi năm 2026"), chọn giọng đọc AI tự nhiên (Nam/Nữ) và độ dài.',
        },
        {
          number: 4,
          title: 'Bấm "Tạo Kịch Bản"',
          description: 'AI Gemini 2.0 sẽ tự động phân tích và tạo kịch bản gồm phân cảnh (Scenes), lời bình TTS, gợi ý hình ảnh và hiệu ứng âm thanh.',
        },
      ],
      actionLabel: 'Tạo Dự Án Video Mới Ngay',
      actionView: 'open-create',
      proTips: [
        'Bạn có thể gõ thêm các từ khóa như "giọng đọc hài hước", "tập trung vào số liệu thực tế" để AI tinh chỉnh sâu hơn.',
        'Mỗi dự án tạo xong sẽ xuất hiện trong danh sách "Chờ phê duyệt" với thông báo số lượng trên menu.',
      ],
      mockupType: 'ai',
    },
    {
      id: 'skills-guide',
      stepNumber: 'BƯỚC 03 / 10',
      category: 'skills',
      title: 'Kho Skills & Prompts Bản Quyền Chuyên Biệt',
      shortDesc: 'Sử dụng các bộ công thức prompt chuẩn đã tối ưu tỷ lệ tương tác và giữ chân người xem theo từng nhóm ngành nghề.',
      badge: 'Thư Viện Công Thức Chuẩn',
      steps: [
        {
          number: 1,
          title: 'Vào mục "Kho Skills & Prompts"',
          description: 'Chọn mục Skills ở thanh Sidebar để mở thư viện công thức kịch bản bản quyền.',
        },
        {
          number: 2,
          title: 'Chọn Skill phù hợp với định hướng kênh',
          description: 'Hệ thống cung cấp sẵn các bộ skill: Review Đồ Công Nghệ AI, Tin Tức Tài Chính 24h, Mẹo Năng Suất Siêu Tốc, Tin Giật Gân...',
        },
        {
          number: 3,
          title: 'Áp dụng vào kịch bản hoặc Thêm Skill mới',
          description: 'Bấm "Sử dụng" để nạp trực tiếp mẫu prompt vào bộ sinh AI, hoặc bấm "Thêm Skill Mới" để lưu giữ công thức sáng tạo riêng của đội ngũ bạn.',
        },
      ],
      actionLabel: 'Khám Phá Kho Skills & Prompts',
      actionView: 'skills',
      proTips: [
        'Các skill bản quyền đã được tối ưu sẵn hook 3 giây đầu tiên để giữ chân người xem trên TikTok và YouTube Shorts.',
      ],
      mockupType: 'skills',
    },
    {
      id: 'review-workspace-guide',
      stepNumber: 'BƯỚC 04 / 10',
      category: 'review',
      title: 'Bàn Làm Việc Kiểm Duyệt & Thẩm Định Kịch Bản (Review Workspace)',
      shortDesc: 'Kiểm duyệt chi tiết từng phân cảnh (Scene Breakdown), nghe thử voiceover, điều chỉnh thời lượng và bấm nút phê duyệt kịch bản.',
      badge: 'Kiểm Duyệt Studio',
      steps: [
        {
          number: 1,
          title: 'Chọn mục "Trình Duyệt Kịch Bản"',
          description: 'Nhấp vào mục "Trình Duyệt Kịch Bản" trên thanh Header hoặc "Chờ phê duyệt" ở thanh Sidebar (có đính kèm số lượng chờ duyệt).',
        },
        {
          number: 2,
          title: 'Chọn kịch bản trong danh sách để duyệt',
          description: 'Nhấp vào dự án cần thẩm định. Giao diện chi tiết sẽ mở ra kịch bản phân rã từng phân cảnh (Scene 1, Scene 2, Scene 3...).',
        },
        {
          number: 3,
          title: 'Đọc lời thoại, xem mô tả cảnh & thời lượng',
          description: 'Kiểm tra lời bình Voiceover, gợi ý hình ảnh Visual Prompt, âm thanh hiệu ứng (SFX) và mốc thời gian từng đoạn.',
        },
        {
          number: 4,
          title: 'Thực hiện thao tác Phê Duyệt hoặc Tinh Chỉnh',
          description: 'Nhấp "Phê Duyệt Kịch Bản" để chuyển sang trạng thái sẵn sàng xuất bản, hoặc bấm "Yêu Cầu AI Viết Lại" nếu cần thay đổi nội dung.',
        },
      ],
      actionLabel: 'Mở Bàn Kiểm Duyệt Kịch Bản',
      actionView: 'pending-approval',
      proTips: [
        'Bạn có thể trực tiếp sửa từng từ trong ô lời thoại để kịch bản hoàn toàn đúng ý mà không cần sinh lại từ đầu.',
      ],
      mockupType: 'review',
    },
    {
      id: 'stitcher-guide',
      stepNumber: 'BƯỚC 05 / 10',
      category: 'stitcher',
      title: 'Phòng Dựng & Ghép Video Đa Phân Đoạn (Multi-Clip Stitcher Studio)',
      shortDesc: 'Cửa sổ biên tập chuyên sâu ghép nối các đoạn video thành phẩm, kiểm tra âm lượng Voiceover/BGM và xuất file 1080p hoàn chỉnh.',
      badge: 'Phòng Dựng Stitcher',
      steps: [
        {
          number: 1,
          title: 'Bấm nút "Mở Phòng Ghép Video"',
          description: 'Trong bàn duyệt kịch bản, nhấp vào nút "Mở Phòng Ghép Video" để kích hoạt cửa sổ Stitcher Studio chuyên nghiệp.',
        },
        {
          number: 2,
          title: 'Xem trước video thành phần & timeline',
          description: 'Trình phát video trung tâm hiển thị trực quan các phân đoạn đã ghép nối. Bạn có thể hoán đổi vị trí phân cảnh bằng cách kéo thả.',
        },
        {
          number: 3,
          title: 'Điều chỉnh âm lượng Voiceover & Nhạc nền (BGM)',
          description: 'Thanh trượt âm thanh cho phép cân bằng giọng đọc rõ ràng và nhạc nền êm dịu, không bị lấn át lời nói.',
        },
        {
          number: 4,
          title: 'Bấm "Xuất Bản Dựng Hoàn Chỉnh (Render 1080p)"',
          description: 'Hệ thống kết xuất video chất lượng cao 1080p Full HD và tự động đưa vào danh sách sẵn sàng phát sóng.',
        },
      ],
      actionLabel: 'Xem Danh Sách Dự Án Để Dựng',
      actionView: 'in-progress',
      proTips: [
        'Luôn nghe thử 5 giây đầu tiên với tai nghe để đảm bảo âm lượng nhạc dạo đầu không quá to so với giọng MC.',
      ],
      mockupType: 'stitcher',
    },
    {
      id: 'traffic-chart-guide',
      stepNumber: 'BƯỚC 06 / 10',
      category: 'traffic',
      title: 'Biểu Đồ Miền Lưu Lượng Giờ Vàng Thời Gian Thực (TikTok, YouTube, Facebook)',
      shortDesc: 'Theo dõi lưu lượng người xem hoạt động theo thời gian thực (quét chu kỳ 10 phút/lần) để chọn thời điểm đăng video đạt triệu view.',
      badge: 'Realtime Telemetry 10p/Lần',
      steps: [
        {
          number: 1,
          title: 'Quan sát Biểu Đồ Miền ở cuối thanh Sidebar',
          description: 'Tại góc dưới thanh Sidebar có widget biểu đồ miền mini cập nhật liên tục 24/7.',
        },
        {
          number: 2,
          title: 'Đọc cấu trúc trục & 3 nền tảng',
          description: 'Trục ngang chia thành 3 cột nền tảng: TikTok (Đen), YouTube (Đỏ), Meta Facebook (Xanh dương). Trục dọc là các khung giờ từ 08h sáng đến 23h đêm.',
        },
        {
          number: 3,
          title: 'Theo dõi Đường Giờ Hiện Tại & Chu Kỳ Sync 10 phút',
          description: 'Đường đứt nét màu xanh ngọc hiển thị giờ thực tế hiện tại. Cứ mỗi 10 phút hệ thống tự động cập nhật lại lưu lượng traffic mới nhất.',
        },
        {
          number: 4,
          title: 'Chọn 2 Khung Giờ Vàng Đỉnh Cao Để Đăng Video',
          description: 'Khung trưa (11h00 - 13h00) và Khung tối (19h00 - 21h30) có lưu lượng người dùng đạt đỉnh 80% - 95%. Hãy lên lịch phát sóng vào các mốc này!',
        },
      ],
      actionLabel: 'Xem Lịch Phát Sóng Tối Ưu',
      actionView: 'calendar',
      proTips: [
        'TikTok có đỉnh tương tác cực mạnh vào 12h trưa và 21h đêm.',
        'YouTube video dài (16:9) đạt lượng xem ổn định và sâu nhất từ 19h30 đến 21h30.',
      ],
      mockupType: 'traffic',
    },
    {
      id: 'calendar-guide',
      stepNumber: 'BƯỚC 07 / 10',
      category: 'traffic',
      title: 'Lịch Phát Sóng Tự Động & Hàng Đợi Xuất Bản Đa Kênh',
      shortDesc: 'Lên lịch xuất bản tự động theo lịch ngày/tuần, video tự động kích hoạt API phát sóng khi đến đúng mốc giờ tối ưu.',
      badge: 'Lập Lịch Tự Động',
      steps: [
        {
          number: 1,
          title: 'Chọn mục "Lịch Phát Sóng"',
          description: 'Nhấp "Lịch Phát Sóng" trên thanh Header hoặc Sidebar để mở bảng điều phối lịch phát hành.',
        },
        {
          number: 2,
          title: 'Xem các video đã lên lịch',
          description: 'Giao diện hiển thị theo từng ngày trong tuần kèm khung giờ cụ thể và các nền tảng mục tiêu (YouTube, TikTok, Facebook).',
        },
        {
          number: 3,
          title: 'Hệ thống tự động phát sóng qua API',
          description: 'Khi đến đúng giờ hẹn, bot tự động đẩy video lên kênh mà không cần người dùng phải bấm thủ công.',
        },
      ],
      actionLabel: 'Mở Bảng Lịch Phát Sóng',
      actionView: 'calendar',
      proTips: [
        'Nên lên lịch trước từ 1 đến 2 ngày để hệ thống API chuẩn bị hàng đợi và dự phòng mạng.',
      ],
      mockupType: 'calendar',
    },
    {
      id: 'channels-guide',
      stepNumber: 'BƯỚC 08 / 10',
      category: 'channels',
      title: 'Liên Kết Mạng Xã Hội, Đăng Nhập Kênh & Nút "Đổi Tài Khoản"',
      shortDesc: 'Ủy quyền tài khoản YouTube, TikTok, Facebook an toàn. Thao tác nút "Đổi tài khoản" chuyên nghiệp và "Thử đăng video" kiểm tra kết nối.',
      badge: 'Ủy Quyền OAuth 2.0',
      steps: [
        {
          number: 1,
          title: 'Chọn mục "Quản Lý Kênh & API"',
          description: 'Mở mục Quản Lý Kênh trên Sidebar hoặc bấm trực tiếp vào từng kênh: YouTube, TikTok, Facebook.',
        },
        {
          number: 2,
          title: 'Sử dụng nút "Đổi tài khoản" linh hoạt',
          description: 'Mỗi thẻ kênh có nút "Đổi tài khoản" chuyên nghiệp giúp bạn chuyển đổi kênh phụ, fanpage vệ tinh hoặc kênh chính trong 1 nốt nhạc.',
        },
        {
          number: 3,
          title: 'Bấm nút "Thử đăng video" để kiểm tra kết nối',
          description: 'Nút "Thử đăng video" gửi tín hiệu ping test và kiểm tra token OAuth 2.0 còn hạn, đảm bảo không gặp lỗi khi xuất bản thật.',
        },
      ],
      actionLabel: 'Đến Quản Lý Kênh & Đổi Tài Khoản',
      actionView: 'channels',
      proTips: [
        'Token YouTube và TikTok tự động làm mới (Auto Refresh Token) trước khi hết hạn.',
        'Facebook Fanpage sử dụng Page Access Token vĩnh viễn không lo bị gián đoạn.',
      ],
      mockupType: 'channels',
    },
    {
      id: 'drive-guide',
      stepNumber: 'BƯỚC 09 / 10',
      category: 'channels',
      title: 'Thư Viện Sao Lưu Google Drive Cloud & Nút "Đăng Nhập Tài Khoản"',
      shortDesc: 'Lưu trữ tự động kịch bản và video hoàn chỉnh lên Google Drive của khách hàng với phạm vi bảo mật tối cao drive.file.',
      badge: 'Lưu Trữ Đám Mây An Toàn',
      steps: [
        {
          number: 1,
          title: 'Nhấp mục "Google Drive Cloud"',
          description: 'Vào mục Google Drive Cloud ở thanh Sidebar để mở thư viện sao lưu dự án đám mây.',
        },
        {
          number: 2,
          title: 'Bấm nút "Đăng nhập tài khoản" Google Drive',
          description: 'Phía trên góc phải có nút "Đăng nhập tài khoản" (hoặc huy hiệu email đang kết nối, ví dụ: synapes.backup@gmail.com).',
        },
        {
          number: 3,
          title: 'Nhập địa chỉ Gmail / Google Workspace của bạn',
          description: 'Điền email Google của bạn để hệ thống đồng bộ trực tiếp vào không gian lưu trữ của bạn.',
        },
        {
          number: 4,
          title: 'Quyền hạn bảo mật drive.file an toàn 100%',
          description: 'Hệ thống chỉ cấp quyền đọc/ghi các file do chính phần mềm tạo ra trong thư mục My Drive / Du_An_Video / 2026 / 11 /. Tuyệt đối không can thiệp vào tài liệu cá nhân khác.',
        },
      ],
      actionLabel: 'Mở Thư Viện Google Drive',
      actionView: 'drive-backup',
      proTips: [
        'Bấm nút "Mở Google Drive" để mở trực tiếp thư mục Drive trên trình duyệt để tải video về máy hoặc gửi đối tác.',
      ],
      mockupType: 'drive',
    },
    {
      id: 'legal-guide',
      stepNumber: 'BƯỚC 10 / 10',
      category: 'legal',
      title: 'Tra Cứu 4 Tài Liệu Pháp Lý, Bản Quyền & Trách Nhiệm Chuẩn Báo Cáo (PDF)',
      shortDesc: 'Đọc và tải về 4 tập tài liệu PDF soạn thảo chuẩn font Times New Roman, dẫn chú đầy đủ Luật An ninh mạng, Luật Sở hữu trí tuệ và Bộ luật Dân sự.',
      badge: 'Chuẩn Pháp Lý Doanh Nghiệp',
      steps: [
        {
          number: 1,
          title: 'Cuộn xuống Chân trang (Footer) của webapp',
          description: 'Tại cột "ĐIỀU KHOẢN & CHÍNH SÁCH", hệ thống hiển thị 4 tài liệu pháp lý chuyên sâu.',
        },
        {
          number: 2,
          title: 'Nhấp vào từng mục để xem tài liệu PDF tương ứng',
          description: 'Các văn bản gồm: Điều khoản sử dụng phần mềm, Bảo mật dữ liệu & Token API, Quyền sở hữu trí tuệ kịch bản, và Cơ chế phê duyệt miễn trừ trách nhiệm.',
        },
        {
          number: 3,
          title: 'Đọc trực tiếp trên Web hoặc Bấm Tải Về PDF',
          description: 'Văn bản được biên soạn trang trọng theo font Times New Roman chuẩn báo cáo hành chính pháp quy Việt Nam.',
        },
      ],
      actionLabel: 'Xem File PDF Điều Khoản Mẫu',
      actionView: 'policy-terms',
      proTips: [
        'Mọi kịch bản và video do người dùng tạo ra bằng AI thuộc toàn quyền sở hữu trí tuệ của người dùng (Luật SHTT 2022).',
      ],
      mockupType: 'legal',
    },
    {
      id: 'changelog-guide',
      stepNumber: 'NHẬT KÝ CẬP NHẬT',
      category: 'changelog',
      title: 'Nhật Ký Cập Nhật Tính Năng Mới & Cam Kết Nâng Cấp Thường Xuyên',
      shortDesc: 'Toàn bộ nâng cấp giao diện, tính năng mới và hạ tầng kỹ thuật được ghi chép minh bạch giúp khách hàng luôn nắm bắt kịp thời.',
      badge: 'Phiên Bản v2.4 (Mới Nhất 11/2026)',
      steps: [
        {
          number: 1,
          title: 'Bổ sung mục "Hướng Dẫn Sử Dụng (A-Z)" trên thanh Header',
          description: 'Đưa mục Hướng dẫn sử dụng trực tiếp lên thanh điều hướng trung tâm với đầy đủ hình ảnh minh họa và trình mô phỏng thao tác.',
        },
        {
          number: 2,
          title: 'Cập nhật nút "Đổi tài khoản" & Đăng nhập Google Drive OAuth',
          description: 'Đổi nút "Đổi nick" thành "Đổi tài khoản" trang trọng; bổ sung nút "Đăng nhập tài khoản" trong phần Google Drive Cloud.',
        },
        {
          number: 3,
          title: 'Tích hợp Biểu Đồ Miền Lưu Lượng Giờ Vàng Telemetry Realtime',
          description: 'Hệ thống tự động theo dõi và cập nhật lưu lượng TikTok, YouTube, Facebook cứ mỗi 10 phút/lần kèm giờ thực tế.',
        },
        {
          number: 4,
          title: 'Bổ sung tính năng Xem/Ẩn Mật Khẩu & 4 File PDF Pháp Lý',
          description: 'Thêm icon con mắt hiển thị mật khẩu; tích hợp 4 tài liệu PDF chuẩn Times New Roman có dẫn chú luật pháp Việt Nam.',
        },
      ],
      actionLabel: 'Quay Lại Bàn Làm Việc',
      actionView: 'pending-approval',
      proTips: [
        'Cứ sau mỗi lần triển khai tính năng mới, phần Hướng dẫn sử dụng này sẽ tự động cập nhật để quý khách luôn có tài liệu hướng dẫn mới nhất!',
      ],
      mockupType: 'changelog',
    },
  ];

  const filteredModules = guideModules.filter((m) => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.steps.some((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleActionClick = (view?: string) => {
    if (!view) return;
    if (view === 'open-create') {
      onOpenCreateModal();
    } else if (view === 'policy-terms') {
      if (onOpenPolicyModal) onOpenPolicyModal('terms');
    } else {
      onNavigateView(view);
    }
  };

  // Render Visual Mockup / Screen Illustration based on type
  const renderVisualMockup = (type: GuideModule['mockupType']) => {
    switch (type) {
      case 'auth':
        return (
          <div className="bg-white rounded-lg border border-black/10 p-4 shadow-xs space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-zinc-900 font-mono">Đăng Nhập Studio</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                🟢 Live Google Sheet
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[11px] text-zinc-500 block mb-0.5">Mã Code Khách Hàng</label>
                <div className="px-2.5 py-1.5 rounded bg-zinc-50 border border-black/10 font-mono text-zinc-800 flex items-center justify-between">
                  <span>VIP-001 (Doanh Nghiệp Media)</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[11px] text-zinc-500">Mật Khẩu</label>
                  <button
                    onClick={() => setDemoShowPass(!demoShowPass)}
                    className="text-[10px] text-zinc-600 hover:text-zinc-900 flex items-center gap-1 cursor-pointer font-medium"
                    title="Bấm để thử nghiệm tính năng xem/ẩn mật khẩu"
                  >
                    {demoShowPass ? <EyeOff className="w-3 h-3 text-zinc-700" /> : <Eye className="w-3 h-3 text-zinc-700" />}
                    <span>{demoShowPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</span>
                  </button>
                </div>
                <div className="px-2.5 py-1.5 rounded bg-zinc-50 border border-black/10 font-mono text-zinc-900 flex items-center justify-between">
                  <span>{demoShowPass ? 'StudioMaster@2026#' : '••••••••••••••••'}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Bấm icon để xem</span>
                </div>
              </div>

              <div className="pt-1 flex gap-2">
                <div className="w-1/3 py-1.5 rounded bg-zinc-100 text-zinc-600 text-center text-xs font-medium border border-black/5">
                  Thoát
                </div>
                <div className="w-2/3 py-1.5 rounded bg-zinc-900 text-white text-center text-xs font-medium flex items-center justify-center gap-1 shadow-2xs">
                  <span>Vào Bàn Làm Việc</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="bg-white rounded-lg border border-black/10 p-4 shadow-xs space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <span className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-800" />
                <span>+ Khởi Tạo Dự Án Video Mới (AI Engine)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-black/5">
                Gemini 2.0 Flash
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Chọn Tỉ Lệ Khung Hình:</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded border-2 border-zinc-900 bg-zinc-50 flex items-center gap-2">
                    <div className="w-5 h-3.5 rounded bg-zinc-900 text-white text-[8px] flex items-center justify-center font-mono">
                      16:9
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900 text-[11px]">Ngang (YouTube Long)</div>
                      <div className="text-[10px] text-zinc-400">5 - 10 phút</div>
                    </div>
                  </div>
                  <div className="p-2 rounded border border-black/10 bg-white flex items-center gap-2">
                    <div className="w-3.5 h-5 rounded bg-zinc-200 text-zinc-700 text-[8px] flex items-center justify-center font-mono">
                      9:16
                    </div>
                    <div>
                      <div className="font-medium text-zinc-700 text-[11px]">Dọc (TikTok / Reels)</div>
                      <div className="text-[10px] text-zinc-400">30 - 60 giây</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Prompt / Ý Tưởng Video:</label>
                <div className="p-2.5 rounded bg-zinc-50 border border-black/10 text-zinc-700 text-[11px] leading-relaxed font-mono">
                  "Top 5 bước tiến AI đột phá trong năm 2026 thay đổi hoàn toàn cách con người làm việc và sáng tạo nội dung..."
                </div>
              </div>

              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>AI tự động phân tích: 6 Phân Cảnh • Voiceover AI • SFX • Gợi ý hình ảnh</span>
              </div>
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="bg-white rounded-lg border border-black/10 p-3.5 shadow-xs space-y-2.5 font-sans">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <span className="text-xs font-semibold text-zinc-900 font-mono uppercase tracking-wider">
                Kho Skills & Công Thức Chuẩn
              </span>
              <span className="text-[10px] font-mono text-zinc-400">8 Skills Kích Hoạt</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded bg-zinc-50 border border-black/5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-900 text-xs">Review Sản Phẩm Công Nghệ AI</div>
                  <div className="text-[10px] text-zinc-500">Hook 3s mở đầu • Nêu ưu/nhược điểm thực tế • Kêu gọi CTA</div>
                </div>
                <span className="px-2 py-1 rounded bg-zinc-900 text-white text-[10px] font-medium">Áp Dụng</span>
              </div>
              <div className="p-2 rounded bg-zinc-50 border border-black/5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-900 text-xs">Bản Tin Tài Chính 24h</div>
                  <div className="text-[10px] text-zinc-500">Dữ liệu thị trường • Phân tích xu hướng • Cảnh báo rủi ro</div>
                </div>
                <span className="px-2 py-1 rounded bg-zinc-200 text-zinc-800 text-[10px] font-medium">Sử Dụng</span>
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="bg-white rounded-lg border border-black/10 p-4 shadow-xs space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-xs font-semibold text-zinc-900">Bàn Thẩm Định Kịch Bản (6 Cảnh)</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                Chờ Phê Duyệt
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-zinc-50 border border-black/10 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>PHÂN CẢNH 01 (00:00 - 00:15)</span>
                  <span className="text-emerald-600 font-medium">Hook 3 Giây Mở Đầu</span>
                </div>
                <div className="text-zinc-800 text-xs font-medium">
                  "Bạn có tin rằng trong năm 2026, AI đã có thể tự động viết kịch bản, quay phim và biên tập video chỉ trong vài giây?"
                </div>
                <div className="text-[10px] text-zinc-500 italic">
                  Prompt Hình ảnh: Cinematic robot studio, 8k resolution, photorealistic lighting.
                </div>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <div className="flex-1 py-1.5 rounded bg-zinc-900 text-white text-center text-xs font-medium flex items-center justify-center gap-1 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Phê Duyệt Kịch Bản</span>
                </div>
                <div className="py-1.5 px-3 rounded bg-zinc-100 text-zinc-700 text-xs font-medium border border-black/5">
                  AI Viết Lại
                </div>
              </div>
            </div>
          </div>
        );

      case 'stitcher':
        return (
          <div className="bg-zinc-950 text-white rounded-lg p-3.5 shadow-xs space-y-2.5 font-sans">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-mono font-semibold">Multi-Clip Stitcher Studio</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Preview 1080p FHD</span>
            </div>

            <div className="h-24 bg-zinc-900 rounded border border-white/10 flex items-center justify-center relative overflow-hidden">
              <div className="text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm mx-auto flex items-center justify-center text-white">
                  ▶
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">02:15 / 08:35 • 1080p 60fps</div>
              </div>
            </div>

            {/* Timeline Multi-clip */}
            <div className="space-y-1">
              <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                <span>Timeline Các Phân Cảnh (Clip 1 - Clip 6)</span>
                <span className="text-emerald-400 font-mono">Âm lượng TTS: 95% • BGM: 25%</span>
              </div>
              <div className="grid grid-cols-4 gap-1 h-5 text-[9px] font-mono text-center">
                <div className="bg-zinc-800 rounded border border-white/10 flex items-center justify-center">Cảnh 1</div>
                <div className="bg-zinc-800 rounded border border-white/10 flex items-center justify-center">Cảnh 2</div>
                <div className="bg-zinc-800 rounded border border-white/10 flex items-center justify-center">Cảnh 3</div>
                <div className="bg-zinc-700 rounded border border-white/20 flex items-center justify-center text-emerald-400">Cảnh 4</div>
              </div>
            </div>
          </div>
        );

      case 'traffic':
        return (
          <div className="bg-white rounded-lg border border-black/10 p-3.5 shadow-xs space-y-2.5 font-sans">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-mono font-semibold text-zinc-900">KHUNG GIỜ VÀNG (REALTIME)</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">10p/Lần • Sync: 12:23</span>
            </div>

            <div className="p-2.5 rounded bg-zinc-50 border border-black/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-900">Lưu lượng hiện tại: 12:00 - 13:00</span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-medium">
                  Đỉnh Trưa
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-1.5 rounded bg-white border border-black/5">
                  <div className="text-[10px] text-zinc-500 font-mono">TikTok</div>
                  <div className="font-bold text-red-600 font-mono text-sm">89%</div>
                </div>
                <div className="p-1.5 rounded bg-white border border-black/5">
                  <div className="text-[10px] text-zinc-500 font-mono">YouTube</div>
                  <div className="font-bold text-zinc-900 font-mono text-sm">58%</div>
                </div>
                <div className="p-1.5 rounded bg-white border border-black/5">
                  <div className="text-[10px] text-zinc-500 font-mono">Meta FB</div>
                  <div className="font-bold text-blue-600 font-mono text-sm">82%</div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-zinc-500 flex items-center justify-between">
              <span>Đường đứt nét xanh hiển thị giờ hiện tại</span>
              <span className="font-mono text-zinc-700 font-medium">Khung tối: 19h - 21h (94%)</span>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="bg-white rounded-lg border border-black/10 p-3.5 shadow-xs space-y-2 font-sans">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <span className="text-xs font-semibold text-zinc-900 font-mono uppercase tracking-wider">
                Lịch Phát Sóng Tự Động (Tuần Này)
              </span>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                3 Video Đang Đợi
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded bg-zinc-50 border border-black/5 flex items-center justify-between">
                <div>
                  <div className="font-medium text-zinc-900 text-xs">Top 5 Công nghệ AI Đột phá 2026</div>
                  <div className="text-[10px] font-mono text-zinc-500">19:30 Tối nay • YouTube, Facebook</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-white font-medium">
                  Đã Lên Lịch
                </span>
              </div>
              <div className="p-2 rounded bg-zinc-50 border border-black/5 flex items-center justify-between">
                <div>
                  <div className="font-medium text-zinc-900 text-xs">Review Đèn Bàn Chống Cận AI (Short)</div>
                  <div className="text-[10px] font-mono text-zinc-500">12:15 Trưa mai • TikTok, Reels</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-white font-medium">
                  Đã Lên Lịch
                </span>
              </div>
            </div>
          </div>
        );

      case 'channels':
        return (
          <div className="bg-white rounded-lg border border-black/10 p-3.5 shadow-xs space-y-2.5 font-sans">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <span className="text-xs font-semibold text-zinc-900 font-mono uppercase tracking-wider">
                Kênh Mạng Xã Hội Đã Liên Kết
              </span>
              <span className="text-[10px] font-mono text-emerald-600">● 4 Kênh Sẵn Sàng</span>
            </div>

            <div className="p-2 rounded bg-zinc-50 border border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                  YT
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-900">Kênh Studio Official</div>
                  <div className="text-[10px] text-zinc-400 font-mono">@TechReviewerOfficial</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium border border-black/5">
                  Thử đăng video
                </span>
                <span className="px-2 py-1 rounded bg-zinc-900 text-white text-[11px] font-medium shadow-2xs">
                  Đổi tài khoản
                </span>
              </div>
            </div>

            <div className="p-2 rounded bg-zinc-50 border border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-black text-white flex items-center justify-center text-[10px] font-bold">
                  TT
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-900">TikTok Creator Shop VN</div>
                  <div className="text-[10px] text-zinc-400 font-mono">@techreviewer_vn</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-1 rounded bg-zinc-100 text-zinc-800 text-[11px] font-medium border border-black/5">
                  Thử đăng video
                </span>
                <span className="px-2 py-1 rounded bg-zinc-900 text-white text-[11px] font-medium shadow-2xs">
                  Đổi tài khoản
                </span>
              </div>
            </div>
          </div>
        );

      case 'drive':
        return (
          <div className="bg-white rounded-lg border border-black/10 p-3.5 shadow-xs space-y-2.5 font-sans">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center">
                  <HardDrive className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-zinc-900">Thư Viện Google Drive Cloud</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-1 rounded bg-zinc-900 text-white text-[11px] font-medium flex items-center gap-1">
                  <span>Đăng nhập tài khoản</span>
                </span>
              </div>
            </div>

            <div className="p-2 rounded bg-zinc-50 border border-black/5 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-mono text-zinc-800 font-medium">synapes.backup@gmail.com</span>
                <span className="text-[10px] text-zinc-400 font-mono ml-auto">124 GB / 2 TB</span>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono truncate">
                Đường dẫn: My Drive / Du_An_Video / 2026 / 11 /
              </div>
            </div>

            <div className="p-2 rounded bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Phạm vi quyền drive.file: Chỉ truy cập tệp do app tạo ra, tuyệt đối an toàn.</span>
            </div>
          </div>
        );

      case 'legal':
        return (
          <div className="bg-white rounded-lg border border-black/10 p-3.5 shadow-xs space-y-2 font-sans">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <span className="text-xs font-semibold text-zinc-900 font-mono uppercase tracking-wider">
                Hồ Sơ Pháp Lý Chuẩn Văn Bản Báo Cáo
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Font Times New Roman</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-zinc-50 border border-black/5 space-y-0.5">
                <div className="font-medium text-zinc-900 text-[11px] flex items-center gap-1">
                  <FileText className="w-3 h-3 text-zinc-600" />
                  <span>Điều khoản sử dụng</span>
                </div>
                <div className="text-[9px] text-zinc-400 font-mono">Luật GDĐT 2023</div>
              </div>
              <div className="p-2 rounded bg-zinc-50 border border-black/5 space-y-0.5">
                <div className="font-medium text-zinc-900 text-[11px] flex items-center gap-1">
                  <FileText className="w-3 h-3 text-zinc-600" />
                  <span>Bảo mật dữ liệu & Token</span>
                </div>
                <div className="text-[9px] text-zinc-400 font-mono">Luật ANM 2018</div>
              </div>
              <div className="p-2 rounded bg-zinc-50 border border-black/5 space-y-0.5">
                <div className="font-medium text-zinc-900 text-[11px] flex items-center gap-1">
                  <FileText className="w-3 h-3 text-zinc-600" />
                  <span>Sở hữu trí tuệ kịch bản</span>
                </div>
                <div className="text-[9px] text-zinc-400 font-mono">Luật SHTT 2022</div>
              </div>
              <div className="p-2 rounded bg-zinc-50 border border-black/5 space-y-0.5">
                <div className="font-medium text-zinc-900 text-[11px] flex items-center gap-1">
                  <FileText className="w-3 h-3 text-zinc-600" />
                  <span>Miễn trừ trách nhiệm</span>
                </div>
                <div className="text-[9px] text-zinc-400 font-mono">Bộ luật Dân sự 2015</div>
              </div>
            </div>
          </div>
        );

      case 'changelog':
        return (
          <div className="bg-white rounded-lg border border-black/10 p-3.5 shadow-xs space-y-2 font-sans">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <span className="text-xs font-semibold text-zinc-900 font-mono uppercase tracking-wider">
                Nhật Ký Nâng Cấp Bản Build v2.4
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-medium">
                Mới Nhất
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-700">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Thêm mục Hướng Dẫn Sử Dụng A-Z kèm mô phỏng trực quan.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Nâng cấp nút "Đổi tài khoản" & Đăng nhập Google Drive OAuth 2.0.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Biểu đồ miền Realtime quét lưu lượng TikTok, YouTube, FB 10p/lần.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Cơ chế xem/ẩn mật khẩu an toàn & 4 tệp PDF pháp lý chuẩn Times New Roman.</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render Interactive Walkthrough Simulation
  const renderInteractiveSimulation = (mod: GuideModule) => {
    const currentStep = simStep[mod.id] || 0;
    const isPlaying = isSimPlaying[mod.id] !== false;

    return (
      <div className="bg-zinc-950 text-white rounded-lg p-4 shadow-md space-y-3 font-sans border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-mono font-semibold tracking-wide text-zinc-200">
              MÔ PHỎNG THAO TÁC TRỰC QUAN (WALKTHROUGH)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSimPlay(mod.id)}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-mono flex items-center gap-1 transition cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
              <span>{isPlaying ? 'Tạm Dừng' : 'Phát Tiếp'}</span>
            </button>
            <button
              onClick={() => setSimStep((prev) => ({ ...prev, [mod.id]: 0 }))}
              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Phát lại từ đầu"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Video Simulation Canvas */}
        <div className="relative h-44 bg-zinc-900 rounded-md border border-white/10 overflow-hidden flex flex-col justify-between p-3 select-none">
          {/* Header bar of simulated browser */}
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pb-2 border-b border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
              <span className="w-2 h-2 rounded-full bg-yellow-500/80"></span>
              <span className="w-2 h-2 rounded-full bg-green-500/80"></span>
              <span className="ml-2 text-zinc-400">synapes.studio / {mod.category}</span>
            </div>
            <span className="text-emerald-400">FPS: 60 • Live Demo</span>
          </div>

          {/* Simulated step animation scene */}
          <div className="flex-1 flex items-center justify-center relative">
            {currentStep === 0 && (
              <div className="text-center space-y-2 animate-fade-in">
                <div className="inline-block px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-mono border border-white/10">
                  Bước 1: Điều hướng đến chức năng
                </div>
                <div className="text-sm font-semibold text-white">
                  {mod.steps[0]?.title || 'Bấm vào menu chức năng'}
                </div>
                {/* Pointer mouse visual */}
                <div className="relative inline-block mt-2">
                  <div className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 text-xs font-semibold shadow-lg animate-bounce">
                    👉 Bấm chọn nút thao tác tại đây
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="text-center space-y-2 animate-fade-in">
                <div className="inline-block px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-mono border border-white/10">
                  Bước 2: Điền tham số & Kiểm tra
                </div>
                <div className="text-sm font-semibold text-white">
                  {mod.steps[1]?.title || 'Nhập các thông số cần thiết'}
                </div>
                <div className="max-w-xs mx-auto text-[11px] text-zinc-400">
                  Hệ thống hỗ trợ kiểm tra tính hợp lệ tự động trước khi lưu.
                </div>
                <div className="w-36 h-1.5 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                  <div className="w-2/3 h-full bg-emerald-500 animate-pulse"></div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="text-center space-y-2 animate-fade-in">
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 text-xs font-mono border border-emerald-500/30">
                  Bước 3: Hoàn tất & Kích hoạt tự động
                </div>
                <div className="text-sm font-semibold text-emerald-300 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Thao tác đã được lưu & chạy tức thời!</span>
                </div>
                <div className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  Toàn bộ trạng thái và dữ liệu đã được đồng bộ với Cloud và cơ sở dữ liệu.
                </div>
              </div>
            )}
          </div>

          {/* Timeline progress indicator */}
          <div className="space-y-1 pt-1 border-t border-white/5">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>Tiến trình mô phỏng: Bước {currentStep + 1} / 3</span>
              <span className="text-zinc-500">Tự động chuyển cảnh sau 3s</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className={`h-1 rounded transition-all duration-300 ${currentStep >= 0 ? 'bg-emerald-400' : 'bg-zinc-800'}`}></div>
              <div className={`h-1 rounded transition-all duration-300 ${currentStep >= 1 ? 'bg-emerald-400' : 'bg-zinc-800'}`}></div>
              <div className={`h-1 rounded transition-all duration-300 ${currentStep >= 2 ? 'bg-emerald-400' : 'bg-zinc-800'}`}></div>
            </div>
          </div>
        </div>

        {/* Step controls */}
        <div className="flex items-center justify-between text-xs pt-1">
          <button
            onClick={() => setSimStep((prev) => ({ ...prev, [mod.id]: Math.max(0, currentStep - 1) }))}
            disabled={currentStep === 0}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition text-[11px]"
          >
            ← Bước Trước
          </button>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setSimStep((prev) => ({ ...prev, [mod.id]: idx }))}
                className={`w-2 h-2 rounded-full transition-all ${currentStep === idx ? 'w-5 bg-emerald-400' : 'bg-zinc-700'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setSimStep((prev) => ({ ...prev, [mod.id]: Math.min(2, currentStep + 1) }))}
            disabled={currentStep === 2}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition text-[11px]"
          >
            Bước Kế Tiếp →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in select-none max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="studio-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="btn-secondary flex items-center gap-1.5"
                title="Quay lại"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-zinc-950 tracking-tight">
                  Cẩm Nang & Hướng Dẫn Sử Dụng SYNAPES Studio (Từ A-Z)
                </h1>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">
                  Phiên Bản v2.4 (11/2026)
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                Hướng dẫn chi tiết từng tính năng, quy trình vận hành tự động hóa từ phân rã kịch bản AI, kiểm duyệt phòng dựng, theo dõi lưu lượng giờ vàng đến xuất bản và sao lưu đám mây.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 font-mono text-xs border border-black/5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>10 Module Chuẩn Nghiệp Vụ</span>
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm chức năng... (ví dụ: tạo kịch bản, giờ vàng, đổi tài khoản, google drive, stitcher)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-50 border border-black/10 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cam kết cập nhật liên tục thông báo */}
      <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-900 text-xs flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span className="leading-relaxed">
            <strong>Cam kết cập nhật liên tục:</strong> Mỗi khi hệ thống có bản nâng cấp tính năng mới hoặc thay đổi giao diện, cẩm nang Hướng dẫn sử dụng này sẽ được tự động đồng bộ để người dùng luôn nắm bắt được các bước thao tác chính xác nhất.
          </span>
        </div>
        <button
          onClick={() => setSelectedCategory('changelog')}
          className="px-2.5 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium text-[11px] whitespace-nowrap transition cursor-pointer"
        >
          Xem Nhật Ký v2.4 →
        </button>
      </div>

      {/* Guide Modules List */}
      <div className="space-y-6">
        {filteredModules.length === 0 ? (
          <div className="studio-card p-10 text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-zinc-400 mx-auto" />
            <div className="text-sm font-semibold text-zinc-800">Không tìm thấy hướng dẫn phù hợp</div>
            <div className="text-xs text-zinc-500">
              Hãy thử tìm kiếm với từ khóa khác như "Google Drive", "Đổi tài khoản", "Kịch bản" hoặc chọn lại danh mục.
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="btn-secondary mt-2 inline-flex"
            >
              Xem tất cả hướng dẫn
            </button>
          </div>
        ) : (
          filteredModules.map((mod) => {
            const currentMode = activeTabMode[mod.id] || 'mockup';

            return (
              <div
                key={mod.id}
                id={mod.id}
                className="studio-card p-5 sm:p-6 space-y-5 transition-all hover:border-black/20"
              >
                {/* Module Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-zinc-500 tracking-wider">
                        {mod.stepNumber}
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {mod.badge}
                      </span>
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-zinc-950 mt-1">
                      {mod.title}
                    </h2>
                    <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed max-w-3xl">
                      {mod.shortDesc}
                    </p>
                  </div>

                  {mod.actionLabel && (
                    <button
                      onClick={() => handleActionClick(mod.actionView)}
                      className="btn-primary self-start sm:self-auto flex items-center gap-1.5 text-xs shadow-xs"
                      title="Chuyển đến màn hình chức năng để thao tác ngay"
                    >
                      <span>{mod.actionLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 2-Column Layout: Steps Instructions on Left, Visuals/Simulation on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Numbered Step-by-Step (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                      CÁC BƯỚC THỰC HIỆN CHI TIẾT
                    </div>

                    <div className="space-y-3.5">
                      {mod.steps.map((st) => (
                        <div key={st.number} className="flex items-start gap-3 text-xs">
                          <div className="w-6 h-6 rounded-full bg-zinc-900 text-white font-mono font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                            {st.number}
                          </div>
                          <div className="space-y-1 flex-1">
                            <h3 className="font-semibold text-zinc-900 text-xs">
                              {st.title}
                            </h3>
                            <p className="text-zinc-600 leading-relaxed text-xs">
                              {st.description}
                            </p>
                            {st.note && (
                              <div className="p-2 rounded bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                                💡 <strong>Lưu ý:</strong> {st.note}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pro Tips Box */}
                    {mod.proTips && mod.proTips.length > 0 && (
                      <div className="p-3 rounded-lg bg-zinc-50 border border-black/5 text-[11px] text-zinc-600 space-y-1.5">
                        <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-zinc-800" />
                          <span>Mẹo Nghiệp Vụ & Kinh Nghiệm Tối Ưu:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-zinc-600 pl-1 leading-relaxed">
                          {mod.proTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Visual Mockup or Interactive Simulation (5 cols) */}
                  <div className="lg:col-span-5 space-y-2.5">
                    {/* Switcher Tab between Mockup and Simulation Player */}
                    <div className="flex items-center justify-between border-b border-black/5 pb-2">
                      <span className="text-[11px] font-mono text-zinc-400 font-semibold uppercase">
                        HÌNH ẢNH MINH HỌA & MÔ PHỎNG
                      </span>
                      <div className="flex items-center gap-1 p-0.5 rounded-md bg-zinc-100 border border-black/5 text-[10px]">
                        <button
                          onClick={() => setModuleTabMode(mod.id, 'mockup')}
                          className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                            currentMode === 'mockup'
                              ? 'bg-white text-zinc-900 shadow-2xs'
                              : 'text-zinc-500 hover:text-zinc-900'
                          }`}
                        >
                          📸 Ảnh Giao Diện
                        </button>
                        <button
                          onClick={() => setModuleTabMode(mod.id, 'simulation')}
                          className={`px-2 py-0.5 rounded font-medium transition cursor-pointer flex items-center gap-1 ${
                            currentMode === 'simulation'
                              ? 'bg-zinc-900 text-white shadow-2xs'
                              : 'text-zinc-500 hover:text-zinc-900'
                          }`}
                        >
                          <Play className="w-2.5 h-2.5" />
                          <span>🎬 Mô Phỏng Video</span>
                        </button>
                      </div>
                    </div>

                    {/* Content Display */}
                    <div className="transition-all">
                      {currentMode === 'mockup' ? (
                        <div className="space-y-2">
                          {renderVisualMockup(mod.mockupType)}
                          <div className="text-[10px] text-zinc-400 text-center italic">
                            Hình ảnh mô phỏng trực quan các trường nhập liệu và nút bấm thực tế trên hệ thống.
                          </div>
                        </div>
                      ) : (
                        renderInteractiveSimulation(mod)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Support Help */}
      <div className="studio-card p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-zinc-100 border border-black/5 mx-auto flex items-center justify-center text-zinc-700">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-zinc-900">
            Bạn Cần Trợ Giúp Kỹ Thuật Hoặc Hỗ Trợ Riêng?
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
            Đội ngũ kỹ sư SYNAPES luôn sẵn sàng hỗ trợ bạn qua hệ thống kiểm tra Google Sheet và kênh hỗ trợ trực tiếp.
          </p>
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => onNavigateView('pending-approval')}
            className="btn-primary text-xs"
          >
            Vào Bàn Làm Việc Studio
          </button>
          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <span>Liên Hệ Kỹ Sư Trực 24/7</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
