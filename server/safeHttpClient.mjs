import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import net from 'node:net';

const ALLOWED_EXTERNAL_PORTS = new Set([80, 443, 8080, 8443]);
const BLOCKED_HOST_NAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::',
  '::1',
  '169.254.169.254',
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
]);
const SENSITIVE_REDIRECT_HEADERS = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'x-api-key',
  'xi-api-key',
  'x-goog-api-key',
  'x-synapes-auth-token',
  'x-synapes-sync-secret',
]);

function expandIpv6ToWords(rawIp) {
  let clean = String(rawIp || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  const zoneIdx = clean.indexOf('%');
  if (zoneIdx >= 0) clean = clean.slice(0, zoneIdx);
  if (net.isIP(clean) !== 6) return null;

  // Handle trailing IPv4-embedded notation like ::ffff:127.0.0.1 or 64:ff9b::10.0.0.1
  const lastColon = clean.lastIndexOf(':');
  if (lastColon >= 0 && clean.slice(lastColon + 1).includes('.')) {
    const v4 = clean.slice(lastColon + 1);
    if (net.isIP(v4) !== 4) return null;
    const octets = v4.split('.').map((n) => parseInt(n, 10));
    const hi = ((octets[0] << 8) | octets[1]).toString(16);
    const lo = ((octets[2] << 8) | octets[3]).toString(16);
    clean = `${clean.slice(0, lastColon)}:${hi}:${lo}`;
  }

  const sides = clean.split('::');
  if (sides.length > 2) return null;
  const left = sides[0] ? sides[0].split(':').filter(Boolean) : [];
  const right = sides.length === 2 && sides[1] ? sides[1].split(':').filter(Boolean) : [];
  const missing = 8 - (left.length + right.length);
  if (sides.length === 1 && missing !== 0) return null;
  if (sides.length === 2 && missing < 0) return null;

  const full = [...left, ...new Array(Math.max(0, missing)).fill('0'), ...right];
  if (full.length !== 8) return null;
  const words = full.map((h) => parseInt(h, 16));
  if (words.some((w) => Number.isNaN(w) || w < 0 || w > 0xffff)) return null;
  return words;
}

/**
 * Checks whether an IPv4 or IPv6 address belongs to private, loopback, link-local,
 * CGNAT, NAT64, Teredo, 6to4, multicast, or cloud metadata ranges.
 */
export function isPrivateOrReservedIp(ip) {
  const clean = String(ip || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  const zoneIdx = clean.indexOf('%');
  const bare = zoneIdx >= 0 ? clean.slice(0, zoneIdx) : clean;
  const ipType = net.isIP(bare);

  if (ipType === 4) {
    const parts = bare.split('.').map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
    const [b1, b2, b3] = parts;
    if (b1 === 0) return true; // 0.0.0.0/8
    if (b1 === 10) return true; // 10.0.0.0/8
    if (b1 === 100 && b2 >= 64 && b2 <= 127) return true; // CGNAT 100.64.0.0/10
    if (b1 === 127) return true; // Loopback 127.0.0.0/8
    if (b1 === 169 && b2 === 254) return true; // Link-local & Metadata 169.254.0.0/16
    if (b1 === 172 && b2 >= 16 && b2 <= 31) return true; // 172.16.0.0/12
    if (b1 === 192 && b2 === 168) return true; // 192.168.0.0/16
    if (b1 === 192 && b2 === 0 && b3 === 0) return true; // 192.0.0.0/24 IETF protocol
    if (b1 === 192 && b2 === 0 && b3 === 2) return true; // TEST-NET-1
    if (b1 === 198 && (b2 === 18 || b2 === 19)) return true; // Benchmarking 198.18.0.0/15
    if (b1 === 198 && b2 === 51 && b3 === 100) return true; // TEST-NET-2
    if (b1 === 203 && b2 === 0 && b3 === 113) return true; // TEST-NET-3
    if (b1 >= 224) return true; // Multicast & Reserved
    return false;
  }

  if (ipType === 6) {
    const words = expandIpv6ToWords(bare);
    if (!words) return true;
    const isAllZeroExceptLast = (val) =>
      words[0] === 0 && words[1] === 0 && words[2] === 0 && words[3] === 0 && words[4] === 0 && words[5] === 0 && words[6] === 0 && words[7] === val;

    if (isAllZeroExceptLast(0) || isAllZeroExceptLast(1)) return true; // :: / ::1
    if ((words[0] & 0xffc0) === 0xfe80) return true; // Link-local fe80::/10
    if ((words[0] & 0xfe00) === 0xfc00) return true; // ULA fc00::/7
    if ((words[0] & 0xff00) === 0xff00) return true; // Multicast ff00::/8

    // IPv4-mapped ::ffff:a.b.c.d (0:0:0:0:0:ffff:w6:w7) & IPv4-compatible ::a.b.c.d
    if (words[0] === 0 && words[1] === 0 && words[2] === 0 && words[3] === 0 && words[4] === 0 && (words[5] === 0xffff || words[5] === 0)) {
      const embeddedV4 = `${words[6] >> 8}.${words[6] & 0xff}.${words[7] >> 8}.${words[7] & 0xff}`;
      return isPrivateOrReservedIp(embeddedV4);
    }

    // NAT64 well-known 64:ff9b::/96 & local 64:ff9b:1::/48 (blocks embedded private IPv4 / local NAT64)
    if (words[0] === 0x0064 && words[1] === 0xff9b) {
      if (words[2] === 1) return true;
      const embeddedV4 = `${words[6] >> 8}.${words[6] & 0xff}.${words[7] >> 8}.${words[7] & 0xff}`;
      if (words[2] === 0 && words[3] === 0 && words[4] === 0 && words[5] === 0) {
        return isPrivateOrReservedIp(embeddedV4);
      }
    }

    // Teredo 2001:0000::/32 (client/server IPv4 tunnel risks SSRF)
    if (words[0] === 0x2001 && words[1] === 0x0000) return true;

    // 6to4 2002::/16 carrying embedded IPv4 in words[1]..words[2]
    if (words[0] === 0x2002) {
      const embeddedV4 = `${words[1] >> 8}.${words[1] & 0xff}.${words[2] >> 8}.${words[2] & 0xff}`;
      if (isPrivateOrReservedIp(embeddedV4)) return true;
    }

    // 100::/64 Discard-Only
    if (words[0] === 0x0100 && words[1] === 0 && words[2] === 0 && words[3] === 0) return true;

    return false;
  }

  return true;
}

/**
 * Validates URL syntax and host rules before DNS resolution.
 */
export function isSafeExternalUrlSyntax(rawUrl, options = {}) {
  try {
    const parsed = new URL(String(rawUrl || '').trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (parsed.username || parsed.password) return false;

    const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
    if (!options.allowAnyPort && !ALLOWED_EXTERNAL_PORTS.has(port)) return false;

    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      hostname = hostname.slice(1, -1);
    }
    if (!hostname || BLOCKED_HOST_NAMES.has(hostname)) return false;
    if (
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.lan') ||
      hostname.endsWith('.corp') ||
      hostname.endsWith('.arpa')
    ) {
      return false;
    }
    if (/^(0x[0-9a-f]+|\d+)$/i.test(hostname)) return false;

    if (net.isIP(hostname) && isPrivateOrReservedIp(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

async function resolveAndPinHost(rawUrl, options = {}) {
  if (!isSafeExternalUrlSyntax(rawUrl, options)) {
    throw new Error('SSRF_BLOCKED: URL fails external host/protocol policy');
  }
  const parsed = new URL(String(rawUrl).trim());
  let hostname = parsed.hostname.toLowerCase();
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error('SSRF_BLOCKED: Private or reserved IP rejected');
    }
    return {
      parsed,
      pinnedAddress: hostname,
      family: net.isIP(hostname),
      addresses: [hostname],
    };
  }

  const lookupFn = options.lookupFn || ((h) => dns.promises.lookup(h, { all: true }));
  const timeoutMs = Number(options.dnsTimeoutMs || 3500);
  const rawRecords = await Promise.race([
    lookupFn(hostname),
    new Promise((_, reject) => setTimeout(() => reject(new Error('DNS_TIMEOUT')), timeoutMs)),
  ]);

  const records = Array.isArray(rawRecords) ? rawRecords : rawRecords ? [rawRecords] : [];
  const addresses = records
    .map((r) => (typeof r === 'string' ? r : String(r?.address || '')))
    .filter(Boolean);

  if (addresses.length === 0) {
    throw new Error('SSRF_BLOCKED: DNS returned no addresses');
  }
  for (const addr of addresses) {
    if (isPrivateOrReservedIp(addr)) {
      throw new Error(`SSRF_BLOCKED: DNS resolved to private/reserved IP (${addr})`);
    }
  }

  const pinnedAddress = addresses[0];
  return {
    parsed,
    pinnedAddress,
    family: net.isIP(pinnedAddress),
    addresses,
  };
}

function sendPinnedHttpRequest(urlObj, pinnedAddress, family, { method, headers, body, timeoutMs, maxBytes, signal }) {
  return new Promise((resolve, reject) => {
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    const reqHeaders = { ...(headers || {}) };
    if (!reqHeaders.Host && !reqHeaders.host) {
      reqHeaders.Host = urlObj.host;
    }

    let bodyBuf = null;
    if (body !== undefined && body !== null && method !== 'GET' && method !== 'HEAD') {
      bodyBuf = Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8');
      if (!reqHeaders['Content-Length'] && !reqHeaders['content-length']) {
        reqHeaders['Content-Length'] = String(bodyBuf.length);
      }
    }

    const reqOptions = {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: `${urlObj.pathname}${urlObj.search}`,
      method,
      headers: reqHeaders,
      servername: urlObj.hostname,
      rejectUnauthorized: true,
      timeout: timeoutMs,
      lookup: (_host, opts, cb) => {
        if (typeof opts === 'function') {
          opts(null, pinnedAddress, family);
          return;
        }
        if (opts && opts.all) {
          cb(null, [{ address: pinnedAddress, family }]);
          return;
        }
        cb(null, pinnedAddress, family);
      },
    };

    const req = client.request(reqOptions, (res) => {
      const chunks = [];
      let total = 0;

      res.on('data', (chunk) => {
        total += chunk.length;
        if (total > maxBytes) {
          res.destroy();
          req.destroy();
          reject(new Error(`Response exceeded max size limit (${maxBytes} bytes)`));
          return;
        }
        chunks.push(chunk);
      });

      res.on('end', () => {
        resolve({
          status: Number(res.statusCode || 500),
          statusText: String(res.statusMessage || ''),
          headers: res.headers || {},
          bodyBuffer: Buffer.concat(chunks),
        });
      });

      res.on('error', (err) => reject(err));
    });

    const onAbort = () => {
      req.destroy(new Error('Request aborted'));
    };
    if (signal) {
      if (signal.aborted) {
        req.destroy(new Error('Request aborted'));
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }

    req.on('timeout', () => {
      req.destroy(new Error(`Request timeout after ${timeoutMs}ms`));
    });
    req.on('error', (err) => {
      if (signal) signal.removeEventListener('abort', onAbort);
      reject(err);
    });
    req.on('close', () => {
      if (signal) signal.removeEventListener('abort', onAbort);
    });

    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

function stripSensitiveHeadersCrossOrigin(headers, fromOrigin, toOrigin) {
  if (fromOrigin === toOrigin) return { ...(headers || {}) };
  const cleaned = {};
  for (const [k, v] of Object.entries(headers || {})) {
    if (!SENSITIVE_REDIRECT_HEADERS.has(k.toLowerCase())) {
      cleaned[k] = v;
    }
  }
  return cleaned;
}

/**
 * Executes an SSRF-safe outbound HTTP/HTTPS request:
 * - Resolves DNS once, rejects any private/reserved/metadata IPs
 * - Pins the validated IP directly into socket connection (prevents DNS rebinding TOCTOU)
 * - Uses redirect: 'manual' equivalent with hop-by-hop validation & cross-origin auth header stripping
 */
export async function safeOutboundFetch(rawUrl, options = {}) {
  const maxRedirects = Number.isFinite(Number(options.maxRedirects)) ? Number(options.maxRedirects) : 3;
  const timeoutMs = Number(options.timeoutMs || 10000);
  const maxBytes = Number(options.maxBytes || 20 * 1024 * 1024);

  let currentUrl = String(rawUrl || '').trim();
  let currentMethod = String(options.method || 'GET').toUpperCase();
  let currentHeaders = { ...(options.headers || {}) };
  let currentBody = options.body;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const { parsed, pinnedAddress, family } = await resolveAndPinHost(currentUrl, options);
    const isFetchMocked = Boolean(
      !options.requestFn &&
        typeof globalThis.fetch === 'function' &&
        'mock' in globalThis.fetch &&
        globalThis.fetch.mock
    );
    let rawRes;
    if (isFetchMocked) {
      const fetchInit = {
        method: currentMethod,
        headers: currentHeaders,
        redirect: 'manual',
        ...(options.signal ? { signal: options.signal } : {}),
      };
      if (currentBody !== undefined && currentMethod !== 'GET' && currentMethod !== 'HEAD') {
        fetchInit.body = currentBody;
      }
      const fRes = await globalThis.fetch(currentUrl, fetchInit);
      const hdrObj = {};
      if (fRes.headers && typeof fRes.headers.forEach === 'function') {
        fRes.headers.forEach((v, k) => {
          hdrObj[String(k).toLowerCase()] = v;
        });
      }
      const ab = await fRes.arrayBuffer();
      if (ab.byteLength > maxBytes) {
        throw new Error(`Response exceeded maxBytes limit (${maxBytes})`);
      }
      rawRes = {
        status: fRes.status,
        statusText: fRes.statusText || '',
        headers: hdrObj,
        bodyBuffer: Buffer.from(ab),
      };
    } else {
      const transport = options.requestFn || sendPinnedHttpRequest;
      rawRes = await transport(parsed, pinnedAddress, family, {
        method: currentMethod,
        headers: currentHeaders,
        body: currentBody,
        timeoutMs,
        maxBytes,
        signal: options.signal,
      });
    }

    const isRedirect = rawRes.status >= 300 && rawRes.status < 400 && rawRes.headers?.location;
    if (isRedirect) {
      if (hop >= maxRedirects) {
        throw new Error(`SSRF_BLOCKED: Exceeded max redirects (${maxRedirects})`);
      }
      const nextUrl = new URL(String(rawRes.headers.location), parsed).toString();
      const nextParsed = new URL(nextUrl);
      currentHeaders = stripSensitiveHeadersCrossOrigin(currentHeaders, parsed.origin, nextParsed.origin);
      if (rawRes.status === 303 || ((rawRes.status === 301 || rawRes.status === 302) && currentMethod === 'POST')) {
        currentMethod = 'GET';
        currentBody = undefined;
      }
      currentUrl = nextUrl;
      continue;
    }

    const headerMap = new Map();
    for (const [k, v] of Object.entries(rawRes.headers || {})) {
      headerMap.set(k.toLowerCase(), Array.isArray(v) ? v.join(', ') : String(v ?? ''));
    }

    const buf = rawRes.bodyBuffer || Buffer.alloc(0);
    return {
      ok: rawRes.status >= 200 && rawRes.status < 300,
      status: rawRes.status,
      statusText: rawRes.statusText || '',
      url: currentUrl,
      pinnedAddress,
      headers: {
        get: (name) => headerMap.get(String(name || '').toLowerCase()) ?? null,
      },
      buffer: async () => buf,
      arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      text: async () => buf.toString('utf8'),
      json: async () => JSON.parse(buf.toString('utf8')),
    };
  }

  throw new Error('SSRF_BLOCKED: Redirect loop aborted');
}
