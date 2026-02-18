import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-pink-600/20 to-orange-600/20 rounded-3xl blur-xl animate-pulse" />
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Something went wrong
                </h3>
                <p className="text-slate-300 mb-6">
                  There was an error loading the nutrition interface. Please try refreshing the page.
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-semibold transition-all duration-300"
                >
                  Refresh Page
                </button>
                {this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="text-slate-400 cursor-pointer">Error Details</summary>
                    <pre className="text-xs text-slate-500 mt-2 p-2 bg-slate-900/50 rounded">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}















