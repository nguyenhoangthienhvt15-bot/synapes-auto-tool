import React from 'react';

interface StudioErrorBoundaryProps {
  children: React.ReactNode;
  resetKey?: string;
}

interface StudioErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Isolates view/chunk load errors inside the main workspace so navigation
 * remains responsive and stale-bundle errors after a server deploy offer an
 * instant one-click hard reload.
 */
export class StudioErrorBoundary extends React.Component<
  StudioErrorBoundaryProps,
  StudioErrorBoundaryState
> {
  constructor(props: StudioErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): StudioErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Không thể tải mô-đun giao diện.',
    };
  }

  componentDidUpdate(prevProps: StudioErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  private handleReload = () => {
    try {
      if ('caches' in window) {
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
      }
    } catch {
      // Ignore cache clear failure
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 sm:p-10 text-center space-y-4 rounded-xl border border-zinc-200 bg-white max-w-lg mx-auto my-8 shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[11px] font-mono text-amber-800">
            CẬP NHẬT PHIÊN BẢN / KẾT NỐI MÔ-ĐUN
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Phiên làm việc cần đồng bộ lại tài nguyên mới nhất
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Hệ thống vừa phát hiện bản cập nhật mới hoặc gián đoạn mạng khi nạp mô-đun ({this.state.errorMessage}). Nhấn nút bên dưới để tải lại phiên bản mới nhất ngay lập tức.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 cursor-pointer"
            >
              Thử Lại
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="btn-primary cursor-pointer"
            >
              Tải Lại Bản Mới Nhất
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

