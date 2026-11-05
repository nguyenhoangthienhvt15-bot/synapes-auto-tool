import React, { useState } from 'react';
import { Skill } from '../types';
import { Sparkles, Plus, Upload, Trash2, X } from 'lucide-react';

interface SkillsManagerViewProps {
  skills: Skill[];
  onAddSkill: (newSkill: Skill) => void;
  onDeleteSkill: (id: string) => void;
  onBack?: () => void;
}

export const SkillsManagerView: React.FC<SkillsManagerViewProps> = ({
  skills,
  onAddSkill,
  onDeleteSkill,
  onBack,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [category] = useState('Công nghệ');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  const handleUploadSkillFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const uploadedSkill: Skill = {
          id: `skill-up-${Date.now()}`,
          name: parsed.name || file.name.replace(/\.[^/.]+$/, ''),
          command: parsed.command || `/${file.name.replace(/\.[^/.]+$/, '').toLowerCase()}`,
          category: parsed.category || 'Mở rộng',
          description: parsed.description || 'Kỹ năng nạp từ file cấu hình',
          tone: parsed.tone || 'Chuyên nghiệp',
          defaultTags: parsed.defaultTags || ['AI', 'Video'],
          systemPrompt: parsed.systemPrompt || 'Prompt chuẩn hóa từ tệp tin',
        };
        onAddSkill(uploadedSkill);
        alert(`Đã nạp file skill [${uploadedSkill.name}] thành công!`);
      } catch (err) {
        alert('File không hợp lệ. Vui lòng chọn file JSON định dạng skill chuẩn.');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: name.trim(),
      command: command.startsWith('/') ? command.trim() : `/${command.trim()}`,
      category,
      description: description.trim(),
      tone: tone.trim() || 'Chuyên nghiệp, cuốn hút',
      defaultTags: tagsInput.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean),
      systemPrompt: systemPrompt.trim(),
    };
    onAddSkill(newSkill);
    setShowAddModal(false);
    setName('');
    setCommand('');
    setDescription('');
    setTone('');
    setTagsInput('');
    setSystemPrompt('');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150 select-none text-zinc-900">
      <div className="studio-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-secondary cursor-pointer"
              title="Quay lại bàn duyệt"
            >
              <span>← Quay Lại</span>
            </button>
          )}

          <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-black/[0.06] flex items-center justify-center text-zinc-900 flex-shrink-0">
            <Sparkles className="w-4 h-4 text-zinc-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-950 tracking-tight">Kho Skills & Prompt Mẫu</h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              Định hình sẵn cấu trúc phân cảnh và phong cách. Khi tạo kịch bản chỉ cần nhập <code>/skill-name</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="btn-secondary cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-zinc-500" />
            <span>Nạp File JSON</span>
            <input
              type="file"
              accept=".json,.yaml,.txt"
              onChange={handleUploadSkillFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Skill</span>
          </button>
        </div>
      </div>

      {/* Grid Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="studio-card p-4 space-y-2 hover:border-black/20 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-950 border border-zinc-200 font-mono font-medium text-xs">
                  {skill.command}
                </span>
                <span className="text-zinc-950 font-semibold text-xs">{skill.name}</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {skill.category}
              </span>
            </div>

            <p className="text-zinc-600 text-xs leading-relaxed">{skill.description}</p>

            <div className="flex flex-wrap gap-1">
              {skill.defaultTags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.2 rounded bg-zinc-50 text-zinc-600 text-[10px] font-mono border border-black/[0.04]"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
              <span>Tông giọng: <strong className="text-zinc-800 font-medium">{skill.tone}</strong></span>
              <button
                onClick={() => onDeleteSkill(skill.id)}
                className="text-zinc-400 hover:text-red-600 transition p-1 cursor-pointer"
                title="Xóa skill"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Skill */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="studio-card max-w-md w-full p-6 shadow-2xl space-y-3.5 text-xs relative">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
              <h3 className="text-zinc-950 font-bold text-sm">Tạo Skill Kịch Bản Mới</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Tên Skill *</label>
                  <input
                    type="text"
                    required
                    placeholder="Review Công Nghệ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Cú pháp *</label>
                  <input
                    type="text"
                    required
                    placeholder="/tech-review"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-1.5 text-xs text-zinc-950 font-mono font-medium focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">Mô tả *</label>
                <input
                  type="text"
                  required
                  placeholder="Kịch bản review công nghệ có hook 3 giây đầu..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">System Prompt chỉ đạo AI *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Chia kịch bản thành các phân đoạn 10s..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-white border border-black/[0.1] rounded-lg p-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary cursor-pointer"
                >
                  Lưu Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
