import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, School, CreditCard, ChevronRight, Sparkles, ShieldCheck } from 'lucide-react';
import PaymentCheckout from '../../components/payment/PaymentCheckout';
import type { CheckoutStatus } from '../../hooks/usePaymentCheckout';
import './CheckoutSimulator.css';

type TestStage = 'card' | 'details' | 'payment';

const CheckoutSimulator: React.FC = () => {
  const [stage, setStage] = useState<TestStage>('card');
  const [status, setStatus] = useState<CheckoutStatus>('idle');
  const [paymentMode, setPaymentMode] = useState<'qr' | 'collect'>('qr');
  const [timeRemaining] = useState(300000); // 5 mins
  
  // Participant Data
  const [formData] = useState({
    name: 'Shravan Kumar',
    email: 'shravan@avishkar.in',
    phone: '+91 9876543210',
    college: 'ZCOER, Pune',
    avrId: 'AVR-782910'
  });

  const eventData = {
    name: 'Web Crafting (Web Design)',
    amount: 199,
    description: 'Showcase your creative web design skills in this premium competition.'
  };

  const fadeVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="test-page-container">
      <AnimatePresence mode="wait">
        
        {/* --- STAGE 1: EVENT CARD --- */}
        {stage === 'card' && (
          <motion.div 
            key="card"
            className="test-event-card"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="test-card-top">
              <div className="test-tag"><Sparkles size={14} /> Competition</div>
              <h2>{eventData.name}</h2>
              <p>{eventData.description}</p>
            </div>
            <div className="test-card-bottom">
              <div className="test-price">
                <span>Entry Fee</span>
                <h3>₹{eventData.amount}</h3>
              </div>
              <button className="test-prime-btn" onClick={() => setStage('details')}>
                Register Now <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* --- STAGE 2: REGISTRATION DETAILS --- */}
        {stage === 'details' && (
          <motion.div 
            key="details"
            className="test-details-container"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="test-details-header">
              <h2>Registration details</h2>
              <p>Verify your information before proceeding</p>
            </div>
            
            <div className="test-form-grid">
              <div className="test-input-field">
                <label><User size={14} /> Full Name</label>
                <input type="text" value={formData.name} readOnly />
              </div>
              <div className="test-input-field">
                <label><Mail size={14} /> Email Address</label>
                <input type="email" value={formData.email} readOnly />
              </div>
              <div className="test-input-field">
                <label><Phone size={14} /> Phone Number</label>
                <input type="text" value={formData.phone} readOnly />
              </div>
              <div className="test-input-field">
                <label><School size={14} /> College / Institution</label>
                <input type="text" value={formData.college} readOnly />
              </div>
            </div>

            <div className="test-summary">
              <div className="test-summary-row">
                <span>Registration ID</span>
                <strong>{formData.avrId}</strong>
              </div>
              <div className="test-summary-row primary">
                <span>Total Amount</span>
                <strong>₹{eventData.amount}</strong>
              </div>
            </div>

            <button className="test-prime-btn full" onClick={() => {
              setStage('payment');
              setStatus('idle');
            }}>
              Continue to Payment <CreditCard size={18} />
            </button>
            <button className="test-back-link" onClick={() => setStage('card')}>
              Back to event details
            </button>
          </motion.div>
        )}

        {/* --- STAGE 3: PAYMENT OVERLAY --- */}
        {stage === 'payment' && (
          <div className="test-payment-active">
            <div className="test-payment-status-debug">
              <p>Simulator Status: <strong>{status}</strong></p>
              <div className="test-status-toggles">
                <button onClick={() => setStatus('success')}>Simulate Success</button>
                <button onClick={() => setStatus('failed')}>Simulate Failure</button>
              </div>
            </div>
            
            <PaymentCheckout 
              isVisible={true}
              status={status}
              paymentMode={paymentMode}
              qrLink="upi://pay?pa=test@ybl&pn=Avishkar26"
              timeRemaining={timeRemaining}
              error="Payment could not be verified. Please try again."
              registrationId={formData.avrId}
              orderDetails={{
                eventName: eventData.name,
                amount: eventData.amount,
                participantName: formData.name,
                avrId: formData.avrId
              }}
              onChangeModeRequest={(upiId) => {
                alert(`Simulated: Collect request for ${upiId}`);
                setPaymentMode('collect');
              }}
              onCancel={() => setStage('details')}
              onRetry={() => setStatus('idle')}
              onSuccess={() => {
                alert('Test Complete! Redirecting to user dashboard...');
                setStage('card');
              }}
            />
          </div>
        )}
      </AnimatePresence>

      <div className="test-page-footer">
        <ShieldCheck size={16} /> Encrypted & Secure registration Test
      </div>
    </div>
  );
};

export default CheckoutSimulator;
