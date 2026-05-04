import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { name = 'root' } = this.props;
    console.error(`[ErrorBoundary:${name}]`, error, errorInfo.componentStack);

    // Detect ChunkLoadError and auto-reload
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      const reloadFlag = `chunk_reload_${name}`;
      const hasReloaded = sessionStorage.getItem(reloadFlag);

      if (!hasReloaded) {
        sessionStorage.setItem(reloadFlag, 'true');
        console.log(`[ErrorBoundary:${name}] ChunkLoadError detected. Auto-reloading...`);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback, name = 'root' } = this.props;
      const { error } = this.state;

      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
          <Card className="w-full max-w-md shadow-lg border-red-200">
            <CardContent className="pt-6 space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              {/* Error message */}
              <div className="space-y-2 text-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Đã xảy ra lỗi không mong muốn
                </h1>
                <p className="text-sm text-gray-600">
                  {error?.message || 'Vui lòng thử lại hoặc quay về trang chủ.'}
                </p>
              </div>

              {/* Error details (only in dev) */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="bg-slate-100 rounded p-3 text-xs text-gray-700 max-h-40 overflow-auto">
                  <summary className="font-semibold cursor-pointer mb-2">
                    Chi tiết lỗi
                  </summary>
                  <pre className="whitespace-pre-wrap break-words">
                    {error.stack || error.toString()}
                  </pre>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={this.handleReload}
                  variant="default"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tải lại trang
                </Button>
                <Button
                  onClick={this.handleHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Quay về trang chủ
                </Button>
              </div>

              {/* Additional info */}
              {name !== 'root' && (
                <p className="text-xs text-gray-500 text-center">
                  (Lỗi trong: {name})
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
