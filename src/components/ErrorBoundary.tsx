// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can log the error to an error reporting service (like Sentry) here
    console.error("Uncaught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh', 
            padding: '20px', 
            textAlign: 'center', 
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Something went wrong.</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '400px' }}>
            We encountered an unexpected error. Our team has been notified.
          </p>
          <div style={{ 
              padding: '10px', 
              background: 'rgba(255,0,0,0.1)', 
              color: '#E57373', 
              borderRadius: '6px',
              fontSize: '12px',
              marginBottom: '20px',
              fontFamily: 'monospace'
          }}>
             {this.state.error?.toString()}
          </div>
          <button 
            onClick={this.handleRetry} 
            className="btn-primary"
            style={{ padding: '10px 25px' }}
          >
            Refresh App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
