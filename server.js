import http from 'http';
import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

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

/**
 * Generate Sec-MS-GEC token for Microsoft Edge ReadAloud Neural TTS
 */
function generateSecMsGec() {
  const WIN_EPOCH = 11644473600;
  const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
  let ticks = Math.floor(Date.now() / 1000) + WIN_EPOCH;
  ticks -= ticks % 300;
  ticks *= 10000000;
  const strToHash = `${ticks.toFixed(0)}${TRUSTED_CLIENT_TOKEN}`;
  return crypto.createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
}

/**
 * Synthesize real Neural MP3 via Microsoft Edge ReadAloud WebSocket (Node 20+ native WebSocket)
 */
async function synthesizeEdgeNeuralTts(text, voiceName, ratePct = '+0%', pitchHz = '+0Hz') {
  if (typeof WebSocket === 'undefined') {
    throw new Error('Native WebSocket not available');
  }

  return new Promise((resolve, reject) => {
    const reqId = crypto.randomUUID().replace(/-/g, '');
    const secMsGec = generateSecMsGec();
    const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-130.0.2849.68&ConnectionId=${reqId}`;

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

      const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

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
          if (audioChunks.length > 0) {
            resolve(Buffer.concat(audioChunks));
          } else {
            reject(new Error('Empty Edge TTS buffer'));
          }
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

/**
 * Fallback Cloud Neural TTS stream (Google Translate TTS MP3)
 */
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
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          },
        },
        (resp) => {
          if (resp.statusCode !== 200) {
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

const server = http.createServer(async (req, res) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  const rawUrl = req.url || '/';
  const cleanUrl = rawUrl.split('?')[0].split('#')[0];

  // Neural TTS Endpoint (/api/tts)
  if (cleanUrl === '/api/tts') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      const parsedUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
      const text = (parsedUrl.searchParams.get('text') || 'Xin chào').trim();
      const lang = parsedUrl.searchParams.get('lang') || 'vi';
      const voice =
        parsedUrl.searchParams.get('voice') ||
        (lang.startsWith('en') ? 'en-US-GuyNeural' : 'vi-VN-NamMinhNeural');
      const ratePct = parsedUrl.searchParams.get('rate') || '+0%';
      const pitchHz = parsedUrl.searchParams.get('pitch') || '+0Hz';

      let mp3Buffer = null;
      let engineUsed = 'edge-neural';

      try {
        mp3Buffer = await synthesizeEdgeNeuralTts(text, voice, ratePct, pitchHz);
      } catch {
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
    return;
  }

  // Health check endpoint for Render Web Service
  if (cleanUrl === '/healthz' || cleanUrl === '/ping') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
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

  // Check if file exists
  let stat = null;
  try {
    stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stat = fs.statSync(filePath);
    }
  } catch {
    // SPA fallback: serve index.html for any client-side routes
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

  // Cache policy
  if (filePath.endsWith('index.html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else if (cleanUrl.startsWith('/assets/')) {
    // Hashed assets generated by Vite
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }

  res.setHeader('Content-Type', contentType);

  const acceptEncoding = req.headers['accept-encoding'] || '';
  const canGzip = COMPRESSIBLE_EXTS.has(ext) && acceptEncoding.includes('gzip');

  if (canGzip) {
    res.setHeader('Content-Encoding', 'gzip');
    res.writeHead(200);
    const rawStream = fs.createReadStream(filePath);
    const gzip = zlib.createGzip({ level: 6 });
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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, closing Web Service server...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, closing Web Service server...');
  server.close(() => process.exit(0));
});

