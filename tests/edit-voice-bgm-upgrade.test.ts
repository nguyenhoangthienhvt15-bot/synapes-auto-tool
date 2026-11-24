import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import glTransitions from 'gl-transitions';
import {
  VIETNAMESE_VOICE_PROFILES,
  ENGLISH_VOICE_PROFILES,
  computeEffectivePitchRatio,
  resolveSceneVoiceParams,
  normalizeBgmVolumeRatio,
  trimSilenceEdges,
  splitTextIntoSmartChunks,
} from '../src/services/voiceStudioService';
import {
  EDIT_SKILL_LIST,
  EDIT_SKILL_PRESETS,
  computeEasedCameraTransform,
  resolveActiveEditSkill,
} from '../src/utils/cinemaEditSkillsEngine';
import {
  TRANSITION_PRESET_CATALOG,
  normalizeTransitionHint,
  pickSceneTransitionPreset,
} from '../src/utils/glTransitionCompositor';
import {
  NON_TOPIC_MEDIA_TITLE_REGEX,
  DOMAIN_VIDEO_BROLL_POOLS,
  handleStudioApiRequest,
} from '../server/studioBackendEngine.mjs';

function makeMockAudioContext() {
  return {
    createBuffer(channels: number, length: number, sampleRate: number) {
      const channelData = Array.from({ length: channels }, () => new Float32Array(length));
      return {
        numberOfChannels: channels,
        length,
        sampleRate,
        duration: length / sampleRate,
        getChannelData(c: number) {
          return channelData[c];
        },
        copyFromChannel: () => {},
        copyToChannel: () => {},
      } as unknown as AudioBuffer;
    },
  } as unknown as BaseAudioContext;
}

describe('Nâng cấp Edit Engine, 16 Giọng Đọc Đa Sắc Thái & Nhạc Nền MP3', () => {
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

  it('1. 10 giọng Việt & 6 giọng Anh có bản sắc riêng biệt (nativePitchHz, 6-band EQ, acousticSignature)', () => {
    expect(VIETNAMESE_VOICE_PROFILES.length).toBe(10);
    expect(ENGLISH_VOICE_PROFILES.length).toBe(6);

    const viIds = new Set(VIETNAMESE_VOICE_PROFILES.map((v) => v.id));
    expect(viIds.size).toBe(10);
    expect(viIds.has('vi-doc-quoc-bao')).toBe(true);
    expect(viIds.has('vi-kids-bao-an')).toBe(true);

    const enIds = new Set(ENGLISH_VOICE_PROFILES.map((v) => v.id));
    expect(enIds.size).toBe(6);
    expect(enIds.has('en-us-aria')).toBe(true);

    for (const v of [...VIETNAMESE_VOICE_PROFILES, ...ENGLISH_VOICE_PROFILES]) {
      expect(typeof v.nativePitchHz).toBe('number');
      expect(v.acousticSignature && v.acousticSignature.length > 6).toBe(true);
      expect(v.formantEq).toBeDefined();
      expect(typeof v.formantEq?.boxCutDb).toBe('number');
      expect(typeof v.formantEq?.deEsserDb).toBe('number');
      expect((v.breathPauseMs ?? 0) >= 120).toBe(true);
    }

    const docVoice = VIETNAMESE_VOICE_PROFILES.find((v) => v.id === 'vi-doc-quoc-bao')!;
    const kidsVoice = VIETNAMESE_VOICE_PROFILES.find((v) => v.id === 'vi-kids-bao-an')!;
    expect(docVoice.nativePitchHz).toBeLessThan(0);
    expect(kidsVoice.nativePitchHz).toBeGreaterThan(0);
    expect(docVoice.formantEq!.midPeakingHz).not.toBe(kidsVoice.formantEq!.midPeakingHz);
    expect(docVoice.formantEq!.lowGainDb).not.toBe(kidsVoice.formantEq!.lowGainDb);
  });

  it('2. Sửa triệt để lỗi méo giọng kép (double-pitch) trên Neural TTS nhưng giữ nguyên cho Google fallback', () => {
    const sampleProfile = VIETNAMESE_VOICE_PROFILES.find((v) => v.id === 'vi-apple-keynote-male')!;
    expect(computeEffectivePitchRatio(sampleProfile, undefined, 'edge-neural')).toBe(1.0);
    expect(computeEffectivePitchRatio(sampleProfile, undefined, 'openai-studio-hd')).toBe(1.0);
    expect(computeEffectivePitchRatio(sampleProfile, undefined, 'elevenlabs-studio')).toBe(1.0);

    // Google Translate fallback vẫn dùng detune DSP để tạo sắc thái Nam/Nữ
    const dspRatio = computeEffectivePitchRatio(sampleProfile, undefined, 'google-neural-dsp');
    expect(dspRatio).not.toBe(1.0);
  });

  it('3. Khối lồng tiếng liên tục: cắt khoảng lặng dư trimSilenceEdges, chia câu thông minh & normalize BGM', () => {
    const ctx = makeMockAudioContext();
    const sr = 24000;
    const totalSamples = sr * 2; // 2.0 giây (0.5s lặng đầu + 1.0s thoại + 0.5s lặng cuối)
    const rawBuf = ctx.createBuffer(1, totalSamples, sr);
    const data = rawBuf.getChannelData(0);
    for (let i = sr * 0.5; i < sr * 1.5; i++) {
      data[i] = Math.sin((2 * Math.PI * 220 * i) / sr) * 0.5;
    }

    const trimmed = trimSilenceEdges(ctx, rawBuf, 0.01, 35);
    expect(trimmed.length).toBeLessThan(totalSamples * 0.7);
    expect(trimmed.length).toBeGreaterThan(sr * 0.9);

    const longScript =
      'Tin công nghệ nổi bật sáng nay, cổ phiếu bán dẫn tăng mạnh tại Mỹ; ' +
      'giới phân tích đánh giá nhu cầu hạ tầng AI vẫn duy trì đà tăng trưởng hai chữ số. ' +
      'Trong khi đó tại châu Á, chuỗi cung ứng đóng gói chip đang mở rộng công suất kỷ lục.';
    const chunks = splitTextIntoSmartChunks(longScript, 140, 220);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    chunks.forEach((c) => {
      expect(c.text.length).toBeLessThanOrEqual(160);
      expect(c.pauseAfterMs).toBeGreaterThanOrEqual(95);
    });
    expect(chunks[chunks.length - 1].pauseAfterMs).toBeGreaterThanOrEqual(200);

    const params = resolveSceneVoiceParams({
      voiceId: 'vi-doc-quoc-bao',
      voiceLanguage: 'vi',
      startSec: 0,
      endSec: 8,
      voiceover: 'Đây là phân đoạn tài liệu điện ảnh chuẩn quốc tế.',
    });
    expect(params.profile.id).toBe('vi-doc-quoc-bao');
    expect(params.rate).toBeGreaterThanOrEqual(0.85);
    expect(params.rate).toBeLessThanOrEqual(1.3);

    expect(normalizeBgmVolumeRatio(24)).toBe(0.24);
    expect(normalizeBgmVolumeRatio(0.35)).toBe(0.35);
    expect(normalizeBgmVolumeRatio(-10)).toBe(0);
    expect(normalizeBgmVolumeRatio(250)).toBe(1);
  });

  it('4. 5 Edit Skills & 16 GPU GL-Transitions khớp 100% shader hợp lệ trong gl-transitions', () => {
    expect(EDIT_SKILL_LIST.length).toBe(5);
    const glNames = new Set((glTransitions as Array<{ name: string }>).map((t) => t.name));

    expect(TRANSITION_PRESET_CATALOG.length).toBe(16);
    for (const preset of TRANSITION_PRESET_CATALOG) {
      expect(glNames.has(preset.id)).toBe(true);
    }

    expect(normalizeTransitionHint('fade')).toBe('FadeColor');
    expect(normalizeTransitionHint('dissolve')).toBe('DreamyZoom');
    expect(pickSceneTransitionPreset(1, true, undefined)).toBe('InvertedPageCurl');
    expect(
      pickSceneTransitionPreset(0, false, undefined, EDIT_SKILL_PRESETS['viral-retention'].transitionPool)
    ).toBe(EDIT_SKILL_PRESETS['viral-retention'].transitionPool[0]);

    const resolvedSkill = resolveActiveEditSkill({ title: 'Bản tin tài chính 24H' }, 'broadcast-24h');
    const camStart = computeEasedCameraTransform('dolly-in', 0, 0, resolvedSkill, 1280, 720);
    const camEnd = computeEasedCameraTransform('dolly-in', 1, 5, resolvedSkill, 1280, 720);
    expect(camEnd.scale).toBeGreaterThan(camStart.scale);
    expect(Number.isFinite(camStart.tx)).toBe(true);
    expect(Number.isFinite(camEnd.rot)).toBe(true);
  });

  it('5. Bộ lọc B-Roll chặn tuyệt đối bảng thông số GPU (GeForce 8400GS / GT218) và video intro toàn chữ', () => {
    expect(NON_TOPIC_MEDIA_TITLE_REGEX.test('Nvidia_GeForce_8400GS_GT218_specs.png')).toBe(true);
    expect(NON_TOPIC_MEDIA_TITLE_REGEX.test('GPU_Comparison_table_datasheet.png')).toBe(true);
    expect(NON_TOPIC_MEDIA_TITLE_REGEX.test('Black_screen_transcript.jpg')).toBe(true);
    expect(NON_TOPIC_MEDIA_TITLE_REGEX.test('Zoom_Into_a_Microchip.webm')).toBe(true);
    expect(NON_TOPIC_MEDIA_TITLE_REGEX.test('Cynhadledd_Press_Conference.webm')).toBe(true);
    expect(NON_TOPIC_MEDIA_TITLE_REGEX.test('Jensen_Huang_Computex_2025_keynote.jpg')).toBe(false);
    expect(NON_TOPIC_MEDIA_TITLE_REGEX.test('TSMC_Cleanroom_Wafer_Fab_Photo.jpg')).toBe(false);

    const allPoolUrls = Object.values(DOMAIN_VIDEO_BROLL_POOLS)
      .flat()
      .map((item) => `${item.title} ${item.url}`)
      .join('\n');
    expect(/Zoom_Into_a_Microchip|Cynhadledd|Dow_Jones_Sonification/i.test(allPoolUrls)).toBe(false);
  });

  it('6. Server /api/tts live trả về luồng âm thanh thực (>= 4KB) cho từng sắc thái giọng Việt', async () => {
    const res = await fetch(
      `http://127.0.0.1:${port}/api/tts?voiceId=vi-doc-quoc-bao&rate=0.95&pitch=-6Hz&text=${encodeURIComponent(
        'Bản thử nghiệm hệ thống âm thanh phòng thu Synapes.'
      )}`
    );
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type') || '';
    expect(contentType.includes('audio/')).toBe(true);
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.byteLength).toBeGreaterThan(4096);
  }, 15000);
});
