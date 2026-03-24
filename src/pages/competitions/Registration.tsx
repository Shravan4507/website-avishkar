import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';
import { COMPETITIONS_DATA } from '../../data/competitions';
import type { Competition } from '../../data/competitions';
import { Trophy, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
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
            foundComp = compSnap.data() as Competition;
          }
        }

        if (foundComp) {
          setCompetition(foundComp);
          
          // 3. Check if already registered
          const q = query(
            collection(db, 'registrations'),
            where('userAVR', '==', uData.avrId),
            where('eventName', '==', foundComp.title)
          );
          const regSnap = await getDocs(q);
          if (!regSnap.empty) {
            setAlreadyRegistered(true);
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

  const handleRegister = async () => {
    if (!competition || !userData || alreadyRegistered || isSubmittingRef.current) return;
    
    // Synchronous lock to prevent React state batching race conditions
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      // Double check registry just before write to be absolutely certain
      const duplicateCheck = query(
        collection(db, 'registrations'),
        where('userAVR', '==', userData.avrId),
        where('eventName', '==', competition.title)
      );
      const snap = await getDocs(duplicateCheck);
      if (!snap.empty) {
        setAlreadyRegistered(true);
        setIsSuccess(true);
        return;
      }

      await addDoc(collection(db, 'registrations'), {
        eventName: competition.title,
        userEmail: userData.email,
        userName: `${userData.firstName} ${userData.lastName}`,
        userAVR: userData.avrId,
        category: competition.subtitle || 'General Event',
        registeredAt: serverTimestamp(),
        isAttended: false
      });

      setAlreadyRegistered(true);
      setIsSuccess(true);
    } catch (err) {
      console.error("Registration Error:", err);
      toast.error("Failed to register. Please try again.");
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
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
            </div>
            
            <h1 style={{ marginTop: '1rem' }}>{competition.title}</h1>
            <p className="event-desc">{competition.description || "Prepare yourself for the ultimate challenge. Do you have what it takes?"}</p>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="registration-form-section">
          <h2 className="registration-title">Official Registration</h2>
          <p className="registration-subtitle">Verify your identity profile below to secure your spot.</p>

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
                {isSubmitting ? "Locking in Matrix..." : "Confirm Registration"}
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
            Prepare your arsenal. We will see you at the arena.
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
