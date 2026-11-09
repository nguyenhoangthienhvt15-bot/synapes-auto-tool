import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { handleStudioApiRequest } from './server/studioBackendEngine.mjs';

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

const server = http.createServer(async (req, res) => {
  const rawUrl = req.url || '/';
  const cleanUrl = rawUrl.split('?')[0].split('#')[0];

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

  // Check if file exists, with index.html SPA fallback
  let stat = null;
  try {
    stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stat = fs.statSync(filePath);
    }
  } catch {
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
  const isHtml = filePath.endsWith('index.html');
  if (isHtml) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else if (cleanUrl.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=3600');
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

  // Stream fallback for large media files (> 5MB)
  if (canGzip) {
    res.setHeader('Content-Encoding', 'gzip');
    res.writeHead(200);
    const rawStream = fs.createReadStream(filePath);
    const gzip = zlib.createGzip({ level: 4 });
    rawStream.pipe(gzip).pipe(res);
  } else {
    res.setHeader('Content-Length', stat.size);
    res.writeHead(200);
    fs.createReadStream(filePath).pipe(res);
  }
});

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
