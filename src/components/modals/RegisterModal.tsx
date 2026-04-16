import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { X, CheckCircle } from 'lucide-react';
import { useToast } from '../toast/Toast';
import Loader from '../loader/Loader';
import './RegisterModal.css';

interface RegisterModalProps {
  competition: {
    title: string;
    category: string;
    icon: string;
    handle: string;
  } | null;
  onClose: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ competition, onClose }) => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "user", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleRegister = async () => {
    if (!user || !competition) return;
    setSubmitting(true);
    
    // Safely collect data with fallbacks to avoid Firestore 'undefined' errors
    const regData = {
      uid: user.uid,
      userName: userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : user.displayName || 'Participant',
      userEmail: user.email || '',
      userPhone: userData?.phone || null,
      userAVR: userData?.avrId || 'TBD',
      userCollege: userData?.college || 'Other',
      competitionId: competition.title.toLowerCase().replace(/\s+/g, '-'),
      competitionHandle: competition.handle,
      eventName: competition.title,
      category: competition.category,
      registeredAt: serverTimestamp(),
      status: 'confirmed'
    };

    try {
      await addDoc(collection(db, "registrations"), regData);
      setComplete(true);
      toast.success(`Registered for ${competition.title}!`);
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Failed to register. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!competition) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-morphism animate-in" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        
        {loading ? (
          <div className="modal-loader-wrap">
            <Loader label="Preparing registration..." />
          </div>
        ) : complete ? (
          <div className="modal-success">
            <div className="success-icon-wrap">
              <CheckCircle size={60} color="#5227ff" />
            </div>
            <h2>Registration Successful!</h2>
            <p>You are now registered for <strong>{competition.title}</strong>.</p>
            <p className="success-sub">Show your AVR ID <strong>{userData?.avrId || 'TBD'}</strong> at the event desk.</p>
            <button className="finish-btn" onClick={onClose}>Done</button>
          </div>
        ) : !userData ? (
          <div className="modal-body text-center">
            <h3 className="modal-title">Profile Incomplete</h3>
            <p className="modal-tagline">You need to complete your Avishkar registration before entering competitions.</p>
            <button className="complete-registration-btn mt-30" onClick={() => navigate('/signup')}>
              Complete Profile
            </button>
          </div>
        ) : (
          <div className="modal-body">
            <div className="modal-header">
              <span className="modal-icon">{competition.icon}</span>
              <div>
                <h3 className="modal-title">{competition.title}</h3>
                <span className="modal-badge">{competition.category}</span>
              </div>
            </div>

            <div className="registration-info">
              <div className="info-row">
                <span className="label">Participant</span>
                <span className="value">{userData?.firstName || ''} {userData?.lastName || ''}</span>
              </div>
              <div className="info-row">
                <span className="label">College</span>
                <span className="value">{userData?.college || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">AVR ID</span>
                <span className="value highlight">{userData?.avrId || 'Pending'}</span>
              </div>
              <div className="info-row">
                <span className="label">Email</span>
                <span className="value">{user?.email || 'N/A'}</span>
              </div>
            </div>

            <p className="modal-disclaimer">
              By clicking complete, you agree to follow the event rules and guidelines.
            </p>

            <button 
              className="complete-registration-btn" 
              onClick={handleRegister}
              disabled={submitting}
            >
              {submitting ? "Processing..." : "Complete Registration"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterModal;
