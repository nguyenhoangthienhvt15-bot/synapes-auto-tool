import { VoiceProfile } from '../types';

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'vi-hn-male-1',
    name: 'Anh Hoàng (Hà Nội)',
    gender: 'Nam',
    region: 'Bắc',
    description: 'Trầm ấm, đĩnh đạc, uy lực. Chuẩn giọng review công nghệ cao cấp & phóng sự chuyên sâu.',
    sampleSentence: 'Chào mừng các bạn đến với bản đánh giá chi tiết thiết bị công nghệ đột phá thế hệ mới.',
    pitch: 0.92,
    rate: 1.05,
    isRecommended: true,
  },
  {
    id: 'vi-hn-female-1',
    name: 'Chị Mai (Hà Nội)',
    gender: 'Nữ',
    region: 'Bắc',
    description: 'Truyền cảm, ngọt ngào, phát âm chuẩn điện ảnh. Thích hợp cho kịch bản kể chuyện & giới thiệu sản phẩm.',
    sampleSentence: 'Khám phá sự hoàn hảo trong từng đường nét thiết kế tinh xảo và hiệu năng vượt trội.',
    pitch: 1.0,
    rate: 1.02,
  },
  {
    id: 'vi-sg-male-1',
    name: 'Anh Tuấn (Sài Gòn)',
    gender: 'Nam',
    region: 'Nam',
    description: 'Năng động, cuốn hút, nhịp điệu nhanh. Tối ưu chuyển đổi TikTok Shop, Reels & Shorts.',
    sampleSentence: 'Chiếc máy này thật sự quá đỉnh các bạn ơi, xem ngay tính năng đặc biệt ở góc trái màn hình nhé!',
    pitch: 1.02,
    rate: 1.18,
    isRecommended: true,
  },
  {
    id: 'vi-sg-female-1',
    name: 'Chị Lan (Sài Gòn)',
    gender: 'Nữ',
    region: 'Nam',
    description: 'Tươi vui, trẻ trung, tự nhiên. Thích hợp cho lifestyle, bán hàng livestream & review sản phẩm.',
    sampleSentence: 'Hôm nay mình sẽ unbox siêu phẩm mới nhất và chia sẻ trải nghiệm thực tế sau một tuần sử dụng nhé!',
    pitch: 1.08,
    rate: 1.12,
  },
  {
    id: 'vi-dn-male-1',
    name: 'Anh Quang (Đà Nẵng)',
    gender: 'Nam',
    region: 'Trung',
    description: 'Dõng dạc, rõ ràng, dứt khoát. Chuẩn phong cách bản tin thời sự 24h & phân tích tài chính.',
    sampleSentence: 'Toàn cảnh thị trường và những phân tích kỹ thuật đáng chú ý nhất trong phiên giao dịch hôm nay.',
    pitch: 0.98,
    rate: 1.06,
  },
  {
    id: 'vi-neural-fast',
    name: 'SYNAPES Neural Turbo',
    gender: 'Nam',
    region: 'AI Neural',
    description: 'Động cơ AI đọc tốc độ cao (1.25x), ngắt nghỉ chuẩn Alex Hormozi, giữ chân người xem tối đa.',
    sampleSentence: 'Ba giây đầu tiên quyết định người xem ở lại hay lướt qua. Hãy nhìn vào tính năng số một ngay bây giờ!',
    pitch: 1.05,
    rate: 1.25,
    isRecommended: true,
  },
  {
    id: 'vi-deep-cinema',
    name: 'Cinema Trailer Deep Bass',
    gender: 'Nam',
    region: 'AI Neural',
    description: 'Giọng trầm vang điện ảnh Hollywood, dải bass sâu, thích hợp cho teaser & trailer bom tấn.',
    sampleSentence: 'Một bước nhảy vọt của tương lai. Trí tuệ nhân tạo tái định nghĩa giới hạn của con người.',
    pitch: 0.8,
    rate: 0.94,
  },
  {
    id: 'vi-eleven-clone',
    name: 'ElevenLabs Studio Clone',
    gender: 'Nữ',
    region: 'AI Neural',
    description: 'Mượt mà, giàu cảm xúc, lọc tạp âm tuyệt đối. Giọng đọc chuẩn podcast toàn cầu.',
    sampleSentence: 'Chúng ta đang đứng trước ngưỡng cửa của một cuộc cách mạng công nghệ chưa từng có trong lịch sử.',
    pitch: 1.0,
    rate: 1.08,
  },
];

/**
 * Phát thử giọng đọc TTS tiếng Việt với các thông số Pitch & Rate cụ thể
 */
export function auditionVoice(
  profile: VoiceProfile,
  customText?: string,
  customRate?: number,
  customPitch?: number,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (!('speechSynthesis' in window)) return false;

  try {
    window.speechSynthesis.cancel();

    const textToSpeak = customText?.trim() || profile.sampleSentence;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'vi-VN';

    const voices = window.speechSynthesis.getVoices();
    // Ưu tiên tìm giọng Việt tự nhiên
    const viVoices = voices.filter((v) => v.lang.toLowerCase().includes('vi'));
    let matchedVoice: SpeechSynthesisVoice | null = null;

    if (profile.gender === 'Nữ') {
      matchedVoice =
        viVoices.find((v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('hoai') || v.name.toLowerCase().includes('nu')) ||
        viVoices[0] ||
        null;
    } else {
      matchedVoice =
        viVoices.find((v) => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('nam') || v.name.toLowerCase().includes('an')) ||
        viVoices[0] ||
        null;
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.rate = customRate ?? profile.rate;
    utterance.pitch = customPitch ?? profile.pitch;
    utterance.volume = 1.0;

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Audition voice error:', err);
    onEnd?.();
    return false;
  }
}

/**
 * Bộ tạo âm thanh nền BGM điện ảnh & hiệu ứng SFX qua Web Audio API
 * Đưa tín hiệu vào AudioDestinationNode để trộn trực tiếp vào file Video xuất ra
 */
export class StudioAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private destNode: MediaStreamAudioDestinationNode | null = null;
  private bgmGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isBgmPlaying = false;
  private bgmIntervalId: any = null;

  constructor() {
    this.initContext();
  }

  private initContext() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !this.ctx) {
        this.ctx = new AudioCtx();
        this.destNode = this.ctx.createMediaStreamDestination();

        // 3 Track riêng biệt để cân bằng âm lượng
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.22; // BGM vừa phải, không át giọng đọc

        this.voiceGain = this.ctx.createGain();
        this.voiceGain.gain.value = 0.85; // Voiceover nổi bật

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.45; // SFX rõ ràng

        // Kết nối cả ra loa (destination) và ra luồng ghi hình (destNode)
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

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Tự động giảm âm lượng nhạc nền (Audio Ducking) khi có giọng đọc
   */
  public duckBgm(isSpeaking: boolean) {
    if (!this.bgmGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const target = isSpeaking ? 0.08 : 0.22;
    this.bgmGain.gain.cancelScheduledValues(now);
    this.bgmGain.gain.linearRampToValueAtTime(target, now + 0.15);
  }

  /**
   * Phát hiệu ứng âm thanh chuyển cảnh chuyên nghiệp
   */
  public playSfx(type: 'whoosh' | 'sub-drop' | 'camera-shutter' | 'chime' | 'glitch') {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (type === 'whoosh') {
      // Cinematic Whoosh noise
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(2800, now + 0.2);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.38);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.39);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.4);
    } else if (type === 'sub-drop') {
      // Sub-bass drop 90Hz -> 30Hz
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
      // Shutter click
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
      // Positive notification chime
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

  /**
   * Tạo âm thanh tổng hợp BGM Studio điện ảnh liên tục đồng bộ vào audio destination
   */
  public startCinematicSoundtrack(bpm: number = 118) {
    if (this.isBgmPlaying) return;
    this.resume();
    if (!this.ctx || !this.bgmGain) return;

    this.isBgmPlaying = true;
    const ctx = this.ctx;
    const stepDuration = 60 / bpm / 2; // 1/8 note

    // Các hợp âm synthwave hiện đại: Am -> F -> C -> G
    const chords = [
      [220, 261.63, 329.63], // Am
      [174.61, 220, 261.63], // F
      [261.63, 329.63, 392], // C
      [196, 246.94, 293.66], // G
    ];

    let step = 0;
    this.bgmIntervalId = setInterval(() => {
      if (!this.isBgmPlaying || !this.ctx) return;
      const now = ctx.currentTime;
      const chordIdx = Math.floor((step % 32) / 8);
      const chord = chords[chordIdx];

      // Bassline pulse
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

      // Hi-Hat click on 16th notes
      const hatOsc = ctx.createOscillator();
      const hatGain = ctx.createGain();
      hatOsc.type = 'highpass' as any;
      hatOsc.frequency.setValueAtTime(7000, now);

      hatGain.gain.setValueAtTime(step % 2 === 0 ? 0.06 : 0.03, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      hatOsc.connect(hatGain);
      hatGain.connect(this.bgmGain!);

      hatOsc.start(now);
      hatOsc.stop(now + 0.06);

      step++;
    }, stepDuration * 1000);
  }

  public stopCinematicSoundtrack() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  /**
   * Sinh luồng phát âm thanh Voiceover vào Web Audio Destination Node
   * để khi ghi hình MediaRecorder, file video chứa cả âm thanh thuyết minh
   */
  public playSynthesizedVoiceoverTrack(text: string, durationSec: number, pitchMultiplier: number = 1.0) {
    this.resume();
    if (!this.ctx || !this.voiceGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    const wordDuration = Math.min(0.45, Math.max(0.18, durationSec / words.length));
    this.duckBgm(true);

    // Kích hoạt chuỗi formant vocal harmonics mô phỏng nhịp đọc tiếng nói
    words.forEach((_, idx) => {
      const wordTime = now + idx * wordDuration;
      if (wordTime > now + durationSec) return;

      const osc = ctx.createOscillator();
      const formant1 = ctx.createBiquadFilter();
      const formant2 = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      // Giọng đọc có cao độ linh hoạt
      const baseFreq = (165 + (idx % 3) * 12 - (idx % 5) * 8) * pitchMultiplier;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, wordTime);
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.94, wordTime + wordDuration * 0.85);

      // Formants lọc tần số nguyên âm F1 & F2 (tần số vòm họng người)
      formant1.type = 'bandpass';
      formant1.frequency.setValueAtTime(700, wordTime);
      formant1.Q.setValueAtTime(5, wordTime);

      formant2.type = 'bandpass';
      formant2.frequency.setValueAtTime(1800, wordTime);
      formant2.Q.setValueAtTime(4, wordTime);

      gain.gain.setValueAtTime(0.001, wordTime);
      gain.gain.linearRampToValueAtTime(0.25, wordTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, wordTime + wordDuration * 0.92);

      osc.connect(formant1);
      formant1.connect(formant2);
      formant2.connect(gain);
      gain.connect(this.voiceGain!);

      osc.start(wordTime);
      osc.stop(wordTime + wordDuration);
    });

    // Sau khi đọc xong, nâng lại nhạc nền
    setTimeout(() => {
      this.duckBgm(false);
    }, durationSec * 1000);
  }

  public destroy() {
    this.stopCinematicSoundtrack();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
  }
}
