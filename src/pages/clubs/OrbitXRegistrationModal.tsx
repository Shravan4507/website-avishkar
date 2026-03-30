import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, X, ArrowRight, ShieldCheck, CreditCard, Sparkles, Check } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';
import { initiateEasebuzzCheckout, generateTxnId } from '../../utils/easebuzz';
import './OrbitXRegistrationModal.css';

interface OrbitXRegistrationModalProps {
  onClose: () => void;
}

const OrbitXRegistrationModal: React.FC<OrbitXRegistrationModalProps> = ({ onClose }) => {
  const [user, authLoading] = useAuthState(auth);
  const toast = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [isMoonAddon, setIsMoonAddon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txnId, setTxnId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'details' | 'summary' | 'success'>('details');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userSnap = await getDoc(doc(db, 'user', user.uid));
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, [user]);

  const basePrice = 30;
  const addonPrice = isMoonAddon ? 20 : 0;
  const totalPrice = basePrice + addonPrice;

  const handlePayNow = async () => {
    if (!user || !userData) {
      toast.error("Please login to register.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const generatedTxnId = generateTxnId("ORBX");
      const amount = totalPrice.toFixed(2);
      
      const response = await fetch("https://initiatepayment-rgvkuxdaea-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txnid: generatedTxnId,
          amount,
          productinfo: `OrbitX Solar Observation ${isMoonAddon ? "+ Moon Addon" : ""}`,
          firstname: `${userData.firstName} ${userData.lastName}`,
          email: userData.email || user.email,
          phone: userData.phone || '',
          udf1: userData.college || 'N/A',
          surl: `${window.location.origin}/orbitx-zcoer?status=success`,
          furl: `${window.location.origin}/orbitx-zcoer?status=failure`
        })
      });

      const result = await response.json();

      if (result.success && result.access_key) {
        const merchantKey = import.meta.env.VITE_EASEBUZZ_KEY;
        initiateEasebuzzCheckout(merchantKey, result.access_key, async (ebResponse: any) => {
          if (ebResponse.status === "success") {
            await finalizeRegistration(generatedTxnId);
          } else {
            toast.error("Payment failed. Please try again.");
            setIsSubmitting(false);
          }
        }, 'prod');
      } else {
        throw new Error(result.error || "Payment initiation failed.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
      setIsSubmitting(false);
    }
  };

  const finalizeRegistration = async (paymentTxnId: string) => {
    try {
      const regId = `orbitx_solar_${userData.avrId}`;
      const regRef = doc(db, 'registrations', regId);
      
      await setDoc(regRef, {
        userId: user!.uid,
        userName: `${userData.firstName} ${userData.lastName}`,
        userEmail: userData.email || user!.email,
        userAVR: userData.avrId,
        userCollege: userData.college || '',
        userPhone: userData.phone || '',
        competitionId: 'orbitx_solar',
        competitionHandle: 'OrbitX-Solar',
        eventName: 'Solar Spot Observation',
        category: 'OrbitX Club Event',
        department: 'OrbitX Club',
        amountPaid: totalPrice,
        moonAddon: isMoonAddon,
        transactionId: paymentTxnId,
        paymentStatus: 'paid',
        status: 'confirmed',
        registeredAt: serverTimestamp(),
      });

      setTxnId(paymentTxnId);
      setActiveStep('success');
    } catch (err) {
      console.error("Firestore Error:", err);
      toast.error("Cloud synchronisation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !userData) {
    return (
      <div className="orbitx-modal-overlay">
        <div className="orbitx-modal-container" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
          <p>Retaining user profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orbitx-modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="orbitx-modal-container"
      >
        {isSubmitting && (
          <div className="modal-loading">
            <div className="spinner"></div>
            <p style={{ marginTop: '20px', letterSpacing: '2px' }}>CONTACTING GATEWAY...</p>
          </div>
        )}

        <div className="modal-header">
          <h2>RESERVATION</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          {activeStep === 'details' && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="step-container"
            >
              <div className="modal-section">
                <h3><ShieldCheck size={18} style={{ marginBottom: '-4px', marginRight: '8px' }} /> PROFILE VERIFIED</h3>
                <div className="details-grid">
                  <div className="detail-field">
                    <label>IDENTIFIER</label>
                    <span style={{ color: '#ff8c00', fontWeight: 'bold' }}>{userData.avrId}</span>
                  </div>
                  <div className="detail-field">
                    <label>NAME</label>
                    <span>{userData.firstName} {userData.lastName}</span>
                  </div>
                  <div className="detail-field full">
                    <label>INSTITUTION</label>
                    <span>{userData.college}</span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3><Sparkles size={18} style={{ marginBottom: '-4px', marginRight: '8px' }} /> EVENT OPTIONS</h3>
                <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>
                  Choose your level of engagement with the cosmos.
                </p>
                <div className={`addon-card ${isMoonAddon ? 'active' : ''}`} onClick={() => setIsMoonAddon(!isMoonAddon)}>
                  <div className="addon-info">
                    <span className="addon-name">Moon Observation</span>
                    <span className="addon-desc">High-power lunar photography assistance.</span>
                  </div>
                  <div className="addon-action">
                    <span className="addon-price">+₹20</span>
                    <div className={`minimal-checkbox ${isMoonAddon ? 'checked' : ''}`}>
                      {isMoonAddon && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-section" style={{ marginTop: '30px' }}>
                <div className="summary-card">
                   <div className="summary-row">
                     <span>Solar Spot Admission</span>
                     <span>₹30</span>
                   </div>
                   {isMoonAddon && (
                     <div className="summary-row">
                       <span>Moon Add-on</span>
                       <span>₹20</span>
                     </div>
                   )}
                   <div className="summary-row total">
                     <span>TOTAL DUE</span>
                     <span>₹{totalPrice}</span>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 'success' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="success-content"
            >
              <div className="success-icon">
                <CheckCircle size={48} />
              </div>
              <h3>TRANSACTION SECURED</h3>
              <p>
                Credentials for <strong>{userData.avrId}</strong> have been inscribed. 
                Reference ID: <span style={{ color: '#ff8c00', fontFamily: 'monospace' }}>{txnId}</span>
              </p>
              <button className="dashboard-btn" onClick={() => window.location.href='/user/dashboard'}>
                MY DASHBOARD <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </div>

        {activeStep !== 'success' && (
          <div className="modal-actions">
            <button className="pay-btn" onClick={handlePayNow} disabled={isSubmitting}>
              PAY ₹{totalPrice} & SECURE SPOT <CreditCard size={20} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default OrbitXRegistrationModal;
