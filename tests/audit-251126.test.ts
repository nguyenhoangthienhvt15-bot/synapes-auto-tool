import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import {
  VIETNAMESE_VOICE_PROFILES,
  computeEffectivePitchRatio,
} from '../src/services/voiceStudioService';
import { extractVideoInfo } from '../src/services/videoDeconstructService';
import { detectPluginBrand } from '../src/services/aiModelDiscoveryService';
import { handleStudioApiRequest, issueServerAuthToken } from '../server/studioBackendEngine.mjs';

describe('Kiểm định Audit 25/11/2026: Traffic 180p, BYOK URL, Giọng Nam/Nữ, Plugin Discovery & VoiceDesign', () => {
  let server: http.Server;
  let port = 0;

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
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('1. extractVideoInfo nhận diện YouTube, TikTok (kể cả link rút gọn), Facebook và trả null khi rỗng', () => {
    const yt = extractVideoInfo('https://youtu.be/dX9FeimCeWk?si=uokvQP1RbNaEJp2n');
    expect(yt).not.toBeNull();
    expect(yt?.platform).toBe('youtube');
    expect(yt?.id).toBe('dX9FeimCeWk');

    const ttFull = extractVideoInfo('https://www.tiktok.com/@creator/video/7400000000000000000');
    expect(ttFull?.platform).toBe('tiktok');

    const ttShort = extractVideoInfo('https://vm.tiktok.com/ZSN123abc/');
    expect(ttShort?.platform).toBe('tiktok');

    const fbWatch = extractVideoInfo('https://www.facebook.com/watch?v=123456789');
    expect(fbWatch?.platform).toBe('facebook');

    const fbReel = extractVideoInfo('https://www.facebook.com/reel/987654321');
    expect(fbReel?.platform).toBe('facebook');

    expect(extractVideoInfo('')).toBeNull();
    expect(extractVideoInfo('   ')).toBeNull();
  });

  it('2. computeEffectivePitchRatio tách biệt rõ giọng Nam (Miền Nam trẻ, Miền Bắc, Trầm) vs Nữ khi dùng fallback google-neural-dsp', () => {
    const sgMale = VIETNAMESE_VOICE_PROFILES.find((v) => v.id === 'vi-sg-male-1')!;
    const hnMale = VIETNAMESE_VOICE_PROFILES.find((v) => v.id === 'vi-hn-male-1')!;
    const deepMale = VIETNAMESE_VOICE_PROFILES.find((v) => v.id === 'vi-doc-quoc-bao')!;
    const hnFemale = VIETNAMESE_VOICE_PROFILES.find((v) => v.id === 'vi-hn-female-1')!;

    expect(sgMale).toBeDefined();
    expect(hnMale).toBeDefined();
    expect(deepMale).toBeDefined();
    expect(hnFemale).toBeDefined();

    const rSgMale = computeEffectivePitchRatio(sgMale, sgMale.pitch, 'google-neural-dsp');
    const rHnMale = computeEffectivePitchRatio(hnMale, hnMale.pitch, 'google-neural-dsp');
    const rDeepMale = computeEffectivePitchRatio(deepMale, deepMale.pitch, 'google-neural-dsp');
    const rFemale = computeEffectivePitchRatio(hnFemale, hnFemale.pitch, 'google-neural-dsp');

    expect(rSgMale).toBeLessThan(0.72);
    expect(rHnMale).toBeLessThan(0.64);
    expect(rDeepMale).toBeLessThan(rHnMale);
    expect(rFemale).toBeGreaterThanOrEqual(0.90);

    // Edge Neural giữ nguyên bản sắc không bị double-detune khi slider giữ mặc định
    expect(computeEffectivePitchRatio(sgMale, sgMale.pitch, 'edge-neural')).toBe(1.0);
  });

  it('3. detectPluginBrand nhận diện ElevenLabs qua định dạng Token sk_...', () => {
    const syntheticKey = `sk_${'a'.repeat(48)}`;
    expect(detectPluginBrand('', '', syntheticKey)).toBe('elevenlabs');
    expect(detectPluginBrand('https://api.klingai.com/v1/videos/text2video', 'kling-v1.5', syntheticKey)).toBe('elevenlabs');
  });

  it('4. Backend /api/analytics/platform-traffic chặn request thiếu Bearer token (401) và trả 0 lượt xem khi hợp lệ', async () => {
    const unauthRes = await fetch(`http://127.0.0.1:${port}/api/analytics/platform-traffic?userCode=TEST_UNCONNECTED`);
    expect(unauthRes.status).toBe(401);

    const token = issueServerAuthToken('TEST_UNCONNECTED');
    const res = await fetch(`http://127.0.0.1:${port}/api/analytics/platform-traffic?userCode=TEST_UNCONNECTED`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.scanIntervalMinutes).toBe(180);
    expect(data.hasPersonalData).toBe(false);
    expect(data.connectedChannelsCount).toBe(0);
    expect(data.totals?.all).toBe(0);
  });

  it('5. Backend /api/voicestudio/design-analyze nhận diện đúng Nam miền Nam 17-18 tuổi sang vi-sg-male-1', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/voicestudio/design-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Giọng nam miền Nam Việt Nam 17-18 tuổi, trẻ trung, năng động, sáng rõ',
        gender: 'Nữ',
        age: '26-45',
        emotion: 'Năng động',
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.gender).toBe('Nam');
    expect(data.recommendedVoiceId).toBe('vi-sg-male-1');
  });

  it('6. Backend /api/plugin/discover-models từ chối key rỗng/ngắn và không bịa danh sách Kling giả', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/plugin/discover-models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'abc', endpoint: '' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.models).toEqual([]);
  });
});
