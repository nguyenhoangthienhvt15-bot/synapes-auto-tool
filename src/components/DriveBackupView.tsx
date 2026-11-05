import React from 'react';
import { Project } from '../types';
import { HardDrive, ExternalLink, CheckCircle2, Folder } from 'lucide-react';

interface DriveBackupViewProps {
  projects: Project[];
  onBack?: () => void;
}

export const DriveBackupView: React.FC<DriveBackupViewProps> = ({ projects, onBack }) => {
  const publishedProjects = projects.filter((p) => p.driveBackupUrl);

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Header */}
      <div className="apple-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold border border-black/[0.08] transition apple-btn-tap flex items-center gap-1.5 shadow-2xs mr-1"
              title="Thoát sao lưu Drive, quay lại bàn duyệt"
            >
              <span>← Quay Lại</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#FF9500] flex-shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1D1D1F] tracking-tight">Thư Viện Sao Lưu Google Drive</h2>
            <p className="text-zinc-500 text-xs mt-0.5">
              Cấu trúc lưu trữ chuẩn: <code>Drive / Du_An_Video / 2026 / 11 / [Ten_Video].mp4</code>
            </p>
          </div>
        </div>

        <a
          href="https://drive.google.com"
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-1.5 bg-[#FAF9F5] hover:bg-zinc-100 text-zinc-800 border border-black/[0.08] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
        >
          <span>Mở Thư Mục Drive</span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
        </a>
      </div>

      <div className="apple-card p-3.5 text-xs text-zinc-600 flex items-center gap-2.5">
        <Folder className="w-4 h-4 text-[#FF9500] flex-shrink-0" />
        <div>
          <span>Đường dẫn lưu trữ đồng bộ: </span>
          <span className="font-mono text-zinc-900 font-semibold">My Drive / Du_An_Video / 2026 / Tháng 11 /</span>
        </div>
      </div>

      {/* Table */}
      <div className="apple-card overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAF9F5] text-zinc-500 border-b border-black/[0.06]">
              <th className="py-3 px-4 font-semibold">Tên Video & Tập Tin</th>
              <th className="py-3 px-4 font-semibold">Định Dạng</th>
              <th className="py-3 px-4 font-semibold">Thời Lượng</th>
              <th className="py-3 px-4 font-semibold">Kênh Đã Đăng</th>
              <th className="py-3 px-4 font-semibold">Trạng Thái Backup</th>
              <th className="py-3 px-4 font-semibold text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {publishedProjects.map((proj) => (
              <tr key={proj.id} className="hover:bg-[#FAF9F5] transition">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={proj.thumbnailUrl}
                      alt={proj.title}
                      className="w-12 h-8 object-cover rounded-md bg-zinc-200 border border-black/[0.08]"
                    />
                    <div>
                      <div className="font-semibold text-[#1D1D1F]">{proj.title}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">
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
                <td className="py-3 px-4 text-zinc-700 capitalize text-[11px]">
                  {proj.targetChannels.join(', ')}
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã đồng bộ an toàn
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <a
                    href={proj.driveBackupUrl || 'https://drive.google.com'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium transition"
                  >
                    <span>Mở Drive</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
