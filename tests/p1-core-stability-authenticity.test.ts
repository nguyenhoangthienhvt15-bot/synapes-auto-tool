import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import http from 'node:http';
import dns from 'node:dns';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  handleStudioApiRequest,
  issueServerAuthToken,
  _seedTestAuthAccount,
} from '../server/studioBackendEngine.mjs';
import {
  isPrivateOrReservedIp,
  safeOutboundFetch,
} from '../server/safeHttpClient.mjs';
import {
  withFileLock,
  writeJsonAtomic,
} from '../server/atomicFileStore.mjs';

async function callEndpoint(
  port: number,
  method: 'GET' | 'POST',
  urlPath: string,
  payload?: unknown,
  headers: Record<string, string> = {}
): Promise<{ status: number; headers: http.IncomingHttpHeaders; json: any; text: string }> {
  return new Promise((resolve, reject) => {
    const bodyStr = payload !== undefined ? JSON.stringify(payload) : '';
    const reqHeaders: Record<string, string | number> = { ...headers };
    if (payload !== undefined) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    const req = http.request(
      { hostname: '127.0.0.1', port, path: urlPath, method, headers: reqHeaders },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let json: any = null;
          try {
            json = text ? JSON.parse(text) : null;
          } catch {}
          resolve({ status: res.statusCode || 500, headers: res.headers, json, text });
        });
      }
    );
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

describe('P1 Core Stability, Security & Authenticity Remediation Suite', () => {
  let server: http.Server;
  let port = 0;

  const createdFiles: string[] = [];
  const dataDir = path.resolve(process.cwd(), 'data');
  const channelsFile = path.join(dataDir, 'channels_registry.json');

  beforeAll(async () => {
    _seedTestAuthAccount({
      code: 'P1_TEST_01',
      clientName: 'Nguoi Dung P1 01',
      registeredGmail: 'p1test01@example.com',
      phone: '0911111111',
      password: 'P1Password@2026',
      planTier: 'enterprise',
    });
    _seedTestAuthAccount({
      code: 'P1_OTHER_02',
      clientName: 'Nguoi Dung P1 02',
      registeredGmail: 'p1test02@example.com',
      phone: '0922222222',
      password: 'P1PasswordOther@2026',
      planTier: 'personal',
    });
    _seedTestAuthAccount({
      code: 'P1_ZERO_03',
      clientName: 'Nguoi Dung Zero Analytics',
      registeredGmail: 'p1zero03@example.com',
      phone: '0933333333',
      password: 'P1PasswordZero@2026',
      planTier: 'personal',
    });

    server = http.createServer(async (req, res) => {
      const handled = await handleStudioApiRequest(req, res);
      if (!handled) {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    for (const filePath of createdFiles) {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {}
    }
    try {
      await withFileLock(channelsFile, () => {
        if (!fs.existsSync(channelsFile)) return;
        const reg = JSON.parse(fs.readFileSync(channelsFile, 'utf8'));
        delete reg.P1_TEST_01;
        delete reg.P1_OTHER_02;
        delete reg.P1_ZERO_03;
        if (Object.keys(reg).length === 0) {
          fs.unlinkSync(channelsFile);
        } else {
          writeJsonAtomic(channelsFile, reg);
        }
      });
    } catch {}
  });

  it('SEC-08: Blocks IPv4/IPv6 transition SSRF addresses & strips sensitive headers cross-origin on manual redirects', async () => {
    expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true);
    expect(isPrivateOrReservedIp('10.20.30.40')).toBe(true);
    expect(isPrivateOrReservedIp('::1')).toBe(true);
    expect(isPrivateOrReservedIp('fc00::1')).toBe(true);
    expect(isPrivateOrReservedIp('::ffff:127.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('::ffff:169.254.169.254')).toBe(true);
    expect(isPrivateOrReservedIp('2002:7f00:0001::')).toBe(true);
    expect(isPrivateOrReservedIp('64:ff9b::10.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('2001:0000:4136:e378:8000:63bf:3fff:fdd2')).toBe(true);

    expect(isPrivateOrReservedIp('104.21.45.12')).toBe(false);
    expect(isPrivateOrReservedIp('2606:4700:4700::1111')).toBe(false);

    vi.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
    const seenHeaders: Record<string, any>[] = [];
    const res = await safeOutboundFetch('https://origin-a.example/start', {
      headers: {
        Authorization: 'Bearer super-secret-token',
        'x-goog-api-key': 'AIzaSensitiveHeaderKey',
        Accept: 'application/json',
      },
      requestFn: async (parsed, _ip, _family, reqOpts) => {
        seenHeaders.push(reqOpts.headers);
        if (parsed.hostname === 'origin-a.example') {
          return {
            status: 302,
            statusText: 'Found',
            headers: { location: 'https://origin-b.example/final' },
            bodyBuffer: Buffer.alloc(0),
          };
        }
        return {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          bodyBuffer: Buffer.from(JSON.stringify({ ok: true })),
        };
      },
    });

    expect(res.ok).toBe(true);
    expect(seenHeaders).toHaveLength(2);
    expect(seenHeaders[0].Authorization).toBe('Bearer super-secret-token');
    expect(seenHeaders[1].Authorization).toBeUndefined();
    expect(seenHeaders[1]['x-goog-api-key']).toBeUndefined();
    expect(seenHeaders[1].Accept).toBe('application/json');

    await expect(
      safeOutboundFetch('https://origin-a.example/start', {
        requestFn: async () => ({
          status: 302,
          statusText: 'Found',
          headers: { location: 'https://169.254.169.254/latest/meta-data/' },
          bodyBuffer: Buffer.alloc(0),
        }),
      })
    ).rejects.toThrow(/SSRF_BLOCKED/i);
  });

  it('SEC-09: Enforces HttpOnly cookie auth, rejects ?authToken= URL query, and revokes tokenVersion via /api/auth/logout', async () => {
    const token = issueServerAuthToken('P1_TEST_01');
    expect(token.split('.')).toHaveLength(4);

    // 1. URL query ?authToken= MUST be rejected with 401
    const queryRes = await callEndpoint(
      port,
      'GET',
      `/api/analytics/platform-traffic?authToken=${encodeURIComponent(token)}`
    );
    expect(queryRes.status).toBe(401);

    // 2. HttpOnly cookie auth succeeds
    const cookieRes = await callEndpoint(port, 'GET', '/api/analytics/platform-traffic', undefined, {
      Cookie: `synapes_session=${token}`,
    });
    expect(cookieRes.status).toBe(200);
    expect(cookieRes.json.success).toBe(true);

    // 3. Logout clears cookie and revokes tokenVersion immediately
    const logoutRes = await callEndpoint(port, 'POST', '/api/auth/logout', {}, {
      Cookie: `synapes_session=${token}`,
    });
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.json.loggedOut).toBe(true);
    const setCookieHeader = String(logoutRes.headers['set-cookie'] || '');
    expect(setCookieHeader).toContain('synapes_session=');
    expect(setCookieHeader).toContain('HttpOnly');
    expect(setCookieHeader).toContain('Max-Age=0');

    // Old token & cookie are now permanently revoked
    const afterLogoutBearer = await callEndpoint(port, 'GET', '/api/analytics/platform-traffic', undefined, {
      Authorization: `Bearer ${token}`,
    });
    expect(afterLogoutBearer.status).toBe(401);
  });

  it('SEC-13 & SEC-16: Removes TLS rejectUnauthorized: false and preserves serialized concurrent writes via withFileLock + writeJsonAtomic', async () => {
    const incidentSrc = fs.readFileSync(path.resolve(process.cwd(), 'server/incidentReporter.mjs'), 'utf8');
    const backendSrc = fs.readFileSync(path.resolve(process.cwd(), 'server/studioBackendEngine.mjs'), 'utf8');
    expect(incidentSrc).not.toContain('rejectUnauthorized: false');
    expect(backendSrc).not.toContain('rejectUnauthorized: false');

    const tmpFile = path.join(os.tmpdir(), `synapes_atomic_p1_${Date.now()}.json`);
    createdFiles.push(tmpFile);
    writeJsonAtomic(tmpFile, { count: 0 });

    await Promise.all(
      Array.from({ length: 12 }, (_, idx) =>
        withFileLock(tmpFile, async () => {
          const cur = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
          await new Promise((r) => setTimeout(r, (idx % 3) * 4));
          writeJsonAtomic(tmpFile, { count: cur.count + 1 });
        })
      )
    );

    const finalData = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
    expect(finalData.count).toBe(12);
    const leftoverTmp = fs.readdirSync(path.dirname(tmpFile)).filter((f) => f.includes(path.basename(tmpFile) + '.tmp.'));
    expect(leftoverTmp).toHaveLength(0);
  });

  it('FAKE-01..05: Encrypts Drive archives AES-256-GCM at rest, supports YouTube Resumable Upload & publishAt, and keeps analytics zero-fake', async () => {
    const tokenA = issueServerAuthToken('P1_TEST_01');
    const tokenB = issueServerAuthToken('P1_OTHER_02');
    const projId = 'p1_drive_test_01';
    const archiveDiskPath = path.join(dataDir, 'drive_archives', `${projId}.json`);
    createdFiles.push(archiveDiskPath);

    // 1. Drive sync writes AES-256-GCM encrypted payload on disk
    const syncRes = await callEndpoint(
      port,
      'POST',
      '/api/drive/sync-project',
      {
        project: {
          id: projId,
          title: 'Secret P1 Project Archive',
          aspectRatio: '16:9',
          storyboard: [{ sceneNumber: 1, startSec: 0, endSec: 6, voiceover: 'Loi thoai bi mat P1' }],
        },
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    expect(syncRes.status).toBe(200);
    expect(syncRes.json.encryptedAtRest).toBe(true);

    const diskRaw = fs.readFileSync(archiveDiskPath, 'utf8');
    const diskObj = JSON.parse(diskRaw);
    expect(diskObj.encrypted).toBe(true);
    expect(typeof diskObj.encryptedPayload).toBe('string');
    expect(diskRaw).not.toContain('Loi thoai bi mat P1');

    // Cross-user forbidden (403), owner decrypts cleanly (200)
    const crossRead = await callEndpoint(port, 'GET', `/api/drive/archive/${projId}`, undefined, {
      Authorization: `Bearer ${tokenB}`,
    });
    expect(crossRead.status).toBe(403);

    const ownerRead = await callEndpoint(port, 'GET', `/api/drive/archive/${projId}`, undefined, {
      Authorization: `Bearer ${tokenA}`,
    });
    expect(ownerRead.status).toBe(200);
    expect(ownerRead.json.encryptedAtRest).toBe(true);
    expect(ownerRead.json.archive.srtContent).toContain('Loi thoai bi mat P1');

    // 2. YouTube publish endpoint + zero-fake analytics
    const unauthYt = await callEndpoint(port, 'POST', '/api/channels/publish-youtube', { title: 'Test' });
    expect(unauthYt.status).toBe(401);

    const tokenZero = issueServerAuthToken('P1_ZERO_03');
    const zeroAnalytics = await callEndpoint(port, 'GET', '/api/analytics/platform-traffic', undefined, {
      Authorization: `Bearer ${tokenZero}`,
    });
    expect(zeroAnalytics.status).toBe(200);
    expect(zeroAnalytics.json.totals.all).toBe(0);
    expect(zeroAnalytics.json.dataSource).toBe('none');
    expect(zeroAnalytics.json.engagementRate).toEqual({ tiktok: 0, facebook: 0, youtube: 0 });
    expect(zeroAnalytics.json.benchmarkSeries.every((b: any) => b.isBenchmarkOnly === true)).toBe(true);

    // Connect YouTube via mocked tokeninfo + test resumable upload
    vi.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '142.250.190.46', family: 4 }] as any);
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init: any) => {
      const target = String(url);
      if (target.includes('oauth2.googleapis.com/tokeninfo')) {
        return new Response(
          JSON.stringify({
            email: 'creator@example.com',
            expires_in: '3600',
            scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
          }),
          { status: 200 }
        );
      }
      if (target.includes('googleapis.com/youtube/v3/channels')) {
        return new Response(
          JSON.stringify({
            items: [{
              id: 'UC_P1_TEST',
              snippet: { title: 'Kenh P1 Real', customUrl: '@p1real' },
              statistics: { subscriberCount: '120', videoCount: '4', viewCount: '500' },
            }],
          }),
          { status: 200 }
        );
      }
      if (target.includes('upload.googleapis.com/upload/youtube/v3/videos') && init?.method === 'PUT') {
        return new Response(JSON.stringify({ id: 'yt_p1_real_99' }), { status: 200 });
      }
      if (target.includes('www.googleapis.com/upload/youtube/v3/videos')) {
        return new Response('', {
          status: 200,
          headers: { location: 'https://upload.googleapis.com/upload/youtube/v3/videos?upload_id=p1_up_1' },
        });
      }
      return new Response('Not Found', { status: 404 });
    });

    const connRes = await callEndpoint(
      port,
      'POST',
      '/api/channels/connect',
      {
        platform: 'youtube',
        oauthToken: 'ya29.a0P1RealGoogleTestToken1234567890',
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    expect(connRes.status).toBe(200);

    const fakeVideoBytes = Buffer.alloc(600, 0x41).toString('base64');
    const futurePublishAt = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    const ytUpRes = await callEndpoint(
      port,
      'POST',
      '/api/channels/publish-youtube',
      {
        title: 'P1 Real Resumable Video',
        publishAt: futurePublishAt,
        videoBase64: `data:video/mp4;base64,${fakeVideoBytes}`,
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    expect(ytUpRes.status).toBe(200);
    expect(ytUpRes.json.videoId).toBe('yt_p1_real_99');
    expect(ytUpRes.json.watchUrl).toBe('https://www.youtube.com/watch?v=yt_p1_real_99');
    expect(ytUpRes.json.privacyStatus).toBe('private');
  });

  it('TOOL-* & UX-*: Verifies P1 UI honesty, aspect ratio 4:5, monochrome saturation LUT, mobile drawer & guide alignment', () => {
    const typesSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/types/index.ts'), 'utf8');
    const scriptGenSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/services/aiScriptGeneratorService.ts'), 'utf8');
    const playerSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/AiCinemaPlayer.tsx'), 'utf8');
    const voiceSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/services/voiceStudioService.ts'), 'utf8');
    const mockSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/data/mockData.ts'), 'utf8');
    const stitcherSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/MultiClipStitcherStudio.tsx'), 'utf8');
    const reviewSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ProjectReviewWorkspace.tsx'), 'utf8');
    const chartSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/MiniPeakHoursAreaChart.tsx'), 'utf8');
    const appSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
    const clonerSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/VideoClonerView.tsx'), 'utf8');
    const guideSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/UserGuideView.tsx'), 'utf8');

    expect(typesSrc).toContain("'4:5'");
    expect(scriptGenSrc).not.toContain('vi-child-female');
    expect(scriptGenSrc).not.toContain('vi-child-male');
    expect(scriptGenSrc).not.toContain('vi-gentle-female');
    expect(scriptGenSrc).not.toContain('vi-mature-male');
    expect(scriptGenSrc).toContain('writersRoomDirective');
    expect(scriptGenSrc).toContain('TRANSITION_PRESET_CATALOG');

    expect(playerSrc).toContain("globalCompositeOperation = 'saturation'");
    expect(playerSrc).toContain('loadCustomGltfAvatar');
    expect(playerSrc).toContain('exportCanvasWithMediabunnyMp4');
    expect(voiceSrc).toContain("type === 'glitch'");
    expect(mockSrc).not.toMatch(/core-editly[\s\S]{0,300}\[ĐÃ CÀI RUNTIME\]/);

    expect(stitcherSrc).not.toContain('images.unsplash.com');
    expect(reviewSrc).not.toContain('2026-11-15');
    expect(chartSrc).not.toContain('let m = 1000');

    expect(appSrc).toContain('mobile-sidebar-drawer');
    expect(clonerSrc).not.toContain('Chi phí chủ: 0đ');
    expect(guideSrc).toContain('180 phút');
    expect(guideSrc).toContain("id: 'voice-studio-guide'");
  });
});
