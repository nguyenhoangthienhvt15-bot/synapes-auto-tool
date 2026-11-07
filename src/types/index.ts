export type AspectRatio = '16:9' | '9:16';

export type ProjectStatus =
  | 'pending_approval' // Chờ duyệt
  | 'scheduled'        // Đã lên lịch
  | 'publishing'       // Đang đăng tải
  | 'published'        // Đã xuất bản
  | 'rejected';        // Cần sửa lại

export type VoiceLanguage = 'vi' | 'en';

export interface VoiceFormantEQ {
  lowShelfHz: number;
  lowGainDb: number;
  midPeakingHz: number;
  midGainDb: number;
  highShelfHz: number;
  highGainDb: number;
}

export interface VoiceProfile {
  id: string;
  name: string;
  language: VoiceLanguage;
  gender: 'Nam' | 'Nữ' | 'Male' | 'Female';
  region: string;
  toneTag: string;
  description: string;
  sampleSentence: string;
  pitch: number;
  rate: number;
  isRecommended?: boolean;
  neuralVoiceId?: string;
  geminiVoiceName?: string;
  openaiVoiceName?: string;
  dspDetuneCents?: number;
  formantEq?: VoiceFormantEQ;
  acousticSignature?: string;
}

export type ColorGradeLut = 'teal-orange' | 'cyberpunk' | 'studio-clean' | 'vintage-film' | 'monochrome' | 'apple-keynote' | 'none';
export type VfxOverlayType = 'film-grain' | 'light-leak' | 'vignette' | 'anamorphic' | 'apple-lens-flare' | 'none';
export type SubtitleStyle = 'hormozi' | 'capcut' | 'netflix' | 'cyberpunk' | 'apple-minimal' | 'off';
export type SubtitlePosition = 'bottom' | 'center' | 'top';
export type VideoGenre = 'news-broadcast' | 'documentary' | 'apple-keynote' | 'finance-analysis' | 'viral-social';

export interface StoryboardScene {
  id: number;
  sceneNumber: number;
  timeRange: string;
  startSec: number;
  endSec: number;
  voiceover: string;
  visualPrompt: string;
  clipUrl?: string;
  imageUrl?: string;
  customMediaUrl?: string;
  customMediaType?: 'image' | 'video';
  customAudioUrl?: string;
  customAudioDurationSec?: number;
  isCustomRecorded?: boolean;
  cameraMotion?: 'dolly-in' | 'dolly-out' | 'orbit' | 'pan-right' | 'pan-left' | 'crane-up' | 'fpv-zoom';
  lightingStyle?: 'volumetric' | 'cyberpunk' | 'rembrandt' | 'studio-clean' | 'golden-hour';
  colorGrade?: ColorGradeLut;
  vfxOverlay?: VfxOverlayType;
  sfx?: string;
  headline?: string;
  transition?: 'cut' | 'fade' | 'dissolve';
  voiceId?: string;
  voiceLanguage?: VoiceLanguage;
  voiceSpeed?: number;
  voicePitch?: number;
  subtitleStyle?: SubtitleStyle;
  subtitlePosition?: SubtitlePosition;
  explodedView?: boolean;
  apertureBlades?: boolean;
  appleMotion3d?: 'exploded-chip' | 'aperture-zoom' | 'titanium-orbit' | 'none';
}

export interface ProjectMetadata {
  title: string;
  description: string;
  tags: string[];
  productLink?: string;
}

export interface Project {
  id: string;
  code: string;
  title: string;
  status: ProjectStatus;
  aspectRatio: AspectRatio;
  videoGenre?: VideoGenre;
  newsTickerText?: string;
  duration: number; // in seconds
  targetChannels: ('youtube' | 'tiktok' | 'facebook')[];
  videoUrl: string;
  thumbnailUrl: string;
  musicTrack: {
    name: string;
    license: string;
    volume: number;
  };
  voiceoverTrack?: {
    name: string;
    voiceName: string;
    audioUrl?: string;
  };
  storyboard: StoryboardScene[];
  metadata: ProjectMetadata;
  aiSource: {
    type: AIProviderId | string;
    name: string;
    model?: string;
    pluginUrl?: string;
  };
  createdAt: string;
  scheduledTime?: string;
  driveBackupUrl?: string;
  publishedUrls?: {
    youtube?: string;
    tiktok?: string;
    facebook?: string;
  };
}

export interface UserAccount {
  code: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
  isDefaultPassword: boolean;
  avatarUrl?: string;
}

export interface EngineerSheetRow {
  code: string;
  clientName: string;
  registeredGmail: string;
  currentTempPassword: string;
  lastIssuedTime: string;
  accountStatus: 'custom_password_active' | 'temp_password_active' | 'never_changed';
  engineerNotes: string;
}

export interface Skill {
  id: string;
  name: string;
  command: string;
  description: string;
  category: string;
  defaultTags: string[];
  tone: string;
  systemPrompt: string;
}

export interface ConnectedChannelAccount {
  id: 'yt' | 'tt' | 'fb' | 'gd';
  platform: 'youtube' | 'tiktok' | 'facebook' | 'drive';
  name: string;
  handle: string;
  avatarUrl?: string;
  status: 'connected' | 'disconnected' | 'reauth_needed';
  apiScope: string;
  tokenExpiry: string;
  connectedAt: string;
  stats: {
    metricLabel: string;
    metricValue: string;
    totalPublishedVideos: number;
    lastPublishedTime?: string;
  };
}

export interface McpVideoServer {
  id: string;
  name: string;
  repo: string;
  repoUrl: string;
  author: string;
  category: 'mcp-ffmpeg' | 'mcp-vfx' | 'pipeline-remotion' | 'pipeline-subtitle' | 'pipeline-short' | 'cinematography';
  badge: string;
  description: string;
  techStack: string[];
  keyTools: string[];
  sampleConfig: {
    serverKey: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
  };
  useCases: string[];
  status: 'ready' | 'recommended' | 'community';
}

export type AIProviderId = 'gemini' | 'openai' | 'claude' | 'deepseek' | 'grok' | 'plugin';

export interface AIProviderConfig {
  mode: AIProviderId;
  activeProvider?: AIProviderId;
  gemini: {
    apiKey: string;
    model: string;
    ttsVoice: string;
  };
  openai?: {
    apiKey: string;
    model: string;
    endpointUrl?: string;
  };
  claude?: {
    apiKey: string;
    model: string;
    endpointUrl?: string;
  };
  deepseek?: {
    apiKey: string;
    model: string;
    endpointUrl?: string;
  };
  grok?: {
    apiKey: string;
    model: string;
    endpointUrl?: string;
  };
  plugin: {
    id: string;
    name: string;
    endpointUrl: string;
    apiToken: string;
    inputMapping: string;
    outputMapping: string;
    timeoutSeconds: number;
  };
}

export interface StitcherClip {
  id: string;
  sceneId?: number;
  name: string;
  thumbnailUrl: string;
  videoUrl: string;
  durationSec: number;
  transition: 'cut' | 'fade' | 'dissolve';
}

export interface UserRegistrationData {
  id?: string;
  fullName: string;
  dob: string; // DD/MM/YYYY
  gender?: string; // Nam / Nữ / Khác
  email: string; // Gmail
  phone: string;
  addressType: 'gps' | 'manual';
  address: string;
  coords?: { lat: number; lng: number };
  termsAccepted: boolean;
  registeredAt: string;
  isApproved?: boolean;
  assignedCode?: string;
  assignedPassword?: string;
  status?: 'pending' | 'approved';
  notes?: string;
}

export interface UserRegistrationSheetRow {
  stt: number;
  registeredAt: string;
  fullName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  isApproved: boolean;
  code: string;
  password: string;
  emailStatus: string;
  notes: string;
}


