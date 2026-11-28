import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { writeJsonAtomic, withFileLock } from './atomicFileStore.mjs';
import { safeOutboundFetch } from './safeHttpClient.mjs';

export const MODEL_3D_STYLE_CATALOG_SERVER = [
  {
    id: '3d-cartoon',
    name: '3D Cartoon',
    requiredTier: 'personal',
    badge: 'LABS',
    targetPolyCount: 36000,
    shaderProfile: 'Pixar / Disney Soft PBR + Subsurface Scattering',
  },
  {
    id: '3d-isometric',
    name: '3D Isometric',
    requiredTier: 'personal',
    badge: 'LABS',
    targetPolyCount: 24000,
    shaderProfile: 'Orthographic Bevel PBR + Clean Ambient Shadow',
  },
  {
    id: '3d-claymation',
    name: '3D Claymation',
    requiredTier: 'personal',
    badge: 'LABS',
    targetPolyCount: 30000,
    shaderProfile: 'Stop-Motion Clay Normal Bump + Soft Matte SSS',
  },
  {
    id: 'low-poly-3d',
    name: 'Low-Poly 3D',
    requiredTier: 'personal',
    badge: 'LABS',
    targetPolyCount: 6500,
    shaderProfile: 'Flat-Shading Crisp Edges + Hard Poly Facets',
  },
  {
    id: 'cel-shading-npr',
    name: 'Cel-Shading / NPR',
    requiredTier: 'personal',
    badge: 'LABS',
    targetPolyCount: 26000,
    shaderProfile: '3-Band Toon Ramp + Freestyle Ink Outline',
  },
  {
    id: 'stylized-3d',
    name: 'Stylized 3D',
    requiredTier: 'personal',
    badge: 'LABS',
    targetPolyCount: 38000,
    shaderProfile: 'Hand-Painted Arcane Roughness + Rim Lighting',
  },
];

const VALID_SLOTS = new Set(['front', 'back', 'left', 'right', 'detail']);
const DATA_URL_RE = /^data:image\/(png|webp|jpeg);base64,([A-Za-z0-9+/=\r\n]+)$/i;

export function computeConfidenceAndEngineServer(viewCount) {
  switch (viewCount) {
    case 1:
      return { geometryConfidencePct: 74, recommendedEngine: 'TRELLIS.2 Single-View' };
    case 2:
      return { geometryConfidencePct: 83, recommendedEngine: 'Hunyuan3D-2mv (2 Views)' };
    case 3:
      return { geometryConfidencePct: 90, recommendedEngine: 'Hunyuan3D-2mv (3 Views)' };
    case 4:
      return { geometryConfidencePct: 95, recommendedEngine: 'TRELLIS.2 Multi-View (4 Views)' };
    default:
      return { geometryConfidencePct: 97, recommendedEngine: 'TRELLIS.2 Multi-View Full (5 Views)' };
  }
}

export function validateMultiViewRequestServer(body) {
  const styleId = String(body?.styleId || '').trim();
  const planTier = String(body?.planTier || 'personal').trim().toLowerCase() === 'enterprise'
    ? 'enterprise'
    : 'personal';

  const styleMeta = MODEL_3D_STYLE_CATALOG_SERVER.find((s) => s.id === styleId);
  if (!styleMeta) {
    return {
      ok: false,
      httpStatus: 400,
      code: 'INVALID_3D_STYLE',
      error: `Chuẩn mô hình 3D "${styleId || 'trống'}" không hợp lệ.`,
    };
  }

  const rawImages = body?.referenceImages;
  if (!Array.isArray(rawImages) || rawImages.length < 1 || rawImages.length > 5) {
    return {
      ok: false,
      httpStatus: 400,
      code: 'INVALID_VIEW_COUNT',
      error: `Cần từ 1 đến 5 ảnh tham chiếu đa góc (hiện nhận ${Array.isArray(rawImages) ? rawImages.length : 0} ảnh).`,
    };
  }

  const parsedImages = [];
  const sourceImageHashes = [];
  const warnings = [];
  let sharpnessSum = 0;

  for (let idx = 0; idx < rawImages.length; idx += 1) {
    const item = rawImages[idx] || {};
    const slot = String(item.slot || (idx === 0 ? 'front' : 'detail')).trim().toLowerCase();
    if (!VALID_SLOTS.has(slot)) {
      return {
        ok: false,
        httpStatus: 400,
        code: 'INVALID_VIEW_SLOT',
        error: `Khe góc chụp "${slot}" không hợp lệ (chỉ nhận front, back, left, right, detail).`,
      };
    }

    const dataUrl = String(item.dataUrl || '').trim();
    const match = DATA_URL_RE.exec(dataUrl);
    if (!match) {
      return {
        ok: false,
        httpStatus: 400,
        code: 'INVALID_IMAGE_DATA_URL',
        error: `Ảnh tại khe "${slot}" phải là Data URL PNG/WebP/JPEG hợp lệ.`,
      };
    }

    const rawBytes = Buffer.from(match[2], 'base64');
    if (rawBytes.length < 32) {
      return {
        ok: false,
        httpStatus: 400,
        code: 'CORRUPT_IMAGE_BYTES',
        error: `Ảnh tại khe "${slot}" quá nhỏ hoặc hỏng dữ liệu nhị phân (${rawBytes.length} bytes).`,
      };
    }

    const serverSha256 = crypto.createHash('sha256').update(rawBytes).digest('hex');
    const laplacianSharpness = Number(item.laplacianSharpness || 0);
    const width = Number(item.width || 0);
    const height = Number(item.height || 0);

    sharpnessSum += laplacianSharpness;
    if (laplacianSharpness > 0 && laplacianSharpness < 80) {
      warnings.push(`Góc "${slot}" có độ nét Laplacian ${laplacianSharpness} < 80, có thể làm mờ chi tiết lưới 3D.`);
    }
    if ((width > 0 && width < 256) || (height > 0 && height < 256)) {
      warnings.push(`Góc "${slot}" độ phân giải ${width}x${height} hơi nhỏ (khuyến nghị >= 512px).`);
    }

    sourceImageHashes.push(serverSha256);
    parsedImages.push({
      slot,
      name: String(item.name || `${slot}.png`),
      mimeType: `image/${match[1].toLowerCase() === 'jpeg' ? 'jpeg' : match[1].toLowerCase()}`,
      base64: match[2],
      dataUrl,
      width,
      height,
      sizeBytes: rawBytes.length,
      laplacianSharpness,
      sha256: serverSha256,
    });
  }

  if (!parsedImages.some((p) => p.slot === 'front')) {
    return {
      ok: false,
      httpStatus: 400,
      code: 'FRONT_VIEW_REQUIRED',
      error: 'Bắt buộc phải có Khe 1: Ảnh Chính diện (slot = "front") làm gốc tọa độ dựng 3D.',
    };
  }

  const averageSharpness = Math.round((sharpnessSum / parsedImages.length) * 10) / 10;
  const { geometryConfidencePct, recommendedEngine } = computeConfidenceAndEngineServer(parsedImages.length);

  return {
    ok: true,
    styleMeta,
    planTier,
    parsedImages,
    sourceImageHashes,
    geometryConfidencePct,
    recommendedEngine,
    qcReport: {
      passed: warnings.length === 0,
      warnings,
      averageSharpness,
    },
  };
}

const ephemeralJobAuthMap = new Map();

function saveEphemeralJobAuth(jobId, creds) {
  while (ephemeralJobAuthMap.size >= 200) {
    const oldest = ephemeralJobAuthMap.keys().next().value;
    if (oldest !== undefined) ephemeralJobAuthMap.delete(oldest);
    else break;
  }
  ephemeralJobAuthMap.set(jobId, { ...creds, savedAt: Date.now() });
}

async function checkUrlSafety(targetUrl, safeUrlChecker) {
  if (!safeUrlChecker) return { ok: true };
  const result = await safeUrlChecker(targetUrl);
  if (typeof result === 'boolean') {
    return { ok: result, reason: result ? 'OK' : 'URL_BLOCKED' };
  }
  return {
    ok: Boolean(result?.ok),
    reason: String(result?.reason || (result?.ok ? 'OK' : 'URL_BLOCKED')),
  };
}

function normalizeHfSpaceHost(spaceJson, targetRepo) {
  const rawHost = String(spaceJson?.host || '').trim();
  if (rawHost) {
    return /^https?:\/\//i.test(rawHost) ? rawHost.replace(/\/+$/, '') : `https://${rawHost.replace(/\/+$/, '')}`;
  }
  const slug = targetRepo.toLowerCase().replace('/', '-').replace(/[^a-z0-9-]/g, '-');
  return `https://${slug}.hf.space`;
}

function extractGlbUrlFromGradioPayload(node, spaceHost) {
  if (!node) return '';
  if (typeof node === 'string') {
    const s = node.trim();
    if (/\.glb(\?|$)/i.test(s)) {
      if (/^https:\/\//i.test(s)) return s;
      if (s.startsWith('/')) return `${spaceHost}${s}`;
      return `${spaceHost}/gradio_api/file=${s.replace(/^\/+/, '')}`;
    }
    return '';
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = extractGlbUrlFromGradioPayload(item, spaceHost);
      if (hit) return hit;
    }
    return '';
  }
  if (typeof node === 'object') {
    for (const key of ['url', 'path', 'glb_url', 'value']) {
      if (key in node) {
        const hit = extractGlbUrlFromGradioPayload(node[key], spaceHost);
        if (hit) return hit;
      }
    }
    for (const val of Object.values(node)) {
      if (val && (typeof val === 'object' || typeof val === 'string')) {
        const hit = extractGlbUrlFromGradioPayload(val, spaceHost);
        if (hit) return hit;
      }
    }
  }
  return '';
}

export async function runByokVisionConsistencyCheckServer(byokLlm, parsedImages, characterName, styleMeta, safeUrlChecker) {
  const provider = String(byokLlm?.provider || '').trim().toLowerCase();
  const apiKey = String(byokLlm?.apiKey || '').trim();
  if (!apiKey || apiKey.length < 10) {
    return { note: '', warning: null };
  }

  const prompt = [
    `Kiểm định nhanh tính đồng nhất cho bộ ${parsedImages.length} ảnh tham chiếu tạo mô hình 3D nhân vật "${characterName}" (${styleMeta.name}).`,
    `Các khe góc đã nạp: ${parsedImages.map((img, i) => `#${i + 1}:${img.slot}`).join(', ')}.`,
    'Trả lời tối đa 2 câu tiếng Việt ngắn gọn: (1) Các ảnh có cùng nhân vật/bảng màu không, (2) Điểm cần lưu ý khi dựng 3D.',
  ].join(' ');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 16000);

  try {
    if (provider === 'gemini') {
      const model = encodeURIComponent(String(byokLlm?.model || 'gemini-2.5-flash').trim());
      // P1-3 Security Fix: Truyền Gemini API Key qua header x-goog-api-key thay cho query string ?key=
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const parts = [
        { text: prompt },
        ...parsedImages.map((img) => ({
          inlineData: {
            mimeType: img.mimeType,
            data: img.base64,
          },
        })),
      ];
      const resp = await safeOutboundFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { maxOutputTokens: 180, temperature: 0.2 },
        }),
        timeoutMs: 12000,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!resp.ok) {
        return { note: '', warning: `BYOK Gemini Vision HTTP ${resp.status}` };
      }
      const json = await resp.json().catch(() => ({}));
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { note: String(text).trim().slice(0, 360), warning: null };
    }

    if (provider === 'openai') {
      const base = String(byokLlm?.endpointUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
      const url = `${base}/chat/completions`;
      const urlSafety = await checkUrlSafety(url, safeUrlChecker);
      if (!urlSafety.ok) {
        clearTimeout(timeout);
        return { note: '', warning: `Endpoint BYOK OpenAI bị chặn theo chính sách SSRF/DNS (${urlSafety.reason}).` };
      }
      const resp = await safeOutboundFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: String(byokLlm?.model || 'gpt-4o').trim(),
          max_tokens: 180,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                ...parsedImages.map((img) => ({
                  type: 'image_url',
                  image_url: { url: img.dataUrl, detail: 'low' },
                })),
              ],
            },
          ],
        }),
        timeoutMs: 16000,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!resp.ok) {
        return { note: '', warning: `BYOK OpenAI Vision HTTP ${resp.status}` };
      }
      const json = await resp.json().catch(() => ({}));
      const text = json?.choices?.[0]?.message?.content || '';
      return { note: String(text).trim().slice(0, 360), warning: null };
    }

    clearTimeout(timeout);
    return {
      note: `Đã ghi nhận BYOK Key (${provider}) để điều phối kịch bản; kiểm định hình ảnh đa góc ưu tiên Gemini/OpenAI Vision.`,
      warning: null,
    };
  } catch (err) {
    clearTimeout(timeout);
    return {
      note: '',
      warning: `Vision QC BYOK (${provider}) timeout/lỗi mạng: ${String(err?.message || err)}`,
    };
  }
}

async function persistAssetManifestMetadata(manifest, dataDir) {
  try {
    const filePath = path.join(dataDir, 'assets_3d_manifests.json');
    await withFileLock(filePath, () => {
      let list = [];
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(parsed)) list = parsed;
      }
      // Never write user API tokens or sensitive secrets into persistent disk manifest files
      const cleanRecord = {
        assetId: manifest.assetId,
        jobId: manifest.jobId,
        ownerUserCode: manifest.ownerUserCode || '',
        characterId: manifest.characterId,
        characterName: manifest.characterName,
        styleId: manifest.styleId,
        engine: manifest.engine,
        provider: manifest.provider,
        sourceViewCount: manifest.sourceViewCount,
        sourceImageHashes: manifest.sourceImageHashes,
        geometryConfidencePct: manifest.geometryConfidencePct,
        glbUrl: manifest.glbUrl || '',
        polyCount: manifest.polyCount,
        rigBoneCount: manifest.rigBoneCount,
        pipelineStage: manifest.pipelineStage || '',
        progressPct: typeof manifest.progressPct === 'number' ? manifest.progressPct : undefined,
        dinov2Scores: manifest.dinov2Scores,
        remoteTaskId: manifest.remoteTaskId || '',
        gradioSpaceHost: manifest.gradioSpaceHost || '',
        gradioEventUrl: manifest.gradioEventUrl || '',
        workerBaseUrl: manifest.workerBaseUrl || '',
        approvalStatus: manifest.approvalStatus,
        errorMessage: manifest.errorMessage || '',
        qcReport: manifest.qcReport,
        createdAt: manifest.createdAt,
        updatedAt: manifest.updatedAt,
      };
      const next = [cleanRecord, ...list.filter((m) => m.jobId !== manifest.jobId)].slice(0, 120);
      writeJsonAtomic(filePath, next);
    });
  } catch {
    // ignore disk log errors
  }
}

export async function dispatchByok3DReconstructionServer({
  body,
  validation,
  visionCheck,
  isSafeExternalUrl,
  resolveAndValidateSafeUrl,
  assetsMap,
  dataDir,
  ownerUserCode = '',
}) {
  const safeUrlChecker = resolveAndValidateSafeUrl || isSafeExternalUrl;
  const { styleMeta, parsedImages, sourceImageHashes, geometryConfidencePct, recommendedEngine, qcReport } = validation;
  const fullQcReport = {
    ...qcReport,
    warnings: [...qcReport.warnings, ...(visionCheck.warning ? [visionCheck.warning] : [])],
    visionConsistencyNote: visionCheck.note || undefined,
  };

  const byok3d = body?.byok3d || {};
  const provider = String(byok3d.provider || 'huggingface-zerogpu').trim();
  const apiKey = String(byok3d.apiKey || '').trim();
  const workerUrl = String(byok3d.workerUrl || '').trim();
  const modelId = String(byok3d.modelId || '').trim();
  const characterId = String(body?.characterId || `char_${Date.now()}`).trim();
  const characterName = String(body?.characterName || 'Nhân vật 3D').trim();
  const nowIso = new Date().toISOString();
  const jobId = `job3d_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const assetId = `ast3d_${crypto.randomBytes(4).toString('hex')}`;

  const needsWorker = provider === 'comfyui-kaggle-worker';
  const hasCredential = needsWorker ? workerUrl.length > 0 : apiKey.length >= 6;

  if (!hasCredential) {
    return {
      httpStatus: 422,
      payload: {
        success: false,
        code: 'BYOK_3D_KEY_REQUIRED',
        error:
          provider === 'comfyui-kaggle-worker'
            ? 'Đã hoàn tất kiểm định ảnh 1–5 góc, nhưng thiếu HTTPS URL của Kaggle 2×T4 / ComfyUI 3D Worker để dựng lưới .GLB thực thụ.'
            : `Đã hoàn tất kiểm định ${parsedImages.length} ảnh (SHA-256 hợp lệ), nhưng bạn chưa gắn API Key / Hugging Face Token (hf_...) BYOK cho ${provider}. Hệ thống tuyệt đối không tạo mô hình .GLB giả mạo.`,
        sourceImageHashes,
        geometryConfidencePct,
        recommendedEngine,
        qcReport: fullQcReport,
      },
    };
  }

  // Branch 1: Kaggle 2xT4 / Self-Hosted ComfyUI 3D Worker (P1-2 DNS Rebinding Safe)
  if (provider === 'comfyui-kaggle-worker') {
    const cleanWorkerBase = workerUrl.replace(/\/+$/, '');
    const urlSafety = /^https:\/\//i.test(cleanWorkerBase)
      ? await checkUrlSafety(cleanWorkerBase, safeUrlChecker)
      : { ok: false, reason: 'HTTPS_REQUIRED' };

    if (!urlSafety.ok) {
      return {
        httpStatus: 403,
        payload: {
          success: false,
          code: 'SSRF_BLOCKED_WORKER_URL',
          error: `Chính sách bảo mật SSRF/DNS (${urlSafety.reason}): Worker URL 3D bắt buộc dùng HTTPS công khai hợp lệ và không trỏ về IP nội bộ.`,
          sourceImageHashes,
          geometryConfidencePct,
          recommendedEngine,
          qcReport: fullQcReport,
        },
      };
    }

    let workflowTemplate = null;
    try {
      const wfPath = path.resolve(process.cwd(), 'workflows', 'comfyui_multiview_1to5.json');
      if (fs.existsSync(wfPath)) {
        workflowTemplate = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
      }
    } catch {
      workflowTemplate = null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const targetEndpoint = `${cleanWorkerBase}/api/reconstruct-3d`;
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey.length > 0) {
        headers.Authorization = `Bearer ${apiKey}`;
      }
      const wRes = await safeOutboundFetch(targetEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          job_id: jobId,
          character_name: characterName,
          style_id: styleMeta.id,
          target_poly_count: styleMeta.targetPolyCount,
          auto_rig: Boolean(body?.autoRig ?? true),
          async_mode: Boolean(body?.asyncMode ?? false),
          views: parsedImages.map((img) => ({ slot: img.slot, mime_type: img.mimeType, data_url: img.dataUrl })),
          workflow: workflowTemplate,
        }),
        timeoutMs: 30000,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!wRes.ok) {
        const errBody = await wRes.text().catch(() => '');
        return {
          httpStatus: wRes.status >= 400 ? wRes.status : 502,
          payload: {
            success: false,
            code: 'WORKER_HTTP_ERROR',
            error: `Kaggle/ComfyUI 3D Worker trả về HTTP ${wRes.status}: ${errBody.slice(0, 200)}`,
            sourceImageHashes,
            geometryConfidencePct,
            recommendedEngine,
            qcReport: fullQcReport,
          },
        };
      }

      const wJson = await wRes.json().catch(() => ({}));
      const rawGlbUrl = typeof wJson?.glb_url === 'string' && wJson.glb_url ? wJson.glb_url : '';
      const resolvedGlbUrl = rawGlbUrl
        ? /^https?:\/\//i.test(rawGlbUrl)
          ? rawGlbUrl
          : `${cleanWorkerBase}${rawGlbUrl.startsWith('/') ? rawGlbUrl : `/${rawGlbUrl}`}`
        : undefined;

      const manifest = {
        assetId,
        jobId,
        ownerUserCode,
        characterId,
        characterName,
        styleId: styleMeta.id,
        engine: wJson?.engine || modelId || recommendedEngine,
        provider,
        sourceViewCount: parsedImages.length,
        sourceImageHashes,
        geometryConfidencePct,
        glbUrl: resolvedGlbUrl,
        workerBaseUrl: cleanWorkerBase,
        remoteTaskId: String(wJson?.task_id || wJson?.job_id || jobId),
        rigBoneCount: typeof wJson?.rig_bone_count === 'number' ? wJson.rig_bone_count : undefined,
        polyCount: typeof wJson?.poly_count === 'number' ? wJson.poly_count : undefined,
        dinov2Scores: wJson?.dinov2_scores && typeof wJson.dinov2_scores === 'object' ? wJson.dinov2_scores : undefined,
        pipelineStage: String(wJson?.stage || (resolvedGlbUrl ? 'glb_ready' : 'queued_on_worker')),
        progressPct: typeof wJson?.progress_pct === 'number' ? wJson.progress_pct : (resolvedGlbUrl ? 100 : 15),
        approvalStatus: resolvedGlbUrl ? 'ready_for_review' : 'reconstructing',
        qcReport: fullQcReport,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      if (apiKey) {
        saveEphemeralJobAuth(jobId, { provider, apiKey, workerBaseUrl: cleanWorkerBase });
      }
      assetsMap.set(jobId, manifest);
      await persistAssetManifestMetadata(manifest, dataDir);
      return {
        httpStatus: 202,
        payload: {
          success: true,
          manifest,
          sourceImageHashes,
          geometryConfidencePct,
          recommendedEngine,
          qcReport: fullQcReport,
        },
      };
    } catch (workerErr) {
      clearTimeout(timer);
      return {
        httpStatus: 502,
        payload: {
          success: false,
          code: 'WORKER_UNREACHABLE',
          error: `Không thể kết nối Kaggle/ComfyUI Worker (${String(workerErr?.message || workerErr)}).`,
          sourceImageHashes,
          geometryConfidencePct,
          recommendedEngine,
          qcReport: fullQcReport,
        },
      };
    }
  }

  // Branch 2: Hugging Face ZeroGPU (P0-2 Real Gradio /upload + /call Dispatch + SSE Queue)
  if (provider === 'huggingface-zerogpu') {
    const hfWhoamiUrl = 'https://huggingface.co/api/whoami-v2';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 28000);
    try {
      const authRes = await safeOutboundFetch(hfWhoamiUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
        timeoutMs: 15000,
        signal: controller.signal,
      });
      if (!authRes.ok) {
        clearTimeout(timer);
        return {
          httpStatus: authRes.status === 401 || authRes.status === 403 ? 401 : 502,
          payload: {
            success: false,
            code: 'INVALID_HF_TOKEN',
            error: `Hugging Face Token BYOK không hợp lệ hoặc đã hết hạn (HTTP ${authRes.status}). Vui lòng kiểm tra lại token hf_... của bạn.`,
            sourceImageHashes,
            geometryConfidencePct,
            recommendedEngine,
            qcReport: fullQcReport,
          },
        };
      }
      const hfUser = await authRes.json().catch(() => ({}));
      const targetRepo = parsedImages.length === 2 || parsedImages.length === 3
        ? 'tencent/Hunyuan3D-2mv'
        : 'JeffreyXiang/TRELLIS';

      const spaceRes = await safeOutboundFetch(`https://huggingface.co/api/spaces/${targetRepo}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
        timeoutMs: 15000,
        signal: controller.signal,
      });
      const spaceJson = spaceRes.ok ? await spaceRes.json().catch(() => ({})) : {};
      const runtimeStage = String(spaceJson?.runtime?.stage || 'UNKNOWN');

      if (!spaceRes.ok || runtimeStage === 'SLEEPING' || runtimeStage === 'PAUSED' || runtimeStage === 'BUILD_ERROR') {
        clearTimeout(timer);
        return {
          httpStatus: 503,
          payload: {
            success: false,
            code: 'HF_SPACE_NOT_RUNNING',
            error: `Đã xác thực HF Token (@${hfUser?.name || 'user'}), nhưng Space ${targetRepo} đang ở trạng thái ${runtimeStage}. Vui lòng mở Space đánh thức ZeroGPU hoặc dùng Kaggle 2×T4 Worker.`,
            sourceImageHashes,
            geometryConfidencePct,
            recommendedEngine,
            qcReport: fullQcReport,
          },
        };
      }

      // P0-2 Step A: Validate Space Host and Upload PNG reference views to Gradio /gradio_api/upload
      const spaceHost = normalizeHfSpaceHost(spaceJson, targetRepo);
      const hostSafety = await checkUrlSafety(spaceHost, safeUrlChecker);
      if (!hostSafety.ok) {
        clearTimeout(timer);
        return {
          httpStatus: 403,
          payload: {
            success: false,
            code: 'SSRF_BLOCKED_HF_SPACE',
            error: `Host Space Hugging Face bị từ chối theo chính sách SSRF/DNS (${hostSafety.reason}).`,
            sourceImageHashes,
            geometryConfidencePct,
            recommendedEngine,
            qcReport: fullQcReport,
          },
        };
      }

      const boundary = `----SynapesBoundary${crypto.randomBytes(8).toString('hex')}`;
      const multipartParts = [];
      parsedImages.forEach((img, idx) => {
        const bin = Buffer.from(img.base64, 'base64');
        const ext = img.mimeType.includes('webp') ? 'webp' : img.mimeType.includes('jpeg') ? 'jpg' : 'png';
        const header = `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${img.slot}_${idx}.${ext}"\r\nContent-Type: ${img.mimeType}\r\n\r\n`;
        multipartParts.push(Buffer.from(header, 'utf8'), bin, Buffer.from('\r\n', 'utf8'));
      });
      multipartParts.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));
      const multipartBody = Buffer.concat(multipartParts);

      const uploadRes = await safeOutboundFetch(`${spaceHost}/gradio_api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: multipartBody,
        timeoutMs: 28000,
        signal: controller.signal,
      });

      if (!uploadRes.ok) {
        clearTimeout(timer);
        const upErr = await uploadRes.text().catch(() => '');
        return {
          httpStatus: uploadRes.status >= 400 ? uploadRes.status : 502,
          payload: {
            success: false,
            code: 'HF_GRADIO_DISPATCH_FAILED',
            error: `Không thể tải ${parsedImages.length} ảnh lên Gradio Space ${targetRepo} (HTTP ${uploadRes.status}): ${upErr.slice(0, 180)}`,
            sourceImageHashes,
            geometryConfidencePct,
            recommendedEngine,
            qcReport: fullQcReport,
          },
        };
      }

      const uploadedPaths = await uploadRes.json().catch(() => []);
      if (!Array.isArray(uploadedPaths) || uploadedPaths.length === 0) {
        clearTimeout(timer);
        return {
          httpStatus: 502,
          payload: {
            success: false,
            code: 'HF_GRADIO_DISPATCH_FAILED',
            error: `Gradio Space ${targetRepo} không trả về đường dẫn tệp sau khi upload.`,
            sourceImageHashes,
            geometryConfidencePct,
            recommendedEngine,
            qcReport: fullQcReport,
          },
        };
      }

      const fileMetaBySlot = {};
      parsedImages.forEach((img, idx) => {
        const upPath = String(uploadedPaths[idx] || uploadedPaths[0]);
        fileMetaBySlot[img.slot] = { path: upPath, meta: { _type: 'gradio.FileData' } };
      });

      const gradioFnName = targetRepo === 'tencent/Hunyuan3D-2mv' ? 'generation_all' : 'image_to_3d';
      const callPayloadData =
        targetRepo === 'tencent/Hunyuan3D-2mv'
          ? [
              characterName,
              fileMetaBySlot.front || null,
              fileMetaBySlot.back || null,
              fileMetaBySlot.left || null,
              fileMetaBySlot.right || null,
              30,
              7.5,
              1,
              256,
              true,
            ]
          : [fileMetaBySlot.front || Object.values(fileMetaBySlot)[0], 1, 7.5, 12];

      const callRes = await safeOutboundFetch(`${spaceHost}/gradio_api/call/${gradioFnName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ data: callPayloadData }),
        timeoutMs: 28000,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!callRes.ok) {
        const callErr = await callRes.text().catch(() => '');
        return {
          httpStatus: callRes.status >= 400 ? callRes.status : 502,
          payload: {
            success: false,
            code: 'HF_GRADIO_DISPATCH_FAILED',
            error: `Space ${targetRepo} từ chối xếp hàng ZeroGPU (HTTP ${callRes.status}): ${callErr.slice(0, 180)}`,
            sourceImageHashes,
            geometryConfidencePct,
            recommendedEngine,
            qcReport: fullQcReport,
          },
        };
      }

      const callJson = await callRes.json().catch(() => ({}));
      const eventId = String(callJson?.event_id || '').trim();
      if (!eventId) {
        return {
          httpStatus: 502,
          payload: {
            success: false,
            code: 'HF_GRADIO_DISPATCH_FAILED',
            error: `Space ${targetRepo} không trả về event_id Gradio hợp lệ.`,
            sourceImageHashes,
            geometryConfidencePct,
            recommendedEngine,
            qcReport: fullQcReport,
          },
        };
      }

      const gradioEventUrl = `${spaceHost}/gradio_api/call/${gradioFnName}/${encodeURIComponent(eventId)}`;
      const manifest = {
        assetId,
        jobId,
        ownerUserCode,
        characterId,
        characterName,
        styleId: styleMeta.id,
        engine: `${targetRepo} (HF ZeroGPU • @${hfUser?.name || 'byok'})`,
        provider,
        sourceViewCount: parsedImages.length,
        sourceImageHashes,
        geometryConfidencePct,
        remoteTaskId: eventId,
        gradioSpaceHost: spaceHost,
        gradioEventUrl,
        pipelineStage: 'queued_on_hf_zerogpu',
        progressPct: 25,
        approvalStatus: 'reconstructing',
        qcReport: {
          ...fullQcReport,
          warnings: [
            ...fullQcReport.warnings,
            `HF Account @${hfUser?.name || 'verified'} đã đẩy ${parsedImages.length} ảnh vào Gradio Queue ${targetRepo} (event_id=${eventId}).`,
          ],
        },
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      saveEphemeralJobAuth(jobId, { provider, apiKey });
      assetsMap.set(jobId, manifest);
      await persistAssetManifestMetadata(manifest, dataDir);
      return {
        httpStatus: 202,
        payload: {
          success: true,
          manifest,
          sourceImageHashes,
          geometryConfidencePct,
          recommendedEngine,
          qcReport: manifest.qcReport,
        },
      };
    } catch (hfErr) {
      clearTimeout(timer);
      return {
        httpStatus: 502,
        payload: {
          success: false,
          code: 'HF_NETWORK_ERROR',
          error: `Lỗi kết nối Hugging Face ZeroGPU API: ${String(hfErr?.message || hfErr)}`,
          sourceImageHashes,
          geometryConfidencePct,
          recommendedEngine,
          qcReport: fullQcReport,
        },
      };
    }
  }

  // Branch 3: Commercial BYOK APIs (Tripo3D / Meshy / Fal.ai)
  const commercialEndpoints = {
    'tripo3d-api': 'https://api.tripo3d.ai/v2/openapi/task',
    'meshy-api': 'https://api.meshy.ai/openapi/v1/multi-image-to-3d',
    'fal-ai': `https://queue.fal.run/${(modelId || 'fal-ai/trellis/multi').replace(/^\/+/, '')}`,
  };
  const upstreamUrl = commercialEndpoints[provider];
  const upstreamSafety = upstreamUrl ? await checkUrlSafety(upstreamUrl, safeUrlChecker) : { ok: false, reason: 'UNSUPPORTED' };
  if (!upstreamUrl || !upstreamSafety.ok) {
    return {
      httpStatus: 400,
      payload: {
        success: false,
        code: 'UNSUPPORTED_3D_PROVIDER',
        error: `Nhà cung cấp 3D "${provider}" không được hỗ trợ hoặc không an toàn.`,
        sourceImageHashes,
        geometryConfidencePct,
        recommendedEngine,
        qcReport: fullQcReport,
      },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const authHeader = provider === 'fal-ai' ? `Key ${apiKey}` : `Bearer ${apiKey}`;
    const bodyPayload =
      provider === 'fal-ai'
        ? { input: { image_urls: parsedImages.map((img) => img.dataUrl) } }
        : provider === 'meshy-api'
          ? { image_urls: parsedImages.map((img) => img.dataUrl), topology: 'triangle', target_polycount: styleMeta.targetPolyCount }
          : {
              type: parsedImages.length > 1 ? 'multiview_to_model' : 'image_to_model',
              model_version: modelId || 'v2.5-20250123',
              files: parsedImages.map((img) => ({ type: 'png', file_token: img.sha256 })),
            };

    const apiRes = await safeOutboundFetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(bodyPayload),
      timeoutMs: 30000,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!apiRes.ok) {
      const errTxt = await apiRes.text().catch(() => '');
      return {
        httpStatus: apiRes.status,
        payload: {
          success: false,
          code: 'UPSTREAM_3D_API_ERROR',
          error: `API ${provider} từ chối yêu cầu (HTTP ${apiRes.status}): ${errTxt.slice(0, 220)}`,
          sourceImageHashes,
          geometryConfidencePct,
          recommendedEngine,
          qcReport: fullQcReport,
        },
      };
    }

    const apiData = await apiRes.json().catch(() => ({}));
    const remoteTaskId = String(apiData?.data?.task_id || apiData?.result || apiData?.request_id || jobId);
    const manifest = {
      assetId,
      jobId,
      ownerUserCode,
      characterId,
      characterName,
      styleId: styleMeta.id,
      engine: modelId || provider,
      provider,
      sourceViewCount: parsedImages.length,
      sourceImageHashes,
      geometryConfidencePct,
      remoteTaskId,
      pipelineStage: 'queued_on_provider',
      progressPct: 20,
      approvalStatus: 'reconstructing',
      qcReport: fullQcReport,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    saveEphemeralJobAuth(jobId, { provider, apiKey, statusUrl: String(apiData?.status_url || '') });
    assetsMap.set(jobId, manifest);
    await persistAssetManifestMetadata(manifest, dataDir);
    return {
      httpStatus: 202,
      payload: {
        success: true,
        manifest,
        sourceImageHashes,
        geometryConfidencePct,
        recommendedEngine,
        qcReport: fullQcReport,
      },
    };
  } catch (apiErr) {
    clearTimeout(timer);
    return {
      httpStatus: 502,
      payload: {
        success: false,
        code: 'UPSTREAM_3D_NETWORK_ERROR',
        error: `Lỗi mạng khi gọi ${provider}: ${String(apiErr?.message || apiErr)}`,
        sourceImageHashes,
        geometryConfidencePct,
        recommendedEngine,
        qcReport: fullQcReport,
      },
    };
  }
}

export async function pollAsset3DJobStatusServer({
  manifest,
  assetsMap,
  dataDir,
  resolveAndValidateSafeUrl,
  isSafeExternalUrl,
  apiKeyOverride = '',
}) {
  if (!manifest || manifest.approvalStatus !== 'reconstructing') {
    return manifest;
  }
  const safeUrlChecker = resolveAndValidateSafeUrl || isSafeExternalUrl;
  const cachedCreds = ephemeralJobAuthMap.get(manifest.jobId) || {};
  const tokenToUse = (apiKeyOverride || cachedCreds.apiKey || '').trim();
  const nextManifest = { ...manifest };

  // 1. Poll Hugging Face Gradio SSE Stream (/gradio_api/call/<fn>/<event_id>)
  if (manifest.provider === 'huggingface-zerogpu' && manifest.gradioEventUrl) {
    const urlCheck = await checkUrlSafety(manifest.gradioEventUrl, safeUrlChecker);
    if (!urlCheck.ok) return nextManifest;

    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 5000);
    try {
      const headers = { Accept: 'text/event-stream' };
      if (tokenToUse) headers.Authorization = `Bearer ${tokenToUse}`;
      const sseRes = await safeOutboundFetch(manifest.gradioEventUrl, { headers, timeoutMs: 5000, signal: ctl.signal });
      const sseText = await sseRes.text().catch(() => '');
      clearTimeout(timer);

      if (sseText) {
        const lines = sseText.split(/\r?\n/);
        let lastEvent = '';
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (line.startsWith('event:')) {
            lastEvent = line.slice(6).trim().toLowerCase();
          } else if (line.startsWith('data:')) {
            const payloadStr = line.slice(5).trim();
            if (lastEvent === 'error') {
              nextManifest.approvalStatus = 'failed';
              nextManifest.pipelineStage = 'hf_gradio_error';
              nextManifest.errorMessage = payloadStr.slice(0, 240);
            } else if (lastEvent === 'complete' || lastEvent === 'generating') {
              try {
                const parsedData = JSON.parse(payloadStr);
                const glbUrl = extractGlbUrlFromGradioPayload(parsedData, manifest.gradioSpaceHost || '');
                if (glbUrl && lastEvent === 'complete') {
                  nextManifest.glbUrl = glbUrl;
                  nextManifest.approvalStatus = 'ready_for_review';
                  nextManifest.pipelineStage = 'glb_ready';
                  nextManifest.progressPct = 100;
                }
              } catch {
                // ignore partial JSON chunk
              }
            }
          }
        }
      }
    } catch {
      clearTimeout(timer);
    }
  } else if (manifest.provider === 'comfyui-kaggle-worker' && manifest.workerBaseUrl && manifest.remoteTaskId) {
    // 2. Poll Kaggle / FastAPI Worker (/api/jobs/<job_id>)
    const jobStatusUrl = `${manifest.workerBaseUrl.replace(/\/+$/, '')}/api/jobs/${encodeURIComponent(manifest.remoteTaskId)}`;
    const urlCheck = await checkUrlSafety(jobStatusUrl, safeUrlChecker);
    if (urlCheck.ok) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 5000);
      try {
        const headers = {};
        if (tokenToUse) headers.Authorization = `Bearer ${tokenToUse}`;
        const wRes = await safeOutboundFetch(jobStatusUrl, { headers, timeoutMs: 5000, signal: ctl.signal });
        clearTimeout(timer);
        if (wRes.ok) {
          const wData = await wRes.json().catch(() => ({}));
          if (wData.stage) nextManifest.pipelineStage = String(wData.stage);
          if (typeof wData.progress_pct === 'number') nextManifest.progressPct = wData.progress_pct;
          if (typeof wData.poly_count === 'number') nextManifest.polyCount = wData.poly_count;
          if (typeof wData.rig_bone_count === 'number') nextManifest.rigBoneCount = wData.rig_bone_count;
          if (wData.dinov2_scores && typeof wData.dinov2_scores === 'object') {
            nextManifest.dinov2Scores = wData.dinov2_scores;
          }
          if (typeof wData.glb_url === 'string' && wData.glb_url) {
            nextManifest.glbUrl = /^https?:\/\//i.test(wData.glb_url)
              ? wData.glb_url
              : `${manifest.workerBaseUrl.replace(/\/+$/, '')}${wData.glb_url.startsWith('/') ? wData.glb_url : `/${wData.glb_url}`}`;
            nextManifest.approvalStatus = 'ready_for_review';
            nextManifest.pipelineStage = 'glb_ready';
            nextManifest.progressPct = 100;
          } else if (wData.status === 'failed') {
            nextManifest.approvalStatus = 'failed';
            nextManifest.errorMessage = String(wData.error || 'Kaggle 3D worker execution failed.');
          }
        }
      } catch {
        clearTimeout(timer);
      }
    }
  } else if (cachedCreds.statusUrl && tokenToUse) {
    // 3. Poll Commercial BYOK provider status URL
    const urlCheck = await checkUrlSafety(cachedCreds.statusUrl, safeUrlChecker);
    if (urlCheck.ok) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 5000);
      try {
        const authHeader = manifest.provider === 'fal-ai' ? `Key ${tokenToUse}` : `Bearer ${tokenToUse}`;
        const pRes = await safeOutboundFetch(cachedCreds.statusUrl, {
          headers: { Authorization: authHeader },
          timeoutMs: 5000,
          signal: ctl.signal,
        });
        clearTimeout(timer);
        if (pRes.ok) {
          const pJson = await pRes.json().catch(() => ({}));
          const glbHit = extractGlbUrlFromGradioPayload(pJson, '');
          if (glbHit) {
            nextManifest.glbUrl = glbHit;
            nextManifest.approvalStatus = 'ready_for_review';
            nextManifest.pipelineStage = 'glb_ready';
            nextManifest.progressPct = 100;
          }
        }
      } catch {
        clearTimeout(timer);
      }
    }
  }

  nextManifest.updatedAt = new Date().toISOString();
  assetsMap.set(nextManifest.jobId, nextManifest);
  await persistAssetManifestMetadata(nextManifest, dataDir);
  return nextManifest;
}
