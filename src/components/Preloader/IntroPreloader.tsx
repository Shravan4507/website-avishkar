import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './IntroPreloader.css';

const IntroPreloader: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    // Check if the intro has already been shown in this session
    const introShown = sessionStorage.getItem('avishkar_intro_shown');
    
    if (!introShown) {
      setIsVisible(true);
      // We don't set the flag yet; we wait for completion or timeout
    }
  }, []);

  const START_TIME = 0; // Start at 0 seconds
  const END_TIME = 4;   // Force end at 4 seconds (Trim the rest)

  const handleComplete = () => {
    if (videoEnded) return;
    setVideoEnded(true);
    setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('avishkar_intro_shown', 'true');
    }, 100); // Shorter delay for snappier zoom
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    if (video.currentTime >= END_TIME) {
      handleComplete();
    }
  };

  // Fallback timeout in case video fails to load or play
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        if (!videoEnded) {
          handleComplete();
        }
      }, 6000); // Max 6 seconds wait
      return () => clearTimeout(timer);
    }
  }, [isVisible, videoEnded]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 15, // <--- THE WINDOW EFFECT (Adjust to 20 or 30 for more intensity)
            transition: { duration: 1.2, ease: [0.7, 0, 0.2, 1] } 
          }}
        >
          <div className="video-container">
            <video
              autoPlay
              muted
              playsInline
              onEnded={handleComplete}
              onTimeUpdate={handleTimeUpdate}
              className="intro-video"
            >
              <source src={`${import.meta.env.BASE_URL}assets/intro.mp4#t=${START_TIME}`} type="video/mp4" />
              {/* Optional: Add low-res loading background or spinner if needed */}
            </video>
            
            {/* Dark gradient overlay to blend into the main site */}
            <div className="video-vignette"></div>
          </div>
          
          <motion.div 
            className="skip-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }} // Show skip button after 2 seconds
            onClick={handleComplete}
          >
            SKIP
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroPreloader;
