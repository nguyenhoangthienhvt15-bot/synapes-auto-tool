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
    showToast('Đã sao chép mã Google Apps Script vào bộ nhớ tạm.');
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
    showToast(`Đã cấp mật khẩu [${generatedPass}] cho mã ${row.code} và đồng bộ.`);
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
    showToast(`Đã tạo mã ${newRow.code} thành công.`);

    setNewCode('');
    setNewClientName('');
    setNewGmail('');
    setNewInitialPass('');
    setNewNotes('');
    setIsAddingNewRow(false);
  };

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-medium animate-slide-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="studio-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Cơ Sở Dữ Liệu Khách Hàng (Google Sheets Live)</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium text-zinc-700 bg-zinc-100 border border-zinc-200">
                  LIVE SYNC
                </span>
              </div>
              <p className="text-zinc-500 text-xs mt-0.5">
                Đồng bộ hai chiều với Google Sheets. Mọi tài khoản tạo mới hoặc sửa đổi đều cập nhật lên WebApp lập tức.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSyncSheet && (
              <button
                onClick={onSyncSheet}
                disabled={isSyncingSheet}
                className="btn-secondary flex items-center gap-1.5"
                title="Đồng bộ ngay với Google Sheet"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin text-zinc-900' : 'text-zinc-500'}`} />
                <span>{isSyncingSheet ? 'Đang nạp...' : 'Đồng bộ Sheet'}</span>
              </button>
            )}

            <a
              href={GOOGLE_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-1.5"
              title="Mở Google Sheet trên tab mới"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span>Mở Google Sheet</span>
            </a>

            <button
              onClick={() => setShowAppsScriptModal(true)}
              className="btn-secondary flex items-center gap-1.5"
              title="Cài đặt menu thao tác trực tiếp trên Google Sheet"
            >
              <Code2 className="w-3.5 h-3.5 text-zinc-600" />
              <span>Apps Script Menu</span>
            </button>

            <button
              onClick={() => setIsAddingNewRow(true)}
              className="btn-primary flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cấp Mã Mới</span>
            </button>
          </div>
        </div>

        {/* Security Info */}
        <div className="p-3 rounded-lg bg-zinc-50/70 border border-black/5 text-zinc-600 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-zinc-700 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-medium text-zinc-900">Bảo mật tài khoản:</span> Cột <strong>"Mật Khẩu Tạm"</strong> chỉ hiển thị mật khẩu mặc định hoặc mật khẩu tạm vừa cấp. Khi khách hàng thiết lập mật khẩu riêng, hệ thống tự động băm mã hóa một chiều.
            {lastSyncTime && (
              <span className="block mt-0.5 text-[11px] text-zinc-400 font-mono">
                Lần đồng bộ gần nhất: {lastSyncTime}
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
              className="w-full bg-zinc-50 border border-black/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
            <span>Tổng: <strong className="text-zinc-900">{sheetRows.length}</strong></span>
            <span>•</span>
            <span>Đã đổi pass riêng: <strong className="text-zinc-900">{sheetRows.filter((r) => r.accountStatus === 'custom_password_active').length}</strong></span>
            <span>•</span>
            <span>Dùng pass tạm: <strong className="text-zinc-900">{sheetRows.filter((r) => r.accountStatus !== 'custom_password_active').length}</strong></span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-black/10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50/80 text-zinc-500 border-b border-black/5 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3.5 font-medium">Mã Code</th>
                <th className="py-2.5 px-3.5 font-medium">Khách Hàng</th>
                <th className="py-2.5 px-3.5 font-medium">Gmail Đăng Ký</th>
                <th className="py-2.5 px-3.5 font-medium">Mật Khẩu Tạm</th>
                <th className="py-2.5 px-3.5 font-medium">Thời Gian Cấp</th>
                <th className="py-2.5 px-3.5 font-medium">Trạng Thái</th>
                <th className="py-2.5 px-3.5 font-medium">Ghi Chú</th>
                <th className="py-2.5 px-3.5 font-medium text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredRows.map((row) => (
                <tr key={row.code} className="hover:bg-zinc-50/60 transition">
                  <td className="py-2.5 px-3.5 font-mono font-medium text-zinc-900">
                    {row.code}
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-900 font-medium">
                    {row.clientName}
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-500 font-mono text-[11px]">
                    {row.registeredGmail}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-zinc-800 font-medium">
                    {row.currentTempPassword}
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-500 font-mono text-[11px]">
                    {row.lastIssuedTime}
                  </td>
                  <td className="py-2.5 px-3.5">
                    {row.accountStatus === 'custom_password_active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-800 border border-zinc-200">
                        <CheckCircle2 className="w-2.5 h-2.5 text-zinc-700" />
                        <span>ĐÃ ĐỔI PASS</span>
                      </span>
                    ) : row.accountStatus === 'temp_password_active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-800 border border-zinc-200">
                        <Clock className="w-2.5 h-2.5 text-zinc-700" />
                        <span>VỪA CẤP LẠI</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-50 text-zinc-500 border border-zinc-200">
                        <span>MẶC ĐỊNH</span>
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
                      className="btn-secondary py-1 px-2 text-[11px] inline-flex items-center gap-1 mx-auto"
                      title="Cấp mật khẩu tạm thời mới"
                    >
                      <KeyRound className="w-3 h-3 text-zinc-600" />
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-black/10 max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-zinc-900 font-semibold text-xs uppercase tracking-wider font-mono">Cấp Mật Khẩu Tạm Thời Mới</h3>
                  <p className="text-zinc-500 text-xs">Mã khách hàng: <strong className="font-mono text-zinc-900">{selectedRow.code}</strong></p>
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
              <div className="p-3 rounded-lg bg-zinc-50 border border-black/5 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Khách hàng:</span>
                  <span className="text-zinc-900 font-sans font-medium">{selectedRow.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Gmail đăng ký:</span>
                  <span className="text-zinc-900">{selectedRow.registeredGmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Pass tạm hiện tại:</span>
                  <span className="text-zinc-900 font-medium">{selectedRow.currentTempPassword}</span>
                </div>
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">
                  Mật khẩu tạm mới:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTempPassInput}
                    onChange={(e) => setNewTempPassInput(e.target.value)}
                    className="flex-1 bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-900 font-medium focus:outline-none focus:bg-white focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setNewTempPassInput(`Auto-${Math.floor(100000 + Math.random() * 900000)}`)}
                    className="btn-secondary"
                  >
                    Sinh ngẫu nhiên
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 border border-black/5 text-zinc-500 text-[11px] flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                <span>Hệ thống sẽ cập nhật trạng thái trên Google Sheet và thông báo qua email.</span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setSelectedRow(null)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleResetPassword(selectedRow)}
                  className="btn-primary"
                >
                  Xác Nhận & Gửi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP THÊM MÃ MỚI */}
      {isAddingNewRow && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-black/10 max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <h3 className="text-zinc-900 font-semibold text-xs uppercase tracking-wider font-mono">Cấp Mã Khách Hàng Mới</h3>
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
                    className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono uppercase focus:outline-none focus:bg-white focus:border-zinc-900"
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
                    className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
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
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">Mật khẩu mặc định</label>
                <input
                  type="text"
                  placeholder="Để trống hệ thống sẽ tự sinh (Auto-XXXXXX)"
                  value={newInitialPass}
                  onChange={(e) => setNewInitialPass(e.target.value)}
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="text-zinc-700 font-medium block mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  placeholder="Gói Pro Studio..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-zinc-50 border border-black/10 rounded-lg p-2 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setIsAddingNewRow(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary"
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
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-black/10 max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-zinc-900 font-semibold text-xs uppercase tracking-wider font-mono">Cài Đặt Menu Trực Tiếp Trên Google Sheet</h3>
                  <p className="text-zinc-500 text-xs">Thêm menu "🚀 SYNAPES Auto Tool" vào bảng tính của bạn</p>
                </div>
              </div>
              <button
                onClick={() => setShowAppsScriptModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-xs p-1.5 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-zinc-50 border border-black/5 rounded-lg space-y-1.5">
                <div className="font-semibold text-zinc-900">Cách cài đặt:</div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-600 leading-relaxed">
                  <li>Mở bảng tính Google Sheets: <a href={GOOGLE_SHEET_URL} target="_blank" rel="noopener noreferrer" className="text-zinc-900 font-medium underline">Bấm vào đây để mở Sheet</a>.</li>
                  <li>Trên thanh menu trên cùng, bấm <strong>Tiện ích mở rộng</strong> (Extensions) ➔ <strong>Apps Script</strong>.</li>
                  <li>Xóa mã cũ trong tệp `Code.gs`, dán đoạn mã bên dưới vào và bấm <strong>💾 Lưu</strong> (Ctrl + S).</li>
                  <li>Bấm nút <strong>▶ Chạy</strong> (Run) hàm `onOpen` để cấp quyền Google, sau đó quay lại Sheet nhấn <strong>F5</strong> để hiển thị menu.</li>
                </ol>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-zinc-700">Mã Google Apps Script:</span>
                  <button
                    onClick={handleCopyScript}
                    className="btn-primary py-1 px-2.5 text-xs inline-flex items-center gap-1.5"
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
                  <pre className="p-3 bg-zinc-900 text-zinc-200 rounded-lg text-[11px] font-mono max-h-60 overflow-y-auto leading-relaxed">
                    {APPS_SCRIPT_CODE}
                  </pre>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowAppsScriptModal(false)}
                  className="btn-secondary"
                >
                  Đóng
                </button>
                <a
                  href={GOOGLE_SHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-1.5"
                >
                  <span>Mở Google Sheet</span>
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
