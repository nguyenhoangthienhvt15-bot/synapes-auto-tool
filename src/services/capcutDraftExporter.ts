/**
 * capcutDraftExporter.ts - Plugin Kết Nối & Xuất Dự Án sang CapCut PC (draft_content.json)
 * Thiết kế kiến trúc theo Báo cáo Đánh giá Phiên họp 1 — Hội đồng Kỹ thuật
 * Chủ trì dự án: KS. Nguyễn Hoàng Thiện
 */

import { Project, StoryboardScene } from '../types';

export interface CapCutDraftContent {
  canvas_config: {
    height: number;
    width: number;
    ratio: string;
  };
  duration: number; // microseconds
  materials: {
    videos: Array<{
      id: string;
      path: string;
      duration: number;
      material_name: string;
    }>;
    audios: Array<{
      id: string;
      path: string;
      duration: number;
      name: string;
    }>;
    texts: Array<{
      id: string;
      content: string;
      font_size: number;
      font_color: string;
    }>;
    speeds: Array<{
      id: string;
      speed: number;
    }>;
  };
  tracks: Array<{
    id: string;
    type: 'video' | 'audio' | 'text';
    segments: Array<{
      id: string;
      material_id: string;
      target_timerange: {
        duration: number;
        start: number;
      };
      source_timerange: {
        duration: number;
        start: number;
      };
    }>;
  }>;
  version: number;
}

/**
 * Chuyển đổi dự án Synapes Studio thành file draft_content.json chuẩn CapCut PC
 */
export function exportToCapCutDraft(project: Project): CapCutDraftContent {
  const is16_9 = project.aspectRatio === '16:9';
  const width = is16_9 ? 1920 : 1080;
  const height = is16_9 ? 1080 : 1920;
  const ratio = is16_9 ? '16:9' : '9:16';

  const scenes: StoryboardScene[] = project.storyboard && project.storyboard.length > 0
    ? project.storyboard
    : [
        {
          id: 1,
          sceneNumber: 1,
          timeRange: '0:00 - 0:10',
          startSec: 0,
          endSec: 10,
          headline: project.title,
          voiceover: project.title,
          visualPrompt: 'Cinematic shot',
          clipUrl: project.videoUrl,
        },
      ];

  const videoMaterials: CapCutDraftContent['materials']['videos'] = [];
  const textMaterials: CapCutDraftContent['materials']['texts'] = [];
  const videoSegments: any[] = [];
  const textSegments: any[] = [];

  let currentMicrosec = 0;

  scenes.forEach((sc, index) => {
    const sceneDurSec = Math.max(2, (sc.endSec - sc.startSec) || 6);
    const sceneDurMicro = Math.round(sceneDurSec * 1000000);
    const videoMatId = `mat_video_${index + 1}`;
    const textMatId = `mat_text_${index + 1}`;

    videoMaterials.push({
      id: videoMatId,
      path: sc.clipUrl || project.videoUrl || '',
      duration: sceneDurMicro,
      material_name: `Cảnh ${sc.sceneNumber || index + 1}: ${sc.headline || 'Footage'}`,
    });

    videoSegments.push({
      id: `seg_video_${index + 1}`,
      material_id: videoMatId,
      target_timerange: {
        start: currentMicrosec,
        duration: sceneDurMicro,
      },
      source_timerange: {
        start: 0,
        duration: sceneDurMicro,
      },
    });

    // Subtitle text material
    if (sc.voiceover || sc.headline) {
      textMaterials.push({
        id: textMatId,
        content: sc.voiceover || sc.headline || '',
        font_size: 9.0,
        font_color: '#FFFFFF',
      });

      textSegments.push({
        id: `seg_text_${index + 1}`,
        material_id: textMatId,
        target_timerange: {
          start: currentMicrosec,
          duration: sceneDurMicro,
        },
        source_timerange: {
          start: 0,
          duration: sceneDurMicro,
        },
      });
    }

    currentMicrosec += sceneDurMicro;
  });

  // Audio track (voiceover or background music)
  const audioMaterials: CapCutDraftContent['materials']['audios'] = [];
  const audioSegments: any[] = [];

  if (project.voiceoverTrack?.audioUrl || (project.musicTrack as any)?.audioUrl) {
    const audioMatId = 'mat_audio_main';
    audioMaterials.push({
      id: audioMatId,
      path: project.voiceoverTrack?.audioUrl || (project.musicTrack as any)?.audioUrl || '',
      duration: currentMicrosec,
      name: project.voiceoverTrack?.voiceName || project.musicTrack?.name || 'Audio Track',
    });

    audioSegments.push({
      id: 'seg_audio_1',
      material_id: audioMatId,
      target_timerange: {
        start: 0,
        duration: currentMicrosec,
      },
      source_timerange: {
        start: 0,
        duration: currentMicrosec,
      },
    });
  }

  return {
    canvas_config: { width, height, ratio },
    duration: currentMicrosec,
    materials: {
      videos: videoMaterials,
      audios: audioMaterials,
      texts: textMaterials,
      speeds: [{ id: 'speed_normal', speed: 1.0 }],
    },
    tracks: [
      {
        id: 'track_video_main',
        type: 'video',
        segments: videoSegments,
      },
      {
        id: 'track_audio_main',
        type: 'audio',
        segments: audioSegments,
      },
      {
        id: 'track_text_subtitles',
        type: 'text',
        segments: textSegments,
      },
    ],
    version: 360000,
  };
}

/**
 * Tải file draft_content.json về máy tính để kéo thả vào thư mục CapCut Drafts
 */
export function downloadCapCutDraftFile(project: Project): void {
  if (typeof window === 'undefined') return;

  const draftData = exportToCapCutDraft(project);
  const blob = new Blob([JSON.stringify(draftData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `draft_content_${project.code || 'SYNAPES'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
