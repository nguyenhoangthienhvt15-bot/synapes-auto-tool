import React from 'react';
import { Project } from '../types';
import { HardDrive, ExternalLink, CheckCircle2, Folder, ArrowLeft } from 'lucide-react';

interface DriveBackupViewProps {
  projects: Project[];
  onBack?: () => void;
}

export const DriveBackupView: React.FC<DriveBackupViewProps> = ({ projects, onBack }) => {
  const publishedProjects = projects.filter((p) => p.driveBackupUrl);

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Header */}
      <div className="studio-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-secondary flex items-center gap-1.5"
              title="Quay lại bàn duyệt"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          )}

          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center flex-shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Thư Viện Sao Lưu Google Drive</h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              Đồng bộ dữ liệu video phân rã và thành phẩm lên không gian lưu trữ đám mây
            </p>
          </div>
        </div>

        <a
          href="https://drive.google.com"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Mở Google Drive</span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
        </a>
      </div>

      <div className="studio-card p-3 text-xs text-zinc-600 flex items-center gap-2.5">
        <Folder className="w-4 h-4 text-zinc-700 flex-shrink-0" />
        <div className="truncate">
          <span className="text-zinc-500">Đường dẫn đồng bộ mặc định: </span>
          <span className="font-mono text-zinc-900 font-medium">My Drive / Du_An_Video / 2026 / 11 /</span>
        </div>
      </div>

      {/* Table */}
      <div className="studio-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 text-zinc-500 border-b border-black/5 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium">Tên Video & Tập Tin</th>
                <th className="py-2.5 px-4 font-medium">Tỉ Lệ</th>
                <th className="py-2.5 px-4 font-medium">Thời Lượng</th>
                <th className="py-2.5 px-4 font-medium">Kênh Phát Sóng</th>
                <th className="py-2.5 px-4 font-medium">Trạng Thái Đồng Bộ</th>
                <th className="py-2.5 px-4 font-medium text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {publishedProjects.map((proj) => (
                <tr key={proj.id} className="hover:bg-zinc-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={proj.thumbnailUrl}
                        alt={proj.title}
                        className="w-14 h-9 object-cover rounded bg-zinc-200 border border-black/10 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-zinc-900 truncate max-w-xs">{proj.title}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {proj.id}_final_1080p.mp4
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-600 text-[11px]">
                    {proj.aspectRatio}
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-600 text-[11px]">
                    {Math.floor(proj.duration / 60)}m{proj.duration % 60}s
                  </td>
                  <td className="py-3 px-4 text-zinc-600 text-[11px]">
                    {proj.targetChannels.join(', ')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-800 border border-zinc-200">
                      <CheckCircle2 className="w-3 h-3 text-zinc-700" />
                      <span>ĐÃ ĐỒNG BỘ</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={proj.driveBackupUrl || 'https://drive.google.com'}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary py-1 px-2.5 text-[11px] inline-flex items-center gap-1"
                    >
                      <span>Xem file</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
