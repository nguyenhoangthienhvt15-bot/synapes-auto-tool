import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Project,
  StoryboardScene,
  ColorGradeLut,
  VfxOverlayType,
  SubtitleStyle,
  SubtitlePosition,
  VideoGenre,
} from '../types';
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
import {
  buildAiSceneImageUrl,
  classifyTopicDomainClient,
  detectVideoGenre,
  extractCleanSubject,
  CLIENT_DOMAIN_PHOTO_POOLS,
} from '../services/aiScriptGeneratorService';
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

  const effectiveDomain = classifyTopicDomainClient(
    `${project.title} ${(project.metadata?.tags || []).join(' ')}`
  );
  const effectiveGenre: VideoGenre =
    project.videoGenre || detectVideoGenre(project.title, project.title, effectiveDomain);
  const isHardwareKeynoteProject =
    effectiveGenre === 'apple-keynote' && effectiveDomain === 'hardware';

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(true);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('apple-minimal');
  const [subtitlePosition, setSubtitlePosition] = useState<SubtitlePosition>('bottom');
  const [activeLut, setActiveLut] = useState<ColorGradeLut>(() =>
    effectiveGenre === 'news-broadcast' || effectiveGenre === 'finance-analysis'
      ? 'studio-clean'
      : 'apple-keynote'
  );
  const [activeVfx, setActiveVfx] = useState<VfxOverlayType>(() =>
    effectiveGenre === 'news-broadcast' || effectiveGenre === 'finance-analysis'
      ? 'vignette'
      : 'apple-lens-flare'
  );
  const [anamoLetterbox, setAnamoLetterbox] = useState<boolean>(false);
  const [visualRenderMode, setVisualRenderMode] = useState<
    'auto-genre' | 'news-24h' | 'hybrid-3d' | 'clean-photo'
  >('auto-genre');
  const [showBroadcastHud, setShowBroadcastHud] = useState<boolean>(false);

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
  const [internetSearchQuery, setInternetSearchQuery] = useState<string>(() =>
    extractCleanSubject(project.title)
  );
  const [internetImages, setInternetImages] = useState<
    Array<{ id: string; title: string; url: string; proxyUrl: string; source: string }>
  >([]);
  const [isSearchingInternet, setIsSearchingInternet] = useState<boolean>(false);

  // Tự động đồng bộ từ khóa tìm kiếm ảnh & bộ lọc màu khi chuyển sang dự án mới
  useEffect(() => {
    setInternetSearchQuery(extractCleanSubject(project.title));
    setInternetImages([]);
    setVisualRenderMode('auto-genre');
    if (effectiveGenre === 'news-broadcast' || effectiveGenre === 'finance-analysis') {
      setActiveLut('studio-clean');
      setActiveVfx('vignette');
    } else {
      setActiveLut('apple-keynote');
      setActiveVfx('apple-lens-flare');
    }
  }, [project.id, project.title, effectiveGenre]);

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

  // Preload Real Internet Images via CORS-Safe Proxy (Phân tách 100% theo lĩnh vực dự án)
  useEffect(() => {
    let isMounted = true;
    loadedImagesRef.current = {};
    setLoadedCount(0);

    const domainPhotos =
      CLIENT_DOMAIN_PHOTO_POOLS[effectiveDomain] || CLIENT_DOMAIN_PHOTO_POOLS.news;
    const curatedPool = domainPhotos.map(
      (u, poolIdx) =>
        `/api/image-proxy?domain=${effectiveDomain}&idx=${poolIdx}&url=${encodeURIComponent(u)}`
    );

    scenes.forEach((sc, idx) => {
      const rawSource =
        sc.customMediaUrl ||
        sc.imageUrl ||
        buildAiSceneImageUrl(
          sc.visualPrompt,
          aspectRatio,
          idx + 1 + regenVersion * 17,
          effectiveDomain
        );

      // Route external http/https URLs through /api/image-proxy so Canvas is never CORS-tainted
      const mediaSource =
        rawSource.startsWith('http://') || rawSource.startsWith('https://')
          ? `/api/image-proxy?domain=${effectiveDomain}&idx=${idx}&url=${encodeURIComponent(rawSource)}`
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
        fb.onerror = () => {
          if (!isMounted) return;
          // Static-host fallback (e.g. Render Static Site without /api/image-proxy): load CORS-enabled HTTPS photo directly
          const directPhoto = new Image();
          directPhoto.crossOrigin = 'anonymous';
          let directSrc = domainPhotos[idx % domainPhotos.length];
          if (rawSource.startsWith('https://')) {
            directSrc = rawSource;
          } else if (rawSource.includes('url=')) {
            try {
              const uParam = new URL(rawSource, window.location.origin).searchParams.get('url');
              if (uParam && uParam.startsWith('https://')) directSrc = uParam;
            } catch {}
          }
          directPhoto.src = directSrc;
          directPhoto.onload = () => {
            if (!isMounted) return;
            loadedImagesRef.current[sc.id] = directPhoto;
            setLoadedCount((c) => Math.min(scenes.length, c + 1));
            drawCinemaCanvasRef.current(performance.now() / 1000, currentTimeRef.current);
          };
        };
      };
    });

    return () => {
      isMounted = false;
    };
  }, [project.id, scenes, aspectRatio, regenVersion, effectiveDomain]);

  // Jump to scene when activeSceneId changes
  useEffect(() => {
    if (activeSceneId != null) {
      const target = scenes.find((s) => s.id === activeSceneId);
      if (target) {
        seekToTime(target.startSec + 0.08);
      }
    }
  }, [activeSceneId, scenes, seekToTime]);

  // Search Internet Images Handler (Supports /api/image-search + Direct Wikimedia CORS Fallback for Static Sites)
  const handleSearchInternetImages = useCallback(async (queryStr: string) => {
    setIsSearchingInternet(true);
    try {
      const res = await fetch(`/api/image-search?q=${encodeURIComponent(queryStr)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.images) && data.images.length > 0) {
          setInternetImages(data.images);
          return;
        }
      }
      // Fallback for Static Hosting (Wikimedia Commons CORS API + Domain Curated Pool)
      const qDomain = classifyTopicDomainClient(queryStr);
      const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(queryStr)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json&origin=*`;
      const fbImages: Array<{ id: string; title: string; url: string; source: string; proxyUrl: string }> = [];
      try {
        const wRes = await fetch(wikiUrl);
        if (wRes.ok) {
          const wData = await wRes.json();
          const pages = Object.values(wData?.query?.pages || {}) as any[];
          pages.forEach((p, idx) => {
            const thumb = p?.imageinfo?.[0]?.thumburl || p?.imageinfo?.[0]?.url;
            if (thumb && /\.(jpe?g|png|webp)$/i.test(thumb)) {
              fbImages.push({
                id: `wiki-${idx}`,
                title: String(p.title || queryStr).replace(/^File:/i, '').replace(/\.[a-z0-9]+$/i, ''),
                url: thumb,
                source: 'Wikimedia Commons Live',
                proxyUrl: thumb,
              });
            }
          });
        }
      } catch {}
      const pool = CLIENT_DOMAIN_PHOTO_POOLS[qDomain] || CLIENT_DOMAIN_PHOTO_POOLS.news;
      pool.forEach((u, idx) => {
        fbImages.push({
          id: `curated-${qDomain}-${idx}`,
          title: `${queryStr} — Tư liệu HD #${idx + 1}`,
          url: u,
          source: `Kho Tư Liệu Báo Chí (${qDomain.toUpperCase()})`,
          proxyUrl: u,
        });
      });
      setInternetImages(fbImages.slice(0, 12));
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

  // Dynamic Context Callout Card (Top-Right HUD — tự động thích ứng theo đúng Chủ đề & Thể loại dự án)
  const drawDynamicContextCalloutCard = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    scene: StoryboardScene,
    sceneIdx: number,
    totalScenes: number,
    progress: number,
    clockSec: number
  ) => {
    let badge = 'THÔNG TIN PHÂN CẢNH';
    let specs: string[] = [];
    let accent = '#38bdf8';

    if (isHardwareKeynoteProject) {
      const hwPresets = [
        {
          badge: 'AEROSPACE TITANIUM ARCHITECTURE',
          specs: ['CHASSIS: BRUSHED TITANIUM', 'DISPLAY: LTPO OLED 120HZ', 'HDR PEAK: 3,000+ NITS'],
          accent: '#38bdf8',
        },
        {
          badge: 'NEXT-GEN 2NM SILICON ENGINE',
          specs: ['PROCESS: 2NM GAA ARCHITECTURE', 'NEURAL NPU: ON-DEVICE AI', 'RAY TRACING: HARDWARE ACCEL'],
          accent: '#facc15',
        },
        {
          badge: 'PRO OPTICAL CAMERA SYSTEM',
          specs: ['MAIN SENSOR: 48MP RAW LOG', 'TELEPHOTO: PERISCOPE ZOOM', 'STABILIZATION: 3D SENSOR SHIFT'],
          accent: '#10b981',
        },
      ];
      const p = hwPresets[sceneIdx % hwPresets.length];
      badge = p.badge;
      specs = p.specs;
      accent = p.accent;
    } else {
      const domainLabels: Record<string, { label: string; color: string }> = {
        geopolitics: { label: 'HỒ SƠ ĐỊA CHÍNH TRỊ • 24H', color: '#ef4444' },
        news: { label: 'BẢN TIN THỜI SỰ TRỰC TIẾP', color: '#dc2626' },
        finance: { label: 'DỮ LIỆU VĨ MÔ & THỊ TRƯỜNG', color: '#0ea5e9' },
        science: { label: 'TƯ LIỆU KHOA HỌC & VŨ TRỤ', color: '#38bdf8' },
        history: { label: 'HỒ SƠ LỊCH SỬ & DI SẢN', color: '#f59e0b' },
        food: { label: 'VĂN HÓA ẨM THỰC ĐẶC SẮC', color: '#f97316' },
        travel: { label: 'HÀNH TRÌNH KHÁM PHÁ', color: '#10b981' },
        sports: { label: 'TIÊU ĐIỂM THỂ THAO', color: '#22c55e' },
        'ai-cyber': { label: 'CÔNG NGHỆ & BÁN DẪN AI', color: '#06b6d4' },
        'animation-3d': { label: 'HOẠT HÌNH 3D PIXAR • ĐẾM SỐ', color: '#22c55e' },
      };
      const meta = domainLabels[effectiveDomain] || domainLabels.news;
      badge = meta.label;
      accent = meta.color;

      const cleanSubj = extractCleanSubject(project.title).slice(0, 28).toUpperCase();
      const tagStr =
        (project.metadata?.tags || [])
          .slice(0, 2)
          .map((t) => `#${t.replace(/^#/, '')}`)
          .join(' ') || '#TinNong24h';

      specs = [
        `CHỦ ĐỀ: ${cleanSubj}`,
        `CẢNH: 0${sceneIdx + 1}/0${totalScenes} • ${(scene.cameraMotion || 'DOLLY-IN').toUpperCase()}`,
        `TAGS: ${tagStr.slice(0, 30)}`,
      ];
    }

    const cardW = Math.min(315, W * 0.28);
    const cardH = 106;
    const cardX = W - cardW - W * 0.035;
    const cardY = anamoLetterbox && aspectRatio === '16:9' ? H * 0.13 : H * 0.05;

    ctx.save();
    const slideAlpha = Math.min(1, progress * 6);
    ctx.globalAlpha = slideAlpha * 0.94;

    ctx.fillStyle = 'rgba(9, 9, 15, 0.82)';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = accent;
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`◆ ${badge}`, cardX + 12, cardY + 20);

    ctx.fillStyle = '#f4f4f5';
    ctx.font = '600 10px Inter, system-ui, sans-serif';
    specs.forEach((line, idx) => {
      ctx.fillText(line, cardX + 12, cardY + 40 + idx * 17);
    });

    const barW = cardW - 24;
    const barY = cardY + cardH - 14;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.beginPath();
    ctx.roundRect(cardX + 12, barY, barW, 4, 2);
    ctx.fill();

    const fillW = barW * Math.min(1, 0.25 + progress * 0.75);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(cardX + 12, barY, fillW, 4, 2);
    ctx.fill();

    const pulse = 0.5 + 0.5 * Math.sin(clockSec * 6);
    ctx.fillStyle = accent;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(cardX + cardW - 14, cardY + 16, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Trường quay Đồ họa Thời sự & Phim tài liệu khi ảnh đang tải (Không bao giờ vẽ nhầm mô hình iPhone)
  const drawEditorialBroadcastStage = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    clockSec: number,
    scene: StoryboardScene
  ) => {
    ctx.save();
    const isNewsLike =
      effectiveGenre === 'news-broadcast' ||
      effectiveDomain === 'geopolitics' ||
      effectiveDomain === 'news';
    const primaryHue = isNewsLike ? '220, 38, 38' : '14, 165, 233';

    const bg = ctx.createRadialGradient(W * 0.5, H * 0.45, W * 0.05, W * 0.5, H * 0.5, W * 0.8);
    bg.addColorStop(0, isNewsLike ? '#1e1b2e' : '#0f172a');
    bg.addColorStop(0.65, '#090d16');
    bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // World coordinate grid lines
    ctx.strokeStyle = `rgba(${primaryHue}, 0.14)`;
    ctx.lineWidth = 1;
    const step = Math.max(36, Math.round(W / 22));
    const drift = (clockSec * 14) % step;
    for (let x = -step + drift; x < W + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = step * 0.5; y < H; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Rotating global radar / latitude rings
    const cx = W * 0.5;
    const cy = H * 0.46;
    const baseR = Math.min(W, H) * 0.24;
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(clockSec * (0.18 + i * 0.07) * (i % 2 === 0 ? 1 : -1));
      ctx.strokeStyle = `rgba(${primaryHue}, ${0.32 - i * 0.08})`;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([10 + i * 6, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, baseR + i * 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Center headline preview while HD photo streams in
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.max(15, Math.round(W * 0.022))}px Inter, system-ui, sans-serif`;
    const cleanHead = (scene.headline || extractCleanSubject(project.title)).slice(0, 56);
    ctx.fillText(cleanHead, cx, cy + 6);
    ctx.restore();
  };

  // GÓI ĐỒ HỌA BẢN TIN TRUYỀN HÌNH 24H (Live Bug + Lower-Third + Dải chữ chạy Tin nóng 60fps)
  const drawNewsBroadcastPackage = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    scene: StoryboardScene,
    sceneIdx: number,
    totalScenes: number,
    progress: number,
    clockSec: number
  ) => {
    ctx.save();
    const isFinance = effectiveGenre === 'finance-analysis' || effectiveDomain === 'finance';
    const primaryColor = isFinance ? '#0284c7' : '#dc2626';
    const padX = W * 0.04;
    const topY = anamoLetterbox && aspectRatio === '16:9' ? H * 0.13 : H * 0.045;

    // 1. Top-Left Live Broadcast Pill + Clock
    const livePulse = 0.45 + 0.55 * Math.abs(Math.sin(clockSec * 4.2));
    const badgeH = Math.max(24, Math.round(H * 0.04));
    const liveBoxW = Math.max(92, Math.round(W * 0.095));

    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.roundRect(padX, topY, liveBoxW, badgeH, 5);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${livePulse})`;
    ctx.beginPath();
    ctx.arc(padX + 12, topY + badgeH / 2, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${Math.max(10, Math.round(badgeH * 0.46))}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('TRỰC TIẾP', padX + 21, topY + badgeH / 2 + 0.5);

    // Sub-pill right next to TRỰC TIẾP
    const channelLabel = isFinance ? 'TIÊU ĐIỂM VĨ MÔ & TÀI CHÍNH' : 'BẢN TIN THỜI SỰ QUỐC TẾ 24H';
    ctx.font = `700 ${Math.max(10, Math.round(badgeH * 0.44))}px Inter, system-ui, monospace`;
    const chanW = ctx.measureText(channelLabel).width + 22;
    ctx.fillStyle = 'rgba(9, 9, 14, 0.82)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(padX + liveBoxW + 6, topY, chanW, badgeH, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f4f4f5';
    ctx.fillText(channelLabel, padX + liveBoxW + 17, topY + badgeH / 2 + 0.5);

    // 2. Broadcast Lower-Third Headline Banner (positioned cleanly above ticker)
    const tickerH = Math.max(28, Math.round(H * 0.048));
    const tickerY = H - tickerH - (anamoLetterbox && aspectRatio === '16:9' ? H * 0.11 : 0);

    if (scene.headline) {
      const cleanHeadline = scene.headline.replace(/^\d+\.\s*/, '').trim();
      const bannerH = Math.max(36, Math.round(H * 0.062));
      const bannerY = tickerY - bannerH - Math.max(8, H * 0.014);
      const bannerW = Math.min(W - padX * 2, Math.max(W * 0.58, 420));
      const slideIn = Math.min(1, progress * 6);

      ctx.save();
      ctx.globalAlpha = 0.96 * slideIn;
      ctx.fillStyle = 'rgba(10, 12, 18, 0.88)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(padX, bannerY, bannerW, bannerH, 6);
      ctx.fill();
      ctx.stroke();

      // Left crimson/cobalt accent bar
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.roundRect(padX, bannerY, 6, bannerH, [6, 0, 0, 6]);
      ctx.fill();

      // Scene index tag
      ctx.fillStyle = isFinance ? '#38bdf8' : '#fca5a5';
      ctx.font = `700 ${Math.max(9, Math.round(bannerH * 0.25))}px monospace`;
      ctx.fillText(
        `PHÂN ĐOẠN 0${sceneIdx + 1}/0${totalScenes} • ${extractCleanSubject(project.title).slice(0, 38).toUpperCase()}`,
        padX + 16,
        bannerY + bannerH * 0.3
      );

      // Bold headline text
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${Math.max(12, Math.round(bannerH * 0.4))}px Inter, system-ui, sans-serif`;
      ctx.fillText(cleanHeadline.slice(0, 68), padX + 16, bannerY + bannerH * 0.73);
      ctx.restore();
    }

    // 3. Bottom Scrolling Breaking News Ticker (60fps smooth marquee)
    ctx.fillStyle = 'rgba(8, 10, 15, 0.94)';
    ctx.fillRect(0, tickerY, W, tickerH);
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, tickerY, W, 2);

    const tagBoxW = Math.max(96, Math.round(W * 0.1));
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, tickerY, tagBoxW, tickerH);

    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${Math.max(10, Math.round(tickerH * 0.44))}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(isFinance ? 'THỊ TRƯỜNG' : 'TIN NÓNG 24H', 12, tickerY + tickerH / 2 + 1);

    const rawTicker =
      project.newsTickerText ||
      scenes
        .map((s) => (s.headline || '').replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean)
        .join('   •   ') ||
      extractCleanSubject(project.title);
    const fullTickerStr = `${rawTicker}   •   ${rawTicker}   •   `;

    ctx.save();
    ctx.beginPath();
    ctx.rect(tagBoxW, tickerY, W - tagBoxW, tickerH);
    ctx.clip();

    ctx.fillStyle = '#f4f4f5';
    ctx.font = `600 ${Math.max(11, Math.round(tickerH * 0.44))}px Inter, system-ui, sans-serif`;
    const singleWidth = Math.max(300, ctx.measureText(`${rawTicker}   •   `).width);
    const scrollPx = (clockSec * 72) % singleWidth;
    ctx.fillText(fullTickerStr, tagBoxW + 16 - scrollPx, tickerY + tickerH / 2 + 1);
    ctx.restore();

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

  // SÂN KHẤU NHÂN VẬT HOẠT HÌNH 3D XƯƠNG KHỚP (Skeletal 3D Insect Rigging + Counting Badge 60fps)
  const draw3dAnimationInsectStage = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    clockSec: number,
    sceneIdx: number,
    progress: number
  ) => {
    const countN = Math.max(1, Math.min(10, sceneIdx + 1));
    const palettes = [
      { body: '#22c55e', hi: '#86efac', belly: '#fef08a', wing: 'rgba(186,230,253,0.62)' },
      { body: '#eab308', hi: '#fef08a', belly: '#78350f', wing: 'rgba(224,242,254,0.65)' },
      { body: '#ef4444', hi: '#fca5a5', belly: '#1e293b', wing: 'rgba(254,226,226,0.58)' },
      { body: '#06b6d4', hi: '#a5f3fc', belly: '#fef9c3', wing: 'rgba(207,250,254,0.65)' },
      { body: '#a855f7', hi: '#e9d5ff', belly: '#fde047', wing: 'rgba(243,232,255,0.62)' },
    ];

    ctx.save();
    const cols = countN <= 5 ? countN : Math.ceil(countN / 2);
    const rows = countN <= 5 ? 1 : 2;
    const baseScale = countN <= 2 ? 1.0 : countN <= 5 ? 0.78 : 0.62;

    for (let i = 0; i < countN; i++) {
      const row = rows === 1 ? 0 : Math.floor(i / cols);
      const col = rows === 1 ? i : i % cols;
      const itemsInRow = rows === 1 ? countN : row === 0 ? cols : countN - cols;
      const spanW = W * 0.72;
      const startX = (W - spanW) / 2;
      const cx =
        itemsInRow === 1
          ? W * 0.5
          : startX + (col / Math.max(1, itemsInRow - 1)) * spanW;
      const baseGroundY = rows === 1 ? H * 0.72 : row === 0 ? H * 0.63 : H * 0.77;

      const phase = clockSec * 6.8 + i * 0.85;
      const jump = Math.max(0, Math.sin(phase));
      const jumpY = -jump * H * 0.075 * baseScale;
      const squashX = 1 + (1 - jump) * 0.08 - jump * 0.06;
      const squashY = 1 - (1 - jump) * 0.08 + jump * 0.08;
      const pal = palettes[i % palettes.length];
      const r = Math.min(W, H) * 0.048 * baseScale;

      // Ground contact shadow
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${0.38 * (1 - jump * 0.55)})`;
      ctx.beginPath();
      ctx.ellipse(cx, baseGroundY + r * 0.95, r * 1.15 * (1 - jump * 0.35), r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, baseGroundY + jumpY);
      ctx.scale(squashX, squashY);

      // Flapping 3D wings (20Hz)
      const wingAngle = Math.sin(clockSec * 38 + i) * 0.48;
      for (const dir of [-1, 1]) {
        ctx.save();
        ctx.translate(dir * r * 0.35, -r * 0.35);
        ctx.rotate(dir * (0.55 + wingAngle));
        ctx.fillStyle = pal.wing;
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(dir * r * 0.7, -r * 0.2, r * 0.85, r * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Articulated legs
      const legKick = Math.sin(phase) * 0.35;
      ctx.strokeStyle = pal.body;
      ctx.lineWidth = Math.max(3, r * 0.22);
      ctx.lineCap = 'round';
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(dir * r * 0.35, r * 0.35);
        ctx.lineTo(dir * r * (0.75 + legKick * 0.3), r * (0.65 - jump * 0.2));
        ctx.lineTo(dir * r * 0.52, r * 0.95);
        ctx.stroke();
      }

      // 3D Shaded Thorax/Abdomen
      const bodyGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.2, r * 0.1, 0, 0, r * 1.05);
      bodyGrad.addColorStop(0, pal.hi);
      bodyGrad.addColorStop(0.55, pal.body);
      bodyGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.1, r * 0.72, r * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();

      // Waving Arms
      const armWave = Math.sin(clockSec * 9.5 + i * 1.3) * 0.55;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(dir * r * 0.55, -r * 0.1);
        ctx.lineTo(dir * r * 1.15, -r * (0.45 + dir * armWave * 0.45));
        ctx.stroke();
      }

      // 3D Head with Specular Highlight
      const headY = -r * 0.85;
      const headGrad = ctx.createRadialGradient(-r * 0.25, headY - r * 0.25, r * 0.08, 0, headY, r * 0.78);
      headGrad.addColorStop(0, pal.hi);
      headGrad.addColorStop(0.65, pal.body);
      headGrad.addColorStop(1, '#14532d');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(0, headY, r * 0.72, 0, Math.PI * 2);
      ctx.fill();

      // Spring Antennae
      const antSway = Math.sin(clockSec * 8 + i) * r * 0.22;
      ctx.lineWidth = Math.max(2, r * 0.12);
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(dir * r * 0.28, headY - r * 0.62);
        ctx.quadraticCurveTo(
          dir * r * 0.55 + antSway,
          headY - r * 1.25,
          dir * r * 0.75 + antSway,
          headY - r * 1.35
        );
        ctx.stroke();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(dir * r * 0.75 + antSway, headY - r * 1.35, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
      }

      // Big Glossy Pixar Eyes + Blink
      const isBlinking = Math.sin(clockSec * 3.1 + i * 1.7) > 0.94;
      for (const dir of [-1, 1]) {
        const ex = dir * r * 0.28;
        const ey = headY - r * 0.06;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(ex, ey, r * 0.22, isBlinking ? r * 0.03 : r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        if (!isBlinking) {
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(ex + dir * r * 0.03, ey, r * 0.12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex - r * 0.04, ey - r * 0.07, r * 0.05, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Lip-synced Singing Mouth
      const mouthOpen = 0.25 + 0.75 * Math.abs(Math.sin(clockSec * 11.5 + i * 0.5));
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.ellipse(0, headY + r * 0.32, r * 0.22, r * (0.06 + mouthOpen * 0.16), 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 3D Extruded Counting Number Badge (Top-Left)
    const badgeX = W * 0.08;
    const badgeY = H * 0.18;
    const badgeR = Math.min(W, H) * 0.075;
    const popScale = 1 + Math.sin(clockSec * 6.8) * 0.06 * Math.min(1, progress * 4);
    ctx.save();
    ctx.translate(badgeX, badgeY);
    ctx.scale(popScale, popScale);
    const numGrad = ctx.createRadialGradient(-badgeR * 0.3, -badgeR * 0.3, badgeR * 0.1, 0, 0, badgeR);
    numGrad.addColorStop(0, '#fef08a');
    numGrad.addColorStop(0.6, '#f59e0b');
    numGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = numGrad;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(badgeR * 1.15)}px Inter, system-ui, sans-serif`;
    ctx.fillText(String(countN), 0, 2);
    ctx.restore();

    ctx.restore();
  };

  // SÂN KHẤU HOẠT HÌNH 3D ĐỐI THOẠI ĐA NHÂN VẬT & NHIỀU KIỂU GIỌNG (3D Dialogue Stage + Shot-Reverse-Shot + Lip-Sync)
  const draw3dDialogueCinemaStage = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    clockSec: number,
    sceneIdx: number,
    progress: number,
    scene: StoryboardScene
  ) => {
    ctx.save();

    const speakerId = scene.speakerId || 'tho-con';
    const cameraAngle = scene.cameraAngle || 'shot-reverse-shot';
    const isGardenScene = scene.sceneNumber === 6 || (scene.imageUrl && scene.imageUrl.includes('garden'));

    // Determine camera shot transformation
    let camZoom = 1.0;
    let camPanX = 0;
    let camPanY = 0;

    if (cameraAngle === 'close-up-speaker') {
      camZoom = 1.28;
      if (speakerId === 'tho-con') camPanX = W * 0.08;
      else if (speakerId === 'cuu-bong') camPanX = -W * 0.08;
      else if (speakerId === 'meo-con') camPanX = -W * 0.12;
      else if (speakerId === 'bac-si') camPanX = W * 0.12;
    } else if (cameraAngle === 'shot-reverse-shot') {
      camZoom = 1.15;
      camPanX = speakerId === 'tho-con' ? W * 0.06 : -W * 0.06;
    } else if (cameraAngle === 'over-the-shoulder') {
      camZoom = 1.18;
      camPanX = speakerId === 'meo-con' ? -W * 0.08 : W * 0.08;
    } else if (cameraAngle === 'two-shot') {
      camZoom = 1.08;
    } else {
      // master-shot
      camZoom = 1.0;
    }

    // Apply camera motion easing
    const subtleBreath = Math.sin(clockSec * 1.5) * 0.015;
    ctx.translate(W / 2 + camPanX, H / 2 + camPanY);
    ctx.scale(camZoom + subtleBreath, camZoom + subtleBreath);
    ctx.translate(-W / 2, -H / 2);

    const groundY = H * 0.74;

    // 1. Pink Bunny (Thỏ Con)
    const drawBunny = (x: number, y: number, scale: number, isSpeaking: boolean, emotion: string) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      const hop = isSpeaking ? Math.abs(Math.sin(clockSec * 8)) * 14 : Math.sin(clockSec * 2) * 4;
      ctx.translate(0, -hop);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.beginPath();
      ctx.ellipse(0, 105, 55, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      const bodyGrad = ctx.createRadialGradient(-15, 30, 10, 0, 45, 65);
      bodyGrad.addColorStop(0, '#fbcfe8');
      bodyGrad.addColorStop(0.6, '#f472b6');
      bodyGrad.addColorStop(1, '#db2777');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 45, 48, 56, 0, 0, Math.PI * 2);
      ctx.fill();

      // White belly
      ctx.fillStyle = '#fff1f2';
      ctx.beginPath();
      ctx.ellipse(0, 52, 28, 36, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      const headGrad = ctx.createRadialGradient(-12, -35, 10, 0, -25, 52);
      headGrad.addColorStop(0, '#fce7f3');
      headGrad.addColorStop(0.7, '#f472b6');
      headGrad.addColorStop(1, '#db2777');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(0, -25, 45, 42, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      const earWiggleL = Math.sin(clockSec * 5) * 0.08;
      const earWiggleR = Math.sin(clockSec * 5 + 1) * 0.08;

      ctx.save();
      ctx.translate(-22, -60);
      ctx.rotate(-0.18 + earWiggleL);
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(0, -38, 16, 46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fdf2f8';
      ctx.beginPath();
      ctx.ellipse(0, -36, 9, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(22, -60);
      ctx.rotate(0.18 + earWiggleR);
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(0, -38, 16, 46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fdf2f8';
      ctx.beginPath();
      ctx.ellipse(0, -36, 9, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Eyes
      const blink = Math.sin(clockSec * 1.8) > 0.96;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * 18, -32);
        if (blink) {
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(0, 0, 11, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.arc(side * 1.5, 1, 7.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(side * 1.5 - 2.5, -2.5, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(side * 1.5 + 2, 3, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Cheeks
      ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
      ctx.beginPath();
      ctx.arc(-26, -18, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(26, -18, 9, 0, Math.PI * 2);
      ctx.fill();

      // Nose
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.ellipse(0, -18, 5, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      const mouthOpen = isSpeaking ? (Math.sin(clockSec * 16) * 0.5 + 0.5) * 8 : 1.5;
      ctx.fillStyle = '#be123c';
      ctx.strokeStyle = '#881337';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (emotion === 'crying') {
        ctx.arc(0, -9 + mouthOpen * 0.5, 7 + mouthOpen * 0.4, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else {
        ctx.ellipse(0, -10 + mouthOpen * 0.3, 6, 2.5 + mouthOpen, 0, 0, Math.PI);
        ctx.fill();
        ctx.stroke();
      }

      // Tears
      if (emotion === 'crying') {
        const tearOff = (clockSec * 45) % 30;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(-22, -18 + tearOff * 0.6, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(22, -18 + tearOff * 0.6, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hands
      if (!isGardenScene && sceneIdx < 4) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(-10, 20, 20, 32, 6);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-6, 14, 12, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-8, 28, 16, 14);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-6, 34, 12, 2.5);
      } else {
        const clap = Math.sin(clockSec * 12) * 8;
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.ellipse(-28 + clap, 22, 11, 9, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(28 - clap, 22, 11, 9, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // 2. Fluffy Sheep (Cừu Bông)
    const drawSheep = (x: number, y: number, scale: number, isSpeaking: boolean) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      const hop = isSpeaking ? Math.abs(Math.sin(clockSec * 8.5)) * 10 : Math.sin(clockSec * 2.2 + 0.5) * 3;
      ctx.translate(0, -hop);

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 100, 56, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      const woolGrad = ctx.createRadialGradient(-10, 30, 15, 0, 40, 68);
      woolGrad.addColorStop(0, '#ffffff');
      woolGrad.addColorStop(0.7, '#f1f5f9');
      woolGrad.addColorStop(1, '#cbd5e1');

      ctx.fillStyle = woolGrad;
      const woolPuffs = [
        [-30, 35, 26], [30, 35, 26], [0, 48, 30],
        [-20, 65, 24], [20, 65, 24], [0, 20, 28],
        [-35, 15, 22], [35, 15, 22]
      ];
      for (const [px, py, pr] of woolPuffs) {
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }

      const headGrad = ctx.createRadialGradient(-10, -25, 10, 0, -18, 40);
      headGrad.addColorStop(0, '#fef3c7');
      headGrad.addColorStop(0.8, '#fde68a');
      headGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(0, -18, 34, 32, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = woolGrad;
      ctx.beginPath();
      ctx.arc(-14, -46, 15, 0, Math.PI * 2);
      ctx.arc(14, -46, 15, 0, Math.PI * 2);
      ctx.arc(0, -52, 17, 0, Math.PI * 2);
      ctx.fill();

      const earSwing = Math.sin(clockSec * 6) * 0.06;
      ctx.fillStyle = '#fde68a';
      ctx.save();
      ctx.translate(-30, -28);
      ctx.rotate(0.35 + earSwing);
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(30, -28);
      ctx.rotate(-0.35 - earSwing);
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * 14, -22);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-2, -2, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(0, -10, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      const mouthOpen = isSpeaking ? (Math.sin(clockSec * 15) * 0.5 + 0.5) * 7 : 1;
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.ellipse(0, -3 + mouthOpen * 0.3, 5, 2 + mouthOpen, 0, 0, Math.PI);
      ctx.fill();

      const armWave = isSpeaking ? Math.sin(clockSec * 10) * 0.25 : 0;
      ctx.save();
      ctx.translate(28, 28);
      ctx.rotate(armWave);
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.ellipse(14, 0, 14, 8, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    };

    // 3. Cute Kitten (Mèo Con Nơ Hồng)
    const drawKitten = (x: number, y: number, scale: number, isSpeaking: boolean) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      const hop = isSpeaking ? Math.abs(Math.sin(clockSec * 8)) * 9 : Math.sin(clockSec * 2.3 + 1) * 3;
      ctx.translate(0, -hop);

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 95, 48, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      const kittenGrad = ctx.createRadialGradient(-10, 30, 10, 0, 40, 56);
      kittenGrad.addColorStop(0, '#fed7aa');
      kittenGrad.addColorStop(0.7, '#fb923c');
      kittenGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = kittenGrad;
      ctx.beginPath();
      ctx.ellipse(0, 42, 38, 48, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = kittenGrad;
      ctx.beginPath();
      ctx.ellipse(0, -22, 38, 34, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = kittenGrad;
      ctx.beginPath();
      ctx.moveTo(-32, -32);
      ctx.lineTo(-24, -58);
      ctx.lineTo(-6, -42);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(32, -32);
      ctx.lineTo(24, -58);
      ctx.lineTo(6, -42);
      ctx.closePath();
      ctx.fill();

      // Pink Ribbon Bow
      ctx.save();
      ctx.translate(-24, -46);
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.ellipse(-7, -4, 9, 6, -0.4, 0, Math.PI * 2);
      ctx.ellipse(7, -4, 9, 6, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, -4, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * 14, -24);
        ctx.fillStyle = '#065f46';
        ctx.beginPath();
        ctx.ellipse(0, 0, 7.5, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-2.5, -2.5, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.strokeStyle = '#fdba74';
      ctx.lineWidth = 1.5;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 18, -12);
        ctx.lineTo(side * 42, -16);
        ctx.moveTo(side * 18, -8);
        ctx.lineTo(side * 42, -6);
        ctx.stroke();
      }

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.ellipse(0, -14, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      const mouthOpen = isSpeaking ? (Math.sin(clockSec * 16) * 0.5 + 0.5) * 6 : 1;
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.ellipse(0, -7 + mouthOpen * 0.3, 5, 2 + mouthOpen, 0, 0, Math.PI);
      ctx.fill();

      ctx.restore();
    };

    // 4. Doctor Bear (Bác Sĩ Gấu)
    const drawDoctorBear = (x: number, y: number, scale: number, isSpeaking: boolean) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      const breath = isSpeaking ? Math.sin(clockSec * 8) * 4 : Math.sin(clockSec * 2) * 2;
      ctx.translate(0, -breath);

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 120, 68, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      const bearGrad = ctx.createRadialGradient(-15, 30, 20, 0, 50, 80);
      bearGrad.addColorStop(0, '#b45309');
      bearGrad.addColorStop(0.7, '#78350f');
      bearGrad.addColorStop(1, '#451a03');
      ctx.fillStyle = bearGrad;
      ctx.beginPath();
      ctx.ellipse(0, 50, 56, 70, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-32, 10);
      ctx.lineTo(32, 10);
      ctx.lineTo(44, 110);
      ctx.lineTo(-44, 110);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 35, 22, 0, Math.PI);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(0, 58, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = bearGrad;
      ctx.beginPath();
      ctx.ellipse(0, -32, 48, 44, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = bearGrad;
      ctx.beginPath();
      ctx.arc(-36, -64, 16, 0, Math.PI * 2);
      ctx.arc(36, -64, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(-36, -64, 8, 0, Math.PI * 2);
      ctx.arc(36, -64, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.ellipse(0, -22, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.ellipse(0, -26, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-18, -38, 12, 0, Math.PI * 2);
      ctx.arc(18, -38, 12, 0, Math.PI * 2);
      ctx.moveTo(-6, -38);
      ctx.lineTo(6, -38);
      ctx.stroke();

      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(-18, -38, 4, 0, Math.PI * 2);
      ctx.arc(18, -38, 4, 0, Math.PI * 2);
      ctx.fill();

      const mouthOpen = isSpeaking ? (Math.sin(clockSec * 14) * 0.5 + 0.5) * 6 : 1;
      ctx.fillStyle = '#be123c';
      ctx.beginPath();
      ctx.ellipse(0, -14 + mouthOpen * 0.3, 6, 2.5 + mouthOpen, 0, 0, Math.PI);
      ctx.fill();

      ctx.restore();
    };

    const isRabbitSpeaking = speakerId === 'tho-con';
    const isSheepSpeaking = speakerId === 'cuu-bong';
    const isKittenSpeaking = speakerId === 'meo-con';
    const isDoctorSpeaking = speakerId === 'bac-si';

    if (sceneIdx === 0) {
      drawBunny(W * 0.5, groundY, 1.25, isRabbitSpeaking, 'crying');
      drawSheep(W * 0.2, groundY + 10, 0.95, false);
      drawKitten(W * 0.8, groundY + 10, 0.95, false);
    } else if (sceneIdx === 1) {
      drawSheep(W * 0.38, groundY, 1.25, isSheepSpeaking);
      drawBunny(W * 0.72, groundY + 15, 1.05, false, 'worried');
    } else if (sceneIdx === 2) {
      drawKitten(W * 0.38, groundY, 1.25, isKittenSpeaking);
      drawBunny(W * 0.72, groundY + 15, 1.05, false, 'happy');
    } else if (sceneIdx === 3) {
      drawDoctorBear(W * 0.36, groundY - 20, 1.15, isDoctorSpeaking);
      drawBunny(W * 0.72, groundY + 15, 1.05, false, 'happy');
    } else if (sceneIdx === 4) {
      drawBunny(W * 0.5, groundY, 1.3, isRabbitSpeaking, 'happy');
      drawSheep(W * 0.22, groundY + 12, 0.95, false);
      drawKitten(W * 0.78, groundY + 12, 0.95, false);
    } else {
      drawSheep(W * 0.25, groundY, 1.05, true);
      drawBunny(W * 0.5, groundY - 10, 1.15, true, 'happy');
      drawKitten(W * 0.75, groundY, 1.05, true);
    }

    // DIALOGUE HUD: 3D Speaker Identity Badge & Voice Pitch Meter
    const currentActor = project.characterActors?.find((a) => a.id === speakerId) || {
      name: scene.speakerName || 'Nhân vật 3D',
      voiceName: scene.voiceId || 'vi-child-female',
      voicePitch: scene.voicePitch || 1.35,
      voiceSpeed: scene.voiceSpeed || 1.05,
      themeColor: isRabbitSpeaking ? '#ec4899' : isSheepSpeaking ? '#0ea5e9' : isKittenSpeaking ? '#f59e0b' : '#10b981',
    };

    const hudX = W * 0.05;
    const hudY = H * 0.08;
    const hudW = Math.min(W * 0.46, 420);
    const hudH = 58;

    ctx.save();
    ctx.translate(hudX, hudY);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = currentActor.themeColor || '#ec4899';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = currentActor.themeColor || '#ec4899';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(0, 0, hudW, hudH, 16);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = currentActor.themeColor || '#ec4899';
    ctx.beginPath();
    ctx.roundRect(0, 0, 8, hudH, [16, 0, 0, 16]);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`🎙️ ${currentActor.name.toUpperCase()}`, 20, 10);

    const pitchPercent = Math.round(((currentActor.voicePitch || 1) - 1) * 100);
    const pitchStr = pitchPercent >= 0 ? `+${pitchPercent}%` : `${pitchPercent}%`;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 12px Inter, system-ui, sans-serif';
    ctx.fillText(
      `PITCH: ${pitchStr} • TỐC ĐỘ: ${Math.round((currentActor.voiceSpeed || 1) * 100)}% • ${scene.cameraAngle?.toUpperCase() || 'SHOT-REVERSE-SHOT'}`,
      20,
      32
    );

    const waveX = hudW - 55;
    for (let b = 0; b < 4; b++) {
      const bh = (Math.sin(clockSec * 16 + b * 1.5) * 0.5 + 0.5) * 22 + 6;
      ctx.fillStyle = currentActor.themeColor || '#ec4899';
      ctx.beginPath();
      ctx.roundRect(waveX + b * 9, hudH - 14 - bh, 5, bh, 2.5);
      ctx.fill();
    }
    ctx.restore();

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

    // 3. Render Visual Layer based on Genre & Visual Render Mode
    const img = loadedImagesRef.current[scene.id];
    const prevScene = activeIdx > 0 ? scenes[activeIdx - 1] : null;
    const prevImg = prevScene ? loadedImagesRef.current[prevScene.id] : null;

    const is3dAnimationProject =
      effectiveGenre === '3d-animation' || effectiveDomain === 'animation-3d';

    const isNewsOverlayActive =
      !is3dAnimationProject &&
      (visualRenderMode === 'news-24h' ||
        (visualRenderMode === 'auto-genre' &&
          (effectiveGenre === 'news-broadcast' || effectiveGenre === 'finance-analysis')));

    const allowHardware3dOverlays =
      isHardwareKeynoteProject &&
      (visualRenderMode === 'hybrid-3d' || visualRenderMode === 'auto-genre');

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

      // Chỉ phủ đồ họa 3D linh kiện Apple khi dự án thực sự là phần cứng Apple Keynote!
      if (allowHardware3dOverlays) {
        const isExplodedScene =
          scene.explodedView === true || scene.appleMotion3d === 'exploded-chip';
        const isApertureScene =
          scene.apertureBlades === true || scene.appleMotion3d === 'aperture-zoom';

        if (isExplodedScene) {
          ctx.save();
          ctx.fillStyle = 'rgba(3, 7, 18, 0.58)';
          ctx.fillRect(0, 0, W, H);
          drawAppleExplodedHardwareView(ctx, W, H, clockSec, progress);
          ctx.restore();
        } else if (isApertureScene) {
          ctx.save();
          ctx.fillStyle = 'rgba(3, 7, 18, 0.52)';
          ctx.fillRect(0, 0, W, H);
          drawAppleMechanicalApertureBlades(ctx, W, H, clockSec, progress);
          ctx.restore();
        } else if (scene.appleMotion3d && scene.appleMotion3d !== 'none') {
          drawAppleKeynoteSubtleMotionOverlay(ctx, W, H, clockSec, progress, activeIdx);
        }
      } else if (is3dAnimationProject) {
        if (project.dialogueMode || scene.speakerId || scene.cameraAngle) {
          draw3dDialogueCinemaStage(ctx, W, H, clockSec, activeIdx, progress, scene);
        } else {
          draw3dAnimationInsectStage(ctx, W, H, clockSec, activeIdx, progress);
        }
      } else if (visualRenderMode === 'hybrid-3d' && !isHardwareKeynoteProject) {
        // Hiệu ứng quét ánh sáng điện ảnh trung tính cho các chủ đề không phải điện thoại
        drawAppleKeynoteSubtleMotionOverlay(ctx, W, H, clockSec, progress, activeIdx);
      }
    } else if (is3dAnimationProject) {
      if (project.dialogueMode || scene.speakerId || scene.cameraAngle) {
        draw3dDialogueCinemaStage(ctx, W, H, clockSec, activeIdx, progress, scene);
      } else {
        draw3dAnimationInsectStage(ctx, W, H, clockSec, activeIdx, progress);
      }
    } else if (isHardwareKeynoteProject) {
      drawCinematicSceneStage(ctx, W, H, clockSec, activeIdx, progress, scene);
    } else {
      // Trường quay đồ họa Thời sự / Phim tài liệu trong lúc nạp ảnh HD (tuyệt đối không hiện iPhone)
      drawEditorialBroadcastStage(ctx, W, H, clockSec, scene);
    }

    // Subtle atmospheric bokeh particles over the frame (nhẹ hơn khi ở chế độ bản tin)
    if (!isNewsOverlayActive) {
      drawAtmosphericParticles(ctx, W, H, clockSec, scene.lightingStyle || 'volumetric');
    }

    ctx.restore();

    // 4. Color Grading LUT Overlay
    drawColorGradeLut(ctx, W, H, activeLut);

    // 5. Optical VFX Overlays (Film grain, light leaks, vignette, Apple lens flare)
    drawVfxOverlay(ctx, W, H, clockSec, activeVfx);

    // 6. Subtle Top & Bottom Broadcast Gradient Scrim for 100% Text Readability
    const topScrim = ctx.createLinearGradient(0, 0, 0, H * 0.2);
    topScrim.addColorStop(0, 'rgba(0, 0, 0, 0.48)');
    topScrim.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topScrim;
    ctx.fillRect(0, 0, W, H * 0.2);

    const botScrim = ctx.createLinearGradient(0, H * 0.72, 0, H);
    botScrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
    botScrim.addColorStop(1, 'rgba(0, 0, 0, 0.74)');
    ctx.fillStyle = botScrim;
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    // 7. Cinema Letterbox 2.39:1
    if (anamoLetterbox && aspectRatio === '16:9') {
      const barH = H * 0.11;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, barH);
      ctx.fillRect(0, H - barH, W, barH);
    }

    // 8. Gói Đồ Họa theo Thể Loại (Bản Tin 24h / HUD Kỹ thuật / Tiêu đề Điện ảnh tối giản)
    if (isNewsOverlayActive) {
      drawNewsBroadcastPackage(ctx, W, H, scene, activeIdx, scenes.length, progress, clockSec);
      if (showBroadcastHud) {
        drawDynamicContextCalloutCard(
          ctx,
          W,
          H,
          scene,
          activeIdx,
          scenes.length,
          progress,
          clockSec
        );
        drawLiveAudioSpectrumHud(ctx, W, H, clockSec, '#ef4444');
      }
    } else if (showBroadcastHud) {
      drawCinemaHudAndHeadline(ctx, W, H, scene, activeIdx, scenes.length, progress);
      drawDynamicContextCalloutCard(
        ctx,
        W,
        H,
        scene,
        activeIdx,
        scenes.length,
        progress,
        clockSec
      );
      drawLiveAudioSpectrumHud(ctx, W, H, clockSec, '#38bdf8');
    } else if (visualRenderMode !== 'clean-photo') {
      drawAppleMinimalSceneTitle(ctx, W, H, scene, activeIdx, scenes.length, sceneElapsed, sceneDur);
    }

    // 9. Kinetic Typography Subtitles
    if (subtitleStyle !== 'off') {
      drawKineticSubtitles(
        ctx,
        W,
        H,
        scene.voiceover,
        progress,
        subtitleStyle,
        subtitlePosition,
        aspectRatio,
        isNewsOverlayActive
      );
    }

    ctx.restore();
  };

  drawCinemaCanvasRef.current = drawCinemaCanvas;

  // APPLE KEYNOTE SUBTLE 3D MOTION OVERLAY (Vòng sáng LiDAR & tia quét cạnh Titan tinh tế trên ảnh thực tế)
  const drawAppleKeynoteSubtleMotionOverlay = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    progress: number,
    sceneIdx: number
  ) => {
    ctx.save();
    const cx = W * 0.5;
    const cy = H * 0.5;
    const ringR = Math.min(W, H) * (0.34 + progress * 0.06);

    // Subtle rotating titanium precision arc
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.25 + sceneIdx * 0.8);
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.22)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([12, 18]);
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 1.35);
    ctx.stroke();
    ctx.setLineDash([]);

    // Travelling specular laser sweep across product silhouette
    const sweepX = (progress * 2 - 1) * (W * 0.38);
    const sweepGrad = ctx.createLinearGradient(sweepX - 45, -H * 0.3, sweepX + 45, H * 0.3);
    sweepGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    sweepGrad.addColorStop(0.5, 'rgba(248, 250, 252, 0.14)');
    sweepGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sweepGrad;
    ctx.fillRect(-W / 2, -H / 2, W, H);
    ctx.restore();
  };

  // APPLE KEYNOTE CLEAN SCENE TITLE INTRO (Chỉ xuất hiện tinh tế 3.2s đầu mỗi phân cảnh rồi mờ dần)
  const drawAppleMinimalSceneTitle = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    scene: StoryboardScene,
    sceneIdx: number,
    totalScenes: number,
    sceneElapsed: number,
    sceneDuration: number
  ) => {
    if (!scene.headline) return;
    // Smooth fade-in (0 -> 0.4s), hold (0.4s -> 2.8s), smooth fade-out (2.8s -> 3.5s)
    const fadeWindow = Math.min(3.5, sceneDuration * 0.65);
    if (sceneElapsed > fadeWindow) return;

    let alpha = 1.0;
    if (sceneElapsed < 0.4) {
      alpha = sceneElapsed / 0.4;
    } else if (sceneElapsed > fadeWindow - 0.7) {
      alpha = Math.max(0, (fadeWindow - sceneElapsed) / 0.7);
    }

    const padX = W * 0.05;
    const topY = anamoLetterbox && aspectRatio === '16:9' ? H * 0.14 : H * 0.065;
    const slideOffset = (1 - Math.min(1, sceneElapsed / 0.45)) * 14;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Minimalist chapter indicator
    ctx.font = `600 ${Math.max(10, Math.round(W * 0.011))}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif`;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.75)';
    ctx.letterSpacing = '1.5px';
    ctx.fillText(`0${sceneIdx + 1} / 0${totalScenes}`, padX, topY + slideOffset);

    // Editorial Apple Keynote Headline
    ctx.font = `700 ${Math.max(16, Math.round(W * 0.024))}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 12;
    ctx.fillText(scene.headline.replace(/^\d+\.\s*/, ''), padX, topY + Math.max(22, H * 0.038) + slideOffset);

    ctx.restore();
  };

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
    } else if (isScene4 || scene.explodedView) {
      drawAppleExplodedHardwareView(ctx, W, H, t, progress);
    } else if (isScene5 || scene.apertureBlades) {
      drawAppleMechanicalApertureBlades(ctx, W, H, t, progress);
    } else {
      drawScene6_KeynoteGrandFinale(ctx, W, H, t, progress);
    }
  };

  // APPLE 3D HARDWARE EXPLODED VIEW (Linh kiện bóc tách đa tầng bay vào vị trí chính xác)
  const drawAppleExplodedHardwareView = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    progress: number
  ) => {
    const cx = W * 0.5;
    const cy = H * 0.5;
    const easeAssembly = Math.min(1, Math.max(0, (progress - 0.15) * 1.5));
    // Easing cubic out
    const assembleFactor = 1 - Math.pow(1 - easeAssembly, 3);
    const explodeDist = (1 - assembleFactor) * Math.min(W, H) * 0.42;

    ctx.save();
    ctx.translate(cx, cy);

    // Deep space backdrop glow
    const deepGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, Math.min(W, H) * 0.6);
    deepGlow.addColorStop(0, 'rgba(30, 41, 59, 0.4)');
    deepGlow.addColorStop(0.6, 'rgba(15, 23, 42, 0.2)');
    deepGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = deepGlow;
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(W, H) * 0.6, 0, Math.PI * 2);
    ctx.fill();

    const bodyW = Math.min(W, H) * 0.42;
    const bodyH = bodyW * 2.05;

    // LAYER 1 (BACKMOST): Ceramic Shield Matte Glass Backplate
    ctx.save();
    ctx.translate(0, explodeDist * 1.2);
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.roundRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH, 26);
    ctx.fill();
    ctx.stroke();

    // Subtle Apple Logo Silkscreen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(0, -bodyH * 0.05, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // LAYER 2: Copper MagSafe Induction Coil Array
    ctx.save();
    ctx.translate(0, explodeDist * 0.7);
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.75)'; // Copper gold
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -bodyH * 0.05, bodyW * 0.32, 0, Math.PI * 2);
    ctx.stroke();
    // Inner coils
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    for (let c = 1; c <= 4; c++) {
      ctx.beginPath();
      ctx.arc(0, -bodyH * 0.05, bodyW * 0.32 - c * 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // LAYER 3: L-Shaped Silicon-Carbon Battery Pack (Dark Graphite)
    ctx.save();
    ctx.translate(0, explodeDist * 0.3);
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-bodyW * 0.42, -bodyH * 0.35, bodyW * 0.84, bodyH * 0.65, 12);
    ctx.fill();
    ctx.stroke();

    // Battery Specs Text
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#71717a';
    ctx.fillText('APPLE SILICON-CARBON 5600mAh • 4.45V', -bodyW * 0.38, -bodyH * 0.28);
    ctx.restore();

    // LAYER 4 (CORE): Logic Board & Apple A20 Pro 2nm Chip
    ctx.save();
    ctx.translate(0, 0); // Center anchor
    // Logic Board dark substrate
    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-bodyW * 0.42, -bodyH * 0.46, bodyW * 0.84, bodyH * 0.26, 10);
    ctx.fill();
    ctx.stroke();

    // Apple A20 Pro Central Die
    const chipSize = bodyW * 0.38;
    const chipGrad = ctx.createLinearGradient(-chipSize / 2, -chipSize / 2, chipSize / 2, chipSize / 2);
    chipGrad.addColorStop(0, '#111827');
    chipGrad.addColorStop(0.5, '#030712');
    chipGrad.addColorStop(1, '#1f2937');
    ctx.fillStyle = chipGrad;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(-chipSize / 2, -bodyH * 0.35 - chipSize / 2, chipSize, chipSize, 8);
    ctx.fill();
    ctx.stroke();

    // Gold Circuit Traces & Glow
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('A20 PRO', 0, -bodyH * 0.35 + 4);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('2nm TSMC N2P', 0, -bodyH * 0.35 + 16);
    ctx.textAlign = 'left';

    // 4 Titanium Torx Screws Flying In
    const screwExplode = (1 - assembleFactor) * 70;
    const screwOffsets = [
      { x: -bodyW * 0.38 - screwExplode, y: -bodyH * 0.44 - screwExplode },
      { x: bodyW * 0.38 + screwExplode, y: -bodyH * 0.44 - screwExplode },
      { x: -bodyW * 0.38 - screwExplode, y: -bodyH * 0.22 + screwExplode },
      { x: bodyW * 0.38 + screwExplode, y: -bodyH * 0.22 + screwExplode },
    ];
    screwOffsets.forEach((sc) => {
      ctx.save();
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sc.x, sc.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Star torx slot
      ctx.strokeStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(sc.x - 2, sc.y);
      ctx.lineTo(sc.x + 2, sc.y);
      ctx.moveTo(sc.x, sc.y - 2);
      ctx.lineTo(sc.x, sc.y + 2);
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();

    // LAYER 5 (FOREGROUND): Aerospace Titanium Grade 6 Outer Chassis
    ctx.save();
    ctx.translate(0, -explodeDist * 0.8);
    ctx.strokeStyle = '#e2e8f0'; // Brushed titanium
    ctx.lineWidth = 4.5;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH, 26);
    ctx.stroke();

    // Antenna bands
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-bodyW / 2, -bodyH * 0.3);
    ctx.lineTo(-bodyW / 2 + 5, -bodyH * 0.3);
    ctx.moveTo(bodyW / 2, -bodyH * 0.3);
    ctx.lineTo(bodyW / 2 - 5, -bodyH * 0.3);
    ctx.stroke();
    ctx.restore();

    // Assembly Flash Beam on completion
    if (assembleFactor > 0.85) {
      const flashAlpha = (assembleFactor - 0.85) / 0.15 * Math.sin(t * 8);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, flashAlpha * 0.35)})`;
      ctx.fillRect(-W, -H, W * 2, H * 2);
    }

    // Callout Label HUD
    ctx.save();
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('3D EXPLODED HARDWARE VIEW • A20 PRO ARCHITECTURE', -bodyW * 0.5, bodyH * 0.52);
    ctx.restore();

    ctx.restore();
  };

  // APPLE MECHANICAL APERTURE BLADES & OPTICAL LENS (Macro thấu kính máy ảnh lá khẩu cơ học)
  const drawAppleMechanicalApertureBlades = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    progress: number
  ) => {
    const cx = W * 0.5;
    const cy = H * 0.5;
    const lensR = Math.min(W, H) * 0.40;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Titanium Bezel Ring with Laser Engravings
    const rimGrad = ctx.createLinearGradient(-lensR, -lensR, lensR, lensR);
    rimGrad.addColorStop(0, '#f8fafc');
    rimGrad.addColorStop(0.3, '#94a3b8');
    rimGrad.addColorStop(0.7, '#475569');
    rimGrad.addColorStop(1, '#0f172a');
    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(0, 0, lensR + 7, 0, Math.PI * 2);
    ctx.stroke();

    // Laser Engraved Text on Ring
    ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('APPLE FUSION OPTICS • 48MP F/1.4 - F/2.8 • SENSOR-SHIFT OIS • 24MM', 0, -lensR + 2);
    ctx.textAlign = 'left';

    // 2. Multi-Coated Sapphire Element (Deep Indigo, Emerald & Violet reflection)
    const glassGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, lensR);
    glassGrad.addColorStop(0, '#020617');
    glassGrad.addColorStop(0.4, '#0f172a');
    glassGrad.addColorStop(0.75, '#1e1b4b'); // Deep violet
    glassGrad.addColorStop(1, '#042f2e'); // Deep emerald green
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.arc(0, 0, lensR, 0, Math.PI * 2);
    ctx.fill();

    // 3. Mechanical 8-Blade Iris Aperture
    // Aperture opens and closes smoothly: f/1.4 wide open to f/2.8 tight
    const apertureCycle = (Math.sin(t * 1.5) + 1) / 2; // 0 to 1
    const irisR = lensR * (0.28 + apertureCycle * 0.32);
    const numBlades = 8;

    ctx.save();
    for (let b = 0; b < numBlades; b++) {
      const angle = (b * Math.PI * 2) / numBlades + (t * 0.08);
      ctx.save();
      ctx.rotate(angle);

      // Graphite blade polygon
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(irisR, 0);
      ctx.lineTo(lensR * 0.96, -lensR * 0.3);
      ctx.lineTo(lensR * 0.98, lensR * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();

    // 4. Central Aperture Opening: CMOS Sensor Visible Through Lens
    const sensorR = irisR * 0.95;
    const sensorGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sensorR);
    sensorGrad.addColorStop(0, '#10b981'); // Green Bayer filter reflection
    sensorGrad.addColorStop(0.6, '#065f46');
    sensorGrad.addColorStop(1, '#022c22');
    ctx.fillStyle = sensorGrad;
    ctx.beginPath();
    ctx.arc(0, 0, sensorR, 0, Math.PI * 2);
    ctx.fill();

    // Sensor Micro-lens Grid Texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 0.8;
    for (let g = -sensorR; g <= sensorR; g += 8) {
      ctx.beginPath();
      ctx.moveTo(g, -sensorR);
      ctx.lineTo(g, sensorR);
      ctx.moveTo(-sensorR, g);
      ctx.lineTo(sensorR, g);
      ctx.stroke();
    }

    // 5. Specular Curved Glass Glare & Anamorphic Iris Rainbow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, lensR * 0.82, -Math.PI * 0.45, -Math.PI * 0.15);
    ctx.stroke();

    // Subtle violet crescent rim
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, lensR * 0.72, Math.PI * 0.55, Math.PI * 0.85);
    ctx.stroke();

    // HUD readout: Current Aperture Value
    const currentFStop = (1.4 + (1 - apertureCycle) * 1.4).toFixed(1);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`ƒ/${currentFStop}`, -lensR * 0.9, lensR * 0.9);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('DYNAMIC MECHANICAL IRIS', -lensR * 0.9, lensR * 0.9 + 14);

    ctx.restore();
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
    } else if (lut === 'apple-keynote') {
      // Apple Keynote Master: Deep Obsidian blacks, slight cool silver metallic tint, subtle rim-light boost
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, 'rgba(240, 246, 255, 0.06)'); // Cool silver rim
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.08)');
      grad.addColorStop(1, 'rgba(10, 15, 26, 0.18)'); // Deep obsidian black
      ctx.fillStyle = grad;
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
    } else if (vfx === 'apple-lens-flare') {
      // Apple Cinema Anamorphic Lens Flare - Subtle horizontal laser blue & crystal streak
      const flareY = H * 0.42 + Math.sin(t * 0.8) * 15;
      const flareGrad = ctx.createLinearGradient(0, flareY, W, flareY);
      flareGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      flareGrad.addColorStop(0.35, 'rgba(96, 165, 250, 0.08)');
      flareGrad.addColorStop(0.5, 'rgba(248, 250, 252, 0.28)');
      flareGrad.addColorStop(0.65, 'rgba(147, 197, 253, 0.08)');
      flareGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, flareY - 3, W, 6);

      // Center optical star glint
      ctx.save();
      const glintX = W * (0.35 + (Math.sin(t * 0.5) + 1) * 0.15);
      const glintGrad = ctx.createRadialGradient(glintX, flareY, 0, glintX, flareY, 18);
      glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      glintGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.2)');
      glintGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glintGrad;
      ctx.beginPath();
      ctx.arc(glintX, flareY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
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
    ratio: '16:9' | '9:16',
    avoidNewsLowerThird: boolean = false
  ) => {
    const words = voiceover.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));
    const chunkSize = ratio === '9:16' ? 5 : 8;
    const chunkIndex = Math.floor(activeWordIndex / chunkSize);
    const chunkStart = chunkIndex * chunkSize;
    const chunkWords = words.slice(chunkStart, chunkStart + chunkSize);

    const fontSize = ratio === '9:16' ? Math.round(W * 0.052) : Math.round(W * 0.026);
    let targetY = avoidNewsLowerThird ? H * 0.75 : H * 0.84;
    if (position === 'center') targetY = H * 0.5;
    if (position === 'top') targetY = H * 0.18;
    if (anamoLetterbox && ratio === '16:9' && position === 'bottom') {
      targetY = avoidNewsLowerThird ? H * 0.72 : H * 0.82;
    }

    if (style === 'apple-minimal') {
      // APPLE KEYNOTE MINIMALIST SUBTITLES (SF Pro / Inter font, frosted glass capsule, no jarring bounce)
      ctx.save();
      const appleFontSize = Math.round(fontSize * 0.88);
      ctx.font = `600 ${appleFontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", sans-serif`;
      ctx.textBaseline = 'middle';

      const spaceW = ctx.measureText(' ').width * 1.05;
      const wordWidths = chunkWords.map((w) => ctx.measureText(w).width);
      const totalLineW = wordWidths.reduce((a, b) => a + b, 0) + spaceW * Math.max(0, chunkWords.length - 1);
      const boxPadX = Math.round(appleFontSize * 1.2);
      const boxPadY = Math.round(appleFontSize * 0.65);

      // Ultra-sleek frosted pill background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(
        W / 2 - totalLineW / 2 - boxPadX,
        targetY - appleFontSize / 2 - boxPadY,
        totalLineW + boxPadX * 2,
        appleFontSize + boxPadY * 2,
        9999
      );
      ctx.fill();
      ctx.stroke();

      let cursorX = W / 2 - totalLineW / 2;
      chunkWords.forEach((word, idx) => {
        const globalIdx = chunkStart + idx;
        const isCurrent = globalIdx === activeWordIndex;
        const isPast = globalIdx < activeWordIndex;

        ctx.save();
        if (isCurrent) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.75)';
          ctx.shadowBlur = 8;
        } else if (isPast) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
        }
        ctx.fillText(word, cursorX, targetY);
        ctx.restore();
        cursorX += wordWidths[idx] + spaceW;
      });
      ctx.restore();
      return;
    }

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

          {/* Visual Render Mode Switcher: Auto theo Chủ đề / Bản Tin 24h / Điện Ảnh / Ảnh Sạch */}
          <div className="flex items-center bg-zinc-950/90 rounded-lg p-0.5 border border-white/10">
            {[
              { id: 'auto-genre', label: 'Auto Chủ Đề' },
              { id: 'news-24h', label: 'Bản Tin 24h' },
              { id: 'hybrid-3d', label: isHardwareKeynoteProject ? '3D Keynote' : 'Điện Ảnh' },
              { id: 'clean-photo', label: 'Ảnh Sạch' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setVisualRenderMode(mode.id as any)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  visualRenderMode === mode.id
                    ? 'bg-white text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Chuyển chế độ hiển thị đồ họa theo thể loại dự án"
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Clean Cinema vs Technical Broadcast HUD toggle */}
          <button
            type="button"
            onClick={() => setShowBroadcastHud((h) => !h)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition cursor-pointer border ${
              showBroadcastHud
                ? 'bg-sky-950 text-sky-200 border-sky-500/40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-white/10'
            }`}
            title="Bật/Tắt lớp thông số kỹ thuật Broadcast HUD trên màn hình"
          >
            <span>{showBroadcastHud ? 'HUD: Bật' : 'HUD: Ẩn (Clean)'}</span>
          </button>

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
              {(['apple-minimal', 'netflix', 'hormozi', 'capcut', 'off'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setSubtitleStyle(style)}
                  className={`px-2 py-0.5 rounded capitalize transition cursor-pointer ${subtitleStyle === style ? 'bg-zinc-950 text-white font-semibold shadow-xs' : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  {style === 'apple-minimal' ? 'Apple' : style}
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
                    { id: 'apple-keynote', name: 'Apple Keynote Master', desc: 'Đen sâu thẳm Obsidian & Ánh titan viền' },
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
                    { id: 'apple-lens-flare', name: 'Apple Anamorphic Flare', desc: 'Vệt sáng xanh pha lê lướt ngang kính' },
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
                  placeholder="Nhập từ khóa tìm ảnh thực tế (VD: Tàu sân bay Mỹ Trung Đông, Giá vàng thế giới, Vũ trụ James Webb...)"
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
