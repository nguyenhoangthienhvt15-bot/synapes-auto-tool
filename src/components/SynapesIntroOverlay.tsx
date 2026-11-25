import React, { useEffect, useRef, useState } from 'react';

export interface SynapesIntroOverlayProps {
  variant: 'entry' | 'login';
  userCode?: string;
  userName?: string;
  onReadyForReveal?: () => void;
  onComplete: () => void;
}

interface ForgeNode {
  nx: number;
  ny: number;
}

interface ForgeData {
  pack: {
    mark_upper: string;
    mark_lower: string;
    mark_play: string;
    geo_upper: string;
    geo_lower: string;
  };
  meta: {
    play_center_norm: [number, number];
    nodes: ForgeNode[];
    upper_path: Array<[number, number]>;
    lower_path: Array<[number, number]>;
  };
}

interface PartSoA {
  len: number;
  p4: Int32Array;
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
  a: Uint8Array;
  geo: Float32Array;
  diag: Float32Array;
}

interface DecodedForgeAssets {
  meta: ForgeData['meta'];
  markPlaySrc: string;
  upPart: PartSoA;
  loPart: PartSoA;
  fullMarkBytes: Uint8ClampedArray;
}

interface Ripple {
  x: number;
  y: number;
  age: number;
  duration: number;
  rStart: number;
  rEnd: number;
  lineWidth: number;
  alpha: number;
  wobble: number;
  palette: 'teal' | 'warm';
  phase: number;
  chromatic: boolean;
}

interface NodeBloom {
  nx: number;
  ny: number;
  age: number;
  duration: number;
  rEnd: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  colorMode: 'teal' | 'mixed';
}

const MW = 220;
const MH = 274;
const HOLDER_W = 178;
const HOLDER_H = 222;

const REVEAL_TOTAL = 2.65;
const READY_FOR_REVEAL_SEC = 2.55;
const EXIT_START_SEC = 2.85;
const EXIT_DONE_SEC = 3.40;
const WARMUP_MAX_MS = 240;
const DEFAULT_PLAY_CENTER: [number, number] = [0.4856, 0.4869];

const IS_LITTLE_ENDIAN = (() => {
  const u32 = new Uint32Array([0x04030201]);
  const u8 = new Uint8Array(u32.buffer);
  return u8[0] === 0x01;
})();

// Precomputed exp(-x^2) lookup table over x^2 in [0, 6.25] -> zero Math.exp calls per pixel
const EXP_LUT_MAX = 6.25;
const EXP_LUT_SIZE = 1024;
const EXP_LUT_SCALE = (EXP_LUT_SIZE - 1) / EXP_LUT_MAX;
const EXP_LUT = new Float32Array(EXP_LUT_SIZE);
for (let i = 0; i < EXP_LUT_SIZE; i++) {
  EXP_LUT[i] = Math.exp(-(i / EXP_LUT_SCALE));
}

function fastExpNegSq(x: number): number {
  const x2 = x * x;
  if (x2 >= EXP_LUT_MAX) return 0;
  return EXP_LUT[(x2 * EXP_LUT_SCALE) | 0];
}

// Precomputed trigonometry LUTs for 56-petal Voice Halo and 64-segment Organic Ripples
const HALO_STEPS = 56;
const HALO_COS = new Float32Array(HALO_STEPS + 1);
const HALO_SIN = new Float32Array(HALO_STEPS + 1);
const HALO_COS3 = new Float32Array(HALO_STEPS + 1);
const HALO_SIN3 = new Float32Array(HALO_STEPS + 1);
const HALO_COS5 = new Float32Array(HALO_STEPS + 1);
const HALO_SIN5 = new Float32Array(HALO_STEPS + 1);
const HALO_COS8 = new Float32Array(HALO_STEPS + 1);
const HALO_SIN8 = new Float32Array(HALO_STEPS + 1);
for (let i = 0; i <= HALO_STEPS; i++) {
  const th = (i / HALO_STEPS) * Math.PI * 2;
  HALO_COS[i] = Math.cos(th);
  HALO_SIN[i] = Math.sin(th);
  HALO_COS3[i] = Math.cos(th * 3);
  HALO_SIN3[i] = Math.sin(th * 3);
  HALO_COS5[i] = Math.cos(th * 5);
  HALO_SIN5[i] = Math.sin(th * 5);
  HALO_COS8[i] = Math.cos(th * 8);
  HALO_SIN8[i] = Math.sin(th * 8);
}

const RING_STEPS = 64;
const RING_COS = new Float32Array(RING_STEPS + 1);
const RING_SIN = new Float32Array(RING_STEPS + 1);
const RING_COS2 = new Float32Array(RING_STEPS + 1);
const RING_SIN2 = new Float32Array(RING_STEPS + 1);
const RING_COS3 = new Float32Array(RING_STEPS + 1);
const RING_SIN3 = new Float32Array(RING_STEPS + 1);
const RING_COS5 = new Float32Array(RING_STEPS + 1);
const RING_SIN5 = new Float32Array(RING_STEPS + 1);
for (let i = 0; i <= RING_STEPS; i++) {
  const th = (i / RING_STEPS) * Math.PI * 2;
  RING_COS[i] = Math.cos(th);
  RING_SIN[i] = Math.sin(th);
  RING_COS2[i] = Math.cos(th * 2);
  RING_SIN2[i] = Math.sin(th * 2);
  RING_COS3[i] = Math.cos(th * 3);
  RING_SIN3[i] = Math.sin(th * 3);
  RING_COS5[i] = Math.cos(th * 5);
  RING_SIN5[i] = Math.sin(th * 5);
}

// Reusable typed buffers for silk horizon waves -> zero per-frame array allocations
const WAVE_STEPS = 72;
const WAVE_X = new Float32Array(WAVE_STEPS + 1);
const WAVE_Y = new Float32Array(WAVE_STEPS + 1);
const WAVE_BELL = new Float32Array(WAVE_STEPS + 1);
for (let i = 0; i <= WAVE_STEPS; i++) {
  WAVE_BELL[i] = Math.pow(Math.sin((i / WAVE_STEPS) * Math.PI), 1.85);
}

const SILK_LAYERS: ReadonlyArray<{
  amp: number;
  freq: number;
  spd: number;
  ph: number;
  w: number;
  a: number;
  fillA: number;
  rgbMode: boolean;
  rgb?: readonly [number, number, number];
}> = [
  { amp: 24, freq: 0.0115, spd: 1.8, ph: 0.0, w: 1.45, a: 0.46, fillA: 0.068, rgbMode: true },
  { amp: 17, freq: 0.016, spd: -1.4, ph: 1.6, w: 1.15, a: 0.34, fillA: 0.048, rgbMode: true },
  { amp: 12, freq: 0.021, spd: 1.25, ph: 3.1, w: 0.9, a: 0.24, fillA: 0.032, rgbMode: false, rgb: [30, 174, 192] },
  { amp: 8, freq: 0.027, spd: -1.85, ph: 4.5, w: 0.75, a: 0.18, fillA: 0.0, rgbMode: false, rgb: [244, 116, 154] },
];

const clamp01 = (v: number): number => (v <= 0 ? 0 : v >= 1 ? 1 : v);
const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;
const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBackSoft = (t: number): number =>
  1 + 2.25 * Math.pow(t - 1, 3) + 1.25 * Math.pow(t - 1, 2);
const seg = (t: number, s: number, d: number): number => clamp01((t - s) / d);

function samplePath(pts: Array<[number, number]>, u: number): [number, number] {
  if (!pts || pts.length === 0) return [0.5, 0.5];
  const f = clamp01(u) * (pts.length - 1);
  const i0 = Math.floor(f);
  const i1 = Math.min(pts.length - 1, i0 + 1);
  const frac = f - i0;
  return [
    pts[i0][0] + (pts[i1][0] - pts[i0][0]) * frac,
    pts[i0][1] + (pts[i1][1] - pts[i0][1]) * frac,
  ];
}

// Pre-rendered RGB prism cloud sprite so live frames never run ctx.filter blur(26px)
let cachedAuraSprite: HTMLCanvasElement | null = null;
function getAuraSprite(): HTMLCanvasElement | null {
  if (cachedAuraSprite || typeof document === 'undefined') return cachedAuraSprite;
  const w = 320;
  const h = 128;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const cx = c.getContext('2d');
  if (!cx) return null;

  const stops: ReadonlyArray<{ nx: number; rx: number; ry: number; color: string }> = [
    { nx: 0.24, rx: 0.22, ry: 0.42, color: '56, 221, 240' },
    { nx: 0.41, rx: 0.22, ry: 0.44, color: '98, 134, 255' },
    { nx: 0.56, rx: 0.22, ry: 0.43, color: '178, 108, 255' },
    { nx: 0.70, rx: 0.21, ry: 0.42, color: '244, 108, 152' },
    { nx: 0.81, rx: 0.18, ry: 0.38, color: '247, 194, 84' },
  ];

  cx.save();
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    const px = w * s.nx;
    const py = h * 0.5;
    const rMax = Math.max(w * s.rx, h * s.ry);
    const scaleY = (h * s.ry) / rMax;
    const scaleX = (w * s.rx) / rMax;
    cx.save();
    cx.translate(px, py);
    cx.scale(scaleX, scaleY);
    const g = cx.createRadialGradient(0, 0, 0, 0, 0, rMax);
    g.addColorStop(0.0, `rgba(${s.color}, 0.26)`);
    g.addColorStop(0.45, `rgba(${s.color}, 0.11)`);
    g.addColorStop(1.0, `rgba(${s.color}, 0)`);
    cx.fillStyle = g;
    cx.beginPath();
    cx.arc(0, 0, rMax, 0, Math.PI * 2);
    cx.fill();
    cx.restore();
  }
  cx.restore();

  cachedAuraSprite = c;
  return c;
}

async function decodeImagePixels(
  src: string,
  scratchCtx: CanvasRenderingContext2D
): Promise<Uint8ClampedArray | null> {
  try {
    if (typeof createImageBitmap === 'function') {
      const resp = await fetch(src);
      const blob = await resp.blob();
      const bmp = await createImageBitmap(blob);
      scratchCtx.clearRect(0, 0, MW, MH);
      scratchCtx.drawImage(bmp, 0, 0, MW, MH);
      bmp.close();
      return new Uint8ClampedArray(scratchCtx.getImageData(0, 0, MW, MH).data);
    }
  } catch {
    // Fallback to standard HTMLImageElement decoding
  }

  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      scratchCtx.clearRect(0, 0, MW, MH);
      scratchCtx.drawImage(im, 0, 0, MW, MH);
      resolve(new Uint8ClampedArray(scratchCtx.getImageData(0, 0, MW, MH).data));
    };
    im.onerror = () => resolve(null);
    im.src = src;
  });
}

function buildSortedPartSoA(pixels: Uint8ClampedArray, geoPixels: Uint8ClampedArray): PartSoA {
  const indices: number[] = [];
  const total = MW * MH;
  for (let i = 0; i < total; i++) {
    if (pixels[i * 4 + 3] > 6) {
      indices.push(i);
    }
  }

  // Sort strictly ascending by geodesic coordinate so inner hot-loop can exit early
  indices.sort((a, b) => geoPixels[a * 4] - geoPixels[b * 4]);

  const len = indices.length;
  const p4 = new Int32Array(len);
  const r = new Uint8Array(len);
  const g = new Uint8Array(len);
  const b = new Uint8Array(len);
  const a = new Uint8Array(len);
  const geo = new Float32Array(len);
  const diag = new Float32Array(len);

  const invMW = 0.8 / MW;
  const invMH = 0.4 / MH;

  for (let k = 0; k < len; k++) {
    const idx = indices[k];
    const off4 = idx * 4;
    p4[k] = off4;
    r[k] = pixels[off4];
    g[k] = pixels[off4 + 1];
    b[k] = pixels[off4 + 2];
    a[k] = pixels[off4 + 3];
    geo[k] = geoPixels[off4] / 255.0;
    const x = idx % MW;
    const y = (idx / MW) | 0;
    diag[k] = x * invMW + y * invMH;
  }

  return { len, p4, r, g, b, a, geo, diag };
}

let cachedForgeAssetsPromise: Promise<DecodedForgeAssets | null> | null = null;

function loadSynapesForgeAssets(): Promise<DecodedForgeAssets | null> {
  if (cachedForgeAssetsPromise) return cachedForgeAssetsPromise;
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return Promise.resolve(null);
  }

  cachedForgeAssetsPromise = fetch('/synapes-harmonic-forge.json', { cache: 'force-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<ForgeData>;
    })
    .then(async (data) => {
      if (!data?.pack || !data?.meta) return null;

      const scratch = document.createElement('canvas');
      scratch.width = MW;
      scratch.height = MH;
      const scratchCtx = scratch.getContext('2d', { willReadFrequently: true });
      if (!scratchCtx) return null;

      const [uP, lP, uG, lG] = await Promise.all([
        decodeImagePixels(data.pack.mark_upper, scratchCtx),
        decodeImagePixels(data.pack.mark_lower, scratchCtx),
        decodeImagePixels(data.pack.geo_upper, scratchCtx),
        decodeImagePixels(data.pack.geo_lower, scratchCtx),
      ]);
      if (!uP || !lP || !uG || !lG) return null;

      const upPart = buildSortedPartSoA(uP, uG);
      const loPart = buildSortedPartSoA(lP, lG);

      // Bake static finished mark once for O(1) blit when forging/sheen are idle
      const fullMarkBytes = new Uint8ClampedArray(MW * MH * 4);
      for (let k = 0; k < upPart.len; k++) {
        const off = upPart.p4[k];
        fullMarkBytes[off] = upPart.r[k];
        fullMarkBytes[off + 1] = upPart.g[k];
        fullMarkBytes[off + 2] = upPart.b[k];
        fullMarkBytes[off + 3] = upPart.a[k];
      }
      for (let k = 0; k < loPart.len; k++) {
        const off = loPart.p4[k];
        fullMarkBytes[off] = loPart.r[k];
        fullMarkBytes[off + 1] = loPart.g[k];
        fullMarkBytes[off + 2] = loPart.b[k];
        fullMarkBytes[off + 3] = loPart.a[k];
      }

      return {
        meta: data.meta,
        markPlaySrc: data.pack.mark_play,
        upPart,
        loPart,
        fullMarkBytes,
      };
    })
    .catch(() => {
      cachedForgeAssetsPromise = null;
      return null;
    });

  return cachedForgeAssetsPromise;
}

if (typeof window !== 'undefined') {
  void loadSynapesForgeAssets();
  getAuraSprite();
}

export const SynapesIntroOverlay: React.FC<SynapesIntroOverlayProps> = ({
  variant,
  onReadyForReveal,
  onComplete,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const shellRef = useRef<HTMLDivElement | null>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const markHolderRef = useRef<HTMLDivElement | null>(null);
  const markCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const playLayerRef = useRef<HTMLImageElement | null>(null);
  const progressRailRef = useRef<HTMLDivElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);

  const onReadyForRevealRef = useRef(onReadyForReveal);
  onReadyForRevealRef.current = onReadyForReveal;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const completedRef = useRef(false);
  const readySignaledRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);
  const triggerResonanceRef = useRef<((x: number, y: number, fromMark: boolean) => void) | null>(null);

  const signalReady = () => {
    if (!readySignaledRef.current) {
      readySignaledRef.current = true;
      onReadyForRevealRef.current?.();
    }
  };

  const triggerSkip = () => {
    if (completedRef.current) return;
    signalReady();
    setIsExiting(true);
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
    }
    exitTimerRef.current = window.setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
    }, 200);
  };

  useEffect(() => {
    const shell = shellRef.current;
    const fxCanvas = fxCanvasRef.current;
    const markHolder = markHolderRef.current;
    const markCanvas = markCanvasRef.current;
    const playLayer = playLayerRef.current;
    if (!shell || !fxCanvas || !markHolder || !markCanvas || !playLayer) return;

    const ctx =
      fxCanvas.getContext('2d', { alpha: false, desynchronized: true }) ||
      fxCanvas.getContext('2d', { alpha: false }) ||
      fxCanvas.getContext('2d');
    const mctx = markCanvas.getContext('2d');
    if (!ctx || !mctx) {
      signalReady();
      onCompleteRef.current();
      return;
    }

    let disposed = false;
    let rafId = 0;
    let assets: DecodedForgeAssets | null = null;
    let playNX = DEFAULT_PLAY_CENTER[0];
    let playNY = DEFAULT_PLAY_CENTER[1];
    playLayer.style.transformOrigin = `${(playNX * 100).toFixed(2)}% ${(playNY * 100).toFixed(2)}%`;

    const auraSprite = getAuraSprite();
    const outImgData = mctx.createImageData(MW, MH);
    const outBuf = outImgData.data;
    const outBuf32 = IS_LITTLE_ENDIAN ? new Uint32Array(outBuf.buffer) : null;

    let markBlankState = true;
    let markStaticState = false;

    void loadSynapesForgeAssets().then((loaded) => {
      if (disposed || !loaded) return;
      assets = loaded;
      playNX = loaded.meta.play_center_norm[0] ?? DEFAULT_PLAY_CENTER[0];
      playNY = loaded.meta.play_center_norm[1] ?? DEFAULT_PLAY_CENTER[1];
      playLayer.style.transformOrigin = `${(playNX * 100).toFixed(2)}% ${(playNY * 100).toFixed(2)}%`;
      playLayer.src = loaded.markPlaySrc;
      originX = cachedMr.left + HOLDER_W * playNX;
      originY = cachedMr.top + HOLDER_H * playNY;
    });

    const paintPartFast = (
      part: PartSoA,
      prog: number,
      sheenCenter: number,
      sheenAmp: number,
      pulseU: number,
      pulseAmp: number,
      hasPulse: boolean
    ) => {
      if (prog <= 0.002) return;
      const isForging = prog < 0.998;
      const feather = 0.085;
      const invFeather = 1 / feather;
      const progLimit = prog * (1.0 + feather);
      const hasSheen = sheenAmp > 0.005;
      const hasActivePulse = hasPulse && pulseAmp > 0.01;
      const pulseScale = pulseAmp * 0.72;
      const invWaveW = 1 / 0.055;
      const invPulseW = 1 / 0.075;

      const { len, p4, r: rArr, g: gArr, b: bArr, a: aArr, geo: geoArr, diag: diagArr } = part;

      for (let k = 0; k < len; k++) {
        const g = geoArr[k];
        if (isForging && g >= progLimit) {
          break;
        }

        let mask = 1.0;
        let boost = 0.0;

        if (isForging) {
          const m = (progLimit - g) * invFeather;
          if (m <= 0.0) continue;
          if (m < 1.0) mask = m * m * (3.0 - 2.0 * m);
          boost += fastExpNegSq((g - prog) * invWaveW) * 1.15;
        }

        if (hasActivePulse) {
          boost += fastExpNegSq((g - pulseU) * invPulseW) * pulseScale;
        }

        let sr = 0.0;
        let sg = 0.0;
        let sb = 0.0;
        if (hasSheen) {
          const d = diagArr[k];
          const core = fastExpNegSq((d - sheenCenter) * 9.5238) * sheenAmp;
          const edgeR = fastExpNegSq((d - (sheenCenter + 0.055)) * 9.0909) * sheenAmp * 0.38;
          const edgeB = fastExpNegSq((d - (sheenCenter - 0.055)) * 9.0909) * sheenAmp * 0.38;
          sr = core * 180 + edgeR * 170;
          sg = core * 195 + (edgeR + edgeB) * 45;
          sb = core * 205 + edgeB * 185;
        }

        const rVal = rArr[k] + boost * 135 + sr;
        const gVal = gArr[k] + boost * 215 + sg;
        const bVal = bArr[k] + boost * 230 + sb;
        const aVal = aArr[k] * mask;

        const rr = rVal >= 255 ? 255 : rVal | 0;
        const gg = gVal >= 255 ? 255 : gVal | 0;
        const bb = bVal >= 255 ? 255 : bVal | 0;
        const aa = aVal >= 255 ? 255 : aVal | 0;

        const off = p4[k];
        if (outBuf32) {
          outBuf32[off >> 2] = (aa << 24) | (bb << 16) | (gg << 8) | rr;
        } else {
          outBuf[off] = rr;
          outBuf[off + 1] = gg;
          outBuf[off + 2] = bb;
          outBuf[off + 3] = aa;
        }
      }
    };

    const renderGeodesicMark = (
      upProg: number,
      loProg: number,
      sheenCenter: number,
      sheenAmp: number,
      pulseU: number,
      pulseAmp: number,
      pulseWhich: number
    ) => {
      if (!assets) return;

      // Skip entirely when mark is still invisible
      if (upProg <= 0.002 && loProg <= 0.002) {
        if (!markBlankState) {
          mctx.clearRect(0, 0, MW, MH);
          markBlankState = true;
          markStaticState = false;
        }
        return;
      }

      // Skip heavy pixel loop once both ribbons finished forging and no sheen/pulse active
      if (upProg >= 0.998 && loProg >= 0.998 && sheenAmp <= 0.005 && pulseAmp <= 0.01) {
        if (!markStaticState) {
          outBuf.set(assets.fullMarkBytes);
          mctx.putImageData(outImgData, 0, 0);
          markStaticState = true;
          markBlankState = false;
        }
        return;
      }

      markBlankState = false;
      markStaticState = false;
      if (outBuf32) {
        outBuf32.fill(0);
      } else {
        outBuf.fill(0);
      }

      paintPartFast(
        assets.upPart,
        upProg,
        sheenCenter,
        sheenAmp,
        pulseU,
        pulseAmp,
        pulseWhich === 0 || pulseWhich === 2
      );
      paintPartFast(
        assets.loPart,
        loProg,
        sheenCenter,
        sheenAmp,
        pulseU,
        pulseAmp,
        pulseWhich === 1 || pulseWhich === 2
      );
      mctx.putImageData(outImgData, 0, 0);
    };

    let cw = window.innerWidth || 1280;
    let ch = window.innerHeight || 720;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let mouseX = cw * 0.5;
    let mouseY = ch * 0.45;
    let smX = mouseX;
    let smY = mouseY;

    let cachedBgGrad: CanvasGradient | string = '#F6F8FC';
    const cachedMr = { left: (cw - HOLDER_W) * 0.5, top: (ch - HOLDER_H) * 0.5, width: HOLDER_W, height: HOLDER_H };
    let originX = cachedMr.left + HOLDER_W * playNX;
    let originY = cachedMr.top + HOLDER_H * playNY;

    const resize = () => {
      cw = Math.max(300, shell.clientWidth || window.innerWidth);
      ch = Math.max(300, shell.clientHeight || window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      fxCanvas.width = Math.round(cw * dpr);
      fxCanvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cachedBgGrad = ctx.createRadialGradient(
        cw * 0.5,
        ch * 0.42,
        0,
        cw * 0.5,
        ch * 0.42,
        Math.hypot(cw * 0.5, ch * 0.62)
      );
      cachedBgGrad.addColorStop(0, '#FFFFFF');
      cachedBgGrad.addColorStop(0.62, '#F4F6FA');
      cachedBgGrad.addColorStop(1, '#EAEEF4');

      cachedMr.left = (cw - HOLDER_W) * 0.5;
      cachedMr.top = (ch - HOLDER_H) * 0.5;
      originX = cachedMr.left + HOLDER_W * playNX;
      originY = cachedMr.top + HOLDER_H * playNY;
    };
    resize();

    const ripples: Ripple[] = [];
    const nodeBlooms: NodeBloom[] = [];
    const sparks: Spark[] = [];

    const spawnRipple = (x: number, y: number, opts: Partial<Ripple> = {}) => {
      ripples.push({
        x,
        y,
        age: 0,
        duration: opts.duration ?? 2.35,
        rStart: opts.rStart ?? 8,
        rEnd: opts.rEnd ?? Math.min(cw, ch) * 0.62,
        lineWidth: opts.lineWidth ?? 1.65,
        alpha: opts.alpha ?? 0.5,
        wobble: opts.wobble ?? 6.0,
        palette: opts.palette ?? 'teal',
        phase: Math.random() * Math.PI * 2,
        chromatic: opts.chromatic ?? true,
      });
    };

    const spawnSparks = (
      x: number,
      y: number,
      count = 6,
      colorMode: 'teal' | 'mixed' = 'teal'
    ) => {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 14 + Math.random() * 44;
        sparks.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          age: 0,
          life: 0.75 + Math.random() * 0.75,
          size: 1.1 + Math.random() * 1.7,
          colorMode,
        });
      }
    };

    const drawElevenLabsOrb = (
      ox: number,
      oy: number,
      radius: number,
      opacity: number,
      voiceEnergy: number,
      gt: number
    ) => {
      if (opacity <= 0.004 || radius <= 1) return;
      ctx.save();
      ctx.globalAlpha = opacity;

      const outerG = ctx.createRadialGradient(ox, oy, radius * 0.25, ox, oy, radius * 2.25);
      outerG.addColorStop(0.0, 'rgba(43, 196, 203, 0.20)');
      outerG.addColorStop(0.45, 'rgba(240, 185, 65, 0.08)');
      outerG.addColorStop(1.0, 'rgba(43, 196, 203, 0)');
      ctx.fillStyle = outerG;
      ctx.beginPath();
      ctx.arc(ox, oy, radius * 2.25, 0, Math.PI * 2);
      ctx.fill();

      // 56-petal Voice-Spectrum Halo using precomputed LUTs
      if (voiceEnergy > 0.02) {
        const c3 = Math.cos(gt * 3.8);
        const s3 = Math.sin(gt * 3.8);
        const c5 = Math.cos(-gt * 5.2);
        const s5 = Math.sin(-gt * 5.2);
        const c8 = Math.cos(gt * 2.6);
        const s8 = Math.sin(gt * 2.6);

        ctx.beginPath();
        for (let i = 0; i <= HALO_STEPS; i++) {
          const spec =
            (HALO_SIN3[i] * c3 + HALO_COS3[i] * s3) * 0.45 +
            (HALO_SIN5[i] * c5 + HALO_COS5[i] * s5) * 0.35 +
            (HALO_SIN8[i] * c8 + HALO_COS8[i] * s8) * 0.2;
          const rr = radius * (1.1 + (0.14 + Math.abs(spec) * 0.24) * voiceEnergy);
          const px = ox + HALO_COS[i] * rr;
          const py = oy + HALO_SIN[i] * rr;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        const haloG = ctx.createLinearGradient(ox - radius, oy - radius, ox + radius, oy + radius);
        haloG.addColorStop(0, `rgba(68, 214, 220, ${0.42 * voiceEnergy})`);
        haloG.addColorStop(0.55, `rgba(24, 128, 178, ${0.32 * voiceEnergy})`);
        haloG.addColorStop(1, `rgba(240, 185, 65, ${0.38 * voiceEnergy})`);
        ctx.strokeStyle = haloG;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }

      // Two tilted elliptical orbital rings
      const orbConfigs: ReadonlyArray<{ rot: number; rx: number; ry: number; a: number; col: string }> = [
        { rot: -0.35 + gt * 0.38, rx: radius * 1.48, ry: radius * 0.54, a: 0.36, col: '#31C6CE' },
        { rot: 0.55 - gt * 0.31, rx: radius * 1.66, ry: radius * 0.62, a: 0.24, col: '#E8A845' },
      ];
      for (let i = 0; i < 2; i++) {
        const orb = orbConfigs[i];
        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(orb.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, orb.rx, orb.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = orb.col;
        ctx.globalAlpha = opacity * orb.a;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        const ba = gt * 2.6 + orb.rot * 2;
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = opacity * 0.85;
        ctx.beginPath();
        ctx.arc(Math.cos(ba) * orb.rx, Math.sin(ba) * orb.ry, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Core Liquid Iridescent Sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(ox, oy, radius, 0, Math.PI * 2);
      ctx.clip();

      const baseG = ctx.createRadialGradient(
        ox - radius * 0.28,
        oy - radius * 0.28,
        radius * 0.08,
        ox,
        oy,
        radius
      );
      baseG.addColorStop(0, '#FFFFFF');
      baseG.addColorStop(0.45, '#33C5CE');
      baseG.addColorStop(1, '#0F4D84');
      ctx.fillStyle = baseG;
      ctx.fillRect(ox - radius, oy - radius, radius * 2, radius * 2);

      const lobes: ReadonlyArray<{ ang: number; dist: number; r: number; c0: string; c1: string }> = [
        { ang: gt * 1.7, dist: 0.36, r: 0.85, c0: 'rgba(130, 245, 250, 0.85)', c1: 'rgba(43, 196, 203, 0)' },
        { ang: -gt * 1.35 + 2.1, dist: 0.42, r: 0.82, c0: 'rgba(15, 76, 134, 0.88)', c1: 'rgba(15, 76, 134, 0)' },
        { ang: gt * 1.1 + 4.0, dist: 0.44, r: 0.72, c0: 'rgba(244, 192, 82, 0.62)', c1: 'rgba(232, 114, 75, 0)' },
        { ang: -gt * 1.9 + 0.8, dist: 0.38, r: 0.62, c0: 'rgba(255, 255, 255, 0.78)', c1: 'rgba(255, 255, 255, 0)' },
      ];
      for (let i = 0; i < 4; i++) {
        const lb = lobes[i];
        const lx = ox + Math.cos(lb.ang) * radius * lb.dist;
        const ly = oy + Math.sin(lb.ang) * radius * lb.dist;
        const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, radius * lb.r);
        g.addColorStop(0, lb.c0);
        g.addColorStop(1, lb.c1);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(lx, ly, radius * lb.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const rim = ctx.createRadialGradient(
        ox - radius * 0.32,
        oy - radius * 0.36,
        radius * 0.05,
        ox,
        oy,
        radius
      );
      rim.addColorStop(0, 'rgba(255,255,255,0.72)');
      rim.addColorStop(0.28, 'rgba(255,255,255,0.12)');
      rim.addColorStop(0.86, 'rgba(255,255,255,0)');
      rim.addColorStop(1, 'rgba(255,255,255,0.45)');
      ctx.fillStyle = rim;
      ctx.fillRect(ox - radius, oy - radius, radius * 2, radius * 2);
      ctx.restore();

      ctx.restore();
    };

    const drawSilkWaveHorizon = (ox: number, oy: number, energy: number, gt: number) => {
      if (energy <= 0.003) return;
      const span = Math.min(cw * 0.9, 680);
      const leftX = ox - span * 0.5;
      const mShift = ((smY - oy) / ch) * 18;
      const mPullX = (smX - ox) / cw;

      // Offscreen pre-blurred prism cloud blit (< 0.05ms, replaces expensive runtime filter blur)
      if (auraSprite) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(Math.sin(gt * 0.35) * 0.05);
        ctx.globalAlpha = Math.min(1, 0.24 + energy * 0.36);
        const drawW = span * 1.1;
        const drawH = (34 + energy * 18) * 3.1;
        ctx.drawImage(auraSprite, -drawW * 0.5, -drawH * 0.5, drawW, drawH);
        ctx.restore();
      }

      const makeRgbRibbonGrad = (alphaScale: number) => {
        const g = ctx.createLinearGradient(leftX, oy, leftX + span, oy);
        const s = Math.sin(gt * 0.75) * 0.08;
        g.addColorStop(0.0, 'rgba(56, 221, 240, 0)');
        g.addColorStop(clamp01(0.18 + s), `rgba(56, 221, 240, ${(alphaScale * 0.85).toFixed(3)})`);
        g.addColorStop(clamp01(0.38 + s), `rgba(92, 144, 255, ${(alphaScale * 0.95).toFixed(3)})`);
        g.addColorStop(clamp01(0.54 + s), `rgba(176, 108, 255, ${(alphaScale * 0.9).toFixed(3)})`);
        g.addColorStop(clamp01(0.70 + s), `rgba(244, 108, 152, ${(alphaScale * 0.88).toFixed(3)})`);
        g.addColorStop(clamp01(0.84 + s), `rgba(247, 194, 84, ${(alphaScale * 0.75).toFixed(3)})`);
        g.addColorStop(1.0, 'rgba(247, 194, 84, 0)');
        return g;
      };

      const stepDx = span / WAVE_STEPS;
      for (let i = 0; i <= WAVE_STEPS; i++) {
        WAVE_X[i] = leftX + i * stepDx;
      }

      for (let idx = 0; idx < SILK_LAYERS.length; idx++) {
        const L = SILK_LAYERS[idx];
        const a = L.a * energy;
        let strokeStyle: CanvasGradient;
        if (L.rgbMode || !L.rgb) {
          strokeStyle = makeRgbRibbonGrad(a);
        } else {
          const [r, g, b] = L.rgb;
          const grad = ctx.createLinearGradient(leftX, oy, leftX + span, oy);
          grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
          grad.addColorStop(0.24, `rgba(${r},${g},${b},${a * 0.75})`);
          grad.addColorStop(0.5, `rgba(${r},${g},${b},${a})`);
          grad.addColorStop(0.76, `rgba(${r},${g},${b},${a * 0.75})`);
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
          strokeStyle = grad;
        }

        const p1 = gt * L.spd + L.ph + mPullX * 1.4;
        const p2 = -gt * L.spd * 0.8 + idx;
        const freq2 = L.freq * 1.9;
        const mOff = mShift * 0.22 * (idx - 1.2);
        const ampE = L.amp * energy;

        for (let i = 0; i <= WAVE_STEPS; i++) {
          const x = WAVE_X[i];
          const wv = Math.sin(x * L.freq + p1) * 0.62 + Math.sin(x * freq2 + p2) * 0.38;
          WAVE_Y[i] = oy + (wv * ampE + mOff) * WAVE_BELL[i];
        }

        if (L.fillA > 0) {
          ctx.beginPath();
          ctx.moveTo(WAVE_X[0], oy);
          for (let i = 0; i <= WAVE_STEPS; i++) ctx.lineTo(WAVE_X[i], WAVE_Y[i]);
          ctx.lineTo(WAVE_X[WAVE_STEPS], oy);
          ctx.closePath();
          ctx.fillStyle =
            L.rgbMode || !L.rgb
              ? makeRgbRibbonGrad(L.fillA * energy)
              : `rgba(${L.rgb[0]},${L.rgb[1]},${L.rgb[2]},${(L.fillA * energy).toFixed(3)})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.moveTo(WAVE_X[0], WAVE_Y[0]);
        for (let i = 1; i <= WAVE_STEPS; i++) {
          ctx.lineTo(WAVE_X[i], WAVE_Y[i]);
        }
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = L.w;
        ctx.stroke();
      }
    };

    const drawOrganicRing = (
      cx: number,
      cy: number,
      r: number,
      wb: number,
      ph: number,
      gt: number
    ) => {
      const a2 = ph + gt * 1.15;
      const a3 = -ph * 0.7 - gt * 1.55;
      const a5 = ph * 1.3 + gt * 0.9;

      const c2 = Math.cos(a2) * 0.48 * wb;
      const s2 = Math.sin(a2) * 0.48 * wb;
      const c3 = Math.cos(a3) * 0.32 * wb;
      const s3 = Math.sin(a3) * 0.32 * wb;
      const c5 = Math.cos(a5) * 0.2 * wb;
      const s5 = Math.sin(a5) * 0.2 * wb;

      ctx.beginPath();
      for (let i = 0; i <= RING_STEPS; i++) {
        const rr =
          r +
          (RING_SIN2[i] * c2 + RING_COS2[i] * s2) +
          (RING_SIN3[i] * c3 + RING_COS3[i] * s3) +
          (RING_SIN5[i] * c5 + RING_COS5[i] * s5);
        const px = cx + RING_COS[i] * rr;
        const py = cy + RING_SIN[i] * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const drawRipples = (dt: number, gt: number) => {
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.age += dt;
        if (rp.age >= rp.duration) {
          ripples.splice(i, 1);
          continue;
        }
        const u = rp.age / rp.duration;
        const rad = rp.rStart + (rp.rEnd - rp.rStart) * easeOutExpo(u);
        const a = rp.alpha * clamp01(u / 0.07) * Math.pow(1 - u, 1.7);
        const wb = rp.wobble * (0.35 + 0.65 * Math.sin(u * Math.PI)) * (1 - u * 0.4);

        ctx.save();
        if (rp.chromatic && rad > 18) {
          drawOrganicRing(rp.x, rp.y, rad * 1.022, wb * 1.05, rp.phase + 0.16, gt);
          ctx.strokeStyle = `rgba(68, 224, 232, ${(a * 0.36).toFixed(3)})`;
          ctx.lineWidth = Math.max(0.5, rp.lineWidth * 0.68);
          ctx.stroke();

          drawOrganicRing(rp.x, rp.y, rad * 0.985, wb * 0.92, rp.phase - 0.14, gt);
          ctx.strokeStyle = `rgba(168, 108, 255, ${(a * 0.3).toFixed(3)})`;
          ctx.lineWidth = Math.max(0.5, rp.lineWidth * 0.62);
          ctx.stroke();

          drawOrganicRing(rp.x, rp.y, rad * 0.955, wb * 0.8, rp.phase - 0.38, gt);
          ctx.strokeStyle = `rgba(244, 112, 152, ${(a * 0.32).toFixed(3)})`;
          ctx.lineWidth = Math.max(0.5, rp.lineWidth * 0.62);
          ctx.stroke();
        }

        drawOrganicRing(rp.x, rp.y, rad, wb, rp.phase, gt);
        const g = ctx.createLinearGradient(rp.x - rad, rp.y - rad * 0.5, rp.x + rad, rp.y + rad * 0.5);
        if (rp.palette === 'warm') {
          g.addColorStop(0.0, `rgba(56,221,240,${a * 0.72})`);
          g.addColorStop(0.35, `rgba(168,108,255,${a * 0.72})`);
          g.addColorStop(0.68, `rgba(244,108,152,${a * 0.8})`);
          g.addColorStop(1.0, `rgba(247,194,84,${a * 0.75})`);
        } else {
          g.addColorStop(0.0, `rgba(68,224,232,${a})`);
          g.addColorStop(0.35, `rgba(92,144,255,${a * 0.88})`);
          g.addColorStop(0.68, `rgba(176,108,255,${a * 0.68})`);
          g.addColorStop(1.0, `rgba(244,112,152,${a * 0.62})`);
        }
        ctx.strokeStyle = g;
        ctx.lineWidth = Math.max(0.6, rp.lineWidth * (1 - u * 0.42));
        ctx.stroke();

        if (rad > 28) {
          drawOrganicRing(rp.x, rp.y, rad * 0.87, wb * 0.65, rp.phase + 1.1, gt);
          ctx.strokeStyle = `rgba(43, 196, 203, ${(a * 0.24).toFixed(3)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    const drawEnergyComet = (
      pts: Array<[number, number]>,
      prog: number,
      mr: { left: number; top: number; width: number; height: number },
      opacity: number
    ) => {
      if (opacity <= 0.01 || prog <= 0.01 || prog >= 0.995) return;
      const tailLen = 0.16;
      const steps = 12;
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < steps; i++) {
        const f0 = i / steps;
        const f1 = (i + 1) / steps;
        const u0 = prog - tailLen * (1 - f0);
        const u1 = prog - tailLen * (1 - f1);
        if (u1 < 0) continue;
        const p0 = samplePath(pts, Math.max(0, u0));
        const p1 = samplePath(pts, Math.max(0, u1));
        ctx.beginPath();
        ctx.moveTo(mr.left + mr.width * p0[0], mr.top + mr.height * p0[1]);
        ctx.lineTo(mr.left + mr.width * p1[0], mr.top + mr.height * p1[1]);
        ctx.strokeStyle = `rgba(115, 244, 248, ${(f1 * f1 * opacity * 0.82).toFixed(3)})`;
        ctx.lineWidth = 1.2 + f1 * 3.2;
        ctx.stroke();
      }
      const head = samplePath(pts, prog);
      const hx = mr.left + mr.width * head[0];
      const hy = mr.top + mr.height * head[1];
      const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 14);
      hg.addColorStop(0, `rgba(255, 255, 255, ${(opacity * 0.95).toFixed(3)})`);
      hg.addColorStop(0.35, `rgba(92, 234, 240, ${(opacity * 0.78).toFixed(3)})`);
      hg.addColorStop(1, 'rgba(43, 196, 203, 0)');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(hx, hy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const mountTime = performance.now();
    let warmupFrames = 0;
    let started = false;
    let elapsed = 0;
    let lastFrame = mountTime;
    let activePulse = { age: -1, duration: 1.25, which: 0 };
    let voiceBurst = 0;
    let manualSheen = -1;
    let exitTriggered = false;
    const cues: Record<string, boolean> = {};

    const triggerResonance = (x: number, y: number, fromMark = false) => {
      const rx = fromMark ? originX : x;
      const ry = fromMark ? originY : y;
      const md = Math.min(cw, ch);
      spawnRipple(rx, ry, {
        duration: 2.0,
        rStart: fromMark ? 14 : 6,
        rEnd: md * (fromMark ? 0.62 : 0.42),
        lineWidth: 1.75,
        alpha: 0.48,
        wobble: 5.5,
        palette: 'teal',
        chromatic: true,
      });
      spawnRipple(rx, ry, {
        duration: 2.45,
        rStart: fromMark ? 8 : 3,
        rEnd: md * (fromMark ? 0.76 : 0.52),
        lineWidth: 1.15,
        alpha: 0.28,
        wobble: 7.5,
        palette: 'warm',
        chromatic: false,
      });
      spawnSparks(rx, ry, fromMark ? 10 : 6, fromMark ? 'mixed' : 'teal');
      if (fromMark) {
        voiceBurst = 1.0;
        manualSheen = 0;
        activePulse = { age: 0, duration: 1.15, which: 2 };
        if (assets?.meta.nodes) {
          assets.meta.nodes.forEach((n, idx) =>
            nodeBlooms.push({ nx: n.nx, ny: n.ny, age: -idx * 0.045, duration: 0.95, rEnd: 20 })
          );
        }
      }
    };
    triggerResonanceRef.current = triggerResonance;

    const tick = (now: number) => {
      if (disposed || completedRef.current) return;

      const rawDt = Math.max(0, (now - lastFrame) / 1000);
      lastFrame = now;
      warmupFrames++;

      // Hold timeline at t=0 during initial 2-frame settle + asset decode warmup so Act 1 never jump-cuts
      if (!started) {
        if ((assets !== null && warmupFrames >= 2) || now - mountTime >= WARMUP_MAX_MS) {
          started = true;
        }
      } else {
        // Clamp dt <= 33ms for butter-smooth pacing even across occasional OS/GC hiccups
        elapsed += Math.min(rawDt, 0.033);
      }

      const dt = Math.min(rawDt, 0.033);
      const t = elapsed;
      const gt = now / 1000;

      smX += (mouseX - smX) * Math.min(1, dt * 6);
      smY += (mouseY - smY) * Math.min(1, dt * 6);

      const md = Math.min(cw, ch);

      if (started && !cues.orbWake && t >= 0.08) {
        cues.orbWake = true;
        spawnRipple(originX, originY, {
          duration: 2.0,
          rStart: 12,
          rEnd: md * 0.44,
          lineWidth: 1.4,
          alpha: 0.36,
          wobble: 4.5,
          palette: 'teal',
          chromatic: false,
        });
      }
      if (!cues.shock && t >= 0.8) {
        cues.shock = true;
        spawnRipple(originX, originY, {
          duration: 2.4,
          rStart: 18,
          rEnd: md * 0.72,
          lineWidth: 2.1,
          alpha: 0.56,
          wobble: 6.5,
          palette: 'teal',
          chromatic: true,
        });
        spawnRipple(originX, originY, {
          duration: 2.7,
          rStart: 12,
          rEnd: md * 0.84,
          lineWidth: 1.3,
          alpha: 0.34,
          wobble: 8.5,
          palette: 'warm',
          chromatic: false,
        });
        spawnSparks(originX, originY, 12, 'mixed');
      }
      if (!cues.nInner && t >= 0.96 && assets?.meta.nodes) {
        cues.nInner = true;
        [2, 3].forEach((idx) => {
          const n = assets?.meta.nodes[idx];
          if (!n) return;
          nodeBlooms.push({ nx: n.nx, ny: n.ny, age: 0, duration: 0.85, rEnd: 18 });
          spawnSparks(cachedMr.left + cachedMr.width * n.nx, cachedMr.top + cachedMr.height * n.ny, 4, 'teal');
        });
      }
      if (!cues.nMid && t >= 1.36 && assets?.meta.nodes) {
        cues.nMid = true;
        [0, 5].forEach((idx) => {
          const n = assets?.meta.nodes[idx];
          if (!n) return;
          nodeBlooms.push({ nx: n.nx, ny: n.ny, age: 0, duration: 0.92, rEnd: 20 });
          spawnSparks(cachedMr.left + cachedMr.width * n.nx, cachedMr.top + cachedMr.height * n.ny, 4, 'teal');
        });
      }
      if (!cues.nOuter && t >= 1.84 && assets?.meta.nodes) {
        cues.nOuter = true;
        [1, 4, 6].forEach((idx, k) => {
          const n = assets?.meta.nodes[idx];
          if (!n) return;
          nodeBlooms.push({ nx: n.nx, ny: n.ny, age: -k * 0.05, duration: 1.0, rEnd: 22 });
          spawnSparks(cachedMr.left + cachedMr.width * n.nx, cachedMr.top + cachedMr.height * n.ny, 5, 'mixed');
        });
        spawnRipple(originX, originY, {
          duration: 2.6,
          rStart: 54,
          rEnd: md * 0.78,
          lineWidth: 1.45,
          alpha: 0.36,
          wobble: 5.5,
          palette: 'warm',
          chromatic: true,
        });
      }
      if (!cues.done && t >= 2.75) {
        cues.done = true;
        if (progressRailRef.current) {
          progressRailRef.current.style.opacity = '0';
        }
      }

      // GPU-composited progress bar via transform: scaleX (zero layout thrash)
      if (progressFillRef.current) {
        const pRatio = easeOutCubic(clamp01(t / REVEAL_TOTAL));
        progressFillRef.current.style.transform = `scaleX(${pRatio.toFixed(4)})`;
      }

      const idleB = easeInOutSine(seg(t, 2.0, 0.9));
      const floatY = Math.sin((t - 2.0) * 1.3) * 2.4 * idleB;
      const tiltX = ((smY - ch * 0.45) / ch) * -8.5 * idleB;
      const tiltY = ((smX - cw * 0.5) / cw) * 10.5 * idleB;
      markHolder.style.transform = `translate3d(0, ${floatY.toFixed(2)}px, 0) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;

      // Act 1 -> Act 2: ElevenLabs Liquid Voice-Orb
      const orbAppear = easeOutBackSoft(seg(t, 0.0, 0.52));
      const orbCompress = Math.sin(seg(t, 0.62, 0.2) * Math.PI) * 0.16;
      const orbDissolve = easeOutCubic(seg(t, 0.8, 0.48));
      voiceBurst = Math.max(0, voiceBurst - dt * 1.25);

      const orbRadIntro = 34 * orbAppear * (1 - orbCompress) * (1 + orbDissolve * 0.95);
      const orbOpIntro = clamp01(seg(t, 0.0, 0.25)) * (1 - orbDissolve);
      const idleOrbOp = (0.14 + voiceBurst * 0.48) * idleB;
      const idleOrbRad = 26 + voiceBurst * 16 + Math.sin(gt * 2.0) * 2;

      // Act 2A: Play Core Crystallization (pure GPU transform + opacity, zero blur repaint)
      const pP = seg(t, 0.78, 0.56);
      const pAlpha = easeOutCubic(seg(t, 0.78, 0.3));
      const pScale =
        (0.35 + 0.65 * easeOutBackSoft(pP)) * (1 + Math.sin(voiceBurst * Math.PI * 2) * 0.07 * voiceBurst);
      playLayer.style.opacity = pAlpha.toFixed(3);
      playLayer.style.transform = `scale3d(${pScale.toFixed(4)}, ${pScale.toFixed(4)}, 1)`;

      // Act 2B: Geodesic Liquid-Path Forging
      const upProg = easeInOutCubic(seg(t, 0.92, 1.02));
      const loProg = easeInOutCubic(seg(t, 0.98, 1.04));

      let sheenCenter = -0.5;
      let sheenAmp = 0;
      if (t >= 1.9 && t <= 2.68) {
        const sp = seg(t, 1.9, 0.76);
        sheenCenter = -0.35 + easeInOutSine(sp) * 1.92;
        sheenAmp = Math.sin(sp * Math.PI) * 0.78;
      } else if (manualSheen >= 0) {
        manualSheen += dt;
        const sp = clamp01(manualSheen / 0.72);
        sheenCenter = -0.35 + easeInOutSine(sp) * 1.92;
        sheenAmp = Math.sin(sp * Math.PI) * 0.75;
        if (manualSheen >= 0.74) manualSheen = -1;
      }

      let pulseU = -1;
      let pulseAmp = 0;
      if (activePulse.age >= 0) {
        activePulse.age += dt;
        const pu = activePulse.age / activePulse.duration;
        if (pu >= 1) activePulse.age = -1;
        else {
          pulseU = easeInOutSine(pu);
          pulseAmp = Math.sin(pu * Math.PI);
        }
      }

      renderGeodesicMark(upProg, loProg, sheenCenter, sheenAmp, pulseU, pulseAmp, activePulse.which);

      // Draw opaque backdrop gradient onto alpha:false canvas for maximum GPU compositor throughput
      ctx.fillStyle = cachedBgGrad;
      ctx.fillRect(0, 0, cw, ch);

      const waveEnergy =
        easeOutCubic(seg(t, 0.12, 0.65)) * 0.65 +
        Math.sin(seg(t, 0.78, 1.25) * Math.PI) * 0.72 +
        voiceBurst * 0.85;
      const settledEnergy =
        waveEnergy * (1 - 0.58 * easeInOutSine(seg(t, 2.05, 1.1))) + voiceBurst * 0.45;
      drawSilkWaveHorizon(originX, originY, settledEnergy, gt);

      if (idleOrbOp > 0.01) {
        drawElevenLabsOrb(originX, originY, idleOrbRad, idleOrbOp, 0.35 + voiceBurst * 1.1, gt);
      }

      drawRipples(dt, gt);

      if (orbOpIntro > 0.005) {
        drawElevenLabsOrb(originX, originY, orbRadIntro, orbOpIntro, 0.75 + seg(t, 0.3, 0.5) * 0.55, gt);
      }

      if (assets && upProg > 0.02 && upProg < 0.99) {
        drawEnergyComet(assets.meta.upper_path, upProg, cachedMr, Math.sin(upProg * Math.PI));
      }
      if (assets && loProg > 0.02 && loProg < 0.99) {
        drawEnergyComet(assets.meta.lower_path, loProg, cachedMr, Math.sin(loProg * Math.PI));
      }

      for (let i = nodeBlooms.length - 1; i >= 0; i--) {
        const nb = nodeBlooms[i];
        nb.age += dt;
        if (nb.age < 0) continue;
        if (nb.age >= nb.duration) {
          nodeBlooms.splice(i, 1);
          continue;
        }
        const u = nb.age / nb.duration;
        const px = cachedMr.left + cachedMr.width * nb.nx;
        const py = cachedMr.top + cachedMr.height * nb.ny;
        const r = 3 + nb.rEnd * (1 - Math.pow(1 - u, 5));
        const a = (1 - u) * (1 - u) * 0.62;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 212, 218, ${a.toFixed(3)})`;
        ctx.lineWidth = 1.35 * (1 - u * 0.4);
        ctx.stroke();

        if (u < 0.35) {
          const fa = (1 - u / 0.35) * 0.85;
          const fg = ctx.createRadialGradient(px, py, 0, px, py, 10);
          fg.addColorStop(0, `rgba(255, 255, 255, ${fa.toFixed(3)})`);
          fg.addColorStop(0.5, `rgba(92, 234, 240, ${(fa * 0.6).toFixed(3)})`);
          fg.addColorStop(1, 'rgba(43, 196, 203, 0)');
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.arc(px, py, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.age += dt;
        if (sp.age >= sp.life) {
          sparks.splice(i, 1);
          continue;
        }
        const u = sp.age / sp.life;
        sp.vx *= Math.pow(0.18, dt);
        sp.vy = sp.vy * Math.pow(0.18, dt) - 8 * dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        const a = Math.sin(u * Math.PI) * 0.68;
        ctx.fillStyle =
          sp.colorMode === 'mixed' && i % 2 === 1
            ? `rgba(240, 185, 65, ${a.toFixed(3)})`
            : `rgba(68, 214, 220, ${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size * (1 - u * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }

      if (t >= READY_FOR_REVEAL_SEC) {
        signalReady();
      }

      if (!exitTriggered && t >= EXIT_START_SEC) {
        exitTriggered = true;
        signalReady();
        setIsExiting(true);
        // Freeze final forged frame cleanly on GPU so 550ms opacity fade runs at 0ms CPU overhead
        if (exitTimerRef.current !== null) {
          window.clearTimeout(exitTimerRef.current);
        }
        exitTimerRef.current = window.setTimeout(() => {
          if (!disposed && !completedRef.current) {
            completedRef.current = true;
            onCompleteRef.current();
          }
        }, Math.round((EXIT_DONE_SEC - EXIT_START_SEC) * 1000) + 10);
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerSkip();
      }
    };

    window.addEventListener('resize', resize);
    window.addEventListener('keydown', handleKeyDown);
    shell.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = window.requestAnimationFrame(tick);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      shell.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={shellRef}
      data-testid="synapes-intro-overlay"
      data-variant={variant}
      className="fixed inset-0 z-[100] overflow-hidden select-none"
      style={{
        background: 'radial-gradient(circle at 50% 42%, #FFFFFF 0%, #F4F6FA 62%, #EAEEF4 100%)',
        color: '#18181B',
        perspective: '900px',
        contain: 'strict',
        isolation: 'isolate',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale3d(1.015, 1.015, 1)' : 'scale3d(1, 1, 1)',
        willChange: 'opacity, transform',
        transition:
          'opacity 550ms cubic-bezier(0.22, 1, 0.36, 1), transform 550ms cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: isExiting ? 'none' : 'auto',
      }}
    >
      {/* Top Rainbow Progress Rail (GPU scaleX compositing) */}
      <div
        ref={progressRailRef}
        className="absolute top-0 left-0 right-0 h-[2px] z-[12] transition-opacity duration-700"
      >
        <div
          ref={progressFillRef}
          className="w-full h-full"
          style={{
            transform: 'scaleX(0)',
            transformOrigin: 'left center',
            willChange: 'transform',
            background:
              'linear-gradient(90deg, #38DDF0 0%, #5B8BFF 28%, #B16DFF 54%, #F26A9B 78%, #F7C254 100%)',
          }}
        />
      </div>

      {/* Full-Stage FX Canvas (ElevenLabs Orb + Silk Wave + Chromatic Ripples + Comets) */}
      <canvas
        ref={fxCanvasRef}
        onClick={(e) => {
          triggerResonanceRef.current?.(e.clientX, e.clientY, false);
        }}
        className="absolute inset-0 w-full h-full cursor-pointer z-[1]"
      />

      {/* Centered Geodesic Forging Logo Stage */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-[5]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          ref={markHolderRef}
          onClick={(e) => {
            e.stopPropagation();
            triggerResonanceRef.current?.(0, 0, true);
          }}
          className="relative pointer-events-auto cursor-pointer"
          style={{
            width: `${HOLDER_W}px`,
            height: `${HOLDER_H}px`,
            willChange: 'transform',
            transformStyle: 'preserve-3d',
          }}
        >
          <canvas
            ref={markCanvasRef}
            width={MW}
            height={MH}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          <img
            ref={playLayerRef}
            alt="Synapes Play Core"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{
              opacity: 0,
              willChange: 'transform, opacity',
            }}
          />
        </div>
      </div>
    </div>
  );
};
