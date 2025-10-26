import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Optionally report to monitoring here
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #111827 100%)',
          color: '#e5e7eb',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
        }}>
          <div style={{maxWidth: 700}}>
            <div style={{fontSize: 48, marginBottom: 8}}>⚠️</div>
            <h2 style={{fontSize: 24, marginBottom: 8}}>Something went wrong</h2>
            <p style={{opacity: 0.8, marginBottom: 16}}>
              The dashboard hit an unexpected error while rendering.
            </p>
            <div style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace',
              background: '#0b1220',
              border: '1px solid #1f2937',
              padding: '12px 14px',
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
              color: '#fca5a5',
              marginBottom: 16
            }}>
              {this.state.error?.message}
            </div>
            <div style={{fontSize: 14, opacity: 0.8}}>
              Try a hard refresh (Ctrl+F5). If it persists, open the browser console (F12) and share the error details.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
