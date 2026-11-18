import rough from 'roughjs';
import gsap from 'gsap';

/**
 * Thực thi thực tế thư viện GitHub `rough-stuff/rough` (roughjs) + `greensock/GSAP`.
 * Tạo phong cách Vẽ Tranh Giấy Thủ Công (Hand-Drawn Ink Sketch & Layered Cut-Paper Diorama)
 * với 4 cảnh minh họa thủ công khác biệt (Bóng đèn ý tưởng, Chip NPU, Tên lửa cắt giấy, Biểu đồ tăng trưởng),
 * phông chữ tiếng Việt thanh lịch và nét vẽ diễn họa mượt theo tiến trình phân cảnh.
 */

let paperGrainPattern: CanvasPattern | null = null;
let staticBackdropCache: { key: string; canvas: HTMLCanvasElement } | null = null;
let frameCache: { key: string; canvas: HTMLCanvasElement } | null = null;

function getPaperGrainPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (paperGrainPattern) return paperGrainPattern;
  if (typeof document === 'undefined') return null;

  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const tctx = tile.getContext('2d');
  if (!tctx) return null;

  tctx.fillStyle = '#f4ede0';
  tctx.fillRect(0, 0, 160, 160);

  for (let i = 0; i < 420; i++) {
    const x = (Math.sin(i * 19.37) * 0.5 + 0.5) * 160;
    const y = (Math.cos(i * 43.13) * 0.5 + 0.5) * 160;
    const len = 1.5 + (i % 4);
    tctx.strokeStyle = i % 3 === 0 ? 'rgba(139, 108, 72, 0.08)' : 'rgba(255, 255, 255, 0.35)';
    tctx.lineWidth = 0.7;
    tctx.beginPath();
    tctx.moveTo(x, y);
    tctx.lineTo(x + Math.cos(i) * len, y + Math.sin(i) * len);
    tctx.stroke();
  }

  paperGrainPattern = ctx.createPattern(tile, 'repeat');
  return paperGrainPattern;
}

export function renderPaperArtStageToCanvas(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  options: {
    clockSec: number;
    progress: number;
    sceneIdx: number;
    totalScenes: number;
    headline: string;
    voiceover: string;
    domain: string;
    subject: string;
  }
): void {
  const { clockSec, progress, sceneIdx, totalScenes, headline, subject } = options;

  // Offscreen cache quantized to 16 steps/scene -> tốc độ export WebM > 25fps mượt mà không drop frame
  const stepBucket = Math.min(18, Math.max(0, Math.floor(progress * 18)));
  const animClock = Number((Math.floor(clockSec * 10) / 10).toFixed(1));
  const frameKey = `${W}x${H}|${sceneIdx}|${stepBucket}|${headline}|${subject}`;

  if (typeof document !== 'undefined') {
    if (frameCache && frameCache.key === frameKey) {
      ctx.drawImage(frameCache.canvas, 0, 0, W, H);
      return;
    }

    const workCanvas =
      frameCache && frameCache.canvas.width === W && frameCache.canvas.height === H
        ? frameCache.canvas
        : document.createElement('canvas');
    if (workCanvas.width !== W || workCanvas.height !== H) {
      workCanvas.width = W;
      workCanvas.height = H;
    }
    const wCtx = workCanvas.getContext('2d');
    if (wCtx) {
      renderPaperArtFrameUncached(wCtx, W, H, {
        ...options,
        clockSec: animClock,
        progress: stepBucket / 18,
      });
      frameCache = { key: frameKey, canvas: workCanvas };
      ctx.drawImage(workCanvas, 0, 0, W, H);
      return;
    }
  }

  renderPaperArtFrameUncached(ctx, W, H, options);
}

function renderPaperArtFrameUncached(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  options: {
    clockSec: number;
    progress: number;
    sceneIdx: number;
    totalScenes: number;
    headline: string;
    voiceover: string;
    domain: string;
    subject: string;
  }
): void {
  const { clockSec, progress, sceneIdx, totalScenes, headline, subject } = options;

  const easeOut = gsap.parseEase('power3.out');
  const easeBack = gsap.parseEase('back.out(1.5)');
  const appearT = easeOut(Math.min(1, progress * 2.2));
  const springPop = easeBack(Math.min(1, Math.max(0, (progress - 0.06) * 2.4)));

  ctx.save();

  const staticKey = `${W}x${H}|${sceneIdx}`;
  let drewStatic = false;
  if (typeof document !== 'undefined') {
    if (staticBackdropCache && staticBackdropCache.key === staticKey) {
      ctx.drawImage(staticBackdropCache.canvas, 0, 0, W, H);
      drewStatic = true;
    } else {
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = W;
      bgCanvas.height = H;
      const bgCtx = bgCanvas.getContext('2d');
      if (bgCtx) {
        const grain = getPaperGrainPattern(bgCtx);
        bgCtx.fillStyle = grain || '#f4ede0';
        bgCtx.fillRect(0, 0, W, H);

        bgCtx.fillStyle = 'rgba(120, 102, 82, 0.14)';
        const gridStep = Math.round(W * 0.032);
        for (let gx = gridStep; gx < W; gx += gridStep) {
          for (let gy = gridStep; gy < H; gy += gridStep) {
            bgCtx.beginPath();
            bgCtx.arc(gx, gy, 1.1, 0, Math.PI * 2);
            bgCtx.fill();
          }
        }

        const edgeGrad = bgCtx.createRadialGradient(W * 0.5, H * 0.5, W * 0.25, W * 0.5, H * 0.5, W * 0.72);
        edgeGrad.addColorStop(0, 'rgba(255, 252, 245, 0.18)');
        edgeGrad.addColorStop(1, 'rgba(180, 152, 114, 0.34)');
        bgCtx.fillStyle = edgeGrad;
        bgCtx.fillRect(0, 0, W, H);

        const hillPalettes = [
          ['#d8cbb4', '#c5d6c0'],
          ['#e3d5ca', '#cbd5e1'],
          ['#dbe7e4', '#bcd4e6'],
          ['#ede0d4', '#e6ccb2'],
        ];
        const pal = hillPalettes[sceneIdx % hillPalettes.length];
        for (let layer = 0; layer < 2; layer++) {
          const baseY = H * (0.76 + layer * 0.08);
          bgCtx.save();
          bgCtx.shadowColor = 'rgba(42, 30, 18, 0.22)';
          bgCtx.shadowBlur = 18;
          bgCtx.shadowOffsetY = -4;
          bgCtx.fillStyle = pal[layer];
          bgCtx.beginPath();
          bgCtx.moveTo(-20, H + 20);
          for (let x = -20; x <= W + 40; x += W * 0.12) {
            const wave = Math.sin((x / W) * 4.2 + sceneIdx + layer * 1.7) * H * 0.045;
            bgCtx.lineTo(x, baseY + wave);
          }
          bgCtx.lineTo(W + 40, H + 20);
          bgCtx.closePath();
          bgCtx.fill();
          bgCtx.restore();
        }
        staticBackdropCache = { key: staticKey, canvas: bgCanvas };
        ctx.drawImage(bgCanvas, 0, 0, W, H);
        drewStatic = true;
      }
    }
  }

  if (!drewStatic) {
    ctx.fillStyle = '#f4ede0';
    ctx.fillRect(0, 0, W, H);
  }

  const rc = rough.canvas(ctx.canvas);
  const seedBase = (sceneIdx + 1) * 1337;

  // 3. Taped Sketchbook Artboard Card
  const isPortrait = W < H;
  const boardW = isPortrait ? W * 0.86 : W * 0.44;
  const boardH = isPortrait ? H * 0.4 : H * 0.56;
  const boardX = isPortrait ? (W - boardW) / 2 : W * 0.5 - W * 0.02;
  const boardY = isPortrait ? H * 0.27 : H * 0.19;

  ctx.save();
  ctx.translate(boardX + boardW / 2, boardY + boardH / 2);
  ctx.scale(0.92 + 0.08 * springPop, 0.92 + 0.08 * springPop);
  ctx.translate(-(boardX + boardW / 2), -(boardY + boardH / 2));

  ctx.fillStyle = 'rgba(65, 45, 25, 0.16)';
  ctx.beginPath();
  ctx.roundRect(boardX + 12, boardY + 14, boardW, boardH, 8);
  ctx.fill();

  ctx.fillStyle = '#fffdf8';
  ctx.beginPath();
  ctx.roundRect(boardX, boardY, boardW, boardH, 8);
  ctx.fill();

  rc.rectangle(boardX + 4, boardY + 4, boardW - 8, boardH - 8, {
    roughness: 1.5,
    stroke: '#292524',
    strokeWidth: 2.2,
    seed: seedBase + 1,
  });

  for (const tapeX of [boardX + boardW * 0.12, boardX + boardW * 0.72]) {
    ctx.save();
    ctx.translate(tapeX, boardY - 6);
    ctx.rotate(tapeX < boardX + boardW * 0.5 ? -0.12 : 0.11);
    ctx.fillStyle = 'rgba(217, 119, 6, 0.35)';
    ctx.fillRect(0, 0, boardW * 0.15, 22);
    ctx.restore();
  }

  // 4. Four Distinct Hand-Drawn Paper-Art Illustrations Across Scenes
  const icx = boardX + boardW * 0.5;
  const icy = boardY + boardH * 0.5;
  const ir = Math.min(boardW, boardH) * 0.34;
  const variant = sceneIdx % 6;

  if (variant === 0) {
    // Scene 0: Hand-Drawn Idea Spark / AI Neural Brain Bulb + Radiating Rays
    rc.circle(icx, icy - ir * 0.08, ir * 1.15 * appearT, {
      roughness: 1.8,
      fill: '#fde68a',
      fillStyle: 'hachure',
      hachureAngle: -35,
      hachureGap: 7,
      stroke: '#1c1917',
      strokeWidth: 2.5,
      seed: seedBase + 101,
    });
    rc.rectangle(icx - ir * 0.24, icy + ir * 0.45, ir * 0.48, ir * 0.28, {
      roughness: 1.4,
      fill: '#94a3b8',
      fillStyle: 'cross-hatch',
      stroke: '#1c1917',
      strokeWidth: 2.2,
      seed: seedBase + 102,
    });
    for (let r = 0; r < 8; r++) {
      const ang = (r * Math.PI) / 4 + clockSec * 0.25;
      const r1 = ir * 0.72;
      const r2 = ir * (0.92 + 0.14 * Math.sin(clockSec * 4 + r));
      rc.line(icx + Math.cos(ang) * r1, icy - ir * 0.08 + Math.sin(ang) * r1, icx + Math.cos(ang) * r2, icy - ir * 0.08 + Math.sin(ang) * r2, {
        roughness: 1.5,
        stroke: '#d97706',
        strokeWidth: 2.5,
        seed: seedBase + 110 + r,
      });
    }
  } else if (variant === 1) {
    // Scene 1: Hand-Drawn Silicon NPU Microchip & Copper Signal Pins
    const dieW = ir * 1.15;
    rc.rectangle(icx - dieW / 2, icy - dieW / 2, dieW, dieW, {
      roughness: 1.7,
      fill: '#fef3c7',
      fillStyle: 'hachure',
      hachureAngle: -41,
      hachureGap: 7,
      stroke: '#1c1917',
      strokeWidth: 2.6,
      seed: seedBase + 201,
    });
    if (appearT > 0.2) {
      const innerW = dieW * 0.56 * Math.min(1, appearT * 1.3);
      rc.rectangle(icx - innerW / 2, icy - innerW / 2, innerW, innerW, {
        roughness: 1.4,
        fill: '#0284c7',
        fillStyle: 'cross-hatch',
        hachureGap: 6,
        stroke: '#0f172a',
        strokeWidth: 2.2,
        seed: seedBase + 202,
      });
    }
    for (let p = 0; p < 4; p++) {
      const offset = ((p - 1.5) / 2) * dieW * 0.52;
      const pinLen = ir * 0.42 * appearT;
      rc.line(icx + offset, icy - dieW / 2, icx + offset, icy - dieW / 2 - pinLen, { roughness: 1.4, stroke: '#b45309', strokeWidth: 2.2, seed: seedBase + 210 + p });
      rc.line(icx + offset, icy + dieW / 2, icx + offset, icy + dieW / 2 + pinLen, { roughness: 1.4, stroke: '#b45309', strokeWidth: 2.2, seed: seedBase + 220 + p });
      rc.line(icx - dieW / 2, icy + offset, icx - dieW / 2 - pinLen, icy + offset, { roughness: 1.4, stroke: '#0369a1', strokeWidth: 2.2, seed: seedBase + 230 + p });
      rc.line(icx + dieW / 2, icy + offset, icx + dieW / 2 + pinLen, icy + offset, { roughness: 1.4, stroke: '#0369a1', strokeWidth: 2.2, seed: seedBase + 240 + p });
    }
    const orbAngle = clockSec * 1.9;
    rc.circle(icx + Math.cos(orbAngle) * ir * 1.04, icy + Math.sin(orbAngle) * ir * 0.74, 24, {
      roughness: 1.4,
      fill: '#ef4444',
      fillStyle: 'zigzag',
      stroke: '#1c1917',
      strokeWidth: 2,
      seed: seedBase + 266,
    });
  } else if (variant === 2) {
    // Scene 2: Cut-Paper Rocket & Origami Cloud Exploration
    const bobY = Math.sin(clockSec * 3.2) * 10;
    const rx = icx;
    const ry = icy - ir * 0.05 + bobY;
    rc.polygon(
      [
        [rx, ry - ir * 0.85],
        [rx + ir * 0.34, ry + ir * 0.25],
        [rx - ir * 0.34, ry + ir * 0.25],
      ],
      { roughness: 1.5, fill: '#ef4444', fillStyle: 'hachure', stroke: '#1c1917', strokeWidth: 2.5, seed: seedBase + 301 }
    );
    rc.circle(rx, ry - ir * 0.16, ir * 0.28, { roughness: 1.4, fill: '#38bdf8', fillStyle: 'solid', stroke: '#1c1917', strokeWidth: 2, seed: seedBase + 302 });
    // Paper clouds flanking left/right
    rc.ellipse(icx - ir * 0.72, icy + ir * 0.45, ir * 0.62, ir * 0.3, { roughness: 1.8, fill: '#e0f2fe', fillStyle: 'hachure', stroke: '#475569', strokeWidth: 1.8, seed: seedBase + 303 });
    rc.ellipse(icx + ir * 0.74, icy - ir * 0.38, ir * 0.54, ir * 0.26, { roughness: 1.8, fill: '#e0f2fe', fillStyle: 'hachure', stroke: '#475569', strokeWidth: 1.8, seed: seedBase + 304 });
  } else if (variant === 3) {
    // Scene 3: Hand-Drawn Ascending Impact Chart & Star Badge
    for (let b = 0; b < 4; b++) {
      const bw = ir * 0.28;
      const bh = ir * (0.36 + b * 0.24) * appearT;
      const bx = icx - ir * 0.72 + b * (bw + 16);
      const by = icy + ir * 0.65 - bh;
      rc.rectangle(bx, by, bw, bh, {
        roughness: 1.5,
        fill: ['#0284c7', '#10b981', '#f59e0b', '#dc2626'][b],
        fillStyle: 'hachure',
        hachureGap: 6,
        stroke: '#1c1917',
        strokeWidth: 2.1,
        seed: seedBase + 400 + b,
      });
    }
    rc.circle(icx + ir * 0.55, icy - ir * 0.48, ir * 0.48 * appearT, {
      roughness: 1.8,
      fill: '#facc15',
      fillStyle: 'cross-hatch',
      stroke: '#92400e',
      strokeWidth: 2.2,
      seed: seedBase + 420,
    });
  } else if (variant === 4) {
    // Scene 4: Hand-Drawn Open Book & Calligraphy Nib Pen
    rc.rectangle(icx - ir * 0.92, icy - ir * 0.42, ir * 0.9, ir * 1.05, {
      roughness: 1.5,
      fill: '#fefce8',
      fillStyle: 'solid',
      stroke: '#1c1917',
      strokeWidth: 2.3,
      seed: seedBase + 501,
    });
    rc.rectangle(icx, icy - ir * 0.42, ir * 0.92, ir * 1.05, {
      roughness: 1.5,
      fill: '#fffbeb',
      fillStyle: 'solid',
      stroke: '#1c1917',
      strokeWidth: 2.3,
      seed: seedBase + 502,
    });
    for (let ln = 0; ln < 4; ln++) {
      const ly = icy - ir * 0.18 + ln * ir * 0.22;
      rc.line(icx - ir * 0.76, ly, icx - ir * 0.16 * (1.1 - appearT * 0.1), ly, {
        roughness: 1.3,
        stroke: '#57534e',
        strokeWidth: 2,
        seed: seedBase + 510 + ln,
      });
      rc.line(icx + ir * 0.16, ly, icx + ir * 0.76 * appearT, ly, {
        roughness: 1.3,
        stroke: '#0369a1',
        strokeWidth: 2,
        seed: seedBase + 520 + ln,
      });
    }
    rc.polygon(
      [
        [icx + ir * 0.48, icy - ir * 0.88],
        [icx + ir * 0.68, icy - ir * 0.56],
        [icx + ir * 0.32, icy - ir * 0.28],
      ],
      { roughness: 1.4, fill: '#b45309', fillStyle: 'hachure', stroke: '#1c1917', strokeWidth: 2.2, seed: seedBase + 530 }
    );
  } else {
    // Scene 5: Hand-Drawn Global AI Orbit & Connected Knowledge Nodes
    rc.circle(icx, icy, ir * 1.12, {
      roughness: 1.7,
      fill: '#dbeafe',
      fillStyle: 'hachure',
      hachureGap: 7,
      stroke: '#1e3a8a',
      strokeWidth: 2.5,
      seed: seedBase + 601,
    });
    rc.ellipse(icx, icy, ir * 1.55, ir * 0.48, {
      roughness: 1.5,
      stroke: '#b91c1c',
      strokeWidth: 2.2,
      seed: seedBase + 602,
    });
    for (let n = 0; n < 3; n++) {
      const a = (n * Math.PI * 2) / 3 + appearT * 1.4;
      rc.circle(icx + Math.cos(a) * ir * 0.78, icy + Math.sin(a) * ir * 0.24, 24, {
        roughness: 1.3,
        fill: ['#f59e0b', '#10b981', '#dc2626'][n],
        fillStyle: 'solid',
        stroke: '#1c1917',
        strokeWidth: 2,
        seed: seedBase + 610 + n,
      });
    }
  }
  ctx.restore();

  // 5. Left Editorial Sketch Note Card (Crisp Times New Roman Vietnamese Typography)
  const noteX = W * 0.055;
  const noteY = isPortrait ? H * 0.09 : H * 0.23;
  const noteW = isPortrait ? W * 0.88 : W * 0.39;

  ctx.save();
  ctx.globalAlpha = appearT;
  const stepLabel = `CHƯƠNG 0${sceneIdx + 1} / 0${totalScenes}`;

  rc.rectangle(noteX, noteY, 168, 34, {
    roughness: 1.4,
    fill: '#b91c1c',
    fillStyle: 'solid',
    stroke: '#1c1917',
    strokeWidth: 1.8,
    seed: seedBase + 91,
  });

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px "Times New Roman", "Segoe UI", serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(stepLabel, noteX + 16, noteY + 17);

  const cleanHead = headline.replace(/^\d+\.\s*/, '').trim();
  ctx.fillStyle = '#1c1917';
  const headFontSize = isPortrait ? Math.round(W * 0.042) : Math.round(W * 0.024);
  ctx.font = `bold ${headFontSize}px "Times New Roman", "Segoe UI", serif`;

  const words = cleanHead.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > noteW - 10 && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);

  lines.slice(0, 3).forEach((ln, idx) => {
    ctx.fillText(ln, noteX, noteY + 72 + idx * (headFontSize * 1.28));
  });

  const underlineY = noteY + 72 + Math.min(3, lines.length) * (headFontSize * 1.28) + 8;
  rc.line(noteX, underlineY, noteX + noteW * 0.65 * appearT, underlineY, {
    roughness: 2.0,
    stroke: '#b45309',
    strokeWidth: 3,
    seed: seedBase + 99,
  });

  ctx.fillStyle = '#57534e';
  ctx.font = `italic ${Math.round(headFontSize * 0.52)}px "Times New Roman", "Segoe UI", serif`;
  const subTxt = `Rough.js Paper-Cut Studio • ${subject}`;
  ctx.fillText(subTxt.length > 52 ? subTxt.slice(0, 49) + '...' : subTxt, noteX, underlineY + 26, noteW);

  ctx.restore();
  ctx.restore();
}
