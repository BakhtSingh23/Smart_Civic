import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || 'An unexpected error occurred.';
      const stack = this.state.error?.stack;
      return this.props.fallback || (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-rose-600">We could not load this section. Please refresh or try again later.</p>
          <div className="mt-4 rounded-lg bg-white p-4 text-left text-xs text-rose-700">
            <p className="font-semibold">Error:</p>
            <p>{message}</p>
            {stack && (
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] text-rose-500">{stack}</pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
