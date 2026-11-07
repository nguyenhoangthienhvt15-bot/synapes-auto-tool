import http from 'http';
import https from 'https';
import crypto from 'crypto';

// ============================================================================
// 1. CURATED MULTI-DOMAIN HIGH-RESOLUTION PHOTOGRAPHY POOLS (ZERO IPHONE POLLUTION)
// ============================================================================
export const DOMAIN_PHOTO_POOLS = {
  geopolitics: [
    {
      title: 'Tàu sân bay & Hạm đội Hải quân tuần tra vùng biển chiến lược',
      url: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1400&q=85',
      source: 'Defense & Naval Photojournalism',
    },
    {
      title: 'Tiêm kích phản lực tuần tra không phận chiến lược lúc hoàng hôn',
      url: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=1400&q=85',
      source: 'Military Aviation Press',
    },
    {
      title: 'Trung tâm chỉ huy & Bản đồ địa chính trị toàn cầu trực tuyến',
      url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1400&q=85',
      source: 'Global Intelligence & Radar Archive',
    },
    {
      title: 'Hội nghị ngoại giao quốc tế & Cờ các quốc gia tại bàn đàm phán',
      url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1400&q=85',
      source: 'International Diplomacy Archive',
    },
    {
      title: 'Trường quay Bản tin Thời sự Quốc tế 24h trực tiếp',
      url: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=85',
      source: 'Broadcast News Studio',
    },
    {
      title: ' Toàn cảnh Trung Đông & Vịnh Ba Tư nhìn từ vệ tinh quỹ đạo',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=85',
      source: 'Orbital Earth Observation',
    },
    {
      title: 'Thị trường dầu mỏ & Năng lượng chiến lược toàn cầu trước biến động',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=85',
      source: 'Global Energy Infrastructure',
    },
    {
      title: 'Họp báo khẩn cấp & Truyền thông quốc tế đưa tin nóng',
      url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=85',
      source: 'World Press Wire',
    },
  ],
  news: [
    {
      title: 'Phòng điều khiển truyền hình trực tiếp Bản tin 24h',
      url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1400&q=85',
      source: 'Broadcast Newsroom HD',
    },
    {
      title: 'Toàn cảnh đô thị hiện đại & Dòng chảy tin tức thời sự',
      url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=85',
      source: 'Metropolitan Press Archive',
    },
    {
      title: 'Bản đồ kết nối dữ liệu toàn cầu từ không gian',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=85',
      source: 'Global Network Satellite',
    },
    {
      title: 'Tổng hợp báo chí & Phân tích chuyên sâu sự kiện nóng',
      url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=85',
      source: 'Editorial News Desk',
    },
    {
      title: 'Trung tâm hành chính & Chính sách quốc gia',
      url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1400&q=85',
      source: 'Public Affairs Photography',
    },
    {
      title: 'Ống kính phóng viên hiện trường tác nghiệp trực tiếp',
      url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=85',
      source: 'Press Photojournalism',
    },
  ],
  finance: [
    {
      title: 'Bảng điện tử Giao dịch Chứng khoán & Tài chính Quốc tế',
      url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=85',
      source: 'Financial Markets Terminal',
    },
    {
      title: 'Dự trữ Vàng miếng & Tài sản trú ẩn an toàn toàn cầu',
      url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1400&q=85',
      source: 'Bullion & Commodities Vault',
    },
    {
      title: 'Trung tâm Tài chính Ngân hàng & Tòa tháp Phố Wall',
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=85',
      source: 'Global Banking District',
    },
    {
      title: 'Phân tích dữ liệu vĩ mô, Lãi suất & Dòng vốn đầu tư',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=85',
      source: 'Macroeconomic Analytics',
    },
    {
      title: 'Cảng biển Logistics & Chuỗi cung ứng thương mại thế giới',
      url: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1400&q=85',
      source: 'Global Trade & Shipping',
    },
    {
      title: 'Đồng tiền số & Hạ tầng thanh toán tài chính thế hệ mới',
      url: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1400&q=85',
      source: 'Digital Asset Exchange',
    },
  ],
  science: [
    {
      title: 'Tinh vân Vũ trụ sâu thẳm & Khám phá Thiên văn học',
      url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=85',
      source: 'Deep Space Observatory',
    },
    {
      title: 'Tên lửa đẩy phóng lên quỹ đạo Trái Đất',
      url: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=1400&q=85',
      source: 'Aerospace Launch Archive',
    },
    {
      title: 'Phòng thí nghiệm Sinh học phân tử & Y học hiện đại',
      url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1400&q=85',
      source: 'Biomedical Research Lab',
    },
    {
      title: 'Trạm Vũ trụ & Góc nhìn đường chân trời Trái Đất',
      url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1400&q=85',
      source: 'Orbital Science Division',
    },
    {
      title: 'Mô phỏng Mạng thần kinh lượng tử & Khoa học dữ liệu',
      url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1400&q=85',
      source: 'Quantum Physics Visuals',
    },
    {
      title: 'Năng lượng sạch & Công nghệ bền vững tương lai',
      url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1400&q=85',
      source: 'Clean Energy Engineering',
    },
  ],
  history: [
    {
      title: 'Di sản Kiến trúc Cổ đại & Dấu ấn Văn minh Nhân loại',
      url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1400&q=85',
      source: 'World Heritage Documentary',
    },
    {
      title: 'Bản đồ Cổ & Tư liệu Lịch sử lưu trữ qua nhiều thế kỷ',
      url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1400&q=85',
      source: 'Historical Cartography Archive',
    },
    {
      title: 'Công trình Thành cổ & Chứng nhân Lịch sử hào hùng',
      url: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=85',
      source: 'Cultural Monument Archive',
    },
    {
      title: 'Thư viện Cổ điển & Kho tàng Tri thức Nhân loại',
      url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1400&q=85',
      source: 'Grand Archival Library',
    },
    {
      title: 'Bình minh trên Vùng đất Di sản Thiên nhiên & Lịch sử',
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85',
      source: 'Epic Documentary Cinema',
    },
    {
      title: 'Hiện vật Khảo cổ & Nghệ thuật Điêu khắc Cổ đại',
      url: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=1400&q=85',
      source: 'Museum Antiquities Collection',
    },
  ],
  food: [
    {
      title: 'Nghệ thuật Ẩm thực truyền thống & Hương vị đặc sắc',
      url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=85',
      source: 'Culinary Cinema HD',
    },
    {
      title: 'Món ngon Đường phố nóng hổi chế biến trực tiếp trên bếp lửa',
      url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=85',
      source: 'Street Food Gastronomy',
    },
    {
      title: 'Tinh hoa Phở & Ẩm thực Á Đông đậm đà bản sắc',
      url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=1400&q=85',
      source: 'Asian Heritage Cuisine',
    },
    {
      title: 'Nguyên liệu tươi ngon tuyển chọn trong gian bếp nghệ nhân',
      url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=85',
      source: 'Fresh Harvest Kitchen',
    },
    {
      title: 'Không gian Thưởng thức Cà phê & Tráng miệng tinh tế',
      url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=85',
      source: 'Artisan Roastery & Cafe',
    },
    {
      title: 'Trình bày Bàn tiệc Ẩm thực cao cấp chuẩn nhà hàng',
      url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85',
      source: 'Fine Dining Showcase',
    },
  ],
  travel: [
    {
      title: 'Toàn cảnh Núi non & Vịnh biển kỳ vĩ nhìn từ Flycam',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=85',
      source: 'Aerial Travel Cinematography',
    },
    {
      title: 'Ruộng bậc thang & Sương sớm vùng cao nguyên hùng vĩ',
      url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=85',
      source: 'Vietnam & Asia Scenic',
    },
    {
      title: 'Bờ biển xanh ngọc bích dưới ánh nắng vàng rực rỡ',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
      source: 'Coastal Paradise HD',
    },
    {
      title: 'Phố cổ lung linh ánh đèn lồng khi màn đêm buông xuống',
      url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1400&q=85',
      source: 'Cultural Nightlife Travel',
    },
    {
      title: 'Cung đường khám phá xuyên rừng thông mờ sương',
      url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=85',
      source: 'Adventure Roadtrip',
    },
    {
      title: 'Hoàng hôn tráng lệ trên đỉnh đèo nhìn ra đại dương',
      url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=85',
      source: 'Wanderlust Cinema',
    },
  ],
  sports: [
    {
      title: 'Sân vận động rực sáng dưới dàn đèn pha đêm chung kết',
      url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1400&q=85',
      source: 'Championship Stadium Press',
    },
    {
      title: 'Khoảnh khắc bứt tốc đỉnh cao trên đường đua thể thao',
      url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1400&q=85',
      source: 'Athletic Performance HD',
    },
    {
      title: 'Trận cầu tâm điểm & Sức nóng cuồng nhiệt trên khán đài',
      url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=85',
      source: 'Football Broadcast Live',
    },
    {
      title: 'Rèn luyện thể lực & Chăm sóc sức khỏe toàn diện',
      url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=85',
      source: 'Health & Fitness Studio',
    },
  ],
  'ai-cyber': [
    {
      title: 'Trung tâm Siêu máy tính AI & Hệ thống GPU Data Center',
      url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=85',
      source: 'AI Infrastructure Cloud',
    },
    {
      title: 'Vi mạch bán dẫn Silicon tiến trình nanomet thế hệ mới',
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85',
      source: 'Semiconductor Engineering',
    },
    {
      title: 'Robot tự hành & Trí tuệ nhân tạo vật lý tương lai',
      url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1400&q=85',
      source: 'Robotics Innovation Lab',
    },
    {
      title: 'Không gian lập trình & An ninh mạng không gian số',
      url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=85',
      source: 'Cybersecurity Operations',
    },
  ],
  hardware: [
    {
      title: 'Flagship Titanium Studio Reveal (Apple Hardware)',
      url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1400&q=85',
      source: 'Flagship Hardware Studio',
    },
    {
      title: 'Super Retina XDR Zero-Bezel 120Hz OLED Display',
      url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1400&q=85',
      source: 'OLED Display Showcase',
    },
    {
      title: '2nm Silicon Neural Processor Wafer Architecture',
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85',
      source: 'Silicon Macro Lab',
    },
    {
      title: 'Triple 48MP Periscope Telephoto Camera Optics',
      url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1400&q=85',
      source: 'Optical Engineering',
    },
    {
      title: 'Silicon-Carbon Battery & MagSafe Fast Charge',
      url: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=1400&q=85',
      source: 'Hardware Architecture',
    },
    {
      title: 'Flagship Lineup Showcase on Dark Studio Pedestal',
      url: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=1400&q=85',
      source: 'Keynote Finale Studio',
    },
  ],
};

/**
 * Phân loại lĩnh vực chủ đề (Domain Classification) từ câu truy vấn Tiếng Việt / Tiếng Anh
 */
export function classifyTopicDomain(query = '') {
  const q = String(query || '').toLowerCase();

  if (
    /chiến sự|chiến tranh|quân sự|iran|israel|ukraine|nato|tên lửa|hạt nhân|biển đông|biển đỏ|biên giới|xung đột|hạm đội|tàu sân bay|không kích|cấm vận|ngoại giao|địa chính trị|lầu năm góc|trung đông|triều tiên|đài loan|war|military|missile|conflict|pentagon|navy/.test(
      q
    )
  ) {
    return 'geopolitics';
  }

  if (
    /giá vàng|chứng khoán|cổ phiếu|bitcoin|crypto|lãi suất|lạm phát|fed|ngân hàng|tỷ giá|usd|bất động sản|nhà đất|kinh tế|tài chính|thuế|thương mại|xuất khẩu|gdp|gold|stock|market|finance|economy/.test(
      q
    )
  ) {
    return 'finance';
  }

  if (
    /bản tin|thời sự|tin tức|tin nóng|điểm tin|24h|báo chí|xã hội|pháp luật|chính sách|bão|lũ|thời tiết|breaking news|news/.test(
      q
    )
  ) {
    return 'news';
  }

  if (
    /lịch sử|cổ đại|triều đại|chiến dịch|điện biên phủ|kim tự tháp|ai cập|đế chế|la mã|khảo cổ|di sản|bí ẩn|tài liệu|văn minh|history|ancient|empire|pyramid|documentary/.test(
      q
    )
  ) {
    return 'history';
  }

  if (
    /vũ trụ|sao hỏa|hố đen|thiên hà|nasa|spacex|tên lửa|khoa học|vật lý|lượng tử|y học|sinh học|dna|ung thư|sức khỏe|giấc ngủ|space|universe|mars|science|quantum|medical/.test(
      q
    )
  ) {
    return 'science';
  }

  if (
    /ẩm thực|món ăn|nấu ăn|phở|bún|cà phê|nhà hàng|đường phố|đặc sản|công thức|bếp|food|cooking|cuisine|coffee|recipe/.test(
      q
    )
  ) {
    return 'food';
  }

  if (
    /du lịch|khám phá|đà lạt|hạ long|sapa|phú quốc|hội an|nhật bản|châu âu|thiên nhiên|biển|núi|travel|nature|resort|landscape/.test(
      q
    )
  ) {
    return 'travel';
  }

  if (
    /bóng đá|thể thao|world cup|ngoại hạng anh|champions league|u23|tập gym|chạy bộ|marathon|football|soccer|sports|fitness/.test(
      q
    )
  ) {
    return 'sports';
  }

  if (
    /iphone|ipad|macbook|samsung|galaxy|xiaomi|pixel|oppo|smartphone|điện thoại|laptop|tai nghe|camera|apple/.test(
      q
    )
  ) {
    return 'hardware';
  }

  if (/ai\b|trí tuệ nhân tạo|chatgpt|gemini|claude|deepseek|robot|bán dẫn|chip|cyber|phần mềm/.test(q)) {
    return 'ai-cyber';
  }

  return 'news';
}

// ============================================================================
// 2. HTTP FETCH HELPERS & IN-MEMORY IMAGE CACHE
// ============================================================================
const IMAGE_PROXY_CACHE = new Map();

export function fetchRemoteBuffer(targetUrl, redirectsLeft = 4, timeoutMs = 8500) {
  return new Promise((resolve, reject) => {
    if (redirectsLeft <= 0) {
      reject(new Error('Too many redirects'));
      return;
    }
    const client = targetUrl.startsWith('https') ? https : http;
    const req = client.get(
      targetUrl,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
        timeout: timeoutMs,
      },
      (resp) => {
        if (resp.statusCode && resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
          const nextUrl = new URL(resp.headers.location, targetUrl).toString();
          resp.resume();
          fetchRemoteBuffer(nextUrl, redirectsLeft - 1, timeoutMs).then(resolve).catch(reject);
          return;
        }
        if (resp.statusCode !== 200) {
          resp.resume();
          reject(new Error(`Upstream status ${resp.statusCode}`));
          return;
        }
        const contentType = resp.headers['content-type'] || 'image/jpeg';
        const chunks = [];
        resp.on('data', (c) => chunks.push(c));
        resp.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType }));
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Fetch timeout'));
    });
    req.on('error', reject);
  });
}

function fetchTextUrl(targetUrl, timeoutMs = 4200) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      targetUrl,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SynapesNewsBot/3.0; +https://synapes.ai)',
          Accept: 'application/xml,text/xml,application/json,text/plain,*/*',
        },
        timeout: timeoutMs,
      },
      (resp) => {
        if (resp.statusCode && resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
          const nextUrl = new URL(resp.headers.location, targetUrl).toString();
          resp.resume();
          fetchTextUrl(nextUrl, timeoutMs).then(resolve).catch(reject);
          return;
        }
        if (resp.statusCode !== 200) {
          resp.resume();
          reject(new Error(`HTTP ${resp.statusCode}`));
          return;
        }
        const chunks = [];
        resp.on('data', (c) => chunks.push(c));
        resp.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.on('error', reject);
  });
}

// ============================================================================
// 3. LIVE GOOGLE NEWS RSS + WIKIPEDIA + WIKIMEDIA COMMONS RESEARCH ENGINE
// ============================================================================
function decodeXmlEntities(str = '') {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSearchKeywords(rawQuery = '') {
  let cleaned = String(rawQuery || '')
    .replace(/^\/[a-z0-9-_]+:\s*/i, '')
    .replace(
      /\b(tạo|làm|xây dựng|viết|dựng|bản tin|thời sự|tin tức|video|kịch bản|phân tích|tình hình|diễn biến|toàn cảnh|chi tiết|mới nhất|hiện nay|hôm nay|về|của|cho)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned || cleaned.length < 2) {
    return String(rawQuery || 'Thời sự quốc tế').trim();
  }
  return cleaned;
}

export async function fetchGoogleNewsRss(query) {
  try {
    const coreKw = extractSearchKeywords(query);
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(coreKw)}&hl=vi&gl=VN&ceid=VN:vi`;
    const xml = await fetchTextUrl(rssUrl, 4200);
    let itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    // Fallback to broader query if exact phrase returned nothing
    if (itemMatches.length === 0 && coreKw !== query) {
      const fallbackUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=vi&gl=VN&ceid=VN:vi`;
      const xml2 = await fetchTextUrl(fallbackUrl, 3800).catch(() => '');
      itemMatches = xml2.match(/<item>([\s\S]*?)<\/item>/g) || [];
    }

    const headlines = [];
    for (const itemXml of itemMatches.slice(0, 8)) {
      const rawTitle = (itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
      const rawPubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
      const rawSource = (itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || '';
      const cleanTitle = decodeXmlEntities(rawTitle).replace(/\s+-\s+[^-]+$/, '').trim();
      if (cleanTitle && cleanTitle.length > 10) {
        headlines.push({
          title: cleanTitle,
          source: decodeXmlEntities(rawSource) || 'Tin tức Quốc tế',
          pubDate: rawPubDate.trim(),
        });
      }
    }
    return headlines;
  } catch {
    return [];
  }
}

export async function fetchWikipediaContext(query, lang = 'vi') {
  try {
    const coreKw = extractSearchKeywords(query);
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      coreKw
    )}&gsrlimit=4&prop=extracts|pageimages&exintro=1&explaintext=1&exchars=550&piprop=original|thumbnail&pithumbsize=1280&format=json&origin=*`;
    const raw = await fetchTextUrl(searchUrl, 4000);
    const json = JSON.parse(raw);
    const pages = Object.values(json?.query?.pages || {});
    const extracts = [];
    const images = [];

    for (const p of pages) {
      if (p?.extract && p.extract.length > 30) {
        extracts.push(`${p.title}: ${p.extract.replace(/\s+/g, ' ').trim()}`);
      }
      const imgUrl = p?.thumbnail?.source || p?.original?.source;
      if (imgUrl && !imgUrl.endsWith('.svg') && !imgUrl.endsWith('.tif')) {
        images.push({
          id: `wiki-page-${lang}-${p.pageid}`,
          title: String(p.title || coreKw),
          url: imgUrl,
          proxyUrl: `/api/image-proxy?url=${encodeURIComponent(imgUrl)}`,
          source: `Wikipedia (${lang.toUpperCase()})`,
        });
      }
    }
    return { summary: extracts.join(' | ').slice(0, 1500), images };
  } catch {
    return { summary: '', images: [] };
  }
}

export async function searchWikimediaImages(query, limit = 8) {
  try {
    const coreKw = extractSearchKeywords(query);
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      coreKw + ' filetype:bitmap'
    )}&gsrlimit=${limit}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1280&format=json&origin=*`;
    const raw = await fetchTextUrl(apiUrl, 4200);
    const json = JSON.parse(raw);
    const pages = Object.values(json?.query?.pages || {});
    return pages
      .map((p) => {
        const ii = p?.imageinfo?.[0];
        const thumbUrl = ii?.thumburl || ii?.url;
        if (!thumbUrl || thumbUrl.endsWith('.svg') || thumbUrl.endsWith('.gif') || thumbUrl.endsWith('.tif')) {
          return null;
        }
        return {
          id: `commons-${p.pageid}`,
          title: String(p.title || '')
            .replace(/^File:/i, '')
            .replace(/\.[a-z0-9]+$/i, '')
            .replace(/_/g, ' '),
          url: thumbUrl,
          proxyUrl: `/api/image-proxy?url=${encodeURIComponent(thumbUrl)}`,
          source: 'Wikimedia Commons Press',
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// ============================================================================
// 4. NEURAL TTS SYNTHESIS ENGINE (OPENAI STUDIO + EDGE NEURAL + GOOGLE DSP)
// ============================================================================
function generateSecMsGec() {
  const WIN_EPOCH = 11644473600;
  const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
  let ticks = Math.floor(Date.now() / 1000) + WIN_EPOCH;
  ticks -= ticks % 300;
  ticks *= 10000000;
  const strToHash = `${ticks.toFixed(0)}${TRUSTED_CLIENT_TOKEN}`;
  return crypto.createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
}

async function synthesizeEdgeNeuralTts(text, voiceName, ratePct = '+0%', pitchHz = '+0Hz') {
  if (typeof WebSocket === 'undefined') {
    throw new Error('Native WebSocket not available');
  }

  return new Promise((resolve, reject) => {
    const reqId = crypto.randomUUID().replace(/-/g, '');
    const secMsGec = generateSecMsGec();
    const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-131.0.2903.51&ConnectionId=${reqId}`;

    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    const audioChunks = [];
    const timeout = setTimeout(() => {
      try { ws.close(); } catch { }
      reject(new Error('Edge TTS timeout'));
    }, 5500);

    ws.onopen = () => {
      const configMsg =
        `X-Timestamp:${new Date().toString()}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
              },
            },
          },
        });
      ws.send(configMsg);

      const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const langCode = voiceName.startsWith('en') ? 'en-US' : 'vi-VN';
      const ssml =
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${langCode}'>` +
        `<voice name='${voiceName}'>` +
        `<prosody pitch='${pitchHz}' rate='${ratePct}' volume='+0%'>${escapedText}</prosody>` +
        `</voice></speak>`;

      const ssmlMsg =
        `X-RequestId:${reqId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${new Date().toString()}Z\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml;
      ws.send(ssmlMsg);
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        if (event.data.includes('Path:turn.end')) {
          clearTimeout(timeout);
          try { ws.close(); } catch { }
          if (audioChunks.length > 0) resolve(Buffer.concat(audioChunks));
          else reject(new Error('Empty Edge TTS buffer'));
        }
      } else if (event.data instanceof ArrayBuffer) {
        const buf = Buffer.from(event.data);
        if (buf.length > 2) {
          const headerLen = buf.readUInt16BE(0);
          if (buf.length > 2 + headerLen) {
            const headerStr = buf.subarray(2, 2 + headerLen).toString('utf8');
            if (headerStr.includes('Path:audio')) {
              audioChunks.push(buf.subarray(2 + headerLen));
            }
          }
        }
      }
    };

    ws.onerror = (err) => {
      clearTimeout(timeout);
      reject(err);
    };
  });
}

function fetchGoogleNeuralTtsMp3(text, lang = 'vi') {
  return new Promise((resolve, reject) => {
    const safeText = text.slice(0, 195);
    const tl = lang.startsWith('en') ? 'en' : 'vi';
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${encodeURIComponent(safeText)}`;
    https
      .get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          },
        },
        (resp) => {
          if (resp.statusCode !== 200) {
            resp.resume();
            reject(new Error(`Google TTS status ${resp.statusCode}`));
            return;
          }
          const chunks = [];
          resp.on('data', (c) => chunks.push(c));
          resp.on('end', () => resolve(Buffer.concat(chunks)));
        }
      )
      .on('error', reject);
  });
}

function fetchOpenAiSpeech(apiKey, text, voice = 'onyx') {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      response_format: 'mp3',
    });
    const req = https.request(
      'https://api.openai.com/v1/audio/speech',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (resp) => {
        if (resp.statusCode !== 200) {
          resp.resume();
          return reject(new Error(`OpenAI TTS HTTP ${resp.statusCode}`));
        }
        const chunks = [];
        resp.on('data', (c) => chunks.push(c));
        resp.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ============================================================================
// 5. SERVER-SIDE MULTI-LLM PROXY (BYPASSES BROWSER CORS FOR CLAUDE/DEEPSEEK/GROK/GEMINI/OPENAI)
// ============================================================================
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const str = Buffer.concat(chunks).toString('utf8');
        resolve(str ? JSON.parse(str) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

async function postJsonHttps(targetUrl, headers, bodyObj, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const payload = JSON.stringify(bodyObj);
    const client = parsed.protocol === 'http:' ? http : https;

    const req = client.request(
      targetUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers,
        },
        timeout: timeoutMs,
      },
      (resp) => {
        const chunks = [];
        resp.on('data', (c) => chunks.push(c));
        resp.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({ status: resp.statusCode || 500, text });
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('LLM request timeout'));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ============================================================================
// 6. UNIFIED API ROUTE HANDLER (RETURNS true IF HANDLED, false OTHERWISE)
// ============================================================================
export async function handleStudioApiRequest(req, res) {
  const rawUrl = req.url || '/';
  const cleanUrl = rawUrl.split('?')[0].split('#')[0];

  if (!cleanUrl.startsWith('/api/')) {
    return false;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  // --------------------------------------------------------------------------
  // A. TOPIC RESEARCH ENDPOINT (/api/topic-research?q=...)
  // --------------------------------------------------------------------------
  if (cleanUrl === '/api/topic-research') {
    try {
      const parsedUrl = new URL(rawUrl, 'http://localhost');
      const q = (parsedUrl.searchParams.get('q') || '').trim();
      const domain = classifyTopicDomain(q);

      const [headlines, viWiki, enWiki, commonsImgs] = await Promise.all([
        fetchGoogleNewsRss(q),
        fetchWikipediaContext(q, 'vi'),
        fetchWikipediaContext(q, 'en'),
        searchWikimediaImages(q, 8),
      ]);

      const domainPool = (DOMAIN_PHOTO_POOLS[domain] || DOMAIN_PHOTO_POOLS.news).map((item, idx) => ({
        id: `domain-${domain}-${idx}`,
        title: item.title,
        url: item.url,
        proxyUrl: `/api/image-proxy?domain=${domain}&idx=${idx}&url=${encodeURIComponent(item.url)}`,
        source: item.source,
      }));

      const realVisuals = [...viWiki.images, ...enWiki.images, ...commonsImgs];
      const mergedVisuals = [...realVisuals, ...domainPool];

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          query: q,
          domain,
          headlines,
          wikiSummary: [viWiki.summary, enWiki.summary].filter(Boolean).join('\n'),
          visuals: mergedVisuals.slice(0, 14),
        })
      );
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          query: '',
          domain: 'news',
          headlines: [],
          wikiSummary: '',
          visuals: [],
          error: String(err),
        })
      );
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // B. MULTI-DOMAIN INTERNET IMAGE SEARCH (/api/image-search?q=...)
  // --------------------------------------------------------------------------
  if (cleanUrl === '/api/image-search') {
    try {
      const parsedUrl = new URL(rawUrl, 'http://localhost');
      const q = (parsedUrl.searchParams.get('q') || 'Tin tức thế giới').trim();
      const domain = classifyTopicDomain(q);

      const [viWiki, commonsResults] = await Promise.all([
        fetchWikipediaContext(q, 'vi'),
        searchWikimediaImages(q, 10),
      ]);

      const domainMatches = (DOMAIN_PHOTO_POOLS[domain] || DOMAIN_PHOTO_POOLS.news).map((item, idx) => ({
        id: `curated-${domain}-${idx}`,
        title: item.title,
        url: item.url,
        proxyUrl: `/api/image-proxy?domain=${domain}&idx=${idx}&url=${encodeURIComponent(item.url)}`,
        source: item.source,
      }));

      // Also generate 2 custom AI Flux scene renders via Pollinations proxy
      const aiGenerated = [1, 2].map((seedOffset) => {
        const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          `Cinematic photojournalism broadcast shot of ${q}, dramatic lighting, 8k ultra detailed`
        )}?width=1280&height=720&seed=${100 + seedOffset}&nologo=true`;
        return {
          id: `ai-gen-${seedOffset}`,
          title: `AI Render: ${q} (Góc máy #${seedOffset})`,
          url: aiUrl,
          proxyUrl: `/api/image-proxy?domain=${domain}&idx=${seedOffset}&url=${encodeURIComponent(aiUrl)}`,
          source: 'SYNAPES Flux AI Visual Generator',
        };
      });

      const combined = [...viWiki.images, ...commonsResults, ...aiGenerated, ...domainMatches];

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ query: q, domain, count: combined.length, images: combined }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Image search error', details: String(err) }));
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // C. DOMAIN-SAFE CORS IMAGE PROXY (/api/image-proxy?url=...&domain=...)
  // --------------------------------------------------------------------------
  if (cleanUrl === '/api/image-proxy') {
    try {
      const parsedUrl = new URL(rawUrl, 'http://localhost');
      const domain = parsedUrl.searchParams.get('domain') || 'news';
      const idx = Math.max(0, parseInt(parsedUrl.searchParams.get('idx') || '0', 10) || 0);
      const fallbackPool = DOMAIN_PHOTO_POOLS[domain] || DOMAIN_PHOTO_POOLS.news;
      const fallbackUrl = fallbackPool[idx % fallbackPool.length].url;
      const targetUrl = parsedUrl.searchParams.get('url') || fallbackUrl;

      if (IMAGE_PROXY_CACHE.has(targetUrl)) {
        const cached = IMAGE_PROXY_CACHE.get(targetUrl);
        res.writeHead(200, {
          'Content-Type': cached.contentType,
          'Content-Length': cached.buffer.length,
          'Cache-Control': 'public, max-age=86400',
          'X-Image-Proxy': 'cache-hit',
        });
        res.end(cached.buffer);
        return true;
      }

      let fetched;
      try {
        const isPollinations = targetUrl.includes('pollinations.ai');
        fetched = await fetchRemoteBuffer(targetUrl, 4, isPollinations ? 6500 : 8000);
      } catch {
        // Fallback strictly within the matching topic domain (NEVER iPhone unless domain === 'hardware')
        fetched = await fetchRemoteBuffer(fallbackUrl, 4, 8000);
      }

      if (IMAGE_PROXY_CACHE.size > 90) {
        const firstKey = IMAGE_PROXY_CACHE.keys().next().value;
        IMAGE_PROXY_CACHE.delete(firstKey);
      }
      IMAGE_PROXY_CACHE.set(targetUrl, fetched);

      res.writeHead(200, {
        'Content-Type': fetched.contentType,
        'Content-Length': fetched.buffer.length,
        'Cache-Control': 'public, max-age=86400',
        'X-Image-Proxy': 'live-fetch',
      });
      res.end(fetched.buffer);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Image proxy error', details: String(err) }));
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // D. SERVER-SIDE LLM GENERATION PROXY (/api/llm-generate)
  // --------------------------------------------------------------------------
  if (cleanUrl === '/api/llm-generate' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const { provider, model, apiKey, systemPrompt, userPrompt, endpointUrl } = body || {};

      if (!apiKey || String(apiKey).trim().length < 5) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Missing API Key' }));
        return true;
      }

      const cleanKey = String(apiKey).trim();

      if (provider === 'gemini') {
        const base = (endpointUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
        const cleanMod = String(model || 'gemini-2.5-flash').replace(/^models\//, '').trim();
        // Filter out non-text-generation endpoints (tts, imagen, embedding, live-only, veo)
        const isNonScriptModel = /tts|imagen|-image|embedding|robotics|veo|audio|-live|aqa/i.test(cleanMod);
        const candidates = Array.from(
          new Set([
            ...(isNonScriptModel ? [] : [cleanMod]),
            'gemini-2.5-flash',
            'gemini-2.5-pro',
            'gemini-2.0-flash',
          ])
        );

        const extractGeminiText = (parsed) => {
          const parts = parsed?.candidates?.[0]?.content?.parts;
          if (!Array.isArray(parts) || parts.length === 0) return '';
          const nonThought = parts.filter((p) => !p?.thought && typeof p?.text === 'string');
          if (nonThought.length > 0) return nonThought.map((p) => p.text).join('\n').trim();
          const anyText = parts.filter((p) => typeof p?.text === 'string');
          return anyText.length > 0 ? anyText[anyText.length - 1].text.trim() : '';
        };

        let lastErr = 'Gemini call failed';
        for (const mod of candidates) {
          const gUrl = `${base}/models/${encodeURIComponent(mod)}:generateContent?key=${encodeURIComponent(cleanKey)}`;
          let resp = await postJsonHttps(gUrl, {}, {
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: {
              temperature: 0.65,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json',
            },
          });

          // Retry without responseMimeType if preview/experimental model rejects JSON mode
          if (resp.status === 400) {
            resp = await postJsonHttps(gUrl, {}, {
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
              generationConfig: {
                temperature: 0.65,
                maxOutputTokens: 8192,
              },
            });
          }

          if (resp.status === 200) {
            const parsed = JSON.parse(resp.text);
            const outText = extractGeminiText(parsed);
            if (outText) {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ text: outText, actualModel: mod }));
              return true;
            }
          } else {
            lastErr = `HTTP ${resp.status}: ${resp.text.slice(0, 200)}`;
          }
        }
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: lastErr }));
        return true;
      }

      if (provider === 'claude') {
        const base = (endpointUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
        const resp = await postJsonHttps(
          `${base}/messages`,
          {
            'x-api-key': cleanKey,
            'anthropic-version': '2023-06-01',
          },
          {
            model: model || 'claude-3-7-sonnet-20250219',
            max_tokens: 4096,
            temperature: 0.65,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }
        );
        if (resp.status === 200) {
          const parsed = JSON.parse(resp.text);
          const outText = parsed?.content?.[0]?.text || '';
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ text: outText, actualModel: model || 'claude-3-7-sonnet-20250219' }));
          return true;
        }
        res.writeHead(resp.status, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: resp.text.slice(0, 300) }));
        return true;
      }

      // OpenAI / DeepSeek / Grok
      const defaultBase =
        provider === 'openai'
          ? 'https://api.openai.com/v1'
          : provider === 'deepseek'
            ? 'https://api.deepseek.com/v1'
            : 'https://api.x.ai/v1';
      const base = (endpointUrl || defaultBase).replace(/\/+$/, '');
      const payload = {
        model: model || (provider === 'openai' ? 'gpt-4o' : provider === 'deepseek' ? 'deepseek-chat' : 'grok-2'),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.65,
      };
      if (provider !== 'grok') {
        payload.response_format = { type: 'json_object' };
      }
      const resp = await postJsonHttps(
        `${base}/chat/completions`,
        { Authorization: `Bearer ${cleanKey}` },
        payload
      );
      if (resp.status === 200) {
        const parsed = JSON.parse(resp.text);
        const outText = parsed?.choices?.[0]?.message?.content || '';
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ text: outText, actualModel: payload.model }));
        return true;
      }
      res.writeHead(resp.status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: resp.text.slice(0, 300) }));
      return true;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: String(err) }));
      return true;
    }
  }

  // --------------------------------------------------------------------------
  // E. NEURAL TTS ENDPOINT (/api/tts)
  // --------------------------------------------------------------------------
  if (cleanUrl === '/api/tts') {
    try {
      const parsedUrl = new URL(rawUrl, 'http://localhost');
      const text = (parsedUrl.searchParams.get('text') || 'Xin chào').trim();
      const lang = parsedUrl.searchParams.get('lang') || 'vi';
      const voice =
        parsedUrl.searchParams.get('voice') ||
        (lang.startsWith('en') ? 'en-US-GuyNeural' : 'vi-VN-NamMinhNeural');
      const ratePct = parsedUrl.searchParams.get('rate') || '+0%';
      const pitchHz = parsedUrl.searchParams.get('pitch') || '+0Hz';
      const openaiKey = parsedUrl.searchParams.get('openaiKey') || '';
      const openaiVoice = parsedUrl.searchParams.get('openaiVoice') || 'onyx';

      let mp3Buffer = null;
      let engineUsed = 'edge-neural';

      if (openaiKey && openaiKey.startsWith('sk-')) {
        try {
          mp3Buffer = await fetchOpenAiSpeech(openaiKey, text, openaiVoice);
          engineUsed = 'openai-studio-hd';
        } catch {
          mp3Buffer = null;
        }
      }

      if (!mp3Buffer) {
        try {
          mp3Buffer = await synthesizeEdgeNeuralTts(text, voice, ratePct, pitchHz);
          engineUsed = 'edge-neural';
        } catch {
          mp3Buffer = null;
        }
      }

      if (!mp3Buffer) {
        engineUsed = 'google-neural-dsp';
        mp3Buffer = await fetchGoogleNeuralTtsMp3(text, lang);
      }

      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': mp3Buffer.length,
        'X-TTS-Engine': engineUsed,
        'X-TTS-Voice': voice,
        'Cache-Control': 'public, max-age=3600',
      });
      res.end(mp3Buffer);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'TTS synthesis failed', details: String(err) }));
    }
    return true;
  }

  return false;
}
