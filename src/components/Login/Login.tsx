import React, { useState, useRef, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../toast/Toast';
import Loader from '../loader/Loader';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import './Login.css';

const avishkarLogo = `${import.meta.env.BASE_URL}assets/logos/avishkar-white.webp`;

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
  
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const slideOpacity = useTransform(x, [0, 220], [1, 0.2]);

  // True when viewport is wider than 768px (desktop)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth > 768);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragEnd = () => {
    if (x.get() > 180) {
      handleGoogleLogin();
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

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
        <img src={avishkarLogo} alt="Avishkar '26" className="login-logo" />
        <h2 className="login-title">Join Avishkar '26</h2>
        <p className="login-subtitle">Student Portal • Exclusive Google Sign-in</p>
        
        <div className="auth-buttons">
          {isDesktop ? (
            /* ── Desktop: full-width click button ── */
            <button
              className="auth-btn dark-btn google-btn"
              onClick={handleGoogleLogin}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="auth-icon"
              />
              Continue with Google
            </button>
          ) : (
            /* ── Mobile: slide-to-continue prank ── */
            <div className="slider-container" ref={constraintsRef}>
              <motion.div
                className="slider-text"
                style={{ opacity: slideOpacity }}
              >
                Slide to Continue
              </motion.div>
              <motion.div
                drag="x"
                dragConstraints={constraintsRef}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className="slider-thumb"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="auth-icon"
                />
              </motion.div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Login;
