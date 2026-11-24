import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import http from 'node:http';
import crypto from 'node:crypto';
import dns from 'node:dns';
import fs from 'node:fs';
import path from 'node:path';
import {
  handleStudioApiRequest,
  issueServerAuthToken,
  isPrivateOrReservedIp,
  resolveAndValidateSafeUrl,
} from '../server/studioBackendEngine.mjs';
import { discoverModelsFromKey } from '../src/services/aiModelDiscoveryService';

function makePngDataUrlSized(byteLen: number, fillByte: number): { dataUrl: string; expectedSha256: string } {
  const bytes = Buffer.alloc(byteLen, fillByte);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes, 0);
  const expectedSha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  return {
    dataUrl: `data:image/png;base64,${bytes.toString('base64')}`,
    expectedSha256,
  };
}

function rawHttp(
  port: number,
  method: 'GET' | 'POST',
  urlPath: string,
  payload?: unknown,
  headers: Record<string, string> = {}
): Promise<{ status: number; contentType: string; buf: Buffer; json: any }> {
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
          const buf = Buffer.concat(chunks);
          const contentType = String(res.headers['content-type'] || '');
          let json: any = null;
          if (contentType.includes('application/json')) {
            try {
              json = JSON.parse(buf.toString('utf8'));
            } catch {}
          }
          resolve({ status: res.statusCode || 500, contentType, buf, json });
        });
      }
    );
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

describe('Day 2 — P0/P1 Remediation, Real HF Gradio Dispatch, DNS Rebinding Defense & Kaggle 2xT4 Worker v2', () => {
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

  it('1. P1-1 Auth Gate: rejects unauthenticated /reconstruct, /status, /worker-health, /glb-proxy with 401 while keeping /styles accessible', async () => {
    const stylesRes = await rawHttp(port, 'GET', '/api/assets-3d/styles');
    expect(stylesRes.status).toBe(200);
    expect(stylesRes.json.styles).toHaveLength(6);

    const noAuthRec = await rawHttp(port, 'POST', '/api/assets-3d/reconstruct', { styleId: '3d-cartoon' });
    expect(noAuthRec.status).toBe(401);
    expect(noAuthRec.json.code).toBe('UNAUTHORIZED');

    const noAuthStatus = await rawHttp(port, 'GET', '/api/assets-3d/status?jobId=job_x');
    expect(noAuthStatus.status).toBe(401);

    const noAuthHealth = await rawHttp(port, 'POST', '/api/assets-3d/worker-health', {
      workerUrl: 'https://worker.trycloudflare.com',
    });
    expect(noAuthHealth.status).toBe(401);

    const noAuthGlb = await rawHttp(port, 'GET', '/api/assets-3d/glb-proxy?jobId=job_x');
    expect(noAuthGlb.status).toBe(401);
  });

  it('2. P0-1 Lossless PNG Integrity: preserves >135KB PNG (>180K base64 chars) without 120KB truncation & matches exact SHA-256', async () => {
    const token = issueServerAuthToken('VIP-001');
    const largePng = makePngDataUrlSized(135000, 0xab);
    expect(largePng.dataUrl.length).toBeGreaterThan(180000);

    const res = await rawHttp(
      port,
      'POST',
      '/api/assets-3d/reconstruct',
      {
        characterName: 'Chuon Chuon HighRes',
        styleId: '3d-cartoon',
        planTier: 'personal',
        referenceImages: [{ slot: 'front', dataUrl: largePng.dataUrl, width: 1536, height: 1536, laplacianSharpness: 140 }],
        byok3d: { provider: 'huggingface-zerogpu', apiKey: '' },
      },
      { Authorization: `Bearer ${token}` }
    );

    expect(res.status).toBe(422);
    expect(res.json.code).toBe('BYOK_3D_KEY_REQUIRED');
    expect(res.json.sourceImageHashes).toEqual([largePng.expectedSha256]);
  });

  it('3. P1-2 SSRF & DNS Rebinding Guard: blocks domains resolving to private/loopback/metadata IPs with 403', async () => {
    expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true);
    expect(isPrivateOrReservedIp('10.20.30.40')).toBe(true);
    expect(isPrivateOrReservedIp('::1')).toBe(true);
    expect(isPrivateOrReservedIp('fc00::1234')).toBe(true);
    expect(isPrivateOrReservedIp('104.21.45.12')).toBe(false);

    vi.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '169.254.169.254', family: 4 }] as any);
    const resolved = await resolveAndValidateSafeUrl('https://evil-rebind.trycloudflare.com/health');
    expect(resolved.ok).toBe(false);
    expect(resolved.reason).toBe('DNS_REBINDING_PRIVATE_IP');

    const token = issueServerAuthToken('VIP-001');
    const healthRes = await rawHttp(
      port,
      'POST',
      '/api/assets-3d/worker-health',
      { workerUrl: 'https://evil-rebind.trycloudflare.com' },
      { Authorization: `Bearer ${token}` }
    );
    expect(healthRes.status).toBe(403);
    expect(healthRes.json.code).toBe('SSRF_BLOCKED_WORKER_URL');
  });

  it('4. P0-2 + P1-3 Real HF Gradio Upload/Call + SSE Status + Gemini x-goog-api-key Header (No ?key= in URL & Zero Token Persistence)', async () => {
    const token = issueServerAuthToken('VIP-001');
    const front = makePngDataUrlSized(128, 0x11);
    const back = makePngDataUrlSized(128, 0x22);

    vi.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '18.205.40.88', family: 4 }] as any);

    let capturedGeminiUrl = '';
    let capturedGeminiHeaderKey = '';
    const fetchCalls: string[] = [];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init: any) => {
      const target = String(url);
      fetchCalls.push(target);

      if (target.includes('generativelanguage.googleapis.com')) {
        capturedGeminiUrl = target;
        capturedGeminiHeaderKey = String(init?.headers?.['x-goog-api-key'] || '');
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Hai góc ảnh chuồn chuồn đồng nhất hoàn toàn.' }] } }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (target === 'https://huggingface.co/api/whoami-v2') {
        return new Response(JSON.stringify({ name: 'thien3d' }), { status: 200 });
      }
      if (target === 'https://huggingface.co/api/spaces/tencent/Hunyuan3D-2mv') {
        return new Response(
          JSON.stringify({ host: 'tencent-hunyuan3d-2mv.hf.space', runtime: { stage: 'RUNNING' } }),
          { status: 200 }
        );
      }
      if (target === 'https://tencent-hunyuan3d-2mv.hf.space/gradio_api/upload') {
        return new Response(JSON.stringify(['/tmp/gradio/front.png', '/tmp/gradio/back.png']), { status: 200 });
      }
      if (target === 'https://tencent-hunyuan3d-2mv.hf.space/gradio_api/call/generation_all') {
        return new Response(JSON.stringify({ event_id: 'evt_day2_999' }), { status: 200 });
      }
      if (target === 'https://tencent-hunyuan3d-2mv.hf.space/gradio_api/call/generation_all/evt_day2_999') {
        const sse = [
          'event: generating',
          'data: null',
          '',
          'event: complete',
          'data: [{"path":"/tmp/out_dragonfly.glb","url":"https://tencent-hunyuan3d-2mv.hf.space/gradio_api/file=/tmp/out_dragonfly.glb"}]',
          '',
        ].join('\n');
        return new Response(sse, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
      }
      return new Response('Not Found', { status: 404 });
    });

    const submitRes = await rawHttp(
      port,
      'POST',
      '/api/assets-3d/reconstruct',
      {
        characterName: 'Chuon Chuon Tre',
        styleId: '3d-cartoon',
        planTier: 'personal',
        referenceImages: [
          { slot: 'front', dataUrl: front.dataUrl, width: 1024, height: 1024, laplacianSharpness: 130 },
          { slot: 'back', dataUrl: back.dataUrl, width: 1024, height: 1024, laplacianSharpness: 125 },
        ],
        byokLlm: { provider: 'gemini', apiKey: 'AIzaSySecretHeaderOnlyKey', model: 'gemini-2.5-flash' },
        byok3d: { provider: 'huggingface-zerogpu', apiKey: 'hf_SecretZeroGpuToken999' },
      },
      { Authorization: `Bearer ${token}` }
    );

    expect(submitRes.status).toBe(202);
    expect(submitRes.json.success).toBe(true);
    expect(submitRes.json.manifest.remoteTaskId).toBe('evt_day2_999');
    expect(submitRes.json.manifest.pipelineStage).toBe('queued_on_hf_zerogpu');

    // Verify P1-3 Gemini Header security (no ?key= query string!)
    expect(capturedGeminiUrl).not.toContain('?key=');
    expect(capturedGeminiUrl).not.toContain('AIzaSySecretHeaderOnlyKey');
    expect(capturedGeminiHeaderKey).toBe('AIzaSySecretHeaderOnlyKey');

    // Verify P0-2 Gradio /upload and /call invoked cleanly
    expect(fetchCalls).toContain('https://tencent-hunyuan3d-2mv.hf.space/gradio_api/upload');
    expect(fetchCalls).toContain('https://tencent-hunyuan3d-2mv.hf.space/gradio_api/call/generation_all');

    // Poll /status -> SSE parsing updates glbUrl + approvalStatus
    const jobId = submitRes.json.manifest.jobId;
    const pollRes = await rawHttp(
      port,
      'GET',
      `/api/assets-3d/status?jobId=${encodeURIComponent(jobId)}`,
      undefined,
      { Authorization: `Bearer ${token}` }
    );
    expect(pollRes.status).toBe(200);
    expect(pollRes.json.manifest.approvalStatus).toBe('ready_for_review');
    expect(pollRes.json.manifest.pipelineStage).toBe('glb_ready');
    expect(pollRes.json.manifest.glbUrl).toBe('https://tencent-hunyuan3d-2mv.hf.space/gradio_api/file=/tmp/out_dragonfly.glb');

    // Ensure secret tokens NEVER leak onto disk manifest
    const manifestDiskPath = path.resolve(process.cwd(), 'data', 'assets_3d_manifests.json');
    const diskText = fs.readFileSync(manifestDiskPath, 'utf8');
    expect(diskText).not.toContain('hf_SecretZeroGpuToken999');
    expect(diskText).not.toContain('AIzaSySecretHeaderOnlyKey');
  });

  it('5. P2-D2 Worker Health + GLB Binary Proxy Validation + Cross-User 403 Guard', async () => {
    const tokenA = issueServerAuthToken('VIP-001');
    const tokenB = issueServerAuthToken('VIP-002');
    const front = makePngDataUrlSized(128, 0x33);

    vi.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '104.21.45.12', family: 4 }] as any);

    const validGlbBuf = Buffer.alloc(32);
    Buffer.from('glTF', 'ascii').copy(validGlbBuf, 0);
    validGlbBuf.writeUInt32LE(2, 4);
    validGlbBuf.writeUInt32LE(32, 8);

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      const u = String(url);
      if (u === 'https://t4.trycloudflare.com/health') {
        return new Response(
          JSON.stringify({ status: 'ok', version: '2.0.0', cuda_available: true, gpu: 'Tesla T4' }),
          { status: 200 }
        );
      }
      if (u === 'https://t4.trycloudflare.com/api/reconstruct-3d') {
        return new Response(
          JSON.stringify({
            job_id: 't4_job_1',
            glb_url: 'https://t4.trycloudflare.com/api/artifacts/dragonfly_cartoon.glb',
            poly_count: 28400,
            rig_bone_count: 24,
            stage: 'glb_ready',
          }),
          { status: 200 }
        );
      }
      if (u === 'https://t4.trycloudflare.com/api/artifacts/dragonfly_cartoon.glb') {
        return new Response(validGlbBuf, { status: 200, headers: { 'Content-Type': 'model/gltf-binary' } });
      }
      return new Response('<html>not glb</html>', { status: 200 });
    });

    const healthRes = await rawHttp(
      port,
      'POST',
      '/api/assets-3d/worker-health',
      { workerUrl: 'https://t4.trycloudflare.com' },
      { Authorization: `Bearer ${tokenA}` }
    );
    expect(healthRes.status).toBe(200);
    expect(healthRes.json.healthy).toBe(true);
    expect(healthRes.json.worker.gpu).toBe('Tesla T4');

    const submitRes = await rawHttp(
      port,
      'POST',
      '/api/assets-3d/reconstruct',
      {
        characterName: 'Chuon Chuon Kaggle',
        styleId: 'cel-shading-npr',
        referenceImages: [{ slot: 'front', dataUrl: front.dataUrl, width: 1024, height: 1024, laplacianSharpness: 145 }],
        byok3d: { provider: 'comfyui-kaggle-worker', workerUrl: 'https://t4.trycloudflare.com' },
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    expect(submitRes.status).toBe(202);
    const jobId = submitRes.json.manifest.jobId;

    // Cross-user VIP-002 must be rejected with 403
    const crossStatus = await rawHttp(
      port,
      'GET',
      `/api/assets-3d/status?jobId=${encodeURIComponent(jobId)}`,
      undefined,
      { Authorization: `Bearer ${tokenB}` }
    );
    expect(crossStatus.status).toBe(403);
    expect(crossStatus.json.code).toBe('FORBIDDEN_CROSS_USER');

    // Authorized VIP-001 downloads binary glTF 2.0 via glb-proxy
    const glbRes = await rawHttp(
      port,
      'GET',
      `/api/assets-3d/glb-proxy?jobId=${encodeURIComponent(jobId)}`,
      undefined,
      { Authorization: `Bearer ${tokenA}` }
    );
    expect(glbRes.status).toBe(200);
    expect(glbRes.contentType).toContain('model/gltf-binary');
    expect(glbRes.buf.subarray(0, 4).toString('ascii')).toBe('glTF');
  });

  it('6. Validates Client Gemini Discovery x-goog-api-key header + Day 2 Kaggle .ipynb & ComfyUI v2.0.0 workflow', async () => {
    let seenUrl = '';
    let seenHeaderKey = '';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init: any) => {
      seenUrl = String(url);
      seenHeaderKey = String(init?.headers?.['x-goog-api-key'] || '');
      return new Response(JSON.stringify({ models: [] }), { status: 200 });
    });

    await discoverModelsFromKey('gemini', 'AIzaSyClientDiscoveryKey');
    expect(seenUrl).not.toContain('?key=');
    expect(seenHeaderKey).toBe('AIzaSyClientDiscoveryKey');

    const nbPath = path.resolve(process.cwd(), 'kaggle_workers', 'SYNAPES_Day2_MultiView_3D_2xT4.ipynb');
    const nb = JSON.parse(fs.readFileSync(nbPath, 'utf8'));
    expect(nb.nbformat).toBe(4);
    expect(Array.isArray(nb.cells)).toBe(true);
    expect(nb.cells.length).toBeGreaterThanOrEqual(5);

    const wfPath = path.resolve(process.cwd(), 'workflows', 'comfyui_multiview_1to5.json');
    const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
    expect(wf._meta.version).toBe('2.0.0');
    expect(wf['13'].class_type).toBe('GLB_BinaryInspector_And_StyleTag');
    expect(wf['14'].class_type).toBe('PublishGLB_R2_Or_LocalArtifact');
  });
});
