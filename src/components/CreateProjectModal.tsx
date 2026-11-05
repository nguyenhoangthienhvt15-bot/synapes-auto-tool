import React, { useState } from 'react';
import { Skill, Project } from '../types';
import { Sparkles, Monitor, Smartphone, Paperclip } from 'lucide-react';

interface CreateProjectModalProps {
  skills: Skill[];
  onClose: () => void;
  onCreateProject: (project: Project) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  skills,
  onClose,
  onCreateProject,
}) => {
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('sk-1');
  const [promptText, setPromptText] = useState('');
  const [targetDurationMin, setTargetDurationMin] = useState<number>(8); // Mặc định 8 phút cho YouTube
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [engineType, setEngineType] = useState<'gemini' | 'plugin'>('gemini');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

  const handleQuickCommandSelect = (cmd: string) => {
    const skill = skills.find((s) => s.command === cmd);
    if (skill) {
      setSelectedSkillId(skill.id);
      setPromptText((prev) => `${skill.command}: ${prev || skill.description}`);
    }
  };

  const handleSimulateCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    setIsGenerating(true);
    setGenerationStep('Khởi tạo kịch bản từ Prompt...');

    setTimeout(() => {
      setGenerationStep('Phân rã thành các phân cảnh 10s...');
    }, 1000);

    setTimeout(() => {
      setGenerationStep('Tạo tệp giọng đọc lồng tiếng (TTS)...');
    }, 2000);

    setTimeout(() => {
      const now = new Date();
      const projId = `prj-${Date.now()}`;
      const codeNum = Math.floor(100 + Math.random() * 900);

      const newProject: Project = {
        id: projId,
        code: `SYN-${codeNum}`,
        title: promptText.slice(0, 48) + '...',
        status: 'pending_approval',
        aspectRatio,
        duration: aspectRatio === '16:9' ? targetDurationMin * 60 : 45,
        targetChannels: aspectRatio === '16:9' ? ['youtube'] : ['tiktok', 'facebook'],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        musicTrack: {
          name: 'Cyberpunk Ambient Synth (10min Commercial)',
          license: 'Bản quyền thương mại YouTube Audio Library',
          volume: 20,
        },
        voiceoverTrack: {
          name: 'Giọng Nam Bắc chuẩn',
          voiceName: 'vi-VN-Standard-B',
        },
        metadata: {
          title: promptText.slice(0, 48),
          description: promptText,
          tags: ['AI', 'TechReview', 'AutoVideo', 'Synapes'],
          productLink: 'https://shopee.vn/synapes-deal-tech',
        },
        aiSource: {
          type: engineType,
          name: engineType === 'gemini' ? 'Google Gemini Native' : 'Kling AI Plugin URL',
        },
        createdAt: now.toISOString(),
        storyboard: [
          {
            id: 1,
            sceneNumber: 1,
            timeRange: '00:00 - 00:10',
            startSec: 0,
            endSec: 10,
            voiceover: 'Chào mừng các bạn đã quay trở lại với chuỗi phân tích chuyên sâu...',
            visualPrompt: 'Cinematic wide shot opening, modern technology, 4k resolution, photorealistic',
            clipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            transition: 'cut',
          },
          {
            id: 2,
            sceneNumber: 2,
            timeRange: '00:10 - 00:20',
            startSec: 10,
            endSec: 20,
            voiceover: 'Vấn đề cốt lõi bắt đầu từ việc tối ưu hóa chuỗi quy trình xuất bản đa nền tảng...',
            visualPrompt: 'Detailed workflow demonstration, minimal interface, macro lens, hyper-clean',
            clipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            transition: 'fade',
          },
          {
            id: 3,
            sceneNumber: 3,
            timeRange: '00:20 - 00:30',
            startSec: 20,
            endSec: 30,
            voiceover: 'Khi kết hợp nhiều clip lại, hệ thống tính toán chính xác tổng thời lượng mục tiêu...',
            visualPrompt: 'Futuristic digital dashboard, high tech charts, crisp lighting',
            clipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
            transition: 'dissolve',
          },
        ],
      };

      onCreateProject(newProject);
      setIsGenerating(false);
      onClose();
    }, 3200);
  };

  // Keyboard shortcut: Press Escape to cancel/close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-black/[0.08] max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1D1D1F] tracking-tight">Tạo Dự Án Kịch Bản Mới</h2>
              <p className="text-zinc-500 text-xs">AI tự động phân cảnh, lồng tiếng và chuyển vào bàn duyệt</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-800 text-sm p-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSimulateCreate} className="space-y-4 text-xs">
          {/* Định dạng */}
          <div>
            <label className="text-zinc-700 font-semibold block mb-1.5">1. Định dạng xuất bản *</label>
            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => {
                  setAspectRatio('16:9');
                  setTargetDurationMin(8);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition ${aspectRatio === '16:9'
                    ? 'bg-blue-50/60 border-[#0071E3] text-[#0071E3] shadow-xs'
                    : 'bg-[#FAF9F5] border-black/[0.08] text-zinc-600 hover:border-black/[0.15]'
                  }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-[#0071E3]" /> Video Dài YouTube (16:9)
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">5 – 10 phút theo tiêu chuẩn</div>
              </div>

              <div
                onClick={() => setAspectRatio('9:16')}
                className={`p-3 rounded-xl border cursor-pointer transition ${aspectRatio === '9:16'
                    ? 'bg-emerald-50/60 border-[#34C759] text-emerald-800 shadow-xs'
                    : 'bg-[#FAF9F5] border-black/[0.08] text-zinc-600 hover:border-black/[0.15]'
                  }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#34C759]" /> Shorts / TikTok / Reels (9:16)
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Dưới 60s, gắn link tiếp thị</div>
              </div>
            </div>
          </div>

          {/* Chọn Skills */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-700 font-semibold">2. Chọn Bộ Skill / Lệnh nhanh</label>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {skills.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => handleQuickCommandSelect(s.command)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${selectedSkillId === s.id
                      ? 'bg-[#0071E3] text-white font-medium shadow-xs'
                      : 'bg-[#FAF9F5] text-zinc-600 hover:text-zinc-900 border border-black/[0.08]'
                    }`}
                >
                  {s.command}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="text-zinc-700 font-semibold block mb-1">3. Câu lệnh ý tưởng (Prompt) *</label>
            <textarea
              rows={4}
              required
              placeholder="VD: Xây dựng kịch bản video phân tích 5 ứng dụng AI lớn nhất năm 2026..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#0071E3] leading-relaxed transition"
            ></textarea>
          </div>

          {/* Đính kèm & Engine */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-700 font-semibold block mb-1">Tệp đính kèm (audio/ảnh demo)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'audio/*,image/*';
                    input.onchange = (ev: any) => {
                      if (ev.target.files?.[0]) {
                        setAttachedFileName(ev.target.files[0].name);
                      }
                    };
                    input.click();
                  }}
                  className="px-3 py-1.5 bg-[#FAF9F5] hover:bg-zinc-100 border border-black/[0.08] rounded-xl text-zinc-700 text-xs flex items-center gap-1.5 transition"
                >
                  <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Chọn tệp</span>
                </button>
                {attachedFileName && (
                  <span className="text-[#34C759] font-mono font-medium text-[11px] truncate">{attachedFileName}</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-zinc-700 font-semibold block mb-1">Động cơ AI</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEngineType('gemini')}
                  className={`flex-1 py-1.5 px-2 rounded-xl border text-center text-[11px] transition ${engineType === 'gemini'
                      ? 'bg-blue-50 border-[#0071E3] text-[#0071E3] font-semibold'
                      : 'bg-[#FAF9F5] border-black/[0.08] text-zinc-600'
                    }`}
                >
                  Gemini Native
                </button>

                <button
                  type="button"
                  onClick={() => setEngineType('plugin')}
                  className={`flex-1 py-1.5 px-2 rounded-xl border text-center text-[11px] transition ${engineType === 'plugin'
                      ? 'bg-blue-50 border-[#0071E3] text-[#0071E3] font-semibold'
                      : 'bg-[#FAF9F5] border-black/[0.08] text-zinc-600'
                    }`}
                >
                  Plugin URL (Kling)
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-black/[0.06] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-zinc-500 hover:text-zinc-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-[0.98]"
            >
              Tạo Kịch Bản AI
            </button>
          </div>
        </form>

        {isGenerating && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
            <div className="w-10 h-10 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3]">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <h4 className="text-[#1D1D1F] font-bold text-sm">Đang Xử Lý Kịch Bản...</h4>
            <p className="text-zinc-600 text-xs">{generationStep}</p>
          </div>
        )}
      </div>
    </div>
  );
};
