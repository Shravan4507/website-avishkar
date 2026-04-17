import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Loader2, CheckCircle, 
  XCircle, RefreshCw, ArrowRight
} from 'lucide-react';
import type { CheckoutStatus } from '../../hooks/usePaymentCheckout';
import './PaymentCheckout.css';

interface PaymentCheckoutProps {
  isVisible: boolean;
  status: CheckoutStatus;
  qrLink: string | null;
  timeRemaining: number;
  error: string | null;
  registrationId: string | null;
  orderDetails: {
    eventName: string;
    amount: number;
    participantName: string;
    avrId: string;
  };
  paymentMode?: 'qr' | 'collect';
  onChangeModeRequest?: (upiId?: string) => void;
  onCancel: () => void;
  onRetry: () => void;
  onSuccess: () => void;
}

const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  isVisible,
  status,
  error,
  registrationId,
  orderDetails,
  onCancel,
  onRetry,
  onSuccess
}) => {
  const [viewportSettings, setViewportSettings] = useState({
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
    viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 400,
    padding: '16px' // default minimum
  });

  useEffect(() => {
    const handleResize = () => {
      const vWidth = window.innerWidth;
      const calculatedPadding = vWidth < 480 ? '20px' : '40px';
      setViewportSettings({
        viewportHeight: window.innerHeight,
        viewportWidth: vWidth,
        padding: calculatedPadding
      });
    };
    
    // Initial calculation
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock background scrolling when checkout overlay is active
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  if (!isVisible) return null;

  // Content Variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { type: 'spring' as const, damping: 25, stiffness: 300 } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20, 
      transition: { duration: 0.2 } 
    }
  };

  const fadeVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const overlayContent = (
    <AnimatePresence>
      {isVisible && (
        <div className="co-overlay" style={{ padding: viewportSettings.padding, zIndex: 999999 }}>
          <motion.div 
            className="co-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          <div className="co-wrapper" style={{ maxHeight: viewportSettings.viewportHeight - 40 }}>
            <motion.div 
              className="co-card"
              style={{ overflowY: 'auto', maxHeight: viewportSettings.viewportHeight - 60 }}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatePresence mode="wait">
                {/* --- SUCCESS STATE --- */}
                {status === 'success' && (
                  <motion.div key="success" className="co-state-view co-success" variants={fadeVariants} initial="hidden" animate="visible" exit="exit">
                    <div className="co-icon-hero success">
                      <div className="co-pulse-ring" />
                      <CheckCircle size={56} strokeWidth={1.5} />
                    </div>
                    <div className="co-text-center">
                      <h2>Payment Successful</h2>
                      <p>Your registration is confirmed.</p>
                    </div>
                    
                    <div className="co-receipt-box">
                      {registrationId && (
                        <div className="co-receipt-row">
                          <span>Registration ID</span>
                          <span className="co-highlight">{registrationId}</span>
                        </div>
                      )}
                      <div className="co-receipt-row">
                        <span>Event</span>
                        <span className="co-highlight">{orderDetails.eventName}</span>
                      </div>
                      <div className="co-receipt-row">
                        <span>Amount Paid</span>
                        <span className="co-highlight co-amount">₹{orderDetails.amount}</span>
                      </div>
                    </div>
                    
                    <button className="co-btn co-btn-primary" onClick={onSuccess}>
                      Continue to Dashboard <ArrowRight size={18} />
                    </button>
                  </motion.div>
                )}

                {/* --- ERROR / FAILED STATE --- */}
                {(status === 'failed' || status === 'error') && (
                  <motion.div key="error" className="co-state-view co-error" variants={fadeVariants} initial="hidden" animate="visible" exit="exit">
                    <div className="co-icon-hero error">
                      <XCircle size={56} strokeWidth={1.5} />
                    </div>
                    <div className="co-text-center">
                      <h2>Payment Failed</h2>
                      <p className="co-error-text">{error || 'The payment could not be processed.'}</p>
                    </div>
                    <div className="co-actions-grid">
                      <button className="co-btn co-btn-primary" onClick={onRetry}>
                        <RefreshCw size={18} /> Try Again
                      </button>
                      <button className="co-btn co-btn-ghost" onClick={onCancel}>
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* --- EXPIRED STATE --- */}
                {/* Kept here for compatibility if we ever reinstate polling */}
                {/* status === 'expired' */}

                {/* --- ACTIVE PAYMENT STATE (Creating / Redirecting) --- */}
                {(status === 'creating' || status === 'redirecting') && (
                  <motion.div key="active" className="co-state-view co-active" variants={fadeVariants} initial="hidden" animate="visible" exit="exit">
                    
                    {/* Brand Header */}
                    <div className="co-brand-header">
                      <div className="co-logo-container">
                        <img 
                          src={`${import.meta.env.BASE_URL}assets/logos/avishkar-white.webp`} 
                          alt="Avishkar '26" 
                          className="co-brand-logo" 
                        />
                        <p className="co-sub-tagline">Secure Payment Portal</p>
                      </div>
                      <div className="co-brand-divider" />
                    </div>

                    {/* Interaction Area */}
                    <div className="co-interaction-box" style={{ padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      {status === 'creating' ? (
                        <div className="co-loading-view">
                          <Loader2 size={40} className="co-spinner mx-auto mb-4" />
                          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', textAlign: 'center' }}>
                            Generating secure payment request...
                          </p>
                        </div>
                      ) : (
                        <div className="co-loading-view">
                          <div className="co-pulse-ring mx-auto mb-4" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 255, 170, 0.1)', borderRadius: '50%' }}>
                            <ShieldCheck size={32} color="#00ffaa" />
                          </div>
                          <h3 style={{ marginBottom: '8px' }}>Redirecting...</h3>
                          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', textAlign: 'center' }}>
                            Taking you to the secure Easebuzz gateway. Please do not refresh or close this window.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Optimized Footer Layout */}
                    <div className="co-checkout-footer">
                      
                      {/* Amount Summary Bar */}
                      <div className="co-amount-bar">
                        <div className="co-amount-info">
                          <span className="co-label">Total Amount</span>
                          <span className="co-value">₹{orderDetails.amount}</span>
                        </div>
                        <div className="co-details-info">
                          {orderDetails.eventName} • {orderDetails.avrId}
                        </div>
                      </div>

                      {/* Controls Bar */}
                      <div className="co-controls-bar">
                        <button className="co-cancel-btn" onClick={status === 'redirecting' ? undefined : onCancel} disabled={status === 'redirecting'} style={{ opacity: status === 'redirecting' ? 0.5 : 1 }}>
                          Cancel transaction
                        </button>
                        <div className="co-security-tag">
                          <ShieldCheck size={14} />
                          Secure & Encrypted
                        </div>
                      </div>

                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!isVisible && typeof window === 'undefined') return null;
  return createPortal(overlayContent, document.body);
};

export default PaymentCheckout;
