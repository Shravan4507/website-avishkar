import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../toast/Toast';
import Loader from '../loader/Loader';
import './Login.css';

/**
 * Student Login (Google Only)
 * Rules:
 * - Google Sign-in ONLY.
 * - Checks 'user' collection.
 * - Role-separated from Admin dashboard.
 */
const Login: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsRedirecting(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Ensure this provider is Google (it is by handleGoogleLogin call)
      // Check if they exist as a User
      const userDoc = await getDoc(doc(db, "user", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data?.avrId) {
          toast.success('Welcome back to your dashboard!');
          navigate('/user/dashboard', { replace: true });
        } else {
          navigate('/signup', { replace: true });
        }
      } else {
        // New student account
        navigate('/signup', { replace: true });
      }
    } catch (error) {
      setIsRedirecting(false);
      toast.error('Google Sign-in failed.');
      console.error(error);
    }
  };

  if (isRedirecting) {
    return <Loader fullscreen label="Authenticating your student account..." />;
  }

  return (
    <div className="login-container">
      <div className="login-card animate-in">
        <h2 className="login-title">Join Avishkar '26</h2>
        <p className="login-subtitle">Student Portal • Exclusive Google Sign-in</p>
        
        <div className="auth-buttons">
          <button className="auth-btn google-btn dark-btn" onClick={handleGoogleLogin}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="auth-icon" />
            <span>Continue with Google</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
