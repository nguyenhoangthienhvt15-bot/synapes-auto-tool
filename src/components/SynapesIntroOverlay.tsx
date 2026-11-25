import React, { useEffect, useRef, useState } from 'react';

export interface SynapesIntroOverlayProps {
  variant: 'entry' | 'login';
  userCode?: string;
  userName?: string;
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
    word_light?: string;
    word_dark?: string;
    tagline?: string;
  };
  meta: {
    mark_size?: [number, number];
    play_center_norm: [number, number];
    nodes: ForgeNode[];
    upper_path: Array<[number, number]>;
    lower_path: Array<[number, number]>;
  };
}

interface DecodedForgeAssets {
  meta: ForgeData['meta'];
  markPlaySrc: string;
  upPixels: Uint8ClampedArray;
  loPixels: Uint8ClampedArray;
  upGeo: Float32Array;
  loGeo: Float32Array;
  upInkIdx: Int32Array;
  loInkIdx: Int32Array;
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
const REVEAL_TOTAL = 2.65;
const EXIT_START_SEC = 2.85;
const EXIT_DONE_SEC = 3.40;
const DEFAULT_PLAY_CENTER: [number, number] = [0.4856, 0.4869];

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5);
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

function loadImagePixels(src: string): Promise<Uint8ClampedArray | null> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas');
      c.width = MW;
      c.height = MH;
      const cx = c.getContext('2d');
      if (!cx) {
        resolve(null);
        return;
      }
      cx.drawImage(im, 0, 0, MW, MH);
      resolve(cx.getImageData(0, 0, MW, MH).data);
    };
    im.onerror = () => resolve(null);
    im.src = src;
  });
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
      const [uP, lP, uG, lG] = await Promise.all([
        loadImagePixels(data.pack.mark_upper),
        loadImagePixels(data.pack.mark_lower),
        loadImagePixels(data.pack.geo_upper),
        loadImagePixels(data.pack.geo_lower),
      ]);
      if (!uP || !lP || !uG || !lG) return null;

      const upGeo = new Float32Array(MW * MH);
      const loGeo = new Float32Array(MW * MH);
      const uList: number[] = [];
      const lList: number[] = [];

      for (let i = 0; i < MW * MH; i++) {
        upGeo[i] = uG[i * 4] / 255.0;
        loGeo[i] = lG[i * 4] / 255.0;
        if (uP[i * 4 + 3] > 6) uList.push(i);
        if (lP[i * 4 + 3] > 6) lList.push(i);
      }

      return {
        meta: data.meta,
        markPlaySrc: data.pack.mark_play,
        upPixels: uP,
        loPixels: lP,
        upGeo,
        loGeo,
        upInkIdx: new Int32Array(uList),
        loInkIdx: new Int32Array(lList),
      };
    })
    .catch(() => {
      cachedForgeAssetsPromise = null;
      return null;
    });

  return cachedForgeAssetsPromise;
}

// Pre-warm cache immediately upon module load so F5 / post-login reveal starts instantaneously.
if (typeof window !== 'undefined') {
  void loadSynapesForgeAssets();
}

export const SynapesIntroOverlay: React.FC<SynapesIntroOverlayProps> = ({
  variant,
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

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const completedRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);
  const triggerResonanceRef = useRef<((x: number, y: number, fromMark: boolean) => void) | null>(null);

  const triggerSkip = () => {
    if (completedRef.current) return;
    setIsExiting(true);
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
    }
    exitTimerRef.current = window.setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
    }, 220);
  };

  useEffect(() => {
    const shell = shellRef.current;
    const fxCanvas = fxCanvasRef.current;
    const markHolder = markHolderRef.current;
    const markCanvas = markCanvasRef.current;
    const playLayer = playLayerRef.current;
    if (!shell || !fxCanvas || !markHolder || !markCanvas || !playLayer) return;

    const ctx = fxCanvas.getContext('2d');
    const mctx = markCanvas.getContext('2d');
    if (!ctx || !mctx) {
      onCompleteRef.current();
      return;
    }

    let disposed = false;
    let rafId = 0;
    let assets: DecodedForgeAssets | null = null;
    let playNX = DEFAULT_PLAY_CENTER[0];
    let playNY = DEFAULT_PLAY_CENTER[1];
    playLayer.style.transformOrigin = `${(playNX * 100).toFixed(2)}% ${(playNY * 100).toFixed(2)}%`;

    const outImgData = mctx.createImageData(MW, MH);
    const outBuf = outImgData.data;

    void loadSynapesForgeAssets().then((loaded) => {
      if (disposed || !loaded) return;
      assets = loaded;
      playNX = loaded.meta.play_center_norm[0] ?? DEFAULT_PLAY_CENTER[0];
      playNY = loaded.meta.play_center_norm[1] ?? DEFAULT_PLAY_CENTER[1];
      playLayer.style.transformOrigin = `${(playNX * 100).toFixed(2)}% ${(playNY * 100).toFixed(2)}%`;
      playLayer.src = loaded.markPlaySrc;
    });

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
      outBuf.fill(0);
      const feather = 0.085;

      const paintPart = (
        pixels: Uint8ClampedArray,
        geo: Float32Array,
        inkIdx: Int32Array,
        prog: number,
        hasPulse: boolean
      ) => {
        if (prog <= 0.002) return;
        const isForging = prog < 0.998;
        for (let k = 0; k < inkIdx.length; k++) {
          const idx = inkIdx[k];
          const g = geo[idx];
          let mask = 1.0;
          let boost = 0.0;

          if (isForging) {
            const m = (prog * (1.0 + feather) - g) / feather;
            if (m <= 0.0) continue;
            if (m < 1.0) mask = m * m * (3.0 - 2.0 * m);
            const dg = (g - prog) / 0.055;
            boost += Math.exp(-dg * dg) * 1.15;
          }

          if (hasPulse && pulseAmp > 0.01) {
            const dp = (g - pulseU) / 0.075;
            boost += Math.exp(-dp * dp) * pulseAmp * 0.72;
          }

          let sr = 0.0;
          let sg = 0.0;
          let sb = 0.0;
          if (sheenAmp > 0.005) {
            const x = idx % MW;
            const y = (idx / MW) | 0;
            const diag = (x / MW) * 0.8 + (y / MH) * 0.4;
            const d0 = (diag - sheenCenter) / 0.105;
            const dR = (diag - (sheenCenter + 0.055)) / 0.11;
            const dB = (diag - (sheenCenter - 0.055)) / 0.11;
            const core = Math.exp(-d0 * d0) * sheenAmp;
            const edgeR = Math.exp(-dR * dR) * sheenAmp * 0.38;
            const edgeB = Math.exp(-dB * dB) * sheenAmp * 0.38;
            sr = core * 180 + edgeR * 170;
            sg = core * 195 + (edgeR + edgeB) * 45;
            sb = core * 205 + edgeB * 185;
          }

          const p4 = idx * 4;
          const r = pixels[p4] + boost * 135 + sr;
          const gr = pixels[p4 + 1] + boost * 215 + sg;
          const b = pixels[p4 + 2] + boost * 230 + sb;
          const a = pixels[p4 + 3] * mask;

          outBuf[p4] = r > 255 ? 255 : r;
          outBuf[p4 + 1] = gr > 255 ? 255 : gr;
          outBuf[p4 + 2] = b > 255 ? 255 : b;
          outBuf[p4 + 3] = a > 255 ? 255 : a;
        }
      };

      paintPart(assets.upPixels, assets.upGeo, assets.upInkIdx, upProg, pulseWhich === 0 || pulseWhich === 2);
      paintPart(assets.loPixels, assets.loGeo, assets.loInkIdx, loProg, pulseWhich === 1 || pulseWhich === 2);
      mctx.putImageData(outImgData, 0, 0);
    };

    let cw = window.innerWidth || 1280;
    let ch = window.innerHeight || 720;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let mouseX = cw * 0.5;
    let mouseY = ch * 0.45;
    let smX = mouseX;
    let smY = mouseY;

    const resize = () => {
      const r = shell.getBoundingClientRect();
      cw = Math.max(300, r.width || window.innerWidth);
      ch = Math.max(300, r.height || window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      fxCanvas.width = Math.round(cw * dpr);
      fxCanvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const getPlayOrigin = () => {
      const sr = shell.getBoundingClientRect();
      const mr = markHolder.getBoundingClientRect();
      return {
        x: mr.left - sr.left + mr.width * playNX,
        y: mr.top - sr.top + mr.height * playNY,
        mr: { left: mr.left - sr.left, top: mr.top - sr.top, width: mr.width, height: mr.height },
      };
    };

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

      if (voiceEnergy > 0.02) {
        const petals = 56;
        ctx.beginPath();
        for (let i = 0; i <= petals; i++) {
          const th = (i / petals) * Math.PI * 2;
          const spec =
            Math.sin(th * 3 + gt * 3.8) * 0.45 +
            Math.sin(th * 5 - gt * 5.2) * 0.35 +
            Math.sin(th * 8 + gt * 2.6) * 0.2;
          const rr = radius * (1.1 + (0.14 + Math.abs(spec) * 0.24) * voiceEnergy);
          const px = ox + Math.cos(th) * rr;
          const py = oy + Math.sin(th) * rr;
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

      [
        { rot: -0.35 + gt * 0.38, rx: radius * 1.48, ry: radius * 0.54, a: 0.36, col: '#31C6CE' },
        { rot: 0.55 - gt * 0.31, rx: radius * 1.66, ry: radius * 0.62, a: 0.24, col: '#E8A845' },
      ].forEach((orb) => {
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
        const bx = Math.cos(ba) * orb.rx;
        const by = Math.sin(ba) * orb.ry;
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = opacity * 0.85;
        ctx.beginPath();
        ctx.arc(bx, by, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

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

      const lobes = [
        { ang: gt * 1.7, dist: 0.36, r: 0.85, c0: 'rgba(130, 245, 250, 0.85)', c1: 'rgba(43, 196, 203, 0)' },
        { ang: -gt * 1.35 + 2.1, dist: 0.42, r: 0.82, c0: 'rgba(15, 76, 134, 0.88)', c1: 'rgba(15, 76, 134, 0)' },
        { ang: gt * 1.1 + 4.0, dist: 0.44, r: 0.72, c0: 'rgba(244, 192, 82, 0.62)', c1: 'rgba(232, 114, 75, 0)' },
        { ang: -gt * 1.9 + 0.8, dist: 0.38, r: 0.62, c0: 'rgba(255, 255, 255, 0.78)', c1: 'rgba(255, 255, 255, 0)' },
      ];
      lobes.forEach((lb) => {
        const lx = ox + Math.cos(lb.ang) * radius * lb.dist;
        const ly = oy + Math.sin(lb.ang) * radius * lb.dist;
        const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, radius * lb.r);
        g.addColorStop(0, lb.c0);
        g.addColorStop(1, lb.c1);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(lx, ly, radius * lb.r, 0, Math.PI * 2);
        ctx.fill();
      });

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

      ctx.save();
      const bandShift = Math.sin(gt * 0.55) * 0.12;
      const auraG = ctx.createLinearGradient(leftX, oy - 36, leftX + span, oy + 36);
      const ba = 0.13 * Math.min(1.15, energy + 0.35);
      auraG.addColorStop(0.0, 'rgba(56, 221, 240, 0)');
      auraG.addColorStop(clamp01(0.22 + bandShift * 0.5), `rgba(56, 221, 240, ${(ba * 0.95).toFixed(3)})`);
      auraG.addColorStop(clamp01(0.42 + bandShift * 0.4), `rgba(98, 134, 255, ${(ba * 0.85).toFixed(3)})`);
      auraG.addColorStop(clamp01(0.58 + bandShift * 0.4), `rgba(178, 108, 255, ${(ba * 0.78).toFixed(3)})`);
      auraG.addColorStop(clamp01(0.74 + bandShift * 0.3), `rgba(244, 108, 152, ${(ba * 0.82).toFixed(3)})`);
      auraG.addColorStop(clamp01(0.86 + bandShift * 0.2), `rgba(247, 194, 84, ${(ba * 0.72).toFixed(3)})`);
      auraG.addColorStop(1.0, 'rgba(247, 194, 84, 0)');
      ctx.filter = 'blur(26px)';
      ctx.fillStyle = auraG;
      ctx.beginPath();
      ctx.ellipse(ox, oy, span * 0.44, 34 + energy * 18, Math.sin(gt * 0.35) * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = 'none';
      ctx.restore();

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

      const layers: Array<{
        amp: number;
        freq: number;
        spd: number;
        ph: number;
        w: number;
        a: number;
        fillA: number;
        rgbMode: boolean;
        rgb?: [number, number, number];
      }> = [
        { amp: 24, freq: 0.0115, spd: 1.8, ph: 0.0, w: 1.45, a: 0.46, fillA: 0.068, rgbMode: true },
        { amp: 17, freq: 0.016, spd: -1.4, ph: 1.6, w: 1.15, a: 0.34, fillA: 0.048, rgbMode: true },
        { amp: 12, freq: 0.021, spd: 1.25, ph: 3.1, w: 0.9, a: 0.24, fillA: 0.032, rgbMode: false, rgb: [30, 174, 192] },
        { amp: 8, freq: 0.027, spd: -1.85, ph: 4.5, w: 0.75, a: 0.18, fillA: 0.0, rgbMode: false, rgb: [244, 116, 154] },
      ];

      const steps = 110;
      layers.forEach((L, idx) => {
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

        const upperPts: Array<[number, number]> = [];
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const x = leftX + u * span;
          const bell = Math.pow(Math.sin(u * Math.PI), 1.85);
          const wv =
            Math.sin(x * L.freq + gt * L.spd + L.ph + mPullX * 1.4) * 0.62 +
            Math.sin(x * L.freq * 1.9 - gt * L.spd * 0.8 + idx) * 0.38;
          const y = oy + (wv * L.amp * energy + mShift * 0.22 * (idx - 1.2)) * bell;
          upperPts.push([x, y]);
        }

        if (L.fillA > 0) {
          ctx.beginPath();
          ctx.moveTo(upperPts[0][0], oy);
          for (let i = 0; i <= steps; i++) ctx.lineTo(upperPts[i][0], upperPts[i][1]);
          ctx.lineTo(upperPts[steps][0], oy);
          ctx.closePath();
          ctx.fillStyle =
            L.rgbMode || !L.rgb
              ? makeRgbRibbonGrad(L.fillA * energy)
              : `rgba(${L.rgb[0]},${L.rgb[1]},${L.rgb[2]},${(L.fillA * energy).toFixed(3)})`;
          ctx.fill();
        }

        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          if (i === 0) ctx.moveTo(upperPts[i][0], upperPts[i][1]);
          else ctx.lineTo(upperPts[i][0], upperPts[i][1]);
        }
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = L.w;
        ctx.stroke();
      });
    };

    const drawOrganicRing = (
      cx: number,
      cy: number,
      r: number,
      wb: number,
      ph: number,
      gt: number
    ) => {
      const steps = 104;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const th = (i / steps) * Math.PI * 2;
        const h =
          Math.sin(th * 2 + ph + gt * 1.15) * 0.48 +
          Math.sin(th * 3 - ph * 0.7 - gt * 1.55) * 0.32 +
          Math.sin(th * 5 + ph * 1.3 + gt * 0.9) * 0.2;
        const rr = r + h * wb;
        const px = cx + Math.cos(th) * rr;
        const py = cy + Math.sin(th) * rr;
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
      const steps = 14;
      ctx.save();
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
        ctx.lineCap = 'round';
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

    const tStart = performance.now();
    let lastFrame = tStart;
    let activePulse = { age: -1, duration: 1.25, which: 0 };
    let voiceBurst = 0;
    let manualSheen = -1;
    let exitTriggered = false;
    const cues: Record<string, boolean> = {};

    const triggerResonance = (x: number, y: number, fromMark = false) => {
      const o = fromMark ? getPlayOrigin() : { x, y };
      const md = Math.min(cw, ch);
      spawnRipple(o.x, o.y, {
        duration: 2.0,
        rStart: fromMark ? 14 : 6,
        rEnd: md * (fromMark ? 0.62 : 0.42),
        lineWidth: 1.75,
        alpha: 0.48,
        wobble: 5.5,
        palette: 'teal',
        chromatic: true,
      });
      spawnRipple(o.x, o.y, {
        duration: 2.45,
        rStart: fromMark ? 8 : 3,
        rEnd: md * (fromMark ? 0.76 : 0.52),
        lineWidth: 1.15,
        alpha: 0.28,
        wobble: 7.5,
        palette: 'warm',
        chromatic: false,
      });
      spawnSparks(o.x, o.y, fromMark ? 10 : 6, fromMark ? 'mixed' : 'teal');
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

      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      const t = (now - tStart) / 1000;
      const gt = now / 1000;

      smX += (mouseX - smX) * Math.min(1, dt * 6);
      smY += (mouseY - smY) * Math.min(1, dt * 6);

      const o = getPlayOrigin();
      const md = Math.min(cw, ch);

      if (!cues.orbWake && t >= 0.08) {
        cues.orbWake = true;
        spawnRipple(o.x, o.y, {
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
      if (!cues.shock && t >= 0.80) {
        cues.shock = true;
        spawnRipple(o.x, o.y, {
          duration: 2.4,
          rStart: 18,
          rEnd: md * 0.72,
          lineWidth: 2.1,
          alpha: 0.56,
          wobble: 6.5,
          palette: 'teal',
          chromatic: true,
        });
        spawnRipple(o.x, o.y, {
          duration: 2.7,
          rStart: 12,
          rEnd: md * 0.84,
          lineWidth: 1.3,
          alpha: 0.34,
          wobble: 8.5,
          palette: 'warm',
          chromatic: false,
        });
        spawnSparks(o.x, o.y, 12, 'mixed');
      }
      if (!cues.nInner && t >= 0.96 && assets?.meta.nodes) {
        cues.nInner = true;
        [2, 3].forEach((idx) => {
          const n = assets?.meta.nodes[idx];
          if (!n) return;
          nodeBlooms.push({ nx: n.nx, ny: n.ny, age: 0, duration: 0.85, rEnd: 18 });
          spawnSparks(o.mr.left + o.mr.width * n.nx, o.mr.top + o.mr.height * n.ny, 4, 'teal');
        });
      }
      if (!cues.nMid && t >= 1.36 && assets?.meta.nodes) {
        cues.nMid = true;
        [0, 5].forEach((idx) => {
          const n = assets?.meta.nodes[idx];
          if (!n) return;
          nodeBlooms.push({ nx: n.nx, ny: n.ny, age: 0, duration: 0.92, rEnd: 20 });
          spawnSparks(o.mr.left + o.mr.width * n.nx, o.mr.top + o.mr.height * n.ny, 4, 'teal');
        });
      }
      if (!cues.nOuter && t >= 1.84 && assets?.meta.nodes) {
        cues.nOuter = true;
        [1, 4, 6].forEach((idx, k) => {
          const n = assets?.meta.nodes[idx];
          if (!n) return;
          nodeBlooms.push({ nx: n.nx, ny: n.ny, age: -k * 0.05, duration: 1.0, rEnd: 22 });
          spawnSparks(o.mr.left + o.mr.width * n.nx, o.mr.top + o.mr.height * n.ny, 5, 'mixed');
        });
        spawnRipple(o.x, o.y, {
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

      if (progressFillRef.current) {
        progressFillRef.current.style.width = `${(easeOutCubic(clamp01(t / REVEAL_TOTAL)) * 100).toFixed(1)}%`;
      }

      const idleB = easeInOutSine(seg(t, 2.0, 0.9));
      const floatY = Math.sin((t - 2.0) * 1.3) * 2.4 * idleB;
      const tiltX = ((smY - ch * 0.45) / ch) * -8.5 * idleB;
      const tiltY = ((smX - cw * 0.5) / cw) * 10.5 * idleB;
      markHolder.style.transform = `translate3d(0, ${floatY.toFixed(2)}px, 0) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;

      // Act 1 -> Act 2: ElevenLabs Liquid Voice-Orb Lifecycle
      const orbAppear = easeOutBackSoft(seg(t, 0.0, 0.52));
      const orbCompress = Math.sin(seg(t, 0.62, 0.2) * Math.PI) * 0.16;
      const orbDissolve = easeOutCubic(seg(t, 0.8, 0.48));
      voiceBurst = Math.max(0, voiceBurst - dt * 1.25);

      const orbRadIntro = 34 * orbAppear * (1 - orbCompress) * (1 + orbDissolve * 0.95);
      const orbOpIntro = clamp01(seg(t, 0.0, 0.25)) * (1 - orbDissolve);
      const idleOrbOp = (0.14 + voiceBurst * 0.48) * idleB;
      const idleOrbRad = 26 + voiceBurst * 16 + Math.sin(gt * 2.0) * 2;

      // Act 2A: Play Core Crystallization
      const pP = seg(t, 0.78, 0.56);
      const pAlpha = easeOutCubic(seg(t, 0.78, 0.3));
      const pScale =
        (0.35 + 0.65 * easeOutBackSoft(pP)) * (1 + Math.sin(voiceBurst * Math.PI * 2) * 0.07 * voiceBurst);
      const pBlur = (1 - easeOutQuint(pP)) * 9;
      playLayer.style.opacity = pAlpha.toFixed(3);
      playLayer.style.transform = `scale(${pScale.toFixed(4)})`;
      playLayer.style.filter = pBlur > 0.15 ? `blur(${pBlur.toFixed(2)}px)` : 'none';

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

      // Draw Main Canvas Layers Back-to-Front
      ctx.clearRect(0, 0, cw, ch);

      const waveEnergy =
        easeOutCubic(seg(t, 0.12, 0.65)) * 0.65 +
        Math.sin(seg(t, 0.78, 1.25) * Math.PI) * 0.72 +
        voiceBurst * 0.85;
      const settledEnergy =
        waveEnergy * (1 - 0.58 * easeInOutSine(seg(t, 2.05, 1.1))) + voiceBurst * 0.45;
      drawSilkWaveHorizon(o.x, o.y, settledEnergy, gt);

      if (idleOrbOp > 0.01) {
        drawElevenLabsOrb(o.x, o.y, idleOrbRad, idleOrbOp, 0.35 + voiceBurst * 1.1, gt);
      }

      drawRipples(dt, gt);

      if (orbOpIntro > 0.005) {
        drawElevenLabsOrb(o.x, o.y, orbRadIntro, orbOpIntro, 0.75 + seg(t, 0.3, 0.5) * 0.55, gt);
      }

      if (assets && upProg > 0.02 && upProg < 0.99) {
        drawEnergyComet(assets.meta.upper_path, upProg, o.mr, Math.sin(upProg * Math.PI));
      }
      if (assets && loProg > 0.02 && loProg < 0.99) {
        drawEnergyComet(assets.meta.lower_path, loProg, o.mr, Math.sin(loProg * Math.PI));
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
        const px = o.mr.left + o.mr.width * nb.nx;
        const py = o.mr.top + o.mr.height * nb.ny;
        const r = 3 + nb.rEnd * easeOutQuint(u);
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

      if (!exitTriggered && t >= EXIT_START_SEC) {
        exitTriggered = true;
        setIsExiting(true);
      }

      if (t >= EXIT_DONE_SEC) {
        completedRef.current = true;
        onCompleteRef.current();
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const r = shell.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseY = e.clientY - r.top;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerSkip();
      }
    };

    window.addEventListener('resize', resize);
    window.addEventListener('keydown', handleKeyDown);
    shell.addEventListener('mousemove', handleMouseMove);
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
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.015)' : 'scale(1)',
        transition:
          'opacity 550ms cubic-bezier(0.22, 1, 0.36, 1), transform 550ms cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: isExiting ? 'none' : 'auto',
      }}
    >
      {/* Top Rainbow Progress Rail */}
      <div
        ref={progressRailRef}
        className="absolute top-0 left-0 right-0 h-[2px] z-[12] transition-opacity duration-700"
      >
        <div
          ref={progressFillRef}
          className="h-full"
          style={{
            width: '0%',
            background:
              'linear-gradient(90deg, #38DDF0 0%, #5B8BFF 28%, #B16DFF 54%, #F26A9B 78%, #F7C254 100%)',
          }}
        />
      </div>

      {/* Full-Stage FX Canvas (ElevenLabs Orb + Silk Wave + Chromatic Ripples + Comets) */}
      <canvas
        ref={fxCanvasRef}
        onClick={(e) => {
          const shell = shellRef.current;
          if (!shell || !triggerResonanceRef.current) return;
          const r = shell.getBoundingClientRect();
          triggerResonanceRef.current(e.clientX - r.left, e.clientY - r.top, false);
        }}
        className="absolute inset-0 w-full h-full cursor-pointer z-[1]"
      />

      {/* Centered Geodesic Forging Logo Stage */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-[5]"
        style={{ paddingBottom: '0px', transformStyle: 'preserve-3d' }}
      >
        <div
          ref={markHolderRef}
          onClick={(e) => {
            e.stopPropagation();
            triggerResonanceRef.current?.(0, 0, true);
          }}
          title="Nhấp vào logo để kích hoạt cộng hưởng sóng âm"
          className="relative pointer-events-auto cursor-pointer"
          style={{
            width: '178px',
            height: '222px',
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
              willChange: 'transform, opacity, filter',
            }}
          />
        </div>
      </div>
    </div>
  );
};
