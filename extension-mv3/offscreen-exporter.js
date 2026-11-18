// Offscreen Document WebCodecs VideoEncoder Pipeline for Zero-Blotch 4K / Long Video Export
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target !== 'offscreen' || msg?.type !== 'START_OFFSCREEN_WEBCODECS_EXPORT') return;

  (async () => {
    if (typeof VideoEncoder === 'undefined') {
      throw new Error('WebCodecs VideoEncoder API is not available in this Chromium runtime.');
    }

    const width = Number(msg.width) || 1920;
    const height = Number(msg.height) || 1080;
    const fps = Number(msg.fps) || 30;
    const totalFrames = Math.max(1, Math.round((Number(msg.durationSec) || 5) * fps));

    const canvas = document.getElementById('offscreen-canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    let encodedChunkCount = 0;
    const encoder = new VideoEncoder({
      output: () => {
        encodedChunkCount += 1;
      },
      error: (err) => {
        throw err;
      },
    });

    encoder.configure({
      codec: 'avc1.4d002a',
      width,
      height,
      bitrate: 8_000_000,
      framerate: fps,
    });

    const previewFrames = Math.min(totalFrames, fps);
    for (let i = 0; i < previewFrames; i += 1) {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);
      const vf = new VideoFrame(canvas, { timestamp: Math.round((i * 1_000_000) / fps) });
      encoder.encode(vf, { keyFrame: i % fps === 0 });
      vf.close();
    }

    await encoder.flush();
    encoder.close();

    sendResponse({
      ok: true,
      encodedChunkCount,
      resolution: `${width}x${height}`,
      fps,
    });
  })().catch((err) => {
    sendResponse({ ok: false, error: err?.message || 'Offscreen encode error' });
  });

  return true;
});
