import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  MODEL_3D_STYLE_CATALOG,
  is3DStyleAllowedForTier,
  computeGeometryConfidence,
  resolveActiveByokLlmCredentials,
} from '../src/services/multiView3dService';
import { EMPTY_AI_CONFIG } from '../src/services/userProfileService';
import { handleStudioApiRequest } from '../server/studioBackendEngine.mjs';

function makePngDataUrl(seedByte: number): { dataUrl: string; expectedSha256: string } {
  // Minimal valid binary buffer (36 bytes) wrapped as PNG Data URL for server byte + SHA-256 verification
  const bytes = Buffer.alloc(64, seedByte);
  // PNG signature header (8 bytes)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes, 0);
  const expectedSha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  return {
    dataUrl: `data:image/png;base64,${bytes.toString('base64')}`,
    expectedSha256,
  };
}

function localHttpJson(
  port: number,
  method: 'GET' | 'POST',
  urlPath: string,
  payload?: unknown
): Promise<{ status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const bodyStr = payload !== undefined ? JSON.stringify(payload) : '';
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers:
          payload !== undefined
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
              }
            : {},
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({
            status: res.statusCode || 500,
            json: text ? JSON.parse(text) : {},
          });
        });
      }
    );
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

describe('Day 1 — Multi-View 3D (1-5 Views), 3 vs 6 Style Tiering & BYOK Execution', () => {
  let server: http.Server;
  let port = 0;

  beforeAll(async () => {
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

  it('1. Enforces 3 Personal 3D styles vs 6 Enterprise 3D styles cleanly', () => {
    expect(MODEL_3D_STYLE_CATALOG).toHaveLength(6);

    // Personal unlocks strictly 3 styles
    expect(is3DStyleAllowedForTier('3d-cartoon', 'personal')).toBe(true);
    expect(is3DStyleAllowedForTier('3d-isometric', 'personal')).toBe(true);
    expect(is3DStyleAllowedForTier('3d-claymation', 'personal')).toBe(true);
    expect(is3DStyleAllowedForTier('low-poly-3d', 'personal')).toBe(false);
    expect(is3DStyleAllowedForTier('cel-shading-npr', 'personal')).toBe(false);
    expect(is3DStyleAllowedForTier('stylized-3d', 'personal')).toBe(false);

    // Enterprise unlocks all 6 styles
    for (const style of MODEL_3D_STYLE_CATALOG) {
      expect(is3DStyleAllowedForTier(style.id, 'enterprise')).toBe(true);
    }
  });

  it('2. Computes exact Geometry Confidence and Engine routing for 1 to 5 images', () => {
    expect(computeGeometryConfidence([])).toMatchObject({ pct: 0, viewCount: 0, hasFront: false });
    expect(computeGeometryConfidence([{ slot: 'front' }])).toMatchObject({
      pct: 74,
      viewCount: 1,
      hasFront: true,
      recommendedEngine: 'TRELLIS.2 Single-View',
    });
    expect(computeGeometryConfidence([{ slot: 'front' }, { slot: 'back' }])).toMatchObject({
      pct: 83,
      recommendedEngine: 'Hunyuan3D-2mv (2 Views)',
    });
    expect(
      computeGeometryConfidence([{ slot: 'front' }, { slot: 'back' }, { slot: 'left' }])
    ).toMatchObject({
      pct: 90,
      recommendedEngine: 'Hunyuan3D-2mv (3 Views)',
    });
    expect(
      computeGeometryConfidence([
        { slot: 'front' },
        { slot: 'back' },
        { slot: 'left' },
        { slot: 'right' },
      ])
    ).toMatchObject({
      pct: 95,
      recommendedEngine: 'TRELLIS.2 Multi-View (4 Views)',
    });
    expect(
      computeGeometryConfidence([
        { slot: 'front' },
        { slot: 'back' },
        { slot: 'left' },
        { slot: 'right' },
        { slot: 'detail' },
      ])
    ).toMatchObject({
      pct: 97,
      recommendedEngine: 'TRELLIS.2 Multi-View Full (5 Views)',
    });
  });

  it('3. Resolves user BYOK LLM credentials strictly from aiConfig without defaults', () => {
    expect(resolveActiveByokLlmCredentials(EMPTY_AI_CONFIG)).toBeNull();
    const withGemini = {
      ...EMPTY_AI_CONFIG,
      activeProvider: 'gemini' as const,
      gemini: { apiKey: 'AIzaSyTestUserKey12345', model: 'gemini-3-flash-preview', ttsVoice: 'vi-VN' },
    };
    expect(resolveActiveByokLlmCredentials(withGemini)).toMatchObject({
      provider: 'gemini',
      apiKey: 'AIzaSyTestUserKey12345',
      model: 'gemini-3-flash-preview',
    });
  });

  it('4. Backend GET /api/assets-3d/styles exposes tier gating accurately', async () => {
    const personalRes = await localHttpJson(port, 'GET', '/api/assets-3d/styles?planTier=personal');
    expect(personalRes.status).toBe(200);
    expect(personalRes.json.styles).toHaveLength(6);
    expect(personalRes.json.styles.filter((s: any) => s.unlocked)).toHaveLength(3);

    const entRes = await localHttpJson(port, 'GET', '/api/assets-3d/styles?planTier=enterprise');
    expect(entRes.status).toBe(200);
    expect(entRes.json.styles.filter((s: any) => s.unlocked)).toHaveLength(6);
  });

  it('5. Backend POST /api/assets-3d/reconstruct validates 1-5 bounds (400) and planTier locks (403)', async () => {
    const img1 = makePngDataUrl(1);
    const resZero = await localHttpJson(port, 'POST', '/api/assets-3d/reconstruct', {
      styleId: '3d-cartoon',
      planTier: 'personal',
      referenceImages: [],
    });
    expect(resZero.status).toBe(400);
    expect(resZero.json.code).toBe('INVALID_VIEW_COUNT');

    const resSix = await localHttpJson(port, 'POST', '/api/assets-3d/reconstruct', {
      styleId: '3d-cartoon',
      planTier: 'enterprise',
      referenceImages: [
        { slot: 'front', dataUrl: img1.dataUrl },
        { slot: 'back', dataUrl: img1.dataUrl },
        { slot: 'left', dataUrl: img1.dataUrl },
        { slot: 'right', dataUrl: img1.dataUrl },
        { slot: 'detail', dataUrl: img1.dataUrl },
        { slot: 'detail', dataUrl: img1.dataUrl },
      ],
    });
    expect(resSix.status).toBe(400);
    expect(resSix.json.code).toBe('INVALID_VIEW_COUNT');

    const resLocked = await localHttpJson(port, 'POST', '/api/assets-3d/reconstruct', {
      styleId: 'cel-shading-npr',
      planTier: 'personal',
      referenceImages: [{ slot: 'front', dataUrl: img1.dataUrl }],
    });
    expect(resLocked.status).toBe(403);
    expect(resLocked.json.code).toBe('PLAN_TIER_LOCKED');
  });

  it('6. Backend hashes 1, 3, and 5 images accurately and rejects missing BYOK 3D key with HTTP 422 (zero fake GLB)', async () => {
    const v1 = makePngDataUrl(11);
    const v2 = makePngDataUrl(22);
    const v3 = makePngDataUrl(33);
    const v4 = makePngDataUrl(44);
    const v5 = makePngDataUrl(55);

    const r1 = await localHttpJson(port, 'POST', '/api/assets-3d/reconstruct', {
      characterName: 'Meo Con 3D',
      styleId: '3d-claymation',
      planTier: 'personal',
      referenceImages: [{ slot: 'front', dataUrl: v1.dataUrl, laplacianSharpness: 120, width: 1024, height: 1024 }],
      byok3d: { provider: 'huggingface-zerogpu', apiKey: '' },
    });
    expect(r1.status).toBe(422);
    expect(r1.json.code).toBe('BYOK_3D_KEY_REQUIRED');
    expect(r1.json.geometryConfidencePct).toBe(74);
    expect(r1.json.sourceImageHashes).toEqual([v1.expectedSha256]);
    expect(r1.json.manifest?.glbUrl).toBeUndefined();

    const r3 = await localHttpJson(port, 'POST', '/api/assets-3d/reconstruct', {
      characterName: 'Rong Lua 3D',
      styleId: '3d-isometric',
      planTier: 'personal',
      referenceImages: [
        { slot: 'front', dataUrl: v1.dataUrl, laplacianSharpness: 145, width: 1024, height: 1024 },
        { slot: 'back', dataUrl: v2.dataUrl, laplacianSharpness: 132, width: 1024, height: 1024 },
        { slot: 'left', dataUrl: v3.dataUrl, laplacianSharpness: 118, width: 1024, height: 1024 },
      ],
      byok3d: { provider: 'comfyui-kaggle-worker', workerUrl: '' },
    });
    expect(r3.status).toBe(422);
    expect(r3.json.geometryConfidencePct).toBe(90);
    expect(r3.json.recommendedEngine).toBe('Hunyuan3D-2mv (3 Views)');
    expect(r3.json.sourceImageHashes).toEqual([v1.expectedSha256, v2.expectedSha256, v3.expectedSha256]);

    const r5 = await localHttpJson(port, 'POST', '/api/assets-3d/reconstruct', {
      characterName: 'Ho Van 3D',
      styleId: 'stylized-3d',
      planTier: 'enterprise',
      referenceImages: [
        { slot: 'front', dataUrl: v1.dataUrl, laplacianSharpness: 160, width: 1536, height: 1536 },
        { slot: 'back', dataUrl: v2.dataUrl, laplacianSharpness: 152, width: 1536, height: 1536 },
        { slot: 'left', dataUrl: v3.dataUrl, laplacianSharpness: 149, width: 1536, height: 1536 },
        { slot: 'right', dataUrl: v4.dataUrl, laplacianSharpness: 141, width: 1536, height: 1536 },
        { slot: 'detail', dataUrl: v5.dataUrl, laplacianSharpness: 170, width: 1024, height: 1024 },
      ],
      byok3d: { provider: 'huggingface-zerogpu', apiKey: '' },
    });
    expect(r5.status).toBe(422);
    expect(r5.json.geometryConfidencePct).toBe(97);
    expect(r5.json.recommendedEngine).toBe('TRELLIS.2 Multi-View Full (5 Views)');
    expect(r5.json.sourceImageHashes).toEqual([
      v1.expectedSha256,
      v2.expectedSha256,
      v3.expectedSha256,
      v4.expectedSha256,
      v5.expectedSha256,
    ]);
  });

  it('7. Dispatches authenticated BYOK Worker + Vision Check when user provides keys and exposes GET /api/assets-3d/status', async () => {
    const v1 = makePngDataUrl(71);
    const v2 = makePngDataUrl(72);
    const v3 = makePngDataUrl(73);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      const target = String(url);
      if (target.includes('generativelanguage.googleapis.com')) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Cả 3 góc ảnh đồng nhất nhân vật chú trâu đất sét màu nâu cam.' }],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (target.includes('kaggle-worker-mock.trycloudflare.com/api/reconstruct-3d')) {
        return new Response(
          JSON.stringify({
            task_id: 'kaggle_t4_task_888',
            glb_url: 'https://cdn.example.r2.dev/synapes-3d/suu_3d.glb',
            poly_count: 29850,
            rig_bone_count: 52,
          }),
          { status: 202, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    });

    const submitRes = await localHttpJson(port, 'POST', '/api/assets-3d/reconstruct', {
      characterName: 'Suu Dat Set 3D',
      styleId: '3d-claymation',
      planTier: 'personal',
      referenceImages: [
        { slot: 'front', dataUrl: v1.dataUrl, laplacianSharpness: 130, width: 1024, height: 1024 },
        { slot: 'back', dataUrl: v2.dataUrl, laplacianSharpness: 125, width: 1024, height: 1024 },
        { slot: 'left', dataUrl: v3.dataUrl, laplacianSharpness: 122, width: 1024, height: 1024 },
      ],
      byokLlm: {
        provider: 'gemini',
        apiKey: 'AIzaSyUserProvidedTestKey999',
        model: 'gemini-2.5-flash',
      },
      byok3d: {
        provider: 'comfyui-kaggle-worker',
        workerUrl: 'https://kaggle-worker-mock.trycloudflare.com',
        modelId: 'hunyuan3d-2mv-unirig',
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(submitRes.status).toBe(202);
    expect(submitRes.json.success).toBe(true);
    expect(submitRes.json.manifest.glbUrl).toBe('https://cdn.example.r2.dev/synapes-3d/suu_3d.glb');
    expect(submitRes.json.manifest.rigBoneCount).toBe(52);
    expect(submitRes.json.manifest.approvalStatus).toBe('ready_for_review');
    expect(submitRes.json.qcReport.visionConsistencyNote).toContain('đồng nhất');

    const statusRes = await localHttpJson(
      port,
      'GET',
      `/api/assets-3d/status?jobId=${encodeURIComponent(submitRes.json.manifest.jobId)}`
    );
    expect(statusRes.status).toBe(200);
    expect(statusRes.json.manifest.jobId).toBe(submitRes.json.manifest.jobId);
  });

  it('8. Validates workflows/comfyui_multiview_1to5.json schema and slots cleanly', () => {
    const wfPath = path.resolve(process.cwd(), 'workflows', 'comfyui_multiview_1to5.json');
    const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
    expect(wf['1'].class_type).toBe('LoadImage');
    expect(wf['5'].class_type).toBe('LoadImage');
    expect(wf['6'].class_type).toBe('RMBG2_MultiViewCutout');
    expect(wf['7'].class_type).toBe('DINOv2_ConsistencyGate');
    expect(wf['8'].class_type).toBe('Hunyuan3D2MV_MultiViewMesh');
    expect(wf['9'].class_type).toBe('Trellis2_MultiImageMesh');
    expect(wf['11'].class_type).toBe('UniRig_AutoRigHumanoidQuadruped');
    expect(wf['12'].class_type).toBe('SaveGLB');
  });
});
