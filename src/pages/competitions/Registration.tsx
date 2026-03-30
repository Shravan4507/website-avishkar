import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';
import { COMPETITIONS_DATA } from '../../data/competitions';
import type { Competition } from '../../data/competitions';
import { Trophy, CheckCircle, ArrowRight, ShieldCheck, AlertTriangle, CreditCard, Moon } from 'lucide-react';
import { useRegistrationGuard } from '../../hooks/useRegistrationGuard';
import { initiateEasebuzzCheckout, generateTxnId } from '../../utils/easebuzz';
import './Registration.css';


const Registration: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [user, authLoading] = useAuthState(auth);
  const navigate = useNavigate();
  const toast = useToast();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [accountabilityAccepted, setAccountabilityAccepted] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [moonObservation, setMoonObservation] = useState(false);

  const { isRegistered, eventName: registeredEventName } = useRegistrationGuard();

  const isSubmittingRef = useRef(false);


  useEffect(() => {
    const initRegistration = async () => {
      if (authLoading) return;
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      if (!slug) {
        setIsLoading(false);
        return;
      }

      try {
        // 1. Fetch User Profile
        const userSnap = await getDoc(doc(db, 'user', user.uid));
        if (!userSnap.exists()) {
          toast.error("Profile incomplete. Please complete signup.");
          navigate('/signup');
          return;
        }
        const uData = userSnap.data();
        if (!uData.avrId) {
          navigate('/signup');
          return;
        }
        setUserData(uData);

        // 2. Resolve Competition (Hardcoded vs Firestore)
        // Check hardcoded first
        let foundComp = COMPETITIONS_DATA.find(
          c => c.slug === slug || c.title === slug
        );

        // If not hardcoded, check Firestore
        if (!foundComp) {
          const compSnap = await getDoc(doc(db, 'competitions', slug));
          if (compSnap.exists()) {
            const data = compSnap.data() as any;
            foundComp = {
              ...data,
              id: data.id || compSnap.id, // Fallback to doc ID if field is missing
              slug: data.slug || slug,
              department: data.department || 'General' // Fallback for department
            } as Competition;
          }
        }

        if (foundComp) {
          setCompetition(foundComp);
          
          // 3. Check if already registered using deterministic doc ID
          const regId = `${foundComp.id}_${uData.avrId}`;
          const regSnap = await getDoc(doc(db, 'registrations', regId));
          if (regSnap.exists()) {
            setAlreadyRegistered(true);
          } else if (isRegistered && registeredEventName !== foundComp.title) {
            toast.error(`Access Denied: Already registered for ${registeredEventName}`);
            navigate('/user/dashboard', { replace: true });
            return;
          }
        }


      } catch (err) {
        console.error("Registration Init Error:", err);
        toast.error("Failed to load competition details.");
      } finally {
        setIsLoading(false);
      }
    };

    initRegistration();
  }, [user, authLoading, slug, navigate]);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  /** Write registration to Firestore */
  const submitRegistration = async (paymentTxnId?: string) => {
    const regId = `${competition!.id}_${userData.avrId}`;
    const regRef = doc(db, 'registrations', regId);

    // Double check using deterministic ID
    const existingSnap = await getDoc(regRef);
    if (existingSnap.exists()) {
      setAlreadyRegistered(true);
      setIsSuccess(true);
      return;
    }

    const userAge = calculateAge(userData.dob);
    const baseFee = competition!.entryFee || 0;
    const addOnFee = (competition!.slug === 'orbitx_solar' && moonObservation) ? 20 : 0;
    const fee = baseFee + addOnFee;

    await setDoc(regRef, {
      // User Info
      userId: user!.uid,
      userName: `${userData.firstName} ${userData.lastName}`,
      userEmail: userData.email || user!.email,
      userAVR: userData.avrId,
      allAvrIds: [userData.avrId],
      userPhone: userData.phone || '',
      userCollege: userData.college || '',
      userMajor: userData.major || '',
      userAge: userAge,
      userSex: userData.sex || '',
      // Competition Info
      competitionId: competition!.id,
      eventName: competition!.title,
      competitionHandle: competition!.handle || '',
      category: competition!.subtitle || 'General Event',
      department: competition!.department,
      isFlagship: competition!.isFlagship || false,
      // Payment
      paymentStatus: fee > 0 ? 'paid' : 'free',
      amountPaid: fee,
      moonObservation: moonObservation,
      transactionId: paymentTxnId || null,
      // Metadata
      status: 'confirmed',
      registeredAt: serverTimestamp(),
      isAttended: false
    });

    if (paymentTxnId) setTransactionId(paymentTxnId);
    setAlreadyRegistered(true);
    setIsSuccess(true);
  };

  /** Handle paid registration via Easebuzz */
  const handlePaidRegistration = async () => {
    if (!competition || !userData || !user) return;
    setIsSubmitting(true);
    isSubmittingRef.current = true;

    try {
      const txnid = generateTxnId(competition.id.toUpperCase().replace(/[^A-Z0-9]/g, ''));
      const response = await fetch("https://initiatepayment-rgvkuxdaea-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txnid,
          amount: ((competition.entryFee || 0) + (competition.slug === 'orbitx_solar' && moonObservation ? 20 : 0)).toFixed(2),
          productinfo: `${competition.title}${moonObservation ? ' + Moon Observation' : ''} Registration`,
          firstname: `${userData.firstName} ${userData.lastName}`,
          email: userData.email || user.email,
          phone: userData.phone || '',
          udf1: userData.college || '',
          surl: `${window.location.origin}/user/dashboard?status=success`,
          furl: `${window.location.origin}/competitions?status=failure`
        })
      });

      const result = await response.json();

      if (result.success && result.access_key) {
        const merchantKey = import.meta.env.VITE_EASEBUZZ_KEY;
        initiateEasebuzzCheckout(merchantKey, result.access_key, async (ebResponse: any) => {
          if (ebResponse.status === "success") {
            await submitRegistration(txnid);
          } else {
            toast.error("Payment was not successful. Please try again.");
          }
        }, 'prod');
      } else {
        throw new Error(result.error || "Payment initiation failed.");
      }
    } catch (err: any) {
      console.error("Payment Error:", err);
      toast.error("Payment system error. Please try again.");
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  /** Main registration handler — routes to paid or free flow */
  const handleRegister = async () => {
    if (!competition || !userData || alreadyRegistered || isSubmittingRef.current) return;
    
    if (!accountabilityAccepted) {
      toast.error("Please acknowledge the scheduling policy.");
      return;
    }

    const baseFee = competition.entryFee || 0;
    const addOnFee = (competition.slug === 'orbitx_solar' && moonObservation) ? 20 : 0;
    const fee = baseFee + addOnFee;

    if (fee > 0) {
      // Paid event — route through Easebuzz
      await handlePaidRegistration();
    } else {
      // Free event — direct registration
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      try {
        await submitRegistration();
      } catch (err) {
        console.error("Registration Error:", err);
        toast.error("Failed to register. Please try again.");
      } finally {
        setIsSubmitting(false);
        isSubmittingRef.current = false;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="registration-page">
        <div className="loading-wrapper">
          <div className="loading-spinner"></div>
          <p>Encrypting Secure Connection...</p>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="registration-page">
        <div className="error-container">
          <h2>404 - Arena Not Found</h2>
          <p>The competition you are looking for does not exist or has been removed.</p>
          <button className="btn-dashboard-return" onClick={() => navigate('/competitions')}>
            Return to Arena
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page animate-in">
      <div className="registration-container">
        
        {/* Left Side: Competition Details */}
        <div className="event-details-sidebar">
          <img src={competition.image} alt={competition.title} className="event-hero-img" crossOrigin="anonymous" />
          <div className="event-sidebar-overlay"></div>
          
          <div className="event-sidebar-content">
            <div className="event-meta-badges">
              {competition.isFlagship && <span className="meta-badge" style={{ background: '#ef4444', color: '#fff', borderColor: '#fca5a5' }}>Flagship Event</span>}
              <span className="meta-badge">{competition.subtitle || "Competition"}</span>
              {competition.prizePool && (
                <span className="meta-badge prize">
                  <Trophy size={14} /> Pool: {competition.prizePool}
                </span>
              )}
              {competition.entryFee !== undefined && competition.entryFee > 0 && (
                <span className="meta-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                  <CreditCard size={14} /> Entry: ₹{competition.entryFee}
                </span>
              )}
            </div>
            
            <h1 style={{ marginTop: '1rem' }}>{competition.title}</h1>
            <p className="event-desc">{competition.description || "Prepare yourself for the ultimate challenge. Do you have what it takes?"}</p>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="registration-form-section">
          <h2 className="registration-title">Official Registration</h2>
          <p className="registration-subtitle">Verify your identity profile below to secure your spot.</p>

          <div className="scheduling-notice-box" style={{ 
            background: 'rgba(217, 255, 0, 0.05)', 
            border: '1px solid rgba(217, 255, 0, 0.2)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '1rem'
          }}>
            <div className="notice-icon" style={{ color: '#d9ff00' }}>
              <AlertTriangle size={24} />
            </div>
            <div className="notice-text">
              <h4 style={{ color: '#d9ff00', margin: '0 0 0.5rem 0', fontSize: '0.95rem', letterSpacing: '1px' }}>SCHEDULING ACCOUNTABILITY</h4>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                By registering, you acknowledge that Avishkar '26 follows a <strong>One User, One Event</strong> policy. If you register for overlapping events, the responsibility for scheduling conflicts rests solely with you. The organizing committee is not liable for participation overlaps.
              </p>
              <div className="notice-check" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input 
                  type="checkbox" 
                  id="acc-check"
                  checked={accountabilityAccepted}
                  onChange={(e) => setAccountabilityAccepted(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#d9ff00', cursor: 'pointer' }}
                />
                <label htmlFor="acc-check" style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  I accept full responsibility for my schedule.
                </label>
              </div>
            </div>
          </div>


          {userData && (
            <div className="user-prefill-card">
              <div className="prefill-header">
                <ShieldCheck size={16} /> DATA VERIFIED & SECURED
              </div>
              <div className="prefill-grid">
                <div className="prefill-item">
                  <label>First Name</label>
                  <span>{userData.firstName}</span>
                </div>
                <div className="prefill-item">
                  <label>Last Name</label>
                  <span>{userData.lastName}</span>
                </div>
                <div className="prefill-item full-width">
                  <label>College/University</label>
                  <span>{userData.college}</span>
                </div>
                <div className="prefill-item full-width" style={{ marginTop: '0.5rem' }}>
                  <label>Global Avishkar ID</label>
                  <span className="avr-highlight">{userData.avrId}</span>
                </div>
              </div>
            </div>
          )}

          {competition.slug === 'orbitx_solar' && !alreadyRegistered && (
            <div className="addon-selection-card">
              <div className="addon-header">
                <Moon size={18} /> EVENT ADD-ONS
              </div>
              <div className="addon-item">
                <div className="addon-info">
                  <span className="addon-name">Moon Observation</span>
                  <p className="addon-desc">Extended evening session with high-power lunar photography assistance.</p>
                </div>
                <div className="addon-action">
                  <span className="addon-price">+₹20</span>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={moonObservation} 
                      onChange={(e) => setMoonObservation(e.target.checked)} 
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            {alreadyRegistered ? (
               <div className="already-registered-banner">
                 <CheckCircle size={20} /> Identity confirmed. You are registered.
               </div>
            ) : (
              <button 
                className="btn-register-submit" 
                onClick={handleRegister} 
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? "Processing..." 
                  : (competition.entryFee || 0) + (competition.slug === 'orbitx_solar' && moonObservation ? 20 : 0) > 0 
                    ? `Pay ₹${(competition.entryFee || 0) + (competition.slug === 'orbitx_solar' && moonObservation ? 20 : 0)} & Register` 
                    : "Confirm Registration"
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Triumphant Success Overlay */}
      {isSuccess && (
        <div className="registration-success-overlay animate-in">
          <div className="success-icon">
            <CheckCircle size={80} color="#10b981" />
          </div>
          <h2>Access Granted.</h2>
          <p>
            Your identity <strong>{userData?.avrId}</strong> has been permanently inscribed into the registry for <strong>{competition.title}</strong>. 
            {transactionId && <><br />Transaction Ref: <strong style={{ fontFamily: 'monospace', color: '#a78bfa' }}>{transactionId}</strong></>}
            <br />Prepare your arsenal. We will see you at the arena.
          </p>
          <button className="btn-dashboard-return" onClick={() => navigate('/user/dashboard')}>
            View My Virtual Pass <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Registration;
