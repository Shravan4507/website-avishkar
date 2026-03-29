import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import Orb from '../../components/orbitx-orb/Orb';
import PageTransition from '../../components/background/PageTransition';
import OrbitXOpening from '../../components/orbitx-opening/OrbitXOpening';
import OrbitXRegistrationModal from './OrbitXRegistrationModal';
import SEO from '../../components/seo/SEO';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import './OrbitX.css';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const OrbitX: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isOpening, setIsOpening] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [user] = useAuthState(auth);

  useEffect(() => {
    // Add class to body to remove global footer margin/styles for this page
    document.body.classList.add('orbitx-layout-active');
    
    // Set event date for SUNSPOTS (April 22, 2026)
    const eventDate = new Date('April 22, 2026 11:00:00').getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = eventDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => {
        clearInterval(timer);
        document.body.classList.remove('orbitx-layout-active');
    };
  }, []);

  useEffect(() => {
    const checkRegistration = async () => {
      if (!user) {
        setIsAlreadyRegistered(false);
        return;
      }
      try {
        const q = query(
          collection(db, "registrations"), 
          where("userId", "==", user.uid),
          where("competitionId", "==", "orbitx_solar"),
          limit(1)
        );
        const snap = await getDocs(q);
        setIsAlreadyRegistered(!snap.empty);
      } catch (err) {
        console.error("Error checking registration:", err);
      }
    };
    checkRegistration();
  }, [user]);

  const handleRegisterClick = () => {
    if (!user) {
      navigate('/login?redirect=/orbitx-zcoer');
      return;
    }
    if (isAlreadyRegistered) return;
    setIsModalOpen(true);
  };

  return (
    <PageTransition>
      <SEO 
        title="OrbitX Club | Solar Spot Observation - Avishkar '26"
        description="Join OrbitX Club for an exclusive Solar Spot Observation event. Experience the cosmos with professional solar equipment and expert guidance."
      />
      
      <div className="orbitx-page" style={{ backgroundColor: '#000' }}>
        {/* Background Orb - Fixed focal point throughout the page */}
        <div className="orbitx-orb-bg">
          <Orb hue={0} hoverIntensity={0.5} rotateOnHover={true} />
        </div>

        {/* Opening Scene: Logo + Solar Filter + Get Started */}
        <AnimatePresence mode="wait">
          {isOpening && (
            <OrbitXOpening key="opening" onComplete={() => setIsOpening(false)} />
          )}
        </AnimatePresence>

        {/* Main Content: Solar Spot Info */}
        <AnimatePresence>
          {!isOpening && (
            <motion.div 
              key="content"
              className="orbitx-content"
              initial={{ opacity: 0, filter: 'blur(20px)', scale: 0.95 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="orbitx-hero">
                {/* Left Side: Branding and Context */}
                <div className="hero-left">
                  <div className="event-badge">
                    <span className="badge-dot" />
                    LIVE EVENT • APRIL 22, 2026
                  </div>

                  <h1 className="hero-title">
                    <span className="bold">SUNSPOTS</span>
                  </h1>

                  <p className="hero-subtitle">
                    Experience the total solar eclipse from the heart of our campus.
                    A rare cosmic alignment bringing science and wonder together.
                  </p>
                </div>

                {/* Right Side: Details and Call to Action */}
                <div className="hero-right">
                  <div className="hero-details-vertical">
                    <div className="detail-item">
                      <span className="label">LOCATION</span>
                      <span className="value">Zeal Institute's Main Grounds</span>
                    </div>
                    <div className="detail-divider-horizontal" />
                    <div className="detail-item">
                      <span className="label">TIME</span>
                      <span className="value">11:00 AM - 2:00 PM</span>
                    </div>
                    <div className="detail-divider-horizontal" />
                    <div className="detail-item">
                      <span className="label">PRICE</span>
                      <span className="value">₹30</span>
                    </div>
                  </div>

                  <div className="hero-actions-vertical">
                    <button 
                      className={`primary-button ${isAlreadyRegistered ? 'registered' : ''}`} 
                      onClick={handleRegisterClick}
                      disabled={isAlreadyRegistered}
                    >
                      <span>{isAlreadyRegistered ? 'ALREADY SLOTTED' : 'RESERVE YOUR SPOT'}</span>
                    </button>

                    <div className="countdown-container">
                      <div className="timer-grid">
                        <div className="timer-block">
                          <span className="time-val">{timeLeft.days}</span>
                          <span className="time-label">DAYS</span>
                        </div>
                        <div className="timer-block">
                          <span className="time-val">{String(timeLeft.hours).padStart(2, '0')}</span>
                          <span className="time-label">HRS</span>
                        </div>
                        <div className="timer-block">
                          <span className="time-val">{String(timeLeft.minutes).padStart(2, '0')}</span>
                          <span className="time-label">MIN</span>
                        </div>
                        <div className="timer-block">
                          <span className="time-val">{String(timeLeft.seconds).padStart(2, '0')}</span>
                          <span className="time-label">SEC</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registration Modal Overlay */}
        <AnimatePresence>
          {isModalOpen && (
            <OrbitXRegistrationModal onClose={() => setIsModalOpen(false)} />
          )}
        </AnimatePresence>

        {/* Decorative elements */}
        {!isOpening && <div className="glass-grid-overlay" />}
      </div>
    </PageTransition>
  );
};

export default OrbitX;
