import glTransitions, { Transition } from 'gl-transitions';
import gsap from 'gsap';

/**
 * Thực thi thực tế thư viện GitHub `gl-transitions/gl-transitions` (WebGL GLSL Shaders)
 * kết hợp `greensock/GSAP` easing & fallback Canvas2D đa hiệu ứng (`mifi/editly` style)
 * với 16 chuyển cảnh GPU đã xác thực tồn tại trong gói `gl-transitions`.
 */

export type CinemaTransitionPreset =
  | 'CrossZoom'
  | 'DirectionalWarp'
  | 'DirectionalWipe'
  | 'DreamyZoom'
  | 'Swirl'
  | 'RadialWipe'
  | 'PaperFold'
  | 'InvertedPageCurl'
  | 'Cube'
  | 'Doorway'
  | 'GlitchMemories'
  | 'TangentMotionBlur'
  | 'WindowSlices'
  | 'Mosaic'
  | 'FadeColor'
  | 'ZoomInCircles';

export interface TransitionPresetMeta {
  id: CinemaTransitionPreset;
  label: string;
  category: 'Điện ảnh' | 'Nhịp nhanh' | 'Sáng tạo' | 'Tranh giấy';
  fallbackStyle: 'zoom-dissolve' | 'whip-slide' | 'iris-circle' | 'curtain-split' | 'diagonal-wipe';
}

export const TRANSITION_PRESET_CATALOG: TransitionPresetMeta[] = [
  { id: 'CrossZoom', label: 'Cross Zoom (Điện ảnh)', category: 'Điện ảnh', fallbackStyle: 'zoom-dissolve' },
  { id: 'DirectionalWarp', label: 'Biến dạng Hướng (Warp)', category: 'Điện ảnh', fallbackStyle: 'whip-slide' },
  { id: 'DirectionalWipe', label: 'Quét Chéo Mượt (Wipe)', category: 'Điện ảnh', fallbackStyle: 'diagonal-wipe' },
  { id: 'DreamyZoom', label: 'Hòa Mờ Giấc Mơ (Dreamy)', category: 'Điện ảnh', fallbackStyle: 'zoom-dissolve' },
  { id: 'TangentMotionBlur', label: 'Tia Mờ Chuyển Động (Blur)', category: 'Nhịp nhanh', fallbackStyle: 'whip-slide' },
  { id: 'FadeColor', label: 'Chuyển Đen Mịn (Fade)', category: 'Điện ảnh', fallbackStyle: 'zoom-dissolve' },
  { id: 'WindowSlices', label: 'Cắt Mành Truyền Hình (Slices)', category: 'Nhịp nhanh', fallbackStyle: 'diagonal-wipe' },
  { id: 'Cube', label: 'Xoay Khối Lập Phương 3D (Cube)', category: 'Sáng tạo', fallbackStyle: 'curtain-split' },
  { id: 'Doorway', label: 'Mở Cửa Sân Khấu 3D (Doorway)', category: 'Sáng tạo', fallbackStyle: 'curtain-split' },
  { id: 'RadialWipe', label: 'Quét Đồng Hồ (Radial)', category: 'Sáng tạo', fallbackStyle: 'iris-circle' },
  { id: 'ZoomInCircles', label: 'Vòng Tròn Đẩy Sâu (Circles)', category: 'Nhịp nhanh', fallbackStyle: 'iris-circle' },
  { id: 'Swirl', label: 'Xoáy Ốc Thời Gian (Swirl)', category: 'Sáng tạo', fallbackStyle: 'zoom-dissolve' },
  { id: 'GlitchMemories', label: 'Nhiễu Số Viral (Glitch)', category: 'Nhịp nhanh', fallbackStyle: 'whip-slide' },
  { id: 'Mosaic', label: 'Ghép Mảnh Gạch (Mosaic)', category: 'Sáng tạo', fallbackStyle: 'diagonal-wipe' },
  { id: 'PaperFold', label: 'Gấp Giấy Origami (Fold)', category: 'Tranh giấy', fallbackStyle: 'curtain-split' },
  { id: 'InvertedPageCurl', label: 'Lật Trang Sách (Page Curl)', category: 'Tranh giấy', fallbackStyle: 'diagonal-wipe' },
];

const TRANSITION_MAP = new Map<string, Transition>();
for (const item of glTransitions) {
  if (item && item.name) {
    TRANSITION_MAP.set(item.name, item);
  }
}

interface GlRunnerState {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  programs: Map<string, WebGLProgram>;
  fromTex: WebGLTexture | null;
  toTex: WebGLTexture | null;
  buffer: WebGLBuffer | null;
}

let cachedGl: GlRunnerState | null = null;

const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 _uv;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  _uv = vec2(0.5, 0.5) * (position + vec2(1.0, 1.0));
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function getGlRunner(width: number, height: number): GlRunnerState | null {
  if (typeof document === 'undefined') return null;

  if (!cachedGl) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const gl = canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      });
      if (!gl) return null;

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );

      const createTex = () => {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return t;
      };

      cachedGl = {
        canvas,
        gl,
        programs: new Map(),
        fromTex: createTex(),
        toTex: createTex(),
        buffer,
      };
    } catch {
      cachedGl = null;
    }
  }

  if (cachedGl && (cachedGl.canvas.width !== width || cachedGl.canvas.height !== height)) {
    cachedGl.canvas.width = width;
    cachedGl.canvas.height = height;
    cachedGl.gl.viewport(0, 0, width, height);
  }

  return cachedGl;
}

function getTransitionProgram(
  state: GlRunnerState,
  transition: Transition
): WebGLProgram | null {
  const existing = state.programs.get(transition.name);
  if (existing) return existing;

  const { gl } = state;
  const fragSource = `
precision mediump float;
varying vec2 _uv;
uniform sampler2D from;
uniform sampler2D to;
uniform float progress;
uniform float ratio;
vec4 getFromColor(vec2 uv) {
  return texture2D(from, clamp(uv, 0.0, 1.0));
}
vec4 getToColor(vec2 uv) {
  return texture2D(to, clamp(uv, 0.0, 1.0));
}
${transition.glsl}
void main() {
  gl_FragColor = transition(_uv);
}
`;

  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);
  if (!vs || !fs) {
    if (vs) gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    return null;
  }

  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    return null;
  }

  state.programs.set(transition.name, prog);
  return prog;
}

export function normalizeTransitionHint(hint?: string): CinemaTransitionPreset | undefined {
  if (!hint) return undefined;
  if (TRANSITION_MAP.has(hint)) return hint as CinemaTransitionPreset;
  const low = hint.trim().toLowerCase();
  if (low === 'fade' || low === 'cut') return 'FadeColor';
  if (low === 'dissolve') return 'DreamyZoom';
  const matched = TRANSITION_PRESET_CATALOG.find((item) => item.id.toLowerCase() === low);
  return matched?.id;
}

export function pickSceneTransitionPreset(
  sceneIdx: number,
  isPaperArt: boolean,
  hint?: string,
  skillPool?: CinemaTransitionPreset[]
): CinemaTransitionPreset {
  if (isPaperArt) {
    const paperPool: CinemaTransitionPreset[] = ['PaperFold', 'InvertedPageCurl', 'DirectionalWipe'];
    return paperPool[sceneIdx % paperPool.length];
  }
  const normalized = normalizeTransitionHint(hint);
  if (normalized) {
    return normalized;
  }
  if (skillPool && skillPool.length > 0) {
    return skillPool[sceneIdx % skillPool.length];
  }
  const cinemaPool: CinemaTransitionPreset[] = [
    'CrossZoom',
    'DirectionalWarp',
    'DirectionalWipe',
    'RadialWipe',
    'DreamyZoom',
    'TangentMotionBlur',
    'Doorway',
    'ZoomInCircles',
  ];
  return cinemaPool[sceneIdx % cinemaPool.length];
}

function drawCanvas2dFallbackTransition(
  targetCtx: CanvasRenderingContext2D,
  fromCanvas: HTMLCanvasElement,
  toCanvas: HTMLCanvasElement,
  W: number,
  H: number,
  p: number,
  preset: CinemaTransitionPreset
) {
  const meta = TRANSITION_PRESET_CATALOG.find((item) => item.id === preset);
  const style = meta?.fallbackStyle || 'diagonal-wipe';

  targetCtx.save();
  if (style === 'zoom-dissolve') {
    const fromScale = 1 + p * 0.08;
    targetCtx.save();
    targetCtx.translate(W / 2, H / 2);
    targetCtx.scale(fromScale, fromScale);
    targetCtx.globalAlpha = 1 - p;
    targetCtx.drawImage(fromCanvas, -W / 2, -H / 2, W, H);
    targetCtx.restore();

    const toScale = 1.06 - p * 0.06;
    targetCtx.save();
    targetCtx.translate(W / 2, H / 2);
    targetCtx.scale(toScale, toScale);
    targetCtx.globalAlpha = p;
    targetCtx.drawImage(toCanvas, -W / 2, -H / 2, W, H);
    targetCtx.restore();
  } else if (style === 'whip-slide') {
    const shiftX = Math.round(W * p);
    targetCtx.drawImage(fromCanvas, -shiftX, 0, W, H);
    targetCtx.drawImage(toCanvas, W - shiftX, 0, W, H);
  } else if (style === 'iris-circle') {
    targetCtx.drawImage(fromCanvas, 0, 0, W, H);
    const maxR = Math.hypot(W * 0.5, H * 0.5);
    targetCtx.beginPath();
    targetCtx.arc(W / 2, H / 2, maxR * p, 0, Math.PI * 2);
    targetCtx.clip();
    targetCtx.drawImage(toCanvas, 0, 0, W, H);
  } else if (style === 'curtain-split') {
    targetCtx.drawImage(fromCanvas, 0, 0, W, H);
    const openW = (W * 0.5) * p;
    targetCtx.beginPath();
    targetCtx.rect(W * 0.5 - openW, 0, openW * 2, H);
    targetCtx.clip();
    targetCtx.drawImage(toCanvas, 0, 0, W, H);
  } else {
    targetCtx.drawImage(fromCanvas, 0, 0, W, H);
    targetCtx.beginPath();
    targetCtx.moveTo(0, 0);
    targetCtx.lineTo(W * p * 1.25, 0);
    targetCtx.lineTo(W * p * 0.95, H);
    targetCtx.lineTo(0, H);
    targetCtx.closePath();
    targetCtx.clip();
    targetCtx.drawImage(toCanvas, 0, 0, W, H);
  }
  targetCtx.restore();
}

export function applyGlSceneTransition(
  targetCtx: CanvasRenderingContext2D,
  fromCanvas: HTMLCanvasElement,
  toCanvas: HTMLCanvasElement,
  W: number,
  H: number,
  rawProgress: number,
  preset: CinemaTransitionPreset
): void {
  const ease = gsap.parseEase('power3.inOut');
  const p = Math.max(0, Math.min(1, ease(rawProgress)));

  const transition =
    TRANSITION_MAP.get(preset) ||
    TRANSITION_MAP.get('DirectionalWipe') ||
    TRANSITION_MAP.get('FadeColor');
  const runner = transition
    ? getGlRunner(Math.min(1280, W), Math.round((Math.min(1280, W) * H) / W))
    : null;
  const program = runner && transition ? getTransitionProgram(runner, transition) : null;

  if (runner && transition && program && runner.fromTex && runner.toTex && runner.buffer) {
    try {
      const { gl } = runner;
      gl.viewport(0, 0, runner.canvas.width, runner.canvas.height);
      gl.useProgram(program);

      gl.bindBuffer(gl.ARRAY_BUFFER, runner.buffer);
      const posLoc = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, runner.fromTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fromCanvas);
      gl.uniform1i(gl.getUniformLocation(program, 'from'), 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, runner.toTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, toCanvas);
      gl.uniform1i(gl.getUniformLocation(program, 'to'), 1);

      gl.uniform1f(gl.getUniformLocation(program, 'progress'), p);
      gl.uniform1f(gl.getUniformLocation(program, 'ratio'), W / Math.max(1, H));

      for (const [paramName, paramSpec] of Object.entries(transition.params || {})) {
        const loc = gl.getUniformLocation(program, paramName);
        if (!loc) continue;
        const val = paramSpec.default;
        if (paramSpec.type === 'float' && typeof val === 'number') {
          gl.uniform1f(loc, val);
        } else if (paramSpec.type === 'int' && typeof val === 'number') {
          gl.uniform1i(loc, val);
        } else if (paramSpec.type === 'bool' && typeof val === 'boolean') {
          gl.uniform1i(loc, val ? 1 : 0);
        } else if (paramSpec.type === 'vec2' && Array.isArray(val) && val.length >= 2) {
          gl.uniform2f(loc, val[0], val[1]);
        } else if (paramSpec.type === 'vec3' && Array.isArray(val) && val.length >= 3) {
          gl.uniform3f(loc, val[0], val[1], val[2]);
        } else if (paramSpec.type === 'vec4' && Array.isArray(val) && val.length >= 4) {
          gl.uniform4f(loc, val[0], val[1], val[2], val[3]);
        }
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      targetCtx.save();
      targetCtx.drawImage(runner.canvas, 0, 0, W, H);
      targetCtx.restore();
      return;
    } catch {
      // Fallback to Canvas2D multi-style transitions below
    }
  }

  drawCanvas2dFallbackTransition(targetCtx, fromCanvas, toCanvas, W, H, p, preset);
}
