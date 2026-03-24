import React from 'react';
import './ErrorBoundary.css';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Wraps any subtree and catches runtime errors before they crash the whole app.
 * Usage: <ErrorBoundary><SomeComponent /></ErrorBoundary>
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary caught an error]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="eb-content">
            <div className="eb-icon">⚡</div>
            <h2 className="eb-title">Something went wrong</h2>
            <p className="eb-subtitle">
              An unexpected error crashed this section. Don't worry — your data is safe.
            </p>
            {this.state.errorMessage && (
              <pre className="eb-details">{this.state.errorMessage}</pre>
            )}
            <div className="eb-actions">
              <button className="eb-btn eb-btn--primary" onClick={this.handleReset}>
                ← Return Home
              </button>
              <button
                className="eb-btn eb-btn--ghost"
                onClick={() => window.location.reload()}
              >
                Reload Page
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
