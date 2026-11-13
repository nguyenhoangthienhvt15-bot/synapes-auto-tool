import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, RotateCcw, Check, PenTool, AlertCircle } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  initialSignature?: string;
  signerName?: string;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSignature = '',
  signerName = 'Khách hàng',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Khởi tạo Canvas và nạp chữ ký cũ nếu có
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 2;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#0f172a'; // Xanh đen đậm trang trọng

    ctx.clearRect(0, 0, rect.width, rect.height);

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = initialSignature;
    } else {
      setHasDrawn(false);
    }
  }, [initialSignature]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      // Đợi DOM render xong để lấy kích thước chính xác
      const timer = setTimeout(() => {
        initCanvas();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initCanvas]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    lastPointRef.current = coords;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentCoords = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentCoords.x, currentCoords.y);
    ctx.stroke();

    lastPointRef.current = currentCoords;
    setHasDrawn(true);
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    setErrorMsg(null);
  };

  const handleSave = () => {
    if (!hasDrawn) {
      setErrorMsg('Vui lòng vẽ chữ ký tay của bạn trước khi bấm Hoàn tất.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Chuẩn hóa kích thước ảnh chữ ký (maxWidth <= 400px) để PNG nhẹ (~2-6 KB),
    // tương thích tốt với giới hạn lưu trữ ScriptProperties (9 KB) của Google Apps Script
    const maxWidth = 400;
    const scale = canvas.width > maxWidth ? maxWidth / canvas.width : 1;
    const targetWidth = Math.max(1, Math.round(canvas.width * scale));
    const targetHeight = Math.max(1, Math.round(canvas.height * scale));

    const compactCanvas = document.createElement('canvas');
    compactCanvas.width = targetWidth;
    compactCanvas.height = targetHeight;
    const compactCtx = compactCanvas.getContext('2d');
    if (compactCtx) {
      compactCtx.imageSmoothingEnabled = true;
      compactCtx.imageSmoothingQuality = 'high';
      compactCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
      onSave(compactCanvas.toDataURL('image/png'));
    } else {
      onSave(canvas.toDataURL('image/png'));
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <PenTool className="w-4 h-4 text-zinc-100" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950">
                Ký Tên Xác Nhận Hợp Đồng (Bên B)
              </h3>
              <p className="text-[11px] text-zinc-500">
                Người ký: <b className="text-zinc-800">{signerName}</b>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung vẽ chữ ký */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-zinc-600 leading-relaxed">
            Vui lòng sử dụng <b>chuột</b> (trên máy tính) hoặc <b>ngón tay / bút cảm ứng</b> (trên điện thoại, máy tính bảng) để vẽ chữ ký tay của bạn vào khung bên dưới.
          </p>

          {/* Khung Canvas */}
          <div className="relative w-full h-48 bg-white border-2 border-dashed border-zinc-300 rounded-xl overflow-hidden shadow-inner flex items-center justify-center select-none">
            {/* Đường chỉ dẫn vị trí ký */}
            <div className="absolute inset-x-8 bottom-10 pointer-events-none flex items-center gap-2 text-zinc-300 select-none">
              <span className="font-mono text-sm font-bold text-zinc-400">✕</span>
              <div className="flex-1 border-b border-dashed border-zinc-200" />
              <span className="text-[10px] text-zinc-400 font-sans tracking-wide">
                Đường kẻ ký tên
              </span>
            </div>

            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              onTouchCancel={stopDrawing}
            />

            {!hasDrawn && !isDrawing && (
              <div className="pointer-events-none text-center select-none text-zinc-400 text-xs">
                <PenTool className="w-5 h-5 mx-auto mb-1 opacity-40 text-zinc-500" />
                <span>Chạm hoặc kéo chuột để vẽ chữ ký của bạn tại đây</span>
              </div>
            )}
          </div>

          {/* Thông báo lỗi nếu chưa ký */}
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Hướng dẫn hiển thị */}
          <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-[11px] text-zinc-500 leading-relaxed">
            💡 <b>Ghi chú:</b> Sau khi bấm <b>Hoàn tất</b>, ảnh chữ ký sẽ được lưu tự động trên toàn bộ các bản hợp đồng điện tử và biên bản bàn giao liên quan của bạn (hiển thị ngay phía trên khung xác nhận điện tử màu xanh).
          </div>
        </div>

        {/* Footer hành động */}
        <div className="px-5 py-3.5 border-t border-zinc-100 bg-zinc-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 text-zinc-700 hover:text-zinc-950 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
            <span>Xóa ký lại</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-1.5 px-3 text-xs text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="py-1.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hoàn tất</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

