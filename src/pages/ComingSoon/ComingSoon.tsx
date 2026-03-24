import React from 'react';
import './ComingSoon.css';
import { Lock } from 'lucide-react';

interface ComingSoonProps {
  pageName: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ pageName }) => {
  return (
    <div className="coming-soon-wrapper">
      <div className="coming-soon-card">
        <div className="cs-icon-wrapper">
          <Lock size={48} className="cs-lock-icon" />
          <div className="cs-glow-orb"></div>
        </div>
        
        <h1 className="cs-title">
          <span className="cs-highlight">{pageName}</span> is Coming Soon
        </h1>
        
        <p className="cs-subtitle">
          Patience is a virtue, Avishkarian. Our core team is putting the final touches on this section. Check back shortly!
        </p>

        <div className="cs-progress-bar">
          <div className="cs-progress-fill"></div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
