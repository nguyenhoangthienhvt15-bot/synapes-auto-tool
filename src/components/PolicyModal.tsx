import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink, Download, X } from 'lucide-react';

interface PolicyModalProps {
  policyType: string | null;
  onClose: () => void;
}

interface PolicyArticle {
  heading: string;
  clauses: string[];
}

interface LegalExcerpt {
  lawRef: string;
  quote: string;
}

interface PolicyDocInfo {
  id: string;
  title: string;
  shortTitle: string;
  docNumber: string;
  subHeader: string;
  pdfPath: string;
  icon: React.ComponentType<{ className?: string }>;
  recitals: string[];
  excerpts: LegalExcerpt[];
  legalHighlights: string[];
  articles: PolicyArticle[];
}

const POLICY_DOCS: Record<string, PolicyDocInfo> = {
  terms: {
    id: 'terms',
    title: 'QUY CHẾ VÀ ĐIỀU KHOẢN SỬ DỤNG DỊCH VỤ PHẦN MỀM',
    shortTitle: 'Điều khoản sử dụng',
    docNumber: 'Số: 01/2026/QĐ-SYNAPES/ĐKSD',
    subHeader: 'Ban hành Quy chế và Điều khoản sử dụng dịch vụ phần mềm tạo video tự động SYNAPES Studio',
    pdfPath: '/documents/dieu-khoan-su-dung.pdf',
    icon: FileText,
    recitals: [
      'Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24 tháng 11 năm 2015 của Quốc hội (Điều 117 về điều kiện có hiệu lực của giao dịch dân sự, Điều 385 và Điều 401 về hợp đồng dân sự);',
      'Căn cứ Luật Giao dịch điện tử số 20/2023/QH15 ngày 22 tháng 6 năm 2023 của Quốc hội (Điều 8 về giá trị pháp lý của thông điệp dữ liệu, Điều 34 và Điều 36 về giao kết, thực hiện hợp đồng điện tử);',
      'Căn cứ Luật Công nghệ thông tin số 67/2006/QH11 ngày 29 tháng 6 năm 2006 và Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15 ngày 20 tháng 6 năm 2023;',
      'Căn cứ Nghị định số 147/2024/NĐ-CP ngày 09 tháng 11 năm 2024 của Chính phủ về quản lý, cung cấp, sử dụng dịch vụ Internet và thông tin trên mạng;',
      'Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05 tháng 3 năm 2020 của Chính phủ về công tác văn thư.'
    ],
    excerpts: [
      {
        lawRef: 'Điều 117 Bộ luật Dân sự 2015 (Số 91/2015/QH13)',
        quote: 'Giao dịch dân sự có hiệu lực khi có đủ các điều kiện: a) Chủ thể có năng lực pháp luật dân sự, năng lực hành vi dân sự phù hợp; b) Chủ thể tham gia hoàn toàn tự nguyện; c) Mục đích và nội dung không vi phạm điều cấm của luật, không trái đạo đức xã hội.'
      },
      {
        lawRef: 'Điều 8 & Điều 34 Luật Giao dịch điện tử 2023 (Số 20/2023/QH15)',
        quote: 'Thông điệp dữ liệu không bị phủ nhận giá trị pháp lý chỉ vì thông điệp đó được thể hiện dưới dạng thông điệp dữ liệu. Giao kết hợp đồng điện tử là việc sử dụng thông điệp dữ liệu để tiến hành một phần hoặc toàn bộ giao dịch.'
      },
      {
        lawRef: 'Điều 385 & Điều 401 Bộ luật Dân sự 2015',
        quote: 'Hợp đồng là sự thỏa thuận giữa các bên về việc xác lập, thay đổi hoặc chấm dứt quyền, nghĩa vụ dân sự và có hiệu lực từ thời điểm giao kết hợp pháp.'
      }
    ],
    legalHighlights: [
      'Bộ luật Dân sự 2015 (Điều 117, 385, 401)',
      'Luật Giao dịch điện tử 2023 (Điều 8, 34, 36)',
      'Luật CNTT số 67/2006/QH11',
      'Nghị định 147/2024/NĐ-CP & 30/2020/NĐ-CP'
    ],
    articles: [
      {
        heading: 'Điều 1. Phạm vi điều chỉnh, Đối tượng áp dụng và Tư cách pháp lý',
        clauses: [
          '1. Quy chế này điều chỉnh quyền, nghĩa vụ và trách nhiệm pháp lý giữa Đơn vị vận hành Hệ thống SYNAPES Auto Video Studio (Bên A) và Tổ chức/Cá nhân đăng ký sử dụng phần mềm hợp lệ (Bên B/Người dùng) thông qua giao kết Hợp đồng điện tử hai tầng xác thực.',
          '2. Người dùng khi kích hoạt Mã định danh (User Code) hoặc ký duyệt Hợp đồng điện tử phải có đầy đủ năng lực hành vi dân sự theo quy định tại Điều 19, Điều 20 và Điều 117 Bộ luật Dân sự năm 2015.',
          '3. Toàn bộ thông điệp dữ liệu, nhật ký phê duyệt hợp đồng 02 lần và hồ sơ xác thực Căn cước công dân (CCCD) có giá trị pháp lý tương đương văn bản giấy theo Điều 8 và Điều 34 Luật Giao dịch điện tử số 20/2023/QH15.'
        ]
      },
      {
        heading: 'Điều 2. Quản lý tài khoản, Chế độ bảo mật mật khẩu và Giới hạn truy cập',
        clauses: [
          '1. Mỗi Mã định danh (định dạng chuẩn SNP_XXXXXXXXXX) chỉ được cấp phát duy nhất cho một chủ thể hợp đồng và được bảo vệ bằng mật khẩu cá nhân hóa do người dùng tự thiết lập ngay sau lần đăng nhập đầu tiên.',
          '2. Nhằm ngăn chặn hành vi dò quét mật khẩu trái phép (Brute-force Attack) theo yêu cầu bảo đảm an toàn thông tin tại Luật An toàn thông tin mạng 2015, hệ thống áp dụng giới hạn đổi mật khẩu tối đa 03 lần/24 giờ; mọi mật khẩu mặc định ban đầu bị vô hiệu hóa hoàn toàn sau khi kích hoạt.',
          '3. Người dùng chịu trách nhiệm tự bảo quản thông tin định danh và thông báo ngay cho Ban Quản trị khi phát hiện dấu hiệu truy cập bất thường.'
        ]
      },
      {
        heading: 'Điều 3. Cơ chế tự quản khóa API (BYOK) và Quy chuẩn kết nối dịch vụ thứ ba',
        clauses: [
          '1. Hệ thống vận hành theo kiến trúc BYOK (Bring Your Own Key): Người dùng tự trang bị và kiểm soát khóa kết nối tới các nhà cung cấp mô hình trí tuệ nhân tạo (Google Gemini, OpenAI, Anthropic Claude, DeepSeek, xAI Grok, ElevenLabs hoặc Webhook Plugin riêng).',
          '2. Phần mềm chỉ đóng vai trò công cụ trung gian kỹ thuật truyền tải yêu cầu theo đúng chỉ thị của chủ tài khoản; Đơn vị vận hành không thu giữ, không bán hoặc sử dụng trái phép hạn mức (Quota) API Key của người dùng.',
          '3. Người dùng có nghĩa vụ tuân thủ chính sách sử dụng hợp lệ (Acceptable Use Policy) của từng nhà cung cấp API thứ ba và quy định quản lý thông tin trên mạng tại Nghị định số 147/2024/NĐ-CP.'
        ]
      },
      {
        heading: 'Điều 4. Điều khoản thi hành, Luật áp dụng và Cơ chế giải quyết tranh chấp',
        clauses: [
          '1. Quy chế này có hiệu lực thi hành kể từ ngày ký ban hành và được công bố đồng nhất trên giao diện phần mềm trực tuyến cũng như bản lưu trữ PDF chuẩn hóa.',
          '2. Mọi tranh chấp phát sinh trước hết được giải quyết thông qua thương lượng, hòa giải trong thời hạn 30 ngày; trường hợp không đạt được thỏa thuận sẽ đưa ra giải quyết tại Tòa án nhân dân có thẩm quyền tại TP. Hồ Chí Minh.'
        ]
      }
    ]
  },
  privacy: {
    id: 'privacy',
    title: 'CHÍNH SÁCH BẢO VỆ DỮ LIỆU CÁ NHÂN & AN TOÀN BẢO MẬT TOKEN API',
    shortTitle: 'Bảo mật dữ liệu & Token',
    docNumber: 'Số: 02/2026/CSBM-SYNAPES/DATA-API',
    subHeader: 'Ban hành Chính sách bảo vệ dữ liệu cá nhân và an toàn bảo mật khóa API trên hệ thống SYNAPES Studio',
    pdfPath: '/documents/bao-mat-du-lieu.pdf',
    icon: ShieldCheck,
    recitals: [
      'Căn cứ Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam năm 2013 (Điều 21 về quyền bất khả xâm phạm về đời sống riêng tư, bí mật cá nhân và bí mật gia đình);',
      'Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24 tháng 11 năm 2015 (Điều 38 về quyền về đời sống riêng tư, bí mật cá nhân);',
      'Căn cứ Luật An toàn thông tin mạng số 86/2015/QH13 (Điều 16, Điều 17, Điều 18 và Điều 19 về bảo vệ thông tin cá nhân trên mạng);',
      'Căn cứ Luật An ninh mạng số 24/2018/QH14 (Điều 26 về bảo đảm an toàn thông tin trên không gian mạng);',
      'Căn cứ Nghị định số 13/2023/NĐ-CP ngày 17 tháng 4 năm 2023 của Chính phủ về bảo vệ dữ liệu cá nhân (Điều 3, Điều 9, Điều 11, Điều 26 và Điều 27).'
    ],
    excerpts: [
      {
        lawRef: 'Điều 3 Nghị định số 13/2023/NĐ-CP',
        quote: 'Dữ liệu cá nhân chỉ được xử lý đúng với mục đích đã được Bên Kiểm soát dữ liệu cá nhân, Bên Xử lý dữ liệu cá nhân đăng ký, tuyên bố về xử lý dữ liệu cá nhân và có sự đồng ý của chủ thể dữ liệu.'
      },
      {
        lawRef: 'Điều 9 Nghị định số 13/2023/NĐ-CP',
        quote: 'Chủ thể dữ liệu có đầy đủ: 1. Quyền được biết; 2. Quyền đồng ý; 3. Quyền truy cập, chỉnh sửa; 4. Quyền rút lại sự đồng ý; 5. Quyền xóa dữ liệu; 6. Quyền hạn chế xử lý dữ liệu; 7. Quyền được cung cấp dữ liệu.'
      },
      {
        lawRef: 'Điều 17 Luật An toàn thông tin mạng số 86/2015/QH13',
        quote: 'Không được cung cấp, chia sẻ, phát tán thông tin cá nhân đã thu thập, tiếp cận, kiểm soát cho bên thứ ba, trừ trường hợp có sự đồng ý của chủ thể thông tin cá nhân.'
      }
    ],
    legalHighlights: [
      'Nghị định 13/2023/NĐ-CP (Điều 3, 9, 11, 26, 27)',
      'Luật ATTT mạng 2015 (Điều 16–19)',
      'Luật An ninh mạng 2018 (Điều 26)',
      'Bộ luật Dân sự 2015 (Điều 38)'
    ],
    articles: [
      {
        heading: 'Điều 1. Phạm vi thu thập dữ liệu cá nhân và Mục đích xử lý hợp pháp',
        clauses: [
          '1. Hệ thống chỉ thu thập các thông tin định danh cần thiết để xác lập Hợp đồng điện tử bao gồm: Họ và tên, Số Căn cước công dân (CCCD), Số điện thoại, Địa chỉ thư điện tử, Địa chỉ liên hệ và Thông tin tài khoản thanh toán đối soát.',
          '2. Việc xử lý dữ liệu tuân thủ tuyệt đối nguyên tắc giới hạn mục đích quy định tại Điều 3 Nghị định số 13/2023/NĐ-CP và Điều 17 Luật An toàn thông tin mạng số 86/2015/QH13.'
        ]
      },
      {
        heading: 'Điều 2. Biện pháp kỹ thuật mã hóa mật khẩu, Phân vùng dữ liệu và Bảo vệ Token API',
        clauses: [
          '1. Mật khẩu cá nhân của người dùng được băm một chiều có muối (BCRYPT$ SHA-256 Salted Hash) trước khi lưu trữ; tuyệt đối không lưu mật khẩu cá nhân dạng văn bản thuần.',
          '2. Toàn bộ dự án kịch bản, cấu hình giọng đọc, lịch phát sóng và khóa BYOK API của từng Mã Code được cô lập trong không gian lưu trữ riêng biệt, kết hợp chữ ký phiên HMAC-SHA256.',
          '3. Các khóa API Key do người dùng nhập chỉ được truyền qua kết nối mã hóa TLS/HTTPS trực tiếp đến điểm cuối của nhà cung cấp AI khi thực thi tác vụ.'
        ]
      },
      {
        heading: 'Điều 3. Quyền của Chủ thể dữ liệu theo Điều 9 Nghị định số 13/2023/NĐ-CP',
        clauses: [
          '1. Chủ tài khoản có đầy đủ các quyền được biết, quyền đồng ý, quyền truy cập, quyền chỉnh sửa, quyền xuất toàn bộ dữ liệu dự án ra tệp JSON/Google Drive cá nhân và quyền yêu cầu xóa vĩnh viễn dữ liệu.',
          '2. Khi nhận được yêu cầu xóa dữ liệu hợp lệ của chủ tài khoản, hệ thống thực hiện xóa bỏ thông tin lưu trữ trong vòng 72 giờ theo đúng khoản 5 Điều 9 và Điều 16 Nghị định số 13/2023/NĐ-CP.'
        ]
      },
      {
        heading: 'Điều 4. Cam kết không chia sẻ dữ liệu cho bên thứ ba và Trách nhiệm thông báo sự cố',
        clauses: [
          '1. Đơn vị vận hành cam kết không mua bán, trao đổi hoặc chuyển giao dữ liệu cá nhân và kịch bản của người dùng cho bất kỳ bên thứ ba nào.',
          '2. Trường hợp phát hiện sự cố xâm phạm dữ liệu cá nhân, Ban Quản trị kích hoạt quy trình ứng cứu và thông báo theo Điều 23 Nghị định số 13/2023/NĐ-CP.'
        ]
      }
    ]
  },
  copyright: {
    id: 'copyright',
    title: 'QUY ĐỊNH BẢO HỘ QUYỀN SỞ HỮU TRÍ TUỆ ĐỐI VỚI KỊCH BẢN & NỘI DUNG SỐ',
    shortTitle: 'Quyền sở hữu trí tuệ kịch bản',
    docNumber: 'Số: 03/2026/SHTT-SYNAPES/BQUYEN',
    subHeader: 'Ban hành Quy định bảo hộ quyền sở hữu trí tuệ đối với kịch bản, giọng nói và nội dung số trên SYNAPES Studio',
    pdfPath: '/documents/so-huu-tri-tue.pdf',
    icon: CheckCircle2,
    recitals: [
      'Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24 tháng 11 năm 2015 (Điều 32 về quyền của cá nhân đối với hình ảnh và Phần thứ tư về Quyền sở hữu trí tuệ);',
      'Căn cứ Luật Sở hữu trí tuệ số 50/2005/QH11, được sửa đổi, bổ sung bởi Luật số 36/2009/QH12, Luật số 42/2019/QH14 và Luật số 07/2022/QH15 ngày 16 tháng 6 năm 2022;',
      'Căn cứ Nghị định số 17/2023/NĐ-CP ngày 26 tháng 4 năm 2023 của Chính phủ quy định chi tiết thi hành Luật Sở hữu trí tuệ về quyền tác giả, quyền liên quan;',
      'Căn cứ Công ước Berne về bảo hộ các tác phẩm văn học và nghệ thuật.'
    ],
    excerpts: [
      {
        lawRef: 'Điều 14 & Điều 20 Luật Sở hữu trí tuệ (Luật sửa đổi số 07/2022/QH15)',
        quote: 'Tác phẩm được bảo hộ bao gồm tác phẩm điện ảnh, bản ghi âm, ghi hình, chương trình máy tính. Tổ chức, cá nhân đầu tư tài chính và cơ sở vật chất - kỹ thuật để sản xuất tác phẩm là chủ sở hữu các quyền tài sản tại Điều 20.'
      },
      {
        lawRef: 'Điều 25 & Điều 25a Luật Sở hữu trí tuệ (Luật số 07/2022/QH15)',
        quote: 'Các trường hợp ngoại lệ không xâm phạm quyền tác giả bao gồm trích dẫn hợp lý tác phẩm mà không làm sai ý tác giả để bình luận, giới thiệu hoặc minh họa trong tác phẩm của mình và phải ghi rõ nguồn, tên tác giả.'
      },
      {
        lawRef: 'Điều 32 Bộ luật Dân sự 2015',
        quote: 'Cá nhân có quyền đối với hình ảnh của mình. Việc sử dụng hình ảnh, giọng nói của cá nhân phải được người đó đồng ý hợp pháp.'
      }
    ],
    legalHighlights: [
      'Luật SHTT 2005 & Luật số 07/2022/QH15 (Điều 14, 20, 25)',
      'Nghị định 17/2023/NĐ-CP',
      'Bộ luật Dân sự 2015 (Điều 32)',
      'Công ước Berne & Giấy phép MIT'
    ],
    articles: [
      {
        heading: 'Điều 1. Quyền sở hữu đối với kịch bản, bản ghi âm thuyết minh và video thành phẩm',
        clauses: [
          '1. Chủ tài khoản hợp lệ (Người dùng) là chủ sở hữu hợp pháp đối với toàn bộ kịch bản phân cảnh, bản thu âm giọng đọc, phụ đề và tệp video thành phẩm được tạo ra từ ý tưởng, dữ liệu đầu vào và khóa API riêng của mình theo nguyên tắc tại Điều 20 Luật Sở hữu trí tuệ.',
          '2. Người dùng có toàn quyền công bố, phân phối và khai thác thương mại tác phẩm video trên các nền tảng mạng xã hội (YouTube, TikTok, Facebook, Instagram) mà không phải trả thêm phí bản quyền phần mềm ngoài giá trị hợp đồng đã ký kết.'
        ]
      },
      {
        heading: 'Điều 2. Quy định đạo đức và Pháp lý khi nhân bản giọng nói (Voice Cloning) & Hình ảnh',
        clauses: [
          '1. Khi sử dụng phân hệ VoiceStudio ULTRA hoặc công cụ nhân bản video (Video Cloner BYOK), Người dùng cam kết chỉ sử dụng mẫu giọng nói, hình ảnh của chính mình hoặc đã có sự đồng ý bằng văn bản của chủ thể có quyền theo Điều 32 Bộ luật Dân sự 2015 và Nghị định 13/2023/NĐ-CP.',
          '2. Nghiêm cấm mọi hành vi giả mạo giọng nói, hình ảnh của lãnh đạo Đảng, Nhà nước, cơ quan công quyền hoặc cá nhân/tổ chức khác nhằm mục đích lừa đảo, bôi nhọ danh dự.'
        ]
      },
      {
        heading: 'Điều 3. Tuân thủ giấy phép mã nguồn mở (MIT) và Tư liệu Wikimedia Commons',
        clauses: [
          '1. Các thư viện đồ họa và hoạt hình tích hợp trong lõi trình duyệt của hệ thống (Three.js, Rough.js, GL-Transitions, Lottie-Web) được sử dụng theo giấy phép mã nguồn mở MIT hợp lệ.',
          '2. Đối với tư liệu trích xuất từ Wikimedia Commons hoặc nguồn báo chí công cộng, Người dùng có trách nhiệm kiểm tra phạm vi trích dẫn hợp lý theo Điều 25 Luật Sở hữu trí tuệ (sửa đổi năm 2022).'
        ]
      },
      {
        heading: 'Điều 4. Bảo hộ mã nguồn phần mềm SYNAPES Studio',
        clauses: [
          'Toàn bộ kiến trúc mã nguồn, giao diện thiết kế, quy trình kiểm duyệt hợp đồng 2 tầng và cơ chế bảo mật của nền tảng SYNAPES Auto Video Studio được bảo hộ theo Điều 14 và Điều 198 Luật Sở hữu trí tuệ.'
        ]
      }
    ]
  },
  disclaimer: {
    id: 'disclaimer',
    title: 'QUY CHẾ PHÊ DUYỆT KIỂM SOÁT NỘI DUNG & MIỄN TRỪ TRÁCH NHIỆM PHÁP LÝ',
    shortTitle: 'Phê duyệt & Miễn trừ trách nhiệm',
    docNumber: 'Số: 04/2026/QC-SYNAPES/PD-MTTN',
    subHeader: 'Ban hành Quy chế phê duyệt kiểm soát nội dung (Human-in-the-loop) và Miễn trừ trách nhiệm pháp lý',
    pdfPath: '/documents/mien-tru-trach-nhiem.pdf',
    icon: AlertCircle,
    recitals: [
      'Căn cứ Luật An ninh mạng số 24/2018/QH14 ngày 12 tháng 6 năm 2018 của Quốc hội (Điều 8 về các hành vi bị nghiêm cấm và Điều 16 về phòng ngừa, xử lý thông tin vi phạm pháp luật trên không gian mạng);',
      'Căn cứ Luật Công nghệ thông tin số 67/2006/QH11 (Điều 12 và Điều 22 về trách nhiệm của tổ chức, cá nhân cung cấp dịch vụ trung gian);',
      'Căn cứ Bộ luật Dân sự số 91/2015/QH13 (Điều 584 và Điều 585 về căn cứ phát sinh và nguyên tắc bồi thường thiệt hại ngoài hợp đồng);',
      'Căn cứ Nghị định số 147/2024/NĐ-CP ngày 09 tháng 11 năm 2024 của Chính phủ về quản lý, cung cấp, sử dụng dịch vụ Internet và thông tin trên mạng.'
    ],
    excerpts: [
      {
        lawRef: 'Khoản 1 Điều 8 Luật An ninh mạng số 24/2018/QH14',
        quote: 'Nghiêm cấm sử dụng không gian mạng để tuyên truyền chống Nhà nước; xuyên tạc lịch sử, phủ nhận thành tựu cách mạng; đưa thông tin sai sự thật gây hoang mang trong Nhân dân, gây thiệt hại cho hoạt động kinh tế - xã hội.'
      },
      {
        lawRef: 'Khoản 3 Điều 16 Luật An ninh mạng số 24/2018/QH14',
        quote: 'Thông tin trên không gian mạng có nội dung bịa đặt, sai sự thật xâm phạm nhân phẩm, danh dự, uy tín của người khác hoặc gây thiệt hại đến quyền và lợi ích hợp pháp của cơ quan, tổ chức, cá nhân khác thì người đưa thông tin phải gỡ bỏ và chịu trách nhiệm trước pháp luật.'
      }
    ],
    legalHighlights: [
      'Luật An ninh mạng 2018 (Khoản 1 Điều 8 & Khoản 3 Điều 16)',
      'Luật CNTT 2006 (Điều 12 & Điều 22)',
      'Nghị định 147/2024/NĐ-CP',
      'Bộ luật Dân sự 2015 (Điều 584, 585)'
    ],
    articles: [
      {
        heading: 'Điều 1. Cơ chế bắt buộc Con người kiểm duyệt cuối cùng (Human-in-the-loop)',
        clauses: [
          '1. Hệ thống SYNAPES Studio thiết kế chốt chặn kỹ thuật bắt buộc: Mọi kịch bản và sản phẩm video do trí tuệ nhân tạo (AI) khởi tạo đều phải chuyển về Hàng Chờ Duyệt (Trình Duyệt Kịch Bản) và không tự động phát tán lên mạng xã hội nếu chưa có thao tác nhấn phê duyệt của Chủ tài khoản.',
          '2. Trước khi nhấn nút "Duyệt Đăng Ngay" hoặc "Xuất Video", Người dùng có nghĩa vụ kiểm tra toàn diện tính chính xác của số liệu, câu chữ thuyết minh, hình ảnh minh họa và âm thanh.'
        ]
      },
      {
        heading: 'Điều 2. Các nội dung bị nghiêm cấm khởi tạo và phát tán trên hệ thống',
        clauses: [
          '1. Nghiêm cấm sử dụng phần mềm để biên tập, sản xuất hoặc phát tán các nội dung vi phạm Điều 8 và Điều 16 Luật An ninh mạng năm 2018, bao gồm: thông tin chống phá Nhà nước, xuyên tạc lịch sử, bịa đặt tin giả gây hoang mang dư luận, xúc phạm danh dự cá nhân/tổ chức.',
          '2. Hệ thống tích hợp bộ lọc từ khóa cảnh báo an toàn tự động; tuy nhiên trách nhiệm pháp lý cuối cùng đối với nội dung xuất bản thuộc về Chủ tài khoản trực tiếp khởi tạo và phê duyệt.'
        ]
      },
      {
        heading: 'Điều 3. Phạm vi miễn trừ trách nhiệm pháp lý đối với Đơn vị cung cấp công cụ phần mềm',
        clauses: [
          '1. Đơn vị phát triển phần mềm cung cấp giải pháp công nghệ tự động hóa theo mô hình BYOK và được miễn trừ trách nhiệm dân sự, hành chính đối với các thiệt hại phát sinh do Người dùng cố ý nhập câu lệnh (Prompt) vi phạm pháp luật hoặc tự ý bỏ qua bước kiểm chứng thực tế trước khi đăng tải.',
          '2. Quy chế này có hiệu lực ràng buộc đối với mọi tài khoản truy cập hệ thống kể từ thời điểm đăng nhập thành công.'
        ]
      }
    ]
  }
};

export const PolicyModal: React.FC<PolicyModalProps> = ({ policyType, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>(policyType || 'terms');

  useEffect(() => {
    if (policyType && POLICY_DOCS[policyType]) {
      setActiveTab(policyType);
    }
  }, [policyType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!policyType) return null;

  const currentDoc = POLICY_DOCS[activeTab] || POLICY_DOCS.terms;
  const DocIcon = currentDoc.icon;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl border border-black/10 max-w-5xl w-full h-[90vh] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="px-5 py-3.5 bg-zinc-50/80 border-b border-black/5 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center flex-shrink-0">
              <DocIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-semibold text-zinc-900 truncate tracking-tight uppercase">
                  {currentDoc.title}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                  {currentDoc.docNumber}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                Văn bản pháp quy chuẩn Nghị định 30/2020/NĐ-CP • Phông chữ Times New Roman
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={currentDoc.pdfPath}
              download
              title="Tải tệp PDF chuẩn Times New Roman về máy"
              className="btn-secondary py-1 px-2.5 text-xs inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Tải PDF</span>
            </a>
            <a
              href={currentDoc.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở PDF trong tab mới"
              className="btn-primary py-1 px-2.5 text-xs inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mở Tab Mới</span>
            </a>
            <button
              onClick={onClose}
              title="Đóng (Esc)"
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="px-5 py-2 bg-white border-b border-black/5 flex items-center gap-1.5 overflow-x-auto flex-shrink-0 scrollbar-none">
          {Object.values(POLICY_DOCS).map((doc) => {
            const isSelected = doc.id === activeTab;
            const TabIcon = doc.icon;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveTab(doc.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${isSelected
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                  }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{doc.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Uniform A4 Document Reader in Strict Times New Roman (Nghị định 30/2020/NĐ-CP) */}
        <div className="flex-1 bg-zinc-200/70 p-3 sm:p-5 overflow-y-auto min-h-0" data-testid="policy-document-viewer">
          <div
            className="mx-auto max-w-3xl bg-white rounded-sm border border-black/20 shadow-md p-6 sm:p-12 space-y-5 text-black"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            {/* Official Header Block per Nghị định 30/2020/NĐ-CP */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pb-3 text-center">
              <div className="sm:col-span-5 space-y-0.5">
                <div className="text-[12px] uppercase tracking-tight">
                  HỆ THỐNG SYNAPES AUTO VIDEO STUDIO
                </div>
                <div className="text-[12.5px] font-bold uppercase">
                  BAN CHUYỂN ĐỔI SỐ &amp; TRÍ TUỆ NHÂN TẠO
                </div>
                <div className="w-24 h-[1px] bg-black mx-auto my-1" />
                <div className="text-[12.5px]">{currentDoc.docNumber}</div>
              </div>
              <div className="sm:col-span-7 space-y-0.5">
                <div className="text-[12.5px] font-bold uppercase">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-[13.5px] font-bold">
                  Độc lập - Tự do - Hạnh phúc
                </div>
                <div className="w-40 h-[1px] bg-black mx-auto my-1" />
                <div className="text-[12.5px] italic">
                  Thành phố Hồ Chí Minh, ngày 18 tháng 11 năm 2026
                </div>
              </div>
            </div>

            {/* Title & Subheader */}
            <div className="text-center space-y-1 pt-1">
              <div className="text-[14px] font-bold uppercase">QUYẾT ĐỊNH</div>
              <h1 className="text-base sm:text-[17px] font-bold leading-snug uppercase">
                {currentDoc.title}
              </h1>
              <p className="text-[13px] font-bold">({currentDoc.subHeader})</p>
              <div className="w-32 h-[1px] bg-black mx-auto mt-2" />
            </div>

            {/* Legal Recitals (Căn cứ ban hành) */}
            <div className="space-y-1.5 text-[13.5px] leading-relaxed italic text-justify">
              {currentDoc.recitals.map((rec, idx) => (
                <p key={idx} className="indent-6">
                  {rec}
                </p>
              ))}
            </div>

            {/* Statutory Excerpts Table (Trích lục điều khoản pháp luật) */}
            <div className="space-y-2 pt-1">
              <div className="text-[13.5px] font-bold uppercase">
                I. TRÍCH LỤC CÁC ĐIỀU KHOẢN PHÁP LUẬT TRỌNG TÂM VIỆN DẪN
              </div>
              <table className="w-full border-collapse border border-black text-[12.5px]">
                <thead>
                  <tr className="bg-zinc-100">
                    <th className="border border-black p-2 text-center font-bold w-1/3">
                      Văn bản &amp; Điều khoản viện dẫn
                    </th>
                    <th className="border border-black p-2 text-center font-bold w-2/3">
                      Nội dung trích lục nguyên tắc pháp lý áp dụng
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentDoc.excerpts.map((ex, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-2 font-bold align-top">{ex.lawRef}</td>
                      <td className="border border-black p-2 italic text-justify align-top">
                        &ldquo;{ex.quote}&rdquo;
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detailed Articles */}
            <div className="space-y-3.5 pt-1 text-[14px] leading-relaxed">
              <div className="text-[13.5px] font-bold uppercase">
                II. NỘI DUNG QUY ĐỊNH CHI TIẾT
              </div>
              {currentDoc.articles.map((art, i) => (
                <div key={i} className="space-y-1.5">
                  <h2 className="font-bold text-black">{art.heading}</h2>
                  {art.clauses.map((cl, cIdx) => (
                    <p key={cIdx} className="text-black text-justify indent-6">
                      {cl}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            {/* Official Nơi nhận & Red Stamp Signature Block */}
            <div className="pt-5 border-t border-black/20 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              <div className="text-[12px] space-y-1">
                <div className="font-bold italic">Nơi nhận:</div>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>Các Tổ chức/Cá nhân sử dụng hệ thống (để thực hiện);</li>
                  <li>Cổng công bố văn bản pháp quy điện tử SYNAPES Studio;</li>
                  <li>Hệ thống lưu trữ Hợp đồng điện tử 2 tầng;</li>
                  <li>Lưu: VT, Ban CĐS&amp;TTNT ({currentDoc.docNumber}).</li>
                </ul>
              </div>
              <div className="text-center space-y-1">
                <div className="text-[12.5px] font-bold uppercase">
                  TM. BAN CHUYỂN ĐỔI SỐ &amp; TRÍ TUỆ NHÂN TẠO
                </div>
                <div className="text-[12px] italic">TRƯỞNG BAN</div>
                <img
                  src="/stamp-truong-ban.png"
                  alt="Con dấu đỏ KS. Nguyễn Hoàng Thiện"
                  className="w-28 h-28 mx-auto object-contain opacity-95"
                />
                <div className="text-[13.5px] font-bold text-black">KS. Nguyễn Hoàng Thiện</div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal citations footer */}
        <div className="px-5 py-2.5 bg-zinc-50/90 border-t border-black/5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 text-[11px] text-zinc-600">
          <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
            <span className="font-medium text-zinc-800 flex-shrink-0">Căn cứ tham chiếu:</span>
            {currentDoc.legalHighlights.map((law, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-white border border-zinc-200 text-zinc-700 whitespace-nowrap text-[10px]"
              >
                {law}
              </span>
            ))}
          </div>
          <button
            onClick={onClose}
            className="btn-secondary py-1 px-3 text-xs flex-shrink-0 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
