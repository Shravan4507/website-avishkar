import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './OrbitXOpening.css';

interface OrbitXOpeningProps {
  onComplete: () => void;
}

const OrbitXOpening: React.FC<OrbitXOpeningProps> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Automatically proceed after 100ms
    const timer = setTimeout(() => {
      startTransition();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const startTransition = () => {
    if (isExiting) return;
    setIsExiting(true);
    // Logo blurs out, then we notify parent
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  return (
    <div className={`orbitx-opening-wrapper ${isExiting ? 'exiting' : ''}`}>
      <motion.div 
        className="eclipse-splash"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="eclipse-container">
          <img src="/assets/logos/OrbitX/Logo-OrbitX.png" alt="OrbitX" className="opening-logo" />
        </div>
      </motion.div>
    </div>
  );
};

export default OrbitXOpening;
