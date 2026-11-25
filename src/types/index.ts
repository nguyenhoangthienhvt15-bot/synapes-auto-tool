export type AspectRatio = '16:9' | '9:16';

export type SocialPlatformFormatId =
  | 'youtube-long-16-9'
  | 'youtube-shorts-9-16'
  | 'tiktok-viral-9-16'
  | 'instagram-reels-9-16'
  | 'instagram-feed-4-5'
  | 'facebook-reels-9-16'
  | 'facebook-watch-16-9'
  | 'threads-video-9-16';

export interface PlatformFormatPreset {
  id: SocialPlatformFormatId;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'threads';
  platformLabel: string;
  title: string;
  aspectRatio: AspectRatio;
  displayRatio: string;
  resolution: string;
  recommendedMinutes: number;
  description: string;
  promptStyleHint: string;
}

export type ProjectStatus =
  | 'pending_approval' // Chờ duyệt
  | 'scheduled'        // Đã lên lịch
  | 'publishing'       // Đang đăng tải
  | 'published'        // Đã xuất bản
  | 'rejected';        // Cần sửa lại

export type VoiceLanguage = 'vi' | 'en' | 'ja' | 'ko' | 'zh' | 'fr' | 'es';

export interface VoiceFormantEQ {
  lowShelfHz: number;
  lowGainDb: number;
  midPeakingHz: number;
  midGainDb: number;
  highShelfHz: number;
  highGainDb: number;
  highPassHz?: number;
  boxCutHz?: number;
  boxCutDb?: number;
  deEsserHz?: number;
  deEsserDb?: number;
  tubeWarmth?: number;
  presenceQ?: number;
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
  elevenlabsVoiceId?: string;
  nativePitchHz?: number;
  breathPauseMs?: number;
  personaStyle?: string;
  dspDetuneCents?: number;
  formantEq?: VoiceFormantEQ;
  acousticSignature?: string;
  referenceBiometrics?: {
    fundamentalHz: number;
    pitchStdHz: number;
    pitchRangeSemitones: number;
    f0Contour5Pt: number[];
    inferredGender: 'Nam' | 'Nữ' | 'Trung tính';
    formantsHz: [number, number, number, number];
    h1H2Db: number;
    cepstralEnvelopeDb: number[];
    spectralEnvelopeDb: number[];
    warmthDb: number;
    recommendedRate: number;
  };
}

export type ColorGradeLut = 'teal-orange' | 'cyberpunk' | 'studio-clean' | 'vintage-film' | 'monochrome' | 'apple-keynote' | 'none';
export type VfxOverlayType = 'film-grain' | 'light-leak' | 'vignette' | 'anamorphic' | 'apple-lens-flare' | 'none';
export type SubtitleStyle = 'hormozi' | 'capcut' | 'netflix' | 'cyberpunk' | 'apple-minimal' | 'off';
export type SubtitlePosition = 'bottom' | 'center' | 'top';
export type VideoGenre = 'news-broadcast' | 'documentary' | 'apple-keynote' | 'finance-analysis' | 'viral-social' | '3d-animation';
export type EditSkillPresetId = 'cinema-doc' | 'broadcast-24h' | 'viral-retention' | 'apple-keynote' | 'storytelling-3d';
export type CameraDialogueAngle = 'master-shot' | 'shot-reverse-shot' | 'over-the-shoulder' | 'close-up-speaker' | 'two-shot';

export interface CharacterActor {
  id: string;
  name: string;
  roleDescription: string;
  avatarUrl?: string;
  voiceId: string;
  voiceName: string;
  voiceSpeed: number;
  voicePitch: number;
  themeColor: string;
  defaultEmotion?: 'crying' | 'worried' | 'happy' | 'caring' | 'playful';
}

export interface DialogueLine {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  voiceId?: string;
  voiceSpeed?: number;
  voicePitch?: number;
  emotion?: string;
  startSec: number;
  endSec: number;
  audioUrl?: string;
}

export interface SceneMetricItem {
  label: string;
  value: string;
  delta?: string;
}

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
  secondaryImageUrl?: string;
  sourceCitation?: string;
  sceneMetrics?: SceneMetricItem[];
  subShotMode?: 'broll-split' | 'pip-evidence' | 'data-focus' | 'auto';
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
  transition?: string;
  editSkillPreset?: EditSkillPresetId;
  voiceId?: string;
  voiceLanguage?: VoiceLanguage;
  voiceSpeed?: number;
  voicePitch?: number;
  subtitleStyle?: SubtitleStyle;
  subtitlePosition?: SubtitlePosition;
  explodedView?: boolean;
  apertureBlades?: boolean;
  appleMotion3d?: 'exploded-chip' | 'aperture-zoom' | 'titanium-orbit' | 'none';
  speakerId?: string;
  speakerName?: string;
  speakerAvatarUrl?: string;
  cameraAngle?: CameraDialogueAngle;
  dialogueLines?: DialogueLine[];
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
  platformFormat?: SocialPlatformFormatId;
  platformFormatLabel?: string;
  videoGenre?: VideoGenre;
  newsTickerText?: string;
  duration: number; // in seconds
  targetChannels: ('youtube' | 'tiktok' | 'facebook' | 'instagram' | 'threads')[];
  videoUrl: string;
  thumbnailUrl: string;
  musicTrack: {
    name: string;
    license: string;
    volume: number;
    customBgmUrl?: string;
    customBgmFileName?: string;
    customBgmDurationSec?: number;
    loop?: boolean;
    fadeInSec?: number;
    fadeOutSec?: number;
    duckingEnabled?: boolean;
  };
  editSkillPreset?: EditSkillPresetId;
  voiceoverTrack?: {
    name: string;
    voiceName: string;
    audioUrl?: string;
    isCustomMasterAudio?: boolean;
  };
  customAudioUrl?: string;
  attachedImages?: Array<{
    name: string;
    size: number;
    dataUrl: string;
  }>;
  characterActors?: CharacterActor[];
  dialogueMode?: boolean;
  model3dStyle?: Model3DStyleId;
  multiViewReferences?: MultiViewReferenceImage[];
  character3dAssets?: Asset3DManifest[];
  lockWikimediaSearch?: boolean;
  storyboard: StoryboardScene[];
  metadata: ProjectMetadata;
  aiSource: {
    type: AIProviderId | string;
    name: string;
    model?: string;
    pluginUrl?: string;
  };
  tokenTelemetry?: TokenTelemetry;
  createdAt: string;
  scheduledTime?: string;
  driveBackupUrl?: string;
  publishedUrls?: {
    youtube?: string;
    tiktok?: string;
    facebook?: string;
    instagram?: string;
    threads?: string;
  };
}

export interface UserAccount {
  code: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
  isDefaultPassword: boolean;
  planTier?: ContractCategory;
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

export interface TokenTelemetry {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd?: number;
  keyStatus?: string;
  failoverTriggered?: boolean;
  failoverReason?: string;
  attemptedProviders?: string[];
}

export interface CoreVideoRepo {
  id: string;
  repo: string;
  repoUrl: string;
  title: string;
  stars: string;
  roleInEngine: string;
  capabilities: string[];
  enabled: boolean;
  integrationType?: 'runtime' | 'blueprint';
  sampleVideoUrl?: string;
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
  sampleVideoUrl?: string;
  sampleVideoTitle?: string;
  githubRepoUrl?: string;
}

export interface ConnectedChannelAccount {
  id: 'yt' | 'tt' | 'fb' | 'gd';
  platform: 'youtube' | 'tiktok' | 'facebook' | 'drive';
  name: string;
  handle: string;
  email?: string;
  channelId?: string;
  avatarUrl?: string;
  status: 'connected' | 'disconnected' | 'reauth_needed';
  apiScope: string;
  tokenExpiry: string;
  connectedAt: string;
  verificationMode?: string;
  hasRefreshToken?: boolean;
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

export type AIProviderId = 'gemini' | 'openai' | 'claude' | 'deepseek' | 'grok' | 'plugin' | 'groq' | 'elevenlabs';

export interface AIProviderConfig {
  mode: AIProviderId;
  activeProvider?: AIProviderId;
  byokProfile?: 'zero-cost' | 'fast-frugal' | 'flagship' | 'custom';
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
  groq?: {
    apiKey: string;
    model: string;
    endpointUrl?: string;
  };
  elevenlabs?: {
    apiKey: string;
    voiceId?: string;
    model?: string;
  };
  plugin: {
    id: string;
    name: string;
    endpointUrl: string;
    apiToken: string;
    model?: string;
    availableModels?: Array<{
      id: string;
      name: string;
      tag: string;
      description?: string;
      inputTokenLimit?: number;
      outputTokenLimit?: number;
      isLiveFromKey: boolean;
      isRecommended?: boolean;
      category?: 'flagship' | 'fast' | 'reasoning' | 'standard';
      brand?: string;
    }>;
    modelsScannedAt?: string;
    inputMapping: string;
    outputMapping: string;
    timeoutSeconds: number;
  };
  threeDEngine?: Byok3DEngineConfig;
}

export interface DeconstructedScene {
  sceneNumber: number;
  timeStart: string;
  timeEnd: string;
  durationSec: number;
  shotType: 'close-up' | 'medium-shot' | 'wide-angle' | 'macro' | 'screen-recording' | 'motion-graphic' | string;
  visualCategory: 'talking-head' | 'b-roll-stock' | 'ai-art' | 'diagram' | 'typography' | string;
  visualDescription: string;
  transcript: string;
  suggestedAiPrompt: string;
  onScreenText?: string;
  sfxCue?: string;
}

export interface VideoDnaBlueprint {
  sourceUrl?: string;
  sourceTitle?: string;
  authorName?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  durationSec: number;
  totalScenes: number;
  averageShotDuration: number;
  wordsPerMinute: number;
  hookScore: number;
  hookAnalysis: {
    verbalHook: string;
    visualHook: string;
    audioHook: string;
    curiosityGapStrategy: string;
  };
  retentionStrategy: string;
  pacingStyle: 'ultra-fast' | 'dynamic-tiktok' | 'documentary' | 'deep-dive' | string;
  visualStyle: {
    colorPalette: string[];
    lightingMood: string;
    aestheticTag: string;
    recommendedAspectRatio: '16:9' | '9:16';
  };
  audioAnalysis: {
    bgmGenre: string;
    bpmTempo: number;
    voiceTone: string;
    sfxFrequency: 'high' | 'medium' | 'minimal' | string;
  };
  promptGuide?: {
    visualFormula: string;
    scriptFormula: string;
    audioFormula: string;
    negativePrompts: string[];
    cinematicKeywords: string[];
  };
  chapters?: Array<{
    timestamp: string;
    startSec: number;
    title: string;
  }>;
  rhetoricalStructure?: {
    frameworkName: string;
    stages: Array<{
      stageName: string;
      timeRange: string;
      purpose: string;
      transitionPhrase: string;
    }>;
  };
  deliveryStyle?: {
    voicePersona: string;
    cadencePattern: string;
    signaturePhrases: string[];
    terminologyDensity: string;
    sentenceLengthAvg: string;
  };
  presentationStyle?: {
    formatType: string;
    slideLayoutPattern: string;
    typographyRules: string;
    bRollAndChartRatio: string;
    thumbnailFormula: string;
  };
  hypitSvmlBlueprint?: {
    version: string;
    templateId: string;
    svmlMarkup?: string;
    variables: Array<{
      key: string;
      label: string;
      originalValue: string;
      description: string;
    }>;
    wordAnchoredTracks: Array<{
      anchorPhrase: string;
      timeRange: string;
      layerType: 'A-ROLL' | 'B-ROLL' | 'CHART-SLIDE' | 'KINETIC-TEXT' | 'SFX';
      action: string;
    }>;
  };
  modelUsed?: string;
  engineMeta?: {
    mode: 'byok-llm' | 'semantic-fallback';
    provider?: string;
    modelUsed?: string;
    warning?: string;
  };
  scenes: DeconstructedScene[];
  rawTranscript: string;
}

export interface ClonedVideoProject {
  id: string;
  originalDna: VideoDnaBlueprint;
  newTopic: string;
  targetAudience: string;
  selectedProvider: AIProviderId | string;
  selectedModel: string;
  newScript: {
    title: string;
    headline: string;
    hookSentence: string;
    bodyStory: string;
    callToAction: string;
    tags: string[];
  };
  newStoryboard: Array<{
    sceneNumber: number;
    timeRange: string;
    spokenText: string;
    visualPrompt: string;
    cameraInstruction: string;
    sfx: string;
    generatedMediaUrl?: string;
  }>;
  createdAt: string;
  status: 'analyzed' | 'scripted' | 'generating-assets' | 'ready-for-review' | 'approved';
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

export type ContractCategory = 'personal' | 'enterprise';
export type ContractPackage =
  | 'personal_deposit'
  | 'personal_full'
  | 'enterprise_deposit'
  | 'enterprise_full';

export interface UserRegistrationData {
  id?: string;
  fullName: string;
  idCardNumber?: string; // Số CCCD / CMND
  dob: string; // DD/MM/YYYY
  gender?: string; // Nam / Nữ / Khác
  email: string; // Gmail
  phone: string;
  addressType: 'gps' | 'manual';
  address: string;
  coords?: { lat: number; lng: number };
  contractCategory?: ContractCategory; // 'personal' (Cá nhân hóa) | 'enterprise' (Toàn hệ)
  contractPackage?: ContractPackage;
  contractPackageName?: string;
  depositAmount?: number;
  totalAmount?: number;
  originalAmount?: number;
  deliveryDays?: number; // Số ngày đến hạn bàn giao (dành cho đặt cọc)
  signatureImage?: string; // Ảnh chữ ký tay điện tử Base64 PNG
  termsAccepted: boolean;
  registeredAt: string;
  isApproved?: boolean;
  isFinalDelivered?: boolean;
  assignedCode?: string;
  assignedPassword?: string;
  status?: 'pending' | 'approved';
  notes?: string;
}

export interface UserRegistrationSheetRow {
  stt: number;
  registeredAt: string;
  fullName: string;
  idCardNumber: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  contractCategory: string;
  contractPackageName: string;
  depositAmount: string;
  totalAmount: string;
  deliveryDays: string;
  isApproved: boolean;
  code: string;
  password: string;
  isFinalDelivered: boolean;
  emailStatus: string;
  notes: string;
}

// ============================================================================
// NGÀY 1: HẠ TẦNG MULTI-VIEW 3D (1–5 ẢNH), 6 CHUẨN 3D THEO GÓI & BYOK 3D ENGINE
// ============================================================================

export type Model3DStyleId =
  | '3d-cartoon'
  | '3d-isometric'
  | '3d-claymation'
  | 'low-poly-3d'
  | 'cel-shading-npr'
  | 'stylized-3d';

export type CharacterViewSlot = 'front' | 'back' | 'left' | 'right' | 'detail';

export type Byok3DEngineProvider =
  | 'huggingface-zerogpu'
  | 'comfyui-kaggle-worker'
  | 'tripo3d-api'
  | 'meshy-api'
  | 'fal-ai';

export interface MultiViewReferenceImage {
  id: string;
  slot: CharacterViewSlot;
  name: string;
  mimeType: 'image/png';
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  laplacianSharpness: number;
  sha256: string;
  dinov2SimilarityToFront?: number;
}

export interface Byok3DEngineConfig {
  provider: Byok3DEngineProvider;
  apiKey: string;
  workerUrl?: string;
  modelId?: string;
  verifiedAt?: string;
}

export interface Character3DBuildRequest {
  characterId: string;
  characterName: string;
  role: 'protagonist' | 'supporting' | 'prop';
  styleId: Model3DStyleId;
  planTier: ContractCategory;
  referenceImages: MultiViewReferenceImage[];
  targetPolyCount: number;
  autoRig: boolean;
  sourcePrompt?: string;
}

export interface Asset3DManifest {
  assetId: string;
  jobId: string;
  characterId: string;
  characterName: string;
  styleId: Model3DStyleId;
  engine: string;
  provider: Byok3DEngineProvider;
  sourceViewCount: number;
  sourceImageHashes: string[];
  geometryConfidencePct: number;
  glbUrl?: string;
  remoteTaskId?: string;
  rigBoneCount?: number;
  polyCount?: number;
  pipelineStage?: string;
  progressPct?: number;
  dinov2Scores?: Record<string, number>;
  workerBaseUrl?: string;
  approvalStatus: 'pending' | 'reconstructing' | 'ready_for_review' | 'approved' | 'rejected' | 'failed';
  errorMessage?: string;
  qcReport?: {
    passed: boolean;
    warnings: string[];
    visionConsistencyNote?: string;
    averageSharpness: number;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}


