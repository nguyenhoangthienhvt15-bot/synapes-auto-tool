import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { handleStudioApiRequest, IP_BLACKLIST } from './server/studioBackendEngine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');

const PORT = parseInt(process.env.PORT || '10000', 10);
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const COMPRESSIBLE_EXTS = new Set([
  '.html',
  '.js',
  '.mjs',
  '.css',
  '.json',
  '.svg',
  '.txt',
  '.map',
]);

// High-speed in-memory buffer cache for static assets (< 5MB)
const fileCache = new Map();

function getCachedFile(filePath, ext) {
  try {
    const stat = fs.statSync(filePath);
    const cacheKey = `${filePath}:${stat.mtimeMs}`;
    const cached = fileCache.get(cacheKey);
    if (cached) return cached;

    // Read and pre-compress if within 5MB
    if (stat.size <= 5 * 1024 * 1024) {
      const buffer = fs.readFileSync(filePath);
      const isCompressible = COMPRESSIBLE_EXTS.has(ext);
      const gzipBuffer = isCompressible ? zlib.gzipSync(buffer, { level: 6 }) : null;
      const etag = `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
      const item = {
        buffer,
        gzipBuffer,
        size: stat.size,
        etag,
        mtime: stat.mtimeMs,
      };
      // Keep cache size bounded
      if (fileCache.size > 200) {
        fileCache.clear();
      }
      fileCache.set(cacheKey, item);
      return item;
    }
    return null;
  } catch {
    return null;
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getLockoutHtml(clientIp, bannedUntilIso) {
  const safeIp = escapeHtml(clientIp);
  const safeUntil = escapeHtml(bannedUntilIso);
  const incidentCode = `SEC-SRV-${Date.now().toString(36).toUpperCase()}`;
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>403 Forbidden - Giới Hạn Truy Cập An Ninh | SYNAPES STUDIO</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #09090b;
      color: #f4f4f5;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 9999px;
      font-size: 11px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #a1a1aa;
      margin-bottom: 20px;
      letter-spacing: 0.04em;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ef4444;
      display: inline-block;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #f4f4f5;
      letter-spacing: -0.01em;
    }
    p.desc {
      color: #a1a1aa;
      max-width: 480px;
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .card {
      background: #121214;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 18px 20px;
      max-width: 390px;
      width: 100%;
      text-align: left;
    }
    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .card-title {
      font-size: 11px;
      font-weight: 600;
      color: #d4d4d8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-family: ui-monospace, monospace;
    }
    .card-tag {
      font-size: 10px;
      color: #71717a;
      font-family: ui-monospace, monospace;
    }
    .card-desc {
      font-size: 12px;
      color: #71717a;
      line-height: 1.4;
      margin-bottom: 12px;
    }
    .form-row {
      display: flex;
      gap: 8px;
    }
    input[type="password"] {
      flex: 1;
      background: #09090b;
      border: 1px solid #3f3f46;
      color: #f4f4f5;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-family: ui-monospace, monospace;
      outline: none;
    }
    button {
      background: #f4f4f5;
      color: #09090b;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s ease;
    }
    button:hover {
      background: #e4e4e7;
    }
    .feedback {
      display: none;
      font-size: 12px;
      margin-top: 10px;
      line-height: 1.4;
    }
    .footer {
      margin-top: 24px;
      font-size: 11px;
      color: #71717a;
      font-family: ui-monospace, monospace;
      line-height: 1.6;
    }
    .footer a {
      color: #a1a1aa;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="badge">
    <span class="dot"></span>
    AN NINH MÁY CHỦ • TRUY CẬP BỊ HẠN CHẾ (403)
  </div>

  <h1>GIỚI HẠN TRUY CẬP HỆ THỐNG</h1>
  <p class="desc">
    Địa chỉ IP của bạn (<code style="color:#e4e4e7;">${safeIp}</code>) đã được ghi nhận vào danh sách kiểm soát tạm thời do có thao tác can thiệp an ninh hoặc Developer Tools.
  </p>

  <div class="card">
    <div class="card-head">
      <span class="card-title">Xác Thực Kỹ Sư Trưởng</span>
      <span class="card-tag">Master Override</span>
    </div>
    <p class="card-desc">
      Nhập mã Master Key để giải phóng địa chỉ IP và khôi phục quyền truy cập:
    </p>
    <div class="form-row">
      <input
        id="synapes-master-pass"
        type="password"
        placeholder="Nhập mã Master Key..."
        autocomplete="off"
      />
      <button id="synapes-master-unlock-btn">Mở Khóa</button>
    </div>
    <div id="synapes-unlock-feedback" class="feedback"></div>
  </div>

  <div class="footer">
    Mã sự cố: <span style="color:#a1a1aa;">${incidentCode}</span> • Bị khóa đến: <span style="color:#a1a1aa;">${safeUntil}</span>
    <br />
    Chủ trì: <span style="color:#d4d4d8;">KS. Nguyễn Hoàng Thiện</span> • Email: <a href="mailto:nguyenhoangthien.hvt.15@gmail.com">nguyenhoangthien.hvt.15@gmail.com</a>
  </div>

  <script>
    const passInput = document.getElementById('synapes-master-pass');
    const unlockBtn = document.getElementById('synapes-master-unlock-btn');
    const feedback = document.getElementById('synapes-unlock-feedback');

    async function handleUnlock() {
      const code = passInput.value.trim();
      if (!code) {
        feedback.style.display = 'block';
        feedback.style.color = '#f87171';
        feedback.innerText = '✕ Vui lòng nhập mã Master Key.';
        return;
      }

      try {
        const resp = await fetch('/api/security/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: code })
        });
        const data = await resp.json();

        if (resp.ok && data.success) {
          feedback.style.display = 'block';
          feedback.style.color = '#4ade80';
          feedback.innerText = '✓ Xác thực thành công! Đang giải phóng IP và tải lại hệ thống...';

          try {
            localStorage.setItem('synapes_dev_bypass', '1');
            sessionStorage.setItem('synapes_dev_bypass', '1');
            if (data.token) localStorage.setItem('synapes_bypass_token', data.token);
          } catch {}

          setTimeout(() => {
            window.location.href = window.location.origin + window.location.pathname + '?bypass_anti_tamper=1';
          }, 600);
        } else {
          feedback.style.display = 'block';
          feedback.style.color = '#f87171';
          feedback.innerText = '✕ ' + (data.error || 'Mật mã Master không chính xác.');
        }
      } catch (err) {
        feedback.style.display = 'block';
        feedback.style.color = '#f87171';
        feedback.innerText = '✕ Không thể kết nối tới máy chủ giải phóng IP.';
      }
    }

    unlockBtn.addEventListener('click', handleUnlock);
    passInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleUnlock();
      }
    });
    passInput.focus();
  </script>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  const rawUrl = req.url || '/';
  const cleanUrl = rawUrl.split('?')[0].split('#')[0];

  // Kiểm tra danh sách đen IP (Anti-DevTools & Threat Enforcer)
  // Ngoại lệ duy nhất: Cho phép gọi /api/security/unlock để xác thực Master Key (07022006) giải phóng IP
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';
  const isUnlockEndpoint = cleanUrl === '/api/security/unlock';

  if (IP_BLACKLIST.has(clientIp) && !isUnlockEndpoint) {
    const banInfo = IP_BLACKLIST.get(clientIp);
    if (Date.now() < banInfo.bannedUntil) {
      const acceptsHtml = req.headers.accept?.includes('text/html') || cleanUrl === '/' || cleanUrl.endsWith('.html');
      if (acceptsHtml) {
        const html = getLockoutHtml(clientIp, new Date(banInfo.bannedUntil).toISOString());
        res.writeHead(403, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        });
        res.end(html);
        return;
      }

      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          error: '403 Forbidden: Địa chỉ IP của bạn đã bị khóa tạm thời do cố ý can thiệp vào mã nguồn dự án.',
          bannedUntil: new Date(banInfo.bannedUntil).toISOString(),
          unlockUrl: '/api/security/unlock',
          masterKeySupported: true,
          leadEngineer: 'KS. Nguyễn Hoàng Thiện',
          contact: 'nguyenhoangthien.hvt.15@gmail.com',
        })
      );
      return;
    } else {
      IP_BLACKLIST.delete(clientIp);
    }
  }

  // Ultra-fast Health check & Ping response (< 1ms, zero overhead)
  if (cleanUrl === '/healthz' || cleanUrl === '/ping') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'synapes-auto-tool',
        type: 'web-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      })
    );
    return;
  }

  // Security & Performance Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://docs.google.com https://*.googleusercontent.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.tiktok.com https://www.instagram.com https://www.facebook.com https://player.vimeo.com; frame-ancestors 'self';"
  );
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=65, max=1000');

  // Unified Studio Backend API (/api/topic-research, /api/image-search, /api/image-proxy, /api/llm-generate, /api/tts)
  if (await handleStudioApiRequest(req, res)) {
    return;
  }

  // Safe file path resolution
  let decodedPath = '';
  try {
    decodedPath = decodeURIComponent(cleanUrl);
  } catch {
    decodedPath = cleanUrl;
  }

  let filePath = path.normalize(path.join(DIST_DIR, decodedPath));

  // Security: prevent path traversal attacks
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  // Check if file exists, with strict static-asset 404 vs SPA index.html fallback
  const reqExt = path.extname(cleanUrl).toLowerCase();
  const isStaticAssetRequest =
    cleanUrl.startsWith('/assets/') ||
    (reqExt !== '' && reqExt !== '.html' && reqExt !== '.htm');

  let stat = null;
  try {
    stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stat = fs.statSync(filePath);
    }
  } catch {
    // Never mask a missing JS/CSS/image/asset behind index.html (causes MIME module crash)
    if (isStaticAssetRequest) {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
      res.end('404 Asset Not Found');
      return;
    }

    filePath = path.join(DIST_DIR, 'index.html');
    try {
      stat = fs.statSync(filePath);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Build Not Found: Please run `npm run build` before starting web service.');
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Cache-Control Policy
  const isNoStoreShell = filePath.endsWith('index.html') || cleanUrl === '/sw.js';
  if (isNoStoreShell) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else if (cleanUrl.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }

  if (COMPRESSIBLE_EXTS.has(ext)) {
    res.setHeader('Vary', 'Accept-Encoding');
  }

  res.setHeader('Content-Type', contentType);

  // High-performance cached serving
  const cached = getCachedFile(filePath, ext);
  const etag = cached ? cached.etag : `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  res.setHeader('ETag', etag);

  // 304 Not Modified validation
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304);
    res.end();
    return;
  }

  const acceptEncoding = req.headers['accept-encoding'] || '';
  const canGzip = COMPRESSIBLE_EXTS.has(ext) && acceptEncoding.includes('gzip');

  if (cached) {
    if (canGzip && cached.gzipBuffer) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Length', cached.gzipBuffer.length);
      res.writeHead(200);
      res.end(cached.gzipBuffer);
    } else {
      res.setHeader('Content-Length', cached.buffer.length);
      res.writeHead(200);
      res.end(cached.buffer);
    }
    return;
  }

  // Stream fallback for large media files (> 5MB) or HTTP Range requests (206 Partial Content for MP4/WAV/WebM)
  const rangeHeader = req.headers.range;
  if (rangeHeader && (ext === '.mp4' || ext === '.webm' || ext === '.wav' || ext === '.mp3')) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    if (!isNaN(start) && !isNaN(end) && start >= 0 && end < stat.size && start <= end) {
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }
  }

  if (canGzip) {
    res.setHeader('Content-Encoding', 'gzip');
    res.writeHead(200);
    const rawStream = fs.createReadStream(filePath);
    const gzip = zlib.createGzip({ level: 4 });
    rawStream.pipe(gzip).pipe(res);
  } else {
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', stat.size);
    res.writeHead(200);
    fs.createReadStream(filePath).pipe(res);
  }
});

function warmStaticCache() {
  if (!fs.existsSync(DIST_DIR)) return;
  const targets = [path.join(DIST_DIR, 'index.html'), path.join(DIST_DIR, 'sw.js')];
  const assetsDir = path.join(DIST_DIR, 'assets');
  if (fs.existsSync(assetsDir)) {
    try {
      for (const file of fs.readdirSync(assetsDir)) {
        targets.push(path.join(assetsDir, file));
      }
    } catch {
      // Ignore directory read failure during warm-up
    }
  }
  let warmedCount = 0;
  for (const target of targets) {
    if (fs.existsSync(target)) {
      const ext = path.extname(target).toLowerCase();
      if (getCachedFile(target, ext)) warmedCount++;
    }
  }
  console.log(`[SYNAPES Cache] Pre-warmed ${warmedCount} static/gzipped assets in memory.`);
}

warmStaticCache();

server.listen(PORT, HOST, () => {
  console.log(`[SYNAPES Studio Web Service] running at http://${HOST}:${PORT}`);
  console.log(`Serving static bundle from: ${DIST_DIR}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, closing Web Service server...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, closing Web Service server...');
  server.close(() => process.exit(0));
});
