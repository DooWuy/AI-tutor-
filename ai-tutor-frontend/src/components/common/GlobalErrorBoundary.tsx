import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled Application Error caught by GlobalErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full bg-surface-container-lowest flex items-center justify-center p-4 sm:p-6 text-on-surface">
          <div className="w-full max-w-lg bg-surface-container-low/60 border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Top Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-6 mx-auto border border-red-500/20 shadow-xs">
              <AlertOctagon size={32} className="stroke-[2.2]" />
            </div>

            {/* Titles */}
            <div className="text-center space-y-2 mb-6">
              <span className="text-[11px] font-bold tracking-widest text-red-600 dark:text-red-400 uppercase">
                SYSTEM EXCEPTION HANDLER
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                Đã xảy ra sự cố ngoài ý muốn
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                Rất tiếc vì sự gián đoạn này. Dữ liệu tài khoản của bạn được bảo toàn an toàn. Vui lòng thử tải lại trang hoặc quay lại bảng điều khiển.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2 mb-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition transform active:scale-95 cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>Tải lại trang</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95 cursor-pointer"
              >
                <span>Thử phục hồi</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95 cursor-pointer"
              >
                <Home size={16} />
                <span>Trang chủ</span>
              </button>
            </div>

            {/* Error Details Accordion (for debugging) */}
            {this.state.error && (
              <div className="border-t border-outline-variant/40 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center justify-between w-full text-xs font-semibold text-on-surface-variant/80 hover:text-on-surface py-1 transition cursor-pointer"
                >
                  <span>Chi tiết lỗi kỹ thuật (Debug)</span>
                  {this.state.showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2.5 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-[11px] font-mono text-red-600 dark:text-red-400 overflow-x-auto max-h-48 leading-relaxed">
                    <p className="font-bold mb-1">{this.state.error.name}: {this.state.error.message}</p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-on-surface-variant text-[10px] whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
