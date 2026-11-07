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
} from 'lucide-react';
import { buildAiSceneImageUrl } from '../services/aiScriptGeneratorService';
import { StudioAudioSynthesizer, VOICE_PROFILES } from '../services/voiceStudioService';

interface AiCinemaPlayerProps {
    project: Project;
    aspectRatio: '16:9' | '9:16';
    showSocialMockup: 'none' | 'tiktok' | 'youtube';
    activeSceneId?: number | null;
    onSelectScene?: (sceneId: number) => void;
    onUpdateProject?: (updated: Project) => void;
    onOpenVoiceStudio?: () => void;
    onOpenShortcutsModal?: () => void;
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

    // Color Grade & VFX quick modal
    const [showLutPaletteModal, setShowLutPaletteModal] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const lastFrameTimeRef = useRef<number>(performance.now());
    const currentSpokenSceneRef = useRef<number | null>(null);

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

    // Preload Images
    useEffect(() => {
        let isMounted = true;
        loadedImagesRef.current = {};
        setLoadedCount(0);

        const curatedPool = [
            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1280&q=85',
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1280&q=85',
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=85',
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=85',
            'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1280&q=85',
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1280&q=85',
        ];

        scenes.forEach((sc, idx) => {
            // If user uploaded a custom media URL, load that directly
            const mediaSource =
                sc.customMediaUrl ||
                sc.imageUrl ||
                buildAiSceneImageUrl(sc.visualPrompt, aspectRatio, idx + 1 + regenVersion * 17);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = mediaSource;

            img.onload = () => {
                if (!isMounted) return;
                loadedImagesRef.current[sc.id] = img;
                setLoadedCount((c) => Math.min(scenes.length, c + 1));
            };

            img.onerror = () => {
                if (!isMounted) return;
                // Fallback to high-res curated tech asset
                const fb = new Image();
                fb.crossOrigin = 'anonymous';
                fb.src = curatedPool[idx % curatedPool.length];
                fb.onload = () => {
                    if (!isMounted) return;
                    loadedImagesRef.current[sc.id] = fb;
                    setLoadedCount((c) => Math.min(scenes.length, c + 1));
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
                setCurrentTime(target.startSec + 0.05);
            }
        }
    }, [activeSceneId, scenes]);

    // Speak Vietnamese Voiceover (TTS) when scene changes during playback
    const speakSceneVoiceover = useCallback(
        (scene: StoryboardScene | undefined) => {
            if (!('speechSynthesis' in window)) return;
            if (!isPlaying || isMuted || !isTtsEnabled || !scene) {
                window.speechSynthesis.cancel();
                synthRef.current?.duckBgm(false);
                return;
            }

            try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(scene.voiceover);
                utterance.lang = 'vi-VN';

                // Match assigned voice profile if any
                const voiceProfile =
                    VOICE_PROFILES.find((v) => v.id === scene.voiceId) ||
                    VOICE_PROFILES.find((v) => v.id === project.voiceoverTrack?.voiceName) ||
                    VOICE_PROFILES[0];

                const voices = window.speechSynthesis.getVoices();
                const viVoices = voices.filter((v) => v.lang.toLowerCase().includes('vi'));
                if (viVoices.length > 0) {
                    if (voiceProfile.gender === 'Nữ') {
                        utterance.voice =
                            viVoices.find((v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('nu')) ||
                            viVoices[0];
                    } else {
                        utterance.voice =
                            viVoices.find((v) => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('nam')) ||
                            viVoices[0];
                    }
                }

                const sceneDur = Math.max(3, scene.endSec - scene.startSec);
                const wordCount = scene.voiceover.split(/\s+/).length;
                const autoRate = Math.max(0.9, Math.min(1.4, wordCount / (sceneDur * 3.0)));

                utterance.rate = scene.voiceSpeed || autoRate;
                utterance.pitch = scene.voicePitch || voiceProfile.pitch || 1.0;
                utterance.volume = 1.0;

                utterance.onstart = () => {
                    synthRef.current?.duckBgm(true);
                };
                utterance.onend = () => {
                    synthRef.current?.duckBgm(false);
                };
                utterance.onerror = () => {
                    synthRef.current?.duckBgm(false);
                };

                window.speechSynthesis.speak(utterance);
            } catch {
                // Ignore TTS errors
            }
        },
        [isPlaying, isMuted, isTtsEnabled, project.voiceoverTrack?.voiceName]
    );

    // Trigger TTS & SFX when current scene changes
    useEffect(() => {
        if (!isPlaying) {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            currentSpokenSceneRef.current = null;
            synthRef.current?.duckBgm(false);
            return;
        }

        if (currentScene && currentSpokenSceneRef.current !== currentScene.id) {
            currentSpokenSceneRef.current = currentScene.id;
            synthRef.current?.playSfx('whoosh');
            speakSceneVoiceover(currentScene);
            onSelectScene?.(currentScene.id);
        }
    }, [currentSceneIndex, currentScene, isPlaying, speakSceneVoiceover, onSelectScene]);

    // Main 60fps Playback & Canvas Loop
    useEffect(() => {
        let animId: number;

        const renderFrame = (now: number) => {
            const dt = Math.min(0.1, (now - lastFrameTimeRef.current) / 1000) * playbackSpeed;
            lastFrameTimeRef.current = now;

            if (isPlaying) {
                setCurrentTime((prev) => {
                    const next = prev + dt;
                    if (next >= totalDuration) {
                        currentSpokenSceneRef.current = null;
                        return 0; // Loop seamlessly
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
                setCurrentTime((t) => Math.max(0, t - 3));
            } else if (e.code === 'KeyK') {
                e.preventDefault();
                setIsPlaying(false);
            } else if (e.code === 'KeyL') {
                e.preventDefault();
                setCurrentTime((t) => Math.min(totalDuration, t + 3));
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                if (e.shiftKey) {
                    jumpScene(-1);
                } else {
                    setCurrentTime((t) => Math.max(0, t - 1));
                }
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                if (e.shiftKey) {
                    jumpScene(1);
                } else {
                    setCurrentTime((t) => Math.min(totalDuration, t + 1));
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
    }, [totalDuration, currentSceneIndex, scenes]);

    const jumpScene = (direction: -1 | 1) => {
        const nextIdx = currentSceneIndex + direction;
        if (nextIdx >= 0 && nextIdx < scenes.length) {
            const target = scenes[nextIdx];
            setCurrentTime(target.startSec + 0.05);
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

    // DRAW CANVAS COMPOSITOR
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
            scale = 1.02 + progress * 0.22;
        } else if (motion === 'dolly-out') {
            scale = 1.24 - progress * 0.22;
        } else if (motion === 'orbit') {
            scale = 1.15;
            tx = Math.sin(progress * Math.PI * 2) * (W * 0.04);
            ty = Math.cos(progress * Math.PI * 2) * (H * 0.018);
            rot = Math.sin(progress * Math.PI) * 0.02;
        } else if (motion === 'fpv-zoom') {
            scale = 1.0 + Math.pow(progress, 1.4) * 0.35;
            rot = Math.sin(progress * Math.PI * 2) * 0.03;
            tx = Math.cos(progress * Math.PI) * (W * 0.025);
        } else if (motion === 'crane-up') {
            scale = 1.12;
            ty = (0.5 - progress) * (H * 0.08);
        } else if (motion === 'pan-right') {
            scale = 1.14;
            tx = (0.5 - progress) * (W * 0.08);
        } else if (motion === 'pan-left') {
            scale = 1.14;
            tx = (progress - 0.5) * (W * 0.08);
        }

        // Natural camera floating breathing shake
        const breathX = Math.sin(clockSec * 1.8) * 1.5;
        const breathY = Math.cos(clockSec * 1.4) * 1.5;

        ctx.save();
        ctx.translate(W / 2 + tx + breathX, H / 2 + ty + breathY);
        ctx.rotate(rot);
        ctx.scale(scale, scale);
        ctx.translate(-W / 2, -H / 2);

        // 3. Draw Image Media OR High-End 3D Holographic Product Stage
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
            // High-End 3D Flagship Dual-Screen Stage (iPhone Duo / Tech)
            drawHighEnd3DProductStage(ctx, W, H, clockSec, currentSceneIndex, progress);
        }

        // Atmospheric light particles
        drawAtmosphericParticles(ctx, W, H, clockSec, scene.lightingStyle || 'volumetric');

        ctx.restore();

        // 4. Color Grading LUT Overlay
        drawColorGradeLut(ctx, W, H, activeLut);

        // 5. Optical VFX Overlays (Film grain, light leaks, vignette)
        drawVfxOverlay(ctx, W, H, clockSec, activeVfx);

        // 6. Transition Crossfade / Cut Flash
        if (sceneElapsed < 0.35) {
            const fadeInAlpha = 1 - sceneElapsed / 0.35;
            ctx.fillStyle = scene.transition === 'cut' ? `rgba(255, 255, 255, ${fadeInAlpha * 0.3})` : `rgba(0, 0, 0, ${fadeInAlpha * 0.8})`;
            ctx.fillRect(0, 0, W, H);
        } else if (sceneDur - sceneElapsed < 0.3) {
            const fadeOutAlpha = 1 - (sceneDur - sceneElapsed) / 0.3;
            ctx.fillStyle = `rgba(0, 0, 0, ${fadeOutAlpha * 0.7})`;
            ctx.fillRect(0, 0, W, H);
        }

        // 7. Cinema Letterbox 2.39:1
        if (anamoLetterbox && aspectRatio === '16:9') {
            const barH = H * 0.11;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, W, barH);
            ctx.fillRect(0, H - barH, W, barH);
        }

        // 8. On-Screen HUD & Scene Headline
        drawCinemaHudAndHeadline(ctx, W, H, scene, currentSceneIndex, scenes.length, progress);

        // 9. Kinetic Typography Subtitles
        if (subtitleStyle !== 'off') {
            drawKineticSubtitles(ctx, W, H, scene.voiceover, progress, subtitleStyle, subtitlePosition, aspectRatio);
        }

        ctx.restore();
    };

    // High-End 3D Product Stage (Renders an ultra-slick dual-screen titanium smartphone in 3D perspective)
    const drawHighEnd3DProductStage = (
        ctx: CanvasRenderingContext2D,
        W: number,
        H: number,
        t: number,
        sceneIdx: number,
        progress: number
    ) => {
        // 3D Perspective Grid
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 1;
        const horizon = H * 0.65;
        for (let i = -14; i <= 14; i++) {
            ctx.beginPath();
            ctx.moveTo(W * 0.5 + i * (W * 0.025), horizon);
            ctx.lineTo(W * 0.5 + i * (W * 0.16), H);
            ctx.stroke();
        }

        // Center Glow
        const cx = W * 0.5;
        const cy = H * 0.46;
        const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, W * 0.35);
        glow.addColorStop(0, 'rgba(56, 189, 248, 0.32)');
        glow.addColorStop(0.5, 'rgba(168, 85, 247, 0.12)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);

        // Unfolding 3D Flagship Body
        const phoneW = Math.min(W, H) * 0.24;
        const phoneH = phoneW * 1.62;
        const unfoldAngle = Math.sin(t * 1.5) * 0.22;

        ctx.save();
        ctx.translate(cx, cy);

        // Shadow on floor
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(0, phoneH * 0.55, phoneW * 1.6, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        // LEFT SCREEN (Titanium Bezel + Dynamic OLED)
        ctx.save();
        ctx.rotate(unfoldAngle * 0.4);

        // Titanium frame
        ctx.fillStyle = '#1c1d24';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-phoneW - 4, -phoneH / 2, phoneW, phoneH, 16);
        ctx.fill();
        ctx.stroke();

        // OLED Screen Left
        const oledGradL = ctx.createLinearGradient(-phoneW, -phoneH / 2, 0, phoneH / 2);
        oledGradL.addColorStop(0, '#090d16');
        oledGradL.addColorStop(0.5, '#0ea5e9');
        oledGradL.addColorStop(1, '#6366f1');
        ctx.fillStyle = oledGradL;
        ctx.beginPath();
        ctx.roundRect(-phoneW + 4, -phoneH / 2 + 8, phoneW - 12, phoneH - 16, 12);
        ctx.fill();

        // Widget text inside screen
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('IPHONE DUO PRO', -phoneW + 14, -phoneH / 2 + 28);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '8px monospace';
        ctx.fillText('A19 BIONIC 3NM', -phoneW + 14, -phoneH / 2 + 44);

        ctx.restore();

        // RIGHT SCREEN
        ctx.save();
        ctx.rotate(-unfoldAngle * 0.4);

        ctx.fillStyle = '#1c1d24';
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(4, -phoneH / 2, phoneW, phoneH, 16);
        ctx.fill();
        ctx.stroke();

        // OLED Screen Right
        const oledGradR = ctx.createLinearGradient(0, -phoneH / 2, phoneW, phoneH / 2);
        oledGradR.addColorStop(0, '#1e1b4b');
        oledGradR.addColorStop(0.5, '#a855f7');
        oledGradR.addColorStop(1, '#ec4899');
        ctx.fillStyle = oledGradR;
        ctx.beginPath();
        ctx.roundRect(8, -phoneH / 2 + 8, phoneW - 12, phoneH - 16, 12);
        ctx.fill();

        // Holographic Telemetry HUD
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('DUAL OLED 120HZ', 18, -phoneH / 2 + 28);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '8px monospace';
        ctx.fillText('NEURAL VIDEO STITCH', 18, -phoneH / 2 + 44);

        ctx.restore();

        // Center Glowing Hinge Spine
        const spineGrad = ctx.createLinearGradient(-3, 0, 3, 0);
        spineGrad.addColorStop(0, '#0284c7');
        spineGrad.addColorStop(0.5, '#38bdf8');
        spineGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = spineGrad;
        ctx.fillRect(-3, -phoneH / 2 + 10, 6, phoneH - 20);

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
                if (style === 'hormozi') {
                    ctx.fillStyle = '#facc15';
                    ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
                    ctx.shadowBlur = 10;
                } else if (style === 'cyberpunk') {
                    ctx.fillStyle = '#38bdf8';
                    ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
                    ctx.shadowBlur = 12;
                } else {
                    ctx.fillStyle = '#ffffff';
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

    // Real Video Export with Complete Mixed Stereo Audio
    const handleExportFullTimelineVideo = () => {
        const canvas = canvasRef.current;
        if (!canvas || isExportingVideo) return;

        try {
            setIsExportingVideo(true);
            setShowExportModal(true);
            setExportProgress(0);
            setExportStatusText('Khởi tạo bộ kết xuất âm thanh Stereo & hình ảnh 1080p...');

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
            setCurrentTime(exportScope === 'current' ? currentScene.startSec : 0);
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
                                    setCurrentTime(s.startSec + 0.05);
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
                        onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
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
        </div>
    );
};
