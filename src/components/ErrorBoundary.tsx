import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Copy } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const text = `Error: ${error?.message}\nStack: ${error?.stack}\nComponent: ${errorInfo?.componentStack}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[300px] p-6">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              页面渲染错误
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              组件在渲染时发生错误，这可能是由于数据格式不匹配或未处理的异常。
            </p>
            {this.state.error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
                <code className="text-xs text-red-700 dark:text-red-400 font-mono break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重试
              </button>
              <button
                onClick={this.handleCopyError}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                复制错误
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
