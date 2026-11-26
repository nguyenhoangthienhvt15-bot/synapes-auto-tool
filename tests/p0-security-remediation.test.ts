import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {
  handleStudioApiRequest,
  issueServerAuthToken,
  resolveRequiredSecret,
  getTrustedClientIp,
  computeServerPasswordHash,
  verifyServerPasswordHash,
  encryptProfileSecretsAtRest,
  decryptProfileSecretsAtRest,
  IP_BLACKLIST,
  _seedTestAuthAccount,
  _getPendingForgotOtpForTest,
} from '../server/studioBackendEngine.mjs';
import { generateContractHtml } from '../src/utils/contractPdfGenerator';
import { getDisconnectedChannels } from '../src/services/userProfileService';
import { PROVIDERS, dedupeModelsById, getProviderModels } from '../src/services/aiModelDiscoveryService';
import { generateAiVideoScript } from '../src/services/aiScriptGeneratorService';
import { INITIAL_SKILLS } from '../src/data/mockData';

async function callEndpoint(
  port: number,
  method: 'GET' | 'POST' | 'OPTIONS',
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

describe('P0 Security & Integrity Remediation Suite', () => {
  let server: http.Server;
  let port = 0;

  beforeAll(async () => {
    _seedTestAuthAccount({
      code: 'P0_TEST_01',
      clientName: 'Nguoi Dung Kiem Thu P0',
      registeredGmail: 'p0test@example.com',
      phone: '0912345678',
      password: 'InitPass@2026',
      planTier: 'personal',
    });
    _seedTestAuthAccount({
      code: 'P0_OTHER_02',
      clientName: 'Nguoi Dung Khac',
      registeredGmail: 'other@example.com',
      phone: '0987654321',
      password: 'OtherPass@2026',
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
  });

  it('SEC-01 & SEC-06: Enforces fail-closed secrets in production and encrypts plugin.apiToken at rest', () => {
    expect(() =>
      resolveRequiredSecret(['__MISSING_P0_ENV_KEY__'], 'missing_p0', { enforceProduction: true })
    ).toThrow(/FAIL-CLOSED/i);

    const devSecret = resolveRequiredSecret(['__MISSING_P0_ENV_KEY__'], 'dev_p0_ephemeral', {
      enforceProduction: false,
    });
    expect(devSecret.length).toBeGreaterThanOrEqual(64);

    const encrypted = encryptProfileSecretsAtRest({
      aiConfig: {
        gemini: { apiKey: 'AIzaSySecretGemini123456' },
        plugin: { endpointUrl: 'https://api.klingai.com', apiToken: 'sk_live_plugin_secret_987654' },
        threeDEngine: { provider: 'huggingface-zerogpu', apiKey: 'hf_secret_3d_token_12345' },
      },
      channels: [{ id: 'yt', oauthToken: 'ya29.secret_oauth_token' }],
    });

    expect(encrypted.aiConfig.gemini.apiKey).toMatch(/^enc:gcm:v1:/);
    expect(encrypted.aiConfig.plugin.apiToken).toMatch(/^enc:gcm:v1:/);
    expect(encrypted.aiConfig.threeDEngine.apiKey).toMatch(/^enc:gcm:v1:/);
    expect(encrypted.channels[0].oauthToken).toMatch(/^enc:gcm:v1:/);

    const decrypted = decryptProfileSecretsAtRest(encrypted);
    expect(decrypted.aiConfig.plugin.apiToken).toBe('sk_live_plugin_secret_987654');
    expect(decrypted.aiConfig.threeDEngine.apiKey).toBe('hf_secret_3d_token_12345');
    expect(decrypted.aiConfig.gemini.apiKey).toBe('AIzaSySecretGemini123456');
  });

  it('SEC-02: Uses salted scrypt hashes and blocks Pass-the-Hash on login & change-password', async () => {
    const h1 = computeServerPasswordHash('P0_TEST_01', 'StrongPass#2026');
    const h2 = computeServerPasswordHash('P0_TEST_01', 'StrongPass#2026');
    expect(h1).toMatch(/^scrypt\$v1\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
    expect(h1).not.toBe(h2);

    expect(verifyServerPasswordHash('P0_TEST_01', 'StrongPass#2026', h1).valid).toBe(true);
    expect(verifyServerPasswordHash('P0_TEST_01', h1, h1).valid).toBe(false);
    expect(() => computeServerPasswordHash('P0_TEST_01', 'BCRYPT$1234567890ABCDEF1234567890ABCDEF')).toThrow(
      /PASS_THE_HASH_REJECTED/
    );

    const pthLogin = await callEndpoint(port, 'POST', '/api/auth/login', {
      code: 'P0_TEST_01',
      password: 'BCRYPT$1234567890ABCDEF1234567890ABCDEF',
    });
    expect(pthLogin.status).toBe(401);

    const okLogin = await callEndpoint(port, 'POST', '/api/auth/login', {
      code: 'P0_TEST_01',
      password: 'InitPass@2026',
    });
    expect(okLogin.status).toBe(200);
    expect(okLogin.json.authToken).toBeTruthy();

    const pthChange = await callEndpoint(
      port,
      'POST',
      '/api/auth/change-password',
      {
        code: 'P0_TEST_01',
        passwordHash: 'BCRYPT$1234567890ABCDEF1234567890ABCDEF',
      },
      { Authorization: `Bearer ${okLogin.json.authToken}` }
    );
    expect(pthChange.status).toBe(400);
    expect(pthChange.json.code).toBe('RAW_HASH_REJECTED');
  });

  it('SEC-04: Enforces 6-digit OTP verification on /api/auth/forgot-password', async () => {
    // Attempt without OTP must NOT change password even if newPassword is supplied
    const reqRes = await callEndpoint(port, 'POST', '/api/auth/forgot-password', {
      email: 'p0test@example.com',
      phone: '0912345678',
      newPassword: 'UnauthorizedOverwrite@99',
    });
    expect(reqRes.status).toBe(200);
    expect(reqRes.json.matched).toBe(true);
    expect(reqRes.json.otpSent).toBe(true);

    const attackerLogin = await callEndpoint(port, 'POST', '/api/auth/login', {
      code: 'P0_TEST_01',
      password: 'UnauthorizedOverwrite@99',
    });
    expect(attackerLogin.status).toBe(401);

    // Wrong OTP must be rejected
    const wrongOtpRes = await callEndpoint(port, 'POST', '/api/auth/forgot-password', {
      step: 'verify_otp',
      email: 'p0test@example.com',
      phone: '0912345678',
      otp: '000000',
      newPassword: 'VerifiedOtpPass@2026',
    });
    expect(wrongOtpRes.status).toBe(401);
    expect(wrongOtpRes.json.verified).toBe(false);

    const realOtp = _getPendingForgotOtpForTest('p0test@example.com');
    expect(realOtp).toMatch(/^\d{6}$/);

    const verifyOk = await callEndpoint(port, 'POST', '/api/auth/forgot-password', {
      step: 'verify_otp',
      email: 'p0test@example.com',
      phone: '0912345678',
      otp: realOtp,
      newPassword: 'VerifiedOtpPass@2026',
    });
    expect(verifyOk.status).toBe(200);
    expect(verifyOk.json.verified).toBe(true);

    const newLogin = await callEndpoint(port, 'POST', '/api/auth/login', {
      code: 'P0_TEST_01',
      password: 'VerifiedOtpPass@2026',
    });
    expect(newLogin.status).toBe(200);

    // OTP replay must fail
    const replay = await callEndpoint(port, 'POST', '/api/auth/forgot-password', {
      step: 'verify_otp',
      email: 'p0test@example.com',
      phone: '0912345678',
      otp: realOtp,
      newPassword: 'AnotherPass@2026',
    });
    expect(replay.status).toBe(400);
  });

  it('SEC-04 & SEC-07: Requires Bearer auth on all sensitive endpoints & enforces render-job ownership', async () => {
    const protectedCalls = await Promise.all([
      callEndpoint(port, 'POST', '/api/llm-generate', { mode: 'studio-research', userPrompt: 'AI' }),
      callEndpoint(port, 'POST', '/api/ai-proxy', { mode: 'studio-research', userPrompt: 'AI' }),
      callEndpoint(port, 'GET', '/api/analytics/platform-traffic?userCode=P0_TEST_01'),
      callEndpoint(port, 'GET', '/api/auth/password-quota?code=P0_TEST_01'),
      callEndpoint(port, 'GET', '/api/registration-signature?email=p0test@example.com'),
      callEndpoint(port, 'POST', '/api/plugin/dispatch', { provider: 'kling', endpoint: 'https://api.klingai.com/v1', apiKey: 'sk_1234567890abcdef' }),
      callEndpoint(port, 'POST', '/api/render-jobs/submit', { prompt: 'Test render prompt' }),
      callEndpoint(port, 'GET', '/api/render-jobs/status?jobId=job_missing'),
      callEndpoint(port, 'GET', '/api/system/apps-script-template'),
    ]);

    for (const res of protectedCalls) {
      expect(res.status).toBe(401);
    }

    const tokenA = issueServerAuthToken('P0_TEST_01');
    const tokenB = issueServerAuthToken('P0_OTHER_02');

    const submitRes = await callEndpoint(
      port,
      'POST',
      '/api/render-jobs/submit',
      { prompt: 'Render scene ownership test' },
      { Authorization: `Bearer ${tokenA}` }
    );
    expect(submitRes.status).toBe(202);
    expect(submitRes.json.jobId).toBeTruthy();

    const statusOwner = await callEndpoint(
      port,
      'GET',
      `/api/render-jobs/status?jobId=${encodeURIComponent(submitRes.json.jobId)}`,
      undefined,
      { Authorization: `Bearer ${tokenA}` }
    );
    expect(statusOwner.status).toBe(200);

    const statusOther = await callEndpoint(
      port,
      'GET',
      `/api/render-jobs/status?jobId=${encodeURIComponent(submitRes.json.jobId)}`,
      undefined,
      { Authorization: `Bearer ${tokenB}` }
    );
    expect(statusOther.status).toBe(403);

    const watchdog = await callEndpoint(port, 'GET', '/api/system/health-watchdog');
    expect(watchdog.status).toBe(200);
    expect(watchdog.json.leadEmail).toBeUndefined();
  });

  it('SEC-10 & SEC-11: Blocks wildcard .onrender.com CORS & spoofed X-Forwarded-For DoS bans', async () => {
    const evilCors = await callEndpoint(port, 'OPTIONS', '/api/system/ip-time', undefined, {
      Origin: 'https://evil-attacker.onrender.com',
    });
    expect(evilCors.status).toBe(403);
    expect(evilCors.headers['access-control-allow-origin']).toBeUndefined();

    const validCors = await callEndpoint(port, 'OPTIONS', '/api/system/ip-time', undefined, {
      Origin: 'https://synapes-auto-tool-web-service.onrender.com',
    });
    expect(validCors.status).toBe(204);
    expect(validCors.headers['access-control-allow-origin']).toBe('https://synapes-auto-tool-web-service.onrender.com');

    const prevTrust = process.env.TRUST_PROXY;
    process.env.TRUST_PROXY = '0';
    const spoofedIp = getTrustedClientIp({
      headers: { 'x-forwarded-for': '8.8.8.8, 1.1.1.1' },
      socket: { remoteAddress: '::ffff:192.0.2.55' },
    } as any);
    expect(spoofedIp).toBe('192.0.2.55');
    if (prevTrust === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = prevTrust;

    IP_BLACKLIST.clear();
    const vioRes = await callEndpoint(
      port,
      'POST',
      '/api/security/report-violation',
      { violationType: 'devtools_test' },
      { 'X-Forwarded-For': '9.9.9.9' }
    );
    expect(vioRes.status).toBe(200);
    expect(vioRes.json.banned).toBe(false);
    expect(IP_BLACKLIST.has('9.9.9.9')).toBe(false);
    expect(IP_BLACKLIST.has('127.0.0.1')).toBe(false);
  });

  it('SEC-05: Escapes HTML/XSS in generateContractHtml and enforces JSONP callback regex in Code.js', () => {
    const html = generateContractHtml({
      fullName: '</title><script>alert(1)</script>',
      dob: '01/01/1999',
      gender: 'Nam',
      email: 'test@example.com',
      phone: '0900000000',
      address: '<img src=x onerror=alert(2)>',
      contractCategory: 'personal',
      contractPackage: 'personal_deposit',
      contractPackageName: '<b>InjectedPkg</b>',
      signatureImage: 'x" onerror="alert(3)',
      termsAccepted: true,
      registeredAt: '26/11/2026',
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('onerror="alert(3)');
    expect(html).toContain('&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;');

    const contractGenSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/utils/contractPdfGenerator.ts'), 'utf8');
    expect(/\b0722\d{8}\b/.test(contractGenSrc)).toBe(false);
    expect(contractGenSrc).toContain('VITE_PARTY_A_ID_NUMBER');

    const gasCode = fs.readFileSync(path.resolve(process.cwd(), 'google-apps-script', 'Code.js'), 'utf8');
    expect(gasCode).toContain('isValidJsonpCallback');
    expect(gasCode).toContain('^[a-zA-Z_$][0-9a-zA-Z_$]{0,63}$');
    expect(gasCode).toContain('SYNAPES_SYNC_SECRET');
    expect(/\b0722\d{8}\b/.test(gasCode)).toBe(false);
  });

  it('LIVE-01, LIVE-02 & AI-01: Deduplicates Gemini 2.5 Flash, hides unconnected handles, and keeps isLiveApi honest', async () => {
    const geminiMeta = PROVIDERS.find((p) => p.id === 'gemini')!;
    const flashCount = geminiMeta.models.filter((m) => m.id === 'gemini-2.5-flash').length;
    expect(flashCount).toBe(1);

    const deduped = dedupeModelsById([
      { id: 'gemini-2.5-flash', name: 'A', tag: 't1', isLiveFromKey: false },
      { id: 'gemini-2.5-flash', name: 'B', tag: 't2', isLiveFromKey: false },
      { id: 'gemini-2.5-pro', name: 'C', tag: 't3', isLiveFromKey: false },
    ]);
    expect(deduped).toHaveLength(2);
    expect(getProviderModels('gemini', null).filter((m) => m.id === 'gemini-2.5-flash')).toHaveLength(1);

    const disconnected = getDisconnectedChannels('Nguyen Van A', 'nguyenhoangthien.hvt.15@gmail.com');
    for (const ch of disconnected) {
      expect(ch.handle).not.toContain('nguyenhoangthien');
      expect(ch.handle).not.toContain('@');
    }

    // Honest isLiveApi === false when generating without an API key (studio-research mode)
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const urlStr = String(input || '');
      if (urlStr.includes('/api/llm-generate')) {
        return new Response(
          JSON.stringify({
            success: true,
            engineType: 'studio_research',
            isLiveLlm: false,
            text: JSON.stringify({
              title: 'Nghiên cứu hạ tầng bán dẫn',
              description: 'Tổng hợp RSS',
              tags: ['BanDan', 'CongNghe'],
              scenes: [
                {
                  sceneNumber: 1,
                  headline: '01. TOÀN CẢNH NGÀNH BÁN DẪN',
                  durationSec: 6,
                  voiceover: 'Tổng hợp số liệu thực tế về ngành bán dẫn 2026.',
                  visualPrompt: 'Editorial semiconductor cleanroom wafer fabrication photo',
                  cameraMotion: 'dolly-in',
                  lightingStyle: 'studio-clean',
                  sfx: 'Ambient Tech',
                  transition: 'fade',
                },
              ],
            }),
            actualModel: 'SYNAPES Server Research Director',
            tokenTelemetry: {
              provider: 'studio-research',
              model: 'internet-crawler-v3',
              promptTokens: 24,
              completionTokens: 48,
              totalTokens: 72,
              keyStatus: 'research_only',
              failoverTriggered: false,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ query: { pages: {}, search: [] } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const noKeyResult = await generateAiVideoScript({
      prompt: 'Đánh giá hạ tầng bán dẫn 2026',
      skillId: INITIAL_SKILLS[0].id,
      skills: INITIAL_SKILLS,
      aspectRatio: '16:9',
      targetDurationMin: 1,
      creationSpeedMode: 'cloud',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      apiKey: '',
      preHarvestedResearch: {
        query: 'Đánh giá hạ tầng bán dẫn 2026',
        domain: 'hardware',
        headlines: [],
        wikiSummary: '',
        visuals: [],
      },
    });
    expect(noKeyResult.isLiveApi).toBe(false);
    expect(noKeyResult.providerUsed).toBe('SYNAPES Studio');
    expect(noKeyResult.engineMessage).toContain('Chưa kết nối API Key LLM');
  });
});
