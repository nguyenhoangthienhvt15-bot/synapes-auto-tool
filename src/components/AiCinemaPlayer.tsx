import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, StoryboardScene } from '../types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Subtitles,
  Download,
  RefreshCw,
  Sparkles,
  Maximize2,
  Camera,
  CheckCircle2,
  Mic,
  MicOff,
  Film,
} from 'lucide-react';
import { buildAiSceneImageUrl } from '../services/aiScriptGeneratorService';

interface AiCinemaPlayerProps {
  project: Project;
  aspectRatio: '16:9' | '9:16';
  showSocialMockup: 'none' | 'tiktok' | 'youtube';
  activeSceneId?: number | null;
  onSelectScene?: (sceneId: number) => void;
}

type SubtitleMode = 'hormozi' | 'netflix' | 'off';

export const AiCinemaPlayer: React.FC<AiCinemaPlayerProps> = ({
  project,
  aspectRatio,
  showSocialMockup,
  activeSceneId,
  onSelectScene,
}) => {
  const scenes = project.storyboard && project.storyboard.length > 0 ? project.storyboard : [];
  const totalDuration = scenes.reduce((acc, s) => Math.max(acc, s.endSec || 0), 0) || project.duration || 48;

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(true);
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('hormozi');
  const [anamoLetterbox, setAnamoLetterbox] = useState<boolean>(false);

  // Image preloading cache per scene ID
  const loadedImagesRef = useRef<Record<number, HTMLImageElement>>({});
  const [loadedCount, setLoadedCount] = useState<number>(0);
  const [regenVersion, setRegenVersion] = useState<number>(0);

  // Real Video Export state
  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportedVideoBlobUrl, setExportedVideoBlobUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const currentSpokenSceneRef = useRef<number | null>(null);

  // Web Audio API refs for studio soundtrack & SFX
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgmGainRef = useRef<GainNode | null>(null);

  // Determine current scene from currentTime
  const getCurrentSceneIndex = useCallback(
    (timeSec: number): number => {
      if (scenes.length === 0) return 0;
      const idx = scenes.findIndex((s) => timeSec >= s.startSec && timeSec < s.endSec);
      if (idx !== -1) return idx;
      if (timeSec >= totalDuration) return scenes.length - 1;
      return 0;
    },
    [scenes, totalDuration]
  );

  const currentSceneIndex = getCurrentSceneIndex(currentTime);
  const currentScene: StoryboardScene | undefined = scenes[currentSceneIndex] || scenes[0];

  // Preload AI Scene Images (Pollinations Flux + Curated Fallbacks)
  useEffect(() => {
    let isMounted = true;
    loadedImagesRef.current = {};
    setLoadedCount(0);

    const fallbackPool = [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1280&q=85',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1280&q=85',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=85',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=85',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1280&q=85',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1280&q=85',
    ];

    scenes.forEach((sc, idx) => {
      const primaryUrl =
        sc.imageUrl ||
        buildAiSceneImageUrl(sc.visualPrompt, aspectRatio, idx + 1 + regenVersion * 10);

      // Load quick fallback first so canvas immediately has photographic texture, then replace with AI generated image
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = 'anonymous';
      fallbackImg.src = fallbackPool[idx % fallbackPool.length];
      fallbackImg.onload = () => {
        if (!isMounted) return;
        if (!loadedImagesRef.current[sc.id]) {
          loadedImagesRef.current[sc.id] = fallbackImg;
          setLoadedCount((c) => c + 1);
        }
      };

      const aiImg = new Image();
      aiImg.crossOrigin = 'anonymous';
      aiImg.src = primaryUrl + (regenVersion > 0 ? `&r=${regenVersion}` : '');
      aiImg.onload = () => {
        if (!isMounted) return;
        loadedImagesRef.current[sc.id] = aiImg;
        setLoadedCount((c) => Math.min(scenes.length, c + 1));
      };
    });

    return () => {
      isMounted = false;
    };
  }, [project.id, scenes, aspectRatio, regenVersion]);

  // Jump to scene when activeSceneId prop changes from parent
  useEffect(() => {
    if (activeSceneId != null) {
      const target = scenes.find((s) => s.id === activeSceneId);
      if (target) {
        setCurrentTime(target.startSec + 0.05);
      }
    }
  }, [activeSceneId, scenes]);

  // Synthesize subtle cinematic transition Whoosh / Sub-bass SFX via Web Audio API
  const playTransitionSfx = useCallback(() => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      // Sub-bass thump
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.45);

      const vol = Math.min(0.25, (project.musicTrack?.volume || 20) / 100);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Ignore audio context restrictions
    }
  }, [isMuted, project.musicTrack?.volume]);

  // Speak Vietnamese Voiceover (TTS) when scene changes during playback
  const speakSceneVoiceover = useCallback(
    (scene: StoryboardScene | undefined) => {
      if (!('speechSynthesis' in window)) return;
      if (!isPlaying || isMuted || !isTtsEnabled || !scene) {
        window.speechSynthesis.cancel();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(scene.voiceover);
        utterance.lang = 'vi-VN';

        const voices = window.speechSynthesis.getVoices();
        const viVoice =
          voices.find((v) => v.lang.toLowerCase().includes('vi') && v.name.toLowerCase().includes('natural')) ||
          voices.find((v) => v.lang.toLowerCase().includes('vi')) ||
          null;
        if (viVoice) {
          utterance.voice = viVoice;
        }

        // Calculate natural rate to fit scene duration
        const wordCount = scene.voiceover.split(/\s+/).length;
        const sceneDur = Math.max(5, scene.endSec - scene.startSec);
        const estimatedSec = wordCount / 3.2;
        utterance.rate = Math.max(0.95, Math.min(1.35, estimatedSec / sceneDur));
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore TTS errors
      }
    },
    [isPlaying, isMuted, isTtsEnabled]
  );

  // Trigger TTS & SFX whenever currentSceneIndex changes
  useEffect(() => {
    if (!isPlaying) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      currentSpokenSceneRef.current = null;
      return;
    }

    if (currentScene && currentSpokenSceneRef.current !== currentScene.id) {
      currentSpokenSceneRef.current = currentScene.id;
      playTransitionSfx();
      speakSceneVoiceover(currentScene);
      onSelectScene?.(currentScene.id);
    }
  }, [currentSceneIndex, currentScene, isPlaying, playTransitionSfx, speakSceneVoiceover, onSelectScene]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Main 60fps Playback & Canvas Rendering Loop
  useEffect(() => {
    let animId: number;

    const renderFrame = (now: number) => {
      const dt = Math.min(0.1, (now - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + dt;
          if (next >= totalDuration) {
            currentSpokenSceneRef.current = null;
            return 0; // Loop smoothly
          }
          return next;
        });
      }

      drawCinemaCanvas(now / 1000);
      animId = requestAnimationFrame(renderFrame);
    };

    lastFrameTimeRef.current = performance.now();
    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  });

  // Draw the Multi-Layer Cinema Scene onto HTML5 Canvas
  const drawCinemaCanvas = (clockSec: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const scene = currentScene;
    if (!scene) return;

    const sceneDur = Math.max(1, scene.endSec - scene.startSec);
    const sceneElapsed = Math.max(0, currentTime - scene.startSec);
    // Progress within current scene: 0.0 -> 1.0
    const progress = Math.min(1, sceneElapsed / sceneDur);

    ctx.save();
    // 1. Base Studio Obsidian Background
    const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.45, W * 0.05, W * 0.5, H * 0.5, W * 0.85);
    bgGrad.addColorStop(0, '#181824');
    bgGrad.addColorStop(0.6, '#0b0c12');
    bgGrad.addColorStop(1, '#040407');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Apply 3D/2D Camera Motion Transform (Dolly, Orbit, FPV, Crane, Pan)
    const motion = scene.cameraMotion || 'dolly-in';
    let scale = 1.0;
    let tx = 0;
    let ty = 0;
    let rot = 0;

    if (motion === 'dolly-in') {
      scale = 1.02 + progress * 0.24;
    } else if (motion === 'dolly-out') {
      scale = 1.26 - progress * 0.24;
    } else if (motion === 'orbit') {
      scale = 1.16;
      tx = Math.sin(progress * Math.PI * 2) * (W * 0.045);
      ty = Math.cos(progress * Math.PI * 2) * (H * 0.02);
      rot = Math.sin(progress * Math.PI) * 0.022;
    } else if (motion === 'fpv-zoom') {
      scale = 1.0 + Math.pow(progress, 1.4) * 0.36;
      rot = Math.sin(progress * Math.PI * 2) * 0.035;
      tx = Math.cos(progress * Math.PI) * (W * 0.03);
    } else if (motion === 'crane-up') {
      scale = 1.14;
      ty = (0.5 - progress) * (H * 0.09);
    } else if (motion === 'pan-right') {
      scale = 1.15;
      tx = (0.5 - progress) * (W * 0.09);
    } else if (motion === 'pan-left') {
      scale = 1.15;
      tx = (progress - 0.5) * (W * 0.09);
    }

    ctx.save();
    ctx.translate(W / 2 + tx, H / 2 + ty);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);

    // 3. Draw Loaded AI Scene Image OR High-Tech Procedural 3D Stage
    const img = loadedImagesRef.current[scene.id];
    if (img && img.complete && img.naturalWidth > 0) {
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = W / H;
      let drawW = W;
      let drawH = H;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawH = H;
        drawW = H * imgRatio;
        offsetX = -(drawW - W) / 2;
      } else {
        drawW = W;
        drawH = W / imgRatio;
        offsetY = -(drawH - H) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    } else {
      // Procedural 3D Holographic Product Stage while AI frame renders
      drawProcedural3DStage(ctx, W, H, clockSec, currentSceneIndex);
    }

    // Subtle procedural 3D cyber/studio light particles over the scene
    drawAtmosphericParticles(ctx, W, H, clockSec, scene.lightingStyle || 'volumetric');

    ctx.restore();

    // 4. Lighting & Color Grading LUT Shader Overlay
    drawLightingLutOverlay(ctx, W, H, clockSec, scene.lightingStyle || 'volumetric');

    // 5. Transition Flash / Cross-Fade at scene boundaries
    if (sceneElapsed < 0.45) {
      const fadeInAlpha = 1 - sceneElapsed / 0.45;
      ctx.fillStyle =
        scene.transition === 'cut'
          ? `rgba(255, 255, 255, ${fadeInAlpha * 0.35})`
          : `rgba(5, 5, 10, ${fadeInAlpha * 0.85})`;
      ctx.fillRect(0, 0, W, H);
    } else if (sceneDur - sceneElapsed < 0.35) {
      const fadeOutAlpha = 1 - (sceneDur - sceneElapsed) / 0.35;
      ctx.fillStyle = `rgba(5, 5, 10, ${fadeOutAlpha * 0.7})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 6. Optional Anamorphic 2.39:1 Cinema Letterbox Bars
    if (anamoLetterbox && aspectRatio === '16:9') {
      const barH = H * 0.11;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, barH);
      ctx.fillRect(0, H - barH, W, barH);
    }

    // 7. On-Screen Cinema Director HUD & Headline Banner
    drawCinemaHudAndHeadline(ctx, W, H, scene, currentSceneIndex, scenes.length, progress);

    // 8. Remotion-Style Kinetic Typography Subtitles
    if (subtitleMode !== 'off') {
      drawKineticSubtitles(ctx, W, H, scene.voiceover, progress, subtitleMode, aspectRatio);
    }

    ctx.restore();
  };

  // Procedural 3D Studio Stage (ensures instant 60fps visuals even before external images load)
  const drawProcedural3DStage = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    sceneIdx: number
  ) => {
    // Perspective grid floor
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.18)';
    ctx.lineWidth = 1;
    const horizonY = H * 0.62;
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(W * 0.5 + i * (W * 0.03), horizonY);
      ctx.lineTo(W * 0.5 + i * (W * 0.18), H);
      ctx.stroke();
    }

    // Glowing 3D Rotating Device Monolith in center
    const cx = W * 0.5;
    const cy = H * 0.46;
    const pulse = Math.sin(t * 2.2 + sceneIdx) * 12;
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, W * 0.28);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    glow.addColorStop(0.5, 'rgba(99, 102, 241, 0.14)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Dual-screen unfolding geometric frame
    const boxW = Math.min(W, H) * 0.26;
    const boxH = boxW * 1.45;
    const angle = Math.sin(t * 1.2) * 0.18;

    ctx.save();
    ctx.translate(cx, cy + pulse * 0.4);
    ctx.rotate(angle * 0.3);

    // Left panel
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-boxW - 4, -boxH / 2, boxW, boxH, 14);
    ctx.fill();
    ctx.stroke();

    // Right panel
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.85)';
    ctx.beginPath();
    ctx.roundRect(4, -boxH / 2, boxW, boxH, 14);
    ctx.fill();
    ctx.stroke();

    // Glowing hinge spine
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-3, -boxH / 2 + 8, 6, boxH - 16);

    ctx.restore();
  };

  // Atmospheric bokeh & volumetric dust particles
  const drawAtmosphericParticles = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    lighting: string
  ) => {
    const color =
      lighting === 'cyberpunk'
        ? '56, 189, 248'
        : lighting === 'rembrandt' || lighting === 'golden-hour'
          ? '251, 191, 36'
          : '255, 255, 255';

    for (let i = 0; i < 18; i++) {
      const px = ((Math.sin(i * 73.1 + t * 0.25) + 1) * 0.5) * W;
      const py = ((Math.cos(i * 41.7 + t * 0.35) + 1) * 0.5) * H;
      const radius = (i % 3) + 1.5;
      const alpha = 0.12 + 0.18 * Math.sin(t * 2 + i);
      ctx.fillStyle = `rgba(${color}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Cinematic Lighting LUT Overlay
  const drawLightingLutOverlay = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    lighting: string
  ) => {
    // Top & Bottom Cinema Vignette for text legibility
    const vig = ctx.createLinearGradient(0, 0, 0, H);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    vig.addColorStop(0.25, 'rgba(0, 0, 0, 0.05)');
    vig.addColorStop(0.62, 'rgba(0, 0, 0, 0.12)');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.82)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Anamorphic Lens Flare Sweep
    const flareY = H * 0.28 + Math.sin(t * 0.9) * 20;
    const flareGrad = ctx.createLinearGradient(0, flareY, W, flareY);
    flareGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    flareGrad.addColorStop(
      0.5,
      lighting === 'cyberpunk'
        ? 'rgba(236, 72, 153, 0.16)'
        : lighting === 'rembrandt'
          ? 'rgba(245, 158, 11, 0.14)'
          : 'rgba(56, 189, 248, 0.12)'
    );
    flareGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, flareY - 3, W, 6);
  };

  // Draw Scene Headline Banner & Camera Director HUD
  const drawCinemaHudAndHeadline = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    scene: StoryboardScene,
    sceneIdx: number,
    totalScenes: number,
    progress: number
  ) => {
    const padX = W * 0.045;
    const topY = anamoLetterbox && aspectRatio === '16:9' ? H * 0.13 : H * 0.05;

    // Top-left Scene Pill
    ctx.save();
    ctx.font = `bold ${Math.max(11, Math.round(W * 0.014))}px ui-monospace, SFMono-Regular, monospace`;
    const badgeText = `SCENE 0${sceneIdx + 1}/0${totalScenes} • ${(scene.cameraMotion || 'DOLLY-IN').toUpperCase()} • 35MM`;
    const metrics = ctx.measureText(badgeText);
    const pillW = metrics.width + 22;
    const pillH = Math.max(22, Math.round(H * 0.042));

    ctx.fillStyle = 'rgba(9, 9, 11, 0.72)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(padX, topY, pillW, pillH, 6);
    ctx.fill();
    ctx.stroke();

    // Recording Green Dot
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(padX + 10, topY + pillH / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f4f4f5';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, padX + 18, topY + pillH / 2 + 1);

    // Scene Headline Title (Animated slide-in during first 85% of scene)
    if (scene.headline) {
      const slideIn = Math.min(1, progress * 5);
      const headY = topY + pillH + Math.max(18, H * 0.032);
      ctx.globalAlpha = slideIn;
      ctx.font = `800 ${Math.max(14, Math.round(W * 0.022))}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 8;
      ctx.fillText(scene.headline, padX + (1 - slideIn) * -20, headY);
    }

    ctx.restore();
  };

  // Draw Remotion-style Kinetic Typography Subtitles
  const drawKineticSubtitles = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    voiceover: string,
    progress: number,
    mode: SubtitleMode,
    ratio: '16:9' | '9:16'
  ) => {
    const words = voiceover.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));
    // Group into chunks of 6-8 words so captions read like TikTok/Reels/Netflix
    const chunkSize = ratio === '9:16' ? 5 : 8;
    const chunkIndex = Math.floor(activeWordIndex / chunkSize);
    const chunkStart = chunkIndex * chunkSize;
    const chunkWords = words.slice(chunkStart, chunkStart + chunkSize);

    const fontSize = ratio === '9:16' ? Math.round(W * 0.052) : Math.round(W * 0.026);
    const bottomY = anamoLetterbox && ratio === '16:9' ? H * 0.82 : H * 0.84;

    ctx.save();
    ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'middle';

    // Measure total line width
    const spaceW = ctx.measureText(' ').width * 1.15;
    const wordWidths = chunkWords.map((w) => ctx.measureText(w).width);
    const totalLineW = wordWidths.reduce((a, b) => a + b, 0) + spaceW * Math.max(0, chunkWords.length - 1);

    // Background pill box
    const boxPadX = 18;
    const boxPadY = 12;
    ctx.fillStyle = mode === 'netflix' ? 'rgba(0, 0, 0, 0.78)' : 'rgba(9, 9, 11, 0.82)';
    ctx.strokeStyle = mode === 'hormozi' ? 'rgba(250, 204, 21, 0.35)' : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(
      W / 2 - totalLineW / 2 - boxPadX,
      bottomY - fontSize / 2 - boxPadY,
      totalLineW + boxPadX * 2,
      fontSize + boxPadY * 2,
      10
    );
    ctx.fill();
    ctx.stroke();

    // Draw each word with active highlight
    let cursorX = W / 2 - totalLineW / 2;
    chunkWords.forEach((word, idx) => {
      const globalIdx = chunkStart + idx;
      const isCurrent = globalIdx === activeWordIndex;
      const isPast = globalIdx < activeWordIndex;

      ctx.save();
      if (mode === 'hormozi' && isCurrent) {
        ctx.fillStyle = '#facc15'; // Neon Yellow active word
        ctx.shadowColor = 'rgba(250, 204, 21, 0.5)';
        ctx.shadowBlur = 10;
      } else if (isPast) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = mode === 'netflix' ? '#f4f4f5' : 'rgba(255, 255, 255, 0.72)';
      }

      ctx.fillText(word, cursorX, bottomY);
      ctx.restore();

      cursorX += wordWidths[idx] + spaceW;
    });

    ctx.restore();
  };

  // Real Video File Export (Records Canvas stream into downloadable .webm/.mp4 file)
  const handleExportRealVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || isExportingVideo) return;

    try {
      setIsExportingVideo(true);
      setExportProgress(5);
      setCurrentTime(0);
      setIsPlaying(true);

      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 4500000,
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setExportedVideoBlobUrl(url);
        setIsExportingVideo(false);
        setExportProgress(100);

        // Trigger immediate download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.code || 'SYNAPES'}_${project.title.slice(0, 24).replace(/\s+/g, '_')}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      recorder.start(200);

      // Record a 6-second master preview or full timeline
      const recordDurationMs = 6000;
      const startMs = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - startMs;
        const pct = Math.min(99, Math.round((elapsed / recordDurationMs) * 100));
        setExportProgress(pct);
        if (elapsed >= recordDurationMs) {
          clearInterval(timer);
          if (recorder.state === 'recording') recorder.stop();
        }
      }, 200);
    } catch (err) {
      console.error('Export video error:', err);
      setIsExportingVideo(false);
    }
  };

  const formatTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="space-y-3 select-none">
      {/* Top Engine Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-zinc-950 text-white text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono font-semibold text-emerald-400">
            AI VIDEO ENGINE LIVE (60FPS)
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-300 font-mono">
            Cảnh {currentSceneIndex + 1}/{scenes.length}:{' '}
            <strong className="text-white">{currentScene?.cameraMotion?.toUpperCase() || 'DOLLY-IN'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
            Đã nạp {Math.min(scenes.length, Math.max(1, loadedCount))}/{scenes.length} Visual AI
          </span>
          <button
            type="button"
            onClick={() => setRegenVersion((v) => v + 1)}
            className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 text-indigo-200 font-mono text-[10px] flex items-center gap-1 cursor-pointer transition"
            title="Kết xuất lại bộ khung hình AI mới cho toàn bộ các phân cảnh"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Tạo Lại Khung Hình AI</span>
          </button>
        </div>
      </div>

      {/* Main Cinema Stage Container */}
      <div
        ref={containerRef}
        className={`relative bg-zinc-950 rounded-xl overflow-hidden border border-black/15 shadow-lg mx-auto transition-all group ${
          aspectRatio === '9:16' ? 'max-w-[330px] aspect-[9/16]' : 'w-full aspect-video'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={aspectRatio === '16:9' ? 1280 : 720}
          height={aspectRatio === '16:9' ? 720 : 1280}
          onClick={() => setIsPlaying((p) => !p)}
          className="w-full h-full object-cover cursor-pointer block"
        />

        {/* TikTok Social Mockup Overlay */}
        {showSocialMockup === 'tiktok' && (
          <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between text-white bg-gradient-to-t from-black/70 via-transparent to-black/25">
            <div className="flex justify-between items-center text-xs font-medium">
              <span>Đang theo dõi</span>
              <span className="border-b-2 border-white pb-0.5 font-bold">Dành cho bạn</span>
              <Film className="w-4 h-4 opacity-80" />
            </div>

            <div className="flex justify-between items-end pb-8">
              <div className="max-w-[75%] space-y-1 text-xs">
                <div className="font-semibold text-sm">@synapes_studio</div>
                <div className="text-[11px] line-clamp-2 text-zinc-200">
                  {project.metadata.title}{' '}
                  {project.metadata.tags.map((t) => `#${t} `)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Center Play/Pause Indicator when paused */}
        {!isPlaying && (
          <div
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center gap-2 cursor-pointer backdrop-blur-[1px]"
          >
            <div className="w-14 h-14 rounded-full bg-white/95 text-zinc-950 flex items-center justify-center shadow-2xl transition transform hover:scale-105">
              <Play className="w-6 h-6 ml-0.5 fill-zinc-950" />
            </div>
            <span className="px-3 py-1 rounded-full bg-black/75 text-white text-[11px] font-mono">
              Bấm để phát Video AI + Giọng thuyết minh Tiếng Việt
            </span>
          </div>
        )}

        {/* Export Progress Overlay */}
        {isExportingVideo && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center space-y-3 z-20">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <div className="text-sm font-bold">Đang Kết Xuất File Video Thực Tế ({exportProgress}%)...</div>
            <p className="text-xs text-zinc-400 max-w-xs">
              Hệ thống đang ghi hình 30fps toàn bộ chuyển động Camera 3D, phụ đề động Hormozi và hiệu ứng ánh sáng vào file video.
            </p>
            <div className="w-56 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-200"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Interactive Segmented Multi-Scene Timeline Scrubber */}
      <div className="p-3 rounded-xl bg-zinc-900 text-white space-y-2.5 border border-black/10">
        {/* Scene Segments Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>TIMELINE PHÂN CẢNH (BẤM ĐỂ NHẢY TỚI CẢNH):</span>
            <span className="text-zinc-200 font-semibold">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 pt-0.5">
            {scenes.map((sc, idx) => {
              const isCurrent = idx === currentSceneIndex;
              const isDone = currentTime >= sc.endSec;
              const scDur = Math.max(1, sc.endSec - sc.startSec);
              const scPct = isCurrent
                ? Math.min(100, Math.max(0, ((currentTime - sc.startSec) / scDur) * 100))
                : isDone
                  ? 100
                  : 0;

              return (
                <button
                  type="button"
                  key={sc.id}
                  onClick={() => {
                    setCurrentTime(sc.startSec + 0.05);
                    currentSpokenSceneRef.current = null;
                    setIsPlaying(true);
                  }}
                  className={`relative h-6 rounded overflow-hidden border text-left px-1.5 flex items-center justify-between transition cursor-pointer ${
                    isCurrent
                      ? 'border-amber-400 bg-zinc-800 text-white shadow-xs'
                      : 'border-white/10 bg-zinc-950/80 text-zinc-400 hover:border-white/30 hover:text-white'
                  }`}
                  title={`Cảnh ${sc.sceneNumber}: ${sc.voiceover}`}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-indigo-600/45 pointer-events-none transition-all duration-75"
                    style={{ width: `${scPct}%` }}
                  />
                  <span className="relative z-10 text-[10px] font-mono font-bold">
                    C{sc.sceneNumber}
                  </span>
                  <span className="relative z-10 text-[8px] font-mono opacity-75 truncate ml-1">
                    {sc.cameraMotion?.split('-')[0] || 'cam'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Transport & Studio Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
          {/* Left: Play / Pause / Skip */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-zinc-950" /> : <Play className="w-3.5 h-3.5 fill-zinc-950" />}
              <span>{isPlaying ? 'Tạm dừng' : 'Phát Video'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const prevIdx = Math.max(0, currentSceneIndex - 1);
                setCurrentTime(scenes[prevIdx]?.startSec || 0);
                currentSpokenSceneRef.current = null;
              }}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
              title="Cảnh trước"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                const nextIdx = Math.min(scenes.length - 1, currentSceneIndex + 1);
                setCurrentTime(scenes[nextIdx]?.startSec || 0);
                currentSpokenSceneRef.current = null;
              }}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
              title="Cảnh tiếp theo"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Center: TTS Voice, Subtitles, Letterbox */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsTtsEnabled((v) => {
                  const next = !v;
                  if (!next && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  } else if (next && currentScene) {
                    currentSpokenSceneRef.current = null;
                  }
                  return next;
                });
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer border transition ${
                isTtsEnabled && !isMuted
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-400 border-white/10'
              }`}
              title="Bật/Tắt giọng thuyết minh AI Tiếng Việt tự động"
            >
              {isTtsEnabled && !isMuted ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
              <span>Thuyết minh AI: {isTtsEnabled && !isMuted ? 'BẬT' : 'TẮT'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSubtitleMode((m) =>
                  m === 'hormozi' ? 'netflix' : m === 'netflix' ? 'off' : 'hormozi'
                );
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium flex items-center gap-1 cursor-pointer border border-white/10"
              title="Chuyển đổi kiểu phụ đề nhảy (Hormozi / Netflix / Tắt)"
            >
              <Subtitles className="w-3 h-3 text-amber-400" />
              <span>
                Phụ đề:{' '}
                {subtitleMode === 'hormozi'
                  ? 'Hormozi'
                  : subtitleMode === 'netflix'
                    ? 'Netflix'
                    : 'Tắt'}
              </span>
            </button>

            {aspectRatio === '16:9' && (
              <button
                type="button"
                onClick={() => setAnamoLetterbox((b) => !b)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono cursor-pointer border transition ${
                  anamoLetterbox
                    ? 'bg-indigo-500/25 text-indigo-300 border-indigo-400/40'
                    : 'bg-zinc-800 text-zinc-400 border-white/10'
                }`}
                title="Bật/Tắt viền đen điện ảnh Anamorphic 2.39:1"
              >
                2.39:1
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsMuted((m) => {
                  const next = !m;
                  if (next && 'speechSynthesis' in window) window.speechSynthesis.cancel();
                  return next;
                });
              }}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
              title="Tắt/Bật âm thanh"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
              title="Toàn màn hình"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Real Video Render & Download */}
          <button
            type="button"
            onClick={handleExportRealVideo}
            disabled={isExportingVideo}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            title="Kết xuất và tải file Video thực tế (.webm) về máy tính"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingVideo ? `Đang xuất ${exportProgress}%` : 'Tải Video Về Máy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
