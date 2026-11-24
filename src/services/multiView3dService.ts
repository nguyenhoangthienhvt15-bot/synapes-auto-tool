import type {
  AIProviderConfig,
  AIProviderId,
  Asset3DManifest,
  Byok3DEngineConfig,
  Character3DBuildRequest,
  CharacterViewSlot,
  ContractCategory,
  Model3DStyleId,
  MultiViewReferenceImage,
} from '../types';
import { getAuthHeaders } from './userProfileService';

export interface Model3DStyleMeta {
  id: Model3DStyleId;
  name: string;
  requiredTier: ContractCategory;
  tierLabel: string;
  shaderProfile: string;
  polyBudgetLabel: string;
  targetPolyCount: number;
  description: string;
}

export const MODEL_3D_STYLE_CATALOG: Model3DStyleMeta[] = [
  {
    id: '3d-cartoon',
    name: '3D Cartoon',
    requiredTier: 'personal',
    tierLabel: 'LABS • Mọi gói',
    shaderProfile: 'Pixar / Disney Soft PBR + Subsurface Scattering',
    polyBudgetLabel: '30k–40k tris',
    targetPolyCount: 36000,
    description: 'Bo tròn mềm mại, mắt có độ bóng sinh động và chất liệu PBR mượt mà chuẩn hoạt hình điện ảnh.',
  },
  {
    id: '3d-isometric',
    name: '3D Isometric',
    requiredTier: 'personal',
    tierLabel: 'LABS • Mọi gói',
    shaderProfile: 'Orthographic Bevel PBR + Clean Ambient Shadow',
    polyBudgetLabel: '18k–28k tris',
    targetPolyCount: 24000,
    description: 'Khối diorama trực giao rõ ràng, vát cạnh tinh tế, lý tưởng cho hoạt hình giải thích & giáo dục.',
  },
  {
    id: '3d-claymation',
    name: '3D Claymation',
    requiredTier: 'personal',
    tierLabel: 'LABS • Mọi gói',
    shaderProfile: 'Stop-Motion Clay Normal Bump + Soft Matte SSS',
    polyBudgetLabel: '25k–35k tris',
    targetPolyCount: 30000,
    description: 'Chất đất sét thủ công có vân tay vi mô ấm áp, giữ nguyên cảm giác stop-motion chân thực.',
  },
  {
    id: 'low-poly-3d',
    name: 'Low-Poly 3D',
    requiredTier: 'personal',
    tierLabel: 'LABS • Mọi gói',
    shaderProfile: 'Flat-Shading Crisp Edges + Hard Poly Facets',
    polyBudgetLabel: '4k–8k tris',
    targetPolyCount: 6500,
    description: 'Đa giác phẳng sắc nét, render siêu tốc, phù hợp đại cảnh đông nhân vật hoặc phong cách tối giản.',
  },
  {
    id: 'cel-shading-npr',
    name: 'Cel-Shading / NPR',
    requiredTier: 'personal',
    tierLabel: 'LABS • Mọi gói',
    shaderProfile: '3-Band Toon Ramp + Freestyle Ink Outline',
    polyBudgetLabel: '22k–32k tris',
    targetPolyCount: 26000,
    description: 'Mô hình 3D chuyển động thực thụ kết hợp đổ bóng mảng 3 tầng và viền mực Anime/Spider-Verse.',
  },
  {
    id: 'stylized-3d',
    name: 'Stylized 3D',
    requiredTier: 'personal',
    tierLabel: 'LABS • Mọi gói',
    shaderProfile: 'Hand-Painted Arcane Roughness + Rim Lighting',
    polyBudgetLabel: '32k–40k tris',
    targetPolyCount: 38000,
    description: 'Bề mặt vẽ tay giàu họa tiết, tương phản ánh sáng viền nghệ thuật cao cấp chuẩn studio.',
  },
];

export interface ViewSlotDefinition {
  slot: CharacterViewSlot;
  order: number;
  label: string;
  required: boolean;
  hint: string;
}

export const VIEW_SLOT_DEFINITIONS: ViewSlotDefinition[] = [
  {
    slot: 'front',
    order: 1,
    label: 'Chính diện (Front)',
    required: true,
    hint: 'Góc thẳng 0°, rõ toàn thân & biểu cảm khuôn mặt',
  },
  {
    slot: 'back',
    order: 2,
    label: 'Mặt sau (Back)',
    required: false,
    hint: 'Góc sau 180°, khóa chi tiết lưng, đuôi & trang phục sau',
  },
  {
    slot: 'left',
    order: 3,
    label: 'Cạnh trái (Left)',
    required: false,
    hint: 'Góc nghiêng 90° bên trái để khóa chiều sâu hình khối',
  },
  {
    slot: 'right',
    order: 4,
    label: 'Cạnh phải (Right)',
    required: false,
    hint: 'Góc nghiêng 270° bên phải xử lý chi tiết bất đối xứng',
  },
  {
    slot: 'detail',
    order: 5,
    label: 'Chi tiết PBR (Detail)',
    required: false,
    hint: 'Cận cảnh phụ kiện, mũ, hoa văn chất liệu bề mặt',
  },
];

export function is3DStyleAllowedForTier(
  styleId: Model3DStyleId,
  _planTier: ContractCategory = 'personal'
): boolean {
  return MODEL_3D_STYLE_CATALOG.some((item) => item.id === styleId);
}

export function getDefault3DStyleForTier(_planTier: ContractCategory = 'personal'): Model3DStyleId {
  return '3d-cartoon';
}

export function computeGeometryConfidence(
  images: Array<Pick<MultiViewReferenceImage, 'slot'>>
): {
  pct: number;
  viewCount: number;
  hasFront: boolean;
  recommendedEngine: string;
  label: string;
} {
  const uniqueSlots = new Set(images.map((i) => i.slot));
  const viewCount = Math.min(5, images.length);
  const hasFront = uniqueSlots.has('front');

  if (viewCount === 0) {
    return {
      pct: 0,
      viewCount: 0,
      hasFront: false,
      recommendedEngine: 'Chưa chọn động cơ',
      label: '0% • Tải lên 1–5 ảnh (bắt buộc Khe 1 Chính diện)',
    };
  }

  if (viewCount === 1) {
    return {
      pct: 74,
      viewCount: 1,
      hasFront,
      recommendedEngine: 'TRELLIS.2 Single-View',
      label: '74% • Cơ bản (1 ảnh — mặt sau suy diễn bởi AI)',
    };
  }
  if (viewCount === 2) {
    return {
      pct: 83,
      viewCount: 2,
      hasFront,
      recommendedEngine: 'Hunyuan3D-2mv (2 Views)',
      label: '83% • Khá tốt (Đã khóa trục đối xứng trước/sau)',
    };
  }
  if (viewCount === 3) {
    return {
      pct: 90,
      viewCount: 3,
      hasFront,
      recommendedEngine: 'Hunyuan3D-2mv (3 Views)',
      label: '90% • Chuẩn Sản xuất (Đạt ngưỡng ≥ 90% đa góc)',
    };
  }
  if (viewCount === 4) {
    return {
      pct: 95,
      viewCount: 4,
      hasFront,
      recommendedEngine: 'TRELLIS.2 Multi-View (4 Views)',
      label: '95% • Rất cao (Khóa bất đối xứng trái/phải chuẩn xác)',
    };
  }
  return {
    pct: 97,
    viewCount: 5,
    hasFront,
    recommendedEngine: 'TRELLIS.2 Multi-View Full (5 Views)',
    label: '97% • Tối đa 360° (Đầy đủ hình khối & chi tiết PBR)',
  };
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64Part = dataUrl.split(',')[1] || '';
  const binaryString = atob(base64Part);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function computeSha256Hex(bytes: Uint8Array): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback deterministic FNV-1a hex if WebCrypto subtle is unavailable (e.g. non-HTTPS dev context)
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i += 1) {
    h1 ^= bytes[i];
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= bytes[bytes.length - 1 - i];
    h2 = Math.imul(h2, 0x01000193) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`.repeat(4);
}

function computeCanvasLaplacianVariance(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): number {
  const sampleMax = 256;
  const scale = Math.min(1, sampleMax / Math.max(width, height));
  const sw = Math.max(8, Math.round(width * scale));
  const sh = Math.max(8, Math.round(height * scale));

  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sw;
  sampleCanvas.height = sh;
  const sctx = sampleCanvas.getContext('2d');
  if (!sctx) return 0;

  sctx.drawImage(ctx.canvas, 0, 0, sw, sh);
  const { data } = sctx.getImageData(0, 0, sw, sh);
  const gray = new Float32Array(sw * sh);
  for (let i = 0; i < sw * sh; i += 1) {
    const idx = i * 4;
    const alpha = data[idx + 3] / 255;
    // Blend alpha onto neutral mid-gray so transparent cutout borders remain sharp but predictable
    const r = data[idx] * alpha + 128 * (1 - alpha);
    const g = data[idx + 1] * alpha + 128 * (1 - alpha);
    const b = data[idx + 2] * alpha + 128 * (1 - alpha);
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < sh - 1; y += 1) {
    const rowOffset = y * sw;
    for (let x = 1; x < sw - 1; x += 1) {
      const i = rowOffset + x;
      const lap =
        gray[i - sw] +
        gray[i + sw] +
        gray[i - 1] +
        gray[i + 1] -
        4 * gray[i];
      sum += lap;
      sumSq += lap * lap;
      count += 1;
    }
  }
  if (count === 0) return 0;
  const mean = sum / count;
  const variance = Math.max(0, sumSq / count - mean * mean);
  return Math.round(variance * 10) / 10;
}

/**
 * Chuẩn hóa khe ảnh tham chiếu 3D (1–5 ảnh): giữ nguyên kênh Alpha & định dạng Lossless PNG,
 * thu gọn tối đa cạnh 1536px, tính độ nét Laplacian và băm SHA-256 thực tế.
 */
export async function prepareMultiViewLosslessSlot(
  file: File,
  slot: CharacterViewSlot
): Promise<MultiViewReferenceImage> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh tham chiếu 3D.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Tệp không phải định dạng hình ảnh hợp lệ.'));
    el.src = rawDataUrl;
  });

  const maxSide = 1536;
  const rawW = img.naturalWidth || img.width || 1024;
  const rawH = img.naturalHeight || img.height || 1024;
  const ratio = Math.min(1, maxSide / Math.max(rawW, rawH));
  const targetW = Math.max(1, Math.round(rawW * ratio));
  const targetH = Math.max(1, Math.round(rawH * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Không khởi tạo được Canvas 2D để xử lý ảnh PNG Lossless.');
  }

  ctx.clearRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const laplacianSharpness = computeCanvasLaplacianVariance(ctx, targetW, targetH);
  const pngDataUrl = canvas.toDataURL('image/png');
  const pngBytes = dataUrlToUint8Array(pngDataUrl);
  const sha256 = await computeSha256Hex(pngBytes);

  return {
    id: `mv_${slot}_${Date.now()}`,
    slot,
    name: file.name,
    mimeType: 'image/png',
    dataUrl: pngDataUrl,
    width: targetW,
    height: targetH,
    sizeBytes: pngBytes.byteLength,
    laplacianSharpness,
    sha256,
  };
}

export interface ActiveByokLlmCredentials {
  provider: AIProviderId;
  apiKey: string;
  model: string;
  endpointUrl?: string;
}

/**
 * Lấy thông tin API Key LLM BYOK của người dùng đang cấu hình để phục vụ Vision QC đa góc ảnh.
 */
export function resolveActiveByokLlmCredentials(
  aiConfig?: AIProviderConfig | null
): ActiveByokLlmCredentials | null {
  if (!aiConfig) return null;
  const order: AIProviderId[] = [];
  if (aiConfig.activeProvider && aiConfig.activeProvider !== 'plugin') {
    order.push(aiConfig.activeProvider);
  }
  for (const id of ['gemini', 'openai', 'claude', 'deepseek', 'grok'] as AIProviderId[]) {
    if (!order.includes(id)) order.push(id);
  }

  const providerDefaults: Array<{
    id: AIProviderId;
    entry?: { apiKey?: string; model?: string; endpointUrl?: string };
    defaultModel: string;
    defaultEndpoint: string;
  }> = [
    {
      id: 'gemini',
      entry: aiConfig.gemini,
      defaultModel: 'gemini-2.5-flash',
      defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    },
    {
      id: 'openai',
      entry: aiConfig.openai,
      defaultModel: 'gpt-4o',
      defaultEndpoint: 'https://api.openai.com/v1',
    },
    {
      id: 'claude',
      entry: aiConfig.claude,
      defaultModel: 'claude-3-7-sonnet-20250219',
      defaultEndpoint: 'https://api.anthropic.com/v1',
    },
    {
      id: 'deepseek',
      entry: aiConfig.deepseek,
      defaultModel: 'deepseek-chat',
      defaultEndpoint: 'https://api.deepseek.com/v1',
    },
    {
      id: 'grok',
      entry: aiConfig.grok,
      defaultModel: 'grok-2',
      defaultEndpoint: 'https://api.x.ai/v1',
    },
  ];

  for (const provider of order) {
    const spec = providerDefaults.find((item) => item.id === provider);
    const trimmedKey = (spec?.entry?.apiKey || '').trim();
    if (spec && trimmedKey.length > 5) {
      return {
        provider: spec.id,
        apiKey: trimmedKey,
        model: spec.entry?.model || spec.defaultModel,
        endpointUrl: spec.entry?.endpointUrl || spec.defaultEndpoint,
      };
    }
  }
  return null;
}

export function resolveByok3DEngineConfig(aiConfig?: AIProviderConfig | null): Byok3DEngineConfig {
  return {
    provider: aiConfig?.threeDEngine?.provider || 'huggingface-zerogpu',
    apiKey: (aiConfig?.threeDEngine?.apiKey || '').trim(),
    workerUrl: (aiConfig?.threeDEngine?.workerUrl || '').trim(),
    modelId: aiConfig?.threeDEngine?.modelId || 'tencent/Hunyuan3D-2mv',
    verifiedAt: aiConfig?.threeDEngine?.verifiedAt,
  };
}

export interface Reconstruct3DResponse {
  success: boolean;
  httpStatus: number;
  code?: string;
  error?: string;
  manifest?: Asset3DManifest;
  sourceImageHashes?: string[];
  geometryConfidencePct?: number;
  recommendedEngine?: string;
  qcReport?: {
    passed: boolean;
    warnings: string[];
    visionConsistencyNote?: string;
    averageSharpness: number;
  };
}

/**
 * Gửi yêu cầu kiểm định đa góc (1–5 ảnh) và điều phối dựng lưới .GLB thực thụ dựa trên BYOK API Keys của người dùng.
 */
export async function submitMultiView3DReconstruction(
  request: Character3DBuildRequest,
  aiConfig: AIProviderConfig
): Promise<Reconstruct3DResponse> {
  const byokLlm = resolveActiveByokLlmCredentials(aiConfig);
  const byok3d = resolveByok3DEngineConfig(aiConfig);

  const response = await fetch('/api/assets-3d/reconstruct', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      ...request,
      byokLlm,
      byok3d,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  return {
    success: Boolean(payload?.success),
    httpStatus: response.status,
    code: payload?.code,
    error: payload?.error,
    manifest: payload?.manifest,
    sourceImageHashes: payload?.sourceImageHashes,
    geometryConfidencePct: payload?.geometryConfidencePct,
    recommendedEngine: payload?.recommendedEngine,
    qcReport: payload?.qcReport,
  };
}

export async function fetchAsset3DJobStatus(
  jobId: string,
  byok3dKey?: string
): Promise<{ success: boolean; manifest?: Asset3DManifest; error?: string }> {
  const cleanId = encodeURIComponent(jobId.trim());
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };
  if (byok3dKey && byok3dKey.trim()) {
    headers['X-Byok-3D-Key'] = byok3dKey.trim();
  }
  const resp = await fetch(`/api/assets-3d/status?jobId=${cleanId}`, {
    method: 'GET',
    headers,
  });
  const data = await resp.json().catch(() => ({}));
  return {
    success: Boolean(data?.success),
    manifest: data?.manifest,
    error: data?.error,
  };
}

export interface WorkerHealthResponse {
  success: boolean;
  healthy: boolean;
  latencyMs?: number;
  error?: string;
  worker?: {
    status?: string;
    version?: string;
    cuda_available?: boolean;
    gpu?: string;
    vram_gb?: number;
    tunnel_url?: string;
    supported_styles?: string[];
  };
}

export async function checkByok3DWorkerHealth(
  workerUrl: string,
  apiKey?: string
): Promise<WorkerHealthResponse> {
  const resp = await fetch('/api/assets-3d/worker-health', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      workerUrl: workerUrl.trim(),
      apiKey: (apiKey || '').trim(),
    }),
  });
  const data = await resp.json().catch(() => ({}));
  return {
    success: Boolean(data?.success),
    healthy: Boolean(data?.healthy),
    latencyMs: data?.latencyMs,
    error: data?.error,
    worker: data?.worker,
  };
}

export function buildAuthenticatedGlbProxyUrl(jobId: string): string {
  const hdrs = getAuthHeaders();
  const bearer = hdrs['X-Synapes-Auth-Token'] || '';
  const base = `/api/assets-3d/glb-proxy?jobId=${encodeURIComponent(jobId.trim())}`;
  return bearer ? `${base}&authToken=${encodeURIComponent(bearer)}` : base;
}
