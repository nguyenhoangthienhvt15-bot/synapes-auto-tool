import { VoiceProfile, VoiceLanguage } from '../types';

export const VIETNAMESE_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'vi-apple-keynote-male',
    name: 'Anh Tuấn Kiệt (Apple Keynote Master)',
    language: 'vi',
    gender: 'Nam',
    region: 'Toàn Quốc (Apple Commercial)',
    toneTag: 'Đĩnh đạc • Sang trọng • Keynote Master',
    description:
      'Chất giọng phát thanh viên chính thức giới thiệu sản phẩm Apple tại Việt Nam: âm sắc trầm ấm, phát âm tròn vành rõ chữ, nhịp điệu thong thả, tự tin, chuẩn âm hưởng video quảng cáo điện ảnh.',
    sampleSentence:
      'Chào mừng bạn đến với kỷ nguyên công nghệ tiếp theo. Thiết kế nguyên khối Titan chuẩn hàng không vũ trụ và siêu vi xử lý thế hệ mới.',
    pitch: 0.82,
    rate: 0.98,
    isRecommended: true,
    neuralVoiceId: 'vi-VN-NamMinhNeural',
    geminiVoiceName: 'Charon',
    openaiVoiceName: 'onyx',
    dspDetuneCents: -420,
    acousticSignature: '95Hz Deep Baritone • Apple Master EQ • Đen Sâu Obsidian',
    formantEq: {
      lowShelfHz: 180,
      lowGainDb: 7.5,
      midPeakingHz: 1250,
      midGainDb: -1.5,
      highShelfHz: 4500,
      highGainDb: 2.5,
    },
  },
  {
    id: 'vi-hn-male-1',
    name: 'Anh Hoàng (Hà Nội)',
    language: 'vi',
    gender: 'Nam',
    region: 'Miền Bắc',
    toneTag: 'Trầm ấm • Uy lực (Baritone)',
    description:
      'Chất giọng nam chuẩn phát thanh viên Hà Nội, dải trầm 105Hz dày và uy quyền, phong thái điềm tĩnh, tối ưu cho review công nghệ cao cấp & phóng sự.',
    sampleSentence:
      'Chào mừng quý vị và các bạn đến với bản đánh giá chuyên sâu thiết bị công nghệ đột phá thế hệ mới.',
    pitch: 0.86,
    rate: 1.02,
    isRecommended: true,
    neuralVoiceId: 'vi-VN-NamMinhNeural',
    geminiVoiceName: 'Charon',
    openaiVoiceName: 'onyx',
    dspDetuneCents: -360,
    acousticSignature: '105Hz Baritone • Trầm Dày +6.5dB • Nam Hà Nội',
    formantEq: {
      lowShelfHz: 190,
      lowGainDb: 6.5,
      midPeakingHz: 1350,
      midGainDb: -2.0,
      highShelfHz: 4200,
      highGainDb: 1.5,
    },
  },
  {
    id: 'vi-hn-female-1',
    name: 'Chị Hoài My (Hà Nội)',
    language: 'vi',
    gender: 'Nữ',
    region: 'Miền Bắc',
    toneTag: 'Truyền cảm • Tự nhiên (Mezzo)',
    description:
      'Giọng nữ Hà Nội nhẹ nhàng, nhấn nhá nhịp điệu giàu cảm xúc, phát âm tròn vành rõ chữ, chuẩn phong cách podcast & kể chuyện thương hiệu.',
    sampleSentence:
      'Khám phá sự hoàn hảo trong từng đường nét thiết kế tinh xảo và trải nghiệm người dùng vượt trội.',
    pitch: 1.04,
    rate: 1.0,
    isRecommended: true,
    neuralVoiceId: 'vi-VN-HoaiMyNeural',
    geminiVoiceName: 'Aoede',
    openaiVoiceName: 'nova',
    dspDetuneCents: 120,
    acousticSignature: '215Hz Mezzo • Trong Trẻo +3.5dB • Nữ Hà Nội',
    formantEq: {
      lowShelfHz: 220,
      lowGainDb: -1.5,
      midPeakingHz: 2450,
      midGainDb: 3.5,
      highShelfHz: 5200,
      highGainDb: 3.0,
    },
  },
  {
    id: 'vi-sg-male-1',
    name: 'Anh Nam Minh (Sài Gòn)',
    language: 'vi',
    gender: 'Nam',
    region: 'Miền Nam',
    toneTag: 'Năng động • Hào sảng (Tenor)',
    description:
      'Phong cách nam Sài Gòn phóng khoáng, trẻ trung, nhịp điệu nhanh và bắt tai, giữ nhịp tương tác cao cho TikTok Shop, YouTube Shorts & Reels.',
    sampleSentence:
      'Chiếc máy này thật sự quá đỉnh luôn anh em ơi! Cùng mình xem ngay tính năng đột phá ở góc trái màn hình nha!',
    pitch: 0.94,
    rate: 1.18,
    isRecommended: true,
    neuralVoiceId: 'vi-VN-NamMinhNeural',
    geminiVoiceName: 'Puck',
    openaiVoiceName: 'echo',
    dspDetuneCents: -180,
    acousticSignature: '145Hz Tenor • Sáng Rõ +4.5dB • Nam Sài Gòn',
    formantEq: {
      lowShelfHz: 230,
      lowGainDb: 2.0,
      midPeakingHz: 1650,
      midGainDb: 4.5,
      highShelfHz: 4800,
      highGainDb: 4.5,
    },
  },
  {
    id: 'vi-sg-female-1',
    name: 'Chị Diệu Thảo (Sài Gòn)',
    language: 'vi',
    gender: 'Nữ',
    region: 'Miền Nam',
    toneTag: 'Tươi vui • Ngọt ngào (Soprano)',
    description:
      'Giọng nữ Sài Gòn ngọt ngào, âm sắc cao sáng tươi tắn, tạo cảm giác thân thiện gần gũi cho video ẩm thực, du lịch, lifestyle và livestream.',
    sampleSentence:
      'Hôm nay Thảo sẽ khui hộp siêu phẩm mới nhất và chia sẻ cảm nhận thực tế sau một tuần trải nghiệm nha mọi người ơi!',
    pitch: 1.18,
    rate: 1.12,
    neuralVoiceId: 'vi-VN-HoaiMyNeural',
    geminiVoiceName: 'Kore',
    openaiVoiceName: 'shimmer',
    dspDetuneCents: 340,
    acousticSignature: '265Hz Soprano • Ngọt Sáng +6.5dB • Nữ Sài Gòn',
    formantEq: {
      lowShelfHz: 260,
      lowGainDb: -4.5,
      midPeakingHz: 2950,
      midGainDb: 5.5,
      highShelfHz: 6200,
      highGainDb: 6.5,
    },
  },
  {
    id: 'vi-hue-female-1',
    name: 'Chị Phương Linh (Huế / Miền Trung)',
    language: 'vi',
    gender: 'Nữ',
    region: 'Miền Trung',
    toneTag: 'Trữ tình • Dịu dàng • Sâu lắng',
    description:
      'Âm sắc nữ Huế ngọt ngào thùy mị, ngữ điệu trầm bổng tinh tế, chuẩn mực cho kịch bản du lịch, di sản, đời sống và phóng sự nghệ thuật.',
    sampleSentence:
      'Mời bạn cùng lắng lòng chiêm ngưỡng vẻ đẹp tĩnh lặng và những dấu ấn thời gian vượt bậc.',
    pitch: 1.08,
    rate: 0.96,
    neuralVoiceId: 'vi-VN-HoaiMyNeural',
    geminiVoiceName: 'Aoede',
    openaiVoiceName: 'nova',
    dspDetuneCents: 180,
    acousticSignature: '225Hz Poetic Mezzo • Mềm Mại +4dB • Nữ Miền Trung',
    formantEq: {
      lowShelfHz: 230,
      lowGainDb: -1.0,
      midPeakingHz: 2100,
      midGainDb: 3.8,
      highShelfHz: 4800,
      highGainDb: 3.5,
    },
  },
  {
    id: 'vi-dn-male-1',
    name: 'Anh Văn Quang (Đà Nẵng)',
    language: 'vi',
    gender: 'Nam',
    region: 'Miền Trung',
    toneTag: 'Dõng dạc • Rõ ràng (Anchor)',
    description:
      'Phát âm rành mạch, tốc độ ổn định, dải trung dày khỏe, tạo độ tin cậy tuyệt đối cho bản tin tài chính, bất động sản & thời sự 24h.',
    sampleSentence:
      'Toàn cảnh chu kỳ thị trường và những phân tích kỹ thuật đáng chú ý nhất trong phiên giao dịch ngày hôm nay.',
    pitch: 0.88,
    rate: 1.06,
    neuralVoiceId: 'vi-VN-NamMinhNeural',
    geminiVoiceName: 'Fenrir',
    openaiVoiceName: 'fable',
    dspDetuneCents: -280,
    acousticSignature: '122Hz Anchor • Trung Dày +5.5dB • Nam Miền Trung',
    formantEq: {
      lowShelfHz: 205,
      lowGainDb: 4.5,
      midPeakingHz: 1150,
      midGainDb: 5.5,
      highShelfHz: 3900,
      highGainDb: 2.0,
    },
  },
  {
    id: 'vi-neural-fast',
    name: 'SYNAPES Neural v3 Turbo',
    language: 'vi',
    gender: 'Nam',
    region: 'AI Neural',
    toneTag: 'Tốc độ cao 1.28x • Giữ chân',
    description:
      'Mô hình AI tổng hợp âm đọc siêu tốc 1.28x theo công thức Alex Hormozi, nén động lực học mạnh, triệt tiêu khoảng lặng thừa, tối ưu tỷ lệ xem hết video.',
    sampleSentence:
      'Ba giây đầu tiên quyết định người xem ở lại hay lướt qua! Hãy nhìn vào tính năng đột phá số một ngay bây giờ!',
    pitch: 0.98,
    rate: 1.28,
    isRecommended: true,
    neuralVoiceId: 'vi-VN-NamMinhNeural',
    geminiVoiceName: 'Orus',
    openaiVoiceName: 'alloy',
    dspDetuneCents: -120,
    acousticSignature: '1.28x Hormozi Viral • Punchy EQ +6dB • AI Neural',
    formantEq: {
      lowShelfHz: 185,
      lowGainDb: 4.5,
      midPeakingHz: 2150,
      midGainDb: 6.0,
      highShelfHz: 5400,
      highGainDb: 6.0,
    },
  },
];

export const ENGLISH_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'en-us-guy',
    name: 'Guy (US Silicon Valley)',
    language: 'en',
    gender: 'Male',
    region: 'North America',
    toneTag: 'Confident • Tech Commercial',
    description:
      'Crisp, articulate American tech reviewer tone. Perfect for Silicon Valley product launches and hardware unboxings.',
    sampleSentence:
      'Welcome back to the studio. Today we are testing the next generation of dual-screen flagship hardware.',
    pitch: 0.92,
    rate: 1.05,
    isRecommended: true,
    neuralVoiceId: 'en-US-GuyNeural',
    geminiVoiceName: 'Puck',
    openaiVoiceName: 'onyx',
    dspDetuneCents: -240,
    acousticSignature: '115Hz US Baritone • Crisp Presence • Silicon Valley',
    formantEq: {
      lowShelfHz: 195,
      lowGainDb: 5.0,
      midPeakingHz: 1600,
      midGainDb: 3.0,
      highShelfHz: 4800,
      highGainDb: 3.5,
    },
  },
  {
    id: 'en-us-jenny',
    name: 'Jenny (US California)',
    language: 'en',
    gender: 'Female',
    region: 'North America',
    toneTag: 'Warm • Engaging • Lifestyle',
    description:
      'Friendly, naturally paced conversational female voice. Great for tutorials, explainer videos, and social media reels.',
    sampleSentence:
      'Discover seamless multitasking with an ultra-thin foldable display engineered for creators on the go.',
    pitch: 1.06,
    rate: 1.08,
    isRecommended: true,
    neuralVoiceId: 'en-US-JennyNeural',
    geminiVoiceName: 'Aoede',
    openaiVoiceName: 'nova',
    dspDetuneCents: 60,
    acousticSignature: '220Hz US Warm Female • Air +4dB • California',
    formantEq: {
      lowShelfHz: 230,
      lowGainDb: -2.0,
      midPeakingHz: 2500,
      midGainDb: 3.8,
      highShelfHz: 5500,
      highGainDb: 4.2,
    },
  },
  {
    id: 'en-gb-ryan',
    name: 'Ryan (UK London)',
    language: 'en',
    gender: 'Male',
    region: 'United Kingdom',
    toneTag: 'British BBC • Sophisticated',
    description:
      'Deep, resonant British English accent with cinematic gravitas. Ideal for luxury commercials and documentary trailers.',
    sampleSentence:
      'A monumental leap forward in computational intelligence and refined industrial craftsmanship.',
    pitch: 0.85,
    rate: 0.98,
    neuralVoiceId: 'en-GB-RyanNeural',
    geminiVoiceName: 'Charon',
    openaiVoiceName: 'fable',
    dspDetuneCents: -360,
    acousticSignature: '98Hz BBC Deep Bass • +6.5dB Warmth • UK London',
    formantEq: {
      lowShelfHz: 180,
      lowGainDb: 6.5,
      midPeakingHz: 1250,
      midGainDb: 2.5,
      highShelfHz: 4000,
      highGainDb: 1.8,
    },
  },
  {
    id: 'en-gb-sonia',
    name: 'Sonia (UK Oxford)',
    language: 'en',
    gender: 'Female',
    region: 'United Kingdom',
    toneTag: 'Elegant • Professional Narration',
    description:
      'Polished British RP pronunciation with pristine clarity. Perfect for educational, corporate and historical narratives.',
    sampleSentence:
      'In the span of a single generation, artificial intelligence has fundamentally redefined human creativity.',
    pitch: 1.12,
    rate: 1.04,
    neuralVoiceId: 'en-GB-SoniaNeural',
    geminiVoiceName: 'Kore',
    openaiVoiceName: 'shimmer',
    dspDetuneCents: 180,
    acousticSignature: '245Hz British RP Soprano • Crystal Highs • Oxford',
    formantEq: {
      lowShelfHz: 250,
      lowGainDb: -3.5,
      midPeakingHz: 2800,
      midGainDb: 4.5,
      highShelfHz: 5800,
      highGainDb: 5.0,
    },
  },
  {
    id: 'en-us-tony',
    name: 'Tony (US High-Paced)',
    language: 'en',
    gender: 'Male',
    region: 'AI Neural',
    toneTag: 'Fast Pacing • Retention Master',
    description:
      'Punchy, dynamic US male creator voice built for high retention YouTube Shorts, TikTok and fast video sales letters.',
    sampleSentence:
      'If you want to save five hours every single day, this new AI workflow is about to change everything for you!',
    pitch: 0.96,
    rate: 1.26,
    isRecommended: true,
    neuralVoiceId: 'en-US-ChristopherNeural',
    geminiVoiceName: 'Orus',
    openaiVoiceName: 'echo',
    dspDetuneCents: -170,
    acousticSignature: '1.26x Fast Viral • Broadcast Compression • AI Neural',
    formantEq: {
      lowShelfHz: 190,
      lowGainDb: 4.0,
      midPeakingHz: 2100,
      midGainDb: 5.5,
      highShelfHz: 5200,
      highGainDb: 5.5,
    },
  },
];

export const ALL_VOICE_PROFILES: VoiceProfile[] = [
  ...VIETNAMESE_VOICE_PROFILES,
  ...ENGLISH_VOICE_PROFILES,
];

// Global Web Audio context & active audition state
let sharedAuditionCtx: AudioContext | null = null;
let sharedAuditionAnalyser: AnalyserNode | null = null;
let activeAuditionSource: AudioBufferSourceNode | null = null;
let activeAuditionAbort: AbortController | null = null;
const ttsBufferCache = new Map<string, { rawBuffer: ArrayBuffer; engine: string }>();

function getOrCreateAuditionContext(): { ctx: AudioContext; analyser: AnalyserNode } {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!sharedAuditionCtx) {
    sharedAuditionCtx = new AudioCtx();
    sharedAuditionAnalyser = sharedAuditionCtx.createAnalyser();
    sharedAuditionAnalyser.fftSize = 64;
    sharedAuditionAnalyser.smoothingTimeConstant = 0.72;
    sharedAuditionAnalyser.connect(sharedAuditionCtx.destination);
  }
  if (sharedAuditionCtx.state === 'suspended') {
    sharedAuditionCtx.resume().catch(() => { });
  }
  return { ctx: sharedAuditionCtx, analyser: sharedAuditionAnalyser! };
}

/**
 * Đọc dữ liệu phổ tần số thực tế (16 cột) từ giọng đọc đang phát
 */
export function getActiveVoiceSpectrum(barCount = 16): number[] {
  if (!sharedAuditionAnalyser || !activeAuditionSource) {
    return new Array(barCount).fill(8);
  }
  const freqData = new Uint8Array(sharedAuditionAnalyser.frequencyBinCount);
  sharedAuditionAnalyser.getByteFrequencyData(freqData);
  const bars: number[] = [];
  for (let i = 0; i < barCount; i++) {
    const val = freqData[i + 1] || 0;
    bars.push(Math.max(8, Math.min(100, Math.round((val / 255) * 100))));
  }
  return bars;
}

/**
 * Dừng ngay lập tức mọi âm thanh thử giọng đang phát
 */
export function stopVoiceAudition() {
  if (activeAuditionAbort) {
    activeAuditionAbort.abort();
    activeAuditionAbort = null;
  }
  if (activeAuditionSource) {
    try {
      activeAuditionSource.onended = null;
      activeAuditionSource.stop();
      activeAuditionSource.disconnect();
    } catch { }
    activeAuditionSource = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch { }
  }
}

/**
 * Thuật toán WSOLA / Granular Time-Domain Pitch & Tempo Vocoder:
 * Biến đổi độc lập Cao độ (Pitch / Semitones) và Tốc độ đọc (Tempo / Rate) trên dữ liệu PCM thực tế
 * giúp tách biệt hoàn toàn giọng Nam (Baritone/Tenor) và giọng Nữ (Mezzo/Soprano) cùng chất giọng vùng miền!
 */
export function processVocalTractPitchAndTempo(
  ctx: AudioContext,
  inputBuffer: AudioBuffer,
  pitchRatio: number,
  tempoRatio: number
): AudioBuffer {
  const safePitch = Math.max(0.62, Math.min(1.55, pitchRatio));
  const safeTempo = Math.max(0.65, Math.min(1.65, tempoRatio));

  if (Math.abs(safePitch - 1.0) < 0.02 && Math.abs(safeTempo - 1.0) < 0.02) {
    return inputBuffer;
  }

  const sampleRate = inputBuffer.sampleRate;
  const numChannels = inputBuffer.numberOfChannels;
  const inLen = inputBuffer.length;

  // Step 1: Time-stretch by ratio S = safePitch / safeTempo using Hann-windowed overlap-add (grain = 32ms)
  const stretchRatio = safePitch / safeTempo;
  const grainSize = Math.floor(sampleRate * 0.032);
  const hopOut = Math.floor(grainSize / 2);
  const hopIn = Math.max(1, Math.floor(hopOut / stretchRatio));

  const stretchedLen = Math.max(grainSize, Math.floor(inLen * stretchRatio));
  const finalLen = Math.max(128, Math.floor(stretchedLen / safePitch));
  const outBuffer = ctx.createBuffer(numChannels, finalLen, sampleRate);

  // Precompute Hann window
  const hann = new Float32Array(grainSize);
  for (let i = 0; i < grainSize; i++) {
    hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (grainSize - 1)));
  }

  for (let ch = 0; ch < numChannels; ch++) {
    const inData = inputBuffer.getChannelData(ch);
    const stretched = new Float32Array(stretchedLen + grainSize);
    const norm = new Float32Array(stretchedLen + grainSize);

    let inPos = 0;
    let outPos = 0;
    while (inPos + grainSize < inLen && outPos + grainSize < stretched.length) {
      // Local cross-correlation alignment within +-4ms to eliminate phase comb artifacts
      let bestOffset = 0;
      if (outPos > 0) {
        const searchRadius = Math.min(Math.floor(sampleRate * 0.004), 96);
        let maxCorr = -Infinity;
        for (let off = -searchRadius; off <= searchRadius; off += 4) {
          const candidatePos = inPos + off;
          if (candidatePos < 0 || candidatePos + grainSize >= inLen) continue;
          let corr = 0;
          for (let k = 0; k < 128; k += 4) {
            corr += stretched[outPos + k] * inData[candidatePos + k];
          }
          if (corr > maxCorr) {
            maxCorr = corr;
            bestOffset = off;
          }
        }
      }

      const actualIn = Math.max(0, Math.min(inLen - grainSize, inPos + bestOffset));
      for (let i = 0; i < grainSize; i++) {
        const w = hann[i];
        stretched[outPos + i] += inData[actualIn + i] * w;
        norm[outPos + i] += w;
      }

      inPos += hopIn;
      outPos += hopOut;
    }

    for (let i = 0; i < stretchedLen; i++) {
      if (norm[i] > 0.001) {
        stretched[i] /= norm[i];
      }
    }

    // Step 2: Resample by safePitch (cubic Hermite / linear interpolation) to shift fundamental pitch
    const outData = outBuffer.getChannelData(ch);
    for (let i = 0; i < finalLen; i++) {
      const srcIdx = i * safePitch;
      const idx0 = Math.floor(srcIdx);
      const frac = srcIdx - idx0;
      const s0 = stretched[Math.min(stretchedLen - 1, idx0)] || 0;
      const s1 = stretched[Math.min(stretchedLen - 1, idx0 + 1)] || 0;
      outData[i] = s0 + frac * (s1 - s0);
    }
  }

  return outBuffer;
}

/**
 * Xây dựng chuỗi bộ lọc âm học Formant 3-Band EQ + Broadcast Compressor cho từng giọng đọc
 */
function connectVocalFormantChain(
  ctx: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  profile: VoiceProfile
) {
  const eq = profile.formantEq || {
    lowShelfHz: 200,
    lowGainDb: 0,
    midPeakingHz: 1800,
    midGainDb: 0,
    highShelfHz: 4800,
    highGainDb: 0,
  };

  const lowShelf = ctx.createBiquadFilter();
  lowShelf.type = 'lowshelf';
  lowShelf.frequency.value = eq.lowShelfHz;
  lowShelf.gain.value = eq.lowGainDb;

  const midPeaking = ctx.createBiquadFilter();
  midPeaking.type = 'peaking';
  midPeaking.frequency.value = eq.midPeakingHz;
  midPeaking.Q.value = 1.15;
  midPeaking.gain.value = eq.midGainDb;

  const highShelf = ctx.createBiquadFilter();
  highShelf.type = 'highshelf';
  highShelf.frequency.value = eq.highShelfHz;
  highShelf.gain.value = eq.highGainDb;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -20;
  compressor.knee.value = 18;
  compressor.ratio.value = 3.5;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.16;

  source.connect(lowShelf);
  lowShelf.connect(midPeaking);
  midPeaking.connect(highShelf);
  highShelf.connect(compressor);
  compressor.connect(destination);
}

/**
 * Chia văn bản dài thành các câu ngắn tự nhiên (<= 185 ký tự) để tổng hợp Neural TTS mượt mà
 */
function splitTextIntoChunks(text: string, maxLen = 185): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxLen) return [cleaned];

  const rawSentences = cleaned.split(/(?<=[.!?।,;])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const s of rawSentences) {
    if ((current + ' ' + s).trim().length <= maxLen) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) chunks.push(current);
      if (s.length <= maxLen) {
        current = s;
      } else {
        // Hard split by words
        const words = s.split(' ');
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLen) {
            sub = (sub + ' ' + w).trim();
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        current = sub;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Tải và giải mã âm thanh Neural TTS từ `/api/tts` (OpenAI Studio / Edge Neural / Google Neural)
 */
async function fetchAndDecodeNeuralAudio(
  ctx: AudioContext,
  text: string,
  profile: VoiceProfile,
  signal?: AbortSignal,
  customRate?: number,
  customPitch?: number
): Promise<{ audioBuffer: AudioBuffer; engine: string }> {
  const chunks = splitTextIntoChunks(text, 180);
  const decodedBuffers: AudioBuffer[] = [];
  let resolvedEngine = 'edge-neural';

  const effRate = customRate ?? profile.rate ?? 1.0;
  const effPitch = customPitch ?? profile.pitch ?? 1.0;
  const ratePct = `${Math.round((effRate - 1.0) * 100)}%`;
  const pitchHz = `${Math.round((effPitch - 1.0) * 80)}Hz`;

  // Tìm kiếm OpenAI API Key đã lưu trong tài khoản người dùng (nếu có)
  let savedOpenAiKey = '';
  try {
    const session = localStorage.getItem('synapes_active_user_session');
    if (session) {
      const user = JSON.parse(session);
      const profileData = localStorage.getItem(`synapes_user_profile_${user.code}`);
      if (profileData) {
        const parsed = JSON.parse(profileData);
        if (parsed.aiConfig?.openai?.apiKey && parsed.aiConfig.openai.apiKey.startsWith('sk-')) {
          savedOpenAiKey = parsed.aiConfig.openai.apiKey;
        }
      }
    }
  } catch { }

  for (const chunk of chunks) {
    // Cache key gắn chặt với Profile ID, Rate, Pitch và Text để không bao giờ bị phát trùng âm thanh giữa các nhân vật!
    const cacheKey = `${profile.id}:${effRate.toFixed(2)}:${effPitch.toFixed(2)}:${savedOpenAiKey ? 'oai:' : 'std:'}${chunk}`;
    let cached = ttsBufferCache.get(cacheKey);

    if (!cached) {
      const isFemale = profile.gender === 'Nữ' || profile.gender === 'Female';
      const defaultNativeVoice = isFemale ? 'vi-VN-HoaiMyNeural' : 'vi-VN-NamMinhNeural';
      const defaultOpenAiVoice = profile.openaiVoiceName || (isFemale ? 'nova' : 'onyx');

      const params = new URLSearchParams({
        text: chunk,
        lang: profile.language,
        profileId: profile.id,
        voice: profile.neuralVoiceId || defaultNativeVoice,
        openaiVoice: defaultOpenAiVoice,
        rate: ratePct,
        pitch: pitchHz,
      });

      if (savedOpenAiKey) {
        params.set('openaiKey', savedOpenAiKey);
      }

      const resp = await fetch(`/api/tts?${params.toString()}`, { signal });
      if (!resp.ok) {
        throw new Error(`TTS HTTP ${resp.status}`);
      }
      const engineHeader = resp.headers.get('X-TTS-Engine') || 'neural-dsp';
      const arrayBuf = await resp.arrayBuffer();
      if (arrayBuf.byteLength < 100) {
        throw new Error('Empty TTS audio response');
      }
      cached = { rawBuffer: arrayBuf, engine: engineHeader };
      ttsBufferCache.set(cacheKey, cached);
    }

    resolvedEngine = cached.engine;
    const copyBuf = cached.rawBuffer.slice(0);
    const decoded = await ctx.decodeAudioData(copyBuf);
    decodedBuffers.push(decoded);
  }

  if (decodedBuffers.length === 1) {
    return { audioBuffer: decodedBuffers[0], engine: resolvedEngine };
  }

  // Concatenate multiple sentence buffers with a 90ms natural breath pause
  const sampleRate = decodedBuffers[0].sampleRate;
  const pauseSamples = Math.floor(sampleRate * 0.09);
  const totalLen =
    decodedBuffers.reduce((acc, b) => acc + b.length, 0) +
    pauseSamples * (decodedBuffers.length - 1);

  const combined = ctx.createBuffer(1, totalLen, sampleRate);
  const outChannel = combined.getChannelData(0);
  let offset = 0;
  for (let i = 0; i < decodedBuffers.length; i++) {
    const chData = decodedBuffers[i].getChannelData(0);
    outChannel.set(chData, offset);
    offset += chData.length + pauseSamples;
  }

  return { audioBuffer: combined, engine: resolvedEngine };
}

/**
 * Tính toán tỷ lệ biến đổi Pitch thực tế dựa trên từng nhân vật (Nam/Nữ/Vùng miền) và thanh trượt của người dùng
 */
function computeEffectivePitchRatio(
  profile: VoiceProfile,
  customPitch: number | undefined,
  engineUsed: string
): number {
  const userSliderPitch = customPitch ?? profile.pitch;
  const userAdjustmentRatio = userSliderPitch / (profile.pitch || 1.0);
  const detuneCents = profile.dspDetuneCents ?? 0;

  if (engineUsed === 'openai-studio-hd') {
    // OpenAI TTS Studio HD: Giữ nguyên vẹn chất âm tự nhiên, chỉ áp dụng thanh trượt của người dùng
    return userAdjustmentRatio;
  }

  if (engineUsed === 'edge-neural') {
    // Edge Neural: Áp dụng độ lệch persona âm sắc tinh tế giữa các nhân vật cùng giới tính
    const personaCents = detuneCents * 0.55;
    return Math.pow(2, personaCents / 1200) * userAdjustmentRatio;
  }

  // Upstream Google Neural DSP: Áp dụng đầy đủ WSOLA Vocal Tract Formant Shift
  return Math.pow(2, detuneCents / 1200) * userAdjustmentRatio;
}

/**
 * Phát thử giọng đọc AI thực tế qua Web Audio Neural Vocoder & Formant EQ
 */
export function auditionVoice(
  profile: VoiceProfile,
  customText?: string,
  customRate?: number,
  customPitch?: number,
  onStart?: () => void,
  onEnd?: () => void,
  onEngineInfo?: (engineLabel: string) => void
): boolean {
  stopVoiceAudition();

  const textToSpeak = (customText?.trim() || profile.sampleSentence).trim();
  const effectiveRate = customRate ?? profile.rate;
  const abortController = new AbortController();
  activeAuditionAbort = abortController;

  (async () => {
    try {
      const { ctx, analyser } = getOrCreateAuditionContext();
      onStart?.();

      const { audioBuffer, engine } = await fetchAndDecodeNeuralAudio(
        ctx,
        textToSpeak,
        profile,
        abortController.signal,
        effectiveRate,
        customPitch
      );

      if (abortController.signal.aborted) return;

      const pitchRatio = computeEffectivePitchRatio(profile, customPitch, engine);
      const processedBuffer = processVocalTractPitchAndTempo(
        ctx,
        audioBuffer,
        pitchRatio,
        effectiveRate
      );

      const source = ctx.createBufferSource();
      source.buffer = processedBuffer;

      connectVocalFormantChain(ctx, source, analyser, profile);

      activeAuditionSource = source;
      onEngineInfo?.(
        engine === 'openai-studio-hd'
          ? `OpenAI Speech Studio 24kHz (${profile.openaiVoiceName || 'onyx'}) • Chuẩn Điện Ảnh`
          : engine === 'edge-neural'
            ? `Microsoft Edge Neural (${profile.neuralVoiceId}) • ${profile.acousticSignature || '3-Band DSP'}`
            : `Cloud Neural Audio + WSOLA Vocal Tract DSP (${profile.gender} • ${profile.region})`
      );

      source.onended = () => {
        if (activeAuditionSource === source) {
          activeAuditionSource = null;
          onEnd?.();
        }
      };

      source.start(0);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.warn('Neural TTS fallback to browser speechSynthesis:', err);
      // Fallback to browser speechSynthesis if completely offline
      fallbackBrowserSpeech(profile, textToSpeak, effectiveRate, customPitch ?? profile.pitch, onStart, onEnd);
    }
  })();

  return true;
}

function fallbackBrowserSpeech(
  profile: VoiceProfile,
  textToSpeak: string,
  rate: number,
  pitch: number,
  onStart?: () => void,
  onEnd?: () => void
) {
  if (!('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = profile.language === 'en' ? 'en-US' : 'vi-VN';
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = profile.language === 'en' ? 'en' : 'vi';
    const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
    if (langVoices.length > 0) {
      // Pick distinct index if multiple voices exist
      const isMale = profile.gender === 'Nam' || profile.gender === 'Male';
      const preferred = langVoices.find((v) =>
        isMale
          ? v.name.toLowerCase().includes('nam') ||
          v.name.toLowerCase().includes('an') ||
          v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('david') ||
          v.name.toLowerCase().includes('guy')
          : v.name.toLowerCase().includes('hoai') ||
          v.name.toLowerCase().includes('nu') ||
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('zira')
      );
      utterance.voice = preferred || langVoices[0];
    }
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}

/**
 * Bộ tạo âm thanh nền BGM điện ảnh, hiệu ứng SFX & Lồng tiếng Neural trực tiếp vào luồng ghi hình WebM
 */
export class StudioAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private destNode: MediaStreamAudioDestinationNode | null = null;
  private bgmGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isBgmPlaying = false;
  private bgmIntervalId: any = null;
  private activeVoiceSource: AudioBufferSourceNode | null = null;
  private activeVoiceAbort: AbortController | null = null;

  constructor() {
    this.initContext();
  }

  private initContext() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !this.ctx) {
        this.ctx = new AudioCtx();
        this.destNode = this.ctx.createMediaStreamDestination();

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.2;

        this.voiceGain = this.ctx.createGain();
        this.voiceGain.gain.value = 0.95;

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.42;

        this.bgmGain.connect(this.ctx.destination);
        this.bgmGain.connect(this.destNode);

        this.voiceGain.connect(this.ctx.destination);
        this.voiceGain.connect(this.destNode);

        this.sfxGain.connect(this.ctx.destination);
        this.sfxGain.connect(this.destNode);
      }
    } catch (e) {
      console.warn('Web Audio init error:', e);
    }
  }

  public getAudioStreamTrack(): MediaStreamTrack | null {
    if (!this.destNode) return null;
    const tracks = this.destNode.stream.getAudioTracks();
    return tracks.length > 0 ? tracks[0] : null;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public getVoiceGainNode(): GainNode | null {
    return this.voiceGain;
  }

  public playCustomAudioBlob(audioUrl: string, onEnd?: () => void): HTMLAudioElement | null {
    this.stopSceneVoiceover();
    this.resume();
    try {
      const audio = new Audio(audioUrl);
      audio.crossOrigin = 'anonymous';
      if (this.ctx && this.voiceGain) {
        try {
          const mediaSource = this.ctx.createMediaElementSource(audio);
          mediaSource.connect(this.voiceGain);
        } catch {
          // Fallback to standard playback if MediaElementSource already connected
        }
      }
      this.duckBgm(true);
      audio.onended = () => {
        this.duckBgm(false);
        onEnd?.();
      };
      audio.onerror = () => {
        this.duckBgm(false);
        onEnd?.();
      };
      audio.play().catch(() => {
        this.duckBgm(false);
        onEnd?.();
      });
      return audio;
    } catch {
      onEnd?.();
      return null;
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { });
    }
  }

  public stopSceneVoiceover() {
    if (this.activeVoiceAbort) {
      this.activeVoiceAbort.abort();
      this.activeVoiceAbort = null;
    }
    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.onended = null;
        this.activeVoiceSource.stop();
        this.activeVoiceSource.disconnect();
      } catch { }
      this.activeVoiceSource = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch { }
    }
    this.duckBgm(false);
  }

  /**
   * Phát giọng lồng tiếng Neural của từng phân cảnh trực tiếp qua Web Audio API
   * (Vừa phát ra loa với đúng tông giọng Nam/Nữ/Vùng miền, vừa ghi trực tiếp vào file video .webm khi xuất bản!)
   */
  public speakSceneWithNeuralVoice(
    text: string,
    profile: VoiceProfile,
    customRate?: number,
    customPitch?: number
  ) {
    this.stopSceneVoiceover();
    this.resume();
    if (!this.ctx || !this.voiceGain || !text.trim()) return;

    const ctx = this.ctx;
    const voiceDestination = this.voiceGain;
    const effectiveRate = customRate ?? profile.rate;
    const abortCtrl = new AbortController();
    this.activeVoiceAbort = abortCtrl;

    (async () => {
      try {
        this.duckBgm(true);
        const { audioBuffer, engine } = await fetchAndDecodeNeuralAudio(
          ctx,
          text,
          profile,
          abortCtrl.signal,
          effectiveRate,
          customPitch
        );
        if (abortCtrl.signal.aborted) return;

        const pitchRatio = computeEffectivePitchRatio(profile, customPitch, engine);
        const processedBuffer = processVocalTractPitchAndTempo(
          ctx,
          audioBuffer,
          pitchRatio,
          effectiveRate
        );

        const source = ctx.createBufferSource();
        source.buffer = processedBuffer;
        connectVocalFormantChain(ctx, source, voiceDestination, profile);

        this.activeVoiceSource = source;
        source.onended = () => {
          if (this.activeVoiceSource === source) {
            this.activeVoiceSource = null;
            this.duckBgm(false);
          }
        };

        source.start(0);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        fallbackBrowserSpeech(
          profile,
          text,
          effectiveRate,
          customPitch ?? profile.pitch,
          () => this.duckBgm(true),
          () => this.duckBgm(false)
        );
      }
    })();
  }

  public duckBgm(isSpeaking: boolean) {
    if (!this.bgmGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const target = isSpeaking ? 0.06 : 0.2;
    this.bgmGain.gain.cancelScheduledValues(now);
    this.bgmGain.gain.linearRampToValueAtTime(target, now + 0.15);
  }

  public playSfx(type: 'whoosh' | 'sub-drop' | 'camera-shutter' | 'chime' | 'glitch') {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (type === 'whoosh') {
      const bufferSize = ctx.sampleRate * 0.38;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(2900, now + 0.18);
      filter.frequency.exponentialRampToValueAtTime(420, now + 0.36);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.38, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.37);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.38);
    } else if (type === 'sub-drop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.45);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'camera-shutter') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'chime') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const noteTime = now + idx * 0.06;
        gain.gain.setValueAtTime(0.18, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(noteTime);
        osc.stop(noteTime + 0.36);
      });
    }
  }

  public startCinematicSoundtrack(bpm: number = 118) {
    if (this.isBgmPlaying) return;
    this.resume();
    if (!this.ctx || !this.bgmGain) return;

    this.isBgmPlaying = true;
    const ctx = this.ctx;
    const stepDuration = 60 / bpm / 2;

    const chords = [
      [220, 261.63, 329.63],
      [174.61, 220, 261.63],
      [261.63, 329.63, 392],
      [196, 246.94, 293.66],
    ];

    let step = 0;
    this.bgmIntervalId = setInterval(() => {
      if (!this.isBgmPlaying || !this.ctx) return;
      const now = ctx.currentTime;
      const chordIdx = Math.floor((step % 32) / 8);
      const chord = chords[chordIdx];

      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(chord[0] / 2, now);

      bassGain.gain.setValueAtTime(0.18, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.9);

      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(450, now);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.bgmGain!);

      bassOsc.start(now);
      bassOsc.stop(now + stepDuration);

      const hatOsc = ctx.createOscillator();
      const hatGain = ctx.createGain();
      hatOsc.type = 'triangle';
      hatOsc.frequency.setValueAtTime(7000, now);

      hatGain.gain.setValueAtTime(step % 2 === 0 ? 0.04 : 0.02, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      hatOsc.connect(hatGain);
      hatGain.connect(this.bgmGain!);

      hatOsc.start(now);
      hatOsc.stop(now + 0.06);

      step++;
    }, stepDuration * 1000);
  }

  public async preloadScenesVoiceover(scenes: any[], defaultProfile?: VoiceProfile) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const baseProf = defaultProfile || VIETNAMESE_VOICE_PROFILES[0];

    for (const scene of scenes) {
      if (!scene?.voiceover?.trim() || scene.customAudioUrl) continue;
      const isEnglish = scene.voiceLanguage === 'en';
      const profile =
        ALL_VOICE_PROFILES.find((v) => v.id === scene.voiceId) ||
        (isEnglish ? ENGLISH_VOICE_PROFILES[0] : baseProf);

      try {
        await fetchAndDecodeNeuralAudio(ctx, scene.voiceover, profile);
      } catch (err) {
        console.warn('Preload voice warning:', err);
      }
    }
  }

  public stopCinematicSoundtrack() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  public dispose() {
    this.stopSceneVoiceover();
    this.stopCinematicSoundtrack();
    if (this.ctx) {
      this.ctx.close().catch(() => { });
      this.ctx = null;
    }
  }

  public destroy() {
    this.dispose();
  }
}
