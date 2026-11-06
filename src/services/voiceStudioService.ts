import { VoiceProfile, VoiceLanguage } from '../types';

export const VIETNAMESE_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'vi-hn-male-1',
    name: 'Anh Hoàng (Hà Nội)',
    language: 'vi',
    gender: 'Nam',
    region: 'Miền Bắc',
    toneTag: 'Trầm ấm • Uy lực',
    description: 'Chất giọng chuẩn phát thanh viên Hà Nội, dải âm trầm uy quyền, phong thái điềm tĩnh, tối ưu cho video review công nghệ cao cấp & phóng sự chuyên sâu.',
    sampleSentence: 'Chào mừng các bạn đến với bản đánh giá chi tiết thiết bị công nghệ đột phá thế hệ mới.',
    pitch: 0.9,
    rate: 1.02,
    isRecommended: true,
  },
  {
    id: 'vi-hn-female-1',
    name: 'Chị Hoài My (Hà Nội)',
    language: 'vi',
    gender: 'Nữ',
    region: 'Miền Bắc',
    toneTag: 'Truyền cảm • Tự nhiên',
    description: 'Giọng đọc nhẹ nhàng, nhấn nhá nhịp điệu giàu cảm xúc, phát âm tròn vành rõ chữ, chuẩn phong cách podcast & kể chuyện thương hiệu.',
    sampleSentence: 'Khám phá sự hoàn hảo trong từng đường nét thiết kế tinh xảo và trải nghiệm người dùng vượt trội.',
    pitch: 1.0,
    rate: 1.0,
    isRecommended: true,
  },
  {
    id: 'vi-sg-male-1',
    name: 'Anh Nam Minh (Sài Gòn)',
    language: 'vi',
    gender: 'Nam',
    region: 'Miền Nam',
    toneTag: 'Năng động • Hào sảng',
    description: 'Phong cách phóng khoáng, trẻ trung, nhịp điệu nhanh và bắt tai, giữ nhịp tương tác cao cho TikTok Shop, YouTube Shorts & Reels.',
    sampleSentence: 'Chiếc máy này thật sự quá đỉnh các bạn ơi! Xem ngay tính năng đột phá ở góc trái màn hình nhé!',
    pitch: 1.05,
    rate: 1.18,
    isRecommended: true,
  },
  {
    id: 'vi-sg-female-1',
    name: 'Chị Diệu Thảo (Sài Gòn)',
    language: 'vi',
    gender: 'Nữ',
    region: 'Miền Nam',
    toneTag: 'Tươi vui • Ngọt ngào',
    description: 'Giọng nữ Sài Gòn ngọt ngào, tạo cảm giác thân thiện gần gũi, chuyển đổi tốt cho video ẩm thực, du lịch, đời sống và bán hàng.',
    sampleSentence: 'Hôm nay mình sẽ unbox siêu phẩm mới nhất và chia sẻ cảm nhận thực tế sau một tuần sử dụng nha!',
    pitch: 1.12,
    rate: 1.12,
  },
  {
    id: 'vi-dn-male-1',
    name: 'Anh Văn Quang (Đà Nẵng)',
    language: 'vi',
    gender: 'Nam',
    region: 'Miền Trung',
    toneTag: 'Dõng dạc • Rõ ràng',
    description: 'Phát âm rành mạch, tốc độ ổn định, âm lượng dày, tạo độ tin cậy tuyệt đối cho bản tin tài chính, thời sự 24h & dữ liệu kinh tế.',
    sampleSentence: 'Toàn cảnh chu kỳ thị trường và những phân tích kỹ thuật đáng chú ý nhất trong phiên giao dịch hôm nay.',
    pitch: 0.98,
    rate: 1.05,
  },
  {
    id: 'vi-neural-fast',
    name: 'SYNAPES Neural v3 Turbo',
    language: 'vi',
    gender: 'Nam',
    region: 'AI Neural',
    toneTag: 'Tốc độ cao 1.25x • Giữ chân',
    description: 'Mô hình AI tổng hợp âm đọc siêu tốc 1.25x theo công thức Alex Hormozi, triệt tiêu khoảng lặng thừa, tối ưu tỷ lệ xem hết video.',
    sampleSentence: 'Ba giây đầu tiên quyết định người xem ở lại hay lướt qua. Hãy nhìn vào tính năng số một ngay bây giờ!',
    pitch: 1.04,
    rate: 1.25,
    isRecommended: true,
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
    description: 'Crisp, articulate American tech reviewer tone. Perfect for Silicon Valley product launches and hardware unboxings.',
    sampleSentence: 'Welcome back to the studio. Today we are looking at the next generation of dual-screen flagship devices.',
    pitch: 0.95,
    rate: 1.05,
    isRecommended: true,
  },
  {
    id: 'en-us-jenny',
    name: 'Jenny (US California)',
    language: 'en',
    gender: 'Female',
    region: 'North America',
    toneTag: 'Warm • Engaging • Lifestyle',
    description: 'Friendly, naturally paced conversational voice. Great for tutorials, explainer videos, and social media reels.',
    sampleSentence: 'Discover seamless multitasking with an ultra-thin foldable display engineered for creators on the go.',
    pitch: 1.05,
    rate: 1.08,
    isRecommended: true,
  },
  {
    id: 'en-gb-ryan',
    name: 'Ryan (UK London)',
    language: 'en',
    gender: 'Male',
    region: 'United Kingdom',
    toneTag: 'British BBC • Sophisticated',
    description: 'Deep, resonant British English accent with cinematic gravitas. Ideal for luxury commercials and documentary trailers.',
    sampleSentence: 'A monumental leap forward in computational intelligence and refined industrial craftsmanship.',
    pitch: 0.88,
    rate: 0.98,
  },
  {
    id: 'en-gb-sonia',
    name: 'Sonia (UK Oxford)',
    language: 'en',
    gender: 'Female',
    region: 'United Kingdom',
    toneTag: 'Elegant • Professional Narration',
    description: 'Polished British RP pronunciation with pristine clarity. Perfect for educational, corporate and historical narratives.',
    sampleSentence: 'In the span of a single generation, artificial intelligence has fundamentally redefined human creativity.',
    pitch: 1.0,
    rate: 1.02,
  },
  {
    id: 'en-us-tony',
    name: 'Tony (US High-Paced)',
    language: 'en',
    gender: 'Male',
    region: 'AI Neural',
    toneTag: 'Fast Pacing • Retention Master',
    description: 'Punchy, dynamic US male creator voice built for high retention YouTube Shorts, TikTok and fast video sales letters.',
    sampleSentence: 'If you want to save five hours every single day, this new AI tool is about to change everything for you.',
    pitch: 1.05,
    rate: 1.25,
    isRecommended: true,
  },
];

export const ALL_VOICE_PROFILES: VoiceProfile[] = [
  ...VIETNAMESE_VOICE_PROFILES,
  ...ENGLISH_VOICE_PROFILES,
];

/**
 * Phát thử giọng đọc TTS với bộ lọc ngôn ngữ nghiêm ngặt (không lẫn tiếng Anh vào tiếng Việt)
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

    const targetLang = profile.language === 'en' ? 'en-US' : 'vi-VN';
    const textToSpeak = customText?.trim() || profile.sampleSentence;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = targetLang;

    const voices = window.speechSynthesis.getVoices();
    const isEnglish = profile.language === 'en';

    if (isEnglish) {
      // Tìm giọng tiếng Anh chuẩn US hoặc UK
      const enVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
      let matchedEn: SpeechSynthesisVoice | null = null;

      if (profile.region.includes('Kingdom')) {
        matchedEn = enVoices.find((v) => v.lang.toLowerCase().includes('gb') || v.name.toLowerCase().includes('uk') || v.name.toLowerCase().includes('george')) || null;
      }

      if (!matchedEn) {
        if (profile.gender === 'Female' || profile.gender === 'Nữ') {
          matchedEn = enVoices.find((v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('jenny')) || enVoices[0] || null;
        } else {
          matchedEn = enVoices.find((v) => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('guy') || v.name.toLowerCase().includes('alex')) || enVoices[0] || null;
        }
      }

      if (matchedEn) utterance.voice = matchedEn;
    } else {
      // Tìm giọng tiếng Việt chuẩn
      const viVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('vi'));
      let matchedVi: SpeechSynthesisVoice | null = null;

      if (profile.gender === 'Nữ' || profile.gender === 'Female') {
        matchedVi =
          viVoices.find((v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('nu') || v.name.toLowerCase().includes('hoai')) ||
          viVoices[0] ||
          null;
      } else {
        matchedVi =
          viVoices.find((v) => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('nam') || v.name.toLowerCase().includes('an')) ||
          viVoices[0] ||
          null;
      }

      if (matchedVi) utterance.voice = matchedVi;
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

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.22;

        this.voiceGain = this.ctx.createGain();
        this.voiceGain.gain.value = 0.9;

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.45;

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

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public duckBgm(isSpeaking: boolean) {
    if (!this.bgmGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const target = isSpeaking ? 0.07 : 0.22;
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
   * Phát file âm thanh thu âm trực tiếp của người dùng vào kênh lồng tiếng
   */
  public playCustomAudioBlob(blobUrl: string, onEnd?: () => void): HTMLAudioElement | null {
    try {
      this.resume();
      this.duckBgm(true);
      const audio = new Audio(blobUrl);
      audio.volume = 1.0;
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
      this.duckBgm(false);
      onEnd?.();
      return null;
    }
  }

  public destroy() {
    this.stopCinematicSoundtrack();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
  }
}
