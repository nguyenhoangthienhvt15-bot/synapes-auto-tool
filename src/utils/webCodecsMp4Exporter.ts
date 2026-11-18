import {
  Output,
  Mp4OutputFormat,
  BufferTarget,
  StreamTarget,
  CanvasSource,
  AudioBufferSource,
  QUALITY_HIGH,
  type StreamTargetChunk,
} from 'mediabunny';

export interface WebCodecsExportOptions {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  durationSec: number;
  fps?: number;
  audioBuffer?: AudioBuffer | null;
  filename?: string;
  preferFileSystemPicker?: boolean;
  onRenderFrame: (frameIndex: number, timestampSec: number) => Promise<void> | void;
  onProgress?: (percent: number, message: string) => void;
}

export interface WebCodecsExportResult {
  backend: 'mediabunny-stream-fs' | 'mediabunny-buffer-blob';
  mimeType: string;
  byteLength: number;
  blob?: Blob;
  filename: string;
}

export function isWebCodecsExportSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as any).VideoEncoder !== 'undefined' &&
    typeof (window as any).AudioEncoder !== 'undefined'
  );
}

/**
 * Hardware-accelerated MP4 H.264/AAC exporter powered by Vanilagy/mediabunny + WebCodecs.
 * Streams directly to disk via File System Access API (`showSaveFilePicker`) when supported
 * to prevent RAM bloat on long videos, falling back cleanly to BufferTarget Blob.
 */
export async function exportCanvasWithMediabunnyMp4(
  options: WebCodecsExportOptions
): Promise<WebCodecsExportResult> {
  const {
    canvas,
    durationSec,
    fps = 30,
    audioBuffer = null,
    filename = 'synapes-studio-export.mp4',
    preferFileSystemPicker = true,
    onRenderFrame,
    onProgress,
  } = options;

  if (!isWebCodecsExportSupported()) {
    throw new Error('Trình duyệt hiện tại không hỗ trợ WebCodecs VideoEncoder/AudioEncoder để xuất MP4 trực tiếp.');
  }

  const safeFps = Math.max(15, Math.min(60, Math.round(fps)));
  const totalFrames = Math.max(1, Math.round(Math.max(1, durationSec) * safeFps));
  const frameDurationSec = 1 / safeFps;

  let writableStream: FileSystemWritableFileStream | null = null;
  let streamTargetBytes = 0;

  if (preferFileSystemPicker && typeof (window as any).showSaveFilePicker === 'function') {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'MP4 Video (H.264 / AAC)',
            accept: { 'video/mp4': ['.mp4'] },
          },
        ],
      });
      writableStream = await handle.createWritable();
    } catch {
      writableStream = null;
    }
  }

  let target: StreamTarget | BufferTarget;
  if (writableStream) {
    const sink = new WritableStream<StreamTargetChunk>({
      async write(chunk) {
        streamTargetBytes += chunk.data.byteLength;
        await writableStream!.write({
          type: 'write',
          data: chunk.data,
          position: chunk.position,
        });
      },
      async close() {
        await writableStream!.close();
      },
      async abort() {
        await writableStream!.abort();
      },
    });
    target = new StreamTarget(sink, { chunked: true });
  } else {
    target = new BufferTarget();
  }

  const format = new Mp4OutputFormat({ fastStart: writableStream ? false : 'in-memory' });
  const output = new Output({ format, target });

  const videoSource = new CanvasSource(canvas, {
    codec: 'avc',
    quality: QUALITY_HIGH,
  });
  output.addVideoTrack(videoSource, { frameRate: safeFps });

  let audioSource: AudioBufferSource | null = null;
  if (audioBuffer) {
    audioSource = new AudioBufferSource({
      codec: 'aac',
      quality: QUALITY_HIGH,
    });
    output.addAudioTrack(audioSource);
  }

  await output.start();
  onProgress?.(5, 'Đang khởi tạo bộ mã hóa phần cứng WebCodecs H.264 + Mediabunny...');

  if (audioSource && audioBuffer) {
    await audioSource.add(audioBuffer);
  }

  for (let frameIdx = 0; frameIdx < totalFrames; frameIdx += 1) {
    const timestampSec = frameIdx * frameDurationSec;
    await onRenderFrame(frameIdx, timestampSec);
    await videoSource.add(timestampSec, frameDurationSec);
    if (frameIdx % Math.max(1, Math.floor(safeFps / 2)) === 0 || frameIdx === totalFrames - 1) {
      const pct = Math.min(95, Math.round(((frameIdx + 1) / totalFrames) * 90) + 5);
      onProgress?.(pct, `Đang mã hóa WebCodecs frame ${frameIdx + 1}/${totalFrames}...`);
    }
  }

  await output.finalize();
  const mimeType = await output.getMimeType().catch(() => 'video/mp4');
  onProgress?.(100, 'Hoàn tất đóng gói MP4 H.264/AAC chuẩn FastStart!');

  if (target instanceof BufferTarget) {
    const buf = target.buffer || new ArrayBuffer(0);
    const blob = new Blob([buf], { type: mimeType || 'video/mp4' });
    return {
      backend: 'mediabunny-buffer-blob',
      mimeType,
      byteLength: buf.byteLength,
      blob,
      filename,
    };
  }

  return {
    backend: 'mediabunny-stream-fs',
    mimeType,
    byteLength: streamTargetBytes,
    filename,
  };
}
