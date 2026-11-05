import React, { useState } from 'react';
import { EngineerSheetRow } from '../types';
import {
  KeyRound, Plus, RefreshCw, Search, ShieldCheck, Mail, CheckCircle2, Clock,
  FileSpreadsheet, ExternalLink, Code2, Copy, Check, X
} from 'lucide-react';
import { GOOGLE_SHEET_URL } from '../services/googleSheetService';

interface EngineerSheetViewProps {
  sheetRows: EngineerSheetRow[];
  onUpdateSheetRow: (updatedRows: EngineerSheetRow[]) => void;
  onSendTempPasswordEmail: (email: string, code: string, tempPass: string) => void;
  onSyncSheet?: () => Promise<void>;
  isSyncingSheet?: boolean;
  lastSyncTime?: string | null;
}

const APPS_SCRIPT_CODE = `function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 SYNAPES Auto Tool')
    .addItem('🔄 Cập nhật dữ liệu lên WebApp ngay', 'syncToWebApp')
    .addSeparator()
    .addItem('🔑 Tạo mật khẩu ngẫu nhiên cho dòng đang chọn', 'generateTempPasswordForSelectedRow')
    .addItem('📧 Gửi email mật khẩu cho khách qua Gmail', 'sendAccountEmailToClient')
    .addSeparator()
    .addItem('🌐 Mở WebApp Studio', 'openWebAppUrl')
    .addToUi();
}

function syncToWebApp() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var valid = 0;
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] && String(data[i][1]).trim() !== '') valid++;
  }
  SpreadsheetApp.getUi().alert(
    '🔄 ĐÃ CẬP NHẬT LÊN WEBAPP THÀNH CÔNG!\\n\\n' +
    '• Tổng số tài khoản sẵn sàng: ' + valid + '\\n' +
    '• WebApp kết nối trực tiếp với Sheet theo thời gian thực.\\n' +
    '• Mọi thay đổi về Mã Code/Mật khẩu có hiệu lực ngay lập tức.\\n\\n' +
    'Link: https://synapes-auto-tool.onrender.com'
  );
}

function generateTempPasswordForSelectedRow() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var row = sheet.getActiveCell().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert('⚠️ Vui lòng chọn dòng khách hàng từ dòng 2.');
    return;
  }
  var newPass = 'Auto-' + Math.floor(100000 + Math.random() * 900000);
  var time = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm");
  sheet.getRange(row, 5).setValue(newPass);
  sheet.getRange(row, 6).setValue(time);
  sheet.getRange(row, 7).setValue('⚪ Dùng mặc định');
  SpreadsheetApp.getUi().alert('🔑 Đã tạo mật khẩu mới [' + newPass + '] thành công!');
}

function sendAccountEmailToClient() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var row = sheet.getActiveCell().getRow();
  if (row <= 1) return;
  var code = sheet.getRange(row, 2).getValue();
  var name = sheet.getRange(row, 3).getValue();
  var email = sheet.getRange(row, 4).getValue();
  var pass = sheet.getRange(row, 5).getValue();
  if (!email || String(email).indexOf('@') === -1) {
    SpreadsheetApp.getUi().alert('⚠️ Chưa có email hợp lệ ở Cột D!');
    return;
  }
  MailApp.sendEmail(
    email,
    'Thông tin tài khoản Studio — SYNAPES Auto Tool (' + code + ')',
    'Kính gửi ' + name + ',\\n\\n' +
    'Thông tin đăng nhập Studio của bạn:\\n' +
    '• WebApp: https://synapes-auto-tool.onrender.com\\n' +
    '• Mã Code: ' + code + '\\n' +
    '• Mật khẩu: ' + pass + '\\n\\n' +
    'Trân trọng,\\nĐội ngũ SYNAPES Auto Tool'
  );
  SpreadsheetApp.getUi().alert('📧 Đã gửi email thông tin đăng nhập đến ' + email);
}

function openWebAppUrl() {
  var html = HtmlService.createHtmlOutput(
    '<script>window.open("https://synapes-auto-tool.onrender.com", "_blank");google.script.host.close();</script>'
  ).setWidth(100).setHeight(50);
  SpreadsheetApp.getUi().showModalDialog(html, 'Đang mở WebApp...');
}`;

export const EngineerSheetView: React.FC<EngineerSheetViewProps> = ({
  sheetRows,
  onUpdateSheetRow,
  onSendTempPasswordEmail,
  onSyncSheet,
  isSyncingSheet = false,
  lastSyncTime,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<EngineerSheetRow | null>(null);
  const [newTempPassInput, setNewTempPassInput] = useState('');
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [showAppsScriptModal, setShowAppsScriptModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
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

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedScript(true);
    showToast('Đã sao chép toàn bộ mã Google Apps Script vào bộ nhớ tạm!');
    setTimeout(() => setCopiedScript(false), 3000);
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
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
                Đồng bộ 2 chiều với Google Sheet chính thức: tài khoản mới tạo trên Sheet sẽ cập nhật lên Web ngay lập tức.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Nút Đồng bộ từ Google Sheet */}
            {onSyncSheet && (
              <button
                onClick={onSyncSheet}
                disabled={isSyncingSheet}
                className="px-3 py-2 bg-white hover:bg-zinc-50 text-zinc-800 border border-black/[0.1] rounded-xl text-xs font-medium flex items-center gap-1.5 transition active:scale-[0.98] shadow-2xs"
                title="Đồng bộ ngay với Google Sheet"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin text-[#0071E3]' : 'text-zinc-500'}`} />
                <span>{isSyncingSheet ? 'Đang tải...' : 'Đồng Bộ Sheet'}</span>
              </button>
            )}

            {/* Mở Google Sheet trực tiếp */}
            <a
              href={GOOGLE_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition active:scale-[0.98] shadow-2xs"
              title="Mở Google Sheet trên tab mới"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mở Google Sheet</span>
            </a>

            {/* Cài đặt Menu Sheet */}
            <button
              onClick={() => setShowAppsScriptModal(true)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition active:scale-[0.98] shadow-2xs"
              title="Cài đặt menu thao tác trực tiếp trên Google Sheet"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Menu Trên Sheet (Apps Script)</span>
            </button>

            {/* Cấp Mã Mới tại web */}
            <button
              onClick={() => setIsAddingNewRow(true)}
              className="px-3.5 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-[0.98] shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Cấp Mã Mới</span>
            </button>
          </div>
        </div>

        {/* Security Rule Notice */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-950 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#0071E3] flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-blue-950 font-bold">Chuẩn bảo mật Apple:</strong> Cột <strong>"Mật Khẩu Tạm"</strong> chỉ lưu giữ mật khẩu do hệ thống sinh ra. Khi khách hàng đặt mật khẩu riêng, hệ thống tự động băm mã hóa một chiều và hiển thị trạng thái <span className="text-emerald-700 font-bold">Khách đã đổi pass riêng</span>.
            {lastSyncTime && (
              <span className="block mt-1 text-[11px] text-zinc-500 font-mono">
                • Thời gian đồng bộ gần nhất từ Sheet: {lastSyncTime}
              </span>
            )}
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
                        setNewTempPassInput(`Auto-${Math.floor(100000 + Math.random() * 900000)}`);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-zinc-50 text-[#0071E3] border border-black/[0.08] rounded-lg text-[11px] font-medium shadow-2xs transition active:scale-95 flex items-center gap-1 mx-auto"
                      title="Cấp mật khẩu tạm thời mới và tự động gửi email"
                    >
                      <KeyRound className="w-3 h-3 text-[#FF9500]" />
                      <span>Cấp lại Pass</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP CẤP LẠI MẬT KHẨU TẠM */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-black/[0.08] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[#1D1D1F] font-bold text-sm">Cấp Mật Khẩu Tạm Thời Mới</h3>
                  <p className="text-zinc-500 text-xs">Mã Khách Hàng: <strong className="font-mono text-[#0071E3]">{selectedRow.code}</strong></p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="text-zinc-400 hover:text-zinc-700 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF9F5] border border-black/[0.06] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Khách hàng:</span>
                  <span className="text-zinc-900 font-medium">{selectedRow.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Gmail đăng ký:</span>
                  <span className="text-zinc-900 font-mono text-[11px]">{selectedRow.registeredGmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Pass tạm hiện tại:</span>
                  <span className="font-mono text-amber-700 font-bold">{selectedRow.currentTempPassword}</span>
                </div>
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">
                  Mật khẩu tạm mới (tự sinh hoặc tùy chỉnh):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTempPassInput}
                    onChange={(e) => setNewTempPassInput(e.target.value)}
                    className="flex-1 bg-[#FAF9F5] border border-black/[0.1] rounded-xl px-3 py-2 text-xs font-mono text-[#FF9500] font-bold focus:outline-none focus:bg-white focus:border-[#0071E3]"
                  />
                  <button
                    type="button"
                    onClick={() => setNewTempPassInput(`Auto-${Math.floor(100000 + Math.random() * 900000)}`)}
                    className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-medium transition"
                  >
                    Sinh ngẫu nhiên
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-[11px] flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#0071E3] flex-shrink-0" />
                <span>Hệ thống sẽ cập nhật trạng thái trên Google Sheet và tự động gửi thông tin về Gmail của khách hàng.</span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setSelectedRow(null)}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleResetPassword(selectedRow)}
                  className="px-4 py-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Xác Nhận & Gửi Gmail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP THÊM MÃ MỚI */}
      {isAddingNewRow && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-black/[0.08] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <h3 className="text-[#1D1D1F] font-bold text-sm">Cấp Mã Khách Hàng Mới</h3>
              <button
                onClick={() => setIsAddingNewRow(false)}
                className="text-zinc-400 hover:text-zinc-700 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewClient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-700 font-medium block mb-1">Mã Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: FYER-051126"
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
                    placeholder="Ngô Phát"
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
                  placeholder="trolibaitap2021@gmail.com"
                  value={newGmail}
                  onChange={(e) => setNewGmail(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">Mật khẩu mặc định</label>
                <input
                  type="text"
                  placeholder="Để trống hệ thống sẽ tự sinh (Auto-XXXXXX)"
                  value={newInitialPass}
                  onChange={(e) => setNewInitialPass(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-black/[0.1] rounded-xl px-3 py-1.5 text-xs text-[#FF9500] font-mono font-bold focus:outline-none focus:bg-white focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  placeholder="Gói Pro Studio..."
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

      {/* POPUP HƯỚNG DẪN CÀI ĐẶT MENU GOOGLE SHEET (APPS SCRIPT) */}
      {showAppsScriptModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-black/[0.08] max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[#1D1D1F] font-bold text-sm">Cài Đặt Menu Trực Tiếp Trên Google Sheet</h3>
                  <p className="text-zinc-500 text-xs">Thêm menu "🚀 SYNAPES Auto Tool" vào bảng tính của bạn</p>
                </div>
              </div>
              <button
                onClick={() => setShowAppsScriptModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-xs p-1.5 rounded-full hover:bg-black/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-[#FAF9F5] border border-black/[0.08] rounded-xl space-y-2">
                <div className="font-semibold text-zinc-900">Cách cài đặt trong 1 phút:</div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-600 leading-relaxed">
                  <li>Mở bảng tính Google Sheet của bạn: <a href={GOOGLE_SHEET_URL} target="_blank" rel="noopener noreferrer" className="text-[#0071E3] underline font-medium">Bấm vào đây để mở Sheet</a>.</li>
                  <li>Trên thanh menu trên cùng, bấm <strong>Tiện ích mở rộng</strong> (Extensions) ➔ <strong>Apps Script</strong>.</li>
                  <li>Xóa mã cũ trong tệp `Code.gs`, dán toàn bộ đoạn mã bên dưới vào và bấm <strong>💾 Lưu</strong> (Ctrl + S).</li>
                  <li>Bấm nút <strong>▶ Chạy</strong> (Run) hàm `onOpen` để cấp quyền Google, sau đó quay lại Sheet nhấn <strong>F5</strong>. Bạn sẽ thấy menu <strong>🚀 SYNAPES Auto Tool</strong> xuất hiện ngay trên thanh công cụ!</li>
                </ol>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-zinc-700">Mã Google Apps Script (Sẵn sàng sao chép):</span>
                  <button
                    onClick={handleCopyScript}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-2xs transition"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã Sao Chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao Chép Mã</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <pre className="p-3.5 bg-zinc-900 text-zinc-200 rounded-xl text-[11px] font-mono max-h-60 overflow-y-auto leading-relaxed">
                    {APPS_SCRIPT_CODE}
                  </pre>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowAppsScriptModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-medium transition"
                >
                  Đóng
                </button>
                <a
                  href={GOOGLE_SHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 transition"
                >
                  <span>Mở Google Sheet Ngay</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
