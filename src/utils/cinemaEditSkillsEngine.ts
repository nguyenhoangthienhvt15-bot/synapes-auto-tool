import gsap from 'gsap';
import type {
  ColorGradeLut,
  EditSkillPresetId,
  Project,
  SubtitleStyle,
  VfxOverlayType,
} from '../types';
import type { CinemaTransitionPreset } from './glTransitionCompositor';

/**
 * Động cơ Biên tập Video NLE Thông minh (kế thừa triết lý choreography từ
 * `motion-canvas/motion-canvas`, `mifi/editly`, `remotion-dev/remotion`, `WyattBlue/auto-editor`).
 */

export interface EditSkillPresetConfig {
  id: EditSkillPresetId;
  name: string;
  shortLabel: string;
  referenceRepo: string;
  description: string;
  transitionDurationSec: number;
  cameraEasing: string;
  punchInBeatIntensity: number;
  breathGapSec: number;
  sfxOnCut: 'whoosh' | 'camera-shutter' | 'sub-drop' | 'chime';
  defaultLut: ColorGradeLut;
  defaultVfx: VfxOverlayType;
  defaultSubtitleStyle: SubtitleStyle;
  transitionPool: CinemaTransitionPreset[];
}

export const EDIT_SKILL_PRESETS: Record<EditSkillPresetId, EditSkillPresetConfig> = {
  'cinema-doc': {
    id: 'cinema-doc',
    name: 'Editorial Documentary (Netflix / Vox)',
    shortLabel: 'Cinema Doc',
    referenceRepo: 'motion-canvas/motion-canvas',
    description:
      'Chuyển động máy quay đường cong S-Curve êm mượt, cắt cảnh bằng CrossZoom / DreamyZoom sâu lắng và LUT Teal-Orange điện ảnh.',
    transitionDurationSec: 0.85,
    cameraEasing: 'power2.inOut',
    punchInBeatIntensity: 0.008,
    breathGapSec: 0.28,
    sfxOnCut: 'sub-drop',
    defaultLut: 'teal-orange',
    defaultVfx: 'vignette',
    defaultSubtitleStyle: 'netflix',
    transitionPool: ['CrossZoom', 'DreamyZoom', 'DirectionalWarp', 'FadeColor', 'TangentMotionBlur', 'Doorway'],
  },
  'broadcast-24h': {
    id: 'broadcast-24h',
    name: 'Broadcast News 24H (CNN / Bloomberg)',
    shortLabel: 'Bản Tin 24H',
    referenceRepo: 'mifi/editly',
    description:
      'Chuyển cảnh gãy gọn 0.55s chuẩn truyền hình (WindowSlices, DirectionalWipe, Cube), HUD vùng an toàn chống đè phụ đề.',
    transitionDurationSec: 0.55,
    cameraEasing: 'power3.out',
    punchInBeatIntensity: 0.012,
    breathGapSec: 0.18,
    sfxOnCut: 'whoosh',
    defaultLut: 'studio-clean',
    defaultVfx: 'vignette',
    defaultSubtitleStyle: 'netflix',
    transitionPool: ['DirectionalWipe', 'WindowSlices', 'TangentMotionBlur', 'Cube', 'CrossZoom', 'FadeColor'],
  },
  'viral-retention': {
    id: 'viral-retention',
    name: 'Viral Retention Pro (Hormozi / CapCut)',
    shortLabel: 'Viral Pro',
    referenceRepo: 'WyattBlue/auto-editor',
    description:
      'Nhịp cắt nhanh 0.45s + Micro Punch-In theo mỗi nhịp câu nói, chuyển cảnh năng lượng cao (GlitchMemories, ZoomInCircles, Swirl).',
    transitionDurationSec: 0.45,
    cameraEasing: 'expo.out',
    punchInBeatIntensity: 0.028,
    breathGapSec: 0.11,
    sfxOnCut: 'camera-shutter',
    defaultLut: 'teal-orange',
    defaultVfx: 'light-leak',
    defaultSubtitleStyle: 'hormozi',
    transitionPool: ['CrossZoom', 'GlitchMemories', 'ZoomInCircles', 'Swirl', 'DirectionalWarp', 'Mosaic'],
  },
  'apple-keynote': {
    id: 'apple-keynote',
    name: 'Apple Keynote Cinema',
    shortLabel: 'Keynote Pro',
    referenceRepo: 'remotion-dev/remotion',
    description:
      'Không gian đen sâu Obsidian, chuyển cảnh FadeColor / TangentMotionBlur tinh tế, tia sáng quang học titan và phụ đề tối giản.',
    transitionDurationSec: 0.78,
    cameraEasing: 'power3.inOut',
    punchInBeatIntensity: 0.006,
    breathGapSec: 0.24,
    sfxOnCut: 'chime',
    defaultLut: 'apple-keynote',
    defaultVfx: 'apple-lens-flare',
    defaultSubtitleStyle: 'apple-minimal',
    transitionPool: ['FadeColor', 'TangentMotionBlur', 'DreamyZoom', 'DirectionalWipe', 'CrossZoom'],
  },
  'storytelling-3d': {
    id: 'storytelling-3d',
    name: '3D Storytelling Studio (Pixar / Kids)',
    shortLabel: '3D Story',
    referenceRepo: 'mrdoob/three.js',
    description:
      'Bảo toàn khung hình 3D sạch sẽ (tắt HUD rườm rà), chuyển cảnh RadialWipe / Doorway / DreamyZoom nhẹ nhàng khớp nhịp đồng dao & hội thoại.',
    transitionDurationSec: 0.72,
    cameraEasing: 'sine.inOut',
    punchInBeatIntensity: 0.004,
    breathGapSec: 0.24,
    sfxOnCut: 'chime',
    defaultLut: 'none',
    defaultVfx: 'none',
    defaultSubtitleStyle: 'netflix',
    transitionPool: ['DreamyZoom', 'Doorway', 'RadialWipe', 'ZoomInCircles', 'FadeColor'],
  },
};

export const EDIT_SKILL_LIST: EditSkillPresetConfig[] = Object.values(EDIT_SKILL_PRESETS);

export function getEditSkillMeta(id?: string): EditSkillPresetConfig {
  if (id && id in EDIT_SKILL_PRESETS) {
    return EDIT_SKILL_PRESETS[id as EditSkillPresetId];
  }
  return EDIT_SKILL_PRESETS['cinema-doc'];
}

/**
 * Tự động chọn Skill Edit tối ưu theo thể loại dự án (hoặc ưu tiên lựa chọn thủ công của người dùng).
 */
export function resolveActiveEditSkill(
  project?: Partial<Project> | null,
  manualOverride?: EditSkillPresetId | 'auto'
): EditSkillPresetConfig {
  if (manualOverride && manualOverride !== 'auto' && EDIT_SKILL_PRESETS[manualOverride]) {
    return EDIT_SKILL_PRESETS[manualOverride];
  }
  if (project?.editSkillPreset && EDIT_SKILL_PRESETS[project.editSkillPreset]) {
    return EDIT_SKILL_PRESETS[project.editSkillPreset];
  }
  if (project?.videoGenre === '3d-animation' || project?.dialogueMode || project?.model3dStyle) {
    return EDIT_SKILL_PRESETS['storytelling-3d'];
  }
  if (project?.videoGenre === 'apple-keynote') {
    return EDIT_SKILL_PRESETS['apple-keynote'];
  }
  if (project?.videoGenre === 'news-broadcast' || project?.videoGenre === 'finance-analysis') {
    return EDIT_SKILL_PRESETS['broadcast-24h'];
  }
  if (project?.videoGenre === 'viral-social') {
    return EDIT_SKILL_PRESETS['viral-retention'];
  }
  return EDIT_SKILL_PRESETS['cinema-doc'];
}

export interface EasedCameraTransform {
  scale: number;
  tx: number;
  ty: number;
  rot: number;
  easedProgress: number;
}

/**
 * Tính toán chuyển động máy quay phi tuyến tính (Motion Canvas / GSAP Curve + Punch-In Rhythm)
 * thay cho nội suy tuyến tính thô cứng.
 */
export function computeEasedCameraTransform(
  motion: string | undefined,
  rawProgress: number,
  clockSec: number,
  skillPreset: EditSkillPresetConfig,
  W: number,
  H: number
): EasedCameraTransform {
  const clampedP = Math.max(0, Math.min(1, rawProgress));
  const easeFn = gsap.parseEase(skillPreset.cameraEasing || 'power2.inOut');
  const p = Math.max(0, Math.min(1, easeFn(clampedP)));

  // Rhythmic micro punch-in every ~2.4s to keep attention sharp without jarring shakes
  const beatPulse =
    skillPreset.punchInBeatIntensity > 0
      ? Math.pow(Math.max(0, Math.sin(clockSec * 2.6)), 6) * skillPreset.punchInBeatIntensity
      : 0;

  let scale = 1.02 + beatPulse;
  let tx = 0;
  let ty = 0;
  let rot = 0;

  switch (motion || 'dolly-in') {
    case 'dolly-out':
      scale = 1.2 - p * 0.16 + beatPulse;
      break;
    case 'orbit':
      scale = 1.11 + beatPulse;
      tx = Math.sin(p * Math.PI * 2) * (W * 0.028);
      ty = Math.cos(p * Math.PI * 2) * (H * 0.014);
      rot = Math.sin(p * Math.PI) * 0.012;
      break;
    case 'fpv-zoom':
      scale = 1.03 + Math.pow(p, 1.25) * 0.22 + beatPulse;
      rot = Math.sin(p * Math.PI * 2) * 0.014;
      tx = Math.cos(p * Math.PI) * (W * 0.018);
      break;
    case 'crane-up':
      scale = 1.12 + beatPulse;
      ty = (0.5 - p) * (H * 0.062);
      break;
    case 'pan-right':
      scale = 1.12 + beatPulse;
      tx = (0.5 - p) * (W * 0.062);
      break;
    case 'pan-left':
      scale = 1.12 + beatPulse;
      tx = (p - 0.5) * (W * 0.062);
      break;
    case 'dolly-in':
    default:
      scale = 1.03 + p * 0.16 + beatPulse;
      break;
  }

  return { scale, tx, ty, rot, easedProgress: p };
}
