import glTransitions, { Transition } from 'gl-transitions';
import gsap from 'gsap';

/**
 * Thực thi thực tế thư viện GitHub `gl-transitions/gl-transitions` (WebGL GLSL Shaders)
 * kết hợp `greensock/GSAP` easing để render chuyển cảnh điện ảnh GPU (CrossZoom, PaperFold,
 * InvertedPageCurl, DirectionalWarp, DirectionalWipe, Swirl, RadialWipe...) trực tiếp giữa các phân cảnh.
 */

export type CinemaTransitionPreset =
  | 'CrossZoom'
  | 'DirectionalWarp'
  | 'DirectionalWipe'
  | 'PaperFold'
  | 'InvertedPageCurl'
  | 'Swirl'
  | 'RadialWipe'
  | 'DreamyZoom';

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

export function pickSceneTransitionPreset(
  sceneIdx: number,
  isPaperArt: boolean,
  hint?: string
): CinemaTransitionPreset {
  if (isPaperArt) {
    const paperPool: CinemaTransitionPreset[] = ['PaperFold', 'InvertedPageCurl', 'DirectionalWipe'];
    return paperPool[sceneIdx % paperPool.length];
  }
  if (hint && TRANSITION_MAP.has(hint)) {
    return hint as CinemaTransitionPreset;
  }
  const cinemaPool: CinemaTransitionPreset[] = [
    'CrossZoom',
    'DirectionalWarp',
    'DirectionalWipe',
    'RadialWipe',
    'DreamyZoom',
    'Swirl',
  ];
  return cinemaPool[sceneIdx % cinemaPool.length];
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

  const transition = TRANSITION_MAP.get(preset) || TRANSITION_MAP.get('DirectionalWipe') || TRANSITION_MAP.get('Fade');
  const runner = transition ? getGlRunner(Math.min(1280, W), Math.round((Math.min(1280, W) * H) / W)) : null;
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

      // Bind GL-Transition parameter defaults cleanly
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
      // Fallback to GSAP Canvas2D wipe below if any WebGL uniform/driver exception occurs
    }
  }

  // Fallback: Smooth GSAP-eased Diagonal Directional Wipe + Subtle Scale Morph
  targetCtx.save();
  targetCtx.drawImage(fromCanvas, 0, 0, W, H);
  targetCtx.beginPath();
  targetCtx.rect(0, 0, W * p, H);
  targetCtx.clip();
  targetCtx.drawImage(toCanvas, 0, 0, W, H);
  targetCtx.restore();
}
