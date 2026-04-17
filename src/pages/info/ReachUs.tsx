import React from 'react';
import './ReachUs.css';

const ReachUs: React.FC = () => {
  return (
    <div id="reach-us-root" className="reach-us-page">
      {/* Background Ambience */}
      <div className="bg-ambience">
        <div className="ambience-blob ambience-blob-1"></div>
        <div className="ambience-blob ambience-blob-2"></div>
      </div>

      <div className="reach-us-content">
        <header className="reach-us-header">
          <h1 className="reach-us-title">Reach Us</h1>
          <p className="reach-us-subtitle">
            Find your way to Zeal College of Engineering and Research, Pune. 
            We're excited to host you at Avishkar '26!
          </p>
        </header>

        <div className="map-showcase-container">
          <div className="glass-map-frame">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4234.65415410438!2d73.82795180343537!3d18.44789890460726!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2be933201c149%3A0x1c055d83993ff72b!2sZeal%20College%20of%20Engineering%20and%20Research!5e1!3m2!1sen!2sin!4v1775796297235!5m2!1sen!2sin" 
              className="google-map-iframe"
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Zeal College Map"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReachUs;
