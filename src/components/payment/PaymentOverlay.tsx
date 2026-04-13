import React, { useState, useEffect } from 'react';
import { Shield, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import './PaymentOverlay.css';

interface PaymentOverlayProps {
  isVisible: boolean;
  stage: 'preparing' | 'connecting' | 'redirecting';
}

const STAGES = [
  { key: 'preparing', label: 'Preparing your transaction...', icon: Shield },
  { key: 'connecting', label: 'Connecting to payment gateway...', icon: Loader2 },
  { key: 'redirecting', label: 'Redirecting to secure checkout...', icon: ExternalLink },
];

const PaymentOverlay: React.FC<PaymentOverlayProps> = ({ isVisible, stage }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const currentIndex = STAGES.findIndex(s => s.key === stage);

  return (
    <div className="payment-overlay">
      <div className="payment-overlay-backdrop" />
      <div className="payment-overlay-content">
        <div className="payment-overlay-card">
          {/* Animated lock icon */}
          <div className="payment-lock-icon">
            <Shield size={32} strokeWidth={1.5} />
            <div className="payment-lock-pulse" />
          </div>

          <h2 className="payment-overlay-title">Processing Payment</h2>

          {/* Step indicators */}
          <div className="payment-steps">
            {STAGES.map((s, i) => {
              const isActive = i === currentIndex;
              const isDone = i < currentIndex;
              const Icon = s.icon;

              return (
                <div
                  key={s.key}
                  className={`payment-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                >
                  <div className="payment-step-icon">
                    {isActive ? (
                      <Loader2 size={16} className="payment-spinner" />
                    ) : isDone ? (
                      <div className="payment-check">✓</div>
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  <span className="payment-step-label">
                    {isActive ? `${s.label}${dots}` : s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Warning */}
          <div className="payment-warning">
            <AlertTriangle size={16} />
            <span>Do not close or refresh this page</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOverlay;
