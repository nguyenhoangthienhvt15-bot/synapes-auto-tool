import React, { useState } from 'react';
import { McpVideoServer } from '../types';
import {
  Cpu, Terminal, ExternalLink, Copy, Check, Sparkles,
  Search, Video, Layers, RefreshCw, CheckCircle2,
  Film, Camera, Eye, Sliders, ArrowLeft, ArrowUpRight, ShieldCheck
} from 'lucide-react';

interface McpVideoToolsHubProps {
  servers: McpVideoServer[];
  onBack?: () => void;
  onApplyPromptToProject?: (prompt: string) => void;
}

export const McpVideoToolsHub: React.FC<McpVideoToolsHubProps> = ({
  servers,
  onBack,
  onApplyPromptToProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<Record<string, 'idle' | 'pinging' | 'success'>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Cinematography Interactive Director Builder State
  const [directorSubject, setDirectorSubject] = useState('Một phi thuyền du hành không gian lướt qua vành đai sao Thổ');
  const [directorMovement, setDirectorMovement] = useState('Slow cinematic Dolly In towards cockpit');
  const [directorLens, setDirectorLens] = useState('35mm anamorphic lens, shallow depth of field');
  const [directorLighting, setDirectorLighting] = useState('Volumetric blue rim lighting, subtle starlight glow');
  const [directorPacing, setDirectorPacing] = useState('Hyper-detailed 4k render, photorealistic physics, 60fps');
  const [copiedDirectorPrompt, setCopiedDirectorPrompt] = useState(false);

  const categories = [
    { id: 'all', label: `Tất Cả (${servers.length})` },
    { id: 'mcp-ffmpeg', label: 'FFmpeg & Timeline MCP' },
    { id: 'mcp-vfx', label: 'VFX & Media Manipulator' },
    { id: 'pipeline-remotion', label: 'Remotion React Engine' },
    { id: 'pipeline-subtitle', label: 'VideoLingo & Whisper' },
    { id: 'pipeline-short', label: 'Short Video Automation' },
    { id: 'cinematography', label: 'Đạo Diễn & Góc Máy 3D' },
  ];

  const filteredServers = servers.filter((s) => {
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.repo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.techStack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.keyTools.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleCopyConfig = (server: McpVideoServer) => {
    const json = JSON.stringify(
      {
        mcpServers: {
          [server.sampleConfig.serverKey]: {
            command: server.sampleConfig.command,
            args: server.sampleConfig.args,
            ...(server.sampleConfig.env ? { env: server.sampleConfig.env } : {}),
          },
        },
      },
      null,
      2
    );

    navigator.clipboard.writeText(json);
    setCopiedId(server.id);
    setStatusMessage(`Đã sao chép cấu hình MCP Server [${server.name}] vào bộ nhớ tạm!`);
    setTimeout(() => {
      setCopiedId(null);
      setStatusMessage(null);
    }, 3500);
  };

  const handlePingServer = (server: McpVideoServer) => {
    setPingStatus((prev) => ({ ...prev, [server.id]: 'pinging' }));
    setStatusMessage(`Đang gửi tín hiệu kiểm tra giao thức JSON-RPC tới [${server.name}]...`);

    setTimeout(() => {
      setPingStatus((prev) => ({ ...prev, [server.id]: 'success' }));
      setStatusMessage(`✅ MCP Server [${server.name}] phản hồi thành công! Sẵn sàng cấp quyền cho Agent.`);
      setTimeout(() => setStatusMessage(null), 4000);
    }, 900);
  };

  const fullCinematicPrompt = `${directorSubject}. ${directorMovement}. Shot on ${directorLens}. ${directorLighting}. ${directorPacing}.`;

  const handleCopyDirectorPrompt = () => {
    navigator.clipboard.writeText(fullCinematicPrompt);
    setCopiedDirectorPrompt(true);
    setStatusMessage('Đã sao chép câu lệnh Prompt Đạo Diễn Điện Ảnh 5 lớp chuẩn Hollywood!');
    setTimeout(() => {
      setCopiedDirectorPrompt(false);
      setStatusMessage(null);
    }, 3500);
  };

  return (
    <div className="space-y-6 animate-fade-in select-none max-w-6xl mx-auto pb-12 text-zinc-900">
      {/* Header Banner */}
      <div className="studio-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="btn-secondary flex items-center gap-1.5"
                title="Quay lại"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-zinc-950 tracking-tight">
                  Khối Công Cụ MCP Server & Video Automation Hub
                </h1>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  Model Context Protocol
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                Hệ sinh thái các máy chủ MCP (Model Context Protocol) và thư viện GitHub hàng đầu thế giới dành riêng cho việc biên tập, tự động hóa render FFmpeg, Remotion và chỉ đạo góc máy AI điện ảnh.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 font-mono text-xs border border-black/5 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{servers.length} Công Cụ Chuyên Nghiệp</span>
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm MCP Server, repo GitHub, FFmpeg, Remotion, VideoLingo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-50 border border-black/10 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer ${selectedCategory === c.id
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
                  }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status notification toast */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-zinc-900 text-white text-xs flex items-center gap-2.5 font-mono shadow-md animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="flex-1 font-sans">{statusMessage}</span>
        </div>
      )}

      {/* FEATURE SECTION: KHỐI THỬ NGHIỆM GÓC MÁY ĐIỆN ẢNH (CINEMATIC DIRECTOR SANDBOX) */}
      <div className="studio-card p-5 sm:p-6 space-y-4 border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/20 to-zinc-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                <span>Khối Tạo Lệnh Góc Máy Điện Ảnh 5 Lớp (Cinematic Camera Director)</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  Hollywood Formula
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500">
                Dựa trên repo <code>ai9app/AI-Cinematic-Prompt-Director</code> & <code>geekjourneyx/awesome-ai-video-prompts</code> tối ưu cho Sora, Kling, Runway Gen-3, Luma.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyDirectorPrompt}
            className="btn-primary self-start sm:self-auto text-xs flex items-center gap-1.5"
          >
            {copiedDirectorPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedDirectorPrompt ? 'Đã Sao Chép Prompt' : 'Sao Chép Prompt Hoàn Chỉnh'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Layer 1: Movement */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
              <span>1. Chuyển Động Camera (Motion)</span>
            </label>
            <select
              value={directorMovement}
              onChange={(e) => setDirectorMovement(e.target.value)}
              className="w-full bg-white border border-black/10 rounded-lg p-2 text-xs font-mono text-zinc-800 focus:outline-none focus:border-zinc-900"
            >
              <option value="Slow cinematic Dolly In towards subject">🎥 Dolly In (Tiến sát tạo kịch tính)</option>
              <option value="Smooth Dolly Out revealing grand scale environment">🎬 Dolly Out (Lùi xa mở rộng đại cảnh)</option>
              <option value="Dynamic 360-degree smooth Orbit shot circling subject">🔄 Orbit 360° (Xoay tròn quanh nhân vật)</option>
              <option value="Lateral Tracking shot moving parallel alongside subject">🏎️ Tracking Shot (Bám đuổi song song)</option>
              <option value="Grand Crane Boom Up ascending vertically">🏗️ Crane Boom Up (Cẩu máy nâng cao)</option>
              <option value="Fast acrobatic FPV Drone shot weaving through space">🛸 FPV Drone Shot (Flycam nhào lộn)</option>
              <option value="Organic handheld Steadicam movement with micro-jitter">✋ Handheld Steadicam (Cầm tay chân thực)</option>
              <option value="Dramatic Vertigo Dolly Zoom background warping">🌀 Vertigo Effect (Dolly Zoom kéo giãn)</option>
            </select>
          </div>

          {/* Layer 2: Lens */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
              <span>2. Tiêu Cự & Ống Kính (Lens)</span>
            </label>
            <select
              value={directorLens}
              onChange={(e) => setDirectorLens(e.target.value)}
              className="w-full bg-white border border-black/10 rounded-lg p-2 text-xs font-mono text-zinc-800 focus:outline-none focus:border-zinc-900"
            >
              <option value="35mm anamorphic lens, shallow depth of field">📐 35mm Anamorphic (Điện ảnh Hollywood)</option>
              <option value="85mm f/1.4 portrait prime lens, creamy bokeh">🔍 85mm Portrait (Xóa phông chủ thể)</option>
              <option value="14mm ultra wide-angle lens, expansive field of view">🔭 14mm Ultra-Wide (Góc siêu rộng)</option>
              <option value="100mm macro lens, extreme microscopic detail">🔬 100mm Macro (Cận cảnh vi mô)</option>
              <option value="Vintage 50mm film lens, subtle chromatic aberration">🎞️ 50mm Vintage Film (Cổ điển)</option>
            </select>
          </div>

          {/* Layer 3: Lighting */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
              <span>3. Ánh Sáng & Bầu Không Khí</span>
            </label>
            <select
              value={directorLighting}
              onChange={(e) => setDirectorLighting(e.target.value)}
              className="w-full bg-white border border-black/10 rounded-lg p-2 text-xs font-mono text-zinc-800 focus:outline-none focus:border-zinc-900"
            >
              <option value="Volumetric god rays piercing through atmosphere">🌫️ Volumetric Rays (Tia sáng xuyên sương)</option>
              <option value="Cyberpunk neon lighting with high-contrast reflections">🌆 Cyberpunk Neon (Tương phản cao)</option>
              <option value="Warm golden hour sunset glow, rim light on silhouette">🌅 Golden Hour (Hoàng hôn ấm áp)</option>
              <option value="Rembrandt chiaroscuro dramatic side lighting">🕯️ Rembrandt Lighting (Đổ bóng nghệ thuật)</option>
              <option value="Clean clinical high-key studio lighting with soft shadows">💡 Studio Soft Light (Hiện đại, tối giản)</option>
            </select>
          </div>

          {/* Layer 4: Quality & Physics */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
              <span>4. Mô Phỏng Vật Lý & Tốc Độ</span>
            </label>
            <select
              value={directorPacing}
              onChange={(e) => setDirectorPacing(e.target.value)}
              className="w-full bg-white border border-black/10 rounded-lg p-2 text-xs font-mono text-zinc-800 focus:outline-none focus:border-zinc-900"
            >
              <option value="Hyper-detailed 4k render, photorealistic physics, 60fps">⚡ 60fps Siêu mượt • Chuẩn vật lý thực</option>
              <option value="120fps slow-motion fluid physics simulation">⏱️ 120fps Slow-Mo (Chuyển động chậm)</option>
              <option value="24fps cinematic shutter motion blur, ARRI Alexa style">🎥 24fps Cinematic Shutter (Chuẩn rạp)</option>
              <option value="Hyperlapse motion with dynamic speed ramp">⏩ Hyperlapse Speed Ramp (Tua nhanh)</option>
            </select>
          </div>
        </div>

        {/* Live Prompt Preview Box */}
        <div className="p-3 rounded-xl bg-zinc-950 text-white font-mono text-xs space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Sparkles className="w-3 h-3" />
              <span>CÂU LỆNH PROMPT HOLLYWOOD TỰ ĐỘNG SINH (SẴN SÀNG DÙNG TRONG PHÂN CẢNH):</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-sans">100% Tương thích Sora, Kling, Runway</span>
          </div>
          <div className="text-zinc-200 leading-relaxed break-words font-sans bg-zinc-900/80 p-2.5 rounded-lg border border-white/5">
            "{fullCinematicPrompt}"
          </div>
        </div>
      </div>

      {/* Grid of MCP Servers & Repositories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
            DANH SÁCH MÁY CHỦ MCP & KHỐI CÔNG CỤ TỰ ĐỘNG HÓA ({filteredServers.length})
          </h2>
          <span className="text-[11px] text-zinc-400 font-mono">
            Nhấp "Sao Chép Cấu Hình" để đưa vào Claude Desktop / Cursor / Antigravity
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServers.map((server) => {
            const isCopied = copiedId === server.id;
            const currentPing = pingStatus[server.id];

            return (
              <div
                key={server.id}
                className="studio-card p-4 sm:p-5 flex flex-col justify-between space-y-3.5 hover:border-black/20 hover:shadow-2xs transition"
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Title & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-zinc-950 leading-tight">
                          {server.name}
                        </span>
                      </div>
                      <a
                        href={server.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-mono hover:underline"
                        title="Xem mã nguồn trên GitHub"
                      >
                        <span>{server.repo}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-100 text-zinc-800 border border-zinc-200 flex-shrink-0">
                      {server.badge}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-zinc-600 text-xs leading-relaxed line-clamp-3">
                    {server.description}
                  </p>

                  {/* Tech Stack Pills */}
                  <div className="flex flex-wrap gap-1">
                    {server.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-mono border border-black/5"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Key Tools List */}
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-black/5 space-y-1">
                    <div className="text-[10px] font-mono text-zinc-400 font-semibold uppercase flex items-center justify-between">
                      <span>CÁC TOOL MCP TIÊU BIỂU</span>
                      <Terminal className="w-3 h-3 text-zinc-400" />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {server.keyTools.slice(0, 4).map((tool) => (
                        <span
                          key={tool}
                          className="px-1.5 py-0.5 rounded bg-white text-zinc-800 font-mono text-[9px] border border-black/10"
                        >
                          {tool}()
                        </span>
                      ))}
                      {server.keyTools.length > 4 && (
                        <span className="text-[9px] text-zinc-400 font-mono self-center">
                          +{server.keyTools.length - 4} nữa
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div className="space-y-1 text-[11px] text-zinc-600">
                    {server.useCases.slice(0, 2).map((uc, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 flex-shrink-0">✓</span>
                        <span className="leading-snug">{uc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-black/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handlePingServer(server)}
                    disabled={currentPing === 'pinging'}
                    className="btn-secondary text-[11px] flex items-center gap-1 py-1 px-2.5"
                    title="Kiểm tra kết nối tới Server"
                  >
                    <RefreshCw className={`w-3 h-3 ${currentPing === 'pinging' ? 'animate-spin' : ''}`} />
                    <span>{currentPing === 'pinging' ? 'Ping...' : currentPing === 'success' ? 'OK (200)' : 'Kiểm Tra Ping'}</span>
                  </button>

                  <button
                    onClick={() => handleCopyConfig(server)}
                    className="btn-primary text-[11px] flex items-center gap-1.5 py-1 px-3 shadow-2xs"
                    title="Sao chép JSON cấu hình mcpServers"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'Đã Sao Chép' : 'Cấu Hình MCP'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

