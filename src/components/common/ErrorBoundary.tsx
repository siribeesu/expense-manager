import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, RefreshCw } from 'lucide-react';
import { clearLocalStorage } from '../../lib/storage';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'root' | 'view' | 'widget';
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Thriftly Error Boundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    clearLocalStorage();
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const { level = 'root' } = this.props;

    // 1. View-level scoped error boundary
    if (level === 'view') {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="w-full p-6 sm:p-8 rounded-2xl bg-[#131B2F] border border-red-500/30 text-center space-y-4 my-6 shadow-xl"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white tracking-tight">View Temporarily Unavailable</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              This section encountered a display glitch. Your ledger data and balance remain fully intact.
            </p>
          </div>
          {this.state.error && (
            <div className="max-w-md mx-auto p-2.5 rounded-lg bg-[#0E1526] border border-slate-800 text-left overflow-x-auto text-[11px] font-mono text-red-300">
              {this.state.error.message}
            </div>
          )}
          <div className="pt-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-[#C8FF55] text-[#0B1020] text-xs font-bold hover:bg-[#bbf043] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry View
            </button>
          </div>
        </div>
      );
    }

    // 2. Widget-level scoped error boundary
    if (level === 'widget') {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-xs text-red-300 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Widget display error: {this.state.error?.message || 'Calculation error'}</span>
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium text-[11px]"
          >
            Retry
          </button>
        </div>
      );
    }

    // 3. Root-level full application error boundary
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="min-h-screen bg-[#0B1020] text-[#F8FAFC] flex items-center justify-center p-6"
      >
        <div className="max-w-md w-full bg-[#131B2F] border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Something went unexpected</h2>
            <p className="text-xs text-slate-400">
              Thriftly encountered an application error. Your core ledger records are safe in local storage.
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 rounded-xl bg-[#0E1526] border border-slate-800 text-left overflow-x-auto text-[11px] font-mono text-red-300">
              {this.state.error.message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#C8FF55] text-[#0B1020] text-xs font-bold hover:bg-[#bbf043] transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" /> Reload App
            </button>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear & Reset
            </button>
          </div>
        </div>
      </div>
    );
  }
}
