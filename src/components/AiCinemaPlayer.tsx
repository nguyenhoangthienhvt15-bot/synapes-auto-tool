import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, StoryboardScene, ColorGradeLut, VfxOverlayType, SubtitleStyle, SubtitlePosition } from '../types';
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
  Film,
  Scissors,
  Plus,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Keyboard,
  Palette,
  Eye,
  Sliders,
  X,
  FileVideo,
  Globe,
  Search,
} from 'lucide-react';
import { buildAiSceneImageUrl, REAL_IPHONE_18_INTERNET_IMAGES } from '../services/aiScriptGeneratorService';
import {
  StudioAudioSynthesizer,
  ALL_VOICE_PROFILES,
  VIETNAMESE_VOICE_PROFILES,
  ENGLISH_VOICE_PROFILES,
} from '../services/voiceStudioService';

interface AiCinemaPlayerProps {
  project: Project;
  aspectRatio: '16:9' | '9:16';
  showSocialMockup: 'none' | 'tiktok' | 'youtube';
  activeSceneId?: number | null;
  onSelectScene?: (sceneId: number) => void;
  onUpdateProject?: (updated: Project) => void;
  onOpenVoiceStudio?: () => void;
  onOpenShortcutsModal?: () => void;
  onOpenLiveDubbingModal?: () => void;
}

export const AiCinemaPlayer: React.FC<AiCinemaPlayerProps> = ({
  project,
  aspectRatio,
  showSocialMockup,
  activeSceneId,
  onSelectScene,
  onUpdateProject,
  onOpenVoiceStudio,
  onOpenShortcutsModal,
  onOpenLiveDubbingModal,
}) => {
  const scenes = project.storyboard && project.storyboard.length > 0 ? project.storyboard : [];
  const totalDuration = scenes.reduce((acc, s) => Math.max(acc, s.endSec || 0), 0) || project.duration || 48;

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(true);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('hormozi');
  const [subtitlePosition, setSubtitlePosition] = useState<SubtitlePosition>('bottom');
  const [activeLut, setActiveLut] = useState<ColorGradeLut>('teal-orange');
  const [activeVfx, setActiveVfx] = useState<VfxOverlayType>('film-grain');
  const [anamoLetterbox, setAnamoLetterbox] = useState<boolean>(false);

  // File upload ref for custom B-roll media
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Image preloading cache per scene ID
  const loadedImagesRef = useRef<Record<number, HTMLImageElement>>({});
  const [loadedCount, setLoadedCount] = useState<number>(0);
  const [regenVersion, setRegenVersion] = useState<number>(0);

  // Real Video Export state
  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatusText, setExportStatusText] = useState<string>('');
  const [exportScope, setExportScope] = useState<'full' | 'current'>('full');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Walkthrough / Session screen recording state
  const [isRecordingSession, setIsRecordingSession] = useState<boolean>(false);
  const sessionRecorderRef = useRef<MediaRecorder | null>(null);
  const sessionChunksRef = useRef<BlobPart[]>([]);

  // Color Grade & VFX quick modal
  const [showLutPaletteModal, setShowLutPaletteModal] = useState<boolean>(false);

  // Real Internet Image Search modal
  const [showInternetImageModal, setShowInternetImageModal] = useState<boolean>(false);
  const [internetSearchQuery, setInternetSearchQuery] = useState<string>('iPhone 18 Pro Max Apple Flagship');
  const [internetImages, setInternetImages] = useState<
    Array<{ id: string; title: string; url: string; proxyUrl: string; source: string }>
  >([]);
  const [isSearchingInternet, setIsSearchingInternet] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const currentSpokenSceneRef = useRef<number | null>(null);

  // Stable refs for 60fps requestAnimationFrame loop (prevents re-render teardown bug!)
  const currentTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const playbackSpeedRef = useRef<number>(playbackSpeed);
  const totalDurationRef = useRef<number>(totalDuration);
  const drawCinemaCanvasRef = useRef<(clockSec: number, overrideTimeSec?: number) => void>(() => {});

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    totalDurationRef.current = totalDuration;
  }, [totalDuration]);

  const seekToTime = useCallback((newTimeSec: number) => {
    const clamped = Math.max(0, Math.min(totalDurationRef.current || 48, newTimeSec));
    currentTimeRef.current = clamped;
    setCurrentTime(clamped);
    lastFrameTimeRef.current = performance.now();
    drawCinemaCanvasRef.current(performance.now() / 1000, clamped);
  }, []);

  // Web Audio Studio Synthesizer Ref (BGM + Voice Formant + SFX)
  const synthRef = useRef<StudioAudioSynthesizer | null>(null);

  // Initialize Audio Synthesizer once
  useEffect(() => {
    synthRef.current = new StudioAudioSynthesizer();
    return () => {
      synthRef.current?.destroy();
    };
  }, []);

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

  // Preload Real Internet Images via CORS-Safe Proxy
  useEffect(() => {
    let isMounted = true;
    loadedImagesRef.current = {};
    setLoadedCount(0);

    const curatedPool = REAL_IPHONE_18_INTERNET_IMAGES.map(
      (u) => `/api/image-proxy?url=${encodeURIComponent(u)}`
    );

    scenes.forEach((sc, idx) => {
      const rawSource =
        sc.customMediaUrl ||
        sc.imageUrl ||
        buildAiSceneImageUrl(sc.visualPrompt, aspectRatio, idx + 1 + regenVersion * 17);

      // Route external http/https URLs through /api/image-proxy so Canvas is never CORS-tainted
      const mediaSource =
        rawSource.startsWith('http://') || rawSource.startsWith('https://')
          ? `/api/image-proxy?url=${encodeURIComponent(rawSource)}`
          : rawSource;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = mediaSource;

      img.onload = () => {
        if (!isMounted) return;
        loadedImagesRef.current[sc.id] = img;
        setLoadedCount((c) => Math.min(scenes.length, c + 1));
        drawCinemaCanvasRef.current(performance.now() / 1000, currentTimeRef.current);
      };

      img.onerror = () => {
        if (!isMounted) return;
        const fb = new Image();
        fb.crossOrigin = 'anonymous';
        fb.src = curatedPool[idx % curatedPool.length];
        fb.onload = () => {
          if (!isMounted) return;
          loadedImagesRef.current[sc.id] = fb;
          setLoadedCount((c) => Math.min(scenes.length, c + 1));
          drawCinemaCanvasRef.current(performance.now() / 1000, currentTimeRef.current);
        };
      };
    });

    return () => {
      isMounted = false;
    };
  }, [project.id, scenes, aspectRatio, regenVersion]);

  // Jump to scene when activeSceneId changes
  useEffect(() => {
    if (activeSceneId != null) {
      const target = scenes.find((s) => s.id === activeSceneId);
      if (target) {
        seekToTime(target.startSec + 0.08);
      }
    }
  }, [activeSceneId, scenes, seekToTime]);

  // Search Internet Images Handler
  const handleSearchInternetImages = useCallback(async (queryStr: string) => {
    setIsSearchingInternet(true);
    try {
      const res = await fetch(`/api/image-search?q=${encodeURIComponent(queryStr)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.images)) {
          setInternetImages(data.images);
        }
      }
    } catch (err) {
      console.warn('Internet image search fallback:', err);
    } finally {
      setIsSearchingInternet(false);
    }
  }, []);

  useEffect(() => {
    if (showInternetImageModal && internetImages.length === 0) {
      handleSearchInternetImages(internetSearchQuery);
    }
  }, [showInternetImageModal, internetImages.length, internetSearchQuery, handleSearchInternetImages]);

  const handleApplyInternetImageToScene = (proxyUrl: string) => {
    if (!currentScene || !onUpdateProject) return;
    const updatedStoryboard = project.storyboard.map((s) =>
      s.id === currentScene.id ? { ...s, customMediaUrl: proxyUrl, imageUrl: proxyUrl } : s
    );
    onUpdateProject({ ...project, storyboard: updatedStoryboard });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = proxyUrl;
    img.onload = () => {
      loadedImagesRef.current[currentScene.id] = img;
      drawCinemaCanvasRef.current(performance.now() / 1000, currentTimeRef.current);
    };
    synthRef.current?.playSfx('chime');
    setShowInternetImageModal(false);
  };

  // Reference to user custom recorded audio element if currently playing
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Speak Voiceover or Play User Custom Recording
  const speakSceneVoiceover = useCallback(
    (scene: StoryboardScene | undefined) => {
      if (!scene || !isPlaying || isMuted) {
        synthRef.current?.stopSceneVoiceover();
        if (currentAudioElementRef.current) {
          currentAudioElementRef.current.pause();
          currentAudioElementRef.current = null;
        }
        return;
      }

      // If user directly recorded their voice for this scene
      if (scene.customAudioUrl) {
        synthRef.current?.stopSceneVoiceover();
        if (currentAudioElementRef.current) {
          currentAudioElementRef.current.pause();
        }
        const audio = synthRef.current?.playCustomAudioBlob(scene.customAudioUrl, () => {
          currentAudioElementRef.current = null;
        });
        currentAudioElementRef.current = audio || null;
        return;
      }

      // Otherwise play Neural TTS through Web Audio API WSOLA Formant Vocoder
      if (!isTtsEnabled) return;

      const isEnglish = scene.voiceLanguage === 'en';
      const voiceProfile =
        ALL_VOICE_PROFILES.find((v) => v.id === scene.voiceId) ||
        (isEnglish ? ENGLISH_VOICE_PROFILES[0] : VIETNAMESE_VOICE_PROFILES[0]);

      const sceneDur = Math.max(3, scene.endSec - scene.startSec);
      const wordCount = scene.voiceover.split(/\s+/).length;
      const autoRate = Math.max(0.9, Math.min(1.4, wordCount / (sceneDur * 3.0)));

      const rateToUse = scene.voiceSpeed || voiceProfile.rate || autoRate;
      const pitchToUse = scene.voicePitch || voiceProfile.pitch || 1.0;

      synthRef.current?.speakSceneWithNeuralVoice(
        scene.voiceover,
        voiceProfile,
        rateToUse,
        pitchToUse
      );
    },
    [isPlaying, isMuted, isTtsEnabled]
  );

  // Trigger TTS & SFX when current scene changes
  useEffect(() => {
    if (!isPlaying) {
      synthRef.current?.stopSceneVoiceover();
      currentSpokenSceneRef.current = null;
      return;
    }

    if (currentScene && currentSpokenSceneRef.current !== currentScene.id) {
      currentSpokenSceneRef.current = currentScene.id;
      synthRef.current?.playSfx('whoosh');
      speakSceneVoiceover(currentScene);
      onSelectScene?.(currentScene.id);
    }
  }, [currentSceneIndex, currentScene, isPlaying, speakSceneVoiceover, onSelectScene]);

  // Persistent 60fps Playback & Canvas Loop (Never torn down on React state re-renders!)
  useEffect(() => {
    let animId: number;
    lastFrameTimeRef.current = performance.now();

    const renderFrame = (now: number) => {
      const rawDt = Math.max(0, (now - lastFrameTimeRef.current) / 1000);
      const dt = Math.min(0.12, rawDt) * playbackSpeedRef.current;
      lastFrameTimeRef.current = now;

      if (isPlayingRef.current) {
        const dur = totalDurationRef.current || 48;
        let next = currentTimeRef.current + dt;
        if (next >= dur) {
          next = 0;
          currentSpokenSceneRef.current = null;
        }
        currentTimeRef.current = next;
        setCurrentTime(next);
      }

      drawCinemaCanvasRef.current(now / 1000, currentTimeRef.current);
      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Expose deterministic control hook for automated verification & timeline scrubbing
  useEffect(() => {
    (window as any).__SYNAPES_PLAYER = {
      seekTo: (sec: number) => seekToTime(sec),
      setPlaying: (play: boolean) => {
        isPlayingRef.current = play;
        setIsPlaying(play);
      },
      getState: () => ({
        currentTime: currentTimeRef.current,
        totalDuration: totalDurationRef.current,
        currentSceneIndex: getCurrentSceneIndex(currentTimeRef.current),
        loadedImagesCount: Object.keys(loadedImagesRef.current).length,
      }),
    };
  }, [seekToTime, getCurrentSceneIndex]);

  // Hotkey listener (Space, S, Shift+S, Left/Right, J/K/L, M, F, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setIsMuted((m) => !m);
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.code === 'KeyS' && e.shiftKey) {
        e.preventDefault();
        handleSnapshot4K();
      } else if (e.code === 'KeyS' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        handleSplitScene();
      } else if (e.code === 'KeyD' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleDuplicateScene();
      } else if (e.code === 'KeyJ') {
        e.preventDefault();
        seekToTime(Math.max(0, currentTimeRef.current - 3));
      } else if (e.code === 'KeyK') {
        e.preventDefault();
        setIsPlaying(false);
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        seekToTime(Math.min(totalDuration, currentTimeRef.current + 3));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
          jumpScene(-1);
        } else {
          seekToTime(Math.max(0, currentTimeRef.current - 1));
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          jumpScene(1);
        } else {
          seekToTime(Math.min(totalDuration, currentTimeRef.current + 1));
        }
      } else if (e.code === 'KeyR' && !e.ctrlKey) {
        e.preventDefault();
        setShowExportModal(true);
      } else if (e.code === 'KeyV') {
        e.preventDefault();
        onOpenVoiceStudio?.();
      } else if (e.key === '?' || e.code === 'KeyH') {
        e.preventDefault();
        onOpenShortcutsModal?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalDuration, currentSceneIndex, scenes, seekToTime]);

  const jumpScene = (direction: -1 | 1) => {
    const nextIdx = currentSceneIndex + direction;
    if (nextIdx >= 0 && nextIdx < scenes.length) {
      const target = scenes[nextIdx];
      seekToTime(target.startSec + 0.08);
      onSelectScene?.(target.id);
    }
  };

  // NLE Scene Editing Actions: Split, Duplicate, Delete, Move, Upload Custom Media
  const handleSplitScene = () => {
    if (!currentScene || !onUpdateProject) return;
    const splitPoint = Math.round(currentTime * 10) / 10;
    if (splitPoint <= currentScene.startSec + 1.5 || splitPoint >= currentScene.endSec - 1.5) {
      alert('Vui lòng chọn vị trí phân cắt cách điểm đầu hoặc cuối phân cảnh ít nhất 2 giây.');
      return;
    }

    const sceneA: StoryboardScene = {
      ...currentScene,
      endSec: splitPoint,
      timeRange: `${formatTime(currentScene.startSec)} - ${formatTime(splitPoint)} (${Math.round(splitPoint - currentScene.startSec)}s)`,
    };

    const newId = Math.max(...scenes.map((s) => s.id)) + 1;
    const sceneB: StoryboardScene = {
      ...currentScene,
      id: newId,
      sceneNumber: currentScene.sceneNumber + 1,
      startSec: splitPoint,
      endSec: currentScene.endSec,
      timeRange: `${formatTime(splitPoint)} - ${formatTime(currentScene.endSec)} (${Math.round(currentScene.endSec - splitPoint)}s)`,
      headline: `BƯỚC TIẾP: ${currentScene.headline || 'PHÂN ĐOẠN MỚI'}`,
    };

    // Re-index scenes
    const newStoryboard: StoryboardScene[] = [];
    scenes.forEach((s) => {
      if (s.id === currentScene.id) {
        newStoryboard.push(sceneA, sceneB);
      } else {
        newStoryboard.push(s);
      }
    });

    const reindexed = newStoryboard.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    onUpdateProject({ ...project, storyboard: reindexed });
    synthRef.current?.playSfx('camera-shutter');
  };

  const handleDuplicateScene = () => {
    if (!currentScene || !onUpdateProject) return;
    const dur = currentScene.endSec - currentScene.startSec;
    const newId = Math.max(...scenes.map((s) => s.id)) + 1;

    const dupScene: StoryboardScene = {
      ...currentScene,
      id: newId,
      sceneNumber: currentScene.sceneNumber + 1,
      startSec: currentScene.endSec,
      endSec: currentScene.endSec + dur,
      timeRange: `${formatTime(currentScene.endSec)} - ${formatTime(currentScene.endSec + dur)} (${dur}s)`,
      headline: `${currentScene.headline || 'CẢNH'} (BẢN SAO)`,
    };

    // Adjust subsequent scenes timing
    const newStoryboard: StoryboardScene[] = [];
    scenes.forEach((s) => {
      if (s.id === currentScene.id) {
        newStoryboard.push(s, dupScene);
      } else if (s.startSec >= currentScene.endSec) {
        newStoryboard.push({
          ...s,
          startSec: s.startSec + dur,
          endSec: s.endSec + dur,
          timeRange: `${formatTime(s.startSec + dur)} - ${formatTime(s.endSec + dur)}`,
        });
      } else {
        newStoryboard.push(s);
      }
    });

    const reindexed = newStoryboard.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    onUpdateProject({
      ...project,
      duration: project.duration + dur,
      storyboard: reindexed,
    });
    synthRef.current?.playSfx('chime');
  };

  const handleDeleteCurrentScene = () => {
    if (scenes.length <= 1) {
      alert('Dự án phải có ít nhất 1 phân cảnh.');
      return;
    }
    if (!currentScene || !onUpdateProject) return;
    if (!confirm(`Bạn có chắc muốn xóa Cảnh ${currentScene.sceneNumber}: "${currentScene.headline || currentScene.voiceover.slice(0, 30)}..."?`)) {
      return;
    }

    const dur = currentScene.endSec - currentScene.startSec;
    const remaining = scenes.filter((s) => s.id !== currentScene.id);

    // Shift back subsequent scenes
    let currentCursor = 0;
    const shifted = remaining.map((s, idx) => {
      const sceneDur = s.endSec - s.startSec;
      const start = currentCursor;
      const end = currentCursor + sceneDur;
      currentCursor = end;
      return {
        ...s,
        sceneNumber: idx + 1,
        startSec: start,
        endSec: end,
        timeRange: `${formatTime(start)} - ${formatTime(end)} (${sceneDur}s)`,
      };
    });

    onUpdateProject({
      ...project,
      duration: Math.max(10, project.duration - dur),
      storyboard: shifted,
    });
    setCurrentTime((t) => Math.max(0, t - dur));
  };

  const handleMoveSceneOrder = (direction: -1 | 1) => {
    if (!currentScene || !onUpdateProject) return;
    const targetIdx = currentSceneIndex + direction;
    if (targetIdx < 0 || targetIdx >= scenes.length) return;

    const swapped = [...scenes];
    const temp = swapped[currentSceneIndex];
    swapped[currentSceneIndex] = swapped[targetIdx];
    swapped[targetIdx] = temp;

    // Recalculate timing
    let cursor = 0;
    const updated = swapped.map((s, idx) => {
      const dur = s.endSec - s.startSec;
      const start = cursor;
      const end = cursor + dur;
      cursor = end;
      return {
        ...s,
        sceneNumber: idx + 1,
        startSec: start,
        endSec: end,
        timeRange: `${formatTime(start)} - ${formatTime(end)} (${dur}s)`,
      };
    });

    onUpdateProject({ ...project, storyboard: updated });
    synthRef.current?.playSfx('whoosh');
  };

  // Handle local user upload image or B-roll for active scene
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentScene || !onUpdateProject) return;

    const fileUrl = URL.createObjectURL(file);
    const updatedStoryboard = project.storyboard.map((s) => {
      if (s.id === currentScene.id) {
        return {
          ...s,
          customMediaUrl: fileUrl,
          customMediaType: (file.type.startsWith('video/') ? 'video' : 'image') as any,
        };
      }
      return s;
    });

    onUpdateProject({ ...project, storyboard: updatedStoryboard });
    // Preload into cache immediately
    const img = new Image();
    img.src = fileUrl;
    img.onload = () => {
      loadedImagesRef.current[currentScene.id] = img;
    };
    synthRef.current?.playSfx('chime');
  };

  // Snapshot Current Frame 4K Download
  const handleSnapshot4K = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    synthRef.current?.playSfx('camera-shutter');

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Snapshot_Scene_${currentSceneIndex + 1}_${project.title.slice(0, 18).replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  // Helper: Draw cover-fit image on canvas
  const drawCoverImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    W: number,
    H: number
  ) => {
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
  };

  // Apple Keynote Broadcast Technical Spec Callout Card (Top-Right HUD)
  const drawKeynoteSpecCalloutCard = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    sceneIdx: number,
    progress: number,
    clockSec: number
  ) => {
    const specPresets = [
      {
        badge: 'AEROSPACE TITANIUM GRADE 6',
        specs: ['CHASSIS: GRADE 6 BRUSHED TITAN', 'SHIELD: CERAMIC GLASS GEN 3', 'PROFILE: 7.4MM • 218G ULTRA-LIGHT'],
        accent: '#38bdf8',
      },
      {
        badge: 'SUPER RETINA XDR ZERO-BEZEL',
        specs: ['PANEL: 6.9" LTPO OLED 120HZ', 'FACE ID: UNDER-DISPLAY 3D SENSOR', 'BRIGHTNESS: 3,500 NITS PEAK HDR'],
        accent: '#c084fc',
      },
      {
        badge: 'APPLE A20 PRO • 2NM SILICON',
        specs: ['NODE: TSMC 2NM GAA ARCHITECTURE', 'NEURAL ENGINE: 85 TOPS ON-DEVICE', 'RAY TRACING: +40% GPU THROUGHPUT'],
        accent: '#facc15',
      },
      {
        badge: 'TRIPLE 48MP PRO OPTICS ARRAY',
        specs: ['MAIN: 48MP VARIABLE APERTURE', 'TELEPHOTO: 48MP 10X PERISCOPE', 'VIDEO: 8K 60FPS PRORES RAW LOG'],
        accent: '#10b981',
      },
      {
        badge: 'SILICON-CARBON POWER SYSTEM',
        specs: ['CAPACITY: 5,600mAh Si-C DENSITY', 'MAGSAFE: 65W WIRELESS TURBO', 'THERMAL: GRAPHENE VAPOR CHAMBER'],
        accent: '#f97316',
      },
      {
        badge: 'IPHONE 18 PRO MAX • MASTERPIECE',
        specs: ['DESIGN: ZERO-BEZEL TITANIUM', 'CHIP: A20 PRO 2NM APPLE AI 2.0', 'VERDICT: 9.9 / 10 FLAGSHIP KING'],
        accent: '#38bdf8',
      },
    ];

    const preset = specPresets[sceneIdx % specPresets.length];
    const cardW = Math.min(310, W * 0.27);
    const cardH = 108;
    const cardX = W - cardW - W * 0.035;
    const cardY = anamoLetterbox && aspectRatio === '16:9' ? H * 0.13 : H * 0.05;

    ctx.save();
    const slideAlpha = Math.min(1, progress * 6);
    ctx.globalAlpha = slideAlpha * 0.94;

    // Glassmorphic dark container
    ctx.fillStyle = 'rgba(9, 9, 15, 0.78)';
    ctx.strokeStyle = preset.accent;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 12);
    ctx.fill();
    ctx.stroke();

    // Header bar
    ctx.shadowBlur = 0;
    ctx.fillStyle = preset.accent;
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`◆ ${preset.badge}`, cardX + 12, cardY + 20);

    // Spec rows
    ctx.fillStyle = '#f4f4f5';
    ctx.font = '600 10px Inter, system-ui, monospace';
    preset.specs.forEach((line, idx) => {
      ctx.fillText(line, cardX + 12, cardY + 40 + idx * 17);
    });

    // Animated telemetry bar at bottom of card
    const barW = cardW - 24;
    const barY = cardY + cardH - 14;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.beginPath();
    ctx.roundRect(cardX + 12, barY, barW, 4, 2);
    ctx.fill();

    const fillW = barW * Math.min(1, 0.25 + progress * 0.75);
    ctx.fillStyle = preset.accent;
    ctx.beginPath();
    ctx.roundRect(cardX + 12, barY, fillW, 4, 2);
    ctx.fill();

    // Live pulse dot
    const pulse = 0.5 + 0.5 * Math.sin(clockSec * 6);
    ctx.fillStyle = preset.accent;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(cardX + cardW - 14, cardY + 16, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Live 16-Band Audio Spectrum Visualizer (Bottom-Right HUD)
  const drawLiveAudioSpectrumHud = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    clockSec: number,
    accentColor: string
  ) => {
    const barCount = 16;
    const barW = 3.5;
    const gap = 2.5;
    const totalW = barCount * (barW + gap) + 16;
    const boxH = 34;
    const boxX = W - totalW - W * 0.035;
    const boxY = (anamoLetterbox && aspectRatio === '16:9' ? H * 0.86 : H * 0.91) - boxH;

    ctx.save();
    ctx.fillStyle = 'rgba(9, 9, 15, 0.72)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, totalW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < barCount; i++) {
      const wave =
        Math.abs(Math.sin(clockSec * 7.5 + i * 0.55)) * 0.65 +
        Math.abs(Math.cos(clockSec * 4.2 - i * 0.3)) * 0.35;
      const h = Math.max(4, wave * (boxH - 10));
      const bx = boxX + 8 + i * (barW + gap);
      const by = boxY + (boxH - h) / 2;

      ctx.fillStyle = i % 3 === 0 ? '#facc15' : accentColor;
      ctx.beginPath();
      ctx.roundRect(bx, by, barW, h, 1.5);
      ctx.fill();
    }
    ctx.restore();
  };

  // DRAW CANVAS COMPOSITOR (60FPS REAL INTERNET PHOTOGRAPHY + BROADCAST HUD)
  const drawCinemaCanvas = (clockSec: number, overrideTimeSec?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const activeTime = overrideTimeSec !== undefined ? overrideTimeSec : currentTimeRef.current;
    const activeIdx = getCurrentSceneIndex(activeTime);
    const scene = scenes[activeIdx] || scenes[0];
    if (!scene) return;

    const sceneDur = Math.max(1, scene.endSec - scene.startSec);
    const sceneElapsed = Math.max(0, activeTime - scene.startSec);
    const progress = Math.min(1, sceneElapsed / sceneDur);

    ctx.save();

    // 1. Base Studio Background
    const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.45, W * 0.05, W * 0.5, H * 0.5, W * 0.85);
    bgGrad.addColorStop(0, '#13141f');
    bgGrad.addColorStop(0.6, '#08090d');
    bgGrad.addColorStop(1, '#020204');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Camera Motion Transforms (Dolly In, Dolly Out, Orbit, FPV Zoom, Crane, Pan)
    const motion = scene.cameraMotion || 'dolly-in';
    let scale = 1.0;
    let tx = 0;
    let ty = 0;
    let rot = 0;

    if (motion === 'dolly-in') {
      scale = 1.03 + progress * 0.16;
    } else if (motion === 'dolly-out') {
      scale = 1.2 - progress * 0.16;
    } else if (motion === 'orbit') {
      scale = 1.12;
      tx = Math.sin(progress * Math.PI * 2) * (W * 0.032);
      ty = Math.cos(progress * Math.PI * 2) * (H * 0.015);
      rot = Math.sin(progress * Math.PI) * 0.014;
    } else if (motion === 'fpv-zoom') {
      scale = 1.02 + Math.pow(progress, 1.3) * 0.24;
      rot = Math.sin(progress * Math.PI * 2) * 0.018;
      tx = Math.cos(progress * Math.PI) * (W * 0.02);
    } else if (motion === 'crane-up') {
      scale = 1.12;
      ty = (0.5 - progress) * (H * 0.065);
    } else if (motion === 'pan-right') {
      scale = 1.12;
      tx = (0.5 - progress) * (W * 0.065);
    } else if (motion === 'pan-left') {
      scale = 1.12;
      tx = (progress - 0.5) * (W * 0.065);
    }

    // Subtle cinematic floating camera breathing
    const breathX = Math.sin(clockSec * 1.6) * 1.2;
    const breathY = Math.cos(clockSec * 1.3) * 1.2;

    ctx.save();
    ctx.translate(W / 2 + tx + breathX, H / 2 + ty + breathY);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);

    // 3. Draw Real High-Resolution Internet Photograph at 100% Crisp Clarity!
    const img = loadedImagesRef.current[scene.id];
    const prevScene = activeIdx > 0 ? scenes[activeIdx - 1] : null;
    const prevImg = prevScene ? loadedImagesRef.current[prevScene.id] : null;

    if (img && img.complete && img.naturalWidth > 0) {
      // Smooth Cross-Dissolve from previous scene image during first 0.55s
      if (sceneElapsed < 0.55 && prevImg && prevImg.complete && prevImg.naturalWidth > 0) {
        const blend = sceneElapsed / 0.55;
        ctx.globalAlpha = 1.0;
        drawCoverImage(ctx, prevImg, W, H);
        ctx.globalAlpha = blend;
        drawCoverImage(ctx, img, W, H);
        ctx.globalAlpha = 1.0;
      } else {
        ctx.globalAlpha = 1.0;
        drawCoverImage(ctx, img, W, H);
      }
    } else {
      // Fallback procedural 3D stage only while image is still loading
      drawCinematicSceneStage(ctx, W, H, clockSec, activeIdx, progress, scene);
    }

    // Subtle atmospheric bokeh particles over the real photograph
    drawAtmosphericParticles(ctx, W, H, clockSec, scene.lightingStyle || 'volumetric');

    ctx.restore();

    // 4. Color Grading LUT Overlay
    drawColorGradeLut(ctx, W, H, activeLut);

    // 5. Optical VFX Overlays (Film grain, light leaks, vignette)
    drawVfxOverlay(ctx, W, H, clockSec, activeVfx);

    // 6. Subtle Top & Bottom Broadcast Gradient Scrim for 100% Text Readability
    const topScrim = ctx.createLinearGradient(0, 0, 0, H * 0.24);
    topScrim.addColorStop(0, 'rgba(0, 0, 0, 0.62)');
    topScrim.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topScrim;
    ctx.fillRect(0, 0, W, H * 0.24);

    const botScrim = ctx.createLinearGradient(0, H * 0.72, 0, H);
    botScrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
    botScrim.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
    ctx.fillStyle = botScrim;
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    // 7. Cinema Letterbox 2.39:1
    if (anamoLetterbox && aspectRatio === '16:9') {
      const barH = H * 0.11;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, barH);
      ctx.fillRect(0, H - barH, W, barH);
    }

    // 8. Top-Left On-Screen HUD & Scene Headline + Top-Right Keynote Spec Card + Audio Spectrum
    drawCinemaHudAndHeadline(ctx, W, H, scene, activeIdx, scenes.length, progress);
    drawKeynoteSpecCalloutCard(ctx, W, H, activeIdx, progress, clockSec);
    drawLiveAudioSpectrumHud(ctx, W, H, clockSec, '#38bdf8');

    // 9. Kinetic Typography Subtitles
    if (subtitleStyle !== 'off') {
      drawKineticSubtitles(ctx, W, H, scene.voiceover, progress, subtitleStyle, subtitlePosition, aspectRatio);
    }

    ctx.restore();
  };

  drawCinemaCanvasRef.current = drawCinemaCanvas;

  // MASTER 3D CINEMATIC PROCEDURAL STAGE COMPOSITOR (6 Distinct High-Tech Scenes)
  const drawCinematicSceneStage = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    sceneIdx: number,
    progress: number,
    scene: StoryboardScene
  ) => {
    const headline = (scene.headline || '').toUpperCase();
    const isScene1 = sceneIdx === 0 || headline.includes('01') || headline.includes('LỘ DIỆN') || headline.includes('KỶ NGUYÊN');
    const isScene2 = sceneIdx === 1 || headline.includes('02') || headline.includes('BẢN LỀ') || headline.includes('TITAN');
    const isScene3 = sceneIdx === 2 || headline.includes('03') || headline.includes('MÀN HÌNH') || headline.includes('OLED') || headline.includes('120HZ');
    const isScene4 = sceneIdx === 3 || headline.includes('04') || headline.includes('NEURAL') || headline.includes('CHIP') || headline.includes('A19') || headline.includes('VI XỬ LÝ');
    const isScene5 = sceneIdx === 4 || headline.includes('05') || headline.includes('CAMERA') || headline.includes('QUANG HỌC');
    const isScene6 = sceneIdx >= 5 || headline.includes('06') || headline.includes('TỔNG KẾT') || headline.includes('ĐÁNH GIÁ');

    if (isScene1) {
      drawScene1_ObsidianReveal(ctx, W, H, t, progress);
    } else if (isScene2) {
      drawScene2_LiquidMetalHinge(ctx, W, H, t, progress);
    } else if (isScene3) {
      drawScene3_DualOledMultitasking(ctx, W, H, t, progress);
    } else if (isScene4) {
      drawScene4_SiliconNeuralDie(ctx, W, H, t, progress);
    } else if (isScene5) {
      drawScene5_TripleOpticsLidar(ctx, W, H, t, progress);
    } else {
      drawScene6_KeynoteGrandFinale(ctx, W, H, t, progress);
    }
  };

  // SCENE 1: THE OBSIDIAN REVEAL
  const drawScene1_ObsidianReveal = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    progress: number
  ) => {
    const cx = W * 0.5;
    const cy = H * 0.5;

    // Perspective floor with laser grid
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.22)';
    ctx.lineWidth = 1.2;
    const horizon = H * 0.62;
    for (let i = -16; i <= 16; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * (W * 0.022), horizon);
      ctx.lineTo(cx + i * (W * 0.17), H);
      ctx.stroke();
    }

    // Glowing Circular LED Ring on Floor
    ctx.save();
    ctx.translate(cx, horizon + (H - horizon) * 0.42);
    ctx.scale(1, 0.28);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(W, H) * 0.44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Volumetric God Rays from top
    ctx.save();
    const rayGrad = ctx.createLinearGradient(cx, 0, cx, H * 0.7);
    rayGrad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
    rayGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
    rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(cx - W * 0.15, 0);
    ctx.lineTo(cx + W * 0.15, 0);
    ctx.lineTo(cx + W * 0.38, H * 0.7);
    ctx.lineTo(cx - W * 0.38, H * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Rising & Unfolding iPhone Duo
    const phoneW = Math.min(W, H) * 0.21;
    const phoneH = phoneW * 1.68;
    const riseY = cy + (1 - Math.min(1, progress * 1.8)) * 35;
    const unfoldAngle = (0.2 + progress * 0.45) * Math.sin(t * 1.2);

    ctx.save();
    ctx.translate(cx, riseY);

    // Dynamic Pedestal Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.ellipse(0, phoneH * 0.54, phoneW * 1.4, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // LEFT WING (Folded Titanium + Rear Ceramic Glass)
    ctx.save();
    ctx.rotate(unfoldAngle * 0.3);
    ctx.fillStyle = '#181920';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-phoneW - 4, -phoneH / 2, phoneW, phoneH, 18);
    ctx.fill();
    ctx.stroke();

    // Rear Matte Finish & Glowing Insignia
    const matteGrad = ctx.createLinearGradient(-phoneW, -phoneH / 2, 0, phoneH / 2);
    matteGrad.addColorStop(0, '#0f172a');
    matteGrad.addColorStop(0.5, '#1e293b');
    matteGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = matteGrad;
    ctx.beginPath();
    ctx.roundRect(-phoneW + 4, -phoneH / 2 + 8, phoneW - 12, phoneH - 16, 14);
    ctx.fill();

    // Apple & Duo Emblem
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(' DUO PRO', -phoneW * 0.75, 0);
    ctx.restore();

    // RIGHT WING (Luminous OLED Active)
    ctx.save();
    ctx.rotate(-unfoldAngle * 0.3);
    ctx.fillStyle = '#181920';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(4, -phoneH / 2, phoneW, phoneH, 18);
    ctx.fill();
    ctx.stroke();

    const oledGrad = ctx.createLinearGradient(0, -phoneH / 2, phoneW, phoneH / 2);
    oledGrad.addColorStop(0, '#090d16');
    oledGrad.addColorStop(0.4, '#38bdf8');
    oledGrad.addColorStop(0.8, '#6366f1');
    oledGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = oledGrad;
    ctx.beginPath();
    ctx.roundRect(8, -phoneH / 2 + 8, phoneW - 12, phoneH - 16, 14);
    ctx.fill();

    // Live Vertical Scanning Laser across chassis
    const laserY = -phoneH / 2 + ((Math.sin(t * 3.5) + 1) / 2) * phoneH;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(8, laserY);
    ctx.lineTo(phoneW - 4, laserY);
    ctx.stroke();
    ctx.restore();

    // Center Titanium Liquid Hinge Spine
    const spineGrad = ctx.createLinearGradient(-4, 0, 4, 0);
    spineGrad.addColorStop(0, '#0284c7');
    spineGrad.addColorStop(0.5, '#7dd3fc');
    spineGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = spineGrad;
    ctx.fillRect(-3, -phoneH / 2 + 10, 6, phoneH - 20);

    ctx.restore();

    // Floating Holographic Tech Tags
    ctx.save();
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('◆ SYSTEM: AEROSPACE GRADE 5 TITANIUM', W * 0.06, horizon - 20);
    ctx.fillStyle = '#facc15';
    ctx.fillText('◆ ZERO-CREASE DUAL RETINA XDR 120HZ', W * 0.06, horizon);
    ctx.restore();
  };

  // SCENE 2: LIQUID-METAL HINGE & MACRO TITANIUM TOLERANCE
  const drawScene2_LiquidMetalHinge = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    progress: number
  ) => {
    const cx = W * 0.5;
    const cy = H * 0.5;

    // Technical CAD Blueprint Background Grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < W; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Macro Spine Plate
    const spineW = Math.min(W, H) * 0.48;
    const spineH = spineW * 0.85;

    ctx.save();
    ctx.translate(cx, cy);

    // Titanium Outer Bevels
    const titanGrad = ctx.createLinearGradient(-spineW / 2, 0, spineW / 2, 0);
    titanGrad.addColorStop(0, '#334155');
    titanGrad.addColorStop(0.25, '#64748b');
    titanGrad.addColorStop(0.5, '#cbd5e1');
    titanGrad.addColorStop(0.75, '#64748b');
    titanGrad.addColorStop(1, '#334155');

    ctx.fillStyle = titanGrad;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-spineW / 2, -spineH / 2, spineW, spineH, 16);
    ctx.fill();
    ctx.stroke();

    // 4 Intermeshing Rotating Mechanical Gears (Smooth 60fps Rotation)
    const gearRadius = spineW * 0.11;
    const gearYPositions = [-spineH * 0.32, -spineH * 0.11, spineH * 0.11, spineH * 0.32];

    gearYPositions.forEach((gy, idx) => {
      const gearAngle = t * 2.5 * (idx % 2 === 0 ? 1 : -1);
      ctx.save();
      ctx.translate(0, gy);
      ctx.rotate(gearAngle);

      // Gear Body
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, gearRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Gear Teeth (12 cogs)
      for (let c = 0; c < 12; c++) {
        ctx.save();
        ctx.rotate((c * Math.PI) / 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-3, -gearRadius - 5, 6, 8);
        ctx.restore();
      }

      // Center Titanium Pivot
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, gearRadius * 0.38, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // Precision Measuring Caliper Overlays
    const caliperW = spineW * 0.65;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-caliperW / 2, -spineH * 0.44);
    ctx.lineTo(caliperW / 2, -spineH * 0.44);
    ctx.moveTo(-caliperW / 2, -spineH * 0.44 - 8);
    ctx.lineTo(-caliperW / 2, -spineH * 0.44 + 8);
    ctx.moveTo(caliperW / 2, -spineH * 0.44 - 8);
    ctx.lineTo(caliperW / 2, -spineH * 0.44 + 8);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0.005mm ZERO-GAP TOLERANCE', 0, -spineH * 0.44 - 14);

    // Caliper for Thinness
    ctx.strokeStyle = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(-spineW / 2 - 20, -spineH * 0.25);
    ctx.lineTo(-spineW / 2 - 20, spineH * 0.25);
    ctx.stroke();

    ctx.save();
    ctx.translate(-spineW / 2 - 32, 0);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('4.8mm ULTRA-SLIM PROFILE', 0, 0);
    ctx.restore();

    ctx.restore();

    // Blueprint Callout Labels
    ctx.save();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('ARCHITECTURE: MULTI-AXIS LIQUID METAL GEARS', W * 0.05, H * 0.88);
    ctx.fillText('CYCLE RATING: 500,000+ FOLD CERTIFIED', W * 0.05, H * 0.92);
    ctx.restore();
  };

  // SCENE 3: DUAL 120HZ OLED MULTITASKING (NLE Video Timeline + 3D CAD Wireframe)
  const drawScene3_DualOledMultitasking = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    progress: number
  ) => {
    const cx = W * 0.5;
    const cy = H * 0.5;

    // Floor Reflection Glow
    const floorGlow = ctx.createLinearGradient(0, H * 0.65, 0, H);
    floorGlow.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
    floorGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.15)');
    floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = floorGlow;
    ctx.fillRect(0, H * 0.65, W, H * 0.35);

    const screenW = Math.min(W, H) * 0.34;
    const screenH = screenW * 1.52;

    ctx.save();
    ctx.translate(cx, cy);

    // LEFT SCREEN: 4K NLE Video Editor Workspace
    ctx.save();
    ctx.translate(-screenW / 2 - 3, 0);

    // Bezel
    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-screenW / 2, -screenH / 2, screenW, screenH, 14);
    ctx.fill();
    ctx.stroke();

    // Screen Content
    const innerPad = 8;
    const inW = screenW - innerPad * 2;
    const inH = screenH - innerPad * 2;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-screenW / 2 + innerPad, -screenH / 2 + innerPad, inW, inH, 10);
    ctx.fill();

    // Video Monitor inside screen
    const monH = inH * 0.48;
    const monGrad = ctx.createLinearGradient(-inW / 2, -inH / 2, inW / 2, -inH / 2 + monH);
    monGrad.addColorStop(0, '#1e1b4b');
    monGrad.addColorStop(0.5, '#0284c7');
    monGrad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = monGrad;
    ctx.fillRect(-inW / 2 + 6, -inH / 2 + 6, inW - 12, monH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('4K PRORES TIMELINE • 60FPS', -inW / 2 + 12, -inH / 2 + 20);

    // Audio Waveforms (3 tracks)
    const waveY = -inH / 2 + monH + 20;
    ctx.fillStyle = '#10b981';
    for (let w = 0; w < inW - 20; w += 4) {
      const h = (Math.sin(w * 0.15 + t * 4) + 1) * 7 + 3;
      ctx.fillRect(-inW / 2 + 10 + w, waveY - h / 2, 2.5, h);
    }

    // Playhead red line
    const playheadX = -inW / 2 + 10 + ((t * 40) % (inW - 20));
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(playheadX, -inH / 2 + monH + 10);
    ctx.lineTo(playheadX, inH / 2 - 10);
    ctx.stroke();

    ctx.restore();

    // RIGHT SCREEN: 3D Holographic CAD Viewport
    ctx.save();
    ctx.translate(screenW / 2 + 3, 0);

    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-screenW / 2, -screenH / 2, screenW, screenH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0a0915';
    ctx.beginPath();
    ctx.roundRect(-screenW / 2 + innerPad, -screenH / 2 + innerPad, inW, inH, 10);
    ctx.fill();

    // Rotating 3D Holographic Wireframe Cube
    const cubeSize = inW * 0.35;
    ctx.save();
    ctx.translate(0, -inH * 0.08);
    ctx.rotate(t * 0.8);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-cubeSize / 2, -cubeSize / 2, cubeSize, cubeSize);

    ctx.rotate(Math.PI / 4 + t * 0.4);
    ctx.strokeStyle = '#ec4899';
    ctx.strokeRect(-cubeSize * 0.4, -cubeSize * 0.4, cubeSize * 0.8, cubeSize * 0.8);

    // Glowing Vertex Dots
    [-cubeSize / 2, cubeSize / 2].forEach((vx) => {
      [-cubeSize / 2, cubeSize / 2].forEach((vy) => {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(vx, vy, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    ctx.restore();

    // CAD Telemetry HUD
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('3D VIEWPORT • METAL RAY TRACING', -inW / 2 + 12, inH / 2 - 28);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText('VERTICES: 124,800 • FPS: 120.0', -inW / 2 + 12, inH / 2 - 14);

    ctx.restore();

    // Glowing Seamless Energy Seam Bridge
    const seamGrad = ctx.createLinearGradient(0, -screenH / 2, 0, screenH / 2);
    seamGrad.addColorStop(0, '#38bdf8');
    seamGrad.addColorStop(0.5, '#ffffff');
    seamGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = seamGrad;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.fillRect(-1.5, -screenH / 2 + 12, 3, screenH - 24);

    ctx.restore();

    // HUD Top Tags
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('120Hz PROMOTION • DUAL RETINA XDR', W * 0.06, H * 0.14);
    ctx.fillStyle = '#facc15';
    ctx.fillText('3,200 NITS PEAK OUTDOOR HDR BRIGHTNESS', W * 0.06, H * 0.18);
    ctx.restore();
  };

  // SCENE 4: A19 PRO 2NM NEURAL SILICON DIE
  const drawScene4_SiliconNeuralDie = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    progress: number
  ) => {
    const cx = W * 0.5;
    const cy = H * 0.5;

    // Translucent Motherboard Circuit Board
    const chipW = Math.min(W, H) * 0.38;
    const chipH = chipW;

    ctx.save();
    ctx.translate(cx, cy);

    // Silicon Substrate
    ctx.fillStyle = '#060a12';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-chipW * 0.85, -chipH * 0.85, chipW * 1.7, chipH * 1.7, 20);
    ctx.fill();
    ctx.stroke();

    // Branching Neural Synaptic Pathways (16 routes)
    for (let r = 0; r < 16; r++) {
      const angle = (r * Math.PI) / 8;
      const startDist = chipW * 0.52;
      const endDist = chipW * 0.82;

      ctx.save();
      ctx.rotate(angle);

      // Gold circuit trace
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startDist, 0);
      ctx.lineTo(startDist + 18, 14);
      ctx.lineTo(endDist, 14);
      ctx.stroke();

      // Glowing Photon Data Pulse traveling outward
      const pulseT = ((t * 1.8 + r * 0.25) % 1.0);
      const px = startDist + pulseT * (endDist - startDist);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, 14 * pulseT, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // A19 Pro Heat Spreader Chip
    const dieGrad = ctx.createLinearGradient(-chipW / 2, -chipH / 2, chipW / 2, chipH / 2);
    dieGrad.addColorStop(0, '#1e293b');
    dieGrad.addColorStop(0.3, '#334155');
    dieGrad.addColorStop(0.7, '#0f172a');
    dieGrad.addColorStop(1, '#020617');

    ctx.fillStyle = dieGrad;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(-chipW / 2, -chipH / 2, chipW, chipH, 14);
    ctx.fill();
    ctx.stroke();

    // Inner Silicon Die
    const innerW = chipW * 0.72;
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-innerW / 2, -innerW / 2, innerW, innerW, 8);
    ctx.fill();
    ctx.stroke();

    // Laser Engraved Chip Branding
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('A19 PRO', 0, -12);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('2NM • 68 TOPS NEURAL', 0, 10);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '9px monospace';
    ctx.fillText('6-CORE RAY TRACING GPU', 0, 26);

    ctx.restore();

    // Real-time Thermal Telemetry
    ctx.save();
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('● CRYOGENIC VAPOR CHAMBER: 31.4°C STABLE', W * 0.06, H * 0.88);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('● HARDWARE ENCODING: 8K PRORES REAL-TIME', W * 0.06, H * 0.92);
    ctx.restore();
  };

  // SCENE 5: TRIPLE SAPPHIRE OPTICS & LIDAR 3D SPATIAL SCANNER
  const drawScene5_TripleOpticsLidar = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    progress: number
  ) => {
    const cx = W * 0.5;
    const cy = H * 0.5;

    // Macro Camera Island Base
    const islandRadius = Math.min(W, H) * 0.36;

    ctx.save();
    ctx.translate(cx, cy);

    // Ceramic Brushed Island Bump
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(-islandRadius, -islandRadius, islandRadius * 2, islandRadius * 2, 28);
    ctx.fill();
    ctx.stroke();

    // 3 Large Lenses (Top-Left, Bottom-Left, Center-Right)
    const lensPositions = [
      { x: -islandRadius * 0.45, y: -islandRadius * 0.45, label: '48MP WIDE' },
      { x: -islandRadius * 0.45, y: islandRadius * 0.45, label: '48MP ULTRA' },
      { x: islandRadius * 0.42, y: 0, label: '120MM PERISCOPE' },
    ];

    const lensR = islandRadius * 0.36;

    lensPositions.forEach((lp, idx) => {
      ctx.save();
      ctx.translate(lp.x, lp.y);

      // Titanium Rim
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, lensR, 0, Math.PI * 2);
      ctx.stroke();

      // Deep Multi-Layer Anti-Reflective Sapphire Coating
      const lensGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, lensR);
      lensGrad.addColorStop(0, '#090d16');
      lensGrad.addColorStop(0.5, idx === 0 ? '#047857' : idx === 1 ? '#4338ca' : '#0369a1');
      lensGrad.addColorStop(0.85, '#020617');
      lensGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = lensGrad;
      ctx.beginPath();
      ctx.arc(0, 0, lensR - 3, 0, Math.PI * 2);
      ctx.fill();

      // Animated 8-Blade Mechanical Iris Aperture
      const irisR = lensR * 0.45 * (0.65 + 0.35 * Math.sin(t * 2 + idx));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      for (let b = 0; b < 8; b++) {
        ctx.save();
        ctx.rotate((b * Math.PI) / 4);
        ctx.beginPath();
        ctx.moveTo(irisR, 0);
        ctx.lineTo(lensR * 0.8, 8);
        ctx.stroke();
        ctx.restore();
      }

      // Specular Glass Arc Highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, lensR * 0.78, -Math.PI * 0.35, -Math.PI * 0.1);
      ctx.stroke();

      ctx.restore();
    });

    // Central Flash & LiDAR Sensor
    ctx.save();
    ctx.translate(-islandRadius * 0.05, -islandRadius * 0.05);

    // LiDAR circular sensor
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, islandRadius * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Animated LiDAR 3D Spatial Conical Beams
    const lidarWave = ((t * 2.2) % 1.0);
    ctx.strokeStyle = `rgba(56, 189, 248, ${1 - lidarWave})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, islandRadius * 0.18 + lidarWave * 80, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    ctx.restore();

    // Camera Optics Telemetry
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('TRIPLE 48MP QUAD-PIXEL OPTICS • SENSOR-SHIFT OIS', W * 0.06, H * 0.88);
    ctx.fillStyle = '#facc15';
    ctx.fillText('LiDAR 3D SPATIAL DEPTH SCANNER • 8K PRORES VIDEO', W * 0.06, H * 0.92);
    ctx.restore();
  };

  // SCENE 6: THE KEYNOTE GRAND FINALE
  const drawScene6_KeynoteGrandFinale = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    progress: number
  ) => {
    const cx = W * 0.5;
    const cy = H * 0.48;

    // Anamorphic Blue Flare sweeping horizontally
    const flareY = H * 0.44;
    const flareGrad = ctx.createLinearGradient(0, flareY, W, flareY);
    flareGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    flareGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.15)');
    flareGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
    flareGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.15)');
    flareGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, flareY - 5, W, 10);

    // Floating 3D Showcase of iPhone Duo
    const phoneW = Math.min(W, H) * 0.22;
    const phoneH = phoneW * 1.65;
    const floatY = cy + Math.sin(t * 1.5) * 8;
    const rotate3D = Math.sin(t * 0.8) * 0.18;

    ctx.save();
    ctx.translate(cx, floatY);
    ctx.rotate(rotate3D);

    // Glowing Pedestal Base
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, phoneH * 0.55, phoneW * 1.6, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dual Screen Wings Flexing
    const flexAngle = 0.28 + Math.sin(t * 1.2) * 0.12;

    // Left Wing
    ctx.save();
    ctx.rotate(flexAngle);
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-phoneW - 4, -phoneH / 2, phoneW, phoneH, 16);
    ctx.fill();
    ctx.stroke();

    const oledL = ctx.createLinearGradient(-phoneW, -phoneH / 2, 0, phoneH / 2);
    oledL.addColorStop(0, '#0284c7');
    oledL.addColorStop(0.5, '#6366f1');
    oledL.addColorStop(1, '#a855f7');
    ctx.fillStyle = oledL;
    ctx.beginPath();
    ctx.roundRect(-phoneW + 4, -phoneH / 2 + 8, phoneW - 12, phoneH - 16, 12);
    ctx.fill();
    ctx.restore();

    // Right Wing
    ctx.save();
    ctx.rotate(-flexAngle);
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(4, -phoneH / 2, phoneW, phoneH, 16);
    ctx.fill();
    ctx.stroke();

    const oledR = ctx.createLinearGradient(0, -phoneH / 2, phoneW, phoneH / 2);
    oledR.addColorStop(0, '#ec4899');
    oledR.addColorStop(0.5, '#f59e0b');
    oledR.addColorStop(1, '#10b981');
    ctx.fillStyle = oledR;
    ctx.beginPath();
    ctx.roundRect(8, -phoneH / 2 + 8, phoneW - 12, phoneH - 16, 12);
    ctx.fill();
    ctx.restore();

    // Central Titanium Hinge
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-3, -phoneH / 2 + 10, 6, phoneH - 20);

    ctx.restore();

    // Floating Glassmorphic Feature Badges (Left & Right)
    const cardW = Math.min(W, H) * 0.28;
    const cardH = 34;

    const cards = [
      { text: 'MÀN HÌNH KÉP OLED 120HZ', x: W * 0.18, y: H * 0.32, color: '#38bdf8' },
      { text: 'CHIP A19 PRO 2NM SILICON', x: W * 0.18, y: H * 0.44, color: '#facc15' },
      { text: 'KHUNG TITAN HÀNG KHÔNG', x: W * 0.82, y: H * 0.32, color: '#10b981' },
      { text: 'CAMERA ĐIỆN ẢNH 8K PRORES', x: W * 0.82, y: H * 0.44, color: '#ec4899' },
    ];

    cards.forEach((c) => {
      ctx.save();
      ctx.fillStyle = 'rgba(9, 9, 11, 0.78)';
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 1.2;
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(c.x - cardW / 2, c.y - cardH / 2, cardW, cardH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.text, c.x, c.y);
      ctx.restore();
    });

    // Grand Keynote Headline
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '800 20px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.fillText('IPHONE DUO • KỶ NGUYÊN MỚI ĐÃ ĐẾN', cx, H * 0.86);

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('SẢN XUẤT BỞI SYNAPES AI STUDIO • HOÀN TẤT XUẤT BẢN', cx, H * 0.91);
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

    for (let i = 0; i < 22; i++) {
      const px = ((Math.sin(i * 73.1 + t * 0.22) + 1) * 0.5) * W;
      const py = ((Math.cos(i * 41.7 + t * 0.3) + 1) * 0.5) * H;
      const radius = (i % 3) + 1.2;
      const alpha = 0.12 + 0.16 * Math.sin(t * 2 + i);
      ctx.fillStyle = `rgba(${color}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Color Grade LUT Shader
  const drawColorGradeLut = (ctx: CanvasRenderingContext2D, W: number, H: number, lut: ColorGradeLut) => {
    if (lut === 'none') return;

    if (lut === 'teal-orange') {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, 'rgba(14, 165, 233, 0.14)'); // Teal highlights
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(249, 115, 22, 0.15)'); // Warm orange shadows
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else if (lut === 'cyberpunk') {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, 'rgba(236, 72, 153, 0.16)'); // Magenta
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.16)'); // Electric cyan
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else if (lut === 'studio-clean') {
      const grad = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * 0.6);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.18)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else if (lut === 'vintage-film') {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.09)'; // Warm sepia tone
      ctx.fillRect(0, 0, W, H);
    } else if (lut === 'monochrome') {
      // High-contrast B&W overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(0, 0, W, H);
    }
  };

  // Optical VFX Overlays
  const drawVfxOverlay = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    vfx: VfxOverlayType
  ) => {
    // Standard vignette on edges
    const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    if (vfx === 'film-grain') {
      // Dynamic noise film grain
      const grainCount = 35;
      for (let i = 0; i < grainCount; i++) {
        const gx = Math.random() * W;
        const gy = Math.random() * H;
        const gAlpha = Math.random() * 0.08;
        ctx.fillStyle = `rgba(255, 255, 255, ${gAlpha})`;
        ctx.fillRect(gx, gy, 2, 2);
      }
    } else if (vfx === 'light-leak') {
      // Optical anamorphic horizontal flare
      const flareY = H * 0.3 + Math.sin(t * 1.1) * 30;
      const flare = ctx.createLinearGradient(0, flareY, W, flareY);
      flare.addColorStop(0, 'rgba(56, 189, 248, 0)');
      flare.addColorStop(0.5, 'rgba(56, 189, 248, 0.18)');
      flare.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = flare;
      ctx.fillRect(0, flareY - 4, W, 8);
    }
  };

  // Cinema HUD & Headline
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

    // Scene Badge Pill
    ctx.save();
    ctx.font = `bold ${Math.max(11, Math.round(W * 0.014))}px monospace`;
    const badgeText = `SCENE 0${sceneIdx + 1}/0${totalScenes} • ${(scene.cameraMotion || 'DOLLY-IN').toUpperCase()} • 4K 60FPS`;
    const metrics = ctx.measureText(badgeText);
    const pillW = metrics.width + 24;
    const pillH = Math.max(22, Math.round(H * 0.042));

    ctx.fillStyle = 'rgba(9, 9, 11, 0.78)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(padX, topY, pillW, pillH, 6);
    ctx.fill();
    ctx.stroke();

    // Rec Red/Green Dot
    ctx.fillStyle = isPlaying ? '#10b981' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(padX + 11, topY + pillH / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f4f4f5';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, padX + 20, topY + pillH / 2 + 1);

    // Headline Text
    if (scene.headline) {
      const slideIn = Math.min(1, progress * 5);
      const headY = topY + pillH + Math.max(18, H * 0.034);
      ctx.globalAlpha = slideIn;
      ctx.font = `800 ${Math.max(14, Math.round(W * 0.022))}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 8;
      ctx.fillText(scene.headline, padX + (1 - slideIn) * -20, headY);
    }

    ctx.restore();
  };

  // Kinetic Typography Subtitles
  const drawKineticSubtitles = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    voiceover: string,
    progress: number,
    style: SubtitleStyle,
    position: SubtitlePosition,
    ratio: '16:9' | '9:16'
  ) => {
    const words = voiceover.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));
    const chunkSize = ratio === '9:16' ? 5 : 8;
    const chunkIndex = Math.floor(activeWordIndex / chunkSize);
    const chunkStart = chunkIndex * chunkSize;
    const chunkWords = words.slice(chunkStart, chunkStart + chunkSize);

    const fontSize = ratio === '9:16' ? Math.round(W * 0.052) : Math.round(W * 0.026);
    let targetY = H * 0.84;
    if (position === 'center') targetY = H * 0.5;
    if (position === 'top') targetY = H * 0.18;
    if (anamoLetterbox && ratio === '16:9' && position === 'bottom') targetY = H * 0.82;

    ctx.save();
    ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'middle';

    const spaceW = ctx.measureText(' ').width * 1.15;
    const wordWidths = chunkWords.map((w) => ctx.measureText(w).width);
    const totalLineW = wordWidths.reduce((a, b) => a + b, 0) + spaceW * Math.max(0, chunkWords.length - 1);

    const boxPadX = 18;
    const boxPadY = 12;

    // Background Container
    if (style === 'hormozi') {
      ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.lineWidth = 1.5;
    } else if (style === 'capcut') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
    } else if (style === 'cyberpunk') {
      ctx.fillStyle = 'rgba(10, 10, 20, 0.9)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.strokeStyle = 'transparent';
    }

    ctx.beginPath();
    ctx.roundRect(
      W / 2 - totalLineW / 2 - boxPadX,
      targetY - fontSize / 2 - boxPadY,
      totalLineW + boxPadX * 2,
      fontSize + boxPadY * 2,
      10
    );
    ctx.fill();
    ctx.stroke();

    // Render words
    let cursorX = W / 2 - totalLineW / 2;
    chunkWords.forEach((word, idx) => {
      const globalIdx = chunkStart + idx;
      const isCurrent = globalIdx === activeWordIndex;
      const isPast = globalIdx < activeWordIndex;

      ctx.save();
      if (isCurrent) {
        // High-retention pop bounce scale
        const bounceScale = 1.15;
        const wordCenterX = cursorX + wordWidths[idx] / 2;
        ctx.translate(wordCenterX, targetY);
        ctx.scale(bounceScale, bounceScale);
        ctx.translate(-wordCenterX, -targetY);

        if (style === 'hormozi') {
          ctx.fillStyle = '#facc15';
          ctx.shadowColor = 'rgba(250, 204, 21, 0.9)';
          ctx.shadowBlur = 14;
        } else if (style === 'cyberpunk') {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = 'rgba(56, 189, 248, 0.95)';
          ctx.shadowBlur = 16;
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = 8;
        }
      } else if (isPast) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      }

      ctx.fillText(word, cursorX, targetY);
      ctx.restore();

      cursorX += wordWidths[idx] + spaceW;
    });

    ctx.restore();
  };

  // Walkthrough / Session screen recording
  const handleStartSessionRecording = async () => {
    if (isRecordingSession) {
      if (sessionRecorderRef.current && sessionRecorderRef.current.state === 'recording') {
        sessionRecorderRef.current.stop();
      }
      setIsRecordingSession(false);
      return;
    }

    try {
      let stream: MediaStream;
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 },
          audio: true,
        });
      } else {
        const canvas = canvasRef.current;
        if (!canvas) return;
        stream = canvas.captureStream(30);
      }

      sessionChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4000000 });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) sessionChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(sessionChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ghi_Hinh_Thao_Tac_${(project.title || 'Studio').slice(0, 20).replace(/\s+/g, '_')}_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsRecordingSession(false);
      };

      sessionRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecordingSession(true);
    } catch (err) {
      console.warn('Session recording cancelled or failed:', err);
      setIsRecordingSession(false);
    }
  };

  // Real Video Export with Complete Mixed Stereo Audio
  const handleExportFullTimelineVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || isExportingVideo) return;

    try {
      setIsExportingVideo(true);
      setShowExportModal(true);
      setExportProgress(0);
      setExportStatusText('Đang nạp trước bộ âm thanh Neural TTS & giải mã DSP...');

      // Preload voiceover for all scenes
      synthRef.current?.preloadScenesVoiceover(scenes);

      // Resume synthesizer and start soundtrack
      synthRef.current?.resume();
      synthRef.current?.startCinematicSoundtrack(118);

      const canvasStream = canvas.captureStream(30);
      const audioTrack = synthRef.current?.getAudioStreamTrack();

      const combinedTracks = [...canvasStream.getVideoTracks()];
      if (audioTrack) {
        combinedTracks.push(audioTrack);
      }

      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 6000000,
        audioBitsPerSecond: 192000,
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        synthRef.current?.stopCinematicSoundtrack();
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setIsExportingVideo(false);
        setExportProgress(100);
        setExportStatusText('Xuất bản thành công! Đang tải file về máy...');

        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.code || 'SYNAPES'}_${project.title.slice(0, 24).replace(/\s+/g, '_')}_Master_HD.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => {
          setShowExportModal(false);
        }, 1800);
      };

      // Set playback to start
      seekToTime(exportScope === 'current' ? currentScene.startSec : 0);
      setIsPlaying(true);

      recorder.start(250);

      // Duration to record
      const targetDurationSec =
        exportScope === 'current' ? currentScene.endSec - currentScene.startSec : totalDuration;
      const totalMs = targetDurationSec * 1000;
      const startMs = Date.now();

      const timer = setInterval(() => {
        const elapsed = Date.now() - startMs;
        const pct = Math.min(99, Math.round((elapsed / totalMs) * 100));
        setExportProgress(pct);
        setExportStatusText(`Đang tổng hợp khung hình & lồng tiếng... (${pct}%)`);

        if (elapsed >= totalMs) {
          clearInterval(timer);
          if (recorder.state === 'recording') recorder.stop();
        }
      }, 300);
    } catch (err) {
      console.error('Export error:', err);
      setIsExportingVideo(false);
      synthRef.current?.stopCinematicSoundtrack();
      alert('Không thể xuất video: ' + String(err));
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
      containerRef.current.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  return (
    <div className="space-y-2 select-none" ref={containerRef}>
      {/* 1. NLE STUDIO EDITING TOOLBAR RIBBON */}
      <div className="p-2.5 rounded-xl bg-zinc-900 text-white flex flex-wrap items-center justify-between gap-2 text-xs shadow-md border border-white/10">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Split Scene (S) */}
          <button
            type="button"
            onClick={handleSplitScene}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center gap-1.5 transition cursor-pointer border border-white/10"
            title="Tách phân cảnh tại vị trí playhead (Phím tắt: S)"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>Tách cảnh</span>
            <kbd className="px-1 py-0.2 rounded bg-zinc-900 text-zinc-400 text-[9px] font-mono">S</kbd>
          </button>

          {/* Duplicate Scene (Ctrl+D) */}
          <button
            type="button"
            onClick={handleDuplicateScene}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center gap-1.5 transition cursor-pointer border border-white/10"
            title="Nhân đôi phân cảnh hiện tại (Phím tắt: Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nhân đôi</span>
          </button>

          {/* Delete Scene (Del) */}
          <button
            type="button"
            onClick={handleDeleteCurrentScene}
            className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/70 hover:text-rose-300 text-zinc-300 font-medium flex items-center gap-1 transition cursor-pointer border border-white/10"
            title="Xóa phân cảnh hiện tại khỏi timeline"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Xóa</span>
          </button>

          {/* Move Up/Down */}
          <div className="flex items-center bg-zinc-800 rounded-lg p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => handleMoveSceneOrder(-1)}
              disabled={currentSceneIndex === 0}
              className="p-1 rounded hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 cursor-pointer"
              title="Đưa cảnh lên trước"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleMoveSceneOrder(1)}
              disabled={currentSceneIndex === scenes.length - 1}
              className="p-1 rounded hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 cursor-pointer"
              title="Đưa cảnh xuống sau"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-zinc-700 mx-0.5"></div>

          {/* Upload custom B-roll media */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center gap-1.5 transition cursor-pointer border border-white/10"
            title="Tải lên ảnh hoặc video riêng từ máy tính cho phân cảnh này"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Đổi B-Roll / Ảnh</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,video/*"
            className="hidden"
          />

          {/* Internet Real Image Search Button */}
          <button
            type="button"
            onClick={() => setShowInternetImageModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-200 font-semibold flex items-center gap-1.5 transition cursor-pointer border border-sky-500/30 shadow-xs"
            title="Tìm và nạp dữ liệu hình ảnh sản phẩm thực tế từ Internet cho phân cảnh này"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Kho Ảnh Internet</span>
          </button>

          {/* Voice Studio Modal Button */}
          <button
            type="button"
            onClick={onOpenVoiceStudio}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-200 font-semibold flex items-center gap-1.5 transition cursor-pointer border border-indigo-500/30 shadow-xs"
            title="Mở phòng thu lồng tiếng AI đa vùng miền (Phím tắt: V)"
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span>Phòng Thu Giọng</span>
          </button>

          {/* Live Mic Direct Dubbing Button (CỬA SỔ THỨ 3) */}
          {onOpenLiveDubbingModal && (
            <button
              type="button"
              onClick={onOpenLiveDubbingModal}
              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm animate-pulse"
              title="Mở cửa sổ thứ 3 vừa xem video vừa thu âm lồng tiếng trực tiếp bằng micro"
            >
              <Mic className="w-3.5 h-3.5 fill-white" />
              <span>Thu Âm Trực Tiếp</span>
            </button>
          )}

          {/* LUT & VFX palette */}
          <button
            type="button"
            onClick={() => setShowLutPaletteModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center gap-1.5 transition cursor-pointer border border-white/10"
            title="Chọn bộ lọc màu điện ảnh & hiệu ứng quang học"
          >
            <Palette className="w-3.5 h-3.5 text-amber-300" />
            <span>Màu & VFX</span>
          </button>
        </div>

        {/* Right Tools: Snapshot 4K, Export Video, Shortcuts */}
        <div className="flex items-center gap-2">
          {/* Snapshot 4K */}
          <button
            type="button"
            onClick={handleSnapshot4K}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium flex items-center gap-1.5 transition cursor-pointer border border-white/10"
            title="Chụp ảnh khung hình 4K hiện tại (Phím tắt: Shift+S)"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Snapshot</span>
          </button>

          {/* Shortcuts Help */}
          <button
            type="button"
            onClick={onOpenShortcutsModal}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Bảng tra cứu phím tắt biên tập (Phím tắt: ?)"
          >
            <Keyboard className="w-4 h-4 text-zinc-400" />
          </button>

          {/* Record Screen / Session Button */}
          <button
            type="button"
            onClick={handleStartSessionRecording}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer border shadow-sm ${
              isRecordingSession
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-rose-300 border-rose-500/30'
            }`}
            title="Ghi hình toàn bộ quá trình thao tác trên màn hình (Lưu file .webm)"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isRecordingSession ? 'bg-white animate-ping' : 'bg-rose-500'}`}></span>
            <span>{isRecordingSession ? 'ĐANG GHI MÀN HÌNH...' : 'GHI THAO TÁC'}</span>
          </button>

          {/* Export Video Master Button */}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
            title="Xuất file Video thực tế (.webm full âm thanh)"
          >
            <Download className="w-4 h-4" />
            <span>XUẤT VIDEO (HD)</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN VIDEO VIEWPORT (HTML5 Canvas 60fps) */}
      <div
        className={`w-full mx-auto bg-zinc-950 rounded-2xl overflow-hidden relative border border-black/20 shadow-2xl flex items-center justify-center ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16] max-h-[520px]'
          }`}
      >
        <canvas
          ref={canvasRef}
          width={aspectRatio === '16:9' ? 1280 : 720}
          height={aspectRatio === '16:9' ? 720 : 1280}
          className="w-full h-full object-contain cursor-pointer"
          onClick={() => setIsPlaying((p) => !p)}
        />

        {/* Big tactile Play button when paused */}
        {!isPlaying && (
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer"
            onClick={() => setIsPlaying(true)}
          >
            <div className="w-16 h-16 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow-2xl transition hover:scale-110 active:scale-95">
              <Play className="w-7 h-7 ml-1 fill-zinc-900 text-zinc-900" />
            </div>
          </div>
        )}
      </div>

      {/* 3. MULTI-SCENE TIMELINE SCRUBBER & TRANSPORT CONTROLS */}
      <div className="p-3 rounded-xl bg-zinc-900 text-white space-y-2 border border-white/10 shadow-md">
        {/* Scrubber Bar with Scene Segments */}
        <div className="relative w-full h-4 bg-zinc-800 rounded-full overflow-hidden cursor-pointer flex items-center">
          {/* Scene boundaries indicators */}
          {scenes.map((s, idx) => {
            const leftPct = (s.startSec / totalDuration) * 100;
            const widthPct = ((s.endSec - s.startSec) / totalDuration) * 100;
            const isCurrent = currentSceneIndex === idx;
            return (
              <div
                key={s.id}
                onClick={(e) => {
                  e.stopPropagation();
                  seekToTime(s.startSec + 0.08);
                  onSelectScene?.(s.id);
                }}
                className={`absolute top-0 bottom-0 border-r border-zinc-950 transition ${isCurrent ? 'bg-indigo-600/35' : 'bg-transparent hover:bg-white/10'
                  }`}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                title={`Cảnh ${s.sceneNumber}: ${s.headline || s.timeRange}`}
              />
            );
          })}

          {/* Progress fill */}
          <div
            className="h-full bg-indigo-500 transition-all duration-75 pointer-events-none"
            style={{ width: `${(currentTime / totalDuration) * 100}%` }}
          />

          {/* Playhead thumb */}
          <div
            className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-md pointer-events-none -ml-1"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
          />

          {/* Direct click input */}
          <input
            type="range"
            min="0"
            max={totalDuration}
            step="0.05"
            value={currentTime}
            onChange={(e) => seekToTime(parseFloat(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>

        {/* Transport Buttons & Secondary Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          {/* Left Transport controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => jumpScene(-1)}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
              title="Về phân cảnh trước (Shift + ←)"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="px-3 py-1.5 rounded-lg bg-white text-zinc-900 font-bold flex items-center gap-1.5 hover:bg-zinc-200 transition cursor-pointer shadow-sm"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-zinc-900" /> : <Play className="w-4 h-4 fill-zinc-900" />}
              <span>{isPlaying ? 'Tạm Dừng' : 'Phát Tiếp'}</span>
            </button>

            <button
              type="button"
              onClick={() => jumpScene(1)}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
              title="Sang phân cảnh kế tiếp (Shift + →)"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Time readout */}
            <div className="font-mono text-zinc-300 text-xs px-2 py-1 bg-zinc-800 rounded-md">
              <span className="text-white font-bold">{formatTime(currentTime)}</span> / {formatTime(totalDuration)}
            </div>

            {/* Speed selector */}
            <div className="flex items-center bg-zinc-800 rounded-md p-0.5 text-[10px] font-mono">
              {[1.0, 1.25, 1.5].map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setPlaybackSpeed(sp)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${playbackSpeed === sp ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>

          {/* Right controls: Subtitle Style, Letterbox, Audio Mute, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Subtitle Style Switcher */}
            <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1 text-[11px]">
              <Subtitles className="w-3.5 h-3.5 text-zinc-400 ml-1" />
              {(['hormozi', 'capcut', 'netflix', 'off'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setSubtitleStyle(style)}
                  className={`px-2 py-0.5 rounded capitalize transition cursor-pointer ${subtitleStyle === style ? 'bg-zinc-950 text-white font-semibold shadow-xs' : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  {style}
                </button>
              ))}
            </div>

            {/* Subtitle Position */}
            <button
              type="button"
              onClick={() =>
                setSubtitlePosition((p) => (p === 'bottom' ? 'center' : p === 'center' ? 'top' : 'bottom'))
              }
              className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono capitalize transition cursor-pointer"
              title="Đổi vị trí phụ đề: Dưới / Giữa / Trên"
            >
              Vị trí: {subtitlePosition}
            </button>

            {/* Letterbox 2.39:1 toggle */}
            {aspectRatio === '16:9' && (
              <button
                type="button"
                onClick={() => setAnamoLetterbox((b) => !b)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer ${anamoLetterbox ? 'bg-indigo-600 text-white font-bold' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                title="Bật/Tắt vạch đen điện ảnh 2.39:1"
              >
                2.39:1
              </button>
            )}

            {/* Audio Mute toggle */}
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${isMuted ? 'bg-rose-950 text-rose-300' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                }`}
              title={isMuted ? 'Bật tiếng (Phím M)' : 'Tắt tiếng (Phím M)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
              title="Toàn màn hình (Phím F)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. MODAL BỘ LỌC MÀU & HIỆU ỨNG (COLOR GRADE & VFX) */}
      {showLutPaletteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
          onClick={(e) => e.target === e.currentTarget && setShowLutPaletteModal(false)}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-black/10 overflow-hidden flex flex-col p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-zinc-950 text-sm">Bộ Lọc Màu & Hiệu Ứng Điện Ảnh</h3>
              </div>
              <button
                onClick={() => setShowLutPaletteModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-800 block mb-1.5">Màu Sắc Điện Ảnh (Color Grade LUT):</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'teal-orange', name: 'Teal & Orange (Hollywood)', desc: 'Điểm nhấn xanh ngọc & cam ấm' },
                    { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'Sắc tím hồng neon & cyan tương phản' },
                    { id: 'studio-clean', name: 'Apple Studio Clean', desc: 'Trong trẻo, tối giản, ánh sáng trung tính' },
                    { id: 'vintage-film', name: 'Vintage 35mm Film', desc: 'Ấm áp hoài cổ, dải màu vàng nắng' },
                    { id: 'monochrome', name: 'Monochrome Noir', desc: 'Đen trắng điện ảnh sâu lắng' },
                    { id: 'none', name: 'Nguyên Bản (No LUT)', desc: 'Giữ nguyên màu sắc gốc của ảnh' },
                  ].map((lut) => (
                    <button
                      key={lut.id}
                      type="button"
                      onClick={() => setActiveLut(lut.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${activeLut === lut.id
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                          : 'bg-zinc-50 border-black/[0.06] hover:bg-zinc-100'
                        }`}
                    >
                      <div className="font-bold text-zinc-900">{lut.name}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{lut.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-black/[0.06]">
                <label className="font-semibold text-zinc-800 block mb-1.5">Hiệu Ứng Quang Học (Optical VFX):</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'film-grain', name: 'Hạt Phim 35mm (Film Grain)', desc: 'Chuyển động hạt phim cổ điển 60fps' },
                    { id: 'light-leak', name: 'Vệt Sáng (Anamorphic Streak)', desc: 'Vệt sáng quét ngang ống kính' },
                    { id: 'vignette', name: 'Vignette Quang Học', desc: 'Góc tối điện ảnh làm nổi bật chủ thể' },
                    { id: 'none', name: 'Tắt VFX', desc: 'Không áp dụng lớp phủ hiệu ứng' },
                  ].map((fx) => (
                    <button
                      key={fx.id}
                      type="button"
                      onClick={() => setActiveVfx(fx.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${activeVfx === fx.id
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                          : 'bg-zinc-50 border-black/[0.06] hover:bg-zinc-100'
                        }`}
                    >
                      <div className="font-bold text-zinc-900">{fx.name}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{fx.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-black/[0.08] flex justify-end">
              <button
                type="button"
                onClick={() => setShowLutPaletteModal(false)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hoàn Tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL XUẤT VIDEO (FULL AUDIO & STEREO MIXING EXPORT) */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
          onClick={(e) => !isExportingVideo && e.target === e.currentTarget && setShowExportModal(false)}
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-black/10 overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-zinc-950 text-sm">Xuất Video Đầy Đủ Âm Thanh & Phụ Đề</h3>
              </div>
              {!isExportingVideo && (
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {!isExportingVideo ? (
              <div className="space-y-3.5 text-xs">
                <p className="text-zinc-600 leading-relaxed">
                  Hệ thống sẽ ghi hình trực tiếp toàn bộ dòng khung hình 60fps kèm <strong>3 luồng âm thanh Stereo</strong> (Nhạc nền BGM + Lồng tiếng Voiceover AI + Hiệu ứng SFX chuyển cảnh).
                </p>

                <div className="p-3 rounded-xl bg-zinc-50 border border-black/[0.06] space-y-2">
                  <div className="font-semibold text-zinc-800">Chọn phạm vi xuất:</div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'full'}
                      onChange={() => setExportScope('full')}
                      className="text-zinc-900 focus:ring-0"
                    />
                    <span className="text-zinc-900 font-medium">
                      Toàn bộ dự án ({scenes.length} phân cảnh • {formatTime(totalDuration)})
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'current'}
                      onChange={() => setExportScope('current')}
                      className="text-zinc-900 focus:ring-0"
                    />
                    <span className="text-zinc-900 font-medium">
                      Chỉ cảnh hiện tại (Cảnh {currentSceneIndex + 1} • {currentScene.endSec - currentScene.startSec}s)
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>Định dạng: WebM / VP9 HD</span>
                  <span>Âm thanh: Stereo 48kHz</span>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 hover:text-zinc-900 font-medium transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleExportFullTimelineVideo}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Bắt Đầu Xuất Video</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-spin">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm">Đang Kết Xuất Master Video...</h4>
                  <p className="text-zinc-500 text-xs font-mono mt-1">{exportStatusText}</p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <div className="font-mono text-zinc-400 text-xs">{exportProgress}% hoàn tất</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. MODAL KHO ẢNH THỰC TẾ INTERNET (REAL INTERNET IMAGE SEARCH & PROXY) */}
      {showInternetImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
          onClick={(e) => e.target === e.currentTarget && setShowInternetImageModal(false)}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-black/10 overflow-hidden flex flex-col p-5 space-y-4 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-600" />
                <div>
                  <h3 className="font-bold text-zinc-950 text-sm">
                    Kho Dữ Liệu Hình Ảnh Thực Tế Trên Internet (CORS-Safe HD Proxy)
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Đang chọn ảnh cho: <strong>Cảnh {currentSceneIndex + 1} ({currentScene?.headline})</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInternetImageModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={internetSearchQuery}
                  onChange={(e) => setInternetSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchInternetImages(internetSearchQuery)}
                  placeholder="Nhập từ khóa tìm ảnh trên Internet (VD: iPhone 18 Pro Max, Apple A20 Chip, OLED...)"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-black/15 focus:outline-none focus:border-zinc-900 text-zinc-900"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSearchInternetImages(internetSearchQuery)}
                disabled={isSearchingInternet}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer transition"
              >
                {isSearchingInternet ? 'Đang tìm...' : 'Tìm Trên Internet'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1 max-h-[420px]">
              {internetImages.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleApplyInternetImageToScene(item.proxyUrl)}
                  className="group rounded-xl overflow-hidden border border-black/10 hover:border-sky-500 bg-zinc-950 cursor-pointer transition flex flex-col shadow-xs"
                >
                  <div className="aspect-video w-full overflow-hidden bg-zinc-900 relative">
                    <img
                      src={item.proxyUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/75 text-white text-[9px] font-mono">
                      Áp dụng ngay
                    </span>
                  </div>
                  <div className="p-2 bg-white">
                    <div className="text-[11px] font-bold text-zinc-900 line-clamp-1">{item.title}</div>
                    <div className="text-[9px] text-zinc-500 mt-0.5">{item.source}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
