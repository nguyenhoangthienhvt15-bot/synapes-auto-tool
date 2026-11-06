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


