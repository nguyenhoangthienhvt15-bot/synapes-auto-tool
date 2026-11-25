import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import {
  handleStudioApiRequest,
  issueServerAuthToken,
} from '../server/studioBackendEngine.mjs';

describe('Google OAuth 2.0 PKCE & YouTube Channel Connection Audit Suite', () => {
  let server: http.Server;
  let port = 0;
  const testUserCode = 'TEST_YT_OAUTH_AUDIT';
  let authHeader: Record<string, string>;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      handleStudioApiRequest(req, res).catch((err) => {
        res.statusCode = 500;
        res.end(String(err));
      });
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
    const bearer = issueServerAuthToken(testUserCode);
    authHeader = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bearer}`,
    };
  });

  afterAll(async () => {
    await fetch(`http://127.0.0.1:${port}/api/channels/disconnect`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ userCode: testUserCode, platform: 'youtube' }),
    }).catch(() => {});
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('1. GET /api/oauth/google/config-status returns honest OAuth setup state & callback Redirect URI', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/oauth/google/config-status`, {
      headers: { Host: 'synapes-auto-tool-web-service.onrender.com', 'X-Forwarded-Proto': 'https' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(typeof data.serverConfigured).toBe('boolean');
    expect(data.redirectUri).toContain('/api/oauth/google/callback');
    expect(Array.isArray(data.scopes?.youtube)).toBe(true);
    expect(data.scopes.youtube).toContain('https://www.googleapis.com/auth/youtube.upload');
  });

  it('2. POST /api/oauth/google/start blocks missing clientId with redirectUri guidance and builds valid PKCE S256 URL when provided', async () => {
    // Missing clientId when env GOOGLE_CLIENT_ID is unset
    if (!process.env.GOOGLE_CLIENT_ID) {
      const missingRes = await fetch(`http://127.0.0.1:${port}/api/oauth/google/start`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          userCode: testUserCode,
          platform: 'youtube',
          loginHint: 'nguyenhoangthien.hvt.15@gmail.com',
        }),
      });
      expect(missingRes.status).toBe(400);
      const missingJson = await missingRes.json();
      expect(missingJson.code).toBe('GOOGLE_OAUTH_CLIENT_REQUIRED');
      expect(missingJson.redirectUri).toContain('/api/oauth/google/callback');
    }

    const startRes = await fetch(`http://127.0.0.1:${port}/api/oauth/google/start`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        userCode: testUserCode,
        platform: 'youtube',
        loginHint: 'nguyenhoangthien.hvt.15@gmail.com',
        clientId: '9876543210-unittest.apps.googleusercontent.com',
      }),
    });
    expect(startRes.status).toBe(200);
    const startJson = await startRes.json();
    expect(startJson.success).toBe(true);
    expect(startJson.state).toMatch(/^[a-f0-9]{48}$/);

    const authUrl = new URL(startJson.authUrl);
    expect(authUrl.origin).toBe('https://accounts.google.com');
    expect(authUrl.pathname).toBe('/o/oauth2/v2/auth');
    expect(authUrl.searchParams.get('response_type')).toBe('code');
    expect(authUrl.searchParams.get('code_challenge_method')).toBe('S256');
    expect(authUrl.searchParams.get('code_challenge')).toBeTruthy();
    expect(authUrl.searchParams.get('login_hint')).toBe('nguyenhoangthien.hvt.15@gmail.com');
    expect(authUrl.searchParams.get('scope')).toContain('youtube.readonly');
    expect(authUrl.searchParams.get('scope')).toContain('youtube.upload');
    expect(authUrl.searchParams.get('state')).toBe(startJson.state);

    // Trigger callback with error=access_denied using the valid single-use state
    const denyRes = await fetch(
      `http://127.0.0.1:${port}/api/oauth/google/callback?state=${encodeURIComponent(startJson.state)}&error=access_denied`
    );
    expect(denyRes.status).toBe(400);
    const denyHtml = await denyRes.text();
    expect(denyHtml).toContain('SYNAPES_GOOGLE_OAUTH_RESULT');
    expect(denyHtml).toContain('access_denied');

    // Replaying same state must be rejected cleanly
    const replayRes = await fetch(
      `http://127.0.0.1:${port}/api/oauth/google/callback?state=${encodeURIComponent(startJson.state)}&code=fake_code`
    );
    expect(replayRes.status).toBe(400);
  });

  it('3. GET /api/oauth/google/callback rejects forged/unknown CSRF state with HTTP 400 HTML', async () => {
    const res = await fetch(
      `http://127.0.0.1:${port}/api/oauth/google/callback?state=forged_invalid_state&code=abc`
    );
    expect(res.status).toBe(400);
    const html = await res.text();
    expect(html).toContain('CSRF state mismatch');
    expect(html).toContain('SYNAPES_GOOGLE_OAUTH_RESULT');
  });

  it('4. POST /api/channels/connect rejects fake tokens and unverified raw 1// refresh tokens with HTTP 401', async () => {
    const fakeRes = await fetch(`http://127.0.0.1:${port}/api/channels/connect`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        userCode: testUserCode,
        platform: 'youtube',
        oauthToken: 'ya29.fake_demo_token_should_never_pass',
      }),
    });
    expect(fakeRes.status).toBe(401);

    const refreshBypassRes = await fetch(`http://127.0.0.1:${port}/api/channels/connect`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        userCode: testUserCode,
        platform: 'youtube',
        oauthToken: '1//0g_synthetic_unverified_refresh_token_12345',
      }),
    });
    expect(refreshBypassRes.status).toBe(401);
    const refreshJson = await refreshBypassRes.json();
    expect(refreshJson.error).toContain('Refresh Token');
  });

  it('5. GET /api/channels/status and POST /api/channels/verify-publish accurately reflect unconnected state and never leak secrets', async () => {
    const statusRes = await fetch(`http://127.0.0.1:${port}/api/channels/status`, {
      headers: authHeader,
    });
    expect(statusRes.status).toBe(200);
    const statusJson = await statusRes.json();
    expect(statusJson.success).toBe(true);
    expect(JSON.stringify(statusJson)).not.toContain('encryptedOAuthToken');

    const verifyRes = await fetch(`http://127.0.0.1:${port}/api/channels/verify-publish`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        userCode: testUserCode,
        platform: 'youtube',
      }),
    });
    expect(verifyRes.status).toBe(400);
    const verifyJson = await verifyRes.json();
    expect(verifyJson.success).toBe(false);
  });
});
