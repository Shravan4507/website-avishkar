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
      const isConfigError = this.state.errorMessage.includes("FIREBASE_CONFIG_ERROR");

      return (
        <div className="error-boundary">
          <div className="eb-content">
            <div className="eb-icon">{isConfigError ? "⚙️" : "⚡"}</div>
            <h2 className="eb-title">
              {isConfigError ? "Configuration Required" : "Something went wrong"}
            </h2>
            <p className="eb-subtitle">
              {isConfigError 
                ? "The application is missing essential environment variables. This usually happens on Vercel when keys are not added to the Dashboard."
                : "An unexpected error crashed this section. Don't worry — your data is safe."}
            </p>
            {this.state.errorMessage && (
              <div className="eb-details-container">
                <span className="eb-details-label">Error Details:</span>
                <pre className="eb-details">{this.state.errorMessage}</pre>
              </div>
            )}
            <div className="eb-actions">
              {isConfigError ? (
                <a 
                  href="https://vercel.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="eb-btn eb-btn--primary"
                >
                  Open Vercel Dashboard
                </a>
              ) : (
                <button className="eb-btn eb-btn--primary" onClick={this.handleReset}>
                  ← Return Home
                </button>
              )}
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
