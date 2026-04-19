import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import Orb from '../../components/orbitx-orb/Orb';
import PageTransition from '../../components/background/PageTransition';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [selectedObsIndex, setSelectedObsIndex] = useState<number | null>(null);
  const [user] = useAuthState(auth);

  const observations = [
    {
      title: "Solar Spot Observation",
      description: "Observe the dynamic surface of the Sun through specially filtered telescopes. Witness fascinating sunspots—temporary dark patches caused by intense magnetic activity—giving you a rare glimpse into our star’s powerful behavior."
    },
    {
      title: "Moon Observation",
      description: "Experience the Moon like never before! Explore its craters, mountains, and vast plains in stunning detail through telescopes, revealing textures and features invisible to the naked eye."
    },
    {
      title: "Jupiter & Its Moons Observation",
      description: "Catch a glimpse of Jupiter, the king of planets, along with its brightest moons. Watch these moons shift positions in real time—but note, this observation is subject to clear sky and favorable climatic conditions.",
      isWeatherDependent: true
    }
  ];

  useEffect(() => {
    // Add class to body to remove global footer margin/styles for this page
    document.body.classList.add('orbitx-layout-active');
    
    // Set event date for Cosmic Window (April 23, 2026 - Solar Start at 2:00 PM)
    const eventDate = new Date('April 23, 2026 14:00:00').getTime();

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
          <Orb 
            hue={0} 
            hoverIntensity={0.5} 
            rotateOnHover={true} 
            autoCycle={true}
            logoSrc="/assets/logos/OrbitX/Logo-OrbitX.webp"
          />
        </div>

        {/* Main Content: Solar Spot Info */}
        <motion.div 
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
                LIVE EVENT • APRIL 23–24, 2026
              </div>

              <h1 className="hero-title">
                <span className="bold">Cosmic Window</span>
              </h1>

              <p className="hero-subtitle">
                Observe Solar Spots as well as beautiful craters of the moon from the heart of our campus!
              </p>
            </div>

            {/* Right Side: Details and Call to Action */}
            <div className="hero-right">
              <div className="hero-details-vertical">
                <div className="detail-item">
                  <span className="label">LOCATION</span>
                  <span className="value">Zeal Institute's Badminton Court</span>
                </div>
                <div className="detail-divider-horizontal" />
                <div className="detail-item">
                  <span className="label">TIME</span>
                  <div className="value-multi">
                    <span>SOLAR: 2:00 PM - 5:00 PM</span>
                    <br />
                    <span>MOON: 7:30 PM - 8:30 PM</span>
                  </div>
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

          {/* Observation Program Section - Centered Below */}
          <div className="observation-section">
            <div className="section-header">
              <span className="section-title">COSMIC OBSERVATION PROGRAM</span>
              <div className="section-line" />
            </div>
            
            <div className="observation-list">
              {observations.map((obs, index) => (
                <motion.div 
                  key={index}
                  className="observation-card"
                  onClick={() => setSelectedObsIndex(index)}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="obs-card-header">
                    <div className="obs-title-wrapper">
                      <span className="obs-title">{obs.title}</span>
                      {obs.isWeatherDependent && (
                        <span className="weather-tag small">NOTICE ATTACHED</span>
                      )}
                    </div>
                    <div className="obs-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </div>
                  </div>
                  <div className="obs-card-hint">EXPLORE DETAILS</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Observation Detail Overlay */}
        <AnimatePresence>
          {selectedObsIndex !== null && (
            <motion.div 
              className="observation-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div 
                className="overlay-backdrop"
                onClick={() => setSelectedObsIndex(null)}
              />
              
              <motion.div 
                className="overlay-container"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
              >
                <button className="close-overlay" onClick={() => setSelectedObsIndex(null)}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                <div className="overlay-content">
                  <div className="overlay-header">
                    <div className="obs-badge">OBSERVATION INTEL</div>
                    <h2 className="overlay-title">{observations[selectedObsIndex].title}</h2>
                    {observations[selectedObsIndex].isWeatherDependent && (
                      <div className="weather-notice">
                        <span className="notice-icon">!</span>
                        WEATHER DEPENDENT EVENT
                      </div>
                    )}
                  </div>
                  
                  <div className="overlay-body">
                    <div className="decoration-line-vertical" />
                    <p className="overlay-description">
                      {observations[selectedObsIndex].description}
                    </p>
                  </div>

                  <div className="overlay-footer">
                    <div className="cosmic-divider" />
                    <span className="footer-label">AVISHKAR '26 • ORBITX CLUB</span>
                  </div>
                </div>
              </motion.div>
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
        <div className="glass-grid-overlay" />
      </div>
    </PageTransition>
  );
};

export default OrbitX;
