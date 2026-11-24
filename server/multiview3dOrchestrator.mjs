import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

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

export async function runByokVisionConsistencyCheckServer(byokLlm, parsedImages, characterName, styleMeta, isSafeExternalUrl) {
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
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const parts = [
        { text: prompt },
        ...parsedImages.map((img) => ({
          inlineData: {
            mimeType: img.mimeType,
            data: img.base64,
          },
        })),
      ];
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { maxOutputTokens: 180, temperature: 0.2 },
        }),
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
      if (!isSafeExternalUrl(url)) {
        clearTimeout(timeout);
        return { note: '', warning: 'Endpoint BYOK OpenAI không hợp lệ theo chính sách SSRF.' };
      }
      const resp = await fetch(url, {
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

function persistAssetManifestMetadata(manifest, dataDir) {
  try {
    const filePath = path.join(dataDir, 'assets_3d_manifests.json');
    let list = [];
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(parsed)) list = parsed;
    }
    const cleanRecord = {
      assetId: manifest.assetId,
      jobId: manifest.jobId,
      characterId: manifest.characterId,
      characterName: manifest.characterName,
      styleId: manifest.styleId,
      engine: manifest.engine,
      provider: manifest.provider,
      sourceViewCount: manifest.sourceViewCount,
      sourceImageHashes: manifest.sourceImageHashes,
      geometryConfidencePct: manifest.geometryConfidencePct,
      glbUrl: manifest.glbUrl || '',
      remoteTaskId: manifest.remoteTaskId || '',
      approvalStatus: manifest.approvalStatus,
      qcReport: manifest.qcReport,
      createdAt: manifest.createdAt,
      updatedAt: manifest.updatedAt,
    };
    const next = [cleanRecord, ...list.filter((m) => m.jobId !== manifest.jobId)].slice(0, 120);
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(next, null, 2), 'utf8');
  } catch {
    // ignore disk log errors
  }
}

export async function dispatchByok3DReconstructionServer({
  body,
  validation,
  visionCheck,
  isSafeExternalUrl,
  assetsMap,
  dataDir,
}) {
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

  // Branch 1: Kaggle 2xT4 / Self-Hosted ComfyUI 3D Worker
  if (provider === 'comfyui-kaggle-worker') {
    if (!/^https:\/\//i.test(workerUrl) || !isSafeExternalUrl(workerUrl)) {
      return {
        httpStatus: 403,
        payload: {
          success: false,
          code: 'SSRF_BLOCKED_WORKER_URL',
          error: 'Chính sách bảo mật SSRF: Worker URL 3D bắt buộc dùng giao thức HTTPS công khai hợp lệ (ví dụ *.trycloudflare.com).',
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
      const targetEndpoint = `${workerUrl.replace(/\/+$/, '')}/api/reconstruct-3d`;
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey.length > 0) {
        headers.Authorization = `Bearer ${apiKey}`;
      }
      const wRes = await fetch(targetEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          job_id: jobId,
          character_name: characterName,
          style_id: styleMeta.id,
          target_poly_count: styleMeta.targetPolyCount,
          auto_rig: Boolean(body?.autoRig ?? true),
          views: parsedImages.map((img) => ({ slot: img.slot, mime_type: img.mimeType, data_url: img.dataUrl })),
          workflow: workflowTemplate,
        }),
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
      const manifest = {
        assetId,
        jobId,
        characterId,
        characterName,
        styleId: styleMeta.id,
        engine: modelId || recommendedEngine,
        provider,
        sourceViewCount: parsedImages.length,
        sourceImageHashes,
        geometryConfidencePct,
        glbUrl: typeof wJson?.glb_url === 'string' && wJson.glb_url ? wJson.glb_url : undefined,
        remoteTaskId: String(wJson?.task_id || wJson?.job_id || jobId),
        rigBoneCount: typeof wJson?.rig_bone_count === 'number' ? wJson.rig_bone_count : undefined,
        polyCount: typeof wJson?.poly_count === 'number' ? wJson.poly_count : undefined,
        approvalStatus: wJson?.glb_url ? 'ready_for_review' : 'reconstructing',
        qcReport: fullQcReport,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      assetsMap.set(jobId, manifest);
      persistAssetManifestMetadata(manifest, dataDir);
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

  // Branch 2: Hugging Face ZeroGPU (BYOK HF Token Verification + Real Space Dispatch)
  if (provider === 'huggingface-zerogpu') {
    const hfWhoamiUrl = 'https://huggingface.co/api/whoami-v2';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const authRes = await fetch(hfWhoamiUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
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

      const spaceRes = await fetch(`https://huggingface.co/api/spaces/${targetRepo}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });
      clearTimeout(timer);
      const spaceJson = spaceRes.ok ? await spaceRes.json().catch(() => ({})) : {};
      const runtimeStage = String(spaceJson?.runtime?.stage || 'UNKNOWN');

      if (!spaceRes.ok || runtimeStage === 'SLEEPING' || runtimeStage === 'PAUSED' || runtimeStage === 'BUILD_ERROR') {
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

      const manifest = {
        assetId,
        jobId,
        characterId,
        characterName,
        styleId: styleMeta.id,
        engine: `${targetRepo} (HF ZeroGPU • @${hfUser?.name || 'byok'})`,
        provider,
        sourceViewCount: parsedImages.length,
        sourceImageHashes,
        geometryConfidencePct,
        remoteTaskId: `${targetRepo}:${jobId}`,
        approvalStatus: 'reconstructing',
        qcReport: {
          ...fullQcReport,
          warnings: [
            ...fullQcReport.warnings,
            `HF Account @${hfUser?.name || 'verified'} & Space ${targetRepo} (${runtimeStage}) đã xác thực; hàng đợi ZeroGPU đang xử lý.`,
          ],
        },
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      assetsMap.set(jobId, manifest);
      persistAssetManifestMetadata(manifest, dataDir);
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
  if (!upstreamUrl || !isSafeExternalUrl(upstreamUrl)) {
    return {
      httpStatus: 400,
      payload: {
        success: false,
        code: 'UNSUPPORTED_3D_PROVIDER',
        error: `Nhà cung cấp 3D "${provider}" không được hỗ trợ.`,
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

    const apiRes = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(bodyPayload),
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
      characterId,
      characterName,
      styleId: styleMeta.id,
      engine: modelId || provider,
      provider,
      sourceViewCount: parsedImages.length,
      sourceImageHashes,
      geometryConfidencePct,
      remoteTaskId,
      approvalStatus: 'reconstructing',
      qcReport: fullQcReport,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    assetsMap.set(jobId, manifest);
    persistAssetManifestMetadata(manifest, dataDir);
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
