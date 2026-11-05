import React, { useState } from 'react';
import { EngineerSheetRow } from '../types';
import { KeyRound, Plus, RefreshCw, Search, ShieldCheck, Mail, CheckCircle2, Clock, AlertTriangle, FileSpreadsheet } from 'lucide-react';

interface EngineerSheetViewProps {
  sheetRows: EngineerSheetRow[];
  onUpdateSheetRow: (updatedRows: EngineerSheetRow[]) => void;
  onSendTempPasswordEmail: (email: string, code: string, tempPass: string) => void;
}

export const EngineerSheetView: React.FC<EngineerSheetViewProps> = ({
  sheetRows,
  onUpdateSheetRow,
  onSendTempPasswordEmail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<EngineerSheetRow | null>(null);
  const [newTempPassInput, setNewTempPassInput] = useState('');
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form thêm mã mới
  const [newCode, setNewCode] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newGmail, setNewGmail] = useState('');
  const [newInitialPass, setNewInitialPass] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredRows = sheetRows.filter(
    (r) =>
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.registeredGmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleResetPassword = (row: EngineerSheetRow) => {
    const generatedPass = newTempPassInput.trim() || `Auto-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    const updated = sheetRows.map((item) => {
      if (item.code === row.code) {
        return {
          ...item,
          currentTempPassword: generatedPass,
          lastIssuedTime: timeString,
          accountStatus: 'temp_password_active' as const,
          engineerNotes: `${item.engineerNotes} | [${timeString}] Cấp lại mật khẩu tạm.`,
        };
      }
      return item;
    });

    onUpdateSheetRow(updated);
    onSendTempPasswordEmail(row.registeredGmail, row.code, generatedPass);
    showToast(`Đã cấp mật khẩu tạm [${generatedPass}] cho mã ${row.code} và đồng bộ lên Google Sheet & gửi Gmail.`);
    setSelectedRow(null);
    setNewTempPassInput('');
  };

  const handleAddNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newClientName || !newGmail) {
      alert('Vui lòng nhập đầy đủ Mã Code, Tên khách hàng và Gmail');
      return;
    }

    const defaultPass = newInitialPass.trim() || `Start@${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    const newRow: EngineerSheetRow = {
      code: newCode.trim().toUpperCase(),
      clientName: newClientName.trim(),
      registeredGmail: newGmail.trim(),
      currentTempPassword: defaultPass,
      lastIssuedTime: timeString,
      accountStatus: 'never_changed',
      engineerNotes: newNotes.trim() || 'Khách hàng mới tạo',
    };

    onUpdateSheetRow([newRow, ...sheetRows]);
    onSendTempPasswordEmail(newRow.registeredGmail, newRow.code, defaultPass);
    showToast(`Đã thêm mã mới ${newRow.code} và gửi thông tin về ${newRow.registeredGmail}!`);

    setNewCode('');
    setNewClientName('');
    setNewGmail('');
    setNewInitialPass('');
    setNewNotes('');
    setIsAddingNewRow(false);
  };

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1D1D1F] text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-slide-in">
          <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar: Apple Numbers Style */}
      <div className="apple-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#34C759]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1D1D1F] tracking-tight">Bảng Quản Trị Kỹ Sư (Numbers Live Sheet)</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#34C759] bg-emerald-50 border border-emerald-200 font-bold">
                  LIVE SYNC
                </span>
              </div>
              <p className="text-zinc-500 text-xs mt-0.5">
                Quản lý mã code, xem mật khẩu mặc định/tạm thời mới nhất và hỗ trợ cấp lại mật khẩu
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddingNewRow(true)}
            className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-[0.98] shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Cấp Mã Mới</span>
          </button>
        </div>

        {/* Security Rule Notice */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-950 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#0071E3] flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-blue-950 font-bold">Chuẩn bảo mật Apple:</strong> Cột <strong>"Mật Khẩu Tạm"</strong> chỉ lưu giữ mật khẩu do hệ thống sinh ra. Khi khách hàng đặt mật khẩu riêng, hệ thống tự động băm mã hóa một chiều và hiển thị trạng thái <span className="text-emerald-700 font-bold">Khách đã đổi pass riêng</span>.
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã, Tên hoặc Gmail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#0071E3] transition"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>Tổng: <strong className="text-zinc-900 font-mono font-bold">{sheetRows.length}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span>
              Đã đổi pass riêng: <strong className="text-[#34C759] font-mono font-bold">{sheetRows.filter((r) => r.accountStatus === 'custom_password_active').length}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF9500]"></span>
              Dùng pass tạm: <strong className="text-[#FF9500] font-mono font-bold">{sheetRows.filter((r) => r.accountStatus !== 'custom_password_active').length}</strong>
            </span>
          </div>
        </div>

        {/* Clean Table */}
        <div className="overflow-x-auto rounded-xl border border-black/[0.08]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF9F5] text-zinc-500 border-b border-black/[0.08]">
                <th className="py-2.5 px-3.5 font-semibold">Mã Code</th>
                <th className="py-2.5 px-3.5 font-semibold">Khách Hàng</th>
                <th className="py-2.5 px-3.5 font-semibold">Gmail Đăng Ký</th>
                <th className="py-2.5 px-3.5 font-semibold">Mật Khẩu Tạm / Mặc Định</th>
                <th className="py-2.5 px-3.5 font-semibold">Thời Gian Cấp</th>
                <th className="py-2.5 px-3.5 font-semibold">Trạng Thái</th>
                <th className="py-2.5 px-3.5 font-semibold">Ghi Chú</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filteredRows.map((row) => (
                <tr key={row.code} className="hover:bg-[#FAF9F5] transition">
                  <td className="py-2.5 px-3.5 font-mono font-bold text-[#0071E3]">
                    {row.code}
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-900 font-medium">
                    {row.clientName}
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-500 font-mono text-[11px]">
                    {row.registeredGmail}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-[#FF9500] font-bold">
                    {row.currentTempPassword}
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-500 text-[11px]">
                    {row.lastIssuedTime}
                  </td>
                  <td className="py-2.5 px-3.5">
                    {row.accountStatus === 'custom_password_active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Khách đã đổi pass riêng
                      </span>
                    ) : row.accountStatus === 'temp_password_active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-2.5 h-2.5 text-amber-600" /> Vừa cấp lại pass
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-black/[0.06]">
                        Chưa đổi (Dùng mặc định)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-500 text-[11px] max-w-xs truncate" title={row.engineerNotes}>
                    {row.engineerNotes}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <button
                      onClick={() => {
                        setSelectedRow(row);
                        setNewTempPassInput(`Reset#${Math.floor(1000 + Math.random() * 9000)}`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#FAF9F5] hover:bg-zinc-100 text-zinc-700 border border-black/[0.08] text-[11px] font-medium transition"
                    >
                      <KeyRound className="w-3 h-3 inline mr-1 text-[#FF9500]" />
                      Đổi/Cấp Pass
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cấp lại Pass */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-black/[0.08] p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-[#1D1D1F] font-bold text-sm">Cấp Lại Mật Khẩu Tạm</h3>
            <div className="p-3 rounded-xl bg-[#FAF9F5] text-zinc-700 text-xs space-y-1 border border-black/[0.06]">
              <div>Khách: <strong className="text-zinc-900">{selectedRow.clientName}</strong></div>
              <div>Gmail: <span className="font-mono text-zinc-600">{selectedRow.registeredGmail}</span></div>
            </div>

            <div>
              <label className="text-zinc-700 text-xs block mb-1 font-medium">Mật khẩu tạm mới:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTempPassInput}
                  onChange={(e) => setNewTempPassInput(e.target.value)}
                  className="flex-1 bg-[#FAF9F5] border border-black/[0.1] rounded-xl px-3 py-1.5 text-xs text-[#FF9500] font-mono font-bold focus:outline-none focus:bg-white focus:border-[#0071E3]"
                />
                <button
                  type="button"
                  onClick={() => setNewTempPassInput(`Auto-${Math.floor(100000 + Math.random() * 900000)}`)}
                  className="px-2.5 py-1.5 bg-[#FAF9F5] hover:bg-zinc-100 border border-black/[0.08] text-zinc-700 rounded-xl text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-black/[0.06]">
              <button
                onClick={() => setSelectedRow(null)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800"
              >
                Hủy
              </button>
              <button
                onClick={() => handleResetPassword(selectedRow)}
                className="px-4 py-1.5 bg-[#0071E3] text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Cấp & Gửi Gmail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm Code mới */}
      {isAddingNewRow && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-black/[0.08] p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-[#1D1D1F] font-bold text-sm">Cấp Mã Khách Hàng Mới</h3>
            <form onSubmit={handleAddNewClient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Mã Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="VIP-004"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl px-3 py-1.5 text-xs text-[#0071E3] font-mono font-bold uppercase focus:outline-none focus:bg-white focus:border-[#0071E3]"
                  />
                </div>
                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Tên khách hàng *</label>
                  <input
                    type="text"
                    required
                    placeholder="Anh Hoàng"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-[#0071E3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">Gmail đăng ký *</label>
                <input
                  type="email"
                  required
                  placeholder="khach@gmail.com"
                  value={newGmail}
                  onChange={(e) => setNewGmail(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">Mật khẩu mặc định</label>
                <input
                  type="text"
                  placeholder="Để trống hệ thống sẽ tự sinh"
                  value={newInitialPass}
                  onChange={(e) => setNewInitialPass(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl px-3 py-1.5 text-xs text-[#FF9500] font-mono font-bold focus:outline-none focus:bg-white focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  placeholder="Gói 6 tháng..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl p-2 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-[#0071E3]"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsAddingNewRow(false)}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0071E3] text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Lưu & Cấp Mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
