export type AspectRatio = '16:9' | '9:16';

export type ProjectStatus =
  | 'pending_approval' // Chờ duyệt
  | 'scheduled'        // Đã lên lịch
  | 'publishing'       // Đang đăng tải
  | 'published'        // Đã xuất bản
  | 'rejected';        // Cần sửa lại

export interface StoryboardScene {
  id: number;
  sceneNumber: number;
  timeRange: string;
  startSec: number;
  endSec: number;
  voiceover: string;
  visualPrompt: string;
  clipUrl?: string;
  transition?: 'cut' | 'fade' | 'dissolve';
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
    type: 'gemini' | 'plugin';
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

export interface AIProviderConfig {
  mode: 'gemini' | 'plugin';
  gemini: {
    apiKey: string;
    model: 'gemini-2.0-flash' | 'gemini-1.5-pro';
    ttsVoice: string;
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

