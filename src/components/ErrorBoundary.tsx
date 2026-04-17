import React from 'react';
import './ErrorBoundary.css';
import { reportError } from '../utils/errorReport';

interface Props {
  children: React.ReactNode;
  variant?: 'full' | 'embedded';
  name?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Self-Healing ErrorBoundary
 * Now supports "Embedded" mode so minor widgets can crash/glitch 
 * without taking down the entire page.
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
    reportError(error, { 
      component: this.props.name || 'UnknownComponent',
      severity: this.props.variant === 'embedded' ? 'medium' : 'high',
      stack: info.componentStack
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.variant === 'full') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      const { variant = 'full', name = 'Sub-System' } = this.props;

      // MISSION CRITICAL: Embedded Glitch UI (Self-Healing)
      if (variant === 'embedded') {
        return (
          <div className="glitch-alert glitch-shake" data-text={`FAULT IN ${name.toUpperCase()}`}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>// {name.toUpperCase()} STABILITY LOSS</h3>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Automatic containment active. Click to attempt re-init.</p>
              <button 
                onClick={this.handleReset}
                style={{ 
                  marginTop: '1rem', 
                  background: 'transparent', 
                  border: '1px solid #ff0055',
                  color: '#ff0055',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontSize: '0.7rem'
                }}
              >
                RE-INITIALIZE
              </button>
            </div>
          </div>
        );
      }

      // FULL PAGE GLITCH UI
      const isConfigError = this.state.errorMessage.includes("FIREBASE_CONFIG_ERROR");

      return (
        <div className="error-boundary">
          <div className="eb-content glitch-alert glitch-critical" data-text="SYSTEM CRITICAL FAILURE">
            <div className="eb-icon">{isConfigError ? "⚙️" : "⚡"}</div>
            <h2 className="eb-title" style={{ color: '#00ffff' }}>
              {isConfigError ? "CONFIG_MISMATCH" : "CORE_DUMP_DETECTED"}
            </h2>
            <p className="eb-subtitle">
              {isConfigError 
                ? "ENVIRONMENT KEYS MISSING. CHECK VERCEL DASHBOARD."
                : "A CRITICAL SUBSYSTEM HAS CRASHED. THE PORTAL IS ATTEMPTING TO STABILIZE."}
            </p>
            <div className="eb-actions" style={{ marginTop: '2rem' }}>
              <button className="eb-btn eb-btn--primary" onClick={this.handleReset} style={{ background: '#00ffff', color: '#000' }}>
                RESET_PORTAL
              </button>
              <button
                className="eb-btn eb-btn--ghost"
                onClick={() => window.location.reload()}
              >
                RELOAD_STREAM
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
